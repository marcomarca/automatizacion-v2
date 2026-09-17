import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Space } from "../../../models/space";
import { deviceStore } from "../../../stores/device.store";
import { productStore } from "../../../stores/product.store";

@customElement("space-products")
export class SpaceProducts extends LitElement {
  @property({ type: Object }) space!: Space;

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.space) return html``;

    const products = productStore.getBySpaceId(this.space.id);

    return html`
      <section>
        <header>
          <h3>Catálogo de Productos — ${this.space.name}</h3>
          <p>Luminarias y dispositivos en exhibición con control de encendido vinculado.</p>
        </header>

        ${
          products.length === 0
            ? html`<p>No hay productos en catálogo registrados para este espacio.</p>`
            : html`
              <ul>
                ${products.map((prod) => {
                  const controlledDevices = prod.controlledDeviceIds
                    .map((id) => deviceStore.getById(id))
                    .filter(Boolean);

                  return html`
                    <li>
                      <article>
                        <h4>${prod.name}</h4>
                        <p><strong>Familia:</strong> ${prod.family}</p>
                        <p>${prod.description || ""}</p>

                        <details>
                          <summary>Especificaciones Técnicas</summary>
                          <ul>
                            ${Object.entries(prod.specifications).map(
                              ([k, v]) => html`
                                <li><strong>${k}:</strong> ${String(v)}</li>
                              `,
                            )}
                          </ul>
                        </details>

                        ${
                          controlledDevices.length > 0
                            ? html`
                              <div>
                                <h5>Control de Luminarias Vinculadas:</h5>
                                ${controlledDevices.map(
                                  (dev) => html`
                                    <p>
                                      ${dev?.name}: <strong>${dev?.powerState?.toUpperCase()}</strong>
                                      (${dev?.actualPowerW} W)
                                      <button
                                        type="button"
                                        @click=${() => dev && deviceStore.toggle(dev.id)}
                                      >
                                        ${dev?.powerState === "on" ? "Apagar" : "Encender"}
                                      </button>
                                    </p>
                                  `,
                                )}
                              </div>
                            `
                            : ""
                        }
                      </article>
                    </li>
                  `;
                })}
              </ul>
            `
        }
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "space-products": SpaceProducts;
  }
}
