import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCombatLab, combatResult, runCombatMatchup } from '../src/content/combat-lab.ts';
import { addResidents, tick } from '../src/game/simulation.ts';
import { buildRoom, goldTotal } from '../src/game/rooms.ts';
import { queueCraft } from '../src/game/crafting.ts';
import { castSpell, queueResearch } from '../src/game/research.ts';
import { rect, until } from './helpers/simulation.ts';

test('hounds defend early routes, but realistic later groups defeat an unsupported pack', () => {
  const match = (team: string, opponent: string) => runCombatMatchup({ team, opponent, support: 'none' });
  assert.equal(match('hound', 'goblin-raider').result, 'Defenders defeated');
  assert.equal(match('pair', 'goblin-raider').result, 'Defenders won');
  assert.equal(match('pair', 'cave-spider').result, 'Defenders won');
  for (const opponent of ['ancient-hall', 'volcanic-lair']) {
    assert.equal(match('pack', opponent).result, 'Defenders defeated');
    assert.equal(match('squad', opponent).result, 'Defenders won');
  }
});

test('manufactured traps and costed Library spells improve a trained response', () => {
  const setup = { team: 'squad', opponent: 'ancient-hall', support: 'none' as const };
  const baseline = runCombatMatchup(setup);
  const traps = runCombatMatchup({ ...setup, support: 'traps' });
  assert(traps.residentHealth > baseline.residentHealth);
  assert(traps.seconds < baseline.seconds);
  const w = createCombatLab(false, { ...setup, support: 'spells' });
  // Produce the support using actual staffed rooms and normal costs before contact.
  const enemies = w.enemies!; w.enemies = [];
  w.researchOrders = [];
  buildRoom(w, 'workshop', rect(13, 4, 2, 2));
  addResidents(w, 'engineer'); addResidents(w, 'runesmith');
  queueCraft(w, 'bolt-trap'); queueCraft(w, 'bolt-trap');
  queueResearch(w, 'stoneguard'); queueResearch(w, 'rune-of-reckoning');
  const beforeProduction = goldTotal(w);
  until(w, () => w.outputs['bolt-trap'] === 2 && w.researchOrders!.every(o => o.state === 'ready'), 240);
  assert.equal(w.outputs['bolt-trap'], 2);
  assert(w.researchOrders!.every(o => o.state === 'ready'));
  assert(goldTotal(w) <= beforeProduction - 110, 'Traps pay for both production inputs');
  // Recreate the exact starting matchup, carrying only normally produced charges and stock.
  const fight = createCombatLab(false, { ...setup, support: 'spells' });
  fight.researchOrders = structuredClone(w.researchOrders);
  fight.allowance = 400;
  const before = goldTotal(fight);
  assert.match(castSpell(fight, 'rune-of-reckoning', { kind: 'enemy', id: enemies[0].id }), /cast/);
  assert.match(castSpell(fight, 'stoneguard', { kind: 'dwarf', id: fight.agents[0].id }), /cast/);
  assert.equal(before - goldTotal(fight), 75);
  while (fight.elapsed < 90 && combatResult(fight).result === 'In progress') tick(fight, 0.05);
  assert.equal(combatResult(fight).result, 'Defenders won');
  assert(fight.elapsed < baseline.seconds);
});
