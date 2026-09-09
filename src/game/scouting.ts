import { characterById } from '../content/characters.ts';
import { tuning } from '../content/tuning.ts';
import { type World, type Resident, neighbors, key } from './types.ts';
import { canStand, reachable } from './navigation.ts';
import { take, releaseJob } from './jobs/common.ts';
import { securityState } from './security.ts';

export const sightRadius = (a: Resident) =>
  tuning.sightRadius + (characterById(a.type)?.capabilities.includes('scout') ? tuning.scoutSightBonus : 0);

export function reviewPatrol(w: World, a: Resident) {
  if (a.job?.kind !== 'scout' || !a.scout || w.elapsed < a.scout.reviewAt) return;
  a.scout.reviewAt = w.elapsed + 3;
  // Another dog may already have surveyed this destination while we were walking.
  if ((securityState(w).patrolled[key(a.job.target)] ?? -Infinity) > w.elapsed - 3) {
    releaseJob(w, a, 'Patrol destination already surveyed');
    a.retry = 0;
  }
}
export function chooseScoutJob(w: World, a: Resident) {
  if (
    !a.capabilities.includes('scout') ||
    a.energy < tuning.restThreshold ||
    a.hunger < tuning.hungerThreshold
  )
    return false;
  const routes = reachable(w, a),
    surveyed = securityState(w).patrolled;
  const distance = (t: { x: number; z: number }) => Math.hypot(t.x - a.x, t.z - a.z);
  const candidates = w.tiles.filter(
    (t) => t.known && !t.wallPlanned && routes.has(key(t)) && canStand(w, t) && distance(t) >= 1,
  );
  const fresh = (t: (typeof candidates)[number]) => surveyed[key(t)] === undefined;
  const priority = (t: (typeof candidates)[number]) =>
    fresh(t) ? (neighbors(w, t).some((n) => !n.known) ? 0 : 1) : 2;
  const crowded = (t: (typeof candidates)[number]) =>
    w.agents.some(
      (o) => o !== a && o.job?.kind === 'scout' && Math.hypot(o.job.target.x - t.x, o.job.target.z - t.z) < 3,
    );
  candidates.sort(
    (p, q) =>
      Number(crowded(p)) - Number(crowded(q)) ||
      priority(p) - priority(q) ||
      (fresh(p) ? 0 : Math.floor((surveyed[key(p)] ?? 0) / 10) - Math.floor((surveyed[key(q)] ?? 0) / 10)) ||
      Number(distance(p) < 3) - Number(distance(q) < 3) ||
      distance(p) - distance(q),
  );
  for (const t of candidates)
    if (take(w, a, 'scout', t, t)) {
      a.scout = { reviewAt: w.elapsed + 3 };
      a.activity = fresh(t) ? 'Exploring new tunnels' : 'Patrolling the stronghold';
      return true;
    }
  a.activity = 'Patrol route blocked';
  return false;
}
