import type { MockScene } from "../../models/scene";

export const lobbyScenes: MockScene[] = [
  {
    id: "lobby.welcome",
    name: "Bienvenida",
    description: "Iluminación cálida y acogedora para recepción",
    spaceId: "lobby",
    actions: [
      { deviceId: "lobby.main-lights", powerState: "on", brightnessPct: 80 },
      { deviceId: "lobby.reception-spot", powerState: "on", brightnessPct: 100 },
      { deviceId: "lobby.accent-led", powerState: "on", brightnessPct: 100 },
    ],
  },
  {
    id: "lobby.night",
    name: "Noche / Guardia",
    description: "Nivel de seguridad mínimo y luz de cortesía",
    spaceId: "lobby",
    actions: [
      { deviceId: "lobby.main-lights", powerState: "off", brightnessPct: 0 },
      { deviceId: "lobby.reception-spot", powerState: "off", brightnessPct: 0 },
      { deviceId: "lobby.accent-led", powerState: "on", brightnessPct: 30 },
    ],
  },
  {
    id: "lobby.all-off",
    name: "Apagado Lobby",
    description: "Apagar todas las luces del Lobby",
    spaceId: "lobby",
    actions: [
      { deviceId: "lobby.main-lights", powerState: "off", brightnessPct: 0 },
      { deviceId: "lobby.reception-spot", powerState: "off", brightnessPct: 0 },
      { deviceId: "lobby.accent-led", powerState: "off", brightnessPct: 0 },
    ],
  },
];
