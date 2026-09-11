import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const groups: Record<string, string[]> = {
  showcase: ['settlement-showcase', 'level-preview', 'session'],
  'level-overhaul': ['campaign-layouts', 'campaign-playthrough', 'campaign-pressure', 'standalone-playthrough', 'campaign', 'session', 'bridges'],
  standalone: ['campaign-layouts', 'standalone-playthrough', 'session'],
  'room-overhaul': ['room-decoration', 'rooms', 'food', 'reclaim', 'learning-rooms', 'lighting-lab', 'ruins', 'content-extension'],
  arcana: ['spells', 'stonehands', 'defenses', 'hearth', 'development'],
  audio: ['audio'],
  habitats: ['habitats', 'enemies', 'encounters'],
  ruins: ['ruins', 'rooms', 'reclaim'],
  balance: ['campaign-playthrough', 'campaign-pressure', 'combat-balance', 'economy', 'morale'],
  lighting: ['lighting-lab', 'rooms'],
  menus: ['session', 'campaign'],
  combat: ['combat-balance', 'cave-hounds', 'enemies', 'recruitment'],
  work: ['miner-work-pool', 'security', 'mining', 'movement', 'gold-bags'],
  notifications: ['notifications', 'recruitment', 'morale'],
  pricing: ['stonehands', 'settings'],
  workforce: ['stonehands', 'cave-hounds', 'recruitment'],
  security: ['security', 'cave-hounds', 'miner-work-pool', 'movement', 'defenses', 'spells'],
  characters: ['character-levels', 'settings'],
  economy: ['economy', 'recruitment', 'stonehands'],
  movement: ['movement', 'mining', 'gold-bags'],
  rooms: ['rooms', 'food', 'reclaim', 'learning-rooms'],
  research: ['progression-research', 'spells'],
  defenses: ['defenses'], enemies: ['enemies', 'encounters'], encounters: ['encounters'],
  hearth: ['hearth'], morale: ['morale'], campaign: ['campaign', 'campaign-layouts', 'bridges'], bridges: ['bridges'],
  development: ['development', 'verification'], verification: ['verification'],
};
export const browserChecks: Record<string, string[][]> = {
  showcase: [['scripts/settlement-showcase-browser.mjs']],
  'level-overhaul': [['scripts/level-overhaul-browser.mjs']],
  habitats: [['scripts/habitats-browser.mjs']],
  'level-preview': [['scripts/level-preview-browser.mjs']],
  'room-overhaul': [['scripts/room-overhaul-browser.mjs']],
  debug: [['scripts/debug-browser.mjs']],
  arcana: [['scripts/arcana-gallery-browser.mjs']],
  'graphics-gallery': [['scripts/graphics-gallery-browser.mjs']],
  'terrain-comparison': [['scripts/terrain-comparison-browser.mjs']],
  ruins: [['scripts/ruin-inspection-browser.mjs']],
  audio: [['scripts/audio-browser.mjs']],
  animation: [['scripts/character-visuals-browser.mjs'], ['scripts/enemies-browser.mjs']],
  lighting: [['scripts/lighting-browser.mjs']],
  'terrain-batches': [['scripts/terrain-batches-browser.mjs']],
  loading: [['scripts/loading-browser.mjs']],
  menus: [['scripts/menu-browser.mjs']],
  combat: [['scripts/combat-browser.mjs']],
  camera: [['scripts/camera-browser.mjs']],
  work: [['scripts/work-priorities-browser.mjs']],
  notifications: [['scripts/notifications-browser.mjs']],
  pricing: [['scripts/workforce-browser.mjs', 'pricing']],
  workforce: [['scripts/workforce-browser.mjs', 'overview']],
  characters: [['scripts/workforce-browser.mjs', 'stats']],
  models: [['scripts/workforce-browser.mjs', 'models']],
  rooms: [['scripts/rooms-browser.mjs']], movement: [['scripts/miners-browser.mjs', '--stonehands']],
  hounds: [['scripts/hounds-browser.mjs']], defenses: [['scripts/defense-tools-browser.mjs']],
  security: [['scripts/security-browser.mjs']],
  campaign: [['scripts/campaign-browser.mjs']], interface: [['scripts/interface-browser.mjs']],
  smoke: [['scripts/browser-smoke.mjs']],
  integration: [['scripts/browser-smoke.mjs'], ['scripts/interface-browser.mjs'], ['scripts/notifications-browser.mjs'], ['scripts/campaign-browser.mjs']],
};

function dependencies(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const match of readFileSync(file, 'utf8').matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) {
    if (!match[1].startsWith('.')) continue;
    const target = resolve(dirname(file), match[1]);
    const found = [target, `${target}.ts`, `${target}/index.ts`].find(p => p.endsWith('.ts') && existsSync(p));
    if (found) dependencies(found, seen);
  }
  return seen;
}
export function planChecks(scope = 'changed', files: string[] = [], root = process.cwd()) {
  const all = readdirSync(resolve(root, 'tests')).filter(f => f.endsWith('.test.ts')).map(f => `tests/${f}`).sort();
  const selected = new Set<string>(), unresolved: string[] = [], syntax: string[] = [];
  let typecheck = scope !== 'changed';
  if (scope === 'all') all.forEach(t => selected.add(t));
  else if (scope !== 'changed') {
    const names = groups[scope] ?? [scope.replace(/^tests\//, '').replace(/\.test\.ts$/, '')];
    for (const name of names) {
      const file = `tests/${name}.test.ts`;
      if (!all.includes(file)) throw Error(`Unknown test/scope: ${name}. Choose ${Object.keys(groups).join(', ')}, all, or a test filename.`);
      selected.add(file);
    }
  } else {
    let graphs: Map<string, Set<string>> | undefined;
    for (const original of files) {
      const file = original.replaceAll('\\', '/');
      if (/\.(md|png|jpe?g|webp|gif|svg)$/i.test(file)) continue;
      if (file.endsWith('.mjs')) {
        if (existsSync(resolve(root, file))) syntax.push(file);
        continue;
      }
      typecheck = true;
      if (all.includes(file)) { selected.add(file); continue; }
      if (!file.endsWith('.ts')) { unresolved.push(file); continue; }
      graphs ??= new Map(all.map(t => [t, dependencies(resolve(root, t))]));
      const affected = all.filter(t => graphs!.get(t)!.has(resolve(root, file)));
      if (!affected.length) unresolved.push(file);
      affected.forEach(t => selected.add(t));
    }
  }
  const tests = [...selected].sort();
  // Shared imports can connect most tests. Require a focused scope instead of
  // silently turning a small edit into a full regression run.
  const needsScope = scope === 'changed' && (tests.length > 6 || unresolved.length > 0);
  return { tests, syntax, typecheck, unresolved, needsScope };
}
