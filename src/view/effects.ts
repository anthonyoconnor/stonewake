import {MeshBuilder,Vector3,Color3,type Mesh,type PointLight} from '@babylonjs/core';
import type {GameScene} from './scene';

type Particle={mesh:Mesh;velocity:Vector3;life:number;duration:number;size:number;gravity:number};
export class SceneEffects {
  particles:Particle[]=[];beats=new Map<number,number>();lastTime=0;lastSteam=0;
  reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(public view:GameScene){}
  reset(){for(const p of this.particles)p.mesh.dispose();this.particles=[];this.beats.clear();this.lastTime=0;this.lastSteam=0;}
  emit(x:number,y:number,z:number,kind:'dust'|'spark'|'steam'|'research',count:number){
    for(let i=0;i<count;i++){
      let p=this.particles.find(p=>p.life<=0);
      if(!p){if(this.particles.length>=80)return;const mesh=MeshBuilder.CreateSphere('activity particle',{diameter:1,segments:4},this.view.scene);mesh.isPickable=false;this.view.includeGlow(mesh);p={mesh,velocity:new Vector3(),life:0,duration:1,size:1,gravity:0};this.particles.push(p);}
      const spark=kind==='spark',steam=kind==='steam',research=kind==='research',rising=steam||research;p.duration=steam?1.5:research?1.1:spark?.45:.65;p.life=p.duration;p.size=steam?.11:research?.025:spark?.035:.065;p.gravity=rising?0:3;
      p.mesh.material=this.view.material(`effect-${kind}`,steam?'#b8c2bb':research?'#73bfd6':spark?'#ffc276':'#947f60',false,spark||research?1:0);
      p.mesh.position.set(x,y,z);p.mesh.setEnabled(true);p.velocity.set((Math.random()-.5)*(rising?.15:1.3),rising?.3:.6+Math.random()*.8,(Math.random()-.5)*(rising?.15:1.3));
    }
  }
  update(){
    const w=this.view.world,time=w.elapsed,dt=Math.min(.1,Math.max(0,time-this.lastTime));this.lastTime=time;
    const pulse=this.reduced?1:1+Math.sin(time*1.8)*.07;
    const light=this.view.scene.getLightByName('hearth light') as PointLight;light.intensity=1.35*pulse;
    const rune=this.view.materials.get('rune');if(rune)rune.emissiveColor=Color3.FromHexString('#86ebf5').scale(.65*pulse);
    const flame=this.view.materials.get('lantern flame');if(flame)flame.emissiveColor=Color3.FromHexString('#ffc779').scale(this.reduced?.85:.8+Math.sin(time*8)*.05+Math.sin(time*13)*.025);
    if(!this.reduced){
      for(const a of w.agents){const j=a.job;if(!j||a.path.length||!['mine','craft','claim','train','research'].includes(j.kind)){this.beats.delete(a.id);continue;}
        const beat=Math.floor(j.progress*(j.kind==='research'?.7:2));if(this.beats.get(a.id)===beat)continue;this.beats.set(a.id,beat);
        const dx=j.work.x-j.target.x,dz=j.work.z-j.target.z;
        if(j.kind==='research')this.emit(a.x-dx*.3,.78,a.z-dz*.3,'research',1);
        else if(j.kind==='train')this.emit(a.x,.05,a.z,'dust',1);
        else this.emit(j.target.x+dx*.56,j.kind==='mine'?.76:j.kind==='craft'?.68:.08,j.target.z+dz*.56,j.kind==='craft'?'spark':'dust',j.kind==='claim'?2:4);
      }
      if(time-this.lastSteam>.8){this.lastSteam=time;for(const f of w.furnishings)if((f.model??f.kind)==='stove')this.emit(f.x,.8,f.z,'steam',1);}
    }
    for(const p of this.particles)if(p.life>0){
      p.life-=dt;if(p.life<=0){p.mesh.setEnabled(false);continue;}
      p.velocity.y-=p.gravity*dt;p.mesh.position.addInPlace(p.velocity.scale(dt));p.mesh.rotation.x+=dt*2;
      p.mesh.scaling.setAll(p.size*(1+(1-p.life/p.duration)*.6));p.mesh.visibility=Math.min(1,p.life/p.duration*2);
    }
  }
}
