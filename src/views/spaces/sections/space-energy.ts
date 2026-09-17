import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Space } from "../../../models/space";
import { calculateSpacePower } from "../../../services/energy.service";
import { deviceStore } from "../../../stores/device.store";

@customElement("space-energy")
export class SpaceEnergy extends LitElement {
  @property({ type: Object }) space!: Space;

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.space) return html``;

    const devices = deviceStore.getBySpace(this.space.id);
    const summary = calculateSpacePower(devices);

    return html`
      <section>
        <header>
          <h3>Energía — ${this.space.name}</h3>
          <p>Desglose de potencia eléctrica activa y ahorros calculados.</p>
        </header>

        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Potencia Actual</td>
              <td><strong>${summary.currentPowerW} W</strong></td>
            </tr>
            <tr>
              <td>Potencia Nominal de Base</td>
              <td>${summary.nominalPowerW} W</td>
            </tr>
            <tr>
              <td>Ahorro Instantáneo</td>
              <td>${summary.savedPowerW} W</td>
            </tr>
            <tr>
              <td>Porcentaje de Ahorro</td>
              <td>${summary.savingsPercent}%</td>
            </tr>
          </tbody>
        </table>

        <h4>Desglose por Dispositivo</h4>
        <table>
          <thead>
            <tr>
              <th>Dispositivo</th>
              <th>Estado</th>
              <th>Potencia Actual</th>
              <th>Potencia Nominal</th>
            </tr>
          </thead>
          <tbody>
            ${devices.map(
              (dev) => html`
                <tr>
                  <td>${dev.name}</td>
                  <td>${dev.powerState?.toUpperCase()}</td>
                  <td>${dev.actualPowerW ?? 0} W</td>
                  <td>${dev.nominalPowerW ?? 0} W</td>
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
    "space-energy": SpaceEnergy;
  }
}
