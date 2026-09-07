import {createWorld} from '../game/world.ts';
import {buildRoom} from '../game/rooms.ts';
import {addResidents} from '../game/simulation.ts';
import {placeDefense} from '../game/defenses.ts';
import {defenseDefinitions} from './defenses.ts';
import {queueCraft} from '../game/crafting.ts';
export function createDefenseLab(freeRoomBuilding=false){
  const w=createWorld({id:'defense-lab',name:'Defense Test Yard',width:32,height:24,hearth:{x:4,z:12},openings:[[2,2,9,21],[10,11,29,13]],seams:[{terrain:'rock',cells:[{x:16,z:11},{x:16,z:13}]}]});
  for(const t of w.tiles){t.known=true;t.claimed=t.terrain==='floor';}
  w.allowance=50000;
  w.freeRoomBuilding=freeRoomBuilding;
  const rect=(x:number,z:number,width:number,depth:number)=>Array.from({length:width*depth},(_,i)=>({x:x+i%width,z:z+Math.floor(i/width)}));
  buildRoom(w,'workshop',rect(3,3,6,5));buildRoom(w,'dormitory',rect(3,16,6,5));buildRoom(w,'kitchen',rect(3,8,6,3));
  addResidents(w,'engineer');
  for(const def of defenseDefinitions)w.outputs[def.id]=2;
  placeDefense(w,'timber-door',{x:16,z:12});placeDefense(w,'bolt-trap',{x:19,z:12},0);placeDefense(w,'spike-trap',{x:22,z:12});
  queueCraft(w,'reinforced-door');
  w.defenseTest={spawn:{x:29,z:12},target:{x:10,z:12}};
  return w;
}
