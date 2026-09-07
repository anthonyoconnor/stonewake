export interface CharacterDefinition {id:string;name:string;names:string[];color:string;speedMultiplier:number;capabilities:string[];appearance:'helmet'|'braids'|'warrior'|'runesmith';attractionServices:string[];combat?:{health:number;damage:number;attackSeconds:number}}
export const characterDefinitions:CharacterDefinition[]=[
  {id:'miner',name:'Miner',names:['Brokk','Orin','Thora'],color:'#b78638',speedMultiplier:1,capabilities:['mine','haul','claim','reinforce','buildWall'],appearance:'helmet',attractionServices:[]},
  {id:'engineer',name:'Engineer',names:['Helga','Sigrid'],color:'#357a81',speedMultiplier:1,capabilities:['craft'],appearance:'braids',attractionServices:['craft']},
  {id:'warrior',name:'Warrior',names:['Dagna','Torvald','Brynja'],color:'#954d37',speedMultiplier:1,capabilities:['fight'],appearance:'warrior',attractionServices:['training'],combat:{health:100,damage:10,attackSeconds:1}},
  {id:'runesmith',name:'Runesmith',names:['Eirik','Yrsa','Runar'],color:'#546d9c',speedMultiplier:1,capabilities:['research'],appearance:'runesmith',attractionServices:['research']}
];
export const characterById=(id:string)=>characterDefinitions.find(c=>c.id===id);
