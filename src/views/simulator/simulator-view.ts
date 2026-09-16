import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components";
import { allScenarios } from "../../mocks/scenarios";
import type { Zone } from "../../models";
import { demoStore } from "../../stores";

@customElement("simulator-view")
export class SimulatorView extends LitElement {
  @state() private currentScenario = demoStore.getCurrentScenario();
  @state() private status = demoStore.getStatus();
  @state() private speed = demoStore.getSpeed();
  @state() private clockTime = demoStore.getClockTime();
  @state() private building = demoStore.getBuilding();
  @state() private selectedZoneId = "zone-open-office";

  private unsubscribeStore: (() => void) | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6, 24px);
      width: 100%;
    }
    .demo-banner {
      background-color: var(--color-warning-subtle, #fffbeb);
      border: 1px solid var(--color-warning, #d97706);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-2, 8px);
    }
    .demo-badge {
      background-color: var(--color-warning, #d97706);
      color: #ffffff;
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-bold, 700);
      letter-spacing: 0.05em;
    }
    .demo-text {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary, #475569);
    }
    .grid-sections {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-6, 24px);
    }
    @media (min-width: 1024px) {
      .grid-sections {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .card {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-5, 20px);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4, 16px);
    }
    .card-title {
      font-size: var(--font-size-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .scenario-buttons {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 8px);
    }
    .scenario-btn {
      min-height: var(--touch-target-min, 44px);
      padding: var(--spacing-3, 12px);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 6px);
      background-color: var(--color-bg-surface, #ffffff);
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: all var(--transition-fast, 150ms);
    }
    .scenario-btn:hover {
      background-color: var(--color-bg-surface-hover, #e2e8f0);
    }
    .scenario-btn.active {
      border-color: var(--color-primary, #2563eb);
      background-color: var(--color-primary-subtle, #eff6ff);
    }
    .scenario-name {
      font-size: var(--font-size-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
    }
    .scenario-desc {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary, #475569);
    }
    .controls-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
      flex-wrap: wrap;
    }
    .btn {
      min-height: var(--touch-target-min, 44px);
      padding: 0 var(--spacing-4, 16px);
      border-radius: var(--radius-md, 6px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-semibold, 600);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color var(--transition-fast, 150ms);
    }
    .btn-primary {
      background-color: var(--color-primary, #2563eb);
      color: #ffffff;
      border: 1px solid var(--color-primary, #2563eb);
    }
    .btn-primary:hover {
      background-color: var(--color-primary-hover, #1d4ed8);
    }
    .btn-secondary {
      background-color: transparent;
      color: var(--color-text-secondary, #475569);
      border: 1px solid var(--color-border, #e2e8f0);
    }
    .btn-secondary:hover {
      background-color: var(--color-bg-surface-hover, #e2e8f0);
    }
    .speed-group {
      display: flex;
      align-items: center;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 6px);
      overflow: hidden;
    }
    .speed-btn {
      min-height: var(--touch-target-min, 44px);
      padding: 0 var(--spacing-3, 12px);
      background-color: var(--color-bg-surface, #ffffff);
      border: none;
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
    }
    .speed-btn.active {
      background-color: var(--color-primary, #2563eb);
      color: #ffffff;
      font-weight: var(--font-weight-bold, 700);
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 8px);
    }
    .form-label {
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #475569);
      display: flex;
      justify-content: space-between;
    }
    .select-input {
      min-height: var(--touch-target-min, 44px);
      padding: 0 var(--spacing-3, 12px);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 6px);
      background-color: var(--color-bg-surface, #ffffff);
      font-size: var(--font-size-sm, 14px);
    }
    .slider {
      width: 100%;
      height: 8px;
      border-radius: var(--radius-full, 9999px);
      accent-color: var(--color-primary, #2563eb);
      cursor: pointer;
    }
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: var(--touch-target-min, 44px);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeStore = demoStore.subscribe(() => {
      this.currentScenario = demoStore.getCurrentScenario();
      this.status = demoStore.getStatus();
      this.speed = demoStore.getSpeed();
      this.clockTime = demoStore.getClockTime();
      this.building = demoStore.getBuilding();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
  }

  private handleScenarioSelect(id: string) {
    demoStore.selectScenario(id);
  }

  private handlePlay() {
    demoStore.start();
  }

  private handlePause() {
    demoStore.pause();
  }

  private handleReset() {
    demoStore.reset();
  }

  private handleStep() {
    demoStore.step();
  }

  private handleSpeed(s: number) {
    demoStore.setSpeed(s);
  }

  private getSelectedZone(): Zone | undefined {
    return this.building.zones.find((z) => z.id === this.selectedZoneId) ?? this.building.zones[0];
  }

  private handleZoneSelect(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.selectedZoneId = select.value;
  }

  private handleDaylightSlider(e: Event) {
    const slider = e.target as HTMLInputElement;
    const daylightLux = Number(slider.value);
    demoStore.updateZoneInput(this.selectedZoneId, { daylightLux });
  }

  private handleTempSlider(e: Event) {
    const slider = e.target as HTMLInputElement;
    const currentTemperature = Number(slider.value);
    demoStore.updateZoneInput(this.selectedZoneId, { currentTemperature });
  }

  private handleOccupancyToggle() {
    const zone = this.getSelectedZone();
    if (!zone) return;
    const newOccupied = !zone.occupancy.occupied;
    demoStore.updateZoneInput(this.selectedZoneId, {
      occupied: newOccupied,
      absenceMinutes: newOccupied ? 0 : 5,
    });
  }

  render() {
    const selectedZone = this.getSelectedZone();
    const scenarioKeys = Object.keys(allScenarios);

    return html`
      <!-- Simulation Status Banner -->
      <div class="demo-banner">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="demo-badge">DEMO SIMULATOR</span>
          <span class="demo-text">Controllable Virtual Clock: <strong>${this.clockTime}</strong></span>
        </div>
        <span class="demo-text">Status: <strong>${this.status.toUpperCase()}</strong> (${this.speed}x Speed)</span>
      </div>

      <div class="grid-sections">
        <!-- Scenarios & Playback -->
        <div class="card">
          <div class="card-title">
            <span>Deterministic Demo Scenarios</span>
            <div class="controls-row">
              ${
                this.status === "running"
                  ? html`<button class="btn btn-primary" @click=${this.handlePause}>⏸ Pause</button>`
                  : html`<button class="btn btn-primary" @click=${this.handlePlay}>▶ Start</button>`
              }
              <button class="btn btn-secondary" @click=${this.handleStep}>⏭ Step</button>
              <button class="btn btn-secondary" @click=${this.handleReset}>↺ Reset</button>
            </div>
          </div>

          <div class="scenario-buttons">
            ${scenarioKeys.map((key) => {
              const sc = allScenarios[key];
              const isActive = this.currentScenario.id === sc.id;
              return html`
                <button
                  class="scenario-btn ${isActive ? "active" : ""}"
                  @click=${() => this.handleScenarioSelect(sc.id)}
                >
                  <span class="scenario-name">${sc.name}</span>
                  <span class="scenario-desc">${sc.description}</span>
                </button>
              `;
            })}
          </div>

          <div class="controls-row" style="margin-top: auto;">
            <span style="font-size: 12px; font-weight: 500; color: var(--color-text-secondary);">Sim Speed:</span>
            <div class="speed-group">
              <button class="speed-btn ${this.speed === 1 ? "active" : ""}" @click=${() => this.handleSpeed(1)}>1x</button>
              <button class="speed-btn ${this.speed === 5 ? "active" : ""}" @click=${() => this.handleSpeed(5)}>5x</button>
              <button class="speed-btn ${this.speed === 10 ? "active" : ""}" @click=${() => this.handleSpeed(10)}>10x</button>
            </div>
          </div>
        </div>

        <!-- Manual Parameter Override -->
        <div class="card">
          <div class="card-title">
            <span>Manual Sensor Overrides</span>
            <span style="font-size: 12px; color: var(--color-text-muted);">Real-time Telemetry Injection</span>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span>Target Zone</span>
            </label>
            <select class="select-input" @change=${this.handleZoneSelect} .value=${this.selectedZoneId}>
              ${this.building.zones.map(
                (z) =>
                  html`<option value="${z.id}" ?selected=${z.id === this.selectedZoneId}>${z.name} (${z.type})</option>`,
              )}
            </select>
          </div>

          ${
            selectedZone
              ? html`
                <!-- Occupancy Toggle -->
                <div class="toggle-row">
                  <span style="font-size: 14px; font-weight: 500;">Occupancy Sensor</span>
                  <button
                    class="btn ${selectedZone.occupancy.occupied ? "btn-primary" : "btn-secondary"}"
                    @click=${this.handleOccupancyToggle}
                  >
                    ${selectedZone.occupancy.occupied ? "🟢 Occupied" : "⚪ Vacant"}
                  </button>
                </div>

                <!-- Daylight Lux Slider -->
                ${
                  selectedZone.lighting
                    ? html`
                      <div class="form-group">
                        <div class="form-label">
                          <span>Natural Daylight Sensor</span>
                          <span><strong>${selectedZone.lighting.daylightLux} Lux</strong></span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          .value=${selectedZone.lighting.daylightLux}
                          class="slider"
                          @input=${this.handleDaylightSlider}
                          aria-label="Daylight Lux"
                        />
                      </div>
                    `
                    : ""
                }

                <!-- Temperature Slider -->
                ${
                  selectedZone.climate
                    ? html`
                      <div class="form-group">
                        <div class="form-label">
                          <span>Temperature Sensor</span>
                          <span><strong>${selectedZone.climate.currentTemperature}°C</strong></span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="35"
                          step="0.1"
                          .value=${selectedZone.climate.currentTemperature}
                          class="slider"
                          @input=${this.handleTempSlider}
                          aria-label="Temperature Celsius"
                        />
                      </div>
                    `
                    : ""
                }
              `
              : ""
          }
        </div>
      </div>
    `;
  }
}
