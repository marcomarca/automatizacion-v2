import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { Space } from "../../models/space";
import { spaceStore } from "../../stores/space.store";

@customElement("spaces-view")
export class SpacesView extends LitElement {
  @state() private spaces: Space[] = [];
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.spaces = spaceStore.getAll();
    this.unsubscribe = spaceStore.subscribe(() => {
      this.spaces = spaceStore.getAll();
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
          <h1>Espacios del Edificio</h1>
          <p>Seleccione un espacio para gestionar sus circuitos, escenas y sistemas.</p>
        </header>

        <ul>
          ${this.spaces.map(
            (space) => html`
              <li>
                <article>
                  <h3>
                    <a href="#/spaces/${space.id}">${space.name}</a>
                  </h3>
                  <p>${space.description || "Sin descripción disponible."}</p>
                  <p>
                    <small>
                      Capacidades: ${space.capabilities.join(", ")}
                    </small>
                  </p>
                </article>
              </li>
            `,
          )}
        </ul>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "spaces-view": SpacesView;
  }
}
