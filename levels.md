# Levels and underground contents

Working design for the dwarven stronghold game. Companion documents: [Characters](characters.md), [Rooms](rooms.md), [Game rules](game-rules.md), and [Gameplay interface](gameplay-interface.md).

[Campaign and standalone level overhaul](level-overhaul.md) owns the geography, useful-scale and acceptance criteria for M35–M42. The authored replacements below use those criteria while retaining the existing progression and simulation rules. Implementation and remaining review are tracked in [current development notes](development-plan.md); a map description is not a milestone completion record.

## Campaign structure

The campaign reclaims separate sites within a lost dwarven kingdom. Each level is a new stronghold with different terrain, inhabitants, routes, and objectives.

- Every map uses a square grid for terrain, excavation, rooms, and fixtures.
- Each map has a single excavation layer and a common walkable floor height. Intact terrain has one consistent height above that floor; there are no intermediate terrain shelves or stacked playable levels.
- Dwarfs and enemies move continuously through open halls, rooms, and passages. Their positions and travel directions are independent of the construction grid, while walls and obstacles constrain their routes.
- Player rooms can follow any excavated footprint, including narrow passages, bends, and spaces around bedrock. Every floor square contributes the configured capacity, independent of shape or cosmetic furnishings; no standard rectangular plots are required.
- Maps are presented in stylized 3D through an overhead camera with player-controlled rotation and zoom; layouts and room contents must remain readable from different viewing directions.
- A small starting mining crew establishes a base around a Hearthstone.
- The rest of the population is recruited fresh for that stronghold.
- The previous level's army and stockpiles stay behind. The expedition can be described as traveling onward without carrying over a veteran army or developed local economy.
- Campaign research and building unlocks remain available on subsequent levels under the current working design.
- Available dwarf types and rooms must have continuing uses across the campaign. A new level changes their application rather than invalidating them.
- A level ends in defeat if enemies destroy the Stone Hearth protecting the Hearthstone.
- Every level has a separate onward Hearthstone that the player must find and reach to open progression to the next area. Its difficult approach supplies the primary level objective.

The campaign follows five regions from the upper workings to the royal volcanic stronghold, with explicit sidebar travel after each relay. All ten enemy concepts have implemented roles and provisional balance in [Enemies](enemies.md). Free Play offers independent versions of these five areas plus seven separately composed scenarios. Original layouts remain available in development comparisons and focused harnesses.

## Campaign brief and progression

The five-area campaign introduces one specialist at a time. Unlocks arrive at the next Hearth so each expedition begins with an explicit, stable catalog. Earlier knowledge stays useful and no later stage removes it. The final royal relay reconnects the kingdom and ends the journey. Counts, dimensions and timing remain editable prototype decisions.

| Area / region | Learning goal and new content | Revisited mechanics and onward purpose |
|---|---|---|
| Border Foothold / upper workings | Stonehands, Cave Hounds, Treasure Room, Dormitory, Kitchen and walls | Excavate room space, gather finite gold, support hounds and secure the watch relay; recover training records |
| Fungal Hollows / fungal caves | Training Room and Warriors | Train while hounds scout; open alternate nest approaches against slowing/control; recover the guild relay |
| Fallen City / ancient halls | Workshop, Engineers, all door tiers and traps | Reclaim districts, protect intersections, train defenders and finance manufactured defenses against armor; recover the archive relay |
| Crystal Divide / crystal caverns | Library, Runesmiths and the complete research catalog | Prepare protection/healing/control, defend remote income and break ranged sight lines; recover stonebridge plans |
| Royal Deep / volcanic depths | Stone bridges | Combine all prior roles, training, defenses and spells across lava; secure the final royal relay |

Gold seams should guide exploration toward authored destinations. Renewable gems should be rare strategic attractions and may be absent from a level. Biomes should include appropriate natural caverns/tunnels, active inhabitants and level/species-specific recurring pressure. Discoverable dwarven ruins should offer coherent laid-out rooms that can be secured and reclaimed. The implemented starting menu offers Campaign and a data-driven Free Play level list with independent starting availability.

The declarative catalog is in `src/content/campaign.ts`; shared availability checks apply to room/wall/bridge construction, recruitment, manufacturing, defense placement, research and casting. Free room construction changes gold costs only. Retained Miners and Summon Miner are excluded from normal campaign and Free Play catalogs; debug fixtures retain them.

## Onward Hearthstone objective

Every level contains two distinct Hearthstone roles: the starting Hearthstone anchors the settlement and receives recruits, while a newly discovered Hearthstone opens the route onward. Finding and reaching the latter restores another connection in the lost kingdom's ancient runic network, explaining the expedition's progress from area to area.

- The onward Hearthstone is map-authored and initially concealed by normal fog of war. Camera movement, objective text and minimap markers must not reveal its undiscovered location.
- It is usually positioned somewhere hard to reach: within an enemy base or hostile region, beyond a lava crossing, or behind another terrain or route obstacle. Layout, excavation, combat and construction solve the approach; the challenge must be achievable with that level's resources and available tools.
- Discovery and access are separate. Seeing the stone across lava or through a distant opening does not complete the objective. Dwarfs must be able to physically reach its interaction area using ordinary traversal rules.
- Activation policy: after discovery, a sidebar request sends any available living non-animal resident to a cardinal-adjacent interaction square using normal movement. Eight uninterrupted seconds there awaken the stone, at no gold cost. Food/rest, carried-gold delivery, actionable wages, combat/rally and departure take priority; unfunded debt alone cannot prevent activation. A living enemy within four tiles and physical line of sight contests the site. Interrupted work resets progress; the request remains queued until the site and a resident are available again.
- Activation completes the local objective and freezes the area with progression readiness. In campaign play, the sidebar offers travel to the next authored area; the final relay gives a journey-complete endpoint. Starting-core destruction takes precedence if both outcomes would occur in the same simulation tick. Camera movement or remote clicks never complete activation.
- The starting Stone Hearth has 400 health and remains the defeat target throughout the level. Natural raiders attack an adjacent dwarf first, otherwise an accessible core tile within melee reach. The core stays impassable and has no repair, upgrade or relocation in the current game. The onward stone is indestructible reserved floor: it cannot hold a room, wall or fixture, become another treasury/recruitment core or move the player's base.
- Campaign travel begins a fresh foothold in the next area. Research/building unlocks carry forward under the working design; local armies and stockpiles stay behind. The implementation uses session memory without adding save infrastructure.
- The Royal Deep Hearthstone completes the five-area journey. There is no next-area link after it; the sidebar offers Restart area or Begin a new journey.

Optional camp-clearing, relic or district tasks can shape the approach, but do not replace the shared Hearthstone objective. Exact positions and defenses vary by level.

## Authored campaign and travel

The ordinary game starts the five-area journey defined in `src/content/campaign.ts`:

| Area | Approach | Result |
|---|---|---|
| Border Foothold | Establish a settlement and secure the upper watch | Travel to Fungal Hollows with Training Room plans |
| Fungal Hollows | Train defenders and open branching nest approaches | Travel to Fallen City with Workshop plans |
| Fallen City | Secure ruined districts and manufacture defenses | Travel to Crystal Divide with Library plans |
| Crystal Divide | Prepare spells and choose a land route around the fracture; guarded mineral income is optional | Travel to Royal Deep with stonebridge plans |
| Royal Deep | Build crossings and overcome the volcanic royal watch | Activate the final relay to complete the journey |

The Hearth panel provides an area briefing. Discovering its onward stone reveals the local story detail without exposing hidden positions in advance. Activation must still satisfy physical reach and security; travel only becomes available after successful activation and never occurs automatically.

Travel preserves completed spell research and cumulative building, role, recipe and spell availability in session memory. The schedule in the campaign brief owns introductions; research availability is distinct from researched knowledge. A Library must still research every newly available spell. Debug worlds omit campaign restrictions.

Each destination is a new world: the normal Stonehand crew and starting gold, empty treasury, no owned rooms/defenses/stockpiles, fresh needs/payday and new authored enemies. Neutral ruins remain to be discovered and claimed. Local jobs, events, crafting queues, research progress, prepared charges, active spells and resident levels stay behind. Carried research appears as unlocked, unprepared, paused preparation orders; use the Library's Resume control to prepare a local charge. Incomplete initial research does not transfer.

Restart area reconstructs the current area with the knowledge available at its arrival, discarding work learned during the failed/retried attempt. Begin a new journey resets to Border Foothold with initial knowledge. Debug worlds are separate from the retained campaign; returning to the stronghold restores its exact in-memory state. There are no browser/disk saves.

## Starting area

Every authored campaign area starts with a 5×5 clearing centered on the 3×3 Stone Hearth: a one-square walking ring keeps the starting crew and treasury accessible. Solid earth surrounds this clearing, so the player excavates space for rooms and routes to hidden side chambers. The ring can accept room tiles under the normal construction rules.

Each area starts with an already established Hearth, three Stonehands and a provisional 400-gold allowance. Its fixed treasury chest begins empty. Awakening the crystal is the story premise; no arrival construction sequence plays.

The surrounding area can be solid ground even if an ancient settlement exists farther into the map. Ruins may lie beyond collapsed tunnels, sealed districts, or natural rock formations. Players excavate a new foothold and discover the old settlement gradually.

Starting resources must be usable before a Treasure Room is built. The prototype includes limited treasury storage at the Hearth and a starting allowance. Levels need a viable route to establish enough reachable Dormitory and Kitchen floor area before unmet needs become severe. Furniture footprints and food-production chains impose no additional startup requirements.

## Terrain and hidden spaces

| Content | Behavior and design purpose |
|---|---|
| Excavatable earth or rock | Can be selected for mining; creates space for rooms and routes |
| Gold deposit | Gold-bearing terrain cells form seams; produce gold while being excavated, then become exhausted |
| Gem deposit | Represented as a gem column occupying the terrain grid; its separately configurable extraction interval and batch size currently match a gold seam, and it cannot be exhausted under the current resource model |
| Impenetrable bedrock | Cannot be excavated or destroyed; usually forms continuous seams and bands that define outer boundaries and internal barriers, with exposed outlines following whole grid tiles |
| Retained unmined earth | Individual ordinary earth tiles or small groups left inside an excavation; block room space and movement until mined, and remain distinct from bedrock |
| Natural cavern | Pre-existing open space concealed until discovered |
| Natural passage | Connects regions and creates potential movement or attack routes |
| Ancient dwarven ruins | May contain open chambers, damaged facilities, sealed routes, and discoveries |
| Inhabited tunnels or chambers | May contain nests, camps, defenses, inhabitants, or treasure |
| Water, lava, or chasms | Block dwarfs and ordinary enemies while allowing sight/projectiles; bridges cross water/lava, Cinderlings cross lava directly, and chasms remain unbridgeable |
| Map entrance or deep passage | A physical entry location for external hostile groups; does not need to be the dwarf arrival route |

Miners can reinforce ordinary exposed walls around claimed territory. Bedrock needs no reinforcement. Finite resource extraction can change the shape of a passage, while permanent gem deposits and bedrock remain obstacles around which the base must be planned.

Terrain occupancy follows the same square grid as excavation. Bedrock seams can bend or branch through the level using stepped tile boundaries and usually continue into surrounding solid terrain. Avoid presenting them primarily as isolated rounded rock mounds placed on room floors. Natural-looking textures and surface relief must preserve the visible whole-tile footprint.

Those steps occur only in the horizontal outline. Every intact earth, gold-bearing terrain, and bedrock cell reaches the same terrain top height, and each excavated cell reaches the single floor plane. Retained earth cells are full-height remnants, not shallow blocks. Surface texture and resource models do not create additional walkable levels.

An excavated room can contain squares of ordinary earth that have not been mined. These may be isolated cells or connected groups and can be excavated later. They provide layout variation without requiring isolated bedrock formations. Occupied terrain cells contribute no room floor, service capacity, or traversable space.

## Resource appearance and excavation scale

The user approved the [gold seam and gem column concept](concept-art/terrain/README.md) as the reference for the overall terrain appearance, including dirt and bedrock. Level concepts should preserve its substantial square excavation cells, consistent terrain height, overhead presentation, and readable materials. Playable cells align across intact terrain tops, exposed wall sections, floor footprints, and selection overlays. Small decorative stone joints or texture details do not define additional action cells.

Gold veins should be visible on the tops and exposed sides of gold-bearing terrain within the visible area. Gem columns occupy square terrain footprints, show mineral detail from above and on accessible faces, and provide working positions beside the deposit. The column appearance represents the existing persistent gem resource rather than a new currency or power source.

Selection overlays must distinguish designated excavation from the natural gold material. Exact highlight styling and physical cell dimensions remain to be refined. Gold and gem locations are always shown in the main view and on both planning maps under the visibility rules below.

## Discovery and visibility

- Hidden caverns, passages, and inhabited areas are not visible through surrounding ground.
- Breaking through opens access and reveals what dwarfs can see from the opening.
- Further exploration reveals the extent of a large chamber or winding passage; a single breach does not reveal an entire connected region.
- Discovered terrain remains recorded on the map under the implemented visibility model. Current enemy activity requires visibility.
- Camera rotation, zoom, and any foreground wall fading must preserve discovery boundaries; they cannot expose hidden chambers or inhabitants through solid terrain.
- Diggable terrain and bedrock must be distinguishable where exposed, so the player can make informed excavation choices.
- Gold seams and gem deposits are visible everywhere in the main view, minimap and full map from the start, providing destinations for exploration. This reveals only resource locations: nearby terrain, chambers, inhabitants and the onward Hearthstone stay concealed. Resource meshes remain visible while panning, rotating and zooming through unexplored areas; this does not discover their tiles or grant physical mining access. Exhausted gold becomes ordinary floor on the map; gems persist.

## Crossing harness and comparison layouts

The `crossings` development scenario remains a compact 28×18 bridge harness with normal starting Stonehands and allowance, accessible gold and a gem. Straight water/lava bands isolate paid worker construction and physical objective access; an optional chasm pocket stays unbridgeable. It is separate from the larger Emberwater Crossing in Free Play. See [bridge rules](rooms.md#bridges-and-hazardous-crossings) for costs, construction, reclaim and occupancy.

**Debug → Level preview → Before overhaul** preserves independent snapshots of the twelve previous playable layouts, including the original Border/Emberwater side chambers. They are comparison fixtures, not entries in the ordinary campaign or Free Play menu. **Load full level** opens a revealed test copy; returning restores the retained stronghold. The compact regional encounter scenarios also remain useful debug harnesses.

## Inhabitants and regions

Creature types should be associated with recognizable regions. These example pairings can recur across several maps:

| Region | Inhabitants or threats | Possible discoveries |
|---|---|---|
| Upper workings | Goblins and burrowing creatures | Gold, abandoned mining chambers, and shortcuts |
| Fungal caves | Spiders and fungal creatures | Natural caverns and alternate routes |
| Ancient halls | Undead and dormant guardians | Recoverable rooms, treasure, and relic objectives |
| Crystal caverns | Elementals and territorial cave creatures | Gem deposits and magical discoveries |
| Volcanic depths | Fire creatures and large deep predators | Hazardous crossings and valuable resource positions |

Enemy behaviors should make layout matter: melee groups pressure entrances, ranged enemies challenge exposed approaches, and selected burrowers may threaten ordinary earth walls. The Tunnel Burrower excavates dirt/rock, Cinderling crosses lava, and the roster defines ranged/control/armored/breaching roles. All can break shut doors and threaten the Hearth; [Enemies](enemies.md) gives exact capabilities and resistances. No creature can tunnel through bedrock.

The [enemy concept gallery](concept-art/enemies/README.md) supplies the implemented ten-enemy roster: Goblin Raider and Tunnel Burrower; Cave Spider and Spore Brute; Restless Guard and Ancient Sentinel; Crystal Elemental and Crystalback Stalker; Cinderling and Deepmaw. All ten are implemented with distinct combat roles, models/animations and ordinary encounter integration. [Enemies](enemies.md) defines abilities, scale, resistances and provisional balance. Campaign and standalone maps compose these inhabitants into local territories and relay approaches. The separate enemy-roster gallery supplies controlled test setups; the legacy regional scenario factories remain focused debug worlds.

## Authored layouts and resource destinations

Each campaign map owns its geometry, resources, ruins, presentation regions and encounters in a separate `src/content/campaign-*.ts` module. `campaign-levels.ts` assembles them, and `campaign.ts` owns order, briefings and unlocks. Nearby finite gold funds a paid settlement before opening hostile territory; later deposits point toward districts and optional expeditions. Mineral patterns follow each map's geology instead of repeating one approach across the campaign. Gold/gem planning visibility discloses only deposits, never rooms, inhabitants or the onward Hearth.

Example settlement footprints and intended/alternate waypoints live beside each definition and are registered through `level-play-plans.ts`. They guide ordinary player-action verification; they do not prebuild rooms, reveal paths or impose orders during gameplay. Players can excavate other routes and room shapes.

| Area | Layout, intended route and alternate | Resource purpose and encounter counters |
|---|---|---|
| Border Foothold, 40×32 | A sheltered western earth basin enclosed by an uneven rim. A short northern mine approach reaches the timber watch; the longer southern saddle passes an abandoned waystation before turning north behind a rock shoulder. | No gems. Near gold funds the first support rooms; southern reward gold points toward a burrower side den and suppressible goblin passage. Hounds and deliberately opened narrow approaches carry early defense. |
| Fungal Hollows, 48×40 | A northwestern dry shelf opens into broad connected cavern lobes around a pool basin. The northern shelf leads directly toward the eastern brood; the longer southern shore reclaims a poolside waystation and approaches the relay from below. Both routes stay on land. | No gems. Mineral hooks support training before contact. Damp margins, bare shelves and clustered colonies divide the basin into recognizable places. Spiders and the Spore Brute punish crowded approaches; the southeast spider passage remains physically reachable. |
| Fallen City, 56×46 | A southern settlement faces an interrupted street grid, civic junction and northern watch precinct. The main avenue is direct; a western foundry/service circuit offers reclamation and a second approach. Eastern barracks form a separate optional district. | No gems. Finite street income supports wages and manufacturing. Foundry Workshop/Kitchen/Treasure floors become useful through real reclamation. Guards and the Sentinel make opened intersections and supplied defense positions matter; the eastern reinforcement passage can be claimed. |
| Crystal Divide, 64×52 | An eastern refuge faces a branching mineral spine and broad crescent chasm. The shorter northern land route passes an archive; the southern route follows the long outer bank through a service shelter toward the western relay. | One optional gem in a southern hunting recess, guarded by a Stalker. Finite gold supports relay completion without it. The archive, shelter and relay refectory support longer expeditions; trained defenders and prepared runes counter ranged pressure. The chasm is unbridgeable. |
| Royal Deep, 72×60 | A western settlement faces a river-fed lava basin and three connected royal peninsulas. The short northern crossing lands at the civic bridgehead; the longer southern crossing reaches the foundry side before the central relay court. | Finite gold pays for crossings and a combined settlement; an optional eastern gem supports a longer reclamation. Cinderlings can cross lava directly, while workers need a separate bridge spur to suppress the source. Deepmaw and the watch test supplied Warriors, hounds, defenses and runes. |

The larger footprints provide different settlement expansion, districts, banks and optional resource territory. They do not require clearing every chamber. Border through Crystal preserve land access with their actual campaign tools; bridges enter the campaign in Royal Deep. Every map keeps one floor plane and substantial square excavation cells.

Local `environmentRegions` distinguish dry workings, damp shores, fungal colonies, masonry, crystal faces and scorched ground within one map. These are presentation overlays: they change local materials, sparse edge dressing and eligible light sources, but never terrain, sight, navigation, capacity or enemy habitat behavior. Dry timber supports and masonry edge remnants persist on claimed non-room floors; living growth clears on claiming, and real room construction clears all such dressing. See [graphics](graphics.md#local-environment-regions) for renderer ownership.

### Habitat activity and pressure

Campaign and standalone sources declare their habitat and retain inhabitants' individual movement profiles: patrol circuits, short spider darts, nest excursions, perimeter prowling and slow watch-post inspections. Movement continues behind normal fog without revealing inhabitants. A territorial side group stays local and returns home when threats leave; the required relay watches can launch an attack after discovery and their warning. Blocked raiders resume local movement until an approach opens. Local movement does not excavate or breach walls. [Enemy movement patterns](enemies.md#living-habitats-and-territorial-groups) describe the species differences; combat abilities still apply once fighting begins.

Every area has a separate, named reinforcement passage with its own initial delay, a fresh warning, and a recovery interval after the preceding group is defeated. A sealed route retains one pending wave; it never accumulates hidden armies or relocates spawns. Claiming the source's physical entrance suppresses future waves. Existing attackers remain until defeated. Map definitions own those editable timings; [enemy behavior](enemies.md) explains counters and shared rules.

### Discovering and reclaiming ruins

Waystations, foundries, archives and barracks use reusable neutral floor remnants arranged around real corridors. Some cells remain covered by ordinary dirt/rock. Discovery reveals only seen remnants; excavating a covering does not instantly transfer ownership. Stonehands must reach a neutral square and claim it through the ordinary work pool; nearby visible hostiles contest the work. [Room reclamation rules](rooms.md) own the claim timing, security radius and cost, with editable tuning in `src/content/ruins.ts`.

Claimed remnants convert to ordinary rooms only when that arrival knows the room plan. Locked remnants stay neutral and supply no services; free construction cannot bypass this restriction. Reclaimed floor immediately follows normal floor-area capacity, automatic cosmetic furnishings, recruitment, food/bed support and access rules. Retained terrain contributes no room capacity. Reclaiming existing stonework has no repair chain, door maintenance or new resource cost. See the [room rules](rooms.md) and room checklist for service details.

## Attacks

Dwarfs arrive through the Hearthstone's runic connection. Enemies approach through the physical underground map.

Encounter definitions now support local camps/nests disturbed by discovery or a newly opened route, plus timed raids entering through authored map passages. Local inhabitants exist in their chambers before discovery; they do not appear inside built rooms. Opening a route can expose the base to inhabitants previously separated by solid ground.

Hostile groups navigate the actual terrain, doors and runic barriers, including floor the player has not discovered. Player sight remains separate. Bedrock and intact earth block Raiders; they can break shut doors/barriers but cannot tunnel. A sealed raid entrance retains one warned wave until its actual spawn squares and approach are usable. Claimed/occupied spawn squares cannot spawn a group, and pending waves never accumulate or relocate inside the settlement.

Positions, activation mode, source-clearing policy and timings belong to each level definition. `src/content/level-encounters.ts` supplies the small shared camp/entrance constructors; species movement defaults live in `src/content/habitats.ts`. Defeating a camp clears it permanently; claiming an entrance spawn square stops future reinforcements, while existing attackers remain. Game configuration → Encounters still edits the retained prototype source defaults used by the legacy factories; it does not replace every authored map's source timings.

Ordinary sidebar threat reports omit undiscovered camps and use generic warnings for unknown raid sources. Source names become available after discovery; current enemy counts include only visible units. Debug explicitly exposes authored source state and can advance a pending timer while preserving discovery, warning duration and route checks. The `encounters` test scenario uses a mineable route gate, a hidden camp, a raid entrance, real doors/traps and Warriors. The `hearth` and `hearth-defeat` scenarios use the same mineable gate and natural attackers to exercise both local outcomes.

## Extending the level catalog

Author maps with a staged roster and room catalog. Discovery follows excavation and resident sight, including Cave Hound scouting. Definitions use stable room/resident identifiers and shared availability checks. Preserve continuing uses for previously unlocked content. The [original candidate-level proposals](archive/previous-docs/levels.md#candidate-levels) are historical; Flooded Workings is a concept, not an implemented campaign stage.

## Level and region concept art

The [overhaul gallery](concept-art/levels/overhaul/README.md) contains the concept direction produced before each redesign, with exact prompts and interpretation notes. The earlier [level and region gallery](concept-art/levels/README.md) remains useful material/atmosphere provenance, including the unimplemented Flooded Workings study. Concepts guide spatial rhythm, materials and recognizable places; incidental stairs, bridges over voids, labels or furnishings do not change the single-floor rules or supply free service rooms.

## Level authoring checklist

Use `src/content/level-authoring.ts` for rectangular strips, ellipses, concave polygons, connected stepped paths, unions and transformed ruin groups. Helpers return ordinary tile points for the existing definition seams and ruin cells; there is no procedural generator or separate map format. Later terrain seams and later presentation regions resolve overlaps in declaration order. `src/content/level-authoring-fixture.ts` exercises shapes, a rotated ruin and all six local treatments through the real world systems. It appears under the Authoring preview group.

Every playable level needs:

- A fixed Hearthstone position, starting cavern, starting crew, and usable initial treasury.
- A practical way to build the first Kitchen and Dormitory, with room to expand or add more as the population grows.
- Finite gold, a deliberate decision about renewable gems, and enough accessible resources to pursue its objective.
- Clear excavation choices, hidden discoveries, and readable indestructible boundaries.
- Specified inhabitants, their starting locations, and their allowed attack routes.
- At least one meaningful defensive planning problem around the core or its approaches.
- A separate, initially hidden onward Hearthstone, a challenging but solvable approach, explicit readiness conditions and a next-area link or authored endpoint. Discovery alone must not complete an inaccessible objective.
- Continued uses for every available room and dwarf type, including shared training and useful spell research, with more than one viable approach to major obstacles where practical.
- Reachable room floor in confined and irregular spaces, with predictable capacity and readable floors, walls and cosmetic furnishings from different camera directions.

## Balance and limits

Starting resources, pressure cadence, source placement, activation timing and creature statistics have explicit editable defaults. The five-area order, unlock schedule, source-clearing rules, visibility and bridge restrictions are implemented as described above. Reclaimed rooms use ordinary services after secure claiming; additional repair chains and optional relic objectives are outside current scope.

## Free Play availability

### Hearthside Halls building showcase

This additional 46×40 map is a peaceful settlement study. **Free Play → Hearthside Halls** starts with the normal Stonehands, starting allowance, undiscovered terrain and no service rooms. **Debug → Level preview → Showcases → Hearthside Halls · Built base** shows the same map after ordinary player actions and simulation have built and populated the example. **Load full level** opens it fully revealed, paused and framed to the whole map; zoom, orbit or resume to inspect it. Returning restores the retained stronghold.

The base has a central Hearth court and two parallel, two-tile-wide halls joined above and below it. Six one-tile doorways branch into enclosed rooms: 6×5 Treasury, Dormitory and Training chambers, 6×4 Workshop and Kitchen, and a 28-tile Library with a recessed corner. Solid dividing walls remain intact; no room is a route through to another. The northern mining gallery is separate from the living and working wings. Two southern 7×4 reserves remain solid and diggable for later expansion. A sealed eastern garden contains the onward Hearthstone; excavating east from the lower cross-hall opens a normal physical completion route. There are no hostile inhabitants or recurring attacks in this building study.

The authored construction example marks only rooms, halls, entrances and mining spurs. Workers physically excavate, claim, mine and haul. It builds the Treasury first, then Workshop, Training Room, Library and Kitchen, and opens accommodation last so the services exist before recruiting a larger population. Normal Workshop orders manufacture the six Timber doors; a Library order attracts a Runesmith. Ordinary recruitment, training, meals, rest and wage collection populate the finished base. Players may choose a different order or buy more Stonehands through the ordinary Hearth action.

The 74 finite gold seams plus the normal allowance fund the example using current prices; no free construction, injected gold, supplied rooms or spawned recruits are used. The replay runs six simulated minutes after completing the rooms to exercise support and wages. Dated costs, remaining gold and verification are in [development history](archive/development-history.md). Finite wealth supports continued building and wages but is not unlimited income. This example proves this map's buildability; it does not substitute for the pending settlement review of the existing twelve maps.

The map and room/corridor coordinates live in `src/content/settlement-showcase.ts`; the repeatable player actions live in `src/content/settlement-showcase-build.ts`. `npm run verify -- showcase --browser=showcase` checks paid construction, funds conservation, access, automatic furniture, doors, normal residents, needs/wages, expansion ground, the free flag, relay completion, preview loading and return. The initial preview selection displays progress while building; subsequent selections reuse the example until page reload.

### Starting availability

**Hearthside Halls** additionally offers a peaceful building study with all ordinary standalone plans. Its finished example is available in Level Preview; ordinary Free Play starts empty like the other maps.

The seven standalone scenarios offer all current normal room/building plans, roles, recipes and research availability. Five entries marked Campaign expose the authored campaign maps independently with the cumulative availability of that area. Each entry in `src/content/playable-levels.ts` owns its map, illustration, description and starting catalog. All start with no researched spells, the normal Stonehand crew and gold, natural recruitment, and no owned rooms, stock or prepared charges. Room support and Library research still apply. Campaign progress never changes these arrivals. Restart recreates the selected entry, including its initial knowledge; standalone victory offers restart or menu with no campaign travel.

Stable catalog IDs survive the renamed scenarios. Their definitions and example paid routes live in the `src/content/standalone-*.ts` modules; they are separate from the legacy debug factories even where a scenario selector uses the same identifier.

| Stable ID | Scenario | Geography and reason to choose it |
|---|---|---|
| `border-foothold` | Mining Interchange, 48×40 | A central refuge feeds unequal mine spokes. The northern branch reaches the northwest watch directly; the western timber service loop offers room reclamation. A separate southeast gallery contains optional mineral income and a damp side territory. |
| `region-upper` | Honeycomb Quarry, 46×38 | An eastern refuge faces broad extraction lobes divided by thick stone ribs. A northern working-face route reaches the relay; the western service circuit and lower cave trade additional exposure for reclamation and mineral access. |
| `emberwater-crossing` | Emberwater Crossing, 48×40 | Winding water and lava channels enclose a middle-bank street and foundry peninsula. Northern crossings reach the relay more directly; southern crossings open service ruins and a second eastern approach. An optional mineral den extends the expedition. |
| `region-fungal` | Overgrown Confluence, 50×42 | A southern refuge faces converging pools and overgrown former workings. The eastern colony neck provides a short approach; the western waystation and civic crossing offer a longer reclamation route. |
| `region-ancient` | Flooded Watch Districts, 54×44 | A northwestern arrival faces flooded civic districts. A northern paid causeway reaches the archive court with later contact; the dry southern service street meets its watch earlier and offers Dormitory, Kitchen and Workshop ruins for consolidation. |
| `region-crystal` | Prism Wells, 54×44 | A central refuge has several mineral branches rather than a single dividing fracture. Approach the northeast relay from the east or reclaim the northern archive first; two guarded gem wells offer separate optional income commitments. The southern chasm remains unbridgeable. |
| `region-volcanic` | Ashen Caldera, 60×48 | A lava ring encloses a central citadel. A direct western crossing and a longer southern approach lead inward to different courts; outer-bank minerals and the northern source spur make continued exploration a choice. |
