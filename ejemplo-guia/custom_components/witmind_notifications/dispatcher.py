"""Notification delivery for Witmind Notifications."""

from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from .discovery import async_resolve_notification_target

SEND_TIMEOUT_SECONDS = 20


class NotificationDispatcher:
    """Send messages through notify entities, with legacy action compatibility."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    def resolve_recipient(self, recipient: dict[str, Any]) -> dict[str, Any]:
        """Resolve a saved recipient to current HA endpoints by internal identity.

        A rule may keep working after the user renames a Home Assistant device or
        notify entity because delivery does not depend on the visible name/entity
        snapshot stored when the rule was created.
        """
        current = async_resolve_notification_target(self.hass, recipient)
        if current:
            merged = {**recipient, **current}
            # A Witmind-only friendly alias is part of the saved rule snapshot and
            # should remain the visible label even though endpoints are refreshed.
            if recipient.get("custom_name"):
                merged["name"] = recipient.get("custom_name")
                merged["custom_name"] = recipient.get("custom_name")
            return merged

        unresolved = dict(recipient)
        strong_prefixes = ("identifier:", "config_entry:", "entity_registry:", "entity_unique:")
        has_strong_identity = bool(
            recipient.get("device_id")
            or any(str(key).startswith(strong_prefixes) for key in recipient.get("identity_keys") or [])
        )
        if has_strong_identity:
            unresolved["_identity_missing"] = True
        return unresolved

    async def _with_timeout(self, operation: Callable[[], Awaitable[Any]], label: str) -> None:
        """Run a notification service call with a hard timeout.

        A stalled provider must never leave a rule permanently in ``Enviando…``.
        """
        try:
            async with asyncio.timeout(SEND_TIMEOUT_SECONDS):
                await operation()
        except TimeoutError as err:
            raise HomeAssistantError(
                f"Tiempo de espera agotado enviando por {label} ({SEND_TIMEOUT_SECONDS} s)"
            ) from err

    async def async_send(
        self,
        recipient: dict[str, Any],
        title: str,
        message: str,
    ) -> str:
        """Send to one recipient and return the action/entity actually used."""
        recipient = self.resolve_recipient(recipient)
        if recipient.get("_identity_missing"):
            raise HomeAssistantError(
                "El dispositivo guardado ya no existe con la misma identidad en Home Assistant; "
                "selecciona nuevamente el destino para evitar enviar a otro equipo por error"
            )
        notify_entity_id = recipient.get("notify_entity_id")
        legacy_service = recipient.get("legacy_service")
        failures: list[str] = []

        # Proven Mobile App route first.
        if legacy_service and "." in str(legacy_service):
            domain, service = str(legacy_service).split(".", 1)
            if self.hass.services.has_service(domain, service):
                try:
                    await self._with_timeout(
                        lambda: self.hass.services.async_call(
                            domain,
                            service,
                            {"message": message, "title": title},
                            blocking=True,
                        ),
                        str(legacy_service),
                    )
                    return str(legacy_service)
                except Exception as err:  # noqa: BLE001 - fallback is intentional
                    failures.append(f"{legacy_service}: {err}")
            else:
                failures.append(f"{legacy_service}: acción no disponible")

        # Modern NotifyEntity fallback.
        if notify_entity_id and self.hass.services.has_service("notify", "send_message"):
            try:
                await self._with_timeout(
                    lambda: self.hass.services.async_call(
                        "notify",
                        "send_message",
                        {
                            ATTR_ENTITY_ID: notify_entity_id,
                            "message": message,
                            "title": title,
                        },
                        blocking=True,
                    ),
                    str(notify_entity_id),
                )
                return str(notify_entity_id)
            except Exception as err:  # noqa: BLE001
                failures.append(f"{notify_entity_id}: {err}")

        if failures:
            raise HomeAssistantError("; ".join(failures))

        raise HomeAssistantError(
            "El destino no dispone de una acción mobile_app ni de notify.send_message"
        )
