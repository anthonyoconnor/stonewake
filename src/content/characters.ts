export interface CharacterDefinition {id:string;name:string;names:string[];color:string;speedMultiplier:number;capabilities:string[];appearance:'helmet'|'braids';attractionServices:string[]}
export const characterDefinitions:CharacterDefinition[]=[
  {id:'miner',name:'Miner',names:['Brokk','Orin','Thora'],color:'#b78638',speedMultiplier:1,capabilities:['mine','haul','claim','reinforce','buildWall'],appearance:'helmet',attractionServices:[]},
  {id:'engineer',name:'Engineer',names:['Helga','Sigrid'],color:'#357a81',speedMultiplier:1,capabilities:['craft'],appearance:'braids',attractionServices:['craft']}
];
export const characterById=(id:string)=>characterDefinitions.find(c=>c.id===id);
