// Witmind Lobby Panel v1.3.2 — control directo limitado a los 4 circuitos actuales del Lobby.
const DEFAULT_LOBBY_CONFIG = Object.freeze({
  title: "Lobby",
  subtitle: "Control operativo",
  siteLabel: "WTX · MDTC",
  logo: "/local/logo-witmind.png?v=2.0.0",
  weather: "weather.forecast_casa",
  lightCountSensor: "sensor.lobby_luminarias_encendidas",
  historyHours: 4,
  chartHours: 24,
  showForecast: true,
  devices: [
    {
      entity: "switch.interruptor_inteligente_3_switch_1",
      name: "Central Colgante",
      subtitle: "Iluminación central",
      icon: "pendant",
    },
    {
      entity: "switch.interruptor_inteligente_3_switch_2",
      name: "Spots 5W Decorativos",
      subtitle: "Iluminación decorativa",
      icon: "spot",
    },
    {
      entity: "switch.interruptor_inteligente_3_switch_3",
      name: "Tira LED",
      subtitle: "Iluminación ambiental",
      icon: "strip",
    },
    {
      entity: "switch.interruptor_inteligente_3_switch_4",
      name: "Spots 10W",
      subtitle: "Iluminación principal",
      icon: "spot",
    },
  ],
  history: [
    {
      entity: "switch.interruptor_inteligente_3_switch_1",
      name: "Central Colgante",
      subtitle: "Iluminación central",
      icon: "pendant",
    },
    {
      entity: "switch.interruptor_inteligente_3_switch_2",
      name: "Spots 5W Decorativos",
      subtitle: "Iluminación decorativa",
      icon: "spot",
    },
    {
      entity: "switch.interruptor_inteligente_3_switch_3",
      name: "Tira LED",
      subtitle: "Iluminación ambiental",
      icon: "strip",
    },
    {
      entity: "switch.interruptor_inteligente_3_switch_4",
      name: "Spots 10W",
      subtitle: "Iluminación principal",
      icon: "spot",
    },
  ],
  sceneControlEntities: [
    "switch.interruptor_inteligente_3_switch_1",
    "switch.interruptor_inteligente_3_switch_2",
    "switch.interruptor_inteligente_3_switch_3",
    "switch.interruptor_inteligente_3_switch_4",
  ],
  scenes: [
    {
      id: "visita",
      name: "Visita",
      subtitle: "Todos los circuitos",
      icon: "presentation",
      onEntities: [
        "switch.interruptor_inteligente_3_switch_1",
        "switch.interruptor_inteligente_3_switch_2",
        "switch.interruptor_inteligente_3_switch_3",
        "switch.interruptor_inteligente_3_switch_4",
      ],
    },
    {
      id: "regular",
      name: "Regular",
      subtitle: "Solo Spots 10W",
      icon: "bulb",
      onEntities: [
        "switch.interruptor_inteligente_3_switch_4",
      ],
    },
  ],
  powerEntities: [
    "switch.interruptor_inteligente_3_switch_1",
    "switch.interruptor_inteligente_3_switch_2",
    "switch.interruptor_inteligente_3_switch_3",
    "switch.interruptor_inteligente_3_switch_4",
  ],
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
  bulb: '<path d="M9 21h6v-2H9v2Zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Zm2 11.5V15h-4v-1.5l-.5-.3A5 5 0 1 1 14.5 13l-.5.5Z"/>',
  pendant: '<path d="M11 2h2v6.1a6 6 0 0 1 5 5.9v1H6v-1a6 6 0 0 1 5-5.9V2Zm-3 15h8v2H8v-2Zm3 3h2v2h-2v-2Z"/>',
  spot: '<path d="M4 4h7l3.6 3.6-5 5L4 7V4Zm10.5 8.5 1.4 1.4-4.2 4.2-1.4-1.4 4.2-4.2Zm3-3 1.4 1.4-1.8 1.8-1.4-1.4 1.8-1.8ZM8 14l1.4 1.4-1.8 1.8-1.4-1.4L8 14Zm10 2 1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1L18 16Z"/>',
  strip: '<path d="M4 5h16v4H4V5Zm2 2h2V6H6v1Zm4 0h2V6h-2v1Zm4 0h2V6h-2v1Zm4 0h1V6h-1v1ZM4 11h16v8H4v-8Zm2 2v4h12v-4H6Z"/>',
  relay: '<path d="M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 2h3v3H8V8Zm5 0h3v3h-3V8Zm-5 5h3v3H8v-3Zm5 0h3v3h-3v-3Z"/>',
  presentation: '<path d="M3 3h18v13H3V3Zm2 2v9h14V5H5Zm6 11h2v2.2l3.6 2.1-1 1.7-3.6-2.1L8.4 22l-1-1.7 3.6-2.1V16Z"/>',
  power: '<path d="M11 2h2v10h-2V2Zm5.7 3.9 1.4-1.4A9 9 0 1 1 5.9 4.5l1.4 1.4A7 7 0 1 0 16.7 5.9Z"/>',
  chart: '<path d="M4 19h17v2H2V3h2v16Zm2-3 4-5 3 3 5-7 1.6 1.2-6.4 9-3-3L7.6 17.2 6 16Z"/>',
  refresh: '<path d="M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z"/>',
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

class LobbyPanel extends HTMLElement {
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
    this._historyNotice = "";
    this._liveStates = new Map();
    this._pendingSwitches = new Map();
    this._switchErrors = new Map();
    this._switchTimers = new Map();
    this._pendingAction = "";
    this._confirmOpen = false;
    this._toast = null;
    this._toastTimer = null;
    this._clockTimer = null;
    this._historyTimer = null;
    this._historyReloadTimer = null;
    this._historyRequestId = 0;
    this._unsubscribeStates = null;
    this._unsubscribeForecast = null;
    this._forecastEntity = "";
    this._themeStorageKey = "witmind-lobby-panel-theme";
    this._theme = this._loadTheme();

    // Home Assistant exige que el constructor no añada atributos al host.
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
    clearInterval(this._clockTimer);
    clearInterval(this._historyTimer);
    clearTimeout(this._historyReloadTimer);
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
    if (this._renderQueued || !this._hass || !this.shadowRoot) return;
    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
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
      this._toggleTheme();
      return;
    }

    if (action === "toggle-switch") {
      this._toggleSwitch(target.dataset.entity);
      return;
    }

    if (action === "run-scene") {
      this._runScene(target.dataset.sceneId, target.dataset.label);
      return;
    }

    if (action === "clear-scene") {
      this._clearScene();
      return;
    }

    if (action === "power-on") {
      this._runPowerAction("on");
      return;
    }

    if (action === "open-power-off") {
      this._confirmOpen = true;
      this._requestRender();
      return;
    }

    if (action === "cancel-power-off") {
      const insideDialog = event.target.closest("[data-dialog-card]");
      if (target.classList.contains("dialog-backdrop") && insideDialog) return;
      if (!this._pendingAction) {
        this._confirmOpen = false;
        this._requestRender();
      }
      return;
    }

    if (action === "confirm-power-off") {
      this._confirmPowerOff();
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
      console.warn("No se pudo guardar el tema del lobby:", error);
    }
  }

  _toggleTheme() {
    this._theme = this._theme === "dark" ? "light" : "dark";
    this.setAttribute("data-theme", this._theme);
    this._saveTheme();
    this._requestRender();
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

    const normalizeConditions = (items) => {
      if (!Array.isArray(items)) return [];
      return items
        .filter((item) => item?.entity && item?.state !== undefined)
        .map((item) => ({ entity: String(item.entity), state: String(item.state) }));
    };

    const devices = normalizeDevices(raw.devices || raw.switches, DEFAULT_LOBBY_CONFIG.devices);
    const defaultSceneControlEntities = devices.map((item) => item.entity);
    const configuredSceneControlEntities = normalizeEntityIds(
      raw.scene_control_entities || raw.sceneControlEntities,
    );
    const sceneControlEntities = configuredSceneControlEntities.length
      ? configuredSceneControlEntities
      : defaultSceneControlEntities;

    const normalizeScenes = (items) => {
      const source = Array.isArray(items) && items.length ? items : DEFAULT_LOBBY_CONFIG.scenes;
      return source
        .filter((item) => item && typeof item === "object")
        .map((item, index) => {
          const sceneId = String(item.id || item.key || item.entity || `scene-${index + 1}`);
          const defaultScene = DEFAULT_LOBBY_CONFIG.scenes.find(
            (candidate) => candidate.id === sceneId || candidate.entity === item.entity,
          );
          const hasExplicitOn = Array.isArray(item.on_entities) || Array.isArray(item.onEntities);
          const hasExplicitOff = Array.isArray(item.off_entities) || Array.isArray(item.offEntities);
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
            id: sceneId,
            entity: item.entity ? String(item.entity) : "",
            name: item.name || defaultScene?.name || `Escena ${index + 1}`,
            subtitle: item.subtitle || defaultScene?.subtitle || "Escena del lobby",
            icon: item.icon || defaultScene?.icon || "presentation",
            onEntities,
            offEntities,
            visibleWhen: normalizeConditions(item.visible_when || item.visibleWhen),
          };
        });
    };

    const historyHours = Number(raw.history_hours ?? raw.historyHours);
    const chartHours = Number(raw.chart_hours ?? raw.chartHours);

    return {
      title: raw.title || DEFAULT_LOBBY_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_LOBBY_CONFIG.subtitle,
      siteLabel: raw.site_label || raw.siteLabel || DEFAULT_LOBBY_CONFIG.siteLabel,
      logo: raw.logo || DEFAULT_LOBBY_CONFIG.logo,
      weather: raw.weather || DEFAULT_LOBBY_CONFIG.weather,
      lightCountSensor:
        raw.light_count_sensor || raw.lightCountSensor || DEFAULT_LOBBY_CONFIG.lightCountSensor,
      historyHours:
        Number.isFinite(historyHours) && historyHours > 0
          ? Math.min(24, historyHours)
          : DEFAULT_LOBBY_CONFIG.historyHours,
      chartHours:
        Number.isFinite(chartHours) && chartHours > 0
          ? Math.min(72, chartHours)
          : DEFAULT_LOBBY_CONFIG.chartHours,
      showForecast:
        raw.show_forecast ?? raw.showForecast ?? DEFAULT_LOBBY_CONFIG.showForecast,
      devices,
      history: normalizeDevices(raw.history, DEFAULT_LOBBY_CONFIG.history),
      sceneControlEntities,
      scenes: normalizeScenes(raw.scenes),
      powerEntities: (() => {
        // Solo pueden participar los cuatro dispositivos vigentes del Lobby.
        // Cualquier entidad heredada presente en configuration.yaml se ignora.
        const currentDeviceEntities = new Set(devices.map((item) => item.entity));
        const configured = normalizeEntityIds(raw.power_entities || raw.powerEntities)
          .filter((entityId) => currentDeviceEntities.has(entityId));
        return configured.length
          ? configured
          : normalizeEntityIds(DEFAULT_LOBBY_CONFIG.powerEntities)
              .filter((entityId) => currentDeviceEntities.has(entityId));
      })(),
    };
  }

  _trackedEntities() {
    const config = this._config();
    const conditionEntities = config.scenes.flatMap((scene) =>
      scene.visibleWhen.map((condition) => condition.entity),
    );
    const sceneEntities = config.scenes.flatMap((scene) => [
      scene.entity,
      ...scene.onEntities,
      ...scene.offEntities,
    ]);

    return new Set(
      [
        ...config.devices.map((item) => item.entity),
        ...config.history.map((item) => item.entity),
        ...sceneEntities,
        ...conditionEntities,
        ...config.sceneControlEntities,
        config.weather,
        config.lightCountSensor,
        ...config.powerEntities,
      ].filter(Boolean),
    );
  }

  async _start() {
    this._clockTimer = setInterval(() => this._updateClock(), 30_000);
    this._historyTimer = setInterval(() => this._loadHistory(), 120_000);

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
      console.error("No se pudieron sincronizar los estados del lobby:", error);
    }
  }

  async _subscribeStateChanges() {
    if (!this._hass?.connection || this._unsubscribeStates) return;

    try {
      this._unsubscribeStates = await this._hass.connection.subscribeEvents(
        (event) => {
          const entityId = event?.data?.entity_id;
          const newState = event?.data?.new_state;
          if (!entityId || !this._trackedEntities().has(entityId)) return;

          this._applyLiveState(entityId, newState);

          // state_changed actualiza la interfaz inmediatamente. Recorder puede
          // tardar varios segundos en exponer el mismo cambio en history/period.
          // Se añade el estado en memoria y después se reconcilia con la API.
          if (newState && this._historyEntityIds().has(entityId)) {
            this._appendHistoryState(entityId, newState);
            this._requestRender();
            this._scheduleHistoryReload();
          } else {
            this._requestRender();
          }
        },
        "state_changed",
      );
    } catch (error) {
      console.error("No se pudo suscribir a state_changed:", error);
    }
  }

  _historyEntityIds() {
    const config = this._config();
    return new Set(
      [
        config.lightCountSensor,
        ...config.devices.map((item) => item.entity),
        ...config.history.map((item) => item.entity),
      ].filter(Boolean),
    );
  }

  _appendHistoryState(entityId, stateObject) {
    if (!stateObject) return;

    let group = (this._history || []).find((items) =>
      Array.isArray(items) && items.some((item) => item?.entity_id === entityId),
    );

    if (!group) {
      group = [];
      this._history = [...(this._history || []), group];
    }

    const timestamp =
      stateObject.last_changed ||
      stateObject.last_updated ||
      new Date().toISOString();
    const last = group[group.length - 1];

    // Evita duplicar el mismo estado cuando llega por más de una vía.
    if (last?.state === stateObject.state) return;

    group.push({
      entity_id: entityId,
      state: stateObject.state,
      last_changed: timestamp,
      last_updated: stateObject.last_updated || timestamp,
    });
  }

  _scheduleHistoryReload() {
    clearTimeout(this._historyReloadTimer);
    this._historyReloadTimer = setTimeout(() => {
      this._historyReloadTimer = null;
      this._loadHistory();
    }, 7000);
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

    // Invalida cualquier consulta anterior, incluso cuando la configuración
    // actual no contenga entidades disponibles.
    const requestId = ++this._historyRequestId;
    const requestedEntityIds = [...this._historyEntityIds()];
    const availableEntityIds = requestedEntityIds.filter(
      (entityId) => Boolean(this._hass.states?.[entityId]),
    );
    const missingEntityIds = requestedEntityIds.filter(
      (entityId) => !this._hass.states?.[entityId],
    );

    if (!availableEntityIds.length) {
      this._history = [];
      this._historyNotice = "";
      this._historyError =
        `Home Assistant no reconoce las entidades del historial: ${missingEntityIds.join(", ")}. ` +
        "Comprueba los entity_id en Herramientas de desarrollador > Estados.";
      this._requestRender();
      return;
    }

    this._historyNotice = missingEntityIds.length
      ? `Sin historial para entidades no reconocidas: ${missingEntityIds.join(", ")}.`
      : "";

    const hours = Math.max(config.historyHours, config.chartHours);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
    const entityIds = availableEntityIds.join(",");

    const path =
      `history/period/${encodeURIComponent(startDate.toISOString())}` +
      `?filter_entity_id=${encodeURIComponent(entityIds)}` +
      `&end_time=${encodeURIComponent(endDate.toISOString())}` +
      "&minimal_response&no_attributes";

    // Impide que una respuesta antigua sobrescriba una consulta más reciente.
    try {
      const response = await this._hass.callApi("GET", path);
      if (requestId !== this._historyRequestId) return;

      if (!Array.isArray(response)) {
        throw new Error("La API de historial devolvió un formato inesperado.");
      }

      // Con minimal_response, Home Assistant puede omitir entity_id en estados
      // intermedios. Se normaliza cada grupo antes de generar mapas y gráficas.
      this._history = response
        .filter((group) => Array.isArray(group) && group.length)
        .map((group) => {
          const entityId = group.find((item) => item?.entity_id)?.entity_id;
          if (!entityId) return [];

          return group
            .filter((item) => item?.state != null)
            .map((item) => ({
              ...item,
              entity_id: item.entity_id || entityId,
              last_changed: item.last_changed || item.last_updated,
            }));
        })
        .filter((group) => group.length);

      this._historyError = "";
    } catch (error) {
      if (requestId !== this._historyRequestId) return;
      this._history = [];
      this._historyError =
        "No se pudo cargar el historial desde Home Assistant. Revisa Recorder, History y la consola del navegador.";
      console.error("No se pudo cargar el historial del lobby:", {
        error,
        path,
        entities: availableEntityIds,
      });
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

    const desired = this._visibleSwitchState(entityId) === "on" ? "off" : "on";
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

  async _waitForPowerStates(entityIds, desired, timeoutMs = 7000) {
    const deadline = Date.now() + timeoutMs;
    let mismatches = entityIds;

    while (Date.now() < deadline) {
      await this._fetchCurrentStates();
      mismatches = entityIds.filter((entityId) => this._state(entityId)?.state !== desired);
      if (!mismatches.length) return { ok: true, mismatches: [] };
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    return { ok: false, mismatches };
  }

  async _runPowerAction(desired) {
    const config = this._config();
    const actionKey = `lobby-power-${desired}`;
    if (this._pendingAction) return;

    const availableEntities = config.powerEntities.filter(
      (entityId) => this._state(entityId) && !this._isUnavailable(entityId),
    );
    const unavailableEntities = config.powerEntities.filter(
      (entityId) => !this._state(entityId) || this._isUnavailable(entityId),
    );

    if (!availableEntities.length) {
      this._notify("No hay circuitos del lobby disponibles para controlar.", "error");
      return;
    }

    this._pendingAction = actionKey;
    const startedAt = Date.now();
    for (const entityId of availableEntities) {
      this._pendingSwitches.set(entityId, { desired, startedAt });
      this._switchErrors.delete(entityId);
    }
    this._requestRender();

    try {
      // Control directo: no se ejecutan escenas generales heredadas.
      // Así, encender o apagar el Lobby afecta exclusivamente sus 4 circuitos actuales.
      await this._setEntitiesState(availableEntities, desired);
      const verification = await this._waitForPowerStates(availableEntities, desired);
      if (!verification.ok) {
        throw new Error(`Sin confirmación: ${verification.mismatches.join(", ")}`);
      }

      const verb = desired === "on" ? "encendido" : "apagado";
      const unavailableSuffix = unavailableEntities.length
        ? ` ${unavailableEntities.length} circuito(s) no estaban disponibles.`
        : "";
      this._notify(`Lobby ${verb} correctamente.${unavailableSuffix}`, "success");
      if (desired === "off") this._confirmOpen = false;
    } catch (error) {
      for (const entityId of availableEntities) {
        if (this._state(entityId)?.state !== desired) {
          this._switchErrors.set(entityId, "Sin confirmación general");
        }
      }
      this._notify("El control general no logró confirmar todos los circuitos.", "error");
      console.error("Error en control general del lobby:", error);
    } finally {
      for (const entityId of availableEntities) {
        this._pendingSwitches.delete(entityId);
      }
      this._pendingAction = "";
      await this._fetchCurrentStates();
      this._requestRender();
    }
  }

  _sceneStatus(scene) {
    const expectations = this._sceneExpectations(scene);
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

  async _runScene(sceneId, label) {
    if (!sceneId || this._pendingAction) return;

    const scene = this._config().scenes.find((item) => item.id === sceneId);
    if (!scene) {
      this._notify("La escena no está configurada.", "error");
      return;
    }

    const expectations = this._sceneExpectations(scene);
    const unavailableEntities = expectations
      .map(({ entityId }) => entityId)
      .filter((entityId) => this._isUnavailable(entityId));

    if (!expectations.length || unavailableEntities.length) {
      this._notify("La escena no puede aplicarse porque hay circuitos sin datos.", "error");
      return;
    }

    const actionKey = `lobby-scene:${scene.id}`;
    this._pendingAction = actionKey;
    this._markExpectedStates(expectations);
    this._requestRender();

    let sceneServiceError = null;

    try {
      // La entidad scene.* es opcional. El perfil de interruptores es la fuente
      // determinista para Visita y Regular y evita inventar entidades nuevas.
      if (scene.entity) {
        try {
          const domain = scene.entity.split(".")[0];
          await this._hass.callService(domain, "turn_on", { entity_id: scene.entity });
        } catch (error) {
          sceneServiceError = error;
          console.warn(`La escena ${scene.entity} no respondió; se aplicará el perfil directo.`, error);
        }
      }

      await this._setEntitiesState(scene.offEntities, "off");
      await this._setEntitiesState(scene.onEntities, "on");

      const verification = await this._waitForExpectedStates(expectations);
      if (!verification.ok) {
        const failed = verification.mismatches.map((item) => item.entityId).join(", ");
        throw new Error(`No se confirmaron los estados de: ${failed}`);
      }

      const message = sceneServiceError
        ? `${label || scene.name} aplicado mediante control directo.`
        : `${label || scene.name} activo.`;
      this._notify(message, "success");
    } catch (error) {
      for (const { entityId, desired } of expectations) {
        if (this._state(entityId)?.state !== desired) {
          this._switchErrors.set(entityId, "No confirmó el modo");
        }
      }
      this._notify("No se pudo aplicar completamente la escena seleccionada.", "error");
      console.error("Error aplicando escena del lobby:", error);
    } finally {
      this._clearExpectedStates(expectations);
      this._pendingAction = "";
      await this._fetchCurrentStates();
      this._requestRender();
    }
  }

  async _clearScene() {
    if (this._pendingAction) return;

    const entityIds = this._config().sceneControlEntities;
    const expectations = entityIds.map((entityId) => ({ entityId, desired: "off" }));
    const unavailableEntities = entityIds.filter((entityId) => this._isUnavailable(entityId));

    if (!expectations.length || unavailableEntities.length) {
      this._notify("No se puede apagar la escena porque hay circuitos sin datos.", "error");
      return;
    }

    this._pendingAction = "lobby-clear-scene";
    this._markExpectedStates(expectations);
    this._requestRender();

    try {
      await this._setEntitiesState(entityIds, "off");
      const verification = await this._waitForExpectedStates(expectations);
      if (!verification.ok) {
        const failed = verification.mismatches.map((item) => item.entityId).join(", ");
        throw new Error(`No se confirmaron los estados de: ${failed}`);
      }
      this._notify("Escena apagada. Los cuatro circuitos principales quedaron apagados.", "success");
    } catch (error) {
      for (const { entityId } of expectations) {
        if (this._state(entityId)?.state !== "off") {
          this._switchErrors.set(entityId, "Sin confirmación");
        }
      }
      this._notify("No se pudo apagar completamente la escena.", "error");
      console.error("Error apagando la escena del lobby:", error);
    } finally {
      this._clearExpectedStates(expectations);
      this._pendingAction = "";
      await this._fetchCurrentStates();
      this._requestRender();
    }
  }

  async _confirmPowerOff() {
    await this._runPowerAction("off");
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

  _sceneVisible(scene) {
    if (!scene.visibleWhen.length) return true;
    return scene.visibleWhen.every((condition) =>
      this._state(condition.entity)?.state === condition.state,
    );
  }

  _historyMap() {
    const result = new Map();
    for (const group of this._history || []) {
      if (!Array.isArray(group) || !group.length) continue;
      const entityId = group.find((item) => item?.entity_id)?.entity_id;
      if (!entityId) continue;

      // Mantiene el mapa utilizable incluso si una fuente externa introduce
      // estados compactos sin entity_id.
      const normalizedGroup = group.map((item) => ({
        ...item,
        entity_id: item?.entity_id || entityId,
        last_changed: item?.last_changed || item?.last_updated,
      }));
      result.set(entityId, normalizedGroup);
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
      .filter(
        (item) =>
          Number.isFinite(item.value) &&
          Number.isFinite(item.time) &&
          item.time >= startTime,
      )
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
    const status =
      error ||
      (pending
        ? state === "on"
          ? "Encendiendo…"
          : "Apagando…"
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

  _renderWeather() {
    const config = this._config();
    const weather = this._state(config.weather);

    if (!weather) {
      return `
        <section class="surface weather-card is-unavailable">
          <span class="eyebrow">Clima</span>
          <h2>Entidad no encontrada</h2>
          <code>${this._escape(config.weather)}</code>
        </section>
      `;
    }

    const attrs = weather.attributes || {};
    const condition = weather.state;
    const forecasts = config.showForecast ? this._forecast.slice(0, 4) : [];

    return `
      <section class="surface weather-card">
        <div class="weather-main">
          <span class="weather-symbol">${this._escape(CONDITION_SYMBOLS[condition] || "·")}</span>
          <div>
            <span class="eyebrow">Clima · Casa</span>
            <h2>${this._escape(CONDITION_LABELS[condition] || condition)}</h2>
            <p>Humedad ${this._escape(attrs.humidity ?? "—")}% · Viento ${this._escape(attrs.wind_speed ?? "—")} ${this._escape(attrs.wind_speed_unit ?? "")}</p>
          </div>
          <strong class="temperature">${this._escape(attrs.temperature ?? "—")}${this._escape(attrs.temperature_unit ?? "°")}</strong>
        </div>
        ${forecasts.length ? `
          <div class="forecast-strip">
            ${forecasts.map((item) => {
              const date = new Date(item.datetime);
              return `
                <div class="forecast-day">
                  <span>${this._escape(new Intl.DateTimeFormat("es-BO", { weekday: "short" }).format(date))}</span>
                  <b>${this._escape(CONDITION_SYMBOLS[item.condition] || "·")}</b>
                  <strong>${this._escape(item.temperature ?? "—")}°</strong>
                  <small>${this._escape(item.templow ?? "—")}°</small>
                </div>
              `;
            }).join("")}
          </div>
        ` : ""}
      </section>
    `;
  }

  _renderScenes() {
    const config = this._config();
    const visibleScenes = config.scenes.filter((scene) => this._sceneVisible(scene));
    const activeScene = visibleScenes.find((scene) => this._sceneStatus(scene).active);
    const clearPending = this._pendingAction === "lobby-clear-scene";
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
        ${visibleScenes.length ? `
          <div class="scene-grid">
            ${visibleScenes.map((scene) => {
              const actionKey = `lobby-scene:${scene.id}`;
              const pending = this._pendingAction === actionKey;
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
                  data-scene-id="${this._escape(scene.id)}"
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
        ` : `
          <div class="empty-state">
            <strong>Escenas no disponibles</strong>
            <small>Ninguna escena cumple las condiciones configuradas.</small>
          </div>
        `}
      </section>
    `;
  }

  _renderGeneralControl() {
    const onPending = this._pendingAction === "lobby-power-on";
    const offPending = this._pendingAction === "lobby-power-off";

    return `
      <section class="surface general-card">
        <div class="section-heading compact-heading">
          <div>
            <span class="eyebrow">Acciones rápidas</span>
            <h2>Control general</h2>
          </div>
        </div>
        <div class="general-actions">
          <button class="general-action power-on" data-action="power-on" ${this._pendingAction && !onPending ? "disabled" : ""}>
            <span>${this._icon("bulb")}</span>
            <strong>${onPending ? "Encendiendo…" : "Encender todo"}</strong>
          </button>
          <button class="general-action power-off" data-action="open-power-off" ${this._pendingAction ? "disabled" : ""}>
            <span>${this._icon("power")}</span>
            <strong>${offPending ? "Apagando…" : "Apagar todo"}</strong>
          </button>
        </div>
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

    return `
      <section class="surface activity-card">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Registro operativo</span>
            <h2>Actividad del lobby</h2>
          </div>
          <button class="icon-button" data-action="refresh-history" aria-label="Actualizar historial" title="Actualizar historial">${this._icon("refresh")}</button>
        </div>
        ${this._historyError ? `<p class="inline-error">${this._escape(this._historyError)}</p>` : ""}
        ${this._historyNotice ? `<p class="inline-warning">${this._escape(this._historyNotice)}</p>` : ""}
        <div class="activity-summary">
          <div class="activity-value">
            <strong>${Number.isFinite(currentValue) ? this._escape(currentValue) : "—"}</strong>
            <span>${this._escape(unit)} encendidas</span>
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
          <strong>Registro histórico</strong>
          <span>${this._escape(config.historyHours)} h</span>
        </div>
        <div class="timeline-list">
          ${config.history.map((item) => {
            const segments = this._historySegments(historyMap.get(item.entity) || [], startTime, endTime);
            return `
              <div class="timeline-row">
                <span title="${this._escape(item.name)}">${this._escape(item.name)}</span>
                <div class="timeline-track">
                  ${segments.length ? segments.map((segment) => `
                    <i class="timeline-segment ${segment.state === "on" ? "on" : "off"}" style="left:${segment.left}%;width:${segment.width}%"></i>
                  `).join("") : "<em>Sin datos</em>"}
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="timeline-scale"><span>−${this._escape(config.historyHours)} h</span><span>−${this._escape(Math.round(config.historyHours / 2))} h</span><span>Ahora</span></div>
      </section>
    `;
  }

  _renderConfirmDialog() {
    if (!this._confirmOpen) return "";
    const pending = this._pendingAction === "lobby-power-off";

    return `
      <div class="dialog-backdrop" data-action="cancel-power-off">
        <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="power-dialog-title" data-dialog-card>
          <div class="dialog-icon is-power-off">${this._icon("power")}</div>
          <span class="eyebrow">Acción sensible</span>
          <h2 id="power-dialog-title">¿Apagar todo el lobby?</h2>
          <p>Se apagarán las luminarias principales y los circuitos auxiliares configurados para el lobby.</p>
          <div class="dialog-actions">
            <button class="secondary-button" data-action="cancel-power-off" ${pending ? "disabled" : ""}>Cancelar</button>
            <button class="primary-button" data-action="confirm-power-off" ${pending ? "disabled" : ""}>${pending ? "Ejecutando…" : "Sí, apagar"}</button>
          </div>
        </section>
      </div>
    `;
  }

  render() {
    if (!this.shadowRoot || !this._hass) return;

    // El atributo se aplica después de que Home Assistant creó el elemento.
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
          flex: 0 0 auto;
          width: 120px;
          height: 42px;
          padding: 4px 6px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 14px;
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: background var(--motion), border-color var(--motion);
        }
        .brand-logo, .logo-frame img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          filter: brightness(0) invert(1);
          mix-blend-mode: screen;
          transition: filter var(--motion);
        }
        :host([data-theme="light"]) .logo-frame {
          background: rgba(8, 35, 52, 0.05);
          border-color: rgba(8, 35, 52, 0.12);
        }
        :host([data-theme="light"]) .brand-logo,
        :host([data-theme="light"]) .logo-frame img {
          filter: none;
          mix-blend-mode: multiply;
        }
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
        .theme-button:hover { background: var(--surface-hover); border-color: var(--primary-border); }
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
          min-height: 112px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
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
          min-height: 22px;
          margin: 0 0 4px;
          padding: 0 10px;
          border: 1px solid rgba(242,101,34,.20);
          border-radius: var(--radius-pill);
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        h1, h2, p { margin-top: 0; }
        .hero-card h1 { margin: 0; font-family: Outfit, Inter, Arial, sans-serif; font-size: clamp(24px, 3vw, 36px); font-weight: 800; line-height: 1.08; letter-spacing: -.035em; }
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
        .controls-card { grid-column: 1 / -1; padding: 16px; }
        .media-card { grid-column: 1 / -1; padding: 16px; }
        .control-section.spots-section { grid-column: span 6; }
        .control-section.samples-section { grid-column: span 6; }
        .scenes-card { grid-column: 1 / -1; padding: 16px; }
        .general-card { grid-column: 1 / -1; padding: 16px; }
        .system-card { grid-column: span 4; padding: 16px; }
        .activity-card { grid-column: 1 / -1; padding: 16px; }
        .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .compact-heading { margin-bottom: 11px; }
        .section-heading h2 { margin: 2px 0 0; font-family: Outfit, Inter, sans-serif; font-size: clamp(18px, 2.2vw, 22px); font-weight: 800; line-height: 1.15; letter-spacing: -.02em; }
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
        .device:hover:not(:disabled) { border-color: var(--primary-border); background: var(--surface-hover); }
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
        .clear-scene-button:hover:not(:disabled) { border-color: rgba(239,68,68,.32); background: rgba(239,68,68,.07); color: var(--error); }
        .clear-scene-button:active:not(:disabled) { transform: scale(.98); }
        .clear-scene-button:disabled { cursor: not-allowed; opacity: .46; }
        .clear-scene-button span { width: 20px; height: 20px; display: grid; place-items: center; }
        .clear-scene-button .icon { width: 15px; height: 15px; }
        .clear-scene-button strong { font-size: 9px; font-weight: 800; white-space: nowrap; }
        .scene-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .scene { position: relative; min-height: 70px; padding: 9px 10px; display: grid; grid-template-columns: 38px minmax(0,1fr) auto; gap: 9px; align-items: center; overflow: hidden; border: 1px solid var(--border-default); border-radius: 14px; background: var(--surface-control); text-align: left; cursor: pointer; transition: transform var(--motion), background var(--motion), border-color var(--motion), box-shadow var(--motion); }
        .scene:hover:not(:disabled) { border-color: var(--primary-border); background: var(--surface-hover); }
        .scene.is-pending { border-color: var(--primary-border); background: var(--surface-active); animation: pulse 1.1s ease-in-out infinite alternate; }
        .scene.is-active { border-color: rgba(242,101,34,.56); background: var(--surface-active); box-shadow: 0 0 24px rgba(242,101,34,.10); }
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
        .general-action:hover:not(:disabled) { background: var(--surface-hover); }
        .isolated-control { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle); }
        .isolated-label { display: block; margin-bottom: 6px; color: var(--text-tertiary); font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .isolated-control .device { width: 100%; }


        .empty-state { min-height: 70px; padding: 12px; display: grid; align-content: center; border: 1px dashed var(--border-default); border-radius: 14px; background: var(--surface-control); }
        .empty-state strong, .empty-state small { display: block; }
        .empty-state strong { font-size: 11px; }
        .empty-state small { margin-top: 5px; color: var(--text-secondary); font-size: 9px; line-height: 1.4; }

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
        .inline-error, .inline-warning { margin: 0 0 8px; padding: 8px; border-radius: 10px; font-size: 9px; line-height: 1.4; }
        .inline-error { border: 1px solid rgba(239,68,68,.28); background: rgba(239,68,68,.07); color: var(--error); }
        .inline-warning { border: 1px solid rgba(245,158,11,.28); background: rgba(245,158,11,.07); color: var(--warning); }

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

        @container lobby-panel (max-width: 768px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr !important; gap: 12px; }
          .hero-copy { border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 2px; }
          .hero-card h1 { font-size: clamp(22px, 5.5vw, 30px); }
          .hero-status { justify-content: space-between; width: 100%; align-items: center; flex-direction: row; gap: 12px; }
          .hero-clock strong { font-size: 26px; }
          .hero-weather { border-left: 0; padding-left: 0; border-top: 0 !important; }
          .device-grid, .scene-grid, .system-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr !important; gap: 12px; }
          .hero-copy { border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 2px; }
          .hero-card h1 { font-size: clamp(22px, 5.5vw, 30px); }
          .hero-status { justify-content: space-between; width: 100%; align-items: center; flex-direction: row; gap: 12px; }
          .hero-clock strong { font-size: 26px; }
          .hero-weather { border-left: 0; padding-left: 0; border-top: 0 !important; }
          .device-grid, .scene-grid, .system-grid { grid-template-columns: 1fr !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition-duration: 0.01ms !important; }
        }

        @media (max-width: 760px), (prefers-reduced-transparency: reduce) {
          .surface, .topbar { backdrop-filter: none; -webkit-backdrop-filter: none; }
        }


        /* Cabecera minimalista basada en oficinas-panel.js. */
        .overview-grid {
          margin-top: 12px;
          gap: 0;
        }
        .hero-card {
          min-height: 112px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 22px;
          background:
            radial-gradient(circle at 92% 16%, rgba(242, 101, 34, 0.10), transparent 34%),
            var(--surface);
        }
        .hero-copy {
          min-width: 0;
          align-self: auto;
        }
        .hero-card h1 {
          margin: 0;
          font-family: Outfit, Inter, Arial, sans-serif;
          font-size: clamp(28px, 3vw, 38px);
          font-weight: 800;
          line-height: 1.04;
          letter-spacing: -0.035em;
        }
        .hero-card h1 span { color: var(--primary); }
        .hero-status {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 18px;
        }
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
          font-family: Outfit, Inter, Arial, sans-serif;
          font-size: clamp(27px, 3vw, 34px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.04em;
        }
        .hero-clock span {
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }
        .hero-weather {
          min-width: 128px;
          padding-left: 18px;
          display: grid;
          grid-template-columns: 34px auto;
          align-items: center;
          gap: 9px;
          border-left: 1px solid var(--border-default, var(--border-subtle));
        }
        .hero-weather-symbol {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 19px;
        }
        .hero-weather-copy { min-width: 0; }
        .hero-weather-copy strong,
        .hero-weather-copy small {
          display: block;
          white-space: nowrap;
        }
        .hero-weather-copy strong {
          margin: 0;
          font-family: Outfit, Inter, Arial, sans-serif;
          font-size: 17px;
          font-weight: 800;
          line-height: 1.05;
        }
        .hero-weather-copy small {
          margin: 0 0 3px;
          color: var(--text-secondary);
          font-size: 9px;
          font-weight: 700;
          line-height: 1.1;
        }

        /* El bloque climático replica la cabecera de Oficinas: sin marco superior. */
        .hero-weather {
          border-top: 0 !important;
        }

        /* Ningún botón conserva la barra decorativa naranja superior. */
        button::before,
        .scene::before,
        .scene.is-active::before {
          display: none !important;
          content: none !important;
        }

        @media (max-width: 680px) {
          .hero-card {
            min-height: 0;
            padding: 16px;
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .hero-status { justify-content: flex-start; }
        }
        @media (max-width: 520px) {
          .hero-status {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
          .hero-weather {
            padding: 0;
            border-left: 0;
            border-top: 0 !important;
          }
        }
      

        /* Cabecera móvil unificada con el patrón visual de Oficinas.
           A 430 px mantiene título, divisor y estado en una fila equilibrada. */
        @media (max-width: 520px) {
          .dashboard { padding: 12px 10px; }
          .hero-card {
            min-height: 0;
            padding: 16px 18px;
            grid-template-columns: 1fr !important;
            align-items: center;
            gap: 12px;
          }
          .hero-copy {
            min-width: 0;
            padding-bottom: 10px;
            margin-bottom: 2px;
            border-bottom: 1px solid var(--border-subtle);
          }
          .hero-card h1 {
            margin: 0;
            font-size: clamp(22px, 5.5vw, 30px);
            line-height: 1.04;
            letter-spacing: -0.035em;
          }
          .hero-card h1 span { white-space: nowrap; }
          .hero-status {
            width: 100%;
            display: flex;
            align-items: center !important;
            justify-content: space-between !important;
            flex-direction: row !important;
            gap: 12px;
            padding-top: 0;
            border-top: 0;
          }
          .hero-clock {
            flex: 0 0 auto;
            margin: 0;
          }
          .hero-clock strong { font-size: 26px; }
          .hero-weather {
            min-width: 0;
            padding: 0;
            border-left: 0;
            border-top: 0 !important;
          }
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
                <h1>${this._escape(config.title)} <span>Witmind</span></h1>
              </div>
              <div class="hero-status">
                <time class="hero-clock" data-current-time>
                  <strong data-clock-time>--:--</strong>
                  <span data-clock-period>--</span>
                </time>
                <div class="hero-weather" aria-label="Clima actual: ${this._escape(CONDITION_LABELS[condition] || condition || "Sin datos")}, ${this._escape(weatherAttrs.temperature ?? "—")}${this._escape(weatherAttrs.temperature_unit ?? "°")}">
                  <span class="hero-weather-symbol" aria-hidden="true">${this._escape(CONDITION_SYMBOLS[condition] || "·")}</span>
                  <span class="hero-weather-copy">
                    <small>${this._escape(CONDITION_LABELS[condition] || condition || "Sin datos")}</small>
                    <strong>${this._escape(weatherAttrs.temperature ?? "—")}${this._escape(weatherAttrs.temperature_unit ?? "°")}</strong>
                  </span>
                </div>
              </div>
            </article>
          </section>

          <section class="primary-grid">
            ${this._renderScenes()}
            <section class="surface controls-card">
              <div class="section-heading compact-heading">
                <div><span class="eyebrow">Iluminación</span><h2>Control principal</h2></div>
              </div>
              <div class="device-grid">${config.devices.map((item) => this._renderDevice(item)).join("")}</div>
            </section>
            ${this._renderGeneralControl()}
            ${this._renderActivity()}
          </section>
        </main>
      </div>

      ${this._renderConfirmDialog()}
      ${this._toast ? `<div class="toast ${this._escape(this._toast.type)}" role="status">${this._escape(this._toast.message)}</div>` : ""}
    `;

    this._updateClock();
  }
}

if (!customElements.get("lobby-panel")) {
  customElements.define("lobby-panel", LobbyPanel);
}
