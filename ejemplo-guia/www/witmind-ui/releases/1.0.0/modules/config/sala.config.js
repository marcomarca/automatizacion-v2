export const salaViewConfig = {
    id: "sala",
    title: "Sala de grabación",
    installation: "WTX · MDTC",
    description: "Control operativo de iluminación, clima y consumo.",
    navigationLabel: "Sala",
    navigationIcon: "studio",
    weather: {
        entityId: "weather.forecast_casa",
        forecastType: "daily",
        days: 5,
        eyebrow: "Clima · Casa",
    },
    controls: [
        {
            entityId: "switch.4gang_switch_sala_grabacion_interruptor_1",
            label: "Interruptor 1",
            subtitle: "Sala de grabación",
            icon: "power",
        },
        {
            entityId: "switch.4gang_switch_sala_grabacion_interruptor_2",
            label: "Interruptor 2",
            subtitle: "Sala de grabación",
            icon: "power",
        },
        {
            entityId: "switch.4gang_switch_sala_grabacion_interruptor_3",
            label: "Interruptor 3",
            subtitle: "Sala de grabación",
            icon: "power",
        },
        {
            entityId: "switch.4gang_switch_sala_grabacion_interruptor_4",
            label: "Interruptor 4",
            subtitle: "Sala de grabación",
            icon: "power",
        },
    ],
    history: {
        title: "Historial operativo",
        hours: 2,
        entities: [
            {
                entityId: "switch.interruptor_sala_de_grabacion_tracklights",
                label: "Tracklights",
            },
            {
                entityId: "switch.interruptor_sala_de_grabacion_paneles",
                label: "Paneles",
            },
            {
                entityId: "switch.interruptor_sala_de_grabacion_tiras",
                label: "Tiras",
            },
            {
                entityId: "switch.interruptor_sala_de_grabacion_spots_decorativos",
                label: "Spots decorativos",
            },
        ],
    },
    gauge: {
        entityId: "input_number.gasto_proyectado_8hrs",
        title: "Gasto proyectado",
        eyebrow: "Proyección · 8 horas",
    },
    primaryAction: {
        title: "Apagado total",
        description: "Activa la escena maestra de apagado de la sala.",
        icon: "shutdown",
        domain: "scene",
        service: "turn_on",
        target: { entity_id: "scene.apagado_total" },
        confirmation: {
            title: "Confirmar apagado total",
            message: "Se ejecutará scene.apagado_total. Esta acción puede apagar todos los dispositivos asociados.",
            confirmLabel: "Ejecutar apagado",
        },
    },
};
