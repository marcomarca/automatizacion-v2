import type * as echarts from "echarts";
import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components";
import { ClimateStore, demoStore } from "../../stores";

@customElement("climate-view")
export class ClimateView extends LitElement {
  @state() private climateZones = ClimateStore.getClimateZones();
  @state() private recommendation = ClimateStore.getRecommendation();
  @state() private history = demoStore.getHistory();
  @state() private isError = demoStore.isSimulatedError();

  private unsubscribeStore: (() => void) | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6, 24px);
      width: 100%;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-4, 16px);
    }
    @media (min-width: 640px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .zones-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-4, 16px);
    }
    @media (min-width: 640px) {
      .zones-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .section-title {
      font-size: var(--font-size-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
      margin-bottom: var(--spacing-3, 12px);
    }
    .error-card {
      background-color: var(--color-danger-subtle, #fef2f2);
      border: 1px solid var(--color-danger, #dc2626);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-4, 16px);
      color: var(--color-danger, #dc2626);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeStore = demoStore.subscribe(() => {
      this.climateZones = ClimateStore.getClimateZones();
      this.recommendation = ClimateStore.getRecommendation();
      this.history = demoStore.getHistory();
      this.isError = demoStore.isSimulatedError();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
  }

  private handleAcceptRecommendation() {
    ClimateStore.acceptRecommendation();
  }

  private handleDismissRecommendation() {
    ClimateStore.dismissRecommendation();
  }

  private getThermalChartOptions(): echarts.EChartsOption {
    const times = this.history.map((h) => h.time);
    const temps = this.history.map((h) => h.temperature);
    const targets = this.history.map(() => 23.0);

    return {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["Current Temperature", "Comfort Target (23°C)"],
        bottom: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "12%",
        top: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: times,
      },
      yAxis: {
        type: "value",
        name: "°C",
        min: 18,
        max: 28,
      },
      series: [
        {
          name: "Current Temperature",
          type: "line",
          data: temps,
          lineStyle: { color: "#2563eb", width: 3 },
          itemStyle: { color: "#2563eb" },
          markArea: {
            itemStyle: {
              color: "rgba(22, 163, 74, 0.12)",
            },
            data: [
              [
                {
                  name: "Comfort Band (22-24°C)",
                  yAxis: 22,
                },
                {
                  yAxis: 24,
                },
              ],
            ],
          },
        },
        {
          name: "Comfort Target (23°C)",
          type: "line",
          data: targets,
          lineStyle: { color: "#16a34a", width: 2, type: "dashed" },
          itemStyle: { color: "#16a34a" },
        },
      ],
    };
  }

  render() {
    if (this.isError) {
      return html`
        <div class="error-card">
          <span>⚠️ <strong>Simulated API Error</strong>: Unable to load telemetry data.</span>
          <button class="badge badge-demo" @click=${() => demoStore.setSimulatedError(false)}>Retry</button>
        </div>
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
      <!-- Climate KPI Header -->
      <div class="kpi-grid">
        <metric-card
          .label=${"Average Building Temp"}
          .value=${`${avgTemp}°C`}
          .unit=${""}
          .trend=${"Optimal"}
          .trendPositive=${true}
          .subtext=${"Across all conditioned zones"}
        ></metric-card>

        <metric-card
          .label=${"Target Comfort Band"}
          .value=${"22 – 24"}
          .unit=${"°C"}
          .trend=${"Setpoint: 23°C"}
          .trendPositive=${true}
          .subtext=${"Standard ASHRAE baseline"}
        ></metric-card>

        <metric-card
          .label=${"In-Target Compliance"}
          .value=${"94%"}
          .unit=${""}
          .trend=${"HVAC Modulating"}
          .trendPositive=${true}
          .subtext=${"Occupied business hours"}
        ></metric-card>

        <metric-card
          .label=${"Thermal Waste Avoided"}
          .value=${"3.2"}
          .unit=${"kWh"}
          .trend=${"Preconditioning Active"}
          .trendPositive=${true}
          .subtext=${"Overheating prevented"}
        ></metric-card>
      </div>

      <!-- Recommendation Alert if Available -->
      ${
        this.recommendation
          ? html`
            <recommendation-card
              .title=${this.recommendation.title}
              .description=${this.recommendation.description}
              .actionLabel=${this.recommendation.actionLabel}
              .skipLabel=${this.recommendation.skipLabel}
              @accept=${this.handleAcceptRecommendation}
              @skip=${this.handleDismissRecommendation}
            ></recommendation-card>
          `
          : ""
      }

      <!-- Temperature vs Comfort Band Chart with Visual markArea -->
      <chart-card
        .title=${"Thermal Comfort Monitoring"}
        .subtitle=${"Real-time sensor temperature tracking vs 22–24°C shaded comfort band"}
        .options=${this.getThermalChartOptions()}
        .height=${280}
      ></chart-card>

      <!-- Climate Zones Grid -->
      <div>
        <div class="section-title">Thermal Zones & HVAC Status</div>
        <div class="zones-grid">
          ${this.climateZones.map((zone) => html`<climate-zone .zone=${zone}></climate-zone>`)}
        </div>
      </div>
    `;
  }
}
