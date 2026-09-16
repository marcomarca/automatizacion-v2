import { entityState } from "../core/entity-state.js";
import { RuntimeElement } from "../core/runtime-element.js";
import { escapeHtml } from "../ui/escape.js";
import { iconMarkup } from "../ui/icon.js";
import { weatherIcons, weatherLabels } from "../ui/weather.js";
export class WmWeatherCard extends RuntimeElement {
    _config = null;
    onForecast = () => this.update();
    set config(value) {
        this._config = value;
        this.runtime?.weather.configure(value);
        this.update();
    }
    connectedCallback() {
        super.connectedCallback();
        this.runtime?.weather.addEventListener("forecast-change", this.onForecast);
        this.update();
    }
    disconnectedCallback() {
        this.runtime?.weather.removeEventListener("forecast-change", this.onForecast);
        super.disconnectedCallback();
    }
    update() {
        if (!this.isConnected || !this.runtime || !this._config)
            return;
        const stateObject = entityState(this.runtime.hass, this._config.entityId);
        if (!stateObject) {
            this.innerHTML = `
        <article class="wm-card wm-weather-card wm-card--error">
          <span class="wm-eyebrow">Clima</span>
          <h2>Entidad inexistente</h2>
          <code>${escapeHtml(this._config.entityId)}</code>
        </article>
      `;
            return;
        }
        const condition = stateObject.state;
        const attrs = stateObject.attributes;
        const temperature = attrs.temperature ?? "—";
        const temperatureUnit = attrs.temperature_unit ?? "°";
        const humidity = attrs.humidity ?? "—";
        const wind = attrs.wind_speed ?? "—";
        const windUnit = attrs.wind_speed_unit ?? "";
        const forecast = this.runtime.weather.forecast.slice(0, this._config.days ?? 5);
        this.innerHTML = `
      <article class="wm-card wm-weather-card">
        <div class="wm-weather-current">
          <div>
            <span class="wm-eyebrow">${escapeHtml(this._config.eyebrow ?? "Clima")}</span>
            <h2>${escapeHtml(weatherLabels[condition] || condition)}</h2>
            <div class="wm-metadata-row">
              <span>Humedad ${escapeHtml(humidity)}%</span>
              <span>Viento ${escapeHtml(wind)} ${escapeHtml(windUnit)}</span>
            </div>
          </div>
          <div class="wm-temperature-block">
            ${iconMarkup(weatherIcons[condition] || "cloud")}
            <strong>${escapeHtml(temperature)}${escapeHtml(temperatureUnit)}</strong>
          </div>
        </div>
        <div class="wm-forecast-grid">
          ${forecast.length
            ? forecast
                .map((item) => {
                const date = new Date(item.datetime ?? "");
                const high = item.temperature ?? item.native_temperature ?? "—";
                const low = item.templow ?? item.native_templow ?? "—";
                const itemCondition = item.condition || "cloudy";
                const weekday = Number.isNaN(date.getTime())
                    ? "—"
                    : new Intl.DateTimeFormat("es-BO", {
                        weekday: "short",
                    }).format(date);
                return `
                      <div class="wm-forecast-day">
                        <span>${escapeHtml(weekday)}</span>
                        ${iconMarkup(weatherIcons[itemCondition] || "cloud")}
                        <strong>${escapeHtml(high)}°</strong>
                        <small>${escapeHtml(low)}°</small>
                      </div>
                    `;
            })
                .join("")
            : `<p class="wm-empty-state">${escapeHtml(this.runtime.weather.error || "Pronóstico no disponible.")}</p>`}
        </div>
      </article>
    `;
    }
}
