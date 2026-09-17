import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { DeviceProfile, ScenarioDefinition, SourceReference } from "../../models/scenario";
import { simulationConfigStore } from "../../stores/simulation-config.store";

@customElement("mock-lab-devices-manager")
export class MockLabDevicesManager extends LitElement {
  @property({ type: Object }) scenario: ScenarioDefinition | null = null;
  @state() private devices: DeviceProfile[] = [];
  @state() private sources: SourceReference[] = [];

  protected createRenderRoot() {
    return this;
  }

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
