import type { LevelDefinition } from '../game/types.ts';
import { col, ellipse, path, polygon, rect, row, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { camp, entrance } from './level-encounters.ts';

const hearth={x:26,z:20};
const settlement=settlementBlueprint(hearth);
settlement.gold=union(path([{x:22,z:13},{x:26,z:12},{x:29,z:12}]),col(21,18,5),[{x:22,z:22}],path([{x:24,z:26},{x:27,z:26},{x:28,z:27}]));
settlement.development=union(settlement.development,settlement.gold);
const north=union(ellipse(26,7,7,3),path([{x:29,z:7},{x:38,z:7},{x:43,z:7}],3));
const east=union(ellipse(41,15,6,4),ellipse(43,7,6,4),path([{x:36,z:20},{x:36,z:17},{x:42,z:14},{x:43,z:8}],3));
const west=union(ellipse(12,21,7,5),rect(18,21,2,3));
const southern=union(ellipse(36,33,8,5),path([{x:31,z:29},{x:29,z:32},{x:29,z:36},{x:35,z:35}],3),ellipse(22,35,8,6));

/** M42: a central refuge with radial wells and an optional southern fracture recess. */
export const prismLevel:LevelDefinition={
  id:'region-crystal',name:'Prism Wells',biome:'crystal',width:54,height:44,hearth,
  onwardHearth:{id:'prism-wells-relay',name:'Prism Wells Hearthstone',x:43,z:7},
  openings:[[24,18,28,22]],
  seams:[
    {terrain:'bedrock',cells:union(polygon([{x:10,z:6},{x:15,z:8},{x:20,z:13},{x:18,z:16},{x:15,z:12},{x:9,z:10}]),polygon([{x:37,z:23},{x:46,z:22},{x:48,z:26},{x:43,z:28},{x:37,z:27}]))},
    {terrain:'floor',cells:union(north,east,west,southern)},
    {terrain:'chasm',cells:ellipse(22,35,6,4)},
    {terrain:'rock',cells:union(row(22,5,9),row(22,10,9),[{x:22,z:7},{x:22,z:8},{x:30,z:8},{x:30,z:9},{x:12,z:18},{x:14,z:23},{x:39,z:14}])},
    {terrain:'gold',cells:union(settlement.gold,col(36,15,4),path([{x:34,z:6},{x:36,z:5},{x:39,z:5}]),row(9,27,7),row(35,39,6))},
    {terrain:'gem',cells:[{x:6,z:23},{x:42,z:35}]},
  ],
  ruins:[{id:'prism-archive',name:'Prism survey archive',rooms:[
    {type:'library',cells:rect(23,6,3,2)},
    {type:'training',cells:rect(23,8,3,2)},
    {type:'dormitory',cells:rect(27,6,2,2)},
    {type:'treasure',cells:rect(27,9,2,1)},
  ]}],
  environmentRegions:[
    {id:'central-survey-refuge',kind:'dry',cells:ellipse(26,20,9,10)},
    {id:'northern-mineral-branch',kind:'crystal',cells:ellipse(34,8,17,6)},
    {id:'eastern-mineral-branch',kind:'crystal',cells:ellipse(42,15,9,8)},
    {id:'western-well',kind:'crystal',cells:ellipse(12,21,9,7)},
    {id:'southern-well',kind:'crystal',cells:ellipse(35,34,12,8)},
    {id:'fracture-recess',kind:'damp',cells:ellipse(22,35,8,6)},
    {id:'archive-court',kind:'masonry',cells:rect(21,4,11,8)},
    {id:'relay-shrine',kind:'masonry',cells:rect(40,4,7,6)},
  ],
  encounters:[
    camp('prism-watch','Prism relay watch','crystal',[{x:42,z:7},{x:44,z:10}],['crystal-elemental','crystalback-stalker'],'raid'),
    camp('western-well-hunter','Western well hunter','crystal',[{x:10,z:20}],['crystalback-stalker']),
    camp('southern-well-hunter','Southern well hunter','crystal',[{x:39,z:34}],['crystalback-stalker']),
    entrance('prism-raids','crystal',{x:45,z:18},['crystal-elemental'],720),
  ],
};
export const prismPlan:LevelPlayPlan={
  settlement,
  intended:[{x:30,z:20},{x:36,z:20},{x:36,z:14},{x:43,z:14},{x:43,z:7}],
  alternate:[{x:26,z:18},{x:26,z:7},{x:43,z:7}],
  suppression:[{x:43,z:7},{x:43,z:18},{x:45,z:18}],
  defensesByApproach:{intended:rect(33,18,3,3),alternate:rect(25,10,3,3)},
};
