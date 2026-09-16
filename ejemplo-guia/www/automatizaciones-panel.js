// Witmind Automatizaciones Panel v1.2.0
// Panel independiente: no modifica ni depende de oficinas-panel.js.

const DEFAULT_AUTOMATIONS_PANEL_CONFIG = Object.freeze({
  title: "Automatizaciones",
  subtitle: "Control de procesos",
  siteLabel: "WTX · MDTC",
  automationEntity: "automation.taller_ciclo_10s",
  targetEntity: "switch.taller_interruptor_1",
  targetName: "Taller",
  notificationEntity: "notify.m2102j20sg",
  notificationTitle: "Prueba Home Assistant",
  notificationMessage: "Notificación enviada desde el panel de Automatizaciones Witmind.",
});

const MENU_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6.5h18M3 12h18M3 17.5h18"></path>
  </svg>
`;

const AUTOMATION_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a3 3 0 0 1 3 3v1.1c.6.25 1.15.57 1.66.96l.96-.56a3 3 0 1 1 3 5.2l-.97.56c.08.61.08 1.23 0 1.84l.97.56a3 3 0 1 1-3 5.2l-.96-.56c-.51.39-1.06.71-1.66.96V21a3 3 0 1 1-6 0v-1.1a7.1 7.1 0 0 1-1.66-.96l-.96.56a3 3 0 1 1-3-5.2l.97-.56a7.2 7.2 0 0 1 0-1.84l-.97-.56a3 3 0 1 1 3-5.2l.96.56A7.1 7.1 0 0 1 9 6.1V5a3 3 0 0 1 3-3Zm0 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"></path>
  </svg>
`;

const POWER_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 2h2v10h-2V2Zm5.7 3.9 1.4-1.4A9 9 0 1 1 5.9 4.5l1.4 1.4A7 7 0 1 0 16.7 5.9Z"></path>
  </svg>
`;

const CLOCK_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3h2v4.6l3.2 1.9-1 1.7-4.2-2.5V7Z"></path>
  </svg>
`;

const THEME_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.2 15.4A8.1 8.1 0 0 1 8.6 3.8a8.65 8.65 0 1 0 11.6 11.6Z"></path>
  </svg>
`;

const NOTIFICATION_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-5v-5a7 7 0 0 0-5-6.71V4a2 2 0 1 0-4 0v1.29A7 7 0 0 0 5 12v5l-2 2h18l-2-2Zm-2 0H7v-5a5 5 0 0 1 10 0v5Z"></path>
  </svg>
`;

class AutomatizacionesPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._pending = false;
    this._notificationPending = false;
    this._error = "";
    this._notificationError = "";
    this._toast = "";
    this._toastTimer = null;
    this._clockTimer = null;
    this._themeStorageKey = "witmind-automatizaciones-panel-theme";
    this._theme = this._loadTheme();

    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
  }

  set hass(value) {
    this._hass = value;
    this.render();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    this._panel = value;
    if (this._hass) this.render();
  }

  get panel() {
    return this._panel;
  }

  set narrow(value) {
    this._narrow = Boolean(value);
    if (this._hass) this.render();
  }

  get narrow() {
    return this._narrow;
  }

  connectedCallback() {
    if (!this._clockTimer) {
      this._clockTimer = setInterval(() => this.render(), 1000);
    }
    if (this._hass) this.render();
  }

  disconnectedCallback() {
    clearInterval(this._clockTimer);
    clearTimeout(this._toastTimer);
    this._clockTimer = null;
  }

  _config() {
    const raw = this._panel?.config || {};
    return {
      title: raw.title || DEFAULT_AUTOMATIONS_PANEL_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_AUTOMATIONS_PANEL_CONFIG.subtitle,
      siteLabel:
        raw.site_label || raw.siteLabel || DEFAULT_AUTOMATIONS_PANEL_CONFIG.siteLabel,
      automationEntity:
        raw.automation_entity ||
        raw.automationEntity ||
        DEFAULT_AUTOMATIONS_PANEL_CONFIG.automationEntity,
      targetEntity:
        raw.target_entity ||
        raw.targetEntity ||
        DEFAULT_AUTOMATIONS_PANEL_CONFIG.targetEntity,
      targetName:
        raw.target_name || raw.targetName || DEFAULT_AUTOMATIONS_PANEL_CONFIG.targetName,
      notificationEntity:
        raw.notification_entity ||
        raw.notificationEntity ||
        DEFAULT_AUTOMATIONS_PANEL_CONFIG.notificationEntity,
      notificationTitle:
        raw.notification_title ||
        raw.notificationTitle ||
        DEFAULT_AUTOMATIONS_PANEL_CONFIG.notificationTitle,
      notificationMessage:
        raw.notification_message ||
        raw.notificationMessage ||
        DEFAULT_AUTOMATIONS_PANEL_CONFIG.notificationMessage,
    };
  }

  _state(entityId) {
    return this._hass?.states?.[entityId] || null;
  }

  _notificationAction(entityId) {
    const notifyEntity = this._state(entityId);
    const sendMessageAvailable = Boolean(this._hass?.services?.notify?.send_message);

    // Home Assistant actual: notify.send_message dirigido a una entidad notify.*.
    if (notifyEntity && notifyEntity.state !== "unavailable" && sendMessageAvailable) {
      return { domain: "notify", service: "send_message", mode: "entity" };
    }

    // Compatibilidad con instalaciones que todavía exponen notify.nombre_dispositivo.
    const [domain, service, ...extra] = String(entityId || "").split(".");
    if (
      domain === "notify" &&
      service &&
      !extra.length &&
      this._hass?.services?.[domain]?.[service]
    ) {
      return { domain, service, mode: "legacy" };
    }

    return null;
  }

  _notificationAvailable(entityId) {
    return Boolean(this._notificationAction(entityId));
  }

  _loadTheme() {
    try {
      return localStorage.getItem(this._themeStorageKey) === "dark" ? "dark" : "light";
    } catch (_error) {
      return "light";
    }
  }

  _saveTheme() {
    try {
      localStorage.setItem(this._themeStorageKey, this._theme);
    } catch (_error) {
      // El tema es una preferencia visual; no afecta el estado operativo.
    }
  }

  _toggleTheme() {
    this._theme = this._theme === "dark" ? "light" : "dark";
    this._saveTheme();
    this.render();
  }

  _toggleMenu() {
    this.dispatchEvent(
      new Event("hass-toggle-menu", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  _showToast(message) {
    this._toast = message;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast = "";
      this.render();
    }, 3500);
    this.render();
  }

  async _toggleAutomation() {
    if (!this._hass || this._pending) return;

    const config = this._config();
    const automationState = this._state(config.automationEntity)?.state;
    const enabled = automationState === "on";

    if (!automationState || ["unknown", "unavailable"].includes(automationState)) {
      this._error = `No se encontró ${config.automationEntity}`;
      this.render();
      return;
    }

    this._pending = true;
    this._error = "";
    this.render();

    try {
      if (enabled) {
        await this._hass.callService("automation", "turn_off", {
          entity_id: config.automationEntity,
          stop_actions: true,
        });

        // Garantiza un estado seguro si la automatización se desactiva
        // durante los 10 segundos en que el circuito estaba encendido.
        await this._hass.callService("switch", "turn_off", {
          entity_id: config.targetEntity,
        });

        this._showToast("Automatización detenida y circuito apagado.");
      } else {
        await this._hass.callService("automation", "turn_on", {
          entity_id: config.automationEntity,
        });

        this._showToast("Automatización activada. Esperará el siguiente ciclo.");
      }
    } catch (error) {
      this._error = "No se pudo cambiar el estado de la automatización.";
      console.error("Error controlando la automatización:", error);
    } finally {
      this._pending = false;
      this.render();
    }
  }

  async _sendTestNotification() {
    if (!this._hass || this._notificationPending) return;

    const config = this._config();
    const notificationAction = this._notificationAction(config.notificationEntity);

    if (!notificationAction) {
      this._notificationError = `No se encontró la entidad o servicio ${config.notificationEntity}`;
      this.render();
      return;
    }

    this._notificationPending = true;
    this._notificationError = "";
    this.render();

    try {
      const serviceData = {
        title: config.notificationTitle,
        message: config.notificationMessage,
      };
      const target =
        notificationAction.mode === "entity"
          ? { entity_id: config.notificationEntity }
          : undefined;

      await this._hass.callService(
        notificationAction.domain,
        notificationAction.service,
        serviceData,
        target,
      );

      this._showToast("Notificación de prueba enviada al smartphone.");
    } catch (error) {
      this._notificationError = `No se pudo ejecutar ${config.notificationEntity}.`;
      console.error("Error enviando la notificación de prueba:", error);
    } finally {
      this._notificationPending = false;
      this.render();
    }
  }

  _handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    if (action === "toggle-menu") {
      this._toggleMenu();
    } else if (action === "toggle-theme") {
      this._toggleTheme();
    } else if (action === "toggle-automation") {
      this._toggleAutomation();
    } else if (action === "send-notification") {
      this._sendTestNotification();
    }
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _formatDate(value) {
    if (!value) return "Todavía no se ejecutó";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Fecha no disponible";

    return new Intl.DateTimeFormat("es-BO", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(date);
  }

  _nextEvent(enabled) {
    if (!enabled) {
      return {
        label: "Sin eventos programados",
        countdown: "Activa la automatización para iniciar",
      };
    }

    const now = new Date();
    const currentSecond = now.getSeconds();
    const events = [
      { second: 0, action: "Encender" },
      { second: 10, action: "Apagar" },
      { second: 20, action: "Encender" },
      { second: 30, action: "Apagar" },
      { second: 40, action: "Encender" },
      { second: 50, action: "Apagar" },
      { second: 60, action: "Encender" },
    ];

    const next = events.find((item) => item.second > currentSecond) || events[events.length - 1];
    const remaining = Math.max(1, next.second - currentSecond);

    return {
      label: `${next.action} ${this._config().targetName}`,
      countdown: `en ${remaining} segundo${remaining === 1 ? "" : "s"}`,
    };
  }

  render() {
    if (!this._hass || !this.shadowRoot) return;

    const config = this._config();
    const automation = this._state(config.automationEntity);
    const target = this._state(config.targetEntity);
    const automationAvailable = Boolean(
      automation && !["unknown", "unavailable"].includes(automation.state),
    );
    const targetAvailable = Boolean(
      target && !["unknown", "unavailable"].includes(target.state),
    );
    const notificationAvailable = this._notificationAvailable(config.notificationEntity);
    const enabled = automation?.state === "on";
    const targetOn = target?.state === "on";
    const lastTriggered = automation?.attributes?.last_triggered;
    const nextEvent = this._nextEvent(enabled);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100%;
          color: ${this._theme === "dark" ? "#edf3f9" : "#15202b"};
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        * { box-sizing: border-box; }
        button { font: inherit; }

        .page {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at 12% 4%, ${this._theme === "dark" ? "rgba(32, 125, 178, .24)" : "rgba(23, 125, 177, .13)"}, transparent 34%),
            ${this._theme === "dark" ? "#10161c" : "#f3f6f8"};
        }

        .shell {
          width: min(1040px, 100%);
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
        }

        .topbar-left,
        .topbar-actions,
        .brand {
          display: flex;
          align-items: center;
        }

        .topbar-left { gap: 14px; }
        .topbar-actions { gap: 10px; }
        .brand { gap: 12px; }

        .icon-button {
          width: 44px;
          height: 44px;
          border: 1px solid ${this._theme === "dark" ? "#2b3945" : "#d7e0e7"};
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: ${this._theme === "dark" ? "#182129" : "rgba(255,255,255,.88)"};
          color: inherit;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(18, 35, 47, .08);
        }

        .icon-button svg {
          width: 22px;
          height: 22px;
          fill: currentColor;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #0878ad;
          color: #fff;
          font-weight: 800;
          letter-spacing: .04em;
        }

        .brand-copy strong,
        .brand-copy span { display: block; }
        .brand-copy strong { font-size: 15px; }
        .brand-copy span { margin-top: 2px; font-size: 12px; opacity: .66; }

        .hero {
          margin-bottom: 20px;
        }

        .eyebrow {
          display: inline-flex;
          margin-bottom: 8px;
          color: #0878ad;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        h1, h2, p { margin: 0; }
        h1 { font-size: clamp(30px, 6vw, 52px); line-height: 1.05; letter-spacing: -.04em; }
        .hero p { margin-top: 10px; font-size: 16px; opacity: .67; }

        .grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(280px, .75fr);
          gap: 18px;
        }

        .card {
          border: 1px solid ${this._theme === "dark" ? "#2b3945" : "#dce4e9"};
          border-radius: 24px;
          background: ${this._theme === "dark" ? "rgba(24,33,41,.94)" : "rgba(255,255,255,.92)"};
          box-shadow: 0 22px 50px rgba(18, 35, 47, .10);
        }

        .automation-card { padding: 26px; }

        .automation-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
        }

        .automation-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .automation-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          background: ${enabled ? "#0878ad" : this._theme === "dark" ? "#28343d" : "#e9eef2"};
          color: ${enabled ? "#fff" : "inherit"};
        }

        .automation-icon svg,
        .metric-icon svg {
          width: 27px;
          height: 27px;
          fill: currentColor;
        }

        .automation-title h2 { font-size: 22px; letter-spacing: -.02em; }
        .automation-title p { margin-top: 5px; font-size: 13px; opacity: .63; }

        .status-pill {
          flex: 0 0 auto;
          padding: 8px 12px;
          border-radius: 999px;
          background: ${enabled ? "rgba(16, 150, 103, .13)" : "rgba(118, 132, 143, .15)"};
          color: ${enabled ? "#0c9967" : this._theme === "dark" ? "#b6c2cc" : "#667785"};
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }

        .metric {
          min-height: 118px;
          padding: 17px;
          border-radius: 18px;
          background: ${this._theme === "dark" ? "#121a20" : "#f4f7f9"};
        }

        .metric-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
          color: #0878ad;
        }

        .metric small,
        .metric strong,
        .metric span { display: block; }
        .metric small { margin-bottom: 5px; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
        .metric strong { font-size: 16px; }
        .metric span { margin-top: 4px; font-size: 12px; opacity: .62; }

        .toggle-button {
          width: 100%;
          min-height: 58px;
          border: 0;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          background: ${enabled ? "#c43d3d" : "#0878ad"};
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 14px 28px ${enabled ? "rgba(196,61,61,.22)" : "rgba(8,120,173,.24)"};
        }

        .toggle-button:disabled { opacity: .48; cursor: not-allowed; box-shadow: none; }
        .toggle-button svg { width: 22px; height: 22px; fill: currentColor; }

        .notification-button {
          width: 100%;
          min-height: 50px;
          margin-top: 18px;
          border: 0;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 16px;
          background: #0878ad;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 12px 24px rgba(8,120,173,.22);
        }

        .notification-button:disabled { opacity: .48; cursor: not-allowed; box-shadow: none; }
        .notification-button svg { width: 21px; height: 21px; fill: currentColor; }

        .service-state {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          font-size: 12px;
          font-weight: 800;
        }

        .service-state::before {
          content: "";
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: ${notificationAvailable ? "#19a974" : "#c43d3d"};
        }

        .side-card { padding: 22px; }
        .side-card + .side-card { margin-top: 18px; }
        .side-card h2 { font-size: 18px; }
        .side-card p { margin-top: 8px; font-size: 13px; line-height: 1.55; opacity: .68; }

        .circuit-state {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid ${this._theme === "dark" ? "#2b3945" : "#e2e8ec"};
        }

        .circuit-state strong { font-size: 18px; }
        .state-dot {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: ${targetOn ? "#19a974" : "#8998a4"};
          box-shadow: ${targetOn ? "0 0 0 7px rgba(25,169,116,.12)" : "none"};
        }

        .schedule {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 6px;
          margin-top: 18px;
        }

        .schedule span {
          padding: 9px 4px;
          border-radius: 11px;
          text-align: center;
          background: ${this._theme === "dark" ? "#121a20" : "#f2f5f7"};
          font-size: 11px;
          font-weight: 800;
        }

        .schedule span:nth-child(odd) { color: #0c9967; }
        .schedule span:nth-child(even) { color: #7a8994; }

        .error {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 13px;
          background: rgba(196, 61, 61, .12);
          color: #c43d3d;
          font-size: 13px;
          font-weight: 700;
        }

        .entity-note {
          margin-top: 15px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 11px;
          opacity: .48;
          overflow-wrap: anywhere;
        }

        .toast {
          position: fixed;
          right: 24px;
          bottom: 24px;
          max-width: min(420px, calc(100vw - 48px));
          padding: 14px 17px;
          border-radius: 15px;
          background: ${this._theme === "dark" ? "#edf3f9" : "#14212a"};
          color: ${this._theme === "dark" ? "#14212a" : "#fff"};
          box-shadow: 0 20px 45px rgba(0,0,0,.24);
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 760px) {
          .page { padding: 16px; }
          .grid { grid-template-columns: 1fr; }
          .metrics { grid-template-columns: 1fr; }
          .automation-head { align-items: center; }
          .automation-title h2 { font-size: 19px; }
        }
      </style>

      <div class="page">
        <div class="shell">
          <header class="topbar">
            <div class="topbar-left">
              <button class="icon-button" data-action="toggle-menu" aria-label="Abrir menú">
                ${MENU_ICON}
              </button>
              <div class="brand">
                <div class="brand-mark">WM</div>
                <div class="brand-copy">
                  <strong>${this._escape(config.siteLabel)}</strong>
                  <span>Panel independiente</span>
                </div>
              </div>
            </div>

            <div class="topbar-actions">
              <button class="icon-button" data-action="toggle-theme" aria-label="Cambiar tema">
                ${THEME_ICON}
              </button>
            </div>
          </header>

          <section class="hero">
            <span class="eyebrow">Control dedicado</span>
            <h1>${this._escape(config.title)}</h1>
            <p>${this._escape(config.subtitle)}</p>
          </section>

          <main class="grid">
            <section class="card automation-card">
              <div class="automation-head">
                <div class="automation-title">
                  <span class="automation-icon">${AUTOMATION_ICON}</span>
                  <div>
                    <h2>Ciclo de ${this._escape(config.targetName)}</h2>
                    <p>10 segundos encendido · 10 segundos apagado</p>
                  </div>
                </div>
                <span class="status-pill">
                  ${automationAvailable ? (enabled ? "Activa" : "Detenida") : "No disponible"}
                </span>
              </div>

              <div class="metrics">
                <div class="metric">
                  <span class="metric-icon">${CLOCK_ICON}</span>
                  <small>Próximo evento</small>
                  <strong>${this._escape(nextEvent.label)}</strong>
                  <span>${this._escape(nextEvent.countdown)}</span>
                </div>

                <div class="metric">
                  <span class="metric-icon">${AUTOMATION_ICON}</span>
                  <small>Última ejecución</small>
                  <strong>${this._escape(this._formatDate(lastTriggered))}</strong>
                  <span>Home Assistant guarda hasta 20 trazas</span>
                </div>
              </div>

              <button
                class="toggle-button"
                data-action="toggle-automation"
                ${!automationAvailable || this._pending ? "disabled" : ""}
              >
                ${POWER_ICON}
                ${this._pending ? "Procesando…" : enabled ? "Detener automatización" : "Activar automatización"}
              </button>

              ${this._error ? `<div class="error">${this._escape(this._error)}</div>` : ""}
              <div class="entity-note">${this._escape(config.automationEntity)}</div>
            </section>

            <aside>
              <section class="card side-card">
                <span class="eyebrow">Circuito controlado</span>
                <h2>${this._escape(config.targetName)}</h2>
                <p>Al detener la automatización, este circuito se apaga inmediatamente aunque el ciclo estuviera ejecutándose.</p>
                <div class="circuit-state">
                  <div>
                    <small>Estado actual</small>
                    <strong>${targetAvailable ? (targetOn ? "Encendido" : "Apagado") : "No disponible"}</strong>
                  </div>
                  <span class="state-dot"></span>
                </div>
                <div class="entity-note">${this._escape(config.targetEntity)}</div>
              </section>

              <section class="card side-card">
                <span class="eyebrow">Smartphone</span>
                <h2>Prueba de notificación</h2>
                <p>Envía un mensaje de prueba directamente al servicio configurado. No depende de la automatización del Taller.</p>
                <div class="service-state">
                  ${notificationAvailable ? "Servicio disponible" : "Servicio no disponible"}
                </div>
                <button
                  class="notification-button"
                  data-action="send-notification"
                  ${!notificationAvailable || this._notificationPending ? "disabled" : ""}
                >
                  ${NOTIFICATION_ICON}
                  ${this._notificationPending ? "Enviando…" : "Enviar notificación de prueba"}
                </button>
                ${this._notificationError ? `<div class="error">${this._escape(this._notificationError)}</div>` : ""}
                <div class="entity-note">${this._escape(config.notificationEntity)}</div>
              </section>

              <section class="card side-card">
                <span class="eyebrow">Secuencia por minuto</span>
                <h2>Ritmo del ciclo</h2>
                <p>La automatización se sincroniza con el reloj del servidor.</p>
                <div class="schedule" aria-label="Secuencia de encendido y apagado">
                  <span>00 ON</span>
                  <span>10 OFF</span>
                  <span>20 ON</span>
                  <span>30 OFF</span>
                  <span>40 ON</span>
                  <span>50 OFF</span>
                </div>
              </section>
            </aside>
          </main>
        </div>

        ${this._toast ? `<div class="toast" role="status">${this._escape(this._toast)}</div>` : ""}
      </div>
    `;
  }
}

if (!customElements.get("automatizaciones-panel")) {
  customElements.define("automatizaciones-panel", AutomatizacionesPanel);
}
