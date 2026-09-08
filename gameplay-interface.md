# Gameplay interface

Development builds additionally expose scenario loading, pause/step/advance controls and a resident diagnostic inspector under Debug → Simulation tools. These controls and the browser automation interface are absent from production builds. See [Development tools](development-tools.md) for usage and shared scenario definitions; detailed diagnostic text remains inside the left sidebar.

Working interface design for the dwarven stronghold game. Companion documents: [Game rules](game-rules.md), [Rooms](rooms.md), [Characters](characters.md), and [Levels](levels.md).

## Agreed direction

Controls occupy a persistent sidebar on the left. The stylized 3D gameplay view fills the remaining space on the right. A minimap sits at the top of the sidebar, with icon controls below it for building rooms, defenses, spells, and dwarf information.

The gameplay view stays free of floating text, numbers, and progress bars. Rooms and characters communicate through their appearance and behavior. Detailed information belongs in the sidebar. Instructions, warnings, and other messages use dismissible cards associated with icons above a question-mark button.

This document defines the interface, not additional simulation rules. Exact dimensions, icon artwork, key bindings, and message behavior described as proposals should be checked during prototyping.

## Screen layout

| Area | Contents | Behavior |
|---|---|---|
| Top of left sidebar | Minimap and compact camera controls | Remains available while changing tools or inspecting something |
| Below minimap | Stored gold and a compact total dwarf count | Numbers are allowed here; further economic and population details open on demand |
| Sidebar category row | Rooms, defenses, spells, and dwarfs | Icon buttons switch the contents of a single panel |
| Main sidebar panel | Available choices, selected item details, or inspected room/dwarf information | Shows one focused view at a time rather than several overlapping windows |
| Sidebar utility controls | Excavation, call to arms, return to Hearthstone, and pause/settings | Stay easy to reach without opening a separate full-screen menu for routine play |
| Lower sidebar edge beside the gameplay view | Question-mark button with message icons above it | Provides help and access to current or dismissed messages |
| Right side | Overhead gameplay view | Supports panning, rotation, zoom, selection, and placement |

Proposed starting proportion: roughly one fifth of the width for the sidebar at a normal desktop aspect ratio. Scale the interface for readability rather than locking it to an exact pixel width. Keep the minimap and essential controls visible when the available panel space changes; scroll or page the choice grid inside the sidebar if needed.

The sidebar can use restrained dwarven stone, metal, and rune motifs. Borders and decoration must not compete with the icons or reduce useful viewing space. Text and numbers are permitted in the sidebar, but long explanations should appear only when requested or as messages.

## Minimap

- Show explored passages, rooms, known terrain boundaries, and the Hearthstone with clear shapes and a limited color palette.
- Show the camera's viewed area and orientation so rotation does not make navigation confusing.
- Clicking a known position recenters the camera. Proposed behavior: dragging within the minimap pans the view.
- Keep unexplored ground concealed. The minimap follows the same discovery and visibility rules as the main view; it does not reveal hidden caves, resources, or enemies.
- Current enemy markers require visibility. Remembered terrain and current threats must not be confused.
- An attack message may briefly emphasize its known location on the minimap, without adding a text label to the world.

Proposed orientation: keep the minimap fixed to the map and rotate the camera footprint or direction indicator within it. Exact map symbols, zoom controls, and handling of crowded markers remain visual design decisions.

## Sidebar categories

### Rooms

Use a grid of recognizable room icons. Populate choices from the registered [room catalog](rooms.md). Bridge is available as a construction choice where the level permits it. The Stone Hearth is already established at level start and is not a room the player can repeatedly build or upgrade.

Selecting an icon activates room designation. A compact display above the four-column icon grid shows the selected icon, room name and current gold cost per square (zero with free construction enabled). Each room has distinct shared vector artwork used by both its menu button and the world cursor. Unimplemented rooms are disabled and identified as planned; names remain available through button labels and hover titles. Repeated descriptions and per-button prices are omitted. Usable capacity and changes to it also appear here when they can be calculated. Do not print costs, tile counts, capacity numbers, or room names over the selected ground.

The player can designate single cells, paint connected shapes, or drag across an area. Rectangular dragging is a convenience, not a minimum room shape. Repeated selections allow bends, narrow wings, and layouts around bedrock or retained earth cells.

Room floors and available wall treatments identify the room as soon as it is designated. Furnishings appear automatically as decoration, with no capacity or access requirements. The interface does not introduce manual bed, shelf, or workstation placement. Show floor area, capacity per tile and resulting service capacity so every added square has a predictable benefit.

### Defenses

Provide door and trap icons with the selected fixture's purpose and current placement requirements in the sidebar. Any defined manufacturing availability, cost, or production status is reported in this panel.

Selecting a fixture gives a grid-aligned placement preview in the world. A valid preview and an invalid preview use different outlines or patterns as well as color. Explain an invalid location in the sidebar or message area, not beside the cursor.

The Workshop and Engineers supply manufactured defenses. Queue production in this panel, then select a completed item and click a valid grid square to consume one stock item and place it. Manufacturing time is the build time; placement itself is immediate. The panel reports price, work time and stock. Door previews show the automatically determined passage orientation; bolt previews show a direction arrow, with compass selection or **R** to rotate before placement. Invalid previews include an X as well as a different color.

Click a placed fixture with Inspect or the default floor-inspection action. Its controls appear at the top of the Defenses panel. Doors show health and **Open / Closed / Locked** buttons; traps show readiness, remaining cooldown and damage. A placed-fixture list provides another inspection route. Dismantle explicitly states that it gives no refund. Doors swing open, locks and damage appear on their models, spikes rise, and bolts visibly fire; health and timing numbers stay in the sidebar. Debug's defense yard provides test stock, test-raider and dwarf-hauling actions, reset and return controls.

### Spells

Spells are accessed through their own sidebar category. Selecting an available spell shows its effect, applicable cost, availability, and targeting requirements there. A spell needing a world target enters targeting mode; the player clicks a valid location to cast it and can cancel before casting.

Use an understated target outline or effect preview when useful. No floating spell name, cost, range number, or cooldown counter appears in the world. Any defined cooldown or research progress belongs in the spell panel. Unavailable spells have a distinct icon state, with the reason available on selection or focus.

Runesmiths research spells in the Library. The current [training, research and arrival controls](#training-research-and-arrival-controls) expose the provisional spell list, casting costs, research/preparation progress and restrictions. No additional magical currency or individual Runesmith orders are used.

### Dwarfs

Show the total population and counts by type using portraits or role icons. The current roster is Miner, female Engineer, Warrior, and Runesmith. Further details can show their current work, needs, pay, training, and condition when selected.

Recruit Miner is available here with the current purchase price and affordability visible before the click. The action recruits at the Hearthstone; it does not require moving the camera there first. Refresh the price when the number of living miners changes. Other types show their attraction requirements and support limitations rather than a direct purchase button.

Selecting a dwarf in the world opens its information in the sidebar. A locate action from the population panel can center the camera on that dwarf. Inspection is informational: it does not enable individual movement orders, possession, manual job assignment, or selecting an army to command.

## Excavation, selection, and camera controls

### Training, research and arrival controls

Training Room and Library use the same construction controls as the other rooms. Selecting either reports floor area, total capacity, occupied slots and reachable capacity in the left sidebar. Explain a real blocked route or a full room; missing furniture never causes an unavailable-service message.

The Dwarfs panel shows each resident's type, activity, food/rest state, training level, progress toward the next level, personal training cooldown and current work-speed bonus. Each training visit ends after one gained level and releases its room slot during cooldown. Specialists show their actual arrival requirements and missing support. There are no individual training or movement orders.

The Spells panel lists editable spell definitions with their effects, research/preparation progress, Research/Resume, Pause, and Cast controls. Initial research is selected by the player; Runesmiths choose reachable Library slots autonomously. A cast is available only when prepared and affordable. Targeting follows the selected spell's definition. Failed casts explain the reason and spend no gold; after a successful cast, preparation queues again. Active effect time stays in the sidebar. See [Spells](spells.md) for effects, costs, targeting and implementation status.

**Debug → Load visual showcase** builds example rooms through normal gameplay construction and adds test residents, gold, craft orders and research orders. Kitchens provide room support without initial food stock. The [configuration guide](configuration.md) identifies the source of the showcase contents. The room catalog's example layouts and free-building flag also work for Training Room and Library. Return to stronghold restores the paused normal world in memory.

The studio starts with automatic arrivals disabled. **Test automatic specialist arrivals** enables normal room/support checks in that test world. The Dwarfs panel reports time until the next check and the specific missing capacity for each type.

Excavation is the default cursor action at startup and after right-click or Escape cancels another operation. It is also available as a sidebar tool. The first tile determines the entire excavation gesture at pointer-down: an unmarked tile starts adding, and a marked tile starts removing. The action stays fixed across mixed selections, with matching cursor and preview; changes apply on release. Adding preserves existing marks, and removing leaves unmarked tiles unchanged. Single clicks still toggle their tile. Clicking an open floor or room inspects it. Marking diggable terrain uses a clear cell outline or surface treatment on the square grid. Bedrock cannot be designated for mining. The final highlight colors and pattern remain to be chosen.

The world cursor communicates the action with a pickaxe for excavation, a pickaxe with a minus for clearing marks, the normal pointer over inspectable open floor, or the selected room icon for construction. Right-click/Escape restores the contextual excavation cursor and clears the room choice. Native sidebar pointers remain normal. Cursor artwork contains no text or costs.

Excavation can be planned into darkness. Hidden tiles accept the same marks regardless of their concealed contents. Miners work only discovered, reachable diggable targets; discovery automatically clears marks over existing open space or unmineable terrain. Unexplored plans do not reveal terrain, permit room construction, or grant visibility.

Selection marks and placement previews are temporary action feedback. They may show which cells are affected and whether an action is valid, but contain no textual labels, numeric dimensions, or work-completion bars. The normal view does not need a bright permanent grid across every floor.

Proposed mouse and keyboard defaults:

| Input | Action |
|---|---|
| Left click a sidebar icon | Select a category, tool, or action |
| Left click in the world with no active tool | Inspect a room, dwarf, fixture, or known terrain in the sidebar |
| Left click or drag with excavation/room tool active | Designate the affected grid cells |
| Left click with a fixture, targeted spell, or rally tool active | Apply the selected action at a valid position |
| Right click or Escape | Cancel an active preview/tool and return to excavation |
| WASD or mouse at a window edge | Pan relative to the view, preserving angle and zoom |
| Left Ctrl + A / D, horizontal middle-mouse drag, or Q / E | Orbit around the viewed point at a fixed tilt |
| Mouse wheel over the world | Zoom in or out |
| Click the minimap | Recenter the camera |

Bindings are proposals and should be remappable. The sidebar provides Home and zoom icons; rotation uses the keyboard or middle drag. Closing, refreshing or leaving an active game requests browser confirmation to protect its in-memory session; Ctrl+W itself remains browser-controlled. Input over the sidebar must never excavate, build, or cast into the world behind it; scrolling a panel must not zoom the camera. Reselect marked tiles to remove excavation designations; previews distinguish adding from removing marks. The explicit erase tool remains available.

Camera rotation preserves the world-grid alignment of selections. Dwarfs and enemies still move continuously within the free space rather than following selection squares. Camera motion never grants visibility through concealed terrain.

Call to arms uses a recognizable rally marker in the world and an active state on its sidebar button. The player can place or cancel the rally from these controls; responders move and fight autonomously. The proposed one-active-rally model remains in [Game rules](game-rules.md#2-player-control). Response rules, costs, and range remain open.

## A clear gameplay view

Do not display room nameplates, capacity badges, dwarf names, health bars, need meters, level numbers, damage numbers, resource totals, progress bars, countdowns, or floating explanatory tooltips over rooms, characters, terrain, or fixtures. Selecting or hovering over something does not switch these overlays on. Exact information belongs in the sidebar.

The world may show excavation markings, room footprints, a restrained selection outline, placement ghosts, spell targeting, and the call-to-arms marker. These exist to support the current action, not as permanent dashboards. Avoid stacking generic status icons above residents and rooms.

| Information | What the world shows | Where details appear |
|---|---|---|
| Room identity | Distinctive floors, wall treatments, and recognizable furnishings | Selected room panel |
| Room size and usable capacity | The room's floor area, cosmetic furnishings and resident activity | Sidebar area, capacity per tile, total capacity, occupancy and expansion preview |
| Food provision | Kitchen decoration and residents eating or waiting for access | Kitchen resident support and capacity/access messages; no food inventory |
| Gold storage | Gold piles reflecting stored wealth and miners carrying deliveries | Sidebar gold total and Treasure Room details |
| Excavation or reinforcement | Miners working, debris, changing surfaces, and the resulting terrain state | Selected work information when needed |
| Research, crafting, and training | Dwarfs using their facilities and the physical work activity | Relevant sidebar category or selected room details |
| Damage and combat | Impact effects, character reactions, and readable damage to structures | Selected condition information and attack messages |
| Persistent unmet needs | Relevant behavior such as searching or leaving work, without exaggerated repeated effects | Dwarf information and a message identifying the cause |
| Threat to the Stone Hearth | Attacks and damage effects on the core | Priority warning and minimap emphasis |

Activity and stored-gold visuals must reflect the simulation. Food tables, beds and equipment are decoration; their presence or absence makes no promise about inventory or service capacity. A room without furniture still functions. Do not require the player to infer a specific problem from animation alone: the sidebar and messages explain capacity and route access.

## Messages and the question-mark button

Place the question-mark button at the lower sidebar edge beside the gameplay view. Message icons collect directly above it. A selected or newly raised message opens a dismissible card anchored above the button, beside its icon. Proposed layout: the card may extend a limited distance into the lower-left edge of the gameplay view, following the second reference, while the rest of the world stays clear.

This card is a temporary interface overlay, fixed to the screen. It is the explicit place for necessary message text over the gameplay area; it never follows a room or dwarf. Closing it restores the unobstructed view. Sidebar labels and statistics remain separate from these messages.

Each card contains a recognizable category icon, a short explanation, and an obvious dismiss control. Provide an optional locate action when the message concerns a known place. The question-mark button opens help and the message history, including dismissed guidance.

Proposed message behavior:

- Show one expanded card at a time. Keep additional messages as a compact, bounded set of icons or in the history.
- Group repeated instances of the same problem instead of adding a new card for every affected dwarf or simulation update.
- Use an icon and visual treatment to distinguish information, need problems, and urgent danger; do not rely on color or sound alone.
- Messages are non-modal and do not steal the camera. Jump to a location only when the player chooses the locate action.
- Critical events such as an attack on the Hearthstone can open the priority card. Dismissing its text leaves a compact warning icon while the condition remains active, without repeatedly reopening the same card.
- Dismissing a message acknowledges it; it does not mark its underlying problem as solved. Resolve its active warning when the simulation reports that the condition has cleared.
- Brief ordinary queues should not produce alerts. Notify for meaningful, persistent problems using the thresholds eventually defined by the needs and production systems.

Example message wording below illustrates placement and clarity; it does not define new thresholds or mechanics:

| Event | Example message | Optional action |
|---|---|---|
| Library capacity is occupied | More Library room capacity is needed. | Locate room |
| Kitchen support cannot meet population | More Kitchen capacity is needed. | Open Kitchen information |
| Residents cannot reach available food | Dwarfs cannot reach a Kitchen. | Locate the affected area |
| Too little reachable accommodation | More Dormitory capacity is needed. | Open Dormitory information |
| Insufficient stored gold for wages | There is not enough stored gold for payday. | Open treasure information |
| Treasury is inaccessible | Dwarfs cannot reach a Treasure Room to collect pay. | Locate the affected area |
| A spell becomes available | A new spell is ready. | Open spells |
| The core is attacked | The Stone Hearth is under attack. | Locate Hearthstone |

Objective briefings, discovered-area explanations, and tutorial guidance use the same message system. Objectives remain available through the sidebar help/information view rather than a permanent text checklist over the world.

## Readability and future content

Icons need distinct silhouettes and consistent selected, unavailable, and alert states. Show names and explanations in a sidebar help area on hover or keyboard focus so an icon-only toolbar does not require guessing. Keep these explanations within the sidebar or message card. Support readable UI scaling and keyboard focus without adding labels to the gameplay world.

Build category contents from the registered room, dwarf, fixture, and spell definitions. A new type supplies its icon and information using the same panel structure; adding content should not require another permanent toolbar or assume a fixed population roster. Display only content appropriate to the campaign and level unlock rules.

## Development debug controls

M5 adds a **Room Debug View** for inspecting all defined room types and testing implemented rooms in different layouts. M5.1 adds **Debug** as an option alongside the left-hand sidebar controls. Its panel provides access to the room view and a **Free room construction** toggle showing the current development flag state. These features are implemented; verification is recorded in the [development plan](development-plan.md).

The room view offers a catalog, room selection, and a resettable test area. Planned room entries remain clearly marked until implemented. Create and expand a selected room with the same click/drag grid gestures, previews, validation, automatic furnishings, and camera controls as normal gameplay. Use the sidebar to inspect usable capacity, stock/occupancy where applicable, and access or layout problems. New room definitions feed the catalog automatically.

When free construction is enabled, room previews show zero effective construction cost and construction/expansion does not deduct gold. Other placement and capacity rules remain active. Disabling the flag restores normal room costs. The control applies to both the game and the room view and requires no saved preference.

Debug panel interactions must not reach the world behind the sidebar. Keep the world free of floating labels and statistics in this view as well; use terrain highlights, furnishings, and sidebar details to inspect layouts. Follow the [room development checklist](room-development-checklist.md) for consistent checks.

## Reference images

- [Left sidebar and minimap reference](references/gameplay-interface/dungeon-keeper-sidebar.png): supplied by the user for the left/right composition, minimap, and icon categories.
- [Message reference](references/gameplay-interface/dungeon-keeper-message.png): supplied by the user for messages associated with icons and a question-mark control.

These Dungeon Keeper screenshots are layout references. Their floating room status bars and numbers are excluded by the user's interface requirements. Text inside the screenshots is reference content, not an instruction to the player or a new requirement for this game.

## Checks for the first playable interface

- The player can find rooms, defenses, spells, dwarf counts, and miner recruitment through the left sidebar.
- Room placement supports arbitrary grid footprints and explains usable capacity without text over the room.
- Normal play, hover, inspection, combat, and construction leave the world free of numbers and progress bars.
- Messages explain the actual cause of a problem, can be dismissed and revisited, and do not form an uncontrolled stack.
- Camera rotation, zoom, and minimap navigation preserve selection accuracy and fog of war.
- Inspecting a dwarf never becomes direct troop control.

Room placement skips ineligible squares within a drag (terrain, hidden or unclaimed floor, the Hearthstone, and existing rooms). Eligible new squares are built and charged normally; existing rooms are preserved. Previews and price use the eligible subset. An entirely invalid selection builds nothing. The complete eligible subset must still be affordable unless free room construction is enabled.

The Stone Hearth includes one fixed treasury chest using the shared gold-storage service. It starts empty and holds the normal construction cost of a 3×3 Treasure Room (currently 108 gold). It accepts miner deliveries and pays for construction/production through the shared balance, including when the starting allowance is exhausted. The fixed core treasury service protects its approach square. Inspect the Hearth for live stored gold/capacity. It is not a room upgrade or an extra starting grant.

## Wall construction and room reclaim commands

**Build walls** plans reinforced rock on clear claimed floor. Miners construct it from an adjacent square; plans stay walkable until complete. The initial build time is 24 seconds, always longer than normal excavation plus reinforcement. Start a drag on a wall plan to cancel plans; start on unplanned floor to add plans. Core, rooms, resource piles and facility approaches are protected. Right-click returns to excavation. The current cost is time only. Planned sites with no approach wait; closing a passage can cut off access.

**Reclaim room tiles** returns eligible room squares to claimed ground and immediately refunds the configured fraction of their original payment (default 50%, rounded down per tile). Free-built squares refund nothing. Capacity follows the remaining floor and decoration adapts; gold displaced by reduced storage remains on the ground for hauling. Training/research progress and completed crafted items remain intact. Reclaiming does not sell the Hearth. Prices and refunds appear in the sidebar.
