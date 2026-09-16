import { queryRequired } from "../ui/dom.js";
export class WmClock extends HTMLElement {
    timer;
    connectedCallback() {
        if (!this.hasChildNodes()) {
            this.innerHTML = `
        <article class="wm-card wm-clock-card">
          <div>
            <span class="wm-eyebrow">Hora local</span>
            <div class="wm-clock-value" data-time>--:--:--</div>
          </div>
          <div class="wm-clock-date" data-date>—</div>
        </article>
      `;
        }
        this.tick();
        this.timer = globalThis.setInterval(() => this.tick(), 1000);
    }
    disconnectedCallback() {
        if (this.timer !== undefined)
            globalThis.clearInterval(this.timer);
    }
    tick() {
        const now = new Date();
        queryRequired(this, "[data-time]").textContent =
            new Intl.DateTimeFormat("es-BO", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }).format(now);
        queryRequired(this, "[data-date]").textContent =
            new Intl.DateTimeFormat("es-BO", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
            }).format(now);
    }
}
