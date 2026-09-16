export const entityIdPattern = /^[a-z0-9_]+\.[a-z0-9_]+$/;
function validateEntityId(errors, entityId, context) {
    if (!entityIdPattern.test(entityId ?? "")) {
        errors.push(`${context}: entity_id no válido: ${entityId || "(vacío)"}`);
    }
}
export function validateView(view) {
    const errors = [];
    if (!view || typeof view !== "object") {
        return ["La vista no es un objeto válido."];
    }
    if (!view.id)
        errors.push("La vista no contiene id.");
    if (!view.title)
        errors.push(`La vista ${view.id || "sin id"} no contiene title.`);
    if (!view.navigationLabel)
        errors.push("Falta navigationLabel.");
    validateEntityId(errors, view.weather?.entityId, "Clima");
    validateEntityId(errors, view.gauge?.entityId, "Medidor");
    for (const [index, item] of (view.controls ?? []).entries()) {
        validateEntityId(errors, item.entityId, `Control ${index + 1}`);
    }
    for (const [index, item] of (view.history?.entities ?? []).entries()) {
        validateEntityId(errors, item.entityId, `Historial ${index + 1}`);
    }
    const action = view.primaryAction;
    if (!action?.domain || !action.service) {
        errors.push("La acción principal requiere domain y service.");
    }
    const targetEntity = action?.target?.entity_id;
    if (targetEntity !== undefined) {
        if (typeof targetEntity !== "string") {
            errors.push("El target entity_id de la acción debe ser texto.");
        }
        else {
            validateEntityId(errors, targetEntity, "Acción principal");
        }
    }
    return errors;
}
