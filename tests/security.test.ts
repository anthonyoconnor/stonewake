import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, reveal } from '../src/game/world.ts';
import { addResidents, designate, tick } from '../src/game/simulation.ts';
import { addEnemy } from '../src/game/defenses.ts';
import { damageResident, visible } from '../src/game/spell-effects.ts';
import { tickSecurity, knownDanger } from '../src/game/security.ts';
import { damageHearth } from '../src/game/hearth.ts';
import { take } from '../src/game/jobs/common.ts';
import { tileAt, type World } from '../src/game/types.ts';
import { run } from './helpers/simulation.ts';

function arena() {
  const w = createWorld({
    id: 'security',
    name: 'Security patrol',
    width: 40,
    height: 18,
    hearth: { x: 5, z: 8 },
    openings: [[2, 2, 37, 15]],
    seams: [],
  });
  for (const t of w.tiles)
    if (t.terrain === 'floor') {
      t.known = true;
      t.claimed = true;
    }
  return w;
}
function unit(w: World, type: string, x: number, z: number) {
  addResidents(w, type);
  const a = w.agents.at(-1)!;
  Object.assign(a, { x, z });
  return a;
}
test('a hound pack keeps patrolling fully explored ground and spreads its destinations', () => {
  const w = arena(),
    dogs = [unit(w, 'cave-hound', 6, 12), unit(w, 'cave-hound', 8, 12), unit(w, 'cave-hound', 10, 12)];
  const moved = [0, 0, 0];
  let separated = false;
  for (let i = 0; i < 25; i++) {
    const before = dogs.map((a) => ({ x: a.x, z: a.z }));
    run(w, 1);
    dogs.forEach((a, n) => {
      if (Math.hypot(a.x - before[n].x, a.z - before[n].z) > 0.5) moved[n]++;
    });
    const goals = dogs.map((a) => a.job?.target);
    separated ||=
      goals.every(Boolean) && Math.hypot(goals[0]!.x - goals[1]!.x, goals[0]!.z - goals[1]!.z) >= 3;
  }
  assert(
    moved.every((n) => n >= 20),
    `Each dog should walk most of the time: ${moved}`,
  );
  assert(separated);
  assert(dogs.every((a) => a.job?.kind === 'scout'));
});
test('dogs explore a newly mined passage beyond the former Hearth radius', () => {
  const w = createWorld({
    id: 'opening',
    name: 'Opening',
    width: 40,
    height: 18,
    hearth: { x: 5, z: 8 },
    openings: [
      [2, 5, 10, 12],
      [12, 7, 36, 9],
    ],
    seams: [],
  });
  const dogs = [unit(w, 'cave-hound', 7, 10), unit(w, 'cave-hound', 8, 11)];
  run(w, 15);
  assert(dogs.every((a) => a.x < 11));
  assert.equal(tileAt(w, 32, 8)!.known, false);
  unit(w, 'stonehand', 10, 8);
  designate(w, [{ x: 11, z: 8 }]);
  let far = 0;
  for (let i = 0; i < 35; i++) {
    run(w, 1);
    far = Math.max(far, ...dogs.map((a) => a.x));
  }
  assert.equal(tileAt(w, 11, 8)!.terrain, 'floor');
  assert(far > 25, `Patrol reached x=${far}`);
  assert(tileAt(w, 32, 8)!.known);
  assert.equal(tileAt(w, 11, 7)!.terrain, 'dirt');
});
test('dogs answer distant shared sightings, route around walls and fight without individual orders', () => {
  const w = arena();
  for (let z = 2; z <= 12; z++) tileAt(w, 16, z)!.terrain = 'rock';
  const dog = unit(w, 'cave-hound', 8, 10);
  unit(w, 'engineer', 24, 9);
  const enemy = addEnemy(w, { x: 26, z: 9 }, w.hearth)!;
  enemy.dormant = true;
  tick(w, 0.05);
  assert(dog.responding);
  assert.equal(dog.combatTarget, enemy.id);
  assert(
    dog.path.some((p) => p.z >= 13),
    'Response uses the real opening around the wall',
  );
  run(w, 24);
  assert.equal(enemy.health, 0);
  assert(dog.health! > 0);
});
test('unseen enemies do not produce reports, and lost sightings retain only the last observed position', () => {
  const w = arena(),
    dog = unit(w, 'cave-hound', 8, 10);
  const enemy = addEnemy(w, { x: 26, z: 9 }, w.hearth)!;
  enemy.dormant = true;
  tickSecurity(w);
  assert.equal(knownDanger(w).length, 0);
  assert(!visible(w, enemy));
  const observer = unit(w, 'engineer', 24, 9);
  w.elapsed = 1;
  tickSecurity(w);
  assert.equal(knownDanger(w)[0].x, 26);
  Object.assign(observer, { x: 5, z: 12 });
  enemy.x = 34;
  w.elapsed = 2;
  tickSecurity(w);
  assert.equal(knownDanger(w)[0].x, 26);
  tick(w, 0.05);
  assert(dog.responding);
  assert.equal(dog.combatTarget, undefined);
  assert(dog.path.at(-1)!.x < 28, 'Investigate the report, not a hidden live position');
});
test('damage reports call dogs to an attacked resident even when no attacker is visible', () => {
  const w = arena(),
    dog = unit(w, 'cave-hound', 8, 10),
    victim = unit(w, 'engineer', 25, 9);
  damageResident(w, victim, 1);
  tick(w, 0.05);
  assert(dog.responding);
  assert.match(dog.activity, /Investigating/);
  let arrived = false;
  for (let i = 0; i < 200; i++) {
    tick(w, 0.05);
    arrived ||= Math.hypot(dog.x - 25, dog.z - 9) < 2;
  }
  assert(arrived);
  assert(dog.guard!.checked[`resident:${victim.id}`] !== undefined);
});
test('Stonehands and legacy Miners release work, keep cargo and escape a real enemy while dogs defend', () => {
  for (const type of ['stonehand', 'miner']) {
    const w = arena(),
      worker = unit(w, type, 20, 8),
      dog = unit(w, 'cave-hound', 15, 8);
    unit(w, 'cave-hound', 15, 9);
    const gold = tileAt(w, 22, 8)!;
    Object.assign(gold, { terrain: 'gold', gold: 90, designated: true, claimed: false });
    assert(take(w, worker, 'mine', gold, { x: 21, z: 8 }));
    worker.carrying = 15;
    worker.cargoOrigin = { x: 22, z: 8 };
    worker.workAssignment = { group: 'resource', target: { x: 22, z: 8 }, remaining: 20 };
    const enemy = addEnemy(w, { x: 21, z: 9 }, w.hearth)!;
    assert(enemy);
    run(w, 1);
    assert(worker.fleeing);
    assert.equal(worker.job, undefined);
    assert.equal(worker.workAssignment, undefined);
    assert.equal(worker.carrying, 15);
    assert(Math.hypot(worker.x - 20, worker.z - 8) > 2);
    assert.equal(gold.gold, 90);
    assert(dog.combatTarget === enemy.id || enemy.health === 0);
    run(w, 25);
    assert.equal(enemy.health, 0);
    assert(worker.health! > 0);
    assert.equal(worker.fleeing, undefined);
  }
});
test('workers do not take a route back into a known enemy; work resumes after it is cleared', () => {
  const w = arena(),
    worker = unit(w, 'stonehand', 7, 8);
  unit(w, 'engineer', 24, 10);
  const gold = tileAt(w, 23, 8)!;
  Object.assign(gold, { terrain: 'gold', gold: 90, designated: true, claimed: false });
  const enemy = addEnemy(w, { x: 21, z: 8 }, w.hearth)!;
  enemy.dormant = true;
  tickSecurity(w);
  assert.equal(take(w, worker, 'mine', gold, { x: 22, z: 8 }), false);
  run(w, 10);
  assert.equal(gold.gold, 90);
  assert(Math.hypot(worker.x - enemy.x, worker.z - enemy.z) >= 4);
  enemy.health = 0;
  run(w, 45);
  assert(gold.gold < 90, 'Resource work resumes once the threat has gone');
});
test('a ranged hit outside the proximity trigger sends the worker away from the attacker', () => {
  const w = arena(),
    worker = unit(w, 'stonehand', 20, 8);
  const enemy = addEnemy(w, { x: 16, z: 9 }, w.hearth, 'crystal-elemental')!;
  const before = Math.hypot(worker.x - enemy.x, worker.z - enemy.z);
  run(w, 2);
  assert(worker.hitAt !== undefined);
  assert(worker.fleeing);
  assert(worker.health! > 0);
  assert(
    Math.hypot(worker.x - enemy.x, worker.z - enemy.z) > before + 2,
    JSON.stringify({
      before,
      worker: {
        x: worker.x,
        z: worker.z,
        health: worker.health,
        activity: worker.activity,
        path: worker.path,
      },
      enemy: { x: enemy.x, z: enemy.z },
    }),
  );
});

test('a Hearth attack recalls a distant patrol to a reachable approach', () => {
  const w = arena(),
    dog = unit(w, 'cave-hound', 30, 8);
  damageHearth(w, 1);
  tick(w, 0.05);
  assert(dog.responding);
  assert.match(dog.activity, /Investigating/);
  let reached = false;
  for (let i = 0; i < 200; i++) {
    tick(w, 0.05);
    reached ||= Math.hypot(dog.x - w.hearth.x, dog.z - w.hearth.z) < 3;
  }
  assert(reached);
  assert(dog.guard!.checked.hearth !== undefined);
});

test('a damaged worker with no escape cannot teleport or resume dangerous work', () => {
  const w = arena();
  for (const t of w.tiles) if (!t.core) t.terrain = 'rock';
  for (const x of [20, 21]) tileAt(w, x, 8)!.terrain = 'floor';
  const worker = unit(w, 'stonehand', 20, 8);
  const enemy = addEnemy(w, { x: 21, z: 8 }, w.hearth)!;
  enemy.dormant = true;
  damageResident(w, worker, 1);
  run(w, 0.5);
  assert(worker.fleeing);
  assert.equal(worker.x, 20);
  assert.equal(worker.z, 8);
  assert.equal(worker.job, undefined);
  assert.match(worker.activity, /No safe escape/);
});
