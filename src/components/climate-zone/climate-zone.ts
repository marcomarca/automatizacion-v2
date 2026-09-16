import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Zone } from "../../models";

@customElement("climate-zone")
export class ClimateZone extends LitElement {
  @property({ type: Object }) zone!: Zone;

  static styles = css`
    :host {
      display: block;
    }
    .climate-card {
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-4, 16px);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4, 16px);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-2, 8px);
    }
    .zone-info {
      display: flex;
      flex-direction: column;
    }
    .name {
      font-size: var(--font-size-base, 16px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-primary, #0f172a);
    }
    .type {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-muted, #64748b);
      text-transform: capitalize;
    }
    .badges {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
    }
    .badge {
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
    }
    .badge-auto {
      background-color: var(--color-info-subtle, #f0f9ff);
      color: var(--color-info, #0284c7);
      border: 1px solid var(--color-info, #0284c7);
    }
    .badge-compliant {
      background-color: var(--color-success-subtle, #f0fdf4);
      color: var(--color-success, #16a34a);
    }
    .badge-non-compliant {
      background-color: var(--color-warning-subtle, #fffbeb);
      color: var(--color-warning, #d97706);
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-3, 12px);
      background-color: var(--color-bg-surface-subtle, #f1f5f9);
      padding: var(--spacing-3, 12px);
      border-radius: var(--radius-md, 6px);
    }
    .metric-col {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-muted, #64748b);
      margin-bottom: 2px;
    }
    .metric-val {
      font-size: var(--font-size-base, 16px);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-primary, #0f172a);
    }
    .metric-sub {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary, #475569);
    }
    .comfort-bar-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 4px);
    }
    .comfort-labels {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary, #475569);
    }
    .comfort-progress-bg {
      height: 8px;
      background-color: var(--color-border, #e2e8f0);
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
    }
    .comfort-progress-fill {
      height: 100%;
      background-color: var(--color-success, #16a34a);
      border-radius: var(--radius-full, 9999px);
      transition: width var(--transition-base, 200ms);
    }
  `;

  render() {
    if (!this.zone || !this.zone.climate) return html``;

    const { name, type, occupancy, climate } = this.zone;

    return html`
      <div class="climate-card">
        <div class="header">
          <div class="zone-info">
            <span class="name">${name}</span>
            <span class="type">${type} &bull; ${occupancy.occupied ? "Occupied" : `Vacant (${occupancy.absenceMinutes}m)`}</span>
          </div>
          <div class="badges">
            <span class="badge badge-auto">Mode: ${climate.mode.toUpperCase()}</span>
            <span class="badge ${climate.withinTarget ? "badge-compliant" : "badge-non-compliant"}">
              ${climate.withinTarget ? "In Comfort Band" : "Outside Band"}
            </span>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-col">
            <span class="metric-label">Current Temp</span>
            <span class="metric-val">${climate.currentTemperature}°C</span>
            <span class="metric-sub">Sensor reading</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">Target Setpoint</span>
            <span class="metric-val">${climate.targetTemperature}°C</span>
            <span class="metric-sub">Range: ${climate.minComfortTemperature}-${climate.maxComfortTemperature}°C</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">In-Target Ratio</span>
            <span class="metric-val">${climate.timeWithinTargetPercent}%</span>
            <span class="metric-sub">Occupied hours</span>
          </div>
        </div>

        <div class="comfort-bar-wrapper">
          <div class="comfort-labels">
            <span>Thermal Compliance Today</span>
            <span><strong>${climate.timeWithinTargetPercent}%</strong></span>
          </div>
          <div class="comfort-progress-bg">
            <div
              class="comfort-progress-fill"
              style="width: ${climate.timeWithinTargetPercent}%;"
            ></div>
          </div>
        </div>
      </div>
    `;
  }
}
