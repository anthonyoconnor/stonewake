import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/world.ts';
import {tileAt,type World} from '../src/game/types.ts';
import {addMiners,designate,tick} from '../src/game/simulation.ts';

function fixture(){
 const w=createWorld({id:'bags',name:'Bags',width:14,height:14,hearth:{x:4,z:4},openings:[[2,2,11,11]],seams:[{terrain:'gold',cells:[{x:10,z:7}]}]});
 for(const t of w.tiles){t.known=true;if(t.terrain==='floor')t.claimed=true;else if(t.terrain==='dirt')t.terrain='bedrock';}
 addMiners(w,1);const a=w.agents[0];a.x=9;a.z=7;
 const ore=tileAt(w,10,7)!;designate(w,[ore]);return {w,a,ore,chest:w.roomServices[0]};
}
function total(w:World){return w.tiles.reduce((n,t)=>n+t.gold+t.loose,0)+w.agents.reduce((n,a)=>n+a.carrying,0)+w.roomServices.reduce((n,f)=>n+f.stored,0);}
function until(w:World,condition:()=>boolean,seconds=80){for(let i=0;i<seconds*20&&!condition();i++){tick(w,.05);assert.equal(total(w),90);}assert(condition());}
test('gold goes straight into the bag and a half-mined pillar survives the first delivery',()=>{
 const {w,a,ore,chest}=fixture();until(w,()=>a.carrying===15);assert.equal(ore.gold,75);assert.equal(ore.loose,0);assert.equal(chest.stored,0);
 until(w,()=>a.job?.kind==='deliver');assert.equal(a.carrying,45);assert.equal(ore.gold,45);assert.equal(ore.terrain,'gold');assert(ore.designated);
 until(w,()=>chest.stored===45);assert.equal(ore.terrain,'gold');assert.equal(ore.gold,45);
 until(w,()=>chest.stored===90);assert.equal(ore.terrain,'floor');assert.equal(w.tiles.reduce((n,t)=>n+t.loose,0),0);
});
test('missing or full storage leaves all extracted gold at its seam',()=>{
 for(const full of [false,true]){
  const {w,a,ore,chest}=fixture();if(full)chest.capacity=0;else w.roomServices=[];
  until(w,()=>ore.terrain==='floor');assert.equal(ore.loose,90);assert.equal(a.carrying,0);assert(w.tiles.every(t=>t===ore||t.loose===0));
 }
});
test('storage filling during a delivery returns the bag to the extraction site without loss',()=>{
 const {w,a,ore,chest}=fixture();until(w,()=>a.job?.kind==='deliver');
 for(let i=0;i<20;i++)tick(w,.05);chest.capacity=0;
 until(w,()=>a.job?.kind==='drop');assert.equal(a.carrying,45);assert.equal(ore.loose,0);
 until(w,()=>ore.loose>=45);assert(w.tiles.every(t=>t===ore||t.loose===0));
 until(w,()=>ore.terrain==='floor');assert.equal(ore.loose,90);
 chest.capacity=108;until(w,()=>chest.stored===90);assert.equal(ore.loose,0);
});
test('partial last bag is delivered and cancelled seams keep their unmined gold',()=>{
 const {w,a,ore,chest}=fixture();until(w,()=>a.carrying===15);designate(w,[ore],false);
 until(w,()=>chest.stored===15);assert.equal(ore.gold,75);assert.equal(ore.loose,0);assert.equal(ore.terrain,'gold');
 designate(w,[ore]);until(w,()=>chest.stored===90);assert.equal(a.carrying,0);assert.equal(ore.terrain,'floor');
});
test('a partly full chest accepts what fits and excess returns to the seam',()=>{
 const {w,ore,chest}=fixture();chest.capacity=20;
 until(w,()=>ore.terrain==='floor'&&w.agents[0].carrying===0);assert.equal(chest.stored,20);assert.equal(ore.loose,70);
});
