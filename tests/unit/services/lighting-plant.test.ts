import { describe, expect, it } from "bun:test";
import { DimmerModelService } from "../../../src/services/dimmer-model.service";
import { LightingControllerService } from "../../../src/services/lighting-controller.service";
import { LightingPlantService } from "../../../src/services/lighting-plant.service";

describe("Decoupled Lighting Architecture — Controller vs Plant Separation", () => {
  it("Controller outputs requested brightness % without fabricating watts or lux", () => {
    const cmd = LightingControllerService.evaluateCommand({
      occupied: true,
      absenceMinutes: 0,
      daylightLux: 350,
      targetLux: 500,
      mode: "auto",
    });

    // 350 lux daylight falls into 300-399 lux band -> 55%
    expect(cmd.requestedBrightnessPct).toBe(55);
    expect(cmd.powerCommand).toBe("on");
    // Assert controller does not have power or lux fields
    expect((cmd as unknown as Record<string, unknown>).actualPowerW).toBeUndefined();
    expect((cmd as unknown as Record<string, unknown>).artificialLux).toBeUndefined();
  });

  it("Dimmer model converts brightness command to analog voltage and driver current", () => {
    const dimmerState = DimmerModelService.evaluateDimmerState(55, "on");
    expect(dimmerState.controlVoltageV).toBe(5.5);
    expect(dimmerState.outputCurrentMa).toBe(165.0); // 300 * 0.55
  });

  it("Lighting plant model evaluates optical and electrical load from driver current", () => {
    const plant = LightingPlantService.evaluatePlantState({
      requestedBrightnessPct: 55,
      driverCurrentMa: 165.0,
      nominalPowerW: 48,
      fixtureCount: 1,
      targetLux: 500,
      lightingModel: "legacy-linear-v1",
    });

    expect(plant.fixturePowerW).toBe(26.4); // 48 * 0.55
    expect(plant.artificialLux).toBe(275); // 500 * 0.55
  });
});
