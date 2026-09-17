import type { DevicePowerState } from "./device";

export type MockTriggerType = "time" | "schedule" | "state_change" | "calendar" | "occupancy";

export interface MockTrigger {
  type: MockTriggerType;
  entityId?: string;
  atTime?: string;
  cron?: string;
  description?: string;
}

export interface MockCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in";
  value: unknown;
  description?: string;
}

export interface MockAutomationAction {
  target: "device" | "scene" | "notification" | "climate";
  deviceId?: string;
  sceneId?: string;
  powerState?: DevicePowerState;
  brightnessPct?: number;
  temperature?: number;
  message?: string;
}

export interface MockAutomation {
  id: string;
  name: string;
  description?: string;
  spaceId?: string;
  enabled: boolean;
  trigger: MockTrigger;
  conditions?: MockCondition[];
  actions: MockAutomationAction[];
  lastTriggeredAt?: string;
  metadata?: Record<string, unknown>;
}
