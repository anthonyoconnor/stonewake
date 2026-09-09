import { type World,type Point,type Furnishing,type RoomService,key,tileAt,neighbors } from './types.ts';
import {roomById} from '../content/rooms.ts';
import {barrierAt} from './spell-effects.ts';
import {reachable} from './navigation.ts';
import {tuning} from '../content/tuning.ts';
import {defenseAt} from './doors.ts';
import {roomAllowed,availabilityReason} from './availability.ts';
export const goldTotal=(w:World)=>w.allowance+w.roomServices.filter(f=>f.service==='storage').reduce((sum,f)=>sum+f.stored,0);
export function spendGold(w:World,amount:number) {
  if(w.outcome)return false;
  if(goldTotal(w)<amount)return false;
  w.spent+=amount;const grant=Math.min(amount,w.allowance);w.allowance-=grant;amount-=grant;
  for(const f of w.roomServices.filter(f=>f.service==='storage')){const take=Math.min(amount,f.stored);f.stored-=take;amount-=take;}
  return true;
}
export function roomQuote(w:World,type:string,points:Point[]) {
  if(w.outcome)return {valid:false,cost:0,addedCapacity:0,tiles:[],reason:'This area has ended. Restart to build.'};
  if(!roomAllowed(w,type))return {valid:false,cost:0,addedCapacity:0,tiles:[],reason:availabilityReason(w,'buildings',type)};
  const def=roomById(type);const unique=[...new Map(points.map(p=>[key(p),p])).values()];
  const tiles=unique.map(p=>tileAt(w,p.x,p.z));
  if(!def?.implemented)return {valid:false,cost:0,addedCapacity:0,tiles:[],reason:'This room is not available.'};
  const fresh=tiles.filter(t=>t&&t.known&&t.terrain==='floor'&&t.claimed&&!t.core&&!t.onward&&!t.room&&!t.wallPlanned&&!defenseAt(w,t)&&!barrierAt(w,t)) as NonNullable<typeof tiles[number]>[];
  if(!fresh.length)return {valid:false,cost:0,addedCapacity:0,tiles:[],reason:tiles.some(t=>t?.known&&t.room===type)?'This floor already belongs to the room.':'Select clear, claimed floor.'};
  const cost=w.freeRoomBuilding?0:fresh.length*def.cost;
  const existing=w.tiles.filter(t=>t.room===type&&t.terrain==='floor'&&!t.core);
  const addedCapacity=areaCapacity([...existing,...fresh],def.capacityPerTile)-areaCapacity(existing,def.capacityPerTile);
  return {valid:cost<=goldTotal(w),cost,addedCapacity,tiles:fresh,reason:cost>goldTotal(w)?'Not enough stored gold.':'Ready to build.'};
}
function areaCapacity(points:Point[],density:number){
  const remaining=new Map(points.map(p=>[key(p),p]));let capacity=0;
  while(remaining.size){
    const start=remaining.values().next().value!,queue=[start];remaining.delete(key(start));
    for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const id=key({x:queue[i].x+dx,z:queue[i].z+dz}),p=remaining.get(id);
      if(p){remaining.delete(id);queue.push(p);}
    }
    capacity+=Math.floor(queue.length*density+1e-9);
  }
  return capacity;
}
export function buildRoom(w:World,type:string,points:Point[]) {
  const quote=roomQuote(w,type,points);if(!quote.valid)return quote.reason;
  if(!spendGold(w,quote.cost))return 'Not enough stored gold.';
  for(const t of quote.tiles){t.room=type;t.roomPaid=quote.cost/quote.tiles.length;t.ruin=undefined;}
  furnish(w);w.revision++;return `${roomById(type)!.name} built.`;
}
export function reclaimQuote(w:World,points:Point[]){
  if(w.outcome)return {tiles:[] as World['tiles'],refund:0};
  const tiles=[...new Map(points.map(p=>[key(p),tileAt(w,p.x,p.z)])).values()].filter(t=>t?.known&&t.room&&!t.core&&t.terrain==='floor') as World['tiles'];
  const refund=tiles.reduce((sum,t)=>sum+Math.floor((t.roomPaid??0)*tuning.reclaimRatio),0);
  return {tiles,refund};
}
export function reclaimRoom(w:World,points:Point[]){
  if(w.outcome)return 'This area has ended. Restart to reclaim rooms.';
  const {tiles,refund}=reclaimQuote(w,points);if(!tiles.length)return 'Select room tiles to reclaim.';
  for(const t of tiles){t.room=undefined;t.roomPaid=undefined;t.claimed=true;t.ruin=undefined;}
  furnish(w);
  // Selling grants an immediate credit even when removing the last Treasure Room.
  w.allowance+=refund;w.spent-=refund;w.revision++;
  return `${tiles.length} room squares reclaimed · ${refund} gold refunded.`;
}
export function furnish(w:World) {
  syncRoomServices(w);
  // Decoration layout never supplies capacity or changes navigation.
  w.furnishings=w.furnishings.filter(f=>f.id==='hearth-treasury'||f.cells.every(p=>tileAt(w,p.x,p.z)?.room===f.room&&tileAt(w,p.x,p.z)?.terrain==='floor')&&tileAt(w,f.access.x,f.access.z)?.room===f.room);
  const occupied=new Set(w.furnishings.flatMap(f=>f.cells.map(key)));
  const approaches=new Set(w.furnishings.map(f=>key(f.access)));
  for(const t of w.tiles){
    if(!t.room||t.terrain!=='floor'||t.core||occupied.has(key(t))||approaches.has(key(t)))continue;
    const def=roomById(t.room);if(!def?.implemented)continue;
    const component=roomTiles(w,t),ids=new Set(component.map(key));
    const variants=[...def.furnishings].sort((a,b)=>w.furnishings.filter(f=>ids.has(key(f))&&f.kind===a.kind).length-w.furnishings.filter(f=>ids.has(key(f))&&f.kind===b.kind).length);
    let placed=false;
    for(const variant of variants){for(const rotation of variant.width===variant.depth?[0]:[0,1]){
    const width=rotation?variant.depth:variant.width,depth=rotation?variant.width:variant.depth,cells:Point[]=[];
    for(let z=0;z<depth;z++)for(let x=0;x<width;x++)cells.push({x:t.x+x,z:t.z+z});
    if(cells.some(p=>tileAt(w,p.x,p.z)?.room!==t.room||tileAt(w,p.x,p.z)?.terrain!=='floor'||occupied.has(key(p))||approaches.has(key(p))))continue;
    const candidate=new Set(cells.map(key));
    const access=cells.flatMap(p=>neighbors(w,p)).find(p=>p.room===t.room&&p.terrain==='floor'&&!candidate.has(key(p))&&!occupied.has(key(p)));
    if(!access)continue;
    const item:Furnishing={id:`${t.room}:${key(t)}`,x:t.x,z:t.z,room:t.room,kind:variant.kind,model:variant.model??variant.kind,rotation,cells,access:{x:access.x,z:access.z}};
    w.furnishings.push(item);for(const p of cells)occupied.add(key(p));approaches.add(key(access));placed=true;break;
    }if(placed)break;}
  }
}
export function syncRoomServices(w:World){
  const old=new Map(w.roomServices.map(s=>[s.id,s]));
  const next:RoomService[]=w.roomServices.filter(s=>s.id==='hearth-treasury');
  for(const s of next)old.delete(s.id);
  const visited=new Set<string>();
  const spill=(s:RoomService,amount:number)=>{
    if(amount<=0)return;
    const source=tileAt(w,s.x,s.z);
    const floor=source?.terrain==='floor'&&!source.core?source:w.tiles.find(t=>t.terrain==='floor'&&!t.core);
    if(floor)floor.loose+=amount;
  };
  for(const tile of w.tiles){
    if(!tile.room||tile.terrain!=='floor'||tile.core||visited.has(key(tile)))continue;
    const component=roomTiles(w,tile).sort((a,b)=>a.z-b.z||a.x-b.x);
    for(const t of component)visited.add(key(t));
    const def=roomById(tile.room);if(!def?.implemented||!roomAllowed(w,tile.room))continue;
    component.forEach((t,index)=>{
      const count=Math.floor((index+1)*def.capacityPerTile+1e-9)-Math.floor(index*def.capacityPerTile+1e-9);
      const slots=def.service==='storage'?Number(count>0):count;
      for(let slot=0;slot<slots;slot++){
        const id=`${t.room}:${def.service}:${key(t)}:${slot}`,capacity=def.service==='storage'?count:1;
        const previous=old.get(id);old.delete(id);
        const s:RoomService=previous??{id,room:t.room!,service:def.service,x:t.x,z:t.z,access:{x:t.x,z:t.z},capacity,stored:0};
        if(s.stored>capacity){spill(s,s.stored-capacity);s.stored=capacity;}
        s.capacity=capacity;next.push(s);
      }
    });
  }
  for(const s of old.values())if(s.service==='storage')spill(s,s.stored);
  w.roomServices=next;
  w.routesChanged=true;
}
export function roomTiles(w:World,p:Point){
  const start=tileAt(w,p.x,p.z);if(!start?.room||start.terrain!=='floor'||start.core)return [];
  const result=[start],seen=new Set([key(start)]);
  for(let i=0;i<result.length;i++)for(const n of neighbors(w,result[i]))if(n.room===start.room&&n.terrain==='floor'&&!n.core&&!seen.has(key(n))){seen.add(key(n));result.push(n);}
  return result;
}
export function roomStats(w:World,p:Point){
  const tiles=roomTiles(w,p),ids=new Set(tiles.map(key));
  const start=w.roomServices.find(s=>s.id==='hearth-treasury')?.access??w.agents[0]??w.tiles.find(t=>t.claimed&&!t.core&&t.terrain==='floor');const access=start?reachable(w,start):new Set<string>();
  const facilities=w.furnishings.filter(f=>ids.has(key(f)));
  const services=w.roomServices.filter(s=>ids.has(key(s)));
  return {tiles:tiles.length,facilities,services,service:roomById(tiles[0]?.room??'')?.service,capacity:services.reduce((sum,s)=>sum+s.capacity,0),usable:services.filter(s=>access.has(key(s.access)))};
}
