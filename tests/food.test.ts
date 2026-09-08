import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab,labLayout} from '../src/content/room-lab.ts';
import {buildRoom,reclaimRoom} from '../src/game/rooms.ts';
import {addMiners,tick} from '../src/game/simulation.ts';
import {tileAt} from '../src/game/types.ts';
import {run,until} from './helpers/simulation.ts';

test('Kitchen floor feeds residents without furnishings or food inventories',()=>{
 const w=createRoomLab();buildRoom(w,'kitchen',labLayout(w,'Large hall'));addMiners(w);
 w.furnishings=[];for(const a of w.agents)a.hunger=.1;
 until(w,()=>w.agents.every(a=>a.meals>=1));
 assert(w.roomServices.filter(f=>f.room==='kitchen').every(f=>f.service==='dining'&&f.stored===0));
 assert.equal(w.roomServices.filter(f=>f.service==='dining'&&f.assigned!==undefined).length,3);
});
test('residents finish meals in an irregular Kitchen without parking in access routes',()=>{
 const w=createRoomLab();buildRoom(w,'kitchen',labLayout(w,'L shape'));addMiners(w);for(const a of w.agents)a.hunger=.1;
 until(w,()=>w.agents.every(a=>a.meals>=1));
});
test('one Kitchen square supports one resident continuously, and expansion supports the waiting population',()=>{
 const w=createRoomLab(),p={x:8,z:8};buildRoom(w,'kitchen',[p]);addMiners(w,3);
 for(const a of w.agents)a.hunger=.1;
 run(w,120);
 assert.equal(w.agents.filter(a=>a.meals>0).length,1,'Successive meals cannot share one resident-support slot.');
 assert(w.agents.find(a=>a.meals>0)!.meals>=2);
 assert.equal(w.roomServices.filter(f=>f.service==='dining').length,1);
 buildRoom(w,'kitchen',[{x:8,z:9},{x:8,z:10}]);
 until(w,()=>w.agents.every(a=>a.meals>0));
 assert.equal(new Set(w.roomServices.filter(f=>f.service==='dining').map(f=>f.assigned)).size,3);
});
test('isolating and reclaiming a Kitchen releases support without feeding through terrain',()=>{
 const w=createRoomLab(),plot=labLayout(w,'Compact');buildRoom(w,'kitchen',plot);addMiners(w);
 for(let x=7;x<=11;x++){tileAt(w,x,7)!.terrain='bedrock';tileAt(w,x,11)!.terrain='bedrock';}
 for(let z=7;z<=11;z++){tileAt(w,7,z)!.terrain='bedrock';tileAt(w,11,z)!.terrain='bedrock';}
 for(const a of w.agents)a.hunger=.1;
 run(w,30);assert(w.agents.every(a=>a.meals===0));
 assert(w.roomServices.filter(f=>f.service==='dining').every(f=>f.assigned===undefined));
 tileAt(w,9,11)!.terrain='floor';w.routesChanged=true;
 until(w,()=>w.agents.every(a=>a.meals>0));
 reclaimRoom(w,plot);tick(w,.05);
 assert.equal(w.roomServices.filter(f=>f.service==='dining').length,0);
 assert(w.agents.every(a=>a.job?.kind!=='eat'));
});
