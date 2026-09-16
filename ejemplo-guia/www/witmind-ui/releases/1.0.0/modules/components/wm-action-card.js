import { RuntimeElement } from "../core/runtime-element.js";
import { queryRequired } from "../ui/dom.js";
import { iconMarkup } from "../ui/icon.js";
export class WmActionCard extends RuntimeElement {
    _config = null;
    set config(value) {
        this._config = value;
        this.update();
    }
    connectedCallback() {
        super.connectedCallback();
        if (!this.hasChildNodes()) {
            this.innerHTML = `
        <article class="wm-action-card">
          <div class="wm-action-copy">
            <span class="wm-eyebrow">Acción maestra</span>
            <h2 data-title></h2>
            <p data-description></p>
            <span class="wm-action-error" data-error></span>
          </div>
          <button class="wm-primary-action" type="button" data-action>
            <span data-icon></span><span>Ejecutar</span>
          </button>
        </article>
      `;
            queryRequired(this, "[data-action]").addEventListener("click", () => this.execute());
        }
        this.update();
    }
    update() {
        if (!this.isConnected || !this._config)
            return;
        queryRequired(this, "[data-title]").textContent =
            this._config.title;
        queryRequired(this, "[data-description]").textContent =
            this._config.description;
        queryRequired(this, "[data-icon]").innerHTML = iconMarkup(this._config.icon || "power");
    }
    execute() {
        if (!this._config || !this.runtime)
            return;
        if (this._config.confirmation) {
            const detail = {
                ...this._config.confirmation,
                action: () => this.runtime.services.callAction(this._config),
            };
            this.dispatchEvent(new CustomEvent("wm-confirm-request", {
                bubbles: true,
                composed: true,
                detail,
            }));
            return;
        }
        void this.runtime.services.callAction(this._config).catch((error) => {
            this.showError(error instanceof Error ? error.message : "No se pudo ejecutar la acción.");
        });
    }
    showError(message) {
        const element = queryRequired(this, "[data-error]");
        element.textContent = message;
        globalThis.setTimeout(() => {
            if (element.textContent === message)
                element.textContent = "";
        }, 6000);
    }
}
