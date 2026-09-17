import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Space } from "../../../models/space";
import { climateStore } from "../../../stores/climate.store";
import { demoStore } from "../../../stores/demo.store";

@customElement("space-climate")
export class SpaceClimate extends LitElement {
  @property({ type: Object }) space!: Space;

  protected createRenderRoot() {
    return this;
  }

  private handleSetTemp(zoneId: string, delta: number) {
    const zone = climateStore.getZoneById(zoneId);
    if (!zone || !zone.climate) return;
    const newTemp = Math.round((zone.climate.targetTemperature + delta) * 10) / 10;
    demoStore.updateZoneInput(zoneId, { targetTemperature: newTemp });
  }

  render() {
    if (!this.space) return html``;

    const zones = climateStore
      .getZones()
      .filter((z: { id: string }) => this.space.zoneIds.includes(z.id));

    return html`
      <section>
        <header>
          <h3>Climatización — ${this.space.name}</h3>
          <p>Monitoreo de temperatura ambiente y control de consignas de confort.</p>
        </header>

        ${
          zones.length === 0
            ? html`<p>No hay zonas climáticas asignadas a este espacio.</p>`
            : html`
              <div>
                ${zones.map(
                  (zone: {
                    id: string;
                    name: string;
                    climate?: {
                      currentTemperature: number;
                      targetTemperature: number;
                      mode: string;
                    };
                  }) => html`
                    <article>
                      <h4>${zone.name}</h4>
                      <p>
                        <strong>Temperatura actual:</strong> ${zone.climate?.currentTemperature}°C
                        | <strong>Objetivo:</strong> ${zone.climate?.targetTemperature}°C
                        | <strong>Modo:</strong> ${zone.climate?.mode}
                      </p>
                      <div>
                        <button
                          type="button"
                          @click=${() => this.handleSetTemp(zone.id, -0.5)}
                        >
                          -0.5°C
                        </button>
                        <button
                          type="button"
                          @click=${() => this.handleSetTemp(zone.id, 0.5)}
                        >
                          +0.5°C
                        </button>
                      </div>
                    </article>
                  `,
                )}
              </div>
            `
        }
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "space-climate": SpaceClimate;
  }
}
