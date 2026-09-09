import { neighbors, tileAt, type World, type Point } from '../game/types.ts';
import { environmentPalette, hasBiomeGrowth } from './environment-visuals.ts';

export const lightingDefaults = {
  enabled: true,
  ambient: 0.22,
  rim: 0.18,
  sourceStrength: 2.4,
  sourceRadius: 5,
  glow: 0.55,
  pointer: true,
  pointerStrength: 1.5,
  pointerRadius: 3.5,
};
export type LightingSettings = typeof lightingDefaults;
export const lightingBudget = { sources: 6, materialLights: 5, actorMaskMilliseconds: 180 };
export function gameplayLighting(w: World): LightingSettings {
  const palette = environmentPalette(w);
  return {
    ...lightingDefaults,
    ambient: palette.ambient,
    rim: palette.directional,
    sourceStrength: 2.0,
    sourceRadius: 5.5,
    glow: 0.34,
    pointerStrength: 1.05,
    pointerRadius: 3.25,
  };
}
export interface LightSource extends Point {
  id: string;
  y: number;
  color: string;
}
/** Mirrors actual wall sconces and emissive terrain; concealed sources are never included. */
export function lightingSources(w: World): LightSource[] {
  const sources: LightSource[] = [{ id: 'hearth', ...w.hearth, y: 2.1, color: '#7bdff5' }];
  for (const t of w.tiles) {
    if (!t.known) continue;
    if (
      hasBiomeGrowth(w, t) &&
      neighbors(w, t).some((n) => n.known && !['floor', 'water', 'lava', 'chasm'].includes(n.terrain))
    )
      sources.push({
        id: `growth-${t.x}-${t.z}`,
        x: t.x,
        z: t.z,
        y: 0.5,
        color: environmentPalette(w).growth,
      });
    if (t.terrain === 'lava' && (t.x + t.z) % 4 === 0)
      sources.push({ id: `lava-${t.x}-${t.z}`, x: t.x, z: t.z, y: 0.55, color: '#ff883b' });
    if (t.terrain === 'gem')
      sources.push({ id: `gem-${t.x}-${t.z}`, x: t.x, z: t.z, y: 1.8, color: '#799def' });
    if (t.terrain === 'floor' && (t.x + t.z) % 4 === 0)
      for (const n of neighbors(w, t)) {
        if (n.known && n.reinforced && !['floor', 'water', 'lava', 'chasm'].includes(n.terrain))
          sources.push({
            id: `lamp-${t.x}-${t.z}-${n.x}-${n.z}`,
            x: t.x + (n.x - t.x) * 0.36,
            z: t.z + (n.z - t.z) * 0.36,
            y: 1.08,
            color: '#ffc779',
          });
      }
  }
  // Visible stove fires and reading candles provide restrained warm pools beside the cool Hearth.
  for (const furnishing of w.furnishings) {
    const model = furnishing.model ?? furnishing.kind;
    if (!['stove', 'lectern', 'bookshelf'].includes(model) || !tileAt(w, furnishing.x, furnishing.z)?.known)
      continue;
    const reading = model !== 'stove',
      large = model === 'bookshelf';
    const localX = reading ? (large ? 0.73 : 0.25) : 0,
      localZ = reading ? 0.2 : -0.27;
    sources.push({
      id: `furnishing-${furnishing.id}`,
      x: furnishing.x + (large && !furnishing.rotation ? 0.5 : 0) + (furnishing.rotation ? localZ : localX),
      z: furnishing.z + (large && furnishing.rotation ? 0.5 : 0) + (furnishing.rotation ? -localX : localZ),
      y: reading ? 0.95 : 0.75,
      color: reading ? '#ffd49a' : '#ffb668',
    });
  }
  if (w.onwardHearth && tileAt(w, w.onwardHearth.x, w.onwardHearth.z)?.known)
    sources.push({ ...w.onwardHearth, id: 'onward-hearth', y: 1.5, color: '#8fa6ea' });
  return sources;
}

/** Presentation visibility: permit illumination of the first wall face, never beyond it. */
export function lightReaches(w: World, from: Point, to: Point) {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) * 4));
  for (let i = 0; i < steps; i++) {
    const t = tileAt(
      w,
      Math.round(from.x + ((to.x - from.x) * i) / steps),
      Math.round(from.z + ((to.z - from.z) * i) / steps),
    );
    if (!t?.known) return false;
    const endpoint =
      (t.x === Math.round(to.x) && t.z === Math.round(to.z)) ||
      (t.x === Math.round(from.x) && t.z === Math.round(from.z));
    if (!endpoint && !['floor', 'water', 'lava', 'chasm'].includes(t.terrain)) return false;
  }
  return !!tileAt(w, Math.round(to.x), Math.round(to.z))?.known;
}
