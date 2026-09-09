import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/game/world.ts';
import { createRoomLab } from '../src/content/room-lab.ts';
import { roomDefinitions } from '../src/content/rooms.ts';
import { ruinTuning, placeRuin, ruinTemplates } from '../src/content/ruins.ts';
import { canClaimFloor, finishClaim, initializeRuins, ruinStatus } from '../src/game/ruins.ts';
import { goldTotal, furnish, roomStats, reclaimRoom } from '../src/game/rooms.ts';
import { addStonehands, addResidents, designate } from '../src/game/simulation.ts';
import { tileAt, key, type Point } from '../src/game/types.ts';
import { reachable } from '../src/game/navigation.ts';
import { run, until } from './helpers/simulation.ts';

test('ordinary workers discover a collapsed occupied ruin, clear its approach, reclaim with timed jobs and use its beds', () => {
  const w = createWorld({ id: 'buried-waystation', name: 'Buried waystation', width: 22, height: 14,
    hearth: { x: 3, z: 3 }, openings: [[1, 1, 6, 6], [6, 6, 14, 6], [13, 5, 18, 10]],
    seams: [{ terrain: 'dirt', cells: [{ x: 10, z: 6 }] }],
    ruins: [{ id: 'den', name: 'Old barracks', rooms: [{ type: 'dormitory', cells: [{ x: 14, z: 6 }, { x: 14, z: 7 }, { x: 15, z: 7 }] }] }],
    encounters: [{ id: 'occupant', name: 'Spider nest', kind: 'nest', positions: [{ x: 15, z: 7 }], roster: ['cave-spider'],
      activation: 'discovery', delay: 0, warningSeconds: 3, clear: 'defeat', pressure: 'territorial', habitat: { biome: 'fungal', behavior: 'sentry', radius: 2 } }],
  });
  const ruin = tileAt(w, 14, 6)!;
  assert(!ruin.known);
  assert.equal(ruinStatus(w, ruin), undefined);
  assert(!w.roomServices.some(s => s.room === 'dormitory'));
  addStonehands(w, 1);
  designate(w, [{ x: 10, z: 6 }]);
  until(w, () => ruin.known, 80, 'Workers open the actual collapsed approach and discover the ruin');
  assert.equal(tileAt(w, 10, 6)!.terrain, 'floor');
  assert(!canClaimFloor(w, ruin));
  assert.match(ruinStatus(w, ruin)!, /contested/);
  assert(!w.roomServices.some(s => s.room === 'dormitory'));
  w.enemies![0].health = 0; // Existing enemy combat suite owns how a defender defeats this occupant.
  const before = goldTotal(w), clearedAt = w.elapsed;
  until(w, () => !!ruin.room, 45, 'Worker reaches and reclaims the first room square');
  assert(w.elapsed - clearedAt >= ruinTuning.claimSeconds);
  assert.equal(ruin.roomPaid, 0);
  assert.equal(goldTotal(w), before);
  until(w, () => w.roomServices.filter(s => s.room === 'dormitory').length === 3, 40, 'All three irregular room tiles supply their normal capacity');
  assert(w.furnishings.some(f => f.room === 'dormitory'));
  addResidents(w, 'cave-hound');
  const hound = w.agents.find(a => a.type === 'cave-hound')!;
  hound.energy = 0.1;
  until(w, () => hound.rested > 0, 60, 'A hound uses the reclaimed room through normal support and movement');
});

test('every room reclaims single, narrow and irregular floor with ordinary capacity, cosmetic furnishings and no resale credit', () => {
  const shapes: Point[][] = [
    [{ x: 8, z: 8 }],
    [{ x: 8, z: 8 }, { x: 9, z: 8 }, { x: 10, z: 8 }, { x: 11, z: 8 }],
    [{ x: 8, z: 8 }, { x: 9, z: 8 }, { x: 10, z: 8 }, { x: 8, z: 9 }, { x: 8, z: 10 }],
  ];
  for (const room of roomDefinitions.filter(r => r.implemented)) for (const cells of shapes) for (const free of [false, true]) {
    const w = createRoomLab(); w.freeRoomBuilding = free; w.allowance = 0;
    for (const p of cells) tileAt(w, p.x, p.z)!.claimed = false;
    initializeRuins(w, [{ id: 'test', name: 'Ruin', rooms: [{ type: room.id, cells }] }]);
    assert(!w.roomServices.some(s => s.room === room.id));
    const routes = reachable(w, { x: 2, z: 2 });
    for (const p of cells) assert(finishClaim(w, tileAt(w, p.x, p.z)!));
    const stats = roomStats(w, cells[0]);
    assert.equal(stats.capacity, cells.length * room.capacityPerTile, `${room.id} ${cells.length} free=${free}`);
    assert.equal(stats.usable.length, stats.services.length);
    assert.deepEqual(reachable(w, { x: 2, z: 2 }), routes);
    w.furnishings = []; furnish(w);
    assert.equal(roomStats(w, cells[0]).capacity, stats.capacity);
    assert.deepEqual(reachable(w, { x: 2, z: 2 }), routes);
    assert.equal(goldTotal(w), 0);
    reclaimRoom(w, cells);
    assert.equal(goldTotal(w), 0);
    assert(cells.every(p => !tileAt(w, p.x, p.z)!.ruin));
  }
});

test('locked remnants cannot supply services or claim jobs, even free, and become reclaimable only with room plans', () => {
  const w = createRoomLab(), p = { x: 8, z: 8 }, t = tileAt(w, p.x, p.z)!;
  w.freeRoomBuilding = true; t.claimed = false;
  w.availability = { buildings: ['treasure', 'dormitory', 'kitchen'], roles: ['stonehand', 'cave-hound'], recipes: [], spells: [] };
  initializeRuins(w, [{ id: 'archive', name: 'Ancient archive', rooms: [{ type: 'library', cells: [p] }] }]);
  assert(!canClaimFloor(w, t)); assert(!finishClaim(w, t));
  assert.match(ruinStatus(w, t)!, /not available/);
  addStonehands(w, 1); w.agents[0].capabilities = ['claim'];
  run(w, 12);
  assert(!t.claimed && !t.room);
  assert(!w.roomServices.some(s => s.room === 'library'));
  w.availability.buildings.push('library');
  until(w, () => t.room === 'library', 20, 'Newly known room plans permit ordinary reclamation');
  assert.equal(roomStats(w, p).capacity, 1);
});

test('blocked and partially buried ruins never grant inaccessible or occupied-terrain capacity', () => {
  const w = createRoomLab(), cells = [{ x: 8, z: 8 }, { x: 9, z: 8 }, { x: 8, z: 9 }];
  for (const p of cells) tileAt(w, p.x, p.z)!.claimed = false;
  tileAt(w, 8, 9)!.terrain = 'rock';
  initializeRuins(w, [{ id: 'hall', name: 'Buried hall', rooms: [{ type: 'training', cells }] }]);
  assert(!finishClaim(w, tileAt(w, 8, 9)!));
  for (const p of cells.slice(0, 2)) finishClaim(w, tileAt(w, p.x, p.z)!);
  assert.equal(roomStats(w, cells[0]).capacity, 2);
  for (let z = 1; z < w.height - 1; z++) tileAt(w, 7, z)!.terrain = 'bedrock';
  w.routesChanged = true;
  assert.equal(roomStats(w, cells[0]).usable.length, 0);
  assert(!reachable(w, { x: 2, z: 2 }).has(key(cells[0])));
  const template = placeRuin(ruinTemplates.foundry, { x: 10, z: 12 }, 'second-foundry');
  assert.equal(template.rooms[0].cells[0].x, 10);
  assert.equal(ruinTemplates.foundry.rooms[0].cells[0].x, 0, 'Reusable templates are never mutated');
  assert.throws(() => initializeRuins(w, [{ id: 'invalid', name: 'Invalid', rooms: [{ type: 'library', cells: [{ x: 7, z: 8 }] }] }]), /neutral floor/);
});
