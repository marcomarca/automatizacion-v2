export type DeviceKind = "light" | "switch" | "climate" | "sensor" | "relay" | "virtual";

export type DevicePowerState = "on" | "off";

export interface DeviceDefinition {
  id: string;
  name: string;
  kind: DeviceKind;
  spaceId: string;
  zoneId?: string;
  nominalPowerW?: number;
  metadata?: Record<string, unknown>;
}

export interface DeviceRuntimeState {
  deviceId: string;
  powerState?: DevicePowerState;
  brightnessPct?: number;
  actualPowerW?: number;
  available: boolean;
  lastUpdated?: string;
}

export interface MockDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  spaceId: string;
  zoneId?: string;
  powerState?: DevicePowerState;
  brightnessPct?: number;
  nominalPowerW?: number;
  actualPowerW?: number;
  available: boolean;
  metadata?: Record<string, unknown>;
}
