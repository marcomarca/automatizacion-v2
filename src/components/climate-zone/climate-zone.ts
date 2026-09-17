import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Zone } from "../../models";

@customElement("climate-zone")
export class ClimateZone extends LitElement {
  @property({ type: Object }) zone!: Zone;

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.zone || !this.zone.climate) return html``;

    const { name, type, occupancy, climate } = this.zone;

    return html`
      <article>
        <header>
          <div>
            <h3>${name}</h3>
            <span>${type} &bull; ${occupancy.occupied ? "Ocupado" : `Desocupado (${occupancy.absenceMinutes}m)`}</span>
          </div>
          <div>
            <span>Modo: ${climate.mode.toUpperCase()}</span>
            <span>${climate.withinTarget ? "[En Rango]" : "[Fuera de Rango]"}</span>
          </div>
        </header>

        <ul>
          <li><strong>Temp Actual:</strong> ${climate.currentTemperature}°C</li>
          <li><strong>Consigna:</strong> ${climate.targetTemperature}°C (Confort: ${climate.minComfortTemperature}-${climate.maxComfortTemperature}°C)</li>
          <li><strong>Cumplimiento Térmico:</strong> ${climate.timeWithinTargetPercent}%</li>
        </ul>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "climate-zone": ClimateZone;
  }
}
