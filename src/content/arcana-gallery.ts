import { createWorld } from '../game/world.ts';
import { lightingDefaults } from './lighting.ts';
import { spellDefinitions, summonStonehandSpell } from './spells.ts';
import type { World } from '../game/types.ts';

export const arcanaGalleryName = 'Spells, Traps & Hearthstones — Before & After';
export const arcanaGalleryEntries = [
  { ...summonStonehandSpell, kind: 'spell' as const, radius: 0.5 },
  ...spellDefinitions.map((s) => ({
    id: s.id,
    name: s.name,
    kind: 'spell' as const,
    radius: s.radius ?? 0.5,
  })),
  { id: 'spike-trap', name: 'Spike Trap', kind: 'trap' as const, radius: 0.5 },
  { id: 'bolt-trap', name: 'Bolt Trap', kind: 'trap' as const, radius: 0.5 },
  { id: 'stone-hearth', name: 'Stone Hearth', kind: 'hearth' as const, radius: 1.5 },
  { id: 'onward-hearth', name: 'Onward Hearthstone', kind: 'hearth' as const, radius: 0.5 },
].map((entry, i) => {
  const size =
    entry.id === 'call-to-arms'
      ? 6.4
      : entry.id === 'thunder-rune'
        ? 3.4
        : entry.id === 'stone-hearth'
          ? 3.1
          : 1.7;
  return {
    ...entry,
    x: 10 + (i % 3) * 17,
    z: 8 + Math.floor(i / 3) * 9,
    pedestal: size,
    spacing: size / 2 + 0.22,
    cameraRadius: size * 2.65 + 1.3,
    targetHeight: entry.id === 'stone-hearth' ? 0.9 : 0.55,
  };
});
export type ArcanaEntry = (typeof arcanaGalleryEntries)[number];
export const isArcanaGallery = (w: World) => w.name === arcanaGalleryName;

/** Ordinary claimed presentation chamber; render-only exhibits create no room services. */
export function createArcanaGallery(freeRoomBuilding = false) {
  const w = createWorld({
    id: 'arcana-gallery',
    name: arcanaGalleryName,
    width: 56,
    height: 49,
    hearth: { x: 3, z: 45 },
    openings: [[2, 2, 53, 46]],
    seams: [],
  });
  for (const t of w.tiles) {
    t.known = true;
    t.claimed = t.terrain === 'floor';
  }
  w.freeRoomBuilding = freeRoomBuilding;
  w.lightingTest = {
    ...lightingDefaults,
    ambient: 0.72,
    rim: 0.68,
    glow: 0.24,
    sourceStrength: 0,
    pointer: false,
  };
  return w;
}
