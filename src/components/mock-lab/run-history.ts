import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

import type { SimulationRun } from "../../models/scenario";
import { simulationConfigStore } from "../../stores/simulation-config.store";

@customElement("mock-lab-run-history")
export class MockLabRunHistory extends LitElement {
  @state() private runs: SimulationRun[] = [];
  @state() private comparisonRunIds: string[] = [];

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.refresh();
  }

  private refresh() {
    this.runs = simulationConfigStore.getRuns();
    this.comparisonRunIds = simulationConfigStore.getComparisonRunIds();
  }

  private toggleCompare(runId: string) {
    simulationConfigStore.toggleRunComparison(runId);
    this.comparisonRunIds = simulationConfigStore.getComparisonRunIds();
    this.requestUpdate();
  }

  private async deleteRun(runId: string) {
    await simulationConfigStore.deleteRun(runId);
    this.refresh();
  }

  render() {
    const comparisonRuns = simulationConfigStore.getComparisonRuns();

    return html`
      <div class="card">
        <div class="header">
          <div>
            <h3 class="title">📚 Experiment History & Multi-Run Comparative Analysis</h3>
            <span style="font-size: 12px; color: var(--color-text-secondary, #64748b);">
              Persistent simulation recordings, baseline energy comparisons, and quantitative comfort metrics.
            </span>
          </div>
        </div>

        ${
          this.runs.length > 0
            ? html`
              <table>
                <thead>
                  <tr>
                    <th>Compare</th>
                    <th>Scenario ID</th>
                    <th>Date / Time</th>
                    <th>Step</th>
                    <th>Energy Actual</th>
                    <th>Energy Saved</th>
                    <th>Savings %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.runs.map((r) => {
                    const isChecked = this.comparisonRunIds.includes(r.id);
                    const summary = r.summary;
                    return html`
                      <tr>
                        <td>
                          <input
                            type="checkbox"
                            ?checked=${isChecked}
                            @change=${() => this.toggleCompare(r.id)}
                          />
                        </td>
                        <td><strong>${r.scenarioId}</strong></td>
                        <td style="font-size: 12px; color: #64748b;">${new Date(r.startedAt).toLocaleString()}</td>
                        <td>${r.stepSeconds}s</td>
                        <td><strong>${summary ? `${summary.actualEnergyKwh.toFixed(2)} kWh` : "—"}</strong></td>
                        <td style="color: #16a34a; font-weight: 700;">
                          ${summary ? `${summary.savedEnergyKwh.toFixed(2)} kWh` : "—"}
                        </td>
                        <td>
                          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: #dcfce7; color: #15803d; font-weight: 700; font-size: 11px;">
                            ${summary ? `${summary.savingsPercent.toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td>
                          <button class="danger" @click=${() => this.deleteRun(r.id)}>Delete</button>
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            `
            : html`<div style="text-align: center; padding: 24px; color: #94a3b8;">No simulation runs recorded yet. Check 'Record Run' and execute a simulation.</div>`
        }

        <!-- Comparison Workbench -->
        ${
          comparisonRuns.length >= 2
            ? html`
              <div class="comparison-section">
                <h4 style="margin: 0 0 10px 0; font-size: 14px;">
                  ⚖️ Side-by-Side Experiment Comparison (${comparisonRuns.length} runs selected)
                </h4>
                <div class="comparison-grid">
                  ${comparisonRuns.map((r) => {
                    const s = r.summary;
                    return html`
                      <div class="comp-card">
                        <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #2563eb;">
                          ${r.scenarioId}
                        </h5>
                        <div style="font-size: 11px; color: #64748b; margin-bottom: 10px;">
                          Run ID: ${r.id.slice(0, 14)}...
                        </div>
                        <div class="metric-row">
                          <span class="metric-label">Actual Energy:</span>
                          <span class="metric-val">${s ? `${s.actualEnergyKwh.toFixed(3)} kWh` : "—"}</span>
                        </div>
                        <div class="metric-row">
                          <span class="metric-label">Baseline Energy:</span>
                          <span class="metric-val">${s ? `${s.baselineEnergyKwh.toFixed(3)} kWh` : "—"}</span>
                        </div>
                        <div class="metric-row">
                          <span class="metric-label">Energy Saved:</span>
                          <span class="metric-val" style="color: #16a34a;">${s ? `${s.savedEnergyKwh.toFixed(3)} kWh` : "—"}</span>
                        </div>
                        <div class="metric-row">
                          <span class="metric-label">Savings Percent:</span>
                          <span class="metric-val" style="color: #16a34a;">${s ? `${s.savingsPercent.toFixed(1)}%` : "—"}</span>
                        </div>
                        <div class="metric-row">
                          <span class="metric-label">Peak Power:</span>
                          <span class="metric-val">${s ? `${s.peakPowerW} W` : "—"}</span>
                        </div>
                        <div class="metric-row">
                          <span class="metric-label">Comfort Compliance:</span>
                          <span class="metric-val">${s ? `${s.occupiedComfortPercent}%` : "—"}</span>
                        </div>
                        <div class="metric-row">
                          <span class="metric-label">Automated Actions:</span>
                          <span class="metric-val">${s ? s.automatedActions : "—"}</span>
                        </div>
                      </div>
                    `;
                  })}
                </div>
              </div>
            `
            : ""
        }
      </div>
    `;
  }
}
