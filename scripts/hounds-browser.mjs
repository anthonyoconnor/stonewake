import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
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
    await api.advance(46);
    const arrival = api.state();
    let explored = false,
      watched = false;
    for (let i = 0; i < 60; i++) {
      await api.advance(1);
      const a = api.state().agents[0];
      explored ||= a.job?.kind === 'scout' && a.job.furnishing !== 'home-watch';
      watched ||= a.activity === 'Watching the Hearth';
    }
    return { arrival, explored, watched, state: api.state() };
  });
  assert.equal(result.arrival.agents[0].type, 'cave-hound');
  assert.equal(result.state.agents.length, 1);
  assert(result.explored && result.watched);
  assert(result.state.tiles.filter((t) => t.known).length > initial.tiles.filter((t) => t.known).length);
  assert.equal(result.state.spent, initial.spent);
  assert.equal(result.state.roomServices.filter((s) => s.service === 'dining').length, 0);
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
    await api.advance(80);
  });
  const expanded = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(expanded.roomServices.filter((s) => s.service === 'rest').length, 8);
  assert.equal(expanded.agents.length, 2);
  assert(expanded.agents.every((a) => a.pay.due.length === 0 && a.pay.collections === 0 && a.level === 1));
  await page.getByRole('button', { name: 'Workforce', exact: true }).click();
  await page.locator('[data-dwarf-role="cave-hound"]').click();
  assert.match(await page.locator('#residents-list').textContent(), /Dormitory den supplies food and rest/);
  assert.match(await page.locator('#arrival-status').textContent(), /limit 2\/2/);
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
  assert.deepEqual(errors, []);
  console.log(
    'PASS: paid Dormitory-only arrival, bounded population before/after expansion, scouting and home watch, no wages/training, correct sidebar and four-legged model, no runtime errors.',
  );
} finally {
  await browser.close();
}
