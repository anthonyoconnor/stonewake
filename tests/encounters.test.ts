import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prototypeLevel } from '../src/content/levels.ts';
import { createEncounterLab } from '../src/content/encounter-lab.ts';
import { createWorld } from '../src/game/world.ts';
import { type World, type LevelDefinition, tileAt } from '../src/game/types.ts';
import { encounterSummary, tickEncounters, advanceEncounter } from '../src/game/encounters.ts';
import { addResidents, designate, tick } from '../src/game/simulation.ts';
import { visible } from '../src/game/spell-effects.ts';
import { findPath } from '../src/game/navigation.ts';
import { placeDefense, setDoorMode, tickDefenses } from '../src/game/defenses.ts';
import { run, until } from './helpers/simulation.ts';

const source = (w: World, id: string) => w.encounters!.find((s) => s.definition.id === id)!;
function raidHall(overrides: Partial<NonNullable<LevelDefinition['encounters']>[number]> = {}) {
  const w = createWorld({
    id: 'raid-hall',
    name: 'Raid hall',
    width: 18,
    height: 12,
    hearth: { x: 3, z: 3 },
    openings: [
      [1, 1, 5, 8],
      [5, 8, 17, 8],
    ],
    seams: [],
    encounters: [
      {
        id: 'entrance',
        name: 'Hidden deep entrance',
        kind: 'entrance',
        positions: [{ x: 16, z: 8 }],
        activation: 'time',
        delay: 1,
        warningSeconds: 2,
        clear: 'claim',
        repeatSeconds: 15,
        ...overrides,
      },
    ],
  });
  for (const t of w.tiles) {
    t.known = true;
    t.claimed = t.terrain === 'floor' && t.x <= 12;
  }
  w.outputs['timber-door'] = 1;
  w.outputs['spike-trap'] = 1;
  w.outputs['bolt-trap'] = 1;
  return w;
}

test('ordinary level has concealed residents and a warned raid entering physical undiscovered terrain', () => {
  const w = createWorld(prototypeLevel);
  const camp = source(w, 'buried-guard-camp'),
    entrance = source(w, 'east-deep-passage');
  assert.equal(camp.enemyIds.length, 2);
  assert(w.enemies!.every((e) => e.dormant && !visible(w, e)));
  assert.deepEqual(encounterSummary(w), []);
  const originalDiscovery = w.tiles.map((t) => t.known);
  w.elapsed = 360;
  tickEncounters(w);
  assert.equal(entrance.phase, 'warning');
  assert.equal(entrance.enemyIds.length, 0);
  assert.equal(encounterSummary(w)[0].name, 'Underground raid');
  assert(!JSON.stringify(encounterSummary(w)).includes('46'));
  w.elapsed = 384.9;
  tickEncounters(w);
  assert.equal(entrance.enemyIds.length, 0);
  w.elapsed = 385;
  tickEncounters(w);
  assert.equal(entrance.enemyIds.length, 0, 'The compact starting clearing seals the raid route');
  // Model the player opening an eastern tunnel, preserving the undiscovered approach.
  for (let x = 26; x <= 29; x++) tileAt(w, x, 26)!.terrain = 'floor';
  w.elapsed += 0.5;
  tickEncounters(w);
  const enemy = w.enemies!.find((e) => e.id === entrance.enemyIds[0])!;
  assert.deepEqual({ x: enemy.x, z: enemy.z }, { x: 46, z: 26 });
  assert(!visible(w, enemy));
  assert(!findPath(w, enemy, enemy.target));
  assert(findPath(w, enemy, enemy.target, 'enemy'));
  for (let i = 0; i < 20; i++) {
    w.elapsed += 0.05;
    tickDefenses(w, 0.05);
  }
  assert(enemy.x < 45);
  assert.deepEqual(
    w.tiles.map((t) => t.known),
    originalDiscovery,
    'Enemies never reveal player terrain',
  );
});

test('sealed raid waits without stacked waves; normal excavation discovers a camp and releases real threats', () => {
  const w = createEncounterLab();
  const camp = source(w, 'buried-camp'),
    entrance = source(w, 'deep-entrance');
  run(w, 20);
  assert.equal(camp.phase, 'dormant');
  assert(w.enemies!.every((e) => !visible(w, e)));
  assert.equal(entrance.phase, 'warning');
  assert(entrance.blocked);
  assert.equal(entrance.waves, 0);
  run(w, 10);
  assert.equal(w.enemies!.length, 1, 'A blocked entrance does not queue extra raids');
  designate(w, [{ x: 12, z: 12 }]);
  until(w, () => camp.phase === 'warning', 30, 'Discover camp through excavation');
  assert.equal(tileAt(w, 12, 12)!.terrain, 'floor');
  assert.equal(camp.waves, 0);
  assert.equal(entrance.waves, 1);
  until(w, () => camp.phase === 'cleared', 40, 'Warriors and defenses clear discovered camp');
  assert(
    w.defenses!.some((d) => d.triggeredAt > 0),
    'Natural enemies activate normal traps',
  );
  const campCount = w.enemies!.filter((e) => e.sourceId === 'buried-camp').length;
  run(w, 30);
  // Traps can clear the camp while Warriors eat; later raids still exercise melee.
  assert(w.agents.some((a) => a.type === 'warrior' && (a.experience ?? 0) > 0));
  assert.equal(w.enemies!.filter((e) => e.sourceId === 'buried-camp').length, campCount);
  assert(entrance.waves >= 2, 'Defeated external wave eventually repeats');
  const fresh = createEncounterLab();
  assert.equal(fresh.elapsed, 0);
  assert(fresh.encounters!.every((s) => s.phase === 'dormant' && s.waves === 0));
  assert.equal(tileAt(fresh, 12, 12)!.terrain, 'dirt');
});

test('an authored physical entrance never substitutes a protected, blocked or occupied spawn square', () => {
  for (const obstruction of ['bedrock', 'room', 'dwarf', 'barrier'] as const) {
    const w = raidHall();
    const p = tileAt(w, 16, 8)!;
    if (obstruction === 'bedrock') p.terrain = 'bedrock';
    if (obstruction === 'room') p.room = 'treasure';
    if (obstruction === 'dwarf') {
      addResidents(w, 'warrior');
      Object.assign(w.agents[0], { x: 16, z: 8, capabilities: [] });
    }
    if (obstruction === 'barrier') w.barrier = { x: 16, z: 8, health: 100, maxHealth: 100, until: 100 };
    w.elapsed = 1;
    tickEncounters(w);
    w.elapsed = 3;
    tickEncounters(w);
    assert.equal(w.enemies?.length ?? 0, 0, obstruction);
    assert.equal(source(w, 'entrance').blocked, true, obstruction);
    p.terrain = 'floor';
    p.room = undefined;
    w.agents = [];
    w.barrier = undefined;
    w.elapsed = 4;
    tickEncounters(w);
    assert.equal(w.enemies?.length, 1, obstruction);
    assert.equal(w.enemies![0].x, 16);
    assert.equal(w.enemies![0].z, 8);
  }
});

test('natural raiders respect bedrock, attack shut doors, and use the opened passage', () => {
  const w = raidHall({ repeatSeconds: undefined, clear: 'defeat' });
  assert.match(placeDefense(w, 'timber-door', { x: 12, z: 8 }), /placed/);
  const door = w.defenses![0];
  setDoorMode(w, door.id, 'locked');
  tileAt(w, 14, 8)!.terrain = 'bedrock';
  run(w, 8);
  assert.equal(w.enemies?.length ?? 0, 0);
  assert.equal(door.health, door.maxHealth);
  tileAt(w, 14, 8)!.terrain = 'floor';
  w.routesChanged = true;
  until(w, () => door.health < door.maxHealth, 10, 'Raider reaches and strikes locked door');
  const enemy = w.enemies![0];
  assert(enemy.x > 12.5);
  assert.equal(enemy.activity, 'Breaking down door');
  setDoorMode(w, door.id, 'open');
  until(w, () => enemy.x < 11, 5, 'Open door permits the physical approach');
});

test('repeating entrance waits for defeat, warns each wave, and normal claiming stops it permanently', () => {
  const w = raidHall();
  assert.match(placeDefense(w, 'spike-trap', { x: 10, z: 8 }), /placed/);
  assert.match(placeDefense(w, 'bolt-trap', { x: 6, z: 8 }, 0), /placed/);
  const entrance = source(w, 'entrance');
  until(w, () => entrance.phase === 'cooldown', 25, 'Defenses defeat first wave');
  assert.equal(entrance.waves, 1);
  assert(w.enemies!.every((e) => e.health === 0));
  advanceEncounter(w, 'entrance');
  assert.equal(entrance.phase, 'warning');
  assert.equal(entrance.waves, 1);
  run(w, 1);
  assert.equal(entrance.waves, 1, 'Debug timer advance preserves the full warning');
  until(w, () => entrance.waves === 2, 2, 'Second warned wave enters');
  until(w, () => entrance.phase === 'cooldown', 20, 'Defenses defeat second wave');
  addResidents(w, 'miner');
  // Isolate this normal job from optional wall reinforcement while asserting actual claim work.
  w.agents[0].capabilities = ['claim'];
  until(w, () => entrance.phase === 'cleared', 20, 'Miner physically secures entrance');
  assert(tileAt(w, 16, 8)!.claimed);
  const count = w.enemies!.length;
  run(w, 40);
  advanceEncounter(w);
  assert.equal(w.enemies!.length, count);
  assert.equal(entrance.phase, 'cleared');
});

test('route activation and source warnings obey discovery privacy and do not bypass authored delay', () => {
  const w = raidHall({
    activation: 'route',
    delay: 3,
    warningSeconds: 2,
    warning: 'Hidden deep entrance coordinates 16,8',
  });
  for (const t of w.tiles) if (t.x > 12) t.known = false;
  tileAt(w, 14, 8)!.terrain = 'dirt';
  run(w, 4);
  const entrance = source(w, 'entrance');
  assert.equal(entrance.phase, 'dormant');
  advanceEncounter(w);
  assert.equal(entrance.phase, 'dormant');
  tileAt(w, 14, 8)!.terrain = 'floor';
  run(w, 0.6);
  assert.equal(entrance.phase, 'waiting');
  assert.deepEqual(encounterSummary(w), []);
  run(w, 3);
  assert.equal(entrance.phase, 'warning');
  const summary = JSON.stringify(encounterSummary(w));
  assert(!summary.includes('coordinates'));
  assert(!summary.includes('Hidden deep'));
  assert(!summary.includes('16,8'));
  assert(summary.includes('Underground raid'));
});
