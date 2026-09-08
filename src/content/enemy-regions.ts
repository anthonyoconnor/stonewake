import { type LevelDefinition, type Point, tileAt } from '../game/types.ts';
import { createWorld } from '../game/world.ts';
import { addMiners } from '../game/simulation.ts';
import { enableRecruitment } from '../game/recruitment.ts';
import { enemyDefinitions } from './enemies.ts';

export const enemyRegionIds = ['upper', 'fungal', 'ancient', 'crystal', 'volcanic'] as const;
export type EnemyRegion = (typeof enemyRegionIds)[number];
const row = (x: number, z: number, length: number): Point[] =>
  Array.from({ length }, (_, i) => ({ x: x + i, z }));
const column = (x: number, z: number, length: number): Point[] =>
  Array.from({ length }, (_, i) => ({ x, z: z + i }));
const names: Record<EnemyRegion, string> = {
  upper: 'Upper Workings',
  fungal: 'Fungal Hollows',
  ancient: 'Ancient Watch Halls',
  crystal: 'Crystal Hunting Grounds',
  volcanic: 'Volcanic Lair',
};

/** Ordinary settlements with normal economy/recruitment, each exposing a regional pair. */
export function enemyRegionLevel(region: EnemyRegion): LevelDefinition {
  const definitions = enemyDefinitions.filter((e) => e.region === region);
  const level: LevelDefinition = {
    id: `region-${region}`,
    name: names[region],
    width: 28,
    height: 20,
    hearth: { x: 4, z: 10 },
    openings: [
      [2, 4, 8, 16],
      [9, 10, 10, 10],
      [12, 10, 17, 10],
      [17, 7, 25, 14],
    ],
    seams: [
      {
        terrain: 'gold',
        cells: [...row(6, 3, 5), ...row(7, 17, 5), ...column(9, 5, 3), ...column(9, 13, 3)],
      },
      { terrain: 'gem', cells: [{ x: 7, z: 18 }] },
      { terrain: 'bedrock', cells: [...row(12, 5, 13), ...row(12, 16, 14)] },
    ],
    onwardHearth: { id: `${region}-onward`, name: `${names[region]} Hearthstone`, x: 24, z: 10 },
    encounters: [
      {
        id: `${region}-inhabitants`,
        name: `${names[region]} inhabitants`,
        kind: region === 'fungal' ? 'nest' : 'camp',
        positions: [
          { x: 20, z: 8 },
          { x: 22, z: 12 },
        ],
        roster: definitions.map((e) => e.id),
        activation: 'discovery',
        delay: 0,
        warningSeconds: 15,
        clear: 'defeat',
        warning: 'Disturbed inhabitants are gathering around the onward stone.',
      },
    ],
  };
  if (region === 'upper')
    level.seams.push({
      terrain: 'rock',
      cells: [
        { x: 15, z: 9 },
        { x: 15, z: 11 },
      ],
    });
  if (region === 'fungal') level.openings.push([17, 3, 21, 6], [22, 15, 25, 17]);
  if (region === 'ancient')
    level.seams.push({ terrain: 'rock', cells: [...column(19, 9, 3), { x: 22, z: 9 }, { x: 22, z: 11 }] });
  if (region === 'crystal')
    level.seams.push(
      {
        terrain: 'gem',
        cells: [
          { x: 19, z: 9 },
          { x: 21, z: 10 },
          { x: 23, z: 11 },
        ],
      },
      {
        terrain: 'chasm',
        cells: [
          { x: 22, z: 6 },
          { x: 23, z: 6 },
        ],
      },
    );
  if (region === 'volcanic')
    level.seams.push(
      { terrain: 'lava', cells: [...column(14, 1, 18), ...column(15, 1, 18)] },
      { terrain: 'chasm', cells: row(19, 15, 5) },
    );
  return level;
}
export function createEnemyRegion(region: EnemyRegion, freeRoomBuilding = false) {
  const w = createWorld(enemyRegionLevel(region));
  w.freeRoomBuilding = freeRoomBuilding;
  if (region === 'upper')
    for (const p of [
      { x: 15, z: 9 },
      { x: 15, z: 11 },
    ])
      tileAt(w, p.x, p.z)!.reinforced = true;
  addMiners(w);
  enableRecruitment(w);
  return w;
}
