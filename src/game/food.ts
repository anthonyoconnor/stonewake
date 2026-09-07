import {tuning} from '../content/tuning.ts';
import {type World,type Furnishing,key} from './types.ts';
import {roomStats,roomTiles} from './rooms.ts';
export function foodFacilities(w:World,table:Furnishing){
  return roomStats(w,table).usable;
}
// Simple on-site production: no dedicated Cook or extra hauling chain.
export function produceFood(w:World,seconds:number){
  const visited=new Set<string>();
  for(const t of w.tiles){
    if(t.room!=='kitchen'||visited.has(key(t)))continue;
    for(const p of roomTiles(w,t))visited.add(key(p));
    const facilities=roomStats(w,t).usable;
    const growers=facilities.filter(f=>f.service==='growing');
    for(const f of facilities){
      if(!['growing','cooking','brewing'].includes(f.service))continue;
      const duration=f.service==='growing'?tuning.growingSeconds:f.service==='cooking'?tuning.cookingSeconds:tuning.brewingSeconds;
      f.progress=Math.min(duration,(f.progress??0)+seconds);
      if(f.progress<duration||f.stored>=f.capacity)continue;
      if(f.service==='cooking'){
        const raw=growers.find(g=>g.stored>0);if(!raw)continue;raw.stored--;
      }
      f.stored++;f.progress=0;w.revision++;
    }
  }
}
