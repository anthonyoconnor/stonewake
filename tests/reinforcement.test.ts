import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/world.ts';
import {tileAt} from '../src/game/types.ts';
import {addMiners,designate,tick} from '../src/game/simulation.ts';

function fixture(){
 const w=createWorld({id:'walls',name:'Walls',width:12,height:12,hearth:{x:3,z:3},openings:[[2,2,8,8]],seams:[]});
 for(const t of w.tiles){t.known=true;if(t.terrain==='floor')t.claimed=true;else t.terrain='bedrock';}
 const wall=tileAt(w,7,7)!;wall.terrain='dirt';wall.claimed=false;
 addMiners(w,1);w.agents[0].x=7;w.agents[0].z=6;
 return {w,wall};
}
test('spare miners reinforce ordinary walls, then player excavation restores bare floor',()=>{
 const {w,wall}=fixture();tick(w,.05);assert.equal(w.agents[0].job?.kind,'reinforce');assert(!wall.reinforced);
 for(let i=0;i<130;i++)tick(w,.05);
 assert.equal(wall.reinforced,true);assert(w.tiles.filter(t=>t.terrain==='bedrock').every(t=>!t.reinforced));
 designate(w,[wall]);for(let i=0;i<200&&wall.terrain!=='floor';i++)tick(w,.05);
 assert.equal(wall.terrain,'floor');assert.equal(wall.reinforced,false);assert.equal(wall.claimed,false);
 for(let i=0;i<50;i++)tick(w,.05);assert.equal(wall.claimed,true);
});
test('excavation takes priority and designating a wall cancels reinforcement',()=>{
 const {w,wall}=fixture();tick(w,.05);designate(w,[wall]);tick(w,.05);
 assert.equal(w.agents[0].job?.kind,'mine');assert(!wall.reinforced);
 const second=fixture();second.wall.designated=true;tick(second.w,.05);
 assert.equal(second.w.agents[0].job?.kind,'mine');
});
test('unclaimed approaches and resource seams do not get reinforcement',()=>{
 const {w,wall}=fixture();for(const t of w.tiles)if(!t.core)t.claimed=false;
 tick(w,.05);assert.notEqual(w.agents[0].job?.kind,'reinforce');
 for(const terrain of ['gold','gem'] as const){const f=fixture();f.wall.terrain=terrain;tick(f.w,.05);assert.notEqual(f.w.agents[0].job?.kind,'reinforce');}
});
