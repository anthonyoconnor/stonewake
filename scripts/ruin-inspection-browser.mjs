import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const source = performance.getEntriesByType('resource').find(e => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name));
    const { GameScene } = await import(source.name), render = GameScene.prototype.render;
    GameScene.prototype.render = function () { window.ruinInspectionView = this; return render.call(this); };
  });
  await page.waitForFunction(() => window.ruinInspectionView && window.strongholdDev);
  const fixture = await page.evaluate(async () => {
    const { initializeRuins } = await import('/src/game/ruins.ts'), view = window.ruinInspectionView, w = view.world;
    const tiles = w.tiles.filter(t => t.known && t.terrain === 'floor' && !t.core && !t.onward && !t.room &&
      w.agents.every(a => Math.hypot(a.x - t.x, a.z - t.z) > 0.9)).slice(0, 2);
    if (tiles.length !== 2) throw Error('Expected two discovered, clear fixture squares');
    const known = w.tiles.map(t => t.known);
    for (const tile of tiles) tile.claimed = false;
    initializeRuins(w, [{ id: 'inspection-fixture', name: 'Discovered inspection remnants', rooms: [
      { type: 'dormitory', cells: [tiles[0]] }, { type: 'library', cells: [tiles[1]] },
    ] }]);
    w.revision++;
    return { points: tiles.map(({ x, z }) => ({ x, z })), known };
  });
  const clickTile = async point => {
    const screen = await page.evaluate(async ({ x, z }) => {
      const source = await (await fetch('/src/view/scene.ts')).text();
      const url = source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1];
      const { Vector3, Matrix } = await import(url), view = window.ruinInspectionView;
      view.camera.target.set(x, 0, z); view.camera.radius = 12; view.camera.beta = 0.3;
      view.render();
      const p = Vector3.Project(new Vector3(x, 0.03, z), Matrix.Identity(), view.scene.getTransformMatrix(),
        view.camera.viewport.toGlobal(view.engine.getRenderWidth(), view.engine.getRenderHeight()));
      const rect = view.canvas.getBoundingClientRect();
      return { x: rect.x + p.x * rect.width / view.engine.getRenderWidth(), y: rect.y + p.y * rect.height / view.engine.getRenderHeight() };
    }, point);
    await page.mouse.click(screen.x, screen.y);
  };
  for (const panel of ['Spells', 'Workforce', 'Defenses']) {
    await page.getByRole('button', { name: panel, exact: true }).click();
    await page.keyboard.press('Escape');
    await clickTile(fixture.points[0]);
    await page.waitForFunction(() => document.querySelector('[data-category="rooms"]')?.getAttribute('aria-pressed') === 'true');
    assert.match(await page.locator('#room-summary').innerText(), /Dormitory ruin; workers reclaim/);
  }
  await page.getByRole('button', { name: 'Spells', exact: true }).click();
  await clickTile(fixture.points[1]);
  await page.waitForFunction(() => document.querySelector('#room-summary')?.textContent.includes('Library remnant'));
  assert.match(await page.locator('#room-summary').innerText(), /plans are not available/);
  const state = await page.evaluate(() => window.strongholdDev.state());
  assert.deepEqual(state.tiles.map(t => t.known), fixture.known, 'Inspection does not discover terrain');
  assert(!state.roomServices.some(s => s.room === 'dormitory' || s.room === 'library'), 'Inspecting neutral remnants grants no capacity');
  assert.deepEqual(errors, []);
  mkdirSync('test-results/ruins', { recursive: true });
  await page.screenshot({ path: 'test-results/ruins/inspection-locked.png' });
  console.log('PASS: canvas inspection opens Rooms from Spells, Workforce and Defenses; locked remnants explain missing plans without granting discovery or services.');
} finally { await browser.close(); }
