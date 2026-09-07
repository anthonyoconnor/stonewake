import { Vector3 } from '@babylonjs/core';
import type { GameScene } from './scene';
export class CameraControls {
  keys=new Set<string>(); drag?: {x:number;y:number};
  constructor(public view:GameScene) {
    const canvas=view.canvas;
    window.addEventListener('keydown',e=>{
      if((e.target as HTMLElement).matches('input,select,textarea'))return;
      const k=e.key.toLowerCase();
      if(['w','a','s','d','q','e','home'].includes(k)){
        e.preventDefault();this.keys.add(k);
        if(k==='home')this.home();
        if(!e.repeat)this.update(.05);
      }
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur',()=>{this.keys.clear();this.drag=undefined;});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(e.deltaY*.0015));},{passive:false});
    canvas.addEventListener('pointerdown',e=>{canvas.focus();if(e.button===1){e.preventDefault();this.drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}});
    canvas.addEventListener('pointermove',e=>{
      if(!this.drag)return;
      const scale=view.camera.radius/canvas.clientHeight;
      this.pan(-(e.clientX-this.drag.x)*scale,(e.clientY-this.drag.y)*scale);
      this.drag={x:e.clientX,y:e.clientY};
    });
    canvas.addEventListener('pointerup',()=>this.drag=undefined);
    canvas.addEventListener('pointercancel',()=>this.drag=undefined);
  }
  pan(right:number,forward:number) {
    const a=this.view.camera.alpha,t=this.view.camera.target;
    this.center(t.x-Math.sin(a)*right-Math.cos(a)*forward,t.z+Math.cos(a)*right-Math.sin(a)*forward);
  }
  center(x:number,z:number) {
    const w=this.view.world;this.view.camera.setTarget(new Vector3(Math.max(1,Math.min(w.width-2,x)),0,Math.max(1,Math.min(w.height-2,z))));
  }
  rotate(amount:number){this.view.camera.alpha+=amount;}
  zoom(factor:number){this.view.camera.radius=Math.max(9,Math.min(58,this.view.camera.radius*factor));}
  home(){this.center(this.view.world.hearth.x,this.view.world.hearth.z);this.view.camera.radius=23;}
  update(dt:number){
    const speed=this.view.camera.radius*.5*dt;
    const r=Number(this.keys.has('d'))-Number(this.keys.has('a'));
    const f=Number(this.keys.has('w'))-Number(this.keys.has('s'));
    if(r||f)this.pan(r*speed,f*speed);
    if(this.keys.has('q'))this.rotate(-dt*1.2);
    if(this.keys.has('e'))this.rotate(dt*1.2);
  }
}
