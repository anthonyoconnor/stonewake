import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync,writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge'});
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
  await page.mouse.move(100,350);
  await page.waitForFunction(()=>!window.lightingView.labLighting.pointerActive);
  await page.locator('#lighting-view').selectOption('crossing');await page.locator('#lighting-locate').click();
  await page.screenshot({path:'test-results/m33/lava-water.png'});
  await page.locator('#lighting-view').selectOption('fog');await page.locator('#lighting-locate').click();
  await page.screenshot({path:'test-results/m33/fog-boundary.png'});
  const fog=await snapshot();assert.deepEqual(fog.known,initial.known);assert.equal(fog.elapsed,0);
  assert(fog.masks.every(m=>!(m.position[0]>=22&&m.position[2]<=5)),'Hidden light sources remain excluded');
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:800,height:600});
  await page.locator('[data-light=ambient]').fill('0.4');
  await page.waitForFunction(()=>window.lightingView.scene.getLightByName('cavern light').intensity===.4);
  await page.locator('#lighting-defaults').click();
  await page.waitForFunction(()=>window.lightingView.scene.getLightByName('cavern light').intensity===.22);
  await page.locator('#lighting-reset').click();await page.locator('#loading-screen').waitFor({state:'hidden'});
  assert.equal((await snapshot()).lights.filter(n=>n.startsWith('M33')).length,7,'Reset replaces the bounded light pool');
  await page.locator('#return-stronghold').click();await page.locator('#loading-screen').waitFor({state:'hidden'});
  const returned=await snapshot();assert.equal(returned.ambient,.62);assert.equal(returned.rim,.96);
  assert(!returned.lights.some(n=>n.startsWith('M33')));assert.equal(returned.settings,undefined);
  assert.deepEqual(await page.evaluate(()=>window.strongholdDev.state()),retained);
  assert.equal(await page.evaluate(()=>window.strongholdDev.status().paused),true);
  assert.deepEqual(errors,[]);
  writeFileSync('test-results/m33/report.json',JSON.stringify({initial,fog,returned,errors},null,2));
  console.log('M33 room: source/pointer lighting, camera tracking, UI suppression, fog preservation, compact controls, reset and baseline restoration passed.');
}finally{await browser.close();}
