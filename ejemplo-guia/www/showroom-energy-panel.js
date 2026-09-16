// Witmind Showroom Energy Panel v1.1.1 — menú de Home Assistant
// Estima energía desde el historial on/off de Home Assistant:
// energía (Wh) = potencia configurada (W) × tiempo encendido (h).

const DEFAULT_ENERGY_CONFIG = Object.freeze({
  title: "Consumo del showroom",
  subtitle: "Historial energético estimado",
  siteLabel: "WTX · MDTC",
  logo: "/local/logo-witmind.png?v=2.0.0",
  tariffBobPerKwh: 1.5,
  refreshMinutes: 5,
  defaultPeriod: "day",
  afterHoursStart: 22,
  afterHoursEnd: 7,
  circuits: [
    { entity: "switch.interruptor_inteligente_switch_1", name: "Spots ventana", subtitle: "Zona ventana", watts: 10 },
    { entity: "switch.interruptor_inteligente_switch_2", name: "Spots 2x3", subtitle: "Muestra 2 × 3", watts: 10 },
    { entity: "switch.interruptor_inteligente_switch_3", name: "Spots 3x3", subtitle: "Muestra 3 × 3", watts: 10 },
    { entity: "switch.interruptor_inteligente_switch_4", name: "Spots TV", subtitle: "Zona audiovisual", watts: 10 },
    { entity: "switch.interruptor_inteligente_2_switch_1", name: "Paneles 3k/6k", subtitle: "Temperaturas de color", watts: 10 },
    { entity: "switch.interruptor_inteligente_2_switch_2", name: "Colgantes", subtitle: "Muestra suspendida", watts: 10 },
    { entity: "switch.interruptor_inteligente_2_switch_3", name: "Slims", subtitle: "Línea decorativa", watts: 10 },
    { entity: "switch.interruptor_inteligente_2_switch_4", name: "Downlights", subtitle: "Iluminación empotrada", watts: 10 },
    { entity: "switch.smart_relay_switch_4_switch", name: "Paneles", subtitle: "Control por relé", watts: 10 },
    { entity: "switch.smart_relay_switch_3_switch", name: "Reflector exterior", subtitle: "Control aislado", watts: 10 },
  ],
});

const ICONS = {
  bolt: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/>',
  money: '<path d="M4 5h16v14H4V5Zm2 2v10h12V7H6Zm6 1.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM7 9h1.5v2H7V9Zm8.5 4H17v2h-1.5v-2Z"/>',
  trend: '<path d="M4 17 10 11l4 4 6-7v4h2V5h-7v2h3.6L14 12.4l-4-4L2.6 15.6 4 17Z"/>',
  clock: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3h2v4.6l3.2 1.9-1 1.7-4.2-2.5V7Z"/>',
  database: '<path d="M12 2C7 2 3 3.8 3 6v12c0 2.2 4 4 9 4s9-1.8 9-4V6c0-2.2-4-4-9-4Zm0 2c4.3 0 7 1.4 7 2s-2.7 2-7 2-7-1.4-7-2 2.7-2 7-2Zm0 6c2.8 0 5.3-.6 7-1.6V12c0 .6-2.7 2-7 2s-7-1.4-7-2V8.4c1.7 1 4.2 1.6 7 1.6Zm0 6c2.8 0 5.3-.6 7-1.6V18c0 .6-2.7 2-7 2s-7-1.4-7-2v-3.6c1.7 1 4.2 1.6 7 1.6Z"/>',
  refresh: '<path d="M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z"/>',
  warning: '<path d="M12 2 1 21h22L12 2Zm0 4 7.5 13h-15L12 6Zm-1 4v5h2v-5h-2Zm0 6.5v2h2v-2h-2Z"/>',
  check: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 14-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7Z"/>',
  bulb: '<path d="M9 21h6v-2H9v2Zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Zm2 11.5V15h-4v-1.5l-.5-.3A5 5 0 1 1 14.5 13l-.5.5Z"/>',
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

class ShowroomEnergyPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._started = false;
    this._renderQueued = false;
    this._period = "day";
    this._loading = false;
    this._error = "";
    this._data = null;
    this._loadSequence = 0;
    this._refreshTimer = null;
    // Se comparte la preferencia con el panel operativo del showroom.
    // Si nunca se guardó una preferencia, el modo inicial es oscuro.
    this._themeStorageKey = "witmind-showroom-panel-theme";
    this._theme = this._loadTheme();
    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
  }

  set hass(value) {
    const firstValue = !this._hass;
    this._hass = value;
    if (firstValue) this._period = this._config().defaultPeriod;
    this._ensureStarted();
    this._requestRender();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    this._panel = value;
    const config = this._config();
    if (!this._started) this._period = config.defaultPeriod;
    if (this._hass && this._started) {
      this._restartRefreshTimer();
      this._loadData();
    }
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
    this._ensureStarted();
  }

  disconnectedCallback() {
    clearInterval(this._refreshTimer);
    this._refreshTimer = null;
    this._started = false;
  }

  _ensureStarted() {
    if (this._started || !this._hass || !this.isConnected) return;
    this._started = true;
    this._restartRefreshTimer();
    this._loadData();
  }

  _restartRefreshTimer() {
    clearInterval(this._refreshTimer);
    const minutes = this._config().refreshMinutes;
    this._refreshTimer = setInterval(() => this._loadData(), minutes * 60 * 1000);
  }

  _requestRender() {
    if (this._renderQueued || !this.shadowRoot) return;
    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      this.render();
    });
  }

  _config() {
    const raw = this._panel?.config || {};
    const rawCircuits = Array.isArray(raw.circuits) && raw.circuits.length
      ? raw.circuits
      : DEFAULT_ENERGY_CONFIG.circuits;

    const circuits = rawCircuits
      .filter((item) => item?.entity)
      .map((item, index) => {
        const watts = Number(item.watts);
        return {
          entity: String(item.entity),
          name: item.name || `Circuito ${index + 1}`,
          subtitle: item.subtitle || "Iluminación",
          watts: Number.isFinite(watts) && watts >= 0 ? watts : 10,
        };
      });

    const tariff = Number(raw.tariff_bob_per_kwh ?? raw.tariffBobPerKwh);
    const refresh = Number(raw.refresh_minutes ?? raw.refreshMinutes);
    const afterStart = Number(raw.after_hours_start ?? raw.afterHoursStart);
    const afterEnd = Number(raw.after_hours_end ?? raw.afterHoursEnd);
    const defaultPeriod = ["day", "week", "month"].includes(raw.default_period)
      ? raw.default_period
      : DEFAULT_ENERGY_CONFIG.defaultPeriod;

    return {
      title: raw.title || DEFAULT_ENERGY_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_ENERGY_CONFIG.subtitle,
      siteLabel: raw.site_label || raw.siteLabel || DEFAULT_ENERGY_CONFIG.siteLabel,
      logo: raw.logo || DEFAULT_ENERGY_CONFIG.logo,
      tariffBobPerKwh: Number.isFinite(tariff) && tariff >= 0
        ? tariff
        : DEFAULT_ENERGY_CONFIG.tariffBobPerKwh,
      refreshMinutes: Number.isFinite(refresh) && refresh >= 1
        ? Math.min(60, refresh)
        : DEFAULT_ENERGY_CONFIG.refreshMinutes,
      afterHoursStart: Number.isFinite(afterStart)
        ? Math.max(0, Math.min(23, afterStart))
        : DEFAULT_ENERGY_CONFIG.afterHoursStart,
      afterHoursEnd: Number.isFinite(afterEnd)
        ? Math.max(0, Math.min(23, afterEnd))
        : DEFAULT_ENERGY_CONFIG.afterHoursEnd,
      defaultPeriod,
      circuits,
    };
  }

  _loadTheme() {
    try {
      return localStorage.getItem(this._themeStorageKey) === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  _saveTheme() {
    try {
      localStorage.setItem(this._themeStorageKey, this._theme);
    } catch (error) {
      console.warn("No se pudo guardar el tema del panel de consumo:", error);
    }
  }

  _toggleTheme() {
    this._theme = this._theme === "dark" ? "light" : "dark";
    this.setAttribute("data-theme", this._theme);
    this._saveTheme();
    this._requestRender();
  }

  _handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    if (target.dataset.action === "toggle-menu") {
      this._toggleHomeAssistantMenu();
      return;
    }

    if (target.dataset.action === "toggle-theme") {
      this._toggleTheme();
      return;
    }

    if (target.dataset.action === "period") {
      const period = target.dataset.period;
      if (!["day", "week", "month"].includes(period) || period === this._period) return;
      this._period = period;
      this._loadData();
      return;
    }

    if (target.dataset.action === "refresh") this._loadData();
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

  _periodSpec(period, now = new Date()) {
    if (period === "day") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 1);
      const previousEnd = new Date(now);
      previousEnd.setDate(previousEnd.getDate() - 1);
      const chartEnd = new Date(start);
      chartEnd.setDate(chartEnd.getDate() + 1);
      return {
        key: "day",
        label: "Hoy",
        currentStart: start.getTime(),
        currentEnd: now.getTime(),
        previousStart: previousStart.getTime(),
        previousEnd: previousEnd.getTime(),
        chartStart: start.getTime(),
        chartEnd: chartEnd.getTime(),
        bucketCount: 12,
        bucketLabel: (date) => new Intl.DateTimeFormat("es-BO", {
          hour: "2-digit",
          hour12: false,
        }).format(date),
        chartTitle: "Consumo por intervalo de 2 horas",
      };
    }

    const days = period === "week" ? 7 : 30;
    const duration = days * 24 * 60 * 60 * 1000;
    const currentEnd = now.getTime();
    const currentStart = currentEnd - duration;
    const previousEnd = currentStart;
    const previousStart = previousEnd - duration;
    const bucketCount = period === "week" ? 7 : 10;

    return {
      key: period,
      label: period === "week" ? "Últimos 7 días" : "Últimos 30 días",
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      chartStart: currentStart,
      chartEnd: currentEnd,
      bucketCount,
      bucketLabel: (date) => period === "week"
        ? new Intl.DateTimeFormat("es-BO", { weekday: "short", day: "numeric" }).format(date)
        : new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "short" }).format(date),
      chartTitle: period === "week" ? "Consumo diario" : "Consumo por bloques de 3 días",
    };
  }

  async _loadData() {
    if (!this._hass?.callApi) return;
    const sequence = ++this._loadSequence;
    this._loading = true;
    this._error = "";
    this._requestRender();

    const config = this._config();
    const spec = this._periodSpec(this._period);
    const entityIds = config.circuits.map((item) => item.entity).join(",");

    if (!entityIds) {
      this._loading = false;
      this._error = "No hay circuitos configurados.";
      this._requestRender();
      return;
    }

    const path =
      `history/period/${encodeURIComponent(new Date(spec.previousStart).toISOString())}` +
      `?filter_entity_id=${encodeURIComponent(entityIds)}` +
      `&end_time=${encodeURIComponent(new Date(spec.currentEnd).toISOString())}` +
      "&minimal_response&no_attributes";

    try {
      const raw = await this._hass.callApi("GET", path);
      if (sequence !== this._loadSequence) return;
      const historyMap = this._normalizeHistory(raw);
      this._data = this._calculateDashboard(config, spec, historyMap);
      this._error = "";
    } catch (error) {
      if (sequence !== this._loadSequence) return;
      this._error = "No se pudo leer /api/history/period. Revisa Recorder, permisos y entidades.";
      console.error("Showroom Energy Panel: error cargando historial", error);
    } finally {
      if (sequence === this._loadSequence) {
        this._loading = false;
        this._requestRender();
      }
    }
  }

  _normalizeHistory(raw) {
    const result = new Map();
    for (const group of Array.isArray(raw) ? raw : []) {
      if (!Array.isArray(group) || !group.length) continue;
      const entityId = group.find((item) => item?.entity_id)?.entity_id;
      if (!entityId) continue;
      const events = group
        .map((item) => ({
          state: String(item?.state ?? "unknown"),
          time: new Date(item?.last_changed || item?.last_updated).getTime(),
        }))
        .filter((item) => Number.isFinite(item.time))
        .sort((a, b) => a.time - b.time);
      result.set(entityId, events);
    }
    return result;
  }

  _fallbackState(entityId, atTime) {
    const stateObject = this._hass?.states?.[entityId];
    if (!stateObject) return "off";
    const changed = new Date(stateObject.last_changed || stateObject.last_updated).getTime();
    return Number.isFinite(changed) && changed <= atTime ? stateObject.state : "off";
  }

  _stateAt(events, atTime, fallback) {
    let state = fallback;
    for (const event of events) {
      if (event.time > atTime) break;
      state = event.state;
    }
    return state;
  }

  _segments(events, start, end, fallback) {
    if (end <= start) return [];
    let state = this._stateAt(events, start, fallback);
    let cursor = start;
    const segments = [];

    for (const event of events) {
      if (event.time <= start) continue;
      if (event.time >= end) break;
      if (event.time > cursor) segments.push({ state, start: cursor, end: event.time });
      state = event.state;
      cursor = event.time;
    }

    if (cursor < end) segments.push({ state, start: cursor, end });
    return segments;
  }

  _onDuration(events, start, end, fallback) {
    return this._segments(events, start, end, fallback)
      .filter((segment) => segment.state === "on")
      .reduce((sum, segment) => sum + (segment.end - segment.start), 0);
  }

  _bucketSeries(config, spec, historyMap, previous = false) {
    const domainStart = previous ? spec.previousStart : spec.chartStart;
    const domainEnd = previous
      ? spec.previousStart + (spec.chartEnd - spec.chartStart)
      : spec.chartEnd;
    const cutoff = previous ? spec.previousEnd : spec.currentEnd;
    const bucketSize = (domainEnd - domainStart) / spec.bucketCount;
    const values = [];
    const labels = [];

    for (let index = 0; index < spec.bucketCount; index += 1) {
      const bucketStart = domainStart + index * bucketSize;
      const bucketEnd = Math.min(domainStart + (index + 1) * bucketSize, cutoff);
      let wh = 0;

      if (bucketEnd > bucketStart) {
        for (const circuit of config.circuits) {
          const events = historyMap.get(circuit.entity) || [];
          const fallback = this._fallbackState(circuit.entity, bucketStart);
          const duration = this._onDuration(events, bucketStart, bucketEnd, fallback);
          wh += (duration / 3600000) * circuit.watts;
        }
      }

      values.push(wh);
      if (!previous) labels.push(spec.bucketLabel(new Date(bucketStart)));
    }

    return { values, labels };
  }

  _powerProfile(config, spec, historyMap) {
    const start = spec.currentStart;
    const end = spec.currentEnd;
    const states = new Map();
    const events = [];

    for (const circuit of config.circuits) {
      const history = historyMap.get(circuit.entity) || [];
      const fallback = this._fallbackState(circuit.entity, start);
      states.set(circuit.entity, this._stateAt(history, start, fallback));
      for (const event of history) {
        if (event.time > start && event.time < end) {
          events.push({ entity: circuit.entity, state: event.state, time: event.time });
        }
      }
    }

    const powerForStates = () => config.circuits.reduce(
      (sum, circuit) => sum + (states.get(circuit.entity) === "on" ? circuit.watts : 0),
      0,
    );

    let cursor = start;
    let power = powerForStates();
    let peakWatts = power;
    let peakTime = start;
    let activeMs = 0;
    const intervals = [];

    events.sort((a, b) => a.time - b.time);
    let index = 0;
    while (index < events.length) {
      const time = events[index].time;
      if (time > cursor) {
        intervals.push({ start: cursor, end: time, watts: power });
        if (power > 0) activeMs += time - cursor;
      }

      while (index < events.length && events[index].time === time) {
        states.set(events[index].entity, events[index].state);
        index += 1;
      }

      power = powerForStates();
      if (power > peakWatts) {
        peakWatts = power;
        peakTime = time;
      }
      cursor = time;
    }

    if (cursor < end) {
      intervals.push({ start: cursor, end, watts: power });
      if (power > 0) activeMs += end - cursor;
    }

    return { peakWatts, peakTime, activeMs, intervals };
  }

  _afterHoursWh(circuitRows, config, start, end) {
    let totalWh = 0;
    const day = new Date(start);
    day.setHours(0, 0, 0, 0);

    while (day.getTime() < end) {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const earlyEnd = new Date(day);
      earlyEnd.setHours(config.afterHoursEnd, 0, 0, 0);
      const lateStart = new Date(day);
      lateStart.setHours(config.afterHoursStart, 0, 0, 0);
      const windows = [
        [day.getTime(), earlyEnd.getTime()],
        [lateStart.getTime(), nextDay.getTime()],
      ];

      for (const row of circuitRows) {
        for (const segment of row.segments) {
          if (segment.state !== "on") continue;
          for (const [windowStart, windowEnd] of windows) {
            const overlap = Math.max(
              0,
              Math.min(segment.end, windowEnd, end) - Math.max(segment.start, windowStart, start),
            );
            totalWh += (overlap / 3600000) * row.watts;
          }
        }
      }

      day.setDate(day.getDate() + 1);
    }

    return totalWh;
  }

  _calculateDashboard(config, spec, historyMap) {
    const circuitRows = config.circuits.map((circuit) => {
      const events = historyMap.get(circuit.entity) || [];
      const currentFallback = this._fallbackState(circuit.entity, spec.currentStart);
      const previousFallback = this._fallbackState(circuit.entity, spec.previousStart);
      const currentMs = this._onDuration(
        events,
        spec.currentStart,
        spec.currentEnd,
        currentFallback,
      );
      const previousMs = this._onDuration(
        events,
        spec.previousStart,
        spec.previousEnd,
        previousFallback,
      );
      const currentWh = (currentMs / 3600000) * circuit.watts;
      const previousWh = (previousMs / 3600000) * circuit.watts;
      const segments = this._segments(
        events,
        spec.currentStart,
        spec.currentEnd,
        currentFallback,
      );

      return {
        ...circuit,
        currentMs,
        previousMs,
        currentWh,
        previousWh,
        segments,
        eventCount: events.length,
        hasHistory: historyMap.has(circuit.entity),
        available: Boolean(this._hass?.states?.[circuit.entity]) &&
          !["unknown", "unavailable"].includes(this._hass.states[circuit.entity].state),
      };
    });

    const totalWh = circuitRows.reduce((sum, row) => sum + row.currentWh, 0);
    const previousWh = circuitRows.reduce((sum, row) => sum + row.previousWh, 0);
    const currentSeries = this._bucketSeries(config, spec, historyMap, false);
    const previousSeries = this._bucketSeries(config, spec, historyMap, true);
    const powerProfile = this._powerProfile(config, spec, historyMap);
    const currentPower = config.circuits.reduce((sum, circuit) => {
      return sum + (this._hass?.states?.[circuit.entity]?.state === "on" ? circuit.watts : 0);
    }, 0);
    const activeCircuits = config.circuits.filter(
      (circuit) => this._hass?.states?.[circuit.entity]?.state === "on",
    ).length;
    const afterHoursWh = this._afterHoursWh(
      circuitRows,
      config,
      spec.currentStart,
      spec.currentEnd,
    );

    circuitRows.sort((a, b) => b.currentWh - a.currentWh);
    for (const row of circuitRows) {
      row.share = totalWh > 0 ? (row.currentWh / totalWh) * 100 : 0;
    }

    return {
      spec,
      totalWh,
      previousWh,
      costBob: (totalWh / 1000) * config.tariffBobPerKwh,
      currentPower,
      activeCircuits,
      afterHoursWh,
      circuitRows,
      currentSeries: currentSeries.values,
      previousSeries: previousSeries.values,
      labels: currentSeries.labels,
      peakWatts: powerProfile.peakWatts,
      peakTime: powerProfile.peakTime,
      activeMs: powerProfile.activeMs,
      historyEntities: circuitRows.filter((row) => row.hasHistory).length,
      availableEntities: circuitRows.filter((row) => row.available).length,
      totalEvents: circuitRows.reduce((sum, row) => sum + row.eventCount, 0),
      updatedAt: Date.now(),
    };
  }

  _formatEnergy(wh, decimals = 2) {
    if (!Number.isFinite(wh)) return { value: "—", unit: "Wh" };
    if (Math.abs(wh) < 1000) {
      return {
        value: new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 }).format(wh),
        unit: "Wh",
      };
    }
    return {
      value: new Intl.NumberFormat("es-BO", { maximumFractionDigits: decimals }).format(wh / 1000),
      unit: "kWh",
    };
  }

  _formatDuration(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "0 min";
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return `${minutes} min`;
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  _formatMoney(value) {
    return `Bs ${new Intl.NumberFormat("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0)}`;
  }

  _formatTime(timestamp) {
    if (!Number.isFinite(timestamp)) return "—";
    return new Intl.DateTimeFormat("es-BO", {
      weekday: this._period === "day" ? undefined : "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  }

  _trend() {
    const current = this._data?.totalWh ?? 0;
    const previous = this._data?.previousWh ?? 0;
    if (previous <= 0) return { value: "Sin referencia", className: "neutral", sentence: "No existe consumo previo suficiente para comparar." };
    const percentage = ((current - previous) / previous) * 100;
    const sign = percentage > 0 ? "+" : "";
    return {
      value: `${sign}${new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 }).format(percentage)} %`,
      className: percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral",
      sentence: percentage > 0
        ? `El consumo aumentó ${Math.abs(percentage).toFixed(1)} % frente al periodo anterior.`
        : percentage < 0
          ? `El consumo bajó ${Math.abs(percentage).toFixed(1)} % frente al periodo anterior.`
          : "El consumo fue igual al periodo anterior.",
    };
  }

  _icon(name, className = "") {
    return `<svg class="icon ${this._escape(className)}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.bulb}</svg>`;
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _renderChart() {
    const data = this._data;
    if (!data) return '<div class="empty">Cargando historial…</div>';
    const maximum = Math.max(1, ...data.currentSeries, ...data.previousSeries);
    const largestIndex = data.currentSeries.indexOf(Math.max(...data.currentSeries));
    const largest = this._formatEnergy(data.currentSeries[largestIndex] || 0);

    return `
      <div class="chart" aria-label="Consumo estimado por intervalo">
        <div class="chart-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="bars" style="--columns:${data.labels.length}">
          ${data.labels.map((label, index) => {
            const current = data.currentSeries[index] || 0;
            const previous = data.previousSeries[index] || 0;
            const currentHeight = Math.max(current > 0 ? 2 : 0, (current / maximum) * 100);
            const previousHeight = Math.max(previous > 0 ? 2 : 0, (previous / maximum) * 100);
            const currentLabel = this._formatEnergy(current);
            return `
              <div class="bar-column" title="${this._escape(`${label}: ${currentLabel.value} ${currentLabel.unit}`)}">
                <div class="bar-track">
                  <i class="bar-previous" style="height:${previousHeight.toFixed(2)}%"></i>
                  <i class="bar-current" style="height:${currentHeight.toFixed(2)}%"></i>
                </div>
                <span>${this._escape(label)}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <div class="chart-footer">
        <span>Mayor intervalo <strong>${this._escape(data.labels[largestIndex] || "—")} · ${largest.value} ${largest.unit}</strong></span>
        <span>Tarifa aplicada <strong>${this._formatMoney(this._config().tariffBobPerKwh)}/kWh</strong></span>
      </div>
    `;
  }

  _renderCircuits() {
    if (!this._data) return '<div class="empty">Sin resultados todavía.</div>';
    return `
      <div class="circuit-list">
        ${this._data.circuitRows.map((row) => {
          const energy = this._formatEnergy(row.currentWh);
          return `
            <article class="circuit ${row.available ? "" : "is-unavailable"}">
              <div class="circuit-main">
                <span class="circuit-icon">${this._icon("bulb")}</span>
                <div>
                  <strong>${this._escape(row.name)}</strong>
                  <small>${this._escape(row.subtitle)} · ${this._escape(row.watts)} W configurados</small>
                </div>
              </div>
              <div class="circuit-value">
                <strong>${energy.value} ${energy.unit}</strong>
                <small>${this._formatDuration(row.currentMs)} · ${row.share.toFixed(1)} %</small>
              </div>
              <div class="progress"><i style="width:${Math.max(0, Math.min(100, row.share))}%"></i></div>
              <div class="circuit-status">
                <span>${row.hasHistory ? "Historial recibido" : "Sin historial devuelto"}</span>
                <span>${row.available ? "Entidad disponible" : "Entidad no disponible"}</span>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  _renderInsights() {
    if (!this._data) return '<div class="empty">Esperando datos.</div>';
    const trend = this._trend();
    const top = this._data.circuitRows[0];
    const after = this._formatEnergy(this._data.afterHoursWh);
    const diagnosticOk = this._data.historyEntities === this._config().circuits.length;

    const insights = [
      {
        icon: trend.className === "up" ? "trend" : "check",
        type: trend.className === "up" ? "warning" : "success",
        title: trend.sentence,
        text: `Periodo anterior: ${this._formatEnergy(this._data.previousWh).value} ${this._formatEnergy(this._data.previousWh).unit}.`,
      },
      {
        icon: "bolt",
        type: "success",
        title: top && top.currentWh > 0 ? `${top.name} concentró el mayor consumo.` : "No se detectó consumo en el periodo.",
        text: top && top.currentWh > 0 ? `${top.share.toFixed(1)} % del total, usando ${top.watts} W como potencia configurada.` : "Todos los circuitos permanecieron apagados o sin historial utilizable.",
      },
      {
        icon: this._data.afterHoursWh > 0 ? "warning" : "check",
        type: this._data.afterHoursWh > 0 ? "warning" : "success",
        title: this._data.afterHoursWh > 0 ? "Se detectó consumo fuera del horario definido." : "No se detectó consumo fuera de horario.",
        text: `${after.value} ${after.unit} entre 22:00–07:00, según la configuración actual.`,
      },
      {
        icon: diagnosticOk ? "database" : "warning",
        type: diagnosticOk ? "success" : "warning",
        title: diagnosticOk ? "Home Assistant devolvió historial para todos los circuitos." : "Home Assistant no devolvió historial para todos los circuitos.",
        text: `${this._data.historyEntities}/${this._config().circuits.length} entidades con historial y ${this._data.totalEvents} registros procesados.`,
      },
    ];

    return `<div class="insight-list">${insights.map((item) => `
      <article class="insight ${item.type}">
        <span>${this._icon(item.icon)}</span>
        <div><strong>${this._escape(item.title)}</strong><p>${this._escape(item.text)}</p></div>
      </article>
    `).join("")}</div>`;
  }

  render() {
    this.setAttribute("data-theme", this._theme);
    const config = this._config();
    const data = this._data;
    const energy = this._formatEnergy(data?.totalWh ?? 0);
    const trend = this._trend();
    const periodLabel = data?.spec?.label || this._periodSpec(this._period).label;
    const missingHistory = data ? config.circuits.length - data.historyEntities : 0;
    const nextTheme = this._theme === "dark" ? "claro" : "oscuro";

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main class="dashboard">
        <header class="page-header">
          <div class="header-start">
            <button
              class="menu-button"
              data-action="toggle-menu"
              aria-label="Abrir menú de navegación de Home Assistant"
              title="Abrir menú"
            >${MENU_ICON}</button>
            <div class="brand">
              <div class="logo-frame"><img src="${this._escape(config.logo)}" alt="Witmind"></div>
              <div class="brand-copy">
                <span class="site-label">${this._escape(config.siteLabel)}</span>
                <h1>${this._escape(config.title)}</h1>
                <p>${this._escape(config.subtitle)}</p>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <nav class="period-control" aria-label="Periodo">
              ${[
                ["day", "Hoy"],
                ["week", "7 días"],
                ["month", "30 días"],
              ].map(([key, label]) => `
                <button data-action="period" data-period="${key}" class="${this._period === key ? "is-active" : ""}">${label}</button>
              `).join("")}
            </nav>
            <button class="theme-button" data-action="toggle-theme" title="Cambiar a tema ${nextTheme}" aria-label="Cambiar a tema ${nextTheme}">${THEME_ICON}</button>
            <button class="refresh-button ${this._loading ? "is-loading" : ""}" data-action="refresh" title="Actualizar historial" aria-label="Actualizar historial" ${this._loading ? "disabled" : ""}>
              ${this._icon("refresh")}
            </button>
          </div>
        </header>

        ${this._error ? `<div class="error-banner">${this._icon("warning")}<span>${this._escape(this._error)}</span></div>` : ""}

        <section class="surface hero">
          <div class="hero-main">
            <span class="eyebrow">Consumo acumulado · ${this._escape(periodLabel)}</span>
            <div class="hero-value"><strong>${energy.value}</strong><span>${energy.unit}</span></div>
            <p>
              ${data
                ? `La iluminación estuvo activa durante ${this._formatDuration(data.activeMs)}. El cálculo usa el historial on/off y la potencia configurada de cada circuito.`
                : "Leyendo el historial de los circuitos configurados en Home Assistant…"}
            </p>
            <div class="estimate-badge">Estimación, no medición física</div>
          </div>

          <div class="metric-grid">
            <article class="metric"><span>${this._icon("money")}</span><small>Costo estimado</small><strong>${this._formatMoney(data?.costBob ?? 0)}</strong><em>${this._formatMoney(config.tariffBobPerKwh)}/kWh</em></article>
            <article class="metric"><span>${this._icon("trend")}</span><small>Variación</small><strong class="trend-${trend.className}">${this._escape(trend.value)}</strong><em>contra periodo anterior</em></article>
            <article class="metric"><span>${this._icon("bolt")}</span><small>Potencia actual</small><strong>${this._escape(data?.currentPower ?? 0)} W</strong><em>${this._escape(data?.activeCircuits ?? 0)} circuitos encendidos</em></article>
            <article class="metric"><span>${this._icon("clock")}</span><small>Pico calculado</small><strong>${this._escape(data?.peakWatts ?? 0)} W</strong><em>${data ? this._escape(this._formatTime(data.peakTime)) : "—"}</em></article>
          </div>
        </section>

        <section class="diagnostics ${missingHistory ? "has-warning" : ""}">
          <div><span>${this._icon("database")}</span><strong>${data ? `${data.historyEntities}/${config.circuits.length}` : "—"}</strong><small>entidades con historial</small></div>
          <div><strong>${data?.totalEvents ?? "—"}</strong><small>registros procesados</small></div>
          <div><strong>${data ? `${data.availableEntities}/${config.circuits.length}` : "—"}</strong><small>entidades disponibles</small></div>
          <div><strong>${data ? this._formatTime(data.updatedAt) : "—"}</strong><small>última lectura</small></div>
        </section>

        <div class="content-grid">
          <section class="surface chart-card">
            <header class="section-heading">
              <div><span class="eyebrow">Evolución</span><h2>${this._escape(data?.spec?.chartTitle || "Consumo por intervalo")}</h2><p>Energía estimada según duración encendida y watts configurados.</p></div>
              <div class="legend"><span><i></i>Periodo actual</span><span class="previous"><i></i>Periodo anterior</span></div>
            </header>
            ${this._renderChart()}
          </section>

          <aside class="side-column">
            <section class="surface insight-card">
              <header class="section-heading"><div><span class="eyebrow">Interpretación</span><h2>Hallazgos</h2></div></header>
              ${this._renderInsights()}
            </section>
          </aside>
        </div>

        <section class="surface circuits-card">
          <header class="section-heading">
            <div><span class="eyebrow">Distribución</span><h2>Consumo por circuito</h2><p>Cada potencia se modifica directamente con la propiedad <code>watts</code> en configuration.yaml.</p></div>
            <span class="configuration-note">Valor inicial: 10 W por circuito</span>
          </header>
          ${this._renderCircuits()}
        </section>
      </main>
    `;
  }

  _styles() {
    return `
      :host {
        --primary: #f26522;
        --primary-hover: #d95a1e;
        --primary-pressed: #d94e10;
        --primary-soft: rgba(242, 101, 34, 0.10);
        --primary-medium: rgba(242, 101, 34, 0.20);
        --primary-border: rgba(242, 101, 34, 0.34);
        --primary-glow: rgba(242, 101, 34, 0.18);

        --background: #061c2b;
        --background-secondary: #0b2b40;
        --background-deep: #051722;
        --surface: rgba(255, 255, 255, 0.035);
        --surface-strong: rgba(255, 255, 255, 0.055);
        --surface-hover: rgba(255, 255, 255, 0.065);
        --surface-control: rgba(255, 255, 255, 0.045);
        --surface-active: rgba(242, 101, 34, 0.10);

        --text-primary: rgba(255, 255, 255, 0.92);
        --text-secondary: rgba(255, 255, 255, 0.70);
        --text-tertiary: rgba(255, 255, 255, 0.45);
        --text-disabled: rgba(255, 255, 255, 0.28);

        --border-subtle: rgba(255, 255, 255, 0.065);
        --border-default: rgba(255, 255, 255, 0.09);
        --border-emphasis: rgba(255, 255, 255, 0.14);
        --divider: rgba(255, 255, 255, 0.07);
        --grid-line: rgba(255, 255, 255, 0.065);
        --track: rgba(255, 255, 255, 0.075);

        --success: #22c55e;
        --warning: #f59e0b;
        --danger: #ef4444;
        --info: #38bdf8;

        --shadow: rgba(0, 0, 0, 0.16);
        --shadow-strong: rgba(0, 0, 0, 0.30);
        --radius-sm: 10px;
        --radius-md: 16px;
        --radius-lg: 24px;
        --radius-pill: 999px;
        --motion-fast: 180ms;
        --motion-base: 350ms;

        display: block;
        min-height: 100%;
        color: var(--text-primary);
        background:
          radial-gradient(circle at 85% 10%, rgba(242, 101, 34, 0.11) 0%, transparent 30%),
          radial-gradient(circle at 5% 80%, rgba(11, 43, 64, 0.72) 0%, transparent 36%),
          linear-gradient(155deg, var(--background-deep), var(--background-secondary) 58%, var(--background));
        font-family: "Plus Jakarta Sans", Inter, Arial, sans-serif;
        box-sizing: border-box;
      }

      :host([data-theme="light"]) {
        --background: #edf3f6;
        --background-secondary: #dfe9ee;
        --background-deep: #f8fafb;
        --surface: rgba(255, 255, 255, 0.76);
        --surface-strong: rgba(255, 255, 255, 0.94);
        --surface-hover: rgba(255, 255, 255, 1);
        --surface-control: rgba(9, 42, 62, 0.055);
        --surface-active: rgba(242, 101, 34, 0.10);

        --text-primary: rgba(8, 35, 52, 0.94);
        --text-secondary: rgba(8, 35, 52, 0.68);
        --text-tertiary: rgba(8, 35, 52, 0.48);
        --text-disabled: rgba(8, 35, 52, 0.30);

        --border-subtle: rgba(8, 35, 52, 0.08);
        --border-default: rgba(8, 35, 52, 0.12);
        --border-emphasis: rgba(8, 35, 52, 0.18);
        --divider: rgba(8, 35, 52, 0.08);
        --grid-line: rgba(8, 35, 52, 0.08);
        --track: rgba(8, 35, 52, 0.08);

        --shadow: rgba(20, 48, 65, 0.10);
        --shadow-strong: rgba(20, 48, 65, 0.20);

        background:
          radial-gradient(circle at 85% 10%, rgba(242, 101, 34, 0.13) 0%, transparent 31%),
          radial-gradient(circle at 5% 80%, rgba(11, 43, 64, 0.10) 0%, transparent 36%),
          linear-gradient(155deg, var(--background-deep), var(--background-secondary) 60%, var(--background));
      }

      *, *::before, *::after { box-sizing: border-box; }
      button, code { font: inherit; }
      button { color: inherit; }
      button:focus-visible { outline: 3px solid rgba(56, 189, 248, 0.65); outline-offset: 2px; }
      button:disabled { cursor: not-allowed; opacity: 0.48; }

      .dashboard { width:min(1480px, calc(100% - 32px)); margin:0 auto; padding:28px 0 56px; }
      .page-header { display:flex; align-items:center; justify-content:space-between; gap:24px; margin-bottom:22px; padding:14px 16px; border:1px solid var(--border-subtle); border-radius:var(--radius-lg); background:color-mix(in srgb, var(--background-secondary) 76%, transparent); box-shadow:0 12px 32px var(--shadow); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
      :host([data-theme="light"]) .page-header { background:rgba(255,255,255,.72); }
      .header-start { min-width:0; display:flex; align-items:center; gap:10px; }
      .brand { min-width:0; display:flex; align-items:center; gap:14px; }
      .logo-frame { width:112px; height:44px; flex:0 0 112px; display:grid; place-items:center; padding:5px 8px; border:1px solid var(--primary-border); border-radius:14px; background:var(--primary-soft); }
      .logo-frame img { display:block; width:100%; height:100%; object-fit:contain; }
      .brand-copy { min-width:0; }
      .site-label, .eyebrow { display:block; margin-bottom:7px; color:var(--primary); font-size:.7rem; font-weight:800; letter-spacing:.15em; text-transform:uppercase; }
      h1,h2,p { margin:0; }
      h1,h2 { font-family:Outfit, Inter, Arial, sans-serif; }
      h1 { overflow:hidden; font-size:clamp(1.65rem,3.2vw,2.55rem); line-height:1.05; letter-spacing:-.035em; text-overflow:ellipsis; white-space:nowrap; }
      .page-header p { margin-top:7px; color:var(--text-secondary); font-size:.82rem; }
      .header-actions { display:flex; align-items:center; gap:9px; }
      .period-control { display:flex; gap:4px; padding:5px; background:var(--surface-control); border:1px solid var(--border-default); border-radius:14px; }
      .period-control button, .menu-button, .theme-button, .refresh-button { border:0; cursor:pointer; transition:transform var(--motion-fast), background var(--motion-fast), border-color var(--motion-fast), box-shadow var(--motion-fast); }
      .period-control button { min-height:42px; padding:0 14px; background:transparent; border:1px solid transparent; border-radius:10px; color:var(--text-secondary); font-size:.8rem; font-weight:750; }
      .period-control button:hover { color:var(--text-primary); background:var(--surface-hover); }
      .period-control button.is-active { color:var(--primary); background:var(--surface-active); border-color:var(--primary-border); box-shadow:0 0 22px var(--primary-glow); }
      .menu-button, .theme-button, .refresh-button { display:grid; width:46px; height:46px; flex:0 0 46px; place-items:center; background:var(--surface-control); border:1px solid var(--border-default); border-radius:50%; }
      .menu-button:hover, .theme-button:hover, .refresh-button:hover { transform:translateY(-2px); background:var(--surface-hover); border-color:var(--primary-border); box-shadow:0 8px 24px var(--shadow); }
      .menu-button:active, .theme-button:active, .refresh-button:active, .period-control button:active { transform:scale(.97); }
      .refresh-button.is-loading .icon { animation:spin .9s linear infinite; }
      .menu-icon, .theme-icon { width:21px; height:21px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      .menu-icon { width:22px; height:22px; stroke-width:2; }
      .theme-icon-sun, .theme-icon-moon { transform-origin:center; transition:opacity 220ms, transform 220ms; }
      .theme-icon-sun { opacity:0; transform:rotate(-50deg) scale(.65); }
      .theme-icon-moon { opacity:1; transform:rotate(0) scale(1); }
      :host([data-theme="light"]) .theme-icon-sun { opacity:1; transform:rotate(0) scale(1); }
      :host([data-theme="light"]) .theme-icon-moon { opacity:0; transform:rotate(45deg) scale(.65); }
      .icon { width:20px; height:20px; fill:currentColor; }

      .surface { min-width:0; background:var(--surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); box-shadow:0 16px 40px var(--shadow), inset 0 1px 0 rgba(255,255,255,.025); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); overflow:hidden; transition:transform var(--motion-base), background var(--motion-base), border-color var(--motion-base), box-shadow var(--motion-base); }
      @media (hover:hover) { .surface:hover { transform:translateY(-3px); background:var(--surface-strong); border-color:rgba(242,101,34,.24); box-shadow:0 20px 48px var(--shadow-strong), 0 0 28px rgba(242,101,34,.055); } }
      .hero { display:grid; grid-template-columns:minmax(280px,1.1fr) minmax(480px,.9fr); gap:22px; padding:24px; }
      .hero-main { padding:8px 4px; }
      .hero-value { display:flex; align-items:flex-end; gap:11px; margin-top:20px; }
      .hero-value strong { font-family:Outfit, Inter, Arial, sans-serif; font-size:clamp(3.8rem,8vw,6.8rem); line-height:.78; letter-spacing:-.075em; }
      .hero-value span { margin-bottom:4px; color:var(--text-secondary); font-size:1.2rem; font-weight:800; }
      .hero-main p { max-width:620px; margin-top:23px; color:var(--text-secondary); line-height:1.58; }
      .estimate-badge { display:inline-flex; align-items:center; gap:7px; margin-top:17px; padding:8px 12px; color:var(--warning); background:color-mix(in srgb, var(--warning) 12%, transparent); border:1px solid color-mix(in srgb, var(--warning) 27%, transparent); border-radius:var(--radius-pill); font-size:.75rem; font-weight:750; }
      .estimate-badge::before { width:7px; height:7px; background:currentColor; border-radius:50%; content:""; }
      .metric-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
      .metric { position:relative; min-height:136px; padding:18px; background:var(--surface-control); border:1px solid var(--border-default); border-radius:var(--radius-md); }
      .metric>span { position:absolute; top:16px; right:16px; color:var(--primary); opacity:.9; }
      .metric small { display:block; color:var(--text-secondary); font-size:.73rem; font-weight:700; }
      .metric strong { display:block; margin-top:25px; font-family:Outfit, Inter, Arial, sans-serif; font-size:1.65rem; letter-spacing:-.03em; }
      .metric em { display:block; margin-top:7px; color:var(--text-secondary); font-size:.69rem; font-style:normal; }
      .trend-down { color:var(--success); } .trend-up { color:var(--warning); } .trend-neutral { color:var(--text-primary); }

      .diagnostics { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; overflow:hidden; margin:14px 0 18px; background:var(--border-default); border:1px solid var(--border-default); border-radius:var(--radius-md); }
      .diagnostics>div { display:flex; align-items:center; gap:9px; min-height:64px; padding:12px 16px; background:var(--surface); }
      .diagnostics>div>span { color:var(--primary); }
      .diagnostics strong { font-family:Outfit, Inter, Arial, sans-serif; font-size:.9rem; }
      .diagnostics small { color:var(--text-secondary); font-size:.7rem; }
      .diagnostics.has-warning>div:first-child>span { color:var(--warning); }

      .content-grid { display:grid; grid-template-columns:minmax(0,1.5fr) minmax(340px,.7fr); gap:18px; }
      .chart-card,.insight-card,.circuits-card { padding:22px; }
      .circuits-card { margin-top:18px; }
      .section-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:22px; }
      .section-heading h2 { font-size:1.2rem; letter-spacing:-.015em; }
      .section-heading p { margin-top:7px; color:var(--text-secondary); font-size:.78rem; }
      code { padding:2px 5px; color:var(--primary); background:var(--surface-control); border-radius:6px; }
      .configuration-note { padding:7px 11px; color:var(--primary); background:var(--primary-soft); border:1px solid var(--primary-border); border-radius:var(--radius-pill); font-size:.71rem; font-weight:700; white-space:nowrap; }
      .legend { display:flex; gap:13px; color:var(--text-secondary); font-size:.7rem; }
      .legend span { display:flex; align-items:center; gap:6px; }
      .legend i { width:8px; height:8px; background:var(--primary); border-radius:3px; }
      .legend .previous i { background:transparent; border:1px dashed var(--text-secondary); }

      .chart { position:relative; height:310px; padding:10px 0 28px; }
      .chart-grid { position:absolute; inset:10px 0 28px; display:grid; grid-template-rows:repeat(4,1fr); }
      .chart-grid i { border-top:1px dashed var(--grid-line); }
      .bars { position:relative; z-index:1; display:grid; grid-template-columns:repeat(var(--columns),minmax(24px,1fr)); align-items:end; gap:clamp(5px,1vw,12px); height:100%; }
      .bar-column { display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:8px; min-width:0; }
      .bar-track { position:relative; width:100%; max-width:38px; height:calc(100% - 20px); }
      .bar-current,.bar-previous { position:absolute; right:0; bottom:0; left:0; min-height:0; border-radius:8px 8px 3px 3px; }
      .bar-previous { border:1px dashed color-mix(in srgb,var(--text-secondary) 72%,transparent); }
      .bar-current { right:4px; left:4px; background:linear-gradient(180deg,var(--primary),color-mix(in srgb,var(--primary) 38%,transparent)); box-shadow:0 0 18px rgba(242,101,34,.10); }
      .bar-column>span { overflow:hidden; width:100%; color:var(--text-secondary); font-size:.62rem; text-align:center; text-overflow:ellipsis; white-space:nowrap; }
      .chart-footer { display:flex; justify-content:space-between; gap:18px; padding-top:16px; border-top:1px solid var(--divider); color:var(--text-secondary); font-size:.74rem; }
      .chart-footer strong { color:var(--text-primary); }

      .insight-list { display:grid; gap:10px; }
      .insight { display:grid; grid-template-columns:36px 1fr; gap:11px; padding:13px; background:var(--surface-control); border:1px solid var(--border-default); border-radius:13px; }
      .insight>span { display:grid; width:36px; height:36px; place-items:center; color:var(--primary); background:var(--primary-soft); border:1px solid color-mix(in srgb,var(--primary) 20%,transparent); border-radius:10px; }
      .insight.success>span { color:var(--success); background:color-mix(in srgb,var(--success) 10%,transparent); border-color:color-mix(in srgb,var(--success) 22%,transparent); }
      .insight.warning>span { color:var(--warning); background:color-mix(in srgb,var(--warning) 11%,transparent); border-color:color-mix(in srgb,var(--warning) 24%,transparent); }
      .insight strong { display:block; font-size:.79rem; line-height:1.38; }
      .insight p { margin-top:5px; color:var(--text-secondary); font-size:.7rem; line-height:1.45; }

      .circuit-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; }
      .circuit { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:11px 16px; padding:16px; background:var(--surface-control); border:1px solid var(--border-default); border-radius:var(--radius-md); }
      .circuit.is-unavailable { opacity:.62; }
      .circuit-main { display:flex; align-items:center; gap:11px; min-width:0; }
      .circuit-icon { display:grid; flex:0 0 auto; width:39px; height:39px; place-items:center; color:var(--primary); background:var(--primary-soft); border:1px solid color-mix(in srgb,var(--primary) 18%,transparent); border-radius:11px; }
      .circuit-main>div { min-width:0; }
      .circuit-main strong { display:block; overflow:hidden; font-size:.83rem; text-overflow:ellipsis; white-space:nowrap; }
      .circuit-main small,.circuit-value small { display:block; margin-top:4px; color:var(--text-secondary); font-size:.66rem; }
      .circuit-value { text-align:right; }
      .circuit-value strong { font-family:Outfit, Inter, Arial, sans-serif; font-size:.86rem; }
      .progress { grid-column:1/-1; height:6px; overflow:hidden; background:var(--track); border-radius:var(--radius-pill); }
      .progress i { display:block; height:100%; background:linear-gradient(90deg,rgba(242,101,34,.42),var(--primary)); border-radius:inherit; }
      .circuit-status { grid-column:1/-1; display:flex; justify-content:space-between; gap:10px; color:var(--text-secondary); font-size:.62rem; }

      .error-banner { display:flex; align-items:center; gap:10px; margin-bottom:14px; padding:13px 15px; color:var(--danger); background:color-mix(in srgb,var(--danger) 10%,var(--surface)); border:1px solid color-mix(in srgb,var(--danger) 25%,transparent); border-radius:14px; font-size:.78rem; }
      .empty { display:grid; min-height:220px; place-items:center; color:var(--text-secondary); font-size:.8rem; }

      @keyframes spin { to { transform:rotate(360deg); } }
      @media (max-width:1050px) { .hero,.content-grid { grid-template-columns:1fr; } .metric-grid { grid-template-columns:repeat(4,1fr); } .circuit-list { grid-template-columns:1fr; } }
      @media (max-width:820px) { .page-header { align-items:flex-start; flex-direction:column; } .header-actions { width:100%; } .period-control { flex:1; } .period-control button { flex:1; padding-inline:8px; } }
      @media (max-width:760px) { .dashboard { width:min(100% - 18px,1480px); padding-top:18px; } .page-header { padding:13px; } .logo-frame { width:92px; flex-basis:92px; } h1 { font-size:1.45rem; } .hero,.chart-card,.insight-card,.circuits-card { padding:17px; } .metric-grid,.diagnostics { grid-template-columns:repeat(2,1fr); } .diagnostics { gap:1px; } .section-heading { flex-direction:column; } .chart { overflow-x:auto; } .bars { min-width:620px; } .chart-footer { flex-direction:column; } }
      @media (max-width:520px) { .brand { align-items:flex-start; } .logo-frame { display:none; } .header-actions { flex-wrap:wrap; } .period-control { order:2; flex-basis:100%; } .theme-button,.refresh-button { width:44px; height:44px; flex-basis:44px; } .hero-value strong { font-size:3.6rem; } }
      @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none !important; transition-duration:.01ms !important; scroll-behavior:auto !important; } }
      @media (max-width:760px), (prefers-reduced-transparency:reduce) { .surface,.page-header { backdrop-filter:none; -webkit-backdrop-filter:none; } }
    `;
  }
}

if (!customElements.get("showroom-energy-panel")) {
  customElements.define("showroom-energy-panel", ShowroomEnergyPanel);
}
