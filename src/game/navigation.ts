import {type Point,type World,tileAt,key} from './types.ts';
import {tuning} from '../content/tuning.ts';
import {doorBlocks,passageFrom,type Passage,type Walker} from './doors.ts';
import {barrierAt} from './spell-effects.ts';
export function blocked(w:World,p:Point,extra:Set<string>=new Set(),passage:Passage={}):boolean {
  const t=tileAt(w,p.x,p.z);
  return !t||!t.known||t.terrain!=='floor'||t.core||extra.has(key(p))||doorBlocks(w,p,passage)||(passage.walker!=='breach'&&!!barrierAt(w,p));
}
export function canStand(w:World,p:Point,extra:Set<string>=new Set(),passage:Passage={}) {
  const r=tuning.radius;
  for(const dx of [-r,r])for(const dz of [-r,r])if(blocked(w,{x:Math.round(p.x+dx),z:Math.round(p.z+dz)},extra,passage))return false;
  return true;
}
export function clearLine(w:World,a:Point,b:Point,passage=passageFrom(w,a)) {
  const steps=Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.15);
  for(let i=1;i<=steps;i++)if(!canStand(w,{x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps},undefined,passage))return false;
  return true;
}
export function findPath(w:World,start:Point,end:Point,walker:Walker='dwarf'):Point[]|undefined {
  const passage=passageFrom(w,start,walker),solid=(p:Point)=>blocked(w,p,undefined,passage),line=(a:Point,b:Point)=>clearLine(w,a,b,passage);
  const s={x:Math.round(start.x),z:Math.round(start.z)};
  if(solid(end)||solid(s))return;
  if(s.x===end.x&&s.z===end.z)return [{...end}];
  const queue=[s],visited=new Map<string,Point|undefined>([[key(s),undefined]]);
  let found=false;
  for(let i=0;i<queue.length;i++){
    const p=queue[i];if(p.x===end.x&&p.z===end.z){found=true;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const n={x:p.x+dx,z:p.z+dz};if(visited.has(key(n))||solid(n))continue;
      if(dx&&dz&&(solid({x:p.x+dx,z:p.z})||solid({x:p.x,z:p.z+dz})))continue;
      visited.set(key(n),p);queue.push(n);
    }
  }
  if(!found)return;
  const raw:Point[]=[];let p:Point|undefined=end;
  while(p){raw.unshift(p);p=visited.get(key(p));}
  const result:Point[]=[];let from=start,index=1;
  // Avoidance leaves fractional positions near corners. The first grid edge can
  // be clear from its center while clipping terrain from the actual position.
  if(index<raw.length&&!line(from,raw[index])){
    if(!line(from,s))return;
    result.push(s);from=s;
  }
  while(index<raw.length){let far=index;while(far+1<raw.length&&line(from,raw[far+1]))far++;result.push(raw[far]);from=raw[far];index=far+1;}
  return result;
}
export function reachable(w:World,start:Point,extra:Set<string>=new Set()) {
  const passage=passageFrom(w,start);
  const seen=new Set<string>(),queue=[{x:Math.round(start.x),z:Math.round(start.z)}];
  if(blocked(w,queue[0],extra,passage))return seen;
  seen.add(key(queue[0]));
  for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const p={x:queue[i].x+dx,z:queue[i].z+dz};if(seen.has(key(p))||blocked(w,p,extra,passage))continue;seen.add(key(p));queue.push(p);
  }
  return seen;
}
