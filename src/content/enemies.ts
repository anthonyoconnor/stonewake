export interface EnemyDefinition {
  id: string;
  name: string;
  region: string;
  description: string;
  health: number;
  speed: number;
  damage: number;
  attackSeconds: number;
  range?: number;
  senseRange?: number;
  armor?: number;
  doorMultiplier?: number;
  ability?: 'burrow' | 'web' | 'spores' | 'charge' | 'cleave';
  abilitySeconds?: number;
  lavaWalker?: boolean;
  scale: number;
}
/** Shared ability values; individual definitions can override their acquisition distance. */
export const enemyBehaviorTuning = {
  senseRange: 6,
  meleeReach: 1.05,
  web: { range: 3, damage: 4, slowSeconds: 4, slowStrength: 0.5, recoverySeconds: 0.6 },
  spores: { range: 2, damage: 12, slowSeconds: 3, slowStrength: 0.3, recoverySeconds: 0.7 },
  charge: { minRange: 1.5, maxRange: 4, seconds: 2, speedMultiplier: 2.3, damageMultiplier: 2 },
  cleave: { range: 1.5, damageFraction: 0.6 },
  burrow: { dirtSeconds: 6, rockSeconds: 10, reinforcedMultiplier: 3 },
};
/** Provisional combat balance lives here, independently of meshes and encounter placement. */
export const enemyDefinitions: EnemyDefinition[] = [
  {
    id: 'goblin-raider',
    name: 'Goblin Raider',
    region: 'upper',
    description: 'A quick melee attacker with scavenged armor and a hooked blade.',
    health: 120,
    speed: 1.2,
    damage: 20,
    attackSeconds: 1,
    scale: 1,
  },
  {
    id: 'tunnel-burrower',
    name: 'Tunnel Burrower',
    region: 'upper',
    description:
      'Digs through earth and rock when routes are sealed. Reinforcement triples excavation time; bedrock and resource columns stop it.',
    health: 170,
    speed: 0.85,
    damage: 17,
    attackSeconds: 1.3,
    ability: 'burrow',
    scale: 1.05,
  },
  {
    id: 'cave-spider',
    name: 'Cave Spider',
    region: 'fungal',
    description:
      'Spits a web from three squares away, slowing movement and attacks for four seconds, then closes to bite.',
    health: 85,
    speed: 1.55,
    damage: 12,
    attackSeconds: 0.85,
    ability: 'web',
    abilitySeconds: 7,
    scale: 1,
  },
  {
    id: 'spore-brute',
    name: 'Spore Brute',
    region: 'fungal',
    description:
      'Releases a close spore pulse that damages and slows clustered dwarfs. Spread the defense or attack from range.',
    health: 220,
    speed: 0.7,
    damage: 18,
    attackSeconds: 1.5,
    ability: 'spores',
    abilitySeconds: 6,
    scale: 1.15,
  },
  {
    id: 'restless-guard',
    name: 'Restless Guard',
    region: 'ancient',
    description:
      'An armored undead guard. Its ancient shield absorbs 35% of melee and trap damage; spells bypass the armor.',
    health: 150,
    speed: 0.8,
    damage: 21,
    attackSeconds: 1.2,
    armor: 0.35,
    scale: 1,
  },
  {
    id: 'ancient-sentinel',
    name: 'Ancient Sentinel',
    region: 'ancient',
    description:
      'A slow stone guardian with crushing fists. Deals triple damage to doors and runic barriers.',
    health: 310,
    speed: 0.55,
    damage: 30,
    attackSeconds: 2,
    doorMultiplier: 3,
    scale: 1.4,
  },
  {
    id: 'crystal-elemental',
    name: 'Crystal Elemental',
    region: 'crystal',
    description:
      'Fires crystal shards across five squares of clear sight. Walls, shut doors and runic barriers stop its shots.',
    health: 150,
    speed: 0.8,
    damage: 23,
    attackSeconds: 1.8,
    range: 5,
    scale: 1.15,
  },
  {
    id: 'crystalback-stalker',
    name: 'Crystalback Stalker',
    region: 'crystal',
    description: 'Singles out weak exposed dwarfs and charges across clear ground for a double-damage bite.',
    health: 135,
    speed: 1.4,
    damage: 16,
    attackSeconds: 1,
    ability: 'charge',
    abilitySeconds: 7,
    scale: 1,
  },
  {
    id: 'cinderling',
    name: 'Cinderling',
    region: 'volcanic',
    description:
      'Hurls embers from three squares away and crosses lava without bridges. Water and chasms still stop it.',
    health: 75,
    speed: 1.65,
    damage: 12,
    attackSeconds: 1.2,
    range: 3,
    lavaWalker: true,
    scale: 0.85,
  },
  {
    id: 'deepmaw',
    name: 'Deepmaw',
    region: 'volcanic',
    description:
      'A heavy predator whose broad bite hits nearby dwarfs in front of it. Its weight doubles damage to doors and barriers.',
    health: 350,
    speed: 0.7,
    damage: 40,
    attackSeconds: 2,
    doorMultiplier: 2,
    ability: 'cleave',
    scale: 1.45,
  },
];
export const enemyById = (id?: string) => enemyDefinitions.find((e) => e.id === id) ?? enemyDefinitions[0];
