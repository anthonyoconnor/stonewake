import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab,labLayout,labShapes} from '../src/content/room-lab.ts';
import {buildRoom,furnish,roomStats,syncRoomServices,reclaimRoom} from '../src/game/rooms.ts';
import {reachable} from '../src/game/navigation.ts';
import {tileAt,key} from '../src/game/types.ts';
import {goldTotal,roomQuote} from '../src/game/rooms.ts';
import {roomDefinitions} from '../src/content/rooms.ts';
import {addMiners,tick} from '../src/game/simulation.ts';
test('every implemented room passes layout and cost checks',()=>{
 for(const room of roomDefinitions.filter(r=>r.implemented))for(const shape of labShapes){
   const w=createRoomLab();w.freeRoomBuilding=true;w.allowance=0;const before=reachable(w,{x:2,z:2});
   buildRoom(w,room.id,labLayout(w,shape));const after=reachable(w,{x:2,z:2});
   assert.deepEqual(after,before,`${room.id}: ${shape} decorations leave all paths open`);
   const tiles=w.tiles.filter(t=>t.room===room.id).length;
   assert.equal(w.roomServices.filter(s=>s.room===room.id).reduce((sum,s)=>sum+s.capacity,0),tiles*room.capacityPerTile,`${room.id}: ${shape}`);
   for(const s of w.roomServices)assert(after.has(key(s.access)));assert.equal(goldTotal(w),0);
   if(shape==='Single tile')assert.equal(w.roomServices.filter(s=>s.room===room.id).length,1);
   w.freeRoomBuilding=false;assert.equal(roomQuote(w,room.id,[{x:20,z:20}]).valid,false);
 }
});
test('miners claim distinct beds, rest, and resume normal activity',()=>{
 const w=createRoomLab();buildRoom(w,'dormitory',labLayout(w,'Large hall'));addMiners(w);
 for(const a of w.agents)a.energy=.1;
 for(let i=0;i<1200;i++)tick(w,.05);
 assert(w.agents.every(a=>a.rested>=1));assert(w.agents.every(a=>a.job?.kind!=='sleep'));
 const assignments=w.roomServices.filter(f=>f.service==='rest'&&f.assigned).map(f=>f.assigned);assert.equal(new Set(assignments).size,3);assert.equal(assignments.length,3);
 const beds=w.roomServices.filter(f=>f.service==='rest'&&f.assigned);buildRoom(w,'dormitory',[{x:15,z:14},{x:15,z:15}]);for(const bed of beds)assert(w.roomServices.includes(bed));
});
test('free build waives creation and expansion costs but preserves placement rules',()=>{
 const w=createRoomLab();w.allowance=0;
 assert.equal(roomQuote(w,'treasure',labLayout(w,'Compact')).valid,false);
 w.freeRoomBuilding=true;assert.equal(roomQuote(w,'treasure',labLayout(w,'Compact')).cost,0);
 buildRoom(w,'treasure',labLayout(w,'Compact'));buildRoom(w,'treasure',labLayout(w,'Large hall'));assert(!w.furnishings.some(f=>f.room==='treasure'),'An empty treasury has no containers');assert.equal(goldTotal(w),0);assert.equal(w.spent,0);
 assert.equal(roomQuote(w,'treasure',[{x:12,z:12}]).valid,false);
 w.freeRoomBuilding=false;assert.equal(roomQuote(w,'treasure',[{x:19,z:19}]).valid,false);
 w.allowance=20;buildRoom(w,'treasure',[{x:19,z:19}]);assert.equal(goldTotal(w),8);
});
test('Treasure Room layout matrix preserves circulation and real capacity',()=>{
 for(const shape of labShapes){const w=createRoomLab();const start={x:2,z:2},before=reachable(w,start);buildRoom(w,'treasure',labLayout(w,shape));
   const after=reachable(w,start);assert.deepEqual(after,before,shape);
   for(const s of w.roomServices)assert(after.has(key(s.access)),shape);
   assert.equal(w.roomServices.filter(s=>s.room==='treasure').reduce((sum,s)=>sum+s.capacity,0),w.tiles.filter(t=>t.room==='treasure').length*50,shape);
 }
});
test('expansion preserves objects and stored contents; displaced gold survives',()=>{
 const w=createRoomLab();buildRoom(w,'treasure',labLayout(w,'Compact'));const storage=w.roomServices.find(f=>f.room==='treasure')!;storage.stored=45;
 const total=goldTotal(w);w.furnishings=[];furnish(w);assert.equal(goldTotal(w),total,'Changing decorations cannot displace gold');
 buildRoom(w,'treasure',labLayout(w,'Large hall'));assert(w.roomServices.includes(storage));assert.equal(storage.stored,45);
 tileAt(w,storage.x,storage.z)!.room=undefined;furnish(w);assert.equal(w.tiles.reduce((s,t)=>s+t.loose,0),45);
});
test('separate and corner-touching room patches stay separate',()=>{
 const w=createRoomLab();buildRoom(w,'treasure',[{x:8,z:8},{x:9,z:9}]);assert.equal(roomStats(w,{x:8,z:8}).tiles,1);assert.equal(w.furnishings.filter(f=>f.room!=='hearth').length,0);
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
  if(!['treasure','dormitory'].includes(room.id))assert(w.furnishings.some(f=>f.room===room.id));
  const total=goldTotal(w);buildRoom(w,room.id,points);assert.equal(goldTotal(w),total);
  assert.equal(roomQuote(w,room.id,points.slice(0,5)).valid,false);
  const expansion={x:10,z:5};const cost=roomQuote(w,room.id,[points[10],expansion,points[0]]).cost;
  buildRoom(w,room.id,[points[10],expansion,points[0]]);assert.equal(tileAt(w,10,5)!.room,room.id);assert.equal(goldTotal(w),total-cost);
 }
});

test('fractional capacity follows connected floor area and previews expansion and joining',()=>{
 const room=roomDefinitions.find(r=>r.id==='training')!,original=room.capacityPerTile;
 try{
  room.capacityPerTile=.5;
  const w=createRoomLab();
  buildRoom(w,'training',[{x:6,z:6},{x:8,z:6}]);
  assert.equal(roomStats(w,{x:6,z:6}).capacity,0);
  assert.equal(roomStats(w,{x:8,z:6}).capacity,0);
  const join=roomQuote(w,'training',[{x:7,z:6}]);assert.equal(join.addedCapacity,1);
  buildRoom(w,'training',join.tiles);assert.equal(roomStats(w,{x:6,z:6}).capacity,1);
  assert.equal(roomQuote(w,'training',[{x:9,z:6}]).addedCapacity,1);
  buildRoom(w,'training',[{x:9,z:6}]);assert.equal(roomStats(w,{x:6,z:6}).capacity,2);
  reclaimRoom(w,[{x:7,z:6}]);assert.equal(w.roomServices.filter(s=>s.service==='training').length,1);
  room.capacityPerTile=2;syncRoomServices(w);
  assert.equal(w.roomServices.filter(s=>s.service==='training').length,6);
 }finally{room.capacityPerTile=original;}
});

test('capacity tuning preserves gold and spills only overflow; decoration changes never do',()=>{
 const room=roomDefinitions.find(r=>r.id==='treasure')!,original=room.capacityPerTile;
 try{
  const w=createRoomLab();buildRoom(w,'treasure',[{x:8,z:8}]);
  w.roomServices.find(s=>s.room==='treasure')!.stored=45;
  w.furnishings=[];syncRoomServices(w);
  assert.equal(w.tiles.reduce((sum,t)=>sum+t.loose,0),0);
  room.capacityPerTile=20;syncRoomServices(w);
  assert.equal(w.roomServices.find(s=>s.room==='treasure')!.stored,20);
  assert.equal(tileAt(w,8,8)!.loose,25);
  reclaimRoom(w,[{x:8,z:8}]);assert.equal(tileAt(w,8,8)!.loose,45);
 }finally{room.capacityPerTile=original;}
});

test('unreachable rooms retain their area capacity but offer no service through walls',()=>{
 const w=createRoomLab(),p={x:8,z:8};buildRoom(w,'training',[p]);
 assert.equal(roomStats(w,p).usable.length,1);
 for(const [x,z] of [[7,8],[9,8],[8,7],[8,9]])tileAt(w,x,z)!.terrain='rock';
 assert.equal(roomStats(w,p).capacity,1);assert.equal(roomStats(w,p).usable.length,0);
 tileAt(w,7,8)!.terrain='floor';assert.equal(roomStats(w,p).usable.length,1);
});
