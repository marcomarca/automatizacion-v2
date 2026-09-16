import type { ZoneType } from "./zone";

export interface ScenarioZoneDefinition {
  id: string;
  zoneKey: string;
  name: string;
  type: ZoneType;
  config: {
    targetLux?: number;
    targetTemperature?: number;
    nominalPowerW?: number;
    fixtureCount?: number;
    lightingModel?: "legacy-linear-v1" | "curve-based";
    dimmerCurveId?: string;
    powerCurveId?: string;
    luxCurveId?: string;
    [key: string]: unknown;
  };
}

export interface ScenarioProfilePoint {
  timeOffsetSeconds: number; // 0 to 86400
  value: number;
}

export interface ScenarioProfileDefinition {
  id: string;
  zoneId: string;
  variable: "occupancy" | "temperature_c" | "daylight_lux" | string;
  unit: string;
  interpolation: "step" | "linear";
  points: ScenarioProfilePoint[];
}

export interface ScenarioDeviceBinding {
  id: string;
  zoneId: string;
  role: string;
  deviceProfileId: string;
  quantity: number;
  config?: Record<string, unknown>;
}

export interface ControllerConfig {
  daylightHarvestingEnabled: boolean;
  absenceShutdownMinutes: number;
  comfortBandMinC: number;
  comfortBandMaxC: number;
  preconditioningLeadMinutes: number;
}

export interface ScenarioEvent {
  atSecond: number;
  zoneId?: string;
  changes: Record<string, unknown>;
  description?: string;
  activityEvent?: {
    category: "energy" | "lighting" | "climate" | "occupancy" | "system";
    title: string;
    reason: string;
    action: string;
    wattsSaved?: number;
  };
}

export interface ScenarioDefinition {
  schemaVersion: 2;
  id: string;
  name: string;
  description: string;
  parentId?: string | null;
  time: {
    timezone: string;
    startLocalTime: string;
    durationSeconds: number;
    defaultStepSeconds: number;
  };
  zones: ScenarioZoneDefinition[];
  profiles: ScenarioProfileDefinition[];
  events: ScenarioEvent[];
  deviceBindings: ScenarioDeviceBinding[];
  controllerConfig: ControllerConfig;
}

export interface SourceReference {
  id: string;
  sourceKind:
    | "manufacturer_published"
    | "manufacturer_graph"
    | "third_party_datasheet"
    | "community_report"
    | "user_supplied"
    | "user_measured"
    | "interpolated"
    | "assumption"
    | "legacy_model";
  title: string;
  publisher?: string | null;
  url?: string | null;
  retrievedAt?: string | null;
  notes: string;
}

export interface DeviceProfile {
  id: string;
  deviceType:
    | "led_panel"
    | "led_driver"
    | "lux_sensor"
    | "temperature_sensor"
    | "occupancy_sensor"
    | string;
  manufacturer?: string | null;
  model?: string | null;
  name: string;
  config: Record<string, unknown>;
  sourceReferenceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurvePoint {
  id?: string;
  curveId?: string;
  x: number;
  y: number;
  sourceKind: SourceReference["sourceKind"];
  sourceReferenceId?: string | null;
  notes?: string;
}

export interface PhysicalCurve {
  id: string;
  deviceProfileId?: string | null;
  name: string;
  inputVariable: string;
  inputUnit: string;
  outputVariable: string;
  outputUnit: string;
  interpolation: "linear" | "step";
  extrapolation: "clamp";
  status: "measured" | "published" | "derived" | "modelled" | "legacy";
  sourceReferenceId?: string | null;
  notes: string;
  points: CurvePoint[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RunSummary {
  actualEnergyKwh: number;
  baselineEnergyKwh: number;
  savedEnergyKwh: number;
  savingsPercent: number;
  averageOccupiedLux: number;
  minutesBelowLuxTarget: number;
  peakPowerW: number;
  occupiedComfortPercent: number;
  automatedActions: number;
}

export interface SimulationRun {
  id: string;
  scenarioId: string;
  scenarioSnapshotJson: string;
  engineVersion: string;
  startedAt: string;
  completedAt?: string | null;
  stepSeconds: number;
  status: "running" | "completed" | "aborted";
  resultSummaryJson?: string | null;
  summary?: RunSummary | null;
}

export interface SimulationSample {
  id?: number | string;
  runId: string;
  simTimeSeconds: number;
  zoneKey: string;
  occupied: number;
  occupancyCount?: number | null;
  temperatureC?: number | null;
  daylightLux?: number | null;
  requestedBrightnessPct?: number | null;
  dimmerVoltageV?: number | null;
  driverCurrentMa?: number | null;
  fixturePowerW?: number | null;
  artificialLux?: number | null;
  totalLux?: number | null;
  baselinePowerW?: number | null;
  energyActualKwh?: number | null;
  energyBaselineKwh?: number | null;
}

export interface RunActivity {
  id: string;
  runId: string;
  simTimeSeconds: number;
  zoneKey?: string | null;
  category: string;
  title: string;
  reason: string;
  action: string;
  impactJson?: string | null;
}
