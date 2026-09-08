import { type World, type Resident, key } from './types.ts';
import { reachable } from './navigation.ts';

// Food and accommodation support residents continuously, rather than letting
// one square support an unlimited population through successive visits.
export function assignRoomSupport(w: World) {
  const routes = new Map<number, Set<string>>();
  const components: Set<string>[] = [];
  for (const a of w.agents) {
    const position = key({ x: Math.round(a.x), z: Math.round(a.z) });
    let component = components.find((cells) => cells.has(position));
    if (!component) {
      component = reachable(w, a);
      components.push(component);
    }
    routes.set(a.id, component);
  }
  for (const service of ['rest', 'dining']) {
    const slots = w.roomServices.filter((f) => f.service === service);
    const assigned = new Set<number>();
    for (const slot of slots) {
      if (slot.assigned === undefined) continue;
      if (!routes.get(slot.assigned)?.has(key(slot.access)) || assigned.has(slot.assigned))
        slot.assigned = undefined;
      else assigned.add(slot.assigned);
    }
    for (const a of w.agents) {
      if (assigned.has(a.id)) continue;
      const slot = slots
        .filter((f) => f.assigned === undefined && routes.get(a.id)?.has(key(f.access)))
        .sort((f, g) => Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(a.x - g.x, a.z - g.z))[0];
      if (slot) slot.assigned = a.id;
    }
  }
}

export function foodSupport(w: World, resident: Resident) {
  return w.roomServices.find((f) => f.service === 'dining' && f.assigned === resident.id);
}
