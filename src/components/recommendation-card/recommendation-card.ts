import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("recommendation-card")
export class RecommendationCard extends LitElement {
  @property({ type: String }) title = "";
  @property({ type: String }) description = "";
  @property({ type: String }) actionLabel = "Accept";
  @property({ type: String }) skipLabel = "Dismiss";

  protected createRenderRoot() {
    return this;
  }

  private onAccept() {
    this.dispatchEvent(new CustomEvent("accept", { bubbles: true, composed: true }));
  }

  private onSkip() {
    this.dispatchEvent(new CustomEvent("skip", { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <article>
        <header>
          <span>[Recomendación]</span>
          <strong>${this.title}</strong>
        </header>
        <p>${this.description}</p>
        <div>
          <button type="button" @click=${this.onAccept}>${this.actionLabel}</button>
          <button type="button" @click=${this.onSkip}>${this.skipLabel}</button>
        </div>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "recommendation-card": RecommendationCard;
  }
}
