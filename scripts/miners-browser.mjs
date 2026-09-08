import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=miner-work&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'miner-work');
  const result = await page.evaluate(async () => {
    const api = window.strongholdDev;
    let covered = 0,
      distinct = true;
    for (let i = 0; i < 80; i++) {
      await api.advance(0.5);
      const w = api.state();
      const jobs = w.agents.filter((a) => a.job?.kind === 'mine').map((a) => a.job);
      if (jobs.some((j) => ['gold', 'gem'].includes(w.tiles[j.target.z * w.width + j.target.x].terrain)))
        covered++;
      distinct &&= new Set(jobs.map((j) => `${j.target.x},${j.target.z}`)).size === jobs.length;
    }
    return { covered, distinct, state: api.state(), errors: api.status().errors };
  });
  assert(result.covered >= 72, `Resource coverage ${result.covered}/80 half-second samples`);
  assert(result.distinct, 'Mining reservations stay unique');
  assert(
    result.state.tiles.some((t) => t.x === 9 && t.z >= 3 && t.z <= 10 && t.terrain === 'floor'),
    'Excavation also advances',
  );
  assert(
    result.state.tiles.some((t) => (t.wallProgress ?? 0) > 0 || (t.reinforced && t.x === 11 && t.z === 13)),
    'Construction also advances',
  );
  assert(
    result.state.roomServices.some((s) => s.stored > 0),
    'Workers bank income',
  );
  await page.getByRole('button', { name: 'Dwarfs', exact: true }).click();
  await page.locator('[data-dwarf-role="miner"]').click();
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/miner-work-pool.png' });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(errors, []);
  console.log(
    `PASS: resource coverage ${result.covered}/80 samples; distinct targets; excavation, construction and deliveries progress; no browser errors.`,
  );
} finally {
  await browser.close();
}
