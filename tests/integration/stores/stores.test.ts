import { describe, expect, it } from "bun:test";
import {
  ActivityStore,
  BuildingStore,
  ClimateStore,
  EnergyStore,
  demoStore,
} from "../../../src/stores";

describe("Reactive Stores Integration", () => {
  it("synchronizes updates across BuildingStore, EnergyStore, and ActivityStore", () => {
    let notified = 0;
    const unsubscribe = BuildingStore.subscribe(() => {
      notified++;
    });

    demoStore.selectScenario("high-daylight");
    expect(notified).toBeGreaterThan(0);

    const building = BuildingStore.getBuilding();
    expect(building.zones.length).toBeGreaterThan(0);

    const energy = EnergyStore.getOverview();
    expect(energy.energyBaselineKwh).toBeGreaterThan(0);

    const activities = ActivityStore.getActivities();
    expect(activities.length).toBeGreaterThan(0);

    unsubscribe();
  });

  it("handles climate recommendations through ClimateStore", () => {
    demoStore.selectScenario("meeting");
    const rec = ClimateStore.getRecommendation();
    expect(rec).not.toBeNull();

    ClimateStore.acceptRecommendation();
    expect(ClimateStore.getRecommendation()).toBeNull();
  });
});
