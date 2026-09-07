import {type World,key} from './types.ts';
import {recipeById} from '../content/recipes.ts';
import {characterById} from '../content/characters.ts';
import {reachable} from './navigation.ts';
export function queueCraft(w:World,recipe:string){
  if(!recipeById(recipe))return;
  w.craftOrders.push({id:w.craftOrders.length+1,recipe,state:'queued',progress:0,paid:false});
}
export function attractionStatus(w:World,type:string){
  const def=characterById(type);if(!def)return 'Unknown resident type.';
  const start=w.agents[0]??w.tiles.find(t=>t.claimed&&!t.core&&t.terrain==='floor');
  const routes=start?reachable(w,start):new Set<string>(),usable=w.furnishings.filter(f=>routes.has(key(f.access)));
  if(def.attractionServices.some(s=>!usable.some(f=>f.service===s)))return 'Needs accessible craft capacity.';
  if(usable.filter(f=>f.service==='rest').length<=w.agents.length)return 'Needs spare bed capacity.';
  if(!usable.some(f=>f.service==='dining')||usable.filter(f=>f.service==='cooking').reduce((sum,f)=>sum+f.stored,0)<=w.agents.length)return 'Needs spare food and eating capacity.';
  return 'Room and settlement support are available.';
}
