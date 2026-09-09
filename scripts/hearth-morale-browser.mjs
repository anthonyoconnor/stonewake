import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const scope = process.argv[2] ?? 'all';
assert(['all', 'm11', 'm14'].includes(scope), 'Choose all, m11 or m14');
const url = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
});
let page;
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(`${url}/?scenario=stronghold&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'stronghold');
  const minerControl = async (method, status = false) => {
    await page.getByRole('button', { name: 'Spells', exact: true }).click();
    const control = page.locator(status ? '#summon-stonehand-status' : '[data-spell="summon-stonehand"]');
    const result = method === 'textContent' && !status ? await control.getAttribute('title') : await control[method]();
    await page.getByRole('button', { name: 'Workforce', exact: true }).click();
    await page.locator('.population-details').evaluate(e => { e.open = true; });
    return result;
  };
  const state = () => page.evaluate(() => window.strongholdDev.state());
  const advance = (seconds) => page.evaluate((seconds) => window.strongholdDev.advance(seconds), seconds);
  const load = async (id) => {
    await page.evaluate((id) => window.strongholdDev.load(id), id);
    assert.equal((await state()).elapsed, 0, 'Scenario starts from a fresh paused clock');
  };
  const command = (value) => page.evaluate((value) => window.strongholdDev.command(value), value);
  const panel = (name) => page.getByRole('button', { name, exact: true }).click();
  const accountedGold = (w) =>
    w.allowance +
    w.spent +
    w.roomServices.filter((s) => s.service === 'storage').reduce((sum, s) => sum + s.stored, 0) +
    w.agents.reduce((sum, a) => sum + a.carrying, 0) +
    w.tiles.reduce((sum, t) => sum + t.loose + t.gold, 0);
  const screenshot = async (name, locator) => {
    if (locator) await locator.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/${name}.png` });
  };
  const until = async (predicate, seconds, label, step = 1) => {
    let w = await state();
    const started = w.elapsed;
    for (let i = 0; i < Math.ceil(seconds / step) && !predicate(w); i++) {
      await advance(step);
      w = await state();
    }
    assert(w.elapsed >= started, 'Simulation unexpectedly reset; check for a Vite source reload');
    assert(
      predicate(w),
      `${label}\n${JSON.stringify({ elapsed: w.elapsed, outcome: w.outcome, onward: w.onwardHearth, residents: w.agents.map((a) => ({ id: a.id, type: a.type, x: a.x, z: a.z, job: a.job?.kind, activity: a.activity, morale: a.morale })) })}`,
    );
    return w;
  };
  mkdirSync('test-results', { recursive: true });

  if (scope !== 'm14') {
    await load('hearth');
    await page.locator('#open-hearth').click();
    let w = await state();
    const startingHearth = w.hearth;
    const treasuryAccess = w.roomServices.find((s) => s.id === 'hearth-treasury').access;
    const onward = w.onwardHearth;
    assert(onward && !onward.discovered && !onward.requested && !onward.ready);
    assert(!w.tiles[onward.z * w.width + onward.x].known);
    assert(!(await page.locator('#onward-status').textContent()).includes(onward.name));
    assert(await page.locator('#activate-hearth').isDisabled());
    await command({ kind: 'dig', points: [{ x: onward.x, z: onward.z }], enabled: true });
    assert(
      (await state()).tiles[onward.z * w.width + onward.x].designated,
      'The hidden objective accepts the same excavation plan as other unknown floor',
    );
    const knownBeforePan = w.tiles.filter((t) => t.known).length;
    const minimap = await page.locator('#minimap').boundingBox();
    await page.mouse.click(
      minimap.x + (minimap.width * onward.x) / w.width,
      minimap.y + (minimap.height * onward.z) / w.height,
    );
    w = await state();
    assert.equal(
      w.tiles.filter((t) => t.known).length,
      knownBeforePan,
      'Looking toward hidden terrain does not discover it',
    );
    assert(!w.onwardHearth.discovered && !w.onwardHearth.ready);
    await command({ kind: 'activate-hearth' });
    assert(!(await state()).onwardHearth.requested, 'Remote request cannot activate an undiscovered stone');
    await screenshot('m11-hidden-onward-hearth', page.locator('#onward-status'));

    // Real excavation discovers the enemy-held site; requesting activation cannot bypass its defenders.
    await command({ kind: 'dig', points: [{ x: 12, z: 12 }] });
    w = await until((w) => w.onwardHearth.discovered, 70, 'The mining crew discovers the onward Hearthstone');
    assert(
      !w.onwardHearth.requested && !w.onwardHearth.ready && w.onwardHearth.progress === 0,
      'Discovery alone never finishes the objective',
    );
    assert(
      !w.tiles[onward.z * w.width + onward.x].designated,
      'Discovery clears a concealed excavation plan over the actual onward floor',
    );
    assert(w.enemies.some((e) => e.health > 0 && Math.hypot(e.x - onward.x, e.z - onward.z) <= 4));
    assert.match(await page.locator('#onward-status').textContent(), /contested|hostile/i);
    await page.locator('#activate-hearth').click();
    await advance(0.05);
    w = await state();
    assert(w.onwardHearth.requested && !w.onwardHearth.ready);
    assert.equal(w.onwardHearth.progress, 0);
    assert.equal(w.onwardHearth.worker, undefined, 'An activation request waits while the site is defended');
    await screenshot('m11-contested-onward-hearth', page.locator('#onward-status'));
    let observedPhysicalActivation = false;
    for (let i = 0; i < 150 && !w.outcome; i++) {
      await advance(1);
      w = await state();
      if (w.onwardHearth.progress > 0 && !w.onwardHearth.ready) {
        const worker = w.agents.find((a) => a.id === w.onwardHearth.worker);
        assert(worker);
        assert.equal(worker.job?.kind, 'activate');
        assert.equal(Math.abs(worker.job.work.x - onward.x) + Math.abs(worker.job.work.z - onward.z), 1);
        assert(
          Math.hypot(worker.x - worker.job.work.x, worker.z - worker.job.work.z) < 0.3,
          'Activation advances only while a living dwarf stands at the actual interaction square',
        );
        if (!observedPhysicalActivation)
          await screenshot('m11-physical-activation', page.locator('#onward-status'));
        observedPhysicalActivation = true;
      }
    }
    assert(observedPhysicalActivation, 'Observed the uninterrupted physical activation visit');
    assert.equal(w.outcome, 'victory');
    assert(w.onwardHearth.ready);
    assert.equal(w.hearthState.health, w.hearthState.maxHealth);
    assert.deepEqual(w.hearth, startingHearth, 'The onward objective never relocates the settlement core');
    assert.deepEqual(w.roomServices.find((s) => s.id === 'hearth-treasury').access, treasuryAccess);
    assert.equal(await page.locator('#level-outcome').getAttribute('data-outcome'), 'victory');
    assert.match(await page.locator('#outcome-title').textContent(), /ready/i);
    assert(await page.locator('#activate-hearth').isDisabled());
    const wonAt = w.elapsed;
    await advance(2);
    assert.equal((await state()).elapsed, wonAt, 'Completed local objective waits for the next-area system');
    await screenshot('m11-hearthstone-ready', page.locator('#onward-status'));
    console.log(
      'M11: hidden discovery, contested request, physical activation and terminal local victory verified.',
    );

    // The same authored route with insufficient supplied defenses loses to natural enemies.
    await load('hearth-defeat');
    await page.locator('#open-hearth').click();
    await command({ kind: 'dig', points: [{ x: 12, z: 12 }] });
    w = await until(
      (w) => w.hearthState.health < w.hearthState.maxHealth,
      120,
      'Natural camp and raid enemies physically damage the starting Hearth',
      2,
    );
    assert(w.hearthState.health > 0);
    assert(w.enemies.some((e) => e.sourceId && e.activity === 'Attacking Stone Hearth'));
    await screenshot('m11-hearth-under-attack', page.locator('#core-health'));
    w = await until((w) => w.outcome === 'defeat', 80, 'Natural enemies destroy the starting Hearth', 2);
    assert.equal(w.hearthState.health, 0);
    assert(!w.onwardHearth.ready && !w.onwardHearth.requested && w.onwardHearth.progress === 0);
    assert.equal(await page.locator('#level-outcome').getAttribute('data-outcome'), 'defeat');
    assert.match(await page.locator('#outcome-title').textContent(), /fallen/i);
    assert(await page.locator('#activate-hearth').isDisabled());
    const defeated = w;
    await advance(5);
    assert.equal((await state()).elapsed, defeated.elapsed, 'Defeat stops the simulation');
    await panel('Workforce');
    assert(await minerControl('isDisabled'));
    await command({ kind: 'buy-miner' });
    await command({ kind: 'activate-hearth' });
    const buildSquare = w.tiles.find(
      (t) =>
        t.known &&
        t.claimed &&
        t.terrain === 'floor' &&
        !t.core &&
        !t.room &&
        !w.defenses.some((d) => d.x === t.x && d.z === t.z) &&
        !(t.x === treasuryAccess.x && t.z === treasuryAccess.z),
    );
    assert(buildSquare);
    await command({ kind: 'build', room: 'treasure', points: [{ x: buildSquare.x, z: buildSquare.z }] });
    w = await state();
    assert.equal(w.allowance, defeated.allowance);
    assert.equal(w.spent, defeated.spent);
    assert.equal(w.agents.length, defeated.agents.length);
    assert(!w.tiles[buildSquare.z * w.width + buildSquare.x].room && !w.onwardHearth.ready);
    await page.locator('#open-hearth').click();
    await screenshot('m11-hearth-defeat', page.locator('#core-health'));
    await page.setViewportSize({ width: 1440, height: 768 });
    await screenshot('m11-hearth-defeat-compact', page.locator('#restart-area'));
    const restartBox = await page.locator('#restart-area').boundingBox();
    assert(
      restartBox.y >= 0 && restartBox.y + restartBox.height <= 768,
      'Terminal restart remains reachable within a smaller viewport',
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#restart-area').click();
    w = await state();
    assert.equal(await page.evaluate(() => window.strongholdDev.status().scenario), 'hearth-defeat');
    assert.equal(w.elapsed, 0);
    assert.equal(w.outcome, undefined);
    assert.equal(w.hearthState.health, w.hearthState.maxHealth);
    assert(!w.onwardHearth.discovered && !w.onwardHearth.requested && !w.onwardHearth.ready);
    assert(await page.locator('#level-outcome').isHidden());
    await screenshot('m11-hearth-restarted');
    console.log(
      'PASS M11: natural Hearth attacks/defeat, frozen actions/purchases/objective, and actual area restart.',
    );
  }
  if (scope !== 'm11') {
    await load('morale');
    await panel('Workforce');
    let w = await state();
    const originalTypes = w.agents.map((a) => a.type).sort();
    assert.deepEqual(originalTypes, ['engineer', 'miner', 'runesmith', 'warrior']);
    const kitchen = w.tiles.filter((t) => t.room === 'kitchen').map(({ x, z }) => ({ x, z }));
    assert(kitchen.length > 0);
    const doorId = w.defenses.find((d) => d.type === 'timber-door').id;
    assert.equal(w.defenses.find((d) => d.id === doorId).mode, 'locked');

    // Temporary missing support receives grace, then recovers through ordinary construction/access.
    await command({ kind: 'reclaim', points: kitchen });
    await advance(20);
    w = await state();
    assert.equal(w.agents.length, 4);
    assert(w.agents.every((a) => !a.morale.leaving && a.morale.active.includes('food')));
    assert.equal(
      await page.locator('.notification-entry[data-key^="need:"]').count(),
      0,
      'Brief shortages do not produce warnings or immediate departure',
    );
    await command({ kind: 'build', room: 'kitchen', points: kitchen });
    await command({ kind: 'door', id: doorId, mode: 'closed' });
    w = await until(
      (w) =>
        w.agents.length === 4 &&
        w.agents.every(
          (a) =>
            !a.morale.active.length &&
            Object.values(a.morale.unmet).every((seconds) => seconds < 0.01) &&
            !a.pay.due.length,
        ),
      60,
      'All four types recover after support/access returns',
      2,
    );
    assert.equal(w.departures?.length ?? 0, 0);
    assert.equal(await page.locator('.notification-entry[data-key^="need:"]').count(), 0);
    await screenshot('m14-support-restored', page.locator('#morale-summary'));
    console.log('M14: temporary shortages recover without warnings or resident loss.');

    // Restoring wage access before a physical exit saves residents even after they start leaving.
    await load('morale');
    await panel('Workforce');
    await advance(360);
    w = await state();
    assert(w.agents.length === 4 && w.agents.every((a) => a.morale.leaving && a.morale.blocked));
    assert.equal(w.departures?.length ?? 0, 0);
    assert.match(await page.locator('#morale-summary').textContent(), /4|blocked|leav/i);
    await command({ kind: 'door', id: doorId, mode: 'closed' });
    await advance(0.05);
    w = await state();
    assert(
      w.agents.every((a) => !a.morale.leaving && !a.morale.active.includes('pay')),
      'Reachable funded wages cancel the departure before any dwarf exits',
    );
    assert.equal(
      await page.locator('.notification-entry[data-key="need:pay"]').count(),
      0,
      'Resolved wage warning clears immediately',
    );
    await screenshot('m14-wages-restored-before-exit', page.locator('#morale-summary'));
    w = await until(
      (w) => w.agents.length === 4 && w.agents.every((a) => !a.pay.due.length),
      90,
      'Saved residents collect their overdue wages',
      3,
    );
    assert.equal(w.departures?.length ?? 0, 0);
    assert(w.agents.every((a) => a.pay.collections >= 3));

    // Sustained independent food/pay shortages are grouped, dismissible and recoverable in the UI.
    await load('morale');
    await panel('Workforce');
    await command({ kind: 'reclaim', points: kitchen });
    await advance(180);
    w = await state();
    assert.equal(w.agents.length, 4);
    assert(w.agents.every((a) => !a.morale.leaving));
    const foodAlert = page.locator('.notification-entry[data-key="need:food"]');
    const payAlert = page.locator('.notification-entry[data-key="need:pay"]');
    assert.equal(await foodAlert.count(), 1);
    assert.equal(await payAlert.count(), 1);
    await foodAlert.locator('.notification-open').click();
    assert.match(await page.locator('#notification-text').textContent(), /4 residents/);
    await payAlert.locator('.notification-open').click();
    assert.match(await page.locator('#notification-text').textContent(), /4 residents/);
    await page.locator('#close-notification').click();
    await screenshot('m14-grouped-need-warnings');
    await page.setViewportSize({ width: 1440, height: 768 });
    await screenshot('m14-need-warnings-compact', page.locator('.notification-entry[data-key="need:pay"] .notification-remove'));
    const dismissBox = await page.locator('.notification-entry[data-key="need:pay"] .notification-remove').boundingBox();
    assert(
      dismissBox.y >= 0 && dismissBox.y + dismissBox.height <= 768,
      'Need warning controls remain reachable within a smaller viewport',
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('.notification-entry[data-key="need:food"] .notification-remove').click();
    assert.equal(await foodAlert.count(), 0);
    assert.equal(await payAlert.count(), 1, 'Dismissing one cause preserves the other warning');
    await advance(2);
    assert.equal(await foodAlert.count(), 0, 'Dismissal survives ordinary simulation updates');
    await page.locator('.population-details').evaluate(e => { e.open = true; });
    await page.locator('#reopen-morale').click();
    assert.equal(await foodAlert.count(), 1, 'The Dwarfs panel can reopen dismissed need warnings');
    await page.locator('.notification-entry[data-key="need:food"] .notification-remove').click();

    await advance(126);
    w = await state();
    assert(w.agents.length === 4 && w.agents.every((a) => a.morale.leaving && a.morale.blocked));
    assert.equal(w.departures?.length ?? 0, 0, 'A blocked exit never removes a dwarf remotely');
    assert.equal(await foodAlert.count(), 1, 'Escalation to departure reopens a dismissed warning');
    assert(
      (await minerControl('textContent')).includes('50'),
      'Stonehand price excludes dwarfs while a dwarf is departing',
    );
    assert.equal((await page.locator('#dwarf-total').textContent()).trim(), '4');
    const beforeExitGold = accountedGold(w);
    const residents = new Set(w.agents.map((a) => a.id));
    const crossedToHearth = new Set();
    await screenshot('m14-departure-blocked', page.locator('#morale-summary'));

    // Food remains missing, so opening the real passage permits autonomous physical departures.
    await command({ kind: 'door', id: doorId, mode: 'closed' });
    for (let i = 0; i < 90 && w.agents.length; i++) {
      await advance(1);
      w = await state();
      for (const a of w.agents) if (a.x < 7) crossedToHearth.add(a.id);
    }
    assert.equal(w.agents.length, 0, 'All four unsupported types leave through the reopened Hearth route');
    assert(
      [...residents].every((id) => crossedToHearth.has(id)),
      'Observed every departing dwarf on the Hearth side before removal',
    );
    assert.deepEqual(w.departures.map((a) => a.type).sort(), originalTypes);
    assert(w.departures.every((a) => a.causes.includes('food')));
    assert.equal(accountedGold(w), beforeExitGold, 'Departures preserve settlement resources');
    assert(
      w.roomServices.every((s) => s.assigned === undefined),
      'Departures release support assignments',
    );
    assert(
      (await minerControl('textContent')).includes('50'),
      'Stonehand price excludes dwarfs after dwarf departure',
    );
    assert.equal((await page.locator('#dwarf-total').textContent()).trim(), '0');
    await screenshot('m14-dwarfs-departed', page.locator('#morale-summary'));
    console.log(
      'PASS M14: late wage recovery, grouped warnings, dismissal/reopen/escalation, blocked exits, four physical departures and population/price/resource accounting.',
    );
  }

  assert.deepEqual(await page.evaluate(() => window.strongholdDev.status().errors), []);
  assert.deepEqual(errors, [], 'Browser console and runtime errors');
  console.log('PASS: no browser console, runtime or development-interface errors.');
} catch (error) {
  if (page) {
    console.error(
      await page
        .evaluate(() => {
          const w = window.strongholdDev?.state();
          return (
            w && {
              elapsed: w.elapsed,
              outcome: w.outcome,
              onward: w.onwardHearth,
              departures: w.departures,
              residents: w.agents.map((a) => ({
                id: a.id,
                type: a.type,
                x: a.x,
                z: a.z,
                path: a.path,
                job: a.job,
                activity: a.activity,
                morale: a.morale,
              })),
            }
          );
        })
        .catch(() => 'Browser context unavailable after failure.'),
    );
    await page.screenshot({ path: 'test-results/hearth-morale-failure.png' }).catch(() => {});
  }
  throw error;
} finally {
  await browser.close();
}
