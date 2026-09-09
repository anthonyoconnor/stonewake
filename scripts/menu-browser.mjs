import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(process.env.GAME_URL ?? 'http://127.0.0.1:5173');
  await page.waitForFunction(() => window.strongholdDev);
  await page.locator('#main-menu[open]').waitFor();
  const before = await page.evaluate(() => window.strongholdDev.state().elapsed);
  await page.keyboard.press('m'); await page.keyboard.press('w');
  assert.equal(await page.locator('#full-map-dialog[open]').count(), 0);
  assert.equal(await page.evaluate(() => window.strongholdDev.state().elapsed), before);
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/m25-main-menu.png' });
  await page.locator('#menu-settings').click();
  await page.locator('#motion').selectOption('reduce');
  await page.locator('#edge-scrolling').uncheck();
  await page.keyboard.press('Escape');
  await page.locator('#free-play').click();
  await page.locator('[data-level=emberwater-crossing]').click();
  await page.screenshot({ path: 'test-results/m25-free-play.png' });
  const ids = await page.locator('[data-level]').evaluateAll(rows => rows.map(r => r.dataset.level));
  const returnToMenu = async () => {
    await page.locator('#open-menu').click();
    await page.locator('#discard-run').click();
    await page.locator('#main-menu[open]').waitFor();
  };
  for (const id of ids) {
    if (await page.locator('#free-play').count()) await page.locator('#free-play').click();
    await page.locator(`[data-level="${id}"]`).click();
    await page.locator('#start-level').click();
    await page.locator('#main-menu').waitFor({ state: 'hidden' });
    await page.evaluate(() => window.strongholdDev.pause(true));
    const fresh = await page.evaluate(() => window.strongholdDev.state());
    assert.equal(fresh.freePlay.levelId, id); assert.equal(fresh.campaign, undefined);
    assert.equal(fresh.agents.length, 3); assert.equal(fresh.allowance, 400);
    await page.evaluate(() => window.strongholdDev.command({ kind: 'spawn', type: 'warrior' }));
    // Cancel keeps the exact run and prior pause state.
    await page.locator('#open-menu').click(); await page.locator('#keep-playing').click();
    assert.equal(await page.evaluate(() => window.strongholdDev.state().agents.length), 4);
    assert.equal(await page.evaluate(() => window.strongholdDev.status().paused), true);
    await page.getByRole('button', { name: 'Debug', exact: true }).click();
    await page.locator('#restart').click(); await page.locator('#discard-run').click();
    await page.waitForFunction(() => window.strongholdDev.state().agents.length === 3);
    await page.evaluate(() => window.strongholdDev.pause(true));
    const restarted = await page.evaluate(() => window.strongholdDev.state());
    assert.equal(restarted.freePlay.levelId, id); assert.deepEqual(restarted.outputs, {}); assert.equal(restarted.researchOrders.length, 0);
    await returnToMenu();
  }
  await page.locator('#start-campaign').focus(); await page.keyboard.press('Enter');
  await page.locator('#main-menu').waitFor({ state: 'hidden' });
  const campaign = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(campaign.freePlay, undefined); assert.equal(campaign.campaign.stageId, 'border-foothold');
  assert(!campaign.campaign.unlockedBuildings.includes('bridge'));
  await returnToMenu();
  for (const viewport of [{ width: 800, height: 600 }, { width: 390, height: 740 }]) {
    await page.setViewportSize(viewport); await page.locator('#free-play').click();
    await page.locator('[data-level=region-volcanic]').click();
    await page.locator('#start-level').scrollIntoViewIfNeeded();
    assert(await page.locator('#start-level').isVisible());
    assert(await page.evaluate(() => document.querySelector('#main-menu').scrollWidth <= innerWidth));
    await page.screenshot({ path: `test-results/m25-menu-${viewport.width}.png` });
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log(`Menus: ${ids.length} levels, starts/restarts, mode isolation, confirmation/cancel, keyboard, settings and compact layouts passed.`);
} finally { await browser.close(); }
