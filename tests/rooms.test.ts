import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab,labLayout,labShapes} from '../src/content/room-lab.ts';
import {buildRoom,furnish,roomStats} from '../src/game/rooms.ts';
import {reachable} from '../src/game/navigation.ts';
import {tileAt,key} from '../src/game/types.ts';
import {goldTotal,roomQuote} from '../src/game/rooms.ts';
import {roomDefinitions} from '../src/content/rooms.ts';
import {addMiners,tick} from '../src/game/simulation.ts';
test('every implemented room passes layout and cost checks',()=>{
 for(const room of roomDefinitions.filter(r=>r.implemented))for(const shape of labShapes){
   const w=createRoomLab();w.freeRoomBuilding=true;w.allowance=0;const before=reachable(w,{x:2,z:2});
   buildRoom(w,room.id,labLayout(w,shape));const after=reachable(w,{x:2,z:2});
   assert.equal(after.size,before.size-w.furnishings.reduce((s,f)=>s+f.cells.length,0),`${room.id}: ${shape}`);
   for(const f of w.furnishings)assert(after.has(key(f.access)));assert.equal(goldTotal(w),0);
   if(shape==='Single tile')assert.equal(w.furnishings.length,0);else assert(w.furnishings.length>0,`${room.id}: ${shape}`);
   w.freeRoomBuilding=false;assert.equal(roomQuote(w,room.id,[{x:20,z:20}]).valid,false);
 }
});
test('miners claim distinct beds, rest, and resume normal activity',()=>{
 const w=createRoomLab();buildRoom(w,'dormitory',labLayout(w,'Large hall'));addMiners(w);
 for(const a of w.agents)a.energy=.1;
 for(let i=0;i<1200;i++)tick(w,.05);
 assert(w.agents.every(a=>a.rested>=1));assert(w.agents.every(a=>a.job?.kind!=='sleep'));
 const assignments=w.furnishings.filter(f=>f.assigned).map(f=>f.assigned);assert.equal(new Set(assignments).size,3);assert.equal(assignments.length,3);
 const beds=w.furnishings.filter(f=>f.assigned);buildRoom(w,'dormitory',[{x:15,z:14},{x:15,z:15}]);for(const bed of beds)assert(w.furnishings.includes(bed));
});
test('free build waives creation and expansion costs but preserves placement rules',()=>{
 const w=createRoomLab();w.allowance=0;
 assert.equal(roomQuote(w,'treasure',labLayout(w,'Compact')).valid,false);
 w.freeRoomBuilding=true;assert.equal(roomQuote(w,'treasure',labLayout(w,'Compact')).cost,0);
 buildRoom(w,'treasure',labLayout(w,'Compact'));buildRoom(w,'treasure',labLayout(w,'Large hall'));assert(w.furnishings.length>0);assert.equal(goldTotal(w),0);assert.equal(w.spent,0);
 assert.equal(roomQuote(w,'treasure',[{x:12,z:12}]).valid,false);
 w.freeRoomBuilding=false;assert.equal(roomQuote(w,'treasure',[{x:19,z:19}]).valid,false);
 w.allowance=20;buildRoom(w,'treasure',[{x:19,z:19}]);assert.equal(goldTotal(w),8);
});
test('Treasure Room layout matrix preserves circulation and real capacity',()=>{
 for(const shape of labShapes){const w=createRoomLab();const start={x:2,z:2},before=reachable(w,start);buildRoom(w,'treasure',labLayout(w,shape));
   const after=reachable(w,start);assert.equal(after.size,before.size-w.furnishings.reduce((s,f)=>s+f.cells.length,0),shape);
   for(const f of w.furnishings)assert(after.has(key(f.access)),shape);
   if(shape==='Single tile')assert.equal(w.furnishings.length,0);else assert(w.furnishings.length>0,shape);
 }
});
test('expansion preserves objects and stored contents; displaced gold survives',()=>{
 const w=createRoomLab();buildRoom(w,'treasure',labLayout(w,'Compact'));const chest=w.furnishings[0];chest.stored=75;
 buildRoom(w,'treasure',labLayout(w,'Large hall'));assert(w.furnishings.includes(chest));assert.equal(chest.stored,75);
 tileAt(w,chest.x,chest.z)!.room=undefined;furnish(w);assert.equal(w.tiles.reduce((s,t)=>s+t.loose,0),75);
});
test('separate and corner-touching room patches stay separate',()=>{
 const w=createRoomLab();buildRoom(w,'treasure',[{x:8,z:8},{x:9,z:9}]);assert.equal(roomStats(w,{x:8,z:8}).tiles,1);assert.equal(w.furnishings.length,0);
});

test('all rooms skip invalid cells and charge only eligible new floor',()=>{
 for(const room of roomDefinitions.filter(r=>r.implemented))for(const free of [false,true]){
  const w=createRoomLab();w.freeRoomBuilding=free;
  const points=Array.from({length:30},(_,i)=>({x:4+i%6,z:4+Math.floor(i/6)}));
  const invalid=points.slice(0,6).map(p=>tileAt(w,p.x,p.z)!);
  invalid[0].terrain='dirt';invalid[1].terrain='bedrock';invalid[2].known=false;invalid[3].claimed=false;invalid[4].core=true;invalid[5].room=room.id==='treasure'?'kitchen':'treasure';
  const before=goldTotal(w),quote=roomQuote(w,room.id,[...points,points[10],{x:-1,z:4}]);
  assert(quote.valid);assert.equal(quote.tiles.length,24);assert.equal(quote.cost,free?0:24*room.cost);
  buildRoom(w,room.id,[...points,points[10],{x:-1,z:4}]);assert.equal(goldTotal(w),before-quote.cost);
  for(const p of points.slice(6))assert.equal(tileAt(w,p.x,p.z)!.room,room.id);
  assert(invalid.slice(0,5).every(t=>!t.room));assert.notEqual(invalid[5].room,room.id);
  const access=reachable(w,{x:2,z:2});for(const f of w.furnishings)assert(access.has(key(f.access)));
  assert(w.furnishings.some(f=>f.room===room.id));
  const total=goldTotal(w);buildRoom(w,room.id,points);assert.equal(goldTotal(w),total);
  assert.equal(roomQuote(w,room.id,points.slice(0,5)).valid,false);
  const expansion={x:10,z:5};const cost=roomQuote(w,room.id,[points[10],expansion,points[0]]).cost;
  buildRoom(w,room.id,[points[10],expansion,points[0]]);assert.equal(tileAt(w,10,5)!.room,room.id);assert.equal(goldTotal(w),total-cost);
 }
});
