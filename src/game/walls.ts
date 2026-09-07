import {type World,type Point,type Tile,tileAt,key} from './types.ts';
import {blocked} from './navigation.ts';
import {tuning} from '../content/tuning.ts';
export function wallEligible(w:World,t:Tile|undefined):t is Tile {
 return !!t&&t.known&&t.terrain==='floor'&&t.claimed&&!t.core&&!t.room&&!t.loose&&!blocked(w,t)&&!w.furnishings.some(f=>key(f.access)===key(t));
}
export const wallBuildDuration=()=>Math.max(tuning.wallBuildSeconds,Math.max(tuning.mineSeconds,tuning.rockSeconds)+tuning.reinforceSeconds+1);
export function planWalls(w:World,points:Point[],add=true){
 let count=0;
 for(const p of new Map(points.map(p=>[key(p),p])).values()){
  const t=tileAt(w,p.x,p.z);if(!t?.known)continue;
  if(add&&wallEligible(w,t)&&!t.wallPlanned){t.wallPlanned=true;t.wallProgress=0;count++;}
  else if(!add&&t.wallPlanned){t.wallPlanned=false;t.wallProgress=0;count++;}
 }
 w.revision++;return `${count} wall plans ${add?'added':'removed'}.`;
}
