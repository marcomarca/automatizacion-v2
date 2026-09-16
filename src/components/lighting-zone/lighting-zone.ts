import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Zone } from "../../models";

@customElement("lighting-zone")
export class LightingZone extends LitElement {
  @property({ type: Object }) zone!: Zone;

  static styles = css`
    :host {
      display: block;
    }
    .lighting-card {
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
      background-color: var(--color-primary-subtle, #eff6ff);
      color: var(--color-primary, #2563eb);
      border: 1px solid var(--color-primary, #2563eb);
    }
    .badge-manual {
      background-color: var(--color-warning-subtle, #fffbeb);
      color: var(--color-warning, #d97706);
      border: 1px solid var(--color-warning, #d97706);
    }
    .badge-compliant {
      background-color: var(--color-success-subtle, #f0fdf4);
      color: var(--color-success, #16a34a);
    }
    .badge-non-compliant {
      background-color: var(--color-danger-subtle, #fef2f2);
      color: var(--color-danger, #dc2626);
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
    .slider-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 8px);
    }
    .slider-label-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-medium, 500);
    }
    .slider {
      width: 100%;
      height: 8px;
      border-radius: var(--radius-full, 9999px);
      accent-color: var(--color-primary, #2563eb);
      cursor: pointer;
    }
    .power-comparison {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: var(--spacing-2, 8px);
      border-top: 1px solid var(--color-border, #e2e8f0);
      font-size: var(--font-size-xs, 12px);
    }
    .saved-watts {
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-success, #16a34a);
    }
  `;

  private onBrightnessChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const brightness = Number(input.value);
    this.dispatchEvent(
      new CustomEvent("brightness-change", {
        detail: { zoneId: this.zone.id, brightness },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private toggleMode() {
    if (!this.zone.lighting) return;
    const newMode = this.zone.lighting.mode === "auto" ? "manual" : "auto";
    this.dispatchEvent(
      new CustomEvent("mode-change", {
        detail: { zoneId: this.zone.id, mode: newMode },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (!this.zone || !this.zone.lighting) return html``;

    const { name, type, occupancy, lighting } = this.zone;
    const savedWatts = Math.max(0, lighting.baselinePowerW - lighting.actualPowerW);

    return html`
      <div class="lighting-card">
        <div class="header">
          <div class="zone-info">
            <span class="name">${name}</span>
            <span class="type">${type} &bull; ${occupancy.occupied ? "Occupied" : `Vacant (${occupancy.absenceMinutes}m)`}</span>
          </div>
          <div class="badges">
            <button class="badge badge-${lighting.mode}" @click=${this.toggleMode}>
              Mode: ${lighting.mode.toUpperCase()}
            </button>
            <span class="badge ${lighting.withinTarget ? "badge-compliant" : "badge-non-compliant"}">
              ${lighting.withinTarget ? "Target Met" : "Adjusting"}
            </span>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-col">
            <span class="metric-label">Daylight</span>
            <span class="metric-val">${lighting.daylightLux} lx</span>
            <span class="metric-sub">Solar input</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">Target Lux</span>
            <span class="metric-val">${lighting.targetLux} lx</span>
            <span class="metric-sub">Total: ${lighting.currentLux} lx</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">Power Draw</span>
            <span class="metric-val">${lighting.actualPowerW} W</span>
            <span class="metric-sub">Nom: ${lighting.nominalPowerW} W</span>
          </div>
        </div>

        <div class="slider-section">
          <div class="slider-label-row">
            <span>Dimming Level (${lighting.mode})</span>
            <span><strong>${lighting.brightness}%</strong></span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            .value=${lighting.brightness}
            class="slider"
            @input=${this.onBrightnessChange}
            aria-label="Dimming level for ${name}"
          />
        </div>

        <div class="power-comparison">
          <span>Baseline: ${lighting.baselinePowerW}W &rarr; Actual: ${lighting.actualPowerW}W</span>
          <span class="saved-watts">⚡ -${savedWatts}W Saved</span>
        </div>
      </div>
    `;
  }
}
