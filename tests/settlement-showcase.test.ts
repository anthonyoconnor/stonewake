import { test } from 'node:test';
import assert from 'node:assert/strict';
import { showcaseComplete, showcaseDoors, showcaseExcavation, showcaseLevel, showcaseReserve, showcaseRooms } from '../src/content/settlement-showcase.ts';
import { createBuiltShowcase } from '../src/content/settlement-showcase-build.ts';
import { startFreePlay } from '../src/game/session.ts';
import { goldTotal, roomStats, buildRoom } from '../src/game/rooms.ts';
import { tileAt, key } from '../src/game/types.ts';
import { reachable } from '../src/game/navigation.ts';
import { roomById } from '../src/content/rooms.ts';
import { tuning } from '../src/content/tuning.ts';
import { designate, tick } from '../src/game/simulation.ts';
import { requestHearthActivation } from '../src/game/hearth.ts';
import { row } from '../src/content/level-authoring.ts';
import { liveRoomDecorations } from '../src/game/room-decoration.ts';

test('showcase is paid for by actual local mining, with separate accessible rooms, ordinary residents and expansion ground', () => {
  const fresh = startFreePlay(showcaseLevel.id!);
  const available = tuning.startingGold + fresh.tiles.reduce((n, t) => n + t.gold, 0);
  assert.equal(fresh.agents.length, tuning.startingStonehands);
  assert.equal(fresh.tiles.filter(t => t.room).length, 0);
  const w = createBuiltShowcase();
  assert(showcaseComplete(w));
  assert.equal(w.freeRoomBuilding, false);
  assert.equal(w.defenses?.length, showcaseDoors.length, 'Every door was manufactured and placed');
  const routes = reachable(w, { x: 22, z: 18 });
  const excavation = new Set(showcaseExcavation.map(key));
  for (const [type, cells] of Object.entries(showcaseRooms)) {
    const def = roomById(type)!;
    assert.equal(roomStats(w, cells[0]).capacity, cells.length * def.capacityPerTile);
    assert([...w.furnishings, ...liveRoomDecorations(w)].some(f => f.room === type), `${type} has automatic furnishings`);
    for (const p of cells) {
      assert(routes.has(key(p)), `${type} can be reached`);
      assert.equal(tileAt(w, p.x, p.z)!.roomPaid, def.cost);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const t = tileAt(w, p.x + dx, p.z + dz)!;
        assert(!t.room || t.room === type, 'Different rooms never share an open edge');
        if (!excavation.has(key(t))) assert(['dirt', 'rock'].includes(t.terrain), 'Dividing walls remain solid');
      }
    }
  }
  assert(showcaseReserve.every(p => ['dirt', 'rock'].includes(tileAt(w, p.x, p.z)!.terrain)));
  for (const role of ['stonehand', 'warrior', 'engineer', 'runesmith', 'cave-hound']) assert(w.agents.some(a => a.type === role));
  assert(w.agents.some(a => a.meals > 0 && a.rested > 0 && a.pay!.collections > 0));
  assert.equal(w.departures?.length ?? 0, 0);
  assert(goldTotal(w) > 500, 'A usable cash reserve remains after construction and wages');
  const inWorld = w.tiles.reduce((n, t) => n + t.gold + t.loose, 0) + w.agents.reduce((n, a) => n + a.carrying, 0);
  assert.equal(Math.round(w.spent + goldTotal(w) + inWorld), available, 'No gold was injected or resources invented');
  console.log(JSON.stringify({ seconds: Math.round(w.elapsed), roomTiles: w.tiles.filter(t => t.room).length,
    roomCost: w.tiles.reduce((n, t) => n + (t.roomPaid ?? 0), 0), spent: w.spent,
    stored: goldTotal(w), available, population: w.agents.length, doors: w.defenses?.length }));

  // The quiet map also has a reachable ordinary finish; it is not a stranded editor fixture.
  designate(w, row(26, 24, 13));
  for (let i = 0; i < 3000 && !w.outcome; i++) {
    if (w.onwardHearth?.discovered && !w.onwardHearth.requested) requestHearthActivation(w);
    tick(w, 0.1);
  }
  assert.equal(w.outcome, 'victory');
});

test('the empty showcase honors the shared free construction setting and ordinary placement rules', () => {
  for (const free of [false, true]) {
    const w = startFreePlay(showcaseLevel.id!, free);
    const before = goldTotal(w);
    buildRoom(w, 'treasure', [{ x: 20, z: 20 }]);
    assert.equal(goldTotal(w), before - (free ? 0 : roomById('treasure')!.cost));
    buildRoom(w, 'kitchen', showcaseRooms.kitchen);
    assert(!showcaseRooms.kitchen.some(p => tileAt(w, p.x, p.z)?.room), 'Free construction cannot build through unexcavated ground');
  }
});
