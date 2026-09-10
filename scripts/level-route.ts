import { mkdirSync, writeFileSync } from 'node:fs';
import { startFreePlay } from '../src/game/session.ts';
import { playableLevels } from '../src/content/playable-levels.ts';
import { simulateCampaignArea } from './helpers/campaign-route.ts';

/** Single-map iteration without rerunning unfinished or unaffected campaign areas. */
const [id, requestedApproach = 'intended', requestedSeconds = '2100'] = process.argv.slice(2);
if (!playableLevels.some(level => level.id === id) || !['intended', 'alternate'].includes(requestedApproach))
  throw Error('Usage: node scripts/level-route.ts <playable-level-id> [intended|alternate] [seconds]');
const seconds = Number(requestedSeconds);
if (!Number.isFinite(seconds) || seconds < 1 || seconds > 3600) throw Error('Choose a route limit between 1 and 3600 seconds.');
const approach = requestedApproach as 'intended' | 'alternate';
const world = startFreePlay(id), started = performance.now();
const { report } = simulateCampaignArea(world, approach, seconds);
const output = { ...report, simulationWallSeconds: (performance.now() - started) / 1000,
  ...(world.outcome === 'victory' ? {} : {
    pending: { agents: world.agents.map(a => ({ id: a.id, type: a.type, x: a.x, z: a.z, activity: a.activity, job: a.job, path: a.path, carrying: a.carrying })),
      roomServices: world.roomServices.length, designated: world.tiles.filter(t => t.designated).map(t => ({ x: t.x, z: t.z, terrain: t.terrain, gold: t.gold })),
      onward: world.onwardHearth },
  }),
};
mkdirSync('test-results/level-overhaul/routes', { recursive: true });
writeFileSync(`test-results/level-overhaul/routes/${id}-${approach}.json`, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
if (world.outcome !== 'victory') process.exitCode = 1;
