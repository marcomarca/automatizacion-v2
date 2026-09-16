import type { ScenarioDefinition } from "../../models/scenario";

export const legacyScenariosSeed: ScenarioDefinition[] = [
  {
    schemaVersion: 2,
    id: "normal-day",
    name: "Normal Day",
    description:
      "Standard business day: office occupied, moderate daylight (250 lux), climate nominal at 23°C.",
    parentId: null,
    time: {
      timezone: "UTC",
      startLocalTime: "10:00",
      durationSeconds: 86400,
      defaultStepSeconds: 60,
    },
    zones: [
      {
        id: "zone-open-office",
        zoneKey: "zone-open-office",
        name: "Open Office",
        type: "office",
        config: {
          targetLux: 500,
          targetTemperature: 23.0,
          nominalPowerW: 144,
          lightingModel: "legacy-linear-v1",
        },
      },
      {
        id: "zone-meeting-a",
        zoneKey: "zone-meeting-a",
        name: "Meeting Room A",
        type: "meeting",
        config: {
          targetLux: 500,
          targetTemperature: 23.0,
          nominalPowerW: 96,
          lightingModel: "legacy-linear-v1",
        },
      },
      {
        id: "zone-showroom",
        zoneKey: "zone-showroom",
        name: "Showroom",
        type: "showroom",
        config: {
          targetLux: 600,
          targetTemperature: 23.0,
          nominalPowerW: 240,
          lightingModel: "legacy-linear-v1",
        },
      },
      {
        id: "zone-corridor",
        zoneKey: "zone-corridor",
        name: "Main Corridor",
        type: "corridor",
        config: {
          targetLux: 300,
          targetTemperature: 22.5,
          nominalPowerW: 72,
          lightingModel: "legacy-linear-v1",
        },
      },
    ],
    profiles: [
      {
        id: "prof-normal-occ-open",
        zoneId: "zone-open-office",
        variable: "occupancy",
        unit: "count",
        interpolation: "step",
        points: [
          { timeOffsetSeconds: 0, value: 0 },
          { timeOffsetSeconds: 28800, value: 1 }, // 08:00
          { timeOffsetSeconds: 64800, value: 0 }, // 18:00
        ],
      },
      {
        id: "prof-normal-temp-open",
        zoneId: "zone-open-office",
        variable: "temperature_c",
        unit: "°C",
        interpolation: "linear",
        points: [
          { timeOffsetSeconds: 0, value: 23.0 },
          { timeOffsetSeconds: 43200, value: 23.5 },
          { timeOffsetSeconds: 86400, value: 23.0 },
        ],
      },
      {
        id: "prof-normal-daylight-open",
        zoneId: "zone-open-office",
        variable: "daylight_lux",
        unit: "lx",
        interpolation: "linear",
        points: [
          { timeOffsetSeconds: 0, value: 0 },
          { timeOffsetSeconds: 28800, value: 120 },
          { timeOffsetSeconds: 43200, value: 250 },
          { timeOffsetSeconds: 64800, value: 30 },
          { timeOffsetSeconds: 86400, value: 0 },
        ],
      },
    ],
    events: [
      {
        atSecond: 5,
        zoneId: "zone-open-office",
        changes: { daylightLux: 280 },
        description: "Daylight slightly rises to 280 lux.",
      },
    ],
    deviceBindings: [],
    controllerConfig: {
      daylightHarvestingEnabled: true,
      absenceShutdownMinutes: 10,
      comfortBandMinC: 21,
      comfortBandMaxC: 25,
      preconditioningLeadMinutes: 30,
    },
  },
  {
    schemaVersion: 2,
    id: "high-daylight",
    name: "High Daylight",
    description:
      "Solar peak: natural daylight reaches 680 lux, Witmind harvests daylight by reducing artificial lighting to 35%, generating ~94W instantaneous savings.",
    parentId: null,
    time: {
      timezone: "UTC",
      startLocalTime: "11:30",
      durationSeconds: 86400,
      defaultStepSeconds: 60,
    },
    zones: [
      {
        id: "zone-open-office",
        zoneKey: "zone-open-office",
        name: "Open Office",
        type: "office",
        config: {
          targetLux: 500,
          targetTemperature: 23.0,
          nominalPowerW: 144,
          lightingModel: "legacy-linear-v1",
        },
      },
      {
        id: "zone-showroom",
        zoneKey: "zone-showroom",
        name: "Showroom",
        type: "showroom",
        config: {
          targetLux: 600,
          targetTemperature: 23.0,
          nominalPowerW: 240,
          lightingModel: "legacy-linear-v1",
        },
      },
    ],
    profiles: [
      {
        id: "prof-highday-daylight-open",
        zoneId: "zone-open-office",
        variable: "daylight_lux",
        unit: "lx",
        interpolation: "linear",
        points: [
          { timeOffsetSeconds: 0, value: 120 },
          { timeOffsetSeconds: 3600, value: 680 },
          { timeOffsetSeconds: 7200, value: 450 },
        ],
      },
    ],
    events: [
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
    deviceBindings: [],
    controllerConfig: {
      daylightHarvestingEnabled: true,
      absenceShutdownMinutes: 10,
      comfortBandMinC: 21,
      comfortBandMaxC: 25,
      preconditioningLeadMinutes: 30,
    },
  },
  {
    schemaVersion: 2,
    id: "empty-office",
    name: "Empty Office",
    description:
      "Absence detection: Office becomes vacant. System dims to 20% at 5 min courtesy, then shuts down at 10 min.",
    parentId: null,
    time: {
      timezone: "UTC",
      startLocalTime: "14:00",
      durationSeconds: 86400,
      defaultStepSeconds: 60,
    },
    zones: [
      {
        id: "zone-open-office",
        zoneKey: "zone-open-office",
        name: "Open Office",
        type: "office",
        config: {
          targetLux: 500,
          targetTemperature: 23.0,
          nominalPowerW: 144,
          lightingModel: "legacy-linear-v1",
        },
      },
    ],
    profiles: [],
    events: [
      {
        atSecond: 1,
        zoneId: "zone-open-office",
        changes: { occupied: false, absenceMinutes: 1 },
      },
      {
        atSecond: 5,
        zoneId: "zone-open-office",
        changes: { absenceMinutes: 5, brightnessOverride: 20 },
        activityEvent: {
          category: "lighting",
          title: "Lighting dimmed (Absence courtesy)",
          reason: "No occupancy detected for 5 minutes.",
          action: "Lighting dimmed to 20% courtesy level.",
          wattsSaved: 115,
        },
      },
      {
        atSecond: 10,
        zoneId: "zone-open-office",
        changes: { absenceMinutes: 10, brightnessOverride: 0 },
        activityEvent: {
          category: "lighting",
          title: "Lighting off (Absence timeout)",
          reason: "No occupancy detected for 10 minutes.",
          action: "Lighting turned off.",
          wattsSaved: 144,
        },
      },
    ],
    deviceBindings: [],
    controllerConfig: {
      daylightHarvestingEnabled: true,
      absenceShutdownMinutes: 10,
      comfortBandMinC: 21,
      comfortBandMaxC: 25,
      preconditioningLeadMinutes: 30,
    },
  },
  {
    schemaVersion: 2,
    id: "meeting",
    name: "Meeting Preconditioning",
    description:
      "Smart HVAC Preconditioning: Meeting Room A temperature reaches target (21.5°C) 10 min before 15:00 meeting.",
    parentId: null,
    time: {
      timezone: "UTC",
      startLocalTime: "14:20",
      durationSeconds: 86400,
      defaultStepSeconds: 60,
    },
    zones: [
      {
        id: "zone-meeting-a",
        zoneKey: "zone-meeting-a",
        name: "Meeting Room A",
        type: "meeting",
        config: {
          targetLux: 500,
          targetTemperature: 21.5,
          nominalPowerW: 96,
          lightingModel: "legacy-linear-v1",
        },
      },
    ],
    profiles: [],
    events: [
      {
        atSecond: 3,
        zoneId: "zone-meeting-a",
        changes: { targetTemperature: 21.5 },
        activityEvent: {
          category: "climate",
          title: "HVAC Preconditioning started",
          reason: "Board sync meeting scheduled at 15:00 (in 30 mins).",
          action: "Cooling room from 24.2°C to 21.5°C.",
        },
      },
    ],
    deviceBindings: [],
    controllerConfig: {
      daylightHarvestingEnabled: true,
      absenceShutdownMinutes: 10,
      comfortBandMinC: 21,
      comfortBandMaxC: 25,
      preconditioningLeadMinutes: 30,
    },
  },
  {
    schemaVersion: 2,
    id: "after-hours",
    name: "After Hours Sweep",
    description:
      "Automated end-of-day security sweep: shuts down all lighting and climate setbacks across unoccupied zones.",
    parentId: null,
    time: {
      timezone: "UTC",
      startLocalTime: "20:00",
      durationSeconds: 86400,
      defaultStepSeconds: 60,
    },
    zones: [
      {
        id: "zone-open-office",
        zoneKey: "zone-open-office",
        name: "Open Office",
        type: "office",
        config: {
          targetLux: 500,
          targetTemperature: 24.5,
          nominalPowerW: 144,
          lightingModel: "legacy-linear-v1",
        },
      },
    ],
    profiles: [],
    events: [
      {
        atSecond: 2,
        zoneId: "zone-open-office",
        changes: { occupied: false, absenceMinutes: 30, brightnessOverride: 0 },
        activityEvent: {
          category: "system",
          title: "After-hours security sweep",
          reason: "Building scheduled closing sweep at 20:00.",
          action: "Turned off all remaining zone luminaires and applied HVAC setback.",
        },
      },
    ],
    deviceBindings: [],
    controllerConfig: {
      daylightHarvestingEnabled: true,
      absenceShutdownMinutes: 10,
      comfortBandMinC: 21,
      comfortBandMaxC: 25,
      preconditioningLeadMinutes: 30,
    },
  },
];
