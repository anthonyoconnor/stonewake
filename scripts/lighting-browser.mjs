import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync,writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge'});
const checkCandidates=process.argv.includes('--candidates');
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.GAME_URL??'http://127.0.0.1:5173'}/?scenario=stronghold&paused=1`);
  await page.locator('#loading-screen').waitFor({state:'hidden'});
  const retained=await page.evaluate(()=>window.strongholdDev.state());
  await page.evaluate(async()=>{
    const {GameScene}=await import(performance.getEntriesByType('resource').find(e=>/\/src\/view\/scene(\.ts)?(\?|$)/.test(e.name)).name);
    const original=GameScene.prototype.render;
    GameScene.prototype.render=function(){window.lightingView=this;return original.call(this);};
  });
  await page.getByRole('button',{name:'Debug',exact:true}).click();
  await page.getByRole('button',{name:'Test harnesses',exact:true}).click();
  await page.getByRole('button',{name:'M33 lighting test room',exact:true}).click();
  await page.locator('#loading-screen').waitFor({state:'hidden'});
  assert(await page.getByRole('button',{name:'Resume simulation'}).isVisible());
  assert(await page.locator('#lighting-status').textContent());
  const snapshot=()=>page.evaluate(()=>{
    const v=window.lightingView,l=v.labLighting;
    return {ambient:v.scene.getLightByName('cavern light').intensity,rim:v.scene.getLightByName('warm rim').intensity,
      sources:l?.activeSources,pointer:l?.pointerActive,position:l?.pointer.position.asArray(),
      lights:v.scene.lights.map(l=>l.name),known:v.world.tiles.map(t=>t.known),settings:v.world.lightingTest,
      elapsed:v.world.elapsed,fps:v.engine.getFps(),masks:l?.sources.filter(s=>s.isEnabled()).map(s=>({position:s.position.asArray(),count:s.includedOnlyMeshes.length}))};
  });
  const initial=await snapshot();assert.equal(initial.ambient,.22);assert(initial.sources>0&&initial.sources<=6);
  if(checkCandidates)await page.evaluate(async()=>{
    window.candidateChecks=[];
    window.checkCandidateParity=(label)=>{
      const v=window.lightingView,s=v.scene,cached=s.getActiveMeshCandidates;
      const draw=(provider)=>{
        s.getActiveMeshCandidates=provider;
        const instances=[],fog=v.unknownBlock,register=fog?._registerInstanceForRenderId;
        if(fog)fog._registerInstanceForRenderId=function(instance,id){instances.push(instance.uniqueId);return register.call(this,instance,id);};
        try{
          s.render(false);
          return {active:s.getActiveMeshes().data.slice(0,s.getActiveMeshes().length).map(m=>m.uniqueId),instances,candidates:provider().length};
        }finally{if(fog)fog._registerInstanceForRenderId=register;}
      };
      try{
        const full=()=>({data:s.meshes,length:s.meshes.length});
        const expected=draw(full),actual=draw(cached),again=draw(full);
        for(const key of ['active','instances'])
          if(JSON.stringify(actual[key])!==JSON.stringify(expected[key])||JSON.stringify(again[key])!==JSON.stringify(expected[key]))
            throw Error(`${label}: candidate/default ${key} IDs or ordering differ`);
        window.candidateChecks.push({label,meshes:s.meshes.length,candidates:actual.candidates,active:actual.active.length,fogInstances:actual.instances.length});
      }finally{s.getActiveMeshCandidates=cached;}
    };
    const v=window.lightingView,c=v.camera,original={alpha:c.alpha,beta:c.beta,radius:c.radius,target:c.target.clone()};
    try{
      window.checkCandidateParity('normal camera');
      c.alpha+=Math.PI;window.checkCandidateParity('reverse camera');
      c.radius*=1.7;window.checkCandidateParity('zoom out');
      c.radius=original.radius*.65;c.target.set(v.world.width-5,0,v.world.height-5);window.checkCandidateParity('pan and zoom in');
      const staticMesh=[...v.tileNodes.values()].flatMap(n=>n.node.getChildMeshes()).find(m=>!m.isInFrustum(v.scene.frustumPlanes));
      if(!staticMesh)throw Error('Candidate parity requires offscreen static geometry');
      try{staticMesh.alwaysSelectAsActiveMesh=true;window.checkCandidateParity('forced active static mesh');}
      finally{staticMesh.alwaysSelectAsActiveMesh=false;}
      try{v.scene.skipFrustumClipping=true;window.checkCandidateParity('frustum clipping bypass');}
      finally{v.scene.skipFrustumClipping=false;}
    }finally{c.alpha=original.alpha;c.beta=original.beta;c.radius=original.radius;c.target.copyFrom(original.target);}
    if(!window.candidateChecks.some(c=>c.candidates<c.meshes))throw Error('The static shortlist must remove offscreen candidates');
    const meshes=[...v.tileNodes.values(),...v.furnitureNodes.values()].flatMap(n=>n.node.getChildMeshes());
    const methods=new Map(meshes.map(m=>[m,m.isInFrustum])),provider=v.scene.getActiveMeshCandidates;let calls=0,inProvider=false;
    try{
      v.scene.getActiveMeshCandidates=()=>{inProvider=true;try{return provider();}finally{inProvider=false;}};
      v.scene.updateTransformMatrix();const warmed=v.scene.getActiveMeshCandidates(),buffer=warmed.data;
      for(const [mesh,method] of methods)mesh.isInFrustum=function(planes){if(inProvider)calls++;return method.call(this,planes);};
      const repeated=v.scene.getActiveMeshCandidates();const stationaryFrustumChecks=calls;
      if(repeated!==warmed||repeated.data!==buffer)throw Error('Stationary candidate queries reuse their result buffer');
      // Real frames include GlowLayer's matrix/UBO swaps; count only the
      // provider's checks, excluding Babylon's retained per-active-mesh cull.
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const stationaryFrameFrustumChecks=calls-stationaryFrustumChecks;
      if(stationaryFrameFrustumChecks!==0)throw Error('Stationary glow-enabled renders reuse static visibility across frames');
      c.alpha+=.01;v.scene.updateTransformMatrix();v.scene.getActiveMeshCandidates();
      const cameraChangeFrustumChecks=calls-stationaryFrustumChecks-stationaryFrameFrustumChecks;
      if(stationaryFrustumChecks!==0||cameraChangeFrustumChecks===0)throw Error('Static frustum checks must cache until the camera changes');
      window.candidateCacheChecks={stationaryFrustumChecks,stationaryFrameFrustumChecks,cameraChangeFrustumChecks};
    }finally{v.scene.getActiveMeshCandidates=provider;for(const [mesh,method] of methods)mesh.isInFrustum=method;c.alpha=original.alpha;}
  });
  await page.evaluate(()=>{
    const v=window.lightingView,l=v.labLighting,w=v.world,settings=w.lightingTest;
    const ensure=(condition,message)=>{if(!condition)throw Error(message);};
    const update=()=>{l.lastMasks=-Infinity;l.update(settings);};
    const camera=v.camera.target.clone();
    const meshesAt=(x,z)=>v.tileNodes.get(`${x},${z}`).node.getChildMeshes();
    try{
      v.camera.target.set(17,0,7);update();
      const light=l.sources.find(light=>Math.abs(light.position.x-17.36)<.001&&light.position.z===7);
      ensure(light?.isEnabled(),'The fixture lamp beside the bedrock seam is active');
      ensure(meshesAt(18,7).every(mesh=>light.includedOnlyMeshes.includes(mesh)),'The first wall face receives light');
      ensure(meshesAt(20,7).every(mesh=>!light.includedOnlyMeshes.includes(mesh)),'Known floor behind bedrock stays unlit');
      const fixed=l.staticMasks.get(light);update();
      ensure(l.staticMasks.get(light)===fixed,'Stationary geometry reuses its cached visibility');
      const actor=v.scene.transformNodes.find(root=>!root.parent&&/^(dwarf-|hound-|stonehand-)/.test(root.name)&&root.getChildMeshes().length);
      ensure(actor,'The actor fixture exists');
      const position=actor.position.clone(),body=actor.getChildMeshes();
      try{
        // Presentation-only relocation in this paused harness, restored before rendering.
        actor.position.set(17,position.y,7);actor.computeWorldMatrix(true);update();
        window.checkCandidateParity?.('actor enters visible pool');
        ensure(body.every(mesh=>light.includedOnlyMeshes.includes(mesh)),'All parts of an actor enter the visible light pool together');
        actor.position.set(20,position.y,7);actor.computeWorldMatrix(true);update();
        window.checkCandidateParity?.('actor crosses occluder');
        ensure(body.every(mesh=>!light.includedOnlyMeshes.includes(mesh)),'A moving actor loses illumination behind the wall');
        ensure(l.staticMasks.get(light)===fixed,'Actor movement does not recompute static visibility');
      }finally{actor.position.copyFrom(position);actor.computeWorldMatrix(true);update();}
      const tile=w.tiles[6*w.width+17],oldMeshes=meshesAt(17,6);
      ensure(tile.known&&oldMeshes.some(mesh=>light.includedOnlyMeshes.includes(mesh)),'The nearby floor fixture starts lit');
      try{
        tile.known=false;w.revision++;v.refresh();update();
        window.checkCandidateParity?.('terrain replaced by fog');
        ensure(oldMeshes.every(mesh=>mesh.isDisposed()),'Terrain replacement disposes its old geometry');
        ensure(l.sources.every(light=>light.includedOnlyMeshes.every(mesh=>!mesh.isDisposed())),'Cached masks discard disposed geometry');
        ensure(meshesAt(17,6).every(mesh=>l.sources.every(light=>!light.includedOnlyMeshes.includes(mesh))),'New fog geometry is excluded from local lights');
      }finally{tile.known=true;w.revision++;v.refresh();update();window.checkCandidateParity?.('fog replaced by discovered terrain');}
      const beforeRadius=l.staticMasks.get(light),radius=settings.sourceRadius;
      try{
        settings.sourceRadius=radius*.6;update();
        ensure(l.staticMasks.get(light)!==beforeRadius,'Changing source radius invalidates its cached mask');
        ensure(meshesAt(18,7).every(mesh=>light.includedOnlyMeshes.includes(mesh)),'Radius changes retain first-wall illumination');
      }finally{settings.sourceRadius=radius;update();}
    }finally{v.camera.target.copyFrom(camera);update();}
  });
  if(checkCandidates)await page.evaluate(async()=>{
    const v=window.lightingView,w=v.world,agents=w.agents,elapsed=w.elapsed;
    const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const floor=w.tiles.filter(t=>t.known&&t.terrain==='floor').sort((a,b)=>Math.hypot(a.x-v.camera.target.x,a.z-v.camera.target.z)-Math.hypot(b.x-v.camera.target.x,b.z-v.camera.target.z))[0];
    const newcomer={...structuredClone(agents[0]),id:Math.max(...agents.map(a=>a.id))+1000,x:floor.x,z:floor.z,path:[],job:undefined};
    const activeBody=body=>body.some(m=>v.scene.getActiveMeshes().data.slice(0,v.scene.getActiveMeshes().length).includes(m));
    // Paused presentation fixture exercises the actual ResidentView lifecycle;
    // this is render parity, not recruitment/combat gameplay evidence.
    try{
      w.agents=[...agents,newcomer];await frame();await v.ready();window.checkCandidateParity('arriving resident');
      const root=v.scene.transformNodes.find(n=>n.name===`stonehand-${newcomer.id}`||n.name===`dwarf-${newcomer.id}`||n.name===`hound-${newcomer.id}`);
      if(!root)throw Error('Arriving resident creates its model');
      const body=root.getChildMeshes();
      if(!activeBody(body))throw Error('The arriving resident is actually visible in the camera');
      newcomer.health=0;w.agents=agents;w.elapsed=elapsed+.75;await frame();window.checkCandidateParity('dying resident');
      if(body.every(m=>m.isDisposed()))throw Error('The death pose remains visible briefly');
      if(!activeBody(body))throw Error('The death pose remains in the active rendering list');
      w.elapsed=elapsed+3;await frame();window.checkCandidateParity('disposed resident');
      if(!body.every(m=>m.isDisposed()))throw Error('Finished death disposes all resident meshes');
    }finally{w.agents=agents;w.elapsed=elapsed;await frame();}
  });
  mkdirSync('test-results/m33',{recursive:true});
  await page.screenshot({path:'test-results/m33/experimental.png'});
  await page.locator('#lab-lighting-enabled').uncheck();
  await page.waitForFunction(()=>window.lightingView.scene.getLightByName('cavern light').intensity===.62);
  await page.screenshot({path:'test-results/m33/baseline.png'});
  await page.locator('#lab-lighting-enabled').check();
  const canvas=await page.locator('#world').boundingBox();
  await page.mouse.move(canvas.x+canvas.width*.5,canvas.y+canvas.height*.55);
  await page.waitForFunction(()=>window.lightingView.labLighting.pointerActive);
  const first=await snapshot();
  // Hold the pointer fixed while orbiting: the light must repick the surface.
  await page.evaluate(()=>window.lightingView.camera.alpha+=.45);
  await page.waitForFunction(p=>JSON.stringify(window.lightingView.labLighting.pointer.position.asArray())!==JSON.stringify(p),first.position);
  await page.screenshot({path:'test-results/m33/pointer-reverse.png'});
  const orbited=await snapshot();
  await page.evaluate(()=>{window.lightingView.camera.target.x+=.5;window.lightingView.camera.radius*=.95;});
  await page.waitForFunction(p=>JSON.stringify(window.lightingView.labLighting.pointer.position.asArray())!==JSON.stringify(p),orbited.position);
  // Modal suppression must also hold when the pointer is still positioned above game canvas.
  await page.evaluate(()=>document.querySelector('.audio-dialog').showModal());
  await page.waitForFunction(()=>!window.lightingView.labLighting.pointerActive);
  await page.evaluate(()=>document.querySelector('.audio-dialog').close());
  await page.mouse.move(100,350);
  await page.waitForFunction(()=>!window.lightingView.labLighting.pointerActive);
  await page.locator('#lighting-view').selectOption('crossing');await page.locator('#lighting-locate').click();
  await page.screenshot({path:'test-results/m33/lava-water.png'});
  await page.locator('#lighting-view').selectOption('fog');await page.locator('#lighting-locate').click();
  await page.screenshot({path:'test-results/m33/fog-boundary.png'});
  const fog=await snapshot();assert.deepEqual(fog.known,initial.known);assert.equal(fog.elapsed,0);
  assert(fog.masks.every(m=>!(m.position[0]>=22&&m.position[2]<=5)),'Hidden light sources remain excluded');
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:800,height:600});
  await page.screenshot({path:'test-results/m33/compact-controls.png'});
  await page.locator('[data-light=ambient]').fill('0.4');
  await page.waitForFunction(()=>window.lightingView.scene.getLightByName('cavern light').intensity===.4);
  await page.locator('#lighting-defaults').click();
  await page.waitForFunction(()=>window.lightingView.scene.getLightByName('cavern light').intensity===.22);
  await page.locator('#lighting-reset').click();await page.locator('#loading-screen').waitFor({state:'hidden'});
  if(checkCandidates)await page.evaluate(()=>window.checkCandidateParity('world reset'));
  assert.equal((await snapshot()).lights.filter(n=>n.startsWith('M33')).length,7,'Reset replaces the bounded light pool');
  await page.locator('#return-stronghold').click();await page.locator('#loading-screen').waitFor({state:'hidden'});
  const returned=await snapshot();assert.equal(returned.ambient,.38);assert.equal(returned.rim,.34);
  if(checkCandidates)await page.evaluate(()=>window.checkCandidateParity('retained world restoration'));
  assert.equal(returned.lights.filter(n=>n.startsWith('M33')).length,7);assert.equal(returned.settings,undefined);
  assert.deepEqual(await page.evaluate(()=>window.strongholdDev.state()),retained);
  assert.equal(await page.evaluate(()=>window.strongholdDev.status().paused),true);
  assert.deepEqual(errors,[]);
  const candidates=checkCandidates?await page.evaluate(()=>window.candidateChecks):undefined;
  const candidateCache=checkCandidates?await page.evaluate(()=>window.candidateCacheChecks):undefined;
  writeFileSync('test-results/m33/report.json',JSON.stringify({initial,fog,returned,candidates,candidateCache,errors},null,2));
  console.log('M33: source/pointer lighting, camera tracking, UI suppression, fog preservation, compact controls, reset and ordinary lighting restoration passed.');
}finally{await browser.close();}
