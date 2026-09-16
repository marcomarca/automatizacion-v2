import { getReleaseInfo } from "../core/release.js";
import { escapeHtml } from "./escape.js";
export function iconMarkup(name, className = "") {
    const safeName = String(name || "status").replace(/[^a-z0-9-]/gi, "");
    const iconsUrl = new URL("assets/iconos.svg", getReleaseInfo().root).href;
    return `<svg class="wm-icon ${escapeHtml(className)}" aria-hidden="true"><use href="${iconsUrl}#${safeName}"></use></svg>`;
}
