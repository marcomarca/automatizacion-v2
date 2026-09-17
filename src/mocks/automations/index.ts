import type { MockAutomation } from "../../models/automation";

export const allMockAutomations: MockAutomation[] = [
  {
    id: "auto.night-sweep",
    name: "Barrido Nocturno de Iluminación",
    description: "Apagado automático de luminarias al finalizar la jornada laboral (20:00)",
    enabled: true,
    trigger: {
      type: "schedule",
      atTime: "20:00",
      description: "Lunes a Viernes a las 20:00",
    },
    conditions: [
      { field: "occupancy", operator: "eq", value: false, description: "Sin ocupación detectada" },
    ],
    actions: [
      { target: "device", deviceId: "offices.general-lights", powerState: "off" },
      { target: "device", deviceId: "offices.management-lights", powerState: "off" },
      { target: "device", deviceId: "offices.meeting-lights", powerState: "off" },
      { target: "scene", sceneId: "showroom.all-off" },
      {
        target: "notification",
        message: "Barrido nocturno ejecutado: oficinas y showroom apagados.",
      },
    ],
    lastTriggeredAt: "Ayer a las 20:00",
  },
  {
    id: "auto.showroom-solar-harvesting",
    name: "Cosecha de Luz Diurna Showroom",
    description: "Ajusta dinámicamente la intensidad de Spots Ventana en función del aporte solar",
    spaceId: "showroom",
    enabled: true,
    trigger: {
      type: "state_change",
      entityId: "sensor.daylight_lux",
      description: "Cambio en sensor de lux solar exterior",
    },
    actions: [{ target: "device", deviceId: "showroom.spots-window", brightnessPct: 35 }],
    lastTriggeredAt: "Hoy a las 14:15",
  },
  {
    id: "auto.meeting-preconditioning",
    name: "Preclimatización Sala de Reuniones",
    description: "Activa confort térmico (21.5°C) 15 minutos antes de una reunión programada",
    spaceId: "offices",
    enabled: true,
    trigger: {
      type: "calendar",
      description: "15m antes de evento en calendario",
    },
    actions: [
      { target: "climate", temperature: 21.5 },
      {
        target: "notification",
        message: "Preclimatización iniciada para sala de reuniones (21.5°C).",
      },
    ],
    lastTriggeredAt: "Hoy a las 09:45",
  },
  {
    id: "auto.lobby-welcome",
    name: "Activación Escena Bienvenida Lobby",
    description: "Enciende iluminación principal al abrirse la puerta de acceso en horario laboral",
    spaceId: "lobby",
    enabled: true,
    trigger: {
      type: "occupancy",
      description: "Sensor de presencia en recepción",
    },
    actions: [{ target: "scene", sceneId: "lobby.welcome" }],
    lastTriggeredAt: "Hoy a las 08:30",
  },
];
