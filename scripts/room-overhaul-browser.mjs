import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const output = 'test-results/room-overhaul';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 1 });
  await page.routeWebSocket(/.*/, () => {});
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=room-lab&paused=1`);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const { GameScene } = await import(
      performance.getEntriesByType('resource').find((e) => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name))
        .name
    );
    const render = GameScene.prototype.render;
    GameScene.prototype.render = function () {
      window.roomView = this;
      return render.call(this);
    };
    window.roomDecoration = await import('/src/game/room-decoration.ts');
    window.roomRules = await import('/src/game/rooms.ts');
  });
  await page.waitForFunction(() => window.roomView);
  const report = [];
  for (const room of ['treasure', 'dormitory', 'kitchen', 'workshop', 'training', 'library']) {
    const initial = await page.evaluate((room) => {
      const api = window.strongholdDev;
      api.load('room-lab');
      api.command({
        kind: 'build',
        room,
        points: Array.from({ length: 25 }, (_, i) => ({ x: 7 + (i % 5), z: 5 + Math.floor(i / 5) })),
      });
      const v = window.roomView;
      v.camera.target.set(9, 0.25, 7);
      v.camera.alpha = Math.PI / 4;
      v.camera.beta = 0.72;
      v.camera.radius = 10.8;
      return {
        tiles: v.world.tiles.filter((t) => t.room === room).length,
        live: window.roomDecoration.liveRoomDecorations(v.world).length,
      };
    }, room);
    assert.equal(initial.tiles, 25);
    assert.equal(initial.live, 0);
    await page.mouse.move(250, 600);
    if (room === 'treasure' || room === 'dormitory') {
      await page.waitForTimeout(250);
      await page.screenshot({
        path: `${output}/${room}-empty.png`,
        clip: { x: 360, y: 100, width: 1040, height: 900 },
      });
    }
    await page.evaluate((room) => {
      const v = window.roomView;
      if (room === 'treasure') {
        // Explicit art fixture stock; normal service storage and real spend/reclaim below.
        v.world.allowance = 0;
        let amount = 175;
        for (const s of v.world.roomServices.filter((s) => s.room === room)) {
          s.stored = Math.min(s.capacity, amount);
          amount -= s.stored;
        }
        v.world.revision++;
      }
      if (room === 'dormitory')
        for (const type of ['warrior', 'engineer', 'runesmith', 'cave-hound'])
          window.strongholdDev.command({ kind: 'spawn', type, count: 1 });
    }, room);
    await page.waitForTimeout(600);
    const result = await page.evaluate((room) => {
      const v = window.roomView,
        w = v.world,
        live = window.roomDecoration.liveRoomDecorations(w);
      return {
        room,
        tiles: w.tiles.filter((t) => t.room === room).length,
        props: w.furnishings.filter((f) => f.room === room).map((f) => f.model),
        live: live.map((f) => ({ kind: f.kind, gold: f.storedGold, type: f.residentType })),
        floor: [...v.materials].find(([name]) => name.startsWith(`floor-${room}~`))?.[1].diffuseTexture?.name,
        nodes: [...v.furnitureNodes.keys()],
      };
    }, room);
    assert.equal(result.floor, `room ${room} patterned floor`);
    if (room === 'treasure') {
      assert.deepEqual(
        result.live.map((f) => f.gold),
        [50, 50, 50, 25],
      );
      assert.equal(result.nodes.filter((id) => id.startsWith('gold-pile:')).length, 4);
    }
    if (room === 'dormitory') {
      assert.equal(result.live.length, 4);
      assert.equal(result.nodes.filter((id) => id.startsWith('resident-bed:')).length, 4);
    }
    await page.screenshot({
      path: `${output}/${room}.png`,
      clip: { x: 360, y: 100, width: 1040, height: 900 },
    });
    await page.evaluate(() => (window.roomView.camera.alpha += Math.PI));
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `${output}/${room}-reverse.png`,
      clip: { x: 360, y: 100, width: 1040, height: 900 },
    });
    if (room === 'treasure') {
      await page.evaluate(() => {
        const w = window.roomView.world;
        window.roomRules.spendGold(w, 60);
        w.revision++;
      });
      await page.waitForFunction(
        () =>
          [...window.roomView.furnitureNodes.keys()].filter((id) => id.startsWith('gold-pile:')).length === 3,
      );
      assert.deepEqual(
        await page.evaluate(() =>
          window.roomDecoration.liveRoomDecorations(window.roomView.world).map((f) => f.storedGold),
        ),
        [50, 50, 15],
      );
    }
    if (room === 'dormitory') {
      await page.evaluate(() => {
        window.roomView.world.agents.find((a) => a.type === 'warrior').health = 0;
        return window.strongholdDev.advance(0.05);
      });
      await page.waitForFunction(
        () =>
          [...window.roomView.furnitureNodes.keys()].filter((id) => id.startsWith('resident-bed:')).length ===
          3,
      );
      await page.evaluate(() => {
        const s = window.roomView.world.roomServices.find(
          (s) => s.service === 'rest' && s.assigned !== undefined,
        );
        window.strongholdDev.command({ kind: 'reclaim', points: [{ x: s.x, z: s.z }] });
        return window.strongholdDev.advance(0.05);
      });
      assert.equal(
        await page.evaluate(() => window.roomDecoration.liveRoomDecorations(window.roomView.world).length),
        3,
      );
    }
    report.push(result);
    console.log(
      `PASS ${room}: 25 tiles, distinctive floor, ${result.props.length} static + ${result.live.length} live props`,
    );
  }
  await page.evaluate(() => {
    const api = window.strongholdDev;
    // Cut the inspected room back to an L through ordinary reclaim, exercising rebuilt borders.
    api.command({
      kind: 'reclaim',
      points: Array.from({ length: 4 }, (_, i) => ({ x: 10 + (i % 2), z: 8 + Math.floor(i / 2) })),
    });
    const v = window.roomView;
    v.camera.target.set(9, 0.25, 7);
    v.camera.alpha = Math.PI / 4;
    v.camera.beta = 0.72;
    v.camera.radius = 10.8;
  });
  await page.waitForTimeout(600);
  assert.equal(
    await page.evaluate(() => window.roomView.world.tiles.filter((t) => t.room === 'library').length),
    21,
  );
  await page.screenshot({
    path: `${output}/library-irregular.png`,
    clip: { x: 360, y: 100, width: 1040, height: 900 },
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors), []);
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  const names = ['Treasure Room', 'Dormitory', 'Kitchen', 'Workshop', 'Training Room', 'Library'];
  writeFileSync(
    `${output}/index.html`,
    `<!doctype html><html><head><meta charset="utf-8"><title>Refined rooms</title><style>body{background:#151c23;color:#e7dcc5;font:16px system-ui;margin:32px}h1{font-size:32px}h2{margin:40px 0 12px}section{max-width:1500px} .pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}img{width:100%;border-radius:8px}figure{margin:0}figcaption{margin:8px 0;color:#adbbc5}a{color:#b6d5ec}@media(max-width:800px){.pair{grid-template-columns:1fr}}</style></head><body><h1>Refined rooms</h1><p>Concepts beside the second visual pass, all at 5 × 5 with matching in-game camera and zoom. Treasury shows 175 stored gold; Dormitory shows four assigned residents.</p><p>Weathered stone, perimeter bands, sculpted bedding, paneled shelving and inward-facing workstations. <a href="library-irregular.png">Irregular Library floor</a></p>${report.map((r, i) => `<section><h2>${names[i]}</h2><div class="pair"><figure><img src="../../concept-art/rooms/overhaul/${r.room}-v4.png"><figcaption>Concept</figcaption></figure><figure><img src="${r.room}.png"><figcaption>Refined in game · <a href="${r.room}-reverse.png">Reverse view</a>${existsSync(`${output}/pass-one/${r.room}.png`) ? ` · <a href="pass-one/${r.room}.png">First pass</a>` : ''}${['treasure', 'dormitory'].includes(r.room) ? ` · <a href="${r.room}-empty.png">Empty room</a>` : ''}</figcaption></figure></div></section>`).join('')}</body></html>`,
  );
} finally {
  await browser.close();
}
