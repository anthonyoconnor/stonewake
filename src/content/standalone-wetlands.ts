import type { LevelDefinition } from '../game/types.ts';
import { col, ellipse, path, polygon, rect, row, transformRuin, union } from './level-authoring.ts';
import { settlementBlueprint, type LevelPlayPlan } from './level-play-plans.ts';
import { ruinTemplates } from './ruins.ts';
import { camp, entrance } from './level-encounters.ts';

const fungalHearth = { x: 24, z: 33 };
const fungalSettlement = settlementBlueprint(fungalHearth);
// Three hooked deposits follow the refuge's west wall and northern shoulders.
fungalSettlement.gold = [
  [-5,-4],[-5,-3],[-5,-2],[-4,-2],[-4,-1],[-4,0],[-4,1],
  [-4,-7],[-3,-7],[-2,-7],[-1,-7],[-1,-6],[0,-6],[1,-6],
  [4,-6],[5,-6],[5,-5],[6,-5],[6,-4],[7,-4],[7,-3],
].map(([x,z])=>({x:fungalHearth.x+x,z:fungalHearth.z+z}));
fungalSettlement.development = union(fungalSettlement.development, fungalSettlement.gold);

const confluenceLobes = union(
  ellipse(12, 15, 9, 8), ellipse(14, 23, 4, 3),
  ellipse(37, 17, 10, 6), ellipse(28, 8, 14, 6),
  path([{ x: 14, z: 20 }, { x: 23, z: 20 }, { x: 24, z: 11 }], 3),
  path([{ x: 23, z: 20 }, { x: 34, z: 20 }], 3),
  path([{ x: 37, z: 9 }, { x: 44, z: 9 }, { x: 44, z: 12 }], 2),
);
const confluencePools = union(
  ellipse(10, 12, 5, 4), ellipse(17, 16, 3, 3),
  ellipse(31, 17, 4, 3), ellipse(42, 22, 4, 2),
  ellipse(28, 7, 5, 3),
);

/** M42: a southern refuge branches into three wet lobes joined by buried civic ground. */
export const fungalStandaloneLevel: LevelDefinition = {
  id: 'region-fungal', name: 'Overgrown Confluence', biome: 'fungal', width: 50, height: 42,
  hearth: fungalHearth,
  onwardHearth: { id: 'confluence-relay', name: 'Confluence Hearthstone', x: 37, z: 8 },
  openings: [[22,31,26,35]],
  seams: [
    { terrain: 'floor', cells: confluenceLobes },
    { terrain: 'water', cells: confluencePools },
    { terrain: 'bedrock', cells: union(
      path([{ x: 5, z: 24 }, { x: 8, z: 27 }, { x: 13, z: 28 }], 2),
      ellipse(25, 14, 1, 1),
      ellipse(10, 12, 1, 1), ellipse(42, 22, 1, 1),
      path([{ x: 34, z: 4 }, { x: 36, z: 3 }, { x: 41, z: 4 }], 2),
    ) },
    { terrain: 'rock', cells: union(
      path([{ x: 8, z: 19 }, { x: 9, z: 21 }, { x: 10, z: 21 }]),
      [{ x: 21, z: 9 }, { x: 32, z: 12 }, { x: 40, z: 14 }, { x: 42, z: 16 }],
    ) },
    { terrain: 'gold', cells: union(
      fungalSettlement.gold, row(32, 29, 3), col(34, 20, 4), col(14, 26, 4), row(23, 11, 5),
      path([{ x: 5, z: 6 }, { x: 8, z: 5 }, { x: 11, z: 6 }]),
      path([{ x: 43, z: 18 }, { x: 45, z: 17 }, { x: 46, z: 18 }]),
    ) },
  ],
  ruins: [
    transformRuin({ id: 'overgrown-waystation', name: 'Overgrown waystation', rooms: [
      { type: 'dormitory', cells: union(rect(0,0,3,2), rect(0,2,2,1)) },
      { type: 'treasure', cells: rect(0,4,2,2) },
    ] }, { x: 11, z: 21 }, 'confluence-waystation'),
    transformRuin(ruinTemplates.archive, { x: 23, z: 20 }, 'buried-confluence-archive', 2),
  ],
  environmentRegions: [
    { id: 'southern-dry-refuge', kind: 'dry', cells: ellipse(24,33,12,9) },
    { id: 'wet-cavern-confluence', kind: 'damp', cells: union(ellipse(13,15,11,10),ellipse(35,17,13,10),ellipse(28,7,15,7)) },
    { id: 'western-fungal-pocket', kind: 'fungal', cells: ellipse(9,11,7,8) },
    { id: 'east-colony-margin', kind: 'fungal', cells: ellipse(41,19,7,7) },
    { id: 'northern-brood-neck', kind: 'fungal', cells: ellipse(43,9,5,6) },
    { id: 'buried-civic-crossing', kind: 'masonry', cells: union(path([{x:14,z:20},{x:23,z:20},{x:23,z:11}],5),rect(20,16,5,6)) },
    { id: 'overgrown-waystation-stone', kind: 'masonry', cells: rect(10,20,5,7) },
    { id: 'north-relay-foundation', kind: 'masonry', cells: ellipse(37,8,4,3) },
  ],
  encounters: [
    camp('confluence-colonies', 'Confluence colony margins', 'fungal', [{x:18,z:12},{x:36,z:16}], ['cave-spider','spore-brute'], 'raid'),
    camp('western-mineral-nest', 'Western mineral nest', 'fungal', [{x:5,z:10}], ['cave-spider']),
    entrance('confluence-deep-passage', 'fungal', {x:44,z:12}, ['cave-spider'], 480),
  ],
};

export const fungalStandalonePlan: LevelPlayPlan = {
  settlement: fungalSettlement,
  intended: [{x:28,z:29},{x:34,z:29},{x:34,z:20},{x:37,z:20},{x:37,z:8}],
  alternate: [{x:20,z:30},{x:14,z:30},{x:14,z:20},{x:22,z:20},{x:22,z:11},{x:37,z:11},{x:37,z:8}],
  suppression: [{x:37,z:8},{x:44,z:8},{x:44,z:12}],
  defensesByApproach: { intended: rect(30,27,2,3), alternate: rect(18,29,2,3) },
};

const ancientHearth = { x: 11, z: 12 };
const ancientSettlement = settlementBlueprint(ancientHearth);
// Offset L-shaped seams leave the arrival floor ring and every planned service footprint intact.
ancientSettlement.gold = [
  [-4,-7],[-3,-7],[-3,-6],[-2,-6],[-1,-6],[0,-6],[1,-6],
  [4,-6],[5,-6],[6,-6],[6,-5],[7,-5],[7,-4],[7,-3],
  [-4,5],[-4,6],[-3,6],[-2,6],[-1,6],[0,6],[0,5],
].map(([x,z])=>({x:ancientHearth.x+x,z:ancientHearth.z+z}));
ancientSettlement.development = union(ancientSettlement.development, ancientSettlement.gold);

const floodedBasin = polygon([
  {x:25,z:3},{x:31,z:4},{x:32,z:11},{x:37,z:16},{x:36,z:23},
  {x:33,z:28},{x:26,z:29},{x:22,z:26},{x:19,z:20},{x:21,z:14},{x:24,z:10},
]);
const watchDistricts = union(
  ellipse(23,9,3,4), rect(20,9,6,4),
  ellipse(37,9,6,5), rect(34,8,8,8),
  path([{x:39,z:12},{x:39,z:24},{x:43,z:31}],5),
  ellipse(43,32,8,7),
  rect(11,22,8,11), path([{x:14,z:28},{x:21,z:32},{x:37,z:32},{x:43,z:33}],5),
  rect(24,30,10,7),
  path([{x:44,z:32},{x:48,z:27},{x:48,z:22}],3),
);

/** M42: two civic courts across water, with a paid causeway and a dry foundry shore. */
export const ancientStandaloneLevel: LevelDefinition = {
  id: 'region-ancient', name: 'Flooded Watch Districts', biome: 'ancient', width: 54, height: 44,
  hearth: ancientHearth,
  onwardHearth: {id:'flooded-watch-relay',name:'Flooded Watch Hearthstone',x:43,z:33},
  openings: [[9,10,13,14]],
  seams: [
    {terrain:'floor',cells:watchDistricts},
    {terrain:'water',cells:floodedBasin},
    {terrain:'bedrock',cells:union(
      ellipse(28,19,2,2), ellipse(26,25,1,1),
      path([{x:6,z:25},{x:7,z:29},{x:8,z:31}],2),
      path([{x:35,z:36},{x:36,z:39},{x:41,z:40}],2),
      path([{x:45,z:10},{x:47,z:13},{x:48,z:16}],2),
    )},
    {terrain:'rock',cells:union(
      row(20,7,3),col(35,12,4),row(40,18,4),col(18,24,5),row(24,35,4),
      [{x:40,z:29},{x:46,z:34},{x:32,z:31}],
    )},
    {terrain:'gold',cells:union(
      ancientSettlement.gold,row(20,10,4),col(39,19,4),col(14,20,4),row(21,31,5),
      row(35,31,4),path([{x:46,z:37},{x:48,z:36},{x:49,z:37}]),
      path([{x:39,z:5},{x:42,z:4},{x:43,z:5}]),
    )},
  ],
  ruins: [
    {id:'flooded-service-watch',name:'Southern service watch',rooms:[
      {type:'dormitory',cells:union(rect(11,25,3,2),rect(11,27,2,1))},
      {type:'treasure',cells:rect(15,28,2,2)},
      {type:'kitchen',cells:rect(16,24,2,3)},
    ]},
    transformRuin(ruinTemplates.foundry,{x:26,z:32},'flooded-shore-foundry'),
    transformRuin(ruinTemplates.archive,{x:35,z:9},'flooded-northern-watch'),
  ],
  environmentRegions: [
    {id:'northwest-excavation',kind:'dry',cells:ellipse(11,12,10,10)},
    {id:'flooded-city-margins',kind:'damp',cells:ellipse(28,18,14,17)},
    {id:'western-watch-court',kind:'masonry',cells:rect(19,5,7,10)},
    {id:'northern-watch-court',kind:'masonry',cells:rect(33,5,10,12)},
    {id:'eastern-civic-street',kind:'masonry',cells:union(rect(37,15,7,14),ellipse(43,33,8,6))},
    {id:'dry-service-street',kind:'masonry',cells:union(rect(10,21,10,12),rect(18,29,22,8))},
    {id:'foundry-workbay',kind:'scorched',cells:rect(25,32,5,4)},
    {id:'southern-natural-intrusion',kind:'fungal',cells:ellipse(37,38,6,4)},
    {id:'damp-outer-passage',kind:'damp',cells:ellipse(48,24,4,6)},
  ],
  encounters: [
    camp('flooded-civic-watch','Flooded civic watch','ancient',[{x:39,z:14},{x:42,z:29}],['restless-guard','ancient-sentinel'],'raid'),
    camp('flooded-shore-watch','Service street watch','ancient',[{x:17,z:23}],['restless-guard']),
    entrance('flooded-deep-passage','ancient',{x:48,z:22},['restless-guard'],780),
  ],
};

export const ancientStandalonePlan: LevelPlayPlan = {
  settlement: ancientSettlement,
  intended: [{x:15,z:10},{x:39,z:10},{x:39,z:31},{x:43,z:31},{x:43,z:33}],
  alternate: [{x:14,z:16},{x:14,z:31},{x:43,z:31},{x:43,z:33}],
  suppression: [{x:43,z:33},{x:48,z:33},{x:48,z:22}],
  defensesByApproach: {intended:rect(17,9,2,3),alternate:rect(13,18,3,2)},
};
