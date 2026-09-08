import { MeshBuilder, TransformNode } from '@babylonjs/core';
import type { GameScene } from './scene';

// Accepted v2 silhouette: an exposed clockwork frame, lamp eye and small stone core.
export function createStonehandModel(v: GameScene, id: number) {
  const root = new TransformNode(`stonehand-${id}`, v.scene);
  const iron = v.material('stonehand iron', '#596367');
  const brass = v.material('stonehand brass', '#b89158');
  const stone = v.material('stonehand stone', '#817d6f');
  const wicker = v.material('stonehand wicker', '#795133');
  const amber = v.material('stonehand amber', '#ffc65c', false, .7);
  const part = (name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat=iron,parent=root) => {
    const mesh=v.box(name,x,y,z,w,h,d,mat,parent);mesh.isPickable=false;return mesh;
  };
  const joint = (name:string,x:number,y:number,z:number,size:number,mat=brass,parent=root) => {
    const mesh=MeshBuilder.CreateSphere(name,{diameter:size,segments:8},v.scene);
    mesh.position.set(x,y,z);mesh.parent=parent;mesh.material=mat;mesh.isPickable=false;return mesh;
  };
  const legs=[-.065,.065].map(x=>{
    const pivot=new TransformNode('stonehand hip',v.scene);pivot.parent=root;pivot.position.set(x,.21,0);
    joint('hip pin',0,0,0,.043,brass,pivot);
    part('thin leg',0,-.08,0,.021,.15,.025,iron,pivot);
    joint('exposed knee',0,-.09,.005,.04,brass,pivot);
    part('little foot',0,-.19,.025,.065,.025,.1,iron,pivot);
    return pivot;
  });
  for(const x of [-.082,.082])part('open torso rail',x,.3,0,.023,.19,.035);
  for(const y of [.21,.39])part('frame crossbar',0,y,0,.19,.025,.04,brass);
  part('suspended rune tablet',0,.3,0,.065,.09,.04,stone).rotation.z=.15;
  part('glowing rune stem',0,.3,.025,.009,.065,.007,amber);
  part('glowing rune branch',.013,.315,.025,.035,.009,.007,amber).rotation.z=.55;
  part('neck spindle',0,.418,0,.027,.065,.027,brass);
  joint('round lamp housing',0,.466,.014,.125);
  const eye=joint('single amber lamp',0,.467,.073,.075,amber);eye.scaling.z=.35;
  // An open basket is visible even when empty; only its gold contents toggle.
  part('basket base',0,.25,-.11,.14,.02,.1,wicker);
  for(const x of [-.075,.075])part('basket side',x,.3,-.11,.012,.11,.12,wicker);
  for(const y of [.26,.29,.32,.35])part('basket weave',0,y,-.17,.16,.012,.013,wicker);
  for(const x of [-.05,0,.05])part('basket upright',x,.3,-.172,.009,.11,.01,brass);
  const load=new TransformNode('stonehand cargo',v.scene);load.parent=root;
  for(const x of [-.035,.025])joint('basket gold',x,.36,-.12,.065,v.material('stonehand gold','#d9a53e'),load);
  const arms=[-.115,.115].map(x=>{
    const pivot=new TransformNode('stonehand shoulder',v.scene);pivot.parent=root;pivot.position.set(x,.37,0);
    joint('shoulder pin',0,0,0,.045,brass,pivot);
    part('arm linkage',0,-.07,0,.017,.13,.024,iron,pivot);
    joint('elbow pin',0,-.075,0,.033,brass,pivot);
    part('small stone palm',0,-.145,.015,.05,.035,.035,stone,pivot);
    for(const x of [-.017,.017])part('pincer finger',x,-.17,.025,.012,.038,.018,iron,pivot);
    return pivot;
  });
  const tool=new TransformNode('stonehand pickaxe',v.scene);tool.parent=arms[1];
  part('pick handle',0,-.09,.052,.019,.3,.021,wicker,tool);
  const pick=part('slender pick head',0,.047,.052,.2,.027,.028,iron,tool);pick.rotation.z=.13;
  const shadow=v.shadow(0,0,.4,.35,v.terrainRoot);
  return {root,legs,arm:arms[1],leftArm:arms[0],tool,load,shadow,trainingWeights:[],stride:id,walking:false};
}
