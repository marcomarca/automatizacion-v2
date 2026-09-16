import type { PhysicalCurve } from "../models/scenario";
import { interpolateCurve } from "../simulation/interpolation";

export interface LightingPlantInput {
  requestedBrightnessPct: number;
  driverCurrentMa: number;
  nominalPowerW: number;
  fixtureCount?: number;
  targetLux: number;
  lightingModel?: "legacy-linear-v1" | "curve-based";
  powerCurve?: PhysicalCurve | null;
  luxCurve?: PhysicalCurve | null;
}

export interface LightingPlantState {
  fixturePowerW: number;
  artificialLux: number;
}

export class LightingPlantService {
  /**
   * Evaluates physical luminaire optical output and electrical power consumption.
   */
  public static evaluatePlantState(input: LightingPlantInput): LightingPlantState {
    const pct = Math.max(0, Math.min(100, input.requestedBrightnessPct));
    if (pct <= 0 || input.driverCurrentMa <= 0) {
      return {
        fixturePowerW: 0.0,
        artificialLux: 0.0,
      };
    }

    // 1. Legacy linear compatibility model
    if (input.lightingModel === "legacy-linear-v1" || !input.powerCurve) {
      const powerW = (input.nominalPowerW * pct) / 100;
      const lux = (input.targetLux * pct) / 100;
      return {
        fixturePowerW: Number(powerW.toFixed(1)),
        artificialLux: Math.round(lux),
      };
    }

    // 2. Physical curve-based plant model
    const fixtures = input.fixtureCount || 1;

    // Power calculation
    let powerW = (input.nominalPowerW * pct) / 100;
    if (input.powerCurve?.points && input.powerCurve.points.length > 0) {
      try {
        const singleFixtureW = interpolateCurve(
          input.powerCurve.points,
          pct,
          input.powerCurve.interpolation,
          "clamp",
        );
        powerW = singleFixtureW * fixtures;
      } catch {
        powerW = (input.nominalPowerW * pct) / 100;
      }
    }

    // Artificial lux calculation
    let artificialLux = (input.targetLux * pct) / 100;
    if (input.luxCurve?.points && input.luxCurve.points.length > 0) {
      try {
        artificialLux = interpolateCurve(
          input.luxCurve.points,
          pct,
          input.luxCurve.interpolation,
          "clamp",
        );
      } catch {
        artificialLux = (input.targetLux * pct) / 100;
      }
    }

    return {
      fixturePowerW: Number(powerW.toFixed(1)),
      artificialLux: Math.round(artificialLux),
    };
  }
}
