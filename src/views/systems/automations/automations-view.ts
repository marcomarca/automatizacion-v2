import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { MockAutomation } from "../../../models/automation";
import { automationStore } from "../../../stores/automation.store";

@customElement("systems-automations-view")
export class SystemsAutomationsView extends LitElement {
  @state() private automations: MockAutomation[] = automationStore.getAll();
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.automations = automationStore.getAll();
    this.unsubscribe = automationStore.subscribe(() => {
      this.automations = automationStore.getAll();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private handleToggle(id: string) {
    automationStore.toggle(id);
  }

  private handleRun(id: string) {
    automationStore.run(id);
  }

  render() {
    return html`
      <section>
        <header>
          <h1>Sistema de Automatizaciones</h1>
          <p>Reglas autónomas, disparadores de horario, ocupación y cosechas de luz.</p>
        </header>

        <ul>
          ${this.automations.map(
            (auto) => html`
              <li>
                <article>
                  <header>
                    <h3>${auto.name}</h3>
                    <p>${auto.description || ""}</p>
                  </header>

                  <div>
                    <p>
                      <strong>Estado:</strong>
                      <span>${auto.enabled ? "HABILITADA" : "DESHABILITADA"}</span>
                      | <strong>Disparador:</strong> ${auto.trigger.description || auto.trigger.type}
                      ${auto.lastTriggeredAt ? html`| <em>Última vez: ${auto.lastTriggeredAt}</em>` : ""}
                    </p>

                    <div>
                      <button
                        type="button"
                        @click=${() => this.handleToggle(auto.id)}
                      >
                        ${auto.enabled ? "Deshabilitar" : "Habilitar"}
                      </button>

                      <button
                        type="button"
                        @click=${() => this.handleRun(auto.id)}
                      >
                        Ejecutar Ahora
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            `,
          )}
        </ul>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "systems-automations-view": SystemsAutomationsView;
  }
}
