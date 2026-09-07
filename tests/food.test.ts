import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab,labLayout} from '../src/content/room-lab.ts';
import {buildRoom} from '../src/game/rooms.ts';
import {addMiners,tick} from '../src/game/simulation.ts';
import {produceFood} from '../src/game/food.ts';
import {tileAt} from '../src/game/types.ts';
test('a functioning Kitchen grows, cooks, brews and feeds all miners',()=>{
 const w=createRoomLab();buildRoom(w,'kitchen',labLayout(w,'Large hall'));addMiners(w);for(const a of w.agents)a.hunger=.1;
 for(let i=0;i<900;i++)tick(w,.05);
 for(const service of ['growing','cooking','brewing','dining'])assert(w.furnishings.some(f=>f.service===service));
 assert(w.agents.every(a=>a.meals>=1));assert(w.furnishings.some(f=>f.service==='brewing'&&f.stored>0));
 assert(w.furnishings.every(f=>f.stored>=0&&f.stored<=f.capacity));
});
test('residents finish meals in an irregular Kitchen without parking in access routes',()=>{
 const w=createRoomLab();buildRoom(w,'kitchen',labLayout(w,'L shape'));addMiners(w);for(const a of w.agents)a.hunger=.1;
 for(let i=0;i<1000;i++)tick(w,.05);assert(w.agents.every(a=>a.meals>=1));
});
test('floor paint and growing beds alone do not create prepared meals',()=>{
 const w=createRoomLab();buildRoom(w,'kitchen',labLayout(w,'Single tile'));produceFood(w,100);assert.equal(w.furnishings.filter(f=>f.room==='kitchen').length,0);
 buildRoom(w,'kitchen',[{x:9,z:10}]);for(let i=0;i<30;i++)produceFood(w,1);assert(w.furnishings.every(f=>f.service!=='cooking'||f.stored===0));
});
test('isolated Kitchen does not feed residents through a blocked route',()=>{
 const w=createRoomLab();buildRoom(w,'kitchen',labLayout(w,'Compact'));addMiners(w);
 for(let i=0;i<30;i++)produceFood(w,1);
 for(let x=4;x<=11;x++){tileAt(w,x,7)!.terrain='bedrock';tileAt(w,x,11)!.terrain='bedrock';}
 for(let z=7;z<=11;z++){tileAt(w,7,z)!.terrain='bedrock';tileAt(w,11,z)!.terrain='bedrock';}
 for(const a of w.agents)a.hunger=.1;
 for(let i=0;i<600;i++)tick(w,.05);assert(w.agents.every(a=>a.meals===0));
});
