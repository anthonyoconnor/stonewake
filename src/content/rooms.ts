export interface FurnishingDefinition {kind:string;width:number;depth:number;capacity:number;service:string}
export interface RoomDefinition {
  id:string; name:string; color:string; cost:number; description:string; implemented:boolean;
  furnishings:FurnishingDefinition[];
}
export const roomDefinitions:RoomDefinition[]=[
  {id:'treasure',name:'Treasure Room',color:'#a98a3f',cost:12,description:'Store mined riches. Accessible vault chests hold delivered gold.',implemented:true,furnishings:[{kind:'chest',width:1,depth:1,capacity:150,service:'storage'}]},
  {id:'dormitory',name:'Dormitory',color:'#79605e',cost:16,description:'A bed and a quiet place to rest for every dwarf.',implemented:true,furnishings:[{kind:'bed',width:1,depth:2,capacity:1,service:'rest'}]},
  {id:'kitchen',name:'Kitchen',color:'#71834d',cost:20,description:'Grow mushrooms, prepare meals, brew ale, and feed the stronghold.',implemented:true,furnishings:[
    {kind:'mushrooms',width:1,depth:1,capacity:6,service:'growing'},
    {kind:'stove',width:1,depth:1,capacity:12,service:'cooking'},
    {kind:'table',width:1,depth:1,capacity:1,service:'dining'},
    {kind:'barrel',width:1,depth:1,capacity:6,service:'brewing'}
  ]},
  ...[
    ['workshop','Workshop','#537e82'],
    ['training','Training Room','#985d44'],['library','Library','#546f96'],['guard','Guard Post','#7f7770']
  ].map(([id,name,color])=>({id,name,color,cost:20,description:'Planned room',implemented:false,furnishings:[]}))
];
export const roomById=(id:string)=>roomDefinitions.find(r=>r.id===id);
