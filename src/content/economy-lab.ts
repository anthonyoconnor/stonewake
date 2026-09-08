import { createRoomLab } from './room-lab.ts';
import { characterDefinitions } from './characters.ts';
import { buildRoom } from '../game/rooms.ts';
import { addResidents } from '../game/simulation.ts';
import { placeDefense, setDoorMode } from '../game/defenses.ts';
import { tileAt, type Point } from '../game/types.ts';

// A single real door separates all treasury access from the starting residents.
export function createEconomyLab(freeRoomBuilding = false) {
  const w = createRoomLab();
  w.name = 'Recruitment and payday';
  w.freeRoomBuilding = freeRoomBuilding;
  for (let z = 1; z < w.height - 1; z++)
    if (z !== 10) {
      const t = tileAt(w, 7, z)!;
      t.terrain = 'bedrock';
      t.claimed = false;
    }
  const rectangle = (x: number, z: number, width: number, depth: number): Point[] =>
    Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));
  buildRoom(w, 'treasure', rectangle(3, 8, 2, 2));
  buildRoom(w, 'dormitory', rectangle(9, 3, 4, 3));
  buildRoom(w, 'kitchen', rectangle(9, 7, 4, 2));
  w.outputs['timber-door'] = 1;
  placeDefense(w, 'timber-door', { x: 7, z: 10 });
  const door = w.defenses![0];
  setDoorMode(w, door.id, 'locked');
  for (const type of characterDefinitions.filter(c=>!c.construct).map((c) => c.id)) addResidents(w, type, 1, { x: 10, z: 10 });
  // Explicit fixture setup brings one payday forward without changing global tuning.
  w.nextPaydayAt = 10;
  setDoorMode(w, door.id, 'closed');
  w.allowance = 1500;
  return w;
}
