import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startFreePlay } from '../src/game/session.ts';
import { campaignStage } from '../src/content/campaign.ts';
import { approachCells, settlementPlan } from '../src/content/campaign-levels.ts';
import { designate, tick } from '../src/game/simulation.ts';
import { buildRoom, roomQuote, goldTotal } from '../src/game/rooms.ts';
import { bridgeQuote, planBridges } from '../src/game/bridges.ts';
import { alive } from '../src/game/spell-effects.ts';
import { key, tileAt, type Point } from '../src/game/types.ts';

test('ordinary volcanic pressure follows lava, repeats with recovery, and ends after paid bridge claiming',()=>{
  const w=startFreePlay('campaign-royal-deep'),stage=campaignStage('royal-deep')!,plan=settlementPlan(stage.level);
  const source=w.encounters!.find(e=>e.definition.id==='royal-raids')!;
  assert.equal(w.freeRoomBuilding,false);
  assert.equal(tileAt(w,source.definition.positions[0].x,source.definition.positions[0].z)!.terrain,'lava');
  designate(w,plan.development);designate(w,plan.gold);
  let opened=false,suppressionStarted=false,clearedAt=0,firstAttackAt=0;
  const seenPhases=new Set<string>(),warnings=new Set<number>(),waveTimes=new Map<number,number>();
  const defendRooms:Array<[string,Point[]]>=[['treasure',plan.treasure],['dormitory',plan.dormitory],['kitchen',plan.kitchen],['training',plan.training]];
  for(let second=0;second<1800&&!w.outcome;second++) {
    for(const [room,cells] of defendRooms){const q=roomQuote(w,room,cells);if(q.valid)buildRoom(w,room,q.tiles);}
    const warriors=w.agents.filter(a=>alive(a)&&a.type==='warrior'&&(a.level??1)>=2);
    if(!opened&&warriors.length>=2) {
      designate(w,approachCells([{x:10,z:24},{x:10,z:11},{x:19,z:11}]));
      opened=true;
    }
    seenPhases.add(source.phase);
    if(source.warnedAt!==undefined)warnings.add(source.warnedAt);
    if(source.waves&&!waveTimes.has(source.waves))waveTimes.set(source.waves,w.elapsed);
    if((w.enemies??[]).some(e=>e.sourceId==='royal-raids'&&e.health>0&&e.x<20))firstAttackAt ||= w.elapsed;
    if(source.waves>=2&&source.phase==='cooldown'&&!suppressionStarted) {
      // Reaching this source is a deliberate new construction choice, not automatic land claiming.
      assert(!tileAt(w,21,16)!.claimed);
      designate(w,approachCells([{x:19,z:11},{x:19,z:16}]));
      suppressionStarted=true;
    }
    if(suppressionStarted) {
      const bridge=[{x:20,z:16},{x:21,z:16}],q=bridgeQuote(w,bridge);
      if(q.valid)planBridges(w,q.tiles);
    }
    for(let step=0;step<20;step++)tick(w,.05);
    if(source.phase==='cleared') {
      clearedAt ||= w.elapsed;
      if(w.elapsed-clearedAt>source.definition.repeatSeconds!+source.definition.warningSeconds+5)break;
    }
  }
  const report={seconds:Math.round(w.elapsed),waves:source.waves,phase:source.phase,warnings:[...warnings],waveTimes:[...waveTimes],firstAttackAt,clearedAt,gold:goldTotal(w),core:w.hearthState!.health,population:w.agents.filter(alive).length,bridges:w.tiles.filter(t=>t.bridge).map(key)};
  assert.equal(w.outcome,undefined,JSON.stringify(report));
  assert(opened&&firstAttackAt>0,'Natural Cinderlings must physically cross the lava and enter the defended west bank');
  assert(source.waves>=2&&warnings.size>=2&&seenPhases.has('cooldown'),JSON.stringify(report));
  assert(waveTimes.get(1)!>=source.definition.delay+source.definition.warningSeconds);
  assert(waveTimes.get(2)!-waveTimes.get(1)!>=source.definition.repeatSeconds!+source.definition.warningSeconds);
  assert.equal(source.phase,'cleared',JSON.stringify(report));
  assert(w.tiles.some(t=>t.bridge&&t.claimed&&t.bridgePaid!>0&&key(t)==='21,16'),'Ordinary paid bridge completion claims the source');
  assert.equal(source.waves,2,'Claiming the source prevents a third wave after another full recovery and warning');
  assert(w.elapsed-clearedAt>source.definition.repeatSeconds!+source.definition.warningSeconds,'Observe a full suppressed recurrence window');
  assert(w.hearthState!.health>0&&goldTotal(w)>=0);
  console.log(JSON.stringify(report));
});
