import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { ScenarioDefinition } from "../../models/scenario";
import { demoStore } from "../../stores/demo.store";
import { simulationConfigStore } from "../../stores/simulation-config.store";

@customElement("mock-lab-scenario-manager")
export class MockLabScenarioManager extends LitElement {
  @property({ type: Object }) scenario: ScenarioDefinition | null = null;
  @state() private scenarios: ScenarioDefinition[] = [];
  @state() private showCloneDialog = false;
  @state() private cloneName = "";
  @state() private showDeleteDialog = false;
  @state() private showResetDbDialog = false;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.refresh();
  }

  private refresh() {
    this.scenarios = simulationConfigStore.getScenarios();
    if (!this.scenario && this.scenarios.length > 0) {
      this.scenario = simulationConfigStore.getSelectedScenario() || this.scenarios[0];
    }
  }

  private onSelectScenario(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    simulationConfigStore.selectScenario(id).then((sc) => {
      if (sc) {
        this.scenario = sc;
        demoStore.selectScenario(sc);
      }
    });
  }

  private handleClone() {
    if (!this.scenario) return;
    this.cloneName = `${this.scenario.name} (Hypothesis B)`;
    this.showCloneDialog = true;
  }

  private async confirmClone() {
    if (!this.scenario || !this.cloneName.trim()) return;
    const cloned = await simulationConfigStore.cloneScenario(
      this.scenario.id,
      this.cloneName.trim(),
    );
    this.scenario = cloned;
    demoStore.selectScenario(cloned);
    this.showCloneDialog = false;
    this.refresh();
  }

  private async confirmDelete() {
    if (!this.scenario) return;
    await simulationConfigStore.deleteScenario(this.scenario.id);
    this.showDeleteDialog = false;
    this.refresh();
    const current = simulationConfigStore.getSelectedScenario();
    if (current) {
      this.scenario = current;
      demoStore.selectScenario(current);
    }
  }

  private async confirmResetDb() {
    await simulationConfigStore.resetDatabase();
    this.showResetDbDialog = false;
    this.refresh();
    const current = simulationConfigStore.getSelectedScenario();
    if (current) {
      this.scenario = current;
      demoStore.selectScenario(current);
    }
  }

  private async saveMetadata() {
    if (!this.scenario) return;
    const nameInput = this.shadowRoot?.querySelector("#sc-name") as HTMLInputElement;
    const descInput = this.shadowRoot?.querySelector("#sc-desc") as HTMLTextAreaElement;
    const stepInput = this.shadowRoot?.querySelector("#sc-step") as HTMLInputElement;

    const updated: ScenarioDefinition = {
      ...this.scenario,
      name: nameInput?.value || this.scenario.name,
      description: descInput?.value || this.scenario.description,
      time: {
        ...this.scenario.time,
        defaultStepSeconds: Number.parseInt(stepInput?.value || "60", 10),
      },
    };

    await simulationConfigStore.saveScenario(updated);
    this.scenario = updated;
    demoStore.selectScenario(updated);
    this.refresh();
  }

  render() {
    return html`
      <div class="card">
        <div class="header">
          <div>
            <h2 class="title">🧪 Scenario Configuration & Experiment Memory</h2>
            <div style="margin-top: 6px;">
              <span class="meta-badge">ID: ${this.scenario?.id || "none"}</span>
              ${this.scenario?.parentId ? html`<span class="meta-badge">🧬 Origin: ${this.scenario.parentId}</span>` : ""}
              <span class="meta-badge">Schema: v${this.scenario?.schemaVersion || 2}</span>
            </div>
          </div>
          <div class="controls">
            <select @change=${this.onSelectScenario}>
              ${this.scenarios.map(
                (s) =>
                  html`<option value="${s.id}" ?selected=${s.id === this.scenario?.id}>${s.name}</option>`,
              )}
            </select>
            <button @click=${this.handleClone}>🧬 Clone Hypothesis</button>
            <button class="danger" @click=${() => {
              this.showDeleteDialog = true;
            }}>🗑️ Delete</button>
            <button @click=${() => {
              this.showResetDbDialog = true;
            }}>♻️ Reset DB</button>
          </div>
        </div>

        <div class="grid">
          <div class="form-group" style="grid-column: span 2;">
            <label for="sc-name">Scenario Name</label>
            <input id="sc-name" type="text" .value=${this.scenario?.name || ""} />
          </div>
          <div class="form-group">
            <label for="sc-step">Default Step Resolution (s)</label>
            <input id="sc-step" type="number" .value=${String(this.scenario?.time?.defaultStepSeconds || 60)} />
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label for="sc-desc">Description & Experimental Hypothesis</label>
            <textarea id="sc-desc" rows="2">${this.scenario?.description || ""}</textarea>
          </div>
        </div>

        <div style="margin-top: 14px; display: flex; justify-content: flex-end;">
          <button class="primary" @click=${this.saveMetadata}>💾 Save Scenario Changes</button>
        </div>
      </div>

      <!-- Clone Dialog -->
      ${
        this.showCloneDialog
          ? html`
            <div class="dialog-overlay">
              <div class="dialog">
                <h3>Clone Experiment Scenario</h3>
                <p>Create an independent hypothesis branch preserving zones, profiles, and device bindings.</p>
                <div class="form-group">
                  <label>New Scenario Name</label>
                  <input
                    type="text"
                    .value=${this.cloneName}
                    @input=${(e: Event) => {
                      this.cloneName = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <div class="dialog-actions">
                  <button @click=${() => {
                    this.showCloneDialog = false;
                  }}>Cancel</button>
                  <button class="primary" @click=${this.confirmClone}>Clone</button>
                </div>
              </div>
            </div>
          `
          : ""
      }

      <!-- Delete Dialog -->
      ${
        this.showDeleteDialog
          ? html`
            <div class="dialog-overlay">
              <div class="dialog">
                <h3>Confirm Scenario Deletion</h3>
                <p>Are you sure you want to delete <strong>${this.scenario?.name}</strong>? This action cannot be undone.</p>
                <div class="dialog-actions">
                  <button @click=${() => {
                    this.showDeleteDialog = false;
                  }}>Cancel</button>
                  <button class="danger" @click=${this.confirmDelete}>Delete Scenario</button>
                </div>
              </div>
            </div>
          `
          : ""
      }

      <!-- Reset DB Dialog -->
      ${
        this.showResetDbDialog
          ? html`
            <div class="dialog-overlay">
              <div class="dialog">
                <h3>Reset Mock Lab Database</h3>
                <p>This will erase all custom scenarios, curves, and simulation history, and restore the initial authoritative seed data.</p>
                <div class="dialog-actions">
                  <button @click=${() => {
                    this.showResetDbDialog = false;
                  }}>Cancel</button>
                  <button class="danger" @click=${this.confirmResetDb}>Reset All Data</button>
                </div>
              </div>
            </div>
          `
          : ""
      }
    `;
  }
}
