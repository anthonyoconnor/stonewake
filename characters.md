# Characters

Working design for the dwarven stronghold game. Companion documents: [Rooms](rooms.md), [Levels](levels.md), [Game rules](game-rules.md), and [Gameplay interface](gameplay-interface.md).

## Implementation status

See the [current implementation inventory](development-plan.md#current-implementation-status) for all dwarf types, including debug-only availability and missing recruitment/work systems. The roster and rules below describe the intended design, not a list of completed features. Update the inventory whenever a dwarf or its supporting systems change.

## Design status

The recruitment, miner pricing, needs, autonomous control, merged specialist roles, and shared training rules below reflect the agreed design. The roster below defines the dwarf types in scope. Engineer is the working name for the combined workshop crafter, whose character design is female; Runesmith is the working name for the combined spell researcher. Relative wages, standard bed and meal quantities, and detailed job behaviors remain proposals. Exact costs, consumption rates, capacities, and combat statistics remain unbalanced.

## Shared resident rules

Current prototype: all dwarf types share autonomous movement, food, rest and Training Room progression. Engineers, Warriors and Runesmiths arrive through the Hearth when accessible specialist stations and shared support have spare capacity. One eligible specialist can arrive every 45 seconds; eligible types take turns. Debug spawning remains available for isolated tests and bypasses arrival requirements. Normal arrivals are off by default in the Room Layout Studio; its **Test automatic specialist arrivals** toggle enables the same requirements for testing. Wages, paid Miner recruitment, departure, combat and guard duty remain pending.

Training gives up to five levels with 8% work speed per level. It takes 12 seconds of station use per level with 45 seconds between sessions; needs take priority and partial progress survives interruptions. These are provisional tunable values. Warriors currently train and use shared needs; their combat role awaits the combat system. Runesmiths autonomously research the spells selected in the sidebar and prepare them again after casting. See the [room prototype rules](rooms.md#training-room-and-library-prototype-rules) for details.

- All resident dwarfs, including purchased miners, need regular pay, accessible bedding, sufficient food, and any facilities required by their role.
- Dwarfs choose work, eat, sleep, collect wages, and respond to threats autonomously. Players do not possess, move, or issue individual orders to them.
- Dwarfs and enemies move continuously through halls and rooms in any clear direction. They do not snap to tile centers or occupy exclusive grid squares; obstacles and available physical clearance determine where they can go.
- A call to arms rallies available fighters to an area. They walk there and fight automatically.
- Persistent unmet needs cause dissatisfaction and eventually departure through the Hearthstone. The interface must identify the actual problem before a dwarf leaves.
- Attraction does not remove ongoing requirements: a specialist needs usable facilities after arriving. Capacity comes from accessible furnishings and working positions that fit the room's size and shape.
- Temporary queues or a short interruption should not immediately trigger departure.
- The proposed bedding baseline is one claimed Dormitory bed per resident. Beds are added automatically where their footprints and access space fit, and each bed counts only once. All dwarf types use this shared accommodation.
- Every dwarf eats at the Kitchen, the combined food-growing, preparation, brewing, and dining room. One large Kitchen or several accessible Kitchens must provide enough food and eating capacity for the population. The proposed baseline is the same standard meal requirement for every resident; no specialist-only diets or separate ale requirement are established. Meal frequency and production rates remain to be set.
- All dwarfs can use the Training Room to increase their stats, including Miners, Engineers, Warriors, and Runesmiths. Training is shared progression, not a Warrior-only activity. Exact stat gains, costs, limits, and autonomous scheduling remain open.
- Wage tiers below are relative design targets, not final gold amounts. Every resident receives a positive wage on payday; recruitment costs are separate.

## Resident roster

| Character | Main work | Defense or exploration role | Recruitment | Pay requirement | Bedding requirement | Food requirement | Required special room |
|---|---|---|---|---|---|---|---|
| Miner | Excavates designated terrain, extracts resources, delivers gold, claims reachable ground, and reinforces walls when other work is complete | Opens routes; retreats from danger under the proposed behavior | Starting crew or direct purchase at the Hearthstone | Low tier; regular payday | One standard Dormitory bed | Standard meals at a Kitchen | None; works on terrain and needs access to treasure storage |
| Engineer | Makes doors and traps in the Workshop; repairs and replacement mechanisms are proposed continuing jobs | Supports defense through manufactured fixtures and safe repairs | Attracted by a working Workshop | Standard tier; regular payday | One standard Dormitory bed | Standard meals at a Kitchen | Workshop with available working capacity |
| Warrior | Trains, guards designated posts, and responds to nearby threats | Holds entrances and fights at close range | Attracted by a working Training Room | Standard tier; regular payday | One standard Dormitory bed | Standard meals at a Kitchen | Training Room with accessible training capacity, shared with all dwarf types |
| Runesmith | Researches spells in the Library | Supports the stronghold through researched spells; personal combat abilities remain open | Attracted by a working Library | High tier; regular payday | One standard Dormitory bed | Standard meals at a Kitchen | Library with available research capacity |

All specialists also depend on the shared treasure, food, and accommodation facilities. A Workshop alone does not make an unsupported settlement ready for Engineers. There is one workshop crafter and one spell researcher; separate equipment production, enchanting, and shrine service systems are not part of this simplified roster. Dedicated rooms for advanced dwarf types may be considered later.

## Miner recruitment

Miners are bought directly; constructing a room does not attract free additional miners.

- The sidebar's dwarf panel offers a Recruit Miner action with the current gold price visible. Recruitment occurs at the Hearthstone without requiring the camera to be centered there.
- Payment comes from stored treasure, and the new miner appears beside the Hearthstone.
- The next price rises as the number of living miners increases.
- A miner dying or leaving lowers the next price again, subject to a minimum price.
- The calculation uses the current workforce, not lifetime purchases. The starting crew counts toward the workforce.
- Each new level begins with its own starting crew and local economy.
- Purchased miners have the same ongoing needs as other residents. Buying one does not exempt it from wages or provide free bedding and food.

The proposed job priority is designated excavation and resource work, then outstanding hauling and claiming, then reinforcement. The exact scheduling needs playtesting so resources continue reaching storage. Gem deposits must have limited working positions so an endless mining job does not absorb every idle miner.

## Specialist behavior proposals

### Engineer

Uses the Workshop to manufacture the doors and traps selected by the player. This single role covers both metalworking and mechanism assembly. The player places completed stock through Defenses. The implemented spike and bolt traps reset automatically after cooldown, with no Engineer rearming or supply cost. Door repairs and upkeep for future fixture types remain proposed work; Engineers should wait for safe access rather than repeatedly walk into an active battle to repair a door. They can also improve their own stats in the shared Training Room.

The Engineer is a female dwarf. Her concept uses practical teal workwear, a protective leather apron, goggles, a metalworking hammer, and mechanism tools. This appearance choice leaves her recruitment, needs, work, and training rules unchanged.

### Warrior

The intended role alternates between training, guard duty, and ordinary needs. Guard Posts and the position of the Training Room will influence how quickly Warriors respond. The Training Room attracts Warriors but is available to every dwarf type. It provides training positions, while Warriors sleep in Dormitories like everyone else. Current training progression is defined in the prototype rules above; guarding and combat remain pending.

### Runesmith

Works at the Library to research spells. This is the stronghold's single research specialist. The player queues and pauses research; the Library prepares spells again after casting. See [Spells](spells.md) for the catalog and implementation status. Like every dwarf, a Runesmith can train. Campaign research and any personal combat abilities remain open; separate healing or morale duties are not assumed.

## Continuing usefulness

Every resident role must remain useful on later maps. Terrain and objectives change where a role is valuable, rather than restricting it to one level. Training and new spells should expand the existing roster's usefulness. Every stronghold starts with a small mining crew; all other residents are recruited locally.

## Adding dwarf types later

The roster above defines the initial gameplay scope. Future types should be added through character definitions that describe their appearance, stats, needs, recruitment conditions, and job capabilities. Shared movement, needs, training, job assignment, and rally systems must work with those definitions rather than a fixed list of names. New roles may add a behavior when needed without replacing the shared resident systems. See the [architecture requirements](game-rules.md#14-extensible-character-and-room-definitions).

## Character concept art

The [dwarf concept gallery](concept-art/dwarfs/README.md) contains the character references; superseded and deferred character images have been removed. The latest Engineer sheet depicts the agreed female character; the Runesmith sheet reflects the merged research role. Each sheet includes front, back, and overhead studies in the shared stylized 3D direction. Other appearance details remain visual proposals rather than changes to recruitment, needs, or combat rules. Exact prompts are retained with the images. All concept art is collected in the [concept-art folder](concept-art/README.md).

## Decisions still open

- Starting miner count, recruitment price curve, wage amounts, and payday interval.
- Food consumption, bed capacity, and room capacity per specialist.
- Combat abilities and balance of the provisional shared training values.
- Broader spell balance and campaign research progression.
- Playtest [Call to Arms](spells.md#call-to-arms-behavior) response priorities: all fighting types answer; noncombat support workers continue working, with critical survival needs allowed to override the rally.
- Whether individual dwarf names or personalities are included.

## Implementation playbook

[Adding rooms and dwarf types](content-playbook.md) gives the concrete dwarf-registration steps, supported capabilities/models, debug spawn workflow and test requirements. All dwarf definitions now join the debug catalog automatically; per-type walking speed is tunable. Soft crowd avoidance yields to path progress when necessary, while terrain and furniture remain solid. Miners can also construct planned walls, with a deliberately longer work duration.
