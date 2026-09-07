import {test} from 'node:test';
import assert from 'node:assert/strict';
import {roomDefinitions,roomById,roomLook} from '../src/content/rooms.ts';
import {characterDefinitions,characterById} from '../src/content/characters.ts';
import {recipes} from '../src/content/recipes.ts';
import {createRoomLab} from '../src/content/room-lab.ts';
import {buildRoom,reclaimRoom,roomStats} from '../src/game/rooms.ts';
import {produceFood} from '../src/game/food.ts';
import {addResidents,tick} from '../src/game/simulation.ts';
import {queueCraft,attractionStatus} from '../src/game/crafting.ts';
import {actionIconSvg} from '../src/ui/icons.ts';
const rect=(x:number,z:number,width:number,depth:number)=>Array.from({length:width*depth},(_,i)=>({x:x+i%width,z:z+Math.floor(i/width)}));
test('an additive food-room definition reuses production, layout, appearance and reclaim services',()=>{
 const copy=structuredClone(roomById('kitchen')!);copy.id='test-canteen';copy.name='Test canteen';copy.furnishings.forEach(f=>{f.model=f.kind;f.kind='canteen-'+f.kind;});roomDefinitions.push(copy);
 try{
  const w=createRoomLab();w.freeRoomBuilding=true;const layout=rect(5,5,6,6);assert.equal(buildRoom(w,copy.id,layout),'Test canteen built.');
  for(let i=0;i<20;i++)produceFood(w,1);
  const stats=roomStats(w,layout[0]);assert(stats.usable.some(f=>f.service==='cooking'&&f.stored>0));assert(stats.usable.some(f=>f.model==='stove'));
  assert.equal(actionIconSvg(copy.id),actionIconSvg('kitchen'));assert.equal(roomLook(copy.id).floor,roomLook('kitchen').floor);
  reclaimRoom(w,layout);assert((w.salvaged?.cooking??0)>0);assert.equal(w.spent,0);
 }finally{roomDefinitions.pop();}
});
test('an additive dwarf and recipe use existing movement, needs, attraction and staffed crafting',()=>{
 const dwarf={...structuredClone(characterById('engineer')!),id:'test-artisan',name:'Test artisan',names:['Ada'],capabilities:['engrave']};characterDefinitions.push(dwarf);
 recipes.push({id:'test-token',name:'Token',cost:13,seconds:1,capability:'engrave'});
 try{
  const w=createRoomLab();buildRoom(w,'kitchen',rect(2,2,6,6));buildRoom(w,'dormitory',rect(10,2,5,5));buildRoom(w,'workshop',rect(8,15,6,5));
  for(let i=0;i<20;i++)produceFood(w,1);assert.equal(attractionStatus(w,dwarf.id),'Room and settlement support are available.');
  addResidents(w,dwarf.id);assert.equal(w.agents[0].name,'Ada');w.agents[0].energy=.1;w.agents[0].hunger=.1;const cost=w.spent;queueCraft(w,'test-token');
  for(let i=0;i<2400;i++)tick(w,.05);assert.equal(w.outputs['test-token'],1);assert.equal(w.spent,cost+13);assert(w.agents[0].rested>0);assert(w.agents[0].meals>0);
 }finally{recipes.pop();characterDefinitions.pop();}
});
