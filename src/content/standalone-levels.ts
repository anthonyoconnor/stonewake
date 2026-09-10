import { standaloneBorderLevel, standaloneBorderPlan, upperLevel, upperPlan } from './standalone-upper.ts';
import { emberwaterLevel, emberwaterPlan, calderaLevel, calderaPlan } from './standalone-crossings.ts';
import { prismLevel, prismPlan } from './standalone-crystal.ts';
import { fungalStandaloneLevel, fungalStandalonePlan, ancientStandaloneLevel, ancientStandalonePlan } from './standalone-wetlands.ts';
import { levelPlayPlans } from './level-play-plans.ts';

/** Independent scenarios retain their catalog IDs and their own authored player plans. */
export const standaloneLevels = [
  standaloneBorderLevel, emberwaterLevel, upperLevel, fungalStandaloneLevel,
  ancientStandaloneLevel, prismLevel, calderaLevel,
];
const plans = [
  standaloneBorderPlan, emberwaterPlan, upperPlan, fungalStandalonePlan,
  ancientStandalonePlan, prismPlan, calderaPlan,
];
for (const [index, level] of standaloneLevels.entries()) levelPlayPlans[level.id!] = plans[index];
