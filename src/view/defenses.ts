import {TransformNode,MeshBuilder,type Mesh,type StandardMaterial} from '@babylonjs/core';
import type {GameScene} from './scene';
import {type Defense,type Enemy} from '../game/types';
import {defenseById,defenseDirections} from '../content/defenses';
import {doorIsOpen,isDoor} from '../game/doors';
interface FixtureModel {root:TransformNode;leaf?:TransformNode;lock?:Mesh;cracks?:TransformNode;spikes?:TransformNode;bolt?:TransformNode}
interface RaiderModel {root:TransformNode;legs:TransformNode[];arm:TransformNode}
export class DefenseView {
  fixtures=new Map<number,FixtureModel>();raiders=new Map<number,RaiderModel>();
  constructor(public view:GameScene){}
  reset(){for(const m of this.fixtures.values())m.root.dispose();for(const m of this.raiders.values())m.root.dispose();this.fixtures.clear();this.raiders.clear();}
  private box(parent:TransformNode,name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:StandardMaterial){const m=this.view.box(name,x,y,z,sx,sy,sz,mat,parent);m.isPickable=false;return m;}
  private cone(parent:TransformNode,name:string,x:number,y:number,z:number,height:number,diameter:number,mat:StandardMaterial,top=0){const m=MeshBuilder.CreateCylinder(name,{height,diameterBottom:diameter,diameterTop:top,tessellation:6},this.view.scene);m.parent=parent;m.position.set(x,y,z);m.material=mat;m.isPickable=false;return m;}
  private fixture(d:Defense):FixtureModel {
    const v=this.view,def=defenseById(d.type)!,root=new TransformNode(`defense ${d.id}`,v.scene);root.position.set(d.x,0,d.z);
    const iron=v.material('defense iron','#617783'),dark=v.material('defense dark','#26343c'),wood=v.material('defense wood','#99683d'),gold=v.material('defense brass','#d7ab5b');
    const box=(name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:StandardMaterial,parent=root)=>this.box(parent,name,x,y,z,sx,sy,sz,mat);
    if(def.kind==='door'){
      root.rotation.y=-d.rotation*Math.PI/2;
      for(const z of [-.46,.46]){box('door post',0,.7,z,.2,1.4,.11,iron);box('post foot',0,.08,z,.32,.16,.2,dark);}
      box('door lintel',0,1.39,0,.22,.15,1.04,iron);
      const leaf=new TransformNode('hinged door',v.scene);leaf.parent=root;leaf.position.z=-.39;
      for(let i=0;i<4;i++)box('door panel',0,.66,.095+i*.195,.13,1.27,.184,def.tier===3?iron:wood,leaf);
      for(let i=0;i<def.tier!;i++)box('door reinforcement',-.085,.24+i*(.9/Math.max(1,def.tier!-1)),.39,.05,.095,.8,def.tier===1?wood:dark,leaf);
      if(def.tier===3){box('steel center ridge',-.11,.66,.39,.065,1.14,.08,gold,leaf);for(const z of [.06,.71])for(const y of [.22,.65,1.09])box('door rivet',-.118,y,z,.055,.055,.055,gold,leaf);}
      const lock=box('locked padlock',-.16,.66,.65,.14,.2,.16,gold,leaf);
      const cracks=new TransformNode('door splinters',v.scene);cracks.parent=leaf;
      for(const z of [.24,.47])box('broken panel seam',-.105,.79,z,.025,.61,.027,dark,cracks).rotation.x=z===.24?.25:-.3;
      return {root,leaf,lock,cracks};
    }
    box('trap plate',0,.04,0,.88,.08,.88,dark);
    for(const x of [-.37,.37])for(const z of [-.37,.37])box('trap bolt',x,.093,z,.07,.035,.07,gold);
    if(def.kind==='spike'){
      const spikes=new TransformNode('rising spikes',v.scene);spikes.parent=root;
      for(const x of [-.25,0,.25])for(const z of [-.25,0,.25]){box('spike slot',x,.087,z,.13,.01,.13,iron);this.cone(spikes,'spike',x,.33,z,.64,.1,iron);}
      return {root,spikes};
    }
    const facing=defenseDirections[d.rotation];root.rotation.y=Math.atan2(facing.x,facing.z);
    box('crossbow pedestal',0,.15,0,.24,.24,.24,iron);box('crossbow stock',0,.29,0,.11,.12,.62,wood);
    for(const side of [-1,1]){box('crossbow limb',side*.22,.3,.19,.44,.075,.075,iron).rotation.y=side*.35;box('bowstring',side*.17,.3,.02,.39,.018,.018,gold).rotation.y=side*-.55;}
    box('loaded bolt',0,.37,.11,.025,.025,.63,gold);
    box('direction shaft',0,.096,.31,.04,.02,.24,gold);
    for(const side of [-1,1])box('direction head',side*.06,.096,.37,.04,.02,.16,gold).rotation.y=side*-.65;
    const bolt=new TransformNode('fired bolt',v.scene);bolt.parent=root;box('bolt shaft',0,.38,0,.035,.035,.38,gold,bolt);box('bolt tip',0,.38,.21,.07,.04,.12,iron,bolt);
    return {root,bolt};
  }
  private raider(e:Enemy):RaiderModel {
    const v=this.view,root=new TransformNode(`goblin raider ${e.id}`,v.scene);
    const skin=v.material('goblin skin','#8b9352'),cloth=v.material('goblin leather','#615032'),iron=v.material('defense dark','#26343c'),eye=v.material('goblin eyes','#eabd4e',false,.2);
    const box=(name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:StandardMaterial,parent=root)=>this.box(parent,name,x,y,z,sx,sy,sz,mat);
    const legs=[-1,1].map(side=>{const n=new TransformNode('raider leg',v.scene);n.parent=root;n.position.set(side*.13,.3,0);box('goblin shin',0,-.11,0,.14,.25,.16,skin,n);box('goblin foot',0,-.25,.075,.2,.1,.29,skin,n);return n;});
    box('raider tunic',0,.49,0,.42,.39,.31,cloth);box('raider belt',0,.35,0,.45,.07,.34,iron);
    const head=box('goblin head',0,.85,.06,.4,.37,.32,skin);head.rotation.x=.12;
    box('goblin long nose',0,.79,.27,.1,.19,.18,skin);
    for(const side of [-1,1]){const ear=this.cone(root,'long goblin ear',side*.29,.91,.02,.38,.17,skin);ear.rotation.z=-side*1.1;box('goblin eye',side*.11,.86,.229,.07,.035,.025,eye);box('heavy goblin brow',side*.12,.9,.23,.13,.065,.065,skin).rotation.z=side*-.2;box('scrap shoulder',side*.25,.65,0,.17,.2,.3,side===-1?iron:cloth);}
    for(let i=0;i<3;i++)this.cone(root,'goblin crest',(i-1)*.07,1.07,-.015,.22,.11,iron).rotation.x=-.4;
    const shield=box('scrap shield',-.32,.44,.18,.075,.42,.36,cloth);shield.rotation.z=-.1;box('shield boss',-.37,.44,.18,.06,.14,.14,iron);
    const arm=new TransformNode('raider striking arm',v.scene);arm.parent=root;arm.position.set(.28,.65,0);
    box('raider forearm',0,-.14,.025,.13,.29,.14,skin,arm);box('blade grip',0,-.27,.16,.055,.07,.31,cloth,arm);box('hooked blade',0,-.27,.36,.065,.16,.24,iron,arm).rotation.x=-.3;
    return {root,legs,arm};
  }
  update(){
    const w=this.view.world,live=new Set((w.defenses??[]).map(d=>d.id));
    for(const [id,m] of this.fixtures)if(!live.has(id)){m.root.dispose();this.fixtures.delete(id);}
    for(const d of w.defenses??[]){
      let m=this.fixtures.get(d.id);if(!m){m=this.fixture(d);this.fixtures.set(d.id,m);}
      if(isDoor(d)){const angle=doorIsOpen(w,d)?Math.PI/2:0;m.leaf!.rotation.y+=(angle-m.leaf!.rotation.y)*.35;m.lock!.setEnabled(d.mode==='locked');m.cracks!.setEnabled(d.health<d.maxHealth*.6);}
      if(m.spikes){const active=w.elapsed-d.triggeredAt<2;m.spikes.position.y=active?0:-.61;}
      if(m.bolt){const age=w.elapsed-d.triggeredAt;m.bolt.setEnabled(age>=0&&age<.22&&!!d.shotEnd);if(d.shotEnd)m.bolt.position.z=Math.hypot(d.shotEnd.x-d.x,d.shotEnd.z-d.z)*Math.min(1,age/.2);}
    }
    for(const e of w.enemies??[]){
      let m=this.raiders.get(e.id);if(!m){m=this.raider(e);this.raiders.set(e.id,m);}
      const dead=e.health<=0,pinned=e.pinnedUntil>w.elapsed,walking=e.activity==='Approaching',phase=w.elapsed*10+e.id;
      m.root.setEnabled(!dead||w.elapsed-e.diedAt!<3);m.root.position.set(e.x,pinned?.12:dead?.15:0,e.z);m.root.rotation.set(0,e.facing,dead?Math.PI/2:0);
      m.legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(phase+i*Math.PI)*.35:pinned?-.3:0);
      m.arm.rotation.x=e.activity==='Breaking down door'?-1+Math.sin(w.elapsed*8)*.7:pinned?-1.7:walking?Math.sin(phase)*.2:0;
    }
  }
}
