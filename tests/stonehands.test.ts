import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab} from '../src/content/room-lab.ts';
import {createMinerWorkLab} from '../src/content/miner-work-lab.ts';
import {startCampaign} from '../src/game/campaign.ts';
import {addResidents,addStonehands,tick} from '../src/game/simulation.ts';
import {castSpell} from '../src/game/research.ts';
import {stonehandPurchaseStatus,purchaseStonehand,recruitmentStatus,hearthArrival} from '../src/game/recruitment.ts';
import {goldTotal,buildRoom} from '../src/game/rooms.ts';
import {assignRoomSupport} from '../src/game/food.ts';
import {moraleAlerts} from '../src/game/morale.ts';
import {payrollStatus} from '../src/game/wages.ts';
import {canTrain,gainExperience} from '../src/game/progression.ts';
import {damageResident} from '../src/game/spell-effects.ts';
import {tickFighter} from '../src/game/combat.ts';
import {tileAt,key} from '../src/game/types.ts';
import {tuning} from '../src/content/tuning.ts';

test('normal starting crew are Stonehands; Miner definition is still spawnable',()=>{
  const w=startCampaign();
  assert.equal(w.agents.length,tuning.startingStonehands);
  assert(w.agents.every(a=>a.type==='stonehand'));
  assert.equal(addResidents(w,'miner'),1);
  assert(w.agents.at(-1)!.capabilities.includes('defend'));
});

test('Hearth creates Stonehands for a fixed price without support or research; failures spend nothing',()=>{
  const w=createRoomLab();
  for(let i=0;i<3;i++){
    assert(stonehandPurchaseStatus(w).eligible);
    const before=goldTotal(w);
    assert.match(castSpell(w,'summon-stonehand'),/assembled/);
    assert.equal(goldTotal(w),before-tuning.stonehandCost);
  }
  assert(w.agents.every(a=>a.type==='stonehand'));
  const before=goldTotal(w);
  assert.equal(purchaseStonehand(w,()=>false).ok,false);
  assert.equal(goldTotal(w),before);
  const approach=tileAt(w,hearthArrival(w)!.x,hearthArrival(w)!.z)!;
  approach.terrain='rock';
  assert.equal(stonehandPurchaseStatus(w).eligible,false);
  assert.doesNotMatch(castSpell(w,'summon-stonehand'),/assembled/);
  assert.equal(goldTotal(w),before);
  const poor=createRoomLab();poor.allowance=0;
  assert.equal(stonehandPurchaseStatus(poor).eligible,false);
  assert.equal(poor.agents.length,0);
});

test('constructs never occupy living support, collect pay, train or leave from unmet needs',()=>{
  const w=createRoomLab();addStonehands(w,3);
  buildRoom(w,'dormitory',[{x:8,z:8}]);buildRoom(w,'kitchen',[{x:8,z:9}]);buildRoom(w,'training',[{x:8,z:10}]);
  assignRoomSupport(w);
  assert(w.roomServices.every(s=>s.assigned===undefined));
  assert.equal(recruitmentStatus(w,'warrior').capacity,1,'Constructs leave the only bed and meal for a dwarf');
  const a=w.agents[0];a.energy=0;a.hunger=0;
  gainExperience(w,a,10000,'combat');assert.equal(a.experience,0);assert.equal(canTrain(w,a),false);
  // Cross several paydays and the full departure threshold with no support.
  w.roomServices=w.roomServices.filter(s=>!['rest','dining','training'].includes(s.service));
  const horizon=Math.max(tuning.moraleGraceSeconds+tuning.moraleDepartureSeconds,tuning.paydaySeconds*3)+5;
  for(let i=0;i<horizon;i++)tick(w,1);
  assert.equal(w.agents.length,3);
  assert(w.agents.every(a=>a.energy===1&&a.hunger===1&&a.meals===0&&a.rested===0&&!a.pay?.due.length));
  assert.equal(payrollStatus(w).due,0);assert.deepEqual(moraleAlerts(w),[]);
  assert(w.agents.every(a=>!a.morale?.leaving&&a.level===1));
});

test('three Stonehands keep resource coverage while completing excavation and walls without duplicate jobs',()=>{
  const w=createMinerWorkLab(false,'stonehand');
  let covered=0,interrupted=0;
  for(let i=0;i<1200;i++){
    const before=w.agents.map(a=>({id:a.id,job:a.job&&{...a.job}}));
    tick(w,.05);
    if(w.agents.some(a=>a.workAssignment?.group==='resource'))covered++;
    const jobs=w.agents.filter(a=>a.job?.kind==='mine').map(a=>key(a.job!.target));
    assert.equal(new Set(jobs).size,jobs.length);
    for(const {id,job} of before){
      if(!job)continue;
      const current=w.agents.find(a=>a.id===id)?.job;
      if(current?.kind===job.kind&&key(current.target)===key(job.target))continue;
      const t=tileAt(w,job.target.x,job.target.z)!;
      if((job.kind==='buildWall'&&t.wallPlanned)||(job.kind==='mine'&&['dirt','rock'].includes(t.terrain)&&t.designated))interrupted++;
    }
  }
  assert(covered>1080);assert.equal(interrupted,0);
  assert.equal(w.tiles.filter(t=>t.x===9&&t.z>=3&&t.z<=10&&t.terrain==='floor').length,8);
  assert([11,12].every(x=>tileAt(w,x,13)!.reinforced));
  assert(w.roomServices.some(s=>s.stored>0));
});

test('a fragile Stonehand cannot fight and destruction drops its cargo and releases its job',()=>{
  const w=createMinerWorkLab(false,'stonehand');tick(w,.05);
  const a=w.agents[0];assert.equal(a.maxHealth,30);
  assert.equal(tickFighter(w,a,.05,()=>{throw Error('Released to fight');},()=>false),false);
  a.carrying=45;const t=tileAt(w,Math.round(a.x),Math.round(a.z))!,loose=t.loose;
  damageResident(w,a,30);tick(w,.05);
  assert(!w.agents.includes(a));assert.equal(t.loose,loose+45);assert.equal(a.job,undefined);
});
