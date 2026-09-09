import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const production = process.argv.includes('--production');
const url = production ? 'http://127.0.0.1:4179' : (process.env.GAME_URL ?? 'http://127.0.0.1:5173');
let server, browser;
try {
  if (production) {
    server = spawn(
      process.execPath,
      ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4179', '--strictPort'],
      { stdio: 'pipe', windowsHide: true },
    );
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Preview server startup timed out')), 10000);
      server.once('error', reject);
      server.once('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`Preview server exited (${code})`));
      });
      server.stdout.on('data', (data) => {
        if (String(data).includes('4179')) {
          clearTimeout(timer);
          resolve();
        }
      });
      server.stderr.on('data', (data) => process.stderr.write(data));
    });
  }
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${message.text()} ${message.location().url}`);
  });
  await page.goto(`${url}/?scenario=${production?'crowded-kitchen':'stronghold'}&paused=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.locator('#sidebar').waitFor();
  if (production) {
    await page.locator('#start-campaign').click();
    await page.locator('#main-menu').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Debug', exact: true }).click();
    assert.equal(await page.evaluate(() => typeof window.strongholdDev), 'undefined');
    assert.equal(await page.getByRole('heading', { name: 'Additional test scenarios' }).count(), 0);
    assert.equal(await page.locator('.map-section .eyebrow span').first().textContent(), 'Border Foothold');
    console.log('PASS: production ignores scenario URL and exposes no development API or simulation panel.');
  } else {
    await page.waitForFunction(() => window.strongholdDev?.version === 1);
    assert((await page.evaluate(() => window.strongholdDev.state().agents.length)) > 0);
    await page.getByRole('button', {name:'Spells',exact:true}).click();
    assert(await page.locator('[data-spell="summon-stonehand"]').isVisible());
    await page.getByRole('button', {name:'Workforce',exact:true}).click();
    assert((await page.locator('[data-dwarf-role]').count()) > 0);
    await page.evaluate(() => window.strongholdDev.advance(.1));
    assert.equal(await page.evaluate(() => window.strongholdDev.state().elapsed),.1);
    assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors),[]);
    console.log('PASS: startup, current workforce/spell controls and simulation step.');
  }
  assert.deepEqual(errors, [], 'Browser console and runtime errors');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
