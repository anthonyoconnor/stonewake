import {type World,type Resident} from './types.ts';
import {tuning} from '../content/tuning.ts';
export const trainingLevel=(a:Resident)=>Math.min(tuning.trainingLevels,a.trainingLevel??0);
export const workRate=(w:World,a:Resident)=>1+trainingLevel(a)*tuning.trainingBonus+((w.hasteUntil??0)>w.elapsed?tuning.hasteBonus:0);
export const canTrain=(w:World,a:Resident)=>trainingLevel(a)<tuning.trainingLevels&&(a.nextTrainingAt??0)<=w.elapsed;
