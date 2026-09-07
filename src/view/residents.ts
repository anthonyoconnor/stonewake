import {MeshBuilder,TransformNode} from '@babylonjs/core';
import type {GameScene} from './scene';
import {characterById} from '../content/characters';
export class ResidentView {
  nodes=new Map<number,{root:TransformNode;legs:TransformNode[];arm:TransformNode;load:TransformNode}>();
  constructor(public view:GameScene){}
  reset(){for(const m of this.nodes.values())m.root.dispose();this.nodes.clear();}
  update(){
    const v=this.view;
    for(const a of v.world.agents){
      let model=this.nodes.get(a.id);
      if(!model){
        const def=characterById(a.type)!,engineer=def.appearance==='braids';
        const root=new TransformNode(`dwarf-${a.id}`,v.scene),cloth=v.material(`${a.type} cloth`,def.color),skin=v.material('skin','#cba079'),leather=v.material('leather','#493222'),iron=v.material('iron','#566470');
        const part=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat=cloth,parent=root)=>{const m=v.box(name,x,y,z,w,h,d,mat,parent);m.isPickable=false;return m;};
        const legs=[part('boot',-.13,.12,0,.2,.23,.31,leather),part('boot',.13,.12,0,.2,.23,.31,leather)];
        part('tunic',0,.4,0,.43,.38,.33);part('belt',0,.28,0,.45,.07,.35,leather);part('head',0,.66,0,.29,.23,.28,skin);
        const hat=MeshBuilder.CreateSphere(engineer?'hair bun':'helmet',{diameter:engineer?.28:.39,segments:8},v.scene);hat.scaling.y=engineer?1:.6;hat.position.y=.8;hat.material=engineer?v.material('hair','#65381f'):iron;hat.parent=root;hat.isPickable=false;
        if(engineer){
          part('apron',0,.36,.18,.34,.4,.035,leather);
          for(const x of [-.19,.19]){part('braid',x,.59,.1,.075,.3,.09,v.material('hair','#65381f'));part('goggle',x*.4,.76,.16,.11,.08,.045,v.material('goggle brass','#b99c62'));}
        }else{
          part('lamp',0,.79,.195,.12,.1,.08,v.material('lamp','#f8d17b',false,.7));
          const beard=MeshBuilder.CreateCylinder('beard',{height:.3,diameterTop:.29,diameterBottom:.08,tessellation:5},v.scene);beard.position.set(0,.51,.21);beard.material=v.material('beard','#774322');beard.parent=root;beard.isPickable=false;
        }
        part('left arm',-.29,.41,0,.15,.34,.18);const arm=new TransformNode('tool arm',v.scene);arm.position.set(.29,.55,0);arm.parent=root;
        part('right arm',0,-.14,0,.15,.3,.18,cloth,arm);part('tool handle',.02,-.1,.12,.04,.65,.04,leather,arm);part('tool head',.02,.2,.12,engineer?.23:.37,engineer?.14:.07,.08,iron,arm);
        const load=part('gold sack',-.22,.36,-.25,.3,.28,.22,leather);part('satchel gold',-.22,.51,-.25,.2,.06,.13,v.material('gold metal','#ffbf4d'),load);load.setEnabled(false);
        model={root,legs,arm,load};this.nodes.set(a.id,model);
      }
      model.root.position.set(a.x,0,a.z);model.root.rotation.y=a.facing;
      model.root.rotation.x=0;
      if(a.job?.kind==='sleep'&&!a.path.length){const bed=v.world.furnishings.find(f=>f.id===a.job?.furnishing);if(bed){model.root.position.set(bed.x+(bed.rotation?.9:0),.47,bed.z+(bed.rotation?0:.95));model.root.rotation.set(-Math.PI/2,bed.rotation?Math.PI/2:0,0);}}
      const walking=a.path.length>0;model.legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(v.world.elapsed*11+i*Math.PI)*.45:0);
      model.arm.rotation.x=(a.job?.kind==='mine'||a.job?.kind==='craft')&&!walking?-.3+Math.sin(v.world.elapsed*8)*.8:0;
      model.load.setEnabled(a.carrying>0);
    }
  }
}
