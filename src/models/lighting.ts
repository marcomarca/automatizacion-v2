export type ControlMode = "auto" | "manual";

export interface LightingState {
  brightness: number; // 0 to 100%
  targetLux: number; // Desired total illuminance (e.g. 500 lux)
  currentLux: number; // Resulting total illuminance
  daylightLux: number; // Measured solar contribution
  nominalPowerW: number; // Max power capacity (e.g. 144W)
  actualPowerW: number; // Current power consumed
  baselinePowerW: number; // Power consumed without optimization
  mode: ControlMode;
  withinTarget: boolean;
  manualOverrideUntil?: string | null;
}
