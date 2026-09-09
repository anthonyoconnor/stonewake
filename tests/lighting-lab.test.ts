import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLightingLab, lightingSources, lightReaches } from '../src/content/lighting-lab.ts';
import { roomDefinitions } from '../src/content/rooms.ts';
import { goldTotal, roomStats, furnish } from '../src/game/rooms.ts';
import { tileAt } from '../src/game/types.ts';
import { reachable } from '../src/game/navigation.ts';

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
      if(!['treasure','dormitory'].includes(room.id))assert(w.furnishings.some((f) => f.room === room.id));
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
