import {type World,type Point,type Defense,type DoorMode,type Enemy,tileAt,key} from './types.ts';
import {defenseById,defenseDirections,raiderDefinition} from '../content/defenses.ts';
import {defenseAt,doorAt,isDoor,doorIsOpen,doorOccupied,passageFrom} from './doors.ts';
import {blocked,findPath,clearLine} from './navigation.ts';

export function defenseQuote(w:World,type:string,p:Point){
  const def=defenseById(type),t=tileAt(w,p.x,p.z);
  const invalid=(reason:string)=>({valid:false,reason,rotation:0});
  if(!def)return invalid('Unknown defense.');
  if(!t?.known||t.terrain!=='floor'||!t.claimed||t.core||t.room||t.wallPlanned||t.loose||defenseAt(w,p)||blocked(w,p)||w.furnishings.some(f=>key(f.access)===key(p)))return invalid('Choose clear, claimed floor outside a room.');
  let rotation=0;
  if(def.kind==='door'){
    const wall=(x:number,z:number)=>{const t=tileAt(w,x,z);return !!t?.known&&t.terrain!=='floor';};
    const floor=(x:number,z:number)=>{const t=tileAt(w,x,z);return !!t?.known&&t.terrain==='floor'&&!t.core&&!t.wallPlanned&&!blocked(w,t,undefined,{walker:'breach'});};
    if(wall(p.x,p.z-1)&&wall(p.x,p.z+1)&&floor(p.x-1,p.z)&&floor(p.x+1,p.z))rotation=0;
    else if(wall(p.x-1,p.z)&&wall(p.x+1,p.z)&&floor(p.x,p.z-1)&&floor(p.x,p.z+1))rotation=1;
    else return invalid('Doors need a one-square passage: walls on two opposite sides and clear approaches on the other two.');
    if(w.agents.some(a=>Math.hypot(a.x-p.x,a.z-p.z)<.9)||w.enemies?.some(e=>e.health>0&&Math.hypot(e.x-p.x,e.z-p.z)<.9))return invalid('Wait for the doorway to clear.');
  }
  if((w.outputs[type]??0)<1)return invalid('No finished item in stock. Queue one in Workshop production.');
  return {valid:true,reason:'Ready to place · uses 1 finished item.',rotation};
}
export function placeDefense(w:World,type:string,p:Point,rotation=0){
  const quote=defenseQuote(w,type,p);if(!quote.valid)return quote.reason;
  const def=defenseById(type)!;
  const d:Defense={id:w.nextDefenseId=(w.nextDefenseId??0)+1,type,x:p.x,z:p.z,rotation:def.kind==='door'?quote.rotation:((rotation%4)+4)%4,mode:'closed',health:def.health??0,maxHealth:def.health??0,openUntil:0,readyAt:0,triggeredAt:-100};
  (w.defenses??=[]).push(d);w.outputs[type]--;
  // Station props are a presentation of stock, not a second inventory.
  const f=w.furnishings.find(f=>f.output===type&&(f.outputCount??0)>0);if(f)f.outputCount!--;
  w.revision++;return `${def.name} placed.`;
}
export function setDoorMode(w:World,id:number,mode:DoorMode){
  const d=w.defenses?.find(d=>d.id===id&&isDoor(d));if(!d)return 'Select a door.';
  d.mode=mode;if(mode!=='closed')d.openUntil=0;
  w.routesChanged=true;w.revision++;
  return `${defenseById(d.type)!.name}: ${mode}.${mode==='locked'&&doorOccupied(w,d)?' Waiting for occupants to step clear.':''}`;
}
export function removeDefense(w:World,id:number){
  const d=w.defenses?.find(d=>d.id===id);if(!d)return 'Select a defense.';
  w.defenses=w.defenses!.filter(o=>o!==d);w.routesChanged=true;w.revision++;
  return 'Defense dismantled · no refund.';
}
export function damageDoor(w:World,d:Defense,damage:number){
  d.health=Math.max(0,d.health-damage);
  if(!d.health){w.defenses=w.defenses!.filter(o=>o!==d);w.routesChanged=true;}
  w.revision++;
}
export function addRaider(w:World,spawn:Point,target:Point){
  if(blocked(w,spawn,undefined,{walker:'enemy'}))return;
  const e:Enemy={id:w.nextEnemyId=(w.nextEnemyId??0)+1,...spawn,target:{...target},health:raiderDefinition.health,facing:0,pinnedUntil:0,nextAttackAt:0,activity:'Approaching',hitAt:-100};
  (w.enemies??=[]).push(e);return e;
}
function hit(w:World,e:Enemy,damage:number){
  e.health=Math.max(0,e.health-damage);e.hitAt=w.elapsed;
  if(!e.health){e.diedAt=w.elapsed;e.activity='Defeated';}
}
function trigger(w:World,d:Defense,e:Enemy){
  const def=defenseById(d.type)!;d.triggeredAt=w.elapsed;d.readyAt=w.elapsed+def.cooldown!;
  hit(w,e,def.damage!);
  if(def.kind==='spike'&&e.health>0){e.pinnedUntil=w.elapsed+def.pinSeconds!;e.activity='Pinned by spikes';}
  if(def.kind==='bolt')d.shotEnd={x:e.x,z:e.z};
}
// Movement is sampled at <= .1 square, so fast movement cannot skip a pressure plate.
function spikeAtEnemy(w:World,e:Enemy){
  for(const d of w.defenses??[])if(defenseById(d.type)?.kind==='spike'&&d.readyAt<=w.elapsed&&Math.abs(e.x-d.x)<=.48&&Math.abs(e.z-d.z)<=.48){trigger(w,d,e);if(!e.health)break;}
}
export function boltTarget(w:World,d:Defense){
  const def=defenseById(d.type),direction=defenseDirections[d.rotation];if(def?.kind!=='bolt')return;
  let distance=def.range!;
  // Sample the centerline; a bolt is not a resident-sized collision capsule.
  for(let step=.5;step<=distance;step+=.1){
    const p={x:Math.round(d.x+direction.x*step),z:Math.round(d.z+direction.z*step)},door=doorAt(w,p);
    if(blocked(w,p,undefined,{walker:'breach'})||door&&!doorIsOpen(w,door)){distance=step-.1;break;}
  }
  return w.enemies?.filter(e=>e.health>0).map(e=>({e,along:(e.x-d.x)*direction.x+(e.z-d.z)*direction.z,across:Math.abs((e.x-d.x)*direction.z-(e.z-d.z)*direction.x)})).filter(t=>t.along>.05&&t.along<=distance&&t.across<=.35).sort((a,b)=>a.along-b.along||a.e.id-b.e.id)[0]?.e;
}
export function tickDefenses(w:World,dt:number){
  for(const d of w.defenses??[])if(defenseById(d.type)?.kind==='bolt'&&d.readyAt<=w.elapsed){const target=boltTarget(w,d);if(target)trigger(w,d,target);}
  for(const e of w.enemies??[]){
    if(e.health<=0)continue;
    spikeAtEnemy(w,e);if(e.health<=0)continue;
    if(e.pinnedUntil>w.elapsed){e.activity='Pinned by spikes';continue;}
    let remaining=raiderDefinition.speed*dt;
    const path=findPath(w,e,e.target,'enemy')??findPath(w,e,e.target,'breach');
    if(!path){e.activity='No route';continue;}
    e.activity='Approaching';
    while(remaining>0&&path.length){
      const p=path[0],dx=p.x-e.x,dz=p.z-e.z,distance=Math.hypot(dx,dz);
      if(distance<.001){path.shift();continue;}
      const step=Math.min(.1,distance,remaining),next={x:e.x+dx/distance*step,z:e.z+dz/distance*step};
      e.facing=Math.atan2(dx,dz);
      if(!clearLine(w,e,next,passageFrom(w,e,'enemy'))){
        const door=w.defenses?.filter(d=>isDoor(d)&&!doorIsOpen(w,d)&&Math.hypot(d.x-e.x,d.z-e.z)<1.2&&(d.x-e.x)*dx+(d.z-e.z)*dz>0).sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];
        e.activity=door?'Breaking down door':'Blocked';
        if(door&&e.nextAttackAt<=w.elapsed){damageDoor(w,door,raiderDefinition.damage);e.nextAttackAt=w.elapsed+raiderDefinition.attackSeconds;}
        break;
      }
      e.x=next.x;e.z=next.z;remaining-=step;spikeAtEnemy(w,e);
      if(!e.health||e.pinnedUntil>w.elapsed)break;
    }
    if(e.health>0&&Math.hypot(e.x-e.target.x,e.z-e.target.z)<.05)e.activity='Reached test target';
  }
}
