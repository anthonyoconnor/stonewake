# Campaign and standalone level overhaul

Current authoring and acceptance rules for campaign and standalone geography. [Levels](levels.md) owns the delivered catalog and dimensions; [current development notes](development-plan.md) owns implementation status and remaining review. The original M35–M42 dependencies, per-level specifications and provisional size targets are preserved in [the archived roadmap](archive/previous-docs/level-overhaul.md). Dated results belong in [development history](archive/development-history.md).

The [Dungeon Keeper research](research/dungeon-keeper-level-variety.md) explains why functioning biome enemies and palettes alone did not create distinct places. Geography, useful space and normal-play atmosphere must be reviewed explicitly alongside functional tests.

## Concept art first

The user requires new concept art at the start of each milestone, before implementation. Save each image and exact prompt in [the overhaul concept gallery](concept-art/levels/overhaul/README.md), inspect it, and record the direction and any incidental details that conflict with gameplay. M35–M42 produced an overall direction sheet, five individual campaign concepts, a cohesion sheet and seven standalone concepts. Use them during layout and normal-zoom review. Creation and review do not introduce another permission checkpoint.

## Shared design criteria

### Geography and spatial identity

- Each map needs a different organizing landform or architectural structure, a distinct starting context and a distinct approach to its relay. Changing colors, map rotation, enemies or dimensions alone does not satisfy this requirement.
- Author large formations first, then chambers, routes, resources, ruins and inhabitants. Use connected bedrock ridges, branching waterways, basins, peninsulas or buried streets as appropriate. Natural outlines should have broad bends, bays and changing widths; avoid uniform edge noise and repeated rectangular chambers.
- Keep constructed areas deliberately architectural: aligned streets, thresholds, adjoining rooms and coherent districts. Contrast their structure with natural caves and collapse. Organic does not mean every room is asymmetric.
- Remove the shared southwest-start/northeast-relay/central-divider layout requirement. Choose anchors, resource patterns and defensive approaches independently for each map. Reusable authoring helpers must not impose another shared map skeleton.
- Preserve areas where players can excavate their own settlements. Pre-existing scenery must leave meaningful buildable space and expansion choices, including irregular and narrow room footprints.
- Audit the land around the starting Hearth as a settlement of separate chambers and connecting corridors. Reserve real wall thickness, entrances, circulation and room expansion alongside the stage's available support and specialist rooms. Counting all nearby diggable cells or fitting room patches into one large excavated rectangle does not establish this. Example room envelopes are planning evidence, not new mechanical minimum sizes.

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
- Use the approved concepts as material and form references. Begin every milestone with new concept art under the requirement above. Layout sketches and concept images guide geography, not new terrain layers, room capacities or incidental mechanics.

## Size and pacing

Keep the existing cell scale. Extra area must add useful settlement space, large landforms, distinct destinations or meaningful route choices. Campaign scale grows toward Royal Deep; standalone maps form an unordered collection with dimensions chosen for their particular scenarios. Current dimensions are in [Levels](levels.md), and initial targets remain in the archived roadmap. Do not add solid borders or empty compulsory corridors merely to reach a target.

Record normal-play timing for establishing support, first useful discovery, hostile contact, representative physical gold delivery, source suppression and relay activation. Include excavation, food/rest/wage journeys and recovery from conflict. A delivery after launching an expedition may still originate at home; retain its source/destination and avoid describing it as remote income without checking those coordinates. Use these observations to tune distances, local finite income and source timing without automatically scaling movement, population or the global economy.

The campaign has no saves. Keep required objectives achievable in a practical session; optional districts and income should provide depth without exhaustive clearing. Check rendering and pathfinding with a developed, active late-level settlement. Record hardware, camera, population, rooms, furnishings, discovered area and frame timing. A comparison that removes local environment regions from the same developed world isolates atmosphere cost; it does not establish an old-map versus new-map performance regression.

## Boundaries and implementation approach

- Preserve the single terrain layer, common floor height and substantial square excavation cells; continuously moving autonomous residents; shared gold; and sidebar information without floating world labels or bars.
- Preserve the fixed Hearth with its current starting walking ring, normal crew/economy, separate concealed relay and physical activation. The surrounding landscape and anchor positions may change. Begin each level with player excavation, not free prebuilt service rooms.
- Preserve the five-stage campaign availability schedule. Campaign Border through Crystal require land approaches around their hazards; campaign water/lava bridge construction belongs to Royal Deep. Standalone levels retain their own starting catalogs, which already permit bridges and all current room plans. Chasms remain unbridgeable. Reclaimed rooms cannot bypass locked plans.
- Keep authored deterministic layouts with editable definitions and stable level IDs. Add the smallest useful helpers for irregular areas, variable-width passages, terrain bands and transformed ruin placement; avoid a general procedural generator or a full map editor.
- Carry room construction and ruin reclamation through the real gameplay services. Apply the [room checklist](room-development-checklist.md) to changed room/ruin arrangements, including automatic furnishings, floor capacity, access, irregular shapes and free construction on/off.
- Retain old layouts as development comparison fixtures during the overhaul, outside the ordinary campaign catalog. Keep all permanent baseline renderers and independent material caches intact. Campaign and corresponding Free Play entries must use each completed replacement consistently; M42 redesigns the seven additional standalone entries as separate content.
- Use existing art and sound systems. Region-aware presentation helpers and a small landmark vocabulary are in scope when needed by these maps. New rooms, species, rival dungeon AI, victory systems, possession, game modes, persistence and a separate audio overhaul are outside this roadmap. Existing audio listening review remains pending.

## Acceptance and evidence for every redesigned level

Keep functional verification and design review separate in each milestone record. Both must pass before marking it complete. For M42, assess routes against each standalone entry's own starting catalog and compare identity across both standalone and campaign maps; campaign unlock order and increasing stage sizes do not apply to standalone entries.

| Review | Required evidence and decision |
|---|---|
| Geographic identity | Current/replacement whole-level comparisons in the same neutral palette, with names hidden during inspection. Explain the new landform, route structure and defensive situation, and how they differ from the other campaign maps. Repeated topology is a design failure even when tests pass. |
| Useful scale | Show where the additional area provides settlement expansion, a district, a landform or a meaningful choice. Record travel/excavation observations; padding with solid border or long empty tunnels does not pass. |
| Discovery and atmosphere | Review ordinary fogged exploration plus normal-zoom, alternate-angle views of the start, a natural area and a ruin/landmark. Evaluate local variation, reveal sequence and readability, not just whether screenshots were produced. Include both intact wilderness and a developed settlement. |
| Choices and economy | Demonstrate paid intended and alternate approaches from normal starts with the stage's actual availability. State their different costs/risks/rewards. Check separate home chambers, connecting corridors, retained walls/entrances and expansion room, plus finite income, optional gems, needs journeys and practical relay activation. Larger designated rooms may change recruitment and wages; spatial fit alone does not prove paid sustainability. Debug disclosure/teleporting is not normal-route evidence. |
| Rooms and inhabitants | Verify actual reclaiming, capacity, automatic furnishings, free construction and narrow/irregular access through the room checklist. Observe natural pre-contact activity, opened attack routes, warnings, recovery and source suppression without discovery leaks. |
| Responsiveness | Check picking, camera/minimap/full-map framing, fog, reload/reset and visible traversal on the enlarged level. Profile a developed active late-level workload where increased scale could materially affect performance; record machine and conditions. |

Use `npm run verify -- <focused scope or test>` and one source/test typecheck for the actual code changes, plus the relevant browser checks for changed presentation. Select or extend existing checks rather than creating five duplicated browser suites. Broader campaign playtests and performance review belong to M41 and substantial integration changes. A documentation-only milestone update needs text/link review, not executable tests or a build.

Each completion record should include what changed, functional results, the design-review conclusion, comparison captures/route evidence, and retained limitations. A material failure of geographic identity, readable atmosphere, useful scale or playable pacing keeps the milestone unfinished even if the code and simulation tests pass. This does not introduce a new approval workflow; it makes the previously missed design requirements explicit.
