import type { LevelDefinition, Point, World } from '../game/types.ts';
import { tileAt } from '../game/types.ts';
import { col, ellipse, rect, row, union } from './level-authoring.ts';

/** A peaceful building study: the finished exhibit and the playable start share this terrain. */
export const showcaseRooms: Record<string, Point[]> = {
  treasure: rect(12, 10, 6, 5),
  workshop: rect(12, 19, 6, 4),
  training: rect(12, 27, 6, 5),
  library: union(rect(27, 27, 6, 4), rect(27, 31, 4, 1)),
  kitchen: rect(27, 19, 6, 4),
  dormitory: rect(27, 10, 6, 5),
};
export const showcaseCorridors = union(
  rect(19, 10, 2, 22), rect(24, 10, 2, 22),
  rect(19, 16, 7, 2), rect(19, 24, 7, 2),
  ...[12, 20, 29].flatMap(z => [row(18, z, 1), row(26, z, 1)]),
  rect(19, 7, 2, 3),
);
export const showcaseGold = union(row(10, 5, 25), row(10, 6, 25), col(8, 8, 12), col(9, 8, 12));
export const showcaseMine = union(showcaseGold, rect(8, 7, 27, 1));
export const showcaseReserve = union(rect(11, 34, 7, 4), rect(27, 34, 7, 4));
export const showcaseLevel: LevelDefinition = {
  id: 'hearthside-halls', name: 'Hearthside Halls', width: 46, height: 40, biome: 'upper',
  hearth: { x: 22, z: 20 }, openings: [[20, 18, 24, 22]],
  onwardHearth: { id: 'hearthside-relay', name: 'Garden relay', x: 39, z: 21 },
  seams: [
    { terrain: 'bedrock', cells: union(ellipse(4, 27, 3, 9), ellipse(39, 5, 4, 3), rect(5, 35, 3, 4)) },
    { terrain: 'rock', cells: union(rect(7, 3, 30, 5), rect(35, 10, 2, 24)) },
    { terrain: 'floor', cells: ellipse(39, 21, 4, 8) },
    { terrain: 'water', cells: ellipse(41, 26, 2, 2) },
    { terrain: 'gold', cells: showcaseGold },
  ],
  environmentRegions: [
    { id: 'home-workings', kind: 'dry', cells: rect(7, 8, 28, 30) },
    { id: 'mine-gallery', kind: 'masonry', cells: rect(7, 3, 29, 6) },
    { id: 'garden-margin', kind: 'damp', cells: ellipse(39, 23, 5, 9) },
    { id: 'garden-growth', kind: 'fungal', cells: ellipse(41, 19, 2, 5) },
  ],
};

export const showcaseBuiltId = 'hearthside-halls-built';
export const showcaseDoors = [12, 20, 29].flatMap(z => [{ x: 18, z }, { x: 26, z }]);
export const showcaseExcavation = union(showcaseCorridors, showcaseMine, ...Object.values(showcaseRooms));
export const showcaseComplete = (w: World) => Object.entries(showcaseRooms)
  .every(([type, cells]) => cells.every(p => tileAt(w, p.x, p.z)?.room === type));
