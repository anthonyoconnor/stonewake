import type { LevelDefinition } from '../game/types.ts';
import { ellipse, path, polygon, rect, transformRuin, union } from './level-authoring.ts';
import { ruinTemplates } from './ruins.ts';

/** Small real gameplay world for inspecting authoring helpers. No supplied service rooms. */
export const authoringFixture: LevelDefinition = {
  id: 'authoring-shapes', name: 'Authoring shapes', width: 24, height: 22, biome: 'upper',
  hearth: { x: 5, z: 16 },
  onwardHearth: { id: 'authoring-relay', name: 'Authoring relay', x: 20, z: 5 },
  openings: [[3, 14, 7, 18]],
  seams: [
    { terrain: 'floor', cells: union(
      ellipse(16, 8, 6, 5), ellipse(19, 17, 3, 2), rect(9, 4, 6, 4),
      path([{ x: 8, z: 13 }, { x: 12, z: 10 }, { x: 16, z: 9 }], 2),
      path([{ x: 21, z: 17 }, { x: 21, z: 10 }]),
    ) },
    { terrain: 'bedrock', cells: polygon([{ x: 9, z: 16 }, { x: 13, z: 14 }, { x: 15, z: 16 }, { x: 14, z: 19 }, { x: 9, z: 19 }]) },
    { terrain: 'water', cells: ellipse(18, 11, 2, 1) },
    { terrain: 'rock', cells: path([{ x: 15, z: 3 }, { x: 18, z: 3 }, { x: 20, z: 4 }]) },
    { terrain: 'gold', cells: path([{ x: 3, z: 11 }, { x: 6, z: 10 }, { x: 9, z: 9 }]) },
  ],
  ruins: [transformRuin(ruinTemplates.waystation, { x: 13, z: 5 }, 'authoring-waystation', 1)],
  environmentRegions: [
    { id: 'dry-approach', kind: 'dry', cells: union(rect(2, 12, 8, 8), rect(10, 8, 6, 5)) },
    { id: 'damp-pool', kind: 'damp', cells: ellipse(18, 11, 4, 3) },
    { id: 'fungal-bank', kind: 'fungal', cells: rect(20, 7, 3, 6) },
    { id: 'waystation-street', kind: 'masonry', cells: rect(8, 3, 7, 6) },
    { id: 'crystal-wall', kind: 'crystal', cells: union(rect(15, 2, 6, 6), rect(14, 11, 2, 3)) },
    { id: 'scorched-fringe', kind: 'scorched', cells: rect(15, 14, 7, 5) },
  ],
};

/** Excavation opens the sealed connection before entering the cave/ruin complex. */
export const authoringFixtureApproach = path([{ x: 7, z: 14 }, { x: 8, z: 13 }, { x: 12, z: 10 }, { x: 12, z: 6 }]);
export const authoringFixtureRoom = union(rect(3, 13, 2, 2), [{ x: 5, z: 13 }]);
