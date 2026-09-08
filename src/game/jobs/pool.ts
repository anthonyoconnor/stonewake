import { tuning } from '../../content/tuning.ts';
import { bridgeWorkSite } from '../bridges.ts';
import { alive } from '../spell-effects.ts';
import {
  type World,
  type Resident,
  type Tile,
  type Job,
  type WorkGroup,
  neighbors,
  tileAt,
  key,
} from '../types.ts';
import { wallEligible } from '../walls.ts';
import { availableStorage, nearest, reserved, take } from './common.ts';

type Group = WorkGroup;
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

function chooseGroup(w: World, a: Resident, pool: WorkPool, group: Group, preserveAssignment = false) {
  const options = pool.filter(
    (item) => item.group === group && a.capabilities.includes(item.capability) && current(w, item),
  );
  if (!options.length || (group === 'haul' && !availableStorage(w, a))) return false;
  options.sort((p, q) => {
    // Stay at the same deposit across extraction batches and delivery trips.
    const resume = (item: WorkItem) =>
      (a.workAssignment?.group === group && key(a.workAssignment.target) === key(item.target)) ||
      (group === 'resource' && a.resumeMine && key(a.resumeMine) === key(item.target))
        ? -1
        : 0;
    return (
      resume(p) - resume(q) ||
      Math.hypot(a.x - p.target.x, a.z - p.target.z) - Math.hypot(a.x - q.target.x, a.z - q.target.z)
    );
  });
  for (const item of options)
    for (const site of nearest(a, item.sites)) {
      if (item.kind === 'buildBridge' && !bridgeWorkSite(w, item.target, site)) continue;
      if (take(w, a, item.kind, item.target, site)) {
        if (!preserveAssignment) {
          const remaining =
            a.workAssignment?.group === group && a.workAssignment.remaining > 0
              ? a.workAssignment.remaining
              : tuning.minerAssignmentSeconds;
          a.workAssignment = { group, target: { x: item.target.x, z: item.target.z }, remaining };
        }
        return true;
      }
    }
  return false;
}

// Productive time only: travel must not use up the commitment before work starts.
// Finished tiles/batches may select another target, but remain in the same role.
export function recordPoolWork(w: World, a: Resident, dt: number) {
  if (a.workAssignment && jobGroup(w, a) === a.workAssignment.group)
    a.workAssignment.remaining = Math.max(0, a.workAssignment.remaining - dt);
}

function staffingGroup(w: World, a: Resident): Group | undefined {
  const assignment = a.workAssignment;
  // A short batch boundary or delivery trip is not a resource vacancy. Urgent
  // interruptions still allow a replacement when another worker is available.
  if (
    assignment &&
    assignment.remaining > 0 &&
    !a.morale?.leaving &&
    a.combatTarget === undefined &&
    !a.rallying &&
    a.energy >= tuning.restThreshold &&
    a.hunger >= tuning.hungerThreshold &&
    (!a.job || ['collect', 'deliver', 'drop'].includes(a.job.kind))
  )
    return assignment.group;
  return jobGroup(w, a);
}

export function choosePoolJob(w: World, a: Resident, pool: WorkPool) {
  const miners = w.agents.filter(availableMiner).length;
  // A lone available miner must bank gem loads as part of its resource duty.
  if (
    miners <= 1 &&
    a.capabilities.includes('haul') &&
    (!a.workAssignment ||
      a.workAssignment.remaining <= 0 ||
      ['resource', 'haul'].includes(a.workAssignment.group))
  ) {
    const fullLoads = pool.filter(
      (item) => item.group === 'haul' && item.target.loose >= tuning.carry && resource(item.target),
    );
    if (fullLoads.length && chooseGroup(w, a, fullLoads, 'haul', a.workAssignment?.group === 'resource'))
      return true;
  }
  if (a.workAssignment && a.workAssignment.remaining > 0 && chooseGroup(w, a, pool, a.workAssignment.group))
    return true;
  // No reachable work in that role, or the productive stint has ended. Choose
  // a fresh assignment normally; never abandon an unfinished task to do this.
  a.workAssignment = undefined;
  const counts: Record<Group, number> = {
    resource: 0,
    haul: 0,
    excavate: 0,
    construction: 0,
    claim: 0,
    reinforce: 0,
  };
  for (const other of w.agents) {
    const group = staffingGroup(w, other);
    if (alive(other) && group) counts[group]++;
  }
  const resourceTarget = Math.max(1, Math.ceil(miners / tuning.minersPerResourceWorker));
  if (counts.resource < resourceTarget && chooseGroup(w, a, pool, 'resource')) return true;
  // Fill unstaffed kinds of useful work first, then distribute additional crew
  // evenly. Listed order breaks ties; reinforcement remains spare-time work.
  const groups: Group[] = ['haul', 'excavate', 'construction', 'claim'];
  groups.sort((p, q) => counts[p] - counts[q]);
  for (const group of groups) if (chooseGroup(w, a, pool, group)) return true;
  return chooseGroup(w, a, pool, 'resource') || chooseGroup(w, a, pool, 'reinforce');
}
