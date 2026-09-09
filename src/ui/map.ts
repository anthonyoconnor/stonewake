import type { World } from '../game/types';
import { roomDefinitions } from '../content/rooms';
import type { GameScene } from '../view/scene';
import type { CameraControls } from '../view/controls';

const colors:Record<string,string>={dirt:'#6f5a43',rock:'#91938a',bedrock:'#3c4d55',gold:'#dba949',gem:'#857ab9',floor:'#8b8067',water:'#286e86',lava:'#df5423',chasm:'#101323'};

/** Resource deposits guide exploration on both maps without discovering their surroundings. */
export function drawMap(canvas:HTMLCanvasElement,w:World){
  const c=canvas.getContext('2d')!,sx=canvas.width/w.width,sz=canvas.height/w.height;
  c.fillStyle='#0c1319';c.fillRect(0,0,canvas.width,canvas.height);
  for(const t of w.tiles)if(t.known||t.terrain==='gold'||t.terrain==='gem'){
    c.fillStyle=!t.known?colors[t.terrain]:t.core?'#8de3e5':t.bridge?'#bdad86':t.room?roomDefinitions.find(r=>r.id===t.room)!.color:colors[t.terrain];
    c.fillRect(t.x*sx,t.z*sz,sx+.4,sz+.4);
  }
  c.fillStyle='#efe5bd';
  const size=Math.max(2,Math.min(sx,sz)*.4);
  for(const a of w.agents)c.fillRect(a.x*sx-size/2,a.z*sz-size/2,size,size);
}

export class FullMap {
  element=document.createElement('dialog');
  canvas=document.createElement('canvas');
  constructor(private view:GameScene,private controls:CameraControls,private button:HTMLButtonElement){
    this.element.id='full-map-dialog';this.element.setAttribute('aria-label','Full map');
    this.element.innerHTML='<header><h2>Full map</h2><button aria-label="Close full map" title="Close full map (M / Escape)">×</button></header>';
    this.canvas.id='full-map';this.canvas.setAttribute('aria-label','Full map: click to move camera');
    this.element.append(this.canvas);document.body.append(this.element);
    button.onclick=()=>this.toggle();
    this.element.querySelector('button')!.onclick=()=>this.element.close();
    this.element.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');controls.keys.clear();controls.pointer=undefined;});
    button.setAttribute('aria-controls',this.element.id);button.setAttribute('aria-expanded','false');
    this.element.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.code==='KeyM'&&!e.repeat&&!e.ctrlKey&&!e.altKey&&!e.metaKey){e.preventDefault();this.element.close();}
    });
    window.addEventListener('keydown',e=>{
      if(document.querySelector('dialog[open]'))return;
      if(e.code!=='KeyM'||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;
      if(e.target instanceof Element&&e.target.closest('input,select,textarea,[contenteditable],dialog'))return;
      e.preventDefault();this.toggle();
    });
    this.canvas.onclick=e=>{
      const r=this.canvas.getBoundingClientRect(),w=view.world;
      controls.center((e.clientX-r.left)/r.width*w.width,(e.clientY-r.top)/r.height*w.height);
      this.element.close();
    };
  }
  toggle(){
    if(this.element.open){this.element.close();return;}
    this.controls.keys.clear();this.controls.pointer=undefined;this.controls.drag=undefined;
    this.element.showModal();this.button.setAttribute('aria-expanded','true');this.update();
  }
  update(){
    if(!this.element.open)return;
    const w=this.view.world,scale=Math.max(1,Math.min((window.innerWidth-80)/w.width,(window.innerHeight-140)/w.height,16));
    const width=Math.round(w.width*scale),height=Math.round(w.height*scale);
    if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
    this.element.querySelector('h2')!.textContent=w.name;
    drawMap(this.canvas,w);
  }
}
