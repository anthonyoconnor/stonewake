import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLevelPreviewWorld } from '../src/content/level-preview.ts';
import { playableLevels } from '../src/content/playable-levels.ts';
import { startCampaign } from '../src/game/campaign.ts';
import { startFreePlay } from '../src/game/session.ts';

test('fully loaded previews reveal independent playable worlds without advancing encounters or changing the retained game', () => {
  const current = startCampaign(true);
  current.allowance += 123;
  const retained = structuredClone(current);
  for (const id of ['current', ...playableLevels.map(l => l.id)]) {
    const source = id === 'current' ? current : startFreePlay(id, true);
    const preview = createLevelPreviewWorld(id, current);
    assert(preview.tiles.every(t => t.known), id);
    assert.equal(preview.onwardHearth?.discovered, true, id);
    assert.equal(preview.elapsed, source.elapsed);
    assert.equal(preview.freeRoomBuilding, true);
    assert.deepEqual(preview.agents, source.agents);
    assert.deepEqual(preview.enemies, source.enemies);
    assert.deepEqual(preview.encounters, source.encounters);
    assert.deepEqual(preview.availability, source.availability);
    preview.agents[0].health = 1;
    preview.allowance = 0;
    assert.deepEqual(current, retained, 'Preview gameplay cannot mutate the retained stronghold');
  }
});
