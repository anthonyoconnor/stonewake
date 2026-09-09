import type { World, Tile } from '../game/types.ts';

/** Shared, editable presentation palette. Geology keeps its gameplay identity in every biome. */
export const environmentPalettes = {
  upper: {
    earth: '#96744f',
    rock: '#818780',
    ground: '#99784f',
    sky: '#cad6db',
    rim: '#ffe2b4',
    growth: '#b49a69',
    ambient: 0.38,
    directional: 0.34,
  },
  fungal: {
    earth: '#7c7559',
    rock: '#687f7d',
    ground: '#7d7759',
    sky: '#b0d9d0',
    rim: '#dbc8dc',
    growth: '#7ed4c0',
    ambient: 0.36,
    directional: 0.3,
  },
  ancient: {
    earth: '#8c795d',
    rock: '#75808c',
    ground: '#887d6b',
    sky: '#bccbdd',
    rim: '#e3d4bc',
    growth: '#8393a4',
    ambient: 0.35,
    directional: 0.32,
  },
  crystal: {
    earth: '#857474',
    rock: '#788393',
    ground: '#817985',
    sky: '#bac9ec',
    rim: '#d9c5ea',
    growth: '#7dabe1',
    ambient: 0.36,
    directional: 0.32,
  },
  volcanic: {
    earth: '#937057',
    rock: '#726c72',
    ground: '#886c58',
    sky: '#d0bec7',
    rim: '#ffd0a3',
    growth: '#b8794f',
    ambient: 0.34,
    directional: 0.31,
  },
};

export const environmentDetail = { floorDebrisModulo: 7, growthModulo: 11, ruinDebrisModulo: 3 };
export function environmentPalette(w: World) {
  return environmentPalettes[w.biome ?? 'upper'];
}
/** Decoration is seeded by position and only occupies the edge beside real, visible terrain. */
export function hasBiomeGrowth(w: World, t: Tile) {
  return (
    t.known &&
    t.terrain === 'floor' &&
    !t.claimed &&
    !t.core &&
    !t.ruin &&
    (t.x * 7 + t.z * 13) % environmentDetail.growthModulo === 0 &&
    (w.biome === 'fungal' || w.biome === 'crystal')
  );
}
