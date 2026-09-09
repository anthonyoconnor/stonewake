import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/game/world.ts';
import { tickDefenses } from '../src/game/defenses.ts';
import { encounterSummary, initializeEncounters, tickEncounters, type EncounterDefinition } from '../src/game/encounters.ts';
import { tileAt, type World } from '../src/game/types.ts';
import { visible } from '../src/game/spell-effects.ts';
import { addResidents } from '../src/game/simulation.ts';

function habitatWorld(def: Partial<EncounterDefinition> = {}) {
  return createWorld({ id: 'habitat', name: 'Habitat', width: 27, height: 17, hearth: { x: 3, z: 4 },
    biome: 'fungal', openings: [[1, 1, 6, 8], [11, 3, 25, 14]], seams: [], encounters: [{
      id: 'nest', name: 'Fungal nest', kind: 'nest', positions: [{ x: 17, z: 8 }, { x: 20, z: 8 }],
      roster: ['cave-spider', 'spore-brute'], activation: 'discovery', delay: 0, warningSeconds: 2,
      clear: 'defeat', habitat: { biome: 'fungal', radius: 3 }, pressure: 'territorial', ...def,
    }] });
}
function advance(w: World, seconds: number) {
  for (let i = 0; i < seconds * 20; i++) { w.elapsed += 0.05; tickEncounters(w); tickDefenses(w, 0.05); }
}

test('concealed species roam and nest through real local paths without discovering terrain or attacking the Hearth', () => {
  const w = habitatWorld(), known = w.tiles.map(t => t.known), start = w.enemies!.map(e => ({ x: e.x, z: e.z }));
  let moved = false;
  for (let i = 0; i < 30; i++) {
    advance(w, 1);
    moved ||= w.enemies!.some((e, index) => Math.hypot(e.x - start[index].x, e.z - start[index].z) > 0.5);
    for (const e of w.enemies!) {
      assert(Math.hypot(e.x - e.habitat!.home.x, e.z - e.habitat!.home.z) <= e.habitat!.radius + 0.01);
      assert.equal(tileAt(w, Math.round(e.x), Math.round(e.z))!.terrain, 'floor');
      assert(!visible(w, e));
    }
  }
  assert(moved, 'Local inhabitants should visibly change positions before contact');
  assert.deepEqual(w.tiles.map(t => t.known), known);
  assert.deepEqual(encounterSummary(w), []);
  assert.equal(w.encounters![0].waves, 0);
});

test('deliberate sentries turn while holding their authored square; sealed local routes do not excavate', () => {
  const w = habitatWorld({ roster: ['ancient-sentinel', 'tunnel-burrower'], habitat: { biome: 'ancient', radius: 3, behavior: 'sentry' } });
  const start = w.enemies!.map(e => ({ x: e.x, z: e.z })), facing = w.enemies![0].facing;
  advance(w, 5);
  assert.deepEqual(w.enemies!.map(e => ({ x: e.x, z: e.z })), start);
  assert.notEqual(w.enemies![0].facing, facing);
  assert(w.enemies!.every(e => e.activity === 'Watching the hall'));
  assert(w.tiles.filter(t => t.x >= 7 && t.x <= 10).every(t => t.terrain !== 'floor'));
});

test('territorial inhabitants fight intruders after warning, then return to local activity without a settlement raid', () => {
  const w = habitatWorld();
  for (const t of w.tiles) if (t.x >= 11) t.known = true;
  advance(w, 2.1);
  assert.equal(w.encounters![0].phase, 'active');
  assert.match(encounterSummary(w)[0].status, /territory/);
  addResidents(w, 'warrior');
  const a = w.agents[0], e = w.enemies![0];
  Object.assign(a, { x: e.x + 0.6, z: e.z, health: 1000, maxHealth: 1000 });
  advance(w, 0.2);
  assert(a.health! < 1000);
  w.agents = [];
  advance(w, 20);
  assert(w.enemies!.every(e => Math.hypot(e.x - e.habitat!.home.x, e.z - e.habitat!.home.z) <= e.habitat!.radius + 0.01));
  assert(w.enemies!.every(e => !e.activity.includes('Hearth')));
  for (const e of w.enemies!) e.health = 0;
  advance(w, 60);
  assert.equal(w.encounters![0].phase, 'cleared');
  assert.equal(w.enemies!.length, 2, 'Secured habitats never repopulate');
});

test('two authored pressures preserve independent warning/recovery and a single blocked wave through physical routes', () => {
  const w = habitatWorld({ kind: 'entrance', pressure: 'raid', activation: 'time', delay: 1, repeatSeconds: 8, clear: 'claim',
    roster: ['goblin-raider', 'goblin-raider'] });
  const first = w.encounters![0].definition;
  initializeEncounters(w, [first, { ...first, id: 'flank', name: 'Burrowing flank', positions: [{ x: 23, z: 12 }],
    roster: ['tunnel-burrower'], delay: 3, repeatSeconds: 12 }]);
  w.elapsed = 1; tickEncounters(w);
  assert.equal(w.encounters![0].phase, 'warning');
  w.elapsed = 3; tickEncounters(w);
  assert(w.encounters![0].blocked);
  assert.equal(w.encounters![1].phase, 'warning');
  w.elapsed = 5; tickEncounters(w);
  assert.equal(w.encounters![1].waves, 1, 'A burrower has a physical, eligible excavation flank');
  for (const e of w.enemies ?? []) e.health = 0;
  w.elapsed = 6; tickEncounters(w);
  assert.equal(w.encounters![1].phase, 'cooldown');
  assert.equal(w.encounters![1].nextAt, 18);
  w.elapsed = 17; tickEncounters(w);
  assert.equal(w.enemies!.length, 1);
  assert.equal(w.encounters![0].waves, 0);
  for (let x = 7; x <= 10; x++) tileAt(w, x, 6)!.terrain = 'floor';
  w.elapsed = 18; tickEncounters(w);
  assert.equal(w.encounters![0].waves, 1);
  assert.equal(w.encounters![1].phase, 'warning');
  w.elapsed = 20; tickEncounters(w);
  assert.equal(w.encounters![1].waves, 2);
  assert.equal(w.enemies!.length, 4, 'Only one live group per source, after full respite and warning');
  tileAt(w, 17, 8)!.claimed = true;
  w.elapsed = 21; tickEncounters(w);
  assert.equal(w.encounters![0].phase, 'cleared');
});
