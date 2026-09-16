import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../components";
import "../views";
import { type AppRoute, router } from "./router";

@customElement("app-shell")
export class AppShell extends LitElement {
  @state() private currentRoute: AppRoute = router.getRoute();
  private unsubscribeRouter: (() => void) | null = null;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      width: 100%;
      background-color: var(--color-bg-app, #f8fafc);
      color: var(--color-text-primary, #0f172a);
    }

    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
    }

    @media (min-width: 1024px) {
      .app-layout {
        flex-direction: row;
      }
    }

    .main-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      padding: var(--spacing-4, 16px);
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    @media (min-width: 640px) {
      .main-container {
        padding: var(--spacing-6, 24px);
      }
    }

    @media (min-width: 1024px) {
      .main-container {
        padding: var(--spacing-8, 32px);
      }
    }
  `;

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
    switch (this.currentRoute) {
      case "overview":
        return html`<overview-view></overview-view>`;
      case "lighting":
        return html`<lighting-view></lighting-view>`;
      case "climate":
        return html`<climate-view></climate-view>`;
      case "activity":
        return html`<activity-view></activity-view>`;
      case "simulator":
        return html`<simulator-view></simulator-view>`;
      default:
        return html`<overview-view></overview-view>`;
    }
  }

  render() {
    return html`
      <div class="app-layout">
        <app-nav .currentRoute=${this.currentRoute}></app-nav>
        <main class="main-container">
          ${this.renderCurrentView()}
        </main>
      </div>
    `;
  }
}
