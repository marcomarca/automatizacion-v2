import type { MockDevice } from "../../models/device";

/**
 * Showroom Mock Devices — Calibrados exactamente con la configuración lógica
 * extraída de Home Assistant (sensor.showroom_potencia_estimada).
 * Potencia total instalada conocida: 1395 W (9 circuitos).
 */
export const showroomDevices: MockDevice[] = [
  {
    id: "showroom.spots-window",
    name: "Spots ventana",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-spots-window",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 100, // 100 W en Home Assistant
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.interruptor_inteligente_switch_1",
    },
  },
  {
    id: "showroom.spots-2x3",
    name: "Spots 2×3",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-spots-2x3",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 120, // 120 W en Home Assistant
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.interruptor_inteligente_switch_2",
    },
  },
  {
    id: "showroom.spots-3x3",
    name: "Spots 3×3",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-spots-3x3",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 180, // 180 W en Home Assistant
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.interruptor_inteligente_switch_3",
    },
  },
  {
    id: "showroom.spots-tv",
    name: "Spots TV",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-spots-tv",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 25, // 25 W en Home Assistant
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.interruptor_inteligente_switch_4",
    },
  },
  {
    id: "showroom.panels-3k6k",
    name: "Paneles 3K/6K",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-panels-3k6k",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 96, // 96 W en Home Assistant
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.interruptor_inteligente_2_switch_1",
    },
  },
  {
    id: "showroom.pendants",
    name: "Colgantes",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-pendants",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 10, // 10 W en Home Assistant
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.interruptor_inteligente_2_switch_2",
    },
  },
  {
    id: "showroom.slims",
    name: "Slims",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-slims",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 432, // 432 W en Home Assistant
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.interruptor_inteligente_2_switch_3",
    },
  },
  {
    id: "showroom.downlights",
    name: "Downlights",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-downlights",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 144, // 144 W en Home Assistant
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.interruptor_inteligente_2_switch_4",
    },
  },
  {
    id: "showroom.panels",
    name: "Paneles",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-panels",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 288, // 288 W en Home Assistant (Relé 4)
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.smart_relay_switch_4_switch",
    },
  },
  {
    id: "showroom.reflector",
    name: "Reflector exterior",
    kind: "light",
    spaceId: "showroom",
    zoneId: "showroom-reflector",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 0, // En HA queda fuera del cálculo de potencia conocida
    actualPowerW: 0,
    available: true,
    metadata: {
      legacyHomeAssistantEntityId: "switch.smart_relay_switch_3_switch",
    },
  },
];
