import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ScenarioDefinition } from "../../models/scenario";
import { demoStore } from "../../stores/demo.store";
import { simulationConfigStore } from "../../stores/simulation-config.store";

@customElement("mock-lab-live-override")
export class MockLabLiveOverride extends LitElement {
  @property({ type: Object }) scenario: ScenarioDefinition | null = null;
  @state() private selectedZoneId = "";
  @state() private manualOccupied = true;
  @state() private manualDaylight = 250;
  @state() private manualTemperature = 23.0;
  @state() private manualBrightness = 80;
  @state() private manualMode: "auto" | "manual" = "auto";
  @state() private applyFeedback = "";

  static styles = css`
    :host {
      display: block;
    }
    .card {
      background: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: var(--spacing-5, 20px);
      box-shadow: var(--shadow-sm);
    }
    .header {
      margin-bottom: 16px;
    }
    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
      margin: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
    .control-box {
      background: var(--color-bg-subtle, #f8fafc);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    label {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-text-secondary, #64748b);
      text-transform: uppercase;
    }
    input[type="range"] {
      width: 100%;
    }
    select, button {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      border: 1px solid var(--color-border, #cbd5e1);
      cursor: pointer;
    }
    button.primary {
      background: var(--color-primary, #2563eb);
      color: #ffffff;
      border-color: var(--color-primary, #2563eb);
      font-weight: 600;
    }
    button.accent {
      background: #10b981;
      color: #ffffff;
      border-color: #10b981;
      font-weight: 600;
    }
    .val-display {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.ensureZone();
  }

  private ensureZone() {
    if (!this.selectedZoneId && this.scenario?.zones?.length) {
      this.selectedZoneId = this.scenario.zones[0].id;
    }
  }

  private applyLiveOverride() {
    if (!this.selectedZoneId) return;
    demoStore.updateZoneInput(this.selectedZoneId, {
      occupied: this.manualOccupied,
      daylightLux: this.manualDaylight,
      currentTemperature: this.manualTemperature,
      mode: this.manualMode,
      brightnessOverride: this.manualMode === "manual" ? this.manualBrightness : undefined,
    });
    this.applyFeedback = "⚡ Live override injected into runtime state.";
    setTimeout(() => {
      this.applyFeedback = "";
    }, 3000);
  }

  private async applyToScenario() {
    if (!this.scenario || !this.selectedZoneId) return;
    const nowSec =
      (demoStore.engine.clock.now().getUTCHours() * 3600 +
        demoStore.engine.clock.now().getUTCMinutes() * 60) %
      86400;

    const updatedProfiles = [...(this.scenario.profiles || [])];

    const daylightProf = updatedProfiles.find(
      (p) => p.zoneId === this.selectedZoneId && p.variable === "daylight_lux",
    );
    if (daylightProf) {
      daylightProf.points = daylightProf.points.filter((p) => p.timeOffsetSeconds !== nowSec);
      daylightProf.points.push({ timeOffsetSeconds: nowSec, value: this.manualDaylight });
      daylightProf.points.sort((a, b) => a.timeOffsetSeconds - b.timeOffsetSeconds);
    }

    const updated: ScenarioDefinition = {
      ...this.scenario,
      profiles: updatedProfiles,
    };

    await simulationConfigStore.saveScenario(updated);
    this.scenario = updated;
    this.applyFeedback = "💾 Stored current live conditions permanently into scenario profile.";
    setTimeout(() => {
      this.applyFeedback = "";
    }, 4000);
  }

  render() {
    return html`
      <div class="card">
        <div class="header">
          <h3 class="title">🎛️ Live Simulation Override Mode</h3>
          <span style="font-size: 12px; color: var(--color-text-secondary, #64748b);">
            Direct manual control of environmental and actuator parameters. Overrides do not rewrite stored profiles unless explicitly saved.
          </span>
        </div>

        <div style="margin-bottom: 12px;">
          <label>Target Zone:</label>
          <select
            .value=${this.selectedZoneId}
            @change=${(e: Event) => {
              this.selectedZoneId = (e.target as HTMLSelectElement).value;
            }}
          >
            ${this.scenario?.zones?.map((z) => html`<option value="${z.id}">${z.name}</option>`)}
          </select>
        </div>

        <div class="grid">
          <div class="control-box">
            <label>Occupancy Presence</label>
            <div style="display: flex; gap: 8px;">
              <button
                class="${this.manualOccupied ? "primary" : ""}"
                @click=${() => {
                  this.manualOccupied = true;
                  this.applyLiveOverride();
                }}
              >
                Occupied (1)
              </button>
              <button
                class="${!this.manualOccupied ? "primary" : ""}"
                @click=${() => {
                  this.manualOccupied = false;
                  this.applyLiveOverride();
                }}
              >
                Empty (0)
              </button>
            </div>
          </div>

          <div class="control-box">
            <div style="display: flex; justify-content: space-between;">
              <label>Solar Daylight</label>
              <span class="val-display">${this.manualDaylight} lx</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              .value=${String(this.manualDaylight)}
              @input=${(e: Event) => {
                this.manualDaylight = Number((e.target as HTMLInputElement).value);
                this.applyLiveOverride();
              }}
            />
          </div>

          <div class="control-box">
            <div style="display: flex; justify-content: space-between;">
              <label>Room Temperature</label>
              <span class="val-display">${this.manualTemperature.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="16"
              max="32"
              step="0.2"
              .value=${String(this.manualTemperature)}
              @input=${(e: Event) => {
                this.manualTemperature = Number((e.target as HTMLInputElement).value);
                this.applyLiveOverride();
              }}
            />
          </div>

          <div class="control-box">
            <div style="display: flex; justify-content: space-between;">
              <label>Control Mode</label>
              <span class="val-display">${this.manualMode.toUpperCase()}</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button
                class="${this.manualMode === "auto" ? "primary" : ""}"
                @click=${() => {
                  this.manualMode = "auto";
                  this.applyLiveOverride();
                }}
              >
                Auto
              </button>
              <button
                class="${this.manualMode === "manual" ? "primary" : ""}"
                @click=${() => {
                  this.manualMode = "manual";
                  this.applyLiveOverride();
                }}
              >
                Manual Dimmer
              </button>
            </div>
            ${
              this.manualMode === "manual"
                ? html`
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    .value=${String(this.manualBrightness)}
                    @input=${(e: Event) => {
                      this.manualBrightness = Number((e.target as HTMLInputElement).value);
                      this.applyLiveOverride();
                    }}
                  />
                  <span style="font-size: 12px; font-weight: 700;">${this.manualBrightness}%</span>
                `
                : ""
            }
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; flex-wrap: wrap; gap: 10px;">
          ${this.applyFeedback ? html`<span style="font-size: 13px; font-weight: 600; color: #16a34a;">${this.applyFeedback}</span>` : html`<span></span>`}
          <div style="display: flex; gap: 10px;">
            <button class="accent" @click=${this.applyToScenario}>📌 Apply to Scenario Profile</button>
            <button @click=${() => demoStore.reset()}>🔄 Reset to Profiles</button>
          </div>
        </div>
      </div>
    `;
  }
}
