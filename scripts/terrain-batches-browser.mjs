import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, platform, release } from 'node:os';
import { chromium } from 'playwright';

// Exact rendering/picking comparison; optional matched, live ABBA performance windows.
const fixturePath = process.argv.find((a) => a.startsWith('--profile-world='))?.slice(16);
const fixtureText = fixturePath ? readFileSync(fixturePath, 'utf8') : undefined;
const fixture = fixtureText
  ? JSON.parse(fixtureText, (_key, v) => (v?.__reviewNumber ? Number(v.__reviewNumber) : v))
  : undefined;
const folder = process.env.VISUAL_FOLDER ?? 'test-results/terrain-batches';
mkdirSync(folder, { recursive: true });
const report = {
  machine: { cpu: cpus()[0]?.model, platform: platform(), release: release() },
  fixture: fixturePath,
  sha256: fixtureText && createHash('sha256').update(fixtureText).digest('hex'),
  checks: [],
  profiles: [],
  errors: [],
};
const flush = () => writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2));
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  report.machine.browser = browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(90000);
  page.on('pageerror', (e) => {
    report.errors.push(e.message);
    console.error(e.message);
  });
  await page.routeWebSocket(/.*/, () => {});
  if (fixture)
    await page.route('**/src/view/tile-picking.ts*', async (route) => {
      const response = await route.fetch(),
        body = await response.text();
      assert(body.includes('const ray = scene.createPickingRay'), 'Known accelerated picking entry point');
      // Restore the exact pre-optimization path in control windows, without
      // adding a gameplay flag or patching Babylon's implementation.
      const original =
        '  if (window.batchOriginalPicking) return scene.pick(x, y, mesh => !!mesh.metadata?.tile);\n';
      await route.fulfill({
        response,
        body: body.replace(
          'const ray = scene.createPickingRay',
          original + 'const ray = scene.createPickingRay',
        ),
      });
    });
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=lighting&paused=1`);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const resource = performance
      .getEntriesByType('resource')
      .find((e) => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name));
    const { GameScene } = await import(resource.name),
      original = GameScene.prototype.render;
    GameScene.prototype.render = function () {
      window.batchView = this;
      return original.call(this);
    };
    const source = await (await fetch('/src/view/scene.ts')).text();
    window.batchBabylon = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    const { pickTile } = await import('/src/view/tile-picking.ts');
    window.compareBatches = async (label) => {
      const v = window.batchView,
        b = v.terrainBatches;
      const draw = async (enabled) => {
        b.enabled = enabled;
        v.render();
        await v.ready();
        v.render();
        const previousDraws = v.engine._drawCalls.current;
        v.render();
        const pixels = await v.engine.readPixels(0, 0, v.engine.getRenderWidth(), v.engine.getRenderHeight());
        const bounds = v.canvas.getBoundingClientRect(),
          picks = [];
        for (const x of [0.1, 0.25, 0.5, 0.75, 0.9])
          for (const y of [0.2, 0.4, 0.6, 0.8]) {
            const hit = v.scene.pick(bounds.width * x, bounds.height * y, (m) => !!m.metadata?.tile);
            const quick = pickTile(v.scene, bounds.width * x, bounds.height * y);
            if (
              hit?.pickedMesh !== quick?.pickedMesh ||
              (hit?.pickedPoint &&
                (!quick?.pickedPoint || hit.pickedPoint.subtract(quick.pickedPoint).length() > 1e-4))
            )
              throw Error(`${label}: accelerated picking changed the nearest tile or surface ${JSON.stringify({x,y,old:hit?.pickedMesh?.name,next:quick?.pickedMesh?.name,oldPoint:hit?.pickedPoint?.asArray(),nextPoint:quick?.pickedPoint?.asArray()})}`);
            picks.push({ tile: hit?.pickedMesh?.metadata?.tile, point: hit?.pickedPoint?.asArray() });
          }
        return {
          pixels,
          picks,
          active: v.scene.getActiveMeshes().length,
          draws: v.engine._drawCalls.current - previousDraws,
          image: v.canvas.toDataURL(),
        };
      };
      const before = await draw(false),
        after = await draw(true);
      if (JSON.stringify(before.picks) !== JSON.stringify(after.picks))
        throw Error(`${label}: original tile picks changed`);
      let changed = 0,
        total = 0,
        max = 0;
      for (let i = 0; i < before.pixels.length; i += 4) {
        let difference = 0;
        for (let c = 0; c < 3; c++) {
          const d = Math.abs(before.pixels[i + c] - after.pixels[i + c]);
          total += d;
          difference = Math.max(difference, d);
        }
        if (difference > 8) changed++;
        max = Math.max(max, difference);
      }
      const changedFraction = changed / (before.pixels.length / 4),
        meanChannelError = total / (before.pixels.length * 0.75);
      const batches = [...b.batches.values()];
      for (const batch of batches) {
        if (batch.mesh.isPickable || !batch.mesh.isVisible || batch.mesh.isDisposed())
          throw Error(`${label}: invalid batch lifecycle`);
        if (batch.members.some((m) => m.isDisposed() || m.isVisible))
          throw Error(`${label}: stale or double-drawn terrain`);
        const lights = JSON.stringify(batch.mesh.lightSources.map((l) => l.uniqueId));
        if (batch.members.some((m) => JSON.stringify(m.lightSources.map((l) => l.uniqueId)) !== lights))
          throw Error(`${label}: a batch changed light membership`);
        if (batch.members.some((m) => m.material !== batch.mesh.material))
          throw Error(`${label}: material changed`);
      }
      return {
        label,
        changedFraction,
        meanChannelError,
        maxChannelError: max,
        picks: before.picks.length,
        images: [before.image, after.image],
        batches: batches.length,
        fogBatches: batches.filter((b) => b.mesh.hasThinInstances).length,
        activeBefore: before.active,
        activeAfter: after.active,
        drawsBefore: before.draws,
        drawsAfter: after.draws,
      };
    };
  });
  await page.waitForFunction(() => window.batchView);
  await page.mouse.move(100, 350);
  const compare = async (label) => {
    const check = await page.evaluate((label) => window.compareBatches(label), label);
    for (const [i, image] of check.images.entries())
      writeFileSync(
        `${folder}/${label.replaceAll(' ', '-')}-${i ? 'batched' : 'original'}.png`,
        Buffer.from(image.split(',')[1], 'base64'),
      );
    delete check.images;
    report.checks.push(check);
    flush();
    console.log(JSON.stringify(check));
    // Float32 baked transforms can move a few edge samples; broad lighting/fog differences must fail.
    assert(check.changedFraction < 0.001 && check.meanChannelError < 0.1, `${label}: rendering differs`);
    return check;
  };
  await compare('lighting chamber');
  await page.evaluate(() => {
    const c = window.batchView.camera;
    c.alpha += Math.PI;
    c.radius *= 1.4;
  });
  await compare('reverse and zoom out');
  const bounds = await page.locator('#world').boundingBox();
  await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.55);
  await page.waitForFunction(() => window.batchView.labLighting.pointerActive);
  await compare('pointer illumination');
  await page.evaluate(() => {
    const c = window.batchView.camera;
    c.target.x += 2;
    c.alpha += 0.4;
  });
  await compare('stationary pointer during camera movement');
  await page.mouse.move(100, 350);
  await page.evaluate(() => {
    window.batchView.world.lightingTest.enabled = false;
  });
  const disabled = await compare('lighting disabled');
  assert.equal(disabled.batches, disabled.fogBatches);
  await page.evaluate(() => {
    window.batchView.world.lightingTest.enabled = true;
  });
  await compare('lighting restored');
  await page.evaluate(async (fixture) => {
    const v = window.batchView,
      old = [...v.terrainBatches.batches.values()].map((b) => b.mesh);
    const world = fixture ?? (await import('/src/game/session.ts')).startFreePlay('campaign-royal-deep');
    v.setWorld(world);
    if (old.some((m) => !m.isDisposed())) throw Error('Replacing a world leaked terrain batches');
    window.batchFixture = structuredClone(world);
    v.camera.target.set(fixture ? 14 : world.hearth.x, 0, fixture ? 18 : world.hearth.z);
    v.camera.radius = 27;
    v.camera.alpha = -Math.PI / 4;
    v.camera.beta = 0.62;
  }, fixture);
  const large = await compare(fixture ? 'developed Royal' : 'Royal arrival');
  assert(
    large.fogBatches > 0 && large.activeAfter < large.activeBefore,
    'Large-map fog must reduce active mesh evaluation',
  );
  await page.evaluate(() => {
    const v = window.batchView,
      w = v.world;
    window.batchChangedTiles = w.tiles
      .filter(
        (t) =>
          !t.known &&
          t.terrain !== 'gold' &&
          t.terrain !== 'gem' &&
          Math.hypot(t.x - v.camera.target.x, t.z - v.camera.target.z) < 12,
      )
      .slice(0, 20);
    if (!window.batchChangedTiles.length) throw Error('Discovery fixture needs fog cells');
    for (const tile of window.batchChangedTiles) tile.known = true;
    w.revision++;
  });
  await compare('newly discovered terrain');
  await page.evaluate(() => {
    for (const t of window.batchChangedTiles) t.known = false;
    window.batchView.world.revision++;
  });
  await compare('fog restored');
  await page.locator('#world').screenshot({ path: `${folder}/royal-batched.png` });
  if (!fixture) {
    await page.evaluate(() => {
      const v = window.batchView,
        w = v.world;
      for (const t of w.tiles) t.known = true;
      w.revision++;
      v.camera.target.set(w.width / 2, 0, w.height / 2);
      v.camera.radius = 90;
    });
    await compare('Royal full preview');
    await page.evaluate(async () => {
      const v = window.batchView;
      v.setWorld((await import('/src/content/terrain-comparison.ts')).createTerrainComparison());
      v.camera.target.set(17.5, 0, 13);
      v.camera.radius = 39;
    });
    assert.equal((await compare('permanent terrain comparison')).batches, 0);
  }
  if (fixture) {
    for (const mode of ['stationary', 'pointer-orbit'])
      for (const enabled of [false, true, true, false]) {
        await page.mouse.move(100, 350);
        await page.evaluate(async (enabled) => {
          const v = window.batchView;
          window.strongholdDev.pause(true);
          window.batchOriginalPicking = !enabled;
          v.terrainBatches.enabled = enabled;
          v.setWorld(structuredClone(window.batchFixture));
          v.camera.target.set(14, 0, 18);
          v.camera.radius = 27;
          v.camera.alpha = -Math.PI / 4;
          v.camera.beta = 0.62;
          await v.ready();
          for (let i = 0; i < 90; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
        }, enabled);
        if (mode === 'pointer-orbit')
          await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.55);
        const sample = await page.evaluate(
          async ({ enabled, mode }) => {
            const v = window.batchView,
              s = new window.batchBabylon.SceneInstrumentation(v.scene);
            s.captureActiveMeshesEvaluationTime = true;
            s.captureRenderTime = true;
            s.captureRenderTargetsRenderTime = true;
            const frames = [],
              draws = [],
              start = performance.now(),
              elapsed = v.world.elapsed;
            let last = start;
            const drawObserver = v.scene.onAfterRenderObservable.add(() =>
              draws.push(v.engine._drawCalls.current),
            );
            const observer =
              mode === 'pointer-orbit'
                ? v.scene.onBeforeRenderObservable.add(() => {
                    v.camera.alpha = -Math.PI / 4 + Math.sin((performance.now() - start) * 0.0002) * 0.4;
                  })
                : undefined;
            window.strongholdDev.pause(false);
            while (performance.now() - start < 10000) {
              await new Promise((resolve) => requestAnimationFrame(resolve));
              const now = performance.now();
              frames.push(now - last);
              last = now;
            }
            window.strongholdDev.pause(true);
            if (observer) v.scene.onBeforeRenderObservable.remove(observer);
            const wall = performance.now() - start;
            frames.sort((a, b) => a - b);
            draws.sort((a, b) => a - b);
            const sample = {
              enabled,
              mode,
              frames: frames.length,
              wall,
              meanFrameMs: wall / frames.length,
              p95FrameMs: frames[Math.floor(frames.length * 0.95)],
              fps: (frames.length * 1000) / wall,
              simulationAdvanced: v.world.elapsed - elapsed,
              draws: draws[Math.floor(draws.length / 2)],
              activeEvaluationMs: s.activeMeshesEvaluationTimeCounter.average,
              renderMs: s.renderTimeCounter.average,
              glowMs: s.renderTargetsRenderTimeCounter.average,
              activeMeshes: v.scene.getActiveMeshes().length,
              meshes: v.scene.meshes.length,
              scale: v.engine.getHardwareScalingLevel(),
              renderer: v.engine.getGlInfo().renderer,
            };
            v.scene.onAfterRenderObservable.remove(drawObserver);
            s.dispose();
            return sample;
          },
          { enabled, mode },
        );
        report.profiles.push(sample);
        flush();
        console.log(JSON.stringify(sample));
        assert(
          Math.abs(sample.simulationAdvanced - sample.wall / 1000) < 0.3,
          'Live simulation must keep its normal clock',
        );
      }
  }
  assert.deepEqual(report.errors, []);
  flush();
} finally {
  await browser.close();
}
