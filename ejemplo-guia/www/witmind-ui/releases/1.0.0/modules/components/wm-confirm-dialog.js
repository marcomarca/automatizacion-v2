import { queryRequired } from "../ui/dom.js";
import { iconMarkup } from "../ui/icon.js";
export class WmConfirmDialog extends HTMLElement {
    dialog = null;
    confirmButton = null;
    detail = null;
    connectedCallback() {
        if (this.hasChildNodes())
            return;
        this.innerHTML = `
      <dialog class="wm-dialog">
        <form method="dialog">
          <div class="wm-dialog-icon">${iconMarkup("warning")}</div>
          <h2 data-title>Confirmar acción</h2>
          <p data-message></p>
          <p class="wm-error-message" data-error hidden></p>
          <div class="wm-dialog-actions">
            <button class="wm-secondary-button" value="cancel">Cancelar</button>
            <button class="wm-primary-button" type="button" data-confirm>Confirmar</button>
          </div>
        </form>
      </dialog>
    `;
        this.dialog = queryRequired(this, "dialog");
        this.confirmButton = queryRequired(this, "[data-confirm]");
        this.confirmButton.addEventListener("click", () => void this.confirm());
    }
    open(detail) {
        this.detail = detail;
        queryRequired(this, "[data-title]").textContent =
            detail.title || "Confirmar acción";
        queryRequired(this, "[data-message]").textContent =
            detail.message || "¿Deseas continuar?";
        if (this.confirmButton) {
            this.confirmButton.textContent = detail.confirmLabel || "Confirmar";
        }
        const error = queryRequired(this, "[data-error]");
        error.hidden = true;
        error.textContent = "";
        if (typeof this.dialog?.showModal === "function")
            this.dialog.showModal();
        else
            this.dialog?.setAttribute("open", "");
    }
    async confirm() {
        if (!this.detail?.action || !this.confirmButton)
            return;
        const errorElement = queryRequired(this, "[data-error]");
        this.confirmButton.disabled = true;
        this.confirmButton.textContent = "Ejecutando…";
        try {
            await this.detail.action();
            this.dialog?.close();
            this.dialog?.removeAttribute("open");
        }
        catch (error) {
            errorElement.hidden = false;
            errorElement.textContent =
                error instanceof Error ? error.message : "No se pudo ejecutar la acción.";
        }
        finally {
            this.confirmButton.disabled = false;
            this.confirmButton.textContent = this.detail.confirmLabel || "Confirmar";
        }
    }
}
