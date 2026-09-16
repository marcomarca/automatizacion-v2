import * as echarts from "echarts";
import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ScenarioDefinition, ScenarioProfileDefinition } from "../../models/scenario";
import { simulationConfigStore } from "../../stores/simulation-config.store";

@customElement("mock-lab-profile-editor")
export class MockLabProfileEditor extends LitElement {
  @property({ type: Object }) scenario: ScenarioDefinition | null = null;
  @state() private selectedZoneId = "";
  @state() private activeVariable: "occupancy" | "temperature_c" | "daylight_lux" = "daylight_lux";
  @state() private newPointTime = "12:00";
  @state() private newPointValue = 500;

  private chartInstance: echarts.ECharts | null = null;

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
    .tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      padding-bottom: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .tab-btn {
      padding: 8px 16px;
      border: none;
      background: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      color: var(--color-text-secondary, #64748b);
      border-radius: 6px;
      transition: all 150ms ease;
    }
    .tab-btn:hover {
      background: var(--color-bg-subtle, #f8fafc);
      color: var(--color-text-primary, #0f172a);
    }
    .tab-btn.active {
      background: var(--color-primary-subtle, #eff6ff);
      color: var(--color-primary, #2563eb);
    }
    .chart-container {
      width: 100%;
      height: 280px;
      margin-bottom: 20px;
    }
    .table-container {
      overflow-x: auto;
      margin-top: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }
    th {
      background: var(--color-bg-subtle, #f8fafc);
      font-weight: 600;
      color: var(--color-text-secondary, #64748b);
    }
    input, select {
      padding: 6px 10px;
      border: 1px solid var(--color-border, #cbd5e1);
      border-radius: 4px;
      font-family: inherit;
      font-size: 13px;
    }
    button {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--color-border, #cbd5e1);
      background: var(--color-bg-surface, #ffffff);
    }
    button.primary {
      background: var(--color-primary, #2563eb);
      color: #ffffff;
      border-color: var(--color-primary, #2563eb);
    }
    button.danger {
      color: #ef4444;
      border-color: #fca5a5;
    }
    .add-point-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 14px;
      padding: 12px;
      background: var(--color-bg-subtle, #f8fafc);
      border-radius: 8px;
      flex-wrap: wrap;
    }
  `;

  updated(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has("scenario") ||
      changedProperties.has("selectedZoneId") ||
      changedProperties.has("activeVariable")
    ) {
      this.ensureZone();
      this.renderChart();
    }
  }

  private ensureZone() {
    if (!this.selectedZoneId && this.scenario?.zones?.length) {
      this.selectedZoneId = this.scenario.zones[0].id;
    }
  }

  private getActiveProfile(): ScenarioProfileDefinition | undefined {
    if (!this.scenario?.profiles) return undefined;
    return this.scenario.profiles.find(
      (p) =>
        (p.zoneId === this.selectedZoneId || p.zoneId === this.scenario?.zones[0]?.id) &&
        p.variable === this.activeVariable,
    );
  }

  private renderChart() {
    const container = this.shadowRoot?.querySelector("#profile-chart") as HTMLDivElement;
    if (!container) return;

    if (!this.chartInstance) {
      this.chartInstance = echarts.init(container);
    }

    const profile = this.getActiveProfile();
    const points = profile?.points || [];
    const sorted = [...points].sort((a, b) => a.timeOffsetSeconds - b.timeOffsetSeconds);

    const curveData: [string, number][] = [];
    for (let sec = 0; sec <= 86400; sec += 900) {
      const hours = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

      let val = 0;
      if (sorted.length > 0) {
        if (profile?.interpolation === "step") {
          let prev = sorted[0].value;
          for (const pt of sorted) {
            if (pt.timeOffsetSeconds <= sec) prev = pt.value;
          }
          val = prev;
        } else {
          if (sec <= sorted[0].timeOffsetSeconds) {
            val = sorted[0].value;
          } else if (sec >= sorted[sorted.length - 1].timeOffsetSeconds) {
            val = sorted[sorted.length - 1].value;
          } else {
            for (let i = 0; i < sorted.length - 1; i++) {
              if (sorted[i].timeOffsetSeconds <= sec && sec <= sorted[i + 1].timeOffsetSeconds) {
                const ratio =
                  (sec - sorted[i].timeOffsetSeconds) /
                  (sorted[i + 1].timeOffsetSeconds - sorted[i].timeOffsetSeconds || 1);
                val = sorted[i].value + ratio * (sorted[i + 1].value - sorted[i].value);
                break;
              }
            }
          }
        }
      }
      curveData.push([timeStr, Number(val.toFixed(1))]);
    }

    const anchorData = sorted.map((pt) => {
      const h = Math.floor(pt.timeOffsetSeconds / 3600);
      const m = Math.floor((pt.timeOffsetSeconds % 3600) / 60);
      return [`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, pt.value];
    });

    const isDaylight = this.activeVariable === "daylight_lux";
    const isTemp = this.activeVariable === "temperature_c";
    const color = isDaylight ? "#eab308" : isTemp ? "#06b6d4" : "#3b82f6";
    const unit = isDaylight ? "lx" : isTemp ? "°C" : "count";

    const option: echarts.EChartsOption = {
      grid: { left: "45px", right: "20px", top: "25px", bottom: "30px" },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v) => `${v} ${unit}`,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        name: unit,
      },
      series: [
        {
          name: this.activeVariable,
          type: "line",
          step: profile?.interpolation === "step" ? "end" : false,
          smooth: false,
          data: curveData,
          itemStyle: { color },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${color}66` },
              { offset: 1, color: `${color}05` },
            ]),
          },
        },
        {
          name: "Anchors",
          type: "scatter",
          symbolSize: 8,
          data: anchorData,
          itemStyle: { color: "#dc2626" },
        },
      ],
    };

    this.chartInstance.setOption(option, true);
  }

  private timeToSeconds(timeStr: string): number {
    const parts = timeStr.split(":");
    const h = Number.parseInt(parts[0] || "0", 10);
    const m = Number.parseInt(parts[1] || "0", 10);
    return h * 3600 + m * 60;
  }

  private secondsToTime(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  private async addPoint() {
    if (!this.scenario) return;
    const sec = this.timeToSeconds(this.newPointTime);
    let profile = this.getActiveProfile();

    const updatedProfiles = [...(this.scenario.profiles || [])];
    if (!profile) {
      profile = {
        id: `prof_${this.selectedZoneId}_${this.activeVariable}`,
        zoneId: this.selectedZoneId,
        variable: this.activeVariable,
        unit:
          this.activeVariable === "daylight_lux"
            ? "lx"
            : this.activeVariable === "temperature_c"
              ? "°C"
              : "count",
        interpolation: this.activeVariable === "occupancy" ? "step" : "linear",
        points: [],
      };
      updatedProfiles.push(profile);
    }

    const filteredPoints = profile.points.filter((p) => p.timeOffsetSeconds !== sec);
    filteredPoints.push({ timeOffsetSeconds: sec, value: Number(this.newPointValue) });
    filteredPoints.sort((a, b) => a.timeOffsetSeconds - b.timeOffsetSeconds);

    profile.points = filteredPoints;

    const updatedScenario: ScenarioDefinition = {
      ...this.scenario,
      profiles: updatedProfiles,
    };

    await simulationConfigStore.saveScenario(updatedScenario);
    this.scenario = updatedScenario;
    this.renderChart();
  }

  private async deletePoint(sec: number) {
    if (!this.scenario) return;
    const profile = this.getActiveProfile();
    if (!profile) return;

    profile.points = profile.points.filter((p) => p.timeOffsetSeconds !== sec);
    await simulationConfigStore.saveScenario(this.scenario);
    this.renderChart();
    this.requestUpdate();
  }

  render() {
    const profile = this.getActiveProfile();
    const points = [...(profile?.points || [])].sort(
      (a, b) => a.timeOffsetSeconds - b.timeOffsetSeconds,
    );
    const unit =
      this.activeVariable === "daylight_lux"
        ? "lx"
        : this.activeVariable === "temperature_c"
          ? "°C"
          : "count";

    return html`
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="margin: 0; font-size: 16px;">📈 24h Environmental Profiles Editor</h3>
            <span style="font-size: 12px; color: var(--color-text-secondary, #64748b);">
              Modeled environmental conditions over 24-hour simulation day.
            </span>
          </div>
          <div>
            <select
              .value=${this.selectedZoneId}
              @change=${(e: Event) => {
                this.selectedZoneId = (e.target as HTMLSelectElement).value;
                this.renderChart();
              }}
            >
              ${this.scenario?.zones?.map((z) => html`<option value="${z.id}">${z.name}</option>`)}
            </select>
          </div>
        </div>

        <div class="tabs">
          <button
            class="tab-btn ${this.activeVariable === "daylight_lux" ? "active" : ""}"
            @click=${() => {
              this.activeVariable = "daylight_lux";
              this.newPointValue = 500;
              this.renderChart();
            }}
          >
            ☀️ Daylight (Lux)
          </button>
          <button
            class="tab-btn ${this.activeVariable === "temperature_c" ? "active" : ""}"
            @click=${() => {
              this.activeVariable = "temperature_c";
              this.newPointValue = 23.5;
              this.renderChart();
            }}
          >
            🌡️ Temperature (°C)
          </button>
          <button
            class="tab-btn ${this.activeVariable === "occupancy" ? "active" : ""}"
            @click=${() => {
              this.activeVariable = "occupancy";
              this.newPointValue = 1;
              this.renderChart();
            }}
          >
            👥 Occupancy (Step)
          </button>
        </div>

        <div id="profile-chart" class="chart-container"></div>

        <div class="add-point-bar">
          <strong style="font-size: 13px;">➕ Add / Update Anchor Point:</strong>
          <label style="font-size: 12px;">Time (HH:MM)</label>
          <input
            type="time"
            .value=${this.newPointTime}
            @input=${(e: Event) => {
              this.newPointTime = (e.target as HTMLInputElement).value;
            }}
          />
          <label style="font-size: 12px;">Value (${unit})</label>
          <input
            type="number"
            step="0.1"
            .value=${String(this.newPointValue)}
            @input=${(e: Event) => {
              this.newPointValue = Number((e.target as HTMLInputElement).value);
            }}
          />
          <button class="primary" @click=${this.addPoint}>Set Point</button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Time (Offset)</th>
                <th>Time (Local)</th>
                <th>Value (${unit})</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${points.map(
                (p) => html`
                  <tr>
                    <td>${p.timeOffsetSeconds}s</td>
                    <td><strong>${this.secondsToTime(p.timeOffsetSeconds)}</strong></td>
                    <td>${p.value} ${unit}</td>
                    <td>
                      <button class="danger" @click=${() => this.deletePoint(p.timeOffsetSeconds)}>Delete</button>
                    </td>
                  </tr>
                `,
              )}
              ${
                points.length === 0
                  ? html`<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No anchor points set. Click 'Set Point' to add one.</td></tr>`
                  : ""
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
