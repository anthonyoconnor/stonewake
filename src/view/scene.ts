import { Engine, Scene, ArcRotateCamera, Vector3, Color3, Color4, HemisphericLight, DirectionalLight, PointLight, MeshBuilder, StandardMaterial, DynamicTexture, TransformNode, type Mesh } from '@babylonjs/core';
import { type World, type Tile,neighbors } from '../game/types';
import {roomById} from '../content/rooms';
const colors: Record<string,string> = {dirt:'#69523c',rock:'#777a77',bedrock:'#35434c',gold:'#ae7a31',gem:'#354661',floor:'#756550',unknown:'#151d25'};
export class GameScene {
  engine: Engine; scene: Scene; camera: ArcRotateCamera;
  materials = new Map<string,StandardMaterial>(); terrainRoot: TransformNode; lastRevision=-1;
  tileNodes=new Map<string,{signature:string;node:TransformNode}>(); furnitureRoot?:TransformNode;
  constructor(public canvas:HTMLCanvasElement,public world:World) {
    this.engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});
    this.engine.setHardwareScalingLevel(Math.max(1,window.devicePixelRatio/1.5));
    this.scene=new Scene(this.engine);this.scene.clearColor=Color4.FromHexString('#101821ff');
    this.camera=new ArcRotateCamera('camera',-Math.PI/2.4,0.76,25,new Vector3(world.hearth.x,0,world.hearth.z),this.scene);
    this.camera.minZ=0.1;this.camera.maxZ=150;
    const sky=new HemisphericLight('cavern light',new Vector3(0.1,1,0.3),this.scene);sky.intensity=.65;sky.groundColor=Color3.FromHexString('#292332');
    const sun=new DirectionalLight('warm rim',new Vector3(-0.5,-1,0.7),this.scene);sun.intensity=.65;sun.diffuse=Color3.FromHexString('#ffe1ac');
    const glow=new PointLight('hearth light',new Vector3(world.hearth.x,2.4,world.hearth.z),this.scene);glow.diffuse=Color3.FromHexString('#72dbef');glow.intensity=1.2;glow.range=6;
    this.terrainRoot=new TransformNode('terrain',this.scene);
    window.addEventListener('resize',()=>this.engine.resize());
    this.refresh();
  }
  material(name:string,color:string,texture=false,emissive=0) {
    if(this.materials.has(name)) return this.materials.get(name)!;
    const m=new StandardMaterial(name,this.scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=new Color3(.08,.08,.08);
    m.emissiveColor=Color3.FromHexString(color).scale(emissive);
    if(texture){
      const tex=new DynamicTexture(`${name}-stone`,{width:128,height:128},this.scene,false);const c=tex.getContext();
      c.fillStyle='#c8c2b7';c.fillRect(0,0,128,128);
      let seed=17;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<120;i++){const x=random()*128,y=random()*128;c.fillStyle=i%3===0?'#9d9589':'#d7d1c5';c.fillRect(x,y,1+random()*4,1+random()*3);}
      c.strokeStyle='#79746b';c.lineWidth=1.6;
      for(let y=0;y<128;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(128,y);c.stroke();for(let x=(y%64?16:0);x<128;x+=40){c.beginPath();c.moveTo(x,y);c.lineTo(x+2,y+32);c.stroke();}}
      tex.update();m.diffuseTexture=tex;
    }
    this.materials.set(name,m);return m;
  }
  box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat:StandardMaterial,parent:TransformNode=this.terrainRoot) {
    const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},this.scene);m.position.set(x,y,z);m.material=mat;m.parent=parent;return m;
  }
  crystal(x:number,y:number,z:number,size:number,color:string,parent:TransformNode=this.terrainRoot) {
    const m=MeshBuilder.CreateCylinder('crystal',{height:size,diameterTop:0,diameterBottom:size*.42,tessellation:5},this.scene);
    m.position.set(x,y,z);m.material=this.material(color,color,false,.45);m.parent=parent;m.isPickable=false;return m;
  }
  refresh() {
    if(this.lastRevision===this.world.revision)return;
    this.lastRevision=this.world.revision;
    const root=this.terrainRoot;
    if(!this.tileNodes.size)this.drawHearth();
    for(const t of this.world.tiles){
      const id=`${t.x},${t.z}`,signature=[t.terrain,t.known,t.claimed,t.room,t.loose,t.designated,t.room?neighbors(this.world,t).map(n=>n.terrain).join():null].join(':');
      const old=this.tileNodes.get(id);if(old?.signature===signature)continue;old?.node.dispose();
      const node=new TransformNode(id,this.scene);node.parent=root;this.terrainRoot=node;this.drawTile(t);this.tileNodes.set(id,{signature,node});
    }
    this.terrainRoot=root;this.drawFurniture();
  }
  drawTile(t:Tile) {
    const type=t.known?t.terrain:'unknown',solid=type!=='floor';
    const room=t.room?roomById(t.room):undefined;
    const mesh=this.box(`tile-${t.x}-${t.z}`,t.x,solid?.68:-.12,t.z,.997,solid?1.6:.24,.997,this.material(room?`floor-${room.id}`:type,room?.color??colors[type],t.known));
    mesh.metadata={tile:{x:t.x,z:t.z}};
    if(!t.known)return;
    if(type==='gold')for(let i=0;i<4;i++) {
      const m=this.box('gold vein',t.x-.33+i*.21,1.49,t.z+Math.sin(t.x+t.z+i)*.26,.1,.035,.35,this.material('gold metal','#ffbf4d',false,.3));m.rotation.y=.5+i*.45;m.isPickable=false;
      if(i<2){const s=this.box('gold face',t.x-.23+i*.45,.8,t.z-.5,.09,.6,.02,this.material('gold metal','#ffbf4d'));s.rotation.z=.3;s.isPickable=false;}
    }
    if(type==='gem')for(let i=0;i<5;i++)this.crystal(t.x+Math.sin(i*4)*.27,1.55,t.z+Math.cos(i*4)*.27,.45+i%2*.2,i%2?'#65c4dd':'#b68be9');
    if(type==='floor'&&t.claimed&&!t.core){const m=this.box('claim inset',t.x,-.004,t.z,.1,.012,.1,this.material('claim','#a69874'));m.isPickable=false;}
    if(t.designated){const m=this.box('dig designation',t.x,1.49,t.z,.94,.025,.94,this.material('designation','#53d8c6',false,.4));m.material!.alpha=.38;m.isPickable=false;}
    if(room)for(const dx of [-.46,.46]){const m=this.box('room inlay',t.x+dx,.007,t.z,.025,.015,.94,this.material(`inlay-${room.id}`,'#d2bc83'));m.isPickable=false;}
    if(room)for(const n of neighbors(this.world,t))if(n.known&&n.terrain!=='floor'){
      const dx=n.x-t.x,dz=n.z-t.z;this.box('room wall trim',t.x+dx*.495,.5,t.z+dz*.495,dx?.045:.98,.12,dz?.045:.98,this.material(`wall-${room.id}`,room.color),this.terrainRoot).isPickable=false;
    }
    if(t.loose)for(let i=0;i<Math.min(8,Math.ceil(t.loose/10));i++){
      const p=MeshBuilder.CreateSphere('loose riches',{diameter:.1+(i%2)*.035,segments:4},this.scene);p.position.set(t.x+Math.sin(i*2)*.18,.07+Math.floor(i/4)*.06,t.z+Math.cos(i*2)*.17-(solid?.65:0));p.material=this.material(t.source==='gem'?'loose gem':'gold metal',t.source==='gem'?'#a38ae3':'#ffbf4d',false,.25);p.parent=this.terrainRoot;p.isPickable=false;
    }
  }
  drawFurniture(){
    this.furnitureRoot?.dispose();this.furnitureRoot=new TransformNode('furnishings',this.scene);
    for(const f of this.world.furnishings){
      const wood=this.material('chest wood','#60442e',true),metal=this.material('chest iron','#a28a5f');
      if(f.kind==='bed'){
        const bed=new TransformNode(f.id,this.scene);bed.parent=this.furnitureRoot;
        bed.position.set(f.x+(f.rotation?.5:0),0,f.z+(f.rotation?0:.5));bed.rotation.y=f.rotation?Math.PI/2:0;
        const part=(n:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial)=>{this.box(n,x,y,z,w,h,d,m,bed).isPickable=false;};
        part('bed frame',0,.19,0,.75,.22,1.75,wood);part('blanket',0,.34,.17,.68,.14,1.25,this.material('blanket','#6c8278'));part('pillow',0,.37,-.6,.62,.14,.32,this.material('linen','#ddccaa'));
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
      this.box('chest',f.x,.23,f.z,.68,.44,.65,wood,this.furnitureRoot).isPickable=false;
      for(const dx of [-.23,.23])this.box('chest band',f.x+dx,.46,f.z,.05,.035,.66,metal,this.furnitureRoot).isPickable=false;
      if(f.stored>0)for(let i=0;i<Math.min(7,Math.ceil(f.stored/20));i++)this.box('stored gold',f.x-.2+i%3*.18,.51+Math.floor(i/3)*.075,f.z-.12+Math.floor(i/3)*.12,.15,.07,.1,this.material('gold metal','#ffbf4d'),this.furnitureRoot).isPickable=false;
    }
  }
  drawHearth() {
    const {x,z}=this.world.hearth;
    const base=MeshBuilder.CreateCylinder('hearth dais',{height:.3,diameter:2.7,tessellation:8},this.scene);base.position.set(x,.15,z);base.material=this.material('hearth stone','#647680',true);base.parent=this.terrainRoot;
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const m=this.box('rune',x+Math.cos(a)*1.04,.32,z+Math.sin(a)*1.04,.18,.04,.1,this.material('rune','#86ebf5',false,.8));m.rotation.y=-a;}
    for(const dx of [-.85,.85])for(const dz of [-.85,.85])this.box('hearth pier',x+dx,.45,z+dz,.3,.9,.3,this.material('hearth stone','#647680',true));
    this.crystal(x,1.25,z,1.75,'#7fdef0');this.crystal(x-.5,.72,z+.2,.7,'#579bd0');this.crystal(x+.4,.65,z-.15,.8,'#86e5d7');
  }
  render(){this.refresh();this.scene.render();}
  setWorld(world:World){
    this.world=world;this.terrainRoot.dispose();this.terrainRoot=new TransformNode('terrain',this.scene);this.tileNodes.clear();this.lastRevision=-1;
    const light=this.scene.getLightByName('hearth light') as PointLight;light.position.set(world.hearth.x,2.4,world.hearth.z);
    this.refresh();
  }
}
