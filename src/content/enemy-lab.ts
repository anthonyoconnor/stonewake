import { createWorld } from '../game/world.ts';
import { type LevelDefinition, tileAt } from '../game/types.ts';
import { enemyDefinitions } from './enemies.ts';
import { buildRoom } from '../game/rooms.ts';
import { addResidents } from '../game/simulation.ts';
import { placeDefense } from '../game/defenses.ts';

export const enemyLabLevel: LevelDefinition = {
  id: 'enemy-roster',
  name: 'Enemy Roster Galleries',
  width: 26,
  height: 22,
  hearth: { x: 4, z: 10 },
  openings: [
    [1, 1, 9, 20],
    ...[3, 7, 11, 15, 19].map((z) => [10, z - 1, 24, z + 1] as [number, number, number, number]),
  ],
  seams: [],
  encounters: Array.from({ length: 5 }, (_, i) => ({
    id: `roster-${enemyDefinitions[i * 2].region}`,
    name: `${['Upper workings', 'Fungal caves', 'Ancient halls', 'Crystal caverns', 'Volcanic depths'][i]} inhabitants`,
    kind: 'camp' as const,
    positions: [
      { x: i === 4 ? 22 : 18, z: 3 + i * 4 },
      { x: i === 4 ? 18 : 22, z: 3 + i * 4 },
    ],
    roster: enemyDefinitions.slice(i * 2, i * 2 + 2).map((e) => e.id),
    activation: 'discovery' as const,
    delay: 0,
    warningSeconds: 8,
    clear: 'defeat' as const,
  })),
};
export function createEnemyLab(freeRoomBuilding = false) {
  const w = createWorld(enemyLabLevel);
  w.freeRoomBuilding = freeRoomBuilding;
  w.allowance = 5000;
  for (const t of w.tiles) {
    t.known = true;
    if (t.terrain === 'floor' && t.x < 16) t.claimed = true;
  }
  const rect = (x: number, z: number, width: number, depth: number) =>
    Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));
  buildRoom(w, 'kitchen', rect(2, 2, 4, 3));
  buildRoom(w, 'dormitory', rect(2, 16, 4, 3));
  addResidents(w, 'miner', 1);
  addResidents(w, 'warrior', 5);
  w.agents
    .filter((a) => a.type === 'warrior')
    .forEach((a, i) => {
      a.x = 16;
      a.z = 3 + i * 4;
    });
  w.outputs['spike-trap'] = 5;
  w.outputs['bolt-trap'] = 5;
  for (const z of [3, 7, 11, 15, 19]) {
    placeDefense(w, 'spike-trap', { x: 15, z });
    placeDefense(w, 'bolt-trap', { x: 12, z }, 0);
  }
  // Side-by-side actual terrain examples: lava gives the Cinderling an unbridged approach.
  for (const z of [18, 19, 20]) {
    const t = tileAt(w, 20, z)!;
    t.terrain = 'lava';
    t.claimed = false;
  }
  return w;
}
