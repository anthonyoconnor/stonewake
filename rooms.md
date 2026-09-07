# Rooms and structures

Working design for the dwarven stronghold game. Companion documents: [Characters](characters.md), [Levels](levels.md), [Game rules](game-rules.md), and [Gameplay interface](gameplay-interface.md).

## Implementation status

See the [current implementation inventory](development-plan.md#current-implementation-status) for all rooms and structures, including missing content and partial integrations. The catalog and rules below describe the intended design, not a list of completed features. Update the inventory whenever a room or its services change.

## Design status

The grid, adaptable room shapes and furnishings, distinctive floors and walls, fixed Hearthstone, treasure storage, shared food and bedding, doors, traps, and spell research are established parts of the design. The simplified facilities are a Workshop that attracts Engineers and makes doors and traps, a Library that attracts Runesmiths and researches spells, and a Training Room that attracts Warriors while letting all dwarfs improve their stats. Kitchen is the working name for the combined food and brewing room. Exact art treatments, production handling, defensive examples, prices, furnishing footprints, rates, and capacities remain proposals or balancing decisions.

## Training Room and Library prototype rules

The Training Room costs 22 gold per square and automatically fits 1×1 practice dummies and 2×1 weight stations, each with one clear working position. Every resident can train autonomously. Each level takes 12 seconds of practice and gives an 8% work-speed increase, up to five levels. Sessions are spaced by 45 seconds so dwarfs return to their other work; food and rest take priority. Training costs time only. Progress belongs to the dwarf and survives interruptions, expansion and room reclaim. Combat effects and guard duty remain future work.

The Library costs 26 gold per square and fits 1×1 lecterns and 2×1 shelf/reading stations with one research position each. Only residents with the `research` capability perform research. Select a spell in **Spells → Research**; each order reserves one researcher and one accessible station. Different spells can progress simultaneously at separate stations. Pause/resume retains progress. Removing a station releases its worker without erasing research or prepared spells.

The provisional spell list is Hearth Prospect (32 seconds of initial research, 12 seconds to prepare again, 20 gold per cast) and Hearth Haste (40 seconds initially, 16 seconds thereafter, 30 gold per cast). Prospect extends normal sight from the Hearth to 16 tiles, respects solid walls, and spends nothing if no new terrain can be revealed. Haste adds 35% work speed for 30 seconds and cannot stack with itself. Casting consumes a prepared spell and automatically queues its next preparation, giving the Library ongoing work. No extra currency is introduced. See [interface rules](gameplay-interface.md#training-research-and-arrival-controls) for controls.

These costs, times, limits and bonuses are editable prototype values in [Game configuration](configuration.md). Both rooms use the normal layout, access, capacity, free-construction and reclaim systems. Their attraction services are `training` for Warriors and `research` for Runesmiths; arrivals also require spare shared food and bed capacity.

See the [spell design document](spells.md) for the spell catalog, balance values, targeting rules and implementation status. Keep spell catalog changes there; this document covers the Library's facilities and research service.

## Placement and capacity

- The world uses a square grid. Players select tiles to excavate and designate room footprints on usable, claimed floor.
- All rooms occupy the level's common floor plane. Intact terrain is one full layer above it; excavation creates floor space rather than intermediate shelves, terraces, or another storey.
- Rooms can be any size or shape formed from those tiles: rectangles, narrow strips, bends, branching areas, or shapes following bedrock seams and wrapping retained earth tiles. A single tile can be designated even if it cannot yet accommodate a functional furnishing.
- Prototype grouping rule: tiles of the same room type that share an edge form a connected room. Disconnected patches operate separately; touching only at a corner does not connect them.
- Rooms must be reachable for dwarfs to use them. An isolated room does not satisfy a need simply because it exists.
- Usable capacity depends on the size and shape of the room, the furnishings that fit, and access to their working positions. Total tile count alone does not guarantee a particular number of beds or workstations.
- The player designates and expands the room; its floor, wall treatments, and furnishings adapt automatically. Individual furniture placement is not required.
- Floors and available wall faces identify the room immediately. Furnishings appear only where their footprints and access space fit.
- A specialist room attracts its associated dwarf type only when the settlement also has support capacity.
- The same room must remain useful on later levels. Unlocks remain available across the campaign.
- Players place facilities and defenses; dwarfs operate them automatically.

## Bedrock seams and retained earth

Bedrock usually forms continuous seams or bands through the surrounding terrain. These shape the edges of an excavation and can project into a room as connected, stepped sections. The standard room example should show that connection to the wider geology rather than an isolated heap of boulders in the middle of a finished floor.

Both bedrock and ordinary earth occupy whole terrain tiles. Their boundaries against usable floor follow square-grid edges, with right-angle steps where the outline changes. Rock textures, cracks, and surface relief can look natural while preserving that readable footprint. Solid terrain has no room floor or usable capacity underneath it.

The player can leave individual squares or small groups of ordinary earth unmined within an excavated room. These create square holes in the room's usable footprint and remain diggable. They are terrain cells, not placed furniture or automatically classified as bedrock. Mining them later creates new space that can be claimed and designated for the room.

Furnishings and continuous movement must respect both kinds of occupied terrain. Keep access around a retained earth block or along a bedrock seam; do not place beds or workstations on blocked cells. Earth, reinforced earth, and indestructible bedrock must remain visually distinguishable.

## How rooms adapt to their footprint

Every room uses three visual layers:

1. **Floor identity:** a distinctive material, pattern, border, and room motif on every designated tile. Even a tiny or unfurnished room must be recognizable.
2. **Wall identity:** suitable trims, banners, racks, or other fittings on existing wall faces bordering the room. Room decoration does not create new walls or reinforce earth; structural reinforcement remains a miner job.
3. **Furnishings:** beds, workstations, storage, and larger arrangements added automatically wherever there is sufficient usable space.

Rooms in open caverns or directly beside another room may have few walls. Their floor patterns and boundary treatments must still identify them. Adjacent room types can share an open edge without automatically adding a dividing wall. Wall treatments must preserve the visible distinction between ordinary earth, reinforced walls, and bedrock.

Each room type needs compact furnishings and larger arrangements rather than one complete room model scaled to fit. Furniture keeps a consistent physical size. A Library can use short wall shelves in a narrow wing, then add free-standing shelf rows and research tables in a wider area. A Dormitory adds accessible beds, while a Training Room adds practice stations only where the equipment and activity space fit.

### Placement and circulation rules

- Fit each furnishing to actual available floor or wall space, considering its orientation and the space a dwarf needs to use it.
- Dwarfs and enemies move freely within the open floor space rather than stepping between tile centers. Furnishing clearance must support their physical size and continuous routes around objects; an unoccupied grid square alone does not guarantee access.
- Preserve entrances, door movement, routes through narrow connections, and access to beds, workstations, and storage. Furnishings must not seal off part of a room or block a passage through it.
- Give functional furnishings priority over decorative objects. Open space can remain open if no suitable object fits.
- Judge each part of an irregular room locally. A narrow arm must not prevent a spacious part of the same room from receiving larger furnishings.
- Add more objects or larger arrangements as suitable space becomes available. Do not require the whole room to become a particular rectangle or purchase a room upgrade.
- Retain existing valid furnishings when expanding where practical, especially occupied beds and stations. Avoid unnecessary rearrangement on every added tile.
- Recalculate after floor changes, wall excavation, or new doorways make an old arrangement invalid. Keep stored contents and resident assignments associated with surviving or relocated furnishings where possible.

The shared placement system now implements these rules with provisional furnishing footprints. If a later room removal or damage system reduces capacity, excess stored gold or items must be preserved and any lost bed or workstation capacity clearly reported; remodeling must not silently delete residents' resources.

### Capacity and feedback

Beds represent real sleeping places. Working positions represent real specialist capacity. Treasure storage and food facilities represent their respective capacities. Decorative books or barrels alone do not create an extra worker position or extra stored inventory.

Show the room's current usable capacity in the left sidebar when selected and preview changes there while the player expands it. If nothing functional fits yet, retain the room designation and explain the limitation in the sidebar or a dismissible message, such as "Needs space for a research station" or "Bed access blocked." Such a room does not attract specialists merely because its floor has been painted. Room names, capacity numbers, and progress bars never float above the room, including on hover or selection; floors, walls, furnishings, and activity provide its world feedback. See [Gameplay interface](gameplay-interface.md).

Two rooms with the same tile count can support different arrangements. Avoid imposing a universal square-room bonus: the benefit should come from actual objects and accessible working space. Thin sections can still serve as circulation space or accept suitable compact fittings.

## Visual identity and furnishing plan

The following art treatments and object sets are proposals. Every growable room requires an identity that reads before it contains furniture, and furnishings that remain legible from all camera directions.

The [room concept gallery](concept-art/rooms/README.md) illustrates each growable room in compact, expanded, bent or irregular, and bedrock-seam layouts, plus a terrain reference and placement examples for the Stone Hearth and bridges. The sheets use the approved gold-and-gem terrain style: excavations within continuous earth and bedrock, a single terrain height, dense weathered materials, and warm practical lighting. Each room keeps its distinctive floor and wall treatment. These are visual studies, not mandatory footprints, capacity values, or upgrade tiers. Exact [revision prompts](concept-art/rooms/prompts-v3.md) are stored with the images.

| Room or structure | Floor identity | Available wall faces | Furnishings or details added where space permits |
|---|---|---|---|
| Stone Hearth | Radial rune markings around the fixed core | Carved stone and runic accents where walls already exist | The core keeps its fixed footprint and statistics; expanding the surrounding cavern creates space for other rooms, with no Hearth upgrades |
| Treasure Room | Geometric vault tiles with gold-colored inlays | Vault bands and embossed coin motifs | Small storage positions, then larger groups of chests and gold-storage bays with clear collection access; visible gold reflects actual stored wealth |
| Dormitory | Warm stone with woven floor borders | Timber trim and simple personal-storage fittings | Individual beds, then repeated bed arrangements and small lockers wherever access remains clear |
| Kitchen | Earthy food-service tiles with mushroom and tankard motifs | Cookware, timber trim, and barrel-end signs | Compact growing, preparation, and serving fittings, then more mushroom beds, tables, benches, and casks as space permits; capacity reflects working facilities rather than decorative barrels |
| Workshop | Fitted dark stone with brass geometric markings | Tool boards, metal braces, and mechanical fittings | Compact craft benches and anvils, then larger assembly tables, mechanism racks, and repair positions for doors and traps |
| Training Room | Marked practice lanes and clear training emblems on flagstones | Practice equipment, banners, and target motifs | Compact practice stations, then dummies, targets, weights, and larger exercise areas with safe clearance; all dwarf types can use the room |
| Library | Blue rune-inlaid stone with book or script motifs | Short bookshelves, carved script, and reading lights | Compact shelves and lecterns, then research tables and rows of free-standing shelves only where aisles fit |
| Guard Post | Clearly marked defensive floor emblem | Guard insignia where walls are present | Standing guard positions first, then a signal fitting or equipment rack if circulation allows |
| Bridge | Repeating deck tiles and visible edges | No room wall treatment required | Edges and supports adapt to connected bridge tiles; doors or other permitted fixtures must preserve a usable crossing |

The Stone Hearth is a fixed structure, and doors and traps retain their individual footprints. They are exceptions to expandable room furnishing. Bridge surfaces follow their placed tiles rather than using interior furniture. Details of bridge routing and eligible fixtures remain open.

## Room catalog

| Room or structure | Purpose | Dwarfs attracted | Output or continuing service |
|---|---|---|---|
| Stone Hearth | Protects the awakened Hearthstone; anchors the base and receives new dwarfs | Arrival point for eligible specialists and purchased miners | Dwarf arrival access and the fixed structure enemies must destroy to win |
| Treasure Room | Stores delivered gold and provides wage collection points | None directly | Gold storage capacity; does not generate money |
| Dormitory | Provides sleeping and resting space | Supports every resident type | Bed capacity and rest |
| Kitchen | Combines food growing, preparation, brewing, and eating for every dwarf | None directly; supports all arrivals | Standard meals and eating capacity; enlarge it or build several to support the population |
| Workshop | Makes the stronghold's defensive fixtures | Engineers | Doors and traps; repairs and replacement mechanisms are proposed ongoing work |
| Training Room | Provides shared training for every dwarf type | Warriors | Stat increases for the dwarfs using its accessible training positions |
| Library | Houses spell research | Runesmiths | Research progress and researched spells |
| Guard Post | Establishes a place for available defenders to gather and guard | None directly | Local defensive presence and quicker response |
| Bridge | Connects traversable floor across a suitable water or lava gap | None | A route for dwarfs and enemies; crossing rules remain to be defined |

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

## Treasure Room

Miners extract gold from finite gold deposits and renewable gem deposits, then carry it to storage. Gems provide the same gold currency rather than a second spendable resource.

If no Treasure Room is available, mined gold or gem yields remain on the ground where they were extracted. Miners collect and deliver them once reachable storage with free capacity exists. Full or unreachable storage also leaves resources waiting; undelivered resources do not disappear or become spendable.

Usable storage positions within the room's size and shape limit its capacity. Gold piles should show actual stored wealth rather than appear full merely because the room was expanded. Undelivered gold is not yet part of the spendable treasury. Construction and recruitment use stored funds, while dwarfs physically visit an accessible Treasure Room to collect their wages on payday.

Storage and route problems need clear feedback: no free capacity, no reachable room, or insufficient stored gold. Treasure Rooms near mines reduce hauling distance; rooms near residents make wage collection more convenient. Exact withdrawal behavior across multiple rooms remains to be specified.

## Accommodation and food

Dormitories provide beds for every dwarf type, including Warriors. Beds appear automatically where their footprints and access space fit. The proposed baseline is one claimed bed per resident, counted only once. The Training Room provides training capacity, while sleeping capacity comes from Dormitories. Exact furnishing footprints remain to be set.

The Kitchen combines mushroom growing, food preparation, brewing, and eating in one shared room. All dwarfs get their food here. One sufficiently large Kitchen or several accessible Kitchens must support the entire population. Food production, storage, and eating throughput depend on the functional furnishings and access space that fit, not just the number of designated tiles.

Proposed simple production model: food replenishes on site up to the capacity of the growing and serving facilities, without requiring a dedicated Cook dwarf or separate processing rooms. Casks and brewing fittings belong to the same room; they do not create a separate compulsory ale need or production chain. Growth rate, stock capacity, and meal consumption remain tuning decisions.

Food production, eating capacity, and bed spaces must serve existing residents as well as qualify the base for new arrivals. Multiple Kitchens contribute to total provision only where residents can reach them. The interface should distinguish too little food, insufficient eating capacity, and blocked access. Walking distance and queues affect how quickly dwarfs return to work.

## Work and training facilities

| Facility | Staffing and inputs | Proposed output handling | What keeps it useful |
|---|---|---|---|
| Workshop | Engineer working time and gold | Manufactured items support player-selected door and trap placements | New defenses, repairs, and replacement mechanisms |
| Training Room | Any dwarf's time and an accessible training position; time-only prototype cost | Work-speed progression applied to the trainee | Developing the fresh population in every stronghold, across all roles |
| Library | Research-capable resident's time and accessible research position; casting costs shared gold | Initial research and one prepared charge per spell | Preparing spells again after casting; campaign progression remains open |

The Workshop combines metalworking and mechanism assembly in one facility. The Library is the single spell-research facility. Gold, labor, room capacity, and food support this simplified draft; separate equipment production, ore processing, and magical currencies are not established systems.

Training is available to Miners, Engineers, Warriors, and Runesmiths. The player supplies room capacity, and dwarfs train autonomously. Current scheduling, work bonuses and limits are recorded in the prototype rules above; defense integration remains open. Capacity feedback shows occupied and available training positions rather than beds or Warrior-only slots.

The current room catalog supports the four core dwarf types. Additional rooms and more powerful dwarf types can be introduced later, after the core gameplay works.

## Adding room types later

Room definitions should describe their visual identity, compact and large furnishings, placement and access requirements, usable capacities, services or outputs, and eligible worker capabilities. The shared grid designation, automatic furnishing, navigation, capacity reporting, and recruitment systems should consume these definitions. A new room can then reuse those systems and introduce a new service only if needed. Recruitment relationships must allow shared rooms and multiple conditions rather than assume every room exists for exactly one dwarf type. See the [architecture requirements](game-rules.md#14-extensible-character-and-room-definitions).

## Room development and debugging

The [development plan](development-plan.md) schedules shared room support and a Room Debug View in M5, a sidebar Debug menu and free room construction flag in M5.1, then the Dormitory, Kitchen, and Workshop in M6–M8. These features are implemented; verification and prototype limitations are recorded in the development plan.

Every room addition follows the [room development checklist](room-development-checklist.md), which covers definitions, placement, automatic furnishings, capacity, access, services, sidebar feedback, and varied layout checks. Review the existing Treasure Room against the same checklist when establishing shared room support.

The Room Debug View lists all defined room types, distinguishes planned entries from implemented rooms, and lets developers create and expand implemented rooms by selecting grid squares just as in gameplay. It uses the game's actual placement, furnishing, navigation, and rendering systems so its results can reveal gameplay problems. A resettable test area supports irregular shapes, walls, retained terrain, and bedrock without needing a separate editor or saved layouts.

The development free-build flag makes all room creation and expansion free. It leaves the treasury unchanged by those actions and preserves claimed-floor, terrain, occupancy, access, and furnishing rules. Disabling it restores configured costs and affordability checks. Controls and diagnostic information belong in the left sidebar, as described in [Gameplay interface](gameplay-interface.md#development-debug-controls).

## Doors and traps

Implemented fixtures use the grid and shared Workshop stock. Queue an item in Workshop production; an Engineer charges its gold once and manufactures it at a reachable station. The player places a finished item immediately from the Defenses panel. Manufacturing is the timed build step; there is no separate delivery or installation job. Free room construction does not waive manufacturing costs or supply defense stock.

| Fixture | Gold | Workshop work | Protection / effect |
|---|---:|---:|---|
| Tier 1 · Timber door | 20 | 4 seconds | 100 health |
| Tier 2 · Reinforced door | 40 | 8 seconds | 250 health |
| Tier 3 · Steel door | 80 | 16 seconds | 500 health |
| Spike trap | 35 | 6 seconds | 40 damage; pins surviving enemies for 2 seconds; resets after 6 seconds |
| Bolt trap | 55 | 10 seconds | 30 damage to the first enemy in its facing; range 7 squares; resets after 3 seconds |

These are provisional balance values, editable in Crafting and Defenses configuration. Work-speed bonuses affect manufacturing time. Health changes affect newly placed doors; existing damage is retained.

All three door tiers have player-selected **Open**, **Closed**, and **Locked** modes. Open admits everyone. Closed lets dwarfs open the door while passing, then shuts after they clear it. Enemies can follow through while it is physically open. Locked prevents dwarfs opening it and immediately updates their routes; this can cut off work, food, beds or unexplored areas. An occupant already in the doorway may step clear before it physically shuts. Idle dwarfs move out of doorways. Shut doors stop discovery rays; changing a mode does not erase previously discovered terrain. Enemies can damage Closed or Locked doors until they break, removing the obstruction.

Doors occupy one clear, claimed square between two opposite walls, with walkable approaches on the other sides. Traps use clear, claimed floor. Fixtures cannot overlap rooms, the Hearth, furnishings or their access squares, other defenses, wall plans or loose gold. Placement consumes exactly one completed item; invalid placement consumes none. Room/wall construction excludes fixture tiles. Dismantling removes a fixture with no refund; repairs and upgrades in place remain pending.

Spikes trigger when an enemy crosses the pressure plate, including fast crossings. A lethal hit defeats it; a survivor cannot move or attack during the pin. Bolts fire automatically along the selected compass direction, hit one enemy, and do not pierce. Walls, the Hearth, furniture and physically shut doors block shots. Both traps ignore dwarfs, cause no friendly fire, and **automatically reset after their cooldown**. They need no ammunition, replacement supplies or Engineer rearming. Cooldown starts when triggered; unused traps remain ready.

Defenses are available in the normal stronghold. Enemy movement, trap damage, pinning and door breaking can currently be exercised with manually spawned Goblin Raiders in **Debug → Defense test yard**. This uses real construction, production, placement and movement services with supplied test stock. Natural encounters, raids, dwarf fighting and Hearth damage/defeat are still pending. Stonefall and additional slowing traps are design-only possibilities.

## Reinforced walls

Reinforcement is a miner terrain job, not a room or a paid upgrade tree. Available miners reinforce exposed earth walls bordering claimed territory after higher-priority excavation, resource, and hauling work.

The proposed wall model has one visible reinforced state. Reinforced earth is harder for enemies capable of digging to breach; bedrock is completely indestructible. Reinforcement strength, time, and the treatment of reinforced walls when the player later excavates them remain to be finalized.

## Decisions still open

- Per-tile room costs, furnishing footprints and access space, placement priorities, and production capacities. Rooms have no fixed footprint requirement; individual functions need enough space for their furnishings.
- Placement of compact and large furnishing variants in narrow, irregular, expanding, or divided rooms.
- Treatment of displaced furniture or stored contents after later room changes.
- Exact specialist attraction thresholds and migration rate.
- Kitchen food production, storage, serving throughput, and support across multiple rooms.
- Broader spell list and progression across levels; preparation after casting is the current continuing Library service.
- Balance of prototype training gains, limits and scheduling, plus future combat integration.
- Door, trap, bridge, and core repair rules.
- Room selling, refunds, and rebuilding damaged facilities.

Room placement skips ineligible squares within a drag (terrain, hidden or unclaimed floor, the Hearthstone, and existing rooms). Eligible new squares are built and charged normally; existing rooms are preserved. Previews and price use the eligible subset. An entirely invalid selection builds nothing. The complete eligible subset must still be affordable unless free room construction is enabled.

The Stone Hearth includes one fixed treasury chest using the shared gold-storage service. It starts empty and holds the normal construction cost of a 3×3 Treasure Room (currently 108 gold). It accepts miner deliveries and pays for construction/production through the shared balance, including when the starting allowance is exhausted. Its access square is preserved by automatic furnishings. Inspect the Hearth for live stored gold/capacity. It is not a room upgrade or an extra starting grant.

Current prototype reinforcement uses a single state per ordinary dirt/rock tile and takes six seconds of miner work beside reachable claimed floor. It costs no gold and follows mining, hauling and claiming work. Marking a wall for excavation cancels reinforcement; excavating a reinforced wall uses normal player mining time and removes its reinforced state. Resource seams and bedrock are not reinforced. Raw walls have no room fittings until reinforcement completes. Enemy breaching strength remains pending combat implementation.

Room tiles can now be reclaimed using the Reclaim room tiles command. Refunds use the original paid cost and `reclaimRatio` in tuning (initially 50%), so changing room prices or free-build mode cannot create a resale profit. Refunds are spendable immediately; removed chest gold remains in the world and removed food stock is retained for replacement facilities. Constructed walls are reinforced rock built by miners on clear claimed floor; the initial 24-second duration is deliberately longer than digging plus reinforcement. They are not rooms and cost time only in this prototype.
