# Browser game development plan

Status: **M1–M11, M13–M14, M16–M18 and M20–M22 complete, including M5.1. M19 remains planned. M12 and M15 are removed from the active roadmap.** TypeScript and Babylon.js are confirmed. Completed scope and verification are archived in development-history.md.

Completed milestones and verification records are in [development-history.md](development-history.md). **Read that archive only if past context is required; it is not part of routine startup reading.** This file contains the current baseline, unfinished work and dependencies.

Gameplay references: [Game rules](game-rules.md), [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md). This plan defines development order; systems outside the listed milestones remain part of the broader design where documented, without becoming requirements for these milestones. Every new room follows the [room development checklist](room-development-checklist.md).

## Current implementation status

Last checked: **2026-09-08** against the room and character definitions and the verified development record. This is the canonical content-status inventory; milestone completion above does **not** mean the full game design is implemented.

| Room or structure | Current status | Remaining integration |
|---|---|---|
| Treasure Room | Implemented: floor-area gold capacity, hauling and physical wage collection; decorative chests | — |
| Dormitory | Implemented: floor-area accommodation and autonomous rest; decorative beds | — |
| Kitchen | Implemented: floor-area population support and autonomous meals; food props are decorative, with no ingredient or food inventories | — |
| Workshop | Implemented: floor-area concurrent Engineer capacity, attraction, staffed production of all three door tiers and both traps, shared finished stock for placement | Repairs and future fixture upkeep deferred |
| Training Room | Implemented: floor-area concurrent trainee capacity, specialist levels 1–5 with defined practice requirements and health/combat/work values, one level per visit followed by a personal cooldown, and Warrior attraction | Broader balance |
| Library | Implemented: floor-area concurrent researcher capacity, targeted spell research/preparation/casting and Runesmith attraction; catalog in [Spells](spells.md) | Broader balance |
| Guard Post | Deferred; disabled catalog placeholder | Outside the active roadmap |
| Stone Hearth | Implemented: fixed 400-health core, physical enemy attacks, defeat/restart, paid Miner/specialist arrivals and starter treasury | No repair, upgrades or relocation in current scope |
| Onward Hearthstone | Implemented: hidden authored stone, physical access/security, eight-second autonomous activation, local completion and progression readiness | — |
| Bridge | Implemented: paid Miner construction over water/lava, shore support, shared traversal, refunds and protected removal; no service capacity or fixtures | Chasms intentionally unbridgeable |
| Timber / Reinforced / Steel doors | Implemented in normal play: manufacture, placement, increasing health, Open/Closed/Locked access, dwarf passage, sight blocking and breakage | Repairs and upgrades in place deferred |
| Spike trap | Implemented in normal play: manufacture, placement, enemy damage, brief pinning and automatic cooldown reset | — |
| Bolt trap | Implemented in normal play: manufacture, placement, directional first-target shots, line of sight and automatic cooldown reset | — |
| All ten enemies | Implemented: editable regional roster, melee/ranged/breaching roles, terrain/control interactions, normal regional maps and encounter sources; visual/debug gallery | Campaign balance (M19) |

| Dwarf type | Current status | Remaining integration |
|---|---|---|
| Miner | Implemented: starting crew and paid purchases, mining, hauling, claiming, reinforcement, wall and bridge construction; shared food/rest/wages/departure, fixed level 1 without training or XP and adjacent self-defense | Retreat deferred |
| Engineer | Implemented: normal Workshop-based arrivals, crafting, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Repairs deferred |
| Warrior | Implemented: normal arrivals, shared needs/wages/departure, levels 1–5, autonomous melee combat and Call to Arms response | Broader combat balance; guard posts and retreat deferred |
| Runesmith | Implemented: normal Library-based arrivals, appearance, research/preparation, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Additional personal combat abilities |

**Deferred or removed, not unfinished core content:** Ranger is deferred. Separate Smith, Priest and expedition leader roles are removed. Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are not separate rooms in the current design.

The remaining active milestone is M19: integrated balance and broader full-level playtesting. The complete enemy roster, two-area campaign, player interface and environment/character graphics are implemented. Guard Posts, guard duty, emergency retreat, door repairs and upgrades in place are deferred outside the active roadmap following removal of M12 and M15; retained design proposals and catalog placeholders do not make them required work. All four resident types share sustained-need dissatisfaction, grouped warnings, recovery and physical departure. Core defeat and onward activation set the terminal state consumed by simulation and ordinary actions. Current provisional objective, encounter, morale and wage rules live in levels.md, game-rules.md and characters.md. Detailed behavior and unresolved choices remain there; completed checks are preserved in the optional development history.

**M16 baseline:** `crossings` / Emberwater Crossing supplies a normal-economy water/lava approach and an unbridgeable chasm pocket. Bridge tools are available in the shared construction UI; Border Foothold remains the default land-route level. Bridges cost 20 gold and eight Miner-work seconds per square, with the free-room flag waiving gold only. See [bridge rules](rooms.md#bridges-and-hazardous-crossings).

**Dwarf overview:** role/activity icon counts open filtered resident lists with expandable stats and camera location. Wages, wellbeing and attraction details are expandable below the grid. Miner recruitment is the innate Summon Miner spell in Spells, costing 50 + 25 per living Miner; support/access checks still apply. Spell icons activate directly and are disabled while unusable; research remains accessible through the Library research selector.

**Input controls:** defense icons require a built Workshop and finished stock, then activate placement directly. Bridge and Wall use icons in the fixed bottom row of Rooms, with Sell in its lower-right corner. The excavation toolbar is removed. Sell handles rooms, bridges/plans and defenses with existing refund/safe-removal rules. Left-sidebar in-game controls use text sparingly; tooltips and expandable details carry explanations.

**Map navigation:** M or the expand icon beside the minimap opens a full-level map with the same terrain colors and fog of war. Both maps show every gold seam and gem deposit through fog to guide exploration; other unknown terrain and inhabitants remain hidden. They omit the camera overlay; the full map supports click-to-center and M/Escape/close dismissal.

**Known limits:** local objective completion freezes the area; the two-area campaign offers explicit travel and a verified final endpoint. One normal-cost campaign route is verified; M19 still covers broader balance, alternate approaches and recovery from losses. Core repairs are not supported. Departing dwarfs ignore rally and do not fight back; retreat/guard behavior is deferred. Large populations with inaccessible or unfunded wages repeat path queries during needs/pay scheduling; profile and consolidate those queries in M19 if normal-level populations make this significant. All timings and resources remain provisional until integrated balance.

**Current room model:** the user's subsequent room simplification supersedes furnishing-derived capacity in older development entries. Every connected room supplies `floor(squareCount * capacityPerTile)` capacity. Furniture is cosmetic and does not block movement, sight, projectiles or service access. Kitchen and Dormitory area supports residents; Workshop, Library and Training Room area limits concurrent workers. Kitchen food inventories and production chains have been removed. See [Rooms](rooms.md) for the provisional rates and training visit/cooldown rules.

**Current character model:** Miners remain at level 1 without training or XP; specialists start at level 1 and advance through five explicit per-type rows. Active training and successful melee hits share next-level XP. Combat earns roughly twice the training rate and continues during training cooldown; health, damage, attack interval, work multiplier and wages come from the reached row. All residents share a 120-second payday from area start, with new arrivals joining the next payday. Specialist wages rise each level; Miner wages stay fixed; existing debt retains its original amount. See [Character levels](characters.md#character-levels-and-training) for the current table and requirements, which supersede older flat 12-second training and +8% upgrade records in the archive.

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
| M19 | Integrated gameplay balance and full-level playtesting | Planned; final pass after M17–M18 and M20–M22 |

M12 (Guard Posts, guard duty and retreat) and M15 (door repairs and upgrades in place) are removed from the active roadmap. Their features are deferred for possible reconsideration. Existing milestone IDs are retained; the new milestones use M20–M22.

## Remaining-feature roadmap

Existing combat, spells, specialist arrivals and room services are extended rather than rebuilt. Completed specifications and checks are archived in [development-history.md](development-history.md). Ranger, guarding/retreat and door maintenance remain deferred; removed roles/rooms and saves, multiplayer, accounts and production infrastructure are outside this roadmap.

**Agreed level objective:** every level contains another Hearthstone, distinct from the starting base core. The player must discover it and overcome a difficult approach, usually an enemy base or hostile region, lava, or another terrain obstacle. This Hearthstone opens progression to the next area through the ancient runic network. Merely surviving or clearing an arbitrary enemy count is not the primary objective. Discovery must respect fog; seeing a crystal across an impassable gap must not count as reaching it. Detailed activation conditions are provisional and owned by [Levels](levels.md#onward-hearthstone-objective).

For every implementation milestone, update the inventory and owning design documents, expose tunable values in existing definitions/configuration, run focused simulation checks where behavior changes and browser playtests, review `git diff --check`, and commit the completed chunk. New rooms follow the full room checklist. Keep status, health, warnings and objective text in the sidebar/message system.

### Work and integration order

M19 follows completed M17–M18 and M20–M22. It remains planned until separately authorized. Keep its balance changes in editable definitions and use normal starting conditions for the broader campaign playtests.

### M19 — Integrated balance and complete-level playtesting

Dependencies: completed gameplay foundations, M17–M18 and M20–M22. M12 and M15 are excluded.

- Tune starting economy, Miner pricing/wages, support capacity, specialist arrivals, training/combat XP, spells, bridges and enemy pressure together.
- Play complete levels from ordinary starting conditions without free construction, supplied stocks, spawned defenders or shortened debug timers. Ensure the onward Hearthstone is challenging but reachable with the tools/resources available on that level.
- Check multiple layouts/approaches, escalating threats, recovery from losses and the Library's continuing usefulness. Correct gameplay blockers and visual/sidebar readability problems found during those runs.

Complete when the authored campaign can be played from fresh start through its endpoint using normal rules, defeat is demonstrable, and focused regressions plus browser playtests cover the discovered issues. Record tested routes, timings, provisional values and remaining content/visual limitations. This is a prototype balance pass, not production release machinery or a requirement for final art assets.
