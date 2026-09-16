import { describe, expect, it } from "bun:test";
import {
  calculateActualPowerW,
  calculateEnergyKwh,
  calculateMoneySaved,
  calculateSavedPowerW,
  calculateSavingsPercent,
} from "../../../src/services/energy.service";

describe("EnergyService", () => {
  it("calculates actual power accurately from nominal power and brightness", () => {
    expect(calculateActualPowerW(144, 100)).toBe(144);
    expect(calculateActualPowerW(144, 50)).toBe(72);
    expect(calculateActualPowerW(144, 35)).toBeCloseTo(50.4, 1);
    expect(calculateActualPowerW(144, 0)).toBe(0);
  });

  it("calculates saved power", () => {
    expect(calculateSavedPowerW(144, 50.4)).toBeCloseTo(93.6, 1);
    expect(calculateSavedPowerW(144, 144)).toBe(0);
  });

  it("calculates savings percentage with division by zero protection", () => {
    expect(calculateSavingsPercent(144, 72)).toBe(50);
    expect(calculateSavingsPercent(0, 0)).toBe(0);
  });

  it("calculates kWh and monetary savings", () => {
    expect(calculateEnergyKwh(1000, 2)).toBe(2);
    expect(calculateMoneySaved(10, 0.2)).toBe(2);
  });
});
