import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("recommendation-card")
export class RecommendationCard extends LitElement {
  @property({ type: String }) title = "";
  @property({ type: String }) description = "";
  @property({ type: String }) actionLabel = "Accept";
  @property({ type: String }) skipLabel = "Dismiss";

  static styles = css`
    :host {
      display: block;
    }
    .recommendation-card {
      background-color: var(--color-primary-subtle, #eff6ff);
      border: 1px solid var(--color-primary, #2563eb);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-4, 16px);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 12px);
    }
    .header {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
    }
    .badge {
      background-color: var(--color-primary, #2563eb);
      color: #ffffff;
      padding: 2px 6px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-bold, 700);
      text-transform: uppercase;
    }
    .title {
      font-size: var(--font-size-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
    }
    .description {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary, #475569);
      line-height: var(--line-height-normal, 1.5);
    }
    .actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
      margin-top: var(--spacing-1, 4px);
    }
    .btn {
      min-height: var(--touch-target-min, 44px);
      padding: 0 var(--spacing-4, 16px);
      border-radius: var(--radius-md, 6px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-semibold, 600);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color var(--transition-fast, 150ms);
    }
    .btn-primary {
      background-color: var(--color-primary, #2563eb);
      color: #ffffff;
      border: 1px solid var(--color-primary, #2563eb);
    }
    .btn-primary:hover {
      background-color: var(--color-primary-hover, #1d4ed8);
    }
    .btn-secondary {
      background-color: transparent;
      color: var(--color-text-secondary, #475569);
      border: 1px solid var(--color-border, #e2e8f0);
    }
    .btn-secondary:hover {
      background-color: var(--color-bg-surface-hover, #e2e8f0);
    }
  `;

  private onAccept() {
    this.dispatchEvent(new CustomEvent("accept", { bubbles: true, composed: true }));
  }

  private onSkip() {
    this.dispatchEvent(new CustomEvent("skip", { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="recommendation-card">
        <div class="header">
          <span class="badge">Recommendation</span>
          <span class="title">${this.title}</span>
        </div>
        <div class="description">${this.description}</div>
        <div class="actions">
          <button class="btn btn-primary" @click=${this.onAccept}>${this.actionLabel}</button>
          <button class="btn btn-secondary" @click=${this.onSkip}>${this.skipLabel}</button>
        </div>
      </div>
    `;
  }
}
