import type { ScenarioProfileDefinition } from "../models/scenario";
import { interpolateCurve } from "./interpolation";

export class ProfileSampler {
  /**
   * Sample a profile at a specific second offset in the day [0..86400].
   */
  public static sample(
    profile: ScenarioProfileDefinition | undefined,
    timeOffsetSeconds: number,
    defaultValue: number,
  ): number {
    if (!profile || !profile.points || profile.points.length === 0) {
      return defaultValue;
    }

    const points = profile.points.map((p) => ({
      x: p.timeOffsetSeconds,
      y: p.value,
    }));

    return interpolateCurve(points, timeOffsetSeconds, profile.interpolation, "clamp");
  }

  /**
   * Finds the profile of a given variable for a specific zone.
   */
  public static findProfile(
    profiles: ScenarioProfileDefinition[],
    zoneId: string,
    variable: string,
  ): ScenarioProfileDefinition | undefined {
    return profiles.find((p) => p.zoneId === zoneId && p.variable === variable);
  }
}
