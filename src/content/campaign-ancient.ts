import type { LevelDefinition } from '../game/types.ts';
import { col, ellipse, path, polygon, rect, row, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { camp, entrance } from './level-encounters.ts';

const hearth = { x: 27, z: 34 };
const settlement = settlementBlueprint(hearth);
// Broken mineral intrusions flank the settlement without opening the civic avenue.
settlement.gold = union(
  path([{ x: 21, z: 29 }, { x: 22, z: 31 }, { x: 22, z: 34 }]),
  path([{ x: 24, z: 27 }, { x: 26, z: 28 }, { x: 28, z: 28 }]),
  path([{ x: 34, z: 35 }, { x: 35, z: 37 }, { x: 34, z: 39 }, { x: 34, z: 40 }]),
);
settlement.development = union(rect(23, 27, 11, 14), settlement.gold);

const streets = union(
  rect(26, 12, 3, 14), rect(23, 18, 9, 6),
  rect(10, 20, 17, 3), rect(31, 19, 19, 3),
  rect(17, 10, 27, 2), rect(17, 11, 2, 11),
  rect(42, 11, 2, 10),
);
const foundryCourts = union(rect(11, 19, 6, 5), rect(16, 22, 5, 4), rect(11, 24, 5, 4));
const barracksCourts = union(rect(36, 15, 6, 5), rect(41, 18, 5, 7));
const watchPrecinct = union(rect(22, 6, 11, 7), rect(20, 12, 6, 3));
const intrusions = union(
  polygon([{ x: 3, z: 7 }, { x: 7, z: 5 }, { x: 13, z: 7 }, { x: 15, z: 11 }, { x: 12, z: 14 }, { x: 7, z: 13 }, { x: 5, z: 17 }, { x: 2, z: 18 }]),
  polygon([{ x: 31, z: 13 }, { x: 34, z: 11 }, { x: 39, z: 13 }, { x: 39, z: 16 }, { x: 36, z: 18 }, { x: 34, z: 17 }]),
  polygon([{ x: 44, z: 6 }, { x: 48, z: 5 }, { x: 52, z: 9 }, { x: 50, z: 14 }, { x: 47, z: 16 }, { x: 44, z: 12 }]),
  polygon([{ x: 5, z: 30 }, { x: 11, z: 29 }, { x: 15, z: 31 }, { x: 19, z: 35 }, { x: 16, z: 39 }, { x: 11, z: 36 }, { x: 6, z: 38 }]),
  polygon([{ x: 39, z: 31 }, { x: 42, z: 29 }, { x: 48, z: 31 }, { x: 51, z: 37 }, { x: 48, z: 41 }, { x: 42, z: 39 }]),
);

/** M38: connected civic streets and service courts interrupted by geological fractures. */
export const ancientLevel: LevelDefinition = {
  id: 'campaign-fallen-city', name: 'Fallen City', biome: 'ancient', width: 56, height: 46, hearth,
  onwardHearth: { id: 'fallen-city-relay', name: 'Fallen City onward Hearthstone', x: 26, z: 8 },
  openings: [[25, 32, 29, 36]],
  seams: [
    { terrain: 'floor', cells: union(streets, foundryCourts, barracksCourts, watchPrecinct, ellipse(49, 22, 3, 3)) },
    { terrain: 'bedrock', cells: intrusions },
    // Collapsed intersections preserve the street plan without opening every district at once.
    { terrain: 'rock', cells: union(rect(17, 16, 2, 2), rect(21, 20, 2, 3), rect(38, 19, 2, 3), [{ x: 23, z: 11 }, { x: 31, z: 7 }]) },
    { terrain: 'gold', cells: union(settlement.gold,
      path([{ x: 16, z: 12 }, { x: 15, z: 15 }, { x: 18, z: 17 }]),
      path([{ x: 35, z: 25 }, { x: 37, z: 27 }, { x: 40, z: 27 }]),
      row(21, 5, 7)) },
  ],
  ruins: [
    { id: 'city-foundry', name: 'Foundry service court', rooms: [
      { type: 'workshop', cells: union(rect(12, 20, 4, 2), col(12, 22, 2)) },
      { type: 'kitchen', cells: rect(17, 23, 3, 2) },
      { type: 'treasure', cells: rect(12, 25, 3, 2) },
    ] },
    { id: 'city-watch-barracks', name: 'Eastern watch barracks', rooms: [
      { type: 'training', cells: rect(37, 18, 4, 2) },
      { type: 'dormitory', cells: union(rect(42, 20, 3, 2), col(42, 22, 2)) },
    ] },
    { id: 'city-civic-watch', name: 'Civic watch antechamber', rooms: [
      { type: 'training', cells: union(rect(21, 12, 3, 2), [{ x: 21, z: 14 }]) },
      { type: 'treasure', cells: rect(29, 7, 2, 2) },
    ] },
  ],
  environmentRegions: [
    { id: 'southern-excavations', kind: 'dry', cells: ellipse(27, 34, 13, 10) },
    { id: 'civic-streets', kind: 'masonry', cells: union(rect(24, 10, 7, 17), rect(8, 18, 44, 6), rect(16, 8, 29, 6), rect(15, 12, 5, 12)) },
    { id: 'foundry-district', kind: 'masonry', cells: union(rect(9, 18, 13, 11), rect(15, 13, 5, 8)) },
    { id: 'foundry-scorched-workbay', kind: 'scorched', cells: rect(10, 18, 7, 7) },
    { id: 'watch-barracks', kind: 'masonry', cells: union(rect(35, 14, 8, 8), rect(40, 17, 8, 10)) },
    { id: 'civic-precinct', kind: 'masonry', cells: rect(20, 4, 15, 12) },
    { id: 'western-fracture', kind: 'dry', cells: union(intrusions, ellipse(13, 12, 4, 6)) },
    { id: 'eastern-deep-passage', kind: 'damp', cells: ellipse(49, 22, 4, 4) },
  ],
  encounters: [
    camp('city-watch', 'Civic avenue watch', 'ancient', [{ x: 28, z: 9 }, { x: 31, z: 12 }], ['restless-guard', 'ancient-sentinel'], 'raid'),
    camp('foundry-watch', 'Foundry court watch', 'ancient', [{ x: 11, z: 20 }], ['restless-guard']),
    entrance('city-raids', 'ancient', { x: 49, z: 22 }, ['restless-guard'], 780),
  ],
};

export const ancientPlan: LevelPlayPlan = {
  settlement,
  intended: [{ x: 27, z: 27 }, { x: 27, z: 20 }, { x: 27, z: 11 }, { x: 26, z: 11 }, { x: 26, z: 8 }],
  alternate: [{ x: 23, z: 29 }, { x: 18, z: 29 }, { x: 18, z: 25 }, { x: 15, z: 25 }, { x: 15, z: 21 }, { x: 18, z: 21 }, { x: 18, z: 11 }, { x: 26, z: 11 }, { x: 26, z: 8 }],
  suppression: [{ x: 27, z: 11 }, { x: 27, z: 20 }, { x: 43, z: 20 }, { x: 49, z: 20 }, { x: 49, z: 22 }],
  defensesByApproach: { intended: rect(26, 27, 3, 2), alternate: rect(21, 28, 3, 2) },
};
