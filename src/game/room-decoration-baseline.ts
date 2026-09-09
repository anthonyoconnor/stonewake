import { type World,type Point,type Furnishing,key,tileAt,neighbors } from './types.ts';
import {roomById} from '../content/rooms.ts';
import {roomTiles} from './rooms.ts';

// Permanent pre-overhaul furnishing layout for the terrain reference studio.
export function decorateStartingRooms(w:World) {

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
