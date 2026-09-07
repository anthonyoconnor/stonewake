import {designate,addMiners,tick} from '../src/game/simulation.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prototypeLevel} from '../src/content/levels.ts';
import {createWorld,reveal} from '../src/game/world.ts';
import {tileAt} from '../src/game/types.ts';
test('authored prototype has all terrain, fixed core and concealed open spaces',()=>{
 const w=createWorld(prototypeLevel);assert.equal(w.tiles.length,48*48);
 for(const type of ['dirt','rock','bedrock','floor','gold','gem'])assert(w.tiles.some(t=>t.terrain===type));
 assert.equal(w.tiles.filter(t=>t.core).length,9);assert(w.tiles.some(t=>t.terrain==='floor'&&!t.known));
 assert.equal(tileAt(w,0,0)?.terrain,'bedrock');
});
test('sight stops at solid terrain and reveals a breached passage',()=>{
 const w=createWorld({id:'sight',name:'Sight',width:12,height:10,hearth:{x:3,z:3},openings:[[2,2,4,4],[6,2,8,4]],seams:[]});
 for(const t of w.tiles)t.known=false;
 reveal(w,{x:3,z:3},8);assert.equal(tileAt(w,6,3)!.known,false);
 tileAt(w,5,3)!.terrain='floor';reveal(w,{x:4,z:3},8);assert.equal(tileAt(w,6,3)!.known,true);
});

test('unexplored plans do not expose terrain and invalid marks clear only on discovery',()=>{
 const w=createWorld({id:'plans',name:'Plans',width:16,height:12,hearth:{x:3,z:4},openings:[[2,2,4,7],[6,3,8,6]],seams:[{terrain:'bedrock',cells:[{x:9,z:4}]}]});
 for(const t of w.tiles)t.known=false;
 const points=[{x:5,z:4},{x:6,z:4},{x:7,z:4},{x:9,z:4},{x:10,z:4}];
 designate(w,points,'toggle');assert(points.every(p=>tileAt(w,p.x,p.z)!.designated));assert(points.every(p=>!tileAt(w,p.x,p.z)!.known));
 reveal(w,{x:4,z:4},8);assert(tileAt(w,5,4)!.designated);assert(!tileAt(w,6,4)!.known);assert(tileAt(w,6,4)!.designated);
 tileAt(w,5,4)!.terrain='floor';tileAt(w,5,4)!.designated=false;reveal(w,{x:5,z:4},8);
 for(const x of [6,7,9]){assert(tileAt(w,x,4)!.known);assert.equal(tileAt(w,x,4)!.designated,false);}
 assert.equal(tileAt(w,10,4)!.known,false);assert(tileAt(w,10,4)!.designated);
});

test('a tunnel planned through darkness advances as miners uncover its tiles',()=>{
 const w=createWorld({id:'tunnel',name:'Tunnel',width:16,height:12,hearth:{x:3,z:4},openings:[[2,2,5,7],[8,3,10,6]],seams:[]});
 reveal(w,{x:5,z:4},8);for(const t of w.tiles)if(t.known&&t.terrain==='floor')t.claimed=true;
 addMiners(w,1);const points=Array.from({length:5},(_,i)=>({x:6+i,z:4}));designate(w,points);
 assert(!tileAt(w,7,4)!.known);assert(tileAt(w,9,4)!.designated);
 for(let i=0;i<1800;i++)tick(w,.05);
 for(const p of points){const t=tileAt(w,p.x,p.z)!;assert(t.known);assert.equal(t.terrain,'floor');assert.equal(t.designated,false);}
});
