import {enemyById} from './enemies.ts';
export interface DefenseDefinition {
  id:string; name:string; kind:'door'|'spike'|'bolt'; tier?:number; health?:number;
  damage?:number; cooldown?:number; pinSeconds?:number; range?:number;
  description:string;
}
export const defenseDefinitions:DefenseDefinition[]=[
  {id:'timber-door',name:'Timber door',kind:'door',tier:1,health:100,description:'Basic timber barrier. Fits a one-square passage between walls.'},
  {id:'reinforced-door',name:'Reinforced door',kind:'door',tier:2,health:250,description:'Iron bands give a timber door more staying power.'},
  {id:'steel-door',name:'Steel door',kind:'door',tier:3,health:500,description:'Heavy steel plating withstands a sustained assault.'},
  {id:'spike-trap',name:'Spike trap',kind:'spike',damage:40,cooldown:6,pinSeconds:2,description:'Impales an enemy crossing its plate and briefly pins survivors. Resets automatically.'},
  {id:'bolt-trap',name:'Bolt trap',kind:'bolt',damage:30,cooldown:3,range:7,description:'Fires at the first enemy along its facing. Walls and shut doors stop shots. Resets automatically.'}
];
export const defenseById=(id:string)=>defenseDefinitions.find(d=>d.id===id);
// East, south, west, north in grid coordinates. Camera rotation does not change facing.
export const defenseDirections=[{x:1,z:0,name:'East'},{x:0,z:1,name:'South'},{x:-1,z:0,name:'West'},{x:0,z:-1,name:'North'}];
// Compatibility name for existing defense fixtures; this is the editable roster entry itself.
export const raiderDefinition=enemyById('goblin-raider');
