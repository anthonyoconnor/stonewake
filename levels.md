# Levels and underground contents

Working design for the dwarven stronghold game. Companion documents: [Characters](characters.md), [Rooms](rooms.md), [Game rules](game-rules.md), and [Gameplay interface](gameplay-interface.md).

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

The campaign premise, level structure and onward Hearthstone objective are established. The two authored areas and activation rules below describe the implemented prototype; candidate levels remain authoring proposals. All ten current enemy concepts now have implemented roles and provisional balance in [Enemies](enemies.md). M11 implements objective/defeat using an enemy-held land route. M16 adds the Emberwater Crossing scenario with water, lava, chasms and constructed stone bridges. The two-area campaign links Border Foothold to Emberwater Crossing through explicit sidebar travel.

## Planned campaign expansion

The user has completed the two-area prototype campaign. The next campaign should introduce rooms and characters gradually across consecutive levels, give specialists time and meaningful challenges to justify their use, and use deliberate layouts rather than treating the prototype maps as the final structure.

Gold seams should guide exploration toward authored destinations. Renewable gems should be rare strategic attractions and may be absent from a level. Biomes should include appropriate natural caverns/tunnels, active inhabitants and level/species-specific recurring pressure. Discoverable dwarven ruins should offer coherent laid-out rooms that can be secured and reclaimed. A starting menu should offer Campaign and a data-driven Free Play level list with independent starting availability.

These are planned changes under [M25–M29](development-plan.md#milestone-tracker), not descriptions of current behavior. M26 will establish the campaign sequence and unlock schedule; M27 owns habitat/pressure behavior, M28 reclamation rules, and M29 concrete maps and resource placement. Exact level counts, sizes and timings remain provisional.

## Onward Hearthstone objective

Every level contains two distinct Hearthstone roles: the starting Hearthstone anchors the settlement and receives recruits, while a newly discovered Hearthstone opens the route onward. Finding and reaching the latter restores another connection in the lost kingdom's ancient runic network, explaining the expedition's progress from area to area.

- The onward Hearthstone is map-authored and initially concealed by normal fog of war. Camera movement, objective text and minimap markers must not reveal its undiscovered location.
- It is usually positioned somewhere hard to reach: within an enemy base or hostile region, beyond a lava crossing, or behind another terrain or route obstacle. Layout, excavation, combat and construction solve the approach; the challenge must be achievable with that level's resources and available tools.
- Discovery and access are separate. Seeing the stone across lava or through a distant opening does not complete the objective. Dwarfs must be able to physically reach its interaction area using ordinary traversal rules.
- Activation policy for M11: after discovery, a sidebar request sends any available living resident to a cardinal-adjacent interaction square using normal movement. Eight uninterrupted seconds there awaken the stone, at no gold cost. Food/rest, carried-gold delivery, actionable wages, combat/rally and departure take priority; unfunded debt alone cannot prevent activation. A living enemy within four tiles and physical line of sight contests the site. Interrupted work resets progress; the request remains queued until the site and a resident are available again.
- Activation completes the local objective and freezes the area with progression readiness. In campaign play, the sidebar offers travel to the next authored area; the final relay gives a journey-complete endpoint. Starting-core destruction takes precedence if both outcomes would occur in the same simulation tick. Camera movement or remote clicks never complete activation.
- The starting Stone Hearth has 400 health and remains the defeat target throughout the level. Natural raiders attack an adjacent dwarf first, otherwise an accessible core tile within melee reach. The core stays impassable and has no repair, upgrade or relocation in M11. The onward stone is indestructible reserved floor: it cannot hold a room, wall or fixture, become another treasury/recruitment core or move the player's base.
- Campaign travel begins a fresh foothold in the next area. Research/building unlocks carry forward under the working design; local armies and stockpiles stay behind. The implementation uses session memory without adding save infrastructure.
- The Emberwater Hearthstone completes the current two-area journey. There is no next-area link after it; the sidebar offers Restart area or Begin a new journey. Further campaign areas remain an authoring choice.

Optional camp-clearing, relic or district tasks can shape the approach, but do not replace the shared Hearthstone objective. Exact positions and defenses vary by level.

## Authored campaign and travel

The ordinary game starts a two-area journey defined in `src/content/campaign.ts`:

| Area | Approach | Result |
|---|---|---|
| Border Foothold | Establish a settlement and excavate the occupied northern halls | Activate the northern stone to recover stonebridge plans and choose travel to Emberwater |
| Emberwater Crossing | Establish a fresh settlement, construct paid water/lava bridges and defeat the far island's Cinderling | Activate the final relay to complete the available journey |

The Hearth panel provides an area briefing. Discovering its onward stone reveals the local story detail without exposing hidden positions in advance. Activation must still satisfy physical reach and security; travel only becomes available after successful activation and never occurs automatically.

Travel preserves completed spell research and building knowledge in session memory. All six implemented rooms and reinforced-wall construction are known at the start; stonebridge plans unlock on arrival at Emberwater. These facilities remain useful in both settlements, and bridges retain their usual gold/work costs. Standalone debug and regional scenarios retain their existing construction catalog.

Each destination is a new world: three level-1 Miners by default, normal starting gold, empty treasury, no rooms/defenses/stockpiles, fresh needs/payday and new authored enemies. Local jobs, events, crafting queues, research progress, prepared charges, active spells and resident levels stay behind. Carried research appears as unlocked, unprepared, paused preparation orders; use the Library's Resume control to prepare a local charge. Incomplete initial research does not transfer.

Restart area reconstructs the current area with the knowledge available at its arrival, discarding work learned during the failed/retried attempt. Begin a new journey resets to Border Foothold with initial knowledge. Debug worlds are separate from the retained campaign; returning to the stronghold restores its exact in-memory state. There are no browser/disk saves.

## Starting area

Border Foothold starts with a 5×5 clearing centered on the 3×3 Stone Hearth: a one-square walking ring keeps the starting crew and treasury accessible. Solid earth surrounds this clearing, so the player excavates space for rooms and routes to the hidden side chambers. The ring can still accept room tiles under the normal construction rules.

Each level includes a small accessible cavern containing a dormant Hearthstone. The mining crew's arrival sequence automatically awakens the crystal and establishes its protective Stone Hearth, leaving the player with miners, limited starting gold, and enough usable space to begin expansion.

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
- Discovered terrain remains recorded on the map under the proposed visibility model. Current enemy activity requires visibility.
- Camera rotation, zoom, and any foreground wall fading must preserve discovery boundaries; they cannot expose hidden chambers or inhabitants through solid terrain.
- Diggable terrain and bedrock must be distinguishable where exposed, so the player can make informed excavation choices.
- Gold seams and gem deposits are visible everywhere in the main view, minimap and full map from the start, providing destinations for exploration. This reveals only resource locations: nearby terrain, chambers, inhabitants and the onward Hearthstone stay concealed. Resource meshes remain visible while panning, rotating and zooming through unexplored areas; this does not discover their tiles or grant physical mining access. Exhausted gold becomes ordinary floor on the map; gems persist.

## Emberwater Crossing (M16)

The `crossings` scenario is a 28×18 authored map using normal starting Miners and allowance, accessible gold seams and a gem deposit. Map-spanning water and lava bands prevent a land bypass; the player constructs both crossings before reaching the onward stone. An optional chasm pocket stays unbridgeable. See [bridge rules](rooms.md#bridges-and-hazardous-crossings) for costs, construction, reclaim and occupancy. Discovery across the gap never activates the objective. There is no new enemy type or campaign link in this scenario.


### Optional regional chambers

The 48×48 campaign Border Foothold adds a sealed southwestern fungal cavern (Burrower, Spider and Spore Brute) and southeastern ancient hall (Restless Guard and Sentinel). The northern required camp and eastern raid passage retain their existing routes. Campaign Emberwater expands eastward to 40×18, adding sealed crystal caverns (Elemental and Stalker) and a volcanic lair (Deepmaw); the required far-bank sentry is a Cinderling. The standalone M16 crossings map remains 28×18.

Briefings mention these optional branches. Inhabitants exist behind ordinary rock gates, remain hidden until exploration, give a 15-second warning and use normal combat/source rules. They lie outside the onward stone’s security radius. The water/lava channels still span the full map height, so the eastern extension does not provide a land bypass. Broader optional-encounter balance remains in M19.

## Inhabitants and regions

Creature types should be associated with recognizable regions. These example pairings can recur across several maps:

| Proposed region | Inhabitants or threats | Possible discoveries |
|---|---|---|
| Upper workings | Goblins and burrowing creatures | Gold, abandoned mining chambers, and shortcuts |
| Fungal caves | Spiders and fungal creatures | Natural caverns and alternate routes |
| Ancient halls | Undead and dormant guardians | Recoverable rooms, treasure, and relic objectives |
| Crystal caverns | Elementals and territorial cave creatures | Gem deposits and magical discoveries |
| Volcanic depths | Fire creatures and large deep predators | Hazardous crossings and valuable resource positions |

Enemy behaviors should make layout matter: melee groups pressure entrances, ranged enemies challenge exposed approaches, and selected burrowers may threaten ordinary earth walls. The Tunnel Burrower excavates dirt/rock, Cinderling crosses lava, and the roster defines ranged/control/armored/breaching roles. All can break shut doors and threaten the Hearth; [Enemies](enemies.md) gives exact capabilities and resistances. No creature can tunnel through bedrock.

The [enemy concept gallery](concept-art/enemies/README.md) supplies the full ten-enemy roster required by [M17](development-history.md#m17--complete-enemy-roster-and-behavior): Goblin Raider and Tunnel Burrower; Cave Spider and Spore Brute; Restless Guard and Ancient Sentinel; Crystal Elemental and Crystalback Stalker; Cinderling and Deepmaw. All ten are implemented with distinct combat roles, models/animations and ordinary encounter integration. [Enemies](enemies.md) defines abilities, scale, resistances and provisional balance. Five region scenarios provide normal starting crews/resources and hidden two-species encounters; the separate enemy-roster gallery supplies controlled test setups. Their terrain interactions, campaign travel and environment graphics are implemented and verified. The connected campaign includes the full roster through its required approaches and optional regional chambers.

## Attacks

Dwarfs arrive through the Hearthstone's runic connection. Enemies approach through the physical underground map.

Encounter definitions now support local camps/nests disturbed by discovery or a newly opened route, plus timed raids entering through authored map passages. Local inhabitants exist in their chambers before discovery; they do not appear inside built rooms. Opening a route can expose the base to inhabitants previously separated by solid ground.

Hostile groups navigate the actual terrain, doors and runic barriers, including floor the player has not discovered. Player sight remains separate. Bedrock and intact earth block Raiders; they can break shut doors/barriers but cannot tunnel. A sealed raid entrance retains one warned wave until its actual spawn squares and approach are usable. Claimed/occupied spawn squares cannot spawn a group, and pending waves never accumulate or relocate inside the settlement.

The base Border Foothold definition has two primary sources (its campaign version adds the optional regional chambers above): a buried camp at the north reacts to discovery with an eight-second warning; the eastern deep passage first warns at 360 seconds and gives 25 seconds before a raid. A defeated entrance wave starts a 150-second delay and then another warning. Waves never overlap from the same source. Defeating the camp clears it permanently; claiming an entrance spawn square stops its future reinforcements, while existing attackers remain. Positions, activation mode, source-clearing policy and timing live in the level definition. Timing values can be edited under Game configuration → Encounters for new strongholds.

Ordinary sidebar threat reports omit undiscovered camps and use generic warnings for unknown raid sources. Source names become available after discovery; current enemy counts include only visible units. Debug explicitly exposes authored source state and can advance a pending timer while preserving discovery, warning duration and route checks. The `encounters` test scenario uses a mineable route gate, a hidden camp, a raid entrance, real doors/traps and Warriors. M11 adds physical Hearth attacks and the separate onward stone inside the northern camp. The `hearth` and `hearth-defeat` scenarios use the same mineable gate and natural attackers to exercise both local outcomes.

## Candidate levels

| Candidate stronghold | Terrain and existing spaces | Main challenge | Proposed objective | Uses for recurring systems |
|---|---|---|---|---|
| Border Foothold | Compact starting cavern, buried guard chambers, nearby gold, and one initial hostile region | Establishing food, beds, storage, and a defended route | Find and reach the onward Hearthstone inside the nearby hostile camp | Introduces excavation, needs, reinforcement, and defense |
| Flooded Workings | Separated mining chambers, water channels, bedrock ridges, and abandoned tunnels | Restricted construction space and longer travel routes | Reach the onward Hearthstone in a mining district isolated by water channels | Storage placement, bridges, exploration, and dispersed defenses |
| Fallen City | Large hidden halls, occupied districts, intersecting streets, and buried connections | Defending several fronts as the city opens up | Discover and secure the onward Hearthstone in an occupied central hall | Every specialist supports a growing network of rooms and guard positions |
| Crystal Divide | Valuable gem deposits across a network of caverns and narrow passages | Sustaining the economy while protecting remote workers | Find the onward Hearthstone beyond guarded gem caverns and a difficult chasm crossing | Mining capacity, treasury access, spells, and defensive corridors |
| Royal Deep | Extensive ruins, multiple hostile regions, a vulnerable core approach, and limited safe expansion | Maintaining a large settlement during a prolonged reclamation | Reach an onward Hearthstone surrounded by lava within an enemy-held deep stronghold | Combines all available rooms, roles, and defenses |

This table is a concept list, not a commitment to five levels or a fixed order. Basic shared systems must remain available wherever they are required for survival. Later maps should not arbitrarily prohibit previously unlocked rooms or dwarf types. The same Kitchen supports all residents, the Workshop supplies doors and traps, the Library researches spells, and the Training Room develops every dwarf type. Confined or dispersed maps can favor several smaller Kitchens and training facilities instead of one central room.

Initial levels must be playable with Miners, Engineers, Warriors, and Runesmiths and the current room catalog. Discovery follows excavation and dwarf visibility without requiring a separate scouting specialist. Level definitions should reference dwarf and room definitions by stable identifiers, so future additions can be introduced without rewriting the level systems or adding new requirements to existing maps. See the [architecture requirements](game-rules.md#14-extensible-character-and-room-definitions).

## Level and region concept art

The [level and region gallery](concept-art/levels/README.md) illustrates all five candidate strongholds, with additional Fungal Caves and Volcanic Depths studies. Border Foothold represents upper workings, Fallen City ancient halls, and Crystal Divide crystal caverns; Flooded Workings explores water-constrained mining and Royal Deep combines regional approaches. These are representative explored sections rather than final map layouts or a confirmed campaign sequence. Their [prompts](concept-art/levels/prompts.md) record the approved terrain reference and each scene's layout intent.

## Level authoring checklist

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

## Decisions still open

- Campaign length, level order, unlock sequence and final story endpoint.
- Onward Hearthstone activation conditions, interaction timing/cost, damage policy and exact approaches; finding and reaching one in every level is agreed.
- Initial miner counts, usable starting storage, and starting gold.
- Resource placement visibility, environmental hazards, and bridge behavior.
- Per-enemy abilities, scale, resistances and balance for the agreed ten-enemy roster; regional nest activation rules, raid timing and warning tuning.
- Whether reclaimed rooms can be used immediately or need repair.
