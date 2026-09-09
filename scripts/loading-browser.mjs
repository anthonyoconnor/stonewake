import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
try {
  mkdirSync('test-results', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let releaseModule;
  const slowModule = new Promise(resolve => releaseModule = resolve);
  await page.route('**/src/main.ts*', async route => { await slowModule; await route.continue(); });
  await page.route('**/art/**', route => route.abort()); // Usable fallback without large artwork.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('#loading-screen[open]').waitFor();
  assert.equal(await page.locator('#sidebar').count(), 0, 'Shell precedes the expensive game module');
  assert.equal(await page.locator('#loading-reload').isVisible(), false);
  assert.equal(await page.locator('.loading-activity').evaluate(e => getComputedStyle(e, '::after').animationName), 'none');
  await page.screenshot({ path: 'test-results/m25-1-cold-loading.png' });
  releaseModule();
  await page.locator('#loading-screen').waitFor({ state: 'hidden', timeout: 60000 });
  await page.unroute('**/art/**');
  assert(await page.locator('#start-campaign').isVisible());
  // Delay renderer readiness: the destination exists but must remain covered and paused.
  await page.evaluate(async () => {
    const { GameScene } = await import(performance.getEntriesByType('resource').find(e => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name)).name);
    const original = GameScene.prototype.ready;
    GameScene.prototype.ready = async function (...args) {
      GameScene.prototype.ready = original;
      await new Promise(resolve => window.releaseReady = resolve);
      return original.apply(this, args);
    };
  });
  await page.locator('#start-campaign').click();
  await page.waitForFunction(() => typeof window.releaseReady === 'function');
  const frozen = await page.evaluate(() => window.strongholdDev.state().elapsed);
  assert(await page.locator('#loading-screen').isVisible());
  assert.equal(await page.locator('#app').evaluate(e => e.inert), true);
  await page.keyboard.press('Escape'); await page.keyboard.press('m');
  assert(await page.locator('#loading-screen').isVisible());
  assert.equal(await page.locator('#full-map-dialog[open]').count(), 0);
  assert.equal(await page.evaluate(() => window.strongholdDev.state().elapsed), frozen);
  await page.screenshot({ path: 'test-results/m25-1-level-loading.png' });
  await page.evaluate(() => window.releaseReady());
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.locator('#main-menu').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Debug', exact: true }).click();
  // A failed transition offers a real retry and restores the requested fresh world.
  await page.evaluate(async () => {
    const { GameScene } = await import(performance.getEntriesByType('resource').find(e => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name)).name);
    const original = GameScene.prototype.setWorld;
    GameScene.prototype.setWorld = function (...args) { GameScene.prototype.setWorld = original; throw new Error('Test renderer could not initialize'); };
  });
  await page.locator('#restart').click(); await page.locator('#discard-run').click();
  await page.locator('#loading-screen[data-phase=error]').waitFor();
  assert.match(await page.locator('#loading-status').textContent(), /could not initialize/);
  assert(await page.locator('#loading-reload').isVisible());
  await page.locator('#loading-retry').click();
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => window.strongholdDev.state().agents.length), 3);
  assert.equal(await page.locator('#app').evaluate(e => e.inert), false);
  assert.deepEqual(errors, []);
  const failed = await browser.newPage();
  await failed.route('**/src/bootstrap.ts*', route => route.abort());
  await failed.goto(url, { waitUntil: 'domcontentloaded' });
  await failed.locator('#loading-screen[data-phase=error]').waitFor();
  assert(await failed.locator('#loading-reload').isVisible());
  await failed.unroute('**/src/bootstrap.ts*');
  await failed.locator('#loading-reload').click();
  await failed.locator('#loading-screen').waitFor({ state: 'hidden', timeout: 60000 });
  assert(await failed.locator('#start-campaign').isVisible());
  console.log('Cold/slow startup, missing art fallback, reduced motion, covered ready-frame wait, input freeze, failed restart/retry and startup failure/reload passed.');
} finally { await browser.close(); }
