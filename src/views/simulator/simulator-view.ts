import { LitElement, html } from "lit";
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

  protected createRenderRoot() {
    return this;
  }

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
      <section>
        <header>
          <h1>WITMIND MOCK LAB v2 — Laboratorio de Simulación y Calibración</h1>
          <p>
            <strong>Escenario Activo:</strong> ${this.scenario?.name || "Cargando..."}
            | <strong>Reloj:</strong> ${demoStore.getClockTime()}
            ${this.isLoading ? html`<em>(Sincronizando...)</em>` : ""}
          </p>
        </header>

        ${this.error ? html`<p>⚠️ Error: ${this.error}</p>` : ""}

        <nav aria-label="Secciones de Mock Lab">
          <button
            type="button"
            @click=${() => {
              this.activeTab = "run";
            }}
          >
            ${this.activeTab === "run" ? html`<strong>[ ▶️ Ejecución ]</strong>` : "▶️ Ejecución"}
          </button>
          <button
            type="button"
            @click=${() => {
              this.activeTab = "scenario";
            }}
          >
            ${this.activeTab === "scenario" ? html`<strong>[ 🧪 Escenarios ]</strong>` : "🧪 Escenarios"}
          </button>
          <button
            type="button"
            @click=${() => {
              this.activeTab = "environment";
            }}
          >
            ${this.activeTab === "environment" ? html`<strong>[ 📈 Entorno ]</strong>` : "📈 Entorno"}
          </button>
          <button
            type="button"
            @click=${() => {
              this.activeTab = "devices";
            }}
          >
            ${this.activeTab === "devices" ? html`<strong>[ 💡 Dispositivos ]</strong>` : "💡 Dispositivos"}
          </button>
          <button
            type="button"
            @click=${() => {
              this.activeTab = "curves";
            }}
          >
            ${this.activeTab === "curves" ? html`<strong>[ 📐 Curvas ]</strong>` : "📐 Curvas"}
          </button>
          <button
            type="button"
            @click=${() => {
              this.activeTab = "history";
            }}
          >
            ${this.activeTab === "history" ? html`<strong>[ 📚 Historial ]</strong>` : "📚 Historial"}
          </button>
          <button
            type="button"
            @click=${() => {
              this.activeTab = "override";
            }}
          >
            ${this.activeTab === "override" ? html`<strong>[ 🎛️ Overrides ]</strong>` : "🎛️ Overrides"}
          </button>
        </nav>

        <div>
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
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "simulator-view": SimulatorView;
  }
}
