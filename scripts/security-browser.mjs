import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}/?scenario=cave-hounds&paused=1`);
  await page.waitForFunction(() => window.strongholdDev?.status().scenario === 'cave-hounds');
  const patrol = await page.evaluate(async () => {
    const api = window.strongholdDev;
    await api.advance(64);
    api.command({ kind: 'arrivals', enabled: false });
    const dogs = api.state().agents.map((a) => a.id),
      moved = dogs.map(() => 0);
    for (let i = 0; i < 12; i++) {
      const before = api.state();
      await api.advance(1);
      const after = api.state();
      dogs.forEach((id, n) => {
        const a = before.agents.find((a) => a.id === id),
          b = after.agents.find((a) => a.id === id);
        if (Math.hypot(b.x - a.x, b.z - a.z) > 0.4) moved[n]++;
      });
    }
    return { dogs, moved };
  });
  assert.equal(patrol.dogs.length, 2);
  assert(
    patrol.moved.every((n) => n >= 9),
    JSON.stringify(patrol),
  );
  const alarm = await page.evaluate(async () => {
    const api = window.strongholdDev;
    api.command({ kind: 'spawn', type: 'stonehand', count: 1 });
    let state = api.state();
    const worker = state.agents.find((a) => a.type === 'stonehand');
    const spot = state.tiles
      .filter(
        (t) =>
          t.known &&
          t.terrain === 'floor' &&
          !t.core &&
          !t.onward &&
          Math.hypot(t.x - worker.x, t.z - worker.z) >= 1 &&
          Math.hypot(t.x - worker.x, t.z - worker.z) <= 2,
      )
      .sort((p, q) => p.z - q.z)[0];
    api.command({ kind: 'enemy', type: 'goblin-raider', spawn: { x: spot.x, z: spot.z }, target: state.hearth });
    const enemy = api.state().enemies.at(-1);
    let fled = false,
      responded = false,
      ran = false;
    for (let i = 0; i < 32; i++) {
      await api.advance(0.5);
      state = api.state();
      const a = state.agents.find((a) => a.id === worker.id);
      fled ||= !!a?.fleeing;
      ran ||= !!a && Math.hypot(a.x - worker.x, a.z - worker.z) > 2;
      responded ||= state.agents.some(
        (a) => a.type === 'cave-hound' && (a.responding || a.combatTarget === enemy.id),
      );
    }
    return {
      fled,
      responded,
      ran,
      workerAlive: state.agents.some((a) => a.id === worker.id),
      enemy: state.enemies.find((e) => e.id === enemy.id).health,
    };
  });
  assert(alarm.fled && alarm.ran && alarm.responded && alarm.workerAlive, JSON.stringify(alarm));
  assert.equal(alarm.enemy, 0);
  const expansion = await page.evaluate(async () => {
    const api = window.strongholdDev;
    api.command({ kind: 'dig', points: [24, 25, 26, 27, 28].map((x) => ({ x, z: 10 })), enabled: true });
    let far = 0;
    for (let i = 0; i < 50; i++) {
      await api.advance(1);
      far = Math.max(
        far,
        ...api
          .state()
          .agents.filter((a) => a.type === 'cave-hound')
          .map((a) => a.x),
      );
    }
    // The worker may finish its last tile near the end of that interval. Allow
    // the surviving patrol time to finish a den visit and reach the new corridor.
    for(let i=0;i<20;i++){
      await api.advance(1);
      far=Math.max(far,...api.state().agents.filter(a=>a.type==='cave-hound').map(a=>a.x));
    }
    const state = api.state();
    return {
      far,
      dogs:state.agents.filter(a=>a.type==='cave-hound').map(a=>({x:a.x,z:a.z,activity:a.activity,energy:a.energy,hunger:a.hunger,target:a.job?.target})),
      opened: state.tiles.filter((t) => t.z === 10 && t.x >= 24 && t.x <= 28 && t.terrain === 'floor').length,
    };
  });
  assert.equal(expansion.opened, 5);
  assert(expansion.far >= 25, JSON.stringify(expansion));
  await page.getByRole('button', { name: 'Workforce', exact: true }).click();
  await page.locator('[data-dwarf-role="cave-hound"]').click();
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/security-patrol.png' });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: continuous pack patrol, shared alarm response and combat, worker escape/survival, and exploration following actual excavation.',
    JSON.stringify({ patrol, alarm, expansion }),
  );
} finally {
  await browser.close();
}
