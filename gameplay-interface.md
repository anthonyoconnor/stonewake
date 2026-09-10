# Gameplay interface

The player interface uses a compact, persistent left sidebar with four main categories: Rooms, Defenses, Spells and Workforce. The M20 update separates ordinary actions from development tools and makes unavailable actions explainable by keyboard as well as mouse. Inspection stays in the sidebar; notifications use a rail and temporary card anchored beside it.

## Current player interface

- The map, gold and population totals, Hearth objective, category row, active tool, cancel button, camera controls and Help remain outside the scrolling action panel. Desktop layouts are checked at 1440×900, 1024×768 and 800×600; the minimap becomes shorter at small window heights. The action panel scrolls independently and never zooms the world.
- Rooms shows implemented rooms only, followed by the consistent Bridge / Wall / empty / Sell row. Campaign bridge availability explains the required onward-Hearthstone unlock. Costs and capacity stay in the selected action header; unaffordable or unavailable icons are dimmed and cannot activate. Workshop production expands into recipe icons with gold costs, live orders and stock; worker/access explanations have their own disclosure.
- Rooms, Defenses and Spells share selected and unavailable states. Icon actions remain keyboard-focusable when unavailable, so their cost and reason appear in the sidebar help card on focus or hover. Enter on an unavailable action does nothing. Ordinary actions keep direct activation; Research/Resume and Pause remain available through the selected spell's information or Library research selector.
- The current world tool is always named above the lower controls. Its ×, Escape or right-click returns to excavation. Releasing a drag over the sidebar cancels it. Focused controls do not drive the keyboard camera. The outer left viewport edge pans left even over the sidebar; ordinary hovering, clicking and scrolling inside the sidebar remain stationary. Its internal world boundary is not an edge trigger. Moving off the outer edge, leaving the viewport or losing window focus stops edge movement. Open dialogs, including the full map and configuration, suppress panning. Closing the full map with Escape preserves the tool that was active before the map opened.
- Selecting a room opens its room information; fixtures open their inspector; character inspection appears at the top of the scrolling panel with a dismiss control and live identity, health, activity and effects. Changing categories clears that inspection. Dwarf role/activity counts expand into informational resident rows with Locate. Enemy information uses the full registered roster and its real stats. Inspection remains usable after an area ends; the result replaces the inactive tool/status strips so the fixed controls remain reachable at compact sizes.
- Notifications use a vertical rail on the right edge of the left sidebar. Icons slide outward with distinct information, warning and danger marks. Click an icon for one anchored detail card; Go to source locates a known fight, resident or place. Card × collapses details; Dismiss, icon ×, right-click or Delete removes the report from the rail. Help retains a bounded per-area history and can reopen details. New reports never steal the camera, focus or an open card. See the notification rules below.
- The Hearth panel owns campaign briefings and activation. A persistent result card offers travel, restart or the campaign endpoint action supplied by the campaign state. Debug has a separate footer icon; room layouts, test residents/enemies, configuration and harness controls stay there or in an active test world.

`node scripts/interface-browser.mjs` covers the M20 player flows; `scripts/campaign-browser.mjs` verifies real campaign activation, travel and endpoint controls. Before/after and compact-layout captures are kept in ignored `test-results/m20/`.

The Debug menu exposes three direct choices under **Before & after**: **Characters**, **Terrain & rooms**, and **Spells, traps & Hearthstones**. **Back to comparison** restores the current studio controls after opening another panel without reloading its world or changing the camera and preview. **Debug → Test harnesses → Additional test scenarios** retains grouped scenario loading, with pause/step/advance and resident diagnostics for gameplay test worlds. Display-only comparison rooms omit simulation advancement, diagnostics and test-actor setup. Production builds retain these visible review tools while omitting URL-driven scenario loading and the browser automation interface. See [Development tools](development-tools.md) for usage; detailed diagnostic text remains inside the left sidebar.

Working interface design for the dwarven stronghold game. Companion documents: [Game rules](game-rules.md), [Rooms](rooms.md), [Characters](characters.md), and [Levels](levels.md).

The left-edge panning fix is implemented. Direction stays relative to the rotated view. `node scripts/camera-browser.mjs` checks actual outer edges, sidebar overlap, rotation, compact layouts, ordinary panel interaction, pointer leave, blur and full-map suppression. Future starting menus must retain the same camera suppression as dialogs.

## Starting menu and loading screens

M25 uses the user-approved [main menu and Free Play designs](concept-art/menus/README.md): carved stone and bronze controls, warm lamps and the blue Hearthstone, with Campaign/Free Play/Settings on the main screen and a level list beside an illustrated preview in Free Play. Their composition is implemented with responsive, keyboard-accessible HTML controls. Campaign starts the five-area authored journey with gradual content unlocks. Free Play uses a scrollable catalog, selected outline/rune, illustrated preview, Start level and Back. Settings holds animation, edge-scrolling and audio preferences in memory. The sidebar ♪ button opens sound settings during a run without discarding it. The sidebar menu button and result card provide Return to menu; confirmation offers Keep playing or discard. Active-run restart also confirms, while terminal restarts start immediately. Mode changes reset all local state. Menus and discard confirmations pause simulation and suppress camera/world inputs.

M25.1 adds a lightweight themed loading shell before expensive game initialization to cover the reported blank startup, then consistent loading screens for level entry, travel and restart. Show truthful activity, retain the screen until the destination is rendered and usable, and provide a visible retry/reload path on failure. The initial shell must paint without waiting for the game bundle or large background images. Both are implemented. The inline HTML shell paints before the dynamic game bundle and uses a styled stone/bronze/rune fallback while optional art arrives. Initial startup and every world transition yield browser frames, keep simulation and world controls blocked, and wait for scene readiness plus a rendered frame before dismissal. Activity stages are indeterminate and have no minimum duration. Failed transitions retain the overlay with Retry and Reload; failed startup offers Reload to rebuild the engine cleanly. Reduced motion stops the activity animation.

## Underground lighting

[M33 lighting](graphics-pass.md#m31-environment-refinement-and-m33-gameplay-lighting) provides moody ambient lighting, visible source glows with nearby surface illumination, and a soft light beneath the world pointer. Pointer light follows the hovered world surface and is hidden over UI or outside the viewport. It does not reveal unexplored terrain or hidden inhabitants, and must preserve tool/selection readability.

Its test room is available under **Debug → Test harnesses → M33 lighting test room**. The sidebar provides a current-renderer comparison toggle, camera views, ambient/directional/source/glow controls, pointer controls, defaults and reset. It starts paused and uses the shared Pause/Resume and Return to stronghold controls; Rooms reopens these controls after inspection. Settings affect only this test world, and return restores the retained game and prior pause state. Ordinary campaign and Free Play worlds use biome palettes and bounded source/pointer lighting; test controls affect only the harness. See [the experiment and limits](graphics-pass.md#m33-lighting-test-room).

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

Use text sparingly in the left-hand in-game input panel. Prefer recognizable icons with direct activation and enabled/disabled states. Keep short costs/status only when useful; place labels, explanations and secondary controls in tooltips or expandable details. The separate construction toolbar is removed. Excavation and clearing marks use the default mouse behavior with no buttons. Rooms has a fixed final four-cell row: Bridge, Wall, an empty cell, and Sell in the lower-right corner. This row stays in place regardless of the selected tool. Sell replaces separate room-reclaim and bridge-removal controls, and also dismantles placed defenses. Room/deck refunds, full bridge-plan refunds, zero defense refunds and bridge removal protections remain unchanged.

The sidebar can use restrained dwarven stone, metal, and rune motifs. Borders and decoration must not compete with the icons or reduce useful viewing space. Text and numbers are permitted in the sidebar, but long explanations should appear only when requested or as messages.

## Minimap

- Show explored passages, rooms, known terrain boundaries, and the Hearthstone with clear shapes and a limited color palette.
- Neither map shows a camera footprint, orientation overlay or camera-center marker.
- Press **M** or the expand icon beside the minimap to open a larger full map using the same colors and fog of war. The entire level fits at once with its aspect ratio preserved. M, Escape and the close button dismiss it; clicking a position recenters the camera and closes it. Simulation continues while the map is open; world camera inputs are suspended.
- Clicking a known position recenters the camera. Proposed behavior: dragging within the minimap pans the view.
- Gold seams and gem deposits are always visible in the main view and on the minimap and full map, including beyond explored terrain, to draw players toward useful areas. Other unexplored ground, caves, enemies and the onward Hearthstone remain concealed. Resource markers do not discover tiles or permit remote mining; deposits still require a physically reachable, discovered work face. Exhausted gold disappears from the resource map; persistent gems remain.
- Current enemy markers require visibility. Remembered terrain and current threats must not be confused.
- An attack message may briefly emphasize its known location on the minimap, without adding a text label to the world.

Keep both maps fixed to the map orientation. Exact map symbols, zoom controls, and handling of crowded markers remain visual design decisions.

## Sidebar categories

### Rooms

Use a grid of recognizable room icons. Populate choices from the registered [room catalog](rooms.md). Bridge is available as a construction choice where the level permits it. The Stone Hearth is already established at level start and is not a room the player can repeatedly build or upgrade.

Selecting an icon activates room designation. A compact display above the four-column icon grid shows the selected icon, room name and current gold cost per square (zero with free construction enabled). Each room has distinct shared vector artwork used by both its menu button and the world cursor. Unimplemented rooms are omitted from ordinary player choices and remain identified as planned in the development catalog. Campaign and authored Free Play plans gate room/tool icons, recruitment, manufactured stock, production, spell casting and research together. Names and unavailable reasons remain available on hover and keyboard focus. Repeated descriptions and per-button prices are omitted. Usable capacity and changes to it also appear here when they can be calculated. Do not print costs, tile counts, capacity numbers, or room names over the selected ground.

The player can designate single cells, paint connected shapes, or drag across an area. Rectangular dragging is a convenience, not a minimum room shape. Repeated selections allow bends, narrow wings, and layouts around bedrock or retained earth cells.

Room floors and available wall treatments identify the room as soon as it is designated. Furnishings appear automatically as decoration, with no capacity or access requirements. The interface does not introduce manual bed, shelf, or workstation placement. Show floor area, capacity per tile and resulting service capacity so every added square has a predictable benefit.

### Defenses

Defenses use the same four-column icon grid and selected-item header as Rooms. Icons are dimmed and disabled until a Workshop with crafting capacity exists and the item is in stock, and when the area has ended. Clicking an enabled icon starts placement directly; availability is checked again on the world click, including if the Workshop was sold after selecting the tool. Tooltips report stock and the reason an icon is disabled. Timber, reinforced and steel doors have distinct artwork. Selecting a fixture shows its name, finished stock, manufacturing gold/work cost, purpose and placement requirements; hover titles also report stock. Bolt facing controls appear only for the bolt trap. Workshop production and placed-fixture inspection remain available below the choices.

Selecting a fixture gives a grid-aligned placement preview in the world. A valid preview and an invalid preview use different outlines or patterns as well as color. Explain an invalid location in the sidebar or message area, not beside the cursor.

The Workshop and Engineers supply manufactured defenses. Queue production in this panel, then select a completed item and click a valid grid square to consume one stock item and place it. Manufacturing time is the build time; placement itself is immediate. The panel reports price, work time and stock. Door previews show the automatically determined passage orientation; bolt previews show a direction arrow, with compass selection or **R** to rotate before placement. Invalid previews include an X as well as a different color.

Click a placed fixture with Inspect or the default floor-inspection action. Its controls appear at the top of the Defenses panel. Doors show health and **Open / Closed / Locked** buttons; traps show readiness, remaining cooldown and damage. A placed-fixture list provides another inspection route. Dismantle explicitly states that it gives no refund. Doors swing open, locks and damage appear on their models, spikes rise, and bolts visibly fire; health and timing numbers stay in the sidebar. Debug's defense yard provides test stock, test-raider and dwarf-hauling actions, reset and return controls.

### Spells

Spells use the same four-column icon grid and selected-item header as Rooms, with distinct vector artwork for every spell. The header shows the selected name and gold cost per cast; only that spell’s effect, research progress and Research/Resume and Pause controls appear below the grid. Small icon markers distinguish unresearched, researching/preparing, paused and ready states, with full names and states in accessible labels and hover titles. Library staffing details are expandable. Clicking an enabled icon activates the spell directly: Create Stonehand summons immediately, while targeted spells enter targeting. There is no separate Cast button. Icons are dimmed and disabled when unaffordable, unprepared, blocked by support/access, already active (rally/barrier), or the area has ended. Hover shows the cost and reason; enabled icons also support keyboard activation. Hover/focus inspects details without casting. Library research includes a spell selector to reach Research/Resume and Pause even when a casting icon is disabled. A spell needing a world target enters targeting mode; the player clicks a valid location to cast it and can cancel before casting.

Use an understated target outline or effect preview when useful. No floating spell name, cost, range number, or cooldown counter appears in the world. Any defined cooldown or research progress belongs in the spell panel. Unavailable spells have a distinct icon state, with the reason available on selection or focus.

Runesmiths research spells in the Library. The current [training, research and arrival controls](#training-research-and-arrival-controls) expose the provisional spell list, casting costs, research/preparation progress and restrictions. No additional magical currency or individual Runesmith orders are used.

### Workforce

Cave Hound details show bite strength, health and den food/rest, with no wage or training requirements. Expand population details to see the preferred next arrival, its countdown, each type's cooldown and support eligibility. Early hounds arrive regularly; later supported defenders and queued specialist work guide the next arrival.

Hound activity identifies patrols, running to defend, investigating reports and fighting. Shared sightings and attacks trigger autonomous response without selecting a dog. Mining-worker escape appears under Needs, with running/waiting activity and retained cargo shown in its details. These behaviours add no world labels or individual movement controls.

Stonehand details show health, cargo and current work, with a short note that they need no food, beds, wages or training. Dwarf details retain their living needs and progression.

The Workforce tab opens with a compact icon matrix: Cave Hound, Stonehand, retained Miner, Engineer, Warrior and Runesmith role icons down the side, and Idle, Working, Needs and Combat icons across the top. Each cell shows its live population count; zero counts are muted. Hover labels and accessible names explain the icons. Click a count to list matching residents, or a role icon to show that whole type. Expand a resident for work, needs, pay, training and condition details, with a Locate worker button. Pay, wellbeing and specialist attraction details are grouped in an expandable section below the matrix.

Activity groups use current simulation state, including travel toward the current job. Working includes hauling, construction, training and Hearthstone activation; Needs includes eating, sleeping, collecting pay and departure; Combat includes pursuit and rally response. Idle includes waiting for available work. These are activity counts, not unmet-need warnings; wellbeing warnings remain available separately.

Create Stonehand in Spells assembles a worker at the Hearth for 50 gold + 25 per living Stonehand, with no Library research or food/bed support requirement. Its tooltip explains missing gold or arrival access. The original Miner has no ordinary recruitment icon. Specialist attraction requirements remain in expandable population details.

Selecting a dwarf in the world opens its information in the sidebar. A locate action from the population panel can center the camera on that dwarf. Inspection is informational: it does not enable individual movement orders, possession, manual job assignment, or selecting an army to command.

## Excavation, selection, and camera controls

### Training, research and arrival controls

Training Room and Library use the same construction controls as the other rooms. Selecting either reports floor area, total capacity, occupied slots and reachable capacity in the left sidebar. Explain a real blocked route or a full room; missing furniture never causes an unavailable-service message.

The Workforce panel shows each resident's type, activity, character level and maximum level, current/maximum health, attack damage and interval, work-speed bonus and food/rest state. It also shows the next level, its shared XP requirement, earned XP, training/combat earning rates and personal training cooldown, or a maximum-level message. Each training visit ends after one gained level and releases its room slot during cooldown. Specialists show their actual arrival requirements and missing support. There are no individual training or movement orders. [Character levels](characters.md#character-levels-and-training) owns the progression rules and balance tables.

The Spells panel lists editable spell definitions with their effects, research/preparation progress, Research/Resume and Pause controls, plus direct icon activation. Initial research is selected by the player; Runesmiths choose reachable Library slots autonomously. A cast is available only when prepared and affordable. Targeting follows the selected spell's definition. Failed casts explain the reason and spend no gold; after a successful cast, preparation queues again. Active effect time stays in the sidebar. See [Spells](spells.md) for effects, costs, targeting and implementation status.

**Debug → Test harnesses → Load visual showcase** builds example rooms through normal gameplay construction and adds test residents, gold, craft orders and research orders. Kitchens provide room support without initial food stock. The [configuration guide](configuration.md) identifies the source of the showcase contents. The room catalog's example layouts and free-building flag also work for Training Room and Library. Return to stronghold restores the paused normal world in memory.

The studio starts with automatic arrivals disabled. **Test automatic specialist arrivals** enables normal room/support checks in that test world. The Workforce panel reports time until the next check and the specific missing capacity for each type.

Excavation is the default cursor action at startup and after right-click or Escape cancels another operation. The first tile determines the entire excavation gesture at pointer-down: an unmarked tile starts adding, and a marked tile starts removing. The action stays fixed across mixed selections, with matching cursor and preview; changes apply on release. Adding preserves existing marks, and removing leaves unmarked tiles unchanged. Single clicks still toggle their tile. Clicking an open floor or room inspects it. Marking diggable terrain uses a clear cell outline or surface treatment on the square grid. Bedrock cannot be designated for mining. The final highlight colors and pattern remain to be chosen.

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

Bindings are proposals and should be remappable. The sidebar provides Home and zoom icons; rotation uses the keyboard or middle drag. Closing, refreshing or leaving an active game requests browser confirmation to protect its in-memory session; Ctrl+W itself remains browser-controlled. Input over the sidebar must never excavate, build, or cast into the world behind it; scrolling a panel must not zoom the camera. Reselect marked tiles to remove excavation designations; previews distinguish adding from removing marks. There are no separate excavation or erase buttons.

Camera rotation preserves the world-grid alignment of selections. Workforce and enemies still move continuously within the free space rather than following selection squares. Camera motion never grants visibility through concealed terrain.

Call to arms uses a recognizable rally marker in the world and an active state on its sidebar button. The player can place or cancel the rally from these controls; responders move and fight autonomously. The proposed one-active-rally model remains in [Game rules](game-rules.md#2-player-control). Response rules, costs, and range remain open.

Camera zoom has no minimum inspection distance: the wheel and sidebar buttons continue moving closer, including in the comparison studios. The far limit still applies. In the character gallery, Starting/Refined centers an individual model and Focus selected pair restores both. Its animation selector, play/pause, restart, frame-step and speed controls preview the original and revised rigs together without advancing gameplay.

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
| Research, crafting, and training | Workforce using their facilities and the physical work activity | Relevant sidebar category; dwarf level, next XP requirement, shared progress and training cooldown in the Workforce panel |
| Damage and combat | Impact effects, character reactions, and readable damage to structures | Selected condition information and attack messages |
| Persistent unmet needs | Relevant behavior such as searching or leaving work, without exaggerated repeated effects | Dwarf information and a message identifying the cause |
| Threat to the Stone Hearth | Attacks and damage effects on the core | Priority warning and minimap emphasis |

Activity and stored-gold visuals must reflect the simulation. Food tables, beds and equipment are decoration; their presence or absence makes no promise about inventory or service capacity. A room without furniture still functions. Do not require the player to infer a specific problem from animation alone: the sidebar and messages explain capacity and route access.

## Messages and the question-mark button

The question-mark tab sits just outside the lower-right edge of the sidebar. A vertical, scrollable rail of notification icons collects above it. New icons slide out from behind the panel; reduced-motion preferences disable that animation. Reports sort by urgency, then newest first. Unread reports have a small illuminated edge; distinct icons and punctuation distinguish urgency without relying only on color.

This card is a temporary interface overlay, fixed to the screen. It is the explicit place for necessary message text over the gameplay area; it never follows a room or dwarf. Closing it restores the unobstructed view. Sidebar labels and statistics remain separate from these messages.

Click an icon to open its card beside the rail. Each card contains a recognizable icon, short title, explanation and any source or follow-up actions. The question-mark button and Help open the area's history, including dismissed and resolved reports. Selecting a history row reopens its details and still-valid actions. Restart/travel starts a new area's reports; returning from a test world restores the retained stronghold's reports.

Current notification behavior:

- Show one expanded card at a time. Keep additional messages in the scrollable icon rail or history. Both remain usable at compact desktop sizes. Pointer, keyboard and wheel interaction does not affect the world beneath them; a world drag released on a notification is cancelled.
- Group repeated instances of the same problem instead of adding a new card for every affected dwarf or simulation update.
- Use an icon and visual treatment to distinguish information, need problems, and urgent danger; do not rely on color or sound alone.
- Messages are non-modal and do not steal the camera. Jump to a location only when the player chooses the locate action.
- New events never automatically open a card or take focus. Danger reports sort first and scroll into view when the player is not interacting with the rail. **Close details** (card × or Escape while focused in the notification) collapses the card and keeps its icon. **Dismiss** (card action, icon ×, right-click on the icon or Delete while focused on it) removes the icon and acknowledges that episode.
- Dismissing a message does not change the gameplay problem. Continuous attacks and repeated shortage updates stay grouped within an episode, with dismissal preserved. Recovery clears a condition; recurrence or escalation raises a fresh report. Workforce can restore dismissed need icons without changing the residents' support or morale.
- Filling accessible accommodation raises **Dormitory is full**. **Build Dormitory** opens Rooms and selects its construction tool. Freeing space clears it; filling again starts a fresh episode.
- First natural recruitment of each resident type in an area produces an arrival report with its type icon, resident name and **Meet new arrival** action. Starting residents and debug spawns do not announce recruitment; later recruits of the same type do not repeat the introduction. This includes Cave Hounds and newly supported specialist dwarfs.
- **Go to source** resolves resident/enemy targets live and opens inspection. Unknown origins have no coordinates; lost, departed, dead or hidden unit targets disable Locate with a short explanation. Camera location never reveals terrain.
- Current conditions cover fighting, Hearth damage, warned/active/cleared encounter sources, sustained needs by cause, and full Dormitory accommodation. Combat and Hearth warnings resolve after the quiet intervals in [notificationSettings](src/game/notifications.ts); these do not alter combat or enemy awareness. The same settings own the history limit.
- Brief ordinary queues should not produce alerts. Notify for meaningful, persistent problems using the thresholds eventually defined by the needs and production systems.

All notification types use the same model, rail, card, dismissal, history and source resolution. Conditions are registered in [notification definitions](src/content/notifications.ts); one-time events call the shared service. Neither path requires a UI branch for the new type. See [Adding notifications](content-playbook.md#add-a-notification). `npm run verify -- notifications --browser=notifications` checks these flows; captures are in ignored `test-results/notifications/`.

Example message wording below illustrates placement and clarity; it does not define new thresholds or mechanics:

| Event | Example message | Optional action |
|---|---|---|
| Library capacity is occupied | More Library room capacity is needed. | Locate room |
| Kitchen support cannot meet population | More Kitchen capacity is needed. | Open Kitchen information |
| Residents cannot reach available food | Workforce cannot reach a Kitchen. | Locate the affected area |
| Too little reachable accommodation | More Dormitory capacity is needed. | Open Dormitory information |
| Insufficient stored gold for wages | There is not enough stored gold for payday. | Open treasure information |
| Treasury is inaccessible | Workforce cannot reach a Treasure Room to collect pay. | Locate the affected area |
| A spell becomes available | A new spell is ready. | Open spells |
| The core is attacked | The Stone Hearth is under attack. | Locate Hearthstone |

Objective briefings, discovered-area explanations, and tutorial guidance use the same message system. Objectives remain available through the sidebar help/information view rather than a permanent text checklist over the world.

The **Hearth** button beneath the gold/population totals opens starting-core health, the onward objective and current campaign briefing. The sidebar distinguishes undiscovered, unreachable, contested, awaiting an available resident, approaching, activating and complete. The stone has no mesh or location disclosure before normal discovery. After discovery, **Activate onward Hearthstone** requests an autonomous physical visit; interruptions reset work and retry the request. Local completion or core defeat shows a persistent sidebar result and **Restart area**, freezing ordinary gameplay while allowing inspection and camera movement. In a development scenario, restart reloads that same scenario. A completed campaign area offers travel to its named next area; the final area shows the resolved journey and **Begin a new journey**.

**Resident needs** groups shortage warnings by cause in the notification rail, with an individual Dismiss action per group. Escalation reopens a warning; restoring its support clears it. The Workforce panel shows wellbeing counts, each resident's cause/status and a control to reopen dismissed warnings. Blocked departures explain the missing Hearth route. Details remain in the sidebar or its anchored card.

## Readability and future content

Icons need distinct silhouettes and consistent selected, unavailable, and alert states. Show names and explanations in a sidebar help area on hover or keyboard focus so an icon-only toolbar does not require guessing. Keep these explanations within the sidebar or message card. Support readable UI scaling and keyboard focus without adding labels to the gameplay world.

Build category contents from the registered room, dwarf, fixture, and spell definitions. A new type supplies its icon and information using the same panel structure; adding content should not require another permanent toolbar or assume a fixed population roster. Display only content appropriate to the campaign and level unlock rules.

## Development debug controls

**Debug → Level preview** opens a read-only whole-level map with fog disabled. Its selector includes the current world and every Campaign/Free Play starting layout from the playable catalog. Red dots show all living enemies, including hidden/dormant inhabitants; hollow amber rings show uncleared encounter source positions, including entrances with no spawned enemies yet. Cyan diamonds locate both Hearthstones. Click the map or select an enemy from the expandable list for position/type details in the preview's left panel. Simulation and camera input pause while open; Escape or × closes it and restores the previous pause behavior. Previewing never discovers gameplay tiles, activates encounters or replaces the current world. The ordinary minimap and full map retain their fog rules.

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

Debug places the three **Before & after** studios first, with **Test harnesses**, current-world actions and shared session settings in separate groups. Additional scenarios have readable names grouped by purpose. Shared configuration and free construction explicitly affect both worlds. Harnesses start paused, replace the previous test world, and retain the stronghold in memory. Gameplay test panels expose Pause/Resume and Return to stronghold; comparison rooms use preview controls and offer Back to comparison from other panels. Returning to the stronghold restores its previous pause state. Restart stronghold is only shown in the ordinary game. Needs setup buttons describe their effect and required rooms.
