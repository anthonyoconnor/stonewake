import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const phase = process.argv.includes('--before') ? 'before' : 'after';
const haulOnly = process.argv.includes('--haul-only');
const folder = `test-results/m22-${phase}`;
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
const report = { phase, views: [], activities: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(60000);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=showcase&paused=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    window.visualBabylon = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
  });
  async function capture(name, id, alpha = Math.PI * 0.4, radius = 3) {
    await page.evaluate(
      ({ id, alpha, radius }) => {
        const w = window.strongholdDev.state(),
          a = w.agents.find((a) => a.id === id),
          scene = window.visualBabylon.EngineStore.LastCreatedScene;
        if (!a) throw Error('Missing actor ' + id);
        scene.activeCamera.target.set(a.x, 0.35, a.z);
        scene.activeCamera.radius = radius;
        scene.activeCamera.alpha = alpha;
        scene.activeCamera.beta = 0.7;
      },
      { id, alpha, radius },
    );
    await page.waitForTimeout(150);
    const data = await page.locator('#world').evaluate((c) => c.toDataURL('image/png').split(',')[1]);
    writeFileSync(`${folder}/${name}.png`, Buffer.from(data, 'base64'));
    report.views.push(name);
  }
  if (!haulOnly) {
    const actors = await page.evaluate(() => window.strongholdDev.state().agents);
    for (const role of ['miner', 'engineer', 'warrior', 'runesmith']) {
      const actor = actors.find((a) => a.type === role);
      assert(actor);
      await capture(role, actor.id, -Math.PI / 5, 4);
      await capture(`${role}-back`, actor.id, Math.PI * 0.8, 4);
    }
    await page.evaluate(() => window.strongholdDev.load('character-models'));
    const studio = await page.evaluate(() => window.strongholdDev.state().agents);
    for (const actor of studio) {
      await capture(`studio-${actor.type}`, actor.id);
      await capture(`studio-${actor.type}-back`, actor.id, -Math.PI * 0.6);
    }
    const poses = () =>
      page.evaluate(() =>
        window.visualBabylon.EngineStore.LastCreatedScene.transformNodes
          .filter((n) => n.name.startsWith('dwarf-'))
          .map((n) => [n.name, ...n.position.asArray(), ...n.rotation.asArray()]),
      );
    const pausedPose = await poses();
    await page.waitForTimeout(250);
    assert.deepEqual(await poses(), pausedPose, 'Paused resident poses stay fixed');
    await page.evaluate(() => window.strongholdDev.load('showcase'));
    const seen = new Set();
    for (let i = 0; i < 32; i++) {
      await page.evaluate(() => window.strongholdDev.advance(2.5));
      const state = await page.evaluate(() => window.strongholdDev.state());
      for (const a of state.agents) {
        const action = a.job?.kind;
        if (action && !a.path.length && !seen.has(action)) {
          await page.evaluate(() => window.strongholdDev.advance(0.1));
          seen.add(action);
          await capture(`activity-${action}`, a.id, Math.PI * 0.4, 5);
        }
      }
    }
    report.activities = [...seen];
    assert(seen.has('sleep') && seen.has('eat'), 'Actual shared needs reach rendered resting and meal poses');
    assert(
      seen.has('craft') && seen.has('train') && seen.has('research'),
      'Specialist work and training reach their rendered poses',
    );
    // A clear work site gives the Miner a real construction order, separate from room needs.
    await page.evaluate(() => window.strongholdDev.load('character-models'));
    await page.evaluate(() => window.strongholdDev.command({ kind: 'wall', points: [{ x: 8, z: 8 }] }));
    let construction = false;
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.strongholdDev.advance(1));
      const worker = await page.evaluate(() =>
        window.strongholdDev.state().agents.find((a) => a.job?.kind === 'buildWall' && !a.path.length),
      );
      if (worker) {
        await page.evaluate(() => window.strongholdDev.advance(0.1));
        const armPose = () =>
          page.evaluate(
            (id) =>
              window.visualBabylon.EngineStore.LastCreatedScene.getTransformNodeByName(`dwarf-${id}`)
                .getDescendants()
                .filter((n) => n.name === 'arm pivot')
                .map((n) => n.rotation.x),
            worker.id,
          );
        const before = await armPose();
        await page.evaluate(() => window.strongholdDev.advance(0.3));
        assert.notDeepEqual(await armPose(), before, 'Construction arm moves with real job progress');
        await capture('activity-buildWall', worker.id, Math.PI * 0.4, 5);
        construction = true;
        report.activities.push('buildWall');
        break;
      }
    }
    assert(construction, 'A real wall order reaches the construction pose');
    await page.evaluate(() => window.strongholdDev.load('character-models'));
    await page.evaluate(() =>
      window.strongholdDev.command({
        kind: 'enemy',
        type: 'deepmaw',
        spawn: { x: 5, z: 10 },
        target: { x: 6, z: 10 },
      }),
    );
    let defeated = false;
    for (let i = 0; i < 30; i++) {
      await page.evaluate(() => window.strongholdDev.advance(0.5));
      const actor = await page.evaluate(() => window.strongholdDev.state().agents.find((a) => a.id === 1));
      if (!actor) {
        const fall = await page.evaluate(
          () =>
            window.visualBabylon.EngineStore.LastCreatedScene.getTransformNodeByName('dwarf-1')?.rotation.z,
        );
        assert(
          fall !== undefined && fall >= 0,
          'Defeat retains a brief falling model after simulation removal',
        );
        defeated = true;
        await page.evaluate(() => window.strongholdDev.advance(3));
        assert.equal(
          await page.evaluate(
            () => !!window.visualBabylon.EngineStore.LastCreatedScene.getTransformNodeByName('dwarf-1'),
          ),
          false,
          'Defeat model is released',
        );
        break;
      }
    }
    assert(defeated, 'A real enemy attack exercises resident defeat');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => window.strongholdDev.load('character-models'));
    await page.evaluate(() => window.strongholdDev.advance(0.5));
    const reduced = await page.evaluate(() =>
      window.visualBabylon.EngineStore.LastCreatedScene.transformNodes
        .filter((n) => n.name.startsWith('dwarf-'))
        .map((n) => n.scaling.y),
    );
    assert(
      reduced.every((y) => y === 1),
      'Reduced motion disables resident breathing',
    );
    await capture('reduced-motion', 1);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => {
    const api = window.strongholdDev;
    api.load('stronghold');
    api.command({
      kind: 'build',
      room: 'treasure',
      points: Array.from({ length: 9 }, (_, i) => ({ x: 19 + (i % 3), z: 25 + Math.floor(i / 3) })),
    });
    api.command({
      kind: 'dig',
      points: [
        { x: 20, z: 18 },
        { x: 21, z: 18 },
        { x: 22, z: 18 },
      ],
    });
  });
  let hauling = false;
  for (let i = 0; i < 120; i++) {
    await page.evaluate(() => window.strongholdDev.advance(0.5));
    const carrier = await page.evaluate(() =>
      window.strongholdDev.state().agents.find((a) => a.carrying > 0 && a.path.length),
    );
    if (carrier) {
      assert(
        await page.evaluate(
          (id) =>
            window.visualBabylon.EngineStore.LastCreatedScene.getTransformNodeByName(`dwarf-${id}`)
              .getDescendants()
              .find((n) => n.name === 'carried riches')
              .isEnabled(),
          carrier.id,
        ),
        'Carried gold follows the actual moving hauler',
      );
      await capture('activity-haul', carrier.id, Math.PI * 0.4, 5);
      report.activities.push('haul');
      hauling = true;
      break;
    }
  }
  assert(hauling, 'Actual hauling exposes the moving cargo pose');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  writeFileSync(`${folder}/${haulOnly ? 'hauling-report' : 'report'}.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
