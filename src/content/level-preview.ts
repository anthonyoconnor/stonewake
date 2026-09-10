import type { World } from '../game/types.ts';
import { startFreePlay } from '../game/session.ts';

/** A playable debug copy; revealing it never changes the retained stronghold. */
export function createLevelPreviewWorld(id: string, current: World): World {
  const next = id === 'current' ? structuredClone(current) : startFreePlay(id, current.freeRoomBuilding);
  for (const tile of next.tiles) {
    tile.known = true;
    if (!['dirt', 'rock', 'gold', 'gem'].includes(tile.terrain)) tile.designated = false;
  }
  if (next.onwardHearth) next.onwardHearth.discovered = true;
  next.revision++;
  return next;
}
