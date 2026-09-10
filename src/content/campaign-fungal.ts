import type { LevelDefinition } from '../game/types.ts';
import { ellipse, path, polygon, rect, row, transformRuin, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { camp, entrance } from './level-encounters.ts';

const hearth = { x: 10, z: 12 };
const settlement = settlementBlueprint(hearth);
// Short mineral hooks follow the dry shelf, leaving every service footprint clear.
settlement.gold = [
  { x: 6, z: 6 }, { x: 7, z: 6 }, { x: 8, z: 6 }, { x: 9, z: 6 }, { x: 9, z: 5 },
  { x: 10, z: 5 }, { x: 11, z: 5 }, { x: 12, z: 5 }, { x: 13, z: 5 },
  { x: 5, z: 9 }, { x: 6, z: 9 }, { x: 6, z: 10 }, { x: 7, z: 10 }, { x: 7, z: 11 }, { x: 7, z: 12 },
  { x: 8, z: 17 }, { x: 8, z: 18 }, { x: 9, z: 18 }, { x: 10, z: 18 }, { x: 11, z: 18 }, { x: 12, z: 18 },
];
settlement.development = union(settlement.development, settlement.gold);
const upperShelf = union(
  ellipse(28, 9, 9, 4),
  path([{ x: 34, z: 8 }, { x: 40, z: 12 }, { x: 40, z: 17 }], 3),
);
const basin = union(
  ellipse(31, 20, 12, 10),
  ellipse(28, 30, 13, 7),
  ellipse(37, 31, 6, 5),
);
const waystation = union(
  ellipse(13, 26, 6, 5),
  ellipse(21, 31, 8, 5),
  path([{ x: 17, z: 25 }, { x: 19, z: 29 }, { x: 22, z: 33 }], 3),
);
const pools = union(ellipse(27, 18, 8, 5), ellipse(31, 23, 4, 6), ellipse(26, 29, 6, 4));
const mineralSpurs = union(
  polygon([{ x: 20, z: 11 }, { x: 23, z: 12 }, { x: 25, z: 15 }, { x: 23, z: 15 }, { x: 21, z: 13 }]),
  ellipse(28, 20, 2, 2),
  ellipse(28, 28, 1, 2),
  path([{ x: 37, z: 17 }, { x: 38, z: 19 }, { x: 37, z: 21 }], 2),
);

/** M37: joined cavern lobes around a pool basin, approached from two sealed dry shelves. */
export const fungalLevel: LevelDefinition = {
  id: 'campaign-fungal-hollows', name: 'Fungal Hollows', biome: 'fungal', width: 48, height: 40, hearth,
  onwardHearth: { id: 'fungal-hollows-relay', name: 'Fungal Hollows onward Hearthstone', x: 34, z: 31 },
  openings: [[8, 10, 12, 14]],
  seams: [
    { terrain: 'floor', cells: union(upperShelf, basin, waystation, ellipse(41, 34, 3, 2)) },
    { terrain: 'water', cells: pools },
    { terrain: 'bedrock', cells: mineralSpurs },
    { terrain: 'rock', cells: union(
      path([{ x: 6, z: 20 }, { x: 4, z: 24 }, { x: 6, z: 29 }], 2),
      ellipse(40, 23, 1, 2), [{ x: 23, z: 8 }, { x: 30, z: 11 }, { x: 17, z: 29 }],
    ) },
    { terrain: 'gold', cells: union(
      settlement.gold,
      path([{ x: 19, z: 7 }, { x: 21, z: 6 }, { x: 24, z: 6 }]),
      path([{ x: 10, z: 21 }, { x: 13, z: 21 }, { x: 15, z: 22 }]),
      row(21, 36, 6), row(41, 28, 4),
    ) },
  ],
  ruins: [transformRuin({
    id: 'pool-waystation', name: 'Poolside waystation', rooms: [
      { type: 'dormitory', cells: union(rect(0, 0, 3, 2), rect(0, 2, 2, 1)) },
      { type: 'treasure', cells: rect(0, 4, 2, 2) },
    ],
  }, { x: 11, z: 24 }, 'fungal-waystation')],
  environmentRegions: [
    { id: 'dry-arrival-shelf', kind: 'dry', cells: ellipse(10, 12, 10, 9) },
    { id: 'wet-basin-margin', kind: 'damp', cells: union(ellipse(29, 20, 13, 11), ellipse(26, 29, 9, 7)) },
    { id: 'bare-northern-shelf', kind: 'dry', cells: ellipse(28, 8, 10, 4) },
    { id: 'upper-colony', kind: 'fungal', cells: ellipse(35, 12, 7, 6) },
    { id: 'brood-recess', kind: 'fungal', cells: ellipse(40, 25, 5, 9) },
    { id: 'lower-shore-colonies', kind: 'fungal', cells: ellipse(23, 34, 8, 4) },
    { id: 'poolside-waystation', kind: 'masonry', cells: rect(9, 22, 7, 9) },
    { id: 'relay-stone-bay', kind: 'masonry', cells: ellipse(34, 32, 3, 3) },
  ],
  encounters: [
    camp('fungal-brood', 'Eastern brood colony', 'fungal', [{ x: 39, z: 25 }, { x: 36, z: 29 }], ['cave-spider', 'spore-brute'], 'raid'),
    entrance('fungal-raids', 'fungal', { x: 42, z: 34 }, ['cave-spider'], 660),
  ],
};

export const fungalPlan: LevelPlayPlan = {
  settlement,
  intended: [{ x: 14, z: 10 }, { x: 36, z: 10 }, { x: 36, z: 31 }, { x: 34, z: 31 }],
  alternate: [{ x: 14, z: 16 }, { x: 11, z: 16 }, { x: 11, z: 26 }, { x: 16, z: 26 }, { x: 16, z: 36 }, { x: 34, z: 36 }, { x: 34, z: 31 }],
  suppression: [{ x: 34, z: 31 }, { x: 42, z: 31 }, { x: 42, z: 34 }],
  defenses: union(rect(15, 8, 2, 3), rect(13, 18, 3, 2)),
};
