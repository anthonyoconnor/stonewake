import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/world.ts';
import {spellDefinitions,spellById} from '../src/content/spells.ts';
import {addResidents,tick,designate} from '../src/game/simulation.ts';
import {queueResearch,castSpell,type SpellTarget} from '../src/game/research.ts';
import {health,hasteRate,slowRate,damageResident,damageEnemy,dismissRally,visible} from '../src/game/spell-effects.ts';
import {addRaider} from '../src/game/defenses.ts';
import {blocked,findPath} from '../src/game/navigation.ts';
import {buildRoom,roomQuote,goldTotal} from '../src/game/rooms.ts';
import {workRate} from '../src/game/progression.ts';
import {type World,tileAt} from '../src/game/types.ts';
const run=(w:World,seconds:number)=>{for(let i=0;i<Math.round(seconds*20);i++)tick(w,.05);};
function arena(){
  const w=createWorld({id:'spells',name:'Spells',width:24,height:20,hearth:{x:4,z:4},openings:[[2,2,21,17]],seams:[]});
  for(const t of w.tiles){t.known=true;t.claimed=t.terrain==='floor';}w.allowance=50000;
  addResidents(w,'warrior',2);addResidents(w,'miner');w.agents.forEach((a,i)=>Object.assign(a,{x:8,z:8+i,health:100,maxHealth:100,nextTrainingAt:10000}));return w;
}
function ready(w:World,id:string){queueResearch(w,id);const o=w.researchOrders!.find(o=>o.spell===id)!;Object.assign(o,{state:'ready',unlocked:true,worker:undefined});return o;}
function cast(w:World,id:string,target:SpellTarget){ready(w,id);assert.match(castSpell(w,id,target),/ cast\./);}
const point=(x:number,z:number):SpellTarget=>({kind:'point',point:{x,z}});
test('retired spells are removed; target failures preserve ready charge and gold',()=>{
  const w=arena();assert.equal(spellById('haste'),undefined);assert.equal(spellById('prospect'),undefined);assert.equal(spellDefinitions.length,8);
  queueResearch(w,'prospect');assert.equal(w.researchOrders!.length,0);
  const o=ready(w,'dwarf-haste'),gold=goldTotal(w);
  assert.match(castSpell(w,'dwarf-haste'),/Choose/);assert.equal(o.state,'ready');assert.equal(goldTotal(w),gold);
  assert.match(castSpell(w,'dwarf-haste',{kind:'enemy',id:1}),/Choose/);
  cast(w,'dwarf-haste',{kind:'dwarf',id:1});assert.equal(goldTotal(w),gold-25);assert.equal(o.state,'queued');
  ready(w,'dwarf-haste');assert.match(castSpell(w,'dwarf-haste',{kind:'dwarf',id:1}),/already active/);
  const e=addRaider(w,{x:20,z:16},{x:20,z:16})!;ready(w,'enemy-slow');assert(!visible(w,e));assert.match(castSpell(w,'enemy-slow',{kind:'enemy',id:e.id}),/visible/);
});
test('individual Haste speeds actual mining, movement and preparation without affecting neighbors or needs',()=>{
  const w=arena(),a=w.agents[2],other=w.agents[0];a.x=10;a.z=10;tileAt(w,11,10)!.terrain='dirt';designate(w,[{x:11,z:10}]);
  cast(w,'dwarf-haste',{kind:'dwarf',id:a.id});assert.equal(workRate(w,a),1.5);assert.equal(workRate(w,other),1);
  run(w,2);assert.equal(tileAt(w,11,10)!.terrain,'floor');assert(Math.abs(a.hunger-other.hunger)<1e-8);
  const w2=arena();w2.agents=[];buildRoom(w2,'library',Array.from({length:25},(_,i)=>({x:7+i%5,z:5+Math.floor(i/5)})));addResidents(w2,'runesmith');
  const r=w2.agents[0];r.energy=r.hunger=1;
  cast(w2,'dwarf-haste',{kind:'dwarf',id:r.id});const order=w2.researchOrders![0];run(w2,19);assert.equal(order.state,'ready');
  run(w2,2);assert.equal(hasteRate(w2,r),1);w2.allowance=0;for(const f of w2.furnishings)f.stored=0;
  assert.match(castSpell(w2,'dwarf-haste',{kind:'dwarf',id:r.id}),/Not enough/);assert.equal(order.state,'ready');
});
test('Slow reduces strong enemy travel and attack rate; Reckoning boosts only dwarf damage',()=>{
  const w=arena();w.agents=w.agents.slice(2);const a=w.agents[0];a.x=8;a.z=8;a.capabilities=[];
  const e=addRaider(w,{x:12,z:8},{x:8,z:8})!;e.health=1000;
  cast(w,'enemy-slow',{kind:'enemy',id:e.id});run(w,1);assert(e.x>11.25&&e.x<11.35);assert.equal(slowRate(w,e),.6);
  cast(w,'rune-of-reckoning',{kind:'enemy',id:e.id});let before=e.health;damageEnemy(w,e,10,'dwarf');assert.equal(before-e.health,13);
  before=e.health;damageEnemy(w,e,10,'trap');damageEnemy(w,e,10,'spell');assert.equal(before-e.health,20);
  e.x=8.9;e.nextAttackAt=0;run(w,.05);assert.equal(health(a),80);run(w,1.1);assert.equal(health(a),80);run(w,.65);assert.equal(health(a),60);
});
test('Stoneguard absorbs damage, passes excess through and expires; Mending pauses after every hit',()=>{
  const w=arena(),a=w.agents[0];cast(w,'stoneguard',{kind:'dwarf',id:a.id});damageResident(w,a,25);assert.equal(health(a),100);damageResident(w,a,30);assert.equal(health(a),85);
  a.health=20;cast(w,'mending-rune',{kind:'dwarf',id:a.id});run(w,3);assert.equal(health(a),20);run(w,2);assert(Math.abs(health(a)-28)<.01);
  damageResident(w,a,1);run(w,2);assert(Math.abs(health(a)-27)<.01);damageResident(w,a,1);run(w,3);assert(Math.abs(health(a)-26)<.01);
  run(w,15);assert.equal(a.effects?.length,0);assert(health(a)<=58.01);
  a.health=100;ready(w,'mending-rune');const gold=goldTotal(w);assert.match(castSpell(w,'mending-rune',{kind:'dwarf',id:a.id}),/wounded/);assert.equal(goldTotal(w),gold);
});
test('Thunder damages and stuns an area without friendly fire or passing through walls',()=>{
  const w=arena(),a=w.agents[0];a.x=10;a.z=8;w.agents[1].x=13;w.agents[1].z=8;
  const e=addRaider(w,{x:10,z:9},{x:10,z:9})!,behind=addRaider(w,{x:12,z:9},{x:12,z:9})!;
  tileAt(w,11,9)!.terrain='rock';cast(w,'thunder-rune',point(10,9));assert.equal(e.health,90);assert.equal(e.pinnedUntil,2);assert.equal(behind.health,120);assert.equal(health(a),100);
  e.nextAttackAt=0;run(w,1);assert.equal(e.x,10);assert.equal(e.z,9);
  ready(w,'thunder-rune');assert.match(castSpell(w,'thunder-rune',point(5,8)),/No visible enemy/);
});
test('barrier validates occupancy and access, blocks construction and both path types, then expires or breaks',()=>{
  const w=arena();w.agents=w.agents.slice(0,1);w.agents[0].x=8;w.agents[0].z=8;w.agents[0].capabilities=[];
  for(let z=1;z<19;z++)if(z!==8)tileAt(w,10,z)!.terrain='rock';
  ready(w,'runic-barrier');assert.match(castSpell(w,'runic-barrier',point(8,8)),/clear/);
  cast(w,'runic-barrier',point(10,8));assert(blocked(w,{x:10,z:8}));assert(!findPath(w,{x:8,z:8},{x:12,z:8}));assert(!findPath(w,{x:12,z:8},{x:8,z:8},'enemy'));
  assert.equal(roomQuote(w,'treasure',[{x:10,z:8}]).valid,false);
  run(w,15.1);assert(!w.barrier);assert(findPath(w,{x:8,z:8},{x:12,z:8}));
  cast(w,'runic-barrier',point(10,8));const e=addRaider(w,{x:12,z:8},{x:8,z:8})!;run(w,12);assert(!w.barrier);assert(e.x<10);assert.equal(tileAt(w,10,8)!.terrain,'floor');
});
test('Call to Arms rallies every fighter, leaves workers alone, supports new arrivals and releases on dismiss/expiry',()=>{
  const w=arena(),miner=w.agents[2];const origin={x:miner.x,z:miner.z};
  cast(w,'call-to-arms',point(13,8));run(w,3);assert(w.agents.slice(0,2).every(a=>a.rallying&&Math.hypot(a.x-13,a.z-8)<=3.1));assert.equal(miner.rallying,undefined);assert.notEqual(miner.activity,'Answering Call to Arms');
  addResidents(w,'warrior');run(w,5);assert(w.agents.at(-1)!.rallying);
  ready(w,'call-to-arms');assert.match(castSpell(w,'call-to-arms',point(12,8)),/already active/);
  dismissRally(w);assert(!w.rally);run(w,.1);assert(w.agents.every(a=>!a.rallying));
  cast(w,'call-to-arms',point(12,8));run(w,45.1);assert(!w.rally);assert(w.agents.every(a=>!a.rallying));
});
test('combat uses Haste and Slow, spends shield, permits healing, and releases dead workers and cargo',()=>{
  const w=arena();w.agents=w.agents.slice(0,1);const a=w.agents[0],e=addRaider(w,{x:9,z:8},{x:8,z:8})!;
  cast(w,'dwarf-haste',{kind:'dwarf',id:a.id});cast(w,'stoneguard',{kind:'dwarf',id:a.id});cast(w,'enemy-slow',{kind:'enemy',id:e.id});cast(w,'rune-of-reckoning',{kind:'enemy',id:e.id});
  run(w,2.2);assert(e.health<=68);assert.equal(health(a),100);
  run(w,5);assert(e.health<=0);assert(health(a)>0);
  a.carrying=45;damageResident(w,a,1000);run(w,.05);assert.equal(w.agents.length,0);assert.equal(tileAt(w,Math.round(a.x),Math.round(a.z))!.loose,45);
});

test('rally interrupts research safely and resumes after a blocked route and critical needs',()=>{
  const w=arena();w.agents=w.agents.slice(0,2);const a=w.agents[0],b=w.agents[1];
  const o=ready(w,'stoneguard');o.state='working';o.worker=a.id;o.progress=3;
  a.job={kind:'research',target:{x:8,z:8},work:{x:8,z:8},progress:0,order:o.id};
  cast(w,'call-to-arms',point(13,8));tick(w,.05);assert.equal(o.state,'queued');assert.equal(o.worker,undefined);assert.equal(o.progress,3);assert.equal(a.job,undefined);
  for(let z=1;z<19;z++)tileAt(w,10,z)!.terrain='rock';w.routesChanged=true;
  run(w,.1);assert(a.rallyUnreachable);assert(b.rallyUnreachable);
  tileAt(w,10,8)!.terrain='floor';w.routesChanged=true;run(w,4);assert(!a.rallyUnreachable);assert.equal(a.activity,'Holding rally');
  a.energy=.01;run(w,.05);assert(!a.rallying);assert(a.recovering);a.energy=1;run(w,.1);assert(a.rallying);
});
