# Fast development workflow

The development interface, scenarios and diagnostics support repeatable agent-driven checks. They use the same simulation and construction services as gameplay. They do not save games or change production availability.

## Start and reproduce

Keep `npm run dev` running. Open `http://127.0.0.1:5173/?scenario=locked-door-hauling&paused=1` in a separate test browser. A scenario URL starts a fresh, paused world with the current source configuration. Production builds ignore these parameters.

`window.strongholdDev` appears after the development module loads. Browser automation can wait for `window.strongholdDev?.version === 1`. The interface is installed only under Vite's `import.meta.env.DEV`; the production isolation check verifies its absence.

```js
const dev = window.strongholdDev;
dev.load('locked-door-hauling');
await dev.advance(2);
const miner = dev.state().agents.find(a => a.type === 'miner');
dev.inspect(miner.id); // Job, route, facility reservations and recent rejection reasons
const door = dev.state().defenses.find(d => d.type === 'timber-door');
dev.command({kind: 'door', id: door.id, mode: 'closed'});
await dev.advance(30);
dev.inspect(miner.id);
dev.status(); // Scenario, paused/busy state, elapsed simulation time and recent errors
```

`state()` returns a detached world copy. `inspect(id)` returns detailed diagnostics for one resident; `inspect()` returns diagnostics for the settlement. Prefer selecting only the fields needed for the current check instead of printing the full world. `status().errors` retains the last 30 interface/runtime errors, including stack traces when available. Refresh starts a new error history.

`load(id)` resets the selected scenario and pauses it. It retains the current free-construction flag and session tuning. Scenario reproducibility assumes the same configuration and command sequence. Loading a test scenario preserves the ordinary stronghold in memory; the existing Return to stronghold control restores it. Loading `stronghold` explicitly creates a new ordinary world.

`pause()` pauses continuous simulation; `pause(false)` resumes it. `advance(seconds)` always pauses first, uses 0.05-second ticks, rounds upward to a whole tick and accepts 0–600 seconds per call. It yields between batches so rendering stays responsive. Await it before another command/load. Sidebar/world gestures are disabled during advancement. Existing configuration-dialog, hidden-tab and spell-yard pauses still apply to continuous play; explicit advancement runs the requested simulation ticks regardless.

Debug opens current-world tools and explicitly shared session settings. Debug → Test harnesses contains fresh test-world launchers and additional scenarios. Every harness/layout starts paused; the shared Pause/Resume control and Return to stronghold appear on every test panel. Returning restores the retained stronghold and its prior pause state. Step and Advance controls in the harness panel leave the test paused. Restart stronghold is only offered in the ordinary game. Numbers and diagnostic text stay in the left sidebar.

Make all dwarfs tired/hungry sets every resident to 10% energy/food (adding Miners only if empty). Build a reachable Dormitory/Kitchen and resume to observe recovery. Add test dwarf bypasses natural arrival requirements and reports a missing spawn square. `node scripts/debug-browser.mjs` verifies menu separation, paused harnesses, return, stepping and needs setup.

## Shared scenarios

Factories live in [scenarios.ts](src/content/scenarios.ts) and are used by the controller in both Node and the browser. The ordinary visual-showcase button also shares its resident, stock and job setup.

Room fixtures use tile-based service capacity. Kitchens need no initial food stock, and cosmetic furnishings never determine whether a test room works.

| Scenario | Purpose |
|---|---|
| `stronghold` | First area of the two-area campaign, with normal crew/economy and onward travel |
| `room-lab` | Empty claimed room studio; construct through normal commands |
| `showcase` | Room geometry, residents, needs, crafting and research |
| `defenses` | Existing manufactured defenses and raider yard |
| `spells` | Existing prepared-spell and Warrior combat yard |
| `crowded-kitchen` | Six hungry miners sharing food and accommodation |
| `research-interruption` | Runesmith, queued research, food and beds; interrupt via needs or research pause |
| `miner-work` | Three supported Miners, marked gold/gems and earth, loose gold and wall plans; shared work allocation and resource coverage |
| `locked-door-hauling` | Loose gold across a locked door; verify failure then resume by changing door mode |
| `encounters` | Hidden camp beyond a mineable gate, warned entrance waves, real traps/Warriors, source clearing and repeat rules |
| `economy` | One resident of each type, spare support, first payday at 10 seconds and treasury access controlled by one door |
| `hearth` | Defended mineable approach to a hidden onward stone; physical activation and local success |
| `hearth-defeat` | Same gate/encounters with fewer supplied defenses; natural core destruction |
| `crossings` | Ordinary starting economy; paid Miner-built water/lava crossings to the onward Hearthstone, plus an unbridgeable chasm |
| `morale` | All four supported types behind a lockable treasury/exit route; reclaim support, recover or test departures |

Room construction uses normal validation, furnishing and costs, including the free-room flag. Explicit test allowances, prepared charges, needs and initial stock are fixture setup. They are not gameplay rewards. Add a new named factory for a useful reproduction instead of copying its setup into a browser script and a separate test.

The typed [command union](src/dev/controller.ts) supports `bridge`, `remove-bridge`, `build`, `reclaim`, `dig`, `wall`, `free-build`, `arrivals`, `spawn`, `needs`, `craft`, `research`, `pause-research`, `cast`, `place-defense`, `remove-defense`, `door`, `raider`, `enemy`, `buy-miner`, `advance-encounter` and `activate-hearth`. Purchases use normal support/price/arrival checks. Encounter timer advancement retains discovery, warning duration and physical route checks. Construction, research, spells and defenses call their real services. Spawn/needs commands are explicit test setup. Activation requests use actual discovery, movement and security rules. Ended areas reject mutation commands; load/restart remains available. There is no generic arbitrary-state mutation command.

## Verify a change

```sh
npm run verify                       # Typecheck source/tests, select checks from uncommitted changes
npm run verify -- research            # Explicit subsystem
npm run verify -- characters          # Level progression, combat, settings and related services
npm run verify -- movement --browser  # Focused simulation plus browser smoke check
npm run verify -- all --browser --production
```

Scopes: `changed` (default), `all`, `development`, `movement`, `rooms`, `characters`, `research`, `defenses`, `encounters`, `economy`, `hearth`, `morale`, `enemies`, `campaign`, or a test filename such as `gold-bags`. The `characters` group covers level definitions/progression, learning rooms, combat and spells, settings, and additive content. Changed-file selection follows local imports from each test. Unknown dependencies, changes outside that graph, or a clean working tree conservatively run the full suite. Documentation-only changes still typecheck. The printed file list makes selection reviewable.

Add `--list` to inspect the selected tests without running them.

`--browser` uses the running development server, defaulting to port 5173; set `GAME_URL` to use another. `--production` builds and launches a temporary preview on port 4179 to check that the development API, simulation panel and URL scenario overrides are absent, then closes only that preview. It does not stop the development server. Avoid `--watch` with these one-shot browser flags.

Browser checks use a separate headless browser and never attach to an existing player tab. Windows defaults to installed Edge. Set `BROWSER_CHANNEL=chrome` to use Chrome. Other platforms use Playwright Chromium; install it once with `npx playwright install chromium` if needed. Screenshots go to ignored `test-results/`.

`node scripts/rooms-browser.mjs` runs the focused room browser playtest against the same running server and browser settings. It constructs unfurnished single-tile Kitchen, Dormitory and Training Rooms through normal commands, verifies sidebar capacity, autonomous needs, level-1-to-2 advancement and released capacity during cooldown, then checks retraining toward level 3 and the furnished showcase. It uses the same ignored screenshot directory.

`node scripts/miners-browser.mjs` checks resource coverage, distinct mining targets and simultaneous excavation/construction/delivery progress in the shared `miner-work` yard. Use `npm run verify -- miner-work-pool` for focused allocation checks.

Other commands: `npm run typecheck`, `npm run test:watch -- research` and `npm run format -- path/to/changed-file.ts`. Watch runs an initial typecheck and watches the selected tests/dependencies; rerun typecheck after edits and restart the watcher when changing scope. Apply formatting to touched modules rather than making unrelated changes across the repository.

## Failures and ownership

Use `run`, `until` and `rect` from [test helpers](tests/helpers/simulation.ts). `until(world, predicate, seconds, label)` throws a diagnostic snapshot on timeout with actor jobs, routes, access, reservations, orders and recent events. Specific conservation or geometric assertions should remain in their owning tests.

Tracing is opt-in via `enableDiagnostics(world)`, controller setup or stepping helpers. A WeakMap keeps it separate from gameplay state and bounded to 300 events per world. An inspector combines recorded decisions with current facility-access checks; the latter are current conditions, not a historical reconstruction. Normal production simulation does not allocate a history.

| Concern | Owning module |
|---|---|
| Simulation ordering, needs and subsystem ticks | [simulation.ts](src/game/simulation.ts) |
| Character level definitions and provisional statistics | [content/characters.ts](src/content/characters.ts) |
| Character stats, next level, work rate and health-preserving advancement | [progression.ts](src/game/progression.ts) |
| Warrior pursuit/rally and adjacent worker self-defense | [combat.ts](src/game/combat.ts) |
| Explicit job-selection priority | [jobs/selection.ts](src/game/jobs/selection.ts) |
| Shared job acquisition, reservations and release | [jobs/common.ts](src/game/jobs/common.ts) |
| Job validity | [jobs/validation.ts](src/game/jobs/validation.ts) |
| Typed job execution handlers | [jobs/work.ts](src/game/jobs/work.ts) |
| Continuous movement and repathing | [movement.ts](src/game/movement.ts) |
| Spell panel markup, actions and updates | [ui/spells.ts](src/ui/spells.ts) |
| Furnishing geometry | [furnishing-models.ts](src/view/furnishing-models.ts) |

New job execution must satisfy the exhaustive handler table. Preserve the explicit scheduler priority when adding selection rules, and cover validation, cancellation and earned progress. Scene mesh lifecycle remains in `scene.ts`; drawing geometry does not mutate simulation state. These are ordinary modules, not a plugin or entity framework.

`node scripts/milestones-browser.mjs` verifies actual sidebar purchases, physical wages, blocked/restored treasury access, hidden camps, raid warnings and combat/source repeat behavior. Pass `m10` or `m13` to run one section. Screenshots remain in ignored `test-results/`.


`node scripts/hearth-morale-browser.mjs` verifies hidden objective discovery, contested physical activation, local success, natural core defeat, frozen actions and same-area restart, plus transient needs, late wage recovery, grouped/dismissed warnings, blocked departures and population/resource accounting. Pass `m11` or `m14` for one section. Screenshots go to ignored `test-results/`.

## Enemy, campaign and presentation checks

- `enemy-roster` is the supplied five-gallery enemy test yard; `region-upper`, `region-fungal`, `region-ancient`, `region-crystal` and `region-volcanic` are separate normal-rules settlements with hidden regional enemy pairs and onward objectives. They use normal starting crew/gold and no supplied defenders or defenses.
- `character-models` shows the four dwarfs on clear floor for comparing silhouettes and equipment. Use `showcase` for actual work/needs and `spells` for combat.
- `npm run verify -- enemies` selects enemy/encounter/combat regression checks; `npm run verify -- campaign` selects campaign, objective and crossing checks.
- `node scripts/enemies-browser.mjs`, `node scripts/campaign-browser.mjs`, `node scripts/interface-browser.mjs`, `node scripts/environment-browser.mjs --profile` and `node scripts/character-visuals-browser.mjs` cover the new systems. Run browser workloads one at a time and hold source edits during a run to avoid HMR resets. Environment profiling takes settled frame samples after warm-up.
- The development `enemy` command accepts `type`, `spawn` and `target` and calls actual enemy placement; the harness also has a named species selector. Campaign travel/restart checks use the ordinary sidebar actions. All screenshots/reports stay in ignored `test-results/`.
