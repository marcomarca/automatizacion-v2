import * as echarts from "echarts";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("chart-card")
export class ChartCard extends LitElement {
  @property({ type: String }) title = "";
  @property({ type: String }) subtitle = "";
  @property({ type: Object }) options: echarts.EChartsOption | null = null;
  @property({ type: Number }) height = 280;

  private chartInstance: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  protected createRenderRoot() {
    return this;
  }

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
      <section>
        <header>
          <h3>${this.title}</h3>
          ${this.subtitle ? html`<p>${this.subtitle}</p>` : ""}
        </header>
        <div class="chart-container" style="height: ${this.height}px;"></div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chart-card": ChartCard;
  }
}
