import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startCampaign, travelOnward, restartCampaignArea, campaignSummary } from '../src/game/campaign.ts';
import { campaignStages, campaignStartingAvailability } from '../src/content/campaign.ts';
import { goldTotal, buildRoom, roomQuote } from '../src/game/rooms.ts';
import { bridgeQuote } from '../src/game/bridges.ts';
import { recruitmentStatus } from '../src/game/recruitment.ts';
import { queueCraft } from '../src/game/crafting.ts';
import { queueResearch, castSpell } from '../src/game/research.ts';
import { defenseQuote } from '../src/game/defenses.ts';
import { createWorld } from '../src/game/world.ts';
import { tuning } from '../src/content/tuning.ts';
import { tileAt, type World } from '../src/game/types.ts';
import { designate } from '../src/game/simulation.ts';
import { until, rect } from './helpers/simulation.ts';

const complete = (w: World) => { w.outcome = 'victory'; w.onwardHearth!.ready = true; return w; };
const reach = (index: number) => { let w = startCampaign(); for(let i=0;i<index;i++) w=travelOnward(complete(w))!; return w; };

test('first crew excavates and builds affordable basic room space', () => {
  const w = startCampaign();
  assert.equal(w.agents.length, tuning.startingStonehands);
  assert(!w.onwardHearth!.discovered);
  const room = rect(w.hearth.x-2,w.hearth.z-5,3,3);
  designate(w,room);
  until(w,()=>room.every(p=>tileAt(w,p.x,p.z)!.claimed&&tileAt(w,p.x,p.z)!.terrain==='floor'),120,'excavated room');
  assert(roomQuote(w,'treasure',room).valid);
  buildRoom(w,'treasure',room);
  assert(room.every(p=>tileAt(w,p.x,p.z)!.room==='treasure'));
});

test('later rooms, residents, defenses and research cannot bypass first-area knowledge', () => {
  const w=startCampaign(true), floor=[{x:w.hearth.x-2,z:w.hearth.z}];
  for(const id of ['training','workshop','library']) {
    assert(!roomQuote(w,id,floor).valid);
    buildRoom(w,id,floor);
    assert(!w.tiles.some(t=>t.room===id));
  }
  for(const type of ['warrior','engineer','runesmith','miner']) assert(!recruitmentStatus(w,type).eligible,type);
  queueCraft(w,'bolt-trap'); queueResearch(w,'stoneguard');
  assert.equal(w.craftOrders.length,0); assert.equal(w.researchOrders!.length,0);
  w.outputs['bolt-trap']=4;
  assert(!defenseQuote(w,'bolt-trap',floor[0]).valid);
  w.researchOrders=[{id:1,spell:'stoneguard',unlocked:true,state:'ready',progress:0}];
  assert.match(castSpell(w,'stoneguard',{kind:'dwarf',id:w.agents[0].id}),/later campaign area/);
  assert.equal(w.researchOrders[0].state,'ready');
  assert(!bridgeQuote(w,[]).valid);
  assert.match(bridgeQuote(w,[]).reason,/Stonebridge plans/);
  const debug=createWorld(campaignStages[0].level);
  queueCraft(debug,'bolt-trap'); queueResearch(debug,'stoneguard');
  assert.equal(debug.craftOrders.length,1); assert.equal(debug.researchOrders!.length,1);
});

test('every relay needs physical victory; travel introduces the authored cumulative catalog', () => {
  let w=startCampaign();
  for(let index=0;index<campaignStages.length;index++) {
    const stage=campaignStages[index];
    assert.equal(w.campaign!.stageId,stage.id);
    assert.deepEqual(w.availability,campaignStartingAvailability(stage.id));
    assert.equal(campaignSummary(w)!.stage,index+1);
    assert.equal(travelOnward(w),undefined);
    w.onwardHearth!.discovered=true; w.onwardHearth!.ready=true; w.outcome='defeat';
    assert.equal(travelOnward(w),undefined);
    complete(w);
    if(index===campaignStages.length-1) {
      assert(campaignSummary(w)!.complete); assert.equal(travelOnward(w),undefined);
      assert.match(campaignSummary(w)!.completion,/journey is complete/);
    } else w=travelOnward(w)!;
  }
  assert(!reach(1).availability!.roles.includes('engineer'));
  assert(reach(1).availability!.roles.includes('warrior'));
  assert(reach(2).availability!.recipes.includes('bolt-trap'));
  assert(reach(3).availability!.spells.includes('stoneguard'));
  assert(!reach(3).availability!.buildings.includes('bridge'));
  assert(reach(4).availability!.buildings.includes('bridge'));
});

test('travel carries completed research, resets local economy and retry restores arrival knowledge', () => {
  const w=reach(3);
  w.researchOrders=[
    {id:1,spell:'dwarf-haste',unlocked:true,state:'ready',progress:20},
    {id:2,spell:'enemy-slow',unlocked:false,state:'working',progress:12},
  ];
  w.allowance=9999; w.outputs['steel-door']=6;
  w.craftOrders=[{id:1,recipe:'steel-door',paid:true,progress:12,state:'working',worker:1}];
  w.agents[0].carrying=42; w.elapsed=550;
  const next=travelOnward(complete(w))!;
  assert.deepEqual(next.campaign!.knownSpells,['dwarf-haste']);
  assert.deepEqual(next.researchOrders!.map(o=>[o.spell,o.unlocked,o.paused,o.progress,o.worker]),[['dwarf-haste',true,true,0,undefined]]);
  assert.equal(goldTotal(next),tuning.startingGold); assert.equal(next.elapsed,0);
  assert(next.agents.every(a=>a.type==='stonehand'&&!a.carrying&&!a.job));
  assert.deepEqual(next.outputs,{}); assert.deepEqual(next.craftOrders,[]);
  assert(!next.tiles.some(t=>t.room));
  next.researchOrders!.push({id:2,spell:'enemy-slow',unlocked:true,state:'ready',progress:0});
  next.availability!.roles.push('miner');
  const retry=restartCampaignArea(next)!;
  assert.deepEqual(retry.researchOrders!.map(o=>o.spell),['dwarf-haste']);
  assert(!retry.availability!.roles.includes('miner'));
  assert.deepEqual(retry.campaign!.completed,campaignStages.slice(0,4).map(s=>s.id));
  assert.deepEqual(startCampaign().campaign!.knownSpells,[]);
});
