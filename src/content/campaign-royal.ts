import type { LevelDefinition } from '../game/types.ts';
import { col, ellipse, path, polygon, rect, row, transformRuin, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { ruinTemplates } from './ruins.ts';
import { camp, entrance } from './level-encounters.ts';

const hearth = { x: 14, z: 18 };
const settlement = settlementBlueprint(hearth);
// Bent seams follow the safe chamber's northern shoulder and southern lip, outside all room plans.
settlement.gold = [
  { x: 10, z: 12 }, { x: 11, z: 12 }, { x: 12, z: 12 }, { x: 13, z: 12 },
  { x: 13, z: 11 }, { x: 14, z: 11 }, { x: 15, z: 11 }, { x: 16, z: 11 },
  { x: 18, z: 12 }, { x: 19, z: 12 }, { x: 19, z: 13 }, { x: 20, z: 13 }, { x: 20, z: 14 },
  { x: 12, z: 23 }, { x: 12, z: 24 }, { x: 13, z: 24 }, { x: 14, z: 24 },
  { x: 15, z: 24 }, { x: 16, z: 24 }, { x: 17, z: 24 }, { x: 18, z: 24 },
];
settlement.development = union(settlement.development, settlement.gold);

const moltenBasin = polygon([
  { x: 31, z: 1 }, { x: 35, z: 1 }, { x: 33, z: 11 }, { x: 35, z: 18 },
  { x: 44, z: 23 }, { x: 48, z: 30 }, { x: 47, z: 37 }, { x: 43, z: 43 },
  { x: 42, z: 48 }, { x: 39, z: 58 }, { x: 33, z: 58 }, { x: 34, z: 49 },
  { x: 30, z: 43 }, { x: 27, z: 36 }, { x: 28, z: 29 }, { x: 31, z: 23 },
  { x: 31, z: 18 }, { x: 29, z: 11 },
]);
const westShelves = union(
  ellipse(26, 16, 3, 4), path([{ x: 26, z: 16 }, { x: 30, z: 16 }], 2),
  ellipse(24, 35, 6, 10), path([{ x: 24, z: 41 }, { x: 29, z: 44 }], 3),
);
const royalBanks = union(
  ellipse(43, 16, 9, 6), path([{ x: 43, z: 17 }, { x: 46, z: 24 }, { x: 54, z: 25 }], 4),
  ellipse(56, 31, 11, 9),
  polygon([{ x: 48, z: 27 }, { x: 61, z: 27 }, { x: 65, z: 35 }, { x: 59, z: 41 }, { x: 50, z: 40 }, { x: 48, z: 34 }]),
  ellipse(49, 46, 9, 7), path([{ x: 52, z: 44 }, { x: 54, z: 35 }], 3),
  ellipse(62, 48, 6, 5), path([{ x: 58, z: 44 }, { x: 61, z: 47 }], 2),
);

/** M40: a river-fed molten basin separates the settlement from three royal peninsulas. */
export const royalLevel: LevelDefinition = {
  id: 'campaign-royal-deep', name: 'Royal Deep', biome: 'volcanic', width: 72, height: 60, hearth,
  onwardHearth: { id: 'royal-deep-relay', name: 'Royal Deep onward Hearthstone', x: 54, z: 36 },
  openings: [[12, 16, 16, 20]],
  seams: [
    { terrain: 'floor', cells: union(westShelves, royalBanks) },
    { terrain: 'lava', cells: moltenBasin },
    { terrain: 'bedrock', cells: union(
      path([{ x: 5, z: 10 }, { x: 7, z: 7 }, { x: 17, z: 5 }, { x: 24, z: 8 }], 2),
      ellipse(35, 29, 2, 3), ellipse(40, 37, 1, 2),
      path([{ x: 57, z: 20 }, { x: 60, z: 23 }, { x: 63, z: 24 }], 2),
      path([{ x: 61, z: 38 }, { x: 64, z: 41 }, { x: 68, z: 42 }], 2),
    ) },
    { terrain: 'rock', cells: union(
      ellipse(20, 39, 1, 2), ellipse(46, 34, 2, 2),
      [{ x: 48, z: 18 }, { x: 50, z: 19 }, { x: 59, z: 32 }, { x: 46, z: 48 }, { x: 60, z: 49 }],
    ) },
    { terrain: 'gold', cells: union(
      settlement.gold, row(24, 16, 5), col(24, 30, 5),
      row(49, 24, 4), row(44, 44, 4), col(54, 40, 3),
      path([{ x: 56, z: 29 }, { x: 59, z: 28 }, { x: 61, z: 29 }]),
      path([{ x: 59, z: 51 }, { x: 62, z: 52 }, { x: 64, z: 51 }]),
    ) },
    { terrain: 'gem', cells: [{ x: 63, z: 49 }] },
  ],
  ruins: [
    transformRuin(ruinTemplates.foundry, { x: 48, z: 46 }, 'royal-foundry'),
    transformRuin(ruinTemplates.archive, { x: 59, z: 33 }, 'royal-record-hall', 1),
  ],
  environmentRegions: [
    { id: 'sheltered-west-approach', kind: 'dry', cells: ellipse(14, 18, 12, 13) },
    { id: 'molten-basin-margins', kind: 'scorched', cells: ellipse(35, 31, 17, 27) },
    { id: 'civic-bridgehead', kind: 'masonry', cells: ellipse(43, 16, 10, 7) },
    { id: 'broken-royal-avenue', kind: 'masonry', cells: union(path([{ x: 43, z: 18 }, { x: 54, z: 27 }], 6), rect(50, 26, 9, 12)) },
    { id: 'charred-east-halls', kind: 'scorched', cells: ellipse(61, 28, 7, 6) },
    { id: 'ceremonial-relay-court', kind: 'masonry', cells: ellipse(55, 36, 6, 5) },
    { id: 'foundry-peninsula', kind: 'masonry', cells: ellipse(49, 46, 8, 6) },
    { id: 'untouched-gem-recess', kind: 'crystal', cells: ellipse(63, 48, 5, 5) },
  ],
  encounters: [
    camp('royal-watch', 'Royal bridgehead and relay watch', 'volcanic', [{ x: 46, z: 19 }, { x: 56, z: 32 }], ['cinderling', 'deepmaw'], 'raid'),
    camp('molten-gem-lair', 'Remote molten gem recess', 'volcanic', [{ x: 62, z: 47 }], ['cinderling']),
    // Cinderlings reach either bank over lava; workers must build the separate suppression spur.
    entrance('royal-raids', 'volcanic', { x: 43, z: 31 }, ['cinderling'], 660),
  ],
};

export const royalPlan: LevelPlayPlan = {
  settlement,
  intended: [{ x: 18, z: 18 }, { x: 18, z: 16 }, { x: 39, z: 16 }, { x: 46, z: 16 }, { x: 46, z: 24 }, { x: 54, z: 24 }, { x: 54, z: 36 }],
  alternate: [{ x: 18, z: 22 }, { x: 24, z: 22 }, { x: 24, z: 44 }, { x: 54, z: 44 }, { x: 54, z: 36 }],
  suppression: [{ x: 54, z: 36 }, { x: 54, z: 31 }, { x: 43, z: 31 }],
  defenses: union(rect(23, 14, 4, 3), rect(22, 38, 3, 3), rect(36, 15, 3, 3)),
};
