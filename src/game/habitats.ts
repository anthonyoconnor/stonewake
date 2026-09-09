import { enemyById } from '../content/enemies.ts';
import { type World, type Enemy, type Point } from './types.ts';
import { blocked, clearLine, findPath } from './navigation.ts';
import { passageFrom, type Walker } from './doors.ts';
import { slowRate } from './spell-effects.ts';

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);

/** Idle habitat movement cannot excavate, breach or leave its authored territory. */
export function tickHabitat(w: World, e: Enemy, dt: number, spikeAt: (w: World, e: Enemy) => void) {
  const h = e.habitat;
  if (!h) { e.activity = 'Guarding camp'; return; }
  const walker: Walker = enemyById(e.type).lavaWalker ? 'enemy-lava' : 'enemy';
  const resting = h.behavior === 'sentry' ? 'Watching the hall' : h.behavior === 'nest' ? 'Resting at nest' : 'Watching territory';
  if (h.behavior === 'sentry' && distance(e, h.home) < 0.05) {
    e.activity = resting;
    // Deliberate, restrained quarter-turns communicate watchfulness without aim jitter.
    if (w.elapsed >= h.nextMoveAt) {
      e.facing = (h.sequence++ % 4) * Math.PI / 2;
      h.nextMoveAt = w.elapsed + h.pauseSeconds;
    }
    return;
  }
  if (h.destination && distance(e, h.destination) < 0.05) {
    h.destination = undefined;
    h.nextMoveAt = w.elapsed + h.pauseSeconds;
  }
  if (!h.destination) {
    e.activity = resting;
    if (w.elapsed < h.nextMoveAt) return;
    if (distance(e, h.home) > h.radius || h.behavior === 'sentry' || (h.behavior === 'nest' && h.sequence % 2)) {
      h.destination = { ...h.home };
      h.sequence++;
    } else {
      const choices = (h.waypoints?.length ? h.waypoints : w.tiles)
        .filter(p => distance(p, h.home) <= h.radius && distance(p, e) > 0.9 && !blocked(w, p, undefined, { walker }))
        .sort((a, b) => a.z - b.z || a.x - b.x);
      // A deterministic stride varies local loops while keeping scenario resets repeatable.
      for (let i = 0; i < choices.length; i++) {
        const p = choices[(h.sequence * 7 + e.id * 3 + i) % choices.length];
        const path = findPath(w, e, p, walker);
        if (!path || path.some(step => distance(step, h.home) > h.radius)) continue;
        h.destination = { x: p.x, z: p.z };
        break;
      }
      h.sequence++;
    }
    if (!h.destination) { h.nextMoveAt = w.elapsed + h.pauseSeconds; return; }
  }
  const path = findPath(w, e, h.destination, walker);
  if (!path) { h.destination = undefined; h.nextMoveAt = w.elapsed + h.pauseSeconds; e.activity = resting; return; }
  let remaining = enemyById(e.type).speed * h.speedFraction * slowRate(w, e) * dt;
  e.activity = h.behavior === 'patrol' ? 'Patrolling territory' : h.behavior === 'nest' ? 'Circling nest' : 'Roaming territory';
  for (const p of path) {
    if (remaining <= 0) break;
    const dist = distance(e, p);
    if (dist < 0.001) continue;
    const step = Math.min(remaining, dist), dx = (p.x - e.x) / dist, dz = (p.z - e.z) / dist;
    const next = { x: e.x + dx * step, z: e.z + dz * step };
    if (!clearLine(w, e, next, passageFrom(w, e, walker))) break;
    if ((w.enemies ?? []).some(other => other !== e && other.health > 0 && distance(next, other) < 0.55)) {
      h.destination = undefined;
      h.nextMoveAt = w.elapsed + h.pauseSeconds;
      break;
    }
    e.facing = Math.atan2(dx, dz);
    e.x = next.x; e.z = next.z;
    remaining -= step;
    spikeAt(w, e);
    if (e.health <= 0 || e.pinnedUntil > w.elapsed) break;
  }
}
