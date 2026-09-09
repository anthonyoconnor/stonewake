/** Scale an orbit distance without an inspection limit; retain only numeric safety and the far limit. */
export function zoomedRadius(radius: number, factor: number, maxRadius: number): number {
  const current = Number.isFinite(radius) && radius > 0 ? radius : maxRadius;
  if (Number.isNaN(factor) || factor < 0) factor = 1;
  // Extreme wheel deltas can underflow to zero or overflow to infinity.
  return Math.max(Number.EPSILON, Math.min(maxRadius, current * factor));
}
