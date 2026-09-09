import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const output = process.env.GRAPHICS_CAPTURE_DIR ?? 'test-results/graphics-gallery';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1080 } });
  // Keep the loaded art snapshot stable while other agents continue editing Vite sources.
  await page.routeWebSocket(/.*/, () => {});
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.setDefaultTimeout(60000);
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  const retained = await page.evaluate(() => window.strongholdDev.state());
  await page.evaluate(async () => {
    const { GraphicsGallery } = await import(
      performance
        .getEntriesByType('resource')
        .find((e) => /\/src\/view\/graphics-gallery(\.ts)?(\?|$)/.test(e.name)).name
    );
    const update = GraphicsGallery.prototype.update;
    GraphicsGallery.prototype.update = function () {
      window.gallery = this;
      return update.call(this);
    };
  });
  await page.getByRole('button', { name: 'Debug', exact: true }).click();
  await page.getByRole('button', { name: 'Test harnesses', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Development scenario', exact: true })
    .selectOption('graphics-gallery');
  await page.getByRole('button', { name: 'Load scenario paused', exact: true }).click();
  await page.waitForFunction(() => window.gallery?.pairs.length === 16);
  await page.evaluate(() => window.gallery.view.ready());
  assert.equal(await page.locator('#gallery-character option').count(), 16);
  assert.equal(await page.evaluate(() => window.strongholdDev.state().agents.length), 0);
  assert.equal(await page.evaluate(() => window.strongholdDev.state().enemies?.length ?? 0), 0);
  const initial = await page.evaluate(() => ({
    pairs: window.gallery.pairs.map((p) => ({
      id: p.id,
      before: p.before.getChildMeshes().length,
      after: p.after.getChildMeshes().length,
    })),
    lights: window.gallery.view.scene.lights.map((l) => l.name),
    baselineMaterials: window.gallery.view.scene.materials.filter((m) => m.name.startsWith('baseline '))
      .length,
    materials: window.gallery.view.scene.materials.length,
  }));
  assert(initial.pairs.every((p) => p.before > 0 && p.after > 0));
  assert(initial.baselineMaterials > 0);
  assert.equal(initial.lights.filter((n) => n === 'gallery cool fill').length, 1);
  await page.locator('#gallery-overview').click();
  await page.screenshot({ path: `${output}/all-sixteen-pairs.png` });
  const ids = await page
    .locator('#gallery-character option')
    .evaluateAll((options) => options.map((o) => o.value));
  const selected = process.argv.slice(2).length ? process.argv.slice(2) : ids;
  const measurements = [];
  for (const id of selected) {
    assert(ids.includes(id), `Unknown character ${id}`);
    await page.locator('#gallery-character').selectOption(id);
    await page.locator('#gallery-front').click();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.screenshot({ path: `${output}/${id}-front.png` });
    const front = await page.evaluate(() => {
      const g = window.gallery,
        pair = g.pairs.find((p) => p.id === g.selected);
      return {
        id: g.selected,
        camera: {
          target: g.view.camera.target.asArray(),
          radius: g.view.camera.radius,
          beta: g.view.camera.beta,
        },
        meshes: { before: pair.before.getChildMeshes().length, after: pair.after.getChildMeshes().length },
        vertices: {
          before: pair.before.getChildMeshes().reduce((n, m) => n + m.getTotalVertices(), 0),
          after: pair.after.getChildMeshes().reduce((n, m) => n + m.getTotalVertices(), 0),
        },
        isolated: g.pairs.filter((p) => p.root.isEnabled()).map((p) => p.id),
        pointer: g.view.labLighting.pointerActive,
        sourceCount: g.view.labLighting.activeSources,
        sharedMaterials: pair.before
          .getChildMeshes()
          .some((a) => pair.after.getChildMeshes().some((b) => a.material && a.material === b.material)),
      };
    });
    assert.deepEqual(front.isolated, [id]);
    assert.equal(front.pointer, false);
    assert.equal(front.sourceCount, 0);
    assert.equal(front.sharedMaterials, false, 'Original and revised materials must be independent');
    await page.locator('#gallery-back').click();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.screenshot({ path: `${output}/${id}-back.png` });
    assert(
      await page.evaluate(() =>
        window.gallery.pairs.every((p) => p.before.rotation.y === Math.PI && p.after.rotation.y === Math.PI),
      ),
    );
    await page.locator('#gallery-front').click();
    await page.locator('#gallery-quarter').click();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.screenshot({ path: `${output}/${id}-three-quarter.png` });
    measurements.push(front);
  }
  for (const id of ['engineer', 'runesmith'].filter((id) => selected.includes(id))) {
    await page.locator('#gallery-character').selectOption(id);
    await page.locator('#gallery-front').click();
    await page.evaluate(() => {
      const g = window.gallery,
        pair = g.pairs.find((p) => p.id === g.selected);
      pair.after.computeWorldMatrix(true);
      const position = pair.after.getAbsolutePosition();
      g.view.camera.target.set(position.x, 0.7, position.z);
      g.view.camera.radius = 2.25;
      g.view.camera.beta = 1.16;
    });
    await page.screenshot({ path: `${output}/${id}-after-close-front.png` });
    await page.locator('#gallery-quarter').click();
    await page.screenshot({ path: `${output}/${id}-after-close-three-quarter.png` });
  }
  await page.locator('#gallery-character').selectOption(selected.at(-1));
  const radius = await page.evaluate(() => window.gallery.view.camera.radius);
  await page.locator('#gallery-in').click();
  assert.equal(await page.evaluate(() => window.gallery.view.camera.radius), Math.max(2.8, radius * 0.8));
  await page.locator('#gallery-focus').click();
  await page.locator('#gallery-next').click();
  const advanced = await page.locator('#gallery-character').inputValue();
  await page.locator('#gallery-previous').click();
  assert.notEqual(await page.locator('#gallery-character').inputValue(), advanced);
  await page.setViewportSize({ width: 820, height: 650 });
  await page.locator('#gallery-quarter').click();
  await page.screenshot({ path: `${output}/compact-controls.png` });
  await page.locator('#return-stronghold').click();
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.state()), retained);
  const returned = await page.evaluate(() => ({
    pairs: window.gallery.pairs.length,
    roots: window.gallery.view.scene.transformNodes.filter((n) => n.name.startsWith('gallery ')).length,
    baselineMaterials: window.gallery.view.scene.materials.filter((m) => m.name.startsWith('baseline '))
      .length,
    fill: window.gallery.view.scene.lights.filter((l) => l.name === 'gallery cool fill').length,
  }));
  assert.deepEqual(returned, { pairs: 0, roots: 0, baselineMaterials: 0, fill: 0 });
  await page.evaluate(() => window.strongholdDev.load('graphics-gallery'));
  await page.waitForFunction(() => window.gallery.pairs.length === 16);
  assert.equal(
    await page.evaluate(
      () => window.gallery.view.scene.lights.filter((l) => l.name === 'gallery cool fill').length,
    ),
    1,
  );
  assert.equal(
    await page.evaluate(
      () => window.gallery.view.scene.materials.filter((m) => m.name.startsWith('baseline ')).length,
    ),
    initial.baselineMaterials,
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors), []);
  writeFileSync(
    `${output}/report.json`,
    JSON.stringify({ initial, measurements, returned, errors }, null, 2),
  );
  console.log(
    `Character gallery: all 16 pairs, archived materials, matched front/back frames, controls, return and reset passed; ${selected.length} pairs captured.`,
  );
} finally {
  await browser.close();
}
