import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components";
import type { ActivityCategory, SmartActivity } from "../../models";
import { ActivityStore, demoStore } from "../../stores";

@customElement("activity-view")
export class ActivityView extends LitElement {
  @state() private currentFilter: "all" | ActivityCategory = "all";
  @state() private activities: SmartActivity[] = ActivityStore.getActivities("all");
  private unsubscribeStore: (() => void) | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.activities = ActivityStore.getActivities(this.currentFilter);
    this.unsubscribeStore = demoStore.subscribe(() => {
      this.activities = ActivityStore.getActivities(this.currentFilter);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeStore?.();
  }

  private setFilter(filter: "all" | ActivityCategory) {
    this.currentFilter = filter;
    this.activities = ActivityStore.getActivities(filter);
  }

  render() {
    const filters: Array<{ id: "all" | ActivityCategory; label: string }> = [
      { id: "all", label: "Todos los Eventos" },
      { id: "lighting", label: "Iluminación" },
      { id: "climate", label: "Climatización" },
      { id: "energy", label: "Energía" },
      { id: "occupancy", label: "Ocupación" },
      { id: "scene", label: "Escenas" },
      { id: "automation", label: "Automatizaciones" },
      { id: "system", label: "Sistema" },
    ];

    return html`
      <section>
        <header>
          <h1>Registro de Actividad y Auditoría Explicable</h1>
          <p>
            Historial cronológico de decisiones autónomas y acciones manuales registradas en el motor simulado.
          </p>
        </header>

        <div>
          <h3>Filtros por Categoría:</h3>
          <div>
            ${filters.map(
              (f) => html`
                <button
                  type="button"
                  @click=${() => this.setFilter(f.id)}
                >
                  ${this.currentFilter === f.id ? html`<strong>[ ${f.label} ]</strong>` : f.label}
                </button>
              `,
            )}
          </div>
        </div>

        <div>
          <h2>Eventos Registrados (${this.activities.length})</h2>
          ${
            this.activities.length === 0
              ? html`<p>No hay actividades registradas en la categoría seleccionada.</p>`
              : html`
                <ul>
                  ${this.activities.map(
                    (act) => html`
                      <li>
                        <article>
                          <h4>
                            [${act.timestamp}] [${act.category.toUpperCase()}] ${act.title}
                            ${act.source ? html`<small>(${act.source})</small>` : ""}
                          </h4>
                          <p><strong>Causa:</strong> ${act.reason}</p>
                          <p><strong>Acción:</strong> ${act.action}</p>
                          ${
                            act.impact
                              ? html`
                                <p>
                                  <small>
                                    Impacto: ${act.impact.wattsSaved ? `${act.impact.wattsSaved} W ahorrados` : ""}
                                    ${act.impact.moneySaved ? ` | $${act.impact.moneySaved}` : ""}
                                  </small>
                                </p>
                              `
                              : ""
                          }
                        </article>
                      </li>
                    `,
                  )}
                </ul>
              `
          }
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "activity-view": ActivityView;
  }
}
