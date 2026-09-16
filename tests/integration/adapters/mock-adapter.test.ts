import { describe, expect, it } from "bun:test";
import { MockAdapter } from "../../../src/api/adapters/mock.adapter";
import { DemoEngine } from "../../../src/engine/demo-engine";
import { normalDayScenario } from "../../../src/mocks/scenarios";

describe("MockAdapter", () => {
  it("implements WitmindDataAdapter contract correctly", async () => {
    const engine = new DemoEngine(normalDayScenario);
    const adapter = new MockAdapter(engine);

    const building = await adapter.getBuilding();
    expect(building.name).toBe("Witmind HQ - Smart Office");

    const energy = await adapter.getEnergyOverview();
    expect(energy.energyBaselineKwh).toBeGreaterThan(0);

    const activities = await adapter.getActivities();
    expect(activities.length).toBeGreaterThan(0);

    const lightingZones = await adapter.getLightingZones();
    expect(lightingZones.length).toBeGreaterThan(0);

    const climateZones = await adapter.getClimateZones();
    expect(climateZones.length).toBeGreaterThan(0);
  });
});
