import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, HemisphericLight, DirectionalLight, PointLight, MeshBuilder, StandardMaterial, DynamicTexture, TransformNode, GlowLayer, Mesh } from '@babylonjs/core';
import { type World, type Tile,neighbors } from '../game/types';
import {roomById} from '../content/rooms';
import {surfaceTexture,roomLooks} from './surfaces';
import {SceneEffects} from './effects';
const colors: Record<string,string> = {dirt:'#80654a',rock:'#7e817b',bedrock:'#3e4d58',gold:'#816947',gem:'#394d60',floor:'#7b6b54',unknown:'#121b23'};
export class GameScene {
  engine: Engine; scene: Scene; camera: ArcRotateCamera;
  materials = new Map<string,StandardMaterial>(); terrainRoot: TransformNode; lastRevision=-1;
  tileNodes=new Map<string,{signature:string;node:TransformNode}>(); furnitureRoot?:TransformNode;
  furnitureNodes=new Map<string,{signature:string;node:TransformNode}>();
  effects:SceneEffects;
  glow:GlowLayer;
  constructor(public canvas:HTMLCanvasElement,public world:World) {
    this.engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});
    this.engine.setHardwareScalingLevel(Math.max(1,window.devicePixelRatio/1.5));
    this.scene=new Scene(this.engine);this.scene.clearColor=Color4.FromHexString('#101821ff');
    this.camera=new ArcRotateCamera('camera',-Math.PI/2.4,0.76,25,new Vector3(world.hearth.x,0,world.hearth.z),this.scene);
    this.camera.minZ=0.1;this.camera.maxZ=150;
    const sky=new HemisphericLight('cavern light',new Vector3(0.1,1,0.3),this.scene);sky.intensity=.52;sky.groundColor=Color3.FromHexString('#252b39');
    const sun=new DirectionalLight('warm rim',new Vector3(-0.5,-1,0.7),this.scene);sun.intensity=.88;sun.diffuse=Color3.FromHexString('#ffe2b4');
    const glow=new PointLight('hearth light',new Vector3(world.hearth.x,2.4,world.hearth.z),this.scene);glow.diffuse=Color3.FromHexString('#72dbef');glow.intensity=1.2;glow.range=6;
    this.terrainRoot=new TransformNode('terrain',this.scene);
    this.glow=new GlowLayer('crystal and lamplight',this.scene,{blurKernelSize:24,mainTextureRatio:.25,excludeByDefault:true});this.glow.intensity=.3;
    this.effects=new SceneEffects(this);
    window.addEventListener('resize',()=>this.engine.resize());
    this.refresh();
  }
  material(name:string,color:string,texture=false,emissive=0) {
    if(this.materials.has(name)) return this.materials.get(name)!;
    const m=new StandardMaterial(name,this.scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=new Color3(.08,.08,.08);
    m.emissiveColor=Color3.FromHexString(color).scale(emissive);
    if(texture)m.diffuseTexture=surfaceTexture(this.scene,name);
    if(texture&&name.startsWith('floor-'))m.diffuseColor=Color3.White();
    this.materials.set(name,m);return m;
  }
  box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat:StandardMaterial,parent:TransformNode=this.terrainRoot) {
    const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},this.scene);m.position.set(x,y,z);m.material=mat;m.parent=parent;if(mat.emissiveColor.r+mat.emissiveColor.g+mat.emissiveColor.b>.3)this.includeGlow(m);return m;
  }
  includeGlow(mesh:Mesh){this.glow.addIncludedOnlyMesh(mesh);mesh.onDisposeObservable.addOnce(()=>this.glow.removeIncludedOnlyMesh(mesh));}
  crystal(x:number,y:number,z:number,size:number,color:string,parent:TransformNode=this.terrainRoot) {
    const m=MeshBuilder.CreateCylinder('crystal',{height:size,diameterTop:0,diameterBottom:size*.5,tessellation:5},this.scene);
    m.position.set(x,y,z);m.material=this.material(color,color,false,.45);m.parent=parent;m.isPickable=false;this.includeGlow(m);return m;
  }
  shadow(x:number,z:number,width:number,depth:number,parent:TransformNode){
    let mat=this.materials.get('contact shadow');
    if(!mat){
      mat=this.material('contact shadow','#000000');mat.disableLighting=true;mat.alpha=.44;
      const tex=new DynamicTexture('soft contact',{width:64,height:64},this.scene,false),c=tex.getContext();
      const gradient=c.createRadialGradient(32,32,3,32,32,32);gradient.addColorStop(0,'#000000ff');gradient.addColorStop(1,'#00000000');c.fillStyle=gradient;c.fillRect(0,0,64,64);tex.hasAlpha=true;tex.update();mat.diffuseTexture=tex;mat.useAlphaFromDiffuseTexture=true;
    }
    const m=MeshBuilder.CreateGround('contact shadow',{width,height:depth},this.scene);m.position.set(x,.025,z);m.material=mat;m.parent=parent;m.isPickable=false;return m;
  }
  refresh() {
    if(this.lastRevision===this.world.revision)return;
    this.lastRevision=this.world.revision;
    const root=this.terrainRoot;
    if(!this.tileNodes.size)this.drawHearth();
    for(const t of this.world.tiles){
      const id=`${t.x},${t.z}`,signature=[t.terrain,t.known,t.claimed,t.room,t.loose,t.designated,t.known?neighbors(this.world,t).map(n=>n.terrain+':'+n.known).join():null].join(':');
      const old=this.tileNodes.get(id);if(old?.signature===signature)continue;old?.node.dispose();
      const node=new TransformNode(id,this.scene);node.parent=root;this.terrainRoot=node;this.drawTile(t);this.tileNodes.set(id,{signature,node});
    }
    this.terrainRoot=root;this.drawFurniture();
  }
  drawTile(t:Tile) {
    const type=t.known?t.terrain:'unknown',solid=type!=='floor';
    const room=t.known&&t.room?roomById(t.room):undefined;
    const mesh=this.box(`tile-${t.x}-${t.z}`,t.x,solid?.68:-.12,t.z,.997,solid?1.6:.24,.997,this.material(room?`floor-${room.id}`:type,room?(roomLooks[room.id]?.floor??room.color):colors[type],t.known));
    mesh.metadata={tile:{x:t.x,z:t.z}};
    if(t.designated){const m=this.box('dig designation',t.x,1.49,t.z,.94,.025,.94,this.material('designation','#53d8c6',false,.4));m.material!.alpha=.38;m.isPickable=false;}
    if(!t.known)return;
    if(type==='gold')for(let i=0;i<9;i++){
      const m=this.box('branching gold seam',t.x-.42+i*.105,1.493,t.z+Math.sin(i*1.7+t.x)*.17,.15,.028,.04+(i%3)*.02,this.material('gold metal','#edb855',false,.2));m.rotation.y=Math.sin(i*2)*.9;m.isPickable=false;
      for(const n of neighbors(this.world,t).filter(n=>n.terrain==='floor'&&n.known)){
        const dx=n.x-t.x,dz=n.z-t.z,s=this.box('embedded gold',t.x+dx*.502+(dz?(i%3-1)*.27:0),.23+Math.floor(i/3)*.42,t.z+dz*.502+(dx?(i%3-1)*.27:0),dx?.04:.09+(i%2)*.08,.06+(i%3)*.07,dz?.04:.12,this.material('gold metal','#edb855'));s.rotation.y=i*.2;s.isPickable=false;
      }
    }
    if(type==='gem'){
      for(let i=0;i<5;i++){const m=this.crystal(t.x+Math.sin(i*4)*.27,1.49,t.z+Math.cos(i*4)*.27,.28+i%2*.14,i%2?'#62bad3':'#9b75d5');m.rotation.z=.3*Math.sin(i);}
      for(const n of neighbors(this.world,t).filter(n=>n.terrain==='floor'&&n.known))for(let i=0;i<6;i++){
        const dx=n.x-t.x,dz=n.z-t.z,c=this.crystal(t.x+dx*.48+(dz?(i%2-.5)*.4:0),.27+Math.floor(i/2)*.43,t.z+dz*.48+(dx?(i%2-.5)*.4:0),.27+i%2*.09,i%2?'#6fbaca':'#a183d1');c.rotation.z=dx*.5;c.rotation.x=dz*.5;
      }
    }
    if(type==='floor'&&t.claimed&&!room&&!t.core){const m=this.box('claim inset',t.x,-.003,t.z,.055,.008,.055,this.material('claim','#ac9a72'));m.isPickable=false;}

    if(room)for(const n of neighbors(this.world,t))if(n.known&&n.terrain!=='floor'){
      const dx=n.x-t.x,dz=n.z-t.z,trim=this.material(`wall-${room.id}`,(roomLooks[room.id]?.trim??room.color));
      for(const y of [.25,1.08])this.box('room wall trim',t.x+dx*.485,y,t.z+dz*.485,dx?.045:.98,.07,dz?.045:.98,trim).isPickable=false;
      this.box('wall panel',t.x+dx*.46,.66,t.z+dz*.46,dx?.06:.52,.58,dz?.06:.52,this.material('chest wood','#755334',true)).isPickable=false;
      if(room.id==='workshop')for(const offset of [-.15,.15])this.box('hanging tool',t.x+dx*.41+dz*offset,.68,t.z+dz*.41+dx*offset,dx?.06:.035,.3,dz?.06:.035,trim).isPickable=false;
      if(room.id==='treasure'||room.id==='kitchen'){
        const emblem=MeshBuilder.CreateCylinder('wall emblem',{height:.04,diameter:.28,tessellation:12},this.scene);emblem.position.set(t.x+dx*.4,.68,t.z+dz*.4);emblem.rotation.set(dz?Math.PI/2:0,0,dx?Math.PI/2:0);emblem.material=trim;emblem.parent=this.terrainRoot;emblem.isPickable=false;
      }
    }
    if(type==='floor')for(const n of neighbors(this.world,t))if(n.known&&n.terrain!=='floor'){
      const dx=n.x-t.x,dz=n.z-t.z,shade=this.box('wall foot shadow',t.x+dx*.42,.009,t.z+dz*.42,dx?.16:.997,.01,dz?.16:.997,this.material('wall shade','#191e22'));shade.isPickable=false;
      if((t.x+t.z)%4===0){
        const x=t.x+dx*.4,z=t.z+dz*.4,iron=this.material('lantern frame','#443d31');
        this.box('sconce bracket',x,.92,z,.16,.32,.16,iron).isPickable=false;
        this.box('lantern flame',x-dx*.035,.99,z-dz*.035,.1,.18,.1,this.material('lantern flame','#ffc779',false,.85)).isPickable=false;
        for(const y of [.88,1.11])this.box('lantern cap',x,y,z,.19,.055,.19,iron).isPickable=false;
      }
    }
    if(t.loose)for(let i=0;i<Math.min(8,Math.ceil(t.loose/10));i++){
      const p=MeshBuilder.CreateSphere('loose riches',{diameter:.1+(i%2)*.035,segments:4},this.scene);p.position.set(t.x+Math.sin(i*2)*.18,.07+Math.floor(i/4)*.06,t.z+Math.cos(i*2)*.17-(solid?.65:0));p.material=this.material(t.source==='gem'?'loose gem':'gold metal',t.source==='gem'?'#a38ae3':'#ffbf4d',false,.25);p.parent=this.terrainRoot;p.isPickable=false;
    }
  }
  drawFurniture(){
    this.furnitureRoot??=new TransformNode('furnishings',this.scene);
    const furnitureParent=this.furnitureRoot,ids=new Set(this.world.furnishings.map(f=>f.id));
    for(const [id,old] of this.furnitureNodes)if(!ids.has(id)){old.node.dispose();this.furnitureNodes.delete(id);}
    for(const f of this.world.furnishings){
      const eating=f.service==='dining'&&this.world.agents.some(a=>a.job?.kind==='eat'&&a.job.furnishing===f.id);
      const signature=[f.kind,f.rotation,f.stored,f.output,f.outputCount,eating].join(':');
      const old=this.furnitureNodes.get(f.id);if(old?.signature===signature)continue;old?.node.dispose();
      const node=new TransformNode(`furnishing ${f.id}`,this.scene);node.parent=furnitureParent;
      this.furnitureNodes.set(f.id,{signature,node});this.furnitureRoot=node;
      const wide=f.cells.some(p=>p.x!==f.x),deep=f.cells.some(p=>p.z!==f.z);
      this.shadow(f.x+(wide?.5:0),f.z+(deep?.5:0),wide?2.2:1.2,deep?2.2:1.2,this.furnitureRoot);
      const wood=this.material('chest wood','#60442e',true),metal=this.material('chest iron','#a28a5f');
      if(f.kind==='bed'){
        const bed=new TransformNode(f.id,this.scene);bed.parent=this.furnitureRoot;
        bed.position.set(f.x+(f.rotation?.5:0),0,f.z+(f.rotation?0:.5));bed.rotation.y=f.rotation?Math.PI/2:0;
        const part=(n:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial)=>{this.box(n,x,y,z,w,h,d,m,bed).isPickable=false;};
        part('bed frame',0,.19,0,.75,.22,1.75,wood);part('blanket',0,.34,.17,.68,.14,1.25,this.material('blanket','#6c8278'));part('pillow',0,.37,-.6,.62,.14,.32,this.material('linen','#ddccaa'));
        part('headboard',0,.46,-.83,.76,.48,.08,wood);part('blanket fold',0,.43,-.29,.69,.045,.15,this.material('blanket trim','#b0b18e'));
        for(const x of [-.28,.28])part('woven blanket border',x,.417,.2,.025,.015,1.1,this.material('blanket trim','#b0b18e'));
        for(const x of [-.34,.34])for(const z of [-.82,.82])part('bedpost',x,.3,z,.1,.6,.1,wood);
        continue;
      }
      if(f.room==='kitchen'){
        const root=new TransformNode(f.id,this.scene);root.parent=this.furnitureRoot;root.position.set(f.x,0,f.z);
        const part=(n:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial)=>{this.box(n,x,y,z,w,h,d,m,root).isPickable=false;};
        const cylinder=(n:string,x:number,y:number,z:number,h:number,d:number,m:StandardMaterial)=>{const mesh=MeshBuilder.CreateCylinder(n,{height:h,diameter:d,tessellation:10},this.scene);mesh.position.set(x,y,z);mesh.parent=root;mesh.material=m;mesh.isPickable=false;return mesh;};
        if(f.kind==='mushrooms'){
          part('growing tray',0,.15,0,.82,.3,.82,wood);part('soil',0,.31,0,.72,.03,.72,this.material('soil','#3c3127'));
          for(let i=0;i<f.stored;i++){
            const x=-.22+i%3*.22,z=-.16+Math.floor(i/3)*.32;
            cylinder('mushroom stalk',x,.41,z,.18,.045,this.material('stalk','#e5d3ad'));
            const cap=MeshBuilder.CreateSphere('mushroom cap',{diameter:.2,segments:6},this.scene);cap.position.set(x,.5,z);cap.scaling.y=.55;cap.parent=root;cap.material=this.material(i%2?'red cap':'cream cap',i%2?'#b85b34':'#d6b881');cap.isPickable=false;
          }
        }else if(f.kind==='stove'){
          part('cooking hearth',0,.25,0,.75,.5,.75,this.material('stove stone','#4a504c',true));part('coals',0,.2,-.38,.4,.17,.025,this.material('fire','#ed9b47',false,.6));cylinder('cooking pot',0,.63,0,.24,.46,this.material('pot','#383c3f'));
          if(f.stored)cylinder('prepared food',0,.77,0,.02,.38,this.material('stew','#c8a059'));
        }else if(f.kind==='barrel'){
          cylinder('brew barrel',0,.37,0,.72,.6,wood);
          for(const y of [.13,.59]){const ring=MeshBuilder.CreateTorus('barrel hoop',{diameter:.59,thickness:.045,tessellation:12},this.scene);ring.position.y=y;ring.parent=root;ring.material=metal;ring.isPickable=false;}
          part('tap',0,.24,-.36,.07,.13,.12,metal);
        }else{
          part('tabletop',0,.52,0,.8,.12,.76,wood);for(const x of [-.3,.3])for(const z of [-.27,.27])part('table leg',x,.26,z,.07,.5,.07,wood);
          if(this.world.agents.some(a=>a.job?.kind==='eat'&&a.job.furnishing===f.id))cylinder('meal plate',0,.6,0,.025,.25,this.material('plate','#d4c5a0'));
        }
        continue;
      }
      if(f.room==='workshop'){
        const root=new TransformNode(f.id,this.scene);root.parent=this.furnitureRoot;
        root.position.set(f.x+(f.kind==='assembly'&&!f.rotation?.5:0),0,f.z+(f.kind==='assembly'&&f.rotation?.5:0));root.rotation.y=f.rotation?Math.PI/2:0;
        const part=(n:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial)=>{this.box(n,x,y,z,w,h,d,m,root).isPickable=false;};
        const iron=this.material('workshop iron','#57626a');
        if(f.kind==='anvil'){part('anvil plinth',0,.15,0,.65,.3,.65,wood);part('anvil waist',0,.42,0,.25,.3,.27,iron);part('anvil top',0,.59,0,.7,.12,.32,iron);}
        else{
          const width=f.kind==='assembly'?1.7:.78;
          part('work bench',0,.55,0,width,.17,.7,wood);for(const x of [-width/2+.08,width/2-.08])for(const z of [-.25,.25])part('bench leg',x,.25,z,.09,.5,.09,wood);
          part('vice',.21,.7,0,.16,.18,.23,iron);part('parts tray',-.2,.66,.05,.24,.03,.28,metal);
          for(const x of [-.3,0]){part('bench tool handle',x,.66,-.2,.03,.03,.2,wood);part('bench tool head',x,.69,-.28,.13,.06,.055,iron);}
          if(f.kind==='assembly')for(const x of [-.65,.6]){const gear=MeshBuilder.CreateTorus('mechanism gear',{diameter:.26,thickness:.055,tessellation:8},this.scene);gear.position.set(x,.66,.12);gear.material=metal;gear.parent=root;gear.isPickable=false;}
        }
        if(f.outputCount){
          part('finished assembly',0,.73,.13,.42,.09,.34,f.output==='bolt-trap'?iron:wood);
          if(f.output==='bolt-trap'){
            const spring=MeshBuilder.CreateTorus('trap spring',{diameter:.2,thickness:.035,tessellation:8},this.scene);spring.position.set(0,.82,.13);spring.material=metal;spring.parent=root;spring.isPickable=false;
            part('bolt mechanism',0,.86,.13,.035,.035,.34,iron);
          }else for(const z of [.04,.22])part('door reinforcement',0,.79,z,.4,.03,.045,metal);
        }
        continue;
      }
      this.box('chest',f.x,.23,f.z,.68,.44,.65,wood,this.furnitureRoot).isPickable=false;
      for(const dz of [-.32,.32])this.box('vault rim',f.x,.47,f.z+dz,.71,.075,.05,metal,this.furnitureRoot).isPickable=false;
      this.box('chest lock',f.x,.32,f.z-.337,.12,.16,.035,metal,this.furnitureRoot).isPickable=false;
      for(const dx of [-.23,.23])this.box('chest band',f.x+dx,.46,f.z,.05,.035,.66,metal,this.furnitureRoot).isPickable=false;
      if(f.stored>0)for(let i=0;i<Math.min(7,Math.ceil(f.stored/20));i++)this.box('stored gold',f.x-.2+i%3*.18,.51+Math.floor(i/3)*.075,f.z-.12+Math.floor(i/3)*.12,.15,.07,.1,this.material('gold metal','#ffbf4d'),this.furnitureRoot).isPickable=false;
    }
    this.furnitureRoot=furnitureParent;
    // Static props sharing a material can draw together; animated dwarfs stay separate.
    for(const {node} of this.furnitureNodes.values()){
      if(node.metadata?.merged)continue;
      const groups=new Map<StandardMaterial,Mesh[]>();
      for(const mesh of node.getChildMeshes())if(mesh instanceof Mesh){const mat=mesh.material as StandardMaterial;groups.set(mat,[...(groups.get(mat)??[]),mesh]);}
      for(const [mat,meshes] of groups)if(meshes.length>1){const merged=Mesh.MergeMeshes(meshes,true,true);if(merged){merged.parent=node;merged.isPickable=false;if(mat.emissiveColor.r+mat.emissiveColor.g+mat.emissiveColor.b>.3)this.includeGlow(merged);}}
      node.metadata={merged:true};
    }
  }
  drawHearth() {
    const {x,z}=this.world.hearth;
    const base=MeshBuilder.CreateCylinder('hearth dais',{height:.3,diameter:2.7,tessellation:8},this.scene);base.position.set(x,.15,z);base.material=this.material('hearth stone','#647680',true);base.parent=this.terrainRoot;
    this.shadow(x,z,3.7,3.7,this.terrainRoot);
    for(const diameter of [2.2,2.48]){const ring=MeshBuilder.CreateTorus('runic circle',{diameter,thickness:.025,tessellation:48},this.scene);ring.position.set(x,.32,z);ring.material=this.material('hearth brass','#c2a668',false,.2);ring.parent=this.terrainRoot;ring.isPickable=false;}
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const m=this.box('rune',x+Math.cos(a)*1.04,.32,z+Math.sin(a)*1.04,.18,.04,.1,this.material('rune','#86ebf5',false,.8));m.rotation.y=-a;}
    for(const dx of [-.85,.85])for(const dz of [-.85,.85])this.box('hearth pier',x+dx,.45,z+dz,.3,.9,.3,this.material('hearth stone','#647680',true));
    this.crystal(x,1.25,z,1.75,'#7fdef0');this.crystal(x-.5,.72,z+.2,.7,'#579bd0');this.crystal(x+.4,.65,z-.15,.8,'#86e5d7');
  }
  render(){this.refresh();this.effects.update();this.scene.render();}
  setWorld(world:World){
    this.world=world;this.effects.reset();this.terrainRoot.dispose();this.terrainRoot=new TransformNode('terrain',this.scene);this.tileNodes.clear();this.lastRevision=-1;
    this.furnitureRoot?.dispose();this.furnitureRoot=undefined;this.furnitureNodes.clear();
    const light=this.scene.getLightByName('hearth light') as PointLight;light.position.set(world.hearth.x,2.4,world.hearth.z);
    this.refresh();
  }
}
