import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined) });
const folder = 'test-results/m30'; mkdirSync(folder, { recursive: true });
const report = { samples: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(60000);
  page.on('pageerror', e => report.errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=showcase&paused=1`);
  await page.locator('#loading-screen').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const { GameScene } = await import(performance.getEntriesByType('resource').find(e => /\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name)).name);
    const render = GameScene.prototype.render; GameScene.prototype.render = function () { window.audioView = this; return render.call(this); };
  });
  await page.waitForFunction(() => window.audioView);
  assert.equal(await page.evaluate(() => window.audioView.audio.status.state), 'locked');
  await page.locator('#sound-settings').click();
  await page.waitForFunction(() => window.audioView.audio.status.state === 'running');
  await page.locator('[data-audio="master"]').fill('41');
  await page.locator('[data-audio="music"]').fill('23');
  await page.locator('[data-audio="effects"]').fill('57');
  await page.locator('[data-audio="muted"]').check();
  await page.waitForTimeout(180);
  const muted = await page.evaluate(() => window.audioView.audio.master.gain.value); assert(muted < 0.002);
  await page.locator('[data-audio="muted"]').uncheck();
  await page.locator('#close-audio').click();
  await page.evaluate(() => window.strongholdDev.pause(false));
  await page.waitForFunction(() => window.audioView.audio.status.beds === 2);
  await page.evaluate(() => {
    const a = window.audioView.audio, destination = a.context.createMediaStreamDestination(); a.master.connect(destination);
    window.recording = { chunks: [], destination }; const recorder = new MediaRecorder(destination.stream);
    window.recording.recorder = recorder; recorder.ondataavailable = e => { if (e.data.size) window.recording.chunks.push(e.data); }; recorder.start();
  });
  await page.waitForTimeout(6500);
  const working = await page.evaluate(() => window.audioView.audio.status); report.samples.push({ scene: 'crowded work', ...working });
  assert(working.played > 0); assert(working.voices <= 12); assert.equal(working.beds, 2);
  await page.evaluate(() => window.strongholdDev.pause());
  await page.waitForFunction(() => window.audioView.audio.status.voices === 0 && window.audioView.audio.status.beds === 0);
  await page.evaluate(() => window.strongholdDev.load('combat')); await page.evaluate(() => window.strongholdDev.pause(false));
  await page.waitForTimeout(8500); report.samples.push({ scene: 'combat', ...await page.evaluate(() => window.audioView.audio.status) });
  const bytes = await page.evaluate(async () => {
    const r = window.recording; await new Promise(resolve => { r.recorder.onstop = resolve; r.recorder.stop(); });
    return Array.from(new Uint8Array(await new Blob(r.chunks, { type: 'audio/webm' }).arrayBuffer()));
  });
  writeFileSync(`${folder}/work-combat.webm`, Buffer.from(bytes));
  for (let i = 0; i < 3; i++) { await page.evaluate(() => window.strongholdDev.load('showcase')); await page.evaluate(() => window.strongholdDev.pause(false)); await page.waitForTimeout(200); }
  const restarted = await page.evaluate(() => window.audioView.audio.status); assert.equal(restarted.beds, 2); assert(restarted.voices <= 12);
  await page.locator('#sound-settings').click();
  await page.waitForFunction(() => window.audioView.audio.status.beds === 0);
  assert.equal(await page.locator('[data-audio="master"]').inputValue(), '41');
  await page.setViewportSize({ width: 800, height: 600 }); await page.screenshot({ path: `${folder}/settings-compact.png` });
  const fitting = await page.locator('.audio-dialog').evaluate(d => d.getBoundingClientRect().bottom <= innerHeight); assert(fitting);
  await page.locator('#close-audio').click();
  await page.evaluate(() => window.strongholdDev.pause());
  assert.deepEqual(report.errors, []); writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally { await browser.close(); }
