import type { SimulationInput } from "../api/contracts/data-adapter";
import type { ZoneType } from "../models";

export interface ScenarioZoneConfig {
  id: string;
  name: string;
  type: ZoneType;
  occupied: boolean;
  absenceMinutes: number;
  daylightLux: number;
  targetLux: number;
  nominalPowerW: number;
  currentTemperature: number;
  targetTemperature: number;
}

export interface ScenarioInitialState {
  zones: ScenarioZoneConfig[];
  energy: {
    energyBaselineKwh: number;
    energyActualKwh: number;
    automatedActions: number;
  };
  upcomingMeeting?: {
    title: string;
    scheduledAt: string;
    zoneId: string;
    roomTemperature: number;
  } | null;
}

export interface DemoTimelineEvent {
  atSecond: number;
  zoneId?: string;
  changes: Partial<SimulationInput>;
  activityEvent?: {
    category: "energy" | "lighting" | "climate" | "occupancy" | "system";
    title: string;
    reason: string;
    action: string;
    wattsSaved?: number;
  };
  description?: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  initialClockTime: string;
  initialState: ScenarioInitialState;
  timeline: DemoTimelineEvent[];
}
