import { createRoomLab } from './room-lab.ts';
import { addResidents } from '../game/simulation.ts';

/** A clear floor for comparing silhouettes and equipment from either camera direction. */
export function createCharacterLab(freeRoomBuilding = false) {
  const w = createRoomLab();
  w.name = 'Character Model Studio';
  w.freeRoomBuilding = freeRoomBuilding;
  for (const [i, type] of ['miner', 'engineer', 'warrior', 'runesmith'].entries()) {
    addResidents(w, type);
    const a = w.agents.at(-1)!;
    a.x = 6 + i * 3;
    a.z = 10;
    a.facing = 0;
  }
  return w;
}
