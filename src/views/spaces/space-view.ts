import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Space, SpaceCapability } from "../../models/space";
import { spaceStore } from "../../stores/space.store";
import { SPACE_SECTION_LABELS } from "./space-section.registry";
import "./sections/space-overview";
import "./sections/space-lighting";
import "./sections/space-climate";
import "./sections/space-energy";
import "./sections/space-scenes";
import "./sections/space-products";
import "./sections/space-visualization";

@customElement("space-view")
export class SpaceView extends LitElement {
  @property({ type: String }) spaceId = "";
  @property({ type: String }) section = "";

  @state() private space?: Space;
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateSpace();
    this.unsubscribe = spaceStore.subscribe(() => {
      this.updateSpace();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("spaceId")) {
      this.updateSpace();
    }
  }

  private updateSpace() {
    if (this.spaceId) {
      this.space = spaceStore.getById(this.spaceId);
    }
  }

  render() {
    if (!this.space) {
      return html`
        <section>
          <h2>Espacio no encontrado</h2>
          <p>No se encontró el espacio solicitado con identificador: "${this.spaceId}".</p>
          <p><a href="#/spaces">← Volver a la lista de espacios</a></p>
        </section>
      `;
    }

    const activeSection: SpaceCapability = (this.section as SpaceCapability) || "overview";

    return html`
      <div>
        <header>
          <nav>
            <a href="#/spaces">← Espacios</a>
          </nav>
          <h1>${this.space.name}</h1>
          <p>${this.space.description || ""}</p>
        </header>

        <nav aria-label="Secciones de ${this.space.name}">
          <ul>
            ${this.space.capabilities.map((cap) => {
              const label = SPACE_SECTION_LABELS[cap] || cap;
              const isSelected = activeSection === cap;
              const href =
                cap === "overview"
                  ? `#/spaces/${this.space!.id}`
                  : `#/spaces/${this.space!.id}/${cap}`;

              return html`
                <li>
                  <a href="${href}">
                    ${isSelected ? html`<strong>[ ${label} ]</strong>` : label}
                  </a>
                </li>
              `;
            })}
          </ul>
        </nav>

        <main>
          ${this.renderSection(activeSection)}
        </main>
      </div>
    `;
  }

  private renderSection(section: SpaceCapability) {
    if (!this.space) return html``;

    switch (section) {
      case "overview":
        return html`<space-overview .space=${this.space}></space-overview>`;
      case "lighting":
        return html`<space-lighting .space=${this.space}></space-lighting>`;
      case "climate":
        return html`<space-climate .space=${this.space}></space-climate>`;
      case "energy":
        return html`<space-energy .space=${this.space}></space-energy>`;
      case "scenes":
        return html`<space-scenes .space=${this.space}></space-scenes>`;
      case "products":
        return html`<space-products .space=${this.space}></space-products>`;
      case "visualization":
        return html`<space-visualization .space=${this.space}></space-visualization>`;
      default:
        return html`<space-overview .space=${this.space}></space-overview>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "space-view": SpaceView;
  }
}
