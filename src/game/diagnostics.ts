import { type World, type Resident, type Point } from './types.ts';
import { findPath } from './navigation.ts';

export interface JobEvent {
  at: number;
  resident: number;
  event: 'selected' | 'rejected' | 'released' | 'completed' | 'waiting';
  reason: string;
  job?: string;
  target?: Point;
  furnishing?: string;
}

// Opt-in, bounded and outside gameplay state. Normal play allocates no history.
const histories = new WeakMap<World, JobEvent[]>();
export function enableDiagnostics(world: World) {
  if (!histories.has(world)) histories.set(world, []);
}
export function recordJob(
  world: World,
  resident: Resident,
  event: JobEvent['event'],
  reason: string,
  target = resident.job?.target,
  furnishing = resident.job?.furnishing,
  job = resident.job?.kind,
) {
  const history = histories.get(world);
  if (!history) return;
  history.push({
    at: world.elapsed,
    resident: resident.id,
    event,
    reason,
    job,
    target: target && { ...target },
    furnishing,
  });
  if (history.length > 300) history.shift();
}
export function recentEvents(world: World, resident?: number) {
  return structuredClone(
    (histories.get(world) ?? []).filter((e) => resident === undefined || e.resident === resident),
  );
}
export function inspectResident(world: World, id: number) {
  const resident = world.agents.find((a) => a.id === id);
  if (!resident) return undefined;
  return {
    ...structuredClone(resident),
    destinationReachable: resident.job ? !!findPath(world, resident, resident.job.work) : null,
    services: world.roomServices.map((f) => {
      const reservedBy = world.agents
        .filter((a) => a.id !== id && a.job?.furnishing === f.id)
        .map((a) => a.id);
      const reasons: string[] = [];
      if (!findPath(world, resident, f.access)) reasons.push('No route to access square');
      if (reservedBy.length) reasons.push('Room capacity slot reserved');
      if (f.assigned && f.assigned !== id) reasons.push('Assigned to another resident');
      if (resident.avoidFacility === f.id && (resident.avoidUntil ?? 0) > world.elapsed)
        reasons.push('Retry delay after movement stall');
      return {
        id: f.id,
        service: f.service,
        access: { ...f.access },
        stored: f.stored,
        capacity: f.capacity,
        reservedBy,
        reasons,
      };
    }),
    history: recentEvents(world, id).slice(-30),
  };
}
export function diagnosticSnapshot(world: World) {
  return {
    name: world.name,
    elapsed: world.elapsed,
    revision: world.revision,
    residents: world.agents.map((a) => inspectResident(world, a.id)),
    craftOrders: structuredClone(world.craftOrders),
    researchOrders: structuredClone(world.researchOrders ?? []),
    defenses: structuredClone(world.defenses ?? []),
    recentEvents: recentEvents(world).slice(-60),
  };
}
