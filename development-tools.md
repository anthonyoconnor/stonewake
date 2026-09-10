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

**Debug → Before & after** directly opens **Characters**, **Terrain & rooms**, or **Spells, traps & Hearthstones**. **Back to comparison** restores the current studio controls after opening another panel without reloading the world or resetting its camera and preview. These display rooms use their own preview controls; simulation advancement, resident diagnostics and test-actor setup are omitted there.

Debug also groups current-world tools and explicitly shared session settings. **Debug → Test harnesses** contains fresh test-world launchers and **Additional test scenarios**, grouped by purpose with readable names. The selector retains its `Development scenario` label, stable scenario values and **Load scenario paused** action for existing workflows. Every harness/layout starts paused. Gameplay test panels expose Pause/Resume and Return to stronghold; comparison panels keep Return to stronghold and their preview controls. Returning restores the retained stronghold and its prior pause state. Step and Advance controls in gameplay harnesses leave the test paused. Restart stronghold is only offered in the ordinary game. Numbers and diagnostic text stay in the left sidebar.

Make all dwarfs tired/hungry sets every resident to 10% energy/food (adding Miners only if empty). Build a reachable Dormitory/Kitchen and resume to observe recovery. Add test dwarf bypasses natural arrival requirements and reports a missing spawn square. `node scripts/debug-browser.mjs` verifies menu separation, paused harnesses, return, stepping and needs setup.

## Shared scenarios

**Debug → Level preview** inspects the current world, registered playable starting layouts, independent pre-overhaul comparisons and the authoring-shapes fixture without revealing gameplay tiles. It shows hidden terrain, living enemies and encounter sources, and pauses play until closed. **Load full level** opens a fully revealed 3D copy with all enemy models visible, paused simulation and Return to stronghold. Named levels use their normal starting crew/economy; the current-world option copies the current state. Run `npm run verify -- level-preview --browser=level-preview` for focused world-isolation and visual/input/state checks, or add `--browser=level-preview` to a verification scope. `node scripts/level-preview-browser.mjs --authoring` selects the authoring fixture's shape, picking and normal/reverse-angle review. Captures remain in `test-results/level-preview/`.

The [preview definitions](src/content/level-preview.ts) and [UI](src/ui/level-preview.ts) share Campaign, Standalone, Before overhaul and Authoring groups. The twelve independent `baseline-<playable-id>` snapshots in [level-baselines.ts](src/content/level-baselines.ts) preserve the original geometry without importing current maps. They and the [authoring-shapes fixture](src/content/level-authoring-fixture.ts) have no campaign/Free Play session identity and cannot enter the ordinary catalog. The fixture uses real mining, construction and ruin reclamation with all six local environment kinds.

Factories live in [scenarios.ts](src/content/scenarios.ts) and are used by the controller in both Node and the browser. The ordinary visual-showcase button also shares its resident, stock and job setup.

Room fixtures use tile-based service capacity. Kitchens need no initial food stock, and cosmetic furnishings never determine whether a test room works.

| Scenario | Purpose |
|---|---|
| `stronghold` | First area of the five-area authored campaign, with normal crew/economy and onward travel |
| `room-lab` | Empty claimed room studio; construct through normal commands |
| `showcase` | Room geometry, residents, needs, crafting and research |
| `defenses` | Existing manufactured defenses and raider yard |
| `spells` | Existing prepared-spell and Warrior combat yard |
| `combat` | Selectable hound/specialist matchups, regional enemy groups and optional supplied support |
| `lighting` | Furnished lighting harness, pointer/source controls, comparison and sealed fog boundary |
| `graphics-gallery` | Sixteen original/current resident and enemy pairs with synchronized animation playback |
| `terrain-comparison` | Original/current terrain and all six rooms across five biome palettes |
| `arcana-gallery` | Thirteen starting/refined spell, trap and Hearthstone pairs; state playback, close inspection and saved concept art |
| `crowded-kitchen` | Six hungry miners sharing food and accommodation |
| `research-interruption` | Runesmith, queued research, food and beds; interrupt via needs or research pause |
| `stonehands` | Three mechanical workers using the same terrain work yard; no living support requirements |
| `miner-work` | Three supported Miners, marked gold/gems and earth, loose gold and wall plans; shared work allocation and resource coverage |
| `locked-door-hauling` | Loose gold across a locked door; verify failure then resume by changing door mode |
| `encounters` | Hidden camp beyond a mineable gate, warned entrance waves, real traps/Warriors, source clearing and repeat rules |
| `economy` | One resident of each type, spare support, first payday at 10 seconds and treasury access controlled by one door |
| `hearth` | Defended mineable approach to a hidden onward stone; physical activation and local success |
| `hearth-defeat` | Same gate/encounters with fewer supplied defenses; natural core destruction |
| `crossings` | Ordinary starting economy; paid worker-built water/lava crossings to the onward Hearthstone, plus an unbridgeable chasm |
| `morale` | All four supported types behind a lockable treasury/exit route; reclaim support, recover or test departures |

Room construction uses normal validation, furnishing and costs, including the free-room flag. Explicit test allowances, prepared charges, needs and initial stock are fixture setup. They are not gameplay rewards. Add a new named factory for a useful reproduction instead of copying its setup into a browser script and a separate test.

The typed [command union](src/dev/controller.ts) supports `bridge`, `remove-bridge`, `build`, `reclaim`, `dig`, `wall`, `free-build`, `arrivals`, `spawn`, `needs`, `craft`, `research`, `pause-research`, `cast`, `place-defense`, `remove-defense`, `door`, `raider`, `enemy`, `buy-miner`, `advance-encounter` and `activate-hearth`. Purchases use normal support/price/arrival checks. Encounter timer advancement retains discovery, warning duration and physical route checks. Construction, research, spells and defenses call their real services. Spawn/needs commands are explicit test setup. Activation requests use actual discovery, movement and security rules. Ended areas reject mutation commands; load/restart remains available. There is no generic arbitrary-state mutation command.

## Verify a change

Use the smallest check that covers the change. A test script is not a prerequisite for every edit.

| Change | Routine verification |
|---|---|
| Documentation only | Review the text and links; no executable checks |
| Small logic or balance change | Relevant simulation tests and one source/test typecheck |
| UI or rendering change | Add only the relevant browser check; simulation tests if logic changes |
| Major integration or milestone | Full simulation suite, relevant integration/visual browser checks and production build/isolation |

```sh
npm test                              # Same focused default as npm run verify
npm run verify -- pricing             # Pricing/construct + settings tests; one typecheck
npm run verify -- miner-work-pool      # One regression file; one typecheck
npm run verify -- work --browser=work  # Terrain priorities, resources, escape and normal starting crew
node scripts/camera-browser.mjs       # Focused viewport-edge input regression
npm run verify -- pricing --browser   # Add only the pricing UI check
npm run verify -- workforce --browser=workforce
npm run verify -- verification --list # Preview without running anything
# Major integrations/milestones only:
npm run verify -- all --browser=integration --production
```

The default `changed` scope considers uncommitted changes. Clean trees and documentation-only changes do nothing. Changed test files select themselves; other TypeScript edits follow local test imports. If shared dependencies select more than six files, or a change is outside that graph, the runner prints the candidates and asks the developer/agent to choose a focused scope or explicitly choose `all`. It never silently falls back to the full suite. Resolve that choice from task context without asking the user. Changed JavaScript tools receive syntax checks. New behavior still needs relevant tests or a targeted manual check; an empty automatic selection is not evidence that it works.

Scopes live in [verification.ts](scripts/verification.ts): audio, habitats, ruins, balance (full paid campaign routes and recurring-pressure recovery), standalone, level-overhaul, work, pricing, workforce, characters, economy, movement, rooms, research, defenses, enemies, encounters, hearth, morale, campaign, bridges, development and verification. Any test filename also works. Explicit scopes check committed code too. `npm run test:all` runs every simulation/tooling test without typechecking; `npm run verify -- all` adds one typecheck.

Browser checks are opt-in and independently selectable with `--browser=<name>`. The current names are registered in [verification.ts](scripts/verification.ts); they include subsystem checks plus `debug`, `level-preview`, `graphics-gallery`, `terrain-comparison`, `room-overhaul` and `arcana`. A bare `--browser` uses the explicit scope name when a matching browser check exists; it never substitutes a generic smoke check. `integration` runs startup smoke, interface, notifications and campaign checks sequentially. The `ruins` browser check covers real canvas inspection and locked-plan details; `animation` covers real work/contact, enemy cleanup and reduced motion. Other subsystem browser scripts remain explicit tools for their owning changes.

The consolidated workforce browser script replaces the old dwarfs, characters, Stonehands and summon-miner scripts:

```sh
node scripts/workforce-browser.mjs overview # Roster counts, filters, needs, details and locate
node scripts/workforce-browser.mjs pricing  # Creation charges, configuration and affordability only
node scripts/workforce-browser.mjs stats    # Injury-preserving stats and one real training level/UI update
node scripts/workforce-browser.mjs models   # Stonehand/Miner silhouettes and close-up renders
node scripts/workforce-browser.mjs all      # Explicitly run all four, sequentially
```

Complete progression, combat XP, support and price rules belong in simulation tests. Browser checks verify their UI integration without repeating every simulation case. General research/casting is owned by interface/spell checks, not pricing checks. Full pose sweeps remain in `scripts/character-visuals-browser.mjs` for animation changes and milestones. Startup smoke only checks initialization, controls and one simulation step; deeper development-tool checks belong to the development tests and debug browser script.

Keep `npm run dev` running for browser checks (default port 5173; override with `GAME_URL`). They launch a separate headless browser and never attach to a player tab. Windows defaults to Edge; use `BROWSER_CHANNEL=chrome` for Chrome. Other platforms use Playwright Chromium. Run browser workloads one at a time and hold source edits during a run to avoid reloads. Screenshots remain in ignored `test-results/`; capture them when useful for changed visuals.

`--production` explicitly builds with Vite after the single typecheck, then starts temporary preview port 4179 to verify that development controls are absent. Do not also run `npm run build`. Standalone `npm run build` still checks source types for people invoking it directly. Build/config/dependency changes may warrant production verification; ordinary numeric edits do not.

`npm run test:watch -- <scope>` runs one initial typecheck and watches the selected tests. Restart when changing scope, and rerun typecheck after TypeScript edits. Use watch separately from browser/production flags. Once relevant checks pass, repeat or broaden only for a new edit, failure or unresolved concern.


## Failures and ownership

Use `run`, `until` and `rect` from [test helpers](tests/helpers/simulation.ts). `until(world, predicate, seconds, label)` throws a diagnostic snapshot on timeout with actor jobs, routes, access, reservations, orders and recent events. Specific conservation or geometric assertions should remain in their owning tests.

Tracing is opt-in via `enableDiagnostics(world)`, controller setup or stepping helpers. A WeakMap keeps it separate from gameplay state and bounded to 300 events per world. An inspector combines recorded decisions with current facility-access checks; the latter are current conditions, not a historical reconstruction. Normal production simulation does not allocate a history.

| Concern | Owning module |
|---|---|
| Campaign order, briefings and cumulative availability | [campaign.ts](src/content/campaign.ts) |
| Campaign geometry assembly | [campaign-levels.ts](src/content/campaign-levels.ts), with one `campaign-*.ts` definition per area |
| Free Play metadata and independent starting catalogs | [playable-levels.ts](src/content/playable-levels.ts), with `standalone-*.ts` geometry modules |
| Shape/ruin transforms and example paid settlement/route plans | [level-authoring.ts](src/content/level-authoring.ts), [level-play-plans.ts](src/content/level-play-plans.ts) |
| Local presentation regions and palettes | [environment-regions.ts](src/content/environment-regions.ts), [environment-visuals.ts](src/content/environment-visuals.ts) |
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
| Current furnishing geometry | [room-furnishing-models.ts](src/view/room-furnishing-models.ts), [room-furnishing-detail.ts](src/view/room-furnishing-detail.ts) |
| Original/fallback furnishing geometry | [furnishing-models.ts](src/view/furnishing-models.ts) |

New job execution must satisfy the exhaustive handler table. Preserve the explicit scheduler priority when adding selection rules, and cover validation, cancellation and earned progress. Scene mesh lifecycle remains in `scene.ts`; drawing geometry does not mutate simulation state. These are ordinary modules, not a plugin or entity framework.

`node scripts/milestones-browser.mjs` verifies actual sidebar purchases, physical wages, blocked/restored treasury access, hidden camps, raid warnings and combat/source repeat behavior. Pass `m10` or `m13` to run one section. Screenshots remain in ignored `test-results/`.


`node scripts/hearth-morale-browser.mjs` verifies hidden objective discovery, contested physical activation, local success, natural core defeat, frozen actions and same-area restart, plus transient needs, late wage recovery, grouped/dismissed warnings, blocked departures and population/resource accounting. Pass `m11` or `m14` for one section. Screenshots go to ignored `test-results/`.

## Enemy, campaign and presentation checks

- `enemy-roster` is the supplied five-gallery enemy test yard. The development scenario selectors `region-upper`, `region-fungal`, `region-ancient`, `region-crystal` and `region-volcanic` retain compact legacy settlements with hidden regional pairs and normal starting crew/gold. Those factories are separate from the redesigned Free Play entries with the same stable catalog IDs; use the ordinary menu or full-level preview to inspect the catalog maps.
- `character-models` shows the current character roster on clear floor for comparing silhouettes and equipment. Use `showcase` for actual work/needs and `spells` for combat.
- `npm run verify -- enemies` selects enemy/encounter/combat regression checks; `npm run verify -- campaign` selects campaign, objective and crossing checks.
- `node scripts/enemies-browser.mjs`, `node scripts/campaign-browser.mjs`, `node scripts/interface-browser.mjs`, `node scripts/environment-browser.mjs --profile` and `node scripts/character-visuals-browser.mjs` cover the new systems. Run browser workloads one at a time and hold source edits during a run to avoid HMR resets. Environment profiling takes settled frame samples after warm-up.
- The development `enemy` command accepts `type`, `spawn` and `target` and calls actual enemy placement; the harness also has a named species selector. Campaign travel/restart checks use the ordinary sidebar actions. All screenshots/reports stay in ignored `test-results/`.

Stonehand verification: `node --test tests/stonehands.test.ts`, `node scripts/miners-browser.mjs --stonehands`, and `node scripts/workforce-browser.mjs pricing`. The Character Model Studio includes Stonehand and retained Miner silhouettes side by side.

`node scripts/workforce-browser.mjs models` verifies the smaller silhouette against the retained Miner, captures close-up renders; construct-only details are checked by overview mode.

## Cave Hound checks

The `cave-hounds` scenario uses a normally priced four-place Dormitory, automatic arrivals and a partly unexplored bent tunnel. Run `npm run verify -- security --browser=security` for continuous patrol, exploration through new excavation, shared threat response, melee/ranged worker escape, safe return to work and related movement/combat regressions. `node scripts/hounds-browser.mjs` separately covers regular arrivals, Dormitory expansion, warning dismissal/build action/clearing/reopening, patrol, sidebar and quadruped rendering. Both animal concept sheets are saved; only Cave Hounds are implemented.

Notification changes use `npm run verify -- notifications --browser=notifications`. The focused browser flow covers real first arrivals, combat and Hearth warnings, dismissal/history/source actions, hidden origins, content-only extensions, overlay input isolation and compact rail overflow. Captures are in ignored `test-results/notifications/`; existing interface, hound and morale flows use the same notification controls.

The **Combat test room** is directly available in Test harnesses. Select defenders, a species or mixed regional group, and optional supplied traps/prepared spells; Load / reset matchup rebuilds it paused. Rooms returns to its matchup controls after inspecting units or casting spells. Results and normal costs are in the sidebar. Run `npm run verify -- combat --browser=combat`. Shared factory: `combat`.

The **M33 lighting test room** opens directly from Test harnesses or `?scenario=lighting&paused=1`. Its ordinary room construction respects the free-building flag; the test allowance, sample residents/enemies and completed crossing decks are explicit fixtures. Use the sidebar comparison, light sliders and preset views without advancing simulation, or resume to observe actual work. Reset restores the lighting defaults, and Return to stronghold disposes experimental lights and restores the previous renderer. Run `npm run verify -- lighting --browser=lighting` for room capacity/access/furnishing checks and pointer tracking, UI suppression, fog preservation, compact controls and reset/return. Captures and reports go to ignored `test-results/m33/`.

For static scene visibility changes, use `node scripts/lighting-browser.mjs --candidates`. This adds default-versus-cached active mesh and fog instance parity across camera changes, discovery, a visible resident's arrival/death/disposal and world replacement. It also checks that real glow-enabled stationary frames reuse static visibility. The ordinary lighting, pointer and restoration checks still run. These paused presentation fixtures verify rendering behavior, not paid recruitment or combat balance.

## Campaign and presentation integration

`npm run verify -- campaign` checks availability, authored layouts and bridges. `npm run verify -- balance` runs the full intended/alternate paid campaign, normal loss recovery, Library reuse, natural defeat and prolonged volcanic raids with paid source suppression. The shared player-action driver is `scripts/helpers/campaign-route.ts`; it grants no gold, units, discoveries, prepared charges or timer shortcuts. The browser campaign check uses that driver and the normal sidebar travel actions through all five stages.

`npm run verify -- audio --browser=audio` checks original procedural cues, activation, volume/mute and restart/pause cleanup; recordings go to ignored `test-results/m30/`. `--browser=animation` selects character work/contact/pausing and ten-enemy gallery checks. Current rendering rules live in [graphics.md](graphics.md); dated performance samples and artifact records live in the archive. Browser workloads are serial; freeze every imported TypeScript file, including the shared route helper, while they run.

## Level redesign review

`npm run verify -- level-overhaul` adds both paid routes through all seven standalone maps to the campaign integration checks. `npm run verify -- standalone` selects their layout, paid-route and restart checks. Editable settlement footprints, approaches, source-suppression branches and optional route-specific defenses live beside their map definitions. `src/content/level-play-plans.ts` owns the shared plan types, registry and starter blueprint; the campaign and standalone assembly modules register each map's plan. The driver buys services, crafts defenses, researches and casts spells, and physically reaches and activates the onward stone through ordinary gameplay.

```sh
node scripts/level-route.ts campaign-crystal-divide intended
node scripts/level-route.ts campaign-crystal-divide alternate
node scripts/level-route.ts region-upper alternate 2400
node scripts/level-overhaul-browser.mjs --level=campaign-crystal-divide --play
node scripts/level-overhaul-browser.mjs --level=region-upper --approach=alternate --play
node scripts/level-overhaul-browser.mjs --standalone --approach=alternate --play
node scripts/level-overhaul-browser.mjs --level=region-fungal,region-ancient --discovery-only
node scripts/level-overhaul-browser.mjs --level=region-crystal --discovery-only --explore=31,25:31,31:29,31
node scripts/level-overhaul-browser.mjs --level=campaign-royal-deep --profile
node scripts/level-overhaul-browser.mjs --layouts-only
node scripts/level-overhaul-browser.mjs --level=campaign-fallen-city --dressing
```

The single-map Node runner starts the requested catalog entry through normal `startFreePlay` and accepts an optional third argument for the simulation time limit. Its reports go to `test-results/level-overhaul/routes/` and include support, discovery, hostile contact, hauling, source suppression and victory times, losses/replacements, needs journeys and departures. Haul records include origin, destination, cargo and journey time; `postLaunchHaul` is the first delivery after opening the route and may still carry local gold. Use the recorded locations when assessing remote supply. Use this runner while authoring one map instead of replaying unrelated levels. Starting a campaign-marked map independently does not test research carryover; use the full campaign flow for travel and arrival knowledge. Intended/alternate identify authored action examples, not a promise that one always finishes faster.

The consolidated browser accepts `--level=<catalog-id>` or comma-separated IDs and `--approach=intended|alternate`; omit the level to review the whole catalog, or use `--standalone` for the seven non-campaign entries. The default review captures independent before/after maps with one neutral palette, checks an ordinary paid start, and verifies camera controls, minimap/full-map behavior, fog concealment and tile picking. `--play` adds an actual expedition with first-discovery, developed service, shoreline and objective views at normal and reverse angles, followed by physical activation and UI restart. `--discovery-only` follows the same paid actions until a water, lava or chasm bank is naturally visible, captures both angles, then stops; completion needs separate route evidence. `--layouts-only` emits only neutral comparisons. `--dressing` uses a separately labeled revealed preview for short dry-workings/masonry presentation checks; those captures are not paid-route evidence. Reports record runtime, failed-request and HTTP errors alongside screenshots under `test-results/level-overhaul/`. `npm run verify -- level-overhaul --browser=level-overhaul` combines simulation coverage with the default catalog browser review.

For a natural feature on an optional branch, `--discovery-only --explore=x,z:x,z` adds ordinary excavation waypoints after normal preparation. It still relies on workers and scouting to reveal the bank, and is separate from the completed objective route. Choose a fresh `VISUAL_FOLDER` when retaining several reviews of the same map.

`--profile` includes the full paid expedition and compares copies of its developed world with local regions present and removed, in that order and then reversed. Each copy starts with identical map, rooms, population, fog, jobs and camera. It warms the renderer for 90 paused frames, then measures 15 seconds of live simulation, recording hardware, scene workload, frame timing, geometry revisions and simulation advancement. A separate CPU sample follows the timed windows; `--no-cpu-profile` skips that sample. The original paid world is restored before activation/restart. This comparison measures the marginal cost of local atmosphere on the current map; evaluating the total cost of enlarged maps requires a separate matched baseline.

The full profile saves its developed world with nonfinite numeric values preserved. For a renderer change, pass that same JSON file through `--profile-world=<path>` with one selected level and `--profile --no-cpu-profile`. This skips the expedition and restores the identical developed workload for before/after timing. Snapshot restoration is performance evidence only; it does not verify a changed map's paid route, victory or restart. Keep both the original fixture and its report when comparing code revisions.

`--cpu-profile-only` requires `--profile --profile-world=<path>` and skips the timing comparison. It warms that restored scene for 90 paused frames, then records ten seconds of live CPU samples. Profiling overhead and scheduling can extend the observed wall time; do not treat this diagnostic trace as an ordinary frame-rate measurement.

Use `VISUAL_FOLDER` for a separate browser output directory. Keep other browser and CPU-heavy checks idle when profiling. Review the actual images and route tradeoffs against [level overhaul acceptance](level-overhaul.md#acceptance-and-evidence-for-every-redesigned-level): successful automation or generated images alone do not establish geographic identity, useful scale or readable atmosphere. Dated conclusions and retained limits belong in milestone history. Shape or region changes can start with focused `level-authoring` or `environment-regions` test filenames before their relevant visual review.
