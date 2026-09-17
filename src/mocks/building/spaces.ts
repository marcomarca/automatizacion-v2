import type { Space } from "../../models/space";

export const mockSpaces: Space[] = [
  {
    id: "showroom",
    name: "Showroom",
    description: "Espacio de exhibición y demostración de luminarias y automatizaciones",
    zoneIds: [
      "showroom-spots-window",
      "showroom-spots-2x3",
      "showroom-spots-3x3",
      "showroom-spots-tv",
      "showroom-panels-3k6k",
      "showroom-pendants",
      "showroom-slims",
      "showroom-downlights",
      "showroom-panels",
    ],
    capabilities: ["overview", "lighting", "energy", "scenes", "products", "visualization"],
  },
  {
    id: "lobby",
    name: "Lobby",
    description: "Área de recepción, bienvenida y control de accesos",
    zoneIds: ["lobby-general", "lobby-reception", "lobby-accent"],
    capabilities: ["overview", "lighting", "scenes", "visualization"],
  },
  {
    id: "offices",
    name: "Oficinas",
    description: "Zona de trabajo administrativo, salas de reuniones y gerencia",
    zoneIds: ["oficina-general", "gerencia", "reunion", "pasillo"],
    capabilities: ["overview", "lighting", "climate", "energy"],
  },
];
