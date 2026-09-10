import type { Point } from '../game/types.ts';

export type BiomeId = 'upper' | 'fungal' | 'ancient' | 'crystal' | 'volcanic';
export type HabitatBehavior = 'roam' | 'patrol' | 'nest' | 'sentry' | 'skitter' | 'prowl';
export interface HabitatDefinition {
  biome: BiomeId;
  behavior?: HabitatBehavior;
  radius?: number;
  pauseSeconds?: number;
  speedFraction?: number;
  waypoints?: Point[];
}
export interface EnemyHabitat {
  home: Point;
  behavior: HabitatBehavior;
  radius: number;
  pauseSeconds: number;
  speedFraction: number;
  waypoints?: Point[];
  destination?: Point;
  nextMoveAt: number;
  sequence: number;
  territorial: boolean;
}

/** Local life and attack cadence are separate: encounter sources author raid timing. */
export const habitatDefinitions: Record<BiomeId, {
  name: string; behavior: HabitatBehavior; radius: number; pauseSeconds: number; speedFraction: number;
  cue: string; counter: string;
}> = {
  upper: { name: 'Upper workings', behavior: 'patrol', radius: 4, pauseSeconds: 2, speedFraction: 0.6,
    cue: 'Organized patrols occupy branches; burrowers scratch through ordinary earth.',
    counter: 'Protect alternate approaches with hounds, use bedrock and secure entrances.' },
  fungal: { name: 'Fungal hollows', behavior: 'nest', radius: 3, pauseSeconds: 4, speedFraction: 0.5,
    cue: 'Spiders circle nests while heavy spore creatures linger among the caps.',
    counter: 'Train Warriors and avoid feeding clustered defenders into a spore pulse.' },
  ancient: { name: 'Ancient halls', behavior: 'sentry', radius: 3, pauseSeconds: 4, speedFraction: 0.45,
    cue: 'Armored guardians watch ruined halls; heavy fists threaten doors.',
    counter: 'Use trained Warriors and prepared traps; later spells bypass Guard armor.' },
  crystal: { name: 'Crystal caverns', behavior: 'roam', radius: 4, pauseSeconds: 2.5, speedFraction: 0.6,
    cue: 'Stalkers circle formations while elementals watch clear firing lanes.',
    counter: 'Use corners and closed doors to break sight; Slow and Mending sustain an approach.' },
  volcanic: { name: 'Volcanic depths', behavior: 'roam', radius: 4, pauseSeconds: 3, speedFraction: 0.5,
    cue: 'Cinderlings range over lava while Deepmaws rest beside guarded crossings.',
    counter: 'Defend bridges with trained fighters, traps and Library support; watch lava flanks.' },
};

/** Idle movement only; combat speeds and abilities remain in enemies.ts. */
export const speciesHabitats: Record<string, Omit<HabitatDefinition, 'biome' | 'waypoints'>> = {
  'goblin-raider': { behavior: 'patrol', radius: 4, pauseSeconds: 1.2, speedFraction: 0.65 },
  'tunnel-burrower': { behavior: 'nest', radius: 2.5, pauseSeconds: 2.5, speedFraction: 0.55 },
  'cave-spider': { behavior: 'skitter', radius: 3, pauseSeconds: 0.7, speedFraction: 0.9 },
  'spore-brute': { behavior: 'nest', radius: 2, pauseSeconds: 4, speedFraction: 0.45 },
  'restless-guard': { behavior: 'patrol', radius: 3, pauseSeconds: 2, speedFraction: 0.5 },
  'ancient-sentinel': { behavior: 'sentry', radius: 1.5, pauseSeconds: 4, speedFraction: 0.45 },
  'crystal-elemental': { behavior: 'sentry', radius: 2.5, pauseSeconds: 2.5, speedFraction: 0.6 },
  'crystalback-stalker': { behavior: 'prowl', radius: 4, pauseSeconds: 1.5, speedFraction: 0.55 },
  cinderling: { behavior: 'roam', radius: 4, pauseSeconds: 0.6, speedFraction: 0.85 },
  deepmaw: { behavior: 'nest', radius: 3, pauseSeconds: 5, speedFraction: 0.5 },
};

export function createEnemyHabitat(def: HabitatDefinition, home: Point, type: string | undefined, elapsed: number, index: number, territorial: boolean): EnemyHabitat {
  const defaults = { ...habitatDefinitions[def.biome], ...speciesHabitats[type ?? 'goblin-raider'] };
  return { home: { ...home }, behavior: def.behavior ?? defaults.behavior,
    radius: def.radius ?? defaults.radius, pauseSeconds: def.pauseSeconds ?? defaults.pauseSeconds,
    speedFraction: def.speedFraction ?? defaults.speedFraction, waypoints: def.waypoints?.map(p => ({ ...p })),
    nextMoveAt: elapsed + index * 0.3, sequence: index, territorial };
}
