import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const folder = 'test-results/m31-biomes';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
const report = { scenes: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(90000);
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const resource = performance.getEntriesByType('resource').find(e => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name));
    const { GameScene } = await import(resource.name);
    const render = GameScene.prototype.render;
    GameScene.prototype.render = function () { window.biomeView = this; return render.call(this); };
  });
  await page.waitForFunction(() => window.biomeView);
  const stages = await page.evaluate(async () => (await import('/src/content/campaign.ts')).campaignStages.map(s => s.id));
  for (const stage of stages) {
    // Authored normal starting worlds supply the real availability, ruins and fog; the second
    // capture reveals a local ruin as a visual fixture only. Gameplay routes are tested elsewhere.
    const initial = await page.evaluate(async stage => {
      const { startFreePlay } = await import('/src/game/session.ts');
      const v = window.biomeView, w = startFreePlay(`campaign-${stage}`);
      v.setWorld(w); v.camera.target.set(w.hearth.x, 0, w.hearth.z);
      v.camera.radius = 22; v.camera.alpha = -Math.PI / 4; v.camera.beta = .62;
      window.biomeKnown = w.tiles.map(t => t.known);
      return { stage, biome: w.biome, known: w.tiles.filter(t => t.known).length, ruinTiles: w.tiles.filter(t => t.ruin).length };
    }, stage);
    await page.waitForTimeout(400);
    await page.locator('#world').screenshot({ path: `${folder}/${stage}-arrival.png` });
    const lighting = await page.evaluate(() => {
      const v = window.biomeView, w = v.world, l = v.labLighting;
      return { unchanged: w.tiles.every((t, i) => t.known === window.biomeKnown[i]), ambient: v.scene.getLightByName('cavern light').intensity,
        sources: l.activeSources, lights: v.scene.lights.filter(l => l.name.startsWith('M33')).length,
        hiddenMeshesLit: l.sources.filter(s => s.isEnabled()).some(s => s.includedOnlyMeshes.some(m => {
          const t = m.metadata?.tile; return t && !w.tiles[t.z * w.width + t.x]?.known;
        })) };
    });
    assert(lighting.unchanged); assert(!lighting.hiddenMeshesLit); assert.equal(lighting.lights, 7); assert(lighting.sources <= 6);
    const detail = await page.evaluate(() => {
      const v = window.biomeView, w = v.world;
      const center = w.tiles.find(t => t.ruin && t.terrain === 'floor') ?? w.tiles.find(t => t.terrain === 'lava') ?? w.hearth;
      for (const t of w.tiles) if (Math.hypot(t.x-center.x, t.z-center.z) <= 7) t.known = true;
      w.revision++; v.camera.target.set(center.x, 0, center.z); v.camera.radius = 20; v.camera.alpha = Math.PI / 4;
      return { x:center.x, z:center.z, ruin: !!center.ruin };
    });
    await page.waitForTimeout(400);
    await page.locator('#world').screenshot({ path: `${folder}/${stage}-detail.png` });
    await page.evaluate(() => window.biomeView.camera.alpha += Math.PI);
    await page.waitForTimeout(200);
    await page.locator('#world').screenshot({ path: `${folder}/${stage}-reverse.png` });
    report.scenes.push({ ...initial, lighting, detail });
  }
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
