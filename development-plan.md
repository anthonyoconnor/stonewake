# Browser game development plan

Status: **M1–M11, M13–M14 and M16 complete, including M5.1. M17–M22 remain planned. M12 and M15 have been removed from the active roadmap.** TypeScript and Babylon.js are confirmed. The new interface and graphics milestones are planning scope, not implementation authorization.

Completed milestones and verification records are in [development-history.md](development-history.md). **Read that archive only if past context is required; it is not part of routine startup reading.** This file contains the current baseline, unfinished work and dependencies.

Gameplay references: [Game rules](game-rules.md), [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md). This plan defines development order; systems outside the listed milestones remain part of the broader design where documented, without becoming requirements for these milestones. Every new room follows the [room development checklist](room-development-checklist.md).

## Current implementation status

Last checked: **2026-09-07** against the room and character definitions and the verified development record. This is the canonical content-status inventory; milestone completion above does **not** mean the full game design is implemented.

| Room or structure | Current status | Remaining integration |
|---|---|---|
| Treasure Room | Implemented: floor-area gold capacity, hauling and physical wage collection; decorative chests | — |
| Dormitory | Implemented: floor-area accommodation and autonomous rest; decorative beds | — |
| Kitchen | Implemented: floor-area population support and autonomous meals; food props are decorative, with no ingredient or food inventories | — |
| Workshop | Implemented: floor-area concurrent Engineer capacity, attraction, staffed production of all three door tiers and both traps, shared finished stock for placement | Repairs and future fixture upkeep deferred |
| Training Room | Implemented: floor-area concurrent trainee capacity, per-character levels 1–5 with defined practice requirements and health/combat/work values, one level per visit followed by a personal cooldown, and Warrior attraction | Broader balance |
| Library | Implemented: floor-area concurrent researcher capacity, targeted spell research/preparation/casting and Runesmith attraction; catalog in [Spells](spells.md) | Campaign research progression and broader balance |
| Guard Post | Deferred; disabled catalog placeholder | Outside the active roadmap |
| Stone Hearth | Implemented: fixed 400-health core, physical enemy attacks, defeat/restart, paid Miner/specialist arrivals and starter treasury | No repair, upgrades or relocation in current scope |
| Onward Hearthstone | Implemented: hidden authored stone, physical access/security, eight-second autonomous activation, local completion and progression readiness | Actual next-area travel (M18) |
| Bridge | Implemented: paid Miner construction over water/lava, shore support, shared traversal, refunds and protected removal; no service capacity or fixtures | Campaign placement (M18); chasms intentionally unbridgeable |
| Timber / Reinforced / Steel doors | Implemented in normal play: manufacture, placement, increasing health, Open/Closed/Locked access, dwarf passage, sight blocking and breakage | Repairs and upgrades in place deferred |
| Spike trap | Implemented in normal play: manufacture, placement, enemy damage, brief pinning and automatic cooldown reset | — |
| Bolt trap | Implemented in normal play: manufacture, placement, directional first-target shots, line of sight and automatic cooldown reset | — |
| Goblin Raider | Implemented: authored hidden camps and warned raids, continuous movement, door/barrier breaking, physical Hearth attacks and combat/trap/spell interactions; debug tests retained | Broader types (M17) |

| Dwarf type | Current status | Remaining integration |
|---|---|---|
| Miner | Implemented: starting crew and paid purchases, mining, hauling, claiming, reinforcement, wall and bridge construction; shared food/rest/wages/departure, levels 1–5 and adjacent self-defense | Retreat deferred |
| Engineer | Implemented: normal Workshop-based arrivals, crafting, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Repairs deferred |
| Warrior | Implemented: normal arrivals, shared needs/wages/departure, levels 1–5, autonomous melee combat and Call to Arms response | Broader combat balance; guard posts and retreat deferred |
| Runesmith | Implemented: normal Library-based arrivals, appearance, research/preparation, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Additional personal combat abilities and campaign progression |

**Deferred or removed, not unfinished core content:** Ranger is deferred. Separate Smith, Priest and expedition leader roles are removed. Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are not separate rooms in the current design.

The active roadmap covers broader enemies, campaign progression, overall player interface improvements, terrain/environment graphics, character models/animations and integrated balance. Guard Posts, guard duty, emergency retreat, door repairs and upgrades in place are deferred outside the active roadmap following removal of M12 and M15; retained design proposals and catalog placeholders do not make them required work. All four resident types share sustained-need dissatisfaction, grouped warnings, recovery and physical departure. Core defeat and onward activation set the terminal state consumed by simulation and ordinary actions. Current provisional objective, encounter, morale and wage rules live in levels.md, game-rules.md and characters.md. Detailed behavior and unresolved choices remain there; completed checks are preserved in the optional development history.

**M16 baseline:** `crossings` / Emberwater Crossing supplies a normal-economy water/lava approach and an unbridgeable chasm pocket. Bridge tools are available in the shared construction UI; Border Foothold remains the default land-route level. Bridges cost 20 gold and eight Miner-work seconds per square, with the free-room flag waiving gold only. See [bridge rules](rooms.md#bridges-and-hazardous-crossings).

**Dwarf overview:** role/activity icon counts open filtered resident lists with expandable stats and camera location. Wages, wellbeing and attraction details are expandable below the grid. Miner recruitment is the innate Summon Miner spell in Spells, costing 50 + 25 per living Miner; support/access checks still apply. Spell icons activate directly and are disabled while unusable; research remains accessible through the Library research selector.

**Input controls:** defense icons require a built Workshop and finished stock, then activate placement directly. Bridge and Wall use icons in the fixed bottom row of Rooms, with Sell in its lower-right corner. The excavation toolbar is removed. Sell handles rooms, bridges/plans and defenses with existing refund/safe-removal rules. Left-sidebar in-game controls use text sparingly; tooltips and expandable details carry explanations.

**Map navigation:** M or the expand icon beside the minimap opens a full-level map with the same terrain colors and fog of war. Both maps omit the camera overlay; the full map supports click-to-center and M/Escape/close dismissal.

**Known limits:** local objective completion freezes the area with a restart; travel waits for M18. Core repairs are not supported. Departing dwarfs ignore rally and do not fight back; retreat/guard behavior is deferred. Large populations with inaccessible or unfunded wages repeat path queries during needs/pay scheduling; profile and consolidate those queries in M19 if normal-level populations make this significant. All timings and resources remain provisional until integrated balance.

**Current room model:** the user's subsequent room simplification supersedes furnishing-derived capacity in older development entries. Every connected room supplies `floor(squareCount * capacityPerTile)` capacity. Furniture is cosmetic and does not block movement, sight, projectiles or service access. Kitchen and Dormitory area supports residents; Workshop, Library and Training Room area limits concurrent workers. Kitchen food inventories and production chains have been removed. See [Rooms](rooms.md) for the provisional rates and training visit/cooldown rules.

**Current character model:** dwarfs start at level 1 and advance through five explicit per-type rows. Active training and successful melee hits share next-level XP. Combat earns roughly twice the training rate and continues during training cooldown; health, damage, attack interval, work multiplier and wages come from the reached row. All residents share a 120-second payday from area start, with new arrivals joining the next payday. Wages rise each level; existing debt retains its original amount. See [Character levels](characters.md#character-levels-and-training) for the current table and requirements, which supersede older flat 12-second training and +8% upgrade records in the archive.

### Keeping status current

Update this inventory in the same completed chunk as any room, structure, dwarf or related gameplay integration. Distinguish usable gameplay, debug-only access, disabled placeholders, and design-only content; list remaining dependencies even when its milestone is complete. Verify status against definitions and actual behavior/checks, not artwork or a registered name. Keep README and the relevant design document linked here, and update any affected local status wording. Keep this inventory concise: it describes the current baseline and remaining integrations, not completed implementation steps. Move completed milestone specifications and their tracker rows to [development-history.md](development-history.md), and append dated completion/verification records there. Keep unfinished work, current provisional choices and known limitations here. Historical records do not replace this inventory; read them only when past context is needed.

## Overall guidelines

- Build a browser game using **TypeScript + Babylon.js**.
- Prioritize speed of development and frequent iteration over production hardening.
- Do not spend time on game saves, save/load infrastructure, multiplayer, accounts, or other production features. They are outside this development plan.
- Make characters, levels, rooms, and game features easy to add and revise. Use small shared systems and editable content definitions, with stable identifiers and tuning values kept out of rendering code.
- Keep world state and gameplay rules separate from Babylon.js rendering and UI input so changes stay local and behavior is easy to inspect. Start with ordinary modules and simple data structures; build abstractions when the current work needs them.
- Prefer a quick local run/reload workflow and easy prototype resets. Vite with HTML/CSS for the sidebar is a suggested supporting setup; TypeScript and Babylon.js are the confirmed stack.
- Refer to current concept art for proportions, silhouettes, materials, and atmosphere. Prototype geometry is acceptable; concept sheets are visual references, not ready-to-use game assets.
- Verify each milestone with focused checks and browser playtesting of its new behavior. Avoid extensive tooling or testing that does not help iteration.
- **Commit to Git as reasonable chunks of work are completed, and always at the end of each milestone.** Review the diff and include only intended changes. Record completion and verification in development-history.md; keep remaining limitations and current progress here.

## Milestone tracker

| Milestone | Outcome | Status |
|---|---|---|
| M17 | Broader enemy roster and distinct combat behaviors | Planned |
| M18 | Authored campaign, Hearthstone travel and unlock progression | Planned |
| M20 | Overall player interface and left control panel cleanup | Planned |
| M21 | Terrain and environment graphics update | Planned |
| M22 | Character models and animation update | Planned |
| M19 | Integrated gameplay balance and full-level playtesting | Planned; final pass after M17–M18 and M20–M22 |

M12 (Guard Posts, guard duty and retreat) and M15 (door repairs and upgrades in place) are removed from the active roadmap. Their features are deferred for possible reconsideration. Existing milestone IDs are retained; the new milestones use M20–M22.

## Remaining-feature roadmap

Existing combat, spells, specialist arrivals and room services are extended rather than rebuilt. Completed specifications and checks are archived in [development-history.md](development-history.md). Ranger, guarding/retreat and door maintenance remain deferred; removed roles/rooms and saves, multiplayer, accounts and production infrastructure are outside this roadmap.

**Agreed level objective:** every level contains another Hearthstone, distinct from the starting base core. The player must discover it and overcome a difficult approach, usually an enemy base or hostile region, lava, or another terrain obstacle. This Hearthstone opens progression to the next area through the ancient runic network. Merely surviving or clearing an arbitrary enemy count is not the primary objective. Discovery must respect fog; seeing a crystal across an impassable gap must not count as reaching it. Detailed activation conditions are provisional and owned by [Levels](levels.md#onward-hearthstone-objective).

For every implementation milestone, update the inventory and owning design documents, expose tunable values in existing definitions/configuration, run focused simulation checks where behavior changes and browser playtests, review `git diff --check`, and commit the completed chunk. New rooms follow the full room checklist. Keep status, health, warnings and objective text in the sidebar/message system.

### Work and integration order

M17 supplies the enemy roster for M18. M20 interface work and M21 environment visuals can start against the current game; M22 can start with existing dwarfs and Raiders, then cover the roster selected by M17. M18 travel and endpoint controls must integrate with M20. M19 is the final normal-rules campaign balance and playtest pass after M17–M18 and M20–M22, regardless of its lower number.

These dependencies describe feasible work, not authorization to launch implementation agents. Coordinate shared scene, selection, sidebar and scenario entry points if parallel work is later authorized. Keep gameplay state independent of presentation. Visual work must inspect the current concept galleries and source prompts before implementation; incidental concept details do not introduce new mechanics or restore deferred features.

### M17 — Broader enemy roster and behavior

Dependencies: completed M10–M11 for encounter/core integration and M16 for enemies associated with hazardous terrain. Guarding and retreat are not required.

- Select an initial regional roster from the current enemy designs, recording which concepts are included. Use editable stable definitions for stats, size, senses, attacks and capabilities.
- Add at least one ranged threat and one tunneling/breaching threat alongside the existing melee Raider. Define target priorities, attack obstruction and reinforced-wall resistance; no creature can tunnel through bedrock.
- Give each included type recognizable procedural geometry/animation guided by its concept, normal encounter/raid integration and a shared debug scenario entry. Specify spell/control interactions and any special resistances explicitly.

Complete when normal scenarios include distinct melee, ranged and tunneling threats that demand different layout responses. Verify line of sight, friendly-fire policy, door/wall interactions, bedrock exclusion, traps/spells, existing dwarf combat and Hearth targeting. Record the shipped roster; unselected concept creatures remain proposals rather than implied completed content.

### M18 — Campaign and Hearthstone travel

Dependencies: M11, M16 and M17; integrate completed recruitment, wages and morale systems into playable level populations/economies. Coordinate travel and endpoint controls with M20.

- Add campaign and level definitions linking each onward Hearthstone to the next area. Author at least two complete connected levels with different approaches: an enemy-held site and a hazardous crossing. The five candidate concepts are inspiration, not a locked level count/order.
- Let the player proceed through a ready onward Hearthstone using a clear sidebar action. Start the next area at its own established base Hearth with a fresh mining crew and local economy; leave the previous army, buildings and stockpiles behind.
- Carry campaign research/building unlocks in session memory. Distinguish research knowledge from local work queues, prepared spell charges and resident levels; specify reset/carry rules and retain uses for unlocked rooms/types. Add no disk/browser saves or persistence infrastructure.
- Tie briefings and discoveries to restoring routes through the lost kingdom's runic network. Each level's required objective is its onward Hearthstone; optional camps, relics or district goals support that journey.
- Define the endpoint of the authored campaign: its final discovered Hearthstone resolves the current journey or marks the end of available areas, without a broken next-level link. The ultimate story ending remains an authoring choice.

Complete when a browser playthrough reaches one onward Hearthstone, chooses to proceed, starts and completes the next authored area, and receives a valid endpoint. Verify unlock carryover, fresh residents/resources/needs, local spell-state rules, no cross-level jobs/enemies/events, defeat/restart and no automatic transition on discovery alone.

### M20 — Overall player interface and left control panel

Dependencies: existing gameplay/UI systems; integrate M18 campaign actions when available. Reference [Gameplay interface](gameplay-interface.md) and its supplied layout/message references.

- Review the whole player interface, from finding actions and understanding resources/objectives to world selection, placement, targeting, inspection, messages, maps and restart/travel flows.
- Tidy the left control panel with consistent grouping, spacing, icon sizes, selected/disabled states and expandable details. Remove redundant text and controls; keep frequent actions directly accessible and costs or short status visible where useful.
- Make tooltips, keyboard focus, cancellation and feedback consistent across Rooms, Defenses, Spells and Dwarfs. Preserve the persistent left sidebar, autonomous residents and clear world view without floating text, health bars or progress bars.
- Check usable panel sizing and scrolling at supported browser sizes, keeping essential navigation and actions reachable. Keep development controls separate from ordinary player flows.

Complete when browser playtests cover building/selling, defense production/placement, research/casting, resident inspection, warnings, maps and campaign result/travel actions through a coherent interface. Verify keyboard focus, disabled-state explanations, cancellation, no input leaking into the world and no clipped or inaccessible essential controls. Update gameplay-interface.md to describe the result.

### M21 — Terrain and environment graphics update

Dependencies: existing world rendering and completed M16 bridges; coordinate world previews with M20. Review the approved [terrain reference](concept-art/terrain/README.md), [room/structure concepts](concept-art/rooms/README.md), [regional concepts](concept-art/levels/README.md), their prompt records and [graphics pass notes](graphics-pass.md).

- Improve terrain forms, materials and transitions for earth, rock, bedrock, embedded gold, gem columns, claimed floors, water, lava and chasms using the concepts as visual references.
- Bring room floors, walls, cosmetic furnishings, doors/traps, bridges and Hearthstones into a consistent environment style. Improve model silhouettes, material definition, lighting and restrained environmental/fixture animation.
- Preserve one terrain layer, readable square excavation cells, clear resource/hazard distinctions and fog of war. Decorative detail must not change navigation, room capacity, sight or gameplay geometry.
- Check the result at ordinary play zoom, close inspection and multiple rotations, including narrow/irregular rooms and hazardous crossings. Keep reusable assets/materials and practical browser performance.

Complete when representative gameplay areas and the visual showcase demonstrate a coherent improvement against the references, with before/after captures. Verify terrain and placement readability, fog, irregular rooms, bridge/door/trap states, reduced-motion behavior and browser performance. Record remaining visual limitations in graphics-pass.md.

### M22 — Character models and animations update

Dependencies: current four dwarf roles and combat/jobs; final enemy coverage follows M17's selected roster. Review the [dwarf concepts](concept-art/dwarfs/README.md), [enemy concepts](concept-art/enemies/README.md), their prompt records, [Characters](characters.md) and [graphics pass notes](graphics-pass.md).

- Improve dwarf and included enemy models: proportions, silhouettes, faces/hair, clothing, armor, tools and materials. Preserve the established female Engineer and distinct Miner, Warrior and Runesmith appearances.
- Improve walking, turning, idle, mining/construction, hauling, crafting, training, research, eating/resting, attacks, hit reactions and defeat where those activities exist. Cover M17 ranged/breaching actions without introducing new gameplay abilities.
- Make poses, timing and transitions follow real movement, jobs and combat events, with less sliding, clipping and abrupt switching. Use shared reusable animation/model helpers without requiring an elaborate asset pipeline.
- Keep roles and actions readable from the overhead gameplay camera, coordinate character scale/lighting with M21, and preserve sidebar-only statistics and practical performance at normal populations.

Complete when all four dwarf roles and the shipped enemy roster have improved, recognizable models and their implemented activities animate coherently in browser scenarios and normal play. Capture before/after comparisons; verify equipment alignment, movement/attack timing, state transitions, reduced-motion behavior and crowded-scene performance. Record limitations in graphics-pass.md.

### M19 — Integrated balance and complete-level playtesting

Dependencies: completed gameplay foundations, M17–M18 and M20–M22. M12 and M15 are excluded.

- Tune starting economy, Miner pricing/wages, support capacity, specialist arrivals, training/combat XP, spells, bridges and enemy pressure together.
- Play complete levels from ordinary starting conditions without free construction, supplied stocks, spawned defenders or shortened debug timers. Ensure the onward Hearthstone is challenging but reachable with the tools/resources available on that level.
- Check multiple layouts/approaches, escalating threats, recovery from losses and the Library's continuing usefulness. Correct gameplay blockers and visual/sidebar readability problems found during those runs.

Complete when the authored campaign can be played from fresh start through its endpoint using normal rules, defeat is demonstrable, and focused regressions plus browser playtests cover the discovered issues. Record tested routes, timings, provisional values and remaining content/visual limitations. This is a prototype balance pass, not production release machinery or a requirement for final art assets.
