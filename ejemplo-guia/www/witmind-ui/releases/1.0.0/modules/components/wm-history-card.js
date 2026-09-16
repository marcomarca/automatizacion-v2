import { entityState, isEntityAvailable } from "../core/entity-state.js";
import { buildHistorySegments } from "../core/history-segments.js";
import { RuntimeElement } from "../core/runtime-element.js";
import { escapeHtml } from "../ui/escape.js";
import { iconMarkup } from "../ui/icon.js";
export class WmHistoryCard extends RuntimeElement {
    _config = null;
    data = [];
    busy = false;
    error = "";
    loadedOnce = false;
    timer;
    onClick = (event) => {
        const target = event.target;
        if (target?.closest("[data-refresh]"))
            void this.load(true);
    };
    set config(value) {
        this._config = value;
        this.loadedOnce = false;
        void this.load();
    }
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("click", this.onClick);
        void this.load();
        this.timer = globalThis.setInterval(() => void this.load(), 60_000);
    }
    disconnectedCallback() {
        this.removeEventListener("click", this.onClick);
        if (this.timer !== undefined)
            globalThis.clearInterval(this.timer);
        super.disconnectedCallback();
    }
    update() {
        if (!this.isConnected || !this._config)
            return;
        const hours = Number(this._config.hours || 2);
        const endTime = Date.now();
        const startTime = endTime - hours * 3_600_000;
        const groups = new Map();
        for (const group of this.data) {
            const entityId = group[0]?.entity_id;
            if (entityId)
                groups.set(entityId, group);
        }
        const rows = this._config.entities
            .map((item) => {
            const group = groups.get(item.entityId) ?? [];
            const segments = buildHistorySegments(group, startTime, endTime);
            const current = entityState(this.runtime?.hass, item.entityId);
            const status = !current
                ? "Entidad inexistente"
                : isEntityAvailable(current)
                    ? current.state === "on"
                        ? "Encendido"
                        : "Apagado"
                    : "No disponible";
            return `
          <div class="wm-history-row">
            <div class="wm-history-label">
              <strong>${escapeHtml(item.label)}</strong>
              <small>${escapeHtml(status)}</small>
            </div>
            <div class="wm-timeline" aria-label="Historial de ${escapeHtml(item.label)}">
              ${segments.length
                ? segments
                    .map((segment) => `
                          <span class="wm-timeline-segment" data-state="${segment.state === "on" ? "on" : "off"}" style="left:${segment.left}%;width:${segment.width}%"></span>
                        `)
                    .join("")
                : '<span class="wm-timeline-empty">Sin datos</span>'}
            </div>
          </div>
        `;
        })
            .join("");
        this.innerHTML = `
      <article class="wm-card wm-history-card">
        <div class="wm-card-heading">
          <div>
            <span class="wm-eyebrow">Últimas ${hours} horas</span>
            <h2>${escapeHtml(this._config.title)}</h2>
          </div>
          <button class="wm-icon-button ${this.busy ? "is-busy" : ""}" type="button" data-refresh aria-label="Actualizar historial" ${this.busy ? "disabled" : ""}>
            ${iconMarkup("refresh")}
          </button>
        </div>
        ${this.error
            ? `<p class="wm-error-message">${escapeHtml(this.error)}</p>`
            : `
              <div class="wm-history-scale">
                <span>−${hours} h</span>
                <span>−${Math.max(1, Math.floor(hours / 2))} h</span>
                <span>Ahora</span>
              </div>
              <div class="wm-history-list">${rows}</div>
            `}
      </article>
    `;
    }
    async load(force = false) {
        if (!this.isConnected || !this.runtime?.hass || !this._config || this.busy) {
            return;
        }
        if (this.loadedOnce && !force && document.hidden)
            return;
        this.busy = true;
        this.update();
        try {
            this.data = await this.runtime.history.load(this._config);
            this.error = "";
            this.loadedOnce = true;
        }
        catch (error) {
            this.error =
                error instanceof Error
                    ? error.message
                    : "No se pudo cargar el historial.";
        }
        finally {
            this.busy = false;
            this.update();
        }
    }
}
