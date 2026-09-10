import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/game/world.ts';
import { tickDefenses } from '../src/game/defenses.ts';
import { encounterSummary, initializeEncounters, tickEncounters, type EncounterDefinition } from '../src/game/encounters.ts';
import { tileAt, type World } from '../src/game/types.ts';
import { visible, damageEnemy } from '../src/game/spell-effects.ts';
import { addResidents } from '../src/game/simulation.ts';
import { enemyDefinitions } from '../src/content/enemies.ts';
import { createEnemyHabitat, type BiomeId } from '../src/content/habitats.ts';
import { prototypeLevel } from '../src/content/levels.ts';
import { authoredCampaignLevels } from '../src/content/campaign-levels.ts';
import { enemyRegionIds, enemyRegionLevel } from '../src/content/enemy-regions.ts';

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

test('sentries inspect nearby watch posts and return home; sealed local routes do not excavate', () => {
  const w = habitatWorld({ roster: ['ancient-sentinel', 'tunnel-burrower'], habitat: { biome: 'ancient', radius: 3, behavior: 'sentry' } });
  const e = w.enemies![0];
  let moved = false, returned = false;
  for (let i = 0; i < 80; i++) {
    advance(w, 1);
    const away = Math.hypot(e.x - e.habitat!.home.x, e.z - e.habitat!.home.z);
    moved ||= away > 0.5;
    returned ||= moved && away < 0.05;
  }
  assert(moved && returned, 'Watch circuits must include actual travel and a return to the station');
  assert(w.tiles.filter(t => t.x >= 7 && t.x <= 10).every(t => t.terrain !== 'floor'));
});

test('every species repeatedly moves before discovery with its own habitat cadence', () => {
  for (const def of enemyDefinitions) {
    const w = habitatWorld({ positions: [{ x: 17, z: 8 }], roster: [def.id], habitat: { biome: def.region as BiomeId } });
    const e = w.enemies![0], h = e.habitat!;
    const visited = new Set<string>();
    let distanceTravelled = 0;
    for (let i = 0; i < 60 * 20; i++) {
      const previous = { x: e.x, z: e.z };
      advance(w, 0.05);
      distanceTravelled += Math.hypot(e.x - previous.x, e.z - previous.z);
      visited.add(`${Math.round(e.x)},${Math.round(e.z)}`);
      assert(Math.hypot(e.x - h.home.x, e.z - h.home.z) <= h.radius + 0.01, def.id);
    }
    assert(distanceTravelled > 4 && visited.size >= 3, `${def.id} must keep travelling, including heavy sentries`);
    assert.equal(w.encounters![0].phase, 'dormant');
  }
});

test('legacy Free Play camps roam by default and continue when a released raid has no route', () => {
  const w = createWorld(prototypeLevel), start = w.enemies!.map(e => ({ x: e.x, z: e.z }));
  advance(w, 6);
  assert(w.enemies!.every((e, i) => Math.hypot(e.x - start[i].x, e.z - start[i].z) > 0.5));
  for (const e of w.enemies!) e.dormant = false;
  const before = w.enemies!.map(e => ({ x: e.x, z: e.z }));
  advance(w, 10);
  assert(w.enemies!.every((e, i) => Math.hypot(e.x - before[i].x, e.z - before[i].z) > 0.5));
  assert.equal(w.hearthState!.health, w.hearthState!.maxHealth);
});

test('every starting inhabitant moves in authored campaign and regional Free Play terrain', () => {
  for (const level of [...authoredCampaignLevels, ...enemyRegionIds.map(enemyRegionLevel)]) {
    const w = createWorld(level), travelled = w.enemies!.map(() => 0);
    for (let i = 0; i < 40 * 20; i++) {
      const before = w.enemies!.map(e => ({ x: e.x, z: e.z }));
      advance(w, 0.05);
      w.enemies!.forEach((e, index) => travelled[index] += Math.hypot(e.x - before[index].x, e.z - before[index].z));
    }
    w.enemies!.forEach((e, index) => assert(travelled[index] > 2, `${level.id}: ${e.type} must move through actual level geometry`));
  }
});

test('species profiles preserve authored overrides', () => {
  const h = createEnemyHabitat({ biome: 'fungal', behavior: 'patrol', radius: 5, pauseSeconds: 2, speedFraction: 0.4 },
    { x: 17, z: 8 }, 'cave-spider', 0, 0, true);
  assert.equal(h.behavior, 'patrol');
  assert.equal(h.radius, 5);
  assert.equal(h.pauseSeconds, 2);
  assert.equal(h.speedFraction, 0.4);
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

test('attacking a warned inhabitant permits local self-defense without releasing the raid early', () => {
  const w = habitatWorld({ pressure: 'raid', warningSeconds: 18 });
  for (const t of w.tiles) if (t.x >= 11) t.known = true;
  addResidents(w, 'warrior');
  const e = w.enemies![0], a = w.agents[0];
  Object.assign(a, { x: e.x + 0.6, z: e.z, health: 1000, maxHealth: 1000 });
  damageEnemy(w, e, 1, 'dwarf');
  advance(w, 0.2);
  assert(a.health! < 1000, 'Warning time cannot make an attacked inhabitant helpless');
  assert.equal(w.encounters![0].phase, 'warning');
  assert.equal(w.encounters![0].waves, 0);
  assert(e.dormant, 'The full source warning still governs settlement raids');
  w.agents = [];
  advance(w, 5);
  assert(e.x > 11, 'Local self-defense does not prematurely march toward the Hearth');
});
