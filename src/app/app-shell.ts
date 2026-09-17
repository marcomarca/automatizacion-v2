import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../components";
import "../views";
import { type AppRoute, router } from "./router";

@customElement("app-shell")
export class AppShell extends LitElement {
  @state() private currentRoute: AppRoute = router.getRoute();
  private unsubscribeRouter: (() => void) | null = null;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeRouter = router.subscribe((route) => {
      this.currentRoute = route;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeRouter) {
      this.unsubscribeRouter();
      this.unsubscribeRouter = null;
    }
  }

  private renderCurrentView() {
    switch (this.currentRoute.kind) {
      case "overview":
        return html`<overview-view></overview-view>`;

      case "spaces":
        return html`<spaces-view></spaces-view>`;

      case "space":
        return html`
          <space-view
            .spaceId=${this.currentRoute.spaceId}
            .section=${this.currentRoute.section || "overview"}
          ></space-view>
        `;

      case "system":
        switch (this.currentRoute.systemId) {
          case "lighting":
            return html`<systems-lighting-view></systems-lighting-view>`;
          case "climate":
            return html`<systems-climate-view></systems-climate-view>`;
          case "energy":
            return html`<systems-energy-view></systems-energy-view>`;
          case "automations":
            return html`<systems-automations-view></systems-automations-view>`;
          default:
            return html`<systems-lighting-view></systems-lighting-view>`;
        }

      case "operation":
        switch (this.currentRoute.operationId) {
          case "activity":
            return html`<operations-activity-view></operations-activity-view>`;
          case "notifications":
            return html`<operations-notifications-view></operations-notifications-view>`;
          case "calendar":
            return html`<operations-calendar-view></operations-calendar-view>`;
          case "recording":
            return html`<operations-recording-view></operations-recording-view>`;
          case "printing":
            return html`<operations-printing-view></operations-printing-view>`;
          default:
            return html`<operations-activity-view></operations-activity-view>`;
        }

      case "mock-lab":
        return html`<simulator-view></simulator-view>`;

      case "not-found":
        return html`
          <section>
            <h2>404 - Página no encontrada</h2>
            <p>La vista seleccionada no existe en el sistema.</p>
            <p><a href="#/overview">Volver a Resumen General</a></p>
          </section>
        `;

      default:
        return html`<overview-view></overview-view>`;
    }
  }

  render() {
    return html`
      <div class="app-container">
        <app-nav .currentRoute=${this.currentRoute}></app-nav>
        <div class="main-wrapper">
          <dashboard-header></dashboard-header>
          <main class="main-content">
            ${this.renderCurrentView()}
          </main>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-shell": AppShell;
  }
}
