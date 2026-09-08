// Each row is the complete result of reaching that level. Training time is the
// XP required to enter the row (1 XP per training second), not lifetime XP.
export interface CharacterLevel {
  level:number; trainingSeconds:number; health:number; damage:number;
  attackSeconds:number; workMultiplier:number; wage:number;
}
export interface CharacterDefinition {
  id:string; name:string; names:string[]; color:string; speedMultiplier:number;
  construct?:boolean;
  animal?:boolean;
  recruitmentWeight?:number;
  capabilities:string[]; appearance:'helmet'|'braids'|'warrior'|'runesmith'|'stonehand'|'hound';
  attractionServices:string[]; levels:CharacterLevel[];
}
export const characterDefinitions:CharacterDefinition[]=[
  {id:'cave-hound',name:'Cave Hound',names:['Flint','Bramble','Snuff'],color:'#605b51',speedMultiplier:1.5,
    animal:true,capabilities:['fight','scout'],appearance:'hound',attractionServices:['rest'],levels:[
      {level:1,wage:0,trainingSeconds:0,health:100,damage:10,attackSeconds:1,workMultiplier:1}
    ]},
  {id:'stonehand',name:'Stonehand',names:['Clink','Tick','Chip'],color:'#b89158',speedMultiplier:3 / 1.8,
    construct:true,capabilities:['mine','haul','claim','reinforce','buildWall'],appearance:'stonehand',attractionServices:[],levels:[
      {level:1,wage:0,trainingSeconds:0,health:30,damage:0,attackSeconds:1.5,workMultiplier:1}
    ]},
  {id:'miner',name:'Miner',names:['Brokk','Orin','Thora'],color:'#b78638',speedMultiplier:3 / 1.8, // 3 tiles/second at the default global walking speed.
    capabilities:['mine','haul','claim','reinforce','buildWall','defend'],appearance:'helmet',attractionServices:[],levels:[
      {level:1,wage:4,trainingSeconds:0,health:90,damage:4,attackSeconds:1.5,workMultiplier:1}
    ]},
  {id:'engineer',name:'Engineer',names:['Helga','Sigrid'],color:'#357a81',speedMultiplier:1,
    capabilities:['craft','defend'],appearance:'braids',attractionServices:['craft'],levels:[
      {level:1,wage:7,trainingSeconds:0,health:85,damage:5,attackSeconds:1.5,workMultiplier:1},
      {level:2,wage:9,trainingSeconds:25,health:100,damage:6,attackSeconds:1.5,workMultiplier:1.1},
      {level:3,wage:11,trainingSeconds:40,health:115,damage:7,attackSeconds:1.5,workMultiplier:1.2},
      {level:4,wage:13,trainingSeconds:60,health:130,damage:8,attackSeconds:1.5,workMultiplier:1.3},
      {level:5,wage:15,trainingSeconds:90,health:150,damage:10,attackSeconds:1.5,workMultiplier:1.4}
    ]},
  {id:'warrior',name:'Warrior',names:['Dagna','Torvald','Brynja'],color:'#954d37',speedMultiplier:1,recruitmentWeight:2,
    capabilities:['fight'],appearance:'warrior',attractionServices:['training'],levels:[
      {level:1,wage:8,trainingSeconds:0,health:140,damage:12,attackSeconds:1,workMultiplier:1},
      {level:2,wage:10,trainingSeconds:15,health:165,damage:15,attackSeconds:1,workMultiplier:1},
      {level:3,wage:12,trainingSeconds:30,health:190,damage:18,attackSeconds:1,workMultiplier:1},
      {level:4,wage:14,trainingSeconds:50,health:215,damage:21,attackSeconds:1,workMultiplier:1},
      {level:5,wage:16,trainingSeconds:75,health:240,damage:24,attackSeconds:1,workMultiplier:1}
    ]},
  {id:'runesmith',name:'Runesmith',names:['Eirik','Yrsa','Runar'],color:'#546d9c',speedMultiplier:1,
    capabilities:['research','defend'],appearance:'runesmith',attractionServices:['research'],levels:[
      {level:1,wage:10,trainingSeconds:0,health:70,damage:6,attackSeconds:1.6,workMultiplier:1},
      {level:2,wage:12,trainingSeconds:30,health:80,damage:7,attackSeconds:1.6,workMultiplier:1.1},
      {level:3,wage:14,trainingSeconds:45,health:95,damage:8,attackSeconds:1.6,workMultiplier:1.2},
      {level:4,wage:16,trainingSeconds:65,health:110,damage:10,attackSeconds:1.6,workMultiplier:1.3},
      {level:5,wage:18,trainingSeconds:95,health:125,damage:12,attackSeconds:1.6,workMultiplier:1.4}
    ]}
];
export const characterById=(id:string)=>characterDefinitions.find(c=>c.id===id);
export const isConstruct=(id:string)=>characterById(id)?.construct===true;
export const isAnimal=(id:string)=>characterById(id)?.animal===true;
export const earnsWages=(id:string)=>!isConstruct(id)&&!isAnimal(id);
export const maxCharacterLevel=(type:string)=>(characterById(type)??characterById('miner')!).levels.length;
export function characterLevel(type:string,level=1):CharacterLevel {
  const rows=(characterById(type)??characterById('miner')!).levels;
  return rows[Math.max(0,Math.min(rows.length-1,Math.floor(level)-1))];
}
