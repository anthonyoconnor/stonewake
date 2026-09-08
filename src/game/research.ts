import {type World,type ResearchOrder,type Point,type SpellEffect,tileAt,key} from './types.ts';
import {spellById} from '../content/spells.ts';
import {goldTotal,spendGold} from './rooms.ts';
import {blocked,findPath} from './navigation.ts';
import {defenseAt} from './doors.ts';
import {alive,health,maxHealth,effect,visible,spellLine,damageEnemy} from './spell-effects.ts';
import {recordJob} from './diagnostics.ts';
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
  for(const a of w.agents)if(a.job?.kind==='research'&&a.job.order===order.id){recordJob(w,a,'released','Research paused');a.job=undefined;a.path=[];a.retry=0;}
  w.revision++;
}
export type SpellTarget={kind:'dwarf'|'enemy';id:number}|{kind:'point';point:Point};
export function targetAt(w:World,id:string,p:Point):SpellTarget|undefined {
  const spell=spellById(id);if(!spell)return;
  if(spell.target==='point')return {kind:'point',point:p};
  const units=spell.target==='dwarf'?w.agents.filter(alive):(w.enemies??[]).filter(e=>e.health>0);
  const unit=units.filter(a=>Math.hypot(a.x-p.x,a.z-p.z)<=.8&&visible(w,a)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)||a.id-b.id)[0];
  return unit?{kind:spell.target,id:unit.id}:undefined;
}
export function spellTargetError(w:World,id:string,target?:SpellTarget):string {
  const s=spellById(id);if(!s)return 'Unknown spell.';
  if(!target||target.kind!==s.target)return `Choose a visible ${s.target==='point'?'floor point':s.target}.`;
  const a=target.kind==='dwarf'?w.agents.find(a=>a.id===target.id&&alive(a)):undefined;
  const e=target.kind==='enemy'?w.enemies?.find(e=>e.id===target.id&&e.health>0):undefined;
  const p=target.kind==='point'?target.point:a??e;
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)||!visible(w,p))return 'Target is not currently visible.';
  if(a||e){if(effect(w,(a??e)!,s.effect))return `${s.name} is already active on this target.`;}
  if(s.effect==='mend'&&a&&health(a)>=maxHealth(a))return 'Choose a wounded dwarf.';
  if(target.kind==='point'){
    if(!Number.isInteger(p.x)||!Number.isInteger(p.z)||tileAt(w,p.x,p.z)?.terrain!=='floor')return 'Choose a floor tile.';
    if(s.effect==='thunder'&&!w.enemies?.some(e=>e.health>0&&visible(w,e)&&Math.hypot(e.x-p.x,e.z-p.z)<=s.radius!&&spellLine(w,p,e)))return 'No visible enemy in the blast area.';
    if(s.effect==='barrier'){
      if(w.barrier&&w.barrier.until>w.elapsed)return 'A Runic Barrier is already active.';
      const t=tileAt(w,p.x,p.z)!;
      if(!t.claimed||blocked(w,p)||t.wallPlanned||defenseAt(w,p)||w.roomServices.some(f=>f.id==='hearth-treasury'&&key(f.access)===key(p))||w.agents.some(a=>a.job&&key(a.job.work)===key(p)))return 'Choose clear claimed floor without a fixture or reserved access.';
      if([...w.agents.filter(alive),...(w.enemies??[]).filter(e=>e.health>0)].some(a=>Math.abs(a.x-p.x)<.75&&Math.abs(a.z-p.z)<.75))return 'Wait for the barrier tile to clear.';
    }
    if(s.effect==='rally'){
      if(w.rally&&w.rally.until>w.elapsed)return 'Call to Arms is already active. Dismiss it before moving the rally.';
      if(blocked(w,p)||!w.agents.some(a=>alive(a)&&a.capabilities.includes('fight')&&findPath(w,a,p)))return 'No fighting dwarf can reach this point.';
    }
  }
  return '';
}
export function castSpell(w:World,id:string,target?:SpellTarget){
  const s=spellById(id),order=w.researchOrders?.find(o=>o.spell===id);
  if(!s||order?.state!=='ready')return 'Research and prepare this spell at a Library first.';
  if(goldTotal(w)<s.cost)return 'Not enough stored gold to cast this spell.';
  const error=spellTargetError(w,id,target);if(error)return error;
  const a=target!.kind==='dwarf'?w.agents.find(a=>a.id===(target as {id:number}).id):undefined;
  const e=target!.kind==='enemy'?w.enemies!.find(e=>e.id===(target as {id:number}).id):undefined;
  const p=target!.kind==='point'?target!.point:(a??e)!;
  if(!spendGold(w,s.cost))return 'Not enough stored gold to cast this spell.';
  if(a||e){
    const buff:SpellEffect={id:s.id,kind:s.effect as SpellEffect['kind'],until:w.elapsed+s.duration,strength:s.strength,startedAt:w.elapsed};
    if(a&&(s.effect==='shield'||s.effect==='mend'))buff.remaining=maxHealth(a)*s.strength;
    if(a&&s.effect==='mend'){buff.rate=maxHealth(a)*s.healRate!;buff.pauseSeconds=s.pauseSeconds;}
    ((a??e)!.effects??=[]).push(buff);
  }
  if(s.effect==='thunder')for(const enemy of w.enemies??[])if(enemy.health>0&&visible(w,enemy)&&Math.hypot(enemy.x-p.x,enemy.z-p.z)<=s.radius!&&spellLine(w,p,enemy)){
    damageEnemy(w,enemy,s.strength);if(enemy.health>0)enemy.pinnedUntil=Math.max(enemy.pinnedUntil,w.elapsed+s.stunSeconds!);
  }
  if(s.effect==='barrier'){w.barrier={x:p.x,z:p.z,health:s.strength,maxHealth:s.strength,until:w.elapsed+s.duration};w.routesChanged=true;}
  if(s.effect==='rally')w.rally={x:p.x,z:p.z,until:w.elapsed+s.duration,radius:s.radius!};
  (w.spellBursts??=[]).push({x:p.x,z:p.z,id:s.id,at:w.elapsed,radius:s.radius??.6});
  order.unlocked=true;order.progress=0;order.state='queued';order.paused=false;order.worker=undefined;w.revision++;
  return `${s.name} cast. The Library will prepare it again.`;
}
