import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine,Scene} from '@babylonjs/core';
import {Selection} from '../src/ui/selection.ts';
import {actionCursor} from '../src/ui/icons.ts';
import {createWorld} from '../src/game/world.ts';
import {tileAt} from '../src/game/types.ts';
import {addResidents} from '../src/game/simulation.ts';
import {queueResearch} from '../src/game/research.ts';
import {goldTotal} from '../src/game/rooms.ts';

test('first tile locks excavation drag action and cancelling construction restores it',()=>{
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
  assert.equal(tileAt(world,10,10)!.designated,false);assert.equal(tileAt(world,11,10)!.designated,false);
  tileAt(world,11,10)!.designated=true;emit('pointerdown');emit('pointermove',11,10);assert.equal(canvas.style.cursor,actionCursor('dig'));emit('pointerup',11,10);
  assert.equal(tileAt(world,10,10)!.designated,true);assert.equal(tileAt(world,11,10)!.designated,true);
  emit('pointerdown');emit('pointermove',12,10);assert.equal(canvas.style.cursor,actionCursor('erase'));emit('pointerup',12,10);
  assert.equal(tileAt(world,10,10)!.designated,false);assert.equal(tileAt(world,11,10)!.designated,false);assert.equal(tileAt(world,12,10)!.designated,false);
  selection.setTool('treasure');assert.equal(canvas.style.cursor,actionCursor('treasure'));click(7,7);assert.equal(tileAt(world,7,7)!.room,'treasure');
  emit('pointerdown',8,7);emit('pointerdown',8,7,2);emit('pointerup',8,7);assert.equal(tileAt(world,8,7)!.room,undefined);assert.equal(selection.tool,'dig');
  click();assert.equal(tileAt(world,10,10)!.designated,true);
  selection.setTool('treasure');win.dispatchEvent(Object.assign(new Event('keydown'),{key:'Escape'}));assert.equal(selection.tool,'dig');
  emit('pointermove',7,7);assert.equal(canvas.style.cursor,actionCursor('inspect'));click(7,7);assert.deepEqual(selection.selected,{x:7,z:7});
  tileAt(world,12,10)!.known=false;tileAt(world,12,10)!.terrain='floor';emit('pointermove',12,10);assert.equal(canvas.style.cursor,actionCursor('dig'));click(12,10);assert.equal(tileAt(world,12,10)!.designated,true);assert.equal(tileAt(world,12,10)!.known,false);click(12,10);assert.equal(tileAt(world,12,10)!.designated,false);
  selection.setTool('reclaim');click(7,7);assert.equal(tileAt(world,7,7)!.room,undefined);assert.equal(world.allowance,394);
  selection.setTool('wall');click(7,7);assert(tileAt(world,7,7)!.wallPlanned);
  emit('pointerdown',8,7);emit('pointerup',7,7);assert(tileAt(world,7,7)!.wallPlanned);assert(tileAt(world,8,7)!.wallPlanned);
  emit('pointerdown',7,7);emit('pointerup',8,8);assert(!tileAt(world,7,7)!.wallPlanned);assert(!tileAt(world,8,7)!.wallPlanned);assert(!tileAt(world,8,8)!.wallPlanned);
 }finally{scene.dispose();engine.dispose();Reflect.deleteProperty(globalThis,'window');}
});

test('spell pointer targeting casts once on the selected dwarf and cancellation spends nothing',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);
 const world=createWorld({id:'spell-input',name:'Spell input',width:16,height:16,hearth:{x:4,z:4},openings:[[2,2,12,12]],seams:[]});
 for(const t of world.tiles){t.known=true;t.claimed=t.terrain==='floor';}
 addResidents(world,'miner',2);world.agents.forEach((a,i)=>Object.assign(a,{x:8+i*2,z:8}));
 queueResearch(world,'dwarf-haste');world.researchOrders![0].state='ready';
 const canvas=Object.assign(new EventTarget(),{style:{cursor:''},getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){}}),win=new EventTarget();Object.assign(globalThis,{window:win});
 scene.pick=((x:number,y:number)=>({pickedMesh:{metadata:{tile:{x,z:y}}}})) as never;
 const selection=new Selection({scene,world,canvas,box:()=>({material:{}}),material:()=>({})} as never);
 const emit=(type:string,x=8,z=8,button=0)=>canvas.dispatchEvent(Object.assign(new Event(type),{clientX:x,clientY:z,button,pointerId:1}));
 try{
  const gold=goldTotal(world);selection.setTool('dwarf-haste');assert.equal(canvas.style.cursor,'crosshair');
  emit('pointerdown');emit('pointerdown',8,8,2);emit('pointerup');assert.equal(goldTotal(world),gold);assert.equal(world.researchOrders![0].state,'ready');
  selection.setTool('dwarf-haste');emit('pointerdown',12,12);emit('pointerup',12,12);assert.equal(goldTotal(world),gold);
  emit('pointerdown');emit('pointerup');assert.equal(goldTotal(world),gold-25);assert.equal(selection.tool,'dig');assert.equal(world.agents[0].effects?.length,1);assert(!world.agents[1].effects?.length);
  selection.setTool('dwarf-haste');win.dispatchEvent(Object.assign(new Event('keydown'),{key:'Escape'}));assert.equal(selection.tool,'dig');
 }finally{scene.dispose();engine.dispose();Reflect.deleteProperty(globalThis,'window');}
});
