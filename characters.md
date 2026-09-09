# Characters

Roadmap scope: assigned guard duties, general specialist retreat and Engineer door repairs are deferred outside the active roadmap following removal of M12 and M15. References below remain design proposals. Character model and animation improvements are implemented and verified in [M22](development-history.md#m22--character-models-and-animations-update); current appearance, timing and limits are described in [graphics notes](graphics-pass.md).

Working design for the dwarven stronghold game. Companion documents: [Rooms](rooms.md), [Levels](levels.md), [Game rules](game-rules.md), and [Gameplay interface](gameplay-interface.md).

## Implementation status

See the [current implementation inventory](development-plan.md#current-implementation-status) for all dwarf types, including debug-only availability and missing recruitment/work systems. The roster and rules below describe the intended design, not a list of completed features. Update the inventory whenever a dwarf or its supporting systems change.

All dwarfs share one payday every 120 game seconds from the start of the area. New arrivals join the next scheduled payday and receive their full current wage, with no back pay. Level 1 wages are 4/7/8/10 gold for Miners/Engineers/Warriors/Runesmiths; Miners remain at 4 gold, and each additional specialist level adds 2 gold. Wages are explicit editable values in each character level row. Each payment uses the level reached when payday arrives; later level or configuration changes do not alter existing debt. Dwarfs spend one second collecting each due payment at a reachable Treasure Room or Hearth treasury; 45 seconds of overdue grace allows travel/queues. Current values are editable and provisional. [Payday rules](game-rules.md#10-needs-payday-and-departure) define access, interruption and funding behavior.

## Design status

The recruitment, miner pricing, needs, autonomous control, merged specialist roles, and shared training rules below reflect the agreed design. The roster below defines the dwarf types in scope. Engineer is the working name for the combined workshop crafter, whose character design is female; Runesmith is the working name for the combined spell researcher. Room floor area supplies accommodation, food support and work/training capacity; furniture is cosmetic. Relative wages, detailed job behaviors, costs, need intervals and combat statistics remain balance choices.

## Stonehands

Stonehands are the normal terrain workers: three start each area, and Create Stonehand assembles another at the Hearth for 50 gold + 25 per living Stonehand without research or preparation. Creation requires shared gold and a free, reachable claimed arrival square; failed attempts spend nothing. These small mechanical constructs have 30 health, no attacks, no food, beds, wages, morale, training or XP. They work whenever safe, reachable tasks exist, use the shared work pool and keep each assignment for 20 productive seconds, including resource ownership across delivery trips. About one worker per three available workers stays assigned to marked, reachable gold or gems (minimum one). Destruction drops carried gold and releases the job. Prices and health are provisional editable values. The original dwarf Miner and its model remain available in debug scenarios for a possible future basic fighter; that repurposing is not implemented.

Approved visual direction: [small mechanical Stonehands v2](concept-art/stonehands/README.md). Their half-height frame has thin linkages, one amber lamp eye, a suspended rune tablet, small stone palms and a basket.

## Cave Hounds and population balance

Cave Hounds are the early defense and exploration companion. A spare reachable Dormitory place is their only room requirement: that den supplies food and rest through physical visits, with no Kitchen place, wages, training or XP. There is no animal cap. When only hounds are supported, one arrives every **30 seconds** until accommodation fills. Stonehands occupy no living support; the old Miner stays in debug for later reuse. Tunnel Badgers remain saved concept art only.

Recruitment adapts to the types the settlement can currently support. Among eligible defenders, the next arrival fills the least represented role relative to its editable weight: **Warrior 3, Cave Hound 1**. Opening a supported Training Room therefore favours Warriors until the existing hounds form a smaller share. These are soft targets for future arrivals, not hard limits or replacements. Exhausted role-room or Kitchen capacity can leave hounds as the only eligible defender again; expand those facilities to support more Warriors.

Workshops and Libraries each attract an initial specialist, then request more staff when their unfinished work queue warrants it: provisionally **one specialist per three queued or working orders**, rounded up, minimum one. Paused or ready research and finished crafting do not add demand. Needed support staff receive priority; actual role-room, spare bed and Kitchen capacity still bound arrivals. Staff remain when queues shrink. A short burst completed before the next arrival does not recruit extra staff.

Cooldowns are **30 seconds for Cave Hounds, 45 for Warriors, and 60 for Engineers/Runesmiths**, with a **10-second minimum gap** between any two arrivals. Timers start when the type's other support qualifies, can mature while beds are full, and restart after its arrival; disabling/re-enabling arrivals retains timers. Losing required role/food support resets eligibility. The scheduler chooses the preferred role before checking its cooldown, preserving the next bed while that recruit waits. Cooldowns, defender weights and workload ratio are editable in Game configuration.

Full accessible accommodation blocks every new living arrival, including newly unlocked types. **Dormitory is full** opens a non-modal sidebar message with an expansion explanation and **Build Dormitory** action. Dismissing it leaves the icon available without reopening the same episode; freeing space clears it, and filling again opens a new message. Existing residents are never removed to meet recruitment targets. Lost den support still uses ordinary need grace/departure rules.

Hounds have 100 health, a 10-damage bite every second, and a walking speed of 2.7 tiles/second. A level-1 Warrior has 140 health and 12 damage and can train further; hounds remain fixed at level 1. Their sight radius is eight tiles versus the normal six. Hounds patrol continuously between needs and combat, sharing surveyed ground so the pack spreads out. Unsurveyed frontiers and newly opened floor take priority; when everything is explored, they revisit older patrol areas. There is no fixed Hearth distance or stationary home-watch phase. They never excavate, claim, cross unbridged hazards or activate Hearthstones. Ordinary sight and physical routes still control discovery.

Hounds act as guard dogs: any enemy visible to the settlement can call them into pursuit, including sightings outside their own sight range or around a corner. They retain their target while it remains actionable, run to reachable threats and bite only within actual melee reach and clear sight. Attacks on residents, doors or the Hearth also create reports. When the attacker is no longer visible, dogs investigate its last reported position, without tracking its hidden movement. Reports expire after a tunable 20 seconds. Call to Arms remains an explicit rally override; critical food/rest needs still require den visits. Emergency running uses a tunable 1.5× movement multiplier. A pair can defeat a lone Raider, but hounds do not replace trained Warriors against larger threats. Numerical values remain provisional.

### Mining worker escape

Stonehands and retained dwarf Miners flee visible nearby enemies or incoming damage. The proximity trigger is provisionally four tiles; taking damage also considers visible attackers farther away. They release the job and work-pool assignment, keep carried gold, and run toward reachable safer ground, favouring claimed ground near the Hearth when the route is safe. Escape routes avoid approaching enemies more closely; a blocked worker cannot teleport through terrain. Workers wait five safe seconds before resuming and reject job routes through known danger, preventing repeated returns to the same threatened work site. Threat memory uses observed positions and expires with security reports. This implements mining-worker escape only; Guard Posts and general specialist retreat remain deferred.

## Shared dwarf rules

Current prototype: all dwarf types share autonomous movement, food and rest; only specialists use Training Room progression. Engineers, Warriors and Runesmiths arrive through the Hearth when reachable specialist rooms and shared accommodation/food support have spare capacity, following the cooldowns and staffing rules above. Debug spawning remains available for isolated tests and bypasses arrival requirements. Normal arrivals are off by default in the Room Layout Studio; its **Test automatic specialist arrivals** toggle enables the same requirements for testing. Legacy Miner purchase helpers remain for regression fixtures; ordinary play uses Stonehands. Physical wage collection and sustained-need dissatisfaction/departure still apply to the four dwarf types. Assigned guard duties and specialist retreat remain pending. The [shared need rules](game-rules.md#10-needs-payday-and-departure) define grace, role capacity, recovery and physical departure.

Every dwarf starts at character level 1. Miners remain at level 1 and do not train or earn XP; specialists can reach level 5 through Training Room practice and real combat. Each type has explicit level definitions for health, attack damage, attack interval, work speed, wages and the training time needed to reach the next level. Successful melee hits also grant experience; ordinary work does not. See [Character levels and training](#character-levels-and-training) for the rules and provisional values.

Warriors pursue nearby enemies, fight autonomously and respond to Call to Arms. Mining workers flee danger; Engineers and Runesmiths retain weaker adjacent self-defense without pursuit or rally response. Cave Hounds patrol and answer settlement threat reports as described above. Combat uses normal authored encounters/raids as well as debug enemies. Runesmiths research spells selected in the sidebar and prepare them again after casting; [Spells](spells.md) owns spell effects and targeting.

- All resident dwarfs, including purchased miners, need regular pay, accessible bedding, sufficient food, and any facilities required by their role.
- Dwarfs choose work, eat, sleep, collect wages, and respond to threats autonomously. Players do not possess, move, or issue individual orders to them.
- Dwarfs and enemies move continuously through halls and rooms in any clear direction. They do not snap to tile centers or occupy exclusive grid squares; obstacles and available physical clearance determine where they can go.
- A call to arms rallies dwarfs with the `fight` capability, currently Warriors and Cave Hounds. Workers' adjacent self-defense does not make them rally responders.
- Persistent unmet needs cause dissatisfaction and eventually departure through the Hearthstone. The interface must identify the actual problem before a dwarf leaves.
- Attraction does not remove ongoing requirements: a specialist needs reachable room services after arriving. Capacity comes from floor tile count times the configured per-tile value, independent of furniture and room shape.
- Temporary queues or a short interruption should not immediately trigger departure.
- Every resident uses one Dormitory accommodation slot, provisionally one supported dwarf per square. All dwarf types use this shared accommodation; visible beds do not determine its capacity or resting access.
- Every dwarf eats at a Kitchen. One large Kitchen or several reachable Kitchens must provide enough resident support, provisionally one dwarf per square. There are no ingredients, stored meals, ale inventories or food-production chains. Dwarfs still travel to eat and spend time there. Need frequency and visit duration remain tunable.
- Engineers, Warriors and Runesmiths can train. Miners cannot train or level up. Room area limits simultaneous trainees; each visit grants at most one level, followed by a personal cooldown. Visual equipment is optional.
- Wage tiers below are relative design targets, not final gold amounts. Every dwarf receives a positive wage on payday; recruitment costs are separate.

## Resident roster

| Character | Main work | Defense or exploration role | Recruitment | Pay requirement | Bedding requirement | Food requirement | Required special room |
|---|---|---|---|---|---|---|---|
| Cave Hound | Patrols open routes and answers threat reports | Early melee defense and Call to Arms | Dormitory-only automatic arrival; regular cooldown and soft defense share | None | One den place | Fed at its Dormitory den | No special room |
| Stonehand | Shared terrain work: mine, haul, claim, reinforce, walls and bridges | Fragile, cannot fight | Starting crew or Create Stonehand (50 + 25 per living Stonehand) | None | None | None | Hearth arrival and reachable storage |
| Miner (legacy) | Excavates designated terrain, extracts resources, delivers gold, claims reachable ground, and reinforces walls when other work is complete | Opens routes and flees enemies or incoming damage | Retained for debug; future basic fighter role deferred | Low tier; regular payday | One Dormitory accommodation slot | One Kitchen support slot; autonomous eating visits | None; works on terrain and needs access to treasure storage |
| Engineer | Makes doors and traps in the Workshop; repairs and replacement mechanisms are proposed continuing jobs | Supports defense through manufactured fixtures; adjacent self-defense without pursuit | Attracted by a working Workshop | Standard tier; regular payday | One Dormitory accommodation slot | One Kitchen support slot; autonomous eating visits | Workshop with available working capacity |
| Warrior | Trains, guards designated posts, and responds to nearby threats | Holds entrances and fights at close range | Attracted by a working Training Room | Standard tier; regular payday | One Dormitory accommodation slot | One Kitchen support slot; autonomous eating visits | Training Room with accessible training capacity, shared with the other specialists |
| Runesmith | Researches spells in the Library | Researched spells and adjacent self-defense without pursuit | Attracted by a working Library | High tier; regular payday | One Dormitory accommodation slot | One Kitchen support slot; autonomous eating visits | Library with available research capacity |

All specialists also depend on the shared treasure, food, and accommodation facilities. A Workshop alone does not make an unsupported settlement ready for Engineers. There is one workshop crafter and one spell researcher; separate equipment production, enchanting, and shrine service systems are not part of this simplified roster. Dedicated rooms for advanced dwarf types may be considered later.

## Character levels and training

All four types spawn at level 1. Miners have only that fixed level and never earn XP; the three specialist types have five explicit levels. Training and successful melee hits contribute to one shared next-level XP total. Training grants 1 XP per active second. Each melee hit that damages a living enemy grants 2 XP per second of the dwarf’s base attack interval: 2 XP per default Warrior hit, or 3 XP per default Engineer hit. This gives roughly twice the training rate while continuously attacking. Haste earns XP through more frequent hits, without multiplying each hit again. Chasing, holding a rally, taking damage, traps and player-cast spells grant no XP; kills have no extra bonus. Engineers and Runesmiths earn XP from their own self-defense hits; Miners do not. Ordinary work grants no experience. Levels are sequential, so a level-2 dwarf trains toward level 3 rather than skipping to a later row.

A dwarf can begin or resume practice when its cooldown has expired, its food/rest needs allow it, and a free reachable training slot is available. It practices until shared XP reaches the next level's requirement. On reaching that requirement, it gains exactly one level, releases the slot, leaves training and starts a personal **45-second cooldown**. Interrupted practice is retained on the dwarf and can resume in another Training Room. Cooldown holds no room capacity. Combat ignores the training cooldown and can grant a level during a fight without interrupting it. Any level gain restarts the training cooldown; surplus combat XP carries into the next level. A level-5 dwarf has no further training job or XP accumulation.

Each row below gives the complete statistics at that level. **Training** is the time needed from zero XP at 1 XP per second; the same number is the shared XP requirement to enter that row, not a lifetime total; level 1 is free on arrival. Travel, meals, rest and cooldown do not count. Work speed is a multiplier on ordinary productive work, including research; it does not shorten training. Haste can temporarily accelerate work, attacks and practice. These values are provisional and editable in [character definitions](src/content/characters.ts) and **Debug → Game configuration**.

### Miner levels

| Level | Training | Maximum health | Damage per hit | Attack interval | Work speed | Wage (gold) |
|---|---:|---:|---:|---:|---:|---:|
| 1 | — | 90 | 4 | 1.5 s | 1.00× | 4 |

### Engineer levels

| Level | Training | Maximum health | Damage per hit | Attack interval | Work speed | Wage (gold) |
|---|---:|---:|---:|---:|---:|---:|
| 1 | — | 85 | 5 | 1.5 s | 1.00× | 7 |
| 2 | 25 s | 100 | 6 | 1.5 s | 1.10× | 9 |
| 3 | 40 s | 115 | 7 | 1.5 s | 1.20× | 11 |
| 4 | 60 s | 130 | 8 | 1.5 s | 1.30× | 13 |
| 5 | 90 s | 150 | 10 | 1.5 s | 1.40× | 15 |

### Warrior levels

| Level | Training | Maximum health | Damage per hit | Attack interval | Work speed | Wage (gold) |
|---|---:|---:|---:|---:|---:|---:|
| 1 | — | 140 | 12 | 1.0 s | 1.00× | 8 |
| 2 | 15 s | 165 | 15 | 1.0 s | 1.00× | 10 |
| 3 | 30 s | 190 | 18 | 1.0 s | 1.00× | 12 |
| 4 | 50 s | 215 | 21 | 1.0 s | 1.00× | 14 |
| 5 | 75 s | 240 | 24 | 1.0 s | 1.00× | 16 |

### Runesmith levels

| Level | Training | Maximum health | Damage per hit | Attack interval | Work speed | Wage (gold) |
|---|---:|---:|---:|---:|---:|---:|
| 1 | — | 70 | 6 | 1.6 s | 1.00× | 10 |
| 2 | 30 s | 80 | 7 | 1.6 s | 1.10× | 12 |
| 3 | 45 s | 95 | 8 | 1.6 s | 1.20× | 14 |
| 4 | 65 s | 110 | 10 | 1.6 s | 1.30× | 16 |
| 5 | 95 s | 125 | 12 | 1.6 s | 1.40× | 18 |

Level gains apply the new maximum health and preserve the amount of existing damage. For example, a Warrior at 100/140 health becomes 125/165 at level 2, still missing 40 health. Gaining a level does not fully heal a wounded dwarf or revive a dead one. The new damage and attack interval apply to combat, and the new work multiplier applies to its eligible jobs. Levels do not grant new capabilities: an Engineer still only defends at melee reach, while Warriors can pursue and rally.

## Stonehand creation and retained Miner

Creation cost = base + population step × living Stonehands. Defaults match the original Miner settings: 50 gold base and 25 gold per worker. The three starting Stonehands make the next prices 125, 150, 175 gold. Destroyed Stonehands no longer count; other unit types never count. Both values apply live in **Debug → Game configuration → Economy & world**, under **Stonehand base creation cost** and **Creation cost per living Stonehand**. Their stable setting IDs remain `tuning.minerMinimumCost` and `tuning.minerCostStep`; the old flat `stonehandCost` setting is removed.

Create Stonehand in Spells supplies the normal labor force for 50 gold + 25 per living Stonehand, without food or bed requirements. Stonehands walk at 3 tiles per second before temporary speed effects. The old dwarf Miner remains in definitions, model inspection and debug fixtures; its old purchase helper is retained for regression checks, with no ordinary recruitment icon. It has not yet been converted into a fighter.

## Miner work allocation

Stonehands and retained Miners share a pool of discovered, marked resource mining and excavation targets, loose-resource hauling, planned bridge/wall construction, claiming and reinforcement. Each task reserves its target for one worker; mining and collecting are separate tasks, so another miner can haul from a working seam. Workers choose nearby reachable targets within their allocated kind of work.

After delivery, needs, wages and requested Hearth activation, resource mining gets about one worker per three available Miners, rounded up with a minimum of one. The ratio is editable as **Miners per resource worker** in Game configuration. Remaining workers fill unstaffed hauling, excavation, construction and claiming work first, then split evenly between those kinds; that listed order breaks ties. Extra resource mining uses otherwise spare workers, and reinforcement is last. Assignments last for **20 seconds of productive work**, tunable as **Miner assignment duration · work seconds**. Travel does not consume that time. Miners finish their current tile before rebalancing and continue nearby work of the same kind while their assignment remains. Repeated gem batches and gold-delivery trips retain the assignment and prefer the same deposit. If the assigned kind of work has no valid reachable target, the miner immediately chooses other work.

A free, uncommitted miner fills missing resource coverage at its next job choice. Completing a gem batch or carrying a resource load to storage keeps the resource assignment staffed; these routine pauses do not redirect another miner from unfinished work. For dwarfs, food/rest, wages, combat and departure can still interrupt; Stonehands bypass those interruptions. Hearth activation can interrupt either worker type, and an uncommitted worker can provide cover. Newly marked resources may wait for an existing assignment or tile to finish. Travel and interruptions can cause mining gaps. Hidden, unmarked or unreachable deposits do not reserve workers. A lone available miner prioritizes resources and periodically collects a full gem load for delivery, so permanent deposits cannot prevent income from reaching storage. With no reachable storage, extracted resources remain at the site as before.

## Specialist behavior proposals

### Engineer

Uses the Workshop to manufacture the doors and traps selected by the player. This single role covers both metalworking and mechanism assembly. The player places completed stock through Defenses. The implemented spike and bolt traps reset automatically after cooldown, with no Engineer rearming or supply cost. Door repairs and upkeep for future fixture types remain proposed work; Engineers should wait for safe access rather than repeatedly walk into an active battle to repair a door. They can also improve their own stats in the shared Training Room.

The Engineer is a female dwarf. Her concept uses practical teal workwear, a protective leather apron, goggles, a metalworking hammer, and mechanism tools. This appearance choice leaves her recruitment, needs, work, and training rules unchanged.

### Warrior

The intended role alternates between training, guard duty, and ordinary needs. Guard Posts and the position of the Training Room will influence how quickly Warriors respond. The Training Room attracts Warriors but is available to all three specialist types. It provides training positions, while Warriors sleep in Dormitories like everyone else. [Character levels](#character-levels-and-training) improve Warrior combat statistics. Guarding remains pending; autonomous pursuit, melee combat and spell rally response are implemented.

### Runesmith

Works at the Library to research spells. This is the stronghold's single research specialist. The player queues and pauses research; the Library prepares spells again after casting. See [Spells](spells.md) for the catalog and implementation status. Training improves its defined work and combat statistics. Runesmiths only fight enemies already in melee reach; they do not pursue or rally. Campaign research remains open; separate personal spells, healing or morale duties are not assumed.

## Continuing usefulness

Every resident role must remain useful on later maps. Terrain and objectives change where a role is valuable, rather than restricting it to one level. Training and new spells should expand the existing roster's usefulness. Every stronghold starts with a small mining crew; all other residents are recruited locally.

## Adding dwarf types later

The roster above defines the initial gameplay scope. Future types should be added through character definitions that describe their appearance, stats, needs, recruitment conditions, and job capabilities. Shared movement, needs, training, job assignment, and rally systems must work with those definitions rather than a fixed list of names. New roles may add a behavior when needed without replacing the shared resident systems. See the [architecture requirements](game-rules.md#14-extensible-character-and-room-definitions).

## Character concept art

The [dwarf concept gallery](concept-art/dwarfs/README.md) contains the character references; superseded and deferred character images have been removed. The latest Engineer sheet depicts the agreed female character; the Runesmith sheet reflects the merged research role. Each sheet includes front, back, and overhead studies in the shared stylized 3D direction. Other appearance details remain visual proposals rather than changes to recruitment, needs, or combat rules. Exact prompts are retained with the images. All concept art is collected in the [concept-art folder](concept-art/README.md).

## Decisions still open

- Starting miner count, recruitment price curve, wage amounts, and payday interval.
- Eating/rest intervals and room capacity per tile.
- Balance of each type's level statistics, training durations and shared cooldown.
- Broader spell balance and campaign research progression.
- Playtest [Call to Arms](spells.md#call-to-arms-behavior) response priorities: Warriors answer, workers continue ordinary activity or adjacent self-defense, and critical survival needs can override the rally.
- Whether individual dwarf names or personalities are included.

## Implementation playbook

[Adding rooms and dwarf types](content-playbook.md) gives the concrete dwarf-registration steps, supported capabilities/models, debug spawn workflow and test requirements. All dwarf definitions join the debug catalog automatically; per-type walking speed is tunable. Soft crowd avoidance yields to path progress when necessary. Real terrain and gameplay obstacles remain solid; room furniture has no collision or sight effect. Miners can also construct planned walls, with a deliberately longer work duration.
