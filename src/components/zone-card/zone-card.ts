import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Zone } from "../../models";

@customElement("zone-card")
export class ZoneCard extends LitElement {
  @property({ type: Object }) zone!: Zone;

  static styles = css`
    :host {
      display: block;
    }
    .zone-card {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-4, 16px);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 12px);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .name {
      font-size: var(--font-size-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
    }
    .badge {
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
    }
    .badge-occupied {
      background-color: var(--color-success-subtle, #f0fdf4);
      color: var(--color-success, #16a34a);
      border: 1px solid var(--color-success, #16a34a);
    }
    .badge-vacant {
      background-color: var(--color-bg-surface-subtle, #f1f5f9);
      color: var(--color-text-muted, #64748b);
      border: 1px solid var(--color-border, #e2e8f0);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-2, 8px);
      background-color: var(--color-bg-surface-subtle, #f1f5f9);
      padding: var(--spacing-2, 8px) var(--spacing-3, 12px);
      border-radius: var(--radius-md, 6px);
    }
    .stat-item {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-muted, #64748b);
    }
    .stat-value {
      font-size: var(--font-size-sm, 14px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
    }
  `;

  render() {
    if (!this.zone) return html``;

    const { name, occupancy, lighting, climate } = this.zone;

    return html`
      <div class="zone-card">
        <div class="header">
          <span class="name">${name}</span>
          <span class="badge ${occupancy.occupied ? "badge-occupied" : "badge-vacant"}">
            ${occupancy.occupied ? "Occupied" : `Vacant (${occupancy.absenceMinutes}m)`}
          </span>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Lighting</span>
            <span class="stat-value">
              ${lighting ? `${lighting.brightness}% (${lighting.actualPowerW}W)` : "N/A"}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Daylight Lux</span>
            <span class="stat-value">${lighting ? `${lighting.daylightLux} lx` : "N/A"}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Temperature</span>
            <span class="stat-value">${climate ? `${climate.currentTemperature}°C` : "N/A"}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Target Range</span>
            <span class="stat-value">
              ${climate ? `${climate.minComfortTemperature}-${climate.maxComfortTemperature}°C` : "N/A"}
            </span>
          </div>
        </div>
      </div>
    `;
  }
}
