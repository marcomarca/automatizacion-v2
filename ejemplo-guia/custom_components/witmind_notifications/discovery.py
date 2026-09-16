"""Discovery helpers for notification targets and temperature sensors."""

from __future__ import annotations

from typing import Any

from homeassistant.const import STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.util import slugify


def _area_name(area_registry: ar.AreaRegistry, area_id: str | None) -> str | None:
    if not area_id:
        return None
    try:
        area = area_registry.async_get_area(area_id)
    except AttributeError:
        area = area_registry.areas.get(area_id)
    return area.name if area else None


def _device_payload(
    hass: HomeAssistant,
    device_registry: dr.DeviceRegistry,
    area_registry: ar.AreaRegistry,
    device_id: str | None,
) -> dict[str, Any]:
    if not device_id:
        return {
            "device_id": None,
            "device_name": None,
            "manufacturer": None,
            "model": None,
            "model_id": None,
            "sw_version": None,
            "hw_version": None,
            "serial_number": None,
            "area_name": None,
            "config_entry_id": None,
            "device_identifiers": [],
        }

    device = device_registry.async_get(device_id)
    if not device:
        return {
            "device_id": device_id,
            "device_name": None,
            "manufacturer": None,
            "model": None,
            "model_id": None,
            "sw_version": None,
            "hw_version": None,
            "serial_number": None,
            "area_name": None,
            "config_entry_id": None,
            "device_identifiers": [],
        }

    config_entry_id = getattr(device, "config_entry_id", None)
    if not config_entry_id:
        legacy_entries = getattr(device, "config_entries", None)
        if legacy_entries:
            config_entry_id = next(iter(legacy_entries), None)

    raw_identifiers = getattr(device, "identifiers", None) or set()
    identifiers = sorted(
        f"{str(domain)}:{str(identifier)}"
        for domain, identifier in raw_identifiers
        if domain is not None and identifier is not None
    )

    return {
        "device_id": device.id,
        "device_name": device.name_by_user or device.name,
        "manufacturer": device.manufacturer,
        "model": device.model,
        "model_id": getattr(device, "model_id", None),
        "sw_version": device.sw_version,
        "hw_version": device.hw_version,
        "serial_number": getattr(device, "serial_number", None),
        "area_name": _area_name(area_registry, device.area_id),
        "config_entry_id": config_entry_id,
        "device_identifiers": identifiers,
    }


def _integration_domain(hass: HomeAssistant, entry: er.RegistryEntry) -> str | None:
    config_entry_id = getattr(entry, "config_entry_id", None)
    if config_entry_id:
        config_entry = hass.config_entries.async_get_entry(config_entry_id)
        if config_entry:
            return config_entry.domain
    return getattr(entry, "platform", None)


def _legacy_service_for_entity(hass: HomeAssistant, entity_id: str) -> str | None:
    object_id = entity_id.split(".", 1)[1]
    notify_services = hass.services.async_services().get("notify", {})
    for candidate in (f"mobile_app_{object_id}", object_id):
        if candidate in notify_services:
            return f"notify.{candidate}"
    return None


def _target_identity(
    *,
    device: dict[str, Any],
    entity_registry_id: str | None,
    entity_unique_id: str | None,
    platform: str | None,
    notify_entity_id: str | None,
    legacy_service: str | None,
) -> tuple[str, list[str]]:
    """Build a stable primary id plus alternate strong identity keys.

    The visible Home Assistant name and entity_id are deliberately NOT the primary
    identity when a Device Registry id is available. This lets the user rename the
    HA device/entity without breaking aliases or notification rules.
    """
    keys: list[str] = []
    device_id = device.get("device_id")
    config_entry_id = device.get("config_entry_id")

    if device_id:
        keys.append(f"device:{device_id}")
    if config_entry_id:
        keys.append(f"config_entry:{config_entry_id}")
    for identifier in device.get("device_identifiers") or []:
        keys.append(f"identifier:{identifier}")
    if entity_registry_id:
        keys.append(f"entity_registry:{entity_registry_id}")
    if entity_unique_id:
        keys.append(f"entity_unique:{platform or 'unknown'}:{entity_unique_id}")
    if notify_entity_id:
        keys.append(f"notify_entity:{notify_entity_id}")
    if legacy_service:
        keys.append(f"legacy_service:{legacy_service}")

    # Keep insertion order while removing duplicates.
    keys = list(dict.fromkeys(keys))

    if device_id:
        primary = f"device:{device_id}"
    elif entity_registry_id:
        primary = f"entity_registry:{entity_registry_id}"
    elif entity_unique_id:
        primary = f"entity_unique:{platform or 'unknown'}:{entity_unique_id}"
    elif notify_entity_id:
        primary = f"notify_entity:{notify_entity_id}"
    elif legacy_service:
        primary = f"legacy_service:{legacy_service}"
    else:
        primary = "unknown"

    return primary, keys


def target_matches_reference(target: dict[str, Any], reference: dict[str, Any]) -> bool:
    """Return True when a current discovery target is the same logical device.

    When the saved reference contains a strong internal identity, a mismatching
    target must NOT be accepted merely because it reused the same visible notify
    endpoint. This prevents an alias/rule from silently jumping to a different
    phone after the original device was deleted.
    """
    target_id = str(target.get("target_id") or "")
    reference_id = str(reference.get("target_id") or reference.get("key") or "")
    if target_id and reference_id and target_id == reference_id:
        return True

    target_device = target.get("device_id")
    reference_device = reference.get("device_id")
    if target_device and reference_device and target_device == reference_device:
        return True

    target_keys = set(target.get("identity_keys") or [])
    reference_keys = set(reference.get("identity_keys") or [])
    strong_prefixes = (
        "identifier:",
        "config_entry:",
        "entity_registry:",
        "entity_unique:",
    )
    strong_target = {key for key in target_keys if key.startswith(strong_prefixes)}
    strong_reference = {key for key in reference_keys if key.startswith(strong_prefixes)}
    if strong_target & strong_reference:
        return True

    # If the persisted reference already knows a stable HA identity, endpoint
    # equality is insufficient: it could now belong to another device.
    reference_has_strong_identity = bool(reference_device or strong_reference)
    if reference_has_strong_identity:
        return False

    # Compatibility for rules created before v1.0.7 or legacy-only services that
    # genuinely have no Device/Entity Registry identity available.
    if target_keys and reference_keys and target_keys & reference_keys:
        return True
    notify_entity_id = reference.get("notify_entity_id")
    legacy_service = reference.get("legacy_service")
    if notify_entity_id and notify_entity_id == target.get("notify_entity_id"):
        return True
    if legacy_service and legacy_service == target.get("legacy_service"):
        return True
    return False


def async_resolve_notification_target(
    hass: HomeAssistant, reference: dict[str, Any]
) -> dict[str, Any] | None:
    """Resolve a saved recipient to the target's CURRENT Home Assistant endpoints."""
    for target in async_list_notification_targets(hass):
        if target_matches_reference(target, reference):
            return target
    return None


def async_list_notification_targets(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Return Mobile App notify entities linked to their HA device metadata."""
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    area_registry = ar.async_get(hass)
    results: list[dict[str, Any]] = []
    mapped_legacy_services: set[str] = set()

    for entry in entity_registry.entities.values():
        if not entry.entity_id.startswith("notify.") or entry.disabled_by is not None:
            continue

        integration = _integration_domain(hass, entry)
        if integration != "mobile_app" and getattr(entry, "platform", None) != "mobile_app":
            continue

        state = hass.states.get(entry.entity_id)
        device = _device_payload(hass, device_registry, area_registry, entry.device_id)
        legacy_service = _legacy_service_for_entity(hass, entry.entity_id)
        if legacy_service:
            mapped_legacy_services.add(legacy_service)

        friendly_name = (
            (state.attributes.get("friendly_name") if state else None)
            or getattr(entry, "name", None)
            or getattr(entry, "original_name", None)
            or device.get("device_name")
            or entry.entity_id
        )
        entity_registry_id = getattr(entry, "id", None)
        entity_unique_id = getattr(entry, "unique_id", None)
        platform = getattr(entry, "platform", None) or integration
        target_id, identity_keys = _target_identity(
            device=device,
            entity_registry_id=entity_registry_id,
            entity_unique_id=entity_unique_id,
            platform=platform,
            notify_entity_id=entry.entity_id,
            legacy_service=legacy_service,
        )

        results.append(
            {
                "key": target_id,
                "target_id": target_id,
                "identity_keys": identity_keys,
                "entity_registry_id": entity_registry_id,
                "entity_unique_id": entity_unique_id,
                "notify_entity_id": entry.entity_id,
                "legacy_service": legacy_service,
                "name": friendly_name,
                "ha_name": friendly_name,
                "custom_name": None,
                "integration": "mobile_app",
                "available": state is not None and state.state != STATE_UNAVAILABLE,
                "entity_state": state.state if state else None,
                **device,
            }
        )

    # Compatibility fallback for installations that still expose only
    # notify.mobile_app_<device> actions and no notify entity.
    notify_services = hass.services.async_services().get("notify", {})
    mobile_devices = []
    registry_devices = device_registry.devices
    device_values = registry_devices.values() if hasattr(registry_devices, "values") else registry_devices
    for device_entry in device_values:
        config_entry_id = getattr(device_entry, "config_entry_id", None)
        if not config_entry_id:
            legacy_entries = getattr(device_entry, "config_entries", None)
            if legacy_entries:
                config_entry_id = next(iter(legacy_entries), None)
        config_entry = hass.config_entries.async_get_entry(config_entry_id) if config_entry_id else None
        if config_entry and config_entry.domain == "mobile_app":
            mobile_devices.append(device_entry)

    for service_name in notify_services:
        if not service_name.startswith("mobile_app_"):
            continue
        full_service = f"notify.{service_name}"
        if full_service in mapped_legacy_services:
            continue

        service_slug = service_name.removeprefix("mobile_app_")
        matched_device = next(
            (
                device_entry
                for device_entry in mobile_devices
                if slugify(device_entry.name_by_user or device_entry.name or "") == service_slug
            ),
            None,
        )
        device = _device_payload(
            hass,
            device_registry,
            area_registry,
            matched_device.id if matched_device else None,
        )
        friendly_name = device.get("device_name") or service_slug.replace("_", " ").title()
        target_id, identity_keys = _target_identity(
            device=device,
            entity_registry_id=None,
            entity_unique_id=None,
            platform="mobile_app",
            notify_entity_id=None,
            legacy_service=full_service,
        )
        results.append(
            {
                "key": target_id,
                "target_id": target_id,
                "identity_keys": identity_keys,
                "entity_registry_id": None,
                "entity_unique_id": None,
                "notify_entity_id": None,
                "legacy_service": full_service,
                "name": friendly_name,
                "ha_name": friendly_name,
                "custom_name": None,
                "integration": "mobile_app",
                "available": True,
                "entity_state": None,
                **device,
            }
        )

    # It is possible to discover the same logical device through two compatibility
    # paths. Collapse duplicates by target_id, preferring a NotifyEntity entry.
    deduped: dict[str, dict[str, Any]] = {}
    for item in results:
        existing = deduped.get(item["target_id"])
        if existing is None or (not existing.get("notify_entity_id") and item.get("notify_entity_id")):
            deduped[item["target_id"]] = item
        elif existing:
            if not existing.get("legacy_service") and item.get("legacy_service"):
                existing["legacy_service"] = item["legacy_service"]
            existing["identity_keys"] = list(
                dict.fromkeys((existing.get("identity_keys") or []) + (item.get("identity_keys") or []))
            )

    final = list(deduped.values())
    final.sort(key=lambda item: (str(item.get("name") or "").lower(), item["target_id"]))
    return final


def async_list_temperature_sensors(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Discover temperature sensors and enrich them with device/area data."""
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    area_registry = ar.async_get(hass)
    results: list[dict[str, Any]] = []

    for state in hass.states.async_all("sensor"):
        if state.attributes.get("device_class") != "temperature":
            continue

        entry = entity_registry.async_get(state.entity_id)
        device_id = entry.device_id if entry else None
        device = _device_payload(hass, device_registry, area_registry, device_id)
        entity_area_id = getattr(entry, "area_id", None) if entry else None
        entity_area_name = _area_name(area_registry, entity_area_id)
        area_name = entity_area_name or device.get("area_name")
        integration = _integration_domain(hass, entry) if entry else None

        try:
            numeric_value: float | None = float(state.state)
        except (TypeError, ValueError):
            numeric_value = None

        results.append(
            {
                "entity_id": state.entity_id,
                "name": state.attributes.get("friendly_name") or state.entity_id,
                "value": numeric_value,
                "raw_value": state.state,
                "unit": state.attributes.get("unit_of_measurement") or "°C",
                "available": state.state != STATE_UNAVAILABLE and numeric_value is not None,
                "area_name": area_name,
                "integration": integration,
                **device,
            }
        )

    results.sort(key=lambda item: (str(item.get("area_name") or "").lower(), str(item["name"]).lower()))
    return results
