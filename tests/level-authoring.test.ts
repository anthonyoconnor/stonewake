import { test } from 'node:test';
import assert from 'node:assert/strict';
import { col, ellipse, path, polygon, rect, transformRuin, union } from '../src/content/level-authoring.ts';
import { authoringFixture, authoringFixtureApproach, authoringFixtureRoom } from '../src/content/level-authoring-fixture.ts';
import { ruinTemplates } from '../src/content/ruins.ts';
import { roomById } from '../src/content/rooms.ts';
import { createWorld } from '../src/game/world.ts';
import { addStonehands, designate } from '../src/game/simulation.ts';
import { buildRoom, furnish, goldTotal, roomStats } from '../src/game/rooms.ts';
import { key, tileAt, type Point } from '../src/game/types.ts';
import { until } from './helpers/simulation.ts';

function assertConnected(points: Point[]) {
  const remaining = new Set(points.map(key)), queue = [points[0]];
  remaining.delete(key(points[0]));
  for (const p of queue) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const next = { x: p.x + dx, z: p.z + dz };
    if (remaining.delete(key(next))) queue.push(next);
  }
  assert.equal(remaining.size, 0, 'Authored passage has no diagonal-only or disconnected joints');
}

test('bending paths remain cardinally connected in every direction and through width changes', () => {
  const origin = { x: 12, z: 12 };
  for (const end of [{ x: 4, z: 5 }, { x: 20, z: 5 }, { x: 4, z: 18 }, { x: 20, z: 18 }, { x: 12, z: 3 }, { x: 20, z: 12 }]) {
    const cells = path([origin, end]);
    assertConnected(cells);
    assert.equal(cells.length, Math.abs(end.x - origin.x) + Math.abs(end.z - origin.z) + 1);
    assert(cells.some(p => key(p) === key(end)));
  }
  const cells = union(path([{ x: 3, z: 3 }, { x: 8, z: 7 }], 1), path([{ x: 8, z: 7 }, { x: 12, z: 4 }], 3));
  assertConnected(cells);
  assert.equal(new Set(cells.map(key)).size, cells.length);
  assert.deepEqual(path([]), []);
  assert.deepEqual(path([origin]), [origin]);
});

test('curved and concave tile shapes include their boundaries without filling intended recesses', () => {
  const basin = ellipse(7, 6, 4, 2);
  for (const p of [{ x: 3, z: 6 }, { x: 11, z: 6 }, { x: 7, z: 4 }, { x: 7, z: 8 }]) assert(basin.some(q => key(p) === key(q)));
  assert(!basin.some(p => p.x === 3 && p.z === 4));
  assertConnected(basin);
  assert.deepEqual(ellipse(3, 3, 0, 2), col(3, 1, 5));
  const courtyard = polygon([{ x: 2, z: 2 }, { x: 7, z: 2 }, { x: 7, z: 4 }, { x: 4, z: 4 }, { x: 4, z: 7 }, { x: 2, z: 7 }]);
  assertConnected(courtyard);
  assert(courtyard.some(p => p.x === 4 && p.z === 4));
  assert(!courtyard.some(p => p.x === 5 && p.z === 5), 'The concave corner stays outside the district');
  assert.deepEqual(new Set(polygon([{ x: 1, z: 1 }, { x: 4, z: 1 }, { x: 4, z: 3 }, { x: 1, z: 3 }]).map(key)), new Set(rect(1, 1, 4, 3).map(key)));
});

test('ruin rotations and mirrors preserve room footprints and never mutate reusable arrangements', () => {
  const template = structuredClone(ruinTemplates.foundry);
  for (const mirror of [false, true]) for (let turns = 0; turns < 4; turns++) {
    const placed = transformRuin(template, { x: 12, z: 12 }, `foundry-${turns}-${mirror}`, turns, mirror);
    for (const [index, room] of placed.rooms.entries()) {
      assertConnected(room.cells);
      assert.equal(room.cells.length, template.rooms[index].cells.length);
      assert(room.cells.every(p => p.x >= 8 && p.x <= 16 && p.z >= 8 && p.z <= 16));
    }
    placed.rooms[0].cells[0].x = 100;
    assert.deepEqual(template, ruinTemplates.foundry);
  }
});

test('authoring example uses real excavation, discovery, irregular construction and transformed ruin reclamation', () => {
  for (const free of [false, true]) {
    const world = createWorld(authoringFixture);
    world.freeRoomBuilding = free;
    const definition = structuredClone(authoringFixture);
    const allCells = [...authoringFixture.seams.flatMap(s => s.cells), ...authoringFixture.ruins!.flatMap(r => r.rooms.flatMap(room => room.cells))];
    assert(allCells.every(p => p.x > 0 && p.x < world.width - 1 && p.z > 0 && p.z < world.height - 1));
    const remnants = world.tiles.filter(t => t.ruin);
    assert(remnants.every(t => !t.known && !t.room));
    addStonehands(world);
    designate(world, authoringFixtureRoom);
    until(world, () => authoringFixtureRoom.every(p => tileAt(world, p.x, p.z)?.claimed), 90, 'Workers excavate and claim the actual irregular room footprint');
    const before = goldTotal(world);
    assert.equal(buildRoom(world, 'kitchen', authoringFixtureRoom), 'Kitchen built.');
    assert.equal(goldTotal(world), before - (free ? 0 : authoringFixtureRoom.length * roomById('kitchen')!.cost));
    const stats = roomStats(world, authoringFixtureRoom[0]);
    assert.equal(stats.capacity, authoringFixtureRoom.length);
    assert.equal(stats.usable.length, stats.services.length);
    assert(world.furnishings.some(f => f.room === 'kitchen'), 'Cosmetic furnishing uses the ordinary construction service');
    world.furnishings = []; furnish(world);
    assert.equal(roomStats(world, authoringFixtureRoom[0]).capacity, stats.capacity);
    designate(world, authoringFixtureApproach);
    until(world, () => remnants.every(t => !!t.room), 300, 'Workers open the cave and physically reclaim the rotated waystation');
    for (const room of authoringFixture.ruins![0].rooms) {
      const claimed = roomStats(world, room.cells[0]);
      assert.equal(claimed.tiles, room.cells.length);
      assert.equal(claimed.usable.length, claimed.services.length);
    }
    assert.deepEqual(authoringFixture, definition, 'Live gameplay never edits authored data');
    const reset = createWorld(authoringFixture);
    assert(reset.tiles.filter(t => t.ruin).every(t => !t.known && !t.room), 'A new example restores fog and neutral remnants');
    assert(!reset.tiles.some(t => t.room === 'kitchen'));
  }
});
