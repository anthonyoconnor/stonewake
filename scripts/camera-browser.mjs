import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
async function check() {
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    if (process.argv.includes('--reproduce')) {
      await page.route('**/src/view/controls.ts', async (route) => {
        const response = await route.fetch();
        const body = (await response.text()).replace(
          'e.target === canvas || leftEdge',
          'e.target === canvas',
        );
        await route.fulfill({ response, body });
      });
    }
    await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
    await page.waitForFunction(() => window.strongholdDev?.version === 1);
    await page.evaluate(async () => {
      const source = await (await fetch('/src/view/scene.ts')).text();
      window.cameraBabylon = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    });
    const camera = () =>
      page.evaluate(() => {
        const c = window.cameraBabylon.EngineStore.LastCreatedScene.activeCamera;
        return { x: c.target.x, z: c.target.z, alpha: c.alpha, radius: c.radius };
      });
    const reset = async (alpha) => {
      await page.mouse.move(500, 350);
      await page.evaluate((alpha) => {
        const c = window.cameraBabylon.EngineStore.LastCreatedScene.activeCamera;
        c.target.set(20, 0, 20);
        c.alpha = alpha;
      }, alpha);
    };
    const stationary = async (label) => {
      const before = await camera();
      await page.waitForTimeout(220);
      assert.deepEqual(await camera(), before, label);
    };
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 800, height: 600 },
    ]) {
      await page.setViewportSize(viewport);
      for (const alpha of [-Math.PI / 2, -0.4]) {
        for (const [name, x, y, right, forward] of [
          ['left', 1, viewport.height / 2, -1, 0],
          ['right', viewport.width - 1, viewport.height / 2, 1, 0],
          ['top', viewport.width * 0.7, 1, 0, 1],
          ['bottom', viewport.width * 0.7, viewport.height - 1, 0, -1],
        ]) {
          await reset(alpha);
          const before = await camera();
          await page.mouse.move(x, y);
          await page.waitForTimeout(300);
          const after = await camera();
          const dx = after.x - before.x,
            dz = after.z - before.z;
          if (process.argv.includes('--reproduce') && name === 'left') {
            assert.equal(Math.hypot(dx, dz), 0);
            console.log('REPRODUCED: canvas-only pointer filtering prevents left-edge pan over sidebar.');
            process.exitCode = 0;
            return;
          }
          const expectedX = -Math.sin(alpha) * right - Math.cos(alpha) * forward;
          const expectedZ = Math.cos(alpha) * right - Math.sin(alpha) * forward;
          assert(
            dx * expectedX + dz * expectedZ > 0.2,
            `${name}: ${JSON.stringify({ viewport, alpha, dx, dz })}`,
          );
          assert(Math.abs(dx * expectedZ - dz * expectedX) < 0.001, `${name}: view-relative direction`);
          assert.equal(after.alpha, before.alpha);
          assert.equal(after.radius, before.radius);
          await page.mouse.move(120, viewport.height / 2);
          await stationary('Moving off edge stops');
        }
      }
      const sidebar = await page.locator('#sidebar').boundingBox();
      await page.mouse.move(sidebar.width - 1, viewport.height / 2);
      await stationary('Internal sidebar boundary does not pan');
      await page.getByRole('button', { name: 'Rooms', exact: true }).click();
      await stationary('Normal sidebar click');
      const beforeWheel = await camera();
      await page.mouse.wheel(0, 350);
      await stationary('Sidebar scrolling');
      assert.deepEqual(await camera(), beforeWheel);
      for (const stop of ['pointerleave', 'blur']) {
        await page.mouse.move(1, viewport.height / 2);
        await page.evaluate(
          (stop) =>
            stop === 'blur'
              ? window.dispatchEvent(new Event('blur'))
              : document.dispatchEvent(new PointerEvent('pointerleave')),
          stop,
        );
        await stationary(stop);
      }
      await page.locator('#show-map').click();
      await page.mouse.move(1, viewport.height / 2);
      await stationary('Full map suppresses edges');
      await page.keyboard.press('Escape');
    }
    mkdirSync('test-results/m34', { recursive: true });
    await page.screenshot({ path: 'test-results/m34/compact.png' });
    assert.deepEqual(errors, []);
    console.log(
      'PASS camera: all four viewport edges, sidebar overlap, rotated/compact views, stop, sidebar input, leave/blur and full map.',
    );
  } finally {
    await browser.close();
  }
}
await check();
