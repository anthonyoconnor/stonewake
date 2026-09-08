import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
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
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${message.text()} ${message.location().url}`);
  });
  await page.goto(`${url}/?scenario=crowded-kitchen&paused=1`);
  await page.locator('#sidebar').waitFor();
  if (production) {
    await page.getByRole('button', { name: 'Debug', exact: true }).click();
    assert.equal(await page.evaluate(() => typeof window.strongholdDev), 'undefined');
    assert.equal(await page.getByRole('heading', { name: 'Simulation tools' }).count(), 0);
    assert.equal(await page.locator('.map-section .eyebrow span').first().textContent(), 'Border Foothold');
    console.log('PASS: production ignores scenario URL and exposes no development API or simulation panel.');
  } else {
    await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'crowded-kitchen');
    const start = await page.evaluate(() => window.strongholdDev.status());
    assert(start.paused);
    assert.equal(start.elapsed, 0);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.strongholdDev.status().elapsed), 0);
    const result = await page.evaluate(async () => {
      const api = window.strongholdDev;
      const advanced = await api.advance(12);
      return { advanced, status: api.status(), state: api.state(), diagnostic: api.inspect() };
    });
    assert(Math.abs(result.advanced.elapsed - 12) < 1e-6);
    assert(result.diagnostic.recentEvents.length > 0);
    assert(result.state.agents.every((a) => a.path));
    await page.evaluate(() => window.strongholdDev.load('room-lab'));
    const costs = await page.evaluate(() => {
      const api = window.strongholdDev;
      const balance = () => {
        const w = api.state();
        return (
          w.allowance +
          w.furnishings.filter((f) => f.service === 'storage').reduce((sum, f) => sum + f.stored, 0)
        );
      };
      const before = balance();
      api.command({ kind: 'build', room: 'treasure', points: [{ x: 8, z: 8 }] });
      const built = balance();
      api.command({ kind: 'reclaim', points: [{ x: 8, z: 8 }] });
      return [before, built, balance()];
    });
    assert.deepEqual(costs, [50000, 49988, 49994]);
    await page.evaluate(() => window.strongholdDev.command({ kind: 'free-build', enabled: true }));
    await page.getByRole('button', { name: 'Rooms', exact: true }).click();
    await page.getByRole('button', { name: 'Return to stronghold', exact: true }).click();
    assert.equal(await page.evaluate(() => window.strongholdDev.state().freeRoomBuilding), true);
    await page.evaluate(() => {
      window.strongholdDev.command({ kind: 'free-build', enabled: false });
      window.strongholdDev.load('room-lab');
    });
    await page.getByRole('button', { name: 'Step 0.05 seconds', exact: true }).click();
    await page.waitForFunction(() => !window.strongholdDev.status().busy);
    assert.equal(await page.evaluate(() => window.strongholdDev.status().elapsed), 0.05);
    await page.evaluate(() => window.strongholdDev.load('locked-door-hauling'));
    await page.evaluate(() => window.strongholdDev.advance(2));
    const minerId = await page.evaluate(
      () => window.strongholdDev.state().agents.find((a) => a.type === 'miner').id,
    );
    await page.getByLabel('Diagnostic resident').selectOption(String(minerId));
    await page.getByRole('button', { name: 'Inspect resident diagnostics', exact: true }).click();
    assert((await page.locator('.diagnostic-output').textContent()).includes('No route to work square'));
    mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/development-tools.png' });
    await page.evaluate(() => window.strongholdDev.load('showcase'));
    await page.getByRole('button', { name: 'Spells', exact: true }).click();
    assert((await page.locator('.spell-card').count()) > 0);
    await page.evaluate(() => window.strongholdDev.advance(2));
    mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/development-showcase.png' });
    assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors), []);
    console.log(
      'PASS: scenario URL, paused clock, fixed stepping, real construction/refunds, diagnostics, and extracted spell/furnishing views.',
    );
  }
  assert.deepEqual(errors, [], 'Browser console and runtime errors');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
