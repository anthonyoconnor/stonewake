import type { LevelDefinition } from '../game/types.ts';
import { ellipse, path, polygon, rect, row, transformRuin, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { ruinTemplates } from './ruins.ts';
import { camp, entrance } from './level-encounters.ts';

const emberHearth={x:9,z:20};
const emberSettlement=settlementBlueprint(emberHearth);
emberSettlement.gold=union(
  path([{x:5,z:17},{x:5,z:20},{x:6,z:22}]),
  path([{x:8,z:13},{x:11,z:13},{x:13,z:14}]),
  path([{x:8,z:25},{x:8,z:26},{x:13,z:26}]),
);
emberSettlement.development=union(emberSettlement.development,emberSettlement.gold);
const river=polygon([{x:21,z:1},{x:23,z:1},{x:23,z:8},{x:25,z:14},{x:26,z:19},{x:24,z:24},{x:22,z:30},{x:23,z:38},{x:19,z:38},{x:18,z:31},{x:20,z:24},{x:21,z:20},{x:19,z:15},{x:20,z:8}]);
const molten=polygon([{x:34,z:1},{x:37,z:1},{x:37,z:9},{x:40,z:16},{x:39,z:24},{x:37,z:30},{x:38,z:38},{x:33,z:38},{x:32,z:31},{x:33,z:25},{x:35,z:20},{x:33,z:15},{x:34,z:9}]);

/** M42: substantial banks and a foundry peninsula between two unlike winding channels. */
export const emberwaterLevel:LevelDefinition={
  id:'emberwater-crossing',name:'Emberwater Crossing',biome:'volcanic',width:48,height:40,hearth:emberHearth,
  onwardHearth:{id:'emberwater-relay',name:'Confluence Hearthstone',x:42,z:11},
  openings:[[7,18,11,22]],
  seams:[
    {terrain:'bedrock',cells:union(ellipse(7,5,5,2),polygon([{x:3,z:29},{x:7,z:31},{x:15,z:32},{x:16,z:35},{x:8,z:36},{x:3,z:34}]))},
    {terrain:'floor',cells:union(ellipse(16,9,4,3),ellipse(16,29,4,3),ellipse(29,9,5,4),path([{x:29,z:9},{x:29,z:28}],3),rect(26,24,6,8),ellipse(42,11,4,5),path([{x:42,z:11},{x:43,z:25},{x:42,z:31}],3),ellipse(43,30,3,3),ellipse(43,36,2,2))},
    {terrain:'water',cells:river},{terrain:'lava',cells:molten},
    {terrain:'rock',cells:union(row(26,23,6),row(26,32,5),[{x:26,z:27},{x:26,z:28},{x:31,z:25},{x:31,z:26},{x:28,z:17}])},
    {terrain:'dirt',cells:rect(40,33,6,2)},
    {terrain:'gold',cells:union(emberSettlement.gold,row(26,12,5),row(26,28,4),path([{x:39,z:27},{x:40,z:29},{x:40,z:31}]))},
    {terrain:'gem',cells:[{x:44,z:36}]},
  ],
  ruins:[transformRuin(ruinTemplates.foundry,{x:27,z:25},'confluence-foundry'),{id:'confluence-waystation',name:'River-bank waystation',rooms:[{type:'dormitory',cells:rect(27,30,4,2)},{type:'treasure',cells:rect(26,26,1,2)}]}],
  environmentRegions:[
    {id:'dry-western-refuge',kind:'dry',cells:ellipse(10,20,10,14)},
    {id:'river-shores',kind:'damp',cells:ellipse(22,20,8,20)},
    {id:'molten-confluence',kind:'scorched',cells:ellipse(36,22,10,20)},
    {id:'middle-bank-street',kind:'masonry',cells:rect(27,5,5,27)},
    {id:'foundry-court',kind:'masonry',cells:rect(25,23,8,10)},
    {id:'eastern-relay',kind:'masonry',cells:rect(40,7,6,10)},
    {id:'optional-quartz-recess',kind:'crystal',cells:rect(40,35,6,4)},
  ],
  encounters:[
    camp('confluence-watch','Confluence watch','volcanic',[{x:42,z:9},{x:43,z:13}],['cinderling','goblin-raider'],'raid'),
    camp('river-foundry-watch','River foundry watch','ancient',[{x:29,z:24}],['restless-guard']),
    camp('confluence-gem-den','Hidden mineral den','crystal',[{x:42,z:36}],['crystalback-stalker']),
    entrance('confluence-raids','volcanic',{x:43,z:30},['cinderling'],720),
  ],
};
export const emberwaterPlan:LevelPlayPlan={
  settlement:emberSettlement,
  intended:[{x:13,z:20},{x:13,z:10},{x:29,z:10},{x:29,z:9},{x:42,z:9},{x:42,z:11}],
  alternate:[{x:13,z:20},{x:13,z:29},{x:29,z:29},{x:29,z:28},{x:42,z:28},{x:42,z:11}],
  suppression:[{x:42,z:11},{x:42,z:30},{x:43,z:30}],
  defensesByApproach:{intended:rect(16,9,3,2),alternate:rect(15,28,3,3)},
};

const calderaHearth={x:12,z:24};
const calderaSettlement=settlementBlueprint(calderaHearth);
calderaSettlement.gold=union(
  path([{x:8,z:17},{x:11,z:16},{x:14,z:16}]),
  path([{x:7,z:22},{x:7,z:26},{x:8,z:26}]),
  path([{x:10,z:30},{x:13,z:30},{x:14,z:31},{x:15,z:31}]),
);
calderaSettlement.development=union(calderaSettlement.development,calderaSettlement.gold);
const citadel=ellipse(36,24,9,10);
const citadelKeys=new Set(citadel.map(p=>`${p.x},${p.z}`));
const calderaRing=ellipse(36,24,14,17).filter(p=>!citadelKeys.has(`${p.x},${p.z}`));

/** M42: inward conquest of a lava-ring citadel, with optional outer-bank expeditions. */
export const calderaLevel:LevelDefinition={
  id:'region-volcanic',name:'Ashen Caldera',biome:'volcanic',width:60,height:48,hearth:calderaHearth,
  onwardHearth:{id:'caldera-relay',name:'Caldera citadel Hearthstone',x:36,z:24},
  openings:[[10,22,14,26]],
  seams:[
    {terrain:'bedrock',cells:union(polygon([{x:4,z:6},{x:11,z:4},{x:20,z:8},{x:19,z:11},{x:11,z:8},{x:5,z:11}]),polygon([{x:51,z:12},{x:55,z:10},{x:57,z:21},{x:55,z:34},{x:52,z:39},{x:51,z:35},{x:53,z:23}]))},
    {terrain:'floor',cells:union(citadel,ellipse(20,24,3,4),ellipse(20,39,5,4),ellipse(35,43,8,2),ellipse(8,39,5,4),ellipse(43,5,7,2),path([{x:46,z:6},{x:51,z:11},{x:52,z:18}],3))},
    {terrain:'lava',cells:calderaRing},
    {terrain:'rock',cells:union(row(30,28,6),row(30,33,6),[{x:30,z:30},{x:30,z:31},{x:35,z:30},{x:40,z:20},{x:41,z:20},{x:31,z:20},{x:31,z:21}])},
    {terrain:'gold',cells:union(calderaSettlement.gold,row(17,39,6),path([{x:32,z:26},{x:34,z:27},{x:37,z:27}]),row(44,6,5),row(5,43,6))},
    {terrain:'gem',cells:[{x:7,z:40}]},
  ],
  ruins:[
    transformRuin(ruinTemplates.foundry,{x:31,z:29},'caldera-foundry'),
    {id:'caldera-service-court',name:'Citadel service court',rooms:[{type:'dormitory',cells:rect(37,29,3,2)},{type:'treasure',cells:rect(37,32,2,1)}]},
    transformRuin(ruinTemplates.archive,{x:39,z:17},'caldera-archive'),
  ],
  environmentRegions:[
    {id:'western-refuge',kind:'dry',cells:ellipse(12,24,10,12)},
    {id:'caldera-rim',kind:'scorched',cells:ellipse(36,24,18,21)},
    {id:'central-citadel',kind:'masonry',cells:citadel},
    {id:'foundry-bank',kind:'masonry',cells:ellipse(20,39,5,4)},
    {id:'cool-outer-mine',kind:'crystal',cells:ellipse(8,39,6,5)},
    {id:'forgotten-northern-gallery',kind:'dry',cells:ellipse(43,5,8,3)},
  ],
  encounters:[
    camp('caldera-watch','Citadel gate watch','volcanic',[{x:36,z:21},{x:40,z:24}],['cinderling','deepmaw'],'raid'),
    camp('outer-bank-den','Outer-bank mineral den','volcanic',[{x:9,z:39}],['cinderling']),
    entrance('caldera-raids','volcanic',{x:36,z:8},['cinderling'],720),
  ],
};
export const calderaPlan:LevelPlayPlan={
  settlement:calderaSettlement,
  intended:[{x:16,z:24},{x:36,z:24}],
  alternate:[{x:16,z:24},{x:16,z:42},{x:36,z:42},{x:36,z:24}],
  suppression:[{x:36,z:24},{x:36,z:8}],
  defensesByApproach:{intended:rect(19,23,3,3),alternate:rect(34,42,3,2)},
};
