import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab,labLayout,labShapes} from '../src/content/room-lab.ts';
import {buildRoom,furnish,roomStats} from '../src/game/rooms.ts';
import {reachable} from '../src/game/navigation.ts';
import {tileAt,key} from '../src/game/types.ts';
import {goldTotal,roomQuote} from '../src/game/rooms.ts';
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
