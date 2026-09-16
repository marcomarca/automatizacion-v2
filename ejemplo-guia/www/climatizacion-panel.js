// Witmind Climatizacion Panel v1.6.13 — HVAC independiente de telemetría MASTER POWER
// Control unificado de múltiples entidades climate como un único sistema visible.

const DEFAULT_CLIMATE_CONFIG = Object.freeze({
  title: "Climatización",
  subtitle: "Oficinas Witronix",
  logo: "/local/logo-witmind.png?v=2.0.0",
  entities: [
    "climate.aire_acondicionado_iris",
    "climate.aire_acondicionado_midea",
  ],
  minTemp: 16,
  maxTemp: 30,
  tempStep: 1,
  defaultOnMode: "cool",
  referenceTemperatureSensor: "sensor.climatizacion_temperatura_referencia",
  referenceTemperatureLabel: "Temperatura oficina",
  masterRelay: "switch.smart_relay_switch_interruptor",
  energySensor: "sensor.smart_relay_switch_energia_total",
  temperatureHistorySensor: "sensor.t_h_sensor_2_temperature",
  automationHelpers: Object.freeze({
    configInitialized: "input_boolean.climatizacion_config_inicializada",
    morningEnabled: "input_boolean.climatizacion_manana_activa",
    afternoonEnabled: "input_boolean.climatizacion_tarde_activa",
    morningStart: "input_datetime.climatizacion_manana_inicio",
    morningEnd: "input_datetime.climatizacion_manana_fin",
    afternoonStart: "input_datetime.climatizacion_tarde_inicio",
    afternoonEnd: "input_datetime.climatizacion_tarde_fin",
    morningOffTemp: "input_number.climatizacion_manana_apagar_en",
    morningOnTemp: "input_number.climatizacion_manana_encender_en",
    morningTargetTemp: "input_number.climatizacion_manana_temperatura_objetivo",
    afternoonOnTemp: "input_number.climatizacion_tarde_encender_en",
    afternoonOffTemp: "input_number.climatizacion_tarde_apagar_en",
    afternoonTargetTemp: "input_number.climatizacion_tarde_temperatura_objetivo",
    morningFan: "input_select.climatizacion_manana_ventilador",
    afternoonFan: "input_select.climatizacion_tarde_ventilador",
    commandedPower: "input_boolean.climatizacion_estado_comandado",
    commandedMode: "input_select.climatizacion_modo_comandado",
    commandedTemperature: "input_number.climatizacion_temperatura_comandada",
    commandedFan: "input_select.climatizacion_ventilador_comandado",
    sessionSynchronized: "input_boolean.climatizacion_sincronizado_sesion",
    controlMode: "input_select.climatizacion_control_mode",
    heatDemand: "input_boolean.climatizacion_demanda_calor",
    coolDemand: "input_boolean.climatizacion_demanda_frio",
    lastEvent: "input_text.climatizacion_ultimo_evento",
  }),
});

const HVAC = Object.freeze({
  cool: { label: "Frío", short: "Frío", icon: "snow", tone: "cool" },
  heat: { label: "Calor", short: "Calor", icon: "sun", tone: "heat" },
  auto: { label: "Automático", short: "Auto", icon: "auto", tone: "auto" },
  dry: { label: "Deshumidificar", short: "Seco", icon: "drop", tone: "dry" },
  fan_only: { label: "Solo ventilador", short: "Vent.", icon: "fan", tone: "fan" },
  off: { label: "Apagado", short: "Off", icon: "power", tone: "off" },
});

const FAN = Object.freeze({
  auto: "Auto",
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
});

// El sensor externo decide CUÁNDO encender/apagar. La temperatura enviada al
// equipo es un ajuste persistente independiente por perfil. El backend aplica la
// misma regla de seguridad aunque el navegador esté cerrado:
// - Mañana/HEAT: objetivo >= umbral de apagado.
// - Tarde/COOL:  objetivo <= umbral de apagado.

const ICON_PATHS = Object.freeze({
  snow: '<path d="M12 2v20M4.2 6.5l15.6 11M4.2 17.5l15.6-11M9 4.5l3 2 3-2M9 19.5l3-2 3 2M5.4 9.5l.2 3.6-3 .8M18.6 14.5l-.2-3.6 3-.8M5.4 14.5l.2-3.6-3-.8M18.6 9.5l-.2 3.6 3 .8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.2v3M12 18.8v3M2.2 12h3M18.8 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M18.9 5.1l-2.1 2.1M7.2 16.8l-2.1 2.1"/>',
  auto: '<path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.7M20 4.5v4.2h-4.2M20 12a8 8 0 0 1-13.6 5.7L4 15.3M4 19.5v-4.2h4.2"/>',
  drop: '<path d="M12 3.2s6 6.4 6 10.5a6 6 0 1 1-12 0C6 9.6 12 3.2 12 3.2Z"/><path d="M9.2 15.2c.5 1.2 1.4 1.8 2.8 2"/>',
  fan: '<circle cx="12" cy="12" r="1.6" class="fill"/><path d="M12 10.3c-1.2-3.6.3-6.1 2.3-6.1 2.4 0 3.3 3.1 1.7 5.1-1 1.2-2.4 1.5-4 1M13.5 12.8c3.7-.8 5.9.9 5.6 2.9-.3 2.4-3.6 2.9-5.4 1-1-1.1-1.1-2.6-.2-3.9M10.7 13.3c-2.5 2.8-5.4 2.4-6.2.5-.9-2.2 1.8-4.3 4.2-3.6 1.5.4 2.3 1.6 2 3.1"/>',
  power: '<path d="M12 3v8"/><path d="M7.2 5.8A8 8 0 1 0 16.8 5.8"/>',
  menu: '<path d="M3 6.5h18M3 12h18M3 17.5h18"/>',
  moon: '<path d="M20.2 15.4A8.1 8.1 0 0 1 8.6 3.8a8.65 8.65 0 1 0 11.6 11.6Z"/>',
  themeSun: '<circle cx="12" cy="12" r="3.75"/><path d="M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5M4.75 4.75l1.77 1.77M17.48 17.48l1.77 1.77M19.25 4.75l-1.77 1.77M6.52 17.48l-1.77 1.77"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 7.5"/>',
  alert: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4M12 16.5h.01"/>',
  infrared: '<path d="M7 12a5 5 0 0 1 5-5M4 12a8 8 0 0 1 8-8M10 12a2 2 0 0 1 2-2"/><circle cx="12" cy="12" r="1" class="fill"/><path d="M15 12a3 3 0 0 1-3 3M18 12a6 6 0 0 1-6 6M21 12a9 9 0 0 1-9 9"/>',
  thermometer: '<path d="M10 4a2 2 0 0 1 4 0v9.2a4.5 4.5 0 1 1-4 0V4Z"/><path d="M12 8v8"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  energy: '<path d="M13.2 2.5 6.8 13h4.9l-.9 8.5L17.2 11h-4.9l.9-8.5Z"/>',
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
});

class WitmindClimatizacionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._renderQueued = false;
    this._renderDeferred = false;
    this._draftTemp = null;
    this._pendingCount = 0;
    this._optimistic = {};
    this._toast = null;
    this._toastTimer = null;
    this._sensorAlertTimer = null;
    this._themeStorageKey = "witmind-climatizacion-panel-theme";
    this._modeStorageKey = "witmind-climatizacion-last-mode";
    this._theme = this._loadTheme();
    this._lastOnMode = this._loadLastMode();
    this._energyRange = "day";
    this._energyDayOffset = 0;
    this._energyData = [];
    this._energyLoading = false;
    this._energyError = null;
    this._energyMetadata = null;
    this._temperatureMetadata = null;
    this._temperatureData = [];
    this._temperatureError = null;
    this._energyMonthTotal = null;
    this._energySelectedTotal = null;
    this._energyMonthUpdatedAt = 0;
    this._energyRequestId = 0;
    this._energyRefreshTimer = null;
    this._energyLastLoadedAt = 0;
    this._energyAutoFollow = true;
    this._energyScrollLeft = null;

    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("input", (event) => this._handleInput(event));
    this.shadowRoot.addEventListener("change", (event) => this._handleChange(event));
    this.shadowRoot.addEventListener("focusout", (event) => this._handleFocusOut(event));
    this.shadowRoot.addEventListener("scroll", (event) => this._handleEnergyScroll(event), true);
  }

  set hass(value) {
    const previous = this._hass;
    const config = this._config();
    const trackedEntities = [
      ...config.entities,
      config.referenceTemperatureSensor,
      config.masterRelay,
      config.energySensor,
      config.temperatureHistorySensor,
      ...Object.values(config.automationHelpers),
    ].filter(Boolean);
    const relevantStateChanged =
      !previous ||
      trackedEntities.some((entityId) => previous.states?.[entityId] !== value?.states?.[entityId]);

    const energyChanged = !previous || previous.states?.[config.energySensor] !== value?.states?.[config.energySensor];
    const temperatureHistoryChanged = !previous || previous.states?.[config.temperatureHistorySensor] !== value?.states?.[config.temperatureHistorySensor];
    this._hass = value;
    this._syncSensorAlertTimer();
    if (relevantStateChanged) {
      this._reconcileOptimistic();
      this._requestRender();
    }
    if (energyChanged || (this._energyRange === "day" && temperatureHistoryChanged)) this._scheduleEnergyRefresh();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    this._panel = value;
    this._requestRender();
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
    if (this._hass) {
      this._requestRender();
      this._scheduleEnergyRefresh(true);
      this._syncSensorAlertTimer();
    }
  }

  disconnectedCallback() {
    clearTimeout(this._toastTimer);
    clearInterval(this._sensorAlertTimer);
    this._sensorAlertTimer = null;
    clearTimeout(this._energyRefreshTimer);
    this._energyRequestId += 1;
  }

  _config() {
    const raw = this._panel?.config || {};
    const configuredEntities = raw.entities || raw.entity_ids || raw.entityIds;
    const entities = Array.isArray(configuredEntities)
      ? [...new Set(configuredEntities.filter(Boolean).map(String))]
      : DEFAULT_CLIMATE_CONFIG.entities;

    const minTemp = Number(raw.min_temp ?? raw.minTemp ?? DEFAULT_CLIMATE_CONFIG.minTemp);
    const maxTemp = Number(raw.max_temp ?? raw.maxTemp ?? DEFAULT_CLIMATE_CONFIG.maxTemp);
    const tempStep = Number(raw.temp_step ?? raw.tempStep ?? DEFAULT_CLIMATE_CONFIG.tempStep);
    const defaultOnMode = String(
      raw.default_on_mode ?? raw.defaultOnMode ?? DEFAULT_CLIMATE_CONFIG.defaultOnMode,
    );
    const defaultHelpers = DEFAULT_CLIMATE_CONFIG.automationHelpers;
    const automationHelpers = {
      configInitialized: raw.automation_config_initialized || raw.automationConfigInitialized || defaultHelpers.configInitialized,
      morningEnabled: raw.morning_enabled || raw.morningEnabled || defaultHelpers.morningEnabled,
      afternoonEnabled: raw.afternoon_enabled || raw.afternoonEnabled || defaultHelpers.afternoonEnabled,
      morningStart: raw.morning_start || raw.morningStart || defaultHelpers.morningStart,
      morningEnd: raw.morning_end || raw.morningEnd || defaultHelpers.morningEnd,
      afternoonStart: raw.afternoon_start || raw.afternoonStart || defaultHelpers.afternoonStart,
      afternoonEnd: raw.afternoon_end || raw.afternoonEnd || defaultHelpers.afternoonEnd,
      morningOffTemp: raw.morning_off_temp || raw.morningOffTemp || defaultHelpers.morningOffTemp,
      morningOnTemp: raw.morning_on_temp || raw.morningOnTemp || defaultHelpers.morningOnTemp,
      morningTargetTemp:
        raw.morning_target_temp || raw.morningTargetTemp || defaultHelpers.morningTargetTemp,
      afternoonOnTemp: raw.afternoon_on_temp || raw.afternoonOnTemp || defaultHelpers.afternoonOnTemp,
      afternoonOffTemp: raw.afternoon_off_temp || raw.afternoonOffTemp || defaultHelpers.afternoonOffTemp,
      afternoonTargetTemp:
        raw.afternoon_target_temp || raw.afternoonTargetTemp || defaultHelpers.afternoonTargetTemp,
      morningFan: raw.morning_fan || raw.morningFan || defaultHelpers.morningFan,
      afternoonFan: raw.afternoon_fan || raw.afternoonFan || defaultHelpers.afternoonFan,
      commandedPower: raw.commanded_power_helper || raw.commandedPowerHelper || defaultHelpers.commandedPower,
      commandedMode: raw.commanded_mode_helper || raw.commandedModeHelper || defaultHelpers.commandedMode,
      commandedTemperature:
        raw.commanded_temperature_helper ||
        raw.commandedTemperatureHelper ||
        defaultHelpers.commandedTemperature,
      commandedFan:
        raw.commanded_fan_helper ||
        raw.commandedFanHelper ||
        defaultHelpers.commandedFan,
      sessionSynchronized: raw.session_sync_helper || raw.sessionSyncHelper || defaultHelpers.sessionSynchronized,
      controlMode: raw.control_mode_helper || raw.controlModeHelper || defaultHelpers.controlMode,
      heatDemand: raw.heat_demand_helper || raw.heatDemandHelper || defaultHelpers.heatDemand,
      coolDemand: raw.cool_demand_helper || raw.coolDemandHelper || defaultHelpers.coolDemand,
      lastEvent: raw.last_event_helper || raw.lastEventHelper || defaultHelpers.lastEvent,
    };

    return {
      title: raw.title || DEFAULT_CLIMATE_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_CLIMATE_CONFIG.subtitle,
      logo: raw.logo || DEFAULT_CLIMATE_CONFIG.logo,
      entities: entities.length ? entities : DEFAULT_CLIMATE_CONFIG.entities,
      minTemp: Number.isFinite(minTemp) ? minTemp : DEFAULT_CLIMATE_CONFIG.minTemp,
      maxTemp: Number.isFinite(maxTemp) ? maxTemp : DEFAULT_CLIMATE_CONFIG.maxTemp,
      tempStep: Number.isFinite(tempStep) && tempStep > 0 ? tempStep : DEFAULT_CLIMATE_CONFIG.tempStep,
      defaultOnMode: HVAC[defaultOnMode] && defaultOnMode !== "off"
        ? defaultOnMode
        : DEFAULT_CLIMATE_CONFIG.defaultOnMode,
      referenceTemperatureSensor:
        raw.reference_temperature_sensor ||
        raw.referenceTemperatureSensor ||
        DEFAULT_CLIMATE_CONFIG.referenceTemperatureSensor,
      referenceTemperatureLabel:
        raw.reference_temperature_label ||
        raw.referenceTemperatureLabel ||
        DEFAULT_CLIMATE_CONFIG.referenceTemperatureLabel,
      masterRelay: raw.master_relay || raw.masterRelay || DEFAULT_CLIMATE_CONFIG.masterRelay,
      energySensor: raw.energy_sensor || raw.energySensor || DEFAULT_CLIMATE_CONFIG.energySensor,
      temperatureHistorySensor:
        raw.temperature_history_sensor ||
        raw.temperatureHistorySensor ||
        DEFAULT_CLIMATE_CONFIG.temperatureHistorySensor,
      automationHelpers,
    };
  }

  _state(entityId) {
    return this._hass?.states?.[entityId] || null;
  }

  _helperOn(entityId) {
    return this._state(entityId)?.state === "on";
  }

  _helperTime(entityId, fallback = "--:--") {
    const state = this._state(entityId)?.state;
    if (!state || ["unknown", "unavailable"].includes(state)) return fallback;
    return String(state).slice(0, 5);
  }

  _helperNumber(entityId, fallback) {
    const value = Number(this._state(entityId)?.state);
    return Number.isFinite(value) ? value : fallback;
  }


  _energyRefreshInterval() {
    if (this._energyRange === "day") return 30000;
    if (this._energyRange === "month") return 120000;
    return 300000;
  }

  _scheduleEnergyRefresh(immediate = false) {
    if (!this._hass || !this.isConnected) return;
    clearTimeout(this._energyRefreshTimer);
    if (this._energyRange === "day" && this._energyDayOffset !== 0) return;
    const interval = this._energyRefreshInterval();
    const elapsed = this._energyLastLoadedAt ? Date.now() - this._energyLastLoadedAt : 0;
    const delay = immediate ? 0 : this._energyLastLoadedAt ? Math.max(1000, interval - elapsed) : interval;
    this._energyRefreshTimer = setTimeout(() => this._loadEnergyStatistics(), delay);
  }

  _energyRangeDefinition(range = this._energyRange) {
    const now = new Date();
    let start;
    let end = now;
    let period;
    let title;
    let intervalLabel;
    let isToday = false;

    if (range === "year") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      period = "month";
      title = `Año ${now.getFullYear()}`;
      intervalLabel = "mes";
    } else if (range === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      period = "day";
      title = now.toLocaleDateString("es-BO", { month: "long", year: "numeric" });
      intervalLabel = "día";
    } else {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      start = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        todayStart.getDate() + Math.min(0, Number(this._energyDayOffset) || 0),
        0,
        0,
        0,
        0,
      );
      isToday = start.getTime() === todayStart.getTime();
      end = isToday
        ? now
        : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0, 0);
      period = "hour";
      title = start.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" });
      intervalLabel = "hora";
    }

    return { start, end, period, title, intervalLabel, isToday };
  }

  _energyValueToKWh(value, unit) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const normalized = String(unit || "kWh").trim().toLowerCase().replaceAll(" ", "");
    if (normalized === "kwh") return numeric;
    if (normalized === "wh") return numeric / 1000;
    if (normalized === "mwh") return numeric * 1000;
    return null;
  }

  _aggregateEnergyDayRows(rows, definition) {
    const dayStart = new Date(definition.start);
    const dayEnd = new Date(definition.end);
    const lastHourStart = definition.isToday
      ? new Date(dayEnd.getFullYear(), dayEnd.getMonth(), dayEnd.getDate(), dayEnd.getHours(), 0, 0, 0)
      : new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 0, 0, 0);
    const buckets = new Map();

    for (let cursor = new Date(dayStart); cursor <= lastHourStart; cursor.setHours(cursor.getHours() + 1)) {
      const start = cursor.getTime();
      buckets.set(start, {
        start,
        end: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), cursor.getHours() + 1, 0, 0, 0).getTime(),
        change: 0,
        samples: 0,
        partial: definition.isToday && start === lastHourStart.getTime(),
        live: false,
      });
    }

    const rangeStartMs = dayStart.getTime();
    const rangeEndMs = dayEnd.getTime();
    for (const row of rows) {
      const timestamp = Number(row.start);
      if (!Number.isFinite(timestamp) || timestamp < rangeStartMs || timestamp >= rangeEndMs) continue;
      const rowDate = new Date(timestamp);
      const bucketStart = new Date(
        rowDate.getFullYear(),
        rowDate.getMonth(),
        rowDate.getDate(),
        rowDate.getHours(),
        0,
        0,
        0,
      ).getTime();
      const bucket = buckets.get(bucketStart);
      if (!bucket) continue;
      bucket.change += Math.max(0, Number(row.change) || 0);
      bucket.samples += 1;
      if (bucket.partial) bucket.live = true;
    }

    const result = [...buckets.values()];
    if (result.length) result[0].change = 0; // 00:00 siempre empieza en cero en la vista Día.
    return result;
  }

  _aggregateTemperatureDayRows(rows, definition, currentEntity) {
    const dayStart = new Date(definition.start);
    const dayEnd = new Date(definition.end);
    const lastHourStart = definition.isToday
      ? new Date(dayEnd.getFullYear(), dayEnd.getMonth(), dayEnd.getDate(), dayEnd.getHours(), 0, 0, 0)
      : new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 0, 0, 0);
    const buckets = new Map();

    for (let cursor = new Date(dayStart); cursor <= lastHourStart; cursor.setHours(cursor.getHours() + 1)) {
      const start = cursor.getTime();
      buckets.set(start, {
        start,
        temperature: null,
        min: null,
        max: null,
        samples: 0,
        partial: definition.isToday && start === lastHourStart.getTime(),
      });
    }

    const accumulators = new Map();
    for (const row of rows) {
      const timestamp = Number(row.start);
      const mean = Number(row.mean);
      if (!Number.isFinite(timestamp) || !Number.isFinite(mean)) continue;
      const date = new Date(timestamp);
      const bucketStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0).getTime();
      if (!buckets.has(bucketStart)) continue;
      const acc = accumulators.get(bucketStart) || { sum: 0, count: 0, min: Infinity, max: -Infinity };
      acc.sum += mean;
      acc.count += 1;
      const rowMin = Number.isFinite(Number(row.min)) ? Number(row.min) : mean;
      const rowMax = Number.isFinite(Number(row.max)) ? Number(row.max) : mean;
      acc.min = Math.min(acc.min, rowMin);
      acc.max = Math.max(acc.max, rowMax);
      accumulators.set(bucketStart, acc);
    }

    for (const [start, acc] of accumulators) {
      const bucket = buckets.get(start);
      if (!bucket || !acc.count) continue;
      bucket.temperature = acc.sum / acc.count;
      bucket.min = Number.isFinite(acc.min) ? acc.min : bucket.temperature;
      bucket.max = Number.isFinite(acc.max) ? acc.max : bucket.temperature;
      bucket.samples = acc.count;
    }

    // La lectura viva solo corresponde al día actual.
    if (definition.isToday) {
      const currentTemperature = Number(currentEntity?.state);
      const currentBucket = buckets.get(lastHourStart.getTime());
      if (currentBucket && Number.isFinite(currentTemperature)) {
        if (currentBucket.samples > 0 && Number.isFinite(currentBucket.temperature)) {
          currentBucket.temperature =
            (currentBucket.temperature * currentBucket.samples + currentTemperature) /
            (currentBucket.samples + 1);
        } else {
          currentBucket.temperature = currentTemperature;
        }
        currentBucket.samples += 1;
        currentBucket.min = Number.isFinite(currentBucket.min)
          ? Math.min(currentBucket.min, currentTemperature)
          : currentTemperature;
        currentBucket.max = Number.isFinite(currentBucket.max)
          ? Math.max(currentBucket.max, currentTemperature)
          : currentTemperature;
      }
    }

    return [...buckets.values()];
  }

  _normalizeTemperatureHistoryRows(historyResult, entityId) {
    const rows = Array.isArray(historyResult?.[entityId]) ? historyResult[entityId] : [];
    return rows
      .map((row) => {
        const state = Number(row?.state ?? row?.s);
        let timestamp = Number(row?.lu ?? row?.lc);
        if (Number.isFinite(timestamp)) timestamp *= 1000;
        if (!Number.isFinite(timestamp)) {
          const iso = row?.last_updated || row?.last_changed;
          timestamp = iso ? Date.parse(iso) : NaN;
        }
        return { start: timestamp, mean: state, min: state, max: state };
      })
      .filter((row) => Number.isFinite(row.start) && Number.isFinite(row.mean));
  }

  _normalizeEnergyHistoryRows(historyResult, entityId, unit) {
    const rows = Array.isArray(historyResult?.[entityId]) ? historyResult[entityId] : [];
    return rows
      .map((row) => {
        const value = this._energyValueToKWh(row?.state ?? row?.s, unit);
        let timestamp = Number(row?.lu ?? row?.lc);
        if (Number.isFinite(timestamp)) timestamp *= 1000;
        if (!Number.isFinite(timestamp)) {
          const iso = row?.last_updated || row?.last_changed;
          timestamp = iso ? Date.parse(iso) : NaN;
        }
        return { start: timestamp, value };
      })
      .filter((row) => Number.isFinite(row.start) && Number.isFinite(row.value))
      .sort((a, b) => Number(a.start) - Number(b.start));
  }

  _calculateEnergyHistoryDelta(historyResult, entityId, currentState, unit) {
    const rows = this._normalizeEnergyHistoryRows(historyResult, entityId, unit);
    const startKWh = rows.length ? Number(rows[0].value) : null;
    const currentKWh = this._energyValueToKWh(currentState, unit);
    if (!Number.isFinite(startKWh) || !Number.isFinite(currentKWh)) return null;
    return Math.abs(currentKWh - startKWh);
  }

  _aggregateEnergyHistoryCalendarRows(historyResult, entityId, definition, range, currentState, unit) {
    if (!["month", "year"].includes(range)) return [];

    const rows = this._normalizeEnergyHistoryRows(historyResult, entityId, unit);
    const currentKWh = this._energyValueToKWh(currentState, unit);
    if (Number.isFinite(currentKWh)) rows.push({ start: definition.end.getTime(), value: currentKWh });
    rows.sort((a, b) => Number(a.start) - Number(b.start));

    const endMs = definition.end.getTime();
    const result = [];
    let cursor = new Date(definition.start);
    let index = 0;
    let previousValue = null;

    while (index < rows.length && Number(rows[index].start) <= cursor.getTime()) {
      previousValue = Number(rows[index].value);
      index += 1;
    }

    while (cursor.getTime() < endMs) {
      const bucketStart = new Date(cursor);
      const bucketEnd = range === "month"
        ? new Date(bucketStart.getFullYear(), bucketStart.getMonth(), bucketStart.getDate() + 1, 0, 0, 0, 0)
        : new Date(bucketStart.getFullYear(), bucketStart.getMonth() + 1, 1, 0, 0, 0, 0);
      const bucketEndMs = Math.min(bucketEnd.getTime(), endMs);
      let first = previousValue;
      let last = previousValue;
      let samples = 0;

      while (index < rows.length && Number(rows[index].start) <= bucketEndMs) {
        const value = Number(rows[index].value);
        if (!Number.isFinite(first)) first = value;
        last = value;
        previousValue = value;
        samples += 1;
        index += 1;
      }

      if (Number.isFinite(first) && Number.isFinite(last)) {
        result.push({
          start: bucketStart.getTime(),
          change: Math.abs(last - first),
          samples,
          partial: bucketEndMs < bucketEnd.getTime(),
          live: bucketEndMs === endMs,
        });
      }
      cursor = bucketEnd;
    }

    return result;
  }

  _temperatureChartSegments(points) {
    const segments = [];
    let current = [];
    let previousStart = null;
    for (const point of points) {
      if (!Number.isFinite(point?.temperature)) {
        if (current.length) segments.push(current);
        current = [];
        previousStart = null;
        continue;
      }
      if (previousStart !== null && Number(point.start) - previousStart > 90 * 60 * 1000) {
        if (current.length) segments.push(current);
        current = [];
      }
      current.push(point);
      previousStart = Number(point.start);
    }
    if (current.length) segments.push(current);
    return segments;
  }

  async _loadEnergyStatistics() {
    if (!this._hass?.connection) return;
    clearTimeout(this._energyRefreshTimer);
    const config = this._config();
    const entity = this._state(config.energySensor);
    const temperatureEntity = this._state(config.temperatureHistorySensor);
    const numericState = Number(entity?.state);
    if (!entity) {
      this._energyData = [];
      this._temperatureData = [];
      this._energyMetadata = null;
      this._energyMonthTotal = null;
      this._energySelectedTotal = null;
      this._energyError = `No existe ${config.energySensor} en Home Assistant.`;
      this._energyLoading = false;
      this._requestRender();
      return;
    }
    if (!Number.isFinite(numericState)) {
      this._energyData = [];
      this._temperatureData = [];
      this._energyMetadata = null;
      this._energyMonthTotal = null;
      this._energySelectedTotal = null;
      this._energyError = `${config.energySensor} no entrega un valor numérico.`;
      this._energyLoading = false;
      this._requestRender();
      return;
    }

    const requestId = ++this._energyRequestId;
    const definition = this._energyRangeDefinition();
    const actualNow = new Date();
    const monthStart = new Date(
      actualNow.getFullYear(),
      actualNow.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    // Día mantiene estadísticas por hora. Mes y Año usan únicamente el historial
    // del contador acumulado y restas absolutas entre el inicio y el fin de cada
    // día/mes. No se suman `change`, `sum` ni compensaciones intermedias.
    this._energyLoading = true;
    this._energyError = null;
    this._temperatureError = null;
    this._requestRender();

    try {
      let energyMetadata = null;
      let temperatureMetadata = null;
      if (this._energyRange === "day") {
        const statisticIds = [config.energySensor];
        if (config.temperatureHistorySensor) statisticIds.push(config.temperatureHistorySensor);
        const metadataResult = await this._hass.connection.sendMessagePromise({
          type: "recorder/get_statistics_metadata",
          statistic_ids: statisticIds,
        });
        if (requestId !== this._energyRequestId) return;
        const metadataRows = Array.isArray(metadataResult) ? metadataResult : [];
        energyMetadata = metadataRows.find((item) => item?.statistic_id === config.energySensor) || null;
        temperatureMetadata =
          metadataRows.find((item) => item?.statistic_id === config.temperatureHistorySensor) || null;
        if (!energyMetadata || !energyMetadata.has_sum) {
          throw new Error("La entidad no dispone de estadísticas acumulables (has_sum) para la vista Día.");
        }
      }
      this._energyMetadata = energyMetadata;
      this._temperatureMetadata = temperatureMetadata;

      const selectedPromise = this._energyRange === "day"
        ? this._hass.connection.sendMessagePromise({
            type: "recorder/statistics_during_period",
            start_time: definition.start.toISOString(),
            end_time: definition.end.toISOString(),
            statistic_ids: [config.energySensor],
            period: "5minute",
            units: { energy: "kWh" },
            types: ["change", "sum"],
          })
        : this._hass.connection.sendMessagePromise({
            type: "history/history_during_period",
            start_time: definition.start.toISOString(),
            end_time: definition.end.toISOString(),
            entity_ids: [config.energySensor],
            include_start_time_state: true,
            significant_changes_only: true,
            minimal_response: true,
            no_attributes: true,
          });

      // Total mensual: primer valor numérico desde el día 1 contra el valor actual.
      // Si ya estamos viendo Mes, reutilizamos exactamente la misma consulta.
      const monthPromise = this._energyRange === "month"
        ? selectedPromise
        : this._hass.connection.sendMessagePromise({
            type: "history/history_during_period",
            start_time: monthStart.toISOString(),
            end_time: actualNow.toISOString(),
            entity_ids: [config.energySensor],
            include_start_time_state: true,
            significant_changes_only: true,
            minimal_response: true,
            no_attributes: true,
          });

      let temperaturePromise = Promise.resolve({ mode: "none", result: null });
      if (this._energyRange === "day" && config.temperatureHistorySensor) {
        if (temperatureMetadata?.has_mean) {
          temperaturePromise = this._hass.connection.sendMessagePromise({
            type: "recorder/statistics_during_period",
            start_time: definition.start.toISOString(),
            end_time: definition.end.toISOString(),
            statistic_ids: [config.temperatureHistorySensor],
            period: "5minute",
            types: ["mean", "min", "max"],
          }).then((result) => ({ mode: "statistics", result }));
        } else {
          temperaturePromise = this._hass.connection.sendMessagePromise({
            type: "history/history_during_period",
            start_time: definition.start.toISOString(),
            end_time: definition.end.toISOString(),
            entity_ids: [config.temperatureHistorySensor],
            include_start_time_state: true,
            significant_changes_only: false,
            minimal_response: false,
            no_attributes: true,
          }).then((result) => ({ mode: "history", result }));
        }
      }

      const [selectedResult, monthResult, temperatureResult] = await Promise.all([
        selectedPromise,
        monthPromise,
        temperaturePromise,
      ]);
      if (requestId !== this._energyRequestId) return;

      const unit = entity.attributes?.unit_of_measurement || "kWh";
      if (this._energyRange === "day") {
        const rawRows = Array.isArray(selectedResult?.[config.energySensor])
          ? selectedResult[config.energySensor]
          : [];
        const normalizedRows = rawRows.map((row) => ({
          start: Number(row.start),
          end: Number(row.end),
          change: row.change === undefined || row.change === null ? null : Number(row.change),
          sum: row.sum === undefined || row.sum === null ? null : Number(row.sum),
        }));
        this._energyData = this._aggregateEnergyDayRows(normalizedRows, definition);
        this._energySelectedTotal = null;
      } else {
        this._energyData = this._aggregateEnergyHistoryCalendarRows(
          selectedResult,
          config.energySensor,
          definition,
          this._energyRange,
          numericState,
          unit,
        );
        this._energySelectedTotal = this._calculateEnergyHistoryDelta(
          selectedResult,
          config.energySensor,
          numericState,
          unit,
        );
      }

      this._energyMonthTotal = this._calculateEnergyHistoryDelta(
        monthResult,
        config.energySensor,
        numericState,
        unit,
      );
      this._energyMonthUpdatedAt = Date.now();

      if (this._energyRange === "day") {
        let temperatureRows = [];
        if (temperatureResult?.mode === "statistics") {
          const rawTemperatureRows = Array.isArray(
            temperatureResult.result?.[config.temperatureHistorySensor],
          )
            ? temperatureResult.result[config.temperatureHistorySensor]
            : [];
          temperatureRows = rawTemperatureRows
            .map((row) => ({
              start: Number(row.start),
              mean: Number(row.mean),
              min: Number(row.min),
              max: Number(row.max),
            }))
            .filter((row) => Number.isFinite(row.start) && Number.isFinite(row.mean));
        } else if (temperatureResult?.mode === "history") {
          temperatureRows = this._normalizeTemperatureHistoryRows(
            temperatureResult.result,
            config.temperatureHistorySensor,
          );
        }

        this._temperatureData = this._aggregateTemperatureDayRows(
          temperatureRows,
          definition,
          temperatureEntity,
        );
        if (!temperatureEntity) {
          this._temperatureError = `No existe ${config.temperatureHistorySensor}.`;
        } else if (!this._temperatureData.some((row) => Number.isFinite(row.temperature))) {
          this._temperatureError = "No hay historial de temperatura disponible para este día.";
        } else {
          this._temperatureError = null;
        }
      } else {
        this._temperatureData = [];
        this._temperatureError = null;
      }

      this._energyLastLoadedAt = Date.now();
      this._energyError = null;
    } catch (error) {
      if (requestId !== this._energyRequestId) return;
      this._energyData = [];
      this._temperatureData = [];
      this._energyMonthTotal = null;
      this._energySelectedTotal = null;
      this._energyError = error?.message || "No se pudieron consultar los datos energéticos.";
      console.error("Error cargando estadísticas de energía:", error);
    } finally {
      if (requestId === this._energyRequestId) {
        this._energyLoading = false;
        this._requestRender();
        this._scheduleEnergyRefresh();
      }
    }
  }

  _setEnergyRange(range) {
    if (!["day", "month", "year"].includes(range) || range === this._energyRange) return;
    this._energyRange = range;
    this._energyData = [];
    this._temperatureData = [];
    this._energySelectedTotal = null;
    this._energyError = null;
    this._temperatureError = null;
    this._energyLastLoadedAt = 0;
    this._energyAutoFollow = true;
    this._energyScrollLeft = null;
    this._loadEnergyStatistics();
  }

  _shiftEnergyDay(delta) {
    if (this._energyRange !== "day") return;
    const step = Number(delta);
    if (!Number.isFinite(step) || step === 0) return;
    const nextOffset = Math.min(0, this._energyDayOffset + step);
    if (nextOffset === this._energyDayOffset) return;
    this._energyDayOffset = nextOffset;
    this._energyData = [];
    this._temperatureData = [];
    this._energySelectedTotal = null;
    this._energyError = null;
    this._temperatureError = null;
    this._energyLastLoadedAt = 0;
    this._energyAutoFollow = true;
    this._energyScrollLeft = null;
    this._loadEnergyStatistics();
  }

  _resetEnergyDay() {
    if (this._energyRange !== "day" || this._energyDayOffset === 0) return;
    this._energyDayOffset = 0;
    this._energyData = [];
    this._temperatureData = [];
    this._energySelectedTotal = null;
    this._energyError = null;
    this._temperatureError = null;
    this._energyLastLoadedAt = 0;
    this._energyAutoFollow = true;
    this._energyScrollLeft = null;
    this._loadEnergyStatistics();
  }

  _formatEnergy(value, digits = 2) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    return numeric.toLocaleString("es-BO", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  _energyLabel(timestamp, range = this._energyRange) {
    const date = new Date(Number(timestamp));
    if (!Number.isFinite(date.getTime())) return "—";
    if (range === "year") return date.toLocaleDateString("es-BO", { month: "short" }).replace(".", "");
    if (range === "month") return String(date.getDate());
    return date.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  _handleEnergyScroll(event) {
    const wrap = event.target?.closest?.("[data-energy-scroll]");
    if (!wrap) return;
    const maxScroll = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    this._energyScrollLeft = wrap.scrollLeft;
    this._energyAutoFollow = maxScroll <= 0 || maxScroll - wrap.scrollLeft <= 72;
  }

  _restoreEnergyChartScroll() {
    const wrap = this.shadowRoot?.querySelector("[data-energy-scroll]");
    if (!wrap) return;
    const maxScroll = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    if (this._energyAutoFollow || this._energyScrollLeft === null) {
      wrap.scrollLeft = maxScroll;
      this._energyScrollLeft = wrap.scrollLeft;
      return;
    }
    wrap.scrollLeft = Math.max(0, Math.min(this._energyScrollLeft, maxScroll));
  }

  _energyChart() {
    const rows = this._energyData;
    if (this._energyLoading && !rows.length) return `<div class="energy-empty"><span class="energy-spinner"></span>Consultando datos de Home Assistant…</div>`;
    if (this._energyError) return `<div class="energy-empty error">${this._icon("alert")}<span>${this._escape(this._energyError)}</span></div>`;
    if (!rows.length) return `<div class="energy-empty">No hay datos de consumo disponibles para este período.</div>`;

    const height = 300;
    const padLeft = 12;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 44;
    const slotWidth = this._energyRange === "day" ? 68 : this._energyRange === "month" ? 38 : 62;
    const width = Math.max(620, rows.length * slotWidth + padLeft + padRight);
    const chartHeight = height - padTop - padBottom;
    const chartWidth = width - padLeft - padRight;
    const maxValue = Math.max(...rows.map((row) => row.change), 0.001);
    const gap = this._energyRange === "day" ? 10 : rows.length > 24 ? 4 : 7;
    const barWidth = Math.max(6, (chartWidth - gap * Math.max(0, rows.length - 1)) / rows.length);
    const labelEvery = this._energyRange === "month" ? Math.max(1, Math.ceil(rows.length / 10)) : this._energyRange === "day" ? 2 : 1;
    const ratios = [0, .25, .5, .75, 1];
    const grid = ratios.map((ratio) => {
      const y = padTop + chartHeight * (1 - ratio);
      return `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" class="energy-grid-line"/>`;
    }).join("");
    const axis = ratios.map((ratio) => {
      const y = padTop + chartHeight * (1 - ratio);
      const label = this._formatEnergy(maxValue * ratio, maxValue < 1 ? 2 : 1);
      return `<span class="energy-y-tick" style="top:${y.toFixed(1)}px">${this._escape(label)}</span>`;
    }).join("");
    const bars = rows.map((row, index) => {
      const x = padLeft + index * (barWidth + gap);
      const barHeight = row.change > 0 ? Math.max(2, (row.change / maxValue) * chartHeight) : 1;
      const y = padTop + chartHeight - barHeight;
      const showLabel = index % labelEvery === 0 || index === rows.length - 1;
      const label = this._energyLabel(row.start);
      const status = row.partial ? " · en curso" : "";
      const currentMarker = row.partial
        ? `<text x="${(x + barWidth / 2).toFixed(1)}" y="${(padTop + 12).toFixed(1)}" text-anchor="middle" class="energy-current-label">ahora</text>`
        : "";
      return `<g class="energy-bar-group ${row.partial ? "is-current" : ""}"><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="${Math.min(5, barWidth / 2).toFixed(1)}" class="energy-bar ${row.partial ? "is-partial" : ""}"><title>${this._escape(label)} · ${this._formatEnergy(row.change)} kWh${status}</title></rect>${currentMarker}${showLabel ? `<text x="${(x + barWidth / 2).toFixed(1)}" y="${height - 16}" text-anchor="middle" class="energy-axis-text">${this._escape(label)}</text>` : ""}</g>`;
    }).join("");

    let temperatureSvg = "";
    let temperatureAxis = "";
    let temperatureAxisClass = "";
    if (this._energyRange === "day") {
      const tempMin = 12;
      const tempMax = 30;
      const tempByStart = new Map(this._temperatureData.map((row) => [Number(row.start), row]));
      const temperaturePoints = rows.map((row, index) => {
        const temp = tempByStart.get(Number(row.start));
        if (!temp || !Number.isFinite(Number(temp.temperature))) {
          return { start: Number(row.start), temperature: null };
        }
        const x = padLeft + index * (barWidth + gap) + barWidth / 2;
        const clamped = Math.max(tempMin, Math.min(tempMax, Number(temp.temperature)));
        const y = padTop + chartHeight * (1 - (clamped - tempMin) / (tempMax - tempMin));
        return {
          ...temp,
          x,
          y,
          temperature: Number(temp.temperature),
        };
      });

      const segments = this._temperatureChartSegments(temperaturePoints);
      const lines = segments.map((segment) => {
        const points = segment.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
        return `<polyline points="${points}" class="temperature-line"/>`;
      }).join("");
      const points = temperaturePoints
        .filter((point) => Number.isFinite(point.temperature))
        .map((point) => {
          const label = this._energyLabel(point.start, "day");
          const rangeText =
            Number.isFinite(point.min) && Number.isFinite(point.max)
              ? ` · mín ${this._formatTemp(point.min)} °C · máx ${this._formatTemp(point.max)} °C`
              : "";
          return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.6" class="temperature-point"><title>${this._escape(label)} · media ${this._formatTemp(point.temperature)} °C${rangeText}</title></circle>`;
        })
        .join("");
      temperatureSvg = `${lines}${points}`;

      const temperatureTicks = [12, 15, 18, 21, 24, 27, 30];
      temperatureAxis = temperatureTicks.map((temperature) => {
        const y = padTop + chartHeight * (1 - (temperature - tempMin) / (tempMax - tempMin));
        return `<span class="temperature-y-tick" style="top:${y.toFixed(1)}px">${temperature}°</span>`;
      }).join("");
      temperatureAxisClass = " has-temperature";
    }

    return `<div class="energy-chart-layout${temperatureAxisClass}"><div class="energy-y-axis" aria-hidden="true"><span class="energy-y-unit">kWh</span>${axis}</div><div class="energy-chart-wrap" data-energy-scroll><svg class="energy-chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this._energyRange === "day" ? "Consumo energético por hora con temperatura media de oficinas" : "Gráfica de consumo energético en kWh"}">${grid}${bars}${temperatureSvg}</svg></div>${this._energyRange === "day" ? `<div class="temperature-y-axis" aria-hidden="true"><span class="temperature-y-unit">°C</span>${temperatureAxis}</div>` : ""}</div>`;
  }

  _states() {
    if (!this._hass?.states) return [];
    return this._config().entities
      .map((entityId) => this._hass.states[entityId])
      .filter(Boolean);
  }

  _usableStates() {
    return this._states().filter((stateObj) => !["unknown", "unavailable"].includes(stateObj.state));
  }

  _allMatch(extractor, desired) {
    const states = this._usableStates();
    if (!states.length) return false;
    return states.every((stateObj) => extractor(stateObj) === desired);
  }

  _reconcileOptimistic() {
    if (!this._hass) return;

    // En IR abierto los helpers canónicos son el ACK lógico de Home Assistant.
    // No esperamos que climate.* coincida para retirar el estado optimista porque
    // sus estados son cache/telemetría Tuya, no confirmación física del aparato.
    const config = this._config();
    const commandedMode = this._state(config.automationHelpers.commandedMode)?.state;
    if (this._optimistic.mode && commandedMode === this._optimistic.mode) {
      delete this._optimistic.mode;
    }

    const commandedTemperature = Number(this._state(config.automationHelpers.commandedTemperature)?.state);
    if (
      Number.isFinite(this._optimistic.temp) &&
      Number.isFinite(commandedTemperature) &&
      Math.abs(commandedTemperature - Number(this._optimistic.temp)) < 0.001
    ) {
      delete this._optimistic.temp;
    }

    const commandedFan = this._state(config.automationHelpers.commandedFan)?.state;
    if (this._optimistic.fan && commandedFan === this._optimistic.fan) {
      delete this._optimistic.fan;
    }
  }

  _aggregate() {
    const config = this._config();
    const states = this._states();
    const usable = this._usableStates();
    const configuredCount = config.entities.length;
    const availableCount = usable.length;
    const fullyUnavailable = availableCount === 0;
    const partialAvailability = availableCount > 0 && availableCount < configuredCount;

    const values = (getter) => usable.map(getter).filter((value) => value !== undefined && value !== null && value !== "");
    const unique = (items) => [...new Set(items.map((item) => String(item)))];

    const modeValues = unique(values((s) => s.state));
    const tempValues = unique(values((s) => Number(s.attributes?.temperature)).filter(Number.isFinite));
    const fanValues = unique(values((s) => s.attributes?.fan_mode));

    const rawOn = usable.some((stateObj) => stateObj.state !== "off");
    const rawMode = modeValues.find((value) => value !== "off") || modeValues[0] || "off";
    const rawTemp = tempValues.length ? Number(tempValues[0]) : config.minTemp;
    const rawFan = fanValues[0] || "auto";

    // En IR no existe feedback físico fiable. Si los helpers deterministas están
    // disponibles, el panel muestra la última orden enviada por Home Assistant y
    // no el estado restaurado/estimado por climate.*.
    const commandedPowerState = this._state(config.automationHelpers.commandedPower)?.state;
    const commandedPowerKnown = commandedPowerState === "on" || commandedPowerState === "off";
    const commandedModeState = this._state(config.automationHelpers.commandedMode)?.state;
    const commandedModeKnown = Boolean(HVAC[commandedModeState]);
    const commandedTemperatureState = Number(this._state(config.automationHelpers.commandedTemperature)?.state);
    const commandedTemperatureKnown = Number.isFinite(commandedTemperatureState);
    const commandedFanState = this._state(config.automationHelpers.commandedFan)?.state;
    const commandedFanKnown = Boolean(FAN[commandedFanState]);
    const logicalOn = commandedPowerKnown ? commandedPowerState === "on" : rawOn;
    const logicalMode = commandedPowerKnown
      ? (logicalOn && commandedModeKnown ? commandedModeState : "off")
      : rawMode;

    const mode = this._optimistic.mode || logicalMode;
    // En lazo abierto la temperatura visible NO se deriva de climate.*.
    // Fuente de verdad: draft local -> orden optimista -> helper canónico HA.
    const temperature = Number.isFinite(this._draftTemp)
      ? this._draftTemp
      : Number.isFinite(this._optimistic.temp)
        ? Number(this._optimistic.temp)
        : commandedTemperatureKnown
          ? commandedTemperatureState
          : rawTemp;
    const fan = this._optimistic.fan || (commandedFanKnown ? commandedFanState : rawFan);

    // Divergencias entre estados cacheados de climate.* NO invalidan el estado
    // deseado del panel. Solo la disponibilidad del grupo afecta la operatividad.
    const stateMismatch = partialAvailability;

    const syncing = this._pendingCount > 0 || stateMismatch;
    const on = this._optimistic.mode ? this._optimistic.mode !== "off" : logicalOn;

    return {
      states,
      usable,
      fullyUnavailable,
      partialAvailability,
      stateMismatch,
      syncing,
      on,
      mode: HVAC[mode] ? mode : config.defaultOnMode,
      temperature: this._clampTemperature(temperature),
      fan: FAN[fan] ? fan : "auto",
    };
  }

  _clampTemperature(value) {
    const config = this._config();
    const numeric = Number(value);
    const safe = Number.isFinite(numeric) ? numeric : config.minTemp;
    return Math.max(config.minTemp, Math.min(config.maxTemp, safe));
  }

  _displayedTemperature() {
    // El control visible es la referencia para cualquier acción manual. Esto evita
    // sumar/restar sobre estados climate.* atrasados o divergentes entre IRIS/MIDEA.
    const range = this.shadowRoot?.querySelector('[data-control="temperature"]');
    const rangeValue = Number(range?.value);
    if (Number.isFinite(rangeValue)) return this._clampTemperature(rangeValue);

    const dialValue = Number(this.shadowRoot?.querySelector("[data-temp-value]")?.textContent);
    if (Number.isFinite(dialValue)) return this._clampTemperature(dialValue);

    return this._aggregate().temperature;
  }

  _loadTheme() {
    try {
      const stored = localStorage.getItem(this._themeStorageKey);
      return stored === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  _saveTheme() {
    try {
      localStorage.setItem(this._themeStorageKey, this._theme);
    } catch (_error) {
      // El panel sigue funcionando aunque el navegador bloquee localStorage.
    }
  }

  _loadLastMode() {
    try {
      const stored = localStorage.getItem(this._modeStorageKey);
      return HVAC[stored] && stored !== "off" ? stored : "cool";
    } catch (_error) {
      return "cool";
    }
  }

  _saveLastMode(mode) {
    if (!HVAC[mode] || mode === "off") return;
    this._lastOnMode = mode;
    try {
      localStorage.setItem(this._modeStorageKey, mode);
    } catch (_error) {
      // No es crítico para el control.
    }
  }

  _activeAutomationEditor() {
    const active = this.shadowRoot?.activeElement;
    if (!active?.matches?.("[data-helper-number], [data-helper-time]")) return null;
    return active;
  }

  _hasActiveAutomationEditor() {
    return Boolean(this._activeAutomationEditor());
  }

  _flushDeferredRender() {
    if (!this._renderDeferred || this._hasActiveAutomationEditor()) return;
    this._renderDeferred = false;
    this._requestRender();
  }

  _handleFocusOut(event) {
    const editor = event.target.closest?.("[data-helper-number], [data-helper-time]");
    if (!editor) return;

    // focusout ocurre antes de que shadowRoot.activeElement apunte de forma estable
    // al siguiente control. El microtask permite distinguir "salí del campo" de
    // "pasé a otro campo de automatización" sin reconstruir el DOM entre ambos.
    queueMicrotask(() => this._flushDeferredRender());
  }

  _requestRender() {
    if (!this._hass || !this.shadowRoot) return;

    // Home Assistant sustituye el objeto hass con mucha frecuencia. Mientras el
    // usuario edita un horario/umbral no reemplazamos shadowRoot.innerHTML: hacerlo
    // destruiría el input con foco, provocaría un blur/change artificial y podría
    // intentar guardar un valor transitorio (p. ej. "1" mientras se escribe "19").
    if (this._hasActiveAutomationEditor()) {
      this._renderDeferred = true;
      return;
    }

    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      // Segunda barrera: el usuario pudo enfocar un helper después de encolar el RAF.
      if (this._hasActiveAutomationEditor()) {
        this._renderDeferred = true;
        return;
      }
      this._renderDeferred = false;
      this.render();
    });
  }

  _toggleHomeAssistantMenu() {
    this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  _toggleTheme() {
    this._theme = this._theme === "dark" ? "light" : "dark";
    this._saveTheme();
    this._requestRender();
  }

  _notify(message, type = "success") {
    clearTimeout(this._toastTimer);
    this._toast = { message, type };
    this._requestRender();
    this._toastTimer = setTimeout(() => {
      this._toast = null;
      this._requestRender();
    }, 3000);
  }


  _sensorAutomationAlertNeeded() {
    if (!this._hass || !this.isConnected) return false;
    const config = this._config();
    const helpers = config.automationHelpers;
    const configured = this._helperOn(helpers.configInitialized);
    const climateRoutineEnabled = this._helperOn(helpers.morningEnabled) || this._helperOn(helpers.afternoonEnabled);
    const sensorState = this._state(config.referenceTemperatureSensor)?.state;
    const sensorValid = sensorState !== undefined && sensorState !== null && Number.isFinite(Number(sensorState));
    return configured && climateRoutineEnabled && !sensorValid;
  }

  _syncSensorAlertTimer() {
    const needed = this._sensorAutomationAlertNeeded();
    if (!needed) {
      if (this._sensorAlertTimer) clearInterval(this._sensorAlertTimer);
      this._sensorAlertTimer = null;
      return;
    }
    if (this._sensorAlertTimer) return;

    const emit = () => {
      if (!this._sensorAutomationAlertNeeded()) {
        clearInterval(this._sensorAlertTimer);
        this._sensorAlertTimer = null;
        return;
      }
      this._notify(
        "Sin datos de temperatura · automatizaciones de climatización pausadas hasta recuperar el sensor y completar 2 s de validación.",
        "error",
      );
    };

    emit();
    this._sensorAlertTimer = setInterval(emit, 10000);
  }

  async _callCanonicalState({ mode, temperature, fanMode }, optimisticKey, optimisticValue, successMessage) {
    if (!this._hass || !HVAC[mode]) return;

    if (optimisticKey) this._optimistic[optimisticKey] = optimisticValue;
    if (optimisticKey !== "mode") this._optimistic.mode = mode;
    this._pendingCount += 1;
    this._requestRender();

    const data = {
      source: "manual",
      hvac_mode: mode,
      force: true,
    };
    if (Number.isFinite(Number(temperature))) data.temperature = Number(temperature);
    if (fanMode && FAN[fanMode]) data.fan_mode = fanMode;

    try {
      // Toda intervención operativa del panel entra por el actuador canónico.
      // El backend cambia AUTO→MANUAL antes de emitir IR y verifica MASTER POWER.
      await this._hass.callService("script", "climatizacion_aplicar_estado", data);
      this._notify(successMessage, "success");
    } catch (error) {
      if (optimisticKey) delete this._optimistic[optimisticKey];
      delete this._optimistic.mode;
      this._notify("No se pudo aplicar el ajuste de climatización.", "error");
      console.error("Error ejecutando script.climatizacion_aplicar_estado:", error);
    } finally {
      this._pendingCount = Math.max(0, this._pendingCount - 1);
      this._requestRender();
    }
  }

  _setMode(mode) {
    if (!HVAC[mode] || mode === "off") return;
    const aggregate = this._aggregate();
    const displayedTemperature = this._displayedTemperature();
    this._saveLastMode(mode);
    const profile = { mode, fanMode: aggregate.fan };
    if (["cool", "heat", "auto"].includes(mode)) profile.temperature = displayedTemperature;
    this._callCanonicalState(profile, "mode", mode, `${HVAC[mode].label} activado.`);
  }

  _setPower() {
    const aggregate = this._aggregate();
    const config = this._config();
    const displayedTemperature = this._displayedTemperature();
    const desired = aggregate.on ? "off" : (this._lastOnMode || config.defaultOnMode);
    if (desired !== "off") this._saveLastMode(desired);

    const profile = { mode: desired };
    if (desired !== "off") {
      profile.fanMode = aggregate.fan;
      if (["cool", "heat", "auto"].includes(desired)) profile.temperature = displayedTemperature;
    }
    this._callCanonicalState(
      profile,
      "mode",
      desired,
      desired === "off" ? "Climatización apagada." : "Climatización encendida.",
    );
  }

  async _setMasterPower() {
    if (!this._hass) return;
    const config = this._config();
    const relay = this._state(config.masterRelay);
    if (!relay || ["unknown", "unavailable"].includes(relay.state)) {
      this._notify("La alimentación principal no está disponible en Home Assistant.", "error");
      return;
    }

    // Protección eléctrica simple: MASTER POWER no puede cortarse mientras el
    // estado lógico HVAC esté ON. En IR a lazo abierto, el apagado normal debe
    // hacerse primero por IR; solo después se permite retirar alimentación.
    // _aggregate().on incluye tanto el helper canónico como la orden optimista
    // pendiente, evitando que un doble clic rápido corte energía durante un ON.
    const hvacCommandedOn = this._aggregate().on;
    if (relay.state === "on" && hvacCommandedOn) {
      this._notify("Apaga primero la climatización", "error");
      return;
    }

    const turnOn = relay.state !== "on";
    this._pendingCount += 1;
    this._requestRender();
    try {
      await this._hass.callService("switch", turnOn ? "turn_on" : "turn_off", {
        entity_id: config.masterRelay,
      });
      this._notify(
        turnOn
          ? "Alimentación principal activada. Sincronizando climatización…"
          : "Alimentación principal desactivada.",
        "success",
      );
    } catch (error) {
      this._notify("No se pudo cambiar la alimentación principal.", "error");
      console.error("Error actualizando MASTER POWER:", error);
    } finally {
      this._pendingCount = Math.max(0, this._pendingCount - 1);
      this._requestRender();
    }
  }

  _setTemperature(value) {
    const aggregate = this._aggregate();
    if (!aggregate.on) return;
    const temperature = this._clampTemperature(value);
    this._draftTemp = null;
    this._updateTemperaturePreview(temperature);
    this._callCanonicalState(
      { mode: aggregate.mode, temperature, fanMode: aggregate.fan },
      "temp",
      temperature,
      `Temperatura ajustada a ${this._formatTemp(temperature)} °C.`,
    );
  }

  _stepTemperature(direction) {
    const config = this._config();
    const current = this._displayedTemperature();
    const next = this._clampTemperature(current + direction * config.tempStep);
    this._updateTemperaturePreview(next);
    this._setTemperature(next);
  }

  _setFan(fanMode) {
    if (!FAN[fanMode]) return;
    const aggregate = this._aggregate();
    if (!aggregate.on) return;
    const profile = { mode: aggregate.mode, fanMode };
    if (["cool", "heat", "auto"].includes(aggregate.mode)) {
      profile.temperature = this._displayedTemperature();
    }
    this._callCanonicalState(
      profile,
      "fan",
      fanMode,
      `Ventilador: ${FAN[fanMode]}.`,
    );
  }

  async _returnToAuto() {
    if (!this._hass) return;
    this._pendingCount += 1;
    this._requestRender();
    try {
      await this._hass.callService("script", "climatizacion_volver_auto", {});
      this._notify("Control automático retomado.", "success");
    } catch (error) {
      this._notify("No se pudo devolver el control a automático.", "error");
      console.error("Error ejecutando script.climatizacion_volver_auto:", error);
    } finally {
      this._pendingCount = Math.max(0, this._pendingCount - 1);
      this._requestRender();
    }
  }

  async _setHelperBoolean(entityId, desired) {
    if (!this._hass || !entityId) return;
    const entity = this._state(entityId);
    if (!entity || ["unknown", "unavailable"].includes(entity.state)) {
      this._notify(`No se encontró ${entityId}.`, "error");
      return;
    }

    this._pendingCount += 1;
    this._requestRender();
    try {
      await this._hass.callService("input_boolean", desired ? "turn_on" : "turn_off", { entity_id: entityId });
      this._notify(desired ? "Rutina activada." : "Rutina desactivada.", "success");
    } catch (error) {
      this._notify("No se pudo cambiar el estado de la rutina.", "error");
      console.error("Error actualizando input_boolean:", error);
    } finally {
      this._pendingCount = Math.max(0, this._pendingCount - 1);
      this._requestRender();
    }
  }

  async _setHelperTime(entityId, time, rule) {
    if (!this._hass || !entityId || !/^\d{2}:\d{2}$/.test(String(time || ""))) return;
    const helpers = this._config().automationHelpers;
    const values = {
      morningStart: rule === "morningStart" ? time : this._helperTime(helpers.morningStart, "08:00"),
      morningEnd: rule === "morningEnd" ? time : this._helperTime(helpers.morningEnd, "12:00"),
      afternoonStart: rule === "afternoonStart" ? time : this._helperTime(helpers.afternoonStart, "13:00"),
      afternoonEnd: rule === "afternoonEnd" ? time : this._helperTime(helpers.afternoonEnd, "17:00"),
    };

    if (!(values.morningStart < values.morningEnd)) {
      this._notify("La hora de inicio de la mañana debe ser anterior a su fin.", "error");
      this._requestRender();
      return;
    }
    if (!(values.afternoonStart < values.afternoonEnd)) {
      this._notify("La hora de inicio de la tarde debe ser anterior a su fin.", "error");
      this._requestRender();
      return;
    }
    if (values.morningEnd > values.afternoonStart) {
      this._notify("Los horarios de mañana y tarde no pueden solaparse.", "error");
      this._requestRender();
      return;
    }

    this._pendingCount += 1;
    this._requestRender();
    try {
      await this._hass.callService("input_datetime", "set_datetime", { entity_id: entityId, time: `${time}:00` });
      this._notify("Horario guardado en Home Assistant.", "success");
    } catch (error) {
      this._notify("No se pudo guardar el horario.", "error");
      console.error("Error actualizando input_datetime:", error);
    } finally {
      this._pendingCount = Math.max(0, this._pendingCount - 1);
      this._requestRender();
    }
  }

  _helperNumberConstraints(entityId, input = null) {
    const attributes = this._state(entityId)?.attributes || {};
    const numeric = (primary, fallback) => {
      const first = Number(primary);
      if (Number.isFinite(first)) return first;
      const second = Number(fallback);
      return Number.isFinite(second) ? second : null;
    };
    return {
      min: numeric(attributes.min, input?.min),
      max: numeric(attributes.max, input?.max),
      step: numeric(attributes.step, input?.step),
    };
  }

  _validateHelperNumber(entityId, rawValue, input = null) {
    const raw = String(rawValue ?? "").trim();
    const { min, max, step } = this._helperNumberConstraints(entityId, input);
    if (!raw) return { valid: false, message: "Introduce una temperatura antes de salir del campo." };

    const value = Number(raw);
    if (!Number.isFinite(value)) return { valid: false, message: "Introduce una temperatura numérica válida." };
    if (Number.isFinite(min) && value < min) {
      return { valid: false, message: `El umbral mínimo es ${this._formatTemp(min)} °C. No se envió ningún cambio.` };
    }
    if (Number.isFinite(max) && value > max) {
      return { valid: false, message: `El umbral máximo es ${this._formatTemp(max)} °C. No se envió ningún cambio.` };
    }

    if (Number.isFinite(step) && step > 0) {
      const base = Number.isFinite(min) ? min : 0;
      const steps = (value - base) / step;
      if (Math.abs(steps - Math.round(steps)) > 1e-7) {
        return { valid: false, message: `Usa incrementos de ${this._formatTemp(step)} °C. No se envió ningún cambio.` };
      }
    }

    // También respetamos la validación nativa del propio <input type="number">.
    if (input?.validity && !input.validity.valid) {
      return { valid: false, message: "El valor no cumple los límites permitidos. No se envió ningún cambio." };
    }
    return { valid: true, value };
  }

  async _setHelperNumber(entityId, rawValue, rule, input = null) {
    if (!this._hass || !entityId) return false;
    const validation = this._validateHelperNumber(entityId, rawValue, input);
    if (!validation.valid) {
      this._notify(validation.message, "error");
      return false;
    }
    const value = validation.value;
    const helpers = this._config().automationHelpers;
    const values = {
      morningOff: rule === "morningOff" ? value : this._helperNumber(helpers.morningOffTemp, 23),
      morningOn: rule === "morningOn" ? value : this._helperNumber(helpers.morningOnTemp, 20),
      morningTarget: rule === "morningTarget"
        ? value
        : this._helperNumber(helpers.morningTargetTemp, Math.ceil(this._helperNumber(helpers.morningOffTemp, 23))),
      afternoonOn: rule === "afternoonOn" ? value : this._helperNumber(helpers.afternoonOnTemp, 24),
      afternoonOff: rule === "afternoonOff" ? value : this._helperNumber(helpers.afternoonOffTemp, 21),
      afternoonTarget: rule === "afternoonTarget"
        ? value
        : this._helperNumber(helpers.afternoonTargetTemp, Math.floor(this._helperNumber(helpers.afternoonOffTemp, 21))),
    };

    if (!(values.morningOn < values.morningOff)) {
      this._notify("En calor, la temperatura de reencendido debe ser menor que la de apagado.", "error");
      return false;
    }
    if (!(values.afternoonOff < values.afternoonOn)) {
      this._notify("En frío, la temperatura de apagado debe ser menor que la de reencendido.", "error");
      return false;
    }
    if (rule === "morningTarget" && value < Math.ceil(values.morningOff)) {
      this._notify(`En calor, el objetivo no puede ser menor que ${this._formatTemp(Math.ceil(values.morningOff))} °C.`, "error");
      return false;
    }
    if (rule === "afternoonTarget" && value > Math.floor(values.afternoonOff)) {
      this._notify(`En frío, el objetivo no puede ser mayor que ${this._formatTemp(Math.floor(values.afternoonOff))} °C.`, "error");
      return false;
    }

    const followUp = [];
    if (rule === "morningOff" && values.morningTarget < Math.ceil(value)) {
      followUp.push({ entity_id: helpers.morningTargetTemp, value: Math.ceil(value) });
    }
    if (rule === "afternoonOff" && values.afternoonTarget > Math.floor(value)) {
      followUp.push({ entity_id: helpers.afternoonTargetTemp, value: Math.floor(value) });
    }

    this._pendingCount += 1;
    this._requestRender();
    try {
      await this._hass.callService("input_number", "set_value", { entity_id: entityId, value });
      for (const adjustment of followUp) {
        await this._hass.callService("input_number", "set_value", adjustment);
      }
      const isTarget = rule === "morningTarget" || rule === "afternoonTarget";
      const adjusted = followUp.length > 0 ? " Objetivo ajustado automáticamente para mantener una orden alcanzable." : "";
      this._notify(`${isTarget ? "Temperatura objetivo" : "Umbral"} guardado en Home Assistant.${adjusted}`, "success");
      return true;
    } catch (error) {
      this._notify("No se pudo guardar el ajuste de climatización.", "error");
      console.error("Error actualizando input_number:", error);
      return false;
    } finally {
      this._pendingCount = Math.max(0, this._pendingCount - 1);
      this._requestRender();
    }
  }

  async _setHelperSelect(entityId, option) {
    if (!this._hass || !entityId || !FAN[option]) return false;
    this._pendingCount += 1;
    this._requestRender();
    try {
      await this._hass.callService("input_select", "select_option", { entity_id: entityId, option });
      this._notify(`Ventilador del perfil guardado: ${FAN[option]}.`, "success");
      return true;
    } catch (error) {
      this._notify("No se pudo guardar la velocidad del ventilador del perfil.", "error");
      console.error("Error actualizando input_select de ventilador:", error);
      return false;
    } finally {
      this._pendingCount = Math.max(0, this._pendingCount - 1);
      this._requestRender();
    }
  }

  _handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target || !this._hass) return;

    switch (target.dataset.action) {
      case "toggle-menu":
        this._toggleHomeAssistantMenu();
        break;
      case "toggle-theme":
        this._toggleTheme();
        break;
      case "master-power":
        this._setMasterPower();
        break;
      case "power":
        this._setPower();
        break;
      case "mode":
        this._setMode(target.dataset.mode);
        break;
      case "fan":
        this._setFan(target.dataset.fan);
        break;
      case "temp-down":
        this._stepTemperature(-1);
        break;
      case "temp-up":
        this._stepTemperature(1);
        break;
      case "return-auto":
        this._returnToAuto();
        break;
      case "energy-range":
        this._setEnergyRange(target.dataset.range);
        break;
      case "energy-day-prev":
        this._shiftEnergyDay(-1);
        break;
      case "energy-day-next":
        this._shiftEnergyDay(1);
        break;
      case "energy-day-today":
        this._resetEnergyDay();
        break;
      case "energy-refresh":
        this._energyLastLoadedAt = 0;
        this._loadEnergyStatistics();
        break;
      case "toggle-profile": {
        const entityId = target.dataset.entity;
        this._setHelperBoolean(entityId, !this._helperOn(entityId));
        break;
      }
      default:
        break;
    }
  }

  _handleInput(event) {
    const input = event.target.closest('[data-control="temperature"]');
    if (!input) return;
    this._draftTemp = this._clampTemperature(input.value);
    this._updateTemperaturePreview(this._draftTemp);
  }

  _handleChange(event) {
    const temperatureInput = event.target.closest('[data-control="temperature"]');
    if (temperatureInput) {
      this._setTemperature(temperatureInput.value);
      return;
    }

    const timeInput = event.target.closest("[data-helper-time]");
    if (timeInput) {
      this._setHelperTime(timeInput.dataset.helperTime, timeInput.value, timeInput.dataset.rule);
      return;
    }

    const selectInput = event.target.closest("[data-helper-select]");
    if (selectInput) {
      this._setHelperSelect(selectInput.dataset.helperSelect, selectInput.value);
      return;
    }

    const numberInput = event.target.closest("[data-helper-number]");
    if (numberInput) {
      this._setHelperNumber(
        numberInput.dataset.helperNumber,
        numberInput.value,
        numberInput.dataset.rule,
        numberInput,
      );
    }
  }

  _updateTemperaturePreview(value) {
    const config = this._config();
    const tempValue = this.shadowRoot.querySelector("[data-temp-value]");
    const range = this.shadowRoot.querySelector('[data-control="temperature"]');
    const rangeFill = this.shadowRoot.querySelector("[data-temp-range]");
    if (tempValue) tempValue.textContent = this._formatTemp(value);
    if (range) range.value = String(this._clampTemperature(value));
    if (rangeFill) {
      const progress = ((value - config.minTemp) / (config.maxTemp - config.minTemp || 1)) * 100;
      rangeFill.style.setProperty("--range-progress", `${Math.max(0, Math.min(100, progress))}%`);
    }
  }

  _formatTemp(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _icon(name, className = "") {
    const path = ICON_PATHS[name] || ICON_PATHS.thermometer;
    return `<svg class="icon ${this._escape(className)}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  }

  _modeButton(mode, selected, disabled) {
    const item = HVAC[mode];
    return `
      <button
        class="mode-button tone-${item.tone} ${selected ? "is-active" : ""}"
        data-action="mode"
        data-mode="${this._escape(mode)}"
        aria-pressed="${selected}"
        ${disabled ? "disabled" : ""}
      >
        <span class="mode-icon">${this._icon(item.icon)}</span>
        <strong>${this._escape(item.short)}</strong>
      </button>
    `;
  }

  _fanButton(mode, selected, disabled) {
    return `
      <button
        class="fan-button ${selected ? "is-active" : ""}"
        data-action="fan"
        data-fan="${this._escape(mode)}"
        aria-pressed="${selected}"
        ${disabled ? "disabled" : ""}
      >${this._escape(FAN[mode])}</button>
    `;
  }

  render(force = false) {
    if (!this.shadowRoot || !this._hass) return;
    if (!force && this._hasActiveAutomationEditor()) {
      this._renderDeferred = true;
      return;
    }

    this.setAttribute("data-theme", this._theme);
    const config = this._config();
    const aggregate = this._aggregate();
    const mode = HVAC[aggregate.mode] || HVAC.off;
    const groupAvailable = !aggregate.fullyUnavailable && !aggregate.partialAvailability;
    const progress = ((aggregate.temperature - config.minTemp) / (config.maxTemp - config.minTemp || 1)) * 100;
    const helpers = config.automationHelpers;
    const referenceSensor = this._state(config.referenceTemperatureSensor);
    const referenceTemperature = Number(referenceSensor?.state);
    const referenceAvailable = Number.isFinite(referenceTemperature);
    const masterRelayState = this._state(config.masterRelay)?.state || "unavailable";
    const masterPowerOn = masterRelayState === "on";
    const masterPowerOff = masterRelayState === "off";
    const masterPowerOffLocked = masterPowerOn && aggregate.on;
    const automationConfigured = this._helperOn(helpers.configInitialized);
    const sessionSynchronized = this._helperOn(helpers.sessionSynchronized);
    const rawControlMode = this._state(helpers.controlMode)?.state;
    const controlMode = ["auto", "manual", "recovery", "fault"].includes(rawControlMode) ? rawControlMode : "recovery";
    const lastControlEventRaw = this._state(helpers.lastEvent)?.state;
    const lastControlEvent = lastControlEventRaw && !["unknown", "unavailable", "none", "None"].includes(lastControlEventRaw)
      ? String(lastControlEventRaw)
      : "";
    const commandedMode = this._state(helpers.commandedMode)?.state || "unknown";
    const operationalAvailable = automationConfigured && groupAvailable && referenceAvailable && sessionSynchronized && !["recovery", "fault"].includes(controlMode);
    const manualDisabled = !operationalAvailable;
    const controlsDisabled = manualDisabled || !aggregate.on;
    const morningEnabled = this._helperOn(helpers.morningEnabled);
    const afternoonEnabled = this._helperOn(helpers.afternoonEnabled);
    const morningStart = this._helperTime(helpers.morningStart, "08:00");
    const morningEnd = this._helperTime(helpers.morningEnd, "12:00");
    const afternoonStart = this._helperTime(helpers.afternoonStart, "13:00");
    const afternoonEnd = this._helperTime(helpers.afternoonEnd, "17:00");
    const morningOffTemp = this._helperNumber(helpers.morningOffTemp, 23);
    const morningOnTemp = this._helperNumber(helpers.morningOnTemp, 20);
    const morningTargetTemp = this._helperNumber(helpers.morningTargetTemp, Math.ceil(morningOffTemp));
    const afternoonOnTemp = this._helperNumber(helpers.afternoonOnTemp, 24);
    const afternoonOffTemp = this._helperNumber(helpers.afternoonOffTemp, 21);
    const afternoonTargetTemp = this._helperNumber(helpers.afternoonTargetTemp, Math.floor(afternoonOffTemp));
    const morningFanRaw = this._state(helpers.morningFan)?.state;
    const afternoonFanRaw = this._state(helpers.afternoonFan)?.state;
    const morningFan = FAN[morningFanRaw] ? morningFanRaw : "auto";
    const afternoonFan = FAN[afternoonFanRaw] ? afternoonFanRaw : "auto";

    // Mismo límite simple que aplica el backend: el objetivo puede separarse del
    // umbral del sensor, pero nunca en una dirección que impida alcanzarlo.
    const morningCommandTemp = Math.max(morningTargetTemp, Math.ceil(morningOffTemp));
    const afternoonCommandTemp = Math.min(afternoonTargetTemp, Math.floor(afternoonOffTemp));
    const energyEntity = this._state(config.energySensor);
    const energyDefinition = this._energyRangeDefinition();
    const currentDate = new Date();
    const monthName = currentDate.toLocaleDateString("es-BO", { month: "long" });
    const monthStartLabel = `Desde el 1 de ${monthName}`;
    const energyDayNavLabel = this._energyDayOffset === 0
      ? "Hoy"
      : this._energyDayOffset === -1
        ? "Ayer"
        : energyDefinition.start.toLocaleDateString("es-BO", { day: "2-digit", month: "short" }).replace(".", "");
    const temperatureHistoryEntity = this._state(config.temperatureHistorySensor);
    const currentOfficeTemperature = Number(temperatureHistoryEntity?.state);
    const energyPeriodTotal = this._energyRange !== "day" && Number.isFinite(this._energySelectedTotal)
      ? this._energySelectedTotal
      : this._energyData.reduce((sum, row) => sum + (Number(row.change) || 0), 0);
    const energyAverageDivisor = this._energyRange === "day"
      ? this._energyData.filter((row) => Number(row.samples) > 0 || row.live).length
      : this._energyData.length;
    const energyAverage = energyAverageDivisor ? energyPeriodTotal / energyAverageDivisor : 0;
    const energyPeak = this._energyData.length ? Math.max(...this._energyData.map((row) => Number(row.change) || 0)) : 0;
    const energyRecordedIntervals = this._energyRange === "day"
      ? this._energyData.filter((row) => Number(row.samples) > 0 || row.live).length
      : this._energyData.length;
    const energyIntervalStatus = this._energyRange === "day"
      ? energyDefinition.isToday
        ? `${energyRecordedIntervals} horas con estadísticas · hora actual en curso`
        : `${energyRecordedIntervals} horas con estadísticas · día histórico`
      : `${energyRecordedIntervals} intervalos registrados`;

    let systemLabel = "Sistema listo";
    let systemTone = "ready";
    let systemIcon = "check";
    if (!groupAvailable) {
      systemLabel = "IRIS + MIDEA no disponibles";
      systemTone = "error";
      systemIcon = "alert";
    } else if (controlMode === "fault") {
      systemLabel = "FAULT · climatización segura";
      systemTone = "error";
      systemIcon = "alert";
    } else if (controlMode === "recovery" || (automationConfigured && !sessionSynchronized)) {
      systemLabel = "RECOVERY · sincronizando";
      systemTone = "sync";
      systemIcon = "auto";
    } else if (aggregate.syncing) {
      systemLabel = "Sincronizando sistema";
      systemTone = "sync";
      systemIcon = "auto";
    } else if (masterPowerOff) {
      systemLabel = "Alimentación OFF · IR habilitado";
      systemTone = "off";
      systemIcon = "power";
    } else if (!masterPowerOn) {
      systemLabel = "Relay sin telemetría · IR habilitado";
      systemTone = "ready";
      systemIcon = "check";
    } else if (!aggregate.on) {
      systemLabel = "HVAC comandado OFF";
      systemTone = "off";
      systemIcon = "power";
    }

    const nextTheme = this._theme === "dark" ? "claro" : "oscuro";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #f26522;
          --primary-hover: #d95a1e;
          --primary-soft: rgba(242, 101, 34, 0.10);
          --primary-medium: rgba(242, 101, 34, 0.18);
          --primary-border: rgba(242, 101, 34, 0.38);
          --background: #061c2b;
          --background-secondary: #0b2b40;
          --background-deep: #051722;
          --surface: rgba(255, 255, 255, 0.045);
          --surface-strong: rgba(255, 255, 255, 0.065);
          --surface-hover: rgba(255, 255, 255, 0.075);
          --surface-control: rgba(255, 255, 255, 0.055);
          --text-primary: rgba(255, 255, 255, 0.94);
          --text-secondary: rgba(255, 255, 255, 0.70);
          --text-tertiary: rgba(255, 255, 255, 0.48);
          --border-subtle: rgba(255, 255, 255, 0.065);
          --border-default: rgba(255, 255, 255, 0.10);
          --header: rgba(8, 34, 50, 0.82);
          --shadow: rgba(0, 0, 0, 0.15);
          --success: #31c47a;
          --warning: #f2b94b;
          --error: #ef6b6b;
          --cool: #59a8ff;
          --heat: #ff765e;
          --dry: #45d0c5;
          --fan: #a791ff;
          --auto: #a8b7c7;
          --track: rgba(255,255,255,.09);
          --radius-sm: 12px;
          --radius-md: 17px;
          --radius-lg: 24px;
          --radius-pill: 999px;
          --motion: 180ms;
          display: block;
          min-height: 100%;
          container-type: inline-size;
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
          --surface: rgba(255, 255, 255, 0.78);
          --surface-strong: rgba(255, 255, 255, 0.95);
          --surface-hover: rgba(255, 255, 255, 1);
          --surface-control: rgba(9, 42, 62, 0.055);
          --text-primary: rgba(8, 35, 52, 0.94);
          --text-secondary: rgba(8, 35, 52, 0.68);
          --text-tertiary: rgba(8, 35, 52, 0.48);
          --border-subtle: rgba(8, 35, 52, 0.08);
          --border-default: rgba(8, 35, 52, 0.12);
          --header: rgba(255, 255, 255, 0.86);
          --shadow: rgba(20, 48, 65, 0.10);
          --track: rgba(8,35,52,.09);
          background:
            radial-gradient(circle at 10% 4%, rgba(242, 101, 34, 0.13), transparent 34%),
            radial-gradient(circle at 88% 0%, rgba(11, 43, 64, 0.08), transparent 30%),
            linear-gradient(155deg, var(--background-deep), var(--background-secondary) 60%, var(--background));
        }

        * { box-sizing: border-box; }
        button, input { font: inherit; }
        button { color: inherit; }
        button:focus-visible, input:focus-visible { outline: 3px solid rgba(56,189,248,.65); outline-offset: 2px; }
        button:disabled, input:disabled { cursor: not-allowed; opacity: .40; }
        .icon { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .icon .fill { fill: currentColor; stroke: none; }

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
        .menu-button, .theme-button {
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
        .menu-button:hover, .theme-button:hover { background: var(--surface-hover); border-color: var(--primary-border); }
        .menu-button:active, .theme-button:active { transform: scale(.96); }
        .brand { min-width: 0; display: flex; align-items: center; gap: 12px; }
        .logo-frame {
          width: 120px;
          height: 42px;
          padding: 4px 6px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 14px;
          background: rgba(255,255,255,.04);
        }
        .logo-frame img { width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1); mix-blend-mode: screen; }
        :host([data-theme="light"]) .logo-frame { background: rgba(8,35,52,.05); border-color: rgba(8,35,52,.12); }
        :host([data-theme="light"]) .logo-frame img { filter: none; mix-blend-mode: multiply; }
        .topbar-meta { margin-left: auto; display: flex; align-items: center; gap: 10px; }

        .dashboard { width: min(1320px, 100%); margin: 0 auto; padding: clamp(14px, 2vw, 26px); }
        .surface {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          background: var(--surface);
          box-shadow: 0 14px 36px var(--shadow), inset 0 1px 0 rgba(255,255,255,.025);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          overflow: hidden;
        }

        .hero {
          min-height: 112px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(0,1fr) auto;
          align-items: center;
          gap: 18px;
          background:
            radial-gradient(circle at 95% 18%, rgba(242,101,34,.16), transparent 35%),
            linear-gradient(135deg, var(--surface-strong), transparent 75%);
        }
        .hero h1 { margin: 0; font-family: Outfit, Inter, Arial, sans-serif; font-size: clamp(25px,3vw,38px); line-height: 1.05; letter-spacing: -.04em; }
        .hero h1 span { color: var(--primary); }
        .hero p { margin: 9px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
        .hero-actions { display: grid; grid-template-columns: auto auto auto; align-items: center; justify-content: end; gap: 14px; }
        .office-temperature {
          min-width: 176px;
          min-height: 58px;
          padding: 8px 14px 8px 10px;
          display: grid;
          grid-template-columns: 38px minmax(0,1fr);
          grid-template-areas: "icon label" "icon value" "icon meta";
          align-items: center;
          column-gap: 10px;
          border: 1px solid var(--primary-border);
          border-radius: 16px;
          background: linear-gradient(135deg, var(--primary-soft), var(--surface-control));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
        }
        .office-temperature.is-unavailable { border-color: rgba(239,107,107,.34); background: rgba(239,107,107,.07); }
        .office-temperature-icon {
          grid-area: icon;
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: var(--surface-strong);
          color: var(--primary);
        }
        .office-temperature.is-unavailable .office-temperature-icon { color: var(--error); }
        .office-temperature-icon .icon { width: 21px; height: 21px; }
        .office-temperature small { grid-area: label; color: var(--text-secondary); font-size: 8.5px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
        .office-temperature strong { grid-area: value; margin-top: 1px; font-family: Outfit, Inter, sans-serif; font-size: 28px; line-height: .98; letter-spacing: -.035em; white-space: nowrap; }
        .office-temperature-meta { grid-area: meta; margin-top: 3px; color: var(--text-tertiary); font-size: 8.5px; font-weight: 700; }
        .master-power-toggle {
          min-width: 154px;
          min-height: 50px;
          padding: 7px 12px 7px 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--border-default);
          border-radius: 16px;
          background: var(--surface-control);
          cursor: pointer;
          text-align: left;
          transition: transform var(--motion), background var(--motion), border-color var(--motion), box-shadow var(--motion);
        }
        .master-power-toggle:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--primary-border); }
        .master-power-toggle.is-on { border-color: rgba(49,196,122,.34); background: rgba(49,196,122,.09); }
        .master-power-toggle.is-off { border-color: var(--primary-border); background: var(--primary-soft); }
        .master-power-icon {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: var(--surface-strong);
          color: var(--text-tertiary);
        }
        .master-power-toggle.is-on .master-power-icon { color: var(--success); background: rgba(49,196,122,.12); }
        .master-power-toggle.is-off .master-power-icon { color: var(--primary); background: var(--primary-soft); }
        .master-power-copy { min-width: 0; display: grid; gap: 1px; }
        .master-power-copy small { color: var(--text-tertiary); font-size: 8px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
        .master-power-copy strong { font-size: 11px; font-weight: 850; }
        .system-state {
          min-width: 190px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 750;
        }
        .system-state i { width: 10px; height: 10px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 5px rgba(49,196,122,.12); }
        .system-state.sync i { background: var(--warning); box-shadow: 0 0 0 5px rgba(242,185,75,.12); animation: pulse 1.2s infinite; }
        .system-state.error i { background: var(--error); box-shadow: 0 0 0 5px rgba(239,107,107,.12); }
        .system-state.off i { background: var(--text-tertiary); box-shadow: 0 0 0 5px rgba(128,145,160,.10); }
        @keyframes pulse { 50% { opacity: .42; } }

        .control-grid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: minmax(390px, 1.05fr) minmax(350px, .95fr);
          gap: 14px;
          align-items: stretch;
        }
        .thermostat {
          min-height: 560px;
          padding: clamp(20px,3vw,34px);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% 40%, rgba(255,255,255,.035), transparent 42%),
            var(--surface);
        }
        .power-button {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-default);
          border-radius: 18px;
          background: var(--surface-control);
          cursor: pointer;
          transition: transform var(--motion), background var(--motion), border-color var(--motion), color var(--motion);
        }
        .power-button:hover { transform: translateY(-1px); border-color: var(--primary-border); }
        .power-button.is-on { color: var(--primary); background: var(--primary-soft); border-color: var(--primary-border); }
        .thermostat-title { margin: 0 0 18px; color: var(--text-secondary); font-size: 10px; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }

        .dial {
          --dial-color: var(--cool);
          --dial-soft: rgba(89,168,255,.12);
          --dial-progress: 50%;
          width: clamp(238px, 26vw, 310px);
          aspect-ratio: 1;
          padding: 14px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(var(--dial-color) var(--dial-progress), var(--track) 0);
          box-shadow: 0 18px 50px rgba(0,0,0,.12);
        }
        .dial.tone-heat { --dial-color: var(--heat); }
        .dial.tone-dry { --dial-color: var(--dry); }
        .dial.tone-fan { --dial-color: var(--fan); }
        .dial.tone-auto { --dial-color: var(--auto); }
        .dial.tone-off { --dial-color: var(--text-tertiary); }
        .dial-core {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          align-content: center;
          text-align: center;
          border: 1px solid var(--border-subtle);
          border-radius: 50%;
          background: linear-gradient(145deg, var(--surface-strong), var(--surface));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
        }
        .dial-mode-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          margin-bottom: 8px;
          border-radius: 15px;
          color: var(--dial-color);
          background: color-mix(in srgb, var(--dial-color) 12%, transparent);
        }
        .dial-value { display: inline-flex; align-items: flex-start; justify-content: center; color: var(--text-primary); font-variant-numeric: tabular-nums; }
        .dial-value strong { font-family: Outfit, Inter, sans-serif; font-size: clamp(62px,8vw,86px); line-height: .92; font-weight: 760; letter-spacing: -.075em; }
        .dial-value span { margin: 8px 0 0 7px; color: var(--text-secondary); font-size: 22px; font-weight: 800; }
        .dial-mode-label { margin-top: 8px; color: var(--text-secondary); font-size: 11px; font-weight: 700; }

        .temperature-control {
          width: min(500px, 100%);
          margin-top: 28px;
          display: grid;
          grid-template-columns: 52px minmax(160px,1fr) 52px;
          align-items: center;
          gap: 13px;
        }
        .temp-step {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-default);
          border-radius: 17px;
          background: var(--surface-control);
          cursor: pointer;
          transition: background var(--motion), transform var(--motion), border-color var(--motion);
        }
        .temp-step:hover { background: var(--surface-hover); border-color: var(--primary-border); }
        .temp-step:active { transform: scale(.96); }
        .temp-step .icon { width: 20px; height: 20px; }
        .range-box { min-width: 0; }
        .range-box input {
          --range-progress: ${progress.toFixed(2)}%;
          width: 100%;
          height: 7px;
          margin: 0;
          appearance: none;
          border-radius: 999px;
          outline: none;
          background: linear-gradient(90deg, var(--primary) var(--range-progress), var(--track) var(--range-progress));
          cursor: pointer;
        }
        .range-box input::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border: 6px solid var(--surface-strong);
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 0 1px var(--primary-border), 0 5px 14px rgba(0,0,0,.18);
        }
        .range-box input::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border: 6px solid var(--surface-strong);
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 0 1px var(--primary-border), 0 5px 14px rgba(0,0,0,.18);
        }
        .range-labels { display: flex; justify-content: space-between; margin-top: 9px; color: var(--text-tertiary); font-size: 10px; font-weight: 750; }

        .control-column { min-width: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 14px; }
        .control-card { padding: 20px; }
        .card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 15px; }
        .card-heading h2 { margin: 0; font-family: Outfit, Inter, sans-serif; font-size: 17px; letter-spacing: -.02em; }
        .card-heading span { color: var(--text-tertiary); font-size: 10px; font-weight: 750; }

        .mode-grid { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 8px; }
        .mode-button {
          min-width: 0;
          min-height: 88px;
          padding: 12px 5px 10px;
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 8px;
          border: 1px solid var(--border-default);
          border-radius: 16px;
          background: var(--surface-control);
          color: var(--text-secondary);
          cursor: pointer;
          transition: transform var(--motion), background var(--motion), border-color var(--motion), color var(--motion);
        }
        .mode-button:hover { transform: translateY(-1px); background: var(--surface-hover); }
        .mode-button strong { max-width: 100%; overflow: hidden; text-overflow: ellipsis; font-size: 10px; white-space: nowrap; }
        .mode-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 13px; background: rgba(255,255,255,.035); }
        .mode-button.is-active.tone-cool { color: var(--cool); background: rgba(89,168,255,.10); border-color: rgba(89,168,255,.30); }
        .mode-button.is-active.tone-heat { color: var(--heat); background: rgba(255,118,94,.10); border-color: rgba(255,118,94,.30); }
        .mode-button.is-active.tone-dry { color: var(--dry); background: rgba(69,208,197,.10); border-color: rgba(69,208,197,.30); }
        .mode-button.is-active.tone-fan { color: var(--fan); background: rgba(167,145,255,.10); border-color: rgba(167,145,255,.30); }
        .mode-button.is-active.tone-auto { color: var(--auto); background: rgba(168,183,199,.10); border-color: rgba(168,183,199,.28); }

        /* Ventilador como selector segmentado: cuatro opciones iguales, sin cápsulas sobredimensionadas. */
        .fan-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 4px;
          padding: 4px;
          border: 1px solid var(--border-default);
          border-radius: 15px;
          background: var(--surface-control);
        }
        .fan-button {
          min-width: 0;
          min-height: 42px;
          padding: 0 8px;
          border: 1px solid transparent;
          border-radius: 11px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .01em;
          cursor: pointer;
          transition: background var(--motion), border-color var(--motion), color var(--motion), transform var(--motion), box-shadow var(--motion);
        }
        .fan-button:hover:not(:disabled) {
          color: var(--text-primary);
          background: var(--surface-hover);
        }
        .fan-button:active:not(:disabled) { transform: scale(.98); }
        .fan-button.is-active {
          color: var(--primary);
          border-color: var(--primary-border);
          background: var(--primary-soft);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.025);
        }

        .status-card { display: block; }
        .status-block { display: grid; gap: 12px; }
        .status-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 34px; }
        .status-line + .status-line { border-top: 1px solid var(--border-subtle); padding-top: 12px; }
        .status-label { display: flex; align-items: center; gap: 9px; color: var(--text-secondary); font-size: 11px; }
        .status-label .icon { width: 18px; height: 18px; color: var(--text-tertiary); }
        .status-line strong { font-size: 11px; text-align: right; }

        .automation-shell { margin-top: 14px; padding: 20px; }
        .automation-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
        .automation-header h2 { margin: 0; font-family: Outfit, Inter, sans-serif; font-size: 19px; letter-spacing: -.025em; }
        .automation-header p { margin: 6px 0 0; color: var(--text-secondary); font-size: 11px; line-height: 1.55; }
        .sensor-chip { flex: 0 0 auto; min-width: 152px; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: 15px; background: var(--surface-control); text-align: right; }
        .sensor-chip small, .sensor-chip strong { display: block; }
        .sensor-chip small { color: var(--text-tertiary); font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .sensor-chip strong { margin-top: 4px; font-family: Outfit, Inter, sans-serif; font-size: 20px; }
        .profiles-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .profile-card { min-width: 0; padding: 17px; border: 1px solid var(--border-default); border-radius: 18px; background: var(--surface-control); }
        .profile-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .profile-title { min-width: 0; }
        .profile-title strong { display: block; font-family: Outfit, Inter, sans-serif; font-size: 15px; }
        .profile-toggle { flex: 0 0 auto; min-width: 92px; height: 36px; padding: 4px 9px 4px 5px; display: flex; align-items: center; gap: 7px; border: 1px solid var(--border-default); border-radius: var(--radius-pill); background: var(--surface-strong); color: var(--text-secondary); cursor: pointer; }
        .profile-toggle i { width: 26px; height: 26px; border-radius: 50%; background: var(--text-tertiary); transition: background var(--motion), transform var(--motion); }
        .profile-toggle strong { font-size: 9px; text-transform: uppercase; letter-spacing: .04em; }
        .profile-toggle.is-on { color: var(--success); border-color: rgba(49,196,122,.30); background: rgba(49,196,122,.08); }
        .profile-toggle.is-on i { background: var(--success); }
        .profile-fields { margin-top: 15px; display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 9px; }
        .profile-field { min-width: 0; display: grid; gap: 6px; }
        .profile-field-wide { grid-column: 1 / -1; }
        .profile-field label { color: var(--text-tertiary); font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
        .profile-field input, .profile-field select { width: 100%; min-width: 0; height: 42px; padding: 0 10px; border: 1px solid var(--border-default); border-radius: 12px; outline: none; background: var(--surface-strong); color: var(--text-primary); font-size: 11px; font-weight: 750; color-scheme: dark; }
        :host([data-theme="light"]) .profile-field input, :host([data-theme="light"]) .profile-field select { color-scheme: light; }
        .profile-field input:focus, .profile-field select:focus { border-color: var(--primary-border); box-shadow: 0 0 0 3px var(--primary-soft); }
        .profile-field select { cursor: pointer; }
        .profile-command { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: 13px; background: var(--surface-strong); }
        .profile-command strong { display: block; font-size: 11px; letter-spacing: .01em; }
        .profile-command.tone-heat strong { color: var(--heat); }
        .profile-command.tone-cool strong { color: var(--cool); }
        .profile-summary { margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 10px; line-height: 1.55; }
        .profile-summary strong { color: var(--text-primary); }
        .automation-event { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: 13px; background: var(--surface-strong); display: grid; gap: 3px; }
        .automation-event small { color: var(--text-muted); font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
        .automation-event strong { color: var(--text-secondary); font-size: 10px; line-height: 1.5; overflow-wrap: anywhere; }
        .automation-warning { margin-top: 12px; padding: 10px 12px; border: 1px solid rgba(242,185,75,.24); border-radius: 13px; background: rgba(242,185,75,.08); color: var(--warning); font-size: 10px; line-height: 1.5; }
        .automation-warning.error { border-color: rgba(239,107,107,.28); background: rgba(239,107,107,.08); color: var(--error); }

        .energy-shell { margin-top: 14px; padding: 20px; overflow: hidden; }
        .energy-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .energy-heading { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .energy-heading-icon { width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center; border-radius: 13px; background: var(--primary-soft); color: var(--primary); }
        .energy-heading-icon .icon { width: 20px; height: 20px; }
        .energy-header h2 { margin: 0; font-family: Outfit, Inter, sans-serif; font-size: 19px; letter-spacing: -.025em; }
        .energy-current { min-width: 132px; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: 15px; background: var(--surface-control); text-align: right; }
        .energy-current small, .energy-current strong, .energy-current span { display: block; }
        .energy-current small { color: var(--text-tertiary); font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .energy-current strong { margin-top: 4px; font-family: Outfit, Inter, sans-serif; font-size: 20px; }
        .energy-current span { margin-top: 3px; color: var(--text-tertiary); font-size: 9px; text-transform: capitalize; }
        .energy-toolbar { margin-top: 17px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .energy-tabs { display: inline-flex; gap: 4px; padding: 4px; border: 1px solid var(--border-default); border-radius: 13px; background: var(--surface-control); }
        .energy-tab, .energy-refresh { border: 0; outline: none; background: transparent; color: var(--text-secondary); cursor: pointer; font: inherit; font-weight: 800; }
        .energy-tab { min-width: 68px; height: 34px; padding: 0 12px; border-radius: 9px; font-size: 10px; }
        .energy-tab:hover, .energy-refresh:hover { color: var(--text-primary); background: var(--surface-hover); }
        .energy-tab.is-active { color: var(--primary); background: var(--primary-soft); box-shadow: inset 0 0 0 1px var(--primary-border); }
        .energy-refresh { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid var(--border-default); border-radius: 12px; background: var(--surface-control); }
        .energy-refresh .icon { width: 18px; height: 18px; }
        .energy-refresh:disabled { opacity: .45; cursor: default; }
        .energy-toolbar-actions { display: flex; align-items: center; gap: 8px; }
        .energy-day-nav { display: inline-flex; align-items: center; gap: 4px; padding: 4px; border: 1px solid var(--border-default); border-radius: 13px; background: var(--surface-control); }
        .energy-day-nav button { height: 30px; border: 0; border-radius: 9px; background: transparent; color: var(--text-secondary); cursor: pointer; font: inherit; font-size: 10px; font-weight: 800; }
        .energy-day-nav button:hover:not(:disabled) { color: var(--text-primary); background: var(--surface-hover); }
        .energy-day-nav button:disabled { opacity: .35; cursor: default; }
        .energy-day-step { width: 30px; font-size: 16px !important; line-height: 1; }
        .energy-day-current { min-width: 58px; padding: 0 9px; color: var(--primary) !important; }
        .energy-summary { margin-top: 13px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 9px; }
        .energy-stat { min-width: 0; padding: 13px 14px; border: 1px solid var(--border-default); border-radius: 15px; background: var(--surface-control); }
        .energy-stat small { display: block; color: var(--text-tertiary); font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
        .energy-stat strong { display: block; margin-top: 5px; font-family: Outfit, Inter, sans-serif; font-size: clamp(17px,2vw,24px); }
        .energy-stat span { display: block; margin-top: 3px; color: var(--text-tertiary); font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .energy-chart-card { margin-top: 10px; padding: 14px 12px 8px; border: 1px solid var(--border-default); border-radius: 18px; background: var(--surface-control); }
        .energy-chart-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 1px 3px 10px; }
        .energy-chart-title strong { font-size: 11px; }
        .energy-chart-title > span { color: var(--text-tertiary); font-size: 9px; text-transform: capitalize; }
        .energy-chart-legend { margin-top: 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; color: var(--text-tertiary); font-size: 9px; }
        .energy-chart-legend span { display: inline-flex; align-items: center; gap: 5px; }
        .energy-chart-legend span::before { content: ""; width: 13px; height: 3px; border-radius: 999px; background: var(--primary); }
        .energy-chart-legend .legend-temperature::before { height: 2px; background: var(--cool); }
        .temperature-warning { margin: 0 3px 8px; display: flex; align-items: center; gap: 6px; color: var(--warning); font-size: 9px; }
        .temperature-warning .icon { width: 14px; height: 14px; }
        .energy-chart-layout { width: 100%; display: flex; min-width: 0; align-items: stretch; }
        .energy-y-axis { position: relative; z-index: 2; flex: 0 0 54px; height: 300px; border-right: 1px solid var(--border-subtle); background: var(--surface-control); }
        .temperature-y-axis { position: relative; z-index: 2; flex: 0 0 48px; height: 300px; border-left: 1px solid var(--border-subtle); background: var(--surface-control); }
        .energy-y-unit { position: absolute; top: 2px; left: 5px; color: var(--text-tertiary); font-size: 9px; font-weight: 900; letter-spacing: .04em; }
        .energy-y-tick { position: absolute; right: 8px; transform: translateY(-50%); color: var(--text-tertiary); font-size: 10px; font-weight: 700; white-space: nowrap; }
        .temperature-y-unit { position: absolute; top: 2px; right: 7px; color: var(--cool); font-size: 9px; font-weight: 900; letter-spacing: .04em; }
        .temperature-y-tick { position: absolute; left: 8px; transform: translateY(-50%); color: var(--cool); font-size: 10px; font-weight: 750; white-space: nowrap; }
        .energy-chart-wrap { min-width: 0; flex: 1 1 auto; overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; scrollbar-width: thin; scroll-behavior: smooth; }
        .energy-chart { display: block; width: auto; min-width: 100%; height: 300px; overflow: visible; }
        .energy-grid-line { stroke: var(--border-subtle); stroke-width: 1; }
        .energy-axis-text { fill: var(--text-tertiary); font-family: Inter, sans-serif; font-size: 10px; font-weight: 700; }
        .energy-current-label { fill: var(--primary); font-family: Inter, sans-serif; font-size: 9px; font-weight: 900; letter-spacing: .03em; text-transform: uppercase; }
        .energy-bar { fill: var(--primary); opacity: .82; transition: opacity var(--motion), transform var(--motion); transform-box: fill-box; transform-origin: bottom; }
        .energy-bar.is-partial { opacity: 1; stroke: var(--primary); stroke-width: 1.2; stroke-dasharray: 4 3; }
        .energy-bar-group:hover .energy-bar { opacity: 1; }
        .temperature-line { fill: none; stroke: var(--cool); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
        .temperature-point { fill: var(--surface-control); stroke: var(--cool); stroke-width: 2; vector-effect: non-scaling-stroke; }
        @container (max-width: 520px) { .energy-y-axis { flex-basis: 48px; } .temperature-y-axis { flex-basis: 43px; } .energy-current { min-width: 150px; } .energy-toolbar { align-items: flex-start; } .energy-toolbar-actions { flex-wrap: wrap; justify-content: flex-end; } }
        .energy-empty { min-height: 240px; display: flex; align-items: center; justify-content: center; gap: 9px; padding: 28px; color: var(--text-tertiary); text-align: center; font-size: 11px; line-height: 1.5; }
        .energy-empty.error { color: var(--error); }
        .energy-empty .icon { width: 20px; height: 20px; flex: 0 0 auto; }
        .energy-spinner { width: 18px; height: 18px; border: 2px solid var(--border-default); border-top-color: var(--primary); border-radius: 50%; animation: energy-spin .8s linear infinite; }
        @keyframes energy-spin { to { transform: rotate(360deg); } }

        .toast {
          position: fixed;
          left: 50%;
          bottom: 22px;
          z-index: 50;
          max-width: min(430px, calc(100vw - 28px));
          transform: translateX(-50%);
          padding: 11px 15px;
          border: 1px solid var(--border-default);
          border-radius: 14px;
          background: rgba(7,24,35,.96);
          color: rgba(255,255,255,.94);
          box-shadow: 0 14px 38px rgba(0,0,0,.28);
          font-size: 11px;
          font-weight: 750;
        }
        .toast.error { border-color: rgba(239,107,107,.38); }

        @media (max-width: 960px) {
          .hero { grid-template-columns: 1fr; }
          .hero-copy { padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); }
          .hero-actions { width: 100%; grid-template-columns: minmax(176px,.72fr) minmax(154px,.9fr) minmax(150px,.75fr); justify-content: stretch; }
          .office-temperature, .master-power-toggle, .system-state { min-width: 0; width: 100%; }
          .system-state { justify-content: flex-start; }
          .control-grid { grid-template-columns: 1fr; }
          .thermostat { min-height: 500px; }
          .control-column { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
          .status-card { grid-column: 1 / -1; }
        }

        @media (max-width: 650px) {
          .topbar { min-height: 58px; padding: 8px 12px; }
          .logo-frame { width: 104px; height: 38px; }
          .menu-button, .theme-button { width: 40px; height: 40px; flex-basis: 40px; }
          .dashboard { padding: 12px 10px 18px; }
          .hero { min-height: 0; padding: 16px 17px; grid-template-columns: 1fr; gap: 13px; }
          .hero-copy { padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); }
          .hero h1 { font-size: clamp(23px,7vw,31px); }
          .hero-actions { width: 100%; grid-template-columns: minmax(0,1fr) auto; justify-content: stretch; align-items: center; gap: 11px; }
          .office-temperature { grid-column: 1 / -1; min-height: 76px; grid-template-columns: 46px minmax(0,1fr); padding: 10px 14px; }
          .office-temperature-icon { width: 46px; height: 46px; border-radius: 14px; }
          .office-temperature-icon .icon { width: 24px; height: 24px; }
          .office-temperature small { font-size: 9px; }
          .office-temperature strong { font-size: clamp(30px,9vw,38px); }
          .office-temperature-meta { font-size: 9px; }
          .master-power-toggle { min-width: 0; width: min(100%, 190px); }
          .system-state { min-width: 0; width: auto; justify-content: flex-start; }
          .control-grid { margin-top: 10px; gap: 10px; }
          .thermostat { min-height: 430px; padding: 22px 13px 18px; }
          .power-button { top: 14px; right: 14px; width: 48px; height: 48px; border-radius: 16px; }
          .thermostat-title { margin-top: 8px; }
          .dial { width: min(236px, 70vw); }
          .dial-value strong { font-size: clamp(61px,20vw,74px); }
          .temperature-control { grid-template-columns: 48px minmax(130px,1fr) 48px; gap: 10px; margin-top: 24px; }
          .temp-step { width: 48px; height: 48px; border-radius: 15px; }
          .control-column { grid-template-columns: 1fr; gap: 10px; }
          .status-card { grid-column: auto; }
          .control-card { padding: 16px 12px; }
          .automation-shell { margin-top: 10px; padding: 16px 12px; }
          .automation-header { display: grid; grid-template-columns: 1fr; }
          .sensor-chip { min-width: 0; width: 100%; text-align: left; }
          .profiles-grid { grid-template-columns: 1fr; }
          .energy-shell { margin-top: 10px; padding: 16px 12px; }
          .energy-header { display: grid; grid-template-columns: 1fr; }
          .energy-current { min-width: 0; width: 100%; text-align: left; }
          .energy-toolbar { align-items: stretch; }
          .energy-tabs { flex: 1 1 auto; display: grid; grid-template-columns: repeat(3,1fr); }
          .energy-tab { min-width: 0; padding-inline: 7px; }
          .energy-summary { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .energy-chart { min-width: 560px; }
          .mode-grid { gap: 6px; }
          .mode-button { min-height: 78px; border-radius: 14px; padding-inline: 2px; }
          .mode-icon { width: 34px; height: 34px; border-radius: 12px; }
          .mode-button strong { font-size: 9px; }
          .fan-grid { gap: 3px; padding: 3px; border-radius: 13px; }
          .fan-button { min-height: 40px; padding-inline: 5px; border-radius: 10px; font-size: 9.5px; }
        }

        @media (max-width: 390px) {
          .dashboard { padding-inline: 8px; }
          .hero, .thermostat, .control-card { border-radius: 20px; }
          .hero-actions { grid-template-columns: minmax(0,1fr) auto; gap: 9px; }
          .office-temperature { min-height: 72px; padding: 9px 11px; }
          .office-temperature strong { font-size: 31px; }
          .master-power-toggle { padding-right: 9px; }
          .master-power-copy strong { font-size: 10px; }
          .system-state { font-size: 10px; gap: 8px; }
          .mode-button strong { font-size: 8.5px; }
          .temperature-control { grid-template-columns: 46px minmax(110px,1fr) 46px; gap: 8px; }
          .temp-step { width: 46px; height: 46px; }
          .energy-summary { grid-template-columns: 1fr; }
          .energy-stat { padding: 11px 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
        }

        @media (prefers-reduced-transparency: reduce) {
          .surface, .topbar { backdrop-filter: none; -webkit-backdrop-filter: none; }
        }
      </style>

      <div class="app-shell">
        <header class="topbar">
          <div class="topbar-start">
            <button class="menu-button" data-action="toggle-menu" aria-label="Abrir menú de Home Assistant" title="Abrir menú">
              ${this._icon("menu")}
            </button>
            <div class="brand">
              <div class="logo-frame"><img src="${this._escape(config.logo)}" alt="Witmind"></div>
            </div>
          </div>
          <div class="topbar-meta">
            <button class="theme-button" data-action="toggle-theme" aria-label="Cambiar a tema ${nextTheme}" title="Cambiar a tema ${nextTheme}">
              ${this._theme === "dark" ? this._icon("moon") : this._icon("themeSun")}
            </button>
          </div>
        </header>

        <main class="dashboard">
          <section class="surface hero">
            <div class="hero-copy">
              <h1>${this._escape(config.title)} <span>Witmind</span></h1>
              <p>${this._escape(config.subtitle)}</p>
            </div>
            <div class="hero-actions">
              <div class="office-temperature ${referenceAvailable ? "" : "is-unavailable"}" role="status" aria-label="${this._escape(config.referenceTemperatureLabel)}: ${referenceAvailable ? `${this._formatTemp(referenceTemperature)} grados Celsius` : "sin datos"}">
                <span class="office-temperature-icon">${this._icon("thermometer")}</span>
                <small>${this._escape(config.referenceTemperatureLabel)}</small>
                <strong>${referenceAvailable ? `${this._formatTemp(referenceTemperature)} °C` : "—"}</strong>
                <span class="office-temperature-meta">${referenceAvailable ? "Ambiente actual" : "Sin datos del sensor"}</span>
              </div>
              <button
                class="master-power-toggle ${masterPowerOn ? "is-on" : masterPowerOff ? "is-off" : "is-unavailable"}"
                data-action="master-power"
                aria-pressed="${masterPowerOn}"
                aria-label="${masterPowerOffLocked ? "Alimentación principal protegida: apaga primero la climatización" : masterPowerOn ? "Desactivar alimentación principal de climatización" : "Activar alimentación principal de climatización"}"
                title="${masterPowerOffLocked ? "Apaga primero la climatización" : masterPowerOn ? "Desactivar alimentación principal" : masterPowerOff ? "Activar alimentación principal" : "Alimentación no disponible"}"
                ${!masterPowerOn && !masterPowerOff ? "disabled" : ""}
              >
                <span class="master-power-icon">${this._icon("power")}</span>
                <span class="master-power-copy">
                  <small>Alimentación</small>
                  <strong>${masterPowerOffLocked ? "ENCENDIDA · HVAC ACTIVO" : masterPowerOn ? "ENCENDIDA" : masterPowerOff ? "APAGADA · ENCENDER" : "NO DISPONIBLE"}</strong>
                </span>
              </button>
              <div class="system-state ${systemTone}">
                <i aria-hidden="true"></i>
                <span>${this._escape(systemLabel)}</span>
              </div>
            </div>
          </section>

          <section class="control-grid">
            <article class="surface thermostat">
              <button
                class="power-button ${aggregate.on ? "is-on" : ""}"
                data-action="power"
                aria-label="${aggregate.on ? "Apagar" : "Encender"} climatización"
                title="${aggregate.on ? "Apagar climatización" : "Encender climatización"}"
                ${manualDisabled ? "disabled" : ""}
              >${this._icon("power")}</button>

              <p class="thermostat-title">Temperatura objetivo</p>

              <div class="dial tone-${this._escape(mode.tone)}" style="--dial-progress:${progress.toFixed(2)}%">
                <div class="dial-core">
                  <div class="dial-mode-icon">${this._icon(mode.icon)}</div>
                  <div class="dial-value"><strong data-temp-value>${this._formatTemp(aggregate.temperature)}</strong><span>°C</span></div>
                  <div class="dial-mode-label">${this._escape(mode.label)}</div>
                </div>
              </div>

              <div class="temperature-control">
                <button class="temp-step" data-action="temp-down" aria-label="Bajar temperatura" ${controlsDisabled ? "disabled" : ""}>${this._icon("minus")}</button>
                <div class="range-box">
                  <input
                    data-control="temperature"
                    data-temp-range
                    type="range"
                    min="${this._escape(config.minTemp)}"
                    max="${this._escape(config.maxTemp)}"
                    step="${this._escape(config.tempStep)}"
                    value="${this._escape(aggregate.temperature)}"
                    aria-label="Temperatura objetivo"
                    style="--range-progress:${progress.toFixed(2)}%"
                    ${controlsDisabled ? "disabled" : ""}
                  >
                  <div class="range-labels"><span>${this._formatTemp(config.minTemp)}°</span><span>${this._formatTemp(config.maxTemp)}°</span></div>
                </div>
                <button class="temp-step" data-action="temp-up" aria-label="Subir temperatura" ${controlsDisabled ? "disabled" : ""}>${this._icon("plus")}</button>
              </div>
            </article>

            <div class="control-column">
              <article class="surface control-card">
                <div class="card-heading"><h2>Modo</h2><span>${aggregate.on ? this._escape(mode.label) : "Apagado"}</span></div>
                <div class="mode-grid">
                  ${["cool", "heat", "auto", "dry", "fan_only"].map((item) => this._modeButton(item, aggregate.on && aggregate.mode === item, manualDisabled)).join("")}
                </div>
              </article>

              <article class="surface control-card fan-card">
                <div class="card-heading"><h2>Ventilador</h2><span>${this._escape(FAN[aggregate.fan])}</span></div>
                <div class="fan-grid" role="group" aria-label="Velocidad del ventilador">
                  ${["auto", "low", "medium", "high"].map((item) => this._fanButton(item, aggregate.fan === item, controlsDisabled)).join("")}
                </div>
              </article>

              <article class="surface control-card status-card">
                <div>
                  <div class="card-heading"><h2>Estado</h2></div>
                  <div class="status-block">
                    <div class="status-line">
                      <span class="status-label">${this._icon(systemIcon)} Sistema</span>
                      <strong>${this._escape(systemLabel)}</strong>
                    </div>
                    <div class="status-line">
                      <span class="status-label">${this._icon("power")} Alimentación</span>
                      <strong>${masterPowerOn ? "ON" : masterPowerOff ? "OFF" : "No disponible"}</strong>
                    </div>
                    <div class="status-line">
                      <span class="status-label">${this._icon("infrared")} Comandado</span>
                      <strong>${this._escape(String(commandedMode).toUpperCase())}</strong>
                    </div>
                    <div class="status-line">
                      <span class="status-label">${this._icon("thermometer")} Objetivo</span>
                      <strong>${this._formatTemp(aggregate.temperature)} °C</strong>
                    </div>
                    <div class="status-line">
                      <span class="status-label">${this._icon("fan")} Ventilación</span>
                      <strong>${this._escape(FAN[aggregate.fan])}</strong>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section class="surface automation-shell">
            <div class="automation-header">
              <div>
                <h2>Automatización climática</h2>
                <p>Horarios persistentes en Home Assistant · Lunes a sábado · Mañana siempre Calor · Tarde siempre Frío · Ventilador configurable por perfil.</p>
              </div>
              <div class="sensor-chip">
                <small>${this._escape(config.referenceTemperatureLabel)}</small>
                <strong>${referenceAvailable ? `${this._formatTemp(referenceTemperature)} °C` : "—"}</strong>
              </div>
            </div>

            <div class="profiles-grid">
              <article class="profile-card">
                <div class="profile-top">
                  <div class="profile-title">
                    <strong>Mañana · Calor</strong>
                  </div>
                  <button class="profile-toggle ${morningEnabled ? "is-on" : ""}" data-action="toggle-profile" data-entity="${this._escape(helpers.morningEnabled)}" aria-pressed="${morningEnabled}" ${!automationConfigured ? "disabled" : ""}>
                    <i aria-hidden="true"></i><strong>${morningEnabled ? "Activa" : "Inactiva"}</strong>
                  </button>
                </div>
                <div class="profile-fields">
                  <div class="profile-field"><label>Inicio</label><input type="time" value="${this._escape(morningStart)}" data-helper-time="${this._escape(helpers.morningStart)}" data-rule="morningStart" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Fin</label><input type="time" value="${this._escape(morningEnd)}" data-helper-time="${this._escape(helpers.morningEnd)}" data-rule="morningEnd" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Sensor · apagar ≥</label><input type="number" min="16" max="30" step="0.5" value="${this._escape(morningOffTemp)}" data-helper-number="${this._escape(helpers.morningOffTemp)}" data-rule="morningOff" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Sensor · reencender ≤</label><input type="number" min="16" max="30" step="0.5" value="${this._escape(morningOnTemp)}" data-helper-number="${this._escape(helpers.morningOnTemp)}" data-rule="morningOn" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Temperatura enviada</label><input type="number" min="${Math.ceil(morningOffTemp)}" max="30" step="1" value="${this._escape(morningCommandTemp)}" data-helper-number="${this._escape(helpers.morningTargetTemp)}" data-rule="morningTarget" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Ventilador al encender</label><select data-helper-select="${this._escape(helpers.morningFan)}" ${!automationConfigured ? "disabled" : ""}>${Object.entries(FAN).map(([value,label]) => `<option value="${value}" ${morningFan === value ? "selected" : ""}>${this._escape(label)}</option>`).join("")}</select></div>
                </div>
                <div class="profile-command tone-heat">
                  <strong>CALOR · ${this._formatTemp(morningCommandTemp)} °C · VENTILADOR ${this._escape(FAN[morningFan]).toUpperCase()}</strong>
                </div>
                <div class="profile-summary">
                  <strong>${this._escape(morningStart)}–${this._escape(morningEnd)}</strong> · Al llegar a <strong>${this._formatTemp(morningOffTemp)} °C</strong> del sensor se ordena OFF. Cuando el sensor baja a <strong>${this._formatTemp(morningOnTemp)} °C o menos</strong>, se ordena de nuevo <strong>CALOR + ${this._formatTemp(morningCommandTemp)} °C + ventilador ${this._escape(FAN[morningFan])}</strong>.
                </div>
              </article>

              <article class="profile-card">
                <div class="profile-top">
                  <div class="profile-title">
                    <strong>Tarde · Frío</strong>
                  </div>
                  <button class="profile-toggle ${afternoonEnabled ? "is-on" : ""}" data-action="toggle-profile" data-entity="${this._escape(helpers.afternoonEnabled)}" aria-pressed="${afternoonEnabled}" ${!automationConfigured ? "disabled" : ""}>
                    <i aria-hidden="true"></i><strong>${afternoonEnabled ? "Activa" : "Inactiva"}</strong>
                  </button>
                </div>
                <div class="profile-fields">
                  <div class="profile-field"><label>Inicio</label><input type="time" value="${this._escape(afternoonStart)}" data-helper-time="${this._escape(helpers.afternoonStart)}" data-rule="afternoonStart" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Fin</label><input type="time" value="${this._escape(afternoonEnd)}" data-helper-time="${this._escape(helpers.afternoonEnd)}" data-rule="afternoonEnd" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Sensor · reencender ≥</label><input type="number" min="16" max="30" step="0.5" value="${this._escape(afternoonOnTemp)}" data-helper-number="${this._escape(helpers.afternoonOnTemp)}" data-rule="afternoonOn" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Sensor · apagar ≤</label><input type="number" min="16" max="30" step="0.5" value="${this._escape(afternoonOffTemp)}" data-helper-number="${this._escape(helpers.afternoonOffTemp)}" data-rule="afternoonOff" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Temperatura enviada</label><input type="number" min="16" max="${Math.floor(afternoonOffTemp)}" step="1" value="${this._escape(afternoonCommandTemp)}" data-helper-number="${this._escape(helpers.afternoonTargetTemp)}" data-rule="afternoonTarget" ${!automationConfigured ? "disabled" : ""}></div>
                  <div class="profile-field"><label>Ventilador al encender</label><select data-helper-select="${this._escape(helpers.afternoonFan)}" ${!automationConfigured ? "disabled" : ""}>${Object.entries(FAN).map(([value,label]) => `<option value="${value}" ${afternoonFan === value ? "selected" : ""}>${this._escape(label)}</option>`).join("")}</select></div>
                </div>
                <div class="profile-command tone-cool">
                  <strong>FRÍO · ${this._formatTemp(afternoonCommandTemp)} °C · VENTILADOR ${this._escape(FAN[afternoonFan]).toUpperCase()}</strong>
                </div>
                <div class="profile-summary">
                  <strong>${this._escape(afternoonStart)}–${this._escape(afternoonEnd)}</strong> · Memoria térmica: el FRÍO solo se autoriza después de que el sensor visite <strong>${this._formatTemp(afternoonOnTemp)} °C o más</strong>. Si la tarde empieza por debajo de ese umbral, permanece OFF. Una vez alcanzado, se ordena <strong>FRÍO + ${this._formatTemp(afternoonCommandTemp)} °C + ventilador ${this._escape(FAN[afternoonFan])}</strong> y se mantiene hasta bajar a <strong>${this._formatTemp(afternoonOffTemp)} °C</strong>; entonces vuelve a OFF y exige una nueva visita a <strong>${this._formatTemp(afternoonOnTemp)} °C</strong>.
                </div>
              </article>
            </div>

            ${automationConfigured && lastControlEvent ? `<div class="automation-event"><small>Último evento</small><strong>${this._escape(lastControlEvent)}</strong></div>` : ""}
            ${!automationConfigured ? `<div class="automation-warning">La configuración persistente todavía no fue inicializada. Reinicia Home Assistant después de copiar configuration.yaml, scripts.yaml y automations.yaml.</div>` : ""}
            ${automationConfigured && masterPowerOff ? `<div class="automation-warning">Alimentación principal reportada como apagada. Las órdenes HVAC permanecen habilitadas y el último estado se retransmitirá automáticamente al detectar OFF → ON.</div>` : ""}
            ${automationConfigured && !sessionSynchronized && referenceAvailable ? `<div class="automation-warning">RECOVERY · validando el sensor durante 2 s antes de habilitar la automatización.</div>` : ""}
            ${automationConfigured && controlMode === "manual" ? `<div class="automation-warning">El ajuste actual se mantendrá hasta el próximo evento automático válido.</div>` : ""}
            ${automationConfigured && controlMode === "fault" ? `<div class="automation-warning error">FAULT activo. El sistema permanece seguro hasta recuperar la causa indicada en “Último evento”.</div>` : ""}
            ${automationConfigured && !referenceAvailable ? `<div class="automation-warning error">Sin datos de temperatura. Las automatizaciones de climatización quedan pausadas y no enviarán comandos automáticos. Este aviso se repetirá cada 10 s hasta recuperar el sensor; después se aplicará una ventana de validación de 2 s que no se reinicia por nuevas lecturas válidas.</div>` : ""}
          </section>

          <section class="surface energy-shell">
            <div class="energy-header">
              <div class="energy-heading">
                <div class="energy-heading-icon">${this._icon("energy")}</div>
                <h2>Consumo energético</h2>
              </div>
              <div class="energy-current" title="Consumo = valor actual del contador − primer valor registrado desde el día 1, en valor absoluto">
                <small>Consumo del mes</small>
                <strong>${this._energyLoading && this._energyMonthTotal === null ? "…" : this._energyMonthTotal === null ? "—" : `${this._formatEnergy(this._energyMonthTotal)} kWh`}</strong>
                <span>${this._escape(monthStartLabel)} · hasta ahora</span>
              </div>
            </div>

            <div class="energy-toolbar">
              <div class="energy-tabs" role="tablist" aria-label="Período de consumo energético">
                ${[["day","Día"],["month","Mes"],["year","Año"]].map(([range,label]) => `<button class="energy-tab ${this._energyRange === range ? "is-active" : ""}" data-action="energy-range" data-range="${range}" role="tab" aria-selected="${this._energyRange === range}">${label}</button>`).join("")}
              </div>
              <div class="energy-toolbar-actions">
                ${this._energyRange === "day" ? `<div class="energy-day-nav" aria-label="Navegar por días"><button class="energy-day-step" data-action="energy-day-prev" title="Día anterior" aria-label="Día anterior">‹</button><button class="energy-day-current" data-action="energy-day-today" title="${this._energyDayOffset === 0 ? "Mostrando hoy" : "Volver a hoy"}">${this._escape(energyDayNavLabel)}</button><button class="energy-day-step" data-action="energy-day-next" title="Día siguiente" aria-label="Día siguiente" ${this._energyDayOffset >= 0 ? "disabled" : ""}>›</button></div>` : ""}
                <button class="energy-refresh" data-action="energy-refresh" title="Actualizar consumo" aria-label="Actualizar consumo" ${this._energyLoading ? "disabled" : ""}>${this._icon("auto")}</button>
              </div>
            </div>

            <div class="energy-summary">
              <div class="energy-stat">
                <small>Consumo</small>
                <strong>${this._energyLoading && !this._energyData.length ? "…" : `${this._formatEnergy(energyPeriodTotal)} kWh`}</strong>
                <span>${this._escape(energyDefinition.title)}</span>
              </div>
              <div class="energy-stat">
                <small>Promedio por ${this._escape(energyDefinition.intervalLabel)}</small>
                <strong>${this._energyLoading && !this._energyData.length ? "…" : `${this._formatEnergy(energyAverage)} kWh`}</strong>
                <span>${this._escape(energyIntervalStatus)}</span>
              </div>
              <div class="energy-stat">
                <small>Mayor intervalo</small>
                <strong>${this._energyLoading && !this._energyData.length ? "…" : `${this._formatEnergy(energyPeak)} kWh`}</strong>
                <span>Pico de consumo del período</span>
              </div>
            </div>

            <div class="energy-chart-card">
              <div class="energy-chart-title">
                <div>
                  <strong>${this._energyRange === "day" ? "Consumo por hora + temperatura de oficinas" : this._energyRange === "month" ? "Consumo por día" : "Consumo por mes"}</strong>
                  ${this._energyRange === "day" ? `<div class="energy-chart-legend"><span class="legend-energy">Barras · kWh</span><span class="legend-temperature">Línea · °C media/hora${energyDefinition.isToday && Number.isFinite(currentOfficeTemperature) ? ` · actual ${this._formatTemp(currentOfficeTemperature)} °C` : ""}</span></div>` : ""}
                </div>
                <span>${this._escape(energyDefinition.title)}</span>
              </div>
              ${this._energyRange === "day" && this._temperatureError ? `<div class="temperature-warning">${this._icon("alert")} ${this._escape(this._temperatureError)}</div>` : ""}
              ${this._energyChart()}
            </div>
          </section>
        </main>
      </div>

      ${this._toast ? `<div class="toast ${this._escape(this._toast.type)}" role="status">${this._escape(this._toast.message)}</div>` : ""}
    `;

    requestAnimationFrame(() => this._restoreEnergyChartScroll());
  }
}

if (!customElements.get("climatizacion-panel")) {
  customElements.define("climatizacion-panel", WitmindClimatizacionPanel);
}
