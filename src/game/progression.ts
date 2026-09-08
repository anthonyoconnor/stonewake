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
  a.experience=0;a.nextTrainingAt=w.elapsed+tuning.trainingInterval;
  w.revision++;return true;
}

// Training and real melee hits share one next-level requirement. Combat can
// carry earned surplus onward; a training visit always ends at its first level.
export function gainExperience(w:World,a:Resident,amount:number,source:'training'|'combat'){
  if(!alive(a)||!nextCharacterLevel(a)||!Number.isFinite(amount)||amount<=0)return false;
  let progress=(a.experience??0)+amount;
  a.experience=progress;
  let gained=false,next=nextCharacterLevel(a);
  while(next&&progress>=next.trainingSeconds){
    progress-=next.trainingSeconds;
    levelUp(w,a);gained=true;
    if(source==='training')break;
    next=nextCharacterLevel(a);a.experience=next?progress:0;
  }
  return gained;
}
