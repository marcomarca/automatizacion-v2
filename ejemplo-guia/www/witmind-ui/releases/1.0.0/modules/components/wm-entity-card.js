import { entityState, friendlyName } from "../core/entity-state.js";
import { RuntimeElement } from "../core/runtime-element.js";
import { queryRequired } from "../ui/dom.js";
import { iconMarkup } from "../ui/icon.js";
export class WmEntityCard extends RuntimeElement {
    _config = null;
    onVisualChange = (event) => {
        const detail = event.detail;
        if (detail?.entityId === this._config?.entityId)
            this.update();
    };
    set config(value) {
        this._config = value;
        this.update();
    }
    get config() {
        return this._config;
    }
    connectedCallback() {
        super.connectedCallback();
        if (!this.hasChildNodes()) {
            this.innerHTML = `
        <article class="wm-device-card" data-card>
          <button class="wm-device-main" type="button" data-toggle>
            <span class="wm-device-icon" data-icon></span>
            <span class="wm-device-copy">
              <strong data-label></strong>
              <small data-subtitle></small>
            </span>
            <span class="wm-device-state" data-state></span>
            <span class="wm-switch" aria-hidden="true"><span></span></span>
          </button>
          <button class="wm-icon-button wm-device-details" type="button" data-details aria-label="Abrir detalles">
            ${iconMarkup("details")}
          </button>
        </article>
      `;
            queryRequired(this, "[data-toggle]").addEventListener("click", () => {
                if (this._config) {
                    void this.runtime?.services.toggleEntity(this._config.entityId);
                }
            });
            queryRequired(this, "[data-details]").addEventListener("click", () => {
                if (!this._config)
                    return;
                this.dispatchEvent(new CustomEvent("hass-more-info", {
                    bubbles: true,
                    composed: true,
                    detail: { entityId: this._config.entityId },
                }));
            });
        }
        this.runtime?.services.addEventListener("entity-visual-change", this.onVisualChange);
        this.update();
    }
    disconnectedCallback() {
        this.runtime?.services.removeEventListener("entity-visual-change", this.onVisualChange);
        super.disconnectedCallback();
    }
    update() {
        if (!this.isConnected || !this._config || !this.runtime)
            return;
        const { entityId, label, subtitle, icon = "power" } = this._config;
        const visual = this.runtime.services.getVisualState(entityId);
        const stateObject = entityState(this.runtime.hass, entityId);
        const card = queryRequired(this, "[data-card]");
        const toggle = queryRequired(this, "[data-toggle]");
        const details = queryRequired(this, "[data-details]");
        const stateLabel = this.visualLabel(visual.kind, visual.expected, visual.message);
        card.dataset.state = visual.kind;
        toggle.disabled = visual.disabled;
        toggle.setAttribute("aria-pressed", String(visual.kind === "on"));
        toggle.setAttribute("aria-label", `${visual.kind === "on" ? "Apagar" : "Encender"} ${label}`);
        details.disabled = !stateObject;
        queryRequired(this, "[data-icon]").innerHTML = iconMarkup(visual.kind === "pending"
            ? "spinner"
            : visual.kind === "error"
                ? "warning"
                : icon);
        queryRequired(this, "[data-label]").textContent = friendlyName(this.runtime.hass, entityId, label);
        queryRequired(this, "[data-subtitle]").textContent =
            subtitle || entityId;
        queryRequired(this, "[data-state]").textContent = stateLabel;
    }
    visualLabel(kind, expected, message) {
        switch (kind) {
            case "missing":
                return "Entidad inexistente";
            case "unavailable":
                return "No disponible";
            case "pending":
                return expected === "on" ? "Encendiendo…" : "Apagando…";
            case "error":
                return message || "Error";
            case "on":
                return this._config?.onLabel || "Encendido";
            default:
                return this._config?.offLabel || "Apagado";
        }
    }
}
