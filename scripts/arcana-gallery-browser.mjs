import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const output = process.env.ARCANA_CAPTURE_DIR ?? 'test-results/arcana-gallery';
const requested = process.argv.slice(2);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1080 } });
  await page.routeWebSocket(/.*/, () => {});
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.setDefaultTimeout(60000);
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.waitForFunction(
    () =>
      !document.querySelector('#loading-screen')?.open ||
      document.querySelector('#loading-screen')?.dataset.phase === 'error',
  );
  assert.equal(
    await page.locator('#loading-screen').getAttribute('data-phase'),
    'loading',
    await page.locator('#loading-screen').innerText(),
  );
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  const retained = await page.evaluate(() => window.strongholdDev.state());
  await page.evaluate(async () => {
    for (const [file, name, key] of [
      ['arcana-gallery', 'ArcanaGallery', 'arcana'],
      ['spells', 'SpellView', 'magic'],
      ['defenses', 'DefenseView', 'defenseView'],
      ['hearth', 'HearthView', 'hearthView'],
    ]) {
      const url = performance
        .getEntriesByType('resource')
        .find((e) => new RegExp(`/src/view/${file}(\\.ts)?(\\?|$)`).test(e.name)).name;
      const klass = (await import(url))[name],
        update = klass.prototype.update;
      klass.prototype.update = function (...args) {
        window[key] = this;
        return update.apply(this, args);
      };
    }
  });
  await page.getByRole('button', { name: 'Debug', exact: true }).click();
  await page.getByRole('button', { name: 'Test harnesses', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Development scenario', exact: true })
    .selectOption('arcana-gallery');
  await page.getByRole('button', { name: 'Load scenario paused', exact: true }).click();
  await page.waitForFunction(() => window.arcana?.pairs.length === 13);
  await page.evaluate(() => window.arcana.view.ready());
  assert.equal(await page.locator('#arcana-item option').count(), 13);
  const worldBefore = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(worldBefore.agents.length, 0);
  assert.equal(worldBefore.enemies?.length ?? 0, 0);
  const ids = await page.locator('#arcana-item option').evaluateAll((a) => a.map((o) => o.value));
  for (const id of requested) assert(ids.includes(id), `Unknown exhibit ${id}`);
  const measurements = [];
  const paint = () =>
    page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  for (const id of requested.length ? requested : ids) {
    await page.locator('#arcana-item').selectOption(id);
    await page.locator('#arcana-concept summary').click();
    await page.locator('#arcana-concept-image').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const image = document.querySelector('#arcana-concept-image');
      return image.complete && image.naturalWidth > 0;
    });
    await page.locator('#arcana-concept summary').click();
    await page.locator('#arcana-item').scrollIntoViewIfNeeded();
    await page
      .locator('#arcana-state')
      .selectOption(id === 'stone-hearth' ? 'ready' : id === 'onward-hearth' ? 'finished' : 'active');
    await paint();
    await page.screenshot({ path: `${output}/${id}-front.png` });
    const stats = await page.evaluate(() => {
      const g = window.arcana,
        p = g.pairs.find((p) => p.id === g.selected);
      const a = p.before.getChildMeshes(),
        b = p.after.getChildMeshes();
      return {
        id: g.selected,
        before: a.length,
        after: b.length,
        sharedMaterials: a.some((m) => m.material && b.some((n) => n.material === m.material)),
        active: g.pairs.filter((p) => p.root.isEnabled()).map((p) => p.id),
        pointer: g.view.labLighting.pointerActive,
        sources: g.view.labLighting.activeSources,
        invalid: b.some((m) => !m.getWorldMatrix().asArray().every(Number.isFinite)),
      };
    });
    assert(stats.before > 0 && stats.after > 0);
    assert.equal(stats.sharedMaterials, false);
    assert.equal(stats.invalid, false);
    assert.equal(stats.pointer, false);
    assert.equal(stats.sources, 0);
    assert.deepEqual(stats.active, [id]);
    measurements.push(stats);
    await page.locator('#arcana-turn').click();
    await paint();
    await page.screenshot({ path: `${output}/${id}-three-quarter.png` });
    await page.locator('#arcana-back').click();
    await paint();
    await page.screenshot({ path: `${output}/${id}-back.png` });
    await page.locator('#arcana-after').click();
    await page.locator('#arcana-turn').click();
    if (['spike-trap', 'bolt-trap', 'onward-hearth'].includes(id))
      await page.evaluate(() => {
        window.arcana.view.camera.radius = 2.1;
      });
    await paint();
    await page.screenshot({ path: `${output}/${id}-refined-close.png` });
    await page.locator('#arcana-focus').click();
    for (const state of ['ready', 'active', 'finished']) {
      await page.locator('#arcana-state').selectOption(state);
      await page.locator('#arcana-step').click();
      await paint();
      await page.screenshot({ path: `${output}/${id}-${state}.png` });
    }
  }
  await page.locator('#arcana-item').selectOption('bolt-trap');
  await page.locator('#arcana-state').selectOption('active');
  await page.locator('#arcana-restart').click();
  await page.locator('#arcana-play').click();
  await page.waitForFunction(() => window.arcana.time > 0.2);
  await page.locator('#arcana-play').click();
  const paused = await page.evaluate(() => window.arcana.time);
  await page.waitForTimeout(120);
  assert.equal(await page.evaluate(() => window.arcana.time), paused);
  await page.locator('#arcana-step').click();
  assert(Math.abs((await page.evaluate(() => window.arcana.time)) - paused - 1 / 30) < 1e-6);
  await page.locator('#arcana-speed').selectOption('0.25');
  assert.equal(await page.evaluate(() => window.arcana.speed), 0.25);
  await page.locator('#arcana-after').click();
  const close = await page.evaluate(() => window.arcana.view.camera.radius);
  await page.locator('#arcana-in').click();
  assert((await page.evaluate(() => window.arcana.view.camera.radius)) < close);
  await page.locator('#arcana-focus').click();
  await page.locator('#arcana-all').click();
  await paint();
  await page.screenshot({ path: `${output}/all-thirteen-pairs.png` });
  assert.deepEqual(
    await page.evaluate(() => window.strongholdDev.state()),
    worldBefore,
    'Exhibits never mutate gameplay',
  );
  await page.evaluate(async () => {
    const url = performance
      .getEntriesByType('resource')
      .find((e) => /\/src\/content\/presentation(\.ts)?(\?|$)/.test(e.name)).name;
    const presentation = await import(url);
    presentation.presentation.motion = 'reduce';
  });
  await paint();
  await page.locator('#arcana-item').selectOption('thunder-rune');
  await page.locator('#arcana-state').selectOption('active');
  await paint();
  await page.screenshot({ path: `${output}/thunder-rune-reduced.png` });
  await page.evaluate(async () => {
    const url = performance
      .getEntriesByType('resource')
      .find((e) => /\/src\/content\/presentation(\.ts)?(\?|$)/.test(e.name)).name;
    const presentation = await import(url);
    presentation.presentation.motion = 'full';
  });
  await page.locator('#return-stronghold').click();
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.state()), retained);
  assert.equal(await page.evaluate(() => window.arcana.pairs.length), 0);
  assert.equal(
    await page.evaluate(
      () => window.arcana.view.scene.materials.filter((m) => m.name.startsWith('arcana baseline ')).length,
    ),
    0,
  );
  await page.evaluate(() => window.strongholdDev.load('arcana-gallery'));
  await page.waitForFunction(() => window.arcana.pairs.length === 13);
  await page.evaluate(() => window.arcana.view.ready());
  await page.locator('#arcana-item').selectOption('stone-hearth');
  await page.locator('#arcana-state').selectOption('ready');
  await paint();
  await page.screenshot({ path: `${output}/reopened-hearth.png` });
  // Real casting uses the current factories and cleans short-lived nodes by simulation time.
  await page.evaluate(() => window.strongholdDev.load('spells'));
  const cast = await page.evaluate(() => {
    const d = window.strongholdDev,
      w = d.state(),
      a = w.agents.find((a) => a.type === 'warrior');
    return [
      d.command({ kind: 'cast', spell: 'summon-stonehand' }),
      d.command({ kind: 'cast', spell: 'dwarf-haste', target: { kind: 'dwarf', id: a.id } }),
      d.command({ kind: 'cast', spell: 'stoneguard', target: { kind: 'dwarf', id: a.id } }),
    ];
  });
  assert(
    cast.every((m) => /cast|assembled/.test(m)),
    cast.join('; '),
  );
  await page.evaluate(() => window.strongholdDev.advance(0.25));
  await paint();
  await page.screenshot({ path: `${output}/actual-spell-casts.png` });
  assert((await page.evaluate(() => window.magic.nodes.size)) > 0);
  await page.evaluate(() => window.strongholdDev.advance(0.6));
  assert.equal(await page.evaluate(() => window.strongholdDev.state().spellBursts.length), 0);
  await page.evaluate(() => window.strongholdDev.load('defenses'));
  assert.equal(await page.evaluate(() => window.magic.nodes.size), 0);
  assert.equal(await page.evaluate(() => window.defenseView.fixtures.size), 3);
  await page.evaluate(() => {
    window.arcana.view.camera.target.set(20.5, 0.3, 12);
    window.arcana.view.camera.radius = 8;
  });
  await paint();
  await page.screenshot({ path: `${output}/actual-trap-yard.png` });
  await page.evaluate(() =>
    window.strongholdDev.command({ kind: 'raider', spawn: { x: 29, z: 12 }, target: { x: 10, z: 12 } }),
  );
  const triggered = new Set();
  for (let i = 0; i < 100 && triggered.size < 2; i++) {
    await page.evaluate(() => window.strongholdDev.advance(0.15));
    const fired = await page.evaluate(() =>
      window.strongholdDev
        .state()
        .defenses.filter((d) => d.type.endsWith('trap') && d.triggeredAt >= 0)
        .map((d) => d.type),
    );
    for (const type of fired)
      if (!triggered.has(type)) {
        triggered.add(type);
        await paint();
        await page.screenshot({ path: `${output}/actual-${type}-triggered.png` });
      }
  }
  assert.equal(triggered.size, 2, 'Both manufactured traps must trigger in the real yard');
  assert.deepEqual(errors, []);
  writeFileSync(
    `${output}/report.json`,
    JSON.stringify(
      {
        measurements,
        casts: cast,
        errors,
        checks: [
          '13 paired models',
          'front/back/three-quarter',
          'three states each',
          'isolated materials',
          'play/pause/step/speed/zoom',
          'static world',
          'reduced motion',
          'return/reopen',
          'real spell cast and cleanup',
          'real trap trigger cycles',
          'selected concept image loads',
          'actual trap placement',
        ],
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ passed: true, exhibits: measurements.length, output, errors }));
} finally {
  await browser.close();
}
