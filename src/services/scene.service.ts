import type { MockDevice } from "../models/device";
import type { MockScene } from "../models/scene";
import { DeviceService } from "./device.service";

export interface SceneApplicationResult {
  sceneId: string;
  spaceId: string;
  affectedDevicesCount: number;
  turnedOnCount: number;
  turnedOffCount: number;
  updatedDevices: MockDevice[];
}

export class SceneService {
  /**
   * Applies a scene to a collection of devices, returning updated devices.
   */
  static applyScene(scene: MockScene, devicesMap: Map<string, MockDevice>): SceneApplicationResult {
    let turnedOnCount = 0;
    let turnedOffCount = 0;
    const updatedDevices: MockDevice[] = [];

    for (const action of scene.actions) {
      const device = devicesMap.get(action.deviceId);
      if (!device) continue;

      let changes: Partial<MockDevice> = {};
      if (action.powerState !== undefined) {
        changes = DeviceService.setPowerState(device, action.powerState, action.brightnessPct);
      } else if (action.brightnessPct !== undefined) {
        changes = DeviceService.setBrightness(device, action.brightnessPct);
      }

      if (changes.powerState === "on" && device.powerState !== "on") {
        turnedOnCount++;
      } else if (changes.powerState === "off" && device.powerState !== "off") {
        turnedOffCount++;
      }

      const updated: MockDevice = {
        ...device,
        ...changes,
      };

      updatedDevices.push(updated);
    }

    return {
      sceneId: scene.id,
      spaceId: scene.spaceId,
      affectedDevicesCount: updatedDevices.length,
      turnedOnCount,
      turnedOffCount,
      updatedDevices,
    };
  }
}
