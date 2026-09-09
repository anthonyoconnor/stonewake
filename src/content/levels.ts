import type { LevelDefinition, Point } from '../game/types';
const row = (x: number, z: number, count: number): Point[] => Array.from({length: count}, (_,i) => ({x:x+i,z}));
export const prototypeLevel: LevelDefinition = {
  id: 'border-foothold', name: 'Border Foothold', width: 48, height: 48, hearth: {x:23,z:24},
  onwardHearth: {id:'northern-runic-gate',name:'Northern runic Hearthstone',x:24,z:10},
  // One walking ring around the Hearth; room footprints must be excavated.
  openings: [[21,22,25,26],[13,23,17,25],[9,19,13,27],[30,25,35,27],[35,22,40,30],[40,26,47,26],[20,9,27,13],[23,14,24,17]],
  seams: [
    {terrain:'bedrock',cells:[...row(13,17,10),...row(12,18,6),...row(30,18,8),...row(30,19,8),...row(16,30,17),...row(16,31,17)]},
    {terrain:'gold',cells:[...row(20,18,6),...row(21,17,5),...row(27,30,3),...row(10,18,4),...row(31,24,4)]},
    {terrain:'rock',cells:[...row(26,19,4),...row(29,20,3),...row(29,21,3),...row(17,26,1)]},
    {terrain:'dirt',cells:[{x:19,z:21},{x:20,z:21},{x:27,z:27}]},
    {terrain:'gem',cells:[{x:28,z:23},{x:28,z:24},{x:12,z:21},{x:37,z:25}]}
  ],
  encounters: [
    {id:'buried-guard-camp',name:'Buried guard camp',kind:'camp',positions:[{x:22,z:10},{x:25,z:11}],activation:'discovery',delay:0,warningSeconds:8,clear:'defeat',warning:'A disturbed hostile group is gathering.'},
    {id:'east-deep-passage',name:'Eastern deep passage',kind:'entrance',positions:[{x:46,z:26}],activation:'time',delay:360,warningSeconds:25,repeatSeconds:150,clear:'claim',warning:'An approaching raid echoes through the tunnels.'},
  ]
};
