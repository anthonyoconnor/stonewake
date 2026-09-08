import { createWorld } from '../game/world.ts';
import { addResidents, designate } from '../game/simulation.ts';
import { buildRoom } from '../game/rooms.ts';
import { planWalls } from '../game/walls.ts';
import { tileAt } from '../game/types.ts';

export function createMinerWorkLab(free = false, worker = 'miner') {
  const earth = Array.from({ length: 8 }, (_, i) => ({ x: 9, z: 3 + i }));
  const w = createWorld({
    id: 'miner-work',
    name: worker === 'stonehand' ? 'Stonehand work pool' : 'Miner work pool',
    width: 20,
    height: 18,
    hearth: { x: 4, z: 9 },
    openings: [[2, 2, 17, 15]],
    seams: [
      {
        terrain: 'gold',
        cells: [
          { x: 14, z: 4 },
          { x: 15, z: 4 },
        ],
      },
      { terrain: 'gem', cells: [{ x: 14, z: 11 }] },
      { terrain: 'dirt', cells: earth },
    ],
  });
  // Visible test yard with funded support; tasks use ordinary job/room systems.
  w.freeRoomBuilding = free;
  w.allowance = 5000;
  for (const t of w.tiles) {
    t.known = true;
    t.claimed = t.terrain === 'floor';
  }
  buildRoom(w, 'kitchen', [
    { x: 3, z: 13 },
    { x: 4, z: 13 },
    { x: 5, z: 13 },
  ]);
  buildRoom(w, 'dormitory', [
    { x: 3, z: 14 },
    { x: 4, z: 14 },
    { x: 5, z: 14 },
  ]);
  buildRoom(w, 'treasure', [
    { x: 6, z: 13 },
    { x: 7, z: 13 },
    { x: 8, z: 13 },
  ]);
  addResidents(w, worker, 3);
  designate(w, [...earth, { x: 14, z: 4 }, { x: 15, z: 4 }, { x: 14, z: 11 }]);
  planWalls(w, [
    { x: 11, z: 13 },
    { x: 12, z: 13 },
  ]);
  tileAt(w, 6, 10)!.loose = 90;
  return w;
}
