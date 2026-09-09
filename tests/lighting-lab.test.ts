import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLightingLab, lightingSources, lightReaches } from '../src/content/lighting-lab.ts';
import { roomDefinitions } from '../src/content/rooms.ts';
import { goldTotal, roomStats, furnish } from '../src/game/rooms.ts';
import { tileAt } from '../src/game/types.ts';
import { reachable } from '../src/game/navigation.ts';
import { createRoomLab } from '../src/content/room-lab.ts';
import type { Furnishing } from '../src/game/types.ts';

test('lighting harness uses ordinary paid/free irregular rooms, automatic props, floor capacity and physical access', () => {
  for (const free of [false, true]) {
    const w = createLightingLab(free);
    assert.equal(w.freeRoomBuilding, free);
    assert(free ? goldTotal(w) === 50000 : goldTotal(w) < 50000);
    const accessible = reachable(w, { x: 8, z: 14 });
    for (const room of roomDefinitions.filter((r) => r.implemented)) {
      const tiles = w.tiles.filter((t) => t.room === room.id);
      assert(tiles.length > 0);
      assert(tiles.every((t) => accessible.has(`${t.x},${t.z}`)));
      const capacity = w.roomServices
        .filter((s) => s.room === room.id)
        .reduce((sum, s) => sum + s.capacity, 0);
      assert.equal(capacity, tiles.length * room.capacityPerTile);
      if (!['treasure', 'dormitory'].includes(room.id)) assert(w.furnishings.some((f) => f.room === room.id));
    }
    assert.equal(tileAt(w, 10, 23)!.terrain, 'bedrock');
    assert.equal(tileAt(w, 10, 23)!.room, undefined);
    const before = roomStats(w, { x: 14, z: 4 });
    w.furnishings = [];
    assert.equal(roomStats(w, { x: 14, z: 4 }).capacity, before.capacity);
    assert.equal(roomStats(w, { x: 14, z: 4 }).usable.length, before.usable.length);
    furnish(w);
    assert(w.tiles.filter((t) => t.bridge).every((t) => !t.room));
    assert.equal(w.recruitment?.enabled, undefined);
  }
});
test('light source selection and occlusion never discover the sealed pocket or illuminate beyond walls', () => {
  const w = createLightingLab();
  const before = w.tiles.map((t) => t.known);
  assert(!lightingSources(w).some((s) => s.x >= 22 && s.z <= 5));
  assert(lightingSources(w).some((s) => s.id.startsWith('lamp')));
  assert(lightingSources(w).some((s) => s.id.startsWith('lava')));
  assert(lightReaches(w, { x: 17, z: 7 }, { x: 18, z: 7 }), 'First wall face can receive light');
  assert(!lightReaches(w, { x: 17, z: 7 }, { x: 20, z: 7 }), 'Light stops at the bedrock seam');
  assert(!lightReaches(w, { x: 26, z: 6 }, { x: 26, z: 3 }), 'A concealed source is behind rock and fog');
  assert.deepEqual(
    w.tiles.map((t) => t.known),
    before,
  );
  const other = createLightingLab();
  w.lightingTest.ambient = 1;
  assert.notEqual(other.lightingTest.ambient, w.lightingTest.ambient);
});

test('furnished stove fires and reading candles illuminate only discovered furnishings', () => {
  const w = createLightingLab();
  const sources = lightingSources(w).filter((s) => s.id.startsWith('furnishing-'));
  assert(sources.length > 0, 'The built Kitchen and Library have visible fire/candle sources');
  const fixture = w.furnishings.find((f) => sources.some((s) => s.id === `furnishing-${f.id}`))!;
  tileAt(w, fixture.x, fixture.z)!.known = false;
  assert(!lightingSources(w).some((s) => s.id === `furnishing-${fixture.id}`));
  w.furnishings = [];
  assert.equal(lightingSources(w).filter((s) => s.id.startsWith('furnishing-')).length, 0);
});

test('room lamps follow faced prop centers and preserve the archived candle placement', () => {
  const w = createRoomLab();
  const fixtures: { furnishing: Furnishing; expected: number[][] }[] = [
    {
      furnishing: {
        id: 'turned-bookcase',
        room: 'library',
        kind: 'long-bookcase',
        model: 'long-bookcase',
        x: 7,
        z: 5,
        rotation: 1,
        facing: -Math.PI / 2,
        cells: [
          { x: 7, z: 5 },
          { x: 7, z: 6 },
          { x: 7, z: 7 },
        ],
        access: { x: 8, z: 6 },
      },
      expected: [
        [7.29, 1.2, 4.72],
        [7.29, 1.2, 7.28],
      ],
    },
    {
      furnishing: {
        id: 'turned-rack',
        room: 'workshop',
        kind: 'tool-rack',
        model: 'tool-rack',
        x: 7,
        z: 5,
        rotation: 0,
        facing: Math.PI,
        cells: [
          { x: 7, z: 5 },
          { x: 8, z: 5 },
        ],
        access: { x: 7, z: 6 },
      },
      expected: [
        [6.7, 1.15, 5.23],
        [8.3, 1.15, 5.23],
      ],
    },
    {
      furnishing: {
        id: 'turned-stove',
        room: 'kitchen',
        kind: 'stove',
        model: 'stove',
        x: 7,
        z: 5,
        rotation: 0,
        facing: Math.PI / 2,
        cells: [{ x: 7, z: 5 }],
        access: { x: 6, z: 5 },
      },
      expected: [[6.66, 0.29, 5]],
    },
    {
      furnishing: {
        id: 'turned-lectern',
        room: 'library',
        kind: 'lectern',
        model: 'lectern',
        x: 7,
        z: 5,
        rotation: 0,
        facing: Math.PI,
        cells: [{ x: 7, z: 5 }],
        access: { x: 7, z: 6 },
      },
      expected: [[7, 0.99, 4.83]],
    },
    {
      furnishing: {
        id: 'starting-bookshelf',
        room: 'library',
        kind: 'bookshelf',
        model: 'bookshelf',
        x: 7,
        z: 5,
        rotation: 1,
        cells: [
          { x: 7, z: 5 },
          { x: 7, z: 6 },
        ],
        access: { x: 8, z: 5 },
      },
      expected: [[7.2, 0.95, 4.77]],
    },
  ];
  for (const { furnishing, expected } of fixtures) {
    w.furnishings = [furnishing];
    const sources = () => lightingSources(w).filter((s) => s.id.startsWith('furnishing-'));
    const actual = sources().map((s) => [s.x, s.y, s.z]);
    assert.equal(actual.length, expected.length, furnishing.id);
    for (const position of expected)
      assert(
        actual.some((p) => p.every((value, axis) => Math.abs(value - position[axis]) < 1e-6)),
        furnishing.id,
      );
    tileAt(w, furnishing.x, furnishing.z)!.known = false;
    assert.equal(sources().length, 0, 'Concealed room props cannot expose their lamps');
    tileAt(w, furnishing.x, furnishing.z)!.known = true;
  }
});
