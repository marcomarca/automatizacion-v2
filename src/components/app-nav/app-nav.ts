import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("app-nav")
export class AppNav extends LitElement {
  @property({ type: String }) currentRoute = "overview";
  @state() private menuOpen = false;

  static styles = css`
    :host {
      display: block;
    }

    /* Desktop Sidebar (>= 1024px) */
    .sidebar {
      display: none;
      width: 240px;
      background-color: var(--color-bg-surface, #ffffff);
      border-right: 1px solid var(--color-border, #e2e8f0);
      min-height: 100vh;
      flex-direction: column;
      padding: var(--spacing-6, 24px) var(--spacing-4, 16px);
      box-sizing: border-box;
      position: sticky;
      top: 0;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
      margin-bottom: var(--spacing-8, 32px);
      padding: 0 var(--spacing-2, 8px);
    }

    .brand-logo {
      width: 28px;
      height: 28px;
      background-color: var(--color-primary, #2563eb);
      color: #ffffff;
      border-radius: var(--radius-md, 6px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-bold, 700);
      font-size: var(--font-size-base, 16px);
    }

    .brand-title {
      font-size: var(--font-size-lg, 18px);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-primary, #0f172a);
      letter-spacing: -0.02em;
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 4px);
      list-style: none;
    }

    .nav-item a {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 12px);
      padding: var(--spacing-3, 12px);
      border-radius: var(--radius-md, 6px);
      font-size: var(--font-size-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text-secondary, #475569);
      min-height: var(--touch-target-min, 44px);
      text-decoration: none;
      transition: background-color var(--transition-fast, 150ms), color var(--transition-fast, 150ms);
    }

    .nav-item a:hover {
      background-color: var(--color-bg-surface-hover, #e2e8f0);
      color: var(--color-text-primary, #0f172a);
      text-decoration: none;
    }

    .nav-item.active a {
      background-color: var(--color-primary-subtle, #eff6ff);
      color: var(--color-primary, #2563eb);
      font-weight: var(--font-weight-semibold, 600);
    }

    /* Mobile / Tablet Top Bar (< 1024px) */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--color-bg-surface, #ffffff);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .menu-toggle {
      min-height: var(--touch-target-min, 44px);
      min-width: var(--touch-target-min, 44px);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 6px);
      font-size: var(--font-size-lg, 18px);
    }

    .mobile-menu {
      display: none;
      flex-direction: column;
      background-color: var(--color-bg-surface, #ffffff);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
      gap: var(--spacing-1, 4px);
    }

    .mobile-menu.open {
      display: flex;
    }

    @media (min-width: 1024px) {
      .topbar {
        display: none;
      }
      .mobile-menu {
        display: none !important;
      }
      .sidebar {
        display: flex;
      }
    }
  `;

  private toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  private closeMenu() {
    this.menuOpen = false;
  }

  render() {
    const navItems = [
      { id: "overview", label: "Overview", icon: "📊", href: "#/overview" },
      { id: "lighting", label: "Lighting", icon: "💡", href: "#/lighting" },
      { id: "climate", label: "Climate", icon: "🌡️", href: "#/climate" },
      { id: "activity", label: "Activity Feed", icon: "📋", href: "#/activity" },
      { id: "simulator", label: "Simulator", icon: "⚙️", href: "#/simulator" },
    ];

    return html`
      <!-- Desktop Sidebar -->
      <aside class="sidebar">
        <div class="brand-section">
          <div class="brand-logo">W</div>
          <span class="brand-title">Witmind</span>
        </div>
        <ul class="nav-list">
          ${navItems.map(
            (item) => html`
              <li class="nav-item ${this.currentRoute === item.id ? "active" : ""}">
                <a href="${item.href}">
                  <span>${item.icon}</span>
                  <span>${item.label}</span>
                </a>
              </li>
            `,
          )}
        </ul>
      </aside>

      <!-- Mobile Topbar -->
      <header class="topbar">
        <div class="brand-section" style="margin-bottom: 0;">
          <div class="brand-logo">W</div>
          <span class="brand-title">Witmind</span>
        </div>
        <button
          class="menu-toggle"
          @click=${this.toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded=${this.menuOpen}
        >
          ${this.menuOpen ? "✕" : "☰"}
        </button>
      </header>

      <!-- Mobile Dropdown Menu -->
      <nav class="mobile-menu ${this.menuOpen ? "open" : ""}">
        <ul class="nav-list">
          ${navItems.map(
            (item) => html`
              <li class="nav-item ${this.currentRoute === item.id ? "active" : ""}">
                <a href="${item.href}" @click=${this.closeMenu}>
                  <span>${item.icon}</span>
                  <span>${item.label}</span>
                </a>
              </li>
            `,
          )}
        </ul>
      </nav>
    `;
  }
}
