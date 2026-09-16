// Witmind Calendario Laboral Panel v1.5.0 — interfaz alineada al sistema visual Witmind.
// CRUD persistente vía custom_components/calendario_laboral + Home Assistant Store.

const CALENDAR_PANEL_VERSION = "1.5.0";

const DEFAULT_CALENDAR_CONFIG = Object.freeze({
  title: "Calendario de días festivos",
  subtitle: "Define los días en los que la empresa no trabaja y pausa automatizaciones laborales.",
  siteLabel: "WTX · MDTC",
  logo: "/local/logo-witmind.png?v=2.0.0",
  entityId: "binary_sensor.dia_no_laborable",
  protectedAutomations: [
    { label: "Taller · ciclo 10s", entity: "automation.taller_ciclo_10s" },
    { label: "Climatización automática · rutinas", id: "witmind_climatizacion_boundaries" },
  ],
});

const ICONS = Object.freeze({
  menu: '<path d="M3 6.5h18M3 12h18M3 17.5h18"/>',
  moon: '<path d="M20.2 15.4A8.1 8.1 0 0 1 8.6 3.8a8.65 8.65 0 1 0 11.6 11.6Z"/>',
  sun: '<circle cx="12" cy="12" r="3.75"/><path d="M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5M4.75 4.75l1.77 1.77M17.48 17.48l1.77 1.77M19.25 4.75l-1.77 1.77M6.52 17.48l-1.77 1.77"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6M17 2v6M3 10h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
  chevron: '<path d="m8 10 4 4 4-4"/>',
  alert: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4M12 16.5h.01"/>',
  shield: '<path d="M12 3 5 6v5c0 4.7 2.8 8.3 7 10 4.2-1.7 7-5.3 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
});

class WitmindCalendarioLaboralPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._panel = null;
    this._narrow = false;
    this._data = null;
    this._loading = false;
    this._busy = false;
    this._error = "";
    this._toast = "";
    this._toastAction = "";
    this._toastTimer = null;
    this._undoDeletedRecord = null;
    this._renderDeferred = false;
    this._themeStorageKey = "witmind-calendario-laboral-theme";
    this._theme = this._loadTheme();
    this._year = "all";
    this._modal = null;
    this._lastCentralState = null;

    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("input", (event) => this._handleInput(event));
    this.shadowRoot.addEventListener("change", (event) => this._handleChange(event));
    this.shadowRoot.addEventListener("submit", (event) => this._handleSubmit(event));
  }

  set hass(value) {
    const previousCentral = this._centralStateSignature(this._hass);
    const previousView = this._relevantStateSignature(this._hass);
    this._hass = value;
    const currentCentral = this._centralStateSignature(value);
    const currentView = this._relevantStateSignature(value);

    if (!this._data && !this._loading) {
      this._loadData();
      return;
    }

    // Home Assistant entrega un nuevo objeto hass con mucha frecuencia.
    // No reconstruimos el Shadow DOM por cambios de entidades que este panel no usa.
    if (previousCentral !== currentCentral && this._data && !this._loading && !this._busy) {
      this._loadData(false);
      return;
    }

    if (previousView !== currentView) this._requestRender();
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
    this.setAttribute("data-panel-version", CALENDAR_PANEL_VERSION);
    if (!this._versionLogged) {
      this._versionLogged = true;
      console.info(`[Calendario Laboral] frontend v${CALENDAR_PANEL_VERSION} cargado`);
    }
    if (this._hass && !this._data && !this._loading) this._loadData();
  }

  disconnectedCallback() {
    clearTimeout(this._toastTimer);
  }

  _config() {
    const raw = this._panel?.config || {};
    const protectedAutomations = Array.isArray(raw.protected_automations)
      ? raw.protected_automations
      : Array.isArray(raw.protectedAutomations)
        ? raw.protectedAutomations
        : DEFAULT_CALENDAR_CONFIG.protectedAutomations;
    return {
      title: raw.title || DEFAULT_CALENDAR_CONFIG.title,
      subtitle: raw.subtitle || DEFAULT_CALENDAR_CONFIG.subtitle,
      siteLabel: raw.site_label || raw.siteLabel || DEFAULT_CALENDAR_CONFIG.siteLabel,
      logo: raw.logo || DEFAULT_CALENDAR_CONFIG.logo,
      entityId: raw.entity_id || raw.entityId || DEFAULT_CALENDAR_CONFIG.entityId,
      protectedAutomations,
    };
  }

  _icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  _state(entityId) {
    return this._hass?.states?.[entityId] || null;
  }

  _centralStateSignature(hass) {
    const entityId = this._config().entityId;
    const state = hass?.states?.[entityId];
    if (!state) return `${entityId}:missing`;
    const attrs = state.attributes || {};
    return JSON.stringify([
      entityId,
      state.state,
      attrs.fecha || "",
      attrs.motivo || "",
      attrs.es_domingo ?? null,
      attrs.feriado_activo || "",
      attrs.feriados_activos ?? null,
      attrs.proximo_feriado || "",
      attrs.proximo_feriado_nombre || "",
    ]);
  }

  _relevantStateSignature(hass) {
    const config = this._config();
    const protectedStates = config.protectedAutomations
      .map((item) => item.entity || item.entity_id || "")
      .filter(Boolean)
      .map((entityId) => [entityId, hass?.states?.[entityId]?.state ?? "missing"]);
    return JSON.stringify([this._centralStateSignature(hass), protectedStates]);
  }

  _hasLiveModal() {
    return Boolean(this._modal && this.shadowRoot?.querySelector(".modal-backdrop"));
  }

  _requestRender() {
    // render() reemplaza shadowRoot.innerHTML completo. Nunca se permite hacerlo
    // mientras el formulario modal existente está montado: destruiría el control
    // que tiene foco (incluido el date picker) y restauraría checkboxes/inputs.
    if (this._hasLiveModal()) {
      this._renderDeferred = true;
      this._syncModalBusyState();
      return;
    }
    this._renderDeferred = false;
    this.render();
  }

  _syncModalBusyState() {
    const modal = this.shadowRoot?.querySelector(".modal");
    if (!modal) return;
    const closeButton = modal.querySelector('[data-action="close-modal"]');
    const cancelButton = modal.querySelector('.secondary-button[data-action="close-modal"]');
    const submitButton = modal.querySelector('button[type="submit"]');
    if (closeButton) closeButton.disabled = this._busy;
    if (cancelButton) cancelButton.disabled = this._busy;
    if (submitButton) {
      submitButton.disabled = this._busy;
      submitButton.textContent = this._busy ? "Guardando…" : "Guardar";
    }
  }

  _showModalError(message) {
    const modal = this.shadowRoot?.querySelector(".modal");
    if (!modal) return;
    let box = modal.querySelector("[data-modal-error]");
    if (!box) {
      box = document.createElement("div");
      box.dataset.modalError = "";
      box.className = "modal-error";
      const form = modal.querySelector("form[data-calendar-form]");
      if (form) modal.insertBefore(box, form);
      else modal.appendChild(box);
    }
    box.textContent = message || "";
    box.hidden = !message;
  }

  _syncModalDraft(target) {
    if (!this._modal || !target?.closest?.("form[data-calendar-form]") || !target.name) return;
    if (target.name === "active") this._modal.record.active = Boolean(target.checked);
    else if (["date", "name", "description"].includes(target.name)) this._modal.record[target.name] = target.value;
  }

  _loadTheme() {
    try {
      return localStorage.getItem(this._themeStorageKey) === "dark" ? "dark" : "light";
    } catch (_error) {
      return "light";
    }
  }

  _saveTheme() {
    try { localStorage.setItem(this._themeStorageKey, this._theme); } catch (_error) { /* visual only */ }
  }

  _toggleTheme() {
    this._theme = this._theme === "dark" ? "light" : "dark";
    this._saveTheme();
    this.setAttribute("data-theme", this._theme);
    this._requestRender();
  }

  _toggleMenu() {
    this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _ws(message) {
    if (!this._hass?.connection) return Promise.reject(new Error("Home Assistant no está conectado."));
    return this._hass.connection.sendMessagePromise(message);
  }

  async _loadData(showLoading = true) {
    if (!this._hass || this._loading) return;
    this._loading = true;
    if (showLoading) this._requestRender();
    try {
      this._data = await this._ws({ type: "calendario_laboral/get" });
      this._error = "";
      const years = this._data?.years || [];
      if (this._year !== "all" && !years.includes(Number(this._year))) this._year = "all";
    } catch (error) {
      this._error = this._errorMessage(error, "No se pudo cargar el calendario laboral.");
      console.error("Calendario Laboral: error cargando datos", error);
    } finally {
      this._loading = false;
      this._requestRender();
    }
  }

  _errorMessage(error, fallback) {
    return error?.message || error?.error?.message || error?.code || fallback;
  }

  _showToast(message, { action = "", duration = 3400 } = {}) {
    this._toast = message;
    this._toastAction = action;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast = "";
      this._toastAction = "";
      if (action === "undo-delete") this._undoDeletedRecord = null;
      this._requestRender();
    }, duration);
    this._requestRender();
  }

  _formatDate(iso, options = {}) {
    if (!iso) return "—";
    const parsed = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return iso;
    return new Intl.DateTimeFormat("es-BO", options).format(parsed);
  }

  _status() {
    const config = this._config();
    const central = this._state(config.entityId);
    const centralKnown = central && !["unknown", "unavailable"].includes(central.state);
    return {
      blocked: centralKnown ? central.state === "on" : Boolean(this._data?.is_non_working_day),
      reason: centralKnown ? (central.attributes?.motivo || "") : (this._data?.reason || ""),
      available: Boolean(centralKnown),
    };
  }

  _record(recordId) {
    return this._data?.holidays?.find((item) => item.id === recordId) || null;
  }

  _openAdd() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    this._modal = {
      mode: "add",
      record: {
        id: "",
        date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        name: "",
        description: "",
        active: true,
      },
    };
    this.render(true);
  }

  _openEdit(recordId) {
    const record = this._record(recordId);
    if (!record) return;
    this._modal = { mode: "edit", record: { ...record } };
    this.render(true);
  }

  _closeModal() {
    if (this._busy) return;
    this._modal = null;
    this._renderDeferred = false;
    this.render(true);
  }

  async _toggleHoliday(recordId) {
    const record = this._record(recordId);
    if (!record || !this._hass?.user?.is_admin || this._busy) return;
    await this._mutate(
      { type: "calendario_laboral/update", record_id: String(record.id), active: !record.active },
      record.active ? "Feriado desactivado." : "Feriado activado.",
    );
  }

  async _deleteHoliday(recordId) {
    const record = this._record(recordId);
    if (!record || !this._hass?.user?.is_admin || this._busy) return;
    const label = `${this._formatDate(record.date)} · ${record.name}`;
    if (!window.confirm(`Eliminar ${label}?\n\nEsta acción quita el registro del calendario persistente.`)) return;

    const snapshot = {
      date: record.date,
      name: record.name,
      description: record.description || "",
      active: Boolean(record.active),
    };
    const deleted = await this._mutate(
      { type: "calendario_laboral/delete", record_id: String(record.id) },
      "",
    );
    if (!deleted) return;

    this._undoDeletedRecord = snapshot;
    this._showToast("Feriado eliminado.", { action: "undo-delete", duration: 8000 });
  }

  async _undoDeleteHoliday() {
    const record = this._undoDeletedRecord;
    if (!record || !this._hass?.user?.is_admin || this._busy) return;

    this._undoDeletedRecord = null;
    this._toast = "";
    this._toastAction = "";
    clearTimeout(this._toastTimer);

    await this._mutate(
      {
        type: "calendario_laboral/add",
        date: record.date,
        name: record.name,
        description: record.description,
        active: record.active,
      },
      "Eliminación deshecha.",
    );
  }

  async _mutate(message, successMessage, closeModal = false) {
    const startedFromModal = this._hasLiveModal();
    this._busy = true;
    this._error = "";

    // Si la operación parte del modal, actualizamos sus botones in-place.
    // No reconstruimos el Shadow DOM durante la petición WebSocket.
    if (startedFromModal) this._syncModalBusyState();
    else this.render();

    try {
      const result = await this._ws(message);
      if (result?.calendar) this._data = result.calendar;
      else await this._loadData(false);

      if (closeModal) {
        this._modal = null;
        this._renderDeferred = false;
      }
      if (successMessage) this._showToast(successMessage);
      return true;
    } catch (error) {
      this._error = this._errorMessage(error, "No se pudo guardar el cambio.");
      console.error("Calendario Laboral: error guardando cambio", error);
      if (startedFromModal) this._showModalError(this._error);
      return false;
    } finally {
      this._busy = false;
      if (this._hasLiveModal()) {
        this._syncModalBusyState();
      } else {
        this.render();
      }
    }
  }

  async _handleSubmit(event) {
    const form = event.target.closest("form[data-calendar-form]");
    if (!form) return;
    event.preventDefault();
    if (!this._hass?.user?.is_admin || this._busy) return;

    const formData = new FormData(form);
    const date = String(formData.get("date") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const active = formData.get("active") === "on";

    if (this._modal) {
      this._modal.record = { ...this._modal.record, date, name, description, active };
    }

    if (!date || !name) {
      this._error = "Fecha y nombre son obligatorios.";
      this._showModalError(this._error);
      return;
    }

    if (this._modal?.mode === "edit") {
      await this._mutate(
        {
          type: "calendario_laboral/update",
          record_id: String(this._modal.record.id),
          date,
          name,
          description,
          active,
        },
        "Feriado actualizado.",
        true,
      );
    } else {
      await this._mutate(
        { type: "calendario_laboral/add", date, name, description, active },
        "Feriado agregado.",
        true,
      );
    }
  }

  _handleInput(event) {
    this._syncModalDraft(event.target);
  }

  _handleChange(event) {
    this._syncModalDraft(event.target);
    const year = event.target.closest("[data-year-filter]");
    if (year) {
      this._year = year.value;
      this._requestRender();
    }
  }

  _handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "toggle-menu") this._toggleMenu();
    else if (action === "toggle-theme") this._toggleTheme();
    else if (action === "add") this._openAdd();
    else if (action === "edit") this._openEdit(target.dataset.id);
    else if (action === "toggle") this._toggleHoliday(target.dataset.id);
    else if (action === "delete") this._deleteHoliday(target.dataset.id);
    else if (action === "undo-delete") this._undoDeleteHoliday();
    else if (action === "close-modal") this._closeModal();
  }

  _protectedAutomations(status) {
    const config = this._config();
    if (!config.protectedAutomations.length) return "";
    return config.protectedAutomations.map((item) => {
      const entityId = item.entity || item.entity_id || "";
      const state = entityId ? this._state(entityId) : null;
      const title = item.label || item.name || entityId || item.id || "Automatización";
      const stateLabel = status.blocked
        ? "Pausada hoy"
        : state
          ? (state.state === "on" ? "Operativa" : "Deshabilitada")
          : "En espera";
      const helper = status.blocked
        ? "El calendario la pausó por ser día festivo."
        : state
          ? (state.state === "on"
              ? "Se pausa automáticamente cuando el calendario detecta un día festivo."
              : "No está operativa actualmente fuera de la lógica del calendario.")
          : "Se pausa automáticamente cuando el calendario detecta un día festivo.";
      const stateClass = status.blocked
        ? "is-blocked"
        : state
          ? (state.state === "on" ? "is-live" : "is-neutral")
          : "is-neutral";
      return `
        <div class="protected-item">
          <span class="protected-icon">${this._icon("shield")}</span>
          <div class="protected-copy">
            <strong>${this._escape(title)}</strong>
            <small>${this._escape(helper)}</small>
          </div>
          <span class="protected-state ${stateClass}">${this._escape(stateLabel)}</span>
        </div>`;
    }).join("");
  }

  _holidayRows() {
    const admin = Boolean(this._hass?.user?.is_admin);
    const all = Array.isArray(this._data?.holidays) ? this._data.holidays : [];
    const filtered = this._year === "all"
      ? all
      : all.filter((item) => String(item.date).startsWith(`${this._year}-`));

    if (!filtered.length) {
      return `<div class="empty-state">No hay feriados registrados para este filtro.</div>`;
    }

    return filtered.map((item) => `
      <article class="holiday-row ${item.active ? "is-active" : "is-inactive"}">
        <div class="date-block">
          <strong>${this._escape(this._formatDate(item.date, { day: "2-digit", month: "2-digit" }))}</strong>
          <span>${this._escape(item.date.slice(0, 4))}</span>
        </div>
        <div class="holiday-copy">
          <div class="holiday-heading">
            <h3>${this._escape(item.name)}</h3>
            <span class="holiday-state ${item.active ? "active" : "inactive"}">${item.active ? "ACTIVO" : "INACTIVO"}</span>
          </div>
          ${item.description ? `<p>${this._escape(item.description)}</p>` : `<p class="muted">Sin descripción</p>`}
        </div>
        <div class="row-actions">
          <button class="small-action" data-action="edit" data-id="${this._escape(item.id)}" ${!admin || this._busy ? "disabled" : ""} title="Editar">${this._icon("edit")}<span>Editar</span></button>
          <button class="small-action toggle ${item.active ? "danger-soft" : "success-soft"}" data-action="toggle" data-id="${this._escape(item.id)}" ${!admin || this._busy ? "disabled" : ""} title="${item.active ? "Desactivar" : "Activar"}">${this._icon(item.active ? "close" : "check")}<span>${item.active ? "Desactivar" : "Activar"}</span></button>
          <button class="small-action danger" data-action="delete" data-id="${this._escape(item.id)}" ${!admin || this._busy ? "disabled" : ""} title="Eliminar">${this._icon("trash")}<span>Eliminar</span></button>
        </div>
      </article>
    `).join("");
  }

  _modalMarkup() {
    if (!this._modal) return "";
    const record = this._modal.record;
    const edit = this._modal.mode === "edit";
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal" role="dialog" aria-modal="true" aria-label="${edit ? "Editar" : "Agregar"} día no laborable">
          <div class="modal-head">
            <div>
              <span class="eyebrow">${edit ? "Editar registro" : "Nuevo registro"}</span>
              <h2>${edit ? "Editar día no laborable" : "Agregar día no laborable"}</h2>
            </div>
            <button class="icon-button compact" type="button" data-action="close-modal" ${this._busy ? "disabled" : ""} aria-label="Cerrar">${this._icon("close")}</button>
          </div>
          <div class="modal-error" data-modal-error ${this._error ? "" : "hidden"}>${this._escape(this._error)}</div>
          <form data-calendar-form>
            <label class="field">
              <span>Fecha</span>
              <input type="date" name="date" required value="${this._escape(record.date)}" />
            </label>
            <label class="field">
              <span>Nombre</span>
              <input type="text" name="name" maxlength="120" required value="${this._escape(record.name)}" placeholder="Nombre del feriado" />
            </label>
            <label class="field">
              <span>Descripción <small>opcional</small></span>
              <textarea name="description" maxlength="500" rows="3" placeholder="Detalle o motivo excepcional">${this._escape(record.description)}</textarea>
            </label>
            <label class="switch-field">
              <div><strong>Activo</strong><span>Cuando está activo, la fecha pausa las automatizaciones definidas para días laborables.</span></div>
              <input type="checkbox" name="active" ${record.active ? "checked" : ""}/><i></i>
            </label>
            <div class="modal-actions">
              <button class="secondary-button" type="button" data-action="close-modal" ${this._busy ? "disabled" : ""}>Cancelar</button>
              <button class="primary-button" type="submit" ${this._busy ? "disabled" : ""}>${this._busy ? "Guardando…" : "Guardar"}</button>
            </div>
          </form>
        </section>
      </div>`;
  }

  render(force = false) {
    if (!this.shadowRoot) return;

    // Barrera definitiva: mientras exista un modal real en el DOM, ningún
    // refresco accidental puede reemplazar shadowRoot.innerHTML. Solo las
    // transiciones explícitas abrir/cerrar usan force=true.
    if (!force && this._hasLiveModal()) {
      this._renderDeferred = true;
      this._syncModalBusyState();
      return;
    }
    const config = this._config();
    const status = this._status();
    const admin = Boolean(this._hass?.user?.is_admin);
    const next = this._data?.next_holiday || null;
    const years = this._data?.years || [];
    const today = this._data?.today || new Date().toISOString().slice(0, 10);
    const dark = this._theme === "dark";
    const nextTheme = dark ? "claro" : "oscuro";

    // El tema se refleja como atributo únicamente durante el render; no se
    // añaden atributos al host desde el constructor de customElements.
    this.setAttribute("data-theme", this._theme);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #f26522;
          --primary-hover: #d95a1e;
          --primary-soft: rgba(242, 101, 34, 0.10);
          --primary-medium: rgba(242, 101, 34, 0.18);
          --primary-border: rgba(242, 101, 34, 0.38);
          --primary-glow: rgba(242, 101, 34, 0.18);
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
          --overlay: rgba(0, 10, 18, 0.76);
          --modal: #0a2739;
          --shadow: rgba(0, 0, 0, 0.15);
          --shadow-strong: rgba(0, 0, 0, 0.42);
          --success: #22c55e;
          --warning: #f59e0b;
          --error: #ef4444;
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 22px;
          --radius-pill: 999px;
          --motion: 180ms;
          display: block;
          min-height: 100%;
          container-type: inline-size;
          container-name: calendario-laboral-panel;
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
          --overlay: rgba(12, 31, 43, 0.42);
          --modal: #ffffff;
          --shadow: rgba(20, 48, 65, 0.10);
          --shadow-strong: rgba(20, 48, 65, 0.24);
          background:
            radial-gradient(circle at 10% 4%, rgba(242, 101, 34, 0.13), transparent 34%),
            radial-gradient(circle at 88% 0%, rgba(11, 43, 64, 0.08), transparent 30%),
            linear-gradient(155deg, var(--background-deep), var(--background-secondary) 60%, var(--background));
        }

        * { box-sizing: border-box; }
        button, input, textarea, select, code { font: inherit; }
        button { color: inherit; }
        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible,
        select:focus-visible { outline: 3px solid rgba(56, 189, 248, 0.65); outline-offset: 2px; }
        button:disabled { cursor: not-allowed; opacity: 0.48; }
        svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
        h1, h2, h3, p { margin: 0; }

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
        .brand { min-width: 0; display: flex; align-items: center; gap: 13px; }
        .logo-frame {
          flex: 0 0 auto;
          width: 120px;
          height: 42px;
          padding: 4px 6px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 14px;
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: background var(--motion), border-color var(--motion);
        }
        .logo-frame img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          filter: brightness(0) invert(1);
          mix-blend-mode: screen;
          transition: filter var(--motion);
        }
        :host([data-theme="light"]) .logo-frame { background: rgba(8, 35, 52, 0.05); border-color: rgba(8, 35, 52, 0.12); }
        :host([data-theme="light"]) .logo-frame img { filter: none; mix-blend-mode: multiply; }
        .brand-copy { min-width: 0; }
        .brand-copy strong { display: block; font-family: Outfit, Inter, Arial, sans-serif; font-size: 14px; font-weight: 800; white-space: nowrap; }
        .topbar-meta { display: flex; align-items: center; justify-content: flex-end; margin-left: auto; }
        .icon-button {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-default);
          border-radius: 50%;
          background: var(--surface-control);
          cursor: pointer;
          transition: transform var(--motion), background var(--motion), border-color var(--motion), color var(--motion);
        }
        .icon-button:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--primary-border); color: var(--primary); }
        .icon-button.compact { width: 36px; height: 36px; flex-basis: 36px; border-radius: 12px; }

        .dashboard { width: min(1460px, 100%); margin: 0 auto; padding: clamp(14px, 2vw, 24px); }
        .surface {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          background: var(--surface);
          box-shadow: 0 14px 36px var(--shadow), inset 0 1px 0 rgba(255,255,255,0.025);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          overflow: hidden;
        }
        .overview-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 14px; }
        .hero-card {
          min-height: 112px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          background:
            radial-gradient(circle at 95% 18%, rgba(242,101,34,.15), transparent 35%),
            linear-gradient(135deg, var(--surface-strong), transparent 75%);
        }
        .hero-copy { min-width: 0; }
        .eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          margin: 0 0 4px;
          padding: 0 10px;
          border: 1px solid rgba(242,101,34,.20);
          border-radius: var(--radius-pill);
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .hero-card h1 { font-family: Outfit, Inter, Arial, sans-serif; font-size: clamp(24px, 3vw, 36px); font-weight: 800; line-height: 1.08; letter-spacing: -.035em; }
        .hero-card h1 span { color: var(--primary); }
        .hero-card p { max-width: 720px; margin-top: 8px; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
        .system-state { min-height: 34px; padding: 0 12px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border-default); border-radius: var(--radius-pill); background: var(--surface-control); font-size: 9px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; white-space: nowrap; }
        .system-state::before { content: ""; width: 8px; height: 8px; border-radius: 50%; }
        .system-state.workday { border-color: rgba(34,197,94,.28); background: rgba(34,197,94,.09); color: var(--success); }
        .system-state.workday::before { background: var(--success); box-shadow: 0 0 0 4px rgba(34,197,94,.10); }
        .system-state.blocked { border-color: rgba(239,68,68,.30); background: rgba(239,68,68,.10); color: var(--error); }
        .system-state.blocked::before { background: var(--error); box-shadow: 0 0 0 4px rgba(239,68,68,.10); }

        .summary-grid { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.08fr) minmax(280px, 1fr); gap: 14px; margin-bottom: 14px; }
        .summary-card { min-height: 150px; padding: 16px; display: flex; flex-direction: column; }
        .summary-card.summary-card--protected { justify-content: flex-start; }
        .summary-card small { color: var(--text-secondary); font-size: 9px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
        .summary-card > strong { margin-top: 8px; font-family: Outfit, Inter, sans-serif; font-size: 22px; line-height: 1.05; letter-spacing: -.025em; }
        .summary-card p { margin-top: 6px; color: var(--text-secondary); font-size: 11px; line-height: 1.45; }
        .summary-icon { width: 38px; height: 38px; margin-bottom: auto; display: grid; place-items: center; border-radius: 13px; background: var(--primary-soft); color: var(--primary); }
        .summary-icon svg { width: 19px; height: 19px; }
        .next-date { color: var(--primary); font-size: 27px !important; }
        .protected-list { display: grid; gap: 8px; margin-top: 12px; }
        .protected-item { min-height: 56px; display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 9px 10px; border: 1px solid var(--border-subtle); border-radius: 13px; background: var(--surface-control); }
        .protected-icon { width: 30px; height: 30px; flex: 0 0 30px; display: grid; place-items: center; border-radius: 10px; background: var(--primary-soft); color: var(--primary); }
        .protected-icon svg { width: 16px; height: 16px; }
        .protected-copy { min-width: 0; }
        .protected-item strong, .protected-item small { display: block; }
        .protected-item strong { font-size: 11px; line-height: 1.32; }
        .protected-item small { margin-top: 2px; color: var(--text-tertiary); font-size: 9px; line-height: 1.35; }
        .protected-state { min-height: 24px; padding: 0 9px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-pill); font-size: 8px; font-weight: 850; letter-spacing: .06em; white-space: nowrap; }
        .protected-state.is-blocked { color: var(--error); background: rgba(239,68,68,.10); border: 1px solid rgba(239,68,68,.18); }
        .protected-state.is-live { color: var(--success); background: rgba(34,197,94,.10); border: 1px solid rgba(34,197,94,.18); }
        .protected-state.is-neutral { color: var(--text-secondary); background: var(--surface-hover); border: 1px solid var(--border-subtle); }

        .calendar-card { overflow: hidden; }
        .calendar-head { padding: 17px 18px 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--border-subtle); }
        .calendar-head h2 { margin-top: 0; font-family: Outfit, Inter, sans-serif; font-size: clamp(18px, 2.2vw, 22px); font-weight: 800; line-height: 1.15; letter-spacing: -.02em; }
        .calendar-tools { display: flex; align-items: center; gap: 8px; }
        .select-wrap { position: relative; display: block; }
        .select-wrap select { appearance: none; min-width: 138px; height: 40px; padding: 0 38px 0 12px; border: 1px solid var(--border-default); border-radius: 12px; background: var(--surface-control); color: var(--text-primary); font-size: 10px; font-weight: 750; outline: none; cursor: pointer; }
        .select-wrap svg { position: absolute; right: 10px; top: 10px; width: 18px; height: 18px; pointer-events: none; color: var(--text-secondary); }
        .primary-button, .secondary-button { min-height: 40px; padding: 0 14px; border-radius: 12px; font-size: 10px; font-weight: 800; cursor: pointer; transition: transform var(--motion), background var(--motion), border-color var(--motion), box-shadow var(--motion); }
        .primary-button { border: 0; background: var(--primary); color: white; box-shadow: 0 8px 24px var(--primary-glow); }
        .primary-button:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
        .secondary-button { border: 1px solid var(--border-default); background: var(--surface-control); }
        .secondary-button:hover:not(:disabled) { border-color: var(--primary-border); background: var(--surface-hover); }
        .add-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
        .add-button svg { width: 16px; height: 16px; }

        .holiday-list { padding: 12px; display: grid; gap: 8px; }
        .holiday-row { min-width: 0; display: grid; grid-template-columns: 78px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 12px; border: 1px solid var(--border-subtle); border-radius: 17px; background: linear-gradient(180deg, rgba(255,255,255,.02), transparent 75%); transition: background var(--motion), border-color var(--motion), box-shadow var(--motion); }
        .holiday-row:hover { border-color: var(--border-default); background: var(--surface-control); box-shadow: 0 10px 24px var(--shadow); }
        .holiday-row.is-inactive { opacity: .72; }
        .holiday-row.is-active { border-color: rgba(242,101,34,.14); }
        .date-block { min-height: 64px; padding: 8px; display: grid; place-items: center; border: 1px solid var(--primary-border); border-radius: 15px; background: var(--primary-soft); color: var(--primary); box-shadow: inset 0 1px 0 rgba(255,255,255,.18); }
        .date-block strong { font-family: Outfit, Inter, sans-serif; font-size: 17px; line-height: 1; }
        .date-block span { font-size: 9px; font-weight: 800; letter-spacing: .08em; }
        .holiday-heading { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .holiday-copy { min-width: 0; }
        .holiday-copy h3 { font-size: 13px; font-weight: 800; line-height: 1.3; overflow-wrap: anywhere; }
        .holiday-copy p { margin-top: 4px; color: var(--text-secondary); font-size: 10px; line-height: 1.45; }
        .holiday-copy p.muted { color: var(--text-tertiary); }
        .holiday-state { min-height: 22px; padding: 0 8px; display: inline-flex; align-items: center; border-radius: var(--radius-pill); font-size: 8px; font-weight: 850; letter-spacing: .07em; }
        .holiday-state.active { background: rgba(34,197,94,.10); color: var(--success); }
        .holiday-state.inactive { background: var(--surface-control); color: var(--text-tertiary); }
        .row-actions { display: grid; grid-template-columns: repeat(3, auto); gap: 6px; justify-content: end; }
        .small-action { min-height: 35px; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 1px solid var(--border-default); border-radius: 11px; background: var(--surface-control); font-size: 9px; font-weight: 800; cursor: pointer; transition: background var(--motion), border-color var(--motion), color var(--motion), transform var(--motion); }
        .small-action:hover:not(:disabled) { border-color: var(--primary-border); background: var(--surface-hover); transform: translateY(-1px); }
        .small-action svg { width: 14px; height: 14px; }
        .small-action.danger { color: var(--error); }
        .small-action.danger-soft { color: var(--warning); }
        .small-action.success-soft { color: var(--success); }
        .empty-state { min-height: 100px; padding: 18px; display: grid; place-items: center; color: var(--text-secondary); font-size: 11px; text-align: center; }
        .read-only-note { margin: 12px 18px 0; padding: 10px 12px; border: 1px solid rgba(245,158,11,.20); border-radius: 12px; background: rgba(245,158,11,.08); color: var(--warning); font-size: 10px; font-weight: 700; }
        .storage-note { padding: 11px 18px 14px; border-top: 1px solid var(--border-subtle); color: var(--text-tertiary); font-size: 9px; line-height: 1.5; }
        .storage-note code { color: var(--text-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

        .error { margin-bottom: 14px; padding: 11px 13px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(239,68,68,.24); border-radius: 13px; background: rgba(239,68,68,.10); color: var(--error); font-size: 11px; font-weight: 750; }
        .error svg { width: 17px; height: 17px; flex: 0 0 auto; }
        .loading { min-height: 180px; padding: 40px 20px; display: grid; place-items: center; align-content: center; gap: 10px; color: var(--text-secondary); font-size: 11px; }
        .spinner { width: 24px; height: 24px; border: 3px solid var(--border-default); border-top-color: var(--primary); border-radius: 50%; animation: spin .75s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .toast { position: fixed; right: 20px; bottom: 20px; z-index: 70; max-width: min(460px, calc(100vw - 40px)); min-height: 46px; padding: 10px 11px 10px 15px; display: flex; align-items: center; gap: 14px; border: 1px solid var(--border-default); border-radius: 13px; background: var(--modal); color: var(--text-primary); box-shadow: 0 20px 50px var(--shadow-strong); font-size: 11px; font-weight: 750; }
        .toast-message { min-width: 0; flex: 1; }
        .toast-action { min-height: 32px; padding: 0 10px; border: 1px solid var(--primary-border); border-radius: 9px; background: var(--primary-soft); color: var(--primary); font-size: 10px; font-weight: 850; cursor: pointer; transition: background var(--motion), border-color var(--motion), transform var(--motion); }
        .toast-action:hover:not(:disabled) { background: var(--primary-medium); transform: translateY(-1px); }

        .modal-backdrop { position: fixed; inset: 0; z-index: 60; padding: 20px; display: grid; place-items: center; background: var(--overlay); backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px); }
        .modal { width: min(560px, 100%); max-height: calc(100vh - 40px); overflow: auto; padding: 20px; border: 1px solid var(--primary-border); border-radius: 24px; background: var(--modal); box-shadow: 0 24px 70px var(--shadow-strong); }
        .modal-head { margin-bottom: 18px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .modal-head h2 { margin-top: 2px; font-family: Outfit, Inter, sans-serif; font-size: 21px; font-weight: 800; letter-spacing: -.025em; }
        .modal-error { margin: -4px 0 14px; padding: 10px 12px; border: 1px solid rgba(239, 68, 68, .34); border-radius: 11px; background: rgba(239, 68, 68, .08); color: var(--error); font-size: 10px; font-weight: 700; line-height: 1.4; }
        .modal-error[hidden] { display: none; }
        .modal form { display: grid; gap: 13px; }
        .field > span { display: block; margin-bottom: 6px; color: var(--text-secondary); font-size: 9px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
        .field > span small { color: var(--text-tertiary); font-weight: 650; letter-spacing: 0; text-transform: none; }
        .field input, .field textarea { width: 100%; padding: 11px 12px; border: 1px solid var(--border-default); border-radius: 12px; outline: none; background: var(--surface-control); color: var(--text-primary); font-size: 11px; }
        .field input:focus, .field textarea:focus { border-color: var(--primary-border); box-shadow: 0 0 0 3px var(--primary-soft); }
        .field textarea { min-height: 92px; resize: vertical; }
        .switch-field { padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 18px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--surface-control); cursor: pointer; }
        .switch-field div strong, .switch-field div span { display: block; }
        .switch-field div strong { font-size: 11px; }
        .switch-field div span { margin-top: 3px; color: var(--text-secondary); font-size: 9px; line-height: 1.4; }
        .switch-field input { position: absolute; opacity: 0; pointer-events: none; }
        .switch-field i { position: relative; width: 42px; height: 24px; flex: 0 0 42px; border: 1px solid var(--border-default); border-radius: var(--radius-pill); background: var(--surface-hover); transition: background var(--motion), border-color var(--motion); }
        .switch-field i::after { content: ""; position: absolute; width: 18px; height: 18px; left: 2px; top: 2px; border-radius: 50%; background: var(--text-secondary); transition: transform var(--motion), background var(--motion); }
        .switch-field input:checked + i { border-color: var(--primary-border); background: var(--primary-medium); }
        .switch-field input:checked + i::after { transform: translateX(18px); background: var(--primary); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }

        @media (max-width: 960px) {
          .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .summary-grid .summary-card:last-child { grid-column: 1 / -1; }
          .holiday-row { grid-template-columns: 72px minmax(0, 1fr) 118px; align-items: start; }
          .row-actions { grid-template-columns: 1fr; width: 118px; justify-content: stretch; }
          .small-action { width: 100%; justify-content: flex-start; }
        }
        @media (max-width: 680px) {
          .topbar { padding-inline: 12px; }
          .brand-copy { display: none; }
          .dashboard { padding: 12px 10px; }
          .hero-card { min-height: 0; padding: 16px 18px; grid-template-columns: 1fr; gap: 12px; }
          .hero-card h1 { font-size: clamp(22px, 5.5vw, 30px); }
          .system-state { width: fit-content; }
          .calendar-head { align-items: stretch; display: block; }
          .calendar-tools { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; }
          .select-wrap select { width: 100%; min-width: 0; }
          .modal-backdrop { padding: 10px; }
          .modal { max-height: calc(100vh - 20px); padding: 17px; border-radius: 20px; }
          .toast { right: 12px; bottom: 12px; max-width: calc(100vw - 24px); }
        }
        @media (max-width: 560px) {
          .summary-grid { grid-template-columns: 1fr; gap: 10px; }
          .summary-grid .summary-card:last-child { grid-column: auto; }
          .summary-card { min-height: 132px; }
          .holiday-list { padding: 10px; }
          .holiday-row { grid-template-columns: 64px minmax(0, 1fr); gap: 10px; padding: 10px; }
          .date-block { min-height: 60px; }
          .row-actions { grid-column: 1 / -1; grid-template-columns: repeat(3, minmax(0, 1fr)); width: auto; }
          .small-action { width: 100%; justify-content: center; }
          .protected-item { grid-template-columns: 30px minmax(0, 1fr); }
          .protected-state { grid-column: 2; justify-self: start; }
        }
        @media (max-width: 430px) {
          .logo-frame { width: 108px; height: 40px; }
          .calendar-tools { grid-template-columns: 1fr; }
          .small-action { padding: 0 6px; font-size: 8.5px; }
          .small-action svg { width: 13px; height: 13px; }
          .modal-actions { display: grid; grid-template-columns: 1fr 1fr; }
          .next-date { font-size: 24px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
        }
        @media (max-width: 760px), (prefers-reduced-transparency: reduce) {
          .surface, .topbar, .modal-backdrop, .logo-frame { backdrop-filter: none; -webkit-backdrop-filter: none; }
        }
      </style>

      <div class="app-shell">
        <header class="topbar">
          <div class="topbar-start">
            <button class="icon-button" data-action="toggle-menu" aria-label="Abrir menú de Home Assistant" title="Abrir menú">${this._icon("menu")}</button>
            <div class="brand">
              <div class="logo-frame" title="Calendario Laboral v${CALENDAR_PANEL_VERSION}"><img src="${this._escape(config.logo)}" alt="Witmind"></div>
            </div>
          </div>
          <div class="topbar-meta">
            <button class="icon-button" data-action="toggle-theme" aria-label="Cambiar a tema ${nextTheme}" title="Cambiar a tema ${nextTheme}">${dark ? this._icon("moon") : this._icon("sun")}</button>
          </div>
        </header>

        <main class="dashboard">
          ${this._error ? `<div class="error">${this._icon("alert")}<span>${this._escape(this._error)}</span></div>` : ""}

          <section class="overview-grid">
            <article class="surface hero-card">
              <div class="hero-copy">
                <h1>${this._escape(config.title)} <span>Witmind</span></h1>
                <p>${this._escape(config.subtitle)}</p>
              </div>
              <div class="system-state ${status.blocked ? "blocked" : "workday"}">${status.blocked ? "Día no laborable" : "Día laboral"}</div>
            </article>
          </section>

          ${this._loading && !this._data ? `<section class="surface loading"><span class="spinner"></span><div>Cargando calendario persistente…</div></section>` : `
          <section class="summary-grid">
            <article class="surface summary-card">
              <span class="summary-icon">${this._icon("calendar")}</span>
              <small>Hoy</small><strong>${this._escape(this._formatDate(today, { day:"2-digit", month:"2-digit", year:"numeric" }))}</strong>
              <p>${this._escape(status.reason || (status.blocked ? "Automatizaciones pausadas" : "Automatizaciones disponibles"))}</p>
            </article>
            <article class="surface summary-card">
              <span class="summary-icon">${this._icon("calendar")}</span>
              <small>Próximo feriado registrado</small><strong class="next-date">${next ? this._escape(this._formatDate(next.date, { day:"2-digit", month:"2-digit", year:"numeric" })) : "—"}</strong>
              <p>${next ? this._escape(next.name) : "No hay otro feriado activo cargado."}</p>
            </article>
            <article class="surface summary-card summary-card--protected">
              <small>Automatizaciones pausadas en días festivos</small>
              <div class="protected-list">${this._protectedAutomations(status)}</div>
            </article>
          </section>

          <section class="surface calendar-card">
            <div class="calendar-head">
              <div>
                <h2>Días festivos registrados</h2>
              </div>
              <div class="calendar-tools">
                <label class="select-wrap" aria-label="Filtrar por año"><select data-year-filter><option value="all" ${this._year === "all" ? "selected" : ""}>Todos los años</option>${years.map((year) => `<option value="${year}" ${String(this._year) === String(year) ? "selected" : ""}>${year}</option>`).join("")}</select>${this._icon("chevron")}</label>
                <button class="primary-button add-button" data-action="add" ${!admin || this._busy ? "disabled" : ""}>${this._icon("plus")}Agregar feriado</button>
              </div>
            </div>
            ${!admin ? `<div class="read-only-note">Sesión de solo lectura. El CRUD del calendario requiere un usuario administrador de Home Assistant.</div>` : ""}
            <div class="holiday-list">${this._holidayRows()}</div>
          </section>`}
        </main>
      </div>
      ${this._modalMarkup()}
      ${this._toast ? `<div class="toast" role="status" aria-live="polite"><span class="toast-message">${this._escape(this._toast)}</span>${this._toastAction === "undo-delete" ? `<button class="toast-action" type="button" data-action="undo-delete" ${this._busy ? "disabled" : ""}>Deshacer</button>` : ""}</div>` : ""}
    `;
  }
}

if (!customElements.get("witmind-calendario-laboral-panel")) {
  customElements.define("witmind-calendario-laboral-panel", WitmindCalendarioLaboralPanel);
}
