import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const phase = process.argv.includes('--before') ? 'before' : 'after';
const folder = `test-results/m21-${phase}`;
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
const resumeRooms = process.argv.includes('--resume-rooms');
const report = resumeRooms
  ? JSON.parse(readFileSync(folder + '/report.json', 'utf8'))
  : { phase, views: [], checks: [], profiles: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(90000);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    const url = source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1];
    window.visualBabylon = await import(url);
  });
  const capture = async (name, x, z, radius, alpha = -Math.PI / 4, beta = 0.62) => {
    await page.evaluate(
      ({ x, z, radius, alpha, beta }) => {
        const scene = window.visualBabylon.EngineStore.LastCreatedScene;
        const camera = scene.activeCamera;
        camera.target.set(x, 0, z);
        camera.radius = radius;
        camera.alpha = alpha;
        camera.beta = beta;
      },
      { x, z, radius, alpha, beta },
    );
    await page.waitForTimeout(250);
    const png = await page
      .locator('#world')
      .evaluate((canvas) => canvas.toDataURL('image/png').split(',')[1]);
    writeFileSync(`${folder}/${name}.png`, Buffer.from(png, 'base64'));
    report.views.push(
      await page.evaluate((name) => {
        const s = window.visualBabylon.EngineStore.LastCreatedScene;
        return {
          name,
          meshes: s.meshes.length,
          active: s.getActiveMeshes().length,
          fps: Math.round(s.getEngine().getFps()),
          vertices: s.getTotalVertices(),
          materials: s.materials.length,
        };
      }, name),
    );
  };
  if (!resumeRooms) {
    await capture('stronghold', 23, 24, 22);
    if (phase === 'after') {
      const fogPick = await page.evaluate(() => {
        const w = window.strongholdDev.state(),
          t = w.tiles.find((t) => !t.known),
          { EngineStore, Ray, Vector3 } = window.visualBabylon;
        const hit = EngineStore.LastCreatedScene.pickWithRay(
          new Ray(new Vector3(t.x, 3, t.z), new Vector3(0, -1, 0), 5),
          (m) => !!m.metadata?.tile,
        );
        return { expected: { x: t.x, z: t.z }, picked: hit?.pickedMesh?.metadata?.tile };
      });
      assert.deepEqual(fogPick.picked, fogPick.expected, 'Instanced fog remains pickable by tile');
      report.checks.push('Instanced unknown terrain preserves exact tile picking without revealing contents');
    }
    await capture('hearth-close', 23, 24, 11, Math.PI / 4);
    await page.evaluate(() => window.strongholdDev.load('showcase'));
    await capture('showcase', 11, 11, 29);
    await capture('kitchen-workshop', 11, 13, 17, Math.PI / 4);
    await capture('training-library', 14, 19, 15, (3 * Math.PI) / 4);
    await page.evaluate(() => window.strongholdDev.load('crossings'));
    await capture('crossings', 13, 9, 24);
    await page.evaluate(() => window.strongholdDev.load('defenses'));
    await capture('fixtures', 17, 12, 19, -Math.PI / 4, 0.4);
  }
  if (phase === 'after' && !process.argv.includes('--profile-only')) {
    const command = async (c) => page.evaluate((c) => window.strongholdDev.command(c), c);
    const state = () => page.evaluate(() => window.strongholdDev.state());
    const advance = async (seconds) => page.evaluate((s) => window.strongholdDev.advance(s), seconds);
    const until = async (predicate, seconds = 120, step = 5) => {
      for (let i = 0; i < seconds / step; i++) {
        const w = await state();
        if (predicate(w)) return w;
        await advance(step);
      }
      const w = await state();
      assert(predicate(w), 'Simulation condition timed out');
      return w;
    };
    const rect = (x, z, width, depth) =>
      Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));

    // Real state changes drive the hinged leaf, lock, damage and trap mechanisms.
    if (!resumeRooms) {
      let door = (await state()).defenses.find((d) => d.type === 'timber-door');
      await command({ kind: 'door', id: door.id, mode: 'open' });
      await capture('door-open', 16, 12, 8, Math.PI / 4, 0.45);
      await command({ kind: 'door', id: door.id, mode: 'locked' });
      await capture('door-locked', 16, 12, 8, Math.PI / 4, 0.45);
      await command({ kind: 'raider', spawn: { x: 17, z: 12 }, target: { x: 10, z: 12 } });
      await until((w) => w.defenses.find((d) => d.id === door.id)?.health < 60, 20, 0.5);
      await capture('door-damaged', 16, 12, 8, Math.PI / 4, 0.45);
      await page.evaluate(() => window.strongholdDev.load('defenses'));
      await command({ kind: 'raider', spawn: { x: 22, z: 12 }, target: { x: 10, z: 12 } });
      await advance(0.1);
      assert((await state()).defenses.some((d) => d.type === 'spike-trap' && d.triggeredAt >= 0));
      await capture('trap-triggered', 21, 12, 8, -Math.PI / 4, 0.4);
      await advance(7);
      await capture('trap-reset', 21, 12, 8, -Math.PI / 4, 0.4);
      report.checks.push('Door open/locked/damaged; trap triggered/reset from actual encounter state');
    }
    await page.evaluate(() => window.strongholdDev.load('room-lab'));
    const layouts = [
      ['treasure', rect(3, 3, 4, 3)],
      ['dormitory', rect(8, 3, 3, 5)],
      ['kitchen', rect(3, 8, 1, 6)],
      ['workshop', [...rect(6, 8, 4, 2), ...rect(6, 10, 2, 4)]],
      ['training', rect(9, 11, 7, 5).filter((p) => p.x !== 12 || ![12, 13].includes(p.z))],
      [
        'library',
        rect(15, 3, 6, 9).filter(
          (p) => (![17, 18].includes(p.x) || p.z < 4 || p.z > 10) && !(p.x === 15 && p.z === 11),
        ),
      ],
    ];
    await command({ kind: 'free-build', enabled: false });
    for (const [room, points] of layouts) {
      await command({ kind: 'build', room, points });
      const w = await state();
      assert.equal(
        w.tiles.filter((t) => t.room === room).length,
        points.length,
        room + ' floor survives irregular model layout',
      );
    }
    await capture('irregular-rooms', 12, 10, 25);
    await capture('earth-and-bedrock', 14, 10, 14, Math.PI / 4);
    await command({ kind: 'free-build', enabled: true });
    const allowance = (await state()).allowance;
    await command({ kind: 'build', room: 'kitchen', points: [{ x: 4, z: 8 }] });
    assert.equal((await state()).allowance, allowance);
    await command({ kind: 'spawn', type: 'miner', count: 3 });
    await command({ kind: 'wall', points: [{ x: 7, z: 5 }] });
    await until((w) => w.tiles[5 * w.width + 7].reinforced);
    await capture('reinforced-room-walls', 7, 5, 17, Math.PI / 4);
    report.checks.push(
      'All six room floors/furnishings, strip/L/retained earth/continuous bedrock, paid and free expansion',
    );

    await page.evaluate(() => window.strongholdDev.load('crossings'));
    await command({ kind: 'free-build', enabled: true });
    await command({ kind: 'build', room: 'kitchen', points: rect(3, 7, 3, 1) });
    await command({ kind: 'build', room: 'dormitory', points: rect(3, 12, 3, 1) });
    const at = (w, x, z) => w.tiles[z * w.width + x];
    await until((w) => at(w, 9, 9).claimed);
    await command({
      kind: 'bridge',
      points: [
        { x: 10, z: 9 },
        { x: 11, z: 9 },
        { x: 10, z: 10 },
        { x: 11, z: 10 },
      ],
    });
    await capture('water-bridge-plans', 10, 9, 13, Math.PI / 4);
    await until((w) => at(w, 11, 9).bridge && at(w, 11, 10).bridge);
    await capture('water-bridge', 11, 9, 14, Math.PI / 4);
    await until((w) => at(w, 16, 9).claimed);
    await command({
      kind: 'bridge',
      points: [
        { x: 17, z: 9 },
        { x: 18, z: 9 },
      ],
    });
    await capture('lava-bridge-plans', 17, 9, 15, -Math.PI / 4);
    await until((w) => at(w, 18, 9).bridge);
    await capture('hazards-and-bridges', 15, 8, 22, Math.PI / 4);
    await capture('chasm-close', 14, 5, 9, -Math.PI / 4);
    const worldBefore = (await state()).tiles.filter((t) => t.known).length;
    await capture('fog-rotation', 24, 4, 25, (3 * Math.PI) / 4);
    assert.equal((await state()).tiles.filter((t) => t.known).length, worldBefore);
    report.checks.push(
      'Wide water decks, narrow lava crossing, visible plans, chasm edges, camera preserves fog',
    );

    await advance(0.5);
    const animated = await page.evaluate(() => {
      const s = window.visualBabylon.EngineStore.LastCreatedScene;
      return s.getMaterialByName('water').diffuseTexture.uOffset;
    });
    assert.notEqual(animated, 0, 'Water has restrained motion');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await advance(0.5);
    await capture('reduced-motion', 15, 8, 22, Math.PI / 4);
    const reduced = await page.evaluate(() => {
      const s = window.visualBabylon.EngineStore.LastCreatedScene;
      return {
        water: s.getMaterialByName('water').diffuseTexture.uOffset,
        lava: s.getMaterialByName('lava').diffuseTexture.uOffset,
        particles: s.meshes.filter((m) => m.name === 'activity particle' && m.isEnabled()).length,
      };
    });
    assert.deepEqual(reduced, { water: 0, lava: 0, particles: 0 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    report.checks.push(
      'Live reduced-motion toggle stops flow/light modulation and immediately disables activity particles',
    );
  }
  if (process.argv.includes('--profile') || process.argv.includes('--profile-only')) {
    for (const scenario of ['stronghold', 'showcase']) {
      await page.evaluate((id) => window.strongholdDev.load(id), scenario);
      await capture(
        'profile-' + scenario,
        scenario === 'stronghold' ? 23 : 11,
        scenario === 'stronghold' ? 24 : 11,
        scenario === 'stronghold' ? 22 : 29,
      );
      report.profiles.push(
        await page.evaluate(async (scenario) => {
          const s = window.visualBabylon.EngineStore.LastCreatedScene,
            frameTimes = [];
          let previous = performance.now();
          for (let i = 0; i < 90; i++)
            await new Promise((resolve) =>
              requestAnimationFrame((now) => {
                if (i >= 30) frameTimes.push(now - previous);
                previous = now;
                resolve();
              }),
            );
          frameTimes.sort((a, b) => a - b);
          const mean = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
          return {
            scenario,
            frames: 60,
            meanMs: +mean.toFixed(2),
            p95Ms: +frameTimes[56].toFixed(2),
            fps: +(1000 / mean).toFixed(1),
            renderer: s.getEngine().getGlInfo().renderer,
            meshes: s.meshes.length,
            vertices: s.getTotalVertices(),
          };
        }, scenario),
      );
    }
  }
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
