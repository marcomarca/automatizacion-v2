import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { SmartActivity } from "../../models";

@customElement("activity-item")
export class ActivityItem extends LitElement {
  @property({ type: Object }) activity!: SmartActivity;

  static styles = css`
    :host {
      display: block;
    }
    .activity-card {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 6px);
      padding: var(--spacing-3, 12px);
      margin-bottom: var(--spacing-2, 8px);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 8px);
    }
    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2, 8px);
    }
    .meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
    }
    .time {
      font-family: var(--font-family-mono, monospace);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-muted, #64748b);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      text-transform: capitalize;
    }
    .badge-lighting {
      background-color: var(--color-warning-subtle, #fffbeb);
      color: var(--color-warning, #d97706);
    }
    .badge-climate {
      background-color: var(--color-info-subtle, #f0f9ff);
      color: var(--color-info, #0284c7);
    }
    .badge-energy {
      background-color: var(--color-success-subtle, #f0fdf4);
      color: var(--color-success, #16a34a);
    }
    .badge-occupancy {
      background-color: var(--color-bg-surface-subtle, #f1f5f9);
      color: var(--color-text-secondary, #475569);
    }
    .badge-system {
      background-color: var(--color-bg-surface-subtle, #f1f5f9);
      color: var(--color-text-muted, #64748b);
    }
    .impact-badge {
      background-color: var(--color-success-subtle, #f0fdf4);
      color: var(--color-success, #16a34a);
      border: 1px solid var(--color-success, #16a34a);
      font-weight: var(--font-weight-semibold, 600);
    }
    .title {
      font-size: var(--font-size-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
    }
    .details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary, #475569);
    }
    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-1, 4px);
    }
    .detail-label {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-muted, #64748b);
      min-width: 50px;
    }
  `;

  render() {
    if (!this.activity) return html``;

    const { timestamp, category, title, reason, action, impact } = this.activity;

    return html`
      <div class="activity-card">
        <div class="top-row">
          <div class="meta">
            <span class="time">${timestamp}</span>
            <span class="badge badge-${category}">${category}</span>
          </div>
          ${
            impact?.wattsSaved
              ? html`<span class="badge impact-badge">⚡ -${impact.wattsSaved}W</span>`
              : ""
          }
        </div>

        <div class="title">${title}</div>

        <div class="details">
          <div class="detail-item">
            <span class="detail-label">Reason:</span>
            <span>${reason}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Action:</span>
            <span>${action}</span>
          </div>
        </div>
      </div>
    `;
  }
}
