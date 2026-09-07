import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settings,settingValues,applySettings} from '../src/content/settings.ts';
import {tuning} from '../src/content/tuning.ts';
import {createWorld} from '../src/game/world.ts';
import {prototypeLevel} from '../src/content/levels.ts';
import {addMiners,designate,tick} from '../src/game/simulation.ts';
import {tileAt} from '../src/game/types.ts';
test('settings validate atomically and drive new-world economy and live mining',()=>{
 const original=settingValues();try{
  const changes={...original,'tuning.startingGold':17,'tuning.mineSeconds':.1,'room.treasure.cost':20};
  assert.equal(applySettings({...changes,'tuning.speed':NaN}).includes('Walking speed'),true);assert.equal(tuning.startingGold,original['tuning.startingGold']);
  assert(applySettings({...changes,'tuning.wallBuildSeconds':1}));assert.equal(applySettings(changes),'');
  const w=createWorld(prototypeLevel);assert.equal(w.allowance,17);assert.equal(w.furnishings[0].capacity,180);
  for(const t of w.tiles){t.known=true;t.terrain='bedrock';t.core=false;}
  Object.assign(tileAt(w,5,5)!,{terrain:'floor',claimed:true});const earth=tileAt(w,6,5)!;earth.terrain='dirt';w.furnishings=[];addMiners(w,1);designate(w,[earth]);
  for(let i=0;i<5;i++)tick(w,.05);assert.equal(earth.terrain,'floor');
  assert(settings.some(s=>s.id==='room.kitchen.stove.capacity'));assert(settings.some(s=>s.id==='recipe.reinforced-door.seconds'));
 }finally{assert.equal(applySettings(original),'');}
});
