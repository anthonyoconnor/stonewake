import {TransformNode} from '@babylonjs/core';
import {type Point,tileAt} from '../game/types.ts';
import type {GameScene} from '../view/scene';
import {designate} from '../game/simulation.ts';
import {buildRoom,roomQuote} from '../game/rooms.ts';
export class Selection {
  tool='dig';start?:Point;hover?:Point;selected?:Point;preview:TransformNode;
  onChange:(message:string)=>void=()=>{};
  view:GameScene;
  constructor(view:GameScene){
    this.view=view;
    this.preview=new TransformNode('preview',view.scene);
    const canvas=view.canvas;
    const pick=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();const hit=view.scene.pick(e.clientX-r.left,e.clientY-r.top,m=>!!m.metadata?.tile);const p=hit?.pickedMesh?.metadata?.tile as Point|undefined;return p&&tileAt(view.world,p.x,p.z)?.known?p:undefined;};
    canvas.addEventListener('pointerdown',e=>{if(e.button===2){this.setTool('dig');return;}if(e.button!==0)return;this.start=pick(e);canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{this.hover=pick(e);this.draw();});
    canvas.addEventListener('pointerup',e=>{
      if(e.button!==0)return;const end=pick(e);
      if(this.start&&end){const points=this.rectangle(this.start,end);
        if(this.tool==='dig'&&points.length===1&&tileAt(view.world,end.x,end.z)?.terrain==='floor')this.inspect(end);
        else if(this.tool==='dig'||this.tool==='erase'){designate(view.world,points,this.tool==='dig'?'toggle':false);this.onChange(this.tool==='dig'?'Excavation updated. Select marked tiles again to remove them.':'Excavation marks removed.');}
        else if(this.tool!=='inspect')this.onChange(buildRoom(view.world,this.tool,points));
        else this.inspect(end);
      }
      this.start=undefined;this.draw();
    });
    const cancel=()=>this.setTool('dig');
    canvas.addEventListener('contextmenu',cancel);window.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});
  }
  setTool(tool:string){this.start=undefined;this.tool=tool;this.draw();this.onChange(tool==='inspect'?'Select a room or terrain to inspect.':tool==='dig'?'Click or drag to toggle excavation. Right-click returns to excavate.':tool==='erase'?'Drag across excavation marks to remove them.':'Click or drag claimed floor to build.');}
  inspect(p:Point){this.selected=p;const t=tileAt(this.view.world,p.x,p.z)!;this.onChange(t.core?'Stone Hearth · Your stronghold’s heart.':`${t.room??t.terrain} · ${t.claimed?'Claimed':'Unclaimed'}${t.loose?` · ${t.loose} gold awaiting collection`:''}`);}
  rectangle(a:Point,b:Point){const result:Point[]=[];for(let z=Math.min(a.z,b.z);z<=Math.max(a.z,b.z);z++)for(let x=Math.min(a.x,b.x);x<=Math.max(a.x,b.x);x++)result.push({x,z});return result;}
  draw(){
    this.preview.dispose();this.preview=new TransformNode('preview',this.view.scene);if(!this.hover||this.tool==='inspect')return;
    const cells=this.rectangle(this.start??this.hover,this.hover),room=!['dig','erase'].includes(this.tool),quote=room?roomQuote(this.view.world,this.tool,cells):undefined;
    for(const p of cells){const t=tileAt(this.view.world,p.x,p.z);if(!t?.known)continue;
      const valid=quote?quote.valid:['dirt','rock','gold','gem'].includes(t.terrain);
      const adding=valid&&(!!quote||this.tool==='dig'&&!t.designated);
      const m=this.view.box('selection',p.x,t.terrain==='floor'?.025:1.515,p.z,.95,.02,.95,this.view.material(adding?'preview yes':'preview no',adding?'#8ce3bb':'#e08172',false,.4),this.preview);m.material!.alpha=.42;m.isPickable=false;
    }
    if(quote)this.onChange(`${cells.length} squares · ${quote.cost} gold · ${quote.reason}`);
  }
}
