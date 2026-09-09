import { type World, type Resident, type Point } from './types.ts';
import { tuning } from '../content/tuning.ts';
import { canStand, findPath } from './navigation.ts';
import { alive, spellLine, visible } from './spell-effects.ts';
import { releaseJob } from './jobs/common.ts';
import { moveResident } from './movement.ts';
import { routeClearOfDanger } from './security.ts';

export function tickWorkerRetreat(w: World, a: Resident, dt: number) {
  if (!a.capabilities.includes('mine')) return false;
  const hit = w.elapsed - (a.hitAt ?? -Infinity) < 2;
  const radius = hit ? Infinity : tuning.workerThreatRadius + (a.fleeing ? 2 : 0);
  const enemies = (w.enemies ?? []).filter(
    (e) => e.health > 0 && visible(w, e) && Math.hypot(e.x - a.x, e.z - a.z) <= radius && spellLine(w, a, e),
  );
  if (!a.fleeing && !enemies.length && !hit) return false;
  if (!a.fleeing) {
    releaseJob(w, a, 'Fleeing nearby enemies');
    a.workAssignment = undefined;
    a.resumeMine = undefined;
    a.combatTarget = undefined;
    a.fleeing = { until: w.elapsed + tuning.workerSafeSeconds, repathAt: 0, danger: [] };
  }
  const state = a.fleeing;
  if (enemies.length) {
    state.danger = enemies.map((e) => ({ x: e.x, z: e.z }));
    state.until = w.elapsed + tuning.workerSafeSeconds;
  }
  if (hit) state.until = w.elapsed + tuning.workerSafeSeconds;
  if (!enemies.length && !hit && w.elapsed >= state.until) {
    a.fleeing = undefined;
    a.path = [];
    a.retry = 0;
    return false;
  }
  if (w.elapsed >= state.repathAt) {
    state.repathAt = w.elapsed + 1;
    const danger = state.danger;
    const clearance = (p: Point) =>
      Math.min(
        Infinity,
        ...danger.filter((e) => spellLine(w, p, e)).map((e) => Math.hypot(e.x - p.x, e.z - p.z)),
      );
    const safe = Math.max(tuning.workerThreatRadius + 3, hit ? clearance(a) + 2 : 0);
    if (clearance(a) < safe || hit) {
      const candidates = w.tiles
        .filter((t) => t.known && !t.wallPlanned && canStand(w, t) && Math.hypot(t.x - a.x, t.z - a.z) > 2)
        .sort(
          (p, q) =>
            Number(clearance(q) >= safe) - Number(clearance(p) >= safe) ||
            Number(q.claimed) - Number(p.claimed) ||
            Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z) ||
            Math.hypot(p.x - w.hearth.x, p.z - w.hearth.z) - Math.hypot(q.x - w.hearth.x, q.z - w.hearth.z),
        );
      const minimum = Math.max(0.3, clearance(a) - 0.25);
      a.path = [];
      for (const p of candidates) {
        if (clearance(p) < Math.min(safe, clearance(a) + 2)) continue;
        const path = findPath(w, a, p);
        if (path && routeClearOfDanger(w, a, path, danger, minimum)) {
          a.path = path;
          break;
        }
      }
    }
  }
  if (a.path.length) {
    moveResident(w, a, dt);
    a.activity = 'Running from enemies';
  } else a.activity = enemies.length ? 'No safe escape route' : 'Waiting for danger to pass';
  return true;
}
