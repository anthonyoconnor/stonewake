import { type World, type Point, tileAt, key } from './types.ts';
import { canStand, findPath, reachable } from './navigation.ts';
import { reveal } from './world.ts';
import { tuning } from '../content/tuning.ts';
import { produceFood } from './food.ts';
import { characterById } from '../content/characters.ts';
import { recruitSpecialist } from './recruitment.ts';
import { tickDefenses } from './defenses.ts';
import { alive, tickSpellEffects } from './spell-effects.ts';
import { tickFighter, combatDefaults } from './combat.ts';
import { releaseJob } from './jobs/common.ts';
import { chooseJob } from './jobs/selection.ts';
import { validJob } from './jobs/validation.ts';
import { performJob } from './jobs/work.ts';
import { moveResident } from './movement.ts';
import { recordJob } from './diagnostics.ts';
export const addMiners = (w: World, count = tuning.startingMiners) => addResidents(w, 'miner', count);
export function addResidents(w: World, type: string, count = 1, origin?: Point) {
  const def = characterById(type);
  if (!def) return 0;
  const routes = origin ? reachable(w, origin) : undefined;
  const positions = w.tiles
    .filter(
      (t) =>
        t.claimed &&
        canStand(w, t) &&
        (!routes || routes.has(key(t))) &&
        !w.agents.some((a) => Math.hypot(a.x - t.x, a.z - t.z) < 0.6),
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - w.hearth.x, a.z - w.hearth.z) - Math.hypot(b.x - w.hearth.x, b.z - w.hearth.z),
    );
  const firstId = Math.max(w.nextResidentId ?? 0, ...w.agents.map((a) => a.id)) + 1;
  const existing = w.agents.filter((a) => a.type === type).length;
  for (let i = 0; i < count && i < positions.length; i++) {
    const p = positions[i];
    w.agents.push({
      x: p.x,
      z: p.z,
      id: firstId + i,
      name: def.names[(existing + i) % def.names.length],
      type,
      capabilities: [...def.capabilities],
      path: [],
      carrying: 0,
      activity: 'Looking for work',
      facing: 0,
      retry: 0,
      energy: 1,
      rested: 0,
      hunger: 1,
      meals: 0,
      meal: false,
      crafted: 0,
      trainingLevel: 0,
      trainingProgress: 0,
      nextTrainingAt: w.elapsed,
      health: def.combat?.health ?? combatDefaults.health,
      maxHealth: def.combat?.health ?? combatDefaults.health,
    });
  }
  const added = Math.min(count, positions.length);
  if (added) w.nextResidentId = firstId + added - 1;
  return added;
}
export function designate(w: World, points: Point[], value: boolean | 'toggle' = true) {
  for (const p of points) {
    const t = tileAt(w, p.x, p.z);
    if (t && (!t.known || ['dirt', 'rock', 'gold', 'gem'].includes(t.terrain)))
      t.designated = value === 'toggle' ? !t.designated : value;
  }
  w.revision++;
}
export function tick(w: World, dt: number) {
  w.elapsed += dt;
  tickSpellEffects(w, dt);
  for (const a of w.agents)
    if (!alive(a)) {
      releaseJob(w, a, 'Resident defeated');
      for (const f of w.furnishings) if (f.assigned === a.id) f.assigned = undefined;
      const t = tileAt(w, Math.round(a.x), Math.round(a.z));
      if (t) t.loose += a.carrying;
      a.carrying = 0;
      w.revision++;
    }
  w.agents = w.agents.filter(alive);
  if (w.routesChanged) {
    for (const a of w.agents) {
      a.retry = 0;
      if (a.job) {
        const path = findPath(w, a, a.job.work);
        if (path) a.path = path;
        else releaseJob(w, a, 'Routes changed; destination unreachable');
      }
    }
    w.routesChanged = false;
  }
  if (Math.floor(w.elapsed - dt) !== Math.floor(w.elapsed)) produceFood(w, 1);
  for (const a of w.agents) {
    if (a.job?.kind !== 'sleep') a.energy = Math.max(0, a.energy - dt / tuning.restInterval);
    if (a.job?.kind !== 'eat') a.hunger = Math.max(0, a.hunger - dt / tuning.hungerInterval);
    if (tickFighter(w, a, dt, releaseJob, moveResident)) continue;
    if (a.job && !validJob(w, a)) releaseJob(w, a, 'Target, facility, order or access is no longer valid');
    if (
      (a.job?.kind === 'train' || a.job?.kind === 'research') &&
      (a.energy < tuning.restThreshold || a.hunger < tuning.hungerThreshold)
    )
      releaseJob(w, a, 'Food or rest takes priority');
    if (!a.job) {
      a.retry -= dt;
      if (a.retry <= 0) {
        chooseJob(w, a);
        if (!a.job) recordJob(w, a, 'waiting', a.activity);
      }
    }
    if (!a.job) continue;
    if (!moveResident(w, a, dt)) continue;
    if (!performJob(w, a, dt)) continue;
    recordJob(w, a, 'completed', 'Work finished');
    a.job = undefined;
    a.path = [];
  }
  tickDefenses(w, dt);
  if (Math.floor((w.elapsed - dt) * 2) !== Math.floor(w.elapsed * 2))
    for (const a of w.agents) reveal(w, a, tuning.sightRadius);
  recruitSpecialist(w, (type, origin) => addResidents(w, type, 1, origin) > 0);
}
