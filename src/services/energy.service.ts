/**
 * Pure functions for energy modeling and power calculations
 */

export function calculateActualPowerW(nominalPowerW: number, brightness: number): number {
  const clampedBrightness = Math.max(0, Math.min(100, brightness));
  return Number(((nominalPowerW * clampedBrightness) / 100).toFixed(1));
}

export function calculateSavedPowerW(baselinePowerW: number, actualPowerW: number): number {
  return Number(Math.max(0, baselinePowerW - actualPowerW).toFixed(1));
}

export function calculateSavingsPercent(baselinePowerW: number, actualPowerW: number): number {
  if (baselinePowerW <= 0) return 0;
  const saved = Math.max(0, baselinePowerW - actualPowerW);
  return Number(((saved / baselinePowerW) * 100).toFixed(1));
}

export function calculateEnergyKwh(powerW: number, hours: number): number {
  return Number(((powerW * hours) / 1000).toFixed(2));
}

export function calculateMoneySaved(savedKwh: number, ratePerKwh = 0.18): number {
  return Number((savedKwh * ratePerKwh).toFixed(2));
}
