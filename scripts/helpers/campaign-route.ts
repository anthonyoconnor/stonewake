import { campaignStage } from '../../src/content/campaign.ts';
import { campaignApproaches, approachCells, settlementPlan } from '../../src/content/campaign-levels.ts';
import { type World, type Point, tileAt } from '../../src/game/types.ts';
import { designate, tick } from '../../src/game/simulation.ts';
import { buildRoom, goldTotal, roomQuote } from '../../src/game/rooms.ts';
import { roomAllowed } from '../../src/game/availability.ts';
import { queueCraft } from '../../src/game/crafting.ts';
import { placeDefense } from '../../src/game/defenses.ts';
import { castSpell, queueResearch } from '../../src/game/research.ts';
import { planBridges, bridgeQuote } from '../../src/game/bridges.ts';
import { requestHearthActivation } from '../../src/game/hearth.ts';
import { alive, visible, health, maxHealth } from '../../src/game/spell-effects.ts';
import { tuning } from '../../src/content/tuning.ts';

/** A repeatable player-action route: no grants, spawned units, map edits or shortened timers. */
export interface CampaignRoute {
  approach: 'intended' | 'alternate';
  started: boolean;
  openedAt?: number;
  casts: Record<string, number>;
  built: Record<string, number>;
  firstLossAt?: number;
  firstLossPopulation?: number;
  recoveryArrivals: number;
  lastPopulationId: number;
  initialWorkers: number;
  consolidationSeconds: number;
  discoveredAt?: number;
  trace: string[];
}
export function createCampaignRoute(w: World, approach: CampaignRoute['approach'] = 'intended', consolidationSeconds = 0): CampaignRoute {
  if (!w.campaign) throw Error('An ordinary campaign world is required.');
  if (w.freeRoomBuilding) throw Error('Campaign playthroughs require normal paid construction.');
  // Browser startup can render a few ordinary frames before the pause action lands.
  if (w.elapsed < 0 || w.elapsed >= 1 || w.allowance !== tuning.startingGold || w.agents.length !== tuning.startingStonehands ||
      w.agents.some(a => a.type !== 'stonehand') || w.tiles.some(t => t.room) || Object.values(w.outputs).some(n => n > 0))
    throw Error('Start from the ordinary fresh crew, economy and empty settlement.');
  return { approach, started: false, casts: {}, built: {}, recoveryArrivals: 0,
    lastPopulationId: w.nextResidentId ?? w.agents.length, initialWorkers: w.agents.length, consolidationSeconds, trace: [] };
}
const log = (w: World, route: CampaignRoute, text: string) => route.trace.push(`${Math.round(w.elapsed)}s ${text}`);
const combatLosses = (w: World) => Math.max(0, (w.nextResidentId ?? w.agents.length) - w.agents.filter(alive).length - (w.departures?.length ?? 0));

/** Observe each normal simulation step: a ready recruit may replace a casualty in that same step. */
export function observeCampaignRoute(w: World, route: CampaignRoute) {
  const populationId = w.nextResidentId ?? 0;
  if (route.firstLossAt === undefined && combatLosses(w) > 0) {
    route.firstLossAt = w.elapsed;
    // Enemy damage precedes automatic recruitment in tick(), so a new ID in this
    // step is already a replacement; sampling only once/second can miss it.
    route.firstLossPopulation = route.lastPopulationId;
    log(w, route, 'First combat loss; accommodation remains open for normal replacements');
  }
  if (route.firstLossAt !== undefined) route.recoveryArrivals = populationId - route.firstLossPopulation!;
  route.lastPopulationId = populationId;
}

export function actCampaignRoute(w: World, route: CampaignRoute) {
  if (w.outcome) return;
  observeCampaignRoute(w, route);
  const stage = campaignStage(w.campaign!.stageId)!, plan = settlementPlan(stage.level);
  if (!route.started) {
    designate(w, plan.development);
    designate(w, plan.gold);
    route.started = true;
    log(w, route, 'Marked a paid settlement opening and finite gold seams');
  }
  // Establish small working services first, then expand accommodation and food.
  const rooms: Array<[string, Point[]]> = [
    ['treasure', plan.treasure], ['dormitory', plan.dormitory.slice(0, 4)], ['kitchen', plan.kitchen.slice(0, 4)],
    ['training', plan.training], ['workshop', plan.workshop], ['library', plan.library],
    ['dormitory', plan.dormitory], ['kitchen', plan.kitchen],
  ];
  for (const [type, cells] of rooms) {
    if (!roomAllowed(w, type)) continue;
    const q = roomQuote(w, type, cells);
    if (q.valid) {
      buildRoom(w, type, q.tiles);
      route.built[type] = (route.built[type] ?? 0) + q.tiles.length;
    }
  }
  if (roomAllowed(w, 'workshop') && w.roomServices.some(s => s.room === 'workshop') && !w.craftOrders.length) {
    queueCraft(w, 'spike-trap'); queueCraft(w, 'spike-trap');
    log(w, route, 'Queued two normal Workshop traps');
  }
  if (roomAllowed(w, 'library') && w.roomServices.some(s => s.room === 'library')) {
    for (const spell of ['dwarf-haste', 'enemy-slow', 'mending-rune'])
      if (!w.researchOrders?.some(o => o.spell === spell && !o.paused)) queueResearch(w, spell);
    const worker = w.agents.find(a => alive(a) && a.type === 'stonehand' && a.job?.kind === 'mine');
    if (worker && w.researchOrders?.find(o => o.spell === 'dwarf-haste')?.state === 'ready' && goldTotal(w) > 100) {
      const result = castSpell(w, 'dwarf-haste', { kind: 'dwarf', id: worker.id });
      if (result.includes(' cast.')) route.casts['dwarf-haste'] = (route.casts['dwarf-haste'] ?? 0) + 1;
    }
    const wounded = w.agents.filter(a => alive(a) && a.type !== 'stonehand' && health(a) < maxHealth(a) * 0.65 && visible(w, a))
      .sort((a, b) => health(a) / maxHealth(a) - health(b) / maxHealth(b))[0];
    if (wounded && w.researchOrders?.find(o => o.spell === 'mending-rune')?.state === 'ready') {
      const result = castSpell(w, 'mending-rune', { kind: 'dwarf', id: wounded.id });
      if (result.includes(' cast.')) route.casts['mending-rune'] = (route.casts['mending-rune'] ?? 0) + 1;
    }
    const enemy = w.enemies?.filter(e => e.health > 0 && visible(w, e))
      .sort((a, b) => b.health - a.health)[0];
    if (enemy && w.researchOrders?.find(o => o.spell === 'enemy-slow')?.state === 'ready') {
      const result = castSpell(w, 'enemy-slow', { kind: 'enemy', id: enemy.id });
      if (result.includes(' cast.')) route.casts['enemy-slow'] = (route.casts['enemy-slow'] ?? 0) + 1;
    }
  }
  const living = w.agents.filter(alive), warriors = living.filter(a => a.type === 'warrior');
  const ready = roomAllowed(w, 'training')
    ? warriors.filter(a => (a.level ?? 1) >= (roomAllowed(w, 'workshop') ? 3 : 2)).length >= 2
    : living.filter(a => a.type === 'cave-hound').length >= 6;
  const productionReady = !roomAllowed(w, 'workshop') || w.craftOrders.filter(o => o.state === 'done').length >= 2;
  const researchReady = !roomAllowed(w, 'library') || (w.researchOrders ?? []).filter(o => o.state === 'ready').length >= 2;
  if (route.openedAt === undefined && ready && productionReady && researchReady) {
    designate(w, approachCells(campaignApproaches[stage.id][route.approach]));
    route.openedAt = w.elapsed;
    log(w, route, `Opened ${route.approach} route with ${living.length} residents, ${warriors.length} Warriors and ${goldTotal(w)} gold`);
  }
  if (route.openedAt !== undefined) {
    const path = approachCells(campaignApproaches[stage.id][route.approach]);
    for (const p of path) {
      if ((w.outputs['spike-trap'] ?? 0) <= 0) break;
      const t = tileAt(w, p.x, p.z);
      if (t?.known && t.claimed && !t.room && p.x >= 11 && p.x <= 13 && !(w.defenses ?? []).some(d => Math.hypot(d.x - p.x, d.z - p.z) < 2))
        placeDefense(w, 'spike-trap', p);
    }
    if (roomAllowed(w, 'bridge')) {
      const q = bridgeQuote(w, path);
      if (q.valid) planBridges(w, q.tiles);
    }
    const stone = w.onwardHearth;
    if (stone && tileAt(w, stone.x, stone.z)?.known && !stone.requested) {
      route.discoveredAt ??= w.elapsed;
      if (w.elapsed - route.discoveredAt >= route.consolidationSeconds) {
        requestHearthActivation(w);
        log(w, route, 'Requested the discovered onward Hearthstone through its normal action');
      }
    }
  }
}

export function campaignRouteReport(w: World, route: CampaignRoute) {
  return { stage: w.campaign?.stageId, approach: route.approach, outcome: w.outcome ?? 'running', seconds: Math.round(w.elapsed),
    gold: Math.round(goldTotal(w)), coreHealth: w.hearthState?.health, population: w.agents.filter(alive).length,
    residents: w.agents.filter(alive).map(a => `${a.type}:${a.level ?? 1}`), lost: combatLosses(w),
    recruitedAfterLoss: route.recoveryArrivals, casts: route.casts, built: route.built,
    reclaimed: w.tiles.filter(t => t.ruin && t.room).length, bridges: w.tiles.filter(t => t.bridge).length,
    waves: (w.encounters ?? []).map(s => ({ id: s.definition.id, waves: s.waves, phase: s.phase })), trace: route.trace };
}

export function simulateCampaignArea(w: World, approach: CampaignRoute['approach'] = 'intended', seconds = 1800, consolidationSeconds = 0) {
  const route = createCampaignRoute(w, approach, consolidationSeconds);
  for (let second = 0; second < seconds && !w.outcome; second++) {
    actCampaignRoute(w, route);
    for (let step = 0; step < 20 && !w.outcome; step++) { tick(w, 0.05); observeCampaignRoute(w, route); }
  }
  return { route, report: campaignRouteReport(w, route) };
}
