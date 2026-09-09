import {TransformNode} from '@babylonjs/core';
import type {GameScene} from './scene';
import {visible} from '../game/spell-effects';
// Freeze the palette/effect lookup at the start of this pass; geometry below is the original source.
const startingSpells:Record<string,{color:string;effect:string}>={
  'dwarf-haste':{color:'#f4ce70',effect:'haste'},'enemy-slow':{color:'#80c8ee',effect:'slow'},
  stoneguard:{color:'#b1bfc7',effect:'shield'},'thunder-rune':{color:'#dcc5ff',effect:'thunder'},
  'runic-barrier':{color:'#79cddd',effect:'barrier'},'mending-rune':{color:'#81d7a1',effect:'mend'},
  'rune-of-reckoning':{color:'#ed9c7b',effect:'reckoning'},'call-to-arms':{color:'#efb65e',effect:'rally'},
};
const spellById=(id:string)=>startingSpells[id];
export class SpellView {
  nodes=new Map<string,TransformNode>();
  constructor(public view:GameScene){}
  reset(){for(const n of this.nodes.values())n.dispose();this.nodes.clear();}
  private model(key:string,id:string,radius=.5){
    let root=this.nodes.get(key);if(root)return root;
    const v=this.view,s=spellById(id)??({
      'spider-web':{color:'#a5c9c5',effect:'slow'},
      'spore-cloud':{color:'#c9b971',effect:'slow'},
    } as Record<string,{color:string;effect:string}>)[id];
    root=new TransformNode(key,v.scene);this.nodes.set(key,root);
    if(!s)return root;
    const mat=v.material('spell '+id,s.color,false,.35);
    const part=(x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const m=v.box(id,x,y,z,sx,sy,sz,mat,root);m.isPickable=false;return m;};
    if(s.effect==='barrier'){
      for(const x of [-.32,0,.32])for(const z of [-.32,0,.32])part(x,.65,z,.3,1.3,.3);
      for(const y of [.2,.65,1.1])part(0,y,-.485,.7,.035,.02);
    }else if(s.effect==='shield'){
      for(const side of [-1,1]){part(side*.25,.6,0,.17,.3,.38);part(side*.14,.72,.18,.24,.14,.1);}
    }else {
      const count=s.effect==='rally'||s.effect==='thunder'?32:12;
      for(let i=0;i<count;i++){const angle=i/count*Math.PI*2;part(Math.cos(angle)*radius,.06,Math.sin(angle)*radius,.09,.035,.09).rotation.y=-angle;}
      if(s.effect==='rally'){part(0,.08,0,.65,.06,.08).rotation.y=Math.PI/4;part(0,.08,0,.65,.06,.08).rotation.y=-Math.PI/4;}
      if(s.effect==='mend')for(const side of [-1,1])part(side*.26,.4,0,.06,.32,.06);
    }
    return root;
  }
  update(){
    const w=this.view.world,used=new Set<string>();
    for(const [prefix,units] of [['dwarf',w.agents],['enemy',w.enemies??[]]] as const)for(const unit of units)for(const e of unit.effects??[]){
      if(e.until<=w.elapsed)continue;const key=prefix+unit.id+e.id;used.add(key);
      const n=this.model(key,e.id);n.position.set(unit.x,0,unit.z);n.rotation.y=unit.facing;n.setEnabled(visible(w,unit));
    }
    for(const [id,p] of [['runic-barrier',w.barrier],['call-to-arms',w.rally]] as const)if(p){
      used.add(id);const n=this.model(id,id,'radius' in p?p.radius:.5);n.position.set(p.x,0,p.z);
    }
    for(const [i,b] of (w.spellBursts??[]).entries()){
      const key='burst'+b.at+i;used.add(key);const n=this.model(key,b.id,b.radius),age=(w.elapsed-b.at)/.7;
      n.position.set(b.x,0,b.z);n.scaling.setAll(1+age*.4);n.setEnabled(age<1);
    }
    for(const [key,n] of this.nodes)if(!used.has(key)){n.dispose();this.nodes.delete(key);}
  }
}

/** Original factory exposed for the permanent comparison studio; geometry above is unchanged. */
export function createStartingSpellModel(view:GameScene,id:string,radius=.5){
  const baseline=new SpellView(view);
  return (baseline as unknown as {model:(key:string,id:string,radius:number)=>TransformNode}).model('starting spell '+id,id,radius);
}
