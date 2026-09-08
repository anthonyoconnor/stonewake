import test from 'node:test';
import assert from 'node:assert/strict';
import { createCrossingScenario } from '../src/content/crossings.ts';
import { bridgeQuote, planBridges, removeBridges } from '../src/game/bridges.ts';
import { blocked, findPath } from '../src/game/navigation.ts';
import { tileAt } from '../src/game/types.ts';
import { advance, advanceUntil } from '../src/dev/stepping.ts';
import { requestHearthActivation } from '../src/game/hearth.ts';
import { buildRoom, goldTotal, roomQuote } from '../src/game/rooms.ts';
import { defenseQuote, addRaider, placeDefense, setDoorMode, boltTarget } from '../src/game/defenses.ts';
import { spellLine } from '../src/game/spell-effects.ts';
import { releaseJob } from '../src/game/jobs/common.ts';
import { reveal } from '../src/game/world.ts';

const water = [
    { x: 10, z: 9 },
    { x: 11, z: 9 },
  ],
  lava = [
    { x: 17, z: 9 },
    { x: 18, z: 9 },
  ];
const setup = () => {
  const w = createCrossingScenario();
  for (const t of w.tiles) {
    t.known = true;
    if (t.terrain === 'floor' && t.x < 10) t.claimed = true;
  }
  return w;
};
test('ordinary economy crosses water and lava and physically activates onward Hearthstone', () => {
  const w = setup();
  buildRoom(w, 'kitchen', [
    { x: 3, z: 7 },
    { x: 4, z: 7 },
    { x: 5, z: 7 },
  ]);
  buildRoom(w, 'dormitory', [
    { x: 3, z: 12 },
    { x: 4, z: 12 },
    { x: 5, z: 12 },
  ]);
  assert.equal(findPath(w, w.agents[0], { x: 22, z: 9 }), undefined);
  assert(spellLine(w, { x: 9, z: 9 }, { x: 12, z: 9 }), 'hazards transmit sight');
  advance(w, 1);
  requestHearthActivation(w);
  advance(w, 10);
  assert(!w.onwardHearth!.ready);
  const before = goldTotal(w);
  planBridges(w, water);
  assert.equal(goldTotal(w), before - 40);
  assert(blocked(w, water[0]), 'blueprints are not routes');
  advanceUntil(w, () => water.every((p) => tileAt(w, p.x, p.z)!.bridge), 80);
  assert(findPath(w, { x: 9, z: 9 }, { x: 12, z: 9 }));
  assert(findPath(w, { x: 12, z: 9 }, { x: 9, z: 9 }, 'enemy'));
  advanceUntil(w, () => !!tileAt(w, 16, 9)!.claimed, 80);
  planBridges(w, lava);
  advanceUntil(w, () => w.outcome === 'victory', 160);
  assert(lava.every((p) => tileAt(w, p.x, p.z)!.bridge));
  assert(w.onwardHearth!.ready);
});
test('placement rejects hidden, unsupported, chasm and unaffordable work; free build retains constraints', () => {
  const w = setup();
  const before = goldTotal(w);
  assert(!bridgeQuote(w, [{ x: 14, z: 5 }]).valid);
  assert(!bridgeQuote(w, lava).valid);
  tileAt(w, 10, 9)!.known = false;
  assert(!bridgeQuote(w, water).valid);
  tileAt(w, 10, 9)!.known = true;
  w.allowance = 0;
  assert(!bridgeQuote(w, water).valid);
  w.freeRoomBuilding = true;
  assert.equal(bridgeQuote(w, water).cost, 0);
  planBridges(w, water);
  assert(!bridgeQuote(w, [{ x: 14, z: 5 }]).valid);
  assert.match(removeBridges(w, water), /0 gold refunded/);
  assert.equal(goldTotal(w), 0);
  assert(before > 0);
});
test('partial work survives interruption; cancellation refunds once and cannot resurrect construction', () => {
  const w = setup(),
    before = goldTotal(w);
  planBridges(w, water);
  advanceUntil(w, () => !!tileAt(w, 10, 9)!.bridgeProgress, 30);
  const progress = tileAt(w, 10, 9)!.bridgeProgress!;
  const worker = w.agents.find((a) => a.job?.kind === 'buildBridge')!;
  releaseJob(w, worker);
  assert.equal(tileAt(w, 10, 9)!.bridgeProgress, progress);
  assert.match(removeBridges(w, water), /40 gold refunded/);
  assert.equal(goldTotal(w), before);
  removeBridges(w, water);
  advance(w, 20);
  assert(!tileAt(w, 10, 9)!.bridge);
  assert.equal(goldTotal(w), before);
});
test('bent bridge tiles have no room capacity or fixtures, removal protects occupants and routes', () => {
  const w = setup(),
    bent = [
      { x: 10, z: 8 },
      { x: 10, z: 9 },
      { x: 11, z: 9 },
    ];
  planBridges(w, bent);
  advanceUntil(w, () => bent.every((p) => tileAt(w, p.x, p.z)!.bridge), 90);
  assert(!roomQuote(w, 'kitchen', bent).valid);
  w.outputs['spike-trap'] = 1;
  assert(!defenseQuote(w, 'spike-trap', bent[0]).valid);
  assert.equal(w.roomServices.filter((s) => bent.some((p) => p.x === s.x && p.z === s.z)).length, 0);
  const a = w.agents[0];
  a.x = 10;
  a.z = 8;
  assert.match(removeBridges(w, bent), /occupied/);
  for (const unit of w.agents) {
    unit.x = 8;
    unit.z = 8;
    unit.path = [];
    unit.job = undefined;
  }
  assert.match(removeBridges(w, bent), /cut a unit off/);
  // A redundant spur can be reclaimed without cutting the crossing.
  for (const a of w.agents) {
    a.x = 8;
    a.z = 8;
    a.path = [];
    a.job = undefined;
  }
  assert.match(removeBridges(w, [bent[0]]), /1 bridge squares removed/);
  assert.equal(tileAt(w, 10, 8)!.terrain, 'water');
  assert(blocked(w, bent[0]));
  w.agents = [];
  addRaider(w, { x: 12, z: 9 }, { x: 8, z: 9 });
  advance(w, 8);
  assert(
    w.enemies!.some((e) => e.x < 10),
    'enemy traverses actual bridge',
  );
});
test('discovery across lava leaves the objective inaccessible; unknown hazards cannot be mined', () => {
  const w = createCrossingScenario();
  reveal(w, { x: 16, z: 9 }, 10);
  assert(tileAt(w, 23, 9)!.known);
  assert.equal(findPath(w, { x: 16, z: 9 }, { x: 22, z: 9 }), undefined);
  assert(blocked(w, { x: 17, z: 9 }, undefined, { walker: 'breach' }));
  assert(blocked(w, { x: 14, z: 5 }, undefined, { walker: 'enemy' }));
});
test('a locked approach delays construction until a real route opens; free completed work refunds zero', () => {
  const w = setup();
  w.agents = w.agents.slice(0, 1);
  const a = w.agents[0];
  a.x = 7;
  a.z = 9;
  for (const t of w.tiles) if (t.x === 8 && t.z !== 9) t.terrain = 'rock';
  w.outputs['timber-door'] = 1;
  placeDefense(w, 'timber-door', { x: 8, z: 9 });
  const door = w.defenses![0];
  assert(door);
  setDoorMode(w, door.id, 'locked');
  w.freeRoomBuilding = true;
  planBridges(w, [water[0]]);
  advance(w, 5);
  assert.equal(tileAt(w, 10, 9)!.bridgeProgress, 0);
  setDoorMode(w, door.id, 'open');
  advanceUntil(w, () => !!tileAt(w, 10, 9)!.bridge, 40);
  a.x = 7;
  a.z = 9;
  a.job = undefined;
  a.path = [];
  assert.match(removeBridges(w, [water[0]]), /0 gold refunded/);
});
test('bolts cross open hazards but still stop at solid rock', () => {
  const w = setup();
  w.outputs['bolt-trap'] = 1;
  placeDefense(w, 'bolt-trap', { x: 9, z: 9 }, 0);
  const enemy = addRaider(w, { x: 12, z: 9 }, { x: 8, z: 9 });
  assert.equal(boltTarget(w, w.defenses![0]), enemy);
  tileAt(w, 10, 9)!.terrain = 'rock';
  assert.equal(boltTarget(w, w.defenses![0]), undefined);
});
