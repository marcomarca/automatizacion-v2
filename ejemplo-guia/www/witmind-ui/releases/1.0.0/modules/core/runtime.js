import { HistoryClient } from "./history-client.js";
import { ServiceController } from "./service-controller.js";
import { WeatherClient } from "./weather-client.js";
export class Runtime extends EventTarget {
    hass = null;
    view = null;
    services = new ServiceController(() => this.hass);
    weather = new WeatherClient();
    history = new HistoryClient(() => this.hass);
    setView(view) {
        this.view = view;
        this.weather.configure(view.weather);
        this.dispatchEvent(new Event("view-change"));
    }
    setHass(hass) {
        this.hass = hass;
        this.services.updateFromHass(hass);
        this.weather.setHass(hass);
        this.dispatchEvent(new Event("hass-change"));
    }
    destroy() {
        this.weather.destroy();
    }
}
