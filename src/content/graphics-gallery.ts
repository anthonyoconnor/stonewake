import { characterById } from './characters.ts';
import { enemyDefinitions } from './enemies.ts';
import { createWorld } from '../game/world.ts';
import { lightingDefaults } from './lighting.ts';
import type { World } from '../game/types.ts';

export const graphicsGalleryName = 'Character Before & After Gallery';
export const graphicsGalleryEntries = [
  ...['stonehand', 'miner', 'engineer', 'warrior', 'runesmith', 'cave-hound'].map((id) => ({
    id,
    name: characterById(id)!.name,
    kind: 'resident' as const,
  })),
  ...enemyDefinitions.map((e) => ({ id: e.id, name: e.name, kind: 'enemy' as const })),
].map((entry, i) => ({
  ...entry,
  x: 4.5 + (i % 4) * 4.5,
  z: 5 + Math.floor(i / 4) * 5,
  pedestal: entry.id === 'stonehand' ? 1 : 1.78,
  spacing: entry.id === 'stonehand' ? 0.58 : 0.96,
  radius: entry.id === 'stonehand' ? 3.6 : 5.7,
  targetHeight: entry.id === 'stonehand' ? 0.34 : 0.65,
}));

export function isGraphicsGallery(world: World) {
  return world.name === graphicsGalleryName;
}

/** A presentation chamber with ordinary claimed floor; exhibits never enter the simulation. */
export function createGraphicsGallery(freeRoomBuilding = false) {
  const world = createWorld({
    id: 'graphics-gallery',
    name: graphicsGalleryName,
    width: 24,
    height: 26,
    hearth: { x: 2, z: 23 },
    openings: [[2, 2, 21, 23]],
    seams: [],
  });
  for (const tile of world.tiles) {
    tile.known = true;
    tile.claimed = tile.terrain === 'floor';
  }
  world.freeRoomBuilding = freeRoomBuilding;
  // Position-independent illumination makes both members of every pair comparable.
  world.lightingTest = {
    ...lightingDefaults,
    ambient: 0.72,
    rim: 0.68,
    glow: 0.24,
    sourceStrength: 0,
    pointer: false,
  };
  return world;
}
