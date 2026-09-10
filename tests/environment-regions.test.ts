import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/game/world.ts';
import { tileAt, type LevelDefinition, type Point } from '../src/game/types.ts';
import {
  environmentDecoration,
  environmentMaterialVariant,
  environmentRegionAt,
  type EnvironmentRegionKind,
} from '../src/content/environment-regions.ts';
import { environmentPalette } from '../src/content/environment-visuals.ts';
import { lightingSources, lightReaches } from '../src/content/lighting.ts';
import { buildRoom, roomQuote, roomStats, goldTotal } from '../src/game/rooms.ts';
import { reachable } from '../src/game/navigation.ts';
import { roomById } from '../src/content/rooms.ts';

const rect = (x: number, z: number, width: number, height: number): Point[] =>
  Array.from({ length: width * height }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));
function regionalLevel(kind: EnvironmentRegionKind): LevelDefinition {
  return {
    id: 'regional-test',
    name: 'Regional chamber',
    width: 24,
    height: 20,
    biome: 'upper',
    hearth: { x: 4, z: 14 },
    openings: [[2, 2, 21, 17]],
    seams: [
      { terrain: 'bedrock', cells: rect(11, 3, 1, 9) },
      { terrain: 'water', cells: rect(15, 7, 2, 3) },
      { terrain: 'gold', cells: [{ x: 19, z: 4 }] },
      { terrain: 'gem', cells: [{ x: 19, z: 5 }] },
    ],
    environmentRegions: [{ id: 'test-place', kind, cells: rect(1, 1, 22, 18) }],
  };
}
function knownWorld(kind: EnvironmentRegionKind) {
  const w = createWorld(regionalLevel(kind));
  for (const t of w.tiles) {
    t.known = true;
    if (!t.core) t.claimed = false;
  }
  return w;
}

test('authored region overlap is local and independent across world/restart copies', () => {
  const level = regionalLevel('dry');
  level.environmentRegions!.push({ id: 'damp-margin', kind: 'damp', cells: rect(14, 6, 4, 5) });
  const w = createWorld(level),
    restarted = createWorld(level);
  assert.equal(environmentRegionAt(w, { x: 15, z: 7 })?.kind, 'damp');
  assert.equal(environmentRegionAt(w, { x: 6, z: 6 })?.kind, 'dry');
  assert.equal(environmentRegionAt(w, { x: 0, z: 0 }), undefined);
  assert.notEqual(
    environmentPalette(w, { x: 15, z: 7 }).ground,
    environmentPalette(w, { x: 6, z: 6 }).ground,
  );
  assert.notEqual(
    environmentMaterialVariant(w, { x: 15, z: 7 }),
    environmentMaterialVariant(w, { x: 6, z: 6 }),
  );
  w.environmentRegions![0].cells[0].x = 99;
  assert.notEqual(restarted.environmentRegions![0].cells[0].x, 99);
  assert.notEqual(level.environmentRegions![0].cells[0].x, 99);
  w.environmentRegions = [{ id: 'replacement', kind: 'crystal', cells: [{ x: 15, z: 7 }] }];
  assert.equal(
    environmentRegionAt(w, { x: 15, z: 7 })?.kind,
    'crystal',
    'Live replacement invalidates lookup',
  );
  assert.equal(environmentRegionAt(restarted, { x: 15, z: 7 })?.kind, 'damp');
});

test('colonies illuminate only their discovered edge and disappear when claimed or built', () => {
  const w = knownWorld('fungal');
  const tile = w.tiles.find((t) => environmentDecoration(w, t))!;
  assert(tile, 'The chamber contains a sparse colony at a real edge');
  const edge = environmentDecoration(w, tile)!.edge;
  const sourceId = `growth-${tile.x}-${tile.z}`;
  assert(lightingSources(w).some((s) => s.id === sourceId));
  const before = w.tiles.map((t) => ({ terrain: t.terrain, known: t.known, claimed: t.claimed }));
  w.tiles.forEach((t) => environmentDecoration(w, t));
  lightingSources(w);
  assert.deepEqual(
    w.tiles.map((t) => ({ terrain: t.terrain, known: t.known, claimed: t.claimed })),
    before,
    'Presentation never discovers, claims or changes terrain',
  );
  tile.known = false;
  assert.equal(environmentDecoration(w, tile), undefined);
  assert(!lightingSources(w).some((s) => s.id === sourceId));
  tile.known = true;
  const adjacent = w.tiles.filter((t) => Math.abs(t.x - tile.x) + Math.abs(t.z - tile.z) === 1);
  adjacent.forEach((t) => (t.known = false));
  assert.equal(
    environmentDecoration(w, tile),
    undefined,
    'A known floor cannot reveal a hidden bank through decoration',
  );
  adjacent.forEach((t) => (t.known = true));
  tile.claimed = true;
  assert.equal(environmentDecoration(w, tile), undefined);
  assert(!lightingSources(w).some((s) => s.id === sourceId));
  tile.claimed = false;
  tile.room = 'library';
  assert.equal(environmentDecoration(w, tile), undefined);
  assert(!lightingSources(w).some((s) => s.id === sourceId));
  assert(!lightReaches(w, { x: 9, z: 6 }, { x: 13, z: 6 }), 'Local light still stops behind solid terrain');
  assert(edge.terrain !== 'floor');
  for (const terrain of ['gold', 'gem', 'water']) {
    const resource = w.tiles.find((t) => t.terrain === terrain)!;
    assert.equal(
      environmentDecoration(w, resource),
      undefined,
      `${terrain} retains its separate terrain identity`,
    );
  }
});

test('all regional treatments preserve real irregular room construction, capacity and access', () => {
  const kinds: EnvironmentRegionKind[] = ['dry', 'damp', 'fungal', 'masonry', 'crystal', 'scorched'];
  for (const kind of kinds)
    for (const free of [false, true]) {
      const w = knownWorld(kind);
      w.freeRoomBuilding = free;
      const footprint = [
        { x: 6, z: 12 },
        { x: 7, z: 12 },
        { x: 8, z: 12 },
        { x: 8, z: 13 },
        { x: 8, z: 14 },
      ];
      for (const p of footprint) tileAt(w, p.x, p.z)!.claimed = true;
      const routeBefore = [...reachable(w, { x: 6, z: 14 })].sort();
      const goldBefore = goldTotal(w);
      const quote = roomQuote(w, 'workshop', footprint);
      assert(quote.valid, `${kind} ${free ? 'free' : 'paid'}`);
      buildRoom(w, 'workshop', footprint);
      assert.equal(goldBefore - goldTotal(w), free ? 0 : footprint.length * roomById('workshop')!.cost);
      assert.equal(
        roomStats(w, footprint[0]).capacity,
        footprint.length * roomById('workshop')!.capacityPerTile,
      );
      assert(
        w.furnishings.some((f) => f.room === 'workshop'),
        'Automatic compact equipment still fits',
      );
      assert(footprint.every((p) => !environmentDecoration(w, tileAt(w, p.x, p.z)!)));
      assert.deepEqual(
        [...reachable(w, { x: 6, z: 14 })].sort(),
        routeBefore,
        'Region and cosmetic construction preserve physical access',
      );
    }
});

test('reclaiming an authored mine or street preserves wall structures until room construction', () => {
  for (const kind of ['dry','masonry'] as const) {
    const w = knownWorld(kind);
    const tile = w.tiles.find(t => environmentDecoration(w,t))!;
    assert(tile);
    const before = environmentDecoration(w,tile);
    tile.claimed = true;
    assert.deepEqual(environmentDecoration(w,tile),before,'Claiming preserves the visible old structure');
    const accessible = [...reachable(w,w.hearth)].sort();
    buildRoom(w,'kitchen',[tile]);
    assert.equal(tile.room,'kitchen');
    assert.equal(environmentDecoration(w,tile),undefined,'Player room equipment replaces old wall dressing');
    assert.deepEqual([...reachable(w,w.hearth)].sort(),accessible);
  }
});
