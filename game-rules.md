# Game rules

Working design for a level-based dwarven stronghold management game inspired by Dungeon Keeper.

Companion documents: [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md).

## Design status

This document records the agreed direction and the current working rules. Proposals and unresolved mechanics are identified explicitly. Numerical balance values are not final. The companion documents expand the inventories without committing to an implementation or a final campaign roster.

The game will be playable in a web browser using **TypeScript + Babylon.js**. The [Development plan](development-plan.md) records the agreed M1–M9 sequence, including M5.1, and guidelines for rapid iteration and extensible content. The room debugging view and free room construction flag support development; the flag waives room construction costs while preserving placement and capacity rules. Game saves, multiplayer, and production hardening are outside the current implementation scope. Implementation is authorized; progress is tracked in the development plan.

## 1. Player role and core loop

The player manages a dwarven expedition reclaiming a lost underground kingdom, one stronghold at a time.

The core loop is:

**Excavate -> discover resources and spaces -> build facilities -> recruit and support dwarfs -> research and prepare defenses -> explore and fight -> reclaim the stronghold.**

Layout management is the primary activity. The position and connections of rooms, storage, doors, traps, and passages determine how well the settlement functions and defends itself.

## 2. Player control

- Select grid areas for excavation.
- Place rooms, doors, traps, and other available structures on the grid.
- Purchase additional miners using stored gold.
- Choose a call-to-arms location to guide available fighters toward an area.
- Cancel the rally to let responders return to their normal routines.

Dwarfs handle their movement, jobs, needs, and fighting autonomously. There is no possession, individual movement command, or direct troop control.

Proposed first rally model: one active marker at a time. Responders walk to it and engage enemies without further unit orders. The selection of responders, range, cost, and behavior after reaching the area remain open.

Spells are accessed through the left sidebar. Available player-cast spells use a target selection when applicable; spell effects, costs, research order, and casting restrictions remain to be defined. Dwarf behavior stays autonomous.

### Autonomous movement

The grid defines excavation and construction. Dwarfs and enemies move continuously through the actual open space in halls and rooms, with positions and travel directions independent of tile centers.

- Movement can follow any clear direction, including diagonal routes across open rooms, without snapping from square to square.
- Walls, closed doors, and solid furnishings constrain routes according to their physical shape. Characters must not pass through obstacles or squeeze diagonally between touching blocked corners.
- The space needed by a character determines where it can fit. There is no rule limiting a floor tile to one character.
- Proposed crowd behavior: characters steer around one another, pass where there is room, and yield or queue at narrow openings. Wider passages should support better traffic flow.
- Routes respond to excavation, door changes, and automatic furnishing changes. Room boundaries alone do not obstruct movement.
- A call to arms draws responders into accessible space around the rally location; it does not arrange them on individual grid squares or give the player direct movement control.

Character sizes, avoidance distances, and crowd behavior need tuning alongside corridor widths and furnishing clearance. The movement model applies to both dwarfs and enemies.

### Visual style and camera

The agreed visual direction is stylized 3D with an elevated overhead view. The player can rotate the camera and zoom in and out. The supplied Dungeon Keeper screenshot is a reference for the overhead view into excavated rooms and passages.

- Camera movement supports inspecting and planning the stronghold: pan across the map, rotate around the viewed area, and zoom between a broad layout view and closer observation of dwarf activity.
- Characters, room fixtures, doors, and terrain must remain recognizable from different camera directions.
- Excavation selections and room previews stay aligned to the world grid as the camera rotates. Rotating the view does not rotate the map or an existing selection.
- Essential room functions, doors, traps, and dwarf roles must remain readable at the normal management zoom.
- Each room type has recognizable floors and treatments on existing bordering wall faces, so its identity remains clear before it has enough space for furnishings.
- Camera rotation and zoom never reveal unexplored chambers or hidden enemies that the discovery rules conceal.

Proposed controls: smooth 360-degree horizontal rotation, mouse-wheel zoom, and a fixed elevated tilt that keeps room footprints easy to judge. Exact bindings, camera projection, tilt, and zoom limits remain to be selected during prototyping.

Proposed art treatment: substantial stonework, chunky dwarf silhouettes, warm occupied rooms, and cooler natural caves. Diggable ground, reinforced walls, bedrock, gold veins, and gem deposits need distinct shapes and surface treatments.

Proposed visibility aid: lower or fade foreground walls when they obscure usable rooms and residents. This affects only the drawing of already visible areas; it does not remove defensive walls or expose unexplored spaces. The exact treatment needs checking from every rotation angle.

### Gameplay interface

Controls occupy a persistent left sidebar, with a minimap at the top and icon categories for rooms, defenses, spells, and dwarf information below. The main gameplay view occupies the right side. Counts, costs, room capacities, and inspection details stay in the sidebar. Rooms, dwarfs, and terrain have no floating text, numbers, health bars, or progress bars, including on selection or hover.

Necessary messages appear as dismissible cards associated with icons above the question-mark button at the lower sidebar edge. These temporary cards are the exception for text over the gameplay area. World feedback uses room identity, furnishings, activity, physical condition, and restrained action previews. See [Gameplay interface](gameplay-interface.md) for controls, message behavior, and the supplied references.

## 3. Campaign and level start

- Each level is a different stronghold with its own terrain, inhabitants, resources, and objectives.
- A small starting mining crew establishes each foothold.
- The local population is otherwise recruited fresh. Armies and stockpiles do not transfer from the previous settlement.
- Research and building unlocks carry forward under the current working design.
- A room or dwarf type must remain useful after its introductory level.

The mining crew reaches a dormant Hearthstone, awakens it, and automatically erects a protective Stone Hearth during the arrival sequence. The player begins with the established core, a small open cavern, miners, and limited usable starting supplies.

## 4. Hearthstone and defeat

The Hearthstone is a magical crystal connected to the ancient dwarven runic travel network. The Stone Hearth is the structure protecting it.

- Its location and footprint are fixed by the level.
- It receives new dwarfs and anchors the base.
- It has no upgrades and cannot be relocated.
- It does not require a separate power grid or energy-production system.
- Enemies win by reaching and destroying it.

The core is the established defeat condition. Victory conditions are authored per level. Health, repair behavior, and exact footprint remain open.

## 5. Grid, excavation, and discovery

- Terrain uses square tiles. Rooms and fixtures align to that same grid.
- Each level has one excavation layer and one common walkable floor height. An intact dirt, gold-bearing terrain, or bedrock cell occupies the full terrain height; excavation removes a diggable cell down to the floor. There are no half-height terrain cells, terraced mining levels, or stacked playable floors. A stepped outline changes the horizontal footprint, not the terrain height.
- Miners excavate designated diggable tiles and establish usable territory. Excavation is the default cursor operation; right-click or Escape returns to it. Reselecting a designated tile removes its excavation order.
- Maps can contain hidden natural caves, passages, ancient ruins, and inhabited spaces that are already open.
- These spaces remain concealed until the player breaks through and dwarfs gain visibility into them.
- Impenetrable bedrock defines outer limits and internal barriers. It cannot be mined or destroyed and usually forms continuous seams or bands through the surrounding terrain.
- Bedrock and ordinary earth occupy whole grid cells. Exposed boundaries follow tile edges with right-angle steps; natural surface detail must preserve those footprints. Bedrock is not represented primarily as freestanding rounded heaps on finished room floors.
- Individual squares or small groups of ordinary earth may remain unmined inside excavated rooms. They remain diggable, occupy no usable room floor, and block furniture placement and movement. Once mined, the new space can be claimed and designated for building.
- Opening a passage can create a new path for enemies as well as dwarfs.

Proposed visibility rule: explored terrain remains known, but current enemy positions require sight. Proposed territory rule: miners claim reachable floor before the player builds on it. Exact claiming and sight rules remain to be specified.

Excavation can be planned into darkness. Hidden tiles accept the same marks regardless of their concealed contents. Miners work only discovered, reachable diggable targets; discovery automatically clears marks over existing open space or unmineable terrain. Unexplored plans do not reveal terrain, permit room construction, or grant visibility.

## 6. Wall reinforcement

Miners reinforce exposed ordinary walls around claimed territory when they have no higher-priority excavation, resource collection, or hauling work.

The proposed implementation has one visible reinforced state. Reinforcement makes walls harder for enemies capable of digging to breach. Bedrock remains completely indestructible. No reinforcement upgrade tree is planned.

Work scheduling must allow genuinely spare miners to reinforce walls. Renewable mining must have limited worker capacity rather than reserving every idle miner indefinitely.

## 7. Resources and storage

- Gold deposits provide finite wealth and are exhausted through excavation.
- Gem deposits, represented visually as columns occupying square terrain cells, provide continuing, slower gold income under the current resource model.
- Both provide the same spendable gold currency.
- Miners extract and transport gold to Treasure Rooms or the Stone Hearth treasury chest.
- Treasure Room capacity comes from the accessible storage positions that fit its size and shape.
- Undelivered gold does not become spendable until stored.
- Mined gold or gem yields remain on the ground at the extraction site if no reachable storage is available. Miners collect them once reachable storage has free capacity; full or unreachable storage must not cause resources to disappear. Both sources still produce the same gold currency.
- Building, recruitment, wages, and applicable production costs draw from stored reserves.

Exact extraction rates, carrying capacity, storage density, and spending costs remain open. Startup must provide usable funds before normal hauling is established; the form of starting storage is still to be chosen.

## 8. Miner purchases

The player recruits miners directly at the Hearthstone. The interface displays the cost before purchase, stored gold is deducted, and the miner arrives beside the core.

The price depends on the current number of living miners:

- More miners means a higher next recruitment cost.
- A miner dying or leaving lowers the next cost again, down to the minimum price.
- Starting miners count toward the workforce.
- Lifetime purchases do not influence the price.
- The next level calculates prices from its own starting workforce.

A possible simple formula for testing is:

`next_cost = minimum_cost + (cost_step * current_miner_count)`

This linear formula is a proposal. Neither the curve nor its numerical values is finalized. Purchased miners still need wages, food, and beds.

## 9. Attraction and arrival

Other dwarf types are attracted by suitable facilities and a settlement able to support them.

| Facility | Dwarf attracted | Shared stronghold purpose |
|---|---|---|
| Workshop | Engineer | Manufactures doors and traps |
| Library | Runesmith | Researches spells |
| Training Room | Warrior | Lets every dwarf type train to increase its stats |

Together with directly purchased Miners, these specialists form the four dwarf types in the current gameplay scope. Additional types and rooms can be introduced later through the shared definition systems described below.

- A qualifying room makes a specialist eligible to arrive.
- Accommodation, food provision, and usable specialist capacity must support additional residents. These depend on accessible furnishings that fit the rooms, not solely their painted tile counts.
- Dwarfs arrive beside the Hearthstone through its runic connection and walk into the base.
- No dedicated corridor to the surface is required on every map.
- Required rooms must remain usable after arrival; attraction is not a one-time checklist.

Arrival timing, population limits, exact room thresholds, and behavior when several types qualify remain open. [Characters](characters.md) records the four core dwarf types.

## 10. Needs, payday, and departure

All resident dwarfs, including miners, require pay, bedding, food, and the facilities appropriate to their role.

On payday, dwarfs physically visit an accessible Treasure Room to collect their wage. Insufficient gold and an inaccessible treasury are different problems and must be reported separately. The payday model needs enough time for ordinary travel and queues before treating a payment as persistently missed.

The proposed baseline is one claimed Dormitory bed and standard meals for every resident. Beds appear only where their footprints and access space fit, and each physical bed counts once. All dwarf types, including Warriors, use Dormitories. Relative wage tiers appear in the character roster; exact amounts and need intervals remain to be balanced.

All dwarfs get food from the Kitchen, which combines food growing, preparation, brewing, and eating. The player must provide one sufficiently large Kitchen or several accessible Kitchens to support the population. Actual production, stored food, and eating throughput depend on usable furnishings and access. Room capacity must support existing residents before qualifying more arrivals. Brewing is part of this shared room, with no separate compulsory ale need established.

Repeated or prolonged unmet needs increase dissatisfaction. Clear alerts explain the cause, giving the player time to respond. Dwarfs whose needs remain unmet eventually leave through the Hearthstone. Departing miners reduce the current miner count and therefore the next recruitment price.

## 11. Production, research, and room usefulness

Rooms can occupy any size or shape of excavated, usable grid squares. The player designates their footprint, and their floors, wall treatments, and furnishings adapt automatically as the room changes. A one-tile designation is allowed, although it may not yet have space to perform its function.

Floor patterns and decorations on existing wall faces identify the room independently of furniture. Larger usable areas allow additional beds, workstations, storage, or larger arrangements. For example, a Library adds shelf rows only when their shelves and aisles fit, a Dormitory adds accessible beds, and a Training Room adds practice stations with enough activity space. Furniture keeps its physical scale rather than stretching to match a room.

Capacity follows usable furnishings and working space. Automatic arrangements must preserve entrances and circulation, account for irregular shapes and obstacles, and keep valid existing furniture where practical during expansion. A narrow section can remain a walkway while a wider part of the same room supports furniture. Adjacent rooms do not automatically generate separating walls, and decorative wall treatments do not replace miner reinforcement.

The player should see the actual capacity in the sidebar when selecting or expanding a room. Explain space or access problems there or through dismissible messages; no numbers or progress bars appear over the room. The fixed Stone Hearth keeps its established footprint and has no upgrades; the adaptable-room rule applies to the settlement rooms around it. [Rooms](rooms.md) contains the furnishing and visual identity plan for each type.

Engineers automatically manufacture doors and traps in the Workshop. Runesmiths automatically research spells in the Library. Each is a single combined specialist role. Separate equipment manufacture, enchanting, and shrine services are outside this simplified design.

Every dwarf can autonomously use the Training Room to increase its stats: Miners, Engineers, Warriors, and Runesmiths. The room attracts Warriors but its training positions are shared. Training takes the dwarf's time and usable room capacity; stat gains, costs, limits, and scheduling alongside work, needs, and defense remain to be designed. It provides no sleeping capacity.

Every room must remain useful across strongholds. New populations need food, beds, and training; new layouts need manufactured defenses. Research pacing must also preserve the Library's relevance across levels. Its use after all available research is complete remains an explicit design question, without assuming additional production or maintenance systems.

Exact item handling, research progression, and associated gold costs remain to be designed. No additional mined currency is established beyond gold from deposits and gem deposits.

## 12. Defense and enemies

- Doors, traps, reinforced walls, guard positions, room locations, and route lengths form the defense system.
- Dwarfs fight autonomously, with the call to arms providing area-level direction.
- Creature types vary by underground region.
- Enemies physically approach through the map and attempt to destroy the core.
- Local inhabitants and organized raids are proposed sources of attacks.
- Enemy movement and tunneling must respect terrain rules. Bedrock always blocks excavation.

Opening an unknown area can expose a new front. A shortcut that helps workers can also bypass defenses. Defenders still need food, rest, and pay, so support-room placement affects readiness.

Which enemies can tunnel, their targeting priorities, trap behavior, repairs under attack, and raid triggers remain open. Defense remains autonomous, guided by layout and the area rally rather than individual fighter commands.

## 13. Layout consequences to preserve

| Player decision | Intended consequence |
|---|---|
| Build treasure storage near a deposit | Shorter hauling journeys, potentially farther from residents collecting wages |
| Place food and beds near workplaces | Less time spent traveling to satisfy needs |
| Establish a Training Room or Guard Post near an entrance | Defenders using those facilities are closer to the approach |
| Expand a Kitchen or build another near a distant work area | More accessible food and eating capacity for a larger or dispersed population |
| Provide more shared training capacity | More dwarfs can develop their stats, while training takes time away from their usual duties |
| Open a new passage | Access to resources and rooms, with a possible new enemy route |
| Leave ordinary walls intact | Opportunities for miners to reinforce and secure established districts |
| Recruit another miner | Faster development, a higher next miner price, and additional upkeep |
| Build more specialist capacity | Eligibility for more specialists, with increased support requirements |
| Widen a room or add an irregular wing | Furnishings adapt to the new usable space; capacity grows when additional accessible objects fit |

These are intended design effects to verify during playtesting, not claims about a built simulation.

## 14. Extensible character and room definitions

Development focuses on the current four dwarf types and room catalog to establish the core gameplay. The architecture must allow new dwarf types and rooms later. The prototype implements shared definitions and services for Miners and Engineers; the remaining roles and broader systems are still planned.

- Define each dwarf type as data with a stable identifier, presentation assets, base stats and training progression, needs, recruitment conditions, and job or combat capabilities. Keep appearance separate from behavior; making the Engineer female does not require a different resident system.
- Reuse common systems for autonomous movement, needs, payday, departure, training, and job assignment. Determine job eligibility from capabilities and room services rather than hard-coded checks for the four current dwarf names. Shared food, accommodation, and training should support future resident types through the same rules.
- Define each room type as data with a stable identifier, floor and wall treatments, furnishing variants and footprints, access clearances, capacities, services, and outputs. Reuse grid construction, automatic furnishing, pathfinding updates, and capacity feedback for new rooms.
- Express attraction as configurable conditions referring to room services, usable capacity, and settlement support. Allow multiple dwarf types to use one room and a future dwarf to require several facilities; do not enforce a permanent one-room-to-one-dwarf pairing.
- Let new definitions select reusable behaviors, with a clear place to add a new job or room service when necessary. Adding content that uses existing behaviors should not require changes throughout the simulation.
- Have recruitment and construction menus, level definitions, and saved state refer to the registered type identifiers. Display names and concept-art filenames should not determine gameplay identity, and menus should not assume a fixed roster size.

Build these boundaries while implementing the core types. Additional types, exclusive rooms, a public modding system, and a content editor are outside the current gameplay scope. Existing levels must remain playable with their defined content as later types are introduced.

## 15. Outstanding design decisions

- Wage values, meal rates, and capacities.
- Furnishing footprints, access clearance, compact and large variants, and automatic arrangement rules for irregular rooms.
- Miner price curve, starting crew, starting storage, and resource quantities.
- Recovery if every miner is lost and the player cannot afford a replacement; no extra defeat rule or free replacement has been agreed.
- Spell casting, research order, and Library use after available research is complete.
- Training stat gains, costs, limits, and autonomous scheduling for all dwarf types.
- Rally response rules and guard scheduling.
- Bedrock readability, sight, resource visibility, and claiming details.
- Reinforcement strength, core repairs, doors, traps, and bridges.
- Campaign objectives, unlock order, enemy behavior, and attack pacing.
- Camera projection, tilt, zoom limits, input bindings, and foreground wall treatment.

Finite gold seams are mined into the miner's bag in small batches (currently 15 gold per half-second, with a 45-gold bag). The pillar stays solid and designated until its remaining gold reaches zero. A full bag is delivered to reachable treasury storage, then the miner returns to the unfinished seam; an exhausted or cancelled seam sends any partial bag for delivery. With no reachable storage space, extraction leaves gold at the seam. If storage fills during travel, miners try another chest or return undelivered gold to the extraction site. Gold never becomes spendable while carried or on the ground. Renewable gem extraction retains its existing yield-and-collection behavior.
