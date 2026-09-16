import { describe, expect, it } from "bun:test";
import { DemoEngine } from "../../../src/engine/demo-engine";
import { referenceOfficeDayV2Seed } from "../../../src/persistence/seed/reference-office-day-v2.seed";

describe("Engine Determinism & Fast 24-Hour Simulation", () => {
  it("produces strictly identical telemetry outputs across repeated runs of same scenario", async () => {
    const engine1 = new DemoEngine(referenceOfficeDayV2Seed);
    const engine2 = new DemoEngine(referenceOfficeDayV2Seed);

    const samples1 = await engine1.runFullDayFast(60);
    const samples2 = await engine2.runFullDayFast(60);

    expect(samples1.length).toBe(samples2.length);
    expect(samples1.length).toBe(1440 * 2); // 1440 minutes * 2 zones = 2880 samples

    for (let i = 0; i < samples1.length; i++) {
      expect(samples1[i].simTimeSeconds).toBe(samples2[i].simTimeSeconds);
      expect(samples1[i].zoneKey).toBe(samples2[i].zoneKey);
      expect(samples1[i].dimmerVoltageV).toBe(samples2[i].dimmerVoltageV);
      expect(samples1[i].fixturePowerW).toBe(samples2[i].fixturePowerW);
      expect(samples1[i].totalLux).toBe(samples2[i].totalLux);
    }

    const energy1 = engine1.getEnergy();
    const energy2 = engine2.getEnergy();
    expect(energy1.energyActualKwh).toBe(energy2.energyActualKwh);
    expect(energy1.energySavedKwh).toBe(energy2.energySavedKwh);
  });
});
