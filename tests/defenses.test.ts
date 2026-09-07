import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,reveal} from '../src/game/world.ts';
import {tileAt,type World} from '../src/game/types.ts';
import {defenseDefinitions,defenseById,raiderDefinition} from '../src/content/defenses.ts';
import {recipeById} from '../src/content/recipes.ts';
import {placeDefense,defenseQuote,setDoorMode,addRaider,tickDefenses,boltTarget,removeDefense} from '../src/game/defenses.ts';
import {doorIsOpen,defenseAt} from '../src/game/doors.ts';
import {findPath,blocked} from '../src/game/navigation.ts';
import {tick,addResidents} from '../src/game/simulation.ts';
import {buildRoom,goldTotal} from '../src/game/rooms.ts';
import {planWalls} from '../src/game/walls.ts';
import {queueCraft} from '../src/game/crafting.ts';
import {createRoomLab,labLayout} from '../src/content/room-lab.ts';
import {createDefenseLab} from '../src/content/defense-lab.ts';
const run=(w:World,seconds:number)=>{for(let i=0;i<Math.ceil(seconds*20);i++)tick(w,.05);};
function hall(){
  const w=createWorld({id:'defense-test',name:'Defense test',width:18,height:12,hearth:{x:3,z:3},openings:[[1,1,5,8],[1,8,16,8]],seams:[]});
  for(const t of w.tiles){t.known=true;t.claimed=t.terrain==='floor';}
  for(const d of defenseDefinitions)w.outputs[d.id]=3;
  return w;
}
const door=(w:World,type='timber-door')=>{assert.match(placeDefense(w,type,{x:10,z:8}),/placed/);return defenseAt(w,{x:10,z:8})!;};
test('all five recipes manufacture through the Workshop, charge once, and preserve increasing door tiers',()=>{
  const w=createRoomLab();w.freeRoomBuilding=true;buildRoom(w,'workshop',labLayout(w,'Compact'));addResidents(w,'engineer');
  w.allowance=230;for(const d of defenseDefinitions)queueCraft(w,d.id);run(w,90);
  assert.equal(goldTotal(w),0);for(const d of defenseDefinitions)assert.equal(w.outputs[d.id],1,d.id);
  const doors=defenseDefinitions.filter(d=>d.kind==='door');
  for(let i=1;i<doors.length;i++){assert(doors[i].health!>doors[i-1].health!);assert(recipeById(doors[i].id)!.cost>recipeById(doors[i-1].id)!.cost);assert(recipeById(doors[i].id)!.seconds>recipeById(doors[i-1].id)!.seconds);}
});
test('placement consumes stock once; rooms, walls, hidden sites and blocked approaches cannot overlap defenses',()=>{
  const w=hall(),gold=goldTotal(w);w.freeRoomBuilding=true;
  assert(!defenseQuote(w,'timber-door',{x:4,z:7}).valid);
  const d=door(w);assert.equal(w.outputs[d.type],2);assert.equal(goldTotal(w),gold);
  assert(!defenseQuote(w,'timber-door',d).valid);assert.equal(w.outputs[d.type],2);
  buildRoom(w,'treasure',[d]);planWalls(w,[d]);assert.equal(tileAt(w,10,8)!.room,undefined);assert(!tileAt(w,10,8)!.wallPlanned);
  tileAt(w,12,8)!.known=false;assert(!defenseQuote(w,'spike-trap',{x:12,z:8}).valid);tileAt(w,12,8)!.known=true;
  placeDefense(w,'spike-trap',{x:12,z:8});buildRoom(w,'treasure',[{x:12,z:8}]);planWalls(w,[{x:12,z:8}]);assert(!tileAt(w,12,8)!.room);assert(!tileAt(w,12,8)!.wallPlanned);assert(!blocked(w,{x:12,z:8}));
  w.outputs['bolt-trap']=0;assert(!defenseQuote(w,'bolt-trap',{x:14,z:8}).valid);
  tileAt(w,7,8)!.wallPlanned=true;assert(!defenseQuote(w,'spike-trap',{x:7,z:8}).valid);
  removeDefense(w,d.id);assert.equal(w.outputs[d.type],2);assert(!defenseAt(w,d));
});
test('door modes control both factions and shut doors occlude discovery',()=>{
  const w=hall(),d=door(w),left={x:8,z:8},right={x:14,z:8};
  assert(findPath(w,left,right));assert(!findPath(w,left,right,'enemy'));
  setDoorMode(w,d.id,'locked');assert(!findPath(w,left,right));
  for(let x=11;x<17;x++)tileAt(w,x,8)!.known=false;
  reveal(w,left,8);assert(!tileAt(w,11,8)!.known);
  setDoorMode(w,d.id,'open');reveal(w,left,8);assert(tileAt(w,14,8)!.known);assert(findPath(w,left,right));assert(findPath(w,left,right,'enemy'));
});
test('a locked door cancels an existing hauling route; Closed resumes hauling and shuts after passage',()=>{
  const w=hall(),d=door(w);addResidents(w,'miner',1);const a=w.agents[0];a.x=8;a.z=8;a.capabilities=['haul'];tileAt(w,14,8)!.loose=20;
  tick(w,.05);assert(a.path.length);setDoorMode(w,d.id,'locked');run(w,4);assert(a.x<9.34);assert.equal(tileAt(w,14,8)!.loose,20);
  setDoorMode(w,d.id,'closed');let sawOpen=false;
  for(let i=0;i<800;i++){tick(w,.05);sawOpen ||= doorIsOpen(w,d);}
  assert(sawOpen);assert.equal(tileAt(w,14,8)!.loose,0);assert.equal(a.carrying,0);assert(!doorIsOpen(w,d));
});
test('locking during a crossing lets the occupant exit but blocks new routes',()=>{
  const w=hall(),d=door(w);addResidents(w,'miner',1);const a=w.agents[0];a.x=10;a.z=8;a.capabilities=[];a.path=[{x:12,z:8}];a.job={kind:'idle',target:{x:12,z:8},work:{x:12,z:8},progress:0};
  setDoorMode(w,d.id,'locked');assert(doorIsOpen(w,d));assert(!findPath(w,{x:8,z:8},{x:12,z:8}));run(w,4);assert(a.x>11.8);assert(!doorIsOpen(w,d));assert(blocked(w,d));
});
test('a stationary dwarf in a newly locked doorway steps clear',()=>{
  const w=hall(),d=door(w);addResidents(w,'miner',1);const a=w.agents[0];a.x=10;a.z=8;a.capabilities=[];setDoorMode(w,d.id,'locked');run(w,3);assert(Math.abs(a.x-10)>.7);assert(!doorIsOpen(w,d));
});
test('an idle dwarf clears a Closed door instead of holding it open indefinitely',()=>{
  const w=hall(),d=door(w);addResidents(w,'miner',1);const a=w.agents[0];a.x=10;a.z=8;a.capabilities=[];run(w,3);assert(Math.abs(a.x-10)>.7);assert(!doorIsOpen(w,d));
});
test('raiders break each shut door tier, with stronger tiers buying more time',()=>{
  const times:number[]=[];
  for(const type of ['timber-door','reinforced-door','steel-door']){
    const w=hall(),d=door(w,type),e=addRaider(w,{x:12,z:8},{x:8,z:8})!;setDoorMode(w,d.id,'locked');
    for(let i=0;i<800&&defenseAt(w,d);i++)tick(w,.05);
    assert(!defenseAt(w,d),type);times.push(w.elapsed);run(w,4);assert.equal(e.activity,'Reached test target');assert.equal(e.health,120);
  }
  assert(times[1]>times[0]+7);assert(times[2]>times[1]+10);
  const w=hall(),d=door(w);setDoorMode(w,d.id,'open');addRaider(w,{x:12,z:8},{x:8,z:8});run(w,5);assert.equal(d.health,100);
});
test('raiders take an open alternative route before attacking a shut door',()=>{
  const w=hall(),d=door(w);for(let x=9;x<=11;x++)tileAt(w,x,7)!.terrain='floor';const e=addRaider(w,{x:12,z:8},{x:8,z:8})!;run(w,8);assert.equal(e.activity,'Reached test target');assert.equal(d.health,100);
});
test('spikes ignore dwarfs, damage and pin an enemy, then reset without an Engineer',()=>{
  const w=hall();placeDefense(w,'spike-trap',{x:10,z:8});const d=defenseAt(w,{x:10,z:8})!;
  addResidents(w,'miner',1);w.agents[0].x=10;w.agents[0].z=8;w.agents[0].capabilities=[];run(w,1);assert.equal(d.readyAt,0);w.agents=[];
  const e=addRaider(w,{x:10,z:8},{x:14,z:8})!;tick(w,.05);assert.equal(e.health,80);assert.equal(e.activity,'Pinned by spikes');const start=e.x;run(w,1.8);assert.equal(e.x,start);run(w,.5);assert(e.x>start);
  const next=addRaider(w,{x:10,z:8},{x:10,z:8})!;tick(w,.05);assert.equal(next.health,120);run(w,4);assert.equal(next.health,80);assert(next.pinnedUntil>w.elapsed);assert.equal(w.agents.length,0);
});
test('spikes catch a fast crossing and a lethal hit does not leave a living pinned actor',()=>{
  const w=hall();placeDefense(w,'spike-trap',{x:10,z:8});const e=addRaider(w,{x:8,z:8},{x:14,z:8})!;e.health=30;
  const speed=raiderDefinition.speed;try{raiderDefinition.speed=30;w.elapsed+=.25;tickDefenses(w,.25);}finally{raiderDefinition.speed=speed;}
  assert.equal(e.health,0);assert.equal(e.activity,'Defeated');assert(Math.abs(e.x-10)<.5);assert.equal(e.pinnedUntil,0);const p=e.x;run(w,3);assert.equal(e.x,p);
});
test('bolts select the first enemy in their direction and respect range, walls, furniture and shut doors',()=>{
  const w=hall();placeDefense(w,'bolt-trap',{x:6,z:8});const bolt=defenseAt(w,{x:6,z:8})!,d=door(w);
  const far=addRaider(w,{x:12,z:8},{x:12,z:8})!;assert(!boltTarget(w,bolt));setDoorMode(w,d.id,'open');assert.equal(boltTarget(w,bolt),far);
  const near=addRaider(w,{x:8,z:8},{x:8,z:8})!;assert.equal(boltTarget(w,bolt),near);bolt.rotation=2;assert(!boltTarget(w,bolt));bolt.rotation=0;
  tileAt(w,7,8)!.terrain='rock';assert(!boltTarget(w,bolt));tileAt(w,7,8)!.terrain='floor';
  w.furnishings.push({id:'obstacle',kind:'bench',room:'workshop',service:'craft',x:7,z:8,cells:[{x:7,z:8}],access:{x:7,z:7},rotation:0,capacity:1,stored:0});assert(!boltTarget(w,bolt));w.furnishings=w.furnishings.filter(f=>f.id!=='obstacle');
  near.health=0;far.x=14;assert(!boltTarget(w,bolt));far.x=12;far.z=7;assert(!boltTarget(w,bolt));
});
test('bolts reload automatically and shoot past friendly dwarfs without hurting or triggering on them',()=>{
  const w=hall();placeDefense(w,'bolt-trap',{x:8,z:8});const d=defenseAt(w,{x:8,z:8})!;addResidents(w,'miner',1);w.agents[0].x=9;w.agents[0].z=8;w.agents[0].capabilities=[];
  run(w,1);assert.equal(d.readyAt,0);const e=addRaider(w,{x:12,z:8},{x:12,z:8})!;tick(w,.05);assert.equal(e.health,90);const fired=d.triggeredAt;run(w,2.8);assert.equal(e.health,90);assert.equal(d.triggeredAt,fired);run(w,.3);assert.equal(e.health,60);assert.equal(w.agents.length,1);
});
test('the debug yard uses production, real placement and raiders; combined traps defeat an attacker',()=>{
  const w=createDefenseLab();assert.equal(w.defenses?.length,3);assert.equal(w.outputs['timber-door'],1);assert(w.furnishings.some(f=>f.service==='craft'));const e=addRaider(w,w.defenseTest!.spawn,w.defenseTest!.target)!;run(w,22);assert.equal(e.health,0);assert.equal(w.defenses!.find(d=>d.type==='timber-door')!.health,100);assert.equal(w.outputs['reinforced-door'],3);
});
test('the defense yard respects free room construction while production still charges gold',()=>{
  const w=createDefenseLab(true);assert.equal(w.allowance,50000);assert(w.tiles.filter(t=>t.room).every(t=>t.roomPaid===0));run(w,22);assert.equal(w.allowance,49960);assert.equal(w.outputs['reinforced-door'],3);
});
