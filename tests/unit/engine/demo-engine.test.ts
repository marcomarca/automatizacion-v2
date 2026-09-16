import { describe, expect, it } from "bun:test";
import { DemoEngine } from "../../../src/engine/demo-engine";
import { highDaylightScenario, meetingScenario } from "../../../src/mocks/scenarios";

describe("DemoEngine", () => {
  it("initializes with default scenario state", () => {
    const engine = new DemoEngine();
    const building = engine.getBuilding();
    expect(building.zones.length).toBeGreaterThan(0);
    expect(engine.getStatus()).toBe("idle");
  });

  it("loads high-daylight scenario and executes deterministic timeline", () => {
    const engine = new DemoEngine(highDaylightScenario);
    expect(engine.getCurrentScenario().id).toBe("high-daylight");

    // Before event: daylight is 120 lux
    const initialOffice = engine.getBuilding().zones.find((z) => z.id === "zone-open-office");
    expect(initialOffice?.lighting?.daylightLux).toBe(120);

    // Tick to second 1
    engine.tick();
    // Tick to second 2 (event triggers daylight = 680)
    engine.tick();

    const updatedOffice = engine.getBuilding().zones.find((z) => z.id === "zone-open-office");
    expect(updatedOffice?.lighting?.daylightLux).toBe(680);
    expect(updatedOffice?.lighting?.brightness).toBe(35);
    expect(updatedOffice?.lighting?.actualPowerW).toBeCloseTo(50.4, 1);

    // Activity was created
    const activities = engine.getActivities();
    expect(activities.length).toBeGreaterThan(1);
    expect(activities[0].title).toContain("Lighting optimized");
  });

  it("handles meeting scenario recommendation acceptance", () => {
    const engine = new DemoEngine(meetingScenario);
    const rec = engine.getRecommendation();
    expect(rec).not.toBeNull();
    expect(rec?.title).toContain("Quarterly Strategy Review");

    engine.acceptRecommendation();
    expect(engine.getRecommendation()).toBeNull();

    const activities = engine.getActivities();
    expect(activities[0].title).toBe("Preconditioning accepted");
  });
});
