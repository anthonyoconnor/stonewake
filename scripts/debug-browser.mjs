import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge'});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');
 await page.waitForFunction(()=>window.strongholdDev?.version===1);
 const debug=()=>page.getByRole('button',{name:'Debug',exact:true}).click();
 await debug();
 assert.equal(await page.getByRole('button',{name:'Room layouts',exact:true}).count(),0);
 await page.getByRole('button',{name:'Pause simulation',exact:true}).click();
 const retained=await page.evaluate(()=>window.strongholdDev.state());
 await page.getByRole('button',{name:'Test harnesses',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Restart stronghold',exact:true}).count(),0);
 for(const name of ['Room layouts','Spell test yard','Defense test yard','Load visual showcase']) {
   await page.getByRole('button',{name,exact:true}).click();
   await page.getByRole('button',{name:'Resume simulation',exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>window.strongholdDev.status().paused),true);
   const elapsed=await page.evaluate(()=>window.strongholdDev.status().elapsed);
   await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>window.strongholdDev.status().elapsed),elapsed);
   await page.getByRole('button',{name:'Resume simulation',exact:true}).click();
   await page.waitForFunction(()=>window.strongholdDev.status().elapsed>0);
   await page.getByRole('button',{name:'Dwarfs',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Return to stronghold',exact:true}).count(),1);
   await page.getByRole('button',{name:'Test harnesses',exact:true}).click();
 }
 await page.getByRole('button',{name:'Return to stronghold',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.strongholdDev.status().paused),true);
 const returned=await page.evaluate(()=>window.strongholdDev.state());
 delete returned.routesChanged;delete retained.routesChanged;
 assert.deepEqual(returned,retained);
 await debug();await page.getByRole('button',{name:'Test harnesses',exact:true}).click();
 await page.getByLabel('Development scenario').selectOption('crowded-kitchen');
 await page.getByRole('button',{name:'Load scenario paused',exact:true}).click();
 await page.getByRole('button',{name:'Test harnesses',exact:true}).click();
 await page.getByRole('button',{name:'Advance 10 seconds',exact:true}).click();
 await page.waitForFunction(()=>!window.strongholdDev.status().busy);
 assert(Math.abs(await page.evaluate(()=>window.strongholdDev.status().elapsed)-10)<1e-6);
 await page.getByRole('button',{name:'Room layouts',exact:true}).click();
 await page.getByRole('button',{name:'Make all dwarfs tired',exact:true}).click();
 assert(await page.evaluate(()=>window.strongholdDev.state().agents.every(a=>a.energy===0.1)));
 mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/debug-harness.png'});
 await page.getByRole('button',{name:'Return to stronghold',exact:true}).click();
 await debug();await page.screenshot({path:'test-results/debug-in-game.png'});
 assert.deepEqual(errors,[]);console.log('PASS: debug separation, all harnesses paused, resume, cross-panel return, retained state, stepping and tired setup.');
} finally {await browser.close();}
