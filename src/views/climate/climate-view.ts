import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ClimateStore, demoStore } from "../../stores";

@customElement("climate-view")
export class ClimateView extends LitElement {
  @state() private climateZones = ClimateStore.getClimateZones();
  @state() private recommendation = ClimateStore.getRecommendation();
  @state() private isError = demoStore.isSimulatedError();
  private unsubscribeStore: (() => void) | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.climateZones = ClimateStore.getClimateZones();
    this.recommendation = ClimateStore.getRecommendation();
    this.unsubscribeStore = demoStore.subscribe(() => {
      this.climateZones = ClimateStore.getClimateZones();
      this.recommendation = ClimateStore.getRecommendation();
      this.isError = demoStore.isSimulatedError();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeStore?.();
  }

  private handleAcceptRecommendation() {
    ClimateStore.acceptRecommendation();
  }

  private handleDismissRecommendation() {
    ClimateStore.dismissRecommendation();
  }

  private handleSetTemp(zoneId: string, delta: number) {
    const zone = this.climateZones.find((z) => z.id === zoneId);
    if (!zone || !zone.climate) return;
    const newTemp = Math.round((zone.climate.targetTemperature + delta) * 10) / 10;
    demoStore.updateZoneInput(zoneId, { targetTemperature: newTemp });
  }

  render() {
    if (this.isError) {
      return html`
        <section>
          <h2>Error de Simulación</h2>
          <p>⚠️ No se pudo cargar la telemetría climática.</p>
          <button type="button" @click=${() => demoStore.setSimulatedError(false)}>Reintentar</button>
        </section>
      `;
    }

    const avgTemp =
      this.climateZones.length > 0
        ? (
            this.climateZones.reduce((acc, z) => acc + (z.climate?.currentTemperature ?? 23), 0) /
            this.climateZones.length
          ).toFixed(1)
        : "23.0";

    return html`
      <section>
        <header>
          <h1>Sistema de Climatización</h1>
          <p>Supervisión de temperatura ambiente, zonas HVAC y confort térmico.</p>
        </header>

        <div>
          <h2>Métricas Térmicas Globales</h2>
          <table>
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
                <th>Rango Confort</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Temperatura Promedio</td>
                <td><strong>${avgTemp}°C</strong></td>
                <td>22.0°C — 24.0°C</td>
              </tr>
              <tr>
                <td>Zonas Condicionadas</td>
                <td>${this.climateZones.length} zonas</td>
                <td>Monitoreo activo</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${
          this.recommendation
            ? html`
                <article>
                  <h3>💡 ${this.recommendation.title}</h3>
                  <p>${this.recommendation.description}</p>
                  <button type="button" @click=${this.handleAcceptRecommendation}>
                    ${this.recommendation.actionLabel}
                  </button>
                  <button type="button" @click=${this.handleDismissRecommendation}>
                    ${this.recommendation.skipLabel}
                  </button>
                </article>
              `
            : ""
        }

        <div>
          <h2>Zonas Térmicas</h2>
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
                  <button type="button" @click=${() => this.handleSetTemp(zone.id, -0.5)}>-0.5°C</button>
                  <button type="button" @click=${() => this.handleSetTemp(zone.id, 0.5)}>+0.5°C</button>
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
    "climate-view": ClimateView;
  }
}
