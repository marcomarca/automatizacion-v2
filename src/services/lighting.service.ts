import type { ControlMode, LightingState } from "../models";
import type { PhysicalCurve } from "../models/scenario";
import { DimmerModelService } from "./dimmer-model.service";
import { LightingControllerService } from "./lighting-controller.service";
import { LightingPlantService } from "./lighting-plant.service";

/**
 * Pure rule engine for Daylight Harvesting (backward compatibility helper)
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
 * Pure rule engine for Absence / Vacancy Dimming (backward compatibility helper)
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
  fixtureCount?: number;
  lightingModel?: "legacy-linear-v1" | "curve-based";
  dimmerCurve?: PhysicalCurve | null;
  powerCurve?: PhysicalCurve | null;
  luxCurve?: PhysicalCurve | null;
}

/**
 * Computes full LightingState v2 combining Controller -> Dimmer -> Plant pipeline
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
    fixtureCount,
    lightingModel,
    dimmerCurve,
    powerCurve,
    luxCurve,
  } = params;

  // 1. Controller step
  const command = LightingControllerService.evaluateCommand({
    occupied,
    absenceMinutes,
    daylightLux,
    targetLux,
    mode,
    manualBrightnessPct: manualBrightness,
  });

  // 2. Dimmer / Driver step
  const dimmerState = DimmerModelService.evaluateDimmerState(
    command.requestedBrightnessPct,
    command.powerCommand,
    dimmerCurve,
  );

  // 3. Plant step
  const plantState = LightingPlantService.evaluatePlantState({
    requestedBrightnessPct: command.requestedBrightnessPct,
    driverCurrentMa: dimmerState.outputCurrentMa,
    nominalPowerW,
    fixtureCount: fixtureCount || 1,
    targetLux,
    lightingModel: lightingModel || "legacy-linear-v1",
    powerCurve,
    luxCurve,
  });

  const artificialLux = plantState.artificialLux;
  const currentLux = daylightLux + artificialLux;
  const baselinePowerW = occupied ? nominalPowerW : 0;

  // Target compliance check: when occupied, needs ~targetLux total or daylight exceeds it
  const withinTarget = occupied
    ? currentLux >= Math.round(targetLux * 0.9)
    : command.requestedBrightnessPct === 0;

  return {
    brightness: command.requestedBrightnessPct,
    requestedBrightnessPct: command.requestedBrightnessPct,
    powerCommand: command.powerCommand,
    targetLux,
    currentLux,
    daylightLux,
    artificialLux,
    dimmerVoltageV: dimmerState.controlVoltageV,
    driverCurrentMa: dimmerState.outputCurrentMa,
    nominalPowerW,
    fixturePowerW: plantState.fixturePowerW,
    actualPowerW: plantState.fixturePowerW,
    baselinePowerW,
    mode,
    withinTarget,
    manualOverrideUntil: manualOverrideUntil ?? null,
    modelInfo: {
      dimmerCurveId: dimmerCurve?.id || "curve-010v-to-dim-level",
      powerCurveId: powerCurve?.id || "curve-dim-level-to-power-w",
      luxCurveId: luxCurve?.id || "curve-dim-level-to-lux-2m",
    },
  };
}
