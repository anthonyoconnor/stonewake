import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMinerWorkLab } from '../src/content/miner-work-lab.ts';
import { createWorkPool } from '../src/game/jobs/pool.ts';
import { chooseJob } from '../src/game/jobs/selection.ts';
import { releaseJob } from '../src/game/jobs/common.ts';
import { addMiners, designate, tick } from '../src/game/simulation.ts';
import { type World, type Resident, tileAt, key, neighbors } from '../src/game/types.ts';
import { run, until } from './helpers/simulation.ts';
import { tuning } from '../src/content/tuning.ts';

const miningResource = (w: World, a: Resident) =>
  a.job?.kind === 'mine' && ['gold', 'gem'].includes(tileAt(w, a.job.target.x, a.job.target.z)!.terrain);
function allocate(w: World) {
  const pool = createWorkPool(w);
  for (const a of w.agents) chooseJob(w, a, pool);
}

test('one shared pool splits six miners between resources and other work, without duplicate tasks', () => {
  const w = createMinerWorkLab();
  addMiners(w, 3);
  allocate(w);
  assert.equal(w.agents.filter((a) => miningResource(w, a)).length, 2);
  assert(w.agents.some((a) => a.job?.kind === 'collect'));
  assert(w.agents.some((a) => a.job?.kind === 'buildWall'));
  assert(w.agents.some((a) => a.job?.kind === 'mine' && !miningResource(w, a)));
  const jobs = w.agents.filter((a) => a.job).map((a) => `${a.job!.kind}:${key(a.job!.target)}`);
  assert.equal(new Set(jobs).size, jobs.length);
});

test('resource mining continues alongside excavation and construction in the working yard', () => {
  const w = createMinerWorkLab();
  let covered = 0;
  for (let i = 0; i < 800; i++) {
    tick(w, 0.05);
    if (w.agents.some((a) => a.workAssignment?.group === 'resource')) covered++;
    const jobs = w.agents.filter((a) => a.job?.kind === 'mine').map((a) => key(a.job!.target));
    assert.equal(new Set(jobs).size, jobs.length);
  }
  assert(covered / 800 > 0.9, `Resource assignment coverage: ${covered / 800}`);
  assert(w.tiles.some((t) => t.x === 9 && t.z >= 3 && t.z <= 10 && t.terrain === 'floor'));
  assert(w.tiles.some((t) => (t.wallProgress ?? 0) > 0 || (t.reinforced && t.x === 11 && t.z === 13)));
  assert(w.roomServices.some((s) => s.stored > 0));
});

test('delivery retains resource ownership; urgent interruptions allow an uncommitted replacement', () => {
  for (const interruption of ['delivery', 'sleep', 'combat', 'departure'] as const) {
    const w = createMinerWorkLab();
    allocate(w);
    const miner = w.agents.find((a) => miningResource(w, a))!;
    releaseJob(w, miner);
    if (interruption === 'delivery') {
      miner.carrying = 45;
      miner.cargoOrigin = { x: 14, z: 4 };
      chooseJob(w, miner);
    }
    if (interruption === 'sleep') {
      miner.energy = 0.1;
      chooseJob(w, miner);
    }
    if (interruption === 'combat') miner.combatTarget = 123;
    if (interruption === 'departure') miner.morale!.leaving = true;
    const replacement = w.agents.find((a) => a !== miner)!;
    releaseJob(w, replacement);
    replacement.workAssignment = undefined;
    chooseJob(w, replacement);
    assert.equal(miningResource(w, replacement), interruption !== 'delivery', interruption);
    if (interruption === 'delivery') assert.equal(miner.job?.kind, 'deliver');
    if (interruption === 'sleep') assert.equal(miner.job?.kind, 'sleep');
  }
});

test('new resource marks wait for a natural work boundary; cancellation still releases mining', () => {
  const w = createMinerWorkLab();
  const resources = w.tiles.filter((t) => ['gold', 'gem'].includes(t.terrain));
  designate(w, resources, false);
  run(w, 0.1);
  const builder = w.agents.find((a) => a.job?.kind === 'buildWall')!,
    job = builder.job;
  assert(job);
  designate(w, resources);
  run(w, 0.6);
  assert.equal(builder.job, job, 'New income work cannot steal a committed builder');
  until(w, () => w.agents.some((a) => miningResource(w, a)), 30);
  designate(w, resources, false);
  run(w, 0.1);
  assert(w.agents.every((a) => !miningResource(w, a)));
});

test('hidden, unmarked and blocked resources do not hold workers; opening access resumes mining', () => {
  const w = createMinerWorkLab();
  const resources = w.tiles.filter((t) => ['gold', 'gem'].includes(t.terrain));
  for (const t of resources)
    for (const n of neighbors(w, t)) if (!resources.includes(n)) n.terrain = 'bedrock';
  allocate(w);
  assert(w.agents.every((a) => !miningResource(w, a)));
  const gem = tileAt(w, 14, 11)!;
  const reassign = () => {
    const a = w.agents[0];
    releaseJob(w, a);
    a.workAssignment = undefined;
    chooseJob(w, a);
  };
  tileAt(w, 13, 11)!.terrain = 'floor';
  gem.known = false;
  reassign();
  assert(w.agents.every((a) => !miningResource(w, a)));
  gem.known = true;
  gem.designated = false;
  reassign();
  assert(w.agents.every((a) => !miningResource(w, a)));
  designate(w, [gem]);
  reassign();
  assert(w.agents.some((a) => miningResource(w, a)));
});

test('a lone miner prioritizes resources but still banks renewable gem loads', () => {
  const w = createMinerWorkLab();
  w.agents = w.agents.slice(0, 1);
  designate(
    w,
    w.tiles.filter((t) => t.terrain === 'gold'),
    false,
  );
  for (const t of w.tiles) t.loose = 0;
  allocate(w);
  assert(miningResource(w, w.agents[0]));
  until(w, () => w.roomServices.some((s) => s.stored >= 45), 40);
  assert.equal(tileAt(w, 14, 11)!.terrain, 'gem');
  until(w, () => miningResource(w, w.agents[0]), 15);
});

test('the same miner keeps extracting gem batches while other miners finish their own tasks', () => {
  const w = createMinerWorkLab();
  designate(
    w,
    w.tiles.filter((t) => t.terrain === 'gold'),
    false,
  );
  allocate(w);
  const miner = w.agents.find((a) => miningResource(w, a))!,
    gem = tileAt(w, 14, 11)!;
  run(w, 1);
  assert.equal(
    miner.workAssignment!.remaining,
    tuning.minerAssignmentSeconds,
    'Travel does not consume working time',
  );
  until(w, () => gem.loose > 0, 15);
  let batches = 0;
  for (let i = 0; i < 200; i++) {
    const before = gem.loose;
    tick(w, 0.05);
    if (gem.loose > before) batches++;
    for (const a of w.agents) if (miningResource(w, a)) assert.equal(a.id, miner.id);
  }
  assert(batches >= 15, 'The assigned miner keeps producing batches instead of changing roles');
  assert(miner.workAssignment!.remaining > 0);
});

test('three-miner gold work returns to its seam after delivery without spending its commitment on travel', () => {
  const w = createMinerWorkLab();
  allocate(w);
  const miner = w.agents.find((a) => miningResource(w, a))!,
    target = { ...miner.job!.target };
  until(w, () => miner.job?.kind === 'deliver');
  const remaining = miner.workAssignment!.remaining;
  until(w, () => miningResource(w, miner), 20);
  assert.deepEqual(miner.job!.target, target);
  assert(miner.workAssignment!.remaining >= remaining - 0.051);
});

test('three miners complete excavation and both walls without abandoning unfinished work to rebalance', () => {
  const w = createMinerWorkLab();
  for (let i = 0; i < 1200; i++) {
    const jobs = w.agents.map((a) => ({ a, job: a.job }));
    tick(w, 0.05);
    for (const { a, job } of jobs) {
      if (!job || job === a.job) continue;
      const t = tileAt(w, job.target.x, job.target.z)!;
      if (job.kind === 'buildWall') assert(!t.wallPlanned, 'Finish construction before changing roles');
      if (job.kind === 'mine' && ['dirt', 'rock'].includes(t.terrain))
        assert(!t.designated, 'Finish the marked excavation before changing roles');
    }
  }
  assert.equal(w.tiles.filter((t) => t.x === 9 && t.z >= 3 && t.z <= 10 && t.terrain === 'floor').length, 8);
  for (const x of [11, 12]) assert(tileAt(w, x, 13)!.reinforced, 'Both planned walls finish');
});
