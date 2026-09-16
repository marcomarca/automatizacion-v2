import * as echarts from "echarts";
import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { PhysicalCurve, SourceReference } from "../../models/scenario";
import { simulationConfigStore } from "../../stores/simulation-config.store";

@customElement("mock-lab-curve-editor")
export class MockLabCurveEditor extends LitElement {
  @state() private curves: PhysicalCurve[] = [];
  @state() private selectedCurveId = "";
  @state() private sources: SourceReference[] = [];
  @state() private newX = 5;
  @state() private newY = 24;

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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
      margin: 0;
    }
    .provenance-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-published {
      background: #dcfce7;
      color: #15803d;
    }
    .badge-derived {
      background: #e0f2fe;
      color: #0369a1;
    }
    .badge-modelled {
      background: #fef9c3;
      color: #854d0e;
    }
    .badge-measured {
      background: #ede9fe;
      color: #6d28d9;
    }
    .badge-legacy {
      background: #f1f5f9;
      color: #475569;
    }
    .chart-container {
      width: 100%;
      height: 260px;
      margin-bottom: 16px;
    }
    .source-box {
      background: var(--color-bg-subtle, #f8fafc);
      border-left: 3px solid var(--color-primary, #2563eb);
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 13px;
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
  `;

  connectedCallback() {
    super.connectedCallback();
    this.refresh();
  }

  private refresh() {
    this.curves = simulationConfigStore.getCurves();
    this.sources = simulationConfigStore.getSources();
    if (!this.selectedCurveId && this.curves.length > 0) {
      this.selectedCurveId = this.curves[0].id;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("selectedCurveId") || changedProperties.has("curves")) {
      this.renderChart();
    }
  }

  private getSelectedCurve(): PhysicalCurve | undefined {
    return this.curves.find((c) => c.id === this.selectedCurveId);
  }

  private renderChart() {
    const container = this.shadowRoot?.querySelector("#curve-chart") as HTMLDivElement;
    if (!container) return;

    if (!this.chartInstance) {
      this.chartInstance = echarts.init(container);
    }

    const curve = this.getSelectedCurve();
    if (!curve) return;

    const points = [...(curve.points || [])].sort((a, b) => a.x - b.x);
    const chartData = points.map((p) => [p.x, p.y]);

    const option: echarts.EChartsOption = {
      grid: { left: "55px", right: "25px", top: "25px", bottom: "35px" },
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const list = params as Array<{ data: [number, number] }>;
          const pt = list[0];
          return `${curve.inputVariable}: <strong>${pt.data[0]} ${curve.inputUnit}</strong><br/>${curve.outputVariable}: <strong>${pt.data[1]} ${curve.outputUnit}</strong>`;
        },
      },
      xAxis: {
        type: "value",
        name: `${curve.inputVariable} (${curve.inputUnit})`,
        nameLocation: "middle",
        nameGap: 24,
      },
      yAxis: {
        type: "value",
        name: `${curve.outputVariable} (${curve.outputUnit})`,
      },
      series: [
        {
          name: curve.name,
          type: "line",
          data: chartData,
          itemStyle: { color: "#2563eb" },
          symbolSize: 8,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#2563eb33" },
              { offset: 1, color: "#2563eb05" },
            ]),
          },
        },
      ],
    };

    this.chartInstance.setOption(option, true);
  }

  private async addPoint() {
    const curve = this.getSelectedCurve();
    if (!curve) return;

    const points = [...curve.points.filter((p) => p.x !== Number(this.newX))];
    points.push({
      x: Number(this.newX),
      y: Number(this.newY),
      sourceKind: "user_supplied",
      notes: "User experimental calibration point",
    });
    points.sort((a, b) => a.x - b.x);

    const updated: PhysicalCurve = {
      ...curve,
      status: "derived",
      points,
    };

    await simulationConfigStore.saveCurve(updated);
    this.refresh();
  }

  private async deletePoint(x: number) {
    const curve = this.getSelectedCurve();
    if (!curve) return;

    const points = curve.points.filter((p) => p.x !== x);
    const updated: PhysicalCurve = {
      ...curve,
      points,
    };

    await simulationConfigStore.saveCurve(updated);
    this.refresh();
  }

  render() {
    const curve = this.getSelectedCurve();
    const source = this.sources.find((s) => s.id === curve?.sourceReferenceId);
    const statusClass = `badge-${curve?.status || "modelled"}`;

    return html`
      <div class="card">
        <div class="header">
          <div>
            <h3 class="title">📐 Physical Curve Models & Optical Transfer Lab</h3>
            <span style="font-size: 12px; color: var(--color-text-secondary, #64748b);">
              Data-driven transfer curves mapping control voltage, current, watts, and optical lux.
            </span>
          </div>
          <div>
            <select
              .value=${this.selectedCurveId}
              @change=${(e: Event) => {
                this.selectedCurveId = (e.target as HTMLSelectElement).value;
                this.renderChart();
              }}
            >
              ${this.curves.map((c) => html`<option value="${c.id}">${c.name}</option>`)}
            </select>
          </div>
        </div>

        ${
          curve
            ? html`
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <span class="provenance-badge ${statusClass}">Provenance: ${curve.status}</span>
                <span style="font-size: 13px; color: #475569;">
                  Mapping <strong>${curve.inputVariable} (${curve.inputUnit})</strong> → <strong>${curve.outputVariable} (${curve.outputUnit})</strong>
                </span>
              </div>

              ${
                source
                  ? html`
                    <div class="source-box">
                      <strong>Source Reference:</strong> ${source.title} (${source.sourceKind})<br />
                      ${source.url ? html`<a href="${source.url}" target="_blank" style="color: #2563eb;">📄 Datasheet URL</a> | ` : ""}
                      <span style="color: #64748b;">${source.notes}</span>
                    </div>
                  `
                  : ""
              }

              <div id="curve-chart" class="chart-container"></div>

              <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px; background: #f8fafc; padding: 10px; border-radius: 6px; flex-wrap: wrap;">
                <strong style="font-size: 13px;">➕ Add Calibration Point:</strong>
                <label style="font-size: 12px;">X (${curve.inputUnit})</label>
                <input
                  type="number"
                  step="0.1"
                  .value=${String(this.newX)}
                  @input=${(e: Event) => {
                    this.newX = Number((e.target as HTMLInputElement).value);
                  }}
                />
                <label style="font-size: 12px;">Y (${curve.outputUnit})</label>
                <input
                  type="number"
                  step="0.1"
                  .value=${String(this.newY)}
                  @input=${(e: Event) => {
                    this.newY = Number((e.target as HTMLInputElement).value);
                  }}
                />
                <button class="primary" @click=${this.addPoint}>Insert Point</button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>X (${curve.inputVariable} [${curve.inputUnit}])</th>
                    <th>Y (${curve.outputVariable} [${curve.outputUnit}])</th>
                    <th>Point Status</th>
                    <th>Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${curve.points.map(
                    (pt) => html`
                      <tr>
                        <td><strong>${pt.x}</strong></td>
                        <td>${pt.y}</td>
                        <td><span class="provenance-badge badge-${pt.sourceKind || "modelled"}">${pt.sourceKind || "modelled"}</span></td>
                        <td style="color: #64748b; font-size: 12px;">${pt.notes || "—"}</td>
                        <td>
                          <button class="danger" @click=${() => this.deletePoint(pt.x)}>Remove</button>
                        </td>
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
            `
            : html`<div>Select a physical curve to inspect and calibrate.</div>`
        }
      </div>
    `;
  }
}
