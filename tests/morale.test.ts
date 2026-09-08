import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMoraleLab } from '../src/content/morale-lab.ts';
import { createRoomLab } from '../src/content/room-lab.ts';
import { tuning } from '../src/content/tuning.ts';
import { buildRoom, reclaimRoom, goldTotal } from '../src/game/rooms.ts';
import { setDoorMode } from '../src/game/defenses.ts';
import { addResidents, tick } from '../src/game/simulation.ts';
import { minerPrice } from '../src/game/recruitment.ts';
import { queueCraft } from '../src/game/crafting.ts';
import { moraleAlerts, moraleStatus, moraleSummary, dismissMoraleAlert } from '../src/game/morale.ts';
import { type World } from '../src/game/types.ts';
import { run, until } from './helpers/simulation.ts';

function shortGrace(work: () => void) {
  const original = [tuning.moraleGraceSeconds, tuning.moraleDepartureSeconds, tuning.moraleRecoveryRate];
  tuning.moraleGraceSeconds = 6;
  tuning.moraleDepartureSeconds = 12;
  tuning.moraleRecoveryRate = 2;
  try {
    work();
  } finally {
    [tuning.moraleGraceSeconds, tuning.moraleDepartureSeconds, tuning.moraleRecoveryRate] = original;
  }
}
const floor = (w: World, room: string) => w.tiles.filter((t) => t.room === room);
const gate = (w: World, mode: 'locked' | 'closed') => setDoorMode(w, w.defenses![0].id, mode);

test('capacity freed by an earlier departure saves a now-supported resident at the exit in the same tick', () => {
  const w = createRoomLab();
  addResidents(w, 'engineer');
  addResidents(w, 'miner');
  buildRoom(w, 'dormitory', [{ x: 8, z: 8 }]);
  buildRoom(w, 'kitchen', [
    { x: 8, z: 9 },
    { x: 9, z: 9 },
  ]);
  const [engineer, miner] = w.agents;
  const exit = w.roomServices.find((s) => s.id === 'hearth-treasury')!.access;
  for (const a of w.agents) Object.assign(a, { ...exit, nextTrainingAt: 999 });
  engineer.morale!.unmet.facility = tuning.moraleGraceSeconds + tuning.moraleDepartureSeconds;
  miner.morale!.unmet.accommodation = tuning.moraleGraceSeconds + tuning.moraleDepartureSeconds;
  const grief = miner.morale!.unmet.accommodation;
  tick(w, 0.05);
  assert.deepEqual(
    w.departures!.map((a) => a.id),
    [engineer.id],
  );
  assert.equal(w.agents.length, 1);
  assert.equal(w.agents[0], miner);
  assert.equal(w.roomServices.find((s) => s.service === 'rest')!.assigned, miner.id);
  assert.equal(miner.morale!.leaving, false);
  assert.equal(
    miner.morale!.unmet.accommodation,
    grief + 0.05,
    'Re-evaluation does not advance or recover timers twice.',
  );
});

test('the full-length shortage scenario releases all four residents through the reopened doorway without a corner loop', () => {
  const w = createMoraleLab();
  reclaimRoom(w, floor(w, 'kitchen'));
  run(w, 308);
  assert(w.agents.every((a) => a.morale!.leaving && a.morale!.blocked));
  assert.equal(w.agents.length, 4);
  const resources =
    goldTotal(w) +
    w.spent +
    w.tiles.reduce((sum, t) => sum + t.loose, 0) +
    w.agents.reduce((sum, a) => sum + a.carrying, 0);
  gate(w, 'closed');
  run(w, 90);
  assert.equal(w.agents.length, 0);
  assert.equal(w.departures!.length, 4);
  assert.equal(goldTotal(w) + w.spent + w.tiles.reduce((sum, t) => sum + t.loose, 0), resources);
});

test('temporary missing support stays within grace and recovers without departures', () =>
  shortGrace(() => {
    const w = createMoraleLab();
    gate(w, 'closed');
    const kitchen = floor(w, 'kitchen');
    reclaimRoom(w, kitchen);
    run(w, 4);
    assert.equal(moraleAlerts(w).length, 0);
    assert(w.agents.every((a) => !a.morale!.leaving && a.morale!.unmet.food >= 3.9));
    buildRoom(w, 'kitchen', kitchen);
    run(w, 5);
    assert(w.agents.every((a) => a.morale!.unmet.food === 0));
    assert.equal(moraleSummary(w).unhappy, 0);
    assert.equal(w.agents.length, 4);
    assert.equal(w.departures?.length ?? 0, 0);
  }));

test('warnings group actual missing needs, dismiss until escalation, and clear when repaired', () =>
  shortGrace(() => {
    const w = createMoraleLab();
    const kitchen = floor(w, 'kitchen'),
      beds = floor(w, 'dormitory');
    reclaimRoom(w, kitchen);
    reclaimRoom(w, beds);
    for (const room of ['training', 'workshop', 'library']) reclaimRoom(w, floor(w, room));
    run(w, 8);
    const alerts = moraleAlerts(w);
    assert.equal(alerts.find((a) => a.id === 'food')!.count, 4);
    assert.equal(alerts.find((a) => a.id === 'accommodation')!.count, 4);
    assert.equal(alerts.find((a) => a.id === 'facility')!.count, 3, 'Miners require no specialist room.');
    assert.equal(
      alerts.some((a) => a.id === 'pay'),
      false,
      'The existing wage grace remains in force.',
    );
    dismissMoraleAlert(w, 'food');
    assert.equal(
      moraleAlerts(w).some((a) => a.id === 'food'),
      false,
    );
    run(w, 12);
    assert.equal(moraleAlerts(w).find((a) => a.id === 'food')!.severity, 'leaving');
    buildRoom(w, 'kitchen', kitchen);
    run(w, 0.1);
    assert.equal(
      moraleAlerts(w).some((a) => a.id === 'food'),
      false,
    );
    assert.equal(w.moraleDismissed?.food, undefined);
  }));

test('all four types wait at a blocked exit, then physically leave and preserve carried gold and job progress', () =>
  shortGrace(() => {
    const w = createMoraleLab();
    for (const a of w.agents) a.nextTrainingAt = 1000;
    queueCraft(w, 'steel-door');
    reclaimRoom(w, floor(w, 'kitchen'));
    const initialPrice = minerPrice(w);
    run(w, 25);
    assert.equal(w.agents.length, 4);
    assert(w.agents.every((a) => a.morale!.leaving && a.morale!.blocked));
    assert.equal(minerPrice(w), initialPrice, 'Blocked departures still belong to the living workforce.');
    assert.equal(w.departures?.length ?? 0, 0);
    assert(
      w.agents.every((a) => !a.job),
      'Departing residents release ordinary work.',
    );
    const order = w.craftOrders[0];
    assert.equal(order.worker, undefined);
    assert.equal(order.state, 'queued');
    assert(order.progress > 0, 'Earned crafting work is preserved.');
    const miner = w.agents.find((a) => a.type === 'miner')!;
    miner.carrying = 17;
    const resources = goldTotal(w) + w.tiles.reduce((sum, t) => sum + t.loose, 0) + miner.carrying;
    gate(w, 'closed');
    run(w, 0.1);
    assert.equal(w.agents.length, 4, 'Opening the route does not teleport residents out.');
    until(w, () => w.agents.length === 0, 40, 'Residents walk to the starting Hearth');
    assert.equal(w.departures!.length, 4);
    assert.deepEqual(
      new Set(w.departures!.map((a) => a.type)),
      new Set(['miner', 'engineer', 'warrior', 'runesmith']),
    );
    assert.equal(minerPrice(w), tuning.minerMinimumCost);
    assert(w.roomServices.every((s) => s.assigned === undefined));
    assert.equal(goldTotal(w) + w.tiles.reduce((sum, t) => sum + t.loose, 0), resources);
    assert.equal(
      w.tiles.reduce((sum, t) => sum + t.loose, 0),
      17,
    );
  }));

test('restoring missing food during a blocked departure cancels the exit and recovers dissatisfaction', () =>
  shortGrace(() => {
    const w = createMoraleLab(),
      kitchen = floor(w, 'kitchen');
    reclaimRoom(w, kitchen);
    run(w, 20);
    assert(w.agents.every((a) => a.morale!.leaving));
    const before = w.agents.map((a) => a.morale!.unmet.food);
    buildRoom(w, 'kitchen', kitchen);
    run(w, 1);
    assert(w.agents.every((a) => !a.morale!.leaving && !a.morale!.blocked));
    assert(w.agents.every((a, i) => a.morale!.unmet.food < before[i]));
    assert(w.agents.every((a) => moraleStatus(w, a).stage === 'recovering'));
    run(w, 12);
    assert(w.agents.every((a) => a.morale!.unmet.food === 0));
    assert.equal(w.agents.length, 4);
    assert.equal(w.departures?.length ?? 0, 0);
  }));

test('role facilities support current population capacity even while their ordinary stations are occupied', () =>
  shortGrace(() => {
    const w = createMoraleLab();
    gate(w, 'closed');
    addResidents(w, 'engineer', 4, { x: 10, z: 10 });
    run(w, 8);
    const affected = w.agents.filter((a) => a.morale!.active.includes('facility'));
    assert.equal(affected.length, 1);
    assert.equal(affected[0].type, 'engineer');
    assert.equal(moraleAlerts(w).find((a) => a.id === 'facility')!.count, 1);
    buildRoom(w, 'workshop', [{ x: 14, z: 5 }]);
    run(w, 5);
    assert(w.agents.every((a) => !a.morale!.active.includes('facility')));
    assert.equal(w.departures?.length ?? 0, 0);
  }));

test('overdue blocked wages cause discontent after their own grace and actionable restored funds cancel departure', () =>
  shortGrace(() => {
    const w = createMoraleLab();
    run(w, 54);
    assert.equal(moraleAlerts(w).length, 0);
    assert(w.agents.every((a) => a.morale!.unmet.pay === 0));
    run(w, 10);
    assert.equal(moraleAlerts(w).find((a) => a.id === 'pay')!.count, 4);
    run(w, 12);
    assert(w.agents.every((a) => a.morale!.leaving && a.morale!.blocked));
    const population = w.agents.length;
    gate(w, 'closed');
    run(w, 0.1);
    assert(w.agents.every((a) => !a.morale!.leaving));
    assert.equal(
      moraleAlerts(w).some((a) => a.id === 'pay'),
      false,
    );
    until(w, () => w.agents.every((a) => a.pay!.collections >= 1), 45, 'Restored treasury pays the arrears');
    assert.equal(w.agents.length, population);
    assert.equal(w.departures?.length ?? 0, 0);
    assert(w.agents.every((a) => a.morale!.unmet.pay === 0));
  }));

test('defeat freezes dissatisfaction and blocked departures along with the rest of the world', () =>
  shortGrace(() => {
    const w = createMoraleLab();
    reclaimRoom(w, floor(w, 'kitchen'));
    run(w, 20);
    assert(w.agents.every((a) => a.morale!.leaving));
    w.outcome = 'defeat';
    const elapsed = w.elapsed,
      before = JSON.stringify(w.agents);
    run(w, 100);
    assert.equal(w.elapsed, elapsed);
    assert.equal(JSON.stringify(w.agents), before);
    assert.equal(w.departures?.length ?? 0, 0);
  }));
