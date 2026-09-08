export const summonStonehandSpell={id:'summon-stonehand',name:'Create Stonehand'} as const;
// Innate Hearth spell: its live gold cost comes from the recruitment service.
export const summonMinerSpell = { id: 'summon-miner', name: 'Summon Miner' } as const;
export interface SpellDefinition {
  id:string; name:string; researchSeconds:number; prepareSeconds:number; cost:number;
  target:'dwarf'|'enemy'|'point'; effect:'haste'|'slow'|'shield'|'thunder'|'barrier'|'mend'|'reckoning'|'rally';
  duration:number; strength:number; radius?:number; stunSeconds?:number; healRate?:number; pauseSeconds?:number; color:string;
}
export const spellDefinitions:SpellDefinition[]=[
  {id:'dwarf-haste',name:'Haste',researchSeconds:45,prepareSeconds:20,cost:25,target:'dwarf',effect:'haste',duration:20,strength:.5,color:'#f4ce70'},
  {id:'enemy-slow',name:'Slow',researchSeconds:60,prepareSeconds:25,cost:30,target:'enemy',effect:'slow',duration:15,strength:.4,color:'#80c8ee'},
  {id:'stoneguard',name:'Stoneguard',researchSeconds:60,prepareSeconds:30,cost:35,target:'dwarf',effect:'shield',duration:20,strength:.4,color:'#b1bfc7'},
  {id:'thunder-rune',name:'Thunder Rune',researchSeconds:90,prepareSeconds:35,cost:50,target:'point',effect:'thunder',duration:0,strength:30,radius:1.5,stunSeconds:2,color:'#dcc5ff'},
  {id:'runic-barrier',name:'Runic Barrier',researchSeconds:75,prepareSeconds:35,cost:40,target:'point',effect:'barrier',duration:15,strength:150,color:'#79cddd'},
  {id:'mending-rune',name:'Mending Rune',researchSeconds:60,prepareSeconds:30,cost:35,target:'dwarf',effect:'mend',duration:20,strength:.4,healRate:.04,pauseSeconds:3,color:'#81d7a1'},
  {id:'rune-of-reckoning',name:'Rune of Reckoning',researchSeconds:75,prepareSeconds:30,cost:40,target:'enemy',effect:'reckoning',duration:15,strength:.3,color:'#ed9c7b'},
  {id:'call-to-arms',name:'Call to Arms',researchSeconds:45,prepareSeconds:20,cost:25,target:'point',effect:'rally',duration:45,strength:0,radius:3,color:'#efb65e'}
];
export const spellById=(id:string)=>spellDefinitions.find(s=>s.id===id);
export function spellDescription(s:SpellDefinition){
  const percent=Math.round(s.strength*100);
  switch(s.effect){
    case 'haste':return `One dwarf moves, works and attacks ${percent}% faster for ${s.duration} seconds.`;
    case 'slow':return `One enemy moves and attacks ${percent}% slower for ${s.duration} seconds.`;
    case 'shield':return `Shields one dwarf for ${percent}% of maximum health, lasting up to ${s.duration} seconds.`;
    case 'thunder':return `Deals ${s.strength} damage and stuns enemies for ${s.stunSeconds} seconds within ${s.radius} tiles. Walls block the blast.`;
    case 'barrier':return `Seals a clear claimed tile with a ${s.strength}-health barrier for ${s.duration} seconds. Blocks both sides.`;
    case 'mend':return `Heals up to ${percent}% of one dwarf’s health at ${Math.round(s.healRate!*100)}% per second. Damage pauses healing for ${s.pauseSeconds} seconds; expires after ${s.duration} seconds.`;
    case 'reckoning':return `One enemy takes ${percent}% extra damage from dwarf attacks for ${s.duration} seconds.`;
    case 'rally':return `All fighting dwarfs rally within ${s.radius} tiles of a point for ${s.duration} seconds, including travel.`;
  }
}
