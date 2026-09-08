import type { Tile } from './types.ts';

export const hazardDefinitions = {
  water: { name: 'Water', bridgeable: true, color: '#286e86' },
  lava: { name: 'Lava', bridgeable: true, color: '#df5423' },
  chasm: { name: 'Chasm', bridgeable: false, color: '#101323' },
};
export const isHazard = (t: Tile) => Object.hasOwn(hazardDefinitions, t.terrain);
export const bridgeable = (t: Tile) =>
  isHazard(t) && hazardDefinitions[t.terrain as keyof typeof hazardDefinitions].bridgeable;
export const terrainWalkable = (t: Tile) => t.terrain === 'floor' || (isHazard(t) && !!t.bridge);
export const terrainOpaque = (t: Tile) => t.terrain !== 'floor' && !isHazard(t);
export const bridgeSettings = { cost: 20, seconds: 8 };
