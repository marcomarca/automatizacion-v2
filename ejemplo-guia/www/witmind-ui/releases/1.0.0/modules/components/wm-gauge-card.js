import { entityState, formatNumber, isEntityAvailable, } from "../core/entity-state.js";
import { RuntimeElement } from "../core/runtime-element.js";
import { queryRequired } from "../ui/dom.js";
export class WmGaugeCard extends RuntimeElement {
    _config = null;
    set config(value) {
        this._config = value;
        this.update();
    }
    connectedCallback() {
        super.connectedCallback();
        if (!this.hasChildNodes()) {
            this.innerHTML = `
        <article class="wm-card wm-gauge-card">
          <div>
            <span class="wm-eyebrow" data-eyebrow></span>
            <h2 data-title></h2>
            <p class="wm-secondary-text" data-range></p>
          </div>
          <div class="wm-gauge" data-gauge>
            <div class="wm-gauge-inner">
              <strong data-value>—</strong>
              <span data-unit></span>
            </div>
          </div>
        </article>
      `;
        }
        this.update();
    }
    update() {
        if (!this.isConnected || !this.runtime || !this._config)
            return;
        const stateObject = entityState(this.runtime.hass, this._config.entityId);
        const value = Number(stateObject?.state);
        const min = Number(stateObject?.attributes.min ?? 0);
        const max = Number(stateObject?.attributes.max ?? 100);
        const unitValue = stateObject?.attributes.unit_of_measurement;
        const unit = typeof unitValue === "string" ? unitValue : "";
        const range = max - min || 1;
        const percentage = Number.isFinite(value)
            ? Math.max(0, Math.min(100, ((value - min) / range) * 100))
            : 0;
        const card = queryRequired(this, ".wm-gauge-card");
        card.dataset.state = !stateObject
            ? "missing"
            : isEntityAvailable(stateObject)
                ? "available"
                : "unavailable";
        queryRequired(this, "[data-eyebrow]").textContent =
            this._config.eyebrow;
        queryRequired(this, "[data-title]").textContent =
            this._config.title;
        queryRequired(this, "[data-range]").textContent = stateObject
            ? `Rango configurado: ${formatNumber(min)}–${formatNumber(max)} ${unit}`
            : `Entidad inexistente: ${this._config.entityId}`;
        queryRequired(this, "[data-gauge]").style.setProperty("--wm-gauge-value", `${percentage}%`);
        queryRequired(this, "[data-value]").textContent =
            Number.isFinite(value) ? formatNumber(value, 2) : "—";
        queryRequired(this, "[data-unit]").textContent = unit;
    }
}
