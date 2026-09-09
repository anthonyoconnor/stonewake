import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  const result = await page.evaluate(async () => {
    const api = window.strongholdDev;
    await api.advance(3);
    const start = api.state();
    const oldWalls = start.agents.filter((a) => a.job?.kind === 'reinforce').map((a) => a.job.target);
    const points = [];
    for (let x = start.hearth.x + 3; x <= start.hearth.x + 6; x++)
      for (let z = start.hearth.z - 2; z <= start.hearth.z + 2; z++) points.push({ x, z });
    api.command({ kind: 'dig', points });
    let mining = false,
      claiming = false;
    const samples = [];
    for (let i = 0; i < 120; i++) {
      await api.advance(1);
      const w = api.state();
      mining ||= w.agents.some((a) => a.job?.kind === 'mine');
      claiming ||= w.agents.some((a) => a.job?.kind === 'claim');
      const complete = points.every(
        (p) => w.tiles[p.z * w.width + p.x].terrain === 'gem' || w.tiles[p.z * w.width + p.x].claimed,
      );
      samples.push({ second: w.elapsed, jobs: w.agents.map((a) => a.job?.kind), complete });
      if (complete) break;
    }
    const end = api.state();
    return {
      oldWalls,
      mining,
      claiming,
      samples,
      crew: end.agents.map((a) => a.type),
      free: end.freeRoomBuilding,
      complete: points.every(
        (p) => end.tiles[p.z * end.width + p.x].terrain === 'gem' || end.tiles[p.z * end.width + p.x].claimed,
      ),
      pending: points
        .map((p) => end.tiles[p.z * end.width + p.x])
        .filter((t) => !t.claimed)
        .map((t) => ({ x: t.x, z: t.z, terrain: t.terrain, known: t.known, designated: t.designated })),
      jobs: end.agents.map((a) => ({ job: a.job, x: a.x, z: a.z })),
      goldSpent: end.spent,
      errors: api.status().errors,
    };
  });
  assert(result.oldWalls.length > 0, 'Start with an ordinary crew already reinforcing');
  assert(result.mining && result.claiming && result.complete, JSON.stringify(result));
  assert.equal(result.free, false);
  assert.deepEqual(result.crew, ['stonehand', 'stonehand', 'stonehand']);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(errors, []);
  mkdirSync('test-results/m23', { recursive: true });
  await page.screenshot({ path: 'test-results/m23/expanded-and-claimed.png' });
  console.log(
    'PASS ordinary starting crew: background reinforcement yields to new 4×5 excavation, all excavatable floors claimed; renewable gems remain in production.',
    JSON.stringify({
      seconds: result.samples.at(-1).second,
      mining: result.mining,
      claiming: result.claiming,
      pending: result.pending,
      crew: result.crew,
    }),
  );
} finally {
  await browser.close();
}
