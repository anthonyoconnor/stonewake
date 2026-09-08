import { createRoomLab } from './room-lab.ts';
import { addResidents } from '../game/simulation.ts';

/** A clear floor for comparing silhouettes and equipment from either camera direction. */
export function createCharacterLab(freeRoomBuilding = false) {
  const w = createRoomLab();
  w.name = 'Character Model Studio';
  w.freeRoomBuilding = freeRoomBuilding;
  for (const [i, type] of ['stonehand', 'miner', 'engineer', 'warrior', 'runesmith', 'cave-hound'].entries()) {
    addResidents(w, type);
    const a = w.agents.at(-1)!;
    a.x = type === 'cave-hound' ? 5 : 5 + i * 2.5;
    a.z = type === 'cave-hound' ? 14 : 10;
    a.facing = 0;
  }
  return w;
}
