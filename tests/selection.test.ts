import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine,Scene} from '@babylonjs/core';
import {Selection} from '../src/ui/selection.ts';
import {actionCursor} from '../src/ui/icons.ts';
import {createWorld} from '../src/game/world.ts';
import {tileAt} from '../src/game/types.ts';

test('default excavation toggles once per gesture and cancelling construction restores it',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);
 const world=createWorld({id:'selection',name:'Selection',width:16,height:16,hearth:{x:4,z:4},openings:[[2,2,8,8]],seams:[]});
 for(const t of world.tiles){t.known=true;if(t.terrain==='floor')t.claimed=true;}
 const canvas=Object.assign(new EventTarget(),{style:{cursor:''},getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){}});
 const win=new EventTarget();Object.assign(globalThis,{window:win});
 scene.pick=((x:number,y:number)=>({pickedMesh:{metadata:{tile:{x,z:y}}}})) as never;
 const selection=new Selection({scene,world,canvas,box:()=>({material:{}}),material:()=>({})} as never);
 const emit=(type:string,x=10,z=10,button=0)=>canvas.dispatchEvent(Object.assign(new Event(type),{clientX:x,clientY:z,button,pointerId:1}));
 const click=(x=10,z=10)=>{emit('pointerdown',x,z);emit('pointerup',x,z);};
 try{
  assert.equal(selection.tool,'dig');assert.equal(canvas.style.cursor,actionCursor('dig'));emit('pointermove');click();assert.equal(tileAt(world,10,10)!.designated,true);assert.equal(canvas.style.cursor,actionCursor('erase'));click();assert.equal(tileAt(world,10,10)!.designated,false);
  click();emit('pointerdown');emit('pointermove',11,10);emit('pointermove',10,10);emit('pointermove',11,10);emit('pointerup',11,10);
  assert.equal(tileAt(world,10,10)!.designated,false);assert.equal(tileAt(world,11,10)!.designated,true);
  selection.setTool('treasure');assert.equal(canvas.style.cursor,actionCursor('treasure'));click(7,7);assert.equal(tileAt(world,7,7)!.room,'treasure');
  emit('pointerdown',8,7);emit('pointerdown',8,7,2);emit('pointerup',8,7);assert.equal(tileAt(world,8,7)!.room,undefined);assert.equal(selection.tool,'dig');
  click();assert.equal(tileAt(world,10,10)!.designated,true);
  selection.setTool('treasure');win.dispatchEvent(Object.assign(new Event('keydown'),{key:'Escape'}));assert.equal(selection.tool,'dig');
  emit('pointermove',7,7);assert.equal(canvas.style.cursor,actionCursor('inspect'));click(7,7);assert.deepEqual(selection.selected,{x:7,z:7});
  tileAt(world,12,10)!.known=false;tileAt(world,12,10)!.terrain='floor';emit('pointermove',12,10);assert.equal(canvas.style.cursor,actionCursor('dig'));click(12,10);assert.equal(tileAt(world,12,10)!.designated,true);assert.equal(tileAt(world,12,10)!.known,false);click(12,10);assert.equal(tileAt(world,12,10)!.designated,false);
 }finally{scene.dispose();engine.dispose();Reflect.deleteProperty(globalThis,'window');}
});
