import {characterDefinitions} from './characters.ts';
import {tuning,tuningSpec,type TuningKey} from './tuning.ts';
import {roomDefinitions} from './rooms.ts';
import {recipes} from './recipes.ts';
import {spellDefinitions} from './spells.ts';
import {defenseDefinitions} from './defenses.ts';
export interface Setting {id:string;label:string;group:string;min:number;max:number;step:number;note:string;defaultValue:number;get:()=>number;set:(v:number)=>void}
const field=(id:string,label:string,group:string,object:Record<string,any>,key:string,min:number,max:number,step:number,note:string):Setting=>({id,label,group,min,max,step,note,defaultValue:object[key],get:()=>object[key],set:v=>{object[key]=v;}});
// The registries drive the editor: new rooms, recipes and spells appear without UI changes.
export const settings:Setting[]=[
 ...Object.entries(tuningSpec).map(([key,s])=>({...s,id:`tuning.${key}`,defaultValue:s.value,get:()=>tuning[key as TuningKey],set:(v:number)=>{tuning[key as TuningKey]=v;}})),
 ...roomDefinitions.flatMap(r=>[
  field(`room.${r.id}.cost`,`${r.name} · gold/square`,'Rooms',r,'cost',0,10000,1,'New construction only; existing payments are retained.'),
  field(`room.${r.id}.capacityPerTile`,`${r.name} · ${r.service==='storage'?'gold':'dwarfs'} supported/square`,'Rooms',r,'capacityPerTile',.1,1000,.1,'Applies to room floor area; furniture never changes capacity.'),
  ...r.furnishings.flatMap(f=>['width','depth'].map(k=>field(`room.${r.id}.${f.kind}.${k}`,`${r.name} · ${f.kind} · visual ${k}`,'Room appearance',f,k,1,8,1,'Cosmetic only; reload a room layout to compare.')))
 ]),
 ...characterDefinitions.map(c=>field("dwarf."+c.id+".speedMultiplier",c.name+' · walking speed multiplier','Dwarfs',c,'speedMultiplier',.1,5,.1,'Applies live.')),
 ...characterDefinitions.flatMap(c=>c.levels.flatMap(level=>[
  field(`dwarf.${c.id}.level.${level.level}.health`,`${c.name} · level ${level.level} · maximum health`,`${c.name} levels`,level,'health',1,10000,1,'Applies to existing residents; missing health is preserved.'),
  field(`dwarf.${c.id}.level.${level.level}.damage`,`${c.name} · level ${level.level} · attack damage`,`${c.name} levels`,level,'damage',0,1000,.1,'Applies live to combat.'),
  field(`dwarf.${c.id}.level.${level.level}.attackSeconds`,`${c.name} · level ${level.level} · attack interval seconds`,`${c.name} levels`,level,'attackSeconds',.1,30,.1,'Used when scheduling the next attack.'),
  field(`dwarf.${c.id}.level.${level.level}.workMultiplier`,`${c.name} · level ${level.level} · work speed multiplier`,`${c.name} levels`,level,'workMultiplier',.1,10,.05,'Applies live to productive work and research; training keeps its own duration.'),
  ...(level.level===1?[]:[field(`dwarf.${c.id}.level.${level.level}.trainingSeconds`,`${c.name} · level ${level.level} · training seconds to enter`,`${c.name} levels`,level,'trainingSeconds',.1,600,.1,'Practice required to enter this level; partial progress is retained.')])
 ])),
 ...recipes.flatMap(r=>[
  field(`recipe.${r.id}.cost`,`${r.name} · input gold`,'Crafting',r,'cost',0,10000,1,'Unpaid work only.'),
  field(`recipe.${r.id}.seconds`,`${r.name} · seconds`,'Crafting',r,'seconds',.1,600,.1,'Applies live.')
 ]),
 ...defenseDefinitions.flatMap(d=>['health','damage','cooldown','pinSeconds','range'].filter(k=>typeof d[k as keyof typeof d]==='number').map(k=>field(`defense.${d.id}.${k}`,`${d.name} · ${k==='pinSeconds'?'pin seconds':k}`,'Defenses',d,k,.1,k==='health'||k==='damage'?10000:60,.1,k==='health'?'New doors only; existing doors retain their health.':'Future shots/triggers use this value.'))),
 ...spellDefinitions.flatMap(s=>[
  field(`spell.${s.id}.cost`,`${s.name} · casting gold`,'Training & research',s,'cost',0,10000,1,'Applies to future casts; room construction can be free without waiving casting costs.'),
  field(`spell.${s.id}.researchSeconds`,`${s.name} · first research seconds`,'Training & research',s,'researchSeconds',.1,600,.1,'Applies live to initial research.'),
  field(`spell.${s.id}.prepareSeconds`,`${s.name} · preparation seconds`,'Training & research',s,'prepareSeconds',.1,600,.1,'Applies live after casting a researched spell.'),
  ...['duration','strength','radius','stunSeconds','healRate','pauseSeconds'].filter(k=>typeof s[k as keyof typeof s]==='number'&&s[k as keyof typeof s]!==0).map(k=>field(`spell.${s.id}.${k}`,`${s.name} · ${k}`,'Spells',s,k,.01,k==='strength'?(s.strength<1?.9:1000):k==='healRate'?1:300,.01,'Future casts only; active effects retain their values.'))
 ])
];
export const settingValues=()=>Object.fromEntries(settings.map(s=>[s.id,s.get()]));
export function applySettings(values:Record<string,number>){
 for(const s of settings){const v=values[s.id];if(!Number.isFinite(v)||v<s.min||v>s.max||(s.step===1&&!Number.isInteger(v)))return `${s.label}: enter ${s.min}–${s.max}${s.step===1?' (whole numbers)':''}.`;}
 const n=(key:TuningKey)=>values[`tuning.${key}`];
 if(n('wallBuildSeconds')<=Math.max(n('mineSeconds'),n('rockSeconds'))+n('reinforceSeconds'))return 'Wall construction must take longer than excavation plus reinforcement.';
 if(n('minZoom')>n('maxZoom')||n('homeZoom')<n('minZoom')||n('homeZoom')>n('maxZoom'))return 'Home distance must sit between the minimum and maximum camera distances.';
 for(const s of settings)s.set(values[s.id]);return '';
}
