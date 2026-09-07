import { type World, type LevelDefinition, type Point, tileAt } from './types.ts';
export function createWorld(level: LevelDefinition): World {
  const w: World = {width:level.width,height:level.height,name:level.name,hearth:{...level.hearth},revision:1,tiles:[],agents:[],furnishings:[],elapsed:0,allowance:400,spent:0,freeRoomBuilding:false};
  for(let z=0;z<w.height;z++) for(let x=0;x<w.width;x++) {
    const border=x===0||z===0||x===w.width-1||z===w.height-1;
    w.tiles.push({x,z,terrain:border?'bedrock':'dirt',known:false,claimed:false,designated:false,core:false,gold:0,loose:0});
  }
  for(const [x1,z1,x2,z2] of level.openings) for(let z=z1;z<=z2;z++) for(let x=x1;x<=x2;x++) tileAt(w,x,z)!.terrain='floor';
  for(const seam of level.seams) for(const p of seam.cells) {const t=tileAt(w,p.x,p.z)!;t.terrain=seam.terrain;t.gold=t.terrain==='gold'?90:0;}
  for(let z=level.hearth.z-1;z<=level.hearth.z+1;z++) for(let x=level.hearth.x-1;x<=level.hearth.x+1;x++) {
    const t=tileAt(w,x,z)!; t.terrain='floor';t.core=true;t.claimed=true;
  }
  for(const p of [{x:21,z:23},{x:25,z:23},{x:23,z:27}]) reveal(w,p,8);
  for(const t of w.tiles) if(t.known&&t.terrain==='floor'&&Math.hypot(t.x-level.hearth.x,t.z-level.hearth.z)<7) t.claimed=true;
  return w;
}
// Sight is independent of camera and stops at the first solid cell.
export function reveal(w:World, origin:Point, radius=6) {
  let changed=false;
  for(let z=Math.max(0,Math.floor(origin.z-radius));z<=Math.min(w.height-1,Math.ceil(origin.z+radius));z++) {
    for(let x=Math.max(0,Math.floor(origin.x-radius));x<=Math.min(w.width-1,Math.ceil(origin.x+radius));x++) {
      if(Math.hypot(x-origin.x,z-origin.z)>radius) continue;
      const dx=x-origin.x,dz=z-origin.z,steps=Math.max(Math.abs(dx),Math.abs(dz))*4;
      for(let i=0;i<=steps;i++) {
        const t=tileAt(w,Math.round(origin.x+dx*i/(steps||1)),Math.round(origin.z+dz*i/(steps||1)));
        if(!t) break;
        if(!t.known){t.known=true;changed=true;}
        if(t.terrain!=='floor') break;
      }
    }
  }
  if(changed) w.revision++;
}
