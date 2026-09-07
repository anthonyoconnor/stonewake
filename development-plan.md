# Browser game development plan

Status: **M1–M9 complete, including M5.1.** TypeScript and Babylon.js are confirmed. This document records the user's requested sequence and replaces the earlier proposed roadmap. The user authorized implementation on 2026-09-07 and subsequently requested a graphics and animation pass as M9, which was added after M8 was complete. Verification and prototype limitations are recorded below.

Gameplay references: [Game rules](game-rules.md), [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md). This plan defines development order; systems outside the listed milestones remain part of the broader design where documented, without becoming requirements for these milestones. Every new room follows the [room development checklist](room-development-checklist.md).

## Current implementation status

Last checked: **2026-09-07** against the room and character definitions and the verified development record. This is the canonical content-status inventory; milestone completion above does **not** mean the full game design is implemented.

| Room or structure | Current status | Remaining integration |
|---|---|---|
| Treasure Room | Implemented: construction, automatic chests, gold storage and hauling | Wage collection |
| Dormitory | Implemented: automatic beds and autonomous rest | — |
| Kitchen | Implemented: growing, cooking, brewing and autonomous meals | — |
| Workshop | Implemented: staffed door/trap production and Engineer attraction | Placing and using manufactured defenses; repairs/replenishment |
| Training Room | Implemented: automatic practice stations, shared capped work-speed training and Warrior attraction | Combat progression/balance |
| Library | Implemented: automatic research stations, spell research/preparation/casting and Runesmith attraction | Broader spell catalog and campaign research progression |
| Guard Post | Not implemented; disabled catalog placeholder | Guard positions and defensive behavior |
| Stone Hearth | Implemented: fixed core, arrival location and starter treasury chest | Enemy attacks, core destruction and defeat |
| Bridge | Not implemented | Crossing rules, construction and navigation across gaps |

| Dwarf type | Current status | Remaining integration |
|---|---|---|
| Miner | Implemented: starting crew, mining, hauling, claiming, reinforcement and wall construction; shared food/rest/training | Normal paid recruitment; wages; threat response |
| Engineer | Implemented: normal Workshop-based arrivals, crafting and shared food/rest/training; also in Debug | Wages; proposed repairs/replenishment |
| Warrior | Implemented: normal Training Room-based arrivals, appearance and shared food/rest/training; also in Debug | Wages; guarding and combat |
| Runesmith | Implemented: normal Library-based arrivals, appearance, research/preparation and shared food/rest/training; also in Debug | Wages; personal combat abilities and campaign progression |

**Deferred or removed, not unfinished core content:** Ranger is deferred. Separate Smith, Priest and expedition leader roles are removed. Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are not separate rooms in the current design.

Other broad systems still pending include combat/enemies, rallying, dissatisfaction/departure and campaign progression. Detailed behavior and unresolved choices remain in the design documents; completed checks remain in the development record below.

### Keeping status current

Update this inventory in the same completed chunk as any room, structure, dwarf or related gameplay integration. Distinguish usable gameplay, debug-only access, disabled placeholders, and design-only content; list remaining dependencies even when its milestone is complete. Verify status against definitions and actual behavior/checks, not artwork or a registered name. Keep README and the relevant design document linked here, and update any affected local status wording. Historical development entries record what happened; they do not replace this current inventory.

Documentation correction — 2026-09-07: added this inventory after the missing-content question exposed that current status was scattered across historical entries and design catalogs. Checked the room/character registries, pending-system wording in the implementation playbook, and the development record. Linked the inventory from README and both content design documents, and added maintenance requirements to the content playbook and room checklist. Documentation-only change; reviewed the diff and checked whitespace and the new link target. No gameplay behavior changed.

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
| M6 | Dormitory | Complete |
| M7 | Kitchen | Complete |
| M8 | Workshop | Complete |
| M9 | Concept-art graphics and animation pass | Complete |

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

Use the [interface document](gameplay-interface.md) as the starting point for bindings: WASD or window-edge movement to pan, mouse wheel to zoom, and Left Ctrl+A/D, horizontal middle drag, or Q/E to orbit the viewed point without changing tilt. These bindings and camera limits can be tuned during the milestone. Keep navigation practical at different rotations and zoom levels, and preserve world-grid alignment.

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

## M9 — Graphics and animation pass

Added after verified M8 completion, as requested by the user. Review the approved terrain image and current Stone Hearth, Treasure Room, Dormitory, Kitchen, Workshop, Miner and female Engineer concepts. Refine the existing procedural graphics to better express their silhouettes, materials and atmosphere. Add appropriate activity animation to the existing systems: walking, mining, carrying, claiming, resting, eating and crafting, with restrained environmental movement and effects.

Preserve the common terrain height, readable grid footprints, discovery boundaries, actual room capacities and clear world view. Effects must follow real activity and stored resources; keep all text and numerical feedback in the sidebar. Use modular code-generated assets for quick iteration. This pass does not add new gameplay systems or production asset infrastructure.

Complete when terrain/resources, core, all four implemented rooms and both implemented character types have been visually reviewed against the concepts, activity animations have been exercised in the browser, and simulation/build checks still pass. Record remaining visual limitations honestly.

## Development record

Prototype values remain provisional. Milestone commits are identifiable by their M-number in Git history.

### Targeted spell catalog design — 2026-09-07

Added [Spells](spells.md) with the seven user-approved concepts: individual Haste, enemy Slow, Stoneguard, Thunder Rune, Runic Barrier, Mending Rune and Rune of Reckoning. Defined provisional research/preparation times, gold costs, effect strengths/durations, targeting and reuse restrictions. Linked the catalog from README and the Library rules. Individual Haste is the intended successor to global Hearth Haste; Prospect's future remains open. These are documented designs only, with combat and targeting dependencies identified; the playable spell definitions remain unchanged. Checked documentation links and whitespace and reviewed the scoped diff. No simulation or browser checks were needed for this documentation-only change.


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


### M6 — 2026-09-07
Added Dormitory definition, two-cell beds with rotated fitting, personal assignments, energy/rest service, sleeping pose, and sidebar bed/energy feedback. Studio supports tired test residents. Thirteen tests pass, including every implemented room across the layout/cost matrix and three unique bed assignments preserved on expansion. Browser verified a 45-square irregular Dormitory and all three miners completing one rest cycle and resuming normal activity, with no console errors. Prototype rest interval is 100 seconds and recovery takes roughly six seconds; needs penalties remain outside scope.


### M7 — 2026-09-07
Added Kitchen growing trays, cooking hearths, tables and brewing barrels; connected usable facilities produce finite stored meals and optional ale. Hungry residents reserve meals, reach tables, eat and resume work. Added stock/access feedback and hungry studio residents. Seventeen tests pass, including all room layouts/costs, production, blocked access, and an irregular-Kitchen traffic regression. Browser verified all three hungry residents complete meals in an L-shaped Kitchen. Fixed idle parking in facility aisles and stalled approaches. Production and need rates are provisional; no Cook role, separate ale need, or departure penalties were added.

### M8 — 2026-09-07
Added Workshop benches, anvils and assembly tables, editable character/recipe definitions, the female Engineer, and queued door/trap manufacturing. Accessible stations require a capable worker; inputs are charged once at work start, and interrupted paid work resumes without charging again. Settlement attraction eligibility reports craft, bed and food support. Twenty simulation checks pass, including all room layouts and costs, staffed/unfunded/unstaffed production and interrupted work. Browser verified an L-shaped Workshop produces one reinforced door and one bolt trap, spending exactly 95 gold, with no console errors. An explicit Debug/Studio Engineer fixture exercises production; automatic recruitment and placing the manufactured defenses remain pending gameplay integrations, as allowed by M8. No combat or repair system was added.

### M9 — 2026-09-07
Reviewed the approved terrain, core, four implemented rooms and both character concepts. Added room paving and brass motifs, wall fittings and lanterns, embedded gold and gem details, contact shadows, core glow, detailed dwarf silhouettes, walking/work/carrying/claiming/eating/sleeping poses, excavation dust, crafting sparks and cooking steam. Added a repeatable four-room showcase using real services, test stocks and workers. Reduced repeated rendering work by retaining unchanged furnishings, combining static parts sharing materials, and restricting glow to light-emitting objects. Showcase loading yields between room builds.

All 20 simulation checks pass, the final TypeScript/browser build passes, and root-document Markdown links resolve. Browser review covered normal terrain and core, four room types from multiple rotations/zoom levels, sleeping and active residents, mining/claiming/hauling, shared meal/rest cycles for all four test residents, and one completed door plus trap. The final browser console reported no errors. The working art remains procedural geometry and textures; the [graphics pass notes](graphics-pass.md) record references, animation hooks and visual limitations. Vite reports a large Babylon.js bundle; production splitting and deployment remain outside this local prototype milestone.

### Camera control correction — 2026-09-07
WASD and an 18-pixel window-edge band now pan relative to the current view while preserving angle, tilt and zoom. Moving the orbit target directly fixes the prior angle/radius drift caused by rebuilding the camera from its old position. Left Ctrl+A/D and horizontal middle-button drag orbit the viewed point at a fixed tilt; Q/E remains available; the sidebar rotation buttons were removed as requested. Edge pan pauses during middle drag, and blur/hidden-page handling clears navigation input. The edge band and drag sensitivity are provisional tuning values. The band follows the outer browser viewport, including its far-left edge beside the sidebar; crossing the sidebar/world boundary does not pan.

Verified with a real Babylon NullEngine regression covering all four WASD directions at multiple rotations, all four edges, sidebar interior, both Ctrl orbit directions, middle drag/release, blur cleanup and map bounds. All 21 tests and the TypeScript/browser build pass (existing bundle-size advisory remains). Browser playtest verified WASD translation, Ctrl orbit, right-edge scrolling, Home/sidebar recentering and updated help, with no console errors. Middle dragging was verified through pointer-event regression; the browser automation interface does not expose a middle-button drag gesture.

Removed the sidebar rotation buttons and added a standard beforeunload confirmation request for accidental closing, refresh and navigation. This does not disable browser-owned Ctrl+W and depends on the host honoring beforeunload after user interaction. Browser inspection confirms only Home and zoom buttons remain. The updated build passes. Reload verification in the embedded test browser stalled without exposing a dialog to automation, so the visible close prompt in the user browser remains unverified.

### Default excavation and reselection — 2026-09-07
Excavation is now active on startup, restart and return from the room studio. Right-click or Escape cancels the current gesture/tool and immediately returns to excavation; cancelling an in-progress room drag cannot place its remaining tiles. Each diggable tile in a click/rectangle toggles once on release, so reselecting marked tiles removes their orders. Mixed selections independently invert their tiles. The erase tool still explicitly removes marks, and debug designation calls retain their explicit add behavior. Open-floor/room clicks continue to inspect through the default cursor. Preview colors distinguish adding and removing designations.

Verified 23 passing tests, including pointer-event coverage of default clicking, repeated selection, mixed drags, construction/cancel, Escape and inspection, plus simulation coverage of cancelling active mining and rejecting hidden/non-diggable targets. TypeScript/browser build passes. Browser playtest confirmed the startup tool, marking/reselecting a gem tile, switching from room placement back to excavation by right-click, and no console errors. Documentation reflects the new defaults.

### Action cursors and room icon selector — 2026-09-07
Replaced room cards with a four-column icon grid and a selected-action panel showing the shared room icon, name and current cost per square. Free construction displays zero. All seven catalog rooms have distinct editable vector artwork; the three unimplemented rooms remain disabled. The same artwork powers native 64-pixel world cursors: pickaxe for digging, minus-marked pickaxe for clearing, eye for floor inspection, and the selected room symbol for building. Right-click/Escape restores the excavation context and clears room highlighting. Sidebar controls keep normal pointers, accessible names and hover titles. Removed repeated selection instructions and obsolete room glyph/card styling; inspection and construction feedback remain in the sidebar.

Verified all 23 tests, including cursor changes alongside actual selection/cancellation behavior, and the final TypeScript/browser build. Browser review covered all four available room selections/prices, shared SVG image loading and applied cursor CSS, disabled planned rooms, right-click cancellation and zero-price free construction. Visual review at 1280 x 720 confirmed the compact grid and selected-room layout; no browser console errors. Native cursor images are excluded from the browser screenshot capture, so their artwork was reviewed through the identical sidebar images and their applied CSS. Icons are original code-generated vector assets inspired by the supplied interface references, not extracted screenshot art. Cursor size and artwork remain tunable prototype choices.

### Excavation planning through darkness — 2026-09-07
Excavation and erase gestures now pick unexplored cells and show their planned marks above the dark terrain. All hidden contents accept identical plans, including concealed floor and bedrock; cursor, preview height and mark visibility do not reveal those contents. Construction/inspection still require discovery. Miners only schedule discovered targets, while normal sight exposes successive work as a tunnel advances. On discovery, non-diggable cells lose their excavation marks automatically. Hidden tiles keep their plans until discovered or explicitly cleared.

All 25 tests pass, including hidden click/toggle without floor-inspection leakage, cleanup of discovered corridor/bedrock marks, preservation beyond a blocking wall, and a miner completing a tunnel queued through darkness into a pre-existing chamber. TypeScript/browser build passes. Browser playtest verified a multi-square drag into fog, persistent marks over darkness and marks disappearing at newly discovered unmineable boundary cells; no console errors. Fog and minimap discovery remain controlled by simulation sight.

### Consistent excavation drag intent — 2026-09-07
The first tile now locks add/remove intent at pointer-down for the entire excavation rectangle. Adding preserves existing marks; removing only clears existing marks. Cursor and previews use the locked action instead of changing over each tile. Release/cancel clears the gesture intent; single clicks still toggle and the explicit erase tool always removes. This supersedes the earlier mixed-selection inversion behavior.

All 25 tests and the TypeScript/browser build pass. Pointer regression checks cover overlapping add/remove drags, fixed cursor intent and cancellation. Browser playtest verified an overlapping add rectangle remains fully marked, followed by a larger removal rectangle leaving no new marks in surrounding darkness, with no console errors.

### Partial room placement — 2026-09-07
Room quotes now filter a selection to eligible new claimed floor instead of rejecting the entire drag for one invalid cell. Terrain, hidden/unclaimed squares, the Hearthstone, other rooms and already-built same-room squares are preserved and cost nothing. Drag endpoints may be in ineligible terrain; only inspection remains restricted to known cells. Preview validity is per tile, and the sidebar count/price uses only newly buildable squares. Empty eligible subsets do nothing; affordability still applies to the whole eligible subset. Normal and debug construction share this behavior.

All 26 tests and the TypeScript/browser build pass. The shared checklist matrix passes for all four implemented rooms; new checks cover mixed obstacles, unknown/unclaimed/core/occupied cells, duplicates, out-of-bounds cells, exact charges, free construction, expansion, automatic furnishings and access. Browser playtest dragged across the Hearthstone and nearby floor: two eligible squares were built for exactly 24 gold, with the core preserved and a reachable chest furnished. No browser console errors.

### Inspection cursor simplification — 2026-09-07
Removed the eyeball artwork and switched inspection to the normal pointer. Clicking open floor still inspects it. Updated help and control documentation. Selection regression and TypeScript checks pass; browser inspection confirmed the default cursor on open floor and working sidebar inspection.

### Stone Hearth starter treasury — 2026-09-07
Added one empty chest to the Stone Hearth, positioned on its existing blocked footprint beside an authored open approach. Its capacity is derived from nine Treasure Room squares (currently 108 gold), enough for a functional 3×3 room. The same storage service now drives hauling, shared gold totals and spending for both Hearth and room chests. The fixed chest survives furnishing recalculation, and its approach remains protected from automatic furniture placement. The existing 400-gold allowance is unchanged. Hearth inspection reports stored gold/capacity, with a live sidebar summary; actual stored coins use the normal chest renderer. The room studio also includes the chest. Future level definitions need an open approach beside the core for the attached chest.

All 27 tests pass, including starting at zero funds, mining 180 gold, filling the chest to 108, purchasing a furnished 3×3 Treasure Room entirely from that chest, retaining exactly one Hearth chest, and delivering the remaining 72 gold afterward without loss. Shared room layout/access/free-construction checks pass; tests for deliberately absent storage now explicitly remove the Hearth fixture. TypeScript/browser build and final TypeScript check pass. Browser reviewed the attached chest and verified a miner delivery increasing shared gold from 400 to 445 before any Treasure Room existed, with Hearth inspection showing 45/108 and no console errors.

### Raw ground and miner wall reinforcement — 2026-09-07
Unclaimed open tiles now use bare earth with scattered stones, without paving joints; claiming replaces this with the established floor material. Natural dirt, rock, bedrock and resource walls also use rough surfaces instead of masonry. Miners now reinforce discovered ordinary dirt/rock beside reachable claimed floor as a low-priority, unpaid job after mining, hauling and claiming. One tile has one reinforced state, shown as cool masonry; room wall fittings and lanterns wait for that state. Bedrock and resource seams are excluded. Six seconds per wall is provisional. Designating a wall cancels its reinforcement; player excavation clears the state with normal mining time. Enemy breach strength remains for future combat integration.

The existing 27 simulation/input/layout tests pass, plus three focused reinforcement checks covering work completion, mining priority/cancellation, excluded terrain, claimed access and subsequent excavation/claiming. TypeScript/browser build passes (existing Babylon bundle advisory). Browser review confirms rough natural surfaces and the contrast with claimed paving; reinforcement visual playtest recorded below.
Browser playtest also confirmed all three miners enter the Reinforcing wall activity, masonry appears as work finishes, and excavation input still accepts a retained earth block. No browser console errors. The development server remains running at http://127.0.0.1:5173/.

### Direct gold-seam collection — 2026-09-07
Finite seams now release tunable 15-gold batches every half-second directly into a miner's 45-gold bag when reachable treasury space exists. Full bags trigger delivery, preserving the pillar and designation until the last gold is extracted. Miners remember the unfinished seam for their return, subject to needs, cancellation and another worker taking it. Exhaustion or cancellation sends partial bags to storage. With no reachable capacity, gold stays at its extraction tile. If capacity disappears or only part of a bag fits during delivery, miners try other storage, then carry the excess back to its source instead of dropping it on a corridor. Capacity is checked again on arrival in case space reopened. Renewable gem extraction remains unchanged.

Five new simulation checks verify incremental bag filling, a half-mined pillar surviving its first delivery, complete eventual delivery, no/full storage, capacity disappearing during travel, collecting fallback piles later, partial deposits, and cancelled/partial final bags. They assert gold conservation throughout. The existing seven mining checks also pass, including zero-funds Hearth recovery. Full-suite, build and browser verification are recorded below.
All 35 tests and the TypeScript/browser build pass (existing Babylon bundle-size advisory). Browser playtest designated a finite seam, observed its exhaustion and total gold increasing from 400 to 490 in the Hearth treasury, with no console errors. The development server remains running on port 5173.

### Configuration editor and soft crowd movement — 2026-09-07
Moved shared mining, needs/food, movement, economy/world and camera values into labelled tuning definitions. Added a tabbed modal under Debug with atomic validation, draft reset/export, explicit live/new-object timing, and simulation/camera pause while open. Room and recipe fields are generated from their registries. `configuration.md` maps all editable definitions and distinguishes balance from procedural art. Starting sight now follows the authored Hearth location rather than prototype-specific coordinates.

Dwarfs keep soft separation where it helps, but follow their terrain-valid path through crowds when separation would stall or push them into furniture. Changed obstacles trigger repathing; terrain/furniture remain solid. Focused configuration, gold, discovery and camera checks pass. Opposing traffic in a one-tile corridor passes with brief permitted overlap, and Kitchen crowding checks pass. Browser verified the popup layout, tab groups and applying a mining duration edit. More integrated verification follows with the construction/removal commands.

### Wall construction and room reclaim — 2026-09-07
Added icon/cursor commands for wall plans and reclaiming room floor. Wall drags lock add/cancel intent on their first square and skip rooms, hidden/unclaimed terrain, loose gold, core and facility access. Plans remain walkable and reserve their tiles against room building. Miners work from an adjacent clear tile; progress survives interruptions, cancellation clears it, and occupancy prevents a wall completing over a dwarf. Idle occupants leave planned sites. Completed walls are reinforced rock, take 24 seconds by default (always longer than excavation plus reinforcement), and can be excavated normally. Wall construction currently costs time only. Inaccessible plans wait like excavation orders; closing a gap can intentionally cut access.

Room tiles record their actual original payment. Reclaim refunds 50% (configurable, rounded down per tile), skips invalid/duplicate squares, returns room floor to claimed floor, and recalculates furnishings. Free-built tiles refund zero and price changes cannot increase refunds. Refunds are immediate spendable credit, including after selling the last Treasure Room. Removed chest contents remain loose gold; food stocks are retained and refill replacement production facilities. Completed manufactured outputs remain in the shared inventory. Active jobs invalidate/release through the normal scheduler.

Six focused simulation checks plus the selection regression pass: construction time, occupancy, invalid targets, cancellation, later excavation, paid/free/refunded tiles, stock preservation and food recovery. Browser placed one Treasure Room square for 12 gold and reclaimed it for 6 (400→388→394); wall completion check follows. Configuration and movement changes also pass the existing room layout/free-build and Kitchen access checks.
Browser also confirmed the planned wall became a full-height reinforced wall after miner work, with no console errors. Final TypeScript and focused command/movement tests pass.

### Additive content audit — 2026-09-07
Verified the original definition/service boundaries and corrected remaining type-name coupling. Food production now uses room components and services regardless of room ID. Furnishing models are selected independently of their gameplay kind/room; room palette, motif and icon are in the room definition. Shared icons resolve through that look definition. Debug spawning lists every character definition, attraction feedback names missing services, and per-type movement multipliers appear in the Dwarfs settings tab. Room summaries use services. Procedural stock visuals are bounded when capacity is increased for testing.

Added `content-playbook.md` with copyable room/dwarf entries, a service/model table, exact file map, automatic UI integrations, reclaim/stock/needs/access checks, and explicit instructions for truly new behaviors. Updated the existing room checklist and character documentation. Two additive-content regression tests register a renamed food room and new specialist/recipe: production, visuals selected from data, layout, reclaim, attraction, shared needs and exact crafting cost all pass without simulation changes. Full-suite/build and browser verification follows.
Browser review verified the generated dwarf catalog by spawning an Engineer (3→4 residents), the Dwarfs configuration tab, and the complete four-room showcase after the model/appearance changes. Earlier browser checks covered a live mining edit, a constructed wall and a 12-gold room square reclaimed for 6. No browser console errors. All 45 existing/new tests passed; an additional high-speed movement regression verifies that extreme debug speed values cannot jump across a wall added to an existing route. Movement now checks the full travel segment against terrain. Final checks are recorded below.
Final verification: all 46 tests pass and the TypeScript/Vite build passes (the existing Babylon bundle-size advisory remains). The browser showcase showed each of the four residents completing three rests and at least three meals, with continued work and no console errors. Documentation links in the new guides resolve, and `git diff --check` passes. Changes are committed in completed chunks; the local game server is left running for play.

### Training Room, Library, Warrior and Runesmith — 2026-09-07

Implemented the four requested additions using the room checklist and content playbook. Training and research are shared services with distinct accessible work positions, reservations, cancellation and progress independent of furnishings. All four dwarf types train autonomously; Runesmiths research selected spells and prepare them again after casting. Normal specialist arrivals now use the Hearth route, spare service positions, beds, stored food and sustainable food production/serving within connected room components. The same rules cover Engineers. Arrival testing is opt-in in the room studio.

Reviewed the approved terrain and all four relevant concept sheets. Added automatic compact/large practice and research furnishings, room floor and reinforced-wall identities, Warrior and Runesmith appearances, and training/research animations. Sidebar controls expose training stats, real occupied/available work positions, arrival requirements and spell queue/pause/resume/casting. The six-room showcase uses actual construction, stocks and services. No floating world labels or meters were added.

Provisional rules: Training Room 22 gold/square, Library 26; 12 seconds per training level, 45 seconds between sessions, five levels, +8% work speed each. Research unlocks Hearth Prospect and Hearth Haste; casting uses shared gold and queues shorter preparation for repeat use. Full values and behavior are recorded in rooms.md and exposed in Game configuration. Combat, guarding, paid Miner recruitment, wages, departure, defensive placement and campaign progression remain pending in the current inventory.

Verification: all 60 tests pass, plus the final TypeScript/Vite build (existing Babylon bundle-size advisory). Both rooms pass the shared eight-layout matrix and focused checks for paid/free expansion, reclaim/refunds, separate components, blocked/restored access, narrow enclosed corridors, shared work squares, reservation release and retained progress. New dwarf checks cover shared meals/rest/training, capability exclusion, actual work bonuses, research pause/resume, casting costs/reuse, blocked sight and normal arrival limits. Review found and fixed food eligibility pooling across disconnected room sections.

Browser review covered six-room construction, new geometry at different camera distances/angles, shared needs/training for all four types, research completion, pause/resume, Haste costing exactly 30 gold and queuing preparation, an ineffective Prospect cast spending zero, 9 training positions / 7 research positions in the showcase, and automatic arrivals stopping at 8 residents when beds filled. Browser console checks reported no errors. A longer browser run exposed a resident repeatedly clipping the first corner of a route from a fractional position. A failing movement regression now passes after adding a safe first leg through the current tile center. The exact 600-second showcase replay then kept all 8 residents eating/resting, reached training 5 for everyone and completed both spells and crafting outputs; the previously stuck Engineer completed 7 meals and 6 rests. Documentation links and git diff --check pass. The local Vite server remains available for play.
