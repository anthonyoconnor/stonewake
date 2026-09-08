import type { World } from '../game/types.ts';
import { tick } from '../game/simulation.ts';
import { diagnosticSnapshot, enableDiagnostics } from '../game/diagnostics.ts';

export const STEP_SECONDS = 0.05;
export function stepCount(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 600)
    throw new Error('Advance between 0 and 600 simulated seconds per call.');
  return Math.ceil(seconds / STEP_SECONDS - 1e-9);
}
export function advance(world: World, seconds: number) {
  enableDiagnostics(world);
  const steps = stepCount(seconds);
  for (let i = 0; i < steps; i++) tick(world, STEP_SECONDS);
  return steps * STEP_SECONDS;
}
export function advanceUntil(
  world: World,
  predicate: () => boolean,
  seconds = 90,
  label = 'Expected simulation condition',
) {
  enableDiagnostics(world);
  const steps = stepCount(seconds);
  for (let i = 0; i < steps && !predicate(); i++) tick(world, STEP_SECONDS);
  if (!predicate())
    throw new Error(`${label} after ${seconds}s\n${JSON.stringify(diagnosticSnapshot(world), null, 2)}`);
}
