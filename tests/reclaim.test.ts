import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab} from '../src/content/room-lab.ts';
import {roomById} from '../src/content/rooms.ts';
import {buildRoom,reclaimRoom,reclaimQuote,goldTotal} from '../src/game/rooms.ts';
import {tileAt} from '../src/game/types.ts';
import {produceFood} from '../src/game/food.ts';
const plot=Array.from({length:25},(_,i)=>({x:7+i%5,z:6+Math.floor(i/5)}));
test('reclaim skips invalid tiles, refunds original payments and cannot profit from free construction',()=>{
 const w=createRoomLab(),initial=goldTotal(w);buildRoom(w,'treasure',plot);const def=roomById('treasure')!,price=def.cost;
 try{def.cost=999;const points=[plot[0],plot[0],{x:0,z:0},{x:4,z:19}];assert.equal(reclaimQuote(w,points).refund,6);reclaimRoom(w,points);assert.equal(goldTotal(w),initial-25*12+6);assert.equal(tileAt(w,7,6)!.room,undefined);assert(tileAt(w,7,6)!.claimed);reclaimRoom(w,points);assert.equal(goldTotal(w),initial-300+6);}
 finally{def.cost=price;}
 w.freeRoomBuilding=true;buildRoom(w,'treasure',[plot[0]]);assert.equal(reclaimQuote(w,[plot[0]]).refund,0);
});
test('removing the last treasury preserves its gold and gives immediate sale credit',()=>{
 const w=createRoomLab();buildRoom(w,'treasure',plot);const chest=w.furnishings.find(f=>f.room==='treasure')!;chest.stored=70;const before=goldTotal(w);
 reclaimRoom(w,plot);assert.equal(w.furnishings.filter(f=>f.room==='treasure').length,0);assert.equal(w.tiles.reduce((n,t)=>n+t.loose,0),70);assert.equal(goldTotal(w),before-70+150);assert(w.furnishings.some(f=>f.id==='hearth-treasury'));
});
test('food supplies survive reclaiming and refill replacement facilities',()=>{
 const w=createRoomLab();buildRoom(w,'kitchen',plot);const stove=w.furnishings.find(f=>f.service==='cooking')!;stove.stored=7;reclaimRoom(w,plot);assert.equal(w.salvaged?.cooking,7);
 buildRoom(w,'kitchen',plot);produceFood(w,0);assert.equal(w.furnishings.filter(f=>f.service==='cooking').reduce((n,f)=>n+f.stored,0),7);assert.equal(w.salvaged?.cooking,0);
});
