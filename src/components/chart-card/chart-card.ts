import * as echarts from "echarts";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("chart-card")
export class ChartCard extends LitElement {
  @property({ type: String }) title = "";
  @property({ type: String }) subtitle = "";
  @property({ type: Object }) options: echarts.EChartsOption | null = null;
  @property({ type: Number }) height = 280;

  private chartInstance: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .chart-card {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-4, 16px);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .header {
      margin-bottom: var(--spacing-3, 12px);
    }
    .title {
      font-size: var(--font-size-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
    }
    .subtitle {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-muted, #64748b);
      margin-top: 2px;
    }
    .chart-container {
      width: 100%;
      min-height: 200px;
    }
  `;

  firstUpdated() {
    this.initChart();
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has("options") && this.chartInstance && this.options) {
      this.chartInstance.setOption(this.options, true);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  }

  private initChart() {
    const container = this.renderRoot.querySelector(".chart-container") as HTMLElement;
    if (!container) return;

    this.chartInstance = echarts.init(container);
    if (this.options) {
      this.chartInstance.setOption(this.options);
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.chartInstance?.resize();
    });
    this.resizeObserver.observe(container);
  }

  render() {
    return html`
      <div class="chart-card">
        <div class="header">
          <div class="title">${this.title}</div>
          ${this.subtitle ? html`<div class="subtitle">${this.subtitle}</div>` : ""}
        </div>
        <div class="chart-container" style="height: ${this.height}px;"></div>
      </div>
    `;
  }
}
