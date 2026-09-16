import type { PhysicalCurve } from "../models/scenario";
import { interpolateCurve } from "../simulation/interpolation";

export interface DimmerState {
  controlVoltageV: number;
  outputCurrentMa: number;
}

export class DimmerModelService {
  /**
   * Converts requested brightness % and power command into analog dimmer control voltage (0-10V)
   * and driver output constant-current (0-300mA).
   */
  public static evaluateDimmerState(
    requestedBrightnessPct: number,
    powerCommand: "on" | "off",
    dimmerCurve?: PhysicalCurve | null,
    currentCurve?: PhysicalCurve | null,
  ): DimmerState {
    if (powerCommand === "off" || requestedBrightnessPct <= 0) {
      return {
        controlVoltageV: 0.0,
        outputCurrentMa: 0.0,
      };
    }

    const pct = Math.max(0, Math.min(100, requestedBrightnessPct));

    // Evaluate control voltage (0 to 10 V)
    let voltage = pct / 10;
    if (dimmerCurve?.points && dimmerCurve.points.length > 0) {
      try {
        // If curve maps level_pct -> voltage_v or voltage_v -> level_pct
        if (dimmerCurve.inputVariable === "dim_level_pct") {
          voltage = interpolateCurve(dimmerCurve.points, pct, dimmerCurve.interpolation, "clamp");
        } else if (dimmerCurve.outputVariable === "dim_level_pct") {
          // Invert mapping for voltage -> level: x=voltage, y=level
          // Find voltage that matches pct
          const sorted = [...dimmerCurve.points].sort((a, b) => a.y - b.y);
          const invertedPoints = sorted.map((p) => ({ x: p.y, y: p.x }));
          voltage = interpolateCurve(invertedPoints, pct, dimmerCurve.interpolation, "clamp");
        }
      } catch {
        voltage = pct / 10;
      }
    }

    // Evaluate output constant current (0 to 300 mA)
    let currentMa = 300 * (pct / 100);
    if (currentCurve?.points && currentCurve.points.length > 0) {
      try {
        currentMa = interpolateCurve(currentCurve.points, pct, currentCurve.interpolation, "clamp");
      } catch {
        currentMa = 300 * (pct / 100);
      }
    }

    return {
      controlVoltageV: Number(voltage.toFixed(2)),
      outputCurrentMa: Number(currentMa.toFixed(1)),
    };
  }
}
