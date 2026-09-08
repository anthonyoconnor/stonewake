import { type World, type Resident, type Job, tileAt } from '../types.ts';
import { reveal } from '../world.ts';
import { tuning } from '../../content/tuning.ts';
import { recipeById } from '../../content/recipes.ts';
import { spendGold } from '../rooms.ts';
import { wallBuildDuration } from '../walls.ts';
import { workRate, nextCharacterLevel, levelUp } from '../progression.ts';
import { researchDuration } from '../research.ts';
import { spellById } from '../../content/spells.ts';
import { hasteRate } from '../spell-effects.ts';
import { availableStorage, releaseJob } from './common.ts';

// true completes the job; false retains it (or a handler has released it).
type JobHandler = (
  w: World,
  a: Resident,
  j: Job,
  t: NonNullable<ReturnType<typeof tileAt>>,
  dt: number,
  work: number,
) => boolean;
const handlers = {
  mine: (w, a, j, t, dt, work) => {
    a.activity =
      t.terrain === 'gem' ? 'Extracting gems' : t.terrain === 'gold' ? 'Mining gold' : 'Excavating';
    const duration =
      t.terrain === 'gem'
        ? tuning.gemSeconds
        : t.terrain === 'gold'
          ? tuning.goldSeconds
          : t.terrain === 'rock'
            ? tuning.rockSeconds
            : tuning.mineSeconds;
    if (j.progress < duration) return false;
    if (t.terrain === 'gem') {
      t.loose += tuning.gemYield;
      t.source = 'gem';
    } else if (t.terrain === 'gold') {
      const amount = Math.min(t.gold, tuning.goldYield, Math.max(0, tuning.carry - a.carrying));
      t.gold -= amount;
      t.source = 'gold';
      if (availableStorage(w, a)) {
        a.carrying += amount;
        a.cargoOrigin = { ...j.target };
      } else {
        t.loose += amount + a.carrying;
        a.carrying = 0;
        a.cargoOrigin = undefined;
      }
      w.revision++;
      if (t.gold > 0) {
        if (a.carrying >= tuning.carry) {
          a.resumeMine = { ...j.target };
        } else {
          j.progress = 0;
          return false;
        }
      } else {
        t.terrain = 'floor';
        t.claimed = false;
        t.designated = false;
        t.reinforced = false;
        a.resumeMine = undefined;
      }
    } else {
      t.terrain = 'floor';
      t.claimed = false;
      t.designated = false;
      t.reinforced = false;
    }
    reveal(w, j.work);
    w.revision++;

    return true;
  },
  buildWall: (w, a, j, t, dt, work) => {
    a.activity = 'Building wall';
    t.wallProgress = Math.min(wallBuildDuration(), (t.wallProgress ?? 0) + work);
    if (t.wallProgress < wallBuildDuration()) return false;
    if (
      [...w.agents, ...(w.enemies ?? []).filter((e) => e.health > 0)].some(
        (o) => Math.abs(o.x - t.x) < 0.5 + tuning.radius && Math.abs(o.z - t.z) < 0.5 + tuning.radius,
      )
    ) {
      a.activity = 'Waiting for the wall site to clear';
      return false;
    }
    t.terrain = 'rock';
    t.reinforced = true;
    t.wallPlanned = false;
    t.wallProgress = 0;
    t.designated = false;
    t.claimed = false;
    w.revision++;

    return true;
  },
  reinforce: (w, a, j, t, dt, work) => {
    a.activity = 'Reinforcing wall';
    if (j.progress < tuning.reinforceSeconds) return false;
    t.reinforced = true;
    w.revision++;

    return true;
  },
  craft: (w, a, j, t, dt, work) => {
    const order = w.craftOrders.find((o) => o.id === j.order)!,
      recipe = recipeById(order.recipe)!;
    if (!order.paid) {
      if (!spendGold(w, recipe.cost)) {
        releaseJob(w, a, 'Insufficient production gold');
        a.retry = 1;
        return false;
      }
      order.paid = true;
      w.revision++;
    }
    a.activity = `Crafting ${recipe.name.toLowerCase()}`;
    order.progress += work;
    if (order.progress < recipe.seconds) return false;
    order.state = 'done';
    order.worker = undefined;
    w.outputs[recipe.id] = (w.outputs[recipe.id] ?? 0) + 1;
    a.crafted++;
    w.revision++;

    return true;
  },
  train: (w, a, j, t, dt, work) => {
    a.activity = 'Training';
    const next = nextCharacterLevel(a);
    if (!next) return true;
    a.trainingProgress = (a.trainingProgress ?? 0) + dt * hasteRate(w, a);
    if (a.trainingProgress < next.trainingSeconds) return false;
    levelUp(w, a);

    return true;
  },
  research: (w, a, j, t, dt, work) => {
    const order = w.researchOrders!.find((o) => o.id === j.order)!,
      spell = spellById(order.spell)!;
    a.activity = `${order.unlocked ? 'Preparing' : 'Researching'} ${spell.name}`;
    order.progress += work;
    if (order.progress < researchDuration(order)) return false;
    order.progress = researchDuration(order);
    order.state = 'ready';
    order.unlocked = true;
    order.worker = undefined;
    w.revision++;

    return true;
  },
  eat: (w, a, j, t, dt, work) => {
    a.activity = 'Eating';
    if (j.progress < tuning.eatSeconds) return false;
    a.hunger = 1;
    a.meals++;
    w.revision++;

    return true;
  },
  sleep: (w, a, j, t, dt, work) => {
    a.activity = 'Sleeping';
    a.energy = Math.min(1, a.energy + dt / tuning.restSeconds);
    if (a.energy < 0.999) return false;
    a.rested++;

    return true;
  },
  claim: (w, a, j, t, dt, work) => {
    a.activity = 'Claiming floor';
    if (j.progress < tuning.claimSeconds) return false;
    t.claimed = true;
    reveal(w, t);
    w.revision++;

    return true;
  },
  collect: (w, a, j, t, dt, work) => {
    const f = availableStorage(w, a);
    if (f) {
      const amount = Math.min(t.loose, Math.max(0, tuning.carry - a.carrying), f.capacity - f.stored);
      t.loose -= amount;
      a.carrying += amount;
      a.cargoOrigin = { ...j.target };
      w.revision++;
    }

    return true;
  },
  deliver: (w, a, j, t, dt, work) => {
    const f = w.roomServices.find((f) => f.id === j.furnishing)!;
    const amount = Math.min(a.carrying, f.capacity - f.stored);
    f.stored += amount;
    a.carrying -= amount;
    if (!a.carrying) a.cargoOrigin = undefined;
    w.revision++;

    return true;
  },
  drop: (w, a, j, t, dt, work) => {
    // Capacity can reopen on the return trip; avoid making an unnecessary loose pile.
    if (!availableStorage(w, a)) {
      t.loose += a.carrying;
      a.carrying = 0;
      a.cargoOrigin = undefined;
      w.revision++;
    }

    return true;
  },
  idle: () => true,
} satisfies Record<Job['kind'], JobHandler>;

export function performJob(w: World, a: Resident, dt: number) {
  const j = a.job!,
    t = tileAt(w, j.target.x, j.target.z)!,
    work = dt * workRate(w, a);
  j.progress += ['mine', 'buildWall', 'reinforce', 'claim', 'craft', 'research'].includes(j.kind) ? work : dt;
  return handlers[j.kind](w, a, j, t, dt, work);
}
