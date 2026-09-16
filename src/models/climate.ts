export interface ClimateState {
  currentTemperature: number;
  targetTemperature: number;
  minComfortTemperature: number;
  maxComfortTemperature: number;
  mode: "auto" | "manual" | "off";
  withinTarget: boolean;
  timeWithinTargetPercent: number;
  manualOverrideUntil?: string | null;
}
