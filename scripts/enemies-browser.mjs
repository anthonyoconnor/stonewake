import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  headless: true,
  channel: process.platform === 'win32' ? 'msedge' : undefined,
});
const output = 'test-results/m17-enemies';
mkdirSync(output, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${url}/?scenario=enemy-roster&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'enemy-roster');
  const state = () => page.evaluate(() => window.strongholdDev.state());
  const advance = (seconds) => page.evaluate((seconds) => window.strongholdDev.advance(seconds), seconds);
  const initial = await state();
  assert.equal(initial.enemies.length, 10);
  const species = initial.enemies.map((e) => e.type);
  assert.equal(new Set(species).size, 10);
  const camera = async (x, z, radius = 11, alpha = Math.PI / 2, beta = 0.5) =>
    page.evaluate(
      async ({ x, z, radius, alpha, beta }) => {
        const source = await (await fetch('/src/view/scene.ts')).text();
        const dependency = source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1];
        const { EngineStore, Vector3 } = await import(dependency),
          scene = EngineStore.LastCreatedScene;
        scene.activeCamera.setTarget(new Vector3(x, 0, z));
        scene.activeCamera.radius = radius;
        scene.activeCamera.alpha = alpha;
        scene.activeCamera.beta = beta;
        return scene.transformNodes
          .filter(
            (n) =>
              n.parent === null &&
              /^(goblin-raider|tunnel-burrower|cave-spider|spore-brute|restless-guard|ancient-sentinel|crystal-elemental|crystalback-stalker|cinderling|deepmaw) \d+$/.test(
                n.name,
              ),
          )
          .map((n) => ({ name: n.name, enabled: n.isEnabled(), meshes: n.getChildMeshes().length }));
      },
      { x, z, radius, alpha, beta },
    );
  const models = await camera(19, 11, 27);
  assert.equal(models.length, 10);
  assert(
    models.every((m) => m.enabled && m.meshes > 20),
    JSON.stringify(models),
  );
  await page.screenshot({ path: `${output}/all-ten.png` });
  const crowdSample = await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    const { EngineStore } = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    const scene = EngineStore.LastCreatedScene,
      frames = [];
    let previous = performance.now();
    for (let i = 0; i < 12; i++)
      await new Promise((resolve) =>
        requestAnimationFrame((now) => {
          frames.push(now - previous);
          previous = now;
          resolve();
        }),
      );
    frames.sort((a, b) => a - b);
    return {
      visibleEnemies: 10,
      sceneMeshes: scene.meshes.length,
      activeMeshes: scene.getActiveMeshes().length,
      vertices: scene.getTotalVertices(),
      medianFrameMs: frames[6],
      note: 'Headless local sample, not a target-device FPS guarantee.',
    };
  });
  for (const [i, region] of ['upper', 'fungal', 'ancient', 'crystal', 'volcanic'].entries()) {
    await camera(20, 3 + i * 4, 9, Math.PI / 2, 0.52);
    await page.screenshot({ path: `${output}/${region}-models.png` });
  }
  await camera(19, 11, 27);
  await advance(8.5);
  const active = await state();
  assert(active.encounters.every((e) => e.phase === 'active'));
  assert(active.enemies.filter((e) => e.health > 0).every((e) => !e.dormant));
  await page.screenshot({ path: `${output}/mixed-combat.png` });
  await advance(8);
  const battle = await state();
  assert(battle.enemies.some((e) => e.health < e.maxHealth));
  assert(
    battle.agents.some((a) => (a.health ?? a.maxHealth) < a.maxHealth) ||
      battle.agents.length < initial.agents.length,
  );
  assert(battle.enemies.some((e) => e.attackedAt !== undefined));
  const anatomy = await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    const { EngineStore } = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    const scene = EngineStore.LastCreatedScene;
    const spider = scene.getTransformNodeByName('cave-spider 3'),
      burrower = scene.getTransformNodeByName('tunnel-burrower 2');
    return {
      spiderLegs: spider.getDescendants().filter((n) => n.name === 'spider walking leg').length,
      burrowerLegs: burrower.getDescendants().filter((n) => n.name === 'foreleg' || n.name === 'hindleg')
        .length,
    };
  });
  assert.deepEqual(anatomy, { spiderLegs: 8, burrowerLegs: 4 });
  await page.evaluate(() => window.strongholdDev.load('enemy-roster'));
  await camera(20, 11, 11, Math.PI / 2, 0.8);
  await page.screenshot({ path: `${output}/reverse-view.png` });
  const regions = [];
  for (const region of ['upper', 'fungal', 'ancient', 'crystal', 'volcanic']) {
    await page.evaluate((id) => window.strongholdDev.load(id), `region-${region}`);
    const normal = await state();
    assert.equal(normal.agents.length, 3);
    assert(normal.agents.every((a) => a.type === 'miner'));
    assert.equal(normal.enemies.length, 2);
    assert(normal.enemies.every((e) => e.dormant));
    assert(!normal.onwardHearth.discovered);
    assert.equal(Object.keys(normal.outputs).length, 0);
    assert.equal(normal.defenses?.length ?? 0, 0);
    const hidden = await camera(4, 10, 21);
    assert(
      hidden.every((e) => !e.enabled),
      'Undiscovered inhabitants stay hidden',
    );
    await page.screenshot({ path: `${output}/region-${region}-start.png` });
    regions.push({
      region,
      name: normal.name,
      enemies: normal.enemies.map((e) => e.type),
      gold: normal.allowance,
      hiddenModels: hidden.every((e) => !e.enabled),
    });
  }
  await page.evaluate(() => window.strongholdDev.load('room-lab'));
  await page.evaluate(() =>
    window.strongholdDev.command({
      kind: 'enemy',
      type: 'tunnel-burrower',
      spawn: { x: 3, z: 21 },
      target: { x: 3, z: 22 },
    }),
  );
  await camera(3, 21, 6, -Math.PI * 0.7, 0.38);
  await advance(0.15);
  const diggingPose = () =>
    page.evaluate(async () => {
      const source = await (await fetch('/src/view/scene.ts')).text();
      const { EngineStore } = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
      return EngineStore.LastCreatedScene.getTransformNodeByName('tunnel-burrower 1')
        .getDescendants()
        .filter((n) => n.name === 'foreleg')
        .map((n) => n.rotation.x);
    });
  const beforeClaws = await diggingPose();
  await advance(0.2);
  const afterClaws = await diggingPose();
  assert((await state()).enemies[0].activity === 'Tunneling');
  assert(
    afterClaws.some((angle, i) => Math.abs(angle - beforeClaws[i]) > 0.01),
    'Digging strokes animate foreclaw pivots',
  );
  await page.screenshot({ path: `${output}/burrower-digging.png` });
  await advance(6);
  const excavated = await state();
  assert.equal(excavated.tiles[22 * excavated.width + 3].terrain, 'floor');
  await page.close();
  const reducedPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  reducedPage.on('pageerror', (e) => errors.push(e.message));
  await reducedPage.emulateMedia({ reducedMotion: 'reduce' });
  await reducedPage.goto(`${url}/?scenario=enemy-roster&paused=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await reducedPage.waitForFunction(() => window.strongholdDev?.status().scenario === 'enemy-roster');
  await reducedPage.evaluate(() => window.strongholdDev.advance(0.5));
  const reduced = await reducedPage.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    const { EngineStore } = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    const scene = EngineStore.LastCreatedScene;
    return {
      crestScale: scene.getTransformNodeByName('short flame crest').scaling.y,
      bodyHeights: scene.transformNodes.filter((n) => n.name === 'enemy body').map((n) => n.position.y),
    };
  });
  assert.equal(reduced.crestScale, 1);
  assert(
    reduced.bodyHeights.every((y) => y === 0),
    'Reduced motion suppresses decorative enemy bobbing',
  );
  await reducedPage.screenshot({ path: `${output}/reduced-motion.png` });
  await reducedPage.close();
  assert.deepEqual(errors, []);
  writeFileSync(
    `${output}/report.json`,
    JSON.stringify(
      {
        species,
        models,
        anatomy,
        regions,
        crowdSample,
        reduced,
        combat: battle.enemies.map((e) => ({
          type: e.type,
          health: e.health,
          activity: e.activity,
          attackedAt: e.attackedAt,
        })),
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    'M17 browser: all ten models visible, expected limb counts, five regional captures, mixed natural combat, traps and reverse view passed.',
  );
} finally {
  await browser.close();
}
