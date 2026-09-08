import { createWorld } from '../game/world.ts';
import { buildRoom } from '../game/rooms.ts';
import { addResidents } from '../game/simulation.ts';
import { placeDefense, setDoorMode } from '../game/defenses.ts';
import type { LevelDefinition } from '../game/types.ts';

export const hearthLabLevel: LevelDefinition = {
  id: 'hearth',
  name: 'Hearthstone Expedition',
  width: 32,
  height: 24,
  hearth: { x: 4, z: 12 },
  onwardHearth: { id: 'buried-runic-link', name: 'Buried runic Hearthstone', x: 18, z: 11 },
  openings: [
    [2, 2, 9, 21],
    [10, 12, 11, 12],
    [13, 12, 31, 12],
    [15, 10, 20, 14],
  ],
  seams: [],
  encounters: [
    {
      id: 'hearth-guard-camp',
      name: 'Hearthstone guard camp',
      kind: 'camp',
      positions: [{ x: 17, z: 11 }],
      activation: 'discovery',
      delay: 0,
      warningSeconds: 4,
      clear: 'defeat',
    },
    {
      id: 'hearth-raiding-passage',
      name: 'Deep raiding passage',
      kind: 'entrance',
      positions: [
        { x: 30, z: 12 },
        { x: 28, z: 12 },
      ],
      activation: 'time',
      delay: 45,
      warningSeconds: 8,
      repeatSeconds: 25,
      clear: 'claim',
    },
  ],
};

function makeHearthLab(freeRoomBuilding: boolean, defended: boolean) {
  const w = createWorld(hearthLabLevel);
  if (!defended) w.name = 'Hearthstone Defense Failure';
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
  buildRoom(w, 'training', rect(3, 7, 4, 2));
  addResidents(w, 'miner', 1);
  if (defended) addResidents(w, 'warrior', 2);
  w.outputs['timber-door'] = 1;
  placeDefense(w, 'timber-door', { x: 10, z: 12 });
  const door = w.defenses?.find((d) => d.type === 'timber-door');
  if (door) setDoorMode(w, door.id, 'open');
  if (defended) {
    w.outputs['spike-trap'] = 1;
    w.outputs['bolt-trap'] = 1;
    placeDefense(w, 'spike-trap', { x: 11, z: 12 });
    placeDefense(w, 'bolt-trap', { x: 8, z: 12 }, 0);
  }
  return w;
}

export const createHearthLab = (freeRoomBuilding = false) => makeHearthLab(freeRoomBuilding, true);
export const createHearthDefeatLab = (freeRoomBuilding = false) => makeHearthLab(freeRoomBuilding, false);
