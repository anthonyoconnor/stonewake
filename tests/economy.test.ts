import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomLab } from '../src/content/room-lab.ts';
import { createEconomyLab } from '../src/content/economy-lab.ts';
import { characterDefinitions, characterById } from '../src/content/characters.ts';
import { tuning } from '../src/content/tuning.ts';
import { addMiners, addResidents } from '../src/game/simulation.ts';
import { buildRoom, reclaimRoom, goldTotal, spendGold } from '../src/game/rooms.ts';
import {
  minerPrice,
  minerPurchaseStatus,
  purchaseMiner,
  recruitmentStatus,
  enableRecruitment,
} from '../src/game/recruitment.ts';
import { wageStatus, payrollStatus, tickPayday } from '../src/game/wages.ts';
import { addRaider, setDoorMode } from '../src/game/defenses.ts';
import { damageEnemy } from '../src/game/spell-effects.ts';
import { releaseJob } from '../src/game/jobs/common.ts';
import { type World, tileAt } from '../src/game/types.ts';
import { rect, run, until } from './helpers/simulation.ts';

const buy = (w: World) => purchaseMiner(w, (type, origin) => addResidents(w, type, 1, origin) === 1);
function crew() {
  const w = createRoomLab();
  addMiners(w);
  buildRoom(w, 'dormitory', rect(9, 3, 4, 3));
  buildRoom(w, 'kitchen', rect(9, 7, 4, 3));
  return w;
}
function payday() {
  const w = createRoomLab();
  addResidents(w, 'miner', 1);
  w.nextPaydayAt = 0;
  w.agents[0].capabilities = [];
  return w;
}

test('late arrivals join the shared payday without back pay or moving the schedule', () => {
  const w = createRoomLab();
  addResidents(w, 'miner', 1);
  w.elapsed = 119;
  addResidents(w, 'engineer', 1);
  tickPayday(w);
  assert(w.agents.every(a => a.pay!.due.length === 0));
  assert(w.agents.every(a => wageStatus(w, a).nextAt === 120));
  w.elapsed = 120;
  tickPayday(w);
  assert.deepEqual(w.agents.map(a => a.pay!.due), [[{at:120, amount:4}], [{at:120, amount:7}]]);
  tickPayday(w);
  w.elapsed = 121;
  addResidents(w, 'warrior', 1);
  assert.equal(w.agents[2].pay!.due.length, 0);
  assert.equal(wageStatus(w, w.agents[2]).nextAt, 240);
  w.elapsed = 240;
  tickPayday(w);
  assert.deepEqual(w.agents.map(a => a.pay!.due.length), [2,2,1]);
  assert(w.agents.every(a => a.pay!.due.at(-1)!.at === 240));
});

test('specialist wages rise while Miner wages and earlier debt keep their value', () => {
  const w = createRoomLab();
  for (const def of characterDefinitions.filter(c=>!c.construct)) addResidents(w, def.id, 1);
  const expected = [[4,4,4,4,4], [7,9,11,13,15], [8,10,12,14,16], [10,12,14,16,18]];
  for (let level = 1; level <= 5; level++) {
    for (const a of w.agents) a.level = level;
    w.elapsed = level * 120;
    tickPayday(w);
  }
  assert.deepEqual(w.agents.map(a => a.pay!.due.map(p => p.amount)), expected);
});

test('an empty settlement keeps its clock and interval edits affect the following shared payday', () => {
  const w = createRoomLab();
  w.elapsed = 130;
  tickPayday(w);
  addResidents(w, 'miner', 1);
  assert.equal(wageStatus(w, w.agents[0]).nextAt, 240);
  const original = tuning.paydaySeconds;
  try {
    tuning.paydaySeconds = 60;
    tickPayday(w);
    assert.equal(w.nextPaydayAt, 240);
    w.elapsed = 240;
    tickPayday(w);
    assert.equal(w.nextPaydayAt, 300);
    assert.deepEqual(w.agents[0].pay!.due, [{at:240, amount:4}]);
  } finally { tuning.paydaySeconds = original; }
});

test('Miner prices count the current living workforce and purchase exactly one arrival', () => {
  const w = crew(),
    initial = w.agents.length;
  assert.equal(minerPrice(w), tuning.minerMinimumCost + tuning.minerCostStep * initial);
  const price = minerPrice(w),
    balance = goldTotal(w),
    spent = w.spent;
  assert(buy(w).ok);
  assert.equal(w.agents.length, initial + 1);
  assert.equal(goldTotal(w), balance - price);
  assert.equal(w.spent, spent + price);
  assert.equal(minerPrice(w), price + tuning.minerCostStep);
  assert.equal(w.nextPaydayAt, w.elapsed + tuning.paydaySeconds);
  w.agents[0].health = 0;
  assert.equal(minerPrice(w), price, 'A dead Miner stops affecting the price before cleanup.');
  w.agents.splice(1, 1);
  assert.equal(minerPrice(w), price - tuning.minerCostStep, 'Removal/departure lowers the current price.');
  assert.equal(minerPrice(crew()), price, 'A fresh level calculates its own starting workforce.');
});

test('failed Miner purchases preserve population and gold with clear eligibility reasons', () => {
  const w = crew(),
    balance = goldTotal(w),
    population = w.agents.length;
  assert.equal(purchaseMiner(w, () => false).ok, false);
  assert.equal(goldTotal(w), balance);
  assert.equal(w.agents.length, population);
  w.allowance = 0;
  assert.match(buy(w).message, /gold/);
  assert.equal(w.agents.length, population);
  w.allowance = 5000;
  const kitchen = w.tiles.filter((t) => t.room === 'kitchen');
  reclaimRoom(w, kitchen);
  assert.match(minerPurchaseStatus(w).message, /Kitchen/);
  buildRoom(w, 'kitchen', kitchen);
  const chest = w.roomServices.find((f) => f.id === 'hearth-treasury')!;
  tileAt(w, chest.access.x, chest.access.z)!.terrain = 'rock';
  assert.match(minerPurchaseStatus(w).message, /arrival route/);
  const gated = crew();
  gated.outcome = 'defeat';
  assert.equal(buy(gated).ok, false);
  assert.equal(recruitmentStatus(gated, 'warrior').eligible, false);
  enableRecruitment(gated);
  const before = gated.agents.length;
  run(gated, 60);
  assert.equal(gated.agents.length, before);
});

test('each dwarf physically collects its positive wage once and the shared balance accounts for all payments', () => {
  const w = createEconomyLab(),
    balance = goldTotal(w),
    spent = w.spent;
  run(w, 10.1);
  for (const a of w.agents) {
    assert(characterById(a.type)!.levels[(a.level ?? 1)-1].wage > 0);
    assert.equal(a.pay!.collections, 0, 'No wage is paid at the distant payday trigger.');
    assert.equal(a.pay!.due.length, 1);
  }
  until(w, () => w.agents.every((a) => a.pay!.collections === 1), 45, 'All types physically collect');
  const wages = characterDefinitions.reduce((sum, d) => sum + d.levels[0].wage, 0);
  assert.equal(goldTotal(w), balance - wages);
  assert.equal(w.spent, spent + wages);
  assert.equal(payrollStatus(w).due, 0);
  for (const a of w.agents) assert.equal(a.pay!.paid, characterById(a.type)!.levels[(a.level ?? 1)-1].wage);
  run(w, 5);
  assert(w.agents.every((a) => a.pay!.collections === 1));
});

test('a single starter treasury queues collectors and combines reachable stored reserves', () => {
  const w = createRoomLab();
  for (const type of characterDefinitions.filter(c=>!c.construct).map((d) => d.id)) addResidents(w, type);
  w.nextPaydayAt = 0;
  for (const a of w.agents) a.capabilities = [];
  const wages = characterDefinitions.reduce((sum, d) => sum + d.levels[0].wage, 0);
  w.allowance = 0;
  w.roomServices[0].stored = wages;
  run(w, 0.1);
  assert.equal(w.agents.filter((a) => a.job?.kind === 'pay').length, 1);
  assert(w.agents.some((a) => wageStatus(w, a).state === 'queued'));
  until(w, () => w.agents.every((a) => a.pay!.collections === 1), 30, 'Single treasury wage queue drains');
  assert.equal(goldTotal(w), 0);
  assert.equal(w.spent, wages);

  const split = payday();
  buildRoom(split, 'treasure', [
    { x: 6, z: 15 },
    { x: 6, z: 16 },
  ]);
  split.allowance = 0;
  const stores = split.roomServices.filter((f) => f.service === 'storage');
  stores.forEach((f, i) => (f.stored = i === 0 ? 2 : 1));
  const prior = split.spent;
  until(split, () => split.agents[0].pay!.collections === 1, 10, 'Payment spans reachable reserves');
  assert.equal(goldTotal(split), 0);
  assert.equal(split.spent, prior + characterById('miner')!.levels[0].wage);
});

test('no funds and inaccessible reserves have distinct feedback and restored door access pays the same debt', () => {
  const w = createEconomyLab();
  setDoorMode(w, w.defenses![0].id, 'locked');
  buildRoom(w, 'treasure', [{ x: 10, z: 15 }]);
  w.allowance = 0;
  w.roomServices.find((f) => f.id === 'hearth-treasury')!.stored = 100;
  run(w, 11);
  assert(w.agents.every((a) => wageStatus(w, a).state === 'no-access'));
  assert(w.agents.every((a) => a.pay!.collections === 0));
  assert.equal(payrollStatus(w).overdue, 0, 'Travel grace does not immediately report overdue wages.');
  setDoorMode(w, w.defenses![0].id, 'closed');
  until(w, () => w.agents.every((a) => a.pay!.collections === 1), 45, 'Unlocking restores wage access');
  assert.equal(goldTotal(w), 71);

  const poor = payday();
  poor.allowance = 0;
  run(poor, tuning.wageGraceSeconds + 0.2);
  assert.equal(wageStatus(poor, poor.agents[0]).state, 'no-gold');
  assert.equal(wageStatus(poor, poor.agents[0]).overdue, true);
  assert.equal(poor.agents[0].pay!.collections, 0);
  poor.allowance = 4;
  until(poor, () => poor.agents[0].pay!.collections === 1, 10, 'Funding clears an overdue payment');
  assert.equal(wageStatus(poor, poor.agents[0]).overdue, false);
});

test('spending during a wage journey does not overdraw or erase the unpaid installment', () => {
  const w = payday(),
    a = w.agents[0];
  w.allowance = 4;
  a.x = 10;
  a.z = 15;
  run(w, 0.1);
  assert.equal(a.job?.kind, 'pay');
  assert.equal(a.pay!.collections, 0);
  assert(spendGold(w, 4));
  run(w, 10);
  assert.equal(a.pay!.collections, 0);
  assert.equal(a.pay!.due.length, 1);
  assert.equal(goldTotal(w), 0);
  assert.equal(w.spent, 4);
  w.allowance = 4;
  until(w, () => a.pay!.collections === 1, 10, 'New funds settle the original wage');
  assert.equal(w.spent, 8);
  assert.equal(goldTotal(w), 0);
});

test('reclaimed and interrupted collection preserves debt until a valid physical visit completes', () => {
  const w = payday(),
    a = w.agents[0],
    spot = { x: 10, z: 8 };
  w.roomServices = [];
  buildRoom(w, 'treasure', [spot]);
  run(w, 0.1);
  assert.equal(a.job?.kind, 'pay');
  const earnedAt = a.pay!.due[0].at;
  reclaimRoom(w, [spot]);
  const balance = goldTotal(w),
    spent = w.spent;
  run(w, 2);
  assert.equal(a.pay!.collections, 0);
  assert.equal(a.pay!.due[0].at, earnedAt);
  assert.equal(goldTotal(w), balance);
  assert.equal(w.spent, spent);
  assert.equal(wageStatus(w, a).state, 'no-access');
  buildRoom(w, 'treasure', [spot]);
  until(w, () => a.job?.kind === 'pay', 3, 'Rebuilt treasury accepted');
  releaseJob(w, a, 'Combat test interruption');
  assert.equal(a.pay!.collections, 0);
  assert.equal(a.pay!.due.length, 1);
  until(w, () => a.pay!.collections === 1, 20, 'Interrupted collection resumes once');
  assert.equal(a.pay!.due.length, 0);
});

test('combat interrupts a physical wage visit without charging and the original installment resumes after safety returns', () => {
  const w = payday(),
    a = w.agents[0];
  a.capabilities = ['defend'];
  a.x = 10;
  a.z = 15;
  run(w, 0.1);
  assert.equal(a.job?.kind, 'pay');
  const balance = goldTotal(w),
    due = a.pay!.due[0];
  const enemy = addRaider(w, { x: 10, z: 16 }, w.hearth)!;
  assert(enemy);
  run(w, 0.05);
  assert.equal(a.activity, 'Fighting');
  assert.equal(a.job, undefined);
  assert.equal(a.pay!.collections, 0);
  assert.equal(goldTotal(w), balance);
  assert.equal(a.pay!.due[0], due);
  damageEnemy(w, enemy, enemy.health, 'spell');
  until(w, () => a.pay!.collections === 1, 15, 'A safe resident resumes interrupted collection');
  assert.equal(a.pay!.due.length, 0);
  assert.equal(goldTotal(w), balance - due.amount);
  run(w, 2);
  assert.equal(a.pay!.collections, 1);
});

test('unpaid intervals accumulate once each and keep the wage earned before a tuning change', () => {
  const w = payday(),
    a = w.agents[0],
    def = characterById('miner')!.levels[0],
    original = def.wage;
  w.allowance = 0;
  run(w, 0.1);
  try {
    def.wage = original + 2;
    run(w, tuning.paydaySeconds + 0.1);
    assert.deepEqual(
      a.pay!.due.map((p) => p.amount),
      [original, original + 2],
    );
    w.allowance = original * 2 + 2;
    until(w, () => a.pay!.collections === 2, 15, 'Each accrued wage is settled once');
    assert.equal(a.pay!.paid, original * 2 + 2);
    assert.equal(goldTotal(w), 0);
    assert.equal(a.pay!.due.length, 0);
  } finally {
    def.wage = original;
  }
});

test('food and carried gold retain priority while a pending wage can interrupt productive work', () => {
  const w = payday(),
    a = w.agents[0];
  buildRoom(w, 'kitchen', [{ x: 6, z: 15 }]);
  a.hunger = 0.1;
  run(w, 0.1);
  assert.equal(a.job?.kind, 'eat');
  until(w, () => a.meals === 1, 10, 'Food is handled before collecting pay');
  until(w, () => a.pay!.collections === 1, 10, 'Wage follows the need visit');

  const hauling = payday(),
    h = hauling.agents[0];
  h.carrying = 10;
  h.x = 8;
  h.z = 15;
  run(hauling, 0.1);
  assert.equal(h.job?.kind, 'deliver');
  until(hauling, () => h.pay!.collections === 1, 10, 'Carried gold delivered before collection');
  assert.equal(h.carrying, 0);

  const working = payday(),
    worker = working.agents[0];
  working.nextPaydayAt = 1;
  worker.capabilities = ['mine'];
  const seam = tileAt(working, 6, 17)!;
  seam.terrain = 'gem';
  seam.designated = true;
  run(working, 0.1);
  assert.equal(worker.job?.kind, 'mine');
  until(working, () => worker.pay!.collections === 1, 15, 'Payday interrupts continuous mining');
});
