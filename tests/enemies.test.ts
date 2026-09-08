import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/game/world.ts';
import { type World, type Enemy, tileAt } from '../src/game/types.ts';
import { enemyDefinitions, enemyById } from '../src/content/enemies.ts';
import { addEnemy, tickDefenses, placeDefense } from '../src/game/defenses.ts';
import { damageEnemy, health, hasteRate, tickSpellEffects, spellLine } from '../src/game/spell-effects.ts';
import { addResidents } from '../src/game/simulation.ts';
import { enemyWalker, burrowPath, burrowSeconds } from '../src/game/enemy-ai.ts';
import { findPath } from '../src/game/navigation.ts';
import { initializeEncounters, tickEncounters } from '../src/game/encounters.ts';
import { createEnemyLab } from '../src/content/enemy-lab.ts';
import { createEnemyRegion, enemyRegionIds } from '../src/content/enemy-regions.ts';
import { tuning } from '../src/content/tuning.ts';

function hall() {
  const w = createWorld({
    id: 'roster',
    name: 'Roster tests',
    width: 22,
    height: 12,
    hearth: { x: 3, z: 3 },
    openings: [
      [1, 1, 6, 9],
      [1, 8, 20, 8],
    ],
    seams: [],
  });
  for (const t of w.tiles) {
    t.known = true;
    t.claimed = t.terrain === 'floor';
  }
  return w;
}
const run = (w: World, seconds: number) => {
  for (let i = 0; i < Math.ceil(seconds * 20); i++) {
    w.elapsed += 0.05;
    tickSpellEffects(w, 0.05);
    tickDefenses(w, 0.05);
  }
};
function target(w: World, x = 12, z = 8) {
  addResidents(w, 'warrior');
  const a = w.agents.at(-1)!;
  Object.assign(a, { x, z, health: 2000, maxHealth: 2000, capabilities: [] });
  return a;
}

test('all ten defined enemies move, attack, take damage, obey control and die through shared systems', () => {
  assert.equal(enemyDefinitions.length, 10);
  assert.equal(new Set(enemyDefinitions.map((e) => e.id)).size, 10);
  for (const def of enemyDefinitions) {
    const w = hall(),
      a = target(w, 9),
      e = addEnemy(w, { x: 16, z: 8 }, { x: 7, z: 8 }, def.id)!;
    assert.equal(e.maxHealth, def.health);
    run(w, 14);
    assert(e.x < 16, def.id);
    assert(health(a) < 2000, `${def.id} attacks`);
    e.pinnedUntil = w.elapsed + 1;
    const x = e.x;
    run(w, 0.5);
    assert.equal(e.x, x, `${def.id} pinned`);
    damageEnemy(w, e, 10000, 'spell');
    const deadX = e.x;
    run(w, 1);
    assert.equal(e.health, 0);
    assert.equal(e.x, deadX);
    assert.equal(e.activity, 'Defeated');
    assert(e.diedAt !== undefined);
  }
});
test('ranged enemies stop at range and cannot shoot through walls, shut doors or barriers; allies take no splash', () => {
  for (const id of ['crystal-elemental', 'cinderling']) {
    const w = hall(),
      a = target(w, 10),
      e = addEnemy(w, { x: 13, z: 8 }, { x: 7, z: 8 }, id)!,
      ally = addEnemy(w, { x: 12, z: 8 }, { x: 12, z: 8 })!;
    ally.dormant = true;
    run(w, 0.05);
    assert.equal(e.x, 13);
    assert(health(a) < 2000);
    assert.equal(ally.health, 120);
    const hp = health(a);
    tileAt(w, 11, 8)!.terrain = 'rock';
    run(w, 2);
    assert.equal(health(a), hp);
    tileAt(w, 11, 8)!.terrain = 'floor';
    w.barrier = { x: 11, z: 8, health: 100, maxHealth: 100, until: w.elapsed + 10 };
    assert(!spellLine(w, e, a));
    w.barrier = undefined;
    w.outputs['steel-door'] = 1;
    placeDefense(w, 'steel-door', { x: 11, z: 8 });
    assert(!spellLine(w, e, a));
  }
});
test('web slows both movement and attack rate for four seconds, then expires', () => {
  const w = hall(),
    a = target(w, 10),
    e = addEnemy(w, { x: 13, z: 8 }, { x: 7, z: 8 }, 'cave-spider')!;
  run(w, 0.05);
  assert.equal(e.activity, 'Spitting web');
  assert.equal(hasteRate(w, a), 0.5);
  e.dormant = true;
  run(w, 4.1);
  assert.equal(hasteRate(w, a), 1);
});
test('spore pulses affect nearby visible dwarfs, not distant dwarfs or enemy allies', () => {
  const w = hall(),
    a = target(w, 10),
    near = target(w, 11),
    far = target(w, 17);
  const e = addEnemy(w, { x: 12, z: 8 }, { x: 7, z: 8 }, 'spore-brute')!,
    ally = addEnemy(w, { x: 13, z: 8 }, { x: 13, z: 8 })!;
  ally.dormant = true;
  run(w, 0.05);
  assert.equal(health(a), 1988);
  assert.equal(health(near), 1988);
  assert.equal(health(far), 2000);
  assert.equal(hasteRate(w, a), 0.7);
  assert.equal(ally.health, 120);
  assert.equal(e.activity, 'Releasing spores');
});
test('Restless Guard armor mitigates melee and traps while spells retain full damage', () => {
  const w = hall(),
    e = addEnemy(w, { x: 13, z: 8 }, { x: 7, z: 8 }, 'restless-guard')!;
  damageEnemy(w, e, 20, 'dwarf');
  assert.equal(e.health, 137);
  damageEnemy(w, e, 20, 'trap');
  assert.equal(e.health, 124);
  damageEnemy(w, e, 20, 'spell');
  assert.equal(e.health, 104);
});
test('stalker chooses a weaker exposed dwarf and charges for double damage without passing walls', () => {
  const w = hall(),
    strong = target(w, 12),
    weak = target(w, 9);
  weak.health = 500;
  const e = addEnemy(w, { x: 13, z: 8 }, { x: 7, z: 8 }, 'crystalback-stalker')!;
  run(w, 0.05);
  assert.equal(e.activity, 'Charging');
  assert.equal(health(strong), 2000);
  assert(e.chargeUntil! > w.elapsed);
  run(w, 1.3);
  assert(health(weak) <= 468);
  assert.equal(health(strong), 2000);
  const wall = tileAt(w, 8, 8)!;
  wall.terrain = 'bedrock';
  assert(!findPath(w, e, { x: 7, z: 8 }, enemyWalker(e.type)));
});
test('Deepmaw bite cleaves only nearby dwarfs ahead of its jaw', () => {
  const w = hall(),
    a = target(w, 12),
    side = target(w, 11.9),
    behind = target(w, 13.9);
  const e = addEnemy(w, { x: 13, z: 8 }, { x: 7, z: 8 }, 'deepmaw')!;
  behind.z = 8.7;
  run(w, 0.05);
  assert(health(a) < 2000);
  assert(health(side) < 2000);
  assert.equal(health(behind), 2000);
  assert.equal(e.activity, 'Attacking dwarf');
});
test('Sentinel and Deepmaw apply declared door and runic barrier damage multipliers', () => {
  for (const id of ['ancient-sentinel', 'deepmaw']) {
    const w = hall();
    w.outputs['steel-door'] = 1;
    placeDefense(w, 'steel-door', { x: 11, z: 8 });
    const e = addEnemy(w, { x: 12, z: 8 }, { x: 8, z: 8 }, id)!;
    run(w, 1);
    assert.equal(w.defenses![0].health, 500 - enemyById(id).damage * enemyById(id).doorMultiplier!);
    w.defenses = [];
    w.barrier = { x: 11, z: 8, health: 500, maxHealth: 500, until: 100 };
    e.nextAttackAt = 0;
    run(w, 0.05);
    assert.equal(w.barrier.health, 500 - enemyById(id).damage * enemyById(id).doorMultiplier!);
  }
});
test('burrowers physically excavate a sealed dirt route; reinforcement triples work and bedrock/resources stay solid', () => {
  const times: number[] = [];
  for (const reinforced of [false, true]) {
    const w = hall();
    for (const t of w.tiles) if (t.terrain !== 'floor') t.terrain = 'bedrock';
    const wall = tileAt(w, 11, 8)!;
    wall.terrain = 'dirt';
    wall.reinforced = reinforced;
    const e = addEnemy(w, { x: 12, z: 8 }, { x: 8, z: 8 }, 'tunnel-burrower')!;
    assert(burrowPath(w, e, e.target));
    run(w, burrowSeconds(wall) - 0.2);
    assert.equal(wall.terrain, 'dirt');
    assert(e.x >= 12);
    run(w, 0.4);
    assert.equal(wall.terrain, 'floor');
    assert(!wall.claimed);
    assert(!wall.reinforced);
    assert(w.routesChanged);
    times.push(w.elapsed);
    run(w, 6);
    assert(e.x < 11);
  }
  assert(times[1] > times[0] * 2.8);
  for (const terrain of ['bedrock', 'gold', 'gem', 'water', 'lava', 'chasm'] as const) {
    const w = hall();
    for (const t of w.tiles) if (t.terrain !== 'floor') t.terrain = 'bedrock';
    tileAt(w, 11, 8)!.terrain = terrain;
    const e = addEnemy(w, { x: 12, z: 8 }, { x: 8, z: 8 }, 'tunnel-burrower')!;
    assert.equal(burrowPath(w, e, e.target), undefined);
    run(w, 2);
    assert.equal(tileAt(w, 11, 8)!.terrain, terrain);
  }
});
test('Cinderlings alone cross unbridged lava; every type respects water, chasms and bedrock', () => {
  for (const def of enemyDefinitions)
    for (const terrain of ['lava', 'water', 'chasm', 'bedrock'] as const) {
      const w = hall();
      tileAt(w, 11, 8)!.terrain = terrain;
      assert.equal(
        !!findPath(w, { x: 12, z: 8 }, { x: 8, z: 8 }, enemyWalker(def.id)),
        terrain === 'lava' && def.id === 'cinderling',
        `${def.id} ${terrain}`,
      );
    }
  const w = hall();
  tileAt(w, 11, 8)!.terrain = 'lava';
  const e = addEnemy(w, { x: 12, z: 8 }, { x: 8, z: 8 }, 'cinderling')!;
  run(w, 4);
  assert(e.x < 11);
});
test('all types trigger spikes, armor applies and dead creatures stop acting', () => {
  for (const def of enemyDefinitions) {
    const w = hall();
    w.outputs['spike-trap'] = 1;
    placeDefense(w, 'spike-trap', { x: 12, z: 8 });
    const e = addEnemy(w, { x: 12, z: 8 }, { x: 8, z: 8 }, def.id)!;
    run(w, 0.05);
    assert.equal(e.health, def.health - 40 * (1 - (def.armor ?? 0)), def.id);
    assert(e.pinnedUntil > w.elapsed);
  }
});
test('all types integrate mixed camps, warning activation, defeat clearing and ordinary Hearth attacks', () => {
  const w = createEnemyLab();
  assert.equal(w.enemies!.length, 10);
  assert.equal(new Set(w.enemies!.map((e) => e.type)).size, 10);
  tickEncounters(w);
  assert(w.encounters!.every((s) => s.phase === 'warning'));
  w.elapsed = 9;
  tickEncounters(w);
  assert(w.enemies!.every((e) => !e.dormant));
  for (const e of w.enemies!) damageEnemy(w, e, 10000);
  tickEncounters(w);
  assert(w.encounters!.every((s) => s.phase === 'cleared'));
  for (const def of enemyDefinitions) {
    const area = hall(),
      e = addEnemy(area, { x: 5, z: 3 }, { x: 5, z: 3 }, def.id)!;
    e.sourceId = 'natural';
    run(area, 0.05);
    assert(area.hearthState!.health < area.hearthState!.maxHealth, def.id);
  }
});
test('typed raid sources honor physical routes and reject unknown or misaligned rosters', () => {
  const w = hall();
  for (const t of w.tiles) t.claimed = t.x < 7;
  const def = {
    id: 'mixed',
    name: 'Mixed entrance',
    kind: 'entrance' as const,
    positions: [
      { x: 18, z: 8 },
      { x: 20, z: 8 },
    ],
    roster: ['crystal-elemental', 'restless-guard'],
    activation: 'time' as const,
    delay: 0,
    warningSeconds: 1,
    clear: 'defeat' as const,
  };
  initializeEncounters(w, [def]);
  tickEncounters(w);
  w.elapsed = 2;
  tickEncounters(w);
  assert.deepEqual(
    w.enemies!.map((e) => e.type),
    def.roster,
  );
  assert(w.enemies!.every((e) => e.sourceId === 'mixed'));
  assert.throws(() => initializeEncounters(hall(), [{ ...def, roster: ['missing', 'goblin-raider'] }]));
  assert.throws(() => initializeEncounters(hall(), [{ ...def, roster: ['cinderling'] }]));
});
test('five ordinary regional maps expose all ten enemies with normal startup resources, recruitment and hidden physical objectives', () => {
  const roster = new Set<string>();
  for (const region of enemyRegionIds) {
    const w = createEnemyRegion(region);
    assert.equal(w.agents.length, 3);
    assert(w.agents.every((a) => a.type === 'miner'));
    assert.equal(w.allowance, tuning.startingGold);
    assert.equal(w.defenses?.length ?? 0, 0);
    assert.equal(Object.keys(w.outputs).length, 0);
    assert.equal(w.tiles.filter((t) => t.room).length, 0);
    assert(w.recruitment?.enabled);
    assert(!w.freeRoomBuilding);
    assert(w.tiles.some((t) => t.terrain === 'gold'));
    assert(w.tiles.some((t) => t.terrain === 'gem'));
    assert(!w.onwardHearth?.discovered);
    assert(w.enemies!.every((e) => e.dormant && !tileAt(w, Math.round(e.x), Math.round(e.z))!.known));
    for (const e of w.enemies!) roster.add(e.type!);
    assert(w.tiles.filter((t) => t.known && t.claimed && t.terrain === 'floor' && !t.core).length >= 12);
  }
  assert.deepEqual([...roster].sort(), enemyDefinitions.map((e) => e.id).sort());
});
test('Slow halves physical travel for every species, with no undocumented immunity', () => {
  for (const def of enemyDefinitions) {
    const normal = hall(),
      slowed = hall();
    const e = addEnemy(normal, { x: 16, z: 8 }, { x: 8, z: 8 }, def.id)!,
      s = addEnemy(slowed, { x: 16, z: 8 }, { x: 8, z: 8 }, def.id)!;
    s.effects = [{ id: 'slow', kind: 'slow', startedAt: 0, until: 10, strength: 0.5 }];
    run(normal, 1);
    run(slowed, 1);
    assert(Math.abs((16 - e.x) / 2 - (16 - s.x)) < 0.001, def.id);
  }
});
test('Cinderling camps and raids target a reachable lava Hearth approach instead of an isolated floor side', () => {
  for (const kind of ['camp', 'entrance'] as const) {
    const w = hall();
    for (const t of w.tiles)
      if (!t.core) {
        t.terrain = 'bedrock';
        t.claimed = false;
      }
    tileAt(w, 1, 3)!.terrain = 'floor';
    for (let x = 5; x <= 18; x++) tileAt(w, x, 3)!.terrain = 'lava';
    initializeEncounters(w, [
      {
        id: 'lava-approach',
        name: 'Lava approach',
        kind,
        positions: [{ x: 18, z: 3 }],
        roster: ['cinderling'],
        activation: 'time',
        delay: 0,
        warningSeconds: 1,
        clear: 'defeat',
      },
    ]);
    if (kind === 'camp') assert.deepEqual(w.enemies![0].target, { x: 5, z: 3 });
    tickEncounters(w);
    w.elapsed = 2;
    tickEncounters(w);
    assert.equal(w.encounters![0].phase, 'active');
    assert.deepEqual(w.enemies![0].target, { x: 5, z: 3 });
    run(w, 10);
    assert(
      w.hearthState!.health < w.hearthState!.maxHealth,
      'Natural Cinderling reaches a real firing position',
    );
  }
});
