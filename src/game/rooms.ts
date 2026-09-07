import { type World,type Point,type Furnishing,key,tileAt,neighbors } from './types.ts';
import {roomById} from '../content/rooms.ts';
import {blocked,reachable} from './navigation.ts';
export const goldTotal=(w:World)=>w.allowance+w.furnishings.filter(f=>f.room==='treasure').reduce((sum,f)=>sum+f.stored,0);
export function spendGold(w:World,amount:number) {
  if(goldTotal(w)<amount)return false;
  w.spent+=amount;const grant=Math.min(amount,w.allowance);w.allowance-=grant;amount-=grant;
  for(const f of w.furnishings.filter(f=>f.room==='treasure')){const take=Math.min(amount,f.stored);f.stored-=take;amount-=take;}
  return true;
}
export function roomQuote(w:World,type:string,points:Point[]) {
  const def=roomById(type);const unique=[...new Map(points.map(p=>[key(p),p])).values()];
  const tiles=unique.map(p=>tileAt(w,p.x,p.z));
  if(!def?.implemented)return {valid:false,cost:0,tiles:[],reason:'This room is not available.'};
  const fresh=tiles.filter(t=>t&&t.known&&t.terrain==='floor'&&t.claimed&&!t.core&&!t.room) as NonNullable<typeof tiles[number]>[];
  if(!fresh.length)return {valid:false,cost:0,tiles:[],reason:tiles.some(t=>t?.known&&t.room===type)?'This floor already belongs to the room.':'Select clear, claimed floor.'};
  const cost=w.freeRoomBuilding?0:fresh.length*def.cost;
  return {valid:cost<=goldTotal(w),cost,tiles:fresh,reason:cost>goldTotal(w)?'Not enough stored gold.':fresh.length?'Ready to build.':'This floor already belongs to the room.'};
}
export function buildRoom(w:World,type:string,points:Point[]) {
  const quote=roomQuote(w,type,points);if(!quote.valid)return quote.reason;
  if(!spendGold(w,quote.cost))return 'Not enough stored gold.';
  for(const t of quote.tiles)t.room=type;
  furnish(w);w.revision++;return `${roomById(type)!.name} built.`;
}
export function furnish(w:World) {
  // Retain valid objects; displaced storage remains in the world rather than vanishing.
  w.furnishings=w.furnishings.filter(f=>{
    if(f.cells.every(p=>tileAt(w,p.x,p.z)?.room===f.room&&tileAt(w,p.x,p.z)?.terrain==='floor')&&tileAt(w,f.access.x,f.access.z)?.terrain==='floor')return true;
    const floor=w.tiles.find(t=>t.terrain==='floor'&&!t.core&&t.x===f.access.x&&t.z===f.access.z)??w.tiles.find(t=>t.terrain==='floor'&&!t.core);
    if(floor&&f.stored&&f.service==='storage')floor.loose+=f.stored;
    return false;
  });
  const start=w.agents[0]??w.tiles.find(t=>t.claimed&&!t.core&&t.terrain==='floor');if(!start)return;
  for(const t of w.tiles){
    if(!t.room||blocked(w,t))continue;
    const def=roomById(t.room);if(!def?.implemented)continue;
    // Balance variants locally, so Kitchens can grow complete sets of services.
    const component=roomTiles(w,t),ids=new Set(component.map(key));
    const variants=[...def.furnishings].sort((a,b)=>w.furnishings.filter(f=>ids.has(key(f))&&f.kind===a.kind).length-w.furnishings.filter(f=>ids.has(key(f))&&f.kind===b.kind).length);
    let placed=false;
    for(const variant of variants){for(const rotation of variant.width===variant.depth?[0]:[0,1]){
    const width=rotation?variant.depth:variant.width,depth=rotation?variant.width:variant.depth,cells:Point[]=[];
    for(let z=0;z<depth;z++)for(let x=0;x<width;x++)cells.push({x:t.x+x,z:t.z+z});
    if(cells.some(p=>tileAt(w,p.x,p.z)?.room!==t.room||blocked(w,p)||w.agents.some(a=>Math.hypot(a.x-p.x,a.z-p.z)<.7)))continue;
    const occupied=new Set(cells.map(key));const before=reachable(w,start);
    if(cells.some(p=>!before.has(key(p))))continue;
    const after=reachable(w,start,occupied);
    if(after.size!==before.size-cells.length)continue;
    // Preserve existing facility access as well as circulation through the room.
    if(w.furnishings.some(f=>occupied.has(key(f.access))))continue;
    const access=cells.flatMap(p=>neighbors(w,p)).find(p=>p.room===t.room&&!occupied.has(key(p))&&after.has(key(p)));
    if(!access)continue;
    const item:Furnishing={id:`${t.room}:${key(t)}`,x:t.x,z:t.z,room:t.room,kind:variant.kind,service:variant.service,rotation,cells,access:{x:access.x,z:access.z},capacity:variant.capacity,stored:0};
    w.furnishings.push(item);placed=true;break;
    }if(placed)break;}
  }
}
export function roomTiles(w:World,p:Point){
  const start=tileAt(w,p.x,p.z);if(!start?.room)return [];
  const result=[start],seen=new Set([key(start)]);
  for(let i=0;i<result.length;i++)for(const n of neighbors(w,result[i]))if(n.room===start.room&&!seen.has(key(n))){seen.add(key(n));result.push(n);}
  return result;
}
export function roomStats(w:World,p:Point){
  const tiles=roomTiles(w,p),ids=new Set(tiles.map(key));
  const start=w.agents[0]??w.tiles.find(t=>t.claimed&&!t.core&&t.terrain==='floor');const access=start?reachable(w,start):new Set<string>();
  const facilities=w.furnishings.filter(f=>ids.has(key(f)));
  return {tiles:tiles.length,facilities,usable:facilities.filter(f=>access.has(key(f.access)))};
}
