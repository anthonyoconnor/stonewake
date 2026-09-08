import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, reveal } from '../src/game/world.ts';
import { createHearthLab, createHearthDefeatLab } from '../src/content/hearth-lab.ts';
import { prototypeLevel } from '../src/content/levels.ts';
import { type World, tileAt } from '../src/game/types.ts';
import { addResidents, designate, tick } from '../src/game/simulation.ts';
import { addRaider, placeDefense, setDoorMode, tickDefenses } from '../src/game/defenses.ts';
import { damageEnemy, damageResident } from '../src/game/spell-effects.ts';
import { canStand } from '../src/game/navigation.ts';
import { buildRoom, goldTotal } from '../src/game/rooms.ts';
import { releaseJob } from '../src/game/jobs/common.ts';
import { raiderDefinition } from '../src/content/defenses.ts';
import { tuning } from '../src/content/tuning.ts';
import {
  damageHearth,
  hearthSummary,
  requestHearthActivation,
  tryAttackHearth,
  finishHearth,
  chooseHearthJob,
  performHearthJob,
} from '../src/game/hearth.ts';
import { run, until } from './helpers/simulation.ts';

function objectiveHall() {
  const w = createWorld({
    id: 'objective-hall',
    name: 'Objective hall',
    width: 20,
    height: 12,
    hearth: { x: 3, z: 5 },
    onwardHearth: { id: 'far-stone', name: 'Far runic Hearthstone', x: 16, z: 5 },
    openings: [
      [1, 2, 6, 9],
      [7, 5, 18, 5],
      [14, 3, 18, 7],
    ],
    seams: [],
  });
  for (const t of w.tiles) {
    t.known = true;
    t.claimed = t.terrain === 'floor' && !t.onward;
  }
  buildRoom(w, 'kitchen', [
    { x: 1, z: 2 },
    { x: 2, z: 2 },
  ]);
  buildRoom(w, 'dormitory', [
    { x: 1, z: 8 },
    { x: 2, z: 8 },
  ]);
  addResidents(w, 'miner');
  w.agents[0].capabilities = [];
  w.outputs['timber-door'] = 1;
  return w;
}

test('the ordinary objective is a separate concealed reserved stone and cannot be remotely requested', () => {
  const w = createWorld(prototypeLevel),
    stone = w.onwardHearth!;
  assert(stone && !stone.discovered && !stone.ready);
  assert.equal(tileAt(w, stone.x, stone.z)!.onward, true);
  assert.equal(tileAt(w, stone.x, stone.z)!.core, false);
  assert(!canStand(w, stone));
  assert.equal(hearthSummary(w).name, 'Onward Hearthstone');
  assert.match(requestHearthActivation(w), /Find/);
  assert.equal(stone.requested, false);
  assert.equal(w.roomServices.filter((s) => s.id === 'hearth-treasury').length, 1);
  assert.equal(w.hearthState!.health, tuning.hearthHealth);
});

test('hidden onward floor accepts ordinary excavation plans without exposing its reserved identity', () => {
  const w = createWorld(prototypeLevel), stone = w.onwardHearth!;
  const ordinaryFloor = { x: stone.x - 1, z: stone.z };
  assert(!tileAt(w, stone.x, stone.z)!.known);
  assert(!tileAt(w, ordinaryFloor.x, ordinaryFloor.z)!.known);
  designate(w, [stone, ordinaryFloor]);
  assert.equal(tileAt(w, stone.x, stone.z)!.designated, true);
  assert.equal(tileAt(w, ordinaryFloor.x, ordinaryFloor.z)!.designated, true);
  assert.equal(tileAt(w, stone.x, stone.z)!.known, false);
  reveal(w, { x: stone.x, z: stone.z + 1 });
  assert.equal(tileAt(w, stone.x, stone.z)!.designated, false);
  assert.equal(tileAt(w, ordinaryFloor.x, ordinaryFloor.z)!.designated, false);
  designate(w, [stone]);
  assert.equal(tileAt(w, stone.x, stone.z)!.designated, false);
});

test('discovery across a sealed route is not completion; opening access permits physical eight-second activation', () => {
  const w = objectiveHall(),
    stone = w.onwardHearth!,
    start = { ...w.hearth };
  const treasury = structuredClone(w.roomServices.find((s) => s.id === 'hearth-treasury')!);
  tileAt(w, 10, 5)!.terrain = 'bedrock';
  assert.match(requestHearthActivation(w), /requested/);
  run(w, 12);
  assert.equal(stone.discovered, true);
  assert.equal(stone.progress, 0);
  assert.equal(stone.ready, false);
  assert.match(hearthSummary(w).status, /no living dwarf has a route/);
  tileAt(w, 10, 5)!.terrain = 'floor';
  w.routesChanged = true;
  until(w, () => stone.progress > 0, 15, 'Dwarf reaches onward interaction square');
  const worker = w.agents.find((a) => a.id === stone.worker)!;
  assert.equal(Math.abs(worker.job!.work.x - stone.x) + Math.abs(worker.job!.work.z - stone.z), 1);
  assert(Math.hypot(worker.x - worker.job!.work.x, worker.z - worker.job!.work.z) < 0.11);
  const channelStart = w.elapsed;
  run(w, 6);
  assert.equal(stone.ready, false);
  until(w, () => w.outcome === 'victory', 3, 'Uninterrupted activation completes');
  assert(w.elapsed - channelStart >= 7.8);
  assert.equal(stone.ready, true);
  assert.deepEqual(w.hearth, start);
  assert.deepEqual(
    w.roomServices.find((s) => s.id === 'hearth-treasury'),
    treasury,
  );
  const frozen = structuredClone(w);
  run(w, 20);
  assert.deepEqual(w, frozen, 'Local completion freezes simulation until later campaign travel');
});

test('locking a doorway interrupts a pending activation route and reopening retries the same request', () => {
  const w = objectiveHall();
  assert.match(placeDefense(w, 'timber-door', { x: 10, z: 5 }), /placed/);
  const door = w.defenses![0];
  requestHearthActivation(w);
  tick(w, 0.05);
  assert.equal(w.agents[0].job?.kind, 'activate');
  setDoorMode(w, door.id, 'locked');
  run(w, 3);
  assert.equal(w.onwardHearth!.requested, true);
  assert.equal(w.onwardHearth!.progress, 0);
  assert.notEqual(w.agents[0].job?.kind, 'activate');
  assert(w.agents[0].x < 10);
  setDoorMode(w, door.id, 'closed');
  until(w, () => w.outcome === 'victory', 25, 'Normal automatic door passage restores objective route');
});

test('food, hostile interruption and worker death reset progress without losing the activation request', () => {
  const w = objectiveHall(),
    stone = w.onwardHearth!;
  requestHearthActivation(w);
  until(w, () => stone.progress >= 2, 20, 'Begin activation');
  const first = w.agents[0];
  first.hunger = 0.1;
  tick(w, 0.05);
  assert.equal(stone.progress, 0);
  assert.equal(stone.requested, true);
  until(w, () => first.meals > 0, 20, 'Worker eats before resuming activation');
  until(w, () => stone.progress >= 1, 25, 'Resume activation after meal');
  const enemy = addRaider(w, { x: 17, z: 6 }, { x: 17, z: 6 })!;
  enemy.dormant = true;
  tick(w, 0.05);
  assert.equal(stone.progress, 0);
  assert.match(hearthSummary(w).status, /contested/);
  damageEnemy(w, enemy, 1000);
  until(w, () => stone.progress >= 1, 25, 'Cleared threat permits retry');
  damageResident(w, first, 1000);
  tick(w, 0.05);
  assert.equal(stone.progress, 0);
  assert.equal(stone.worker, undefined);
  assert.equal(w.outcome, undefined);
  addResidents(w, 'engineer');
  until(w, () => w.outcome === 'victory', 30, 'A different dwarf type completes the pending objective');
});

test('funded wages interrupt activation while unfunded debt and departing dwarfs do not claim its work', () => {
  const w = objectiveHall(),
    a = w.agents[0],
    stone = w.onwardHearth!;
  requestHearthActivation(w);
  until(w, () => stone.progress >= 1, 20, 'Begin objective before payday');
  a.pay!.due.push({ at: w.elapsed, amount: 4 });
  tick(w, 0.05);
  assert.equal(stone.progress, 0);
  assert.equal(a.job?.kind, 'pay');
  until(w, () => a.pay!.paid === 4, 20, 'Collect funded wage first');
  releaseJob(w, a);
  w.allowance = 0;
  for (const s of w.roomServices) s.stored = 0;
  a.pay!.due.push({ at: w.elapsed, amount: 4 });
  assert.equal(goldTotal(w), 0);
  assert(chooseHearthJob(w, a), 'Unfunded wages cannot permanently prevent progression');
  releaseJob(w, a);
  a.morale!.leaving = true;
  assert.equal(chooseHearthJob(w, a), false);
  a.morale!.leaving = false;
  assert(chooseHearthJob(w, a));
});

test('core attacks require actual perimeter reach, use Raider cadence and Slow, and preserve adjacent dwarf priority', () => {
  const w = objectiveHall();
  w.agents = [];
  const far = addRaider(w, { x: 8, z: 5 }, { x: 5, z: 5 })!;
  far.sourceId = 'natural-source';
  assert.equal(tryAttackHearth(w, far), false);
  assert.equal(w.hearthState!.health, 400);
  far.x = 5;
  far.effects = [{ id: 'test-slow', kind: 'slow', until: 100, strength: 0.5, startedAt: 0 }];
  assert(tryAttackHearth(w, far));
  const after = w.hearthState!.health;
  assert.equal(after, 400 - raiderDefinition.damage);
  tryAttackHearth(w, far);
  assert.equal(w.hearthState!.health, after);
  assert.equal(far.nextAttackAt, raiderDefinition.attackSeconds * 2);
  addResidents(w, 'miner');
  Object.assign(w.agents[0], { x: 5, z: 4, capabilities: [] });
  w.elapsed = far.nextAttackAt;
  tickDefenses(w, 0.05);
  assert.equal(far.activity, 'Attacking dwarf');
  assert.equal(w.hearthState!.health, after);
  assert(w.agents[0].health! < w.agents[0].maxHealth!);
});

test('core destruction defeats an activation finishing in the same tick and blocks later completion', () => {
  const w = objectiveHall(),
    a = w.agents[0];
  a.x = 15;
  a.z = 5;
  requestHearthActivation(w);
  assert(chooseHearthJob(w, a));
  a.path = [];
  performHearthJob(w, a, tuning.hearthActivationSeconds - 0.025);
  const enemy = addRaider(w, { x: 5, z: 5 }, { x: 5, z: 5 })!;
  enemy.sourceId = 'natural-source';
  damageHearth(w, w.hearthState!.health - raiderDefinition.damage);
  tick(w, 0.05);
  assert.equal(w.outcome, 'defeat');
  assert.equal(w.hearthState!.health, 0);
  assert.equal(w.onwardHearth!.ready, false);
  assert.equal(w.onwardHearth!.progress, 0);
  finishHearth(w);
  assert.equal(w.outcome, 'defeat');
  assert.match(requestHearthActivation(w), /ended/);
});

test('the defended scenario reaches its enemy-held stone and the unguarded variant naturally loses the core', () => {
  const w = createHearthLab();
  designate(w, [{ x: 12, z: 12 }]);
  until(w, () => w.onwardHearth!.discovered, 45, 'Excavation discovers the occupied Hearthstone');
  assert.match(hearthSummary(w).status, /contested/);
  requestHearthActivation(w);
  until(w, () => w.outcome === 'victory', 100, 'Autonomous dwarfs secure and activate the onward stone');
  assert(w.enemies!.some((e) => e.health <= 0));
  assert(w.onwardHearth!.ready);
  const defeat = createHearthDefeatLab();
  designate(defeat, [{ x: 12, z: 12 }]);
  until(defeat, () => defeat.outcome === 'defeat', 120, 'Natural attackers destroy an undefended core');
  assert.equal(defeat.hearthState!.health, 0);
  assert(defeat.enemies!.some((e) => e.activity === 'Attacking Stone Hearth'));
  const fresh = createHearthLab();
  assert.equal(fresh.outcome, undefined);
  assert.equal(fresh.hearthState!.health, fresh.hearthState!.maxHealth);
  assert.equal(fresh.onwardHearth!.discovered, false);
  assert.equal(fresh.onwardHearth!.requested, false);
  assert.equal(fresh.onwardHearth!.progress, 0);
});
