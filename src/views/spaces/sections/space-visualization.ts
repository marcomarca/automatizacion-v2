import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Space } from "../../../models/space";
import { deviceStore } from "../../../stores/device.store";

@customElement("space-visualization")
export class SpaceVisualization extends LitElement {
  @property({ type: Object }) space!: Space;

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.space) return html``;

    const devices = deviceStore.getBySpace(this.space.id);

    return html`
      <section>
        <header>
          <h3>Visualización — ${this.space.name}</h3>
          <p>Estado mock de luminarias y sensores para mapeo espacial 3D.</p>
        </header>

        <div>
          <h4>Disposición de Dispositivos</h4>
          <ul>
            ${devices.map(
              (dev) => html`
                <li>
                  <strong>${dev.name}:</strong> ${dev.powerState === "on" ? "ON" : "OFF"}
                  ${dev.brightnessPct !== undefined ? `(${dev.brightnessPct}%)` : ""}
                  — ${dev.actualPowerW ?? 0} W
                </li>
              `,
            )}
          </ul>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "space-visualization": SpaceVisualization;
  }
}
