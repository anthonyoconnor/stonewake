import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignStages } from '../src/content/campaign.ts';
import { playableLevels } from '../src/content/playable-levels.ts';
import { approachCells } from '../src/content/campaign-levels.ts';
import { levelPlayPlan } from '../src/content/level-play-plans.ts';
import { startFreePlay } from '../src/game/session.ts';
import { reachable } from '../src/game/navigation.ts';
import { tileAt, key, neighbors } from '../src/game/types.ts';
import { roomById } from '../src/content/rooms.ts';
import { enemyDefinitions } from '../src/content/enemies.ts';
import { tuning } from '../src/content/tuning.ts';

test('every authored start conceals inhabitants and provides finite paid settlement space', () => {
  for (const entry of playableLevels.filter(l => !l.buildingStudy)) {
    const w = startFreePlay(entry.id), plan = levelPlayPlan(entry.id);
    assert(plan, `${entry.id}: authored player plan`);
    const settlement = plan.settlement;
    assert(!w.onwardHearth!.discovered, entry.id);
    assert(!w.tiles.some(t => t.room), `${entry.id}: no free starting services`);
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== 2) continue;
      assert.equal(tileAt(w, w.hearth.x + dx, w.hearth.z + dz)?.terrain, 'floor', `${entry.id}: clear starting walking ring at ${dx},${dz}`);
    }
    assert(w.enemies!.every(e => !tileAt(w, Math.round(e.x), Math.round(e.z))!.known), `${entry.id}: concealed inhabitants`);
    assert.equal(new Set(settlement.gold.map(key)).size, settlement.gold.length, `${entry.id}: opening income counts each seam once`);
    assert(settlement.gold.every(p => tileAt(w, p.x, p.z)?.terrain === 'gold'), `${entry.id}: planned opening income exists in the authored terrain`);
    const rooms = Object.entries(settlement).filter(([id]) => entry.starting.buildings.includes(id));
    const cost = rooms.reduce((sum, [id, cells]) => sum + cells.length * roomById(id)!.cost, 0);
    const income = settlement.gold.reduce((sum, p) => sum + (tileAt(w, p.x, p.z)?.gold ?? 0), tuning.startingGold);
    assert(income > cost + 500, `${entry.id}: finite opening funds rooms and several paydays (${income} income / ${cost} room cost)`);
    const assigned = new Set<string>();
    for (const [room, cells] of rooms) for (const p of cells) {
      const t = tileAt(w, p.x, p.z);
      assert(t && !t.core && !t.onward && !t.ruin && ['floor', 'dirt', 'rock', 'gold'].includes(t.terrain), `${entry.id}: ${room} development space at ${key(p)}`);
      assert(!assigned.has(key(p)), `${entry.id}: overlapping planned rooms at ${key(p)}`);
      assigned.add(key(p));
    }
    assert(w.tiles.some(t => t.ruin), `${entry.id}: useful lost site`);
    assert(entry.level.encounters!.some(e => e.repeatSeconds && e.clear === 'claim'), `${entry.id}: suppressible recurring pressure`);
    assert(plan.suppression?.length, `${entry.id}: authored source approach`);
  }
});

test('campaign preserves deliberate gem scarcity and introduces the complete inhabitant roster', () => {
  const species = new Set<string>();
  for (const [index, stage] of campaignStages.entries()) {
    const w = startFreePlay(`campaign-${stage.id}`);
    assert.equal(w.tiles.filter(t => t.terrain === 'gem').length, index < 3 ? 0 : 1, `${stage.id}: rare optional income`);
    assert(w.tiles.filter(t => t.terrain === 'gem').every(t => Math.hypot(t.x - w.hearth.x, t.z - w.hearth.z) > 20), `${stage.id}: gems require an expedition`);
    for (const encounter of stage.level.encounters!) for (const id of encounter.roster ?? []) species.add(id);
  }
  assert.deepEqual([...species].sort(), enemyDefinitions.map(e => e.id).sort());
});

test('intended, alternate and suppression routes use each map’s actual arrival tools', () => {
  for (const entry of playableLevels.filter(l => !l.buildingStudy)) for (const variant of ['intended', 'alternate'] as const) {
    const w = startFreePlay(entry.id), plan = levelPlayPlan(entry.id)!;
    const origin = { x: w.agents[0].x, z: w.agents[0].z };
    assert(!neighbors(w, w.onwardHearth!).some(p => reachable(w, origin).has(key(p))), `${entry.id}: objective initially inaccessible`);
    // Structural validation only; paid playthroughs execute the same routes
    // through real excavation, crossings, claiming and physical activation.
    // Existing open floor permits ordinary detours around the solid relay;
    // limiting visibility to a one-cell marked spine would hide those routes.
    for (const t of w.tiles) t.known = true;
    const cells = [...plan.settlement.development, ...approachCells(plan[variant]), ...approachCells(plan.suppression ?? [])];
    for (const p of cells) {
      const t = tileAt(w, p.x, p.z);
      assert(t, `${entry.id}/${variant}: in-bounds route at ${key(p)}`);
      assert(!['bedrock', 'gem', 'chasm'].includes(t.terrain), `${entry.id}/${variant}: unavailable obstacle at ${key(p)}`);
      t.known = true;
      if (t.terrain === 'lava' || t.terrain === 'water') {
        assert(entry.starting.buildings.includes('bridge'), `${entry.id}/${variant}: bridge plan must be available`);
        t.bridge = true;
      } else if (!t.core) t.terrain = 'floor';
    }
    const routes = reachable(w, origin);
    assert(neighbors(w, w.onwardHearth!).some(p => routes.has(key(p))), `${entry.id}/${variant}: physical relay approach`);
    for (const source of w.encounters!.filter(s => s.definition.clear === 'claim'))
      assert(source.definition.positions.some(p => routes.has(key(p))), `${entry.id}/${variant}: physically claimable ${source.definition.id}`);
    if (entry.id === 'campaign-royal-deep') {
      assert(w.tiles.some(t => t.bridge), `${variant}: lava crossing is required`);
      for (const t of w.tiles) t.bridge = false;
      const noBridge = reachable(w, origin);
      assert(!neighbors(w, w.onwardHearth!).some(p => noBridge.has(key(p))), `${variant}: no land bypass`);
    }
  }
});
