import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const folder = 'test-results/resources';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
const report = { checks: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.version === 1, { timeout: 90000 });
  await page.evaluate(async () => {
    const source = await (await fetch('/src/view/scene.ts')).text();
    window.resourceBabylon = await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
  });
  const capture = async (name, x, z, radius, alpha = -Math.PI / 4) => {
    await page.evaluate(
      ({ x, z, radius, alpha }) => {
        const camera = window.resourceBabylon.EngineStore.LastCreatedScene.activeCamera;
        camera.target.set(x, 0, z);
        camera.radius = radius;
        camera.alpha = alpha;
        camera.beta = 0.62;
      },
      { x, z, radius, alpha },
    );
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${folder}/${name}.png` });
  };
  await capture('stronghold', 23, 24, 22);
  await capture('gold-close', 23, 19, 10, Math.PI / 4);
  await capture('gold-reverse', 23, 19, 10, (3 * Math.PI) / 4);
  const before = await page.evaluate(() => window.strongholdDev.state());
  const hiddenGold = before.tiles.filter((t) => !t.known && t.terrain === 'gold');
  const hiddenGems = before.tiles.filter((t) => !t.known && t.terrain === 'gem');
  assert(hiddenGold.length && hiddenGems.length, 'Real level includes distant hidden resources');
  await page.keyboard.press('KeyM');
  await page.waitForSelector('#full-map-dialog[open]');
  const pixels = await page.evaluate(() => {
    const w = window.strongholdDev.state();
    return ['minimap', 'full-map'].map((id) => {
      const canvas = document.getElementById(id),
        c = canvas.getContext('2d');
      return {
        id,
        tiles: w.tiles
          .filter((t) => !t.known)
          .map((t) => ({
            terrain: t.terrain,
            color: [
              ...c.getImageData(
                Math.floor(((t.x + 0.5) * canvas.width) / w.width),
                Math.floor(((t.z + 0.5) * canvas.height) / w.height),
                1,
                1,
              ).data,
            ].slice(0, 3),
          })),
      };
    });
  });
  for (const map of pixels)
    for (const tile of map.tiles) {
      const expected =
        tile.terrain === 'gold' ? [219, 169, 73] : tile.terrain === 'gem' ? [133, 122, 185] : [12, 19, 25];
      assert.deepEqual(tile.color, expected, `${map.id}: hidden ${tile.terrain}`);
    }
  report.checks.push(
    'Every hidden gold/gem cell appears on both maps; all other unexplored terrain stays dark',
  );
  await page.screenshot({ path: `${folder}/full-map.png` });
  const rect = await page.locator('#full-map').boundingBox(),
    gem = hiddenGems[0];
  await page.mouse.click(
    rect.x + ((gem.x + 0.5) / before.width) * rect.width,
    rect.y + ((gem.z + 0.5) / before.height) * rect.height,
  );
  assert.equal(await page.locator('#full-map-dialog').isVisible(), false);
  const after = await page.evaluate(() => window.strongholdDev.state());
  assert.deepEqual(
    after.tiles.map((t) => t.known),
    before.tiles.map((t) => t.known),
  );
  assert.deepEqual(after.enemies, before.enemies);
  report.checks.push('Clicking a distant deposit navigates without discovery or enemy activation');
  // Exercise resource depletion through the actual shared map renderer, on an isolated snapshot.
  const depletion = await page.evaluate(async () => {
    const { drawMap } = await import('/src/ui/map.ts');
    const w = window.strongholdDev.state(),
      gold = w.tiles.find((t) => !t.known && t.terrain === 'gold');
    const canvas = document.createElement('canvas');
    canvas.width = w.width * 8;
    canvas.height = w.height * 8;
    const color = () =>
      [...canvas.getContext('2d').getImageData(gold.x * 8 + 4, gold.z * 8 + 4, 1, 1).data].slice(0, 3);
    drawMap(canvas, w);
    const before = color();
    gold.terrain = 'floor';
    gold.gold = 0;
    gold.known = true;
    drawMap(canvas, w);
    return { before, after: color() };
  });
  assert.deepEqual(depletion.before, [219, 169, 73]);
  assert.deepEqual(depletion.after, [139, 128, 103]);
  report.checks.push('Exhausted gold changes to floor on redraw instead of retaining a deposit marker');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
