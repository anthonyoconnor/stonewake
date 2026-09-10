import type { Point } from '../game/types.ts';
import type { RuinDefinition } from './ruins.ts';

/** Tile-center shapes for authored seams. These never carve or discover a live world. */
export const row = (x: number, z: number, count: number): Point[] =>
  Array.from({ length: count }, (_, i) => ({ x: x + i, z }));
export const col = (x: number, z: number, count: number): Point[] =>
  Array.from({ length: count }, (_, i) => ({ x, z: z + i }));
export const rect = (x: number, z: number, width: number, depth: number): Point[] =>
  Array.from({ length: width * depth }, (_, i) => ({ x: x + i % width, z: z + Math.floor(i / width) }));

/** New point objects prevent a reused shape from coupling two definitions. */
export function union(...shapes: Point[][]): Point[] {
  const result = new Map<string, Point>();
  for (const points of shapes) for (const p of points) result.set(`${p.x},${p.z}`, { ...p });
  return [...result.values()];
}

/** Include tile centers on the ellipse boundary; zero radii form lines or a point. */
export function ellipse(cx: number, cz: number, rx: number, rz: number): Point[] {
  const result: Point[] = [];
  for (let z = Math.ceil(cz - rz); z <= Math.floor(cz + rz); z++) {
    for (let x = Math.ceil(cx - rx); x <= Math.floor(cx + rx); x++) {
      const dx = rx ? (x - cx) / rx : x === cx ? 0 : Infinity;
      const dz = rz ? (z - cz) / rz : z === cz ? 0 : Infinity;
      if (dx * dx + dz * dz <= 1 + 1e-9) result.push({ x, z });
    }
  }
  return result;
}

/** Fill a simple, possibly concave polygon through integer tile-center vertices. */
export function polygon(vertices: Point[]): Point[] {
  if (vertices.length < 3) return path(vertices);
  const result: Point[] = [];
  const xs = vertices.map(p => p.x), zs = vertices.map(p => p.z);
  for (let z = Math.ceil(Math.min(...zs)); z <= Math.floor(Math.max(...zs)); z++) {
    for (let x = Math.ceil(Math.min(...xs)); x <= Math.floor(Math.max(...xs)); x++) {
      let inside = false, boundary = false;
      for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const a = vertices[j], b = vertices[i];
        const cross = (x - a.x) * (b.z - a.z) - (z - a.z) * (b.x - a.x);
        if (cross === 0 && x >= Math.min(a.x, b.x) && x <= Math.max(a.x, b.x)
          && z >= Math.min(a.z, b.z) && z <= Math.max(a.z, b.z)) boundary = true;
        if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) inside = !inside;
      }
      if (inside || boundary) result.push({ x, z });
    }
  }
  return result;
}

/** Cardinally connected stair steps follow each segment, including diagonal waypoints.
 * Width stamps square cells; even widths extend one extra tile toward positive axes.
 * Combine differently sized segments with union() to vary a passage's width. */
export function path(waypoints: Point[], width = 1): Point[] {
  if (!waypoints.length || width < 1) return [];
  const centerline: Point[] = [{ ...waypoints[0] }];
  for (let i = 1; i < waypoints.length; i++) {
    let { x, z } = waypoints[i - 1];
    const b = waypoints[i], nx = Math.abs(b.x - x), nz = Math.abs(b.z - z);
    const sx = Math.sign(b.x - x), sz = Math.sign(b.z - z);
    let ix = 0, iz = 0;
    while (ix < nx || iz < nz) {
      if (ix < nx && (iz === nz || (1 + 2 * ix) * nz < (1 + 2 * iz) * nx)) { x += sx; ix++; }
      else { z += sz; iz++; }
      centerline.push({ x, z });
    }
  }
  const offset = Math.floor((width - 1) / 2);
  return union(...centerline.map(p => rect(p.x - offset, p.z - offset, width, width)));
}

/** Rotate/mirror local room arrangements before placing them. Origin is the local (0,0),
 * not the transformed bounding box, so adjoining authored streets keep their anchors. */
export function transformRuin(template: RuinDefinition, origin: Point, id = template.id, quarterTurns = 0, mirror = false): RuinDefinition {
  const turns = ((quarterTurns % 4) + 4) % 4;
  return { ...template, id, rooms: template.rooms.map(room => ({ ...room, cells: room.cells.map(p => {
    let x = mirror ? -p.x : p.x, z = p.z;
    for (let turn = 0; turn < turns; turn++) [x, z] = [-z, x];
    return { x: x + origin.x, z: z + origin.z };
  }) })) };
}
