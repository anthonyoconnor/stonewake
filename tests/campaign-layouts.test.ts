import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaignStages,campaignStartingAvailability} from '../src/content/campaign.ts';
import {campaignApproaches,approachCells,settlementPlan} from '../src/content/campaign-levels.ts';
import {createWorld} from '../src/game/world.ts';
import {reachable} from '../src/game/navigation.ts';
import {tileAt,key,neighbors} from '../src/game/types.ts';
import {roomById} from '../src/content/rooms.ts';
import {enemyDefinitions} from '../src/content/enemies.ts';
import {tuning} from '../src/content/tuning.ts';

test('authored maps start concealed, sustain finite-gold settlements and gradually reuse every specialist',()=>{
  const species=new Set<string>();
  for(const [index,stage] of campaignStages.entries()) {
    const w=createWorld(stage.level),plans=campaignStartingAvailability(stage.id),settlement=settlementPlan(stage.level);
    assert(!w.onwardHearth!.discovered,stage.id);
    assert(w.enemies!.every(e=>!tileAt(w,Math.round(e.x),Math.round(e.z))!.known),`${stage.id}: concealed inhabitants`);
    assert.equal(w.tiles.filter(t=>t.terrain==='gem').length,index<3?0:1,`${stage.id}: deliberate gem scarcity`);
    assert(w.tiles.filter(t=>t.terrain==='gem').every(t=>Math.hypot(t.x-w.hearth.x,t.z-w.hearth.z)>20));
    const settlementCost=Object.entries(settlement).filter(([id])=>plans.buildings.includes(id)).reduce((sum,[id,cells])=>sum+cells.length*roomById(id)!.cost,0);
    const startingIncome=settlement.gold.reduce((sum,p)=>sum+(tileAt(w,p.x,p.z)!.gold),tuning.startingGold);
    assert(startingIncome>settlementCost+500,`${stage.id}: finite opening funds rooms and several paydays`);
    for(const [room,cells] of Object.entries(settlement).filter(([id])=>plans.buildings.includes(id)))
      assert(cells.every(p=>{const t=tileAt(w,p.x,p.z)!;return !t.core&&!t.onward&&!t.ruin&&['floor','dirt','rock','gold'].includes(t.terrain);}),`${stage.id}: ${room} development space`);
    assert(w.tiles.some(t=>t.ruin),`${stage.id}: authored lost site`);
    assert(stage.level.encounters!.some(e=>e.pressure==='raid'&&e.repeatSeconds&&e.clear==='claim'),`${stage.id}: suppressible recurring pressure`);
    for(const e of stage.level.encounters!)for(const id of e.roster??[])species.add(id);
  }
  assert.deepEqual([...species].sort(),enemyDefinitions.map(e=>e.id).sort());
});

test('intended and alternate excavation spines reach every relay using only that arrival’s tools',()=>{
  for(const stage of campaignStages)for(const variant of ['intended','alternate'] as const) {
    const w=createWorld(stage.level),plans=campaignStartingAvailability(stage.id),approach=campaignApproaches[stage.id];
    const origin={x:w.hearth.x-2,z:w.hearth.z};
    assert(!neighbors(w,w.onwardHearth!).some(p=>reachable(w,origin).has(key(p))),`${stage.id}: objective initially inaccessible`);
    // Structural validation only. The separate playthrough checks execute paid player actions.
    const cells=[...settlementPlan(stage.level).development,...approachCells(approach[variant])];
    for(const p of cells) {
      const t=tileAt(w,p.x,p.z)!;
      t.known=true;
      assert(t&&!['bedrock','gem','chasm','water'].includes(t.terrain),`${stage.id}/${variant}: unavailable obstacle at ${key(p)}`);
      if(t.terrain==='lava') {assert(plans.buildings.includes('bridge'));t.bridge=true;}
      else if(!t.core)t.terrain='floor';
    }
    const routes=reachable(w,origin);
    assert(neighbors(w,w.onwardHearth!).some(p=>routes.has(key(p))),`${stage.id}/${variant}: physical relay approach`);
    if(stage.id==='royal-deep') {
      assert(w.tiles.some(t=>t.bridge),`${variant}: lava crossing is required`);
      for(const t of w.tiles)t.bridge=false;
      const noBridge=reachable(w,origin);
      assert(!neighbors(w,w.onwardHearth!).some(p=>noBridge.has(key(p))),`${variant}: no land bypass`);
    }
  }
});
