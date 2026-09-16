"""Rule engine for Witmind Notifications."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from string import Formatter
from typing import Any

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState, Event, HomeAssistant, callback
from homeassistant.helpers.event import (
    async_call_later,
    async_track_state_change_event,
    async_track_time_interval,
)

from .const import EVENT_UPDATED
from .dispatcher import NotificationDispatcher
from .storage import WitmindNotificationStore

DELIVERY_RETRY_SECONDS = 60
WATCHDOG_INTERVAL_SECONDS = 1


class _SafeFormatMap(dict[str, Any]):
    def __missing__(self, key: str) -> str:
        return "{" + key + "}"


class NotificationRuleEngine:
    """Evaluate persisted sensor rules independently from the browser panel."""

    def __init__(
        self,
        hass: HomeAssistant,
        store: WitmindNotificationStore,
        dispatcher: NotificationDispatcher,
    ) -> None:
        self.hass = hass
        self.store = store
        self.dispatcher = dispatcher
        self._unsub_states = None
        self._pending_timers: dict[str, Any] = {}
        self._reminder_timers: dict[str, Any] = {}
        self._retry_timers: dict[str, Any] = {}
        self._unsub_watchdog = None
        self._due_inflight: set[str] = set()

    async def async_start(self) -> None:
        """Start subscriptions and evaluate current state after HA startup."""
        self.async_refresh_subscription()
        if self._unsub_watchdog is None:
            self._unsub_watchdog = async_track_time_interval(
                self.hass,
                self._handle_watchdog_tick,
                timedelta(seconds=WATCHDOG_INTERVAL_SECONDS),
            )
        if self.hass.state is CoreState.running:
            self.hass.async_create_task(self.async_evaluate_all(initial=True))
        else:
            self.hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, self._handle_started)

    @callback
    def _handle_started(self, _event: Event) -> None:
        self.hass.async_create_task(self.async_evaluate_all(initial=True))

    @callback
    def async_refresh_subscription(self) -> None:
        """Rebuild the tracked entity subscription after rule CRUD."""
        if self._unsub_states:
            self._unsub_states()
            self._unsub_states = None

        entities = sorted(
            {
                rule.get("source", {}).get("entity_id")
                for rule in self.store.list_rules()
                if rule.get("enabled", True) and rule.get("source", {}).get("entity_id")
            }
        )
        if entities:
            self._unsub_states = async_track_state_change_event(
                self.hass, entities, self._handle_state_event
            )

    @callback
    def _handle_state_event(self, event: Event) -> None:
        entity_id = event.data.get("entity_id")
        if not entity_id:
            return
        for rule in self.store.list_rules():
            if not rule.get("enabled", True):
                continue
            if rule.get("source", {}).get("entity_id") == entity_id:
                self.hass.async_create_task(self.async_evaluate_rule(rule["id"]))

    @callback
    def _handle_watchdog_tick(self, _now: datetime) -> None:
        """Guarantee that due deadlines are executed even if a delayed callback is missed.

        The UI countdown is derived from persisted UTC deadlines. In earlier
        versions a lost ``async_call_later`` callback could therefore show 0:00
        forever although the backend never entered the send path. This watchdog
        makes the stored deadline authoritative and independently completes due
        pending alerts, retries and reminders.
        """
        self.hass.async_create_task(self._async_watchdog())

    async def _async_watchdog(self) -> None:
        now = datetime.now(timezone.utc)
        for rule in self.store.list_rules():
            rule_id = rule.get("id")
            if not rule_id or not rule.get("enabled", True):
                continue
            runtime = self.store.get_runtime(rule_id)
            if runtime.get("sending") or rule_id in self._due_inflight:
                continue

            pending_until = self._parse_deadline(runtime.get("pending_until"))
            if runtime.get("pending") and pending_until and pending_until <= now:
                self._cancel_pending_timer(rule_id)
                self.hass.async_create_task(self._async_finish_pending_once(rule_id))
                continue

            retry_at = self._parse_deadline(runtime.get("retry_at"))
            if retry_at and retry_at <= now:
                kind = str(runtime.get("retry_kind") or "alert")
                self._cancel_retry_timer(rule_id)
                self.hass.async_create_task(self._async_retry_delivery_once(rule_id, kind))
                continue

            reminder_at = self._parse_deadline(runtime.get("next_reminder_at"))
            if runtime.get("active") and reminder_at and reminder_at <= now:
                self._cancel_reminder_timer(rule_id)
                self.hass.async_create_task(self._async_send_reminder_once(rule_id))

    @staticmethod
    def _parse_deadline(value: Any) -> datetime | None:
        if not value:
            return None
        try:
            parsed = datetime.fromisoformat(str(value))
        except (TypeError, ValueError):
            return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)

    async def _run_due_once(self, rule_id: str, operation: Any) -> None:
        if rule_id in self._due_inflight:
            return
        self._due_inflight.add(rule_id)
        try:
            await operation()
        finally:
            self._due_inflight.discard(rule_id)

    async def _async_finish_pending_once(self, rule_id: str) -> None:
        await self._run_due_once(rule_id, lambda: self._async_finish_pending(rule_id))

    async def _async_send_reminder_once(self, rule_id: str) -> None:
        await self._run_due_once(rule_id, lambda: self._async_send_reminder(rule_id))

    async def _async_retry_delivery_once(self, rule_id: str, kind: str) -> None:
        await self._run_due_once(
            rule_id, lambda: self._async_retry_delivery(rule_id, kind)
        )

    async def async_rule_changed(
        self,
        rule_id: str,
        deleted: bool = False,
        reset_episode: bool = False,
    ) -> None:
        """Apply a create/update/delete/toggle immediately."""
        self._cancel_all_timers(rule_id)
        self.async_refresh_subscription()
        if deleted:
            self._emit_update(rule_id, "deleted")
            return

        rule = self.store.get_rule(rule_id)
        if reset_episode:
            # Editing starts a new episode. A previous successful send is kept as
            # audit metadata only; it never delays the first send of the new episode.
            self.store.update_runtime(
                rule_id,
                active=False,
                pending=False,
                pending_since=None,
                pending_until=None,
                sending=False,
                next_reminder_at=None,
                retry_at=None,
                retry_kind=None,
                rearm_after=None,
                last_error=None,
            )

        if not rule or not rule.get("enabled", True):
            self.store.update_runtime(
                rule_id,
                active=False,
                pending=False,
                pending_since=None,
                pending_until=None,
                sending=False,
                next_reminder_at=None,
                retry_at=None,
                retry_kind=None,
                last_error=None,
            )
            self._emit_update(rule_id, "disabled")
            return

        await self.async_evaluate_rule(rule_id, initial=True)
        self._emit_update(rule_id, "rule_changed")

    async def async_evaluate_all(self, initial: bool = False) -> None:
        for rule in self.store.list_rules():
            if rule.get("enabled", True):
                await self.async_evaluate_rule(rule["id"], initial=initial)

    async def async_evaluate_rule(self, rule_id: str, initial: bool = False) -> None:
        rule = self.store.get_rule(rule_id)
        if not rule or not rule.get("enabled", True):
            self._cancel_all_timers(rule_id)
            return

        entity_id = rule["source"]["entity_id"]
        state = self.hass.states.get(entity_id)
        if not state or state.state in {"unknown", "unavailable", "none", "None", ""}:
            previous = self.store.get_runtime(rule_id)
            self.store.update_runtime(
                rule_id,
                last_error="Sensor no disponible",
                last_value=None,
                pending=False,
                pending_since=None,
                pending_until=None,
                sending=False,
                next_reminder_at=None,
                retry_at=None,
                retry_kind=None,
            )
            self._cancel_all_timers(rule_id)
            if previous.get("last_error") != "Sensor no disponible" or previous.get("pending"):
                self._emit_update(rule_id, "sensor_unavailable")
            return

        try:
            value = float(state.state)
        except (TypeError, ValueError):
            previous = self.store.get_runtime(rule_id)
            error = f"Valor no numérico: {state.state}"
            self.store.update_runtime(
                rule_id,
                last_error=error,
                last_value=state.state,
                pending=False,
                pending_since=None,
                pending_until=None,
                sending=False,
                next_reminder_at=None,
                retry_at=None,
                retry_kind=None,
            )
            self._cancel_all_timers(rule_id)
            if previous.get("last_error") != error or previous.get("pending"):
                self._emit_update(rule_id, "sensor_invalid")
            return

        runtime = self.store.get_runtime(rule_id)
        self.store.update_runtime(rule_id, last_value=value)

        # Do not start a second delivery while a provider call is still running.
        if runtime.get("sending"):
            return

        if runtime.get("active"):
            if self._is_recovered(value, rule):
                self._cancel_reminder_timer(rule_id)
                self._cancel_retry_timer(rule_id)
                now = self._now_iso()
                self.store.update_runtime(
                    rule_id,
                    active=False,
                    pending=False,
                    pending_since=None,
                    pending_until=None,
                    sending=False,
                    next_reminder_at=None,
                    retry_at=None,
                    retry_kind=None,
                    rearm_after=None,
                    last_recovery=now,
                    last_error=None,
                )
                if rule.get("behavior", {}).get("notify_recovery", True) and not initial:
                    await self._send_recovery(rule, value, state)
                self._emit_update(rule_id, "recovered")
                return

            # La incidencia permanece activa hasta cruzar el margen de histéresis.
            # La frecuencia de avisos solo decide si se repite mientras esa MISMA
            # incidencia siga activa; no existe un segundo temporizador de rearme.
            self._ensure_reminder_timer(rule_id, rule, runtime)
            return

        # El rearme es automático al normalizarse. Limpiamos cualquier bloqueo
        # persistido por versiones anteriores y evaluamos normalmente.
        if runtime.get("rearm_after"):
            self.store.update_runtime(rule_id, rearm_after=None)
            runtime = self.store.get_runtime(rule_id)
            self._emit_update(rule_id, "rearmed")

        if not self._condition_matches(value, rule):
            was_pending = bool(runtime.get("pending") or rule_id in self._pending_timers)
            had_retry = rule_id in self._retry_timers
            self._cancel_pending_timer(rule_id)
            self._cancel_retry_timer(rule_id)
            self.store.update_runtime(
                rule_id,
                pending=False,
                pending_since=None,
                pending_until=None,
                retry_at=None,
                retry_kind=None,
                last_error=None if had_retry else runtime.get("last_error"),
            )
            if was_pending:
                self._emit_update(rule_id, "pending_cancelled")
            return

        if rule_id in self._pending_timers or rule_id in self._retry_timers:
            return

        # The first alert is delayed ONLY by the dwell/"Durante" setting. The
        # reminder interval never postpones a first delivery.
        delay = max(0.0, float(rule.get("condition", {}).get("for_seconds", 0) or 0))
        if delay <= 0 and not initial:
            await self._activate(rule, value, state)
            return

        # Do not fire immediately just because HA restarted while a condition was
        # already true. With no dwell configured, use a one-second startup guard.
        delay = max(delay, 1.0 if initial else 0.0)
        now = datetime.now(timezone.utc)
        pending_until = (now + timedelta(seconds=delay)).isoformat()
        self.store.update_runtime(
            rule_id,
            pending=True,
            pending_since=now.isoformat(),
            pending_until=pending_until,
            last_error=None,
        )
        self._emit_update(rule_id, "pending_started")
        self._pending_timers[rule_id] = async_call_later(
            self.hass,
            delay,
            lambda _now: self._pending_elapsed(rule_id),
        )

    @callback
    def _pending_elapsed(self, rule_id: str) -> None:
        self._pending_timers.pop(rule_id, None)
        self.hass.async_create_task(self._async_finish_pending_once(rule_id))

    async def _async_finish_pending(self, rule_id: str) -> None:
        rule = self.store.get_rule(rule_id)
        if not rule or not rule.get("enabled", True):
            return
        state = self.hass.states.get(rule["source"]["entity_id"])
        if not state:
            return
        try:
            value = float(state.state)
        except (TypeError, ValueError):
            return

        if not self._condition_matches(value, rule):
            self.store.update_runtime(
                rule_id,
                pending=False,
                pending_since=None,
                pending_until=None,
            )
            self._emit_update(rule_id, "pending_cancelled")
            return

        await self._activate(rule, value, state)

    async def _activate(self, rule: dict[str, Any], value: float, state: Any) -> None:
        """Send the first alert for an episode."""
        rule_id = rule["id"]
        self._cancel_pending_timer(rule_id)
        self._cancel_retry_timer(rule_id)
        attempted_at = self._now_iso()
        self.store.update_runtime(
            rule_id,
            pending=False,
            pending_since=None,
            pending_until=None,
            sending=True,
            retry_at=None,
            retry_kind=None,
            last_attempt=attempted_at,
            last_error=None,
        )
        self._emit_update(rule_id, "alert_sending")

        context = self._template_context(rule, value, state)
        title = self._format(rule.get("message", {}).get("title") or rule["name"], context)
        body = self._format(
            rule.get("message", {}).get("body") or "{sensor}: {value} {unit}", context
        )
        sent, errors = await self._send_to_recipients(rule, title, body, value, "alert")

        if sent > 0:
            now = self._now_iso()
            self.store.update_runtime(
                rule_id,
                active=True,
                sending=False,
                last_sent=now,
                last_error="; ".join(errors) if errors else None,
                retry_at=None,
                retry_kind=None,
            )
            runtime = self.store.get_runtime(rule_id)
            self._ensure_reminder_timer(rule_id, rule, runtime, restart=True)
            self._emit_update(rule_id, "alert_sent")
            return

        error_text = "; ".join(errors) if errors else "No se pudo entregar la notificación"
        self.store.update_runtime(
            rule_id,
            active=False,
            sending=False,
            last_error=error_text,
        )
        self._schedule_retry(rule_id, "alert")
        self._emit_update(rule_id, "alert_failed")

    async def _send_recovery(self, rule: dict[str, Any], value: float, state: Any) -> None:
        context = self._template_context(rule, value, state)
        title = self._format(
            rule.get("message", {}).get("recovery_title") or "{rule} · normalizado",
            context,
        )
        body = self._format(
            rule.get("message", {}).get("recovery_body")
            or "{sensor} volvió a un rango normal: {value} {unit}.",
            context,
        )
        sent, errors = await self._send_to_recipients(
            rule, title, body, value, "recovery"
        )
        if errors:
            self.store.update_runtime(rule["id"], last_error="; ".join(errors))
        if sent:
            self._emit_update(rule["id"], "recovery_sent")
        else:
            self._emit_update(rule["id"], "recovery_failed")

    async def _async_send_reminder(self, rule_id: str) -> None:
        self._reminder_timers.pop(rule_id, None)
        rule = self.store.get_rule(rule_id)
        if not rule or not rule.get("enabled", True):
            return
        runtime = self.store.get_runtime(rule_id)
        if not runtime.get("active") or runtime.get("sending"):
            return

        state = self.hass.states.get(rule["source"]["entity_id"])
        if not state:
            return
        try:
            value = float(state.state)
        except (TypeError, ValueError):
            return

        if self._is_recovered(value, rule):
            await self.async_evaluate_rule(rule_id)
            return
        # Si todavía no cruzó el margen de recuperación, sigue siendo la misma
        # incidencia y puede recibir recordatorios según su política.

        attempted_at = self._now_iso()
        self.store.update_runtime(
            rule_id,
            sending=True,
            next_reminder_at=None,
            retry_at=None,
            retry_kind=None,
            last_attempt=attempted_at,
            last_error=None,
        )
        self._emit_update(rule_id, "reminder_sending")

        context = self._template_context(rule, value, state)
        title = self._format(rule.get("message", {}).get("title") or rule["name"], context)
        body = self._format(
            rule.get("message", {}).get("body") or "{sensor}: {value} {unit}", context
        )
        sent, errors = await self._send_to_recipients(
            rule, title, body, value, "reminder"
        )

        if sent > 0:
            now = self._now_iso()
            self.store.update_runtime(
                rule_id,
                sending=False,
                last_sent=now,
                last_error="; ".join(errors) if errors else None,
            )
            self._ensure_reminder_timer(
                rule_id, rule, self.store.get_runtime(rule_id), restart=True
            )
            self._emit_update(rule_id, "reminder_sent")
            return

        error_text = "; ".join(errors) if errors else "No se pudo entregar el recordatorio"
        self.store.update_runtime(rule_id, sending=False, last_error=error_text)
        self._schedule_retry(rule_id, "reminder")
        self._emit_update(rule_id, "reminder_failed")

    async def _send_to_recipients(
        self,
        rule: dict[str, Any],
        title: str,
        body: str,
        value: float,
        event_type: str,
    ) -> tuple[int, list[str]]:
        errors: list[str] = []
        sent = 0
        for recipient in rule.get("recipients", []):
            resolved_recipient = self.dispatcher.resolve_recipient(recipient)
            target_label = (
                recipient.get("custom_name")
                or resolved_recipient.get("name")
                or recipient.get("name")
                or resolved_recipient.get("notify_entity_id")
                or resolved_recipient.get("legacy_service")
                or "Destino"
            )
            try:
                used_target = await self.dispatcher.async_send(resolved_recipient, title, body)
                sent += 1
                self.store.add_history(
                    {
                        "timestamp": self._now_iso(),
                        "event_type": event_type,
                        "status": "sent",
                        "rule_id": rule["id"],
                        "rule_name": rule["name"],
                        "sensor_entity_id": rule["source"]["entity_id"],
                        "sensor_name": rule["source"].get("display_name"),
                        "value": value,
                        "recipient": target_label,
                        "target": used_target,
                        "error": None,
                    }
                )
            except Exception as err:  # noqa: BLE001 - errors are recorded per recipient
                errors.append(f"{target_label}: {err}")
                self.store.add_history(
                    {
                        "timestamp": self._now_iso(),
                        "event_type": event_type,
                        "status": "error",
                        "rule_id": rule["id"],
                        "rule_name": rule["name"],
                        "sensor_entity_id": rule["source"]["entity_id"],
                        "sensor_name": rule["source"].get("display_name"),
                        "value": value,
                        "recipient": target_label,
                        "target": resolved_recipient.get("notify_entity_id")
                        or resolved_recipient.get("legacy_service")
                        or recipient.get("notify_entity_id")
                        or recipient.get("legacy_service"),
                        "error": str(err),
                    }
                )
        return sent, errors

    def _ensure_reminder_timer(
        self,
        rule_id: str,
        rule: dict[str, Any],
        runtime: dict[str, Any],
        *,
        restart: bool = False,
    ) -> None:
        interval = self._reminder_interval(rule)
        if interval <= 0 or not runtime.get("active"):
            self._cancel_reminder_timer(rule_id)
            self.store.update_runtime(rule_id, next_reminder_at=None)
            return
        if rule_id in self._retry_timers or runtime.get("sending"):
            return
        if rule_id in self._reminder_timers and not restart:
            return
        if restart:
            self._cancel_reminder_timer(rule_id)

        delay = float(interval)
        last_sent = runtime.get("last_sent")
        if last_sent and not restart:
            try:
                last = datetime.fromisoformat(last_sent)
                if last.tzinfo is None:
                    last = last.replace(tzinfo=timezone.utc)
                elapsed = (datetime.now(timezone.utc) - last).total_seconds()
                delay = max(1.0, interval - elapsed)
            except (TypeError, ValueError):
                delay = float(interval)

        due = datetime.now(timezone.utc) + timedelta(seconds=delay)
        self.store.update_runtime(rule_id, next_reminder_at=due.isoformat())
        self._reminder_timers[rule_id] = async_call_later(
            self.hass,
            delay,
            lambda _now: self._reminder_elapsed(rule_id),
        )
        self._emit_update(rule_id, "reminder_scheduled")

    @callback
    def _reminder_elapsed(self, rule_id: str) -> None:
        self._reminder_timers.pop(rule_id, None)
        self.hass.async_create_task(self._async_send_reminder_once(rule_id))

    def _schedule_retry(self, rule_id: str, kind: str) -> None:
        self._cancel_retry_timer(rule_id)
        retry_at = datetime.now(timezone.utc) + timedelta(seconds=DELIVERY_RETRY_SECONDS)
        self.store.update_runtime(
            rule_id,
            retry_at=retry_at.isoformat(),
            retry_kind=kind,
            next_reminder_at=None if kind == "reminder" else self.store.get_runtime(rule_id).get("next_reminder_at"),
        )
        self._retry_timers[rule_id] = async_call_later(
            self.hass,
            DELIVERY_RETRY_SECONDS,
            lambda _now: self._retry_elapsed(rule_id, kind),
        )

    @callback
    def _retry_elapsed(self, rule_id: str, kind: str) -> None:
        self._retry_timers.pop(rule_id, None)
        self.hass.async_create_task(self._async_retry_delivery_once(rule_id, kind))

    async def _async_retry_delivery(self, rule_id: str, kind: str) -> None:
        rule = self.store.get_rule(rule_id)
        if not rule or not rule.get("enabled", True):
            return
        state = self.hass.states.get(rule["source"]["entity_id"])
        if not state:
            return
        try:
            value = float(state.state)
        except (TypeError, ValueError):
            return

        runtime = self.store.get_runtime(rule_id)
        self.store.update_runtime(rule_id, retry_at=None, retry_kind=None)
        if kind == "reminder":
            if runtime.get("active") and not self._is_recovered(value, rule):
                await self._async_send_reminder(rule_id)
            return

        if runtime.get("active"):
            return
        if self._condition_matches(value, rule):
            await self._activate(rule, value, state)

    @staticmethod
    def _reminder_interval(rule: dict[str, Any]) -> int:
        behavior = rule.get("behavior", {})
        mode = str(behavior.get("notification_mode") or "").strip()
        raw = behavior.get("reminder_interval_seconds")
        if raw is None:
            raw = behavior.get("cooldown_seconds", 0)

        # Compatibilidad con reglas anteriores: un intervalo antiguo implica
        # "repeat". Los modos nuevos son deliberadamente simples.
        if not mode:
            try:
                mode = "repeat" if int(raw or 0) > 0 else "once"
            except (TypeError, ValueError):
                mode = "once"
        if mode == "once":
            return 0
        if mode == "daily":
            return 86400
        try:
            return max(60, int(raw or 1800))
        except (TypeError, ValueError):
            return 1800

    @staticmethod
    def _condition_matches(value: float, rule: dict[str, Any]) -> bool:
        condition = rule["condition"]
        kind = condition["type"]
        if kind == "above":
            return value >= float(condition["threshold"])
        if kind == "below":
            return value <= float(condition["threshold"])
        lower = float(condition["lower"])
        upper = float(condition["upper"])
        if kind == "outside":
            return value < lower or value > upper
        return lower <= value <= upper

    @staticmethod
    def _is_recovered(value: float, rule: dict[str, Any]) -> bool:
        condition = rule["condition"]
        kind = condition["type"]
        hysteresis = max(0.0, float(condition.get("hysteresis", 0) or 0))
        if kind == "above":
            return value <= float(condition["threshold"]) - hysteresis
        if kind == "below":
            return value >= float(condition["threshold"]) + hysteresis
        lower = float(condition["lower"])
        upper = float(condition["upper"])
        if kind == "outside":
            return lower + hysteresis <= value <= upper - hysteresis
        return value < lower - hysteresis or value > upper + hysteresis

    def _template_context(self, rule: dict[str, Any], value: float, state: Any) -> _SafeFormatMap:
        source = rule["source"]
        condition = rule["condition"]
        friendly = state.attributes.get("friendly_name") if state else None
        sensor_name = source.get("display_name") or friendly or source["entity_id"]
        unit = (state.attributes.get("unit_of_measurement") if state else None) or "°C"
        threshold = condition.get("threshold")
        if threshold is None and condition.get("lower") is not None:
            threshold = f"{condition.get('lower')}–{condition.get('upper')}"
        return _SafeFormatMap(
            value=f"{value:g}",
            unit=unit,
            sensor=sensor_name,
            area=source.get("area_name") or "",
            threshold=threshold if threshold is not None else "",
            lower=condition.get("lower", ""),
            upper=condition.get("upper", ""),
            time=datetime.now().astimezone().strftime("%H:%M"),
            rule=rule.get("name", "Alerta"),
            entity_id=source["entity_id"],
        )

    @staticmethod
    def _format(template: str, context: _SafeFormatMap) -> str:
        try:
            list(Formatter().parse(template))
            return template.format_map(context)
        except (ValueError, KeyError):
            return template

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    @callback
    def _emit_update(self, rule_id: str | None, reason: str) -> None:
        """Notify open custom panels about relevant backend state changes."""
        self.hass.bus.async_fire(
            EVENT_UPDATED,
            {"rule_id": rule_id, "reason": reason},
        )

    @callback
    def _cancel_pending_timer(self, rule_id: str) -> None:
        cancel = self._pending_timers.pop(rule_id, None)
        if cancel:
            cancel()

    @callback
    def _cancel_reminder_timer(self, rule_id: str) -> None:
        cancel = self._reminder_timers.pop(rule_id, None)
        if cancel:
            cancel()

    @callback
    def _cancel_retry_timer(self, rule_id: str) -> None:
        cancel = self._retry_timers.pop(rule_id, None)
        if cancel:
            cancel()

    @callback
    def _cancel_all_timers(self, rule_id: str) -> None:
        self._cancel_pending_timer(rule_id)
        self._cancel_reminder_timer(rule_id)
        self._cancel_retry_timer(rule_id)
