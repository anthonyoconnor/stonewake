import type { LevelDefinition } from '../game/types.ts';
import { ellipse, path, polygon, rect, row, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { camp, entrance } from './level-encounters.ts';

const interchangeHearth = { x: 24, z: 20 };
const interchangeSettlement = settlementBlueprint(interchangeHearth);
interchangeSettlement.gold = union(
  path([{ x: 21, z: 12 }, { x: 23, z: 13 }, { x: 25, z: 13 }]),
  path([{ x: 18, z: 18 }, { x: 19, z: 20 }, { x: 19, z: 23 }]),
  path([{ x: 23, z: 26 }, { x: 25, z: 27 }, { x: 29, z: 27 }]),
);
interchangeSettlement.development = union(rect(20, 13, 11, 14), interchangeSettlement.gold);
const northWorkings = union(ellipse(24, 6, 7, 3), ellipse(11, 7, 5, 3), path([{ x: 11, z: 7 }, { x: 18, z: 5 }, { x: 24, z: 6 }], 2));
const serviceLoop = union(ellipse(10, 19, 4, 4), ellipse(12, 27, 5, 3), path([{ x: 10, z: 19 }, { x: 11, z: 27 }], 2), path([{ x: 10, z: 19 }, { x: 10, z: 8 }], 2));
const eastGalleries = union(ellipse(40, 29, 5, 5), ellipse(35, 34, 3, 2), path([{ x: 34, z: 21 }, { x: 40, z: 21 }, { x: 40, z: 29 }, { x: 35, z: 34 }], 2));

/** M42: a central mining interchange with unequal spokes and a western service loop. */
export const standaloneBorderLevel: LevelDefinition = {
  id: 'border-foothold', name: 'Mining Interchange', biome: 'upper', width: 48, height: 40, hearth: interchangeHearth,
  onwardHearth: { id: 'northern-runic-gate', name: 'Interchange watch Hearthstone', x: 11, z: 7 },
  openings: [[22, 18, 26, 22]],
  seams: [
    { terrain: 'floor', cells: union(northWorkings, serviceLoop, eastGalleries) },
    { terrain: 'bedrock', cells: union(
      polygon([{ x: 14, z: 11 }, { x: 18, z: 11 }, { x: 18, z: 16 }, { x: 16, z: 18 }, { x: 14, z: 15 }]),
      polygon([{ x: 17, z: 29 }, { x: 26, z: 29 }, { x: 28, z: 34 }, { x: 25, z: 37 }, { x: 18, z: 35 }, { x: 15, z: 32 }]),
      polygon([{ x: 31, z: 5 }, { x: 38, z: 6 }, { x: 41, z: 12 }, { x: 38, z: 15 }, { x: 33, z: 13 }]),
      polygon([{ x: 32, z: 25 }, { x: 34, z: 26 }, { x: 34, z: 31 }, { x: 30, z: 31 }, { x: 29, z: 28 }]),
      polygon([{ x: 2, z: 9 }, { x: 5, z: 8 }, { x: 5, z: 29 }, { x: 3, z: 33 }, { x: 2, z: 27 }]),
    ) },
    { terrain: 'rock', cells: union(rect(10, 13, 2, 2), [{ x: 8, z: 26 }, { x: 13, z: 8 }, { x: 38, z: 27 }]) },
    { terrain: 'gold', cells: union(interchangeSettlement.gold, path([{ x: 13, z: 30 }, { x: 12, z: 32 }, { x: 9, z: 32 }]), path([{ x: 39, z: 35 }, { x: 42, z: 34 }, { x: 44, z: 31 }])) },
    { terrain: 'gem', cells: [{ x: 43, z: 32 }] },
    { terrain: 'water', cells: ellipse(43, 28, 1, 2) },
  ],
  ruins: [
    { id: 'interchange-waystation', name: 'Western mine waystation', rooms: [
      { type: 'workshop', cells: union(rect(8, 24, 3, 2), [{ x: 8, z: 26 }]) },
      { type: 'kitchen', cells: rect(12, 26, 3, 2) },
      { type: 'treasure', cells: rect(10, 28, 3, 2) },
    ] },
    { id: 'interchange-watch-office', name: 'Northern watch office', rooms: [
      { type: 'dormitory', cells: union(rect(7, 6, 2, 2), [{ x: 9, z: 6 }]) },
      { type: 'treasure', cells: rect(13, 6, 2, 2) },
    ] },
  ],
  environmentRegions: [
    { id: 'mine-spokes', kind: 'dry', cells: union(ellipse(24, 20, 11, 10), ellipse(23, 6, 9, 5), ellipse(11, 7, 7, 5), ellipse(10, 20, 6, 12)) },
    { id: 'western-service-bays', kind: 'masonry', cells: rect(7, 23, 9, 8) },
    { id: 'north-watch', kind: 'masonry', cells: rect(6, 4, 10, 6) },
    { id: 'eastern-mineral-gallery', kind: 'dry', cells: ellipse(38, 32, 8, 6) },
    { id: 'damp-abandoned-bay', kind: 'damp', cells: ellipse(41, 27, 6, 5) },
  ],
  encounters: [
    camp('interchange-watch', 'Interchange watch', 'upper', [{ x: 10, z: 6 }, { x: 13, z: 9 }], ['goblin-raider', 'goblin-raider'], 'raid'),
    camp('interchange-side-bay', 'Damp abandoned bay', 'fungal', [{ x: 39, z: 29 }], ['cave-spider']),
    entrance('interchange-raids', 'upper', { x: 41, z: 22 }, ['goblin-raider'], 840),
  ],
};

export const standaloneBorderPlan: LevelPlayPlan = {
  settlement: interchangeSettlement,
  intended: [{ x: 24, z: 13 }, { x: 24, z: 7 }, { x: 11, z: 7 }],
  alternate: [{ x: 20, z: 22 }, { x: 16, z: 22 }, { x: 16, z: 27 }, { x: 11, z: 27 }, { x: 10, z: 27 }, { x: 10, z: 8 }, { x: 11, z: 8 }, { x: 11, z: 7 }],
  suppression: [{ x: 24, z: 20 }, { x: 34, z: 20 }, { x: 34, z: 21 }, { x: 41, z: 21 }, { x: 41, z: 22 }],
  defensesByApproach: { intended: row(22, 12, 5), alternate: row(16, 22, 5) },
};

const quarryHearth = { x: 34, z: 23 };
const quarrySettlement = settlementBlueprint(quarryHearth, 2);
quarrySettlement.gold = union(
  path([{ x: 39, z: 18 }, { x: 41, z: 20 }, { x: 41, z: 24 }]),
  path([{ x: 31, z: 16 }, { x: 34, z: 16 }, { x: 35, z: 17 }]),
  path([{ x: 30, z: 29 }, { x: 32, z: 31 }, { x: 33, z: 31 }]),
);
quarrySettlement.development = union(rect(28, 17, 11, 14), quarrySettlement.gold);
const extractionLobes = union(ellipse(27, 9, 7, 4), ellipse(10, 8, 5, 4), ellipse(21, 20, 5, 4), ellipse(20, 32, 6, 3));
const quarryServiceCircuit = union(
  ellipse(10, 24, 5, 4), ellipse(6, 18, 3, 3),
  path([{ x: 27, z: 6 }, { x: 10, z: 6 }], 2),
  path([{ x: 11, z: 10 }, { x: 11, z: 24 }], 2),
  path([{ x: 6, z: 18 }, { x: 11, z: 18 }], 2),
  path([{ x: 12, z: 20 }, { x: 21, z: 20 }], 2),
);
const quarryRibs = union(
  polygon([{ x: 15, z: 8 }, { x: 19, z: 7 }, { x: 23, z: 10 }, { x: 21, z: 13 }, { x: 18, z: 14 }, { x: 14, z: 12 }]),
  polygon([{ x: 23, z: 13 }, { x: 29, z: 13 }, { x: 29, z: 15 }, { x: 25, z: 17 }, { x: 23, z: 21 }, { x: 20, z: 20 }, { x: 21, z: 17 }]),
  polygon([{ x: 16, z: 24 }, { x: 21, z: 23 }, { x: 24, z: 26 }, { x: 23, z: 29 }, { x: 18, z: 28 }, { x: 15, z: 27 }]),
  polygon([{ x: 3, z: 29 }, { x: 8, z: 30 }, { x: 11, z: 34 }, { x: 10, z: 36 }, { x: 3, z: 35 }]),
  polygon([{ x: 37, z: 3 }, { x: 42, z: 5 }, { x: 43, z: 10 }, { x: 39, z: 13 }, { x: 36, z: 9 }]),
);

/** M42: thick retained stone ribs divide broad extraction chambers and an old service circuit. */
export const upperLevel: LevelDefinition = {
  id: 'region-upper', name: 'Honeycomb Quarry', biome: 'upper', width: 46, height: 38, hearth: quarryHearth,
  onwardHearth: { id: 'upper-onward', name: 'Quarry watch Hearthstone', x: 10, z: 9 },
  openings: [[32, 21, 36, 25]],
  seams: [
    { terrain: 'floor', cells: union(extractionLobes, quarryServiceCircuit) },
    { terrain: 'rock', cells: union(ellipse(27, 9, 2, 2), ellipse(21, 19, 2, 2), rect(10, 14, 3, 2)) },
    { terrain: 'bedrock', cells: quarryRibs },
    { terrain: 'gold', cells: union(quarrySettlement.gold,
      path([{ x: 31, z: 5 }, { x: 34, z: 6 }, { x: 36, z: 8 }]),
      path([{ x: 20, z: 35 }, { x: 24, z: 35 }, { x: 26, z: 33 }])) },
    { terrain: 'gem', cells: [{ x: 24, z: 33 }] },
  ],
  ruins: [
    { id: 'quarry-service-court', name: 'Quarry service court', rooms: [
      { type: 'workshop', cells: union(rect(8, 22, 3, 2), [{ x: 8, z: 24 }]) },
      { type: 'kitchen', cells: rect(12, 23, 2, 2) },
      { type: 'treasure', cells: rect(9, 26, 3, 2) },
    ] },
    { id: 'quarry-watch-office', name: 'Quarry watch office', rooms: [
      { type: 'training', cells: rect(7, 7, 2, 2) },
      { type: 'dormitory', cells: union(rect(12, 7, 2, 2), [{ x: 12, z: 9 }]) },
    ] },
  ],
  environmentRegions: [
    { id: 'east-refuge', kind: 'dry', cells: ellipse(34, 24, 10, 11) },
    { id: 'cut-working-faces', kind: 'dry', cells: union(ellipse(27, 9, 9, 6), ellipse(21, 20, 7, 6)) },
    { id: 'old-timber-circuit', kind: 'dry', cells: union(rect(9, 9, 5, 20), rect(8, 4, 23, 5)) },
    { id: 'service-masonry', kind: 'masonry', cells: rect(6, 21, 9, 8) },
    { id: 'watch-office', kind: 'masonry', cells: rect(6, 5, 9, 7) },
    { id: 'lower-damp-cave', kind: 'damp', cells: ellipse(20, 32, 8, 4) },
  ],
  encounters: [
    camp('quarry-watch', 'Quarry watch', 'upper', [{ x: 9, z: 7 }, { x: 12, z: 10 }], ['goblin-raider', 'goblin-raider'], 'raid'),
    camp('quarry-lower-den', 'Lower quarry den', 'upper', [{ x: 21, z: 33 }], ['tunnel-burrower']),
    entrance('quarry-raids', 'upper', { x: 6, z: 18 }, ['goblin-raider'], 840),
  ],
};

export const upperPlan: LevelPlayPlan = {
  settlement: quarrySettlement,
  intended: [{ x: 31, z: 17 }, { x: 31, z: 12 }, { x: 27, z: 12 }, { x: 27, z: 6 }, { x: 10, z: 6 }, { x: 10, z: 9 }],
  alternate: [{ x: 28, z: 26 }, { x: 25, z: 26 }, { x: 25, z: 30 }, { x: 11, z: 30 }, { x: 11, z: 24 }, { x: 11, z: 10 }, { x: 10, z: 10 }, { x: 10, z: 9 }],
  suppression: [{ x: 10, z: 9 }, { x: 11, z: 9 }, { x: 11, z: 18 }, { x: 6, z: 18 }],
  defensesByApproach: { intended: row(30, 16, 4), alternate: row(25, 26, 4) },
};
