/**
 * Showroom Witmind Glass — Native Web Component para Tablet
 *
 * Identidad Witmind + Smoked Glassmorphism Oscuro + Iluminación Arquitectónica (#f26522)
 *
 * Consumo estricto de Home Assistant:
 *   - this.hass.states
 *   - this.hass.callService(domain, service, data)
 *   - this.hass.callWS(msg)
 *   - this.hass.connection.sendMessagePromise(msg)
 *   - this.hass.connection.subscribeMessage(callback, msg)
 */

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

class ShowroomWitmind extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._view = "home"; // "home" | "lights" | "energy" | "scenes" | "more"
    this._sheet = null; // null | "lights" | "weather"
    this._forecast = [];
    this._stats = [];
    this._statsTimeframe = "day"; // "day" | "month" | "year"
    this._timeStr = this._getCurrentTimeString();
    this._dateStr = this._getCurrentDateString();
    this._timeInterval = null;
    this._unsubForecast = null;
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
      this._dateStr = this._getCurrentDateString();
      const clockEl = this.shadowRoot?.querySelector("#witmindClock");
      if (clockEl) clockEl.textContent = this._timeStr;
      const dateEl = this.shadowRoot?.querySelector("#witmindDate");
      if (dateEl) dateEl.textContent = this._dateStr;
    }, 1000);

    this._subscribeForecast();
    this._fetchStatistics();
    this.render();
  }

  disconnectedCallback() {
    if (this._timeInterval) clearInterval(this._timeInterval);
    if (this._unsubForecast) {
      try {
        this._unsubForecast();
      } catch (_e) {}
    }
  }

  _getCurrentTimeString() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
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

  _openSheet(name) {
    this._sheet = name;
    this.render();
  }

  _closeSheet() {
    this._sheet = null;
    this.render();
  }

  _setView(viewName) {
    this._view = viewName;
    this._sheet = null;
    this.render();
  }

  _renderArchitecturalBars(stats) {
    if (!stats || stats.length === 0) {
      return `
        <div class="mini-bar-strip">
          <span style="height: 20%;"></span>
          <span style="height: 35%;"></span>
          <span style="height: 50%;"></span>
          <span style="height: 75%;" class="is-active"></span>
          <span style="height: 90%;" class="is-active"></span>
          <span style="height: 60%;"></span>
          <span style="height: 40%;"></span>
          <span style="height: 25%;"></span>
        </div>
      `;
    }

    const maxMean = Math.max(...stats.map((s) => s.mean || (s.change ? s.change * 1000 : 0)), 100);

    return `
      <div class="mini-bar-strip">
        ${stats.slice(0, 16).map((s) => {
          const w = s.mean || (s.change ? s.change * 1000 : 0);
          const pct = Math.max(12, Math.min(100, (w / maxMean) * 100));
          const isActive = w > maxMean * 0.4;
          return `<span style="height: ${pct}%;" class="${isActive ? "is-active" : ""}"></span>`;
        }).join("")}
      </div>
    `;
  }

  _renderDetailedEnergyChart(stats) {
    if (!stats || stats.length === 0) {
      return `<div style="text-align: center; color: rgba(255,255,255,0.4); padding: 30px;">Cargando perfil horario...</div>`;
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

  render() {
    // Entidades clave
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
    const mediaTitle = this._attr(ENTITIES.media, "media_title", "Ambient Lounge");
    const mediaArtist = this._attr(ENTITIES.media, "media_artist", "Witmind Studio");
    const mediaVolume = Math.round((this._attr(ENTITIES.media, "volume_level", 0.65) || 0.65) * 100);

    // Contadores por categoría
    const spotsOn = SPOTS.filter((s) => this._value(s.id) === "on").length;
    const samplesOn = SAMPLES.filter((s) => this._value(s.id) === "on").length;
    const reflectorOn = this._value(REFLECTOR.id) === "on" ? 1 : 0;
    const totalActive = spotsOn + samplesOn + reflectorOn;

    // Evaluaciones contextuales
    const isHighPower = powerWattsVal > 800;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          /* Identidad Witmind Glass */
          --witmind-orange: #f26522;
          --witmind-orange-hover: #d95a1e;
          --witmind-orange-soft: rgba(242, 101, 34, 0.12);
          --witmind-orange-glow: rgba(242, 101, 34, 0.24);

          --bg-0: #020609;
          --bg-1: #051722;
          --bg-2: #061c2b;
          --bg-3: #0b2b40;

          /* Superficies Smoked Glass */
          --glass: rgba(18, 24, 27, 0.68);
          --glass-strong: rgba(22, 28, 32, 0.85);
          --glass-soft: rgba(255, 255, 255, 0.045);
          --glass-border: rgba(255, 255, 255, 0.11);
          --glass-border-warm: rgba(242, 101, 34, 0.32);

          --text-primary: rgba(255, 255, 255, 0.96);
          --text-secondary: rgba(255, 255, 255, 0.64);
          --text-muted: rgba(255, 255, 255, 0.40);

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
        .dev-bar a {
          color: var(--witmind-orange);
          text-decoration: none;
          font-weight: 600;
          margin-left: 10px;
        }
        .dev-bar a:hover { text-decoration: underline; }

        /* Contenedor Principal */
        .app-layout {
          position: relative;
          z-index: 1;
          max-width: 1440px;
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

        .wit-tap:active {
          transform: scale(0.985);
        }

        /* Glow Naranja Selectivo */
        .is-active, .wit-card.is-active {
          border-color: rgba(242, 101, 34, 0.48) !important;
          box-shadow:
            inset 0 1px rgba(255, 255, 255, 0.10),
            0 0 22px rgba(242, 101, 34, 0.14) !important;
          background:
            linear-gradient(
              145deg,
              rgba(242, 101, 34, 0.18),
              rgba(242, 101, 34, 0.045)
            ) !important;
        }

        /* Header Arquitectónico */
        .wit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0 8px 0;
          gap: 16px;
        }

        .header-brand-group {
          display: flex;
          align-items: center;
          gap: 16px;
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
          color: #ffffff;
        }
        .brand-subtitle {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--witmind-orange);
          text-transform: uppercase;
        }

        .header-pills-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status-pill {
          min-height: 54px;
          padding: 0 18px;
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
        .status-pill:hover {
          border-color: var(--glass-border-warm);
          background: rgba(35, 38, 42, 0.75);
          transform: translateY(-1px);
        }
        .status-pill.hero-glow {
          border-color: rgba(242, 101, 34, 0.38);
          box-shadow: 0 0 16px rgba(242, 101, 34, 0.16);
        }

        .pill-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .pill-icon-circle.amber {
          background: rgba(246, 182, 59, 0.15);
          color: var(--color-amber);
        }
        .pill-icon-circle.orange {
          background: var(--witmind-orange-soft);
          color: var(--witmind-orange);
        }

        .pill-text-col {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }
        .pill-main-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .pill-sub-text {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .header-clock-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          line-height: 1;
        }
        .header-clock-num {
          font-size: clamp(54px, 5.5vw, 68px);
          font-weight: 300;
          letter-spacing: -0.04em;
          color: #ffffff;
          font-variant-numeric: tabular-nums;
        }
        .header-date-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }
        .header-date-str {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .battery-chip {
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

        /* Showroom Hero Section */
        .showroom-hero-card {
          padding: 24px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background:
            linear-gradient(135deg, rgba(242, 101, 34, 0.12), rgba(18, 24, 27, 0.7) 40%),
            var(--glass);
          border: 1px solid var(--glass-border-warm);
        }
        .hero-info-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hero-tagline {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--witmind-orange);
        }
        .hero-title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .hero-sub {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .hero-nav-pills {
          display: flex;
          gap: 8px;
          background: rgba(10, 15, 18, 0.6);
          padding: 4px;
          border-radius: var(--radius-pill);
          border: 1px solid var(--glass-border);
        }
        .hero-nav-btn {
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
        .hero-nav-btn:hover {
          color: #ffffff;
        }
        .hero-nav-btn.active {
          background: var(--witmind-orange);
          color: #ffffff;
          box-shadow: 0 0 14px var(--witmind-orange-glow);
        }

        /* Grid Home (Landscape 3 Columnas) */
        .wit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 1.4vw, 22px);
        }
        @media (max-width: 1040px) {
          .wit-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 700px) {
          .wit-grid { grid-template-columns: 1fr; }
        }

        /* Lighting Card */
        .card-lighting {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
          cursor: pointer;
        }
        .card-top-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-title-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }
        .card-icon-warm {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(246, 182, 59, 0.12);
          color: var(--color-amber);
          border: 1px solid rgba(246, 182, 59, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lighting-kpi-main {
          margin: 12px 0 6px 0;
        }
        .lighting-num-val {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .lighting-state-sub {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .circuit-breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid var(--glass-border);
          font-size: 12px;
          color: var(--text-secondary);
        }
        .breakdown-group {
          display: flex;
          gap: 12px;
        }
        .breakdown-group span strong {
          color: #ffffff;
        }

        /* Weather Card */
        .card-weather {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
          cursor: pointer;
        }
        .weather-hero-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin: 8px 0;
        }
        .weather-temp-val {
          font-size: 42px;
          font-weight: 300;
          color: #ffffff;
          letter-spacing: -0.03em;
        }
        .weather-status-label {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .mini-forecast-strip {
          display: flex;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--glass-border);
          font-size: 11px;
          color: var(--text-secondary);
        }
        .mini-fc-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        /* Energy Card */
        .card-energy {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
          cursor: pointer;
        }
        .energy-val-block {
          margin: 8px 0;
        }
        .energy-power-kpi {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .energy-kwh-detail {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .mini-bar-strip {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 38px;
          padding-top: 6px;
        }
        .mini-bar-strip span {
          flex: 1;
          border-radius: 3px 3px 0 0;
          background: rgba(255, 255, 255, 0.16);
          transition: height 0.2s;
        }
        .mini-bar-strip span.is-active {
          background: var(--witmind-orange);
          box-shadow: 0 0 8px var(--witmind-orange-glow);
        }

        /* Scenes Card (2x2 Grid) */
        .card-scenes {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .scenes-2x2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .scene-item-btn {
          background: rgba(25, 30, 35, 0.6);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-btn);
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s;
          color: var(--text-primary);
          min-height: 48px;
        }
        .scene-item-btn:hover {
          background: rgba(35, 42, 50, 0.8);
          border-color: var(--glass-border-warm);
          transform: translateY(-1px);
        }
        .scene-item-btn:active {
          transform: scale(0.97);
        }
        .scene-item-btn.is-active-scene {
          background: var(--witmind-orange-soft);
          border-color: var(--witmind-orange);
          box-shadow: 0 0 16px var(--witmind-orange-glow);
        }

        /* Media Card */
        .card-media {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
        }
        .media-track-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 6px 0;
        }
        .media-art-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #f26522 0%, #1a1a24 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          flex-shrink: 0;
        }
        .media-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .media-title-val {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .media-artist-val {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .media-controls-wrap {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid var(--glass-border);
        }
        .media-transport-btns {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .media-action-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(30, 35, 40, 0.6);
          border: 1px solid var(--glass-border);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .media-action-btn:hover {
          background: rgba(45, 52, 60, 0.8);
          border-color: var(--glass-border-warm);
        }
        .media-action-btn.play-highlight {
          background: var(--witmind-orange);
          color: #ffffff;
          border: none;
          box-shadow: 0 0 16px var(--witmind-orange-glow);
        }
        .media-action-btn.play-highlight:hover {
          background: var(--witmind-orange-hover);
          transform: scale(1.06);
        }

        /* System Info Card */
        .card-system {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
        }
        .system-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 6px;
        }
        .system-tile-col {
          background: rgba(25, 30, 35, 0.5);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-btn);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sys-tile-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .sys-tile-value {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        /* Bottom Navigation Dock */
        .wit-dock {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20, 24, 28, 0.85);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-pill);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 2000;
        }
        .dock-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dock-tab-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
        }
        .dock-tab-btn.active {
          background: var(--witmind-orange-soft);
          color: var(--witmind-orange);
          border: 1px solid var(--glass-border-warm);
        }

        /* Lights Sheet Modal */
        .sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.68);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.18s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sheet-panel-modal {
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
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .sheet-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sheet-headline {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
        }
        .sheet-close-icon {
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
        .sheet-close-icon:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.16);
        }

        .switch-tactile-row {
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
        .switch-tactile-row:hover {
          background: rgba(35, 42, 50, 0.75);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .switch-tactile-row.is-circuit-on {
          border-color: var(--glass-border-warm);
          background: rgba(242, 101, 34, 0.12);
        }

        .switch-info-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .circuit-bulb-icon {
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
        .is-circuit-on .circuit-bulb-icon {
          background: rgba(246, 182, 59, 0.2);
          color: var(--color-amber);
          box-shadow: 0 0 12px rgba(246, 182, 59, 0.3);
        }

        .switch-pill-track {
          width: 50px;
          height: 28px;
          border-radius: var(--radius-pill);
          background: rgba(255, 255, 255, 0.12);
          position: relative;
          transition: all 0.2s;
        }
        .switch-pill-track::after {
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
        .is-circuit-on .switch-pill-track {
          background: var(--witmind-orange);
          box-shadow: 0 0 12px var(--witmind-orange-glow);
        }
        .is-circuit-on .switch-pill-track::after {
          transform: translateX(22px);
        }

        /* Energy Detailed View */
        .energy-detailed-chart {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 150px;
          padding: 10px 0;
          border-bottom: 1px solid var(--glass-border);
        }
        .detailed-bar-col {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
        }
        .detailed-bar-fill {
          width: 100%;
          border-radius: 3px 3px 0 0;
          background: var(--witmind-orange);
          opacity: 0.85;
          transition: height 0.3s;
        }
        .detailed-bar-fill.is-peak {
          background: #ffffff;
          box-shadow: 0 0 10px #ffffff;
        }
        .detailed-bar-label {
          font-size: 9px;
          color: var(--text-muted);
        }
      </style>

      <!-- Ribbons de Iluminación Ambiental de Fondo -->
      <div class="ambient-light-ribbon-1"></div>
      <div class="ambient-light-ribbon-2"></div>

      ${
        this._isDev
          ? `
        <div class="dev-bar">
          <div><strong>MODO DEV</strong> — Witmind Architectural Glass</div>
          <div>
            <a href="/showroom-witmind.html">🏛️ Witmind Glass</a>
            <a href="/showroom-aero.html">💎 Aero Glass</a>
            <a href="/showroom-ios.html">📱 iOS Tablet</a>
            <a href="/showroom.html">🎛️ Lovelace HA</a>
          </div>
        </div>
      `
          : ""
      }

      <div class="app-layout">
        <!-- Header Arquitectónico -->
        <header class="wit-header">
          <!-- Left: Brand & Status Pills -->
          <div class="header-brand-group">
            <div class="brand-text-block">
              <span class="brand-title">WITMIND</span>
              <span class="brand-subtitle">SHOWROOM · WTX MDTC</span>
            </div>

            <div class="header-pills-row">
              <div class="status-pill hero-glow wit-tap" id="pillLights">
                <div class="pill-icon-circle amber">💡</div>
                <div class="pill-text-col">
                  <span class="pill-main-text">${totalActive} luces activas</span>
                  <span class="pill-sub-text">${powerWattsVal} W de carga</span>
                </div>
              </div>

              <div class="status-pill wit-tap" id="pillMedia">
                <div class="pill-icon-circle orange">♫</div>
                <div class="pill-text-col">
                  <span class="pill-main-text">${isPlaying ? "Ambient Lounge" : "Audio Pausado"}</span>
                  <span class="pill-sub-text">Witmind Studio</span>
                </div>
              </div>

              <div class="status-pill wit-tap" id="pillSystem">
                <div class="pill-icon-circle orange">◉</div>
                <div class="pill-text-col">
                  <span class="pill-main-text">Showroom activo</span>
                  <span class="pill-sub-text">${energyKwhVal} kWh hoy</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Clock & Battery -->
          <div class="header-clock-col">
            <div class="header-clock-num" id="witmindClock">${this._timeStr}</div>
            <div class="header-date-row">
              <span class="header-date-str" id="witmindDate">${this._dateStr}</span>
              <div class="battery-chip">
                <span>▣ Tablet ${batteryVal}%</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Showroom Hero Section -->
        <section class="wit-card showroom-hero-card">
          <div class="hero-info-block">
            <span class="hero-tagline">Showroom Witmind</span>
            <h1 class="hero-title">Iluminación que transforma espacios</h1>
            <p class="hero-sub">${totalActive} / ${ALL_CIRCUITS.length} luminarias activas • ${powerWattsVal} W en tiempo real</p>
          </div>

          <div class="hero-nav-pills">
            <button class="hero-nav-btn ${this._view === "home" ? "active" : ""}" id="navHome">Inicio</button>
            <button class="hero-nav-btn ${this._view === "lights" ? "active" : ""}" id="navLights">Luces</button>
            <button class="hero-nav-btn ${this._view === "energy" ? "active" : ""}" id="navEnergy">Energía</button>
            <button class="hero-nav-btn ${this._view === "scenes" ? "active" : ""}" id="navScenes">Escenas</button>
          </div>
        </section>

        <!-- Dynamic View Content -->
        ${
          this._view === "home"
            ? `
          <!-- HOME GRID -->
          <div class="wit-grid">
            <!-- Module 1: Lighting Card -->
            <div class="wit-card card-lighting wit-tap" id="cardLighting">
              <div class="card-top-line">
                <span class="card-title-badge">Iluminación</span>
                <div class="card-icon-warm">💡</div>
              </div>

              <div class="lighting-kpi-main">
                <div class="lighting-num-val">${totalActive} / ${ALL_CIRCUITS.length} encendidas</div>
                <div class="lighting-state-sub">${powerWattsVal} W de potencia estimada</div>
              </div>

              <div class="circuit-breakdown-row">
                <div class="breakdown-group">
                  <span>Spots: <strong>${spotsOn}/4</strong></span>
                  <span>Muestras: <strong>${samplesOn}/5</strong></span>
                  <span>Reflector: <strong>${reflectorOn}/1</strong></span>
                </div>
                <span style="color: var(--witmind-orange); font-weight: 600;">Abrir panel →</span>
              </div>
            </div>

            <!-- Module 2: Weather Card -->
            <div class="wit-card card-weather wit-tap" id="cardWeather">
              <div class="card-top-line">
                <span class="card-title-badge">Clima Showroom</span>
                <span style="color: var(--color-amber); font-size: 16px;">☀</span>
              </div>

              <div class="weather-hero-row">
                <div class="weather-temp-val">${weatherTemp}°</div>
                <div class="weather-status-label">${weatherState === "sunny" ? "Soleado" : weatherState}</div>
              </div>

              <div class="mini-forecast-strip">
                <div class="mini-fc-col"><span>Hoy</span><strong>24°</strong></div>
                <div class="mini-fc-col"><span>Mañana</span><strong>23°</strong></div>
                <div class="mini-fc-col"><span>Sábado</span><strong>25°</strong></div>
                <div class="mini-fc-col"><span>Domingo</span><strong>21°</strong></div>
              </div>
            </div>

            <!-- Module 3: Energy Card -->
            <div class="wit-card card-energy wit-tap" id="cardEnergy">
              <div class="card-top-line">
                <span class="card-title-badge">⚡ Energía</span>
                <span style="font-size: 11px; color: ${isHighPower ? "var(--color-amber)" : "var(--text-secondary)"};">
                  ${isHighPower ? "Consumo Elevado" : "Consumo Normal"}
                </span>
              </div>

              <div class="energy-val-block">
                <div class="energy-power-kpi">${powerWattsVal} W</div>
                <div class="energy-kwh-detail">${energyKwhVal} kWh acumulados</div>
              </div>

              ${this._renderArchitecturalBars(this._stats)}
            </div>

            <!-- Module 4: Scenes Card -->
            <div class="wit-card card-scenes">
              <div class="card-top-line">
                <span class="card-title-badge">Escenas de Iluminación</span>
              </div>

              <div class="scenes-2x2">
                <div class="scene-item-btn wit-tap" id="btnPres">
                  <span>✨</span>
                  <span style="font-size: 13px; font-weight: 600;">Presentación</span>
                </div>
                <div class="scene-item-btn wit-tap" id="btnMeet">
                  <span>👥</span>
                  <span style="font-size: 13px; font-weight: 600;">Reunión</span>
                </div>
                <div class="scene-item-btn wit-tap" id="btnAllOn">
                  <span style="color: var(--color-amber);">☀️</span>
                  <span style="font-size: 13px; font-weight: 600;">Encender todo</span>
                </div>
                <div class="scene-item-btn wit-tap" id="btnAllOff">
                  <span>🌙</span>
                  <span style="font-size: 13px; font-weight: 600;">Apagar todo</span>
                </div>
              </div>
            </div>

            <!-- Module 5: Media Card -->
            <div class="wit-card card-media">
              <div class="card-top-line">
                <span class="card-title-badge">Reproduciendo ahora</span>
                <span style="font-size: 11px; color: var(--text-secondary);">${mediaVolume}% Vol</span>
              </div>

              <div class="media-track-wrap">
                <div class="media-art-placeholder">♫</div>
                <div class="media-text-wrap">
                  <div class="media-title-val">${mediaTitle}</div>
                  <div class="media-artist-val">${mediaArtist}</div>
                </div>
              </div>

              <div class="media-controls-wrap">
                <div class="media-transport-btns">
                  <button class="media-action-btn" id="btnMediaPrev">◀</button>
                  <button class="media-action-btn play-highlight" id="btnMediaPlay">${isPlaying ? "❚❚" : "▶"}</button>
                  <button class="media-action-btn" id="btnMediaNext">▶</button>
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="media-action-btn" id="btnMediaVolDown" style="width: 34px; height: 34px;">−</button>
                  <button class="media-action-btn" id="btnMediaVolUp" style="width: 34px; height: 34px;">+</button>
                </div>
              </div>
            </div>

            <!-- Module 6: System Card -->
            <div class="wit-card card-system">
              <div class="card-top-line">
                <span class="card-title-badge">Sistema</span>
                <span style="font-size: 11px; color: var(--color-success); font-weight: 600;">● Conectado</span>
              </div>

              <div class="system-stat-grid">
                <div class="system-tile-col">
                  <span class="sys-tile-label">Tablet</span>
                  <span class="sys-tile-value">${batteryVal}%</span>
                </div>
                <div class="system-tile-col">
                  <span class="sys-tile-label">Home Assistant</span>
                  <span class="sys-tile-value">Mock HA</span>
                </div>
                <div class="system-tile-col">
                  <span class="sys-tile-label">Circuitos</span>
                  <span class="sys-tile-value">${ALL_CIRCUITS.length} Registrados</span>
                </div>
                <div class="system-tile-col">
                  <span class="sys-tile-label">Última sync</span>
                  <span class="sys-tile-value">${this._timeStr}</span>
                </div>
              </div>

              <button class="hero-nav-btn wit-tap" id="btnGoEnergy" style="width: 100%; margin-top: 10px; background: rgba(255,255,255,0.06);">
                Ver Analítica de Consumo →
              </button>
            </div>
          </div>
        `
            : this._view === "energy"
              ? `
          <!-- ENERGY VIEW -->
          <div class="wit-card" style="padding: 28px; display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2 style="font-size: 24px; font-weight: 700;">Analítica Energética</h2>
                <p style="font-size: 13px; color: var(--text-secondary);">Historial y perfiles de carga del Showroom</p>
              </div>
              <div class="hero-nav-pills">
                <button class="hero-nav-btn ${this._statsTimeframe === "day" ? "active" : ""}" id="btnTfDay">Hoy</button>
                <button class="hero-nav-btn ${this._statsTimeframe === "month" ? "active" : ""}" id="btnTfMonth">Mes</button>
                <button class="hero-nav-btn ${this._statsTimeframe === "year" ? "active" : ""}" id="btnTfYear">Año</button>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;">
              <div class="system-tile-col" style="padding: 16px;">
                <span class="sys-tile-label">Consumo Total</span>
                <span style="font-size: 24px; font-weight: 700; color: #ffffff;">${energyKwhVal} kWh</span>
              </div>
              <div class="system-tile-col" style="padding: 16px;">
                <span class="sys-tile-label">Potencia Media</span>
                <span style="font-size: 24px; font-weight: 700; color: #ffffff;">72.8 W</span>
              </div>
              <div class="system-tile-col" style="padding: 16px;">
                <span class="sys-tile-label">Pico Máximo</span>
                <span style="font-size: 24px; font-weight: 700; color: #ffffff;">1,395 W</span>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--witmind-orange);">Perfil Horario (00h — 23h)</span>
                <span style="font-size: 11px; color: var(--text-muted);">Valores simulados en Watts</span>
              </div>
              ${this._renderDetailedEnergyChart(this._stats)}
            </div>
          </div>
        `
              : this._view === "lights"
                ? `
          <!-- LIGHTS VIEW -->
          <div class="wit-card" style="padding: 28px; display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2 style="font-size: 24px; font-weight: 700;">Panel Completo de Iluminación</h2>
                <p style="font-size: 13px; color: var(--text-secondary);">${totalActive} de ${ALL_CIRCUITS.length} circuitos encendidos • ${powerWattsVal} W</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="hero-nav-btn" id="viewBtnAllOff" style="background: rgba(240, 90, 90, 0.2); color: var(--color-rose);">Apagar Todo</button>
                <button class="hero-nav-btn" id="viewBtnAllOn" style="background: var(--witmind-orange);">Encender Todo</button>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
              ${ALL_CIRCUITS.map((c) => {
                const isOn = this._value(c.id) === "on";
                return `
                  <div class="switch-tactile-row wit-tap ${isOn ? "is-circuit-on" : ""}" data-entity-id="${c.id}">
                    <div class="switch-info-left">
                      <div class="circuit-bulb-icon">💡</div>
                      <div>
                        <div style="font-size: 14px; font-weight: 600;">${c.name}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">${c.subtitle} • ${c.watts} W</div>
                      </div>
                    </div>
                    <div class="switch-pill-track"></div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `
                : `
          <!-- SCENES & PRESETS VIEW -->
          <div class="wit-card" style="padding: 28px; display: flex; flex-direction: column; gap: 16px;">
            <h2 style="font-size: 24px; font-weight: 700;">Escenas & Presets Showroom</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              <div class="scene-item-btn wit-tap" id="btnPres2" style="padding: 16px;">
                <span>✨</span>
                <div>
                  <div style="font-weight: 700;">Presentación</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Ventana + TV</div>
                </div>
              </div>
              <div class="scene-item-btn wit-tap" id="btnMeet2" style="padding: 16px;">
                <span>👥</span>
                <div>
                  <div style="font-weight: 700;">Reunión</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">2x3 + Ventana</div>
                </div>
              </div>
              <div class="scene-item-btn wit-tap" id="btnAllOn2" style="padding: 16px;">
                <span style="color: var(--color-amber);">☀️</span>
                <div>
                  <div style="font-weight: 700;">Encendido General</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Todos los circuitos</div>
                </div>
              </div>
            </div>
          </div>
        `
        }

        <!-- Bottom Navigation Dock -->
        <nav class="wit-dock">
          <button class="dock-tab-btn ${this._view === "home" ? "active" : ""}" id="dockHome">
            <span>Inicio</span>
          </button>
          <button class="dock-tab-btn ${this._view === "lights" ? "active" : ""}" id="dockLights">
            <span>Luces (${totalActive})</span>
          </button>
          <button class="dock-tab-btn ${this._view === "energy" ? "active" : ""}" id="dockEnergy">
            <span>Energía (${powerWattsVal}W)</span>
          </button>
          <button class="dock-tab-btn ${this._view === "scenes" ? "active" : ""}" id="dockScenes">
            <span>Escenas</span>
          </button>
        </nav>

        <!-- Lights Sheet Modal (Smoked Glass) -->
        ${
          this._sheet === "lights"
            ? `
          <div class="sheet-overlay" id="sheetOverlay">
            <div class="sheet-panel-modal">
              <div class="sheet-title-row">
                <div>
                  <h2 class="sheet-headline">Control de Luminarias</h2>
                  <p style="font-size: 13px; color: var(--text-secondary);">${totalActive} de ${ALL_CIRCUITS.length} encendidas • ${powerWattsVal} W</p>
                </div>
                <div class="sheet-close-icon" id="sheetCloseBtn">✕</div>
              </div>

              <!-- Spots Section -->
              <div>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--witmind-orange); letter-spacing: 0.08em;">Circuitos Spots</span>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                  ${SPOTS.map((s) => {
                    const isOn = this._value(s.id) === "on";
                    return `
                      <div class="switch-tactile-row wit-tap ${isOn ? "is-circuit-on" : ""}" data-entity-id="${s.id}">
                        <div class="switch-info-left">
                          <div class="circuit-bulb-icon">💡</div>
                          <div>
                            <div style="font-size: 14px; font-weight: 600;">${s.name}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">${s.subtitle} • ${s.watts} W</div>
                          </div>
                        </div>
                        <div class="switch-pill-track"></div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>

              <!-- Samples Section -->
              <div>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--witmind-orange); letter-spacing: 0.08em;">Muestrarios & Paneles</span>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                  ${SAMPLES.map((s) => {
                    const isOn = this._value(s.id) === "on";
                    return `
                      <div class="switch-tactile-row wit-tap ${isOn ? "is-circuit-on" : ""}" data-entity-id="${s.id}">
                        <div class="switch-info-left">
                          <div class="circuit-bulb-icon">💡</div>
                          <div>
                            <div style="font-size: 14px; font-weight: 600;">${s.name}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">${s.subtitle} • ${s.watts} W</div>
                          </div>
                        </div>
                        <div class="switch-pill-track"></div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>

              <!-- Reflector Section -->
              <div>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--witmind-orange); letter-spacing: 0.08em;">Exterior</span>
                <div style="margin-top: 6px;">
                  <div class="switch-tactile-row wit-tap ${this._value(REFLECTOR.id) === "on" ? "is-circuit-on" : ""}" data-entity-id="${REFLECTOR.id}">
                    <div class="switch-info-left">
                      <div class="circuit-bulb-icon">💡</div>
                      <div>
                        <div style="font-size: 14px; font-weight: 600;">${REFLECTOR.name}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">${REFLECTOR.subtitle}</div>
                      </div>
                    </div>
                    <div class="switch-pill-track"></div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="hero-nav-btn" id="modalBtnAllOff" style="flex: 1; background: rgba(240, 90, 90, 0.2); color: var(--color-rose);">
                  🌙 Apagar Todo
                </button>
                <button class="hero-nav-btn" id="modalBtnAllOn" style="flex: 1; background: var(--witmind-orange);">
                  ☀️ Encender Todo
                </button>
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    // Header Pills
    root.querySelector("#pillLights")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#pillMedia")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#pillSystem")?.addEventListener("click", () => this._setView("energy"));

    // Nav Buttons
    root.querySelector("#navHome")?.addEventListener("click", () => this._setView("home"));
    root.querySelector("#navLights")?.addEventListener("click", () => this._setView("lights"));
    root.querySelector("#navEnergy")?.addEventListener("click", () => this._setView("energy"));
    root.querySelector("#navScenes")?.addEventListener("click", () => this._setView("scenes"));

    // Dock Tabs
    root.querySelector("#dockHome")?.addEventListener("click", () => this._setView("home"));
    root.querySelector("#dockLights")?.addEventListener("click", () => this._setView("lights"));
    root.querySelector("#dockEnergy")?.addEventListener("click", () => this._setView("energy"));
    root.querySelector("#dockScenes")?.addEventListener("click", () => this._setView("scenes"));

    // Home Card Taps
    root.querySelector("#cardLighting")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#cardWeather")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#cardEnergy")?.addEventListener("click", () => this._setView("energy"));
    root.querySelector("#btnGoEnergy")?.addEventListener("click", () => this._setView("energy"));

    // Escenas
    root.querySelector("#btnPres")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.presentation });
    });
    root.querySelector("#btnPres2")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.presentation });
    });
    root.querySelector("#btnMeet")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.meeting });
    });
    root.querySelector("#btnMeet2")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.meeting });
    });
    root.querySelector("#btnAllOn")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });
    root.querySelector("#btnAllOn2")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });
    root.querySelector("#btnAllOff")?.addEventListener("click", () => {
      this._callService("script", "showroom_apagado_general", { entity_id: ENTITIES.allOff });
    });

    // Media
    root.querySelector("#btnMediaPlay")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnMediaPrev")?.addEventListener("click", () => {
      this._callService("media_player", "media_previous_track", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnMediaNext")?.addEventListener("click", () => {
      this._callService("media_player", "media_next_track", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnMediaVolDown")?.addEventListener("click", () => {
      this._callService("media_player", "volume_down", { entity_id: ENTITIES.media });
    });
    root.querySelector("#btnMediaVolUp")?.addEventListener("click", () => {
      this._callService("media_player", "volume_up", { entity_id: ENTITIES.media });
    });

    // Timeframe filters
    root.querySelector("#btnTfDay")?.addEventListener("click", () => {
      this._statsTimeframe = "day";
      this.render();
    });
    root.querySelector("#btnTfMonth")?.addEventListener("click", () => {
      this._statsTimeframe = "month";
      this.render();
    });
    root.querySelector("#btnTfYear")?.addEventListener("click", () => {
      this._statsTimeframe = "year";
      this.render();
    });

    // Switch Toggles
    root.querySelectorAll(".switch-tactile-row").forEach((row) => {
      row.addEventListener("click", () => {
        const entityId = row.getAttribute("data-entity-id");
        if (entityId) {
          this._toggleSwitch(entityId);
        }
      });
    });

    // Modal Sheet Handlers
    root.querySelector("#sheetCloseBtn")?.addEventListener("click", () => this._closeSheet());
    root.querySelector("#sheetOverlay")?.addEventListener("click", (e) => {
      if (e.target.id === "sheetOverlay") {
        this._closeSheet();
      }
    });

    root.querySelector("#modalBtnAllOff")?.addEventListener("click", () => {
      this._callService("script", "showroom_apagado_general", { entity_id: ENTITIES.allOff });
    });
    root.querySelector("#modalBtnAllOn")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });
    root.querySelector("#viewBtnAllOff")?.addEventListener("click", () => {
      this._callService("script", "showroom_apagado_general", { entity_id: ENTITIES.allOff });
    });
    root.querySelector("#viewBtnAllOn")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });
  }
}

customElements.define("showroom-witmind", ShowroomWitmind);
