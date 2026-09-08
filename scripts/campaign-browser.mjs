import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
const report = { areas: [], errors: [] };
mkdirSync('test-results/m18', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(60000);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  const state = () => page.evaluate(() => window.strongholdDev.state());
  const command = (c) => page.evaluate((c) => window.strongholdDev.command(c), c);
  const advance = async (seconds) => {
    // Small batches keep browser rendering and progress observable on larger levels.
    while (seconds > 0) {
      const n = Math.min(20, seconds);
      await page.evaluate((n) => window.strongholdDev.advance(n), n);
      seconds -= n;
    }
  };
  const until = async (predicate, seconds, label) => {
    for (let n = 0; n <= seconds; n += 10) {
      const w = await state();
      if (predicate(w)) return w;
      assert.notEqual(w.outcome, 'defeat', label + ' ended in defeat');
      if (n < seconds) await advance(10);
    }
    const w = await state();
    throw Error(
      `${label}: ${JSON.stringify({ time: w.elapsed, onward: w.onwardHearth, agents: w.agents.map((a) => ({ type: a.type, job: a.activity, x: a.x, z: a.z })), enemies: w.enemies })}`,
    );
  };
  const rect = (x, z, width, depth) =>
    Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));
  const build = async (room, x, z, width, depth) =>
    assert.match(await command({ kind: 'build', room, points: rect(x, z, width, depth) }), /built/);
  const capture = async (name) => {
    const image = await page.locator('#world').evaluate((c) => c.toDataURL('image/png').split(',')[1]);
    writeFileSync(`test-results/m18/${name}.png`, Buffer.from(image, 'base64'));
    writeFileSync(`test-results/m18/${name}-sidebar.txt`, await page.locator('#sidebar').innerText());
  };
  const compactResult = async (name) => {
    await page.setViewportSize({ width: 800, height: 600 });
    const layout = await page.evaluate(() => ({
      panel: document.querySelector('#panel').clientHeight,
      footer: document.querySelector('#sidebar>footer').getBoundingClientRect().bottom,
    }));
    assert(layout.panel >= 75 && layout.footer <= 600, `${name}: ${JSON.stringify(layout)}`);
    for (const button of await page.locator('#level-outcome button:visible').all()) {
      await button.scrollIntoViewIfNeeded();
      assert(await button.isVisible());
    }
    await page.screenshot({ path: `test-results/m18/${name}-compact.png` });
    await page.setViewportSize({ width: 1440, height: 1000 });
  };
  let w = await state();
  assert.equal(w.freeRoomBuilding, false);
  assert.equal(w.campaign.stageId, 'border-foothold');
  console.log('Campaign loaded: normal Border Foothold economy.');
  await page.locator('#open-hearth').click();
  assert.match(await page.locator('#campaign-briefing').innerText(), /upper workings/);
  assert.equal(await page.locator('#travel-onward').isVisible(), false);
  await build('treasure', 19, 25, 3, 3);
  await build('kitchen', 25, 25, 3, 2);
  await build('dormitory', 25, 20, 3, 2);
  await command({ kind: 'dig', points: rect(20, 18, 6, 1) });
  await advance(60);
  await build('training', 19, 23, 2, 1);
  await build('library', 26, 24, 1, 1);
  await command({ kind: 'research', spell: 'call-to-arms' });
  await command({ kind: 'research', spell: 'dwarf-haste' });
  await advance(130);
  console.log('Settlement staffed; excavating the northern gate.');
  await command({ kind: 'dig', points: rect(23, 14, 2, 5) });
  await until(
    (w) =>
      w.onwardHearth.discovered &&
      w.enemies.filter((e) => e.sourceId === 'buried-guard-camp').every((e) => e.health <= 0),
    140,
    'Clear the northern camp',
  );
  await until(
    (w) => w.researchOrders.some((o) => o.spell === 'dwarf-haste' && o.unlocked),
    90,
    'Finish transferable research',
  );
  await page.locator('#activate-hearth').click();
  w = await until((w) => w.outcome === 'victory', 120, 'Activate first Hearthstone');
  const known = w.researchOrders.filter((o) => o.unlocked).map((o) => o.spell);
  assert(known.length >= 2);
  report.areas.push({ name: w.name, elapsed: w.elapsed, residents: w.agents.length, research: known });
  await capture('first-gate');
  await compactResult('first-gate');
  console.log('First area complete; choosing onward travel.');
  await page.locator('#travel-onward').click();
  await page.evaluate(() => window.strongholdDev.pause());
  w = await state();
  assert.equal(w.campaign.stageId, 'emberwater-crossing');
  assert.equal(w.agents.length, 3);
  assert(w.agents.every((a) => a.type === 'miner' && a.level === 1 && !a.pay.due.length));
  assert(w.elapsed < 1);
  assert.deepEqual(w.campaign.knownSpells, known);
  assert(
    w.researchOrders.every(
      (o) => o.unlocked && o.paused && o.progress === 0 && o.state === 'queued' && !o.worker,
    ),
  );
  assert.deepEqual(w.outputs, {});
  assert.equal(w.craftOrders.length, 0);
  assert(!w.tiles.some((t) => t.room));
  assert(w.campaign.unlockedBuildings.includes('bridge'));
  assert(!w.encounters.some((s) => s.definition.id === 'buried-guard-camp'));
  await capture('fresh-emberwater');
  console.log('Fresh Emberwater arrival and research carryover verified.');
  // Same-area restart restores entry knowledge and stays in the second campaign area.
  await page.evaluate(async () => {
    await window.strongholdDev.advance(1);
  });
  await page.locator('#open-hearth').click();
  // Retry is verified through the ordinary result control after the final endpoint below.
  await build('treasure', 2, 5, 3, 2);
  await build('kitchen', 7, 10, 2, 3);
  await build('dormitory', 2, 10, 2, 3);
  await build('training', 7, 6, 2, 1);
  await build('library', 7, 7, 1, 1);
  await command({ kind: 'research', spell: 'call-to-arms' });
  await command({ kind: 'dig', points: [...rect(3, 4, 3, 1), { x: 3, z: 13 }] });
  await advance(160);
  assert.match(await command({ kind: 'bridge', points: rect(10, 9, 2, 1) }), /2 bridge squares planned/);
  await until(
    (w) => w.tiles[9 * w.width + 16].claimed && w.tiles[9 * w.width + 18].known,
    300,
    'Claim the middle island shore',
  );
  assert.match(await command({ kind: 'bridge', points: rect(17, 9, 2, 1) }), /2 bridge squares planned/);
  console.log('Middle shore reached; building the lava bridge.');
  await until(
    (w) =>
      w.onwardHearth.discovered &&
      w.enemies.filter((e) => e.sourceId === 'ember-sentry').every((e) => e.health <= 0),
    180,
    'Clear the Emberwater approach',
  );
  w = await state();
  assert.notEqual(w.outcome, 'victory', 'Discovery alone must not finish the area');
  assert(w.tiles.filter((t) => t.bridge).length >= 4);
  await page.locator('#activate-hearth').click();
  w = await until((w) => w.outcome === 'victory', 150, 'Activate final Hearthstone');
  report.areas.push({
    name: w.name,
    elapsed: w.elapsed,
    residents: w.agents.length,
    bridges: w.tiles.filter((t) => t.bridge).length,
  });
  assert.match(await page.locator('#outcome-title').innerText(), /runic routes are restored/);
  assert.equal(await page.locator('#travel-onward').isVisible(), false);
  assert(await page.locator('#restart-campaign').isVisible());
  await capture('campaign-complete');
  await compactResult('campaign-complete');
  await page.locator('#restart-area').click();
  await page.evaluate(() => window.strongholdDev.pause());
  w = await state();
  assert.equal(w.campaign.stageId, 'emberwater-crossing');
  assert(!w.outcome);
  assert(!w.tiles.some((t) => t.bridge || t.room));
  assert.deepEqual(w.campaign.knownSpells, known);
  assert.deepEqual(report.errors, []);
  assert.deepEqual((await page.evaluate(() => window.strongholdDev.status())).errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  writeFileSync('test-results/m18/report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
