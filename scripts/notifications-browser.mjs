import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
mkdirSync('test-results/notifications', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=cave-hounds&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'cave-hounds');
  await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    window.notificationBabylon = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
  });
  const state = () => page.evaluate(() => window.strongholdDev.state());
  const advance = (s) => page.evaluate((s) => window.strongholdDev.advance(s), s);
  const load = (id) => page.evaluate((id) => window.strongholdDev.load(id), id);
  const entry = (key) => page.locator(`.notification-entry[data-key="${key}"]`);
  const open = async (key) => {
    await entry(key).locator('.notification-open').click();
    await page.locator('#notification-card').waitFor({ state: 'visible' });
  };
  const camera = () =>
    page.evaluate(() => {
      const c = window.notificationBabylon.EngineStore.LastCreatedScene.activeCamera;
      return { x: c.target.x, z: c.target.z, alpha: c.alpha, radius: c.radius };
    });
  const screenshot = async (name) => {
    await page.mouse.move(850, 450);
    await page.screenshot({ path: `test-results/notifications/${name}.png` });
  };
  const start = await camera();
  await advance(31);
  await entry('arrival:cave-hound').waitFor();
  assert(!(await page.locator('#notification-card').isVisible()), 'New icons do not force a card open');
  assert.deepEqual(await camera(), start, 'An arrival never steals the camera');
  await open('arrival:cave-hound');
  assert.match(await page.locator('#notification-text').textContent(), /first Cave Hound/);
  await screenshot('arrival');
  const dog = (await state()).agents[0];
  await page.locator('#notification-locate').click();
  const located = await camera();
  assert(Math.hypot(located.x - dog.x, located.z - dog.z) < 0.01);
  assert(await page.locator('#unit-inspection').isVisible());
  await entry('arrival:cave-hound').locator('.notification-open').focus();
  await page.keyboard.press('Delete');
  assert.equal(await entry('arrival:cave-hound').count(), 0);
  await advance(94);
  assert.equal(await entry('arrival:cave-hound').count(), 0, 'Later hounds do not repeat the introduction');
  await open('dormitory');
  assert.match(await page.locator('#notification-text').textContent(), /Expand/);
  await screenshot('dormitory');
  await page.locator('#notification-dismiss').click();
  await advance(2);
  assert.equal(await entry('dormitory').count(), 0);
  await page.locator('#notification-history').click();
  await page.locator('.history-report[data-key="dormitory"]').click();
  await page.locator('#notification-action').click();
  assert.match(await page.locator('#active-tool').textContent(), /Dormitory/);
  await page.evaluate(() =>
    window.strongholdDev.command({ kind: 'build', room: 'dormitory', points: [{ x: 3, z: 13 }] }),
  );
  await advance(32);
  await entry('dormitory').waitFor();

  // Actual attacks, with a stable grouped icon during repeated hits.
  await load('cave-hounds');
  await advance(31);
  await page.evaluate(() => {
    const api = window.strongholdDev;
    api.command({ kind: 'arrivals', enabled: false });
    const w = api.state(),
      dog = w.agents[0];
    const p = w.tiles.find(
      (t) =>
        t.known &&
        t.terrain === 'floor' &&
        !t.core &&
        Math.hypot(t.x - dog.x, t.z - dog.z) >= 1 &&
        Math.hypot(t.x - dog.x, t.z - dog.z) < 2,
    );
    api.command({ kind: 'enemy', type: 'goblin-raider', spawn: { x: p.x, z: p.z }, target: w.hearth });
  });
  for (let i = 0; i < 20 && !(await entry('combat').count()); i++) await advance(0.5);
  await open('combat');
  assert(await page.locator('#notification-locate').isEnabled());
  await screenshot('combat');
  await page.locator('#notification-locate').click();
  assert(await page.locator('#unit-inspection').isVisible());
  await entry('combat').locator('.notification-open').click({ button: 'right' });
  await advance(1);
  assert.equal(await entry('combat').count(), 0);

  // Unknown origins remain unknown, even though a warning can be heard.
  await load('encounters');
  await advance(13);
  const known = (await state()).tiles.filter((t) => t.known).length;
  await open('encounter:deep-entrance');
  assert.equal(await page.locator('#notification-title').textContent(), 'Underground raid');
  assert(await page.locator('#notification-locate').isDisabled());
  assert.match(await page.locator('#notification-source-status').textContent(), /not been discovered/);
  assert.equal((await state()).tiles.filter((t) => t.known).length, known);
  await page.locator('#close-notification').click();

  // Real Hearth damage raises an urgent icon; defeat resolves the active rail.
  await load('hearth-defeat');
  await page.evaluate(() => window.strongholdDev.command({ kind: 'dig', points: [{ x: 12, z: 12 }] }));
  let hearthWarned = false;
  for (let i = 0; i < 24 && !(await state()).outcome; i++) {
    await advance(10);
    if (await entry('hearth').count()) {
      hearthWarned = true;
      await open('hearth');
      assert.match(await page.locator('#notification-text').textContent(), /under attack/);
      await page.locator('#notification-dismiss').click();
    }
  }
  assert(hearthWarned);
  assert.equal((await state()).outcome, 'defeat');
  assert.equal(await page.locator('.notification-entry').count(), 0);
  await load('encounters');

  // A content-only extension exercises overflow, generic actions and compact sizing.
  await page.evaluate(async () => {
    // Use the module URL Vite actually loaded, including its hot-update timestamp.
    const url = performance
      .getEntriesByType('resource')
      .map((r) => r.name)
      .find((n) => /\/src\/content\/notifications\.ts(?:\?|$)/.test(n));
    window.notificationContent = await import(url);
    const { notificationSources } = window.notificationContent;
    notificationSources.push({
      id: 'browser-extension',
      collect: (w) =>
        Array.from({ length: 12 }, (_, i) => ({
          key: `extension:${i}`,
          category: 'Test',
          icon: 'library',
          title: `New content ${i}`,
          message: 'This notification is supplied entirely by a content definition.',
          priority: 'info',
          sources: [{ kind: 'point', point: { ...w.hearth } }],
          action: { kind: 'panel', value: 'spells', label: 'Open spells' },
        })),
    });
  });
  try {
    await entry('extension:11').waitFor();
  } catch (error) {
    console.log(
      await page.evaluate(async () => ({
        status: window.strongholdDev.status(),
        outcome: window.strongholdDev.state().outcome,
        sources: window.notificationContent.notificationSources.map((s) => s.id),
        imports: performance
          .getEntriesByType('resource')
          .map((r) => r.name)
          .filter((n) => n.includes('notifications')),
        entries: [...document.querySelectorAll('.notification-entry')].map((e) => e.dataset.key),
      })),
      errors,
    );
    await screenshot('failure');
    throw error;
  }
  assert(await page.locator('.notification-list').evaluate((e) => e.scrollHeight > e.clientHeight));
  // Pointer capture from a world drag must not place room tiles under the card.
  await page.getByRole('button', { name: 'Rooms', exact: true }).click();
  await page.locator('#lab-room').selectOption('kitchen');
  await open('extension:0');
  const dragStart = await page.evaluate(() => {
    const w = window.strongholdDev.state(),
      { EngineStore, Vector3, Matrix } = window.notificationBabylon;
    const scene = EngineStore.LastCreatedScene,
      engine = scene.getEngine(),
      canvas = document.querySelector('#world').getBoundingClientRect();
    for (const t of w.tiles.filter(
      (t) => t.known && t.claimed && t.terrain === 'floor' && !t.core && !t.room,
    )) {
      const p = Vector3.Project(
        new Vector3(t.x, 0, t.z),
        Matrix.Identity(),
        scene.getTransformMatrix(),
        scene.activeCamera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
      );
      const x = canvas.x + (p.x * canvas.width) / engine.getRenderWidth(),
        y = canvas.y + (p.y * canvas.height) / engine.getRenderHeight();
      if (document.elementFromPoint(x, y)?.id === 'world') return { x, y };
    }
  });
  assert(dragStart);
  const beforeDrag = await state(),
    cardBox = await page.locator('#notification-card').boundingBox();
  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.down();
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.up();
  const afterDrag = await state();
  assert.equal(afterDrag.spent, beforeDrag.spent);
  assert.deepEqual(
    afterDrag.tiles,
    beforeDrag.tiles,
    'Releasing on notification UI cancels the captured world drag',
  );
  await page.locator('#close-notification').click();
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 800, height: 600 },
  ]) {
    await page.setViewportSize(viewport);
    await open('extension:0');
    const geometry = await page.evaluate(() => {
      const box = (s) => {
        const r = document.querySelector(s).getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      return {
        sidebar: box('#sidebar'),
        rail: box('#notification-rail'),
        card: box('#notification-card'),
        footer: box('#sidebar>footer'),
      };
    });
    assert(Math.abs(geometry.rail.left - geometry.sidebar.right) <= 3);
    assert(
      geometry.card.right <= viewport.width &&
        geometry.card.top >= 0 &&
        geometry.card.bottom <= viewport.height,
    );
    assert(geometry.rail.top >= 0 && geometry.footer.bottom <= viewport.height);
    await screenshot(`compact-${viewport.width}`);
    const before = await camera();
    await page.locator('#notification-locate').focus();
    await page.keyboard.down('w');
    await page.waitForTimeout(120);
    await page.keyboard.up('w');
    await page.locator('#notification-text').hover();
    await page.mouse.wheel(0, 200);
    assert.deepEqual(await camera(), before, 'Overlay focus and wheel input do not drive the world');
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#notification-card').isVisible()));
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await entry('extension:0').evaluate((e) => getComputedStyle(e).animationName), 'none');
  await open('extension:0');
  await page.locator('#notification-action').click();
  assert.equal(await page.locator('#panel').getAttribute('aria-label'), 'Spells');
  await load('stronghold');
  assert.equal(await entry('arrival:cave-hound').count(), 0, 'World switches discard the old rail');
  assert(!(await page.locator('#notification-card').isVisible()));
  assert.deepEqual(errors, []);
  console.log(
    'PASS notifications: real arrivals/combat/Hearth defeat, dismissal/history/build action, hidden origins, content extension, scroll overflow, three window sizes, keyboard/wheel/drag isolation, reduced motion and world reset.',
  );
} finally {
  await browser.close();
}
