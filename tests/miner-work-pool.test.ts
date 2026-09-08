import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMinerWorkLab } from '../src/content/miner-work-lab.ts';
import { createWorkPool, coverResourceVacancy } from '../src/game/jobs/pool.ts';
import { chooseJob } from '../src/game/jobs/selection.ts';
import { releaseJob } from '../src/game/jobs/common.ts';
import { addMiners, designate, tick } from '../src/game/simulation.ts';
import { type World, type Resident, tileAt, key, neighbors } from '../src/game/types.ts';
import { run, until } from './helpers/simulation.ts';

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
    if (w.agents.some((a) => miningResource(w, a))) covered++;
    const jobs = w.agents.filter((a) => a.job?.kind === 'mine').map((a) => key(a.job!.target));
    assert.equal(new Set(jobs).size, jobs.length);
  }
  assert(covered / 800 > 0.9, `Resource assignment coverage: ${covered / 800}`);
  assert(w.tiles.some((t) => t.x === 9 && t.z >= 3 && t.z <= 10 && t.terrain === 'floor'));
  assert(w.tiles.some((t) => (t.wallProgress ?? 0) > 0 || (t.reinforced && t.x === 11 && t.z === 13)));
  assert(w.roomServices.some((s) => s.stored > 0));
});

test('a delivery or need frees resource coverage for another miner already doing ordinary work', () => {
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
    coverResourceVacancy(w, createWorkPool(w));
    assert(
      w.agents.some((a) => a !== miner && miningResource(w, a)),
      interruption,
    );
    assert(!miningResource(w, miner), interruption);
    if (interruption === 'delivery') assert.equal(miner.job?.kind, 'deliver');
    if (interruption === 'sleep') assert.equal(miner.job?.kind, 'sleep');
  }
});

test('marking a resource redirects busy miners promptly; cancellation releases it', () => {
  const w = createMinerWorkLab();
  const resources = w.tiles.filter((t) => ['gold', 'gem'].includes(t.terrain));
  designate(w, resources, false);
  run(w, 0.1);
  assert(w.agents.every((a) => !miningResource(w, a)));
  designate(w, resources);
  run(w, 0.6);
  assert(w.agents.some((a) => miningResource(w, a)));
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
  tileAt(w, 13, 11)!.terrain = 'floor';
  gem.known = false;
  coverResourceVacancy(w, createWorkPool(w));
  assert(w.agents.every((a) => !miningResource(w, a)));
  gem.known = true;
  gem.designated = false;
  coverResourceVacancy(w, createWorkPool(w));
  assert(w.agents.every((a) => !miningResource(w, a)));
  designate(w, [gem]);
  coverResourceVacancy(w, createWorkPool(w));
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
