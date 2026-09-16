// Colgante Showroom v1.0.4
// Custom panel de Home Assistant derivado directamente de panel-backlit-showroom v1.2.0.
// Estado real: switch.interruptor_inteligente_2_switch_2 (muestra Colgantes, configurable desde panel_custom).

const COLGANTE_DEFAULTS = Object.freeze({
  entity: "switch.interruptor_inteligente_2_switch_2",
  sceneControlEntities: [
    "switch.interruptor_inteligente_switch_1",
    "switch.interruptor_inteligente_switch_2",
    "switch.interruptor_inteligente_switch_3",
    "switch.interruptor_inteligente_switch_4",
    "switch.interruptor_inteligente_2_switch_1",
    "switch.interruptor_inteligente_2_switch_2",
    "switch.interruptor_inteligente_2_switch_3",
    "switch.interruptor_inteligente_2_switch_4",
    "switch.smart_relay_switch_4_switch",
  ],
  officeOnImage: "/local/colgantes/colgantes-img-on.png",
  officeOffImage: "/local/colgantes/colgantes-img-off.png",
  panelOnImage: "/local/colgantes/colgante-on.png",
  panelOffImage: "/local/colgantes/colgante-off.png",
});

class ColganteShowroom extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._panel = null;
    this._pendingDesired = "";
    this._pendingTimer = null;
    this._lastError = "";
    this._officeScrollTop = 0;
    this._specsScrollTop = 0;
    this._lastRenderedState = null;

    this.shadowRoot.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      if (target.dataset.action === "toggle-panel") this._togglePanel();
      if (target.dataset.action === "toggle-menu") this._toggleHomeAssistantMenu();
    });

    this.shadowRoot.addEventListener("keydown", (event) => {
      const target = event.target.closest('[data-action="toggle-panel"]');
      if (!target || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      this._togglePanel();
    });

    this.shadowRoot.addEventListener("scroll", (event) => {
      const officeScroller = event.target?.closest?.(".office-image__scroll");
      if (officeScroller) this._officeScrollTop = officeScroller.scrollTop;

      const specsScroller = event.target?.closest?.(".reference-specs");
      if (specsScroller) this._specsScrollTop = specsScroller.scrollTop;
    }, true);
  }

  set hass(value) {
    this._hass = value;
    const currentState = this._state();
    const desired = this._pendingDesired;
    let shouldRender = !this.shadowRoot?.querySelector(".layout");

    // Home Assistant reasigna `hass` ante muchos cambios globales. La ficha
    // solo necesita reconstruirse cuando cambia SU estado visible. Esto evita
    // destruir el nodo que el usuario está desplazando en smartphone.
    if (desired && currentState === desired) {
      this._clearPending();
      this._lastError = "";
      shouldRender = true;
    } else if (!desired && currentState !== this._lastRenderedState) {
      shouldRender = true;
    } else if (desired && ["unavailable", "unknown"].includes(currentState) && currentState !== this._lastRenderedState) {
      shouldRender = true;
    }

    if (shouldRender) this.render();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    this._panel = value;
    this.render();
  }

  get panel() {
    return this._panel;
  }

  set narrow(value) {
    this.toggleAttribute("narrow", Boolean(value));
  }

  disconnectedCallback() {
    this._clearPending();
  }

  _config() {
    const raw = this._panel?.config || {};
    const entity = String(raw.entity || COLGANTE_DEFAULTS.entity);
    const requestedControls = raw.scene_control_entities || raw.sceneControlEntities;
    const sceneControlEntities = Array.isArray(requestedControls) && requestedControls.length
      ? [...new Set(requestedControls.filter(Boolean).map(String))]
      : [...COLGANTE_DEFAULTS.sceneControlEntities];

    if (!sceneControlEntities.includes(entity)) sceneControlEntities.push(entity);

    return {
      entity,
      sceneControlEntities,
      officeOnImage: raw.office_on_image || raw.officeOnImage || COLGANTE_DEFAULTS.officeOnImage,
      officeOffImage: raw.office_off_image || raw.officeOffImage || COLGANTE_DEFAULTS.officeOffImage,
      panelOnImage: raw.panel_on_image || raw.panelOnImage || COLGANTE_DEFAULTS.panelOnImage,
      panelOffImage: raw.panel_off_image || raw.panelOffImage || COLGANTE_DEFAULTS.panelOffImage,
    };
  }

  _state() {
    const entity = this._config().entity;
    return this._hass?.states?.[entity]?.state || "unavailable";
  }

  _isUnavailable() {
    return ["unavailable", "unknown"].includes(this._state());
  }

  _clearPending() {
    if (this._pendingTimer) clearTimeout(this._pendingTimer);
    this._pendingTimer = null;
    this._pendingDesired = "";
  }

  _toggleHomeAssistantMenu() {
    this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  async _setEntitiesState(entityIds, desired) {
    const ids = [...new Set((entityIds || []).filter(Boolean))];
    if (!ids.length) return;

    const groups = new Map();
    for (const entityId of ids) {
      const domain = entityId.split(".")[0];
      if (!domain) continue;
      if (!groups.has(domain)) groups.set(domain, []);
      groups.get(domain).push(entityId);
    }

    const service = desired === "on" ? "turn_on" : "turn_off";
    for (const [domain, domainEntities] of groups) {
      await this._hass.callService(domain, service, { entity_id: domainEntities });
    }
  }

  async _togglePanel() {
    if (!this._hass || this._pendingDesired || this._isUnavailable()) return;

    const config = this._config();
    const currentState = this._state();
    const desired = currentState === "on" ? "off" : "on";
    this._pendingDesired = desired;
    this._lastError = "";
    this.render();

    try {
      if (desired === "on") {
        // Replica la escena de muestra "Colgantes" del showroom:
        // apaga el resto del grupo exclusivo y deja encendido solo Colgantes.
        const offEntities = config.sceneControlEntities.filter((id) => id !== config.entity);
        await this._setEntitiesState(offEntities, "off");
        await this._setEntitiesState([config.entity], "on");
      } else {
        // Apagar desde esta interfaz desactiva la muestra Colgantes.
        await this._setEntitiesState([config.entity], "off");
      }

      this._pendingTimer = setTimeout(() => {
        if (this._state() !== desired) {
          this._lastError = "Sin confirmación de Home Assistant";
          this._clearPending();
          this.render();
        }
      }, 7000);
    } catch (error) {
      this._lastError = "No se pudo ejecutar la acción";
      this._clearPending();
      this.render();
      console.error("Colgante: error de control", error);
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

  _cssUrl(value) {
    return String(value ?? "").replace(/["'()\\\n\r]/g, (char) => encodeURIComponent(char));
  }

  render() {
    if (!this.shadowRoot) return;

    const phoneLayout = typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(max-width: 560px)").matches;
    if (phoneLayout) {
      const existingSpecsScroller = this.shadowRoot.querySelector(".reference-specs");
      if (existingSpecsScroller) this._specsScrollTop = existingSpecsScroller.scrollTop;
    }

    const config = this._config();
    const state = this._state();
    const unavailable = this._isUnavailable();
    const switching = Boolean(this._pendingDesired);
    const visuallyOn = switching ? this._pendingDesired === "on" : state === "on";
    const stateLabel = unavailable ? "NO DISPONIBLE" : switching ? "CAMBIANDO…" : visuallyOn ? "ENCENDIDO" : "APAGADO";
    const actionLabel = unavailable ? "Circuito no disponible" : visuallyOn ? "Apagar colgante" : "Encender colgante";
    const statusClass = unavailable ? "unavailable" : visuallyOn ? "on" : "off";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --ink: #666;
          --teal: #4e9da0;
          --paper: #fff;
          --border: #e4e4e4;
          display: block;
          width: 100%;
          height: 100%;
          min-width: 320px;
          background: #f3f4f4;
          color: var(--ink);
          font-family: Arial, Helvetica, sans-serif;
        }
        * { box-sizing: border-box; }
        button { font: inherit; }

        .layout {
          width: 100%;
          min-height: 100%;
          height: 100dvh;
          margin: 0;
          display: grid;
          grid-template-columns: minmax(0,58%) minmax(0,42%);
          overflow: hidden;
          background: var(--paper);
        }

        .office-image {
          min-height: 0;
          height: 100dvh;
          position: relative;
          isolation: isolate;
          background-image:
            linear-gradient(90deg, rgba(20,31,35,.08), transparent 55%),
            url("${this._cssUrl(config.officeOnImage)}");
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        }
        .office-image::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(90deg, rgba(20,31,35,.08), transparent 55%),
            url("${this._cssUrl(config.officeOffImage)}");
          background-position: inherit;
          background-size: cover;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity .48s ease;
        }
        .layout.lights-off .office-image::after { opacity: 1; }

        /* En pantallas estrechas, solo la imagen de ambiente puede desplazarse.
           La ficha técnica permanece estática y fuera de este contenedor. */
        .office-image__scroll {
          display: none;
        }
        .office-image__scroll-inner {
          position: relative;
          width: 100%;
          min-height: 100%;
        }
        .office-image__scroll img {
          display: block;
          width: 100%;
          height: auto;
          max-width: none;
          user-select: none;
          -webkit-user-drag: none;
          pointer-events: none;
        }
        .office-image__caption {
          position: absolute;
          z-index: 2;
          left: clamp(22px,4vw,62px);
          bottom: clamp(25px,5vw,72px);
          display: grid;
          gap: 5px;
          color: #fff;
          text-shadow: 0 1px 9px rgba(0,0,0,.4);
        }
        .office-image__caption span { font-size: 11px; font-weight: bold; letter-spacing: .16em; }
        .office-image__caption strong { font-size: clamp(24px,2.4vw,39px); letter-spacing: -.04em; }

        .menu-button {
          position: absolute;
          z-index: 5;
          top: 16px;
          left: 16px;
          width: 42px;
          height: 42px;
          display: none;
          place-items: center;
          border: 1px solid rgba(255,255,255,.5);
          border-radius: 50%;
          background: rgba(25,35,39,.34);
          color: #fff;
          backdrop-filter: blur(8px);
          cursor: pointer;
        }
        .menu-button svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }

        .product-card {
          min-width: 0;
          height: 100dvh;
          min-height: 0;
          overflow: hidden;
          padding: clamp(24px,4vh,48px) clamp(28px,3.2vw,58px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: clamp(14px,2.2vh,26px);
        }
        .topline { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .warranty { display: flex; align-items: center; color: var(--teal); font-size: 10px; font-weight: bold; letter-spacing: .03em; }
        .warranty svg { width: 30px; height: 34px; margin-right: 8px; fill: none; stroke: var(--teal); stroke-width: 2.2; }
        .warranty span { padding: 7px 9px; background: #eef7f7; border-radius: 3px; }

        .state-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 32px;
          padding: 7px 10px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: #fff;
          color: #8a8a8a;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .08em;
          white-space: nowrap;
        }
        .state-badge::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #9c9c9c; }
        .state-badge.on { color: var(--teal); border-color: #cfe4e4; background: #f4fafa; }
        .state-badge.on::before { background: var(--teal); box-shadow: 0 0 0 4px rgba(78,157,160,.12); }
        .state-badge.off::before { background: #8a8a8a; }
        .state-badge.unavailable { color: #a05c5c; background: #fff6f6; border-color: #ecd7d7; }
        .state-badge.unavailable::before { background: #a05c5c; }

        .product-intro { display: flex; align-items: center; justify-content: flex-start; gap: clamp(12px,1.6vw,24px); }
        .panel-toggle {
          appearance: none;
          border: 0;
          padding: 0;
          margin: 0;
          background: transparent;
          display: block;
          flex: 0 1 auto;
          cursor: pointer;
          outline: none;
        }
        .panel-toggle:disabled { cursor: not-allowed; opacity: .58; }
        .panel-toggle img {
          display: block;
          width: clamp(125px,12vw,205px);
          height: auto;
          max-height: min(24vh,210px);
          object-fit: contain;
          transition: opacity .18s ease, transform .22s ease, filter .32s ease;
          user-select: none;
          -webkit-user-drag: none;
        }
        .panel-toggle:not(:disabled):hover img { transform: scale(1.025); }
        .panel-toggle:focus-visible { outline: 3px solid var(--teal); outline-offset: 5px; border-radius: 8px; }
        .panel-toggle.is-switching img { opacity: .18; transform: scale(.975); }
        .layout.lights-off .panel-toggle img { filter: brightness(.92); }

        .intro-copy { min-width: 0; }
        .intro-copy h1, .intro-copy p { margin: 0; white-space: nowrap; }
        .intro-copy h1 { font-size: clamp(27px,2.35vw,42px); letter-spacing: -.06em; line-height: .9; color: #6e6e6e; }
        .intro-copy p { margin-top: 5px; font-size: clamp(24px,2.05vw,36px); font-weight: 300; letter-spacing: -.06em; }
        .intro-copy p b { font-weight: 400; }
        .interaction-copy { margin-top: 11px; color: #999; font-size: 10px; line-height: 1.35; }
        .interaction-copy strong { color: var(--teal); }
        .error-copy { margin-top: 5px; color: #a05c5c; font-size: 10px; }

        .reference-specs {
          width: 100%;
          max-width: none;
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          grid-auto-flow: row;
          column-gap: clamp(14px,1.5vw,26px);
          row-gap: clamp(9px,1.35vh,15px);
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .reference-specs li {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #707070;
          font-size: clamp(14px,1vw,18px);
          font-weight: 700;
          line-height: 1.08;
        }
        .reference-specs li > span:first-child {
          width: clamp(31px,2.25vw,38px);
          height: clamp(31px,2.25vw,38px);
          flex: 0 0 clamp(31px,2.25vw,38px);
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #7b7b7b;
        }
        .reference-specs svg { width: clamp(19px,1.55vw,24px); height: clamp(19px,1.55vw,24px); fill: none; stroke: #fff; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
        .reference-specs .mint { stroke: #b9ead8; }
        .reference-specs .letters { fill: #fff; stroke: none; font: 700 9px Arial,sans-serif; text-anchor: middle; }
        .reference-specs .install { max-width: none; }
        .reference-specs .install > span:last-child { width: auto; height: auto; flex: 1 1 auto; display: block; background: transparent; border-radius: 0; }

        @media (min-width:981px) and (max-height:720px) {
          .product-card { padding-top: 20px; padding-bottom: 20px; gap: 12px; }
          .panel-toggle img { width: clamp(110px,10vw,160px); max-height: 18vh; }
          .intro-copy h1 { font-size: clamp(25px,2.15vw,36px); }
          .intro-copy p { font-size: clamp(22px,1.85vw,31px); }
          .reference-specs { row-gap: 7px; }
          .reference-specs li { font-size: clamp(13px,.92vw,16px); }
          .reference-specs li > span:first-child { width:29px; height:29px; flex-basis:29px; }
          .reference-specs svg { width:18px; height:18px; }
        }

        @media (max-width:980px) {

          /* La fotografía dispone de su propio paneo vertical.
             No se habilita scroll en .layout ni en .product-card. */
          .office-image {
            overflow: hidden;
            background-image: none;
          }
          .office-image::after { display: none; }
          .office-image__scroll {
            display: block;
            position: absolute;
            inset: 0;
            z-index: 0;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior-x: none;
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
            scrollbar-width: thin;
          }
          .office-image__scroll::-webkit-scrollbar { width: 4px; }
          :host { overflow: auto; }
          .layout {
            display: flex;
            min-height: 100dvh;
            height: auto;
            flex-direction: column;
            overflow: visible;
          }
          .office-image {
            order: 0;
            min-height: 0;
            height: 43vw;
            max-height: 470px;
            background-position: center 42%;
          }
          .product-card {
            order: 1;
            height: auto;
            min-height: 0;
            overflow: visible;
            padding: clamp(26px,5vw,55px);
            gap: 28px;
          }
          .office-image__caption { bottom: 24px; }
          .product-intro { justify-content: center; }
          .reference-specs {
            max-width: 650px;
            width: 100%;
            margin: auto;
            grid-template-columns: 1fr 1fr;
          }
          .reference-specs li { font-size: 17px; }
          .menu-button { display: grid; }
        }

        /* Tablet vertical / panel mural (~854 x 1366).
           El hero ocupa una fracción estable de la pantalla y la ficha usa
           exactamente el espacio restante. Dentro de la ficha: cabecera arriba,
           producto centrado y especificaciones ancladas al borde inferior. */
        @media (min-width:700px) and (max-width:980px) and (orientation:portrait) {
          :host {
            height: 100dvh;
            min-height: 0;
            overflow: hidden;
          }

          .layout {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: clamp(350px, 34dvh, 470px) minmax(0, 1fr);
            width: 100%;
            height: 100dvh;
            min-height: 100dvh;
            overflow: hidden;
          }

          .office-image {
            order: initial;
            width: 100%;
            height: 100%;
            min-height: 0;
            max-height: none;
            background-position: center 43%;
          }

          .office-image__caption {
            left: clamp(30px, 5vw, 48px);
            bottom: clamp(26px, 2.8vh, 38px);
          }
          .office-image__caption span { font-size: 11px; }
          .office-image__caption strong { font-size: clamp(28px, 4vw, 36px); }

          .menu-button {
            top: 18px;
            left: 18px;
            width: 44px;
            height: 44px;
          }

          .product-card {
            order: initial;
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            display: grid;
            grid-template-rows: auto minmax(0, 1fr) auto;
            align-items: stretch;
            justify-content: stretch;
            gap: clamp(18px, 2vh, 28px);
            padding:
              clamp(28px, 2.8vh, 40px)
              clamp(44px, 6.2vw, 68px)
              calc(clamp(34px, 3.2vh, 48px) + env(safe-area-inset-bottom, 0px));
          }

          .topline,
          .product-intro,
          .reference-specs {
            width: min(100%, 730px);
            margin-left: auto;
            margin-right: auto;
          }

          .topline {
            align-self: start;
          }

          .warranty { font-size: 11px; }
          .warranty svg { width: 32px; height: 36px; }
          .warranty span { padding: 8px 10px; }
          .state-badge { min-height: 34px; padding: 8px 12px; font-size: 10px; }

          .product-intro {
            align-self: center;
            justify-content: center;
            align-items: center;
            gap: clamp(28px, 4vw, 42px);
          }

          .panel-toggle img {
            width: clamp(185px, 24vw, 225px);
            max-height: 225px;
          }

          .intro-copy h1 { font-size: clamp(36px, 5vw, 44px); }
          .intro-copy p { margin-top: 7px; font-size: clamp(31px, 4.25vw, 37px); }
          .interaction-copy { margin-top: 13px; font-size: 11px; line-height: 1.4; }
          .error-copy { font-size: 11px; }

          .reference-specs {
            align-self: end;
            max-width: 730px;
            margin-top: 0;
            margin-bottom: 0;
            grid-template-columns: repeat(2, minmax(0,1fr));
            column-gap: clamp(34px, 5vw, 52px);
            row-gap: clamp(13px, 1.35vh, 18px);
          }
          .reference-specs li {
            gap: 10px;
            font-size: clamp(16px, 2.05vw, 18px);
          }
          .reference-specs li > span:first-child {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
          }
          .reference-specs svg { width: 22px; height: 22px; }
        }

        @media (max-width:560px) {
          /* Smartphone: composición cerrada y predecible.
             La foto de ambiente mantiene su paneo vertical propio.
             En la ficha blanca, garantía/estado + producto/título quedan siempre
             visibles; SOLO la lista de características técnicas se desplaza. */
          :host {
            height: 100dvh;
            min-height: 0;
            overflow: hidden;
          }

          .layout {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: clamp(180px, 31dvh, 260px) minmax(0, 1fr);
            width: 100%;
            height: 100dvh;
            min-height: 0;
            overflow: hidden;
          }

          .office-image {
            order: initial;
            width: 100%;
            height: 100%;
            min-height: 0;
            max-height: none;
            overflow: hidden;
            background-position: center 35%;
          }
          .office-image__caption { left: 20px; bottom: 16px; }
          .office-image__caption span { font-size: 8px; }
          .office-image__caption strong { font-size: clamp(19px,5.7vw,24px); }
          .menu-button { top: 10px; left: 10px; width: 38px; height: 38px; }

          .product-card {
            order: initial;
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            padding: 13px 16px 10px;
            gap: 10px;
            display: grid;
            grid-template-rows: auto auto minmax(0, 1fr);
            align-items: stretch;
            justify-content: stretch;
          }

          .topline {
            min-width: 0;
            align-items: center;
            flex-direction: row;
            justify-content: space-between;
            gap: 8px;
          }
          .warranty { min-width: 0; font-size: 8px; }
          .warranty svg { width: 25px; height: 28px; margin-right: 5px; }
          .warranty span { padding: 5px 6px; white-space: nowrap; }
          .state-badge {
            flex: 0 0 auto;
            min-height: 27px;
            padding: 5px 7px;
            font-size: 8px;
          }

          .product-intro {
            min-width: 0;
            min-height: 0;
            align-self: stretch;
            align-items: center;
            justify-content: center;
            gap: 9px;
          }
          .panel-toggle {
            width: 40%;
            max-width: 150px;
            min-width: 0;
            flex: 0 0 40%;
          }
          .panel-toggle img {
            width: 100%;
            height: clamp(100px, 17dvh, 145px);
            max-height: none;
            object-fit: contain;
          }
          .intro-copy { min-width: 0; padding-bottom: 0; }
          .intro-copy h1 { font-size: clamp(21px,6.7vw,30px); }
          .intro-copy p { margin-top: 4px; font-size: clamp(19px,5.9vw,27px); }
          .interaction-copy { margin-top: 7px; font-size: 9px; }
          .error-copy { font-size: 9px; }

          .reference-specs {
            width: 100%;
            height: 100%;
            min-height: 0;
            max-width: none;
            margin: 0;
            padding: 0 5px 2px 0;
            grid-template-columns: 1fr;
            align-content: start;
            gap: 8px;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior-x: none;
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
            scrollbar-width: thin;
            scrollbar-gutter: stable;
          }
          .reference-specs::-webkit-scrollbar { width: 4px; }
          .reference-specs::-webkit-scrollbar-thumb { background: #c8c8c8; border-radius: 999px; }
          .reference-specs li {
            flex: 0 0 auto;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e5e5;
            font-size: 15px;
          }
          .reference-specs li:last-child { border-bottom: 0; }
          .reference-specs li > span:first-child { width:32px; height:32px; flex-basis:32px; }
          .reference-specs svg { width:20px; height:20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .office-image::after, .panel-toggle img { transition: none; }
        }
      </style>

      <main class="layout ${visuallyOn ? "" : "lights-off"}">
        <section class="office-image" aria-label="Luminaria suspendida instalada en un ambiente interior">
          <div class="office-image__scroll" data-office-scroll aria-hidden="true">
            <div class="office-image__scroll-inner">
              <img src="${this._escape(visuallyOn ? config.officeOnImage : config.officeOffImage)}" alt="">
            </div>
          </div>
          <button class="menu-button" data-action="toggle-menu" aria-label="Abrir menú de Home Assistant" title="Abrir menú">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h18M3 12h18M3 17.5h18"></path></svg>
          </button>
          <div class="office-image__caption"><span>ILUMINACIÓN PROFESIONAL</span><strong>Luminaria Suspendida 5W</strong></div>
        </section>

        <section class="product-card" aria-label="Descripción y control de la luminaria suspendida">
          <div class="topline">
            <div class="warranty">
              <svg viewBox="0 0 48 52" aria-hidden="true"><path d="M24 3c6 4 13 5 20 5v14c0 13-8 23-20 27C12 45 4 35 4 22V8c7 0 14-1 20-5Z"/><path d="m14 25 7 7 13-15"/></svg>
              <span>3 A 5 AÑOS DE GARANTÍA</span>
            </div>
            <div class="state-badge ${statusClass}" role="status" aria-live="polite">${stateLabel}</div>
          </div>

          <div class="product-intro">
            <button
              class="panel-toggle ${switching ? "is-switching" : ""}"
              data-action="toggle-panel"
              aria-pressed="${visuallyOn ? "true" : "false"}"
              aria-label="${this._escape(actionLabel)}"
              title="${this._escape(actionLabel)}"
              ${unavailable ? "disabled" : ""}
            >
              <img src="${this._escape(visuallyOn ? config.panelOnImage : config.panelOffImage)}" alt="Luminaria suspendida LED 5W">
            </button>
            <div class="intro-copy">
              <h1>LUMINARIA</h1>
              <p>SUSPENDIDA <b>5W</b></p>
              <div class="interaction-copy">Circuito Showroom · <strong>Colgantes</strong></div>
              ${this._lastError ? `<div class="error-copy">${this._escape(this._lastError)}</div>` : ""}
            </div>
          </div>

          <ul class="reference-specs" aria-label="Características de la luminaria suspendida">
            <li><span><svg viewBox="0 0 28 28"><path d="m7 12 5 4 8-4-5-3 5 4-5 3"/></svg></span>5W</li>
            <li><span><svg viewBox="0 0 28 28"><path d="M4 14h20M8 9l-5 5 5 5M20 9l5 5-5 5"/></svg></span>60 x 300 mm</li>
            <li><span><svg class="mint" viewBox="0 0 28 28"><path d="M6 17a8 8 0 0 1 16 0"/></svg></span>4000K</li>
            <li><span><svg viewBox="0 0 28 28"><path d="M7 7h15l-3 14H4z"/></svg></span>ALUMINIO</li>
            <li class="install"><span><svg viewBox="0 0 28 28"><path d="m8 8 12 12M20 8 8 20M6 9l3-3 3 3-3 3zM16 19l3-3 3 3-3 3z"/></svg></span><span>DE SUSPENDER</span></li>
            <li><span><svg viewBox="0 0 28 28"><text class="letters" x="14" y="17">CE</text></svg></span>CE / RoHS</li>
          </ul>
        </section>
      </main>
    `;

    const officeScroller = this.shadowRoot.querySelector(".office-image__scroll");
    if (officeScroller) {
      const restoreOfficeScroll = () => {
        officeScroller.scrollTop = Math.max(0, this._officeScrollTop || 0);
      };
      const officeImage = officeScroller.querySelector("img");
      if (officeImage?.complete) restoreOfficeScroll();
      else officeImage?.addEventListener("load", restoreOfficeScroll, { once: true });
    }

    this._lastRenderedState = state;

    // En smartphone las características son el único bloque blanco con scroll.
    // `render()` reemplaza shadowRoot.innerHTML; por eso se conserva y restaura
    // explícitamente su scrollTop. Se hace después del layout y también después
    // de cargar la imagen del producto para evitar que un cambio de altura lo
    // vuelva a llevar a 0.
    if (phoneLayout) {
      const restoreSpecsScroll = () => {
        const specsScroller = this.shadowRoot.querySelector(".reference-specs");
        if (!specsScroller) return;
        const maxScroll = Math.max(0, specsScroller.scrollHeight - specsScroller.clientHeight);
        specsScroller.scrollTop = Math.min(maxScroll, Math.max(0, this._specsScrollTop || 0));
      };
      const scheduleRestore = () => {
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => requestAnimationFrame(restoreSpecsScroll));
        } else {
          restoreSpecsScroll();
        }
      };

      scheduleRestore();
      const productImage = this.shadowRoot.querySelector(".panel-toggle img");
      if (productImage && !productImage.complete) {
        productImage.addEventListener("load", scheduleRestore, { once: true });
      }
    }
  }
}

if (!customElements.get("colgante-showroom")) {
  customElements.define("colgante-showroom", ColganteShowroom);
}
