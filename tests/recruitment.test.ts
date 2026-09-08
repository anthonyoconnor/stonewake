import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomLab } from '../src/content/room-lab.ts';
import { buildRoom, reclaimRoom } from '../src/game/rooms.ts';
import { addResidents, tick } from '../src/game/simulation.ts';
import {
  enableRecruitment,
  hearthArrival,
  recruitmentStatus,
  recruitSpecialist,
  recruitmentSummary,
} from '../src/game/recruitment.ts';
import { characterById } from '../src/content/characters.ts';
import { queueCraft } from '../src/game/crafting.ts';
import { queueResearch, cancelResearch } from '../src/game/research.ts';
import { damageResident } from '../src/game/spell-effects.ts';
import { tileAt, type World } from '../src/game/types.ts';
import { rect, run } from './helpers/simulation.ts';
function settlement() {
  const w = createRoomLab();
  buildRoom(w, 'dormitory', rect(2, 2, 7, 5));
  buildRoom(w, 'kitchen', rect(9, 2, 7, 5));
  buildRoom(w, 'training', rect(8, 9, 3, 3));
  buildRoom(w, 'library', rect(13, 14, 3, 3));
  buildRoom(w, 'workshop', rect(8, 17, 3, 3));
  return w;
}
// Drive the actual arrival service while keeping jobs/needs out of long composition checks.
function advanceArrivals(w: World, seconds: number) {
  const arrivals: Array<{ type: string; at: number }> = [];
  const end = w.elapsed + seconds;
  while (w.elapsed <= end) {
    recruitSpecialist(w, (type, p) => {
      const ok = addResidents(w, type, 1, p) > 0;
      if (ok) arrivals.push({ type, at: w.elapsed });
      return ok;
    });
    if (w.elapsed === end) break;
    w.elapsed = Math.min(end, w.elapsed + 1);
  }
  return arrivals;
}
const count = (w: World, type: string) => w.agents.filter((a) => a.type === type).length;
test('early hounds arrive every 30 seconds up to real bed capacity, with one full event per episode', () => {
  const w = createRoomLab();
  buildRoom(w, 'dormitory', rect(8, 8, 4, 1));
  run(w, 3);
  assert.equal(w.agents.length, 0);
  enableRecruitment(w);
  assert.deepEqual(advanceArrivals(w, 29), []);
  const arrivals = advanceArrivals(w, 92);
  assert.equal(arrivals.length, 4);
  for (let i = 1; i < arrivals.length; i++) assert.equal(arrivals[i].at - arrivals[i - 1].at, 30);
  assert.equal(count(w, 'cave-hound'), 4);
  assert.equal(w.recruitment!.fullEpisode, 1);
  assert.match(recruitmentSummary(w), /Dormitory is full.*Expand/);
  advanceArrivals(w, 180);
  assert.equal(w.agents.length, 4);
  assert.equal(w.recruitment!.fullEpisode, 1);
  buildRoom(w, 'dormitory', [{ x: 12, z: 8 }]);
  advanceArrivals(w, 1);
  assert.equal(w.agents.length, 5);
  assert.equal(w.recruitment!.fullEpisode, 2);
  damageResident(w, w.agents[0], 1000);
  tick(w, 0.05);
  advanceArrivals(w, 1);
  assert.equal(w.recruitment!.dormitoryFull, false);
  advanceArrivals(w, 31);
  assert.equal(w.agents.length, 5);
  assert.equal(w.recruitment!.fullEpisode, 3);
  assert.equal(characterById('tunnel-badger'), undefined);
});
test('newly supported Warriors reserve the next beds through their cooldown and lead later arrivals', () => {
  const w = createRoomLab();
  buildRoom(w, 'dormitory', rect(2, 2, 5, 2));
  enableRecruitment(w);
  advanceArrivals(w, 91);
  assert.equal(count(w, 'cave-hound'), 3);
  buildRoom(w, 'training', rect(8, 8, 5, 4));
  buildRoom(w, 'kitchen', rect(8, 2, 5, 4));
  const waiting = advanceArrivals(w, 44);
  assert.equal(waiting.length, 0, 'Fast hounds must not take beds reserved for Warriors');
  assert.match(recruitmentSummary(w), /Warrior/);
  const later = advanceArrivals(w, 360);
  assert(later.length > 1);
  assert(later.every((a) => a.type === 'warrior'));
  assert.equal(count(w, 'cave-hound'), 3, 'Existing hounds stay');
  assert.equal(w.recruitment!.dormitoryFull, true);
  buildRoom(w, 'dormitory', rect(2, 4, 5, 2));
  advanceArrivals(w, 600);
  assert(count(w, 'warrior') >= 3 * count(w, 'cave-hound') - 1);
  assert(count(w, 'cave-hound') > 3, 'Soft targets still admit occasional hounds after expansion');
});
test('support roles follow initial staffing and queued work instead of filling every specialist room', () => {
  const w = settlement();
  buildRoom(w, 'training', rect(8, 12, 4, 4));
  enableRecruitment(w);
  const arrivals = advanceArrivals(w, 900);
  assert.equal(count(w, 'engineer'), 1);
  assert.equal(count(w, 'runesmith'), 1);
  assert(count(w, 'warrior') > count(w, 'cave-hound'));
  for (let i = 1; i < arrivals.length; i++) assert(arrivals[i].at - arrivals[i - 1].at >= 10);
  for (const type of ['cave-hound', 'engineer', 'warrior', 'runesmith']) {
    const own = arrivals.filter((a) => a.type === type);
    for (let i = 1; i < own.length; i++)
      assert(own[i].at - own[i - 1].at >= characterById(type)!.recruitment!.seconds);
  }
  // Dedicated support-only settlement: burst demand adds staff; idle floors don't.
  const s = createRoomLab();
  buildRoom(s, 'dormitory', rect(2, 2, 5, 4));
  buildRoom(s, 'kitchen', rect(8, 2, 5, 4));
  buildRoom(s, 'workshop', rect(8, 8, 3, 3));
  buildRoom(s, 'library', rect(13, 8, 3, 3));
  enableRecruitment(s);
  advanceArrivals(s, 75);
  assert.equal(count(s, 'engineer'), 1);
  assert.equal(count(s, 'runesmith'), 1);
  for (let i = 0; i < 7; i++) queueCraft(s, 'timber-door');
  advanceArrivals(s, 120);
  assert.equal(count(s, 'engineer'), 3);
  assert.equal(count(s, 'runesmith'), 1);
  for (const o of s.craftOrders) o.state = 'done';
  advanceArrivals(s, 120);
  assert.equal(count(s, 'engineer'), 3, 'Completed demand never evicts staff or attracts more');
  for (const id of ['dwarf-haste', 'mending-rune', 'stoneguard', 'call-to-arms']) queueResearch(s, id);
  advanceArrivals(s, 61);
  assert.equal(count(s, 'runesmith'), 2, 'Four active orders request a second researcher');
  for (const id of ['enemy-slow', 'thunder-rune', 'runic-barrier', 'rune-of-reckoning']) queueResearch(s, id);
  assert.equal(s.researchOrders!.length, 8);
  for (const o of s.researchOrders ?? []) cancelResearch(s, o.spell);
  advanceArrivals(s, 60);
  assert.equal(count(s, 'runesmith'), 2, 'Paused research does not request more staff');
});
test('full Dormitory blocks advanced arrivals until expansion; cooldowns survive arrival toggles', () => {
  const w = createRoomLab();
  buildRoom(w, 'dormitory', [{ x: 8, z: 8 }]);
  enableRecruitment(w);
  advanceArrivals(w, 15);
  enableRecruitment(w, false);
  advanceArrivals(w, 5);
  enableRecruitment(w);
  advanceArrivals(w, 10);
  assert.equal(count(w, 'cave-hound'), 1);
  buildRoom(w, 'training', [{ x: 9, z: 8 }]);
  buildRoom(w, 'kitchen', [{ x: 10, z: 8 }]);
  advanceArrivals(w, 50);
  assert.equal(count(w, 'warrior'), 0);
  assert(w.recruitment!.dormitoryFull);
  buildRoom(w, 'dormitory', [{ x: 8, z: 9 }]);
  advanceArrivals(w, 1);
  assert.equal(count(w, 'warrior'), 1);
  assert.equal(count(w, 'cave-hound'), 1);
  const p = hearthArrival(w)!;
  tileAt(w, p.x, p.z)!.terrain = 'rock';
  assert.match(recruitmentStatus(w, 'cave-hound').message, /arrival route/);
  advanceArrivals(w, 60);
  assert.equal(w.agents.length, 2);
});
test('missing Kitchen support, occupied specialist capacity and an inaccessible Hearth do not qualify arrivals', () => {
  const w = settlement();
  const kitchen = w.tiles.filter((t) => t.room === 'kitchen');
  reclaimRoom(w, kitchen);
  assert.match(recruitmentStatus(w, 'warrior').message, /food/);
  buildRoom(w, 'kitchen', kitchen);
  const capacity = recruitmentStatus(w, 'warrior').capacity;
  assert(capacity > 0);
  addResidents(w, 'warrior', capacity);
  assert.equal(recruitmentStatus(w, 'warrior').eligible, false);
  const approach = hearthArrival(w)!;
  tileAt(w, approach.x, approach.z)!.terrain = 'rock';
  assert.match(recruitmentStatus(w, 'runesmith').message, /arrival route/);
  const compact = createRoomLab();
  buildRoom(compact, 'training', [{ x: 8, z: 8 }]);
  assert.match(recruitmentStatus(compact, 'warrior').message, /bed capacity/);
  buildRoom(compact, 'dormitory', [{ x: 8, z: 9 }]);
  buildRoom(compact, 'kitchen', [{ x: 8, z: 10 }]);
  assert.equal(recruitmentStatus(compact, 'warrior').capacity, 1);
});
