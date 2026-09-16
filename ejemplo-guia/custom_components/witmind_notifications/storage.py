"""Persistent storage for Witmind Notifications."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_VERSION
from .discovery import target_matches_reference


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class WitmindNotificationStore:
    """Store rules, device aliases, runtime state and a bounded audit history."""

    def __init__(self, hass: HomeAssistant, history_limit: int) -> None:
        self._store = Store[dict[str, Any]](hass, STORAGE_VERSION, STORAGE_KEY)
        self._history_limit = history_limit
        self._data: dict[str, Any] = {
            "runtime_schema": 2,
            "rules": {},
            "runtime": {},
            "history": [],
            "device_aliases": {},
        }

    async def async_load(self) -> None:
        """Load persisted data."""
        loaded = await self._store.async_load()
        if not isinstance(loaded, dict):
            return

        rules = loaded.get("rules")
        runtime = loaded.get("runtime")
        history = loaded.get("history")
        aliases = loaded.get("device_aliases")
        runtime_data = runtime if isinstance(runtime, dict) else {}
        runtime_schema = int(loaded.get("runtime_schema", 1) or 1)

        # v1.0.3 marked an episode active and wrote last_sent *before* delivery
        # completed. Reset only the transient episode state once when upgrading,
        # preserving audit timestamps/values but preventing a failed old send from
        # suppressing the first real delivery under v1.0.4.
        if runtime_schema < 2:
            migrated: dict[str, Any] = {}
            for rule_id, old_runtime in runtime_data.items():
                item = self.default_runtime()
                if isinstance(old_runtime, dict):
                    for key in ("last_sent", "last_recovery", "last_value", "last_error"):
                        if key in old_runtime:
                            item[key] = old_runtime.get(key)
                item["active"] = False
                item["pending"] = False
                item["last_error"] = None
                migrated[rule_id] = item
            runtime_data = migrated
            runtime_schema = 2

        self._data = {
            "runtime_schema": runtime_schema,
            "rules": rules if isinstance(rules, dict) else {},
            "runtime": runtime_data,
            "history": history[-self._history_limit :] if isinstance(history, list) else [],
            "device_aliases": aliases if isinstance(aliases, dict) else {},
        }
        if int(loaded.get("runtime_schema", 1) or 1) < 2:
            self.async_schedule_save()

    @callback
    def _snapshot(self) -> dict[str, Any]:
        return deepcopy(self._data)

    async def async_save_now(self) -> None:
        """Persist immediately. Used for user initiated CRUD operations."""
        await self._store.async_save(self._snapshot())

    @callback
    def async_schedule_save(self, delay: float = 1.0) -> None:
        """Persist runtime/history changes without writing on every state event."""
        self._store.async_delay_save(self._snapshot, delay)

    @callback
    def list_rules(self) -> list[dict[str, Any]]:
        rules = [deepcopy(rule) for rule in self._data["rules"].values()]
        rules.sort(key=lambda item: (item.get("created_at", ""), item.get("name", "")))
        return rules

    @callback
    def get_rule(self, rule_id: str) -> dict[str, Any] | None:
        rule = self._data["rules"].get(rule_id)
        return deepcopy(rule) if isinstance(rule, dict) else None

    @callback
    def set_rule(self, rule: dict[str, Any]) -> None:
        self._data["rules"][rule["id"]] = deepcopy(rule)
        self._data["runtime"].setdefault(rule["id"], self.default_runtime())

    @callback
    def delete_rule(self, rule_id: str) -> None:
        self._data["rules"].pop(rule_id, None)
        self._data["runtime"].pop(rule_id, None)

    @staticmethod
    def default_runtime() -> dict[str, Any]:
        return {
            "active": False,
            "pending": False,
            "pending_since": None,
            "pending_until": None,
            "sending": False,
            "last_sent": None,
            "last_attempt": None,
            "last_recovery": None,
            "last_value": None,
            "last_error": None,
            "next_reminder_at": None,
            "retry_at": None,
            "retry_kind": None,
            "rearm_after": None,
        }

    @callback
    def get_runtime(self, rule_id: str) -> dict[str, Any]:
        runtime = self._data["runtime"].setdefault(rule_id, self.default_runtime())
        defaults = self.default_runtime()
        changed = False
        for key, value in defaults.items():
            if key not in runtime:
                runtime[key] = value
                changed = True
        if changed:
            self.async_schedule_save()
        return deepcopy(runtime)

    @callback
    def update_runtime(self, rule_id: str, **changes: Any) -> dict[str, Any]:
        runtime = self._data["runtime"].setdefault(rule_id, self.default_runtime())
        runtime.update(changes)
        self.async_schedule_save()
        return deepcopy(runtime)

    @callback
    def list_rules_with_runtime(self) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for rule in self.list_rules():
            item = deepcopy(rule)
            item["runtime"] = self.get_runtime(rule["id"])
            result.append(item)
        return result

    @callback
    def add_history(self, event: dict[str, Any]) -> None:
        history: list[dict[str, Any]] = self._data["history"]
        history.append(deepcopy(event))
        if len(history) > self._history_limit:
            del history[: len(history) - self._history_limit]
        self.async_schedule_save()

    @callback
    def list_history(self, limit: int) -> list[dict[str, Any]]:
        history: list[dict[str, Any]] = self._data["history"]
        return deepcopy(list(reversed(history[-limit:])))

    # ---------------------------------------------------------------------
    # Friendly device aliases
    # ---------------------------------------------------------------------

    @callback
    def _find_alias_key_for_target(self, target: dict[str, Any]) -> str | None:
        aliases: dict[str, dict[str, Any]] = self._data["device_aliases"]
        target_id = str(target.get("target_id") or "")
        if target_id and target_id in aliases:
            return target_id

        # Recovery path for a HA rename/re-registration. We compare internal
        # identity metadata, never the visible user-facing name.
        for alias_key, record in aliases.items():
            if isinstance(record, dict) and target_matches_reference(target, record):
                return alias_key
        return None

    @callback
    def decorate_targets(self, targets: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Apply custom aliases and migrate alias keys when stable HA ids move."""
        decorated: list[dict[str, Any]] = []
        aliases: dict[str, dict[str, Any]] = self._data["device_aliases"]
        migrated = False

        for raw_target in targets:
            target = deepcopy(raw_target)
            ha_name = str(target.get("ha_name") or target.get("name") or target.get("target_id") or "Dispositivo")
            target["ha_name"] = ha_name
            alias_key = self._find_alias_key_for_target(target)
            record = aliases.get(alias_key) if alias_key else None
            alias = str(record.get("alias") or "").strip() if isinstance(record, dict) else ""

            current_key = str(target.get("target_id") or target.get("key") or "")
            if record and alias_key and current_key and alias_key != current_key:
                # Keep the alias attached if HA recreated the registry entry but a
                # strong identifier/config entry still proves it is the same target.
                aliases[current_key] = {**deepcopy(record), **self._alias_identity_snapshot(target)}
                aliases[current_key]["target_id"] = current_key
                aliases[current_key]["last_seen_at"] = _now_iso()
                aliases.pop(alias_key, None)
                record = aliases[current_key]
                migrated = True
            elif record:
                record["last_seen_at"] = _now_iso()
                record["last_ha_name"] = ha_name

            target["custom_name"] = alias or None
            target["name"] = alias or ha_name
            target["display_name"] = target["name"]
            decorated.append(target)

        if migrated:
            self.async_schedule_save()
        decorated.sort(key=lambda item: (str(item.get("name") or "").lower(), str(item.get("target_id") or "")))
        return decorated

    @staticmethod
    def _alias_identity_snapshot(target: dict[str, Any]) -> dict[str, Any]:
        return {
            "target_id": target.get("target_id"),
            "identity_keys": list(target.get("identity_keys") or []),
            "device_id": target.get("device_id"),
            "entity_registry_id": target.get("entity_registry_id"),
            "entity_unique_id": target.get("entity_unique_id"),
            "config_entry_id": target.get("config_entry_id"),
            "notify_entity_id": target.get("notify_entity_id"),
            "legacy_service": target.get("legacy_service"),
            "last_ha_name": target.get("ha_name") or target.get("name"),
        }

    @callback
    def set_device_alias(self, target: dict[str, Any], alias: str | None) -> None:
        """Create/update/delete a friendly name stored only by this integration."""
        aliases: dict[str, dict[str, Any]] = self._data["device_aliases"]
        target_id = str(target.get("target_id") or target.get("key") or "").strip()
        if not target_id:
            raise ValueError("El dispositivo no tiene una identidad persistente")

        normalized = " ".join(str(alias or "").strip().split())
        existing_key = self._find_alias_key_for_target(target)

        if not normalized:
            if existing_key:
                aliases.pop(existing_key, None)
            self._sync_rule_recipient_names(target, None)
            return

        if len(normalized) > 80:
            raise ValueError("El nombre amigable no puede superar 80 caracteres")

        created_at = _now_iso()
        if existing_key and isinstance(aliases.get(existing_key), dict):
            created_at = aliases[existing_key].get("created_at") or created_at
            if existing_key != target_id:
                aliases.pop(existing_key, None)

        aliases[target_id] = {
            "alias": normalized,
            "created_at": created_at,
            "updated_at": _now_iso(),
            "last_seen_at": _now_iso(),
            **self._alias_identity_snapshot(target),
        }
        self._sync_rule_recipient_names(target, normalized)

    @callback
    def _sync_rule_recipient_names(self, target: dict[str, Any], alias: str | None) -> None:
        """Keep rule snapshots readable; delivery identity remains id-based."""
        ha_name = str(target.get("ha_name") or target.get("name") or "Dispositivo")
        for rule in self._data["rules"].values():
            recipients = rule.get("recipients") if isinstance(rule, dict) else None
            if not isinstance(recipients, list):
                continue
            changed = False
            for recipient in recipients:
                if not isinstance(recipient, dict):
                    continue
                if target_matches_reference(target, recipient):
                    recipient["name"] = alias or ha_name
                    recipient["custom_name"] = alias or None
                    recipient["target_id"] = target.get("target_id")
                    recipient["identity_keys"] = list(target.get("identity_keys") or [])
                    changed = True
            if changed:
                rule["updated_at"] = rule.get("updated_at") or _now_iso()

    @callback
    def decorate_rules_with_targets(
        self, rules: list[dict[str, Any]], targets: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Show current names/endpoints without mutating rule delivery identity."""
        output = deepcopy(rules)
        for rule in output:
            for recipient in rule.get("recipients", []):
                current = next((target for target in targets if target_matches_reference(target, recipient)), None)
                if not current:
                    continue
                recipient["target_id"] = current.get("target_id")
                recipient["identity_keys"] = list(current.get("identity_keys") or [])
                recipient["device_id"] = current.get("device_id")
                recipient["notify_entity_id"] = current.get("notify_entity_id")
                recipient["legacy_service"] = current.get("legacy_service")
                recipient["name"] = current.get("name") or recipient.get("name")
                recipient["custom_name"] = current.get("custom_name")
                recipient["ha_name"] = current.get("ha_name")
        return output
