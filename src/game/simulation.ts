import {type World,type Resident,type Job,type Point,tileAt,neighbors,key} from './types.ts';
import {canStand,findPath} from './navigation.ts';
import {reveal} from './world.ts';
import {tuning} from '../content/tuning.ts';
export function addMiners(w:World,count=3) {
  const positions=w.tiles.filter(t=>t.terrain==='floor'&&t.claimed&&!t.core).sort((a,b)=>Math.hypot(a.x-w.hearth.x,a.z-w.hearth.z)-Math.hypot(b.x-w.hearth.x,b.z-w.hearth.z));
  for(let i=0;i<count;i++){const p=positions[i];w.agents.push({x:p.x,z:p.z,id:i+1,name:['Brokk','Orin','Thora'][i]??`Miner ${i+1}`,type:'miner',capabilities:['mine','haul','claim'],path:[],carrying:0,activity:'Looking for work',facing:0,retry:0});}
}
export function designate(w:World,points:Point[],value=true) {
  for(const p of points){const t=tileAt(w,p.x,p.z);if(t&&t.known&&['dirt','rock','gold','gem'].includes(t.terrain))t.designated=value;}
  w.revision++;
}
function reserved(w:World,kind:Job['kind'],p:Point){return w.agents.some(a=>a.job?.kind===kind&&key(a.job.target)===key(p));}
function nearest<T extends Point>(a:Point,list:T[]){return [...list].sort((p,q)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(a.x-q.x,a.z-q.z));}
function take(w:World,a:Resident,kind:Job['kind'],target:Point,work:Point,furnishing?:string){
  const path=findPath(w,a,work);if(!path)return false;
  a.job={kind,target:{x:target.x,z:target.z},work:{x:work.x,z:work.z},progress:0,furnishing};a.path=path;a.retry=0;return true;
}
function storage(w:World,a:Resident){return nearest(a,w.furnishings.filter(f=>f.room==='treasure'&&f.stored<f.capacity));}
function availableStorage(w:World,a:Resident){return storage(w,a).find(f=>findPath(w,a,f.access));}
function choose(w:World,a:Resident){
  if(a.carrying){
    for(const f of storage(w,a))if(take(w,a,'deliver',f,f.access,f.id))return;
    const t=tileAt(w,Math.round(a.x),Math.round(a.z))!;t.loose+=a.carrying;a.carrying=0;w.revision++;
  }
  if(a.capabilities.includes('haul')&&availableStorage(w,a))for(const t of nearest(a,w.tiles.filter(t=>t.loose&&!reserved(w,'collect',t)))){
    for(const p of t.terrain==='floor'?[t]:neighbors(w,t))if(take(w,a,'collect',t,p))return;
  }
  if(a.capabilities.includes('mine'))for(const t of nearest(a,w.tiles.filter(t=>t.designated&&t.terrain!=='gem'&&t.terrain!=='floor'&&!reserved(w,'mine',t)))){
    for(const p of nearest(a,neighbors(w,t)))if(take(w,a,'mine',t,p))return;
  }
  if(a.capabilities.includes('claim'))for(const t of nearest(a,w.tiles.filter(t=>t.known&&t.terrain==='floor'&&!t.claimed&&!reserved(w,'claim',t))))if(take(w,a,'claim',t,t))return;
  if(a.capabilities.includes('mine'))for(const t of nearest(a,w.tiles.filter(t=>t.designated&&t.terrain==='gem'&&!reserved(w,'mine',t)))){
    for(const p of nearest(a,neighbors(w,t)))if(take(w,a,'mine',t,p))return;
  }
  const obstructs=w.furnishings.some(f=>Math.hypot(a.x-f.access.x,a.z-f.access.z)<.6)||w.agents.some(o=>o!==a&&o.job&&Math.hypot(a.x-o.job.work.x,a.z-o.job.work.z)<.6);
  if(obstructs)for(const p of neighbors(w,{x:Math.round(a.x),z:Math.round(a.z)})){
    if(w.furnishings.some(f=>key(f.access)===key(p))||w.agents.some(o=>o!==a&&(Math.hypot(o.x-p.x,o.z-p.z)<.6||o.job&&key(o.job.work)===key(p))))continue;
    if(take(w,a,'idle',p,p))return;
  }
  a.activity='Awaiting a designation';a.retry=.8;
}
function valid(w:World,a:Resident){
  const j=a.job!,t=tileAt(w,j.target.x,j.target.z);if(!t)return false;
  if(j.kind==='mine')return t.designated&&['dirt','rock','gold','gem'].includes(t.terrain);
  if(j.kind==='claim')return t.terrain==='floor'&&!t.claimed;
  if(j.kind==='collect')return t.loose>0;
  if(j.kind==='idle')return canStand(w,j.work);
  return w.furnishings.some(f=>f.id===j.furnishing&&f.stored<f.capacity);
}
function move(w:World,a:Resident,dt:number){
  const target=a.path[0];if(!target)return true;
  const dx=target.x-a.x,dz=target.z-a.z,d=Math.hypot(dx,dz),step=Math.min(d,tuning.speed*dt);
  if(d<.055){a.path.shift();return !a.path.length;}
  let vx=dx/d,vz=dz/d;
  for(const other of w.agents)if(other!==a){const ox=a.x-other.x,oz=a.z-other.z,dist=Math.hypot(ox,oz);if(dist>0&&dist<.55){vx+=ox/dist*(.55-dist)*2;vz+=oz/dist*(.55-dist)*2;}}
  const norm=Math.hypot(vx,vz)||1;let next={x:a.x+vx/norm*step,z:a.z+vz/norm*step};
  const clear=(p:Point)=>canStand(w,p)&&!w.agents.some(o=>o!==a&&Math.hypot(o.x-p.x,o.z-p.z)<tuning.radius*1.7);
  if(!clear(next)){
    const side=a.id%2?1:-1;
    next={x:a.x-vz/norm*step*side,z:a.z+vx/norm*step*side};
    if(!clear(next)){a.retry+=dt;if(a.retry>2){a.job=undefined;a.path=[];a.retry=.25;}return false;}
  }
  a.x=next.x;a.z=next.z;a.facing=Math.atan2(vx,vz);a.retry=0;a.activity=a.carrying?'Carrying gold':'Walking to work';return false;
}
export function tick(w:World,dt:number){
  w.elapsed+=dt;
  for(const a of w.agents){
    if(a.job&&!valid(w,a)){a.job=undefined;a.path=[];}
    if(!a.job){a.retry-=dt;if(a.retry<=0)choose(w,a);}
    if(!a.job)continue;
    if(!move(w,a,dt))continue;
    const j=a.job,t=tileAt(w,j.target.x,j.target.z)!;j.progress+=dt;
    if(j.kind==='mine'){
      a.activity=t.terrain==='gem'?'Extracting gems':'Excavating';const duration=t.terrain==='gem'?tuning.gemSeconds:t.terrain==='rock'?tuning.rockSeconds:tuning.mineSeconds;
      if(j.progress<duration)continue;
      if(t.terrain==='gem'){t.loose+=tuning.gemYield;t.source='gem';}
      else {if(t.terrain==='gold'){t.loose+=t.gold;t.gold=0;t.source='gold';}t.terrain='floor';t.claimed=false;t.designated=false;}
      reveal(w,j.work);w.revision++;
    }else if(j.kind==='claim'){
      a.activity='Claiming floor';if(j.progress<tuning.claimSeconds)continue;t.claimed=true;reveal(w,t);w.revision++;
    }else if(j.kind==='collect'){
      const f=availableStorage(w,a);if(f){const amount=Math.min(t.loose,tuning.carry,f.capacity-f.stored);t.loose-=amount;a.carrying+=amount;w.revision++;}
    }else if(j.kind==='deliver'){
      const f=w.furnishings.find(f=>f.id===j.furnishing)!;const amount=Math.min(a.carrying,f.capacity-f.stored);f.stored+=amount;a.carrying-=amount;w.revision++;
    }
    a.job=undefined;a.path=[];
  }
  if(Math.floor((w.elapsed-dt)*2)!==Math.floor(w.elapsed*2))for(const a of w.agents)reveal(w,a,6);
}
