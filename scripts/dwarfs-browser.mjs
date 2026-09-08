import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=economy&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  await page.getByRole('button', { name: 'Dwarfs', exact: true }).click();
  assert.equal(await page.locator('[data-dwarf-count]').count(), 16);
  assert.equal(await page.locator('.resident-row').count(), 0);
  assert.equal(await page.locator('#buy-miner').isVisible(), false);
  const checkCounts = async () => {
    const state = await page.evaluate(() => window.strongholdDev.state());
    for (const type of ['miner', 'engineer', 'warrior', 'runesmith']) {
      const counts = await page.locator(`[data-dwarf-count^="${type}:"]`).allTextContents();
      assert.equal(counts.reduce((n, c) => n + Number(c), 0), state.agents.filter(a => a.type === type).length);
    }
  };
  await checkCounts();
  mkdirSync('test-results', { recursive: true });
  await page.locator('.dwarf-activity').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/dwarfs-activity.png' });
  await page.locator('[data-dwarf-count="miner:idle"]').click();
  await page.locator('.resident-row summary').click();
  assert(await page.getByRole('button', { name: 'Locate dwarf', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Locate dwarf', exact: true }).click();
  assert((await page.locator('#unit-inspection').textContent()).includes('Health'));
  await page.locator('[data-dwarf-count="miner:combat"]').click();
  assert.equal(await page.locator('.resident-row').count(), 0);
  await page.evaluate(async () => {
    const api = window.strongholdDev;
    for (const a of api.state().agents) api.command({ kind: 'needs', id: a.id, hunger: .1, energy: .1 });
    await api.advance(1);
  });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-dwarf-count$=":needs"]')].some(b => Number(b.textContent) > 0));
  await checkCounts();
  await page.locator('.population-details > summary').click();
  assert(await page.locator('#buy-miner').isVisible());
  assert(await page.locator('#reopen-morale').isVisible());
  await page.locator('.population-details > summary').click();
  await page.locator('[data-dwarf-role="miner"]').click();
  await page.locator('.resident-row summary').click();
  await page.waitForTimeout(500);
  assert(await page.getByRole('button', { name: 'Locate dwarf', exact: true }).isVisible());
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/dwarfs-details.png' });
  await page.setViewportSize({ width: 800, height: 720 });
  assert(await page.locator('.dwarf-activity').evaluate(e => e.scrollWidth <= e.clientWidth));
  assert.deepEqual(errors, []);
  console.log('Dwarf activity grid: counts, live needs, filters, detail persistence, locate, management and narrow layout passed.');
} finally { await browser.close(); }
