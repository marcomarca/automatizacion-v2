/**
 * Showroom Aero Transparente — Native Web Component para Tablet
 *
 * Windows Aero / Glassmorphism + iOS Spatial Dashboard + Home Assistant
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
  { id: "switch.interruptor_inteligente_switch_1", name: "Spots ventana", watts: 100 },
  { id: "switch.interruptor_inteligente_switch_2", name: "Spots 2×3", watts: 120 },
  { id: "switch.interruptor_inteligente_switch_3", name: "Spots 3×3", watts: 180 },
  { id: "switch.interruptor_inteligente_switch_4", name: "Spots TV", watts: 25 }
];

const SAMPLES = [
  { id: "switch.interruptor_inteligente_2_switch_1", name: "Paneles 3k/6k", watts: 96 },
  { id: "switch.interruptor_inteligente_2_switch_2", name: "Colgantes", watts: 10 },
  { id: "switch.interruptor_inteligente_2_switch_3", name: "Slims", watts: 432 },
  { id: "switch.interruptor_inteligente_2_switch_4", name: "Downlights", watts: 144 },
  { id: "switch.smart_relay_switch_4_switch", name: "Paneles (Relé)", watts: 288 }
];

const ALL_LIGHTS = [...SPOTS, ...SAMPLES];

class ShowroomAero extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._view = "home"; // "home" | "energy"
    this._sheet = null; // null | "lights" | "weather"
    this._page = 0; // 0: Operación (Home), 1: Info/Diagnósticos
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
    // Reloj ligero que actualiza solo los nodos de texto en el DOM
    this._timeInterval = setInterval(() => {
      this._timeStr = this._getCurrentTimeString();
      this._dateStr = this._getCurrentDateString();
      const clockEl = this.shadowRoot?.querySelector("#aeroHeaderClock");
      if (clockEl) clockEl.textContent = this._timeStr;
      const dateEl = this.shadowRoot?.querySelector("#aeroHeaderDate");
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

  _setPage(pageNum) {
    this._page = pageNum;
    this._sheet = null;
    const pagesEl = this.shadowRoot?.querySelector("#aeroPagesContainer");
    if (pagesEl) {
      const targetPage = this.shadowRoot?.querySelectorAll(".aero-page")?.[pageNum];
      if (targetPage) {
        targetPage.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      }
    }
    this.render();
  }

  _renderSparkline(stats) {
    if (!stats || stats.length === 0) {
      return `
        <svg class="sparkline-svg" viewBox="0 0 200 40" preserveAspectRatio="none">
          <path d="M 0 35 Q 50 15, 100 25 T 200 10" fill="none" stroke="rgba(64, 232, 255, 0.7)" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M 0 35 Q 50 15, 100 25 T 200 10 L 200 40 L 0 40 Z" fill="url(#sparklineGrad)" opacity="0.25"/>
          <defs>
            <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#40e8ff" />
              <stop offset="100%" stop-color="#238cff" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    const values = stats.map((s) => s.mean || (s.change ? s.change * 1000 : 0));
    const max = Math.max(...values, 50);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const width = 200;
    const height = 40;

    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1 || 1)) * width;
      const y = height - 4 - ((val - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathData = `M ${points.join(" L ")}`;
    const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

    return `
      <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#40e8ff" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#238cff" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <path d="${areaData}" fill="url(#sparkGrad)"/>
        <path d="${pathData}" fill="none" stroke="#40e8ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  _renderHourlyBarChart(stats) {
    if (!stats || stats.length === 0) {
      return `<div style="text-align: center; color: rgba(255,255,255,0.4); padding: 20px;">Cargando telemetría...</div>`;
    }

    const maxMean = Math.max(...stats.map((s) => s.mean || (s.change ? s.change * 1000 : 0)), 100);

    return `
      <div class="hourly-bars-track">
        ${stats
          .map((s, idx) => {
            const w = s.mean || (s.change ? s.change * 1000 : 0);
            const heightPercent = Math.max(8, Math.min(100, (w / maxMean) * 100));
            const hourLabel = `${idx}h`;
            const isPeak = w > maxMean * 0.75;
            return `
              <div class="hourly-bar-col" title="${hourLabel}: ${w.toFixed(1)} W">
                <div class="bar-fill ${isPeak ? "is-peak" : ""}" style="height: ${heightPercent}%;"></div>
                <span class="bar-label">${idx % 4 === 0 ? hourLabel : ""}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  render() {
    // Entidades principales
    const lightCountVal = this._value(ENTITIES.lightCount, "0");
    const powerWattsVal = this._value(ENTITIES.power, "0");
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

    // Contadores de grupos
    const spotsOn = SPOTS.filter((s) => this._value(s.id) === "on").length;
    const samplesOn = SAMPLES.filter((s) => this._value(s.id) === "on").length;

    // Mini visualización de luces en fila: ○ ● ● ○ ●
    const lightDotsHtml = ALL_LIGHTS.slice(0, 7)
      .map((l) => {
        const isOn = this._value(l.id) === "on";
        return `<span class="light-dot ${isOn ? "is-on" : ""}"></span>`;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          /* Paleta y variables base */
          --bg0: #020817;
          --bg1: #031b46;
          --blue: #238cff;
          --cyan: #40e8ff;
          --aqua: #31e0c5;
          --accent-orange: #f26522;

          /* Tokens Glass Aero Transparentes */
          --glass-bg: rgba(45, 105, 175, .28);
          --glass-bg-strong: rgba(25, 67, 126, .48);
          --glass-border: rgba(185, 226, 255, .52);
          --glass-highlight: rgba(255, 255, 255, .35);
          --glass-shadow: rgba(0, 13, 55, .42);

          /* Tokens de color funcional */
          --color-yellow: #fde047;
          --color-cyan: #38bdf8;
          --color-purple: #c084fc;
          --color-emerald: #34d399;
          --color-rose: #fb7185;

          /* Radios de curvatura */
          --radius-card: 28px;
          --radius-card-sm: 22px;
          --radius-btn: 18px;
          --radius-pill: 999px;
          --radius-sheet: 32px;

          /* Espaciado */
          --space-1: 6px;
          --space-2: 10px;
          --space-3: 14px;
          --space-4: 18px;
          --space-5: 24px;
          --space-6: 32px;

          display: block;
          width: 100%;
          min-height: 100dvh;
          box-sizing: border-box;
          user-select: none;
          -webkit-user-select: none;
          overflow-x: hidden;

          /* Tipografía */
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
          color: rgba(255, 255, 255, 0.96);

          /* Fondo Abstracto Aero Dinámico */
          background:
            radial-gradient(
              900px 700px at 78% 60%,
              rgba(33, 224, 201, .40),
              transparent 60%
            ),
            radial-gradient(
              800px 700px at 58% 12%,
              rgba(38, 103, 255, .46),
              transparent 58%
            ),
            radial-gradient(
              600px 500px at 15% 85%,
              rgba(64, 232, 255, .25),
              transparent 50%
            ),
            linear-gradient(
              145deg,
              var(--bg0),
              var(--bg1)
            );
          position: relative;
        }

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Pseudo-elementos difuminados para simular cintas luminosas Aero */
        .aero-aurora-ribbon {
          position: fixed;
          top: -10%;
          right: -5%;
          width: 65vw;
          height: 55vh;
          background: radial-gradient(ellipse at center, rgba(64, 232, 255, 0.18), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        .aero-aurora-ribbon-bottom {
          position: fixed;
          bottom: -10%;
          left: -5%;
          width: 50vw;
          height: 45vh;
          background: radial-gradient(ellipse at center, rgba(49, 224, 197, 0.15), transparent 70%);
          filter: blur(50px);
          pointer-events: none;
          z-index: 0;
        }

        /* Barra Dev Superior (Solo si ?dev está presente) */
        .dev-bar {
          background: rgba(2, 8, 23, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          padding: 6px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          position: sticky;
          top: 0;
          z-index: 9000;
        }
        .dev-bar a {
          color: var(--cyan);
          text-decoration: none;
          font-weight: 600;
          margin-left: 10px;
        }
        .dev-bar a:hover { text-decoration: underline; }

        /* Contenedor Principal Dashboard */
        .dashboard-container {
          position: relative;
          z-index: 1;
          max-width: 1440px;
          margin: 0 auto;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding:
            max(20px, env(safe-area-inset-top))
            max(30px, env(safe-area-inset-right))
            max(96px, env(safe-area-inset-bottom))
            max(30px, env(safe-area-inset-left));
          gap: clamp(14px, 1.4vw, 22px);
        }

        /* Glass Aero Base Card */
        .aero-card {
          position: relative;
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, .16),
              rgba(255, 255, 255, .025)
            ),
            var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-card);
          backdrop-filter: blur(26px) saturate(155%);
          -webkit-backdrop-filter: blur(26px) saturate(155%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, .36),
            inset 0 -1px 0 rgba(110, 190, 255, .12),
            0 18px 48px var(--glass-shadow),
            0 0 26px rgba(65, 155, 255, .12);
          transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), border-color 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }

        .aero-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, .17),
              transparent 34%
            );
        }

        .aero-card:hover {
          border-color: rgba(220, 245, 255, 0.75);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, .45),
            inset 0 -1px 0 rgba(110, 190, 255, .2),
            0 22px 54px rgba(0, 13, 55, .55),
            0 0 32px rgba(65, 155, 255, .22);
          transform: translateY(-1px);
        }

        .aero-tap:active {
          transform: scale(0.985) translateY(0);
          transition-duration: 120ms;
        }

        /* Aero Highlight Activo */
        .is-active, .aero-btn.active {
          background:
            linear-gradient(
              145deg,
              rgba(110, 210, 255, .40),
              rgba(30, 100, 255, .27)
            ) !important;
          border-color: rgba(170, 235, 255, .82) !important;
          box-shadow:
            inset 0 1px rgba(255, 255, 255, .52),
            0 0 20px rgba(45, 165, 255, .32) !important;
        }

        /* Header Flotante Aero */
        .aero-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0 12px 0;
          gap: 16px;
        }

        .header-left-status {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 52px;
          padding: 0 18px;
          border-radius: var(--radius-pill);
          background: rgba(10, 32, 68, 0.65);
          border: 1px solid rgba(185, 226, 255, 0.4);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 8px 24px rgba(0, 10, 40, 0.3);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
        }

        .status-pill:hover {
          background: rgba(18, 48, 98, 0.75);
          border-color: var(--cyan);
          transform: translateY(-1px);
        }

        .pill-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .pill-icon-circle.yellow {
          background: rgba(253, 224, 71, 0.2);
          color: var(--color-yellow);
          box-shadow: 0 0 12px rgba(253, 224, 71, 0.35);
        }
        .pill-icon-circle.cyan {
          background: rgba(56, 189, 248, 0.2);
          color: var(--color-cyan);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
        }
        .pill-icon-circle.purple {
          background: rgba(192, 132, 252, 0.2);
          color: var(--color-purple);
          box-shadow: 0 0 12px rgba(192, 132, 252, 0.35);
        }
        .pill-icon-circle.orange {
          background: rgba(242, 101, 34, 0.2);
          color: var(--accent-orange);
          box-shadow: 0 0 12px rgba(242, 101, 34, 0.35);
        }

        .pill-text-block {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }
        .pill-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
        }
        .pill-sub {
          font-size: 11px;
          font-weight: 500;
          color: rgba(185, 226, 255, 0.75);
        }

        .header-right-clock {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          line-height: 1;
        }

        .clock-time {
          font-size: clamp(46px, 5vw, 72px);
          font-weight: 300;
          letter-spacing: -0.04em;
          color: #ffffff;
          text-shadow: 0 2px 20px rgba(64, 232, 255, 0.3);
          font-variant-numeric: tabular-nums;
        }

        .clock-date-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }

        .clock-date {
          font-size: 14px;
          font-weight: 500;
          color: rgba(215, 240, 255, 0.85);
          letter-spacing: -0.01em;
        }

        .battery-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
          background: rgba(10, 32, 68, 0.55);
          border: 1px solid rgba(185, 226, 255, 0.35);
          font-size: 12px;
          font-weight: 600;
          color: ${isBatteryLow ? "var(--color-rose)" : "rgba(255, 255, 255, 0.85)"};
        }

        /* Contenedor de Páginas Horizontales */
        .pages-track {
          display: flex;
          width: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          gap: 32px;
        }
        .pages-track::-webkit-scrollbar { display: none; }

        .aero-page {
          flex: 0 0 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        /* Grid Principal Home (3 Columnas en Tablet Landscape) */
        .home-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 1.4vw, 22px);
        }

        @media (max-width: 1020px) {
          .home-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 680px) {
          .home-grid { grid-template-columns: 1fr; }
        }

        /* Tarjeta Lighting */
        .card-lighting {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 210px;
          cursor: pointer;
        }
        .card-header-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--cyan);
        }
        .card-icon-halo {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: rgba(253, 224, 71, 0.15);
          color: var(--color-yellow);
          border: 1px solid rgba(253, 224, 71, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 18px rgba(253, 224, 71, 0.25);
        }

        .lighting-main-stat {
          margin: 14px 0 8px 0;
        }
        .lighting-count {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .lighting-power {
          font-size: 15px;
          font-weight: 500;
          color: rgba(185, 226, 255, 0.85);
          margin-top: 2px;
        }

        .lighting-breakdown-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid rgba(185, 226, 255, 0.15);
        }
        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(215, 240, 255, 0.75);
        }
        .breakdown-val {
          font-weight: 700;
          color: #ffffff;
        }

        .light-dots-strip {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .light-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.2s;
        }
        .light-dot.is-on {
          background: var(--color-yellow);
          box-shadow: 0 0 8px var(--color-yellow);
        }

        /* Tarjeta Weather */
        .card-weather {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 210px;
          cursor: pointer;
        }
        .weather-hero-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-top: 10px;
        }
        .weather-temp {
          font-size: 42px;
          font-weight: 300;
          letter-spacing: -0.03em;
          color: #ffffff;
        }
        .weather-condition-label {
          font-size: 18px;
          font-weight: 600;
          color: rgba(215, 240, 255, 0.9);
        }
        .weather-meta-row {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: rgba(185, 226, 255, 0.8);
          padding-top: 10px;
          border-top: 1px solid rgba(185, 226, 255, 0.15);
        }

        /* Tarjeta Energy */
        .card-energy {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 210px;
          cursor: pointer;
        }
        .energy-stat-block {
          margin: 8px 0;
        }
        .energy-power-num {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .energy-kwh-sub {
          font-size: 14px;
          font-weight: 500;
          color: rgba(185, 226, 255, 0.85);
          margin-top: 2px;
        }
        .sparkline-svg {
          width: 100%;
          height: 44px;
          overflow: visible;
          margin-top: 8px;
        }

        /* Tarjeta Scenes */
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
          background: rgba(15, 45, 90, 0.45);
          border: 1px solid rgba(185, 226, 255, 0.35);
          border-radius: var(--radius-btn);
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.2, 0, 0, 1);
          color: #ffffff;
          min-height: 48px;
        }
        .scene-tile:hover {
          background: rgba(30, 80, 150, 0.6);
          border-color: var(--cyan);
          transform: translateY(-1px);
        }
        .scene-tile:active {
          transform: scale(0.97);
        }
        .scene-tile.danger-off {
          border-color: rgba(251, 113, 133, 0.4);
          background: rgba(70, 15, 30, 0.4);
        }
        .scene-tile.danger-off:hover {
          background: rgba(110, 25, 45, 0.6);
          border-color: var(--color-rose);
        }
        .scene-icon-wrap {
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .scene-name-label {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Tarjeta Media */
        .card-media {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 210px;
        }
        .media-info-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 6px;
        }
        .media-title-text {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .media-artist-text {
          font-size: 13px;
          font-weight: 500;
          color: rgba(185, 226, 255, 0.75);
        }
        .media-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid rgba(185, 226, 255, 0.15);
        }
        .media-btns-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .media-ctrl-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(15, 45, 90, 0.5);
          border: 1px solid rgba(185, 226, 255, 0.35);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .media-ctrl-btn:hover {
          background: rgba(35, 95, 180, 0.7);
          border-color: var(--cyan);
          transform: scale(1.05);
        }
        .media-ctrl-btn.play-btn {
          background: var(--cyan);
          color: #020817;
          border: none;
          box-shadow: 0 0 16px rgba(64, 232, 255, 0.4);
        }
        .media-ctrl-btn.play-btn:hover {
          background: #ffffff;
          transform: scale(1.08);
        }
        .volume-controls {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(185, 226, 255, 0.85);
        }
        .vol-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(15, 45, 90, 0.4);
          border: 1px solid rgba(185, 226, 255, 0.3);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
        }
        .vol-btn:hover {
          background: rgba(35, 95, 180, 0.6);
        }

        /* Tarjeta Quick System / Quick Actions */
        .card-system {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 210px;
        }
        .system-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 8px;
        }
        .sys-tile {
          background: rgba(15, 45, 90, 0.4);
          border: 1px solid rgba(185, 226, 255, 0.25);
          border-radius: var(--radius-btn);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sys-label {
          font-size: 11px;
          color: rgba(185, 226, 255, 0.7);
          font-weight: 500;
        }
        .sys-val {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        /* Página 2: Detalle de Energía & Pronóstico Extendido */
        .page2-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: clamp(14px, 1.4vw, 22px);
        }
        @media (max-width: 900px) {
          .page2-grid { grid-template-columns: 1fr; }
        }

        .card-energy-expanded {
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .timeframe-filter-bar {
          display: flex;
          gap: 8px;
          background: rgba(10, 30, 65, 0.5);
          padding: 4px;
          border-radius: var(--radius-pill);
          border: 1px solid rgba(185, 226, 255, 0.3);
          width: fit-content;
        }
        .tf-btn {
          background: transparent;
          border: none;
          color: rgba(185, 226, 255, 0.75);
          padding: 6px 16px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tf-btn.active {
          background: var(--cyan);
          color: #020817;
          font-weight: 700;
          box-shadow: 0 0 12px rgba(64, 232, 255, 0.3);
        }

        .energy-kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .kpi-card {
          background: rgba(15, 45, 90, 0.35);
          border: 1px solid rgba(185, 226, 255, 0.25);
          border-radius: var(--radius-btn);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .kpi-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(185, 226, 255, 0.7);
        }
        .kpi-num {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
        }

        .hourly-bars-track {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 140px;
          padding: 10px 0 4px 0;
          border-bottom: 1px solid rgba(185, 226, 255, 0.2);
        }
        .hourly-bar-col {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
        }
        .bar-fill {
          width: 100%;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, var(--cyan), rgba(35, 140, 255, 0.4));
          transition: height 0.3s ease;
        }
        .bar-fill.is-peak {
          background: linear-gradient(180deg, var(--color-yellow), var(--accent-orange));
          box-shadow: 0 0 10px rgba(253, 224, 71, 0.4);
        }
        .bar-label {
          font-size: 9px;
          color: rgba(185, 226, 255, 0.6);
          font-variant-numeric: tabular-nums;
        }

        .forecast-week-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .forecast-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 45, 90, 0.35);
          border: 1px solid rgba(185, 226, 255, 0.2);
          border-radius: var(--radius-btn);
          padding: 12px 16px;
        }

        /* Translucent Aero Bottom Dock */
        .aero-dock {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 30, 65, 0.78);
          border: 1px solid rgba(185, 226, 255, 0.55);
          border-radius: var(--radius-pill);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 14px 40px rgba(0, 10, 45, 0.6),
            0 0 24px rgba(65, 155, 255, 0.18);
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 2000;
        }

        .dock-capsule {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.2, 0, 0, 1);
        }
        .dock-capsule:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: var(--cyan);
          transform: translateY(-1px);
        }
        .dock-capsule.active {
          background: var(--cyan);
          color: #020817;
          font-weight: 700;
        }

        .dock-dots-group {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 8px;
        }
        .page-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        .page-indicator-dot.active {
          width: 20px;
          border-radius: var(--radius-pill);
          background: var(--cyan);
          box-shadow: 0 0 10px var(--cyan);
        }

        /* Lights Sheet & Modals Aero Style */
        .sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 5, 18, 0.68);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .aero-sheet-modal {
          background:
            linear-gradient(160deg, rgba(30, 80, 150, 0.55), rgba(8, 25, 60, 0.85)),
            rgba(10, 30, 70, 0.9);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sheet);
          width: min(620px, calc(100vw - 40px));
          max-height: 84dvh;
          overflow-y: auto;
          padding: 28px 26px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 24px 64px rgba(0, 8, 35, 0.8),
            0 0 36px rgba(65, 155, 255, 0.25);
          animation: scaleUp 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        @keyframes scaleUp {
          from { transform: scale(0.94); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .sheet-header-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sheet-title-text {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .sheet-close-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.85);
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sheet-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .sheet-section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--cyan);
          margin-top: 4px;
        }

        .switch-tactile-row {
          height: 68px;
          padding: 0 18px;
          background: rgba(15, 45, 95, 0.45);
          border: 1px solid rgba(185, 226, 255, 0.25);
          border-radius: var(--radius-btn);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s;
        }
        .switch-tactile-row:hover {
          background: rgba(30, 80, 155, 0.6);
          border-color: rgba(185, 226, 255, 0.6);
        }
        .switch-tactile-row.is-active-light {
          border-color: rgba(170, 235, 255, 0.8);
          background:
            linear-gradient(145deg, rgba(110, 210, 255, 0.25), rgba(30, 100, 255, 0.15)),
            rgba(20, 60, 120, 0.5);
        }

        .switch-left-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .switch-icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(185, 226, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .is-active-light .switch-icon-circle {
          background: rgba(253, 224, 71, 0.2);
          color: var(--color-yellow);
          box-shadow: 0 0 14px rgba(253, 224, 71, 0.4);
        }

        .switch-name-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .switch-circuit-name {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }
        .switch-circuit-meta {
          font-size: 12px;
          color: rgba(185, 226, 255, 0.7);
        }

        /* Toggle Aero Pill Switch */
        .aero-toggle-pill {
          width: 52px;
          height: 30px;
          border-radius: var(--radius-pill);
          background: rgba(10, 30, 60, 0.7);
          border: 1px solid rgba(185, 226, 255, 0.4);
          position: relative;
          transition: all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        .aero-toggle-pill::after {
          content: "";
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          top: 3px;
          left: 3px;
          transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }
        .is-active-light .aero-toggle-pill {
          background: linear-gradient(135deg, var(--cyan), var(--blue));
          border-color: #ffffff;
          box-shadow: 0 0 14px rgba(64, 232, 255, 0.5);
        }
        .is-active-light .aero-toggle-pill::after {
          transform: translateX(22px);
        }

        .sheet-actions-row {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }
        .sheet-action-btn {
          flex: 1;
          height: 48px;
          border-radius: var(--radius-btn);
          border: 1px solid rgba(185, 226, 255, 0.4);
          background: rgba(15, 45, 95, 0.6);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .sheet-action-btn:hover {
          background: rgba(30, 80, 155, 0.8);
          border-color: var(--cyan);
        }
        .sheet-action-btn.danger {
          border-color: rgba(251, 113, 133, 0.4);
          color: var(--color-rose);
        }
        .sheet-action-btn.danger:hover {
          background: rgba(110, 25, 45, 0.6);
        }
      </style>

      <!-- Ribbons luminosos Aero decorativos -->
      <div class="aero-aurora-ribbon"></div>
      <div class="aero-aurora-ribbon-bottom"></div>

      ${
        this._isDev
          ? `
        <div class="dev-bar">
          <div><strong>MODO DEV</strong> — Showroom Aero Transparente</div>
          <div>
            <a href="/showroom-aero.html">💎 Aero Glass</a>
            <a href="/showroom-ios.html">📱 iOS Tablet</a>
            <a href="/showroom.html">🎛️ Lovelace HA</a>
            <a href="/dashboard-bms.html">🌌 BMS Dark</a>
            <a href="/dashboard-matrix.html">📟 Matrix SCADA</a>
            <a href="/dashboard-exec.html">☀️ Exec Light</a>
          </div>
        </div>
      `
          : ""
      }

      <div class="dashboard-container">
        <!-- Header Flotante Aero -->
        <header class="aero-header">
          <!-- Left: Status Pills -->
          <div class="header-left-status">
            <div class="status-pill aero-tap" id="pillLightsBtn">
              <div class="pill-icon-circle yellow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                  <path d="M9 18h6"></path>
                  <path d="M10 22h4"></path>
                </svg>
              </div>
              <div class="pill-text-block">
                <span class="pill-label">${lightCountVal} Luces On</span>
                <span class="pill-sub">${powerWattsVal} W</span>
              </div>
            </div>

            <div class="status-pill aero-tap" id="pillMediaBtn">
              <div class="pill-icon-circle purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
              </div>
              <div class="pill-text-block">
                <span class="pill-label">${isPlaying ? "Música Activa" : "Música Pausada"}</span>
                <span class="pill-sub">Ambient Lounge</span>
              </div>
            </div>

            <div class="status-pill aero-tap" id="pillEnergyBtn">
              <div class="pill-icon-circle cyan">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div class="pill-text-block">
                <span class="pill-label">Showroom Activo</span>
                <span class="pill-sub">${energyKwhVal} kWh</span>
              </div>
            </div>
          </div>

          <!-- Right: Dominant Time & Status -->
          <div class="header-right-clock">
            <div class="clock-time" id="aeroHeaderClock">${this._timeStr}</div>
            <div class="clock-date-row">
              <span class="clock-date" id="aeroHeaderDate">${this._dateStr}</span>
              <div class="battery-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                  <line x1="22" y1="11" x2="22" y2="13"></line>
                </svg>
                <span>${batteryVal}%</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Horizontal Snap Pages Container -->
        <div class="pages-track" id="aeroPagesContainer">
          <!-- PAGE 1: Operación / HOME -->
          <div class="aero-page">
            <div class="home-grid">
              <!-- Module 1: Lighting Summary -->
              <div class="aero-card card-lighting aero-tap" id="homeLightingCard">
                <div class="card-header-line">
                  <span class="card-header-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Iluminación
                  </span>
                  <div class="card-icon-halo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                      <path d="M9 18h6"></path>
                      <path d="M10 22h4"></path>
                    </svg>
                  </div>
                </div>

                <div class="lighting-main-stat">
                  <div class="lighting-count">${lightCountVal} luces on</div>
                  <div class="lighting-power">${powerWattsVal} W de carga estimada</div>
                </div>

                <div class="lighting-breakdown-row">
                  <div class="breakdown-item">
                    <span>Spots:</span>
                    <span class="breakdown-val">${spotsOn}</span>
                    <span style="margin-left: 8px;">Samples:</span>
                    <span class="breakdown-val">${samplesOn}</span>
                  </div>
                  <div class="light-dots-strip">
                    ${lightDotsHtml}
                  </div>
                </div>
              </div>

              <!-- Module 2: Weather Card -->
              <div class="aero-card card-weather aero-tap" id="homeWeatherCard">
                <div class="card-header-line">
                  <span class="card-header-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="5"></circle>
                    </svg>
                    Clima Showroom
                  </span>
                  <div class="card-icon-halo" style="background: rgba(56, 189, 248, 0.15); color: var(--color-cyan); border-color: rgba(56, 189, 248, 0.3);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  </div>
                </div>

                <div class="weather-hero-row">
                  <div class="weather-temp">${weatherTemp}°</div>
                  <div class="weather-condition-label">${weatherState === "sunny" ? "Soleado" : weatherState}</div>
                </div>

                <div class="weather-meta-row">
                  <div>Humedad: <strong>${weatherHumidity}%</strong></div>
                  <div>Viento: <strong>${weatherWind} km/h</strong></div>
                </div>
              </div>

              <!-- Module 3: Energy Summary -->
              <div class="aero-card card-energy aero-tap" id="homeEnergyCard">
                <div class="card-header-line">
                  <span class="card-header-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Energía & Potencia
                  </span>
                  <div class="card-icon-halo" style="background: rgba(49, 224, 197, 0.15); color: var(--aqua); border-color: rgba(49, 224, 197, 0.3);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                </div>

                <div class="energy-stat-block">
                  <div class="energy-power-num">${powerWattsVal} W</div>
                  <div class="energy-kwh-sub">${energyKwhVal} kWh acumulados</div>
                </div>

                ${this._renderSparkline(this._stats)}
              </div>

              <!-- Module 4: Quick Scenes -->
              <div class="aero-card card-scenes">
                <div class="card-header-line">
                  <span class="card-header-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                      <line x1="4" y1="22" x2="4" y2="15"></line>
                    </svg>
                    Escenas Showroom
                  </span>
                </div>

                <div class="scenes-grid">
                  <div class="scene-tile aero-tap" id="btnScenePres">
                    <div class="scene-icon-wrap" style="color: var(--cyan);">✨</div>
                    <span class="scene-name-label">Presentación</span>
                  </div>

                  <div class="scene-tile aero-tap" id="btnSceneMeet">
                    <div class="scene-icon-wrap" style="color: var(--aqua);">👥</div>
                    <span class="scene-name-label">Reunión</span>
                  </div>

                  <div class="scene-tile danger-off aero-tap" id="btnScriptAllOff">
                    <div class="scene-icon-wrap">🌙</div>
                    <span class="scene-name-label">Apagar Todo</span>
                  </div>

                  <div class="scene-tile aero-tap" id="btnScriptAllOn">
                    <div class="scene-icon-wrap" style="color: var(--color-yellow);">☀️</div>
                    <span class="scene-name-label">Encender Todo</span>
                  </div>
                </div>
              </div>

              <!-- Module 5: Media Player Card -->
              <div class="aero-card card-media">
                <div class="card-header-line">
                  <span class="card-header-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                    Audio & Ambiente
                  </span>
                  <span style="font-size: 11px; color: rgba(185, 226, 255, 0.7);">${mediaVolume}% Vol</span>
                </div>

                <div class="media-info-block">
                  <div class="media-title-text">${mediaTitle}</div>
                  <div class="media-artist-text">${mediaArtist}</div>
                </div>

                <div class="media-controls-row">
                  <div class="media-btns-group">
                    <button class="media-ctrl-btn" id="btnMediaPrev" title="Anterior">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="19 20 9 12 19 4 19 20"></polygon>
                        <line x1="5" y1="19" x2="5" y2="5"></line>
                      </svg>
                    </button>
                    <button class="media-ctrl-btn play-btn" id="btnMediaPlayPause" title="${isPlaying ? "Pausar" : "Reproducir"}">
                      ${
                        isPlaying
                          ? `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      `
                          : `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      `
                      }
                    </button>
                    <button class="media-ctrl-btn" id="btnMediaNext" title="Siguiente">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 4 15 12 5 20 5 4"></polygon>
                        <line x1="19" y1="5" x2="19" y2="19"></line>
                      </svg>
                    </button>
                  </div>

                  <div class="volume-controls">
                    <button class="vol-btn" id="btnVolDown" title="Bajar volumen">−</button>
                    <button class="vol-btn" id="btnVolUp" title="Subir volumen">+</button>
                  </div>
                </div>
              </div>

              <!-- Module 6: System Telemetry & Quick Link -->
              <div class="aero-card card-system">
                <div class="card-header-line">
                  <span class="card-header-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    Sistema Showroom
                  </span>
                  <span class="card-header-badge" style="color: var(--color-emerald);">En Línea</span>
                </div>

                <div class="system-info-grid">
                  <div class="sys-tile">
                    <span class="sys-label">Batería Tablet</span>
                    <span class="sys-val">${batteryVal}%</span>
                  </div>
                  <div class="sys-tile">
                    <span class="sys-label">Circuitos</span>
                    <span class="sys-val">9 Activos</span>
                  </div>
                  <div class="sys-tile">
                    <span class="sys-label">Simulador</span>
                    <span class="sys-val">Mock HASS</span>
                  </div>
                  <div class="sys-tile">
                    <span class="sys-label">Latencia</span>
                    <span class="sys-val">&lt; 2 ms</span>
                  </div>
                </div>

                <button class="sheet-action-btn aero-tap" id="btnGoToPage2" style="margin-top: 10px; height: 40px; font-size: 12px;">
                  <span>Ver Analítica Completa</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- PAGE 2: Analítica de Energía & Diagnóstico Extendido -->
          <div class="aero-page">
            <div class="page2-grid">
              <!-- Expanded Energy Analytics -->
              <div class="aero-card card-energy-expanded">
                <div class="card-header-line">
                  <div>
                    <h3 style="font-size: 20px; font-weight: 700; color: #ffffff;">Analítica Energética</h3>
                    <p style="font-size: 13px; color: rgba(185, 226, 255, 0.75);">Historial de consumo por horas del Showroom</p>
                  </div>
                  <div class="timeframe-filter-bar">
                    <button class="tf-btn ${this._statsTimeframe === "day" ? "active" : ""}" id="btnTfDay">Día</button>
                    <button class="tf-btn ${this._statsTimeframe === "month" ? "active" : ""}" id="btnTfMonth">Mes</button>
                    <button class="tf-btn ${this._statsTimeframe === "year" ? "active" : ""}" id="btnTfYear">Año</button>
                  </div>
                </div>

                <div class="energy-kpi-row">
                  <div class="kpi-card">
                    <span class="kpi-title">Consumo Total</span>
                    <span class="kpi-num">${energyKwhVal} kWh</span>
                  </div>
                  <div class="kpi-card">
                    <span class="kpi-title">Potencia Media</span>
                    <span class="kpi-num">72.8 W</span>
                  </div>
                  <div class="kpi-card">
                    <span class="kpi-title">Pico Máximo</span>
                    <span class="kpi-num">1,395 W</span>
                  </div>
                </div>

                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--cyan);">Perfil Horario (00h — 23h)</span>
                    <span style="font-size: 11px; color: rgba(185, 226, 255, 0.6);">Valores en Watts</span>
                  </div>
                  ${this._renderHourlyBarChart(this._stats)}
                </div>
              </div>

              <!-- 5-Day Weather Forecast -->
              <div class="aero-card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                <div class="card-header-line">
                  <span class="card-header-badge">Pronóstico 5 Días</span>
                  <span style="font-size: 12px; color: var(--cyan);">${weatherTemp}°C Actual</span>
                </div>

                <div class="forecast-week-list">
                  ${
                    this._forecast.length > 0
                      ? this._forecast
                          .map((f, i) => {
                            const dateObj = new Date(f.datetime);
                            const dayName = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][dateObj.getDay()];
                            return `
                        <div class="forecast-row-item">
                          <span style="font-weight: 600; font-size: 13px;">${i === 0 ? "Hoy" : dayName}</span>
                          <span style="font-size: 13px; color: rgba(185, 226, 255, 0.8);">${f.condition}</span>
                          <span style="font-weight: 700; font-size: 14px; color: var(--cyan);">${f.temperature}° / ${f.templow || f.temperature - 8}°</span>
                        </div>
                      `;
                          })
                          .join("")
                      : `
                    <div class="forecast-row-item"><span style="font-size: 13px;">Hoy</span><span>Soleado</span><strong>24° / 14°</strong></div>
                    <div class="forecast-row-item"><span style="font-size: 13px;">Mañana</span><span>Parcialmente nublado</span><strong>23° / 13°</strong></div>
                    <div class="forecast-row-item"><span style="font-size: 13px;">Sábado</span><span>Soleado</span><strong>25° / 15°</strong></div>
                    <div class="forecast-row-item"><span style="font-size: 13px;">Domingo</span><span>Nublado</span><strong>21° / 12°</strong></div>
                    <div class="forecast-row-item"><span style="font-size: 13px;">Lunes</span><span>Lluvioso</span><strong>19° / 11°</strong></div>
                  `
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Translucent Aero Bottom Dock -->
        <div class="aero-dock">
          <div class="dock-capsule aero-tap" id="dockLightsBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-yellow);">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
              <path d="M9 18h6"></path>
              <path d="M10 22h4"></path>
            </svg>
            <span>Luces ${lightCountVal}</span>
          </div>

          <div class="dock-capsule aero-tap" id="dockPowerBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--cyan);">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>${powerWattsVal} W</span>
          </div>

          <div class="dock-capsule aero-tap" id="dockMediaBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-purple);">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <span>Lounge ${isPlaying ? "❚❚" : "▶"}</span>
          </div>

          <div class="dock-capsule aero-tap" id="dockBatteryBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
              <line x1="22" y1="11" x2="22" y2="13"></line>
            </svg>
            <span>${batteryVal}%</span>
          </div>

          <div class="dock-dots-group">
            <div class="page-indicator-dot ${this._page === 0 ? "active" : ""}" id="dotPage0" title="Página 1: Operación"></div>
            <div class="page-indicator-dot ${this._page === 1 ? "active" : ""}" id="dotPage1" title="Página 2: Analítica"></div>
          </div>
        </div>

        <!-- Lights Sheet Modal (Aero Glass) -->
        ${
          this._sheet === "lights"
            ? `
          <div class="sheet-backdrop" id="lightsSheetBackdrop">
            <div class="aero-sheet-modal" id="lightsSheetModal">
              <div class="sheet-header-line">
                <div>
                  <h2 class="sheet-title-text">Control de Iluminación</h2>
                  <p style="font-size: 13px; color: rgba(185, 226, 255, 0.75);">${lightCountVal} de 9 circuitos activos • ${powerWattsVal} W</p>
                </div>
                <button class="sheet-close-btn" id="sheetCloseBtn" title="Cerrar">✕</button>
              </div>

              <!-- Grupo SPOTS -->
              <div>
                <div class="sheet-section-title">Circuitos Spots</div>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                  ${SPOTS.map((s) => {
                    const isOn = this._value(s.id) === "on";
                    return `
                      <div class="switch-tactile-row aero-tap ${isOn ? "is-active-light" : ""}" data-entity-id="${s.id}">
                        <div class="switch-left-info">
                          <div class="switch-icon-circle">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                              <path d="M9 18h6"></path>
                              <path d="M10 22h4"></path>
                            </svg>
                          </div>
                          <div class="switch-name-group">
                            <span class="switch-circuit-name">${s.name}</span>
                            <span class="switch-circuit-meta">${s.watts} W nominal</span>
                          </div>
                        </div>
                        <div class="aero-toggle-pill"></div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>

              <!-- Grupo SAMPLES -->
              <div>
                <div class="sheet-section-title">Circuitos Muestrarios & Paneles</div>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                  ${SAMPLES.map((s) => {
                    const isOn = this._value(s.id) === "on";
                    return `
                      <div class="switch-tactile-row aero-tap ${isOn ? "is-active-light" : ""}" data-entity-id="${s.id}">
                        <div class="switch-left-info">
                          <div class="switch-icon-circle">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                              <path d="M9 18h6"></path>
                              <path d="M10 22h4"></path>
                            </svg>
                          </div>
                          <div class="switch-name-group">
                            <span class="switch-circuit-name">${s.name}</span>
                            <span class="switch-circuit-meta">${s.watts} W nominal</span>
                          </div>
                        </div>
                        <div class="aero-toggle-pill"></div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>

              <!-- Botones de Acción Masiva -->
              <div class="sheet-actions-row">
                <button class="sheet-action-btn danger aero-tap" id="modalTurnAllOff">
                  <span>🌙 Apagar Todo</span>
                </button>
                <button class="sheet-action-btn aero-tap" id="modalTurnAllOn">
                  <span>☀️ Encender Todo</span>
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
    root.querySelector("#pillLightsBtn")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#pillMediaBtn")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#pillEnergyBtn")?.addEventListener("click", () => this._setPage(1));

    // Home Cards Taps
    root.querySelector("#homeLightingCard")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#homeWeatherCard")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#homeEnergyCard")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#btnGoToPage2")?.addEventListener("click", () => this._setPage(1));

    // Escenas
    root.querySelector("#btnScenePres")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.presentation });
    });
    root.querySelector("#btnSceneMeet")?.addEventListener("click", () => {
      this._callService("scene", "turn_on", { entity_id: ENTITIES.meeting });
    });
    root.querySelector("#btnScriptAllOff")?.addEventListener("click", () => {
      this._callService("script", "showroom_apagado_general", { entity_id: ENTITIES.allOff });
    });
    root.querySelector("#btnScriptAllOn")?.addEventListener("click", () => {
      this._callService("script", "showroom_encendido_general", { entity_id: ENTITIES.allOn });
    });

    // Reproductor de Medios
    root.querySelector("#btnMediaPlayPause")?.addEventListener("click", () => {
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

    // Timeframe filters en Página 2
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

    // Dock Capsulas
    root.querySelector("#dockLightsBtn")?.addEventListener("click", () => this._openSheet("lights"));
    root.querySelector("#dockPowerBtn")?.addEventListener("click", () => this._setPage(1));
    root.querySelector("#dockMediaBtn")?.addEventListener("click", () => {
      this._callService("media_player", "media_play_pause", { entity_id: ENTITIES.media });
    });
    root.querySelector("#dockBatteryBtn")?.addEventListener("click", () => this._setPage(1));

    // Page indicator dots
    root.querySelector("#dotPage0")?.addEventListener("click", () => this._setPage(0));
    root.querySelector("#dotPage1")?.addEventListener("click", () => this._setPage(1));

    // Modal Sheet Handlers
    root.querySelector("#sheetCloseBtn")?.addEventListener("click", () => this._closeSheet());
    root.querySelector("#lightsSheetBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "lightsSheetBackdrop") {
        this._closeSheet();
      }
    });

    // Interruptores en Modal
    root.querySelectorAll(".switch-tactile-row").forEach((row) => {
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

customElements.define("showroom-aero", ShowroomAero);
