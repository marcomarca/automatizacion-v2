import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { MockPrintJob } from "../../../models/print-job";
import { printStore } from "../../../stores/print.store";

@customElement("operations-printing-view")
export class OperationsPrintingView extends LitElement {
  @state() private jobs: MockPrintJob[] = printStore.getAll();
  @state() private docName = "Reporte_Mensual_Confort.pdf";
  @state() private pages = 3;
  private unsubscribe?: () => void;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.jobs = printStore.getAll();
    this.unsubscribe = printStore.subscribe(() => {
      this.jobs = printStore.getAll();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private handleDocNameInput(e: Event) {
    this.docName = (e.target as HTMLInputElement).value;
  }

  private handlePagesInput(e: Event) {
    this.pages = Number((e.target as HTMLInputElement).value);
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.docName) return;
    printStore.createJob(this.docName, this.pages);
    this.docName = "";
  }

  render() {
    return html`
      <section>
        <header>
          <h1>Centro de Impresiones Mock</h1>
          <p>Cola de impresión simulada para validación de procesos operativos.</p>
        </header>

        <form @submit=${this.handleSubmit}>
          <fieldset>
            <legend>Enviar Nuevo Trabajo de Impresión</legend>

            <label>
              Nombre del Documento:
              <input
                type="text"
                .value=${this.docName}
                @input=${this.handleDocNameInput}
                required
              />
            </label>

            <label>
              Páginas:
              <input
                type="number"
                min="1"
                max="100"
                .value=${String(this.pages)}
                @input=${this.handlePagesInput}
                required
              />
            </label>

            <button type="submit">Enviar a Impresora</button>
          </fieldset>
        </form>

        <h2>Cola de Trabajos</h2>
        ${
          this.jobs.length === 0
            ? html`<p>No hay trabajos en cola.</p>`
            : html`
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Documento</th>
                    <th>Páginas</th>
                    <th>Impresora</th>
                    <th>Estado</th>
                    <th>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.jobs.map(
                    (job) => html`
                      <tr>
                        <td>${job.id}</td>
                        <td>${job.documentName}</td>
                        <td>${job.pages}</td>
                        <td>${job.printerName}</td>
                        <td><strong>${job.status.toUpperCase()}</strong></td>
                        <td>${job.createdAt}</td>
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
            `
        }
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "operations-printing-view": OperationsPrintingView;
  }
}
