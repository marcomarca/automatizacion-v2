// Showroom Productos Panel v1.0.8
// Contenedor de las seis fichas interactivas del showroom.
// La lógica de control permanece dentro de cada panel aislado; este componente
// solamente carga, monta y conmuta las vistas mediante tabs inferiores.

const SHOWROOM_PRODUCTS_DEFAULT_TABS = Object.freeze([
  {
    id: "panel-backlit",
    name: "Panel",
    subtitle: "60×60 · 48W",
    element: "panel-backlit-showroom",
    moduleUrl: "/local/panel-backlit-showroom.js?v=1.2.4",
    config: {
      entity: "switch.smart_relay_switch_4_switch",
      office_on_image: "/local/panel-backlit/oficinas-paneles-on.png",
      office_off_image: "/local/panel-backlit/oficinas-paneles-off.png",
      panel_on_image: "/local/panel-backlit/panel-encendido.jpg",
      panel_off_image: "/local/panel-backlit/panel-apagado.png",
    },
  },
  {
    id: "panel-3k6k",
    name: "Panel 3K/6K",
    subtitle: "60×60 · 48W",
    element: "panel-3k6k-showroom",
    moduleUrl: "/local/panel-3k6k-showroom.js?v=1.0.4",
    config: {
      entity: "switch.interruptor_inteligente_2_switch_1",
      office_on_image: "/local/paneles3k6k/paneles3k6k-oficina-on.png",
      office_off_image: "/local/paneles3k6k/paneles3k6k-oficina-off.png",
      panel_on_image: "/local/paneles3k6k/paneles3k6k-on.png",
      panel_off_image: "/local/paneles3k6k/paneles3k6k-off.png",
    },
  },
  {
    id: "spot-20w",
    name: "Spot 20W",
    subtitle: "Empotrar · 20W",
    element: "spot-20w-showroom",
    moduleUrl: "/local/spot-20w-showroom.js?v=1.0.4",
    config: {
      entities: [
        "switch.interruptor_inteligente_switch_1",
        "switch.interruptor_inteligente_switch_2",
        "switch.interruptor_inteligente_switch_3",
        "switch.interruptor_inteligente_switch_4",
      ],
      office_on_image: "/local/spot-20w/eg-spot20w-on.png",
      office_off_image: "/local/spot-20w/eg-spot20w-off.png",
      panel_on_image: "/local/spot-20w/spot20w-on.png",
      panel_off_image: "/local/spot-20w/spot20w-off.png",
    },
  },
  {
    id: "downlight",
    name: "Downlight",
    subtitle: "Empotrar",
    element: "downlight-showroom",
    moduleUrl: "/local/downlight-showroom.js?v=1.0.4",
    config: {
      entity: "switch.interruptor_inteligente_2_switch_4",
      office_on_image: "/local/downlight/downlight-eg-on.png",
      office_off_image: "/local/downlight/downlight-eg-off.png",
      panel_on_image: "/local/downlight/downlight-on.png",
      panel_off_image: "/local/downlight/downlight-off.png",
    },
  },
  {
    id: "colgante",
    name: "Colgante",
    subtitle: "Suspendida · 5W",
    element: "colgante-showroom",
    moduleUrl: "/local/colgante-showroom.js?v=1.0.4",
    config: {
      entity: "switch.interruptor_inteligente_2_switch_2",
      office_on_image: "/local/colgantes/colgantes-img-on.png",
      office_off_image: "/local/colgantes/colgantes-img-off.png",
      panel_on_image: "/local/colgantes/colgante-on.png",
      panel_off_image: "/local/colgantes/colgante-off.png",
    },
  },
  {
    id: "slims",
    name: "Slims",
    subtitle: "600×50 mm · 48W",
    element: "slim-showroom",
    moduleUrl: "/local/slim-showroom.js?v=1.0.5",
    config: {
      entity: "switch.interruptor_inteligente_2_switch_3",
      office_on_image: "/local/slims/slim-office-on.png",
      office_off_image: "/local/slims/slim-office-off.png",
      panel_on_image: "/local/slims/slim-product-on.png",
      panel_off_image: "/local/slims/slim-product-off.png",
    },
  },
]);

const SHOWROOM_PRODUCTS_SCENE_ENTITIES = Object.freeze([
  "switch.interruptor_inteligente_switch_1",
  "switch.interruptor_inteligente_switch_2",
  "switch.interruptor_inteligente_switch_3",
  "switch.interruptor_inteligente_switch_4",
  "switch.interruptor_inteligente_2_switch_1",
  "switch.interruptor_inteligente_2_switch_2",
  "switch.interruptor_inteligente_2_switch_3",
  "switch.interruptor_inteligente_2_switch_4",
  "switch.smart_relay_switch_4_switch",
]);

const SHOWROOM_PRODUCTS_ICONS = Object.freeze({
  "panel-backlit": '<path d="M4 5h16v13H4V5Zm2 2v9h12V7H6Zm3 12h6v2H9v-2Z"/>',
  "spot-20w": '<path d="M5 4h8l4 4-7 7-5-5V4Zm12 9 1.5 1.5-3 3L14 16l3-3Zm2-4 1.5 1.5-1.5 1.5-1.5-1.5L19 9Z"/>',
  downlight: '<path d="M5 5h14l-2 8H7L5 5Zm4 10h6v2H9v-2Zm-2 4h10v2H7v-2Z"/>',
  colgante: '<path d="M11 2h2v6.2a6 6 0 0 1 5 5.8v1H6v-1a6 6 0 0 1 5-5.8V2Zm-3 15h8v2H8v-2Z"/>',
  "panel-3k6k": '<path d="M4 5h16v13H4V5Zm2 2v9h12V7H6Zm3 12h6v2H9v-2Zm-2-8h2m2 0h2m2 0h2"/>',
  slims: '<path d="M3 7h18v4H3V7Zm2 2h14V9H5Zm-2 6h18v2H3v-2Z"/>',
});

class ShowroomProductosPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._tabs = [];
    this._activeId = "";
    this._instances = new Map();
    this._moduleLoads = new Map();
    this._activationToken = 0;
    this._rendered = false;
    this._storageKey = "witmind-showroom-productos-active-tab";

    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._handleKeydown(event));
  }

  set hass(value) {
    this._hass = value;
    this._syncMountedChildren();
    this._updateTabStates();
    if (!this._activeId && this.isConnected) this._activateInitialTab();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    this._panel = value;
    this._configureAndRender();
  }

  get panel() {
    return this._panel;
  }

  set narrow(value) {
    this._narrow = Boolean(value);
    this.toggleAttribute("narrow", this._narrow);
    for (const child of this._instances.values()) child.narrow = this._narrow;
  }

  get narrow() {
    return this._narrow;
  }

  connectedCallback() {
    if (!this._rendered) this._configureAndRender();
    this._activateInitialTab();
  }

  disconnectedCallback() {
    this._activationToken += 1;
  }

  _config() {
    const raw = this._panel?.config || {};
    const commonSceneEntities = Array.isArray(raw.scene_control_entities)
      ? [...new Set(raw.scene_control_entities.filter(Boolean).map(String))]
      : [...SHOWROOM_PRODUCTS_SCENE_ENTITIES];

    const requestedTabs = Array.isArray(raw.tabs) && raw.tabs.length ? raw.tabs : SHOWROOM_PRODUCTS_DEFAULT_TABS;
    const tabs = requestedTabs
      .map((item, index) => {
        const fallback = SHOWROOM_PRODUCTS_DEFAULT_TABS.find((tab) => tab.id === item?.id) || SHOWROOM_PRODUCTS_DEFAULT_TABS[index];
        if (!fallback && !item) return null;
        const source = item || fallback;
        const base = fallback || {};
        const childConfig = { ...(base.config || {}), ...(source.config || {}) };
        if (!Array.isArray(childConfig.scene_control_entities) || !childConfig.scene_control_entities.length) {
          childConfig.scene_control_entities = [...commonSceneEntities];
        }

        return {
          id: String(source.id || base.id || `tab-${index + 1}`),
          name: String(source.name || base.name || `Producto ${index + 1}`),
          subtitle: String(source.subtitle || base.subtitle || ""),
          element: String(source.element || base.element || ""),
          moduleUrl: String(source.module_url || source.moduleUrl || base.moduleUrl || ""),
          config: childConfig,
        };
      })
      .filter((tab) => tab && tab.id && tab.element && tab.moduleUrl);

    const defaultTab = String(raw.default_tab || raw.defaultTab || tabs[0]?.id || "");
    return {
      tabs,
      defaultTab: tabs.some((tab) => tab.id === defaultTab) ? defaultTab : (tabs[0]?.id || ""),
      rememberTab: raw.remember_tab ?? raw.rememberTab ?? true,
      preload: raw.preload_modules ?? raw.preloadModules ?? true,
    };
  }

  _configureAndRender() {
    const config = this._config();
    const previousActive = this._activeId;
    this._tabs = config.tabs;
    this._rememberTab = Boolean(config.rememberTab);
    this._preload = Boolean(config.preload);

    for (const child of this._instances.values()) child.remove();
    this._instances.clear();
    this._activeId = "";
    this._renderShell();

    const candidate = this._tabs.some((tab) => tab.id === previousActive) ? previousActive : "";
    if (candidate) this._activateTab(candidate);
    else if (this.isConnected) this._activateInitialTab();
  }

  _renderShell() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --dock-height: 72px;
          --ink: #666;
          --muted: #8a8a8a;
          --teal: #4e9da0;
          --line: #dedede;
          display: block;
          width: 100%;
          height: 100dvh;
          min-width: 320px;
          overflow: hidden;
          background: #fff;
          font-family: Arial, Helvetica, sans-serif;
          color: var(--ink);
        }
        * { box-sizing: border-box; }
        button { font: inherit; }

        .shell {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          overflow: hidden;
          background: #fff;
        }

        .viewport {
          position: relative;
          min-width: 0;
          min-height: 0;
          overflow: auto;
          overscroll-behavior: contain;
          background: #f3f4f4;
        }

        .view {
          width: 100%;
          min-height: 100%;
          height: 100%;
        }

        .view > * {
          width: 100%;
          min-width: 0;
        }
        .view > [hidden] { display: none !important; }

        .loading,
        .error {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 32px;
          background: #f6f7f7;
          color: #777;
          text-align: center;
        }
        .loading[hidden], .error[hidden] { display: none; }
        .loading-card, .error-card {
          width: min(92%, 430px);
          padding: 28px;
          border: 1px solid #e3e3e3;
          border-radius: 18px;
          background: rgba(255,255,255,.96);
          box-shadow: 0 14px 42px rgba(0,0,0,.08);
        }
        .loading-card strong, .error-card strong { display: block; font-size: 17px; color: #666; }
        .loading-card span, .error-card span { display: block; margin-top: 7px; font-size: 12px; line-height: 1.45; color: #999; }
        .spinner {
          width: 25px;
          height: 25px;
          margin: 0 auto 13px;
          border: 3px solid #dfe8e8;
          border-top-color: var(--teal);
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .retry {
          margin-top: 16px;
          padding: 9px 14px;
          border: 0;
          border-radius: 999px;
          background: var(--teal);
          color: #fff;
          cursor: pointer;
          font-weight: 700;
        }

        .dock {
          position: relative;
          z-index: 20;
          height: calc(var(--dock-height) + env(safe-area-inset-bottom, 0px));
          padding: 7px 10px calc(7px + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid var(--line);
          background: rgba(255,255,255,.97);
          box-shadow: 0 -9px 28px rgba(0,0,0,.06);
          backdrop-filter: blur(14px);
        }

        .dock-inner {
          width: 100%;
          max-width: 1180px;
          height: 100%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
        }

        .tabs-clip {
          min-width: 0;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .tabs {
          height: 100%;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 5px;
        }

        .tab-nav {
          display: none;
          appearance: none;
          border: 0;
          border-radius: 11px;
          background: #f2f5f5;
          color: #707070;
          cursor: pointer;
          place-items: center;
          padding: 0;
          outline: none;
          touch-action: manipulation;
        }
        .tab-nav:active { transform: translateY(1px); }
        .tab-nav:focus-visible { outline: 2px solid var(--teal); outline-offset: -2px; }
        .tab-nav svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

        .tab {
          min-width: 0;
          height: 100%;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: #858585;
          display: grid;
          grid-template-columns: 28px minmax(0,1fr);
          align-items: center;
          gap: 8px;
          padding: 6px 9px;
          cursor: pointer;
          transition: background .18s ease, color .18s ease, transform .18s ease;
          text-align: left;
          outline: none;
        }
        .tab:hover { background: #f4f7f7; }
        .tab:active { transform: translateY(1px); }
        .tab:focus-visible { outline: 2px solid var(--teal); outline-offset: -2px; }
        .tab[aria-selected="true"] { color: var(--teal); background: #eef7f7; }

        .tab-icon {
          position: relative;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #ededed;
          color: #777;
        }
        .tab[aria-selected="true"] .tab-icon { background: #dceeee; color: var(--teal); }
        .tab-icon svg { width: 18px; height: 18px; fill: currentColor; }
        .state-dot {
          position: absolute;
          right: -1px;
          bottom: -1px;
          width: 8px;
          height: 8px;
          border: 2px solid #fff;
          border-radius: 50%;
          background: #a0a0a0;
        }
        .tab[data-state="on"] .state-dot { background: var(--teal); }
        .tab[data-state="partial"] .state-dot { background: #d7a545; }
        .tab[data-state="unavailable"] .state-dot { background: #a05c5c; }

        .tab-copy { min-width: 0; display: block; }
        .tab-copy strong,
        .tab-copy small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tab-copy strong { font-size: 11px; line-height: 1.15; letter-spacing: .01em; }
        .tab-copy small { margin-top: 3px; font-size: 9px; line-height: 1.1; color: #aaa; }
        .tab[aria-selected="true"] .tab-copy small { color: #79abad; }

        @media (max-width: 760px) {
          :host { --dock-height: 70px; }
          .dock { padding-left: 5px; padding-right: 5px; }
          .dock-inner {
            max-width: none;
            grid-template-columns: 34px minmax(0, 1fr) 34px;
            gap: 4px;
          }
          .tab-nav { display: grid; }
          .tabs-clip::before,
          .tabs-clip::after {
            content: "";
            position: absolute;
            z-index: 3;
            top: 0;
            bottom: 0;
            width: 14px;
            pointer-events: none;
          }
          .tabs-clip::before {
            left: 0;
            background: linear-gradient(90deg, rgba(255,255,255,.94), rgba(255,255,255,0));
          }
          .tabs-clip::after {
            right: 0;
            background: linear-gradient(270deg, rgba(255,255,255,.94), rgba(255,255,255,0));
          }
          .tabs {
            display: flex;
            width: 100%;
            max-width: none;
            overflow-x: auto;
            overflow-y: hidden;
            gap: 4px;
            padding: 0 8px;
            scrollbar-width: none;
            scroll-snap-type: x mandatory;
            scroll-padding-inline: 8px;
            overscroll-behavior-x: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x;
          }
          .tabs::-webkit-scrollbar { display: none; }
          .tab {
            flex: 0 0 108px;
            scroll-snap-align: center;
            scroll-snap-stop: normal;
            grid-template-columns: 25px minmax(0,1fr);
            gap: 6px;
            padding: 5px 7px;
          }
          .tab-icon { width: 25px; height: 25px; }
          .tab-icon svg { width: 16px; height: 16px; }
          .tab-copy strong { font-size: 10px; }
          .tab-copy small { font-size: 8px; }
        }

        @media (max-width: 560px) {
          /* En smartphone el contenedor central no compite por el gesto vertical.
             La foto y la ficha técnica administran su scroll dentro del custom panel. */
          .viewport { overflow: hidden; }
          .view { height: 100%; min-height: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .tab { transition: none; }
          .spinner { animation: none; }
        }
      </style>
      <main class="shell">
        <section class="viewport" aria-live="off">
          <div class="view" data-view></div>
          <div class="loading" data-loading hidden>
            <div class="loading-card"><div class="spinner"></div><strong>Cargando vista…</strong><span data-loading-label></span></div>
          </div>
          <div class="error" data-error hidden>
            <div class="error-card"><strong>No se pudo cargar la vista</strong><span data-error-message></span><button class="retry" data-action="retry">Reintentar</button></div>
          </div>
        </section>
        <nav class="dock" aria-label="Productos del showroom">
          <div class="dock-inner">
            <button class="tab-nav tab-nav-prev" data-action="tab-prev" type="button" aria-label="Producto anterior" title="Producto anterior">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"></path></svg>
            </button>
            <div class="tabs-clip">
              <div class="tabs" role="tablist">${this._tabs.map((tab) => this._renderTab(tab)).join("")}</div>
            </div>
            <button class="tab-nav tab-nav-next" data-action="tab-next" type="button" aria-label="Producto siguiente" title="Producto siguiente">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"></path></svg>
            </button>
          </div>
        </nav>
      </main>
    `;
    this._rendered = true;
    this._updateTabStates();
  }

  _renderTab(tab) {
    const iconPath = SHOWROOM_PRODUCTS_ICONS[tab.id] || SHOWROOM_PRODUCTS_ICONS["panel-backlit"];
    return `
      <button class="tab" role="tab" data-tab-id="${this._escape(tab.id)}" aria-selected="false" tabindex="-1" title="${this._escape(tab.name)}">
        <span class="tab-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${iconPath}</svg><i class="state-dot"></i></span>
        <span class="tab-copy"><strong>${this._escape(tab.name)}</strong><small>${this._escape(tab.subtitle)}</small></span>
      </button>
    `;
  }

  _handleClick(event) {
    const tabButton = event.target.closest("[data-tab-id]");
    if (tabButton) {
      this._activateTab(tabButton.dataset.tabId);
      return;
    }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "tab-prev") {
      this._stepTab(-1);
      return;
    }
    if (action === "tab-next") {
      this._stepTab(1);
      return;
    }
    if (action === "retry" && this._activeId) {
      const tab = this._tabs.find((item) => item.id === this._activeId);
      if (tab) {
        this._moduleLoads.delete(tab.moduleUrl);
        this._instances.delete(tab.id);
        this._activateTab(tab.id, { force: true });
      }
    }
  }

  _stepTab(direction) {
    if (!this._tabs.length) return;
    const currentIndex = Math.max(0, this._tabs.findIndex((tab) => tab.id === this._activeId));
    const nextIndex = (currentIndex + direction + this._tabs.length) % this._tabs.length;
    this._activateTab(this._tabs[nextIndex].id);
  }

  _handleKeydown(event) {
    const current = event.target.closest('[role="tab"][data-tab-id]');
    if (!current) return;
    const tabs = [...this.shadowRoot.querySelectorAll('[role="tab"][data-tab-id]')];
    const index = tabs.indexOf(current);
    if (index < 0) return;

    let nextIndex = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const next = tabs[nextIndex];
    next.focus();
    this._activateTab(next.dataset.tabId);
  }

  _activateInitialTab() {
    if (!this._tabs.length || this._activeId) return;
    const config = this._config();
    let desired = config.defaultTab;
    if (this._rememberTab) {
      try {
        const stored = localStorage.getItem(this._storageKey);
        if (stored && this._tabs.some((tab) => tab.id === stored)) desired = stored;
      } catch (_error) {}
    }
    this._activateTab(desired || this._tabs[0].id);
  }

  async _activateTab(id, options = {}) {
    const tab = this._tabs.find((item) => item.id === id);
    if (!tab) return;
    if (this._activeId === tab.id && this._instances.has(tab.id) && !options.force) {
      this._syncTabSelection();
      return;
    }

    const token = ++this._activationToken;
    this._activeId = tab.id;
    this._syncTabSelection();
    this._setLoading(true, tab.name);
    this._setError("");

    if (this._rememberTab) {
      try { localStorage.setItem(this._storageKey, tab.id); } catch (_error) {}
    }

    try {
      const child = await this._getOrCreateChild(tab);
      if (token !== this._activationToken || this._activeId !== tab.id) return;

      const view = this.shadowRoot.querySelector("[data-view]");
      for (const instance of this._instances.values()) instance.hidden = true;
      if (!child.isConnected || child.parentElement !== view) view.append(child);
      child.hidden = false;
      child.narrow = this._narrow;
      child.hass = this._hass;
      this._ensureEmbeddedStyle(child);
      this._setLoading(false);
      this._syncTabSelection();
      this._scrollActiveTabIntoView();

      if (this._preload) this._schedulePreload(tab.id);
    } catch (error) {
      if (token !== this._activationToken || this._activeId !== tab.id) return;
      console.error(`Showroom Productos: no se pudo cargar ${tab.id}`, error);
      this._setLoading(false);
      this._setError(error?.message || "Error desconocido");
    }
  }

  async _getOrCreateChild(tab) {
    const existing = this._instances.get(tab.id);
    if (existing) {
      existing.panel = { config: { ...tab.config } };
      this._ensureEmbeddedStyle(existing);
      return existing;
    }

    await this._ensureModule(tab);
    const ChildElement = customElements.get(tab.element);
    if (!ChildElement) throw new Error(`El módulo no registró <${tab.element}>.`);

    const child = document.createElement(tab.element);
    child.style.display = "block";
    child.style.width = "100%";
    child.style.height = "100%";
    child.style.minHeight = "0";
    this._patchChildRender(child);
    child.panel = { config: { ...tab.config } };
    child.narrow = this._narrow;
    child.hass = this._hass;
    this._ensureEmbeddedStyle(child);
    this._instances.set(tab.id, child);
    return child;
  }

  async _ensureModule(tab) {
    if (customElements.get(tab.element)) return;
    let promise = this._moduleLoads.get(tab.moduleUrl);
    if (!promise) {
      promise = import(tab.moduleUrl);
      this._moduleLoads.set(tab.moduleUrl, promise);
    }
    try {
      await promise;
    } catch (error) {
      this._moduleLoads.delete(tab.moduleUrl);
      throw new Error(`No se pudo importar ${tab.moduleUrl}: ${error?.message || error}`);
    }
    if (!customElements.get(tab.element)) {
      throw new Error(`Se cargó ${tab.moduleUrl}, pero no registró <${tab.element}>.`);
    }
  }

  _patchChildRender(child) {
    if (child.__showroomCentralRenderPatched || typeof child.render !== "function") return;
    const originalRender = child.render;
    child.render = (...args) => {
      const result = originalRender.apply(child, args);
      this._ensureEmbeddedStyle(child);
      return result;
    };
    child.__showroomCentralRenderPatched = true;
  }

  _ensureEmbeddedStyle(child) {
    const root = child?.shadowRoot;
    if (!root || root.querySelector("style[data-showroom-central-sizing]")) return;
    const style = document.createElement("style");
    style.dataset.showroomCentralSizing = "";
    style.textContent = `
      /* El panel central no crea un segundo scroll. Cada ficha conserva su
         composición estática y únicamente .office-image__scroll puede panear
         verticalmente en tamaños estrechos. */
      :host { width:100% !important; max-width:100% !important; box-sizing:border-box !important; }
      @media (min-width:981px) {
        :host { height:100% !important; min-height:0 !important; overflow:hidden !important; }
        .layout, .office-image, .product-card { height:100% !important; min-height:0 !important; }
      }
      @media (max-width:980px) {
        :host { height:auto !important; min-height:100% !important; overflow:visible !important; }
        .layout { height:auto !important; min-height:100% !important; }
      }

      /* Smartphone: solo adapta el alto del custom element al viewport del
         panel central. El layout y los dos scrolls permitidos (foto y ficha
         técnica) pertenecen a cada módulo aislado. */
      @media (max-width:560px) {
        :host {
          height:100% !important;
          min-height:0 !important;
          overflow:hidden !important;
        }
        .layout {
          height:100% !important;
          min-height:0 !important;
          overflow:hidden !important;
        }
      }

      @media (min-width:700px) and (max-width:980px) and (orientation:portrait) {
        :host { height:100% !important; min-height:0 !important; overflow:hidden !important; }
        .layout {
          height:100% !important;
          min-height:100% !important;
          grid-template-rows: clamp(320px, 34%, 440px) minmax(0, 1fr) !important;
        }
        .office-image, .product-card { height:100% !important; min-height:0 !important; }
      }
    `;
    root.append(style);
  }

  _syncMountedChildren() {
    for (const [id, child] of this._instances.entries()) {
      const shouldSync = id === this._activeId || Boolean(child._pendingDesired);
      if (!shouldSync) continue;
      child.hass = this._hass;
      child.narrow = this._narrow;
      this._ensureEmbeddedStyle(child);
    }
  }

  _tabEntities(tab) {
    const entities = tab?.config?.entities;
    if (Array.isArray(entities) && entities.length) return [...new Set(entities.filter(Boolean).map(String))];
    const entity = tab?.config?.entity;
    return entity ? [String(entity)] : [];
  }

  _tabState(tab) {
    const entities = this._tabEntities(tab);
    if (!this._hass || !entities.length) return "unavailable";
    const states = entities.map((entityId) => this._hass.states?.[entityId]?.state || "unavailable");
    if (states.some((state) => state === "unknown" || state === "unavailable")) return "unavailable";
    const onCount = states.filter((state) => state === "on").length;
    if (onCount === states.length) return "on";
    if (onCount === 0) return "off";
    return "partial";
  }

  _updateTabStates() {
    for (const tab of this._tabs) {
      const button = this.shadowRoot.querySelector(`[data-tab-id="${this._cssEscape(tab.id)}"]`);
      if (!button) continue;
      const state = this._tabState(tab);
      button.dataset.state = state;
      const labels = { on: "Encendido", off: "Apagado", partial: "Parcial", unavailable: "No disponible" };
      button.title = `${tab.name} · ${labels[state] || state}`;
    }
  }

  _syncTabSelection() {
    for (const button of this.shadowRoot.querySelectorAll('[role="tab"][data-tab-id]')) {
      const selected = button.dataset.tabId === this._activeId;
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.tabIndex = selected ? 0 : -1;
    }
  }

  _scrollActiveTabIntoView() {
    const button = this.shadowRoot.querySelector(`[data-tab-id="${this._cssEscape(this._activeId)}"]`);
    if (!button) return;
    const mobile = window.matchMedia?.("(max-width: 760px)")?.matches;
    try {
      button.scrollIntoView({ block: "nearest", inline: mobile ? "center" : "nearest", behavior: "smooth" });
    } catch (_error) {}
  }

  _schedulePreload(activeId) {
    const preload = () => {
      for (const tab of this._tabs) {
        if (tab.id === activeId || customElements.get(tab.element)) continue;
        this._ensureModule(tab).catch((error) => console.warn(`Showroom Productos: precarga fallida ${tab.id}`, error));
      }
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(preload, { timeout: 1800 });
    else setTimeout(preload, 350);
  }

  _setLoading(visible, label = "") {
    const loading = this.shadowRoot.querySelector("[data-loading]");
    if (!loading) return;
    loading.hidden = !visible;
    const copy = loading.querySelector("[data-loading-label]");
    if (copy) copy.textContent = label ? `Preparando ${label}` : "";
  }

  _setError(message) {
    const error = this.shadowRoot.querySelector("[data-error]");
    if (!error) return;
    error.hidden = !message;
    const copy = error.querySelector("[data-error-message]");
    if (copy) copy.textContent = message || "";
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
}

if (!customElements.get("showroom-productos-panel")) {
  customElements.define("showroom-productos-panel", ShowroomProductosPanel);
}
