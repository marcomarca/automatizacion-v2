import type * as echarts from "echarts";
import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components";
import { demoStore } from "../../stores";

@customElement("lighting-view")
export class LightingView extends LitElement {
  @state() private lightingZones = demoStore.getLightingZones();
  @state() private energy = demoStore.getEnergy();
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
      this.lightingZones = demoStore.getLightingZones();
      this.energy = demoStore.getEnergy();
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

  private handleBrightnessChange(e: CustomEvent<{ zoneId: string; brightness: number }>) {
    demoStore.updateZoneInput(e.detail.zoneId, {
      brightnessOverride: e.detail.brightness,
      mode: "manual",
    });
  }

  private handleModeChange(e: CustomEvent<{ zoneId: string; mode: "auto" | "manual" }>) {
    demoStore.updateZoneInput(e.detail.zoneId, {
      mode: e.detail.mode,
    });
  }

  private getCorrelationChartOptions(): echarts.EChartsOption {
    const times = this.history.map((h) => h.time);
    const daylights = this.history.map((h) => h.daylightLux);
    const brightnesses = this.history.map((h) => h.brightness);

    return {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["Natural Daylight (Lux)", "Regulated Brightness (%)"],
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
      yAxis: [
        {
          type: "value",
          name: "Lux",
          min: 0,
          max: 1000,
        },
        {
          type: "value",
          name: "Brightness %",
          min: 0,
          max: 100,
          axisLabel: {
            formatter: "{value}%",
          },
        },
      ],
      series: [
        {
          name: "Natural Daylight (Lux)",
          type: "line",
          data: daylights,
          lineStyle: { color: "#d97706", width: 2 },
          itemStyle: { color: "#d97706" },
        },
        {
          name: "Regulated Brightness (%)",
          type: "line",
          yAxisIndex: 1,
          data: brightnesses,
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
          <span>⚠️ <strong>Simulated API Error</strong>: Unable to load lighting telemetry.</span>
          <button class="badge badge-demo" @click=${() => demoStore.setSimulatedError(false)}>Retry</button>
        </div>
      `;
    }

    let totalNominalW = 0;
    let totalActualW = 0;

    for (const z of this.lightingZones) {
      if (z.lighting) {
        totalNominalW += z.lighting.nominalPowerW;
        totalActualW += z.lighting.actualPowerW;
      }
    }

    const savedWatts = Math.max(0, totalNominalW - totalActualW);
    const instantReduction = totalNominalW > 0 ? Math.round((savedWatts / totalNominalW) * 100) : 0;

    return html`
      <!-- Lighting KPI Header -->
      <div class="kpi-grid">
        <metric-card
          .label=${"Active Lighting Power"}
          .value=${`${totalActualW}`}
          .unit=${"W"}
          .trend=${`-${savedWatts}W Saved`}
          .trendPositive=${true}
          .subtext=${`Baseline: ${totalNominalW}W`}
        ></metric-card>

        <metric-card
          .label=${"Instant Power Reduction"}
          .value=${`${instantReduction}%`}
          .unit=${""}
          .trend=${"Daylight Harvesting"}
          .trendPositive=${true}
          .subtext=${"Automated dimming active"}
        ></metric-card>

        <metric-card
          .label=${"Monitored Fixtures"}
          .value=${`${this.lightingZones.length}`}
          .unit=${"zones"}
          .trend=${"All auto-controlled"}
          .trendPositive=${true}
          .subtext=${"Office, meeting & showroom"}
        ></metric-card>

        <metric-card
          .label=${"Daily Lighting Savings"}
          .value=${`${this.energy.energySavedKwh}`}
          .unit=${"kWh"}
          .trend=${`$${this.energy.moneySaved} avoided`}
          .trendPositive=${true}
          .subtext=${"Cumulative simulated"}
        ></metric-card>
      </div>

      <!-- Live Correlation Chart -->
      <chart-card
        .title=${"Daylight Harvesting Correlation"}
        .subtitle=${"Real-time inverse tracking between solar lux input and artificial fixture dimming"}
        .options=${this.getCorrelationChartOptions()}
        .height=${280}
      ></chart-card>

      <!-- Zones Detail Grid -->
      <div>
        <div class="section-title">Lighting Zones Control & Telemetry</div>
        <div class="zones-grid">
          ${this.lightingZones.map(
            (zone) => html`
              <lighting-zone
                .zone=${zone}
                @brightness-change=${this.handleBrightnessChange}
                @mode-change=${this.handleModeChange}
              ></lighting-zone>
            `,
          )}
        </div>
      </div>
    `;
  }
}
