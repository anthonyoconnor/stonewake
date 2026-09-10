import type { World, Tile, Point } from '../game/types.ts';
import {
  environmentRegionAt,
  type EnvironmentRegionKind,
} from './environment-regions.ts';

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
/** Shared materials distinguish local places without recoloring rooms, resources or owned floor. */
export const environmentRegionPalettes: Record<EnvironmentRegionKind, typeof environmentPalettes.upper> = {
  dry: { ...environmentPalettes.upper, earth: '#9a805e', rock: '#89887c', ground: '#9b8665' },
  damp: {
    ...environmentPalettes.fungal,
    earth: '#70765d',
    rock: '#627776',
    ground: '#697969',
    growth: '#809e73',
  },
  fungal: {
    ...environmentPalettes.fungal,
    earth: '#746856',
    rock: '#546d70',
    ground: '#6f7058',
    growth: '#8fbbd1',
  },
  masonry: {
    ...environmentPalettes.ancient,
    earth: '#897969',
    rock: '#879099',
    ground: '#9a998d',
    growth: '#a3a69b',
  },
  crystal: {
    ...environmentPalettes.crystal,
    earth: '#777386',
    rock: '#737f95',
    ground: '#777b8c',
    growth: '#c9b6e6',
  },
  scorched: {
    ...environmentPalettes.volcanic,
    earth: '#796255',
    rock: '#56565d',
    ground: '#6e625c',
    growth: '#7d6254',
  },
};
export function environmentPalette(w: World, p?: Point) {
  const region = p && environmentRegionAt(w, p);
  if (region) return environmentRegionPalettes[region.kind];
  return environmentPalettes[w.biome ?? 'upper'];
}
/** Original predicate retained for permanent baseline renderers. Live regions use environmentDecoration. */
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
