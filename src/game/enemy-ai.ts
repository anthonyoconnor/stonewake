import { enemyById, enemyBehaviorTuning as balance } from '../content/enemies.ts';
import {
  type World,
  type Enemy,
  type Resident,
  type Point,
  type Defense,
  type Tile,
  tileAt,
  key,
  neighbors,
} from './types.ts';
import { doorIsOpen, isDoor, passageFrom, type Walker } from './doors.ts';
import { blocked, clearLine, findPath } from './navigation.ts';
import {
  alive,
  health,
  maxHealth,
  slowRate,
  damageResident,
  damageBarrier,
  spellLine,
} from './spell-effects.ts';
import { tryAttackHearth } from './hearth.ts';
import { terrainWalkable } from './terrain.ts';

export const enemyWalker = (type?: string, breach = false): Walker =>
  enemyById(type).lavaWalker ? (breach ? 'breach-lava' : 'enemy-lava') : breach ? 'breach' : 'enemy';
export const burrowable = (t: Tile) => !t.core && !t.onward && (t.terrain === 'dirt' || t.terrain === 'rock');
export const burrowSeconds = (t: Tile) =>
  (t.terrain === 'rock' ? balance.burrow.rockSeconds : balance.burrow.dirtSeconds) *
  (t.reinforced ? balance.burrow.reinforcedMultiplier : 1);
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);

/** Cardinal route through eligible earth only. Excavation is costed, never a teleport. */
export function burrowPath(w: World, start: Point, end: Point): Point[] | undefined {
  const s = { x: Math.round(start.x), z: Math.round(start.z) },
    pending = [s];
  const cost = new Map([[key(s), 0]]),
    previous = new Map<string, Point>();
  while (pending.length) {
    pending.sort((a, b) => cost.get(key(b))! - cost.get(key(a))!);
    const p = pending.pop()!;
    if (key(p) === key(end)) {
      const result: Point[] = [];
      let current = p;
      while (key(current) !== key(s)) {
        result.unshift(current);
        current = previous.get(key(current))!;
      }
      return result;
    }
    for (const t of neighbors(w, p)) {
      if (t.core || t.onward || (!terrainWalkable(t) && !burrowable(t))) continue;
      const next = cost.get(key(p))! + (burrowable(t) ? burrowSeconds(t) : 1),
        old = cost.get(key(t));
      if (old !== undefined && old <= next) continue;
      cost.set(key(t), next);
      previous.set(key(t), p);
      if (!pending.some((p) => key(p) === key(t))) pending.push({ x: t.x, z: t.z });
    }
  }
}

function slowResident(w: World, a: Resident, id: string, seconds: number, strength: number) {
  a.effects ??= [];
  a.effects = a.effects.filter((e) => e.id !== id);
  a.effects.push({ id, kind: 'slow', startedAt: w.elapsed, until: w.elapsed + seconds, strength });
}
function attack(w: World, e: Enemy, a: Resident, damage: number, ranged = false) {
  damageResident(w, a, damage);
  e.attackedAt = w.elapsed;
  e.shotEnd = ranged ? { x: a.x, z: a.z } : undefined;
}
function special(w: World, e: Enemy, victim: Resident) {
  const def = enemyById(e.type),
    range = distance(e, victim);
  if ((e.abilityReadyAt ?? 0) > w.elapsed) return false;
  if (def.ability === 'web' && range <= balance.web.range) {
    e.activity = 'Spitting web';
    e.facing = Math.atan2(victim.x - e.x, victim.z - e.z);
    attack(w, e, victim, balance.web.damage, true);
    slowResident(w, victim, 'spider-web', balance.web.slowSeconds, balance.web.slowStrength);
    e.abilityReadyAt = w.elapsed + def.abilitySeconds!;
    e.nextAttackAt = w.elapsed + balance.web.recoverySeconds;
    return true;
  }
  if (def.ability === 'spores' && range <= balance.spores.range) {
    e.activity = 'Releasing spores';
    e.attackedAt = w.elapsed;
    for (const a of w.agents)
      if (alive(a) && distance(e, a) <= balance.spores.range && spellLine(w, e, a)) {
        damageResident(w, a, balance.spores.damage);
        slowResident(w, a, 'spore-cloud', balance.spores.slowSeconds, balance.spores.slowStrength);
      }
    e.abilityReadyAt = w.elapsed + def.abilitySeconds!;
    e.nextAttackAt = w.elapsed + balance.spores.recoverySeconds;
    return true;
  }
  if (
    def.ability === 'charge' &&
    range > balance.charge.minRange &&
    range <= balance.charge.maxRange &&
    clearLine(w, e, victim, passageFrom(w, e, enemyWalker(e.type)))
  ) {
    e.chargeUntil = w.elapsed + balance.charge.seconds;
    e.abilityReadyAt = w.elapsed + def.abilitySeconds!;
  }
  return false;
}
function selectVictim(w: World, e: Enemy) {
  const candidates = w.agents.filter(
    (a) =>
      alive(a) &&
      distance(e, a) <= (enemyById(e.type).senseRange ?? balance.senseRange) &&
      spellLine(w, e, a),
  );
  return candidates.sort((a, b) =>
    enemyById(e.type).ability === 'charge'
      ? health(a) / maxHealth(a) - health(b) / maxHealth(b) || distance(e, a) - distance(e, b)
      : distance(e, a) - distance(e, b) || a.id - b.id,
  )[0];
}

export function tickEnemies(
  w: World,
  dt: number,
  spikeAt: (w: World, e: Enemy) => void,
  hitDoor: (w: World, d: Defense, damage: number) => void,
) {
  for (const e of w.enemies ?? []) {
    if (w.outcome) break;
    if (e.health <= 0) continue;
    spikeAt(w, e);
    if (e.health <= 0) continue;
    if (e.dormant) {
      e.activity = 'Guarding camp';
      continue;
    }
    if (e.pinnedUntil > w.elapsed) {
      if (e.activity !== 'Pinned by spikes') e.activity = 'Stunned';
      continue;
    }
    const def = enemyById(e.type),
      victim = selectVictim(w, e);
    if (victim && special(w, e, victim)) continue;
    if (victim && distance(victim, e) <= (def.range ?? balance.meleeReach)) {
      e.activity = def.range ? 'Firing at dwarf' : 'Attacking dwarf';
      e.facing = Math.atan2(victim.x - e.x, victim.z - e.z);
      if (e.nextAttackAt <= w.elapsed) {
        const charging = (e.chargeUntil ?? 0) > w.elapsed;
        attack(w, e, victim, def.damage * (charging ? balance.charge.damageMultiplier : 1), !!def.range);
        e.chargeUntil = undefined;
        if (def.ability === 'cleave')
          for (const a of w.agents)
            if (
              a !== victim &&
              alive(a) &&
              distance(e, a) <= balance.cleave.range &&
              spellLine(w, e, a) &&
              (a.x - e.x) * (victim.x - e.x) + (a.z - e.z) * (victim.z - e.z) > 0
            )
              damageResident(w, a, def.damage * balance.cleave.damageFraction);
        e.nextAttackAt = w.elapsed + def.attackSeconds / slowRate(w, e);
      }
      continue;
    }
    if (tryAttackHearth(w, e)) continue;
    const charging = (e.chargeUntil ?? 0) > w.elapsed,
      walker = enemyWalker(e.type);
    let remaining = def.speed * slowRate(w, e) * dt * (charging ? balance.charge.speedMultiplier : 1);
    const destination = victim ? { x: Math.round(victim.x), z: Math.round(victim.z) } : e.target;
    const path =
      findPath(w, e, destination, walker) ??
      findPath(w, e, destination, enemyWalker(e.type, true)) ??
      (def.ability === 'burrow' ? burrowPath(w, e, destination) : undefined);
    if (!path) {
      e.activity = 'No route';
      e.digging = undefined;
      continue;
    }
    e.activity = charging ? 'Charging' : 'Approaching';
    while (remaining > 0 && path.length) {
      const p = path[0],
        dx = p.x - e.x,
        dz = p.z - e.z,
        dist = distance(p, e);
      if (dist < 0.001) {
        path.shift();
        continue;
      }
      e.facing = Math.atan2(dx, dz);
      const tile = tileAt(w, p.x, p.z);
      if (tile && burrowable(tile) && def.ability === 'burrow') {
        if (!e.digging || key(e.digging) !== key(tile)) e.digging = { x: tile.x, z: tile.z, progress: 0 };
        e.activity = tile.reinforced ? 'Excavating reinforced wall' : 'Tunneling';
        e.digging.progress += dt * slowRate(w, e);
        e.attackedAt = w.elapsed;
        if (e.digging.progress >= burrowSeconds(tile)) {
          tile.terrain = 'floor';
          tile.reinforced = false;
          tile.claimed = false;
          tile.designated = false;
          tile.wallPlanned = false;
          tile.wallProgress = undefined;
          e.digging = undefined;
          w.routesChanged = true;
          w.revision++;
        }
        break;
      }
      e.digging = undefined;
      const step = Math.min(0.1, dist, remaining),
        next = { x: e.x + (dx / dist) * step, z: e.z + (dz / dist) * step };
      if (!clearLine(w, e, next, passageFrom(w, e, walker))) {
        const door = w.defenses
          ?.filter(
            (d) =>
              isDoor(d) &&
              !doorIsOpen(w, d) &&
              distance(d, e) < 1.2 &&
              (d.x - e.x) * dx + (d.z - e.z) * dz > 0,
          )
          .sort((a, b) => distance(a, e) - distance(b, e))[0];
        const barrier =
          w.barrier && distance(w.barrier, e) < 1.2 && (w.barrier.x - e.x) * dx + (w.barrier.z - e.z) * dz > 0
            ? w.barrier
            : undefined;
        e.activity = door ? 'Breaking down door' : barrier ? 'Breaking runic barrier' : 'Blocked';
        if ((door || barrier) && e.nextAttackAt <= w.elapsed) {
          const damage = def.damage * (def.doorMultiplier ?? 1);
          if (door) hitDoor(w, door, damage);
          else damageBarrier(w, damage);
          e.attackedAt = w.elapsed;
          e.nextAttackAt = w.elapsed + def.attackSeconds / slowRate(w, e);
        }
        break;
      }
      e.x = next.x;
      e.z = next.z;
      remaining -= step;
      spikeAt(w, e);
      if (!e.health || e.pinnedUntil > w.elapsed) break;
    }
    if (e.health > 0 && distance(e, e.target) < 0.05)
      e.activity = e.sourceId ? 'Holding Hearth approach' : 'Reached test target';
  }
}
