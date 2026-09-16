// Witmind Grabación Panel v4.2.5 — versionamiento v=2.0.0 en URL de logo para invalidar cache.
const DEFAULT_PANEL_CONFIG = Object.freeze({
  title: "Sala de grabación",
  subtitle: "Control operativo",
  siteLabel: "WTX · MDTC",
  logo: "/local/logo-witmind.png?v=2.0.0",
  weather: "weather.forecast_casa",
  projectedCost: "input_number.gasto_proyectado_8hrs",
  totalOffScene: "scene.apagado_total",
  totalOffEntities: [
    "switch.4gang_switch_sala_grabacion_interruptor_1",
    "switch.4gang_switch_sala_grabacion_interruptor_2",
    "switch.4gang_switch_sala_grabacion_interruptor_3",
    "switch.4gang_switch_sala_grabacion_interruptor_4",
  ],
  historyHours: 24,
  showForecast: true,
  showHistory: true,
  showProjectedCost: false,
  switches: [
    {
      entity: "switch.4gang_switch_sala_grabacion_interruptor_1",
      name: "Tiras LED",
      subtitle: "Iluminación ambiental",
    },
    {
      entity: "switch.4gang_switch_sala_grabacion_interruptor_2",
      name: "Paneles",
      subtitle: "Luz principal",
    },
    {
      entity: "switch.4gang_switch_sala_grabacion_interruptor_3",
      name: "Tracklight",
      subtitle: "Iluminación técnica",
    },
    {
      entity: "switch.4gang_switch_sala_grabacion_interruptor_4",
      name: "Spots",
      subtitle: "Luz decorativa",
    },
  ],
  // El historial debe consultar las mismas entidades que el history-graph
  // que funciona en Lovelace. En esta instalación son entidades light.*.
  history: [
    {
      entity: "light.sala_de_grabacion_interruptor_1",
      name: "Tiras LED",
    },
    {
      entity: "light.sala_de_grabacion_interruptor_2",
      name: "Paneles",
    },
    {
      entity: "light.sala_de_grabacion_interruptor_3",
      name: "Tracklight",
    },
    {
      entity: "light.sala_de_grabacion_interruptor_4",
      name: "Spots decorativos",
    },
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

const CONDITION_ICONS = {
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

const POWER_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 2h2v10h-2V2Zm5.66 3.93 1.41-1.41A9 9 0 1 1 5.93 4.52l1.41 1.41A7 7 0 1 0 16.66 5.93Z"/>
  </svg>
`;

const LIGHT_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 2h6v2H9V2Zm3 4a7 7 0 1 1-4.95 2.05l1.42 1.42A5 5 0 1 0 12 8V6Z"/>
  </svg>
`;

const MENU_ICON = `
  <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6.5h18M3 12h18M3 17.5h18"></path>
  </svg>
`;

const THEME_ICON = `
  <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
    <g class="theme-icon-sun">
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5M4.75 4.75l1.77 1.77M17.48 17.48l1.77 1.77M19.25 4.75l-1.77 1.77M6.52 17.48l-1.77 1.77" />
    </g>
    <path class="theme-icon-moon" d="M20.2 15.4A8.1 8.1 0 0 1 8.6 3.8a8.65 8.65 0 1 0 11.6 11.6Z" />
  </svg>
`;

class SalaGrabacionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._started = false;
    this._hasRendered = false;

    this._forecast = [];
    this._history = [];
    this._historyError = "";
    this._liveStates = new Map();

    this._unsubscribeForecast = null;
    this._forecastEntity = "";
    this._unsubscribeStates = null;
    this._clockTimer = null;
    this._historyTimer = null;
    this._historyReloadTimer = null;
    this._historyRequestId = 0;

    this._pendingSwitches = new Map();
    this._switchErrors = new Map();
    this._switchTimers = new Map();

    this._sceneDialogOpen = false;
    this._scenePending = false;
    this._sceneMessage = "";
    this._sceneMessageType = "";
    this._sceneMessageTimer = null;

    this._themeStorageKey = "witmind-sala-panel-theme";
    this._theme = this._loadTheme();
    // No modificar atributos del host dentro del constructor. Home Assistant
    // crea el panel con document.createElement() y valida que el elemento
    // personalizado salga del constructor sin atributos propios.

    this.shadowRoot.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      if (!target || !this._hass) return;

      const action = target.dataset.action;

      if (action === "toggle") {
        this._toggleSwitch(target.dataset.entity);
      } else if (action === "toggle-menu") {
        this._toggleHomeAssistantMenu();
      } else if (action === "toggle-theme") {
        this._toggleTheme();
      } else if (action === "refresh-history") {
        this._loadHistory();
      } else if (action === "power-on") {
        this._activateTotalOnScene();
      } else if (action === "open-scene") {
        this._sceneDialogOpen = true;
        this.render();
      } else if (action === "confirm-scene") {
        this._activateTotalOffScene();
      } else if (action === "cancel-scene") {
        const clickedInsideDialog = event.target.closest("[data-dialog-card]");
        if (target.classList.contains("dialog-backdrop") && clickedInsideDialog) return;
        if (!this._scenePending) {
          this._sceneDialogOpen = false;
          this.render();
        }
      }
    });
  }

  set hass(value) {
    this._hass = value;
    this._syncStatesFromHass();

    if (!this._started) {
      this._started = true;
      this._start();
    }

    if (!this._hasRendered) {
      this.render();
    } else {
      this._refreshRealtimeUI();
    }
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
      this.render();
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
    if (this._hass) this.render();
  }

  disconnectedCallback() {
    clearInterval(this._clockTimer);
    clearInterval(this._historyTimer);
    clearTimeout(this._historyReloadTimer);
    clearTimeout(this._sceneMessageTimer);

    this._resetForecastSubscription();

    if (this._unsubscribeStates) {
      this._unsubscribeStates();
      this._unsubscribeStates = null;
    }

    for (const timer of this._switchTimers.values()) clearTimeout(timer);
    this._switchTimers.clear();
    this._started = false;
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
    } catch (error) {
      console.warn("No se pudo leer la preferencia de tema:", error);
      return "light";
    }
  }

  _saveTheme() {
    try {
      localStorage.setItem(this._themeStorageKey, this._theme);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia de tema:", error);
    }
  }

  _toggleTheme() {
    this._theme = this._theme === "dark" ? "light" : "dark";
    this.setAttribute("data-theme", this._theme);
    this._saveTheme();
    this._refreshThemeButton();
  }

  _refreshThemeButton() {
    const button = this.shadowRoot?.querySelector("[data-theme-toggle]");
    if (!button) return;

    const nextTheme = this._theme === "dark" ? "claro" : "oscuro";
    button.setAttribute("aria-label", `Cambiar a tema ${nextTheme}`);
    button.setAttribute("title", `Cambiar a tema ${nextTheme}`);
    button.setAttribute("aria-pressed", String(this._theme === "light"));
  }

  _config() {
    const raw = this._panel?.config || {};
    const switches = Array.isArray(raw.switches) && raw.switches.length
      ? raw.switches
      : DEFAULT_PANEL_CONFIG.switches;
    const history = Array.isArray(raw.history) && raw.history.length
      ? raw.history
      : DEFAULT_PANEL_CONFIG.history;

    const normalizedSwitches = switches
      .filter((item) => item?.entity)
      .map((item, index) => ({
        entity: String(item.entity),
        name: item.name || `Interruptor ${index + 1}`,
        subtitle: item.subtitle || "Sala de grabación",
      }));
    const configuredTotalOffEntities = raw.total_off_entities || raw.totalOffEntities;
    const totalOffEntities = Array.isArray(configuredTotalOffEntities)
      ? [...new Set(configuredTotalOffEntities.filter(Boolean).map(String))]
      : [];

    const historyHoursRaw = raw.history_hours ?? raw.historyHours;
    const parsedHistoryHours = Number(historyHoursRaw);

    return {
      title: raw.title || DEFAULT_PANEL_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_PANEL_CONFIG.subtitle,
      siteLabel: raw.site_label || raw.siteLabel || DEFAULT_PANEL_CONFIG.siteLabel,
      logo: raw.logo || DEFAULT_PANEL_CONFIG.logo,
      weather: raw.weather || DEFAULT_PANEL_CONFIG.weather,
      projectedCost:
        raw.projected_cost || raw.projectedCost || DEFAULT_PANEL_CONFIG.projectedCost,
      totalOffScene:
        raw.total_off_scene || raw.totalOffScene || DEFAULT_PANEL_CONFIG.totalOffScene,
      totalOffEntities: totalOffEntities.length
        ? totalOffEntities
        : normalizedSwitches.map((item) => item.entity),
      historyHours:
        Number.isFinite(parsedHistoryHours) && parsedHistoryHours > 0
          ? Math.min(24, parsedHistoryHours)
          : DEFAULT_PANEL_CONFIG.historyHours,
      showForecast:
        raw.show_forecast ?? raw.showForecast ?? DEFAULT_PANEL_CONFIG.showForecast,
      showHistory: raw.show_history ?? raw.showHistory ?? DEFAULT_PANEL_CONFIG.showHistory,
      showProjectedCost:
        raw.show_projected_cost ??
        raw.showProjectedCost ??
        DEFAULT_PANEL_CONFIG.showProjectedCost,
      switches: normalizedSwitches,
      history: history
        .filter((item) => item?.entity)
        .map((item, index) => ({
          entity: String(item.entity),
          name: item.name || `Dispositivo ${index + 1}`,
        })),
    };
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

  _trackedEntities() {
    const config = this._config();
    return new Set([
      ...config.switches.map((item) => item.entity),
      ...config.totalOffEntities,
      ...config.history.map((item) => item.entity),
      config.weather,
      config.projectedCost,
      config.totalOffScene,
    ].filter(Boolean));
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

      this._refreshRealtimeUI();
    } catch (error) {
      console.error("No se pudieron sincronizar los estados:", error);
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

          // El evento state_changed es la fuente en tiempo real de Home Assistant.
          // Se incorpora al gráfico inmediatamente y luego se reconcilia con
          // Recorder, que normalmente confirma el cambio pocos segundos después.
          if (newState && this._historyEntityIds().has(entityId)) {
            this._appendHistoryState(entityId, newState);
            this.render();
            this._scheduleHistoryReload();
          } else {
            this._refreshRealtimeUI();
          }
        },
        "state_changed",
      );
    } catch (error) {
      console.error("No se pudo suscribir a state_changed:", error);
    }
  }

  _historyEntityIds() {
    return new Set(this._config().history.map((item) => item.entity));
  }

  _appendHistoryState(entityId, stateObject) {
    if (!stateObject) return;

    let group = (this._history || []).find(
      (items) => items?.[0]?.entity_id === entityId,
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

    // Evita duplicados cuando llega el mismo estado por más de una vía.
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
          this.render();
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
    if (!this._hass?.callApi || !config.showHistory || !config.history.length) return;

    const missingEntities = config.history
      .map((item) => item.entity)
      .filter((entityId) => !this._hass.states?.[entityId]);

    if (missingEntities.length) {
      this._history = [];
      this._historyError =
        `Home Assistant no reconoce: ${missingEntities.join(", ")}. ` +
        "El historial debe usar los entity_id reales que aparecen en Herramientas de desarrollador > Estados.";
      this.render();
      return;
    }

    const endDate = new Date();
    const startDate = new Date(
      endDate.getTime() - config.historyHours * 60 * 60 * 1000,
    );
    const entityIds = config.history.map((item) => item.entity).join(",");

    const path =
      `history/period/${encodeURIComponent(startDate.toISOString())}` +
      `?filter_entity_id=${encodeURIComponent(entityIds)}` +
      `&end_time=${encodeURIComponent(endDate.toISOString())}` +
      "&minimal_response&no_attributes";

    const requestId = ++this._historyRequestId;

    try {
      const response = await this._hass.callApi("GET", path);
      if (requestId !== this._historyRequestId) return;

      if (!Array.isArray(response)) {
        throw new Error("La API de historial devolvió un formato inesperado.");
      }

      // minimal_response omite entity_id en estados intermedios. Se normaliza
      // cada grupo para que el renderizado no dependa de esa optimización.
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
      console.error("No se pudo cargar el historial:", {
        error,
        path,
        entities: config.history.map((item) => item.entity),
      });
    }

    this.render();
  }

  _state(entityId) {
    return this._liveStates.get(entityId) || this._hass?.states?.[entityId];
  }

  _friendlyName(entityId, fallback) {
    return this._state(entityId)?.attributes?.friendly_name || fallback;
  }

  async _toggleSwitch(entityId) {
    if (!entityId || !this._hass) return;

    const stateObject = this._state(entityId);
    if (!stateObject || ["unknown", "unavailable"].includes(stateObject.state)) {
      this._switchErrors.set(entityId, "No disponible");
      this._refreshSwitchUI();
      return;
    }

    const pending = this._pendingSwitches.get(entityId);
    const visibleState = pending?.desired || stateObject.state;
    const desired = visibleState === "on" ? "off" : "on";
    const service = desired === "on" ? "turn_on" : "turn_off";

    this._pendingSwitches.set(entityId, { desired, startedAt: Date.now() });
    this._switchErrors.delete(entityId);
    this._refreshSwitchUI();

    try {
      const domain = entityId.split(".", 1)[0];
      await this._hass.callService(domain, service, { entity_id: entityId });

      const previousTimer = this._switchTimers.get(entityId);
      if (previousTimer) clearTimeout(previousTimer);

      const timer = setTimeout(() => this._verifySwitchState(entityId, desired), 6000);
      this._switchTimers.set(entityId, timer);
    } catch (error) {
      this._pendingSwitches.delete(entityId);
      this._switchErrors.set(entityId, "La acción falló");
      this._refreshSwitchUI();
      console.error(`Error ejecutando ${service} en ${entityId}:`, error);
    }
  }

  async _verifySwitchState(entityId, desired) {
    await this._fetchCurrentStates();
    const confirmed = this._state(entityId)?.state === desired;

    this._pendingSwitches.delete(entityId);
    this._switchTimers.delete(entityId);

    if (confirmed) {
      this._switchErrors.delete(entityId);
    } else {
      this._switchErrors.set(entityId, "Sin confirmación");
    }

    this._refreshSwitchUI();
  }

  _isUnavailable(entityId) {
    const state = this._state(entityId)?.state;
    return !state || ["unknown", "unavailable"].includes(state);
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

  async _activateTotalOffScene() {
    const config = this._config();
    if (this._scenePending || !this._hass) return;

    const availableEntities = config.totalOffEntities.filter(
      (entityId) => !this._isUnavailable(entityId),
    );
    const unavailableEntities = config.totalOffEntities.filter(
      (entityId) => this._isUnavailable(entityId),
    );

    if (!availableEntities.length) {
      this._sceneMessage = "No hay luminarias disponibles para apagar.";
      this._sceneMessageType = "error";
      this.render();
      this._scheduleSceneMessageClear();
      return;
    }

    const expectations = availableEntities.map((entityId) => ({
      entityId,
      desired: "off",
    }));
    const startedAt = Date.now();

    this._scenePending = true;
    this._sceneMessage = "";
    this._sceneMessageType = "";
    for (const { entityId, desired } of expectations) {
      this._pendingSwitches.set(entityId, { desired, startedAt });
      this._switchErrors.delete(entityId);
    }
    this.render();

    let sceneError = null;
    let completed = false;

    try {
      // La escena se conserva por compatibilidad, pero el apagado real no
      // depende de ella: se fuerza y se verifica cada interruptor, igual que
      // en los controles generales del Lobby y del Showroom.
      if (config.totalOffScene) {
        try {
          const domain = config.totalOffScene.split(".")[0];
          await this._hass.callService(domain, "turn_on", {
            entity_id: config.totalOffScene,
          });
        } catch (error) {
          sceneError = error;
          console.warn(
            `La escena ${config.totalOffScene} no respondió; se aplicará control directo.`,
            error,
          );
        }
      }

      await this._setEntitiesState(availableEntities, "off");
      const verification = await this._waitForExpectedStates(expectations);
      if (!verification.ok) {
        const failed = verification.mismatches.map((item) => item.entityId).join(", ");
        throw new Error(`No se confirmaron apagadas: ${failed}`);
      }

      completed = true;
      const fallbackSuffix = sceneError ? " Se completó mediante control directo." : "";
      const unavailableSuffix = unavailableEntities.length
        ? ` ${unavailableEntities.length} luminaria(s) no estaban disponibles.`
        : "";
      this._sceneMessage = `Todas las luminarias están apagadas.${fallbackSuffix}${unavailableSuffix}`;
      this._sceneMessageType = "success";
    } catch (error) {
      for (const { entityId, desired } of expectations) {
        if (this._state(entityId)?.state !== desired) {
          this._switchErrors.set(entityId, "Sin confirmación global");
        }
      }
      this._sceneMessage = "No se pudo confirmar el apagado de todas las luminarias.";
      this._sceneMessageType = "error";
      console.error("No se pudo ejecutar el apagado total:", error);
    } finally {
      for (const { entityId } of expectations) {
        this._pendingSwitches.delete(entityId);
      }
      this._scenePending = false;
      if (completed) this._sceneDialogOpen = false;
      await this._fetchCurrentStates();
      this.render();
      this._scheduleSceneMessageClear();
    }
  }

  async _activateTotalOnScene() {
    const config = this._config();
    if (this._scenePending || !this._hass) return;

    const availableEntities = config.totalOffEntities.filter(
      (entityId) => !this._isUnavailable(entityId),
    );

    if (!availableEntities.length) {
      this._sceneMessage = "No hay luminarias disponibles para encender.";
      this._sceneMessageType = "error";
      this.render();
      this._scheduleSceneMessageClear();
      return;
    }

    const expectations = availableEntities.map((entityId) => ({
      entityId,
      desired: "on",
    }));
    const startedAt = Date.now();

    this._pendingAction = "grabacion-power-on";
    this._scenePending = true;
    this._sceneMessage = "";
    this._sceneMessageType = "";
    for (const { entityId, desired } of expectations) {
      this._pendingSwitches.set(entityId, { desired, startedAt });
      this._switchErrors.delete(entityId);
    }
    this.render();

    try {
      await this._setEntitiesState(availableEntities, "on");
      const verification = await this._waitForExpectedStates(expectations);
      if (!verification.ok) {
        const failed = verification.mismatches.map((item) => item.entityId).join(", ");
        throw new Error(`No se confirmaron encendidas: ${failed}`);
      }

      this._sceneMessage = "Todas las luminarias están encendidas.";
      this._sceneMessageType = "success";
    } catch (error) {
      for (const { entityId, desired } of expectations) {
        if (this._state(entityId)?.state !== desired) {
          this._switchErrors.set(entityId, "Sin confirmación global");
        }
      }
      this._sceneMessage = "No se pudo confirmar el encendido de todas las luminarias.";
      this._sceneMessageType = "error";
      console.error("No se pudo ejecutar el encendido total:", error);
    } finally {
      for (const { entityId } of expectations) {
        this._pendingSwitches.delete(entityId);
      }
      this._scenePending = false;
      this._pendingAction = "";
      await this._fetchCurrentStates();
      this.render();
      this._scheduleSceneMessageClear();
    }
  }

  _scheduleSceneMessageClear() {
    clearTimeout(this._sceneMessageTimer);
    this._sceneMessageTimer = setTimeout(() => {
      this._sceneMessage = "";
      this._sceneMessageType = "";
      this.render();
    }, 4500);
  }

  _setupLogoFallback() {
    const image = this.shadowRoot?.querySelector("[data-company-logo]");
    const frame = image?.closest(".logo-frame");
    if (!image || !frame) return;

    const showFallback = () => frame.classList.add("is-fallback");
    image.addEventListener("error", showFallback, { once: true });
    if (image.complete && image.naturalWidth === 0) showFallback();
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

  _refreshRealtimeUI() {
    if (!this._hasRendered) return;
    this._refreshSwitchUI();
    this._refreshSummaryUI();
    this._refreshWeatherUI();
    this._refreshGaugeUI();
  }

  _refreshSwitchUI() {
    if (!this._hasRendered) return;

    const config = this._config();
    let activeSwitches = 0;

    for (const item of config.switches) {
      const card = this.shadowRoot.querySelector(
        `[data-switch-card][data-entity="${CSS.escape(item.entity)}"]`,
      );
      if (!card) continue;

      const stateObject = this._state(item.entity);
      const pending = this._pendingSwitches.get(item.entity);
      const error = this._switchErrors.get(item.entity);
      const realState = stateObject?.state || "unavailable";
      const visibleState = pending?.desired || realState;
      const isOn = visibleState === "on";
      const isUnavailable =
        !stateObject || ["unavailable", "unknown"].includes(realState);

      if (realState === "on") activeSwitches += 1;

      card.classList.toggle("is-on", isOn);
      card.classList.toggle("is-pending", Boolean(pending));
      card.classList.toggle("is-error", Boolean(error));
      card.classList.toggle("is-unavailable", isUnavailable);
      card.disabled = isUnavailable;
      card.setAttribute("aria-pressed", String(isOn));

      const status = card.querySelector("[data-switch-status]");
      if (status) {
        status.textContent =
          error ||
          (pending
            ? pending.desired === "on"
              ? "Encendiendo…"
              : "Apagando…"
            : isUnavailable
              ? "No disponible"
              : realState === "on"
                ? "Encendido"
                : "Apagado");
      }
    }

    for (const element of this.shadowRoot.querySelectorAll("[data-active-count]")) {
      element.textContent = `${activeSwitches}/${config.switches.length}`;
    }
  }

  _refreshSummaryUI() {
    if (!this._hasRendered) return;

    const config = this._config();
    const unavailableSwitches = config.switches.filter((item) => {
      const state = this._state(item.entity)?.state;
      return !state || ["unknown", "unavailable"].includes(state);
    }).length;

    const availability = this.shadowRoot.querySelector("[data-availability]");
    if (availability) {
      availability.textContent = unavailableSwitches
        ? `${unavailableSwitches} sin conexión`
        : "Sistema disponible";
      availability.classList.toggle("has-warning", unavailableSwitches > 0);
    }
  }

  _refreshWeatherUI() {
    if (!this._hasRendered) return;

    const config = this._config();
    const weather = this._state(config.weather);
    if (!weather) return;

    const attrs = weather.attributes || {};
    const condition = weather.state;
    const fields = {
      condition: CONDITION_LABELS[condition] || condition,
      symbol: CONDITION_ICONS[condition] || "·",
      temperature: `${attrs.temperature ?? "—"}${attrs.temperature_unit ?? "°"}`,
      humidity: `${attrs.humidity ?? "—"}%`,
      wind: `${attrs.wind_speed ?? "—"} ${attrs.wind_speed_unit ?? ""}`.trim(),
    };

    for (const [key, value] of Object.entries(fields)) {
      const element = this.shadowRoot.querySelector(`[data-weather-${key}]`);
      if (element) element.textContent = value;
    }
  }

  _refreshGaugeUI() {
    if (!this._hasRendered) return;

    const config = this._config();
    const meter = this.shadowRoot.querySelector("[data-cost-meter]");
    if (!meter) return;

    const stateObject = this._state(config.projectedCost);
    const value = Number(stateObject?.state);
    const min = Number(stateObject?.attributes?.min ?? 0);
    const max = Number(stateObject?.attributes?.max ?? 100);
    const safeValue = Number.isFinite(value) ? value : 0;
    const percentage = Math.max(
      0,
      Math.min(100, ((safeValue - min) / (max - min || 1)) * 100),
    );
    const unit = stateObject?.attributes?.unit_of_measurement || "";

    meter.style.setProperty("--meter-value", `${percentage}%`);
    const valueElement = meter.querySelector("[data-cost-value]");
    const unitElement = meter.querySelector("[data-cost-unit]");
    const rangeElement = meter.querySelector("[data-cost-range]");

    if (valueElement) valueElement.textContent = Number.isFinite(value) ? String(value) : "—";
    if (unitElement) unitElement.textContent = unit;
    if (rangeElement) rangeElement.textContent = `${min}–${max} ${unit}`.trim();
  }

  _renderSwitch(item) {
    const stateObject = this._state(item.entity);
    const pending = this._pendingSwitches.get(item.entity);
    const state = pending?.desired || stateObject?.state || "unavailable";
    const isOn = state === "on";
    const isUnavailable =
      !stateObject || ["unknown", "unavailable"].includes(stateObject.state);
    const error = this._switchErrors.get(item.entity);
    const status =
      error ||
      (pending
        ? pending.desired === "on"
          ? "Encendiendo…"
          : "Apagando…"
        : isUnavailable
          ? "No disponible"
          : isOn
            ? "Encendido"
            : "Apagado");

    return `
      <button
        class="device-card ${isOn ? "is-on" : ""} ${pending ? "is-pending" : ""} ${error ? "is-error" : ""} ${isUnavailable ? "is-unavailable" : ""}"
        data-action="toggle"
        data-switch-card
        data-entity="${this._escape(item.entity)}"
        aria-label="Cambiar ${this._escape(item.name)}"
        aria-pressed="${isOn}"
        ${isUnavailable ? "disabled" : ""}
      >
        <span class="device-icon">${LIGHT_ICON}</span>
        <span class="device-copy">
          <strong>${this._escape(item.name)}</strong>
          <small data-switch-status>${this._escape(status)}</small>
        </span>
        <span class="switch-control" aria-hidden="true"><span></span></span>
      </button>
    `;
  }

  _renderWeather() {
    const config = this._config();
    const weather = this._state(config.weather);

    if (!weather) {
      return `
        <article class="surface weather-card compact-error">
          <div>
            <span class="eyebrow">Clima</span>
            <h2>Entidad no encontrada</h2>
            <code>${this._escape(config.weather)}</code>
          </div>
        </article>
      `;
    }

    const attrs = weather.attributes || {};
    const condition = weather.state;
    const forecasts = config.showForecast ? this._forecast.slice(0, 5) : [];

    return `
      <article class="surface weather-card">
        <div class="weather-top">
          <div class="weather-copy">
            <span class="eyebrow">Clima</span>
            <h2 data-weather-condition>${this._escape(CONDITION_LABELS[condition] || condition)}</h2>
            <div class="weather-meta">
              <span>Humedad <b data-weather-humidity>${this._escape(String(attrs.humidity ?? "—"))}%</b></span>
              <span>Viento <b data-weather-wind>${this._escape(String(attrs.wind_speed ?? "—"))} ${this._escape(attrs.wind_speed_unit ?? "")}</b></span>
            </div>
          </div>

          <div class="weather-value">
            <span data-weather-symbol>${this._escape(CONDITION_ICONS[condition] || "·")}</span>
            <strong data-weather-temperature>${this._escape(String(attrs.temperature ?? "—"))}${this._escape(attrs.temperature_unit ?? "°")}</strong>
          </div>
        </div>

        ${
          config.showForecast
            ? `
              <div class="forecast-strip" aria-label="Pronóstico de cinco días">
                ${
                  forecasts.length
                    ? forecasts
                        .map((item) => {
                          const date = new Date(item.datetime);
                          const high = item.temperature ?? item.native_temperature ?? "—";
                          const low = item.templow ?? item.native_templow ?? "—";
                          const itemCondition = item.condition || "";

                          return `
                            <div class="forecast-day">
                              <span>${this._escape(
                                new Intl.DateTimeFormat("es-BO", { weekday: "short" }).format(date),
                              )}</span>
                              <b>${this._escape(CONDITION_ICONS[itemCondition] || "·")}</b>
                              <strong>${this._escape(String(high))}°</strong>
                              <small>${this._escape(String(low))}°</small>
                            </div>
                          `;
                        })
                        .join("")
                    : `<p class="forecast-empty">Pronóstico no disponible.</p>`
                }
              </div>
            `
            : ""
        }
      </article>
    `;
  }

  _renderHistory() {
    const config = this._config();
    if (!config.showHistory) return "";

    const endTime = Date.now();
    const startTime = endTime - config.historyHours * 60 * 60 * 1000;
    const groupMap = new Map();

    for (const group of this._history || []) {
      const entityId = group?.[0]?.entity_id;
      if (entityId) groupMap.set(entityId, group);
    }

    const rows = config.history
      .map((item) => {
        const group = groupMap.get(item.entity) || [];
        const segments = this._historySegments(group, startTime, endTime);
        const currentState = this._state(item.entity)?.state;

        return `
          <div class="history-row">
            <div class="history-label">
              <strong>${this._escape(item.name)}</strong>
              <small>${this._escape(
                currentState === "on"
                  ? "Encendido"
                  : currentState === "off"
                    ? "Apagado"
                    : currentState || "Sin datos",
              )}</small>
            </div>
            <div class="timeline">
              ${
                segments.length
                  ? segments
                      .map(
                        (segment) => `
                          <span
                            class="timeline-segment ${segment.state === "on" ? "on" : "off"}"
                            style="left:${segment.left}%;width:${segment.width}%"
                          ></span>
                        `,
                      )
                      .join("")
                  : `<span class="timeline-empty">Sin historial</span>`
              }
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <article class="surface history-card">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Últimas ${this._escape(config.historyHours)} h</span>
            <h2>Actividad de luminarias</h2>
          </div>
          <button
            class="icon-button"
            data-action="refresh-history"
            aria-label="Actualizar historial"
            title="Actualizar historial"
          >↻</button>
        </div>

        ${
          this._historyError
            ? `<p class="error">${this._escape(this._historyError)}</p>`
            : `
              <div class="history-scale">
                <span>−${this._escape(config.historyHours)} h</span>
                <span>−${this._escape(Math.max(1, Math.round(config.historyHours / 2)))} h</span>
                <span>Ahora</span>
              </div>
              <div class="history-list">${rows}</div>
            `
        }
      </article>
    `;
  }

  _renderProjectedCost() {
    const config = this._config();
    if (!config.showProjectedCost) return "";

    const stateObject = this._state(config.projectedCost);
    const value = Number(stateObject?.state);
    const min = Number(stateObject?.attributes?.min ?? 0);
    const max = Number(stateObject?.attributes?.max ?? 100);
    const safeValue = Number.isFinite(value) ? value : 0;
    const percentage = Math.max(
      0,
      Math.min(100, ((safeValue - min) / (max - min || 1)) * 100),
    );
    const unit = stateObject?.attributes?.unit_of_measurement || "";

    return `
      <article class="surface cost-card" data-cost-meter style="--meter-value:${percentage}%">
        <div>
          <span class="eyebrow">Proyección · 8 h</span>
          <h2>Gasto proyectado</h2>
        </div>

        <div class="cost-value">
          <strong data-cost-value>${this._escape(Number.isFinite(value) ? String(value) : "—")}</strong>
          <span data-cost-unit>${this._escape(unit)}</span>
        </div>

        <div class="meter" aria-label="Progreso dentro del rango configurado">
          <span></span>
        </div>

        <div class="cost-footer">
          <span>Rango configurado</span>
          <b data-cost-range>${this._escape(`${min}–${max} ${unit}`.trim())}</b>
        </div>
      </article>
    `;
  }

  _historySegments(group, startTime, endTime) {
    if (!Array.isArray(group) || group.length === 0) return [];

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
      const segmentStart = Math.max(startTime, current.time);
      const segmentEnd = Math.min(endTime, next?.time ?? endTime);
      if (segmentEnd <= segmentStart) continue;

      segments.push({
        state: current.state,
        left: ((segmentStart - startTime) / (endTime - startTime)) * 100,
        width: ((segmentEnd - segmentStart) / (endTime - startTime)) * 100,
      });
    }

    return segments;
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  render() {
    if (!this.shadowRoot || !this._hass) return;

    this.setAttribute("data-theme", this._theme);

    const config = this._config();
    const activeSwitches = config.switches.filter(
      (item) => this._state(item.entity)?.state === "on",
    ).length;
    const weather = this._state(config.weather);
    const weatherAttrs = weather?.attributes || {};
    const condition = weather?.state;
    const titleWords = String(config.title || "Sala de grabación").trim().split(/\s+/);
    const titleAccent = titleWords.pop() || "Grabación";
    const titleLead = titleWords.join(" ");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #f26522;
          --primary-hover: #d95a1e;
          --primary-soft: rgba(242, 101, 34, 0.1);
          --primary-medium: rgba(242, 101, 34, 0.18);
          --primary-border: rgba(242, 101, 34, 0.38);
          --primary-glow: rgba(242, 101, 34, 0.18);
          --background: #061c2b;
          --surface: rgba(255, 255, 255, 0.035);
          --surface-hover: rgba(255, 255, 255, 0.055);
          --surface-active: rgba(242, 101, 34, 0.1);
          --surface-subtle: rgba(255, 255, 255, 0.025);
          --surface-control: rgba(255, 255, 255, 0.055);
          --surface-track: rgba(255, 255, 255, 0.022);
          --track: rgba(255, 255, 255, 0.055);
          --text-primary: rgba(255, 255, 255, 0.92);
          --text-secondary: rgba(255, 255, 255, 0.7);
          --text-tertiary: rgba(255, 255, 255, 0.48);
          --icon-muted: rgba(255, 255, 255, 0.55);
          --switch-knob: rgba(255, 255, 255, 0.68);
          --timeline-off: rgba(255, 255, 255, 0.12);
          --grid-line: rgba(255, 255, 255, 0.07);
          --border-subtle: rgba(255, 255, 255, 0.06);
          --border-default: rgba(255, 255, 255, 0.09);
          --border-emphasis: rgba(255, 255, 255, 0.14);
          --header-background: rgba(11, 43, 64, 0.72);
          --modal-overlay: rgba(0, 10, 18, 0.75);
          --modal-surface: #0a2638;
          --shadow: rgba(0, 0, 0, 0.13);
          --modal-shadow: rgba(0, 0, 0, 0.42);
          --toast-shadow: rgba(0, 0, 0, 0.32);
          --success: #22c55e;
          --warning: #f59e0b;
          --error: #ef4444;
          --radius-lg: 22px;
          --radius-pill: 999px;
          --motion: 180ms cubic-bezier(0.16, 1, 0.3, 1);
          display: block;
          min-height: 100%;
          color-scheme: dark;
          color: var(--text-primary);
          background:
            radial-gradient(circle at 88% 7%, rgba(242, 101, 34, 0.08), transparent 27%),
            radial-gradient(circle at 4% 88%, rgba(11, 43, 64, 0.75), transparent 36%),
            var(--background);
          font-family: "Plus Jakarta Sans", Inter, Arial, sans-serif;
        }

        :host([data-theme="light"]) {
          --background: #edf3f6;
          --surface: rgba(255, 255, 255, 0.82);
          --surface-hover: rgba(255, 255, 255, 0.98);
          --surface-active: rgba(242, 101, 34, 0.1);
          --surface-subtle: rgba(6, 28, 43, 0.035);
          --surface-control: rgba(6, 28, 43, 0.055);
          --surface-track: rgba(6, 28, 43, 0.035);
          --track: rgba(6, 28, 43, 0.055);
          --text-primary: rgba(6, 28, 43, 0.94);
          --text-secondary: rgba(6, 28, 43, 0.7);
          --text-tertiary: rgba(6, 28, 43, 0.5);
          --icon-muted: rgba(6, 28, 43, 0.56);
          --switch-knob: rgba(255, 255, 255, 0.96);
          --timeline-off: rgba(6, 28, 43, 0.13);
          --grid-line: rgba(6, 28, 43, 0.09);
          --border-subtle: rgba(6, 28, 43, 0.08);
          --border-default: rgba(6, 28, 43, 0.12);
          --border-emphasis: rgba(6, 28, 43, 0.18);
          --header-background: rgba(255, 255, 255, 0.9);
          --modal-overlay: rgba(6, 28, 43, 0.38);
          --modal-surface: #ffffff;
          --shadow: rgba(6, 28, 43, 0.1);
          --modal-shadow: rgba(6, 28, 43, 0.24);
          --toast-shadow: rgba(6, 28, 43, 0.2);
          color-scheme: light;
          background:
            radial-gradient(circle at 88% 7%, rgba(242, 101, 34, 0.1), transparent 27%),
            radial-gradient(circle at 4% 88%, rgba(11, 43, 64, 0.08), transparent 36%),
            var(--background);
        }

        * { box-sizing: border-box; }
        button, code { font: inherit; }
        button { color: inherit; }
        button:focus-visible { outline: 3px solid rgba(56, 189, 248, 0.72); outline-offset: 2px; }
        h1, h2, p { margin-top: 0; }

        .panel-shell { min-height: 100%; container: grabacion-panel / inline-size; }
        .dashboard { width: min(1460px, 100%); margin: 0 auto; padding: clamp(14px, 2vw, 24px); }
        .surface {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          background: var(--surface);
          box-shadow: 0 14px 36px var(--shadow), inset 0 1px 0 rgba(255,255,255,.035);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          overflow: hidden;
        }

        .app-shell { min-height: 100vh; container: grabacion-panel / inline-size; }
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
          background: var(--header-background, var(--header));
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .topbar-start, .brand { min-width: 0; display: flex; align-items: center; }
        .topbar-start { gap: 10px; }
        .brand { gap: 13px; }
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
        .logo-fallback { display: none; color: var(--primary); font: 800 20px/1 Outfit, Inter, sans-serif; }
        .logo-frame.is-fallback .brand-logo { display: none; }
        .logo-frame.is-fallback .logo-fallback { display: block; }
        .brand-copy { min-width: 0; }
        .brand-copy strong, .brand-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .brand-copy strong { font: 800 15px/1.15 Outfit, Inter, sans-serif; }
        .brand-copy small { margin-top: 2px; color: var(--text-secondary); font-size: 10px; font-weight: 650; }
        .topbar-meta { display: flex; align-items: center; justify-content: flex-end; margin-left: auto; }

        .menu-button, .menu-toggle, .theme-button, .theme-toggle, .icon-button {
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          padding: 0;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-default);
          border-radius: 50%;
          background: var(--surface-subtle);
          color: var(--text-secondary);
          cursor: pointer;
          transition: transform var(--motion), color var(--motion), border-color var(--motion), background var(--motion);
        }
        .menu-button:hover, .menu-toggle:hover, .theme-button:hover, .theme-toggle:hover { transform: translateY(-2px); background: var(--surface-hover); border-color: var(--primary-border, var(--primary)); }
        .menu-toggle .menu-icon, .menu-button .menu-icon, .theme-toggle .theme-icon, .theme-button .theme-icon {
          width: 20px;
          height: 20px;
          overflow: visible;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .menu-toggle .menu-icon, .menu-button .menu-icon { width: 22px; height: 22px; stroke-width: 2; }
        .theme-icon-sun, .theme-icon-moon { transform-origin: 12px 12px; transition: opacity var(--motion), transform var(--motion); }
        .theme-icon-sun { opacity: 0; transform: rotate(-35deg) scale(.55); }
        .theme-icon-moon { opacity: 1; transform: rotate(0) scale(1); }
        :host([data-theme="light"]) .theme-icon-sun { opacity: 1; transform: rotate(0) scale(1); }
        :host([data-theme="light"]) .theme-icon-moon { opacity: 0; transform: rotate(35deg) scale(.55); }

        .overview-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 14px; }
        .hero-card {
          min-height: 112px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          background:
            radial-gradient(circle at 95% 18%, rgba(242,101,34,.15), transparent 35%),
            linear-gradient(135deg, rgba(255,255,255,.045), transparent 75%);
        }
        .hero-copy { min-width: 0; }
        .hero-heading-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; }
        .hero-card h1 {
          min-width: 0;
          margin: 0;
          font-family: Outfit, Inter, Arial, sans-serif;
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -.035em;
        }
        .hero-card h1 span { color: var(--primary); }
        .hero-card p { max-width: 650px; margin: 12px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
        .hero-clock { flex: 0 0 auto; display: inline-flex; align-items: baseline; gap: 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .hero-clock strong { font: 800 clamp(27px, 3vw, 36px)/1 Outfit, Inter, sans-serif; letter-spacing: -.04em; }
        .hero-clock span { color: var(--text-secondary); font-size: 10px; font-weight: 800; letter-spacing: .08em; }
        .hero-weather { min-width: 0; padding-left: 18px; border-left: 1px solid var(--border-subtle); }
        .hero-weather-main { display: grid; grid-template-columns: 42px minmax(0,1fr) auto; gap: 10px; align-items: center; }
        .hero-weather-symbol { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: var(--primary-soft); color: var(--primary); font-size: 22px; }
        .hero-weather-copy strong, .hero-weather-copy small { display: block; }
        .hero-weather-copy strong { font: 800 16px/1.1 Outfit, Inter, sans-serif; }
        .hero-weather-copy small { margin-top: 4px; color: var(--text-secondary); font-size: 9px; line-height: 1.35; }
        .hero-temperature { font: 800 clamp(25px, 3vw, 34px)/1 Outfit, Inter, sans-serif; white-space: nowrap; }
        .hero-forecast { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; margin-top: 11px; }
        .forecast-item { min-height: 44px; padding: 7px; display: grid; grid-template-columns: 1fr auto; gap: 3px 6px; align-items: center; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--surface-control); }
        .forecast-item span { color: var(--text-tertiary); font-size: 9px; font-weight: 800; text-transform: capitalize; }
        .forecast-item b { grid-row: 1 / span 2; grid-column: 2; color: var(--primary); font-size: 15px; }
        .forecast-item strong { font-size: 11px; }
        .forecast-empty { color: var(--text-tertiary); font-size: 10px; }

        .controls-card, .history-card, .general-card { margin-top: 14px; padding: 16px; }
        .controls-heading, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .eyebrow {
          width: fit-content;
          min-height: 22px;
          margin: 0 0 4px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(242,101,34,.2);
          border-radius: var(--radius-pill);
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .controls-heading h2, .section-heading h2 { margin: 2px 0 0; font-family: Outfit, Inter, sans-serif; font-size: clamp(18px, 2.2vw, 22px); font-weight: 800; line-height: 1.15; letter-spacing: -.02em; }
        .count-chip { min-height: 28px; padding: 0 10px; display: inline-flex; align-items: center; border: 1px solid var(--border-default); border-radius: var(--radius-pill); background: var(--surface-control); color: var(--text-secondary); font-size: 9px; font-weight: 800; white-space: nowrap; }

        .devices-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; margin-top: 11px; }
        .device-card {
          min-width: 0;
          min-height: 58px;
          padding: 8px 9px;
          display: grid;
          grid-template-columns: 34px minmax(0,1fr) 30px;
          gap: 8px;
          align-items: center;
          border: 1px solid var(--border-default);
          border-radius: 14px;
          background: var(--surface-control);
          text-align: left;
          cursor: pointer;
          transition: transform var(--motion), background var(--motion), border-color var(--motion), box-shadow var(--motion);
        }
        .device-card.is-on { border-color: var(--primary-border); background: var(--surface-active); box-shadow: 0 0 20px rgba(242,101,34,.07); }
        .device-card.is-error { border-color: rgba(239,68,68,.45); }
        .device-card.is-unavailable { cursor: not-allowed; opacity: .55; }
        .device-card.is-pending { animation: pulse 1.1s ease-in-out infinite alternate; }
        .device-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; background: var(--track); color: var(--icon-muted); }
        .device-icon svg { width: 19px; fill: currentColor; }
        .device-card.is-on .device-icon { color: var(--primary); background: var(--primary-soft); }
        .device-copy { min-width: 0; }
        .device-copy strong, .device-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .device-copy strong { font-size: 11px; font-weight: 800; }
        .device-copy small { margin-top: 3px; color: var(--text-secondary); font-size: 9px; font-weight: 650; }
        .device-card.is-on .device-copy small { color: var(--primary); }
        .switch-control { width: 29px; height: 17px; padding: 2px; display: flex; align-items: center; border: 1px solid var(--border-default); border-radius: var(--radius-pill); background: var(--track); }
        .switch-control span { width: 11px; height: 11px; border-radius: 50%; background: var(--icon-muted); transition: transform var(--motion), background var(--motion); }
        .device-card.is-on .switch-control { border-color: var(--primary-border); background: var(--primary-medium); }
        .device-card.is-on .switch-control span { transform: translateX(12px); background: var(--primary); }

        .history-scale { display: flex; justify-content: space-between; padding-left: 112px; margin: 15px 0 7px; color: var(--text-tertiary); font-size: 8px; font-weight: 700; }
        .history-list { display: grid; gap: 8px; }
        .history-row { display: grid; grid-template-columns: 100px minmax(0,1fr); align-items: center; gap: 11px; }
        .history-label { min-width: 0; }
        .history-label strong, .history-label small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .history-label strong { font: 800 11px/1.1 Outfit, Inter, sans-serif; }
        .history-label small { margin-top: 2px; color: var(--text-tertiary); font-size: 8px; font-weight: 700; text-transform: uppercase; }
        .timeline { position: relative; height: 22px; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 8px; background: linear-gradient(90deg, transparent 49.7%, var(--grid-line) 50%, transparent 50.3%), var(--surface-track); }
        .timeline-segment { position: absolute; top: 3px; bottom: 3px; min-width: 2px; border-radius: 5px; }
        .timeline-segment.on { background: var(--primary); box-shadow: 0 0 11px rgba(242,101,34,.2); }
        .timeline-segment.off { background: var(--timeline-off); }
        .timeline-empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--text-tertiary); font-size: 8px; }

        .general-card { margin-top: 14px; padding: 16px; }
        .general-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 11px; }
        .general-action { min-height: 52px; padding: 8px 12px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid var(--border-default); border-radius: 14px; background: var(--surface-control); color: var(--text-primary); cursor: pointer; transition: transform var(--motion), background var(--motion), border-color var(--motion); }
        .general-action > span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; flex: 0 0 34px; }
        .general-action.power-on > span { color: var(--success, #22c55e); background: rgba(34, 197, 94, 0.12); }
        .general-action.power-on:hover:not(:disabled) { transform: translateY(-2px); background: var(--surface-hover); border-color: rgba(34, 197, 94, 0.35); }
        .general-action.power-off > span { color: var(--error, #ef4444); background: rgba(239, 68, 68, 0.12); }
        .general-action.power-off:hover:not(:disabled) { transform: translateY(-2px); background: var(--surface-hover); border-color: rgba(239, 68, 68, 0.35); }
        .general-action svg { width: 18px; fill: currentColor; }
        .general-action strong { font-size: 12px; font-weight: 800; }

        .dialog-backdrop { position: fixed; z-index: 1000; inset: 0; padding: 18px; display: grid; place-items: center; background: var(--modal-overlay); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
        .dialog-card { width: min(430px,100%); padding: 22px; border: 1px solid var(--primary-border); border-radius: var(--radius-lg); background: var(--modal-surface); box-shadow: 0 28px 80px var(--modal-shadow); }
        .dialog-icon { width: 48px; height: 48px; display: grid; place-items: center; border: 1px solid var(--primary-border); border-radius: 14px; background: var(--primary-soft); color: var(--primary); font-size: 24px; }
        .dialog-card h2 { margin: 15px 0 0; font: 800 24px/1.1 Outfit, Inter, sans-serif; }
        .dialog-card p { margin: 9px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
        .dialog-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 20px; }
        .dialog-actions button { min-height: 48px; padding: 0 16px; border-radius: var(--radius-pill); font-weight: 800; cursor: pointer; }
        .primary-button { border: 0; background: var(--primary); color: #fff; box-shadow: 0 6px 18px var(--primary-glow); }
        .secondary-button { border: 1px solid var(--border-emphasis); background: var(--surface-control); color: var(--text-primary); }
        .primary-button[disabled], .secondary-button[disabled] { cursor: progress; opacity: .62; }
        .toast { position: fixed; z-index: 1100; right: 18px; bottom: 18px; max-width: min(360px,calc(100vw - 28px)); min-height: 48px; padding: 11px 14px; display: flex; align-items: center; gap: 9px; border: 1px solid var(--border-emphasis); border-radius: 14px; background: var(--modal-surface); box-shadow: 0 18px 46px var(--toast-shadow); font-size: 12px; font-weight: 700; }
        .toast.success { border-color: rgba(34,197,94,.38); }
        .toast.success::before { content: "✓"; color: var(--success); }
        .toast.error { border-color: rgba(239,68,68,.45); }
        .toast.error::before { content: "!"; color: var(--error); }
        .error { color: var(--error); font-size: 12px; }
        code { color: var(--text-secondary); word-break: break-all; }

        @keyframes pulse { from { opacity: .72; } to { opacity: 1; } }
        @media (hover:hover) {
          .device-card:hover:not(:disabled), .icon-button:hover, .menu-toggle:hover, .theme-toggle:hover, .secondary-button:hover { border-color: var(--primary-border); background: var(--surface-hover); transform: translateY(-1px); }
          .primary-button:hover { background: var(--primary-hover); }
        }
        .device-card:active, .general-action:active, .primary-button:active, .secondary-button:active, .icon-button:active, .menu-toggle:active, .theme-toggle:active { transform: scale(.98); }

        @container grabacion-panel (max-width: 860px) {
          .hero-card { grid-template-columns: minmax(0,1fr) auto; }
          .hero-weather { grid-column: 1 / -1; padding: 14px 0 0; border-left: 0; border-top: 0; }
        }
        @container grabacion-panel (max-width: 620px) {
          .dashboard { padding: 12px; }
          .surface, .topbar { backdrop-filter: none; -webkit-backdrop-filter: none; }
          .brand-copy small { display: none; }
          .hero-card { min-height: auto; padding: 18px; grid-template-columns: 1fr !important; align-items: start; }
          .hero-heading-row { align-items: flex-start; }
          .hero-weather { grid-column: auto; }
          .hero-temperature { font-size: 28px; }
          .devices-grid { grid-template-columns: 1fr !important; }
        }
        @container grabacion-panel (max-width: 420px) {
          .brand-copy { display: none; }
          .logo-frame { width: 88px; height: 36px; }
          .hero-heading-row { display: grid; }
          .hero-clock { justify-self: start; }
          .hero-weather-main { grid-template-columns: 38px minmax(0,1fr); }
          .hero-temperature { grid-column: 2; }
          .hero-forecast { grid-template-columns: repeat(3,minmax(70px,1fr)); overflow-x: auto; }
          .history-scale { padding-left: 90px; }
          .history-row { grid-template-columns: 80px minmax(0,1fr); gap: 9px; }
          .dialog-actions { grid-template-columns: 1fr; }
          .toast { right: 12px; bottom: 12px; left: 12px; max-width: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; }
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
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 800;
          line-height: 1.08;
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

        @container grabacion-panel (max-width: 768px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr !important; gap: 12px; }
          .hero-copy { border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 2px; }
          .hero-card h1 { font-size: clamp(22px, 5.5vw, 30px); }
          .hero-status { justify-content: space-between; width: 100%; align-items: center; flex-direction: row; gap: 12px; padding-top: 0; border-top: 0; }
          .hero-clock strong { font-size: 26px; }
          .hero-weather { border-left: 0; padding-left: 0; border-top: 0 !important; }
          .devices-grid { grid-template-columns: 1fr !important; }
          .general-actions { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }

        @media (max-width: 768px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr !important; gap: 12px; }
          .hero-copy { border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 2px; }
          .hero-card h1 { font-size: clamp(22px, 5.5vw, 30px); }
          .hero-status { justify-content: space-between; width: 100%; align-items: center; flex-direction: row; gap: 12px; padding-top: 0; border-top: 0; }
          .hero-clock strong { font-size: 26px; }
          .hero-weather { border-left: 0; padding-left: 0; border-top: 0 !important; }
          .devices-grid { grid-template-columns: 1fr !important; }
          .general-actions { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }

        @container grabacion-panel (max-width: 520px) {
          .logo-frame { width: 92px; height: 38px; }
        }

        @media (max-width: 520px) {
          .logo-frame { width: 92px; height: 38px; }
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
            <button class="menu-button" type="button" data-action="toggle-menu" aria-label="Abrir menú de navegación de Home Assistant" title="Abrir menú">
              ${MENU_ICON}
            </button>
            <div class="brand">
              <div class="logo-frame">
                <img class="brand-logo" data-company-logo src="${this._escape(config.logo)}" alt="Witmind" />
                <span class="logo-fallback" aria-hidden="true">W</span>
              </div>
            </div>
          </div>
          <div class="topbar-meta">
            <button class="theme-button" type="button" data-action="toggle-theme" data-theme-toggle aria-label="Cambiar a tema ${this._theme === "dark" ? "claro" : "oscuro"}" aria-pressed="${this._theme === "light"}" title="Cambiar a tema ${this._theme === "dark" ? "claro" : "oscuro"}">
              ${THEME_ICON}
            </button>
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
                  <span class="hero-weather-symbol" data-weather-symbol aria-hidden="true">${this._escape(CONDITION_ICONS[condition] || "·")}</span>
                  <span class="hero-weather-copy">
                    <small data-weather-condition>${this._escape(CONDITION_LABELS[condition] || condition || "Sin datos")}</small>
                    <strong data-weather-temperature>${this._escape(weatherAttrs.temperature ?? "—")}${this._escape(weatherAttrs.temperature_unit ?? "°")}</strong>
                  </span>
                </div>
              </div>
            </article>
          </section>

          <section class="controls-card surface">
            <div class="controls-heading">
              <div>
                <span class="eyebrow">Iluminación</span>
                <h2>Control principal</h2>
              </div>
              <span class="count-chip"><span data-active-count>${activeSwitches}/${config.switches.length}</span>&nbsp;encendidas</span>
            </div>
            <div class="devices-grid">
              ${config.switches.map((item) => this._renderSwitch(item)).join("")}
            </div>
          </section>

          <section class="general-card surface">
            <div class="section-heading">
              <div>
                <span class="eyebrow">Acciones rápidas</span>
                <h2>Control general</h2>
              </div>
            </div>
            <div class="general-actions">
              <button class="general-action power-on" data-action="power-on" ${this._scenePending ? "disabled" : ""} aria-label="Encender todas las luminarias">
                <span>${LIGHT_ICON}</span>
                <strong>${this._pendingAction === "grabacion-power-on" ? "Encendiendo…" : "Encender todo"}</strong>
              </button>
              <button class="general-action power-off" data-action="open-scene" ${this._scenePending ? "disabled" : ""} aria-label="Preparar apagado total">
                <span>${POWER_ICON}</span>
                <strong>${this._scenePending ? "Apagando…" : "Apagar todo"}</strong>
              </button>
            </div>
          </section>

          ${this._renderHistory()}
        </main>
      </div>

      ${
        this._sceneDialogOpen
          ? `
            <div class="dialog-backdrop" data-action="cancel-scene">
              <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="scene-dialog-title" data-dialog-card>
                <div class="dialog-icon" aria-hidden="true">⏻</div>
                <h2 id="scene-dialog-title">¿Apagar todas las luminarias?</h2>
                <p>Se solicitará el apagado de las cuatro zonas de iluminación de la sala de grabación.</p>
                ${
                  this._sceneMessage && this._sceneMessageType === "error"
                    ? `<p class="error">${this._escape(this._sceneMessage)}</p>`
                    : ""
                }
                <div class="dialog-actions">
                  <button class="secondary-button" data-action="cancel-scene" ${this._scenePending ? "disabled" : ""}>Cancelar</button>
                  <button class="primary-button" data-action="confirm-scene" ${this._scenePending ? "disabled" : ""}>${this._scenePending ? "Ejecutando…" : "Sí, apagar"}</button>
                </div>
              </section>
            </div>
          `
          : ""
      }

      ${
        this._sceneMessage && !this._sceneDialogOpen
          ? `<div class="toast ${this._escape(this._sceneMessageType)}" role="status">${this._escape(this._sceneMessage)}</div>`
          : ""
      }
    `;

    this._hasRendered = true;
    this._setupLogoFallback();
    this._updateClock();
    this._refreshThemeButton();
    this._refreshRealtimeUI();
  }
}

if (!customElements.get("sala-grabacion-panel")) {
  customElements.define("sala-grabacion-panel", SalaGrabacionPanel);
}
