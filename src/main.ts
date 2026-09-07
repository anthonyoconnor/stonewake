import './style.css';
import { prototypeLevel } from './content/levels';
import { createWorld } from './game/world';
import { GameScene } from './view/scene';
import { CameraControls } from './view/controls';
import { Sidebar } from './ui/sidebar';
import {addMiners,tick} from './game/simulation';
import {ResidentView} from './view/residents';
import {Selection} from './ui/selection';
import {createRoomLab,labLayout} from './content/room-lab';
import {buildRoom} from './game/rooms';
let world=createWorld(prototypeLevel);
world.freeRoomBuilding=import.meta.env.VITE_FREE_ROOM_BUILDING==='true';
addMiners(world);
const view=new GameScene(document.querySelector<HTMLCanvasElement>('#world')!,world);
const controls=new CameraControls(view);
const selection=new Selection(view);
const sidebar=new Sidebar(view,controls,selection);
const residents=new ResidentView(view);
sidebar.onLab=(open,shape,type)=>{
  sidebar.lab=open;selection.selected=undefined;selection.start=undefined;selection.hover=undefined;
  const next=open?createRoomLab():world;
  next.freeRoomBuilding=world.freeRoomBuilding;
  if(open&&shape&&shape!=='empty'){
    buildRoom(next,type??sidebar.labType,labLayout(next,shape));
    if(shape==='Adjacent rooms')buildRoom(next,'treasure',labLayout(next,'Compact').map(p=>({x:p.x+3,z:p.z-3})));
  }
  residents.reset();view.setWorld(next);controls.center(open?12:world.hearth.x,open?12:world.hearth.z);view.camera.radius=open?26:23;
  selection.setTool(open?(type??sidebar.labType):'inspect');sidebar.show(open?'lab':'rooms');
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
