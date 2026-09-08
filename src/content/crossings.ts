import { type LevelDefinition } from '../game/types.ts';
import { createWorld } from '../game/world.ts';
import { addStonehands } from '../game/simulation.ts';

const column = (x: number) => Array.from({ length: 18 }, (_, z) => ({ x, z }));
export const crossingLevel: LevelDefinition = {
  id: 'crossings',
  name: 'Emberwater Crossing',
  width: 28,
  height: 18,
  hearth: { x: 5, z: 9 },
  onwardHearth: { id: 'emberwater-gate', name: 'Emberwater Hearthstone', x: 23, z: 9 },
  openings: [
    [2, 3, 9, 14],
    [12, 3, 16, 14],
    [19, 3, 25, 14],
  ],
  seams: [
    { terrain: 'water', cells: [...column(10), ...column(11)] },
    { terrain: 'lava', cells: [...column(17), ...column(18)] },
    {
      terrain: 'chasm',
      cells: [
        { x: 14, z: 5 },
        { x: 14, z: 6 },
        { x: 15, z: 5 },
        { x: 15, z: 6 },
      ],
    },
    {
      terrain: 'gold',
      cells: [
        { x: 3, z: 4 },
        { x: 4, z: 4 },
        { x: 5, z: 4 },
      ],
    },
    { terrain: 'gem', cells: [{ x: 3, z: 13 }] },
  ],
};
// Ordinary allowance and starting crew. No supplied bridges, rooms, stock or faster work.
export function createCrossingScenario(free = false) {
  const w = createWorld(crossingLevel);
  w.freeRoomBuilding = free;
  addStonehands(w);
  return w;
}
