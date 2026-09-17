import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { MockNotification } from "../../../models/notification";
import { notificationStore } from "../../../stores/notification.store";

@customElement("operations-notifications-view")
export class OperationsNotificationsView extends LitElement {
  @state() private notifications: MockNotification[] = notificationStore.getAll();
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.notifications = notificationStore.getAll();
    this.unsubscribe = notificationStore.subscribe(() => {
      this.notifications = notificationStore.getAll();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    return html`
      <section>
        <header>
          <h1>Bandeja de Notificaciones</h1>
          <p>Alertas del sistema, avisos de climatización y eventos operativos.</p>
        </header>

        <div>
          <button type="button" @click=${() => notificationStore.clearAll()}>
            Limpiar Notificaciones
          </button>
        </div>

        ${
          this.notifications.length === 0
            ? html`<p>No hay notificaciones pendientes.</p>`
            : html`
              <ul>
                ${this.notifications.map(
                  (n) => html`
                    <li>
                      <article>
                        <h4>
                          [${n.level.toUpperCase()}] ${n.title}
                          ${n.read ? html`<small>(Leída)</small>` : html`<strong>(Nueva)</strong>`}
                        </h4>
                        <p>${n.message}</p>
                        <p><small>${n.timestamp}</small></p>
                        ${
                          !n.read
                            ? html`
                              <button
                                type="button"
                                @click=${() => notificationStore.markAsRead(n.id)}
                              >
                                Marcar como leída
                              </button>
                            `
                            : ""
                        }
                      </article>
                    </li>
                  `,
                )}
              </ul>
            `
        }
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "operations-notifications-view": OperationsNotificationsView;
  }
}
