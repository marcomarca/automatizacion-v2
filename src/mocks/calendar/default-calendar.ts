import type { MockCalendarDay } from "../../models/calendar";

export const defaultMockCalendar: MockCalendarDay[] = [
  {
    date: "2026-09-15",
    workingDay: true,
    openingTime: "08:30",
    closingTime: "19:00",
    description: "Jornada regular de atención y oficina",
  },
  {
    date: "2026-09-16",
    workingDay: true,
    openingTime: "08:30",
    closingTime: "19:00",
    description: "Jornada regular con demostraciones programadas",
  },
  {
    date: "2026-09-17",
    workingDay: true,
    openingTime: "08:30",
    closingTime: "19:00",
    description: "Jornada de pruebas y simulaciones energéticas",
  },
  {
    date: "2026-09-18",
    workingDay: false,
    holidayName: "Fiestas Patrias",
    description: "Feriado nacional - Edificio cerrado",
    note: "Sistemas en modo standby y seguridad",
  },
  {
    date: "2026-09-19",
    workingDay: false,
    holidayName: "Día de las Glorias del Ejército",
    description: "Feriado nacional - Edificio cerrado",
  },
  {
    date: "2026-09-20",
    workingDay: false,
    description: "Fin de semana (Domingo)",
  },
  {
    date: "2026-09-21",
    workingDay: true,
    openingTime: "08:30",
    closingTime: "19:00",
    description: "Reanudación de actividades normales",
  },
];
