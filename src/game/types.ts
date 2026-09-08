export type Terrain = 'floor' | 'dirt' | 'rock' | 'bedrock' | 'gold' | 'gem';
export interface Point { x: number; z: number }
export interface Tile extends Point {
  terrain: Terrain;
  known: boolean;
  claimed: boolean;
  reinforced?: boolean;
  wallPlanned?: boolean;
  wallProgress?: number;
  designated: boolean;
  core: boolean;
  room?: string;
  roomPaid?: number;
  gold: number;
  loose: number;
  source?: 'gold' | 'gem';
}
export interface LevelDefinition {
  id: string; name: string; width: number; height: number; hearth: Point;
  openings: [number, number, number, number][];
  seams: { terrain: Terrain; cells: Point[] }[];
}
export interface World {
  width: number; height: number; name: string; hearth: Point; tiles: Tile[]; revision: number;
  agents: Resident[]; furnishings: Furnishing[]; roomServices: RoomService[]; elapsed: number; allowance: number; spent: number; freeRoomBuilding:boolean;
  craftOrders:CraftOrder[];outputs:Record<string,number>;
  researchOrders?:ResearchOrder[];
  barrier?:Point&{health:number;maxHealth:number;until:number};
  rally?:Point&{until:number;radius:number};
  spellBursts?:Array<Point&{id:string;at:number;radius:number}>;
  recruitment?:{enabled:boolean;nextAt:number;cursor:number};
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
  id:number; health:number; target:Point; facing:number; pinnedUntil:number;
  nextAttackAt:number; activity:string; hitAt:number; diedAt?:number;
  effects?:SpellEffect[];
}
export interface SpellEffect {id:string;kind:'haste'|'slow'|'shield'|'mend'|'reckoning';until:number;strength:number;remaining?:number;rate?:number;pauseSeconds?:number;startedAt:number}
export interface Furnishing extends Point {
  id:string; room:string; kind:string; model?:string; rotation:number; cells:Point[]; access:Point;
}
// Gameplay capacity belongs to room floor, independently of decorative furnishings.
export interface RoomService extends Point {
  id:string; room:string; service:string; access:Point; capacity:number; stored:number; assigned?:number;
}
export interface CraftOrder {id:number;recipe:string;state:'queued'|'working'|'done';progress:number;paid:boolean;worker?:number}
export interface ResearchOrder {id:number;spell:string;state:'queued'|'working'|'ready';progress:number;unlocked:boolean;paused?:boolean;worker?:number}
export interface Job { kind:'mine'|'buildWall'|'reinforce'|'claim'|'collect'|'deliver'|'drop'|'idle'|'sleep'|'eat'|'craft'|'train'|'research'; target:Point; work:Point; progress:number; furnishing?:string; stalled?:number; lastDistance?:number;order?:number }
export interface Resident extends Point {
  id:number; name:string; type:string; capabilities:string[]; job?:Job; path:Point[]; carrying:number;
  activity:string; facing:number; retry:number;
  cargoOrigin?:Point; resumeMine?:Point;
  energy:number;rested:number;hunger:number;meals:number;
  avoidFacility?:string;avoidUntil?:number;
  crafted:number;
  trainingLevel?:number;trainingProgress?:number;nextTrainingAt?:number;
  health?:number;maxHealth?:number;hitAt?:number;nextAttackAt?:number;effects?:SpellEffect[];
  combatTarget?:number;rallying?:boolean;rallyUnreachable?:boolean;recovering?:boolean;
}
export const key = (p: Point) => `${p.x},${p.z}`;
export const tileAt = (w: World, x: number, z: number): Tile | undefined =>
  x >= 0 && z >= 0 && x < w.width && z < w.height ? w.tiles[z * w.width + x] : undefined;
export const neighbors = (w: World, p: Point) =>
  [[1,0],[-1,0],[0,1],[0,-1]].map(([x,z]) => tileAt(w,p.x+x,p.z+z)).filter((t): t is Tile => !!t);
