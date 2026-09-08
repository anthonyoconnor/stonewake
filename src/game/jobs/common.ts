import { type World, type Resident, type Job, type Point, key } from '../types.ts';
import { findPath } from '../navigation.ts';
import { recordJob } from '../diagnostics.ts';
export function reserved(w: World, kind: Job['kind'], p: Point) {
  return w.agents.some((a) => a.job?.kind === kind && key(a.job.target) === key(p));
}
export function nearest<T extends Point>(a: Point, list: T[]) {
  return [...list].sort((p, q) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(a.x - q.x, a.z - q.z));
}
export function take(
  w: World,
  a: Resident,
  kind: Job['kind'],
  target: Point,
  work: Point,
  furnishing?: string,
) {
  const path = findPath(w, a, work);
  if (!path) {
    recordJob(w, a, 'rejected', 'No route to work square', target, furnishing, kind);
    return false;
  }
  a.job = {
    kind,
    target: { x: target.x, z: target.z },
    work: { x: work.x, z: work.z },
    progress: 0,
    furnishing,
  };
  a.path = path;
  a.retry = 0;
  recordJob(w, a, 'selected', 'Reachable job selected');
  return true;
}
export function storage(w: World, a: Resident) {
  return nearest(
    a,
    w.roomServices.filter((f) => f.service === 'storage' && f.stored < f.capacity),
  );
}
export function availableStorage(w: World, a: Resident) {
  return storage(w, a).find((f) => findPath(w, a, f.access));
}
export function availableStations(w: World, a: Resident, service: string) {
  return nearest(
    a,
    w.roomServices.filter(
      (f) =>
        f.service === service &&
        !(a.avoidFacility === f.id && (a.avoidUntil ?? 0) > w.elapsed) &&
        !w.agents.some((o) => o !== a && o.job?.furnishing === f.id),
    ),
  );
}
export function releaseJob(w: World, a: Resident, reason = 'Interrupted by combat or rally') {
  if (a.job) recordJob(w, a, 'released', reason);
  if (a.job?.kind === 'craft') {
    const order = w.craftOrders.find((o) => o.id === a.job!.order);
    if (order?.state === 'working') {
      order.state = 'queued';
      order.worker = undefined;
    }
  }
  if (a.job?.kind === 'research') {
    const order = w.researchOrders?.find((o) => o.id === a.job!.order);
    if (order?.state === 'working' && order.worker === a.id) {
      order.state = 'queued';
      order.worker = undefined;
    }
  }
  a.job = undefined;
  a.path = [];
}
