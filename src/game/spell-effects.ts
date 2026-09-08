import {type World,type Point,type Resident,type Enemy,tileAt} from './types.ts';
import {doorAt,doorIsOpen} from './doors.ts';
import {tuning} from '../content/tuning.ts';
import {characterLevel} from '../content/characters.ts';
export const alive=(a:Resident)=>health(a)>0;
export const maxHealth=(a:Resident)=>a.maxHealth??characterLevel(a.type,a.level).health;
export const health=(a:Resident)=>a.health??maxHealth(a);
export const effect=(w:World,a:Resident|Enemy,kind:string)=>a.effects?.find(e=>e.kind===kind&&e.until>w.elapsed);
export const hasteRate=(w:World,a:Resident)=>1+(effect(w,a,'haste')?.strength??0);
export const slowRate=(w:World,a:Enemy)=>1-(effect(w,a,'slow')?.strength??0);
export const barrierAt=(w:World,p:Point)=>w.barrier&&w.barrier.health>0&&w.barrier.until>w.elapsed&&w.barrier.x===p.x&&w.barrier.z===p.z?w.barrier:undefined;
// Sight rays ignore furnishings but stop at terrain, shut doors and spell barriers.
export function spellLine(w:World,from:Point,to:Point){
  const steps=Math.max(1,Math.ceil(Math.hypot(from.x-to.x,from.z-to.z)/.1));
  for(let i=1;i<=steps;i++){
    const p={x:Math.round(from.x+(to.x-from.x)*i/steps),z:Math.round(from.z+(to.z-from.z)*i/steps)},t=tileAt(w,p.x,p.z),door=doorAt(w,p);
    if(!t||t.terrain!=='floor'||door&&!doorIsOpen(w,door)||barrierAt(w,p))return false;
  }
  return true;
}
export function visible(w:World,p:Point){
  if(!tileAt(w,Math.round(p.x),Math.round(p.z))?.known)return false;
  return [w.hearth,...w.agents.filter(alive)].some(a=>Math.hypot(a.x-p.x,a.z-p.z)<=tuning.sightRadius&&spellLine(w,a,p));
}
export function damageEnemy(w:World,e:Enemy,amount:number,source:'dwarf'|'spell'|'trap'='spell'){
  if(e.health<=0)return;
  e.health=Math.max(0,e.health-amount*(source==='dwarf'?1+(effect(w,e,'reckoning')?.strength??0):1));e.hitAt=w.elapsed;
  if(!e.health){e.diedAt=w.elapsed;e.activity='Defeated';e.effects=[];}w.revision++;
}
export function damageResident(w:World,a:Resident,amount:number){
  if(!alive(a))return;
  a.hitAt=w.elapsed;const shield=effect(w,a,'shield');
  if(shield){const absorbed=Math.min(amount,shield.remaining??0);shield.remaining!-=absorbed;amount-=absorbed;if(!shield.remaining)shield.until=w.elapsed;}
  a.health=Math.max(0,health(a)-amount);w.revision++;
}
export function damageBarrier(w:World,amount:number){
  if(!w.barrier)return;w.barrier.health=Math.max(0,w.barrier.health-amount);
  if(!w.barrier.health){w.barrier=undefined;w.routesChanged=true;}w.revision++;
}
export function dismissRally(w:World){if(w.outcome)return;w.rally=undefined;for(const a of w.agents)if(a.rallying){a.path=[];a.rallying=false;a.rallyUnreachable=false;a.retry=0;}w.revision++;}
export function tickSpellEffects(w:World,dt:number){
  if(w.barrier&&w.barrier.until<=w.elapsed){w.barrier=undefined;w.routesChanged=true;w.revision++;}
  if(w.rally&&w.rally.until<=w.elapsed)dismissRally(w);
  for(const a of w.agents){
    const mend=a.effects?.find(e=>e.kind==='mend');
    if(mend&&alive(a)){
      const start=Math.max(w.elapsed-dt,mend.startedAt,(a.hitAt??-Infinity)+(mend.pauseSeconds??3));
      const time=Math.max(0,Math.min(w.elapsed,mend.until)-start);
      const amount=Math.min(time*(mend.rate??0),mend.remaining??0,maxHealth(a)-health(a));
      a.health=health(a)+amount;mend.remaining!-=amount;
      if(health(a)>=maxHealth(a)||!mend.remaining)mend.until=w.elapsed;
    }
    a.effects=alive(a)?a.effects?.filter(e=>e.until>w.elapsed):[];
  }
  for(const e of w.enemies??[])e.effects=e.effects?.filter(s=>s.until>w.elapsed);
  w.spellBursts=w.spellBursts?.filter(b=>w.elapsed-b.at<.7);
}
