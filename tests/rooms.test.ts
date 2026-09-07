import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab,labLayout,labShapes} from '../src/content/room-lab.ts';
import {buildRoom,furnish,roomStats} from '../src/game/rooms.ts';
import {reachable} from '../src/game/navigation.ts';
import {tileAt,key} from '../src/game/types.ts';
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
