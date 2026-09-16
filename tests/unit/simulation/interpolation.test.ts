import { describe, expect, it } from "bun:test";
import { interpolateCurve } from "../../../src/simulation/interpolation";

describe("Interpolation Service — Pure Curve Evaluation", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 100 },
    { x: 20, y: 300 },
  ];

  it("throws explicit error when point set is empty", () => {
    expect(() => interpolateCurve([], 5)).toThrow("Cannot interpolate empty curve");
  });

  it("returns single point y value when only 1 point exists", () => {
    expect(interpolateCurve([{ x: 5, y: 42 }], 10)).toBe(42);
    expect(interpolateCurve([{ x: 5, y: 42 }], -10)).toBe(42);
  });

  it("returns exact y for exact x matches", () => {
    expect(interpolateCurve(points, 0)).toBe(0);
    expect(interpolateCurve(points, 10)).toBe(100);
    expect(interpolateCurve(points, 20)).toBe(300);
  });

  it("evaluates midpoint linear interpolation correctly", () => {
    // Between 0 and 10: midpoint 5 -> 50
    expect(interpolateCurve(points, 5, "linear")).toBe(50);
    // Between 10 and 20: midpoint 15 -> 200
    expect(interpolateCurve(points, 15, "linear")).toBe(200);
  });

  it("evaluates step interpolation correctly (previous point value)", () => {
    expect(interpolateCurve(points, 0, "step")).toBe(0);
    expect(interpolateCurve(points, 4.9, "step")).toBe(0);
    expect(interpolateCurve(points, 10, "step")).toBe(100);
    expect(interpolateCurve(points, 19.9, "step")).toBe(100);
    expect(interpolateCurve(points, 20, "step")).toBe(300);
  });

  it("clamps values below minimum x", () => {
    expect(interpolateCurve(points, -10, "linear", "clamp")).toBe(0);
    expect(interpolateCurve(points, -0.01, "linear", "clamp")).toBe(0);
  });

  it("clamps values above maximum x", () => {
    expect(interpolateCurve(points, 25, "linear", "clamp")).toBe(300);
    expect(interpolateCurve(points, 100, "linear", "clamp")).toBe(300);
  });

  it("handles unsorted input points correctly by sorting them internally", () => {
    const unsorted = [
      { x: 20, y: 300 },
      { x: 0, y: 0 },
      { x: 10, y: 100 },
    ];
    expect(interpolateCurve(unsorted, 5, "linear")).toBe(50);
    expect(interpolateCurve(unsorted, 15, "linear")).toBe(200);
  });
});
