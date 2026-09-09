import { characterLevel } from './characters.ts';
import { enemyDefinitions } from './enemies.ts';
import { createWorld } from '../game/world.ts';
import { addResidents, tick } from '../game/simulation.ts';
import { addEnemy, placeDefense } from '../game/defenses.ts';
import { buildRoom } from '../game/rooms.ts';
import { prepareTestSpells } from './spell-lab.ts';
import { health } from '../game/spell-effects.ts';
import type { World } from '../game/types.ts';

export const combatTeams = [
  { id: 'hound', name: 'One Cave Hound', type: 'cave-hound', count: 1, level: 1 },
  { id: 'pair', name: 'Two Cave Hounds', type: 'cave-hound', count: 2, level: 1 },
  { id: 'pack', name: 'Six Cave Hounds', type: 'cave-hound', count: 6, level: 1 },
  { id: 'warrior', name: 'One Warrior · level 1', type: 'warrior', count: 1, level: 1 },
  { id: 'veterans', name: 'Two Warriors · level 3', type: 'warrior', count: 2, level: 3 },
  { id: 'squad', name: 'Four Warriors · level 3', type: 'warrior', count: 4, level: 3 },
  { id: 'engineer', name: 'One Engineer · level 1', type: 'engineer', count: 1, level: 1 },
  { id: 'runesmith', name: 'One Runesmith · level 1', type: 'runesmith', count: 1, level: 1 },
];
export const combatOpponents = [
  ...enemyDefinitions.map(e => ({ id: e.id, name: e.name, roster: [e.id] })),
  { id: 'raiding-party', name: 'Raider patrol · three goblins', roster: Array<string>(3).fill('goblin-raider') },
  { id: 'fungal-nest', name: 'Fungal nest · brute + two spiders', roster: ['spore-brute', 'cave-spider', 'cave-spider'] },
  { id: 'ancient-hall', name: 'Ancient hall · sentinel + two guards', roster: ['ancient-sentinel', 'restless-guard', 'restless-guard'] },
  { id: 'crystal-patrol', name: 'Crystal patrol · two elementals + stalker', roster: ['crystal-elemental', 'crystal-elemental', 'crystalback-stalker'] },
  { id: 'volcanic-lair', name: 'Volcanic lair · Deepmaw + two Cinderlings', roster: ['deepmaw', 'cinderling', 'cinderling'] },
];
export interface CombatSetup { team: string; opponent: string; support: 'none' | 'traps' | 'spells' }
export const defaultCombatSetup: CombatSetup = { team: 'pair', opponent: 'goblin-raider', support: 'none' };
const rect = (x: number, z: number, width: number, depth: number) =>
  Array.from({ length: width * depth }, (_, i) => ({ x: x + i % width, z: z + Math.floor(i / width) }));

/** Fixture placement only. Movement, abilities, XP, costs, needs and hits use ordinary systems. */
export function createCombatLab(free = false, setup: CombatSetup = defaultCombatSetup): World {
  const team = combatTeams.find(t => t.id === setup.team)!;
  const opponent = combatOpponents.find(t => t.id === setup.opponent)!;
  if (!team || !opponent) throw new Error('Unknown combat matchup');
  const w = createWorld({ id: 'combat', name: 'Combat test room', width: 28, height: 24,
    hearth: { x: 4, z: 12 }, openings: [[2, 2, 25, 21]], seams: [] });
  w.freeRoomBuilding = free;
  w.allowance = 5000;
  for (const t of w.tiles) { t.known = true; t.claimed = t.terrain === 'floor'; }
  buildRoom(w, 'dormitory', rect(3, 17, 6, 2));
  buildRoom(w, 'kitchen', rect(3, 4, 6, 2));
  if (setup.support === 'traps') {
    buildRoom(w, 'workshop', rect(10, 4, 2, 2));
    // Supplied finished stock, as in the defense yard; placement itself is real.
    w.outputs['bolt-trap'] = 2;
    placeDefense(w, 'bolt-trap', { x: 12, z: 10 }, 0);
    placeDefense(w, 'bolt-trap', { x: 12, z: 12 }, 0);
  }
  if (setup.support === 'spells') {
    buildRoom(w, 'library', rect(10, 4, 2, 2));
    prepareTestSpells(w);
  }
  addResidents(w, team.type, team.count);
  w.agents.forEach((a, i) => Object.assign(a, {
    x: 12 - Math.floor(i / 3), z: 10 + i % 3, level: team.level,
    health: characterLevel(team.type, team.level).health,
    maxHealth: characterLevel(team.type, team.level).health,
  }));
  opponent.roster.forEach((type, i) => addEnemy(w,
    { x: 17 + Math.floor(i / 3), z: 10 + i % 3 }, { x: 12, z: 11 }, type));
  w.combatTest = { ...setup, initialResidents: team.count, initialEnemies: opponent.roster.length };
  return w;
}

export function combatResult(w: World) {
  const residents = w.agents.filter(a => health(a) > 0), enemies = (w.enemies ?? []).filter(e => e.health > 0);
  return { residents: residents.length, enemies: enemies.length,
    residentHealth: Math.ceil(residents.reduce((sum, a) => sum + health(a), 0)),
    enemyHealth: Math.ceil(enemies.reduce((sum, e) => sum + e.health, 0)),
    result: !residents.length ? 'Defenders defeated' : !enemies.length ? 'Defenders won' : 'In progress' };
}

export function runCombatMatchup(setup: CombatSetup, seconds = 90) {
  const w = createCombatLab(false, setup);
  while (w.elapsed < seconds && combatResult(w).result === 'In progress') tick(w, 0.05);
  return { ...combatResult(w), seconds: Number(w.elapsed.toFixed(2)) };
}
