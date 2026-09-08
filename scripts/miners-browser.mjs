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
      distinct = true,
      roleChanges = 0,
      unfinished = 0;
    const roles = new Map();
    let previous = api.state();
    for (let i = 0; i < 120; i++) {
      await api.advance(0.5);
      const w = api.state();
      const jobs = w.agents.filter((a) => a.job?.kind === 'mine').map((a) => a.job);
      if (w.agents.some((a) => a.workAssignment?.group === 'resource')) covered++;
      distinct &&= new Set(jobs.map((j) => `${j.target.x},${j.target.z}`)).size === jobs.length;
      for (const a of w.agents) {
        const j = a.job;
        if (j && !['idle', 'deliver', 'drop', 'sleep', 'eat', 'pay', 'activate'].includes(j.kind)) {
          const t = w.tiles[j.target.z * w.width + j.target.x];
          const group =
            j.kind === 'mine' ? (['gold', 'gem'].includes(t.terrain) ? 'resource' : 'excavate') : j.kind;
          if (roles.has(a.id) && roles.get(a.id) !== group) roleChanges++;
          roles.set(a.id, group);
        }
        const old = previous.agents.find((o) => o.id === a.id)?.job;
        if (!old || (j?.kind === old.kind && j.target.x === old.target.x && j.target.z === old.target.z))
          continue;
        const target = w.tiles[old.target.z * w.width + old.target.x];
        if (
          (old.kind === 'buildWall' && target.wallPlanned) ||
          (old.kind === 'mine' && ['dirt', 'rock'].includes(target.terrain) && target.designated)
        )
          unfinished++;
      }
      previous = w;
    }
    return { covered, distinct, roleChanges, unfinished, state: api.state(), errors: api.status().errors };
  });
  assert(result.covered >= 108, `Resource assignment coverage ${result.covered}/120 half-second samples`);
  assert.equal(result.unfinished, 0, 'Rebalancing never interrupts an unfinished tile');
  assert(result.roleChanges <= 8, `Excessive role changes: ${result.roleChanges}`);
  assert(result.distinct, 'Mining reservations stay unique');
  assert(
    result.state.tiles.filter((t) => t.x === 9 && t.z >= 3 && t.z <= 10 && t.terrain === 'floor').length ===
      8,
    'All marked excavation completes',
  );
  assert(
    [11, 12].every((x) => result.state.tiles[13 * result.state.width + x].reinforced),
    'Both planned walls complete',
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
    `PASS: resource assignments ${result.covered}/120 samples; ${result.roleChanges} role changes; zero unfinished tasks interrupted; all excavation and both walls complete; deliveries progress; no browser errors.`,
  );
} finally {
  await browser.close();
}
