import { describe, expect, it } from "bun:test";
import { DemoEngine } from "../../src/engine/demo-engine";
import {
  afterHoursScenario,
  emptyOfficeScenario,
  highDaylightScenario,
  meetingScenario,
  normalDayScenario,
} from "../../src/mocks/scenarios";
import { demoStore } from "../../src/stores";

describe("E2E Deterministic Scenarios & State Coherence", () => {
  it("Flow A: High Daylight Scenario (Solar peak harvesting)", () => {
    const engine = new DemoEngine(highDaylightScenario);

    // Initial state check
    const initialOffice = engine.getBuilding().zones.find((z) => z.id === "zone-open-office");
    expect(initialOffice?.lighting?.daylightLux).toBe(120);

    // Tick to trigger solar rise event at second 2
    engine.tick();
    engine.tick();

    const updatedOffice = engine.getBuilding().zones.find((z) => z.id === "zone-open-office");
    expect(updatedOffice?.lighting?.daylightLux).toBe(680);
    expect(updatedOffice?.lighting?.brightness).toBe(35);
    expect(updatedOffice?.lighting?.actualPowerW).toBeCloseTo(50.4, 1);

    // Explainable activity generated
    const activities = engine.getActivities();
    const daylightAct = activities.find((a) => a.title.includes("Lighting optimized"));
    expect(daylightAct).toBeDefined();
    expect(daylightAct?.reason).toContain("680 lux");
    expect(daylightAct?.action).toContain("35%");
  });

  it("Flow B: Empty Office Scenario (5m courtesy dim -> 10m shutoff)", () => {
    const engine = new DemoEngine(emptyOfficeScenario);

    // Tick 2: Staff departure
    engine.tick();
    engine.tick();
    let office = engine.getBuilding().zones.find((z) => z.id === "zone-open-office");
    expect(office?.occupancy.occupied).toBe(false);

    // Tick 4: 5 min absence trigger (dim to 20%)
    engine.tick();
    engine.tick();
    office = engine.getBuilding().zones.find((z) => z.id === "zone-open-office");
    expect(office?.lighting?.brightness).toBe(20);

    // Tick 8: 10 min absence trigger (shutoff 0%)
    engine.tick();
    engine.tick();
    engine.tick();
    engine.tick();
    office = engine.getBuilding().zones.find((z) => z.id === "zone-open-office");
    expect(office?.lighting?.brightness).toBe(0);
    expect(office?.lighting?.actualPowerW).toBe(0);

    // Check activity explanations
    const activities = engine.getActivities();
    expect(activities.some((a) => a.title.includes("Courtesy dimming"))).toBe(true);
    expect(activities.some((a) => a.title.includes("Lighting shutoff"))).toBe(true);
  });

  it("Flow C: Meeting Preconditioning Scenario", () => {
    const engine = new DemoEngine(meetingScenario);

    // Recommendation active
    const rec = engine.getRecommendation();
    expect(rec).not.toBeNull();
    expect(rec?.title).toContain("Quarterly Strategy Review");

    // Accept preconditioning
    engine.acceptRecommendation();
    expect(engine.getRecommendation()).toBeNull();

    // Verify temperature modulated towards 23°C
    const meetingRoom = engine.getBuilding().zones.find((z) => z.id === "zone-meeting-a");
    expect(meetingRoom?.climate?.currentTemperature).toBeLessThan(26.1);
  });

  it("Flow D: After Hours Scenario (Night sweep shutoff)", () => {
    const engine = new DemoEngine(afterHoursScenario);

    // Tick 2: Sweep trigger
    engine.tick();
    engine.tick();

    const office = engine.getBuilding().zones.find((z) => z.id === "zone-open-office");
    expect(office?.lighting?.brightness).toBe(0);

    const activities = engine.getActivities();
    expect(activities.some((a) => a.title.includes("After-hours waste avoided"))).toBe(true);
  });

  it("Quality Gate: Error Simulation Mode toggle in DemoStore", () => {
    demoStore.selectScenario(normalDayScenario.id);
    expect(demoStore.isSimulatedError()).toBe(false);

    demoStore.setSimulatedError(true);
    expect(demoStore.isSimulatedError()).toBe(true);
    expect(() => demoStore.getBuilding()).toThrow();

    demoStore.setSimulatedError(false);
    expect(demoStore.isSimulatedError()).toBe(false);
    expect(demoStore.getBuilding().zones.length).toBeGreaterThan(0);
  });
});
