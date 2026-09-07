import {MeshBuilder,TransformNode,Vector3,type Mesh} from '@babylonjs/core';
import type {GameScene} from './scene';
import {characterById} from '../content/characters';
type Model={root:TransformNode;legs:TransformNode[];arm:TransformNode;leftArm:TransformNode;tool:TransformNode;load:TransformNode;shadow:Mesh};
export class ResidentView {
  nodes=new Map<number,Model>();
  constructor(public view:GameScene){}
  reset(){for(const m of this.nodes.values()){m.root.dispose();m.shadow.dispose();}this.nodes.clear();}
  create(id:number,type:string):Model{
    const v=this.view,def=characterById(type)!,engineer=def.appearance==='braids';
    const root=new TransformNode(`dwarf-${id}`,v.scene),cloth=v.material(`${type} cloth`,def.color),skin=v.material('skin','#d2a27b'),leather=v.material('leather','#59402b'),iron=v.material('iron','#637079'),brass=v.material('brass','#b5975d'),hair=v.material('hair','#774325');
    const part=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat=cloth,parent=root)=>{const m=v.box(name,x,y,z,w,h,d,mat,parent);m.isPickable=false;return m;};
    const round=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat=cloth,parent=root)=>{const m=MeshBuilder.CreateSphere(name,{diameter:1,segments:8},v.scene);m.scaling.set(w,h,d);m.position.set(x,y,z);m.parent=parent;m.material=mat;m.isPickable=false;return m;};
    const legs=[-.13,.13].map(x=>{const leg=new TransformNode('leg pivot',v.scene);leg.position.set(x,.25,0);leg.parent=root;round('boot',0,-.14,.045,.23,.24,.34,leather,leg);part('boot cuff',0,-.02,0,.21,.1,.25,iron,leg);return leg;});
    round('tunic',0,.42,0,.52,.45,.39);part('belt',0,.28,0,.47,.075,.38,leather);part('buckle',0,.28,.2,.12,.09,.025,brass);
    round('face',0,.69,.005,.34,.31,.31,skin);round('nose',0,.69,.178,.11,.09,.1,skin);
    for(const x of [-.085,.085]){part('eye',x,.737,.145,.035,.025,.025,v.material('eyes','#242829'));round('ear',x*2,.69,0,.08,.12,.07,skin);}
    const hat=round(engineer?'hair bun':'helmet',0,.835,engineer?-.04:0,engineer?.29:.41,engineer?.26:.22,.36,engineer?hair:iron);
    if(engineer){
      part('apron',0,.39,.18,.37,.36,.045,leather);
      part('tool pack',0,.45,-.23,.31,.34,.16,leather);part('pack brace',0,.45,-.32,.33,.05,.02,brass);
      for(const x of [-.18,.18]){
        for(let i=0;i<4;i++)round('braid',x+Math.sin(i*2)*.018,.67-i*.062,.16,.09,.095,.1,hair);
        part('braid tie',x,.44,.16,.085,.035,.09,brass);
        const goggle=MeshBuilder.CreateTorus('goggle rim',{diameter:.12,thickness:.023,tessellation:12},v.scene);goggle.position.set(x*.48,.83,.174);goggle.rotation.x=Math.PI/2;goggle.parent=root;goggle.material=brass;goggle.isPickable=false;
        round('goggle glass',x*.48,.83,.17,.1,.1,.028,v.material('goggle glass','#405d65'));
      }
    }else{
      const brim=MeshBuilder.CreateCylinder('helmet brim',{height:.035,diameter:.44,tessellation:12},v.scene);brim.position.y=.78;brim.parent=root;brim.material=iron;brim.isPickable=false;
      part('lamp frame',0,.83,.215,.15,.13,.07,brass);part('lamp',0,.83,.255,.105,.085,.02,v.material('lamp','#f8d17b',false,.7));
      for(const x of [-.095,0,.095])round('beard braid',x,.51,.19,.15,.36-Math.abs(x),.16,hair);
      for(const x of [-.1,.1]){part('beard clasp',x,.4,.2,.075,.035,.14,brass);part('shoulder strap',x*1.7,.47,.175,.055,.25,.025,leather);}
    }
    const arms=[-.28,.28].map(x=>{const arm=new TransformNode('arm pivot',v.scene);arm.position.set(x,.57,0);arm.parent=root;round('sleeve',0,-.09,0,.2,.25,.23,cloth,arm);round('glove',0,-.24,.015,.16,.15,.17,engineer?skin:leather,arm);return arm;});
    const tool=new TransformNode('hand tool',v.scene);tool.parent=arms[1];
    part('tool handle',0,-.1,.12,.045,.63,.045,leather,tool);
    if(engineer)part('hammer',0,.18,.12,.25,.15,.12,iron,tool);
    else{
      const pick=MeshBuilder.CreateTube('curved pick',{path:[new Vector3(-.26,.04,.12),new Vector3(-.13,.17,.12),new Vector3(0,.2,.12),new Vector3(.14,.16,.12),new Vector3(.24,.06,.12)],radius:.034,tessellation:5},v.scene);pick.material=iron;pick.parent=tool;pick.isPickable=false;
    }
    const load=new TransformNode('carried riches',v.scene);load.position.set(-.25,.35,-.23);load.parent=root;
    round('gold satchel',0,0,0,.3,.31,.23,leather,load);
    for(let i=0;i<3;i++)part('satchel gold',(i-1)*.06,.15,0,.055,.06,.08,v.material('gold metal','#edb855'),load);
    load.setEnabled(false);hat.rotation.z=.02;
    const shadow=v.shadow(0,0,.88,.73,v.terrainRoot);
    return {root,legs,arm:arms[1],leftArm:arms[0],tool,load,shadow};
  }
  update(){
    const v=this.view,time=v.world.elapsed;
    for(const a of v.world.agents){
      let m=this.nodes.get(a.id);if(!m){m=this.create(a.id,a.type);this.nodes.set(a.id,m);}
      const walking=a.path.length>0,j=a.job,working=!!j&&!walking,phase=time*11+a.id;
      m.root.position.set(a.x,walking?Math.abs(Math.sin(phase))*.025:0,a.z);m.root.rotation.set(0,a.facing,0);
      m.root.scaling.y=1+Math.sin(time*2+a.id)*.008;m.shadow.position.set(a.x,.025,a.z);
      m.legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(phase+i*Math.PI)*.4:0);
      m.arm.rotation.x=walking?Math.sin(phase)*.22:0;m.leftArm.rotation.x=walking?-Math.sin(phase)*.35:0;
      m.tool.setEnabled(!working||!['sleep','eat','claim'].includes(j!.kind));
      if(working&&j){
        if(j.target.x!==j.work.x||j.target.z!==j.work.z)m.root.rotation.y=Math.atan2(j.target.x-j.work.x,j.target.z-j.work.z);
        if(j.kind==='mine'||j.kind==='craft'){
          const swing=Math.sin(j.progress*Math.PI*4);m.arm.rotation.x=-.75+swing*.95;m.leftArm.rotation.x=-.15;m.root.rotation.x=.06+Math.max(0,swing)*.1;
        }else if(j.kind==='claim'){m.root.position.y=-.09;m.root.rotation.x=.35;m.arm.rotation.x=-.9;m.leftArm.rotation.x=-.6;}
        else if(j.kind==='eat'){m.arm.rotation.x=-.9-Math.sin(j.progress*4)*.35;m.leftArm.rotation.x=-.7;}
        else if(j.kind==='sleep'){
          const bed=v.world.furnishings.find(f=>f.id===j.furnishing);
          if(bed){m.root.position.set(bed.x+(bed.rotation?.75:0),.5,bed.z+(bed.rotation?0:.75));m.root.rotation.set(-Math.PI/2,bed.rotation?Math.PI/2:0,0);m.arm.rotation.x=.1;m.leftArm.rotation.x=.1;}
        }
      }
      m.load.setEnabled(a.carrying>0);m.load.rotation.z=walking?Math.sin(phase)*.1:0;
    }
  }
}
