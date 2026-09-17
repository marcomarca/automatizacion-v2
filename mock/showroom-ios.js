/**
 * Showroom iOS Native Web Component — Prototipo Experimental para Tablet
 *
 * Consumo estricto de Home Assistant:
 *   - this.hass.states
 *   - this.hass.callService(domain, service, data)
 *   - this.hass.callWS(msg)
 *   - this.hass.connection.subscribeMessage(callback, msg)
 */

const ENTITIES = {
  weather: "weather.forecast_casa",
  media: "media_player.showroom_1",
  lightCount: "sensor.showroom_luminarias_encendidas",
  power: "sensor.showroom_potencia_estimada",
  energy: "sensor.showroom_energia_estimada",
  battery: "sensor.21051182g_battery_level",
  scenePresentation: "scene.presentacion",
  sceneMeeting: "scene.reunion",
  scriptAllOn: "script.showroom_encendido_general",
  scriptAllOff: "script.showroom_apagado_general"
};

const LIGHT_ENTITIES = [
  { id: "switch.interruptor_inteligente_switch_1", name: "Spots ventana", group: "SPOTS", watts: 100 },
  { id: "switch.interruptor_inteligente_switch_2", name: "Spots 2×3", group: "SPOTS", watts: 120 },
  { id: "switch.interruptor_inteligente_switch_3", name: "Spots 3×3", group: "SPOTS", watts: 180 },
  { id: "switch.interruptor_inteligente_switch_4", name: "Spots TV", group: "SPOTS", watts: 25 },
  { id: "switch.interruptor_inteligente_2_switch_1", name: "Paneles 3k/6k", group: "SAMPLES", watts: 96 },
  { id: "switch.interruptor_inteligente_2_switch_2", name: "Colgantes", group: "SAMPLES", watts: 10 },
  { id: "switch.interruptor_inteligente_2_switch_3", name: "Slims", group: "SAMPLES", watts: 432 },
  { id: "switch.interruptor_inteligente_2_switch_4", name: "Downlights", group: "SAMPLES", watts: 144 },
  { id: "switch.smart_relay_switch_4_switch", name: "Paneles (Relé 4)", group: "SAMPLES", watts: 288 }
];

class ShowroomIos extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._view = "home"; // "home" | "energy" | "scenes" | "more"
    this._activeModal = null; // null | "lights" | "weather"
    this._forecast = [];
    this._stats = [];
    this._statsTimeframe = "day"; // "day" | "month" | "year"
    this._timeStr = this._getCurrentTimeString();
    this._timeInterval = null;
    this._isDev = new URLSearchParams(window.location.search).has("dev");
  }

  set hass(value) {
    this._hass = value;
    this.render();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._timeInterval = setInterval(() => {
      this._timeStr = this._getCurrentTimeString();
      const clockEl = this.shadowRoot?.querySelector("#headerClock");
      if (clockEl) clockEl.textContent = this._timeStr;
    }, 1000);

    this._subscribeForecast();
    this._fetchStatistics();
    this.render();
  }

  disconnectedCallback() {
    if (this._timeInterval) clearInterval(this._timeInterval);
    if (this._unsubForecast) this._unsubForecast();
  }

  _getCurrentTimeString() {
    const now = new Date();
    return now.toTimeString().substring(0, 5);
  }

  _subscribeForecast() {
    if (this._hass?.connection?.subscribeMessage) {
      try {
        this._unsubForecast = this._hass.connection.subscribeMessage(
          (msg) => {
            if (msg.forecast) {
              this._forecast = msg.forecast;
              this.render();
            }
          },
          { type: "weather/subscribe_forecast", entity_id: ENTITIES.weather }
        );
      } catch (_e) {}
    }
  }

  async _fetchStatistics() {
    if (this._hass?.callWS) {
      try {
        const now = Date.now();
        const start = now - 24 * 3600 * 1000;
        const res = await this._hass.callWS({
          type: "recorder/statistics_during_period",
          start_time: new Date(start).toISOString(),
          end_time: new Date(now).toISOString(),
          statistic_ids: [ENTITIES.energy],
          period: "hour"
        });
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

  _openModal(name) {
    this._activeModal = name;
    this.render();
  }

  _closeModal() {
    this._activeModal = null;
    this.render();
  }

  _setView(view) {
    this._view = view;
    this._activeModal = null;
    this.render();
  }

  render() {
    const lightCount = this._value(ENTITIES.lightCount, "0");
    const powerWatts = this._value(ENTITIES.power, "0");
    const energyKwh = Number(this._value(ENTITIES.energy, "26.11")).toFixed(2);
    const batteryLvl = this._value(ENTITIES.battery, "98");
    const weatherState = this._value(ENTITIES.weather, "sunny");
    const weatherTemp = this._attr(ENTITIES.weather, "temperature", "23.5");

    const mediaState = this._value(ENTITIES.media, "paused");
    const mediaTitle = this._attr(ENTITIES.media, "media_title", "Ambient Lounge Experience");
    const mediaArtist = this._attr(ENTITIES.media, "media_artist", "Witmind Studio");
    const mediaVolume = this._attr(ENTITIES.media, "volume_level", 0.65);
    const isPlaying = mediaState === "playing";

    const isLightModalOpen = this._activeModal === "lights";
    const isWeatherModalOpen = this._activeModal === "weather";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --accent: #f26522;
          --accent-blue: #0ea5e9;
          --accent-emerald: #10b981;
          --bg: #08090d;
          --glass: rgba(24, 25, 30, 0.72);
          --glass-strong: rgba(36, 38, 45, 0.85);
          --glass-subtle: rgba(255, 255, 255, 0.04);
          --border: rgba(255, 255, 255, 0.09);
          --border-strong: rgba(255, 255, 255, 0.16);
          --highlight: rgba(255, 255, 255, 0.18);
          --text-primary: rgba(255, 255, 255, 0.96);
          --text-secondary: rgba(255, 255, 255, 0.58);
          --text-muted: rgba(255, 255, 255, 0.38);

          --radius-card: 28px;
          --radius-control: 18px;
          --radius-pill: 9999px;
          --gap: 16px;

          display: block;
          width: 100%;
          min-height: 100vh;
          background: var(--bg);
          background-image:
            radial-gradient(circle at 10% 10%, rgba(242, 101, 34, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(14, 165, 233, 0.06) 0%, transparent 45%);
          color: var(--text-primary);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
          user-select: none;
          -webkit-user-select: none;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Dev Bar (Only shown when ?dev=1) */
        .dev-bar {
          background: rgba(15, 23, 42, 0.9);
          border-bottom: 1px solid var(--border);
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .dev-nav a {
          color: var(--accent-blue);
          text-decoration: none;
          margin-left: 8px;
          font-weight: 600;
        }
        .dev-nav a:hover { text-decoration: underline; }

        /* Container Principal */
        .app-frame {
          max-width: 1180px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 20px 24px 96px 24px;
          gap: var(--gap);
        }

        /* Glassmorphism Classes */
        .glass {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.015)), var(--glass);
          border: 1px solid var(--border);
          border-radius: var(--radius-card);
          backdrop-filter: blur(28px) saturate(140%);
          -webkit-backdrop-filter: blur(28px) saturate(140%);
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.08), 0 18px 45px rgba(0, 0, 0, 0.28);
          transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), border-color 0.2s;
        }
        .glass:hover {
          border-color: var(--border-strong);
        }
        .glass-tap:active {
          transform: scale(0.985);
        }

        /* Header iOS Tablet */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 4px;
        }
        .header-brand {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .brand-logo {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-primary);
        }
        .brand-sub {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .header-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--glass-subtle);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .clock-display {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        /* Title Area */
        .title-area {
          margin: 4px 0 8px 0;
        }
        .title-main {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-primary);
        }
        .title-date {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
          margin-top: 2px;
        }

        /* Horizontal Carousel Pages (Scroll-Snap) */
        .pages-container {
          display: flex;
          width: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          gap: 20px;
        }
        .pages-container::-webkit-scrollbar { display: none; }

        .page {
          flex: 0 0 100%;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          gap: var(--gap);
        }

        /* Grid de Tarjetas iOS */
        .grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--gap);
        }
        @media (max-width: 720px) {
          .grid-2col { grid-template-columns: 1fr; }
        }

        /* Lighting Card */
        .card-lighting {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 160px;
          cursor: pointer;
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent);
        }
        .card-icon-round {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(242, 101, 34, 0.15);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .card-main-val {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 12px;
        }
        .card-sub-val {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
          margin-top: 2px;
        }

        /* Weather Card */
        .card-weather {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 160px;
          cursor: pointer;
        }
        .weather-icon-round {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(14, 165, 233, 0.15);
          color: var(--accent-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        /* Media Player Card */
        .card-media {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .media-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .media-track-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .media-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .media-artist {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .media-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
        }
        .media-btn {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          transition: background 0.15s;
        }
        .media-btn:hover {
          background: var(--glass-subtle);
        }
        .media-btn-play {
          background: var(--text-primary);
          color: #000000;
          font-size: 18px;
        }
        .media-btn-play:hover {
          background: #ffffff;
          transform: scale(1.05);
        }

        /* Scenes Card */
        .card-scenes {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .scenes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .scene-tile {
          background: var(--glass-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-control);
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          color: var(--text-primary);
        }
        .scene-tile:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-strong);
        }
        .scene-tile:active {
          transform: scale(0.96);
        }
        .scene-tile.danger {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
        }

        /* Information Page 2 Cards */
        .card-energy-preview {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          cursor: pointer;
        }
        .sparkline-svg {
          width: 100%;
          height: 60px;
          overflow: visible;
        }

        /* Bottom Sheet / Modal iOS Style */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 2000;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding: 0;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .bottom-sheet {
          background: #14151b;
          border: 1px solid var(--border-strong);
          border-radius: 32px 32px 0 0;
          width: 100%;
          max-width: 640px;
          max-height: 85vh;
          overflow-y: auto;
          padding: 28px 24px 44px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
          animation: slideUp 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sheet-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .sheet-close-btn {
          background: var(--glass-subtle);
          border: 1px solid var(--border);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          color: var(--text-secondary);
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .sheet-close-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }

        .sheet-group-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-top: 6px;
        }

        .switches-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .switch-row {
          background: var(--glass-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-control);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s;
        }
        .switch-row:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--border-strong);
        }
        .switch-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .switch-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .switch-watts {
          font-size: 12px;
          color: var(--text-muted);
        }
        .switch-toggle-pill {
          width: 48px;
          height: 28px;
          border-radius: var(--radius-pill);
          background: rgba(255, 255, 255, 0.12);
          position: relative;
          transition: background 0.2s;
        }
        .switch-toggle-pill::after {
          content: "";
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          top: 3px;
          left: 3px;
          transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }
        .switch-row.active .switch-toggle-pill {
          background: var(--accent);
        }
        .switch-row.active .switch-toggle-pill::after {
          transform: translateX(20px);
        }

        /* Persistent Bottom Navigation iOS Bar */
        .bottom-nav {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(24, 25, 30, 0.85);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-pill);
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          border: none;
        }
        .nav-item:hover {
          color: var(--text-primary);
        }
        .nav-item.active {
          background: var(--text-primary);
          color: #000000;
          font-weight: 700;
        }
        .nav-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-secondary);
        }
        .nav-item.active .nav-dot {
          background: #000000;
        }

        /* Views (Energy, Scenes, More) */
        .view-pane {
          display: flex;
          flex-direction: column;
          gap: var(--gap);
          animation: fadeIn 0.2s ease-out;
        }

        .bar-chart-container {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 160px;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
        }
        .bar-col {
          flex: 1;
          background: rgba(242, 101, 34, 0.35);
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease, background 0.2s;
          position: relative;
        }
        .bar-col:hover {
          background: var(--accent);
        }
        .bar-col.peak {
          background: var(--accent);
        }
      </style>

      ${
        this._isDev
          ? `
        <div class="dev-bar">
          <div><strong>MODO DEV</strong> — Showroom iOS Tablet Prototype</div>
          <div class="dev-nav">
            <a href="/dashboard-bms.html">🌌 BMS Dark</a>
            <a href="/showroom.html">🎛️ Lovelace HA</a>
            <a href="/dashboard-matrix.html">📟 SCADA Matrix</a>
            <a href="/dashboard-exec.html">☀️ Executive</a>
            <a href="/#/overview">⚡ SPA</a>
          </div>
        </div>
      `
          : ""
      }

      <div class="app-frame">
        <!-- Header -->
        <header class="header">
          <div class="header-brand">
            <span class="brand-logo">WITMIND</span>
            <span class="brand-sub">SHOWROOM</span>
          </div>
          <div class="header-status">
            <div class="status-pill clock-display" id="headerClock">${this._timeStr}</div>
            <div class="status-pill" id="headerWeatherBtn" style="cursor: pointer;">☀️ ${weatherTemp}°</div>
            <div class="status-pill">🔋 ${batteryLvl}%</div>
          </div>
        </header>

        <!-- Title -->
        <div class="title-area">
          <div class="title-main">Showroom HQ</div>
          <div class="title-date">Jueves, 17 de Septiembre • Confort & Iluminación Activa</div>
        </div>

        <!-- Renderizado según View Activa -->
        ${this._renderCurrentView(lightCount, powerWatts, energyKwh, weatherTemp, weatherState, isPlaying, mediaTitle, mediaArtist, mediaVolume)}
      </div>

      <!-- Persistent Bottom Navigation -->
      <nav class="bottom-nav">
        <button type="button" class="nav-item ${this._view === "home" ? "active" : ""}" id="navHome">
          <span class="nav-dot"></span>
          <span>Home</span>
        </button>
        <button type="button" class="nav-item ${this._view === "energy" ? "active" : ""}" id="navEnergy">
          <span class="nav-dot"></span>
          <span>Energy</span>
        </button>
        <button type="button" class="nav-item ${this._view === "scenes" ? "active" : ""}" id="navScenes">
          <span class="nav-dot"></span>
          <span>Scenes</span>
        </button>
        <button type="button" class="nav-item ${this._view === "more" ? "active" : ""}" id="navMore">
          <span class="nav-dot"></span>
          <span>More</span>
        </button>
      </nav>

      <!-- Modales / Bottom Sheets -->
      ${isLightModalOpen ? this._renderLightingSheet() : ""}
      ${isWeatherModalOpen ? this._renderWeatherSheet(weatherTemp, weatherState) : ""}
    `;

    this._bindEvents();
  }

  _renderCurrentView(lightCount, powerWatts, energyKwh, weatherTemp, weatherState, isPlaying, mediaTitle, mediaArtist, mediaVolume) {
    if (this._view === "home") {
      return `
        <div class="pages-container">
          <!-- Page 1: Controls -->
          <div class="page">
            <div class="grid-2col">
              <!-- Lighting Card -->
              <div class="glass glass-tap card-lighting" id="cardLighting">
                <div class="card-top">
                  <span class="card-badge">💡 LIGHTING</span>
                  <div class="card-icon-round">💡</div>
                </div>
                <div>
                  <div class="card-main-val">${lightCount} lights on</div>
                  <div class="card-sub-val">${powerWatts} W de 1395 W instalados</div>
                </div>
              </div>

              <!-- Weather Card -->
              <div class="glass glass-tap card-weather" id="cardWeather">
                <div class="card-top">
                  <span class="card-badge" style="color: var(--accent-blue);">☀️ WEATHER</span>
                  <div class="weather-icon-round">☀️</div>
                </div>
                <div>
                  <div class="card-main-val">${weatherTemp}°</div>
                  <div class="card-sub-val" style="text-transform: capitalize;">${weatherState} • Confort 23.0°C</div>
                </div>
              </div>
            </div>

            <div class="grid-2col">
              <!-- Now Playing Card -->
              <div class="glass card-media">
                <div class="media-header">
                  <span class="card-badge" style="color: var(--accent-emerald);">🎵 NOW PLAYING</span>
                  <span style="font-size: 12px; color: var(--text-muted);">${Math.round(mediaVolume * 100)}% vol</span>
                </div>
                <div class="media-track-info">
                  <div class="media-title">${mediaTitle}</div>
                  <div class="media-artist">${mediaArtist}</div>
                </div>
                <div class="media-controls">
                  <button type="button" class="media-btn" id="btnMediaPrev">◀◀</button>
                  <button type="button" class="media-btn media-btn-play" id="btnMediaPlay">
                    ${isPlaying ? "❚❚" : "▶"}
                  </button>
                  <button type="button" class="media-btn" id="btnMediaNext">▶▶</button>
                </div>
              </div>

              <!-- Quick Scenes Card -->
              <div class="glass card-scenes">
                <div class="card-badge">✨ QUICK SCENES</div>
                <div class="scenes-grid">
                  <div class="scene-tile" id="scenePresentacion">
                    <span>Presentation</span>
                    <span>↗</span>
                  </div>
                  <div class="scene-tile" id="sceneReunion">
                    <span>Meeting</span>
                    <span>↗</span>
                  </div>
                  <div class="scene-tile" id="sceneAllOn">
                    <span>All On</span>
                    <span>●</span>
                  </div>
                  <div class="scene-tile danger" id="sceneAllOff">
                    <span>All Off</span>
                    <span>○</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Page 2: Information & Telemetry Summary -->
          <div class="page">
            <div class="glass card-energy-preview" id="cardEnergyPreview">
              <div class="card-top">
                <span class="card-badge" style="color: var(--accent-emerald);">🔋 ENERGY OVERVIEW</span>
                <span style="font-size: 13px; color: var(--text-muted);">Ver historial completo →</span>
              </div>
              <div class="card-main-val">${energyKwh} kWh</div>
              <div class="card-sub-val">Consumo histórico acumulado registrado en Home Assistant</div>
              
              <!-- Mini SVG Sparkline -->
              <svg class="sparkline-svg" viewBox="0 0 400 60" preserveAspectRatio="none">
                <path d="M0,50 Q40,48 80,45 T160,20 T240,15 T320,35 T400,25" fill="none" stroke="#f26522" stroke-width="3" />
                <path d="M0,50 Q40,48 80,45 T160,20 T240,15 T320,35 T400,25 L400,60 L0,60 Z" fill="rgba(242, 101, 34, 0.12)" />
              </svg>
            </div>
          </div>
        </div>
      `;
    }

    if (this._view === "energy") {
      return `
        <div class="view-pane">
          <div class="glass" style="padding: 28px; display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <span class="card-badge" style="color: var(--accent-emerald);">ENERGY TELEMETRY</span>
                <div style="font-size: 36px; font-weight: 800; margin-top: 6px;">${energyKwh} <small style="font-size: 18px; color: var(--text-secondary);">kWh</small></div>
                <div style="font-size: 14px; color: var(--text-secondary);">Historial real extraído de Home Assistant (35 días)</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="status-pill" style="background: var(--text-primary); color: #000; font-weight: 700;">24h</button>
                <button type="button" class="status-pill">Mes</button>
              </div>
            </div>

            <!-- Simulación gráfica de barras 24h -->
            <div class="bar-chart-container">
              ${[0, 0, 0, 0, 0, 0, 0, 0, 10, 45, 65, 85, 78, 42, 55, 95, 100, 68, 60, 35, 8, 0, 0, 0]
                .map((h, i) => `
                <div class="bar-col ${h === 100 ? "peak" : ""}" style="height: ${Math.max(4, h)}%;" title="Hora ${i}:00 - ${h}% de pico"></div>
              `).join("")}
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
              <div style="background: var(--glass-subtle); padding: 14px; border-radius: var(--radius-control);">
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">POTENCIA NOMINAL</div>
                <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">1,395 W</div>
                <div style="font-size: 12px; color: var(--text-secondary);">9 circuitos showroom</div>
              </div>
              <div style="background: var(--glass-subtle); padding: 14px; border-radius: var(--radius-control);">
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">POTENCIA MEDIA ACTIVA</div>
                <div style="font-size: 20px; font-weight: 800; margin-top: 4px; color: var(--accent);">38.1 W</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Promedio histórico</div>
              </div>
              <div style="background: var(--glass-subtle); padding: 14px; border-radius: var(--radius-control);">
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">CONSUMO HOY</div>
                <div style="font-size: 20px; font-weight: 800; margin-top: 4px; color: var(--accent-emerald);">0.206 kWh</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Día en curso</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (this._view === "scenes") {
      return `
        <div class="view-pane">
          <div class="glass" style="padding: 28px; display: flex; flex-direction: column; gap: 16px;">
            <span class="card-badge">AMBIENTES Y ESCENARIOS</span>
            <div style="font-size: 22px; font-weight: 800;">Escenas Rápidas Showroom</div>
            <div class="scenes-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
              <div class="scene-tile" id="scenePresentacion" style="padding: 20px;">
                <div>
                  <div style="font-weight: 700; font-size: 16px;">Presentación</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Spots ventana + TV</div>
                </div>
                <span style="font-size: 20px;">🎬</span>
              </div>
              <div class="scene-tile" id="sceneReunion" style="padding: 20px;">
                <div>
                  <div style="font-weight: 700; font-size: 16px;">Reunión</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Spots 2×3 + Ventana</div>
                </div>
                <span style="font-size: 20px;">👥</span>
              </div>
              <div class="scene-tile" id="sceneAllOn" style="padding: 20px;">
                <div>
                  <div style="font-weight: 700; font-size: 16px;">Encendido General</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Todos los circuitos ON</div>
                </div>
                <span style="font-size: 20px;">⚡</span>
              </div>
              <div class="scene-tile danger" id="sceneAllOff" style="padding: 20px;">
                <div>
                  <div style="font-weight: 700; font-size: 16px;">Apagado General</div>
                  <div style="font-size: 12px; color: rgba(239, 68, 68, 0.7); margin-top: 4px;">0 W consumo nocturno</div>
                </div>
                <span style="font-size: 20px;">🌙</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (this._view === "more") {
      return `
        <div class="view-pane">
          <div class="glass" style="padding: 28px; display: flex; flex-direction: column; gap: 16px;">
            <span class="card-badge">CONFIGURACIÓN & DIAGNÓSTICO</span>
            <div style="font-size: 22px; font-weight: 800;">Sistema de Gestión Witmind</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
              <a href="/dashboard-bms.html" style="text-decoration: none; color: inherit;">
                <div class="scene-tile" style="padding: 18px;">
                  <div>
                    <div style="font-weight: 700;">🌌 BMS Command Center</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Consola oscura operativa</div>
                  </div>
                  <span>↗</span>
                </div>
              </a>
              <a href="/dashboard-matrix.html" style="text-decoration: none; color: inherit;">
                <div class="scene-tile" style="padding: 18px;">
                  <div>
                    <div style="font-weight: 700;">📟 SCADA Matrix HUD</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Terminal de relés industrial</div>
                  </div>
                  <span>↗</span>
                </div>
              </a>
              <a href="/dashboard-exec.html" style="text-decoration: none; color: inherit;">
                <div class="scene-tile" style="padding: 18px;">
                  <div>
                    <div style="font-weight: 700;">☀️ Executive Dashboard</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Reporte claro de sostenibilidad</div>
                  </div>
                  <span>↗</span>
                </div>
              </a>
              <a href="/showroom.html" style="text-decoration: none; color: inherit;">
                <div class="scene-tile" style="padding: 18px;">
                  <div>
                    <div style="font-weight: 700;">🎛️ Panel Original Lovelace</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Custom panel v1.5.1</div>
                  </div>
                  <span>↗</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    return "";
  }

  _renderLightingSheet() {
    const spots = LIGHT_ENTITIES.filter((l) => l.group === "SPOTS");
    const samples = LIGHT_ENTITIES.filter((l) => l.group === "SAMPLES");

    return `
      <div class="modal-overlay" id="modalOverlay">
        <div class="bottom-sheet">
          <div class="sheet-header">
            <div class="sheet-title">Control de Luces</div>
            <button type="button" class="sheet-close-btn" id="modalCloseBtn">✕</button>
          </div>

          <div class="sheet-group-label">SPOTS</div>
          <div class="switches-list">
            ${spots
              .map((l) => {
                const isOn = this._value(l.id) === "on";
                return `
                <div class="switch-row ${isOn ? "active" : ""}" data-entity="${l.id}">
                  <div class="switch-info">
                    <span class="switch-name">${l.name}</span>
                    <span class="switch-watts">${l.watts} W • ${isOn ? "Encendido" : "Apagado"}</span>
                  </div>
                  <div class="switch-toggle-pill"></div>
                </div>
              `;
              })
              .join("")}
          </div>

          <div class="sheet-group-label">MUESTRAS & PANELES</div>
          <div class="switches-list">
            ${samples
              .map((l) => {
                const isOn = this._value(l.id) === "on";
                return `
                <div class="switch-row ${isOn ? "active" : ""}" data-entity="${l.id}">
                  <div class="switch-info">
                    <span class="switch-name">${l.name}</span>
                    <span class="switch-watts">${l.watts} W • ${isOn ? "Encendido" : "Apagado"}</span>
                  </div>
                  <div class="switch-toggle-pill"></div>
                </div>
              `;
              })
              .join("")}
          </div>

          <div style="margin-top: 10px;">
            <button type="button" class="scene-tile danger" id="btnModalAllOff" style="width: 100%; justify-content: center; padding: 14px;">
              Apagar todas las luces
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _renderWeatherSheet(temp, condition) {
    return `
      <div class="modal-overlay" id="modalOverlay">
        <div class="bottom-sheet">
          <div class="sheet-header">
            <div class="sheet-title">Clima & Forecast</div>
            <button type="button" class="sheet-close-btn" id="modalCloseBtn">✕</button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--glass-subtle); padding: 18px; border-radius: var(--radius-control);">
            <div>
              <div style="font-size: 32px; font-weight: 800;">${temp}°</div>
              <div style="font-size: 14px; color: var(--text-secondary); text-transform: capitalize;">${condition}</div>
            </div>
            <div style="text-align: right; font-size: 13px; color: var(--text-secondary);">
              <div>Humedad: <strong>48%</strong></div>
              <div>Presión: <strong>1014 hPa</strong></div>
              <div>Viento: <strong>12 km/h</strong></div>
            </div>
          </div>

          <div class="sheet-group-label">PRONÓSTICO SEMANAL</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${(this._forecast.length ? this._forecast : [
              { datetime: "Hoy", condition: "sunny", temperature: 24, templow: 14 },
              { datetime: "Mañana", condition: "partlycloudy", temperature: 23, templow: 13 },
              { datetime: "Sábado", condition: "sunny", temperature: 25, templow: 15 },
              { datetime: "Domingo", condition: "cloudy", temperature: 21, templow: 12 }
            ])
              .map(
                (f) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--glass-subtle); border-radius: var(--radius-control); font-size: 13px;">
                <span>${f.datetime.length > 10 ? f.datetime.substring(0, 10) : f.datetime}</span>
                <span style="color: var(--accent-blue); text-transform: capitalize;">${f.condition}</span>
                <span><strong>${f.temperature}°</strong> / ${f.templow}°</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    // Bottom Navigation
    root.querySelector("#navHome")?.addEventListener("click", () => this._setView("home"));
    root.querySelector("#navEnergy")?.addEventListener("click", () => this._setView("energy"));
    root.querySelector("#navScenes")?.addEventListener("click", () => this._setView("scenes"));
    root.querySelector("#navMore")?.addEventListener("click", () => this._setView("more"));

    // Card Clicks
    root.querySelector("#cardLighting")?.addEventListener("click", () => this._openModal("lights"));
    root.querySelector("#cardWeather")?.addEventListener("click", () => this._openModal("weather"));
    root.querySelector("#headerWeatherBtn")?.addEventListener("click", () => this._openModal("weather"));
    root.querySelector("#cardEnergyPreview")?.addEventListener("click", () => this._setView("energy"));

    // Modal Close
    root.querySelector("#modalCloseBtn")?.addEventListener("click", () => this._closeModal());
    root.querySelector("#modalOverlay")?.addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") this._closeModal();
    });

    // Switches Toggle Inside Modal
    root.querySelectorAll(".switch-row").forEach((row) => {
      row.addEventListener("click", () => {
        const entityId = row.getAttribute("data-entity");
        if (entityId) this._toggleSwitch(entityId);
      });
    });

    // Media Controls
    root.querySelector("#btnMediaPlay")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnMediaPrev")?.addEventListener("click", () => {
      this._callService("media_player", "volume_down", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnMediaNext")?.addEventListener("click", () => {
      this._callService("media_player", "volume_up", { entity_id: ENTITIES.media });
    });

    // Scenes
    root.querySelectorAll("#scenePresentacion").forEach((el) => {
      el.addEventListener("click", () => {
        this._callService("scene", "turn_on", { entity_id: ENTITIES.scenePresentation });
      });
    });
    root.querySelectorAll("#sceneReunion").forEach((el) => {
      el.addEventListener("click", () => {
        this._callService("scene", "turn_on", { entity_id: ENTITIES.sceneMeeting });
      });
    });
    root.querySelectorAll("#sceneAllOn").forEach((el) => {
      el.addEventListener("click", () => {
        this._callService("script", "turn_on", { entity_id: ENTITIES.scriptAllOn });
      });
    });
    root.querySelectorAll("#sceneAllOff, #btnModalAllOff").forEach((el) => {
      el.addEventListener("click", () => {
        this._callService("script", "turn_on", { entity_id: ENTITIES.scriptAllOff });
      });
    });
  }
}

customElements.define("showroom-ios", ShowroomIos);
