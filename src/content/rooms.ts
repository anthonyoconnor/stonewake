export interface FurnishingDefinition {kind:string;width:number;depth:number;capacity:number;service:string}
export interface RoomDefinition {
  id:string; name:string; color:string; cost:number; description:string; implemented:boolean;
  furnishings:FurnishingDefinition[];
}
export const roomDefinitions:RoomDefinition[]=[
  {id:'treasure',name:'Treasure Room',color:'#a98a3f',cost:12,description:'Store mined riches. Accessible vault chests hold delivered gold.',implemented:true,furnishings:[{kind:'chest',width:1,depth:1,capacity:150,service:'storage'}]},
  ...[
    ['dormitory','Dormitory','#79605e'],['kitchen','Kitchen','#71834d'],['workshop','Workshop','#537e82'],
    ['training','Training Room','#985d44'],['library','Library','#546f96'],['guard','Guard Post','#7f7770']
  ].map(([id,name,color])=>({id,name,color,cost:20,description:'Planned room',implemented:false,furnishings:[]}))
];
export const roomById=(id:string)=>roomDefinitions.find(r=>r.id===id);
