import {type World,type Point,key} from './types.ts';
import {characterDefinitions,characterById,isConstruct,isAnimal} from '../content/characters.ts';
import {tuning} from '../content/tuning.ts';
import {canStand,reachable} from './navigation.ts';
import {alive} from './spell-effects.ts';
import {goldTotal,spendGold} from './rooms.ts';
export function hearthArrival(w:World):Point|undefined{
  const chest=w.roomServices.find(f=>f.id==='hearth-treasury');
  const approaches=chest?[chest.access]:[{x:w.hearth.x,z:w.hearth.z-2},{x:w.hearth.x+2,z:w.hearth.z},{x:w.hearth.x,z:w.hearth.z+2},{x:w.hearth.x-2,z:w.hearth.z}];
  return approaches.find(p=>canStand(w,p));
}
export function recruitmentStatus(w:World,type:string){
  const no=(message:string)=>({eligible:false,message,capacity:0});
  if(w.outcome)return no('The level has ended.');
  const def=characterById(type);if(!def)return no('Unknown resident type.');
  const start=hearthArrival(w);if(!start)return no('Needs an open Hearth arrival route.');
  if(def.construct)return {eligible:true,message:'Hearth arrival route is available.',capacity:Infinity};
  const routes=reachable(w,start),usable=w.roomServices.filter(f=>routes.has(key(f.access)));
  const population=w.agents.filter(a=>alive(a)&&!isConstruct(a.type)).length;
  const bedCapacity=usable.filter(f=>f.service==='rest').length;
  const beds=bedCapacity-population;
  if(def.animal){
    const limit=animalLimit(bedCapacity),animals=w.agents.filter(a=>alive(a)&&isAnimal(a.type)).length;
    if(!bedCapacity||beds<=0)return no('Needs a spare reachable Dormitory place.');
    if(animals>=limit)return no(`Companion limit ${animals}/${limit}. More Dormitory capacity supports dwarfs; animal cap ${tuning.animalPopulationCap}.`);
    return {eligible:true,message:`Companions ${animals}/${limit}. One Dormitory place supplies food and rest; no wages or training.`,capacity:Math.min(beds,limit-animals)};
  }
  let slots=Infinity;
  for(const service of def.attractionServices){
    const capacity=usable.filter(f=>f.service===service).length;
    if(!capacity)return no(`Needs accessible ${service} capacity.`);
    const residents=w.agents.filter(a=>alive(a)&&characterById(a.type)?.attractionServices.includes(service)).length;
    if(capacity<=residents)return no(`Needs spare ${service} capacity.`);
    slots=Math.min(slots,capacity-residents);
  }
  if(beds<=0)return no('Needs spare bed capacity.');
  const foodSlots=usable.filter(f=>f.service==='dining').length-w.agents.filter(a=>alive(a)&&!isConstruct(a.type)&&!isAnimal(a.type)).length;
  if(foodSlots<=0)return no('Needs spare Kitchen food capacity.');
  return {eligible:true,message:'Room and settlement support are available.',capacity:Math.floor(Math.min(slots,beds,foodSlots))};
}
export const attractionStatus=(w:World,type:string)=>recruitmentStatus(w,type).message;
// A single shared quota prevents adding another animal species from multiplying arrivals.
export const animalLimit=(beds:number)=>beds<1?0:Math.min(tuning.animalPopulationCap,Math.max(1,Math.floor(beds/tuning.bedsPerAnimal)));
export function enableRecruitment(w:World,enabled=true){
  if(w.outcome)return;
  w.recruitment={enabled,nextAt:w.elapsed+tuning.recruitmentSeconds,cursor:w.recruitment?.cursor??0,companionIntroduced:w.recruitment?.companionIntroduced};
}
export function recruitSpecialist(w:World,spawn:(type:string,origin:Point)=>boolean){
  const state=w.recruitment;if(w.outcome||!state?.enabled||w.elapsed<state.nextAt)return;
  state.nextAt=w.elapsed+tuning.recruitmentSeconds;
  const candidates=characterDefinitions.filter(d=>d.attractionServices.length||d.animal);
  const animals=w.agents.filter(a=>alive(a)&&isAnimal(a.type)).length;
  const ranked=candidates.map((def,index)=>({def,index,count:w.agents.filter(a=>alive(a)&&a.type===def.id).length})).sort((a,b)=>{
    const priority=(entry:typeof a)=>entry.def.animal?(animals===0&&!state.companionIntroduced?-1:1):0;
    return priority(a)-priority(b) || a.count/(a.def.recruitmentWeight??1)-b.count/(b.def.recruitmentWeight??1) || (a.index-state.cursor+candidates.length)%candidates.length-(b.index-state.cursor+candidates.length)%candidates.length;
  });
  for(const {def,index} of ranked){
    if(!recruitmentStatus(w,def.id).eligible)continue;
    const origin=hearthArrival(w);if(origin&&spawn(def.id,origin)){if(def.animal)state.companionIntroduced=true;state.cursor=(index+1)%candidates.length;w.revision++;return;}
  }
}
export const livingMiners=(w:World)=>w.agents.filter(a=>a.type==='miner'&&alive(a)).length;
export function stonehandPurchaseStatus(w:World){
  const result={...recruitmentStatus(w,'stonehand'),price:tuning.stonehandCost,stonehands:w.agents.filter(a=>a.type==='stonehand'&&alive(a)).length};
  if(!result.eligible)return result;
  const routes=reachable(w,hearthArrival(w)!);
  if(!w.tiles.some(t=>t.claimed&&canStand(w,t)&&routes.has(key(t))&&!w.agents.some(a=>Math.hypot(a.x-t.x,a.z-t.z)<.6)))
    return {...result,eligible:false,message:'Needs a free arrival square beside the Hearth.'};
  if(goldTotal(w)<result.price)return {...result,eligible:false,message:`Needs ${result.price} gold to create a Stonehand.`};
  return {...result,message:'Ready at the Hearth. No food, beds or wages.'};
}
export function purchaseStonehand(w:World,spawn:(type:string,origin:Point)=>boolean){
  const status=stonehandPurchaseStatus(w);
  if(!status.eligible)return {ok:false,message:status.message,price:status.price};
  if(!spawn('stonehand',hearthArrival(w)!))return {ok:false,message:'No free Stonehand arrival square.',price:status.price};
  spendGold(w,status.price);w.revision++;
  return {ok:true,message:`Stonehand assembled for ${status.price} gold.`,price:status.price};
}
export const minerPrice=(w:World)=>tuning.minerMinimumCost+tuning.minerCostStep*livingMiners(w);
export function minerPurchaseStatus(w:World){
  const status=recruitmentStatus(w,'miner'),price=minerPrice(w),miners=livingMiners(w);
  const result={...status,price,miners};
  if(!status.eligible)return result;
  const start=hearthArrival(w)!;
  const routes=reachable(w,start);
  if(!w.tiles.some(t=>t.claimed&&canStand(w,t)&&routes.has(key(t))&&!w.agents.some(a=>Math.hypot(a.x-t.x,a.z-t.z)<.6)))
    return {...result,eligible:false,message:'Needs a free arrival square beside the Hearth.'};
  if(goldTotal(w)<price)return {...result,eligible:false,message:`Needs ${price} gold to recruit a Miner.`};
  return {...result,message:'Spare beds, Kitchen support and an arrival route are available.'};
}
// The callback is the normal synchronous addResidents service; a failed arrival is never charged.
export function purchaseMiner(w:World,spawn:(type:string,origin:Point)=>boolean){
  const status=minerPurchaseStatus(w);
  if(!status.eligible)return {ok:false,message:status.message,price:status.price};
  const origin=hearthArrival(w)!;
  if(!spawn('miner',origin))return {ok:false,message:'No free Miner arrival square.',price:status.price};
  spendGold(w,status.price);
  w.revision++;
  return {ok:true,message:`Miner recruited for ${status.price} gold.`,price:status.price};
}
