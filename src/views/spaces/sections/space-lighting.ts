import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Space } from "../../../models/space";
import { deviceStore } from "../../../stores/device.store";
import "../../../components/device-control/device-control";

@customElement("space-lighting")
export class SpaceLighting extends LitElement {
  @property({ type: Object }) space!: Space;

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.space) return html``;

    const devices = deviceStore.getLightingBySpace(this.space.id);

    return html`
      <section>
        <header>
          <h3>Iluminación — ${this.space.name}</h3>
          <p>Control directo de luminarias, circuitos y nivel de atenuación.</p>
        </header>

        <div>
          <button type="button" @click=${() => deviceStore.turnSpaceOn(this.space.id)}>
            Encender Todo
          </button>
          <button type="button" @click=${() => deviceStore.turnSpaceOff(this.space.id)}>
            Apagar Todo
          </button>
        </div>

        ${
          devices.length === 0
            ? html`<p>No hay dispositivos de iluminación configurados en este espacio.</p>`
            : html`
              <div>
                ${devices.map(
                  (device) => html`
                    <device-control .device=${device}></device-control>
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
    "space-lighting": SpaceLighting;
  }
}
