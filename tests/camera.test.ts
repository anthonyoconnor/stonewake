import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine,Scene,ArcRotateCamera,Vector3} from '@babylonjs/core';
import {CameraControls} from '../src/view/controls.ts';
class TestElement extends EventTarget { closest(){return null;} }

test('camera inputs preserve pan orientation and orbit around a fixed target',()=>{
  const win=Object.assign(new EventTarget(),{innerWidth:1200,innerHeight:800,matches:()=>false});
  const doc=Object.assign(new EventTarget(),{hidden:false,querySelector:()=>null});
  const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}});
  Object.assign(globalThis,{window:win,document:doc,Element:TestElement});
  const engine=new NullEngine();const scene=new Scene(engine);
  const camera=new ArcRotateCamera('test',-Math.PI/2,.76,23,new Vector3(24,0,24),scene);
  const controls=new CameraControls({camera,canvas,world:{width:48,height:48,hearth:{x:24,z:24}}} as never);
  const emit=(target:EventTarget,type:string,values:object={},source?:EventTarget)=>{const event=Object.assign(new Event(type,{cancelable:true}),values);if(source)Object.defineProperty(event,'target',{value:source});return target.dispatchEvent(event);};
  const near=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
  const pose=()=>{camera.getViewMatrix(true);return {position:camera.position.clone(),target:camera.target.clone(),alpha:camera.alpha,beta:camera.beta,radius:camera.radius};};
  try{
    for(const alpha of [-Math.PI/2,0,.8,Math.PI]){
      camera.alpha=alpha;controls.center(24,24);
      for(const code of ['KeyW','KeyA','KeyS','KeyD']){
        const before=pose();emit(win,'keydown',{code});controls.update(.1);emit(win,'keyup',{code});const after=pose();
        near(after.alpha,before.alpha);near(after.beta,before.beta);near(after.radius,before.radius);
        assert(after.target.subtract(before.target).length()>.1);
        assert(after.position.subtract(before.position).subtract(after.target.subtract(before.target)).length()<1e-8);
      }
    }
    camera.alpha=-Math.PI/2;controls.center(24,24);
    for(const [x,y,dx,dz] of [[1,400,-1,0],[1199,400,1,0],[600,1,0,1],[600,799,0,-1]]){
      const before=pose();emit(win,'pointermove',{clientX:x,clientY:y,pointerType:'mouse'},canvas);controls.update(.1);const after=pose();
      near(after.alpha,before.alpha);near(after.beta,before.beta);near(after.radius,before.radius);
      assert((after.target.x-before.target.x)*dx+(after.target.z-before.target.z)*dz>0);
    }
    emit(win,'pointermove',{clientX:150,clientY:400,pointerType:'mouse'});
    let before=pose();controls.update(.1);assert(camera.target.equals(before.target));
    emit(win,'pointermove',{clientX:1,clientY:1,pointerType:'mouse'});controls.update(.1);assert(camera.target.equals(before.target),'Sidebar edges do not pan the world');
    for(const [code,sign] of [['KeyA',-1],['KeyD',1]] as const){
      before=pose();emit(win,'keydown',{code:'ControlLeft'});emit(win,'keydown',{code});controls.update(.1);emit(win,'keyup',{code});emit(win,'keyup',{code:'ControlLeft'});
      const after=pose();assert(after.target.equals(before.target));assert((after.alpha-before.alpha)*sign>0);near(after.beta,before.beta);near(after.radius,before.radius);
    }
    before=pose();emit(canvas,'pointerdown',{button:1,pointerId:1,clientX:600});
    emit(canvas,'pointermove',{buttons:4,pointerId:1,clientX:680,clientY:450});controls.update(.1);
    let after=pose();assert(after.target.equals(before.target));near(after.alpha,before.alpha-.48);near(after.beta,before.beta);near(after.radius,before.radius);
    emit(canvas,'pointerup',{button:1,pointerId:1});emit(canvas,'pointermove',{buttons:0,pointerId:1,clientX:750});near(camera.alpha,after.alpha);
    emit(win,'keydown',{code:'KeyW'});emit(win,'pointermove',{clientX:1,clientY:1,pointerType:'mouse'});emit(win,'blur');before=pose();controls.update(.1);assert(camera.target.equals(before.target));
    controls.center(-100,100);after=pose();near(after.target.x,1);near(after.target.z,46);near(after.alpha,before.alpha);near(after.beta,before.beta);near(after.radius,before.radius);
  }finally{scene.dispose();engine.dispose();for(const k of ['window','document','Element'])Reflect.deleteProperty(globalThis,k);}
});
