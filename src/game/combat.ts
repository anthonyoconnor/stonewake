import { type World, type Resident, type Point } from './types.ts';
import { findPath, canStand } from './navigation.ts';
import { alive, hasteRate, damageEnemy, spellLine, visible } from './spell-effects.ts';
import { characterStats, gainExperience } from './progression.ts';
import { tuning } from '../content/tuning.ts';
import { securityState } from './security.ts';
export const combatDefaults = { noticeRadius: 6, reach: 1.05, criticalNeed: 0.1 };
type JobRelease = (w: World, a: Resident) => void;
type Move = (w: World, a: Resident, dt: number) => boolean;
export function tickFighter(w: World, a: Resident, dt: number, release: JobRelease, move: Move) {
  const fighter = a.capabilities.includes('fight');
  const dog = fighter && a.capabilities.includes('scout');
  a.responding = false;
  if (!fighter && !a.capabilities.includes('defend')) return false;
  const distance = (p: Point) => Math.hypot(a.x - p.x, a.z - p.z);
  const rally = fighter ? w.rally : undefined;
  // Critical needs temporarily release the rally until the chosen service finishes.
  if (a.energy < combatDefaults.criticalNeed || a.hunger < combatDefaults.criticalNeed) a.recovering = true;
  if (a.recovering && a.energy > 0.3 && a.hunger > 0.3 && a.job?.kind !== 'eat' && a.job?.kind !== 'sleep')
    a.recovering = false;
  const enemies = (w.enemies ?? []).filter(
    (e) => e.health > 0 && visible(w, e) && (dog || spellLine(w, a, e)),
  );
  const options = enemies
    .filter(
      (e) =>
        (distance(e) <= combatDefaults.reach && spellLine(w, a, e)) ||
        (fighter &&
          !a.recovering &&
          (dog || distance(e) <= combatDefaults.noticeRadius) &&
          (!rally || Math.hypot(e.x - rally.x, e.z - rally.z) <= rally.radius)),
    )
    .sort(
      (p, q) =>
        (dog ? Number(q.id === a.combatTarget) - Number(p.id === a.combatTarget) : 0) ||
        (dog
          ? Number(w.elapsed - (q.attackedAt ?? -Infinity) < 5) -
            Number(w.elapsed - (p.attackedAt ?? -Infinity) < 5)
          : 0) ||
        distance(p) - distance(q) ||
        p.id - q.id,
    );
  const guard = dog ? (a.guard ??= { checked: {}, repathAt: 0 }) : undefined;
  let target: (typeof options)[number] | undefined, route: Point[] | undefined;
  for (const e of options) {
    if (distance(e) <= combatDefaults.reach && spellLine(w, a, e)) {
      target = e;
      break;
    }
    if (!dog) {
      target = e;
      break;
    }
    route =
      a.combatTarget === e.id && a.path.length && w.elapsed < guard!.repathAt
        ? a.path
        : findPath(w, a, { x: Math.round(e.x), z: Math.round(e.z) });
    if (route) {
      target = e;
      break;
    }
  }
  if (target) {
    if (a.job) release(w, a);
    a.rallying = !!rally;
    a.rallyUnreachable = false;
    a.combatTarget = target.id;
    a.facing = Math.atan2(target.x - a.x, target.z - a.z);
    if (distance(target) <= combatDefaults.reach && spellLine(w, a, target)) {
      a.path = [];
      a.activity = 'Fighting';
      if ((a.nextAttackAt ?? 0) <= w.elapsed) {
        const stats = characterStats(a),
          before = target.health;
        damageEnemy(w, target, stats.damage, 'dwarf');
        a.attackedAt = w.elapsed;
        a.nextAttackAt = w.elapsed + stats.attackSeconds / hasteRate(w, a);
        if (target.health < before)
          gainExperience(w, a, stats.attackSeconds * tuning.combatExperienceRate, 'combat');
      }
    } else {
      if (dog) {
        a.path = route ?? [];
        if (w.elapsed >= guard!.repathAt) guard!.repathAt = w.elapsed + 0.75;
        a.responding = true;
      } else a.path = findPath(w, a, { x: Math.round(target.x), z: Math.round(target.z) }) ?? [];
      move(w, a, dt);
      a.activity = a.path.length ? (dog ? 'Running to defend' : 'Approaching enemy') : 'Enemy unreachable';
    }
    return true;
  }
  if (a.combatTarget !== undefined) {
    a.path = [];
    a.combatTarget = undefined;
    a.retry = 0;
  }
  if (dog && !rally && !a.recovering) {
    const alerts = securityState(w)
      .alerts.filter(
        (alert) =>
          w.elapsed - alert.at < tuning.securityMemorySeconds &&
          (guard!.checked[alert.id] ?? -Infinity) < alert.at,
      )
      .sort((p, q) => distance(p) - distance(q));
    for (const alert of alerts) {
      if (distance(alert) < 1.5 || (alert.id === 'hearth' && distance(alert) < 3)) {
        guard!.checked[alert.id] = alert.at;
        continue;
      }
      const spots = w.tiles
        .filter(
          (t) =>
            Math.hypot(t.x - alert.x, t.z - alert.z) < (alert.id === 'hearth' ? 3 : 1.5) && canStand(w, t),
        )
        .sort((p, q) => distance(p) - distance(q));
      let path =
        guard!.alert === alert.id && a.path.length && w.elapsed < guard!.repathAt ? a.path : undefined;
      if (!path)
        for (const p of spots) {
          path = findPath(w, a, p);
          if (path) break;
        }
      if (!path) {
        guard!.checked[alert.id] = alert.at;
        continue;
      }
      if (a.job) release(w, a);
      guard!.alert = alert.id;
      if (w.elapsed >= guard!.repathAt) guard!.repathAt = w.elapsed + 0.75;
      a.path = path;
      a.responding = true;
      move(w, a, dt);
      a.activity = 'Investigating threat report';
      return true;
    }
    for (const id of Object.keys(guard!.checked))
      if (!securityState(w).alerts.some((alert) => alert.id === id)) delete guard!.checked[id];
  }
  if (rally && !a.recovering) {
    if (a.job) release(w, a);
    a.rallying = true;
    const routeToRally = findPath(w, a, rally);
    if (!routeToRally) {
      a.path = [];
      a.rallyUnreachable = true;
      a.activity = 'Rally unreachable';
      return true;
    }
    if (distance(rally) <= rally.radius + 0.06 && !a.path.length) {
      a.activity = 'Holding rally';
      a.rallyUnreachable = false;
      return true;
    }
    if (!a.path.length || w.routesChanged) {
      const spots = w.tiles
        .filter(
          (t) =>
            Math.hypot(t.x - rally.x, t.z - rally.z) <= Math.max(0, rally.radius - 0.1) &&
            canStand(w, t) &&
            !w.agents.some(
              (o) =>
                o !== a &&
                alive(o) &&
                (Math.hypot(o.x - t.x, o.z - t.z) < 0.65 ||
                  (o.job && o.job.work.x === t.x && o.job.work.z === t.z)),
            ),
        )
        .sort((p, q) => distance(p) - distance(q));
      for (const spot of spots) {
        const path = findPath(w, a, spot);
        if (path) {
          a.path = path;
          break;
        }
      }
    }
    a.rallyUnreachable = !a.path.length;
    if (a.path.length) move(w, a, dt);
    a.activity = a.rallyUnreachable ? 'Rally unreachable' : 'Answering Call to Arms';
    return true;
  }
  if (a.rallying) {
    a.path = [];
    a.rallying = false;
    a.rallyUnreachable = false;
    a.retry = 0;
  }
  return false;
}
