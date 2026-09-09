import type { FurnishingDefinition } from './rooms.ts';

/** Presentation budgets only: services and capacity still come from room floor. */
export interface RoomFurnishingPlan {
  coverage: number;
  items: (FurnishingDefinition & { limit: number; placement: 'edge' | 'center' | 'spread' })[];
}
export const roomFurnishingPlans: Record<string, RoomFurnishingPlan> = {
  treasure: { coverage: 0, items: [] },
  dormitory: { coverage: 0, items: [] },
  kitchen: {
    coverage: 0.36,
    items: [
      { kind: 'stove', width: 1, depth: 1, limit: 1, placement: 'edge' },
      { kind: 'dining-table', width: 3, depth: 2, limit: 1, placement: 'edge' },
      {
        kind: 'dining-table',
        model: 'small-dining-table',
        width: 1,
        depth: 1,
        limit: 1,
        placement: 'center',
      },
    ],
  },
  workshop: {
    coverage: 0.25,
    items: [
      { kind: 'assembly', width: 2, depth: 1, limit: 1, placement: 'center' },
      { kind: 'assembly', model: 'bench', width: 1, depth: 1, limit: 1, placement: 'center' },
      { kind: 'anvil', width: 1, depth: 1, limit: 1, placement: 'spread' },
      { kind: 'tool-rack', width: 2, depth: 1, limit: 1, placement: 'edge' },
    ],
  },
  training: {
    coverage: 0.2,
    items: [
      { kind: 'straw-dummy', width: 1, depth: 1, limit: 1, placement: 'spread' },
      { kind: 'shield-dummy', width: 1, depth: 1, limit: 1, placement: 'spread' },
      { kind: 'target-post', width: 1, depth: 1, limit: 1, placement: 'spread' },
      { kind: 'striking-pillar', width: 1, depth: 1, limit: 1, placement: 'spread' },
    ],
  },
  library: {
    coverage: 0.34,
    items: [
      { kind: 'long-bookcase', width: 3, depth: 1, limit: 2, placement: 'edge' },
      { kind: 'lectern', width: 1, depth: 1, limit: 2, placement: 'spread' },
    ],
  },
};

export const roomFloors: Record<string, { base: string; trim: string }> = {
  treasure: { base: '#414044', trim: '#b78e54' },
  dormitory: { base: '#68503d', trim: '#c1a276' },
  kitchen: { base: '#a76d4b', trim: '#d0b28a' },
  workshop: { base: '#465563', trim: '#b6965f' },
  training: { base: '#885842', trim: '#b29261' },
  library: { base: '#414f68', trim: '#a4aaae' },
};

export const residentBedding: Record<string, { model: 'cot' | 'bed' | 'rune-bed' | 'den'; color: string }> = {
  miner: { model: 'cot', color: '#877755' },
  engineer: { model: 'cot', color: '#b48a36' },
  warrior: { model: 'bed', color: '#a4513e' },
  runesmith: { model: 'rune-bed', color: '#577ba9' },
  'cave-hound': { model: 'den', color: '#7d8250' },
};
