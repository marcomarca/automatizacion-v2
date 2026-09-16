// Witmind Notifications Panel v1.0.7
// Estilo visual alineado con oficinas-panel.js.
// v1.0.7: nombres amigables persistentes por identidad interna del dispositivo.

const WITMIND_NOTIFICATIONS_DOMAIN = "witmind_notifications";
const WITMIND_NOTIFICATIONS_PANEL_VERSION = "1.0.7";

const NOTIFICATION_ICONS = {
  menu: '<path d="M3 6.5h18M3 12h18M3 17.5h18"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
  phone: '<path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h4"/>',
  sensor: '<path d="M12 3v10m0 0a4 4 0 1 0 4 4 4 4 0 0 0-4-4Zm3-7h3M15 9h2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M20 6v5h-5M4 18v-5h5M6.1 9A7 7 0 0 1 18 6l2 5M4 13l2 5a7 7 0 0 0 11.9-3"/>',
  edit: '<path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm9.5-12.5 3 3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  warning: '<path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 2"/>',
  theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  send: '<path d="m3 11 18-8-8 18-2-8-8-2Zm8 2 5-5"/>',
};

class NotificationsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._started = false;
    this._loading = false;
    this._error = "";
    this._rules = [];
    this._targets = [];
    this._sensors = [];
    this._history = [];
    this._tab = "rules";
    this._editorOpen = false;
    this._editorStep = 1;
    this._editingId = null;
    this._draft = null;
    this._deleteId = null;
    this._renameTargetId = null;
    this._renameValue = "";
    this._renameError = "";
    this._busy = "";
    this._editorError = "";
    this._deleteError = "";
    this._renderQueued = false;
    this._renderDeferred = false;
    this._renderRaf = 0;
    this._toast = null;
    this._toastTimer = null;
    this._countdownTimer = null;
    this._backendRefreshTimer = null;
    this._unsubscribeBackendEvents = null;
    this._themeStorageKey = "witmind-oficinas-panel-theme";
    this._theme = this._loadTheme();

    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("change", (event) => this._handleChange(event));
    this.shadowRoot.addEventListener("input", (event) => this._handleInput(event));
  }

  set hass(value) {
    const previousView = this._relevantStateSignature(this._hass);
    this._hass = value;
    const currentView = this._relevantStateSignature(value);

    if (!this._started && value) {
      this._started = true;
      this._subscribeBackendEvents();
      this._startCountdownTimer();
      this._loadAll();
      return;
    }

    // Home Assistant sustituye el objeto hass con mucha frecuencia. Solo
    // reconstruimos la vista si cambió un sensor que realmente muestra el panel.
    // El backend emite un evento propio cuando una regla entra en temporización,
    // dispara o se recupera; así el estado visible no queda obsoleto.
    if (value && previousView !== currentView) this._requestRender();
  }
  get hass() { return this._hass; }

  set panel(value) {
    this._panel = value;
    if (this._hass) this._requestRender();
  }
  get panel() { return this._panel; }

  set narrow(value) {
    this._narrow = Boolean(value);
    this.toggleAttribute("narrow", this._narrow);
  }
  get narrow() { return this._narrow; }

  connectedCallback() {
    this.setAttribute("data-panel-version", WITMIND_NOTIFICATIONS_PANEL_VERSION);
    if (!this._versionLogged) {
      this._versionLogged = true;
      console.info(`[Witmind Notifications] frontend v${WITMIND_NOTIFICATIONS_PANEL_VERSION} cargado`);
    }
    if (this._hass) {
      this._subscribeBackendEvents();
      this._startCountdownTimer();
    }
  }

  disconnectedCallback() {
    clearTimeout(this._toastTimer);
    clearTimeout(this._backendRefreshTimer);
    clearInterval(this._countdownTimer);
    this._backendRefreshTimer = null;
    this._countdownTimer = null;
    if (this._unsubscribeBackendEvents) {
      this._unsubscribeBackendEvents();
      this._unsubscribeBackendEvents = null;
    }
    if (this._renderRaf) cancelAnimationFrame(this._renderRaf);
    this._renderRaf = 0;
    this._renderQueued = false;
  }

  async _subscribeBackendEvents() {
    if (!this._hass?.connection || this._unsubscribeBackendEvents) return;
    try {
      const unsubscribe = await this._hass.connection.subscribeEvents(
        () => this._scheduleBackendRefresh(),
        "witmind_notifications_updated",
      );
      this._unsubscribeBackendEvents = unsubscribe;
    } catch (error) {
      console.warn("Witmind Notifications: no se pudo suscribir a eventos del backend", error);
    }
  }

  _scheduleBackendRefresh() {
    clearTimeout(this._backendRefreshTimer);
    this._backendRefreshTimer = setTimeout(() => {
      this._backendRefreshTimer = null;
      this._refreshRuntimeData();
    }, 80);
  }

  async _refreshRuntimeData() {
    if (!this._hass) return;
    try {
      const [rules, history] = await Promise.all([
        this._ws("rules/list"),
        this._ws("history/list", { limit: 150 }),
      ]);
      this._rules = Array.isArray(rules) ? rules : this._rules;
      this._history = Array.isArray(history) ? history : this._history;
      this._requestRender();
    } catch (error) {
      console.warn("Witmind Notifications: no se pudo refrescar el estado de reglas", error);
    }
  }

  _startCountdownTimer() {
    if (this._countdownTimer) return;
    this._countdownTimer = setInterval(() => this._updatePendingCountdowns(), 1000);
  }

  _updatePendingCountdowns() {
    const now = Date.now();
    const formatRemaining = (timestamp, expiredText = "procesando…") => {
      const due = Date.parse(timestamp || "");
      if (!Number.isFinite(due)) return "";
      const remaining = Math.max(0, due - now);
      if (remaining <= 0) return expiredText;
      const totalSeconds = Math.ceil(remaining / 1000);
      if (totalSeconds >= 3600) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours} h ${minutes} min`;
      }
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      return `${minutes}:${seconds}`;
    };

    for (const node of this.shadowRoot?.querySelectorAll("[data-pending-until]") || []) {
      node.textContent = formatRemaining(node.dataset.pendingUntil, "procesando…");
    }
    for (const node of this.shadowRoot?.querySelectorAll("[data-reminder-at]") || []) {
      node.textContent = formatRemaining(node.dataset.reminderAt, "ahora");
    }
    for (const node of this.shadowRoot?.querySelectorAll("[data-retry-at]") || []) {
      node.textContent = formatRemaining(node.dataset.retryAt, "ahora");
    }
  }

  _config() {
    const raw = this._panel?.config || {};
    const preferred = Array.isArray(raw.preferred_sensors) ? raw.preferred_sensors : [];
    return {
      title: raw.title || "Notificaciones Witmind",
      subtitle: raw.subtitle || "Alertas de sensores",
      siteLabel: raw.site_label || raw.siteLabel || "WTX · MDTC",
      logo: raw.logo || "/local/logo-witmind.png?v=2.0.0",
      preferredSensors: preferred
        .filter((item) => item?.entity_id)
        .map((item) => ({ entity_id: String(item.entity_id), name: item.name || item.entity_id })),
    };
  }

  _relevantStateSignature(hass) {
    if (!hass?.states) return "";
    const entityIds = new Set();
    for (const rule of this._rules || []) {
      if (rule?.source?.entity_id) entityIds.add(rule.source.entity_id);
    }
    if (this._draft?.source?.entity_id) entityIds.add(this._draft.source.entity_id);

    return JSON.stringify([...entityIds].sort().map((entityId) => {
      const state = hass.states?.[entityId];
      return [
        entityId,
        state?.state ?? "missing",
        state?.attributes?.unit_of_measurement ?? "",
        state?.last_changed ?? "",
      ];
    }));
  }

  _hasLiveInteraction() {
    return Boolean(
      this.shadowRoot?.querySelector(".editor-backdrop [data-editor-card]") ||
      this.shadowRoot?.querySelector(".dialog-backdrop [data-delete-card]") ||
      this.shadowRoot?.querySelector(".rename-backdrop [data-rename-card]")
    );
  }

  _requestRender() {
    if (!this.shadowRoot) return;

    // render() reemplaza shadowRoot.innerHTML completo. Mientras un formulario,
    // select, checkbox o diálogo está siendo usado, un nuevo objeto hass no puede
    // destruir esos nodos ni robar el foco. El refresco queda pendiente.
    if (this._hasLiveInteraction()) {
      this._renderDeferred = true;
      this._syncOverlayBusyState();
      return;
    }

    if (this._renderQueued) return;
    this._renderQueued = true;
    this._renderRaf = requestAnimationFrame(() => {
      this._renderQueued = false;
      this._renderRaf = 0;
      this.render();
    });
  }

  _forceRender() {
    if (this._renderRaf) cancelAnimationFrame(this._renderRaf);
    this._renderRaf = 0;
    this._renderQueued = false;
    this._renderDeferred = false;
    this.render(true);
  }

  _syncOverlayBusyState() {
    const editor = this.shadowRoot?.querySelector("[data-editor-card]");
    if (editor) {
      const close = editor.querySelector('[data-action="close-editor"]');
      const back = editor.querySelector('[data-action="editor-back"]');
      const next = editor.querySelector('[data-action="editor-next"]');
      const save = editor.querySelector('[data-action="save-rule"]');
      if (close) close.disabled = Boolean(this._busy);
      if (back) back.disabled = Boolean(this._busy);
      if (next) next.disabled = Boolean(this._busy);
      if (save) {
        save.disabled = Boolean(this._busy);
        save.innerHTML = this._busy === "save" ? "Guardando…" : `${this._icon("check")} Guardar regla`;
      }
    }

    const dialog = this.shadowRoot?.querySelector("[data-delete-card]");
    if (dialog) {
      const cancel = dialog.querySelector('[data-action="cancel-delete"]');
      const confirm = dialog.querySelector('[data-action="confirm-delete"]');
      if (cancel) cancel.disabled = Boolean(this._busy);
      if (confirm) {
        confirm.disabled = Boolean(this._busy);
        confirm.textContent = this._busy === "delete" ? "Eliminando…" : "Eliminar";
      }
    }

    const rename = this.shadowRoot?.querySelector("[data-rename-card]");
    if (rename) {
      for (const button of rename.querySelectorAll("button")) button.disabled = Boolean(this._busy);
      const input = rename.querySelector('[data-field="device-alias"]');
      if (input) input.disabled = Boolean(this._busy);
      const save = rename.querySelector('[data-action="save-target-alias"]');
      if (save) save.textContent = this._busy.startsWith("alias:") ? "Guardando…" : "Guardar nombre";
    }
  }

  _showEditorError(message) {
    this._editorError = message || "";
    const box = this.shadowRoot?.querySelector("[data-editor-error]");
    if (!box) return;
    box.textContent = this._editorError;
    box.hidden = !this._editorError;
  }

  _showDeleteError(message) {
    this._deleteError = message || "";
    const box = this.shadowRoot?.querySelector("[data-delete-error]");
    if (!box) return;
    box.textContent = this._deleteError;
    box.hidden = !this._deleteError;
  }

  _syncEditorPreview() {
    if (!this._draft) return;
    const logic = this.shadowRoot?.querySelector("[data-logic-preview-text]");
    if (logic) logic.textContent = this._conditionSummary();

    const sensor = this._sensor(this._draft.source?.entity_id);
    const live = this._liveSensorValue(sensor);
    const title = this.shadowRoot?.querySelector("[data-message-preview-title]");
    const body = this.shadowRoot?.querySelector("[data-message-preview-body]");
    if (title) title.textContent = this._draft.message.title || this._draft.name || "Notificación";
    if (body) {
      body.textContent = (this._draft.message.body || "")
        .replaceAll("{sensor}", this._draft.source.display_name || "Sensor")
        .replaceAll("{value}", live.value != null ? Number(live.value).toFixed(1) : "28.4")
        .replaceAll("{unit}", live.unit || "°C")
        .replaceAll("{threshold}", String(this._draft.condition.threshold ?? `${this._draft.condition.lower}–${this._draft.condition.upper}`))
        .replaceAll("{area}", this._draft.source.area_name || "")
        .replaceAll("{time}", "09:30");
    }
  }

  _ws(type, extra = {}) {
    return this._hass.connection.sendMessagePromise({ type: `${WITMIND_NOTIFICATIONS_DOMAIN}/${type}`, ...extra });
  }

  async _loadAll(showLoading = true) {
    if (!this._hass || this._loading) return;
    this._loading = true;
    this._error = "";
    if (showLoading) this._requestRender();
    try {
      const [rules, targets, sensors, history] = await Promise.all([
        this._ws("rules/list"),
        this._ws("targets/list"),
        this._ws("sensors/list"),
        this._ws("history/list", { limit: 150 }),
      ]);
      this._rules = Array.isArray(rules) ? rules : [];
      this._targets = Array.isArray(targets) ? targets : [];
      this._sensors = Array.isArray(sensors) ? sensors : [];
      this._history = Array.isArray(history) ? history : [];
    } catch (error) {
      console.error("Witmind Notifications: no se pudo cargar el backend", error);
      this._error = this._errorText(error) || "No se pudo conectar con witmind_notifications.";
    } finally {
      this._loading = false;
      this._requestRender();
    }
  }

  _preferredSensors() {
    const config = this._config();
    const preferredMap = new Map(config.preferredSensors.map((item, index) => [item.entity_id, { ...item, index }]));
    return this._sensors
      .map((sensor) => {
        const preferred = preferredMap.get(sensor.entity_id);
        return {
          ...sensor,
          display_name: preferred?.name || sensor.name,
          preferred: Boolean(preferred),
          preferredIndex: preferred?.index ?? 9999,
        };
      })
      .sort((a, b) => {
        if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
        if (a.preferred && b.preferred) return a.preferredIndex - b.preferredIndex;
        return String(a.display_name).localeCompare(String(b.display_name), "es");
      });
  }

  _sensor(entityId) {
    return this._preferredSensors().find((item) => item.entity_id === entityId) || null;
  }

  _target(keyOrEntity) {
    return this._targets.find((item) => item.target_id === keyOrEntity || item.key === keyOrEntity || item.notify_entity_id === keyOrEntity || item.legacy_service === keyOrEntity) || null;
  }

  _liveSensorValue(sensor) {
    if (!sensor) return { value: null, raw: "—", unit: "°C", available: false };
    const state = this._hass?.states?.[sensor.entity_id];
    if (!state) return { value: sensor.value, raw: sensor.raw_value ?? "—", unit: sensor.unit || "°C", available: sensor.available };
    const value = Number(state.state);
    return {
      value: Number.isFinite(value) ? value : null,
      raw: state.state,
      unit: state.attributes?.unit_of_measurement || sensor.unit || "°C",
      available: Number.isFinite(value) && !["unknown", "unavailable"].includes(state.state),
    };
  }

  _newDraft() {
    const firstSensor = this._preferredSensors()[0] || null;
    return {
      name: firstSensor ? `Temperatura · ${firstSensor.display_name}` : "Nueva alerta de temperatura",
      enabled: true,
      source: {
        entity_id: firstSensor?.entity_id || "",
        display_name: firstSensor?.display_name || "",
        area_name: firstSensor?.area_name || "",
      },
      condition: {
        type: "above",
        threshold: 28,
        lower: 18,
        upper: 28,
        for_seconds: 300,
        hysteresis: 0.5,
      },
      recipients: [],
      message: {
        title: "Alerta de temperatura",
        body: "{sensor} alcanzó {value} {unit}. Umbral configurado: {threshold} {unit}.",
      },
      behavior: {
        notification_mode: "once",
        // Se conserva un valor cómodo para cuando el usuario cambie a “Repetir”.
        // En modo once el backend lo normaliza a 0 y no programa recordatorios.
        reminder_interval_seconds: 1800,
        notify_recovery: false,
      },
    };
  }

  _notificationMode(behavior = {}) {
    const explicit = String(behavior?.notification_mode || "");
    if (["once", "repeat", "daily"].includes(explicit)) return explicit;
    // Compatibilidad con reglas v1.0.3–v1.0.5: si tenían intervalo,
    // se interpretan como recordatorios repetidos; el antiguo rearme se ignora.
    const seconds = Number(behavior?.reminder_interval_seconds ?? behavior?.cooldown_seconds ?? 0);
    return seconds > 0 ? "repeat" : "once";
  }

  _draftFromRule(rule) {
    return JSON.parse(JSON.stringify({
      name: rule.name,
      enabled: rule.enabled !== false,
      source: rule.source || {},
      condition: {
        type: rule.condition?.type || "above",
        threshold: rule.condition?.threshold ?? 28,
        lower: rule.condition?.lower ?? 18,
        upper: rule.condition?.upper ?? 28,
        for_seconds: rule.condition?.for_seconds ?? 300,
        hysteresis: rule.condition?.hysteresis ?? 0.5,
      },
      recipients: rule.recipients || [],
      message: {
        title: rule.message?.title || rule.name,
        body: rule.message?.body || "{sensor}: {value} {unit}",
      },
      behavior: {
        notification_mode: this._notificationMode(rule.behavior),
        reminder_interval_seconds: Number(rule.behavior?.reminder_interval_seconds ?? rule.behavior?.cooldown_seconds ?? 0) > 0
          ? Number(rule.behavior?.reminder_interval_seconds ?? rule.behavior?.cooldown_seconds)
          : 1800,
        notify_recovery: rule.behavior?.notify_recovery === true,
      },
    }));
  }

  _handleInput(event) {
    const field = event.target?.dataset?.field;
    if (!field) return;
    const value = event.target.value;
    if (field === "device-alias") {
      this._renameValue = value;
      const error = this.shadowRoot?.querySelector("[data-rename-error]");
      if (error) { error.textContent = ""; error.hidden = true; }
      return;
    }
    if (!this._draft) return;
    if (field === "rule-name") this._draft.name = value;
    if (field === "threshold") this._draft.condition.threshold = value;
    if (field === "lower") this._draft.condition.lower = value;
    if (field === "upper") this._draft.condition.upper = value;
    if (field === "for-minutes") this._draft.condition.for_seconds = Math.max(0, Number(value || 0) * 60);
    if (field === "hysteresis") this._draft.condition.hysteresis = value;
    if (field === "reminder-minutes") this._draft.behavior.reminder_interval_seconds = Math.max(0, Number(value || 0) * 60);
    if (field === "message-title") this._draft.message.title = value;
    if (field === "message-body") this._draft.message.body = value;
    this._showEditorError("");
    this._syncEditorPreview();
  }

  _handleChange(event) {
    if (!this._draft || !event.target?.dataset?.field) return;
    const field = event.target.dataset.field;
    this._showEditorError("");

    if (field === "sensor") {
      const sensor = this._sensor(event.target.value);
      this._draft.source = {
        entity_id: sensor?.entity_id || event.target.value,
        display_name: sensor?.display_name || event.target.value,
        area_name: sensor?.area_name || "",
      };
      if (!this._editingId && sensor) this._draft.name = `Temperatura · ${sensor.display_name}`;
      // Cambio estructural explícito del editor: se permite un render forzado.
      this._forceRender();
    } else if (field === "condition-type") {
      this._draft.condition.type = event.target.value;
      this._forceRender();
    } else if (field === "recipient") {
      const target = this._target(event.target.value);
      if (!target) return;
      const identity = target.target_id || target.key;
      const existing = this._draft.recipients.findIndex((item) =>
        (item.target_id || item.key) === identity ||
        item.device_id && target.device_id && item.device_id === target.device_id ||
        item.notify_entity_id && item.notify_entity_id === target.notify_entity_id ||
        item.legacy_service && item.legacy_service === target.legacy_service
      );
      if (event.target.checked && existing === -1) {
        this._draft.recipients.push({
          key: target.key,
          target_id: target.target_id || target.key,
          identity_keys: Array.isArray(target.identity_keys) ? [...target.identity_keys] : [],
          device_id: target.device_id,
          notify_entity_id: target.notify_entity_id,
          legacy_service: target.legacy_service,
          name: target.name,
          custom_name: target.custom_name || null,
        });
      } else if (!event.target.checked && existing !== -1) {
        this._draft.recipients.splice(existing, 1);
      }
      // No reconstruir el modal por un checkbox: basta actualizar la card in-place.
      event.target.closest(".target-option")?.classList.toggle("selected", event.target.checked);
    } else if (field === "notification-mode") {
      this._draft.behavior.notification_mode = ["once", "repeat", "daily"].includes(event.target.value)
        ? event.target.value
        : "once";
      if (this._draft.behavior.notification_mode === "repeat" && Number(this._draft.behavior.reminder_interval_seconds || 0) <= 0) {
        this._draft.behavior.reminder_interval_seconds = 1800;
      }
      this._forceRender();
      return;
    } else if (field === "notify-recovery") {
      this._draft.behavior.notify_recovery = event.target.checked;
    } else if (field === "enabled") {
      this._draft.enabled = event.target.checked;
    }
    this._syncEditorPreview();
  }

  _helpContent(topic) {
    const items = {
      duration: {
        title: "¿Qué significa “Durante”?",
        text: "Es el tiempo que la condición debe mantenerse de forma continua antes del primer aviso.",
        example: "Ejemplo: ≥ 21 °C durante 2 min. Si llega a 21 °C pero baja antes de completar 2 minutos, no se envía nada y el conteo vuelve a empezar cuando alcance nuevamente 21 °C.",
      },
      hysteresis: {
        title: "¿Qué es la histéresis?",
        text: "Es un margen usado solo para decidir cuándo una incidencia ya terminó. Evita que una temperatura que oscila alrededor del umbral abra y cierre alertas repetidamente.",
        example: "Ejemplo: alerta ≥ 21 °C con histéresis 0,5 °C. La alerta empieza en 21 °C, pero no se considera resuelta hasta bajar a 20,5 °C o menos. Entre 20,5 y 21 °C sigue siendo la misma incidencia.",
      },
      frequency: {
        title: "Frecuencia de avisos",
        text: "La frecuencia solo controla qué ocurre después del primer aviso mientras la misma incidencia continúa activa.",
        example: "Una vez por incidencia: un solo aviso. Repetir: vuelve a avisar cada X minutos. Cada 24 h: si el problema sigue activo 24 horas después, envía otro recordatorio. Al resolverse, cualquier opción queda lista automáticamente para una incidencia nueva.",
      },
      recovery: {
        title: "Aviso al volver a la normalidad",
        text: "Es un mensaje adicional de cierre. No controla el rearme ni los recordatorios.",
        example: "Ejemplo: recibes una alerta por temperatura alta. Cuando baja hasta el valor de recuperación definido por la histéresis, puedes recibir otro mensaje indicando que la situación volvió a la normalidad. La regla queda rearmada automáticamente aunque esta opción esté desactivada.",
      },
    };
    return items[topic] || null;
  }

  _openHelp(topic) {
    const content = this._helpContent(topic);
    const editor = this.shadowRoot?.querySelector("[data-editor-card]");
    if (!content || !editor) return;
    this._closeHelp();
    const overlay = document.createElement("div");
    overlay.className = "help-backdrop";
    overlay.dataset.action = "close-help";
    overlay.innerHTML = `<section class="help-card" data-help-card role="dialog" aria-modal="true" aria-label="${this._escape(content.title)}">
      <div class="help-symbol">?</div>
      <div class="help-copy"><h3>${this._escape(content.title)}</h3><p>${this._escape(content.text)}</p><div class="help-example"><strong>Ejemplo sencillo</strong><span>${this._escape(content.example)}</span></div></div>
      <button type="button" class="icon-button compact" data-action="close-help" aria-label="Cerrar ayuda">${this._icon("close")}</button>
    </section>`;
    editor.appendChild(overlay);
  }

  _closeHelp() {
    this.shadowRoot?.querySelector(".help-backdrop")?.remove();
  }

  _openTargetRename(target) {
    if (!target) return;
    this._renameTargetId = target.target_id || target.key;
    this._renameValue = target.custom_name || "";
    this._renameError = "";
    this._forceRender();
  }

  _closeTargetRename() {
    if (this._busy.startsWith("alias:")) return;
    this._renameTargetId = null;
    this._renameValue = "";
    this._renameError = "";
    this._forceRender();
  }

  async _saveTargetAlias(clear = false) {
    const target = this._target(this._renameTargetId);
    if (!target || this._busy) return;
    const alias = clear ? "" : String(this._renameValue || "").trim().replace(/\s+/g, " ");
    if (!clear && !alias) {
      this._renameError = "Escribe un nombre o usa “Restaurar nombre de Home Assistant”.";
      const box = this.shadowRoot?.querySelector("[data-rename-error]");
      if (box) { box.textContent = this._renameError; box.hidden = false; }
      return;
    }
    if (alias.length > 80) {
      this._renameError = "El nombre puede tener como máximo 80 caracteres.";
      const box = this.shadowRoot?.querySelector("[data-rename-error]");
      if (box) { box.textContent = this._renameError; box.hidden = false; }
      return;
    }

    this._busy = `alias:${target.target_id || target.key}`;
    this._syncOverlayBusyState();
    try {
      await this._ws("targets/alias/set", {
        target_id: target.target_id || target.key,
        alias,
      });
      const [targets, rules] = await Promise.all([
        this._ws("targets/list"),
        this._ws("rules/list"),
      ]);
      this._targets = Array.isArray(targets) ? targets : this._targets;
      this._rules = Array.isArray(rules) ? rules : this._rules;
      this._renameTargetId = null;
      this._renameValue = "";
      this._renameError = "";
      this._showToast(clear ? "Se restauró el nombre de Home Assistant." : "Nombre amigable guardado.");
    } catch (error) {
      this._renameError = this._errorText(error) || "No se pudo guardar el nombre.";
      const box = this.shadowRoot?.querySelector("[data-rename-error]");
      if (box) { box.textContent = this._renameError; box.hidden = false; }
    } finally {
      this._busy = "";
      if (this._renameTargetId) this._syncOverlayBusyState();
      else this._forceRender();
    }
  }

  async _handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target || !this._hass) return;
    const action = target.dataset.action;

    if (action === "open-help") {
      this._openHelp(target.dataset.help);
      return;
    }
    if (action === "close-help") {
      if (target.classList.contains("help-backdrop") && event.target.closest("[data-help-card]")) return;
      this._closeHelp();
      return;
    }

    if (action === "toggle-menu") {
      this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
      return;
    }
    if (action === "toggle-theme") {
      this._theme = this._theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(this._themeStorageKey, this._theme); } catch (_) {}
      this.setAttribute("data-theme", this._theme);
      return;
    }
    if (action === "tab") {
      this._tab = target.dataset.tab;
      this._requestRender();
      return;
    }
    if (action === "refresh") {
      await this._loadAll();
      return;
    }
    if (action === "new-rule") {
      this._editingId = null;
      this._draft = this._newDraft();
      this._editorStep = 1;
      this._editorOpen = true;
      this._editorError = "";
      this._forceRender();
      return;
    }
    if (action === "edit-rule") {
      const rule = this._rules.find((item) => item.id === target.dataset.id);
      if (!rule) return;
      this._editingId = rule.id;
      this._draft = this._draftFromRule(rule);
      this._editorStep = 1;
      this._editorOpen = true;
      this._editorError = "";
      this._forceRender();
      return;
    }
    if (action === "close-editor") {
      if (target.classList.contains("editor-backdrop") && event.target.closest("[data-editor-card]")) return;
      if (this._busy) return;
      this._editorOpen = false;
      this._draft = null;
      this._editingId = null;
      this._editorError = "";
      this._forceRender();
      return;
    }
    if (action === "editor-back") {
      this._editorStep = Math.max(1, this._editorStep - 1);
      this._editorError = "";
      this._forceRender();
      return;
    }
    if (action === "editor-next") {
      const error = this._validateStep(this._editorStep);
      if (error) {
        this._showEditorError(error);
        return;
      }
      this._editorStep = Math.min(4, this._editorStep + 1);
      this._editorError = "";
      this._forceRender();
      return;
    }
    if (action === "save-rule") {
      await this._saveRule();
      return;
    }
    if (action === "toggle-rule") {
      await this._toggleRule(target.dataset.id, target.dataset.enabled !== "true");
      return;
    }
    if (action === "delete-rule") {
      this._deleteId = target.dataset.id;
      this._deleteError = "";
      this._forceRender();
      return;
    }
    if (action === "cancel-delete") {
      if (target.classList.contains("dialog-backdrop") && event.target.closest("[data-delete-card]")) return;
      this._deleteId = null;
      this._deleteError = "";
      this._forceRender();
      return;
    }
    if (action === "confirm-delete") {
      await this._deleteRule(this._deleteId);
      return;
    }
    if (action === "rename-target") {
      this._openTargetRename(this._target(target.dataset.key));
      return;
    }
    if (action === "close-target-rename") {
      if (target.classList.contains("rename-backdrop") && event.target.closest("[data-rename-card]")) return;
      this._closeTargetRename();
      return;
    }
    if (action === "save-target-alias") {
      await this._saveTargetAlias(false);
      return;
    }
    if (action === "clear-target-alias") {
      await this._saveTargetAlias(true);
      return;
    }
    if (action === "test-target") {
      const item = this._target(target.dataset.key);
      if (item) await this._testTarget(item);
    }
  }

  _validateStep(step) {
    if (!this._draft) return "No hay una regla en edición.";
    if (step === 1 && !this._draft.source?.entity_id) return "Selecciona un sensor de temperatura.";
    if (step === 2) {
      const c = this._draft.condition;
      if (["above", "below"].includes(c.type) && !Number.isFinite(Number(c.threshold))) return "Introduce un umbral válido.";
      if (["outside", "inside"].includes(c.type)) {
        if (!Number.isFinite(Number(c.lower)) || !Number.isFinite(Number(c.upper))) return "Introduce límites numéricos válidos.";
        if (Number(c.lower) >= Number(c.upper)) return "El límite inferior debe ser menor al superior.";
      }
      if (Number(c.hysteresis) < 0) return "La histéresis no puede ser negativa.";
      const notificationMode = this._draft.behavior?.notification_mode || "once";
      if (!["once", "repeat", "daily"].includes(notificationMode)) return "Selecciona una frecuencia de avisos válida.";
      if (notificationMode === "repeat" && Number(this._draft.behavior?.reminder_interval_seconds || 0) < 60) {
        return "Para repetir avisos, indica un intervalo de al menos 1 minuto.";
      }
    }
    if (step === 3 && !this._draft.recipients.length) return "Selecciona al menos un dispositivo.";
    if (step === 4) {
      if (!String(this._draft.name || "").trim()) return "La regla necesita un nombre.";
      if (!String(this._draft.message?.body || "").trim()) return "El mensaje no puede quedar vacío.";
    }
    return "";
  }

  _normalizedDraft() {
    const draft = JSON.parse(JSON.stringify(this._draft));
    draft.name = String(draft.name || "").trim();
    draft.condition.threshold = Number(draft.condition.threshold);
    draft.condition.lower = Number(draft.condition.lower);
    draft.condition.upper = Number(draft.condition.upper);
    draft.condition.hysteresis = Number(draft.condition.hysteresis || 0);
    draft.condition.for_seconds = Math.max(0, Math.round(Number(draft.condition.for_seconds || 0)));
    draft.behavior.notification_mode = ["once", "repeat", "daily"].includes(draft.behavior.notification_mode)
      ? draft.behavior.notification_mode
      : "once";
    let reminderSeconds = Math.max(0, Math.round(Number(draft.behavior.reminder_interval_seconds ?? draft.behavior.cooldown_seconds ?? 0)));
    if (draft.behavior.notification_mode === "once") reminderSeconds = 0;
    if (draft.behavior.notification_mode === "daily") reminderSeconds = 86400;
    if (draft.behavior.notification_mode === "repeat") reminderSeconds = Math.max(60, reminderSeconds || 1800);
    draft.behavior.reminder_interval_seconds = reminderSeconds;
    draft.behavior.notify_recovery = Boolean(draft.behavior.notify_recovery);
    delete draft.behavior.cooldown_seconds;
    delete draft.behavior.rearm_mode;
    delete draft.behavior.rearm_delay_seconds;
    draft.recipients = draft.recipients.map(({ device_id, notify_entity_id, legacy_service, name }) => ({ device_id, notify_entity_id, legacy_service, name }));
    return draft;
  }

  async _saveRule() {
    for (let step = 1; step <= 4; step += 1) {
      const error = this._validateStep(step);
      if (error) {
        this._editorStep = step;
        this._editorError = error;
        this._forceRender();
        return;
      }
    }

    this._busy = "save";
    this._editorError = "";
    // No reconstruir el editor mientras la petición WebSocket está en curso.
    this._syncOverlayBusyState();
    try {
      const rule = this._normalizedDraft();
      if (this._editingId) {
        await this._ws("rules/update", { rule_id: this._editingId, rule });
      } else {
        await this._ws("rules/create", { rule });
      }
      this._editorOpen = false;
      this._draft = null;
      this._editingId = null;
      this._editorError = "";
      this._renderDeferred = false;
      await this._loadAll(false);
      this._showToast("Regla guardada.", "success");
    } catch (error) {
      this._showEditorError(this._errorText(error) || "No se pudo guardar la regla.");
    } finally {
      this._busy = "";
      if (!this._editorOpen) this._forceRender();
      else this._syncOverlayBusyState();
    }
  }

  async _toggleRule(id, enabled) {
    if (!id || this._busy) return;
    this._busy = `toggle:${id}`;
    this._requestRender();
    try {
      await this._ws("rules/toggle", { rule_id: id, enabled });
      await this._loadAll();
    } catch (error) {
      this._showToast(this._errorText(error) || "No se pudo cambiar el estado.", "error");
    } finally {
      this._busy = "";
      this._requestRender();
    }
  }

  async _deleteRule(id) {
    if (!id || this._busy) return;
    this._busy = "delete";
    this._deleteError = "";
    this._syncOverlayBusyState();
    try {
      await this._ws("rules/delete", { rule_id: id });
      this._deleteId = null;
      this._deleteError = "";
      this._renderDeferred = false;
      await this._loadAll(false);
      this._showToast("Regla eliminada.", "success");
    } catch (error) {
      this._showDeleteError(this._errorText(error) || "No se pudo eliminar la regla.");
    } finally {
      this._busy = "";
      if (!this._deleteId) this._forceRender();
      else this._syncOverlayBusyState();
    }
  }

  async _testTarget(target) {
    if (this._busy) return;
    this._busy = `test:${target.key}`;
    this._requestRender();
    try {
      await this._ws("test", {
        recipient: {
          device_id: target.device_id,
          notify_entity_id: target.notify_entity_id,
          legacy_service: target.legacy_service,
          name: target.name,
        },
        title: "Prueba Witmind",
        message: `Notificación de prueba para ${target.name}.`,
      });
      this._showToast(`Prueba enviada a ${target.name}.`, "success");
      this._history = await this._ws("history/list", { limit: 150 });
    } catch (error) {
      this._showToast(this._errorText(error) || `Falló la prueba para ${target.name}.`, "error");
    } finally {
      this._busy = "";
      this._requestRender();
    }
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

  _errorText(error) {
    return error?.message || error?.body?.message || error?.error?.message || String(error || "");
  }

  _loadTheme() {
    try { return localStorage.getItem(this._themeStorageKey) === "dark" ? "dark" : "light"; }
    catch (_) { return "light"; }
  }

  _icon(name, className = "") {
    return `<svg class="${this._escape(className)}" viewBox="0 0 24 24" aria-hidden="true">${NOTIFICATION_ICONS[name] || NOTIFICATION_ICONS.bell}</svg>`;
  }

  _conditionText(rule) {
    const c = rule.condition || {};
    const dwell = Math.round((Number(c.for_seconds) || 0) / 60);
    const wait = dwell ? ` · ${dwell} min` : "";
    if (c.type === "above") return `≥ ${c.threshold} °C${wait}`;
    if (c.type === "below") return `≤ ${c.threshold} °C${wait}`;
    if (c.type === "outside") return `Fuera de ${c.lower}–${c.upper} °C${wait}`;
    return `Dentro de ${c.lower}–${c.upper} °C${wait}`;
  }

  _conditionSummary(draft = this._draft) {
    if (!draft) return "";
    const c = draft.condition;
    const sensor = draft.source.display_name || draft.source.entity_id || "El sensor";
    const minutes = Math.round(Number(c.for_seconds || 0) / 60);
    const duration = minutes ? ` durante ${minutes} minuto${minutes === 1 ? "" : "s"}` : "";
    const h = Number(c.hysteresis || 0);
    const mode = this._notificationMode(draft.behavior);
    let alerts = " Enviará un solo aviso por incidencia.";
    if (mode === "repeat") {
      const reminderMinutes = Math.max(1, Math.round(Number(draft.behavior?.reminder_interval_seconds || 1800) / 60));
      alerts = ` Mientras la incidencia siga activa, recordará cada ${reminderMinutes} minuto${reminderMinutes === 1 ? "" : "s"}.`;
    } else if (mode === "daily") {
      alerts = " Mientras la incidencia siga activa, enviará como máximo un recordatorio cada 24 horas.";
    }
    const recovery = draft.behavior?.notify_recovery
      ? " También avisará cuando la incidencia se considere resuelta."
      : "";
    const automaticRearm = " Después de resolverse, la regla queda lista automáticamente para detectar una incidencia nueva.";

    let base = "";
    if (c.type === "above") base = `${sensor} activará la alerta al alcanzar o superar ${c.threshold} °C${duration}. Con una histéresis de ${h} °C, se considera resuelta a ${Number(c.threshold) - h} °C o menos.`;
    else if (c.type === "below") base = `${sensor} activará la alerta al alcanzar o bajar de ${c.threshold} °C${duration}. Con una histéresis de ${h} °C, se considera resuelta a ${Number(c.threshold) + h} °C o más.`;
    else if (c.type === "outside") base = `${sensor} activará la alerta al salir de ${c.lower}–${c.upper} °C${duration}.`;
    else base = `${sensor} activará la alerta al entrar en ${c.lower}–${c.upper} °C${duration}.`;
    return `${base}${alerts}${recovery}${automaticRearm}`;
  }

  _reminderIntervalSeconds(rule) {
    const mode = this._notificationMode(rule?.behavior);
    if (mode === "once") return 0;
    if (mode === "daily") return 86400;
    return Math.max(60, Number(rule?.behavior?.reminder_interval_seconds ?? rule?.behavior?.cooldown_seconds ?? 1800));
  }

  _reminderLabel(rule) {
    const mode = this._notificationMode(rule?.behavior);
    if (mode === "once") return "Una vez por incidencia";
    if (mode === "daily") return "Cada 24 h mientras siga activa";
    const minutes = Math.max(1, Math.round(this._reminderIntervalSeconds(rule) / 60));
    return `Cada ${minutes} min mientras siga activa`;
  }

  _recipientSelected(target) {
    return Boolean(this._draft?.recipients?.some((item) =>
      item.target_id && item.target_id === target.target_id ||
      item.device_id && target.device_id && item.device_id === target.device_id ||
      item.notify_entity_id && item.notify_entity_id === target.notify_entity_id ||
      item.legacy_service && item.legacy_service === target.legacy_service
    ));
  }

  _formatDate(value) {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
    } catch (_) { return value; }
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _renderRules() {
    if (!this._rules.length) {
      return `<section class="surface empty-card">
        <div class="empty-icon">${this._icon("bell")}</div>
        <h2>No hay reglas creadas</h2>
        <p>Crea una alerta de temperatura y selecciona uno o varios dispositivos de la integración Aplicación móvil.</p>
        <button class="primary-button" data-action="new-rule">${this._icon("plus")} Crear primera regla</button>
      </section>`;
    }

    return `<div class="rule-list">${this._rules.map((rule) => {
      const sensor = this._sensor(rule.source?.entity_id);
      const live = this._liveSensorValue(sensor);
      const runtime = rule.runtime || {};
      const status = rule.enabled === false
        ? "disabled"
        : runtime.sending
          ? "sending"
          : runtime.retry_at
            ? "retry"
            : runtime.active
              ? "alert"
              : runtime.pending
                ? "pending"
                : "normal";

      let statusMarkup = "En espera";
      if (rule.enabled === false) statusMarkup = "Deshabilitada";
      else if (runtime.sending) statusMarkup = runtime.retry_kind === "reminder" ? "Enviando recordatorio…" : "Enviando alerta…";
      else if (runtime.retry_at) {
        statusMarkup = `${runtime.active ? "Alerta activa · " : ""}Error de envío · reintento <span class="runtime-countdown" data-retry-at="${this._escape(runtime.retry_at)}"></span>`;
      } else if (runtime.active) {
        statusMarkup = runtime.next_reminder_at
          ? `Alerta activa · recordatorio <span class="runtime-countdown" data-reminder-at="${this._escape(runtime.next_reminder_at)}"></span>`
          : "Alerta activa";
      } else if (runtime.pending) {
        statusMarkup = `Temporizando <span class="runtime-countdown" data-pending-until="${this._escape(runtime.pending_until || "")}"></span>`;
      }

      const recipients = (rule.recipients || []).map((item) => item.name || item.notify_entity_id || item.legacy_service).join(" · ");
      return `<article class="surface rule-card ${status}">
        <div class="rule-card-head">
          <div class="rule-icon">${this._icon("bell")}</div>
          <div class="rule-title">
            <div class="rule-title-line"><h3>${this._escape(rule.name)}</h3><span class="status-badge ${status}">${statusMarkup}</span></div>
            <p>${this._escape(rule.source?.display_name || rule.source?.entity_id)}</p>
          </div>
          <button class="switch-button ${rule.enabled !== false ? "on" : ""}" data-action="toggle-rule" data-id="${this._escape(rule.id)}" data-enabled="${rule.enabled !== false}" aria-label="Activar o desactivar regla"><span></span></button>
        </div>
        <div class="rule-metrics">
          <div><small>Condición</small><strong>${this._escape(this._conditionText(rule))}</strong></div>
          <div><small>Actual</small><strong>${live.available ? `${this._escape(Number(live.value).toFixed(1))}${this._escape(live.unit)}` : "—"}</strong></div>
          <div><small>Avisos</small><strong>${this._escape(this._reminderLabel(rule))}</strong><span>${rule.behavior?.notify_recovery ? "Avisa al normalizarse" : "Sin aviso de recuperación"}</span></div>
        </div>
        <div class="rule-footer">
          <span class="recipient-line">${this._icon("phone")} ${this._escape(recipients || "Sin destinatarios")}</span>
          <div class="card-actions">
            <button class="icon-button" data-action="edit-rule" data-id="${this._escape(rule.id)}" title="Editar">${this._icon("edit")}</button>
            <button class="icon-button danger" data-action="delete-rule" data-id="${this._escape(rule.id)}" title="Eliminar">${this._icon("trash")}</button>
          </div>
        </div>
        ${runtime.last_error ? `<div class="inline-error">${this._icon("warning")} ${this._escape(runtime.last_error)}</div>` : ""}
      </article>`;
    }).join("")}</div>`;
  }

  _renderTargets() {
    if (!this._targets.length) {
      return `<section class="surface empty-card"><div class="empty-icon">${this._icon("phone")}</div><h2>No se detectaron dispositivos</h2><p>El backend no encontró entidades notify.* de mobile_app ni acciones heredadas notify.mobile_app_*.</p></section>`;
    }
    return `<div class="device-grid">${this._targets.map((item) => {
      const meta = [item.manufacturer, item.model].filter(Boolean).join(" · ") || "Aplicación móvil";
      const firmware = item.sw_version ? `Firmware ${item.sw_version}` : "Firmware no informado";
      const endpoint = item.notify_entity_id || item.legacy_service || "Sin destino";
      const busy = this._busy === `test:${item.key}`;
      return `<article class="surface device-card">
        <div class="device-card-head">
          <div class="device-icon">${this._icon("phone")}</div>
          <div class="device-title"><h3>${this._escape(item.name)}</h3>${item.custom_name ? `<small>Home Assistant · ${this._escape(item.ha_name || "—")}</small>` : ""}<span class="availability ${item.available ? "ok" : "bad"}">${item.available ? "Disponible" : "No disponible"}</span></div>
          <button class="icon-button compact device-rename" data-action="rename-target" data-key="${this._escape(item.target_id || item.key)}" title="Cambiar nombre amigable" aria-label="Cambiar nombre de ${this._escape(item.name)}">${this._icon("edit")}</button>
        </div>
        <dl class="device-data">
          <div><dt>Hardware</dt><dd>${this._escape(meta)}</dd></div>
          <div><dt>Software</dt><dd>${this._escape(firmware)}</dd></div>
          ${item.area_name ? `<div><dt>Área</dt><dd>${this._escape(item.area_name)}</dd></div>` : ""}
          <div><dt>Notificador</dt><dd><code>${this._escape(endpoint)}</code></dd></div>
          ${item.legacy_service && item.notify_entity_id ? `<div><dt>Compatibilidad</dt><dd><code>${this._escape(item.legacy_service)}</code></dd></div>` : ""}
        </dl>
        <button class="secondary-button test-button" data-action="test-target" data-key="${this._escape(item.key)}" ${busy ? "disabled" : ""}>${this._icon("send")} ${busy ? "Enviando…" : "Enviar prueba"}</button>
      </article>`;
    }).join("")}</div>`;
  }

  _renderHistory() {
    if (!this._history.length) {
      return `<section class="surface empty-card"><div class="empty-icon">${this._icon("history")}</div><h2>Sin actividad</h2><p>Los envíos, recuperaciones, pruebas y errores aparecerán aquí.</p></section>`;
    }
    return `<section class="surface history-card"><div class="history-list">${this._history.map((item) => {
      const ok = item.status === "sent";
      const typeLabel = item.event_type === "recovery" ? "Recuperación" : item.event_type === "reminder" ? "Recordatorio" : item.event_type === "test" ? "Prueba manual" : "Alerta";
      return `<div class="history-row">
        <span class="history-dot ${ok ? "ok" : "bad"}"></span>
        <div class="history-main"><strong>${this._escape(item.rule_name || typeLabel)}</strong><small>${this._escape(typeLabel)} · ${this._escape(item.recipient || item.target || "Destino")}</small>${item.error ? `<em>${this._escape(item.error)}</em>` : ""}</div>
        <div class="history-meta">${item.value != null ? `<strong>${this._escape(item.value)} °C</strong>` : ""}<small>${this._escape(this._formatDate(item.timestamp))}</small></div>
      </div>`;
    }).join("")}</div></section>`;
  }

  _renderEditor() {
    if (!this._editorOpen || !this._draft) return "";
    const sensor = this._sensor(this._draft.source?.entity_id);
    const live = this._liveSensorValue(sensor);
    const stepTitles = ["Sensor", "Condición", "Dispositivos", "Mensaje"];
    let body = "";

    if (this._editorStep === 1) {
      body = `<div class="editor-section">
        <label class="field-label">Sensor de temperatura</label>
        <select class="field-control" data-field="sensor">
          <option value="">Seleccionar sensor…</option>
          ${this._preferredSensors().map((item) => `<option value="${this._escape(item.entity_id)}" ${item.entity_id === this._draft.source.entity_id ? "selected" : ""}>${this._escape(item.preferred ? `★ ${item.display_name}` : item.display_name)}</option>`).join("")}
        </select>
        ${sensor ? `<div class="sensor-preview">
          <div class="sensor-preview-icon">${this._icon("sensor")}</div>
          <div><small>${this._escape(sensor.area_name || sensor.device_name || "Sensor")}</small><strong>${this._escape(sensor.display_name)}</strong><code>${this._escape(sensor.entity_id)}</code></div>
          <div class="sensor-live"><small>Actual</small><strong>${live.available ? `${Number(live.value).toFixed(1)}${this._escape(live.unit)}` : "—"}</strong></div>
        </div>` : ""}
      </div>`;
    }

    if (this._editorStep === 2) {
      const c = this._draft.condition;
      const simple = ["above", "below"].includes(c.type);
      const notificationMode = this._notificationMode(this._draft.behavior);
      const reminderMinutes = Math.max(1, Math.round(Number(this._draft.behavior.reminder_interval_seconds || 1800) / 60));
      body = `<div class="editor-section condition-editor">
        <div class="field-grid two">
          <label><span class="field-label">Condición</span><select class="field-control" data-field="condition-type">
            <option value="above" ${c.type === "above" ? "selected" : ""}>Igual o mayor (≥)</option>
            <option value="below" ${c.type === "below" ? "selected" : ""}>Igual o menor (≤)</option>
            <option value="outside" ${c.type === "outside" ? "selected" : ""}>Fuera de rango</option>
            <option value="inside" ${c.type === "inside" ? "selected" : ""}>Dentro de rango</option>
          </select></label>
          ${simple ? `<label><span class="field-label">Umbral °C</span><input class="field-control" type="number" step="0.1" data-field="threshold" value="${this._escape(c.threshold)}"></label>` : `<div class="field-grid two nested"><label><span class="field-label">Mín. °C</span><input class="field-control" type="number" step="0.1" data-field="lower" value="${this._escape(c.lower)}"></label><label><span class="field-label">Máx. °C</span><input class="field-control" type="number" step="0.1" data-field="upper" value="${this._escape(c.upper)}"></label></div>`}
        </div>

        <div class="field-grid two">
          <div class="field-block">
            <span class="field-label-row"><label class="field-label" for="duration-minutes-field">Durante (min)</label><button type="button" class="help-button" data-action="open-help" data-help="duration" aria-label="Qué significa Durante">?</button></span>
            <input id="duration-minutes-field" class="field-control" type="number" min="0" step="1" data-field="for-minutes" value="${this._escape(Math.round(Number(c.for_seconds || 0) / 60))}">
          </div>
          <div class="field-block">
            <span class="field-label-row"><label class="field-label" for="hysteresis-field">Histéresis °C</label><button type="button" class="help-button" data-action="open-help" data-help="hysteresis" aria-label="Qué significa Histéresis">?</button></span>
            <input id="hysteresis-field" class="field-control" type="number" min="0" step="0.1" data-field="hysteresis" value="${this._escape(c.hysteresis)}">
          </div>
        </div>

        <div class="condition-divider"></div>
        <div class="section-mini-head"><div><small>AVISOS</small><strong>¿Cuántas veces quieres recibir esta alerta?</strong></div><button type="button" class="help-button" data-action="open-help" data-help="frequency" aria-label="Ayuda sobre frecuencia de avisos">?</button></div>
        <div class="field-grid ${notificationMode === "repeat" ? "two" : "one"}">
          <label><span class="field-label">Frecuencia</span><select class="field-control" data-field="notification-mode">
            <option value="once" ${notificationMode === "once" ? "selected" : ""}>Una vez por incidencia</option>
            <option value="repeat" ${notificationMode === "repeat" ? "selected" : ""}>Repetir mientras siga activa</option>
            <option value="daily" ${notificationMode === "daily" ? "selected" : ""}>Cada 24 h mientras siga activa</option>
          </select></label>
          ${notificationMode === "repeat" ? `<label><span class="field-label">Repetir cada (min)</span><input class="field-control" type="number" min="1" step="1" data-field="reminder-minutes" value="${this._escape(reminderMinutes)}"></label>` : ""}
        </div>

        <div class="check-line recovery-option">
          <input id="notify-recovery-field" type="checkbox" data-field="notify-recovery" ${this._draft.behavior.notify_recovery ? "checked" : ""}>
          <label for="notify-recovery-field"><strong>Avisarme cuando vuelva a la normalidad</strong><span>Envía un mensaje final cuando esta incidencia quede resuelta.</span></label>
          <button type="button" class="help-button" data-action="open-help" data-help="recovery" aria-label="Ayuda sobre aviso de recuperación">?</button>
        </div>

        <div class="logic-preview">${this._icon("check")} <span data-logic-preview-text>${this._escape(this._conditionSummary())}</span></div>
      </div>`;
    }

    if (this._editorStep === 3) {
      body = `<div class="editor-section"><div class="target-picker">${this._targets.length ? this._targets.map((item) => {
        const selected = this._recipientSelected(item);
        const endpoint = item.notify_entity_id || item.legacy_service;
        return `<label class="target-option ${selected ? "selected" : ""}">
          <input type="checkbox" data-field="recipient" value="${this._escape(item.key)}" ${selected ? "checked" : ""}>
          <span class="target-option-icon">${this._icon("phone")}</span>
          <span class="target-option-copy"><strong>${this._escape(item.name)}</strong><small>${this._escape(item.custom_name ? `Home Assistant · ${item.ha_name || "—"}` : ([item.manufacturer, item.model].filter(Boolean).join(" · ") || "Aplicación móvil"))}</small><code>${this._escape(endpoint)}</code></span>
          <span class="availability-dot ${item.available ? "ok" : "bad"}"></span>
        </label>`;
      }).join("") : `<div class="inline-error">${this._icon("warning")} No se detectaron destinos mobile_app.</div>`}</div></div>`;
    }

    if (this._editorStep === 4) {
      body = `<div class="editor-section">
        <label><span class="field-label">Nombre interno de la regla</span><input class="field-control" data-field="rule-name" value="${this._escape(this._draft.name)}"></label>
        <label><span class="field-label">Título de la notificación</span><input class="field-control" data-field="message-title" value="${this._escape(this._draft.message.title)}"></label>
        <label><span class="field-label">Mensaje</span><textarea class="field-control textarea" data-field="message-body">${this._escape(this._draft.message.body)}</textarea></label>
        <div class="variable-row"><code>{value}</code><code>{unit}</code><code>{sensor}</code><code>{area}</code><code>{threshold}</code><code>{time}</code></div>
        <div class="message-preview"><small>Vista previa</small><strong data-message-preview-title>${this._escape(this._draft.message.title || this._draft.name)}</strong><p data-message-preview-body>${this._escape((this._draft.message.body || "").replaceAll("{sensor}", this._draft.source.display_name || "Sensor").replaceAll("{value}", live.value != null ? Number(live.value).toFixed(1) : "28.4").replaceAll("{unit}", live.unit || "°C").replaceAll("{threshold}", String(this._draft.condition.threshold ?? `${this._draft.condition.lower}–${this._draft.condition.upper}`)).replaceAll("{area}", this._draft.source.area_name || "").replaceAll("{time}", "09:30"))}</p></div>
      </div>`;
    }

    return `<div class="dialog-backdrop editor-backdrop" data-action="close-editor">
      <section class="editor-card" data-editor-card role="dialog" aria-modal="true">
        <header class="editor-head"><div><span class="eyebrow">${this._editingId ? "Editar regla" : "Nueva regla"}</span><h2>${this._escape(stepTitles[this._editorStep - 1])}</h2></div><button class="icon-button" data-action="close-editor">${this._icon("close")}</button></header>
        <div class="steps">${stepTitles.map((title, index) => `<div class="step ${index + 1 === this._editorStep ? "active" : ""} ${index + 1 < this._editorStep ? "done" : ""}"><span>${index + 1 < this._editorStep ? "✓" : index + 1}</span><small>${this._escape(title)}</small></div>`).join("")}</div>
        <div class="editor-error" data-editor-error ${this._editorError ? "" : "hidden"}>${this._escape(this._editorError)}</div>
        <div class="editor-body">${body}</div>
        <footer class="editor-actions">
          <button class="secondary-button" data-action="${this._editorStep === 1 ? "close-editor" : "editor-back"}" ${this._busy ? "disabled" : ""}>${this._editorStep === 1 ? "Cancelar" : `${this._icon("back")} Atrás`}</button>
          ${this._editorStep < 4 ? `<button class="primary-button" data-action="editor-next">Continuar ${this._icon("arrow")}</button>` : `<button class="primary-button" data-action="save-rule" ${this._busy ? "disabled" : ""}>${this._busy === "save" ? "Guardando…" : `${this._icon("check")} Guardar regla`}</button>`}
        </footer>
      </section>
    </div>`;
  }

  _renderDeleteDialog() {
    if (!this._deleteId) return "";
    const rule = this._rules.find((item) => item.id === this._deleteId);
    return `<div class="dialog-backdrop" data-action="cancel-delete"><section class="dialog-card" data-delete-card><div class="dialog-icon danger">${this._icon("trash")}</div><span class="eyebrow">Eliminar regla</span><h2>¿Eliminar ${this._escape(rule?.name || "esta regla")}?</h2><p>La vigilancia se detendrá inmediatamente y la regla dejará de almacenarse. El historial existente se conserva.</p><div class="editor-error dialog-error" data-delete-error ${this._deleteError ? "" : "hidden"}>${this._escape(this._deleteError)}</div><div class="dialog-actions"><button class="secondary-button" data-action="cancel-delete" ${this._busy ? "disabled" : ""}>Cancelar</button><button class="danger-button" data-action="confirm-delete" ${this._busy ? "disabled" : ""}>${this._busy === "delete" ? "Eliminando…" : "Eliminar"}</button></div></section></div>`;
  }

  _renderRenameDialog() {
    if (!this._renameTargetId) return "";
    const target = this._target(this._renameTargetId);
    if (!target) return "";
    const busy = this._busy.startsWith("alias:");
    return `<div class="dialog-backdrop rename-backdrop" data-action="close-target-rename">
      <section class="dialog-card rename-card" data-rename-card role="dialog" aria-modal="true" aria-labelledby="rename-device-title">
        <div class="rename-head"><div><span class="eyebrow">Nombre amigable</span><h2 id="rename-device-title">${this._escape(target.name)}</h2></div><button class="icon-button compact" data-action="close-target-rename" ${busy ? "disabled" : ""} aria-label="Cerrar">${this._icon("close")}</button></div>
        <p class="rename-explanation">Este nombre se guarda solo en Notificaciones Witmind. No cambia el dispositivo en Home Assistant ni la entidad <code>notify</code>.</p>
        <label class="rename-field"><span>Nombre que verán los usuarios</span><input class="field-control" data-field="device-alias" maxlength="80" value="${this._escape(this._renameValue)}" placeholder="Ej. Tablet recepción"></label>
        <div class="identity-note"><strong>Vinculación segura</strong><span>La regla se enlaza por la identidad interna del dispositivo, no por este texto. Puedes renombrarlo en Home Assistant sin romper las notificaciones.</span></div>
        <div class="rename-ha-name"><small>Nombre actual en Home Assistant</small><strong>${this._escape(target.ha_name || target.name || "—")}</strong></div>
        <div class="editor-error dialog-error" data-rename-error ${this._renameError ? "" : "hidden"}>${this._escape(this._renameError)}</div>
        <div class="rename-actions">${target.custom_name ? `<button class="secondary-button" data-action="clear-target-alias" ${busy ? "disabled" : ""}>Restaurar nombre de Home Assistant</button>` : `<span></span>`}<div><button class="secondary-button" data-action="close-target-rename" ${busy ? "disabled" : ""}>Cancelar</button><button class="primary-button" data-action="save-target-alias" ${busy ? "disabled" : ""}>${busy ? "Guardando…" : "Guardar nombre"}</button></div></div>
      </section>
    </div>`;
  }

  render(force = false) {
    if (!this.shadowRoot || !this._hass) return;

    // Barrera final contra renders disparados por Home Assistant mientras existe
    // una interacción viva. Solo las transiciones explícitas usan force=true.
    if (!force && this._hasLiveInteraction()) {
      this._renderDeferred = true;
      this._syncOverlayBusyState();
      return;
    }

    this._renderDeferred = false;
    this.setAttribute("data-theme", this._theme);
    this.setAttribute("data-panel-version", WITMIND_NOTIFICATIONS_PANEL_VERSION);
    const config = this._config();
    const activeRules = this._rules.filter((item) => item.enabled !== false).length;
    const alertRules = this._rules.filter((item) => item.runtime?.active).length;
    const availableTargets = this._targets.filter((item) => item.available).length;
    const lastSent = this._history.find((item) => item.status === "sent");

    this.shadowRoot.innerHTML = `<style>
      :host {
        --primary:#f26522; --primary-hover:#d95a1e; --primary-soft:rgba(242,101,34,.1); --primary-medium:rgba(242,101,34,.2); --primary-border:rgba(242,101,34,.34); --primary-glow:rgba(242,101,34,.2);
        --background:#061c2b; --surface:rgba(255,255,255,.035); --surface-hover:rgba(255,255,255,.055); --surface-active:rgba(242,101,34,.1); --surface-subtle:rgba(255,255,255,.025); --surface-muted:rgba(255,255,255,.035); --surface-control:rgba(255,255,255,.055);
        --text-primary:rgba(255,255,255,.92); --text-secondary:rgba(255,255,255,.7); --text-tertiary:rgba(255,255,255,.48); --icon-muted:rgba(255,255,255,.55);
        --border-subtle:rgba(255,255,255,.06); --border-default:rgba(255,255,255,.09); --border-emphasis:rgba(255,255,255,.14); --header-background:rgba(11,43,64,.72); --modal-overlay:rgba(0,10,18,.75); --modal-surface:#0a2638;
        --card-shadow:rgba(0,0,0,.13); --modal-shadow:rgba(0,0,0,.42); --toast-shadow:rgba(0,0,0,.32); --inset-highlight:rgba(255,255,255,.025);
        --success:#22c55e; --warning:#f59e0b; --error:#ef4444; --info:#38bdf8; --radius-sm:10px; --radius-md:16px; --radius-lg:22px; --radius-pill:999px; --motion-fast:180ms; --motion-base:350ms; --ease:cubic-bezier(.16,1,.3,1);
        display:block; min-height:100%; color-scheme:dark; color:var(--text-primary); background:radial-gradient(circle at 88% 7%,rgba(242,101,34,.08),transparent 27%),radial-gradient(circle at 4% 88%,rgba(11,43,64,.75),transparent 36%),var(--background); font-family:"Plus Jakarta Sans",Inter,Arial,sans-serif;
      }
      :host([data-theme="light"]) { --background:#edf3f6; --surface:rgba(255,255,255,.82); --surface-hover:rgba(255,255,255,.98); --surface-active:rgba(242,101,34,.1); --surface-subtle:rgba(6,28,43,.035); --surface-muted:rgba(6,28,43,.045); --surface-control:rgba(6,28,43,.07); --text-primary:rgba(6,28,43,.94); --text-secondary:rgba(6,28,43,.7); --text-tertiary:rgba(6,28,43,.5); --icon-muted:rgba(6,28,43,.56); --border-subtle:rgba(6,28,43,.08); --border-default:rgba(6,28,43,.12); --border-emphasis:rgba(6,28,43,.18); --header-background:rgba(255,255,255,.88); --modal-overlay:rgba(6,28,43,.38); --modal-surface:#fff; --card-shadow:rgba(6,28,43,.11); --modal-shadow:rgba(6,28,43,.24); --toast-shadow:rgba(6,28,43,.2); --inset-highlight:rgba(255,255,255,.72); color-scheme:light; background:radial-gradient(circle at 88% 7%,rgba(242,101,34,.11),transparent 27%),radial-gradient(circle at 4% 88%,rgba(11,43,64,.09),transparent 36%),var(--background); }
      *{box-sizing:border-box} button,input,select,textarea{font:inherit;color:inherit} button{cursor:pointer} button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid rgba(56,189,248,.7);outline-offset:2px} svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
      .app-shell{min-height:100vh}.topbar{position:sticky;top:0;z-index:20;min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px clamp(16px,2.4vw,30px);border-bottom:1px solid var(--border-subtle);background:var(--header-background);backdrop-filter:blur(18px)}
      .topbar-start,.brand{display:flex;align-items:center;gap:12px;min-width:0}.menu-button,.theme-button,.icon-button{width:42px;height:42px;display:grid;place-items:center;border:1px solid var(--border-default);border-radius:50%;background:var(--surface-subtle);transition:.18s var(--ease)}.menu-button:hover,.theme-button:hover,.icon-button:hover{background:var(--surface-hover);border-color:var(--primary-border)}.menu-button svg,.theme-button svg,.icon-button svg{width:20px;height:20px}.logo-frame{width:120px;height:42px;padding:4px 6px;display:grid;place-items:center;border:1px solid var(--border-default);border-radius:14px;background:var(--surface-subtle)}.logo-frame img{width:100%;height:100%;object-fit:contain;filter:brightness(0) invert(1)}:host([data-theme="light"]) .logo-frame img{filter:none;mix-blend-mode:multiply}.topbar-meta{display:flex;gap:8px}
      .dashboard{width:min(1180px,100%);margin:0 auto;padding:clamp(12px,2vw,20px)}.surface{position:relative;border:1px solid var(--border-subtle);border-radius:var(--radius-lg);background:var(--surface);box-shadow:0 12px 30px var(--card-shadow),inset 0 1px 0 var(--inset-highlight);backdrop-filter:blur(16px)}
      .hero{padding:20px;margin-top:12px;display:flex;justify-content:space-between;gap:18px;align-items:center;background:radial-gradient(circle at 92% 16%,rgba(242,101,34,.1),transparent 34%),var(--surface)}.eyebrow{display:inline-flex;min-height:24px;align-items:center;padding:0 10px;border:1px solid rgba(242,101,34,.19);border-radius:var(--radius-pill);background:var(--primary-soft);color:var(--primary);font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.hero h1{margin:8px 0 4px;font-size:clamp(27px,3vw,38px);letter-spacing:-.035em}.hero p{margin:0;color:var(--text-secondary);font-size:13px}.primary-button,.secondary-button,.danger-button{min-height:42px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--radius-pill);font-weight:800;font-size:12px;transition:.18s var(--ease)}.primary-button{border:0;background:var(--primary);color:#fff;box-shadow:0 6px 18px var(--primary-glow)}.primary-button:hover{background:var(--primary-hover)}.secondary-button{border:1px solid var(--border-emphasis);background:var(--surface-muted)}.danger-button{border:1px solid rgba(239,68,68,.4);background:rgba(239,68,68,.12);color:var(--error)}.primary-button svg,.secondary-button svg{width:17px;height:17px}button:disabled{cursor:progress;opacity:.58}
      .summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}.summary-card{padding:15px 16px}.summary-card small{display:block;color:var(--text-tertiary);font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.summary-card strong{display:block;margin-top:6px;font-size:23px}.summary-card span{display:block;margin-top:3px;color:var(--text-secondary);font-size:11px}
      .toolbar{margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px}.tabs{display:flex;gap:4px;padding:4px;border:1px solid var(--border-default);border-radius:var(--radius-pill);background:var(--surface-subtle)}.tab{border:0;border-radius:var(--radius-pill);padding:9px 13px;background:transparent;color:var(--text-secondary);font-size:11px;font-weight:800}.tab.active{background:var(--primary-soft);color:var(--primary)}.toolbar-actions{display:flex;gap:8px}.content{margin-top:10px}
      .rule-list{display:grid;gap:10px}.rule-card{padding:15px;overflow:hidden}.rule-card.alert{border-color:rgba(239,68,68,.36)}.rule-card.pending{border-color:rgba(245,158,11,.28)}.rule-card.disabled{opacity:.7}.rule-card-head{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:11px;align-items:center}.rule-icon,.device-icon,.sensor-preview-icon,.empty-icon,.dialog-icon{display:grid;place-items:center;border:1px solid var(--border-default);background:var(--surface-muted);color:var(--icon-muted)}.rule-icon,.device-icon{width:44px;height:44px;border-radius:14px}.rule-icon svg,.device-icon svg{width:21px;height:21px}.rule-title h3,.device-card h3{margin:0;font-size:15px}.rule-title p{margin:3px 0 0;color:var(--text-secondary);font-size:11px}.rule-title-line{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.status-badge,.availability{display:inline-flex;align-items:center;min-height:22px;padding:0 8px;border-radius:999px;font-size:9px;font-weight:800}.status-badge.normal{background:rgba(34,197,94,.1);color:var(--success)}.status-badge.alert{background:rgba(239,68,68,.12);color:var(--error)}.status-badge.pending,.status-badge.sending,.status-badge.retry{background:rgba(245,158,11,.1);color:var(--warning)}.status-badge.blocked{background:rgba(56,189,248,.10);color:var(--info)}.status-badge.disabled{background:var(--surface-muted);color:var(--text-tertiary)}.runtime-countdown{margin-left:4px;font-variant-numeric:tabular-nums}
      .switch-button{width:46px;height:26px;padding:3px;border:1px solid var(--border-default);border-radius:999px;background:var(--surface-control)}.switch-button span{display:block;width:18px;height:18px;border-radius:50%;background:var(--text-tertiary);transition:.18s var(--ease)}.switch-button.on{background:var(--primary-soft);border-color:var(--primary-border)}.switch-button.on span{transform:translateX(19px);background:var(--primary)}.rule-metrics{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-top:13px}.rule-metrics>div{padding:10px 11px;border:1px solid var(--border-subtle);border-radius:12px;background:var(--surface-subtle)}.rule-metrics small,.device-data dt,.history-meta small{display:block;color:var(--text-tertiary);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.rule-metrics strong{display:block;margin-top:4px;font-size:12px}.rule-metrics>div>span{display:block;margin-top:3px;color:var(--text-tertiary);font-size:8px;font-weight:700}.rule-footer{margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px}.recipient-line{min-width:0;display:flex;align-items:center;gap:6px;color:var(--text-secondary);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.recipient-line svg{width:15px;height:15px}.card-actions{display:flex;gap:6px}.card-actions .icon-button{width:34px;height:34px}.card-actions .icon-button svg{width:16px}.icon-button.danger:hover{color:var(--error);border-color:rgba(239,68,68,.4)}.inline-error{margin-top:10px;padding:9px 10px;display:flex;align-items:center;gap:7px;border:1px solid rgba(239,68,68,.25);border-radius:11px;background:rgba(239,68,68,.07);color:var(--error);font-size:10px}.inline-error svg{width:15px;height:15px}
      .device-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.device-card{padding:15px}.device-card-head{display:grid;grid-template-columns:44px minmax(0,1fr) 36px;gap:11px;align-items:center}.device-title{min-width:0}.device-title h3{overflow-wrap:anywhere}.device-title small{display:block;margin-top:2px;color:var(--text-tertiary);font-size:8px;line-height:1.35}.device-rename{align-self:start}.availability{margin-top:4px}.availability.ok{background:rgba(34,197,94,.1);color:var(--success)}.availability.bad{background:rgba(239,68,68,.1);color:var(--error)}.device-data{margin:14px 0;display:grid;gap:8px}.device-data>div{display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px;padding-bottom:7px;border-bottom:1px solid var(--border-subtle)}.device-data dd{margin:0;color:var(--text-secondary);font-size:10px;word-break:break-word}.device-data code,.target-option code,.sensor-preview code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--primary);font-size:9px}.test-button{width:100%}
      .history-card{overflow:hidden}.history-list{display:grid}.history-row{display:grid;grid-template-columns:12px minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--border-subtle)}.history-row:last-child{border-bottom:0}.history-dot,.availability-dot{width:8px;height:8px;border-radius:50%}.history-dot.ok,.availability-dot.ok{background:var(--success)}.history-dot.bad,.availability-dot.bad{background:var(--error)}.history-main strong,.history-main small,.history-main em{display:block}.history-main strong{font-size:11px}.history-main small{margin-top:2px;color:var(--text-secondary);font-size:9px}.history-main em{margin-top:3px;color:var(--error);font-size:9px;font-style:normal}.history-meta{text-align:right}.history-meta strong{display:block;font-size:11px}.history-meta small{margin-top:3px}.empty-card{padding:32px;text-align:center}.empty-icon{width:54px;height:54px;margin:0 auto;border-radius:16px;color:var(--primary);background:var(--primary-soft);border-color:var(--primary-border)}.empty-icon svg{width:26px}.empty-card h2{margin:13px 0 5px;font-size:18px}.empty-card p{max-width:520px;margin:0 auto 16px;color:var(--text-secondary);font-size:11px;line-height:1.5}
      .error-banner{margin-top:12px;padding:13px 14px;display:flex;align-items:center;gap:9px;border:1px solid rgba(239,68,68,.3);border-radius:14px;background:rgba(239,68,68,.08);color:var(--error);font-size:11px}.error-banner svg{width:18px}.loading{padding:30px;text-align:center;color:var(--text-secondary);font-size:11px}
      .dialog-backdrop{position:fixed;z-index:1000;inset:0;padding:18px;display:grid;place-items:center;background:var(--modal-overlay);backdrop-filter:blur(8px)}.dialog-card{width:min(500px,100%);padding:22px;border:1px solid var(--primary-border);border-radius:var(--radius-lg);background:var(--modal-surface);box-shadow:0 28px 80px var(--modal-shadow)}.rename-card{width:min(590px,100%)}.rename-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.rename-head h2{margin-top:7px}.rename-explanation code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--primary);font-size:.9em}.rename-field{display:block;margin-top:16px}.rename-field>span{display:block;margin-bottom:6px;color:var(--text-secondary);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.identity-note{margin-top:12px;padding:11px 12px;border:1px solid rgba(56,189,248,.2);border-radius:12px;background:rgba(56,189,248,.06)}.identity-note strong,.identity-note span,.rename-ha-name small,.rename-ha-name strong{display:block}.identity-note strong{color:var(--info);font-size:9px}.identity-note span{margin-top:4px;color:var(--text-secondary);font-size:10px;line-height:1.45}.rename-ha-name{margin-top:12px;padding:10px 12px;border:1px solid var(--border-subtle);border-radius:12px;background:var(--surface-subtle)}.rename-ha-name small{color:var(--text-tertiary);font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.rename-ha-name strong{margin-top:4px;font-size:11px}.rename-actions{margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.rename-actions>div{display:flex;gap:8px;margin-left:auto}.dialog-icon{width:48px;height:48px;border-radius:14px;color:var(--primary);background:var(--primary-soft);border-color:var(--primary-border)}.dialog-icon.danger{color:var(--error);background:rgba(239,68,68,.09);border-color:rgba(239,68,68,.28)}.dialog-icon svg{width:23px}.dialog-card h2{margin:15px 0 0;font-size:23px}.dialog-card p{margin:9px 0 0;color:var(--text-secondary);font-size:12px;line-height:1.55}.dialog-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:20px}
      .editor-card{width:min(760px,100%);max-height:min(850px,calc(100vh - 28px));display:grid;grid-template-rows:auto auto auto minmax(0,1fr) auto;border:1px solid var(--primary-border);border-radius:var(--radius-lg);background:var(--modal-surface);box-shadow:0 28px 80px var(--modal-shadow);overflow:hidden}.editor-head{padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px}.editor-head h2{margin:7px 0 0;font-size:24px}.steps{padding:0 20px 14px;display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.step{display:flex;align-items:center;gap:6px;color:var(--text-tertiary);font-size:9px}.step span{width:23px;height:23px;display:grid;place-items:center;border:1px solid var(--border-default);border-radius:50%;font-weight:800}.step.active,.step.done{color:var(--primary)}.step.active span,.step.done span{border-color:var(--primary-border);background:var(--primary-soft)}.editor-error{margin:0 20px 12px;padding:10px 12px;border:1px solid rgba(239,68,68,.32);border-radius:11px;background:rgba(239,68,68,.08);color:var(--error);font-size:10px;font-weight:700;line-height:1.4}.editor-error[hidden]{display:none}.dialog-error{margin:14px 0 0}.editor-body{overflow:auto;padding:0 20px 18px}.editor-section{display:grid;gap:14px}.editor-actions{padding:13px 20px;display:flex;justify-content:space-between;gap:10px;border-top:1px solid var(--border-subtle);background:var(--surface-subtle)}.field-label{display:block;margin-bottom:6px;color:var(--text-secondary);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.field-control{width:100%;min-height:43px;padding:0 12px;border:1px solid var(--border-default);border-radius:12px;background:var(--surface-control);color:var(--text-primary)}.field-control option{background:var(--modal-surface);color:var(--text-primary)}.textarea{min-height:110px;padding:11px 12px;resize:vertical;line-height:1.45}.field-grid{display:grid;gap:10px}.field-grid.one{grid-template-columns:minmax(0,1fr)}.field-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.field-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.field-grid.nested{align-self:end}.field-label-row{margin-bottom:6px;display:flex;align-items:center;gap:6px}.field-label-row .field-label{margin:0}.help-button{width:22px;height:22px;flex:0 0 22px;display:inline-grid;place-items:center;padding:0;border:1px solid var(--border-default);border-radius:50%;background:var(--surface-subtle);color:var(--text-secondary);font-size:11px;font-weight:900;line-height:1;cursor:pointer}.help-button:hover{border-color:var(--primary-border);background:var(--primary-soft);color:var(--primary)}.condition-divider{height:1px;background:var(--border-subtle);margin:1px 0}.section-mini-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.section-mini-head small,.section-mini-head strong{display:block}.section-mini-head small{color:var(--primary);font-size:8px;font-weight:850;letter-spacing:.12em}.section-mini-head strong{margin-top:3px;font-size:11px}.check-line{padding:11px 12px;display:flex;align-items:flex-start;gap:9px;border:1px solid var(--border-subtle);border-radius:12px;background:var(--surface-subtle);font-size:10px;color:var(--text-secondary)}.check-line input,.target-option input{accent-color:var(--primary)}.recovery-option{display:grid;grid-template-columns:18px minmax(0,1fr) 22px;align-items:start}.recovery-option>label{cursor:pointer}.recovery-option strong,.recovery-option span{display:block}.recovery-option strong{color:var(--text-primary);font-size:10px}.recovery-option span{margin-top:3px;color:var(--text-tertiary);font-size:9px;line-height:1.35}.logic-preview{padding:11px 12px;display:flex;gap:9px;align-items:flex-start;border:1px solid rgba(56,189,248,.2);border-radius:12px;background:rgba(56,189,248,.06);font-size:10px;color:var(--text-secondary);line-height:1.45}.logic-preview svg{flex:0 0 auto;width:16px;color:var(--info)}
      .help-backdrop{position:absolute;z-index:12;inset:0;padding:18px;display:grid;place-items:center;background:rgba(6,28,43,.36);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}.help-card{width:min(560px,100%);padding:17px;display:grid;grid-template-columns:38px minmax(0,1fr) 36px;gap:12px;align-items:start;border:1px solid var(--primary-border);border-radius:18px;background:var(--modal-surface);box-shadow:0 20px 56px var(--modal-shadow)}.help-symbol{width:38px;height:38px;display:grid;place-items:center;border:1px solid var(--primary-border);border-radius:12px;background:var(--primary-soft);color:var(--primary);font-size:18px;font-weight:900}.help-copy h3{margin:1px 0 0;font-size:16px}.help-copy p{margin:7px 0 0;color:var(--text-secondary);font-size:10px;line-height:1.5}.help-example{margin-top:11px;padding:10px 11px;border:1px solid var(--border-subtle);border-radius:11px;background:var(--surface-subtle)}.help-example strong,.help-example span{display:block}.help-example strong{color:var(--primary);font-size:8px;letter-spacing:.08em;text-transform:uppercase}.help-example span{margin-top:4px;color:var(--text-secondary);font-size:10px;line-height:1.5}.icon-button.compact{width:36px;height:36px}.editor-card{position:relative}.sensor-preview{padding:14px;display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:11px;align-items:center;border:1px solid var(--border-default);border-radius:14px;background:var(--surface-subtle)}.sensor-preview-icon{width:48px;height:48px;border-radius:14px;color:var(--primary);background:var(--primary-soft);border-color:var(--primary-border)}.sensor-preview-icon svg{width:23px}.sensor-preview small,.sensor-preview strong,.sensor-preview code{display:block}.sensor-preview small{color:var(--text-tertiary);font-size:9px}.sensor-preview strong{margin:3px 0;font-size:13px}.sensor-live{text-align:right}.sensor-live strong{font-size:22px}.target-picker{display:grid;gap:8px}.target-option{position:relative;padding:12px;display:grid;grid-template-columns:18px 42px minmax(0,1fr) 10px;gap:9px;align-items:center;border:1px solid var(--border-default);border-radius:14px;background:var(--surface-subtle);cursor:pointer}.target-option.selected{border-color:var(--primary-border);background:var(--primary-soft)}.target-option-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:var(--surface-muted)}.target-option-icon svg{width:20px}.target-option-copy strong,.target-option-copy small,.target-option-copy code{display:block}.target-option-copy strong{font-size:11px}.target-option-copy small{margin:2px 0;color:var(--text-secondary);font-size:9px}.variable-row{display:flex;gap:5px;flex-wrap:wrap}.variable-row code{padding:5px 7px;border:1px solid var(--border-default);border-radius:8px;background:var(--surface-subtle);color:var(--primary);font-size:9px}.message-preview{padding:13px 14px;border:1px solid var(--border-default);border-radius:14px;background:var(--surface-subtle)}.message-preview small,.message-preview strong{display:block}.message-preview small{color:var(--text-tertiary);font-size:8px;text-transform:uppercase;letter-spacing:.1em}.message-preview strong{margin-top:6px;font-size:12px}.message-preview p{margin:5px 0 0;color:var(--text-secondary);font-size:10px;line-height:1.45}
      .toast{position:fixed;z-index:1100;right:18px;bottom:18px;max-width:min(390px,calc(100vw - 28px));min-height:48px;padding:11px 14px;display:flex;align-items:center;gap:9px;border:1px solid var(--border-emphasis);border-radius:14px;background:var(--modal-surface);box-shadow:0 18px 46px var(--toast-shadow);font-size:11px;font-weight:700}.toast.success{border-color:rgba(34,197,94,.38)}.toast.error{border-color:rgba(239,68,68,.45)}
      @media(max-width:760px){.help-backdrop{padding:8px}.help-card{grid-template-columns:34px minmax(0,1fr) 34px;padding:14px}.help-symbol{width:34px;height:34px}.summary-grid{grid-template-columns:1fr}.device-grid{grid-template-columns:1fr}.toolbar{align-items:stretch;flex-direction:column}.toolbar-actions{justify-content:flex-end}.rule-metrics{grid-template-columns:1fr 1fr}.rule-metrics>div:first-child{grid-column:1/-1}.rule-footer{align-items:flex-start;flex-direction:column}.field-grid.two,.field-grid.three{grid-template-columns:1fr}.steps small{display:none}.editor-card{max-height:calc(100vh - 12px)}.editor-backdrop{padding:6px}.sensor-preview{grid-template-columns:44px minmax(0,1fr)}.sensor-live{grid-column:2;text-align:left}.hero{align-items:flex-start;flex-direction:column}.topbar{padding-left:10px;padding-right:10px}.logo-frame{width:94px}.device-data>div{grid-template-columns:82px 1fr}.rename-actions{align-items:stretch;flex-direction:column}.rename-actions>div{width:100%;margin-left:0;display:grid;grid-template-columns:1fr 1fr}.rename-actions>.secondary-button{width:100%}}
    </style>
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-start"><button class="menu-button" data-action="toggle-menu" aria-label="Menú">${this._icon("menu")}</button><div class="brand"><span class="logo-frame"><img src="${this._escape(config.logo)}" alt="Witmind"></span></div></div>
        <div class="topbar-meta"><button class="theme-button" data-action="toggle-theme" aria-label="Cambiar tema">${this._icon("theme")}</button></div>
      </header>
      <main class="dashboard">
        <section class="surface hero"><div><h1>${this._escape(config.title)}</h1></div><button class="primary-button" data-action="new-rule">${this._icon("plus")} Nueva regla</button></section>
        ${this._error ? `<div class="error-banner">${this._icon("warning")}<span>${this._escape(this._error)}</span></div>` : ""}
        <div class="summary-grid"><article class="surface summary-card"><small>Reglas activas</small><strong>${activeRules}</strong><span>${alertRules ? `${alertRules} en alerta` : "Sin alertas activas"}</span></article><article class="surface summary-card"><small>Dispositivos</small><strong>${availableTargets}/${this._targets.length}</strong></article><article class="surface summary-card"><small>Último envío</small><strong>${lastSent ? this._escape(this._formatDate(lastSent.timestamp)) : "—"}</strong><span>${lastSent ? this._escape(lastSent.recipient || lastSent.target || "") : "Sin actividad registrada"}</span></article></div>
        <div class="toolbar"><div class="tabs"><button class="tab ${this._tab === "rules" ? "active" : ""}" data-action="tab" data-tab="rules">Reglas</button><button class="tab ${this._tab === "devices" ? "active" : ""}" data-action="tab" data-tab="devices">Dispositivos</button><button class="tab ${this._tab === "history" ? "active" : ""}" data-action="tab" data-tab="history">Historial</button></div><div class="toolbar-actions"><button class="icon-button" data-action="refresh" title="Volver a escanear">${this._icon("refresh")}</button></div></div>
        <section class="content">${this._loading ? `<div class="surface loading">Escaneando sensores, dispositivos y reglas…</div>` : this._tab === "rules" ? this._renderRules() : this._tab === "devices" ? this._renderTargets() : this._renderHistory()}</section>
      </main>
      ${this._renderEditor()}
      ${this._renderDeleteDialog()}
      ${this._renderRenameDialog()}
      ${this._toast ? `<div class="toast ${this._escape(this._toast.type)}" role="status">${this._escape(this._toast.message)}</div>` : ""}
    </div>`;
    this._updatePendingCountdowns();
  }
}

if (!customElements.get("notifications-panel")) {
  customElements.define("notifications-panel", NotificationsPanel);
}
