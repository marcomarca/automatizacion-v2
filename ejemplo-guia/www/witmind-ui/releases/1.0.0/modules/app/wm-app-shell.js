import { getReleaseInfo } from "../core/release.js";
import { escapeHtml } from "../ui/escape.js";
import { iconMarkup } from "../ui/icon.js";
import { getView, getViews, hasView } from "./view-registry.js";
import { resolveView, writeView } from "./router.js";
export class WmAppShell extends HTMLElement {
    _runtime = null;
    _config = {};
    mounted = false;
    activeViewId = null;
    onHashChange = () => this.selectInitialView();
    onClick = (event) => {
        const target = event.target;
        const navButton = target?.closest("[data-view-id]");
        if (navButton?.dataset.viewId)
            this.navigate(navButton.dataset.viewId);
    };
    onConfirmRequest = (event) => {
        const customEvent = event;
        customEvent.stopPropagation();
        this.querySelector("wm-confirm-dialog")?.open(customEvent.detail);
    };
    set runtime(value) {
        this._runtime = value;
        if (this.activeViewId && value) {
            const registered = getView(this.activeViewId);
            if (registered)
                value.setView(registered.config);
        }
    }
    set config(value) {
        this._config = value && typeof value === "object" ? value : {};
        if (this.mounted)
            this.selectInitialView();
    }
    connectedCallback() {
        if (!this.mounted)
            this.mount();
        globalThis.addEventListener("hashchange", this.onHashChange);
        this.selectInitialView();
    }
    disconnectedCallback() {
        globalThis.removeEventListener("hashchange", this.onHashChange);
    }
    mount() {
        this.mounted = true;
        this.innerHTML = `
      <div class="wm-app-shell">
        <aside class="wm-sidebar">
          <div class="wm-brand">
            <div class="wm-logo-frame">
              <img data-logo alt="Witmind">
              <span class="wm-logo-fallback">W</span>
            </div>
            <div>
              <strong>Witmind</strong>
              <small>Automation UI</small>
            </div>
          </div>
          <nav class="wm-navigation" data-navigation aria-label="Vistas"></nav>
          <div class="wm-release-info">Release ${escapeHtml(getReleaseInfo().version)}</div>
        </aside>
        <div class="wm-main-column">
          <div class="wm-view-root" data-view-root></div>
        </div>
        <nav class="wm-mobile-navigation" data-mobile-navigation aria-label="Vistas"></nav>
        <wm-confirm-dialog></wm-confirm-dialog>
      </div>
    `;
        this.addEventListener("click", this.onClick);
        this.addEventListener("wm-confirm-request", this.onConfirmRequest);
        const logo = this.querySelector("[data-logo]");
        logo?.addEventListener("error", () => {
            logo.hidden = true;
            if (logo.nextElementSibling instanceof HTMLElement) {
                logo.nextElementSibling.hidden = false;
            }
        });
    }
    selectInitialView() {
        if (!this.mounted)
            return;
        this.activateView(resolveView(this._config.default_view));
    }
    navigate(viewId) {
        if (!hasView(viewId))
            return;
        writeView(viewId);
        this.activateView(viewId);
    }
    activateView(viewId) {
        const registered = getView(viewId);
        if (!registered)
            return;
        const logoPath = this._config.logo || "/local/logo-witmind.png";
        const logo = this.querySelector("[data-logo]");
        if (logo) {
            logo.hidden = false;
            if (logo.nextElementSibling instanceof HTMLElement) {
                logo.nextElementSibling.hidden = true;
            }
            if (logo.getAttribute("src") !== logoPath)
                logo.src = logoPath;
        }
        this.renderNavigation(viewId);
        if (this.activeViewId === viewId)
            return;
        this.activeViewId = viewId;
        this._runtime?.setView(registered.config);
        this.renderView(registered);
    }
    renderNavigation(activeId) {
        const markup = getViews()
            .map(({ config }) => `
          <button type="button" class="wm-nav-item ${config.id === activeId ? "is-active" : ""}" data-view-id="${escapeHtml(config.id)}" aria-current="${config.id === activeId ? "page" : "false"}">
            ${iconMarkup(config.navigationIcon || "dashboard")}
            <span>${escapeHtml(config.navigationLabel || config.title)}</span>
          </button>
        `)
            .join("");
        const desktop = this.querySelector("[data-navigation]");
        const mobile = this.querySelector("[data-mobile-navigation]");
        if (desktop)
            desktop.innerHTML = markup;
        if (mobile)
            mobile.innerHTML = markup;
    }
    renderView(registered) {
        const root = this.querySelector("[data-view-root]");
        if (!root)
            throw new Error("No existe el contenedor de vistas.");
        root.replaceChildren();
        const view = document.createElement(registered.elementName);
        view.runtime = this._runtime;
        view.view = registered.config;
        root.append(view);
    }
}
