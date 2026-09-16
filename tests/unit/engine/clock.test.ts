import { describe, expect, it } from "bun:test";
import { DemoClock } from "../../../src/engine/clock";

describe("DemoClock", () => {
  it("initializes with default date", () => {
    const clock = new DemoClock("2026-09-16T14:00:00Z");
    expect(clock.formatTime()).toBe("14:00");
  });

  it("advances seconds and minutes deterministically", () => {
    const clock = new DemoClock("2026-09-16T14:00:00Z");
    clock.advanceSeconds(30);
    expect(clock.formatTime()).toBe("14:00");

    clock.advanceMinutes(15);
    expect(clock.formatTime()).toBe("14:15");
  });

  it("allows setting specific time and notifies listeners", () => {
    const clock = new DemoClock("2026-09-16T14:00:00Z");
    let notifiedTime = "";

    clock.subscribe((time) => {
      notifiedTime = time.toISOString();
    });

    clock.set("2026-09-16T15:30:00Z");
    expect(clock.formatTime()).toBe("15:30");
    expect(notifiedTime).toBe("2026-09-16T15:30:00.000Z");
  });
});
