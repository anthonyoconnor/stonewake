import {tuning,tuningSpec,type TuningKey} from './tuning.ts';
import {roomDefinitions} from './rooms.ts';
import {recipes} from './recipes.ts';
export interface Setting {id:string;label:string;group:string;min:number;max:number;step:number;note:string;defaultValue:number;get:()=>number;set:(v:number)=>void}
const field=(id:string,label:string,group:string,object:Record<string,any>,key:string,min:number,max:number,step:number,note:string):Setting=>({id,label,group,min,max,step,note,defaultValue:object[key],get:()=>object[key],set:v=>{object[key]=v;}});
// The registries drive the editor: new rooms and recipes appear without UI changes.
export const settings:Setting[]=[
 ...Object.entries(tuningSpec).map(([key,s])=>({...s,id:`tuning.${key}`,defaultValue:s.value,get:()=>tuning[key as TuningKey],set:(v:number)=>{tuning[key as TuningKey]=v;}})),
 ...roomDefinitions.flatMap(r=>[
  field(`room.${r.id}.cost`,`${r.name} · gold/square`,'Rooms',r,'cost',0,10000,1,'New construction only; existing payments are retained.'),
  ...r.furnishings.flatMap(f=>['capacity','width','depth'].map(k=>field(`room.${r.id}.${f.kind}.${k}`,`${r.name} · ${f.kind} · ${k}`,'Rooms',f,k,1,k==='capacity'?10000:8,1,'New furnishings only; reload a room layout to compare.')))
 ]),
 ...recipes.flatMap(r=>[
  field(`recipe.${r.id}.cost`,`${r.name} · input gold`,'Crafting',r,'cost',0,10000,1,'Unpaid work only.'),
  field(`recipe.${r.id}.seconds`,`${r.name} · seconds`,'Crafting',r,'seconds',.1,600,.1,'Applies live.')
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
