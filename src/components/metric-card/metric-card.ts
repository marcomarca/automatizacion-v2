import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("metric-card")
export class MetricCard extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) value = "";
  @property({ type: String }) unit = "";
  @property({ type: String }) trend = "";
  @property({ type: Boolean }) trendPositive = true;
  @property({ type: String }) subtext = "";

  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <article>
        <h4>${this.label}</h4>
        <p>
          <strong>${this.value}</strong>
          ${this.unit ? html`<span>${this.unit}</span>` : ""}
        </p>
        <footer>
          ${this.trend ? html`<span>${this.trend}</span>` : ""}
          ${this.subtext ? html`<small>${this.subtext}</small>` : ""}
        </footer>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "metric-card": MetricCard;
  }
}
