import {TransformNode} from '@babylonjs/core';
import {type Point,tileAt} from '../game/types.ts';
import type {GameScene} from '../view/scene';
import {designate} from '../game/simulation.ts';
import {buildRoom,roomQuote,reclaimRoom,reclaimQuote} from '../game/rooms.ts';
import {planWalls,wallEligible,wallBuildDuration} from '../game/walls.ts';
import {actionCursor} from './icons.ts';
import {roomById} from '../content/rooms.ts';
import {defenseById,defenseDirections} from '../content/defenses.ts';
import {placeDefense,defenseQuote} from '../game/defenses.ts';
import {spellById} from '../content/spells.ts';
import {targetAt,spellTargetError,castSpell,type SpellTarget} from '../game/research.ts';
export class Selection {
  tool='dig';dragAdds?:boolean;start?:Point;hover?:Point;selected?:Point;preview:TransformNode;
  onChange:(message:string)=>void=()=>{};
  onInspect:(p:Point)=>void=()=>{};rotation=0;
  onUnitInspect:(target:SpellTarget)=>void=()=>{};
  view:GameScene;
  constructor(view:GameScene){
    this.view=view;
    this.preview=new TransformNode('preview',view.scene);
    this.updateCursor();
    const canvas=view.canvas;
    const pick=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();const hit=view.scene.pick(e.clientX-r.left,e.clientY-r.top,m=>!!m.metadata?.tile);const p=hit?.pickedMesh?.metadata?.tile as Point|undefined;return p&&(tileAt(view.world,p.x,p.z)?.known||this.tool!=='inspect')?p:undefined;};
    canvas.addEventListener('pointerdown',e=>{if(e.button===2){this.setTool('dig');return;}if(e.button!==0)return;this.start=pick(e);const tile=this.start&&tileAt(view.world,this.start.x,this.start.z);this.dragAdds=this.start&&['dig','erase','wall'].includes(this.tool)?this.tool==='wall'?!tile?.wallPlanned:this.tool==='dig'&&!tile?.designated:undefined;this.hover=this.start;this.draw();canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{this.hover=pick(e);this.draw();});
    canvas.addEventListener('pointerup',e=>{
      if(e.button!==0)return;const end=pick(e);
      if(this.start&&end){const points=this.rectangle(this.start,end);
        if(spellById(this.tool)){
          const target=targetAt(view.world,this.tool,end),message=castSpell(view.world,this.tool,target);
          if(message.includes(' cast.')){this.setTool('dig');if(target&&target.kind!=='point')this.onUnitInspect(target);}
          this.onChange(message);
        }
        else if(this.tool==='dig'&&points.length===1&&tileAt(view.world,end.x,end.z)?.known&&tileAt(view.world,end.x,end.z)?.terrain==='floor'){
          const unit=targetAt(view.world,'dwarf-haste',end)??targetAt(view.world,'enemy-slow',end);
          if(unit)this.onUnitInspect(unit);else this.inspect(end);
        }
        else if(this.tool==='dig'||this.tool==='erase'){designate(view.world,points,this.dragAdds??false);this.onChange(this.tool==='dig'?'Excavation updated.':'Excavation marks removed.');}
        else if(this.tool==='wall')this.onChange(planWalls(view.world,points,this.dragAdds??true));
        else if(this.tool==='reclaim')this.onChange(reclaimRoom(view.world,points));
        else if(defenseById(this.tool)){this.onChange(placeDefense(view.world,this.tool,end,this.rotation));this.selected=end;}
        else if(this.tool!=='inspect')this.onChange(buildRoom(view.world,this.tool,points));
        else this.inspect(end);
      }
      this.start=undefined;this.dragAdds=undefined;this.draw(false);
    });
    const cancel=()=>this.setTool('dig');
    canvas.addEventListener('contextmenu',cancel);window.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();if(e.key.toLowerCase()==='r'&&defenseById(this.tool)?.kind==='bolt'&&!(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea,dialog'))){this.rotation=(this.rotation+1)%4;this.draw();}});
  }
  updateCursor(){const tile=this.hover&&tileAt(this.view.world,this.hover.x,this.hover.z);const action=this.tool==='dig'?(this.dragAdds!==undefined?(this.dragAdds?'dig':'erase'):tile?.designated?'erase':tile?.known&&tile.terrain==='floor'?'inspect':'dig'):this.tool;this.view.canvas.style.cursor=spellById(this.tool)?'crosshair':actionCursor(action);}
  setTool(tool:string){this.start=undefined;this.dragAdds=undefined;this.tool=tool;this.draw();this.onChange('');}
  inspect(p:Point){this.selected=p;const t=tileAt(this.view.world,p.x,p.z)!;this.onChange(t.core?`Stone Hearth · Treasury ${this.view.world.roomServices.find(f=>f.id==='hearth-treasury')?.stored??0} / ${this.view.world.roomServices.find(f=>f.id==='hearth-treasury')?.capacity??0} gold`:`${t.room??t.terrain} · ${t.claimed?'Claimed':'Unclaimed'}${t.loose?` · ${t.loose} gold awaiting collection`:''}`);this.onInspect(p);}
  rectangle(a:Point,b:Point){const result:Point[]=[];for(let z=Math.min(a.z,b.z);z<=Math.max(a.z,b.z);z++)for(let x=Math.min(a.x,b.x);x<=Math.max(a.x,b.x);x++)result.push({x,z});return result;}
  draw(feedback=true){
    this.updateCursor();this.preview.dispose();this.preview=new TransformNode('preview',this.view.scene);if(!this.hover||this.tool==='inspect')return;
    const spell=spellById(this.tool);
    if(spell){
      const target=targetAt(this.view.world,spell.id,this.hover),error=spellTargetError(this.view.world,spell.id,target),p=this.hover;
      const mat=this.view.material(error?'spell invalid':`spell ${spell.id}`,error?'#e08172':spell.color,false,.45);
      const radius=spell.radius??.55;
      for(let i=0;i<24;i++){const angle=i/24*Math.PI*2,m=this.view.box('spell target',p.x+Math.cos(angle)*radius,.07,p.z+Math.sin(angle)*radius,.13,.025,.13,mat,this.preview);m.isPickable=false;}
      if(feedback)this.onChange(`${spell.name} · ${error||'Click to cast'} · ${spell.cost} gold`);return;
    }
    const defense=defenseById(this.tool);
    if(defense){
      const p=this.hover,q=defenseQuote(this.view.world,this.tool,p),mat=this.view.material(q.valid?'defense valid':'defense invalid',q.valid?'#8ce3bb':'#e08172',false,.5);
      const part=(x:number,z:number,sx:number,sz:number)=>{const m=this.view.box('defense preview',x,.065,z,sx,.035,sz,mat,this.preview);m.isPickable=false;return m;};
      for(const side of [-1,1]){part(p.x+side*.45,p.z,.04,.94);part(p.x,p.z+side*.45,.94,.04);}
      if(!q.valid){part(p.x,p.z,.95,.045).rotation.y=Math.PI/4;part(p.x,p.z,.95,.045).rotation.y=-Math.PI/4;}
      else if(defense.kind==='door')part(p.x,p.z,q.rotation?.94:.12,q.rotation?.12:.94);
      if(defense.kind==='bolt'){const d=defenseDirections[this.rotation];const shaft=part(p.x+d.x*.2,p.z+d.z*.2,.55,.055);shaft.rotation.y=-this.rotation*Math.PI/2;for(const sign of [-1,1]){const head=part(p.x+d.x*.38+sign*d.z*.07,p.z+d.z*.38-sign*d.x*.07,.24,.045);head.rotation.y=-this.rotation*Math.PI/2+sign*Math.PI/4;}}
      if(feedback)this.onChange(`${defense.name} · ${q.reason}`);return;
    }
    const cells=this.rectangle(this.start??this.hover,this.hover),room=!['dig','erase','wall','reclaim'].includes(this.tool),quote=room?roomQuote(this.view.world,this.tool,cells):undefined;
    const reclaim=this.tool==='reclaim'?reclaimQuote(this.view.world,cells):undefined;
    for(const p of cells){const t=tileAt(this.view.world,p.x,p.z);if(!t||(!t.known&&room))continue;
      const valid=reclaim?reclaim.tiles.includes(t):this.tool==='wall'?wallEligible(this.view.world,t):quote?quote.valid&&quote.tiles.includes(t):!t.known||['dirt','rock','gold','gem'].includes(t.terrain);
      const adding=valid&&(!!quote||this.tool==='wall'&&(this.dragAdds??!t.wallPlanned)||this.tool==='dig'&&(this.dragAdds??!t.designated));
      const m=this.view.box('selection',p.x,t.known&&t.terrain==='floor'?.025:1.515,p.z,.95,.02,.95,this.view.material(adding?'preview yes':'preview no',adding?'#8ce3bb':'#e08172',false,.4),this.preview);m.material!.alpha=.42;m.isPickable=false;
    }
    if(quote&&feedback){const def=roomById(this.tool);this.onChange(`${quote.tiles.length} buildable squares · ${quote.cost} gold · +${quote.addedCapacity} ${def?.service==='storage'?'gold storage':'dwarf capacity'} · ${quote.reason}`);}
    if(reclaim&&feedback)this.onChange(`${reclaim.tiles.length} room squares · ${reclaim.refund} gold refund`);
    if(this.tool==='wall'&&feedback)this.onChange(`Build walls on clear claimed floor · ${wallBuildDuration()} seconds each · Start on a plan to cancel it.`);
  }
}
