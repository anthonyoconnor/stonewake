import { playableLevel } from '../content/playable-levels.ts';
import { createWorld } from './world.ts';
import { addStonehands } from './simulation.ts';
import { enableRecruitment } from './recruitment.ts';
import { restartCampaignArea, startCampaign } from './campaign.ts';
import type { World } from './types.ts';
import { copyAvailability } from './availability.ts';

export function startFreePlay(id: string, free = false): World {
  const entry = playableLevel(id);
  if (!entry) throw new Error(`Unknown playable level: ${id}`);
  const w = createWorld(entry.level);
  w.freeRoomBuilding = free;
  w.availability = copyAvailability(entry.starting);
  w.freePlay = { levelId: id, buildings: [...entry.starting.buildings], knownSpells: [...entry.starting.knownSpells] };
  w.researchOrders = entry.starting.knownSpells.map((spell, i) => ({ id: i + 1, spell, state: 'queued', progress: 0, unlocked: true, paused: true }));
  addStonehands(w); enableRecruitment(w);
  return w;
}
export function restartSession(w: World) {
  return w.freePlay ? startFreePlay(w.freePlay.levelId, w.freeRoomBuilding) : restartCampaignArea(w) ?? startCampaign(w.freeRoomBuilding);
}
