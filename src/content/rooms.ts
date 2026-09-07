export interface FurnishingDefinition {kind:string;model?:string;width:number;depth:number;capacity:number;service:string}
export interface RoomDefinition {
  id:string; name:string; color:string; cost:number; description:string; implemented:boolean;
  look?:{icon:string;floor:string;trim:string;motif:string};
  furnishings:FurnishingDefinition[];
}
export const roomDefinitions:RoomDefinition[]=[
  {id:'treasure',look:{icon:'treasure',floor:'#62655d',trim:'#c3a15c',motif:'treasure'},name:'Treasure Room',color:'#a98a3f',cost:12,description:'Store mined riches. Accessible vault chests hold delivered gold.',implemented:true,furnishings:[{kind:'chest',width:1,depth:1,capacity:150,service:'storage'}]},
  {id:'dormitory',look:{icon:'dormitory',floor:'#796b58',trim:'#baa477',motif:'dormitory'},name:'Dormitory',color:'#79605e',cost:16,description:'A bed and a quiet place to rest for every dwarf.',implemented:true,furnishings:[{kind:'bed',width:1,depth:2,capacity:1,service:'rest'}]},
  {id:'kitchen',look:{icon:'kitchen',floor:'#806d50',trim:'#d2bd8b',motif:'kitchen'},name:'Kitchen',color:'#71834d',cost:20,description:'Grow mushrooms, prepare meals, brew ale, and feed the stronghold.',implemented:true,furnishings:[
    {kind:'mushrooms',width:1,depth:1,capacity:6,service:'growing'},
    {kind:'stove',width:1,depth:1,capacity:12,service:'cooking'},
    {kind:'table',width:1,depth:1,capacity:1,service:'dining'},
    {kind:'barrel',width:1,depth:1,capacity:6,service:'brewing'}
  ]},
  {id:'workshop',look:{icon:'workshop',floor:'#49565b',trim:'#bca067',motif:'workshop'},name:'Workshop',color:'#537e82',cost:24,description:'Engineers manufacture doors and traps at accessible craft stations.',implemented:true,furnishings:[
    {kind:'bench',width:1,depth:1,capacity:1,service:'craft'},
    {kind:'anvil',width:1,depth:1,capacity:1,service:'craft'},
    {kind:'assembly',width:2,depth:1,capacity:1,service:'craft'}
  ]},
  {id:'training',look:{icon:'training',floor:'#785849',trim:'#c89c62',motif:'training'},name:'Training Room',color:'#985d44',cost:22,description:'All dwarfs train at accessible practice stations to improve work speed. Attracts Warriors.',implemented:true,furnishings:[
    {kind:'dummy',width:1,depth:1,capacity:1,service:'training'},
    {kind:'weights',width:2,depth:1,capacity:1,service:'training'}
  ]},
  {id:'library',look:{icon:'library',floor:'#4c6178',trim:'#94b5c9',motif:'library'},name:'Library',color:'#546f96',cost:26,description:'Runesmiths research and prepare useful spells at accessible reading stations.',implemented:true,furnishings:[
    {kind:'lectern',width:1,depth:1,capacity:1,service:'research'},
    {kind:'bookshelf',width:2,depth:1,capacity:1,service:'research'}
  ]},
  {id:'guard',name:'Guard Post',color:'#7f7770',cost:20,description:'Planned room',implemented:false,furnishings:[]}
];
export const roomById=(id:string)=>roomDefinitions.find(r=>r.id===id);

export const roomLook=(id:string)=>roomById(id)?.look??{icon:id,floor:roomById(id)?.color??'#656963',trim:'#c0aa77',motif:'generic'};
