import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ClimateStore, demoStore } from "../../../stores";

@customElement("systems-climate-view")
export class SystemsClimateView extends LitElement {
  @state() private climateZones = ClimateStore.getClimateZones();
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.climateZones = ClimateStore.getClimateZones();
    this.unsubscribe = demoStore.subscribe(() => {
      this.climateZones = ClimateStore.getClimateZones();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    return html`
      <section>
        <header>
          <h1>Sistema de Climatización Global</h1>
          <p>Supervisión consolidada de confort térmico y consignas de climatización.</p>
        </header>

        <div>
          ${this.climateZones.map(
            (zone) => html`
              <article>
                <h3>${zone.name}</h3>
                <p>
                  <strong>Actual:</strong> ${zone.climate?.currentTemperature}°C
                  | <strong>Consigna:</strong> ${zone.climate?.targetTemperature}°C
                  | <strong>Modo:</strong> ${zone.climate?.mode}
                </p>
                <div>
                  <button type="button" @click=${() => demoStore.updateZoneInput(zone.id, { targetTemperature: (zone.climate?.targetTemperature ?? 23) - 0.5 })}>-0.5°C</button>
                  <button type="button" @click=${() => demoStore.updateZoneInput(zone.id, { targetTemperature: (zone.climate?.targetTemperature ?? 23) + 0.5 })}>+0.5°C</button>
                </div>
              </article>
            `,
          )}
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "systems-climate-view": SystemsClimateView;
  }
}
