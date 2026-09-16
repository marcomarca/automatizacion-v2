import { WmAppShell } from "./app/wm-app-shell.js";
import { WitmindPanel } from "./app/witmind-panel.js";
import { WmActionCard } from "./components/wm-action-card.js";
import { WmClock } from "./components/wm-clock.js";
import { WmConfirmDialog } from "./components/wm-confirm-dialog.js";
import { WmEntityCard } from "./components/wm-entity-card.js";
import { WmGaugeCard } from "./components/wm-gauge-card.js";
import { WmHeader } from "./components/wm-header.js";
import { WmHistoryCard } from "./components/wm-history-card.js";
import { WmWeatherCard } from "./components/wm-weather-card.js";
import { getReleaseInfo } from "./core/release.js";
import { WmSalaView } from "./views/wm-sala-view.js";
const elements = [
    ["wm-app-shell", WmAppShell],
    ["wm-clock", WmClock],
    ["wm-header", WmHeader],
    ["wm-entity-card", WmEntityCard],
    ["wm-weather-card", WmWeatherCard],
    ["wm-gauge-card", WmGaugeCard],
    ["wm-history-card", WmHistoryCard],
    ["wm-action-card", WmActionCard],
    ["wm-confirm-dialog", WmConfirmDialog],
    ["wm-sala-view", WmSalaView],
    ["witmind-panel", WitmindPanel],
];
for (const [name, constructor] of elements) {
    if (!customElements.get(name))
        customElements.define(name, constructor);
}
console.info(`[Witmind UI] release ${getReleaseInfo().version} cargada`);
