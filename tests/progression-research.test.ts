import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab} from '../src/content/room-lab.ts';
import {characterDefinitions} from '../src/content/characters.ts';
import {tuning} from '../src/content/tuning.ts';
import {spellById} from '../src/content/spells.ts';
import {buildRoom,goldTotal} from '../src/game/rooms.ts';
import {addResidents,designate,tick} from '../src/game/simulation.ts';
import {workRate} from '../src/game/progression.ts';
import {queueResearch,cancelResearch,castSpell} from '../src/game/research.ts';
import {createWorld} from '../src/game/world.ts';
import {tileAt,type World} from '../src/game/types.ts';
import {rect,run,until} from './helpers/simulation.ts';

test('every dwarf type trains autonomously, shares the level cap and gains usable work speed',()=>{
 const cap=tuning.trainingLevels;tuning.trainingLevels=1;
 try{
  const w=createRoomLab();buildRoom(w,'training',rect(7,5,7,5));
  for(const def of characterDefinitions)addResidents(w,def.id);
  until(w,()=>w.agents.every(a=>a.trainingLevel===1));
  assert(w.agents.every(a=>workRate(w,a)>1));run(w,70);
  assert(w.agents.every(a=>a.trainingLevel===1&&a.job?.kind!=='train'));
 }finally{tuning.trainingLevels=cap;}
 const w=createRoomLab();addResidents(w,'miner');const a=w.agents[0];Object.assign(a,{x:11,z:12,trainingLevel:tuning.trainingLevels});
 designate(w,[{x:12,z:12}]);run(w,tuning.mineSeconds-.3);
 assert.equal(tileAt(w,12,12)!.terrain,'floor','A trained miner completes actual excavation before the untrained duration.');
});

test('training and research release for shared meals and rest, then continue their earned progress',()=>{
 for(const type of ['warrior','runesmith']){
  const w=createRoomLab();buildRoom(w,type==='warrior'?'training':'library',rect(8,8,4,4));buildRoom(w,'dormitory',rect(2,2,5,5));buildRoom(w,'kitchen',rect(8,2,6,5));addResidents(w,type);queueResearch(w,'dwarf-haste');
  const a=w.agents[0];until(w,()=>type==='warrior'?(a.trainingProgress??0)>.3:(w.researchOrders![0].progress>.3));
  const progress=type==='warrior'?a.trainingProgress!:w.researchOrders![0].progress;
  a.energy=.1;a.hunger=.1;tick(w,.05);assert.equal(a.job?.kind,'sleep');
  until(w,()=>a.rested>0&&a.meals>0);
  until(w,()=>type==='warrior'?(a.trainingLevel??0)>0:w.researchOrders![0].state==='ready');
  assert(progress>0);assert(a.rested>0&&a.meals>0);
 }
});

test('Library requires research capability and supports pause, resume and exactly one ready spell',()=>{
 const w=createRoomLab();buildRoom(w,'library',rect(8,8,4,4));queueResearch(w,'dwarf-haste');addResidents(w,'warrior');run(w,5);
 assert.equal(w.researchOrders![0].progress,0);
 addResidents(w,'runesmith');until(w,()=>w.researchOrders![0].progress>1);
 const order=w.researchOrders![0],progress=order.progress;cancelResearch(w,'dwarf-haste');run(w,3);
 assert.equal(order.progress,progress);assert.equal(order.state,'queued');assert.equal(order.worker,undefined);
 queueResearch(w,'dwarf-haste');queueResearch(w,'dwarf-haste');assert.equal(w.researchOrders!.length,1);
 until(w,()=>order.state==='ready');assert(order.unlocked);
 run(w,3);assert.equal(order.state,'ready');assert.equal(order.worker,undefined);
});
