import type { ScenarioDefinition } from "../../models/scenario";

export const referenceOfficeDayV2Seed: ScenarioDefinition = {
  schemaVersion: 2,
  id: "reference-office-day-v2",
  name: "Reference Office 24h (48W / 0-10V Lab)",
  description:
    "Authoritative 24-hour simulation laboratory scenario with full environmental curves, 48W/300mA 0-10V physical driver & panel models, and daylight harvesting.",
  parentId: null,
  time: {
    timezone: "UTC",
    startLocalTime: "00:00",
    durationSeconds: 86400,
    defaultStepSeconds: 60,
  },
  zones: [
    {
      id: "zone-open-office-v2",
      zoneKey: "zone-open-office",
      name: "Open Office (3x 48W Luminaire Array)",
      type: "office",
      config: {
        targetLux: 500,
        targetTemperature: 23.0,
        nominalPowerW: 144, // 3 * 48W
        fixtureCount: 3,
        lightingModel: "curve-based",
        dimmerCurveId: "curve-010v-to-dim-level",
        powerCurveId: "curve-dim-level-to-power-w",
        luxCurveId: "curve-dim-level-to-lux-2m",
      },
    },
    {
      id: "zone-meeting-a-v2",
      zoneKey: "zone-meeting-a",
      name: "Meeting Room A",
      type: "meeting",
      config: {
        targetLux: 500,
        targetTemperature: 22.5,
        nominalPowerW: 96, // 2 * 48W
        fixtureCount: 2,
        lightingModel: "curve-based",
        dimmerCurveId: "curve-010v-to-dim-level",
        powerCurveId: "curve-dim-level-to-power-w",
        luxCurveId: "curve-dim-level-to-lux-2m",
      },
    },
  ],
  profiles: [
    // 1. Occupancy Profile for Open Office (Step interpolation)
    {
      id: "prof-v2-occ-open",
      zoneId: "zone-open-office-v2",
      variable: "occupancy",
      unit: "count",
      interpolation: "step",
      points: [
        { timeOffsetSeconds: 0, value: 0 },
        { timeOffsetSeconds: 28740, value: 0 }, // 07:59
        { timeOffsetSeconds: 28800, value: 1 }, // 08:00 (Arrive)
        { timeOffsetSeconds: 43200, value: 0 }, // 12:00 (Lunch)
        { timeOffsetSeconds: 46800, value: 1 }, // 13:00 (Back)
        { timeOffsetSeconds: 64800, value: 0 }, // 18:00 (Leave)
        { timeOffsetSeconds: 86400, value: 0 }, // 24:00
      ],
    },

    // 2. Temperature Profile for Open Office (Linear interpolation)
    {
      id: "prof-v2-temp-open",
      zoneId: "zone-open-office-v2",
      variable: "temperature_c",
      unit: "°C",
      interpolation: "linear",
      points: [
        { timeOffsetSeconds: 0, value: 24.0 }, // 00:00
        { timeOffsetSeconds: 14400, value: 23.2 }, // 04:00
        { timeOffsetSeconds: 28800, value: 24.5 }, // 08:00
        { timeOffsetSeconds: 43200, value: 26.1 }, // 12:00
        { timeOffsetSeconds: 57600, value: 27.8 }, // 16:00
        { timeOffsetSeconds: 72000, value: 26.4 }, // 20:00
        { timeOffsetSeconds: 86400, value: 24.7 }, // 24:00
      ],
    },

    // 3. Daylight Profile for Open Office (Linear interpolation)
    {
      id: "prof-v2-daylight-open",
      zoneId: "zone-open-office-v2",
      variable: "daylight_lux",
      unit: "lx",
      interpolation: "linear",
      points: [
        { timeOffsetSeconds: 0, value: 0 }, // 00:00
        { timeOffsetSeconds: 21600, value: 0 }, // 06:00
        { timeOffsetSeconds: 28800, value: 120 }, // 08:00
        { timeOffsetSeconds: 36000, value: 350 }, // 10:00
        { timeOffsetSeconds: 43200, value: 680 }, // 12:00
        { timeOffsetSeconds: 50400, value: 550 }, // 14:00
        { timeOffsetSeconds: 57600, value: 260 }, // 16:00
        { timeOffsetSeconds: 64800, value: 30 }, // 18:00
        { timeOffsetSeconds: 72000, value: 0 }, // 20:00
        { timeOffsetSeconds: 86400, value: 0 }, // 24:00
      ],
    },
  ],
  events: [],
  deviceBindings: [
    {
      id: "bind-open-panels",
      zoneId: "zone-open-office-v2",
      role: "ambient_lighting",
      deviceProfileId: "panel-g7-6060-48w-reference",
      quantity: 3,
    },
    {
      id: "bind-open-driver",
      zoneId: "zone-open-office-v2",
      role: "lighting_driver",
      deviceProfileId: "driver-eaglerise-fms-60-350-300ma-reference",
      quantity: 3,
    },
  ],
  controllerConfig: {
    daylightHarvestingEnabled: true,
    absenceShutdownMinutes: 10,
    comfortBandMinC: 21,
    comfortBandMaxC: 25,
    preconditioningLeadMinutes: 30,
  },
};
