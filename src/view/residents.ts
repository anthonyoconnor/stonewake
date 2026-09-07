import {MeshBuilder,TransformNode} from '@babylonjs/core';
import type {GameScene} from './scene';
export class ResidentView {
  nodes=new Map<number,{root:TransformNode;legs:TransformNode[];arm:TransformNode;load:TransformNode}>();
  constructor(public view:GameScene){}
  update(){
    const v=this.view;
    for(const a of v.world.agents){
      let model=this.nodes.get(a.id);
      if(!model){
        const root=new TransformNode(`dwarf-${a.id}`,v.scene),cloth=v.material('miner cloth','#b78638'),skin=v.material('skin','#cba079'),leather=v.material('leather','#493222'),iron=v.material('iron','#566470');
        const part=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat=cloth,parent=root)=>{const m=v.box(name,x,y,z,w,h,d,mat,parent);m.isPickable=false;return m;};
        const legs=[part('boot',-.13,.12,0,.2,.23,.31,leather),part('boot',.13,.12,0,.2,.23,.31,leather)];
        part('tunic',0,.4,0,.43,.38,.33);part('belt',0,.28,0,.45,.07,.35,leather);part('head',0,.66,0,.29,.23,.28,skin);
        const hat=MeshBuilder.CreateSphere('helmet',{diameter:.39,segments:8},v.scene);hat.scaling.y=.6;hat.position.y=.8;hat.material=iron;hat.parent=root;hat.isPickable=false;
        part('lamp',0,.79,.195,.12,.1,.08,v.material('lamp','#f8d17b',false,.7));
        const beard=MeshBuilder.CreateCylinder('beard',{height:.3,diameterTop:.29,diameterBottom:.08,tessellation:5},v.scene);beard.position.set(0,.51,.21);beard.material=v.material('beard','#774322');beard.parent=root;beard.isPickable=false;
        part('left arm',-.29,.41,0,.15,.34,.18);const arm=new TransformNode('tool arm',v.scene);arm.position.set(.29,.55,0);arm.parent=root;
        part('right arm',0,-.14,0,.15,.3,.18,cloth,arm);part('pick handle',.02,-.1,.12,.04,.65,.04,leather,arm);part('pick head',.02,.2,.12,.37,.07,.08,iron,arm);
        const load=part('gold sack',-.22,.36,-.25,.3,.28,.22,leather);part('satchel gold',-.22,.51,-.25,.2,.06,.13,v.material('gold metal','#ffbf4d'),load);load.setEnabled(false);
        model={root,legs,arm,load};this.nodes.set(a.id,model);
      }
      model.root.position.set(a.x,0,a.z);model.root.rotation.y=a.facing;
      const walking=a.path.length>0;model.legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(v.world.elapsed*11+i*Math.PI)*.45:0);
      model.arm.rotation.x=a.job?.kind==='mine'&&!walking?-.3+Math.sin(v.world.elapsed*8)*.8:0;
      model.load.setEnabled(a.carrying>0);
    }
  }
}
