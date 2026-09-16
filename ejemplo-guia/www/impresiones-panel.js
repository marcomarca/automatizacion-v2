// Witmind Impresiones 3D Panel v1.2.1 — controles críticos y cámara configurada a 2 FPS.
const DEFAULT_PRINT_CONFIG = Object.freeze({
  title: "Impresiones",
  brand: "Witmind",
  subtitle: "Control de impresión 3D",
  siteLabel: "WTX · MDTC",
  logo: "/local/logo-witmind.png?v=2.0.0",
  historyHours: 6,
  cameraFps: 2,
  // Zona operativa recomendada. Los límites físicos siguen viniendo de los
  // atributos min/max de cada entidad number.* y deben repetirse en backend/firmware.
  speedSafeMin: 50,
  speedSafeMax: 120,
  speedConfirmDelta: 10,
  nozzleSafeMax: 260,
  nozzleConfirmDelta: 15,
  bedSafeMax: 110,
  bedConfirmDelta: 10,
  fanConfirmDelta: 30,
  status: "sensor.f005_114b_estado_de_impresion",
  object: "sensor.f005_114b_objeto_actual",
  progress: "sensor.f005_114b_progreso_de_impresion",
  currentLayer: "sensor.f005_114b_capa_actual",
  totalLayers: "sensor.f005_114b_capas_totales",
  elapsedTime: "sensor.f005_114b_tiempo_de_trabajo_de_impresion",
  remainingTime: "sensor.f005_114b_tiempo_restante_de_impresion",
  objectCount: "sensor.f005_114b_cantidad_de_objetos",
  materialUsed: "sensor.f005_114b_material_usado",
  speed: "sensor.f005_114b_velocidad_de_impresion",
  realtimeFlow: "sensor.f005_114b_flujo_en_tiempo_real",
  flowRate: "sensor.f005_114b_tasa_de_flujo",
  filamentStatus: "sensor.f005_114b_estado_del_filamento",
  camera: "camera.f005_114b_camara_de_la_impresora",
  preview: "image.f005_114b_vista_previa_de_la_impresion_actual",
  nozzleTemperature: "sensor.f005_114b_temperatura_de_la_boquilla",
  nozzleMaximum: "sensor.f005_114b_temperatura_maxima_de_la_boquilla",
  nozzleTarget: "number.f005_114b_objetivo_de_la_boquilla",
  bedTemperature: "sensor.f005_114b_temperatura_de_la_cama",
  bedMaximum: "sensor.f005_114b_temperatura_maxima_de_la_cama",
  bedTarget: "number.f005_114b_objetivo_de_la_cama",
  chamberTemperature: "sensor.f005_114b_temperatura_de_la_camara",
  pauseButton: "button.f005_114b_pausar_la_impresion",
  resumeButton: "button.f005_114b_reanudar_la_impresion",
  stopButton: "button.f005_114b_detener_la_impresion",
  homeButton: "button.f005_114b_inicio_xy_y_luego_z",
  reconnectButton: "button.f005_114b_reconectar",
  speedAdjustment: "number.f005_114b_ajuste_de_impresion",
  printerLight: "light.f005_114b_luz",
  fans: [
    { entity: "fan.f005_114b_ventilador_del_modelo", name: "Ventilador del modelo", protectWhilePrinting: true },
    { entity: "fan.f005_114b_ventilador_de_la_carcasa", name: "Ventilador de carcasa", protectWhilePrinting: true },
    { entity: "fan.f005_114b_ventilador_lateral", name: "Ventilador lateral", protectWhilePrinting: true },
  ],
  positionX: "sensor.f005_114b_posicion_x",
  positionY: "sensor.f005_114b_posicion_y",
  positionZ: "sensor.f005_114b_posicion_z",
});

const ICONS = {
  printer: '<path d="M7 2h10v5h2a3 3 0 0 1 3 3v7h-4v5H6v-5H2v-7a3 3 0 0 1 3-3h2V2Zm2 2v3h6V4H9Zm-1 11v5h8v-5H8Zm10-2h2v-3a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3h2v-1h12v1Z"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 2.3L6 7.6l6 3.4 6-3.4-6-3.3ZM5 9.3v6.5l6 3.3v-6.5L5 9.3Zm8 9.8 6-3.3V9.3l-6 3.3v6.5Z"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7l10-5Zm0 2.2L6.4 7 12 9.8 17.6 7 12 4.2ZM3.5 11 12 15.2 20.5 11 22 12l-10 5-10-5 1.5-1Zm0 5L12 20.2 20.5 16 22 17l-10 5-10-5 1.5-1Z"/>',
  timer: '<path d="M9 2h6v2H9V2Zm2 4h2v2.1a7 7 0 1 1-2 0V6Zm1 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm1 1v4.6l3 1.7-1 1.7-4-2.3V11h2Z"/>',
  material: '<path d="M5 3h14v4h2v14H3V7h2V3Zm2 2v2h10V5H7ZM5 9v10h14V9H5Zm3 2h8v2H8v-2Zm0 4h5v2H8v-2Z"/>',
  speed: '<path d="M12 4a9 9 0 0 1 9 9c0 3-1.5 5.7-3.8 7.3l-1.1-1.7A7 7 0 1 0 7.9 18.6l-1.1 1.7A9 9 0 0 1 12 4Zm5.7 4.9-4.2 6.4a2 2 0 1 1-1.7-1.1l4.2-6.4 1.7 1.1Z"/>',
  flow: '<path d="M12 2s7 7.4 7 13a7 7 0 1 1-14 0c0-5.6 7-13 7-13Zm0 3.2C10.1 7.5 7 11.8 7 15a5 5 0 0 0 10 0c0-3.2-3.1-7.5-5-9.8Z"/>',
  filament: '<path d="M4 3h12a4 4 0 0 1 0 8H9a2 2 0 1 0 0 4h7a4 4 0 1 1 0 8H8v-2h8a2 2 0 1 0 0-4H9a4 4 0 1 1 0-8h7a2 2 0 1 0 0-4H4V3Z"/>',
  thermometer: '<path d="M9 4a3 3 0 0 1 6 0v8.3a5 5 0 1 1-6 0V4Zm3-1a1 1 0 0 0-1 1v9.4l-.6.3a3 3 0 1 0 3.2 0l-.6-.3V4a1 1 0 0 0-1-1Zm-1 4h2v8h-2V7Z"/>',
  nozzle: '<path d="M7 2h10v4h2v5l-4 4v3h-2v4h-2v-4H9v-3l-4-4V6h2V2Zm2 2v2h6V4H9ZM7 8v2.2l3.2 3.2h3.6l3.2-3.2V8H7Z"/>',
  bed: '<path d="M3 14h18v5H3v-5Zm2 2v1h14v-1H5Zm1-9h2v5H6V7Zm5-3h2v8h-2V4Zm5 3h2v5h-2V7Z"/>',
  pause: '<path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z"/>',
  play: '<path d="M8 5v14l11-7L8 5Z"/>',
  stop: '<path d="M6 6h12v12H6V6Z"/>',
  home: '<path d="m12 3 10 8h-3v10h-6v-6h-2v6H5V11H2l10-8Zm0 2.6L7 9.6V19h2v-6h6v6h2V9.6l-5-4Z"/>',
  reconnect: '<path d="M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z"/>',
  bulb: '<path d="M9 21h6v-2H9v2Zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Zm2 11.5V15h-4v-1.5l-.5-.3A5 5 0 1 1 14.5 13l-.5.5Z"/>',
  fan: '<path d="M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm1-8c4 0 5.3 3.2 3.2 6.2-.7 1-1.5 1.7-2.3 2.2A3 3 0 0 0 12 9c.4-2.2-.1-4.5 1-7Zm-2 20c-4 0-5.3-3.2-3.2-6.2.7-1 1.5-1.7 2.3-2.2A3 3 0 0 0 12 15c-.4 2.2.1 4.5-1 7ZM2 11c0-4 3.2-5.3 6.2-3.2 1 .7 1.7 1.5 2.2 2.3A3 3 0 0 0 9 12c-2.2-.4-4.5.1-7-1Zm20 2c0 4-3.2 5.3-6.2 3.2-1-.7-1.7-1.5-2.2-2.3A3 3 0 0 0 15 12c2.2.4 4.5-.1 7 1Z"/>',
  axis: '<path d="M11 3h2v6.6l2.3-2.3 1.4 1.4L12 13.4 7.3 8.7l1.4-1.4L11 9.6V3Zm-8 8h6.6l-2.3-2.3 1.4-1.4 4.7 4.7-4.7 4.7-1.4-1.4L9.6 13H3v-2Zm18 0v2h-6.6l2.3 2.3-1.4 1.4-4.7-4.7 4.7-4.7 1.4 1.4-2.3 2.3H21ZM11 21v-6.6l-2.3 2.3-1.4-1.4 4.7-4.7 4.7 4.7-1.4 1.4-2.3-2.3V21h-2Z"/>',
  camera: '<path d="M8 5 9.5 3h5L16 5h3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h3Zm4 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/>',
  chart: '<path d="M4 19h17v2H2V3h2v16Zm2-3 4-5 3 3 5-7 1.6 1.2-6.4 9-3-3L7.6 17.2 6 16Z"/>',
  refresh: '<path d="M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z"/>',
  info: '<path d="M11 10h2v8h-2v-8Zm0-4h2v2h-2V6Zm1-4a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z"/>',
  power: '<path d="M11 2h2v10h-2V2Zm5.7 3.9 1.4-1.4A9 9 0 1 1 5.9 4.5l1.4 1.4A7 7 0 1 0 16.7 5.9Z"/>',
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

class ImpresionesPanel extends HTMLElement {
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
    this._pending = new Set();
    // Los sliders editan un borrador local. Ningún comando se envía mientras
    // el operador arrastra o pulsa repetidamente +/−.
    this._draftValues = new Map();
    this._toast = null;
    this._toastTimer = null;
    this._clockTimer = null;
    this._historyTimer = null;
    this._cameraTimer = null;
    this._unsubscribeStates = null;
    this._confirmation = null;
    this._cameraNonce = Date.now();
    this._themeStorageKey = "witmind-impresiones-panel-theme";
    this._theme = this._loadTheme();

    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("input", (event) => this._handleInput(event));
    this.shadowRoot.addEventListener("change", (event) => this._handleChange(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._handleKeydown(event));
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

  get hass() { return this._hass; }

  set panel(value) {
    this._panel = value;
    if (this._hass) {
      this._syncStatesFromHass();
      this._loadHistory();
      this._restartCameraTimer();
      this._requestRender();
    }
  }

  get panel() { return this._panel; }

  set narrow(value) {
    this._narrow = Boolean(value);
    this.toggleAttribute("narrow", this._narrow);
  }

  get narrow() { return this._narrow; }

  connectedCallback() {
    if (this._hass) this._requestRender();
  }

  disconnectedCallback() {
    clearInterval(this._clockTimer);
    clearInterval(this._historyTimer);
    clearInterval(this._cameraTimer);
    clearTimeout(this._toastTimer);
    if (this._unsubscribeStates) {
      this._unsubscribeStates();
      this._unsubscribeStates = null;
    }
    this._started = false;
  }

  _config() {
    const raw = this._panel?.config || {};
    const entity = (snake, camel, fallback) => raw[snake] || raw[camel] || fallback;
    const finiteSetting = (snake, camel, fallback) => {
      const value = Number(raw[snake] ?? raw[camel]);
      return Number.isFinite(value) ? value : fallback;
    };
    const rawFans = Array.isArray(raw.fans) && raw.fans.length ? raw.fans : DEFAULT_PRINT_CONFIG.fans;
    const historyHours = Number(raw.history_hours ?? raw.historyHours);
    const requestedCameraFps = Number(raw.camera_fps ?? raw.cameraFps);
    const legacyRefreshSeconds = Number(
      raw.camera_refresh_seconds ?? raw.cameraRefreshSeconds,
    );
    const cameraFps = Number.isFinite(requestedCameraFps) && requestedCameraFps > 0
      ? Math.min(24, Math.max(1, requestedCameraFps))
      : Number.isFinite(legacyRefreshSeconds) && legacyRefreshSeconds > 0
        ? Math.min(24, Math.max(1, 1 / legacyRefreshSeconds))
        : DEFAULT_PRINT_CONFIG.cameraFps;

    return {
      title: raw.title || DEFAULT_PRINT_CONFIG.title,
      brand: raw.brand || DEFAULT_PRINT_CONFIG.brand,
      subtitle: raw.subtitle || DEFAULT_PRINT_CONFIG.subtitle,
      siteLabel: raw.site_label || raw.siteLabel || DEFAULT_PRINT_CONFIG.siteLabel,
      logo: raw.logo || DEFAULT_PRINT_CONFIG.logo,
      historyHours: Number.isFinite(historyHours) && historyHours > 0 ? Math.min(24, historyHours) : DEFAULT_PRINT_CONFIG.historyHours,
      cameraFps,
      speedSafeMin: finiteSetting("speed_safe_min", "speedSafeMin", DEFAULT_PRINT_CONFIG.speedSafeMin),
      speedSafeMax: finiteSetting("speed_safe_max", "speedSafeMax", DEFAULT_PRINT_CONFIG.speedSafeMax),
      speedConfirmDelta: Math.max(0, finiteSetting("speed_confirm_delta", "speedConfirmDelta", DEFAULT_PRINT_CONFIG.speedConfirmDelta)),
      nozzleSafeMax: finiteSetting("nozzle_safe_max", "nozzleSafeMax", DEFAULT_PRINT_CONFIG.nozzleSafeMax),
      nozzleConfirmDelta: Math.max(0, finiteSetting("nozzle_confirm_delta", "nozzleConfirmDelta", DEFAULT_PRINT_CONFIG.nozzleConfirmDelta)),
      bedSafeMax: finiteSetting("bed_safe_max", "bedSafeMax", DEFAULT_PRINT_CONFIG.bedSafeMax),
      bedConfirmDelta: Math.max(0, finiteSetting("bed_confirm_delta", "bedConfirmDelta", DEFAULT_PRINT_CONFIG.bedConfirmDelta)),
      fanConfirmDelta: Math.max(0, finiteSetting("fan_confirm_delta", "fanConfirmDelta", DEFAULT_PRINT_CONFIG.fanConfirmDelta)),
      status: entity("status_sensor", "statusSensor", DEFAULT_PRINT_CONFIG.status),
      object: entity("object_sensor", "objectSensor", DEFAULT_PRINT_CONFIG.object),
      progress: entity("progress_sensor", "progressSensor", DEFAULT_PRINT_CONFIG.progress),
      currentLayer: entity("current_layer_sensor", "currentLayerSensor", DEFAULT_PRINT_CONFIG.currentLayer),
      totalLayers: entity("total_layers_sensor", "totalLayersSensor", DEFAULT_PRINT_CONFIG.totalLayers),
      elapsedTime: entity("elapsed_time_sensor", "elapsedTimeSensor", DEFAULT_PRINT_CONFIG.elapsedTime),
      remainingTime: entity("remaining_time_sensor", "remainingTimeSensor", DEFAULT_PRINT_CONFIG.remainingTime),
      objectCount: entity("object_count_sensor", "objectCountSensor", DEFAULT_PRINT_CONFIG.objectCount),
      materialUsed: entity("material_used_sensor", "materialUsedSensor", DEFAULT_PRINT_CONFIG.materialUsed),
      speed: entity("speed_sensor", "speedSensor", DEFAULT_PRINT_CONFIG.speed),
      realtimeFlow: entity("realtime_flow_sensor", "realtimeFlowSensor", DEFAULT_PRINT_CONFIG.realtimeFlow),
      flowRate: entity("flow_rate_sensor", "flowRateSensor", DEFAULT_PRINT_CONFIG.flowRate),
      filamentStatus: entity("filament_status_sensor", "filamentStatusSensor", DEFAULT_PRINT_CONFIG.filamentStatus),
      camera: entity("camera", "camera", DEFAULT_PRINT_CONFIG.camera),
      preview: entity("preview_image", "previewImage", DEFAULT_PRINT_CONFIG.preview),
      nozzleTemperature: entity("nozzle_temperature", "nozzleTemperature", DEFAULT_PRINT_CONFIG.nozzleTemperature),
      nozzleMaximum: entity("nozzle_maximum", "nozzleMaximum", DEFAULT_PRINT_CONFIG.nozzleMaximum),
      nozzleTarget: entity("nozzle_target", "nozzleTarget", DEFAULT_PRINT_CONFIG.nozzleTarget),
      bedTemperature: entity("bed_temperature", "bedTemperature", DEFAULT_PRINT_CONFIG.bedTemperature),
      bedMaximum: entity("bed_maximum", "bedMaximum", DEFAULT_PRINT_CONFIG.bedMaximum),
      bedTarget: entity("bed_target", "bedTarget", DEFAULT_PRINT_CONFIG.bedTarget),
      chamberTemperature: entity("chamber_temperature", "chamberTemperature", DEFAULT_PRINT_CONFIG.chamberTemperature),
      pauseButton: entity("pause_button", "pauseButton", DEFAULT_PRINT_CONFIG.pauseButton),
      resumeButton: entity("resume_button", "resumeButton", DEFAULT_PRINT_CONFIG.resumeButton),
      stopButton: entity("stop_button", "stopButton", DEFAULT_PRINT_CONFIG.stopButton),
      homeButton: entity("home_button", "homeButton", DEFAULT_PRINT_CONFIG.homeButton),
      reconnectButton: entity("reconnect_button", "reconnectButton", DEFAULT_PRINT_CONFIG.reconnectButton),
      speedAdjustment: entity("speed_adjustment", "speedAdjustment", DEFAULT_PRINT_CONFIG.speedAdjustment),
      printerLight: entity("printer_light", "printerLight", DEFAULT_PRINT_CONFIG.printerLight),
      fans: rawFans.filter((item) => item?.entity).map((item, index) => ({
        entity: String(item.entity),
        name: item.name || `Ventilador ${index + 1}`,
        protectWhilePrinting: item.protect_while_printing ?? item.protectWhilePrinting ?? true,
        confirmDelta: Math.max(0, Number(item.confirm_delta ?? item.confirmDelta ?? DEFAULT_PRINT_CONFIG.fanConfirmDelta)),
      })),
      positionX: entity("position_x", "positionX", DEFAULT_PRINT_CONFIG.positionX),
      positionY: entity("position_y", "positionY", DEFAULT_PRINT_CONFIG.positionY),
      positionZ: entity("position_z", "positionZ", DEFAULT_PRINT_CONFIG.positionZ),
    };
  }

  _trackedEntities() {
    const config = this._config();
    return new Set([
      config.status, config.object, config.progress, config.currentLayer, config.totalLayers,
      config.elapsedTime, config.remainingTime, config.objectCount, config.materialUsed,
      config.speed, config.realtimeFlow, config.flowRate, config.filamentStatus,
      config.camera, config.preview, config.nozzleTemperature, config.nozzleMaximum,
      config.nozzleTarget, config.bedTemperature, config.bedMaximum, config.bedTarget,
      config.chamberTemperature, config.pauseButton, config.resumeButton, config.stopButton,
      config.homeButton, config.reconnectButton, config.speedAdjustment, config.printerLight,
      ...config.fans.map((item) => item.entity), config.positionX, config.positionY, config.positionZ,
    ].filter(Boolean));
  }

  async _start() {
    this._clockTimer = setInterval(() => this._updateClock(), 30_000);
    this._historyTimer = setInterval(() => this._loadHistory(), 120_000);
    this._restartCameraTimer();
    await Promise.allSettled([
      this._fetchCurrentStates(),
      this._subscribeStateChanges(),
      this._loadHistory(),
    ]);
  }

  _restartCameraTimer() {
    clearInterval(this._cameraTimer);
    const fps = this._config().cameraFps;
    const frameIntervalMs = Math.max(1000 / 24, 1000 / fps);
    const refresh = () => {
      if (!this.isConnected || document.visibilityState === "hidden") return;
      this._cameraNonce = performance.timeOrigin + performance.now();
      this._refreshCameraImages();
    };
    refresh();
    this._cameraTimer = setInterval(refresh, frameIntervalMs);
  }

  _syncStatesFromHass() {
    if (!this._hass?.states) return;
    for (const entityId of this._trackedEntities()) {
      const stateObject = this._hass.states[entityId];
      if (stateObject) this._liveStates.set(entityId, stateObject);
    }
  }

  async _fetchCurrentStates() {
    if (!this._hass?.callWS) return;
    try {
      const states = await this._hass.callWS({ type: "get_states" });
      const tracked = this._trackedEntities();
      for (const stateObject of states || []) {
        if (tracked.has(stateObject.entity_id)) this._liveStates.set(stateObject.entity_id, stateObject);
      }
      this._requestRender();
    } catch (error) {
      console.error("No se pudieron sincronizar los estados de la impresora:", error);
    }
  }

  async _subscribeStateChanges() {
    if (!this._hass?.connection || this._unsubscribeStates) return;
    try {
      this._unsubscribeStates = await this._hass.connection.subscribeEvents(
        (event) => {
          const entityId = event?.data?.entity_id;
          if (!entityId || !this._trackedEntities().has(entityId)) return;
          const newState = event.data.new_state;
          if (newState) this._liveStates.set(entityId, newState);
          else this._liveStates.delete(entityId);
          this._requestRender();
        },
        "state_changed",
      );
    } catch (error) {
      console.error("No se pudo suscribir a state_changed:", error);
    }
  }

  async _loadHistory() {
    const config = this._config();
    if (!this._hass?.callApi) return;
    const entities = [config.nozzleTemperature, config.bedTemperature, config.chamberTemperature].filter(Boolean);
    if (!entities.length) return;
    const end = new Date();
    const start = new Date(end.getTime() - config.historyHours * 3600_000);
    const path = `history/period/${encodeURIComponent(start.toISOString())}` +
      `?filter_entity_id=${encodeURIComponent(entities.join(","))}` +
      `&end_time=${encodeURIComponent(end.toISOString())}&minimal_response&no_attributes`;
    try {
      this._history = await this._hass.callApi("GET", path);
      this._historyError = "";
    } catch (error) {
      this._history = [];
      this._historyError = "No se pudo cargar el historial de temperatura.";
      console.error("Error cargando historial de temperatura:", error);
    }
    this._requestRender();
  }

  _requestRender() {
    if (this._renderQueued || !this._hass || !this.shadowRoot) return;
    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      this.render();
    });
  }

  _state(entityId) {
    return this._liveStates.get(entityId) || this._hass?.states?.[entityId];
  }

  _isUnavailable(entityId) {
    const stateObject = this._state(entityId);
    if (!stateObject) return true;
    if (stateObject.state === "unavailable") return true;
    const domain = String(entityId || "").split(".")[0];
    // Los button.* pueden permanecer en unknown hasta su primera pulsación,
    // aunque el servicio button.press esté plenamente disponible.
    return stateObject.state === "unknown" && !["button", "camera", "image"].includes(domain);
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
    return `<svg class="icon ${this._escape(className)}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  }

  _number(entityId, fallback = NaN) {
    const value = Number(this._state(entityId)?.state);
    return Number.isFinite(value) ? value : fallback;
  }

  _text(entityId, fallback = "—") {
    const state = this._state(entityId)?.state;
    return !state || ["unknown", "unavailable", "none", "None"].includes(state) ? fallback : state;
  }

  _unit(entityId, fallback = "") {
    return this._state(entityId)?.attributes?.unit_of_measurement || fallback;
  }

  _formatNumber(value, digits = 1) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("es-BO", { maximumFractionDigits: digits }).format(value);
  }

  _formatDuration(entityId) {
    const seconds = this._number(entityId);
    if (!Number.isFinite(seconds) || seconds < 0) return "—";
    const rounded = Math.round(seconds);
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  _statusInfo() {
    const raw = this._text(this._config().status, "Desconocido");
    const normalized = raw.toLowerCase().trim();
    const labels = {
      printing: "Imprimiendo", running: "Imprimiendo", run: "Imprimiendo", print: "Imprimiendo", imprimiendo: "Imprimiendo",
      idle: "En espera", ready: "Lista", standby: "En espera", prepare: "Preparando", preparing: "Preparando", slicing: "Procesando", init: "Iniciando",
      paused: "Pausada", pause: "Pausada", pausing: "Pausando", pausada: "Pausada",
      finished: "Finalizada", finish: "Finalizada", complete: "Finalizada", completed: "Finalizada", finalizada: "Finalizada",
      failed: "Error", error: "Error", offline: "Sin conexión", unavailable: "No disponible", "sin conexión": "Sin conexión",
    };
    const label = labels[normalized] || raw;
    let tone = "neutral";
    if (["printing", "running", "run", "print", "imprimiendo"].includes(normalized)) tone = "active";
    else if (["paused", "pause", "pausing", "pausada"].includes(normalized)) tone = "warning";
    else if (["failed", "error", "offline", "unavailable", "sin conexión"].includes(normalized)) tone = "danger";
    else if (["finished", "finish", "complete", "completed", "finalizada", "ready"].includes(normalized)) tone = "success";
    return { raw, normalized, label, tone };
  }

  _isIdle() {
    return ["idle", "ready", "standby", "finished", "finish", "complete", "completed", "finalizada"].includes(this._statusInfo().normalized);
  }

  _isPrinting() {
    return ["printing", "running", "run", "print", "imprimiendo"].includes(this._statusInfo().normalized);
  }

  _isPaused() {
    return ["paused", "pause", "pausing", "pausada"].includes(this._statusInfo().normalized);
  }

  _hasActiveJob() {
    return this._isPrinting() || this._isPaused() || ["prepare", "preparing", "slicing", "init"].includes(this._statusInfo().normalized);
  }

  _operationAvailability(key) {
    const status = this._statusInfo();
    if (key === "pause") {
      return this._isPrinting()
        ? { allowed: true, reason: "Pausa temporal" }
        : { allowed: false, reason: "Solo disponible mientras imprime" };
    }
    if (key === "resume") {
      return this._isPaused()
        ? { allowed: true, reason: "Continuar trabajo pausado" }
        : { allowed: false, reason: "Solo disponible cuando está pausada" };
    }
    if (key === "stop") {
      return this._hasActiveJob()
        ? { allowed: true, reason: "Cancelación irreversible" }
        : { allowed: false, reason: "No hay una impresión activa" };
    }
    if (key === "home") {
      return this._isIdle()
        ? { allowed: true, reason: "Movimiento físico de ejes" }
        : { allowed: false, reason: "Bloqueado durante impresión, pausa o error" };
    }
    if (key === "reconnect") {
      return !this._hasActiveJob()
        ? { allowed: true, reason: "Reinicia la comunicación" }
        : { allowed: false, reason: "Bloqueado mientras existe un trabajo activo" };
    }
    return { allowed: false, reason: `Acción no permitida en estado ${status.label}` };
  }

  _cameraUrl(entityId, useNonce = true) {
    if (!entityId) return "";
    const stateObject = this._state(entityId);
    let src = stateObject?.attributes?.entity_picture || "";
    const domain = entityId.split(".")[0];
    if (!src && domain === "camera") src = `/api/camera_proxy/${entityId}`;
    if (!src && domain === "image") src = `/api/image_proxy/${entityId}`;
    if (!src) return "";
    if (useNonce) src += `${src.includes("?") ? "&" : "?"}v=${this._cameraNonce}`;
    if (/^https?:\/\//i.test(src)) return src;
    try {
      return this._hass?.hassUrl ? this._hass.hassUrl(src) : src;
    } catch (_error) {
      return src;
    }
  }

  _refreshCameraImages(force = false) {
    if (!this.shadowRoot) return;

    for (const stack of this.shadowRoot.querySelectorAll("[data-live-stack]")) {
      if (!force && stack.dataset.refreshing === "true") continue;

      const entityId = stack.dataset.entity;
      const src = this._cameraUrl(entityId, true);
      if (!src) continue;

      const frames = [...stack.querySelectorAll("img[data-live-image]")];
      if (frames.length < 2) continue;

      const active = frames.find((frame) => frame.classList.contains("is-active")) || frames[0];
      const buffer = frames.find((frame) => frame !== active) || frames[1];
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      stack.dataset.refreshing = "true";
      stack.dataset.requestId = requestId;

      const clearRefreshing = () => {
        if (stack.dataset.requestId !== requestId) return;
        stack.dataset.refreshing = "false";
        if (stack._refreshWatchdog) clearTimeout(stack._refreshWatchdog);
      };

      buffer.onload = async () => {
        if (stack.dataset.requestId !== requestId) return;
        try {
          if (typeof buffer.decode === "function") await buffer.decode();
        } catch (_error) {
          // La imagen ya disparó load; el intercambio sigue siendo seguro.
        }

        requestAnimationFrame(() => {
          if (stack.dataset.requestId !== requestId) return;
          active.classList.remove("is-active");
          active.setAttribute("aria-hidden", "true");
          buffer.classList.add("is-active");
          buffer.setAttribute("aria-hidden", "false");
          clearRefreshing();
        });
      };

      buffer.onerror = clearRefreshing;
      stack._refreshWatchdog = setTimeout(clearRefreshing, 4000);

      // El fotograma visible permanece intacto mientras el siguiente se descarga
      // y decodifica en el búfer oculto. Solo se intercambian cuando está listo.
      buffer.src = src;
    }
  }

  _dispatchMoreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
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

  _loadTheme() {
    try {
      return localStorage.getItem(this._themeStorageKey) === "dark" ? "dark" : "light";
    } catch (_error) {
      return "light";
    }
  }

  _toggleTheme() {
    this._theme = this._theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(this._themeStorageKey, this._theme); } catch (_error) { /* noop */ }
    this._requestRender();
  }

  _toggleMenu() {
    this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  _operationDefinitions() {
    const config = this._config();
    return {
      pause: {
        key: "pause",
        entity: config.pauseButton,
        label: "Pausar",
        executeLabel: "Pausar impresión",
        title: "¿Pausar la impresión?",
        description: "La impresora intentará detener temporalmente el movimiento y la extrusión. Puede dejar una marca visible en la pieza y mantener componentes calientes.",
        confirmLabel: "Sí, pausar",
        pendingLabel: "Pausando…",
        icon: "pause",
        variant: "warning",
      },
      resume: {
        key: "resume",
        entity: config.resumeButton,
        label: "Reanudar",
        executeLabel: "Reanudar impresión",
        title: "¿Reanudar la impresión?",
        description: "Se reactivarán el movimiento, la extrusión y el proceso térmico. Verifica que el área de trabajo esté despejada y que la pieza siga correctamente adherida.",
        confirmLabel: "Sí, reanudar",
        pendingLabel: "Reanudando…",
        icon: "play",
        variant: "success",
      },
      stop: {
        key: "stop",
        entity: config.stopButton,
        label: "Cancelar impresión",
        executeLabel: "Cancelar impresión",
        title: "¿Cancelar definitivamente la impresión?",
        description: "Esta orden cancelará el trabajo actual. El progreso no podrá recuperarse y será necesario preparar una nueva impresión.",
        confirmLabel: "Sí, cancelar",
        pendingLabel: "Cancelando…",
        icon: "stop",
        variant: "danger",
      },
      home: {
        key: "home",
        entity: config.homeButton,
        label: "Home XY → Z",
        executeLabel: "Referenciar ejes",
        title: "¿Mover el cabezal a Home XY → Z?",
        description: "La impresora moverá físicamente los ejes XY y después Z. Ejecutar esta orden durante una impresión puede provocar una colisión, desplazar la pieza o dañar el trabajo.",
        confirmLabel: "Sí, mover cabezal",
        pendingLabel: "Moviendo…",
        icon: "home",
        variant: "danger",
      },
      reconnect: {
        key: "reconnect",
        entity: config.reconnectButton,
        label: "Reconectar",
        executeLabel: "Reconectar impresora",
        title: "¿Reconectar la impresora?",
        description: "La comunicación con la impresora se reiniciará. La telemetría y los controles pueden quedar temporalmente sin respuesta durante una impresión activa.",
        confirmLabel: "Sí, reconectar",
        pendingLabel: "Reconectando…",
        icon: "reconnect",
        variant: "warning",
      },
    };
  }

  _openOperationConfirmation(key) {
    const operation = this._operationDefinitions()[key];
    if (!operation) return;
    if (this._isUnavailable(operation.entity)) {
      this._notify(`${operation.label}: entidad no disponible.`, "error");
      return;
    }
    const availability = this._operationAvailability(key);
    if (!availability.allowed) {
      this._notify(`${operation.label}: ${availability.reason}.`, "error");
      return;
    }
    if (this._pending.has(operation.entity)) return;
    this._confirmation = {
      type: "button",
      key,
      statusAtOpen: this._statusInfo().normalized,
    };
    this._requestRender();
  }

  _normalizeNumberValue(entityId, requested, notify = true) {
    const stateObject = this._state(entityId);
    if (!stateObject || this._isUnavailable(entityId)) {
      if (notify) this._notify("Control numérico no disponible.", "error");
      return null;
    }

    const min = Number(stateObject.attributes?.min);
    const max = Number(stateObject.attributes?.max);
    const step = Number(stateObject.attributes?.step);
    let value = Number(requested);
    if (!Number.isFinite(value)) {
      if (notify) this._notify("El valor solicitado no es válido.", "error");
      return null;
    }

    // No se recorta silenciosamente un valor fuera de rango. Un valor manipulado
    // desde el DOM debe rechazarse de forma explícita.
    const epsilon = 1e-9;
    if (Number.isFinite(min) && value < min - epsilon) {
      if (notify) this._notify(`El valor mínimo permitido es ${this._formatNumber(min)}.`, "error");
      return null;
    }
    if (Number.isFinite(max) && value > max + epsilon) {
      if (notify) this._notify(`El valor máximo permitido es ${this._formatNumber(max)}.`, "error");
      return null;
    }

    if (Number.isFinite(step) && step > 0) {
      const base = Number.isFinite(min) ? min : 0;
      value = base + Math.round((value - base) / step) * step;
      const decimalPart = String(step).split(".")[1] || "";
      value = Number(value.toFixed(Math.min(6, decimalPart.length)));
    }
    return value;
  }

  _numberControlDefinition(entityId) {
    const config = this._config();
    if (entityId === config.speedAdjustment) {
      return {
        kind: "speed", label: "Ajuste de velocidad", icon: "speed", fallbackUnit: "%",
        safeMin: Math.min(config.speedSafeMin, config.speedSafeMax),
        safeMax: Math.max(config.speedSafeMin, config.speedSafeMax),
        confirmDelta: config.speedConfirmDelta,
        confirmWhileActive: true,
        description: "El porcentaje afecta movimiento y extrusión del trabajo activo. Un valor excesivo puede provocar pérdida de pasos, mala extrusión o una colisión.",
      };
    }
    if (entityId === config.nozzleTarget) {
      return {
        kind: "nozzle", label: "Objetivo de boquilla", icon: "nozzle", fallbackUnit: "°C",
        safeMin: 0, safeMax: config.nozzleSafeMax, confirmDelta: config.nozzleConfirmDelta,
        confirmWhileActive: true,
        description: "El cambio modifica el calentador de la boquilla. Verifica que el material, el hotend y el perfil permitan la temperatura solicitada.",
      };
    }
    if (entityId === config.bedTarget) {
      return {
        kind: "bed", label: "Objetivo de cama", icon: "bed", fallbackUnit: "°C",
        safeMin: 0, safeMax: config.bedSafeMax, confirmDelta: config.bedConfirmDelta,
        confirmWhileActive: true,
        description: "El cambio modifica el calentador de la cama. Una temperatura incorrecta puede deformar la pieza, dañar superficies o comprometer la adhesión.",
      };
    }
    return {
      kind: "number", label: "Ajuste", icon: "info", fallbackUnit: "",
      safeMin: -Infinity, safeMax: Infinity, confirmDelta: 0, confirmWhileActive: true,
      description: "El cambio se aplicará al equipo conectado.",
    };
  }

  _numberChangeRisk(entityId, previous, value) {
    const definition = this._numberControlDefinition(entityId);
    const delta = Number.isFinite(previous) ? Math.abs(value - previous) : Infinity;
    const outsideSafeZone = value < definition.safeMin || value > definition.safeMax;
    const largeChange = Number.isFinite(definition.confirmDelta) && definition.confirmDelta > 0 && delta >= definition.confirmDelta;
    const activeChange = definition.confirmWhileActive && this._hasActiveJob();
    const reasons = [];
    if (activeChange) reasons.push("hay un trabajo activo");
    if (outsideSafeZone) reasons.push("el valor está fuera de la zona operativa configurada");
    if (largeChange) reasons.push(`el cambio es de ${this._formatNumber(delta)} unidades`);
    return {
      ...definition,
      requiresConfirmation: activeChange || outsideSafeZone || largeChange,
      variant: outsideSafeZone ? "danger" : "warning",
      reasons,
    };
  }

  _stageNumberChange(entityId, requested) {
    const value = this._normalizeNumberValue(entityId, requested);
    if (value === null) return;
    const current = Number(this._state(entityId)?.state);
    if (Number.isFinite(current) && Math.abs(current - value) < 0.0001) this._draftValues.delete(entityId);
    else this._draftValues.set(entityId, value);
    this._requestRender();
  }

  _discardDraft(entityId) {
    if (!entityId || this._pending.has(entityId)) return;
    this._draftValues.delete(entityId);
    this._requestRender();
  }

  async _applyNumberDraft(entityId) {
    if (!this._draftValues.has(entityId) || this._pending.has(entityId)) return;
    const value = this._normalizeNumberValue(entityId, this._draftValues.get(entityId));
    if (value === null) return;
    const stateObject = this._state(entityId);
    const previous = Number(stateObject?.state);
    const definition = this._numberControlDefinition(entityId);
    const unit = stateObject?.attributes?.unit_of_measurement || definition.fallbackUnit;

    if (Number.isFinite(previous) && Math.abs(previous - value) < 0.0001) {
      this._draftValues.delete(entityId);
      this._requestRender();
      return;
    }

    const risk = this._numberChangeRisk(entityId, previous, value);
    if (!risk.requiresConfirmation) {
      const succeeded = await this._setNumber(entityId, value, `${definition.label} actualizado.`);
      if (succeeded) this._draftValues.delete(entityId);
      this._requestRender();
      return;
    }

    const reason = risk.reasons.length ? ` Motivo: ${risk.reasons.join(", ")}.` : "";
    this._confirmation = {
      type: "number", entity: entityId, value, previous, unit,
      baseUpdated: stateObject?.last_updated || "",
      label: definition.label,
      title: `¿Aplicar ${definition.label.toLowerCase()} a ${this._formatNumber(value)}${unit}?`,
      description: `${definition.description}${reason}`,
      confirmLabel: "Aplicar una vez", pendingLabel: "Aplicando…",
      icon: definition.icon, variant: risk.variant,
      successMessage: `${definition.label} actualizado.`,
    };
    this._requestRender();
  }

  _confirmationEntity() {
    if (!this._confirmation) return "";
    if (["number", "fan"].includes(this._confirmation.type)) return this._confirmation.entity || "";
    return this._operationDefinitions()[this._confirmation.key]?.entity || "";
  }

  async _executeConfirmedOperation() {
    const confirmation = this._confirmation;
    if (!confirmation) return;
    const entityId = this._confirmationEntity();
    if (!entityId || this._pending.has(entityId)) return;

    let succeeded = false;
    if (confirmation.type === "number") {
      const current = Number(this._state(entityId)?.state);
      if (Number.isFinite(confirmation.previous) && Number.isFinite(current) && Math.abs(current - confirmation.previous) > 0.0001) {
        this._confirmation = null;
        this._notify("El valor actual cambió mientras la confirmación estaba abierta. Revisa y aplica de nuevo.", "error");
        this._requestRender();
        return;
      }
      succeeded = await this._setNumber(entityId, confirmation.value, confirmation.successMessage);
      if (succeeded) this._draftValues.delete(entityId);
    } else if (confirmation.type === "fan") {
      const current = this._fanPercentage(entityId);
      if (Number.isFinite(confirmation.previous) && Math.abs(current - confirmation.previous) > 0.5) {
        this._confirmation = null;
        this._notify("El ventilador cambió mientras la confirmación estaba abierta. Revisa y aplica de nuevo.", "error");
        this._requestRender();
        return;
      }
      succeeded = await this._setFanPercentage(entityId, confirmation.value, confirmation.successMessage);
      if (succeeded) this._draftValues.delete(entityId);
    } else {
      const operation = this._operationDefinitions()[confirmation.key];
      if (!operation) return;
      const availability = this._operationAvailability(confirmation.key);
      if (!availability.allowed) {
        this._confirmation = null;
        this._notify(`${operation.label}: ${availability.reason}.`, "error");
        this._requestRender();
        return;
      }
      succeeded = await this._pressButton(operation.entity, operation.executeLabel);
    }

    if (succeeded) this._confirmation = null;
    this._requestRender();
  }

  async _pressButton(entityId, label) {
    if (!entityId || this._isUnavailable(entityId) || this._pending.has(entityId)) {
      if (entityId && this._isUnavailable(entityId)) this._notify(`${label}: entidad no disponible.`, "error");
      return false;
    }
    let succeeded = false;
    this._pending.add(entityId);
    this._requestRender();
    try {
      await this._hass.callService("button", "press", { entity_id: entityId });
      succeeded = true;
      this._notify(`${label} enviado.`, "success");
    } catch (error) {
      this._notify(`No se pudo ejecutar ${label.toLowerCase()}.`, "error");
      console.error(`Error ejecutando button.press en ${entityId}:`, error);
    } finally {
      this._pending.delete(entityId);
      this._requestRender();
    }
    return succeeded;
  }

  async _toggleEntity(entityId) {
    if (!entityId || this._isUnavailable(entityId) || this._pending.has(entityId)) return;
    const state = this._state(entityId)?.state;
    const domain = entityId.split(".")[0];
    const service = state === "on" ? "turn_off" : "turn_on";
    this._pending.add(entityId);
    this._requestRender();
    try {
      await this._hass.callService(domain, service, { entity_id: entityId });
    } catch (error) {
      this._notify("No se pudo cambiar el estado del dispositivo.", "error");
      console.error(`Error ejecutando ${domain}.${service}:`, error);
    } finally {
      this._pending.delete(entityId);
      this._requestRender();
    }
  }

  async _waitForValue(entityId, expected, reader, tolerance = 0.001, timeoutMs = 3500) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const current = Number(reader());
      if (Number.isFinite(current) && Math.abs(current - expected) <= tolerance) return true;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    return false;
  }

  async _setNumber(entityId, requested, successMessage = "") {
    const value = this._normalizeNumberValue(entityId, requested);
    if (value === null || this._pending.has(entityId)) return false;
    let succeeded = false;
    this._pending.add(entityId);
    this._requestRender();
    try {
      await this._hass.callService("number", "set_value", { entity_id: entityId, value });
      succeeded = true;
      const acknowledged = await this._waitForValue(entityId, value, () => this._state(entityId)?.state);
      if (acknowledged && successMessage) this._notify(successMessage, "success");
      else if (!acknowledged) this._notify("Comando enviado, pero el estado no confirmó el nuevo valor.", "warning");
    } catch (error) {
      this._notify("No se pudo actualizar el valor.", "error");
      console.error(`Error actualizando ${entityId}:`, error);
    } finally {
      this._pending.delete(entityId);
      this._requestRender();
    }
    return succeeded;
  }

  _fanPercentage(entityId) {
    const stateObject = this._state(entityId);
    const percentage = Number(stateObject?.attributes?.percentage);
    if (Number.isFinite(percentage)) return Math.max(0, Math.min(100, percentage));
    return stateObject?.state === "on" ? 100 : 0;
  }

  _fanDefinition(entityId) {
    return this._config().fans.find((fan) => fan.entity === entityId) || {
      entity: entityId, name: "Ventilador", protectWhilePrinting: true, confirmDelta: this._config().fanConfirmDelta,
    };
  }

  _stageFanChange(entityId, requested, render = true) {
    if (!entityId || this._isUnavailable(entityId)) return;
    const rawValue = Number(requested);
    if (!Number.isFinite(rawValue) || rawValue < 0 || rawValue > 100) {
      this._notify("El porcentaje del ventilador debe estar entre 0 y 100.", "error");
      return;
    }
    const value = Math.round(rawValue);
    const current = this._fanPercentage(entityId);
    if (Math.abs(current - value) < 0.5) this._draftValues.delete(entityId);
    else this._draftValues.set(entityId, value);
    if (render) this._requestRender();
  }

  _toggleFanDraft(entityId) {
    if (!entityId || this._pending.has(entityId)) return;
    const currentDraft = this._draftValues.has(entityId) ? Number(this._draftValues.get(entityId)) : this._fanPercentage(entityId);
    this._stageFanChange(entityId, currentDraft > 0 ? 0 : 100);
  }

  async _applyFanDraft(entityId) {
    if (!this._draftValues.has(entityId) || this._pending.has(entityId)) return;
    const value = Math.round(Number(this._draftValues.get(entityId)));
    if (!Number.isFinite(value) || value < 0 || value > 100) return;
    const stateObject = this._state(entityId);
    const previous = this._fanPercentage(entityId);
    const fan = this._fanDefinition(entityId);
    if (Math.abs(previous - value) < 0.5) {
      this._draftValues.delete(entityId);
      this._requestRender();
      return;
    }

    const delta = Math.abs(value - previous);
    const protectedReduction = Boolean(fan.protectWhilePrinting) && this._hasActiveJob() && value < previous;
    const largeChange = delta >= (Number(fan.confirmDelta) || this._config().fanConfirmDelta);
    if (!protectedReduction && !largeChange) {
      const succeeded = await this._setFanPercentage(entityId, value, `${fan.name} actualizado.`);
      if (succeeded) this._draftValues.delete(entityId);
      this._requestRender();
      return;
    }

    const reason = protectedReduction
      ? "Reducir o apagar este ventilador durante un trabajo activo puede afectar refrigeración, adhesión o electrónica."
      : "El cambio solicitado es considerable.";
    this._confirmation = {
      type: "fan", entity: entityId, value, previous, unit: "%",
      baseUpdated: stateObject?.last_updated || "", label: fan.name,
      title: `¿Aplicar ${fan.name.toLowerCase()} a ${value}%?`,
      description: reason, confirmLabel: "Aplicar una vez", pendingLabel: "Aplicando…",
      icon: "fan", variant: value === 0 && this._hasActiveJob() ? "danger" : "warning",
      successMessage: `${fan.name} actualizado.`,
    };
    this._requestRender();
  }

  async _setFanPercentage(entityId, requested, successMessage = "") {
    if (!entityId || this._isUnavailable(entityId) || this._pending.has(entityId)) return false;
    const rawValue = Number(requested);
    if (!Number.isFinite(rawValue) || rawValue < 0 || rawValue > 100) return false;
    const percentage = Math.round(rawValue);
    let succeeded = false;
    this._pending.add(entityId);
    this._requestRender();
    try {
      if (percentage === 0) {
        await this._hass.callService("fan", "turn_off", { entity_id: entityId });
      } else {
        await this._hass.callService("fan", "set_percentage", { entity_id: entityId, percentage });
      }
      succeeded = true;
      const acknowledged = await this._waitForValue(entityId, percentage, () => this._fanPercentage(entityId), 0.5);
      if (acknowledged && successMessage) this._notify(successMessage, "success");
      else if (!acknowledged) this._notify("Comando enviado, pero el ventilador no confirmó el porcentaje.", "warning");
    } catch (error) {
      this._notify("No se pudo actualizar el ventilador.", "error");
      console.error(`Error actualizando ${entityId}:`, error);
    } finally {
      this._pending.delete(entityId);
      this._requestRender();
    }
    return succeeded;
  }

  _handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target || !this._hass) return;
    const action = target.dataset.action;
    if (action === "toggle-menu") this._toggleMenu();
    else if (action === "toggle-theme") this._toggleTheme();
    else if (action === "more-info") this._dispatchMoreInfo(target.dataset.entity);
    else if (action === "open-operation-confirm") this._openOperationConfirmation(target.dataset.operationKey);
    else if (action === "cancel-operation-confirm") {
      const inside = event.target.closest("[data-dialog-card]");
      if (target.classList.contains("dialog-backdrop") && inside) return;
      if (!this._pending.has(this._confirmationEntity())) {
        this._confirmation = null;
        this._requestRender();
      }
    }
    else if (action === "confirm-operation") this._executeConfirmedOperation();
    else if (action === "toggle-entity") this._toggleEntity(target.dataset.entity);
    else if (action === "toggle-fan-draft") this._toggleFanDraft(target.dataset.entity);
    else if (action === "apply-number-draft") this._applyNumberDraft(target.dataset.entity);
    else if (action === "apply-fan-draft") this._applyFanDraft(target.dataset.entity);
    else if (action === "discard-draft") this._discardDraft(target.dataset.entity);
    else if (action === "refresh-camera") {
      this._cameraNonce = Date.now();
      this._refreshCameraImages(true);
    }
    else if (action === "refresh-history") this._loadHistory();
    else if (action === "number-step") {
      const entityId = target.dataset.entity;
      const stateObject = this._state(entityId);
      const current = this._draftValues.has(entityId)
        ? Number(this._draftValues.get(entityId))
        : Number(stateObject?.state);
      const step = Number(stateObject?.attributes?.step) || 1;
      const direction = Number(target.dataset.direction) || 1;
      if (Number.isFinite(current)) this._stageNumberChange(entityId, current + step * direction);
    }
  }

  _updateDraftControlDom(target, value) {
    const control = target.closest("[data-draft-control]");
    if (!control) return;
    const current = Number(control.dataset.current);
    const unit = control.dataset.unit || "";
    const label = control.dataset.label || "Ajuste";
    const dirty = !Number.isFinite(current) || Math.abs(current - value) >= 0.0001;
    control.classList.toggle("has-draft", dirty);
    const readout = control.querySelector("[data-draft-readout]");
    if (readout) readout.textContent = dirty ? `Pendiente: ${this._formatNumber(value)}${unit}` : "Sin cambios pendientes";
    const apply = control.querySelector("[data-draft-apply]");
    if (apply) {
      apply.disabled = !dirty;
      apply.textContent = dirty ? `Aplicar ${this._formatNumber(value)}${unit}` : `Aplicar ${label}`;
    }
    const discard = control.querySelector("[data-draft-discard]");
    if (discard) discard.disabled = !dirty;
  }

  _handleInput(event) {
    const target = event.target.closest("[data-input-action]");
    if (!target || !this._hass) return;
    const action = target.dataset.inputAction;
    const entityId = target.dataset.entity;
    if (action === "stage-number") {
      const value = this._normalizeNumberValue(entityId, target.value, false);
      if (value === null) return;
      const current = Number(this._state(entityId)?.state);
      if (Number.isFinite(current) && Math.abs(current - value) < 0.0001) this._draftValues.delete(entityId);
      else this._draftValues.set(entityId, value);
      this._updateDraftControlDom(target, value);
    } else if (action === "stage-fan") {
      const value = Math.max(0, Math.min(100, Math.round(Number(target.value) || 0)));
      const current = this._fanPercentage(entityId);
      if (Math.abs(current - value) < 0.5) this._draftValues.delete(entityId);
      else this._draftValues.set(entityId, value);
      this._updateDraftControlDom(target, value);
    }
  }

  _handleChange(event) {
    const target = event.target.closest("[data-change-action]");
    if (!target || !this._hass) return;
    const action = target.dataset.changeAction;
    if (action === "stage-number") this._stageNumberChange(target.dataset.entity, target.value);
    else if (action === "stage-fan") this._stageFanChange(target.dataset.entity, target.value);
  }

  _handleKeydown(event) {
    if (event.key !== "Escape" || !this._confirmation) return;
    if (this._pending.has(this._confirmationEntity())) return;
    event.preventDefault();
    this._confirmation = null;
    this._requestRender();
  }

  _renderMetric({ icon, label, value, entity, tone = "" }) {
    const unavailable = entity && this._isUnavailable(entity);
    return `
      <button class="metric-tile ${tone ? `tone-${tone}` : ""} ${unavailable ? "is-unavailable" : ""}"
        data-action="more-info" data-entity="${this._escape(entity)}" ${entity ? "" : "disabled"}>
        <span class="metric-icon">${this._icon(icon)}</span>
        <span class="metric-copy"><small>${this._escape(label)}</small><strong>${this._escape(value)}</strong></span>
      </button>
    `;
  }

  _renderProgress() {
    const config = this._config();
    const progress = Math.max(0, Math.min(100, this._number(config.progress, 0)));
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress / 100);
    const currentLayer = this._text(config.currentLayer);
    const totalLayers = this._text(config.totalLayers);
    const object = this._text(config.object, "Sin objeto activo");
    return `
      <section class="surface progress-card">
        <div class="section-heading compact-heading">
          <div><span class="eyebrow">Estado actual</span><h2>Progreso de impresión</h2></div>
          <button class="icon-button" data-action="more-info" data-entity="${this._escape(config.progress)}" aria-label="Abrir detalle de progreso">${this._icon("info")}</button>
        </div>
        <div class="progress-body">
          <div class="progress-ring" role="img" aria-label="Progreso ${this._formatNumber(progress, 0)} por ciento">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="ring-track" cx="60" cy="60" r="${radius}"></circle>
              <circle class="ring-value" cx="60" cy="60" r="${radius}" style="stroke-dasharray:${circumference};stroke-dashoffset:${offset}"></circle>
            </svg>
            <div><strong>${this._formatNumber(progress, 0)}%</strong><span>completado</span></div>
          </div>
          <div class="progress-copy">
            <span class="object-icon">${this._icon("cube")}</span>
            <div><small>Objeto actual</small><strong>${this._escape(object)}</strong><span>Capa ${this._escape(currentLayer)} de ${this._escape(totalLayers)}</span></div>
          </div>
        </div>
        <div class="progress-stats">
          <div><small>Transcurrido</small><strong>${this._escape(this._formatDuration(config.elapsedTime))}</strong></div>
          <div><small>Restante</small><strong>${this._escape(this._formatDuration(config.remainingTime))}</strong></div>
        </div>
      </section>
    `;
  }

  _renderCamera() {
    const config = this._config();
    const cameraUrl = this._cameraUrl(config.camera, true);
    const previewUrl = this._cameraUrl(config.preview, false);
    const showPreview = !this._isIdle() && previewUrl;
    return `
      <section class="surface camera-card">
        <div class="section-heading compact-heading">
          <div><span class="eyebrow">Supervisión</span><h2>Cámara de la impresora</h2></div>
          <button class="icon-button" data-action="refresh-camera" aria-label="Actualizar cámara" title="Actualizar cámara">${this._icon("refresh")}</button>
        </div>
        <div class="camera-layout ${showPreview ? "has-preview" : ""}">
          <button class="camera-frame" data-action="more-info" data-entity="${this._escape(config.camera)}" aria-label="Abrir cámara">
            ${cameraUrl ? `
              <span class="camera-live-stack" data-live-stack data-entity="${this._escape(config.camera)}">
                <img class="camera-live-frame is-active" data-live-image src="${this._escape(cameraUrl)}" alt="Cámara de la impresora 3D" loading="eager" decoding="async" aria-hidden="false">
                <img class="camera-live-frame" data-live-image alt="" decoding="async" aria-hidden="true">
              </span>
            ` : `<span class="media-placeholder">${this._icon("camera")}<strong>Cámara no disponible</strong></span>`}
            <span class="camera-label">${this._escape(`${Math.round(config.cameraFps)} FPS`)}</span>
          </button>
          ${showPreview ? `
            <button class="preview-frame" data-action="more-info" data-entity="${this._escape(config.preview)}" aria-label="Abrir vista previa del modelo">
              <img src="${this._escape(previewUrl)}" alt="Vista previa de la impresión actual">
              <span>Vista previa del modelo</span>
            </button>
          ` : ""}
        </div>
      </section>
    `;
  }

  _renderDetails() {
    const config = this._config();
    const material = this._number(config.materialUsed);
    const materialUnit = this._unit(config.materialUsed, "cm");
    const speed = this._number(config.speed);
    const speedUnit = this._unit(config.speed, "%");
    const flow = this._number(config.realtimeFlow);
    const flowUnit = this._unit(config.realtimeFlow, "mm³/s");
    const flowRate = this._number(config.flowRate);
    const flowRateUnit = this._unit(config.flowRate, "%");
    return `
      <section class="surface details-card">
        <div class="section-heading compact-heading"><div><span class="eyebrow">Telemetría</span><h2>Detalle de impresión</h2></div></div>
        <div class="metric-grid">
          ${this._renderMetric({ icon: "timer", label: "Tiempo transcurrido", value: this._formatDuration(config.elapsedTime), entity: config.elapsedTime })}
          ${this._renderMetric({ icon: "timer", label: "Tiempo restante", value: this._formatDuration(config.remainingTime), entity: config.remainingTime })}
          ${this._renderMetric({ icon: "layers", label: "Objetos en la placa", value: this._text(config.objectCount), entity: config.objectCount })}
          ${this._renderMetric({ icon: "material", label: "Material usado", value: `${this._formatNumber(material)} ${materialUnit}`.trim(), entity: config.materialUsed })}
          ${this._renderMetric({ icon: "speed", label: "Velocidad de impresión", value: `${this._formatNumber(speed)}${speedUnit}`, entity: config.speed })}
          ${this._renderMetric({ icon: "flow", label: "Flujo en tiempo real", value: `${this._formatNumber(flow)} ${flowUnit}`.trim(), entity: config.realtimeFlow })}
          ${this._renderMetric({ icon: "flow", label: "Tasa de flujo", value: `${this._formatNumber(flowRate)}${flowRateUnit}`, entity: config.flowRate })}
          ${this._renderMetric({ icon: "filament", label: "Estado del filamento", value: this._text(config.filamentStatus), entity: config.filamentStatus })}
        </div>
      </section>
    `;
  }

  _renderNumberControl(entityId, label, icon) {
    const stateObject = this._state(entityId);
    const unavailable = this._isUnavailable(entityId);
    const pending = this._pending.has(entityId);
    const value = Number(stateObject?.state);
    const min = Number(stateObject?.attributes?.min);
    const max = Number(stateObject?.attributes?.max);
    const step = Number(stateObject?.attributes?.step) || 1;
    const definition = this._numberControlDefinition(entityId);
    const unit = stateObject?.attributes?.unit_of_measurement || definition.fallbackUnit || "";
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : 100;
    const draft = this._draftValues.has(entityId) ? Number(this._draftValues.get(entityId)) : value;
    const safeValue = Number.isFinite(draft) ? draft : (Number.isFinite(value) ? value : safeMin);
    const dirty = Number.isFinite(value) && Number.isFinite(draft) && Math.abs(value - draft) >= 0.0001;
    const disabled = unavailable || pending;
    return `
      <article class="number-control ${dirty ? "has-draft" : ""} ${unavailable ? "is-unavailable" : ""}"
        data-draft-control data-current="${Number.isFinite(value) ? value : ""}" data-unit="${this._escape(unit)}" data-label="${this._escape(label)}">
        <div class="control-heading">
          <span class="control-icon">${this._icon(icon)}</span>
          <div class="control-copy">
            <small>${this._escape(label)}</small>
            <strong>Actual: ${this._escape(this._formatNumber(value))}${this._escape(unit)}</strong>
            <span class="draft-readout" data-draft-readout>${dirty ? `Pendiente: ${this._escape(this._formatNumber(draft))}${this._escape(unit)}` : "Sin cambios pendientes"}</span>
          </div>
        </div>
        <div class="number-actions">
          <button data-action="number-step" data-entity="${this._escape(entityId)}" data-direction="-1" aria-label="Reducir ${this._escape(label)}" ${disabled ? "disabled" : ""}>−</button>
          <input type="range" min="${safeMin}" max="${safeMax}" step="${step}" value="${safeValue}"
            data-input-action="stage-number" data-change-action="stage-number" data-entity="${this._escape(entityId)}"
            aria-label="${this._escape(label)}" ${disabled ? "disabled" : ""}>
          <button data-action="number-step" data-entity="${this._escape(entityId)}" data-direction="1" aria-label="Aumentar ${this._escape(label)}" ${disabled ? "disabled" : ""}>+</button>
        </div>
        <div class="draft-actions">
          <button class="draft-discard" data-action="discard-draft" data-entity="${this._escape(entityId)}" data-draft-discard ${!dirty || disabled ? "disabled" : ""}>Descartar</button>
          <button class="draft-apply" data-action="apply-number-draft" data-entity="${this._escape(entityId)}" data-draft-apply ${!dirty || disabled ? "disabled" : ""}>${dirty ? `Aplicar ${this._escape(this._formatNumber(draft))}${this._escape(unit)}` : `Aplicar ${this._escape(label)}`}</button>
        </div>
      </article>
    `;
  }

  _historyMap() {
    const map = new Map();
    for (const group of this._history || []) {
      const id = group?.[0]?.entity_id;
      if (id) map.set(id, group);
    }
    return map;
  }

  _renderTemperatureChart() {
    const config = this._config();
    const end = Date.now();
    const start = end - config.historyHours * 3600_000;
    const series = [
      { entity: config.nozzleTemperature, label: "Boquilla", className: "nozzle" },
      { entity: config.bedTemperature, label: "Cama", className: "bed" },
      { entity: config.chamberTemperature, label: "Cámara", className: "chamber" },
    ];
    const historyMap = this._historyMap();
    const parsed = series.map((item) => {
      const points = (historyMap.get(item.entity) || []).map((state) => ({
        value: Number(state.state),
        time: new Date(state.last_changed || state.last_updated).getTime(),
      })).filter((point) => Number.isFinite(point.value) && Number.isFinite(point.time) && point.time >= start && point.time <= end);
      const current = this._number(item.entity);
      if (Number.isFinite(current)) points.push({ value: current, time: end });
      points.sort((a, b) => a.time - b.time);
      return { ...item, points };
    });
    const allValues = parsed.flatMap((item) => item.points.map((point) => point.value));
    if (!allValues.length) return `<div class="chart-empty">${this._icon("chart")}<strong>Sin historial numérico</strong><span>${this._escape(this._historyError || "El gráfico aparecerá cuando Recorder tenga datos.")}</span></div>`;
    let min = Math.min(...allValues);
    let max = Math.max(...allValues);
    const pad = Math.max(5, (max - min) * 0.12);
    min = Math.floor(min - pad);
    max = Math.ceil(max + pad);
    if (max <= min) max = min + 10;
    const width = 640;
    const height = 190;
    const left = 42;
    const right = 12;
    const top = 12;
    const bottom = 28;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const yFor = (value) => top + (max - value) / (max - min) * plotHeight;
    const xFor = (time) => left + (time - start) / (end - start) * plotWidth;
    const lines = parsed.map((item) => {
      const path = item.points.map((point, index) => `${index ? "L" : "M"}${xFor(point.time).toFixed(1)},${yFor(point.value).toFixed(1)}`).join(" ");
      return path ? `<path class="temp-line ${item.className}" d="${path}"></path>` : "";
    }).join("");
    const grid = Array.from({ length: 4 }, (_, index) => {
      const ratio = index / 3;
      const y = top + ratio * plotHeight;
      const value = max - ratio * (max - min);
      return `<line x1="${left}" x2="${width - right}" y1="${y}" y2="${y}" class="chart-grid-line"></line><text x="${left - 8}" y="${y + 4}" text-anchor="end">${this._formatNumber(value, 0)}°</text>`;
    }).join("");
    return `
      <div class="temperature-chart">
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Curva de temperatura de las últimas ${config.historyHours} horas">
          ${grid}
          ${lines}
          <text x="${left}" y="${height - 7}">−${config.historyHours} h</text>
          <text x="${width - right}" y="${height - 7}" text-anchor="end">Ahora</text>
        </svg>
        <div class="chart-legend">${parsed.map((item) => `<span class="${item.className}"><i></i>${this._escape(item.label)}</span>`).join("")}</div>
      </div>
    `;
  }

  _renderTemperatures() {
    const config = this._config();
    const nozzle = this._number(config.nozzleTemperature);
    const nozzleMax = this._number(config.nozzleMaximum);
    const bed = this._number(config.bedTemperature);
    const bedMax = this._number(config.bedMaximum);
    const chamber = this._number(config.chamberTemperature);
    return `
      <section class="surface temperatures-card">
        <div class="section-heading compact-heading">
          <div><span class="eyebrow">Control térmico</span><h2>Temperaturas</h2></div>
          <button class="icon-button" data-action="refresh-history" aria-label="Actualizar historial de temperatura">${this._icon("refresh")}</button>
        </div>
        <div class="temperature-summary">
          ${this._renderMetric({ icon: "nozzle", label: "Boquilla actual", value: `${this._formatNumber(nozzle)}°C · máx ${this._formatNumber(nozzleMax)}°C`, entity: config.nozzleTemperature, tone: nozzle > 40 ? "hot" : "" })}
          ${this._renderMetric({ icon: "bed", label: "Cama actual", value: `${this._formatNumber(bed)}°C · máx ${this._formatNumber(bedMax)}°C`, entity: config.bedTemperature, tone: bed > 40 ? "hot" : "" })}
          ${this._renderMetric({ icon: "thermometer", label: "Cámara", value: `${this._formatNumber(chamber)}°C`, entity: config.chamberTemperature })}
        </div>
        <div class="temperature-controls">
          ${this._renderNumberControl(config.nozzleTarget, "Objetivo de boquilla", "nozzle")}
          ${this._renderNumberControl(config.bedTarget, "Objetivo de cama", "bed")}
        </div>
        <div class="chart-heading"><strong>Curva de temperatura</strong><span>Últimas ${this._escape(config.historyHours)} h</span></div>
        ${this._renderTemperatureChart()}
      </section>
    `;
  }

  _renderActionButton(operationKey) {
    const operation = this._operationDefinitions()[operationKey];
    if (!operation) return "";
    const pending = this._pending.has(operation.entity);
    const unavailable = this._isUnavailable(operation.entity);
    const availability = this._operationAvailability(operationKey);
    const disabled = unavailable || pending || !availability.allowed;
    const subtitle = unavailable ? "Entidad no disponible" : availability.reason;
    return `
      <button class="action-button ${operation.variant}" data-action="open-operation-confirm" data-operation-key="${this._escape(operation.key)}" ${disabled ? "disabled" : ""}>
        <span>${this._icon(operation.icon)}</span><span class="action-copy"><strong>${this._escape(pending ? operation.pendingLabel : operation.label)}</strong><small>${this._escape(subtitle)}</small></span>
      </button>
    `;
  }

  _renderControls() {
    const config = this._config();
    return `
      <section class="surface controls-card">
        <div class="section-heading compact-heading"><div><span class="eyebrow">Operación</span><h2>Controles de impresión</h2></div></div>
        <div class="action-grid">
          ${this._renderActionButton("pause")}
          ${this._renderActionButton("resume")}
          ${this._renderActionButton("stop")}
          ${this._renderActionButton("home")}
          ${this._renderActionButton("reconnect")}
        </div>
        <div class="speed-control-wrap">
          ${this._renderNumberControl(config.speedAdjustment, "Ajuste de velocidad", "speed")}
        </div>
      </section>
    `;
  }

  _renderFan(fan) {
    const stateObject = this._state(fan.entity);
    const unavailable = this._isUnavailable(fan.entity);
    const current = this._fanPercentage(fan.entity);
    const draft = this._draftValues.has(fan.entity) ? Number(this._draftValues.get(fan.entity)) : current;
    const dirty = Math.abs(current - draft) >= 0.5;
    const pending = this._pending.has(fan.entity);
    const disabled = unavailable || pending;
    return `
      <article class="utility-control ${current > 0 ? "is-on" : ""} ${dirty ? "has-draft" : ""} ${unavailable ? "is-unavailable" : ""}"
        data-draft-control data-current="${current}" data-unit="%" data-label="${this._escape(fan.name)}">
        <button class="utility-main" data-action="toggle-fan-draft" data-entity="${this._escape(fan.entity)}" ${disabled ? "disabled" : ""}>
          <span class="utility-icon">${this._icon("fan")}</span>
          <span><strong>${this._escape(fan.name)}</strong><small>${this._escape(unavailable ? "No disponible" : pending ? "Actualizando…" : `Actual: ${current}%`)}</small></span>
          <i class="switch"><b></b></i>
        </button>
        <input type="range" min="0" max="100" step="1" value="${draft}"
          data-input-action="stage-fan" data-change-action="stage-fan" data-entity="${this._escape(fan.entity)}"
          aria-label="Potencia de ${this._escape(fan.name)}" ${disabled ? "disabled" : ""}>
        <span class="draft-readout utility-draft" data-draft-readout>${dirty ? `Pendiente: ${draft}%` : "Sin cambios pendientes"}</span>
        <div class="draft-actions compact">
          <button class="draft-discard" data-action="discard-draft" data-entity="${this._escape(fan.entity)}" data-draft-discard ${!dirty || disabled ? "disabled" : ""}>Descartar</button>
          <button class="draft-apply" data-action="apply-fan-draft" data-entity="${this._escape(fan.entity)}" data-draft-apply ${!dirty || disabled ? "disabled" : ""}>${dirty ? `Aplicar ${draft}%` : `Aplicar ${this._escape(fan.name)}`}</button>
        </div>
      </article>
    `;
  }

  _renderUtilities() {
    const config = this._config();
    const lightState = this._state(config.printerLight);
    const lightOn = lightState?.state === "on";
    const lightUnavailable = this._isUnavailable(config.printerLight);
    return `
      <section class="surface utilities-card">
        <div class="section-heading compact-heading"><div><span class="eyebrow">Equipos auxiliares</span><h2>Luz y ventilación</h2></div></div>
        <div class="utilities-grid">
          <article class="utility-control light-control ${lightOn ? "is-on" : ""} ${lightUnavailable ? "is-unavailable" : ""}">
            <button class="utility-main full-height" data-action="toggle-entity" data-entity="${this._escape(config.printerLight)}" ${lightUnavailable || this._pending.has(config.printerLight) ? "disabled" : ""}>
              <span class="utility-icon">${this._icon("bulb")}</span>
              <span><strong>Luz de la impresora</strong><small>${this._escape(lightUnavailable ? "No disponible" : lightOn ? "Encendida" : "Apagada")}</small></span>
              <i class="switch"><b></b></i>
            </button>
          </article>
          ${config.fans.map((fan) => this._renderFan(fan)).join("")}
        </div>
      </section>
    `;
  }

  _renderPositions() {
    const config = this._config();
    const position = (axis, entity) => {
      const value = this._number(entity);
      const unit = this._unit(entity, "mm");
      return `
        <button class="position-tile" data-action="more-info" data-entity="${this._escape(entity)}">
          <span>${this._escape(axis)}</span><strong>${this._escape(this._formatNumber(value, 2))}</strong><small>${this._escape(unit)}</small>
        </button>`;
    };
    return `
      <section class="surface position-card">
        <div class="section-heading compact-heading"><div><span class="eyebrow">Mecánica</span><h2>Posición del cabezal</h2></div><span class="heading-icon">${this._icon("axis")}</span></div>
        <div class="position-grid">${position("X", config.positionX)}${position("Y", config.positionY)}${position("Z", config.positionZ)}</div>
      </section>
    `;
  }

  _renderConfirmationDialog() {
    const confirmation = this._confirmation;
    if (!confirmation) return "";

    let content;
    if (["number", "fan"].includes(confirmation.type)) {
      const previous = Number.isFinite(confirmation.previous)
        ? `${this._formatNumber(confirmation.previous)}${confirmation.unit}`
        : "Sin dato";
      content = {
        ...confirmation,
        entity: confirmation.entity,
        context: `Valor actual: ${previous} → Nuevo valor: ${this._formatNumber(confirmation.value)}${confirmation.unit}`,
      };
    } else {
      const operation = this._operationDefinitions()[confirmation.key];
      if (!operation) return "";
      const status = this._statusInfo();
      const object = this._text(this._config().object, "Sin objeto activo");
      content = {
        ...operation,
        context: `Estado: ${status.label} · Objeto: ${object}`,
      };
    }

    const pending = this._pending.has(content.entity);
    return `
      <div class="dialog-backdrop" data-action="cancel-operation-confirm">
        <section class="dialog-card tone-${this._escape(content.variant)}" role="dialog" aria-modal="true" aria-labelledby="operation-dialog-title" aria-describedby="operation-dialog-description" data-dialog-card tabindex="-1">
          <div class="dialog-icon tone-${this._escape(content.variant)}">${this._icon(content.icon)}</div>
          <span class="eyebrow">Confirmación de seguridad</span>
          <h2 id="operation-dialog-title">${this._escape(content.title)}</h2>
          <p id="operation-dialog-description">${this._escape(content.description)}</p>
          <div class="dialog-context">${this._escape(content.context)}</div>
          <div class="dialog-actions">
            <button class="secondary-button" data-action="cancel-operation-confirm" ${pending ? "disabled" : ""}>Volver</button>
            <button class="confirm-button ${this._escape(content.variant)}" data-action="confirm-operation" ${pending ? "disabled" : ""}>${this._escape(pending ? content.pendingLabel : content.confirmLabel)}</button>
          </div>
        </section>
      </div>
    `;
  }

  _updateClock() {
    if (!this.shadowRoot) return;
    const parts = new Intl.DateTimeFormat("es-BO", { hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(new Date());
    const time = `${parts.find((part) => part.type === "hour")?.value || "—"}:${parts.find((part) => part.type === "minute")?.value || "00"}`;
    const period = (parts.find((part) => part.type === "dayPeriod")?.value || "").replaceAll(".", "").toUpperCase();
    const timeEl = this.shadowRoot.querySelector("[data-clock]");
    const periodEl = this.shadowRoot.querySelector("[data-clock-period]");
    if (timeEl) timeEl.textContent = time;
    if (periodEl) periodEl.textContent = period;
  }

  render() {
    if (!this.shadowRoot || !this._hass) return;
    this.setAttribute("data-theme", this._theme);

    // Conserva el nodo de cámara y sus dos búferes entre renderizados completos.
    // Home Assistant puede emitir varios state_changed por segundo; retirar y
    // reconstruir el <img> en cada evento provocaría un destello negro.
    const preservedCameraFrame = this.shadowRoot.querySelector(".camera-frame");
    const preservedCameraEntity = preservedCameraFrame?.dataset?.entity || "";

    const config = this._config();
    const status = this._statusInfo();
    const progress = Math.max(0, Math.min(100, this._number(config.progress, 0)));
    const object = this._text(config.object, "Sin objeto activo");
    const clockParts = new Intl.DateTimeFormat("es-BO", { hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(new Date());
    const clock = `${clockParts.find((part) => part.type === "hour")?.value || "—"}:${clockParts.find((part) => part.type === "minute")?.value || "00"}`;
    const clockPeriod = (clockParts.find((part) => part.type === "dayPeriod")?.value || "").replaceAll(".", "").toUpperCase();
    const nextTheme = this._theme === "dark" ? "claro" : "oscuro";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #f26522;
          --primary-hover: #d95a1e;
          --primary-soft: rgba(242, 101, 34, .10);
          --primary-medium: rgba(242, 101, 34, .20);
          --primary-border: rgba(242, 101, 34, .34);
          --primary-glow: rgba(242, 101, 34, .20);
          --background: #061c2b;
          --surface: rgba(255,255,255,.035);
          --surface-hover: rgba(255,255,255,.06);
          --surface-active: rgba(242,101,34,.10);
          --surface-subtle: rgba(255,255,255,.025);
          --surface-control: rgba(255,255,255,.055);
          --surface-track: rgba(255,255,255,.08);
          --text-primary: rgba(255,255,255,.94);
          --text-secondary: rgba(255,255,255,.70);
          --text-tertiary: rgba(255,255,255,.48);
          --border-subtle: rgba(255,255,255,.065);
          --border-default: rgba(255,255,255,.10);
          --border-emphasis: rgba(255,255,255,.16);
          --header-background: rgba(11,43,64,.76);
          --modal-overlay: rgba(0,10,18,.78);
          --modal-surface: #0a2638;
          --card-shadow: rgba(0,0,0,.15);
          --modal-shadow: rgba(0,0,0,.44);
          --success: #22c55e;
          --warning: #f59e0b;
          --error: #ef4444;
          --info: #38bdf8;
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 22px;
          --radius-pill: 999px;
          --motion-fast: 180ms;
          --motion-base: 320ms;
          --ease: cubic-bezier(.16,1,.3,1);
          display: block;
          min-height: 100%;
          color-scheme: dark;
          color: var(--text-primary);
          background:
            radial-gradient(circle at 88% 6%, rgba(242,101,34,.12), transparent 30%),
            radial-gradient(circle at 5% 88%, rgba(11,43,64,.72), transparent 38%),
            linear-gradient(165deg,#071a26 0%,#0b2b40 55%,#0a2033 100%);
          font-family: "Plus Jakarta Sans", Inter, Arial, sans-serif;
        }
        :host([data-theme="light"]) {
          --background: #edf3f6;
          --surface: rgba(255,255,255,.86);
          --surface-hover: rgba(255,255,255,.98);
          --surface-active: rgba(242,101,34,.10);
          --surface-subtle: rgba(6,28,43,.035);
          --surface-control: rgba(6,28,43,.07);
          --surface-track: rgba(6,28,43,.09);
          --text-primary: rgba(6,28,43,.94);
          --text-secondary: rgba(6,28,43,.70);
          --text-tertiary: rgba(6,28,43,.50);
          --border-subtle: rgba(6,28,43,.08);
          --border-default: rgba(6,28,43,.12);
          --border-emphasis: rgba(6,28,43,.18);
          --header-background: rgba(255,255,255,.90);
          --modal-overlay: rgba(6,28,43,.42);
          --modal-surface: #fff;
          --card-shadow: rgba(6,28,43,.11);
          --modal-shadow: rgba(6,28,43,.24);
          color-scheme: light;
          background:
            radial-gradient(circle at 88% 6%, rgba(242,101,34,.13), transparent 30%),
            radial-gradient(circle at 5% 88%, rgba(11,43,64,.09), transparent 38%),
            var(--background);
        }
        * { box-sizing: border-box; }
        button, input { font: inherit; color: inherit; }
        button { -webkit-tap-highlight-color: transparent; }
        button:focus-visible, input:focus-visible { outline: 3px solid rgba(56,189,248,.68); outline-offset: 2px; }
        .app-shell { min-height: 100vh; container: print-panel / inline-size; }
        .topbar { position: sticky; top: 0; z-index: 20; min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px clamp(16px,2.4vw,30px); border-bottom: 1px solid var(--border-subtle); background: var(--header-background); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
        .topbar-start { min-width: 0; display: flex; align-items: center; gap: 10px; }
        .logo-frame { width: 120px; height: 42px; padding: 4px 6px; display: grid; place-items: center; overflow: hidden; border: 1px solid var(--border-default); border-radius: 14px; background: var(--surface-subtle); }
        .logo-frame img { width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1); mix-blend-mode: screen; }
        :host([data-theme="light"]) .logo-frame img { filter: none; mix-blend-mode: multiply; }
        .menu-button, .theme-button, .icon-button { display: grid; place-items: center; border: 1px solid var(--border-default); background: var(--surface-subtle); cursor: pointer; transition: background var(--motion-fast), border-color var(--motion-fast), transform var(--motion-fast); }
        .menu-button, .theme-button { width: 42px; height: 42px; border-radius: 50%; }
        .icon-button { width: 36px; height: 36px; border-radius: 12px; }
        .menu-button:hover, .theme-button:hover, .icon-button:hover { border-color: var(--primary-border); background: var(--surface-hover); }
        .menu-icon, .theme-icon { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .theme-icon-sun, .theme-icon-moon { transform-origin: 12px 12px; transition: opacity var(--motion-fast), transform var(--motion-base); }
        .theme-icon-sun { opacity: 0; transform: rotate(-35deg) scale(.55); }
        .theme-icon-moon { opacity: 1; transform: scale(1); }
        :host([data-theme="light"]) .theme-icon-sun { opacity: 1; transform: scale(1); }
        :host([data-theme="light"]) .theme-icon-moon { opacity: 0; transform: rotate(35deg) scale(.55); }
        .dashboard { width: min(1380px,100%); margin: 0 auto; padding: clamp(12px,2vw,22px); }
        .surface { position: relative; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--surface); box-shadow: 0 12px 30px var(--card-shadow), inset 0 1px 0 rgba(255,255,255,.025); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .hero-card { min-height: 116px; padding: 18px 20px; display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 22px; background: radial-gradient(circle at 92% 16%,rgba(242,101,34,.11),transparent 34%),var(--surface); }
        .hero-copy { min-width: 0; }
        .hero-copy small { display: block; margin-top: 7px; color: var(--text-secondary); font-size: 11px; }
        .hero-card h1 { margin: 0; font-family: Outfit,Inter,Arial,sans-serif; font-size: clamp(28px,3vw,38px); font-weight: 800; line-height: 1.04; letter-spacing: -.035em; }
        .hero-card h1 span { color: var(--primary); white-space: nowrap; }
        .hero-status { display: flex; align-items: center; justify-content: flex-end; gap: 18px; }
        .hero-clock { display: inline-flex; align-items: baseline; gap: 6px; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .hero-clock strong { font-family: Outfit,Inter,Arial,sans-serif; font-size: clamp(27px,3vw,34px); font-weight: 800; line-height: 1; letter-spacing: -.04em; }
        .hero-clock span { color: var(--text-secondary); font-size: 10px; font-weight: 800; letter-spacing: .08em; }
        .hero-printer { min-width: 164px; padding-left: 18px; display: grid; grid-template-columns: 38px auto; align-items: center; gap: 10px; border-left: 1px solid var(--border-default); }
        .hero-printer-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; background: var(--primary-soft); color: var(--primary); }
        .hero-printer-icon .icon { width: 20px; height: 20px; }
        .hero-printer-copy small, .hero-printer-copy strong, .hero-printer-copy span { display: block; }
        .hero-printer-copy small { color: var(--text-secondary); font-size: 9px; font-weight: 700; }
        .hero-printer-copy strong { margin-top: 2px; font-family: Outfit,Inter,Arial,sans-serif; font-size: 16px; font-weight: 800; }
        .hero-printer-copy span { margin-top: 2px; color: var(--text-tertiary); font-size: 9px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hero-printer.tone-active .hero-printer-icon { background: rgba(34,197,94,.14); color: var(--success); }
        .hero-printer.tone-warning .hero-printer-icon { background: rgba(245,158,11,.14); color: var(--warning); }
        .hero-printer.tone-danger .hero-printer-icon { background: rgba(239,68,68,.14); color: var(--error); }
        .hero-printer.tone-success .hero-printer-icon { background: rgba(34,197,94,.14); color: var(--success); }
        .content-grid { margin-top: 14px; display: grid; grid-template-columns: repeat(12,minmax(0,1fr)); gap: 14px; align-items: start; }
        .progress-card { grid-column: span 5; padding: 16px; }
        .camera-card { grid-column: span 7; padding: 16px; }
        .details-card, .temperatures-card, .controls-card, .utilities-card, .position-card { grid-column: 1 / -1; padding: 16px; }
        .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .section-heading h2 { margin: 0; font-family: Outfit,Inter,Arial,sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -.02em; }
        .eyebrow { width: fit-content; min-height: 23px; margin: 0 0 7px; padding: 0 9px; display: inline-flex; align-items: center; border: 1px solid rgba(242,101,34,.20); border-radius: var(--radius-pill); background: var(--primary-soft); color: var(--primary); font-size: 8px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
        .icon { width: 20px; height: 20px; fill: currentColor; }
        .progress-body { display: grid; grid-template-columns: 150px minmax(0,1fr); align-items: center; gap: 16px; }
        .progress-ring { position: relative; width: 144px; aspect-ratio: 1; display: grid; place-items: center; }
        .progress-ring svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
        .ring-track, .ring-value { fill: none; stroke-width: 10; }
        .ring-track { stroke: var(--surface-track); }
        .ring-value { stroke: var(--primary); stroke-linecap: round; transition: stroke-dashoffset .5s var(--ease); filter: drop-shadow(0 0 5px var(--primary-glow)); }
        .progress-ring div { text-align: center; }
        .progress-ring strong { display: block; font-family: Outfit,Inter,Arial,sans-serif; font-size: 30px; font-weight: 800; letter-spacing: -.04em; }
        .progress-ring span { display: block; margin-top: 2px; color: var(--text-tertiary); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
        .progress-copy { min-width: 0; display: flex; align-items: flex-start; gap: 10px; }
        .object-icon { flex: 0 0 42px; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; background: var(--primary-soft); color: var(--primary); }
        .progress-copy small, .progress-copy strong, .progress-copy span { display: block; }
        .progress-copy small { color: var(--text-tertiary); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
        .progress-copy strong { margin-top: 4px; font-size: 14px; line-height: 1.25; overflow-wrap: anywhere; }
        .progress-copy span { margin-top: 7px; color: var(--text-secondary); font-size: 11px; }
        .progress-stats { margin-top: 14px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }
        .progress-stats div { padding: 10px 12px; border: 1px solid var(--border-subtle); border-radius: 13px; background: var(--surface-subtle); }
        .progress-stats small, .progress-stats strong { display: block; }
        .progress-stats small { color: var(--text-tertiary); font-size: 9px; }
        .progress-stats strong { margin-top: 3px; font-size: 13px; }
        .camera-layout { min-height: 300px; display: grid; grid-template-columns: 1fr; gap: 10px; }
        .camera-layout.has-preview { grid-template-columns: minmax(0,2fr) minmax(170px,.8fr); }
        .camera-frame, .preview-frame { position: relative; min-width: 0; min-height: 260px; padding: 0; overflow: hidden; border: 1px solid var(--border-default); border-radius: 17px; background: #071722; cursor: pointer; }
        .preview-frame { min-height: 260px; }
        .camera-live-stack { position: absolute; inset: 0; z-index: 1; overflow: hidden; background: #071722; pointer-events: none; }
        .camera-live-frame { position: absolute; inset: 0; width: 100%; height: 100%; display: block; object-fit: cover; opacity: 0; visibility: hidden; }
        .camera-live-frame.is-active { opacity: 1; visibility: visible; }
        .preview-frame img { width: 100%; height: 100%; display: block; object-fit: cover; }
        .camera-frame::after, .preview-frame::after { content: ""; position: absolute; inset: auto 0 0; z-index: 2; height: 40%; background: linear-gradient(transparent,rgba(0,0,0,.65)); pointer-events: none; }
        .camera-label, .preview-frame span { position: absolute; left: 12px; right: 12px; bottom: 10px; z-index: 3; color: rgba(255,255,255,.9); font-size: 10px; font-weight: 700; text-align: left; }
        .media-placeholder { width: 100%; height: 100%; min-height: 260px; display: grid; place-items: center; align-content: center; gap: 8px; color: rgba(255,255,255,.55); }
        .media-placeholder .icon { width: 34px; height: 34px; }
        .metric-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 9px; }
        .metric-tile { min-width: 0; min-height: 78px; padding: 11px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--border-default); border-radius: 15px; background: var(--surface-subtle); text-align: left; cursor: pointer; transition: background var(--motion-fast), border-color var(--motion-fast); }
        .metric-tile:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--primary-border); }
        .metric-icon { flex: 0 0 38px; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background: var(--surface-control); color: var(--text-secondary); }
        .metric-copy { min-width: 0; }
        .metric-copy small, .metric-copy strong { display: block; }
        .metric-copy small { color: var(--text-tertiary); font-size: 9px; }
        .metric-copy strong { margin-top: 4px; font-size: 12px; line-height: 1.25; overflow-wrap: anywhere; }
        .metric-tile.tone-hot .metric-icon { background: rgba(239,68,68,.13); color: var(--error); }
        .temperature-summary { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 9px; }
        .temperature-controls { margin-top: 10px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
        .number-control { padding: 12px; border: 1px solid var(--border-default); border-radius: 15px; background: var(--surface-subtle); }
        .control-heading { display: flex; align-items: center; gap: 10px; }
        .control-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background: var(--primary-soft); color: var(--primary); }
        .control-copy { min-width: 0; }
        .control-heading small, .control-heading strong, .draft-readout { display: block; }
        .control-heading small { color: var(--text-tertiary); font-size: 9px; }
        .control-heading strong { margin-top: 3px; font-size: 13px; }
        .draft-readout { margin-top: 3px; color: var(--text-tertiary); font-size: 9px; font-weight: 700; }
        .number-control.has-draft, .utility-control.has-draft { border-color: var(--primary-border); box-shadow: inset 0 0 0 1px var(--primary-soft); }
        .has-draft .draft-readout { color: var(--primary); }
        .number-actions { margin-top: 10px; display: grid; grid-template-columns: 34px 1fr 34px; align-items: center; gap: 8px; }
        .number-actions button { width: 34px; height: 34px; border: 1px solid var(--border-default); border-radius: 10px; background: var(--surface-control); cursor: pointer; font-size: 18px; }
        input[type="range"] { width: 100%; accent-color: var(--primary); cursor: pointer; }
        .draft-actions { margin-top: 10px; display: grid; grid-template-columns: minmax(90px,.7fr) minmax(130px,1fr); gap: 8px; }
        .draft-actions.compact { grid-template-columns: 1fr 1fr; }
        .draft-actions button { min-height: 34px; padding: 7px 10px; border-radius: 10px; cursor: pointer; font-size: 9px; font-weight: 800; }
        .draft-discard { border: 1px solid var(--border-default); background: var(--surface-control); color: var(--text-secondary); }
        .draft-apply { border: 1px solid var(--primary-border); background: var(--primary); color: #fff; }
        .draft-actions button:disabled { opacity: .42; }
        .chart-heading { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .chart-heading strong { font-size: 12px; }
        .chart-heading span { color: var(--text-tertiary); font-size: 9px; }
        .temperature-chart { margin-top: 7px; padding: 9px 9px 7px; border: 1px solid var(--border-subtle); border-radius: 15px; background: var(--surface-subtle); }
        .temperature-chart svg { width: 100%; height: 190px; display: block; overflow: visible; }
        .temperature-chart text { fill: var(--text-tertiary); font-size: 9px; }
        .chart-grid-line { stroke: var(--border-subtle); stroke-width: 1; }
        .temp-line { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
        .temp-line.nozzle { stroke: #ef4444; }
        .temp-line.bed { stroke: #f59e0b; }
        .temp-line.chamber { stroke: #38bdf8; }
        .chart-legend { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px; }
        .chart-legend span { display: inline-flex; align-items: center; gap: 5px; color: var(--text-secondary); font-size: 9px; }
        .chart-legend i { width: 16px; height: 3px; border-radius: 999px; }
        .chart-legend .nozzle i { background: #ef4444; } .chart-legend .bed i { background: #f59e0b; } .chart-legend .chamber i { background: #38bdf8; }
        .chart-empty { min-height: 180px; margin-top: 8px; display: grid; place-items: center; align-content: center; gap: 6px; border: 1px dashed var(--border-default); border-radius: 15px; color: var(--text-tertiary); text-align: center; }
        .chart-empty strong { color: var(--text-secondary); font-size: 12px; }
        .chart-empty span { max-width: 360px; font-size: 9px; }
        .action-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 9px; }
        .action-button { min-width: 0; min-height: 82px; padding: 11px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--border-default); border-radius: 15px; background: var(--surface-subtle); text-align: left; cursor: pointer; transition: transform var(--motion-fast), background var(--motion-fast), border-color var(--motion-fast); }
        .action-button:hover:not(:disabled) { transform: translateY(-1px); background: var(--surface-hover); border-color: var(--primary-border); }
        .action-button > span:first-child { flex: 0 0 38px; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background: var(--primary-soft); color: var(--primary); }
        .action-copy { min-width: 0; }
        .action-copy strong, .action-copy small { display: block; }
        .action-copy strong { font-size: 12px; }
        .action-copy small { margin-top: 4px; color: var(--text-tertiary); font-size: 8px; line-height: 1.25; }
        .action-button.warning > span:first-child { background: rgba(245,158,11,.13); color: var(--warning); }
        .action-button.success > span:first-child { background: rgba(34,197,94,.13); color: var(--success); }
        .action-button.danger > span:first-child { background: rgba(239,68,68,.13); color: var(--error); }
        .action-button.info > span:first-child { background: rgba(56,189,248,.13); color: var(--info); }
        .action-button::after { content: "Confirmar"; margin-left: auto; align-self: flex-start; padding: 3px 6px; border: 1px solid var(--border-default); border-radius: 999px; color: var(--text-tertiary); font-size: 7px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
        .speed-control-wrap { margin-top: 10px; }
        .utilities-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 9px; }
        .utility-control { min-width: 0; padding: 10px; border: 1px solid var(--border-default); border-radius: 15px; background: var(--surface-subtle); }
        .utility-main { width: 100%; padding: 0; display: grid; grid-template-columns: 38px minmax(0,1fr) auto; align-items: center; gap: 9px; border: 0; background: transparent; text-align: left; cursor: pointer; }
        .utility-main.full-height { min-height: 48px; }
        .utility-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background: var(--surface-control); color: var(--text-secondary); }
        .utility-main strong, .utility-main small { display: block; }
        .utility-main strong { font-size: 11px; }
        .utility-main small { margin-top: 3px; color: var(--text-tertiary); font-size: 8px; }
        .utility-control input { margin-top: 10px; }
        .utility-draft { margin-top: 5px; }
        .switch { width: 31px; height: 18px; padding: 2px; display: inline-flex; align-items: center; border: 1px solid var(--border-default); border-radius: 999px; background: var(--surface-control); }
        .switch b { width: 12px; height: 12px; border-radius: 50%; background: var(--text-tertiary); transition: transform var(--motion-fast), background var(--motion-fast); }
        .utility-control.is-on { border-color: var(--primary-border); background: var(--surface-active); }
        .utility-control.is-on .utility-icon { background: var(--primary-soft); color: var(--primary); }
        .utility-control.is-on .switch { background: var(--primary-medium); border-color: var(--primary-border); }
        .utility-control.is-on .switch b { transform: translateX(13px); background: var(--primary); }
        .position-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; }
        .position-tile { min-height: 105px; display: grid; place-items: center; align-content: center; gap: 2px; border: 1px solid var(--border-default); border-radius: 16px; background: var(--surface-subtle); cursor: pointer; }
        .position-tile span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 10px; background: var(--primary-soft); color: var(--primary); font-weight: 800; }
        .position-tile strong { margin-top: 5px; font-family: Outfit,Inter,Arial,sans-serif; font-size: 24px; letter-spacing: -.04em; }
        .position-tile small { color: var(--text-tertiary); font-size: 9px; }
        .heading-icon { color: var(--primary); }
        .dialog-backdrop { position: fixed; inset: 0; z-index: 100; padding: 18px; display: grid; place-items: center; background: var(--modal-overlay); backdrop-filter: blur(8px); }
        .dialog-card { width: min(460px,100%); padding: 24px; border: 1px solid var(--primary-border); border-radius: 24px; background: var(--modal-surface); box-shadow: 0 24px 70px var(--modal-shadow); text-align: center; }
        .dialog-card.tone-warning { border-color: rgba(245,158,11,.40); }
        .dialog-card.tone-danger { border-color: rgba(239,68,68,.42); }
        .dialog-card.tone-success { border-color: rgba(34,197,94,.38); }
        .dialog-icon { width: 50px; height: 50px; margin: 0 auto 12px; display: grid; place-items: center; border-radius: 15px; background: var(--primary-soft); color: var(--primary); }
        .dialog-icon.tone-warning { background: rgba(245,158,11,.13); color: var(--warning); }
        .dialog-icon.tone-danger { background: rgba(239,68,68,.13); color: var(--error); }
        .dialog-icon.tone-success { background: rgba(34,197,94,.13); color: var(--success); }
        .dialog-card h2 { margin: 0; font-family: Outfit,Inter,Arial,sans-serif; font-size: 22px; }
        .dialog-card p { margin: 10px 0 0; color: var(--text-secondary); font-size: 11px; line-height: 1.55; }
        .dialog-context { margin-top: 14px; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: 12px; background: var(--surface-subtle); color: var(--text-secondary); font-size: 9px; font-weight: 700; line-height: 1.45; overflow-wrap: anywhere; }
        .dialog-actions { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .dialog-actions button { min-height: 42px; border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 11px; }
        .secondary-button { border: 1px solid var(--border-default); background: var(--surface-control); }
        .confirm-button { border: 0; background: var(--primary); color: white; }
        .confirm-button.warning { background: var(--warning); color: #1d1300; }
        .confirm-button.danger { background: var(--error); color: white; }
        .confirm-button.success { background: var(--success); color: #03210d; }
        .toast { position: fixed; right: 18px; bottom: 18px; z-index: 110; max-width: min(380px,calc(100vw - 36px)); padding: 12px 15px; border: 1px solid var(--border-default); border-radius: 14px; background: var(--modal-surface); box-shadow: 0 16px 42px var(--modal-shadow); font-size: 11px; }
        .toast.error { border-color: rgba(239,68,68,.45); }
        .toast.success { border-color: rgba(34,197,94,.42); }
        .toast.warning { border-color: rgba(245,158,11,.45); }
        button:disabled, input:disabled, .is-unavailable { opacity: .48; cursor: not-allowed; }
        @container print-panel (max-width: 1100px) {
          .progress-card, .camera-card { grid-column: 1 / -1; }
          .camera-layout.has-preview { grid-template-columns: minmax(0,2fr) minmax(180px,1fr); }
          .metric-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .action-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
          .utilities-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
        }
        @media (max-width: 1100px) {
          .progress-card, .camera-card { grid-column: 1 / -1; }
          .metric-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .action-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
          .utilities-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
        }
        @container print-panel (max-width: 760px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr; gap: 12px; }
          .hero-copy { padding-bottom: 10px; border-bottom: 1px solid var(--border-subtle); }
          .hero-card h1 { font-size: clamp(22px,5.5vw,30px); }
          .hero-status { width: 100%; justify-content: space-between; gap: 10px; }
          .hero-clock strong { font-size: 26px; }
          .hero-printer { min-width: 0; padding-left: 0; border-left: 0; grid-template-columns: 34px minmax(0,1fr); }
          .hero-printer-icon { width: 34px; height: 34px; }
          .progress-body { grid-template-columns: 128px minmax(0,1fr); }
          .progress-ring { width: 124px; }
          .camera-layout.has-preview { grid-template-columns: 1fr; }
          .camera-frame, .preview-frame { min-height: 230px; }
          .temperature-summary, .temperature-controls, .position-grid { grid-template-columns: 1fr; }
          .action-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
        }
        @media (max-width: 760px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr; gap: 12px; }
          .hero-copy { padding-bottom: 10px; border-bottom: 1px solid var(--border-subtle); }
          .hero-card h1 { font-size: clamp(22px,5.5vw,30px); }
          .hero-status { width: 100%; justify-content: space-between; gap: 10px; }
          .hero-clock strong { font-size: 26px; }
          .hero-printer { min-width: 0; padding-left: 0; border-left: 0; grid-template-columns: 34px minmax(0,1fr); }
          .progress-body { grid-template-columns: 128px minmax(0,1fr); }
          .progress-ring { width: 124px; }
          .camera-layout.has-preview { grid-template-columns: 1fr; }
          .temperature-summary, .temperature-controls, .position-grid { grid-template-columns: 1fr; }
          .action-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
        }
        @container print-panel (max-width: 520px) {
          .topbar { min-height: 56px; padding: 7px 14px; }
          .menu-button, .theme-button { width: 40px; height: 40px; }
          .logo-frame { width: 108px; height: 38px; }
          .hero-status { align-items: center; }
          .hero-printer-copy span { max-width: 118px; }
          .progress-body { grid-template-columns: 1fr; text-align: center; }
          .progress-ring { margin: 0 auto; }
          .progress-copy { justify-content: center; text-align: left; }
          .metric-grid, .action-grid, .utilities-grid { grid-template-columns: 1fr; }
          .camera-frame, .preview-frame, .media-placeholder { min-height: 210px; }
          .section-heading h2 { font-size: 18px; }
          .dialog-actions { grid-template-columns: 1fr; }
          .temperature-chart svg { height: 160px; }
          .toast { right: 10px; bottom: 10px; }
        }
        @media (max-width: 520px) {
          .topbar { min-height: 56px; padding: 7px 14px; }
          .logo-frame { width: 108px; height: 38px; }
          .progress-body { grid-template-columns: 1fr; text-align: center; }
          .progress-ring { margin: 0 auto; }
          .progress-copy { justify-content: center; text-align: left; }
          .metric-grid, .action-grid, .utilities-grid { grid-template-columns: 1fr; }
          .dialog-actions { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) { *,*::before,*::after { scroll-behavior: auto !important; animation: none !important; transition: none !important; } }
        @media (max-width: 760px), (prefers-reduced-transparency: reduce) { .surface,.topbar { backdrop-filter: none; -webkit-backdrop-filter: none; } }
      </style>

      <div class="app-shell">
        <header class="topbar">
          <div class="topbar-start">
            <button class="menu-button" data-action="toggle-menu" aria-label="Abrir menú de Home Assistant" title="Abrir menú">${MENU_ICON}</button>
            <div class="logo-frame"><img src="${this._escape(config.logo)}" alt="Witmind"></div>
          </div>
          <button class="theme-button" data-action="toggle-theme" aria-label="Cambiar a tema ${nextTheme}" title="Cambiar a tema ${nextTheme}" aria-pressed="${this._theme === "light"}">${THEME_ICON}</button>
        </header>

        <main class="dashboard">
          <section class="surface hero-card">
            <div class="hero-copy">
              <h1>${this._escape(config.title)} <span>${this._escape(config.brand)}</span></h1>
              <small>${this._escape(config.subtitle)}</small>
            </div>
            <div class="hero-status">
              <time class="hero-clock"><strong data-clock>${this._escape(clock)}</strong><span data-clock-period>${this._escape(clockPeriod)}</span></time>
              <div class="hero-printer tone-${this._escape(status.tone)}" aria-label="Estado de impresión: ${this._escape(status.label)}; progreso ${this._formatNumber(progress,0)} por ciento">
                <span class="hero-printer-icon">${this._icon("printer")}</span>
                <span class="hero-printer-copy"><small>${this._escape(status.label)}</small><strong>${this._formatNumber(progress,0)}%</strong><span>${this._escape(object)}</span></span>
              </div>
            </div>
          </section>

          <div class="content-grid">
            ${this._renderProgress()}
            ${this._renderCamera()}
            ${this._renderDetails()}
            ${this._renderTemperatures()}
            ${this._renderControls()}
            ${this._renderUtilities()}
            ${this._renderPositions()}
          </div>
        </main>

        ${this._renderConfirmationDialog()}
        ${this._toast ? `<div class="toast ${this._escape(this._toast.type)}" role="status">${this._escape(this._toast.message)}</div>` : ""}
      </div>
    `;

    const freshCameraFrame = this.shadowRoot.querySelector(".camera-frame");
    if (
      preservedCameraFrame &&
      freshCameraFrame &&
      preservedCameraEntity &&
      preservedCameraEntity === freshCameraFrame.dataset.entity
    ) {
      const freshLabel = freshCameraFrame.querySelector(".camera-label")?.textContent || `${Math.round(config.cameraFps)} FPS`;
      const preservedLabel = preservedCameraFrame.querySelector(".camera-label");
      if (preservedLabel) preservedLabel.textContent = freshLabel;
      freshCameraFrame.replaceWith(preservedCameraFrame);
    }

    if (this._confirmation) {
      requestAnimationFrame(() => {
        this.shadowRoot?.querySelector(".dialog-card")?.focus({ preventScroll: true });
      });
    }
  }
}

if (!customElements.get("impresiones-panel")) {
  customElements.define("impresiones-panel", ImpresionesPanel);
}
