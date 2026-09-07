import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab,labLayout} from '../src/content/room-lab.ts';
import {buildRoom,goldTotal} from '../src/game/rooms.ts';
import {addResidents,tick} from '../src/game/simulation.ts';
import {queueCraft} from '../src/game/crafting.ts';
const run=(w:ReturnType<typeof createRoomLab>,seconds:number)=>{for(let i=0;i<seconds*20;i++)tick(w,.05);};
test('staffed Workshop charges once and produces both recipe outputs',()=>{
 const w=createRoomLab();w.freeRoomBuilding=true;buildRoom(w,'workshop',labLayout(w,'L shape'));w.allowance=100;addResidents(w,'engineer');queueCraft(w,'reinforced-door');queueCraft(w,'bolt-trap');run(w,60);
 assert.equal(w.outputs['reinforced-door'],1);assert.equal(w.outputs['bolt-trap'],1);assert.equal(goldTotal(w),5);assert.equal(w.agents[0].crafted,2);
 assert(w.craftOrders.every(o=>o.state==='done'));
});
test('unfunded and unstaffed workshops wait without creating outputs',()=>{
 const w=createRoomLab();w.freeRoomBuilding=true;buildRoom(w,'workshop',labLayout(w,'Compact'));queueCraft(w,'reinforced-door');run(w,20);assert.deepEqual(w.outputs,{});
 w.allowance=0;addResidents(w,'engineer');run(w,20);assert.deepEqual(w.outputs,{});assert.equal(w.craftOrders[0].paid,false);
 w.allowance=40;run(w,40);assert.equal(w.outputs['reinforced-door'],1);assert.equal(goldTotal(w),0);
});
test('interrupted crafting retains paid inputs and can resume at another station',()=>{
 const w=createRoomLab();w.freeRoomBuilding=true;buildRoom(w,'workshop',labLayout(w,'Large hall'));addResidents(w,'engineer');w.allowance=40;queueCraft(w,'reinforced-door');
 for(let i=0;i<500&&!w.craftOrders[0].paid;i++)tick(w,.05);
 assert(w.craftOrders[0].paid);const id=w.agents[0].job!.furnishing;w.furnishings=w.furnishings.filter(f=>f.id!==id);
 run(w,40);assert.equal(w.outputs['reinforced-door'],1);assert.equal(goldTotal(w),0);
});
