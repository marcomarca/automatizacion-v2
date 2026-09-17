import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Zone } from "../../models";

@customElement("zone-card")
export class ZoneCard extends LitElement {
  @property({ type: Object }) zone!: Zone;

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.zone) return html``;

    const { name, occupancy, lighting, climate } = this.zone;

    return html`
      <article>
        <header>
          <h3>${name}</h3>
          <span>
            ${occupancy.occupied ? "Ocupado" : `Desocupado (${occupancy.absenceMinutes}m)`}
          </span>
        </header>

        <ul>
          <li>
            <strong>Iluminación:</strong>
            ${lighting ? `${lighting.brightness}% (${lighting.actualPowerW}W)` : "N/A"}
          </li>
          <li>
            <strong>Luz Natural:</strong>
            ${lighting ? `${lighting.daylightLux} lx` : "N/A"}
          </li>
          <li>
            <strong>Temperatura:</strong>
            ${climate ? `${climate.currentTemperature}°C` : "N/A"}
          </li>
          <li>
            <strong>Rango Confort:</strong>
            ${climate ? `${climate.minComfortTemperature}-${climate.maxComfortTemperature}°C` : "N/A"}
          </li>
        </ul>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zone-card": ZoneCard;
  }
}
