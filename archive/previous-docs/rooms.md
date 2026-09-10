> Historical snapshot from the documentation cleanup. It may describe superseded behavior. Use the [active documentation](../../README.md) for development.

# Rooms and structures

Roadmap scope: Guard Posts/guard duty and door repairs/upgrades in place are deferred outside the active roadmap following removal of M12 and M15. References below to these features remain design proposals, not scheduled implementation requirements. Existing doors and traps remain implemented.

Working design for the dwarven stronghold game. Companion documents: [Characters](characters.md), [Levels](levels.md), [Game rules](game-rules.md), and [Gameplay interface](gameplay-interface.md).

Campaign room construction and reclaimed room services check the area's shared availability. Free room construction waives construction gold, while room knowledge and normal access remain required.

## Discoverable dwarven ruins

Ruins are pre-laid neutral room remnants defined in `src/content/ruins.ts` and authored per level. Normal fog conceals their floor treatments and furnishings; earth or rock can cover parts of their irregular footprints. Opening a route and discovering a room grants no capacity by itself. Stonehands use the ordinary autonomous claiming work pool, physically reaching each uncovered floor square before converting it to an owned room tile.

The provisional `ruinTuning` values are **four seconds of work per floor square**, **zero gold**, and **four squares of security range**. Living inhabitants within that range and clear sight contest the tile and prevent claiming; a blocked approach prevents the worker reaching it. Locked campaign room types remain neutral and traversable, provide no services, and cannot be claimed until their room plans are available. This also applies in free construction mode. There is no repair chain, relic currency, paid restoration or separate service system.

On conversion, each floor square immediately joins the ordinary room component, capacity and automatic cosmetic furnishing systems. Beds, food, storage, training, crafting and research retain their normal recruitment, staffing, support and reachable-access requirements. A blocked or locked entrance can make claimed services inaccessible. Single tiles, strips, L shapes, separated patches and partially obstructed rooms follow exactly the shared room checklist: only actual owned floor contributes capacity, furnishings never change movement or service capacity, and occupied earth/bedrock contributes none. Ruin room tiles have zero original paid cost, so selling them refunds no gold and cannot produce a free-build resale profit.

The reusable waystation, foundry and archive arrangements can be translated with `placeRuin`, or level definitions can supply arbitrary room footprints. Remnant damage is cosmetic and persists after claiming until the room tile is sold/rebuilt. `tests/ruins.test.ts` covers normal timed reclamation, occupation, excavation, restricted plans, access, layout/capacity, furnishing independence and free construction behavior.

## Implementation status

See the [current implementation inventory](development-plan.md#current-implementation-status) for all rooms and structures, including missing content and partial integrations. The catalog and rules below describe the intended design, not a list of completed features. Update the inventory whenever a room or its services change.

## Design status

**Current visual direction:** the [room overhaul](../../room-overhaul.md) supersedes the earlier dense furnishing proposals below. All six rooms have distinctive patterned floors and sparse adaptive furnishing. Treasure Rooms show sequential loose coin piles from actual stored wealth. Dormitories show bedding only for assigned residents, including distinct role beds and Hound dens. Kitchen, Workshop, Training Room and Library use small equipment sets with open floor. Their [six concepts and prompts](../../concept-art/rooms/overhaul/prompts.md) guide ongoing refinement.

The grid, adaptable room shapes, distinctive floors and walls, fixed Hearthstone, treasure storage, shared food and accommodation, doors, traps, and spell research are established parts of the design. Room capacity is floor area multiplied by a tunable value per tile. Furniture is entirely cosmetic: it never supplies capacity, blocks movement or sight, or makes a room unusable. The Workshop attracts Engineers and makes doors and traps; the Library attracts Runesmiths and researches spells; the Training Room attracts Warriors and lets specialists train. The Kitchen supports residents without food inventories or processing chains. Exact prices, rates, capacities and art arrangements remain balance and visual choices.

## Dormitory companion support

A Cave Hound uses one assigned Dormitory place as a den for eating and resting, without Kitchen capacity or wages. Each spare place can support another arrival; hounds have no fixed animal cap. Later recruitment follows supported defender types and specialist work demand. A full Dormitory opens an expansion message with a build action, clearing when space becomes available. Capacity uses accessible floor-area services and ignores decorative beds. Reclaiming or blocking den access releases reservations and triggers ordinary support grace. No kennel room or food inventory is added. See [recruitment balance](characters.md#cave-hounds-and-population-balance).

## Training Room and Library prototype rules

The Training Room costs 22 gold per square and provisionally supports one simultaneous trainee per square. Engineer, Warrior and Runesmith specialists can train autonomously, with or without visible equipment. A visit ends after gaining one character level: the dwarf releases its slot, returns to normal activities and starts its personal cooldown. Training requires a free reachable slot, adequate needs, the preceding level and the next level's active training time. Partial progress belongs to the dwarf and survives interruptions, expansion and room reclaim. [Character levels and training](characters.md#character-levels-and-training) owns the level limits, per-type health/combat/work statistics, training durations and cooldown. Successful melee hits contribute to the same XP total at roughly twice the training rate, even during training cooldown. Ordinary work grants no XP. Guard duty remains future work.

The Library costs 26 gold per square and provisionally supports one simultaneous researcher per square. Only residents with the `research` capability perform research. Select a spell in **Spells → Research**; each order reserves one researcher and one reachable room slot. Different spells can progress simultaneously within the room's capacity. Pause/resume retains progress. Losing a slot or room access releases its worker without erasing research or prepared spells. Lecterns, shelves and desks are visual arrangements only.

Casting consumes a prepared spell and automatically queues its next preparation, giving the Library ongoing work. Casting uses shared gold; no extra currency is introduced. See [interface rules](gameplay-interface.md#training-research-and-arrival-controls) for controls.

These costs, times, limits and bonuses are editable prototype values in [Game configuration](../../configuration.md). Both rooms use the normal layout, access, capacity, free-construction and reclaim systems. Their attraction services are `training` for Warriors and `research` for Runesmiths; arrivals also require spare shared food and bed capacity.

See the [spell design document](../../spells.md) for the spell catalog, balance values, targeting rules and implementation status. Keep spell catalog changes there; this document covers the Library's facilities and research service.

## Placement and capacity

- The world uses a square grid. Players select tiles to excavate and designate room footprints on usable, claimed floor.
- All rooms occupy the level's common floor plane. Intact terrain is one full layer above it; excavation creates floor space rather than intermediate shelves, terraces, or another storey.
- Rooms can be any size or shape formed from those tiles: rectangles, narrow strips, bends, branching areas, or shapes following bedrock seams and wrapping retained earth tiles. A single tile provides its configured capacity even if no furnishing fits.
- Prototype grouping rule: tiles of the same room type that share an edge form a connected room. Disconnected patches operate separately; touching only at a corner does not connect them.
- Rooms must be reachable for dwarfs to use them. An isolated room does not satisfy a need simply because it exists.
- Capacity equals actual room-floor tile count multiplied by that room type's `capacityPerTile`, rounded down per connected room when fractional values are used. Equal floor areas within a connected room provide equal capacity regardless of shape or furniture count. Terrain and other excluded squares contribute nothing.
- The player designates and expands the room; its floor, wall treatments, and furnishings adapt automatically. Individual furniture placement is not required.
- Floors and available wall faces identify the room immediately. Furnishings appear where they look appropriate; missing or rearranged furniture has no gameplay effect.
- A specialist room attracts its associated dwarf type only when the settlement also has support capacity.
- The same room must remain useful on later levels. Unlocks remain available across the campaign.
- Players place facilities and defenses; dwarfs operate them automatically.

Provisional defaults are deliberately simple and can be balanced later:

| Room | Capacity per floor square |
|---|---|
| Treasure Room | 50 gold |
| Dormitory | Accommodation for 1 resident |
| Kitchen | Food support for 1 resident |
| Workshop | 1 simultaneous Engineer |
| Training Room | 1 simultaneous trainee, of any dwarf type |
| Library | 1 simultaneous researcher |

Capacity limits the service, not the number of characters allowed to walk through a room. Real terrain, the Hearth, doors and other gameplay obstacles still constrain routes. Room furniture never adds collision or blocks discovery, spell sight or projectiles.

## Bedrock seams and retained earth

Bedrock usually forms continuous seams or bands through the surrounding terrain. These shape the edges of an excavation and can project into a room as connected, stepped sections. The standard room example should show that connection to the wider geology rather than an isolated heap of boulders in the middle of a finished floor.

Both bedrock and ordinary earth occupy whole terrain tiles. Their boundaries against usable floor follow square-grid edges, with right-angle steps where the outline changes. Rock textures, cracks, and surface relief can look natural while preserving that readable footprint. Solid terrain has no room floor or usable capacity underneath it.

The player can leave individual squares or small groups of ordinary earth unmined within an excavated room. These create square holes in the room's usable footprint and remain diggable. They are terrain cells, not placed furniture or automatically classified as bedrock. Mining them later creates new space that can be claimed and designated for the room.

Furnishings and continuous movement must respect both kinds of occupied terrain. Keep a route around a retained earth block or along a bedrock seam; do not draw room furniture on terrain cells. Earth, reinforced earth, and indestructible bedrock must remain visually distinguishable.

## How rooms adapt to their footprint

Every room uses three visual layers:

1. **Floor identity:** a distinctive material, pattern, border, and room motif on every designated tile. Even a tiny or unfurnished room must be recognizable.
2. **Wall identity:** suitable trims, banners, racks, or other fittings on existing wall faces bordering the room. Room decoration does not create new walls or reinforce earth; structural reinforcement remains a miner job.
3. **Furnishings:** beds, workstations, storage, and larger arrangements added automatically wherever there is sufficient usable space.

Rooms in open caverns or directly beside another room may have few walls. Their floor patterns and boundary treatments must still identify them. Adjacent room types can share an open edge without automatically adding a dividing wall. Wall treatments must preserve the visible distinction between ordinary earth, reinforced walls, and bedrock.

Each room type uses compact furnishings and larger arrangements rather than one complete room model scaled to fit. Furniture keeps a consistent visual size. A Library fits long shelves and a few lecterns where space permits. Workroom equipment counts do not represent gameplay slots. Dormitory bedding is the exception in its information: one visible bed or den represents one actual resident assignment, so unused floor communicates spare accommodation at the default capacity.

### Placement and circulation rules

- Fit each furnishing visually to available floor or wall space, considering orientation and readable character activity.
- Dwarfs and enemies move continuously through room-floor space. Furniture never participates in collision, pathfinding, sight or service access.
- Prefer arrangements that leave entrances, door movement and common routes visually clear. A prop cannot seal a passage or remove a service slot.
- Open space can remain empty when no suitable object looks good; the room still provides its full capacity.
- Judge each part of an irregular room locally. A narrow arm must not prevent a spacious part of the same room from receiving larger furnishings.
- Fit a small equipment set as space becomes available, promoting compact fallbacks when larger variants fit. Expansion need not add more objects: the Workshop keeps one main bench, anvil and rack. Do not require the whole room to become a particular rectangle or purchase a room upgrade.
- Retain suitable furnishings when expanding where practical. Avoid unnecessary visual rearrangement on every added tile.
- Recalculate visuals after floor changes or new openings. Gameplay slots and stored gold belong to the room service, independently of decorative objects.

Reducing room area reduces service capacity. Excess stored gold must remain in the world for hauling; completed crafted items and earned training/research progress must survive room changes. Release invalid service reservations safely and report lost capacity or real route access. Moving or removing decoration alone must not affect any of these values.

### Capacity and feedback

Room-floor area is the only source of room capacity. Accommodation, eating, training, crafting and research use reachable service slots, independent of the position or presence of decorative beds, tables or equipment. Storage capacity is likewise independent of visible chests.

Show floor area, capacity per tile, resulting capacity and service occupancy in the left sidebar. Expansion feedback should make the added capacity predictable. Explain real problems such as "No route to this Library" or "More Kitchen capacity needed"; never require space for a furniture model. Room names, capacity numbers, and progress bars never float above the room, including on hover or selection. See [Gameplay interface](gameplay-interface.md).

Two rooms with the same tile count have the same capacity. Rectangles, thin strips, bends and irregular wings can look different, but none receives a shape bonus or a furnishing penalty. Location and real route access still determine travel time and whether dwarfs can use that capacity.

## Visual identity and furnishing plan

The following art treatments and object sets are proposals. Every growable room requires an identity that reads before it contains furniture, and furnishings that remain legible from all camera directions.

The [room concept gallery](../../concept-art/rooms/README.md) illustrates each growable room in compact, expanded, bent or irregular, and bedrock-seam layouts, plus a terrain reference and placement examples for the Stone Hearth and bridges. The sheets use the approved gold-and-gem terrain style: excavations within continuous earth and bedrock, a single terrain height, dense weathered materials, and warm practical lighting. Each room keeps its distinctive floor and wall treatment. These are visual studies, not mandatory footprints, capacity values, or upgrade tiers. Exact [revision prompts](../../concept-art/rooms/prompts-v3.md) are stored with the images.

| Room or structure | Floor identity | Available wall faces | Furnishings or details added where space permits |
|---|---|---|---|
| Stone Hearth | Radial rune markings around the fixed core | Carved stone and runic accents where walls already exist | The core keeps its fixed footprint and statistics; expanding the surrounding cavern creates space for other rooms, with no Hearth upgrades |
| Treasure Room | Charcoal vault slabs, brass corners and diamonds | Vault bands and embossed coin motifs | Consecutive tile-sized coin heaps reflect actual stored wealth; no room chests |
| Dormitory | Warm brown stone with woven bands | Timber trim | Resident-specific compact beds and Hound dens appear only for assigned occupants; spare floor stays empty |
| Kitchen | Terracotta and cream paving | Cookware and timber trim | One stove and one communal table with benches; compact table fallback; no food inventory |
| Workshop | Teal stone with brass guides | Tool boards and metal braces | One main assembly bench, one anvil and one upright rack; expansion leaves more work space |
| Training Room | Red stone with circular practice marks | Banners and target motifs | Straw dummy, shield dummy, upright target post and padded striking pillar; no horizontal exercise machinery |
| Library | Blue slate with silver borders and stars | Carved script and reading lights | A few long freestanding bookcases and separate lecterns with open aisles |
| Guard Post | Clearly marked defensive floor emblem | Guard insignia where walls are present | Standing guard positions first, then a signal fitting or equipment rack if circulation allows |
| Bridge | Repeating deck tiles and visible edges | No room wall treatment required | Edges and supports adapt to connected bridge tiles; doors or other permitted fixtures must preserve a usable crossing |

The Stone Hearth is a fixed structure, and doors and traps retain their individual footprints. They are exceptions to expandable room furnishing. Bridge surfaces follow their placed tiles rather than using interior furniture. Details of bridge routing and eligible fixtures follow the bridge rules below.

## Room catalog

| Room or structure | Purpose | Dwarfs attracted | Output or continuing service |
|---|---|---|---|
| Stone Hearth | Protects the awakened Hearthstone; anchors the base and receives new dwarfs | Arrival point for eligible specialists and purchased miners | Dwarf arrival access and the fixed structure enemies must destroy to win |
| Onward Hearthstone | A separate, hidden map-authored crystal in a difficult location | None | Physical activation completes the local objective; the campaign offers explicit travel or its final endpoint |
| Treasure Room | Stores delivered gold and provides wage collection points | None directly | Gold storage capacity; does not generate money |
| Dormitory | Provides sleeping and resting space | Supports every resident type | Bed capacity and rest |
| Kitchen | Provides shared food support and a place to eat | None directly; supports all arrivals | Resident support from floor area; enlarge it or build several to support the population |
| Workshop | Makes the stronghold's defensive fixtures | Engineers | Doors and traps; repairs and replacement mechanisms are proposed ongoing work |
| Training Room | Provides shared training for specialists | Warriors | Stat increases for the dwarfs using its accessible training positions |
| Library | Houses spell research | Runesmiths | Research progress and researched spells |
| Guard Post | Establishes a place for available defenders to gather and guard | None directly | Local defensive presence and quicker response |
| Bridge | Connects traversable floor across a suitable water or lava gap | None | A Miner-built stone route across water/lava for dwarfs and enemies; chasms are unbridgeable |

## Bridges and hazardous crossings

Water, lava and chasms are map-authored, impassable terrain on the single layer. They allow sight and projectiles across them; camera movement never discovers terrain. There is no contact damage or swimming. Dwarfs and ordinary enemies cannot enter an unbridged hazard; the Cinderling explicitly crosses unbridged lava, while water and chasms still block it. Chasms cannot be bridged in this prototype.

Choose **Bridge icon** in the Rooms grid and click or drag discovered water/lava. Each connected plan must reach claimed land or an existing bridge/plan connected to land. Miners build one square at a time while standing on reachable adjacent claimed land or a completed bridge. Corner contact provides no support. Bent, branching, wide and single-square bridges use the same rules; no maximum supported water/lava span is imposed. A single shore supports construction, and reaching the opposite shore opens the crossing.

Each square costs provisionally **20 shared gold and eight seconds of Miner work**, tunable in src/game/terrain.ts. Gold is charged once when planned; unaffordable selections do nothing. Free room construction makes bridge plans free but preserves discovery, support, access and work requirements. Interrupted work remains on the tile. Plans never provide traversal. Completed stone decks remain at the common floor height and carry both dwarfs and enemies through shared navigation.

Bridges supply no room service capacity, attract nobody, and have no interior furnishings. Procedural deck joints and edge blocks adapt to neighboring tiles and are cosmetic. Rooms, walls, doors and traps cannot be built on bridge tiles. Ordinary rooms continue to use land-only construction and their normal capacity rules.

Choose **Sell** to cancel plans or reclaim decks. Cancelled plans refund all paid gold; completed decks refund the normal room reclaim fraction. Free squares refund zero. The operation rejects occupied decks, loose gold, removal that cuts any living unit off from currently reachable land, and sections that would leave remaining decks/plans unsupported. Remove unsupported sections together. Removal restores the original hazard, invalidates paths, and cancels affected work on the next tick; no tile or payment is recreated by a stale job. Bridges have no damage, collapse or maintenance system in M16.

The **crossings / Emberwater Crossing** scenario starts with ordinary crew, allowance and resources. It requires a water crossing followed by lava to reach the onward Hearthstone; an optional chasm pocket demonstrates the unbridgeable rule. Load it through Debug → Additional test scenarios. Border Foothold starts the connected campaign; its first gate unlocks bridge construction and travel to the expanded campaign version of Emberwater. The standalone crossings scenario remains 28×18.

## Stone Hearth and Hearthstone

The Hearthstone is the natural magical crystal. The Stone Hearth is the protective structure erected around it at the start of the level. Together they form the base's core.

- The starting mining crew awakens the crystal and establishes the protective structure automatically during the arrival sequence.
- The structure has a fixed, map-defined location and footprint. A 3 by 3 footprint is a candidate, not a locked dimension.
- It cannot be moved and has no upgrades.
- Enemies must reach and attack it. Its destruction defeats the player.
- New dwarfs emerge beside it and walk into the settlement.
- Its connection to the ancient runic network explains arrivals without a surface corridor.
- No separate power distribution, fuel, or electricity management system is required.

Core health and whether the damaged structure can be repaired remain open.

Every level also contains a separate onward Hearthstone, usually in an enemy-held area or beyond a difficult terrain obstacle such as lava. It is an authored objective, not a player-built room or an upgrade to the starting core. The player must discover and reach it to open the route to the next area. It does not provide another recruitment point or treasury. [Levels](levels.md#onward-hearthstone-objective) defines implemented discovery, access and activation, with next-area travel and the final campaign endpoint defined in [campaign rules](levels.md#authored-campaign-and-travel). The starting core has 400 health and no repairs; the onward stone is indestructible and reserves its tile from construction.

## Treasure Room

Miners extract gold from finite gold deposits and renewable gem deposits, then carry it to storage. Gems provide the same gold currency rather than a second spendable resource.

If neither a Treasure Room nor the Stone Hearth treasury has reachable free capacity, mined gold or gem yields remain on the ground where they were extracted. Miners collect and deliver them once reachable storage with free capacity exists. Full or unreachable storage also leaves resources waiting; undelivered resources do not disappear or become spendable.

Each Treasure Room square provisionally stores 50 gold. Visible coin heaps fill consecutive floor squares up to this configured per-square capacity before starting the next heap. Empty rooms have no gold props, and room chests are removed. Piles summarize real stored wealth within that connected room, independently of which service receives a delivery; they never transfer currency or change delivery access. Undelivered gold and the starting allowance are not shown in these piles. Construction and recruitment use stored funds; dwarfs physically visit reachable treasury service slots to collect wages.

Storage and route problems need clear feedback: no free capacity, no reachable room, or insufficient stored gold. Treasure Rooms near mines reduce hauling distance; rooms near residents make wage collection more convenient. Wages draw from the shared allowance and storage reachable from the collecting dwarf; disconnected storage cannot pay them remotely. Each collection reserves an available service slot and rechecks funding at completion.

## Accommodation and food

Dormitories provide accommodation for living resident types, including Warriors, provisionally one resident per square. Each resident claims one accommodation slot, counted only once. Its bed or den appears when assigned and stays while that resident is elsewhere. Death, departure, lost access and reclaim release or relocate bedding through the support assignment rules. Role-specific bed shapes and colors distinguish Warriors, Engineers, Runesmiths, retained Miners and Cave Hounds; Stonehands require no bedding. Residents still use reachable floor services independently of decoration. The Training Room provides no accommodation.

All dwarfs get food from the Kitchen. Its floor area supplies ongoing resident support, provisionally one dwarf per square. One large Kitchen or several reachable Kitchens can support the population. Existing residents consume that support before the settlement qualifies for more arrivals.

There are no ingredients, cooked-meal inventories, ale stocks, growing/cooking/brewing production steps or dedicated Cook. Mushrooms, stoves, food and casks are visual details. Dwarfs still travel to a Kitchen and spend time eating, so room location and autonomous needs remain meaningful.

Food support and accommodation must serve existing residents as well as qualify the base for new arrivals. Count only reachable room services when checking support. Distinguish insufficient room capacity from blocked access in the sidebar. Walking distance and occupied service slots affect how quickly dwarfs return to work; visible furniture never creates an additional requirement.

## Work and training facilities

| Facility | Staffing and inputs | Proposed output handling | What keeps it useful |
|---|---|---|---|
| Workshop | Engineer working time and gold | Manufactured items support player-selected door and trap placements | New defenses, repairs, and replacement mechanisms |
| Training Room | Any eligible dwarf's active practice time and a free reachable training slot | One character level per visit, applying its defined health, combat and work statistics | Developing the fresh population in every stronghold, across all roles |
| Library | Research-capable resident's time and accessible research position; casting costs shared gold | Initial research and one prepared charge per spell | Preparing spells again after casting; campaign progression remains open |

The Workshop combines metalworking and mechanism assembly in one facility. The Library is the single spell-research facility. Gold, labor, room capacity, and food support this simplified draft; separate equipment production, ore processing, and magical currencies are not established systems.

Training is available to Engineers, Warriors and Runesmiths. Miners do not train or gain experience or levels. The player supplies room capacity, and dwarfs train autonomously through their type's defined levels. [Characters](characters.md#character-levels-and-training) records advancement rules and balance. Capacity feedback shows occupied and available training positions; cooldown does not occupy a slot, and training provides no accommodation.

The room catalog supports the [dwarf roster](characters.md). Additional rooms and more powerful dwarf types can be introduced later, after the core gameplay works.

## Adding room types later

Room definitions describe their service, capacity per tile, price, eligible worker capabilities and visual identity. Furnishing models and dimensions are separate visual data. Shared construction, service-slot allocation, capacity reporting and recruitment consume these definitions; navigation uses real terrain and gameplay obstacles. A new room can reuse these systems and introduce a new service only if needed. Recruitment relationships allow shared rooms and multiple conditions. See the [architecture requirements](game-rules.md#14-extensible-character-and-room-definitions).

## Room development and debugging

The [development plan](development-plan.md) schedules shared room support and a Room Debug View in M5, a sidebar Debug menu and free room construction flag in M5.1, then the Dormitory, Kitchen, and Workshop in M6–M8. These features are implemented; verification and prototype limitations are recorded in the development plan.

Every room addition follows the [room development checklist](../../room-development-checklist.md), which covers definitions, placement, automatic furnishings, capacity, access, services, sidebar feedback, and varied layout checks. Review the existing Treasure Room against the same checklist when establishing shared room support.

The Room Debug View lists all defined room types, distinguishes planned entries from implemented rooms, and lets developers create and expand implemented rooms by selecting grid squares just as in gameplay. It uses the game's actual placement, furnishing, navigation, and rendering systems so its results can reveal gameplay problems. A resettable test area supports irregular shapes, walls, retained terrain, and bedrock without needing a separate editor or saved layouts.

The development free-build flag makes all room creation and expansion free. It leaves the treasury unchanged by those actions and preserves claimed-floor, terrain, occupancy, access, and furnishing rules. Disabling it restores configured costs and affordability checks. Controls and diagnostic information belong in the left sidebar, as described in [Gameplay interface](gameplay-interface.md#development-debug-controls).

## Doors and traps

Implemented fixtures use the grid and shared Workshop stock. Queue an item in Workshop production; an Engineer charges its gold once and manufactures it at a reachable station. The player clicks an enabled icon in Defenses to place a finished item. The player placement tool requires a built Workshop and available stock; unavailable icons are disabled with a reason in the tooltip. Manufacturing is the timed build step; there is no separate delivery or installation job. Free room construction does not waive manufacturing costs or supply defense stock.

| Fixture | Gold | Workshop work | Protection / effect |
|---|---:|---:|---|
| Tier 1 · Timber door | 20 | 4 seconds | 100 health |
| Tier 2 · Reinforced door | 40 | 8 seconds | 250 health |
| Tier 3 · Steel door | 80 | 16 seconds | 500 health |
| Spike trap | 35 | 6 seconds | 40 damage; pins surviving enemies for 2 seconds; resets after 6 seconds |
| Bolt trap | 55 | 10 seconds | 30 damage to the first enemy in its facing; range 7 squares; resets after 3 seconds |

These are provisional balance values, editable in Crafting and Defenses configuration. Work-speed bonuses affect manufacturing time. Health changes affect newly placed doors; existing damage is retained.

All three door tiers have player-selected **Open**, **Closed**, and **Locked** modes. Open admits everyone. Closed lets dwarfs open the door while passing, then shuts after they clear it. Enemies can follow through while it is physically open. Locked prevents dwarfs opening it and immediately updates their routes; this can cut off work, food, beds or unexplored areas. An occupant already in the doorway may step clear before it physically shuts. Idle dwarfs move out of doorways. Shut doors stop discovery rays; changing a mode does not erase previously discovered terrain. Enemies can damage Closed or Locked doors until they break, removing the obstruction.

Doors occupy one clear, claimed square between two opposite walls, with walkable approaches on the other sides. Traps use clear, claimed floor. Fixtures cannot overlap rooms, the Hearth or its treasury approach, other defenses, wall plans or loose gold. Cosmetic room furniture adds no separate exclusion or protected approach. Placement consumes exactly one completed item; invalid placement consumes none. Room/wall construction excludes fixture tiles. Dismantling removes a fixture with no refund; repairs and upgrades in place remain pending.

Spikes trigger when an enemy crosses the pressure plate, including fast crossings. A lethal hit defeats it; a survivor cannot move or attack during the pin. Bolts fire automatically along the selected compass direction, hit one enemy, and do not pierce. Walls, the Hearth and physically shut doors block shots; cosmetic furniture does not. Both traps ignore dwarfs, cause no friendly fire, and **automatically reset after their cooldown**. They need no ammunition, replacement supplies or Engineer rearming. Cooldown starts when triggered; unused traps remain ready.

Defenses are available in normal strongholds against all ten authored enemy types and raid sources. **Debug → Test harnesses → Defense test yard** retains manual tests; the additional `encounters` scenario tests warnings, excavation, source clearing and real combat/traps. Natural enemies use their defined melee or ranged attacks against the starting Hearth. Stonefall and additional slowing traps are design-only possibilities.

## Reinforced walls

Reinforcement is a miner terrain job, not a room or a paid upgrade tree. Available miners reinforce exposed earth walls bordering claimed territory after higher-priority excavation, resource, and hauling work.

The proposed wall model has one visible reinforced state. Reinforced earth is harder for enemies capable of digging to breach; bedrock is completely indestructible. Reinforcement strength, time, and the treatment of reinforced walls when the player later excavates them remain to be finalized.

## Decisions still open

- Per-tile room costs and capacities. Every floor square contributes equally, regardless of layout or furnishings.
- Placement of compact and large furnishing variants in narrow, irregular, expanding, or divided rooms.
- Visual arrangement of furniture after room changes; gold conservation and earned progress must remain independent of decoration.
- Exact specialist attraction thresholds and migration rate.
- Kitchen support per tile and the duration/frequency of eating visits.
- Broader spell list and progression across levels; preparation after casting is the current continuing Library service.
- Balance of the per-character level definitions, active training times and personal cooldown.
- Door, trap, bridge, and core repair rules.
- Room selling, refunds, and rebuilding damaged facilities.

Room placement skips ineligible squares within a drag (terrain, hidden or unclaimed floor, the Hearthstone, and existing rooms). Eligible new squares are built and charged normally; existing rooms are preserved. Previews and price use the eligible subset. An entirely invalid selection builds nothing. The complete eligible subset must still be affordable unless free room construction is enabled.

The Stone Hearth includes one fixed treasury chest using the shared gold-storage service. It starts empty and holds the normal construction cost of a 3×3 Treasure Room (currently 108 gold). It accepts miner deliveries and pays for construction/production through the shared balance, including when the starting allowance is exhausted. The fixed core treasury service protects its approach square. Inspect the Hearth for live stored gold/capacity. It is not a room upgrade or an extra starting grant.

Current prototype reinforcement uses a single state per ordinary dirt/rock tile and takes six seconds of miner work beside reachable claimed floor. It costs no gold and follows mining, hauling and claiming work. Marking a wall for excavation cancels reinforcement; excavating a reinforced wall uses normal player mining time and removes its reinforced state. Resource seams and bedrock are not reinforced. Raw walls have no room fittings until reinforcement completes. Tunnel Burrowers take three times as long to excavate reinforced dirt/rock. Other enemies cannot excavate terrain; Sentinel and Deepmaw attacks apply their defined multipliers to doors and runic barriers. See [Enemies](../../enemies.md).

Room tiles can now be reclaimed using the Reclaim room tiles command. Refunds use the original paid cost and `reclaimRatio` in tuning (initially 50%), so changing room prices or free-build mode cannot create a resale profit. Refunds are spendable immediately; gold displaced by reduced storage remains in the world for hauling. Capacity and reservations update with the remaining room floor. Constructed walls are reinforced rock built by miners on clear claimed floor; the initial 24-second duration is deliberately longer than digging plus reinforcement. They are not rooms and cost time only in this prototype.
