import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Space } from "../../../models/space";
import { calculateSpacePower } from "../../../services/energy.service";
import { activityStore } from "../../../stores/activity.store";
import { climateStore } from "../../../stores/climate.store";
import { deviceStore } from "../../../stores/device.store";
import { sceneStore } from "../../../stores/scene.store";

@customElement("space-overview")
export class SpaceOverview extends LitElement {
  @property({ type: Object }) space!: Space;

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.space) return html``;

    const devices = deviceStore.getBySpace(this.space.id);
    const activeDevices = devices.filter((d) => d.powerState === "on");
    const powerSummary = calculateSpacePower(devices);
    const scenes = sceneStore.getBySpace(this.space.id);
    const climateZones = climateStore
      .getZones()
      .filter((z: { id: string }) => this.space.zoneIds.includes(z.id));
    const recentActivities = activityStore
      .getAll()
      .filter(
        (a: { spaceId?: string; deviceId?: string }) =>
          a.spaceId === this.space.id || (a.deviceId && devices.some((d) => d.id === a.deviceId)),
      )
      .slice(0, 5);

    return html`
      <section>
        <header>
          <h3>Resumen de ${this.space.name}</h3>
          <p>${this.space.description || ""}</p>
        </header>

        <div>
          <h4>Métricas Principales</h4>
          <ul>
            <li><strong>Dispositivos totales:</strong> ${devices.length}</li>
            <li><strong>Dispositivos encendidos:</strong> ${activeDevices.length}</li>
            <li><strong>Potencia actual:</strong> ${powerSummary.currentPowerW} W (de ${powerSummary.nominalPowerW} W nom.)</li>
            <li><strong>Ahorro activo:</strong> ${powerSummary.savedPowerW} W (${powerSummary.savingsPercent}%)</li>
            ${
              climateZones.length > 0
                ? html`
                  <li>
                    <strong>Clima:</strong>
                    ${climateZones
                      .map(
                        (z: {
                          name: string;
                          climate?: { currentTemperature: number; targetTemperature: number };
                        }) =>
                          `${z.name}: ${z.climate?.currentTemperature}°C (Objetivo: ${z.climate?.targetTemperature}°C)`,
                      )
                      .join(" | ")}
                  </li>
                `
                : ""
            }
            <li><strong>Escenas disponibles:</strong> ${scenes.length}</li>
          </ul>
        </div>

        <div>
          <h4>Acciones Rápidas</h4>
          <button type="button" @click=${() => deviceStore.turnSpaceOn(this.space.id)}>
            Encender todo el espacio
          </button>
          <button type="button" @click=${() => deviceStore.turnSpaceOff(this.space.id)}>
            Apagar todo el espacio
          </button>
        </div>

        ${
          recentActivities.length > 0
            ? html`
              <div>
                <h4>Actividad Reciente en el Espacio</h4>
                <ul>
                  ${recentActivities.map(
                    (act: { timestamp: string; title: string; reason: string }) => html`
                      <li>
                        [${act.timestamp}] <strong>${act.title}</strong> — ${act.reason}
                      </li>
                    `,
                  )}
                </ul>
              </div>
            `
            : ""
        }

      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "space-overview": SpaceOverview;
  }
}
