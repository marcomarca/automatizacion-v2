// Witmind Oficinas Panel v1.3.1 — efecto hover en botones estabilizado sin bucle de salto vertical.
const DEFAULT_OFFICES_CONFIG = Object.freeze({
  title: "Oficinas",
  subtitle: "Control operativo",
  siteLabel: "WTX · MDTC",
  logo: "/local/logo-witmind.png?v=2.0.0",
  weather: "weather.forecast_casa",
  lightCountSensor: "sensor.oficinas_luminarias_encendidas",
  historyHours: 12,
  showHistory: true,
  areas: [
    {
      id: "gerencia",
      name: "Gerencia Witronix",
      subtitle: "Oficina gerencial",
      descriptor: "Prioridad alta",
      icon: "executive",
      featured: true,
      environment: {
        temperature: "sensor.t_h_sensor_temperature",
        humidity: "sensor.t_h_sensor_humidity",
      },
      devices: [
        {
          entity: "switch.oficina_gerencial_interruptor_1",
          name: "Witronix LED",
          subtitle: "Iluminación de gerencia",
          icon: "bulb",
        },
      ],
    },
    {
      id: "mindtec",
      name: "Oficina Mindtec",
      subtitle: "Empresa vinculada",
      descriptor: "Área prioritaria",
      icon: "company",
      featured: true,
      devices: [
        {
          entity: "switch.oficina_mindtec_interruptor_1",
          name: "Mindtec",
          subtitle: "Iluminación de oficina",
          icon: "bulb",
        },
      ],
    },
    {
      id: "general",
      name: "Oficina general",
      subtitle: "Área principal de trabajo",
      descriptor: "Mayor ocupación",
      icon: "office",
      featured: false,
      environment: {
        temperature: "sensor.t_h_sensor_2_temperature",
        humidity: "sensor.t_h_sensor_2_humidity",
      },
      devices: [
        {
          entity: "switch.oficina_grande_interruptor_1",
          name: "Oficina general 1",
          subtitle: "Sector 1",
          icon: "panel",
        },
        {
          entity: "switch.oficina_grande_interruptor_2",
          name: "Oficina general 2",
          subtitle: "Sector 2",
          icon: "panel",
        },
      ],
    },
    {
      id: "pasillos",
      name: "Pasillos",
      subtitle: "Conexión entre oficinas",
      descriptor: "Circulación",
      icon: "corridor",
      featured: false,
      devices: [
        {
          entity: "switch.b2_gang_interruptor_1",
          name: "Multifuncional",
          subtitle: "Área multifuncional",
          icon: "corridorLight",
        },
        {
          entity: "switch.b2_gang_interruptor_2",
          name: "Pasillo",
          subtitle: "Tramo principal",
          icon: "corridorLight",
        },
      ],
    },
    {
      id: "taller",
      name: "Taller",
      subtitle: "Soporte técnico y mantenimiento",
      descriptor: "Área de soporte operativo",
      icon: "workshop",
      featured: false,
      devices: [
        {
          entity: "switch.taller_interruptor_1",
          name: "Taller",
          subtitle: "Iluminación de oficina",
          icon: "bulb",
        },
      ],
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

const ICON_PATHS = {
  executive: '<path d="M12 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM5 22v-3a7 7 0 0 1 14 0v3H5Zm5-9h4l-1 2h-2l-1-2Z"/>',
  company: '<path d="M4 3h10v18H4V3Zm2 2v14h6V5H6Zm10 4h4v12h-4V9Zm-8-2h2v2H8V7Zm0 4h2v2H8v-2Zm0 4h2v2H8v-2Zm8-4h2v2h-2v-2Zm0 4h2v2h-2v-2Z"/>',
  office: '<path d="M3 4h18v16H3V4Zm2 2v12h14V6H5Zm2 2h4v3H7V8Zm6 0h4v3h-4V8Zm-6 5h4v3H7v-3Zm6 0h4v3h-4v-3Z"/>',
  corridor: '<path d="M4 3h16v18H4V3Zm2 2v14h5V5H6Zm7 0v14h5V5h-5Zm-5 6h1v2H8v-2Zm7 0h1v2h-1v-2Z"/>',
  workshop: '<path d="M3 7l9-5 9 5v14H3V7Zm2 1.2V19h4v-6h6v6h4V8.2l-7-3.9-7 3.9ZM11 15h2v4h-2v-4Z"/>',
  bulb: '<path d="M9 21h6v-2H9v2Zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Zm2 11.5V15h-4v-1.5l-.5-.3A5 5 0 1 1 14.5 13l-.5.5Z"/>',
  panel: '<path d="M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 2h8v2H8V8Zm0 4h8v4H8v-4Z"/>',
  corridorLight: '<path d="M5 4h14l-2 8H7L5 4Zm4 10h6v2H9v-2Zm-2 4h10v2H7v-2Z"/>',
  power: '<path d="M11 2h2v10h-2V2Zm5.7 3.9 1.4-1.4A9 9 0 1 1 5.9 4.5l1.4 1.4A7 7 0 1 0 16.7 5.9Z"/>',
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

class OficinasPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._started = false;
    this._renderQueued = false;
    this._liveStates = new Map();
    this._history = [];
    this._historyError = "";
    this._historyRequestId = 0;
    this._pendingSwitches = new Map();
    this._switchErrors = new Map();
    this._switchTimers = new Map();
    this._confirmOpen = false;
    this._pendingAction = "";
    this._toast = null;
    this._toastTimer = null;
    this._clockTimer = null;
    this._historyTimer = null;
    this._historyReloadTimer = null;
    this._unsubscribeStates = null;
    this._themeStorageKey = "witmind-oficinas-panel-theme";
    this._theme = this._loadTheme();

    // No añadir atributos al host en el constructor. Home Assistant valida
    // que el elemento personalizado termine de construirse sin atributos propios.
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
    this._panel = value;
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

    if (this._unsubscribeStates) {
      this._unsubscribeStates();
      this._unsubscribeStates = null;
    }

    for (const timer of this._switchTimers.values()) clearTimeout(timer);
    this._switchTimers.clear();
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

    if (action === "toggle-device") {
      this._toggleDevice(target.dataset.entity);
    } else if (action === "toggle-menu") {
      this._toggleHomeAssistantMenu();
    } else if (action === "toggle-theme") {
      this._toggleTheme();
    } else if (action === "open-all-off") {
      if (!this._pendingAction) {
        this._confirmOpen = true;
        this._requestRender();
      }
    } else if (action === "cancel-all-off") {
      const clickedInsideDialog = event.target.closest("[data-dialog-card]");
      if (target.classList.contains("dialog-backdrop") && clickedInsideDialog) return;
      if (!this._pendingAction) {
        this._confirmOpen = false;
        this._requestRender();
      }
    } else if (action === "confirm-all-off") {
      this._turnOffAll();
    } else if (action === "refresh-history") {
      this._loadHistory();
    }
  }

  _toggleHomeAssistantMenu() {
    // Home Assistant escucha este evento para abrir o contraer la barra lateral.
    // `composed: true` permite atravesar el Shadow DOM del panel personalizado.
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
    this._saveTheme();
    this._requestRender();
  }

  _config() {
    const raw = this._panel?.config || {};
    const sourceAreas = Array.isArray(raw.areas) && raw.areas.length
      ? raw.areas
      : DEFAULT_OFFICES_CONFIG.areas;

    const areas = sourceAreas
      .map((area, areaIndex) => {
        const devices = Array.isArray(area?.devices)
          ? area.devices
              .filter((device) => device?.entity)
              .map((device, deviceIndex) => ({
                entity: String(device.entity),
                name: device.name || `Luminaria ${deviceIndex + 1}`,
                subtitle: device.subtitle || "Iluminación",
                icon: device.icon || "bulb",
              }))
          : [];

        return {
          id: area?.id || `area-${areaIndex + 1}`,
          name: area?.name || `Área ${areaIndex + 1}`,
          subtitle: area?.subtitle || "Oficinas",
          descriptor: area?.descriptor || "Control de iluminación",
          icon: area?.icon || "office",
          featured: Boolean(area?.featured),
          environment: {
            temperature: area?.environment?.temperature || area?.temperature_sensor || area?.temperatureSensor || "",
            humidity: area?.environment?.humidity || area?.humidity_sensor || area?.humiditySensor || "",
          },
          devices,
        };
      })
      .filter((area) => area.devices.length);

    const historyHoursValue = Number(raw.history_hours ?? raw.historyHours);
    const historyHours = Number.isFinite(historyHoursValue) && historyHoursValue > 0
      ? Math.min(24, historyHoursValue)
      : DEFAULT_OFFICES_CONFIG.historyHours;

    return {
      title: raw.title || DEFAULT_OFFICES_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_OFFICES_CONFIG.subtitle,
      siteLabel: raw.site_label || raw.siteLabel || DEFAULT_OFFICES_CONFIG.siteLabel,
      logo: raw.logo || DEFAULT_OFFICES_CONFIG.logo,
      weather: raw.weather || DEFAULT_OFFICES_CONFIG.weather,
      lightCountSensor:
        raw.light_count_sensor || raw.lightCountSensor || DEFAULT_OFFICES_CONFIG.lightCountSensor,
      historyHours,
      showHistory: raw.show_history ?? raw.showHistory ?? DEFAULT_OFFICES_CONFIG.showHistory,
      areas,
    };
  }

  _allDevices(config = this._config()) {
    const map = new Map();
    for (const area of config.areas) {
      for (const device of area.devices) {
        if (!map.has(device.entity)) {
          map.set(device.entity, { ...device, areaName: area.name });
        }
      }
    }
    return [...map.values()];
  }

  _trackedEntities() {
    const config = this._config();
    const environmentEntities = config.areas.flatMap((area) => [
      area.environment?.temperature,
      area.environment?.humidity,
    ]);

    return new Set([
      ...this._allDevices(config).map((device) => device.entity),
      ...environmentEntities,
      config.weather,
      config.lightCountSensor,
    ].filter(Boolean));
  }

  _historyEntityIds() {
    return new Set(this._allDevices().map((device) => device.entity));
  }

  async _start() {
    this._clockTimer = setInterval(() => this._updateClock(), 30_000);
    this._historyTimer = setInterval(() => this._loadHistory(), 120_000);

    await Promise.allSettled([
      this._fetchCurrentStates(),
      this._subscribeStateChanges(),
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

  _state(entityId) {
    return this._liveStates.get(entityId) || this._hass?.states?.[entityId];
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
      console.error("No se pudieron sincronizar los estados de oficinas:", error);
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

          if (newState && this._historyEntityIds().has(entityId)) {
            this._appendHistoryState(entityId, newState);
            this._scheduleHistoryReload();
          }

          this._requestRender();
        },
        "state_changed",
      );
    } catch (error) {
      console.error("No se pudo suscribir a state_changed:", error);
    }
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
      stateObject.last_changed || stateObject.last_updated || new Date().toISOString();
    const last = group[group.length - 1];
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

  async _loadHistory() {
    const config = this._config();
    const devices = this._allDevices(config);
    if (!this._hass?.callApi || !config.showHistory || !devices.length) return;

    const missingEntities = devices
      .map((device) => device.entity)
      .filter((entityId) => !this._hass.states?.[entityId]);

    if (missingEntities.length) {
      this._history = [];
      this._historyError =
        `Home Assistant no reconoce: ${missingEntities.join(", ")}. ` +
        "Revisa los entity_id en Herramientas de desarrollador > Estados.";
      this._requestRender();
      return;
    }

    const endDate = new Date();
    const startDate = new Date(
      endDate.getTime() - config.historyHours * 60 * 60 * 1000,
    );
    const entityIds = devices.map((device) => device.entity).join(",");
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
        "No se pudo cargar el historial. Revisa Recorder, History y la consola del navegador.";
      console.error("No se pudo cargar el historial de oficinas:", {
        error,
        path,
        entities: devices.map((device) => device.entity),
      });
    }

    this._requestRender();
  }

  async _toggleDevice(entityId) {
    if (!entityId || !this._hass || this._pendingAction) return;

    const stateObject = this._state(entityId);
    if (!stateObject || ["unknown", "unavailable"].includes(stateObject.state)) {
      this._switchErrors.set(entityId, "No disponible");
      this._requestRender();
      return;
    }

    const pending = this._pendingSwitches.get(entityId);
    const visibleState = pending?.desired || stateObject.state;
    const desired = visibleState === "on" ? "off" : "on";
    const service = desired === "on" ? "turn_on" : "turn_off";
    const domain = entityId.split(".", 1)[0];

    this._pendingSwitches.set(entityId, { desired, startedAt: Date.now() });
    this._switchErrors.delete(entityId);
    this._requestRender();

    try {
      await this._hass.callService(domain, service, { entity_id: entityId });
      const previousTimer = this._switchTimers.get(entityId);
      if (previousTimer) clearTimeout(previousTimer);
      const timer = setTimeout(() => this._verifyDeviceState(entityId, desired), 6000);
      this._switchTimers.set(entityId, timer);
    } catch (error) {
      this._pendingSwitches.delete(entityId);
      this._switchErrors.set(entityId, "La acción falló");
      this._requestRender();
      console.error(`Error ejecutando ${service} en ${entityId}:`, error);
    }
  }

  async _verifyDeviceState(entityId, desired) {
    await this._fetchCurrentStates();
    const confirmed = this._state(entityId)?.state === desired;
    this._pendingSwitches.delete(entityId);
    this._switchTimers.delete(entityId);

    if (confirmed) {
      this._switchErrors.delete(entityId);
    } else {
      this._switchErrors.set(entityId, "Sin confirmación");
    }
    this._requestRender();
  }

  async _turnOffAll() {
    if (this._pendingAction || !this._hass) return;

    const devices = this._allDevices();
    const available = devices.filter((device) => {
      const state = this._state(device.entity)?.state;
      return state && !["unknown", "unavailable"].includes(state);
    });
    const unavailable = devices.filter((device) => !available.includes(device));

    this._pendingAction = "all-off";
    for (const device of available) {
      this._pendingSwitches.set(device.entity, { desired: "off", startedAt: Date.now() });
      this._switchErrors.delete(device.entity);
    }
    this._requestRender();

    try {
      const active = available.filter((device) => this._state(device.entity)?.state !== "off");
      if (active.length) {
        await this._callServiceByDomain(active.map((device) => device.entity), "turn_off");
        await this._delay(900);
        await this._fetchCurrentStates();

        const remaining = active.filter((device) => this._state(device.entity)?.state !== "off");
        if (remaining.length) {
          await this._callServiceByDomain(remaining.map((device) => device.entity), "turn_off");
          await this._delay(1400);
          await this._fetchCurrentStates();
        }
      }

      const notOff = available.filter((device) => this._state(device.entity)?.state !== "off");
      for (const device of available) this._pendingSwitches.delete(device.entity);

      if (!notOff.length && !unavailable.length) {
        this._showToast("Todas las oficinas quedaron apagadas.", "success");
        this._confirmOpen = false;
      } else if (!notOff.length) {
        this._showToast(
          `Se apagaron las luces disponibles. ${unavailable.length} circuito${unavailable.length === 1 ? "" : "s"} no estaba${unavailable.length === 1 ? "" : "n"} disponible${unavailable.length === 1 ? "" : "s"}.`,
          "warning",
        );
        this._confirmOpen = false;
      } else {
        for (const device of notOff) {
          this._switchErrors.set(device.entity, "No respondió");
        }
        this._showToast(
          `${notOff.length} circuito${notOff.length === 1 ? "" : "s"} no confirmó el apagado.`,
          "error",
        );
      }
    } catch (error) {
      for (const device of available) this._pendingSwitches.delete(device.entity);
      this._showToast("No se pudo completar el apagado general.", "error");
      console.error("Error en el apagado general de oficinas:", error);
    } finally {
      this._pendingAction = "";
      this._requestRender();
      this._scheduleHistoryReload();
    }
  }

  async _callServiceByDomain(entityIds, service) {
    const groups = new Map();
    for (const entityId of entityIds) {
      const domain = entityId.split(".", 1)[0];
      if (!groups.has(domain)) groups.set(domain, []);
      groups.get(domain).push(entityId);
    }

    const results = await Promise.allSettled(
      [...groups.entries()].map(([domain, ids]) =>
        this._hass.callService(domain, service, { entity_id: ids }),
      ),
    );
    const rejected = results.find((result) => result.status === "rejected");
    if (rejected) throw rejected.reason;
  }

  _delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  _showToast(message, type = "success") {
    clearTimeout(this._toastTimer);
    this._toast = { message, type };
    this._requestRender();
    this._toastTimer = setTimeout(() => {
      this._toast = null;
      this._requestRender();
    }, 5200);
  }

  _updateClock() {
    const clock = this.shadowRoot?.querySelector("[data-clock]");
    const period = this.shadowRoot?.querySelector("[data-clock-period]");
    if (!clock || !period) return;

    const parts = new Intl.DateTimeFormat("es-BO", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(new Date());

    const hour = parts.find((part) => part.type === "hour")?.value || "—";
    const minute = parts.find((part) => part.type === "minute")?.value || "00";
    const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value || "";
    clock.textContent = `${hour}:${minute}`;
    period.textContent = dayPeriod.toUpperCase();
  }

  _icon(name, className = "") {
    const path = ICON_PATHS[name] || ICON_PATHS.bulb;
    return `<svg class="${this._escape(className)}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  }

  _friendlyName(entityId, fallback) {
    return this._state(entityId)?.attributes?.friendly_name || fallback;
  }

  _deviceStatus(device) {
    const stateObject = this._state(device.entity);
    const pending = this._pendingSwitches.get(device.entity);
    const error = this._switchErrors.get(device.entity);
    const realState = stateObject?.state || "unavailable";
    const visibleState = pending?.desired || realState;
    const unavailable = !stateObject || ["unknown", "unavailable"].includes(realState);

    return {
      stateObject,
      pending,
      error,
      realState,
      visibleState,
      isOn: visibleState === "on",
      unavailable,
      label:
        error ||
        (pending
          ? pending.desired === "on"
            ? "Encendiendo…"
            : "Apagando…"
          : unavailable
            ? "No disponible"
            : realState === "on"
              ? "Encendido"
              : "Apagado"),
    };
  }

  _renderDevice(device) {
    const status = this._deviceStatus(device);
    return `
      <button
        class="device-card ${status.isOn ? "is-on" : ""} ${status.pending ? "is-pending" : ""} ${status.error ? "is-error" : ""} ${status.unavailable ? "is-unavailable" : ""}"
        data-action="toggle-device"
        data-entity="${this._escape(device.entity)}"
        aria-label="Cambiar ${this._escape(device.name)}"
        aria-pressed="${status.isOn}"
        ${status.unavailable || this._pendingAction ? "disabled" : ""}
      >
        <span class="device-icon">${this._icon(device.icon)}</span>
        <span class="device-copy">
          <strong>${this._escape(device.name)}</strong>
          <small>${this._escape(status.label)}</small>
        </span>
        <span class="switch-control" aria-hidden="true"><span></span></span>
      </button>
    `;
  }

  _areaStats(area) {
    const states = area.devices.map((device) => this._state(device.entity)?.state);
    return {
      active: states.filter((state) => state === "on").length,
      unavailable: states.filter((state) => !state || ["unknown", "unavailable"].includes(state)).length,
      total: area.devices.length,
    };
  }

  _formatEnvironmentValue(entityId, fallbackUnit = "") {
    const stateObject = entityId ? this._state(entityId) : null;
    const raw = stateObject?.state;
    if (!stateObject || raw == null || ["unknown", "unavailable", "none"].includes(String(raw).toLowerCase())) {
      return "—";
    }

    const numeric = Number(raw);
    const unit = stateObject.attributes?.unit_of_measurement || fallbackUnit;
    if (Number.isFinite(numeric)) {
      return `${numeric.toFixed(1)}${unit}`;
    }

    return `${raw}${unit}`;
  }

  _renderAreaEnvironment(area) {
    const temperatureEntity = area.environment?.temperature;
    const humidityEntity = area.environment?.humidity;
    if (!temperatureEntity) return "";

    const temperatureValue = this._formatEnvironmentValue(temperatureEntity, "°C");
    const humidityValue = humidityEntity ? this._formatEnvironmentValue(humidityEntity, "%") : "";
    const titleText = humidityValue ? `Temperatura ${temperatureValue} · Humedad ${humidityValue}` : `Temperatura ${temperatureValue}`;

    return `
      <div class="area-environment" aria-label="Ambiente actual de ${this._escape(area.name)}">
        <span class="environment-chip" title="${this._escape(titleText)}">
          <span class="environment-symbol" aria-hidden="true">☀</span>
          <span class="environment-copy">
            <small>Temp</small>
            <strong>${this._escape(temperatureValue)}</strong>
          </span>
        </span>
      </div>
    `;
  }

  _renderArea(area) {
    return `
      <article class="surface area-card ${area.featured ? "is-featured" : ""}">
        <div class="area-heading ${area.environment?.temperature ? "has-environment" : ""}">
          <div class="area-heading-main">
            <span class="area-icon">${this._icon(area.icon)}</span>
            <h2>${this._escape(area.name)}</h2>
          </div>
          ${this._renderAreaEnvironment(area)}
        </div>
        <div class="area-devices ${area.devices.length === 1 ? "single" : ""}">
          ${area.devices.map((device) => this._renderDevice(device)).join("")}
        </div>
      </article>
    `;
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

  _renderHistory(config) {
    if (!config.showHistory) return "";

    const devices = this._allDevices(config);
    const endTime = Date.now();
    const startTime = endTime - config.historyHours * 60 * 60 * 1000;
    const groupMap = new Map();

    for (const group of this._history || []) {
      const entityId = group?.[0]?.entity_id;
      if (entityId) groupMap.set(entityId, group);
    }

    const rows = devices.map((device) => {
      const group = groupMap.get(device.entity) || [];
      const segments = this._historySegments(group, startTime, endTime);
      const state = this._state(device.entity)?.state;
      const stateLabel = state === "on" ? "Encendido" : state === "off" ? "Apagado" : state || "Sin datos";

      return `
        <div class="history-row">
          <div class="history-label">
            <strong>${this._escape(device.name)}</strong>
            <small>${this._escape(stateLabel)}</small>
          </div>
          <div class="timeline">
            ${segments.length
              ? segments.map((segment) => `
                  <span
                    class="timeline-segment ${segment.state === "on" ? "on" : "off"}"
                    style="left:${segment.left}%;width:${segment.width}%"
                  ></span>
                `).join("")
              : '<span class="timeline-empty">Sin historial</span>'}
          </div>
        </div>
      `;
    }).join("");

    return `
      <article class="surface history-card">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Últimas ${this._escape(config.historyHours)} h</span>
            <h2>Actividad de iluminación</h2>
          </div>
          <button class="icon-button" data-action="refresh-history" aria-label="Actualizar historial" title="Actualizar historial">
            ${this._icon("refresh")}
          </button>
        </div>
        ${this._historyError
          ? `<p class="error">${this._escape(this._historyError)}</p>`
          : `
            <div class="history-scale">
              <span>−${this._escape(config.historyHours)} h</span>
              <span>−${this._escape(Math.max(1, Math.round(config.historyHours / 2)))} h</span>
              <span>Ahora</span>
            </div>
            <div class="history-list">${rows}</div>
          `}
      </article>
    `;
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
    const devices = this._allDevices(config);
    const featuredAreas = config.areas.filter((area) => area.featured);
    const standardAreas = config.areas.filter((area) => !area.featured && area.id !== "taller");
    const supportArea = config.areas.find((area) => !area.featured && area.id === "taller") || null;
    const activeCount = devices.filter((device) => this._state(device.entity)?.state === "on").length;
    const allOff = activeCount === 0;
    const nextTheme = this._theme === "dark" ? "claro" : "oscuro";
    const weather = this._state(config.weather);
    const weatherAttributes = weather?.attributes || {};
    const weatherCondition = weather?.state || "";
    const weatherLabel = CONDITION_LABELS[weatherCondition] || weatherCondition || "Sin datos";
    const weatherIcon = CONDITION_ICONS[weatherCondition] || "·";
    const weatherTemperature = weatherAttributes.temperature ?? "—";
    const weatherTemperatureUnit = weatherAttributes.temperature_unit || "°";

    const clockParts = new Intl.DateTimeFormat("es-BO", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(new Date());
    const clock = `${clockParts.find((part) => part.type === "hour")?.value || "—"}:${clockParts.find((part) => part.type === "minute")?.value || "00"}`;
    const clockPeriod = (clockParts.find((part) => part.type === "dayPeriod")?.value || "").toUpperCase();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #f26522;
          --primary-hover: #d95a1e;
          --primary-soft: rgba(242, 101, 34, 0.1);
          --primary-medium: rgba(242, 101, 34, 0.2);
          --primary-border: rgba(242, 101, 34, 0.34);
          --primary-glow: rgba(242, 101, 34, 0.2);
          --background: #061c2b;
          --surface: rgba(255, 255, 255, 0.035);
          --surface-hover: rgba(255, 255, 255, 0.055);
          --surface-active: rgba(242, 101, 34, 0.1);
          --surface-subtle: rgba(255, 255, 255, 0.025);
          --surface-muted: rgba(255, 255, 255, 0.035);
          --surface-control: rgba(255, 255, 255, 0.055);
          --surface-track: rgba(255, 255, 255, 0.022);
          --text-primary: rgba(255, 255, 255, 0.92);
          --text-secondary: rgba(255, 255, 255, 0.7);
          --text-tertiary: rgba(255, 255, 255, 0.48);
          --text-disabled: rgba(255, 255, 255, 0.28);
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
          --card-shadow: rgba(0, 0, 0, 0.13);
          --modal-shadow: rgba(0, 0, 0, 0.42);
          --toast-shadow: rgba(0, 0, 0, 0.32);
          --inset-highlight: rgba(255, 255, 255, 0.025);
          --success: #22c55e;
          --warning: #f59e0b;
          --error: #ef4444;
          --info: #38bdf8;
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 22px;
          --radius-pill: 999px;
          --motion-fast: 180ms;
          --motion-base: 350ms;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
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
          --surface-muted: rgba(6, 28, 43, 0.045);
          --surface-control: rgba(6, 28, 43, 0.07);
          --surface-track: rgba(6, 28, 43, 0.035);
          --text-primary: rgba(6, 28, 43, 0.94);
          --text-secondary: rgba(6, 28, 43, 0.7);
          --text-tertiary: rgba(6, 28, 43, 0.5);
          --text-disabled: rgba(6, 28, 43, 0.3);
          --icon-muted: rgba(6, 28, 43, 0.56);
          --switch-knob: rgba(255, 255, 255, 0.96);
          --timeline-off: rgba(6, 28, 43, 0.13);
          --grid-line: rgba(6, 28, 43, 0.09);
          --border-subtle: rgba(6, 28, 43, 0.08);
          --border-default: rgba(6, 28, 43, 0.12);
          --border-emphasis: rgba(6, 28, 43, 0.18);
          --header-background: rgba(255, 255, 255, 0.88);
          --modal-overlay: rgba(6, 28, 43, 0.38);
          --modal-surface: #ffffff;
          --card-shadow: rgba(6, 28, 43, 0.11);
          --modal-shadow: rgba(6, 28, 43, 0.24);
          --toast-shadow: rgba(6, 28, 43, 0.2);
          --inset-highlight: rgba(255, 255, 255, 0.72);
          color-scheme: light;
          background:
            radial-gradient(circle at 88% 7%, rgba(242, 101, 34, 0.11), transparent 27%),
            radial-gradient(circle at 4% 88%, rgba(11, 43, 64, 0.09), transparent 36%),
            var(--background);
        }

        * { box-sizing: border-box; }
        button { color: inherit; font: inherit; }
        button:focus-visible { outline: 3px solid rgba(56, 189, 248, 0.72); outline-offset: 2px; }

        .panel-shell { min-height: 100%; container: offices-panel / inline-size; }
        .dashboard { width: min(1180px, 100%); margin: 0 auto; padding: clamp(12px, 2vw, 20px); }
        .surface {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          background: var(--surface);
          box-shadow: 0 12px 30px var(--card-shadow), inset 0 1px 0 var(--inset-highlight);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .app-shell { min-height: 100vh; container: offices-panel / inline-size; }
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
          transition: background var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease);
        }
        .brand-logo, .logo-frame img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          filter: brightness(0) invert(1);
          mix-blend-mode: screen;
          transition: filter var(--motion-fast) var(--ease);
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
        .topbar-meta { display: flex; align-items: center; justify-content: flex-end; margin-left: auto; }
        .menu-button,
        .menu-toggle,
        .theme-button,
        .theme-toggle {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-default);
          border-radius: 50%;
          background: var(--surface-subtle);
          cursor: pointer;
          transition: transform var(--motion-fast) var(--ease), color var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease), background var(--motion-fast) var(--ease);
        }
        .menu-button:hover,
        .menu-toggle:hover,
        .theme-button:hover,
        .theme-toggle:hover { background: var(--surface-hover); border-color: var(--primary-border, var(--primary)); }
        .menu-toggle .menu-icon,
        .menu-button .menu-icon,
        .theme-toggle .theme-icon,
        .theme-button .theme-icon { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .menu-toggle .menu-icon,
        .menu-button .menu-icon { width: 22px; height: 22px; stroke-width: 2; }
        .theme-icon-sun, .theme-icon-moon { transform-origin: 12px 12px; transition: opacity var(--motion-fast) var(--ease), transform var(--motion-base) var(--ease); }
        .theme-icon-sun { opacity: 0; transform: rotate(-35deg) scale(0.55); }
        .theme-icon-moon { opacity: 1; transform: rotate(0deg) scale(1); }
        :host([data-theme="light"]) .theme-icon-sun { opacity: 1; transform: rotate(0deg) scale(1); }
        :host([data-theme="light"]) .theme-icon-moon { opacity: 0; transform: rotate(35deg) scale(0.55); }

        .hero-card {
          min-height: 112px;
          margin-top: 12px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 22px;
          background:
            radial-gradient(circle at 92% 16%, rgba(242, 101, 34, 0.1), transparent 34%),
            var(--surface);
        }
        .hero-copy { min-width: 0; }
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
          border-left: 1px solid var(--border-default);
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
        .hero-weather-copy strong, .hero-weather-copy small { display: block; white-space: nowrap; }
        .hero-weather-copy strong { font-family: Outfit, Inter, Arial, sans-serif; font-size: 17px; font-weight: 800; line-height: 1.05; }
        .hero-weather-copy small { margin-bottom: 3px; color: var(--text-secondary); font-size: 9px; font-weight: 700; }
        .eyebrow {
          width: fit-content;
          min-height: 24px;
          margin: 0 0 8px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(242, 101, 34, 0.19);
          border-radius: var(--radius-pill);
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .hero-card h1 { margin: 0; font-family: Outfit, Inter, Arial, sans-serif; font-size: clamp(28px, 3vw, 38px); font-weight: 800; line-height: 1.04; letter-spacing: -0.035em; }
        .hero-card h1 span { color: var(--primary); }

        .section-block { margin-top: 14px; }
        .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; padding: 0 2px; }
        .section-heading h2 { margin: 0; font-family: Outfit, Inter, Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
        .featured-grid, .standard-grid { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }

        .area-card { padding: 14px; }
        .area-card.is-featured {
          border-color: rgba(242, 101, 34, 0.18);
          background:
            radial-gradient(circle at 92% 8%, rgba(242, 101, 34, 0.09), transparent 34%),
            var(--surface);
        }
        .area-heading {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .area-heading-main {
          min-width: 0;
          flex: 1 1 auto;
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          align-items: center;
          gap: 10px;
        }
        .area-icon { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid var(--border-default); border-radius: 13px; background: var(--surface-muted); }
        .area-icon svg { width: 20px; fill: var(--icon-muted); }
        .is-featured .area-icon { border-color: rgba(242, 101, 34, 0.25); background: var(--primary-soft); }
        .is-featured .area-icon svg { fill: var(--primary); }
        .area-heading h2 { min-width: 0; margin: 0; overflow: hidden; font-family: Outfit, Inter, Arial, sans-serif; font-size: 16px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
        .area-environment { flex: 0 0 auto; display: flex; justify-content: flex-end; }
        .environment-chip {
          min-width: 96px;
          padding: 5px 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-pill);
          background: var(--surface-subtle);
          box-shadow: inset 0 1px 0 var(--inset-highlight);
        }
        .environment-symbol {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 13px;
          line-height: 1;
        }
        .environment-copy { display: grid; gap: 2px; }
        .environment-copy small, .environment-copy strong { display: block; line-height: 1; white-space: nowrap; }
        .environment-copy small { color: var(--text-secondary); font-size: 8px; font-weight: 800; }
        .environment-copy strong { color: var(--text-primary); font-family: Outfit, Inter, Arial, sans-serif; font-size: 14px; font-weight: 800; }
        .area-devices { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px; margin-top: 12px; }
        .area-devices.single { grid-template-columns: 1fr; }

        .device-card {
          position: relative;
          min-width: 0;
          min-height: 72px;
          padding: 10px;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) 36px;
          align-items: center;
          gap: 9px;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          background: var(--surface-muted);
          text-align: left;
          cursor: pointer;
          transition: transform var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease), background var(--motion-fast) var(--ease), box-shadow var(--motion-fast) var(--ease);
        }
        .device-card.is-on { border-color: rgba(242, 101, 34, 0.36); background: var(--surface-active); box-shadow: 0 0 18px rgba(242, 101, 34, 0.05); }
        .device-card.is-error { border-color: rgba(239, 68, 68, 0.5); }
        .device-card.is-error small { color: var(--error); }
        .device-card.is-unavailable { cursor: not-allowed; opacity: 0.52; }
        .device-card.is-pending { cursor: progress; }
        .device-card.is-pending::after { content: ""; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 28%, rgba(242, 101, 34, 0.08) 48%, transparent 68%); transform: translateX(-100%); animation: pending-sweep 1.1s linear infinite; pointer-events: none; }
        .device-icon { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid var(--border-default); border-radius: 11px; background: var(--surface-muted); }
        .device-icon svg { width: 18px; fill: var(--icon-muted); }
        .is-on .device-icon { border-color: rgba(242, 101, 34, 0.25); background: var(--primary-soft); }
        .is-on .device-icon svg { fill: var(--primary); }
        .device-copy { min-width: 0; }
        .device-copy strong, .device-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .device-copy strong { font-family: Outfit, Inter, Arial, sans-serif; font-size: 12px; font-weight: 800; }
        .device-copy small { margin-top: 3px; color: var(--text-secondary); font-size: 9px; font-weight: 700; }
        .is-on .device-copy small { color: var(--primary); }
        .switch-control { width: 36px; height: 21px; padding: 2px; border: 1px solid var(--border-default); border-radius: var(--radius-pill); background: var(--surface-control); }
        .switch-control span { display: block; width: 15px; height: 15px; border-radius: 50%; background: var(--switch-knob); transition: transform var(--motion-base) var(--ease), background var(--motion-fast) var(--ease); }
        .is-on .switch-control { border-color: rgba(242, 101, 34, 0.38); background: var(--primary-medium); }
        .is-on .switch-control span { transform: translateX(15px); background: var(--primary); }

        .aux-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .aux-grid > * { min-width: 0; }
        .shutdown-card { margin-top: 0; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; }
        .shutdown-copy h2 { margin: 0; font-family: Outfit, Inter, Arial, sans-serif; font-size: 19px; font-weight: 800; }
        .shutdown-actions { display: grid; grid-template-columns: 1fr; gap: 8px; }
        .shutdown-button, .primary-button, .secondary-button {
          min-height: 48px;
          font-weight: 800;
          cursor: pointer;
          transition: transform var(--motion-fast) var(--ease), background var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease), box-shadow var(--motion-fast) var(--ease);
        }
        .shutdown-button {
          width: 100%;
          min-height: 72px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid var(--border-default);
          border-radius: 14px;
          background: var(--surface-control);
          color: var(--text-primary);
        }
        .shutdown-button > span { width: 31px; height: 31px; display: grid; place-items: center; border-radius: 10px; color: var(--error); background: rgba(239, 68, 68, 0.09); }
        .shutdown-button svg { width: 18px; fill: currentColor; }
        .shutdown-button strong { font-size: 10px; }
        .shutdown-button[disabled] { cursor: not-allowed; opacity: 0.48; }
        .primary-button { border: 0; border-radius: var(--radius-pill); background: var(--primary); color: #fff; box-shadow: 0 6px 18px var(--primary-glow); }
        .secondary-button { border: 1px solid var(--border-emphasis); border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--text-primary); }

        .history-card { min-height: 255px; margin-top: 12px; padding: 16px; }
        .history-card .section-heading { margin-bottom: 0; }
        .icon-button { width: 40px; height: 40px; padding: 0; display: grid; place-items: center; border: 1px solid var(--border-default); border-radius: 12px; background: var(--surface-muted); cursor: pointer; }
        .icon-button svg { width: 18px; fill: var(--text-secondary); }
        .history-scale { display: flex; justify-content: space-between; padding-left: 132px; margin: 15px 0 7px; color: var(--text-tertiary); font-size: 8px; font-weight: 700; }
        .history-list { display: grid; gap: 7px; }
        .history-row { display: grid; grid-template-columns: 120px minmax(0, 1fr); align-items: center; gap: 11px; }
        .history-label { min-width: 0; }
        .history-label strong, .history-label small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .history-label strong { font-family: Outfit, Inter, Arial, sans-serif; font-size: 10px; font-weight: 800; }
        .history-label small { margin-top: 2px; color: var(--text-tertiary); font-size: 7px; font-weight: 700; text-transform: uppercase; }
        .timeline { position: relative; height: 20px; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 7px; background: linear-gradient(90deg, transparent 49.7%, var(--grid-line) 50%, transparent 50.3%), var(--surface-track); }
        .timeline-segment { position: absolute; top: 3px; bottom: 3px; min-width: 2px; border-radius: 4px; }
        .timeline-segment.on { background: var(--primary); box-shadow: 0 0 10px rgba(242, 101, 34, 0.2); }
        .timeline-segment.off { background: var(--timeline-off); }
        .timeline-empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--text-tertiary); font-size: 8px; }
        .error { color: var(--error); font-size: 11px; line-height: 1.5; }

        .dialog-backdrop { position: fixed; z-index: 1000; inset: 0; padding: 18px; display: grid; place-items: center; background: var(--modal-overlay); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); animation: fade-in var(--motion-fast) var(--ease); }
        .dialog-card { width: min(500px, 100%); padding: 22px; border: 1px solid var(--primary-border); border-radius: var(--radius-lg); background: var(--modal-surface); box-shadow: 0 28px 80px var(--modal-shadow); animation: dialog-in var(--motion-base) var(--ease); }
        .dialog-icon { width: 48px; height: 48px; display: grid; place-items: center; border: 1px solid var(--primary-border); border-radius: 14px; background: var(--primary-soft); color: var(--primary); }
        .dialog-icon svg { width: 23px; fill: currentColor; }
        .dialog-card h2 { margin: 15px 0 0; font-family: Outfit, Inter, Arial, sans-serif; font-size: 24px; font-weight: 800; }
        .dialog-card p { margin: 9px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.55; }
        .dialog-note { margin-top: 12px; padding: 10px 12px; border: 1px solid rgba(245, 158, 11, 0.22); border-radius: 12px; background: rgba(245, 158, 11, 0.07); color: var(--text-secondary); font-size: 11px; line-height: 1.45; }
        .dialog-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 20px; }
        .dialog-actions button { padding: 0 16px; }
        .primary-button[disabled], .secondary-button[disabled] { cursor: progress; opacity: 0.62; }

        .toast { position: fixed; z-index: 1100; right: 18px; bottom: 18px; max-width: min(390px, calc(100vw - 28px)); min-height: 48px; padding: 11px 14px; display: flex; align-items: center; gap: 9px; border: 1px solid var(--border-emphasis); border-radius: 14px; background: var(--modal-surface); box-shadow: 0 18px 46px var(--toast-shadow); font-size: 12px; font-weight: 700; animation: toast-in var(--motion-base) var(--ease); }
        .toast.success { border-color: rgba(34, 197, 94, 0.38); }
        .toast.success::before { content: "✓"; color: var(--success); }
        .toast.warning { border-color: rgba(245, 158, 11, 0.4); }
        .toast.warning::before { content: "!"; color: var(--warning); }
        .toast.error { border-color: rgba(239, 68, 68, 0.45); }
        .toast.error::before { content: "!"; color: var(--error); }

        @media (hover: hover) {
          .device-card:not(:disabled):hover, .menu-toggle:hover, .theme-toggle:hover, .icon-button:hover { border-color: rgba(242, 101, 34, 0.28); background: var(--surface-hover); }
          .shutdown-button:not(:disabled):hover { border-color: rgba(239, 68, 68, 0.28); background: var(--surface-hover); }
          .primary-button:not(:disabled):hover { background: var(--primary-hover); }
          .secondary-button:not(:disabled):hover { border-color: rgba(242, 101, 34, 0.3); }
        }
        button:active { transform: scale(0.97); }

        @container offices-panel (max-width: 768px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr !important; gap: 12px; }
          .hero-copy { border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 2px; }
          .hero-card h1 { font-size: clamp(22px, 5.5vw, 30px); }
          .hero-status { justify-content: space-between; width: 100%; align-items: center; flex-direction: row; gap: 12px; }
          .hero-clock strong { font-size: 26px; }
          .hero-weather { border-left: 0; padding-left: 0; border-top: 0 !important; }
          .featured-grid, .standard-grid, .aux-grid { grid-template-columns: 1fr !important; }
          .standard-grid .area-card:last-child:nth-child(odd) { grid-column: auto; }
          .area-heading { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
          .area-heading-main { grid-template-columns: 42px minmax(0, 1fr); }
          .environment-chip { min-width: 0; }
          .area-devices { grid-template-columns: 1fr; }
          .history-scale { padding-left: 0; }
          .history-row { grid-template-columns: 1fr; gap: 5px; }
          .history-label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
          .history-label small { margin: 0; }
        }

        @media (max-width: 768px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr !important; gap: 12px; }
          .hero-copy { border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 2px; }
          .hero-card h1 { font-size: clamp(22px, 5.5vw, 30px); }
          .hero-status { justify-content: space-between; width: 100%; align-items: center; flex-direction: row; gap: 12px; }
          .hero-clock strong { font-size: 26px; }
          .hero-weather { border-left: 0; padding-left: 0; border-top: 0 !important; }
          .featured-grid, .standard-grid, .aux-grid { grid-template-columns: 1fr !important; }
          .standard-grid .area-card:last-child:nth-child(odd) { grid-column: auto; }
          .area-heading { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
          .area-heading-main { grid-template-columns: 42px minmax(0, 1fr); }
          .environment-chip { min-width: 0; }
          .area-devices { grid-template-columns: 1fr; }
          .history-scale { padding-left: 0; }
          .history-row { grid-template-columns: 1fr; gap: 5px; }
          .history-label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
          .history-label small { margin: 0; }
        }

        @container offices-panel (max-width: 520px) {
          .logo-frame { width: 92px; height: 38px; }
          .dialog-actions { grid-template-columns: 1fr; }
          .area-heading { flex-direction: column; align-items: flex-start; gap: 6px; }
          .area-environment { width: 100%; justify-content: flex-start; padding-left: 52px; }
        }

        @media (max-width: 520px) {
          .logo-frame { width: 92px; height: 38px; }
          .dialog-actions { grid-template-columns: 1fr; }
          .area-heading { flex-direction: column; align-items: flex-start; gap: 6px; }
          .area-environment { width: 100%; justify-content: flex-start; padding-left: 52px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }

        @keyframes pending-sweep { to { transform: translateX(100%); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dialog-in { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes toast-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      

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
              <div class="logo-frame"><img class="brand-logo" src="${this._escape(config.logo)}" alt="Witmind"></div>
            </div>
          </div>
          <div class="topbar-meta">
            <button
              class="theme-button"
              data-action="toggle-theme"
              aria-label="Cambiar a tema ${nextTheme}"
              title="Cambiar a tema ${nextTheme}"
              aria-pressed="${this._theme === "light"}"
            >${THEME_ICON}</button>
          </div>
        </header>

        <main class="dashboard">
          <section class="surface hero-card">
            <div class="hero-copy">
              <h1>${this._escape(config.title)} <span>Witmind</span></h1>
            </div>
            <div class="hero-status">
              <time class="hero-clock" data-current-time>
                <strong data-clock>${this._escape(clock)}</strong>
                <span data-clock-period>${this._escape(clockPeriod)}</span>
              </time>
              <div class="hero-weather" aria-label="Clima actual: ${this._escape(weatherLabel)}, ${this._escape(weatherTemperature)} ${this._escape(weatherTemperatureUnit)}">
                <span class="hero-weather-symbol" aria-hidden="true">${this._escape(weatherIcon)}</span>
                <span class="hero-weather-copy">
                  <small>${this._escape(weatherLabel)}</small>
                  <strong>${this._escape(weatherTemperature)}${this._escape(weatherTemperatureUnit)}</strong>
                </span>
              </div>
            </div>
          </section>

          ${featuredAreas.length ? `
            <section class="section-block">
              <div class="section-heading">
                <div>
                  <span class="eyebrow">Áreas estratégicas</span>
                  <h2>Gerencia y áreas vinculadas</h2>
                </div>
              </div>
              <div class="featured-grid">${featuredAreas.map((area) => this._renderArea(area)).join("")}</div>
            </section>
          ` : ""}

          ${standardAreas.length ? `
            <section class="section-block">
              <div class="section-heading">
                <div>
                  <span class="eyebrow">Iluminación</span>
                  <h2>Oficinas y circulación</h2>
                </div>
              </div>
              <div class="standard-grid">${standardAreas.map((area) => this._renderArea(area)).join("")}</div>
            </section>
          ` : ""}

          <section class="aux-grid">
            ${supportArea ? this._renderArea(supportArea) : ""}
            <section class="surface shutdown-card">
              <div class="shutdown-copy">
                <span class="eyebrow">Acciones rápidas</span>
                <h2>Control general</h2>
              </div>
              <div class="shutdown-actions">
                <button
                  class="shutdown-button"
                  data-action="open-all-off"
                  ${allOff || this._pendingAction ? "disabled" : ""}
                  aria-label="Apagar todas las oficinas"
                >
                  <span>${this._icon("power")}</span>
                  <strong>${this._pendingAction === "all-off" ? "Apagando…" : allOff ? "Todo apagado" : "Apagar todas las oficinas"}</strong>
                </button>
              </div>
            </section>
          </section>

          ${this._renderHistory(config)}
        </main>

        ${this._confirmOpen ? `
          <div class="dialog-backdrop" data-action="cancel-all-off">
            <section class="dialog-card" data-dialog-card role="dialog" aria-modal="true" aria-labelledby="offices-dialog-title">
              <div class="dialog-icon">${this._icon("power")}</div>
              <span class="eyebrow">Acción sensible</span>
              <h2 id="offices-dialog-title">¿Apagar todas las oficinas?</h2>
              <p>Se apagarán las luces de Gerencia Witronix, Mindtec, Oficina General, Pasillos y Taller.</p>
              <div class="dialog-note">Antes de continuar, verifica que no haya personas trabajando en las áreas que quedarán sin iluminación.</div>
              <div class="dialog-actions">
                <button class="secondary-button" data-action="cancel-all-off" ${this._pendingAction ? "disabled" : ""}>Cancelar</button>
                <button class="primary-button" data-action="confirm-all-off" ${this._pendingAction ? "disabled" : ""}>${this._pendingAction ? "Apagando…" : "Sí, apagar"}</button>
              </div>
            </section>
          </div>
        ` : ""}

        ${this._toast ? `<div class="toast ${this._escape(this._toast.type)}" role="status">${this._escape(this._toast.message)}</div>` : ""}
      </div>
    `;
  }
}

if (!customElements.get("oficinas-panel")) {
  customElements.define("oficinas-panel", OficinasPanel);
}
