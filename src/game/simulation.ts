import { type World, type Point, tileAt, key } from './types.ts';
import { canStand, findPath, reachable } from './navigation.ts';
import { reveal } from './world.ts';
import { tuning } from '../content/tuning.ts';
import { assignRoomSupport } from './food.ts';
import { characterById, characterLevel, isConstruct } from '../content/characters.ts';
import { sightRadius, reviewPatrol } from './scouting.ts';
import { tickSecurity } from './security.ts';
import { tickWorkerRetreat } from './retreat.ts';
import { recruitSpecialist } from './recruitment.ts';
import { tickDefenses } from './defenses.ts';
import { alive, tickSpellEffects } from './spell-effects.ts';
import { tickFighter } from './combat.ts';
import { releaseJob } from './jobs/common.ts';
import { chooseJob } from './jobs/selection.ts';
import { createWorkPool, recordPoolWork } from './jobs/pool.ts';
import { validJob } from './jobs/validation.ts';
import { performJob } from './jobs/work.ts';
import { moveResident } from './movement.ts';
import { recordJob } from './diagnostics.ts';
import { tickEncounters } from './encounters.ts';
import { initializePay, tickPayday, shouldSeekPay } from './wages.ts';
import { tickHearth, finishHearth, shouldSeekHearth } from './hearth.ts';
import { initializeMorale, tickMorale, tickDeparture } from './morale.ts';
export const addStonehands = (w: World, count = tuning.startingStonehands) => addResidents(w, 'stonehand', count);
export const addMiners = (w: World, count = tuning.startingMiners) => addResidents(w, 'miner', count);
export function addResidents(w: World, type: string, count = 1, origin?: Point) {
  if (w.outcome) return 0;
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
      crafted: 0,
      level: 1,
      experience: 0,
      nextTrainingAt: w.elapsed,
      health: characterLevel(type, 1).health,
      maxHealth: characterLevel(type, 1).health,
    });
  }
  const added = Math.min(count, positions.length);
  for (const a of w.agents) { initializePay(a); initializeMorale(w,a); }
  if (added) w.nextResidentId = firstId + added - 1;
  if (added) assignRoomSupport(w);
  return added;
}
export function designate(w: World, points: Point[], value: boolean | 'toggle' = true) {
  if (w.outcome) return;
  for (const p of points) {
    const t = tileAt(w, p.x, p.z);
    if (t && (!t.known || (!t.core && !t.onward && ['dirt', 'rock', 'gold', 'gem'].includes(t.terrain))))
      t.designated = value === 'toggle' ? !t.designated : value;
  }
  w.revision++;
}
export function tick(w: World, dt: number) {
  if(w.outcome)return;
  w.elapsed += dt;
  tickSpellEffects(w, dt);
  for (const a of w.agents)
    if (!alive(a)) {
      releaseJob(w, a, 'Resident defeated');
      for (const f of w.roomServices) if (f.assigned === a.id) f.assigned = undefined;
      const t = tileAt(w, Math.round(a.x), Math.round(a.z));
      if (t) t.loose += a.carrying;
      a.carrying = 0;
      w.revision++;
    }
  w.agents = w.agents.filter(alive);
  tickPayday(w);
  const supportChanged = w.routesChanged || Math.floor(w.elapsed - dt) !== Math.floor(w.elapsed);
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
  if (supportChanged) assignRoomSupport(w);
  tickMorale(w,dt);
  tickHearth(w);
  tickSecurity(w);
  const workPool = createWorkPool(w);
  for (const a of [...w.agents]) {
    if (isConstruct(a.type)) { a.energy = 1; a.hunger = 1; }
    if (!isConstruct(a.type) && a.job?.kind !== 'sleep') a.energy = Math.max(0, a.energy - dt / tuning.restInterval);
    if (!isConstruct(a.type) && a.job?.kind !== 'eat') a.hunger = Math.max(0, a.hunger - dt / tuning.hungerInterval);
    if (tickDeparture(w,a,dt)) continue;
    if (tickWorkerRetreat(w,a,dt)) continue;
    if (tickFighter(w, a, dt, releaseJob, moveResident)) continue;
    reviewPatrol(w,a);
    if (shouldSeekPay(w,a)) releaseJob(w,a,'Collecting due wages');
    if (shouldSeekHearth(w,a)) releaseJob(w,a,'Answering the onward Hearthstone');
    if (a.job && !validJob(w, a)) releaseJob(w, a, 'Target, facility, order or access is no longer valid');
    if (
      (a.job?.kind === 'train' || a.job?.kind === 'research' || a.job?.kind === 'scout') &&
      (a.energy < tuning.restThreshold || a.hunger < tuning.hungerThreshold)
    )
      releaseJob(w, a, 'Food or rest takes priority');
    if (!a.job) {
      a.retry -= dt;
      if (a.retry <= 0) {
        chooseJob(w, a, workPool);
        if (!a.job) recordJob(w, a, 'waiting', a.activity);
      }
    }
    if (!a.job) continue;
    if (!moveResident(w, a, dt)) continue;
    recordPoolWork(w, a, dt);
    if (!performJob(w, a, dt)) continue;
    recordJob(w, a, 'completed', 'Work finished');
    a.job = undefined;
    a.path = [];
  }
  tickEncounters(w);
  tickDefenses(w, dt);
  finishHearth(w);
  if (w.outcome) return;
  if (Math.floor((w.elapsed - dt) * 2) !== Math.floor(w.elapsed * 2))
    for (const a of w.agents) reveal(w, a, sightRadius(a));
  recruitSpecialist(w, (type, origin) => addResidents(w, type, 1, origin) > 0);
}
