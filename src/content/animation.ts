/** Presentation timings only; attacks and movement remain simulation-owned. */
export const animationTuning = { turnRate: 14, settleRate: 16, strikeSeconds: 0.28, workBeat: 0.5 };
export function strikeEnvelope(now: number, attackedAt?: number) {
  const age = now - (attackedAt ?? -Infinity);
  return age < 0 || age >= animationTuning.strikeSeconds ? 0 : Math.pow(1 - age / animationTuning.strikeSeconds, 2);
}
export function turnToward(previous: number, target: number, dt: number) {
  return previous + Math.atan2(Math.sin(target - previous), Math.cos(target - previous)) * (1 - Math.exp(-Math.max(0, dt) * animationTuning.turnRate));
}
