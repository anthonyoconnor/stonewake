import { createWorld } from '../game/world.ts';
import { buildRoom } from '../game/rooms.ts';
import { enableRecruitment } from '../game/recruitment.ts';

// Ordinary paid Dormitory, automatic arrivals and a bend in an unexplored passage.
export function createHoundLab(free = false) {
  const w = createWorld({
    id: 'cave-hounds',
    name: 'Cave Hound foothold',
    width: 32,
    height: 22,
    hearth: { x: 5, z: 11 },
    openings: [
      [2, 7, 11, 16],
      [11, 9, 23, 11],
      [21, 4, 23, 11],
    ],
    seams: [],
  });
  w.freeRoomBuilding = free;
  buildRoom(w, 'dormitory', [
    { x: 3, z: 14 },
    { x: 4, z: 14 },
    { x: 5, z: 14 },
    { x: 6, z: 14 },
  ]);
  enableRecruitment(w);
  return w;
}
