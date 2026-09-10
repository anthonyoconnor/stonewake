import type { Point } from '../game/types.ts';
import type { EncounterDefinition } from '../game/encounters.ts';
import type { BiomeId } from './habitats.ts';

export const camp = (id:string,name:string,biome:BiomeId,positions:Point[],roster:string[],pressure:'raid'|'territorial'='territorial'): EncounterDefinition => ({
  id,name,kind:biome==='fungal'?'nest':'camp',positions,roster,activation:'discovery',delay:0,warningSeconds:18,clear:'defeat',
  pressure,habitat:{biome},
  warning:`Disturbed inhabitants are stirring in ${name.toLowerCase()}. Prepare the opened approach.`,
});
export const entrance = (id:string,biome:BiomeId,position:Point,roster:string[],delay:number):EncounterDefinition => ({
  id,name:`${biome[0].toUpperCase()+biome.slice(1)} deep passage`,kind:'entrance',positions:roster.map((_,i)=>({x:position.x,z:position.z+i})),roster,
  activation:'time',delay,warningSeconds:30,repeatSeconds:240,clear:'claim',pressure:'raid',habitat:{biome,radius:2},
  warning:'A fresh hostile group is approaching through a deep passage. Claim its entrance to stop reinforcements.',
});
