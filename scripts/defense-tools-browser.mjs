import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.GAME_URL??'http://127.0.0.1:5173')+'/?paused=1');
 await page.waitForFunction(()=>window.strongholdDev?.version===1);
 const state=()=>page.evaluate(()=>window.strongholdDev.state());
 const command=c=>page.evaluate(c=>window.strongholdDev.command(c),c);
 const panel=name=>page.getByRole('button',{name,exact:true}).click();
 const load=id=>page.evaluate(id=>window.strongholdDev.load(id),id);
  const clickTile = async (x, z) => {
    const p = await page.evaluate(
      async ({ x, z }) => {
        const source = await (await fetch('/src/view/scene.ts')).text();
        const url = source.match(/from ["']([^"']*@babylonjs_core[^"']*)["']/)[1];
        const { EngineStore, Vector3, Matrix } = await import(url);
        const scene = EngineStore.LastCreatedScene,
          engine = scene.getEngine();
        const p = Vector3.Project(
          new Vector3(x, 0, z),
          Matrix.Identity(),
          scene.getTransformMatrix(),
          scene.activeCamera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
        );
        const r = document.querySelector('#world').getBoundingClientRect();
        return {
          x: r.x + (p.x * r.width) / engine.getRenderWidth(),
          y: r.y + (p.y * r.height) / engine.getRenderHeight(),
        };
      },
      { x, z },
    );
    await page.mouse.click(p.x, p.y);
  };

 await panel('Defenses');
 assert(await page.locator('[data-defense]').evaluateAll(bs=>bs.every(b=>b.disabled)));
 assert.match(await page.locator('[data-defense="spike-trap"]').getAttribute('title'),/Workshop/);
 assert.equal(await page.locator('[data-tool="remove-bridge"],[data-tool="reclaim"],[data-tool="dig"],[data-tool="erase"],.work-tools').count(),0);
 await panel('Rooms');
 const sellPosition=await page.locator('[data-tool="sell"]').evaluate(e=>{const grid=e.parentElement,r=e.getBoundingClientRect(),g=grid.getBoundingClientRect();return Math.abs(r.right-g.right)<2 && e===grid.lastElementChild;});assert(sellPosition,'Sell stays in the last grid cell');
 assert.equal((await page.locator('[data-tool="bridge"]').textContent()).trim(),'');
 assert.equal(await page.locator('[data-tool="bridge"] img').count(),1);
 await load('defenses');await panel('Defenses');
 assert(await page.locator('[data-defense]').evaluateAll(bs=>bs.every(b=>!b.disabled)));
 await page.locator('[data-defense="spike-trap"]').click();await clickTile(13,12);
 let w=await state();assert(w.defenses.some(d=>d.x===13&&d.z===12));
 await page.waitForFunction(()=>document.querySelector('[data-defense="spike-trap"]').disabled);
 await panel('Rooms');await page.locator('[data-tool="sell"]').click();await clickTile(13,12);
 w=await state();assert(!w.defenses.some(d=>d.x===13&&d.z===12));
 await panel('Defenses');
 const workshops=w.tiles.filter(t=>t.room==='workshop');
 await command({kind:'reclaim',points:workshops});
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-defense]')].every(b=>b.disabled));
 await command({kind:'build',room:'workshop',points:[workshops[0]]});
 await page.waitForFunction(()=>!document.querySelector('[data-defense="timber-door"]').disabled);
 await load('crossings');await page.evaluate(()=>window.strongholdDev.advance(15));await panel('Rooms');
 await page.locator('[data-tool="bridge"]').click();await clickTile(10,9);
 w=await state();assert(w.tiles[w.width*9+10].bridgePlanned);
 const spent=w.spent;
 await page.locator('[data-tool="sell"]').click();await clickTile(10,9);
 w=await state();assert(!w.tiles[w.width*9+10].bridgePlanned);assert.equal(w.spent,spent-20);
 await command({kind:'build',room:'kitchen',points:[{x:3,z:7}]});
 await page.locator('[data-tool="sell"]').click();await clickTile(3,7);
 w=await state();assert.equal(w.tiles[w.width*7+3].room,undefined);
 mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/sell-tools.png'});
 assert.deepEqual(errors,[]);console.log('PASS: Workshop/stock gating, direct defense placement, icon-only Bridge, and Sell for fixtures, bridge plans and rooms.');
}finally{await browser.close();}
