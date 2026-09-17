import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { calculateBuildingDevicePower } from "../../services/energy.service";
import {
  ActivityStore,
  ClimateStore,
  EnergyStore,
  demoStore,
  deviceStore,
  spaceStore,
} from "../../stores";

@customElement("overview-view")
export class OverviewView extends LitElement {
  @state() private energy = EnergyStore.getOverview();
  @state() private activities = ActivityStore.getActivities().slice(0, 5);
  @state() private recommendation = ClimateStore.getRecommendation();
  @state() private scenarioName = demoStore.getCurrentScenario().name;
  @state() private clockTime = demoStore.getClockTime();
  @state() private history = demoStore.getHistory();
  @state() private isError = demoStore.isSimulatedError();

  private unsubscribeStore: (() => void) | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeStore = demoStore.subscribe(() => {
      this.isError = demoStore.isSimulatedError();
      if (!this.isError) {
        this.energy = EnergyStore.getOverview();
        this.activities = ActivityStore.getActivities().slice(0, 5);
        this.recommendation = ClimateStore.getRecommendation();
        this.scenarioName = demoStore.getCurrentScenario().name;
        this.clockTime = demoStore.getClockTime();
        this.history = demoStore.getHistory();
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeStore?.();
  }

  private handleAcceptRecommendation() {
    ClimateStore.acceptRecommendation();
  }

  private handleDismissRecommendation() {
    ClimateStore.dismissRecommendation();
  }

  render() {
    if (this.isError) {
      return html`
        <section>
          <header>
            <h2>Error de Simulación</h2>
          </header>
          <p>⚠️ <strong>Falla simulada de conexión</strong>: No se pudo conectar con el backend de telemetría.</p>
          <button type="button" @click=${() => demoStore.setSimulatedError(false)}>Reintentar Conexión</button>
        </section>
      `;
    }

    const spaces = spaceStore.getAll();
    const devices = deviceStore.getAll();
    const deviceSummary = calculateBuildingDevicePower(devices);

    return html`
      <section>
        <header>
          <h1>Inicio — Witmind Smart Building</h1>
          <p>
            <strong>Estado:</strong> Inteligencia de Edificio Activa
            | <strong>Escenario:</strong> ${this.scenarioName}
            | <strong>Hora Virtual:</strong> ${this.clockTime}
          </p>
        </header>

        <div>
          <h2>Métricas de Edificio</h2>
          <table>
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor Actual</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Porcentaje de Ahorro</td>
                <td><strong>${this.energy.savingsPercent}%</strong></td>
                <td>vs Línea Base Estándar</td>
              </tr>
              <tr>
                <td>Energía Ahorrada</td>
                <td><strong>${this.energy.energySavedKwh} kWh</strong></td>
                <td>$${this.energy.moneySaved} ahorrados hoy</td>
              </tr>
              <tr>
                <td>Potencia Eléctrica Activa</td>
                <td><strong>${deviceSummary.currentPowerW} W</strong></td>
                <td>de ${deviceSummary.nominalPowerW} W nominales</td>
              </tr>
              <tr>
                <td>Dispositivos en Operación</td>
                <td><strong>${deviceSummary.activeDevicesCount} ON</strong></td>
                <td>de ${deviceSummary.totalDevicesCount} dispositivos totales</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2>Control General del Edificio</h2>
          <button type="button" @click=${() => deviceStore.turnAllOn()}>
            Encendido General de Luces
          </button>
          <button type="button" @click=${() => deviceStore.turnAllOff()}>
            Apagado General de Luces
          </button>
        </div>

        ${
          this.recommendation
            ? html`
                <article>
                  <h3>💡 Recomendación Autónoma: ${this.recommendation.title}</h3>
                  <p>${this.recommendation.description}</p>
                  <button type="button" @click=${this.handleAcceptRecommendation}>
                    ${this.recommendation.actionLabel}
                  </button>
                  <button type="button" @click=${this.handleDismissRecommendation}>
                    ${this.recommendation.skipLabel}
                  </button>
                </article>
              `
            : ""
        }

        <div>
          <h2>Espacios</h2>
          <ul>
            ${spaces.map(
              (space) => html`
                <li>
                  <a href="#/spaces/${space.id}"><strong>${space.name}</strong></a>
                  — ${space.description || ""}
                  (<a href="#/spaces/${space.id}/lighting">Iluminación</a> |
                  <a href="#/spaces/${space.id}/energy">Energía</a> |
                  <a href="#/spaces/${space.id}/scenes">Escenas</a>)
                </li>
              `,
            )}
          </ul>
        </div>

        <div>
          <h2>Telemetría Reciente</h2>
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Consumo Real (kWh)</th>
                <th>Línea Base (kWh)</th>
                <th>Daylight Lux</th>
                <th>Temperatura (°C)</th>
              </tr>
            </thead>
            <tbody>
              ${this.history.slice(-5).map(
                (h) => html`
                  <tr>
                    <td>${h.time}</td>
                    <td>${h.actualKwh}</td>
                    <td>${h.baselineKwh}</td>
                    <td>${h.daylightLux}</td>
                    <td>${h.temperature}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2>Últimas Decisiones del Asistente</h2>
          <ul>
            ${this.activities.map(
              (act) => html`
                <li>
                  [${act.timestamp}] <strong>${act.title}</strong> — ${act.reason}
                  <em>(${act.action})</em>
                </li>
              `,
            )}
          </ul>
          <p><a href="#/operations/activity">Ver registro completo de actividad →</a></p>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "overview-view": OverviewView;
  }
}
