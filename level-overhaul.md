# Campaign and standalone level overhaul

Active milestone specifications for redoing all five campaign levels and the seven additional standalone Free Play levels. The [development plan](development-plan.md#active-level-redesign-milestones) owns progress; this document owns redesign criteria, provisional size targets and milestone scope. The current playable maps remain documented in [Levels](levels.md) until their replacements are implemented.

The user requested a new milestone set after reviewing the gap between the closed biome/map milestones and the delivered environments, and asked for larger levels, especially later in the campaign. This roadmap addresses unfinished geographic and environmental goals from M27–M29/M31. It does not erase their delivered systems or historical verification. The [Dungeon Keeper research](research/dungeon-keeper-level-variety.md) supplies rationale and references; the specifications below govern this work and supersede its suggested experimental implementation order.

This is a planning baseline. No redesign milestone is implemented yet. Preserve the campaign order and unlock schedule while developing replacements in campaign order, so each stage establishes the next stage's pacing and scale. M42 then updates the separate standalone catalog, using campaign elements, new combinations or unique designs as appropriate.

## Shared design criteria

### Geography and spatial identity

- Each map needs a different organizing landform or architectural structure, a distinct starting context and a distinct approach to its relay. Changing colors, map rotation, enemies or dimensions alone does not satisfy this requirement.
- Author large formations first, then chambers, routes, resources, ruins and inhabitants. Use connected bedrock ridges, branching waterways, basins, peninsulas or buried streets as appropriate. Natural outlines should have broad bends, bays and changing widths; avoid uniform edge noise and repeated rectangular chambers.
- Keep constructed areas deliberately architectural: aligned streets, thresholds, adjoining rooms and coherent districts. Contrast their structure with natural caves and collapse. Organic does not mean every room is asymmetric.
- Remove the shared southwest-start/northeast-relay/central-divider layout requirement. Choose anchors, resource patterns and defensive approaches independently for each map. Reusable authoring helpers must not impose another shared map skeleton.
- Preserve areas where players can excavate their own settlements. Pre-existing scenery must leave meaningful buildable space and expansion choices, including irregular and narrow room footprints.

### Exploration, resources and pressure

- Each level needs an intended and an alternate viable approach with a real tradeoff in exposure, excavation, hauling, reclamation or crossings. Two near-identical corridors to the same fight are insufficient. Later maps should combine several connected districts and optional branches without becoming obligatory mazes.
- Give discovery a rhythm: a breach, a bend, a broader reveal, a landmark or useful find, and opportunities to consolidate. Evaluate this with ordinary fog and scouting, not only a fully revealed map.
- Place optional discoveries that change a decision: usable ruins, finite gold, defended gems, a shortcut or a defensible expansion area. Quiet spaces are useful; every cavern need not contain a fight.
- Shape gold seams with the surrounding geology and give them deliberate destinations. Maintain reliable startup funding and the current rare-gem policy. Always-visible resources must not outline the hidden relay or disclose surrounding chambers.
- Match inhabitants and pressure to places: nests occupy sheltered branches, guards inhabit streets and halls, territorial hunters defend resource regions. Reuse existing movement and encounter services, with small editable extensions only where a specific level requires them.
- Opening a connection should sometimes change how the settlement is defended. Provide warning, recovery time and physically reachable source suppression. Larger maps must not create endless unseen waves or unavoidable attacks while residents traverse long routes.

### Look and feel

- Each level must have visible identity in geometry, architectural composition, surface treatment, clustered decoration and lighting at normal play zoom. A different ambient tint is insufficient.
- Include local contrast within each region: dry approaches against wet fungal banks, intact masonry against collapsed districts, dark fractures against crystal pockets, inhabited warmth against cold ruins. Use restrained authored presentation regions where useful, separate from terrain mechanics.
- Place a few recognizable landmarks and clusters instead of uniform prop scatter. Give ruins coherent room groups and connecting spaces; their actual services must remain ordinary gameplay rooms.
- Compose light around discovered spaces and important surfaces using the existing bounded source system. Preserve readability, fog boundaries and reduced motion. Darkness must not substitute for environment detail.
- Use the approved concepts as material and form references. New layout sketches guide geography, not new terrain layers, room capacities or incidental mechanics. New image generation is optional, not a milestone dependency.

## Size and pacing

These are **provisional authoring targets in terrain cells**, not accepted final dimensions or hard-coded test requirements. Keep the existing cell scale. Increase useful settlement space, landform scale, distinct destinations and route choices, especially later in the campaign.

| Level | Current dimensions | Initial redesign target | Purpose of the additional space |
|---|---|---|---|
| Border Foothold | 32×26 | **40×32** | A sheltered settlement basin, branching old workings and a separate watch site while retaining a short introductory arc |
| Fungal Hollows | 36×30 | **48×40** | Broad cavern lobes, connected dry routes around pools, separated colonies and a reclaimable waystation |
| Fallen City | 38×32 | **56×46** | Several coherent districts, a meaningful street network, buried connections and space for an established settlement |
| Crystal Divide | 38×30 | **64×52** | A substantial chasm/rock formation, separate crystal chambers and optional remote income with a defensible return route |
| Royal Deep | 40×32 | **72×60** | A large lava basin, royal districts on peninsulas, several useful crossing sites and a final defended precinct |

The last target has roughly 3.4 times the current map's tile area; that is not a target for 3.4 times the travel time, enemies or decorative meshes. Adjust dimensions and aspect ratios after reviewing real routes and performance; record the reason rather than silently padding or shrinking a map. Later levels should feel substantially broader in useful geography, not simply contain a larger border of solid earth.

For each level, record normal-play timing for establishing support, first meaningful discovery, first hostile contact, a representative gold haul, source suppression and relay activation. Include excavation time, food/rest/wage journeys and recovery from conflict. Use those observations to tune distances, local finite income and source timing. Do not automatically scale population, starting resources, movement speed or global economy to compensate for larger maps.

The campaign has no saves. Keep the main objective achievable within a practical session; larger late maps should offer optional depth and shortcuts without requiring exhaustive clearing. Assess later-stage rendering and pathfinding with an active developed settlement, not just a paused empty overview.

## Boundaries and implementation approach

- Preserve the single terrain layer, common floor height and substantial square excavation cells; continuously moving autonomous residents; shared gold; and sidebar information without floating world labels or bars.
- Preserve the fixed Hearth with its current starting walking ring, normal crew/economy, separate concealed relay and physical activation. The surrounding landscape and anchor positions may change. Begin each level with player excavation, not free prebuilt service rooms.
- Preserve the five-stage campaign availability schedule. Campaign Border through Crystal require land approaches around their hazards; campaign water/lava bridge construction belongs to Royal Deep. Standalone levels retain their own starting catalogs, which already permit bridges and all current room plans. Chasms remain unbridgeable. Reclaimed rooms cannot bypass locked plans.
- Keep authored deterministic layouts with editable definitions and stable level IDs. Add the smallest useful helpers for irregular areas, variable-width passages, terrain bands and transformed ruin placement; avoid a general procedural generator or a full map editor.
- Carry room construction and ruin reclamation through the real gameplay services. Apply the [room checklist](room-development-checklist.md) to changed room/ruin arrangements, including automatic furnishings, floor capacity, access, irregular shapes and free construction on/off.
- Retain old layouts as development comparison fixtures during the overhaul, outside the ordinary campaign catalog. Keep all permanent baseline renderers and independent material caches intact. Campaign and corresponding Free Play entries must use each completed replacement consistently; M42 redesigns the seven additional standalone entries as separate content.
- Use existing art and sound systems. Region-aware presentation helpers and a small landmark vocabulary are in scope when needed by these maps. New rooms, species, rival dungeon AI, victory systems, possession, game modes, persistence and a separate audio overhaul are outside this roadmap. Existing audio listening review remains pending.

## Milestones

### M35 — Level briefs, comparison baseline and authoring groundwork

Dependency: none of the new implementation milestones.

- Write a brief and a tile/layout sketch for each of the five replacements: organizing landform, start/relay placement, settlement growth, main/alternate approaches, optional discoveries, resource rationale, threats, local visual treatments and expected pacing.
- Review all five together in a common neutral terrain palette. Correct repeated silhouettes, route structures, anchor placement and defensive situations before detailed dressing. A rotated or enlarged copy does not pass.
- Capture current whole-level layouts and representative normal-zoom views. Make the old authored definitions reproducible as development comparisons using the existing level-preview workflow.
- Remove coordinate-dependent assumptions from authoring/verification as needed. Settlement and route fixtures must follow each level's authored geography rather than a shared western rectangle. Preserve meaningful economic/access checks and test actual gameplay systems.
- Implement only the reusable shape, ruin-transform and presentation-region support demonstrated as necessary by these briefs. Exercise it in a small real debug world, including terrain picking, discovery, room construction and cleanup.

**Complete when:** five distinct briefs and reviewable sketches exist, baseline comparisons are reproducible, needed helpers work through the normal world systems, and each campaign replacement has a concrete map design to implement. Standalone briefs are developed in M42. This milestone prepares the work; it does not close any level redesign.

### M36 — Border Foothold: sheltered basin and abandoned workings

Dependency: M35. Preserve the introductory roster and tools.

- Replace the straight divider with an enclosing, uneven bedrock formation and branching former mining passages. Keep a sheltered starting pocket with enough diggable land to establish rooms before exposing the main workings.
- Provide a short, more exposed gold-led approach toward the watch and a longer flank through an abandoned waystation. Make mining into the old route a deliberate decision about contact, income and base access.
- Distinguish dry natural walls from sparse timber-supported workings and the constructed watch site. Use bent mineral seams, a recognizable breached mining entrance and restrained warm lamps.
- Place goblin pressure and the burrower side territory to make those routes behave differently. Keep clear warnings, recovery opportunities and a manageable first-level duration despite the larger footprint.

**Complete when:** it reads as a sheltered foothold beside old workings, the early expansion remains understandable, both approaches succeed from normal starts, and the shared acceptance review passes.

### M37 — Fungal Hollows: cavern basin and living colonies

Dependency: M35–M36. Preserve Warrior/Training introduction and land-only required routes.

- Build a broad cavern system of uneven lobes, narrow necks and looping dry routes around connected pools. Use a substantial geological formation rather than a line dividing two halves.
- Separate the dry approach, damp margins, brood colony and abandoned waystation through forms, clustered fungi, webs and local light. Leave some broad cave floor open and some earth available for player expansion.
- Offer a short exposed route through control-heavy territory and a longer excavation/reclamation route that supports a second approach. Pools should shape these routes without requiring bridges or producing accidental dead ends.
- Tie spiders and the Spore Brute to recognizable colony spaces, and separate recurring entrance pressure from quiet exploration. Verify hound scouting does not turn the enlarged cavern into unavoidable early escalation.

**Complete when:** a player discovers a varied cavern system rather than adjacent monster rooms, land loops create genuine tactical alternatives, Warrior development is useful, and the shared acceptance review passes.

### M38 — Fallen City: buried streets and reclaimable districts

Dependency: M35–M37. Preserve Workshop/Engineer/defense introduction.

- Author a street network with a recognizable main junction, foundry/service district, barracks or watch district, and a defended relay precinct. These are arrangements of existing room types, not new room mechanics.
- Give architecture a coherent orientation and room relationships, then interrupt it with collapses, bedrock intrusions and buried service connections. Keep useful excavatable space beside the streets for the player's own settlement.
- Make district reclamation compete with a more direct advance. Opening streets should change the number or direction of exposed approaches; buried side connections should provide meaningful flanks or shorter hauling routes.
- Use thresholds, broken paving, substantial masonry and a small set of industrial remnants to distinguish districts at normal zoom. Place guards and the Sentinel where actual routes make their defenses meaningful, with Workshops and manufactured defenses useful in ordinary play.

**Complete when:** the map reads as a former settlement with connected districts, claiming a district changes development or defense, route choices use the new specialist/tools, and the shared acceptance review passes.

### M39 — Crystal Divide: fractured spine and remote income

Dependency: M35–M38. Preserve Library/Runesmith/spell introduction; bridges remain unavailable.

- Create a substantial branching rock spine and crescent-like chasm with distinct dry routes around its ends. Vary chamber size and sight lines, avoiding a straight wall with two identical gaps.
- Put the archive and a guarded gem region on purposeful branches. Maintain sufficient finite income for relay completion so a remote gem remains an optional strategic commitment.
- Make the main route shorter but more exposed to ranged pressure, and the alternate approach more sheltered or useful for reclamation and defended hauling. Preserve practical food, rest and wage access over the larger distances.
- Contrast dark fractures, broad mineral faces, sparse large crystal clusters and cold abandoned architecture. Distinguish decorative crystal from the actual mineable gem resource.
- Place Elementals and Stalkers so terrain, trained defenders and prepared spells create useful counters without requiring new combat abilities.

**Complete when:** the divide is a defining navigational feature, remote income creates a real but optional defense/hauling choice, both land approaches work with this stage's tools, and the shared acceptance review passes.

### M40 — Royal Deep: lava basin and royal precincts

Dependency: M35–M39. Combine the full existing roster and tools, including bridges.

- Replace the full-height straight lava strip with a large basin and branches surrounding peninsulas of royal ruins. Keep all traversable surfaces on the common floor plane.
- Provide distinct crossing sites: a short exposed bridgehead and a longer crossing onto a safer or more useful bank. Use shore geometry and connecting royal districts to make the choices affect defense and supply, not merely bridge price.
- Separate settlement expansion, optional income/foundry reclamation and the final royal approach into connected places with recognizable landmarks. The largest map must have optional depth without requiring every district to be cleared.
- Contrast monumental masonry, scorched ruined halls, dark geological walls and lava-lit margins. Retain readable banks, bridge plans and routes from multiple camera angles.
- Use Cinderling terrain access and Deepmaw pressure to test the combined settlement, defenses and spells. Make the recurring source physically suppressible and give players time to consolidate captured banks.

**Complete when:** the map feels substantially broader than earlier areas, its crossing decisions meaningfully change the expedition, final activation is achievable with a normal economy, and the shared acceptance review passes under a developed active settlement workload.

### M41 — Campaign-wide identity, pacing and scale review

Dependency: M36–M40.

- Compare all five completed maps together, both in neutral terrain views and finished rendering. Revise any pair that still shares its overall strategic structure despite different decoration.
- Play the campaign through normal travel and repeat each level's alternate approach through focused checks. Verify availability, researched-knowledge carryover, restart, Free Play correspondence, defeat and the final endpoint after replacement integration.
- Review growth in useful map scale, discovery rhythm, excavation burden, hauling, needs journeys, pressure cadence and practical session length. Fix long uneventful transit, mandatory exhaustive clearing, automatic scouting escalation or income traps revealed by larger layouts.
- Measure late-game rendering and simulation responsiveness on the same machine/workload used for comparison. Report actual conditions and results; fix material regressions instead of treating old paused-start FPS as evidence for the new maps.
- Update current level descriptions, briefings and authoring guidance to match the delivered worlds. Preserve permanent visual baselines; retire temporary comparison-only controls when no longer useful and archive their layout provenance.

**Complete when:** the five-level journey meets both the functional and experiential criteria below, intended/alternate routes are demonstrated, major identity or pacing shortcomings are resolved, and any lesser retained limits are stated explicitly. Move completion records to the archive; do not leave successful test counts as a substitute for the design review.

### M42 — Standalone Free Play level redesign

Dependency: M41, using the campaign's completed authoring and environment improvements.

- Update all seven standalone entries: the legacy Border Foothold, Emberwater Crossing, and the upper, fungal, ancient, crystal and volcanic regional maps. The five entries marked Campaign already receive the campaign replacements through M36–M41; they are checked for consistency here rather than redesigned again. Debug harnesses are not standalone levels.
- Give each standalone map a brief, layout sketch and a clear reason to choose it. It may reuse campaign landforms, districts, ruins, materials, landmarks and habitat arrangements; combine elements from several regions; or use an original geography and theme. Reuse should produce a deliberately composed scenario with a meaningful difference in routes, resources, pressure or settlement planning, not merely another recolored campaign copy.
- Apply the shared geography, atmosphere, discovery, room-access and useful-scale criteria. Choose and record provisional dimensions per standalone brief; increase useful space where it improves the scenario without forcing a campaign-like size progression across an unordered catalog. A focused crossing map may stay smaller than an expansive mixed-region expedition.
- Rework Emberwater's water-and-lava crossing identity into coherent geography, and distinguish standalone Border Foothold from its campaign counterpart. Give each regional map a complete exploration and settlement arc rather than leaving it as a small encounter demonstration. Unique themes use the existing terrain, rooms, enemies and objective systems.
- Preserve stable catalog IDs and independent starting availability: normal crew and economy, all existing standalone room/building plans, roles and research availability, but no already-researched spells or free service rooms. Research, recruitment, paid construction, hazards, source suppression and physical relay activation must work normally. Victory remains standalone completion with restart/menu; campaign progress neither unlocks nor changes these starts.
- Replace the playable definitions and update names/descriptions, previews and representative art references where needed to describe the delivered maps. Preserve the old layouts as development comparisons during iteration. Review all seven alongside the campaign catalog so reused elements still leave a varied collection.
- Demonstrate an intended and a meaningfully different alternate approach for every standalone map from its actual paid starting conditions. Reuse selectable verification flows for start/restart, economy, exploration, reclamation, combat, crossings where present and relay completion. Check independent session state and that shared definition/asset changes have not altered the completed campaign unintentionally; broaden campaign checks only for affected systems.

**Complete when:** all seven standalone entries are updated, each has a documented scenario identity and reviewed old/new comparisons, shared functional and design acceptance passes for each, and the full Free Play catalog accurately presents the redesigned maps. Finish the work in reasonable per-map commits within this milestone. A refreshed menu, copied assets or a subset of updated maps does not close M42.

## Acceptance and evidence for every redesigned level

Keep functional verification and design review separate in each milestone record. Both must pass before marking it complete. For M42, assess routes against each standalone entry's own starting catalog and compare identity across both standalone and campaign maps; campaign unlock order and increasing stage sizes do not apply to standalone entries.

| Review | Required evidence and decision |
|---|---|
| Geographic identity | Current/replacement whole-level comparisons in the same neutral palette, with names hidden during inspection. Explain the new landform, route structure and defensive situation, and how they differ from the other campaign maps. Repeated topology is a design failure even when tests pass. |
| Useful scale | Show where the additional area provides settlement expansion, a district, a landform or a meaningful choice. Record travel/excavation observations; padding with solid border or long empty tunnels does not pass. |
| Discovery and atmosphere | Review ordinary fogged exploration plus normal-zoom, alternate-angle views of the start, a natural area and a ruin/landmark. Evaluate local variation, reveal sequence and readability, not just whether screenshots were produced. Include both intact wilderness and a developed settlement. |
| Choices and economy | Demonstrate paid intended and alternate approaches from normal starts with the stage's actual availability. State their different costs/risks/rewards. Check startup room space, finite income, optional gems, needs journeys and practical relay activation. Debug disclosure/teleporting is not normal-route evidence. |
| Rooms and inhabitants | Verify actual reclaiming, capacity, automatic furnishings, free construction and narrow/irregular access through the room checklist. Observe natural pre-contact activity, opened attack routes, warnings, recovery and source suppression without discovery leaks. |
| Responsiveness | Check picking, camera/minimap/full-map framing, fog, reload/reset and visible traversal on the enlarged level. Profile a developed active late-level workload where increased scale could materially affect performance; record machine and conditions. |

Use `npm run verify -- <focused scope or test>` and one source/test typecheck for the actual code changes, plus the relevant browser checks for changed presentation. Select or extend existing checks rather than creating five duplicated browser suites. Broader campaign playtests and performance review belong to M41 and substantial integration changes. A documentation-only milestone update needs text/link review, not executable tests or a build.

Each completion record should include what changed, functional results, the design-review conclusion, comparison captures/route evidence, and retained limitations. A material failure of geographic identity, readable atmosphere, useful scale or playable pacing keeps the milestone unfinished even if the code and simulation tests pass. This does not introduce a new approval workflow; it makes the previously missed design requirements explicit.
