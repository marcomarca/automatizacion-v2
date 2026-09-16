export const unavailableStates = new Set(["unknown", "unavailable", "none"]);
export function entityState(hass, entityId) {
    return hass?.states?.[entityId];
}
export function friendlyName(hass, entityId, fallback) {
    const stateObject = entityState(hass, entityId);
    if (!stateObject)
        return fallback;
    if (typeof hass?.formatEntityName === "function") {
        try {
            return hass.formatEntityName(stateObject, fallback);
        }
        catch {
            // Fallback compatible con versiones sin formatEntityName estable.
        }
    }
    const value = stateObject.attributes.friendly_name;
    return typeof value === "string" && value.trim() ? value : fallback;
}
export function isEntityAvailable(stateObject) {
    return stateObject != null && !unavailableStates.has(stateObject.state);
}
export function formatNumber(value, maximumFractionDigits = 1) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric))
        return "—";
    return new Intl.NumberFormat("es-BO", { maximumFractionDigits }).format(numeric);
}
