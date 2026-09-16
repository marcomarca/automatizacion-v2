// Witmind 3D Custom Panel v3.4.0 (1788809439970) — Sandboxed Iframe Architecture
// Cero conflicto con LitElement/Polymer de Home Assistant y 100% aislado.
// Soporta: Pre-flight probe de red, fallback local automático y sincronización de tema claro/oscuro.

const MENU_ICON = `
  <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6.5h18M3 12h18M3 17.5h18"></path>
  </svg>
`;

async function checkServerAvailability(url, timeoutMs = 800) {
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

class Witmind3DPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = {};
    this._iframe = null;
    this._readyReceived = false;
    this._readyTimeoutId = null;
    this._toastTimeoutId = null;
    this._theme = this._loadTheme();
    this._statesScheduled = false;

    this._handleWindowMessage = this._handleWindowMessage.bind(this);

    this.shadowRoot.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      const action = target.dataset.action;
      if (action === "toggle-menu") {
        this._toggleHomeAssistantMenu();
      } else if (action === "close-toast") {
        this._hideToast();
      }
    });
  }

  _loadTheme() {
    try {
      const stored = localStorage.getItem("witmind-showroom-panel-theme");
      if (stored === "dark" || stored === "light") return stored;
    } catch {}
    return this._hass?.themes?.darkMode === true ? "dark" : "light";
  }

  _applyTheme() {
    this.setAttribute("data-theme", this._theme);
    this.style.background = this._theme === "light" ? "#edf3f6" : "#05131e";
  }

  _toggleHomeAssistantMenu() {
    this.dispatchEvent(
      new Event("hass-toggle-menu", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _getRoom() {
    if (this._config && this._config.room) {
      return this._config.room;
    }
    const tag = this.tagName.toLowerCase();
    if (tag.includes("lobby") || window.location.pathname.includes("lobby")) {
      return "lobby";
    }
    return "showroom";
  }

  _getConfiguredDevUrl() {
    return (
      localStorage.getItem("witmind_3d_dev_url") ||
      (this._config && this._config.dev_url ? this._config.dev_url.replace(/\/+$/, "") : null) ||
      "http://192.168.20.44:5173"
    );
  }

  _isDevModePreferred() {
    const savedMode = localStorage.getItem("witmind_3d_mode");
    return savedMode === "dev";
  }

  set hass(hass) {
    this._hass = hass;
    if (!localStorage.getItem("witmind-showroom-panel-theme") && hass?.themes) {
      const hassTheme = hass.themes.darkMode === true ? "dark" : "light";
      if (this._theme !== hassTheme) {
        this._theme = hassTheme;
        this._applyTheme();
      }
    }
    this._scheduleStatesToIframe();
  }

  _scheduleStatesToIframe() {
    if (this._statesScheduled) return;
    this._statesScheduled = true;
    requestAnimationFrame(() => {
      this._statesScheduled = false;
      this._sendStatesToIframe();
    });
  }

  _sendStatesToIframe() {
    if (!this._iframe || !this._iframe.contentWindow || !this._hass || !this._hass.states) {
      return;
    }
    try {
      const safeStates = {};
      for (const id in this._hass.states) {
        const entity = this._hass.states[id];
        if (entity) {
          safeStates[id] = {
            entity_id: entity.entity_id,
            state: entity.state,
            attributes: entity.attributes || {},
            last_changed: entity.last_changed,
            last_updated: entity.last_updated,
          };
        }
      }

      // Check if we have a saved camera for this room in parent storage
      const targetRoom = this._getRoom();
      let savedCamera = null;
      try {
        const rawCam = localStorage.getItem("room_camera_" + targetRoom) ||
          localStorage.getItem("witmind_camera_" + targetRoom);
        if (rawCam) savedCamera = JSON.parse(rawCam);
      } catch {}

      this._iframe.contentWindow.postMessage(
        {
          type: "HA_STATES",
          states: safeStates,
          camera: savedCamera,
        },
        "*"
      );
    } catch (err) {
      console.warn("[Witmind 3D] Error forwarding HA_STATES to iframe:", err);
    }
  }

  set panel(panel) {
    if (panel && panel.config) {
      this._config = panel.config;
      this._updateIframe();
    }
  }

  setConfig(config) {
    this._config = config || {};
    this._updateIframe();
  }

  _applyHostStyles() {
    this.style.display = "block";
    this.style.position = "relative";
    this.style.width = "100%";
    this.style.height = "100vh";
    this.style.minHeight = "100vh";
    this.style.boxSizing = "border-box";
    this.style.overflow = "hidden";
    this._applyTheme();
  }

  _showToast(message, type = "info") {
    const toast = this.shadowRoot.querySelector("#toast");
    const toastText = this.shadowRoot.querySelector("#toast-text");
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.className = `toast show ${type}`;
    if (this._toastTimeoutId) clearTimeout(this._toastTimeoutId);
    this._toastTimeoutId = setTimeout(() => {
      this._hideToast();
    }, 5500);
  }

  _hideToast() {
    const toast = this.shadowRoot.querySelector("#toast");
    if (toast) toast.classList.remove("show");
  }

  async _updateIframe() {
    this._applyHostStyles();

    const targetRoom = this._getRoom();
    const devUrl = this._getConfiguredDevUrl();
    const isDevPreferred = this._isDevModePreferred();
    const nowTs = Date.now();
    const prodSrc = `/local/3d-app/index.html?room=${encodeURIComponent(targetRoom)}&lockRoom=true&v=${nowTs}`;
    const devSrc = `${devUrl}/?room=${encodeURIComponent(targetRoom)}&lockRoom=true&v=${nowTs}`;

    if (!this.shadowRoot.querySelector(".panel-container")) {
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
            background: #edf3f6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --surface-control: rgba(255, 255, 255, 0.85);
            --border-default: rgba(8, 35, 52, 0.12);
            --text-primary: rgba(8, 35, 52, 0.94);
            --shadow-btn: 0 2px 10px rgba(15, 30, 45, 0.10);
          }
          :host([data-theme="dark"]) {
            background: #05131e !important;
            --surface-control: rgba(6, 28, 43, 0.88);
            --border-default: rgba(255, 255, 255, 0.14);
            --text-primary: rgba(255, 255, 255, 0.92);
            --shadow-btn: 0 4px 16px rgba(0, 0, 0, 0.4);
          }
          :host([data-theme="light"]) {
            background: #edf3f6 !important;
            --surface-control: rgba(255, 255, 255, 0.85);
            --border-default: rgba(8, 35, 52, 0.12);
            --text-primary: rgba(8, 35, 52, 0.94);
            --shadow-btn: 0 2px 10px rgba(15, 30, 45, 0.10);
          }
          .panel-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          .top-bar {
            position: absolute;
            top: 11px;
            left: 16px;
            z-index: 1000;
            display: flex;
            align-items: center;
          }
          .menu-button {
            display: grid;
            place-items: center;
            border: 1px solid var(--border-default);
            border-radius: 50%;
            background: var(--surface-control);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            color: var(--text-primary);
            cursor: pointer;
            box-shadow: var(--shadow-btn);
            transition: all 180ms ease;
            user-select: none;
            width: 42px;
            height: 42px;
            padding: 0;
          }
          .menu-button:hover {
            background: rgba(242, 101, 34, 0.12);
            border-color: #f26522;
            color: #f26522;
            transform: translateY(-1px);
          }
          .menu-icon {
            width: 20px;
            height: 20px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          @media (max-width: 768px) {
            .top-bar {
              top: 8px;
              left: 10px;
            }
            .menu-button {
              width: 36px;
              height: 36px;
            }
            .menu-icon {
              width: 18px;
              height: 18px;
            }
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
          .toast {
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            padding: 10px 18px;
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.95);
            color: #fff;
            font-size: 13px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.15);
            z-index: 2000;
            opacity: 0;
            transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
          }
          .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
            pointer-events: auto;
          }
          .toast.warning {
            border-color: #f59e0b;
            background: rgba(30, 20, 5, 0.96);
            color: #fef3c7;
          }
          .toast-close {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            font-size: 16px;
            cursor: pointer;
            padding: 0 4px;
          }
        </style>
        <div class="panel-container">
          <div class="top-bar">
            <button
              class="menu-button"
              data-action="toggle-menu"
              aria-label="Abrir menú de navegación de Home Assistant"
              title="Abrir menú"
            >${MENU_ICON}</button>
          </div>

          <div id="toast" class="toast">
            <span id="toast-text"></span>
            <button class="toast-close" data-action="close-toast">&times;</button>
          </div>

          <iframe allow="accelerometer; camera; gyroscope; vr"></iframe>
        </div>
      `;
      this._iframe = this.shadowRoot.querySelector("iframe");
    }

    const iframeEl = this._iframe || this.shadowRoot.querySelector("iframe");
    if (!iframeEl) return;

    if (this._readyTimeoutId) {
      clearTimeout(this._readyTimeoutId);
      this._readyTimeoutId = null;
    }
    this._readyReceived = false;

    // CASO 1: Modo Local (Predeterminado y Estable)
    if (!isDevPreferred) {
      console.log("[Witmind 3D] 📦 Cargando VERSIÓN LOCAL desde Home Assistant OS");
      iframeEl.src = prodSrc;
      return;
    }

    // CASO 2: Modo Dev Solicitado — Pre-flight Probe
    console.log("[Witmind 3D] 🔍 Comprobando disponibilidad del servidor Vite en:", devUrl);

    const isServerAlive = await checkServerAvailability(devUrl, 850);

    if (isServerAlive) {
      console.log("[Witmind 3D] ⚡ Servidor Vite ACTIVO. Conectando a Hot-Reload:", devUrl);
      iframeEl.src = devSrc;

      // Guardián de Handshake postMessage (4 segundos)
      this._readyTimeoutId = setTimeout(() => {
        if (!this._readyReceived) {
          console.warn("[Witmind 3D] Dev server no completó handshake HA_READY en 4s. Fallback silencioso a versión local...");
          try {
            localStorage.setItem("witmind_3d_mode", "local");
          } catch {}
          iframeEl.src = prodSrc;
        }
      }, 4000);
    } else {
      console.warn("[Witmind 3D] ℹ️ Servidor Vite no detectado en", devUrl, "-> Fallback silencioso a versión local.");
      try {
        localStorage.setItem("witmind_3d_mode", "local");
      } catch {}
      iframeEl.src = prodSrc;
    }
  }

  connectedCallback() {
    this._theme = this._loadTheme();
    this._applyHostStyles();
    this._updateIframe();
    window.addEventListener("message", this._handleWindowMessage);
  }

  disconnectedCallback() {
    window.removeEventListener("message", this._handleWindowMessage);
    if (this._readyTimeoutId) clearTimeout(this._readyTimeoutId);
    if (this._toastTimeoutId) clearTimeout(this._toastTimeoutId);
    this._iframe = null;
  }

  _handleWindowMessage(event) {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    // When 3D app updates theme (light/dark)
    if (data.type === "HA_THEME_CHANGED" && (data.theme === "light" || data.theme === "dark")) {
      this._theme = data.theme;
      this._applyTheme();
      try {
        localStorage.setItem("witmind-showroom-panel-theme", this._theme);
      } catch {}
      return;
    }

    // When 3D app saves camera calibration
    if (data.type === "HA_SAVE_CAMERA" && data.roomId && data.camera) {
      try {
        localStorage.setItem("room_camera_" + data.roomId, JSON.stringify(data.camera));
        localStorage.setItem("witmind_camera_" + data.roomId, JSON.stringify(data.camera));
      } catch (err) {
        console.warn("[Witmind 3D] Error saving camera in parent localStorage:", err);
      }
      return;
    }

    // When 3D app updates connection mode from Ajustes Avanzados
    if (data.type === "HA_SET_CONNECTION_MODE") {
      console.log("[Witmind 3D] Modo de conexión actualizado desde Ajustes:", data);
      if (data.mode) localStorage.setItem("witmind_3d_mode", data.mode);
      if (data.devUrl) localStorage.setItem("witmind_3d_dev_url", data.devUrl);
      this._updateIframe();
      return;
    }

    // When the 3D iframe is ready and requests initial state
    if (data.type === "HA_READY") {
      this._readyReceived = true;
      if (this._readyTimeoutId) {
        clearTimeout(this._readyTimeoutId);
        this._readyTimeoutId = null;
      }
      this._sendStatesToIframe();
      return;
    }

    // When user clicks the sidebar hamburger menu button
    if (data.type === "HA_TOGGLE_MENU") {
      this.dispatchEvent(
        new Event("hass-toggle-menu", {
          bubbles: true,
          composed: true,
        })
      );
      return;
    }

    // When a circuit is clicked in 3D, call Home Assistant service
    if (data.type === "HA_CALL_SERVICE" && this._hass) {
      const { domain, service, serviceData } = data;
      this._hass.callService(domain || "switch", service || "toggle", serviceData || {});
    }
  }
}

// Register custom elements for Home Assistant sidebar
if (!customElements.get("showroom-3d-panel")) {
  customElements.define("showroom-3d-panel", class extends Witmind3DPanel {});
}
if (!customElements.get("lobby-3d-panel")) {
  customElements.define("lobby-3d-panel", class extends Witmind3DPanel {});
}
if (!customElements.get("witmind-3d-panel")) {
  customElements.define("witmind-3d-panel", Witmind3DPanel);
}

console.log("[Witmind 3D] Sandboxed Custom Panels registered: <showroom-3d-panel>, <lobby-3d-panel>, <witmind-3d-panel>");
