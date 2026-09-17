/**
 * Showroom Witmind OS — Commercial Edition (Native Web Component)
 *
 * Estándares: Savant + Crestron Home OS 4 + Basalte
 * Sistema de Diseño Comercial:
 *   - Tipografía Manrope con cifras tabulares (font-variant-numeric: tabular-nums)
 *   - Arquitectura de 3 capas de superficie (Canvas Nivel 0 -> Contenido Nivel 1 -> Flotantes/Sheets Nivel 2)
 *   - Naranja Witmind (#f26522) disciplinado como luz de acento (5-8% de superficie visual)
 *   - Modo Kiosk real: cero banners de desarrollo salvo con ?dev=1
 *   - Cuadrícula de espaciado estricta 4/8px y radios consistentes (14/22/28px)
 *   - Iconografía lineal SVG consistente (1.8-2.0px stroke, sin emojis)
 *   - Lenguaje global de estados (default, active, pending, success, warning, danger, unavailable)
 *   - Desacoplado sobre el proveedor reactivo mock/mock-hass.js
 */

const DEMO_WIDGET_DATA = {
  calendar: true,
  camera: false,
  climate: false
};

const ENTITIES = {
  weather: "weather.forecast_casa",
  media: "media_player.showroom_1",
  lightCount: "sensor.showroom_luminarias_encendidas",
  energy: "sensor.showroom_energia_estimada",
  power: "sensor.showroom_potencia_estimada",
  battery: "sensor.21051182g_battery_level",
  presentation: "scene.presentacion",
  meeting: "scene.reunion",
  allOn: "script.showroom_encendido_general",
  allOff: "script.showroom_apagado_general"
};

const SPOTS = [
  { id: "switch.interruptor_inteligente_switch_1", name: "Spots ventana", subtitle: "Zona ventana", watts: 100 },
  { id: "switch.interruptor_inteligente_switch_2", name: "Spots 2×3", subtitle: "Muestra 2 × 3", watts: 120 },
  { id: "switch.interruptor_inteligente_switch_3", name: "Spots 3×3", subtitle: "Muestra 3 × 3", watts: 180 },
  { id: "switch.interruptor_inteligente_switch_4", name: "Spots TV", subtitle: "Zona audiovisual", watts: 25 }
];

const SAMPLES = [
  { id: "switch.interruptor_inteligente_2_switch_1", name: "Paneles 3k/6k", subtitle: "Temperaturas color", watts: 96 },
  { id: "switch.interruptor_inteligente_2_switch_2", name: "Colgantes", subtitle: "Muestra suspendida", watts: 10 },
  { id: "switch.interruptor_inteligente_2_switch_3", name: "Slims", subtitle: "Línea decorativa", watts: 432 },
  { id: "switch.interruptor_inteligente_2_switch_4", name: "Downlights", subtitle: "Iluminación empotrada", watts: 144 },
  { id: "switch.smart_relay_switch_4_switch", name: "Paneles", subtitle: "Control por relé", watts: 288 }
];

const REFLECTOR = {
  id: "switch.smart_relay_switch_3_switch",
  name: "Reflector exterior",
  subtitle: "Control aislado",
  watts: 0
};

const ALL_CIRCUITS = [...SPOTS, ...SAMPLES, REFLECTOR];
const TOTAL_NOMINAL_CAPACITY_W = 1395;

/* SVG Linear Icons Helper */
const ICONS = {
  bulb: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>`,
  zap: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line></svg>`,
  music: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
  sparkles: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path></svg>`,
  users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`,
  calendar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>`,
  layers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
  battery: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"></rect><line x1="22" x2="22" y1="11" y2="13"></line></svg>`,
  checkCircle: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  alertTriangle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  pause: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"></rect><rect width="4" height="16" x="14" y="4"></rect></svg>`,
  skipBack: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" x2="5" y1="19" y2="5"></line></svg>`,
  skipForward: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" x2="19" y1="5" y2="19"></line></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

class ShowroomWitmindOs extends HTMLElement {
  static get observedAttributes() {
    return ["theme"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._theme = this.getAttribute("theme") || (new URLSearchParams(window.location.search).get("theme") === "light" ? "light" : "dark");
    this._page = 0; // 0: Home / Operation, 1: Analytics / Extended Control
    this._sheet = null; // null | "lights" | "weather"
    this._statsTimeframe = "day"; // "day" | "month" | "year"
    this._forecast = [];
    this._stats = [];
    this._recentActivity = [
      { text: "Spots ventana encendidos", time: "hace 2 min", type: "light" },
      { text: "Ambient Lounge reproducción iniciada", time: "hace 6 min", type: "media" },
      { text: "Escena Presentación aplicada", time: "hace 14 min", type: "scene" },
      { text: "Sincronización de telemetría OK", time: "hace 18 min", type: "system" }
    ];

    this._timeStr = this._getCurrentTimeString();
    this._dateStr = this._getCurrentDateString();
    this._timeInterval = null;
    this._unsubForecast = null;
    this._unsubEvents = null;
    this._isDev = new URLSearchParams(window.location.search).has("dev");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "theme" && oldValue !== newValue) {
      this._theme = newValue === "light" ? "light" : "dark";
      this.render();
    }
  }

  set hass(value) {
    this._hass = value;
    this.render();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    if (!this.hasAttribute("theme")) {
      this.setAttribute("theme", this._theme);
    }

    this._timeInterval = setInterval(() => {
      this._timeStr = this._getCurrentTimeString();
      this._dateStr = this._getCurrentDateString();
      const clockEl = this.shadowRoot?.querySelector("#witClockDigits");
      if (clockEl) clockEl.textContent = this._timeStr;
      const dateEl = this.shadowRoot?.querySelector("#witDateLabel");
      if (dateEl) dateEl.textContent = this._dateStr;
    }, 1000);

    this._subscribeForecast();
    this._subscribeEvents();
    this._fetchStatistics();
    this.render();
  }

  disconnectedCallback() {
    if (this._timeInterval) clearInterval(this._timeInterval);
    if (this._unsubForecast) {
      try { this._unsubForecast(); } catch (_e) {}
    }
    if (this._unsubEvents) {
      try { this._unsubEvents(); } catch (_e) {}
    }
  }

  _getCurrentTimeString() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  _getCurrentDateString() {
    const now = new Date();
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  }

  _subscribeForecast() {
    if (this._hass?.connection?.subscribeMessage) {
      try {
        this._hass.connection
          .subscribeMessage(
            (msg) => {
              if (msg && msg.forecast) {
                this._forecast = msg.forecast;
                this.render();
              }
            },
            { type: "weather/subscribe_forecast", entity_id: ENTITIES.weather }
          )
          .then((unsub) => {
            this._unsubForecast = unsub;
          })
          .catch(() => {});
      } catch (_e) {}
    }
  }

  _subscribeEvents() {
    if (this._hass?.connection?.subscribeEvents) {
      try {
        this._hass.connection
          .subscribeEvents((ev) => {
            if (ev?.event_type === "state_changed" && ev?.data?.entity_id) {
              const entityId = ev.data.entity_id;
              const newState = ev.data.new_state?.state;
              const name = ev.data.new_state?.attributes?.friendly_name || entityId.split(".")[1] || entityId;
              const type = entityId.startsWith("switch") ? "light" : entityId.startsWith("media") ? "media" : "scene";
              this._recentActivity.unshift({
                text: `${name}: ${newState === "on" ? "Encendido" : newState === "off" ? "Apagado" : newState}`,
                time: "hace un momento",
                type
              });
              if (this._recentActivity.length > 8) this._recentActivity.pop();
              this.render();
            }
          }, "state_changed")
          .then((unsub) => {
            this._unsubEvents = unsub;
          })
          .catch(() => {});
      } catch (_e) {}
    }
  }

  async _fetchStatistics() {
    if (this._hass?.connection?.sendMessagePromise || this._hass?.callWS) {
      try {
        const now = Date.now();
        const start = now - 24 * 3600 * 1000;
        const msg = {
          type: "recorder/statistics_during_period",
          start_time: new Date(start).toISOString(),
          end_time: new Date(now).toISOString(),
          statistic_ids: [ENTITIES.energy],
          period: "hour"
        };
        let res = null;
        if (this._hass.connection?.sendMessagePromise) {
          res = await this._hass.connection.sendMessagePromise(msg);
        } else if (this._hass.callWS) {
          res = await this._hass.callWS(msg);
        }

        if (res && res[ENTITIES.energy]) {
          this._stats = res[ENTITIES.energy];
          this.render();
        }
      } catch (_e) {}
    }
  }

  _state(entityId) {
    return this._hass?.states?.[entityId];
  }

  _value(entityId, fallback = "—") {
    return this._state(entityId)?.state ?? fallback;
  }

  _attr(entityId, attrName, fallback = null) {
    return this._state(entityId)?.attributes?.[attrName] ?? fallback;
  }

  _callService(domain, service, data = {}) {
    if (this._hass?.callService) {
      this._hass.callService(domain, service, data);
    }
  }

  _toggleSwitch(entityId) {
    const curr = this._value(entityId, "off");
    const desired = curr === "on" ? "turn_off" : "turn_on";
    this._callService("switch", desired, { entity_id: entityId });
  }

  _toggleTheme() {
    this._theme = this._theme === "light" ? "dark" : "light";
    this.setAttribute("theme", this._theme);
    this.render();
  }

  _openSheet(name) {
    this._sheet = name;
    this.render();
  }

  _closeSheet() {
    this._sheet = null;
    this.render();
  }

  _setPage(pageNum) {
    this._page = pageNum;
    const track = this.shadowRoot?.querySelector("#carouselTrack");
    if (track) {
      const targetPane = this.shadowRoot?.querySelectorAll(".carousel-pane")?.[pageNum];
      if (targetPane) {
        targetPane.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      }
    }
    this.render();
  }

  _detectActiveAmbience() {
    const s1 = this._value("switch.interruptor_inteligente_switch_1");
    const s2 = this._value("switch.interruptor_inteligente_switch_2");
    const s3 = this._value("switch.interruptor_inteligente_switch_3");
    const s4 = this._value("switch.interruptor_inteligente_switch_4");
    const slims = this._value("switch.interruptor_inteligente_2_switch_3");
    const count = Number(this._value(ENTITIES.lightCount, "0"));

    if (count === 0) return { name: "Reposo", sub: "Todo apagado", isPreset: false };
    if (s1 === "on" && s4 === "on" && s2 === "off" && s3 === "off" && slims === "off") {
      return { name: "Presentación", sub: "Ventana + TV activas", isPreset: true };
    }
    if (s1 === "on" && s2 === "on" && s3 === "off" && s4 === "off" && slims === "off") {
      return { name: "Reunión", sub: "Spots 2×3 + Ventana", isPreset: true };
    }
    if (count === 9) return { name: "Encendido Total", sub: "Todos los circuitos", isPreset: true };
    return { name: "Personalizado", sub: `${count} luminarias activas`, isPreset: false };
  }

  /* RENDER METHODS */

  _renderStatusPills(totalActive, powerWatts, isPlaying, energyKwh, batteryVal, isBatteryLow) {
    const pills = [];

    if (isBatteryLow) {
      pills.push(`
        <div class="status-pill is-warning" id="pillBatWarn">
          <span class="pill-icon">${ICONS.alertTriangle}</span>
          <div class="pill-texts">
            <span class="pill-title">Batería baja</span>
            <span class="pill-meta">${batteryVal}%</span>
          </div>
        </div>
      `);
    }

    pills.push(`
      <div class="status-pill is-active-pill" id="pillLights">
        <span class="pill-icon active-accent">${ICONS.bulb}</span>
        <div class="pill-texts">
          <span class="pill-title">${totalActive} luces</span>
          <span class="pill-meta">${powerWatts} W</span>
        </div>
      </div>
    `);

    pills.push(`
      <div class="status-pill" id="pillMedia">
        <span class="pill-icon ${isPlaying ? "active-accent" : ""}">${ICONS.music}</span>
        <div class="pill-texts">
          <span class="pill-title">${isPlaying ? "Ambient Lounge" : "Audio en pausa"}</span>
          <span class="pill-meta">Witmind Studio</span>
        </div>
      </div>
    `);

    pills.push(`
      <div class="status-pill" id="pillEnergy">
        <span class="pill-icon">${ICONS.zap}</span>
        <div class="pill-texts">
          <span class="pill-title">${energyKwh} kWh</span>
          <span class="pill-meta">Consumo hoy</span>
        </div>
      </div>
    `);

    return pills.slice(0, 4).join("");
  }

  _renderHeroWidget(totalActive, powerWatts) {
    return `
      <section class="card hero-card">
        <div class="hero-brand-col">
          <span class="hero-kicker">SHOWROOM WITMIND</span>
          <h1 class="hero-title">Iluminación de precisión</h1>
          <p class="hero-caption">${totalActive} de ${ALL_CIRCUITS.length} luminarias activas • ${powerWatts} W de carga</p>
        </div>
        <div class="hero-segmented-nav">
          <button class="nav-segment-btn ${this._page === 0 ? "is-selected" : ""}" id="navSegHome">Inicio</button>
          <button class="nav-segment-btn" id="navSegLights">Luces</button>
          <button class="nav-segment-btn ${this._page === 1 ? "is-selected" : ""}" id="navSegMore">Analítica</button>
        </div>
      </section>
    `;
  }

  _renderWeatherWidget(weatherTemp, weatherState, weatherHumidity, weatherWind) {
    return `
      <div class="card weather-card interactive" id="widgetWeather">
        <div class="card-head">
          <span class="card-kicker">Clima</span>
          <span class="card-head-icon">${ICONS.sun}</span>
        </div>
        <div class="weather-kpi-block">
          <div class="kpi-display">${weatherTemp}°</div>
          <div class="kpi-sub-label">${weatherState === "sunny" ? "Soleado" : weatherState} • Humedad ${weatherHumidity}%</div>
        </div>
        <div class="weather-week-strip">
          <div class="fc-col"><span>Hoy</span><strong class="active-accent">24°</strong></div>
          <div class="fc-col"><span>Mañana</span><strong>23°</strong></div>
          <div class="fc-col"><span>Sáb</span><strong>25°</strong></div>
          <div class="fc-col"><span>Dom</span><strong>21°</strong></div>
        </div>
      </div>
    `;
  }

  _renderEnergyWidget(powerWatts, energyKwh) {
    return `
      <div class="card energy-card interactive" id="widgetEnergy">
        <div class="card-head">
          <span class="card-kicker">Energía</span>
          <span class="card-head-icon">${ICONS.zap}</span>
        </div>
        <div class="energy-kpi-block">
          <div class="kpi-display">${powerWatts} W</div>
          <div class="kpi-sub-label">${energyKwh} kWh consumidos</div>
        </div>
        ${this._renderCleanSparkline(this._stats)}
      </div>
    `;
  }

  _renderPowerGaugeWidget(powerWatts) {
    const pct = Math.min(100, Math.max(0, Math.round((powerWatts / TOTAL_NOMINAL_CAPACITY_W) * 100)));
    const strokeDash = `${pct * 2.51} 251.2`;
    const gaugeColor = pct > 85 ? "var(--state-danger)" : pct > 60 ? "var(--state-warning)" : "var(--accent)";

    return `
      <div class="card gauge-card">
        <div class="card-head">
          <span class="card-kicker">Carga Eléctrica</span>
          <span class="card-head-meta">${TOTAL_NOMINAL_CAPACITY_W} W MAX</span>
        </div>
        <div class="gauge-box">
          <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle class="gauge-track" cx="50" cy="50" r="40"/>
            <circle class="gauge-indicator" cx="50" cy="50" r="40" style="stroke-dasharray: ${strokeDash}; stroke: ${gaugeColor};"/>
          </svg>
          <div class="gauge-center-data">
            <span class="gauge-value">${pct}%</span>
            <span class="gauge-sub">${powerWatts} W</span>
          </div>
        </div>
        <div class="gauge-footer-note">Capacidad nominal activa</div>
      </div>
    `;
  }

  _renderActiveAmbienceWidget(activeAmbience) {
    return `
      <div class="card ambience-card">
        <div class="card-head">
          <span class="card-kicker">Ambiente Activo</span>
          <span class="status-badge ${activeAmbience.isPreset ? "is-preset" : ""}">${activeAmbience.isPreset ? "PRESET" : "MANUAL"}</span>
        </div>
        <div class="ambience-center">
          <div class="ambience-title">${activeAmbience.name}</div>
          <div class="ambience-sub">${activeAmbience.sub}</div>
        </div>
        <div class="ambience-footer">
          <span class="active-accent" style="font-size: 11px; font-weight: 520;">Control dinámico del showroom</span>
        </div>
      </div>
    `;
  }

  _renderRoomsWidget(spotsOn, samplesOn, reflectorOn, isPlaying, powerWatts) {
    return `
      <div class="card rooms-card">
        <div class="card-head">
          <span class="card-kicker">Zonas</span>
          <span class="card-head-icon">${ICONS.layers}</span>
        </div>
        <div class="rooms-stack">
          <div class="room-row interactive" id="rowSpots">
            <div class="room-left">
              <span class="room-indicator ${spotsOn > 0 ? "is-on" : ""}">${ICONS.bulb}</span>
              <span class="room-title">Spots</span>
            </div>
            <span class="room-tag ${spotsOn > 0 ? "is-on" : ""}">${spotsOn} / 4</span>
          </div>

          <div class="room-row interactive" id="rowSamples">
            <div class="room-left">
              <span class="room-indicator ${samplesOn > 0 ? "is-on" : ""}">${ICONS.layers}</span>
              <span class="room-title">Muestrarios & Paneles</span>
            </div>
            <span class="room-tag ${samplesOn > 0 ? "is-on" : ""}">${samplesOn} / 5</span>
          </div>

          <div class="room-row interactive" id="rowReflector">
            <div class="room-left">
              <span class="room-indicator ${reflectorOn > 0 ? "is-on" : ""}">${ICONS.bulb}</span>
              <span class="room-title">Reflector Exterior</span>
            </div>
            <span class="room-tag ${reflectorOn > 0 ? "is-on" : ""}">${reflectorOn > 0 ? "On" : "Off"}</span>
          </div>

          <div class="room-row interactive" id="rowMedia">
            <div class="room-left">
              <span class="room-indicator ${isPlaying ? "is-on" : ""}">${ICONS.music}</span>
              <span class="room-title">Multimedia</span>
            </div>
            <span class="room-tag ${isPlaying ? "is-on" : ""}">${isPlaying ? "Playing" : "Paused"}</span>
          </div>

          <div class="room-row interactive" id="rowEnergy">
            <div class="room-left">
              <span class="room-indicator is-on">${ICONS.zap}</span>
              <span class="room-title">Carga General</span>
            </div>
            <span class="room-tag is-on">${powerWatts} W</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderShortcutsWidget() {
    return `
      <div class="card shortcuts-card">
        <div class="card-head">
          <span class="card-kicker">Accesos Rápidos</span>
          <span class="card-head-meta">2 × 3</span>
        </div>
        <div class="shortcuts-grid">
          <div class="sc-item interactive" id="scPres">
            <span class="sc-ico">${ICONS.sparkles}</span>
            <div class="sc-text-col">
              <span class="sc-heading">Presentación</span>
              <span class="sc-sub-text">Ventana + TV</span>
            </div>
          </div>

          <div class="sc-item interactive" id="scMeet">
            <span class="sc-ico">${ICONS.users}</span>
            <div class="sc-text-col">
              <span class="sc-heading">Reunión</span>
              <span class="sc-sub-text">2×3 + Ventana</span>
            </div>
          </div>

          <div class="sc-item interactive is-highlight" id="scAllOn">
            <span class="sc-ico active-accent">${ICONS.sun}</span>
            <div class="sc-text-col">
              <span class="sc-heading">Todos ON</span>
              <span class="sc-sub-text">General</span>
            </div>
          </div>

          <div class="sc-item interactive is-dim" id="scAllOff">
            <span class="sc-ico">${ICONS.moon}</span>
            <div class="sc-text-col">
              <span class="sc-heading">Todos OFF</span>
              <span class="sc-sub-text">Apagado</span>
            </div>
          </div>

          <div class="sc-item interactive" id="scSpotsOnly">
            <span class="sc-ico">${ICONS.bulb}</span>
            <div class="sc-text-col">
              <span class="sc-heading">Solo Spots</span>
              <span class="sc-sub-text">4 circuitos</span>
            </div>
          </div>

          <div class="sc-item interactive" id="scSamplesOnly">
            <span class="sc-ico">${ICONS.layers}</span>
            <div class="sc-text-col">
              <span class="sc-heading">Solo Muestras</span>
              <span class="sc-sub-text">5 paneles</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderCalendarWidget() {
    return `
      <div class="card calendar-card">
        <div class="card-head">
          <span class="card-kicker">Agenda</span>
          <span class="card-head-icon">${ICONS.calendar}</span>
        </div>
        <div class="calendar-events-stack">
          <div class="agenda-group">
            <span class="agenda-subhead">HOY</span>
            <div class="event-item">
              <span class="event-hour">09:00</span>
              <span class="event-title">Presentación ejecutiva showroom</span>
            </div>
            <div class="event-item">
              <span class="event-hour">11:30</span>
              <span class="event-title">Reunión técnica de iluminación</span>
            </div>
          </div>
          <div class="agenda-group">
            <span class="agenda-subhead">MAÑANA</span>
            <div class="event-item">
              <span class="event-hour">10:00</span>
              <span class="event-title">Demostración dinámica para clientes</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderMediaWidget(mediaTitle, mediaArtist, isPlaying, mediaVolume) {
    return `
      <div class="card media-expanded-card">
        <div class="card-head">
          <span class="card-kicker">Reproductor de Medios</span>
          <span class="card-head-meta">${mediaVolume}% Vol</span>
        </div>
        <div class="media-body-row">
          <div class="media-cover-box">${ICONS.music}</div>
          <div class="media-title-col">
            <div class="media-headline">${mediaTitle}</div>
            <div class="media-subhead">${mediaArtist}</div>
          </div>
        </div>
        <div class="media-ctrl-row">
          <div class="media-transport-group">
            <button class="transport-btn" id="btnMediaPrev">${ICONS.skipBack}</button>
            <button class="transport-btn is-play-action" id="btnMediaPlay">${isPlaying ? ICONS.pause : ICONS.play}</button>
            <button class="transport-btn" id="btnMediaNext">${ICONS.skipForward}</button>
          </div>
          <div class="media-vol-group">
            <button class="vol-btn" id="btnVolDown">−</button>
            <button class="vol-btn" id="btnVolUp">+</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderLightsSummaryWidget(totalActive, spotsOn, samplesOn, reflectorOn, powerWatts) {
    return `
      <div class="card lights-card interactive" id="widgetLights">
        <div class="card-head">
          <span class="card-kicker">Iluminación</span>
          <span class="card-head-icon active-accent">${ICONS.bulb}</span>
        </div>
        <div class="lights-kpi-block">
          <div class="kpi-display">${totalActive} / ${ALL_CIRCUITS.length}</div>
          <div class="kpi-sub-label">Luminarias encendidas • ${powerWatts} W</div>
        </div>
        <div class="lights-breakdown-row">
          <span class="chip-label">Spots: <strong>${spotsOn}/4</strong></span>
          <span class="chip-label">Muestras: <strong>${samplesOn}/5</strong></span>
          <span class="chip-label">Reflector: <strong>${reflectorOn}/1</strong></span>
        </div>
      </div>
    `;
  }

  _renderScenesWidget() {
    return `
      <div class="card scenes-card">
        <div class="card-head">
          <span class="card-kicker">Escenas de Iluminación</span>
        </div>
        <div class="scenes-quad-grid">
          <div class="scene-box interactive" id="scenePres">
            <span class="scene-ico">${ICONS.sparkles}</span>
            <span>Presentación</span>
          </div>
          <div class="scene-box interactive" id="sceneMeet">
            <span class="scene-ico">${ICONS.users}</span>
            <span>Reunión</span>
          </div>
          <div class="scene-box interactive is-accent" id="sceneAllOn">
            <span class="scene-ico">${ICONS.sun}</span>
            <span>Encender todo</span>
          </div>
          <div class="scene-box interactive" id="sceneAllOff">
            <span class="scene-ico">${ICONS.moon}</span>
            <span>Apagar todo</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderRecentActivityWidget() {
    return `
      <div class="card activity-card">
        <div class="card-head">
          <span class="card-kicker">Actividad Reciente</span>
          <span class="status-badge" style="color: var(--state-success);">${ICONS.checkCircle} EN VIVO</span>
        </div>
        <div class="activity-feed">
          ${this._recentActivity.map((a) => `
            <div class="activity-entry">
              <span class="entry-bullet"></span>
              <div class="entry-texts">
                <span class="entry-msg">${a.text}</span>
                <span class="entry-time">${a.time}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  _renderDiagnosticsWidget(totalActive) {
    return `
      <div class="card diag-card">
        <div class="card-head">
          <span class="card-kicker">Diagnóstico del Sistema</span>
          <span class="status-badge" style="color: var(--state-success);">SISTEMA OK</span>
        </div>
        <div class="diag-quad">
          <div class="diag-cell">
            <span class="cell-label">Home Assistant</span>
            <span class="cell-val" style="color: var(--state-success);">Conectado</span>
          </div>
          <div class="diag-cell">
            <span class="cell-label">Weather API</span>
            <span class="cell-val" style="color: var(--state-success);">Suscrito</span>
          </div>
          <div class="diag-cell">
            <span class="cell-label">Recorder</span>
            <span class="cell-val" style="color: var(--state-success);">Sincronizado</span>
          </div>
          <div class="diag-cell">
            <span class="cell-label">Circuitos</span>
            <span class="cell-val">${ALL_CIRCUITS.length} Online</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderSystemWidget(batteryVal) {
    return `
      <div class="card system-card">
        <div class="card-head">
          <span class="card-kicker">Estado General</span>
        </div>
        <div class="system-list">
          <div class="system-row">
            <span>Tablet Showroom</span>
            <strong>${batteryVal}% Batería</strong>
          </div>
          <div class="system-row">
            <span>Servidor HA</span>
            <strong>Mock HA Provider</strong>
          </div>
          <div class="system-row">
            <span>Última sincronización</span>
            <strong>${this._timeStr}</strong>
          </div>
        </div>
      </div>
    `;
  }

  _renderCleanSparkline(stats) {
    if (!stats || stats.length === 0) {
      return `
        <div class="sparkline-bars">
          <span style="height: 25%;"></span>
          <span style="height: 40%;"></span>
          <span style="height: 60%;"></span>
          <span style="height: 85%;" class="is-hot"></span>
          <span style="height: 100%;" class="is-hot"></span>
          <span style="height: 70%;"></span>
          <span style="height: 45%;"></span>
          <span style="height: 30%;"></span>
        </div>
      `;
    }

    const maxMean = Math.max(...stats.map((s) => s.mean || (s.change ? s.change * 1000 : 0)), 100);

    return `
      <div class="sparkline-bars">
        ${stats.slice(0, 16).map((s) => {
          const w = s.mean || (s.change ? s.change * 1000 : 0);
          const pct = Math.max(12, Math.min(100, (w / maxMean) * 100));
          const isHot = w > maxMean * 0.4;
          return `<span style="height: ${pct}%;" class="${isHot ? "is-hot" : ""}"></span>`;
        }).join("")}
      </div>
    `;
  }

  _renderDetailedEnergyChart(stats) {
    if (!stats || stats.length === 0) {
      return `<div style="text-align: center; color: var(--text-3); padding: 30px;">Cargando perfil horario...</div>`;
    }

    const maxMean = Math.max(...stats.map((s) => s.mean || (s.change ? s.change * 1000 : 0)), 100);

    return `
      <div class="energy-chart-track">
        ${stats.map((s, idx) => {
          const w = s.mean || (s.change ? s.change * 1000 : 0);
          const heightPercent = Math.max(6, Math.min(100, (w / maxMean) * 100));
          const hourLabel = `${idx}h`;
          const isPeak = w > maxMean * 0.75;
          return `
            <div class="chart-col" title="${hourLabel}: ${w.toFixed(1)} W">
              <div class="chart-col-fill ${isPeak ? "is-peak" : ""}" style="height: ${heightPercent}%;"></div>
              <span class="chart-col-label">${idx % 3 === 0 ? hourLabel : ""}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  _renderBottomDock(totalActive, powerWatts, isPlaying, batteryVal) {
    return `
      <nav class="wit-dock">
        <button class="dock-btn" id="dockLights">
          <span class="active-accent">${ICONS.bulb}</span>
          <span>Luces ${totalActive}</span>
        </button>
        <button class="dock-btn" id="dockPower">
          <span>${ICONS.zap}</span>
          <span>${powerWatts} W</span>
        </button>
        <button class="dock-btn" id="dockMedia">
          <span>${ICONS.music}</span>
          <span>${isPlaying ? "❚❚" : "▶"}</span>
        </button>
        <button class="dock-btn" id="dockBattery">
          <span>${ICONS.battery}</span>
          <span>${batteryVal}%</span>
        </button>
        <div class="dock-dots-group">
          <div class="dock-dot ${this._page === 0 ? "is-active" : ""}" id="dockDot0" title="Página 1: Operación"></div>
          <div class="dock-dot ${this._page === 1 ? "is-active" : ""}" id="dockDot1" title="Página 2: Analítica"></div>
        </div>
      </nav>
    `;
  }

  _renderLightsSheet(totalActive, powerWatts) {
    return `
      <div class="sheet-scrim" id="sheetScrim">
        <div class="sheet-modal">
          <div class="sheet-header">
            <div>
              <h2 class="sheet-title">Control de Luminarias</h2>
              <p class="sheet-meta">${totalActive} de ${ALL_CIRCUITS.length} encendidas • ${powerWatts} W de carga</p>
            </div>
            <button class="sheet-close-btn" id="sheetCloseBtn">${ICONS.close}</button>
          </div>

          <div class="sheet-group">
            <span class="sheet-group-label">SPOTS</span>
            <div class="switches-stack">
              ${SPOTS.map((s) => {
                const isOn = this._value(s.id) === "on";
                return `
                  <div class="switch-row interactive ${isOn ? "is-on" : ""}" data-entity-id="${s.id}">
                    <div class="switch-left">
                      <span class="switch-icon ${isOn ? "active-accent" : ""}">${ICONS.bulb}</span>
                      <div class="switch-texts">
                        <span class="switch-name">${s.name}</span>
                        <span class="switch-meta">${s.subtitle} • ${s.watts} W</span>
                      </div>
                    </div>
                    <div class="switch-toggle"></div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="sheet-group">
            <span class="sheet-group-label">MUESTRARIOS & PANELES</span>
            <div class="switches-stack">
              ${SAMPLES.map((s) => {
                const isOn = this._value(s.id) === "on";
                return `
                  <div class="switch-row interactive ${isOn ? "is-on" : ""}" data-entity-id="${s.id}">
                    <div class="switch-left">
                      <span class="switch-icon ${isOn ? "active-accent" : ""}">${ICONS.bulb}</span>
                      <div class="switch-texts">
                        <span class="switch-name">${s.name}</span>
                        <span class="switch-meta">${s.subtitle} • ${s.watts} W</span>
                      </div>
                    </div>
                    <div class="switch-toggle"></div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="sheet-group">
            <span class="sheet-group-label">REFLECTOR EXTERIOR</span>
            <div class="switches-stack">
              <div class="switch-row interactive ${this._value(REFLECTOR.id) === "on" ? "is-on" : ""}" data-entity-id="${REFLECTOR.id}">
                <div class="switch-left">
                  <span class="switch-icon ${this._value(REFLECTOR.id) === "on" ? "active-accent" : ""}">${ICONS.bulb}</span>
                  <div class="switch-texts">
                    <span class="switch-name">${REFLECTOR.name}</span>
                    <span class="switch-meta">${REFLECTOR.subtitle}</span>
                  </div>
                </div>
                <div class="switch-toggle"></div>
              </div>
            </div>
          </div>

          <div class="sheet-actions">
            <button class="sheet-action-btn is-danger" id="modalTurnAllOff">Apagar todo</button>
            <button class="sheet-action-btn is-primary" id="modalTurnAllOn">Encender todo</button>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const lightCountVal = Number(this._value(ENTITIES.lightCount, "0"));
    const powerWattsVal = Number(this._value(ENTITIES.power, "0"));
    const energyKwhVal = Number(this._value(ENTITIES.energy, "26.11")).toFixed(2);
    const batteryVal = Number(this._value(ENTITIES.battery, "98"));
    const isBatteryLow = batteryVal < 25;

    const weatherState = this._value(ENTITIES.weather, "sunny");
    const weatherTemp = this._attr(ENTITIES.weather, "temperature", "23.5");
    const weatherHumidity = this._attr(ENTITIES.weather, "humidity", "48");
    const weatherWind = this._attr(ENTITIES.weather, "wind_speed", "12");

    const mediaState = this._value(ENTITIES.media, "paused");
    const isPlaying = mediaState === "playing";
    const mediaTitle = this._attr(ENTITIES.media, "media_title", "Ambient Lounge Experience");
    const mediaArtist = this._attr(ENTITIES.media, "media_artist", "Witmind Studio");
    const mediaVolume = Math.round((this._attr(ENTITIES.media, "volume_level", 0.65) || 0.65) * 100);

    const spotsOn = SPOTS.filter((s) => this._value(s.id) === "on").length;
    const samplesOn = SAMPLES.filter((s) => this._value(s.id) === "on").length;
    const reflectorOn = this._value(REFLECTOR.id) === "on" ? 1 : 0;
    const totalActive = spotsOn + samplesOn + reflectorOn;

    const activeAmbience = this._detectActiveAmbience();
    const isLight = this._theme === "light";

    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');

        :host {
          /* Brand Accent Tokens */
          --accent: #f26522;
          --accent-hover: #dc581a;
          --accent-soft: rgba(242, 101, 34, 0.12);
          --accent-border: rgba(242, 101, 34, 0.34);
          --accent-glow: rgba(242, 101, 34, 0.16);

          /* Global State Tokens */
          --state-success: #16a34a;
          --state-warning: #d97706;
          --state-danger: #dc2626;

          /* Typography Scale (Manrope) */
          --font-ui: "Manrope", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

          /* Spacing Grid (4/8px) */
          --s1: 4px;
          --s2: 8px;
          --s3: 12px;
          --s4: 16px;
          --s5: 24px;
          --s6: 32px;

          /* Radii */
          --r-control: 14px;
          --r-card: 22px;
          --r-panel: 28px;
          --r-pill: 999px;

          /* Motion */
          --motion-fast: 150ms;
          --motion-normal: 220ms;
          --motion-slow: 300ms;
          --ease-apple: cubic-bezier(0.2, 0.8, 0.2, 1);

          /* DARK THEME (Default) — 3-Layer Surfaces */
          --canvas: #071118;
          --surface: rgba(16, 25, 30, 0.88);
          --surface-raised: #162126;
          --surface-interactive: #1b282e;
          --glass: rgba(20, 30, 35, 0.68);
          --text-1: #f5f6f4;
          --text-2: #adb4b6;
          --text-3: #747e82;
          --line: rgba(255, 255, 255, 0.08);

          display: block;
          width: 100%;
          min-height: 100dvh;
          box-sizing: border-box;
          user-select: none;
          -webkit-user-select: none;
          overflow-x: hidden;

          font-family: var(--font-ui);
          font-feature-settings: "tnum" 1;
          color: var(--text-1);

          /* Atmospheric subtle background (never illustration) */
          background:
            radial-gradient(900px 600px at 85% 15%, rgba(242, 101, 34, 0.14), transparent 65%),
            radial-gradient(700px 500px at 15% 85%, rgba(242, 101, 34, 0.06), transparent 70%),
            var(--canvas);
          position: relative;
        }

        /* LIGHT THEME (Studio Frost / Porcelain) */
        :host([theme="light"]) {
          --canvas: #f3f3ef;
          --surface: rgba(255, 255, 255, 0.88);
          --surface-raised: #ffffff;
          --surface-interactive: #f8fafc;
          --glass: rgba(255, 255, 255, 0.75);
          --text-1: #182126;
          --text-2: #667176;
          --text-3: #92999c;
          --line: rgba(18, 32, 38, 0.08);

          background:
            radial-gradient(900px 600px at 85% 15%, rgba(242, 101, 34, 0.10), transparent 65%),
            radial-gradient(700px 500px at 15% 85%, rgba(242, 101, 34, 0.04), transparent 70%),
            var(--canvas);
          color: var(--text-1);
        }

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Dev Bar (Active ONLY with ?dev=1) */
        .dev-bar {
          background: var(--surface-raised);
          border-bottom: 1px solid var(--line);
          padding: 6px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-2);
          position: sticky;
          top: 0;
          z-index: 9999;
        }
        .dev-bar a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
          margin-left: 12px;
        }
        .dev-bar a:hover { text-decoration: underline; }

        /* Main Workspace Frame */
        .app-frame {
          position: relative;
          z-index: 1;
          max-width: 1480px;
          margin: 0 auto;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding:
            max(var(--s5), env(safe-area-inset-top))
            max(var(--s6), env(safe-area-inset-right))
            max(96px, env(safe-area-inset-bottom))
            max(var(--s6), env(safe-area-inset-left));
          gap: var(--s5);
        }

        /* CARD SYSTEM (Level 1 Surface) */
        .card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-card);
          padding: var(--s5);
          display: flex;
          flex-direction: column;
          transition: transform var(--motion-fast) var(--ease-apple), border-color var(--motion-fast) var(--ease-apple), box-shadow var(--motion-fast) var(--ease-apple);
          overflow: hidden;
        }
        .card.interactive:hover {
          border-color: rgba(255, 255, 255, 0.16);
          transform: translateY(-1px);
        }
        :host([theme="light"]) .card.interactive:hover {
          border-color: rgba(18, 32, 38, 0.16);
        }
        .interactive:active {
          transform: scale(0.985);
        }

        /* Card Header */
        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--s2);
        }
        .card-kicker {
          font-size: var(--s3);
          font-weight: 640;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-2);
        }
        .card-head-icon {
          color: var(--text-3);
          display: flex;
          align-items: center;
        }
        .card-head-meta {
          font-size: 11px;
          font-weight: 520;
          color: var(--text-3);
        }

        /* HEADER & TOP STATUS AREA */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--s1) 0;
          gap: var(--s4);
        }

        .header-brand-wrap {
          display: flex;
          align-items: center;
          gap: var(--s5);
        }
        .brand-block {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .brand-name {
          font-size: 18px;
          font-weight: 720;
          letter-spacing: 0.02em;
          color: var(--text-1);
        }
        .brand-site {
          font-size: 11px;
          font-weight: 640;
          letter-spacing: 0.08em;
          color: var(--accent);
          text-transform: uppercase;
        }

        .pills-strip {
          display: flex;
          align-items: center;
          gap: var(--s2);
          flex-wrap: wrap;
        }
        .status-pill {
          min-height: 48px;
          padding: 0 var(--s4);
          background: var(--glass);
          border: 1px solid var(--line);
          border-radius: var(--r-pill);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: inline-flex;
          align-items: center;
          gap: var(--s2);
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .status-pill:hover {
          border-color: var(--accent-border);
          transform: translateY(-1px);
        }
        .status-pill.is-active-pill {
          border-color: var(--accent-border);
        }
        .status-pill.is-warning {
          border-color: rgba(217, 119, 6, 0.4);
          background: rgba(217, 119, 6, 0.1);
        }

        .pill-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-2);
        }
        .pill-icon.active-accent { color: var(--accent); }

        .pill-texts {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .pill-title {
          font-size: var(--s3);
          font-weight: 640;
          color: var(--text-1);
        }
        .pill-meta {
          font-size: 11px;
          font-weight: 520;
          color: var(--text-2);
        }

        .header-clock-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          line-height: 1;
        }
        .clock-digits {
          font-size: clamp(48px, 5vw, 60px);
          font-weight: 450;
          letter-spacing: -0.04em;
          color: var(--text-1);
          font-variant-numeric: tabular-nums;
        }
        .clock-date-row {
          display: flex;
          align-items: center;
          gap: var(--s2);
          margin-top: var(--s1);
        }
        .date-label {
          font-size: var(--s3);
          font-weight: 520;
          color: var(--text-2);
        }
        .theme-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--s1);
          padding: 3px 10px;
          border-radius: var(--r-pill);
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          color: var(--text-2);
          font-size: 11px;
          font-weight: 640;
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .theme-toggle-btn:hover {
          color: var(--text-1);
          border-color: var(--accent-border);
        }

        /* HORIZONTAL CAROUSEL (CSS Scroll Snap) */
        .carousel-track {
          display: flex;
          width: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          gap: var(--s6);
        }
        .carousel-track::-webkit-scrollbar { display: none; }

        .carousel-pane {
          flex: 0 0 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          display: flex;
          flex-direction: column;
          gap: var(--s5);
        }

        /* HERO WIDGET */
        .hero-card {
          padding: var(--s5) var(--s6);
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          background: var(--surface-raised);
          border: 1px solid var(--accent-border);
        }
        .hero-brand-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hero-kicker {
          font-size: 11px;
          font-weight: 720;
          letter-spacing: 0.1em;
          color: var(--accent);
          text-transform: uppercase;
        }
        .hero-title {
          font-size: 28px;
          font-weight: 720;
          letter-spacing: -0.02em;
          color: var(--text-1);
        }
        .hero-caption {
          font-size: var(--s4);
          color: var(--text-2);
        }
        .hero-segmented-nav {
          display: flex;
          gap: var(--s1);
          background: var(--surface-interactive);
          padding: var(--s1);
          border-radius: var(--r-pill);
          border: 1px solid var(--line);
        }
        .nav-segment-btn {
          background: transparent;
          border: none;
          color: var(--text-2);
          padding: var(--s2) var(--s4);
          border-radius: var(--r-pill);
          font-size: var(--s3);
          font-weight: 640;
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .nav-segment-btn:hover { color: var(--text-1); }
        .nav-segment-btn.is-selected {
          background: var(--accent);
          color: #ffffff;
        }

        /* GRIDS */
        .grid-top-quad {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--s5);
        }
        @media (max-width: 1180px) {
          .grid-top-quad { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 650px) {
          .grid-top-quad { grid-template-columns: 1fr; }
        }

        .grid-mid-trio {
          display: grid;
          grid-template-columns: 1.1fr 1.3fr 1.3fr;
          gap: var(--s5);
        }
        @media (max-width: 1100px) {
          .grid-mid-trio { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 720px) {
          .grid-mid-trio { grid-template-columns: 1fr; }
        }

        /* WEATHER WIDGET */
        .weather-card {
          justify-content: space-between;
          min-height: 185px;
        }
        .weather-kpi-block { margin: var(--s1) 0; }
        .kpi-display {
          font-size: 32px;
          font-weight: 520;
          letter-spacing: -0.03em;
          color: var(--text-1);
          font-variant-numeric: tabular-nums;
        }
        .kpi-sub-label {
          font-size: var(--s3);
          color: var(--text-2);
          margin-top: 2px;
        }
        .weather-week-strip {
          display: flex;
          justify-content: space-between;
          padding-top: var(--s2);
          border-top: 1px solid var(--line);
          font-size: 11px;
          color: var(--text-2);
        }
        .fc-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        /* ENERGY WIDGET */
        .energy-card {
          justify-content: space-between;
          min-height: 185px;
        }
        .sparkline-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 32px;
          padding-top: var(--s1);
        }
        .sparkline-bars span {
          flex: 1;
          border-radius: 2px 2px 0 0;
          background: rgba(255, 255, 255, 0.12);
        }
        :host([theme="light"]) .sparkline-bars span {
          background: rgba(18, 32, 38, 0.08);
        }
        .sparkline-bars span.is-hot {
          background: var(--accent);
        }

        /* POWER GAUGE WIDGET */
        .gauge-card {
          justify-content: space-between;
          min-height: 185px;
        }
        .gauge-box {
          position: relative;
          width: 76px;
          height: 76px;
          margin: 0 auto;
        }
        .gauge-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .gauge-track {
          fill: none;
          stroke: var(--line);
          stroke-width: 8;
        }
        .gauge-indicator {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray var(--motion-slow) var(--ease-apple);
        }
        .gauge-center-data {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1.1;
        }
        .gauge-value {
          font-size: 16px;
          font-weight: 720;
          color: var(--text-1);
          font-variant-numeric: tabular-nums;
        }
        .gauge-sub {
          font-size: 10px;
          color: var(--text-3);
        }
        .gauge-footer-note {
          font-size: 11px;
          color: var(--text-3);
          text-align: center;
        }

        /* AMBIENCE WIDGET */
        .ambience-card {
          justify-content: space-between;
          min-height: 185px;
        }
        .status-badge {
          padding: 2px 8px;
          border-radius: var(--r-pill);
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          color: var(--text-2);
          font-size: 10px;
          font-weight: 720;
          letter-spacing: 0.06em;
        }
        .status-badge.is-preset {
          background: var(--accent-soft);
          border-color: var(--accent-border);
          color: var(--accent);
        }
        .ambience-center { margin: var(--s1) 0; }
        .ambience-title {
          font-size: 20px;
          font-weight: 720;
          color: var(--text-1);
        }
        .ambience-sub {
          font-size: var(--s3);
          color: var(--text-2);
          margin-top: 2px;
        }
        .ambience-footer {
          padding-top: var(--s2);
          border-top: 1px solid var(--line);
        }

        /* ROOMS WIDGET */
        .rooms-card { gap: var(--s3); }
        .rooms-stack {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .room-row {
          padding: 8px 12px;
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          border-radius: var(--r-control);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .room-row:hover {
          border-color: var(--accent-border);
        }
        .room-left {
          display: flex;
          align-items: center;
          gap: var(--s2);
        }
        .room-indicator {
          color: var(--text-3);
          display: flex;
        }
        .room-indicator.is-on { color: var(--accent); }
        .room-title {
          font-size: var(--s3);
          font-weight: 640;
          color: var(--text-1);
        }
        .room-tag {
          padding: 2px 8px;
          border-radius: var(--r-pill);
          background: var(--line);
          font-size: 11px;
          font-weight: 640;
          color: var(--text-2);
        }
        .room-tag.is-on {
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid var(--accent-border);
        }

        /* SHORTCUTS (2x3) */
        .shortcuts-card { gap: var(--s3); }
        .shortcuts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--s2);
        }
        .sc-item {
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          border-radius: var(--r-control);
          padding: var(--s2) var(--s3);
          display: flex;
          align-items: center;
          gap: var(--s2);
          cursor: pointer;
          min-height: 48px;
          transition: all var(--motion-fast);
        }
        .sc-item:hover {
          border-color: var(--accent-border);
          transform: translateY(-1px);
        }
        .sc-item.is-highlight {
          background: var(--accent-soft);
          border-color: var(--accent-border);
        }
        .sc-ico {
          display: flex;
          color: var(--text-2);
        }
        .sc-text-col {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .sc-heading {
          font-size: var(--s3);
          font-weight: 640;
          color: var(--text-1);
        }
        .sc-sub-text {
          font-size: 11px;
          color: var(--text-3);
        }

        /* CALENDAR WIDGET */
        .calendar-card { gap: var(--s3); }
        .calendar-events-stack {
          display: flex;
          flex-direction: column;
          gap: var(--s2);
        }
        .agenda-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .agenda-subhead {
          font-size: 10px;
          font-weight: 720;
          letter-spacing: 0.08em;
          color: var(--text-3);
        }
        .event-item {
          display: flex;
          align-items: center;
          gap: var(--s2);
          padding: 6px 10px;
          background: var(--surface-interactive);
          border-radius: 8px;
          border-left: 2px solid var(--accent);
          font-size: 12px;
        }
        .event-hour {
          font-weight: 720;
          color: var(--accent);
        }
        .event-title {
          color: var(--text-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* PAGE 2 WIDGETS */
        .grid-page2-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--s5);
        }
        @media (max-width: 900px) {
          .grid-page2-pair { grid-template-columns: 1fr; }
        }

        /* MEDIA EXPANDED */
        .media-expanded-card {
          min-height: 210px;
          justify-content: space-between;
        }
        .media-body-row {
          display: flex;
          align-items: center;
          gap: var(--s4);
          margin: var(--s2) 0;
        }
        .media-cover-box {
          width: 52px;
          height: 52px;
          border-radius: var(--r-control);
          background: linear-gradient(135deg, var(--accent) 0%, #1a1a24 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }
        .media-title-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .media-headline {
          font-size: var(--s4);
          font-weight: 720;
          color: var(--text-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .media-subhead {
          font-size: var(--s3);
          color: var(--text-2);
        }
        .media-ctrl-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--s3);
          border-top: 1px solid var(--line);
        }
        .media-transport-group {
          display: flex;
          align-items: center;
          gap: var(--s3);
        }
        .transport-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          color: var(--text-1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .transport-btn:hover { border-color: var(--accent-border); }
        .transport-btn.is-play-action {
          background: var(--accent);
          color: #ffffff;
          border: none;
        }
        .media-vol-group {
          display: flex;
          gap: 6px;
        }
        .vol-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          color: var(--text-1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* LIGHTS SUMMARY */
        .lights-card {
          min-height: 210px;
          justify-content: space-between;
        }
        .lights-kpi-block { margin: var(--s1) 0; }
        .lights-breakdown-row {
          display: flex;
          gap: var(--s2);
          padding-top: var(--s2);
          border-top: 1px solid var(--line);
        }
        .chip-label {
          padding: 4px 10px;
          border-radius: var(--r-pill);
          background: var(--surface-interactive);
          font-size: 11px;
          color: var(--text-2);
        }

        /* SCENES 2x2 */
        .scenes-card { gap: var(--s3); }
        .scenes-quad-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--s2);
        }
        .scene-box {
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          border-radius: var(--r-control);
          padding: var(--s4);
          display: flex;
          align-items: center;
          gap: var(--s2);
          cursor: pointer;
          font-size: var(--s3);
          font-weight: 640;
          color: var(--text-1);
          transition: all var(--motion-fast);
        }
        .scene-box:hover { border-color: var(--accent-border); }
        .scene-box.is-accent {
          border-color: var(--accent-border);
          background: var(--accent-soft);
        }
        .scene-ico { display: flex; }

        /* RECENT ACTIVITY */
        .activity-card { gap: var(--s2); }
        .activity-feed {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .activity-entry {
          display: flex;
          align-items: center;
          gap: var(--s2);
          padding: 6px 10px;
          background: var(--surface-interactive);
          border-radius: 8px;
          font-size: 12px;
        }
        .entry-bullet {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
        }
        .entry-texts {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .entry-msg { font-weight: 640; color: var(--text-1); }
        .entry-time { font-size: 10px; color: var(--text-3); }

        /* DIAGNOSTICS */
        .diag-card { gap: var(--s2); }
        .diag-quad {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--s2);
        }
        .diag-cell {
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          border-radius: var(--r-control);
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cell-label { font-size: 11px; color: var(--text-3); font-weight: 640; }
        .cell-val { font-size: var(--s3); font-weight: 720; }

        /* SYSTEM CARD */
        .system-card { justify-content: space-between; }
        .system-list {
          display: flex;
          flex-direction: column;
          gap: var(--s2);
          margin-top: var(--s1);
        }
        .system-row {
          display: flex;
          justify-content: space-between;
          font-size: var(--s3);
          padding: 6px 0;
          border-bottom: 1px solid var(--line);
        }
        .system-row strong { color: var(--text-1); }

        /* DETAILED ENERGY CHART */
        .energy-chart-track {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 140px;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
        }
        .chart-col {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
        }
        .chart-col-fill {
          width: 100%;
          border-radius: 2px 2px 0 0;
          background: var(--accent);
          opacity: 0.85;
          transition: height var(--motion-slow) var(--ease-apple);
        }
        .chart-col-fill.is-peak {
          background: var(--text-1);
        }
        .chart-col-label {
          font-size: 9px;
          color: var(--text-3);
        }

        /* BOTTOM DOCK (Level 2 Surface) */
        .wit-dock {
          position: fixed;
          bottom: var(--s4);
          left: 50%;
          transform: translateX(-50%);
          background: var(--glass);
          border: 1px solid var(--line);
          border-radius: var(--r-pill);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
          padding: 6px var(--s3);
          display: flex;
          align-items: center;
          gap: var(--s2);
          z-index: 2000;
        }
        :host([theme="light"]) .wit-dock {
          box-shadow: 0 16px 40px rgba(18, 32, 38, 0.12);
        }
        .dock-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--s2);
          padding: var(--s2) var(--s4);
          border-radius: var(--r-pill);
          font-size: var(--s3);
          font-weight: 640;
          color: var(--text-2);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .dock-btn:hover {
          color: var(--text-1);
          background: var(--line);
        }
        .dock-dots-group {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 var(--s1);
        }
        .dock-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--line);
          cursor: pointer;
          transition: all var(--motion-normal);
        }
        .dock-dot.is-active {
          width: 20px;
          border-radius: var(--r-pill);
          background: var(--accent);
        }

        /* MODAL SHEETS (Level 2 Surface) */
        .sheet-scrim {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--s5);
          animation: fadeIn var(--motion-fast) ease-out;
        }
        :host([theme="light"]) .sheet-scrim {
          background: rgba(18, 32, 38, 0.4);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sheet-modal {
          background: var(--surface-raised);
          border: 1px solid var(--line);
          border-radius: var(--r-panel);
          width: min(620px, calc(100vw - 40px));
          max-height: 85dvh;
          overflow-y: auto;
          padding: var(--s5);
          display: flex;
          flex-direction: column;
          gap: var(--s5);
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);
          animation: scaleUp var(--motion-normal) var(--ease-apple);
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sheet-title {
          font-size: 20px;
          font-weight: 720;
          color: var(--text-1);
        }
        .sheet-meta {
          font-size: var(--s3);
          color: var(--text-2);
        }
        .sheet-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          color: var(--text-2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .sheet-close-btn:hover {
          color: var(--text-1);
          border-color: var(--accent-border);
        }

        .sheet-group-label {
          font-size: 11px;
          font-weight: 720;
          letter-spacing: 0.08em;
          color: var(--text-3);
          margin-bottom: var(--s2);
          display: block;
        }
        .switches-stack {
          display: flex;
          flex-direction: column;
          gap: var(--s2);
        }
        .switch-row {
          height: 60px;
          padding: 0 var(--s4);
          background: var(--surface-interactive);
          border: 1px solid var(--line);
          border-radius: var(--r-control);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .switch-row:hover { border-color: var(--accent-border); }
        .switch-row.is-on {
          border-color: var(--accent-border);
          background: var(--accent-soft);
        }
        .switch-left {
          display: flex;
          align-items: center;
          gap: var(--s3);
        }
        .switch-icon {
          display: flex;
          color: var(--text-3);
        }
        .switch-texts {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .switch-name { font-size: var(--s3); font-weight: 640; color: var(--text-1); }
        .switch-meta { font-size: 11px; color: var(--text-2); }

        .switch-toggle {
          width: 48px;
          height: 26px;
          border-radius: var(--r-pill);
          background: var(--line);
          position: relative;
          transition: all var(--motion-normal);
        }
        .switch-toggle::after {
          content: "";
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          top: 3px;
          left: 3px;
          transition: transform var(--motion-normal);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .switch-row.is-on .switch-toggle {
          background: var(--accent);
        }
        .switch-row.is-on .switch-toggle::after {
          transform: translateX(22px);
        }

        .sheet-actions {
          display: flex;
          gap: var(--s2);
          margin-top: var(--s2);
        }
        .sheet-action-btn {
          flex: 1;
          height: 44px;
          border-radius: var(--r-control);
          border: 1px solid var(--line);
          font-size: var(--s3);
          font-weight: 640;
          cursor: pointer;
        }
        .sheet-action-btn.is-primary {
          background: var(--accent);
          color: #ffffff;
          border: none;
        }
        .sheet-action-btn.is-danger {
          background: rgba(220, 38, 38, 0.15);
          color: var(--state-danger);
          border-color: rgba(220, 38, 38, 0.3);
        }

        .active-accent { color: var(--accent) !important; }
      </style>

      ${
        this._isDev
          ? `
        <div class="dev-bar">
          <div><strong>MODO DEV</strong> — Witmind OS Commercial Edition (${isLight ? "Tema Claro" : "Tema Oscuro"})</div>
          <div>
            <a href="/showroom-witmind-os.html">🏛️ Witmind OS Oscuro</a>
            <a href="/showroom-witmind-os-light.html">☀️ Witmind OS Claro</a>
            <a href="/showroom-witmind.html">🏛️ Witmind Glass</a>
            <a href="/showroom-aero.html">💎 Aero Glass</a>
            <a href="/showroom-ios.html">📱 iOS Tablet</a>
            <a href="/showroom.html">🎛️ Lovelace HA</a>
          </div>
        </div>
      `
          : ""
      }

      <div class="app-frame">
        <!-- HEADER -->
        <header class="header">
          <div class="header-brand-wrap">
            <div class="brand-block">
              <span class="brand-name">WITMIND</span>
              <span class="brand-site">SHOWROOM · WTX MDTC</span>
            </div>

            <div class="pills-strip">
              ${this._renderStatusPills(totalActive, powerWattsVal, isPlaying, energyKwhVal, batteryVal, isBatteryLow)}
            </div>
          </div>

          <div class="header-clock-wrap">
            <div class="clock-digits" id="witClockDigits">${this._timeStr}</div>
            <div class="clock-date-row">
              <span class="date-label" id="witDateLabel">${this._dateStr}</span>
              <button class="theme-toggle-btn" id="btnThemeToggle" title="Cambiar tema claro/oscuro">
                ${isLight ? "☀️ Claro" : "🌙 Oscuro"}
              </button>
            </div>
          </div>
        </header>

        <!-- HORIZONTAL 2-PAGE CAROUSEL -->
        <div class="carousel-track" id="carouselTrack">
          <!-- PAGE 1: Operation / Glance -->
          <div class="carousel-pane">
            ${this._renderHeroWidget(totalActive, powerWattsVal)}

            <!-- Grid 1: 4 Quad Cards -->
            <div class="grid-top-quad">
              ${this._renderWeatherWidget(weatherTemp, weatherState, weatherHumidity, weatherWind)}
              ${this._renderEnergyWidget(powerWattsVal, energyKwhVal)}
              ${this._renderPowerGaugeWidget(powerWattsVal)}
              ${this._renderActiveAmbienceWidget(activeAmbience)}
            </div>

            <!-- Grid 2: 3 Mid Trio Cards -->
            <div class="grid-mid-trio">
              ${this._renderRoomsWidget(spotsOn, samplesOn, reflectorOn, isPlaying, powerWattsVal)}
              ${this._renderShortcutsWidget()}
              ${this._renderCalendarWidget()}
            </div>
          </div>

          <!-- PAGE 2: Analytics & Extended Controls -->
          <div class="carousel-pane">
            <div class="grid-page2-pair">
              ${this._renderMediaWidget(mediaTitle, mediaArtist, isPlaying, mediaVolume)}
              ${this._renderLightsSummaryWidget(totalActive, spotsOn, samplesOn, reflectorOn, powerWattsVal)}
            </div>

            <div class="grid-page2-pair">
              ${this._renderScenesWidget()}
              ${this._renderRecentActivityWidget()}
            </div>

            <div class="grid-page2-pair">
              ${this._renderDiagnosticsWidget(totalActive)}
              ${this._renderSystemWidget(batteryVal)}
            </div>
          </div>
        </div>

        <!-- BOTTOM TRANSLUCENT DOCK -->
        ${this._renderBottomDock(totalActive, powerWattsVal, isPlaying, batteryVal)}

        <!-- LIGHTS SHEET MODAL -->
        ${this._sheet === "lights" ? this._renderLightsSheet(totalActive, powerWattsVal) : ""}
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    // Theme Toggle
    root.querySelector("#btnThemeToggle")?.addEventListener("click", () => this._toggleTheme());

    // Header Status Pills
    root.querySelector("#pillLights")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#pillMedia")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#pillEnergy")?.addEventListener("click", () => this._setPage(1));

    // Hero Segmented Navigation
    root.querySelector("#navSegHome")?.addEventListener("click", () => this._setPage(0));
    root.querySelector("#navSegLights")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#navSegMore")?.addEventListener("click", () => this._setPage(1));

    // Widgets Taps
    root.querySelector("#widgetWeather")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#widgetEnergy")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#widgetLights")?.addEventListener("click", () => this._openSheet("lights"));

    // Rooms Rows
    root.querySelector("#rowSpots")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#rowSamples")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#rowReflector")?.addEventListener("click", () => this._toggleSwitch(REFLECTOR.id));
    root.querySelector("#rowMedia")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#rowEnergy")?.addEventListener("click", () => this._setPage(1));

    // Shortcuts
    root.querySelector("#scPres")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.presentation });
    });
    root.querySelector("#scMeet")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.meeting });
    });
    root.querySelector("#scAllOn")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });
    root.querySelector("#scAllOff")?.addEventListener("click", () => {
      this._callService("script", "showroom_apagado_general", { entity_id: ENTITIES.allOff });
    });
    root.querySelector("#scSpotsOnly")?.addEventListener("click", () => {
      SPOTS.forEach((s) => this._callService("switch", "turn_on", { entity_id: s.id }));
    });
    root.querySelector("#scSamplesOnly")?.addEventListener("click", () => {
      SAMPLES.forEach((s) => this._callService("switch", "turn_on", { entity_id: s.id }));
    });

    // Scenes (Page 2)
    root.querySelector("#scenePres")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.presentation });
    });
    root.querySelector("#sceneMeet")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.meeting });
    });
    root.querySelector("#sceneAllOn")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });
    root.querySelector("#sceneAllOff")?.addEventListener("click", () => {
      this._callService("script", "showroom_apagado_general", { entity_id: ENTITIES.allOff });
    });

    // Media Controls
    root.querySelector("#btnMediaPlay")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnMediaPrev")?.addEventListener("click", () => {
      this._callService("media_player", "media_previous_track", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnMediaNext")?.addEventListener("click", () => {
      this._callService("media_player", "media_next_track", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnVolDown")?.addEventListener("click", () => {
      this._callService("media_player", "volume_down", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnVolUp")?.addEventListener("click", () => {
      this._callService("media_player", "volume_up", { entity_id: ENTITIES.media });
    });

    // Dock Buttons
    root.querySelector("#dockLights")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#dockPower")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#dockMedia")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#dockBattery")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#dockDot0")?.addEventListener("click", () => this._setPage(0));
    root.querySelector("#dockDot1")?.addEventListener("click", () => this._setPage(1));

    // Lights Sheet Handlers
    root.querySelector("#sheetCloseBtn")?.addEventListener("click", () => this._closeSheet());
    root.querySelector("#sheetScrim")?.addEventListener("click", (e) => {
      if (e.target.id === "sheetScrim") {
        this._closeSheet();
      }
    });

    root.querySelectorAll(".switch-row").forEach((row) => {
      row.addEventListener("click", () => {
        const entityId = row.getAttribute("data-entity-id");
        if (entityId) {
          this._toggleSwitch(entityId);
        }
      });
    });

    root.querySelector("#modalTurnAllOff")?.addEventListener("click", () => {
      this._callService("script", "showroom_apagado_general", { entity_id: ENTITIES.allOff });
    });
    root.querySelector("#modalTurnAllOn")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });
  }
}

customElements.define("showroom-witmind-os", ShowroomWitmindOs);
