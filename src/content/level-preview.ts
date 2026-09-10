import type { LevelDefinition, World } from '../game/types.ts';
import { startFreePlay } from '../game/session.ts';
import { createWorld } from '../game/world.ts';
import { addStonehands } from '../game/simulation.ts';
import { enableRecruitment } from '../game/recruitment.ts';
import { copyAvailability } from '../game/availability.ts';
import { playableLevels } from './playable-levels.ts';
import { levelComparison, levelComparisons } from './level-baselines.ts';
import { authoringFixture } from './level-authoring-fixture.ts';

export interface LevelPreviewEntry {
  id: string; name: string; level: LevelDefinition;
  group: 'Campaign' | 'Standalone' | 'Before overhaul' | 'Authoring';
}

/** Development comparisons never enter the ordinary campaign or Free Play catalogs. */
export const levelPreviewEntries: LevelPreviewEntry[] = [
  ...playableLevels.map(entry => ({ ...entry, group: (entry.id.startsWith('campaign-') ? 'Campaign' : 'Standalone') as LevelPreviewEntry['group'] })),
  ...levelComparisons.map(entry => ({ ...entry, group: 'Before overhaul' as const })),
  { id: authoringFixture.id, name: authoringFixture.name, level: authoringFixture, group: 'Authoring' },
];

function startDebugLayout(id: string, free: boolean): World {
  const comparison = levelComparison(id);
  const next = createWorld(comparison?.level ?? authoringFixture);
  next.freeRoomBuilding = free;
  if (comparison) {
    next.availability = copyAvailability(comparison.starting);
    next.researchOrders = comparison.starting.knownSpells.map((spell, i) => ({ id: i + 1, spell, state: 'queued', progress: 0, unlocked: true, paused: true }));
  }
  addStonehands(next);
  enableRecruitment(next);
  return next;
}

/** A playable debug copy; revealing it never changes the retained stronghold. */
export function createLevelPreviewWorld(id: string, current: World): World {
  const next = id === 'current' ? structuredClone(current)
    : levelComparison(id) || id === authoringFixture.id ? startDebugLayout(id, current.freeRoomBuilding)
    : startFreePlay(id, current.freeRoomBuilding);
  for (const tile of next.tiles) {
    tile.known = true;
    if (!['dirt', 'rock', 'gold', 'gem'].includes(tile.terrain)) tile.designated = false;
  }
  if (next.onwardHearth) next.onwardHearth.discovered = true;
  next.revision++;
  return next;
}
