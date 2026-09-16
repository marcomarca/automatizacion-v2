import type { DemoScenario } from "../../engine/scenario";

export const highDaylightScenario: DemoScenario = {
  id: "high-daylight",
  name: "High Daylight",
  description:
    "Solar peak: natural daylight reaches 680 lux, Witmind harvests daylight by reducing artificial lighting to 35%, generating ~94W instantaneous savings.",
  initialClockTime: "2026-09-16T11:30:00Z",
  initialState: {
    zones: [
      {
        id: "zone-open-office",
        name: "Open Office",
        type: "office",
        occupied: true,
        absenceMinutes: 0,
        daylightLux: 120,
        targetLux: 500,
        nominalPowerW: 144,
        currentTemperature: 23.0,
        targetTemperature: 23.0,
      },
      {
        id: "zone-showroom",
        name: "Showroom",
        type: "showroom",
        occupied: true,
        absenceMinutes: 0,
        daylightLux: 200,
        targetLux: 600,
        nominalPowerW: 240,
        currentTemperature: 23.4,
        targetTemperature: 23.0,
      },
    ],
    energy: {
      energyBaselineKwh: 28.0,
      energyActualKwh: 22.4,
      automatedActions: 24,
    },
    upcomingMeeting: null,
  },
  timeline: [
    {
      atSecond: 2,
      zoneId: "zone-open-office",
      changes: { daylightLux: 680, brightnessOverride: 35 },
      activityEvent: {
        category: "lighting",
        title: "Lighting optimized (Daylight Harvesting)",
        reason: "Natural daylight increased to 680 lux.",
        action: "Lighting reduced from 100% to 35%.",
        wattsSaved: 94,
      },
      description: "Sunlight peak detected in Open Office.",
    },
  ],
};
