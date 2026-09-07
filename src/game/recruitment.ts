import {type World,type Point,key} from './types.ts';
import {characterDefinitions,characterById} from '../content/characters.ts';
import {tuning} from '../content/tuning.ts';
import {canStand,reachable} from './navigation.ts';
import {roomTiles} from './rooms.ts';
export function hearthArrival(w:World):Point|undefined{
  const chest=w.furnishings.find(f=>f.id==='hearth-treasury');
  const approaches=chest?[chest.access]:[{x:w.hearth.x,z:w.hearth.z-2},{x:w.hearth.x+2,z:w.hearth.z},{x:w.hearth.x,z:w.hearth.z+2},{x:w.hearth.x-2,z:w.hearth.z}];
  return approaches.find(p=>canStand(w,p));
}
export function recruitmentStatus(w:World,type:string){
  const no=(message:string)=>({eligible:false,message,capacity:0});
  const def=characterById(type);if(!def)return no('Unknown resident type.');
  const start=hearthArrival(w);if(!start)return no('Needs an open Hearth arrival route.');
  const routes=reachable(w,start),usable=w.furnishings.filter(f=>routes.has(key(f.access)));
  let slots=Infinity;
  for(const service of def.attractionServices){
    const capacity=new Set(usable.filter(f=>f.service===service).map(f=>key(f.access))).size;
    if(!capacity)return no(`Needs accessible ${service} capacity.`);
    const residents=w.agents.filter(a=>characterById(a.type)?.attractionServices.includes(service)).length;
    if(capacity<=residents)return no(`Needs spare ${service} capacity.`);
    slots=Math.min(slots,capacity-residents);
  }
  const beds=usable.filter(f=>f.service==='rest').length-w.agents.length;
  if(beds<=0)return no('Needs spare bed capacity.');
  let stockedMeals=0,mealsPerSecond=0;
  const visited=new Set<string>();
  for(const table of usable.filter(f=>f.service==='dining')){
    if(visited.has(key(table)))continue;
    const component=new Set(roomTiles(w,table).map(key));for(const id of component)visited.add(id);
    const facilities=usable.filter(f=>component.has(key(f)));
    const growers=facilities.filter(f=>f.service==='growing'),cookers=facilities.filter(f=>f.service==='cooking');
    const seats=new Set(facilities.filter(f=>f.service==='dining').map(f=>key(f.access))).size;
    const rate=Math.min(growers.length/tuning.growingSeconds,cookers.length/tuning.cookingSeconds,seats/tuning.eatSeconds);
    if(rate<=0)continue;
    mealsPerSecond+=rate;stockedMeals+=cookers.reduce((sum,f)=>sum+f.stored,0);
  }
  // Only complete food chains within the same room can sustain another resident.
  const mealInterval=tuning.hungerInterval*(1-tuning.hungerThreshold);
  const stored=stockedMeals-w.agents.length,foodSlots=Math.floor(mealsPerSecond*mealInterval)-w.agents.length;
  if(stored<=0||foodSlots<=0)return no('Needs spare food and eating capacity.');
  return {eligible:true,message:'Room and settlement support are available.',capacity:Math.floor(Math.min(slots,beds,stored,foodSlots))};
}
export const attractionStatus=(w:World,type:string)=>recruitmentStatus(w,type).message;
export function enableRecruitment(w:World,enabled=true){
  w.recruitment={enabled,nextAt:w.elapsed+tuning.recruitmentSeconds,cursor:w.recruitment?.cursor??0};
}
export function recruitSpecialist(w:World,spawn:(type:string,origin:Point)=>boolean){
  const state=w.recruitment;if(!state?.enabled||w.elapsed<state.nextAt)return;
  state.nextAt=w.elapsed+tuning.recruitmentSeconds;
  const specialists=characterDefinitions.filter(d=>d.attractionServices.length);
  for(let i=0;i<specialists.length;i++){
    const index=(state.cursor+i)%specialists.length,def=specialists[index];
    if(!recruitmentStatus(w,def.id).eligible)continue;
    const origin=hearthArrival(w);if(origin&&spawn(def.id,origin)){state.cursor=(index+1)%specialists.length;w.revision++;return;}
  }
}
