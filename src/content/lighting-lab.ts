import { createWorld } from '../game/world.ts';
import { buildRoom } from '../game/rooms.ts';
import { addResidents } from '../game/simulation.ts';
import { addEnemy } from '../game/defenses.ts';
import { queueCraft } from '../game/crafting.ts';
import { queueResearch } from '../game/research.ts';
import { neighbors, tileAt, type World, type Point } from '../game/types.ts';

import { lightingDefaults } from './lighting.ts';
export { lightingDefaults, lightingSources, lightReaches, type LightingSettings } from './lighting.ts';

export const lightingViews = [
  { id: 'hearth', name: 'Hearth & rooms', x: 8, z: 14, radius: 24 },
  { id: 'lamps', name: 'Lamps & narrow Library', x: 12, z: 5, radius: 18 },
  { id: 'crossing', name: 'Lava & water', x: 23, z: 18, radius: 21 },
  { id: 'fog', name: 'Sealed fog boundary', x: 26, z: 5, radius: 19 },
];
const rect = (x: number, z: number, width: number, depth: number) =>
  Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));

/** Paid/free ordinary construction, cosmetic furnishings and a still-sealed light source. */
export function createLightingLab(free = false) {
  const w = createWorld({
    id: 'lighting',
    name: 'M33 lighting test room',
    width: 34,
    height: 28,
    hearth: { x: 5, z: 14 },
    openings: [
      [2, 2, 17, 25],
      [18, 10, 29, 12],
      [20, 6, 29, 22],
      [24, 2, 30, 4],
    ],
    seams: [
      { terrain: 'bedrock', cells: [...rect(18, 2, 1, 8), ...rect(18, 13, 1, 12), { x: 10, z: 23 }] },
      {
        terrain: 'rock',
        cells: [
          { x: 12, z: 7 },
          { x: 12, z: 8 },
          { x: 26, z: 5 },
        ],
      },
      { terrain: 'gold', cells: rect(20, 5, 2, 1) },
      {
        terrain: 'gem',
        cells: [
          { x: 29, z: 8 },
          { x: 29, z: 3 },
        ],
      },
      { terrain: 'lava', cells: [...rect(20, 16, 10, 2), { x: 26, z: 3 }] },
      { terrain: 'water', cells: rect(20, 20, 10, 2) },
    ],
  });
  w.allowance = 50000;
  w.freeRoomBuilding = free;
  for (const t of w.tiles) {
    t.known = !(t.x >= 22 && t.z <= 5);
    t.claimed = t.known && t.terrain === 'floor';
  }
  for (const t of w.tiles)
    if (t.known && ['dirt', 'rock', 'bedrock'].includes(t.terrain) && neighbors(w, t).some((n) => n.claimed))
      t.reinforced = true;
  const room = (type: string, points: Point[]) => buildRoom(w, type, points);
  room('dormitory', [...rect(2, 3, 5, 3), ...rect(2, 6, 1, 3)]);
  room('treasure', [{ x: 9, z: 3 }]);
  room('treasure', rect(9, 6, 3, 3));
  room('library', [...rect(13, 3, 4, 3), ...rect(16, 6, 1, 3)]);
  room('training', rect(10, 13, 4, 4));
  room('workshop', rect(2, 21, 5, 4));
  room('kitchen', rect(9, 21, 4, 4));
  // Completed decks are explicit presentation fixtures, not instantly completed plans in play.
  for (const p of [...rect(23, 16, 1, 2), ...rect(23, 20, 1, 2)])
    Object.assign(tileAt(w, p.x, p.z)!, { bridge: true, claimed: true, bridgePaid: 0 });
  for (const type of ['stonehand', 'cave-hound', 'engineer', 'warrior', 'runesmith']) addResidents(w, type);
  Object.assign(w.agents[0], { x: 23, z: 11 });
  Object.assign(w.agents[1], { x: 8, z: 14 });
  Object.assign(w.agents[2], { x: 5, z: 22 });
  Object.assign(w.agents[3], { x: 11, z: 14 });
  Object.assign(w.agents[4], { x: 14, z: 4 });
  for (const [type, x, z] of [
    ['crystal-elemental', 26, 10],
    ['spore-brute', 27, 12],
  ] as const) {
    const enemy = addEnemy(w, { x, z }, { x, z }, type);
    if (enemy) enemy.dormant = true;
  }
  queueCraft(w, 'bolt-trap');
  queueResearch(w, 'stoneguard');
  w.revision++;
  return Object.assign(w, { lightingTest: { ...lightingDefaults } });
}
