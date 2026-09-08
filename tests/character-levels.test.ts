import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab} from '../src/content/room-lab.ts';
import {characterDefinitions,characterLevel} from '../src/content/characters.ts';
import {tuning} from '../src/content/tuning.ts';
import {buildRoom} from '../src/game/rooms.ts';
import {addResidents,tick} from '../src/game/simulation.ts';
import {characterStats,levelUp,syncCharacterHealth} from '../src/game/progression.ts';
import {addRaider} from '../src/game/defenses.ts';
import {queueCraft} from '../src/game/crafting.ts';
import {run,until} from './helpers/simulation.ts';

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
  run(w,duration-.1);assert.equal(a.level,1,def.id);assert((a.trainingProgress??0)>duration-.2,def.id);
  run(w,.15);assert.equal(a.level,2,def.id);assert.equal(a.trainingProgress,0);assert.equal(a.nextTrainingAt!>w.elapsed,true);
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
