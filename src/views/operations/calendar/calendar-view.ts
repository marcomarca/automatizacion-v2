import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { MockCalendarDay } from "../../../models/calendar";
import { calendarStore } from "../../../stores/calendar.store";

@customElement("operations-calendar-view")
export class OperationsCalendarView extends LitElement {
  @state() private days: MockCalendarDay[] = calendarStore.getAll();
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.days = calendarStore.getAll();
    this.unsubscribe = calendarStore.subscribe(() => {
      this.days = calendarStore.getAll();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    return html`
      <section>
        <header>
          <h1>Calendario Laboral de Edificio</h1>
          <p>Configuración de días laborales, feriados y horarios de apertura para reglas automáticas.</p>
        </header>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo de Jornada</th>
              <th>Horario Apertura - Cierre</th>
              <th>Descripción / Feriado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${this.days.map(
              (day) => html`
                <tr>
                  <td><strong>${day.date}</strong></td>
                  <td>${day.workingDay ? "Laboral" : "No Laboral"}</td>
                  <td>${day.workingDay ? `${day.openingTime || "08:30"} - ${day.closingTime || "19:00"}` : "Cerrado"}</td>
                  <td>${day.holidayName || day.description || "-"}</td>
                  <td>
                    <button
                      type="button"
                      @click=${() => calendarStore.toggleWorkingDay(day.date)}
                    >
                      ${day.workingDay ? "Marcar No Laboral" : "Marcar Laboral"}
                    </button>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "operations-calendar-view": OperationsCalendarView;
  }
}
