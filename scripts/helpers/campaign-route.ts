import { approachCells } from '../../src/content/campaign-levels.ts';
import { levelPlayPlan } from '../../src/content/level-play-plans.ts';
import { type World, type Point, type Job, tileAt, key } from '../../src/game/types.ts';
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
  levelId: string;
  plan: NonNullable<ReturnType<typeof levelPlayPlan>>;
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
  options: RouteOptions;
  suppressionStartedAt?: number;
  supportAt?: number;
  servicesAt: Record<string, number>;
  firstDiscovery?: { at: number; place: string; point: Point };
  firstContactAt?: number;
  firstDamageAt?: number;
  suppressedAt: Record<string, number>;
  initialKnown: Set<string>;
  discoverySites: Array<{ place: string; point: Point }>;
  observations: Map<number, ResidentObservation>;
  journeys: Record<string, JourneySummary>;
  firstHaul?: HaulObservation;
  /** First delivery whose cargo was collected after opening the route; it may still be home gold. */
  postLaunchHaul?: HaulObservation;
  deliveredGold: number;
  minHunger: number;
  minEnergy: number;
  trace: string[];
}
export interface RouteOptions {
  /** Claim the authored reinforcement entrance before requesting the relay. */
  suppressSources?: boolean;
  /** Leave a normally developed world running for a pressure/performance review. */
  holdActivation?: boolean;
}
interface HaulObservation { at: number; seconds: number; distance: number; gold: number; from?: Point; to: Point }
interface JourneySummary { count: number; seconds: number; distance: number; longestSeconds: number; longestDistance: number }
interface ResidentObservation extends Point {
  job?: Job['kind']; target?: string; carrying: number; at: number;
  journeyAt: number; journeyDistance: number;
  cargoAt?: number; cargoDistance: number; origin?: Point;
}
export function createCampaignRoute(w: World, approach: CampaignRoute['approach'] = 'intended', consolidationSeconds = 0, options: RouteOptions = {}): CampaignRoute {
  const levelId = w.freePlay?.levelId ?? (w.campaign ? `campaign-${w.campaign.stageId}` : undefined);
  if (!levelId) throw Error('An ordinary campaign or standalone world is required.');
  const plan = levelPlayPlan(levelId);
  if (!plan) throw Error(`No authored player route for ${levelId}.`);
  if (w.freeRoomBuilding) throw Error('Level playthroughs require normal paid construction.');
  // Browser startup can render a few ordinary frames before the pause action lands.
  if (w.elapsed < 0 || w.elapsed >= 1 || w.allowance !== tuning.startingGold || w.agents.length !== tuning.startingStonehands ||
      w.agents.some(a => a.type !== 'stonehand') || w.tiles.some(t => t.room) || Object.values(w.outputs).some(n => n > 0))
    throw Error('Start from the ordinary fresh crew, economy and empty settlement.');
  const discoverySites = [
    ...w.tiles.filter(t => t.ruin).map(t => ({ place: t.ruin!.id, point: { x: t.x, z: t.z } })),
    ...(w.encounters ?? []).flatMap(s => s.definition.positions.map(point => ({ place: s.definition.name, point }))),
    ...w.tiles.filter(t => ['water', 'lava', 'chasm'].includes(t.terrain)).map(t => ({ place: t.terrain, point: { x: t.x, z: t.z } })),
  ];
  return { levelId, plan, approach, options: { suppressSources: true, ...options }, started: false, casts: {}, built: {}, recoveryArrivals: 0,
    lastPopulationId: w.nextResidentId ?? w.agents.length, initialWorkers: w.agents.length, consolidationSeconds,
    servicesAt: {}, suppressedAt: {}, initialKnown: new Set(w.tiles.filter(t => t.known).map(key)), discoverySites,
    observations: new Map(), journeys: {}, deliveredGold: 0, minHunger: 1, minEnergy: 1, trace: [] };
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
  if (route.firstDamageAt === undefined && (w.agents.some(a => (a.hitAt ?? -1) >= 0) || (w.hearthState?.hitAt ?? -1) >= 0)) route.firstDamageAt = w.elapsed;
  for (const a of w.agents.filter(alive)) {
    const previous = route.observations.get(a.id), job = a.job?.kind, target = a.job ? key(a.job.work) : undefined;
    const distance = previous ? Math.hypot(a.x - previous.x, a.z - previous.z) : 0;
    const sameJob = previous?.job === job && previous?.target === target;
    const journeyDistance = (previous?.journeyDistance ?? 0) + distance;
    if (previous?.job && !sameJob && ['eat', 'sleep', 'pay', 'deliver'].includes(previous.job)) {
      const summary = route.journeys[previous.job] ??= { count: 0, seconds: 0, distance: 0, longestSeconds: 0, longestDistance: 0 };
      const seconds = w.elapsed - previous.journeyAt;
      summary.count++; summary.seconds += seconds; summary.distance += journeyDistance;
      summary.longestSeconds = Math.max(summary.longestSeconds, seconds);
      summary.longestDistance = Math.max(summary.longestDistance, journeyDistance);
    }
    const cargoAt = previous?.cargoAt ?? (a.carrying > 0 ? w.elapsed : undefined);
    const cargoDistance = (previous?.cargoDistance ?? 0) + (previous?.carrying ? distance : 0);
    if (previous?.job === 'deliver' && previous.carrying > a.carrying) {
      const gold = previous.carrying - a.carrying;
      const haul = { at: w.elapsed, seconds: w.elapsed - (cargoAt ?? w.elapsed), distance: cargoDistance, gold,
        from: previous.origin, to: { x: a.x, z: a.z } };
      route.deliveredGold += gold;
      route.firstHaul ??= haul;
      if (route.openedAt !== undefined && (cargoAt ?? 0) >= route.openedAt) route.postLaunchHaul ??= haul;
    }
    if (a.type !== 'stonehand') {
      route.minHunger = Math.min(route.minHunger, a.hunger);
      route.minEnergy = Math.min(route.minEnergy, a.energy);
    }
    route.observations.set(a.id, { x: a.x, z: a.z, at: w.elapsed, job, target, carrying: a.carrying,
      journeyAt: sameJob && previous ? previous.journeyAt : w.elapsed, journeyDistance: sameJob ? journeyDistance : 0,
      cargoAt: a.carrying > 0 ? cargoAt : undefined, cargoDistance: a.carrying > 0 ? cargoDistance : 0,
      origin: a.cargoOrigin ? { ...a.cargoOrigin } : undefined });
  }
}

export function actCampaignRoute(w: World, route: CampaignRoute) {
  if (w.outcome) return;
  observeCampaignRoute(w, route);
  const plan = route.plan.settlement;
  for (const service of w.roomServices.filter(s => s.id !== 'hearth-treasury')) route.servicesAt[service.room] ??= w.elapsed;
  if (route.supportAt === undefined && route.servicesAt.dormitory !== undefined && (!roomAllowed(w, 'kitchen') || route.servicesAt.kitchen !== undefined)) route.supportAt = w.elapsed;
  if (!route.firstDiscovery) {
    const site = route.discoverySites.find(s => !route.initialKnown.has(key(s.point)) && tileAt(w, s.point.x, s.point.z)?.known);
    if (site) { route.firstDiscovery = { at: w.elapsed, ...site }; log(w, route, `Discovered ${site.place}`); }
  }
  if (route.firstContactAt === undefined && w.enemies?.some(e => e.health > 0 && visible(w, e))) {
    route.firstContactAt = w.elapsed; log(w, route, 'First visible hostile contact');
  }
  for (const source of w.encounters ?? []) if (source.definition.clear === 'claim' && source.phase === 'cleared') route.suppressedAt[source.definition.id] ??= source.clearedAt ?? w.elapsed;
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
    designate(w, approachCells(route.plan[route.approach]));
    route.openedAt = w.elapsed;
    log(w, route, `Opened ${route.approach} route with ${living.length} residents, ${warriors.length} Warriors and ${goldTotal(w)} gold`);
  }
  if (route.openedAt !== undefined) {
    const path = approachCells(route.plan[route.approach]);
    for (const p of route.plan.defensesByApproach?.[route.approach] ?? route.plan.defenses ?? path.filter(p => Math.hypot(p.x - w.hearth.x, p.z - w.hearth.z) >= 5 && Math.hypot(p.x - w.hearth.x, p.z - w.hearth.z) <= 8)) {
      if ((w.outputs['spike-trap'] ?? 0) <= 0) break;
      const t = tileAt(w, p.x, p.z);
      if (t?.known && t.claimed && !t.room && !(w.defenses ?? []).some(d => Math.hypot(d.x - p.x, d.z - p.z) < 2))
        placeDefense(w, 'spike-trap', p);
    }
    const stone = w.onwardHearth;
    if (stone && tileAt(w, stone.x, stone.z)?.known && !stone.requested) {
      route.discoveredAt ??= w.elapsed;
      if (route.options.suppressSources && route.plan.suppression && route.suppressionStartedAt === undefined) {
        designate(w, approachCells(route.plan.suppression));
        route.suppressionStartedAt = w.elapsed;
        log(w, route, 'Opened the authored reinforcement-suppression branch');
      }
      const suppressionReady = !route.options.suppressSources || !route.plan.suppression || (w.encounters ?? []).filter(s => s.definition.clear === 'claim').every(s => s.phase === 'cleared');
      if (!route.options.holdActivation && suppressionReady && w.elapsed - route.discoveredAt >= route.consolidationSeconds) {
        requestHearthActivation(w);
        log(w, route, 'Requested the discovered onward Hearthstone through its normal action');
      }
    }
    if (roomAllowed(w, 'bridge')) {
      const q = bridgeQuote(w, [...path, ...(route.suppressionStartedAt === undefined ? [] : approachCells(route.plan.suppression!))]);
      if (q.valid) planBridges(w, q.tiles);
    }
  }
}

export function campaignRouteReport(w: World, route: CampaignRoute) {
  const rounded = (value: number) => Math.round(value * 10) / 10;
  const time = (value?: number) => value === undefined ? undefined : rounded(value);
  const times = (values: Record<string, number>) => Object.fromEntries(Object.entries(values).map(([id, value]) => [id, rounded(value)]));
  const haul = (value?: HaulObservation) => value ? { ...value, at: rounded(value.at), seconds: rounded(value.seconds), distance: rounded(value.distance) } : undefined;
  return { level: route.levelId, stage: w.campaign?.stageId, approach: route.approach, outcome: w.outcome ?? 'running', seconds: Math.round(w.elapsed),
    gold: Math.round(goldTotal(w)), coreHealth: w.hearthState?.health, population: w.agents.filter(alive).length,
    residents: w.agents.filter(alive).map(a => `${a.type}:${a.level ?? 1}`), lost: combatLosses(w),
    recruitedAfterLoss: route.recoveryArrivals, casts: route.casts, built: route.built,
    reclaimed: w.tiles.filter(t => t.ruin && t.room).length, bridges: w.tiles.filter(t => t.bridge).length,
    timing: { support: time(route.supportAt), services: times(route.servicesAt), opened: time(route.openedAt),
      discovery: route.firstDiscovery ? { ...route.firstDiscovery, at: rounded(route.firstDiscovery.at) } : undefined,
      hostileContact: time(route.firstContactAt), firstDamage: time(route.firstDamageAt), relayDiscovery: time(route.discoveredAt),
      firstHaul: haul(route.firstHaul), postLaunchHaul: haul(route.postLaunchHaul), suppression: times(route.suppressedAt),
      activation: w.outcome === 'victory' ? rounded(w.elapsed) : undefined },
    needs: { minimumHunger: Math.round(route.minHunger * 1000) / 1000, minimumEnergy: Math.round(route.minEnergy * 1000) / 1000,
      meals: w.agents.reduce((n, a) => n + a.meals, 0), rests: w.agents.reduce((n, a) => n + a.rested, 0),
      wageCollections: w.agents.reduce((n, a) => n + (a.pay?.collections ?? 0), 0), departures: w.departures?.length ?? 0,
      journeys: Object.fromEntries(Object.entries(route.journeys).map(([kind, stats]) => [kind, Object.fromEntries(Object.entries(stats).map(([name, value]) => [name, rounded(value)]))])) },
    deliveredGold: route.deliveredGold,
    exploration: { known: w.tiles.filter(t => t.known).length, claimed: w.tiles.filter(t => t.claimed).length, total: w.tiles.length },
    waves: (w.encounters ?? []).map(s => ({ id: s.definition.id, waves: s.waves, phase: s.phase })), trace: route.trace };
}

export function simulateCampaignArea(w: World, approach: CampaignRoute['approach'] = 'intended', seconds = 1800, consolidationSeconds = 0, options: RouteOptions = {}) {
  const route = createCampaignRoute(w, approach, consolidationSeconds, options);
  for (let second = 0; second < seconds && !w.outcome; second++) {
    actCampaignRoute(w, route);
    for (let step = 0; step < 20 && !w.outcome; step++) { tick(w, 0.05); observeCampaignRoute(w, route); }
  }
  return { route, report: campaignRouteReport(w, route) };
}
