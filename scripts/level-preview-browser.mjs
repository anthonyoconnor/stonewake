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
  await page.getByRole('button', { name: 'Debug', exact: true }).click();
  const retained = await page.evaluate(() => window.strongholdDev.state());
  await page.getByRole('button', { name: 'Level preview', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Level preview', exact: true });
  const ids = await page.locator('#preview-level option').evaluateAll(options => options.map(o => o.value));
  const catalogIds = await page.evaluate(async () => (await import('/src/content/playable-levels.ts')).playableLevels.map(l => l.id));
  assert.deepEqual([...ids].sort(), ['current', ...catalogIds].sort());
  for (const id of ids) {
    await page.locator('#preview-level').selectOption(id);
    const result = await page.evaluate(async id => {
      const { playableLevels } = await import('/src/content/playable-levels.ts');
      const { createWorld } = await import('/src/game/world.ts');
      const w = id === 'current' ? window.strongholdDev.state() : createWorld(playableLevels.find(l => l.id === id).level);
      const canvas = document.querySelector('#level-preview-map');
      const c = canvas.getContext('2d');
      const pixel = p => [...c.getImageData(Math.floor((p.x + .5) / w.width * canvas.width), Math.floor((p.z + .5) / w.height * canvas.height), 1, 1).data];
      const enemies = (w.enemies ?? []).filter(e => e.health > 0);
      const hidden = w.tiles.find(t => !t.known && t.terrain === 'dirt');
      const rect = canvas.getBoundingClientRect(), holder = canvas.parentElement.getBoundingClientRect();
      return {
        enemyPixels: enemies.map(pixel), enemyCount: enemies.length,
        hiddenPixel: pixel(hidden),
        fits: rect.left >= holder.left && rect.right <= holder.right + 1 && rect.top >= holder.top && rect.bottom <= holder.bottom + 1,
      };
    }, id);
    assert.deepEqual(result.hiddenPixel, [111, 90, 67, 255], `${id}: hidden dirt is rendered`);
    for (const color of result.enemyPixels) assert.deepEqual(color, [255, 89, 100, 255], `${id}: enemy center is red`);
    assert.equal(result.fits, true, `${id}: whole map fits`);
    assert.equal(await page.locator('#preview-enemies button').count(), result.enemyCount);
  }
  await page.locator('#preview-level').selectOption('current');
  await page.locator('#preview-enemy-count').click();
  const enemyButton = page.locator('#preview-enemies button').first();
  const enemyLabel = await enemyButton.textContent();
  await enemyButton.click();
  assert.ok((await page.locator('#preview-position').textContent()).includes(enemyLabel.split(' · ')[0]));
  await page.locator('#level-preview-map').click({ position: { x: 10, y: 10 } });
  assert.match(await page.locator('#preview-position').textContent(), /\d+, \d+/);
  mkdirSync('test-results/level-preview', { recursive: true });
  await page.screenshot({ path: 'test-results/level-preview/whole-level.png' });
  await page.setViewportSize({ width: 800, height: 600 });
  const fits = await dialog.evaluate(d => { const c = d.querySelector('canvas').getBoundingClientRect(); return c.right <= innerWidth && c.bottom <= innerHeight; });
  assert.equal(fits, true);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), false);
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.state()), retained);
  assert.equal(await page.evaluate(() => window.strongholdDev.status().paused), true);

  // Opening from a running game suspends time without changing its pause preference.
  await page.evaluate(() => window.strongholdDev.pause(false));
  await page.getByRole('button', { name: 'Level preview', exact: true }).click();
  const frozen = await page.evaluate(() => window.strongholdDev.state());
  await page.waitForTimeout(250);
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.state()), frozen);
  await page.getByRole('button', { name: 'Close level preview' }).click();
  await page.waitForFunction(elapsed => window.strongholdDev.state().elapsed > elapsed, frozen.elapsed);
  await page.evaluate(() => window.strongholdDev.pause(true));
  // Ordinary full-map fog is still intact after using the preview.
  await page.getByRole('button', { name: 'Show full map', exact: true }).click();
  const concealed = await page.evaluate(() => {
    const w = window.strongholdDev.state(), t = w.tiles.find(t => !t.known && t.terrain === 'dirt');
    const c = document.querySelector('#full-map');
    return [...c.getContext('2d').getImageData(Math.floor((t.x + .5) / w.width * c.width), Math.floor((t.z + .5) / w.height * c.height), 1, 1).data];
  });
  assert.deepEqual(concealed, [12, 19, 25, 255]);
  assert.deepEqual(errors, []);
  console.log('PASS: all level previews, hidden terrain/enemy pixels, inspection, compact layout, state preservation and pause/resume.');
} finally {
  await browser.close();
}
