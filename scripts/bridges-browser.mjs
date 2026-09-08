import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  channel: process.platform === 'win32' ? 'msedge' : undefined,
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto((process.env.GAME_URL ?? 'http://127.0.0.1:5173') + '/?scenario=crossings&paused=1');
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'crossings');
  const state = () => page.evaluate(() => window.strongholdDev.state());
  const command = (c) => page.evaluate((c) => window.strongholdDev.command(c), c);
  const advance = (s) => page.evaluate((s) => window.strongholdDev.advance(s), s);
  const until = async (predicate, seconds = 100) => {
    for (let i = 0; i < seconds / 5; i++) {
      const w = await state();
      if (predicate(w)) return w;
      await advance(5);
    }
    const w = await state();
    assert(predicate(w), JSON.stringify({ agents: w.agents, onward: w.onwardHearth }));
    return w;
  };
  const at = (w, x, z) => w.tiles[z * w.width + x];
  const rect = (x, z) => [0, 1, 2].map((dx) => ({ x: x + dx, z }));
  await command({ kind: 'free-build', enabled: false });
  console.log('Loaded ordinary crossing scenario');
  await advance(15);
  await command({ kind: 'build', room: 'kitchen', points: rect(3, 7) });
  await command({ kind: 'build', room: 'dormitory', points: rect(3, 12) });
  await until((w) => at(w, 9, 9).claimed);
  const clickTile = async (x, z) => {
    const p = await page.evaluate(
      async ({ x, z }) => {
        const source = await (await fetch('/src/view/scene.ts')).text();
        const url = source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1];
        const { EngineStore, Vector3, Matrix } = await import(url);
        const scene = EngineStore.LastCreatedScene,
          engine = scene.getEngine();
        const p = Vector3.Project(
          new Vector3(x, 0, z),
          Matrix.Identity(),
          scene.getTransformMatrix(),
          scene.activeCamera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
        );
        const r = document.querySelector('#world').getBoundingClientRect();
        return {
          x: r.x + (p.x * r.width) / engine.getRenderWidth(),
          y: r.y + (p.y * r.height) / engine.getRenderHeight(),
        };
      },
      { x, z },
    );
    await page.mouse.click(p.x, p.y);
  };
  console.log('Building crossing via canvas');
  await page.locator('[data-tool="bridge"]').click();
  await clickTile(10, 9);
  assert(at(await state(), 10, 9).bridgePlanned, 'Actual canvas click plans bridge');
  await clickTile(11, 9);
  assert(at(await state(), 11, 9).bridgePlanned);
  await until((w) => at(w, 11, 9).bridge);
  await until((w) => at(w, 16, 9).claimed);
  const w = await state();
  assert(!w.onwardHearth.ready);
  await command({ kind: 'activate-hearth' });
  await advance(10);
  assert(!(await state()).onwardHearth.ready);
  // Pan using the minimap, then use the same canvas construction tool at the lava bank.
  const map = await page.locator('#minimap').boundingBox();
  await page.mouse.click(map.x + (map.width * 18) / w.width, map.y + (map.height * 9) / w.height);
  await page.waitForTimeout(250);
  console.log('Building crossing via canvas');
  await page.locator('[data-tool="bridge"]').click();
  await clickTile(17, 9);
  await clickTile(18, 9);
  assert(at(await state(), 18, 9).bridgePlanned);
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/m16-lava-plans.png' });
  await until((w) => at(w, 18, 9).bridge && w.onwardHearth.discovered);
  await page.locator('#open-hearth').click();
  await page.locator('#activate-hearth').click();
  await until((w) => w.outcome === 'victory', 160);
  await page.screenshot({ path: 'test-results/m16-complete.png' });
  assert.deepEqual(errors, []);
  console.log(
    'M16 browser passed: paid canvas construction across water/lava, fog exploration, physical activation and endpoint.',
  );
} finally {
  await browser.close();
}
