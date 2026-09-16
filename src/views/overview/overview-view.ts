import type * as echarts from "echarts";
import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components";
import { ActivityStore, BuildingStore, ClimateStore, EnergyStore, demoStore } from "../../stores";

@customElement("overview-view")
export class OverviewView extends LitElement {
  @state() private building = BuildingStore.getBuilding();
  @state() private energy = EnergyStore.getOverview();
  @state() private activities = ActivityStore.getActivities().slice(0, 3);
  @state() private recommendation = ClimateStore.getRecommendation();
  @state() private scenarioName = demoStore.getCurrentScenario().name;
  @state() private clockTime = demoStore.getClockTime();
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
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-6, 24px);
    }
    @media (min-width: 1024px) {
      .content-grid {
        grid-template-columns: 8fr 4fr;
      }
    }
    .left-col, .right-col {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6, 24px);
    }
    .section-title {
      font-size: var(--font-size-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
      margin-bottom: var(--spacing-3, 12px);
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
    .activity-section {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-4, 16px);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
    }
    .view-all-link {
      display: block;
      margin-top: var(--spacing-3, 12px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-primary, #2563eb);
      text-align: center;
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
      this.isError = demoStore.isSimulatedError();
      if (!this.isError) {
        this.building = BuildingStore.getBuilding();
        this.energy = EnergyStore.getOverview();
        this.activities = ActivityStore.getActivities().slice(0, 3);
        this.recommendation = ClimateStore.getRecommendation();
        this.scenarioName = demoStore.getCurrentScenario().name;
        this.clockTime = demoStore.getClockTime();
        this.history = demoStore.getHistory();
      }
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

  private getEnergyChartOptions(): echarts.EChartsOption {
    const times = this.history.map((h) => h.time);
    const baselines = this.history.map((h) => h.baselineKwh);
    const actuals = this.history.map((h) => h.actualKwh);

    return {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["Baseline Consumption", "Witmind Optimized"],
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
        boundaryGap: false,
        data: times,
      },
      yAxis: {
        type: "value",
        name: "kWh",
      },
      series: [
        {
          name: "Baseline Consumption",
          type: "line",
          data: baselines,
          lineStyle: { color: "#94a3b8", width: 2, type: "dashed" },
          itemStyle: { color: "#94a3b8" },
        },
        {
          name: "Witmind Optimized",
          type: "line",
          areaStyle: {
            color: "rgba(37, 99, 235, 0.12)",
          },
          data: actuals,
          lineStyle: { color: "#2563eb", width: 3 },
          itemStyle: { color: "#2563eb" },
        },
      ],
    };
  }

  render() {
    if (this.isError) {
      return html`
        <div class="error-card">
          <span>⚠️ <strong>Simulated API Connection Error</strong>: Failed to connect to telemetry backend.</span>
          <button class="badge badge-demo" @click=${() => demoStore.setSimulatedError(false)}>Retry Connection</button>
        </div>
      `;
    }

    return html`
      <status-card
        .statusText=${"Building Intelligence Active"}
        .scenarioName=${this.scenarioName}
        .virtualTime=${this.clockTime}
        .isDemo=${true}
      ></status-card>

      <!-- KPI Overview Grid -->
      <div class="kpi-grid">
        <metric-card
          .label=${"Energy Reduction"}
          .value=${`${this.energy.savingsPercent}%`}
          .unit=${""}
          .trend=${"Optimal"}
          .trendPositive=${true}
          .subtext=${"vs Standard Baseline"}
        ></metric-card>

        <metric-card
          .label=${"Modeled Savings"}
          .value=${`${this.energy.energySavedKwh}`}
          .unit=${"kWh"}
          .trend=${`$${this.energy.moneySaved} saved`}
          .trendPositive=${true}
          .subtext=${"Today's simulated impact"}
        ></metric-card>

        <metric-card
          .label=${"Autonomous Actions"}
          .value=${`${this.energy.automatedActions}`}
          .unit=${""}
          .trend=${"Active"}
          .trendPositive=${true}
          .subtext=${"Daylight, absence & HVAC"}
        ></metric-card>

        <metric-card
          .label=${"Comfort Compliance"}
          .value=${"94%"}
          .unit=${""}
          .trend=${"22-24°C Band"}
          .trendPositive=${true}
          .subtext=${"Occupied hours in target"}
        ></metric-card>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <div class="left-col">
          <!-- Live Energy Comparison Chart -->
          <chart-card
            .title=${"Energy Optimization Comparison"}
            .subtitle=${"Cumulative consumption: Baseline vs Witmind autonomous control"}
            .options=${this.getEnergyChartOptions()}
            .height=${280}
          ></chart-card>

          <!-- Zone Summary -->
          <div>
            <div class="section-title">Zone Overview</div>
            <div class="zones-grid">
              ${this.building.zones.map((zone) => html`<zone-card .zone=${zone}></zone-card>`)}
            </div>
          </div>
        </div>

        <div class="right-col">
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

          <div class="activity-section">
            <div class="section-title">Recent Autonomous Decisions</div>
            ${this.activities.map((act) => html`<activity-item .activity=${act}></activity-item>`)}
            <a href="#/activity" class="view-all-link">View All Activity &rarr;</a>
          </div>
        </div>
      </div>
    `;
  }
}
