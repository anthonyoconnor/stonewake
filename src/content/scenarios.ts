import { prototypeLevel } from './levels.ts';
import { createWorld } from '../game/world.ts';
import { createRoomLab, showcaseRooms } from './room-lab.ts';
import { createDefenseLab } from './defense-lab.ts';
import { createSpellLab } from './spell-lab.ts';
import { createEncounterLab } from './encounter-lab.ts';
import { createEconomyLab } from './economy-lab.ts';
import { buildRoom } from '../game/rooms.ts';
import { addMiners, addResidents, designate } from '../game/simulation.ts';
import { queueCraft } from '../game/crafting.ts';
import { queueResearch } from '../game/research.ts';
import { setDoorMode } from '../game/defenses.ts';
import { enableRecruitment } from '../game/recruitment.ts';
import { spellDefinitions } from './spells.ts';
import { type World, tileAt } from '../game/types.ts';

export const rect = (x: number, z: number, width: number, depth: number) =>
  Array.from({ length: width * depth }, (_, i) => ({ x: x + (i % width), z: z + Math.floor(i / width) }));

export function populateShowcase(world: World) {
  addMiners(world);
  for (const type of ['engineer', 'warrior', 'runesmith']) addResidents(world, type);
  for (const resident of world.agents) {
    resident.energy = 0.2;
    resident.hunger = 0.2;
  }
  for (const f of world.roomServices) {
    if (f.service === 'storage') f.stored = Math.min(f.capacity, 80);
  }
  queueCraft(world, 'reinforced-door');
  queueCraft(world, 'bolt-trap');
  for (const spell of spellDefinitions) queueResearch(world, spell.id);
  designate(world, [
    { x: 12, z: 12 },
    { x: 12, z: 13 },
  ]);
  tileAt(world, 6, 16)!.loose = 90;
}

type ScenarioFactory = (free: boolean) => World;
export const scenarioFactories = {
  stronghold: (free) => {
    const w = createWorld(prototypeLevel);
    w.freeRoomBuilding = free;
    addMiners(w);
    enableRecruitment(w);
    return w;
  },
  'room-lab': (free) => {
    const w = createRoomLab();
    w.freeRoomBuilding = free;
    return w;
  },
  showcase: (free) => {
    const w = createRoomLab();
    w.freeRoomBuilding = free;
    for (const r of showcaseRooms) buildRoom(w, r.type, rect(r.x, r.z, r.width, r.depth));
    populateShowcase(w);
    return w;
  },
  defenses: createDefenseLab,
  spells: createSpellLab,
  encounters: createEncounterLab,
  economy: createEconomyLab,
  'crowded-kitchen': (free) => {
    const w = createRoomLab();
    w.freeRoomBuilding = free;
    buildRoom(w, 'kitchen', rect(5, 5, 7, 5));
    buildRoom(w, 'dormitory', rect(3, 14, 7, 4));
    addMiners(w, 6);
    for (const a of w.agents) a.hunger = 0.1;
    return w;
  },
  'research-interruption': (free) => {
    const w = createRoomLab();
    w.freeRoomBuilding = free;
    buildRoom(w, 'library', rect(5, 4, 5, 4));
    buildRoom(w, 'dormitory', rect(3, 14, 6, 4));
    buildRoom(w, 'kitchen', rect(10, 14, 6, 4));
    addResidents(w, 'runesmith');
    queueResearch(w, spellDefinitions[0].id);
    return w;
  },
  'locked-door-hauling': (free) => {
    const w = createDefenseLab(free);
    addMiners(w, 1);
    tileAt(w, 25, 12)!.loose = 20;
    setDoorMode(w, w.defenses!.find((d) => d.type === 'timber-door')!.id, 'locked');
    return w;
  },
} satisfies Record<string, ScenarioFactory>;
export type ScenarioId = keyof typeof scenarioFactories;
export const scenarioIds = Object.keys(scenarioFactories) as ScenarioId[];
export function createScenario(id: ScenarioId, freeRoomBuilding = false) {
  if (!Object.hasOwn(scenarioFactories, id))
    throw new Error(`Unknown scenario: ${id}. Available: ${scenarioIds.join(', ')}`);
  return scenarioFactories[id](freeRoomBuilding);
}
