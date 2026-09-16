import { describe, expect, it } from "bun:test";
import { dimmingGuideTablePoints } from "../../../src/persistence/seed/dimming-reference.seed";
import { DimmerModelService } from "../../../src/services/dimmer-model.service";
import { LightingPlantService } from "../../../src/services/lighting-plant.service";
import { interpolateCurve } from "../../../src/simulation/interpolation";

describe("Mandatory Section 20 Dimming Simulation Guide Table (Reference Model)", () => {
  // 0-10V Table Point Verification
  const pts = dimmingGuideTablePoints;

  it("verifies 0.0V -> 0% -> 0 mA -> 0 W -> 0 lx in reference OFF row", () => {
    const row0 = pts.find((p) => p.voltageV === 0.0);
    expect(row0).toBeDefined();
    expect(row0?.levelPct).toBe(0);
    expect(row0?.currentMa).toBe(0);
    expect(row0?.powerW).toBe(0.0);
    expect(row0?.lux1m).toBe(0.0);
    expect(row0?.lux2m).toBe(0.0);
    expect(row0?.lux3m).toBe(0.0);
  });

  it("verifies 1.0V -> 10% -> 30 mA derived reference current", () => {
    const row1 = pts.find((p) => p.voltageV === 1.0);
    expect(row1?.levelPct).toBe(10);
    expect(row1?.currentMa).toBe(30);
    expect(row1?.powerW).toBe(4.8);
    expect(row1?.lux1m).toBe(160.0);
  });

  it("verifies 5.0V -> 50% -> 150 mA derived midpoint current", () => {
    const row5 = pts.find((p) => p.voltageV === 5.0);
    expect(row5?.levelPct).toBe(50);
    expect(row5?.currentMa).toBe(150);
    expect(row5?.powerW).toBe(24.0);
    expect(row5?.lux1m).toBe(800.0);
    expect(row5?.lux2m).toBe(202.0);
    expect(row5?.lux3m).toBe(91.0);
  });

  it("verifies 10.0V -> 100% -> 300 mA full load anchor", () => {
    const row10 = pts.find((p) => p.voltageV === 10.0);
    expect(row10?.levelPct).toBe(100);
    expect(row10?.currentMa).toBe(300);
    expect(row10?.powerW).toBe(48.0);
    expect(row10?.lux1m).toBe(1600.0);
    expect(row10?.lux2m).toBe(404.0);
    expect(row10?.lux3m).toBe(182.0);
  });

  it("interpolates derived midpoint power and lux for 5.0V (modelled reference)", () => {
    const powerPoints = pts.map((p) => ({ x: p.voltageV, y: p.powerW }));
    const lux1mPoints = pts.map((p) => ({ x: p.voltageV, y: p.lux1m }));

    expect(interpolateCurve(powerPoints, 5.0, "linear")).toBe(24.0);
    expect(interpolateCurve(lux1mPoints, 5.0, "linear")).toBe(800.0);
  });

  it("evaluates dimmer and plant services with reference guide curves", () => {
    // Controller command 50% brightness
    const dimmerState = DimmerModelService.evaluateDimmerState(50, "on");
    expect(dimmerState.controlVoltageV).toBe(5.0);
    expect(dimmerState.outputCurrentMa).toBe(150.0);

    const plantState = LightingPlantService.evaluatePlantState({
      requestedBrightnessPct: 50,
      driverCurrentMa: dimmerState.outputCurrentMa,
      nominalPowerW: 144, // 3 panels x 48W
      fixtureCount: 3,
      targetLux: 500,
      lightingModel: "curve-based",
      powerCurve: {
        id: "curve-power",
        name: "Power",
        inputVariable: "dim_level_pct",
        inputUnit: "%",
        outputVariable: "fixture_power_w",
        outputUnit: "W",
        interpolation: "linear",
        extrapolation: "clamp",
        status: "modelled",
        notes: "",
        points: pts.map((p) => ({ x: p.levelPct, y: p.powerW, sourceKind: "assumption" })),
      },
      luxCurve: {
        id: "curve-lux",
        name: "Lux @ 2m",
        inputVariable: "dim_level_pct",
        inputUnit: "%",
        outputVariable: "artificial_lux",
        outputUnit: "lx",
        interpolation: "linear",
        extrapolation: "clamp",
        status: "modelled",
        notes: "",
        points: pts.map((p) => ({ x: p.levelPct, y: p.lux2m, sourceKind: "interpolated" })),
      },
    });

    // 3 fixtures * 24.0W = 72.0W
    expect(plantState.fixturePowerW).toBe(72.0);
    // 202 lx
    expect(plantState.artificialLux).toBe(202);
  });
});
