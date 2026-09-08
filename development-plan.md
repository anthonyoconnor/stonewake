# Browser game development plan

Status: **M1–M10 and M13 complete, including M5.1. M11–M12 and M14–M19 remain planned.** TypeScript and Babylon.js are confirmed. The user authorized M10 and M13 in parallel; other unfinished milestones remain planning scope.

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
| Stone Hearth | Implemented: fixed core, paid Miner/specialist arrivals and starter treasury with wage collection | Enemy attacks, core destruction and defeat (M11) |
| Onward Hearthstone | Planned: a separate, initially hidden Hearthstone to find and reach in every level | Objective discovery/access, activation rules and passage to the next area (M11/M18) |
| Bridge | Not implemented | Crossing rules, construction and navigation across gaps |
| Timber / Reinforced / Steel doors | Implemented in normal play: manufacture, placement, increasing health, Open/Closed/Locked access, dwarf passage, sight blocking and breakage | Repairs and upgrades in place |
| Spike trap | Implemented in normal play: manufacture, placement, enemy damage, brief pinning and automatic cooldown reset | — |
| Bolt trap | Implemented in normal play: manufacture, placement, directional first-target shots, line of sight and automatic cooldown reset | — |
| Goblin Raider | Implemented: authored hidden camps and warned raids in normal play; continuous movement, door/barrier breaking and combat/trap/spell interactions; debug tests retained | Hearth attacks (M11), broader types (M17) |

| Dwarf type | Current status | Remaining integration |
|---|---|---|
| Miner | Implemented: starting crew and paid purchases, mining, hauling, claiming, reinforcement and wall construction; shared food/rest/wages, levels 1–5 and adjacent self-defense | Retreat |
| Engineer | Implemented: normal Workshop-based arrivals, crafting, shared food/rest/wages, levels 1–5 and adjacent self-defense; also in Debug | Proposed repairs |
| Warrior | Implemented: normal arrivals, shared needs/wages, levels 1–5, autonomous melee combat and Call to Arms response | Guard posts, retreat and broader combat balance |
| Runesmith | Implemented: normal Library-based arrivals, appearance, research/preparation, shared food/rest/wages, levels 1–5 and adjacent self-defense; also in Debug | Additional personal combat abilities and campaign progression |

**Deferred or removed, not unfinished core content:** Ranger is deferred. Separate Smith, Priest and expedition leader roles are removed. Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are not separate rooms in the current design.

Other broad systems still pending include Hearth damage/defeat, guard duty, retreat, dissatisfaction/departure and campaign progression. Authored and debug raiders exercise defense, combat and spell interactions. M13 purchases, arrivals and payroll honor a tested terminal-state hook; M11 still needs to set it through actual core defeat. Current provisional encounter and wage values are owned by levels.md, game-rules.md and characters.md. Detailed behavior and unresolved choices remain in the design documents; completed checks are preserved in the optional development history.

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
| M11 | Starting Hearth defense/defeat and onward Hearthstone objective | Planned |
| M12 | Guard Posts, guard duty and emergency retreat | Planned |
| M14 | Dissatisfaction, need alerts and departure | Planned |
| M15 | Door repairs and upgrades in place | Planned |
| M16 | Bridges, water, lava and chasm crossings | Planned |
| M17 | Broader enemy roster and distinct combat behaviors | Planned |
| M18 | Authored campaign, Hearthstone travel and unlock progression | Planned |
| M19 | Integrated gameplay balance and full-level playtesting | Planned |

## Remaining-feature roadmap — M10–M19

The remaining milestones below cover outstanding features identified in the current inventory. Completed M10 and M13 specifications and checks are archived. The numbered order is the default development sequence; dependencies below identify the required foundations. Existing combat, spells, specialist arrivals and room services are extended rather than rebuilt. Ranger remains deferred; removed roles/rooms and saves, multiplayer, accounts and production infrastructure are outside this roadmap.

**Agreed level objective:** every level contains another Hearthstone, distinct from the starting base core. The player must discover it and overcome a difficult approach, usually an enemy base or hostile region, lava, or another terrain obstacle. This Hearthstone opens progression to the next area through the ancient runic network. Merely surviving or clearing an arbitrary enemy count is not the primary objective. Discovery must respect fog; seeing a crystal across an impassable gap must not count as reaching it. Detailed activation conditions are provisional and owned by [Levels](levels.md#onward-hearthstone-objective).

For every implementation milestone, update the inventory and owning design documents, expose tunable values in existing definitions/configuration, run focused simulation checks and browser playtests, review `git diff --check`, and commit the completed chunk. New rooms follow the full room checklist, including irregular shapes, access, cosmetic furnishings, capacity and free construction. Keep status, health, warnings and objective text in the sidebar/message system.

### Parallel work and integration order

Several milestones can be developed together. A milestone may start its independent systems before a dependency is complete, but cannot claim completion until its dependent integration checks pass. The groups below describe feasible work, not authorization to launch implementation agents.

| Work group | Can run in parallel | What must wait |
|---|---|---|
| Available foundations | **M11 core defeat/onward objective**, **M14 dissatisfaction/departure**, **M16 terrain/bridges** build on completed encounters and economy | M16's onward-objective scenario waits for M11. M11 drives the existing recruitment/payroll terminal-state hook. |
| First integrations | M11 and M14 can proceed while M16 develops crossings | M11's first objective uses a land route so it does not wait on M16. M14 consumes existing wage/population APIs. |
| Combat and defense extensions | **M12 guarding/retreat**, **M15 repairs/upgrades**, and **M17 enemy types** after M10/M11 foundations | M17 can build attacks/definitions while M12 develops behavior; final tests wait for retreat integration and M16 terrain rules where relevant. M15 safe repair selection shares threat queries with M12. |
| Campaign production | **M18 level layouts, briefings and unlock definitions** alongside M12/M15/M17 once M11 objective and M16 terrain formats are stable | Complete transitions/playthroughs wait for all required gameplay milestones. Enemy placements/balance stay provisional until M17. |
| Final verification | **M19 complete-campaign balancing** after M10–M18 | Focused tests and local tuning happen throughout; the final normal-rules campaign pass requires the assembled game. |

M10 and M13 were completed in parallel. The next independent split is M11, M14 and M16 when authorized. Avoid assigning whole milestones to simultaneous editors without agreeing on shared interfaces: world/simulation state, navigation, jobs, sidebar/configuration and scenario registration are touched by several systems. Keep feature logic in separate modules; assign one integration owner for shared entry points and canonical documentation. Coordinate these contracts first:

- Encounter sources and enemy targeting consume shared traversal/threat queries; bridge work changes terrain traversal without inventing separate enemy path rules.
- Core defeat/objective state exposes whether ordinary actions and onward travel are allowed; recruitment, construction and campaign travel consume that state.
- Recruitment/wages expose population changes, payment state and resource accounting; dissatisfaction/departure releases the same jobs/reservations and updates the same Miner price calculation.
- Guarding, retreat and repairs use compatible threat/safe-access queries and scheduler priorities; new enemy types use shared combat and damage services.
- Level definitions distinguish starting and onward Hearthstones and campaign links; M18 owns progression/reset rules rather than embedding them in terrain or encounter modules.

Integrate and verify each group before declaring dependent milestones complete. Art/concept review and candidate map sketches can proceed early; final map validation and balancing wait for actual traversal and enemy behavior.

### M11 — Hearth defense, defeat and the onward objective

Dependencies: M10. Use an enemy-held land route first; hazardous approaches follow in M16 and actual next-area travel in M18.

- Give the starting Stone Hearth tunable health and enemy targeting/damage. Its destruction ends the level in defeat, with clear sidebar feedback and restart. Resolve core repair policy explicitly; do not add upgrades or relocation.
- Add a distinct map-defined onward Hearthstone, initially hidden under normal discovery. Track discovery, physical access and readiness to proceed independently of the starting core.
- Define and implement a minimal activation rule consistent with autonomous movement. The working proposal is a living dwarf reaching an accessible interaction position and securing the immediate site; exact occupation, time and threat conditions must be recorded before implementation. No remote activation merely from camera movement or sight across a gap.
- Present the objective and its current obstruction in the sidebar. Reaching/activating the onward stone completes the local objective and exposes progression readiness; M18 connects that state to another area.

Complete when one playable scenario supports both outcomes: enemies can destroy the starting core, or the player can find and reach the onward Hearthstone through its defended approach. Verify no premature completion through fog, walls, remote clicks or blocked approaches, and no completion after defeat. Restart clears terminal/objective state. Reaching the onward stone does not relocate the base or silently change recruitment/treasury behavior.

### M12 — Guard Posts, guard duty and retreat

Dependencies: M10–M11 and existing Call to Arms/combat services.

- Implement the Guard Post through shared room definitions, floor-area capacity, automatic cosmetic furnishings and the room debug studio. It attracts no new dwarf type.
- Let available Warriors reserve reachable guard positions, respond to nearby threats and resume guarding after combat, training and needs. Define priority relative to Call to Arms and release reservations on interruption or room changes.
- Add emergency retreat with tunable danger/injury thresholds, safe destination selection and recovery/resumption rules. Cover workers as well as Warriors, and handle a blocked retreat without teleporting or repeatedly choosing an impossible route.

Complete when Warriors autonomously staff and defend a post, respond to and return from a rally, and take care of needs; endangered dwarfs retreat and later resume appropriate activity. Verify reclaim, disconnected capacity, narrow/irregular posts, multiple guards, lost safe routes and absence of rapid retreat/re-engagement loops.

### M14 — Dissatisfaction, alerts and departure

Dependencies: M13 and existing food, rest, attraction and sidebar messages.

- Track sustained unmet food, accommodation, pay and role-facility requirements with tunable grace, escalation and recovery. Brief queues or interruptions must not cause immediate departure.
- Explain the actual cause with grouped, dismissible sidebar warnings; resolving a shortage clears the active warning and permits recovery.
- Persistently dissatisfied dwarfs autonomously leave through the starting Hearth. Release jobs and service reservations, preserve carried resources, update population/attraction and Miner prices, and define behavior if departure access is blocked.

Complete when temporary shortages recover without departures, prolonged shortages produce timely warnings and eventual departures, and fixing the cause changes the outcome. Verify all four types, blocked exits, room reclaim, wages restored before departure and resource/capacity accounting afterward.

### M15 — Door repairs and upgrades in place

Dependencies: M10–M11 and existing Engineer crafting/defense systems.

- Add Engineer repair jobs for damaged doors with explicit gold/work costs, access and safe-work rules. Avoid repeatedly sending Engineers into active combat.
- Upgrade installed doors through the existing timber, reinforced and steel tiers. Define stock/cost consumption, retained damage, work interruption and access-mode behavior so upgrading cannot provide an unintended free heal.
- Keep spikes and bolts on their current automatic cooldown reset: no ammunition or rearming system. Upkeep for unspecified future fixtures is not required.

Complete when a damaged door can be repaired and upgraded in normal play, with correct costs, health, tier and Open/Closed/Locked behavior. Verify insufficient resources, blocked/unsafe access, interruption, destruction/dismantling during work and navigation updates without duplicate charges or resurrected fixtures.

### M16 — Bridges and hazardous terrain

Dependencies: existing construction/navigation services for terrain and bridge development. Uses completed M10/M13 foundations; M11 objective/access state is needed for the final Hearthstone crossing scenario.

- Add map-defined water, lava and chasms on the single terrain layer, with clear occupancy and traversal rules. Start with impassable hazards requiring a valid crossing; any damage behavior must be explicit in definitions.
- Implement Bridge construction, pricing, worker/access requirements and reclaim/removal policy. Define which hazard types a bridge can span, shore connection/support constraints and allowed rooms/fixtures on bridge tiles; do not assume every gap is bridgeable.
- Share crossing rules between dwarfs, enemies, pathfinding, discovery and objective access. Free room construction must have a documented, verified application to bridges; cosmetic decoration cannot create routes.
- Author a scenario with the onward Hearthstone behind a hazardous gap, including a lava approach, and enough accessible resources to build a valid route.

Complete when an initially unreachable onward Hearthstone becomes physically accessible through legitimate bridge construction. Verify water/lava/chasm rules, invalid placements, interrupted work, narrow/bent crossings, occupied bridge removal policy, enemy use and path updates. Camera visibility across a gap never completes the objective.

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
