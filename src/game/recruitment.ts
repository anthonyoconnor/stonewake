import {type World,type Point,key} from './types.ts';
import {characterDefinitions,characterById} from '../content/characters.ts';
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
  const routes=reachable(w,start),usable=w.roomServices.filter(f=>routes.has(key(f.access)));
  let slots=Infinity;
  for(const service of def.attractionServices){
    const capacity=usable.filter(f=>f.service===service).length;
    if(!capacity)return no(`Needs accessible ${service} capacity.`);
    const residents=w.agents.filter(a=>alive(a)&&characterById(a.type)?.attractionServices.includes(service)).length;
    if(capacity<=residents)return no(`Needs spare ${service} capacity.`);
    slots=Math.min(slots,capacity-residents);
  }
  const population=w.agents.filter(alive).length;
  const beds=usable.filter(f=>f.service==='rest').length-population;
  if(beds<=0)return no('Needs spare bed capacity.');
  const foodSlots=usable.filter(f=>f.service==='dining').length-population;
  if(foodSlots<=0)return no('Needs spare Kitchen food capacity.');
  return {eligible:true,message:'Room and settlement support are available.',capacity:Math.floor(Math.min(slots,beds,foodSlots))};
}
export const attractionStatus=(w:World,type:string)=>recruitmentStatus(w,type).message;
export function enableRecruitment(w:World,enabled=true){
  if(w.outcome)return;
  w.recruitment={enabled,nextAt:w.elapsed+tuning.recruitmentSeconds,cursor:w.recruitment?.cursor??0};
}
export function recruitSpecialist(w:World,spawn:(type:string,origin:Point)=>boolean){
  const state=w.recruitment;if(w.outcome||!state?.enabled||w.elapsed<state.nextAt)return;
  state.nextAt=w.elapsed+tuning.recruitmentSeconds;
  const specialists=characterDefinitions.filter(d=>d.attractionServices.length);
  for(let i=0;i<specialists.length;i++){
    const index=(state.cursor+i)%specialists.length,def=specialists[index];
    if(!recruitmentStatus(w,def.id).eligible)continue;
    const origin=hearthArrival(w);if(origin&&spawn(def.id,origin)){state.cursor=(index+1)%specialists.length;w.revision++;return;}
  }
}
export const livingMiners=(w:World)=>w.agents.filter(a=>a.type==='miner'&&alive(a)).length;
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
