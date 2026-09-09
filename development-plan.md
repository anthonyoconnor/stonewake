# Browser game development plan

Status: **M1–M11, M13–M14, M16–M29 and M31–M34 complete, including M5.1 and M25.1. M30 is implemented and automatically verified; listening review remains pending. M12 and M15 are removed from the active roadmap.** TypeScript and Babylon.js are confirmed. Completed scope and verification are archived in development-history.md.

Completed milestones and verification records are in [development-history.md](development-history.md). **Read that archive only if past context is required; it is not part of routine startup reading.** This file contains the current baseline, unfinished work and dependencies.

**Current graphics baseline:** the user-authorized substantial graphics overhaul is implemented and verified. All six residents and ten enemies were individually rebuilt against their concepts; original renderers are retained in the character and terrain comparison studios. Two new cohesion concepts and three generated runtime surface maps guide the revised terrain, resources, hazards and room lighting. See [the overhaul record](graphics-overhaul.md) for per-character iterations, controls, assets and limits, and [development history](development-history.md) for completed checks. M30 listening feedback remains pending.

Gameplay references: [Game rules](game-rules.md), [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md). This plan defines development order; systems outside the listed milestones remain part of the broader design where documented, without becoming requirements for these milestones. Every new room follows the [room development checklist](room-development-checklist.md).

## Current implementation status

**Graphics inspection:** the character gallery previews the original and revised rigs together with idle/walk/role-activity/attack selection, pause, restart, frame stepping and speed controls. Starting/Refined focuses one model. Wheel and button zoom no longer have a minimum viewing distance, including in ordinary play; the far limit remains. Preview actors are isolated from gameplay and original model sources remain archived. Controls and scope are documented in [the overhaul record](graphics-overhaul.md).

**Security behaviour:** Cave Hounds continuously patrol and share surveyed ground, explore new openings without a Hearth leash, and run to settlement sightings and attack reports. Stonehands and retained Miners release work and flee to reachable safer ground, retain cargo, wait for safety and avoid job routes through known threats. This user-authorised scope supersedes the former deferral for these behaviours only; Guard Posts, assigned guard duties and general specialist retreat remain deferred. See [current rules](characters.md#mining-worker-escape).

**Current recruitment balance:** regular early hounds use spare Dormitory places without an animal cap. Supported defenders follow soft population targets; Workshops/Libraries attract initial staff and more for sustained queued work. Each type has its own cooldown, with a minimum gap between arrivals and reserved priority while the preferred recruit waits. Full accommodation raises a dismissible **Dormitory is full** notification with a build action; expansion or losses clear it, and filling again starts a new episode. See [current values and requirements](characters.md#cave-hounds-and-population-balance). Tunnel Badgers remain concept-only. M19 subsequently verified the combined economy, support, combat and recruitment through the full authored campaign.

Last checked: **2026-09-09** against the current definitions, full simulation suite and campaign/rendering browser checks. This is the canonical implementation inventory; deferred concepts do not become active scope.

| Room or structure | Current status | Remaining integration |
|---|---|---|
| Treasure Room | Implemented: floor-area gold capacity, hauling and physical wage collection; decorative chests | — |
| Dormitory | Implemented: floor-area accommodation and autonomous rest; decorative beds | — |
| Kitchen | Implemented: floor-area population support and autonomous meals; food props are decorative, with no ingredient or food inventories | — |
| Workshop | Implemented: floor-area concurrent Engineer capacity, attraction, staffed production of all three door tiers and both traps, shared finished stock for placement | Repairs and future fixture upkeep deferred |
| Training Room | Implemented: floor-area concurrent trainee capacity, specialist levels 1–5 with defined practice requirements and health/combat/work values, one level per visit followed by a personal cooldown, and Warrior attraction | — |
| Library | Implemented: floor-area concurrent researcher capacity, targeted spell research/preparation/casting and Runesmith attraction; catalog in [Spells](spells.md) | — |
| Guard Post | Deferred; disabled catalog placeholder | Outside the active roadmap |
| Stone Hearth | Implemented: fixed 400-health core, physical enemy attacks, defeat/restart, Stonehand creation/specialist arrivals and starter treasury | No repair, upgrades or relocation in current scope |
| Onward Hearthstone | Implemented: hidden authored stone, physical access/security, eight-second autonomous activation, local completion and progression readiness | — |
| Bridge | Implemented: paid worker construction over water/lava, shore support, shared traversal, refunds and protected removal; no service capacity or fixtures | Chasms intentionally unbridgeable |
| Timber / Reinforced / Steel doors | Implemented in normal play: manufacture, placement, increasing health, Open/Closed/Locked access, dwarf passage, sight blocking and breakage | Repairs and upgrades in place deferred |
| Spike trap | Implemented in normal play: manufacture, placement, enemy damage, brief pinning and automatic cooldown reset | — |
| Bolt trap | Implemented in normal play: manufacture, placement, directional first-target shots, line of sight and automatic cooldown reset | — |
| All ten enemies | Implemented: editable regional roster, melee/ranged/breaching roles, terrain/control interactions, normal regional maps and encounter sources; visual/debug gallery | — |

| Workforce type | Current status | Remaining integration |
|---|---|---|
| Cave Hound | Implemented: Dormitory-only arrival; den needs, no wages/training; continuous shared patrol, new-passage exploration, settlement-wide sighting/attack response, physical melee and Call to Arms, dedicated quadruped model | Campaign balance verified; values remain tunable |
| Stonehand | Implemented: starting crew, population-priced Hearth creation (50 + 25 per living Stonehand), shared terrain pool and stable 20-second productive assignments; no needs, support slots, pay, training, morale or combat; 30 health, cargo drops on destruction; accepted v2 mechanical model | Balance values provisional |
| Miner | Retained definition, model and debug fixtures; fixed level 1, legacy work and self-defense | Possible basic fighter repurposing deferred |
| Engineer | Implemented: normal Workshop-based arrivals, crafting, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Repairs deferred |
| Warrior | Implemented: normal arrivals, shared needs/wages/departure, levels 1–5, autonomous melee combat and Call to Arms response | Guarding and retreat deferred |
| Runesmith | Implemented: normal Library-based arrivals, appearance, research/preparation, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Additional personal combat abilities |

**Deferred or removed, not unfinished core content:** Ranger is deferred. Separate Smith, Priest and expedition leader roles are removed. Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are not separate rooms in the current design.

The five-area authored campaign, staged content availability, living habitats, reclaimable ruins, biome graphics and ordinary source/pointer lighting are implemented. Refined character motion is verified, and audio is integrated with listening review listed below. Guard Posts, assigned duty, general specialist retreat and door maintenance remain outside the active roadmap.

**M16 baseline:** `crossings` / Emberwater Crossing supplies a normal-economy water/lava approach and an unbridgeable chasm pocket. Bridge tools are available in the shared construction UI; Border Foothold remains the default land-route level. Bridges cost 20 gold and eight worker seconds per square, with the free-room flag waiving gold only. See [bridge rules](rooms.md#bridges-and-hazardous-crossings).

**First-level start:** Border Foothold begins with only a walking ring around the Hearth; players excavate their room space and connecting tunnels. See [starting area](levels.md#starting-area). The chamber excavation fixture isolates its selected encounter; normal authored campaign pressure is verified separately.

**Workforce overview:** role/activity icon counts open filtered resident lists with expandable stats and camera location. Wages, wellbeing and attraction details are expandable below the grid. Create Stonehand in Spells costs 50 gold + 25 per living Stonehand and checks funds/arrival space; Stonehands need no food or bed support. Spell icons activate directly and are disabled while unusable; research remains accessible through the Library research selector.

**Worker priorities:** reinforcement finishes its current tile, then re-evaluates the full pool regardless of its remaining assignment time. Reachable, safe and unreserved excavation/claiming and other useful work take precedence; blocked or already staffed targets permit background reinforcement. Resource stints, delivery, construction and immediate threat escape retain their existing rules. See [work allocation](characters.md#miner-work-allocation).

**Input controls:** defense icons require a built Workshop and finished stock, then activate placement directly. Bridge and Wall use icons in the fixed bottom row of Rooms, with Sell in its lower-right corner. The excavation toolbar is removed. Sell handles rooms, bridges/plans and defenses with existing refund/safe-removal rules. Left-sidebar in-game controls use text sparingly; tooltips and expandable details carry explanations.

**Camera edges:** the far-left viewport edge pans across sidebar overlap; ordinary panel interaction and the internal sidebar boundary stay stationary. All directions remain view-relative, with pointer-leave/blur and open-dialog suppression.

**Map navigation:** M or the expand icon beside the minimap opens a full-level map with the same terrain colors and fog of war. The main view and both maps show every gold seam and gem deposit through fog to guide exploration; other unknown terrain and inhabitants remain hidden. They omit the camera overlay; the full map supports click-to-center and M/Escape/close dismissal.

**Notifications:** a sliding icon rail beside the sidebar provides combat, Hearth, encounter, grouped needs, full-accommodation and first-type recruitment reports. Shared definitions/model supply icons, text, priority, episode grouping and optional locate/panel/tool actions; one generic card and bounded per-area history render them. Dismissal persists until recovery or escalation, source navigation respects visibility, and reports never automatically move the camera or open cards. See [interface rules](gameplay-interface.md#messages-and-the-question-mark-button) and [extension guide](content-playbook.md#add-a-notification).

**Known limits:** local victory freezes the area and offers explicit travel. Five intended and five alternate normal-economy simulation routes reach the endpoint with loss recovery and repeated Library use. A separate unprepared run demonstrates natural defeat. The five-area browser journey, full simulation suite and production smoke check pass. Revised art remains procedural: concept microdetail, cloth/finger articulation, detailed cast shadows and exact furniture contact are simplified or absent. Source selection follows the camera. Dense furnished scenes remain heavier than arrivals on integrated graphics; machine-specific measurements are in the overhaul record. Audio is an original synthesized prototype awaiting listening feedback. Core repairs, assigned guard duty and general specialist retreat remain deferred. Wages with blocked access still use repeated route queries; normal tested populations remain usable. Values remain tunable prototype choices.

**Current room model:** the user's subsequent room simplification supersedes furnishing-derived capacity in older development entries. Every connected room supplies `floor(squareCount * capacityPerTile)` capacity. Furniture is cosmetic and does not block movement, sight, projectiles or service access. Kitchen and Dormitory area supports residents; Workshop, Library and Training Room area limits concurrent workers. Kitchen food inventories and production chains have been removed. See [Rooms](rooms.md) for the provisional rates and training visit/cooldown rules.

**Current character model:** Miners remain at level 1 without training or XP; specialists start at level 1 and advance through five explicit per-type rows. Active training and successful melee hits share next-level XP. Combat earns roughly twice the training rate and continues during training cooldown; health, damage, attack interval, work multiplier and wages come from the reached row. All dwarfs share a 120-second payday from area start, with new arrivals joining the next payday. Specialist wages rise each level; Miner wages stay fixed; existing debt retains its original amount. See [Character levels](characters.md#character-levels-and-training) for the current table and requirements, which supersede older flat 12-second training and +8% upgrade records in the archive.

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

## Remaining verification and review

| Milestone | Remaining work | Status |
|---|---|---|
| M30 | Listen to original procedural work/combat audio and confirm direction | Implemented; playback/controls/cleanup verified, listening review pending |

M12 and M15 stay removed. Deferred roles, rooms, maintenance, saves, accounts, multiplayer and production release infrastructure remain outside the active roadmap. All completed specifications and focused verification are in development-history.md.

### M30 — Sound and music foundation

- Establish an audio direction for underground ambience, restrained music and readable action feedback. Select or create suitable assets and track their source/license where applicable.
- Add sounds for excavation, claiming/reinforcement, resource delivery, building, room activity, movement, species-specific combat, spells, warnings and Hearth success/defeat.
- Use biome ambience and restrained exploration/combat music transitions to support atmosphere without masking warnings. Avoid dense repetitive worker sounds dominating large settlements.
- Drive audio from gameplay events through a small audio service; handle browser interaction-based audio startup, distance/visibility, simultaneous-sound limits and pause/menu/travel cleanup.
- Provide master, music and effects volume plus mute in settings, held in session memory. Hidden threats must not be revealed through precise positional cues; critical warnings remain visually available.
- Add an audio design document linked from README, covering cues, assets and controls.

Complete when a full level has coherent ambience and action feedback, controls work after browser audio activation, and restart/travel/pause do not duplicate or strand sounds. Listen through quiet building, crowded work and combat; verify muted play still communicates essential information.
