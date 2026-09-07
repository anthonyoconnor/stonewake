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
  if(tiles.some(t=>!t||!t.known||t.terrain!=='floor'||!t.claimed||t.core||t.room&&t.room!==type))return {valid:false,cost:0,tiles:[],reason:'Select clear, claimed floor.'};
  const fresh=tiles.filter(t=>t&&!t.room) as NonNullable<typeof tiles[number]>[];
  const cost=fresh.length*def.cost;
  return {valid:cost<=goldTotal(w),cost,tiles:fresh,reason:cost>goldTotal(w)?'Not enough stored gold.':fresh.length?'Ready to build.':'This floor already belongs to the room.'};
}
export function buildRoom(w:World,type:string,points:Point[]) {
  const quote=roomQuote(w,type,points);if(!quote.valid)return quote.reason;
  if(!spendGold(w,quote.cost))return 'Not enough stored gold.';
  for(const t of quote.tiles)t.room=type;
  furnish(w);w.revision++;return `${roomById(type)!.name} built.`;
}
export function furnish(w:World) {
  // Keep existing objects. Each new solid footprint must preserve every reachable route.
  const start=w.agents[0]??w.tiles.find(t=>t.claimed&&!t.core&&t.terrain==='floor');if(!start)return;
  for(const t of w.tiles){
    if(!t.room||blocked(w,t))continue;
    const def=roomById(t.room);if(!def?.implemented)continue;
    const cells:Point[]=[];
    for(let z=0;z<def.furnishing.depth;z++)for(let x=0;x<def.furnishing.width;x++)cells.push({x:t.x+x,z:t.z+z});
    if(cells.some(p=>tileAt(w,p.x,p.z)?.room!==t.room||blocked(w,p)||w.agents.some(a=>Math.hypot(a.x-p.x,a.z-p.z)<.7)))continue;
    const occupied=new Set(cells.map(key));const before=reachable(w,start);
    if(cells.some(p=>!before.has(key(p))))continue;
    const after=reachable(w,start,occupied);
    if(after.size!==before.size-cells.length)continue;
    // Preserve existing facility access as well as circulation through the room.
    if(w.furnishings.some(f=>occupied.has(key(f.access))))continue;
    const access=cells.flatMap(p=>neighbors(w,p)).find(p=>p.room===t.room&&!occupied.has(key(p))&&after.has(key(p)));
    if(!access)continue;
    const item:Furnishing={id:`${t.room}:${key(t)}`,x:t.x,z:t.z,room:t.room,kind:def.furnishing.kind,cells,access:{x:access.x,z:access.z},capacity:def.furnishing.capacity,stored:0};
    w.furnishings.push(item);
  }
}
