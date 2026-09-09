import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.routeWebSocket(/.*/, () => {});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // The authored first area is deliberately gem-free; this regional fixture has both resources.
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=region-crystal&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  const result = await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    const babylon = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    const scene = babylon.EngineStore.LastCreatedScene;
    const before = window.strongholdDev.state();
    const hidden = before.tiles.filter(t => !t.known);
    const resources = hidden.filter(t => t.terrain === 'gold' || t.terrain === 'gem');
    const materials = resources.map(t => ({ type: t.terrain, material: scene.getMeshByName(`tile-${t.x}-${t.z}`).material.name }));
    const fog = hidden.filter(t => t.terrain !== 'gold' && t.terrain !== 'gem');
    const concealed = fog.every(t => scene.getMeshByName(`tile-${t.x}-${t.z}`)?.material.name === 'unknown');
    scene.activeCamera.setTarget(new babylon.Vector3(20, 0, 10));
    scene.activeCamera.alpha += 0.45;
    scene.activeCamera.radius = 22;
    scene.render();
    return { materials, concealed, discoveryUnchanged: JSON.stringify(before.tiles.map(t => t.known)) === JSON.stringify(window.strongholdDev.state().tiles.map(t => t.known)) };
  });
  assert(result.materials.some(m => m.type === 'gold'));
  assert(result.materials.some(m => m.type === 'gem'));
  assert(result.materials.every(m => m.material === m.type));
  assert(result.concealed, 'Non-resource tiles retain their fog geometry');
  assert(result.discoveryUnchanged, 'Camera movement cannot discover terrain');
  mkdirSync('test-results/resources', { recursive: true });
  await page.screenshot({ path: 'test-results/resources/main-view.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: hidden gold/gem meshes, surrounding fog, camera navigation and unchanged discovery.');
} finally {
  await browser.close();
}
