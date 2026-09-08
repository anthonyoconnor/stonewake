import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomLab } from '../src/content/room-lab.ts';
import { createHoundLab } from '../src/content/hound-lab.ts';
import { characterLevel, isAnimal } from '../src/content/characters.ts';
import { tuning } from '../src/content/tuning.ts';
import { addResidents, tick } from '../src/game/simulation.ts';
import {
  enableRecruitment,
  recruitSpecialist,
  recruitmentStatus,
} from '../src/game/recruitment.ts';
import { buildRoom, goldTotal, reclaimRoom } from '../src/game/rooms.ts';
import { assignRoomSupport, foodSupport } from '../src/game/food.ts';
import { canTrain, gainExperience } from '../src/game/progression.ts';
import { damageResident, visible } from '../src/game/spell-effects.ts';
import { addEnemy } from '../src/game/defenses.ts';
import { tickPayday } from '../src/game/wages.ts';
import { chooseScoutJob, sightRadius } from '../src/game/scouting.ts';
import { tileAt, type World, key } from '../src/game/types.ts';
import { rect, run } from './helpers/simulation.ts';

function arrivals(w: World, count: number) {
  if (!w.recruitment) enableRecruitment(w);
  const initial=w.agents.length;
  for (let i = 0; i < count*121 && w.agents.length-initial<count; i++) {
    w.elapsed = w.recruitment!.nextAt;
    recruitSpecialist(w, (type, p) => addResidents(w, type, 1, p) > 0);
    if(w.recruitment!.dormitoryFull)break;
  }
}

test('companion losses and arrival toggles cannot repeatedly displace eligible specialists',()=>{
  const w=createRoomLab();buildRoom(w,'dormitory',rect(8,8,4,2));arrivals(w,1);
  assert.equal(w.agents[0].type,'cave-hound');
  damageResident(w,w.agents[0],1000);tick(w,.05);
  buildRoom(w,'kitchen',[{x:8,z:11}]);buildRoom(w,'workshop',[{x:8,z:12}]);
  enableRecruitment(w,false);enableRecruitment(w,true);arrivals(w,1);
  assert.equal(w.agents[0].type,'engineer');
  arrivals(w,1);assert(w.agents.some(a=>isAnimal(a.type)),'A replacement can arrive after eligible specialist places are filled');
});

test('Dormitory-only arrivals fill paid/free single, strip and irregular layouts with hounds', () => {
  for (const free of [false, true])
    for (const cells of [
      [{ x: 8, z: 8 }],
      rect(8, 8, 1, 8),
      [
        { x: 8, z: 8 },
        { x: 9, z: 8 },
        { x: 8, z: 9 },
        { x: 8, z: 10 },
      ],
    ]) {
      const w = createRoomLab();
      w.freeRoomBuilding = free;
      const before = goldTotal(w);
      buildRoom(w, 'dormitory', cells);
      const paid = goldTotal(w);
      assert(free ? paid === before : paid < before);
      arrivals(w, 12);
      assert.equal(w.agents.length, cells.length);
      assert(w.agents.every((a) => a.type === 'cave-hound'));
      assert.equal(goldTotal(w), paid, 'Automatic arrivals do not charge wages or purchase fees');
      assert.equal(recruitmentStatus(w, 'cave-hound').eligible, false);
      assignRoomSupport(w);
      assert.equal(w.roomServices.filter((s) => s.assigned !== undefined).length, w.agents.length);
      assert(w.agents.every((a) => foodSupport(w, a)?.service === 'rest'));
      w.furnishings = [];
      assert.equal(
        recruitmentStatus(w, 'cave-hound').eligible,
        false,
        'Cosmetic furniture does not affect accommodation',
      );
    }
});

test('hounds eat and rest at their den, never train or collect wages, and lose support when the den is reclaimed', () => {
  const w = createRoomLab();
  buildRoom(w, 'dormitory', [{ x: 8, z: 8 }]);
  buildRoom(w, 'training', [{ x: 9, z: 8 }]);
  addResidents(w, 'cave-hound');
  const a = w.agents[0];
  a.energy = 0.1;
  a.hunger = 0.1;
  run(w, 35);
  assert(a.rested > 0);
  assert(a.meals > 0);
  assert(!a.morale!.active.includes('food'));
  w.elapsed = w.nextPaydayAt;
  tickPayday(w);
  assert.deepEqual(a.pay!.due, []);
  gainExperience(w, a, 10000, 'combat');
  assert.equal(a.level, 1);
  assert.equal(a.experience, 0);
  assert.equal(canTrain(w, a), false);
  reclaimRoom(w, [{ x: 8, z: 8 }]);
  tick(w, 1);
  assert(a.morale!.active.includes('accommodation'));
});

test('hound scouting reveals reachable tunnels, stops at solid rock and returns home without claiming or mining', () => {
  const w = createHoundLab();
  arrivals(w, 1);
  const a = w.agents[0],
    known = w.tiles.filter((t) => t.known).length;
  let scouted = false,
    watched = false;
  const claims = w.tiles.filter((t) => t.claimed).length;
  for (let i = 0; i < 1200; i++) {
    tick(w, 0.05);
    scouted ||= a.job?.kind === 'scout' && a.job.furnishing !== 'home-watch';
    watched ||= a.activity === 'Watching the Hearth';
  }
  assert(scouted);
  assert(watched);
  assert(w.tiles.filter((t) => t.known).length > known);
  assert.equal(w.tiles.filter((t) => t.claimed).length, claims);
  assert(w.agents.every((a) => a.type === 'cave-hound'));
  assert.equal(tileAt(w, 28, 5)!.known, false, 'Rock between passages blocks exploration');
  assert(sightRadius(a) > tuning.sightRadius);
  const sealed = createHoundLab();
  addResidents(sealed, 'cave-hound');
  for (let z = 7; z <= 16; z++) {
    const t = tileAt(sealed, 11, z)!;
    t.terrain = 'rock';
    t.known = true;
  }
  const dog = sealed.agents[0];
  chooseScoutJob(sealed, dog);
  assert(!dog.path.some((p) => p.x > 11));
  run(sealed, 25);
  assert.equal(tileAt(sealed, 22, 10)!.known, false);
});

test('a hound pair fights a real raider while remaining weaker than trained Warriors; death frees its den', () => {
  const w = createRoomLab();
  buildRoom(w, 'dormitory', rect(8, 5, 4, 2));
  addResidents(w, 'cave-hound', 2);
  Object.assign(w.agents[0], { x: 8, z: 9 });
  Object.assign(w.agents[1], { x: 8, z: 10 });
  const enemy = addEnemy(w, { x: 9, z: 9 }, { x: 8, z: 9 })!;
  run(w, 15);
  assert.equal(enemy.health, 0);
  assert(w.agents.length >= 1);
  assert(characterLevel('cave-hound').health < characterLevel('warrior').health);
  assert(characterLevel('cave-hound').damage < characterLevel('warrior').damage);
  assert(w.agents.every((a) => a.level === 1 && a.experience === 0));
  const a = w.agents[0];
  damageResident(w, a, 1000);
  tick(w, 0.05);
  assert(!w.roomServices.some((s) => s.assigned === a.id));
  assert(recruitmentStatus(w, 'cave-hound').eligible);
});
