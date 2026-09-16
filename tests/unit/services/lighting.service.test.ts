import { describe, expect, it } from "bun:test";
import {
  calculateAbsenceBrightness,
  calculateDaylightHarvestingBrightness,
  calculateLightingState,
} from "../../../src/services/lighting.service";

describe("LightingService", () => {
  describe("Daylight Harvesting rules", () => {
    it("returns 100% brightness for daylight < 150 lux", () => {
      expect(calculateDaylightHarvestingBrightness(50)).toBe(100);
      expect(calculateDaylightHarvestingBrightness(149)).toBe(100);
    });

    it("returns 75% brightness for daylight between 150 and 299 lux", () => {
      expect(calculateDaylightHarvestingBrightness(150)).toBe(75);
      expect(calculateDaylightHarvestingBrightness(250)).toBe(75);
      expect(calculateDaylightHarvestingBrightness(299)).toBe(75);
    });

    it("returns 55% brightness for daylight between 300 and 399 lux", () => {
      expect(calculateDaylightHarvestingBrightness(300)).toBe(55);
      expect(calculateDaylightHarvestingBrightness(350)).toBe(55);
    });

    it("returns 35% brightness for daylight between 400 and 449 lux", () => {
      expect(calculateDaylightHarvestingBrightness(400)).toBe(35);
      expect(calculateDaylightHarvestingBrightness(449)).toBe(35);
    });

    it("returns 15% brightness for daylight between 450 and 499 lux", () => {
      expect(calculateDaylightHarvestingBrightness(450)).toBe(15);
      expect(calculateDaylightHarvestingBrightness(499)).toBe(15);
    });

    it("returns 0% (or minimum) for daylight >= 500 lux", () => {
      expect(calculateDaylightHarvestingBrightness(500)).toBe(0);
      expect(calculateDaylightHarvestingBrightness(680)).toBe(0);
    });
  });

  describe("Absence Rules", () => {
    it("preserves current level if absence < 5 min", () => {
      expect(calculateAbsenceBrightness(3, 75)).toBe(75);
    });

    it("reduces brightness to 20% if 5 <= absence < 10 min", () => {
      expect(calculateAbsenceBrightness(5, 75)).toBe(20);
      expect(calculateAbsenceBrightness(8, 75)).toBe(20);
    });

    it("turns off brightness (0%) if absence >= 10 min", () => {
      expect(calculateAbsenceBrightness(10, 75)).toBe(0);
      expect(calculateAbsenceBrightness(25, 75)).toBe(0);
    });
  });

  describe("Full Lighting State calculation", () => {
    it("computes complete lighting state with daylight harvesting and power metrics", () => {
      const state = calculateLightingState({
        occupied: true,
        absenceMinutes: 0,
        daylightLux: 680,
        targetLux: 500,
        nominalPowerW: 144,
        mode: "auto",
      });

      expect(state.brightness).toBe(0);
      expect(state.actualPowerW).toBe(0);
      expect(state.baselinePowerW).toBe(144);
      expect(state.currentLux).toBe(680);
      expect(state.withinTarget).toBe(true);
    });
  });
});
