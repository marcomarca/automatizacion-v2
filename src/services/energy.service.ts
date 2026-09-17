import type { MockDevice } from "../models/device";

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

export function calculateDevicePower(device: MockDevice): number {
  if (device.powerState !== "on") return 0;
  return (
    device.actualPowerW ??
    calculateActualPowerW(device.nominalPowerW ?? 0, device.brightnessPct ?? 100)
  );
}

export function calculateSpacePower(devices: MockDevice[]): {
  currentPowerW: number;
  nominalPowerW: number;
  savedPowerW: number;
  savingsPercent: number;
} {
  const nominal = devices.reduce((sum, d) => sum + (d.nominalPowerW ?? 0), 0);
  const current = devices.reduce((sum, d) => sum + calculateDevicePower(d), 0);
  const saved = calculateSavedPowerW(nominal, current);
  const savingsPercent = calculateSavingsPercent(nominal, current);

  return {
    currentPowerW: Number(current.toFixed(1)),
    nominalPowerW: Number(nominal.toFixed(1)),
    savedPowerW: saved,
    savingsPercent,
  };
}

export function calculateBuildingDevicePower(devices: MockDevice[]): {
  currentPowerW: number;
  nominalPowerW: number;
  savedPowerW: number;
  savingsPercent: number;
  activeDevicesCount: number;
  totalDevicesCount: number;
} {
  const spaceSummary = calculateSpacePower(devices);
  const activeCount = devices.filter((d) => d.powerState === "on").length;

  return {
    ...spaceSummary,
    activeDevicesCount: activeCount,
    totalDevicesCount: devices.length,
  };
}
