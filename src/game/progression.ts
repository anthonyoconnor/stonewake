import {type World,type Resident} from './types.ts';
import {tuning} from '../content/tuning.ts';
import {alive,hasteRate} from './spell-effects.ts';
import {characterLevel,maxCharacterLevel} from '../content/characters.ts';
export const characterStats=(a:Resident)=>characterLevel(a.type,a.level??1);
export const nextCharacterLevel=(a:Resident)=>characterStats(a).level<maxCharacterLevel(a.type)?characterLevel(a.type,characterStats(a).level+1):undefined;
export const workRate=(w:World,a:Resident)=>characterStats(a).workMultiplier*hasteRate(w,a);
export const canTrain=(w:World,a:Resident)=>alive(a)&&!!nextCharacterLevel(a)&&(a.nextTrainingAt??0)<=w.elapsed;

// Call only when a level or its configured stats change; combat fixtures and
// spells may intentionally hold other current health values between changes.
export function syncCharacterHealth(a:Resident){
  const maximum=characterStats(a).health;
  const previousMaximum=a.maxHealth??maximum,current=a.health??previousMaximum;
  a.maxHealth=maximum;
  a.health=current<=0?0:Math.max(0,Math.min(maximum,current+maximum-previousMaximum));
}
export function levelUp(w:World,a:Resident){
  const next=nextCharacterLevel(a);if(!next||!alive(a))return false;
  // Set a baseline before changing level for residents without explicit HP yet.
  a.maxHealth??=characterStats(a).health;a.health??=a.maxHealth;
  a.level=next.level;syncCharacterHealth(a);
  a.trainingProgress=0;a.nextTrainingAt=w.elapsed+tuning.trainingInterval;
  w.revision++;return true;
}
