import type { Point } from '../game/types.ts';
import { rect, row, union } from './level-authoring.ts';

export interface SettlementPlan {
  treasure: Point[]; dormitory: Point[]; kitchen: Point[];
  training: Point[]; workshop: Point[]; library: Point[];
  gold: Point[]; development: Point[];
}
export interface LevelPlayPlan {
  settlement: SettlementPlan;
  intended: Point[]; alternate: Point[];
  suppression?: Point[]; defenses?: Point[];
  defensesByApproach?: { intended: Point[]; alternate: Point[] };
}

/** Authored player-action examples, not paths granted to residents or changes to the map. */
export const levelPlayPlans: Record<string, LevelPlayPlan> = {};
export const levelPlayPlan = (id: string): LevelPlayPlan | undefined => levelPlayPlans[id];

/** A compact, rotatable paid settlement. The surrounding geography belongs to each map. */
export function settlementBlueprint(hearth: Point, quarterTurns = 0): SettlementPlan {
  const transform = (cells: Point[]) => cells.map(p => {
    let { x, z } = p;
    for (let i = 0; i < quarterTurns; i++) [x, z] = [-z, x];
    return { x: hearth.x + x, z: hearth.z + z };
  });
  const gold = union(row(-4,-7,9), row(4,-6,4), row(-4,6,8));
  return {
    treasure: transform(rect(-4,-5,3,2)), dormitory: transform(rect(2,-2,3,4)),
    kitchen: transform(rect(2,3,3,3)), training: transform(rect(-4,3,2,2)),
    workshop: transform(rect(5,0,2,2)), library: transform(rect(5,3,2,2)),
    gold: transform(gold), development: transform(union(rect(-4,-7,11,14),gold)),
  };
}
