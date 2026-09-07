import {type World,type Resident} from './types.ts';
import {tuning} from '../content/tuning.ts';
import {hasteRate} from './spell-effects.ts';
export const trainingLevel=(a:Resident)=>Math.min(tuning.trainingLevels,a.trainingLevel??0);
export const workRate=(w:World,a:Resident)=>(1+trainingLevel(a)*tuning.trainingBonus)*hasteRate(w,a);
export const canTrain=(w:World,a:Resident)=>trainingLevel(a)<tuning.trainingLevels&&(a.nextTrainingAt??0)<=w.elapsed;
