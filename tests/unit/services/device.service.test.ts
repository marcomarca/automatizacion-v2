import { describe, expect, it } from "bun:test";
import type { MockDevice } from "../../../src/models/device";
import { DeviceService } from "../../../src/services/device.service";

describe("DeviceService — Pure Device Calculations (PLAN-v3 Section 21)", () => {
  const sampleLight: MockDevice = {
    id: "showroom.spots-window",
    name: "Spots ventana",
    kind: "light",
    spaceId: "showroom",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 80,
    actualPowerW: 0,
    available: true,
  };

  it("turns on device and calculates full nominal power by default", () => {
    const result = DeviceService.setPowerState(sampleLight, "on");
    expect(result.powerState).toBe("on");
    expect(result.brightnessPct).toBe(100);
    expect(result.actualPowerW).toBe(80);
  });

  it("turns on device preserving previous brightness if provided", () => {
    const result = DeviceService.setPowerState(sampleLight, "on", 50);
    expect(result.powerState).toBe("on");
    expect(result.brightnessPct).toBe(50);
    expect(result.actualPowerW).toBe(40);
  });

  it("turns off device setting brightness and actual power to zero", () => {
    const onLight: MockDevice = {
      ...sampleLight,
      powerState: "on",
      brightnessPct: 80,
      actualPowerW: 64,
    };
    const result = DeviceService.setPowerState(onLight, "off");
    expect(result.powerState).toBe("off");
    expect(result.brightnessPct).toBe(0);
    expect(result.actualPowerW).toBe(0);
  });

  it("sets brightness and clamps between 0 and 100", () => {
    const resLow = DeviceService.setBrightness(sampleLight, -10);
    expect(resLow.powerState).toBe("off");
    expect(resLow.brightnessPct).toBe(0);
    expect(resLow.actualPowerW).toBe(0);

    const resMid = DeviceService.setBrightness(sampleLight, 25);
    expect(resMid.powerState).toBe("on");
    expect(resMid.brightnessPct).toBe(25);
    expect(resMid.actualPowerW).toBe(20);

    const resHigh = DeviceService.setBrightness(sampleLight, 150);
    expect(resHigh.powerState).toBe("on");
    expect(resHigh.brightnessPct).toBe(100);
    expect(resHigh.actualPowerW).toBe(80);
  });

  it("toggles state correctly", () => {
    const toggledOn = DeviceService.toggle(sampleLight);
    expect(toggledOn.powerState).toBe("on");

    const onLight: MockDevice = {
      ...sampleLight,
      powerState: "on",
      brightnessPct: 100,
      actualPowerW: 80,
    };
    const toggledOff = DeviceService.toggle(onLight);
    expect(toggledOff.powerState).toBe("off");
  });

  it("calculates total active and nominal power across devices", () => {
    const devices: MockDevice[] = [
      { ...sampleLight, powerState: "on", actualPowerW: 80, nominalPowerW: 80 },
      { ...sampleLight, id: "d2", powerState: "off", actualPowerW: 0, nominalPowerW: 120 },
      { ...sampleLight, id: "d3", powerState: "on", actualPowerW: 30, nominalPowerW: 60 },
    ];

    expect(DeviceService.calculateTotalPower(devices)).toBe(110);
    expect(DeviceService.calculateTotalNominalPower(devices)).toBe(260);
    expect(DeviceService.countActiveDevices(devices)).toBe(2);
  });
});
