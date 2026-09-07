# Browser game development plan

Status: **implementation authorized on 2026-09-07.** TypeScript and Babylon.js are confirmed. This document records the user's requested M1–M8 sequence, including M5.1, and replaces the earlier proposed roadmap. The user authorized all milestones on 2026-09-07; proceed in sequence.

Gameplay references: [Game rules](game-rules.md), [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md). This plan defines development order; systems outside the listed milestones remain part of the broader design where documented, without becoming requirements for these milestones. Every new room follows the [room development checklist](room-development-checklist.md).

## Overall guidelines

- Build a browser game using **TypeScript + Babylon.js**.
- Prioritize speed of development and frequent iteration over production hardening.
- Do not spend time on game saves, save/load infrastructure, multiplayer, accounts, or other production features. They are outside this development plan.
- Make characters, levels, rooms, and game features easy to add and revise. Use small shared systems and editable content definitions, with stable identifiers and tuning values kept out of rendering code.
- Keep world state and gameplay rules separate from Babylon.js rendering and UI input so changes stay local and behavior is easy to inspect. Start with ordinary modules and simple data structures; build abstractions when the current work needs them.
- Prefer a quick local run/reload workflow and easy prototype resets. Vite with HTML/CSS for the sidebar is a suggested supporting setup; TypeScript and Babylon.js are the confirmed stack.
- Refer to current concept art for proportions, silhouettes, materials, and atmosphere. Prototype geometry is acceptable; concept sheets are visual references, not ready-to-use game assets.
- Verify each milestone with focused checks and browser playtesting of its new behavior. Avoid extensive tooling or testing that does not help iteration.
- **Commit to Git as reasonable chunks of work are completed, and always at the end of each milestone.** Review the diff and include only intended changes. Record completion, how it was checked, and any remaining limitations here.

## Milestone tracker

| Milestone | Outcome | Status |
|---|---|---|
| M1 | Fixed-size grid level with core, terrain, resources, and open spaces | Complete |
| M2 | Camera scrolling/panning, zoom, and rotation | Complete |
| M3 | Basic left sidebar and minimap, with gameplay controls left blank | Complete |
| M4 | Autonomous miners, excavation, claiming, Treasure Room construction, and resource hauling | Complete |
| M5 | Shared room rules, reusable room checklist, and room catalog/layout debugging view | Complete |
| M5.1 | Free room construction flag and Debug option in the left sidebar | Complete |
| M6 | Dormitory | Not started |
| M7 | Kitchen | Not started |
| M8 | Workshop | Not started |

## M1 — Grid level and terrain

Create the initial browser scene and a defined-size prototype level containing:

- A fixed Hearthstone with its protective Stone Hearth in an open starting area.
- Diggable dirt and ordinary rock, indestructible bedrock, finite gold seams, and persistent gemstone columns.
- Some already-open caverns and passages to demonstrate the layout of a real level, alongside solid terrain and internal bedrock seams.

Store the level's width, height, terrain layout, and core position in editable level data. A **48 × 48 cell map is a provisional starting size**, adjustable during M1; it is not a final level limit. Use a repeatable authored layout so changes can be assessed consistently.

Preserve the established large square cells, one full terrain height, and one common walkable floor. Bedrock boundaries follow the grid and generally form continuous seams. Ordinary rock must remain distinguishable from unmineable bedrock. Gem columns remain occupied terrain during extraction. A fixed overhead camera is sufficient at this milestone.

Open-space previews used to assess the prototype do not change the game's discovery rules. Keep pre-existing open space distinct from discovered space in level/world data; camera movement must not become a way to reveal concealed gameplay areas.

References: [approved terrain image](concept-art/terrain/resource-terrain-v2.png), [terrain gallery](concept-art/terrain/README.md), [level gallery](concept-art/levels/README.md), and [room/structure gallery](concept-art/rooms/README.md).

Complete when the defined map loads in a browser, all listed terrain/resource types and the core are readable, and the layout can be changed through its definition without rewriting the renderer.

## M2 — Camera controls

Add controls to scroll/pan across the map, zoom in and out, and rotate the overhead view around the viewed area.

Use the [interface document](gameplay-interface.md) as the starting point for bindings: WASD or middle-mouse drag to pan, mouse wheel to zoom, and Q/E to rotate. These bindings and camera limits can be tuned during the milestone. Keep navigation practical at different rotations and zoom levels, and preserve world-grid alignment.

Complete when the player can navigate across the prototype, inspect the Hearthstone closely, and return to a broad layout view. Panning, rotation, and zoom must work together without losing the level or passing through the floor, and preserve any active discovery boundaries.

## M3 — Basic UI and minimap

Build the basic screen composition from [Gameplay interface](gameplay-interface.md):

- A persistent left sidebar, with the gameplay view filling the remaining space.
- A minimap at the top showing the actual known level layout and the camera's viewed area.
- Reserved areas for resource/population information, room/defense/spell/dwarf categories, and utility controls.
- Space for the question-mark button and associated message icons/cards.

**Gameplay input controls and their panels may remain blank or inactive for now.** Fill them in as their systems arrive; M3 does not require recruitment, construction, spells, defense, or a complete message system. Existing M2 camera controls continue to work, and clicking the minimap can recenter the view as described in the interface document.

Keep detailed text and numbers in the sidebar. Do not add floating world labels, health bars, progress bars, or hover statistics. Sidebar input must not reach the world behind it, and scrolling the sidebar must not zoom the camera. The minimap follows the same discovery state as the world.

Complete when the sidebar and minimap occupy their documented positions, the minimap reflects the level and camera rather than a static placeholder, and UI interactions do not trigger world input. Blank controls remain harmless.

## M4 — Miners, excavation, claiming, and treasure

Add a small starting crew of Miners, using the [current Miner concept](concept-art/dwarfs/README.md) for visual direction. Keep the starting count, movement speed, mining time, resource yield, carrying amount, and storage capacity easy to tune.

### Excavation and claiming

- Allow the player to select/highlight grid tiles for excavation and remove designations when needed. Highlights contain no text or progress bars and remain accurate after camera rotation and zoom.
- Miners autonomously move to reachable work positions and clear designated diggable terrain. They move continuously through open space, respect solid terrain and each other, and do not receive individual movement orders.
- Mining dirt, ordinary rock, or exhausted gold-bearing terrain leaves bare dirt or rock floor at the common floor height. Bedrock cannot be cleared; renewable gem columns remain in place.
- Excavation and claiming are separate steps. Miners claim reachable bare floor, making those squares eligible for room construction. Unclaimed floor cannot support a room.
- Newly opened routes become usable, and breaching pre-existing hidden spaces follows the documented discovery rules for the world and minimap.
- Unreachable jobs wait until access exists; they must not monopolize miners or prevent reachable work from continuing.

### First room: Treasure Room

- Add the Treasure Room as the first and only available room type in this milestone, and fill in the sidebar controls needed to build it on claimed floor.
- Support grid-based room footprints and expansion, including irregular shapes, with recognizable flooring and automatic storage furnishings where their footprints and access fit.
- Keep storage capacity tied to usable, reachable storage positions. Furnishings must preserve miner access and circulation.
- Provide a way to establish the first Treasure Room before mining income is stored. Choose a simple prototype allowance or provisional starting funds during M4; no save system or complete starting economy is required.

### Mining and hauling resources

- Miners extract finite gold seams and renewable, slower gemstone-column yields, then carry the mined gold/gem pickups to a Treasure Room.
- Both sources contribute to the same **gold currency**, as established in the game rules. Source-specific pickup appearances do not introduce a second spendable currency.
- If no Treasure Room is available, the mined resources remain on the ground where they were extracted. They do not disappear or become spendable automatically.
- Once reachable storage with free capacity becomes available, miners collect the waiting resources and deliver them. Full or unreachable storage also leaves resources waiting for a valid delivery destination.
- Increase stored/spendable gold only on delivery. Show stored wealth in the room and the total in the sidebar, without floating world numbers.
- Limit simultaneous work at gem columns and schedule jobs so renewable mining does not prevent excavation, claiming, or hauling from making progress.

Complete when a browser playtest demonstrates:

1. Miners autonomously clear highlighted terrain, leave bare floor, and then claim it.
2. A Treasure Room can be built and expanded on claimed floor, including an irregular footprint.
3. Mining before any Treasure Room exists leaves visible resources on the ground.
4. Building a reachable Treasure Room causes miners to collect those resources and increase the stored gold total on delivery.
5. Gold seams run out; gem columns keep producing slower yields without being cleared.
6. Multiple miners continue useful work as routes open, designations change, and storage becomes available or full, without duplicating or losing resources.

Additional dwarf types, other rooms, recruitment purchases, needs/pay, training, combat, defenses, reinforcement, research, and campaign progression are outside M4. M5 onward extends these foundations within the scope below.

## M5 — Shared room rules and room debugging view

Implement the shared room rules in [Rooms](rooms.md), building on the M4 Treasure Room. Use the existing Treasure Room to verify the shared system before adding further room types.

- Define room types through reusable data: stable identifier, icon, construction cost, floor/wall appearance, furnishing variants, footprints, access clearances, capacities, services, and worker requirements where applicable.
- Support designation and expansion on claimed floor in arbitrary grid shapes, including single cells that may have no functional capacity yet.
- Automatically fit furnishings at their actual scale, preserve entrances and circulation, and retain valid existing furnishings where practical. Changes to room geometry must update usable capacity and navigation without losing stored resources or resident assignments.
- Identify rooms through floors and treatments on existing wall faces. Adjacent rooms do not create dividing walls automatically, and room decoration does not reinforce terrain.
- Report usable capacity and reasons a room cannot function in the sidebar. Painted area alone does not provide beds, food, storage, work positions, or attraction capacity.
- Apply the [room development checklist](room-development-checklist.md) to the Treasure Room and every subsequent room milestone. Keep shared fixes in the shared system.

Add a **Room Debug View** with a catalog of all room types defined for the game. Every implemented room must be viewable; planned types may appear as clearly marked entries until their milestone adds them. Fixed structures remain identified separately from adaptable rooms.

The view must let the developer select a room type and create or expand it by clicking/dragging squares exactly as in gameplay. Reuse the actual construction, validation, furnishing, navigation, and rendering systems. Provide a simple test area with claimed floor, surrounding walls, retained terrain, and bedrock so developers can inspect different layouts using the normal camera controls. Allow quick layout reset and switching room types without requiring saved layouts or a separate level editor.

Use the [layout checks](room-development-checklist.md#layout-checks) to inspect small and large rooms, irregular footprints, narrow passages, obstacles, adjacent rooms, and expansion. Show capacity and access information in the sidebar. M5.1 adds the dedicated Debug menu entry and free-build control; the view itself is part of M5.

Complete when the Treasure Room works through the shared rules in gameplay and the Room Debug View, the catalog lists defined room types with honest implementation status, and developers can create varied room footprints with the same grid gestures used in the game. Every new room can join the catalog through its definition.

## M5.1 — Debug menu and free room construction

- Add **Debug** as an option in the left-hand sidebar, opening a panel with access to the Room Debug View and a **Free room construction** toggle.
- Provide a development flag, provisionally named `freeRoomBuilding`, that can be set through development configuration and changed through this toggle. Show its current state clearly in the panel.
- When enabled, all implemented room types cost zero gold to create or expand, in both gameplay and the Room Debug View. Display the effective cost in the room preview and leave treasury balances unchanged by room construction.
- Apply the flag in the shared room construction path so later rooms inherit it automatically. Claimed-floor, terrain, occupancy, furnishing, and access rules still apply.
- With the flag disabled, use the normal configured room costs and affordability checks. Default to normal costs unless the developer explicitly enables free construction. No preference persistence is required.

Complete when the developer can open Debug from the left sidebar, enter the Room Debug View, and toggle free construction. Verify construction and expansion with no gold, unchanged treasury balances while free building is enabled, rejection of invalid terrain, and restored normal costs when it is disabled. Repeat the free/normal cost checks for each room added later.

## M6 — Dormitory

Follow the [room development checklist](room-development-checklist.md) and the Dormitory rules and visual direction in [Rooms](rooms.md#accommodation-and-food), using the [room concept gallery](concept-art/rooms/README.md).

- Add the Dormitory to normal construction choices and the Room Debug View.
- Give it recognizable floors and existing-wall treatments, with beds and supporting furnishings placed automatically where their footprints and access fit.
- Each usable physical bed counts once. Provide bed assignment and autonomous sleeping/rest use for the current miners through a shared accommodation service that future dwarf types can also use.
- Show usable, assigned, and available beds and access limitations in the sidebar. Expansion should retain valid beds and assignments where practical.

Complete when a Dormitory passes the checklist, works in varied layouts, and miners can reach assigned beds, rest, and return to work. Broader dissatisfaction, payday, and departure systems do not become prerequisites for this room milestone.

## M7 — Kitchen

Follow the [room development checklist](room-development-checklist.md) and [Kitchen rules](rooms.md#accommodation-and-food), using the [room concept gallery](concept-art/rooms/README.md).

- Add the Kitchen to normal construction choices and the Room Debug View.
- Combine growing, preparation/cooking, brewing, and eating in this room, with appropriate automatic furnishings and recognizable floor/wall treatments.
- Derive food provision, stored food, and eating capacity from usable facilities and their access. Use a simple tunable production model consistent with the documented proposal; no separate Cook role or compulsory ale need is established.
- Let miners autonomously obtain food and eat, then resume their activities. Use a shared food service that supports future dwarf types and multiple reachable Kitchens.
- Keep visible food and sidebar stock/capacity information consistent with actual supplies. Distinguish lack of food, lack of eating positions, and blocked access.

Complete when the Kitchen passes the checklist, produces and serves food to miners, and expansion or an additional Kitchen provides usable extra capacity. Full needs balancing and departure behavior remain separate work.

## M8 — Workshop

Follow the [room development checklist](room-development-checklist.md) and [Workshop rules](rooms.md#work-and-training-facilities), using the [room concept gallery](concept-art/rooms/README.md).

- Add the Workshop to normal construction choices and the Room Debug View.
- Automatically fit craft benches, anvils, assembly stations, and supporting fittings as space and access allow. Give it the documented distinctive floors and existing-wall treatments.
- Expose accessible crafting positions and a door/trap manufacturing service for the Engineer capability. Preserve the established female Engineer role and the Workshop's attraction relationship, with settlement support and usable capacity as conditions.
- Show staffing, usable work positions, production inputs, queued work, and outputs in the sidebar as those functions become available. Production must reflect actual worker activity and resources.
- Keep production definitions and tuning easy to extend to further door/trap types. Separate equipment manufacture, enchanting, and a Forge room remain outside the design.

Complete when the Workshop passes the checklist and a basic crafting job can be exercised from accepted work through resource use and output. Engineer recruitment and door/trap placement have not yet been assigned separate milestones: if unavailable during M8, use an explicit debug worker/job fixture to verify the room service and record those gameplay integrations as pending. An unstaffed Workshop does not manufacture automatically. Full combat, repair, and trap-replenishment systems are not required to verify this room.

## Development record

Prototype values remain provisional. Milestone commits are identifiable by their M-number in Git history.


### M1 — 2026-09-07
Implemented a 48 × 48 authored map, fixed Stone Hearth, six terrain types, hidden pre-opened caverns, camera-independent sight, and procedural stone/resource meshes. Verified the browser scene with no console errors, TypeScript/build, and two map/sight tests. Geometry and texture detail are prototype assets. Run with npm run dev.


### M2 — 2026-09-07
Added camera-relative WASD pan, middle-drag pan, Q/E rotation, wheel zoom with bounds, and Home to the Hearthstone. Verified rotation/pan/zoom and Home in the browser, with no console errors; TypeScript passes. Camera controls do not modify discovery.


### M3 — 2026-09-07
Added the left sidebar, known-terrain minimap with camera footprint and click navigation, empty category panels, help, and camera buttons. Verified the browser layout, minimap recentering, Home and help; TypeScript passes. Gameplay panels will be filled as their systems arrive. Diagnostic and economic text stays in the sidebar.


### M4 — 2026-09-07
Implemented three autonomous miners, click/drag excavation and cancellation, continuous routes with corner clearance and yielding, floor claiming, Treasure Room construction, circulation-preserving storage, finite gold and renewable gems, ground pickups, and delivery-only income. Seven simulation tests pass, including resource conservation, no-storage fallback, cancellation, and blocked corners; TypeScript/build passes. Browser playtest mined a seam, built storage, and observed gold rise from 340 to 520 on delivery with no console errors. A provisional 400-gold founding allowance enables the first room. Needs and later room services remain deferred to their milestones.


### M5 — 2026-09-07
Generalized room definitions, variants/orientations, edge-connected room grouping, usable-facility inspection, wall trims, and furnishing preservation. Added a separate resettable 24 × 24 Room Layout Studio with the full room catalog and eight example footprints using normal construction and selection. Main-game state stays in memory when visiting the studio. Ten tests pass, including the layout matrix, circulation, one-cell capacity, expansion, and displaced gold; TypeScript passes. Browser verified the catalog and a 45-square L-shaped room with 23 reachable chests. The M5 checklist is satisfied for Treasure Room; services for subsequent rooms follow their milestones.


### M5.1 — 2026-09-07
Added Debug to the left sidebar with free room construction, Room Layout Studio access, and a quick stronghold restart. The shared construction quote handles both creation and expansion; invalid terrain still fails. Optional VITE_FREE_ROOM_BUILDING config defaults to false. Eleven tests pass, including zero-fund free construction, unchanged balances, and restored normal pricing; TypeScript passes. Browser verified enabling the flag and constructing a studio room with its 50,000-gold debug allowance unchanged.
