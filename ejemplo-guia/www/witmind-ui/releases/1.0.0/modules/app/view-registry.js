import { salaViewConfig } from "../config/sala.config.js";
const registry = new Map([
    [
        salaViewConfig.id,
        {
            elementName: "wm-sala-view",
            config: salaViewConfig,
        },
    ],
]);
export function hasView(viewId) {
    if (!viewId)
        return false;
    return registry.has(viewId);
}
export function getView(viewId) {
    return registry.get(viewId);
}
export function getViews() {
    return [...registry.values()];
}
export function firstViewId() {
    const first = registry.keys().next().value;
    if (!first)
        throw new Error("No hay vistas registradas.");
    return first;
}
