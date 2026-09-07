# Gameplay interface

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

Use a grid of recognizable room icons. The current growable room catalog is Treasure Room, Dormitory, Kitchen, Workshop, Training Room, Library, and Guard Post. Bridge is available as a construction choice where the level permits it. The Stone Hearth is already established at level start and is not a room the player can repeatedly build or upgrade.

Selecting an icon activates room designation. A compact display above the four-column icon grid shows the selected icon, room name and current gold cost per square (zero with free construction enabled). Each room has distinct shared vector artwork used by both its menu button and the world cursor. Unimplemented rooms are disabled and identified as planned; names remain available through button labels and hover titles. Repeated descriptions and per-button prices are omitted. Usable capacity and changes to it also appear here when they can be calculated. Do not print costs, tile counts, capacity numbers, or room names over the selected ground.

The player can designate single cells, paint connected shapes, or drag across an area. Rectangular dragging is a convenience, not a minimum room shape. Repeated selections allow bends, narrow wings, and layouts around bedrock or retained earth cells.

Room floors and available wall treatments identify the room as soon as it is designated. Furnishings appear automatically only where their footprints and access fit. The interface does not introduce manual bed, shelf, or workstation placement.

### Defenses

Provide door and trap icons with the selected fixture's purpose and current placement requirements in the sidebar. Any defined manufacturing availability, cost, or production status is reported in this panel.

Selecting a fixture gives a grid-aligned placement preview in the world. A valid preview and an invalid preview use different outlines or patterns as well as color. Explain an invalid location in the sidebar or message area, not beside the cursor.

The Workshop and Engineers supply manufactured defenses. This interface does not decide whether a placement reserves stock, queues manufacture, or waits for delivery; that production flow remains open. If production takes time, its details stay in the sidebar and the world shows the actual physical state of the work.

### Spells

Spells are accessed through their own sidebar category. Selecting an available spell shows its effect, applicable cost, availability, and targeting requirements there. A spell needing a world target enters targeting mode; the player clicks a valid location to cast it and can cancel before casting.

Use an understated target outline or effect preview when useful. No floating spell name, cost, range number, or cooldown counter appears in the world. Any defined cooldown or research progress belongs in the spell panel. Unavailable spells have a distinct icon state, with the reason available on selection or focus.

Runesmiths research spells in the Library. The spell list, costs, research order, progression, and casting restrictions remain to be designed. The interface should display the agreed rules when those exist rather than assume an additional magical currency or manual commands for individual Runesmiths.

### Dwarfs

Show the total population and counts by type using portraits or role icons. The current roster is Miner, female Engineer, Warrior, and Runesmith. Further details can show their current work, needs, pay, training, and condition when selected.

Recruit Miner is available here with the current purchase price and affordability visible before the click. The action recruits at the Hearthstone; it does not require moving the camera there first. Refresh the price when the number of living miners changes. Other types show their attraction requirements and support limitations rather than a direct purchase button.

Selecting a dwarf in the world opens its information in the sidebar. A locate action from the population panel can center the camera on that dwarf. Inspection is informational: it does not enable individual movement orders, possession, manual job assignment, or selecting an army to command.

## Excavation, selection, and camera controls

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
| Room size and usable capacity | The actual beds, stations, aisles, and storage that fit | Sidebar capacity and expansion preview |
| Food provision | Visible mushroom growth, food, serving places, and residents eating or queuing | Kitchen information and shortage messages |
| Gold storage | Gold piles reflecting stored wealth and miners carrying deliveries | Sidebar gold total and Treasure Room details |
| Excavation or reinforcement | Miners working, debris, changing surfaces, and the resulting terrain state | Selected work information when needed |
| Research, crafting, and training | Dwarfs using their facilities and the physical work activity | Relevant sidebar category or selected room details |
| Damage and combat | Impact effects, character reactions, and readable damage to structures | Selected condition information and attack messages |
| Persistent unmet needs | Relevant behavior such as searching or leaving work, without exaggerated repeated effects | Dwarf information and a message identifying the cause |
| Threat to the Stone Hearth | Attacks and damage effects on the core | Priority warning and minimap emphasis |

These visual cues must reflect the simulation. Decorative full food tables must not imply supplies when none exist, and a painted room must not appear functional when no workstation fits. Do not require the player to infer a specific problem from animation alone: the sidebar and messages provide the explanation.

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
| A room has no usable research position | Library needs space for a research station. | Locate room |
| Food stock cannot meet demand | Food supplies are running low. | Open Kitchen information |
| Residents cannot reach available food | Dwarfs cannot reach a Kitchen. | Locate the affected area |
| Too few usable beds | More accessible beds are needed. | Open Dormitory information |
| Insufficient stored gold for wages | There is not enough stored gold for payday. | Open treasure information |
| Treasury is inaccessible | Dwarfs cannot reach a Treasure Room to collect pay. | Locate the affected area |
| A spell becomes available | A new spell is ready. | Open spells |
| The core is attacked | The Stone Hearth is under attack. | Locate Hearthstone |

Objective briefings, discovered-area explanations, and tutorial guidance use the same message system. Objectives remain available through the sidebar help/information view rather than a permanent text checklist over the world.

## Readability and future content

Icons need distinct silhouettes and consistent selected, unavailable, and alert states. Show names and explanations in a sidebar help area on hover or keyboard focus so an icon-only toolbar does not require guessing. Keep these explanations within the sidebar or message card. Support readable UI scaling and keyboard focus without adding labels to the gameplay world.

Build category contents from the registered room, dwarf, fixture, and spell definitions. A new type supplies its icon and information using the same panel structure; adding content should not require another permanent toolbar or assume a fixed four-type population layout. Display only content appropriate to the campaign and level unlock rules.

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

The Stone Hearth includes one fixed treasury chest using the shared gold-storage service. It starts empty and holds the normal construction cost of a 3×3 Treasure Room (currently 108 gold). It accepts miner deliveries and pays for construction/production through the shared balance, including when the starting allowance is exhausted. Its access square is preserved by automatic furnishings. Inspect the Hearth for live stored gold/capacity. It is not a room upgrade or an extra starting grant.

## Wall construction and room reclaim commands

**Build walls** plans reinforced rock on clear claimed floor. Miners construct it from an adjacent square; plans stay walkable until complete. The initial build time is 24 seconds, always longer than normal excavation plus reinforcement. Start a drag on a wall plan to cancel plans; start on unplanned floor to add plans. Core, rooms, resource piles and facility approaches are protected. Right-click returns to excavation. The current cost is time only. Planned sites with no approach wait; closing a passage can cut off access.

**Reclaim room tiles** returns eligible room squares to claimed ground and immediately refunds the configured fraction of their original payment (default 50%, rounded down per tile). Free-built squares refund nothing. Furniture adapts; removed chest contents remain on the ground for hauling, and retained food supplies refill replacement facilities. Reclaiming does not sell the Hearth. Prices and refunds appear in the sidebar.
