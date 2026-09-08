# Game rules

Roadmap scope: Guard Posts, guard duty, emergency retreat and door repairs/upgrades in place are deferred outside the active roadmap following removal of M12 and M15. Any descriptions below of those features remain proposals; they are not requirements for enemy, campaign or balance milestones.

Working design for a level-based dwarven stronghold management game inspired by Dungeon Keeper.

Companion documents: [Characters](characters.md), [Rooms](rooms.md), [Levels](levels.md), and [Gameplay interface](gameplay-interface.md).

## Design status

This document records the agreed direction and the current working rules. Proposals and unresolved mechanics are identified explicitly. Numerical balance values are not final. The companion documents expand the inventories without committing to an implementation or a final campaign roster.

The game will be playable in a web browser using **TypeScript + Babylon.js**. The [Development plan](development-plan.md) records completed M1–M10 and M13, including M5.1, the unfinished milestones, and guidelines for rapid iteration and extensible content. The room debugging view and free room construction flag support development; the flag waives room construction costs while preserving placement and capacity rules. Game saves, multiplayer, and production hardening are outside the current implementation scope. Authorization and progress are tracked in the development plan.

## 1. Player role and core loop

The player manages a dwarven expedition reclaiming a lost underground kingdom, one stronghold at a time.

The core loop is:

**Excavate -> discover resources and spaces -> build facilities -> recruit and support dwarfs -> research and prepare defenses -> find and reach the onward Hearthstone -> open the route to the next area.**

Layout management is the primary activity. The position and connections of rooms, storage, doors, traps, and passages determine how well the settlement functions and defends itself.

## 2. Player control

- Select grid areas for excavation.
- Place rooms, doors, traps, and other available structures on the grid.
- Purchase additional miners using stored gold.
- Choose a call-to-arms location to guide available fighters toward an area.
- Cancel the rally to let responders return to their normal routines.

Dwarfs handle their movement, jobs, needs, and fighting autonomously. There is no possession, individual movement command, or direct troop control.

The [Call to Arms spell](spells.md#call-to-arms-behavior) calls all fighting dwarfs to a selected point for a limited period. Responders walk there and fight autonomously. The spell document owns its balance values, responder eligibility, restrictions and expiry behavior.

Spells are accessed through the left sidebar. Available player-cast spells use a target selection when applicable; [Spells](spells.md) defines their effects, costs, research rules and casting restrictions. Dwarf behavior stays autonomous.

### Autonomous movement

The grid defines excavation and construction. Dwarfs and enemies move continuously through the actual open space in halls and rooms, with positions and travel directions independent of tile centers.

- Movement can follow any clear direction, including diagonal routes across open rooms, without snapping from square to square.
- Real terrain, the Hearth and doors constrain routes according to their gameplay state. Characters must not pass through these obstacles or squeeze diagonally between touching blocked corners. Room furnishings are cosmetic and never block movement or sight.
- The space needed by a character determines where it can fit. There is no rule limiting a floor tile to one character.
- Proposed crowd behavior: characters steer around one another, pass where there is room, and yield or queue at narrow openings. Wider passages should support better traffic flow.
- Routes respond to excavation and door changes. Room boundaries and automatic furnishing changes do not obstruct movement.
- A call to arms draws responders into accessible space around the rally location; it does not arrange them on individual grid squares or give the player direct movement control.

Character sizes, avoidance distances, and crowd behavior need tuning alongside corridor widths. The movement model applies to both dwarfs and enemies.

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
- Each level contains a new Hearthstone to discover and reach, distinct from the starting base Hearthstone. It opens the route to the next area through the ancient runic network.
- This onward Hearthstone is usually in a difficult location: inside an enemy base or hostile region, beyond lava, or behind other substantial access obstacles. Overcoming that approach is the level's primary objective.
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

Destruction of the starting core is the established defeat condition. The onward Hearthstone is the level's progression objective; it does not replace or relocate the starting core. Finding it must respect discovery, and merely seeing it across an impassable gap does not establish access. [Levels](levels.md#onward-hearthstone-objective) owns the objective and provisional activation rules. The starting core has a tunable 400 health and no repair, upgrade or relocation. Natural Raiders use physical melee reach, existing damage/cadence and line of sight; an adjacent dwarf takes priority. The onward stone is an indestructible reserved tile. Any eligible resident can activate it from adjacent floor for eight uninterrupted seconds after a sidebar request. Both defeat and local objective completion freeze gameplay and expose a restart; destruction wins a simultaneous activation. Campaign travel now links Border Foothold to Emberwater Crossing, carrying research/building knowledge into a fresh local settlement; [Levels](levels.md#authored-campaign-and-travel) specifies carry/reset rules and the final endpoint.

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

Miners share a work pool, reserving individual targets and spreading across kinds of work. Reachable, marked gold or gems receive about one in three available miners, with a minimum of one; remaining miners divide hauling, excavation, construction and claiming. Needs, delivery, combat and requested Hearth activation still apply. [Miner work allocation](characters.md#miner-work-allocation) defines replacement workers, the tunable ratio and lone-miner deliveries.

## 6. Wall reinforcement

Miners reinforce exposed ordinary walls around claimed territory when they have no higher-priority excavation, resource collection, or hauling work.

The proposed implementation has one visible reinforced state. Reinforcement makes walls harder for enemies capable of digging to breach. Bedrock remains completely indestructible. No reinforcement upgrade tree is planned.

Work scheduling must allow genuinely spare miners to reinforce walls. Renewable mining must have limited worker capacity rather than reserving every idle miner indefinitely.

## 7. Resources and storage

- Gold deposits provide finite wealth and are exhausted through excavation.
- Gem deposits, represented visually as columns occupying square terrain cells, provide continuing gold income. Their separately configurable extraction interval and batch size currently match gold seams.
- Both provide the same spendable gold currency.
- Miners extract and transport gold to Treasure Rooms or the Stone Hearth treasury chest.
- Treasure Room capacity comes from floor tile count times its tunable storage per tile. Furnishing count and room shape do not change it; miners still need a reachable delivery route.
- Undelivered gold does not become spendable until stored.
- Mined gold or gem yields remain on the ground at the extraction site if no reachable storage is available. Miners collect them once reachable storage has free capacity; full or unreachable storage must not cause resources to disappear. Both sources still produce the same gold currency.
- Building, recruitment, wages, and applicable production costs draw from stored reserves.

Exact extraction rates, carrying capacity, storage density, and spending costs remain balance choices. Startup provides a provisional gold allowance and the Stone Hearth treasury chest so usable storage exists before a Treasure Room is built.

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

Miner recruitment is the innate Summon Miner spell in the Spells icon grid. Clicking its enabled icon summons at the Hearth without research, preparation or selecting a world target; the old Dwarfs text recruitment action is removed. The prototype uses this linear formula with a 50-gold minimum and 25 gold per living Miner, including the starting crew. A purchase needs spare reachable Dormitory and Kitchen support, a clear claimed arrival square connected to the Hearth, and enough shared gold. Failed purchases spend nothing. Death or departure lowers the next price; lifetime purchases do not count. These values are editable and provisional. Purchased miners have the same wages, food and rest needs as other residents.

## 9. Attraction and arrival

Other dwarf types are attracted by suitable facilities and a settlement able to support them.

| Facility | Dwarf attracted | Shared stronghold purpose |
|---|---|---|
| Workshop | Engineer | Manufactures doors and traps |
| Library | Runesmith | Researches spells |
| Training Room | Warrior | Lets specialists train to increase its stats |

Together with directly purchased Miners, these specialists form the four dwarf types in the current gameplay scope. Additional types and rooms can be introduced later through the shared definition systems described below.

- A qualifying room makes a specialist eligible to arrive.
- Accommodation, food support and specialist capacity must support additional residents. These come from reachable room-floor area and each room's tunable capacity per tile.
- Dwarfs arrive beside the Hearthstone through its runic connection and walk into the base.
- No dedicated corridor to the surface is required on every map.
- Required rooms must remain usable after arrival; attraction is not a one-time checklist.

The current prototype admits at most one eligible specialist every 45 seconds, rotating among eligible types. Reachable specialist capacity and spare accommodation/food-support slots bound arrivals; no stored-food or production-rate check is needed. The room studio disables automatic arrivals by default. Values remain tunable. [Characters](characters.md) records the four core dwarf types and current limitations.

## 10. Needs, payday, and departure

All resident dwarfs, including miners, require pay, bedding, food, and the facilities appropriate to their role.

All dwarfs share one payday every 120 game seconds from the start of the area. New arrivals join the next scheduled payday and receive their full current wage, with no back pay. Level 1 wages are 4/7/8/10 gold for Miners/Engineers/Warriors/Runesmiths; Miners remain at 4 gold, and each additional specialist level adds 2 gold. Wages are explicit editable values in each character level row. Each payment uses the level reached when payday arrives; later level or configuration changes do not alter existing debt. Dwarfs physically visit an accessible Treasure Room or the starter Hearth treasury and spend one second collecting each payment; only then is gold deducted. The shared allowance and storage reachable from that dwarf fund the payment, so disconnected reserves cannot pay them remotely. Insufficient total gold and inaccessible treasury/gold are reported separately. Ordinary travel and queues have a 45-second grace before an overdue warning; M14 pay dissatisfaction starts only while overdue wages lack sufficient accessible funding or a reachable treasury.

Immediate combat, carried-resource delivery and food/rest take priority over wages; due, funded wages precede training and ordinary work. Interrupted visits retain the debt, release their collection space and spend no gold. Reclaiming or blocking a treasury cancels access safely. Collection rechecks funds after travel so construction, spells and other collectors cannot double-spend them. Times and amounts are tunable prototype values.

Every resident uses one Dormitory accommodation slot, provisionally one slot per floor square. All dwarf types, including Warriors, use this shared room. Visible beds are decorative and never determine availability. Relative wage tiers appear in the character roster; exact amounts and need intervals remain to be balanced.

All dwarfs get food from the Kitchen, provisionally one supported resident per floor square. One large Kitchen or several reachable Kitchens must support the population, serving existing residents before qualifying more arrivals. Dwarfs still travel there and spend time eating. Ingredients, meal/ale inventories and growing/cooking/brewing production chains are absent; mushrooms, stoves, tables and casks are visual details only.

Each unmet support requirement has its own clock: food, accommodation, pay and required role facilities. Missing assigned reachable Kitchen/Dormitory capacity counts as a shortage; ordinary eating/sleeping visits and occupied workstations do not. Required role capacity serves residents in ID order within their reachable component, using the same character requirements as attraction. Pay shortage begins after the wage grace and ends when payment becomes actionable, so a dwarf can stay and collect restored pay.

A shortage has 120 seconds of grace, followed by a grouped warning and 180 further unresolved seconds before departure. Timers do not add together; the longest active shortage controls escalation. Restored support removes its active warning immediately and recovers accumulated grievance at two seconds per second. A dismissed warning stays dismissed at its current severity, reappears if it escalates, and can be reopened in Dwarfs. All values are tunable.

Departing residents release jobs, including activation, and walk through the starting Hearth using ordinary movement. They ignore rally and do not pursue combat; enemies can still attack them. A blocked route waits and repaths without teleporting. Fixing the serious active cause before the dwarf reaches the exit cancels departure and resumes normal needs/work. Bed/food population allocation remains until actual exit so blocked residents retain support. At exit, carried gold drops onto the Hearth approach, reservations release, population and attraction capacity update, and Miner prices fall with the living Miner count. Earned production/research progress remains; previously collected pay stays spent and unpaid claims leave with the resident.

## 11. Production, research, and room usefulness

Rooms can occupy any size or shape of excavated, usable grid squares. The player designates their footprint, and their floors, wall treatments, and furnishings adapt automatically as the room changes. Every tile contributes its configured capacity, including single-tile rooms and narrow or irregular layouts.

Floor patterns and decorations on existing wall faces identify the room independently of furniture. Larger areas can show additional or larger decorative arrangements. Furniture keeps its visual scale rather than stretching to match a room; missing beds, shelves, tables or practice equipment never disable its function.

Capacity is connected room-floor area multiplied by `capacityPerTile`, rounded down per component if fractional values are used. Dwarfs reserve reachable service slots independently of decorative arrangements. Furniture has no collision, sight or access effect. Prefer visually clear entrances and circulation, and keep suitable existing furniture where practical during expansion. Adjacent rooms do not automatically generate separating walls, and decorative wall treatments do not replace miner reinforcement.

The player should see floor area, capacity per tile, total capacity and occupancy in the sidebar when selecting or expanding a room. Explain insufficient service capacity or real route problems there or through dismissible messages; never require a furnishing footprint to fit. No numbers or progress bars appear over the room. The fixed Stone Hearth keeps its established footprint and has no upgrades. [Rooms](rooms.md) contains the capacity defaults and visual identity plan.

Engineers automatically manufacture doors and traps in the Workshop. Runesmiths automatically research spells in the Library. Each is a single combined specialist role. Separate equipment manufacture, enchanting, and shrine services are outside this simplified design.

Every dwarf starts at character level 1 and can advance through the Training Room. Floor area limits concurrent trainees, and each visit ends after gaining one level. The dwarf releases its slot and returns to ordinary activities, with a personal cooldown before training again. Training and successful melee hits share the next-level XP requirement. Training earns 1 XP per second; melee combat earns roughly twice that rate, including worker self-defense. Combat continues earning XP during the training cooldown. Earned XP survives interruptions; ordinary work grants no XP. The room attracts Warriors but is shared by all types and provides no sleeping capacity. [Character levels and training](characters.md#character-levels-and-training) defines the level limit, per-type health, combat and work statistics, active training durations and cooldown. All balance values remain provisional.

Every room must remain useful across strongholds. New populations need food, beds, and training; new layouts need manufactured defenses. The Library prototype prepares spells again after casting so it retains work after initial research. Campaign research progression remains open.

The [Library rules](rooms.md#training-room-and-library-prototype-rules) describe the research service; [Spells](spells.md) owns spell progression and casting costs. Exact defensive item handling and broader balance remain open. No additional mined currency is established beyond gold from deposits and gem deposits.

## 12. Defense and enemies

- Doors, traps, reinforced walls, guard positions, room locations, and route lengths form the defense system.
- Warriors pursue nearby enemies and fight autonomously, with Call to Arms providing area-level direction. Miners, Engineers and Runesmiths have weaker adjacent self-defense and never pursue or answer the rally merely because they can attack.
- Creature types vary by underground region.
- Enemies physically approach through the map and attempt to destroy the core.
- Authored local camps/nests and organized raids supply attacks through real underground routes.
- Enemy movement and tunneling must respect terrain rules. Bedrock always blocks excavation.

Opening an unknown area can expose a new front. A shortcut that helps workers can also bypass defenses. Defenders still need food, rest, and pay, so support-room placement affects readiness.

The current [door and trap rules](rooms.md#doors-and-traps) implement three increasing door tiers, Open/Closed/Locked access, a spike trap with damage and temporary pinning, and a directional bolt trap. Both traps reset automatically after cooldown and ignore friendly dwarfs. Shut doors block sight and delay enemies until broken; locked doors also block dwarf routes. Workshop manufacturing supplies player-placed fixtures.

Defense, targeted spells, autonomous Warrior combat and worker self-defense face all ten implemented enemy types through authored encounters. Border Foothold contains a concealed camp and an eastern raid entrance. [Levels](levels.md#attacks) owns activation, warning, repeat and source-clearing rules. Enemies navigate actual terrain independently of player discovery; this does not reveal their locations. They can break doors/barriers, attack dwarfs and destroy the starting Hearth using their defined melee or ranged attacks with clear sight. All ten enemy types and tunneling are implemented; [Enemies](enemies.md) specifies their behavior and terrain/control interactions. Guard duty, retreat and repairs remain deferred.

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
| Add room floor in any shape | Each new square contributes the same configured capacity; furnishings adapt visually |

These are intended design effects to verify during playtesting, not claims about a built simulation.

## 14. Extensible character and room definitions

Development focuses on the [character](characters.md) and [room](rooms.md) catalogs to establish core gameplay. Shared definitions and services must allow additional content; the [implementation inventory](development-plan.md#current-implementation-status) records current support.

- Define each dwarf type as data with a stable identifier, presentation assets, an explicit level table, needs, recruitment conditions, and job or combat capabilities. Each level supplies health, attack damage, attack interval, work-speed multiplier and required training time. Keep appearance separate from behavior; making the Engineer female does not require a different resident system.
- Reuse common systems for autonomous movement, needs, payday, departure, training, and job assignment. Determine job eligibility from capabilities and room services rather than hard-coded checks for dwarf names. Shared food, accommodation, and training should support future resident types through the same rules.
- Define each room type as data with a stable identifier, service, capacity per tile, outputs, floor and wall treatments, and separate cosmetic furnishing variants. Reuse grid construction, room service slots, automatic visual furnishing and capacity feedback for new rooms.
- Express attraction as configurable conditions referring to room services, usable capacity, and settlement support. Allow multiple dwarf types to use one room and a future dwarf to require several facilities; do not enforce a permanent one-room-to-one-dwarf pairing.
- Let new definitions select reusable behaviors, with a clear place to add a new job or room service when necessary. Adding content that uses existing behaviors should not require changes throughout the simulation.
- Have recruitment and construction menus, level definitions, and saved state refer to the registered type identifiers. Display names and concept-art filenames should not determine gameplay identity, and menus should not assume a fixed roster size.

Build these boundaries while implementing the core types. Additional types, exclusive rooms, a public modding system, and a content editor are outside the current gameplay scope. Existing levels must remain playable with their defined content as later types are introduced.

## 15. Outstanding design decisions

- Wage values, eating/rest intervals, and room capacities per tile.
- Cosmetic furnishing footprints, compact and large variants, and visual arrangement rules for irregular rooms; these never change service capacity or routes.
- Miner price curve, starting crew, starting storage, and resource quantities.
- Recovery if every miner is lost and the player cannot afford a replacement; no extra defeat rule or free replacement has been agreed.
- Spell casting, research order, and Library use after available research is complete.
- Balance of per-type level statistics, active training durations and personal cooldown; the level sequence and one-level-per-visit rule are established.
- Rally response rules and guard scheduling.
- Bedrock readability, sight and claiming details. Gold and gems are always visible on the minimap and full map; other discoveries still require exploration.
- Reinforcement strength, core repairs, doors, traps, and bridges.
- Campaign objectives, unlock order, enemy behavior, and attack pacing.
- Camera projection, tilt, zoom limits, input bindings, and foreground wall treatment.

Finite gold seams are mined into the miner's bag in small batches (currently 15 gold per half-second, with a 45-gold bag). The pillar stays solid and designated until its remaining gold reaches zero. A full bag is delivered to reachable treasury storage, then the miner returns to the unfinished seam; an exhausted or cancelled seam sends any partial bag for delivery. With no reachable storage space, extraction leaves gold at the seam. If storage fills during travel, miners try another chest or return undelivered gold to the extraction site. Gold never becomes spendable while carried or on the ground. Renewable gems extract the same 15-gold batch every half-second, retain their persistent column, and use the existing ground-pickup collection behavior.

Current prototype controls include miner-built walls and reclaiming room tiles. Wall construction is deliberately slower than digging plus reinforcement; its default is 24 seconds. Reclaim refunds 50% of original paid cost, with no refund for free construction, and preserves displaced gold. Dwarfs prefer soft separation but may overlap briefly when necessary to keep moving; real terrain and gameplay obstacles remain solid while room furnishings are cosmetic. Shared balance values and the in-game editor are documented in [Configuration](configuration.md); additive room/dwarf implementation is documented in the [content playbook](content-playbook.md).
