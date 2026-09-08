import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {characterDefinitions} from '../src/content/characters.ts';

const url=process.env.GAME_URL??'http://127.0.0.1:5173';
const panel=(page,name)=>page.getByRole('button',{name,exact:true}).click();
const state=page=>page.evaluate(()=>window.strongholdDev.state());
async function load(page,scenario){
  await page.goto(`${url}/?scenario=${scenario}&paused=1`);
  await page.waitForFunction(()=>window.strongholdDev?.version===1);
}
async function configure(page,values){
  await panel(page,'Debug');await page.locator('#open-tuning').click();
  for(const [group,fields] of Object.entries(values)){
    await page.getByRole('tab',{name:group,exact:true}).click();
    for(const [id,value] of Object.entries(fields))await page.locator(`[data-setting="${id}"]`).fill(String(value));
  }
  await panel(page,'Apply changes');
}
async function overview(page){
  await load(page,'economy');
  await page.evaluate(()=>{
    for(const type of ['stonehand','cave-hound'])window.strongholdDev.command({kind:'spawn',type});
  });
  await panel(page,'Workforce');
  assert.equal(await page.locator('[data-dwarf-count]').count(),characterDefinitions.length*4);
  assert.equal(await page.locator('.resident-row').count(),0);
  const checkCounts=async()=>{
    const w=await state(page);
    for(const def of characterDefinitions){
      const counts=await page.locator(`[data-dwarf-count^="${def.id}:"]`).allTextContents();
      assert.equal(counts.reduce((n,c)=>n+Number(c),0),w.agents.filter(a=>a.type===def.id).length);
    }
  };
  await checkCounts();
  await page.locator('[data-dwarf-count="miner:idle"]').click();
  await page.locator('.resident-row summary').click();
  await panel(page,'Locate worker');
  assert.match(await page.locator('#unit-inspection').textContent(),/Health/);
  await page.locator('[data-dwarf-count="miner:combat"]').click();
  assert.equal(await page.locator('.resident-row').count(),0);
  await page.evaluate(async()=>{
    const api=window.strongholdDev;
    for(const a of api.state().agents)api.command({kind:'needs',id:a.id,hunger:.1,energy:.1});
    await api.advance(1);
  });
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-dwarf-count$=":needs"]')].some(b=>Number(b.textContent)>0));
  await checkCounts();
  await page.locator('[data-dwarf-role="stonehand"]').click();
  const detail=await page.locator('#residents-list').textContent();
  assert.match(detail,/No food, beds, wages or training/);
  assert.doesNotMatch(detail,/Energy|Meals|Level/);
  await page.locator('.population-details > summary').click();
  assert(await page.locator('#reopen-morale').isVisible());
  await page.setViewportSize({width:800,height:720});
  assert(await page.locator('.dwarf-activity').evaluate(e=>e.scrollWidth<=e.clientWidth));
}
async function pricing(page){
  await load(page,'economy');await panel(page,'Spells');
  const cast=page.locator('[data-spell="summon-stonehand"]');
  assert.equal(await page.locator('[data-research="summon-stonehand"]').count(),0);
  const initial=await state(page);
  for(const price of [50,75]){
    assert.match(await cast.getAttribute('title'),new RegExp(`· ${price} gold ·`));
    await cast.click();
  }
  const after=await state(page);
  assert.equal(after.agents.length,initial.agents.length+2);
  assert.equal(after.spent-initial.spent,125);
  assert.match(await cast.getAttribute('title'),/· 100 gold ·/);
  await page.evaluate(()=>window.strongholdDev.load('stronghold'));await panel(page,'Spells');
  assert.match(await cast.getAttribute('title'),/· 125 gold ·/);
  assert.match(await page.locator('#summon-stonehand-status').textContent(),/No food, beds or wages/);
  await configure(page,{'Economy & world':{'tuning.minerMinimumCost':80,'tuning.minerCostStep':40}});
  await panel(page,'Spells');
  assert.match(await cast.getAttribute('title'),/· 200 gold ·/);
  const before=(await state(page)).spent;await cast.click();
  assert.equal((await state(page)).spent,before+200);
  assert.match(await cast.getAttribute('title'),/· 240 gold ·/);
  assert(await cast.isDisabled());
}
async function stats(page){
  await load(page,'room-lab');
  await page.evaluate(()=>{
    const api=window.strongholdDev;
    api.command({kind:'spawn',type:'miner'});
    const a=api.state().agents[0];
    api.command({kind:'raider',spawn:{x:a.x,z:a.z},target:{x:a.x,z:a.z}});
  });
  let injured=(await state(page)).agents[0];
  for(let i=0;i<20&&injured.health===injured.maxHealth;i++){
    await page.evaluate(()=>window.strongholdDev.advance(.1));injured=(await state(page)).agents[0];
  }
  assert(injured.health>0&&injured.health<injured.maxHealth);
  const missing=injured.maxHealth-injured.health;
  await configure(page,{'Miner levels':{'dwarf.miner.level.1.health':120}});
  const updated=(await state(page)).agents[0];
  assert.equal(updated.maxHealth,120);assert.equal(updated.health,120-missing);
  await page.evaluate(()=>{
    const api=window.strongholdDev;api.load('room-lab');
    api.command({kind:'build',room:'training',points:[{x:8,z:8}]});
    api.command({kind:'spawn',type:'warrior'});
  });
  await configure(page,{'Warrior levels':{'dwarf.warrior.level.2.trainingSeconds':2}});
  let warrior;
  for(let i=0;i<20;i++){
    await page.evaluate(()=>window.strongholdDev.advance(1));
    warrior=(await state(page)).agents[0];if(warrior.level===2)break;
  }
  assert.equal(warrior.level,2,'Real training updates the sidebar; complete level/combat rules are owned by simulation tests');
  await panel(page,'Workforce');await page.locator('[data-dwarf-role="warrior"]').click();
  const row=characterDefinitions.find(c=>c.id==='warrior').levels[1],text=await page.locator('#residents-list').textContent();
  assert.match(text,/Level 2 \/ 5/);assert(text.includes(`Wage ${row.wage} gold`));
  assert(text.includes(`Base damage ${row.damage} · Interval ${row.attackSeconds}s`));
}
async function models(page){
  await load(page,'character-models');
  const views=await page.evaluate(async()=>{
    const source=await(await fetch('/src/view/scene.ts')).text();
    const {EngineStore}=await import(source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1]);
    const scene=EngineStore.LastCreatedScene,w=window.strongholdDev.state(),result=[];
    for(const type of ['stonehand','miner']){
      const a=w.agents.find(a=>a.type===type),root=scene.getTransformNodeByName(`${type==='stonehand'?'stonehand':'dwarf'}-${a.id}`);
      scene.activeCamera.target.set(a.x,.28,a.z);scene.activeCamera.radius=2;
      scene.activeCamera.alpha=Math.PI*.4;scene.activeCamera.beta=1;scene.render();
      const bounds=root.getChildMeshes().map(m=>m.getBoundingInfo().boundingBox);
      const height=Math.max(...bounds.map(b=>b.maximumWorld.y))-Math.min(...bounds.map(b=>b.minimumWorld.y));
      result.push({type,height,image:document.querySelector('#world').toDataURL('image/png').split(',')[1]});
    }
    return result;
  });
  assert(views[0].height<views[1].height*.65);
  mkdirSync('test-results',{recursive:true});
  for(const view of views)writeFileSync(`test-results/${view.type}-closeup.png`,Buffer.from(view.image,'base64'));
}
const checks={overview,pricing,stats,models},scope=process.argv[2]??'overview';
assert(scope==='all'||Object.hasOwn(checks,scope),'Choose overview, pricing, stats, models or all');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??(process.platform==='win32'?'msedge':undefined)});
try {
  for(const name of scope==='all'?Object.keys(checks):[scope]){
    // A fresh page isolates configuration and viewport changes between checks.
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    try {await checks[name](page);assert.deepEqual(errors,[]);console.log(`PASS workforce ${name}`);}
    finally {await page.close();}
  }
} finally {await browser.close();}
