import type { DemoScenario } from "../../engine/scenario";

export const afterHoursScenario: DemoScenario = {
  id: "after-hours",
  name: "After Hours",
  description:
    "Night sweep (20:00): lights detected ON in unoccupied office after commercial hours. Automated sweep turns them off, preventing idle waste.",
  initialClockTime: "2026-09-16T20:00:00Z",
  initialState: {
    zones: [
      {
        id: "zone-open-office",
        name: "Open Office",
        type: "office",
        occupied: false,
        absenceMinutes: 60,
        daylightLux: 0,
        targetLux: 500,
        nominalPowerW: 144,
        currentTemperature: 21.5,
        targetTemperature: 21.0,
      },
      {
        id: "zone-showroom",
        name: "Showroom",
        type: "showroom",
        occupied: false,
        absenceMinutes: 120,
        daylightLux: 0,
        targetLux: 600,
        nominalPowerW: 240,
        currentTemperature: 21.5,
        targetTemperature: 21.0,
      },
    ],
    energy: {
      energyBaselineKwh: 42.0,
      energyActualKwh: 31.5,
      automatedActions: 45,
    },
    upcomingMeeting: null,
  },
  timeline: [
    {
      atSecond: 2,
      zoneId: "zone-open-office",
      changes: { brightnessOverride: 0, mode: "auto" },
      activityEvent: {
        category: "energy",
        title: "After-hours waste avoided",
        reason: "Lights left active at 20:00 with building unoccupied.",
        action: "Automated night sweep turned off Open Office fixtures.",
        wattsSaved: 144,
      },
      description: "Night sweep shutoff for Open Office.",
    },
    {
      atSecond: 4,
      zoneId: "zone-showroom",
      changes: { brightnessOverride: 0, mode: "auto" },
      activityEvent: {
        category: "energy",
        title: "Night sweep completed",
        reason: "Showroom lights shut down after commercial closing.",
        action: "Showroom illumination disabled.",
        wattsSaved: 240,
      },
      description: "Showroom shut down complete.",
    },
  ],
};
