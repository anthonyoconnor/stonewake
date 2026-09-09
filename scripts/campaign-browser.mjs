import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const folder = 'test-results/campaign'; mkdirSync(folder, { recursive: true });
const report = { areas: [], errors: [] };
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(90000);
  page.on('pageerror', e => report.errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const { GameScene } = await import(performance.getEntriesByType('resource').find(e => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name)).name);
    const render = GameScene.prototype.render; GameScene.prototype.render = function () { window.campaignView = this; return render.call(this); };
    window.routeApi = await import('/scripts/helpers/campaign-route.ts');
  });
  await page.waitForFunction(() => window.campaignView);
  for (let stage = 0; stage < 5; stage++) {
    const initial = await page.evaluate(() => window.strongholdDev.state());
    assert.equal(initial.freeRoomBuilding, false); assert.equal(initial.allowance, 400); assert.equal(initial.agents.length, 3);
    assert(!initial.onwardHearth.discovered); assert.equal(initial.campaign.completed.length, stage);
    await page.getByRole('button', { name: 'Rooms', exact: true }).click();
    for (const id of ['training', 'workshop', 'library'])
      assert.equal(await page.locator(`[data-room="${id}"]`).getAttribute('aria-disabled'), String(!initial.availability.buildings.includes(id)), `${initial.name}/${id} availability`);
    await page.getByRole('button', { name: 'Spells', exact: true }).click();
    assert.equal(await page.locator('[data-research="dwarf-haste"]').isDisabled(), !initial.availability.spells.includes('dwarf-haste'));
    await page.locator('#open-hearth').click();
    assert(await page.locator('#campaign-briefing').innerText());
    await page.evaluate(() => { window.route = window.routeApi.createCampaignRoute(window.campaignView.world, 'intended'); });
    console.log(`Playing ${initial.name} with normal economy and authored unlocks`);
    let outcome;
    for (let seconds = 0; seconds < 1800 && !outcome; seconds += 20) {
      const status = await page.evaluate(async () => {
        const api = window.strongholdDev;
        for (let i = 0; i < 20 && !window.campaignView.world.outcome; i++) {
          window.routeApi.actCampaignRoute(window.campaignView.world, window.route);
          await api.advance(1);
        }
        return { elapsed: window.campaignView.world.elapsed, outcome: window.campaignView.world.outcome };
      });
      outcome = status.outcome;
      if (seconds % 100 === 0) console.log(`${initial.name}: ${Math.round(status.elapsed)} game seconds`);
    }
    const result = await page.evaluate(() => window.routeApi.campaignRouteReport(window.campaignView.world, window.route));
    report.areas.push(result); assert.equal(outcome, 'victory', JSON.stringify(result));
    await page.locator('#open-hearth').click();
    await page.screenshot({ path: `${folder}/${initial.campaign.stageId}.png` });
    await page.setViewportSize({ width: 800, height: 600 });
    assert(await page.locator('#sidebar>footer').evaluate(f => f.getBoundingClientRect().bottom <= innerHeight));
    await page.locator('#level-outcome').scrollIntoViewIfNeeded(); await page.screenshot({ path: `${folder}/${initial.campaign.stageId}-compact.png` });
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (stage < 4) {
      await page.locator('#travel-onward').click(); await page.locator('#loading-screen').waitFor({ state: 'hidden' });
      await page.evaluate(() => window.strongholdDev.pause());
      const next = await page.evaluate(() => window.strongholdDev.state());
      assert.deepEqual(next.outputs, {}); assert.equal(next.craftOrders.length, 0); assert.equal(next.agents.length, 3);
      if (stage === 3) assert(next.campaign.knownSpells.length >= 2);
    } else {
      assert.equal(await page.locator('#travel-onward').isVisible(), false);
      assert.match(await page.locator('#level-outcome').innerText(), /journey|campaign|network/i);
    }
    writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2));
  }
  assert.deepEqual(report.errors, []); console.log(JSON.stringify(report));
} finally { writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
