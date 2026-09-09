import { type World, type Point, type Resident, key } from './types.ts';
import { tuning } from '../content/tuning.ts';
import { alive, visible, spellLine } from './spell-effects.ts';

export const securityState = (w: World) => (w.security ??= { alerts: [], nextScanAt: 0, patrolled: {} });
export function reportAttack(w: World, id: string, point: Point) {
  const state = securityState(w),
    existing = state.alerts.find((a) => a.id === id);
  if (existing) Object.assign(existing, { x: point.x, z: point.z, at: w.elapsed });
  else state.alerts.push({ id, x: point.x, z: point.z, at: w.elapsed });
}
export function tickSecurity(w: World) {
  const state = securityState(w);
  if (w.elapsed < state.nextScanAt) return;
  state.nextScanAt = w.elapsed + 0.5;
  state.alerts = state.alerts.filter(
    (a) =>
      w.elapsed - a.at < tuning.securityMemorySeconds &&
      (a.enemy === undefined || w.enemies?.some((e) => e.id === a.enemy && e.health > 0)),
  );
  for (const e of w.enemies ?? [])
    if (e.health > 0 && visible(w, e)) {
      const id = `enemy:${e.id}`,
        old = state.alerts.find((a) => a.id === id);
      const contact = { id, x: e.x, z: e.z, enemy: e.id, at: w.elapsed };
      if (old) Object.assign(old, contact);
      else state.alerts.push(contact);
    }
  for (const a of w.agents)
    if (alive(a) && a.capabilities.includes('scout')) {
      for (const t of w.tiles)
        if (t.known && Math.hypot(t.x - a.x, t.z - a.z) <= 3 && spellLine(w, a, t))
          state.patrolled[key(t)] = w.elapsed;
    }
}
export const knownDanger = (w: World) =>
  securityState(w).alerts.filter(
    (a) =>
      a.enemy !== undefined &&
      w.elapsed - a.at < tuning.securityMemorySeconds &&
      w.enemies?.some((e) => e.id === a.enemy && e.health > 0),
  );

// Include the interiors of smoothed path segments, not just their destinations.
export function routeClearOfDanger(
  w: World,
  start: Point,
  path: Point[],
  danger: Point[],
  clearance = tuning.workerThreatRadius,
) {
  let from = start;
  for (const to of path) {
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.5));
    for (let i = 1; i <= steps; i++) {
      const p = { x: from.x + ((to.x - from.x) * i) / steps, z: from.z + ((to.z - from.z) * i) / steps };
      if (danger.some((e) => Math.hypot(e.x - p.x, e.z - p.z) < clearance && spellLine(w, p, e)))
        return false;
    }
    from = to;
  }
  return true;
}
export const workerRouteSafe = (w: World, a: Resident, path: Point[]) =>
  !a.capabilities.includes('mine') || routeClearOfDanger(w, a, path, knownDanger(w));
