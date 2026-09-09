import { isConstruct, isAnimal } from '../../content/characters.ts';
import { type World, type Resident, tileAt, neighbors, key } from '../types.ts';
import { canStand } from '../navigation.ts';
import { tuning } from '../../content/tuning.ts';
import { foodSupport } from '../food.ts';
import { recipeById } from '../../content/recipes.ts';
import { roomById } from '../../content/rooms.ts';
import { goldTotal } from '../rooms.ts';
import { canTrain } from '../progression.ts';
import { spellById } from '../../content/spells.ts';
import { doorAt } from '../doors.ts';
import { choosePayJob, wageStatus } from '../wages.ts';
import { chooseHearthJob } from '../hearth.ts';
import { nearest, take, storage, availableStations } from './common.ts';
import { chooseScoutJob } from '../scouting.ts';
import { createWorkPool, choosePoolJob, type WorkPool } from './pool.ts';
import { recipeAllowed, spellAllowed } from '../availability.ts';
export function chooseJob(w: World, a: Resident, pool: WorkPool = createWorkPool(w)) {
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
  if (!isConstruct(a.type) && a.energy < tuning.restThreshold) {
    const beds = nearest(
      a,
      w.roomServices.filter((f) => f.service === 'rest' && f.assigned === a.id),
    ).sort((f, g) => Number(g.assigned === a.id) - Number(f.assigned === a.id));
    for (const f of beds)
      if (take(w, a, 'sleep', f, f.access, f.id)) {
        f.assigned = a.id;
        return;
      }
  }
  if (!isConstruct(a.type) && a.hunger < tuning.hungerThreshold) {
    const slot = foodSupport(w, a);
    if (slot && take(w, a, 'eat', slot, slot.access, slot.id)) return;
  }
  if (choosePayJob(w, a)) return;
  if (a.capabilities.includes('scout') && chooseScoutJob(w,a)) return;
  if (chooseHearthJob(w, a)) return;
  if (canTrain(w, a))
    for (const f of availableStations(w, a, 'training')) if (take(w, a, 'train', f, f.access, f.id)) return;
  if (a.capabilities.includes('research'))
    for (const order of w.researchOrders ?? []) {
      if (order.state !== 'queued' || order.paused || !spellById(order.spell) || !spellAllowed(w, order.spell)) continue;
      for (const f of availableStations(w, a, 'research'))
        if (take(w, a, 'research', f, f.access, f.id)) {
          a.job!.order = order.id;
          order.worker = a.id;
          order.state = 'working';
          return;
        }
    }
  let waitingForGold = false;
  for (const order of w.craftOrders.filter((o) => o.state === 'queued')) {
    if (!recipeAllowed(w, order.recipe)) continue;
    const recipe = recipeById(order.recipe)!;
    if (!a.capabilities.includes(recipe.capability)) continue;
    if (!order.paid && goldTotal(w) < recipe.cost) {
      waitingForGold = true;
      break;
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
  if (!waitingForGold && choosePoolJob(w, a, pool)) return;
  const trainingSquares = new Set(
    w.tiles.filter((t) => t.terrain === 'floor' && roomById(t.room ?? '')?.service === 'training').map(key),
  );
  const leavingTraining =
    (a.nextTrainingAt ?? 0) > w.elapsed &&
    trainingSquares.has(key({ x: Math.round(a.x), z: Math.round(a.z) }));
  const obstructs =
    tileAt(w, Math.round(a.x), Math.round(a.z))?.wallPlanned ||
    w.agents.some(
      (o) =>
        o !== a &&
        o.job &&
        (Math.hypot(a.x - o.job.work.x, a.z - o.job.work.z) < 0.6 ||
          (o.path.length && Math.hypot(a.x - o.x, a.z - o.z) < 0.85)),
    );
  if (leavingTraining || obstructs || doorAt(w, { x: Math.round(a.x), z: Math.round(a.z) }))
    for (const p of nearest(
      a,
      w.tiles.filter(
        (t) =>
          t.known &&
          t.terrain === 'floor' &&
          !t.core &&
          !t.wallPlanned &&
          !doorAt(w, t) &&
          (!leavingTraining || !trainingSquares.has(key(t))) &&
          canStand(w, t) &&
          (leavingTraining || Math.hypot(t.x - a.x, t.z - a.z) < tuning.sightRadius),
      ),
    )) {
      if (
        w.agents.some(
          (o) => o !== a && (Math.hypot(o.x - p.x, o.z - p.z) < 0.6 || (o.job && key(o.job.work) === key(p))),
        )
      )
        continue;
      if (take(w, a, 'idle', p, p)) return;
    }
  a.activity = a.pay?.due.length
    ? wageStatus(w, a).message
    : waitingForGold
      ? 'Waiting for production gold'
      : !isConstruct(a.type) && a.hunger < tuning.hungerThreshold
        ? (isAnimal(a.type) ? 'Needs a reachable Dormitory den' : 'Needs spare reachable Kitchen capacity')
        : !isConstruct(a.type) && a.energy < tuning.restThreshold
          ? 'Needs spare reachable Dormitory capacity'
          : a.capabilities.includes('research')
            ? 'Waiting for Library research'
            : a.capabilities.includes('mine')
              ? 'Awaiting a designation'
              : 'Awaiting work or training';
  a.retry = waitingForGold ? 1 : tuning.retrySeconds;
}
