import { terrainOpaque } from './terrain.ts';
import {tuning} from '../content/tuning.ts';
import { type World, type LevelDefinition, type Point, tileAt } from './types.ts';
import {roomById} from '../content/rooms.ts';
import {doorAt,doorIsOpen} from './doors.ts';
import {barrierAt} from './spell-effects.ts';
import {initializeEncounters} from './encounters.ts';
import {initializeHearth} from './hearth.ts';
export function createWorld(level: LevelDefinition): World {
  const w: World = {width:level.width,height:level.height,name:level.name,hearth:{...level.hearth},revision:1,tiles:[],agents:[],furnishings:[],roomServices:[],elapsed:0,nextPaydayAt:tuning.paydaySeconds,allowance:tuning.startingGold,spent:0,freeRoomBuilding:false,craftOrders:[],outputs:{},researchOrders:[]};
  for(let z=0;z<w.height;z++) for(let x=0;x<w.width;x++) {
    const border=x===0||z===0||x===w.width-1||z===w.height-1;
    w.tiles.push({x,z,terrain:border?'bedrock':'dirt',known:false,claimed:false,designated:false,core:false,gold:0,loose:0});
  }
  for(const [x1,z1,x2,z2] of level.openings) for(let z=z1;z<=z2;z++) for(let x=x1;x<=x2;x++) tileAt(w,x,z)!.terrain='floor';
  for(const seam of level.seams) for(const p of seam.cells) {const t=tileAt(w,p.x,p.z)!;t.terrain=seam.terrain;t.gold=t.terrain==='gold'?tuning.seamGold:0;}
  for(let z=level.hearth.z-1;z<=level.hearth.z+1;z++) for(let x=level.hearth.x-1;x<=level.hearth.x+1;x++) {
    const t=tileAt(w,x,z)!; t.terrain='floor';t.core=true;t.claimed=true;
  }
  for(const [dx,dz] of [[-2,-2],[2,-2],[0,2]]) reveal(w,{x:level.hearth.x+dx,z:level.hearth.z+dz},tuning.initialSight);
  for(const t of w.tiles) if(t.known&&t.terrain==='floor'&&Math.hypot(t.x-level.hearth.x,t.z-level.hearth.z)<tuning.claimedRadius) t.claimed=true;
  addHearthTreasury(w);
  initializeHearth(w,level.onwardHearth);
  initializeEncounters(w,level.encounters??[]);
  return w;
}
// The chest occupies already-blocked core space; its approach stays on walkable floor.
export function addHearthTreasury(w:World){
  if(w.roomServices.some(f=>f.id==='hearth-treasury'))return;
  const {x,z}=w.hearth;
  const side=[{x:0,z:-1},{x:1,z:0},{x:0,z:1},{x:-1,z:0}].find(d=>tileAt(w,x+d.x*2,z+d.z*2)?.terrain==='floor');
  if(!side)return;
  const access={x:x+side.x*2,z:z+side.z*2};
  const position={x:x+side.x,z:z+side.z};
  w.roomServices.push({id:'hearth-treasury',room:'hearth',service:'storage',...position,access,capacity:tuning.hearthRoomTiles*roomById('treasure')!.cost,stored:0});
  w.furnishings.push({id:'hearth-treasury',room:'hearth',kind:'chest',...position,rotation:0,cells:[],access});
}
// Sight is independent of camera and stops at the first solid cell.
export function reveal(w:World, origin:Point, radius=tuning.sightRadius) {
  let changed=false;
  for(let z=Math.max(0,Math.floor(origin.z-radius));z<=Math.min(w.height-1,Math.ceil(origin.z+radius));z++) {
    for(let x=Math.max(0,Math.floor(origin.x-radius));x<=Math.min(w.width-1,Math.ceil(origin.x+radius));x++) {
      if(Math.hypot(x-origin.x,z-origin.z)>radius) continue;
      const dx=x-origin.x,dz=z-origin.z,steps=Math.max(Math.abs(dx),Math.abs(dz))*4;
      for(let i=0;i<=steps;i++) {
        const t=tileAt(w,Math.round(origin.x+dx*i/(steps||1)),Math.round(origin.z+dz*i/(steps||1)));
        if(!t) break;
        if(!t.known){t.known=true;if(!['dirt','rock','gold','gem'].includes(t.terrain))t.designated=false;changed=true;}
        const door=doorAt(w,t);
        if(terrainOpaque(t)||door&&!doorIsOpen(w,door)||barrierAt(w,t)) break;
      }
    }
  }
  if(changed) w.revision++;
}
