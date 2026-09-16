"""Constants for Witmind Notifications."""

DOMAIN = "witmind_notifications"
STORAGE_KEY = DOMAIN
STORAGE_VERSION = 1
DEFAULT_HISTORY_LIMIT = 500
CONF_HISTORY_LIMIT = "history_limit"

DATA_STORE = "store"
DATA_ENGINE = "engine"
DATA_DISPATCHER = "dispatcher"

EVENT_UPDATED = "witmind_notifications_updated"

CONDITION_TYPES = {"above", "below", "outside", "inside"}
