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
