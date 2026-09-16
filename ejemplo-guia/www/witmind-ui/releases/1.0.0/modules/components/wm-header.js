import { entityState, isEntityAvailable } from "../core/entity-state.js";
import { RuntimeElement } from "../core/runtime-element.js";
import { iconMarkup } from "../ui/icon.js";
import { queryRequired } from "../ui/dom.js";
export class WmHeader extends RuntimeElement {
    connectedCallback() {
        super.connectedCallback();
        if (!this.hasChildNodes()) {
            this.innerHTML = `
        <header class="wm-page-header">
          <div class="wm-page-copy">
            <span class="wm-eyebrow" data-installation></span>
            <h1 data-title></h1>
            <p data-description></p>
          </div>
          <div class="wm-status-summary" data-summary></div>
        </header>
      `;
        }
        this.update();
    }
    update() {
        if (!this.isConnected || !this.runtime?.view)
            return;
        const { view, hass } = this.runtime;
        let active = 0;
        let unavailable = 0;
        for (const item of view.controls) {
            const stateObject = entityState(hass, item.entityId);
            if (!isEntityAvailable(stateObject))
                unavailable += 1;
            else if (stateObject.state === "on")
                active += 1;
        }
        queryRequired(this, "[data-installation]").textContent =
            view.installation;
        queryRequired(this, "[data-title]").textContent = view.title;
        queryRequired(this, "[data-description]").textContent =
            view.description;
        queryRequired(this, "[data-summary]").innerHTML = `
      <span class="wm-status-chip wm-status-chip--success">
        ${iconMarkup("check")}<span>Conectado</span>
      </span>
      <span class="wm-status-chip ${active ? "wm-status-chip--active" : ""}">
        ${iconMarkup("power")}<span>${active} encendidos</span>
      </span>
      <span class="wm-status-chip ${unavailable ? "wm-status-chip--warning" : ""}">
        ${iconMarkup(unavailable ? "warning" : "status")}
        <span>${unavailable ? `${unavailable} no disponibles` : "Sin incidencias"}</span>
      </span>
    `;
    }
}
