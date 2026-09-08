import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {planChecks,browserChecks} from '../scripts/verification.ts';

test('clean and documentation-only changes schedule no executable checks',()=>{
  for(const files of [[],['README.md','characters.md','concept-art/stonehands/stonehands-v2.png']]){
    const plan=planChecks('changed',files);
    assert.deepEqual(plan.tests,[]);assert.deepEqual(plan.syntax,[]);
    assert.equal(plan.typecheck,false);assert.equal(plan.needsScope,false);
  }
});
test('a changed test or browser script stays focused, including Windows paths',()=>{
  const testPlan=planChecks('changed',['tests\\stonehands.test.ts','README.md']);
  assert.deepEqual(testPlan.tests,['tests/stonehands.test.ts']);assert(testPlan.typecheck);assert(!testPlan.needsScope);
  const script=planChecks('changed',['scripts/workforce-browser.mjs']);
  assert.deepEqual(script.tests,[]);assert.deepEqual(script.syntax,['scripts/workforce-browser.mjs']);assert(!script.typecheck);
});
test('shared dependencies and unmapped changes require a scope instead of silently running everything',()=>{
  const shared=planChecks('changed',['src/content/tuning.ts']);
  assert(shared.tests.length>6);assert(shared.needsScope);
  const unknown=planChecks('changed',['package.json']);
  assert(unknown.needsScope);assert.deepEqual(unknown.tests,[]);assert.deepEqual(unknown.unresolved,['package.json']);
  const selected=planChecks('pricing');
  assert.deepEqual(selected.tests,['tests/settings.test.ts','tests/stonehands.test.ts']);assert(!selected.needsScope);
  assert(!planChecks('all').needsScope);
});
test('browser scopes point to existing targeted checks; list never launches verification',()=>{
  for(const commands of Object.values(browserChecks))for(const [file] of commands)assert(existsSync(file),file);
  assert.deepEqual(browserChecks.pricing,[['scripts/workforce-browser.mjs','pricing']]);
  const preview=spawnSync(process.execPath,['scripts/verify.mjs','pricing','--browser','--list'],{encoding:'utf8',windowsHide:true});
  assert.equal(preview.status,0,preview.stderr);
  assert.match(preview.stdout,/Browser: pricing/);assert.match(preview.stdout,/Production build: none/);
  assert.doesNotMatch(preview.stdout,/PASS|FAIL|Browser: scripts\//);
  const invalid=spawnSync(process.execPath,['scripts/verify.mjs','all','--browser'],{encoding:'utf8',windowsHide:true});
  assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/Choose --browser=/);assert.equal(invalid.stdout,'');
});
