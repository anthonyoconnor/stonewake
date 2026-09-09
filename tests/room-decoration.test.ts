import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomLab } from '../src/content/room-lab.ts';
import { roomDefinitions } from '../src/content/rooms.ts';
import { buildRoom, furnish, goldTotal, reclaimRoom, spendGold } from '../src/game/rooms.ts';
import { liveRoomDecorations } from '../src/game/room-decoration.ts';
import { addResidents } from '../src/game/simulation.ts';
import { assignRoomSupport } from '../src/game/food.ts';
import { key, tileAt } from '../src/game/types.ts';
import { reachable } from '../src/game/navigation.ts';
import { createTerrainComparison } from '../src/content/terrain-comparison.ts';
const rect = (x = 7, z = 5, width = 5, depth = 5) =>
  Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));

test('treasury piles fill one tile at a time and follow wealth without changing accounting', () => {
  const w = createRoomLab();
  buildRoom(w, 'treasure', rect());
  w.allowance = 0;
  assert.equal(liveRoomDecorations(w).length, 0);
  assert(!w.furnishings.some((f) => f.room === 'treasure'));
  const stores = w.roomServices.filter((s) => s.room === 'treasure');
  // Deliveries from different directions may use different services in this same room.
  stores[4].stored = 50;
  stores[8].stored = 50;
  stores[15].stored = 50;
  stores[24].stored = 25;
  const before = structuredClone(w.roomServices);
  const piles = () => liveRoomDecorations(w).filter((f) => f.kind === 'gold-pile');
  assert.deepEqual(
    piles().map((f) => f.storedGold),
    [50, 50, 50, 25],
  );
  assert.deepEqual(piles().map(key), ['7,5', '8,5', '9,5', '10,5']);
  assert.deepEqual(w.roomServices, before, 'Presentation never transfers stored currency');
  assert(spendGold(w, 60));
  assert.deepEqual(
    piles().map((f) => f.storedGold),
    [50, 50, 15],
  );
  assert.equal(goldTotal(w), 115);
  buildRoom(w, 'treasure', rect(3, 3, 1, 1)); // An isolated new room cannot show another room's wealth.
  assert(!piles().some((f) => f.x === 3));
  const storage = w.roomServices.find((s) => s.stored > 0)!,
    loose = w.tiles.reduce((sum, t) => sum + t.loose, 0),
    held = storage.stored;
  reclaimRoom(w, [storage]);
  assert.equal(w.tiles.reduce((sum, t) => sum + t.loose, 0) - loose, held);
  assert.equal(
    piles().reduce((sum, f) => sum + f.storedGold!, 0),
    w.roomServices.filter((s) => s.room === 'treasure').reduce((sum, s) => sum + s.stored, 0),
  );
});

test('beds belong to living assigned residents, survive travel and expansion, and free on lost access or death', () => {
  const w = createRoomLab();
  buildRoom(w, 'dormitory', rect());
  const beds = () => liveRoomDecorations(w).filter((f) => f.kind === 'resident-bed');
  assert.equal(beds().length, 0);
  for (const type of ['warrior', 'engineer', 'runesmith', 'cave-hound', 'stonehand']) addResidents(w, type);
  assert.equal(beds().length, 4);
  assert.equal(new Set(beds().map((b) => b.residentType)).size, 4);
  const assigned = beds().map((b) => [b.residentId, key(b)]);
  w.agents.forEach((a) => {
    a.x = 3;
    a.z = 3;
  });
  assignRoomSupport(w);
  buildRoom(w, 'dormitory', rect(7, 10, 5, 1));
  assignRoomSupport(w);
  assert.deepEqual(
    beds().map((b) => [b.residentId, key(b)]),
    assigned,
  );
  const victim = w.agents.find((a) => a.type === 'warrior')!;
  victim.health = 0;
  assignRoomSupport(w);
  assert.equal(beds().length, 3);
  assert(!beds().some((b) => b.residentId === victim.id));
  const target = beds()[0],
    tile = tileAt(w, Math.round(target.x), Math.round(target.z))!;
  reclaimRoom(w, [tile]);
  assignRoomSupport(w);
  assert.equal(beds().length, 3);
  assert(!beds().some((b) => key(b) === key(tile)));
  for (const t of w.tiles.filter((t) => t.z === 4)) t.terrain = 'bedrock';
  w.routesChanged = true;
  assignRoomSupport(w);
  assert.equal(beds().length, 0, 'Blocked accommodation assignments disappear');
});

test('5x5 rooms are sparse and expansion does not multiply workshop equipment', () => {
  for (const room of roomDefinitions.filter((r) => r.implemented)) {
    const w = createRoomLab();
    const before = reachable(w, { x: 2, z: 2 });
    buildRoom(w, room.id, rect());
    const props = w.furnishings.filter((f) => f.room === room.id);
    assert(props.reduce((sum, f) => sum + f.cells.length, 0) <= 9, room.id + ' keeps most floor clear');
    const covered = props.flatMap((f) => f.cells.map(key));
    assert.equal(new Set(covered).size, covered.length);
    for (const f of props) assert(f.cells.every((p) => tileAt(w, p.x, p.z)?.room === room.id));
    assert.deepEqual(reachable(w, { x: 2, z: 2 }), before);
    assert.equal(
      w.roomServices.filter((s) => s.room === room.id).reduce((sum, s) => sum + s.capacity, 0),
      25 * room.capacityPerTile,
    );
    if (room.id === 'workshop') {
      assert.equal(props.length, 3);
      buildRoom(w, room.id, rect(3, 3, 9, 8));
      const expanded = w.furnishings.filter((f) => f.room === room.id);
      assert.equal(expanded.length, 3);
      assert.equal(new Set(expanded.map((f) => f.kind)).size, 3);
    }
    if (room.id === 'training')
      assert.deepEqual(
        new Set(props.map((f) => f.model)),
        new Set(['straw-dummy', 'shield-dummy', 'target-post', 'striking-pillar']),
      );
    if (room.id === 'library')
      assert.equal(props.filter((f) => f.model === 'long-bookcase' && f.cells.length === 3).length, 2);
    w.furnishings = [];
    furnish(w);
    assert.equal(
      w.roomServices.filter((s) => s.room === room.id).reduce((sum, s) => sum + s.capacity, 0),
      w.tiles.filter((t) => t.room === room.id).length * room.capacityPerTile,
    );
  }
});

test('terrain comparison retains the archived chest, bed and horizontal equipment layout', () => {
  const w = createTerrainComparison();
  const old = w.furnishings.filter((f) => f.x < 18);
  for (const kind of ['chest', 'bed', 'weights']) assert(old.some((f) => f.kind === kind));
  assert(!w.furnishings.filter((f) => f.x >= 18).some((f) => ['chest', 'bed', 'weights'].includes(f.kind)));
});
