export interface SpellDefinition {id:string;name:string;description:string;researchSeconds:number;prepareSeconds:number;cost:number;effect:'prospect'|'haste'}
export const spellDefinitions:SpellDefinition[]=[
  {id:'prospect',name:'Hearth Prospect',description:'Extends sight from the Hearth, revealing reachable lines of sight through open passages. No gold is spent if nothing new can be seen.',researchSeconds:32,prepareSeconds:12,cost:20,effect:'prospect'},
  {id:'haste',name:'Hearth Haste',description:'Temporarily increases mining, building, crafting and research speed for every dwarf. Needs and walking keep their normal pace.',researchSeconds:40,prepareSeconds:16,cost:30,effect:'haste'}
];
export const spellById=(id:string)=>spellDefinitions.find(s=>s.id===id);
