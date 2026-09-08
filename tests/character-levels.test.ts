import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab} from '../src/content/room-lab.ts';
import {characterDefinitions,characterLevel} from '../src/content/characters.ts';
import {tuning} from '../src/content/tuning.ts';
import {buildRoom} from '../src/game/rooms.ts';
import {addResidents,tick} from '../src/game/simulation.ts';
import {characterStats,levelUp,syncCharacterHealth,gainExperience} from '../src/game/progression.ts';
import {addRaider} from '../src/game/defenses.ts';
import {queueCraft} from '../src/game/crafting.ts';
import {run,until} from './helpers/simulation.ts';
import {tickFighter} from '../src/game/combat.ts';

test('successful hits share training XP, level during cooldown and retain wounds and surplus',()=>{
 const w=createRoomLab();buildRoom(w,'training',[{x:8,z:8}]);addResidents(w,'warrior');const a=w.agents[0];
 Object.assign(a,{x:8,z:8});run(w,14);assert.equal(a.level,1);assert(a.experience!>=13.9);
 a.nextTrainingAt=1000;a.health=100;
 const enemy=addRaider(w,{x:9,z:8},{x:8,z:8})!;enemy.pinnedUntil=1000;
 tick(w,.05);assert.equal(a.level,2);assert.equal(a.maxHealth,165);assert.equal(a.health,125);
 assert(a.experience!>.9&&a.experience!<1.1,'Combat keeps excess XP toward the next level');
 assert.equal(a.job,undefined);assert.equal(a.combatTarget,enemy.id);
 const xp=a.experience;tick(w,.05);assert.equal(a.experience,xp,'Waiting between attacks grants no extra XP');
 run(w,1.1);assert(a.experience!>xp!,'Hits continue earning XP during the training cooldown');
 enemy.health=0;a.nextTrainingAt=0;const before=a.experience!;run(w,.5);
 assert(a.experience!>before,'Training resumes from combat-earned progress');
});

test('combat rewards successful hits at twice training pace for fighters and defending workers',()=>{
 for(const type of characterDefinitions.map(c=>c.id)){
  const w=createRoomLab();addResidents(w,type);const a=w.agents[0];Object.assign(a,{x:8,z:8});
  const e=addRaider(w,{x:9,z:8},{x:8,z:8})!;e.pinnedUntil=1000;
  tick(w,.05);assert.equal(a.experience,characterStats(a).attackSeconds*2,type);
  const xp=a.experience;e.x=11;
  tickFighter(w,a,.05,()=>{},()=>false);assert.equal(a.experience,xp,'Pursuing or standing near an enemy grants no XP');
  e.x=9;e.health=0;tickFighter(w,a,.05,()=>{},()=>false);assert.equal(a.experience,xp,'Dead enemies grant no XP');
 }
 const w=createRoomLab();addResidents(w,'warrior');const a=w.agents[0];Object.assign(a,{x:8,z:8,effects:[{id:'haste',kind:'haste',strength:1,until:100}]});
 const e=addRaider(w,{x:9,z:8},{x:8,z:8})!;e.pinnedUntil=100;
 run(w,.6);assert.equal(a.experience,4,'Haste earns XP through more frequent hits, without multiplying each hit twice');
});

test('combat XP respects zero damage, carries level surplus and stops at the cap',()=>{
 const w=createRoomLab();addResidents(w,'warrior');const a=w.agents[0];Object.assign(a,{x:8,z:8});
 const stats=characterStats(a),damage=stats.damage;
 try{stats.damage=0;const e=addRaider(w,{x:9,z:8},{x:8,z:8})!;e.pinnedUntil=100;tick(w,.05);assert.equal(a.experience,0);}finally{stats.damage=damage;}
 gainExperience(w,a,50,'combat');assert.equal(a.level,3);assert.equal(a.experience,5);
 gainExperience(w,a,10000,'combat');assert.equal(a.level,5);assert.equal(a.experience,0);
 assert.equal(gainExperience(w,a,10,'combat'),false);assert.equal(a.experience,0);
});

test('new residents start at level 1 and level-up raises health while retaining wounds and never reviving',()=>{
 for(const def of characterDefinitions){
  const w=createRoomLab();addResidents(w,def.id);const a=w.agents[0],first=characterLevel(def.id,1),second=characterLevel(def.id,2);
  assert.equal(a.level,1);assert.equal(a.health,first.health);assert.equal(a.maxHealth,first.health);
  a.health!-=17;assert(levelUp(w,a));assert.equal(a.level,2);assert.equal(a.maxHealth,second.health);assert.equal(a.health,second.health-17);
  a.health=0;assert.equal(levelUp(w,a),false);assert.equal(a.level,2);syncCharacterHealth(a);assert.equal(a.health,0);
 }
});

test('training uses the target character-level row, retains one-level visits and respects Haste',()=>{
 for(const def of characterDefinitions){
  const w=createRoomLab();buildRoom(w,'training',[{x:8,z:8}]);addResidents(w,def.id);const a=w.agents[0];Object.assign(a,{x:8,z:8});
  const duration=characterLevel(def.id,2).trainingSeconds;
  run(w,duration-.1);assert.equal(a.level,1,def.id);assert((a.experience??0)>duration-.2,def.id);
  run(w,.15);assert.equal(a.level,2,def.id);assert.equal(a.experience,0);assert.equal(a.nextTrainingAt!>w.elapsed,true);
 }
 const w=createRoomLab();buildRoom(w,'training',[{x:8,z:8}]);addResidents(w,'runesmith');const a=w.agents[0];
 Object.assign(a,{x:8,z:8,level:2,effects:[{id:'test-haste',kind:'haste',strength:1,until:100}]});syncCharacterHealth(a);
 const duration=characterLevel(a.type,3).trainingSeconds;
 run(w,duration/2-.1);assert.equal(a.level,2,'Work multiplier does not multiply training pace.');
 run(w,.2);assert.equal(a.level,3,'Haste halves the active practice time.');
});

test('level 1 Warrior loses an adjacent duel while level 2 wins through its real health and damage gains',()=>{
 for(const level of [1,2]){
  const w=createRoomLab();addResidents(w,'warrior');const a=w.agents[0];Object.assign(a,{x:8,z:8});
  if(level===2)assert(levelUp(w,a));
  const enemy=addRaider(w,{x:9,z:8},{x:8,z:8})!;
  until(w,()=>a.health===0||enemy.health===0,15);
  if(level===1){assert.equal(a.health,0);assert(enemy.health>0);}
  else {assert.equal(enemy.health,0);assert(a.health!>0&&a.health!<=40,'The level 2 victory remains close.');}
 }
});

test('workers defend at melee reach with their level stats, without pursuing or answering a rally',()=>{
 for(const type of ['miner','engineer','runesmith']){
  const w=createRoomLab();addResidents(w,type);const a=w.agents[0];Object.assign(a,{x:8,z:8,capabilities:['defend']});
  const enemy=addRaider(w,{x:9,z:8},{x:8,z:8})!;enemy.pinnedUntil=100;
  w.rally={x:13,z:8,radius:1,until:100};const health=enemy.health;
  tick(w,.05);assert.equal(enemy.health,health-characterStats(a).damage,type);
  assert.equal(a.nextAttackAt,w.elapsed+characterStats(a).attackSeconds,type);
  assert.deepEqual({x:a.x,z:a.z},{x:8,z:8});assert.equal(a.rallying,false,type);
  enemy.x=11;run(w,2);assert.deepEqual({x:a.x,z:a.z},{x:8,z:8},type);assert.equal(a.combatTarget,undefined,type);
  enemy.x=9;a.capabilities=[];const remaining=enemy.health;run(w,2);assert.equal(enemy.health,remaining,'Removing combat capabilities disables self-defense.');
 }
});

test('self-defense releases paid work and the worker resumes after the close threat moves away',()=>{
 const w=createRoomLab();buildRoom(w,'workshop',[{x:8,z:8}]);addResidents(w,'engineer');const a=w.agents[0];Object.assign(a,{x:8,z:8});
 queueCraft(w,'timber-door');until(w,()=>w.craftOrders[0].progress>.1);
 const order=w.craftOrders[0],progress=order.progress,spent=w.spent;
 const enemy=addRaider(w,{x:9,z:8},{x:8,z:8})!;enemy.pinnedUntil=100;tick(w,.05);
 assert.equal(order.state,'queued');assert.equal(order.worker,undefined);assert.equal(order.progress,progress);
 enemy.x=13;until(w,()=>order.state==='done');assert.equal(w.spent,spent);assert.equal(w.outputs['timber-door'],1);
});

test('higher worker levels speed actual crafting and normal ticks preserve explicit health overrides',()=>{
 const worlds=[1,5].map(level=>{
  const w=createRoomLab();buildRoom(w,'workshop',[{x:8,z:8}]);addResidents(w,'engineer');Object.assign(w.agents[0],{x:8,z:8,level,health:100,maxHealth:100});queueCraft(w,'timber-door');return w;
 });
 for(const w of worlds){run(w,3.8);assert.equal(w.agents[0].health,100);assert.equal(w.agents[0].maxHealth,100);}
 assert.equal(worlds[0].outputs['timber-door'],undefined);assert.equal(worlds[1].outputs['timber-door'],1);
});
