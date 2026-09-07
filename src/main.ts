import './style.css';
import { prototypeLevel } from './content/levels';
import { createWorld } from './game/world';
import { GameScene } from './view/scene';
import { CameraControls } from './view/controls';
import { Sidebar } from './ui/sidebar';
import {addMiners,addResidents,tick,designate} from './game/simulation';
import {ResidentView} from './view/residents';
import {Selection} from './ui/selection';
import {createRoomLab,labLayout,showcaseRooms} from './content/room-lab';
import {buildRoom} from './game/rooms';
import {queueCraft} from './game/crafting';
let world=createWorld(prototypeLevel);
world.freeRoomBuilding=import.meta.env.VITE_FREE_ROOM_BUILDING==='true';
addMiners(world);
const view=new GameScene(document.querySelector<HTMLCanvasElement>('#world')!,world);
const controls=new CameraControls(view);
const selection=new Selection(view);
const sidebar=new Sidebar(view,controls,selection);
const residents=new ResidentView(view);
let loadingStudio=false;
sidebar.onLab=async(open,shape,type)=>{
  if(loadingStudio)return;
  if(open&&shape==='showcase'){
    loadingStudio=true;
    sidebar.root.querySelector('#feedback')!.textContent='Preparing the four-room showcase…';
    await new Promise<void>(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  }
  sidebar.lab=open;selection.selected=undefined;selection.start=undefined;selection.hover=undefined;
  const next=open?createRoomLab():world;
  next.freeRoomBuilding=world.freeRoomBuilding;
  if(open&&shape==='showcase'){
    for(const r of showcaseRooms){
      buildRoom(next,r.type,Array.from({length:r.width*r.depth},(_,i)=>({x:r.x+i%r.width,z:r.z+Math.floor(i/r.width)})));
      await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    }
    addMiners(next);addResidents(next,'engineer');
    for(const a of next.agents){a.energy=.2;a.hunger=.2;}
    for(const f of next.furnishings)if(f.service==='storage')f.stored=Math.min(f.capacity,80);else if(f.service==='cooking')f.stored=4;
    queueCraft(next,'reinforced-door');queueCraft(next,'bolt-trap');
    designate(next,[{x:12,z:12},{x:12,z:13}]);
    next.tiles.find(t=>t.x===7&&t.z===17)!.loose=90;
  }else if(open&&shape&&shape!=='empty'){
    buildRoom(next,type??sidebar.labType,labLayout(next,shape));
    if(shape==='Adjacent rooms')buildRoom(next,'treasure',labLayout(next,'Compact').map(p=>({x:p.x+3,z:p.z-3})));
  }
  residents.reset();view.setWorld(next);controls.center(open?12:world.hearth.x,open?12:world.hearth.z);view.camera.radius=open?26:23;
  selection.setTool(open?(type??sidebar.labType):'inspect');sidebar.show(open?'lab':'rooms');
  loadingStudio=false;
};
sidebar.onFreeBuild=value=>{world.freeRoomBuilding=value;view.world.freeRoomBuilding=value;};
sidebar.onRestart=()=>{const free=world.freeRoomBuilding;world=createWorld(prototypeLevel);world.freeRoomBuilding=free;addMiners(world);sidebar.onLab(false);};
let uiTime=0;
let accumulator=0;
view.engine.runRenderLoop(()=>{
  const dt=Math.min(.25,view.engine.getDeltaTime()/1000);controls.update(Math.min(.05,dt));
  if(!document.hidden){accumulator+=dt;while(accumulator>=.05){tick(view.world,.05);accumulator-=.05;}}
  residents.update();view.render();uiTime+=dt;if(uiTime>.15){sidebar.update();uiTime=0;}
});
