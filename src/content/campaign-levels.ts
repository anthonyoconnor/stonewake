import type { LevelDefinition, Point } from '../game/types.ts';
import type { EncounterDefinition } from '../game/encounters.ts';
import type { BiomeId } from './habitats.ts';
import { placeRuin, ruinTemplates } from './ruins.ts';

const row = (x: number, z: number, count: number): Point[] => Array.from({length:count},(_,i)=>({x:x+i,z}));
const col = (x: number, z: number, count: number): Point[] => Array.from({length:count},(_,i)=>({x,z:z+i}));
const rect = (x:number,z:number,width:number,depth:number):Point[] => Array.from({length:width*depth},(_,i)=>({x:x+i%width,z:z+Math.floor(i/width)}));
const camp = (id:string,name:string,biome:BiomeId,positions:Point[],roster:string[],pressure:'raid'|'territorial'='territorial'): EncounterDefinition => ({
  id,name,kind:biome==='fungal'?'nest':'camp',positions,roster,activation:'discovery',delay:0,warningSeconds:18,clear:'defeat',
  pressure,habitat:{biome},
  warning:`Disturbed inhabitants are stirring in ${name.toLowerCase()}. Prepare the opened approach.`,
});
const entrance = (id:string,biome:BiomeId,position:Point,roster:string[],delay:number):EncounterDefinition => ({
  id,name:`${biome[0].toUpperCase()+biome.slice(1)} deep passage`,kind:'entrance',positions:roster.map((_,i)=>({x:position.x,z:position.z+i})),roster,
  activation:'time',delay,warningSeconds:30,repeatSeconds:240,clear:'claim',pressure:'raid',habitat:{biome,radius:2},
  warning:'A fresh hostile group is approaching through a deep passage. Claim its entrance to stop reinforcements.',
});
function base(id:string,name:string,biome:BiomeId,width:number,height:number):LevelDefinition {
  const hearth={x:6,z:height-8};
  return {id:`campaign-${id}`,name,biome,width,height,hearth,
    onwardHearth:{id:`${id}-relay`,name:`${name} onward Hearthstone`,x:width-6,z:7},
    openings:[[4,hearth.z-2,8,hearth.z+2]],
    seams:[{terrain:'gold',cells:[...row(3,hearth.z-7,9),...row(11,hearth.z-6,4),...row(3,hearth.z+5,8)]}],
  };
}

const border=base('border-foothold','Border Foothold','upper',32,26);
border.openings.push([18,7,22,10],[21,5,28,8],[25,9,28,12],[19,17,24,19],[22,20,27,22],[28,19,30,20]);
border.seams.push(
  {terrain:'bedrock',cells:[...col(16,1,6),...col(16,11,6),...col(16,21,4),...row(20,14,10)]},
  {terrain:'gold',cells:[...row(11,9,5),...row(14,18,5),...row(21,16,5)]},
  {terrain:'rock',cells:[...col(23,9,3),{x:24,z:21}]},
);
border.ruins=[placeRuin(ruinTemplates.waystation,{x:19,z:18},'border-waystation')];
border.encounters=[
  camp('upper-watch','Upper watch','upper',[{x:24,z:6},{x:27,z:9}],['goblin-raider','goblin-raider'],'raid'),
  camp('burrowers-den','Burrowers’ side den','upper',[{x:26,z:21}],['tunnel-burrower']),
  entrance('upper-raids','upper',{x:30,z:19},['goblin-raider'],420),
];

const fungal=base('fungal-hollows','Fungal Hollows','fungal',36,30);
fungal.openings.push([17,8,21,11],[20,5,24,9],[24,7,29,12],[28,5,32,8],[25,12,28,16],[20,18,25,20],[18,21,21,24],[29,21,34,23]);
fungal.seams.push(
  {terrain:'bedrock',cells:[...col(16,1,7),...col(16,12,8),...col(16,24,5),...row(23,18,6)]},
  {terrain:'gold',cells:[...row(11,10,6),...row(12,21,5),...row(24,17,4),...row(29,24,4)]},
  {terrain:'water',cells:[...row(21,12,3),...row(22,13,3),...row(22,14,2)]},
  {terrain:'rock',cells:[{x:26,z:9},{x:27,z:10},{x:24,z:8}]},
);
fungal.ruins=[placeRuin(ruinTemplates.waystation,{x:18,z:21},'fungal-waystation')];
fungal.encounters=[
  camp('fungal-brood','Fungal brood','fungal',[{x:25,z:7},{x:29,z:10}],['cave-spider','spore-brute'],'raid'),
  entrance('fungal-raids','fungal',{x:33,z:22},['cave-spider'],480),
];

const ancient=base('fallen-city','Fallen City','ancient',38,32);
ancient.openings.push([18,20,25,24],[22,16,24,25],[25,18,29,21],[18,10,21,15],[20,8,31,10],[27,5,34,8],[29,11,33,14],[31,23,36,25]);
ancient.seams.push(
  {terrain:'bedrock',cells:[...col(16,1,8),...col(16,13,8),...col(16,25,6),...row(23,14,6)]},
  {terrain:'gold',cells:[...row(11,11,6),...row(12,22,6),...row(25,17,5),...row(30,15,5)]},
  {terrain:'rock',cells:[...col(25,9,3),{x:21,z:22},{x:22,z:23},{x:31,z:6}]},
);
ancient.ruins=[placeRuin(ruinTemplates.foundry,{x:18,z:20},'city-foundry'),placeRuin(ruinTemplates.waystation,{x:29,z:10},'city-watch-barracks')];
ancient.encounters=[
  camp('city-watch','Ancient watch district','ancient',[{x:28,z:8},{x:33,z:11}],['restless-guard','ancient-sentinel'],'raid'),
  camp('foundry-watch','Foundry watch','ancient',[{x:24,z:20}],['restless-guard']),
  entrance('city-raids','ancient',{x:35,z:24},['restless-guard'],540),
];

const crystal=base('crystal-divide','Crystal Divide','crystal',38,30);
crystal.openings.push([18,8,22,11],[21,5,26,8],[25,8,29,12],[29,5,34,9],[18,18,24,22],[23,15,27,19],[28,20,32,24],[32,24,36,26]);
crystal.seams.push(
  {terrain:'bedrock',cells:[...col(16,1,7),...col(16,12,7),...col(16,23,6),...row(21,13,8)]},
  {terrain:'gold',cells:[...row(11,10,6),...row(12,20,6),...row(24,20,5),...row(29,16,5)]},
  {terrain:'chasm',cells:[...col(28,14,5),...col(29,14,4)]},
  {terrain:'gem',cells:[{x:31,z:22}]},
  {terrain:'rock',cells:[{x:24,z:8},{x:27,z:9},{x:29,z:8}]},
);
crystal.ruins=[placeRuin(ruinTemplates.archive,{x:18,z:18},'crystal-archive')];
crystal.encounters=[
  camp('crystal-watch','Crystal relay cavern','crystal',[{x:28,z:8},{x:32,z:9}],['crystal-elemental','crystalback-stalker'],'raid'),
  camp('gem-hunter','Remote gem hunting ground','crystal',[{x:30,z:23}],['crystalback-stalker']),
  entrance('crystal-raids','crystal',{x:35,z:25},['crystal-elemental'],600),
];

const royal=base('royal-deep','Royal Deep','volcanic',40,32);
royal.openings.push([14,10,19,12],[14,21,19,23],[22,9,27,12],[22,20,26,24],[26,16,29,23],[26,7,30,10],[29,5,36,9],[31,10,36,13],[31,23,37,27]);
royal.seams.push(
  {terrain:'lava',cells:[...col(20,1,30),...col(21,1,30),...row(30,17,5),...row(32,18,4)]},
  {terrain:'bedrock',cells:[...col(16,1,8),...col(16,14,6),...col(16,26,5),...row(23,14,6)]},
  {terrain:'gold',cells:[...row(11,11,5),...row(12,22,5),...row(24,25,6),...row(31,15,5)]},
  {terrain:'gem',cells:[{x:35,z:25}]},
  {terrain:'rock',cells:[{x:30,z:8},{x:31,z:9},{x:33,z:11}]},
);
royal.ruins=[placeRuin(ruinTemplates.foundry,{x:22,z:20},'royal-foundry'),placeRuin(ruinTemplates.archive,{x:31,z:10},'royal-archive')];
royal.encounters=[
  camp('royal-watch','Royal volcanic watch','volcanic',[{x:29,z:7},{x:34,z:10}],['cinderling','deepmaw'],'raid'),
  camp('molten-gem-lair','Molten gem lair','volcanic',[{x:34,z:25}],['cinderling']),
  // Lava walkers can raid either opened bank; suppressing this source needs a deliberate bridge.
  entrance('royal-raids','volcanic',{x:21,z:16},['cinderling'],660),
];

export const authoredCampaignLevels = [border,fungal,ancient,crystal,royal];

/** Intentional and alternate excavation spines; waypoints leave tactical room for player layouts. */
export const campaignApproaches: Record<string,{intended:Point[];alternate:Point[];bridgeRows?:number[]}> = {
  'border-foothold':{intended:[{x:10,z:18},{x:10,z:9},{x:20,z:9},{x:26,z:7}],alternate:[{x:10,z:18},{x:19,z:18},{x:19,z:12},{x:26,z:12},{x:26,z:7}]},
  'fungal-hollows':{intended:[{x:10,z:22},{x:10,z:10},{x:20,z:10},{x:30,z:7}],alternate:[{x:10,z:22},{x:20,z:22},{x:20,z:16},{x:27,z:16},{x:27,z:11},{x:30,z:7}]},
  'fallen-city':{intended:[{x:10,z:24},{x:10,z:11},{x:20,z:11},{x:20,z:9},{x:32,z:9},{x:32,z:7}],alternate:[{x:10,z:24},{x:10,z:22},{x:23,z:22},{x:23,z:15},{x:30,z:15},{x:30,z:10},{x:32,z:7}]},
  'crystal-divide':{intended:[{x:10,z:22},{x:10,z:10},{x:20,z:10},{x:20,z:7},{x:32,z:7}],alternate:[{x:10,z:22},{x:10,z:20},{x:30,z:20},{x:30,z:10},{x:32,z:7}]},
  'royal-deep':{intended:[{x:10,z:24},{x:10,z:11},{x:26,z:11},{x:26,z:7},{x:34,z:7}],alternate:[{x:10,z:24},{x:10,z:22},{x:27,z:22},{x:27,z:15},{x:30,z:15},{x:30,z:10},{x:34,z:7}],bridgeRows:[11,22]},
};

export function approachCells(waypoints:Point[]) {
  const cells:Point[]=[];
  for(let i=1;i<waypoints.length;i++) {
    const a=waypoints[i-1],b=waypoints[i];
    cells.push(...row(Math.min(a.x,b.x),a.z,Math.abs(a.x-b.x)+1),...col(b.x,Math.min(a.z,b.z),Math.abs(a.z-b.z)+1));
  }
  return [...new Map(cells.map(p=>[`${p.x},${p.z}`,p])).values()];
}
export function settlementPlan(level:LevelDefinition) {
  const z=level.hearth.z;
  return {
    treasure:rect(3,z-5,3,2),dormitory:rect(8,z-2,3,4),kitchen:rect(8,z+3,3,3),
    training:rect(3,z+3,2,2),workshop:rect(11,z,2,2),library:rect(11,z+3,2,2),
    gold:[...row(3,z-7,9),...row(11,z-6,4),...row(3,z+5,8)],
    development:rect(3,z-7,10,13),
  };
}
