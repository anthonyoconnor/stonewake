// Each row is the complete result of reaching that level. Training time is the
// XP required to enter the row (1 XP per training second), not lifetime XP.
export interface CharacterLevel {
  level:number; trainingSeconds:number; health:number; damage:number;
  attackSeconds:number; workMultiplier:number;
}
export interface CharacterDefinition {
  id:string; name:string; names:string[]; color:string; speedMultiplier:number;
  capabilities:string[]; appearance:'helmet'|'braids'|'warrior'|'runesmith';
  attractionServices:string[]; levels:CharacterLevel[];
}
export const characterDefinitions:CharacterDefinition[]=[
  {id:'miner',name:'Miner',names:['Brokk','Orin','Thora'],color:'#b78638',speedMultiplier:1,
    capabilities:['mine','haul','claim','reinforce','buildWall','defend'],appearance:'helmet',attractionServices:[],levels:[
      {level:1,trainingSeconds:0,health:90,damage:4,attackSeconds:1.5,workMultiplier:1},
      {level:2,trainingSeconds:20,health:105,damage:5,attackSeconds:1.5,workMultiplier:1.1},
      {level:3,trainingSeconds:35,health:120,damage:6,attackSeconds:1.5,workMultiplier:1.2},
      {level:4,trainingSeconds:55,health:140,damage:7,attackSeconds:1.5,workMultiplier:1.3},
      {level:5,trainingSeconds:80,health:160,damage:8,attackSeconds:1.5,workMultiplier:1.4}
    ]},
  {id:'engineer',name:'Engineer',names:['Helga','Sigrid'],color:'#357a81',speedMultiplier:1,
    capabilities:['craft','defend'],appearance:'braids',attractionServices:['craft'],levels:[
      {level:1,trainingSeconds:0,health:85,damage:5,attackSeconds:1.5,workMultiplier:1},
      {level:2,trainingSeconds:25,health:100,damage:6,attackSeconds:1.5,workMultiplier:1.1},
      {level:3,trainingSeconds:40,health:115,damage:7,attackSeconds:1.5,workMultiplier:1.2},
      {level:4,trainingSeconds:60,health:130,damage:8,attackSeconds:1.5,workMultiplier:1.3},
      {level:5,trainingSeconds:90,health:150,damage:10,attackSeconds:1.5,workMultiplier:1.4}
    ]},
  {id:'warrior',name:'Warrior',names:['Dagna','Torvald','Brynja'],color:'#954d37',speedMultiplier:1,
    capabilities:['fight'],appearance:'warrior',attractionServices:['training'],levels:[
      {level:1,trainingSeconds:0,health:140,damage:12,attackSeconds:1,workMultiplier:1},
      {level:2,trainingSeconds:15,health:165,damage:15,attackSeconds:1,workMultiplier:1},
      {level:3,trainingSeconds:30,health:190,damage:18,attackSeconds:1,workMultiplier:1},
      {level:4,trainingSeconds:50,health:215,damage:21,attackSeconds:1,workMultiplier:1},
      {level:5,trainingSeconds:75,health:240,damage:24,attackSeconds:1,workMultiplier:1}
    ]},
  {id:'runesmith',name:'Runesmith',names:['Eirik','Yrsa','Runar'],color:'#546d9c',speedMultiplier:1,
    capabilities:['research','defend'],appearance:'runesmith',attractionServices:['research'],levels:[
      {level:1,trainingSeconds:0,health:70,damage:6,attackSeconds:1.6,workMultiplier:1},
      {level:2,trainingSeconds:30,health:80,damage:7,attackSeconds:1.6,workMultiplier:1.1},
      {level:3,trainingSeconds:45,health:95,damage:8,attackSeconds:1.6,workMultiplier:1.2},
      {level:4,trainingSeconds:65,health:110,damage:10,attackSeconds:1.6,workMultiplier:1.3},
      {level:5,trainingSeconds:95,health:125,damage:12,attackSeconds:1.6,workMultiplier:1.4}
    ]}
];
export const characterById=(id:string)=>characterDefinitions.find(c=>c.id===id);
export const maxCharacterLevel=(type:string)=>(characterById(type)??characterDefinitions[0]).levels.length;
export function characterLevel(type:string,level=1):CharacterLevel {
  const rows=(characterById(type)??characterDefinitions[0]).levels;
  return rows[Math.max(0,Math.min(rows.length-1,Math.floor(level)-1))];
}
