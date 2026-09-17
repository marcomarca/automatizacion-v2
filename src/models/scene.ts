import type { DevicePowerState } from "./device";

export interface MockSceneAction {
  deviceId: string;
  powerState?: DevicePowerState;
  brightnessPct?: number;
}

export interface MockScene {
  id: string;
  name: string;
  description?: string;
  spaceId: string;
  actions: MockSceneAction[];
  metadata?: Record<string, unknown>;
}
