import {hasteRate} from '../game/spell-effects';
import {MeshBuilder,TransformNode,Vector3,Mesh} from '@babylonjs/core';
import type {GameScene} from './scene';
import {characterById} from '../content/characters';
import {characterStats} from '../game/progression';
import type {Resident} from '../game/types';
import {residentSurface,costumeDetails} from './resident-detail';
type Pose={rotation:number[];arms:number[];legs:number[];y:number};
type Model={root:TransformNode;legs:TransformNode[];arm:TransformNode;leftArm:TransformNode;tool:TransformNode;load:TransformNode;shadow:Mesh;trainingWeights:TransformNode[];shield?:TransformNode;book?:TransformNode;actor?:Resident;lastX?:number;lastZ?:number;lastTime?:number;stride:number;walking:boolean;pose?:Pose;removedAt?:number};
export class ResidentView {
  nodes=new Map<number,Model>();
  reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  constructor(public view:GameScene){}
  reset(){for(const m of this.nodes.values()){m.root.dispose();m.shadow.dispose();}this.nodes.clear();}
  create(id:number,type:string):Model{
    const v=this.view,def=characterById(type)!,engineer=def.appearance==='braids',warrior=def.appearance==='warrior',runesmith=def.appearance==='runesmith';
    const root=new TransformNode(`dwarf-${id}`,v.scene),cloth=residentSurface(v,`${type} cloth`,def.color),skin=residentSurface(v,'skin','#c99a76'),leather=residentSurface(v,'leather','#513c2c'),iron=residentSurface(v,'steel','#56636a',true),brass=residentSurface(v,'brass','#a48a55',true);
    const hair=residentSurface(v,`${type} hair`,warrior?'#302e2c':runesmith?'#b9b7a8':'#694026'),ivory=residentSurface(v,'ivory','#c4bb9d');
    const part=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat=cloth,parent=root)=>{const m=v.box(name,x,y,z,w,h,d,mat,parent);m.isPickable=false;return m;};
    const round=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat=cloth,parent=root)=>{const m=MeshBuilder.CreateSphere(name,{diameter:1,segments:8},v.scene);m.scaling.set(w,h,d);m.position.set(x,y,z);m.parent=parent;m.material=mat;m.isPickable=false;return m;};
    const legs=[-.13,.13].map(x=>{const leg=new TransformNode('leg pivot',v.scene);leg.position.set(x,.25,0);leg.parent=root;round('boot',0,-.14,.045,.23,.24,.34,leather,leg);part('boot cuff',0,-.02,0,.21,.1,.25,iron,leg);return leg;});
    const tunic=MeshBuilder.CreateLathe('tailored tunic',{shape:[new Vector3(0,.2,0),new Vector3(.24,.21,0),new Vector3(.25,.3,0),new Vector3(.27,.47,0),new Vector3(.23,.58,0),new Vector3(.12,.63,0),new Vector3(0,.63,0)],tessellation:12,cap:Mesh.CAP_ALL},v.scene);tunic.scaling.z=.76;tunic.material=cloth;tunic.parent=root;tunic.isPickable=false;
    part('belt',0,.28,0,.47,.075,.38,leather);part('buckle',0,.28,.2,.12,.09,.025,brass);
    round('face',0,.69,.005,.34,.31,.31,skin);round('nose',0,.69,.178,.11,.09,.1,skin);
    for(const x of [-.085,.085]){part('eye',x,.737,.145,.035,.025,.025,v.material('eyes','#242829'));round('ear',x*2,.69,0,.08,.12,.07,skin);}
    const hat=round(engineer?'hair bun':runesmith?'scholar hair':'helmet',0,.835,engineer||runesmith?-.04:0,engineer?.29:runesmith?.34:.41,engineer?.26:.22,.36,engineer||runesmith?hair:iron);
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
      if(!runesmith){
        const brim=MeshBuilder.CreateCylinder('helmet brim',{height:.035,diameter:.44,tessellation:12},v.scene);brim.position.y=.78;brim.parent=root;brim.material=iron;brim.isPickable=false;
        if(warrior){part('helmet center band',0,.882,0,.045,.14,.355,brass);part('helmet brow',0,.795,.176,.36,.045,.04,brass);}
        else{part('lamp frame',0,.83,.215,.15,.13,.07,brass);part('lamp',0,.83,.255,.105,.085,.02,v.material('lamp','#f8d17b',false,.7));}
      }
      for(const x of [-.095,0,.095])round('beard braid',x,.51,.19,.15,.36-Math.abs(x),.16,hair);
      for(const x of [-.1,.1]){part('beard clasp',x,.4,.2,.075,.035,.14,brass);part('shoulder strap',x*1.7,.47,.175,.055,.25,.025,leather);}
      if(warrior){
        part('breastplate',0,.44,.14,.43,.31,.12,iron);part('backplate',0,.47,-.19,.4,.3,.065,iron);
        for(const x of [-.2,0,.2])part('layered armor skirt',x,.27,.17,.14,.17,.075,iron);
        for(const x of [-.17,.17])for(const y of [.36,.55])round('armor rivet',x,y,.209,.035,.035,.02,brass);
      }
      if(runesmith){
        round('scholar robe',0,.29,0,.55,.36,.43);part('scholar mantle',0,.55,-.2,.5,.31,.075,cloth);
        for(const x of [-.24,.24]){const trim=part('ivory mantle border',x,.55,.025,.065,.22,.37,ivory);trim.rotation.z=-Math.sign(x)*.23;}
        part('robe hem',0,.15,.04,.52,.055,.39,ivory);part('scholar belt pouch',.25,.33,-.12,.13,.2,.12,leather);
        part('back rune stem',0,.51,-.244,.02,.19,.018,brass);part('back rune cross',0,.53,-.244,.12,.02,.018,brass).rotation.z=.65;
      }
    }
    const arms=[-.28,.28].map(x=>{const arm=new TransformNode('arm pivot',v.scene);arm.position.set(x,.57,0);arm.parent=root;round('sleeve',0,-.09,0,.2,.25,.23,cloth,arm);round('glove',0,-.24,.015,.16,.15,.17,engineer?skin:leather,arm);return arm;});
    if(warrior)for(const arm of arms){round('steel shoulder plate',0,-.015,0,.28,.2,.3,iron,arm);part('steel arm plate',0,-.16,.06,.19,.11,.19,iron,arm);}
    if(runesmith)for(const arm of arms)part('embroidered cuff',0,-.19,0,.2,.06,.23,ivory,arm);
    const tool=new TransformNode('hand tool',v.scene);tool.parent=arms[1];
    if(!runesmith)part('tool handle',0,-.1,.12,.045,.63,.045,leather,tool);
    if(engineer)part('hammer',0,.18,.12,.25,.15,.12,iron,tool);
    else if(warrior){
      part('axe eye',0,.17,.12,.11,.13,.13,iron,tool);
      const blade=MeshBuilder.CreateCylinder('axe blade',{height:.075,diameter:.34,tessellation:6},v.scene);blade.scaling.z=.65;blade.rotation.x=Math.PI/2;blade.position.set(.14,.15,.12);blade.parent=tool;blade.material=iron;blade.isPickable=false;
      part('axe edge',.26,.15,.12,.045,.27,.08,brass,tool);
    }else if(!runesmith){
      const pick=MeshBuilder.CreateTube('curved pick',{path:[new Vector3(-.26,.04,.12),new Vector3(-.13,.17,.12),new Vector3(0,.2,.12),new Vector3(.14,.16,.12),new Vector3(.24,.06,.12)],radius:.034,tessellation:5},v.scene);pick.material=iron;pick.parent=tool;pick.isPickable=false;
    }
    let shield:TransformNode|undefined,book:TransformNode|undefined;
    if(warrior){
      shield=new TransformNode('warrior shield',v.scene);shield.parent=arms[0];shield.position.set(-.09,-.16,.07);shield.rotation.y=-.45;
      part('shield boards',0,0,0,.4,.56,.075,leather,shield);
      for(const x of [-.18,.18])part('shield side band',x,0,.044,.045,.58,.03,iron,shield);
      for(const y of [-.25,.25])part('shield cross band',0,y,.044,.4,.055,.03,iron,shield);
      part('shield boss',0,0,.064,.14,.14,.035,brass,shield).rotation.z=Math.PI/4;
    }
    if(runesmith){
      book=new TransformNode('held rune book',v.scene);book.parent=root;book.position.set(0,.49,.32);book.rotation.x=-.28;
      part('rune book binding',0,0,0,.51,.055,.34,leather,book);
      for(const side of [-1,1]){
        part('rune book page',side*.12,.041,0,.23,.025,.31,ivory,book).rotation.z=side*.12;
        for(let i=0;i<3;i++)part('book ink',side*.12,.058,-.09+i*.085,.14,.008,.012,v.material('book ink','#518b9e'),book);
      }
    }
    const trainingWeights=arms.map(arm=>{
      const weight=new TransformNode('hand training weight',v.scene);weight.parent=arm;weight.position.set(0,-.25,.015);
      part('weight grip',0,0,0,.29,.045,.045,brass,weight);
      for(const x of [-.13,.13])part('hand weight plate',x,0,0,.07,.18,.18,iron,weight);
      weight.setEnabled(false);return weight;
    });
    const load=new TransformNode('carried riches',v.scene);load.position.set(-.25,.35,-.23);load.parent=root;
    round('gold satchel',0,0,0,.3,.31,.23,leather,load);
    for(let i=0;i<3;i++)part('satchel gold',(i-1)*.06,.15,0,.055,.06,.08,v.material('gold metal','#edb855'),load);
    load.setEnabled(false);hat.rotation.z=.02;
    costumeDetails(v,root,type,legs,arms,shield,book);
    // Merge stationary pieces within each animated pivot, keeping equipment toggles independent.
    const pivots=[root,...root.getDescendants(false).filter((n):n is TransformNode=>n instanceof TransformNode&&!(n instanceof Mesh))];
    for(const pivot of pivots){
      const groups=new Map<Mesh['material'],Mesh[]>();
      for(const mesh of pivot.getChildMeshes(true))if(mesh instanceof Mesh&&mesh.material)groups.set(mesh.material,[...(groups.get(mesh.material)??[]),mesh]);
      for(const [material,meshes] of groups)if(meshes.length>1){
        const inverse=pivot.computeWorldMatrix(true).clone().invert();
        const merged=Mesh.MergeMeshes(meshes,true,true);
        if(merged){merged.bakeTransformIntoVertices(inverse);merged.parent=pivot;merged.isPickable=false;const mat=material as typeof cloth;if(mat.emissiveColor.r+mat.emissiveColor.g+mat.emissiveColor.b>.3)v.includeGlow(merged);}
      }
    }
    const shadow=v.shadow(0,0,.88,.73,v.terrainRoot);
    return {root,legs,arm:arms[1],leftArm:arms[0],tool,load,shadow,trainingWeights,shield,book,stride:id,walking:false};
  }
  update(){
    const v=this.view,time=v.world.elapsed;
    for(const [id,m] of this.nodes)if(!v.world.agents.some(a=>a.id===id)){
      if((m.actor?.health??1)<=0){
        m.removedAt??=time;const age=time-m.removedAt;
        m.root.rotation.z=Math.min(1,age/.55)*Math.PI/2;m.root.position.y=-Math.min(.12,age*.2);
        m.tool.setEnabled(false);m.load.setEnabled(false);m.book?.setEnabled(false);
        for(const weight of m.trainingWeights)weight.setEnabled(false);
        if(age<2)continue;
      }
      m.root.dispose();m.shadow.dispose();this.nodes.delete(id);
    }
    for(const a of v.world.agents){
      let m=this.nodes.get(a.id);if(!m){m=this.create(a.id,a.type);this.nodes.set(a.id,m);}
      const dt=Math.max(0,Math.min(.15,time-(m.lastTime??time))),distance=Math.hypot(a.x-(m.lastX??a.x),a.z-(m.lastZ??a.z));
      if(dt>0){m.walking=distance>.0005;m.stride+=distance*9;}
      m.lastTime=time;m.lastX=a.x;m.lastZ=a.z;m.actor=a;
      const walking=m.walking,j=a.job,working=!!j&&!a.path.length&&!walking,phase=m.stride,reduced=this.reduced.matches;
      m.root.position.set(a.x,walking?Math.abs(Math.sin(phase))*.025:0,a.z);m.root.rotation.set(0,a.facing,0);
      m.root.scaling.y=1+(reduced?0:Math.sin(time*2+a.id)*.008);m.shadow.position.set(a.x,.025,a.z);
      m.legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(phase+i*Math.PI)*.4:0);
      m.arm.rotation.x=walking?Math.sin(phase)*.22:0;m.leftArm.rotation.x=walking?-Math.sin(phase)*.35:0;
      m.arm.rotation.z=0;m.leftArm.rotation.z=0;
      const handsFree=working&&['sleep','eat','claim','train','research'].includes(j!.kind);
      m.tool.setEnabled(!handsFree);m.shield?.setEnabled(!handsFree);
      for(const weight of m.trainingWeights)weight.setEnabled(false);
      m.book?.setEnabled(a.activity!=='Fighting'&&!a.carrying&&(!working||j?.kind==='idle'||j?.kind==='research'));
      if(m.book&&m.book.isEnabled()){m.arm.rotation.x=-.78;m.leftArm.rotation.x=-.78;m.book.rotation.z=walking?Math.sin(phase)*.025:0;}
      if(working&&j){
        // Keep room activities readable beside cosmetic props, within the real service tile.
        if(['sleep','eat','craft','train','research'].includes(j.kind)){
          const decoration=v.world.furnishings.find(f=>f.cells.some(p=>p.x===Math.round(a.x)&&p.z===Math.round(a.z)));
          if(decoration){m.root.position.x+=Math.sign(decoration.access.x-a.x)*.25;m.root.position.z+=Math.sign(decoration.access.z-a.z)*.25;}
        }
        if(j.target.x!==j.work.x||j.target.z!==j.work.z)m.root.rotation.y=Math.atan2(j.target.x-j.work.x,j.target.z-j.work.z);
        if(j.kind==='mine'||j.kind==='craft'||j.kind==='reinforce'||j.kind==='buildWall'||j.kind==='buildBridge'){
          const swing=Math.sin(j.progress*Math.PI*4);m.arm.rotation.x=-.75+swing*.95;m.leftArm.rotation.x=-.15;m.root.rotation.x=.06+Math.max(0,swing)*.1;
        }else if(j.kind==='claim'){m.root.position.y=-.09;m.root.rotation.x=.35;m.arm.rotation.x=-.9;m.leftArm.rotation.x=-.6;}
        else if(j.kind==='train'){
          const lift=a.id%2===0,cycle=Math.sin(j.progress*4);
          for(const weight of m.trainingWeights)weight.setEnabled(lift);
          m.arm.rotation.x=lift?-.9-cycle*.65:-.8+cycle*.7;m.leftArm.rotation.x=lift?m.arm.rotation.x:-.8-cycle*.7;
          m.arm.rotation.z=lift?.28:.08;m.leftArm.rotation.z=lift?-.28:-.08;m.root.position.y=lift?-.025*(1+cycle):0;m.root.rotation.x=lift?.06:.1;
        }
        else if(j.kind==='research'){m.arm.rotation.x=-.88-Math.sin(j.progress*2)*.12;m.leftArm.rotation.x=-.75;m.root.rotation.x=.08;m.root.rotation.z=Math.sin(j.progress*1.2)*.02;}
        else if(j.kind==='eat'){m.arm.rotation.x=-.9-Math.sin(j.progress*4)*.35;m.leftArm.rotation.x=-.7;}
        else if(j.kind==='sleep'){
          m.root.position.y=.22;m.root.rotation.set(-Math.PI/2,a.facing,0);m.arm.rotation.x=.1;m.leftArm.rotation.x=.1;
        }
      }
      if(j?.kind==='activate'&&working){m.tool.setEnabled(false);m.shield?.setEnabled(false);m.arm.rotation.x=-1.15;m.leftArm.rotation.x=-1.15;m.root.rotation.x=.08;}
      if(a.activity==='Fighting'){
        const interval=characterStats(a).attackSeconds/hasteRate(v.world,a),age=Math.max(0,time-((a.nextAttackAt??time)-interval));
        const strike=Math.max(0,1-age/.35);m.arm.rotation.x=-.45-strike*1.5;m.leftArm.rotation.x=-.9;m.root.rotation.y+=strike*.12;
      }
      const recoil=a.hitAt===undefined?0:Math.max(0,1-(time-a.hitAt)/.25);
      if(recoil&&!reduced){m.root.rotation.x-=recoil*.16;m.root.rotation.z+=recoil*.07;}
      m.load.setEnabled(a.carrying>0);m.load.rotation.z=walking&&!reduced?Math.sin(phase)*.1:0;
      if(a.carrying&&walking){m.leftArm.rotation.x=-.35;m.root.rotation.x=.06;}
      if(reduced)m.root.position.y=working&&j?.kind==='sleep'?.22:0;
      // Ease changes between jobs and shortest-path turns, without moving feet away from simulation positions.
      const target:Pose={rotation:[m.root.rotation.x,m.root.rotation.y,m.root.rotation.z],arms:[m.arm.rotation.x,m.arm.rotation.z,m.leftArm.rotation.x,m.leftArm.rotation.z],legs:m.legs.map(l=>l.rotation.x),y:m.root.position.y};
      if(m.pose){
        const blend=1-Math.exp(-dt*16),mix=(before:number,after:number)=>before+(after-before)*blend;
        target.rotation=target.rotation.map((n,i)=>m.pose!.rotation[i]+Math.atan2(Math.sin(n-m.pose!.rotation[i]),Math.cos(n-m.pose!.rotation[i]))*blend);
        target.arms=target.arms.map((n,i)=>mix(m.pose!.arms[i],n));target.legs=target.legs.map((n,i)=>mix(m.pose!.legs[i],n));target.y=mix(m.pose.y,target.y);
      }
      m.pose=target;m.root.rotation.set(target.rotation[0],target.rotation[1],target.rotation[2]);m.root.position.y=target.y;
      m.arm.rotation.x=target.arms[0];m.arm.rotation.z=target.arms[1];m.leftArm.rotation.x=target.arms[2];m.leftArm.rotation.z=target.arms[3];m.legs.forEach((l,i)=>l.rotation.x=target.legs[i]);
      m.shadow.position.x=m.root.position.x;m.shadow.position.z=m.root.position.z;
    }
  }
}
