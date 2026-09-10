import type { LevelDefinition, Point } from '../game/types.ts';
import { borderLevel, borderPlan } from './campaign-border.ts';
import { fungalLevel, fungalPlan } from './campaign-fungal.ts';
import { ancientLevel, ancientPlan } from './campaign-ancient.ts';
import { crystalLevel, crystalPlan } from './campaign-crystal.ts';
import { royalLevel, royalPlan } from './campaign-royal.ts';
import { levelPlayPlan, levelPlayPlans, type LevelPlayPlan } from './level-play-plans.ts';
import { row, col, union } from './level-authoring.ts';

export const authoredCampaignLevels = [borderLevel, fungalLevel, ancientLevel, crystalLevel, royalLevel];

/** Repeatable ordinary player choices, independently authored for each geography. */
export const campaignApproaches: Record<string, LevelPlayPlan> = {
  'border-foothold': borderPlan,
  'fungal-hollows': fungalPlan,
  'fallen-city': ancientPlan,
  'crystal-divide': crystalPlan,
  'royal-deep': royalPlan,
};
for (const [id,plan] of Object.entries(campaignApproaches)) levelPlayPlans[`campaign-${id}`] = plan;

/** Keep the horizontal-then-vertical waypoint convention used by recorded player routes. */
export function approachCells(waypoints: Point[]) {
  const shapes: Point[][] = [];
  for (let i=1;i<waypoints.length;i++) {
    const a=waypoints[i-1], b=waypoints[i];
    shapes.push(row(Math.min(a.x,b.x),a.z,Math.abs(a.x-b.x)+1),col(b.x,Math.min(a.z,b.z),Math.abs(a.z-b.z)+1));
  }
  return union(...shapes);
}
export function settlementPlan(level: LevelDefinition) {
  const plan=levelPlayPlan(level.id);
  if (!plan) throw Error(`No authored player plan for ${level.id}`);
  return plan.settlement;
}
