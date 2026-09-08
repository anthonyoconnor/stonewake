import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEconomyLab } from '../src/content/economy-lab.ts';
import { castSpell, queueResearch } from '../src/game/research.ts';
import { goldTotal, reclaimRoom } from '../src/game/rooms.ts';
import { minerPrice } from '../src/game/recruitment.ts';

test('innate Summon Miner casts without research and charges the live population price each time', () => {
  const w = createEconomyLab(), initial = w.agents.length, gold = goldTotal(w);
  queueResearch(w, 'summon-miner');
  assert.equal(w.researchOrders?.length ?? 0, 0);
  assert.equal(minerPrice(w), 75);
  assert.match(castSpell(w, 'summon-miner'), /cast\./);
  assert.equal(w.agents.length, initial + 1);
  assert.equal(goldTotal(w), gold - 75);
  assert.equal(minerPrice(w), 100);
  assert.match(castSpell(w, 'summon-miner'), /cast\./);
  assert.equal(goldTotal(w), gold - 175);
  assert.equal(w.agents.length, initial + 2);
  assert.equal(w.researchOrders?.length ?? 0, 0);
  w.agents.at(-1)!.health = 0;
  assert.equal(minerPrice(w), 100);
});

test('Summon Miner rejects missing support, insufficient gold and ended levels without a charge or arrival', () => {
  for (const reason of ['support', 'gold', 'ended']) {
    const w = createEconomyLab();
    if (reason === 'support') reclaimRoom(w, w.tiles.filter(t => t.room === 'kitchen'));
    if (reason === 'gold') { w.allowance = 0; for (const f of w.roomServices) f.stored = 0; }
    if (reason === 'ended') w.outcome = 'defeat';
    const count = w.agents.length, gold = goldTotal(w);
    assert.doesNotMatch(castSpell(w, 'summon-miner'), /cast\./);
    assert.equal(w.agents.length, count);
    assert.equal(goldTotal(w), gold);
  }
});
