import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { deviceStore } from "../../../stores/device.store";
import "../../../components/device-control/device-control";

@customElement("systems-lighting-view")
export class SystemsLightingView extends LitElement {
  @state() private devices = deviceStore
    .getAll()
    .filter((d) => d.kind === "light" || d.kind === "switch" || d.kind === "relay");
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.devices = deviceStore
      .getAll()
      .filter((d) => d.kind === "light" || d.kind === "switch" || d.kind === "relay");
    this.unsubscribe = deviceStore.subscribe(() => {
      this.devices = deviceStore
        .getAll()
        .filter((d) => d.kind === "light" || d.kind === "switch" || d.kind === "relay");
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    const spaces = ["showroom", "lobby", "offices"];

    return html`
      <section>
        <header>
          <h1>Sistema de Iluminación Global</h1>
          <p>Vista consolidada de todas las luminarias y circuitos del edificio.</p>
        </header>

        <div>
          <button type="button" @click=${() => deviceStore.turnAllOn()}>Encender Todas las Luces</button>
          <button type="button" @click=${() => deviceStore.turnAllOff()}>Apagar Todas las Luces</button>
        </div>

        ${spaces.map((spaceId) => {
          const spaceDevices = this.devices.filter((d) => d.spaceId === spaceId);
          if (spaceDevices.length === 0) return html``;

          return html`
            <section>
              <h2>Espacio: ${spaceId.toUpperCase()}</h2>
              <div>
                ${spaceDevices.map(
                  (device) => html`
                    <device-control .device=${device}></device-control>
                  `,
                )}
              </div>
            </section>
          `;
        })}
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "systems-lighting-view": SystemsLightingView;
  }
}
