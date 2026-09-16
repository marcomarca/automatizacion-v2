/**
 * Witmind Resilient Panel Hub v2.0.0
 * Arquitectura de Paneles Custom con Hot-Reload sin reinicios de Home Assistant OS.
 * Modo Dual: Local-First Autónomo (100% Confiable) + Dev Server Hot-Reload (Vite <50ms).
 */

const MENU_ICON = `
  <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6.5h18M3 12h18M3 17.5h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
`;

const RELOAD_ICON = `
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4M20 4v4h-4M4 20v-4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

async function checkServerAvailability(url, timeoutMs = 400) {
  if (!url) return false;
  if (window.location.protocol === "https:" && url.startsWith("http://")) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

export class WitmindPanelHub extends HTMLElement {
  constructor(panelOptions = {}) {
    super();
    this.attachShadow({ mode: "open" });

    this._panelOptions = panelOptions;
    this._isLabMode = panelOptions.isLabMode === true || this.tagName.toLowerCase() === "witmind-lab-panel";
    this._availableLabPanels = [
      {
        id: "control-general-react",
        name: "⚡ Control General 2.0 (React)",
        isWebReact: true,
        reactView: "control-general",
        tag: "control-general-panel",
      },
      {
        id: "control-general-legacy",
        name: "Control General (Original)",
        script: "/local/panels/control-general.core.js",
        tag: "control-general-panel",
      },
      { id: "climatizacion", name: "Climatización", script: "/local/panels/climatizacion.core.js", tag: "climatizacion-panel" },
      { id: "showroom-energy", name: "Consumo Showroom", script: "/local/panels/showroom-energy.core.js", tag: "showroom-energy-panel" },
      { id: "showroom-v2", name: "Showroom V2 (Hot-Reload)", script: "/local/panels/showroom-v2.core.js", tag: "showroom-v2-panel" },
      { id: "showroom", name: "Showroom Operativo", script: "/local/panels/showroom.core.js", tag: "showroom-panel" },
    ];
    let initialId = "control-general-react";
    try {
      const stored = localStorage.getItem("witmind_lab_active_panel");
      if (stored && stored !== "control-general" && this._availableLabPanels.some((p) => p.id === stored)) {
        initialId = stored;
      }
    } catch {}
    this._activeLabPanelId = initialId;

    this._hass = null;
    this._config = {};
    this._narrow = false;
    this._panel = null;
    this._iframe = null;
    this._isDevMode = localStorage.getItem("witmind_panel_mode") === "dev";
    this._devUrl = localStorage.getItem("witmind_panel_dev_url") || "http://192.168.20.44:5173";
    this._showDevBar = localStorage.getItem("witmind_panel_devbar") === "true";
    this._theme = "dark";
    this._activeSource = "local";
    this._reloadCount = 0;

    this._handleWindowMessage = this._handleWindowMessage.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  get panelTag() {
    if (this._isLabMode) {
      const match = this._availableLabPanels.find((p) => p.id === this._activeLabPanelId);
      return match?.tag || "control-general-panel";
    }
    return this._panelOptions.tag || this.tagName.toLowerCase();
  }

  get panelId() {
    if (this._isLabMode) return this._activeLabPanelId;
    if (this._panelOptions.id) return this._panelOptions.id;
    return this.panelTag.replace(/-panel$/, "");
  }

  get localScript() {
    if (this._isLabMode) {
      const match = this._availableLabPanels.find((p) => p.id === this._activeLabPanelId);
      return match?.script || `/local/panels/${this._activeLabPanelId}.core.js`;
    }
    if (this._panelOptions.localScript) return this._panelOptions.localScript;
    return `/local/panels/${this.panelId}.core.js`;
  }

  get devUrl() {
    if (this._panelOptions.devUrl) return this._panelOptions.devUrl;
    return `${this._devUrl}/panels/${this.panelId}/`;
  }

  connectedCallback() {
    this._upgradeProperty("hass");
    this._upgradeProperty("config");
    this._upgradeProperty("panel");
    this._upgradeProperty("narrow");

    this._theme = this._detectTheme();
    this._renderShell();
    this._initRunner();
    window.addEventListener("message", this._handleWindowMessage);
    window.addEventListener("keydown", this._handleKeyDown);
  }

  _upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  disconnectedCallback() {
    window.removeEventListener("message", this._handleWindowMessage);
    window.removeEventListener("keydown", this._handleKeyDown);
    this._iframe = null;
  }

  _detectTheme() {
    try {
      const stored = localStorage.getItem("witmind-theme");
      if (stored === "dark" || stored === "light") return stored;
    } catch {}
    return this._hass?.themes?.darkMode === true ? "dark" : "light";
  }

  _handleKeyDown(e) {
    // Ctrl + Shift + D toggles dev bar
    if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
      e.preventDefault();
      this._toggleDevBar();
    }
    // Ctrl + Shift + R hot-reloads the active panel runner
    if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
      e.preventDefault();
      this._hotReload();
    }
  }

  _toggleDevBar() {
    this._showDevBar = !this._showDevBar;
    localStorage.setItem("witmind_panel_devbar", String(this._showDevBar));
    const bar = this.shadowRoot.querySelector("#dev-toolbar");
    if (bar) {
      bar.classList.toggle("visible", this._showDevBar);
    }
  }

  _hotReload() {
    this._reloadCount++;
    const statusText = this.shadowRoot.querySelector("#dev-status");
    if (statusText) statusText.textContent = "Recargando...";
    this._initRunner(true);
  }

  set hass(value) {
    this._hass = value;
    window._hubHass = value;

    if (value?.themes) {
      const detected = value.themes.darkMode === true ? "dark" : "light";
      if (this._theme !== detected) {
        this._theme = detected;
        this._applyTheme();
      }
    }

    if (!this._syncScheduled) {
      this._syncScheduled = true;
      requestAnimationFrame(() => {
        this._syncScheduled = false;
        this._syncHassToRunner();
      });
    }
  }

  set config(value) {
    this._config = value || {};
    window._hubConfig = this._config;
    this._syncConfigToRunner();
  }

  setConfig(value) {
    this.config = value;
  }

  set narrow(value) {
    this._narrow = value;
    if (this._iframe?.contentWindow?.setNarrow) {
      this._iframe.contentWindow.setNarrow(value);
    }
  }

  set panel(value) {
    this._panel = value;
    if (value && value.config) {
      this.config = value.config;
    }
    if (this._iframe?.contentWindow?.setPanel) {
      this._iframe.contentWindow.setPanel(value);
    }
  }

  _applyTheme() {
    this.setAttribute("data-theme", this._theme);
    const container = this.shadowRoot.querySelector(".hub-container");
    if (container) {
      container.setAttribute("data-theme", this._theme);
    }
    if (this._iframe?.contentWindow?.document?.documentElement) {
      this._iframe.contentWindow.document.documentElement.setAttribute("data-theme", this._theme);
    }
  }

  _syncHassToRunner() {
    if (!this._iframe || !this._iframe.contentWindow) return;

    // Fast direct in-memory call if same origin
    try {
      if (typeof this._iframe.contentWindow.setHass === "function") {
        this._iframe.contentWindow.setHass(this._hass);
        return;
      }
    } catch {}

    // Fallback to postMessage for cross-origin Vite dev server
    try {
      const safeStates = {};
      if (this._hass?.states) {
        for (const id in this._hass.states) {
          const s = this._hass.states[id];
          if (s) {
            safeStates[id] = {
              entity_id: s.entity_id,
              state: s.state,
              attributes: s.attributes || {},
              last_changed: s.last_changed,
              last_updated: s.last_updated,
            };
          }
        }
      }
      this._iframe.contentWindow.postMessage(
        {
          type: "HA_STATES",
          hass: {
            states: safeStates,
            themes: this._hass?.themes || {},
            user: this._hass?.user || null,
          },
        },
        "*"
      );
    } catch (e) {
      console.warn("[Witmind Hub] Error forwarding states to runner:", e);
    }
  }

  _syncConfigToRunner() {
    if (!this._iframe || !this._iframe.contentWindow) return;
    try {
      if (typeof this._iframe.contentWindow.setConfig === "function") {
        this._iframe.contentWindow.setConfig(this._config);
        return;
      }
    } catch {}

    try {
      this._iframe.contentWindow.postMessage({ type: "HA_CONFIG", config: this._config }, "*");
    } catch {}
  }

  async _initRunner(forceReload = false) {
    const iframe = this.shadowRoot.querySelector("iframe");
    if (!iframe) return;
    this._iframe = iframe;

    const cacheBuster = forceReload ? Date.now() : (this._panelOptions.version || Date.now());
    
    // Check if active lab panel is a modern Web React component
    const activeLabPanel = this._isLabMode
      ? this._availableLabPanels.find((p) => p.id === this._activeLabPanelId)
      : null;

    let prodSrc = `/local/panel-runner.html?panel=${encodeURIComponent(this.panelTag)}&src=${encodeURIComponent(this.localScript)}&v=${cacheBuster}&theme=${this._theme}`;
    let devSrc = `${this.devUrl}${this.devUrl.includes("?") ? "&" : "?"}v=${cacheBuster}&theme=${this._theme}`;

    if (activeLabPanel?.isWebReact) {
      devSrc = `${this._devUrl}/?view=${activeLabPanel.reactView}&v=${cacheBuster}&theme=${this._theme}`;
      prodSrc = `/local/3d-app/index.html?view=${activeLabPanel.reactView}&v=${cacheBuster}&theme=${this._theme}`;
    }

    // Update Dev Bar status
    const statusText = this.shadowRoot.querySelector("#dev-status");
    const modeBadge = this.shadowRoot.querySelector("#dev-mode-badge");

    if (this._isDevMode) {
      if (statusText) statusText.textContent = "Verificando Vite...";
      const isAlive = await checkServerAvailability(this._devUrl, 450);

      if (isAlive) {
        this._activeSource = "dev";
        if (statusText) statusText.textContent = `Vite React Hot-Reload ACTIVO (${this._reloadCount > 0 ? `#${this._reloadCount}` : "OK"})`;
        if (modeBadge) {
          modeBadge.textContent = "⚡ DEV (React Vite)";
          modeBadge.className = "badge dev";
        }
        iframe.src = devSrc;
        return;
      }

      console.warn(`[Witmind Hub] Servidor Dev no disponible en ${this._devUrl}. Fallback a Local-First.`);
    }

    // Default: Local-First Fallback (Autonomous & 100% Reliable)
    this._activeSource = "local";
    if (statusText) statusText.textContent = `Local HA OS (${this._reloadCount > 0 ? `#${this._reloadCount}` : "Estable"})`;
    if (modeBadge) {
      modeBadge.textContent = "🟢 LOCAL (HA OS)";
      modeBadge.className = "badge local";
    }
    iframe.src = prodSrc;

    // Attach load listener to pass cached hass immediately
    iframe.onload = () => {
      if (this._hass) this._syncHassToRunner();
      if (this._config) this._syncConfigToRunner();
    };
  }

  _handleWindowMessage(event) {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "HA_TOGGLE_MENU") {
      this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
      return;
    }

    if (data.type === "HA_CALL_SERVICE" && this._hass) {
      const { domain, service, serviceData } = data;
      this._hass.callService(domain || "homeassistant", service || "toggle", serviceData || {});
      return;
    }

    if (data.type === "HA_RUNNER_MOUNTED") {
      if (this._hass) this._syncHassToRunner();
      if (this._config) this._syncConfigToRunner();
    }
  }

  _renderShell() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block !important;
          position: relative !important;
          width: 100% !important;
          height: 100vh !important;
          min-height: 100vh !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          background: #05131e;
        }

        :host([data-theme="light"]) {
          background: #edf3f6;
        }

        * { box-sizing: border-box; }

        .hub-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        /* Modern Lab Panel Dropdown Selector (Single Unified Header, No Double Menu) */
        .lab-dropdown-wrap {
          position: absolute;
          top: 12px;
          left: 175px;
          z-index: 50;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        @media (max-width: 600px) {
          .lab-dropdown-wrap {
            left: 56px;
            top: 10px;
          }
        }

        .lab-dropdown-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 12px;
          border-radius: 8px;
          background: rgba(13, 33, 50, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #f8fafc;
          cursor: pointer;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
          transition: all 180ms ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          user-select: none;
        }

        [data-theme="light"] .lab-dropdown-trigger {
          background: rgba(255, 255, 255, 0.92);
          border-color: rgba(8, 35, 52, 0.15);
          color: #082334;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .lab-dropdown-trigger:hover,
        .lab-dropdown-trigger.open {
          border-color: #f26522;
          background: rgba(242, 101, 34, 0.16);
          color: #f26522;
        }

        [data-theme="light"] .lab-dropdown-trigger:hover,
        [data-theme="light"] .lab-dropdown-trigger.open {
          background: #fff7ed;
          border-color: #f97316;
          color: #ea580c;
        }

        .lab-dropdown-label {
          max-width: 220px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lab-dropdown-arrow {
          transition: transform 200ms ease;
          opacity: 0.75;
          flex-shrink: 0;
        }

        .lab-dropdown-trigger.open .lab-dropdown-arrow {
          transform: rotate(180deg);
          opacity: 1;
        }

        /* Dropdown Overlay Menu */
        .lab-dropdown-menu {
          display: none;
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 250px;
          background: rgba(15, 23, 42, 0.97);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 6px;
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 100;
          animation: labDropdownFade 150ms ease-out;
        }

        [data-theme="light"] .lab-dropdown-menu {
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(0, 0, 0, 0.12);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
        }

        .lab-dropdown-menu.open {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        @keyframes labDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .lab-dropdown-heading {
          padding: 6px 10px 4px 10px;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.8px;
          color: #94a3b8;
          text-transform: uppercase;
        }

        [data-theme="light"] .lab-dropdown-heading {
          color: #64748b;
        }

        .lab-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: #cbd5e1;
          font-size: 12.5px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 140ms ease;
          width: 100%;
        }

        [data-theme="light"] .lab-dropdown-item {
          color: #334155;
        }

        .lab-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }

        [data-theme="light"] .lab-dropdown-item:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #0f172a;
        }

        .lab-dropdown-item.active {
          background: rgba(242, 101, 34, 0.18);
          color: #f26522;
          font-weight: 650;
        }

        [data-theme="light"] .lab-dropdown-item.active {
          background: #fff7ed;
          color: #ea580c;
        }

        .lab-dropdown-check {
          color: #f26522;
          flex-shrink: 0;
        }

        /* Top Hamburger Menu Button */
        .menu-btn-wrap {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 50;
        }

        .menu-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: rgba(13, 33, 50, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 180ms ease;
          padding: 0;
        }

        [data-theme="light"] .menu-btn {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(0, 0, 0, 0.08);
          color: #0f172a;
        }

        .menu-btn:hover {
          background: rgba(242, 101, 34, 0.15);
          border-color: #f26522;
          color: #f26522;
        }

        .menu-icon {
          width: 20px;
          height: 20px;
        }

        /* Floating Dev Toolbar */
        .dev-pill-trigger {
          position: absolute;
          bottom: 12px;
          right: 12px;
          z-index: 90;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(242, 101, 34, 0.25);
          border: 1px solid rgba(242, 101, 34, 0.6);
          cursor: pointer;
          opacity: 0.35;
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .dev-pill-trigger:hover {
          opacity: 1;
          transform: scale(1.15);
        }

        .dev-toolbar {
          display: none;
          position: absolute;
          bottom: 16px;
          right: 16px;
          z-index: 100;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 8px 14px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #f8fafc;
          font-size: 12px;
          align-items: center;
          gap: 12px;
        }

        .dev-toolbar.visible {
          display: flex;
        }

        .badge {
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.3px;
        }

        .badge.local {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .badge.dev {
          background: rgba(242, 101, 34, 0.18);
          border: 1px solid rgba(242, 101, 34, 0.5);
          color: #fb923c;
        }

        .dev-status {
          color: #94a3b8;
          font-size: 11px;
          max-width: 170px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dev-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 160ms ease;
        }

        .dev-btn:hover {
          background: #f26522;
          border-color: #f26522;
        }

        .dev-btn.mode-toggle {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .dev-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
        }

        .dev-close:hover { color: #fff; }
      </style>

      <div class="hub-container" data-theme="${this._theme}">
        ${this._isLabMode ? `
          <div class="lab-dropdown-wrap">
            <button class="lab-dropdown-trigger" id="lab-dropdown-btn" type="button" aria-haspopup="true" aria-expanded="false" title="Cambiar panel">
              <span class="lab-dropdown-label">${this._availableLabPanels.find((p) => p.id === this._activeLabPanelId)?.name || "Seleccionar Panel"}</span>
              <svg class="lab-dropdown-arrow" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div class="lab-dropdown-menu" id="lab-dropdown-menu">
              <div class="lab-dropdown-heading">Paneles del Sistema</div>
              ${this._availableLabPanels.map((p) => `
                <button
                  type="button"
                  class="lab-dropdown-item ${p.id === this._activeLabPanelId ? "active" : ""}"
                  data-lab-panel="${p.id}"
                >
                  <span>${p.name}</span>
                  ${p.id === this._activeLabPanelId ? `
                    <svg class="lab-dropdown-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ` : ""}
                </button>
              `).join("")}
            </div>
          </div>
        ` : `
          <div class="menu-btn-wrap">
            <button class="menu-btn" id="btn-toggle-menu" title="Menú Home Assistant">
              ${MENU_ICON}
            </button>
          </div>
        `}

        <button class="dev-pill-trigger" id="dev-trigger" title="Opciones de Desarrollo (Ctrl+Shift+D)"></button>

        <div class="dev-toolbar ${this._showDevBar ? "visible" : ""}" id="dev-toolbar">
          <span class="badge ${this._isDevMode ? "dev" : "local"}" id="dev-mode-badge">
            ${this._isDevMode ? "⚡ DEV (Vite)" : "🟢 LOCAL (HA OS)"}
          </span>
          <span class="dev-status" id="dev-status">Cargando...</span>
          <button class="dev-btn" id="btn-hot-reload" title="Recargar sin reiniciar HA (Ctrl+Shift+R)">
            ${RELOAD_ICON} Hot-Reload
          </button>
          <button class="dev-btn mode-toggle" id="btn-toggle-mode">
            ${this._isDevMode ? "Pasar a Local" : "Pasar a Dev"}
          </button>
          <button class="dev-close" id="btn-close-devbar">&times;</button>
        </div>

        <iframe allow="accelerometer; camera; gyroscope; vr"></iframe>
      </div>
    `;

    // Hook listeners
    if (this._isLabMode) {
      const trigger = this.shadowRoot.querySelector("#lab-dropdown-btn");
      const menu = this.shadowRoot.querySelector("#lab-dropdown-menu");

      const closeMenu = () => {
        trigger?.classList.remove("open");
        menu?.classList.remove("open");
        trigger?.setAttribute("aria-expanded", "false");
      };

      trigger?.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = menu?.classList.contains("open");
        if (isOpen) {
          closeMenu();
        } else {
          trigger.classList.add("open");
          menu?.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });

      this.shadowRoot.querySelectorAll(".lab-dropdown-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          const targetId = e.currentTarget.getAttribute("data-lab-panel");
          closeMenu();
          if (!targetId || targetId === this._activeLabPanelId) return;
          this._activeLabPanelId = targetId;
          try {
            localStorage.setItem("witmind_lab_active_panel", targetId);
          } catch {}
          this._renderShell();
          this._initRunner(true);
        });
      });

      const onDocClick = (e) => {
        if (!e.composedPath().includes(trigger) && !e.composedPath().includes(menu)) {
          closeMenu();
        }
      };
      window.addEventListener("click", onDocClick);
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
      });
    } else {
      this.shadowRoot.querySelector("#btn-toggle-menu")?.addEventListener("click", () => {
        this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
      });
    }

    this.shadowRoot.querySelector("#dev-trigger")?.addEventListener("click", () => {
      this._toggleDevBar();
    });

    this.shadowRoot.querySelector("#btn-close-devbar")?.addEventListener("click", () => {
      this._toggleDevBar();
    });

    this.shadowRoot.querySelector("#btn-hot-reload")?.addEventListener("click", () => {
      this._hotReload();
    });

    this.shadowRoot.querySelector("#btn-toggle-mode")?.addEventListener("click", () => {
      this._isDevMode = !this._isDevMode;
      localStorage.setItem("witmind_panel_mode", this._isDevMode ? "dev" : "local");
      const btn = this.shadowRoot.querySelector("#btn-toggle-mode");
      if (btn) btn.textContent = this._isDevMode ? "Pasar a Local" : "Pasar a Dev";
      this._initRunner(true);
    });
  }
}

/**
 * Helper to register a resilient panel custom element.
 */
export function registerResilientPanel(options) {
  const tagName = options.tag;
  if (!tagName) {
    throw new Error("[Witmind Hub] registerResilientPanel requiere propiedad 'tag'.");
  }

  if (!customElements.get(tagName)) {
    customElements.define(
      tagName,
      class extends WitmindPanelHub {
        constructor() {
          super(options);
        }
      }
    );
    console.info(`[Witmind Hub] Panel Resiliente registrado: <${tagName}>`);
  }
}

// Default registration for universal panel tag
if (!customElements.get("witmind-panel-hub")) {
  customElements.define("witmind-panel-hub", WitmindPanelHub);
}

// Registration for experimental parallel laboratory panel (strictly isolated)
if (!customElements.get("witmind-lab-panel")) {
  customElements.define(
    "witmind-lab-panel",
    class extends WitmindPanelHub {
      constructor() {
        super({ isLabMode: true });
      }
    }
  );
}

