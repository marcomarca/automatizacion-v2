import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("status-card")
export class StatusCard extends LitElement {
  @property({ type: String }) statusText = "System Operational";
  @property({ type: String }) scenarioName = "Normal Day";
  @property({ type: String }) virtualTime = "14:00";
  @property({ type: Boolean }) isDemo = true;

  static styles = css`
    :host {
      display: block;
    }
    .status-card {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3, 12px);
    }
    .left-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 12px);
    }
    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--color-success, #16a34a);
      box-shadow: 0 0 0 3px var(--color-success-subtle, #f0fdf4);
    }
    .status-info {
      display: flex;
      flex-direction: column;
    }
    .status-title {
      font-size: var(--font-size-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
    }
    .status-sub {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-muted, #64748b);
    }
    .right-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-bold, 700);
      letter-spacing: 0.05em;
    }
    .badge-demo {
      background-color: var(--color-warning-subtle, #fffbeb);
      color: var(--color-warning, #d97706);
      border: 1px solid var(--color-warning, #d97706);
    }
    .clock-badge {
      background-color: var(--color-bg-surface-subtle, #f1f5f9);
      color: var(--color-text-secondary, #475569);
      border: 1px solid var(--color-border, #e2e8f0);
      font-family: var(--font-family-mono, monospace);
    }
  `;

  render() {
    return html`
      <div class="status-card">
        <div class="left-section">
          <div class="status-indicator"></div>
          <div class="status-info">
            <span class="status-title">${this.statusText}</span>
            <span class="status-sub">Scenario: ${this.scenarioName}</span>
          </div>
        </div>
        <div class="right-section">
          <span class="badge clock-badge">⏱ ${this.virtualTime}</span>
          ${this.isDemo ? html`<span class="badge badge-demo">DEMO MODE</span>` : ""}
        </div>
      </div>
    `;
  }
}
