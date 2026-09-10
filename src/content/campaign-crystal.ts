import type { LevelDefinition } from '../game/types.ts';
import { col, ellipse, path, polygon, rect, row, transformRuin, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { ruinTemplates } from './ruins.ts';
import { camp, entrance } from './level-encounters.ts';

const hearth = {x:49,z:12};
const settlement = settlementBlueprint(hearth);
settlement.gold = union(path([{x:45,z:6},{x:48,z:6},{x:50,z:5},{x:54,z:5}]),col(45,11,4),path([{x:47,z:17},{x:47,z:18},{x:51,z:18}]));
const inner = new Set(ellipse(38,26,10,12).map(p=>`${p.x},${p.z}`));
const crescent = ellipse(34,26,13,16).filter(p=>!inner.has(`${p.x},${p.z}`));
const northern = union(ellipse(34,7,8,3),path([{x:40,z:9},{x:34,z:7},{x:23,z:7},{x:18,z:16}],4),ellipse(22,9,5,4));
const western = union(ellipse(15,27,5,7),path([{x:18,z:16},{x:14,z:22},{x:15,z:31},{x:21,z:39}],4));
const southern = union(ellipse(46,42,8,5),path([{x:51,z:24},{x:53,z:32},{x:48,z:43},{x:30,z:45},{x:21,z:39}],4),ellipse(32,44,7,4));
const pocket = union(ellipse(38,23,4,6),path([{x:49,z:24},{x:43,z:23},{x:39,z:25}],3));

/** M39: an eastern branching spine facing a crescent fracture, with two land routes. */
export const crystalLevel: LevelDefinition = {
  id:'campaign-crystal-divide',name:'Crystal Divide',biome:'crystal',width:64,height:52,hearth,
  onwardHearth:{id:'crystal-divide-relay',name:'Crystal Divide onward Hearthstone',x:15,z:29},
  openings:[[47,10,51,14]],
  seams:[
    {terrain:'bedrock',cells:union(polygon([{x:5,z:10},{x:11,z:4},{x:17,z:3},{x:17,z:6},{x:11,z:10},{x:8,z:18}]),polygon([{x:57,z:20},{x:60,z:22},{x:61,z:37},{x:57,z:42},{x:57,z:29},{x:54,z:24}]))},
    {terrain:'floor',cells:union(northern,western,southern,pocket,ellipse(45,48,3,2))},
    {terrain:'chasm',cells:crescent},
    {terrain:'rock',cells:union(ellipse(37,17,2,3),ellipse(28,36,3,2),[{x:17,z:23},{x:12,z:28},{x:32,z:6},{x:48,z:41}])},
    {terrain:'dirt',cells:union(row(41,46,9),row(41,47,9))},
    {terrain:'gold',cells:union(settlement.gold,path([{x:41,z:8},{x:40,z:6},{x:37,z:5}]),path([{x:52,z:21},{x:54,z:23},{x:54,z:26}]),row(22,44,6),row(12,35,5))},
    {terrain:'gem',cells:[{x:44,z:49}]},
  ],
  ruins:[
    transformRuin(ruinTemplates.archive,{x:20,z:8},'crystal-archive',0),
    {id:'crystal-south-shelter',name:'Mineral expedition waystation',rooms:[
      {type:'treasure',cells:rect(30,45,2,2)},
      {type:'kitchen',cells:rect(32,45,2,3)},
      {type:'dormitory',cells:rect(34,44,3,3)},
    ]},
    {id:'crystal-relay-refectory',name:'Relay refectory',rooms:[{type:'kitchen',cells:rect(12,31,2,2)}]},
  ],
  environmentRegions:[
    {id:'dry-eastern-refuge',kind:'dry',cells:ellipse(49,12,9,10)},
    {id:'pale-northern-spine',kind:'crystal',cells:union(ellipse(32,8,12,5),ellipse(18,17,5,8))},
    {id:'mineral-inner-pocket',kind:'crystal',cells:ellipse(38,24,7,10)},
    {id:'southern-hunting-cavern',kind:'crystal',cells:union(ellipse(45,43,11,6),ellipse(53,30,5,8))},
    {id:'western-relay-cave',kind:'crystal',cells:ellipse(14,28,7,9)},
    {id:'warm-archive-bay',kind:'masonry',cells:rect(18,6,8,7)},
    {id:'southern-shelter',kind:'masonry',cells:rect(29,43,9,7)},
    {id:'relay-refectory',kind:'masonry',cells:rect(11,30,4,4)},
  ],
  encounters:[
    camp('crystal-watch','Fractured relay cavern','crystal',[{x:14,z:26},{x:17,z:30}],['crystal-elemental','crystalback-stalker'],'raid'),
    camp('gem-hunter','Southern mineral hunting ground','crystal',[{x:45,z:48}],['crystalback-stalker']),
    entrance('crystal-raids','crystal',{x:10,z:33},['crystal-elemental'],780),
  ],
};

export const crystalPlan: LevelPlayPlan = {
  settlement,
  intended:[{x:46,z:12},{x:41,z:12},{x:41,z:7},{x:23,z:7},{x:18,z:7},{x:18,z:18},{x:15,z:18},{x:15,z:29}],
  alternate:[{x:52,z:15},{x:52,z:25},{x:53,z:25},{x:53,z:42},{x:47,z:42},{x:47,z:44},{x:21,z:44},{x:21,z:39},{x:15,z:39},{x:15,z:29}],
  suppression:[{x:15,z:29},{x:15,z:33},{x:10,z:33}],
  defenses:rect(45,14,3,3),
  defensesByApproach:{intended:rect(43,10,3,3),alternate:rect(50,18,3,3)},
};
