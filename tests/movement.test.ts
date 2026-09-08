import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/world.ts';
import {addMiners,tick} from '../src/game/simulation.ts';
import {canStand,findPath,clearLine} from '../src/game/navigation.ts';
import {tileAt} from '../src/game/types.ts';
import {placeDefense} from '../src/game/defenses.ts';
import {moveResident} from '../src/game/movement.ts';
test('opposing dwarfs pass in a one-tile corridor without clipping terrain',()=>{
 const w=createWorld({id:'crowd',name:'Crowd',width:16,height:9,hearth:{x:2,z:2},openings:[],seams:[]});w.furnishings=[];
 for(const t of w.tiles){t.terrain='bedrock';t.known=true;t.core=false;t.claimed=false;}
 for(let x=2;x<=13;x++)Object.assign(tileAt(w,x,5)!,{terrain:'floor',claimed:true});addMiners(w,2);
 const targets=[{x:12,z:5},{x:3,z:5}];w.agents.forEach((a,i)=>{a.x=i?12:3;a.z=5;a.job={kind:'idle',target:targets[i],work:targets[i],progress:0};a.path=findPath(w,a,targets[i])!;});
 const reached=[false,false];let closest=Infinity;
 for(let i=0;i<250;i++){tick(w,.05);w.agents.forEach((a,j)=>{assert(canStand(w,a));if(Math.hypot(a.x-targets[j].x,a.z-5)<.1)reached[j]=true;});closest=Math.min(closest,Math.abs(w.agents[0].x-w.agents[1].x));if(reached.every(Boolean))break;}
 assert(reached.every(Boolean));assert(closest<.34,'Brief overlap is permitted in the bottleneck');
});

test('fast tuning cannot jump through a wall added across an existing route',async()=>{
 const {tuning}=await import('../src/content/tuning.ts');const {characterById}=await import('../src/content/characters.ts');const def=characterById('miner')!,speed=tuning.speed,multiplier=def.speedMultiplier;
 try{
  tuning.speed=10;def.speedMultiplier=5;
  const w=createWorld({id:'fast',name:'Fast',width:14,height:10,hearth:{x:3,z:3},openings:[[2,6,11,6]],seams:[]});w.furnishings=[];
  for(const t of w.tiles){t.known=true;t.core=false;t.claimed=t.terrain==='floor';}addMiners(w,1);const a=w.agents[0];a.x=3;a.z=6;
  const end={x:10,z:6};a.job={kind:'idle',target:end,work:end,progress:0};a.path=[end];tileAt(w,4,6)!.terrain='rock';
  assert.equal(clearLine(w,a,{x:3.5-tuning.radius,z:6}),false,'The destination must obey canStand even when the sweep only touches a tile boundary.');
  tick(w,.05);assert.equal(a.x,3);assert(canStand(w,a));
 }finally{tuning.speed=speed;def.speedMultiplier=multiplier;}
});

test('a fractional start beside a corner returns a walkable first leg and reaches its destination',()=>{
 const w=createWorld({id:'corner-start',name:'Corner start',width:10,height:10,hearth:{x:2,z:2},openings:[[2,2,8,8]],seams:[]});w.furnishings=[];
 for(const t of w.tiles){t.known=true;t.core=false;t.claimed=t.terrain==='floor';}tileAt(w,3,5)!.terrain='rock';
 addMiners(w,1);const a=w.agents[0];Object.assign(a,{x:3.51,z:4.3});const end={x:5,z:5};
 assert(canStand(w,a));assert(!clearLine(w,a,end));
 a.path=findPath(w,a,end)!;assert(a.path.length>1);assert(clearLine(w,a,a.path[0]),'The first leg from the real position must clear the corner.');
 a.job={kind:'idle',target:end,work:end,progress:0};
 for(let i=0;i<200&&Math.hypot(a.x-end.x,a.z-end.z)>.1;i++){tick(w,.05);assert(canStand(w,a));}
 assert(Math.hypot(a.x-end.x,a.z-end.z)<.1,'The resident must not repeatedly request the same obstructed route.');
});

test('a short swept corner intersection beside an automatic door cannot be missed by a long path segment',()=>{
 const w=createWorld({id:'door-corner',name:'Door corner',width:24,height:24,hearth:{x:4,z:19},openings:[[2,2,21,21]],seams:[]});
 for(const t of w.tiles){t.known=true;t.claimed=t.terrain==='floor';}
 for(let z=1;z<w.height-1;z++)if(z!==10)tileAt(w,7,z)!.terrain='bedrock';
 w.outputs['timber-door']=1;placeDefense(w,'timber-door',{x:7,z:10});
 addMiners(w,1);const a=w.agents[0];Object.assign(a,{x:7.749721473549873,z:10.380282689929333});
 const end={x:4,z:17};
 assert(canStand(w,a));
 assert.equal(clearLine(w,a,{x:7,z:10}),false,'The full segment clips a narrow corner interval also hit by the first movement step.');
 a.path=findPath(w,a,end)!;
 assert.deepEqual(a.path[0],{x:8,z:10},'Recenter on safe floor before turning through the doorway.');
 for(let i=0;i<400&&a.path.length;i++){moveResident(w,a,.05);assert(canStand(w,a));}
 assert(Math.hypot(a.x-end.x,a.z-end.z)<.1,'A resident following a route without an ordinary job reaches the exit continuously.');
});
