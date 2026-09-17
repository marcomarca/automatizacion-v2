import type { MockNotification } from "../../models/notification";

export const allMockNotifications: MockNotification[] = [
  {
    id: "notif-001",
    timestamp: "10:15:22",
    level: "info",
    title: "Cosecha Solar Activa",
    message: "Atenuación automática del 65% en zona ventana Showroom por alta radiación.",
    read: false,
    category: "energy",
  },
  {
    id: "notif-002",
    timestamp: "09:45:00",
    level: "success",
    title: "Sala de Reuniones Preacondicionada",
    message: "Temperatura estabilizada a 21.5°C previo a reunión de las 10:00.",
    read: false,
    category: "climate",
  },
  {
    id: "notif-003",
    timestamp: "08:30:10",
    level: "info",
    title: "Apertura de Edificio",
    message: "Horario laboral iniciado según calendario. Iluminación general encendida.",
    read: true,
    category: "system",
  },
  {
    id: "notif-004",
    timestamp: "Ayer 20:00:05",
    level: "warning",
    title: "Barrido Nocturno Completado",
    message: "Se apagaron 12 circuitos en Showroom y Oficinas sin presencia detectada.",
    read: true,
    category: "lighting",
  },
];
