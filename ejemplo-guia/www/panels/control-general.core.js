// Witmind Control General Panel v1.3.1
// Panel operativo consolidado para Showroom, Lobby, Oficinas y Sala de grabación.

const DEFAULT_CONTROL_CONFIG = Object.freeze({
  title: "Control general",
  subtitle: "Escenas y rutinas operativas",
  siteLabel: "WTX · MDTC",
  logo: "/local/logo-witmind.png?v=2.0.0",
  weather: "weather.forecast_casa",
  zones: [
    {
      id: "showroom",
      name: "Showroom",
      icon: "showroom",
      entities: [
        "switch.interruptor_inteligente_switch_1",
        "switch.interruptor_inteligente_switch_2",
        "switch.interruptor_inteligente_switch_3",
        "switch.interruptor_inteligente_switch_4",
        "switch.interruptor_inteligente_2_switch_1",
        "switch.interruptor_inteligente_2_switch_2",
        "switch.interruptor_inteligente_2_switch_3",
        "switch.interruptor_inteligente_2_switch_4",
        "switch.smart_relay_switch_4_switch",
        "switch.smart_relay_switch_3_switch",
      ],
    },
    {
      id: "lobby",
      name: "Lobby",
      icon: "lobby",
      entities: [
        "switch.interruptor_inteligente_3_switch_1",
        "switch.interruptor_inteligente_3_switch_2",
        "switch.interruptor_inteligente_3_switch_3",
        "switch.interruptor_inteligente_3_switch_4",
      ],
    },
    {
      id: "oficinas",
      name: "Oficinas",
      icon: "office",
      entities: [
        "switch.oficina_gerencial_interruptor_1",
        "switch.oficina_mindtec_interruptor_1",
        "switch.oficina_grande_interruptor_1",
        "switch.oficina_grande_interruptor_2",
        "switch.b2_gang_interruptor_1",
        "switch.b2_gang_interruptor_2",
        "switch.taller_interruptor_1",
      ],
    },
    {
      id: "grabacion",
      name: "Sala de grabación",
      icon: "recording",
      entities: [
        "switch.4gang_switch_sala_grabacion_interruptor_1",
        "switch.4gang_switch_sala_grabacion_interruptor_2",
        "switch.4gang_switch_sala_grabacion_interruptor_3",
        "switch.4gang_switch_sala_grabacion_interruptor_4",
      ],
    },
  ],
  mainActions: [],
  dailyActions: [],
  dangerAction: null,
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

const CONDITION_SYMBOLS = {
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
  people: '<path d="M8 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8-1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 21v-3a6 6 0 0 1 12 0v3H2Zm13 0v-3c0-1.5-.4-2.9-1.2-4.1A5 5 0 0 1 22 18v3h-7Z"/>',
  presentation: '<path d="M3 3h18v13H3V3Zm2 2v9h14V5H5Zm6 11h2v2.2l3.6 2.1-1 1.7-3.6-2.1L8.4 22l-1-1.7 3.6-2.1V16Z"/>',
  power: '<path d="M11 2h2v10h-2V2Zm5.7 3.9 1.4-1.4A9 9 0 1 1 5.9 4.5l1.4 1.4A7 7 0 1 0 16.7 5.9Z"/>',
  bulb: '<path d="M9 21h6v-2H9v2Zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Zm2 11.5V15h-4v-1.5l-.5-.3A5 5 0 1 1 14.5 13l-.5.5Z"/>',
  visit: '<path d="M12 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM5 22v-3a7 7 0 0 1 14 0v3H5Zm13-11 1.4 1.4-2 2L16 13l2-2Z"/>',
  sunrise: '<path d="M3 18h18v2H3v-2Zm8-13h2v4h-2V5Zm-6.4 2L6 5.6l2.8 2.8-1.4 1.4L4.6 7Zm14.8 0-2.8 2.8-1.4-1.4L18 5.6 19.4 7ZM6 16a6 6 0 0 1 12 0h-2a4 4 0 0 0-8 0H6Z"/>',
  sunset: '<path d="M3 18h18v2H3v-2Zm8-13h2v4h-2V5Zm-6.4 2L6 5.6l2.8 2.8-1.4 1.4L4.6 7Zm14.8 0-2.8 2.8-1.4-1.4L18 5.6 19.4 7ZM6 16a6 6 0 0 1 12 0h-2a4 4 0 0 0-8 0H6Z"/>',
  shield: '<path d="M12 2 4 5v6c0 5.1 3.4 9.4 8 11 4.6-1.6 8-5.9 8-11V5l-8-3Zm0 2.2 6 2.2V11c0 3.9-2.4 7.4-6 8.8C8.4 18.4 6 14.9 6 11V6.4l6-2.2Zm-1 4h2v6h-2v-6Zm0 8h2v2h-2v-2Z"/>',
  showroom: '<path d="M4 3h16l2 5v3h-1v10H3V11H2V8l2-5Zm1.3 2L4 8h16l-1.3-3H5.3ZM5 11v8h5v-5h4v5h5v-8H5Z"/>',
  lobby: '<path d="M4 3h16v18H4V3Zm2 2v14h5V5H6Zm7 0v14h5V5h-5Zm-5 6h1v2H8v-2Zm7 0h1v2h-1v-2Z"/>',
  office: '<path d="M3 4h18v16H3V4Zm2 2v12h14V6H5Zm2 2h4v3H7V8Zm6 0h4v3h-4V8Zm-6 5h4v3H7v-3Zm6 0h4v3h-4v-3Z"/>',
  recording: '<path d="M6 5h12v14H6V5Zm2 2v10h8V7H8Zm4 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/>',
  check: '<path d="m5 12 4 4L19 6l1.5 1.5L9 19 3.5 13.5 5 12Z"/>',
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

class ControlGeneralPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._started = false;
    this._renderQueued = false;
    this._liveStates = new Map();
    this._pendingAction = "";
    this._toast = null;
    this._toastTimer = null;
    this._clockTimer = null;
    this._unsubscribeStates = null;
    this._confirmOpen = false;
    this._confirmCountdown = 0;
    this._confirmTimer = null;
    this._themeStorageKey = "witmind-control-general-panel-theme";
    this._theme = this._loadTheme();

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
    clearInterval(this._confirmTimer);
    clearTimeout(this._toastTimer);
    if (this._unsubscribeStates) {
      this._unsubscribeStates();
      this._unsubscribeStates = null;
    }
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

    if (action === "toggle-menu") {
      this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
      return;
    }

    if (action === "toggle-theme") {
      this._theme = this._theme === "dark" ? "light" : "dark";
      this._saveTheme();
      this._requestRender();
      return;
    }

    if (action === "run-action") {
      const selected = this._allActions().find((item) => item.id === target.dataset.actionId);
      if (selected) this._executeAction(selected);
      return;
    }

    if (action === "open-total-off") {
      this._openDangerConfirmation();
      return;
    }

    if (action === "cancel-total-off") {
      const insideDialog = event.target.closest("[data-dialog-card]");
      if (target.classList.contains("dialog-backdrop") && insideDialog) return;
      if (!this._pendingAction) this._closeDangerConfirmation();
      return;
    }

    if (action === "confirm-total-off") {
      const danger = this._config().dangerAction;
      if (danger && this._confirmCountdown === 0) {
        this._executeAction(danger, {
          closeConfirmationOnSuccess: true,
          armEntity: danger.armEntity,
          armStateEntity: danger.armStateEntity,
          backendOnly: danger.backendOnly,
        });
      }
    }
  }


  _loadTheme() {
    try {
      return localStorage.getItem(this._themeStorageKey) === "dark" ? "dark" : "light";
    } catch (_error) {
      return "light";
    }
  }

  _saveTheme() {
    try {
      localStorage.setItem(this._themeStorageKey, this._theme);
    } catch (error) {
      console.warn("No se pudo guardar el tema:", error);
    }
  }

  _normalizeEntities(items) {
    if (!Array.isArray(items)) return [];
    return [...new Set(items.filter(Boolean).map(String))];
  }

  _normalizeAction(item, index, group) {
    if (!item || typeof item !== "object") return null;
    return {
      id: String(item.id || `${group}-${index + 1}`),
      name: item.name || `Acción ${index + 1}`,
      subtitle: item.subtitle || "Control operativo",
      icon: item.icon || "power",
      tone: item.tone || "default",
      serviceEntities: this._normalizeEntities(item.service_entities || item.serviceEntities),
      onEntities: this._normalizeEntities(item.on_entities || item.onEntities),
      offEntities: this._normalizeEntities(item.off_entities || item.offEntities),
      armEntity: String(item.arm_entity || item.armEntity || ""),
      armStateEntity: String(item.arm_state_entity || item.armStateEntity || ""),
      backendOnly: Boolean(item.backend_only ?? item.backendOnly ?? false),
      group,
    };
  }

  _config() {
    const raw = this._panel?.config || {};
    const sourceZones = Array.isArray(raw.zones) && raw.zones.length
      ? raw.zones
      : DEFAULT_CONTROL_CONFIG.zones;

    const zones = sourceZones
      .filter((zone) => zone && typeof zone === "object")
      .map((zone, index) => ({
        id: String(zone.id || `zone-${index + 1}`),
        name: zone.name || `Zona ${index + 1}`,
        icon: zone.icon || "bulb",
        entities: this._normalizeEntities(zone.entities),
      }))
      .filter((zone) => zone.entities.length);

    const mainActions = (Array.isArray(raw.main_actions || raw.mainActions)
      ? (raw.main_actions || raw.mainActions)
      : DEFAULT_CONTROL_CONFIG.mainActions)
      .map((item, index) => this._normalizeAction(item, index, "main"))
      .filter(Boolean);

    const dailyActions = (Array.isArray(raw.daily_actions || raw.dailyActions)
      ? (raw.daily_actions || raw.dailyActions)
      : DEFAULT_CONTROL_CONFIG.dailyActions)
      .map((item, index) => this._normalizeAction(item, index, "daily"))
      .filter(Boolean);

    const dangerRaw = raw.danger_action || raw.dangerAction || DEFAULT_CONTROL_CONFIG.dangerAction;
    const dangerAction = dangerRaw ? this._normalizeAction(dangerRaw, 0, "danger") : null;

    return {
      title: raw.title || DEFAULT_CONTROL_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_CONTROL_CONFIG.subtitle,
      siteLabel: raw.site_label || raw.siteLabel || DEFAULT_CONTROL_CONFIG.siteLabel,
      logo: raw.logo || DEFAULT_CONTROL_CONFIG.logo,
      weather: raw.weather || DEFAULT_CONTROL_CONFIG.weather,
      zones,
      mainActions,
      dailyActions,
      dangerAction,
    };
  }

  _allActions(config = this._config()) {
    return [
      ...config.mainActions,
      ...config.dailyActions,
      ...(config.dangerAction ? [config.dangerAction] : []),
    ];
  }

  _trackedEntities() {
    const config = this._config();
    return new Set([
      config.weather,
      ...config.zones.flatMap((zone) => zone.entities),
      ...this._allActions(config).flatMap((action) => [
        ...action.serviceEntities,
        ...(action.armEntity ? [action.armEntity] : []),
        ...(action.armStateEntity ? [action.armStateEntity] : []),
        ...action.onEntities,
        ...action.offEntities,
      ]),
    ].filter(Boolean));
  }

  async _start() {
    this._clockTimer = setInterval(() => this._updateClock(), 30_000);
    await Promise.allSettled([this._fetchCurrentStates(), this._subscribeStateChanges()]);
  }

  _syncStatesFromHass() {
    if (!this._hass?.states) return;
    for (const entityId of this._trackedEntities()) {
      const stateObject = this._hass.states[entityId];
      if (stateObject) this._liveStates.set(entityId, stateObject);
    }
  }

  async _fetchCurrentStates() {
    if (!this._hass?.callWS) {
      this._syncStatesFromHass();
      return;
    }
    try {
      const states = await this._hass.callWS({ type: "get_states" });
      const tracked = this._trackedEntities();
      for (const stateObject of states || []) {
        if (tracked.has(stateObject.entity_id)) {
          this._liveStates.set(stateObject.entity_id, stateObject);
        }
      }
    } catch (error) {
      console.warn("No se pudieron sincronizar los estados del panel:", error);
      this._syncStatesFromHass();
    }
  }

  async _subscribeStateChanges() {
    if (!this._hass?.connection || this._unsubscribeStates) return;
    try {
      this._unsubscribeStates = await this._hass.connection.subscribeEvents(
        (event) => {
          const entityId = event?.data?.entity_id;
          if (!entityId || !this._trackedEntities().has(entityId)) return;
          const newState = event?.data?.new_state;
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

  _state(entityId) {
    return this._liveStates.get(entityId) || this._hass?.states?.[entityId];
  }

  _isUnavailable(entityId) {
    const state = this._state(entityId)?.state;
    return !state || state === "unknown" || state === "unavailable";
  }

  _expectations(action) {
    const on = new Set(action.onEntities);
    return [
      ...action.offEntities
        .filter((entityId) => !on.has(entityId))
        .map((entityId) => ({ entityId, desired: "off" })),
      ...action.onEntities.map((entityId) => ({ entityId, desired: "on" })),
    ];
  }

  _actionStatus(action) {
    const expectations = this._expectations(action);
    if (!expectations.length) return { active: false, unavailable: false };
    const unavailable = expectations.some(({ entityId }) => this._isUnavailable(entityId));
    const active = !unavailable && expectations.every(
      ({ entityId, desired }) => this._state(entityId)?.state === desired,
    );
    return { active, unavailable };
  }

  _zoneStatus(zone) {
    const states = zone.entities.map((entityId) => this._state(entityId)?.state || "unavailable");
    const on = states.filter((state) => state === "on").length;
    const unavailable = states.filter((state) => state === "unknown" || state === "unavailable").length;
    return { on, total: zone.entities.length, unavailable };
  }

  async _callServiceEntities(entityIds) {
    const errors = [];
    for (const entityId of entityIds) {
      const domain = entityId.split(".")[0];
      if (!domain) continue;
      try {
        await this._hass.callService(domain, "turn_on", { entity_id: entityId });
      } catch (error) {
        errors.push({ entityId, error });
        console.warn(`No respondió ${entityId}; continuará el control directo.`, error);
      }
    }
    return errors;
  }

  async _setEntitiesState(entityIds, desired, options = {}) {
    const includeUnavailable = Boolean(options.includeUnavailable);
    const isolateFailures = Boolean(options.isolateFailures);
    const ids = this._normalizeEntities(entityIds).filter(
      (entityId) => includeUnavailable || !this._isUnavailable(entityId),
    );
    if (!ids.length) return [];

    const service = desired === "on" ? "turn_on" : "turn_off";
    let calls;

    if (isolateFailures) {
      // En el apagado crítico cada circuito se envía por separado: el fallo de
      // una entidad no impide que las otras reciban su orden.
      calls = ids.map((entityId) => {
        const domain = entityId.split(".")[0];
        return domain
          ? this._hass.callService(domain, service, { entity_id: entityId })
          : Promise.reject(new Error(`Entidad inválida: ${entityId}`));
      });
    } else {
      const groups = new Map();
      for (const entityId of ids) {
        const domain = entityId.split(".")[0];
        if (!domain) continue;
        if (!groups.has(domain)) groups.set(domain, []);
        groups.get(domain).push(entityId);
      }
      calls = [...groups.entries()].map(([domain, domainEntities]) =>
        this._hass.callService(domain, service, { entity_id: domainEntities }),
      );
    }

    const results = await Promise.allSettled(calls);
    const errors = results
      .map((result, index) => result.status === "rejected" ? { entityId: isolateFailures ? ids[index] : "group", error: result.reason } : null)
      .filter(Boolean);

    if (errors.length && !isolateFailures) throw errors[0].error;
    return errors;
  }

  async _waitForExpectations(expectations, timeoutMs = 8000) {
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

  async _executeAction(action, options = {}) {
    if (!action || this._pendingAction || !this._hass) return;
    const allExpectations = this._expectations(action);
    const unavailable = allExpectations.filter(({ entityId }) => this._isUnavailable(entityId));
    const available = allExpectations.filter(({ entityId }) => !this._isUnavailable(entityId));
    const hasOnExpectation = allExpectations.some(({ desired }) => desired === "on");
    const isCritical = action.group === "danger";
    const verificationExpectations = isCritical ? allExpectations : available;

    if (!allExpectations.length) {
      this._notify("La acción no tiene circuitos configurados.", "error");
      return;
    }

    if (!available.length && !isCritical) {
      this._notify("No hay circuitos disponibles para ejecutar esta acción.", "error");
      return;
    }

    // Un modo de encendido no se aplica parcialmente. Los apagados ordinarios
    // continúan sobre circuitos disponibles; el apagado crítico intenta y
    // verifica expresamente todos los circuitos configurados.
    if (hasOnExpectation && unavailable.length) {
      this._notify("El modo no puede aplicarse porque hay circuitos sin datos.", "error");
      return;
    }

    this._pendingAction = action.id;
    this._requestRender();

    const backendOnly = Boolean(options.backendOnly ?? action.backendOnly);

    try {
      if (options.armEntity) {
        const armDomain = options.armEntity.split(".")[0];
        if (!armDomain) throw new Error("Entidad de armado inválida.");
        const armService = armDomain === "timer" ? "start" : "turn_on";
        await this._hass.callService(armDomain, armService, { entity_id: options.armEntity });

        if (options.armStateEntity) {
          const deadline = Date.now() + 3000;
          let armed = false;
          while (Date.now() < deadline) {
            await this._fetchCurrentStates();
            if (this._state(options.armStateEntity)?.state === "active") {
              armed = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
          if (!armed) throw new Error("No se confirmó la ventana backend de autorización.");
        }
      }

      const serviceErrors = await this._callServiceEntities(action.serviceEntities);
      if (backendOnly && serviceErrors.length) {
        throw new Error(`Falló la ejecución backend: ${serviceErrors.map((item) => item.entityId).join(", ")}`);
      }

      // La acción crítica conserva la autorización backend, pero además
      // envía el apagado directo a todos los circuitos configurados. Esto
      // permite recuperarse si el script falla parcialmente sin omitir una
      // entidad solo porque su estado inicial sea unavailable/unknown.
      if (!backendOnly) {
        await this._setEntitiesState(action.offEntities, "off", {
          includeUnavailable: isCritical,
          isolateFailures: isCritical,
        });
        await this._setEntitiesState(action.onEntities, "on", {
          includeUnavailable: isCritical,
          isolateFailures: isCritical,
        });
      }

      let verification = await this._waitForExpectations(
        verificationExpectations,
        isCritical || backendOnly ? 15000 : 8000,
      );
      if (!verification.ok && !backendOnly) {
        const retryOff = verification.mismatches
          .filter(({ desired }) => desired === "off")
          .map(({ entityId }) => entityId);
        const retryOn = verification.mismatches
          .filter(({ desired }) => desired === "on")
          .map(({ entityId }) => entityId);
        await this._setEntitiesState(retryOff, "off", {
          includeUnavailable: isCritical,
          isolateFailures: isCritical,
        });
        await this._setEntitiesState(retryOn, "on", {
          includeUnavailable: isCritical,
          isolateFailures: isCritical,
        });
        verification = await this._waitForExpectations(
          verificationExpectations,
          isCritical ? 8000 : 4500,
        );
      }

      if (!verification.ok) {
        throw new Error(`Sin confirmación: ${verification.mismatches.map((item) => item.entityId).join(", ")}`);
      }

      const fallbackText = !backendOnly && serviceErrors.length ? " Se completó mediante control directo." : "";
      const unavailableText = !isCritical && unavailable.length
        ? ` ${unavailable.length} circuito(s) no estaban disponibles.`
        : "";
      const notificationType = !isCritical && unavailable.length ? "warning" : "success";
      this._notify(`${action.name} completado.${fallbackText}${unavailableText}`, notificationType);
      if (options.closeConfirmationOnSuccess) this._closeDangerConfirmation();
    } catch (error) {
      this._notify(`No se pudo confirmar completamente: ${action.name}.`, "error");
      console.error(`Error ejecutando ${action.id}:`, error);
    } finally {
      if (options.armEntity?.startsWith("timer.")) {
        try {
          await this._hass.callService("timer", "cancel", { entity_id: options.armEntity });
        } catch (error) {
          console.warn("No se pudo cerrar la ventana backend de autorización:", error);
        }
      }
      this._pendingAction = "";
      await this._fetchCurrentStates();
      this._requestRender();
    }
  }

  _openDangerConfirmation() {
    if (this._pendingAction) return;
    clearInterval(this._confirmTimer);
    this._confirmOpen = true;
    this._confirmCountdown = 3;
    this._requestRender();

    this._confirmTimer = setInterval(() => {
      this._confirmCountdown = Math.max(0, this._confirmCountdown - 1);
      this._requestRender();
      if (this._confirmCountdown === 0) {
        clearInterval(this._confirmTimer);
        this._confirmTimer = null;
      }
    }, 1000);
  }

  _closeDangerConfirmation() {
    clearInterval(this._confirmTimer);
    this._confirmTimer = null;
    this._confirmOpen = false;
    this._confirmCountdown = 0;
    this._requestRender();
  }

  _notify(message, type = "success") {
    clearTimeout(this._toastTimer);
    this._toast = { message, type };
    this._requestRender();
    this._toastTimer = setTimeout(() => {
      this._toast = null;
      this._requestRender();
    }, 6000);
  }

  _icon(name) {
    const path = ICON_PATHS[name] || ICON_PATHS.power;
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _updateClock() {
    const time = this.shadowRoot?.querySelector("[data-clock-time]");
    const period = this.shadowRoot?.querySelector("[data-clock-period]");
    if (!time || !period) return;
    const parts = new Intl.DateTimeFormat("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(new Date());
    const hour = parts.find((part) => part.type === "hour")?.value || "--";
    const minute = parts.find((part) => part.type === "minute")?.value || "--";
    const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value || "";
    time.textContent = `${hour}:${minute}`;
    period.textContent = dayPeriod.toUpperCase();
  }

  _renderZone(zone) {
    const status = this._zoneStatus(zone);
    const stateClass = status.on ? "is-on" : "is-off";
    const detail = status.unavailable
      ? `${status.unavailable} sin datos`
      : status.on
        ? `${status.on} de ${status.total} encendidos`
        : "Todo apagado";
    return `
      <article class="zone-card ${stateClass}">
        <span class="zone-icon">${this._icon(zone.icon)}</span>
        <span class="zone-copy">
          <strong>${this._escape(zone.name)}</strong>
          <small>${this._escape(detail)}</small>
        </span>
        <span class="zone-count">${status.on}<small>/${status.total}</small></span>
      </article>
    `;
  }

  _renderActionButton(action) {
    const pending = this._pendingAction === action.id;
    const status = this._actionStatus(action);
    const disabled = Boolean(this._pendingAction) && !pending;
    const stateText = pending ? "Ejecutando…" : status.active ? "Activo" : status.unavailable ? "Sin datos" : "Listo";
    return `
      <button
        class="action-button tone-${this._escape(action.tone)} ${status.active ? "is-active" : ""} ${pending ? "is-pending" : ""}"
        data-action="run-action"
        data-action-id="${this._escape(action.id)}"
        aria-pressed="${status.active}"
        ${disabled ? "disabled" : ""}
      >
        <span class="action-icon">${this._icon(action.icon)}</span>
        <span class="action-copy">
          <strong>${this._escape(action.name)}</strong>
          <small>${this._escape(action.subtitle)}</small>
        </span>
        <span class="action-state">${this._escape(stateText)}</span>
      </button>
    `;
  }

  _renderDanger(config) {
    const action = config.dangerAction;
    if (!action) return "";
    const pending = this._pendingAction === action.id;
    const zones = config.zones.map((zone) => zone.name).join(" · ");
    return `
      <section class="surface danger-card">
        <div class="danger-copy">
          <span class="danger-icon">${this._icon("shield")}</span>
          <div>
            <span class="eyebrow danger-eyebrow">Acción crítica</span>
            <h2>${this._escape(action.name)}</h2>
            <p>${this._escape(action.subtitle)}</p>
            <small>${this._escape(zones)}</small>
          </div>
        </div>
        <button class="danger-button" data-action="open-total-off" ${this._pendingAction ? "disabled" : ""}>
          <span>${this._icon("power")}</span>
          <strong>${pending ? "Apagando…" : "Abrir confirmación"}</strong>
        </button>
      </section>
    `;
  }

  _renderConfirmDialog(config) {
    if (!this._confirmOpen || !config.dangerAction) return "";
    const action = config.dangerAction;
    const pending = this._pendingAction === action.id;
    const locked = this._confirmCountdown > 0 || pending;
    const buttonText = pending
      ? "Ejecutando apagado…"
      : this._confirmCountdown > 0
        ? `Disponible en ${this._confirmCountdown} s`
        : "Confirmar apagado total";
    const dialogTitle = "¿Apagar todas las áreas?";
    const dialogText = "Se apagarán completamente el Showroom, el Lobby, todas las oficinas y la Sala de grabación.";
    const impactContent = config.zones.map((zone) => `<span>${this._icon(zone.icon)}<strong>${this._escape(zone.name)}</strong><small>${zone.entities.length} circuitos</small></span>`).join("");

    return `
      <div class="dialog-backdrop" data-action="cancel-total-off">
        <section class="dialog-card danger-dialog" role="dialog" aria-modal="true" aria-labelledby="danger-dialog-title" data-dialog-card>
          <div class="dialog-icon">${this._icon("shield")}</div>
          <span class="eyebrow danger-eyebrow">Precaución · Acción irreversible inmediata</span>
          <h2 id="danger-dialog-title">${this._escape(dialogTitle)}</h2>
          <p>${this._escape(dialogText)}</p>
          <div class="impact-grid">${impactContent}</div>
          <div class="dialog-actions">
            <button class="secondary-button" data-action="cancel-total-off" ${pending ? "disabled" : ""}>Cancelar</button>
            <button class="critical-button" data-action="confirm-total-off" ${locked ? "disabled" : ""}>${this._escape(buttonText)}</button>
          </div>
        </section>
      </div>
    `;
  }

  render() {
    if (!this.shadowRoot || !this._hass) return;
    this.setAttribute("data-theme", this._theme);

    const config = this._config();
    const weather = this._state(config.weather);
    const weatherAttrs = weather?.attributes || {};
    const condition = weather?.state || "unknown";
    const nextTheme = this._theme === "dark" ? "claro" : "oscuro";
    const totalStatus = config.zones.reduce((acc, zone) => {
      const status = this._zoneStatus(zone);
      acc.on += status.on;
      acc.total += status.total;
      acc.unavailable += status.unavailable;
      return acc;
    }, { on: 0, total: 0, unavailable: 0 });

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
          --surface-active: rgba(242, 101, 34, 0.105);
          --surface-control: rgba(255, 255, 255, 0.055);
          --text-primary: rgba(255, 255, 255, 0.93);
          --text-secondary: rgba(255, 255, 255, 0.70);
          --text-tertiary: rgba(255, 255, 255, 0.48);
          --border-subtle: rgba(255, 255, 255, 0.065);
          --border-default: rgba(255, 255, 255, 0.095);
          --border-emphasis: rgba(255, 255, 255, 0.15);
          --header: rgba(8, 34, 50, 0.82);
          --overlay: rgba(0, 10, 18, 0.78);
          --modal: #0a2739;
          --shadow: rgba(0, 0, 0, 0.15);
          --shadow-strong: rgba(0, 0, 0, 0.42);
          --success: #22c55e;
          --warning: #f59e0b;
          --error: #ef4444;
          --error-soft: rgba(239, 68, 68, 0.12);
          --error-border: rgba(239, 68, 68, 0.40);
          --info: #38bdf8;
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 22px;
          --radius-pill: 999px;
          --motion: 180ms;
          display: block;
          min-height: 100%;
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
          --surface: rgba(255, 255, 255, 0.76);
          --surface-strong: rgba(255, 255, 255, 0.94);
          --surface-hover: rgba(255, 255, 255, 1);
          --surface-active: rgba(242, 101, 34, 0.10);
          --surface-control: rgba(9, 42, 62, 0.055);
          --text-primary: rgba(8, 35, 52, 0.94);
          --text-secondary: rgba(8, 35, 52, 0.68);
          --text-tertiary: rgba(8, 35, 52, 0.48);
          --border-subtle: rgba(8, 35, 52, 0.08);
          --border-default: rgba(8, 35, 52, 0.12);
          --border-emphasis: rgba(8, 35, 52, 0.18);
          --header: rgba(255, 255, 255, 0.84);
          --overlay: rgba(12, 31, 43, 0.46);
          --modal: #ffffff;
          --shadow: rgba(20, 48, 65, 0.10);
          --shadow-strong: rgba(20, 48, 65, 0.24);
          background:
            radial-gradient(circle at 10% 4%, rgba(242, 101, 34, 0.13), transparent 34%),
            radial-gradient(circle at 88% 0%, rgba(11, 43, 64, 0.08), transparent 30%),
            linear-gradient(155deg, var(--background-deep), var(--background-secondary) 60%, var(--background));
        }

        * { box-sizing: border-box; }
        button, input { font: inherit; }
        button { color: inherit; }
        button:focus-visible, input:focus-visible { outline: 3px solid rgba(56, 189, 248, 0.65); outline-offset: 2px; }
        button:disabled { cursor: not-allowed; opacity: 0.48; }
        svg { width: 24px; height: 24px; fill: currentColor; display: block; }

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
        .logo-frame {
          width: 120px;
          height: 42px;
          padding: 4px 6px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid var(--border-default);
          border-radius: 14px;
          background: rgba(255,255,255,.04);
        }
        .logo-frame img { width: 100%; height: 100%; display: block; object-fit: contain; filter: brightness(0) invert(1); mix-blend-mode: screen; }
        :host([data-theme="light"]) .logo-frame img { filter: none; mix-blend-mode: multiply; }
        .menu-button, .theme-button {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-default);
          border-radius: 50%;
          background: var(--surface-control);
          cursor: pointer;
          transition: background var(--motion), border-color var(--motion);
        }
        .menu-button:hover, .theme-button:hover { background: var(--surface-hover); border-color: var(--primary-border); }
        .menu-icon, .theme-icon { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .menu-icon { width: 22px; height: 22px; stroke-width: 2; }
        .theme-icon-sun, .theme-icon-moon { transform-origin: center; transition: opacity 220ms, transform 220ms; }
        .theme-icon-sun { opacity: 0; transform: rotate(-50deg) scale(0.65); }
        .theme-icon-moon { opacity: 1; transform: rotate(0) scale(1); }
        :host([data-theme="light"]) .theme-icon-sun { opacity: 1; transform: rotate(0) scale(1); }
        :host([data-theme="light"]) .theme-icon-moon { opacity: 0; transform: rotate(45deg) scale(0.65); }

        .dashboard { width: min(1460px, 100%); margin: 0 auto; padding: clamp(14px, 2vw, 24px); }
        .surface {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          background: var(--surface);
          box-shadow: 0 14px 36px var(--shadow), inset 0 1px 0 rgba(255,255,255,0.025);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .hero-card {
          min-height: 112px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 22px;
          background: radial-gradient(circle at 92% 16%, rgba(242, 101, 34, 0.10), transparent 34%), var(--surface);
        }
        .hero-copy h1 { margin: 0; font: 800 clamp(28px, 3vw, 38px)/1.04 Outfit, Inter, Arial, sans-serif; letter-spacing: -0.035em; }
        .hero-copy h1 span { color: var(--primary); }
        .hero-copy p { margin: 8px 0 0; color: var(--text-secondary); font-size: 12px; font-weight: 650; }
        .hero-status { display: flex; align-items: center; justify-content: flex-end; gap: 18px; }
        .hero-clock { display: inline-flex; align-items: baseline; gap: 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .hero-clock strong { font: 800 clamp(27px, 3vw, 34px)/1 Outfit, Inter, Arial, sans-serif; letter-spacing: -0.04em; }
        .hero-clock span { color: var(--text-secondary); font-size: 10px; font-weight: 800; letter-spacing: 0.08em; }
        .hero-weather { min-width: 128px; padding-left: 18px; display: grid; grid-template-columns: 34px auto; align-items: center; gap: 9px; border-left: 1px solid var(--border-default); }
        .hero-weather-symbol { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: var(--primary-soft); color: var(--primary); font-size: 19px; }
        .hero-weather-copy small, .hero-weather-copy strong { display: block; white-space: nowrap; }
        .hero-weather-copy small { color: var(--text-secondary); font-size: 9px; font-weight: 700; }
        .hero-weather-copy strong { margin-top: 3px; font: 800 17px/1 Outfit, Inter, Arial, sans-serif; }

        .zone-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
        .zone-card { min-height: 92px; padding: 14px; display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; align-items: center; gap: 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--surface); }
        .zone-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; color: var(--text-tertiary); background: var(--surface-control); }
        .zone-card.is-on .zone-icon { color: var(--primary); background: var(--primary-soft); }
        .zone-copy strong, .zone-copy small { display: block; }
        .zone-copy strong { font-size: 13px; font-weight: 800; }
        .zone-copy small { margin-top: 4px; color: var(--text-secondary); font-size: 10px; }
        .zone-count { font: 800 24px/1 Outfit, Inter, sans-serif; color: var(--text-primary); }
        .zone-count small { color: var(--text-tertiary); font-size: 11px; }

        .content-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr); gap: 14px; margin-top: 14px; align-items: start; }
        .actions-card, .daily-card { padding: 16px; }
        .section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
        .eyebrow { display: block; margin-bottom: 5px; color: var(--primary); font-size: 9px; font-weight: 850; letter-spacing: 0.14em; text-transform: uppercase; }
        .section-heading h2, .danger-card h2, .dialog-card h2 { margin: 0; font: 800 20px/1.12 Outfit, Inter, Arial, sans-serif; letter-spacing: -0.02em; }
        .system-summary { padding: 7px 10px; border-radius: var(--radius-pill); color: var(--text-secondary); background: var(--surface-control); font-size: 10px; font-weight: 750; }
        .action-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .daily-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .action-button {
          position: relative;
          min-height: 112px;
          padding: 14px;
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          gap: 8px 12px;
          text-align: left;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          background: var(--surface-control);
          cursor: pointer;
          transition: background var(--motion), border-color var(--motion), transform var(--motion), box-shadow var(--motion);
        }
        .action-button:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--primary-border); transform: translateY(-1px); }
        .action-button.is-active { border-color: var(--primary-border); background: var(--surface-active); box-shadow: inset 0 0 0 1px rgba(242,101,34,.08); }
        .action-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; color: var(--primary); background: var(--primary-soft); }
        .action-copy strong, .action-copy small { display: block; }
        .action-copy strong { font-size: 13px; font-weight: 850; }
        .action-copy small { margin-top: 4px; color: var(--text-secondary); font-size: 10px; line-height: 1.35; }
        .action-state { grid-column: 1 / -1; justify-self: start; padding: 5px 8px; border-radius: var(--radius-pill); color: var(--text-tertiary); background: var(--surface); font-size: 9px; font-weight: 800; }
        .action-button.is-active .action-state { color: var(--primary); background: var(--primary-soft); }
        .tone-off .action-icon { color: var(--warning); background: rgba(245,158,11,.11); }
        .tone-day .action-icon { color: var(--info); background: rgba(56,189,248,.11); }

        .danger-card { margin-top: 14px; padding: 18px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-color: var(--error-border); background: linear-gradient(135deg, var(--error-soft), var(--surface)); }
        .danger-copy { min-width: 0; display: flex; align-items: center; gap: 14px; }
        .danger-copy p { margin: 7px 0 5px; color: var(--text-secondary); font-size: 11px; line-height: 1.45; }
        .danger-copy small { color: var(--text-tertiary); font-size: 9px; font-weight: 700; }
        .danger-icon { flex: 0 0 auto; width: 52px; height: 52px; display: grid; place-items: center; border-radius: 16px; color: var(--error); background: rgba(239,68,68,.13); }
        .danger-icon svg { width: 28px; height: 28px; }
        .danger-eyebrow { color: var(--error); }
        .danger-button { min-height: 48px; padding: 0 18px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; border: 1px solid var(--error-border); border-radius: 14px; color: #fff; background: #b91c1c; cursor: pointer; font-size: 11px; }
        .danger-button:hover:not(:disabled) { background: #991b1b; }
        .danger-button svg { width: 18px; height: 18px; }

        .dialog-backdrop { position: fixed; inset: 0; z-index: 100; padding: 18px; display: grid; place-items: center; background: var(--overlay); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .dialog-card { width: min(620px, 100%); max-height: calc(100vh - 36px); overflow: auto; padding: 24px; border: 1px solid var(--error-border); border-radius: 24px; background: var(--modal); box-shadow: 0 28px 80px var(--shadow-strong); }
        .dialog-icon { width: 54px; height: 54px; margin-bottom: 14px; display: grid; place-items: center; border-radius: 17px; color: var(--error); background: var(--error-soft); }
        .dialog-card > p { margin: 10px 0 16px; color: var(--text-secondary); font-size: 12px; line-height: 1.55; }
        .impact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 14px 0; }
        .impact-grid > span { padding: 10px; display: grid; grid-template-columns: 28px 1fr; gap: 2px 9px; align-items: center; border: 1px solid var(--border-default); border-radius: 12px; background: var(--surface-control); }
        .impact-grid svg { grid-row: 1 / span 2; width: 20px; height: 20px; color: var(--error); }
        .impact-grid strong { font-size: 10px; }
        .impact-grid small { color: var(--text-tertiary); font-size: 9px; }
        .dialog-actions { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; margin-top: 18px; }
        .secondary-button, .critical-button { min-height: 46px; border-radius: 13px; cursor: pointer; font-size: 11px; font-weight: 800; }
        .secondary-button { border: 1px solid var(--border-default); background: var(--surface-control); }
        .critical-button { border: 1px solid var(--error-border); color: #fff; background: #b91c1c; }
        .critical-button:hover:not(:disabled) { background: #991b1b; }

        .toast { position: fixed; right: 18px; bottom: 18px; z-index: 120; width: min(420px, calc(100vw - 36px)); padding: 13px 15px; border: 1px solid var(--border-default); border-radius: 14px; color: var(--text-primary); background: var(--modal); box-shadow: 0 18px 50px var(--shadow-strong); font-size: 11px; font-weight: 750; }
        .toast.success { border-color: rgba(34,197,94,.45); }
        .toast.warning { border-color: rgba(245,158,11,.50); }
        .toast.error { border-color: var(--error-border); }

        @media (max-width: 1080px) {
          .zone-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .content-grid { grid-template-columns: 1fr; }
          .daily-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr; gap: 12px; }
          .hero-copy { padding-bottom: 10px; border-bottom: 1px solid var(--border-subtle); }
          .hero-copy h1 { font-size: clamp(22px, 5.5vw, 30px); }
          .hero-status { width: 100%; justify-content: space-between; }
          .hero-clock strong { font-size: 26px; }
          .hero-weather { padding-left: 0; border-left: 0; }
          .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .danger-card { align-items: stretch; flex-direction: column; }
          .danger-button { width: 100%; }
        }
        @media (max-width: 520px) {
          .logo-frame { width: 104px; }
          .zone-grid, .action-grid, .daily-grid, .impact-grid { grid-template-columns: 1fr; }
          .zone-card { min-height: 82px; }
          .action-button { min-height: 104px; }
          .hero-status { align-items: flex-start; flex-direction: column; gap: 10px; }
          .dialog-card { padding: 20px; }
          .dialog-actions { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; }
        }
        @media (max-width: 760px), (prefers-reduced-transparency: reduce) {
          .surface, .topbar, .dialog-backdrop { backdrop-filter: none; -webkit-backdrop-filter: none; }
        }
      </style>

      <div class="app-shell">
        <header class="topbar">
          <div class="topbar-start">
            <button class="menu-button" data-action="toggle-menu" aria-label="Abrir menú de Home Assistant" title="Abrir menú">${MENU_ICON}</button>
            <div class="logo-frame"><img src="${this._escape(config.logo)}" alt="Witmind"></div>
          </div>
          <button class="theme-button" data-action="toggle-theme" aria-label="Cambiar a tema ${nextTheme}" title="Cambiar a tema ${nextTheme}">${THEME_ICON}</button>
        </header>

        <main class="dashboard">
          <section class="surface hero-card">
            <div class="hero-copy">
              <h1>${this._escape(config.title)} <span>Witmind</span></h1>
              <p>${this._escape(config.subtitle)} · ${this._escape(config.siteLabel)}</p>
            </div>
            <div class="hero-status">
              <time class="hero-clock"><strong data-clock-time>--:--</strong><span data-clock-period>--</span></time>
              <div class="hero-weather" aria-label="Clima actual">
                <span class="hero-weather-symbol">${this._escape(CONDITION_SYMBOLS[condition] || "·")}</span>
                <span class="hero-weather-copy">
                  <small>${this._escape(CONDITION_LABELS[condition] || condition || "Sin datos")}</small>
                  <strong>${this._escape(weatherAttrs.temperature ?? "—")}${this._escape(weatherAttrs.temperature_unit ?? "°")}</strong>
                </span>
              </div>
            </div>
          </section>

          ${this._renderDanger(config)}

          <section class="zone-grid">${config.zones.map((zone) => this._renderZone(zone)).join("")}</section>

          <section class="content-grid">
            <section class="surface actions-card">
              <div class="section-heading">
                <div><span class="eyebrow">Acceso directo</span><h2>Escenas principales</h2></div>
                <span class="system-summary">${totalStatus.on}/${totalStatus.total} circuitos encendidos${totalStatus.unavailable ? ` · ${totalStatus.unavailable} sin datos` : ""}</span>
              </div>
              <div class="action-grid">${config.mainActions.map((action) => this._renderActionButton(action)).join("")}</div>
            </section>

            <section class="surface daily-card">
              <div class="section-heading"><div><span class="eyebrow">Rutina operativa</span><h2>Inicio y fin de día</h2></div></div>
              <div class="daily-grid">${config.dailyActions.map((action) => this._renderActionButton(action)).join("")}</div>
            </section>
          </section>
        </main>
      </div>

      ${this._renderConfirmDialog(config)}
      ${this._toast ? `<div class="toast ${this._escape(this._toast.type)}" role="status">${this._escape(this._toast.message)}</div>` : ""}
    `;

    this._updateClock();
  }
}

if (!customElements.get("control-general-panel")) {
  customElements.define("control-general-panel", ControlGeneralPanel);
  console.info("Witmind Control General Panel v1.3.1 registrado");
}
