import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startCampaign, travelOnward, campaignSummary } from '../src/game/campaign.ts';
import { simulateCampaignArea } from '../scripts/helpers/campaign-route.ts';
import { campaignStages } from '../src/content/campaign.ts';
import { campaignApproaches, approachCells } from '../src/content/campaign-levels.ts';
import { designate, tick } from '../src/game/simulation.ts';
import { goldTotal } from '../src/game/rooms.ts';
import { roomAllowed } from '../src/game/availability.ts';

for (const approach of ['intended', 'alternate'] as const) {
  test(`ordinary paid campaign completes all five ${approach} approaches with real recruitment, combat, services and travel`, () => {
    let w = startCampaign();
    const reports: ReturnType<typeof simulateCampaignArea>['report'][] = [];
    for (let index = 0; index < campaignStages.length; index++) {
      assert.equal(w.elapsed, 0);
      assert.equal(goldTotal(w), 400);
      assert.equal(w.agents.length, 3);
      assert(w.agents.every(a => a.type === 'stonehand'));
      assert.equal(w.freeRoomBuilding, false);
      assert(!w.tiles.some(t => t.room));
      const { report } = simulateCampaignArea(w, approach, 1200, approach === 'alternate' ? 45 : 0);
      reports.push(report);
      assert.equal(w.outcome, 'victory', JSON.stringify(report, null, 2));
      assert(w.onwardHearth?.ready);
      assert(w.spent > 200, 'Rooms, wages, manufacturing, bridge construction and spells use shared gold normally');
      assert(goldTotal(w) >= 0);
      assert(w.agents.some(a => a.type === 'cave-hound'));
      if (index > 0) assert(w.agents.some(a => a.type === 'warrior' && (a.level ?? 1) >= 2));
      if (index > 1) {
        assert(w.agents.some(a => a.type === 'engineer'));
        assert(w.craftOrders.filter(o => o.state === 'done' && o.paid).length >= 2);
      }
      if (index > 2) {
        assert(w.agents.some(a => a.type === 'runesmith'));
        assert((report.casts['dwarf-haste'] ?? 0) >= 2, 'The Library prepares useful repeat work support');
        assert((report.casts['enemy-slow'] ?? 0) >= 1, 'Researched control supports actual visible combat');
        assert(w.researchOrders?.find(o => o.spell === 'enemy-slow')?.unlocked);
      }
      if (index === 4) {
        assert.equal(report.bridges, 2, 'Ordinary workers construct the mandatory paid two-square crossing');
        assert(w.tiles.filter(t => t.bridge).every(t => t.bridgePaid === 20));
        assert(w.campaign!.knownSpells.includes('enemy-slow'), 'Library knowledge carries, fresh charges require preparation');
        assert.equal(campaignSummary(w)?.complete, true);
        assert.equal(travelOnward(w), undefined);
      } else {
        const next = travelOnward(w);
        assert(next, 'Actual objective activation unlocks the next area');
        assert.equal(next.campaign!.completed.length, index + 1);
        w = next;
      }
    }
    assert(reports.some(report => report.reclaimed > 0), 'Normal exploration reclaims room services along the route');
    console.log(`M19 ${approach} route report: ${JSON.stringify(reports)}`);
    if (approach === 'alternate') {
      assert(reports.some(report => report.lost > 0), 'The prolonged route includes real combat losses');
      assert(reports.some(report => report.recruitedAfterLoss > 0), 'Preserved support attracts actual replacement residents after losses');
    }
  });
}

test('opening the hostile approach without developing a defense produces natural Hearth defeat', () => {
  const w = startCampaign(), z = w.hearth.z;
  designate(w, approachCells([{ x: 8, z }, { x: 10, z }, ...campaignApproaches['border-foothold'].intended]));
  for (let step = 0; step < 400 * 20 && !w.outcome; step++) tick(w, 0.05);
  assert.equal(w.outcome, 'defeat');
  assert.equal(w.hearthState?.health, 0);
  assert.equal(w.spent, 0);
  assert(w.enemies?.some(e => e.activity === 'Attacking Stone Hearth'));
  assert.equal(roomAllowed(w, 'training'), false, 'The first area does not need unavailable later defenses to be survivable');
});
