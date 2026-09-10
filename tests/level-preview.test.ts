import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLevelPreviewWorld } from '../src/content/level-preview.ts';
import { playableLevels } from '../src/content/playable-levels.ts';
import { startCampaign } from '../src/game/campaign.ts';
import { startFreePlay } from '../src/game/session.ts';
import { levelComparisons } from '../src/content/level-baselines.ts';
import { authoringFixture } from '../src/content/level-authoring-fixture.ts';
import { levelPreviewEntries } from '../src/content/level-preview.ts';
import { tuning } from '../src/content/tuning.ts';

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

test('old authored layouts and the authoring example are independent debug comparisons outside Free Play', () => {
  const current = startCampaign();
  const before = structuredClone(current);
  const snapshots = structuredClone(levelComparisons);
  assert.equal(levelComparisons.length, 12, 'All five campaign and seven standalone predecessors remain reproducible');
  for (const entry of [...levelComparisons, { id: authoringFixture.id, level: authoringFixture }]) {
    assert(!playableLevels.some(playable => playable.id === entry.id));
    assert(levelPreviewEntries.some(preview => preview.id === entry.id));
    assert.throws(() => startFreePlay(entry.id), /Unknown playable level/);
    const preview = createLevelPreviewWorld(entry.id, current);
    assert.equal(preview.width, entry.level.width);
    assert.equal(preview.height, entry.level.height);
    assert.equal(preview.agents.length, tuning.startingStonehands);
    assert.equal(preview.allowance, tuning.startingGold);
    assert(preview.tiles.every(t => t.known));
    assert.equal(preview.campaign, undefined);
    assert.equal(preview.freePlay, undefined);
    preview.agents[0].health = 1;
    preview.tiles[0].terrain = 'water';
    if (preview.encounters?.[0]) preview.encounters[0].definition.positions[0].x = 100;
    if (preview.availability) preview.availability.buildings.length = 0;
    const reset = createLevelPreviewWorld(entry.id, current);
    assert.equal(reset.tiles[0].terrain, 'bedrock');
    assert.equal(reset.agents[0].health, current.agents[0].health);
  }
  assert.deepEqual(levelComparisons, snapshots);
  assert.deepEqual(current, before);
});
