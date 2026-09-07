# Levels and underground contents

Working design for the dwarven stronghold game. Companion documents: [Characters](characters.md), [Rooms](rooms.md), [Game rules](game-rules.md), and [Gameplay interface](gameplay-interface.md).

## Campaign structure

The campaign reclaims separate sites within a lost dwarven kingdom. Each level is a new stronghold with different terrain, inhabitants, routes, and objectives.

- Every map uses a square grid for terrain, excavation, rooms, and fixtures.
- Each map has a single excavation layer and a common walkable floor height. Intact terrain has one consistent height above that floor; there are no intermediate terrain shelves or stacked playable levels.
- Dwarfs and enemies move continuously through open halls, rooms, and passages. Their positions and travel directions are independent of the construction grid, while walls and obstacles constrain their routes.
- Player rooms can follow any excavated footprint, including narrow passages, bends, and spaces around bedrock. Their furnishings adapt to usable space rather than requiring standard rectangular plots.
- Maps are presented in stylized 3D through an overhead camera with player-controlled rotation and zoom; layouts and room contents must remain readable from different viewing directions.
- A small starting mining crew establishes a base around a Hearthstone.
- The rest of the population is recruited fresh for that stronghold.
- The previous level's army and stockpiles stay behind. The expedition can be described as traveling onward without carrying over a veteran army or developed local economy.
- Campaign research and building unlocks remain available on subsequent levels under the current working design.
- Available dwarf types and rooms must have continuing uses across the campaign. A new level changes their application rather than invalidating them.
- A level ends in defeat if enemies destroy the Stone Hearth protecting the Hearthstone.

The campaign premise and level structure are established. The example maps, enemy roster, and objective details below are proposals rather than a final campaign list.

## Starting area

Each level includes a small accessible cavern containing a dormant Hearthstone. The mining crew's arrival sequence automatically awakens the crystal and establishes its protective Stone Hearth, leaving the player with miners, limited starting gold, and enough usable space to begin expansion.

The surrounding area can be solid ground even if an ancient settlement exists farther into the map. Ruins may lie beyond collapsed tunnels, sealed districts, or natural rock formations. Players excavate a new foothold and discover the old settlement gradually.

Starting resources must be usable before a Treasure Room is built. The exact implementation is open: a small prebuilt Treasure Room or limited starting storage associated with the Hearth are candidates. Levels also need a viable route to establish Dormitory beds and Kitchen food before unmet needs become severe.

## Terrain and hidden spaces

| Content | Behavior and design purpose |
|---|---|
| Excavatable earth or rock | Can be selected for mining; creates space for rooms and routes |
| Gold deposit | Gold-bearing terrain cells form seams; produce gold while being excavated, then become exhausted |
| Gem deposit | Represented as a gem column occupying the terrain grid; provides continuing, slower gold extraction and cannot be exhausted under the current resource model |
| Impenetrable bedrock | Cannot be excavated or destroyed; usually forms continuous seams and bands that define outer boundaries and internal barriers, with exposed outlines following whole grid tiles |
| Retained unmined earth | Individual ordinary earth tiles or small groups left inside an excavation; block room space and movement until mined, and remain distinct from bedrock |
| Natural cavern | Pre-existing open space concealed until discovered |
| Natural passage | Connects regions and creates potential movement or attack routes |
| Ancient dwarven ruins | May contain open chambers, damaged facilities, sealed routes, and discoveries |
| Inhabited tunnels or chambers | May contain nests, camps, defenses, inhabitants, or treasure |
| Water, lava, or chasms | Proposed terrain obstacles that constrain routes and building space; exact crossing rules remain open |
| Map entrance or deep passage | A physical entry location for external hostile groups; does not need to be the dwarf arrival route |

Miners can reinforce ordinary exposed walls around claimed territory. Bedrock needs no reinforcement. Finite resource extraction can change the shape of a passage, while permanent gem deposits and bedrock remain obstacles around which the base must be planned.

Terrain occupancy follows the same square grid as excavation. Bedrock seams can bend or branch through the level using stepped tile boundaries and usually continue into surrounding solid terrain. Avoid presenting them primarily as isolated rounded rock mounds placed on room floors. Natural-looking textures and surface relief must preserve the visible whole-tile footprint.

Those steps occur only in the horizontal outline. Every intact earth, gold-bearing terrain, and bedrock cell reaches the same terrain top height, and each excavated cell reaches the single floor plane. Retained earth cells are full-height remnants, not shallow blocks. Surface texture and resource models do not create additional walkable levels.

An excavated room can contain squares of ordinary earth that have not been mined. These may be isolated cells or connected groups and can be excavated later. They provide layout variation without requiring isolated bedrock formations. Occupied terrain cells contribute no room floor, furniture capacity, or traversable space.

## Resource appearance and excavation scale

The user approved the [gold seam and gem column concept](concept-art/terrain/README.md) as the reference for the overall terrain appearance, including dirt and bedrock. Level concepts should preserve its substantial square excavation cells, consistent terrain height, overhead presentation, and readable materials. Playable cells align across intact terrain tops, exposed wall sections, floor footprints, and selection overlays. Small decorative stone joints or texture details do not define additional action cells.

Gold veins should be visible on the tops and exposed sides of gold-bearing terrain within the visible area. Gem columns occupy square terrain footprints, show mineral detail from above and on accessible faces, and provide working positions beside the deposit. The column appearance represents the existing persistent gem resource rather than a new currency or power source.

Selection overlays must distinguish designated excavation from the natural gold material. Exact highlight styling and physical cell dimensions remain to be refined. Whether distant resources appear through unexplored terrain remains open under the visibility rules below.

## Discovery and visibility

- Hidden caverns, passages, and inhabited areas are not visible through surrounding ground.
- Breaking through opens access and reveals what dwarfs can see from the opening.
- Further exploration reveals the extent of a large chamber or winding passage; a single breach does not reveal an entire connected region.
- Discovered terrain remains recorded on the map under the proposed visibility model. Current enemy activity requires visibility.
- Camera rotation, zoom, and any foreground wall fading must preserve discovery boundaries; they cannot expose hidden chambers or inhabitants through solid terrain.
- Diggable terrain and bedrock must be distinguishable where exposed, so the player can make informed excavation choices.
- Whether distant resource deposits appear on the planning map is still open; hidden inhabitants and open chambers must remain concealed until discovered.

## Inhabitants and regions

Creature types should be associated with recognizable regions. These example pairings can recur across several maps:

| Proposed region | Inhabitants or threats | Possible discoveries |
|---|---|---|
| Upper workings | Goblins and burrowing creatures | Gold, abandoned mining chambers, and shortcuts |
| Fungal caves | Spiders and fungal creatures | Natural caverns and alternate routes |
| Ancient halls | Undead and dormant guardians | Recoverable rooms, treasure, and relic objectives |
| Crystal caverns | Elementals and territorial cave creatures | Gem deposits and magical discoveries |
| Volcanic depths | Fire creatures and large deep predators | Hazardous crossings and valuable resource positions |

Enemy behaviors should make layout matter: melee groups pressure entrances, ranged enemies challenge exposed approaches, and selected burrowers may threaten ordinary earth walls. Which species can dig, break doors, or target specific rooms remains to be defined. No creature can tunnel through bedrock.

The [enemy concept gallery](concept-art/enemies/README.md) explores two visual candidates for each region, with front, rear, and overhead studies. These concepts give the inhabitants possible appearances and names; their abilities, scale, and inclusion in the final roster remain provisional.

## Attacks

Dwarfs arrive through the Hearthstone's runic connection. Enemies approach through the physical underground map.

Proposed attack sources are local camps or nests disturbed by expansion, and organized raids entering through established map passages. Opening a route can expose the base to inhabitants that were previously separated by solid ground.

Hostile groups must have a route to the base or a clearly defined way to create one. Attack rules should respect bedrock, doors, walls, and discovered terrain. Enemies should not simply appear inside protected rooms. Raid timings, warnings, and whether a source can be permanently cleared depend on the scenario and remain to be authored.

## Candidate levels

| Candidate stronghold | Terrain and existing spaces | Main challenge | Proposed objective | Uses for recurring systems |
|---|---|---|---|---|
| Border Foothold | Compact starting cavern, buried guard chambers, nearby gold, and one initial hostile region | Establishing food, beds, storage, and a defended route | Secure the surrounding passages and clear the nearby hostile camp | Introduces excavation, needs, reinforcement, and defense |
| Flooded Workings | Separated mining chambers, water channels, bedrock ridges, and abandoned tunnels | Restricted construction space and longer travel routes | Reclaim a central mining district and secure its approaches | Storage placement, bridges, exploration, and dispersed defenses |
| Fallen City | Large hidden halls, occupied districts, intersecting streets, and buried connections | Defending several fronts as the city opens up | Reclaim designated districts and defeat their occupying forces | Every specialist supports a growing network of rooms and guard positions |
| Crystal Divide | Valuable gem deposits across a network of caverns and narrow passages | Sustaining the economy while protecting remote workers | Secure the gem region and remove its principal threat | Mining capacity, treasury access, spells, and defensive corridors |
| Royal Deep | Extensive ruins, multiple hostile regions, a vulnerable core approach, and limited safe expansion | Maintaining a large settlement during a prolonged reclamation | Break the occupation and survive its final counterattack | Combines all available rooms, roles, and defenses |

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
- An explicit victory condition beyond merely keeping the Hearth intact.
- Continued uses for every available room and dwarf type, including shared training and useful spell research, with more than one viable approach to major obstacles where practical.
- Usable furnishing arrangements in the map's confined and irregular spaces, with readable room floors and walls from different camera directions.

## Decisions still open

- Campaign length, level order, objectives, and unlock sequence.
- Initial miner counts, usable starting storage, and starting gold.
- Resource placement visibility, environmental hazards, and bridge behavior.
- Enemy roster, nest activation rules, raid timing, and warning systems.
- Whether reclaimed rooms can be used immediately or need repair.
