export interface FurnishingDefinition {kind:string;model?:string;width:number;depth:number}
export interface RoomDefinition {
  id:string; name:string; color:string; cost:number; description:string; implemented:boolean;
  look?:{icon:string;floor:string;trim:string;motif:string};
  service:string; capacityPerTile:number;
  furnishings:FurnishingDefinition[];
}
export const roomDefinitions:RoomDefinition[]=[
  {id:'treasure',look:{icon:'treasure',floor:'#62655d',trim:'#c3a15c',motif:'treasure'},name:'Treasure Room',color:'#a98a3f',cost:12,description:'Stores delivered gold according to floor area.',implemented:true,service:'storage',capacityPerTile:50,furnishings:[{kind:'chest',width:1,depth:1}]},
  {id:'dormitory',look:{icon:'dormitory',floor:'#796b58',trim:'#baa477',motif:'dormitory'},name:'Dormitory',color:'#79605e',cost:16,description:'Floor area provides accommodation and a place to rest.',implemented:true,service:'rest',capacityPerTile:1,furnishings:[{kind:'bed',width:1,depth:2}]},
  {id:'kitchen',look:{icon:'kitchen',floor:'#806d50',trim:'#d2bd8b',motif:'kitchen'},name:'Kitchen',color:'#71834d',cost:20,description:'Floor area supports residents with meals. No food stocks or ingredients to manage.',implemented:true,service:'dining',capacityPerTile:1,furnishings:[
    {kind:'mushrooms',width:1,depth:1},
    {kind:'stove',width:1,depth:1},
    {kind:'table',width:1,depth:1},
    {kind:'barrel',width:1,depth:1}
  ]},
  {id:'workshop',look:{icon:'workshop',floor:'#49565b',trim:'#bca067',motif:'workshop'},name:'Workshop',color:'#537e82',cost:24,description:'Floor area limits how many Engineers can manufacture doors and traps at once.',implemented:true,service:'craft',capacityPerTile:1,furnishings:[
    {kind:'bench',width:1,depth:1},
    {kind:'anvil',width:1,depth:1},
    {kind:'assembly',width:2,depth:1}
  ]},
  {id:'training',look:{icon:'training',floor:'#785849',trim:'#c89c62',motif:'training'},name:'Training Room',color:'#985d44',cost:22,description:'Floor area limits concurrent trainees. Each dwarf gains one level, leaves, then waits for their cooldown. Attracts Warriors.',implemented:true,service:'training',capacityPerTile:1,furnishings:[
    {kind:'dummy',width:1,depth:1},
    {kind:'weights',width:2,depth:1}
  ]},
  {id:'library',look:{icon:'library',floor:'#4c6178',trim:'#94b5c9',motif:'library'},name:'Library',color:'#546f96',cost:26,description:'Floor area limits how many Runesmiths can research and prepare spells at once.',implemented:true,service:'research',capacityPerTile:1,furnishings:[
    {kind:'lectern',width:1,depth:1},
    {kind:'bookshelf',width:2,depth:1}
  ]},
  {id:'guard',name:'Guard Post',color:'#7f7770',cost:20,description:'Planned room',implemented:false,service:'guard',capacityPerTile:1,furnishings:[]}
];
export const roomById=(id:string)=>roomDefinitions.find(r=>r.id===id);

export const roomLook=(id:string)=>roomById(id)?.look??{icon:id,floor:roomById(id)?.color??'#656963',trim:'#c0aa77',motif:'generic'};
