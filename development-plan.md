# Current development notes

The existing browser game is implemented. The active roadmap is a redesign of all five campaign levels and the seven additional standalone Free Play levels for distinct geography, stronger environmental identity and larger useful spaces, especially later in the campaign. Standalone designs may reuse campaign elements, combine them or establish unique identities. Completed milestone specifications, authorization history, dated checks and superseded design drafts are in the [archive](archive/README.md); read them only when historical context is needed.

## Active level redesign milestones

The user authorized execution of M35–M42, with newly generated concept art at the start of every milestone. [Campaign and standalone level overhaul](level-overhaul.md) owns the shared criteria, provisional dimensions, per-level requirements and acceptance evidence. Current progress is tracked below; campaign order, gradual unlocks and the shared Hearthstone objective remain unchanged.

| Milestone | Scope | Status |
|---|---|---|
| M35 | Five distinct level briefs, comparison baselines and minimal authoring groundwork | Complete; evidence in archive |
| M36 | Border Foothold: sheltered basin and abandoned workings | Both paid approaches pass; visual review in progress |
| M37 | Fungal Hollows: cavern basin, looping land routes and living colonies | Concept created; replacement in development |
| M38 | Fallen City: buried streets and coherent reclaimable districts | Concept created; replacement in development |
| M39 | Crystal Divide: fractured spine, chasm routes and optional remote income | Planned; after M38 |
| M40 | Royal Deep: large lava basin, peninsula districts and distinct crossing choices | Planned; after M39 |
| M41 | Campaign-wide identity, pacing, scale and integration review | Planned; after all five replacements |
| M42 | Redesign all seven standalone Free Play levels using shared elements, new combinations or unique geography | Planned; after M41 |

Closure requires both functional verification and a recorded design review of geography, useful scale, fogged exploration and normal-zoom atmosphere. Passing route tests or producing screenshots alone is insufficient. Preserve old layouts as development comparisons during iteration and all permanent baseline renderers. Move completed evidence to the archive as work lands.

## Remaining review

- **Audio listening feedback:** procedural ambience, music and effects are implemented; playback, controls and cleanup have automated verification. Listening through quiet building, crowded work and combat remains pending. Use [audio-design.md](audio-design.md) and the recorded sample at `test-results/m30/work-combat.webm` when locally available. Do not infer listening approval from playback checks.

The level redesign roadmap above is the current planned work. Deferred concepts below are not part of that roadmap.

## Current implementation status

The game has a five-area authored campaign, twelve independent Free Play entries, staged content unlocks, living regional inhabitants and recurring raids, reclaimable ruins, targeted spells, manufactured defenses and source/pointer lighting. [Levels](levels.md) owns availability and travel; the companion rule documents own behavior and provisional balance.

| Room or structure | Current status | Remaining integration |
|---|---|---|
| Treasure Room | Implemented: floor-area gold capacity, hauling and physical wage collection; sequential visible gold piles | — |
| Dormitory | Implemented: floor-area accommodation and autonomous rest; bedding appears for assigned residents with role-specific shapes | — |
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

- [Character and terrain graphics](graphics-overhaul.md): six resident and ten enemy models, generated terrain materials, and permanent original/current comparison studios.
- [Room presentation](room-overhaul.md): six distinctive floors, sparse equipment, wealth-driven gold piles and resident-assigned bedding; capacity remains floor-based.
- [Spells, traps and Hearthstones](arcana-overhaul.md): thirteen paired exhibits with state playback and concept references.
- [Rendering and lighting](graphics.md): current animation timing, source/pointer lighting, ownership and practical limits.
- [Development tools](development-tools.md): room construction, gameplay harnesses, comparisons, and whole-level map/3D preview. Test worlds preserve the stronghold in memory.

Keep the original `*-baseline.ts` renderers, independent reference materials and `room-decoration-baseline.ts` intact during later visual work. Concept art and exact generation prompts remain provenance and visual references, not additional gameplay requirements.

## Known limitations and deferred scope

- The current campaign has functioning biome enemies, hazards, ruins and palettes, but repeats its overall start/objective placement, central divider and route structure. M35–M41 address the geographic and environmental shortfall; historical M29 route verification establishes playability of the old maps, not completion of this redesign.
- Guard Posts and assigned guard duties, general specialist retreat, door repairs/upgrades in place, core repairs and structure maintenance are deferred. Mining-worker escape and hound patrol/response are implemented.
- The legacy Miner is retained for debug and comparison; converting it into a basic fighter is deferred. Tunnel Badgers and Ranger remain concepts. Separate Smith, Priest, expedition leader, Forge, Brewery, Barracks, Ranger Lodge and Ancestral Shrine are outside the current roster/room design.
- Economy, recruitment, combat and research values are tunable prototype choices. Authored intended/alternate campaign routes have verification, but arbitrary layouts are not guaranteed to succeed. No free replacement or additional defeat rule exists when all Stonehands are lost and funds cannot buy another.
- Art is procedural. Finger/cloth articulation, exact furniture contact, detailed cast shadows and some close crowd intersections remain limited. Dense furnished scenes cost more than arrivals on integrated graphics; historical measurements are in the archive and require new measurement after rendering changes.
- Wages with blocked access can repeat route queries. Current tested populations remain usable.
- No game saves, accounts, multiplayer, cloud services or production release infrastructure. Reload loses the session.

## Keeping documentation current

Update this inventory and the owning rule document whenever content or its normal/debug availability changes. Keep active documents about current behavior, practical constraints and useful authoring procedures. Put dated completion records in [development history](archive/development-history.md), with historical scope changes in the archive. A registered definition or concept alone does not prove a feature works.

Read [AGENTS.md](AGENTS.md) for development priorities and [development-tools.md](development-tools.md#verify-a-change) for focused verification. Documentation-only edits require text/link review, not game tests or builds.
