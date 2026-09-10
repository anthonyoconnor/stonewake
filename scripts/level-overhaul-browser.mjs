import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform, release } from 'node:os';
import { chromium } from 'playwright';

// One review flow serves individual milestones and the completed catalog.
// --level=campaign-fungal-hollows --play captures real fogged development.
// --profile compares exact developed-world copies with/without local regions;
// this isolates atmospheric overhead, not a regression against the old map size.
// --layouts-only makes a neutral atlas; --discovery-only stops after a natural
// hazard bank is genuinely uncovered. --level accepts comma-separated IDs.
const args = process.argv.slice(2);
const selected = args.find((a) => a.startsWith('--level='))?.slice(8);
const selectedIds = selected?.split(',');
const standaloneOnly = args.includes('--standalone');
const approach = args.find((a) => a.startsWith('--approach='))?.slice(11) ?? 'intended';
assert(['intended', 'alternate'].includes(approach), 'Choose --approach=intended or --approach=alternate');
const discoveryOnly = args.includes('--discovery-only');
const profileWorldPath = args.find((a) => a.startsWith('--profile-world='))?.slice(16);
const cpuProfileOnly = args.includes('--cpu-profile-only');
assert(
  !cpuProfileOnly || (profileWorldPath && args.includes('--profile') && !args.includes('--no-cpu-profile')),
  'A CPU-only sample requires --profile and a verified --profile-world fixture',
);
const profileWorld = profileWorldPath
  ? JSON.parse(readFileSync(profileWorldPath, 'utf8'), (_key, value) =>
      value && typeof value === 'object' && '__reviewNumber' in value ? Number(value.__reviewNumber) : value,
    )
  : undefined;
assert(
  !profileWorld || (args.includes('--profile') && selectedIds?.length === 1 && !discoveryOnly),
  'A snapshot is only accepted for one selected performance review',
);
const explore = args
  .find((a) => a.startsWith('--explore='))
  ?.slice(10)
  .split(':')
  .map((pair) => {
    const [x, z] = pair.split(',').map(Number);
    assert(Number.isInteger(x) && Number.isInteger(z), 'Exploration waypoints use --explore=x,z:x,z');
    return { x, z };
  });
assert(
  !explore || discoveryOnly,
  'Optional excavation is a short discovery review, separate from completion evidence',
);
const play = args.includes('--play') || args.includes('--profile') || discoveryOnly;
const layoutsOnly = args.includes('--layouts-only');
const dressing = args.includes('--dressing');
const folder =
  process.env.VISUAL_FOLDER ??
  `test-results/level-overhaul${selected ? `/${selected}` : ''}${dressing ? '/dressing' : discoveryOnly ? '/discovery' : approach === 'alternate' ? '/alternate' : ''}`;
mkdirSync(folder, { recursive: true });
const report = {
  machine: { platform: platform(), release: release(), cpu: cpus()[0]?.model },
  levels: [],
  profiles: [],
  errors: [],
};
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
report.machine.browser = browser.version();
report.machine.headless = true;
const flush = () => writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2));

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(90000);
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('requestfailed', (request) => {
    if (!request.url().endsWith('/favicon.ico'))
      report.errors.push(`Request failed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico'))
      report.errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  await page.routeWebSocket(/.*/, () => {});
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const resource = performance
      .getEntriesByType('resource')
      .find((e) => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name));
    const { GameScene } = await import(resource.name);
    const render = GameScene.prototype.render;
    GameScene.prototype.render = function () {
      window.levelReviewView = this;
      return render.call(this);
    };
    const source = await (await fetch('/src/view/scene.ts')).text();
    window.levelBabylon = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    window.levelRouteApi = await import('/scripts/helpers/campaign-route.ts');
    window.levelApproachCells = (await import('/src/content/campaign-levels.ts')).approachCells;
    window.levelTick = (await import('/src/game/simulation.ts')).tick;
    const { environmentDecoration } = await import('/src/content/environment-regions.ts');
    window.levelLandscapePoint = () => {
      const w = window.levelReviewView.world;
      const floor = w.tiles.filter((t) => t.known && t.terrain === 'floor');
      const hazards = w.tiles.filter((t) => t.known && ['water', 'lava', 'chasm'].includes(t.terrain));
      const banks = hazards.filter((t) => floor.some((p) => Math.hypot(p.x - t.x, p.z - t.z) <= 2));
      if (banks.length >= 6) {
        const density = (t) => hazards.filter((p) => Math.hypot(p.x - t.x, p.z - t.z) < 4).length;
        banks.sort((a, b) => density(b) - density(a));
        return {
          point: { x: banks[0].x, z: banks[0].z },
          reason: 'Discovered hazard beside a visible walkable bank',
          knownHazards: hazards.length,
        };
      }
      const clusters = floor.filter((t) => environmentDecoration(w, t));
      if (clusters.length >= 3) {
        const t = clusters.sort(
          (a, b) =>
            Math.hypot(b.x - w.hearth.x, b.z - w.hearth.z) - Math.hypot(a.x - w.hearth.x, a.z - w.hearth.z),
        )[0];
        return {
          point: { x: t.x, z: t.z },
          reason: 'Visible local wall/shore dressing',
          clusters: clusters.length,
        };
      }
    };
  });
  await page.waitForFunction(() => window.levelReviewView);
  const catalog = await page.evaluate(async () =>
    (await import('/src/content/playable-levels.ts')).playableLevels.map((l) => ({ id: l.id, name: l.name })),
  );
  const levels = catalog.filter(
    (l) => (!selectedIds || selectedIds.includes(l.id)) && (!standaloneOnly || !l.id.startsWith('campaign-')),
  );
  assert(levels.length, `Unknown level selector ${selected}`);

  const capture = async (name, point, radius = 22, angle = -Math.PI / 4) => {
    await page.mouse.move(800, 500);
    const known = await page.evaluate(() => window.levelReviewView.world.tiles.filter((t) => t.known).length);
    await page.evaluate(
      ({ point, radius, angle }) => {
        const camera = window.levelReviewView.camera;
        camera.target.set(point.x, 0, point.z);
        camera.radius = radius;
        camera.alpha = angle;
        camera.beta = 0.62;
      },
      { point, radius, angle },
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.screenshot({ path: `${folder}/${name}.png` });
    assert.equal(
      await page.evaluate(() => window.levelReviewView.world.tiles.filter((t) => t.known).length),
      known,
      'Camera inspection cannot discover terrain',
    );
  };

  for (const [index, entry] of levels.entries()) {
    const item = { id: entry.id, name: entry.name, checks: [], captures: [] };
    report.levels.push(item);
    // Draw both actual definitions in one constant palette. No labels, biome
    // materials or entities can substitute for geographic identity in this view.
    const atlas = await page.evaluate(async (id) => {
      const { playableLevels } = await import('/src/content/playable-levels.ts');
      const { levelComparisons } = await import('/src/content/level-baselines.ts');
      const { createWorld } = await import('/src/game/world.ts');
      const before = createWorld(levelComparisons.find((l) => l.id === `baseline-${id}`).level);
      const after = createWorld(playableLevels.find((l) => l.id === id).level);
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 620;
      const c = canvas.getContext('2d');
      c.fillStyle = '#eeeae2';
      c.fillRect(0, 0, 1200, 620);
      const colors = {
        floor: '#dedacf',
        dirt: '#99978e',
        rock: '#777a77',
        bedrock: '#343b3e',
        gold: '#b5a274',
        gem: '#868b9c',
        water: '#829fa3',
        lava: '#bb8f78',
        chasm: '#151d24',
      };
      for (const [i, w] of [before, after].entries()) {
        const scale = Math.min(550 / w.width, 550 / w.height),
          left = i * 600 + (600 - w.width * scale) / 2,
          top = (620 - w.height * scale) / 2;
        for (const t of w.tiles) {
          c.fillStyle = colors[t.terrain];
          c.fillRect(left + t.x * scale, top + t.z * scale, scale + 0.2, scale + 0.2);
        }
      }
      return {
        png: canvas.toDataURL('image/png').split(',')[1],
        before: { width: before.width, height: before.height },
        after: { width: after.width, height: after.height },
      };
    }, entry.id);
    writeFileSync(`${folder}/${entry.id}-neutral-before-after.png`, Buffer.from(atlas.png, 'base64'));
    item.dimensions = { before: atlas.before, after: atlas.after };
    item.captures.push(`${entry.id}-neutral-before-after.png`);
    if (layoutsOnly) {
      flush();
      continue;
    }

    // Use the ordinary menu start. No debug-world replacement, fog disclosure,
    // money grant, enemy teleport or supplied room enters the play evidence.
    await page.locator('#open-menu').click();
    await page.locator('#discard-run').click();
    await page.locator('#free-play').click();
    await page.locator(`[data-level="${entry.id}"]`).click();
    await page.locator('#start-level').click();
    await page.locator('#loading-screen').waitFor({ state: 'hidden' });
    await page.evaluate(() => window.strongholdDev.pause(true));
    const initial = await page.evaluate(() => window.strongholdDev.state());
    assert.equal(initial.freePlay.levelId, entry.id);
    assert.equal(initial.freeRoomBuilding, false);
    assert.equal(initial.agents.length, 3);
    assert(!initial.onwardHearth.discovered && !initial.tiles.some((t) => t.room));
    await capture(`${entry.id}-start`, initial.hearth);
    await capture(`${entry.id}-start-reverse`, initial.hearth, 22, Math.PI / 4);
    item.captures.push(`${entry.id}-start.png`, `${entry.id}-start-reverse.png`);
    flush();

    // Ordinary full map and minimap recentering work on the larger dimensions,
    // while undiscovered ground keeps the exact concealed-map color.
    await page.getByRole('button', { name: 'Show full map', exact: true }).click();
    const fog = await page.evaluate(() => {
      const w = window.strongholdDev.state(),
        t = w.tiles.find((t) => !t.known && t.terrain === 'dirt');
      const canvas = document.querySelector('#full-map'),
        r = canvas.getBoundingClientRect();
      return {
        color: [
          ...canvas
            .getContext('2d')
            .getImageData(
              Math.floor(((t.x + 0.5) / w.width) * canvas.width),
              Math.floor(((t.z + 0.5) / w.height) * canvas.height),
              1,
              1,
            ).data,
        ],
        fits: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
      };
    });
    assert.deepEqual(fog.color, [12, 19, 25, 255]);
    assert(fog.fits);
    await page.locator('#full-map').click({ position: { x: 20, y: 20 } });
    assert.equal(await page.locator('#full-map-dialog').isVisible(), false);
    await page.keyboard.press('Home');
    const picking = await page.evaluate(() => {
      const w = window.strongholdDev.state(),
        t = w.tiles.find((t) => !t.known && t.terrain === 'dirt');
      const { Ray, Vector3 } = window.levelBabylon;
      const hit = window.levelReviewView.scene.pickWithRay(
        new Ray(new Vector3(t.x, 5, t.z), new Vector3(0, -1, 0), 10),
        (m) => !!m.metadata?.tile,
      );
      return { wanted: { x: t.x, z: t.z }, found: hit?.pickedMesh?.metadata?.tile };
    });
    assert.deepEqual(picking.found, picking.wanted);
    item.checks.push(
      'Normal start, two camera angles, full-map fit/recentering, exact fog concealment and tile picking',
    );

    if (dressing) {
      // A brief cosmetic regression check uses the existing revealed debug copy.
      // It is explicitly separate from the normal paid route evidence below.
      await page.getByRole('button', { name: 'Debug', exact: true }).click();
      await page.getByRole('button', { name: 'Level preview', exact: true }).click();
      await page.locator('#preview-level').selectOption(entry.id);
      await page.getByRole('button', { name: 'Load full level', exact: true }).click();
      await page.locator('#loading-screen').waitFor({ state: 'hidden' });
      const regions = await page.evaluate(() =>
        (window.levelReviewView.world.environmentRegions ?? [])
          .filter((region) => ['dry', 'masonry'].includes(region.kind))
          .map((region) => ({
            id: region.id,
            point: {
              x: region.cells.reduce((n, p) => n + p.x, 0) / region.cells.length,
              z: region.cells.reduce((n, p) => n + p.z, 0) / region.cells.length,
            },
          })),
      );
      for (const region of regions) {
        await capture(`${entry.id}-${region.id}-dressing`, region.point, 20);
        await capture(`${entry.id}-${region.id}-dressing-reverse`, region.point, 20, Math.PI * 0.75);
        item.captures.push(
          `${entry.id}-${region.id}-dressing.png`,
          `${entry.id}-${region.id}-dressing-reverse.png`,
        );
      }
      await page.getByRole('button', { name: 'Return to stronghold', exact: true }).click();
      await page.locator('#loading-screen').waitFor({ state: 'hidden' });
      assert.equal(
        await page.evaluate(() => window.strongholdDev.state().tiles.filter((t) => t.known).length),
        initial.tiles.filter((t) => t.known).length,
      );
      item.checks.push(
        'Revealed debug dressing review and exact retained fog restoration; separate from normal-play evidence',
      );
    }

    if (play) {
      if (profileWorld) {
        assert.equal(
          profileWorld.freePlay?.levelId,
          entry.id,
          'Performance snapshot matches the selected real catalog entry',
        );
        assert(
          !profileWorld.outcome && profileWorld.agents.length > 3 && profileWorld.tiles.some((t) => t.room),
        );
        await page.evaluate(async (w) => {
          window.strongholdDev.pause(true);
          window.levelReviewView.setWorld(w);
          await window.levelReviewView.ready();
        }, profileWorld);
        item.developedAt = profileWorld.elapsed;
        item.snapshot = profileWorldPath;
        item.checks.push(
          'Restored paid development fixture for performance only; no route or victory assertion is inferred from restoration',
        );
      } else {
        await page.evaluate(
          ({ approach, explore }) => {
            window.levelReviewRoute = window.levelRouteApi.createCampaignRoute(
              window.levelReviewView.world,
              approach,
              0,
              { holdActivation: true },
            );
            window.levelReviewExtraOpenedAt = undefined;
            window.levelReviewExtra = explore ? window.levelApproachCells(explore) : undefined;
          },
          { approach, explore },
        );
        let state;
        let discoveryCaptured = false;
        let landscapeCaptured = false;
        for (let seconds = 0; seconds < 2100; seconds += 10) {
          state = await page.evaluate(async () => {
            const w = window.levelReviewView.world,
              route = window.levelReviewRoute,
              api = window.levelRouteApi;
            for (let second = 0; second < 10 && !w.outcome; second++) {
              api.actCampaignRoute(w, route);
              if (
                route.openedAt !== undefined &&
                window.levelReviewExtra &&
                window.levelReviewExtraOpenedAt === undefined
              ) {
                window.strongholdDev.command({ kind: 'dig', points: window.levelReviewExtra });
                window.levelReviewExtraOpenedAt = w.elapsed;
              }
              for (let step = 0; step < 20 && !w.outcome; step++) {
                window.levelTick(w, 0.05);
                api.observeCampaignRoute(w, route);
              }
            }
            await window.strongholdDev.advance(0);
            return {
              elapsed: w.elapsed,
              outcome: w.outcome,
              discovered: route.discoveredAt,
              discovery: route.firstDiscovery,
              extraExcavationAt: window.levelReviewExtraOpenedAt,
              landscape: window.levelLandscapePoint(),
              suppressed:
                !route.plan.suppression ||
                w.encounters
                  .filter((s) => s.definition.clear === 'claim')
                  .every((s) => s.phase === 'cleared'),
            };
          });
          if (state.discovery && !discoveryCaptured) {
            await capture(`${entry.id}-first-discovery`, state.discovery.point, 21);
            item.captures.push(`${entry.id}-first-discovery.png`);
            discoveryCaptured = true;
            flush();
          }
          if (state.landscape && !landscapeCaptured && (!discoveryOnly || state.landscape.knownHazards)) {
            await capture(`${entry.id}-landscape-discovery`, state.landscape.point, 21);
            await capture(
              `${entry.id}-landscape-discovery-reverse`,
              state.landscape.point,
              21,
              Math.PI * 0.75,
            );
            item.landscapeDiscovery = { ...state.landscape, at: state.elapsed };
            if (explore) item.optionalExploration = { waypoints: explore, openedAt: state.extraExcavationAt };
            item.captures.push(
              `${entry.id}-landscape-discovery.png`,
              `${entry.id}-landscape-discovery-reverse.png`,
            );
            landscapeCaptured = true;
            flush();
            if (discoveryOnly) break;
          }
          if (state.outcome || (!discoveryOnly && state.discovered !== undefined && state.suppressed)) break;
        }
        item.route = await page.evaluate(() =>
          window.levelRouteApi.campaignRouteReport(window.levelReviewView.world, window.levelReviewRoute),
        );
        if (discoveryOnly) {
          assert(landscapeCaptured, 'Short review reaches a naturally discovered hazard bank');
          item.checks.push(
            'Ordinary paid development to landscape discovery, retained fog, two natural-area camera angles; completion covered by separate paid-route evidence',
          );
          flush();
          console.log(`Reviewed discovery: ${entry.name}`);
          continue;
        }
        item.developedAt = item.route.seconds;
        assert.equal(state.outcome, undefined, JSON.stringify(item.route));
        assert(state.discovered !== undefined && state.suppressed, JSON.stringify(item.route));
      }
      const views = await page.evaluate(() => {
        const w = window.levelReviewView.world;
        const servicePriority = {
          kitchen: 6,
          dormitory: 5,
          library: 4,
          workshop: 3,
          training: 2,
          treasure: 1,
        };
        const ruin = w.tiles
          .filter((t) => t.known && t.ruin && t.terrain === 'floor')
          .sort((a, b) => (servicePriority[b.room] ?? 0) - (servicePriority[a.room] ?? 0))[0];
        const natural = window.levelLandscapePoint()?.point;
        return { hearth: w.hearth, ruin, natural, relay: w.onwardHearth };
      });
      item.viewpoints = Object.fromEntries(
        Object.entries(views)
          .filter(([, p]) => p)
          .map(([kind, p]) => [kind, { x: p.x, z: p.z }]),
      );
      for (const [kind, point] of Object.entries(views))
        if (point) {
          await capture(`${entry.id}-${kind}-developed`, point, kind === 'hearth' ? 25 : 20);
          await capture(`${entry.id}-${kind}-reverse`, point, kind === 'hearth' ? 25 : 20, Math.PI * 0.75);
          item.captures.push(`${entry.id}-${kind}-developed.png`, `${entry.id}-${kind}-reverse.png`);
          flush();
        }
      if (args.includes('--profile')) {
        await capture(`${entry.id}-profile`, views.hearth, 27);
        await page.evaluate(() => {
          window.levelProfileOriginal = window.levelReviewView.world;
        });
        // Reversed order reduces warm-up/order bias. Each copy starts with the
        // same paid rooms, residents, fog, jobs, timers and camera. No copy is
        // substituted into the paid run's progression/activation evidence.
        const treatments = cpuProfileOnly
          ? []
          : ['authored', 'without-local-regions', 'without-local-regions', 'authored'];
        for (const [sample, treatment] of treatments.entries()) {
          await page.evaluate(async (treatment) => {
            window.strongholdDev.pause(true);
            const view = window.levelReviewView,
              w = structuredClone(window.levelProfileOriginal);
            if (treatment === 'without-local-regions') w.environmentRegions = [];
            view.setWorld(w);
            await view.ready();
            // Warm geometry, materials and actor views without progressing the
            // copied jobs/timers by a treatment-dependent number of seconds.
            for (let i = 0; i < 90; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
          }, treatment);
          const profile = await page.evaluate(
            async ({ id, sample, treatment }) => {
              const view = window.levelReviewView,
                w = view.world,
                frameTimes = [];
              const started = w.elapsed,
                geometryBefore = view.geometryRevision,
                wallStarted = performance.now();
              const startState = {
                elapsed: w.elapsed,
                rooms: w.tiles.filter((t) => t.room).length,
                claimed: w.tiles.filter((t) => t.claimed).length,
                population: w.agents.length,
              };
              let previous = wallStarted;
              window.strongholdDev.pause(false);
              while (performance.now() - wallStarted < 15000)
                await new Promise((resolve) =>
                  requestAnimationFrame((now) => {
                    frameTimes.push(now - previous);
                    previous = now;
                    resolve();
                  }),
                );
              window.strongholdDev.pause(true);
              const wallMilliseconds = performance.now() - wallStarted;
              frameTimes.sort((a, b) => a - b);
              const mean = frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length;
              return {
                id,
                sample,
                treatment,
                startState,
                warmFramesPaused: 90,
                wallMilliseconds,
                frames: frameTimes.length,
                meanMs: mean,
                p95Ms: frameTimes[Math.floor(frameTimes.length * 0.95)],
                fps: 1000 / mean,
                renderer: view.engine.getGlInfo().renderer,
                meshes: view.scene.meshes.length,
                activeMeshes: view.scene.getActiveMeshes().length,
                vertices: view.scene.getTotalVertices(),
                dimensions: [w.width, w.height],
                population: w.agents.length,
                rooms: w.tiles.filter((t) => t.room).length,
                furnishings: w.furnishings.length,
                claimed: w.tiles.filter((t) => t.claimed).length,
                known: w.tiles.filter((t) => t.known).length,
                simulationAdvanced: w.elapsed - started,
                elapsed: w.elapsed,
                geometryRevisions: view.geometryRevision - geometryBefore,
                camera: {
                  target: view.camera.target.asArray(),
                  radius: view.camera.radius,
                  alpha: view.camera.alpha,
                  beta: view.camera.beta,
                },
                viewport: [innerWidth, innerHeight],
                hardwareScaling: view.engine.getHardwareScalingLevel(),
              };
            },
            { id: entry.id, sample, treatment },
          );
          await page.evaluate(() => window.strongholdDev.pause(true));
          assert(
            profile.simulationAdvanced > 0 && profile.rooms > 0 && profile.population > 3,
            'Profile uses a developed live simulation',
          );
          report.profiles.push(profile);
          flush();
        }
        // CPU sampling is deliberately outside the timing samples. It helps
        // distinguish simulation/renderer CPU cost from GPU or scheduling delay.
        if (!args.includes('--no-cpu-profile')) {
          if (cpuProfileOnly)
            await page.evaluate(async () => {
              for (let i = 0; i < 90; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
            });
          const profiler = await page.context().newCDPSession(page);
          await profiler.send('Profiler.enable');
          await profiler.send('Profiler.start');
          await page.evaluate(() => window.strongholdDev.pause(false));
          await page.waitForTimeout(10000);
          await page.evaluate(() => window.strongholdDev.pause(true));
          const { profile: cpu } = await profiler.send('Profiler.stop');
          writeFileSync(`${folder}/${entry.id}-active-cpu.json`, JSON.stringify(cpu));
          const nodes = new Map(cpu.nodes.map((node) => [node.id, node.callFrame]));
          const functions = new Map();
          for (let i = 0; i < (cpu.samples?.length ?? 0); i++) {
            const frame = nodes.get(cpu.samples[i]);
            const key = `${frame.functionName || '(anonymous)'} ${frame.url}:${frame.lineNumber + 1}`;
            functions.set(key, (functions.get(key) ?? 0) + (cpu.timeDeltas?.[i] ?? 0) / 1000);
          }
          report.cpuProfile = {
            file: `${entry.id}-active-cpu.json`,
            elapsedMilliseconds: (cpu.endTime - cpu.startTime) / 1000,
            hottestSelfTime: [...functions.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 25)
              .map(([functionName, milliseconds]) => ({ functionName, milliseconds })),
          };
          await profiler.detach();
          flush();
        }
        await page.evaluate(async () => {
          window.levelReviewView.setWorld(window.levelProfileOriginal);
          await window.levelReviewView.ready();
          delete window.levelProfileOriginal;
        });
      }
      // End through ordinary activation after the live review, then verify this
      // map's normal Restart area action preserves its catalog and fresh state.
      if (profileWorld) {
        flush();
        console.log(`Reviewed restored performance fixture: ${entry.name}`);
        continue;
      }
      await page.evaluate(() => {
        window.levelReviewRoute.options.holdActivation = false;
      });
      for (let second = 0; second < 180; second += 10) {
        const outcome = await page.evaluate(async () => {
          const w = window.levelReviewView.world,
            route = window.levelReviewRoute,
            api = window.levelRouteApi;
          for (let i = 0; i < 10 && !w.outcome; i++) {
            api.actCampaignRoute(w, route);
            await window.strongholdDev.advance(1);
          }
          return w.outcome;
        });
        if (outcome) break;
      }
      assert.equal(await page.evaluate(() => window.strongholdDev.state().outcome), 'victory');
      item.route = await page.evaluate(() =>
        window.levelRouteApi.campaignRouteReport(window.levelReviewView.world, window.levelReviewRoute),
      );
      await page.locator('#restart-area').click();
      await page.locator('#loading-screen').waitFor({ state: 'hidden' });
      await page.evaluate(() => window.strongholdDev.pause(true));
      const restarted = await page.evaluate(() => window.strongholdDev.state());
      assert.equal(restarted.freePlay.levelId, entry.id);
      assert.equal(restarted.agents.length, initial.agents.length);
      assert.equal(restarted.allowance, initial.allowance);
      assert(
        !restarted.outcome && !restarted.onwardHearth.discovered && !restarted.tiles.some((t) => t.room),
      );
      item.checks.push(
        'Paid normal expedition, natural fogged views, claimed source, physical activation and UI restart',
      );
    }
    flush();
    console.log(`Reviewed ${index + 1}/${levels.length}: ${entry.name}`);
  }
  assert.deepEqual(report.errors, []);
  console.log(
    `PASS: ${report.levels.length} level comparisons${profileWorld ? ', restored performance fixture' : play ? ', ordinary expeditions' : ''}; ${report.profiles.length} developed live profiles. ${folder}`,
  );
} finally {
  flush();
  await browser.close();
}
