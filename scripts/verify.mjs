import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planChecks, browserChecks } from './verification.ts';

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const args = process.argv.slice(2), scope = args.find(a => !a.startsWith('--')) ?? 'changed';
function changedFiles() {
  const git = (...args) => {
    const result = spawnSync('git', args, {encoding: 'utf8', windowsHide: true});
    if (result.status !== 0) throw Error(result.stderr || 'Cannot read Git changes.');
    return result.stdout.split('\0').filter(Boolean);
  };
  return [...new Set([...git('diff', '--name-only', '-z', 'HEAD'), ...git('ls-files', '--others', '--exclude-standard', '-z')])];
}
function run(label, command) {
  const started = performance.now();
  console.log(`\n${label}`);
  const result = spawnSync(process.execPath, command, {stdio: 'inherit', windowsHide: true});
  console.log(`${label}: ${result.status === 0 ? 'PASS' : 'FAIL'} (${((performance.now()-started)/1000).toFixed(1)}s)`);
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
try {
  for (const arg of args.filter(a => a.startsWith('--')))
    if (!['--list','--watch','--production','--browser'].includes(arg) && !arg.startsWith('--browser=')) throw Error(`Unknown option: ${arg}`);
  const browser = args.find(a => a.startsWith('--browser='))?.slice(10) ?? (args.includes('--browser') ? scope : undefined);
  if (browser !== undefined && !browserChecks[browser]) throw Error(`Choose --browser=${Object.keys(browserChecks).join('|')}. Browser checks never default to a broad smoke run.`);
  if (args.includes('--watch') && (browser || args.includes('--production'))) throw Error('Use --watch separately from browser/production checks.');
  const plan = planChecks(scope, scope === 'changed' ? changedFiles() : []);
  console.log(`Scope: ${scope}. Simulation: ${plan.tests.join(', ') || 'none'}.`);
  console.log(`Typecheck: ${plan.typecheck || args.includes('--production') ? 'once' : 'none'}. Browser: ${browser ?? 'none'}. Production build: ${args.includes('--production') ? 'yes' : 'none'}.`);
  if (plan.syntax.length) console.log(`Script syntax: ${plan.syntax.join(', ')}`);
  if (plan.needsScope) {
    const reason = plan.unresolved.length ? `Unmapped changes: ${plan.unresolved.join(', ')}.` : `Shared dependencies affect ${plan.tests.length} test files.`;
    console.log(`${reason} Choose a focused scope/test (for example: npm run verify -- pricing), or explicitly choose all. No tests ran.`);
    process.exit(args.includes('--list') ? 0 : 2);
  }
  if (args.includes('--list')) process.exit(0);
  if (!plan.tests.length && !plan.syntax.length && !plan.typecheck && !browser && !args.includes('--production')) {
    console.log('No executable changes to verify. Use an explicit scope to check committed code.');
    process.exit(0);
  }
  for (const file of plan.syntax) run(`Syntax: ${file}`, ['--check', file]);
  if (plan.typecheck || args.includes('--production')) run('Typecheck source and tests', ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.tests.json']);
  if (plan.tests.length) run('Simulation checks', ['--test', ...(args.includes('--watch') ? ['--watch'] : []), ...plan.tests]);
  if (browser) for (const command of browserChecks[browser]) run(`Browser: ${command.join(' ')}`, command);
  if (args.includes('--production')) {
    run('Production build', ['node_modules/vite/bin/vite.js', 'build']);
    run('Production isolation', ['scripts/browser-smoke.mjs', '--production']);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
