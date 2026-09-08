import {type World,type Point,type Defense} from './types.ts';
import {defenseById} from '../content/defenses.ts';
import {tuning} from '../content/tuning.ts';
export const defenseAt=(w:World,p:Point)=>w.defenses?.find(d=>d.x===p.x&&d.z===p.z);
export const isDoor=(d:Defense)=>defenseById(d.type)?.kind==='door';
export const doorAt=(w:World,p:Point)=>w.defenses?.find(d=>isDoor(d)&&d.x===p.x&&d.z===p.z);
export const overlapsDoor=(p:Point,d:Point)=>Math.abs(p.x-d.x)<.5+tuning.radius&&Math.abs(p.z-d.z)<.5+tuning.radius;
export const doorOccupied=(w:World,d:Defense)=>w.agents.some(a=>overlapsDoor(a,d))||!!w.enemies?.some(e=>e.health>0&&overlapsDoor(e,d));
export const doorIsOpen=(w:World,d:Defense)=>d.mode==='open'||doorOccupied(w,d)||(d.mode==='closed'&&d.openUntil>w.elapsed);
export type Walker='dwarf'|'enemy'|'breach'|'enemy-lava'|'breach-lava';
export const isEnemyWalker=(walker?:Walker)=>walker!==undefined&&walker!=='dwarf';
export const isBreachWalker=(walker?:Walker)=>walker==='breach'||walker==='breach-lava';
export interface Passage {walker?:Walker;escape?:number}
export function doorBlocks(w:World,p:Point,passage:Passage={}){
  const d=doorAt(w,p);if(!d||d.id===passage.escape||isBreachWalker(passage.walker))return false;
  return isEnemyWalker(passage.walker)?!doorIsOpen(w,d):d.mode==='locked';
}
export function passageFrom(w:World,p:Point,walker:Walker='dwarf'):Passage {
  return {walker,escape:w.defenses?.find(d=>isDoor(d)&&overlapsDoor(p,d))?.id};
}
export function openDoorsForDwarf(w:World,from:Point,to:Point){
  for(const d of w.defenses??[])if(isDoor(d)&&d.mode==='closed'&&overlapsDoor(to,d)&&!doorBlocks(w,d,passageFrom(w,from)))d.openUntil=w.elapsed+.6;
}
