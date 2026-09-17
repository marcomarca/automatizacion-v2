import { describe, expect, it } from "bun:test";
import type { MockDevice } from "../../../src/models/device";
import type { MockScene } from "../../../src/models/scene";
import { SceneService } from "../../../src/services/scene.service";

describe("SceneService — Transactional Scene Execution (PLAN-v3 Section 26)", () => {
  const devicesMap = new Map<string, MockDevice>([
    [
      "dev-1",
      {
        id: "dev-1",
        name: "Luz 1",
        kind: "light",
        spaceId: "showroom",
        powerState: "off",
        brightnessPct: 0,
        nominalPowerW: 100,
        actualPowerW: 0,
        available: true,
      },
    ],
    [
      "dev-2",
      {
        id: "dev-2",
        name: "Luz 2",
        kind: "light",
        spaceId: "showroom",
        powerState: "on",
        brightnessPct: 100,
        nominalPowerW: 50,
        actualPowerW: 50,
        available: true,
      },
    ],
  ]);

  const testScene: MockScene = {
    id: "scene-test",
    name: "Test Scene",
    spaceId: "showroom",
    actions: [
      { deviceId: "dev-1", powerState: "on", brightnessPct: 50 },
      { deviceId: "dev-2", powerState: "off" },
    ],
  };

  it("applies scene actions and reports accurate summary counters", () => {
    const result = SceneService.applyScene(testScene, devicesMap);

    expect(result.sceneId).toBe("scene-test");
    expect(result.spaceId).toBe("showroom");
    expect(result.affectedDevicesCount).toBe(2);
    expect(result.turnedOnCount).toBe(1);
    expect(result.turnedOffCount).toBe(1);

    const dev1 = result.updatedDevices.find((d) => d.id === "dev-1");
    expect(dev1?.powerState).toBe("on");
    expect(dev1?.brightnessPct).toBe(50);
    expect(dev1?.actualPowerW).toBe(50);

    const dev2 = result.updatedDevices.find((d) => d.id === "dev-2");
    expect(dev2?.powerState).toBe("off");
    expect(dev2?.brightnessPct).toBe(0);
    expect(dev2?.actualPowerW).toBe(0);
  });
});
