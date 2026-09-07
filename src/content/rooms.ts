export interface RoomDefinition {
  id:string; name:string; color:string; cost:number; description:string; implemented:boolean;
  furnishing:{kind:string;width:number;depth:number;capacity:number};
}
export const roomDefinitions:RoomDefinition[]=[
  {id:'treasure',name:'Treasure Room',color:'#a98a3f',cost:12,description:'Store mined riches. Accessible vault chests hold delivered gold.',implemented:true,furnishing:{kind:'chest',width:1,depth:1,capacity:150}}
];
export const roomById=(id:string)=>roomDefinitions.find(r=>r.id===id);
