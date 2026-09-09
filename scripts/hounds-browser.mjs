import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
mkdirSync('test-results', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=cave-hounds&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'cave-hounds');
  const initial = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(initial.agents.length, 0);
  assert.equal(initial.roomServices.filter((s) => s.service === 'rest').length, 4);
  const result = await page.evaluate(async () => {
    const api = window.strongholdDev;
    await api.advance(31);
    const arrival = api.state();
    let explored = false,
      patrolled = false;
    for (let i = 0; i < 60; i++) {
      await api.advance(1);
      const a = api.state().agents[0];
      explored ||= a.job?.kind === 'scout';
      patrolled ||= a.activity === 'Patrolling the stronghold';
    }
    return { arrival, explored, patrolled, state: api.state() };
  });
  assert.equal(result.arrival.agents[0].type, 'cave-hound');
  assert(result.state.agents.length >= 2 && result.state.agents.length <= 3);
  assert(result.explored && result.patrolled);
  assert(result.state.tiles.filter((t) => t.known).length > initial.tiles.filter((t) => t.known).length);
  assert.equal(result.state.spent, initial.spent);
  assert.equal(result.state.roomServices.filter((s) => s.service === 'dining').length, 0);
  await page.evaluate(() => window.strongholdDev.advance(35));
  assert.equal((await page.evaluate(() => window.strongholdDev.state())).agents.length, 4);
  const warning = page.locator('#dormitory-alerts');
  await warning.waitFor({ state: 'visible' });
  assert.equal(await warning.getAttribute('open'), '');
  assert.match(await warning.textContent(), /Dormitory is full.*Expand/);
  const icon = await page.locator('[data-message="dormitory-alerts"] .action-icon').boundingBox();
  assert(icon.width <= 24 && icon.height <= 24, 'Message icon stays inside the compact dock');
  await page.screenshot({ path: 'test-results/recruitment-dormitory-full.png' });
  await warning.getByRole('button', { name: 'Dismiss dormitory is full card' }).click();
  await page.evaluate(() => window.strongholdDev.advance(2));
  assert.equal(await warning.getAttribute('open'), null, 'Dismissal persists during the same full episode');
  await page.locator('[data-message="dormitory-alerts"]').click();
  await warning.getByRole('button', { name: 'Build Dormitory', exact: true }).click();
  assert.match(await page.locator('#active-tool').textContent(), /Dormitory/);
  await page.evaluate(async () => {
    const api = window.strongholdDev;
    api.command({
      kind: 'build',
      room: 'dormitory',
      points: [
        { x: 3, z: 13 },
        { x: 4, z: 13 },
        { x: 5, z: 13 },
        { x: 6, z: 13 },
      ],
    });
    await api.advance(1);
  });
  assert.equal(await warning.isVisible(), false, 'Expansion clears the active capacity warning');
  await page.evaluate(() => window.strongholdDev.advance(125));
  const expanded = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(expanded.roomServices.filter((s) => s.service === 'rest').length, 8);
  assert.equal(expanded.agents.length, 8);
  assert.equal(expanded.recruitment.fullEpisode, 2);
  assert.equal(await warning.getAttribute('open'), '', 'Filling again opens a fresh warning');
  await warning.getByRole('button', { name: 'Dismiss dormitory is full card' }).click();
  assert(expanded.agents.every((a) => a.pay.due.length === 0 && a.pay.collections === 0 && a.level === 1));
  await page.getByRole('button', { name: 'Workforce', exact: true }).click();
  await page.locator('[data-dwarf-role="cave-hound"]').click();
  assert.match(await page.locator('#residents-list').textContent(), /Dormitory den supplies food and rest/);
  assert.match(await page.locator('#arrival-status').textContent(), /Dormitory is full/);
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/cave-hounds-workforce.png' });
  const render = await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    const { EngineStore } = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    const scene = EngineStore.LastCreatedScene,
      a = window.strongholdDev.state().agents[0],
      root = scene.getTransformNodeByName(`hound-${a.id}`);
    scene.activeCamera.target.set(a.x, 0.3, a.z);
    scene.activeCamera.radius = 2.4;
    scene.activeCamera.alpha = Math.PI * 0.32;
    scene.activeCamera.beta = 1.05;
    scene.render();
    return {
      legs: root.getDescendants().filter((n) => n.name === 'hound leg').length,
      image: document.querySelector('#world').toDataURL('image/png').split(',')[1],
    };
  });
  assert.equal(render.legs, 4);
  writeFileSync('test-results/cave-hound-closeup.png', Buffer.from(render.image, 'base64'));
  // Unlock Warriors while full, then expand with ordinary paid construction.
  await page.evaluate(async () => {
    const api = window.strongholdDev;
    api.command({ kind: 'build', room: 'kitchen', points: [8, 9, 10].map((x) => ({ x, z: 13 })) });
    api.command({ kind: 'build', room: 'training', points: [8, 9, 10].map((x) => ({ x, z: 14 })) });
    await api.advance(50);
  });
  assert.equal(
    (await page.evaluate(() => window.strongholdDev.state())).agents.length,
    8,
    'Full beds hold back the newly supported role',
  );
  await page.evaluate(async () => {
    const api = window.strongholdDev;
    api.command({ kind: 'build', room: 'dormitory', points: [3, 4, 5].map((x) => ({ x, z: 15 })) });
    await api.advance(100);
  });
  const progressed = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(progressed.agents.filter((a) => a.type === 'cave-hound').length, 8);
  assert.equal(
    progressed.agents.filter((a) => a.type === 'warrior').length,
    3,
    'New beds go to supported Warriors',
  );
  assert(progressed.recruitment.dormitoryFull);
  await warning.getByRole('button', { name: 'Dismiss dormitory is full card' }).click();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  assert.match(await page.locator('#message-history').textContent(), /Dormitory is full/);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: regular paid Dormitory-only arrivals, full warning/dismissal/build action/clear/reopen/history, later Warrior priority after paid expansion, continuous patrol, no hound wages/training, compact icon and four-legged model, no runtime errors.',
  );
} finally {
  await browser.close();
}
