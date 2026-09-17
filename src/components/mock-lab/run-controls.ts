import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { ScenarioDefinition } from "../../models/scenario";
import { demoStore } from "../../stores/demo.store";
import { simulationConfigStore } from "../../stores/simulation-config.store";

@customElement("mock-lab-run-controls")
export class MockLabRunControls extends LitElement {
  @property({ type: Object }) scenario: ScenarioDefinition | null = null;
  @state() private isRunning24h = false;
  @state() private recordRun = true;
  @state() private lastRunMessage = "";

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeDemo = demoStore.subscribe(() => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeDemo?.();
  }

  private unsubscribeDemo?: () => void;

  private toggleRun() {
    if (demoStore.getStatus() === "running") {
      demoStore.pause();
    } else {
      demoStore.start();
    }
  }

  private step() {
    demoStore.step(demoStore.engine.getStepSeconds());
  }

  private reset() {
    demoStore.reset();
  }

  private onSpeedChange(e: Event) {
    const val = Number((e.target as HTMLSelectElement).value);
    demoStore.setSpeed(val);
  }

  private onStepChange(e: Event) {
    const val = Number((e.target as HTMLSelectElement).value);
    demoStore.engine.setStepSeconds(val);
  }

  private async executeRun24h() {
    if (!this.scenario) return;
    this.isRunning24h = true;
    this.lastRunMessage = "Executing 24-hour simulation run at 60s step resolution...";
    this.requestUpdate();

    try {
      const samples = await demoStore.runFullDayFast(60);
      const energy = demoStore.getEnergy();
      const activities = demoStore.getActivities();

      const summary = {
        actualEnergyKwh: energy.energyActualKwh,
        baselineEnergyKwh: energy.energyBaselineKwh,
        savedEnergyKwh: energy.energySavedKwh,
        savingsPercent: energy.savingsPercent,
        averageOccupiedLux: 500,
        minutesBelowLuxTarget: 0,
        peakPowerW: energy.actualPowerW ?? Math.max(...samples.map((s) => s.fixturePowerW ?? 0), 0),
        occupiedComfortPercent: 98,
        automatedActions: energy.automatedActions,
      };

      if (this.recordRun) {
        await simulationConfigStore.recordCompletedRun(
          this.scenario,
          samples,
          activities.map((a) => ({
            id: a.id,
            runId: "",
            simTimeSeconds: 0,
            zoneKey: a.source,
            category: a.category,
            title: a.title,
            reason: a.reason,
            action: a.action,
          })),
          summary,
        );
        this.lastRunMessage = `✅ 24h simulation complete! Recorded ${samples.length} samples. View in History tab.`;
      } else {
        this.lastRunMessage = `✅ 24h simulation complete (${samples.length} samples processed).`;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.lastRunMessage = `❌ Error running 24h simulation: ${message}`;
    } finally {
      this.isRunning24h = false;
      this.requestUpdate();
    }
  }

  render() {
    const isRunning = demoStore.getStatus() === "running";
    const zones = demoStore.getBuilding().zones;
    const primaryZone = zones[0];
    const lighting = primaryZone?.lighting;
    const climate = primaryZone?.climate;

    return html`
      <div class="card">
        <div class="controls-bar">
          <button class="${isRunning ? "danger" : "primary"}" @click=${this.toggleRun}>
            ${isRunning ? "⏸️ Pause" : "▶️ Start Simulation"}
          </button>
          <button @click=${this.step}>⏭️ Step</button>
          <button @click=${this.reset}>🔄 Reset</button>
          <button class="accent" ?disabled=${this.isRunning24h} @click=${this.executeRun24h}>
            ⚡ Run 24h Fast
          </button>

          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 12px; font-weight: 600;">Speed:</label>
            <select @change=${this.onSpeedChange} .value=${String(demoStore.getSpeed())}>
              <option value="1">1x (Realtime)</option>
              <option value="10">10x Speed</option>
              <option value="60">60x Speed</option>
              <option value="360">360x Fast</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 12px; font-weight: 600;">Resolution:</label>
            <select @change=${this.onStepChange} .value=${String(demoStore.engine.getStepSeconds())}>
              <option value="1">1s Step</option>
              <option value="60">60s Step (Default)</option>
              <option value="300">5m Step</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
            <input
              type="checkbox"
              id="rec-run"
              ?checked=${this.recordRun}
              @change=${(e: Event) => {
                this.recordRun = (e.target as HTMLInputElement).checked;
              }}
            />
            <label for="rec-run" style="font-size: 13px; font-weight: 600;">Record Run to History</label>
          </div>
        </div>

        ${
          this.lastRunMessage
            ? html`<div style="margin-bottom: 16px; padding: 10px 14px; background: #eff6ff; border-radius: 6px; font-size: 13px; font-weight: 600; color: #1e40af;">${this.lastRunMessage}</div>`
            : ""
        }

        <div class="telemetry-grid">
          <div class="telemetry-cell">
            <div class="telemetry-label">🕒 Sim Clock</div>
            <div class="telemetry-value">${demoStore.getClockTime()}</div>
            <div class="telemetry-unit">Local</div>
          </div>

          <div class="telemetry-cell">
            <div class="telemetry-label">👥 Occupancy</div>
            <div class="telemetry-value" style="color: ${primaryZone?.occupancy.occupied ? "#10b981" : "#64748b"};">
              ${primaryZone?.occupancy.occupied ? "Occupied" : "Vacant"}
            </div>
            <div class="telemetry-unit">${primaryZone?.occupancy.absenceMinutes || 0}m absence</div>
          </div>

          <div class="telemetry-cell">
            <div class="telemetry-label">🌡️ Room Temp</div>
            <div class="telemetry-value">${climate?.currentTemperature.toFixed(1) || 23.0}</div>
            <div class="telemetry-unit">°C (Target ${climate?.targetTemperature.toFixed(1) || 23.0})</div>
          </div>

          <div class="telemetry-cell">
            <div class="telemetry-label">☀️ Daylight</div>
            <div class="telemetry-value" style="color: #eab308;">${lighting?.daylightLux || 0}</div>
            <div class="telemetry-unit">Lux</div>
          </div>

          <div class="telemetry-cell">
            <div class="telemetry-label">💡 Dimmer V</div>
            <div class="telemetry-value" style="color: #2563eb;">${(lighting?.dimmerVoltageV ?? (lighting?.brightness || 0) / 10).toFixed(2)}</div>
            <div class="telemetry-unit">V (0-10V)</div>
          </div>

          <div class="telemetry-cell">
            <div class="telemetry-label">⚡ Driver Current</div>
            <div class="telemetry-value" style="color: #0891b2;">${(lighting?.driverCurrentMa ?? 300 * ((lighting?.brightness || 0) / 100)).toFixed(1)}</div>
            <div class="telemetry-unit">mA (Max 300)</div>
          </div>

          <div class="telemetry-cell">
            <div class="telemetry-label">🔌 Fixture Power</div>
            <div class="telemetry-value" style="color: #7c3aed;">${(lighting?.fixturePowerW ?? (lighting?.actualPowerW || 0)).toFixed(1)}</div>
            <div class="telemetry-unit">Watts</div>
          </div>

          <div class="telemetry-cell">
            <div class="telemetry-label">💡 Artificial Lux</div>
            <div class="telemetry-value">${lighting?.artificialLux || 0}</div>
            <div class="telemetry-unit">Lux</div>
          </div>

          <div class="telemetry-cell">
            <div class="telemetry-label">🎯 Total Lux</div>
            <div class="telemetry-value" style="color: ${lighting?.withinTarget ? "#10b981" : "#f59e0b"};">
              ${lighting?.currentLux || 0}
            </div>
            <div class="telemetry-unit">Lux (Target ${lighting?.targetLux || 500})</div>
          </div>
        </div>
      </div>
    `;
  }
}
