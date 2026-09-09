import { key, type World, type Tile } from '../game/types';
import { roomFloors } from '../content/room-visuals';

/** Finite material variants: boundary bands follow the footprint, medallions span actual tiles. */
export function roomFloorMaterials(w: World) {
  const room = (t: Tile | undefined) =>
    t?.known && t.terrain === 'floor' ? (t.room ?? t.ruin?.room) : undefined;
  const remaining = new Map(w.tiles.filter((t) => room(t) && roomFloors[room(t)!]).map((t) => [key(t), t]));
  const result = new Map<string, string>();
  const occupied = new Set(w.furnishings.flatMap((f) => f.cells.map(key)));
  while (remaining.size) {
    const first = remaining.values().next().value!,
      id = room(first)!;
    const component = [first];
    remaining.delete(key(first));
    for (let i = 0; i < component.length; i++) {
      const t = component[i];
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const next = remaining.get(key({ x: t.x + dx, z: t.z + dz }));
        if (next && room(next) === id && !!next.room === !!first.room) {
          remaining.delete(key(next));
          component.push(next);
        }
      }
    }
    const cells = new Set(component.map(key)),
      center = {
        x: component.reduce((s, t) => s + t.x, 0) / component.length,
        z: component.reduce((s, t) => s + t.z, 0) / component.length,
      };
    const patch = (t: Tile) =>
      Array.from({ length: 9 }, (_, i) => key({ x: t.x + (i % 3) - 1, z: t.z + Math.floor(i / 3) - 1 }));
    const candidates = component.filter((t) => patch(t).every((p) => cells.has(p)));
    const score = (t: Tile) =>
      Math.hypot(t.x - center.x, t.z - center.z) + patch(t).filter((p) => occupied.has(p)).length * 1.5;
    candidates.sort((a, b) => score(a) - score(b) || a.z - b.z || a.x - b.x);
    const motif = ['kitchen', 'library'].includes(id)
      ? (candidates[0] ??
        [...component].sort(
          (a, b) => Math.hypot(a.x - center.x, a.z - center.z) - Math.hypot(b.x - center.x, b.z - center.z),
        )[0])
      : undefined;
    for (const t of component) {
      // CreateBox top UVs: canvas x follows world z, canvas y follows world x.
      const mask = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ].reduce((bits, [dx, dz], i) => bits | (cells.has(key({ x: t.x + dx, z: t.z + dz })) ? 0 : 1 << i), 0);
      const corners = [
        [-1, -1],
        [-1, 1],
        [1, 1],
        [1, -1],
      ].reduce(
        (bits, [dx, dz], i) =>
          bits |
          (!cells.has(key({ x: t.x + dx, z: t.z + dz })) &&
          cells.has(key({ x: t.x + dx, z: t.z })) &&
          cells.has(key({ x: t.x, z: t.z + dz }))
            ? 1 << i
            : 0),
        0,
      );
      const dx = motif ? t.x - motif.x : 9,
        dz = motif ? t.z - motif.z : 9;
      const medallion =
        motif && Math.abs(dx) <= (candidates.length ? 1 : 0) && Math.abs(dz) <= (candidates.length ? 1 : 0)
          ? candidates.length
            ? `${dz}_${dx}`
            : 's'
          : 'n';
      result.set(
        key(t),
        `${t.room ? '' : 'ruin-'}floor-${id}~${mask}.${(t.x + t.z) & 1}.${medallion}.${corners}`,
      );
    }
  }
  return result;
}
