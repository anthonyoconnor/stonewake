import {type World,type Resident,type Job,type Point,tileAt,neighbors,key} from './types.ts';
import {canStand,findPath} from './navigation.ts';
import {reveal} from './world.ts';
import {tuning} from '../content/tuning.ts';
import {foodFacilities,produceFood} from './food.ts';
import {characterById} from '../content/characters.ts';
import {recipeById} from '../content/recipes.ts';
import {spendGold,goldTotal} from './rooms.ts';
export const addMiners=(w:World,count=tuning.startingMiners)=>addResidents(w,'miner',count);
export function addResidents(w:World,type:string,count=1) {
  const def=characterById(type);if(!def)return;
  const positions=w.tiles.filter(t=>t.claimed&&canStand(w,t)&&!w.agents.some(a=>Math.hypot(a.x-t.x,a.z-t.z)<.6)).sort((a,b)=>Math.hypot(a.x-w.hearth.x,a.z-w.hearth.z)-Math.hypot(b.x-w.hearth.x,b.z-w.hearth.z));
  const firstId=Math.max(0,...w.agents.map(a=>a.id))+1;
  for(let i=0;i<count&&i<positions.length;i++){const p=positions[i];w.agents.push({x:p.x,z:p.z,id:firstId+i,name:def.names[i%def.names.length],type,capabilities:[...def.capabilities],path:[],carrying:0,activity:'Looking for work',facing:0,retry:0,energy:1,rested:0,hunger:1,meals:0,meal:false,crafted:0});}
}
export function designate(w:World,points:Point[],value:boolean|'toggle'=true) {
  for(const p of points){const t=tileAt(w,p.x,p.z);if(t&&(!t.known||['dirt','rock','gold','gem'].includes(t.terrain)))t.designated=value==='toggle'?!t.designated:value;}
  w.revision++;
}
function reserved(w:World,kind:Job['kind'],p:Point){return w.agents.some(a=>a.job?.kind===kind&&key(a.job.target)===key(p));}
function nearest<T extends Point>(a:Point,list:T[]){return [...list].sort((p,q)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(a.x-q.x,a.z-q.z));}
function take(w:World,a:Resident,kind:Job['kind'],target:Point,work:Point,furnishing?:string){
  const path=findPath(w,a,work);if(!path)return false;
  a.job={kind,target:{x:target.x,z:target.z},work:{x:work.x,z:work.z},progress:0,furnishing};a.path=path;a.retry=0;return true;
}
function storage(w:World,a:Resident){return nearest(a,w.furnishings.filter(f=>f.service==='storage'&&f.stored<f.capacity));}
function availableStorage(w:World,a:Resident){return storage(w,a).find(f=>findPath(w,a,f.access));}
function choose(w:World,a:Resident){
  if(a.carrying){
    for(const f of storage(w,a))if(take(w,a,'deliver',f,f.access,f.id))return;
    const origin=a.cargoOrigin&&tileAt(w,a.cargoOrigin.x,a.cargoOrigin.z);
    if(origin)for(const p of origin.terrain==='floor'?[origin]:nearest(a,neighbors(w,origin)))if(take(w,a,'drop',origin,p))return;
    a.activity='Waiting for a route to storage or the mining site';a.retry=tuning.retrySeconds;return;
  }
  if(a.energy<tuning.restThreshold){
    const beds=nearest(a,w.furnishings.filter(f=>f.service==='rest'&&(!f.assigned||f.assigned===a.id))).sort((f,g)=>Number(g.assigned===a.id)-Number(f.assigned===a.id));
    for(const f of beds)if(take(w,a,'sleep',f,f.access,f.id)){f.assigned=a.id;return;}
  }
  if(a.hunger<tuning.hungerThreshold||a.meal)for(const table of nearest(a,w.furnishings.filter(f=>f.service==='dining'&&!(a.avoidFacility===f.id&&(a.avoidUntil??0)>w.elapsed)&&!w.agents.some(o=>o!==a&&o.job&&(o.job.furnishing===f.id||key(o.job.work)===key(f.access)))))){
    const food=foodFacilities(w,table).find(f=>f.service==='cooking'&&f.stored>0);
    if((a.meal||food)&&take(w,a,'eat',table,table.access,table.id)){if(!a.meal){food!.stored--;a.meal=true;w.revision++;}return;}
  }
  for(const order of w.craftOrders.filter(o=>o.state==='queued')){
    const recipe=recipeById(order.recipe)!;if(!a.capabilities.includes(recipe.capability))continue;
    if(!order.paid&&goldTotal(w)<recipe.cost){a.activity='Waiting for production gold';a.retry=1;return;}
    for(const f of nearest(a,w.furnishings.filter(f=>f.service==='craft'&&!w.agents.some(o=>o.job?.furnishing===f.id)))){
      if(take(w,a,'craft',f,f.access,f.id)){a.job!.order=order.id;order.worker=a.id;order.state='working';return;}
    }
  }
  if(a.resumeMine){
    const t=tileAt(w,a.resumeMine.x,a.resumeMine.z);
    if(t?.known&&t.designated&&t.terrain==='gold'&&a.capabilities.includes('mine')&&!reserved(w,'mine',t)){
      for(const p of nearest(a,neighbors(w,t)))if(take(w,a,'mine',t,p))return;
    }
    a.resumeMine=undefined;
  }
  if(a.capabilities.includes('haul')&&availableStorage(w,a))for(const t of nearest(a,w.tiles.filter(t=>t.loose&&!reserved(w,'collect',t)))){
    for(const p of t.terrain==='floor'?[t]:neighbors(w,t))if(take(w,a,'collect',t,p))return;
  }
  if(a.capabilities.includes('mine'))for(const t of nearest(a,w.tiles.filter(t=>t.known&&t.designated&&t.terrain!=='gem'&&t.terrain!=='floor'&&!reserved(w,'mine',t)))){
    for(const p of nearest(a,neighbors(w,t)))if(take(w,a,'mine',t,p))return;
  }
  if(a.capabilities.includes('claim'))for(const t of nearest(a,w.tiles.filter(t=>t.known&&t.terrain==='floor'&&!t.claimed&&!reserved(w,'claim',t))))if(take(w,a,'claim',t,t))return;
  if(a.capabilities.includes('mine'))for(const t of nearest(a,w.tiles.filter(t=>t.known&&t.designated&&t.terrain==='gem'&&!reserved(w,'mine',t)))){
    for(const p of nearest(a,neighbors(w,t)))if(take(w,a,'mine',t,p))return;
  }
  if(a.capabilities.includes('reinforce'))for(const t of nearest(a,w.tiles.filter(t=>t.known&&!t.reinforced&&!t.designated&&['dirt','rock'].includes(t.terrain)&&!reserved(w,'reinforce',t)))){
    for(const p of nearest(a,neighbors(w,t).filter(p=>p.claimed&&p.terrain==='floor')))if(take(w,a,'reinforce',t,p))return;
  }
  const obstructs=w.furnishings.some(f=>Math.hypot(a.x-f.access.x,a.z-f.access.z)<.6)||w.agents.some(o=>o!==a&&o.job&&(Math.hypot(a.x-o.job.work.x,a.z-o.job.work.z)<.6||o.path.length&&Math.hypot(a.x-o.x,a.z-o.z)<.85));
  if(obstructs)for(const p of nearest(a,w.tiles.filter(t=>t.known&&t.terrain==='floor'&&!t.core&&Math.hypot(t.x-a.x,t.z-a.z)<6))){
    if(w.furnishings.some(f=>key(f.access)===key(p))||w.agents.some(o=>o!==a&&(Math.hypot(o.x-p.x,o.z-p.z)<.6||o.job&&key(o.job.work)===key(p))))continue;
    if(take(w,a,'idle',p,p))return;
  }
  a.activity=a.hunger<tuning.hungerThreshold?'Needs food and an accessible table':a.energy<tuning.restThreshold?'Needs an accessible bed':'Awaiting a designation';a.retry=tuning.retrySeconds;
}
function valid(w:World,a:Resident){
  const j=a.job!,t=tileAt(w,j.target.x,j.target.z);if(!t)return false;
  if(j.kind==='mine')return t.known&&t.designated&&['dirt','rock','gold','gem'].includes(t.terrain);
  if(j.kind==='claim')return t.terrain==='floor'&&!t.claimed;
  if(j.kind==='reinforce')return t.known&&!t.reinforced&&!t.designated&&['dirt','rock'].includes(t.terrain)&&!!tileAt(w,j.work.x,j.work.z)?.claimed&&canStand(w,j.work);
  if(j.kind==='collect')return t.loose>0;
  if(j.kind==='drop')return a.carrying>0&&canStand(w,j.work);
  if(j.kind==='idle')return canStand(w,j.work);
  if(j.kind==='sleep')return w.furnishings.some(f=>f.id===j.furnishing&&f.assigned===a.id)&&canStand(w,j.work);
  if(j.kind==='eat')return a.meal&&w.furnishings.some(f=>f.id===j.furnishing)&&canStand(w,j.work);
  if(j.kind==='craft')return w.furnishings.some(f=>f.id===j.furnishing)&&w.craftOrders.some(o=>o.id===j.order&&o.state==='working'&&o.worker===a.id)&&canStand(w,j.work);
  return w.furnishings.some(f=>f.id===j.furnishing&&f.stored<f.capacity);
}
function releaseJob(w:World,a:Resident){
  if(a.job?.kind==='craft'){const order=w.craftOrders.find(o=>o.id===a.job!.order);if(order?.state==='working'){order.state='queued';order.worker=undefined;}}
  a.job=undefined;a.path=[];
}
function move(w:World,a:Resident,dt:number){
  const target=a.path[0];if(!target)return true;
  const dx=target.x-a.x,dz=target.z-a.z,d=Math.hypot(dx,dz),step=Math.min(d,tuning.speed*dt);
  if(d<tuning.arrivalDistance){a.path.shift();if(a.job){a.job.lastDistance=undefined;a.job.stalled=0;}return !a.path.length;}
  if(a.job){
    a.job.stalled=a.job.lastDistance!==undefined&&d>a.job.lastDistance-.002?(a.job.stalled??0)+dt:0;a.job.lastDistance=d;
    if((a.job.stalled??0)>tuning.stallSeconds){a.avoidFacility=a.job.furnishing;a.avoidUntil=w.elapsed+tuning.facilityRetry;releaseJob(w,a);a.retry=.25;return false;}
  }
  let vx=dx/d,vz=dz/d;
  for(const other of w.agents)if(other!==a){
    const ox=a.x-other.x,oz=a.z-other.z,dist=Math.hypot(ox,oz);
    if(dist>0&&dist<tuning.avoidanceRadius){const weight=(1-dist/tuning.avoidanceRadius)*tuning.avoidanceStrength;vx+=ox/dist*weight;vz+=oz/dist*weight;}
  }
  const norm=Math.hypot(vx,vz)||1;let next={x:a.x+vx/norm*step,z:a.z+vz/norm*step};
  // Avoid residents when space allows, but never let avoidance stop forward progress.
  // Terrain and furniture remain solid even while residents briefly overlap.
  if(!canStand(w,next)||Math.hypot(target.x-next.x,target.z-next.z)>d-step*.25)next={x:a.x+dx/d*step,z:a.z+dz/d*step};
  if(!canStand(w,next)){
    const path=a.job&&findPath(w,a,a.job.work);
    if(path)a.path=path;else releaseJob(w,a);
    return false;
  }
  a.x=next.x;a.z=next.z;a.facing=Math.atan2(vx,vz);a.retry=0;a.activity=a.carrying?'Carrying gold':'Walking to work';return false;
}
export function tick(w:World,dt:number){
  w.elapsed+=dt;
  if(Math.floor(w.elapsed-dt)!==Math.floor(w.elapsed))produceFood(w,1);
  for(const a of w.agents){
    if(a.job?.kind!=='sleep')a.energy=Math.max(0,a.energy-dt/tuning.restInterval);
    if(a.job?.kind!=='eat')a.hunger=Math.max(0,a.hunger-dt/tuning.hungerInterval);
    if(a.job&&!valid(w,a))releaseJob(w,a);
    if(!a.job){a.retry-=dt;if(a.retry<=0)choose(w,a);}
    if(!a.job)continue;
    if(!move(w,a,dt))continue;
    const j=a.job,t=tileAt(w,j.target.x,j.target.z)!;j.progress+=dt;
    if(j.kind==='mine'){
      a.activity=t.terrain==='gem'?'Extracting gems':t.terrain==='gold'?'Mining gold':'Excavating';const duration=t.terrain==='gem'?tuning.gemSeconds:t.terrain==='gold'?tuning.goldSeconds:t.terrain==='rock'?tuning.rockSeconds:tuning.mineSeconds;
      if(j.progress<duration)continue;
      if(t.terrain==='gem'){t.loose+=tuning.gemYield;t.source='gem';}
      else if(t.terrain==='gold'){
        const amount=Math.min(t.gold,tuning.goldYield,Math.max(0,tuning.carry-a.carrying));t.gold-=amount;t.source='gold';
        if(availableStorage(w,a)){
          a.carrying+=amount;a.cargoOrigin={...j.target};
        }else {t.loose+=amount+a.carrying;a.carrying=0;a.cargoOrigin=undefined;}
        w.revision++;
        if(t.gold>0){
          if(a.carrying>=tuning.carry){a.resumeMine={...j.target};}
          else {j.progress=0;continue;}
        }else {t.terrain='floor';t.claimed=false;t.designated=false;t.reinforced=false;a.resumeMine=undefined;}
      }
      else {t.terrain='floor';t.claimed=false;t.designated=false;t.reinforced=false;}
      reveal(w,j.work);w.revision++;
    }else if(j.kind==='reinforce'){
      a.activity='Reinforcing wall';if(j.progress<tuning.reinforceSeconds)continue;t.reinforced=true;w.revision++;
    }else if(j.kind==='craft'){
      const order=w.craftOrders.find(o=>o.id===j.order)!,recipe=recipeById(order.recipe)!;
      if(!order.paid){if(!spendGold(w,recipe.cost)){releaseJob(w,a);a.retry=1;continue;}order.paid=true;w.revision++;}
      a.activity=`Crafting ${recipe.name.toLowerCase()}`;order.progress+=dt;if(order.progress<recipe.seconds)continue;
      order.state='done';order.worker=undefined;w.outputs[recipe.id]=(w.outputs[recipe.id]??0)+1;a.crafted++;
      const f=w.furnishings.find(f=>f.id===j.furnishing)!;f.output=recipe.id;f.outputCount=(f.outputCount??0)+1;w.revision++;
    }else if(j.kind==='eat'){
      a.activity='Eating';if(j.progress<tuning.eatSeconds)continue;a.hunger=1;a.meals++;a.meal=false;
      const table=w.furnishings.find(f=>f.id===j.furnishing)!;const ale=foodFacilities(w,table).find(f=>f.service==='brewing'&&f.stored>0);if(ale)ale.stored--;w.revision++;
    }else if(j.kind==='sleep'){
      a.activity='Sleeping';a.energy=Math.min(1,a.energy+dt/tuning.restSeconds);if(a.energy<.999)continue;a.rested++;
    }else if(j.kind==='claim'){
      a.activity='Claiming floor';if(j.progress<tuning.claimSeconds)continue;t.claimed=true;reveal(w,t);w.revision++;
    }else if(j.kind==='collect'){
      const f=availableStorage(w,a);if(f){const amount=Math.min(t.loose,Math.max(0,tuning.carry-a.carrying),f.capacity-f.stored);t.loose-=amount;a.carrying+=amount;a.cargoOrigin={...j.target};w.revision++;}
    }else if(j.kind==='deliver'){
      const f=w.furnishings.find(f=>f.id===j.furnishing)!;const amount=Math.min(a.carrying,f.capacity-f.stored);f.stored+=amount;a.carrying-=amount;if(!a.carrying)a.cargoOrigin=undefined;w.revision++;
    }else if(j.kind==='drop'){
      // Capacity can reopen on the return trip; avoid making an unnecessary loose pile.
      if(!availableStorage(w,a)){t.loose+=a.carrying;a.carrying=0;a.cargoOrigin=undefined;w.revision++;}
    }
    a.job=undefined;a.path=[];
  }
  if(Math.floor((w.elapsed-dt)*2)!==Math.floor(w.elapsed*2))for(const a of w.agents)reveal(w,a,tuning.sightRadius);
}
