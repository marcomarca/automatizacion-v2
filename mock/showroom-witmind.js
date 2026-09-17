/**
 * Showroom Witmind Glass — Native Web Component para Tablet
 *
 * Arquitectura: Smoked Glassmorphism Oscuro / Light Studio Frost + Iluminación Arquitectónica (#f26522)
 * Soporte completo para Tema Oscuro y Tema Claro.
 *
 * Biblioteca completa de widgets densos, táctiles y modulares:
 *   - Hero Showroom Visual
 *   - Rooms Widget
 *   - Shortcuts 2×3 Grid
 *   - Weather Widget & Forecast
 *   - Energy Widget & Sparkline
 *   - Climate / Environment Fallback Gauge
 *   - Calendar / Agenda Widget (DEMO data isolation)
 *   - Power / Load Gauge Widget (432W / 1395W capacity)
 *   - Active Ambience / Scene Detector
 *   - Recent Activity Log (HA Event listener)
 *   - Lights Widget & Lights Sheet Modal
 *   - Media Player Widget
 *   - Scenes 2×2 Widget
 *   - Diagnostics & Telemetry Widget
 *   - System Status Widget
 *   - Top Status Pills & Bottom Translucent Dock
 *   - Horizontal 2-Page Carousel (CSS scroll-snap)
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

class ShowroomWitmind extends HTMLElement {
  static get observedAttributes() {
    return ["theme"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._theme = this.getAttribute("theme") || (new URLSearchParams(window.location.search).get("theme") === "light" ? "light" : "dark");
    this._page = 0; // 0: Operación / General, 1: Analítica / Media / Control Extendido
    this._view = "dashboard"; // "dashboard" | "energy_detail" | "lights_detail"
    this._sheet = null; // null | "lights" | "weather"
    this._statsTimeframe = "day"; // "day" | "month" | "year"
    this._forecast = [];
    this._stats = [];
    this._recentActivity = [
      { text: "Spots ventana Encendido", time: "hace 2 min", icon: "💡" },
      { text: "Ambient Lounge Reproducción", time: "hace 6 min", icon: "♫" },
      { text: "Escena Presentación aplicada", time: "hace 14 min", icon: "✨" },
      { text: "Sincronización Home Assistant", time: "hace 18 min", icon: "◉" }
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

    // Reloj dinámico ligero en DOM sin forzar rerender completo cada segundo
    this._timeInterval = setInterval(() => {
      this._timeStr = this._getCurrentTimeString();
      this._dateStr = this._getCurrentDateString();
      const clockEl = this.shadowRoot?.querySelector("#witClockText");
      if (clockEl) clockEl.textContent = this._timeStr;
      const dateEl = this.shadowRoot?.querySelector("#witDateText");
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
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
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
              const icon = entityId.startsWith("switch") ? "💡" : entityId.startsWith("media") ? "♫" : "✨";
              this._recentActivity.unshift({
                text: `${name}: ${newState === "on" ? "Encendido" : newState === "off" ? "Apagado" : newState}`,
                time: "hace un momento",
                icon
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
    this._view = "dashboard";
    const track = this.shadowRoot?.querySelector("#pagesScrollTrack");
    if (track) {
      const targetPage = this.shadowRoot?.querySelectorAll(".page-snap-pane")?.[pageNum];
      if (targetPage) {
        targetPage.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      }
    }
    this.render();
  }

  _detectActiveScene() {
    const s1 = this._value("switch.interruptor_inteligente_switch_1");
    const s2 = this._value("switch.interruptor_inteligente_switch_2");
    const s3 = this._value("switch.interruptor_inteligente_switch_3");
    const s4 = this._value("switch.interruptor_inteligente_switch_4");
    const slims = this._value("switch.interruptor_inteligente_2_switch_3");
    const count = Number(this._value(ENTITIES.lightCount, "0"));

    if (count === 0) return { name: "Todo Apagado", sub: "Showroom en reposo", tag: "REPOSO" };
    if (s1 === "on" && s4 === "on" && s2 === "off" && s3 === "off" && slims === "off") {
      return { name: "Presentación", sub: "Ventana + TV activas", tag: "ESCENA" };
    }
    if (s1 === "on" && s2 === "on" && s3 === "off" && s4 === "off" && slims === "off") {
      return { name: "Reunión", sub: "Spots 2×3 + Ventana", tag: "ESCENA" };
    }
    if (count === 9) return { name: "Encendido Total", sub: "Todos los circuitos activos", tag: "GENERAL" };
    return { name: "Personalizado", sub: `${count} luminarias activas`, tag: "MANUAL" };
  }

  /* RENDER HELPERS */

  _renderStatusPills(totalActive, powerWatts, isPlaying, energyKwh, batteryVal, isBatteryLow) {
    const pills = [];

    if (isBatteryLow) {
      pills.push(`
        <div class="status-pill warning-pill wit-tap" id="pillBatWarn">
          <div class="pill-badge-circle" style="background: rgba(240, 90, 90, 0.2); color: var(--color-rose);">⚠️</div>
          <div class="pill-text-block">
            <span class="pill-title-text">Tablet Batería Baja</span>
            <span class="pill-sub-text">${batteryVal}% restante</span>
          </div>
        </div>
      `);
    }

    pills.push(`
      <div class="status-pill hero-pill wit-tap" id="pillLightsBtn">
        <div class="pill-badge-circle amber">💡</div>
        <div class="pill-text-block">
          <span class="pill-title-text">${totalActive} luces encendidas</span>
          <span class="pill-sub-text">${powerWatts} W de carga</span>
        </div>
      </div>
    `);

    pills.push(`
      <div class="status-pill wit-tap" id="pillMediaBtn">
        <div class="pill-badge-circle orange">♫</div>
        <div class="pill-text-block">
          <span class="pill-title-text">${isPlaying ? "Ambient Lounge" : "Audio Pausado"}</span>
          <span class="pill-sub-text">Witmind Studio</span>
        </div>
      </div>
    `);

    pills.push(`
      <div class="status-pill wit-tap" id="pillEnergyBtn">
        <div class="pill-badge-circle orange">◉</div>
        <div class="pill-text-block">
          <span class="pill-title-text">Showroom activo</span>
          <span class="pill-sub-text">${energyKwh} kWh hoy</span>
        </div>
      </div>
    `);

    return pills.slice(0, 4).join("");
  }

  _renderHeroWidget(totalActive, powerWatts) {
    return `
      <section class="wit-card hero-widget">
        <div class="hero-left-col">
          <div class="hero-label-tag">SHOWROOM WITMIND</div>
          <h1 class="hero-headline">Iluminación que transforma espacios</h1>
          <p class="hero-description">${totalActive} / ${ALL_CIRCUITS.length} luminarias activas • ${powerWatts} W en tiempo real</p>
        </div>
        <div class="hero-nav-bar">
          <button class="hero-nav-link ${this._page === 0 && this._view === "dashboard" ? "active" : ""}" id="heroNavHome">Inicio</button>
          <button class="hero-nav-link ${this._sheet === "lights" ? "active" : ""}" id="heroNavLights">Luces</button>
          <button class="hero-nav-link ${this._view === "energy_detail" ? "active" : ""}" id="heroNavEnergy">Energía</button>
          <button class="hero-nav-link ${this._page === 1 ? "active" : ""}" id="heroNavMore">Más</button>
        </div>
      </section>
    `;
  }

  _renderRoomsWidget(spotsOn, samplesOn, reflectorOn, isPlaying, powerWatts) {
    return `
      <div class="wit-card rooms-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Zonas & Circuitos</span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">5 GRUPOS</span>
        </div>
        <div class="rooms-list-stack">
          <div class="room-tactile-row wit-tap" id="roomSpotsRow">
            <div class="room-row-left">
              <span class="room-dot-icon amber">💡</span>
              <span class="room-name-text">Spots Iluminación</span>
            </div>
            <span class="room-val-pill ${spotsOn > 0 ? "active" : ""}">${spotsOn} / 4 On</span>
          </div>

          <div class="room-tactile-row wit-tap" id="roomSamplesRow">
            <div class="room-row-left">
              <span class="room-dot-icon orange">◉</span>
              <span class="room-name-text">Muestrarios & Paneles</span>
            </div>
            <span class="room-val-pill ${samplesOn > 0 ? "active" : ""}">${samplesOn} / 5 On</span>
          </div>

          <div class="room-tactile-row wit-tap" id="roomReflectorRow">
            <div class="room-row-left">
              <span class="room-dot-icon">🔦</span>
              <span class="room-name-text">Reflector Exterior</span>
            </div>
            <span class="room-val-pill ${reflectorOn > 0 ? "active" : ""}">${reflectorOn > 0 ? "On" : "Off"}</span>
          </div>

          <div class="room-tactile-row wit-tap" id="roomMediaRow">
            <div class="room-row-left">
              <span class="room-dot-icon orange">♫</span>
              <span class="room-name-text">Multimedia Showroom</span>
            </div>
            <span class="room-val-pill ${isPlaying ? "active" : ""}">${isPlaying ? "Playing" : "Paused"}</span>
          </div>

          <div class="room-tactile-row wit-tap" id="roomEnergyRow">
            <div class="room-row-left">
              <span class="room-dot-icon amber">⚡</span>
              <span class="room-name-text">Carga Total</span>
            </div>
            <span class="room-val-pill active">${powerWatts} W</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderShortcutsWidget() {
    return `
      <div class="wit-card shortcuts-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Shortcuts Rápidos</span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">2 × 3</span>
        </div>
        <div class="shortcuts-2x3-grid">
          <div class="shortcut-tile wit-tap" id="scPres">
            <span class="sc-icon">✨</span>
            <div class="sc-texts">
              <span class="sc-name">Presentación</span>
              <span class="sc-sub">Ventana + TV</span>
            </div>
          </div>
          <div class="shortcut-tile wit-tap" id="scMeet">
            <span class="sc-icon">👥</span>
            <div class="sc-texts">
              <span class="sc-name">Reunión</span>
              <span class="sc-sub">2×3 + Ventana</span>
            </div>
          </div>
          <div class="shortcut-tile wit-tap is-on-action" id="scAllOn">
            <span class="sc-icon" style="color: var(--color-amber);">☀️</span>
            <div class="sc-texts">
              <span class="sc-name">Todos ON</span>
              <span class="sc-sub">General</span>
            </div>
          </div>
          <div class="shortcut-tile wit-tap is-off-action" id="scAllOff">
            <span class="sc-icon">🌙</span>
            <div class="sc-texts">
              <span class="sc-name">Todos OFF</span>
              <span class="sc-sub">Apagado</span>
            </div>
          </div>
          <div class="shortcut-tile wit-tap" id="scSpotsOnly">
            <span class="sc-icon">💡</span>
            <div class="sc-texts">
              <span class="sc-name">Solo Spots</span>
              <span class="sc-sub">4 luminarias</span>
            </div>
          </div>
          <div class="shortcut-tile wit-tap" id="scSamplesOnly">
            <span class="sc-icon">◉</span>
            <div class="sc-texts">
              <span class="sc-name">Solo Muestras</span>
              <span class="sc-sub">5 paneles</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderWeatherWidget(weatherTemp, weatherState, weatherHumidity, weatherWind) {
    return `
      <div class="wit-card weather-widget wit-tap" id="cardWeatherWidget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Clima Showroom</span>
          <span style="color: var(--color-amber); font-size: 16px;">☀</span>
        </div>
        <div class="weather-center-stat">
          <div class="weather-temp-huge">${weatherTemp}°</div>
          <div class="weather-condition-sub">${weatherState === "sunny" ? "Soleado" : weatherState} • Humedad ${weatherHumidity}%</div>
        </div>
        <div class="weather-mini-week">
          <div class="fc-day-col"><span>Hoy</span><strong style="color: var(--color-amber);">24°</strong></div>
          <div class="fc-day-col"><span>Mañana</span><strong>23°</strong></div>
          <div class="fc-day-col"><span>Sábado</span><strong>25°</strong></div>
          <div class="fc-day-col"><span>Domingo</span><strong>21°</strong></div>
        </div>
      </div>
    `;
  }

  _renderEnergyWidget(powerWatts, energyKwh, isHighPower) {
    return `
      <div class="wit-card energy-widget wit-tap" id="cardEnergyWidget">
        <div class="widget-head-line">
          <span class="widget-title-badge">⚡ Energía</span>
          <span style="font-size: 11px; color: ${isHighPower ? "var(--color-amber)" : "var(--text-secondary)"}; font-weight: 600;">
            ${isHighPower ? "Carga Elevada" : "Carga Óptima"}
          </span>
        </div>
        <div class="energy-center-stat">
          <div class="energy-power-huge">${powerWatts} W</div>
          <div class="energy-sub-text">${energyKwh} kWh consumidos</div>
        </div>
        ${this._renderArchitecturalSparkline(this._stats)}
      </div>
    `;
  }

  _renderPowerGaugeWidget(powerWatts) {
    const pct = Math.min(100, Math.max(0, Math.round((powerWatts / TOTAL_NOMINAL_CAPACITY_W) * 100)));
    const strokeDash = `${pct * 2.51} 251.2`;
    const gaugeColor = pct > 85 ? "var(--color-rose)" : pct > 60 ? "var(--color-amber)" : "var(--witmind-orange)";

    return `
      <div class="wit-card power-gauge-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Carga Eléctrica</span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${TOTAL_NOMINAL_CAPACITY_W} W MAX</span>
        </div>
        <div class="gauge-center-wrapper">
          <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle class="gauge-bg-circle" cx="50" cy="50" r="40"/>
            <circle class="gauge-bar-circle" cx="50" cy="50" r="40" style="stroke-dasharray: ${strokeDash}; stroke: ${gaugeColor};"/>
          </svg>
          <div class="gauge-inner-info">
            <span class="gauge-percent-num">${pct}%</span>
            <span class="gauge-watts-sub">${powerWatts} W</span>
          </div>
        </div>
        <div class="gauge-bottom-legend">Capacidad nominal en operación</div>
      </div>
    `;
  }

  _renderActiveSceneWidget(activeAmbience) {
    return `
      <div class="wit-card active-scene-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Ambiente Activo</span>
          <span class="active-tag-chip">${activeAmbience.tag}</span>
        </div>
        <div class="ambience-body">
          <div class="ambience-name-title">${activeAmbience.name}</div>
          <div class="ambience-desc-sub">${activeAmbience.sub}</div>
        </div>
        <div class="ambience-footer-bar">
          <span style="color: var(--witmind-orange); font-size: 11px; font-weight: 600;">Modo automático reactivo</span>
        </div>
      </div>
    `;
  }

  _renderCalendarWidget() {
    return `
      <div class="wit-card calendar-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Agenda Showroom</span>
          <span style="font-size: 11px; color: var(--witmind-orange); font-weight: 600;">Septiembre 2026</span>
        </div>
        <div class="agenda-items-stack">
          <div class="agenda-day-group">
            <span class="agenda-day-label">HOY</span>
            <div class="agenda-event-row">
              <span class="event-time">09:00</span>
              <span class="event-desc">Presentación ejecutiva showroom</span>
            </div>
            <div class="agenda-event-row">
              <span class="event-time">11:30</span>
              <span class="event-desc">Reunión de especificación técnica</span>
            </div>
          </div>
          <div class="agenda-day-group">
            <span class="agenda-day-label">MAÑANA</span>
            <div class="agenda-event-row">
              <span class="event-time">10:00</span>
              <span class="event-desc">Demostración luminaria dinámica</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderMediaWidget(mediaTitle, mediaArtist, isPlaying, mediaVolume) {
    return `
      <div class="wit-card media-player-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Reproduciendo Ahora</span>
          <span style="font-size: 11px; color: var(--text-secondary);">${mediaVolume}% Vol</span>
        </div>
        <div class="media-body-layout">
          <div class="media-art-cobre">♫</div>
          <div class="media-text-column">
            <div class="media-track-title">${mediaTitle}</div>
            <div class="media-artist-name">${mediaArtist}</div>
          </div>
        </div>
        <div class="media-footer-controls">
          <div class="transport-btns-set">
            <button class="transport-btn" id="btnMediaPrev">◀</button>
            <button class="transport-btn play-glow-btn" id="btnMediaPlay">${isPlaying ? "❚❚" : "▶"}</button>
            <button class="transport-btn" id="btnMediaNext">▶</button>
          </div>
          <div class="vol-adjust-set">
            <button class="vol-btn-mini" id="btnVolDown">−</button>
            <button class="vol-btn-mini" id="btnVolUp">+</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderLightsWidget(totalActive, spotsOn, samplesOn, reflectorOn, powerWatts) {
    return `
      <div class="wit-card lights-summary-widget wit-tap" id="cardLightsWidget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Iluminación</span>
          <span class="card-icon-amber">💡</span>
        </div>
        <div class="lights-stat-block">
          <div class="lights-stat-num">${totalActive} / ${ALL_CIRCUITS.length} encendidas</div>
          <div class="lights-stat-sub">${powerWatts} W de carga actual</div>
        </div>
        <div class="circuit-chips-strip">
          <div class="circuit-chip">Spots: <strong>${spotsOn}/4</strong></div>
          <div class="circuit-chip">Muestras: <strong>${samplesOn}/5</strong></div>
          <div class="circuit-chip">Reflector: <strong>${reflectorOn}/1</strong></div>
        </div>
      </div>
    `;
  }

  _renderScenesWidget() {
    return `
      <div class="wit-card scenes-compact-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Escenas Showroom</span>
        </div>
        <div class="scenes-2x2-grid">
          <div class="scene-item-tile wit-tap" id="tileScenePres">
            <span>✨</span>
            <span>Presentación</span>
          </div>
          <div class="scene-item-tile wit-tap" id="tileSceneMeet">
            <span>👥</span>
            <span>Reunión</span>
          </div>
          <div class="scene-item-tile wit-tap is-on" id="tileSceneAllOn">
            <span style="color: var(--color-amber);">☀️</span>
            <span>Encender todo</span>
          </div>
          <div class="scene-item-tile wit-tap is-off" id="tileSceneAllOff">
            <span>🌙</span>
            <span>Apagar todo</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderRecentActivityWidget() {
    return `
      <div class="wit-card activity-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Actividad Reciente</span>
          <span style="font-size: 11px; color: var(--witmind-orange); font-weight: 600;">TELEMETRÍA EN VIVO</span>
        </div>
        <div class="activity-items-stack">
          ${this._recentActivity.map((a) => `
            <div class="activity-row-item">
              <span class="activity-icon-badge">${a.icon}</span>
              <div class="activity-content-col">
                <span class="activity-text">${a.text}</span>
                <span class="activity-time">${a.time}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  _renderDiagnosticsWidget(totalActive, isPlaying) {
    return `
      <div class="wit-card diagnostics-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Diagnóstico & Red</span>
          <span style="font-size: 11px; color: var(--color-success); font-weight: 600;">● ALL SYSTEMS OK</span>
        </div>
        <div class="diagnostics-grid">
          <div class="diag-tile">
            <span class="diag-label">Home Assistant</span>
            <span class="diag-val" style="color: var(--color-success);">Conectado</span>
          </div>
          <div class="diag-tile">
            <span class="diag-label">Weather API</span>
            <span class="diag-val" style="color: var(--color-success);">Suscrito (OK)</span>
          </div>
          <div class="diag-tile">
            <span class="diag-label">Recorder Stats</span>
            <span class="diag-val" style="color: var(--color-success);">Sincronizado</span>
          </div>
          <div class="diag-tile">
            <span class="diag-label">Dispositivos</span>
            <span class="diag-val">${ALL_CIRCUITS.length} Online</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderSystemWidget(batteryVal) {
    return `
      <div class="wit-card system-widget">
        <div class="widget-head-line">
          <span class="widget-title-badge">Sistema</span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">WTX MDTC</span>
        </div>
        <div class="system-stats-stack">
          <div class="sys-item-row">
            <span>Tablet Showroom</span>
            <strong>${batteryVal}% Batería</strong>
          </div>
          <div class="sys-item-row">
            <span>Servidor HASS</span>
            <strong>Mock HA Provider</strong>
          </div>
          <div class="sys-item-row">
            <span>Última Sincronización</span>
            <strong>${this._timeStr}</strong>
          </div>
        </div>
      </div>
    `;
  }

  _renderArchitecturalSparkline(stats) {
    if (!stats || stats.length === 0) {
      return `
        <div class="mini-bars-strip">
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
      <div class="mini-bars-strip">
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
      return `<div style="text-align: center; color: var(--text-muted); padding: 30px;">Cargando perfil horario...</div>`;
    }

    const maxMean = Math.max(...stats.map((s) => s.mean || (s.change ? s.change * 1000 : 0)), 100);

    return `
      <div class="energy-detailed-chart">
        ${stats.map((s, idx) => {
          const w = s.mean || (s.change ? s.change * 1000 : 0);
          const heightPercent = Math.max(6, Math.min(100, (w / maxMean) * 100));
          const hourLabel = `${idx}h`;
          const isPeak = w > maxMean * 0.75;
          return `
            <div class="detailed-bar-col" title="${hourLabel}: ${w.toFixed(1)} W">
              <div class="detailed-bar-fill ${isPeak ? "is-peak" : ""}" style="height: ${heightPercent}%;"></div>
              <span class="detailed-bar-label">${idx % 3 === 0 ? hourLabel : ""}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  _renderBottomDock(totalActive, powerWatts, isPlaying, batteryVal) {
    return `
      <nav class="wit-dock-bar">
        <div class="dock-pill-item wit-tap" id="dockLightsPill">
          <span style="color: var(--color-amber);">💡</span>
          <span>Luces ${totalActive}</span>
        </div>
        <div class="dock-pill-item wit-tap" id="dockPowerPill">
          <span style="color: var(--witmind-orange);">⚡</span>
          <span>${powerWatts} W</span>
        </div>
        <div class="dock-pill-item wit-tap" id="dockMediaPill">
          <span style="color: var(--witmind-orange);">♫</span>
          <span>Lounge ${isPlaying ? "❚❚" : "▶"}</span>
        </div>
        <div class="dock-pill-item wit-tap" id="dockBatteryPill">
          <span>🔋</span>
          <span>${batteryVal}%</span>
        </div>
        <div class="dock-page-dots">
          <div class="page-dot ${this._page === 0 ? "active" : ""}" id="dockDot0" title="Página 1: Operación"></div>
          <div class="page-dot ${this._page === 1 ? "active" : ""}" id="dockDot1" title="Página 2: Analítica"></div>
        </div>
      </nav>
    `;
  }

  _renderLightsSheet(totalActive, powerWatts) {
    return `
      <div class="sheet-modal-backdrop" id="sheetModalBackdrop">
        <div class="sheet-modal-panel">
          <div class="sheet-header-title-row">
            <div>
              <h2 class="sheet-main-title">Control de Luminarias</h2>
              <p class="sheet-sub-title">${totalActive} de ${ALL_CIRCUITS.length} encendidas • ${powerWatts} W de carga</p>
            </div>
            <div class="sheet-close-button" id="sheetCloseIcon">✕</div>
          </div>

          <!-- SPOTS -->
          <div>
            <div class="sheet-group-heading">Circuitos Spots</div>
            <div class="switches-list-stack">
              ${SPOTS.map((s) => {
                const isOn = this._value(s.id) === "on";
                return `
                  <div class="switch-row-tactile wit-tap ${isOn ? "active-circuit" : ""}" data-entity-id="${s.id}">
                    <div class="switch-left-group">
                      <div class="circuit-icon-box">💡</div>
                      <div>
                        <div class="circuit-name-label">${s.name}</div>
                        <div class="circuit-meta-label">${s.subtitle} • ${s.watts} W</div>
                      </div>
                    </div>
                    <div class="switch-pill-toggle"></div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- SAMPLES -->
          <div>
            <div class="sheet-group-heading">Muestrarios & Paneles</div>
            <div class="switches-list-stack">
              ${SAMPLES.map((s) => {
                const isOn = this._value(s.id) === "on";
                return `
                  <div class="switch-row-tactile wit-tap ${isOn ? "active-circuit" : ""}" data-entity-id="${s.id}">
                    <div class="switch-left-group">
                      <div class="circuit-icon-box">💡</div>
                      <div>
                        <div class="circuit-name-label">${s.name}</div>
                        <div class="circuit-meta-label">${s.subtitle} • ${s.watts} W</div>
                      </div>
                    </div>
                    <div class="switch-pill-toggle"></div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- REFLECTOR -->
          <div>
            <div class="sheet-group-heading">Reflector Exterior</div>
            <div class="switches-list-stack">
              <div class="switch-row-tactile wit-tap ${this._value(REFLECTOR.id) === "on" ? "active-circuit" : ""}" data-entity-id="${REFLECTOR.id}">
                <div class="switch-left-group">
                  <div class="circuit-icon-box">💡</div>
                  <div>
                    <div class="circuit-name-label">${REFLECTOR.name}</div>
                    <div class="circuit-meta-label">${REFLECTOR.subtitle}</div>
                  </div>
                </div>
                <div class="switch-pill-toggle"></div>
              </div>
            </div>
          </div>

          <!-- Bulk Actions -->
          <div class="sheet-actions-bar">
            <button class="sheet-btn-action danger" id="modalTurnAllOff">🌙 Apagar Todo</button>
            <button class="sheet-btn-action" id="modalTurnAllOn">☀️ Encender Todo</button>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    // Entidades
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

    const isHighPower = powerWattsVal > 800;
    const activeAmbience = this._detectActiveScene();
    const isLightMode = this._theme === "light";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          /* Identidad Witmind Glass — Tema Oscuro por defecto */
          --witmind-orange: #f26522;
          --witmind-orange-hover: #d95a1e;
          --witmind-orange-soft: rgba(242, 101, 34, 0.12);
          --witmind-orange-glow: rgba(242, 101, 34, 0.25);

          --bg-deep: #051722;
          --bg-main: #061c2b;
          --bg-secondary: #0b2b40;

          --text-primary: rgba(255, 255, 255, 0.96);
          --text-secondary: rgba(255, 255, 255, 0.64);
          --text-muted: rgba(255, 255, 255, 0.40);

          --glass: rgba(20, 24, 27, 0.65);
          --glass-strong: rgba(20, 24, 27, 0.82);
          --glass-border: rgba(255, 255, 255, 0.11);
          --orange-border: rgba(242, 101, 34, 0.32);
          --orange-glow: rgba(242, 101, 34, 0.18);

          --color-amber: #f6b63b;
          --color-success: #42ca86;
          --color-rose: #f05a5a;

          --radius-card: 26px;
          --radius-btn: 18px;
          --radius-pill: 999px;
          --radius-sheet: 32px;

          display: block;
          width: 100%;
          min-height: 100dvh;
          box-sizing: border-box;
          user-select: none;
          -webkit-user-select: none;
          overflow-x: hidden;

          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
          color: var(--text-primary);

          /* Wallpaper Arquitectónico Oscuro Witmind */
          background:
            radial-gradient(
              900px 600px at 85% 15%,
              rgba(242, 101, 34, 0.22),
              transparent 62%
            ),
            radial-gradient(
              700px 500px at 15% 85%,
              rgba(242, 101, 34, 0.09),
              transparent 65%
            ),
            linear-gradient(
              145deg,
              #020609,
              #06151d 46%,
              #090b0d
            );
          position: relative;
        }

        /* TEMA CLARO — Witmind Studio Frost */
        :host([theme="light"]) {
          --witmind-orange: #f26522;
          --witmind-orange-hover: #d95a1e;
          --witmind-orange-soft: rgba(242, 101, 34, 0.12);
          --witmind-orange-glow: rgba(242, 101, 34, 0.20);

          --bg-deep: #f8fafc;
          --bg-main: #f1f5f9;
          --bg-secondary: #e2e8f0;

          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;

          --glass: rgba(255, 255, 255, 0.78);
          --glass-strong: rgba(255, 255, 255, 0.92);
          --glass-border: rgba(15, 23, 42, 0.08);
          --orange-border: rgba(242, 101, 34, 0.35);
          --orange-glow: rgba(242, 101, 34, 0.15);

          --color-amber: #d97706;
          --color-success: #16a34a;
          --color-rose: #dc2626;

          background:
            radial-gradient(
              900px 600px at 85% 15%,
              rgba(242, 101, 34, 0.14),
              transparent 62%
            ),
            radial-gradient(
              700px 500px at 15% 85%,
              rgba(242, 101, 34, 0.07),
              transparent 65%
            ),
            linear-gradient(
              145deg,
              #f8fafc,
              #f1f5f9 46%,
              #e2e8f0
            );
          color: var(--text-primary);
        }

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Líneas lumínicas naranjas desenfocadas de fondo */
        .ambient-light-ribbon-1 {
          position: fixed;
          top: -15%;
          right: 5%;
          width: 50vw;
          height: 45vh;
          background: radial-gradient(ellipse at center, rgba(242, 101, 34, 0.16), transparent 68%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .ambient-light-ribbon-2 {
          position: fixed;
          bottom: -10%;
          left: 10%;
          width: 45vw;
          height: 40vh;
          background: radial-gradient(ellipse at center, rgba(242, 101, 34, 0.08), transparent 70%);
          filter: blur(70px);
          pointer-events: none;
          z-index: 0;
        }

        :host([theme="light"]) .ambient-light-ribbon-1 {
          background: radial-gradient(ellipse at center, rgba(242, 101, 34, 0.10), transparent 68%);
        }
        :host([theme="light"]) .ambient-light-ribbon-2 {
          background: radial-gradient(ellipse at center, rgba(242, 101, 34, 0.05), transparent 70%);
        }

        /* Dev Bar (?dev=1) */
        .dev-bar {
          background: rgba(4, 10, 15, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--glass-border);
          padding: 6px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
          position: sticky;
          top: 0;
          z-index: 9000;
        }
        :host([theme="light"]) .dev-bar {
          background: rgba(255, 255, 255, 0.9);
          color: #475569;
        }
        .dev-bar a {
          color: var(--witmind-orange);
          text-decoration: none;
          font-weight: 600;
          margin-left: 10px;
        }
        .dev-bar a:hover { text-decoration: underline; }

        /* Contenedor Principal */
        .layout-main-frame {
          position: relative;
          z-index: 1;
          max-width: 1480px;
          margin: 0 auto;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding:
            max(20px, env(safe-area-inset-top))
            max(32px, env(safe-area-inset-right))
            max(96px, env(safe-area-inset-bottom))
            max(32px, env(safe-area-inset-left));
          gap: clamp(14px, 1.4vw, 22px);
        }

        /* Tarjeta Base Witmind Glass */
        .wit-card {
          position: relative;
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.085),
              rgba(255, 255, 255, 0.015)
            ),
            var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-card);
          backdrop-filter: blur(26px) saturate(125%);
          -webkit-backdrop-filter: blur(26px) saturate(125%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.10),
            0 20px 50px rgba(0, 0, 0, 0.34);
          transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1), border-color 0.18s, box-shadow 0.18s;
          overflow: hidden;
        }

        .wit-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              transparent 32%
            );
        }

        .wit-card:hover {
          border-color: rgba(255, 255, 255, 0.22);
          transform: translateY(-1px);
        }

        /* Adaptación Light Theme para Tarjetas */
        :host([theme="light"]) .wit-card {
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.95),
              rgba(255, 255, 255, 0.65)
            ),
            var(--glass);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 1),
            0 14px 36px rgba(15, 23, 42, 0.06);
        }
        :host([theme="light"]) .wit-card:hover {
          border-color: rgba(15, 23, 42, 0.16);
        }

        .wit-tap:active {
          transform: scale(0.985);
        }

        /* Header Arquitectónico */
        .wit-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0 6px 0;
          gap: 16px;
        }

        .brand-pills-cluster {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .brand-text-block {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .brand-title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--text-primary);
        }
        .brand-sub {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--witmind-orange);
          text-transform: uppercase;
        }

        .status-pills-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status-pill {
          min-height: 52px;
          padding: 0 16px;
          background: rgba(25, 26, 28, 0.64);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-pill);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.18s;
        }
        :host([theme="light"]) .status-pill {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(15, 23, 42, 0.08);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        }
        .status-pill:hover {
          border-color: var(--orange-border);
          background: rgba(35, 38, 42, 0.75);
          transform: translateY(-1px);
        }
        :host([theme="light"]) .status-pill:hover {
          background: #ffffff;
        }
        .status-pill.hero-pill {
          border-color: rgba(242, 101, 34, 0.38);
          box-shadow: 0 0 16px rgba(242, 101, 34, 0.16);
        }
        .status-pill.warning-pill {
          border-color: rgba(240, 90, 90, 0.4);
          background: rgba(45, 15, 20, 0.7);
        }

        .pill-badge-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .pill-badge-circle.amber {
          background: rgba(246, 182, 59, 0.15);
          color: var(--color-amber);
        }
        .pill-badge-circle.orange {
          background: var(--witmind-orange-soft);
          color: var(--witmind-orange);
        }

        .pill-text-block {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }
        .pill-title-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .pill-sub-text {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .clock-battery-cluster {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          line-height: 1;
        }
        .clock-digits {
          font-size: clamp(54px, 5.5vw, 68px);
          font-weight: 300;
          letter-spacing: -0.04em;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }
        .date-battery-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }
        .date-string-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .battery-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
          background: rgba(25, 26, 28, 0.6);
          border: 1px solid var(--glass-border);
          font-size: 11px;
          font-weight: 600;
          color: ${isBatteryLow ? "var(--color-rose)" : "var(--text-secondary)"};
        }
        :host([theme="light"]) .battery-pill-badge {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(15, 23, 42, 0.08);
        }

        .theme-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        :host([theme="light"]) .theme-toggle-btn {
          background: rgba(15, 23, 42, 0.05);
        }
        .theme-toggle-btn:hover {
          border-color: var(--orange-border);
          background: var(--witmind-orange-soft);
        }

        /* Horizontal Carousel Snap Container */
        .pages-scroll-track {
          display: flex;
          width: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          gap: 32px;
        }
        .pages-scroll-track::-webkit-scrollbar { display: none; }

        .page-snap-pane {
          flex: 0 0 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          display: flex;
          flex-direction: column;
          gap: clamp(14px, 1.4vw, 22px);
        }

        /* Grids Modulares Densos */
        .widget-head-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .widget-title-badge {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }

        /* Hero Widget */
        .hero-widget {
          padding: 24px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background:
            linear-gradient(135deg, rgba(242, 101, 34, 0.12), rgba(18, 24, 27, 0.7) 40%),
            var(--glass);
          border: 1px solid var(--orange-border);
        }
        :host([theme="light"]) .hero-widget {
          background:
            linear-gradient(135deg, rgba(242, 101, 34, 0.10), rgba(255, 255, 255, 0.85) 40%),
            var(--glass);
        }
        .hero-left-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hero-label-tag {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--witmind-orange);
        }
        .hero-headline {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }
        .hero-description {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .hero-nav-bar {
          display: flex;
          gap: 8px;
          background: rgba(10, 15, 18, 0.6);
          padding: 4px;
          border-radius: var(--radius-pill);
          border: 1px solid var(--glass-border);
        }
        :host([theme="light"]) .hero-nav-bar {
          background: rgba(15, 23, 42, 0.05);
        }
        .hero-nav-link {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 18px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hero-nav-link:hover { color: var(--text-primary); }
        .hero-nav-link.active {
          background: var(--witmind-orange);
          color: #ffffff;
          box-shadow: 0 0 14px var(--orange-glow);
        }

        /* Grid Superior de 4 Columnas */
        .grid-quad-top {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: clamp(14px, 1.4vw, 22px);
        }
        @media (max-width: 1180px) {
          .grid-quad-top { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 650px) {
          .grid-quad-top { grid-template-columns: 1fr; }
        }

        /* Grid Medio: Rooms, Shortcuts, Calendar */
        .grid-middle-trio {
          display: grid;
          grid-template-columns: 1.1fr 1.3fr 1.3fr;
          gap: clamp(14px, 1.4vw, 22px);
        }
        @media (max-width: 1100px) {
          .grid-middle-trio { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 720px) {
          .grid-middle-trio { grid-template-columns: 1fr; }
        }

        /* Weather Widget */
        .weather-widget {
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 190px;
          cursor: pointer;
        }
        .weather-center-stat {
          margin: 6px 0;
        }
        .weather-temp-huge {
          font-size: 38px;
          font-weight: 300;
          color: var(--text-primary);
          line-height: 1;
        }
        .weather-condition-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .weather-mini-week {
          display: flex;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--glass-border);
          font-size: 11px;
          color: var(--text-secondary);
        }
        .fc-day-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        /* Energy Widget */
        .energy-widget {
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 190px;
          cursor: pointer;
        }
        .energy-center-stat {
          margin: 6px 0;
        }
        .energy-power-huge {
          font-size: 36px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }
        .energy-sub-text {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .mini-bars-strip {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 34px;
        }
        .mini-bars-strip span {
          flex: 1;
          border-radius: 2px 2px 0 0;
          background: rgba(255, 255, 255, 0.16);
        }
        :host([theme="light"]) .mini-bars-strip span {
          background: rgba(15, 23, 42, 0.1);
        }
        .mini-bars-strip span.is-hot {
          background: var(--witmind-orange);
          box-shadow: 0 0 6px var(--orange-glow);
        }

        /* Power Gauge Widget */
        .power-gauge-widget {
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 190px;
        }
        .gauge-center-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }
        .gauge-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .gauge-bg-circle {
          fill: none;
          stroke: rgba(255, 255, 255, 0.12);
          stroke-width: 8;
        }
        :host([theme="light"]) .gauge-bg-circle {
          stroke: rgba(15, 23, 42, 0.08);
        }
        .gauge-bar-circle {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray 0.4s ease;
        }
        .gauge-inner-info {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1.1;
        }
        .gauge-percent-num {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .gauge-watts-sub {
          font-size: 10px;
          color: var(--text-muted);
        }
        .gauge-bottom-legend {
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
        }

        /* Active Scene Widget */
        .active-scene-widget {
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 190px;
        }
        .active-tag-chip {
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          background: var(--witmind-orange-soft);
          border: 1px solid var(--orange-border);
          color: var(--witmind-orange);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .ambience-body {
          margin: 6px 0;
        }
        .ambience-name-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .ambience-desc-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .ambience-footer-bar {
          padding-top: 10px;
          border-top: 1px solid var(--glass-border);
        }

        /* Rooms Widget */
        .rooms-widget {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rooms-list-stack {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .room-tactile-row {
          padding: 9px 12px;
          background: rgba(25, 30, 36, 0.5);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-btn);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        :host([theme="light"]) .room-tactile-row {
          background: rgba(241, 245, 249, 0.7);
          border-color: rgba(15, 23, 42, 0.06);
        }
        .room-tactile-row:hover {
          background: rgba(35, 42, 50, 0.75);
          border-color: var(--orange-border);
        }
        :host([theme="light"]) .room-tactile-row:hover {
          background: #ffffff;
        }
        .room-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .room-dot-icon { font-size: 14px; }
        .room-name-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .room-val-pill {
          padding: 3px 10px;
          border-radius: var(--radius-pill);
          background: rgba(255, 255, 255, 0.08);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        :host([theme="light"]) .room-val-pill {
          background: rgba(15, 23, 42, 0.06);
        }
        .room-val-pill.active {
          background: var(--witmind-orange-soft);
          color: var(--witmind-orange);
          border: 1px solid var(--orange-border);
        }

        /* Shortcuts Widget */
        .shortcuts-widget {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .shortcuts-2x3-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .shortcut-tile {
          background: rgba(25, 30, 36, 0.5);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-btn);
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s;
          min-height: 48px;
        }
        :host([theme="light"]) .shortcut-tile {
          background: rgba(241, 245, 249, 0.7);
          border-color: rgba(15, 23, 42, 0.06);
        }
        .shortcut-tile:hover {
          background: rgba(35, 42, 50, 0.75);
          border-color: var(--orange-border);
          transform: translateY(-1px);
        }
        :host([theme="light"]) .shortcut-tile:hover {
          background: #ffffff;
        }
        .shortcut-tile.is-on-action {
          background: var(--witmind-orange-soft);
          border-color: var(--orange-border);
        }
        .shortcut-tile.is-off-action:hover {
          border-color: rgba(240, 90, 90, 0.4);
        }
        .sc-icon { font-size: 15px; }
        .sc-texts { display: flex; flex-direction: column; line-height: 1.15; }
        .sc-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .sc-sub { font-size: 10px; color: var(--text-muted); }

        /* Calendar Widget */
        .calendar-widget {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .agenda-items-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .agenda-day-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .agenda-day-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .agenda-event-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          background: rgba(25, 30, 36, 0.4);
          border-radius: 8px;
          border-left: 2px solid var(--witmind-orange);
          font-size: 12px;
        }
        :host([theme="light"]) .agenda-event-row {
          background: rgba(241, 245, 249, 0.7);
        }
        .event-time { font-weight: 700; color: var(--witmind-orange); }
        .event-desc { color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Page 2 Layout Grids */
        .grid-page2-quad {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(14px, 1.4vw, 22px);
        }
        @media (max-width: 900px) {
          .grid-page2-quad { grid-template-columns: 1fr; }
        }

        /* Media Player Widget */
        .media-player-widget {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 220px;
        }
        .media-body-layout {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 10px 0;
        }
        .media-art-cobre {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background: linear-gradient(135deg, #f26522 0%, #1a1a24 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 18px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          flex-shrink: 0;
        }
        .media-text-column {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .media-track-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .media-artist-name {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .media-footer-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid var(--glass-border);
        }
        .transport-btns-set {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .transport-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(30, 35, 40, 0.6);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        :host([theme="light"]) .transport-btn {
          background: rgba(15, 23, 42, 0.05);
        }
        .transport-btn:hover {
          background: rgba(45, 52, 60, 0.8);
          border-color: var(--orange-border);
        }
        :host([theme="light"]) .transport-btn:hover {
          background: rgba(15, 23, 42, 0.1);
        }
        .transport-btn.play-glow-btn {
          background: var(--witmind-orange);
          color: #ffffff;
          border: none;
          box-shadow: 0 0 16px var(--orange-glow);
        }
        .vol-adjust-set {
          display: flex;
          gap: 6px;
        }
        .vol-btn-mini {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(30, 35, 40, 0.6);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        :host([theme="light"]) .vol-btn-mini {
          background: rgba(15, 23, 42, 0.05);
        }

        /* Lights Summary Widget */
        .lights-summary-widget {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 220px;
          cursor: pointer;
        }
        .card-icon-amber {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(246, 182, 59, 0.12);
          color: var(--color-amber);
          border: 1px solid rgba(246, 182, 59, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lights-stat-block {
          margin: 8px 0;
        }
        .lights-stat-num {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .lights-stat-sub {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .circuit-chips-strip {
          display: flex;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid var(--glass-border);
        }
        .circuit-chip {
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          background: rgba(255, 255, 255, 0.06);
          font-size: 11px;
          color: var(--text-secondary);
        }
        :host([theme="light"]) .circuit-chip {
          background: rgba(15, 23, 42, 0.05);
        }

        /* Scenes 2x2 Widget */
        .scenes-compact-widget {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .scenes-2x2-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .scene-item-tile {
          background: rgba(25, 30, 35, 0.6);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-btn);
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          transition: all 0.15s;
        }
        :host([theme="light"]) .scene-item-tile {
          background: rgba(241, 245, 249, 0.7);
          border-color: rgba(15, 23, 42, 0.06);
        }
        .scene-item-tile:hover {
          border-color: var(--orange-border);
          background: rgba(35, 42, 50, 0.8);
        }
        :host([theme="light"]) .scene-item-tile:hover {
          background: #ffffff;
        }
        .scene-item-tile.is-on {
          border-color: var(--orange-border);
          background: var(--witmind-orange-soft);
        }

        /* Activity Widget */
        .activity-widget {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .activity-items-stack {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .activity-row-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: rgba(25, 30, 36, 0.4);
          border-radius: 8px;
          font-size: 12px;
        }
        :host([theme="light"]) .activity-row-item {
          background: rgba(241, 245, 249, 0.7);
        }
        .activity-icon-badge { font-size: 13px; }
        .activity-content-col { display: flex; flex-direction: column; line-height: 1.15; }
        .activity-text { font-weight: 600; color: var(--text-primary); }
        .activity-time { font-size: 10px; color: var(--text-muted); }

        /* Diagnostics Widget */
        .diagnostics-widget {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .diagnostics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .diag-tile {
          background: rgba(25, 30, 35, 0.5);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-btn);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        :host([theme="light"]) .diag-tile {
          background: rgba(241, 245, 249, 0.7);
          border-color: rgba(15, 23, 42, 0.06);
        }
        .diag-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
        .diag-val { font-size: 13px; font-weight: 700; color: var(--text-primary); }

        /* System Widget */
        .system-widget {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .system-stats-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 6px;
        }
        .sys-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 6px 0;
          border-bottom: 1px solid var(--glass-border);
        }
        .sys-item-row strong { color: var(--text-primary); }

        /* Bottom Translucent Dock */
        .wit-dock-bar {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20, 24, 28, 0.85);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-pill);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px var(--orange-glow);
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 2000;
        }
        :host([theme="light"]) .wit-dock-bar {
          background: rgba(255, 255, 255, 0.88);
          border-color: rgba(15, 23, 42, 0.1);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12), 0 0 20px var(--orange-glow);
        }
        .dock-pill-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: all 0.15s;
        }
        :host([theme="light"]) .dock-pill-item {
          background: rgba(15, 23, 42, 0.04);
        }
        .dock-pill-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--orange-border);
        }
        :host([theme="light"]) .dock-pill-item:hover {
          background: rgba(15, 23, 42, 0.08);
        }
        .dock-page-dots {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 6px;
        }
        .page-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        :host([theme="light"]) .page-dot {
          background: rgba(15, 23, 42, 0.2);
        }
        .page-dot.active {
          width: 20px;
          border-radius: var(--radius-pill);
          background: var(--witmind-orange);
          box-shadow: 0 0 10px var(--orange-glow);
        }

        /* Lights Sheet Modal */
        .sheet-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.18s ease-out;
        }
        :host([theme="light"]) .sheet-modal-backdrop {
          background: rgba(15, 23, 42, 0.4);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sheet-modal-panel {
          background:
            linear-gradient(160deg, rgba(28, 35, 40, 0.95), rgba(12, 16, 20, 0.98)),
            #0a0f12;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sheet);
          width: min(640px, calc(100vw - 40px));
          max-height: 85dvh;
          overflow-y: auto;
          padding: 28px 26px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8);
          animation: scaleIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        :host([theme="light"]) .sheet-modal-panel {
          background:
            linear-gradient(160deg, #ffffff, #f8fafc),
            #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.1);
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.2);
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .sheet-header-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sheet-main-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .sheet-sub-title {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .sheet-close-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        :host([theme="light"]) .sheet-close-button {
          background: rgba(15, 23, 42, 0.06);
        }
        .sheet-close-button:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.16);
        }

        .sheet-group-heading {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--witmind-orange);
          margin-bottom: 6px;
        }
        .switches-list-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .switch-row-tactile {
          height: 64px;
          padding: 0 16px;
          background: rgba(25, 30, 36, 0.6);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-btn);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s;
        }
        :host([theme="light"]) .switch-row-tactile {
          background: rgba(241, 245, 249, 0.7);
          border-color: rgba(15, 23, 42, 0.06);
        }
        .switch-row-tactile:hover {
          background: rgba(35, 42, 50, 0.75);
          border-color: rgba(255, 255, 255, 0.2);
        }
        :host([theme="light"]) .switch-row-tactile:hover {
          background: #ffffff;
        }
        .switch-row-tactile.active-circuit {
          border-color: var(--orange-border);
          background: rgba(242, 101, 34, 0.12);
        }

        .switch-left-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .circuit-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        :host([theme="light"]) .circuit-icon-box {
          background: rgba(15, 23, 42, 0.05);
        }
        .active-circuit .circuit-icon-box {
          background: rgba(246, 182, 59, 0.2);
          color: var(--color-amber);
          box-shadow: 0 0 12px rgba(246, 182, 59, 0.3);
        }
        .circuit-name-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .circuit-meta-label { font-size: 11px; color: var(--text-secondary); }

        .switch-pill-toggle {
          width: 50px;
          height: 28px;
          border-radius: var(--radius-pill);
          background: rgba(255, 255, 255, 0.12);
          position: relative;
          transition: all 0.2s;
        }
        :host([theme="light"]) .switch-pill-toggle {
          background: rgba(15, 23, 42, 0.12);
        }
        .switch-pill-toggle::after {
          content: "";
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          top: 3px;
          left: 3px;
          transition: transform 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .active-circuit .switch-pill-toggle {
          background: var(--witmind-orange);
          box-shadow: 0 0 12px var(--orange-glow);
        }
        .active-circuit .switch-pill-toggle::after {
          transform: translateX(22px);
        }

        .sheet-actions-bar {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        .sheet-btn-action {
          flex: 1;
          height: 46px;
          border-radius: var(--radius-btn);
          border: 1px solid var(--orange-border);
          background: var(--witmind-orange);
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .sheet-btn-action.danger {
          background: rgba(240, 90, 90, 0.2);
          color: var(--color-rose);
          border-color: rgba(240, 90, 90, 0.3);
        }
      </style>

      <!-- Ribbons de Iluminación Ambiental -->
      <div class="ambient-light-ribbon-1"></div>
      <div class="ambient-light-ribbon-2"></div>

      ${
        this._isDev
          ? `
        <div class="dev-bar">
          <div><strong>MODO DEV</strong> — Witmind Glass (${isLightMode ? "Tema Claro" : "Tema Oscuro"})</div>
          <div>
            <a href="/showroom-witmind.html">🏛️ Witmind Oscuro</a>
            <a href="/showroom-witmind-light.html">☀️ Witmind Claro</a>
            <a href="/showroom-aero.html">💎 Aero Glass</a>
            <a href="/showroom-ios.html">📱 iOS Tablet</a>
            <a href="/showroom.html">🎛️ Lovelace HA</a>
          </div>
        </div>
      `
          : ""
      }

      <div class="layout-main-frame">
        <!-- Header Arquitectónico -->
        <header class="wit-header-bar">
          <div class="brand-pills-cluster">
            <div class="brand-text-block">
              <span class="brand-title">WITMIND</span>
              <span class="brand-sub">SHOWROOM · WTX MDTC</span>
            </div>

            <div class="status-pills-row">
              ${this._renderStatusPills(totalActive, powerWattsVal, isPlaying, energyKwhVal, batteryVal, isBatteryLow)}
            </div>
          </div>

          <div class="clock-battery-cluster">
            <div class="clock-digits" id="witClockText">${this._timeStr}</div>
            <div class="date-battery-row">
              <span class="date-string-label" id="witDateText">${this._dateStr}</span>
              <button class="theme-toggle-btn" id="btnToggleTheme" title="Alternar Tema">
                ${isLightMode ? "☀️ Claro" : "🌙 Oscuro"}
              </button>
              <div class="battery-pill-badge">
                <span>▣ Tablet ${batteryVal}%</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Horizontal Carousel Track -->
        <div class="pages-scroll-track" id="pagesScrollTrack">
          <!-- PAGE 1: Operación / General -->
          <div class="page-snap-pane">
            <!-- Hero Showroom -->
            ${this._renderHeroWidget(totalActive, powerWattsVal)}

            <!-- Grid Superior de 4 Columnas: Weather, Energy, Power Gauge, Active Ambience -->
            <div class="grid-quad-top">
              ${this._renderWeatherWidget(weatherTemp, weatherState, weatherHumidity, weatherWind)}
              ${this._renderEnergyWidget(powerWattsVal, energyKwhVal, isHighPower)}
              ${this._renderPowerGaugeWidget(powerWattsVal)}
              ${this._renderActiveSceneWidget(activeAmbience)}
            </div>

            <!-- Grid Medio de 3 Columnas: Rooms (1fr), Shortcuts (1.3fr), Calendar (1.3fr) -->
            <div class="grid-middle-trio">
              ${this._renderRoomsWidget(spotsOn, samplesOn, reflectorOn, isPlaying, powerWattsVal)}
              ${this._renderShortcutsWidget()}
              ${this._renderCalendarWidget()}
            </div>
          </div>

          <!-- PAGE 2: Analítica / Media / Control Extendido -->
          <div class="page-snap-pane">
            <!-- Grid Cuádruple de Detalle -->
            <div class="grid-page2-quad">
              ${this._renderMediaWidget(mediaTitle, mediaArtist, isPlaying, mediaVolume)}
              ${this._renderLightsWidget(totalActive, spotsOn, samplesOn, reflectorOn, powerWattsVal)}
              ${this._renderScenesWidget()}
              ${this._renderRecentActivityWidget()}
            </div>

            <div class="grid-page2-quad">
              ${this._renderDiagnosticsWidget(totalActive, isPlaying)}
              ${this._renderSystemWidget(batteryVal)}
            </div>
          </div>
        </div>

        <!-- Bottom Translucent Dock -->
        ${this._renderBottomDock(totalActive, powerWattsVal, isPlaying, batteryVal)}

        <!-- Modals & Sheets -->
        ${this._sheet === "lights" ? this._renderLightsSheet(totalActive, powerWattsVal) : ""}
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    // Theme Toggle
    root.querySelector("#btnToggleTheme")?.addEventListener("click", () => this._toggleTheme());

    // Header Pills
    root.querySelector("#pillLightsBtn")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#pillMediaBtn")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#pillEnergyBtn")?.addEventListener("click", () => this._setPage(1));

    // Hero Navigation
    root.querySelector("#heroNavHome")?.addEventListener("click", () => this._setPage(0));
    root.querySelector("#heroNavLights")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#heroNavEnergy")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#heroNavMore")?.addEventListener("click", () => this._setPage(1));

    // Widget Taps
    root.querySelector("#cardWeatherWidget")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#cardEnergyWidget")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#cardLightsWidget")?.addEventListener("click", () => this._openSheet("lights"));

    // Rooms Rows Taps
    root.querySelector("#roomSpotsRow")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#roomSamplesRow")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#roomReflectorRow")?.addEventListener("click", () => this._toggleSwitch(REFLECTOR.id));
    root.querySelector("#roomMediaRow")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#roomEnergyRow")?.addEventListener("click", () => this._setPage(1));

    // Shortcuts 2x3 Grid
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

    // Scenes Compact Grid (Page 2)
    root.querySelector("#tileScenePres")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.presentation });
    });
    root.querySelector("#tileSceneMeet")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.meeting });
    });
    root.querySelector("#tileSceneAllOn")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });
    root.querySelector("#tileSceneAllOff")?.addEventListener("click", () => {
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

    // Dock Pills & Dots
    root.querySelector("#dockLightsPill")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#dockPowerPill")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#dockMediaPill")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#dockBatteryPill")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#dockDot0")?.addEventListener("click", () => this._setPage(0));
    root.querySelector("#dockDot1")?.addEventListener("click", () => this._setPage(1));

    // Lights Sheet Modal
    root.querySelector("#sheetCloseIcon")?.addEventListener("click", () => this._closeSheet());
    root.querySelector("#sheetModalBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "sheetModalBackdrop") {
        this._closeSheet();
      }
    });

    root.querySelectorAll(".switch-row-tactile").forEach((row) => {
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

customElements.define("showroom-witmind", ShowroomWitmind);
