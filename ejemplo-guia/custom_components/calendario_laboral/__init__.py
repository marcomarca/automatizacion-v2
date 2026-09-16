"""Calendario laboral persistente para Home Assistant / Witmind."""

from __future__ import annotations

import asyncio
from copy import deepcopy
from datetime import date
import logging
from typing import Any
from uuid import uuid4

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.const import STATE_OFF, STATE_ON
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType
from homeassistant.util import dt as dt_util

DOMAIN = "calendario_laboral"
ENTITY_ID = "binary_sensor.dia_no_laborable"
EVENT_UPDATED = "calendario_laboral_updated"
STORAGE_VERSION = 1
STORAGE_KEY = DOMAIN

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)

_LOGGER = logging.getLogger(__name__)

DEFAULT_HOLIDAYS: list[dict[str, Any]] = [
    {"id": "holiday-2026-01-01", "date": "2026-01-01", "name": "Año Nuevo", "description": "", "active": True},
    {"id": "holiday-2026-01-02", "date": "2026-01-02", "name": "Feriado adicional de Año Nuevo", "description": "", "active": True},
    {"id": "holiday-2026-01-23", "date": "2026-01-23", "name": "Estado Plurinacional - feriado trasladado", "description": "", "active": True},
    {"id": "holiday-2026-02-16", "date": "2026-02-16", "name": "Carnaval", "description": "", "active": True},
    {"id": "holiday-2026-02-17", "date": "2026-02-17", "name": "Carnaval", "description": "", "active": True},
    {"id": "holiday-2026-04-03", "date": "2026-04-03", "name": "Viernes Santo", "description": "", "active": True},
    {"id": "holiday-2026-05-01", "date": "2026-05-01", "name": "Día del Trabajo", "description": "", "active": True},
    {"id": "holiday-2026-06-04", "date": "2026-06-04", "name": "Corpus Christi", "description": "", "active": True},
    {"id": "holiday-2026-06-05", "date": "2026-06-05", "name": "Feriado adicional 2026", "description": "", "active": True},
    {"id": "holiday-2026-06-22", "date": "2026-06-22", "name": "Año Nuevo Andino Amazónico Chaqueño - feriado trasladado", "description": "", "active": True},
    {"id": "holiday-2026-07-16", "date": "2026-07-16", "name": "Aniversario / Grito Libertario de La Paz", "description": "", "active": True},
    {"id": "holiday-2026-08-06", "date": "2026-08-06", "name": "Independencia de Bolivia", "description": "", "active": True},
    {"id": "holiday-2026-08-07", "date": "2026-08-07", "name": "Feriado adicional 2026", "description": "", "active": True},
    {"id": "holiday-2026-11-02", "date": "2026-11-02", "name": "Todos los Difuntos", "description": "", "active": True},
    {"id": "holiday-2026-12-25", "date": "2026-12-25", "name": "Navidad", "description": "", "active": True},
]

DATE_SCHEMA = vol.All(str, vol.Match(r"^\d{4}-\d{2}-\d{2}$"))
NAME_SCHEMA = vol.All(str, vol.Strip, vol.Length(min=1, max=120))
DESCRIPTION_SCHEMA = vol.All(str, vol.Strip, vol.Length(max=500))
RECORD_ID_SCHEMA = vol.All(str, vol.Strip, vol.Length(min=1, max=128))


class CalendarError(ValueError):
    """Error de validación del calendario."""


class WorkCalendarManager:
    """Gestiona almacenamiento, CRUD y el sensor central."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.store = Store[dict[str, Any]](hass, STORAGE_VERSION, STORAGE_KEY)
        self._holidays: list[dict[str, Any]] = []
        self._unsub_midnight = None
        self._lock = asyncio.Lock()

    async def async_initialize(self) -> None:
        """Carga el almacenamiento persistente o crea los datos iniciales."""
        loaded = await self.store.async_load()
        changed = False

        if not isinstance(loaded, dict) or not isinstance(loaded.get("holidays"), list):
            self._holidays = deepcopy(DEFAULT_HOLIDAYS)
            changed = True
        else:
            self._holidays, changed = self._sanitize_loaded(loaded["holidays"])

        if changed:
            await self._async_save()

        await self.async_refresh_state()

        @callback
        def _midnight_refresh(_now) -> None:
            self.hass.async_create_task(self.async_refresh_state())

        self._unsub_midnight = async_track_time_change(
            self.hass,
            _midnight_refresh,
            hour=0,
            minute=0,
            second=0,
        )

    def _sanitize_loaded(self, rows: list[Any]) -> tuple[list[dict[str, Any]], bool]:
        clean: list[dict[str, Any]] = []
        seen_dates: set[str] = set()
        changed = False

        for raw in rows:
            if not isinstance(raw, dict):
                changed = True
                continue
            try:
                normalized = self._normalize_record(raw, require_all=True)
            except CalendarError:
                _LOGGER.warning("Se ignoró un registro inválido del calendario laboral: %s", raw)
                changed = True
                continue

            if normalized["date"] in seen_dates:
                _LOGGER.warning("Se ignoró un feriado duplicado para %s", normalized["date"])
                changed = True
                continue
            seen_dates.add(normalized["date"])
            clean.append(normalized)
            if raw != normalized:
                changed = True

        clean.sort(key=lambda item: item["date"])
        return clean, changed

    def _normalize_record(self, raw: dict[str, Any], *, require_all: bool) -> dict[str, Any]:
        record_id = str(raw.get("id") or uuid4())
        date_value = str(raw.get("date") or "").strip()
        name = str(raw.get("name") or "").strip()
        description = str(raw.get("description") or "").strip()
        active = bool(raw.get("active", True))

        if require_all and (not date_value or not name):
            raise CalendarError("Fecha y nombre son obligatorios.")
        self._validate_date(date_value)
        if not name:
            raise CalendarError("El nombre es obligatorio.")
        if len(name) > 120:
            raise CalendarError("El nombre supera 120 caracteres.")
        if len(description) > 500:
            raise CalendarError("La descripción supera 500 caracteres.")

        return {
            "id": record_id,
            "date": date_value,
            "name": name,
            "description": description,
            "active": active,
        }

    @staticmethod
    def _validate_date(value: str) -> None:
        try:
            date.fromisoformat(value)
        except ValueError as err:
            raise CalendarError("La fecha debe ser válida y usar YYYY-MM-DD.") from err

    def _ensure_unique_date(self, date_value: str, *, exclude_id: str | None = None) -> None:
        for item in self._holidays:
            if item["date"] == date_value and item["id"] != exclude_id:
                raise CalendarError(f"Ya existe un registro para {date_value}.")

    async def _async_save(self) -> None:
        self._holidays.sort(key=lambda item: item["date"])
        await self.store.async_save({"holidays": self._holidays})

    def _today_status(self) -> tuple[bool, str, dict[str, Any] | None, bool]:
        today = dt_util.now().date()
        today_iso = today.isoformat()
        is_sunday = today.weekday() == 6
        holiday = next(
            (item for item in self._holidays if item["active"] and item["date"] == today_iso),
            None,
        )

        if is_sunday and holiday:
            return True, f"Domingo · {holiday['name']}", holiday, True
        if is_sunday:
            return True, "Domingo", None, True
        if holiday:
            return True, holiday["name"], holiday, False
        return False, "Día laboral", None, False

    def _next_holiday(self) -> dict[str, Any] | None:
        today_iso = dt_util.now().date().isoformat()
        candidates = [
            item for item in self._holidays if item["active"] and item["date"] > today_iso
        ]
        return deepcopy(min(candidates, key=lambda item: item["date"])) if candidates else None

    def payload(self) -> dict[str, Any]:
        is_blocked, reason, holiday, is_sunday = self._today_status()
        years = sorted({int(item["date"][:4]) for item in self._holidays})
        return {
            "entity_id": ENTITY_ID,
            "today": dt_util.now().date().isoformat(),
            "is_non_working_day": is_blocked,
            "reason": reason,
            "is_sunday": is_sunday,
            "today_holiday": deepcopy(holiday),
            "next_holiday": self._next_holiday(),
            "holidays": deepcopy(sorted(self._holidays, key=lambda item: item["date"])),
            "years": years,
            "storage": ".storage/calendario_laboral",
        }

    async def async_refresh_state(self) -> None:
        """Actualiza binary_sensor.dia_no_laborable."""
        is_blocked, reason, holiday, is_sunday = self._today_status()
        next_holiday = self._next_holiday()
        active_count = sum(1 for item in self._holidays if item["active"])

        attributes: dict[str, Any] = {
            "friendly_name": "Día no laborable",
            "icon": "mdi:calendar-remove" if is_blocked else "mdi:calendar-check",
            "fecha": dt_util.now().date().isoformat(),
            "motivo": reason,
            "es_domingo": is_sunday,
            "feriado_activo": holiday["name"] if holiday else None,
            "feriados_activos": active_count,
            "proximo_feriado": next_holiday["date"] if next_holiday else None,
            "proximo_feriado_nombre": next_holiday["name"] if next_holiday else None,
        }
        self.hass.states.async_set(ENTITY_ID, STATE_ON if is_blocked else STATE_OFF, attributes)

    async def async_add(self, data: dict[str, Any]) -> dict[str, Any]:
        async with self._lock:
            record = self._normalize_record(data, require_all=True)
            self._ensure_unique_date(record["date"])
            self._holidays.append(record)
            await self._commit("add", record)
            return deepcopy(record)

    async def async_update(self, record_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        record_id = str(record_id).strip()
        if not record_id:
            raise CalendarError("El identificador del día festivo es inválido.")
        async with self._lock:
            index = next((idx for idx, item in enumerate(self._holidays) if item["id"] == record_id), None)
            if index is None:
                raise CalendarError("No se encontró el feriado solicitado.")

            merged = {**self._holidays[index], **changes, "id": record_id}
            record = self._normalize_record(merged, require_all=True)
            self._ensure_unique_date(record["date"], exclude_id=record_id)
            self._holidays[index] = record
            await self._commit("update", record)
            return deepcopy(record)

    async def async_delete(self, record_id: str) -> None:
        record_id = str(record_id).strip()
        if not record_id:
            raise CalendarError("El identificador del día festivo es inválido.")
        async with self._lock:
            index = next((idx for idx, item in enumerate(self._holidays) if item["id"] == record_id), None)
            if index is None:
                raise CalendarError("No se encontró el feriado solicitado.")
            removed = self._holidays.pop(index)
            await self._commit("delete", removed)

    async def _commit(self, operation: str, record: dict[str, Any]) -> None:
        await self._async_save()
        await self.async_refresh_state()
        self.hass.bus.async_fire(
            EVENT_UPDATED,
            {
                "operation": operation,
                "record_id": record["id"],
                "date": record["date"],
            },
        )


@websocket_api.websocket_command({vol.Required("type"): "calendario_laboral/get"})
@callback
def websocket_get(hass: HomeAssistant, connection, msg: dict[str, Any]) -> None:
    """Devuelve el calendario y el estado del día."""
    manager: WorkCalendarManager = hass.data[DOMAIN]
    connection.send_result(msg["id"], manager.payload())


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {
        vol.Required("type"): "calendario_laboral/add",
        vol.Required("date"): DATE_SCHEMA,
        vol.Required("name"): NAME_SCHEMA,
        vol.Optional("description", default=""): DESCRIPTION_SCHEMA,
        vol.Optional("active", default=True): bool,
    }
)
async def websocket_add(hass: HomeAssistant, connection, msg: dict[str, Any]) -> None:
    """Agrega un feriado."""
    manager: WorkCalendarManager = hass.data[DOMAIN]
    try:
        record = await manager.async_add(
            {
                "date": msg["date"],
                "name": msg["name"],
                "description": msg.get("description", ""),
                "active": msg.get("active", True),
            }
        )
    except CalendarError as err:
        connection.send_error(msg["id"], "invalid_holiday", str(err))
        return
    connection.send_result(msg["id"], {"record": record, "calendar": manager.payload()})


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {
        vol.Required("type"): "calendario_laboral/update",
        vol.Required("record_id"): RECORD_ID_SCHEMA,
        vol.Optional("date"): DATE_SCHEMA,
        vol.Optional("name"): NAME_SCHEMA,
        vol.Optional("description"): DESCRIPTION_SCHEMA,
        vol.Optional("active"): bool,
    }
)
async def websocket_update(hass: HomeAssistant, connection, msg: dict[str, Any]) -> None:
    """Edita o activa/desactiva un feriado."""
    manager: WorkCalendarManager = hass.data[DOMAIN]
    changes = {key: msg[key] for key in ("date", "name", "description", "active") if key in msg}
    try:
        record = await manager.async_update(msg["record_id"], changes)
    except CalendarError as err:
        connection.send_error(msg["id"], "invalid_holiday", str(err))
        return
    connection.send_result(msg["id"], {"record": record, "calendar": manager.payload()})


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {
        vol.Required("type"): "calendario_laboral/delete",
        vol.Required("record_id"): RECORD_ID_SCHEMA,
    }
)
async def websocket_delete(hass: HomeAssistant, connection, msg: dict[str, Any]) -> None:
    """Elimina un feriado."""
    manager: WorkCalendarManager = hass.data[DOMAIN]
    try:
        await manager.async_delete(msg["record_id"])
    except CalendarError as err:
        connection.send_error(msg["id"], "invalid_holiday", str(err))
        return
    connection.send_result(msg["id"], {"calendar": manager.payload()})


async def async_setup(hass: HomeAssistant, _config: ConfigType) -> bool:
    """Configura el calendario laboral desde configuration.yaml."""
    manager = WorkCalendarManager(hass)
    await manager.async_initialize()
    hass.data[DOMAIN] = manager

    websocket_api.async_register_command(hass, websocket_get)
    websocket_api.async_register_command(hass, websocket_add)
    websocket_api.async_register_command(hass, websocket_update)
    websocket_api.async_register_command(hass, websocket_delete)

    _LOGGER.info("Calendario Laboral Witmind inicializado con %s registros", len(manager.payload()["holidays"]))
    return True
