import type { ControlMode } from "../models/lighting";

export interface LightingControllerInput {
  occupied: boolean;
  absenceMinutes: number;
  daylightLux: number;
  targetLux: number;
  mode: ControlMode;
  manualBrightnessPct?: number | null;
  daylightHarvestingEnabled?: boolean;
}

export interface LightingCommand {
  requestedBrightnessPct: number;
  powerCommand: "on" | "off";
  reason: string;
}

export class LightingControllerService {
  /**
   * Pure controller decision logic.
   * Evaluates occupancy, absence rules, daylight harvesting, and manual overrides.
   * Never calculates watts or artificial lux directly.
   */
  public static evaluateCommand(input: LightingControllerInput): LightingCommand {
    // 1. Direct brightness override or manual mode takes precedence
    if (input.manualBrightnessPct !== undefined && input.manualBrightnessPct !== null) {
      const pct = Math.max(0, Math.min(100, input.manualBrightnessPct));
      return {
        requestedBrightnessPct: pct,
        powerCommand: pct > 0 ? "on" : "off",
        reason: "Manual operator override active",
      };
    }

    // 2. Unoccupied absence shutdown rules
    if (!input.occupied) {
      if (input.absenceMinutes >= 10) {
        return {
          requestedBrightnessPct: 0,
          powerCommand: "off",
          reason: "Absence timeout: unoccupied for >= 10 minutes",
        };
      }
      if (input.absenceMinutes >= 5) {
        return {
          requestedBrightnessPct: 20,
          powerCommand: "on",
          reason: "Courtesy dimming: unoccupied for >= 5 minutes",
        };
      }
    }

    // 3. Daylight harvesting policy
    if (input.daylightHarvestingEnabled !== false) {
      const daylight = input.daylightLux;
      if (daylight >= 500) {
        return {
          requestedBrightnessPct: 0,
          powerCommand: "off",
          reason: "Solar harvest: ambient daylight exceeds 500 lx threshold",
        };
      }
      if (daylight >= 450) {
        return {
          requestedBrightnessPct: 15,
          powerCommand: "on",
          reason: "Solar harvest: daylight between 450 and 499 lx",
        };
      }
      if (daylight >= 400) {
        return {
          requestedBrightnessPct: 35,
          powerCommand: "on",
          reason: "Solar harvest: daylight between 400 and 449 lx",
        };
      }
      if (daylight >= 300) {
        return {
          requestedBrightnessPct: 55,
          powerCommand: "on",
          reason: "Solar harvest: daylight between 300 and 399 lx",
        };
      }
      if (daylight >= 150) {
        return {
          requestedBrightnessPct: 75,
          powerCommand: "on",
          reason: "Solar harvest: daylight between 150 and 299 lx",
        };
      }
    }

    // 4. Baseline nominal output
    return {
      requestedBrightnessPct: 100,
      powerCommand: "on",
      reason: "Nominal output: daylight < 150 lx and area occupied",
    };
  }
}
