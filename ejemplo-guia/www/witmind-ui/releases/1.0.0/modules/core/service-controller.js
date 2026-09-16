import { getToggleCommand } from "./domain-adapters.js";
import { entityState, isEntityAvailable, unavailableStates, } from "./entity-state.js";
export class ServiceController extends EventTarget {
    getHass;
    pending = new Map();
    errors = new Map();
    timeoutMs = 7000;
    constructor(getHass) {
        super();
        this.getHass = getHass;
    }
    updateFromHass(hass) {
        const now = Date.now();
        for (const [entityId, request] of this.pending) {
            const actual = hass?.states?.[entityId]?.state;
            if (actual === request.expected) {
                this.pending.delete(entityId);
                this.errors.delete(entityId);
                this.emit(entityId);
            }
            else if (now - request.startedAt >= this.timeoutMs) {
                this.setError(entityId, "El dispositivo no confirmó el cambio.");
            }
        }
    }
    getVisualState(entityId) {
        const stateObject = entityState(this.getHass(), entityId);
        const pending = this.pending.get(entityId);
        const error = this.errors.get(entityId);
        if (!stateObject)
            return { kind: "missing", disabled: true };
        if (unavailableStates.has(stateObject.state)) {
            return {
                kind: "unavailable",
                actual: stateObject.state,
                disabled: true,
            };
        }
        if (pending) {
            return {
                kind: "pending",
                actual: stateObject.state,
                expected: pending.expected,
                disabled: true,
            };
        }
        if (error && error.expiresAt > Date.now()) {
            return {
                kind: "error",
                actual: stateObject.state,
                message: error.message,
                disabled: false,
            };
        }
        return {
            kind: stateObject.state === "on" ? "on" : "off",
            actual: stateObject.state,
            disabled: false,
        };
    }
    async toggleEntity(entityId) {
        const hass = this.getHass();
        const stateObject = entityState(hass, entityId);
        if (!hass) {
            this.setError(entityId, "Home Assistant no está disponible.");
            return;
        }
        if (!isEntityAvailable(stateObject)) {
            this.setError(entityId, stateObject ? "Entidad no disponible." : "Entidad inexistente.");
            return;
        }
        if (this.pending.has(entityId))
            return;
        let command;
        try {
            command = getToggleCommand(entityId, stateObject.state);
        }
        catch (error) {
            this.setError(entityId, error instanceof Error ? error.message : "Dominio no compatible.");
            return;
        }
        const request = {
            expected: command.expected,
            startedAt: Date.now(),
        };
        this.pending.set(entityId, request);
        this.errors.delete(entityId);
        this.emit(entityId);
        try {
            await hass.callService(command.domain, command.service, {
                entity_id: entityId,
            });
        }
        catch (error) {
            this.setError(entityId, error instanceof Error
                ? error.message
                : "No se pudo ejecutar el servicio.");
            return;
        }
        globalThis.setTimeout(() => {
            if (this.pending.get(entityId) === request) {
                this.setError(entityId, "El dispositivo no confirmó el cambio.");
            }
        }, this.timeoutMs);
    }
    async callAction(action) {
        const hass = this.getHass();
        if (!hass?.callService) {
            throw new Error("Home Assistant no está disponible.");
        }
        await hass.callService(action.domain, action.service, action.target ?? {});
    }
    setError(entityId, message) {
        this.pending.delete(entityId);
        this.errors.set(entityId, {
            message,
            expiresAt: Date.now() + 6000,
        });
        this.emit(entityId);
        globalThis.setTimeout(() => {
            const error = this.errors.get(entityId);
            if (error && error.expiresAt <= Date.now()) {
                this.errors.delete(entityId);
                this.emit(entityId);
            }
        }, 6200);
    }
    emit(entityId) {
        this.dispatchEvent(new CustomEvent("entity-visual-change", {
            detail: { entityId },
        }));
    }
}
