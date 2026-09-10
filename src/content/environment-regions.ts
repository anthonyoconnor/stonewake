import { neighbors, type Point, type Tile, type World } from '../game/types.ts';

export type EnvironmentRegionKind = 'dry' | 'damp' | 'fungal' | 'masonry' | 'crystal' | 'scorched';
/** Authored presentation only: never supplies terrain, visibility, collision or room capacity. */
export interface EnvironmentRegion {
  id: string;
  kind: EnvironmentRegionKind;
  cells: Point[];
}

const indexes = new WeakMap<World, { regions: EnvironmentRegion[]; cells: Map<string, EnvironmentRegion> }>();

/** Later regions win overlaps. Replace the array when changing regions in a live debug world. */
export function environmentRegionAt(w: World, p: Point) {
  if (!w.environmentRegions?.length) return undefined;
  let index = indexes.get(w);
  if (index?.regions !== w.environmentRegions) {
    const cells = new Map<string, EnvironmentRegion>();
    for (const region of w.environmentRegions)
      for (const cell of region.cells) cells.set(`${cell.x},${cell.z}`, region);
    index = { regions: w.environmentRegions, cells };
    indexes.set(w, index);
  }
  return index.cells.get(`${p.x},${p.z}`);
}

export function environmentMaterialVariant(w: World, p: Point) {
  const region = environmentRegionAt(w, p);
  return region ? `local_${region.kind}` : (w.biome ?? 'upper');
}

export interface EnvironmentDecoration {
  kind: EnvironmentRegionKind;
  edge: Tile;
  variant: number;
  authored: boolean;
}

/** One sparse cluster on a discovered bank or shore; no objects in open cave centers. */
export function environmentDecoration(w: World, t: Tile): EnvironmentDecoration | undefined {
  if (!t.known || t.terrain !== 'floor' || t.claimed || t.core || t.onward || t.room || t.ruin) return;
  const region = environmentRegionAt(w, t);
  const kind = region?.kind ?? (w.biome === 'fungal' || w.biome === 'crystal' ? w.biome : undefined);
  if (!kind) return;
  const seed = ((t.x * 73856093) ^ (t.z * 19349663)) >>> 0;
  if (region) {
    // A low-frequency patch field gives colonies and bare stretches instead of uniform noise.
    const patch = (Math.floor(t.x / 4) * 19 + Math.floor(t.z / 4) * 7) % 11;
    const density = kind === 'fungal' ? 6 : kind === 'damp' ? 5 : 4;
    if (patch >= density || seed % (kind === 'fungal' ? 2 : 3) !== 0) return;
  } else if ((t.x * 7 + t.z * 13) % 11 !== 0) return;
  const edge = neighbors(w, t).find(
    (n) =>
      n.known &&
      (['dirt', 'rock', 'bedrock'].includes(n.terrain) ||
        (region && ['damp', 'fungal', 'scorched'].includes(kind) && ['water', 'lava'].includes(n.terrain))),
  );
  if (!edge) return;
  return { kind, edge, variant: seed % 5, authored: !!region };
}
