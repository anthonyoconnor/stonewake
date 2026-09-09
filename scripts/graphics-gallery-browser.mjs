import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const output = process.env.GRAPHICS_CAPTURE_DIR ?? 'test-results/graphics-gallery';
const animationOnly = process.argv.includes('--animation-only');
const requested = process.argv.slice(2).filter((arg) => arg !== '--animation-only');
const close = (actual, expected, message) =>
  assert(Math.abs(actual - expected) < 1e-6, `${message}: ${actual} != ${expected}`);
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
    GraphicsGallery.prototype.update = function (...args) {
      window.gallery = this;
      return update.apply(this, args);
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
  assert.deepEqual(
    await page.evaluate(() => ({
      clip: window.gallery.clip,
      playing: window.gallery.playing,
      time: window.gallery.time,
    })),
    { clip: 'idle', playing: false, time: 0 },
    'The gallery opens on a paused idle pose',
  );
  const galleryWorld = await page.evaluate(() => window.strongholdDev.state());
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
    meshes: window.gallery.view.scene.meshes.length,
    transforms: window.gallery.view.scene.transformNodes.length,
  }));
  assert(initial.pairs.every((p) => p.before > 0 && p.after > 0));
  assert(initial.baselineMaterials > 0);
  assert.equal(initial.lights.filter((n) => n === 'gallery cool fill').length, 1);
  await page.locator('#gallery-overview').click();
  if (!animationOnly) await page.screenshot({ path: `${output}/all-sixteen-pairs.png` });
  const ids = await page
    .locator('#gallery-character option')
    .evaluateAll((options) => options.map((o) => o.value));
  const selected = requested.length ? requested : ids;
  for (const id of selected) assert(ids.includes(id), `Unknown character ${id}`);
  const measurements = [];
  for (const id of animationOnly ? [] : selected) {
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
        window.gallery.pairs.every(
          (p) => p.before.parent.rotation.y === Math.PI && p.after.parent.rotation.y === Math.PI,
        ),
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
  for (const id of ['engineer', 'runesmith'].filter((id) => !animationOnly && selected.includes(id))) {
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
  // Read actual rig pivots, independently of the preview adapter's private state.
  await page.evaluate(() => {
    window.galleryPose = () => {
      const g = window.gallery,
        pair = g.pairs.find((p) => p.id === g.selected);
      return [pair.before, pair.after].map((root) =>
        [root, ...root.getDescendants().filter((n) => n.getClassName() === 'TransformNode')].map((n) => ({
          name: n === root ? 'root' : n.name,
          position: n.position.asArray(),
          rotation: n.rotation.asArray(),
          scaling: n.scaling.asArray(),
          enabled: n.isEnabled(),
        })),
      );
    };
    window.galleryCues = (clip) => {
      const legNames = [
        'leg pivot',
        'stonehand hip',
        'hound leg',
        'pillar leg',
        'foreleg',
        'hindleg',
        'spider walking leg',
      ];
      const armNames = ['arm pivot', 'stonehand shoulder', 'striking arm'];
      const names =
        clip === 'walk'
          ? legNames
          : clip === 'work'
            ? [...legNames, ...armNames, 'hound head pivot']
            : [...armNames, 'enemy head', 'hound head pivot', 'hound jaw'];
      return window.galleryPose().map((pose) =>
        pose
          .filter((n) => names.includes(n.name))
          .sort(
            (a, b) =>
              a.name.localeCompare(b.name) ||
              Math.sign(a.position.x) - Math.sign(b.position.x) ||
              Math.sign(a.position.z) - Math.sign(b.position.z),
          )
          .map((n) => ({ name: n.name, rotation: n.rotation })),
      );
    };
  });
  const animations = [];
  const workIds = ['stonehand', 'miner', 'engineer', 'warrior', 'runesmith', 'cave-hound', 'tunnel-burrower'];
  for (const id of selected) {
    await page.locator('#gallery-character').selectOption(id);
    const clips = await page
      .locator('#gallery-animation option')
      .evaluateAll((options) => options.filter((o) => !o.disabled).map((o) => o.value));
    assert(clips.includes('idle') && clips.includes('walk'), `${id} provides idle and walking`);
    assert.equal(clips.includes('attack'), id !== 'stonehand', `${id} attack availability follows its role`);
    assert.equal(clips.includes('work'), workIds.includes(id), `${id} work availability follows its role`);
    for (const clip of [
      'walk',
      ...(id === 'stonehand' ? [] : ['attack']),
      ...(workIds.includes(id) ? ['work'] : []),
    ]) {
      await page.locator('#gallery-animation').selectOption(clip);
      assert.equal(
        await page.evaluate(() => window.gallery.playing),
        true,
        'Selecting a clip starts playback',
      );
      await page.locator('#gallery-play').click();
      assert.equal(await page.evaluate(() => window.gallery.playing), false);
      await page.locator('#gallery-restart').click();
      const trace = await page.evaluate((clip) => {
        const g = window.gallery;
        const sample = () => ({ time: g.time, cues: window.galleryCues(clip) });
        const frames = [sample()];
        // Include windup, impact/recovery and later stride phases without advancing the game.
        for (let frame = 1; frame <= 18; frame++) {
          g.step();
          if ([2, 5, 10, 18].includes(frame)) frames.push(sample());
        }
        return frames;
      }, clip);
      close(trace[0].time, 0, `${id} ${clip} restart`);
      for (const frame of trace) {
        const [before, after] = frame.cues;
        assert(before.length && after.length, `${id} ${clip} exposes driven limbs/head`);
        assert.deepEqual(
          before.map((n) => n.name),
          after.map((n) => n.name),
          `${id} ${clip} corresponding rig pivots`,
        );
        // Archived quadrupeds have a fixed leg splay. Compare the driven X axis
        // directly and animation changes on other axes without erasing that anatomy.
        for (let i = 0; i < before.length; i++)
          for (let axis = 0; axis < 3; axis++)
            close(
              before[i].rotation[axis] - (axis ? trace[0].cues[0][i].rotation[axis] : 0),
              after[i].rotation[axis] - (axis ? trace[0].cues[1][i].rotation[axis] : 0),
              `${id} ${clip} synchronized ${before[i].name} axis ${axis}`,
            );
      }
      for (const side of [0, 1])
        assert(
          trace.some((frame) => JSON.stringify(frame.cues[side]) !== JSON.stringify(trace[0].cues[side])),
          `${id} ${clip} moves actual ${side ? 'revised' : 'original'} limbs/head`,
        );
      const replay = await page.evaluate((clip) => {
        const g = window.gallery;
        g.restart();
        for (let frame = 0; frame < 18; frame++) g.step();
        return { time: g.time, cues: window.galleryCues(clip) };
      }, clip);
      assert.deepEqual(replay, trace.at(-1), `${id} ${clip} restart repeats the same phase`);
      animations.push({
        id,
        clip,
        frames: trace.map((frame) => frame.time),
        pivots: trace[0].cues[0].length,
      });
    }
  }
  console.log(
    `All ${animations.length} supported before/after animation clips passed phase and restart checks.`,
  );
  await page.locator('#gallery-character').selectOption('miner');
  await page.locator('#gallery-animation').selectOption('walk');
  await page.waitForFunction(() => window.gallery.time > 0.08);
  await page.locator('#gallery-play').click();
  const frozen = await page.evaluate(() => ({ time: window.gallery.time, poses: window.galleryPose() }));
  await page.screenshot({ path: `${output}/animation-paused-walk.png` });
  await page.waitForTimeout(200);
  assert.deepEqual(
    await page.evaluate(() => ({ time: window.gallery.time, poses: window.galleryPose() })),
    frozen,
    'Paused playback preserves the exact rendered pose through a screenshot and subsequent frames',
  );
  await page.locator('#gallery-step').click();
  close(
    await page.evaluate(() => window.gallery.time),
    frozen.time + 1 / 30,
    'Frame-step advances exactly one frame',
  );
  assert.notDeepEqual(
    await page.evaluate(() => window.galleryPose()),
    frozen.poses,
    'Frame-step changes the walking pose',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.gallery.view.effects.reduced);
  await page.locator('#gallery-animation').selectOption('idle');
  await page.waitForFunction(() => window.gallery.time > 0.12);
  const reducedIdle = await page.evaluate(() => ({
    time: window.gallery.time,
    scales: window.galleryPose().map((pose) => pose[0].scaling[1]),
  }));
  await page.waitForFunction((time) => window.gallery.time > time + 0.15, reducedIdle.time);
  assert.deepEqual(reducedIdle.scales, [1, 1], 'Reduced motion removes original and revised idle breathing');
  assert.deepEqual(
    await page.evaluate(() => window.galleryPose().map((pose) => pose[0].scaling[1])),
    [1, 1],
    'Idle breathing remains suppressed while the preview clock advances',
  );
  await page.locator('#gallery-animation').selectOption('walk');
  await page.waitForFunction(() => window.gallery.time > 0.12);
  const reducedWalk = await page.evaluate(() => ({
    time: window.gallery.time,
    cues: window.galleryCues('walk'),
  }));
  await page.waitForFunction((time) => window.gallery.time > time + 0.15, reducedWalk.time);
  await page.locator('#gallery-play').click();
  const reducedPaused = await page.evaluate(() => ({
    time: window.gallery.time,
    poses: window.galleryPose(),
    cues: window.galleryCues('walk'),
  }));
  for (const side of [0, 1])
    assert.notDeepEqual(
      reducedPaused.cues[side],
      reducedWalk.cues[side],
      'Reduced motion retains deliberate walking on each model',
    );
  await page.screenshot({ path: `${output}/animation-reduced-motion.png` });
  await page.waitForTimeout(200);
  assert.deepEqual(
    await page.evaluate(() => ({
      time: window.gallery.time,
      poses: window.galleryPose(),
      cues: window.galleryCues('walk'),
    })),
    reducedPaused,
    'Reduced-motion playback freezes exactly when paused',
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const speeds = await page
    .locator('#gallery-speed option')
    .evaluateAll((options) => options.map((o) => o.value));
  for (const value of speeds) {
    await page.locator('#gallery-speed').selectOption(value);
    const speed = Number(value);
    assert(Number.isFinite(speed) && speed > 0);
    assert.equal(await page.evaluate(() => window.gallery.speed), speed);
    const advance = await page.evaluate(() => {
      const g = window.gallery;
      g.restart();
      g.setPlaying(true);
      g.update(1 / 60);
      g.setPlaying(false);
      const playback = g.time;
      g.step();
      return { playback, stepped: g.time };
    });
    close(advance.playback, speed / 60, `Playback at ${speed}×`);
    close(advance.stepped, advance.playback + 1 / 30, 'Frame-step is independent of playback speed');
  }
  await page.locator('#gallery-speed').selectOption('1');
  await page.locator('#gallery-restart').click();
  close(await page.evaluate(() => window.gallery.time), 0, 'Restart returns to the beginning');
  assert.equal(await page.evaluate(() => window.gallery.playing), false, 'Restart preserves paused playback');
  await page.locator('#gallery-back').click();
  await page.locator('#gallery-step').click();
  assert(
    await page.evaluate(() =>
      window.gallery.pairs.every(
        (p) => p.before.parent.rotation.y === Math.PI && p.after.parent.rotation.y === Math.PI,
      ),
    ),
    'Animation cannot overwrite the shared turntable angle',
  );
  await page.screenshot({ path: `${output}/animation-paused-back.png` });

  // Both individual targets and all three zoom controls work below the former hard limits.
  const focus = [];
  for (const side of ['before', 'after']) {
    await page.locator(`#gallery-${side}`).click();
    const target = await page.evaluate((side) => {
      const g = window.gallery,
        pair = g.pairs.find((p) => p.id === g.selected);
      pair[side].computeWorldMatrix(true);
      const p = pair[side].getAbsolutePosition();
      return { target: g.view.camera.target.asArray(), model: p.asArray() };
    }, side);
    close(target.target[0], target.model[0], `${side} focus horizontal position`);
    close(target.target[2], target.model[2], `${side} focus depth`);
    focus.push(target.target);
  }
  assert.notEqual(focus[0][0], focus[1][0], 'Before and after focus distinct models');
  const zoom = [];
  for (let i = 0; i < 25; i++) {
    const previous = await page.evaluate(() => window.gallery.view.camera.radius);
    await page.locator('#gallery-in').click();
    const camera = await page.evaluate(() => ({
      radius: window.gallery.view.camera.radius,
      near: window.gallery.view.camera.minZ,
    }));
    close(camera.radius, previous * 0.8, 'Gallery zoom remains proportional at close distances');
    assert(
      camera.radius > 0 && camera.near > 0 && camera.near < camera.radius / 4,
      'Close focus keeps a usable near plane',
    );
    zoom.push(camera);
  }
  assert(zoom.at(-1).radius < 0.1, 'Model inspection can zoom well below the previous 2.8 tile minimum');
  let previous = await page.evaluate(() => window.gallery.view.camera.radius);
  await page.locator('[data-camera="in"]').click();
  close(
    await page.evaluate(() => window.gallery.view.camera.radius),
    previous * 0.8,
    'Footer zoom has no former 9 tile minimum',
  );
  previous = await page.evaluate(() => window.gallery.view.camera.radius);
  const canvas = await page.locator('#world').boundingBox();
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
  await page.mouse.wheel(0, -120);
  await page.waitForFunction((radius) => window.gallery.view.camera.radius < radius, previous);
  assert(
    await page.evaluate(
      () => Number.isFinite(window.gallery.view.camera.radius) && window.gallery.view.camera.radius > 0,
    ),
  );
  await page.locator('#gallery-out').click();
  await page.locator('#gallery-focus').click();
  assert.deepEqual(
    await page.evaluate(() => window.strongholdDev.state()),
    galleryWorld,
    'Preview playback and camera inspection never change elapsed time, gold, actors, or any simulation state',
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      meshes: window.gallery.view.scene.meshes.length,
      transforms: window.gallery.view.scene.transformNodes.length,
    })),
    { meshes: initial.meshes, transforms: initial.transforms },
    'Clip changes and restarts do not duplicate preview geometry',
  );
  await page.locator('#gallery-next').click();
  const advanced = await page.locator('#gallery-character').inputValue();
  await page.locator('#gallery-previous').click();
  assert.notEqual(await page.locator('#gallery-character').inputValue(), advanced);
  await page.setViewportSize({ width: 820, height: 650 });
  await page.locator('#gallery-quarter').click();
  await page.screenshot({ path: `${output}/compact-controls.png` });
  await page.evaluate(() => {
    window.galleryRetiredRoots = window.gallery.pairs.map((p) => p.root);
  });
  await page.locator('#return-stronghold').click();
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.state()), retained);
  const returned = await page.evaluate(() => ({
    pairs: window.gallery.pairs.length,
    roots: window.gallery.view.scene.transformNodes.filter((n) => n.name.startsWith('gallery ')).length,
    baselineMaterials: window.gallery.view.scene.materials.filter((m) => m.name.startsWith('baseline '))
      .length,
    fill: window.gallery.view.scene.lights.filter((l) => l.name === 'gallery cool fill').length,
    oldRootsDisposed: window.galleryRetiredRoots.every((root) => root.isDisposed()),
    playing: window.gallery.playing,
  }));
  assert.deepEqual(returned, {
    pairs: 0,
    roots: 0,
    baselineMaterials: 0,
    fill: 0,
    oldRootsDisposed: true,
    playing: false,
  });
  await page.evaluate(() => window.strongholdDev.load('graphics-gallery'));
  await page.waitForFunction(() => window.gallery.pairs.length === 16);
  assert.deepEqual(
    await page.evaluate(() => ({
      clip: window.gallery.clip,
      playing: window.gallery.playing,
      time: window.gallery.time,
    })),
    { clip: 'idle', playing: false, time: 0 },
    'Reopening the archive resets playback',
  );
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
    JSON.stringify(
      { initial, measurements, animations, reducedIdle, focus, zoom, returned, errors },
      null,
      2,
    ),
  );
  console.log(
    `Character gallery: all 16 pairs, ${animations.length} synchronized animation checks, playback, close zoom, simulation isolation, return and reset passed; ${animationOnly ? 0 : selected.length} static pairs captured.`,
  );
} finally {
  await browser.close();
}
