import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Zone } from "../../models";

@customElement("lighting-zone")
export class LightingZone extends LitElement {
  @property({ type: Object }) zone!: Zone;

  protected createRenderRoot() {
    return this;
  }

  private onBrightnessChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const brightness = Number(input.value);
    this.dispatchEvent(
      new CustomEvent("brightness-change", {
        detail: { zoneId: this.zone.id, brightness },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private toggleMode() {
    if (!this.zone.lighting) return;
    const newMode = this.zone.lighting.mode === "auto" ? "manual" : "auto";
    this.dispatchEvent(
      new CustomEvent("mode-change", {
        detail: { zoneId: this.zone.id, mode: newMode },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (!this.zone || !this.zone.lighting) return html``;

    const { name, type, occupancy, lighting } = this.zone;
    const savedWatts = Math.max(0, lighting.baselinePowerW - lighting.actualPowerW);

    return html`
      <article>
        <header>
          <div>
            <h3>${name}</h3>
            <span>${type} &bull; ${occupancy.occupied ? "Ocupado" : `Desocupado (${occupancy.absenceMinutes}m)`}</span>
          </div>
          <div>
            <button type="button" @click=${this.toggleMode}>
              Modo: ${lighting.mode.toUpperCase()}
            </button>
            ${
              lighting.mode === "manual" && lighting.manualOverrideUntil
                ? html`<span>[Manual hasta ${lighting.manualOverrideUntil}]</span>`
                : ""
            }
            <span>${lighting.withinTarget ? "[Cumple Objetivo]" : "[Ajustando]"}</span>
          </div>
        </header>

        <ul>
          <li><strong>Luz Natural:</strong> ${lighting.daylightLux} lx</li>
          <li><strong>Luz Objetivo:</strong> ${lighting.targetLux} lx (Total: ${lighting.currentLux} lx)</li>
          <li><strong>Potencia:</strong> ${lighting.actualPowerW} W (Nominal: ${lighting.nominalPowerW} W)</li>
        </ul>

        <div>
          <label for="dimmer-${this.zone.id}">Nivel Atenuación (${lighting.brightness}%):</label>
          <input
            id="dimmer-${this.zone.id}"
            type="range"
            min="0"
            max="100"
            .value=${lighting.brightness}
            @input=${this.onBrightnessChange}
            aria-label="Nivel Atenuación para ${name}"
          />
        </div>

        <footer>
          <small>Base: ${lighting.baselinePowerW}W &rarr; Actual: ${lighting.actualPowerW}W | ⚡ -${savedWatts}W Ahorrados</small>
        </footer>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lighting-zone": LightingZone;
  }
}
