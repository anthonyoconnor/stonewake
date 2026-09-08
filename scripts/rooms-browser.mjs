import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${url}/?scenario=room-lab&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'room-lab');
  await page.evaluate(() => {
    const api = window.strongholdDev;
    for (const [room, x] of [['kitchen', 8], ['dormitory', 9], ['training', 10]])
      api.command({ kind: 'build', room, points: [{ x, z: 16 }] });
    api.command({ kind: 'spawn', type: 'miner', count: 1 });
    api.command({ kind: 'needs', id: api.state().agents[0].id, hunger: .1, energy: .1 });
  });
  let state = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(state.furnishings.filter(f => f.id !== 'hearth-treasury').length, 0);
  assert.deepEqual(state.roomServices.filter(s => s.id !== 'hearth-treasury').map(s => s.capacity), [1, 1, 1]);
  await page.getByRole('button', { name: 'Rooms', exact: true }).click();
  await page.getByLabel('Room catalog').selectOption('kitchen');
  await page.waitForFunction(() => document.querySelector('#room-summary')?.textContent.includes('1 square · 1 food support'));
  assert((await page.locator('#room-summary').textContent()).includes('Supports 1 dwarf'));
  await page.getByLabel('Room catalog').selectOption('training');
  await page.waitForFunction(() => document.querySelector('#room-summary')?.textContent.includes('1 square · 1 training capacity'));
  assert((await page.locator('#room-summary').textContent()).includes('one level per visit'));
  // Find the first completed visit through actual scheduling, travel, eating and rest.
  for (let i = 0; i < 20 && !(state.agents[0].trainingLevel > 0); i++) {
    await page.evaluate(() => window.strongholdDev.advance(5));
    state = await page.evaluate(() => window.strongholdDev.state());
  }
  const dwarf = state.agents[0];
  assert(dwarf.meals >= 1 && dwarf.rested >= 1, 'Unfurnished single tiles provide meals and rest');
  assert.equal(dwarf.trainingLevel, 1, 'The first training visit gains one level');
  assert.notEqual(dwarf.job?.kind, 'train', 'Training slot releases after gaining a level');
  assert(dwarf.nextTrainingAt > state.elapsed, 'Completed training starts a personal cooldown');
  await page.getByRole('button', { name: 'Dwarfs', exact: true }).click();
  assert((await page.locator('#residents-list').textContent()).includes('Training cooldown'));
  const remaining = dwarf.nextTrainingAt - state.elapsed;
  await page.evaluate(seconds => window.strongholdDev.advance(seconds), Math.max(.05, remaining - 1));
  state = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(state.agents[0].trainingLevel, 1);
  assert.notEqual(state.agents[0].job?.kind, 'train');
  for (let i = 0; i < 15 && state.agents[0].trainingLevel < 2; i++) {
    await page.evaluate(() => window.strongholdDev.advance(5));
    state = await page.evaluate(() => window.strongholdDev.state());
  }
  assert.equal(state.agents[0].trainingLevel, 2, 'Training resumes after the cooldown');
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/rooms-single-tile.png' });

  // The numeric editor changes area capacity directly, with no required decoration.
  await page.getByRole('button', { name: 'Debug', exact: true }).click();
  await page.getByRole('button', { name: 'Game configuration', exact: true }).click();
  await page.getByRole('tab', { name: 'Rooms', exact: true }).click();
  await page.getByLabel('Kitchen · dwarfs supported/square', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Apply changes', exact: true }).click();
  state = await page.evaluate(() => window.strongholdDev.state());
  assert.equal(state.roomServices.filter(s => s.service === 'dining').reduce((sum, s) => sum + s.capacity, 0), 2);
  assert.equal(state.furnishings.filter(f => f.room === 'kitchen').length, 0);
  await page.getByRole('button', { name: 'Rooms', exact: true }).click();
  await page.getByLabel('Room catalog').selectOption('kitchen');
  await page.waitForFunction(() => document.querySelector('#room-summary')?.textContent.includes('1 square · 2 food support'));
  await page.locator('#room-summary').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/rooms-capacity-config.png' });

  await page.evaluate(() => window.strongholdDev.load('showcase'));
  await page.getByRole('button', { name: 'Rooms', exact: true }).click();
  await page.getByLabel('Room catalog').selectOption('training');
  await page.evaluate(() => window.strongholdDev.advance(20));
  await page.locator('#room-summary').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/rooms-showcase.png' });
  await page.mouse.move(950, 500);
  await page.keyboard.down('q');
  await page.waitForTimeout(550);
  await page.keyboard.up('q');
  await page.screenshot({ path: 'test-results/rooms-showcase-rotated.png' });
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors), []);
  assert.deepEqual(errors, [], 'Browser console and runtime errors');
  console.log('PASS: unfurnished single-tile Kitchen, Dormitory and Training Room; real needs and training cooldown; sidebar capacity; live capacity settings; showcase rendering.');
} finally {
  await browser.close();
}
