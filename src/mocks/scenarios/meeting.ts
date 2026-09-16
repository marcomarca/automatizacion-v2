import type { DemoScenario } from "../../engine/scenario";

export const meetingScenario: DemoScenario = {
  id: "meeting",
  name: "Upcoming Meeting",
  description:
    "Board meeting in 12 minutes in Meeting Room A. Room temperature is high at 26.1°C. Recommendation raised to precondition HVAC.",
  initialClockTime: "2026-09-16T14:48:00Z",
  initialState: {
    zones: [
      {
        id: "zone-meeting-a",
        name: "Meeting Room A",
        type: "meeting",
        occupied: false,
        absenceMinutes: 45,
        daylightLux: 100,
        targetLux: 500,
        nominalPowerW: 96,
        currentTemperature: 26.1,
        targetTemperature: 23.0,
      },
      {
        id: "zone-open-office",
        name: "Open Office",
        type: "office",
        occupied: true,
        absenceMinutes: 0,
        daylightLux: 300,
        targetLux: 500,
        nominalPowerW: 144,
        currentTemperature: 23.0,
        targetTemperature: 23.0,
      },
    ],
    energy: {
      energyBaselineKwh: 31.0,
      energyActualKwh: 24.8,
      automatedActions: 28,
    },
    upcomingMeeting: {
      title: "Quarterly Strategy Review",
      scheduledAt: "15:00",
      zoneId: "zone-meeting-a",
      roomTemperature: 26.1,
    },
  },
  timeline: [
    {
      atSecond: 3,
      zoneId: "zone-meeting-a",
      changes: { currentTemperature: 25.2, climateMode: "auto" },
      activityEvent: {
        category: "climate",
        title: "Preconditioning started",
        reason: "Upcoming meeting in 12 minutes with room at 26.1°C.",
        action: "HVAC cooling initiated to reach 23.0°C comfort target.",
      },
      description: "Preconditioning active - temperature cooling.",
    },
    {
      atSecond: 6,
      zoneId: "zone-meeting-a",
      changes: { currentTemperature: 24.1 },
      description: "Temperature approaching comfort band.",
    },
    {
      atSecond: 9,
      zoneId: "zone-meeting-a",
      changes: { currentTemperature: 23.2 },
      activityEvent: {
        category: "climate",
        title: "Comfort target reached",
        reason: "Room conditioned before meeting start.",
        action: "HVAC modulated to maintenance mode at 23.0°C.",
      },
      description: "Target comfort satisfied prior to attendee arrival.",
    },
  ],
};
