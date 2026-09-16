import {
  cancelCircularThemeTransition,
  runCircularThemeTransition,
} from "/local/witmind-theme-transition.js?v=1.0.0";

// Witmind Showroom Experimentos Panel v1.2.0 — transición circular compartida con presupuesto temporal.
const DEFAULT_SHOWROOM_CONFIG = Object.freeze({
  title: "Showroom",
  subtitle: "Control operativo",
  siteLabel: "WTX · MDTC",
  logo: "/local/logo-witmind.png?v=2.0.0",
  weather: "weather.forecast_casa",
  mediaPlayer: "media_player.showroom_1",
  lightCountSensor: "sensor.showroom_luminarias_encendidas",
  batteryLevel: "sensor.xiaomi_pad_admin_battery_level",
  batteryHealth: "sensor.xiaomi_pad_admin_battery_health",
  historyHours: 12,
  chartHours: 24,
  showForecast: true,
  themeTransitionDurationMs: 1000,
  thermostatLabel: "Pendiente de vincular",
  spots: [
    { entity: "switch.interruptor_inteligente_switch_1", name: "Spots ventana", subtitle: "Zona ventana", icon: "spot" },
    { entity: "switch.interruptor_inteligente_switch_2", name: "Spots 2x3", subtitle: "Muestra 2 × 3", icon: "spot" },
    { entity: "switch.interruptor_inteligente_switch_3", name: "Spots 3x3", subtitle: "Muestra 3 × 3", icon: "spot" },
    { entity: "switch.interruptor_inteligente_switch_4", name: "Spots TV", subtitle: "Zona audiovisual", icon: "spot" },
  ],
  samples: [
    { entity: "switch.interruptor_inteligente_2_switch_1", name: "Paneles 3k/6k", subtitle: "Temperaturas de color", icon: "panel" },
    { entity: "switch.interruptor_inteligente_2_switch_2", name: "Colgantes", subtitle: "Muestra suspendida", icon: "pendant" },
    { entity: "switch.interruptor_inteligente_2_switch_3", name: "Slims", subtitle: "Línea decorativa", icon: "strip" },
    { entity: "switch.interruptor_inteligente_2_switch_4", name: "Downlights", subtitle: "Iluminación empotrada", icon: "downlight" },
    { entity: "switch.smart_relay_switch_4_switch", name: "Paneles", subtitle: "Control por relé", icon: "screen" },
  ],
  reflector: {
    entity: "switch.smart_relay_switch_3_switch",
    name: "Reflector exterior",
    subtitle: "Control aislado",
    icon: "reflector",
  },
  scenes: [
    {
      entity: "scene.presentacion",
      name: "Presentación",
      subtitle: "Ventana + TV",
      icon: "presentation",
      onEntities: [
        "switch.interruptor_inteligente_switch_1",
        "switch.interruptor_inteligente_switch_4",
      ],
    },
    {
      entity: "scene.reunion",
      name: "Reunión",
      subtitle: "3x3 + Ventana + TV",
      icon: "people",
      onEntities: [
        "switch.interruptor_inteligente_switch_1",
        "switch.interruptor_inteligente_switch_3",
        "switch.interruptor_inteligente_switch_4",
      ],
    },
    {
      entity: "scene.muestra_spots",
      name: "Muestra Spots",
      subtitle: "2x3 + Ventana + TV",
      icon: "spot",
      onEntities: [
        "switch.interruptor_inteligente_switch_1",
        "switch.interruptor_inteligente_switch_2",
        "switch.interruptor_inteligente_switch_4",
      ],
    },
    {
      entity: "scene.slims",
      name: "Slims",
      subtitle: "Solo slims",
      icon: "strip",
      onEntities: ["switch.interruptor_inteligente_2_switch_3"],
    },
  ],
  powerOnScript: "script.showroom_encendido_general",
  powerOffScript: "script.showroom_apagado_general",
});

const CONDITION_LABELS = {
  "clear-night": "Noche despejada",
  cloudy: "Nublado",
  exceptional: "Condición excepcional",
  fog: "Niebla",
  hail: "Granizo",
  lightning: "Tormenta eléctrica",
  "lightning-rainy": "Tormenta y lluvia",
  partlycloudy: "Parcialmente nublado",
  pouring: "Lluvia intensa",
  rainy: "Lluvia",
  snowy: "Nieve",
  "snowy-rainy": "Aguanieve",
  sunny: "Soleado",
  windy: "Ventoso",
  "windy-variant": "Viento y nubes",
};

const CONDITION_SYMBOLS = {
  "clear-night": "☾",
  cloudy: "☁",
  exceptional: "!",
  fog: "≋",
  hail: "◆",
  lightning: "ϟ",
  "lightning-rainy": "ϟ",
  partlycloudy: "◒",
  pouring: "☂",
  rainy: "☂",
  snowy: "❄",
  "snowy-rainy": "❄",
  sunny: "☀",
  windy: "≈",
  "windy-variant": "≈",
};

const ICON_PATHS = {
  spot: '<path d="M4 4h7l3.6 3.6-5 5L4 7V4Zm10.5 8.5 1.4 1.4-4.2 4.2-1.4-1.4 4.2-4.2Zm3-3 1.4 1.4-1.8 1.8-1.4-1.4 1.8-1.8ZM8 14l1.4 1.4-1.8 1.8-1.4-1.4L8 14Zm10 2 1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1L18 16Z"/>',
  panel: '<path d="M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 2h8v2H8V8Zm0 4h8v4H8v-4Z"/>',
  pendant: '<path d="M11 2h2v6.1a6 6 0 0 1 5 5.9v1H6v-1a6 6 0 0 1 5-5.9V2Zm-3 15h8v2H8v-2Zm3 3h2v2h-2v-2Z"/>',
  strip: '<path d="M4 5h16v4H4V5Zm2 2h2V6H6v1Zm4 0h2V6h-2v1Zm4 0h2V6h-2v1Zm4 0h1V6h-1v1ZM4 11h16v8H4v-8Zm2 2v4h12v-4H6Z"/>',
  downlight: '<path d="M5 4h14l-2 8H7L5 4Zm4 10h6v2H9v-2Zm-2 4h10v2H7v-2Z"/>',
  screen: '<path d="M3 4h18v14H3V4Zm2 2v10h14V6H5Zm5 13h4v2h-4v-2Zm1-11h2v2h2v2h-2v2h-2v-2H9v-2h2V8Z"/>',
  reflector: '<path d="M4 5h10l3 3v6l-3 3H4V5Zm2 2v8h7l2-2V9l-2-2H6Zm12 2h2v6h-2V9Zm3-2h2v10h-2V7Z"/>',
  presentation: '<path d="M3 3h18v13H3V3Zm2 2v9h14V5H5Zm6 11h2v2.2l3.6 2.1-1 1.7-3.6-2.1L8.4 22l-1-1.7 3.6-2.1V16Z"/>',
  people: '<path d="M8 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8-1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 21v-3a6 6 0 0 1 12 0v3H2Zm13 0v-3c0-1.5-.4-2.9-1.2-4.1A5 5 0 0 1 22 18v3h-7Z"/>',
  power: '<path d="M11 2h2v10h-2V2Zm5.7 3.9 1.4-1.4A9 9 0 1 1 5.9 4.5l1.4 1.4A7 7 0 1 0 16.7 5.9Z"/>',
  bulb: '<path d="M9 21h6v-2H9v2Zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Zm2 11.5V15h-4v-1.5l-.5-.3A5 5 0 1 1 14.5 13l-.5.5Z"/>',
  music: '<path d="M9 3v12.3A3.5 3.5 0 1 0 11 18V8h8V4L9 3Zm-2 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>',
  play: '<path d="M8 5v14l11-7L8 5Z"/>',
  pause: '<path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z"/>',
  previous: '<path d="M6 5h2v14H6V5Zm12 1v12l-9-6 9-6Z"/>',
  next: '<path d="M16 5h2v14h-2V5ZM6 6l9 6-9 6V6Z"/>',
  volumeDown: '<path d="M4 9v6h4l5 4V5L8 9H4Zm11 1.5a3 3 0 0 1 0 3V16a5 5 0 0 0 0-8v2.5Z"/>',
  volumeUp: '<path d="M3 9v6h4l5 4V5L7 9H3Zm11 1.5a3 3 0 0 1 0 3V16a5 5 0 0 0 0-8v2.5Zm0-6v2.1a7 7 0 0 1 0 10.8v2.1a9 9 0 0 0 0-15Z"/>',
  refresh: '<path d="M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z"/>',
  battery: '<path d="M3 6h16v12H3V6Zm2 2v8h12V8H5Zm15 2h2v4h-2v-4Z"/>',
  health: '<path d="M12 21C7 17.5 3 14.1 3 9.6A4.6 4.6 0 0 1 11 6.5l1 1 1-1a4.6 4.6 0 0 1 8 3.1c0 4.5-4 7.9-9 11.4Zm-4-9h2l1-2.2 2 4.4L14 12h2"/>',
  thermometer: '<path d="M10 3a3 3 0 0 1 6 0v9.3a5 5 0 1 1-6 0V3Zm3 1a1 1 0 0 0-1 1v8.4l-.5.3a3 3 0 1 0 3 0l-.5-.3V5a1 1 0 0 0-1-1Z"/>',
  chart: '<path d="M4 19h17v2H2V3h2v16Zm2-3 4-5 3 3 5-7 1.6 1.2-6.4 9-3-3L7.6 17.2 6 16Z"/>',
  status: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 14-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7Z"/>',
};

const MENU_ICON = `
  <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6.5h18M3 12h18M3 17.5h18"></path>
  </svg>
`;

const THEME_ICON = `
  <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
    <g class="theme-icon-sun">
      <circle cx="12" cy="12" r="3.75"></circle>
      <path d="M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5M4.75 4.75l1.77 1.77M17.48 17.48l1.77 1.77M19.25 4.75l-1.77 1.77M6.52 17.48l-1.77 1.77"></path>
    </g>
    <path class="theme-icon-moon" d="M20.2 15.4A8.1 8.1 0 0 1 8.6 3.8a8.65 8.65 0 1 0 11.6 11.6Z"></path>
  </svg>
`;

class ShowroomExperimentosPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._started = false;
    this._renderQueued = false;
    this._forecast = [];
    this._history = [];
    this._historyError = "";
    this._liveStates = new Map();
    this._pendingSwitches = new Map();
    this._switchErrors = new Map();
    this._switchTimers = new Map();
    this._pendingAction = "";
    this._confirmAction = "";
    this._toast = null;
    this._toastTimer = null;
    this._clockTimer = null;
    this._historyTimer = null;
    this._unsubscribeStates = null;
    this._unsubscribeForecast = null;
    this._forecastEntity = "";
    this._themeStorageKey = "witmind-showroom-experimentos-panel-theme";
    this._theme = this._loadTheme();
    this._themeTransitionRunning = false;
    this._renderAfterThemeTransition = false;

    // No agregar atributos al host en el constructor. Home Assistant valida
    // que customElements.createElement() termine sin atributos propios.
    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
  }

  set hass(value) {
    this._hass = value;
    this._syncStatesFromHass();

    if (!this._started) {
      this._started = true;
      this._start();
    }

    this._requestRender();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    const previousWeather = this._config().weather;
    this._panel = value;
    const nextWeather = this._config().weather;

    if (this._started && previousWeather !== nextWeather) {
      this._resetForecastSubscription();
      this._subscribeWeather();
    }

    if (this._hass) {
      this._syncStatesFromHass();
      this._loadHistory();
      this._requestRender();
    }
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
    if (this._hass) this._requestRender();
  }

  disconnectedCallback() {
    cancelCircularThemeTransition(this);
    clearInterval(this._clockTimer);
    clearInterval(this._historyTimer);
    clearTimeout(this._toastTimer);
    for (const timer of this._switchTimers.values()) clearTimeout(timer);
    this._switchTimers.clear();
    this._resetForecastSubscription();
    if (this._unsubscribeStates) {
      this._unsubscribeStates();
      this._unsubscribeStates = null;
    }
    this._started = false;
  }

  _requestRender() {
    if (!this._hass || !this.shadowRoot) return;
    if (this._themeTransitionRunning) {
      this._renderAfterThemeTransition = true;
      return;
    }
    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      if (this._themeTransitionRunning) {
        this._renderAfterThemeTransition = true;
        return;
      }
      this.render();
    });
  }

  _handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target || !this._hass) return;

    const action = target.dataset.action;
    if (action === "toggle-menu") {
      this._toggleHomeAssistantMenu();
      return;
    }
    if (action === "toggle-theme") {
      this._toggleTheme(target);
      return;
    }
    if (action === "toggle-switch") {
      this._toggleSwitch(target.dataset.entity);
      return;
    }
    if (action === "run-scene") {
      this._runScene(target.dataset.entity, target.dataset.label);
      return;
    }
    if (action === "open-power-on") {
      if (!this._pendingAction) {
        this._confirmAction = "on";
        this._requestRender();
      }
      return;
    }
    if (action === "open-power-off") {
      if (!this._pendingAction) {
        this._confirmAction = "off";
        this._requestRender();
      }
      return;
    }
    if (action === "cancel-power-confirm") {
      const inside = event.target.closest("[data-dialog-card]");
      if (target.classList.contains("dialog-backdrop") && inside) return;
      if (!this._pendingAction) {
        this._confirmAction = "";
        this._requestRender();
      }
      return;
    }
    if (action === "confirm-power") {
      this._confirmGeneralPower();
      return;
    }
    if (action === "clear-scene") {
      this._clearScene();
      return;
    }
    if (action === "media") {
      this._mediaAction(target.dataset.service);
      return;
    }
    if (action === "refresh-history") {
      this._loadHistory();
    }
  }

  _toggleHomeAssistantMenu() {
    // Evento oficial empleado por Home Assistant para abrir o contraer
    // la barra lateral desde un panel personalizado dentro de Shadow DOM.
    this.dispatchEvent(
      new Event("hass-toggle-menu", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  _loadTheme() {
    try {
      const stored = localStorage.getItem(this._themeStorageKey);
      return stored === "dark" ? "dark" : "light";
    } catch (_error) {
      return "light";
    }
  }

  _saveTheme() {
    try {
      localStorage.setItem(this._themeStorageKey, this._theme);
    } catch (error) {
      console.warn("No se pudo guardar el tema del showroom:", error);
    }
  }

  _syncThemeButtonAccessibility() {
    const button = this.shadowRoot?.querySelector('[data-action="toggle-theme"]');
    if (!button) return;
    const nextTheme = this._theme === "dark" ? "claro" : "oscuro";
    const label = `Cambiar a tema ${nextTheme}`;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }

  _applyTheme(theme) {
    this._theme = theme;
    this.setAttribute("data-theme", theme);
    this._saveTheme();

    // Cambiar el atributo actualiza todas las variables CSS sin reconstruir el
    // Shadow DOM. Esto reduce el coste de la segunda captura y evita congelar
    // componentes, gráficos o controles durante la transición.
    this._syncThemeButtonAccessibility();
  }

  async _toggleTheme(button) {
    if (this._themeTransitionRunning) return;

    const nextTheme = this._theme === "dark" ? "light" : "dark";
    const scope = this.shadowRoot?.querySelector(".app-shell");
    const durationMs = this._config().themeTransitionDurationMs;

    this._themeTransitionRunning = true;
    this._renderAfterThemeTransition = false;

    try {
      await runCircularThemeTransition({
        host: this,
        scope,
        trigger: button,
        durationMs,
        apply: () => this._applyTheme(nextTheme),
      });
    } finally {
      this._themeTransitionRunning = false;
      if (this._renderAfterThemeTransition) {
        this._renderAfterThemeTransition = false;
        this._requestRender();
      }
    }
  }

  _config() {
    const raw = this._panel?.config || {};
    const normalizeEntityIds = (items) => {
      if (!Array.isArray(items)) return [];
      return [...new Set(items.filter(Boolean).map((item) => String(item)))];
    };
    const normalizeDevices = (items, fallback) => {
      const source = Array.isArray(items) && items.length ? items : fallback;
      return source
        .filter((item) => item?.entity)
        .map((item, index) => ({
          entity: String(item.entity),
          name: item.name || `Dispositivo ${index + 1}`,
          subtitle: item.subtitle || "Iluminación",
          icon: item.icon || "bulb",
        }));
    };

    const spots = normalizeDevices(raw.spots, DEFAULT_SHOWROOM_CONFIG.spots);
    const samples = normalizeDevices(raw.samples || raw.muestras, DEFAULT_SHOWROOM_CONFIG.samples);
    const defaultControlEntities = [...spots, ...samples].map((item) => item.entity);
    const configuredControlEntities = normalizeEntityIds(
      raw.scene_control_entities || raw.sceneControlEntities,
    );
    const sceneControlEntities = configuredControlEntities.length
      ? configuredControlEntities
      : defaultControlEntities;

    const normalizeScenes = (items) => {
      const source = Array.isArray(items) && items.length ? items : DEFAULT_SHOWROOM_CONFIG.scenes;
      return source
        .filter((item) => item?.entity)
        .map((item, index) => {
          const defaultScene = DEFAULT_SHOWROOM_CONFIG.scenes.find(
            (candidate) => candidate.entity === item.entity,
          );
          const hasExplicitOn =
            Array.isArray(item.on_entities) || Array.isArray(item.onEntities);
          const hasExplicitOff =
            Array.isArray(item.off_entities) || Array.isArray(item.offEntities);
          const onEntities = normalizeEntityIds(
            hasExplicitOn
              ? (item.on_entities || item.onEntities)
              : defaultScene?.onEntities,
          );
          const explicitOff = normalizeEntityIds(
            hasExplicitOff ? (item.off_entities || item.offEntities) : [],
          );
          const offEntities = hasExplicitOff
            ? explicitOff.filter((entityId) => !onEntities.includes(entityId))
            : sceneControlEntities.filter((entityId) => !onEntities.includes(entityId));

          return {
            entity: String(item.entity),
            name: item.name || `Escena ${index + 1}`,
            subtitle: item.subtitle || "Escena del showroom",
            icon: item.icon || "presentation",
            onEntities,
            offEntities,
          };
        });
    };

    const reflectorRaw = raw.reflector || DEFAULT_SHOWROOM_CONFIG.reflector;
    const historyHours = Number(raw.history_hours ?? raw.historyHours);
    const chartHours = Number(raw.chart_hours ?? raw.chartHours);
    const themeTransitionDurationMs = Number(
      raw.theme_transition_duration_ms ?? raw.themeTransitionDurationMs,
    );

    return {
      title: raw.title || DEFAULT_SHOWROOM_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_SHOWROOM_CONFIG.subtitle,
      siteLabel: raw.site_label || raw.siteLabel || DEFAULT_SHOWROOM_CONFIG.siteLabel,
      logo: raw.logo || DEFAULT_SHOWROOM_CONFIG.logo,
      weather: raw.weather || DEFAULT_SHOWROOM_CONFIG.weather,
      mediaPlayer: raw.media_player || raw.mediaPlayer || DEFAULT_SHOWROOM_CONFIG.mediaPlayer,
      lightCountSensor:
        raw.light_count_sensor || raw.lightCountSensor || DEFAULT_SHOWROOM_CONFIG.lightCountSensor,
      batteryLevel:
        raw.battery_level || raw.batteryLevel || DEFAULT_SHOWROOM_CONFIG.batteryLevel,
      batteryHealth:
        raw.battery_health || raw.batteryHealth || DEFAULT_SHOWROOM_CONFIG.batteryHealth,
      powerOnScript:
        raw.power_on_script || raw.powerOnScript || DEFAULT_SHOWROOM_CONFIG.powerOnScript,
      powerOffScript:
        raw.power_off_script || raw.powerOffScript || DEFAULT_SHOWROOM_CONFIG.powerOffScript,
      historyHours:
        Number.isFinite(historyHours) && historyHours > 0
          ? Math.min(24, historyHours)
          : DEFAULT_SHOWROOM_CONFIG.historyHours,
      chartHours:
        Number.isFinite(chartHours) && chartHours > 0
          ? Math.min(72, chartHours)
          : DEFAULT_SHOWROOM_CONFIG.chartHours,
      showForecast:
        raw.show_forecast ?? raw.showForecast ?? DEFAULT_SHOWROOM_CONFIG.showForecast,
      themeTransitionDurationMs:
        Number.isFinite(themeTransitionDurationMs) && themeTransitionDurationMs > 0
          ? themeTransitionDurationMs
          : DEFAULT_SHOWROOM_CONFIG.themeTransitionDurationMs,
      thermostatLabel:
        raw.thermostat_label || raw.thermostatLabel || DEFAULT_SHOWROOM_CONFIG.thermostatLabel,
      spots,
      samples,
      sceneControlEntities,
      reflector: reflectorRaw?.entity
        ? {
            entity: String(reflectorRaw.entity),
            name: reflectorRaw.name || DEFAULT_SHOWROOM_CONFIG.reflector.name,
            subtitle: reflectorRaw.subtitle || DEFAULT_SHOWROOM_CONFIG.reflector.subtitle,
            icon: reflectorRaw.icon || DEFAULT_SHOWROOM_CONFIG.reflector.icon,
          }
        : null,
      scenes: normalizeScenes(raw.scenes),
    };
  }

  _allDevices() {
    const config = this._config();
    return [
      ...config.spots,
      ...config.samples,
      ...(config.reflector ? [config.reflector] : []),
    ];
  }

  _trackedEntities() {
    const config = this._config();
    return new Set([
      ...this._allDevices().map((item) => item.entity),
      ...config.sceneControlEntities,
      ...config.scenes.flatMap((item) => [
        item.entity,
        ...item.onEntities,
        ...item.offEntities,
      ]),
      config.weather,
      config.mediaPlayer,
      config.lightCountSensor,
      config.batteryLevel,
      config.batteryHealth,
      config.powerOnScript,
      config.powerOffScript,
    ].filter(Boolean));
  }

  async _start() {
    this._clockTimer = setInterval(() => this._updateClock(), 30_000);
    this._historyTimer = setInterval(() => this._loadHistory(), 180_000);

    await Promise.allSettled([
      this._fetchCurrentStates(),
      this._subscribeStateChanges(),
      this._subscribeWeather(),
      this._loadHistory(),
    ]);
  }

  _syncStatesFromHass() {
    if (!this._hass?.states) return;
    for (const entityId of this._trackedEntities()) {
      const stateObject = this._hass.states[entityId];
      if (stateObject) this._applyLiveState(entityId, stateObject);
    }
  }

  _applyLiveState(entityId, stateObject) {
    if (!stateObject) {
      this._liveStates.delete(entityId);
      return;
    }
    this._liveStates.set(entityId, stateObject);

    const pending = this._pendingSwitches.get(entityId);
    if (pending && stateObject.state === pending.desired) {
      this._pendingSwitches.delete(entityId);
      this._switchErrors.delete(entityId);
      const timer = this._switchTimers.get(entityId);
      if (timer) clearTimeout(timer);
      this._switchTimers.delete(entityId);
    }
  }

  async _fetchCurrentStates() {
    if (!this._hass?.callWS) return;
    try {
      const states = await this._hass.callWS({ type: "get_states" });
      const tracked = this._trackedEntities();
      for (const stateObject of states || []) {
        if (tracked.has(stateObject.entity_id)) {
          this._applyLiveState(stateObject.entity_id, stateObject);
        }
      }
      this._requestRender();
    } catch (error) {
      console.error("No se pudieron sincronizar los estados del showroom:", error);
    }
  }

  async _subscribeStateChanges() {
    if (!this._hass?.connection || this._unsubscribeStates) return;
    try {
      this._unsubscribeStates = await this._hass.connection.subscribeEvents(
        (event) => {
          const entityId = event?.data?.entity_id;
          if (!entityId || !this._trackedEntities().has(entityId)) return;
          this._applyLiveState(entityId, event.data.new_state);
          this._requestRender();
        },
        "state_changed",
      );
    } catch (error) {
      console.error("No se pudo suscribir a state_changed:", error);
    }
  }

  _resetForecastSubscription() {
    if (this._unsubscribeForecast) {
      this._unsubscribeForecast();
      this._unsubscribeForecast = null;
    }
    this._forecastEntity = "";
  }

  async _subscribeWeather() {
    const config = this._config();
    if (!this._hass?.connection || !config.weather) return;
    if (this._unsubscribeForecast && this._forecastEntity === config.weather) return;
    this._resetForecastSubscription();

    try {
      this._forecastEntity = config.weather;
      this._unsubscribeForecast = await this._hass.connection.subscribeMessage(
        (event) => {
          this._forecast = Array.isArray(event?.forecast) ? event.forecast : [];
          this._requestRender();
        },
        {
          type: "weather/subscribe_forecast",
          forecast_type: "daily",
          entity_id: config.weather,
        },
      );
    } catch (error) {
      this._forecastEntity = "";
      console.error("No se pudo cargar el pronóstico:", error);
    }
  }

  async _loadHistory() {
    const config = this._config();
    if (!this._hass?.callApi) return;

    const hours = Math.max(config.historyHours, config.chartHours);
    const start = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const end = new Date().toISOString();
    const entityIds = [
      config.lightCountSensor,
      ...config.spots.map((item) => item.entity),
      ...config.samples.map((item) => item.entity),
    ].filter(Boolean).join(",");

    if (!entityIds) return;

    const path =
      `history/period/${encodeURIComponent(start)}` +
      `?filter_entity_id=${encodeURIComponent(entityIds)}` +
      `&end_time=${encodeURIComponent(end)}` +
      "&minimal_response&no_attributes";

    try {
      this._history = await this._hass.callApi("GET", path);
      this._historyError = "";
    } catch (error) {
      this._history = [];
      this._historyError = "No se pudo cargar el historial.";
      console.error("No se pudo cargar el historial del showroom:", error);
    }
    this._requestRender();
  }

  _state(entityId) {
    return this._liveStates.get(entityId) || this._hass?.states?.[entityId];
  }

  _isUnavailable(entityId) {
    const state = this._state(entityId)?.state;
    return !state || state === "unknown" || state === "unavailable";
  }

  _visibleSwitchState(entityId) {
    return this._pendingSwitches.get(entityId)?.desired || this._state(entityId)?.state || "unavailable";
  }

  async _toggleSwitch(entityId) {
    if (!entityId || !this._hass) return;
    const stateObject = this._state(entityId);
    if (!stateObject || ["unknown", "unavailable"].includes(stateObject.state)) {
      this._switchErrors.set(entityId, "No disponible");
      this._requestRender();
      return;
    }

    const visibleState = this._visibleSwitchState(entityId);
    const desired = visibleState === "on" ? "off" : "on";
    const service = desired === "on" ? "turn_on" : "turn_off";
    const domain = entityId.split(".")[0] || "switch";

    this._pendingSwitches.set(entityId, { desired, startedAt: Date.now() });
    this._switchErrors.delete(entityId);
    this._requestRender();

    try {
      await this._hass.callService(domain, service, { entity_id: entityId });
      const previousTimer = this._switchTimers.get(entityId);
      if (previousTimer) clearTimeout(previousTimer);
      const timer = setTimeout(() => this._verifySwitchState(entityId, desired), 6000);
      this._switchTimers.set(entityId, timer);
    } catch (error) {
      this._pendingSwitches.delete(entityId);
      this._switchErrors.set(entityId, "La acción falló");
      this._requestRender();
      console.error(`Error ejecutando ${service} en ${entityId}:`, error);
    }
  }

  async _verifySwitchState(entityId, desired) {
    await this._fetchCurrentStates();
    const confirmed = this._state(entityId)?.state === desired;
    this._pendingSwitches.delete(entityId);
    this._switchTimers.delete(entityId);
    if (confirmed) this._switchErrors.delete(entityId);
    else this._switchErrors.set(entityId, "Sin confirmación");
    this._requestRender();
  }

  _sceneStatus(scene) {
    const expectations = [
      ...scene.onEntities.map((entityId) => ({ entityId, desired: "on" })),
      ...scene.offEntities.map((entityId) => ({ entityId, desired: "off" })),
    ];

    if (!expectations.length) {
      return { active: false, unavailable: false, mismatches: [] };
    }

    const unavailable = expectations.some(({ entityId }) => this._isUnavailable(entityId));
    const mismatches = expectations.filter(
      ({ entityId, desired }) => this._state(entityId)?.state !== desired,
    );

    return {
      active: !unavailable && mismatches.length === 0,
      unavailable,
      mismatches,
    };
  }

  _sceneExpectations(scene) {
    return [
      ...scene.offEntities.map((entityId) => ({ entityId, desired: "off" })),
      ...scene.onEntities.map((entityId) => ({ entityId, desired: "on" })),
    ];
  }

  _markExpectedStates(expectations) {
    const startedAt = Date.now();
    for (const { entityId, desired } of expectations) {
      this._pendingSwitches.set(entityId, { desired, startedAt });
      this._switchErrors.delete(entityId);
    }
  }

  _clearExpectedStates(expectations) {
    for (const { entityId } of expectations) {
      this._pendingSwitches.delete(entityId);
      const timer = this._switchTimers.get(entityId);
      if (timer) clearTimeout(timer);
      this._switchTimers.delete(entityId);
    }
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

  async _waitForExpectedStates(expectations, timeoutMs = 7000) {
    const deadline = Date.now() + timeoutMs;
    let mismatches = expectations;

    while (Date.now() < deadline) {
      await this._fetchCurrentStates();
      mismatches = expectations.filter(
        ({ entityId, desired }) => this._state(entityId)?.state !== desired,
      );
      if (!mismatches.length) return { ok: true, mismatches: [] };
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    return { ok: false, mismatches };
  }

  async _runScene(entityId, label) {
    if (!entityId || this._pendingAction) return;

    const scene = this._config().scenes.find((item) => item.entity === entityId);
    if (!scene) {
      this._notify("La escena no está configurada.", "error");
      return;
    }

    const expectations = this._sceneExpectations(scene);
    this._pendingAction = entityId;
    this._markExpectedStates(expectations);
    this._requestRender();

    let sceneServiceError = null;

    try {
      // Se conserva la escena de Home Assistant para cualquier acción adicional
      // que tenga configurada. El perfil determinista se aplica después para
      // garantizar que no queden luminarias de otro modo encendidas.
      try {
        await this._hass.callService("scene", "turn_on", { entity_id: entityId });
      } catch (error) {
        sceneServiceError = error;
        console.warn(`La escena ${entityId} no respondió; se aplicará el perfil directo.`, error);
      }

      await this._setEntitiesState(scene.offEntities, "off");
      await this._setEntitiesState(scene.onEntities, "on");

      const verification = await this._waitForExpectedStates(expectations);
      if (!verification.ok) {
        const failed = verification.mismatches.map((item) => item.entityId).join(", ");
        throw new Error(`No se confirmaron los estados de: ${failed}`);
      }

      const message = sceneServiceError
        ? `${label || "Modo"} aplicado mediante control directo.`
        : `${label || "Modo"} activo.`;
      this._notify(message, "success");
    } catch (error) {
      for (const { entityId: failedEntity, desired } of expectations) {
        if (this._state(failedEntity)?.state !== desired) {
          this._switchErrors.set(failedEntity, "No confirmó el modo");
        }
      }
      this._notify("No se pudo aplicar completamente el modo seleccionado.", "error");
      console.error("Error aplicando modo del showroom:", error);
    } finally {
      this._clearExpectedStates(expectations);
      this._pendingAction = "";
      await this._fetchCurrentStates();
      this._requestRender();
    }
  }

  async _executeGeneralPower(desired, options = {}) {
    if (!this._hass || this._pendingAction || !["on", "off"].includes(desired)) {
      return false;
    }

    const config = this._config();
    const scriptEntity = desired === "on" ? config.powerOnScript : config.powerOffScript;
    if (!scriptEntity) {
      this._notify("El control general no está configurado.", "error");
      return false;
    }

    const expectations = config.sceneControlEntities.map((entityId) => ({
      entityId,
      desired,
    }));
    const successMessage = options.successMessage ||
      (desired === "on" ? "Iluminación general encendida." : "Iluminación general apagada.");
    const errorMessage = options.errorMessage ||
      (desired === "on"
        ? "No se pudo encender toda la iluminación."
        : "No se pudo apagar toda la iluminación.");

    this._pendingAction = scriptEntity;
    this._markExpectedStates(expectations);
    this._requestRender();

    let scriptError = null;

    try {
      // El script conserva cualquier automatización adicional definida en Home
      // Assistant. El ajuste directo posterior hace determinista el estado de
      // las luminarias que participan en escenas y evita resultados parciales.
      try {
        await this._hass.callService("script", "turn_on", {
          entity_id: scriptEntity,
        });
      } catch (error) {
        scriptError = error;
        console.warn(`El script ${scriptEntity} no respondió; se aplicará el control directo.`, error);
      }

      await this._setEntitiesState(config.sceneControlEntities, desired);
      const verification = await this._waitForExpectedStates(expectations);

      if (!verification.ok) {
        const failed = verification.mismatches.map((item) => item.entityId).join(", ");
        throw new Error(`No se confirmaron los estados de: ${failed}`);
      }

      this._confirmAction = "";
      this._notify(successMessage, "success");
      return true;
    } catch (error) {
      for (const { entityId, desired: expectedState } of expectations) {
        if (this._state(entityId)?.state !== expectedState) {
          this._switchErrors.set(entityId, "Sin confirmación");
        }
      }
      this._notify(errorMessage, "error");
      console.error("Error ejecutando el control general del showroom:", {
        error,
        scriptError,
        desired,
      });
      return false;
    } finally {
      this._clearExpectedStates(expectations);
      this._pendingAction = "";
      await this._fetchCurrentStates();
      this._requestRender();
    }
  }

  async _confirmGeneralPower() {
    const desired = this._confirmAction;
    if (!["on", "off"].includes(desired)) return;

    await this._executeGeneralPower(desired, {
      successMessage:
        desired === "on"
          ? "Toda la iluminación del showroom está encendida."
          : "Toda la iluminación del showroom está apagada.",
    });
  }

  async _clearScene() {
    if (this._pendingAction) return;

    await this._executeGeneralPower("off", {
      successMessage: "Escena apagada. La iluminación del showroom quedó apagada.",
      errorMessage: "No se pudo apagar completamente la escena.",
    });
  }

  async _mediaAction(service) {
    const entityId = this._config().mediaPlayer;
    if (!entityId || !service || this._isUnavailable(entityId)) return;
    try {
      await this._hass.callService("media_player", service, { entity_id: entityId });
    } catch (error) {
      this._notify("No se pudo controlar el reproductor.", "error");
      console.error(`Error ejecutando media_player.${service}:`, error);
    }
  }

  _notify(message, type = "success") {
    clearTimeout(this._toastTimer);
    this._toast = { message, type };
    this._requestRender();
    this._toastTimer = setTimeout(() => {
      this._toast = null;
      this._requestRender();
    }, 4200);
  }

  _historyMap() {
    const result = new Map();
    for (const group of this._history || []) {
      const entityId = group?.[0]?.entity_id;
      if (entityId) result.set(entityId, group);
    }
    return result;
  }

  _historySegments(group, startTime, endTime) {
    if (!Array.isArray(group) || !group.length) return [];
    const events = group
      .map((item) => ({
        state: item.state,
        time: new Date(item.last_changed || item.last_updated).getTime(),
      }))
      .filter((item) => Number.isFinite(item.time))
      .sort((a, b) => a.time - b.time);
    if (!events.length) return [];

    const segments = [];
    for (let index = 0; index < events.length; index += 1) {
      const current = events[index];
      const next = events[index + 1];
      const start = Math.max(startTime, current.time);
      const end = Math.min(endTime, next?.time ?? endTime);
      if (end <= start) continue;
      segments.push({
        state: current.state,
        left: ((start - startTime) / (endTime - startTime)) * 100,
        width: ((end - start) / (endTime - startTime)) * 100,
      });
    }
    return segments;
  }

  _sparkline(entityId, hours) {
    const group = this._historyMap().get(entityId) || [];
    const endTime = Date.now();
    const startTime = endTime - hours * 60 * 60 * 1000;
    const points = group
      .map((item) => ({
        value: Number(item.state),
        time: new Date(item.last_changed || item.last_updated).getTime(),
      }))
      .filter((item) => Number.isFinite(item.value) && Number.isFinite(item.time) && item.time >= startTime)
      .sort((a, b) => a.time - b.time);

    const current = Number(this._state(entityId)?.state);
    if (Number.isFinite(current)) points.push({ value: current, time: endTime });
    if (!points.length) return { path: "", min: "—", max: "—", avg: "—" };

    const values = points.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const range = max - min || 1;
    const path = points
      .map((item, index) => {
        const x = ((item.time - startTime) / (endTime - startTime)) * 300;
        const y = 66 - ((item.value - min) / range) * 52;
        return `${index ? "L" : "M"}${Math.max(0, Math.min(300, x)).toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    return {
      path,
      min: this._formatNumber(min),
      max: this._formatNumber(max),
      avg: this._formatNumber(avg),
    };
  }

  _formatNumber(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 }).format(value);
  }

  _updateClock() {
    if (!this.shadowRoot) return;

    const now = new Date();
    const parts = new Intl.DateTimeFormat("es-BO", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(now);

    const hour = parts.find((part) => part.type === "hour")?.value || "--";
    const minute = parts.find((part) => part.type === "minute")?.value || "--";
    const period = (parts.find((part) => part.type === "dayPeriod")?.value || "")
      .replaceAll(".", "")
      .replaceAll(" ", "")
      .toUpperCase();

    for (const element of this.shadowRoot.querySelectorAll("[data-clock-time]")) {
      element.textContent = `${hour}:${minute}`;
    }

    for (const element of this.shadowRoot.querySelectorAll("[data-clock-period]")) {
      element.textContent = period || "—";
    }

    const timeElement = this.shadowRoot.querySelector("[data-current-time]");
    if (timeElement) {
      timeElement.dateTime = now.toISOString();
      timeElement.setAttribute("aria-label", `${hour}:${minute} ${period}`.trim());
    }
  }

  _icon(name, className = "") {
    const path = ICON_PATHS[name] || ICON_PATHS.bulb;
    return `<svg class="icon ${this._escape(className)}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _renderDevice(item) {
    const stateObject = this._state(item.entity);
    const state = this._visibleSwitchState(item.entity);
    const isOn = state === "on";
    const unavailable = !stateObject || ["unknown", "unavailable"].includes(stateObject.state);
    const pending = this._pendingSwitches.has(item.entity);
    const error = this._switchErrors.get(item.entity);
    const status = error || (pending
      ? (state === "on" ? "Encendiendo…" : "Apagando…")
      : unavailable
        ? "No disponible"
        : isOn
          ? "Encendido"
          : "Apagado");

    return `
      <button
        class="device ${isOn ? "is-on" : ""} ${pending ? "is-pending" : ""} ${error ? "is-error" : ""}"
        data-action="toggle-switch"
        data-entity="${this._escape(item.entity)}"
        aria-pressed="${isOn}"
        aria-label="${this._escape(`${item.name}: ${status}`)}"
        ${unavailable ? "disabled" : ""}
      >
        <span class="device-icon">${this._icon(item.icon)}</span>
        <span class="device-copy">
          <strong>${this._escape(item.name)}</strong>
          <small>${this._escape(status)}</small>
        </span>
        <span class="device-switch" aria-hidden="true"><i></i></span>
      </button>
    `;
  }

  _renderDeviceGroup(title, eyebrow, items) {
    return `
      <section class="surface control-section">
        <div class="section-heading compact-heading">
          <div>
            <span class="eyebrow">${this._escape(eyebrow)}</span>
            <h2>${this._escape(title)}</h2>
          </div>
        </div>
        <div class="device-grid">${items.map((item) => this._renderDevice(item)).join("")}</div>
      </section>
    `;
  }

  _renderWeather() {
    const config = this._config();
    const stateObject = this._state(config.weather);
    if (!stateObject) {
      return `
        <section class="surface weather-card is-unavailable">
          <span class="eyebrow">Clima</span>
          <h2>Entidad no encontrada</h2>
          <code>${this._escape(config.weather)}</code>
        </section>
      `;
    }

    const attrs = stateObject.attributes || {};
    const condition = stateObject.state;
    const forecast = this._forecast.slice(0, 3);
    return `
      <section class="surface weather-card">
        <div class="weather-main">
          <div class="weather-symbol">${this._escape(CONDITION_SYMBOLS[condition] || "·")}</div>
          <div class="weather-copy">
            <span class="eyebrow">Clima · Casa</span>
            <h2>${this._escape(CONDITION_LABELS[condition] || condition)}</h2>
            <p>Humedad ${this._escape(attrs.humidity ?? "—")}% · Viento ${this._escape(attrs.wind_speed ?? "—")} ${this._escape(attrs.wind_speed_unit ?? "")}</p>
          </div>
          <strong class="temperature">${this._escape(attrs.temperature ?? "—")}${this._escape(attrs.temperature_unit ?? "°")}</strong>
        </div>
        ${config.showForecast ? `
          <div class="forecast-row">
            ${forecast.length ? forecast.map((item) => {
              const date = new Date(item.datetime);
              const label = new Intl.DateTimeFormat("es-BO", { weekday: "short" }).format(date);
              return `
                <div class="forecast-item">
                  <span>${this._escape(label)}</span>
                  <b>${this._escape(CONDITION_SYMBOLS[item.condition] || "·")}</b>
                  <strong>${this._escape(item.temperature ?? item.native_temperature ?? "—")}°</strong>
                </div>
              `;
            }).join("") : '<span class="forecast-empty">Pronóstico no disponible</span>'}
          </div>
        ` : ""}
      </section>
    `;
  }

  _renderMedia() {
    const config = this._config();
    const stateObject = this._state(config.mediaPlayer);
    const unavailable = !stateObject || ["unknown", "unavailable"].includes(stateObject.state);
    const attrs = stateObject?.attributes || {};
    const isPlaying = stateObject?.state === "playing";
    const stateLabel = unavailable
      ? "No disponible"
      : isPlaying
        ? "Reproduciendo"
        : stateObject?.state === "paused"
          ? "En pausa"
          : stateObject?.state === "idle"
            ? "En espera"
            : stateObject?.state || "Detenido";
    const title = attrs.media_title || attrs.friendly_name || "Showroom 1";
    const artist = attrs.media_artist || attrs.source || "Música del showroom";
    const volume = Number(attrs.volume_level);

    const control = (service, icon, label, primary = false) => `
      <button
        class="media-button ${primary ? "primary" : ""}"
        data-action="media"
        data-service="${service}"
        aria-label="${this._escape(label)}"
        title="${this._escape(label)}"
        ${unavailable ? "disabled" : ""}
      >${this._icon(icon)}</button>
    `;

    return `
      <section class="surface media-card ${unavailable ? "is-unavailable" : ""}">
        <div class="section-heading compact-heading">
          <div>
            <span class="eyebrow">Multimedia</span>
            <h2>Música</h2>
          </div>
          <span class="media-state ${isPlaying ? "is-playing" : ""}">${this._escape(stateLabel)}</span>
        </div>
        <div class="media-body">
          <div class="media-art">${this._icon("music")}</div>
          <div class="media-copy">
            <strong>${this._escape(title)}</strong>
            <span>${this._escape(artist)}</span>
            <small>${Number.isFinite(volume) ? `Volumen ${Math.round(volume * 100)}%` : "Volumen no informado"}</small>
          </div>
        </div>
        <div class="media-controls">
          ${control("volume_down", "volumeDown", "Bajar volumen")}
          ${control("media_previous_track", "previous", "Pista anterior")}
          ${control("media_play_pause", isPlaying ? "pause" : "play", isPlaying ? "Pausar" : "Reproducir", true)}
          ${control("media_next_track", "next", "Pista siguiente")}
          ${control("volume_up", "volumeUp", "Subir volumen")}
        </div>
      </section>
    `;
  }

  _renderScenes() {
    const config = this._config();
    const activeScene = config.scenes.find((scene) => this._sceneStatus(scene).active);
    const clearPending = this._pendingAction === config.powerOffScript;
    const clearDisabled = Boolean(this._pendingAction) || !activeScene;

    return `
      <section class="surface scenes-card">
        <div class="section-heading compact-heading scenes-heading">
          <div>
            <span class="eyebrow">Ambientes</span>
            <h2>Escenas</h2>
          </div>
          <div class="scene-heading-actions">
            <span class="scene-summary ${activeScene ? "is-active" : ""}">
              ${this._escape(clearPending ? "Apagando…" : activeScene ? activeScene.name : "Modo manual")}
            </span>
            <button
              class="clear-scene-button"
              data-action="clear-scene"
              aria-label="Apagar la escena activa"
              title="Apagar escena"
              ${clearDisabled && !clearPending ? "disabled" : ""}
            >
              <span>${this._icon("power")}</span>
              <strong>${clearPending ? "Apagando…" : "Apagar escena"}</strong>
            </button>
          </div>
        </div>
        <div class="scene-grid">
          ${config.scenes.map((scene) => {
            const pending = this._pendingAction === scene.entity;
            const status = this._sceneStatus(scene);
            const stateText = pending
              ? "Aplicando…"
              : status.active
                ? "Activo"
                : status.unavailable
                  ? "Sin datos"
                  : "Inactivo";

            return `
              <button
                class="scene ${pending ? "is-pending" : ""} ${status.active ? "is-active" : ""} ${status.unavailable ? "is-unavailable" : ""}"
                data-action="run-scene"
                data-entity="${this._escape(scene.entity)}"
                data-label="${this._escape(scene.name)}"
                aria-pressed="${status.active}"
                aria-label="${this._escape(`${scene.name}: ${stateText}`)}"
                ${this._pendingAction && !pending ? "disabled" : ""}
              >
                <span class="scene-icon">${this._icon(scene.icon)}</span>
                <span class="scene-copy">
                  <strong>${this._escape(scene.name)}</strong>
                  <small>${this._escape(scene.subtitle)}</small>
                </span>
                <span class="scene-state">${this._escape(stateText)}</span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  _renderGeneralControl() {
    const config = this._config();
    const onPending = this._pendingAction === config.powerOnScript;
    const offPending = this._pendingAction === config.powerOffScript;
    return `
      <section class="surface general-card">
        <div class="section-heading compact-heading">
          <div>
            <span class="eyebrow">Acciones rápidas</span>
            <h2>Control general</h2>
          </div>
        </div>
        <div class="general-actions">
          <button class="general-action power-on" data-action="open-power-on" ${this._pendingAction ? "disabled" : ""}>
            <span>${this._icon("bulb")}</span>
            <strong>${onPending ? "Encendiendo…" : "Encender todo"}</strong>
          </button>
          <button class="general-action power-off" data-action="open-power-off" ${this._pendingAction ? "disabled" : ""}>
            <span>${this._icon("power")}</span>
            <strong>${offPending ? "Apagando…" : "Apagar todo"}</strong>
          </button>
        </div>
        ${config.reflector ? `
          <div class="isolated-control">
            <span class="isolated-label">Control aislado</span>
            ${this._renderDevice(config.reflector)}
          </div>
        ` : ""}
      </section>
    `;
  }

  _renderActivity() {
    const config = this._config();
    const currentState = this._state(config.lightCountSensor);
    const currentValue = Number(currentState?.state);
    const unit = currentState?.attributes?.unit_of_measurement || "luces";
    const spark = this._sparkline(config.lightCountSensor, config.chartHours);
    const historyMap = this._historyMap();
    const endTime = Date.now();
    const startTime = endTime - config.historyHours * 60 * 60 * 1000;
    const timelineItems = [...config.spots, ...config.samples];

    return `
      <section class="surface activity-card">
        <div class="section-heading compact-heading">
          <div>
            <span class="eyebrow">Últimas ${this._escape(config.chartHours)} h</span>
            <h2>Actividad de luminarias</h2>
          </div>
          <button class="icon-button" data-action="refresh-history" aria-label="Actualizar historial" title="Actualizar historial">${this._icon("refresh")}</button>
        </div>
        ${this._historyError ? `<p class="inline-error">${this._escape(this._historyError)}</p>` : ""}
        <div class="activity-summary">
          <div class="activity-value">
            <strong>${Number.isFinite(currentValue) ? this._escape(currentValue) : "—"}</strong>
            <span>${this._escape(unit)}</span>
          </div>
          <div class="chart-metrics">
            <span>Mín <b>${spark.min}</b></span>
            <span>Prom <b>${spark.avg}</b></span>
            <span>Máx <b>${spark.max}</b></span>
          </div>
        </div>
        <div class="sparkline" aria-label="Historial de luminarias encendidas">
          <svg viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true">
            <path class="spark-grid" d="M0 18H300M0 36H300M0 54H300"></path>
            ${spark.path ? `<path class="spark-area" d="${spark.path} L300,70 L0,70 Z"></path><path class="spark-path" d="${spark.path}"></path>` : ""}
          </svg>
          ${spark.path ? "" : '<span class="chart-empty">Sin historial numérico</span>'}
        </div>
        <div class="timeline-heading">
          <strong>Línea de tiempo</strong>
          <span>${this._escape(config.historyHours)} h</span>
        </div>
        <div class="timeline-list">
          ${timelineItems.map((item) => {
            const segments = this._historySegments(historyMap.get(item.entity) || [], startTime, endTime);
            return `
              <div class="timeline-row">
                <span title="${this._escape(item.name)}">${this._escape(item.name)}</span>
                <div class="timeline-track">
                  ${segments.length ? segments.map((segment) => `
                    <i class="timeline-segment ${segment.state === "on" ? "on" : "off"}" style="left:${segment.left}%;width:${segment.width}%"></i>
                  `).join("") : '<em>Sin datos</em>'}
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="timeline-scale"><span>−${this._escape(config.historyHours)} h</span><span>−${this._escape(Math.round(config.historyHours / 2))} h</span><span>Ahora</span></div>
      </section>
    `;
  }

  _renderSystem() {
    const config = this._config();
    const batteryState = this._state(config.batteryLevel);
    const healthState = this._state(config.batteryHealth);
    const battery = Number(batteryState?.state);
    const batteryClass = Number.isFinite(battery)
      ? battery > 60 ? "good" : battery > 25 ? "warning" : "danger"
      : "muted";
    const health = healthState?.state;
    const healthUnavailable = !health || ["unknown", "unavailable"].includes(health);

    return `
      <section class="surface system-card">
        <div class="section-heading compact-heading">
          <div>
            <span class="eyebrow">Infraestructura</span>
            <h2>Sistema</h2>
          </div>
        </div>
        <div class="system-grid">
          <article class="system-tile ${batteryClass}">
            <span class="system-icon">${this._icon("battery")}</span>
            <div><small>Batería Pad</small><strong>${Number.isFinite(battery) ? `${this._escape(battery)}%` : "No disponible"}</strong></div>
          </article>
          <article class="system-tile ${healthUnavailable ? "muted" : "good"}">
            <span class="system-icon">${this._icon("health")}</span>
            <div><small>Salud batería</small><strong>${this._escape(healthUnavailable ? "No disponible" : health)}</strong></div>
          </article>
          <article class="system-tile thermometer-tile">
            <span class="system-icon">${this._icon("thermometer")}</span>
            <div><small>Termohigrómetros</small><strong>${this._escape(config.thermostatLabel)}</strong></div>
          </article>
        </div>
      </section>
    `;
  }

  _renderConfirmDialog() {
    if (!["on", "off"].includes(this._confirmAction)) return "";

    const isPowerOn = this._confirmAction === "on";
    const config = this._config();
    const pendingEntity = isPowerOn ? config.powerOnScript : config.powerOffScript;
    const pending = this._pendingAction === pendingEntity;
    const title = isPowerOn
      ? "¿Encender toda la iluminación?"
      : "¿Apagar todo el showroom?";
    const description = isPowerOn
      ? "Se encenderán las luminarias generales del showroom. Después podrás elegir una escena o ajustar cada zona de forma individual."
      : "Se apagarán las luminarias generales del showroom y cualquier escena activa.";
    const confirmLabel = isPowerOn ? "Sí, encender" : "Sí, apagar";

    return `
      <div class="dialog-backdrop" data-action="cancel-power-confirm">
        <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="power-dialog-title" data-dialog-card>
          <div class="dialog-icon ${isPowerOn ? "is-power-on" : "is-power-off"}">${this._icon(isPowerOn ? "bulb" : "power")}</div>
          <span class="eyebrow">Confirmar acción</span>
          <h2 id="power-dialog-title">${this._escape(title)}</h2>
          <p>${this._escape(description)}</p>
          <div class="dialog-actions">
            <button class="secondary-button" data-action="cancel-power-confirm" ${pending ? "disabled" : ""}>Cancelar</button>
            <button class="primary-button ${isPowerOn ? "confirm-on" : ""}" data-action="confirm-power" ${pending ? "disabled" : ""}>${pending ? "Ejecutando…" : this._escape(confirmLabel)}</button>
          </div>
        </section>
      </div>
    `;
  }

  render() {
    if (!this.shadowRoot || !this._hass) return;
    this.setAttribute("data-theme", this._theme);

    const config = this._config();
    const weather = this._state(config.weather);
    const weatherAttrs = weather?.attributes || {};
    const condition = weather?.state;
    const nextTheme = this._theme === "dark" ? "claro" : "oscuro";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #f26522;
          --primary-hover: #d95a1e;
          --primary-soft: rgba(242, 101, 34, 0.10);
          --primary-medium: rgba(242, 101, 34, 0.18);
          --primary-border: rgba(242, 101, 34, 0.38);
          --primary-glow: rgba(242, 101, 34, 0.18);
          --background: #061c2b;
          --background-secondary: #0b2b40;
          --background-deep: #051722;
          --surface: rgba(255, 255, 255, 0.045);
          --surface-strong: rgba(255, 255, 255, 0.065);
          --surface-hover: rgba(255, 255, 255, 0.075);
          --surface-active: rgba(242, 101, 34, 0.105);
          --surface-control: rgba(255, 255, 255, 0.055);
          --text-primary: rgba(255, 255, 255, 0.93);
          --text-secondary: rgba(255, 255, 255, 0.70);
          --text-tertiary: rgba(255, 255, 255, 0.48);
          --border-subtle: rgba(255, 255, 255, 0.065);
          --border-default: rgba(255, 255, 255, 0.095);
          --border-emphasis: rgba(255, 255, 255, 0.15);
          --icon-muted: rgba(255, 255, 255, 0.58);
          --track: rgba(255, 255, 255, 0.08);
          --timeline-off: rgba(255, 255, 255, 0.13);
          --grid-line: rgba(255, 255, 255, 0.07);
          --header: rgba(8, 34, 50, 0.82);
          --overlay: rgba(0, 10, 18, 0.76);
          --modal: #0a2739;
          --shadow: rgba(0, 0, 0, 0.15);
          --shadow-strong: rgba(0, 0, 0, 0.42);
          --success: #22c55e;
          --warning: #f59e0b;
          --error: #ef4444;
          --info: #38bdf8;
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 22px;
          --radius-pill: 999px;
          --motion: 180ms;
          display: block;
          min-height: 100%;
          color: var(--text-primary);
          background:
            radial-gradient(circle at 10% 4%, rgba(242, 101, 34, 0.14), transparent 34%),
            radial-gradient(circle at 88% 0%, rgba(252, 84, 60, 0.07), transparent 28%),
            linear-gradient(155deg, var(--background-deep), var(--background-secondary) 58%, var(--background));
          font-family: "Plus Jakarta Sans", Inter, Arial, sans-serif;
        }

        :host([data-theme="light"]) {
          --background: #edf3f6;
          --background-secondary: #dfe9ee;
          --background-deep: #f8fafb;
          --surface: rgba(255, 255, 255, 0.76);
          --surface-strong: rgba(255, 255, 255, 0.94);
          --surface-hover: rgba(255, 255, 255, 1);
          --surface-active: rgba(242, 101, 34, 0.10);
          --surface-control: rgba(9, 42, 62, 0.055);
          --text-primary: rgba(8, 35, 52, 0.94);
          --text-secondary: rgba(8, 35, 52, 0.68);
          --text-tertiary: rgba(8, 35, 52, 0.48);
          --border-subtle: rgba(8, 35, 52, 0.08);
          --border-default: rgba(8, 35, 52, 0.12);
          --border-emphasis: rgba(8, 35, 52, 0.18);
          --icon-muted: rgba(8, 35, 52, 0.56);
          --track: rgba(8, 35, 52, 0.08);
          --timeline-off: rgba(8, 35, 52, 0.14);
          --grid-line: rgba(8, 35, 52, 0.08);
          --header: rgba(255, 255, 255, 0.84);
          --overlay: rgba(12, 31, 43, 0.42);
          --modal: #ffffff;
          --shadow: rgba(20, 48, 65, 0.10);
          --shadow-strong: rgba(20, 48, 65, 0.24);
          background:
            radial-gradient(circle at 10% 4%, rgba(242, 101, 34, 0.13), transparent 34%),
            radial-gradient(circle at 88% 0%, rgba(11, 43, 64, 0.08), transparent 30%),
            linear-gradient(155deg, var(--background-deep), var(--background-secondary) 60%, var(--background));
        }

        * { box-sizing: border-box; }
        button, code { font: inherit; }
        button { color: inherit; }
        button:focus-visible { outline: 3px solid rgba(56, 189, 248, 0.65); outline-offset: 2px; }
        button:disabled { cursor: not-allowed; opacity: 0.48; }

        .app-shell { min-height: 100vh; }
        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px clamp(16px, 2.4vw, 30px);
          border-bottom: 1px solid var(--border-subtle);
          background: var(--header);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .topbar-start { min-width: 0; display: flex; align-items: center; gap: 10px; }
        .brand { min-width: 0; display: flex; align-items: center; gap: 13px; }
        .logo-frame {
          width: 114px;
          height: 42px;
          display: grid;
          place-items: center;
          padding: 5px 8px;
          border: 1px solid var(--primary-border);
          border-radius: 14px;
          background: var(--primary-soft);
        }
        .logo-frame img { display: block; width: 100%; height: 100%; object-fit: contain; }
        .brand-copy { min-width: 0; }
        .brand-copy strong { display: block; font-family: Outfit, Inter, Arial, sans-serif; font-size: 16px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .brand-copy small { display: block; margin-top: 2px; color: var(--text-secondary); font-size: 11px; font-weight: 650; }
        .topbar-meta { display: flex; align-items: center; justify-content: flex-end; margin-left: auto; }
        .menu-button,
        .theme-button {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-default);
          border-radius: 50%;
          background: var(--surface-control);
          cursor: pointer;
          transition: transform var(--motion), background var(--motion), border-color var(--motion);
        }
        .menu-button:hover,
        .theme-button:hover { transform: translateY(-2px); background: var(--surface-hover); border-color: var(--primary-border); }
        .menu-icon, .theme-icon { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .menu-icon { width: 22px; height: 22px; stroke-width: 2; }
        .theme-icon-sun, .theme-icon-moon { transform-origin: center; transition: opacity 220ms, transform 220ms; }
        .theme-icon-sun { opacity: 0; transform: rotate(-50deg) scale(0.65); }
        .theme-icon-moon { opacity: 1; transform: rotate(0) scale(1); }
        :host([data-theme="light"]) .theme-icon-sun { opacity: 1; transform: rotate(0) scale(1); }
        :host([data-theme="light"]) .theme-icon-moon { opacity: 0; transform: rotate(45deg) scale(0.65); }

        .dashboard { width: min(1460px, 100%); margin: 0 auto; padding: clamp(14px, 2vw, 24px); }
        .surface {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          background: var(--surface);
          box-shadow: 0 14px 36px var(--shadow), inset 0 1px 0 rgba(255,255,255,0.025);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          overflow: hidden;
        }
        .overview-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .hero-card {
          min-height: 194px;
          padding: 22px;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr);
          gap: 22px;
          align-items: center;
          background:
            radial-gradient(circle at 95% 18%, rgba(242,101,34,.15), transparent 35%),
            linear-gradient(135deg, var(--surface-strong), transparent 75%);
        }
        .hero-copy { min-width: 0; align-self: center; }
        .hero-heading-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
        }
        .hero-heading-row h1 { min-width: 0; }
        .hero-clock {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .hero-clock strong {
          font: 800 clamp(27px, 3vw, 36px)/1 Outfit, Inter, sans-serif;
          letter-spacing: -.04em;
        }
        .hero-clock span {
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .08em;
        }
        .eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 10px;
          border: 1px solid rgba(242,101,34,.20);
          border-radius: var(--radius-pill);
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        h1, h2, p { margin-top: 0; }
        .hero-card h1 { margin: 0 0 6px; font-family: Outfit, Inter, Arial, sans-serif; font-size: clamp(28px, 3vw, 42px); line-height: 1; letter-spacing: -.035em; }
        .hero-card h1 span { color: var(--primary); }
        .hero-card p { max-width: 640px; margin: 10px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
        .hero-weather { min-width: 0; padding-left: 18px; border-left: 1px solid var(--border-subtle); }
        .hero-weather-main { display: grid; grid-template-columns: 42px minmax(0,1fr) auto; gap: 10px; align-items: center; }
        .hero-weather-symbol { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: var(--primary-soft); color: var(--primary); font-size: 22px; }
        .hero-weather-copy strong, .hero-weather-copy small { display: block; }
        .hero-weather-copy strong { font: 800 16px/1.1 Outfit, Inter, sans-serif; }
        .hero-weather-copy small { margin-top: 4px; color: var(--text-secondary); font-size: 9px; line-height: 1.35; }
        .hero-temperature { font: 800 clamp(25px, 3vw, 34px)/1 Outfit, Inter, sans-serif; white-space: nowrap; }
        .hero-forecast { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; margin-top: 11px; }
        .hero-forecast .forecast-item { min-height: 44px; }

        .weather-card { min-height: 194px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; }
        .weather-main { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 13px; align-items: center; }
        .weather-symbol { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 50%; background: var(--primary-soft); color: var(--primary); font-size: 25px; }
        .weather-copy h2 { margin: 7px 0 4px; font: 800 20px/1.1 Outfit, Inter, sans-serif; }
        .weather-copy p { margin: 0; color: var(--text-secondary); font-size: 10px; line-height: 1.4; }
        .temperature { font: 800 clamp(24px, 3vw, 34px)/1 Outfit, Inter, sans-serif; white-space: nowrap; }
        .forecast-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-top: 12px; }
        .forecast-item { min-height: 50px; padding: 7px; display: grid; grid-template-columns: 1fr auto; gap: 3px 6px; align-items: center; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--surface-control); }
        .forecast-item span { color: var(--text-tertiary); font-size: 9px; font-weight: 800; text-transform: capitalize; }
        .forecast-item b { grid-row: 1 / span 2; grid-column: 2; color: var(--primary); font-size: 15px; }
        .forecast-item strong { font-size: 11px; }
        .forecast-empty { color: var(--text-tertiary); font-size: 10px; }

        .primary-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px; margin-top: 14px; align-items: start; }
        .media-card { grid-column: 1 / -1; padding: 16px; }
        .control-section.spots-section { grid-column: span 6; }
        .control-section.samples-section { grid-column: span 6; }
        .scenes-card { grid-column: 1 / -1; padding: 16px; }
        .general-card { grid-column: 1 / -1; padding: 16px; }
        .system-card { grid-column: span 4; padding: 16px; }
        .activity-card { grid-column: span 8; padding: 16px; }
        .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .compact-heading { margin-bottom: 11px; }
        .section-heading h2 { margin: 6px 0 0; font: 800 18px/1.05 Outfit, Inter, sans-serif; letter-spacing: -.02em; }
        .control-section { padding: 16px; }
        .device-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .device {
          min-width: 0;
          min-height: 58px;
          padding: 8px 9px;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) 30px;
          gap: 8px;
          align-items: center;
          border: 1px solid var(--border-default);
          border-radius: 14px;
          background: var(--surface-control);
          text-align: left;
          cursor: pointer;
          transition: transform var(--motion), background var(--motion), border-color var(--motion), box-shadow var(--motion);
        }
        .device:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--primary-border); background: var(--surface-hover); }
        .device.is-on { border-color: var(--primary-border); background: var(--surface-active); box-shadow: 0 0 20px rgba(242,101,34,.07); }
        .device.is-error { border-color: rgba(239,68,68,.45); }
        .device.is-pending { animation: pulse 1.1s ease-in-out infinite alternate; }
        .device-icon, .scene-icon, .system-icon, .media-art, .general-action > span {
          display: grid;
          place-items: center;
          color: var(--icon-muted);
        }
        .device-icon { width: 34px; height: 34px; border-radius: 11px; background: var(--track); }
        .device.is-on .device-icon { color: var(--primary); background: var(--primary-soft); }
        .icon { width: 19px; height: 19px; fill: currentColor; }
        .device-copy { min-width: 0; }
        .device-copy strong, .device-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .device-copy strong { font-size: 11px; font-weight: 800; }
        .device-copy small { margin-top: 3px; color: var(--text-secondary); font-size: 9px; font-weight: 650; }
        .device.is-on .device-copy small { color: var(--primary); }
        .device-switch { width: 29px; height: 17px; padding: 2px; display: flex; align-items: center; border: 1px solid var(--border-default); border-radius: 999px; background: var(--track); }
        .device-switch i { width: 11px; height: 11px; border-radius: 50%; background: var(--icon-muted); transition: transform var(--motion), background var(--motion); }
        .device.is-on .device-switch { border-color: var(--primary-border); background: var(--primary-medium); }
        .device.is-on .device-switch i { transform: translateX(12px); background: var(--primary); }

        .media-body { min-height: 78px; display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 12px; align-items: center; }
        .media-art { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(145deg, var(--primary-medium), var(--surface-control)); color: var(--primary); }
        .media-art .icon { width: 25px; height: 25px; }
        .media-copy { min-width: 0; }
        .media-copy strong, .media-copy span, .media-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .media-copy strong { font-size: 13px; }
        .media-copy span { margin-top: 4px; color: var(--text-secondary); font-size: 10px; }
        .media-copy small { margin-top: 7px; color: var(--text-tertiary); font-size: 9px; font-weight: 700; }
        .media-state { padding: 5px 8px; border: 1px solid var(--border-default); border-radius: var(--radius-pill); color: var(--text-secondary); font-size: 9px; font-weight: 800; }
        .media-state.is-playing { color: var(--success); border-color: rgba(34,197,94,.28); background: rgba(34,197,94,.08); }
        .media-controls { display: grid; grid-template-columns: repeat(5, 1fr); gap: 7px; margin-top: 10px; }
        .media-button { min-height: 40px; display: grid; place-items: center; border: 1px solid var(--border-default); border-radius: 12px; background: var(--surface-control); cursor: pointer; }
        .media-button:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--primary-border); }
        .media-button.primary { color: white; background: var(--primary); border-color: transparent; box-shadow: 0 6px 20px var(--primary-glow); }

        .scenes-heading { align-items: center; }
        .scene-heading-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
        .scene-summary { min-height: 28px; padding: 0 10px; display: inline-flex; align-items: center; border: 1px solid var(--border-default); border-radius: var(--radius-pill); background: var(--surface-control); color: var(--text-secondary); font-size: 9px; font-weight: 800; }
        .scene-summary.is-active { border-color: var(--primary-border); background: var(--primary-soft); color: var(--primary); }
        .clear-scene-button { min-height: 36px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid var(--border-default); border-radius: var(--radius-pill); background: var(--surface-control); color: var(--text-primary); font: inherit; cursor: pointer; transition: transform var(--motion), background var(--motion), border-color var(--motion), color var(--motion); }
        .clear-scene-button:hover:not(:disabled) { transform: translateY(-1px); border-color: rgba(239,68,68,.32); background: rgba(239,68,68,.07); color: var(--error); }
        .clear-scene-button:active:not(:disabled) { transform: scale(.98); }
        .clear-scene-button:disabled { cursor: not-allowed; opacity: .46; }
        .clear-scene-button span { width: 20px; height: 20px; display: grid; place-items: center; }
        .clear-scene-button .icon { width: 15px; height: 15px; }
        .clear-scene-button strong { font-size: 9px; font-weight: 800; white-space: nowrap; }
        .scene-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .scene { position: relative; min-height: 70px; padding: 9px 10px; display: grid; grid-template-columns: 38px minmax(0,1fr) auto; gap: 9px; align-items: center; overflow: hidden; border: 1px solid var(--border-default); border-radius: 14px; background: var(--surface-control); text-align: left; cursor: pointer; transition: transform var(--motion), background var(--motion), border-color var(--motion), box-shadow var(--motion); }
        .scene::before { content: ""; position: absolute; top: 0; right: 12px; left: 12px; height: 3px; border-radius: 0 0 4px 4px; background: transparent; }
        .scene:hover:not(:disabled) { border-color: var(--primary-border); background: var(--surface-hover); transform: translateY(-2px); }
        .scene.is-pending { border-color: var(--primary-border); background: var(--surface-active); animation: pulse 1.1s ease-in-out infinite alternate; }
        .scene.is-active { border-color: rgba(242,101,34,.56); background: var(--surface-active); box-shadow: 0 0 24px rgba(242,101,34,.10); }
        .scene.is-active::before { background: var(--primary); }
        .scene.is-unavailable { opacity: .65; }
        .scene-icon { width: 38px; height: 38px; border-radius: 12px; background: var(--track); color: var(--icon-muted); }
        .scene.is-active .scene-icon, .scene.is-pending .scene-icon { background: var(--primary-soft); color: var(--primary); }
        .scene-copy { min-width: 0; }
        .scene strong, .scene small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .scene strong { font-size: 11px; }
        .scene small { margin-top: 3px; color: var(--text-secondary); font-size: 9px; }
        .scene-state { min-height: 24px; padding: 0 8px; display: inline-flex; align-items: center; border: 1px solid var(--border-default); border-radius: var(--radius-pill); color: var(--text-tertiary); font-size: 8px; font-weight: 800; white-space: nowrap; }
        .scene.is-active .scene-state { border-color: var(--primary-border); background: var(--primary-soft); color: var(--primary); }

        .general-actions { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
        .general-action { min-height: 54px; padding: 8px 10px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--border-default); border-radius: 14px; background: var(--surface-control); cursor: pointer; }
        .general-action > span { width: 31px; height: 31px; border-radius: 10px; }
        .general-action strong { font-size: 10px; }
        .general-action.power-on > span { color: var(--success); background: rgba(34,197,94,.09); }
        .general-action.power-off > span { color: var(--error); background: rgba(239,68,68,.09); }
        .general-action:hover:not(:disabled) { transform: translateY(-2px); background: var(--surface-hover); }
        .isolated-control { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle); }
        .isolated-label { display: block; margin-bottom: 6px; color: var(--text-tertiary); font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .isolated-control .device { width: 100%; }

        .activity-summary { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; }
        .activity-value strong { font: 800 34px/1 Outfit, Inter, sans-serif; }
        .activity-value span { margin-left: 5px; color: var(--text-secondary); font-size: 10px; font-weight: 700; }
        .chart-metrics { display: flex; gap: 14px; }
        .chart-metrics span { color: var(--text-tertiary); font-size: 9px; font-weight: 700; }
        .chart-metrics b { display: block; margin-top: 3px; color: var(--text-primary); font-size: 10px; }
        .sparkline { position: relative; height: 84px; margin-top: 8px; border-bottom: 1px solid var(--border-subtle); }
        .sparkline svg { width: 100%; height: 100%; overflow: visible; }
        .spark-grid { fill: none; stroke: var(--grid-line); stroke-width: 1; vector-effect: non-scaling-stroke; }
        .spark-path { fill: none; stroke: var(--primary); stroke-width: 2.6; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
        .spark-area { fill: rgba(242,101,34,.08); stroke: none; }
        .chart-empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--text-tertiary); font-size: 10px; }
        .timeline-heading { display: flex; justify-content: space-between; margin-top: 11px; color: var(--text-secondary); font-size: 10px; }
        .timeline-list { display: grid; gap: 5px; margin-top: 8px; }
        .timeline-row { display: grid; grid-template-columns: 96px minmax(0,1fr); gap: 8px; align-items: center; }
        .timeline-row > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary); font-size: 8px; font-weight: 700; }
        .timeline-track { position: relative; height: 10px; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 999px; background: var(--track); }
        .timeline-segment { position: absolute; top: 0; bottom: 0; min-width: 1px; background: var(--timeline-off); }
        .timeline-segment.on { background: var(--primary); }
        .timeline-track em { position: absolute; inset: 0; display: grid; place-items: center; color: var(--text-tertiary); font-size: 7px; font-style: normal; }
        .timeline-scale { display: flex; justify-content: space-between; margin: 6px 0 0 104px; color: var(--text-tertiary); font-size: 8px; }
        .icon-button { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid var(--border-default); border-radius: 11px; background: var(--surface-control); cursor: pointer; }
        .icon-button:hover { border-color: var(--primary-border); color: var(--primary); }
        .inline-error { margin: 0 0 8px; padding: 8px; border: 1px solid rgba(239,68,68,.28); border-radius: 10px; background: rgba(239,68,68,.07); color: var(--error); font-size: 9px; }

        .system-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
        .system-tile { min-height: 60px; padding: 9px; display: grid; grid-template-columns: 34px minmax(0,1fr); gap: 8px; align-items: center; border: 1px solid var(--border-default); border-radius: 14px; background: var(--surface-control); }
        .system-icon { width: 34px; height: 34px; border-radius: 11px; background: var(--track); color: var(--icon-muted); }
        .system-tile.good .system-icon { color: var(--success); background: rgba(34,197,94,.08); }
        .system-tile.warning .system-icon { color: var(--warning); background: rgba(245,158,11,.09); }
        .system-tile.danger .system-icon { color: var(--error); background: rgba(239,68,68,.08); }
        .system-tile small, .system-tile strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .system-tile small { color: var(--text-secondary); font-size: 9px; font-weight: 700; }
        .system-tile strong { margin-top: 4px; font-size: 11px; }
        .thermometer-tile { grid-column: 1 / -1; }

        .dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: var(--overlay); backdrop-filter: blur(8px); }
        .dialog-card { width: min(430px, 100%); padding: 24px; border: 1px solid var(--primary-border); border-radius: 24px; background: var(--modal); box-shadow: 0 24px 70px var(--shadow-strong); text-align: center; }
        .dialog-icon { width: 54px; height: 54px; margin: 0 auto 12px; display: grid; place-items: center; border-radius: 50%; }
        .dialog-icon.is-power-off { background: rgba(239,68,68,.09); color: var(--error); }
        .dialog-icon.is-power-on { background: rgba(34,197,94,.10); color: var(--success); }
        .dialog-icon .icon { width: 24px; height: 24px; }
        .primary-button.confirm-on { background: var(--success); box-shadow: 0 8px 22px rgba(34,197,94,.18); }
        .dialog-card h2 { margin: 10px 0 8px; font: 800 23px/1.1 Outfit, Inter, sans-serif; }
        .dialog-card p { margin: 0; color: var(--text-secondary); font-size: 11px; line-height: 1.55; }
        .dialog-card code { color: var(--primary); font-size: 10px; overflow-wrap: anywhere; }
        .dialog-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; margin-top: 20px; }
        .dialog-actions button { min-height: 48px; border-radius: var(--radius-pill); font-weight: 800; cursor: pointer; }
        .secondary-button { border: 1px solid var(--border-default); background: var(--surface-control); }
        .primary-button { border: 0; background: var(--primary); color: white; box-shadow: 0 8px 24px var(--primary-glow); }
        .toast { position: fixed; right: 22px; bottom: 22px; z-index: 110; max-width: min(380px, calc(100vw - 32px)); padding: 12px 16px; border: 1px solid var(--border-default); border-radius: 14px; background: var(--modal); box-shadow: 0 18px 45px var(--shadow-strong); font-size: 11px; font-weight: 800; }
        .toast.success { border-color: rgba(34,197,94,.34); }
        .toast.error { border-color: rgba(239,68,68,.40); color: var(--error); }
        .is-unavailable { opacity: .7; }

        @keyframes pulse { from { box-shadow: 0 0 0 rgba(242,101,34,0); } to { box-shadow: 0 0 22px rgba(242,101,34,.18); } }

        @media (max-width: 1160px) {
          .overview-grid { grid-template-columns: 1fr; }
          .hero-card { grid-template-columns: minmax(0,1fr) auto; }
          .hero-weather { grid-column: 1 / -1; padding: 14px 0 0; border-left: 0; border-top: 1px solid var(--border-subtle); }
          .media-card, .scenes-card, .general-card { grid-column: 1 / -1; }
          .control-section.spots-section, .control-section.samples-section, .system-card { grid-column: span 6; }
          .activity-card { grid-column: 1 / -1; }
          .scene-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .scene-heading-actions { flex-wrap: wrap; }
          .topbar-meta .status-chip { display: none; }
        }

        @media (max-width: 820px) {
          .topbar { min-height: 58px; padding: 8px 12px; }
          .logo-frame { width: 94px; height: 38px; }
          .brand-copy small { display: none; }
          .dashboard { padding: 12px; }
          .overview-grid { grid-template-columns: 1fr; }
          .hero-card { min-height: 172px; }
          .primary-grid { grid-template-columns: 1fr; }
          .media-card, .control-section.spots-section, .control-section.samples-section,
          .scenes-card, .general-card, .system-card, .activity-card { grid-column: 1; }
        }

        @media (max-width: 560px) {
          .brand-copy { display: none; }
          .hero-card { grid-template-columns: 1fr; align-items: start; }
          .hero-heading-row { align-items: flex-start; }
          .hero-clock strong { font-size: 27px; }
          .hero-weather { grid-column: auto; padding: 14px 0 0; border-left: 0; border-top: 1px solid var(--border-subtle); }
          .weather-main { grid-template-columns: auto minmax(0,1fr); }
          .temperature { grid-column: 2; font-size: 28px; }
          .device-grid, .scene-grid, .system-grid { grid-template-columns: 1fr; }
          .scenes-heading { align-items: flex-start; }
          .scene-heading-actions { width: 100%; justify-content: space-between; }
          .clear-scene-button { min-height: 40px; }
          .thermometer-tile { grid-column: auto; }
          .timeline-row { grid-template-columns: 78px minmax(0,1fr); }
          .timeline-scale { margin-left: 86px; }
          .chart-metrics { gap: 8px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition-duration: 0.01ms !important; }
        }

        @media (max-width: 760px), (prefers-reduced-transparency: reduce) {
          .surface, .topbar { backdrop-filter: none; -webkit-backdrop-filter: none; }
        }
      </style>

      <div class="app-shell">
        <header class="topbar">
          <div class="topbar-start">
            <button
              class="menu-button"
              data-action="toggle-menu"
              aria-label="Abrir menú de navegación de Home Assistant"
              title="Abrir menú"
            >${MENU_ICON}</button>
            <div class="brand">
              <div class="logo-frame"><img src="${this._escape(config.logo)}" alt="Witmind"></div>
              <div class="brand-copy"><strong>${this._escape(config.title)}</strong><small>${this._escape(config.subtitle)}</small></div>
            </div>
          </div>
          <div class="topbar-meta">
            <button class="theme-button" data-action="toggle-theme" aria-label="Cambiar a tema ${nextTheme}" title="Cambiar a tema ${nextTheme}">${THEME_ICON}</button>
          </div>
        </header>

        <main class="dashboard">
          <section class="overview-grid">
            <article class="surface hero-card">
              <div class="hero-copy">
                <div class="hero-heading-row">
                  <h1>${this._escape(config.title)} <span>Witmind</span></h1>
                  <time class="hero-clock" data-current-time>
                    <strong data-clock-time>--:--</strong>
                    <span data-clock-period>--</span>
                  </time>
                </div>
                <p>Control concentrado de iluminación, escenas, música y estado operativo del showroom.</p>
              </div>
              <div class="hero-weather">
                <div class="hero-weather-main">
                  <div class="hero-weather-symbol">${this._escape(CONDITION_SYMBOLS[condition] || "·")}</div>
                  <div class="hero-weather-copy">
                    <strong>${this._escape(CONDITION_LABELS[condition] || condition || "Sin datos")}</strong>
                    <small>Humedad ${this._escape(weatherAttrs.humidity ?? "—")}% · Viento ${this._escape(weatherAttrs.wind_speed ?? "—")} ${this._escape(weatherAttrs.wind_speed_unit ?? "")}</small>
                  </div>
                  <span class="hero-temperature">${this._escape(weatherAttrs.temperature ?? "—")}${this._escape(weatherAttrs.temperature_unit ?? "°")}</span>
                </div>
                ${config.showForecast ? `
                  <div class="hero-forecast">
                    ${this._forecast.slice(0, 3).length ? this._forecast.slice(0, 3).map((item) => {
                      const date = new Date(item.datetime);
                      const label = new Intl.DateTimeFormat("es-BO", { weekday: "short" }).format(date);
                      return `<div class="forecast-item"><span>${this._escape(label)}</span><b>${this._escape(CONDITION_SYMBOLS[item.condition] || "·")}</b><strong>${this._escape(item.temperature ?? item.native_temperature ?? "—")}°</strong></div>`;
                    }).join("") : '<span class="forecast-empty">Pronóstico no disponible</span>'}
                  </div>
                ` : ""}
              </div>
            </article>
          </section>

          <section class="primary-grid">
            ${this._renderScenes()}
            <div class="control-section spots-section surface">
              <div class="section-heading compact-heading"><div><span class="eyebrow">Iluminación</span><h2>Spots</h2></div></div>
              <div class="device-grid">${config.spots.map((item) => this._renderDevice(item)).join("")}</div>
            </div>
            <div class="control-section samples-section surface">
              <div class="section-heading compact-heading"><div><span class="eyebrow">Muestras</span><h2>Luminarias</h2></div></div>
              <div class="device-grid">${config.samples.map((item) => this._renderDevice(item)).join("")}</div>
            </div>
            ${this._renderGeneralControl()}
            ${this._renderMedia()}
            ${this._renderSystem()}
            ${this._renderActivity()}
          </section>
        </main>
      </div>

      ${this._renderConfirmDialog()}
      ${this._toast ? `<div class="toast ${this._escape(this._toast.type)}" role="status">${this._escape(this._toast.message)}</div>` : ""}
    `;

    this._updateClock();
    this._syncThemeButtonAccessibility();
  }
}

if (!customElements.get("showroom-experimentos-panel")) {
  customElements.define("showroom-experimentos-panel", ShowroomExperimentosPanel);
}
