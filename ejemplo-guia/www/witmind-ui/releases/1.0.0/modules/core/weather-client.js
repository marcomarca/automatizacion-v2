export class WeatherClient extends EventTarget {
    entityId = null;
    forecastType = "daily";
    connection = null;
    unsubscribe = null;
    subscriptionGeneration = 0;
    forecast = [];
    error = "";
    configure(config) {
        const nextEntity = config?.entityId ?? null;
        const nextType = config?.forecastType ?? "daily";
        if (nextEntity !== this.entityId || nextType !== this.forecastType) {
            this.entityId = nextEntity;
            this.forecastType = nextType;
            this.forecast = [];
            void this.resubscribe();
        }
    }
    setHass(hass) {
        if (hass?.connection !== this.connection) {
            this.connection = hass?.connection ?? null;
            void this.resubscribe();
        }
    }
    destroy() {
        this.subscriptionGeneration += 1;
        this.stopSubscription();
        this.connection = null;
    }
    async resubscribe() {
        const generation = ++this.subscriptionGeneration;
        this.stopSubscription();
        if (!this.connection || !this.entityId)
            return;
        try {
            const unsubscribe = await this.connection.subscribeMessage((event) => {
                if (generation !== this.subscriptionGeneration)
                    return;
                this.forecast = Array.isArray(event.forecast) ? event.forecast : [];
                this.error = "";
                this.dispatchEvent(new Event("forecast-change"));
            }, {
                type: "weather/subscribe_forecast",
                forecast_type: this.forecastType,
                entity_id: this.entityId,
            });
            if (generation !== this.subscriptionGeneration) {
                unsubscribe();
                return;
            }
            this.unsubscribe = unsubscribe;
        }
        catch (error) {
            if (generation !== this.subscriptionGeneration)
                return;
            this.error =
                error instanceof Error
                    ? error.message
                    : "No se pudo cargar el pronóstico.";
            this.dispatchEvent(new Event("forecast-change"));
        }
    }
    stopSubscription() {
        if (!this.unsubscribe)
            return;
        try {
            this.unsubscribe();
        }
        catch {
            // La conexión anterior puede estar cerrada.
        }
        this.unsubscribe = null;
    }
}
