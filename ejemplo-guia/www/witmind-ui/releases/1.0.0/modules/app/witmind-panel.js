import { getReleaseInfo } from "../core/release.js";
import { Runtime } from "../core/runtime.js";
export class WitmindPanel extends HTMLElement {
    runtime = new Runtime();
    _hass = null;
    _panel = null;
    _narrow = false;
    mounted = false;
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }
    set hass(value) {
        this._hass = value;
        this.runtime.setHass(value);
    }
    get hass() {
        return this._hass;
    }
    set panel(value) {
        this._panel = value;
        const shell = this.shadowRoot?.querySelector("wm-app-shell");
        if (shell)
            shell.config = value?.config;
    }
    get panel() {
        return this._panel;
    }
    set narrow(value) {
        this._narrow = Boolean(value);
        this.toggleAttribute("narrow", this._narrow);
    }
    get narrow() {
        return this._narrow;
    }
    connectedCallback() {
        if (!this.mounted)
            this.mount();
        this.runtime.setHass(this._hass);
    }
    disconnectedCallback() {
        this.runtime.destroy();
    }
    mount() {
        this.mounted = true;
        const cssUrl = new URL("witmind-ui.css", getReleaseInfo().root).href;
        this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${cssUrl}">
      <wm-app-shell></wm-app-shell>
    `;
        const shell = this.shadowRoot.querySelector("wm-app-shell");
        if (!shell)
            throw new Error("No se pudo crear wm-app-shell.");
        shell.runtime = this.runtime;
        shell.config = this._panel?.config;
    }
}
