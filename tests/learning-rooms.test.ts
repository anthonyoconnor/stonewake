import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab} from '../src/content/room-lab.ts';
import {roomById} from '../src/content/rooms.ts';
import {tuning} from '../src/content/tuning.ts';
import {buildRoom,furnish,goldTotal,reclaimQuote,reclaimRoom,roomQuote,roomStats} from '../src/game/rooms.ts';
import {addResidents,tick} from '../src/game/simulation.ts';
import {queueResearch} from '../src/game/research.ts';
import {reachable} from '../src/game/navigation.ts';
import {produceFood} from '../src/game/food.ts';
import {recruitmentStatus} from '../src/game/recruitment.ts';
import {key,tileAt,type World} from '../src/game/types.ts';

const learningRooms=[
 {room:'training',service:'training',type:'warrior',job:'train'},
 {room:'library',service:'research',type:'runesmith',job:'research'}
] as const;
const rect=(x:number,z:number,width=3,depth=3)=>Array.from({length:width*depth},(_,i)=>({x:x+i%width,z:z+Math.floor(i/width)}));
const until=(w:World,condition:()=>boolean,seconds=40)=>{
 for(let i=0;i<seconds*20&&!condition();i++)tick(w,.05);
 assert(condition(),'Expected the autonomous service condition within the simulated time.');
};
const research=(w:World,room:string)=>{if(room==='library'){queueResearch(w,'prospect');queueResearch(w,'haste');}};

test('learning room expansion preserves fittings and refunds only the paid portion',()=>{
 for(const {room,service} of learningRooms){
  const w=createRoomLab(),initial=goldTotal(w),paid=rect(8,5),free=rect(11,5),def=roomById(room)!;
  buildRoom(w,room,paid);
  const original=w.furnishings.filter(f=>f.service===service);
  assert(original.length>0,room);
  assert.equal(goldTotal(w),initial-paid.length*def.cost);
  w.freeRoomBuilding=true;buildRoom(w,room,free);
  assert(original.every(f=>w.furnishings.includes(f)),room);
  assert(roomStats(w,paid[0]).usable.length>=original.length,room);
  assert.equal(reclaimQuote(w,free).refund,0,room);
  const refund=paid.length*Math.floor(def.cost*tuning.reclaimRatio);
  assert.equal(reclaimQuote(w,[...paid,...free]).refund,refund,room);
  reclaimRoom(w,[...paid,...free]);
  assert.equal(w.furnishings.filter(f=>f.service===service).length,0,room);
  assert.equal(goldTotal(w),initial-paid.length*def.cost+refund,room);
  assert([...paid,...free].every(p=>{const t=tileAt(w,p.x,p.z)!;return t.claimed&&!t.room;}),room);
  w.freeRoomBuilding=false;w.allowance=0;
  assert.equal(roomQuote(w,room,paid).valid,false,room);
 }
});

test('learning room corner patches stay distinct and isolated capacity is unusable until its route opens',()=>{
 for(const {room,service,type,job} of learningRooms){
  const w=createRoomLab(),remote=rect(8,4),local=rect(8,13);
  buildRoom(w,room,remote);buildRoom(w,room,local);
  buildRoom(w,room,[{x:11,z:7}]);
  assert.equal(roomStats(w,remote[0]).tiles,remote.length,room);
  assert.equal(roomStats(w,{x:11,z:7}).tiles,1,room);
  const original=roomStats(w,remote[0]).facilities;
  assert(original.length>0,room);
  const barrier=w.tiles.filter(t=>t.z===10&&t.terrain==='floor');
  for(const t of barrier)t.terrain='bedrock';
  addResidents(w,type);Object.assign(w.agents[0],{x:7,z:16});
  assert.equal(roomStats(w,remote[0]).usable.length,0,room);
  assert(roomStats(w,local[0]).usable.length>0,room);
  research(w,room);
  until(w,()=>w.agents[0].job?.kind===job);
  const chosen=w.furnishings.find(f=>f.id===w.agents[0].job?.furnishing)!;
  assert.equal(chosen.service,service);assert(chosen.z>=13,room);
  for(const t of barrier)t.terrain='floor';
  furnish(w);
  assert(original.every(f=>w.furnishings.includes(f)),room);
  assert.equal(roomStats(w,remote[0]).usable.length,original.length,room);
 }
});

test('learning services reserve distinct stations and work squares for simultaneous users',()=>{
 for(const {room,service,type,job} of learningRooms){
  const w=createRoomLab();buildRoom(w,room,rect(7,5,6,4));addResidents(w,type,2);research(w,room);
  until(w,()=>w.agents.filter(a=>a.job?.kind===job).length===2);
  const jobs=w.agents.map(a=>a.job!);
  assert.equal(new Set(jobs.map(j=>j.furnishing)).size,2,room);
  assert.equal(new Set(jobs.map(j=>key(j.work))).size,2,room);
  const narrow=createRoomLab();buildRoom(narrow,room,rect(8,8,1,3));addResidents(narrow,type,2);research(narrow,room);
  const stations=narrow.furnishings.filter(f=>f.service===service);
  assert.equal(stations.length,2,room);
  assert.equal(new Set(stations.map(f=>key(f.access))).size,1,room);
  until(narrow,()=>narrow.agents.some(a=>a.job?.kind===job));
  assert.equal(narrow.agents.filter(a=>a.job?.kind===job).length,1,`${room}: shared access is one simultaneous position`);
 }
});

test('learning furnishings leave a one-square connecting corridor open between wider working wings',()=>{
 for(const {room,service,type} of learningRooms){
  const w=createRoomLab(),left=rect(3,4,4,5),right=rect(10,4,4,5),corridor=rect(7,6,3,1),plot=[...left,...corridor,...right];
  for(const t of w.tiles){t.terrain='bedrock';t.claimed=false;}
  for(const p of plot){const t=tileAt(w,p.x,p.z)!;t.terrain='floor';t.claimed=true;}
  addResidents(w,type);Object.assign(w.agents[0],{x:3,z:6});
  const before=reachable(w,w.agents[0]);
  buildRoom(w,room,plot);
  const after=reachable(w,w.agents[0]);
  assert(corridor.every(p=>after.has(key(p))),room);
  assert.equal(after.size,before.size-w.furnishings.reduce((n,f)=>n+f.cells.length,0),room);
  const stations=w.furnishings.filter(f=>f.service===service);
  assert(stations.some(f=>f.x<7)&&stations.some(f=>f.x>=10),room);
  assert(stations.every(f=>after.has(key(f.access))),room);
 }
});

test('reclaiming active learning rooms releases reservations and preserves progress through rebuilding',()=>{
 for(const {room,type,job} of learningRooms){
  const w=createRoomLab(),plot=rect(8,8);buildRoom(w,room,plot);addResidents(w,type);research(w,room);
  const a=w.agents[0];
  const progress=()=>room==='training'?(a.trainingProgress??0):(w.researchOrders?.find(o=>o.worker===a.id)?.progress??0);
  until(w,()=>a.job?.kind===job&&progress()>.2);
  const oldProgress=progress(),oldLevel=a.trainingLevel??0,order=w.researchOrders?.find(o=>o.worker===a.id);
  reclaimRoom(w,plot);tick(w,.05);
  assert.notEqual(a.job?.kind,job,room);
  assert.equal(w.furnishings.filter(f=>f.room===room).length,0,room);
  if(room==='training')assert.equal(a.trainingProgress,oldProgress);
  else {assert.equal(order!.progress,oldProgress);assert.equal(order!.state,'queued');assert.equal(order!.worker,undefined);}
  buildRoom(w,room,plot);
  until(w,()=>room==='training'?(a.trainingProgress??0)>oldProgress||(a.trainingLevel??0)>oldLevel:(order!.progress>oldProgress||order!.state==='ready'));
 }
});

test('specialist attraction requires food production, stored meals and serving within connected room components',()=>{
 const w=createRoomLab();
 buildRoom(w,'dormitory',rect(13,13,4,4));
 buildRoom(w,'training',rect(7,13));
 buildRoom(w,'kitchen',rect(4,4,1,3));
 const diningPlot=rect(9,4,3,3);buildRoom(w,'kitchen',diningPlot);
 const table=roomStats(w,diningPlot[0]).facilities.find(f=>f.service==='dining')!;
 assert(table);
 const retained=new Set([...table.cells,table.access].map(key));
 reclaimRoom(w,diningPlot.filter(p=>!retained.has(key(p))));
 const serving=roomStats(w,table).facilities;
 assert.equal(serving.length,1);assert.equal(serving[0].service,'dining');
 for(let i=0;i<30;i++)produceFood(w,1);
 assert(w.furnishings.some(f=>f.service==='cooking'&&f.stored>0));
 assert.equal(recruitmentStatus(w,'warrior').eligible,false,'A table cannot serve meals from a separate room component.');
 buildRoom(w,'kitchen',diningPlot);
 for(let i=0;i<30;i++)produceFood(w,1);
 assert.equal(recruitmentStatus(w,'warrior').eligible,true,'A connected, stocked food component supports arrivals.');
 for(const t of w.tiles.filter(t=>t.z===10&&t.terrain==='floor'))t.terrain='bedrock';
 assert(w.furnishings.some(f=>f.service==='cooking'&&f.stored>0));
 assert.match(recruitmentStatus(w,'warrior').message,/food/,'Stock cut off from the Hearth cannot support a new arrival.');
});
