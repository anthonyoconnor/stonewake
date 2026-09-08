import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab} from '../src/content/room-lab.ts';
import {characterDefinitions,characterLevel,maxCharacterLevel} from '../src/content/characters.ts';
import {tuning} from '../src/content/tuning.ts';
import {spellById} from '../src/content/spells.ts';
import {roomById} from '../src/content/rooms.ts';
import {buildRoom,goldTotal} from '../src/game/rooms.ts';
import {addResidents,designate,tick} from '../src/game/simulation.ts';
import {workRate} from '../src/game/progression.ts';
import {queueResearch,cancelResearch,castSpell} from '../src/game/research.ts';
import {queueCraft} from '../src/game/crafting.ts';
import {createWorld} from '../src/game/world.ts';
import {tileAt,type World} from '../src/game/types.ts';
import {rect,run,until} from './helpers/simulation.ts';

test('specialists train autonomously to their cap while miners keep fixed work speed',()=>{
 const cadence=tuning.trainingInterval;
 const times=characterDefinitions.map(def=>def.levels.map(row=>row.trainingSeconds));
 tuning.trainingInterval=1;for(const def of characterDefinitions)for(const row of def.levels)if(row.level>1)row.trainingSeconds=.5;
 try{
  const w=createRoomLab();buildRoom(w,'training',rect(7,5,7,5));
  for(const def of characterDefinitions)addResidents(w,def.id);
  assert(w.agents.every(a=>a.level===1));
  until(w,()=>w.agents.every(a=>a.level===maxCharacterLevel(a.type)));
  assert(w.agents.every(a=>workRate(w,a)===characterLevel(a.type,5).workMultiplier));run(w,70);
  assert(w.agents.every(a=>a.level===maxCharacterLevel(a.type)&&a.job?.kind!=='train'));
 }finally{tuning.trainingInterval=cadence;characterDefinitions.forEach((def,i)=>def.levels.forEach((row,j)=>row.trainingSeconds=times[i][j]));}
 const w=createRoomLab();addResidents(w,'miner');const a=w.agents[0];Object.assign(a,{x:11,z:12,level:5});
 designate(w,[{x:12,z:12}]);run(w,tuning.mineSeconds-.3);
 assert.notEqual(tileAt(w,12,12)!.terrain,'floor','Miner work speed stays fixed even with a stale higher level.');
});

test('training and research release for shared meals and rest, then continue their earned progress',()=>{
 for(const type of ['warrior','runesmith']){
  const w=createRoomLab();buildRoom(w,type==='warrior'?'training':'library',rect(8,8,4,4));buildRoom(w,'dormitory',rect(2,2,5,5));buildRoom(w,'kitchen',rect(8,2,6,5));addResidents(w,type);queueResearch(w,'dwarf-haste');
  const a=w.agents[0];until(w,()=>type==='warrior'?(a.experience??0)>.3:(w.researchOrders![0].progress>.3));
  const progress=type==='warrior'?a.experience!:w.researchOrders![0].progress;
  a.energy=.1;a.hunger=.1;tick(w,.05);assert.equal(a.job?.kind,'sleep');
  until(w,()=>a.rested>0&&a.meals>0);
  until(w,()=>type==='warrior'?(a.level??1)>1:w.researchOrders![0].state==='ready');
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

test('a single unfurnished training square grants one level, releases its slot and sends the trainee out during cooldown',()=>{
 const second=characterLevel('warrior',2),third=characterLevel('warrior',3);
 const original={second:second.trainingSeconds,third:third.trainingSeconds,interval:tuning.trainingInterval};
 second.trainingSeconds=2;third.trainingSeconds=2;tuning.trainingInterval=12;
 try{
  const w=createRoomLab(),plot={x:8,z:8};buildRoom(w,'training',[plot]);addResidents(w,'warrior',2);w.furnishings=[];
  Object.assign(w.agents[0],{x:8,z:10});Object.assign(w.agents[1],{x:9,z:10});
  until(w,()=>w.agents.some(a=>a.job?.kind==='train'));
  assert.equal(w.agents.filter(a=>a.job?.kind==='train').length,1);
  until(w,()=>w.agents.some(a=>a.level===2));
  const trained=w.agents.find(a=>a.level===2)!,availableAt=trained.nextTrainingAt!;
  assert.equal(availableAt,w.elapsed+12);assert(!w.agents.some(a=>a.id===trained.id&&a.job));
  until(w,()=>Math.round(trained.x)!==plot.x||Math.round(trained.z)!==plot.z,8);
  assert.equal(trained.level,2);assert.notEqual(trained.job?.kind,'train');
  until(w,()=>w.agents.every(a=>a.level===2),8);
  while(w.elapsed+.05<availableAt){tick(w,.05);assert.equal(trained.level,2);assert.notEqual(trained.job?.kind,'train');}
  until(w,()=>trained.level===3,12);
 }finally{second.trainingSeconds=original.second;third.trainingSeconds=original.third;tuning.trainingInterval=original.interval;}
});

test('a Library square with two configured slots lets two Runesmiths research without furniture or separate work coordinates',()=>{
 const def=roomById('library')!,density=def.capacityPerTile;def.capacityPerTile=2;
 try{
  const w=createRoomLab();buildRoom(w,'library',[{x:8,z:8}]);addResidents(w,'runesmith',2);w.furnishings=[];
  queueResearch(w,'dwarf-haste');queueResearch(w,'stoneguard');
  until(w,()=>w.agents.every(a=>a.job?.kind==='research'));
  assert.equal(new Set(w.agents.map(a=>a.job!.furnishing)).size,2);
  assert.deepEqual(w.agents[0].job!.work,w.agents[1].job!.work);
  until(w,()=>w.researchOrders!.every(o=>o.progress>1));
  until(w,()=>w.researchOrders!.every(o=>o.state==='ready'));
 }finally{def.capacityPerTile=density;}
});

test('an Engineer leaves training during cooldown even when a queued craft order lacks gold',()=>{
 const w=createRoomLab(),plot={x:8,z:8};
 buildRoom(w,'training',[plot]);buildRoom(w,'workshop',[{x:10,z:8}]);addResidents(w,'engineer');
 const a=w.agents[0];Object.assign(a,plot);w.allowance=0;queueCraft(w,'timber-door');
 until(w,()=>a.level===2);
 const availableAt=a.nextTrainingAt!;
 until(w,()=>Math.round(a.x)!==plot.x||Math.round(a.z)!==plot.z,8);
 until(w,()=>a.activity==='Waiting for production gold',8);
 assert.equal(a.level,2);assert(w.elapsed<availableAt);assert.equal(w.craftOrders[0].paid,false);
 assert.deepEqual(w.outputs,{});
});
