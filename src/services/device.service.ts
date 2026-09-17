import type { DeviceDefinition, DevicePowerState, MockDevice } from "../models/device";

export class DeviceService {
  /**
   * Sets power state (on/off) and recalculates brightness and actual power.
   */
  static setPowerState(
    device: MockDevice | DeviceDefinition,
    state: DevicePowerState,
    currentBrightness?: number,
  ): Partial<MockDevice> {
    const nominal = device.nominalPowerW ?? 0;
    if (state === "off") {
      return {
        powerState: "off",
        brightnessPct: 0,
        actualPowerW: 0,
      };
    }

    const brightness =
      currentBrightness && currentBrightness > 0
        ? Math.min(100, Math.max(1, currentBrightness))
        : 100;
    const actual = Math.round(nominal * (brightness / 100) * 10) / 10;

    return {
      powerState: "on",
      brightnessPct: brightness,
      actualPowerW: actual,
    };
  }

  /**
   * Sets brightness percentage (0-100) and recalculates power state and watts.
   */
  static setBrightness(
    device: MockDevice | DeviceDefinition,
    brightnessPct: number,
  ): Partial<MockDevice> {
    const clamped = Math.min(100, Math.max(0, Math.round(brightnessPct)));
    const nominal = device.nominalPowerW ?? 0;

    if (clamped === 0) {
      return {
        powerState: "off",
        brightnessPct: 0,
        actualPowerW: 0,
      };
    }

    const actual = Math.round(nominal * (clamped / 100) * 10) / 10;
    return {
      powerState: "on",
      brightnessPct: clamped,
      actualPowerW: actual,
    };
  }

  /**
   * Toggles device power state.
   */
  static toggle(device: MockDevice): Partial<MockDevice> {
    const nextState: DevicePowerState = device.powerState === "on" ? "off" : "on";
    return DeviceService.setPowerState(device, nextState, device.brightnessPct);
  }

  /**
   * Calculates total active power for a list of devices.
   */
  static calculateTotalPower(devices: MockDevice[]): number {
    const total = devices.reduce((sum, d) => sum + (d.actualPowerW ?? 0), 0);
    return Math.round(total * 10) / 10;
  }

  /**
   * Calculates total nominal power for a list of devices.
   */
  static calculateTotalNominalPower(devices: MockDevice[]): number {
    const total = devices.reduce((sum, d) => sum + (d.nominalPowerW ?? 0), 0);
    return Math.round(total * 10) / 10;
  }

  /**
   * Counts active (powerState == "on") devices.
   */
  static countActiveDevices(devices: MockDevice[]): number {
    return devices.filter((d) => d.powerState === "on").length;
  }
}
