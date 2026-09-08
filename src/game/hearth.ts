import { isAnimal } from '../content/characters.ts';
import { type World, type Point, type Resident, type Enemy, tileAt, neighbors, key } from './types.ts';
import { tuning } from '../content/tuning.ts';
import { enemyById, enemyBehaviorTuning } from '../content/enemies.ts';
import { alive, slowRate, spellLine } from './spell-effects.ts';
import { canStand, findPath } from './navigation.ts';
import { nearest, releaseJob, take } from './jobs/common.ts';
import { wageStatus } from './wages.ts';

export interface HearthState {
  health: number;
  maxHealth: number;
  hitAt?: number;
}
export interface OnwardHearthDefinition extends Point {
  id: string;
  name: string;
}
export interface OnwardHearthState extends OnwardHearthDefinition {
  discovered: boolean;
  requested: boolean;
  progress: number;
  ready: boolean;
  worker?: number;
}

export function initializeHearth(w: World, definition?: OnwardHearthDefinition) {
  w.hearthState = { health: tuning.hearthHealth, maxHealth: tuning.hearthHealth };
  if (!definition) return;
  const tile = tileAt(w, definition.x, definition.z);
  if (!tile || tile.terrain !== 'floor' || tile.core)
    throw new Error(`Onward Hearthstone requires separate authored floor: ${definition.id}`);
  tile.onward = true;
  tile.designated = false;
  w.onwardHearth = { ...definition, discovered: tile.known, requested: false, progress: 0, ready: false };
}

export function damageHearth(w: World, amount: number) {
  const hearth = w.hearthState;
  if (w.outcome || !hearth || hearth.health <= 0 || amount <= 0) return;
  hearth.health = Math.max(0, hearth.health - amount);
  hearth.hitAt = w.elapsed;
  w.revision++;
  if (hearth.health > 0) return;
  w.outcome = 'defeat';
  if (w.onwardHearth) {
    w.onwardHearth.ready = false;
    w.onwardHearth.requested = false;
    w.onwardHearth.progress = 0;
    w.onwardHearth.worker = undefined;
  }
  for (const resident of w.agents) releaseJob(w, resident, 'The Stone Hearth was destroyed');
}

/** Natural attackers use the same physical reach, obstruction and cooldown as their melee attacks. */
export function tryAttackHearth(w: World, enemy: Enemy) {
  if (w.outcome || !w.hearthState || !enemy.sourceId || enemy.dormant || enemy.health <= 0) return false;
  const definition=enemyById(enemy.type);
  const target = w.tiles.find(
    (t) => t.core && Math.hypot(t.x - enemy.x, t.z - enemy.z) <= (definition.range??enemyBehaviorTuning.meleeReach) && spellLine(w, enemy, t),
  );
  if (!target) return false;
  enemy.activity = 'Attacking Stone Hearth';
  enemy.facing = Math.atan2(target.x - enemy.x, target.z - enemy.z);
  if (enemy.nextAttackAt <= w.elapsed) {
    damageHearth(w, definition.damage);
    enemy.attackedAt=w.elapsed;enemy.shotEnd=definition.range?{x:target.x,z:target.z}:undefined;
    enemy.nextAttackAt = w.elapsed + definition.attackSeconds / slowRate(w, enemy);
  }
  return true;
}

function siteThreatened(w: World) {
  const stone = w.onwardHearth;
  return (
    !!stone &&
    (w.enemies ?? []).some(
      (e) =>
        e.health > 0 &&
        Math.hypot(e.x - stone.x, e.z - stone.z) <= tuning.hearthThreatRadius &&
        spellLine(w, e, stone),
    )
  );
}

function interactionSquares(w: World) {
  return w.onwardHearth
    ? neighbors(w, w.onwardHearth).filter(
        (t) => canStand(w, t) && !t.wallPlanned && spellLine(w, t, w.onwardHearth!),
      )
    : [];
}

function eligible(w: World, a: Resident) {
  if(isAnimal(a.type))return false;
  if (
    !alive(a) ||
    a.morale?.leaving ||
    a.carrying ||
    a.energy < tuning.restThreshold ||
    a.hunger < tuning.hungerThreshold ||
    a.combatTarget !== undefined ||
    a.rallying ||
    (w.rally && a.capabilities.includes('fight'))
  )
    return false;
  if (a.job && ['eat', 'sleep', 'pay', 'collect', 'deliver', 'drop'].includes(a.job.kind)) return false;
  // A funded, reachable wage gets priority; unpaid debt cannot lock the level objective forever.
  if (a.pay?.due.length && ['due', 'collecting'].includes(wageStatus(w, a).state)) return false;
  return true;
}

function availableWork(w: World, a: Resident) {
  return nearest(a, interactionSquares(w)).filter(
    (t) =>
      !w.agents.some(
        (other) =>
          other !== a &&
          ((other.job && key(other.job.work) === key(t)) || Math.hypot(other.x - t.x, other.z - t.z) < 0.6),
      ),
  );
}

export function requestHearthActivation(w: World) {
  const stone = w.onwardHearth;
  if (w.outcome) return 'This level has ended. Restart to play again.';
  if (!stone || !tileAt(w, stone.x, stone.z)?.known) return 'Find the onward Hearthstone first.';
  stone.discovered = true;
  stone.requested = true;
  for (const a of w.agents) a.retry = 0;
  w.revision++;
  return 'Activation requested. An available dwarf will approach once the site is accessible and secure.';
}

export function shouldSeekHearth(w: World, a: Resident) {
  const stone = w.onwardHearth;
  if (
    w.outcome ||
    !stone?.requested ||
    !stone.discovered ||
    stone.ready ||
    stone.worker !== undefined ||
    !a.job ||
    a.job.kind === 'activate' ||
    !eligible(w, a) ||
    siteThreatened(w)
  )
    return false;
  return availableWork(w, a).some((p) => findPath(w, a, p));
}

export function chooseHearthJob(w: World, a: Resident) {
  const stone = w.onwardHearth;
  if (
    w.outcome ||
    !stone?.requested ||
    !stone.discovered ||
    stone.ready ||
    stone.worker !== undefined ||
    !eligible(w, a) ||
    siteThreatened(w)
  )
    return false;
  for (const p of availableWork(w, a))
    if (take(w, a, 'activate', stone, p)) {
      stone.worker = a.id;
      stone.progress = 0;
      w.revision++;
      return true;
    }
  return false;
}

export function validHearthJob(w: World, a: Resident) {
  const stone = w.onwardHearth,
    job = a.job;
  return (
    !w.outcome &&
    !!stone?.requested &&
    stone.discovered &&
    !stone.ready &&
    stone.worker === a.id &&
    job?.kind === 'activate' &&
    key(job.target) === key(stone) &&
    Math.abs(job.work.x - stone.x) + Math.abs(job.work.z - stone.z) === 1 &&
    canStand(w, job.work) &&
    !tileAt(w, job.work.x, job.work.z)?.wallPlanned &&
    spellLine(w, job.work, stone) &&
    eligible(w, a) &&
    !siteThreatened(w)
  );
}

export function cancelHearthWork(w: World, a: Resident) {
  const stone = w.onwardHearth;
  if (!stone || stone.worker !== a.id || stone.ready) return;
  stone.worker = undefined;
  stone.progress = 0;
  w.revision++;
}

export function tickHearth(w: World) {
  const stone = w.onwardHearth;
  if (w.outcome || !stone) return;
  if (!stone.discovered && tileAt(w, stone.x, stone.z)?.known) {
    stone.discovered = true;
    w.revision++;
  }
  if (stone.worker === undefined) return;
  const worker = w.agents.find((a) => a.id === stone.worker);
  if (worker && validHearthJob(w, worker)) return;
  if (worker?.job?.kind === 'activate') releaseJob(w, worker, 'Hearthstone activation interrupted');
  stone.worker = undefined;
  stone.progress = 0;
  w.revision++;
}

export function performHearthJob(w: World, a: Resident, dt: number) {
  if (!validHearthJob(w, a)) {
    releaseJob(w, a, 'Hearthstone activation interrupted');
    return false;
  }
  const stone = w.onwardHearth!,
    job = a.job!;
  if (
    Math.hypot(a.x - job.work.x, a.z - job.work.z) > tuning.arrivalDistance * 2 ||
    !spellLine(w, a, stone)
  ) {
    stone.progress = 0;
    return false;
  }
  a.activity = 'Activating onward Hearthstone';
  stone.progress = Math.min(tuning.hearthActivationSeconds, stone.progress + dt);
  // Finalize after enemy damage this tick, so a destroyed starting core can never win the race.
  return false;
}

export function finishHearth(w: World) {
  const stone = w.onwardHearth;
  if (w.outcome || !stone || stone.progress < tuning.hearthActivationSeconds) return;
  const worker = w.agents.find((a) => a.id === stone.worker);
  if (
    !worker ||
    !validHearthJob(w, worker) ||
    Math.hypot(worker.x - worker.job!.work.x, worker.z - worker.job!.work.z) > tuning.arrivalDistance * 2 ||
    !spellLine(w, worker, stone)
  )
    return;
  stone.ready = true;
  stone.requested = false;
  w.outcome = 'victory';
  for (const resident of w.agents) releaseJob(w, resident, 'The onward Hearthstone is ready');
  worker.activity = 'Onward Hearthstone activated';
  w.revision++;
}

export function hearthSummary(w: World) {
  const stone = w.onwardHearth,
    discovered = !!stone && (stone.discovered || !!tileAt(w, stone.x, stone.z)?.known);
  const worker = stone?.worker === undefined ? undefined : w.agents.find((a) => a.id === stone.worker);
  const accessible =
    discovered &&
    interactionSquares(w).some((p) =>
      w.agents.some((a) => alive(a) && !a.morale?.leaving && findPath(w, a, p)),
    );
  const status =
    w.outcome === 'defeat'
      ? 'The Stone Hearth was destroyed. Restart this stronghold.'
      : w.outcome === 'victory'
        ? 'The onward Hearthstone is ready. The runic route through this area is restored.'
        : !stone
          ? 'This test world has no onward Hearthstone.'
          : !discovered
            ? 'Find the onward Hearthstone in the hidden reaches of this area.'
            : !accessible
              ? 'Discovered, but no living dwarf has a route to an interaction square.'
              : siteThreatened(w)
                ? 'The site is contested. Clear nearby hostiles before activation.'
                : !stone.requested
                  ? 'The site is accessible. Request activation to send an available dwarf.'
                  : !worker
                    ? 'Waiting for an available dwarf; needs, wages and departure take priority.'
                    : stone.progress > 0
                      ? `Activating: ${Math.ceil(Math.max(0, tuning.hearthActivationSeconds - stone.progress))} seconds remaining.`
                      : 'A dwarf is approaching the onward Hearthstone.';
  return {
    health: w.hearthState?.health ?? 0,
    maxHealth: w.hearthState?.maxHealth ?? 0,
    available: !!stone,
    discovered,
    requested: stone?.requested ?? false,
    ready: stone?.ready ?? false,
    canRequest: discovered && !w.outcome && !stone?.requested,
    name: discovered ? stone!.name : 'Onward Hearthstone',
    status,
    progress: stone?.progress ?? 0,
    duration: tuning.hearthActivationSeconds,
    worker: stone?.worker,
  };
}
