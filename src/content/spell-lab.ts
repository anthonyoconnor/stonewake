import {createWorld} from '../game/world.ts';
import {buildRoom} from '../game/rooms.ts';
import {addResidents} from '../game/simulation.ts';
import {queueResearch,researchDuration} from '../game/research.ts';
import {spellDefinitions} from './spells.ts';
import type {World} from '../game/types.ts';
export function prepareTestSpells(w:World){
  for(const s of spellDefinitions){queueResearch(w,s.id);const o=w.researchOrders!.find(o=>o.spell===s.id)!;o.state='ready';o.unlocked=true;o.progress=researchDuration(o);o.worker=undefined;}
  w.revision++;
}
export function createSpellLab(freeRoomBuilding=false){
  const w=createWorld({id:'spell-lab',name:'Spell Test Yard',width:26,height:24,hearth:{x:4,z:12},openings:[[2,2,23,21]],seams:[{terrain:'rock',cells:Array.from({length:20},(_,i)=>({x:16,z:i+2})).filter(p=>p.z!==12)}]});
  for(const t of w.tiles){t.known=true;t.claimed=t.terrain==='floor';}
  w.allowance=50000;w.freeRoomBuilding=freeRoomBuilding;
  const rect=(x:number,z:number,width:number,depth:number)=>Array.from({length:width*depth},(_,i)=>({x:x+i%width,z:z+Math.floor(i/width)}));
  buildRoom(w,'library',rect(3,3,6,4));buildRoom(w,'dormitory',rect(3,16,6,4));buildRoom(w,'kitchen',rect(3,7,6,4));
  addResidents(w,'warrior',2);addResidents(w,'runesmith');addResidents(w,'miner');
  w.agents.filter(a=>a.type==='warrior').forEach((a,i)=>Object.assign(a,{x:12,z:12+i*2}));
  for(const f of w.furnishings)if(f.service==='cooking')f.stored=8;
  w.spellTest={spawn:{x:18,z:12},target:{x:12,z:12}};prepareTestSpells(w);return w;
}
