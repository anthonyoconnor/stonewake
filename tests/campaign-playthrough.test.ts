import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startCampaign, travelOnward, campaignSummary } from '../src/game/campaign.ts';
import { simulateCampaignArea } from '../scripts/helpers/campaign-route.ts';
import { campaignStages } from '../src/content/campaign.ts';
import { campaignApproaches, approachCells } from '../src/content/campaign-levels.ts';
import { levelPlayPlan } from '../src/content/level-play-plans.ts';
import { tuning } from '../src/content/tuning.ts';
import { bridgeSettings } from '../src/game/terrain.ts';
import { designate, tick } from '../src/game/simulation.ts';
import { goldTotal } from '../src/game/rooms.ts';
import { roomAllowed } from '../src/game/availability.ts';

for (const approach of ['intended', 'alternate'] as const) {
  test(`ordinary paid campaign completes all five ${approach} approaches with real recruitment, combat, services and travel`, () => {
    let w = startCampaign();
    const reports: ReturnType<typeof simulateCampaignArea>['report'][] = [];
    for (let index = 0; index < campaignStages.length; index++) {
      assert.equal(w.elapsed, 0);
      assert.equal(goldTotal(w), tuning.startingGold);
      assert.equal(w.agents.length, tuning.startingStonehands);
      assert(w.agents.every(a => a.type === 'stonehand'));
      assert.equal(w.freeRoomBuilding, false);
      assert(!w.tiles.some(t => t.room));
      const { report } = simulateCampaignArea(w, approach, 2100, approach === 'alternate' ? 45 : 0);
      reports.push(report);
      assert.equal(w.outcome, 'victory', JSON.stringify(report, null, 2));
      assert(w.onwardHearth?.ready);
      assert(w.spent > 200, 'Rooms, wages, manufacturing, bridge construction and spells use shared gold normally');
      assert(goldTotal(w) >= 0);
      assert(report.timing.support !== undefined && report.timing.discovery && report.timing.hostileContact !== undefined, 'Normal services, discovery and visible contact are observed');
      assert(report.timing.firstHaul && report.deliveredGold > 0, 'Finite gold physically reaches a treasury');
      assert(w.encounters!.filter(s => s.definition.clear === 'claim').every(s => s.phase === 'cleared'), 'Ordinary source claiming prevents further reinforcement');
      assert.equal(report.needs.departures, 0, 'Authored distances and funding keep residents supported');
      assert(w.agents.some(a => a.type === 'cave-hound'));
      if (index > 0) assert(w.agents.some(a => a.type === 'warrior' && (a.level ?? 1) >= 2));
      if (index > 1) {
        assert(w.agents.some(a => a.type === 'engineer'));
        assert(w.craftOrders.filter(o => o.state === 'done' && o.paid).length >= 2);
      }
      if (index > 2) {
        assert(w.agents.some(a => a.type === 'runesmith'));
        assert((report.casts['dwarf-haste'] ?? 0) >= 1, 'The Library prepares useful support for actual excavation');
        assert((report.casts['enemy-slow'] ?? 0) >= 1, 'Researched control supports actual visible combat');
        assert(w.researchOrders?.find(o => o.spell === 'enemy-slow')?.unlocked);
      }
      if (index === 4) {
        assert(report.bridges > 0, 'Ordinary workers construct the mandatory paid crossing');
        assert(w.tiles.filter(t => t.bridge).every(t => t.bridgePaid === bridgeSettings.cost));
        assert(w.campaign!.knownSpells.includes('enemy-slow'), 'Library knowledge carries, fresh charges require preparation');
        assert.equal(campaignSummary(w)?.complete, true);
        assert.equal(travelOnward(w), undefined);
      } else {
        const next = travelOnward(w);
        assert(next, 'Actual objective activation unlocks the next area');
        assert.equal(next.campaign!.completed.length, index + 1);
        w = next;
      }
      console.log(`Level overhaul completed stage: ${JSON.stringify(report)}`);
    }
    assert(reports.some(report => report.reclaimed > 0), 'Normal exploration reclaims room services along the route');
    for (const report of reports.filter(r => r.lost > 0))
      assert(report.recruitedAfterLoss > 0, 'Preserved support attracts actual replacements when the route has casualties');
  });
}

test('opening the hostile approach without developing a defense produces natural Hearth defeat', () => {
  const w = startCampaign(), plan = levelPlayPlan('campaign-border-foothold')!;
  designate(w, [...plan.settlement.development, ...approachCells(campaignApproaches['border-foothold'].intended)]);
  for (let step = 0; step < 900 * 20 && !w.outcome; step++) tick(w, 0.05);
  assert.equal(w.outcome, 'defeat');
  assert.equal(w.hearthState?.health, 0);
  assert.equal(w.spent, 0);
  assert(w.enemies?.some(e => e.activity === 'Attacking Stone Hearth'));
  assert.equal(roomAllowed(w, 'training'), false, 'The first area does not need unavailable later defenses to be survivable');
});
