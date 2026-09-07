export type Terrain = 'floor' | 'dirt' | 'rock' | 'bedrock' | 'gold' | 'gem';
export interface Point { x: number; z: number }
export interface Tile extends Point {
  terrain: Terrain;
  known: boolean;
  claimed: boolean;
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
}
export const key = (p: Point) => `${p.x},${p.z}`;
export const tileAt = (w: World, x: number, z: number): Tile | undefined =>
  x >= 0 && z >= 0 && x < w.width && z < w.height ? w.tiles[z * w.width + x] : undefined;
export const neighbors = (w: World, p: Point) =>
  [[1,0],[-1,0],[0,1],[0,-1]].map(([x,z]) => tileAt(w,p.x+x,p.z+z)).filter((t): t is Tile => !!t);
