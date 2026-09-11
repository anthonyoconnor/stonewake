import {tuning} from '../content/tuning.ts';
import { presentation } from '../content/presentation.ts';
import type { GameScene } from './scene';
import { zoomedRadius } from './camera-zoom.ts';
export class CameraControls {
  keys=new Set<string>(); drag?: {x:number;pointerId:number};
  pointer?: {x:number;y:number};
  view:GameScene;
  constructor(view:GameScene) {
    this.view=view;
    const canvas=view.canvas;
    window.addEventListener('keydown',e=>{
      if(document.querySelector('dialog[open]'))return;
      if(e.target instanceof Element&&e.target.closest('input,select,textarea,button,summary,[contenteditable],dialog'))return;
      const k=e.code;
      if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','Home','ShiftLeft'].includes(k)){
        e.preventDefault();this.keys.add(k);
        if(k==='Home')this.home();
      }
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    const clear=()=>{this.keys.clear();this.drag=undefined;this.pointer=undefined;};
    window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
    window.addEventListener('pointermove',e=>{
      const leftEdge=e.clientX<tuning.edgePixels&&e.target instanceof Element&&!!e.target.closest('#sidebar');
      this.pointer=e.pointerType==='mouse'&&!e.buttons&&(e.target===canvas||leftEdge)?{x:e.clientX,y:e.clientY}:undefined;
    });
    window.addEventListener('pointerdown',()=>this.pointer=undefined);
    window.addEventListener('wheel',e=>{if(e.target!==canvas)this.pointer=undefined;});
    document.addEventListener('focusin',e=>{if(e.target instanceof Element&&e.target.closest('#sidebar,dialog'))clear();});
    document.addEventListener('pointerleave',()=>this.pointer=undefined);
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(e.deltaY*tuning.wheelSensitivity));},{passive:false});
    canvas.addEventListener('pointerdown',e=>{canvas.focus();if(e.button===1){e.preventDefault();this.drag={x:e.clientX,pointerId:e.pointerId};canvas.setPointerCapture(e.pointerId);}});
    canvas.addEventListener('pointermove',e=>{
      if(!this.drag||e.pointerId!==this.drag.pointerId)return;
      if(!(e.buttons&4)){this.drag=undefined;return;}
      this.rotate(-(e.clientX-this.drag.x)*tuning.dragSensitivity);
      this.drag.x=e.clientX;
    });
    canvas.addEventListener('pointerup',e=>{if(e.button===1){this.drag=undefined;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}});
    canvas.addEventListener('pointercancel',()=>this.drag=undefined);
    canvas.addEventListener('lostpointercapture',()=>this.drag=undefined);
  }
  pan(right:number,forward:number) {
    const a=this.view.camera.alpha,t=this.view.camera.target;
    this.center(t.x-Math.sin(a)*right-Math.cos(a)*forward,t.z+Math.cos(a)*right-Math.sin(a)*forward);
  }
  center(x:number,z:number) {
    // Move the orbit center without setTarget rebuilding angles/radius from the old position.
    const w=this.view.world;this.view.camera.target.set(Math.max(1,Math.min(w.width-2,x)),0,Math.max(1,Math.min(w.height-2,z)));
  }
  rotate(amount:number){this.view.camera.alpha+=amount;}
  zoom(factor:number){this.view.camera.radius=zoomedRadius(this.view.camera.radius,factor,tuning.maxZoom);}
  home(){this.center(this.view.world.hearth.x,this.view.world.hearth.z);this.view.camera.radius=tuning.homeZoom;}
  update(dt:number){
    if(document.querySelector('dialog[open]'))return;
    const speed=this.view.camera.radius*tuning.panSpeed*dt;
    const horizontal=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'));
    const orbit=this.keys.has('ShiftLeft');
    let r=orbit?0:horizontal;
    let f=Number(this.keys.has('KeyW'))-Number(this.keys.has('KeyS'));
    if(presentation.edgeScrolling&&this.pointer&&!this.drag){
      const {x,y}=this.pointer,edge=tuning.edgePixels;
      // Only outer window edges count; the sidebar/world boundary is not an edge.
      if(x>=0&&x<window.innerWidth&&y>=0&&y<window.innerHeight){
        r+=Number(x>=window.innerWidth-edge)-Number(x<edge);
        f+=Number(y<edge)-Number(y>=window.innerHeight-edge);
      }
    }
    const length=Math.max(1,Math.hypot(r,f));r/=length;f/=length;
    if(r||f)this.pan(r*speed,f*speed);
    if(orbit&&horizontal)this.rotate(horizontal*dt*tuning.orbitSpeed);
    if(this.keys.has('KeyQ'))this.rotate(-dt*tuning.orbitSpeed);
    if(this.keys.has('KeyE'))this.rotate(dt*tuning.orbitSpeed);
  }
}
