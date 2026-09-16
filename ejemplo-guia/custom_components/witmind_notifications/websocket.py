"""WebSocket API for the Witmind Notifications custom panel."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import CONDITION_TYPES, DATA_DISPATCHER, DATA_ENGINE, DATA_STORE, DOMAIN, EVENT_UPDATED
from .discovery import (
    async_list_notification_targets,
    async_list_temperature_sensors,
    target_matches_reference,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _float(value: Any, field: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as err:
        raise ValueError(f"{field} debe ser numérico") from err


def _int_range(value: Any, field: str, minimum: int, maximum: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError) as err:
        raise ValueError(f"{field} debe ser entero") from err
    if number < minimum or number > maximum:
        raise ValueError(f"{field} debe estar entre {minimum} y {maximum}")
    return number


def _normalize_rule(raw: dict[str, Any], rule_id: str | None = None, created_at: str | None = None) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("Regla inválida")

    name = str(raw.get("name") or "").strip()
    if not name:
        raise ValueError("El nombre de la regla es obligatorio")
    if len(name) > 120:
        raise ValueError("El nombre de la regla es demasiado largo")

    source_raw = raw.get("source") or {}
    entity_id = str(source_raw.get("entity_id") or "").strip()
    if not entity_id.startswith("sensor."):
        raise ValueError("Debe seleccionarse una entidad sensor.*")

    condition_raw = raw.get("condition") or {}
    kind = str(condition_raw.get("type") or "")
    if kind not in CONDITION_TYPES:
        raise ValueError("Tipo de condición no soportado")
    hysteresis = _float(condition_raw.get("hysteresis", 0), "Histéresis")
    if hysteresis < 0 or hysteresis > 50:
        raise ValueError("La histéresis debe estar entre 0 y 50")
    for_seconds = _int_range(condition_raw.get("for_seconds", 0), "Duración", 0, 86400)

    condition: dict[str, Any] = {
        "type": kind,
        "hysteresis": hysteresis,
        "for_seconds": for_seconds,
    }
    if kind in {"above", "below"}:
        condition["threshold"] = _float(condition_raw.get("threshold"), "Umbral")
    else:
        lower = _float(condition_raw.get("lower"), "Límite inferior")
        upper = _float(condition_raw.get("upper"), "Límite superior")
        if lower >= upper:
            raise ValueError("El límite inferior debe ser menor al superior")
        if kind == "outside" and hysteresis * 2 >= (upper - lower):
            raise ValueError("La histéresis es demasiado grande para ese rango")
        condition["lower"] = lower
        condition["upper"] = upper

    recipients_raw = raw.get("recipients")
    if not isinstance(recipients_raw, list) or not recipients_raw:
        raise ValueError("Selecciona al menos un dispositivo")
    if len(recipients_raw) > 25:
        raise ValueError("Máximo 25 destinatarios por regla")

    recipients: list[dict[str, Any]] = []
    for item in recipients_raw:
        if not isinstance(item, dict):
            continue
        notify_entity_id = item.get("notify_entity_id")
        legacy_service = item.get("legacy_service")
        if notify_entity_id and not str(notify_entity_id).startswith("notify."):
            raise ValueError("Destino notify inválido")
        if legacy_service and not str(legacy_service).startswith("notify."):
            raise ValueError("Acción notify heredada inválida")
        if not notify_entity_id and not legacy_service:
            raise ValueError("Un destinatario no tiene entidad ni acción notify")
        recipients.append(
            {
                "target_id": item.get("target_id") or item.get("key"),
                "identity_keys": list(item.get("identity_keys") or []),
                "device_id": item.get("device_id"),
                "notify_entity_id": notify_entity_id,
                "legacy_service": legacy_service,
                "name": str(item.get("name") or notify_entity_id or legacy_service),
                "custom_name": str(item.get("custom_name") or "").strip() or None,
            }
        )

    message_raw = raw.get("message") or {}
    title = str(message_raw.get("title") or name).strip()
    body = str(message_raw.get("body") or "").strip()
    if not body:
        raise ValueError("El mensaje es obligatorio")
    if len(title) > 240 or len(body) > 2000:
        raise ValueError("Título o mensaje demasiado largo")

    behavior_raw = raw.get("behavior") or {}
    notification_mode = str(behavior_raw.get("notification_mode") or "").strip()
    reminder_raw = behavior_raw.get("reminder_interval_seconds")
    if reminder_raw is None:
        reminder_raw = behavior_raw.get("cooldown_seconds", 0)

    # Compatibilidad v1.0.3–v1.0.5: una regla antigua con intervalo se conserva
    # como repetitiva. El antiguo "rearme" deja de ser una opción de usuario;
    # toda incidencia se rearma automáticamente al normalizarse.
    if not notification_mode:
        try:
            notification_mode = "repeat" if int(reminder_raw or 0) > 0 else "once"
        except (TypeError, ValueError):
            notification_mode = "once"
    if notification_mode not in {"once", "repeat", "daily"}:
        raise ValueError("Frecuencia de avisos no soportada")

    if notification_mode == "once":
        reminder_interval_seconds = 0
    elif notification_mode == "daily":
        reminder_interval_seconds = 86400
    else:
        reminder_interval_seconds = _int_range(
            reminder_raw or 1800, "Intervalo de recordatorio", 60, 604800
        )

    now = _now_iso()
    return {
        "id": rule_id or str(uuid4()),
        "name": name,
        "enabled": bool(raw.get("enabled", True)),
        "source": {
            "entity_id": entity_id,
            "display_name": str(source_raw.get("display_name") or entity_id),
            "area_name": source_raw.get("area_name"),
        },
        "condition": condition,
        "recipients": recipients,
        "message": {
            "title": title,
            "body": body,
            "recovery_title": str(message_raw.get("recovery_title") or "").strip() or None,
            "recovery_body": str(message_raw.get("recovery_body") or "").strip() or None,
        },
        "behavior": {
            "notification_mode": notification_mode,
            "reminder_interval_seconds": reminder_interval_seconds,
            "notify_recovery": bool(behavior_raw.get("notify_recovery", False)),
        },
        "created_at": created_at or now,
        "updated_at": now,
    }


def _data(hass: HomeAssistant) -> dict[str, Any]:
    return hass.data[DOMAIN]


def _current_targets(hass: HomeAssistant) -> list[dict[str, Any]]:
    store = _data(hass)[DATA_STORE]
    return store.decorate_targets(async_list_notification_targets(hass))


def _send_error(connection: websocket_api.ActiveConnection, msg: dict[str, Any], err: Exception) -> None:
    connection.send_error(msg["id"], "invalid_format", str(err))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/rules/list"})
@callback
def ws_rules_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    store = _data(hass)[DATA_STORE]
    targets = _current_targets(hass)
    rules = store.decorate_rules_with_targets(store.list_rules_with_runtime(), targets)
    connection.send_result(msg["id"], rules)


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/rules/create", vol.Required("rule"): dict}
)
async def ws_rules_create(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        rule = _normalize_rule(msg["rule"])
        store = _data(hass)[DATA_STORE]
        store.set_rule(rule)
        await store.async_save_now()
        await _data(hass)[DATA_ENGINE].async_rule_changed(rule["id"], reset_episode=True)
        connection.send_result(msg["id"], deepcopy(rule))
    except Exception as err:  # noqa: BLE001
        _send_error(connection, msg, err)


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/rules/update",
        vol.Required("rule_id"): str,
        vol.Required("rule"): dict,
    }
)
async def ws_rules_update(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    store = _data(hass)[DATA_STORE]
    existing = store.get_rule(msg["rule_id"])
    if not existing:
        connection.send_error(msg["id"], "not_found", "Regla no encontrada")
        return
    try:
        rule = _normalize_rule(
            msg["rule"],
            rule_id=msg["rule_id"],
            created_at=existing.get("created_at"),
        )
        store.set_rule(rule)
        await store.async_save_now()
        await _data(hass)[DATA_ENGINE].async_rule_changed(rule["id"], reset_episode=True)
        connection.send_result(msg["id"], deepcopy(rule))
    except Exception as err:  # noqa: BLE001
        _send_error(connection, msg, err)


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/rules/delete", vol.Required("rule_id"): str}
)
async def ws_rules_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    store = _data(hass)[DATA_STORE]
    if not store.get_rule(msg["rule_id"]):
        connection.send_error(msg["id"], "not_found", "Regla no encontrada")
        return
    store.delete_rule(msg["rule_id"])
    await store.async_save_now()
    await _data(hass)[DATA_ENGINE].async_rule_changed(msg["rule_id"], deleted=True)
    connection.send_result(msg["id"], {"deleted": True})


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/rules/toggle",
        vol.Required("rule_id"): str,
        vol.Required("enabled"): bool,
    }
)
async def ws_rules_toggle(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    store = _data(hass)[DATA_STORE]
    existing = store.get_rule(msg["rule_id"])
    if not existing:
        connection.send_error(msg["id"], "not_found", "Regla no encontrada")
        return
    existing["enabled"] = msg["enabled"]
    existing["updated_at"] = _now_iso()
    store.set_rule(existing)
    await store.async_save_now()
    await _data(hass)[DATA_ENGINE].async_rule_changed(existing["id"], reset_episode=True)
    connection.send_result(msg["id"], {"enabled": existing["enabled"]})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/sensors/list"})
@callback
def ws_sensors_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], async_list_temperature_sensors(hass))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/targets/list"})
@callback
def ws_targets_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], _current_targets(hass))


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/targets/alias/set",
        vol.Required("target_id"): str,
        vol.Optional("alias", default=""): str,
    }
)
async def ws_target_alias_set(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    store = _data(hass)[DATA_STORE]
    current = async_list_notification_targets(hass)
    target = next(
        (item for item in current if str(item.get("target_id") or "") == msg["target_id"]),
        None,
    )
    if not target:
        # A stale card can exist briefly if a phone was removed in Home Assistant.
        # Do not attach an alias to a guessed replacement.
        connection.send_error(msg["id"], "not_found", "El dispositivo ya no está disponible en Home Assistant")
        return
    try:
        store.set_device_alias(target, msg.get("alias"))
        await store.async_save_now()
        decorated = store.decorate_targets([target])[0]
        hass.bus.async_fire(EVENT_UPDATED, {"rule_id": None, "reason": "target_alias_changed"})
        connection.send_result(msg["id"], decorated)
    except Exception as err:  # noqa: BLE001
        _send_error(connection, msg, err)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/history/list",
        vol.Optional("limit", default=100): vol.All(int, vol.Range(min=1, max=1000)),
    }
)
@callback
def ws_history_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], _data(hass)[DATA_STORE].list_history(msg["limit"]))


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/test",
        vol.Required("recipient"): dict,
        vol.Optional("title", default="Prueba Witmind"): str,
        vol.Optional("message", default="Notificación de prueba enviada desde Home Assistant."): str,
    }
)
async def ws_test(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    recipient = msg["recipient"]
    try:
        used_target = await _data(hass)[DATA_DISPATCHER].async_send(
            recipient, msg["title"], msg["message"]
        )
        _data(hass)[DATA_STORE].add_history(
            {
                "timestamp": _now_iso(),
                "event_type": "test",
                "status": "sent",
                "rule_id": None,
                "rule_name": "Prueba manual",
                "sensor_entity_id": None,
                "sensor_name": None,
                "value": None,
                "recipient": recipient.get("name") or used_target,
                "target": used_target,
                "error": None,
            }
        )
        hass.bus.async_fire(EVENT_UPDATED, {"rule_id": None, "reason": "test_sent"})
        connection.send_result(msg["id"], {"sent": True, "target": used_target})
    except Exception as err:  # noqa: BLE001
        _data(hass)[DATA_STORE].add_history(
            {
                "timestamp": _now_iso(),
                "event_type": "test",
                "status": "error",
                "rule_id": None,
                "rule_name": "Prueba manual",
                "sensor_entity_id": None,
                "sensor_name": None,
                "value": None,
                "recipient": recipient.get("name") or "Destino",
                "target": recipient.get("notify_entity_id") or recipient.get("legacy_service"),
                "error": str(err),
            }
        )
        hass.bus.async_fire(EVENT_UPDATED, {"rule_id": None, "reason": "test_error"})
        connection.send_error(msg["id"], "send_failed", str(err))


def async_register_websocket(hass: HomeAssistant) -> None:
    """Register all panel API commands."""
    for command in (
        ws_rules_list,
        ws_rules_create,
        ws_rules_update,
        ws_rules_delete,
        ws_rules_toggle,
        ws_sensors_list,
        ws_targets_list,
        ws_target_alias_set,
        ws_history_list,
        ws_test,
    ):
        websocket_api.async_register_command(hass, command)
