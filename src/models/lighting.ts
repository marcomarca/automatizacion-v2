export type ControlMode = "auto" | "manual";

export interface LightingState {
  /** Legacy alias for requestedBrightnessPct (0 to 100%) */
  brightness: number;
  /** Controller requested brightness percent (0 to 100%) */
  requestedBrightnessPct: number;
  /** Physical power switch command */
  powerCommand: "on" | "off";

  /** Desired total illuminance in zone (e.g. 500 lux) */
  targetLux: number;
  /** Measured / sampled solar daylight contribution */
  daylightLux: number;
  /** Artificial luminaire optical output */
  artificialLux: number;
  /** Resulting total illuminance (daylight + artificial) */
  currentLux: number;

  /** Analog 0-10V dimmer control voltage */
  dimmerVoltageV: number;
  /** LED driver constant current output in mA */
  driverCurrentMa: number;

  /** Max nominal power capacity */
  nominalPowerW: number;
  /** Modeled/measured fixture power */
  fixturePowerW: number;
  /** Actual power consumed (compatibility alias for fixturePowerW) */
  actualPowerW: number;
  /** Baseline unoptimized power */
  baselinePowerW: number;

  /** Control mode: auto or manual override */
  mode: ControlMode;
  /** True if total illuminance is within acceptable comfort band */
  withinTarget: boolean;
  /** Expiration timestamp for manual override if active */
  manualOverrideUntil?: string | null;

  /** Active physical curve bindings */
  modelInfo?: {
    dimmerCurveId: string;
    powerCurveId: string;
    luxCurveId: string;
  };
}
