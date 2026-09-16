import type { DemoScenario } from "../../engine/scenario";

export const emptyOfficeScenario: DemoScenario = {
  id: "empty-office",
  name: "Empty Office",
  description:
    "Staff leaves office: occupancy sensor clears. After 5 min absence, lighting dims to 20%; after 10 min, lights turn off completely.",
  initialClockTime: "2026-09-16T18:00:00Z",
  initialState: {
    zones: [
      {
        id: "zone-open-office",
        name: "Open Office",
        type: "office",
        occupied: true,
        absenceMinutes: 0,
        daylightLux: 50,
        targetLux: 500,
        nominalPowerW: 144,
        currentTemperature: 23.0,
        targetTemperature: 23.0,
      },
    ],
    energy: {
      energyBaselineKwh: 35.2,
      energyActualKwh: 28.0,
      automatedActions: 32,
    },
    upcomingMeeting: null,
  },
  timeline: [
    {
      atSecond: 2,
      zoneId: "zone-open-office",
      changes: { occupied: false, absenceMinutes: 1 },
      activityEvent: {
        category: "occupancy",
        title: "Room unoccupied",
        reason: "No motion detected for 1 minute in Open Office.",
        action: "Absence countdown started.",
      },
      description: "Staff leaves the room.",
    },
    {
      atSecond: 4,
      zoneId: "zone-open-office",
      changes: { occupied: false, absenceMinutes: 5 },
      activityEvent: {
        category: "lighting",
        title: "Courtesy dimming applied",
        reason: "Room unoccupied for 5 minutes.",
        action: "Brightness reduced to 20% standby level.",
        wattsSaved: 115,
      },
      description: "5-minute courtesy dimming trigger.",
    },
    {
      atSecond: 8,
      zoneId: "zone-open-office",
      changes: { occupied: false, absenceMinutes: 10 },
      activityEvent: {
        category: "lighting",
        title: "Lighting shutoff (Empty Room)",
        reason: "Room unoccupied for 10 minutes.",
        action: "Lighting turned off (0%).",
        wattsSaved: 144,
      },
      description: "10-minute complete auto shutoff trigger.",
    },
  ],
};
