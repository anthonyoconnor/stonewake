import { type World, type Resident, tileAt } from '../types.ts';
import { canStand } from '../navigation.ts';
import { wallEligible } from '../walls.ts';
import { canTrain } from '../progression.ts';
export function validJob(w: World, a: Resident) {
  const j = a.job!,
    t = tileAt(w, j.target.x, j.target.z);
  if (!t) return false;
  if (j.kind === 'mine')
    return t.known && t.designated && ['dirt', 'rock', 'gold', 'gem'].includes(t.terrain);
  if (j.kind === 'claim') return t.terrain === 'floor' && !t.claimed;
  if (j.kind === 'buildWall') return !!t.wallPlanned && wallEligible(w, t) && canStand(w, j.work);
  if (j.kind === 'reinforce')
    return (
      t.known &&
      !t.reinforced &&
      !t.designated &&
      ['dirt', 'rock'].includes(t.terrain) &&
      !!tileAt(w, j.work.x, j.work.z)?.claimed &&
      canStand(w, j.work)
    );
  if (j.kind === 'collect') return t.loose > 0;
  if (j.kind === 'drop') return a.carrying > 0 && canStand(w, j.work);
  if (j.kind === 'idle') return canStand(w, j.work);
  if (j.kind === 'sleep')
    return w.furnishings.some((f) => f.id === j.furnishing && f.assigned === a.id) && canStand(w, j.work);
  if (j.kind === 'eat')
    return a.meal && w.furnishings.some((f) => f.id === j.furnishing) && canStand(w, j.work);
  if (j.kind === 'craft')
    return (
      w.furnishings.some((f) => f.id === j.furnishing) &&
      w.craftOrders.some((o) => o.id === j.order && o.state === 'working' && o.worker === a.id) &&
      canStand(w, j.work)
    );
  if (j.kind === 'train')
    return (
      canTrain(w, a) &&
      w.furnishings.some((f) => f.id === j.furnishing && f.service === 'training') &&
      canStand(w, j.work)
    );
  if (j.kind === 'research')
    return (
      a.capabilities.includes('research') &&
      w.furnishings.some((f) => f.id === j.furnishing && f.service === 'research') &&
      !!w.researchOrders?.some(
        (o) => o.id === j.order && o.state === 'working' && o.worker === a.id && !o.paused,
      ) &&
      canStand(w, j.work)
    );
  return w.furnishings.some((f) => f.id === j.furnishing && f.stored < f.capacity);
}
