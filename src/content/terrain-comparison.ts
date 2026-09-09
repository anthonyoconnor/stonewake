import { createWorld } from '../game/world.ts';
import { buildRoom } from '../game/rooms.ts';
import { planBridges, finishBridge } from '../game/bridges.ts';
import { bridgeSettings } from '../game/terrain.ts';
import { lightingDefaults } from './lighting.ts';
import { tileAt, type World, type Terrain } from '../game/types.ts';

export const terrainComparisonName = 'Terrain Comparison Studio';
export const terrainComparisonSplit = 18;
export const isTerrainComparison = (world: World) => world.name === terrainComparisonName;
const rect = (x: number, z: number, width: number, depth: number) =>
  Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));
export const terrainComparisonViews = [
  { id: 'overview', name: 'Whole chamber', x: 17.5, z: 13, radius: 39 },
  { id: 'terrain', name: 'Terrain & resources', x: 17.5, z: 4.5, radius: 32 },
  { id: 'rooms', name: 'Room floors & furnishings', x: 17.5, z: 13.5, radius: 32 },
  { id: 'hazards', name: 'Water, lava & bridges', x: 17.5, z: 22, radius: 32 },
];

/** Mirrored specimens; rooms and decks use normal validation, costs and completion services. */
export function createTerrainComparison(free = false) {
  const seams: Array<{ terrain: Terrain; cells: Array<{ x: number; z: number }> }> = [];
  for (const offset of [0, terrainComparisonSplit]) {
    for (const [i, terrain] of (['dirt', 'rock', 'bedrock', 'gold', 'gem'] as const).entries())
      seams.push({ terrain, cells: rect(offset + 2 + i * 3, 3, 2, 3) });
    for (const [i, terrain] of (['water', 'lava', 'chasm'] as const).entries())
      seams.push({ terrain, cells: rect(offset + 2 + i * 5, 21, 3, 3) });
  }
  const world = createWorld({
    id: 'terrain-comparison',
    name: terrainComparisonName,
    width: 36,
    height: 26,
    hearth: { x: 17, z: 23 },
    openings: [[1, 1, 34, 24]],
    seams,
  });
  world.biome = 'upper';
  world.allowance = 50000;
  world.freeRoomBuilding = free;
  for (const tile of world.tiles) {
    tile.known = true;
    tile.claimed = tile.terrain === 'floor';
  }
  for (const offset of [0, terrainComparisonSplit]) {
    for (const point of rect(offset + 9, 7, 7, 2)) tileAt(world, point.x, point.z)!.claimed = false;
    for (const [i, type] of ['treasure', 'dormitory', 'kitchen', 'workshop', 'training', 'library'].entries())
      buildRoom(world, type, rect(offset + 2 + (i % 3) * 5, 10 + Math.floor(i / 3) * 5, 3, 3));
    for (const x of [offset + 3, offset + 8]) {
      const cells = rect(x, 21, 1, 3);
      planBridges(world, cells);
      // The archive opens with completed exhibits, through the same completion path as worker jobs.
      for (const point of cells) {
        const tile = tileAt(world, point.x, point.z)!;
        if (!tile.bridgePlanned) throw new Error('Terrain studio bridge failed normal placement validation.');
        tile.bridgeProgress = bridgeSettings.seconds;
        finishBridge(world, tile);
      }
    }
  }
  world.lightingTest = {
    ...lightingDefaults,
    ambient: 0.58,
    rim: 0.6,
    glow: 0.3,
    sourceStrength: 0,
    pointer: false,
  };
  world.revision++;
  return world;
}
