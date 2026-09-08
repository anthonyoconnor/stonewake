import { characterById } from '../content/characters.ts';
import { tuning } from '../content/tuning.ts';
import { type World, type Resident, neighbors, key } from './types.ts';
import { canStand, reachable } from './navigation.ts';
import { nearest, reserved, take } from './jobs/common.ts';

export const sightRadius = (a: Resident) =>
  tuning.sightRadius + (characterById(a.type)?.capabilities.includes('scout') ? tuning.scoutSightBonus : 0);

export function chooseScoutJob(w: World, a: Resident) {
  if (
    !a.capabilities.includes('scout') ||
    a.energy < tuning.restThreshold ||
    a.hunger < tuning.hungerThreshold
  )
    return false;
  const state = (a.scout ??= {
    until: w.elapsed + tuning.scoutOutingSeconds,
    homeUntil: 0,
    returning: false,
    visits: {},
  });
  const routes = reachable(w, a);
  if (w.elapsed >= state.until && state.homeUntil === 0) state.returning = true;
  if (state.homeUntil && w.elapsed >= state.homeUntil) {
    state.homeUntil = 0;
    state.until = w.elapsed + tuning.scoutOutingSeconds;
  }
  if (!state.homeUntil && !state.returning) {
    const frontiers = nearest(
      a,
      w.tiles.filter(
        (t) =>
          t.known && !t.wallPlanned &&
          routes.has(key(t)) &&
          canStand(w, t) &&
          Math.hypot(t.x - w.hearth.x, t.z - w.hearth.z) <= tuning.scoutRange &&
          neighbors(w, t).some((n) => !n.known) &&
          !reserved(w, 'scout', t) &&
          (state.visits[key(t)] ?? -Infinity) < w.elapsed - 60,
      ),
    );
    for (const t of frontiers)
      if (take(w, a, 'scout', t, t)) {
        state.visits[key(t)] = w.elapsed;
        a.activity = 'Scouting tunnels';
        return true;
      }
    state.returning = true;
  }
  // Return to open ground near the Hearth between outings; do not block its treasury approach.
  const home = nearest(
    w.hearth,
    w.tiles.filter(
      (t) =>
        t.claimed && !t.wallPlanned &&
        routes.has(key(t)) &&
        canStand(w, t) &&
        Math.hypot(t.x - w.hearth.x, t.z - w.hearth.z) <= 4 &&
        !w.roomServices.some((f) => key(f.access) === key(t)) &&
        !w.agents.some(
          (o) => o !== a && (Math.hypot(o.x - t.x, o.z - t.z) < 0.7 || (o.job && key(o.job.work) === key(t))),
        ),
    ),
  );
  for (const t of home)
    if (take(w, a, 'scout', t, t, 'home-watch')) {
      a.activity = 'Returning to watch the Hearth';
      return true;
    }
  return false;
}
