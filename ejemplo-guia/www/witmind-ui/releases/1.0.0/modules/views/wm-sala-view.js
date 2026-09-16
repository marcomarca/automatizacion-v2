import { validateView } from "../core/config-validator.js";
import { RuntimeElement } from "../core/runtime-element.js";
import { escapeHtml } from "../ui/escape.js";
import { iconMarkup } from "../ui/icon.js";
export class WmSalaView extends RuntimeElement {
    _view = null;
    builtViewId = null;
    set view(value) {
        this._view = value;
        this.build();
    }
    connectedCallback() {
        super.connectedCallback();
        this.build();
    }
    update() {
        // Cada componente hijo escucha directamente al Runtime.
    }
    build() {
        if (!this.isConnected || !this.runtime || !this._view)
            return;
        if (this.builtViewId === this._view.id && this.hasChildNodes())
            return;
        const errors = validateView(this._view);
        if (errors.length) {
            this.innerHTML = `
        <section class="wm-configuration-error">
          ${iconMarkup("warning")}
          <h1>Configuración no válida</h1>
          <ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>
        </section>
      `;
            return;
        }
        this.builtViewId = this._view.id;
        this.replaceChildren();
        const page = document.createElement("main");
        page.className = "wm-page";
        const header = this.component("wm-header");
        page.append(header);
        const hero = document.createElement("section");
        hero.className = "wm-grid wm-hero-grid";
        hero.append(document.createElement("wm-clock"), this.component("wm-weather-card", this._view.weather));
        page.append(hero);
        const controlsSection = document.createElement("section");
        controlsSection.className = "wm-section";
        controlsSection.innerHTML = `
      <div class="wm-section-heading">
        <div>
          <span class="wm-eyebrow">Dispositivos</span>
          <h2>Control principal</h2>
        </div>
        <span class="wm-secondary-text">Estado confirmado por Home Assistant</span>
      </div>
      <div class="wm-controls-grid" data-controls></div>
    `;
        const controlsRoot = controlsSection.querySelector("[data-controls]");
        if (!controlsRoot)
            throw new Error("No se pudo crear la cuadrícula de controles.");
        for (const item of this._view.controls) {
            controlsRoot.append(this.component("wm-entity-card", item));
        }
        page.append(controlsSection);
        const lower = document.createElement("section");
        lower.className = "wm-grid wm-lower-grid";
        lower.append(this.component("wm-history-card", this._view.history), this.component("wm-gauge-card", this._view.gauge));
        page.append(lower);
        page.append(this.component("wm-action-card", this._view.primaryAction));
        this.append(page);
    }
    component(tagName, config) {
        const element = document.createElement(tagName);
        element.runtime = this.runtime;
        if (config !== undefined)
            element.config = config;
        return element;
    }
}
