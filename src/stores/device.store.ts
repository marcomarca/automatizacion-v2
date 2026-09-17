import type { DeviceKind, DevicePowerState, MockDevice } from "../models/device";
import { demoStore } from "./demo.store";

export class DeviceStore {
  private static instance: DeviceStore;

  private constructor() {}

  public static getInstance(): DeviceStore {
    if (!DeviceStore.instance) {
      DeviceStore.instance = new DeviceStore();
    }
    return DeviceStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    return demoStore.subscribe(listener);
  }

  public getAll(): MockDevice[] {
    return demoStore.engine.getDevices();
  }

  public getById(id: string): MockDevice | undefined {
    return demoStore.engine.getDevice(id);
  }

  public getBySpace(spaceId: string): MockDevice[] {
    return demoStore.engine.getDevicesBySpace(spaceId);
  }

  public getBySpaceId(spaceId: string): MockDevice[] {
    return this.getBySpace(spaceId);
  }

  public getByZone(zoneId: string): MockDevice[] {
    return demoStore.engine.getDevices().filter((d) => d.zoneId === zoneId);
  }

  public getByKind(kind: DeviceKind): MockDevice[] {
    return demoStore.engine.getDevices().filter((d) => d.kind === kind);
  }

  public getLightingBySpace(spaceId: string): MockDevice[] {
    return demoStore.engine
      .getDevicesBySpace(spaceId)
      .filter((d) => d.kind === "light" || d.kind === "switch" || d.kind === "relay");
  }

  // Actions
  public setPower(deviceId: string, state: DevicePowerState): void {
    demoStore.engine.setDevicePower(deviceId, state);
  }

  public setDeviceState(
    deviceId: string,
    state: DevicePowerState,
    attributes?: { brightness?: number },
  ): void {
    if (attributes?.brightness !== undefined) {
      demoStore.engine.setDeviceBrightness(deviceId, attributes.brightness);
    }
    demoStore.engine.setDevicePower(deviceId, state);
  }

  public turnOn(deviceId: string): void {
    this.setPower(deviceId, "on");
  }

  public turnOff(deviceId: string): void {
    this.setPower(deviceId, "off");
  }

  public toggle(deviceId: string): void {
    demoStore.engine.toggleDevice(deviceId);
  }

  public toggleDevice(deviceId: string): void {
    this.toggle(deviceId);
  }

  public setBrightness(deviceId: string, brightnessPct: number): void {
    demoStore.engine.setDeviceBrightness(deviceId, brightnessPct);
  }

  public turnAllOn(): void {
    demoStore.engine.turnAllLightsOn();
  }

  public turnAllOff(): void {
    demoStore.engine.turnAllLightsOff();
  }

  public turnSpaceOn(spaceId: string): void {
    demoStore.engine.turnSpaceOn(spaceId);
  }

  public turnSpaceOff(spaceId: string): void {
    demoStore.engine.turnSpaceOff(spaceId);
  }
}

export const deviceStore = DeviceStore.getInstance();
