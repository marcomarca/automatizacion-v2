import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { calculateBuildingDevicePower } from "../../services/energy.service";
import {
  type AppearanceMode,
  AppearanceStore,
  EnergyStore,
  demoStore,
  deviceStore,
} from "../../stores";

@customElement("dashboard-header")
export class DashboardHeader extends LitElement {
  @state() private mode: AppearanceMode = AppearanceStore.getMode();
  @state() private density = AppearanceStore.getDensity();
  @state() private energy = EnergyStore.getOverview();
  @state() private clockTime = demoStore.getClockTime();

  private unsubscribeAppearance: (() => void) | null = null;
  private unsubscribeDemo: (() => void) | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeAppearance = AppearanceStore.subscribe(() => {
      this.mode = AppearanceStore.getMode();
      this.density = AppearanceStore.getDensity();
    });

    this.unsubscribeDemo = demoStore.subscribe(() => {
      this.energy = EnergyStore.getOverview();
      this.clockTime = demoStore.getClockTime();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeAppearance?.();
    this.unsubscribeDemo?.();
  }

  private handleSetMode(m: AppearanceMode) {
    AppearanceStore.setMode(m);
  }

  private handleToggleDensity() {
    AppearanceStore.toggleDensity();
  }

  render() {
    const devices = deviceStore.getAll();
    const showroomDevices = deviceStore.getBySpace("showroom");
    const summary = calculateBuildingDevicePower(devices);
    const showroomActive = showroomDevices.filter((d) => d.powerState === "on").length;

    const modes: { id: AppearanceMode; label: string; icon: string; desc: string }[] = [
      { id: "bms-dark", label: "BMS Dark", icon: "🌌", desc: "Consola de comando oscura" },
      { id: "ha-lovelace", label: "Lovelace HA", icon: "🏠", desc: "Panel táctil Home Assistant" },
      {
        id: "cyber-matrix",
        label: "SCADA Matrix",
        icon: "📟",
        desc: "Terminal SCADA de alta densidad",
      },
      { id: "clean-light", label: "Light Exec", icon: "☀️", desc: "Dashboard corporativo claro" },
    ];

    return html`
      <header class="dashboard-topbar">
        <div class="dashboard-topbar-left">
          <div class="status-indicator-pill">
            <span class="status-pulse-dot"></span>
            <span class="status-indicator-text">BMS EN VIVO</span>
          </div>
          <div class="telemetry-ticker">
            <div class="telemetry-chip" title="Potencia eléctrica activa vs instalada">
              <span class="chip-label">POTENCIA</span>
              <span class="chip-value">${summary.currentPowerW} <small>W</small></span>
              <span class="chip-sub">/ ${summary.nominalPowerW}W</span>
            </div>
            <div class="telemetry-chip" title="Ahorro energético en tiempo real">
              <span class="chip-label">AHORRO</span>
              <span class="chip-value highlight">${this.energy.savingsPercent}%</span>
              <span class="chip-sub">${this.energy.energySavedKwh} kWh</span>
            </div>
            <div class="telemetry-chip" title="Luminarias activas en showroom">
              <span class="chip-label">SHOWROOM</span>
              <span class="chip-value">${showroomActive}/${showroomDevices.length}</span>
              <span class="chip-sub">ON</span>
            </div>
            <div class="telemetry-chip" title="Hora de simulación">
              <span class="chip-label">RELOJ</span>
              <span class="chip-value mono">${this.clockTime}</span>
            </div>
          </div>
        </div>

        <div class="dashboard-topbar-right">
          <!-- Switcher de Versiones de Apariencia -->
          <div class="appearance-switcher-group" role="group" aria-label="Versiones de Apariencia">
            <span class="switcher-label">VISTA:</span>
            ${modes.map(
              (m) => html`
                <button
                  type="button"
                  class="appearance-pill-btn ${this.mode === m.id ? "active" : ""}"
                  @click=${() => this.handleSetMode(m.id)}
                  title="${m.desc}"
                >
                  <span class="pill-icon">${m.icon}</span>
                  <span class="pill-text">${m.label}</span>
                </button>
              `,
            )}
          </div>

          <!-- Toggle de Densidad -->
          <button
            type="button"
            class="density-toggle-btn ${this.density === "compact" ? "active" : ""}"
            @click=${this.handleToggleDensity}
            title="Alternar densidad de información (${this.density === "compact" ? "Compacto" : "Normal"})"
          >
            ${this.density === "compact" ? "🗜️ Compacto" : "📐 Normal"}
          </button>

          <!-- Acceso rápido a Réplica Showroom -->
          <a
            href="/showroom.html"
            target="_blank"
            class="showroom-link-btn"
            title="Abrir panel aislado de Home Assistant para pruebas"
          >
            <span>🎛️ Panel HA ↗</span>
          </a>
        </div>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dashboard-header": DashboardHeader;
  }
}
