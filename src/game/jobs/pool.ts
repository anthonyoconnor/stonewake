import { tuning } from '../../content/tuning.ts';
import { bridgeWorkSite } from '../bridges.ts';
import { findPath } from '../navigation.ts';
import { alive } from '../spell-effects.ts';
import { type World, type Resident, type Tile, type Job, neighbors, tileAt, key } from '../types.ts';
import { wallEligible } from '../walls.ts';
import { availableStorage, nearest, releaseJob, reserved, take } from './common.ts';

type Group = 'resource' | 'haul' | 'excavate' | 'construction' | 'claim' | 'reinforce';
interface WorkItem {
  group: Group;
  kind: Job['kind'];
  capability: string;
  target: Tile;
  sites: Tile[];
}
export type WorkPool = WorkItem[];
const resource = (t: Tile) => t.terrain === 'gold' || t.terrain === 'gem';

// One transient list per simulation tick, shared by every worker. Reservations
// remain on real jobs, so completion, cancellation and interruption release them.
export function createWorkPool(w: World): WorkPool {
  const pool: WorkPool = [];
  for (const t of w.tiles) {
    if (!t.known) continue;
    const adjacent = neighbors(w, t);
    const add = (group: Group, kind: Job['kind'], capability: string, sites = adjacent) =>
      pool.push({ group, kind, capability, target: t, sites });
    if (t.designated && ['gold', 'gem', 'dirt', 'rock'].includes(t.terrain))
      add(resource(t) ? 'resource' : 'excavate', 'mine', 'mine');
    if (t.loose) add('haul', 'collect', 'haul', t.terrain === 'floor' ? [t] : adjacent);
    if (t.bridgePlanned)
      add(
        'construction',
        'buildBridge',
        'buildWall',
        adjacent.filter((p) => bridgeWorkSite(w, t, p)),
      );
    if (t.wallPlanned && wallEligible(w, t))
      add(
        'construction',
        'buildWall',
        'buildWall',
        adjacent.filter((p) => !p.wallPlanned),
      );
    if (t.terrain === 'floor' && !t.claimed) add('claim', 'claim', 'claim', [t]);
    if (!t.reinforced && !t.designated && ['dirt', 'rock'].includes(t.terrain))
      add(
        'reinforce',
        'reinforce',
        'reinforce',
        adjacent.filter((p) => p.claimed && p.terrain === 'floor'),
      );
  }
  return pool;
}

function current(w: World, item: WorkItem) {
  const t = item.target;
  if (!t.known || reserved(w, item.kind, t)) return false;
  switch (item.kind) {
    case 'mine':
      return t.designated && (item.group === 'resource' ? resource(t) : ['dirt', 'rock'].includes(t.terrain));
    case 'collect':
      return t.loose > 0;
    case 'claim':
      return t.terrain === 'floor' && !t.claimed;
    case 'buildBridge':
      return !!t.bridgePlanned;
    case 'buildWall':
      return !!t.wallPlanned && wallEligible(w, t);
    case 'reinforce':
      return !t.reinforced && !t.designated && ['dirt', 'rock'].includes(t.terrain);
    default:
      return false;
  }
}

function jobGroup(w: World, a: Resident): Group | undefined {
  const j = a.job,
    t = j && tileAt(w, j.target.x, j.target.z);
  if (!j || !t) return;
  if (j.kind === 'mine' && t.designated) return resource(t) ? 'resource' : 'excavate';
  if (['collect', 'deliver', 'drop'].includes(j.kind)) return 'haul';
  if (j.kind === 'buildBridge' || j.kind === 'buildWall') return 'construction';
  if (j.kind === 'claim' || j.kind === 'reinforce') return j.kind;
}

const availableMiner = (a: Resident) =>
  alive(a) &&
  a.capabilities.includes('mine') &&
  !a.carrying &&
  a.combatTarget === undefined &&
  !a.rallying &&
  !a.morale?.leaving &&
  a.energy >= tuning.restThreshold &&
  a.hunger >= tuning.hungerThreshold &&
  (!a.job || !['eat', 'sleep', 'pay', 'activate'].includes(a.job.kind));

function chooseGroup(w: World, a: Resident, pool: WorkPool, group: Group) {
  const options = pool.filter(
    (item) => item.group === group && a.capabilities.includes(item.capability) && current(w, item),
  );
  if (!options.length || (group === 'haul' && !availableStorage(w, a))) return false;
  options.sort((p, q) => {
    // Continuing a partly mined seam avoids needless travel, but only inside
    // the resource allocation; it cannot pull everyone away from other work.
    const resume = (item: WorkItem) =>
      group === 'resource' && a.resumeMine && key(a.resumeMine) === key(item.target) ? -1 : 0;
    return (
      resume(p) - resume(q) ||
      Math.hypot(a.x - p.target.x, a.z - p.target.z) - Math.hypot(a.x - q.target.x, a.z - q.target.z)
    );
  });
  for (const item of options)
    for (const site of nearest(a, item.sites)) {
      if (item.kind === 'buildBridge' && !bridgeWorkSite(w, item.target, site)) continue;
      if (take(w, a, item.kind, item.target, site)) return true;
    }
  return false;
}

export function choosePoolJob(w: World, a: Resident, pool: WorkPool) {
  const counts: Record<Group, number> = {
    resource: 0,
    haul: 0,
    excavate: 0,
    construction: 0,
    claim: 0,
    reinforce: 0,
  };
  for (const other of w.agents) {
    const group = jobGroup(w, other);
    if (alive(other) && group) counts[group]++;
  }
  const miners = w.agents.filter(availableMiner).length;
  const resourceTarget = Math.max(1, Math.ceil(miners / tuning.minersPerResourceWorker));
  // A lone available miner must also bank renewable gem income. Otherwise a
  // permanent gem target could keep it extracting forever with no deliveries.
  if (miners <= 1 && a.capabilities.includes('haul')) {
    const fullLoads = pool.filter(
      (item) => item.group === 'haul' && item.target.loose >= tuning.carry && resource(item.target),
    );
    if (fullLoads.length && chooseGroup(w, a, fullLoads, 'haul')) return true;
  }
  if (counts.resource < resourceTarget && chooseGroup(w, a, pool, 'resource')) return true;
  // Fill unstaffed kinds of useful work first, then distribute additional crew
  // evenly. Listed order breaks ties; reinforcement remains spare-time work.
  const groups: Group[] = ['haul', 'excavate', 'construction', 'claim'];
  groups.sort((p, q) => counts[p] - counts[q]);
  for (const group of groups) if (chooseGroup(w, a, pool, group)) return true;
  return chooseGroup(w, a, pool, 'resource') || chooseGroup(w, a, pool, 'reinforce');
}

// Cover a resource vacancy even when everyone already has a long-running job.
// Preserve needs, cargo, hauling, combat and objective work. Reassign only after
// finding a real route, preferring idle/travelling workers to active excavation.
export function coverResourceVacancy(w: World, pool: WorkPool) {
  if (w.agents.some((a) => alive(a) && jobGroup(w, a) === 'resource')) return;
  const jobs = pool.filter((item) => item.group === 'resource' && current(w, item));
  if (!jobs.length) return;
  const candidates = w.agents.filter(
    (a) =>
      availableMiner(a) &&
      a.job &&
      (a.job.kind === 'idle' ||
        ['excavate', 'construction', 'claim', 'reinforce'].includes(jobGroup(w, a) ?? '')),
  );
  candidates.sort((a, b) => Number(!!a.job && !a.path.length) - Number(!!b.job && !b.path.length));
  for (const a of candidates) {
    const ordered = [...jobs].sort(
      (p, q) =>
        Math.hypot(a.x - p.target.x, a.z - p.target.z) - Math.hypot(a.x - q.target.x, a.z - q.target.z),
    );
    for (const item of ordered)
      for (const site of nearest(a, item.sites)) {
        if (!findPath(w, a, site)) continue;
        releaseJob(w, a, 'Covering unstaffed gold or gem mining');
        take(w, a, 'mine', item.target, site);
        return;
      }
  }
}
