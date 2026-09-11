# Current development notes

The browser game and the M35–M42 level redesign are implemented. All five campaign levels and seven additional standalone Free Play levels have distinct geography, local environmental treatments and larger useful spaces. Completed milestone specifications, authorization history, dated checks and superseded design drafts are in the [archive](archive/README.md); read them only when historical context is needed.

## Delivered level redesign

M35–M42 are complete. The campaign grows from sheltered mining workings through wet cavern lobes, buried city streets and a crescent fracture to royal peninsulas around lava. Seven standalone scenarios reuse these materials in separate mine, quarry, crossing, wetland, mineral and caldera geographies. Campaign order, gradual unlocks and physical Hearthstone activation remain unchanged.

[Levels](levels.md) owns the current catalog and dimensions; [level overhaul](level-overhaul.md) owns authoring and acceptance requirements. The [fourteen concepts](concept-art/levels/overhaul/README.md) were created before their corresponding work. Paid intended/alternate approaches, campaign travel, ordinary-fog exploration, neutral identity comparisons, normal/reverse atmosphere reviews and developed active performance are recorded in [development history](archive/development-history.md). The original twelve layouts and permanent renderer baselines remain available for comparison.

## Remaining review

- **Home rooms and corridors:** the user's clarified settlement requirement exposed a gap in the completed level checks: paid routes used broad excavated clearings with small room patches. A [twelve-map spatial audit](research/hearth-settlement-audit.md) now demonstrates separate room/corridor layouts on the existing terrain. Updating the paid examples and verifying construction, recruitment, needs/wages and completion with these layouts remains pending. The historical M35–M42 passes do not establish this additional criterion.
- **Audio listening feedback:** procedural ambience, music and effects are implemented; playback, controls and cleanup have automated verification. Listening through quiet building, crowded work and combat remains pending. Use [audio-design.md](audio-design.md) and the recorded sample at `test-results/m30/work-combat.webm` when locally available. Do not infer listening approval from playback checks.

M35–M42 completion records remain historical; the follow-up settlement review above is current unfinished work. Deferred concepts below are outside that review.

## Current implementation status

The game has a five-area authored campaign, thirteen independent Free Play entries (including the peaceful Hearthside Halls building study), staged content unlocks, living regional inhabitants and recurring raids, reclaimable ruins, targeted spells, manufactured defenses and source/pointer lighting. [Levels](levels.md) owns availability and travel; the companion rule documents own behavior and provisional balance.

| Room or structure | Current status | Remaining integration |
|---|---|---|
| Treasure Room | Implemented: floor-area gold capacity, hauling and physical wage collection; sequential visible gold piles | — |
| Dormitory | Implemented: floor-area accommodation and autonomous rest; bedding appears for assigned residents with role-specific shapes | — |
| Kitchen | Implemented: floor-area population support and autonomous meals; food props are decorative, with no ingredient or food inventories | — |
| Workshop | Implemented: floor-area concurrent Engineer capacity, attraction, staffed production of all three door tiers and both traps, shared finished stock for placement | Repairs and future fixture upkeep deferred |
| Training Room | Implemented: floor-area concurrent trainee capacity, specialist levels 1–5 with defined practice requirements and health/combat/work values, one level per visit followed by a personal cooldown, and Warrior attraction | — |
| Library | Implemented: floor-area concurrent researcher capacity, targeted spell research/preparation/casting and Runesmith attraction; catalog in [Spells](spells.md) | — |
| Guard Post | Deferred; disabled catalog placeholder | Outside current scope |
| Stone Hearth | Implemented: fixed 400-health core, physical enemy attacks, defeat/restart, Stonehand creation/specialist arrivals and starter treasury | No repair, upgrades or relocation in current scope |
| Onward Hearthstone | Implemented: hidden authored stone, physical access/security, eight-second autonomous activation, local completion and progression readiness | — |
| Bridge | Implemented: paid worker construction over water/lava, shore support, shared traversal, refunds and protected removal; no service capacity or fixtures | Chasms intentionally unbridgeable |
| Timber / Reinforced / Steel doors | Implemented in normal play: manufacture, placement, increasing health, Open/Closed/Locked access, dwarf passage, sight blocking and breakage | Repairs and upgrades in place deferred |
| Spike trap | Implemented in normal play: manufacture, placement, enemy damage, brief pinning and automatic cooldown reset | — |
| Bolt trap | Implemented in normal play: manufacture, placement, directional first-target shots, line of sight and automatic cooldown reset | — |
| All ten enemies | Implemented: species-specific local movement in campaign and Free Play, editable regional roster, melee/ranged/breaching roles, terrain/control interactions, encounter sources and visual/debug gallery | — |

| Workforce type | Current status | Remaining integration |
|---|---|---|
| Cave Hound | Implemented: Dormitory-only arrival; den needs, no wages/training; continuous shared patrol, new-passage exploration, settlement-wide sighting/attack response, physical melee and Call to Arms, dedicated quadruped model | Campaign balance verified; values remain tunable |
| Stonehand | Implemented: starting crew, population-priced Hearth creation (50 + 25 per living Stonehand), shared terrain pool and stable 20-second productive assignments; no needs, support slots, pay, training, morale or combat; 30 health, cargo drops on destruction; accepted v2 mechanical model | Balance values provisional |
| Miner | Retained definition, model and debug fixtures; fixed level 1, legacy work and self-defense | Possible basic fighter repurposing deferred |
| Engineer | Implemented: normal Workshop-based arrivals, crafting, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Repairs deferred |
| Warrior | Implemented: normal arrivals, shared needs/wages/departure, levels 1–5, autonomous melee combat and Call to Arms response | Guarding and retreat deferred |
| Runesmith | Implemented: normal Library-based arrivals, appearance, research/preparation, shared food/rest/wages/departure, levels 1–5 and adjacent self-defense; also in Debug | Additional personal combat abilities |

## Current presentation and inspection

- **Left controls:** approved Carved Stronghold styling, icon-only navigation and secondary disclosures, blue selection outlines/runes, and a persistent pause control. Redundant captions, slogans, empty threat reports and default tool cards are removed. [Interface text budget](gameplay-interface.md#sidebar-text-budget) records why the remaining text is visible.

- **Hearthside Halls:** a new 46×40 peaceful Free Play map and a completed base under **Level preview → Showcases**. Ordinary paid excavation/construction produces six separate chambers, two-tile main halls, six manufactured doors and natural residents with working needs/wages. The same terrain and finite resources are available to the player; [Levels](levels.md#hearthside-halls-building-showcase) gives the build sequence. This independent showcase does not close the twelve existing maps' pending settlement acceptance review.
- [Character and terrain graphics](graphics-overhaul.md): six resident and ten enemy models, generated terrain materials, and permanent original/current comparison studios.
- [Room presentation](room-overhaul.md): six distinctive floors, sparse equipment, wealth-driven gold piles and resident-assigned bedding; capacity remains floor-based.
- [Spells, traps and Hearthstones](arcana-overhaul.md): thirteen paired exhibits with state playback and concept references.
- [Rendering and lighting](graphics.md): current animation timing, source/pointer lighting, ownership and practical limits.
- [Development tools](development-tools.md): room construction, gameplay harnesses, comparisons, and whole-level map/3D preview. Test worlds preserve the stronghold in memory.

Keep the original `*-baseline.ts` renderers, independent reference materials and `room-decoration-baseline.ts` intact during later visual work. Concept art and exact generation prompts remain provenance and visual references, not additional gameplay requirements.

## Known limitations and deferred scope

- The larger maps use ordinary needs, movement and recruitment, so opening multiple hostile routes at once can still overwhelm an unprepared settlement. Example paid routes demonstrate viable choices, not guaranteed success for arbitrary excavation. The complete campaign remains a substantial single sitting without saves.
- Guard Posts and assigned guard duties, general specialist retreat, door repairs/upgrades in place, core repairs and structure maintenance are deferred. Mining-worker escape and hound patrol/response are implemented.
- The legacy Miner is retained for debug and comparison; converting it into a basic fighter is deferred. Tunnel Badgers and Ranger remain concepts. Separate Smith, Priest, expedition leader, Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are outside the current roster/room design.
- Economy, recruitment, combat and research values are tunable prototype choices. Authored intended/alternate campaign routes have verification, but arbitrary layouts are not guaranteed to succeed. No free replacement or additional defeat rule exists when all Stonehands are lost and funds cannot buy another.
- Art is procedural. Finger/cloth articulation, exact furniture contact, detailed cast shadows and some close crowd intersections remain limited. Terrain/fog batching and accelerated tile picking now reduce large-map rendering and interaction cost. The latest matched Royal check measured about 20% lower moving-pointer frame time; the fully revealed overview uses roughly two-thirds fewer draw calls. Dense developed scenes remain demanding on integrated graphics, and stationary frame times vary substantially with machine conditions. Detailed measurements and limits are in the latest [performance record](archive/development-history.md#2026-09-10--large-level-rendering-and-cursor-optimization).
- Wages with blocked access can repeat route queries. Current tested populations remain usable.
- No game saves, accounts, multiplayer, cloud services or production release infrastructure. Reload loses the session.

## Keeping documentation current

Update this inventory and the owning rule document whenever content or its normal/debug availability changes. Keep active documents about current behavior, practical constraints and useful authoring procedures. Put dated completion records in [development history](archive/development-history.md), with historical scope changes in the archive. A registered definition or concept alone does not prove a feature works.

Read [AGENTS.md](AGENTS.md) for development priorities and [development-tools.md](development-tools.md#verify-a-change) for focused verification. Documentation-only edits require text/link review, not game tests or builds.
