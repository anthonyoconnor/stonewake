import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { characterDefinitions } from '../src/content/characters.ts';

const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${url}/?scenario=stronghold&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'stronghold');
  const residents = () => page.evaluate(() => window.strongholdDev.state().agents);
  const configure = async groups => {
    await page.getByRole('button', { name: 'Debug', exact: true }).click();
    await page.getByRole('button', { name: 'Game configuration', exact: true }).click();
    for (const [group, values] of Object.entries(groups)) {
      await page.getByRole('tab', { name: group, exact: true }).click();
      for (const [label, value] of Object.entries(values)) await page.getByLabel(label, { exact: true }).fill(String(value));
    }
    await page.getByRole('button', { name: 'Apply changes', exact: true }).click();
  };

  // Apply a level-health edit while another stronghold is retained in memory.
  await page.evaluate(() => {
    const api = window.strongholdDev;
    api.load('room-lab');
    api.command({ kind: 'spawn', type: 'miner' });
    const a = api.state().agents[0];
    api.command({ kind: 'raider', spawn: { x: a.x, z: a.z }, target: { x: a.x, z: a.z } });
  });
  let [injured] = await residents();
  for (let i = 0; i < 20 && injured.health === injured.maxHealth; i++) {
    await page.evaluate(() => window.strongholdDev.advance(.1));
    [injured] = await residents();
  }
  assert(injured.health > 0 && injured.health < injured.maxHealth, 'Actual enemy attack creates a surviving injured dwarf');
  const missingHealth = injured.maxHealth - injured.health;
  await configure({ 'Miner levels': { 'Miner · level 1 · maximum health': 120 } });
  const [updated] = await residents();
  assert.equal(updated.maxHealth, 120);
  assert.equal(updated.health, 120 - missingHealth, 'Applying stats preserves the current injury');
  await page.getByRole('button', { name: 'Rooms', exact: true }).click();
  await page.getByRole('button', { name: 'Return to stronghold', exact: true }).click();
  assert((await residents()).every(a => a.level === 1 && a.maxHealth === 120 && a.health === 120), 'Retained stronghold residents use the edited health when returning');

  await page.evaluate(types => {
    const api = window.strongholdDev;
    api.load('room-lab');
    for (const [room, x] of [['training', 8], ['kitchen', 10], ['dormitory', 12]])
      api.command({ kind: 'build', room, points: [{ x, z: 16 }, { x: x + 1, z: 16 }, { x, z: 17 }, { x: x + 1, z: 17 }] });
    for (const type of types) api.command({ kind: 'spawn', type });
  }, characterDefinitions.map(c => c.id));
  const shortTraining = { 'Training & research': { 'Cooldown after gaining a training level · seconds': 4 } };
  for (const c of characterDefinitions)
    shortTraining[`${c.name} levels`] = Object.fromEntries(c.levels.filter(level => level.level > 1).map(level => [`${c.name} · level ${level.level} · training seconds to enter`, 2]));
  await configure(shortTraining);
  await page.getByRole('button', { name: 'Workforce', exact: true }).click();
  let agents = await residents();
  assert(agents.every(a => a.level === 1), 'Every type begins at level 1');
  const seen = new Map(agents.map(a => [a.id, new Set([1])]));
  for (let i = 0; i < 90 && agents.some(a => a.level < 5); i++) {
    const previous = new Map(agents.map(a => [a.id, a]));
    await page.evaluate(() => window.strongholdDev.advance(1));
    agents = await residents();
    const elapsed = await page.evaluate(() => window.strongholdDev.status().elapsed);
    for (const a of agents) {
      seen.get(a.id).add(a.level);
      const row = characterDefinitions.find(c => c.id === a.type).levels[a.level - 1];
      const expectedHealth = a.type === 'miner' && a.level === 1 ? 120 : row.health;
      assert.equal(a.maxHealth, expectedHealth);
      await page.locator(`[data-dwarf-role="${a.type}"]`).click();
      const text = await page.locator(`[data-resident="${a.id}"]`).textContent();
      assert(text.includes(`Level ${a.level} / 5`));
      assert(text.includes(`Wage ${row.wage} gold`), 'Displayed wage follows the reached level');
      assert(text.includes(`Base damage ${row.damage} · Interval ${row.attackSeconds}s`));
      assert(text.includes(`Base work ${Math.round((row.workMultiplier - 1) * 100)}% bonus`));
      if (a.level > previous.get(a.id).level) {
        assert.equal(a.level, previous.get(a.id).level + 1);
        assert(a.nextTrainingAt > elapsed, 'Every gained level starts cooldown');
        assert.notEqual(a.job?.kind, 'train', 'A gained level releases training capacity');
      } else if (previous.get(a.id).nextTrainingAt > elapsed) {
        assert.notEqual(a.job?.kind, 'train', 'Cooldown prevents retraining');
      }
    }
  }
  assert(agents.every(a => a.level === 5), 'All four types reach level 5 through training');
  assert([...seen.values()].every(levels => levels.size === 5), 'Observed all five levels for every type');
  await page.evaluate(() => window.strongholdDev.advance(15));
  assert((await residents()).every(a => a.level === 5 && a.job?.kind !== 'train'));
  for (const a of agents) {
    await page.locator(`[data-dwarf-role="${a.type}"]`).click();
    assert.equal(await page.getByText('Maximum level reached', { exact: false }).count(), 1);
  }
  mkdirSync('test-results', { recursive: true });
  const warrior = agents.find(a => a.type === 'warrior');
  await page.locator('[data-dwarf-role="warrior"]').click();
  await page.locator(`[data-resident="${warrior.id}"]`).evaluate(element => { element.open = true; });
  await page.locator(`[data-resident="${warrior.id}"]`).evaluate(element => element.scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: 'test-results/character-levels-cap.png' });

  await configure({ 'Warrior levels': { 'Warrior · level 5 · maximum health': 300, 'Warrior · level 5 · attack damage': 30, 'Warrior · level 5 · attack interval seconds': .8, 'Warrior · level 5 · work speed multiplier': 1.25 } });
  assert.equal((await residents()).find(a => a.id === warrior.id).maxHealth, 300);
  await page.getByRole('button', { name: 'Workforce', exact: true }).click();
  await page.locator('[data-dwarf-role="warrior"]').click();
  const row = page.locator(`[data-resident="${warrior.id}"]`);
  await row.evaluate(element => { element.open = true; });
  await row.evaluate(element => element.scrollIntoView({ block: 'center' }));
  assert((await row.textContent()).includes('Base damage 30 · Interval 0.8s'));
  assert((await row.textContent()).includes('Base work 25% bonus'));
  await page.screenshot({ path: 'test-results/character-levels-configured.png' });

  // Shared XP advances through real combat, without a Training Room.
  await page.evaluate(() => window.strongholdDev.load('spells'));
  await configure({ 'Warrior levels': { 'Warrior · level 2 · training seconds to enter': 6, 'Warrior · level 3 · training seconds to enter': 30 }, 'Training & research': { 'Cooldown after gaining a training level · seconds': 45 } });
  await page.evaluate(() => {
    const api=window.strongholdDev,a=api.state().agents.find(a=>a.type==='warrior');
    api.command({kind:'cast',spell:'stoneguard',target:{kind:'dwarf',id:a.id}});
    api.command({kind:'raider',spawn:{x:a.x+1,z:a.z},target:{x:a.x,z:a.z}});
  });
  await page.evaluate(() => window.strongholdDev.advance(2.2));
  const fighter=(await residents()).find(a=>a.type==='warrior');
  assert.equal(fighter.level,2,'Three successful melee hits grant level 2');
  assert(fighter.nextTrainingAt>2.2);
  await page.evaluate(() => window.strongholdDev.advance(1.2));
  const afterFight=(await residents()).find(a=>a.id===fighter.id);
  assert(afterFight.experience>fighter.experience,'Combat continues earning XP during training cooldown');
  await page.getByRole('button',{name:'Workforce',exact:true}).click();
  await page.locator('[data-dwarf-role="warrior"]').click();
  const fighterRow=page.locator(`[data-resident="${fighter.id}"]`);
  await fighterRow.evaluate(element => { element.open = true; });
  assert((await fighterRow.textContent()).includes('Experience'));
  assert((await fighterRow.textContent()).includes('combat still earns XP'));
  await fighterRow.evaluate(element=>element.scrollIntoView({block:'center'}));
  await page.screenshot({path:'test-results/character-combat-xp.png'});
  assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors), []);
  assert.deepEqual(errors, []);
  console.log('PASS: all types train through levels 1–5; live stats and injuries; real melee combat grants shared XP and levels during training cooldown.');
} finally { await browser.close(); }
