import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge'});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.GAME_URL??'http://127.0.0.1:5173'}/?scenario=character-models&paused=1`);
  await page.waitForFunction(()=>window.strongholdDev?.version===1);
  const views=await page.evaluate(async()=>{
    const source=await (await fetch('/src/view/scene.ts')).text();
    const {EngineStore}=await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    const scene=EngineStore.LastCreatedScene,w=window.strongholdDev.state(),result=[];
    for(const type of ['stonehand','miner']){
      const a=w.agents.find(a=>a.type===type),root=scene.getTransformNodeByName(`${type==='stonehand'?'stonehand':'dwarf'}-${a.id}`);
      scene.activeCamera.target.set(a.x,.28,a.z);scene.activeCamera.radius=2;
      scene.activeCamera.alpha=Math.PI*.4;scene.activeCamera.beta=1;
      scene.render();
      const bounds=root.getChildMeshes().map(m=>m.getBoundingInfo().boundingBox);
      const height=Math.max(...bounds.map(b=>b.maximumWorld.y))-Math.min(...bounds.map(b=>b.minimumWorld.y));
      result.push({type,height,image:document.querySelector('#world').toDataURL('image/png').split(',')[1]});
    }
    return result;
  });
  assert(views[0].height<views[1].height*.65,'Stonehand silhouette stays much smaller than the retained Miner');
  mkdirSync('test-results',{recursive:true});
  for(const view of views)writeFileSync(`test-results/${view.type}-closeup.png`,Buffer.from(view.image,'base64'));
  await page.getByRole('button',{name:'Workforce',exact:true}).click();
  await page.locator('[data-dwarf-role="stonehand"]').click();
  assert.match(await page.locator('#residents-list').textContent(),/No food, beds, wages or training/);
  assert.doesNotMatch(await page.locator('#residents-list').textContent(),/Energy|Meals|Level/);
  assert.deepEqual(errors,[]);
  console.log(`PASS: Stonehand height ${views[0].height.toFixed(2)}, retained Miner ${views[1].height.toFixed(2)}; correct construct details; no runtime errors.`);
} finally {await browser.close();}
