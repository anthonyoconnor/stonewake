import {type World,type ResearchOrder} from './types.ts';
import {spellById} from '../content/spells.ts';
import {tuning} from '../content/tuning.ts';
import {goldTotal,spendGold} from './rooms.ts';
import {reveal} from './world.ts';
export const researchDuration=(order:ResearchOrder)=>{const spell=spellById(order.spell);return (order.unlocked?spell?.prepareSeconds:spell?.researchSeconds)??Infinity;};
export function queueResearch(w:World,spell:string){
  if(!spellById(spell))return;
  w.researchOrders??=[];const existing=w.researchOrders.find(o=>o.spell===spell);
  if(existing){existing.paused=false;w.revision++;return;}
  w.researchOrders.push({id:Math.max(0,...w.researchOrders.map(o=>o.id))+1,spell,state:'queued',progress:0,unlocked:false});w.revision++;
}
// Pausing keeps earned progress and immediately returns the researcher to other work.
export function cancelResearch(w:World,spell:string){
  const order=w.researchOrders?.find(o=>o.spell===spell);if(!order||order.state==='ready')return;
  order.paused=true;order.state='queued';order.worker=undefined;
  for(const a of w.agents)if(a.job?.kind==='research'&&a.job.order===order.id){a.job=undefined;a.path=[];a.retry=0;}
  w.revision++;
}
export function castSpell(w:World,id:string){
  const spell=spellById(id),order=w.researchOrders?.find(o=>o.spell===id);
  if(!spell||order?.state!=='ready')return 'Research and prepare this spell at a Library first.';
  if(goldTotal(w)<spell.cost)return 'Not enough stored gold to cast this spell.';
  if(spell.effect==='haste'&&(w.hasteUntil??0)>w.elapsed)return 'Hearth Haste is already active.';
  let preview:World|undefined;
  if(spell.effect==='prospect'){
    preview={...w,tiles:w.tiles.map(t=>({...t}))};reveal(preview,w.hearth,tuning.prospectRadius);
    if(!preview.tiles.some((t,i)=>t.known&&!w.tiles[i].known))return 'No new terrain is visible from the Hearth. Open more passages before casting.';
  }
  if(!spendGold(w,spell.cost))return 'Not enough stored gold to cast this spell.';
  if(preview)for(let i=0;i<w.tiles.length;i++){w.tiles[i].known=preview.tiles[i].known;w.tiles[i].designated=preview.tiles[i].designated;}
  if(spell.effect==='haste')w.hasteUntil=w.elapsed+tuning.hasteSeconds;
  order.unlocked=true;order.progress=0;order.state='queued';order.paused=false;order.worker=undefined;w.revision++;
  return `${spell.name} cast. The Library will prepare it again.`;
}
