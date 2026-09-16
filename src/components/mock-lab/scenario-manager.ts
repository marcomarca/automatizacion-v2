import { LitElement, css, html } from "lit";
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
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
      margin: 0;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    select, input, textarea {
      padding: 8px 12px;
      border: 1px solid var(--color-border, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      font-family: inherit;
      font-size: 14px;
      background: var(--color-bg-surface, #ffffff);
    }
    select {
      font-weight: 600;
      color: var(--color-text-primary, #0f172a);
    }
    button {
      padding: 8px 14px;
      border-radius: var(--radius-md, 6px);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--color-border, #cbd5e1);
      background: var(--color-bg-surface, #ffffff);
      color: var(--color-text-primary, #0f172a);
      transition: all 150ms ease;
    }
    button:hover {
      background: var(--color-bg-surface-hover, #f1f5f9);
    }
    button.primary {
      background: var(--color-primary, #2563eb);
      color: #ffffff;
      border-color: var(--color-primary, #2563eb);
    }
    button.primary:hover {
      background: #1d4ed8;
    }
    button.danger {
      background: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }
    button.danger:hover {
      background: #dc2626;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 14px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .meta-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      background: var(--color-bg-subtle, #f8fafc);
      border-radius: 4px;
      font-size: 12px;
      color: var(--color-text-secondary, #64748b);
      margin-right: 8px;
    }
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .dialog {
      background: #ffffff;
      padding: 24px;
      border-radius: 12px;
      max-width: 440px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    .dialog h3 {
      margin-top: 0;
      font-size: 18px;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `;

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
