import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomLab} from '../src/content/room-lab.ts';
import {tuning} from '../src/content/tuning.ts';
import {buildRoom,reclaimRoom} from '../src/game/rooms.ts';
import {addResidents,tick} from '../src/game/simulation.ts';
import {enableRecruitment,hearthArrival,recruitmentStatus} from '../src/game/recruitment.ts';
import {tileAt,type World} from '../src/game/types.ts';
import {rect,run} from './helpers/simulation.ts';
function settlement(){
 const w=createRoomLab();buildRoom(w,'dormitory',rect(2,2,7,5));buildRoom(w,'kitchen',rect(9,2,7,5));buildRoom(w,'training',rect(8,9,3,3));buildRoom(w,'library',rect(13,14,3,3));buildRoom(w,'workshop',rect(8,17,3,3));
 return w;
}
test('specialists arrive through shared eligibility only when enabled and stop at room or bed capacity',()=>{
 const cadence=tuning.recruitmentSeconds;tuning.recruitmentSeconds=1;
 try{
  const w=settlement();run(w,3);assert.equal(w.agents.length,0,'Room laboratory does not silently recruit.');
  for(const type of ['engineer','warrior','runesmith'])assert(recruitmentStatus(w,type).eligible,type);
  enableRecruitment(w);run(w,3.2);assert.deepEqual(new Set(w.agents.map(a=>a.type)),new Set(['engineer','warrior','runesmith']));
  run(w,30);const population=w.agents.length;assert(population<=w.roomServices.filter(f=>f.service==='rest').length);
  assert(['engineer','warrior','runesmith'].every(type=>!recruitmentStatus(w,type).eligible));run(w,5);assert.equal(w.agents.length,population);
 }finally{tuning.recruitmentSeconds=cadence;}
});
test('missing Kitchen support, occupied specialist capacity and an inaccessible Hearth do not qualify arrivals',()=>{
 const w=settlement();
 const kitchen=w.tiles.filter(t=>t.room==='kitchen');reclaimRoom(w,kitchen);
 assert.match(recruitmentStatus(w,'warrior').message,/food/);
 buildRoom(w,'kitchen',kitchen);
 const capacity=recruitmentStatus(w,'warrior').capacity;assert(capacity>0);
 addResidents(w,'warrior',capacity);assert.equal(recruitmentStatus(w,'warrior').eligible,false);
 const approach=hearthArrival(w)!;tileAt(w,approach.x,approach.z)!.terrain='rock';assert.match(recruitmentStatus(w,'runesmith').message,/arrival route/);
 const compact=createRoomLab();buildRoom(compact,'training',[{x:8,z:8}]);
 assert.match(recruitmentStatus(compact,'warrior').message,/bed capacity/);
 buildRoom(compact,'dormitory',[{x:8,z:9}]);buildRoom(compact,'kitchen',[{x:8,z:10}]);
 assert.equal(recruitmentStatus(compact,'warrior').capacity,1);
});
