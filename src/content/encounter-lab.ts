import { createWorld } from '../game/world.ts';
import { buildRoom } from '../game/rooms.ts';
import { addResidents } from '../game/simulation.ts';
import { placeDefense, setDoorMode } from '../game/defenses.ts';
import type { LevelDefinition } from '../game/types.ts';

export const encounterLabLevel: LevelDefinition = {
  id: 'encounters',
  name: 'Encounter Test Tunnels',
  width: 32,
  height: 24,
  hearth: { x: 4, z: 12 },
  openings: [
    [2, 2, 9, 21],
    [10, 12, 11, 12],
    [13, 12, 31, 12],
    [15, 10, 20, 14],
  ],
  seams: [],
  encounters: [
    {
      id: 'buried-camp',
      name: 'Buried camp',
      kind: 'camp',
      positions: [{ x: 17, z: 11 }],
      activation: 'discovery',
      delay: 0,
      warningSeconds: 4,
      clear: 'defeat',
    },
    {
      id: 'deep-entrance',
      name: 'Deep entrance',
      kind: 'entrance',
      positions: [{ x: 30, z: 12 }],
      activation: 'time',
      delay: 12,
      warningSeconds: 6,
      repeatSeconds: 15,
      clear: 'claim',
      warning: 'An approaching raid echoes through the tunnels.',
    },
  ],
};

export function createEncounterLab(freeRoomBuilding = false) {
  const w = createWorld(encounterLabLevel);
  // This fixture reveals only the starting side, including the one-square excavation gate.
  for (const t of w.tiles)
    if (t.x <= 12) {
      t.known = true;
      if (t.terrain === 'floor') t.claimed = true;
    }
  w.freeRoomBuilding = freeRoomBuilding;
  w.allowance = 5000;
  const rect = (x: number, z: number, width: number, depth: number) =>
    Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));
  buildRoom(w, 'kitchen', rect(3, 3, 4, 3));
  buildRoom(w, 'dormitory', rect(3, 17, 4, 3));
  addResidents(w, 'miner', 1);
  addResidents(w, 'warrior', 2);
  w.outputs['timber-door'] = 1;
  w.outputs['spike-trap'] = 1;
  w.outputs['bolt-trap'] = 1;
  placeDefense(w, 'timber-door', { x: 10, z: 12 });
  placeDefense(w, 'spike-trap', { x: 11, z: 12 });
  placeDefense(w, 'bolt-trap', { x: 8, z: 12 }, 0);
  // Start open so the player can mine the gate. Closing it later changes the real approach.
  const door = w.defenses?.find((d) => d.type === 'timber-door');
  if (door) setDoorMode(w, door.id, 'open');
  return w;
}
