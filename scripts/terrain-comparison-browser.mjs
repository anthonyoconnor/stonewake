import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const output = 'test-results/terrain-comparison';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1080 } });
  // The comparison captures one loaded source snapshot, without Vite hot-reload interruptions.
  await page.routeWebSocket(/.*/, () => {});
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const entry = performance
      .getEntriesByType('resource')
      .find((e) => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name));
    const { GameScene } = await import(entry.name);
    const render = GameScene.prototype.render;
    GameScene.prototype.render = function () {
      window.terrainView = this;
      return render.call(this);
    };
  });
  await page.waitForFunction(() => window.terrainView);
  const retained = await page.evaluate(() => window.strongholdDev.state());
  await page.getByRole('button', { name: 'Debug', exact: true }).click();
  await page.getByRole('button', { name: 'Test harnesses', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Development scenario', exact: true })
    .selectOption('terrain-comparison');
  await page.getByRole('button', { name: 'Load scenario paused', exact: true }).click();
  await page.locator('#terrain-comparison-view').waitFor();
  await page.evaluate(() => window.terrainView.ready());
  const rendering = await page.evaluate(() => {
    const v = window.terrainView;
    const left = v.tileNodes.get('2,3').node.getChildMeshes(),
      right = v.tileNodes.get('20,3').node.getChildMeshes();
    const geological = right.find((m) => m.name === 'tile-20-3');
    const normals = geological?.getVerticesData('normal') ?? [];
    return {
      sharedMaterials: left.some((a) => right.some((b) => a.material && a.material === b.material)),
      originalMaterials: left.map((m) => m.material?.name),
      refinedMaterials: right.map((m) => ({
        name: m.material?.name,
        color: m.material?.diffuseTexture?.name,
        normal: m.material?.bumpTexture?.name,
      })),
      topNormals: normals.slice(0, 12),
      pointer: v.labLighting.pointerActive,
      sources: v.labLighting.activeSources,
      baselineCount: v.scene.materials.filter((m) => m.name.startsWith('starting terrain ')).length,
    };
  });
  assert.equal(rendering.sharedMaterials, false);
  assert.equal(rendering.pointer, false);
  assert.equal(rendering.sources, 0);
  assert(rendering.baselineCount > 0);
  assert(rendering.originalMaterials.every((name) => name.startsWith('starting terrain ')));
  assert(rendering.refinedMaterials.some((m) => m.normal?.includes('relief normals')));
  assert.equal(rendering.topNormals.length, 12);
  assert(
    rendering.topNormals.every((n, i) => (i % 3 === 1 ? n > 0.99 : Math.abs(n) < 0.01)),
    'Geological top normals face up',
  );
  const world = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(world.tiles.filter((t) => t.room).length, 108);
  assert.equal(world.tiles.filter((t) => t.bridge).length, 12);
  assert(world.furnishings.length > 12);
  for (const tile of world.tiles.filter((t) => t.x >= 2 && t.x <= 15 && t.z >= 3 && t.z <= 22)) {
    const mirror = world.tiles[tile.z * world.width + tile.x + 18];
    assert.deepEqual(
      [tile.terrain, tile.room, tile.claimed, tile.bridge],
      [mirror.terrain, mirror.room, mirror.claimed, mirror.bridge],
    );
  }
  for (const biome of ['upper', 'fungal', 'ancient', 'crystal', 'volcanic']) {
    await page.locator('#terrain-comparison-biome').selectOption(biome);
    await page.waitForFunction((b) => window.strongholdDev.state().biome === b, biome);
    await page.evaluate(() => window.terrainView.ready());
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.screenshot({ path: `${output}/${biome}-overview.png` });
  }
  for (const id of ['terrain', 'rooms', 'hazards']) {
    await page.locator('#terrain-comparison-view').selectOption(id);
    await page.screenshot({ path: `${output}/${id}.png` });
    for (const side of ['starting', 'refined']) {
      await page.locator(`#terrain-comparison-${side}`).click();
      await page.screenshot({ path: `${output}/${id}-${side}.png` });
    }
  }
  await page.evaluate(() => {
    const v = window.terrainView;
    v.camera.target.set(20.5, 0.65, 4);
    v.camera.alpha = -Math.PI / 4;
    v.camera.beta = 1.0;
    v.camera.radius = 7.2;
  });
  await page.screenshot({ path: `${output}/geology-close-refined.png` });
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.state().tiles), world.tiles);
  await page.setViewportSize({ width: 820, height: 650 });
  await page.locator('#terrain-comparison-in').click();
  await page.locator('#terrain-comparison-out').click();
  await page.screenshot({ path: `${output}/compact-controls.png` });
  await page.locator('#return-stronghold').click();
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  assert.equal(
    await page.evaluate(
      () => window.terrainView.scene.materials.filter((m) => m.name.startsWith('starting terrain ')).length,
    ),
    0,
  );
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.state()), retained);
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors), []);
  writeFileSync(
    `${output}/report.json`,
    JSON.stringify(
      { roomTiles: 108, decks: 12, furniture: world.furnishings.length, rendering, errors },
      null,
      2,
    ),
  );
  console.log(
    'Terrain comparison: mirrored actual rooms and bridges, five regions, view/zoom controls, unchanged gameplay tiles, return and browser errors passed.',
  );
} finally {
  await browser.close();
}
