import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.routeWebSocket(/.*/, () => {});
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  await page.locator('#loading-screen').waitFor({ state: 'hidden', timeout: 60000 });
  mkdirSync('test-results/habitats', { recursive: true });
  for (const level of ['border-foothold', 'region-fungal', 'region-ancient', 'region-crystal', 'region-volcanic']) {
    await page.getByRole('button', { name: 'Debug', exact: true }).click();
    await page.getByRole('button', { name: 'Level preview', exact: true }).click();
    await page.locator('#preview-level').selectOption(level);
    await page.getByRole('button', { name: 'Load full level', exact: true }).click();
    await page.locator('#loading-screen').waitFor({ state: 'hidden', timeout: 60000 });
    const before = await page.evaluate(() => window.strongholdDev.state().enemies);
    await page.evaluate(() => window.strongholdDev.advance(6));
    const result = await page.evaluate(async () => {
      const source = await (await fetch('/src/view/scene.ts')).text();
      const { EngineStore } = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
      const scene = EngineStore.LastCreatedScene;
      return window.strongholdDev.state().enemies.map(e => {
        const node = scene.getTransformNodeByName(`${e.type ?? 'goblin-raider'} ${e.id}`);
        return { ...e, rendered: node?.isEnabled() && node.getChildMeshes().some(m => m.isVisible),
          model: node && { x: node.position.x, z: node.position.z } };
      });
    });
    for (const e of result) {
      const start = before.find(p => p.id === e.id);
      assert(e.rendered, `${level}: ${e.type} is visible`);
      assert(Math.hypot(e.x - start.x, e.z - start.z) > 0.2, `${level}: ${e.type} moves`);
      assert(Math.hypot(e.model.x - e.x, e.model.z - e.z) < 0.1, `${level}: model follows simulation`);
    }
    await page.screenshot({ path: `test-results/habitats/${level}.png` });
    await page.getByRole('button', { name: 'Return to stronghold', exact: true }).click();
    await page.locator('#loading-screen').waitFor({ state: 'hidden', timeout: 60000 });
  }
  assert.deepEqual(errors, []);
  console.log('PASS: roaming enemies and matching visible models in five full-level previews.');
} finally {
  await browser.close();
}
