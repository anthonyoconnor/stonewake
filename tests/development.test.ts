import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScenario, scenarioIds } from '../src/content/scenarios.ts';
import { DevelopmentController } from '../src/dev/controller.ts';
import { advance, advanceUntil } from '../src/dev/stepping.ts';
import { enableDiagnostics, recentEvents, inspectResident } from '../src/game/diagnostics.ts';
import { tick } from '../src/game/simulation.ts';
import { goldTotal } from '../src/game/rooms.ts';
import { spellDefinitions } from '../src/content/spells.ts';

test('shared scenarios reproduce identical state and respect paid/free construction', () => {
  for (const id of scenarioIds) {
    const paid = createScenario(id),
      free = createScenario(id, true);
    assert.deepEqual(createScenario(id), paid, id);
    assert.equal(paid.freeRoomBuilding, false);
    assert.equal(free.freeRoomBuilding, true);
    assert.equal(free.spent, 0, `${id}: setup must not charge for free room construction`);
    if (paid.tiles.some((t) => t.room && !t.core)) assert(paid.spent > 0, id);
  }
});

test('controller commands use construction costs, reset scenarios and return detached state', () => {
  let w = createScenario('room-lab');
  const controller = new DevelopmentController(
    () => w,
    (next) => {
      w = next;
    },
  );
  controller.load('room-lab');
  const gold = goldTotal(w),
    p = { x: 8, z: 8 };
  controller.command({ kind: 'build', room: 'treasure', points: [p] });
  assert.equal(goldTotal(w), gold - 12);
  controller.command({ kind: 'reclaim', points: [p] });
  assert.equal(goldTotal(w), gold - 6);
  const copy = controller.state();
  copy.allowance = -123;
  assert.notEqual(w.allowance, copy.allowance);
  const elapsed = w.elapsed;
  assert.throws(() => controller.advance(NaN));
  assert.throws(() => controller.advance(601));
  assert.equal(w.elapsed, elapsed);
  controller.load('stronghold');
  assert.equal(w.elapsed, 0);
  assert.equal(controller.paused, true);
  assert.throws(() => controller.load('missing' as never), /Unknown scenario/);
  assert.equal(controller.status().scenario, 'stronghold');
});

test('fixed-step advancement matches normal ticks and tracing cannot change gameplay', () => {
  const w = createScenario('crowded-kitchen'),
    reference = structuredClone(w);
  enableDiagnostics(w);
  advance(w, 12);
  for (let i = 0; i < 240; i++) tick(reference, 0.05);
  assert.deepEqual(w, reference);
  advanceUntil(w, () => w.agents.every((a) => a.meals > 0), 90, 'Every crowded Kitchen resident must eat');
  assert(recentEvents(w).length > 0);
  assert(recentEvents(w).length <= 300);
  assert.deepEqual(recentEvents(reference), [], 'Normal simulation does not allocate history');
});

test('locked hauling reports rejected routes and resumes through the same gameplay door command', () => {
  let w = createScenario('locked-door-hauling');
  const controller = new DevelopmentController(
    () => w,
    (next) => {
      w = next;
    },
  );
  const miner = w.agents.find((a) => a.type === 'miner')!;
  advance(w, 2);
  assert(
    recentEvents(w, miner.id).some(
      (e) => e.event === 'rejected' && e.reason.includes('No route') && e.target?.x === 25,
    ),
  );
  const door = w.defenses!.find((d) => d.type === 'timber-door')!;
  controller.command({ kind: 'door', id: door.id, mode: 'closed' });
  advanceUntil(
    w,
    () => w.tiles.find((t) => t.x === 25 && t.z === 12)!.loose === 0 && miner.carrying === 0,
    90,
    'Locked haul resumes after opening access',
  );
  assert(recentEvents(w, miner.id).some((e) => e.event === 'completed' && e.job === 'deliver'));
});

test('research interruption retains progress and reports why its reservation was released', () => {
  let w = createScenario('research-interruption');
  const controller = new DevelopmentController(
    () => w,
    (next) => {
      w = next;
    },
  );
  const spell = spellDefinitions[0].id,
    a = w.agents[0];
  advanceUntil(w, () => w.researchOrders![0].progress > 0.1, 90, 'Research starts');
  const progress = w.researchOrders![0].progress;
  controller.command({ kind: 'pause-research', spell });
  assert.equal(a.job, undefined);
  assert.equal(w.researchOrders![0].progress, progress);
  assert(recentEvents(w, a.id).some((e) => e.reason === 'Research paused'));
  controller.command({ kind: 'research', spell });
  advanceUntil(w, () => w.researchOrders![0].state === 'ready', 120, 'Research resumes and finishes');
  assert(inspectResident(w, a.id)!.history.length > 0);
});

test('condition timeout includes actor routes, services, reservations and recent reasons', () => {
  const w = createScenario('locked-door-hauling');
  assert.throws(
    () => advanceUntil(w, () => false, 0.1, 'Deliberate diagnostic check'),
    (error) => {
      assert(error instanceof Error);
      for (const field of [
        'Deliberate diagnostic check',
        'residents',
        'path',
        'services',
        'reservedBy',
        'recentEvents',
      ])
        assert(error.message.includes(field), field);
      return true;
    },
  );
});
