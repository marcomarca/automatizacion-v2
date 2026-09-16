import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("metric-card")
export class MetricCard extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) value = "";
  @property({ type: String }) unit = "";
  @property({ type: String }) trend = "";
  @property({ type: Boolean }) trendPositive = true;
  @property({ type: String }) subtext = "";

  static styles = css`
    :host {
      display: block;
    }
    .metric-card {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-4, 16px);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .label {
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--spacing-2, 8px);
    }
    .value-row {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-1, 4px);
      margin-bottom: var(--spacing-2, 8px);
    }
    .value {
      font-size: var(--font-size-3xl, 30px);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-primary, #0f172a);
      line-height: 1;
    }
    .unit {
      font-size: var(--font-size-base, 16px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #475569);
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      font-size: var(--font-size-xs, 12px);
    }
    .trend {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px 6px;
      border-radius: var(--radius-full, 9999px);
      font-weight: var(--font-weight-semibold, 600);
    }
    .trend-positive {
      background-color: var(--color-success-subtle, #f0fdf4);
      color: var(--color-success, #16a34a);
    }
    .trend-neutral {
      background-color: var(--color-info-subtle, #f0f9ff);
      color: var(--color-info, #0284c7);
    }
    .subtext {
      color: var(--color-text-muted, #64748b);
    }
  `;

  render() {
    return html`
      <div class="metric-card">
        <div class="label">${this.label}</div>
        <div class="value-row">
          <span class="value">${this.value}</span>
          ${this.unit ? html`<span class="unit">${this.unit}</span>` : ""}
        </div>
        <div class="footer">
          ${
            this.trend
              ? html`<span class="trend ${this.trendPositive ? "trend-positive" : "trend-neutral"}">${this.trend}</span>`
              : ""
          }
          ${this.subtext ? html`<span class="subtext">${this.subtext}</span>` : ""}
        </div>
      </div>
    `;
  }
}
