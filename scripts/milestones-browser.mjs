import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
const scope = process.argv[2] ?? 'all';
assert(['all', 'm10', 'm13'].includes(scope), 'Choose all, m10 or m13');
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(`${url}/?scenario=stronghold&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'stronghold');
  const minerControl = async (method, status = false) => {
    await page.getByRole('button', { name: 'Spells', exact: true }).click();
    const control = page.locator(status ? '#summon-miner-status' : '[data-spell="summon-miner"]');
    const result = method === 'textContent' && !status ? await control.getAttribute('title') : await control[method]();
    await page.getByRole('button', { name: 'Dwarfs', exact: true }).click();
    await page.locator('.population-details').evaluate(e => { e.open = true; });
    return result;
  };
  const state = () => page.evaluate(() => window.strongholdDev.state());
  const advance = (seconds) => page.evaluate((seconds) => window.strongholdDev.advance(seconds), seconds);
  const load = (id) => page.evaluate((id) => window.strongholdDev.load(id), id);
  const command = (value) => page.evaluate((value) => window.strongholdDev.command(value), value);
  const panel = (name) => page.getByRole('button', { name, exact: true }).click();
  const balance = (w) =>
    w.allowance + w.roomServices.filter((f) => f.service === 'storage').reduce((sum, f) => sum + f.stored, 0);
  mkdirSync('test-results', { recursive: true });
  let before, after;

  if (scope !== 'm10') {
    // Purchases are ordinary sidebar actions and account for the starting crew.
    await panel('Dwarfs');
    before = await state();
    const startingMiners = before.agents.filter((a) => a.type === 'miner').length;
    assert((await minerControl('textContent')).includes(String(50 + 25 * startingMiners)));
    assert(
      await minerControl('isDisabled'),
      'An unsupported starting settlement explains unavailable purchases',
    );
    assert.match(
      await minerControl('textContent', true),
      /bed|accommodation|kitchen|food/i,
    );
    await command({ kind: 'buy-miner' });
    assert.equal(balance(await state()), balance(before), 'Failed purchase spends nothing');
    assert.equal((await state()).agents.length, before.agents.length);

    await load('economy');
    await panel('Dwarfs');
    before = await state();
    const originals = before.agents.map((a) => a.id);
    assert.equal(originals.length, 4);
    assert(
      before.agents.every((a) => a.x > 7),
      'Wage fixture starts all four types beyond the treasury passage',
    );
    assert((await minerControl('textContent')).includes('75'));
    assert(await minerControl('isEnabled'));
    await page.locator('.population-details').evaluate(e => { e.open = true; });
    await minerControl('click');
    after = await state();
    assert.equal(after.agents.length, before.agents.length + 1);
    assert.equal(balance(after), balance(before) - 75, 'Purchase spends its displayed price exactly once');
    assert(
      (await minerControl('textContent')).includes('100'),
      'Price rises with living Miners',
    );
    const purchased = after.agents.find((a) => !originals.includes(a.id));
    assert.equal(purchased.type, 'miner');
    assert(purchased.x < 7, 'Bought Miner appears through the base Hearth arrival route');
    await minerControl('scrollIntoViewIfNeeded', true);
    await page.screenshot({ path: 'test-results/m13-miner-purchase.png' });
    console.log('M13: sidebar Miner purchase, exact price and failure feedback verified.');

    // Observe real travel and job execution, rather than marking wages paid in a fixture.
    const beforePay = balance(after);
    const physicalCollectors = new Set();
    for (
      let i = 0;
      i < 50 && originals.some((id) => !after.agents.find((a) => a.id === id)?.pay.collections);
      i++
    ) {
      await advance(1);
      after = await state();
      for (const a of after.agents.filter((a) => originals.includes(a.id))) {
        if ((a.job?.kind === 'pay' && a.path.length === 0) || a.pay.collections > 0) {
          if (a.x < 7) physicalCollectors.add(a.type);
        }
      }
    }
    assert.equal(
      physicalCollectors.size,
      4,
      'Every dwarf type physically enters the treasury side to collect',
    );
    assert(originals.every((id) => after.agents.find((a) => a.id === id)?.pay.collections === 1));
    assert.equal(beforePay - balance(after), 33, 'All residents, including the new arrival, collect on the shared payday');
    assert.equal(
      after.agents.find((a) => a.id === purchased.id).pay.collections,
      1,
      'New arrivals join the shared first payday',
    );
    await advance(5);
    after = await state();
    assert.equal(beforePay - balance(after), 33, 'Paid wages are not deducted again on later ticks');
    assert(originals.every((id) => after.agents.find((a) => a.id === id)?.pay.due.length === 0));
    await page.locator('[data-dwarf-role="miner"]').click();
    assert.match(await page.locator('#residents-list').textContent(), /pay|wage/i);
    await page.locator('.population-details').evaluate(e => { e.open = true; });
    await page.locator('.population-details').evaluate(e => { e.open = true; });
    await page.locator('#payroll-status').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/m13-wages-collected.png' });

    // A locked physical route is different from a lack of gold; restoring it resumes collection.
    await load('economy');
    await panel('Dwarfs');
    before = await state();
    const door = before.defenses.find((d) => d.type === 'timber-door');
    assert(door);
    await command({ kind: 'door', id: door.id, mode: 'locked' });
    await advance(16);
    after = await state();
    assert(after.agents.every((a) => a.pay.collections === 0 && a.pay.due.length === 1));
    assert.equal(balance(after), balance(before), 'Inaccessible wages are not remotely withdrawn');
    assert.match(await page.locator('#payroll-status').textContent(), /access|blocked/i);
    await page.locator('#payroll-status').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/m13-wages-blocked.png' });
    await command({ kind: 'door', id: door.id, mode: 'closed' });
    for (let i = 0; i < 12 && after.agents.some((a) => a.pay.collections === 0); i++) {
      await advance(3);
      after = await state();
    }
    assert(
      after.agents.every((a) => a.pay.collections === 1 && a.pay.due.length === 0),
      'All delayed wages collect after access returns',
    );
    assert.equal(balance(before) - balance(after), 29);
    await load('economy');
    await panel('Dwarfs');
    after = await state();
    assert.equal(after.elapsed, 0);
    assert(after.agents.every((a) => a.pay.collections === 0 && a.pay.due.length === 0));
    assert(
      (await minerControl('textContent')).includes('75'),
      'Fresh scenario restores the living-population price',
    );
    console.log(
      'PASS M13: four physical wage visits, exactly-once payments, blocked/restored treasury access and fresh reset.',
    );
  }

  if (scope !== 'm13') {
    // Neither dormant residents nor a raid warning reveal the camp hidden beyond solid terrain.
    await load('encounters');
    await panel('Defenses');
    before = await state();
    const campName = before.encounters.find((s) => s.definition.kind === 'camp').definition.name;
    const entranceName = before.encounters.find((s) => s.definition.kind === 'entrance').definition.name;
    assert(
      !(await page
        .locator('#sidebar')
        .innerText()
        .then((text) => text.includes(campName))),
    );
    assert(before.enemies.every((e) => e.dormant && !before.tiles[e.z * before.width + e.x].known));
    await advance(20);
    after = await state();
    assert(
      Math.abs(after.elapsed - 20) < 1e-6,
      `Expected 20 seconds in the encounter fixture; observed ${after.elapsed}. Check for a Vite source reload.`,
    );
    let entrance = after.encounters.find((s) => s.definition.kind === 'entrance');
    let camp = after.encounters.find((s) => s.definition.kind === 'camp');
    assert.equal(camp.phase, 'dormant');
    assert.equal(entrance.phase, 'warning');
    assert.equal(entrance.blocked, true);
    assert.equal(entrance.waves, 0);
    assert(
      after.enemies.every((e) => e.sourceId === camp.definition.id),
      'A sealed route cannot teleport external raiders into the base',
    );
    let sidebarText = await page.locator('#sidebar').innerText();
    assert(sidebarText.includes('Underground raid'));
    assert(!sidebarText.includes(campName));
    assert(!sidebarText.includes(entranceName));
    assert.match(sidebarText, /blocked|warning/i);
    await page.screenshot({ path: 'test-results/m10-hidden-raid-warning.png' });
    console.log('M10: dormant camp concealed; external raid warning respects its blocked entrance.');

    // A Miner excavates the real gate; the same source system then activates both encounters.
    await command({ kind: 'dig', points: [{ x: 12, z: 12 }] });
    let sawCampWarning = false;
    for (let i = 0; i < 25 && !sawCampWarning; i++) {
      await advance(1);
      after = await state();
      camp = after.encounters.find((s) => s.definition.kind === 'camp');
      entrance = after.encounters.find((s) => s.definition.kind === 'entrance');
      sawCampWarning = camp.phase === 'warning';
    }
    assert(sawCampWarning, 'Discovering the inhabited camp produces its normal warning');
    assert.equal(after.tiles[12 * after.width + 12].terrain, 'floor');
    assert.equal(entrance.waves, 1, 'Previously warned raid begins after a physical approach opens');
    assert(
      after.enemies.some((e) => e.sourceId === entrance.definition.id && e.x > 20),
      'Raid arrives at its authored external entrance',
    );
    assert((await page.locator('#sidebar').innerText()).includes(campName));
    await page.locator('#encounter-status').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/m10-discovered-camp.png' });
    let sawTrap = false;
    for (let i = 0; i < 35 && camp.phase !== 'cleared'; i++) {
      await advance(1);
      after = await state();
      camp = after.encounters.find((s) => s.definition.kind === 'camp');
      sawTrap ||= after.defenses.some((d) => d.type.endsWith('trap') && d.triggeredAt >= 0);
    }
    assert.equal(camp.phase, 'cleared', 'Actual defenders defeat the natural camp wave');
    assert(sawTrap, 'Manufactured traps engage naturally arriving hostiles');
    assert(after.agents.some((a) => a.type === 'warrior' && a.health > 0));
    await page.locator('#encounter-status').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/m10-camp-cleared.png' });
    entrance = after.encounters.find((s) => s.definition.kind === 'entrance');
    for (let i = 0; i < 15 && entrance.waves < 2; i++) {
      await advance(2);
      after = await state();
      entrance = after.encounters.find((s) => s.definition.kind === 'entrance');
    }
    assert.equal(entrance.waves, 2, 'Unsecured entrance follows its authored repeat rule');
    assert.equal(
      after.encounters.find((s) => s.definition.kind === 'camp').waves,
      1,
      'Defeated camp does not respawn',
    );
    assert(
      after.enemies.filter((e) => e.sourceId === entrance.definition.id && e.health > 0).length <= 1,
      'Repeating source does not stack waves',
    );

    // Reload from the sidebar launcher, exercising the reset control players use while testing.
    await panel('Test harnesses');
    await page.getByLabel('Development scenario').selectOption('encounters');
    await page.getByRole('button', { name: 'Load scenario paused', exact: true }).click();
    after = await state();
    assert.equal(after.elapsed, 0);
    assert(after.encounters.every((s) => s.phase === 'dormant' && s.waves === 0));
    assert.equal(after.enemies.length, 1);
    assert(await page.getByRole('button', { name: 'Resume simulation', exact: true }).isVisible());
    await page.screenshot({ path: 'test-results/m10-encounter-reset.png' });
    console.log(
      'PASS M10: real excavation, natural waves, trap/combat victory, authored repeat and sidebar reset.',
    );
  }

  assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors), []);
  assert.deepEqual(errors, [], 'Browser console and runtime errors');
  console.log('PASS: no browser console, runtime or development-interface errors.');
} finally {
  await browser.close();
}
