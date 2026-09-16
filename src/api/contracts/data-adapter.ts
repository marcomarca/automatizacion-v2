import type { Building, OptimizationImpact, SmartActivity, Zone } from "../../models";

export interface SimulationInput {
  occupied?: boolean;
  daylightLux?: number;
  currentTemperature?: number;
  targetTemperature?: number;
  brightnessOverride?: number;
  mode?: "auto" | "manual";
  climateMode?: "auto" | "manual" | "off";
  absenceMinutes?: number;
}

export interface WitmindDataAdapter {
  getBuilding(): Promise<Building>;
  getEnergyOverview(): Promise<OptimizationImpact>;
  getActivities(): Promise<SmartActivity[]>;
  getLightingZones(): Promise<Zone[]>;
  getClimateZones(): Promise<Zone[]>;
  applyScenario(id: string): Promise<void>;
  updateSimulationInput(zoneId: string, input: SimulationInput): Promise<void>;
}
