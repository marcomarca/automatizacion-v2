import { describe, expect, it } from "bun:test";
import {
  checkPreconditioningNeeded,
  isTemperatureWithinTarget,
  stepTemperatureTowardsTarget,
} from "../../../src/services/climate.service";

describe("ClimateService", () => {
  it("determines if temperature is within comfort band", () => {
    expect(isTemperatureWithinTarget(23.0, 22.0, 24.0)).toBe(true);
    expect(isTemperatureWithinTarget(22.0, 22.0, 24.0)).toBe(true);
    expect(isTemperatureWithinTarget(24.0, 22.0, 24.0)).toBe(true);
    expect(isTemperatureWithinTarget(26.1, 22.0, 24.0)).toBe(false);
    expect(isTemperatureWithinTarget(19.5, 22.0, 24.0)).toBe(false);
  });

  it("checks if preconditioning is needed for an upcoming meeting", () => {
    // Meeting in 12 min, room at 26.1°C -> Needed
    expect(
      checkPreconditioningNeeded({
        minutesUntilMeeting: 12,
        currentTemp: 26.1,
        minComfort: 22.0,
        maxComfort: 24.0,
      }),
    ).toBe(true);

    // Meeting in 30 min -> Not urgent yet
    expect(
      checkPreconditioningNeeded({
        minutesUntilMeeting: 30,
        currentTemp: 26.1,
        minComfort: 22.0,
        maxComfort: 24.0,
      }),
    ).toBe(false);

    // Meeting in 10 min, but room is 23°C -> Not needed
    expect(
      checkPreconditioningNeeded({
        minutesUntilMeeting: 10,
        currentTemp: 23.0,
        minComfort: 22.0,
        maxComfort: 24.0,
      }),
    ).toBe(false);
  });

  it("steps temperature deterministically towards target when conditioning is active", () => {
    const nextTemp = stepTemperatureTowardsTarget(26.1, 23.0, 0.5);
    expect(nextTemp).toBe(25.6);

    const coldTemp = stepTemperatureTowardsTarget(20.0, 23.0, 0.5);
    expect(coldTemp).toBe(20.5);
  });
});
