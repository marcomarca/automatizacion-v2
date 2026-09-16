import type { ControlMode, LightingState } from "../models";
import { calculateActualPowerW } from "./energy.service";

/**
 * Pure rule engine for Daylight Harvesting
 */
export function calculateDaylightHarvestingBrightness(daylightLux: number): number {
  if (daylightLux < 150) return 100;
  if (daylightLux < 300) return 75;
  if (daylightLux < 400) return 55;
  if (daylightLux < 450) return 35;
  if (daylightLux < 500) return 15;
  return 0;
}

/**
 * Pure rule engine for Absence / Vacancy Dimming
 */
export function calculateAbsenceBrightness(
  absenceMinutes: number,
  currentBrightness: number,
): number {
  if (absenceMinutes < 5) return currentBrightness;
  if (absenceMinutes < 10) return 20;
  return 0;
}

export interface CalculateLightingParams {
  occupied: boolean;
  absenceMinutes: number;
  daylightLux: number;
  targetLux: number;
  nominalPowerW: number;
  mode: ControlMode;
  manualBrightness?: number;
  manualOverrideUntil?: string | null;
}

/**
 * Computes full LightingState based on domain rules
 */
export function calculateLightingState(params: CalculateLightingParams): LightingState {
  const {
    occupied,
    absenceMinutes,
    daylightLux,
    targetLux,
    nominalPowerW,
    mode,
    manualBrightness,
    manualOverrideUntil,
  } = params;

  let brightness: number;

  if (manualBrightness !== undefined) {
    brightness = manualBrightness;
  } else if (!occupied) {
    brightness = calculateAbsenceBrightness(absenceMinutes, 75);
  } else {
    brightness = calculateDaylightHarvestingBrightness(daylightLux);
  }

  const actualPowerW = calculateActualPowerW(nominalPowerW, brightness);
  const baselinePowerW = occupied ? nominalPowerW : 0;

  const artificialLux = Math.round((brightness / 100) * targetLux);
  const currentLux = daylightLux + artificialLux;

  // Target compliance check: when occupied, needs ~targetLux total or daylight exceeds it
  const withinTarget = occupied ? currentLux >= Math.round(targetLux * 0.9) : brightness === 0;

  return {
    brightness,
    targetLux,
    currentLux,
    daylightLux,
    nominalPowerW,
    actualPowerW,
    baselinePowerW,
    mode,
    withinTarget,
    manualOverrideUntil: manualOverrideUntil ?? null,
  };
}
