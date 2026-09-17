import { describe, expect, it } from "bun:test";
import { deviceStore } from "../../../src/stores/device.store";

describe("DeviceStore Integration (PLAN-v3 Section 16-17)", () => {
  it("fetches all seeded devices and filters by space and kind", () => {
    const all = deviceStore.getAll();
    expect(all.length).toBeGreaterThan(5);

    const showroomDevices = deviceStore.getBySpace("showroom");
    expect(showroomDevices.length).toBeGreaterThan(0);
    expect(showroomDevices.every((d) => d.spaceId === "showroom")).toBe(true);

    const showroomLights = deviceStore.getLightingBySpace("showroom");
    expect(showroomLights.length).toBeGreaterThan(0);
  });

  it("toggles device power state and notifies listeners", () => {
    const targetId = "showroom.spots-window";
    const initial = deviceStore.getById(targetId);
    expect(initial).toBeDefined();

    deviceStore.turnOn(targetId);
    const turnedOn = deviceStore.getById(targetId);
    expect(turnedOn?.powerState).toBe("on");
    expect(turnedOn?.brightnessPct).toBe(100);

    deviceStore.turnOff(targetId);
    const turnedOff = deviceStore.getById(targetId);
    expect(turnedOff?.powerState).toBe("off");
    expect(turnedOff?.brightnessPct).toBe(0);
  });

  it("sets brightness and updates state", () => {
    const targetId = "showroom.spots-2x3";
    deviceStore.setBrightness(targetId, 45);

    const updated = deviceStore.getById(targetId);
    expect(updated?.powerState).toBe("on");
    expect(updated?.brightnessPct).toBe(45);
  });
});
