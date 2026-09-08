# Browser game development plan

Status: **M1–M11, M13–M14 and M16 complete, including M5.1. M12, M15 and M17–M19 remain planned.** TypeScript and Babylon.js are confirmed. M11 and M14 were implemented and verified with parallel agents; other unfinished milestones remain planning scope.

Completed milestones and verification records are in [development-history.md](development-history.md). **Read that archive only if past context is required; it is not part of routine startup reading.** This file contains the current baseline, unfinished work and dependencies.

Gameplay references: [Game rules](game-rules.md), [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md). This plan defines development order; systems outside the listed milestones remain part of the broader design where documented, without becoming requirements for these milestones. Every new room follows the [room development checklist](room-development-checklist.md).

## Current implementation status

Last checked: **2026-09-07** against the room and character definitions and the verified development record. This is the canonical content-status inventory; milestone completion above does **not** mean the full game design is implemented.

| Room or structure | Current status | Remaining integration |
|---|---|---|
| Treasure Room | Implemented: floor-area gold capacity, hauling and physical wage collection; decorative chests | — |
| Dormitory | Implemented: floor-area accommodation and autonomous rest; decorative beds | — |
| Kitchen | Implemented: floor-area population support and autonomous meals; food props are decorative, with no ingredient or food inventories | — |
| Workshop | Implemented: floor-area concurrent Engineer capacity, attraction, staffed production of all three door tiers and both traps, shared finished stock for placement | Door repairs; upkeep for future fixture types |
| Training Room | Implemented: floor-area concurrent trainee capacity, per-character levels 1–5 with defined practice requirements and health/combat/work values, one level per visit followed by a personal cooldown, and Warrior attraction | Broader balance |
| Library | Implemented: floor-area concurrent researcher capacity, targeted spell research/preparation/casting and Runesmith attraction; catalog in [Spells](spells.md) | Campaign research progression and broader balance |
| Guard Post | Not implemented; disabled catalog placeholder | Guard positions and defensive behavior |
| Stone Hearth | Implemented: fixed 400-health core, physical enemy attacks, defeat/restart, paid Miner/specialist arrivals and starter treasury | No repair, upgrades or relocation in current scope |
| Onward Hearthstone | Implemented: hidden authored stone, physical access/security, eight-second autonomous activation, local completion and progression readiness | Actual next-area travel (M18) |
| Bridge | Implemented: paid Miner construction over water/lava, shore support, shared traversal, refunds and protected removal; no service capacity or fixtures | Campaign placement (M18); chasms intentionally unbridgeable |
| Timber / Reinforced / Steel doors | Implemented in normal play: manufacture, placement, increasing health, Open/Closed/Locked access, dwarf passage, sight blocking and breakage | Repairs and upgrades in place |
| Spike trap | Implemented in normal play: manufacture, placement, enemy damage, brief pinning and automatic cooldown reset | — |
| Bolt trap | Implemented in normal play: manufacture, placement, directional first-target shots, line of sight and automatic cooldown reset | — |
| Goblin Raider | Implemented: authored hidden camps and warned raids, continuous movement, door/barrier breaking, physical Hearth attacks and combat/trap/spell interactions; debug tests retained | Broader types (M17) |

| Dwarf type | Current status | Remaining integration |
|---|---|---|
| Miner | Implemented: starting crew and paid purchases, mining, hauling, claiming, reinforcement, wall and bridge construction; shared food/rest/wages/departure, levels 1–5 and adjacent self-defense | Retreat |
| Engineer | Implemented: normal Workshop-based arrivals, crafting, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Proposed repairs |
| Warrior | Implemented: normal arrivals, shared needs/wages/departure, levels 1–5, autonomous melee combat and Call to Arms response | Guard posts, retreat and broader combat balance |
| Runesmith | Implemented: normal Library-based arrivals, appearance, research/preparation, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Additional personal combat abilities and campaign progression |

**Deferred or removed, not unfinished core content:** Ranger is deferred. Separate Smith, Priest and expedition leader roles are removed. Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are not separate rooms in the current design.

Other broad systems still pending include guard duty, retreat, door repairs/upgrades, broader enemies and campaign progression. All four resident types share sustained-need dissatisfaction, grouped warnings, recovery and physical departure. Core defeat and onward activation set the terminal state consumed by simulation and ordinary actions. Current provisional objective, encounter, morale and wage rules live in levels.md, game-rules.md and characters.md. Detailed behavior and unresolved choices remain there; completed checks are preserved in the optional development history.

**M16 baseline:** `crossings` / Emberwater Crossing supplies a normal-economy water/lava approach and an unbridgeable chasm pocket. Bridge tools are available in the shared construction UI; Border Foothold remains the default land-route level. Bridges cost 20 gold and eight Miner-work seconds per square, with the free-room flag waiving gold only. See [bridge rules](rooms.md#bridges-and-hazardous-crossings).

**Dwarf overview:** role/activity icon counts open filtered resident lists with expandable stats and camera location. Wages, wellbeing and attraction details are expandable below the grid. Miner recruitment is the innate Summon Miner spell in Spells, costing 50 + 25 per living Miner; support/access checks still apply. Spell icons activate directly and are disabled while unusable; research remains accessible through the Library research selector.

**Map navigation:** M or the expand icon beside the minimap opens a full-level map with the same terrain colors and fog of war. Both maps omit the camera overlay; the full map supports click-to-center and M/Escape/close dismissal.

**Known limits:** local objective completion freezes the area with a restart; travel waits for M18. Core repairs are not supported. Departing dwarfs ignore rally and do not fight back; retreat/guard behavior remains M12. Large populations with inaccessible or unfunded wages repeat path queries during needs/pay scheduling; profile and consolidate those queries in M19 if normal-level populations make this significant. All timings and resources remain provisional until integrated balance.

**Current room model:** the user's subsequent room simplification supersedes furnishing-derived capacity in older development entries. Every connected room supplies `floor(squareCount * capacityPerTile)` capacity. Furniture is cosmetic and does not block movement, sight, projectiles or service access. Kitchen and Dormitory area supports residents; Workshop, Library and Training Room area limits concurrent workers. Kitchen food inventories and production chains have been removed. See [Rooms](rooms.md) for the provisional rates and training visit/cooldown rules.

**Current character model:** dwarfs start at level 1 and advance through five explicit per-type rows. Active training and successful melee hits share next-level XP. Combat earns roughly twice the training rate and continues during training cooldown; health, damage, attack interval and work multiplier come from the reached row. See [Character levels](characters.md#character-levels-and-training) for the current table and requirements, which supersede older flat 12-second training and +8% upgrade records in the archive.

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
| M12 | Guard Posts, guard duty and emergency retreat | Planned |
| M15 | Door repairs and upgrades in place | Planned |
| M17 | Broader enemy roster and distinct combat behaviors | Planned |
| M18 | Authored campaign, Hearthstone travel and unlock progression | Planned |
| M19 | Integrated gameplay balance and full-level playtesting | Planned |

## Remaining-feature roadmap — M10–M19

The remaining milestones below cover outstanding features identified in the current inventory. Completed M10, M11, M13, M14 and M16 specifications and checks are archived. The numbered order is the default development sequence; dependencies below identify the required foundations. Existing combat, spells, specialist arrivals and room services are extended rather than rebuilt. Ranger remains deferred; removed roles/rooms and saves, multiplayer, accounts and production infrastructure are outside this roadmap.

**Agreed level objective:** every level contains another Hearthstone, distinct from the starting base core. The player must discover it and overcome a difficult approach, usually an enemy base or hostile region, lava, or another terrain obstacle. This Hearthstone opens progression to the next area through the ancient runic network. Merely surviving or clearing an arbitrary enemy count is not the primary objective. Discovery must respect fog; seeing a crystal across an impassable gap must not count as reaching it. Detailed activation conditions are provisional and owned by [Levels](levels.md#onward-hearthstone-objective).

For every implementation milestone, update the inventory and owning design documents, expose tunable values in existing definitions/configuration, run focused simulation checks and browser playtests, review `git diff --check`, and commit the completed chunk. New rooms follow the full room checklist, including irregular shapes, access, cosmetic furnishings, capacity and free construction. Keep status, health, warnings and objective text in the sidebar/message system.

### Parallel work and integration order

Several milestones can be developed together. A milestone may start its independent systems before a dependency is complete, but cannot claim completion until its dependent integration checks pass. The groups below describe feasible work, not authorization to launch implementation agents.

| Work group | Can run in parallel | What must wait |
|---|---|---|
| Independent next work | **M12 guarding/retreat** and **M15 repairs/upgrades** use completed encounter, objective and economy foundations | M15 safe repair selection shares threat/access queries with M12. M16 crossing/access integration is verified. |
| Enemy extensions | **M17 enemy types** can develop alongside M12 | Final behavior checks require retreat and relevant terrain integration. |
| Campaign production | **M18 level layouts, briefings and unlock definitions** alongside M12/M15/M17 using the completed M16 terrain definitions | Complete transitions/playthroughs wait for required gameplay integrations. Enemy placements/balance remain provisional until M17. |
| Final verification | **M19 complete-campaign balancing** after M10–M18 | Focused tests and local tuning happen throughout; the final normal-rules campaign pass requires the assembled game. |

M10/M13 and then M11/M14 were completed in parallel. M16 is also complete. The next independent split is M12 and M15 when authorized. Avoid assigning whole milestones to simultaneous editors without agreeing on shared interfaces: world/simulation state, navigation, jobs, sidebar/configuration and scenario registration are touched by several systems. Keep feature logic in separate modules; assign one integration owner for shared entry points and canonical documentation. Coordinate these contracts first:

- Encounter sources and enemy targeting consume shared traversal/threat queries; bridge work changes terrain traversal without inventing separate enemy path rules.
- Core defeat/objective state exposes whether ordinary actions and onward travel are allowed; recruitment, construction and campaign travel consume that state.
- Recruitment/wages expose population changes, payment state and resource accounting; dissatisfaction/departure releases the same jobs/reservations and updates the same Miner price calculation.
- Guarding, retreat and repairs use compatible threat/safe-access queries and scheduler priorities; new enemy types use shared combat and damage services.
- Level definitions distinguish starting and onward Hearthstones and campaign links; M18 owns progression/reset rules rather than embedding them in terrain or encounter modules.

Integrate and verify each group before declaring dependent milestones complete. Art/concept review and candidate map sketches can proceed early; final map validation and balancing wait for actual traversal and enemy behavior.

### M12 — Guard Posts, guard duty and retreat

Dependencies: M10–M11 and existing Call to Arms/combat services.

- Implement the Guard Post through shared room definitions, floor-area capacity, automatic cosmetic furnishings and the room debug studio. It attracts no new dwarf type.
- Let available Warriors reserve reachable guard positions, respond to nearby threats and resume guarding after combat, training and needs. Define priority relative to Call to Arms and release reservations on interruption or room changes.
- Add emergency retreat with tunable danger/injury thresholds, safe destination selection and recovery/resumption rules. Cover workers as well as Warriors, and handle a blocked retreat without teleporting or repeatedly choosing an impossible route.

Complete when Warriors autonomously staff and defend a post, respond to and return from a rally, and take care of needs; endangered dwarfs retreat and later resume appropriate activity. Verify reclaim, disconnected capacity, narrow/irregular posts, multiple guards, lost safe routes and absence of rapid retreat/re-engagement loops.

### M15 — Door repairs and upgrades in place

Dependencies: M10–M11 and existing Engineer crafting/defense systems.

- Add Engineer repair jobs for damaged doors with explicit gold/work costs, access and safe-work rules. Avoid repeatedly sending Engineers into active combat.
- Upgrade installed doors through the existing timber, reinforced and steel tiers. Define stock/cost consumption, retained damage, work interruption and access-mode behavior so upgrading cannot provide an unintended free heal.
- Keep spikes and bolts on their current automatic cooldown reset: no ammunition or rearming system. Upkeep for unspecified future fixtures is not required.

Complete when a damaged door can be repaired and upgraded in normal play, with correct costs, health, tier and Open/Closed/Locked behavior. Verify insufficient resources, blocked/unsafe access, interruption, destruction/dismantling during work and navigation updates without duplicate charges or resurrected fixtures.

### M17 — Broader enemy roster and behavior

Dependencies: M10–M11 for normal encounter/core integration. Can develop alongside M12; final behavior checks include M12 retreat and M16 for enemies associated with hazardous terrain.

- Select an initial regional roster from the current enemy designs, recording which concepts are included. Use editable stable definitions for stats, size, senses, attacks and capabilities.
- Add at least one ranged threat and one tunneling/breaching threat alongside the existing melee Raider. Define target priorities, attack obstruction and reinforced-wall resistance; no creature can tunnel through bedrock.
- Give each included type recognizable procedural geometry/animation guided by its concept, normal encounter/raid integration and a shared debug scenario entry. Specify spell/control interactions and any special resistances explicitly.

Complete when normal scenarios include distinct melee, ranged and tunneling threats that demand different layout responses. Verify line of sight, friendly-fire policy, door/wall interactions, bedrock exclusion, traps/spells, retreat and Hearth targeting. Record the shipped roster; unselected concept creatures remain proposals rather than implied completed content.

### M18 — Campaign and Hearthstone travel

Dependencies: M11, M16 and M17; integrate M12–M15 into playable level populations/economies.

- Add campaign and level definitions linking each onward Hearthstone to the next area. Author at least two complete connected levels with different approaches: an enemy-held site and a hazardous crossing. The five candidate concepts are inspiration, not a locked level count/order.
- Let the player proceed through a ready onward Hearthstone using a clear sidebar action. Start the next area at its own established base Hearth with a fresh mining crew and local economy; leave the previous army, buildings and stockpiles behind.
- Carry campaign research/building unlocks in session memory. Distinguish research knowledge from local work queues, prepared spell charges and resident levels; specify reset/carry rules and retain uses for unlocked rooms/types. Add no disk/browser saves or persistence infrastructure.
- Tie briefings and discoveries to restoring routes through the lost kingdom's runic network. Each level's required objective is its onward Hearthstone; optional camps, relics or district goals support that journey.
- Define the endpoint of the authored campaign: its final discovered Hearthstone resolves the current journey or marks the end of available areas, without a broken next-level link. The ultimate story ending remains an authoring choice.

Complete when a browser playthrough reaches one onward Hearthstone, chooses to proceed, starts and completes the next authored area, and receives a valid endpoint. Verify unlock carryover, fresh residents/resources/needs, local spell-state rules, no cross-level jobs/enemies/events, defeat/restart and no automatic transition on discovery alone.

### M19 — Integrated balance and complete-level playtesting

Dependencies: M10–M18.

- Tune starting economy, Miner pricing/wages, support capacity, specialist arrivals, training/combat XP, spells, guard/retreat behavior, repairs, bridges and enemy pressure together.
- Play complete levels from ordinary starting conditions without free construction, supplied stocks, spawned defenders or shortened debug timers. Ensure the onward Hearthstone is challenging but reachable with the tools/resources available on that level.
- Check multiple layouts/approaches, escalating threats, recovery from losses and the Library's continuing usefulness. Correct gameplay blockers and visual/sidebar readability problems found during those runs.

Complete when the authored campaign can be played from fresh start through its endpoint using normal rules, defeat is demonstrable, and focused regressions plus browser playtests cover the discovered issues. Record tested routes, timings, provisional values and remaining content/visual limitations. This is a prototype balance pass, not production release machinery or a requirement for final art assets.
