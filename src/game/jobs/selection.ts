import { type World, type Resident, tileAt, neighbors, key } from '../types.ts';
import { canStand } from '../navigation.ts';
import { tuning } from '../../content/tuning.ts';
import { foodFacilities } from '../food.ts';
import { recipeById } from '../../content/recipes.ts';
import { goldTotal } from '../rooms.ts';
import { wallEligible } from '../walls.ts';
import { canTrain } from '../progression.ts';
import { spellById } from '../../content/spells.ts';
import { doorAt } from '../doors.ts';
import { nearest, take, storage, availableStorage, availableStations, reserved } from './common.ts';
export function chooseJob(w: World, a: Resident) {
  if (a.carrying) {
    for (const f of storage(w, a)) if (take(w, a, 'deliver', f, f.access, f.id)) return;
    const origin = a.cargoOrigin && tileAt(w, a.cargoOrigin.x, a.cargoOrigin.z);
    if (origin)
      for (const p of origin.terrain === 'floor' ? [origin] : nearest(a, neighbors(w, origin)))
        if (take(w, a, 'drop', origin, p)) return;
    a.activity = 'Waiting for a route to storage or the mining site';
    a.retry = tuning.retrySeconds;
    return;
  }
  if (a.energy < tuning.restThreshold) {
    const beds = nearest(
      a,
      w.furnishings.filter((f) => f.service === 'rest' && (!f.assigned || f.assigned === a.id)),
    ).sort((f, g) => Number(g.assigned === a.id) - Number(f.assigned === a.id));
    for (const f of beds)
      if (take(w, a, 'sleep', f, f.access, f.id)) {
        f.assigned = a.id;
        return;
      }
  }
  if (a.hunger < tuning.hungerThreshold || a.meal)
    for (const table of nearest(
      a,
      w.furnishings.filter(
        (f) =>
          f.service === 'dining' &&
          !(a.avoidFacility === f.id && (a.avoidUntil ?? 0) > w.elapsed) &&
          !w.agents.some(
            (o) => o !== a && o.job && (o.job.furnishing === f.id || key(o.job.work) === key(f.access)),
          ),
      ),
    )) {
      const food = foodFacilities(w, table).find((f) => f.service === 'cooking' && f.stored > 0);
      if ((a.meal || food) && take(w, a, 'eat', table, table.access, table.id)) {
        if (!a.meal) {
          food!.stored--;
          a.meal = true;
          w.revision++;
        }
        return;
      }
    }
  if (canTrain(w, a))
    for (const f of availableStations(w, a, 'training')) if (take(w, a, 'train', f, f.access, f.id)) return;
  if (a.capabilities.includes('research'))
    for (const order of w.researchOrders ?? []) {
      if (order.state !== 'queued' || order.paused || !spellById(order.spell)) continue;
      for (const f of availableStations(w, a, 'research'))
        if (take(w, a, 'research', f, f.access, f.id)) {
          a.job!.order = order.id;
          order.worker = a.id;
          order.state = 'working';
          return;
        }
    }
  for (const order of w.craftOrders.filter((o) => o.state === 'queued')) {
    const recipe = recipeById(order.recipe)!;
    if (!a.capabilities.includes(recipe.capability)) continue;
    if (!order.paid && goldTotal(w) < recipe.cost) {
      a.activity = 'Waiting for production gold';
      a.retry = 1;
      return;
    }
    for (const f of availableStations(w, a, 'craft')) {
      if (take(w, a, 'craft', f, f.access, f.id)) {
        a.job!.order = order.id;
        order.worker = a.id;
        order.state = 'working';
        return;
      }
    }
  }
  if (a.resumeMine) {
    const t = tileAt(w, a.resumeMine.x, a.resumeMine.z);
    if (
      t?.known &&
      t.designated &&
      t.terrain === 'gold' &&
      a.capabilities.includes('mine') &&
      !reserved(w, 'mine', t)
    ) {
      for (const p of nearest(a, neighbors(w, t))) if (take(w, a, 'mine', t, p)) return;
    }
    a.resumeMine = undefined;
  }
  if (a.capabilities.includes('haul') && availableStorage(w, a))
    for (const t of nearest(
      a,
      w.tiles.filter((t) => t.loose && !reserved(w, 'collect', t)),
    )) {
      for (const p of t.terrain === 'floor' ? [t] : neighbors(w, t)) if (take(w, a, 'collect', t, p)) return;
    }
  if (a.capabilities.includes('mine'))
    for (const t of nearest(
      a,
      w.tiles.filter(
        (t) =>
          t.known && t.designated && t.terrain !== 'gem' && t.terrain !== 'floor' && !reserved(w, 'mine', t),
      ),
    )) {
      for (const p of nearest(a, neighbors(w, t))) if (take(w, a, 'mine', t, p)) return;
    }
  if (a.capabilities.includes('claim'))
    for (const t of nearest(
      a,
      w.tiles.filter((t) => t.known && t.terrain === 'floor' && !t.claimed && !reserved(w, 'claim', t)),
    ))
      if (take(w, a, 'claim', t, t)) return;
  if (a.capabilities.includes('buildWall'))
    for (const t of nearest(
      a,
      w.tiles.filter((t) => t.wallPlanned && wallEligible(w, t) && !reserved(w, 'buildWall', t)),
    )) {
      for (const p of nearest(
        a,
        neighbors(w, t).filter((p) => !p.wallPlanned),
      ))
        if (take(w, a, 'buildWall', t, p)) return;
    }
  if (a.capabilities.includes('mine'))
    for (const t of nearest(
      a,
      w.tiles.filter((t) => t.known && t.designated && t.terrain === 'gem' && !reserved(w, 'mine', t)),
    )) {
      for (const p of nearest(a, neighbors(w, t))) if (take(w, a, 'mine', t, p)) return;
    }
  if (a.capabilities.includes('reinforce'))
    for (const t of nearest(
      a,
      w.tiles.filter(
        (t) =>
          t.known &&
          !t.reinforced &&
          !t.designated &&
          ['dirt', 'rock'].includes(t.terrain) &&
          !reserved(w, 'reinforce', t),
      ),
    )) {
      for (const p of nearest(
        a,
        neighbors(w, t).filter((p) => p.claimed && p.terrain === 'floor'),
      ))
        if (take(w, a, 'reinforce', t, p)) return;
    }
  const obstructs =
    tileAt(w, Math.round(a.x), Math.round(a.z))?.wallPlanned ||
    w.furnishings.some((f) => Math.hypot(a.x - f.access.x, a.z - f.access.z) < 0.6) ||
    w.agents.some(
      (o) =>
        o !== a &&
        o.job &&
        (Math.hypot(a.x - o.job.work.x, a.z - o.job.work.z) < 0.6 ||
          (o.path.length && Math.hypot(a.x - o.x, a.z - o.z) < 0.85)),
    );
  if (obstructs || doorAt(w, { x: Math.round(a.x), z: Math.round(a.z) }))
    for (const p of nearest(
      a,
      w.tiles.filter(
        (t) =>
          t.known &&
          t.terrain === 'floor' &&
          !t.core &&
          !t.wallPlanned &&
          !doorAt(w, t) &&
          canStand(w, t) &&
          Math.hypot(t.x - a.x, t.z - a.z) < tuning.sightRadius,
      ),
    )) {
      if (
        w.furnishings.some((f) => key(f.access) === key(p)) ||
        w.agents.some(
          (o) => o !== a && (Math.hypot(o.x - p.x, o.z - p.z) < 0.6 || (o.job && key(o.job.work) === key(p))),
        )
      )
        continue;
      if (take(w, a, 'idle', p, p)) return;
    }
  a.activity =
    a.hunger < tuning.hungerThreshold
      ? 'Needs food and an accessible table'
      : a.energy < tuning.restThreshold
        ? 'Needs an accessible bed'
        : a.capabilities.includes('research')
          ? 'Waiting for Library research'
          : a.capabilities.includes('mine')
            ? 'Awaiting a designation'
            : 'Awaiting work or training';
  a.retry = tuning.retrySeconds;
}
