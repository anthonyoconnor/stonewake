import { createEconomyLab } from './economy-lab.ts';
import { buildRoom } from '../game/rooms.ts';
import { setDoorMode } from '../game/defenses.ts';
import { type Point } from '../game/types.ts';

export function createMoraleLab(freeRoomBuilding = false) {
  const w = createEconomyLab(freeRoomBuilding);
  w.name = 'Needs and departure';
  const rectangle = (x: number, z: number): Point[] =>
    Array.from({ length: 4 }, (_, i) => ({ x: x + (i % 2), z: z + Math.floor(i / 2) }));
  buildRoom(w, 'workshop', rectangle(14, 3));
  buildRoom(w, 'training', rectangle(14, 7));
  buildRoom(w, 'library', rectangle(14, 12));
  // All resident needs have room support on the right. Treasury access and exit
  // are deliberately blocked by the real door until the player reopens it.
  setDoorMode(w, w.defenses![0].id, 'locked');
  return w;
}
