import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startFreePlay } from '../src/game/session.ts';
import { actCampaignRoute, campaignRouteReport, createCampaignRoute, observeCampaignRoute } from '../scripts/helpers/campaign-route.ts';
import { tick } from '../src/game/simulation.ts';
import { goldTotal } from '../src/game/rooms.ts';
import { tileAt } from '../src/game/types.ts';

test('ordinary volcanic reinforcements repeat physically with recovery and stop after paid source claiming', () => {
  const w = startFreePlay('campaign-royal-deep');
  const route = createCampaignRoute(w, 'intended', 0, { suppressSources: false, holdActivation: true });
  const source = w.encounters!.find(e => e.definition.clear === 'claim' && e.definition.roster?.includes('cinderling'))!;
  assert(source && route.plan.suppression, 'Royal map authors a physically suppressible Cinderling entrance');
  let clearedAt = 0, firstAttackAt = 0, suppressionStarted = false;
  const seenPhases = new Set<string>(), warnings = new Set<number>(), waveTimes = new Map<number, number>();
  for (let second = 0; second < 2400 && !w.outcome; second++) {
    seenPhases.add(source.phase);
    if (source.warnedAt !== undefined) warnings.add(source.warnedAt);
    if (source.waves && !waveTimes.has(source.waves)) waveTimes.set(source.waves, w.elapsed);
    if ((w.enemies ?? []).some(e => e.sourceId === source.definition.id && e.health > 0 && tileAt(w, Math.round(e.x), Math.round(e.z))?.claimed)) firstAttackAt ||= w.elapsed;
    if (source.waves >= 2 && source.phase === 'cooldown' && !suppressionStarted) {
      assert(!source.definition.positions.some(p => tileAt(w, p.x, p.z)!.claimed), 'The source requires a deliberate expedition');
      route.options.suppressSources = true;
      suppressionStarted = true;
    }
    actCampaignRoute(w, route);
    for (let step = 0; step < 20 && !w.outcome; step++) { tick(w, .05); observeCampaignRoute(w, route); }
    if (source.phase === 'cleared') {
      clearedAt ||= w.elapsed;
      if (w.elapsed - clearedAt > source.definition.repeatSeconds! + source.definition.warningSeconds + 5) break;
    }
  }
  const report = { ...campaignRouteReport(w, route), warnings: [...warnings], waveTimes: [...waveTimes], firstAttackAt, clearedAt };
  assert.equal(w.outcome, undefined, JSON.stringify(report));
  assert(route.openedAt !== undefined && firstAttackAt > 0, 'Natural Cinderlings physically enter the developed claimed bank');
  assert(source.waves >= 2 && warnings.size >= 2 && seenPhases.has('cooldown'), JSON.stringify(report));
  assert(waveTimes.get(1)! >= source.definition.delay + source.definition.warningSeconds);
  assert(waveTimes.get(2)! - waveTimes.get(1)! >= source.definition.repeatSeconds! + source.definition.warningSeconds);
  assert.equal(source.phase, 'cleared', JSON.stringify(report));
  assert(source.definition.positions.some(p => tileAt(w, p.x, p.z)!.claimed), 'Ordinary worker claiming secures the actual entrance');
  assert(w.tiles.some(t => t.bridge && t.claimed && t.bridgePaid! > 0), 'Reaching the royal banks includes ordinary paid bridge construction');
  assert.equal(source.waves, 2, 'Source suppression prevents a third wave after another full recovery and warning');
  assert(w.elapsed - clearedAt > source.definition.repeatSeconds! + source.definition.warningSeconds, 'Observe the full suppressed recurrence window');
  assert(w.hearthState!.health > 0 && goldTotal(w) >= 0);
  console.log(JSON.stringify(report));
});
