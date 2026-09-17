import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { AppRoute } from "../../app/routes";

@customElement("app-nav")
export class AppNav extends LitElement {
  @property({ type: Object }) currentRoute: AppRoute = { kind: "overview" };

  protected createRenderRoot() {
    return this;
  }

  render() {
    const route = this.currentRoute;

    return html`
      <nav aria-label="Navegación Principal">
        <h2>Witmind</h2>
        <p>
          <a href="#/overview">
            ${route.kind === "overview" ? html`<strong>[ Inicio ]</strong>` : "Inicio"}
          </a>
        </p>

        <details open>
          <summary><strong>Espacios</strong></summary>
          <ul>
            <li>
              <a href="#/spaces/showroom">
                ${route.kind === "space" && route.spaceId === "showroom" ? html`<strong>[ Showroom ]</strong>` : "Showroom"}
              </a>
            </li>
            <li>
              <a href="#/spaces/lobby">
                ${route.kind === "space" && route.spaceId === "lobby" ? html`<strong>[ Lobby ]</strong>` : "Lobby"}
              </a>
            </li>
            <li>
              <a href="#/spaces/offices">
                ${route.kind === "space" && route.spaceId === "offices" ? html`<strong>[ Oficinas ]</strong>` : "Oficinas"}
              </a>
            </li>
            <li>
              <a href="#/spaces">
                <small>Ver todos los espacios →</small>
              </a>
            </li>
          </ul>
        </details>

        <details open>
          <summary><strong>Sistemas</strong></summary>
          <ul>
            <li>
              <a href="#/systems/lighting">
                ${route.kind === "system" && route.systemId === "lighting" ? html`<strong>[ Iluminación ]</strong>` : "Iluminación"}
              </a>
            </li>
            <li>
              <a href="#/systems/climate">
                ${route.kind === "system" && route.systemId === "climate" ? html`<strong>[ Climatización ]</strong>` : "Climatización"}
              </a>
            </li>
            <li>
              <a href="#/systems/energy">
                ${route.kind === "system" && route.systemId === "energy" ? html`<strong>[ Energía ]</strong>` : "Energía"}
              </a>
            </li>
            <li>
              <a href="#/systems/automations">
                ${route.kind === "system" && route.systemId === "automations" ? html`<strong>[ Automatizaciones ]</strong>` : "Automatizaciones"}
              </a>
            </li>
          </ul>
        </details>

        <details open>
          <summary><strong>Operación</strong></summary>
          <ul>
            <li>
              <a href="#/operations/activity">
                ${route.kind === "operation" && route.operationId === "activity" ? html`<strong>[ Actividad ]</strong>` : "Actividad"}
              </a>
            </li>
            <li>
              <a href="#/operations/notifications">
                ${route.kind === "operation" && route.operationId === "notifications" ? html`<strong>[ Notificaciones ]</strong>` : "Notificaciones"}
              </a>
            </li>
            <li>
              <a href="#/operations/calendar">
                ${route.kind === "operation" && route.operationId === "calendar" ? html`<strong>[ Calendario ]</strong>` : "Calendario"}
              </a>
            </li>
            <li>
              <a href="#/operations/recording">
                ${route.kind === "operation" && route.operationId === "recording" ? html`<strong>[ Grabación ]</strong>` : "Grabación"}
              </a>
            </li>
            <li>
              <a href="#/operations/printing">
                ${route.kind === "operation" && route.operationId === "printing" ? html`<strong>[ Impresiones ]</strong>` : "Impresiones"}
              </a>
            </li>
          </ul>
        </details>

        <details open>
          <summary><strong>Versiones Dashboard (HTML)</strong></summary>
          <ul>
            <li>
              <a href="/dashboard-bms.html">
                <span>🌌 BMS Dark Command ↗</span>
              </a>
            </li>
            <li>
              <a href="/showroom.html">
                <span>🎛️ Lovelace HA Panel ↗</span>
              </a>
            </li>
            <li>
              <a href="/dashboard-matrix.html">
                <span>📟 SCADA Matrix HUD ↗</span>
              </a>
            </li>
            <li>
              <a href="/dashboard-exec.html">
                <span>☀️ Executive Light ↗</span>
              </a>
            </li>
          </ul>
        </details>

        <p>
          <a href="#/mock-lab">
            ${route.kind === "mock-lab" ? html`<strong>[ 🧪 Mock Lab ]</strong>` : "🧪 Mock Lab"}
          </a>
        </p>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-nav": AppNav;
  }
}
