import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const phase = process.argv.find((a) => a.startsWith('--phase='))?.split('=')[1] ?? 'after';
const folder = `test-results/graphics-overhaul/environment-${phase}`;
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
const report = { phase, captures: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.routeWebSocket(/.*/, () => {});
  page.setDefaultTimeout(90000);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=showcase&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  await page.evaluate(async () => {
    const entry = performance
      .getEntriesByType('resource')
      .find((e) => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name));
    const { GameScene } = await import(entry.name);
    const render = GameScene.prototype.render;
    GameScene.prototype.render = function () {
      window.graphicsView = this;
      return render.call(this);
    };
  });
  await page.waitForFunction(() => window.graphicsView);
  async function capture(name, x, z, radius, alpha = Math.PI / 4) {
    await page.evaluate(
      ({ x, z, radius, alpha }) => {
        const v = window.graphicsView;
        v.camera.target.set(x, 0.25, z);
        v.camera.radius = radius;
        v.camera.alpha = alpha;
        v.camera.beta = 0.67;
      },
      { x, z, radius, alpha },
    );
    await page.waitForTimeout(300);
    await page.evaluate(() => window.graphicsView.ready());
    await page.locator('#world').screenshot({ path: `${folder}/${name}.png` });
    report.captures.push(name);
  }
  await capture('showcase', 11, 12, 27);
  await capture('showcase-close', 7, 7, 13);
  await page.evaluate(() => window.strongholdDev.load('crossings'));
  await capture('crossings', 15, 8, 26);
  for (const stage of ['border-foothold', 'fungal-hollows', 'fallen-city', 'crystal-divide', 'royal-deep']) {
    const result = await page.evaluate(async (stage) => {
      const { startFreePlay } = await import('/src/game/session.ts');
      const v = window.graphicsView,
        w = startFreePlay(`campaign-${stage}`);
      v.setWorld(w);
      window.captureKnown = w.tiles.map((t) => t.known);
      return { x: w.hearth.x, z: w.hearth.z };
    }, stage);
    await capture(`${stage}-arrival`, result.x, result.z, 22);
    assert(
      await page.evaluate(() =>
        window.graphicsView.world.tiles.every((t, i) => t.known === window.captureKnown[i]),
      ),
      'Rendering preserves discovery',
    );
    const center = await page.evaluate(() => {
      const v = window.graphicsView,
        w = v.world;
      const c = w.tiles.find((t) => t.ruin && t.terrain === 'floor') ?? w.hearth;
      for (const t of w.tiles) if (Math.hypot(t.x - c.x, t.z - c.z) <= 8) t.known = true;
      w.revision++;
      return { x: c.x, z: c.z };
    });
    await capture(`${stage}-detail`, center.x, center.z, 19);
    await capture(`${stage}-reverse`, center.x, center.z, 19, Math.PI * 1.25);
  }
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
