import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { demoStore } from "../../../stores";

@customElement("operations-recording-view")
export class OperationsRecordingView extends LitElement {
  @state() private isRecording = false;
  @state() private sampleCount = 0;
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = demoStore.subscribe(() => {
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private handleStartRecording() {
    const runId = `run_${Date.now().toString(36)}`;
    demoStore.engine.startRecording(runId);
    this.isRecording = true;
  }

  private handleStopRecording() {
    const samples = demoStore.engine.stopRecording();
    this.sampleCount = samples.length;
    this.isRecording = false;
  }

  render() {
    const status = demoStore.getStatus();
    const time = demoStore.getClockTime();

    return html`
      <section>
        <header>
          <h1>Sesiones de Grabación y Telemetría</h1>
          <p>Muestreo y persistencia de telemetría de simulación para auditoría y análisis de curvas.</p>
        </header>

        <div>
          <p>
            <strong>Estado del Motor:</strong> ${status.toUpperCase()}
            | <strong>Hora Simulación:</strong> ${time}
            | <strong>Grabación Activa:</strong> ${this.isRecording ? "SÍ" : "NO"}
          </p>

          <div>
            ${
              !this.isRecording
                ? html`
                  <button type="button" @click=${this.handleStartRecording}>
                    Iniciar Grabación Mock
                  </button>
                `
                : html`
                  <button type="button" @click=${this.handleStopRecording}>
                    Detener Grabación
                  </button>
                `
            }
          </div>

          ${
            this.sampleCount > 0
              ? html`
                <p>
                  ✅ Se han registrado y procesado <strong>${this.sampleCount}</strong> muestras en la última sesión.
                </p>
              `
              : ""
          }
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "operations-recording-view": OperationsRecordingView;
  }
}
