/**
 * Pure interpolation service for Mock Lab physical curves and time profiles.
 * Strict, deterministic, noise-free.
 */

export interface DataPoint {
  x: number;
  y: number;
}

export function interpolateCurve(
  points: readonly DataPoint[],
  x: number,
  mode: "linear" | "step" = "linear",
  _extrapolation: "clamp" = "clamp",
): number {
  if (!points || points.length === 0) {
    throw new Error("Cannot interpolate empty curve: point set contains 0 points");
  }

  // 1 point case
  if (points.length === 1) {
    return points[0].y;
  }

  // Ensure points are sorted by x
  const sorted = [...points].sort((a, b) => a.x - b.x);

  // Exact bounds check (extrapolation: clamp)
  const minPt = sorted[0];
  const maxPt = sorted[sorted.length - 1];

  if (x <= minPt.x) {
    return minPt.y;
  }
  if (x >= maxPt.x) {
    return maxPt.y;
  }

  // Exact match check
  const exact = sorted.find((p) => p.x === x);
  if (exact !== undefined) {
    return exact.y;
  }

  // Find bounding segment [p0, p1] such that p0.x <= x < p1.x
  let p0 = sorted[0];
  let p1 = sorted[1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].x <= x && x <= sorted[i + 1].x) {
      p0 = sorted[i];
      p1 = sorted[i + 1];
      break;
    }
  }

  if (mode === "step") {
    return p0.y;
  }

  // Linear interpolation
  const dx = p1.x - p0.x;
  if (dx === 0) {
    return p0.y;
  }
  const ratio = (x - p0.x) / dx;
  return p0.y + ratio * (p1.y - p0.y);
}
