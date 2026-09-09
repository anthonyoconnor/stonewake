import { roomFurnishingPlans } from '../content/room-visuals.ts';
import { type World, type Furnishing, type Point, key, tileAt, neighbors } from './types.ts';

/** Layout has no collision or service reservations. Retain valid objects when expanding. */
export function decorateRoom(w: World, room: string, tiles: Point[], previous: Furnishing[]) {
  const plan = roomFurnishingPlans[room];
  if (!plan) return undefined; // Registered extensions can keep the ordinary furnishing fallback.
  const ids = new Set(tiles.map(key)),
    budget = Math.floor(tiles.length * plan.coverage);
  const placed: Furnishing[] = [],
    occupied = new Set<string>(),
    approaches = new Set<string>();
  const add = (f: Furnishing) => {
    placed.push(f);
    f.cells.forEach((p) => occupied.add(key(p)));
    approaches.add(key(f.access));
  };
  for (const f of previous) {
    const variant = plan.items.find((v) => v.kind === f.kind && (v.model ?? v.kind) === (f.model ?? f.kind));
    if (
      !variant ||
      placed.filter((p) => p.kind === f.kind).length >= variant.limit ||
      occupied.size + f.cells.length > budget ||
      !ids.has(key(f.access)) ||
      occupied.has(key(f.access)) ||
      f.cells.some((p) => !ids.has(key(p)) || occupied.has(key(p)) || approaches.has(key(p)))
    )
      continue;
    // Promote a compact fallback once its full-size counterpart fits the enlarged footprint.
    const primary = plan.items.find((v) => v.kind === f.kind);
    if (
      primary &&
      primary !== variant &&
      primary.width * primary.depth + occupied.size <= budget &&
      tiles.some((t) =>
        [0, 1].some((rotation) => {
          const width = rotation ? primary.depth : primary.width,
            depth = rotation ? primary.width : primary.depth;
          return Array.from({ length: width * depth }, (_, i) => ({
            x: t.x + (i % width),
            z: t.z + Math.floor(i / width),
          })).every((p) => ids.has(key(p)) && !occupied.has(key(p)) && !approaches.has(key(p)));
        }),
      )
    )
      continue;
    add(f);
  }
  const center = {
    x: tiles.reduce((s, p) => s + p.x, 0) / tiles.length,
    z: tiles.reduce((s, p) => s + p.z, 0) / tiles.length,
  };
  for (const variant of plan.items) {
    while (placed.filter((f) => f.kind === variant.kind).length < variant.limit) {
      const choices: { furnishing: Furnishing; score: number }[] = [];
      for (const t of tiles)
        for (const rotation of variant.width === variant.depth ? [0] : [0, 1]) {
          const width = rotation ? variant.depth : variant.width,
            depth = rotation ? variant.width : variant.depth;
          const cells = Array.from({ length: width * depth }, (_, i) => ({
            x: t.x + (i % width),
            z: t.z + Math.floor(i / width),
          }));
          if (
            occupied.size + cells.length > budget ||
            cells.some((p) => !ids.has(key(p)) || occupied.has(key(p)) || approaches.has(key(p)))
          )
            continue;
          const own = new Set(cells.map(key));
          const x = t.x + (width - 1) / 2,
            z = t.z + (depth - 1) / 2;
          // Local fronts point along -z. Face the open room, retaining rotation for footprint size.
          const acrossX =
              variant.width === variant.depth ? Math.abs(center.x - x) > Math.abs(center.z - z) : !!rotation,
            facing = acrossX ? (center.x > x ? -Math.PI / 2 : Math.PI / 2) : center.z > z ? Math.PI : 0,
            front = { x: Math.round(-Math.sin(facing)), z: Math.round(-Math.cos(facing)) };
          const accessChoices = cells
            .flatMap((p) => neighbors(w, p))
            .filter((p) => ids.has(key(p)) && !own.has(key(p)) && !occupied.has(key(p)));
          accessChoices.sort(
            (a, b) =>
              (b.x - x) * front.x + (b.z - z) * front.z - ((a.x - x) * front.x + (a.z - z) * front.z) ||
              Math.hypot(a.x - center.x, a.z - center.z) - Math.hypot(b.x - center.x, b.z - center.z),
          );
          const access = accessChoices[0];
          if (!access) continue;
          const edge = cells.reduce(
            (sum, p) => sum + neighbors(w, p).filter((n) => !ids.has(key(n))).length,
            0,
          );
          const distance = placed.length
            ? Math.min(...placed.flatMap((f) => f.cells.map((p) => Math.hypot(x - p.x, z - p.z))))
            : Math.hypot(x - center.x, z - center.z);
          const back = cells.filter((p) => !ids.has(key({ x: p.x - front.x, z: p.z - front.z }))).length;
          const perpendicular = placed.some((f) => f.kind === variant.kind && f.rotation !== rotation);
          const score =
            variant.placement === 'edge'
              ? back * 10 +
                (perpendicular ? 3 : 0) +
                distance * 0.35 -
                Math.hypot(x - center.x, z - center.z) * 0.5
              : variant.placement === 'center'
                ? -Math.hypot(x - center.x, z - center.z)
                : distance - edge * 0.9;
          choices.push({
            score,
            furnishing: {
              id: `${room}:${key(t)}`,
              room,
              kind: variant.kind,
              model: variant.model ?? variant.kind,
              x: t.x,
              z: t.z,
              rotation,
              facing,
              cells,
              access: { x: access.x, z: access.z },
            },
          });
        }
      choices.sort(
        (a, b) => b.score - a.score || a.furnishing.z - b.furnishing.z || a.furnishing.x - b.furnishing.x,
      );
      if (!choices.length) break;
      add(choices[0].furnishing);
    }
  }
  return placed;
}

export interface LiveRoomDecoration extends Furnishing {
  storedGold?: number;
  goldCapacity?: number;
  residentType?: string;
  residentId?: number;
  scale?: number;
}

/** A read-only picture of actual wealth and assigned accommodation, never gameplay state. */
export function liveRoomDecorations(w: World): LiveRoomDecoration[] {
  const result: LiveRoomDecoration[] = [];
  const residents = new Map(w.agents.filter((a) => (a.health ?? 1) > 0).map((a) => [a.id, a]));
  const beds = w.roomServices.filter((s) => s.service === 'rest');
  for (const s of beds) {
    const a = s.assigned === undefined ? undefined : residents.get(s.assigned);
    if (!a || !tileAt(w, s.x, s.z)?.known) continue;
    const slots = beds.filter((b) => b.x === s.x && b.z === s.z),
      index = slots.indexOf(s),
      columns = Math.ceil(Math.sqrt(slots.length));
    const scale = 1 / columns,
      x = s.x + (((index % columns) + 0.5) / columns - 0.5),
      z = s.z + ((Math.floor(index / columns) + 0.5) / columns - 0.5);
    result.push({
      id: `resident-bed:${s.id}`,
      room: s.room,
      kind: 'resident-bed',
      model: 'resident-bed',
      x,
      z,
      rotation: 0,
      cells: [{ x: s.x, z: s.z }],
      access: s.access,
      residentType: a.type,
      residentId: a.id,
      scale,
    });
  }
  const remaining = new Map(
    w.roomServices.filter((s) => s.room === 'treasure' && s.service === 'storage').map((s) => [key(s), s]),
  );
  while (remaining.size) {
    const first = remaining.values().next().value!,
      component = [first];
    remaining.delete(key(first));
    for (let i = 0; i < component.length; i++)
      for (const p of neighbors(w, component[i])) {
        const s = remaining.get(key(p));
        if (s) {
          component.push(s);
          remaining.delete(key(s));
        }
      }
    component.sort((a, b) => a.z - b.z || a.x - b.x);
    let gold = component.reduce((sum, s) => sum + s.stored, 0);
    for (const s of component) {
      const storedGold = Math.min(gold, s.capacity);
      gold -= storedGold;
      if (storedGold <= 0 || !tileAt(w, s.x, s.z)?.known) continue;
      result.push({
        id: `gold-pile:${s.id}`,
        room: s.room,
        kind: 'gold-pile',
        model: 'gold-pile',
        x: s.x,
        z: s.z,
        rotation: 0,
        cells: [{ x: s.x, z: s.z }],
        access: s.access,
        storedGold,
        goldCapacity: s.capacity,
      });
    }
  }
  return result;
}
