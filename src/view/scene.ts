import {drawFurnishingModel} from './furnishing-models';
import {tuning} from '../content/tuning';
import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, HemisphericLight, DirectionalLight, PointLight, MeshBuilder, StandardMaterial, DynamicTexture, TransformNode, GlowLayer, Mesh } from '@babylonjs/core';
import { type World, type Tile,neighbors } from '../game/types';
import {roomById,roomLook} from '../content/rooms';
import {surfaceTexture} from './surfaces';
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
    this.camera=new ArcRotateCamera('camera',tuning.initialAngle,tuning.initialTilt,tuning.initialZoom,new Vector3(world.hearth.x,0,world.hearth.z),this.scene);
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
      const id=`${t.x},${t.z}`,signature=[t.terrain,t.known,t.claimed,t.reinforced,t.wallPlanned,t.room,t.loose,t.designated,t.known?neighbors(this.world,t).map(n=>n.terrain+':'+n.known+':'+n.reinforced).join():null].join(':');
      const old=this.tileNodes.get(id);if(old?.signature===signature)continue;old?.node.dispose();
      const node=new TransformNode(id,this.scene);node.parent=root;this.terrainRoot=node;this.drawTile(t);this.tileNodes.set(id,{signature,node});
    }
    this.terrainRoot=root;this.drawFurniture();
  }
  drawTile(t:Tile) {
    const type=t.known?t.terrain:'unknown',solid=type!=='floor';
    const room=t.known&&t.room?roomById(t.room):undefined;
    const rawGround=type==='floor'&&!t.claimed&&!room&&!t.core;
    const mesh=this.box(`tile-${t.x}-${t.z}`,t.x,solid?.68:-.12,t.z,.997,solid?1.6:.24,.997,this.material(room?`floor-${room.id}`:rawGround?'raw ground':t.known&&t.reinforced?'reinforced wall':type,room?(roomLook(room.id).floor??room.color):rawGround?'#956c43':t.known&&t.reinforced?'#7c8588':colors[type],t.known));
    mesh.metadata={tile:{x:t.x,z:t.z}};
    if(t.designated){const m=this.box('dig designation',t.x,1.49,t.z,.94,.025,.94,this.material('designation','#53d8c6',false,.4));m.material!.alpha=.38;m.isPickable=false;}
    if(!t.known)return;
    if(t.wallPlanned){const m=this.box('wall plan',t.x,.22,t.z,.88,.44,.88,this.material('wall blueprint','#86b6cc',false,.25));m.material!.alpha=.4;m.isPickable=false;}
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

    if(room)for(const n of neighbors(this.world,t))if(n.known&&n.reinforced&&n.terrain!=='floor'){
      const dx=n.x-t.x,dz=n.z-t.z,trim=this.material(`wall-${room.id}`,(roomLook(room.id).trim??room.color));
      for(const y of [.25,1.08])this.box('room wall trim',t.x+dx*.485,y,t.z+dz*.485,dx?.045:.98,.07,dz?.045:.98,trim).isPickable=false;
      this.box('wall panel',t.x+dx*.46,.66,t.z+dz*.46,dx?.06:.52,.58,dz?.06:.52,this.material('chest wood','#755334',true)).isPickable=false;
      if(roomLook(room.id).motif==='workshop')for(const offset of [-.15,.15])this.box('hanging tool',t.x+dx*.41+dz*offset,.68,t.z+dz*.41+dx*offset,dx?.06:.035,.3,dz?.06:.035,trim).isPickable=false;
      if(roomLook(room.id).motif==='training'){
        this.box('training banner',t.x+dx*.405,.68,t.z+dz*.405,dx?.025:.34,.5,dz?.025:.34,this.material('training banner','#843f31')).isPickable=false;
        const target=MeshBuilder.CreateTorus('practice wall target',{diameter:.22,thickness:.022,tessellation:16},this.scene);target.position.set(t.x+dx*.38,.7,t.z+dz*.38);target.rotation.set(dz?Math.PI/2:0,0,dx?Math.PI/2:0);target.material=trim;target.parent=this.terrainRoot;target.isPickable=false;
      }
      if(roomLook(room.id).motif==='library'){
        const shelf=this.material('library shelf','#59402d',true);
        for(const y of [.42,.76,1.04])this.box('wall bookshelf',t.x+dx*.405,y,t.z+dz*.405,dx?.15:.76,.045,dz?.15:.76,shelf).isPickable=false;
        for(const y of [.58,.9])for(let i=0;i<7;i++){
          const offset=(i-3)*.091,book=this.material(`book spine ${i%3}`,['#486982','#866143','#647558'][i%3]);
          this.box('wall book',t.x+dx*.415+dz*offset,y,t.z+dz*.415+dx*offset,dx?.09:.065,.19+(i%2)*.035,dz?.09:.065,book).isPickable=false;
        }
      }
      if(['treasure','kitchen'].includes(roomLook(room.id).motif)){
        const emblem=MeshBuilder.CreateCylinder('wall emblem',{height:.04,diameter:.28,tessellation:12},this.scene);emblem.position.set(t.x+dx*.4,.68,t.z+dz*.4);emblem.rotation.set(dz?Math.PI/2:0,0,dx?Math.PI/2:0);emblem.material=trim;emblem.parent=this.terrainRoot;emblem.isPickable=false;
      }
    }
    if(type==='floor')for(const n of neighbors(this.world,t))if(n.known&&n.terrain!=='floor'){
      const dx=n.x-t.x,dz=n.z-t.z,shade=this.box('wall foot shadow',t.x+dx*.42,.009,t.z+dz*.42,dx?.16:.997,.01,dz?.16:.997,this.material('wall shade','#191e22'));shade.isPickable=false;
      if(n.reinforced&&(t.x+t.z)%4===0){
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
      const model=f.model??f.kind;
      const eating=f.service==='dining'&&this.world.agents.some(a=>a.job?.kind==='eat'&&a.job.furnishing===f.id);
      const signature=[model,f.rotation,f.stored,f.output,f.outputCount,eating].join(':');
      const old=this.furnitureNodes.get(f.id);if(old?.signature===signature)continue;old?.node.dispose();
      const node=new TransformNode(`furnishing ${f.id}`,this.scene);node.parent=furnitureParent;
      this.furnitureNodes.set(f.id,{signature,node});this.furnitureRoot=node;
      if(f.id==='hearth-treasury')node.position.y=.3;
      drawFurnishingModel(this,f,node);
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
