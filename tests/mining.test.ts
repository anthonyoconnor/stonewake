import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/world.ts';
import {tileAt,type World} from '../src/game/types.ts';
import {addMiners,designate,tick} from '../src/game/simulation.ts';
import {buildRoom,goldTotal} from '../src/game/rooms.ts';
import {findPath,canStand} from '../src/game/navigation.ts';
function fixture(){
 const w=createWorld({id:'test',name:'Test',width:16,height:16,hearth:{x:4,z:4},openings:[[2,2,12,12]],seams:[{terrain:'gold',cells:[{x:10,z:7}]},{terrain:'gem',cells:[{x:10,z:9}]}]});
 for(const t of w.tiles){t.known=true;if(t.terrain==='floor')t.claimed=true;}addMiners(w);return w;
}
function run(w:World,seconds:number){for(let i=0;i<seconds*20;i++)tick(w,.05);}
const plot=(x:number,z:number)=>Array.from({length:12},(_,i)=>({x:x+i%4,z:z+Math.floor(i/4)}));
test('mined gold waits on the ground, then reaches a new Treasure Room without loss',()=>{
 const w=fixture();designate(w,[{x:10,z:7}]);run(w,30);
 const ore=tileAt(w,10,7)!;assert.equal(ore.terrain,'floor');assert.equal(ore.claimed,true);assert.equal(ore.loose,90);assert.equal(goldTotal(w),400);
 assert.equal(buildRoom(w,'treasure',plot(7,3)),'Treasure Room built.');assert(w.furnishings.length>0);
 run(w,80);assert.equal(ore.loose,0);assert.equal(w.furnishings.reduce((s,f)=>s+f.stored,0),90);
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
 buildRoom(w,'treasure',[{x:8,z:6}]);assert.equal(w.furnishings.length,0);assert.equal(goldTotal(w),388);
});
test('routes cannot cut between touching solid corners',()=>{
 const w=fixture();for(const t of w.tiles)t.terrain='bedrock';tileAt(w,8,8)!.terrain='floor';tileAt(w,9,9)!.terrain='floor';
 assert.equal(findPath(w,{x:8,z:8},{x:9,z:9}),undefined);
});
test('cancelling a designation releases its worker',()=>{
 const w=fixture();designate(w,[{x:10,z:7}]);run(w,1);designate(w,[{x:10,z:7}],false);run(w,10);
 assert(w.agents.every(a=>a.job?.kind!=='mine'));assert.equal(tileAt(w,10,7)!.terrain,'gold');
});
