import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { calculateBuildingDevicePower } from "../../../services/energy.service";
import { EnergyStore, demoStore, deviceStore, spaceStore } from "../../../stores";

@customElement("systems-energy-view")
export class SystemsEnergyView extends LitElement {
  @state() private energy = EnergyStore.getOverview();
  @state() private history = demoStore.getHistory();
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.energy = EnergyStore.getOverview();
    this.history = demoStore.getHistory();
    this.unsubscribe = demoStore.subscribe(() => {
      this.energy = EnergyStore.getOverview();
      this.history = demoStore.getHistory();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    const spaces = spaceStore.getAll();
    const devices = deviceStore.getAll();
    const buildingSummary = calculateBuildingDevicePower(devices);

    return html`
      <section>
        <header>
          <h1>Sistema de Gestión Energética</h1>
          <p>Monitoreo de potencia activa, ahorros simulados y balance por espacio.</p>
        </header>

        <div>
          <h2>Resumen Global de Potencia</h2>
          <table>
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor Actual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Potencia Eléctrica Activa</td>
                <td><strong>${buildingSummary.currentPowerW} W</strong></td>
              </tr>
              <tr>
                <td>Potencia Nominal Base</td>
                <td>${buildingSummary.nominalPowerW} W</td>
              </tr>
              <tr>
                <td>Ahorro Instantáneo</td>
                <td><strong>${buildingSummary.savedPowerW} W</strong> (${buildingSummary.savingsPercent}%)</td>
              </tr>
              <tr>
                <td>Energía Acumulada Ahorrada</td>
                <td>${this.energy.energySavedKwh} kWh ($${this.energy.moneySaved})</td>
              </tr>
              <tr>
                <td>Emisiones de CO₂ Evitadas</td>
                <td>${this.energy.co2AvoidedKg} kg CO₂</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2>Consumo por Espacio</h2>
          <table>
            <thead>
              <tr>
                <th>Espacio</th>
                <th>Dispositivos ON</th>
                <th>Potencia Activa</th>
                <th>Potencia Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${spaces.map((space) => {
                const spaceDevs = deviceStore.getBySpace(space.id);
                const activeCount = spaceDevs.filter((d) => d.powerState === "on").length;
                const actW = spaceDevs.reduce((sum, d) => sum + (d.actualPowerW ?? 0), 0);
                const nomW = spaceDevs.reduce((sum, d) => sum + (d.nominalPowerW ?? 0), 0);

                return html`
                  <tr>
                    <td><a href="#/spaces/${space.id}/energy">${space.name}</a></td>
                    <td>${activeCount} / ${spaceDevs.length}</td>
                    <td>${actW} W</td>
                    <td>${nomW} W</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>

        <div>
          <h2>Historial de Telemetría</h2>
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Real (kWh)</th>
                <th>Línea Base (kWh)</th>
                <th>Aporte Solar (Lux)</th>
              </tr>
            </thead>
            <tbody>
              ${this.history.slice(-10).map(
                (h) => html`
                  <tr>
                    <td>${h.time}</td>
                    <td>${h.actualKwh}</td>
                    <td>${h.baselineKwh}</td>
                    <td>${h.daylightLux}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "systems-energy-view": SystemsEnergyView;
  }
}
