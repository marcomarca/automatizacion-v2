import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("status-card")
export class StatusCard extends LitElement {
  @property({ type: String }) statusText = "System Operational";
  @property({ type: String }) scenarioName = "Normal Day";
  @property({ type: String }) virtualTime = "14:00";
  @property({ type: Boolean }) isDemo = true;

  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <header>
        <div>
          <strong>${this.statusText}</strong>
          <span>Escenario: ${this.scenarioName}</span>
        </div>
        <div>
          <span>⏱ ${this.virtualTime}</span>
          ${this.isDemo ? html`<span> [MODO DEMO]</span>` : ""}
        </div>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "status-card": StatusCard;
  }
}
