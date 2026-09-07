export type Terrain = 'floor' | 'dirt' | 'rock' | 'bedrock' | 'gold' | 'gem';
export interface Point { x: number; z: number }
export interface Tile extends Point {
  terrain: Terrain;
  known: boolean;
  claimed: boolean;
  reinforced?: boolean;
  designated: boolean;
  core: boolean;
  room?: string;
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
  agents: Resident[]; furnishings: Furnishing[]; elapsed: number; allowance: number; spent: number; freeRoomBuilding:boolean;
  craftOrders:CraftOrder[];outputs:Record<string,number>;
}
export interface Furnishing extends Point {
  id:string; room:string; kind:string; service:string; rotation:number; cells:Point[]; access:Point; capacity:number; stored:number; assigned?:number; progress?:number;output?:string;outputCount?:number;
}
export interface CraftOrder {id:number;recipe:string;state:'queued'|'working'|'done';progress:number;paid:boolean;worker?:number}
export interface Job { kind:'mine'|'reinforce'|'claim'|'collect'|'deliver'|'idle'|'sleep'|'eat'|'craft'; target:Point; work:Point; progress:number; furnishing?:string; stalled?:number; lastDistance?:number;order?:number }
export interface Resident extends Point {
  id:number; name:string; type:string; capabilities:string[]; job?:Job; path:Point[]; carrying:number;
  activity:string; facing:number; retry:number;
  energy:number;rested:number;hunger:number;meals:number;meal:boolean;
  avoidFacility?:string;avoidUntil?:number;
  crafted:number;
}
export const key = (p: Point) => `${p.x},${p.z}`;
export const tileAt = (w: World, x: number, z: number): Tile | undefined =>
  x >= 0 && z >= 0 && x < w.width && z < w.height ? w.tiles[z * w.width + x] : undefined;
export const neighbors = (w: World, p: Point) =>
  [[1,0],[-1,0],[0,1],[0,-1]].map(([x,z]) => tileAt(w,p.x+x,p.z+z)).filter((t): t is Tile => !!t);
