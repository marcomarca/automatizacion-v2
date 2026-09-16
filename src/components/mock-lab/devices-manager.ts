import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { DeviceProfile, ScenarioDefinition, SourceReference } from "../../models/scenario";
import { simulationConfigStore } from "../../stores/simulation-config.store";

@customElement("mock-lab-devices-manager")
export class MockLabDevicesManager extends LitElement {
  @property({ type: Object }) scenario: ScenarioDefinition | null = null;
  @state() private devices: DeviceProfile[] = [];
  @state() private sources: SourceReference[] = [];

  static styles = css`
    :host {
      display: block;
    }
    .card {
      background: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: var(--spacing-5, 20px);
      box-shadow: var(--shadow-sm);
    }
    .header {
      margin-bottom: 16px;
    }
    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
      margin: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
    .device-card {
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 8px;
      padding: 14px;
      background: var(--color-bg-subtle, #f8fafc);
    }
    .device-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .spec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 8px;
    }
    .spec-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .spec-label {
      color: #64748b;
      font-weight: 600;
      width: 45%;
    }
    .spec-val {
      color: #0f172a;
      font-family: monospace;
    }
    .badge {
      display: inline-flex;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      background: #eff6ff;
      color: #2563eb;
    }
    table.bindings-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 10px;
    }
    table.bindings-table th, table.bindings-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    table.bindings-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #64748b;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.refresh();
  }

  private refresh() {
    this.devices = simulationConfigStore.getDevices();
    this.sources = simulationConfigStore.getSources();
  }

  render() {
    const bindings = this.scenario?.deviceBindings || [];

    return html`
      <div class="card">
        <div class="header">
          <h3 class="title">💡 Hardware Profiles & Scenario Device Bindings</h3>
          <span style="font-size: 12px; color: var(--color-text-secondary, #64748b);">
            Configured electrical and optical specifications for LED panels, drivers, and sensors.
          </span>
        </div>

        <h4 style="margin: 16px 0 6px 0; font-size: 14px;">Active Scenario Bindings</h4>
        ${
          bindings.length > 0
            ? html`
              <table class="bindings-table">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Role</th>
                    <th>Device Profile</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${bindings.map((b) => {
                    const dev = this.devices.find((d) => d.id === b.deviceProfileId);
                    const zone = this.scenario?.zones.find((z) => z.id === b.zoneId);
                    return html`
                      <tr>
                        <td><strong>${zone?.name || b.zoneId}</strong></td>
                        <td>${b.role}</td>
                        <td>${dev?.name || b.deviceProfileId}</td>
                        <td><span class="badge">${b.quantity}x</span></td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            `
            : html`<div style="font-size: 13px; color: #94a3b8; margin: 10px 0;">This scenario uses legacy aggregate zone wattage.</div>`
        }

        <h4 style="margin: 24px 0 6px 0; font-size: 14px;">Authoritative Hardware Specifications Catalog</h4>
        <div class="grid">
          ${this.devices.map((dev) => {
            const source = this.sources.find((s) => s.id === dev.sourceReferenceId);
            return html`
              <div class="device-card">
                <div class="device-title">
                  <span>${dev.name}</span>
                  <span class="badge">${dev.deviceType}</span>
                </div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
                  Manufacturer: <strong>${dev.manufacturer || "N/A"}</strong> | Model: <strong>${dev.model || "N/A"}</strong>
                </div>
                ${source ? html`<div style="font-size: 11px; color: #2563eb; margin-bottom: 6px;">📄 Reference: ${source.title}</div>` : ""}

                <table class="spec-table">
                  <tbody>
                    ${Object.entries(dev.config || {}).map(
                      ([k, v]) => html`
                        <tr>
                          <td class="spec-label">${k}</td>
                          <td class="spec-val">${String(v)}</td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}
