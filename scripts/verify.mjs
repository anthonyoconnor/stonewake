import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const tests = readdirSync('tests')
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => `tests/${f}`)
  .sort();
const groups = {
  development: ['development', 'movement', 'progression-research', 'defenses', 'food'],
  movement: ['movement', 'mining', 'gold-bags', 'defenses', 'spells', 'rooms'],
  rooms: ['rooms', 'learning-rooms', 'reclaim', 'content-extension', 'food', 'recruitment', 'walls'],
  research: ['progression-research', 'learning-rooms', 'spells', 'development'],
  characters: ['character-levels', 'progression-research', 'learning-rooms', 'spells', 'settings', 'content-extension'],
  defenses: ['defenses', 'spells', 'movement', 'development'],
  encounters: ['encounters', 'defenses', 'spells', 'development'],
  economy: ['economy', 'recruitment', 'gold-bags', 'reclaim', 'development'],
};
const args = process.argv.slice(2),
  watch = args.includes('--watch');
const scope = args.find((a) => !a.startsWith('--')) ?? 'changed';

// Follow local TS imports to select checks for changed dependencies; unknown files
// fall back to the full suite. No hand-maintained source-to-test map is required.
function dependencies(file, seen = new Set()) {
  const absolute = resolve(file);
  if (seen.has(absolute)) return seen;
  seen.add(absolute);
  for (const match of readFileSync(absolute, 'utf8').matchAll(
    /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g,
  )) {
    if (!match[1].startsWith('.')) continue;
    const target = resolve(dirname(absolute), match[1]);
    const found = [target, `${target}.ts`, `${target}/index.ts`].find(
      (p) => existsSync(p) && p.endsWith('.ts'),
    );
    if (found) dependencies(found, seen);
  }
  return seen;
}
function changedFiles() {
  const git = (...arguments_) => {
    const result = spawnSync('git', arguments_, { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || 'Cannot read Git changes.');
    return result.stdout.split('\0').filter(Boolean);
  };
  return [
    ...new Set([
      ...git('diff', '--name-only', '-z', 'HEAD'),
      ...git('ls-files', '--others', '--exclude-standard', '-z'),
    ]),
  ];
}
function select() {
  if (scope === 'all') return tests;
  if (Object.hasOwn(groups, scope)) return tests.filter((t) => groups[scope].includes(t.slice(6, -8)));
  if (scope !== 'changed') {
    const matching = tests.filter((t) => t === scope || t === `tests/${scope}.test.ts`);
    if (!matching.length)
      throw new Error(
        `Unknown scope ${scope}. Use changed, all, ${Object.keys(groups).join(', ')}, or a test filename.`,
      );
    return matching;
  }
  const changed = changedFiles();
  if (!changed.length) return tests;
  const graphs = new Map(tests.map((t) => [t, dependencies(t)]));
  const selected = new Set();
  for (const file of changed) {
    if (/\.(md|png|jpg)$/.test(file)) continue;
    const affected = tests.filter((t) => graphs.get(t).has(resolve(file)));
    if (!affected.length) return tests;
    affected.forEach((t) => selected.add(t));
  }
  return [...selected].sort();
}
function run(label, arguments_) {
  console.log(`\n${label}`);
  const start = performance.now();
  const result = spawnSync(process.execPath, arguments_, { stdio: 'inherit' });
  console.log(
    `${label}: ${result.status === 0 ? 'PASS' : 'FAIL'} (${((performance.now() - start) / 1000).toFixed(1)}s)`,
  );
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
try {
  const selected = select();
  console.log(
    `Scope: ${scope}. Checks: ${selected.map((t) => relative('tests', t)).join(', ') || 'documentation only'}`,
  );
  if (args.includes('--list')) process.exit(0);
  run('Typecheck source and tests', ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.tests.json']);
  if (selected.length) run('Simulation checks', ['--test', ...(watch ? ['--watch'] : []), ...selected]);
  if (args.includes('--browser')) run('Browser checks', ['scripts/browser-smoke.mjs']);
  if (args.includes('--production')) {
    run('Production build', ['node_modules/vite/bin/vite.js', 'build']);
    run('Production isolation check', ['scripts/browser-smoke.mjs', '--production']);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
