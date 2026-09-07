# Dwarven stronghold game

A browser-playable, level-based underground management game inspired by Dungeon Keeper. The player reclaims lost dwarven strongholds by excavating terrain, building rooms, supporting autonomous dwarfs, researching spells, and preparing defenses against the creatures below.

The focus is on **layout management**: where to dig, how rooms connect, how far residents travel, and which routes attackers can use to reach the base's Hearthstone.

This repository contains a **TypeScript + Babylon.js browser prototype**, game design documents, AI-generated concept art, and image-generation prompts. Implementation progress is recorded in the development plan. Stonewake is a provisional prototype title.

## Run locally

Use Node.js 24 or later. Run `npm install`, then `npm run dev` and open the local URL printed by Vite. Code and content changes reload automatically. `npm test` runs focused simulation checks, and `npm run build` checks TypeScript and creates a browser build. No account, server backend, or save system is used.

Project-wide development instructions are in [AGENTS.md](AGENTS.md).

## Play and iterate

**Excavate is the default cursor action.** Click or drag across unexplored tiles or visible dirt, rock, gold or gems to plan excavation. The first tile sets the whole drag: start unmarked to add marks, or marked to remove them. Existing marks are preserved while adding, and unmarked tiles stay unchanged while removing. Miners find reachable work, clear terrain and claim the floor. Choose a room from the icon grid; its icon, name and current gold cost per square appear above the choices. The world cursor uses the same room icon; a pickaxe marks excavation, a minus clears it, and an eye inspects open floor. Drag claimed squares to build; right-click or Escape cancels the current gesture and returns immediately to excavation. Click an open floor or room to inspect it. Start with a Treasure Room to receive mined riches. There is a provisional 400-gold starting allowance. Room capacity comes from accessible furnishings, so narrow or tiny layouts may not function yet.

Excavation can be planned into darkness. Hidden tiles accept the same marks regardless of their concealed contents. Miners work only discovered, reachable diggable targets; discovery automatically clears marks over existing open space or unmineable terrain. Unexplored plans do not reveal terrain, permit room construction, or grant visibility.

Pan with **WASD** or by moving the mouse to a window edge. Hold **Left Ctrl+A/D** or drag horizontally with the **middle mouse button** to orbit the viewed point at a fixed tilt; **Q/E** also rotates. Both panning methods preserve the camera angle. Zoom with the wheel, and press **Home** to return to the Hearthstone. The minimap also moves the camera. Camera movement does not reveal hidden terrain.

Open **Debug → Room layouts** to build and inspect all implemented rooms with the normal grid tools. Example footprints, tired/hungry residents and a test Engineer make services easy to exercise. **Load visual showcase** creates all four rooms with actual test stocks, four residents and queued crafting jobs. Click Rooms to return to the studio controls after inspecting Dwarfs; Return to stronghold restores the game you left in memory.

**Free room construction** applies to room creation and expansion in both worlds. Set `VITE_FREE_ROOM_BUILDING=true` in an untracked `.env.local` to enable it on launch, or use the Debug toggle. Production inputs still cost gold. **Restart stronghold** starts a fresh prototype; refreshing also resets the session. After interacting with the game, closing, refreshing or navigating away asks for browser confirmation where supported, protecting against accidental Ctrl+W.

Workshop production is under Rooms or Debug. Normal Engineer recruitment and placing manufactured doors/traps are pending; **Add test Engineer** verifies the staffed production service. Training Room, Library, Guard Post, Bridge, combat and campaign progression remain broader design work.

## Code map

| Change | Starting point |
|---|---|
| Level dimensions, openings and resource seams | [Level definitions](src/content/levels.ts) |
| Room prices, footprints, capacity and services | [Room definitions](src/content/rooms.ts) and [room checklist](room-development-checklist.md) |
| Character capabilities and recipes | [Characters](src/content/characters.ts), [recipes](src/content/recipes.ts) |
| Work pace and shared needs | [Tuning](src/content/tuning.ts), [simulation](src/game/simulation.ts), [food production](src/game/food.ts) |
| Construction, furnishing and path access | [Rooms](src/game/rooms.ts), [navigation](src/game/navigation.ts) |
| Prototype meshes, textures and animations | [Scene](src/view/scene.ts), [surfaces](src/view/surfaces.ts), [residents](src/view/residents.ts), [effects](src/view/effects.ts) |
| Sidebar and grid input | [Sidebar](src/ui/sidebar.ts), [selection](src/ui/selection.ts) |
| Repeatable debug examples | [Room studio data](src/content/room-lab.ts) |

The simulation has no Babylon.js or DOM dependency. Focused Node tests exercise discovery, mining, resource conservation, navigation, layout access, needs, free construction and staffed crafting. Graphics remain procedural prototype assets guided by the concepts; see the [graphics pass notes](graphics-pass.md).

## Start here for a new session

1. Read [Game rules](game-rules.md) for the core loop, agreed constraints, and open mechanics.
   Read the [Development plan](development-plan.md) for the confirmed TypeScript + Babylon.js stack, iteration guidelines, and M1–M9 scope (including M5.1) before implementation work. Follow the [room development checklist](room-development-checklist.md) when adding rooms.
2. Read the relevant detailed documents below before changing a system. Each distinguishes agreed direction from proposals and unresolved balance.
3. For visual work, inspect the [approved terrain reference](concept-art/terrain/resource-terrain-v2.png), then the relevant current gallery and its prompt records.
4. Check the working tree and recent Git history before editing. Keep related design documents, gallery links, and prompt records consistent when making changes.

Current design documents define gameplay. Concept art illustrates the direction; incidental details in images or historical prompts do not establish new rules. Follow the user's latest decisions when evolving the design, and update the affected documents so future sessions have the same context.

## Design document map

| Document | What to find there |
|---|---|
| [Game rules](game-rules.md) | Core loop, autonomous control, camera, campaign progression, Hearthstone and defeat, excavation, economy, recruitment, needs, defense, and extensible character/room definitions |
| [Characters](characters.md) | Current dwarf roster, work, recruitment, pay, bedding, food, special facilities, training, and behavior proposals |
| [Rooms and structures](rooms.md) | Room catalog, purposes and outputs, attraction, arbitrary footprints, automatic furnishings, capacity, floors and wall identity, doors, traps, and reinforcement |
| [Levels and underground contents](levels.md) | Terrain, resources, discovery, hidden spaces, regions and inhabitants, attacks, candidate strongholds, and level-authoring considerations |
| [Gameplay interface](gameplay-interface.md) | Left sidebar, minimap, rooms/defenses/spells/dwarfs panels, selection and camera controls, messages, inspection, and a clear gameplay view |
| [Development plan](development-plan.md) | Confirmed TypeScript + Babylon.js browser stack, development guidelines, M1–M9 milestones including M5.1, completion checks, and progress record; implementation progress is tracked in the plan |
| [Room development checklist](room-development-checklist.md) | Reusable procedure for adding rooms, shared-system integration, room debug view, and layout/function checks |

## Current scope and constraints

- **Browser play and development:** use TypeScript + Babylon.js. Prioritize fast iteration and extensible characters, levels, rooms, and features. Game saves, multiplayer, and production hardening are outside the current development plan. Commit completed chunks and every milestone. M1–M9, including M5.1, are recorded in the [Development plan](development-plan.md); implementation is authorized and tracked in the development plan. Room debugging includes a room catalog with grid-based layout creation and a left-sidebar Debug menu with a free room construction flag.
- **Fresh settlements:** each level starts with a small mining crew and an established Stone Hearth around a dormant Hearthstone awakened during arrival. Other residents are recruited locally. Dwarfs arrive through the Hearthstone's runic connection. Enemies destroy the core to win; it has a fixed location and no upgrades. There is no expedition leader.
- **One terrain layer:** excavation and construction use large square cells. Intact earth, gold-bearing terrain, and bedrock share one full height above a common walkable floor. Bedrock generally forms continuous seams with grid-shaped boundaries. Ordinary unmined earth cells can remain inside an excavation. There are no terraced mining layers or stacked playable floors.
- **Discovery matters:** caves, ruins, passages, and inhabited chambers can already be excavated but remain hidden until breached and seen. Camera movement must not reveal concealed areas.
- **Free movement, indirect control:** dwarfs and enemies move continuously through open space rather than snapping to tile centers. Dwarfs handle work, needs, and fighting autonomously. A call to arms can direct attention to an area; individual movement orders and possession are outside the design.
- **Adaptive rooms:** room footprints can have any grid-based size or shape. Floors and existing wall treatments identify the room. Furnishings appear where their footprints and access space fit, and usable capacity follows those facilities.
- **Shared needs and economy:** all dwarfs need wages, beds, food, and appropriate facilities. Miners deliver finite gold-seam yields and renewable, slower gem-column yields to Treasure Rooms; both produce the same gold currency. Dwarfs collect pay there. Bought miners cost more as the current living miner population rises, and the next price falls when that population falls.
- **Clear overhead presentation:** stylized 3D with camera rotation and zoom. Controls and detailed information belong in the left sidebar, with the minimap at its top. The gameplay view has no floating text, numbers, health bars, or progress bars, including on hover or selection. Necessary text can appear in dismissible message cards associated with icons above the question-mark button.
- **Reusable systems:** rooms and dwarf types must remain useful across levels. Future types should fit shared definitions and systems; this is an architecture requirement, not an implemented framework.

The four current dwarf types are **Miner**, **Engineer** (female; Workshop doors and traps), **Warrior** (attracted by the shared Training Room), and **Runesmith** (Library spell research). All can train and use shared food and accommodation. The Ranger is deferred. Separate Smith, Priest, and expedition leader roles are removed.

The catalog contains seven rooms—**Treasure Room, Dormitory, Kitchen, Workshop, Training Room, Library, and Guard Post**—plus the **Stone Hearth** and **Bridge** structures. The Kitchen includes growing, cooking, brewing, and eating. There are no separate Forge, Brewery, Barracks, Ranger Lodge, or Ancestral Shrine rooms. Exact crossing rules remain open.

## Concept art and prompts

Start at the [complete concept-art index](concept-art/README.md). All project concept art is stored under `concept-art/`, grouped by subject. The user-approved [gold seams and gem columns image](concept-art/terrain/resource-terrain-v2.png) is the primary reference for the overall terrain appearance. The current level and room sheets use that direction.

| Subject | Current gallery | Prompt records |
|---|---|---|
| Dwarfs | [Four current character concepts](concept-art/dwarfs/README.md) | [Female Engineer revision](concept-art/dwarfs/prompts-v3.md), [merged-role revisions](concept-art/dwarfs/prompts-v2.md), and [original generation history](concept-art/dwarfs/prompts.md) |
| Rooms and structures | [Nine room/structure sheets and a terrain-grid study](concept-art/rooms/README.md) | [Current terrain-style revisions](concept-art/rooms/prompts-v3.md); earlier [grid revisions](concept-art/rooms/prompts-v2.md) and [original history](concept-art/rooms/prompts.md) |
| Levels and regions | [Seven environment concepts](concept-art/levels/README.md) | [Level prompts and reference usage](concept-art/levels/prompts.md) |
| Terrain and resources | [Gold seams, gem columns, earth, and bedrock](concept-art/terrain/README.md) | [Approved resource-terrain revision](concept-art/terrain/prompts-v2.md) and [original history](concept-art/terrain/prompts.md) |
| Enemies | [Ten creature concepts grouped by region](concept-art/enemies/README.md) | [Enemy generation prompts](concept-art/enemies/prompts.md) |

The level gallery illustrates five candidate strongholds—Border Foothold, Flooded Workings, Fallen City, Crystal Divide, and Royal Deep—and two additional region studies, Fungal Caves and Volcanic Depths. These are representative areas, not complete maps or a finalized campaign sequence.

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

When updating the design, revise the relevant companion documents and this overview if the scope changes. Before committing, check local Markdown links, inspect changed artwork, review `git diff --check`, and confirm `git status` contains only intended changes. Use descriptive commits to preserve the design and art history.

Room placement skips ineligible squares within a drag (terrain, hidden or unclaimed floor, the Hearthstone, and existing rooms). Eligible new squares are built and charged normally; existing rooms are preserved. Previews and price use the eligible subset. An entirely invalid selection builds nothing. The complete eligible subset must still be affordable unless free room construction is enabled.
