# Dwarven stronghold game

A browser-playable, level-based underground management game inspired by Dungeon Keeper. The player reclaims lost dwarven strongholds by excavating terrain, building rooms, supporting autonomous dwarfs, researching spells, and preparing defenses against the creatures below.

The focus is on **layout management**: where to dig, how rooms connect, how far residents travel, and which routes attackers can use to reach the base's Hearthstone.

This repository contains a **TypeScript + Babylon.js browser prototype**, game design documents, AI-generated concept art, and image-generation prompts. Implementation progress is recorded in the development plan. Stonewake is a provisional prototype title.

## What is implemented?

The [current implementation inventory](development-plan.md#current-implementation-status) lists every planned room, structure and dwarf, its availability, and remaining integrations. **M1–M9 completion covers the prototype milestones, not the full design.** Use that inventory for what is added or missing; the catalogs below describe the intended game.

M10 encounters/raids, M11 Hearth defeat/objectives, M13 recruitment/wages and M14 dissatisfaction/departure are implemented. The [remaining roadmap](development-plan.md#remaining-feature-roadmap--m10m19) covers guarding/retreat, door maintenance, more enemies, campaign travel and integrated balance. The Border Foothold has a separate Hearthstone hidden in its northern enemy camp. Discover and physically activate it to complete the area; actual travel to another area remains M18. See [Levels](levels.md#onward-hearthstone-objective).

## Run locally

Use Node.js 24 or later. Run `npm install`, then `npm run dev` and open the local URL printed by Vite. Code and content changes reload automatically. `npm test` runs focused simulation checks, and `npm run build` checks TypeScript and creates a browser build. No account, server backend, or save system is used.

Project-wide development instructions are in [AGENTS.md](AGENTS.md).

For agent-driven iteration, see [Development tools](development-tools.md): shared scenarios, a development-only browser control interface, automatic job diagnostics, and `npm run verify -- <scope>`. `npm run typecheck` checks both source and tests. `npm run verify -- all --browser --production` runs complete simulation, browser and production-isolation checks with the local development server already running.

## Play and iterate

**Excavate is the default cursor action.** Click or drag across unexplored tiles or visible dirt, rock, gold or gems to plan excavation. The first tile sets the whole drag: start unmarked to add marks, or marked to remove them. Existing marks are preserved while adding, and unmarked tiles stay unchanged while removing. Miners find reachable work, clear terrain and claim the floor. Choose a room from the icon grid; its icon, name and current gold cost per square appear above the choices. The world cursor uses the same room icon; a pickaxe marks excavation, a minus clears it, and the normal pointer inspects open floor. Drag claimed squares to build; right-click or Escape cancels the current gesture and returns immediately to excavation. Click an open floor or room to inspect it. The Stone Hearth includes one empty chest holding up to 108 gold, enough to fund a 3×3 Treasure Room. Miners can deliver to it before any Treasure Room is built; expand storage with Treasure Rooms. There is a provisional 400-gold starting allowance. Room capacity comes directly from floor area and a tunable value per square; single tiles, narrow strips and irregular layouts all contribute equally. Furniture is entirely cosmetic and never blocks movement or sight.

Excavation can be planned into darkness. Hidden tiles accept the same marks regardless of their concealed contents. Miners work only discovered, reachable diggable targets; discovery automatically clears marks over existing open space or unmineable terrain. Unexplored plans do not reveal terrain, permit room construction, or grant visibility.

Pan with **WASD** or by moving the mouse to a window edge. Hold **Left Ctrl+A/D** or drag horizontally with the **middle mouse button** to orbit the viewed point at a fixed tilt; **Q/E** also rotates. Both panning methods preserve the camera angle. Zoom with the wheel, and press **Home** to return to the Hearthstone. The minimap also moves the camera. Press **M** or click the expand icon beside the minimap to show the entire map at a larger scale. Click the full map to move the camera and close it, or close with M, Escape or ×. Both maps preserve unexplored terrain and omit the camera overlay. Camera movement does not reveal hidden terrain.

Open **Debug → Test harnesses → Room layouts** to build and inspect implemented rooms with the normal grid tools. Example footprints and the test dwarf catalog make services easy to exercise. **Load visual showcase** creates example rooms with test gold, residents, queued crafting jobs and spell research. All harnesses start paused; click Resume simulation to observe behavior. Click Rooms to return to the studio controls after inspecting Dwarfs; Return to stronghold restores the game you left in memory.

**Free room construction** applies to room creation and expansion in both worlds. Set `VITE_FREE_ROOM_BUILDING=true` in an untracked `.env.local` to enable it on launch, or use the Debug toggle. Production inputs still cost gold. **Restart stronghold** starts a fresh prototype; refreshing also resets the session. After interacting with the game, closing, refreshing or navigating away asks for browser confirmation where supported, protecting against accidental Ctrl+W.

Workshop production is under Rooms or Defenses. In **Defenses → Build defenses**, select a finished item and click clear claimed floor to place it. Doors fit one-square passages between opposite walls. Inspect a door to choose **Open**, **Closed** (automatic dwarf passage), or **Locked** (dwarfs cannot open it). Bolt traps fire along the chosen compass direction; select a facing or press **R** before placement. Spike traps damage and briefly pin enemies. Both trap types reset automatically, without Engineer work or ammunition. **Debug → Test harnesses → Defense test yard** supplies test stock and actual placement/production, with test raiders, a dwarf hauling task, reset and return controls. Full [defense rules and balance](rooms.md#doors-and-traps) are documented.

The Kitchen supports one resident per square provisionally, with no ingredients, stored meals or ale production. Dwarfs still visit to eat. Dormitory floor supplies accommodation; Workshop, Training Room and Library floor supply concurrent working capacity. See [Rooms](rooms.md#placement-and-capacity) for the tunable defaults.

Build a Training Room for autonomous character advancement. Dwarfs start at level 1; each type has explicit health, damage, attack timing, work-speed and training-time values through level 5. Training and successful melee hits share one XP total; combat earns roughly twice the training rate. Each visit ends after one level, releases its slot and starts a personal cooldown. Warriors pursue and rally; workers have weaker adjacent self-defense. See [Character levels](characters.md#character-levels-and-training) for the current rules and provisional balance.

Defenses and Spells share the Rooms menu’s icon grid and selected-item styling. Choose an icon to see its stock or casting cost and controls. Build a Library and choose **Spells → a spell icon → Research** to unlock spells. See [Spells](spells.md) for the catalog and implementation status. Specialists arrive automatically when reachable specialist rooms and spare accommodation/food support them. The Dwarfs panel shows an icon matrix of live activity counts by role. Click a count or role, then expand a dwarf for details and Locate. Expand Pay & wellbeing for wages and support requirements. Summon additional Miners from the Spells grid. Use **Debug → Test dwarf type → Add test dwarf** to exercise registered types. See the [current inventory](development-plan.md#current-implementation-status) for implemented content and remaining work.

Prepared spells enter targeting when you click **Cast**. Click a visible unit or floor point; right-click or Escape cancels. **Debug → Test harnesses → Spell test yard** offers ready charges, test enemies and pause/reset controls for trying effects and autonomous Warrior combat. Health and effect timers stay in the sidebar.

**Spells → Summon Miner → Cast** summons a Miner at the Hearth without research or preparation. Its price is 50 gold plus 25 per living Miner (125 gold with the starting three Miners, then 150). The price decreases when Miners die or depart. Casts need spare reachable Kitchen and Dormitory support and a clear arrival route. Every resident receives wages every 120 seconds from arrival: Miner 4, Engineer 7, Warrior 8 and Runesmith 10 gold. Dwarfs visit a Treasure Room or the starter treasury to collect pay; funds are deducted after a one-second visit. The panel distinguishes missing gold from blocked treasury access and marks payments overdue after a 45-second grace. Shortages receive 120 seconds of grace, then grouped need warnings; another 180 unresolved seconds cause a resident to leave through the Hearth. Restore support or reachable pay before they exit to make them stay. Blocked departures wait for a real route, and carried gold remains in the settlement. Dwarfs shows wellbeing and lets you reopen dismissed warnings.

The ordinary Border Foothold now has a concealed northern camp and an eastern raid entrance. The camp reacts to discovery; the entrance first warns after 360 seconds, then sends a Raider after a 25-second warning if its physical route is open. Defeating the camp clears it. Entrance waves wait until the previous wave is defeated, then repeat after 150 seconds plus a fresh warning; claiming the entrance stops future reinforcements. Threat reports stay in the sidebar and do not reveal hidden source locations. Enemies fight dwarfs, break doors and encounter traps; natural attackers can destroy the 400-health starting Hearth and end the area in defeat.

**Debug → Test harnesses → Additional test scenarios** includes `encounters` (a mineable gate, hidden camp, raiding passage and working defenses) and `economy` (all four types, spare support and a lockable treasury route). These start paused. Debug encounter controls advance timers while preserving actual warning and access rules. `node scripts/milestones-browser.mjs` checks these flows through the browser.

Click the compact **Hearth** button beneath the gold/population totals for core health and the onward objective. After discovery, request activation: an available dwarf must walk beside the stone and secure it for eight uninterrupted seconds. Nearby enemies or urgent needs interrupt work; the request retries automatically. Success and defeat freeze the area, show a sidebar result and offer **Restart area**. The starting base and treasury stay fixed.

Additional scenarios include `hearth` (a defended objective approach), `hearth-defeat` (the same approach without enough supplied defenses) and `morale` (all four types behind a lockable treasury/exit route). `node scripts/hearth-morale-browser.mjs` checks these flows in the browser.

## Hazardous crossings

**Bridge** in the construction tools plans stone bridges over discovered water or lava connected to claimed shore. Miners build them for 20 gold and eight seconds of work per square. Free room construction removes the gold cost. Chasms remain impassable. **Remove bridge** cancels plans or reclaims unoccupied decks when remaining routes and support are preserved. Rooms and fixtures stay on land.

Try **Debug → Test harnesses → Additional test scenarios → crossings** (Emberwater Crossing): normal starting crew, resources and gold, with water and lava between the base and onward Hearthstone. The map is also available at `?scenario=crossings&paused=1` during development. See [bridge rules](rooms.md#bridges-and-hazardous-crossings). Run `node scripts/bridges-browser.mjs` against the local server using `GAME_URL` if needed.

## Code map

| Change | Starting point |
|---|---|
| Level dimensions, openings and resource seams | [Level definitions](src/content/levels.ts) |
| Room prices, footprints, capacity and services | [Room definitions](src/content/rooms.ts) and [room checklist](room-development-checklist.md) |
| Character level statistics, training times, capabilities and recipes | [Characters](src/content/characters.ts), [recipes](src/content/recipes.ts) |
| Door tiers, trap balance, placement and enemy interactions | [Defense definitions](src/content/defenses.ts), [defense simulation](src/game/defenses.ts), [door passage queries](src/game/doors.ts) |
| Work pace, shared needs and jobs | [Tuning](src/content/tuning.ts), [simulation](src/game/simulation.ts), [job selection](src/game/jobs/selection.ts), [job execution](src/game/jobs/work.ts) |
| Construction, tile-based room services, cosmetic furnishing and path access | [Rooms](src/game/rooms.ts), [navigation](src/game/navigation.ts) |
| Prototype meshes, textures and animations | [Scene](src/view/scene.ts), [furnishing models](src/view/furnishing-models.ts), [surfaces](src/view/surfaces.ts), [residents](src/view/residents.ts), [effects](src/view/effects.ts) |
| Sidebar and grid input | [Sidebar](src/ui/sidebar.ts), [selection](src/ui/selection.ts) |
| Repeatable debug examples and automation | [Shared scenarios](src/content/scenarios.ts), [room studio data](src/content/room-lab.ts), [development workflow](development-tools.md) |
| Defense test yard | [Defense yard](src/content/defense-lab.ts) |
| Camps, raid timing and source clearing | [Encounter service](src/game/encounters.ts), [level definitions](src/content/levels.ts), [encounter test tunnels](src/content/encounter-lab.ts) |
| Core damage and onward activation | [Hearth service](src/game/hearth.ts), [Hearth test scenarios](src/content/hearth-lab.ts), [Hearth sidebar](src/ui/hearth.ts) |
| Dissatisfaction, grouped warnings and physical departure | [Morale service](src/game/morale.ts), [Morale test scenario](src/content/morale-lab.ts), [Need warnings](src/ui/morale.ts) |
| Miner prices, arrival eligibility and physical wages | [Recruitment](src/game/recruitment.ts), [wages](src/game/wages.ts), [economy test scenario](src/content/economy-lab.ts) |

The simulation has no Babylon.js or DOM dependency. Focused Node tests exercise discovery, mining, resource conservation, navigation, layout access, needs, free construction and staffed crafting. Graphics remain procedural prototype assets guided by the concepts; see the [graphics pass notes](graphics-pass.md).

## Start here for a new session

1. Read [Game rules](game-rules.md) for the core loop, agreed constraints, and open mechanics.
   Read the [Development plan](development-plan.md) for current implementation status, unfinished milestones, dependencies and iteration guidelines before implementation work. Completed milestones and dated verification are in [Development history](development-history.md); **read it only if past context is required, not during routine startup.** Follow the [room development checklist](room-development-checklist.md) when adding rooms.
2. Read the relevant detailed documents below before changing a system. Each distinguishes agreed direction from proposals and unresolved balance.
3. For visual work, inspect the [approved terrain reference](concept-art/terrain/resource-terrain-v2.png), then the relevant current gallery and its prompt records.
4. Check the working tree and recent Git history before editing. Keep related design documents, gallery links, and prompt records consistent when making changes.

Current design documents define gameplay. Concept art illustrates the direction; incidental details in images or historical prompts do not establish new rules. Follow the user's latest decisions when evolving the design, and update the affected documents so future sessions have the same context.

## Design document map

| Document | What to find there |
|---|---|
| [Game rules](game-rules.md) | Core loop, autonomous control, camera, campaign progression, Hearthstone and defeat, excavation, economy, recruitment, needs, defense, and extensible character/room definitions |
| [Characters](characters.md) | Current dwarf roster, work, recruitment, pay, bedding, food, special facilities, training, and behavior proposals |
| [Spells](spells.md) | Offensive, defensive and individual support spells; research, preparation, gold costs, effects, targeting and implementation limits |
| [Rooms and structures](rooms.md) | Room catalog, purposes and outputs, attraction, arbitrary footprints, automatic furnishings, capacity, floors and wall identity, doors, traps, and reinforcement |
| [Levels and underground contents](levels.md) | Terrain, resources, discovery, hidden spaces, regions and inhabitants, attacks, candidate strongholds, and level-authoring considerations |
| [Gameplay interface](gameplay-interface.md) | Left sidebar, minimap, rooms/defenses/spells/dwarfs panels, selection and camera controls, messages, inspection, and a clear gameplay view |
| [Development plan](development-plan.md) | Current implementation status, unfinished milestones, dependencies, parallel work, completion criteria and known limitations |
| [Development history](development-history.md) | Completed milestones and dated verification records; read only when past context is required |
| [Room development checklist](room-development-checklist.md) | Reusable procedure for adding rooms, shared-system integration, room debug view, and layout/function checks |

## Current scope and constraints

- **Browser play and development:** use TypeScript + Babylon.js. Prioritize fast iteration and extensible characters, levels, rooms, and features. Game saves, multiplayer, and production hardening are outside the current development plan. Commit completed chunks and every milestone. Completed M1–M9, including M5.1, are archived in [Development history](development-history.md), which is only needed for past context; current status, authorization and the unfinished roadmap are tracked in the [Development plan](development-plan.md). Room debugging includes a room catalog with grid-based layout creation and a left-sidebar Debug menu with a free room construction flag.
- **Fresh settlements:** each level starts with a small mining crew and an established Stone Hearth around a dormant Hearthstone awakened during arrival. Other residents are recruited locally. Dwarfs arrive through the Hearthstone's runic connection. Enemies destroy the core to win; it has a fixed location and no upgrades. There is no expedition leader.
- **One terrain layer:** excavation and construction use large square cells. Intact earth, gold-bearing terrain, and bedrock share one full height above a common walkable floor. Bedrock generally forms continuous seams with grid-shaped boundaries. Ordinary unmined earth cells can remain inside an excavation. There are no terraced mining layers or stacked playable floors.
- **Discovery matters:** caves, ruins, passages, and inhabited chambers can already be excavated but remain hidden until breached and seen. Camera movement must not reveal concealed areas.
- **Free movement, indirect control:** dwarfs and enemies move continuously through open space rather than snapping to tile centers. Dwarfs handle work, needs, and fighting autonomously. A call to arms can direct attention to an area; individual movement orders and possession are outside the design.
- **Adaptive rooms:** room footprints can have any grid-based size or shape. Floor area supplies predictable, tunable service capacity. Floors, existing wall treatments and automatic furnishings identify the room visually; furniture never changes capacity, routes or sight.
- **Shared needs and economy:** all dwarfs need wages, beds, food, and appropriate facilities. Miners deliver finite gold-seam yields and renewable, slower gem-column yields to Treasure Rooms; both produce the same gold currency. Dwarfs collect pay there. Bought miners cost more as the current living miner population rises, and the next price falls when that population falls.
- **Clear overhead presentation:** stylized 3D with camera rotation and zoom. Controls and detailed information belong in the left sidebar, with the minimap at its top. The gameplay view has no floating text, numbers, health bars, or progress bars, including on hover or selection. Necessary text can appear in dismissible message cards associated with icons above the question-mark button.
- **Reusable systems:** rooms and dwarf types must remain useful across levels. Future types should fit shared definitions and systems; this is an architecture requirement, not an implemented framework.

The [character catalog](characters.md) defines dwarf roles and their facilities. All dwarfs can train and use shared food and accommodation; shared systems support additional types through editable definitions.

The [room and structure catalog](rooms.md) defines facilities and their functions, including combined services and deferred concepts.

## Concept art and prompts

Start at the [complete concept-art index](concept-art/README.md). All project concept art is stored under `concept-art/`, grouped by subject. The user-approved [gold seams and gem columns image](concept-art/terrain/resource-terrain-v2.png) is the primary reference for the overall terrain appearance. The current level and room sheets use that direction.

| Subject | Current gallery | Prompt records |
|---|---|---|
| Dwarfs | [Character concepts](concept-art/dwarfs/README.md) | [Female Engineer revision](concept-art/dwarfs/prompts-v3.md), [merged-role revisions](concept-art/dwarfs/prompts-v2.md), and [original generation history](concept-art/dwarfs/prompts.md) |
| Rooms and structures | [Room/structure sheets and terrain-grid study](concept-art/rooms/README.md) | [Current terrain-style revisions](concept-art/rooms/prompts-v3.md); earlier [grid revisions](concept-art/rooms/prompts-v2.md) and [original history](concept-art/rooms/prompts.md) |
| Levels and regions | [Environment concepts](concept-art/levels/README.md) | [Level prompts and reference usage](concept-art/levels/prompts.md) |
| Terrain and resources | [Gold seams, gem columns, earth, and bedrock](concept-art/terrain/README.md) | [Approved resource-terrain revision](concept-art/terrain/prompts-v2.md) and [original history](concept-art/terrain/prompts.md) |
| Enemies | [Creature concepts grouped by region](concept-art/enemies/README.md) | [Enemy generation prompts](concept-art/enemies/prompts.md) |

The level gallery contains candidate strongholds and region studies. These are representative areas, not complete maps or a finalized campaign sequence.

The room sheets explore different sizes, irregular footprints, and continuous bedrock constraints. Their illustrated furniture counts and dimensions do not define room capacity, minimum sizes, upgrades, or fixed templates.

### How to interpret the artwork

- These are **AI-generated concept illustrations**, produced with the built-in image generation tool. They are not game screenshots, final production assets, modular 3D meshes, rigged characters, or tested navigation layouts.
- Image titles and margin captions belong to the concept-sheet presentation. They do not authorize labels in the gameplay area.
- The early [style comparison](concept-art/style-comparison-v1.png) records the choice of stylized 3D. Use the approved terrain reference and current subject galleries for subsequent work.
- User-supplied Dungeon Keeper screenshots are external visual references. The [UI reference section](gameplay-interface.md#reference-images) and [terrain gallery](concept-art/terrain/README.md) explain their use; they are not original assets for this game.
- Only selected current images are retained in the working galleries. Previously committed images remain in Git history; uncommitted drafts may only be named in historical prompts. Filename revisions such as `v2` and `v3` identify artwork versions, not in-game upgrade levels.
- Historical prompts preserve what was actually requested, including removed roles, earlier source filenames, and rejected geometry. They are provenance, not current requirements. Some source images exist only in Git history; current gallery links point to retained files.

## Continuing the project

Keep agreed rules distinct from experiments and proposed numbers. Balance, spell lists and research pacing, Library usefulness after research, combat and training details, repair and trap replenishment, crowd behavior, crossing permissions, and exact campaign objectives still need work. Open decisions are recorded in the relevant design documents.

When adding or revising art, save the selected result in the appropriate `concept-art/` subfolder, record its prompt and reference usage, and update the gallery. Keep older prompt records identifiable as historical. Avoid restoring retired roles or mechanics merely because they appear in an earlier prompt.

Keep catalogs and balance details in their owning design document; link to them from overviews and companion docs instead of repeating counts, lists or values. Update companion documents only when their own rules or instructions change. Dated development records and verification results are historical snapshots, not current catalogs. Before committing, check local Markdown links, inspect changed artwork, review `git diff --check`, and confirm `git status` contains only intended changes. Use descriptive commits to preserve the design and art history.

Room placement skips ineligible squares within a drag (terrain, hidden or unclaimed floor, the Hearthstone, and existing rooms). Eligible new squares are built and charged normally; existing rooms are preserved. Previews and price use the eligible subset. An entirely invalid selection builds nothing. The complete eligible subset must still be affordable unless free room construction is enabled.

Excavated, unclaimed ground looks like bare earth with scattered stones; miners replace it with paving when claiming it. Spare miners reinforce ordinary walls bordering claimed floor, turning raw earth/rock into visible masonry. Room wall fittings appear after reinforcement. Enemy breaching is still future work.

After development checks, leave the local Vite server running so the game remains available to play.

Gold seams now fill miners' bags directly. A full 45-gold bag triggers a treasury trip while the remaining pillar stays intact; miners return to finish it. Gold is left at the mining site only when no reachable treasury has space. The Stone Hearth chest participates in the same delivery system as Treasure Rooms.

Use **Debug → Game configuration** to tune gameplay while testing. The grouped popup pauses simulation and explains when each setting applies. See [Configuration guide](configuration.md) for the source-of-truth map. Dwarfs use soft avoidance: short overlaps are preferable to blocked corridors. Real terrain and gameplay obstacles remain solid; room furniture never blocks routes or sight.

New content follows [Adding rooms and dwarf types](content-playbook.md), alongside the [room checklist](room-development-checklist.md). The guide includes source locations, examples and supported services; the debug dwarf catalog and room choices are generated from definitions.

The command bar includes **Build walls** and **Reclaim room tiles**. Wall plans require clear claimed floor and take 24 seconds of miner work by default. Reclaim returns room floor to claimed ground and refunds 50% of its original payment; free-built tiles refund zero. Both values are in Game configuration. Gold displaced by reduced storage is preserved for hauling; room capacity and service reservations follow the remaining floor.
