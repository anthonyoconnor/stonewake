import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startCampaign, travelOnward, restartCampaignArea, campaignSummary } from '../src/game/campaign.ts';
import { campaignStages } from '../src/content/campaign.ts';
import { goldTotal } from '../src/game/rooms.ts';
import { bridgeQuote } from '../src/game/bridges.ts';
import { tuning } from '../src/content/tuning.ts';
import { tileAt, key } from '../src/game/types.ts';
import { createCrossingScenario, crossingLevel } from '../src/content/crossings.ts';
import { prototypeLevel } from '../src/content/levels.ts';
import { enemyDefinitions } from '../src/content/enemies.ts';
import { createWorld, reveal } from '../src/game/world.ts';
import { reachable } from '../src/game/navigation.ts';
import { tickEncounters } from '../src/game/encounters.ts';
import { addMiners, designate } from '../src/game/simulation.ts';
import { until } from './helpers/simulation.ts';

function completedFirstArea() {
  const w = startCampaign();
  w.outcome = 'victory';
  w.onwardHearth!.ready = true;
  return w;
}

test('campaign travel requires completed physical activation and a valid next link', () => {
  const w = startCampaign();
  assert.equal(travelOnward(w), undefined);
  w.onwardHearth!.discovered = true;
  w.onwardHearth!.requested = true;
  assert.equal(travelOnward(w), undefined, 'Discovery and requests do not authorize travel');
  w.onwardHearth!.ready = true;
  w.outcome = 'defeat';
  assert.equal(travelOnward(w), undefined, 'Core defeat wins over readiness');
  w.outcome = 'victory';
  const next = travelOnward(w)!;
  assert.equal(next.name, 'Emberwater Crossing');
  assert.equal(next.campaign!.stageId, 'emberwater-crossing');
  assert.equal(campaignSummary(next)!.stage, 2);
  assert.equal(next.outcome, undefined);
  for (const stage of campaignStages) {
    assert(stage.level.onwardHearth);
    if (stage.next) assert(campaignStages.some((next) => next.id === stage.next));
  }
});

test('travel carries completed research and building unlocks into an independent fresh economy', () => {
  const w = completedFirstArea();
  w.researchOrders = [
    { id: 1, spell: 'dwarf-haste', unlocked: true, state: 'ready', progress: 20, worker: 1 },
    { id: 2, spell: 'enemy-slow', unlocked: true, state: 'working', progress: 12, worker: 2 },
    { id: 3, spell: 'thunder-rune', unlocked: false, state: 'working', progress: 80, worker: 3 },
  ];
  w.allowance = 9999;
  w.outputs['steel-door'] = 6;
  w.craftOrders = [{ id: 1, recipe: 'steel-door', paid: true, progress: 12, state: 'working', worker: 1 }];
  w.agents[0].level = 5;
  w.agents[0].hunger = 0.1;
  w.agents[0].carrying = 42;
  w.agents[0].pay = { due: [{ at: 10, amount: 20 }], paid: 12, collections: 2 };
  w.rally = { x: 20, z: 20, until: 1000, radius: 4 };
  w.spellBursts = [{ id: 'dwarf-haste', x: 20, z: 20, at: 10, radius: 1 }];
  w.elapsed = 550;
  const next = travelOnward(w)!;
  assert.deepEqual(next.campaign!.knownSpells, ['dwarf-haste', 'enemy-slow']);
  assert.deepEqual(
    next.researchOrders!.map((o) => [o.spell, o.unlocked, o.state, o.paused, o.progress, o.worker]),
    [
      ['dwarf-haste', true, 'queued', true, 0, undefined],
      ['enemy-slow', true, 'queued', true, 0, undefined],
    ],
  );
  assert.equal(goldTotal(next), tuning.startingGold);
  assert.equal(next.spent, 0);
  assert.equal(next.elapsed, 0);
  assert.equal(next.nextPaydayAt, tuning.paydaySeconds);
  assert.equal(next.agents.length, tuning.startingStonehands);
  assert(
    next.agents.every(
      (a) =>
        a.type === 'stonehand' &&
        a.level === 1 &&
        a.hunger === 1 &&
        a.energy === 1 &&
        !a.job &&
        !a.carrying &&
        !a.pay?.due.length,
    ),
  );
  assert.deepEqual(next.outputs, {});
  assert.deepEqual(next.craftOrders, []);
  assert.equal(next.rally, undefined);
  assert.equal(next.spellBursts, undefined);
  assert.equal(next.defenses?.length ?? 0, 0);
  assert(!next.tiles.some((t) => t.room));
  const freshSources = new Set(campaignStages[1].level.encounters!.map((source) => source.id));
  assert(next.enemies?.every((e) => freshSources.has(e.sourceId!) && e.dormant));
  assert.equal(
    next.enemies?.length,
    campaignStages[1].level.encounters!.reduce((n, source) => n + source.positions.length, 0),
  );
  assert(next.campaign!.unlockedBuildings.includes('bridge'));
  for (const room of ['treasure', 'dormitory', 'kitchen', 'workshop', 'training', 'library'])
    assert(next.campaign!.unlockedBuildings.includes(room));
  next.campaign!.knownSpells.push('stoneguard');
  assert(!w.campaign!.knownSpells.includes('stoneguard'), 'Travel state must not alias the old area');
});

test('same-area retry retains arrival unlocks, resets local research and preserves a valid campaign endpoint', () => {
  const first = completedFirstArea();
  first.researchOrders = [{ id: 1, spell: 'dwarf-haste', unlocked: true, state: 'ready', progress: 20 }];
  const second = travelOnward(first)!;
  second.researchOrders!.push({ id: 2, spell: 'enemy-slow', unlocked: true, state: 'ready', progress: 25 });
  second.elapsed = 500;
  second.outcome = 'defeat';
  const retry = restartCampaignArea(second)!;
  assert.equal(retry.name, second.name);
  assert.equal(retry.elapsed, 0);
  assert.equal(retry.outcome, undefined);
  assert.deepEqual(
    retry.researchOrders!.map((o) => o.spell),
    ['dwarf-haste'],
  );
  assert.deepEqual(retry.campaign!.completed, ['border-foothold']);
  assert.equal(campaignSummary(retry)!.complete, false);
  retry.outcome = 'victory';
  retry.onwardHearth!.ready = true;
  assert.equal(campaignSummary(retry)!.complete, true);
  assert.equal(campaignSummary(retry)!.canTravel, false);
  assert.equal(travelOnward(retry), undefined);
  assert.match(campaignSummary(retry)!.completion, /journey.*complete/);
  assert.deepEqual(startCampaign().campaign!.knownSpells, []);
});

test('stonebridge knowledge unlocks at the first gate without restricting standalone crossing scenarios', () => {
  const first = startCampaign();
  assert.match(bridgeQuote(first, []).reason, /stonebridge plans/);
  assert(!first.campaign!.unlockedBuildings.includes('bridge'));
  const second = travelOnward(completedFirstArea())!;
  assert(second.campaign!.unlockedBuildings.includes('bridge'));
  assert(!bridgeQuote(second, []).reason.includes('stonebridge plans'));
  assert(!bridgeQuote(createCrossingScenario(), []).reason.includes('stonebridge plans'));
  assert.equal(restartCampaignArea(createCrossingScenario()), undefined);
});

const optionalChambers = [
  {
    stage: 0,
    id: 'fungal-side-nest',
    approach: { x: 10, z: 30 },
    gate: { x: 10, z: 31 },
    inside: { x: 10, z: 32 },
  },
  {
    stage: 0,
    id: 'ancient-side-watch',
    approach: { x: 38, z: 32 },
    gate: { x: 38, z: 33 },
    inside: { x: 38, z: 34 },
  },
  {
    stage: 1,
    id: 'crystal-side-camp',
    approach: { x: 27, z: 4 },
    gate: { x: 28, z: 4 },
    inside: { x: 29, z: 4 },
  },
  {
    stage: 1,
    id: 'volcanic-side-lair',
    approach: { x: 27, z: 12 },
    gate: { x: 28, z: 12 },
    inside: { x: 29, z: 12 },
  },
];

test('normal campaign contains all ten species while optional chambers stay sealed from the primary routes', () => {
  const species = new Set<string>();
  for (const [index, stage] of campaignStages.entries()) {
    const w = createWorld(stage.level);
    for (const e of w.enemies!) species.add(e.type!);
    // Explore every pre-existing walkable square, including the complete required objective route.
    const primary = createWorld(index === 0 ? prototypeLevel : crossingLevel);
    for (const t of primary.tiles) if (t.terrain === 'floor') reveal(w, t);
    tickEncounters(w);
    for (const chamber of optionalChambers.filter((c) => c.stage === index)) {
      const source = w.encounters!.find((s) => s.definition.id === chamber.id)!;
      assert.equal(source.phase, 'dormant', chamber.id + ' stays optional during the main route');
      for (const p of source.definition.positions) {
        const tile = tileAt(w, p.x, p.z)!;
        assert.equal(tile.terrain, 'floor');
        assert(!tile.known && !tile.claimed && !tile.core && !tile.onward);
        assert(Math.hypot(p.x - w.onwardHearth!.x, p.z - w.onwardHearth!.z) > tuning.hearthThreatRadius);
        assert(
          !reachable(w, chamber.approach, undefined, 'enemy').has(key(p)),
          chamber.id + ' has no open bypass',
        );
      }
    }
  }
  assert.deepEqual([...species].sort(), enemyDefinitions.map((e) => e.id).sort());
});

test('optional chambers open through ordinary excavation and reveal warned physical encounters', () => {
  for (const chamber of optionalChambers) {
    const w = createWorld(campaignStages[chamber.stage].level);
    addMiners(w, 1);
    Object.assign(w.agents[0], chamber.approach);
    reveal(w, chamber.approach);
    tileAt(w, chamber.approach.x, chamber.approach.z)!.claimed = true;
    assert.equal(tileAt(w, chamber.gate.x, chamber.gate.z)!.terrain, 'rock');
    designate(w, [chamber.gate]);
    until(
      w,
      () => tileAt(w, chamber.gate.x, chamber.gate.z)!.terrain === 'floor',
      60,
      chamber.id + ' excavation',
    );
    const routes = reachable(w, chamber.approach, undefined, 'enemy');
    assert(routes.has(key(chamber.inside)));
    const source = w.encounters!.find((s) => s.definition.id === chamber.id)!;
    for (const p of source.definition.positions)
      assert(routes.has(key(p)), chamber.id + ' spawn is accessible');
    reveal(w, chamber.inside);
    tickEncounters(w);
    assert.equal(source.phase, 'warning');
    assert(source.nextAt > w.elapsed);
    assert.equal(source.enemyIds.length, source.definition.positions.length);
  }
});

test('expanded Emberwater preserves continuous full-height water and lava barriers', () => {
  const w = createWorld(campaignStages[1].level);
  assert(w.width > crossingLevel.width);
  assert.equal(w.height, crossingLevel.height);
  for (let z = 0; z < w.height; z++) {
    for (const x of [10, 11]) assert.equal(tileAt(w, x, z)!.terrain, 'water');
    for (const x of [17, 18]) assert.equal(tileAt(w, x, z)!.terrain, 'lava');
  }
  const unbridged = reachable(w, { x: 7, z: 9 }, undefined, 'enemy');
  const middleIsland = reachable(w, { x: 13, z: 9 }, undefined, 'enemy');
  assert(!unbridged.has('12,9') && !middleIsland.has('23,8'), 'Eastern expansion cannot bypass either channel');
});
