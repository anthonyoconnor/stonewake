# Browser game development plan

Status: **M1–M11, M13–M14, M16–M18, M20–M25 and M34 complete, including M5.1 and M25.1. M19 and M26–M33 remain planned. M12 and M15 are removed from the active roadmap.** TypeScript and Babylon.js are confirmed. Completed scope and verification are archived in development-history.md.

Completed milestones and verification records are in [development-history.md](development-history.md). **Read that archive only if past context is required; it is not part of routine startup reading.** This file contains the current baseline, unfinished work and dependencies.

**Current authorization:** all remaining active milestones M26–M33 and M19 are authorized for implementation. Campaign progression, biomes/ruins, environment/lighting and audio/animation are being developed in coordinated parallel work; completion still requires the checks below.

Gameplay references: [Game rules](game-rules.md), [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md). This plan defines development order; systems outside the listed milestones remain part of the broader design where documented, without becoming requirements for these milestones. Every new room follows the [room development checklist](room-development-checklist.md).

## Current implementation status

**Security behaviour:** Cave Hounds continuously patrol and share surveyed ground, explore new openings without a Hearth leash, and run to settlement sightings and attack reports. Stonehands and retained Miners release work and flee to reachable safer ground, retain cargo, wait for safety and avoid job routes through known threats. This user-authorised scope supersedes the former deferral for these behaviours only; Guard Posts, assigned guard duties and general specialist retreat remain deferred. See [current rules](characters.md#mining-worker-escape).

**Current recruitment balance:** regular early hounds use spare Dormitory places without an animal cap. Supported defenders follow soft population targets; Workshops/Libraries attract initial staff and more for sustained queued work. Each type has its own cooldown, with a minimum gap between arrivals and reserved priority while the preferred recruit waits. Full accommodation raises a dismissible **Dormitory is full** notification with a build action; expansion or losses clear it, and filling again starts a new episode. See [current values and requirements](characters.md#cave-hounds-and-population-balance). Tunnel Badgers remain concept-only. These targeted changes do not complete M19's broader campaign-balance pass.

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
| Stone Hearth | Implemented: fixed 400-health core, physical enemy attacks, defeat/restart, Stonehand creation/specialist arrivals and starter treasury | No repair, upgrades or relocation in current scope |
| Onward Hearthstone | Implemented: hidden authored stone, physical access/security, eight-second autonomous activation, local completion and progression readiness | — |
| Bridge | Implemented: paid worker construction over water/lava, shore support, shared traversal, refunds and protected removal; no service capacity or fixtures | Chasms intentionally unbridgeable |
| Timber / Reinforced / Steel doors | Implemented in normal play: manufacture, placement, increasing health, Open/Closed/Locked access, dwarf passage, sight blocking and breakage | Repairs and upgrades in place deferred |
| Spike trap | Implemented in normal play: manufacture, placement, enemy damage, brief pinning and automatic cooldown reset | — |
| Bolt trap | Implemented in normal play: manufacture, placement, directional first-target shots, line of sight and automatic cooldown reset | — |
| All ten enemies | Implemented: editable regional roster, melee/ranged/breaching roles, terrain/control interactions, normal regional maps and encounter sources; visual/debug gallery | Campaign balance (M19) |

| Workforce type | Current status | Remaining integration |
|---|---|---|
| Cave Hound | Implemented: Dormitory-only arrival; den needs, no wages/training; continuous shared patrol, new-passage exploration, settlement-wide sighting/attack response, physical melee and Call to Arms, dedicated quadruped model | M24 encounter balance verified; wider campaign values provisional |
| Stonehand | Implemented: starting crew, population-priced Hearth creation (50 + 25 per living Stonehand), shared terrain pool and stable 20-second productive assignments; no needs, support slots, pay, training, morale or combat; 30 health, cargo drops on destruction; accepted v2 mechanical model | Balance values provisional |
| Miner | Retained definition, model and debug fixtures; fixed level 1, legacy work and self-defense | Possible basic fighter repurposing deferred |
| Engineer | Implemented: normal Workshop-based arrivals, crafting, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Repairs deferred |
| Warrior | Implemented: normal arrivals, shared needs/wages/departure, levels 1–5, autonomous melee combat and Call to Arms response | Broader combat balance; guard posts and retreat deferred |
| Runesmith | Implemented: normal Library-based arrivals, appearance, research/preparation, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Additional personal combat abilities |

**Deferred or removed, not unfinished core content:** Ranger is deferred. Separate Smith, Priest and expedition leader roles are removed. Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are not separate rooms in the current design.

The remaining active milestones are M26–M33, below, followed by M19: integrated balance and broader full-level playtesting. The complete enemy roster, two-area campaign, player interface and environment/character graphics are implemented. Guard Posts, assigned guard duties, general specialist retreat, door repairs and upgrades in place are deferred outside the active roadmap following removal of M12 and M15; retained design proposals and catalog placeholders do not make them required work. Dwarfs and Cave Hounds share sustained-need dissatisfaction, grouped warnings, recovery and physical departure. Core defeat and onward activation set the terminal state consumed by simulation and ordinary actions. Current provisional objective, encounter, morale and wage rules live in levels.md, game-rules.md and characters.md. Detailed behavior and unresolved choices remain there; completed checks are preserved in the optional development history.

**M16 baseline:** `crossings` / Emberwater Crossing supplies a normal-economy water/lava approach and an unbridgeable chasm pocket. Bridge tools are available in the shared construction UI; Border Foothold remains the default land-route level. Bridges cost 20 gold and eight worker seconds per square, with the free-room flag waiving gold only. See [bridge rules](rooms.md#bridges-and-hazardous-crossings).

**First-level start:** Border Foothold begins with only a walking ring around the Hearth; players excavate their room space and connecting tunnels. See [starting area](levels.md#starting-area). The chamber excavation fixture isolates its selected encounter; broader campaign pressure remains M19.

**Workforce overview:** role/activity icon counts open filtered resident lists with expandable stats and camera location. Wages, wellbeing and attraction details are expandable below the grid. Create Stonehand in Spells costs 50 gold + 25 per living Stonehand and checks funds/arrival space; Stonehands need no food or bed support. Spell icons activate directly and are disabled while unusable; research remains accessible through the Library research selector.

**Worker priorities:** reinforcement finishes its current tile, then re-evaluates the full pool regardless of its remaining assignment time. Reachable, safe and unreserved excavation/claiming and other useful work take precedence; blocked or already staffed targets permit background reinforcement. Resource stints, delivery, construction and immediate threat escape retain their existing rules. See [work allocation](characters.md#miner-work-allocation).

**Input controls:** defense icons require a built Workshop and finished stock, then activate placement directly. Bridge and Wall use icons in the fixed bottom row of Rooms, with Sell in its lower-right corner. The excavation toolbar is removed. Sell handles rooms, bridges/plans and defenses with existing refund/safe-removal rules. Left-sidebar in-game controls use text sparingly; tooltips and expandable details carry explanations.

**Camera edges:** the far-left viewport edge pans across sidebar overlap; ordinary panel interaction and the internal sidebar boundary stay stationary. All directions remain view-relative, with pointer-leave/blur and open-dialog suppression.

**Map navigation:** M or the expand icon beside the minimap opens a full-level map with the same terrain colors and fog of war. The main view and both maps show every gold seam and gem deposit through fog to guide exploration; other unknown terrain and inhabitants remain hidden. They omit the camera overlay; the full map supports click-to-center and M/Escape/close dismissal.

**Notifications:** a sliding icon rail beside the sidebar provides combat, Hearth, encounter, grouped needs, full-accommodation and first-type recruitment reports. Shared definitions/model supply icons, text, priority, episode grouping and optional locate/panel/tool actions; one generic card and bounded per-area history render them. Dismissal persists until recovery or escalation, source navigation respects visibility, and reports never automatically move the camera or open cards. See [interface rules](gameplay-interface.md#messages-and-the-question-mark-button) and [extension guide](content-playbook.md#add-a-notification).

**Known limits:** local objective completion freezes the area; the two-area campaign offers explicit travel and a verified final endpoint. One normal-cost campaign route is verified; M19 still covers broader balance, alternate approaches and recovery from losses. Core repairs are not supported. Departing dwarfs ignore rally and do not fight back; assigned guard duties and specialist retreat remain deferred. Large populations with inaccessible or unfunded wages repeat path queries during needs/pay scheduling; profile and consolidate those queries in M19 if normal-level populations make this significant. All timings and resources remain provisional until integrated balance.

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

## Milestone tracker

| Milestone | Outcome | Status |
|---|---|---|
| M26 | Campaign structure and gradual content unlocks | Planned |
| M27 | Living biomes and recurring enemy pressure | Planned |
| M28 | Discoverable and reclaimable dwarven ruins | Planned |
| M29 | Authored campaign levels and resource-led exploration | Planned |
| M30 | Sound and music foundation | Planned |
| M31 | Environment and room graphics refinement | Planned |
| M32 | Character animation and combat readability refinement | Planned |
| M33 | Underground lighting, source glows and pointer illumination | Planned; test room implemented |
| M19 | Integrated gameplay balance and full-level playtesting | Planned; final pass after M23–M34, including M25.1 |

M12 (Guard Posts, guard duty and retreat) and M15 (door repairs and upgrades in place) are removed from the active roadmap. Their features are deferred for possible reconsideration. Existing milestone IDs are retained; the playtest follow-on milestones use M23–M34.

## Remaining-feature roadmap

Existing combat, spells, specialist arrivals and room services are extended rather than rebuilt. Completed specifications and checks are archived in [development-history.md](development-history.md). Ranger, assigned guard duties, specialist retreat and door maintenance remain deferred; removed roles/rooms and saves, multiplayer, accounts and production infrastructure are outside this roadmap.

**Agreed level objective:** every level contains another Hearthstone, distinct from the starting base core. The player must discover it and overcome a difficult approach, usually an enemy base or hostile region, lava, or another terrain obstacle. This Hearthstone opens progression to the next area through the ancient runic network. Merely surviving or clearing an arbitrary enemy count is not the primary objective. Discovery must respect fog; seeing a crystal across an impassable gap must not count as reaching it. Detailed activation conditions are provisional and owned by [Levels](levels.md#onward-hearthstone-objective).

For every implementation milestone, update the inventory and owning design documents, expose tunable values in existing definitions/configuration, follow AGENTS.md verification scope: focused simulations and one typecheck, relevant browser checks for UI, and broader suites/builds for major integrations, review `git diff --check`, and commit the completed chunk. New rooms follow the full room checklist. Keep status, health, warnings and objective text in the sidebar/message system.

### Work and integration order

The user reports completing the two-level campaign. This establishes a successful player route through the prototype, but does not by itself complete M19's alternate-route, recovery, defeat and regression requirements. The following milestones address that playtest feedback. M23, M24 and M34 are complete. M25 and M25.1 are complete. The M33 lighting test room is implemented; full M33 remains planned.

M23 and M34 resolve the immediate work-priority and left-edge camera issues; M24 combat balance and its test harness are complete. M25/M25.1 supply the approved entry and loading flows; M26 defines the larger campaign and unlock rules. M27 and M28 provide world systems for M29's authored levels. M30 can proceed independently once its event/asset design is defined. M31 and M32 use representative M27–M29 content so visual work can be assessed in actual levels. M33 owns underground lighting and should be developed alongside M31, then checked with M32 character readability. M19 follows their integration, with balance checks during each milestone rather than postponed until the end.

Exact campaign length, level dimensions, unlock sequence, gem counts, raid timings and audio/art asset choices remain provisional. M26 establishes the campaign brief and M29 owns concrete layouts; do not invent fixed numerical design rules in several documents. Preserve the single terrain layer, shared gold currency, autonomous movement, fog rules and sidebar-only information. This roadmap adds no saves, accounts, multiplayer or production release infrastructure and does not reinstate M12 or M15.

### M19 — Integrated balance and complete-level playtesting

Dependencies: completed gameplay foundations and integrated M23–M34, including M25.1. M12 and M15 are excluded.

- Tune starting economy, Stonehand creation cost, dwarf wages, support capacity, specialist arrivals, training/combat XP, spells, bridges and enemy pressure together.
- Play complete levels from ordinary starting conditions without free construction, supplied stocks, spawned defenders or shortened debug timers. Ensure the onward Hearthstone is challenging but reachable with the tools/resources available on that level.
- Check multiple layouts/approaches, escalating threats, recovery from losses and the Library's continuing usefulness. Correct gameplay blockers and visual/sidebar readability problems found during those runs.

Complete when the authored campaign can be played from fresh start through its endpoint using normal rules, defeat is demonstrable, and focused regressions plus browser playtests cover the discovered issues. Record tested routes, timings, provisional values and remaining content/visual limitations. This is a prototype balance pass, not production release machinery or a requirement for final art assets.

### M26 — Campaign structure and gradual content unlocks

- Write a campaign brief with a proposed level count/order, regional journey, learning goal, introduced rooms/characters/tools, revisited mechanics and endpoint for each level. The existing two levels are proof-of-concept content, not the required final campaign structure.
- Begin with Stonehands, Cave Hounds and the basic settlement rooms; introduce Warriors, Engineers and Runesmiths gradually across subsequent levels with their supporting rooms, defenses and spells.
- Allow enough development time and suitable challenges after each introduction for the new role to matter. Reuse earlier roles in later levels rather than replacing them.
- Implement declarative per-level availability and campaign unlock transitions using existing content IDs. Apply restrictions consistently to menus, room construction, recruitment, production and research; keep intentional debug access separate.
- Specify carried knowledge, fresh local state and standalone starting unlocks in levels.md, with supporting character/room/spell rules in their owning documents.

Complete when the campaign brief covers a coherent beginning-to-end progression and checks show early levels cannot acquire later roles/tools, travel unlocks the intended content, restarts restore arrival knowledge, and free play starts with its authored availability.

### M27 — Living biomes and recurring enemy pressure

Dependencies: M26's progression brief for threat pacing; extend the existing enemy and encounter systems.

- Define recognizable upper-workings, fungal, ancient, crystal and volcanic habitats using the existing roster. Give authored territories natural caverns, branching tunnels, nests or halls that fit their inhabitants.
- Add autonomous local movement before combat: suitable roaming, patrol, nesting or deliberate sentry behavior by species/group. Idle enemies should appear intentionally dormant or guarding rather than all waiting motionless in rooms.
- Separate habitat activity from attacks on the settlement. Configure which species/groups raid, what activates them, their warning/cadence, group makeup and recovery intervals by level/source; not every creature should launch scheduled attacks.
- Build distinct challenges from existing abilities: organized goblin groups, burrowing flanks, fungal control, armored guardians, crystal ranged pressure and volcanic terrain access. Define readable cues and available counters.
- Preserve physical routes, fog, bedrock and resource protections, blocked-wave handling and source suppression. Pressure must offer respite and a way to secure territory rather than accumulate unseen attackers indefinitely.
- Keep habitat, movement and pressure parameters editable and document behavior in enemies.md and levels.md.

Complete when normal levels show natural movement before contact and several distinct, recurring attacks through real routes, with visible warnings, meaningful counters, source clearing and recovery opportunities. Verify hidden activity does not disclose enemies and blocked routes do not cause teleporting or wave buildup.

### M28 — Discoverable and reclaimable dwarven ruins

Dependencies: M26's availability rules; coordinate inhabitants with M27.

- Author lost dwarven sites with coherent room arrangements, corridors, collapsed approaches and recognizable remnants, concealed by normal discovery.
- Support neutral pre-laid room areas that players can reach, secure, claim and take over through actual gameplay systems. Define claiming costs/time, ownership conversion and when service capacity becomes usable in rooms.md and levels.md.
- Reclaimed facilities use ordinary room capacity, automatic cosmetic furnishings, recruitment and access rules. Define how locked campaign room types are handled so ruins cannot accidentally bypass progression.
- Keep ruin repair chains, door maintenance and new relic currencies outside this milestone. Decorative damage does not imply a new repair system.
- Make reusable ruin definitions available to level authors, including irregular and partially obstructed sites.

Complete when a player discovers an occupied ruin, clears its approach, claims its rooms and uses their normal services. Follow the room checklist for access, irregular layouts, capacity, automatic furnishings and free construction behavior; verify claiming cannot grant inaccessible or locked services.

### M29 — Authored campaign levels and resource-led exploration

Dependencies: M25–M28; use M24's provisional role balance.

- Build the sequence established by M26, expanding or replacing prototype layouts as needed. Set each map's playable space and pacing around actual settlement growth, specialist use and its primary challenge, rather than increasing dimensions alone.
- Place gold seams deliberately to suggest routes, stage expansion and draw players toward discoveries. Provide a viable finite-gold opening and choices between safer income and exposed rewards.
- Make renewable gems rare strategic destinations, not a routine deposit beside every start. Allow gem-free levels; each placed gem needs an authored reason, access challenge and economic consequence.
- Combine themed natural caverns/tunnels, reclaimed ruins, bedrock barriers, alternate routes and biome pressure. Give maps distinct layouts instead of rectangular monster rooms appended to a main corridor.
- Keep resource visibility as currently agreed: gold/gems guide exploration through fog without revealing surrounding terrain, inhabitants or the onward stone.
- Document each level's purpose, availability, resource rationale, threats and intended/alternate routes in levels.md. Keep existing prototype levels in free play only if deliberately retained as playable content.

Complete when the authored campaign has a clear endpoint and each level is playable from normal starting conditions with its permitted roster, introduces or meaningfully reuses a specialist/tool, and has deliberate resource destinations. Check at least an intended route and an alternate approach per level; confirm no mandatory objective depends on unavailable tools or inaccessible income.

### M30 — Sound and music foundation

- Establish an audio direction for underground ambience, restrained music and readable action feedback. Select or create suitable assets and track their source/license where applicable.
- Add sounds for excavation, claiming/reinforcement, resource delivery, building, room activity, movement, species-specific combat, spells, warnings and Hearth success/defeat.
- Use biome ambience and restrained exploration/combat music transitions to support atmosphere without masking warnings. Avoid dense repetitive worker sounds dominating large settlements.
- Drive audio from gameplay events through a small audio service; handle browser interaction-based audio startup, distance/visibility, simultaneous-sound limits and pause/menu/travel cleanup.
- Provide master, music and effects volume plus mute in settings, held in session memory. Hidden threats must not be revealed through precise positional cues; critical warnings remain visually available.
- Add an audio design document linked from README, covering cues, assets and controls.

Complete when a full level has coherent ambience and action feedback, controls work after browser audio activation, and restart/travel/pause do not duplicate or strand sounds. Listen through quiet building, crowded work and combat; verify muted play still communicates essential information.

### M31 — Environment and room graphics refinement

Dependencies: representative M27–M29 content.

- Audit actual gameplay against approved concept art at ordinary zoom and multiple camera angles; turn the reported clunkiness into an explicit list of visible problems with before/after captures.
- Refine terrain joins, exposed wall faces, material scale, excavation transitions, resource silhouettes, water/lava/bridge edges, room floors and furnishing placement.
- Give biomes and ruins a coherent visual identity through geometry, materials and restrained atmosphere, coordinating lighting with M33, while keeping gameplay tiles, diggable terrain, bedrock and resources easy to distinguish.
- Check single-tile, narrow and irregular rooms, camera occlusion and fog boundaries. Decorations remain cosmetic and the single terrain layer remains unchanged.
- Prioritize the largest visible improvements using editable shared assets/materials; do not require final production art or replace the renderer.

Complete when the recorded environment issues are resolved or explicitly retained as limitations, representative new levels read clearly at play distance, room-checklist visual cases pass, and targeted browser checks show acceptable responsiveness and no discovery leaks.

### M32 — Character animation and combat readability refinement

Dependencies: M24 balance and M27 behavior; coordinate presentation with M31.

- Audit Stonehands, hounds, specialists and the ten enemies in real movement/work/combat scenes against their approved references.
- Fix conspicuous sliding, abrupt turns, intersections, awkward proportions, repeated poses and disconnected attack/hit timing. Preserve recognizable silhouettes at normal camera distance.
- Make digging, reinforcing, hauling, crafting, research, rest, patrol and each enemy's distinctive attacks readable through poses and restrained effects. Integrate M30 sound cues with visible action timing.
- Preserve simulation authority, continuous movement, reduced-motion support and sidebar-only health/status information; visual refinement must not silently change hit ranges or terrain access.

Complete when representative work loops, group travel and mixed-species combat read clearly at ordinary zoom and reverse angles, attack feedback matches actual outcomes, and the recorded animation defects are resolved or documented. Check large-group responsiveness without running unrelated gameplay suites for cosmetic edits.

### M33 — Underground lighting, source glows and pointer illumination

Coordinate with M31's environment materials and M32's character readability; use representative rooms, caverns and ruins from M27–M29.

**Current test room:** Debug → Test harnesses → M33 lighting test room opens a paused furnished settlement with lamps, Hearth, gems, lava/water bridges and a sealed fog pocket. Sidebar controls adjust ambient/directional light, source intensity/radius, glow and pointer illumination; a comparison toggle restores the current renderer. Reset and Return to stronghold preserve the existing harness rules. See [graphics direction and limits](graphics-pass.md#m33-lighting-test-room). This experiment is confined to the test world; biome palettes, campaign integration and the completion checks below remain unfinished.

- Establish an underground mood with subdued, tunable ambient illumination and localized pools of light. Keep terrain, units, tools and routes readable at normal play distance without flattening the scene into uniform brightness.
- Give lamps, the Hearth, lava and other appropriate emissive features a visible glow and illumination on nearby surfaces. Tune source color, intensity, radius, falloff and restrained bloom together; bright materials alone should not substitute for lighting their surroundings.
- Use biome-specific ambient palettes and light sources to distinguish warm inhabited rooms, cold ruins, fungal caves and volcanic depths. Avoid distracting flicker and respect reduced-motion settings.
- Add a soft light around the pointer's world position to illuminate the area beneath it. Follow the actual hovered surface as the camera pans, rotates and zooms; hide it over the sidebar, menus or when the pointer leaves the game. Keep the current tool icon and tile preview clear.
- Lighting is presentation only: neither pointer illumination nor source glow discovers tiles, exposes concealed rooms/enemies or changes targeting. Preserve the existing exception that gold/gems remain visible through fog; prevent glow spilling through fog or walls from disclosing hidden sources.
- Keep light settings in shared editable definitions, bound the cost of many sources and clean up lights on restart/travel. Document the visual direction and pointer behavior in the owning graphics/interface documentation during implementation.

Complete when ordinary play shows clear source glows, illuminated surroundings and a coherent underground mood across representative biomes, with a useful pointer light. Compare before/after captures at normal zoom and multiple angles; browser-check pointer tracking, UI suppression, fog boundaries, reduced motion and responsiveness in a furnished settlement.
