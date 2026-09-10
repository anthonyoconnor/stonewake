import type { LevelDefinition } from '../game/types.ts';
import { ellipse, path, polygon, rect, row, transformRuin, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { ruinTemplates } from './ruins.ts';
import { camp, entrance } from './level-encounters.ts';

const hearth = {x:10,z:18};
const settlement = settlementBlueprint(hearth);
const workings = union(ellipse(23,8,5,3),path([{x:20,z:8},{x:27,z:5},{x:31,z:7}],2),ellipse(31,8,5,4));
const waystation = union(ellipse(25,23,6,4),path([{x:25,z:23},{x:32,z:20},{x:32,z:13}],2));
const shoulder = polygon([{x:19,z:12},{x:24,z:13},{x:28,z:17},{x:25,z:19},{x:22,z:17},{x:20,z:17}]);
const basinRim = polygon([{x:3,z:9},{x:6,z:7},{x:11,z:6},{x:12,z:9},{x:7,z:11},{x:5,z:18},{x:5,z:24},{x:11,z:27},{x:18,z:27},{x:19,z:30},{x:8,z:30},{x:2,z:25}]);
// The protected rim clips the western treasury wing. Example player actions
// exclude fixed rock; gold seams authored over the rim remain mineable.
const fixedCells = new Set(union(basinRim, shoulder).map(p => `${p.x},${p.z}`));
const openingGold = new Set(settlement.gold.map(p => `${p.x},${p.z}`));
settlement.treasure = settlement.treasure.filter(p => !fixedCells.has(`${p.x},${p.z}`));
settlement.development = settlement.development.filter(p => !fixedCells.has(`${p.x},${p.z}`) || openingGold.has(`${p.x},${p.z}`));

/** M36: a protected earth basin with mine branches and a separate waystation saddle. */
export const borderLevel: LevelDefinition = {
  id:'campaign-border-foothold',name:'Border Foothold',biome:'upper',width:40,height:32,hearth,
  onwardHearth:{id:'border-foothold-relay',name:'Border Foothold onward Hearthstone',x:30,z:7},
  openings:[[8,16,12,20]],
  seams:[
    {terrain:'bedrock',cells:union(basinRim,shoulder)},
    {terrain:'floor',cells:union(workings,waystation,ellipse(34,26,3,2),path([{x:34,z:26},{x:34,z:21}],2))},
    {terrain:'rock',cells:union(ellipse(35,15,2,3),rect(20,26,2,2),row(22,22,5),row(22,27,5),[{x:22,z:24},{x:22,z:25},{x:26,z:24},{x:26,z:25},{x:26,z:6},{x:29,z:11}])},
    {terrain:'gold',cells:union(settlement.gold,path([{x:15,z:9},{x:17,z:8},{x:19,z:8}]),path([{x:17,z:24},{x:18,z:25},{x:20,z:25}]),row(28,28,5))},
  ],
  ruins:[transformRuin(ruinTemplates.waystation,{x:23,z:23},'border-waystation')],
  environmentRegions:[
    {id:'sheltered-basin',kind:'dry',cells:ellipse(11,18,9,11)},
    {id:'timber-workings',kind:'dry',cells:union(ellipse(23,8,7,5),ellipse(31,8,6,5))},
    {id:'abandoned-saddle',kind:'dry',cells:ellipse(30,21,6,7)},
    {id:'waystation-masonry',kind:'masonry',cells:rect(22,21,6,7)},
    {id:'damp-side-den',kind:'damp',cells:ellipse(34,26,4,3)},
  ],
  encounters:[
    camp('upper-watch','Timber watch','upper',[{x:29,z:6},{x:33,z:9}],['goblin-raider','goblin-raider'],'raid'),
    camp('burrowers-den','Lower side den','upper',[{x:34,z:26}],['tunnel-burrower']),
    entrance('upper-raids','upper',{x:35,z:21},['goblin-raider'],540),
  ],
};

export const borderPlan: LevelPlayPlan = {
  settlement,
  intended:[{x:14,z:18},{x:14,z:8},{x:23,z:8},{x:30,z:8},{x:30,z:7}],
  alternate:[{x:14,z:18},{x:17,z:18},{x:17,z:23},{x:25,z:23},{x:32,z:23},{x:32,z:8},{x:30,z:7}],
  suppression:[{x:32,z:8},{x:32,z:21},{x:35,z:21}],
  defenses:rect(14,15,3,4),
};
