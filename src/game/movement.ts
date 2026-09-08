import { type World, type Resident } from './types.ts';
import { findPath, clearLine } from './navigation.ts';
import { tuning } from '../content/tuning.ts';
import { characterById } from '../content/characters.ts';
import { openDoorsForDwarf } from './doors.ts';
import { hasteRate } from './spell-effects.ts';
import { releaseJob } from './jobs/common.ts';
export function moveResident(w: World, a: Resident, dt: number) {
  const target = a.path[0];
  if (!target) return true;
  const dx = target.x - a.x,
    dz = target.z - a.z,
    d = Math.hypot(dx, dz),
    step = Math.min(d, tuning.speed * (characterById(a.type)?.speedMultiplier ?? 1) * hasteRate(w, a) * dt);
  if (d < tuning.arrivalDistance) {
    a.path.shift();
    if (a.job) {
      a.job.lastDistance = undefined;
      a.job.stalled = 0;
    }
    return !a.path.length;
  }
  if (a.job) {
    a.job.stalled =
      a.job.lastDistance !== undefined && d > a.job.lastDistance - 0.002 ? (a.job.stalled ?? 0) + dt : 0;
    a.job.lastDistance = d;
    if ((a.job.stalled ?? 0) > tuning.stallSeconds) {
      a.avoidFacility = a.job.furnishing;
      a.avoidUntil = w.elapsed + tuning.facilityRetry;
      releaseJob(w, a, 'Movement stalled; facility retry delayed');
      a.retry = 0.25;
      return false;
    }
  }
  let vx = dx / d,
    vz = dz / d;
  for (const other of w.agents)
    if (other !== a) {
      const ox = a.x - other.x,
        oz = a.z - other.z,
        dist = Math.hypot(ox, oz);
      if (dist > 0 && dist < tuning.avoidanceRadius) {
        const weight = (1 - dist / tuning.avoidanceRadius) * tuning.avoidanceStrength;
        vx += (ox / dist) * weight;
        vz += (oz / dist) * weight;
        if (ox * dx + oz * dz < 0) {
          vx += (dz / d) * weight;
          vz -= (dx / d) * weight;
        }
      }
    }
  const norm = Math.hypot(vx, vz) || 1;
  let next = { x: a.x + (vx / norm) * step, z: a.z + (vz / norm) * step };
  // Avoid residents when space allows, but never let avoidance stop forward progress.
  // Terrain and shut barriers remain solid even while residents briefly overlap.
  if (!clearLine(w, a, next) || Math.hypot(target.x - next.x, target.z - next.z) > d - step * 0.25)
    next = { x: a.x + (dx / d) * step, z: a.z + (dz / d) * step };
  if (!clearLine(w, a, next)) {
    const path = a.job && findPath(w, a, a.job.work);
    if (path) a.path = path;
    else releaseJob(w, a, 'Movement obstructed and no replacement route');
    return false;
  }
  openDoorsForDwarf(w, a, next);
  a.x = next.x;
  a.z = next.z;
  a.facing = Math.atan2(vx, vz);
  a.retry = 0;
  a.activity = a.carrying ? 'Carrying gold' : 'Walking to work';
  return false;
}
