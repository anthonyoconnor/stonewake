import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/world.ts';
import {tileAt,type World} from '../src/game/types.ts';
import {addMiners,designate,tick} from '../src/game/simulation.ts';
import {buildRoom,goldTotal} from '../src/game/rooms.ts';
import {findPath,canStand} from '../src/game/navigation.ts';
function fixture(){
 const w=createWorld({id:'test',name:'Test',width:16,height:16,hearth:{x:4,z:4},openings:[[2,2,12,12]],seams:[{terrain:'gold',cells:[{x:10,z:7}]},{terrain:'gem',cells:[{x:10,z:9}]}]});
 // Explicit no-storage fixture exercises the fallback when no treasury is available.
 w.roomServices=[];for(const t of w.tiles){t.known=true;if(t.terrain==='floor')t.claimed=true;}addMiners(w);return w;
}
import {run} from './helpers/simulation.ts';
const plot=(x:number,z:number)=>Array.from({length:12},(_,i)=>({x:x+i%4,z:z+Math.floor(i/4)}));
test('mined gold waits on the ground, then reaches a new Treasure Room without loss',()=>{
 const w=fixture();designate(w,[{x:10,z:7}]);run(w,30);
 const ore=tileAt(w,10,7)!;assert.equal(ore.terrain,'floor');assert.equal(ore.claimed,true);assert.equal(ore.loose,90);assert.equal(goldTotal(w),400);
 assert.equal(buildRoom(w,'treasure',plot(7,3)),'Treasure Room built.');assert(w.roomServices.length>0);
 run(w,80);assert.equal(ore.loose,0);assert.equal(w.roomServices.reduce((s,f)=>s+f.stored,0),90);
 assert.equal(goldTotal(w)+w.spent,490);
 for(const a of w.agents)assert(canStand(w,a));
});
test('gems persist and unreachable designations do not absorb workers',()=>{
 const w=fixture();designate(w,[{x:10,z:9}]);run(w,30);const gem=tileAt(w,10,9)!;
 assert.equal(gem.terrain,'gem');assert(gem.loose>=16);assert(w.agents.filter(a=>a.job?.kind==='mine').length<=1);
 assert.equal(goldTotal(w),400);
});
test('construction rejects unclaimed and occupied floor without charging',()=>{
 const w=fixture();tileAt(w,8,8)!.claimed=false;
 buildRoom(w,'treasure',[{x:8,z:8}]);buildRoom(w,'treasure',[{x:4,z:4}]);assert.equal(goldTotal(w),400);
 buildRoom(w,'treasure',[{x:8,z:6}]);assert.equal(w.roomServices.filter(s=>s.room==='treasure').length,1);assert.equal(goldTotal(w),388);
});
test('routes cannot cut between touching solid corners',()=>{
 const w=fixture();for(const t of w.tiles)t.terrain='bedrock';tileAt(w,8,8)!.terrain='floor';tileAt(w,9,9)!.terrain='floor';
 assert.equal(findPath(w,{x:8,z:8},{x:9,z:9}),undefined);
});
test('cancelling a designation releases its worker',()=>{
 const w=fixture();designate(w,[{x:10,z:7}]);run(w,1);designate(w,[{x:10,z:7}],false);run(w,10);
 assert(w.agents.every(a=>a.job?.kind!=='mine'));assert.equal(tileAt(w,10,7)!.terrain,'gold');
});

test('toggling excavation cancels active mining and accepts hidden planning but ignores known non-diggable tiles',()=>{
 const w=fixture(),ore=tileAt(w,10,7)!;
 designate(w,[ore],'toggle');run(w,1);assert(w.agents.some(a=>a.job?.kind==='mine'));
 designate(w,[ore],'toggle');run(w,10);assert(w.agents.every(a=>a.job?.kind!=='mine'));assert.equal(ore.terrain,'gold');
 const hidden=tileAt(w,10,9)!;hidden.known=false;
 designate(w,[hidden,{x:4,z:4},{x:0,z:0}],'toggle');
 assert.equal(hidden.designated,true);assert.equal(hidden.known,false);assert.equal(tileAt(w,4,4)!.designated,false);assert.equal(tileAt(w,0,0)!.designated,false);
});

test('empty Hearth treasury recovers from zero gold and funds a furnished Treasure Room',()=>{
 const w=createWorld({id:'recovery',name:'Recovery',width:16,height:16,hearth:{x:4,z:4},openings:[[2,2,12,12]],seams:[{terrain:'gold',cells:[{x:10,z:7},{x:11,z:7}]}]});
 for(const t of w.tiles){t.known=true;if(t.terrain==='floor')t.claimed=true;}
 w.allowance=0;addMiners(w);const chest=w.roomServices.find(f=>f.id==='hearth-treasury')!;
 assert(chest);assert.equal(chest.stored,0);assert.equal(chest.capacity,108);
 designate(w,[{x:10,z:7},{x:11,z:7}]);run(w,100);
 assert.equal(chest.stored,108);assert.equal(goldTotal(w),108);
 const layout=Array.from({length:9},(_,i)=>({x:7+i%3,z:3+Math.floor(i/3)}));
 assert.equal(buildRoom(w,'treasure',layout),'Treasure Room built.');assert.equal(chest.stored,0);assert.equal(goldTotal(w),0);
 assert.equal(w.roomServices.filter(f=>f.id==='hearth-treasury').length,1);
 assert(w.roomServices.some(f=>f.room==='treasure'&&findPath(w,w.agents[0],f.access)));
 run(w,70);assert.equal(goldTotal(w),72);assert.equal(w.spent,108);
 assert(w.roomServices.includes(chest));assert(chest.stored<=chest.capacity);
});
