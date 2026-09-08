import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCrossingScenario } from '../src/content/crossings.ts';
import { createDefenseLab } from '../src/content/defense-lab.ts';
import { buildRoom, goldTotal } from '../src/game/rooms.ts';
import { planBridges, finishBridge } from '../src/game/bridges.ts';
import { defenseToolStatus } from '../src/game/defenses.ts';
import { sellTiles } from '../src/game/selling.ts';
import { tileAt } from '../src/game/types.ts';

test('Sell combines room refunds and bridge-plan cancellation without duplicate refunds', () => {
  const w=createCrossingScenario();
  for(const t of w.tiles){t.known=true;if(t.terrain==='floor'&&t.x<10)t.claimed=true;}
  const room={x:3,z:7},bridge={x:10,z:9};
  buildRoom(w,'kitchen',[room]);planBridges(w,[bridge]);
  const paid=tileAt(w,room.x,room.z)!.roomPaid!,before=goldTotal(w);
  sellTiles(w,[room,bridge,room,bridge]);
  assert.equal(goldTotal(w),before+Math.floor(paid*.5)+20);
  assert.equal(tileAt(w,room.x,room.z)!.room,undefined);
  assert.equal(tileAt(w,bridge.x,bridge.z)!.bridgePlanned,false);
  const after=goldTotal(w);sellTiles(w,[room,bridge]);assert.equal(goldTotal(w),after);
  planBridges(w,[bridge]);finishBridge(w,tileAt(w,bridge.x,bridge.z)!);
  Object.assign(w.agents[0],bridge);
  const occupied=goldTotal(w);
  assert.match(sellTiles(w,[bridge]),/occupied/);
  assert(tileAt(w,bridge.x,bridge.z)!.bridge);
  assert.equal(goldTotal(w),occupied);
});

test('Defense tools require a Workshop and stock; Sell dismantles defenses without refund', () => {
  const w=createDefenseLab();
  assert(defenseToolStatus(w,'timber-door').available);
  w.outputs['timber-door']=0;
  assert.match(defenseToolStatus(w,'timber-door').reason,/Manufacture/);
  w.outputs['timber-door']=1;
  const fixture=w.defenses![0],gold=goldTotal(w);
  sellTiles(w,[fixture]);assert(!w.defenses!.includes(fixture));assert.equal(goldTotal(w),gold);
  sellTiles(w,w.tiles.filter(t=>t.room==='workshop'));
  assert.match(defenseToolStatus(w,'timber-door').reason,/Workshop/);
  const square={x:3,z:3};buildRoom(w,'workshop',[square]);
  assert(defenseToolStatus(w,'timber-door').available);
  w.outcome='defeat';assert(!defenseToolStatus(w,'timber-door').available);
  assert.match(sellTiles(w,[square]),/ended/);assert.equal(tileAt(w,3,3)!.room,'workshop');
});
