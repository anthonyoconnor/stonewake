import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
const artifacts = 'test-results/m20';
mkdirSync(artifacts, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors = [];
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.strongholdDev?.version === 1);
  await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    window.uiBabylon = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
  });
  const state = () => page.evaluate(() => window.strongholdDev.state());
  const load = id => page.evaluate(id => window.strongholdDev.load(id), id);
  const advance = seconds => page.evaluate(seconds => window.strongholdDev.advance(seconds), seconds);
  const panel = name => page.getByRole('button', { name, exact: true }).click();
  const camera = () => page.evaluate(() => {
    const c = window.uiBabylon.EngineStore.LastCreatedScene.activeCamera;
    return { x: c.target.x, z: c.target.z, alpha: c.alpha, radius: c.radius };
  });
  const point = (x, z) => page.evaluate(({ x, z }) => {
    const { EngineStore, Vector3, Matrix } = window.uiBabylon, scene = EngineStore.LastCreatedScene, engine = scene.getEngine();
    const p = Vector3.Project(new Vector3(x, 0, z), Matrix.Identity(), scene.getTransformMatrix(), scene.activeCamera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
    const r = document.querySelector('#world').getBoundingClientRect();
    return { x: r.x + p.x * r.width / engine.getRenderWidth(), y: r.y + p.y * r.height / engine.getRenderHeight() };
  }, { x, z });
  const clickTile = async (x, z) => { const p = await point(x, z); await page.mouse.click(p.x, p.y); };
  const snap = async name => { await page.mouse.move(650, 500); await page.screenshot({ path: `${artifacts}/${name}.png` }); };
  let w;
  if(!process.argv.includes('--outcome-only')){
  await panel('Rooms');
  assert.equal(await page.locator('.categories [data-category="debug"],#open-lab,[data-room="guard"]').count(), 0);
  assert(await page.locator('footer [data-category="debug"]').isVisible());
  await snap('after');

  // Unavailable actions are readable using keyboard focus and cannot activate.
  await panel('Defenses');
  const unavailable = page.locator('[data-defense="spike-trap"]');
  assert(await unavailable.isDisabled()); await unavailable.focus();
  assert.match(await page.locator('#action-help').textContent(), /Workshop/);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#active-tool').textContent(), 'Excavate');
  const beforeCamera = await camera();
  await page.keyboard.down('w'); await page.waitForTimeout(150); await page.keyboard.up('w');
  await page.mouse.move(2, 450); await page.waitForTimeout(150);
  await page.mouse.wheel(0, 600); await page.waitForTimeout(100);
  assert.deepEqual(await camera(), beforeCamera, 'Focused/sidebar input does not move or zoom camera');

  // Build and reclaim using ordinary player icons and actual canvas gestures.
  await panel('Rooms');
  w = await state();
  const tile = w.tiles.find(t => t.known && t.claimed && t.terrain === 'floor' && !t.core && !t.room && !t.onward && Math.hypot(t.x - w.hearth.x, t.z - w.hearth.z) > 2 && Math.hypot(t.x - w.hearth.x, t.z - w.hearth.z) < 4);
  assert(tile); const spent = w.spent;
  await page.locator('[data-room="kitchen"]').click(); await clickTile(tile.x, tile.z);
  w = await state(); assert.equal(w.tiles[tile.z * w.width + tile.x].room, 'kitchen'); assert.equal(w.spent, spent + 20);
  await page.locator('[data-tool="sell"]').click(); await clickTile(tile.x, tile.z);
  w = await state(); assert.equal(w.tiles[tile.z * w.width + tile.x].room, undefined); assert.equal(w.spent, spent + 10);
  await page.locator('#cancel-tool').click(); assert.equal(await page.locator('#active-tool').textContent(), 'Excavate');
  await page.locator('[data-room="kitchen"]').click(); await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-room="kitchen"]').getAttribute('aria-pressed'), 'false');
  await page.locator('[data-room="kitchen"]').click(); await page.locator('.reserves').click({ button: 'right' });
  assert.equal(await page.locator('#active-tool').textContent(), 'Excavate');
  await page.locator('[data-room="kitchen"]').click();
  const beforeDrag = (await state()).revision, p = await point(tile.x, tile.z);
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(120, 440); await page.mouse.up();
  assert.equal((await state()).revision, beforeDrag, 'Releasing a world drag over sidebar cancels placement');
  await page.keyboard.press('Escape');

  // Maps preserve fog and close without leaking Escape into the active tool.
  const known = (await state()).tiles.filter(t => t.known).length;
  await page.locator('[data-room="kitchen"]').click(); await page.locator('#show-map').click();
  assert(await page.locator('#full-map-dialog').isVisible()); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#active-tool').textContent(), 'Kitchen');
  await page.locator('#show-map').click();
  const map = await page.locator('#full-map').boundingBox(); await page.mouse.click(map.x + map.width * .75, map.y + map.height * .25);
  assert(!(await page.locator('#full-map-dialog').isVisible()));
  assert.equal((await state()).tiles.filter(t => t.known).length, known);
  await page.getByRole('button', { name: 'Return to Hearthstone', exact: true }).click();

  // Workshop orders and placement use the same normal controls in a supplied fixture.
  await load('defenses'); await panel('Defenses');
  await page.locator('.production > summary').click();
  const orders = (await state()).craftOrders.length;
  await page.locator('[data-recipe="spike-trap"]').click();
  assert.equal((await state()).craftOrders.length, orders + 1);
  await page.locator('[data-defense="spike-trap"]').click(); await clickTile(13, 12);
  assert((await state()).defenses.some(d => d.x === 13 && d.z === 12));
  assert(await page.locator('[data-defense="spike-trap"]').isDisabled());
  assert(await page.locator('#fixture-status').isVisible(), 'Newly placed defense opens its inspector');
  await snap('defenses');

  // Research is discoverable on an unavailable icon, and casts target real residents.
  await load('research-interruption'); await panel('Spells');
  const researchSpell = 'mending-rune';
  await page.locator(`[data-spell="${researchSpell}"]`).focus();
  assert.match(await page.locator('#action-help').textContent(), /Not researched/);
  await page.locator(`[data-research="${researchSpell}"]`).click();
  assert((await state()).researchOrders.some(o => o.spell === researchSpell));
  await page.locator(`[data-pause-research="${researchSpell}"]`).click();
  assert((await state()).researchOrders.find(o => o.spell === researchSpell).paused);
  await page.locator(`[data-research="${researchSpell}"]`).click();
  assert(!(await state()).researchOrders.find(o => o.spell === researchSpell).paused);
  await load('spells'); await panel('Spells');
  await page.locator('[data-spell="dwarf-haste"]').click();
  let dwarf = (await state()).agents.find(a => a.type === 'warrior');
  await clickTile(dwarf.x, dwarf.z);
  w = await state(); dwarf = w.agents.find(a => a.id === dwarf.id);
  assert(dwarf.effects.some(e => e.id === 'dwarf-haste'));
  assert.equal(await page.locator('#active-tool').textContent(), 'Excavate');
  assert(await page.locator('#unit-inspection').isVisible());
  await page.locator('#close-inspection').click(); assert(!(await page.locator('#unit-inspection').isVisible()));
  await panel('Workforce'); await page.locator('[data-dwarf-role="warrior"]').click();
  await page.locator('.resident-row summary').first().click(); await page.locator('[data-locate-dwarf]').first().click();
  assert(await page.locator('#unit-inspection').isVisible()); await snap('residents');

  // Notification actions, history and overflow are covered by notifications-browser.mjs.

  // At small desktop viewports the fixed essentials remain onscreen and panel actions scroll into view.
  for (const viewport of [{ width: 1024, height: 768 }, { width: 800, height: 600 }]) {
    await page.setViewportSize(viewport); await load('stronghold');
    for (const category of ['Rooms', 'Defenses', 'Spells', 'Workforce', 'Help', 'Debug']) {
      await panel(category);
      const layout = await page.evaluate(() => {
        const side = document.querySelector('#sidebar'), panel = document.querySelector('#panel');
        const controls = [document.querySelector('.categories'), document.querySelector('.camera-tools'), document.querySelector('footer'), document.querySelector('#open-hearth')];
        return { overflow: panel.scrollWidth > panel.clientWidth, panelHeight: panel.clientHeight, reachable: controls.every(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }) };
      });
      assert(!layout.overflow && layout.reachable && layout.panelHeight >= 90, `${category} ${JSON.stringify(viewport)} ${JSON.stringify(layout)}`);
      const final = page.locator('#panel button:visible').last();
      if (await final.count()) { await final.scrollIntoViewIfNeeded(); assert(await final.isVisible()); }
    }
    await panel('Rooms'); await snap(`compact-${viewport.width}`);
  }
  }
  // A real failed defense keeps both the result and post-result unit inspection usable.
  await page.setViewportSize({width:800,height:600});
  await load('hearth-defeat');
  await page.evaluate(() => window.strongholdDev.command({ kind: 'dig', points: [{ x: 12, z: 12 }] }));
  let warned = false;
  for(let i=0;i<24 && !(await state()).outcome;i++){
    await advance(10);
    if(await page.locator('.notification-entry[data-key=hearth]').count()){
      warned = true;
      await page.locator('.notification-entry[data-key=hearth] .notification-open').click();
      assert((await page.locator('#notification-text').textContent()).includes('under attack'));
      await page.locator('#notification-dismiss').click();
    }
  }
  w = await state(); assert.equal(w.outcome, 'defeat'); assert(warned, 'Real Hearth damage produces a priority message');
  await panel('Workforce');
  const enemy = w.enemies.find(e => e.health > 0 && w.tiles[Math.round(e.z)*w.width+Math.round(e.x)]?.known);
  assert(enemy); await page.getByRole('button', {name:'Return to Hearthstone',exact:true}).click(); await clickTile(enemy.x,enemy.z);
  assert(await page.locator('#unit-inspection').isVisible());
  await snap('compact-result-inspection');
  const resultLayout = await page.evaluate(() => ({ panel:document.querySelector('#panel').clientHeight, footerBottom:document.querySelector('#sidebar>footer').getBoundingClientRect().bottom, height:innerHeight }));
  assert(resultLayout.panel >= 75 && resultLayout.footerBottom <= resultLayout.height, JSON.stringify(resultLayout));
  await page.locator('#restart-area').click(); assert.equal((await state()).outcome, undefined);
  assert.deepEqual(errors, []);
  console.log(process.argv.includes('--outcome-only')?'PASS M20 focused: real Hearth attack priority warning, defeat, post-result unit inspection and restart at 800×600.':'PASS M20: keyboard/disabled explanations, canvas build/reclaim/cancel, drag isolation, maps/fog, production/placement, research/cast, inspection, warnings/history, 1440/1024/800 desktop sizing and compact defeat/inspection/restart. Campaign travel covered by campaign-browser.');
} finally { await browser.close(); }
