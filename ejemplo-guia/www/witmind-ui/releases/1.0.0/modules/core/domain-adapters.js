const supportedToggleDomains = new Set([
    "switch",
    "light",
    "fan",
    "input_boolean",
    "automation",
]);
export function entityDomain(entityId) {
    return entityId.split(".", 1)[0] ?? "";
}
export function getToggleCommand(entityId, currentState) {
    const domain = entityDomain(entityId);
    if (!supportedToggleDomains.has(domain)) {
        throw new Error(`El dominio ${domain || "vacío"} no admite control toggle.`);
    }
    const expected = currentState === "on" ? "off" : "on";
    return {
        domain,
        service: expected === "on" ? "turn_on" : "turn_off",
        expected,
    };
}
