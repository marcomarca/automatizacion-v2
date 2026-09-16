"""Witmind Notifications custom integration."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .const import (
    CONF_HISTORY_LIMIT,
    DATA_DISPATCHER,
    DATA_ENGINE,
    DATA_STORE,
    DEFAULT_HISTORY_LIMIT,
    DOMAIN,
)
from .dispatcher import NotificationDispatcher
from .engine import NotificationRuleEngine
from .storage import WitmindNotificationStore
from .websocket import async_register_websocket

CONFIG_SCHEMA = vol.Schema(
    {
        vol.Optional(DOMAIN, default={}): vol.Schema(
            {
                vol.Optional(CONF_HISTORY_LIMIT, default=DEFAULT_HISTORY_LIMIT): vol.All(
                    cv.positive_int, vol.Range(min=50, max=5000)
                )
            }
        )
    },
    extra=vol.ALLOW_EXTRA,
)


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up Witmind Notifications from configuration.yaml."""
    options = config.get(DOMAIN, {})
    history_limit = int(options.get(CONF_HISTORY_LIMIT, DEFAULT_HISTORY_LIMIT))

    store = WitmindNotificationStore(hass, history_limit)
    await store.async_load()

    dispatcher = NotificationDispatcher(hass)
    engine = NotificationRuleEngine(hass, store, dispatcher)
    hass.data[DOMAIN] = {
        DATA_STORE: store,
        DATA_DISPATCHER: dispatcher,
        DATA_ENGINE: engine,
    }

    async_register_websocket(hass)
    await engine.async_start()
    return True
