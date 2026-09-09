import type { EncounterDefinition, EncounterState } from './encounters.ts';
import type { HearthState, OnwardHearthDefinition, OnwardHearthState } from './hearth.ts';
import type { MoraleCause, MoraleState } from './morale.ts';
import type { CampaignState } from './campaign.ts';
import type { BiomeId, EnemyHabitat } from '../content/habitats.ts';
import type { RuinDefinition } from '../content/ruins.ts';
export type Terrain = 'floor' | 'dirt' | 'rock' | 'bedrock' | 'gold' | 'gem' | 'water' | 'lava' | 'chasm';
export interface Point { x: number; z: number }
export interface Tile extends Point {
  terrain: Terrain;
  known: boolean;
  claimed: boolean;
  reinforced?: boolean;
  bridge?: boolean;
  bridgePlanned?: boolean;
  bridgeProgress?: number;
  bridgePaid?: number;
  wallPlanned?: boolean;
  wallProgress?: number;
  designated: boolean;
  core: boolean;
  onward?: boolean;
  room?: string;
  roomPaid?: number;
  ruin?: { id: string; room: string };
  gold: number;
  loose: number;
  source?: 'gold' | 'gem';
}
export interface LevelDefinition {
  id: string; name: string; width: number; height: number; hearth: Point;
  openings: [number, number, number, number][];
  seams: { terrain: Terrain; cells: Point[] }[];
  encounters?: EncounterDefinition[];
  onwardHearth?: OnwardHearthDefinition;
  biome?: BiomeId;
  ruins?: RuinDefinition[];
}
export interface World {
  biome?: BiomeId;
  availability?: import('./availability.ts').ContentAvailability;
  lightingTest?: import('../content/lighting-lab.ts').LightingSettings;
  freePlay?: { levelId: string; buildings: string[]; knownSpells: string[] };
  combatTest?: { team: string; opponent: string; support: 'none' | 'traps' | 'spells'; initialResidents: number; initialEnemies: number };
  campaign?: CampaignState;
  width: number; height: number; name: string; hearth: Point; tiles: Tile[]; revision: number;
  agents: Resident[]; furnishings: Furnishing[]; roomServices: RoomService[]; elapsed: number; nextPaydayAt:number; allowance: number; spent: number; freeRoomBuilding:boolean;
  craftOrders:CraftOrder[];outputs:Record<string,number>;
  researchOrders?:ResearchOrder[];
  security?:{alerts:SecurityAlert[];nextScanAt:number;patrolled:Record<string,number>};
  barrier?:Point&{health:number;maxHealth:number;until:number};
  rally?:Point&{until:number;radius:number};
  spellBursts?:Array<Point&{id:string;at:number;radius:number}>;
  recruitment?:{enabled:boolean;nextAt:number;cursor:number;readyAt:Record<string,number>;lastArrivalAt?:number;preferred?:string;dormitoryFull:boolean;fullEpisode:number;seenTypes?:string[]};
  encounters?:EncounterState[];
  outcome?:'defeat'|'victory';
  hearthState?:HearthState;
  onwardHearth?:OnwardHearthState;
  moraleDismissed?:Partial<Record<MoraleCause,'warning'|'leaving'>>;
  departures?:Array<{id:number;name:string;type:string;at:number;causes:MoraleCause[]}>;
  defenses?:Defense[]; enemies?:Enemy[]; nextDefenseId?:number; nextEnemyId?:number;
  defenseTest?:{spawn:Point;target:Point};
  spellTest?:{spawn:Point;target:Point;paused?:boolean};
  nextResidentId?:number;
  routesChanged?:boolean;
}
export type DoorMode='open'|'closed'|'locked';
export interface Defense extends Point {
  id:number; type:string; rotation:number; mode:DoorMode; health:number;maxHealth:number;
  openUntil:number; readyAt:number; triggeredAt:number; shotEnd?:Point;
}
export interface Enemy extends Point {
  type?:string; maxHealth?:number; attackedAt?:number; abilityReadyAt?:number; shotEnd?:Point;
  chargeUntil?:number; digging?:Point&{progress:number};
  id:number; health:number; target:Point; facing:number; pinnedUntil:number;
  nextAttackAt:number; activity:string; hitAt:number; diedAt?:number;
  effects?:SpellEffect[];
  sourceId?:string; dormant?:boolean;
  habitat?: EnemyHabitat;
}
export interface SpellEffect {id:string;kind:'haste'|'slow'|'shield'|'mend'|'reckoning';until:number;strength:number;remaining?:number;rate?:number;pauseSeconds?:number;startedAt:number}
export interface SecurityAlert extends Point {id:string;at:number;enemy?:number}
export interface Furnishing extends Point {
  id:string; room:string; kind:string; model?:string; rotation:number; cells:Point[]; access:Point;
}
// Gameplay capacity belongs to room floor, independently of decorative furnishings.
export interface RoomService extends Point {
  id:string; room:string; service:string; access:Point; capacity:number; stored:number; assigned?:number;
}
export interface CraftOrder {id:number;recipe:string;state:'queued'|'working'|'done';progress:number;paid:boolean;worker?:number}
export interface ResearchOrder {id:number;spell:string;state:'queued'|'working'|'ready';progress:number;unlocked:boolean;paused?:boolean;worker?:number}
export interface Job { kind:'mine'|'buildBridge'|'buildWall'|'reinforce'|'claim'|'collect'|'deliver'|'drop'|'scout'|'idle'|'sleep'|'eat'|'craft'|'train'|'research'|'pay'|'activate'; target:Point; work:Point; progress:number; furnishing?:string; stalled?:number; lastDistance?:number;order?:number }
export type WorkGroup = 'resource' | 'haul' | 'excavate' | 'construction' | 'claim' | 'reinforce';
export interface Resident extends Point {
  attackedAt?:number;
  id:number; name:string; type:string; capabilities:string[]; job?:Job; path:Point[]; carrying:number;
  activity:string; facing:number; retry:number;
  cargoOrigin?:Point; resumeMine?:Point;
  workAssignment?:{group:WorkGroup;target:Point;remaining:number};
  energy:number;rested:number;hunger:number;meals:number;
  scout?:{reviewAt:number};
  guard?:{checked:Record<string,number>;repathAt:number;alert?:string};
  responding?:boolean;
  fleeing?:{until:number;repathAt:number;danger:Point[]};
  avoidFacility?:string;avoidUntil?:number;
  crafted:number;
  level?:number;experience?:number;nextTrainingAt?:number;
  health?:number;maxHealth?:number;hitAt?:number;nextAttackAt?:number;effects?:SpellEffect[];
  combatTarget?:number;rallying?:boolean;rallyUnreachable?:boolean;recovering?:boolean;
  pay?:{due:Array<{at:number;amount:number}>;paid:number;collections:number};
  morale?:MoraleState;
}
export const key = (p: Point) => `${p.x},${p.z}`;
export const tileAt = (w: World, x: number, z: number): Tile | undefined =>
  x >= 0 && z >= 0 && x < w.width && z < w.height ? w.tiles[z * w.width + x] : undefined;
export const neighbors = (w: World, p: Point) =>
  [[1,0],[-1,0],[0,1],[0,-1]].map(([x,z]) => tileAt(w,p.x+x,p.z+z)).filter((t): t is Tile => !!t);
