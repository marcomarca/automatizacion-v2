export class HistoryClient {
    getHass;
    constructor(getHass) {
        this.getHass = getHass;
    }
    async load(config) {
        const hass = this.getHass();
        if (!hass?.callApi) {
            throw new Error("La API de Home Assistant no está disponible.");
        }
        const hours = Number(config.hours || 2);
        const start = new Date(Date.now() - hours * 3_600_000).toISOString();
        const end = new Date().toISOString();
        const entityIds = config.entities.map((item) => item.entityId).join(",");
        const path = `history/period/${encodeURIComponent(start)}` +
            `?filter_entity_id=${encodeURIComponent(entityIds)}` +
            `&end_time=${encodeURIComponent(end)}` +
            "&minimal_response&no_attributes";
        return hass.callApi("GET", path);
    }
}
