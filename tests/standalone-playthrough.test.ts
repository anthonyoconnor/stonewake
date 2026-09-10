import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playableLevels } from '../src/content/playable-levels.ts';
import { startFreePlay, restartSession } from '../src/game/session.ts';
import { simulateCampaignArea } from '../scripts/helpers/campaign-route.ts';
import { goldTotal } from '../src/game/rooms.ts';

for (const entry of playableLevels.filter(l => !l.id.startsWith('campaign-') && !l.buildingStudy))
  for (const approach of ['intended', 'alternate'] as const)
    test(`${entry.id}: paid ${approach} standalone expedition, suppression and fresh restart`, () => {
      const w = startFreePlay(entry.id);
      const { report } = simulateCampaignArea(w, approach, 2100);
      assert.equal(w.outcome, 'victory', JSON.stringify(report, null, 2));
      assert(w.onwardHearth?.ready && !w.campaign);
      assert(w.spent > 200 && goldTotal(w) >= 0, 'Rooms, wages, defenses and spells spend ordinary shared gold');
      assert(report.timing.support !== undefined && report.timing.discovery, 'Real services and fogged discoveries precede completion');
      assert(report.timing.firstHaul && report.deliveredGold > 0, 'Gold is physically hauled');
      assert(report.timing.hostileContact !== undefined && report.timing.firstDamage !== undefined, 'The route includes actual hostile contact');
      assert(w.encounters!.filter(s => s.definition.clear === 'claim').every(s => s.phase === 'cleared'), 'Reinforcement entrances are physically secured');
      assert(w.agents.some(a => a.type === 'warrior') && w.agents.some(a => a.type === 'engineer') && w.agents.some(a => a.type === 'runesmith'), 'Standalone starting catalogs support the complete settlement');
      assert.equal(report.needs.departures, 0, 'Routes keep normal needs and wages practical');
      assert.deepEqual(restartSession(w), startFreePlay(entry.id), 'Restart restores this independent authored start');
      console.log(`Standalone overhaul route report: ${JSON.stringify(report)}`);
    });
