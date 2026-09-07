import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/world.ts';
import {tileAt} from '../src/game/types.ts';
import {addMiners,tick,designate} from '../src/game/simulation.ts';
import {planWalls,wallBuildDuration} from '../src/game/walls.ts';
import {buildRoom} from '../src/game/rooms.ts';
import {canStand,findPath} from '../src/game/navigation.ts';
import {tuning} from '../src/content/tuning.ts';
function fixture(){
 const w=createWorld({id:'walls',name:'Walls',width:12,height:12,hearth:{x:3,z:3},openings:[[2,2,9,9]],seams:[]});for(const t of w.tiles){t.known=true;if(t.terrain==='floor')t.claimed=true;else t.terrain='bedrock';}addMiners(w,1);w.agents[0].x=7;w.agents[0].z=6;return w;
}
test('miners build planned walls slowly, preserve occupancy and can excavate them later',()=>{
 const w=fixture(),p={x:7,z:7},t=tileAt(w,7,7)!;assert(wallBuildDuration()>tuning.mineSeconds+tuning.reinforceSeconds);planWalls(w,[p]);buildRoom(w,'treasure',[p]);assert(!t.room);
 for(let i=0;i<200;i++)tick(w,.05);assert.equal(t.terrain,'floor');assert((t.wallProgress??0)>0);
 for(let i=0;i<600&&t.terrain==='floor';i++)tick(w,.05);assert.equal(t.terrain,'rock');assert(t.reinforced);assert(!t.wallPlanned);assert(w.agents.every(a=>canStand(w,a)));
 designate(w,[p]);for(let i=0;i<200&&t.terrain==='rock';i++)tick(w,.05);assert.equal(t.terrain,'floor');assert(!t.reinforced);
});
test('wall drag plans skip ineligible tiles, cancel independently and leave stored gold intact',()=>{
 const w=fixture(),t=tileAt(w,7,7)!;tileAt(w,8,7)!.loose=2;const access=w.furnishings[0].access;
 planWalls(w,[t,t,{x:8,z:7},access,{x:3,z:3},{x:0,z:0}]);assert(t.wallPlanned);assert(!tileAt(w,8,7)!.wallPlanned);assert(!tileAt(w,access.x,access.z)!.wallPlanned);
 for(let i=0;i<1600&&w.agents[0].job?.kind!=='buildWall';i++)tick(w,.05);assert.equal(w.agents[0].job?.kind,'buildWall');planWalls(w,[t],false);tick(w,.05);assert.notEqual(w.agents[0].job?.kind,'buildWall');assert.equal(t.wallProgress,0);
});
test('a dwarf standing in a completed wall plan moves out before it becomes solid',()=>{
 const w=fixture(),t=tileAt(w,7,7)!;planWalls(w,[t]);t.wallProgress=wallBuildDuration();addMiners(w,1);const occupant=w.agents[1];occupant.x=7;occupant.z=7;occupant.retry=10;
 tick(w,.05);assert.equal(t.terrain,'floor');assert(w.agents.every(a=>canStand(w,a)));
 occupant.retry=0;for(let i=0;i<300&&t.terrain==='floor';i++)tick(w,.05);assert.equal(t.terrain,'rock');assert(w.agents.every(a=>canStand(w,a)));
});
