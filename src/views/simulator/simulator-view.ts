import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components";
import "../../components/mock-lab";
import type { ScenarioDefinition } from "../../models/scenario";
import { demoStore, simulationConfigStore } from "../../stores";

type MockLabTab =
  | "run"
  | "scenario"
  | "environment"
  | "devices"
  | "curves"
  | "history"
  | "override";

@customElement("simulator-view")
export class SimulatorView extends LitElement {
  @state() private activeTab: MockLabTab = "run";
  @state() private scenario: ScenarioDefinition | null = null;
  @state() private isLoading = true;
  @state() private error: string | null = null;

  private unsubscribeConfig: (() => void) | null = null;
  private unsubscribeDemo: (() => void) | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6, 24px);
      width: 100%;
    }
    .banner {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-lg, 12px);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .badge {
      background-color: var(--color-primary, #2563eb);
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .tabs-nav {
      display: flex;
      gap: 6px;
      border-bottom: 2px solid var(--color-border, #e2e8f0);
      padding-bottom: 2px;
      overflow-x: auto;
    }
    .tab-item {
      padding: 10px 18px;
      border: none;
      background: none;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-secondary, #64748b);
      cursor: pointer;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 150ms ease;
      white-space: nowrap;
    }
    .tab-item:hover {
      background: var(--color-bg-subtle, #f8fafc);
      color: var(--color-text-primary, #0f172a);
    }
    .tab-item.active {
      color: var(--color-primary, #2563eb);
      background: var(--color-bg-surface, #ffffff);
      border-bottom: 3px solid var(--color-primary, #2563eb);
      font-weight: 700;
    }
    .content-area {
      min-height: 400px;
    }
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    this.unsubscribeConfig = simulationConfigStore.subscribe(() => {
      this.scenario = simulationConfigStore.getSelectedScenario();
      this.isLoading = simulationConfigStore.getIsLoading();
      this.error = simulationConfigStore.getError();
      this.requestUpdate();
    });

    this.unsubscribeDemo = demoStore.subscribe(() => {
      this.requestUpdate();
    });

    await simulationConfigStore.init();
    const sc = simulationConfigStore.getSelectedScenario();
    if (sc) {
      this.scenario = sc;
      demoStore.selectScenario(sc);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeConfig?.();
    this.unsubscribeDemo?.();
  }

  render() {
    return html`
      <!-- Top Laboratory Header Banner -->
      <div class="banner">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="badge">WITMIND MOCK LAB v2</span>
          <span style="font-size: 13px; font-weight: 600; color: #1e3a8a;">
            Deterministic Simulation & Hardware Calibration Laboratory
          </span>
        </div>
        <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 8px;">
          <span>Active Scenario: <strong>${this.scenario?.name || "Loading..."}</strong> | Clock: <strong>${demoStore.getClockTime()}</strong></span>
          ${this.isLoading ? html`<span style="color: var(--color-primary, #2563eb); font-weight: 600;">(Syncing...)</span>` : ""}
        </div>
      </div>

      ${this.error ? html`<div class="error-banner">⚠️ ${this.error}</div>` : ""}

      <!-- Main Workbench Navigation Tabs -->
      <nav class="tabs-nav" aria-label="Mock Lab Sections">
        <button
          class="tab-item ${this.activeTab === "run" ? "active" : ""}"
          @click=${() => {
            this.activeTab = "run";
          }}
        >
          ▶️ Run Lab
        </button>
        <button
          class="tab-item ${this.activeTab === "scenario" ? "active" : ""}"
          @click=${() => {
            this.activeTab = "scenario";
          }}
        >
          🧪 Scenario
        </button>
        <button
          class="tab-item ${this.activeTab === "environment" ? "active" : ""}"
          @click=${() => {
            this.activeTab = "environment";
          }}
        >
          📈 Environment
        </button>
        <button
          class="tab-item ${this.activeTab === "devices" ? "active" : ""}"
          @click=${() => {
            this.activeTab = "devices";
          }}
        >
          💡 Devices
        </button>
        <button
          class="tab-item ${this.activeTab === "curves" ? "active" : ""}"
          @click=${() => {
            this.activeTab = "curves";
          }}
        >
          📐 Curves
        </button>
        <button
          class="tab-item ${this.activeTab === "history" ? "active" : ""}"
          @click=${() => {
            this.activeTab = "history";
          }}
        >
          📚 History
        </button>
        <button
          class="tab-item ${this.activeTab === "override" ? "active" : ""}"
          @click=${() => {
            this.activeTab = "override";
          }}
        >
          🎛️ Live Overrides
        </button>
      </nav>

      <!-- Tab Content Area -->
      <div class="content-area">
        ${
          this.activeTab === "run"
            ? html`<mock-lab-run-controls .scenario=${this.scenario}></mock-lab-run-controls>`
            : ""
        }
        ${
          this.activeTab === "scenario"
            ? html`<mock-lab-scenario-manager .scenario=${this.scenario}></mock-lab-scenario-manager>`
            : ""
        }
        ${
          this.activeTab === "environment"
            ? html`<mock-lab-profile-editor .scenario=${this.scenario}></mock-lab-profile-editor>`
            : ""
        }
        ${
          this.activeTab === "devices"
            ? html`<mock-lab-devices-manager .scenario=${this.scenario}></mock-lab-devices-manager>`
            : ""
        }
        ${this.activeTab === "curves" ? html`<mock-lab-curve-editor></mock-lab-curve-editor>` : ""}
        ${this.activeTab === "history" ? html`<mock-lab-run-history></mock-lab-run-history>` : ""}
        ${
          this.activeTab === "override"
            ? html`<mock-lab-live-override .scenario=${this.scenario}></mock-lab-live-override>`
            : ""
        }
      </div>
    `;
  }
}
