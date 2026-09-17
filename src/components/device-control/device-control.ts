import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { MockDevice } from "../../models/device";
import { deviceStore } from "../../stores/device.store";

@customElement("device-control")
export class DeviceControl extends LitElement {
  @property({ type: Object }) device!: MockDevice;

  // Render in light DOM for clean semantic HTML without shadow encapsulation if needed, or normal Lit render
  protected createRenderRoot() {
    return this;
  }

  private handleToggle() {
    if (!this.device) return;
    deviceStore.toggle(this.device.id);
  }

  private handleBrightness(e: Event) {
    const input = e.target as HTMLInputElement;
    const val = Number(input.value);
    deviceStore.setBrightness(this.device.id, val);
  }

  render() {
    if (!this.device) return html``;

    const isOn = this.device.powerState === "on";
    const brightness = this.device.brightnessPct ?? (isOn ? 100 : 0);
    const actualW = this.device.actualPowerW ?? 0;
    const nominalW = this.device.nominalPowerW ?? 0;

    return html`
      <article data-device-id="${this.device.id}">
        <header>
          <h4>${this.device.name}</h4>
          <p>Tipo: ${this.device.kind} | Espacio: ${this.device.spaceId}</p>
        </header>

        <div>
          <p>
            <strong>Estado:</strong> <span>${isOn ? "ON" : "OFF"}</span>
            (${actualW} W / ${nominalW} W nom.)
          </p>

          <button
            type="button"
            @click=${this.handleToggle}
            data-action="toggle"
          >
            ${isOn ? "Apagar" : "Encender"}
          </button>

          ${
            this.device.kind === "light"
              ? html`
                <label>
                  Intensidad (${brightness}%):
                  <input
                    type="range"
                    min="0"
                    max="100"
                    .value=${String(brightness)}
                    @input=${this.handleBrightness}
                  />
                </label>
              `
              : ""
          }
        </div>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "device-control": DeviceControl;
  }
}
