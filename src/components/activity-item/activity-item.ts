import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { SmartActivity } from "../../models";

@customElement("activity-item")
export class ActivityItem extends LitElement {
  @property({ type: Object }) activity!: SmartActivity;

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.activity) return html``;

    const { timestamp, category, title, reason, action, impact } = this.activity;

    return html`
      <article>
        <header>
          <span>[${timestamp}] [${category.toUpperCase()}]</span>
          <strong>${title}</strong>
          ${impact?.wattsSaved ? html`<span>(⚡ -${impact.wattsSaved}W)</span>` : ""}
        </header>

        <p><strong>Causa:</strong> ${reason}</p>
        <p><strong>Acción:</strong> ${action}</p>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "activity-item": ActivityItem;
  }
}
