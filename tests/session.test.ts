import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playableLevels } from '../src/content/playable-levels.ts';
import { startFreePlay, restartSession } from '../src/game/session.ts';
import { startCampaign, travelOnward } from '../src/game/campaign.ts';
import { goldTotal } from '../src/game/rooms.ts';
import { tuning } from '../src/content/tuning.ts';

test('every listed standalone starts and restarts with its authored content and fresh normal economy', () => {
  assert.equal(new Set(playableLevels.map(l => l.id)).size, playableLevels.length);
  for (const level of playableLevels) {
    const w = startFreePlay(level.id);
    assert.equal(w.campaign, undefined);
    assert.equal(w.name, level.level.name);
    assert.equal(goldTotal(w), tuning.startingGold);
    assert.equal(w.agents.length, tuning.startingStonehands);
    assert(w.agents.every(a => a.type === 'stonehand'));
    assert.deepEqual(w.freePlay!.buildings, level.starting.buildings);
    assert(w.freePlay!.buildings.includes('bridge'));
    assert(w.onwardHearth && !w.onwardHearth.discovered && !w.outcome);
    w.allowance += 5000; w.outputs['bolt-trap'] = 40;
    w.freePlay!.knownSpells.push('enemy-slow'); w.freePlay!.buildings.length = 0;
    w.outcome = 'victory'; w.onwardHearth.ready = true;
    assert.equal(travelOnward(w), undefined, 'Free play never enters the campaign');
    const restarted = restartSession(w), fresh = startFreePlay(level.id);
    assert.deepEqual(restarted, fresh);
    assert(level.starting.buildings.length > 0, 'World mutation cannot change the catalog');
  }
  const campaign = startCampaign();
  assert.equal(campaign.freePlay, undefined);
  assert.equal(campaign.campaign!.knownSpells.length, 0);
  assert(!campaign.campaign!.unlockedBuildings.includes('bridge'));
});
