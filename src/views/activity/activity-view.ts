import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components";
import type { ActivityCategory, SmartActivity } from "../../models";
import { ActivityStore, demoStore } from "../../stores";

@customElement("activity-view")
export class ActivityView extends LitElement {
  @state() private currentFilter: "all" | ActivityCategory = "all";
  @state() private activities: SmartActivity[] = ActivityStore.getActivities("all");

  private unsubscribeStore: (() => void) | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6, 24px);
      width: 100%;
    }
    .header-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 12px);
    }
    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-2, 8px);
    }
    .page-title {
      font-size: var(--font-size-xl, 20px);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-primary, #0f172a);
    }
    .page-desc {
      font-size: var(--font-size-sm, 14px);
      color: var(--color-text-secondary, #475569);
    }
    .filters-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
      flex-wrap: wrap;
    }
    .filter-btn {
      min-height: var(--touch-target-min, 44px);
      padding: 0 var(--spacing-4, 16px);
      border-radius: var(--radius-full, 9999px);
      border: 1px solid var(--color-border, #e2e8f0);
      background-color: var(--color-bg-surface, #ffffff);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #475569);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast, 150ms);
    }
    .filter-btn:hover {
      background-color: var(--color-bg-surface-hover, #e2e8f0);
      color: var(--color-text-primary, #0f172a);
    }
    .filter-btn.active {
      background-color: var(--color-primary, #2563eb);
      color: #ffffff;
      border-color: var(--color-primary, #2563eb);
      font-weight: var(--font-weight-semibold, 600);
    }
    .feed-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 8px);
    }
    .empty-state {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px dashed var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-8, 32px);
      text-align: center;
      color: var(--color-text-muted, #64748b);
      font-size: var(--font-size-sm, 14px);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeStore = demoStore.subscribe(() => {
      this.activities = ActivityStore.getActivities(this.currentFilter);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
  }

  private setFilter(filter: "all" | ActivityCategory) {
    this.currentFilter = filter;
    this.activities = ActivityStore.getActivities(filter);
  }

  render() {
    const filters: Array<{ id: "all" | ActivityCategory; label: string }> = [
      { id: "all", label: "All Events" },
      { id: "lighting", label: "Lighting" },
      { id: "climate", label: "Climate" },
      { id: "energy", label: "Energy" },
      { id: "occupancy", label: "Occupancy" },
      { id: "system", label: "System" },
    ];

    return html`
      <div class="header-section">
        <div class="title-row">
          <div>
            <h1 class="page-title">Smart Activity & Explainability Feed</h1>
            <p class="page-desc">
              Audit trail of every autonomous decision made by Witmind: observing context, executing actions, and quantifying impact.
            </p>
          </div>
        </div>

        <div class="filters-row">
          ${filters.map(
            (f) => html`
              <button
                class="filter-btn ${this.currentFilter === f.id ? "active" : ""}"
                @click=${() => this.setFilter(f.id)}
              >
                ${f.label}
              </button>
            `,
          )}
        </div>
      </div>

      <div class="feed-container">
        ${
          this.activities.length === 0
            ? html`<div class="empty-state">No activities recorded under category '${this.currentFilter}'.</div>`
            : this.activities.map((act) => html`<activity-item .activity=${act}></activity-item>`)
        }
      </div>
    `;
  }
}
