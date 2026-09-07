import {createWorld} from '../game/world.ts';
import {type Point,type World,tileAt} from '../game/types.ts';
export function createRoomLab(){
  const w=createWorld({id:'room-lab',name:'Room Layout Studio',width:24,height:24,hearth:{x:4,z:19},openings:[[2,2,21,21]],seams:[
    {terrain:'bedrock',cells:Array.from({length:14},(_,i)=>({x:17+i%2,z:4+Math.floor(i/2)}))},
    {terrain:'dirt',cells:[{x:12,z:12},{x:12,z:13}]}
  ]});
  for(const t of w.tiles){t.known=true;t.claimed=t.terrain==='floor';}w.allowance=50000;return w;
}
export const labShapes=['Single tile','Compact','Large hall','Narrow strip','L shape','Around earth','Bedrock seam','Adjacent rooms'];
export const showcaseRooms=[
  {type:'treasure',x:2,z:2,width:5,depth:5},
  {type:'dormitory',x:10,z:2,width:6,depth:5},
  {type:'kitchen',x:2,z:10,width:7,depth:5},
  {type:'workshop',x:14,z:11,width:6,depth:6}
];
export function labLayout(w:World,shape:string):Point[]{
  let cells:Point[]=[];
  const rect=(x:number,z:number,width:number,depth:number)=>{for(let dz=0;dz<depth;dz++)for(let dx=0;dx<width;dx++)cells.push({x:x+dx,z:z+dz});};
  switch(shape){
    case'Single tile':rect(9,9,1,1);break;case'Compact':rect(8,8,3,3);break;case'Narrow strip':rect(6,8,1,9);break;
    case'L shape':rect(6,6,4,8);rect(10,11,5,3);break;case'Around earth':rect(9,9,7,7);break;
    case'Bedrock seam':rect(14,3,7,10);break;case'Adjacent rooms':rect(5,5,5,7);break;default:rect(5,5,10,10);
  }
  cells=cells.filter(p=>tileAt(w,p.x,p.z)?.terrain==='floor'&&!tileAt(w,p.x,p.z)?.core);
  return cells;
}
