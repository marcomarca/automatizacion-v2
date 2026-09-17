import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Space } from "../../../models/space";
import { sceneStore } from "../../../stores/scene.store";

@customElement("space-scenes")
export class SpaceScenes extends LitElement {
  @property({ type: Object }) space!: Space;

  protected createRenderRoot() {
    return this;
  }

  private handleRun(sceneId: string) {
    sceneStore.run(sceneId);
  }

  render() {
    if (!this.space) return html``;

    const scenes = sceneStore.getBySpace(this.space.id);

    return html`
      <section>
        <header>
          <h3>Escenas — ${this.space.name}</h3>
          <p>Configuraciones lumínicas predefinidas para activar con un solo toque.</p>
        </header>

        ${
          scenes.length === 0
            ? html`<p>No hay escenas configuradas para este espacio.</p>`
            : html`
              <ul>
                ${scenes.map(
                  (scene) => html`
                    <li>
                      <article>
                        <h4>${scene.name}</h4>
                        <p>${scene.description || "Escena configurada."}</p>
                        <p><small>${scene.actions.length} acciones automatizadas</small></p>
                        <button
                          type="button"
                          @click=${() => this.handleRun(scene.id)}
                          data-scene-id="${scene.id}"
                        >
                          Activar Escena
                        </button>
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
    "space-scenes": SpaceScenes;
  }
}
