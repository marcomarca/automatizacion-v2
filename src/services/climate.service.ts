import type { ClimateState } from "../models";

export function isTemperatureWithinTarget(
  current: number,
  minComfort: number,
  maxComfort: number,
): boolean {
  return current >= minComfort && current <= maxComfort;
}

export interface PreconditioningCheckParams {
  minutesUntilMeeting: number;
  currentTemp: number;
  minComfort: number;
  maxComfort: number;
}

export function checkPreconditioningNeeded(params: PreconditioningCheckParams): boolean {
  const { minutesUntilMeeting, currentTemp, minComfort, maxComfort } = params;
  if (minutesUntilMeeting > 15 || minutesUntilMeeting < 0) return false;
  return !isTemperatureWithinTarget(currentTemp, minComfort, maxComfort);
}

export function stepTemperatureTowardsTarget(current: number, target: number, step = 0.3): number {
  if (Math.abs(current - target) <= step) {
    return target;
  }
  if (current > target) {
    return Number((current - step).toFixed(1));
  }
  return Number((current + step).toFixed(1));
}

export interface CalculateClimateParams {
  currentTemperature: number;
  targetTemperature?: number;
  minComfortTemperature?: number;
  maxComfortTemperature?: number;
  mode?: "auto" | "manual" | "off";
  timeWithinTargetPercent?: number;
  manualOverrideUntil?: string | null;
}

export function calculateClimateState(params: CalculateClimateParams): ClimateState {
  const targetTemperature = params.targetTemperature ?? 23.0;
  const minComfortTemperature = params.minComfortTemperature ?? 22.0;
  const maxComfortTemperature = params.maxComfortTemperature ?? 24.0;
  const mode = params.mode ?? "auto";
  const currentTemperature = params.currentTemperature;

  const withinTarget = isTemperatureWithinTarget(
    currentTemperature,
    minComfortTemperature,
    maxComfortTemperature,
  );

  return {
    currentTemperature,
    targetTemperature,
    minComfortTemperature,
    maxComfortTemperature,
    mode,
    withinTarget,
    timeWithinTargetPercent: params.timeWithinTargetPercent ?? (withinTarget ? 92 : 68),
    manualOverrideUntil: params.manualOverrideUntil ?? null,
  };
}
