# Room concept terrain-style revision prompts

Created with the built-in image generation tool to redo the room and structure concepts in the visual style of the user-approved [terrain image](../terrain/resource-terrain-v2.png). Return to the [room gallery](README.md).

## Review and scope

The earlier sheets used freestanding masonry shells, loose boulder edges, brighter display lighting, and a separate bedrock sample. The revision embeds the rooms in continuous earth and charcoal bedrock, uses the approved terrain's materials and lighting, and keeps room identity visible through floors, wall treatments, and practical furnishings.

The seven growable rooms retain compact, expanded, L-shaped, and bedrock-seam comparisons. Stone Hearth and Bridge keep their four placement examples. The companion terrain-grid study keeps its two comparisons while aligning their heights and materials. No new room, dwarf, production system, fixed capacity, or upgrade is introduced.

The existing sheets and the approved terrain image were inspected before generation. Library was revised first and inspected, then used as a supporting presentation reference for the remaining sheets. Superseded input sheets are preserved in Git history at commit `26bf924`; only selected replacement images are retained in the working concept-art folder.

## Exact prompt construction

The Library request concatenates: the shared prompt, two newlines, its title line, two newlines, its layout block, two newlines, `SUBJECT REQUIREMENTS:` and a newline followed by its subject block, two newlines, and the finishing line. All later requests insert the supporting Library paragraph between the shared prompt and title line, separated by two newlines. The exact text blocks follow.

### Shared prompt

```text
Use case: stylized-concept / style-transfer of an existing room concept.
Image 1 is the user's APPROVED overall terrain image, resource-terrain-v2.png. It is the primary reference for materials, lighting, large square terrain cells, terrain height, small-dwarf scale, and overhead camera.
Image 2 is the existing subject sheet to REDO. Preserve its room function, recognizable floor and wall motifs, furnishing identity, and the requested variations. Rebuild its presentation and terrain geometry to fit Image 1. Do not merely recolor the old sheet.

Produce a polished landscape concept sheet with separate equal-size panel windows. Every panel looks into a real excavation in continuous underground terrain, extending to that panel's image edges. Intact earthy banks surround the excavated floor, with dark charcoal bedrock as connected geological seams. Room wall treatments decorate exposed vertical bank faces; there is no thin freestanding masonry box surrounded by loose boulders, no floating tabletop diorama, and no decorative rock skirt. Use Image 1's dense weathered surface detail, earthy brown rock, contrasting charcoal bedrock, subtle stone joints, warm pools of lantern light, deep but readable shadows, and substantial practical dwarven materials. Preserve clear room-specific floor colors and motifs under this rendering style. Do not make the whole room uniformly brown. Do not copy Image 1's gold veins or gem columns into the rooms.

Geometry is critical: ONE common walkable floor plane, ONE common full intact-terrain height. All intact earth and bedrock tops lie at the same world height, not on multiple terraces. Bank faces drop straight to the floor. No half-height terrain stumps, stepped heights, upper floors, stairs, raised room platforms, or ramps. Turns occur only in the horizontal footprint and follow whole square cells. Bedrock remains visibly distinct from diggable earth. Each floor, terrain footprint, and furniture layout uses the SAME coarse square grid; small decorative paving joints are not extra excavation cells. Show rooms from an elevated overhead angle similar to Image 1, with foreground access passages and composition allowing the room to be seen WITHOUT shortening solid terrain into low walls.

All furniture has consistent practical physical scale and clear usable access. Larger footprints fit more fixtures, not stretched fixtures or taller tiers. Open circulation and entrances are part of the design. Furnishings are arranged automatically according to usable space. Floors and bordering wall treatments identify the room even in unfurnished narrow sections. Include only one or two small dwarf silhouettes across the entire sheet when helpful for scale, and never make them the subject.

The only text permitted is the exact sheet heading and layout captions in exterior margins, specified below. No text, numerals, badges, capacity indicators, health/progress bars, or tooltips in the rendered world. Physical emblems are decoration, not floating labels. Keep the four rooms separate as comparison panels, not different floors in one scene.
```

### Supporting Library paragraph, all requests after Library

```text
Image 3, library-v3.png, is the newly restyled sheet and supplies ONLY the panel framing, excavation presentation, exposure level, full-height surrounding terrain, and rendering consistency. Use this presentation for the requested subject. Do not copy Library blue floor markings, books, shelves, desks, or scholar characters into another room. The requested subject's identity replaces those details. For a two-panel terrain study, use two panels even though this reference has four.
```

### Finishing line

```text
Produce one finished landscape concept sheet. Match the approved terrain reference closely while keeping this subject's functional identity and all requested layout variations readable.
```

## Library

Selected output: [library-v3.png](library-v3.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `library-v2.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/library-v2.png`.

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "LIBRARY".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions, in reading order: "COMPACT", "EXPANDED", "L-SHAPED", "BEDROCK SEAM".
Top left: a small practical square/short-rectangle excavation with only the compact furnishings that fit, an accessible entrance, and enough open floor to show identity.
Top right: a visibly larger and broader excavation with repeated or larger furnishing arrangements and real working aisles.
Bottom left: an unmistakable L-shaped room footprint excavated around a full-height bank continuous with the surrounding earth; its narrow wing remains useful circulation, with furnishings in the wider parts.
Bottom right: an irregular excavated room wrapping a continuous dark bedrock seam that enters from the rear geology and projects into the footprint with coarse right-angle turns. The bedrock is full terrain height, its top at the same height as every surrounding earth bank; no freestanding low block, staircase, or rounded mound. Keep a clear route around the end.
```

### Subject block

```text
Retain blue rune-inlaid stone floor fields with restrained geometric book/script motifs and matching narrow floor borders. Exposed bank faces carry modest carved bands and short timber bookshelves; rough earth or rock remains visible above and between the treatments. Use warm reading lamps, indigo cloth details, dark worn wood, old leather books, and subtle cool inlay. Compact: short wall shelves and one accessible lectern or small reading desk. Expanded: freestanding shelf rows and several research tables, but only where shelves and aisles fit. L-shaped: shelves along suitable faces, research tables in broad sections, clear narrow arm. Bedrock seam: distribute compact research positions on its usable sides, with a readable path around the end. Books and stations stay dwarf-scale and do not fill every tile. One white-bearded Runesmith may be seated at a station. This is spell research, not a temple, shrine, equipment forge, or room with giant magical machinery.
```

## Kitchen

Selected output: [kitchen-v3.png](kitchen-v3.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `kitchen-v2.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/kitchen-v2.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "KITCHEN".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions, in reading order: "COMPACT", "EXPANDED", "L-SHAPED", "BEDROCK SEAM".
Top left: a small practical square/short-rectangle excavation with only the compact furnishings that fit, an accessible entrance, and enough open floor to show identity.
Top right: a visibly larger and broader excavation with repeated or larger furnishing arrangements and real working aisles.
Bottom left: an unmistakable L-shaped room footprint excavated around a full-height bank continuous with the surrounding earth; its narrow wing remains useful circulation, with furnishings in the wider parts.
Bottom right: an irregular excavated room wrapping a continuous dark bedrock seam that enters from the rear geology and projects into the footprint with coarse right-angle turns. The bedrock is full terrain height, its top at the same height as every surrounding earth bank; no freestanding low block, staircase, or rounded mound. Keep a clear route around the end.
```

### Subject block

```text
Retain earthy ochre food-service floor tiles with subtle mushroom and tankard motifs, warm timber trim and cookware on exposed terrain faces. Show one combined place for mushroom growing, cooking, brewing, serving, and eating. Growing beds contain recognizable small mushrooms, not generic vegetable gardens. Furnishings are dark worn timber, modest stone cooking surfaces, copper/iron pots, casks, and sturdy tables with benches. Compact: a small mushroom bed, cooking/serving fitting and a short eating table, with access. Expanded: additional growing beds, accessible serving space, repeated tables and a few casks, all sharing open circulation. The bent and seam-constrained versions fit their furnishings into the available wider areas. Meal items are modest, readable sample stock, not an extravagant banquet covering every surface. No separate brewery, dedicated Cook character, throne, or upgraded room tiers.
```

## Workshop

Selected output: [workshop-v3.png](workshop-v3.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `workshop-v2.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/workshop-v2.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "WORKSHOP".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions, in reading order: "COMPACT", "EXPANDED", "L-SHAPED", "BEDROCK SEAM".
Top left: a small practical square/short-rectangle excavation with only the compact furnishings that fit, an accessible entrance, and enough open floor to show identity.
Top right: a visibly larger and broader excavation with repeated or larger furnishing arrangements and real working aisles.
Bottom left: an unmistakable L-shaped room footprint excavated around a full-height bank continuous with the surrounding earth; its narrow wing remains useful circulation, with furnishings in the wider parts.
Bottom right: an irregular excavated room wrapping a continuous dark bedrock seam that enters from the rear geology and projects into the footprint with coarse right-angle turns. The bedrock is full terrain height, its top at the same height as every surrounding earth bank; no freestanding low block, staircase, or rounded mound. Keep a clear route around the end.
```

### Subject block

```text
Retain fitted dark stone flooring with restrained brass geometric lines and mechanical motifs. Exposed earth/rock bank faces have practical tool boards, modest metal braces, and warm task lamps. Use rough timber workbenches, iron anvils, assembly jigs, hinge fittings, gears, and racks holding recognizable partly completed doors and trap mechanisms. Compact: one workbench and a small anvil with usable working space. Expanded: additional craft positions and larger door/trap assembly tables with clear walkways. L-shaped and seam versions keep assembly work in broad areas and leave narrow links open. One small FEMALE dwarf Engineer with auburn braids, teal workwear, goggles, and a leather apron may work at a bench. No separate Smith, manufactured armor or swords, equipment enchantment, enormous industrial machines, ore processing chain, or additional room types.
```

## Training Room

Selected output: [training-room-v3.png](training-room-v3.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `training-room-v2.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/training-room-v2.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "TRAINING ROOM".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions, in reading order: "COMPACT", "EXPANDED", "L-SHAPED", "BEDROCK SEAM".
Top left: a small practical square/short-rectangle excavation with only the compact furnishings that fit, an accessible entrance, and enough open floor to show identity.
Top right: a visibly larger and broader excavation with repeated or larger furnishing arrangements and real working aisles.
Bottom left: an unmistakable L-shaped room footprint excavated around a full-height bank continuous with the surrounding earth; its narrow wing remains useful circulation, with furnishings in the wider parts.
Bottom right: an irregular excavated room wrapping a continuous dark bedrock seam that enters from the rear geology and projects into the footprint with coarse right-angle turns. The bedrock is full terrain height, its top at the same height as every surrounding earth bank; no freestanding low block, staircase, or rounded mound. Keep a clear route around the end.
```

### Subject block

```text
Retain warm rust-red practice floor areas on substantial stone, marked by restrained pale geometric training emblems and clear exercise lanes. Bank faces carry practice equipment, target boards, and modest banners. Put accessible timber practice dummies, safe target positions, and low weight/exercise stations where their activity space fits. Compact: one or two usable training positions with open practice space. Expanded: several different repeated positions and clear circulation between them. L-shaped: wider sections support activity, narrow connecting arm stays clear. Bedrock seam: practice positions fit around it with no firing direction through a busy walkway. Show a small Miner and a small armored Warrior practicing in one panel to communicate shared use. This is for ALL dwarf types, not Warrior-only barracks. Absolutely no beds, sleeping areas, room upgrades, or direct-unit-control UI.
```

## Treasure Room

Selected output: [treasure-room-v3.png](treasure-room-v3.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `treasure-room-v2.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/treasure-room-v2.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "TREASURE ROOM".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions, in reading order: "COMPACT", "EXPANDED", "L-SHAPED", "BEDROCK SEAM".
Top left: a small practical square/short-rectangle excavation with only the compact furnishings that fit, an accessible entrance, and enough open floor to show identity.
Top right: a visibly larger and broader excavation with repeated or larger furnishing arrangements and real working aisles.
Bottom left: an unmistakable L-shaped room footprint excavated around a full-height bank continuous with the surrounding earth; its narrow wing remains useful circulation, with furnishings in the wider parts.
Bottom right: an irregular excavated room wrapping a continuous dark bedrock seam that enters from the rear geology and projects into the footprint with coarse right-angle turns. The bedrock is full terrain height, its top at the same height as every surrounding earth bank; no freestanding low block, staircase, or rounded mound. Keep a clear route around the end.
```

### Subject block

```text
Retain geometric dark olive/slate vault flooring with restrained gold-colored inlays and embossed coin motifs on the exposed wall facings. Use substantial ironbound chests, low coin-storage bays, some visible gold piles, and clear collection access. Compact: a few accessible storage positions. Expanded: repeated bays with aisles and a broad route for miners delivering gold and residents collecting wages. Mix partially filled and empty storage positions so a larger room does not appear to generate gold automatically. L-shaped and seam layouts place storage only where collection faces remain usable. No gold veins in the room's floor, gem currency piles, mining machinery, throne, or huge cartoon mountain of treasure. Stored gold glints under warm lamps, while floor and wall motifs identify the room even where storage is empty.
```

## Dormitory

Selected output: [dormitory-v3.png](dormitory-v3.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `dormitory-v2.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/dormitory-v2.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "DORMITORY".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions, in reading order: "COMPACT", "EXPANDED", "L-SHAPED", "BEDROCK SEAM".
Top left: a small practical square/short-rectangle excavation with only the compact furnishings that fit, an accessible entrance, and enough open floor to show identity.
Top right: a visibly larger and broader excavation with repeated or larger furnishing arrangements and real working aisles.
Bottom left: an unmistakable L-shaped room footprint excavated around a full-height bank continuous with the surrounding earth; its narrow wing remains useful circulation, with furnishings in the wider parts.
Bottom right: an irregular excavated room wrapping a continuous dark bedrock seam that enters from the rear geology and projects into the footprint with coarse right-angle turns. The bedrock is full terrain height, its top at the same height as every surrounding earth bank; no freestanding low block, staircase, or rounded mound. Keep a clear route around the end.
```

### Subject block

```text
Retain warm stone floors with muted ochre woven-border patterns, timber trim on exposed terrain faces, gentle amber lamps, and simple personal-storage fittings. Use consistent adult dwarf-sized wooden beds with olive blankets and ivory pillows, plus modest lockers or chests where they fit. Compact: only a few accessible beds. Expanded: more of the SAME bed size arranged with practical access and circulation, never oversized or miniaturized beds to pack the room. L-shaped: beds in wide portions with a clear narrow connecting wing. Bedrock seam: beds fitted to accessible strips on either side, without blocking the route around the end. Floor identity must remain clear in open areas. Shared sleeping room for every resident type, not barracks. No weapon-training dummies, giant bunk towers, bunk-bed storeys, special royal bed, upgraded tiers, or text over beds.
```

## Guard Post

Selected output: [guard-post-v3.png](guard-post-v3.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `guard-post-v2.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/guard-post-v2.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "GUARD POST".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions, in reading order: "COMPACT", "EXPANDED", "L-SHAPED", "BEDROCK SEAM".
Top left: a small practical square/short-rectangle excavation with only the compact furnishings that fit, an accessible entrance, and enough open floor to show identity.
Top right: a visibly larger and broader excavation with repeated or larger furnishing arrangements and real working aisles.
Bottom left: an unmistakable L-shaped room footprint excavated around a full-height bank continuous with the surrounding earth; its narrow wing remains useful circulation, with furnishings in the wider parts.
Bottom right: an irregular excavated room wrapping a continuous dark bedrock seam that enters from the rear geology and projects into the footprint with coarse right-angle turns. The bedrock is full terrain height, its top at the same height as every surrounding earth bank; no freestanding low block, staircase, or rounded mound. Keep a clear route around the end.
```

### Subject block

```text
Retain cool slate defensive floor patches with restrained pale shield emblems and dark red border accents; matching modest guard insignia decorate exposed terrain faces. This is open standing and gathering space near a passage, not a fort building. Compact: a clearly designated small guarding area with almost no furnishings, connected to an approach. Expanded: more open guard positions and, only where they fit, a small signal bell and equipment rack along a bordering face. L-shaped: a bent approach with wide standing positions. Bedrock seam: guard floor around the connected full-height seam, preserving a through route. One or two small armored Warriors may stand naturally in accessible space, not snapped to a tile or arranged in rigid formation. No training dummies, beds, castle battlements, watchtowers, new character class, troop control UI, or large piles of weapons.
```

## Stone Hearth

Selected output: [stone-hearth-v2.png](stone-hearth-v2.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `stone-hearth-v1.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/stone-hearth-v1.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "STONE HEARTH".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions in reading order: "STARTING CAVERN", "BROAD CAVERN", "BENT APPROACH", "BEDROCK CHOKEPOINT". Show the same fixed core in each panel: a small starting excavation, a broader open cavern, a room reached by an L-shaped passage, and a protected pocket shaped by a continuous charcoal bedrock seam. Every occupied terrain bank is full height and the same height. Vary only the surrounding excavation and approach, never the core.
```

### Subject block

```text
Preserve the exact modest cyan crystal in its low round carved-stone cradle, with a ground-level circular rune surround, from Image 2. The base may have small structural stone courses but is not a walkable terrace. Identical core footprint, height, crystal count, proportions, and appearance in all four panels; no progression or upgrade. Surrounding earth is brown, connected bedrock is dark charcoal, just as in Image 1. Include accessible floor around the core and simple warm lamps, not an elaborate constructed throne room. No leader, throne, temple, additional power machinery, huge crystal tree, upgraded base, enclosing freestanding masonry box, or resource gem columns. Small miners can provide scale without crowding the core.
```

## Bridge

Selected output: [bridge-v2.png](bridge-v2.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `bridge-v1.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/bridge-v1.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "BRIDGE".
```

### Layout block

```text
Use a 2 by 2 panel sheet. Exterior captions in reading order: "NARROW CROSSING", "WIDE CROSSING", "BENT CROSSING", "SPLIT CHANNEL". Show connected square deck cells over water in four practical configurations: a short narrow crossing, a broader crossing, an L-shaped deck, and a route negotiating a split water channel. Each view includes believable dry approaches carved through the surrounding banks. All dry floor and bridge decks are flush on the same world plane.
```

### Subject block

```text
Preserve the practical low stone bridge construction of Image 2, but render it within Image 1's dense weathered earth and contrasting connected dark bedrock. Bridges have repeating deck modules, restrained edges and supports, with no arch rising above the walking surface and no stairs onto the deck. Water is cool deep teal, non-walkable and slightly below floor level; no lower accessible dry level. All intact terrain banks above the dry floor share one common height, and shoreline footprints obey the same coarse square grid. Use modest edge safety stones only as bridge fixtures, not terraced natural terrain. Lighting is warm on dry approaches and cool reflected on water. No lava examples, because lava crossing rules remain open. No buildings, resource columns, huge arches, hanging bridges, waterfall, vertical cavern, or freestanding rock-rim display platform.
```

## Terrain on the Grid

Selected output: [terrain-grid-v3.png](terrain-grid-v3.png).

References, in order:

1. [Approved terrain style](../terrain/resource-terrain-v2.png).
2. `terrain-grid-v2.png`: previous subject sheet, available in Git history at `26bf924:concept-art/rooms/terrain-grid-v2.png`.
3. [Revised Library presentation](library-v3.png).

### Title line

```text
SHEET TITLE IN EXTERIOR MARGIN: "TERRAIN ON THE GRID".
```

### Layout block

```text
Use TWO equally sized side-by-side panel windows, not four. Exterior captions: "BEDROCK SEAM" on the left and "UNMINED EARTH" on the right. Use the same overhead angle, cell size, floor height and intact terrain height in both views.
```

### Subject block

```text
This companion terrain study must show Image 1's natural terrain, not artificial masonry test rooms. Left: one continuous charcoal bedrock band connected to the broad surrounding geology, projecting into the excavated floor with right-angle turns on whole square cells. Right: ordinary brown intact earth surrounds the excavation, with one retained single square earth cell and one retained small square group separated by accessible open floor. ALL retained earth cells rise to the SAME full intact terrain height as the surrounding banks and the left bedrock seam; they cannot be half-height stumps. Put no building walls around the samples. The common bare excavated floor has a readable coarse grid through its textures; occupied terrain has no floor on top and no furniture underneath. One small Miner in each view gives consistent scale. No room furnishings, gold deposits, gem columns, terrain-height numbers, arrows, stacked layers, captions inside the world, or low terrain blocks.
```


## Review corrections after the first style pass

The first style pass established the shared materials and excavation presentation. Library, Kitchen, Workshop, Training Room, and Dormitory then received a local correction requesting a clearly L-shaped bottom-left footprint. The Dormitory result retained an additional passage, so its final caption was changed to "IRREGULAR" to describe the selected layout accurately. The current Guard Post supplied only that floor-outline reference. The terrain-grid study received a correction to the full-height retained earth examples.

The first Library style render was used as the supporting reference for the other initial sheets before its local footprint correction. Intermediate renders are not retained in the working gallery. This table identifies the exact tool render used for each corrective edit; the final outputs use the filenames recorded above.

| Corrected subject | Edit target tool-render filename | Final project image |
|---|---|---|
| Library | `exec-378444b9-127e-487a-a920-f285c891fdd8.png` | [library-v3.png](library-v3.png) |
| Kitchen | `exec-509b8ecb-2729-4ef4-8f69-297281eca68c.png` | [kitchen-v3.png](kitchen-v3.png) |
| Workshop | `exec-c5de509b-b4f8-4882-9fce-46bf69ec74d0.png` | [workshop-v3.png](workshop-v3.png) |
| Training Room | `exec-0292a6a7-f469-4c02-bbc8-a59c7f710212.png` | [training-room-v3.png](training-room-v3.png) |
| Dormitory | `exec-f61b08d1-0566-4835-a181-1f4296cd19a0.png` | [dormitory-v3.png](dormitory-v3.png) |
| Terrain on the Grid | `exec-21f6f61d-1960-408e-832f-da6b51421ce6.png` | [terrain-grid-v3.png](terrain-grid-v3.png) |

### L-shaped footprint correction template

Five requests use the exact template below, replacing `SUBJECT_NAME` with, respectively, `Library`, `Kitchen`, `Workshop`, `Training Room`, and `Dormitory`. Image 1 is the corresponding edit target listed in the table. Image 2 is [guard-post-v3.png](guard-post-v3.png). All targets had been visually inspected before editing.

```text
Use case: precise-object-edit.
Image 1 is the SUBJECT_NAME sheet to correct. Image 2 is the new Guard Post sheet, used ONLY for its bottom-left panel's unmistakable L-shaped floor footprint. Do not copy its shields, gray floor, guard characters, or title.

Change ONLY the BOTTOM-LEFT panel of Image 1, labelled "L-SHAPED". Leave the title, other three panels, their terrain, furniture, lighting, and captions untouched.

Rebuild the bottom-left usable floor as a clear L, matching the FLOOR OUTLINE of Image 2's bottom-left panel: a broad rear horizontal arm connected to a left vertical arm, with ONE rectangular full-height mass of intact earth filling the lower-right missing corner. In overhead plan it is one rectangle with a corner rectangle removed. It is not a U, T, or a rectangle with an internal partition. Keep the existing grid orientation and camera. The unexcavated corner joins the surrounding terrain and has the same full terrain top height as every intact bank. Remove any low freestanding internal divider wall or thin stray floor lane. Keep all usable floor at one common height.

Keep this subject's own distinctive floor pattern and color, wall treatments, materials, and functional furnishings. Fit a modest number of its existing furnishings into the two arms with clear access; remove or relocate only those that conflict with the corrected footprint. Place the entrance at the open end of the left leg, connected to an ordinary excavated approach at floor level. Any dwarf must stand on usable floor, never atop unmined terrain. Keep all intact terrain banks full height, all turns on whole square cells, and no ramps or terrace steps.

Preserve the overall dense earthy stylized 3D rendering, dark bedrock, warm lamp light, image size, panel framing, heading and the caption "L-SHAPED". No added labels or gameplay UI. This is a local footprint correction only.
```

### Terrain-grid correction prompt

The single input is the terrain-grid edit target listed above, inspected before editing.

```text
Use case: precise-object-edit.
Edit the provided TERRAIN ON THE GRID sheet. Preserve the two panels, camera, composition, labels, dark connected bedrock on the left, ordinary brown earth on the right, warm lamps, grid orientation, and rendering style.

Correct the RIGHT panel's two isolated brown terrain remnants. They are currently too low. Both must rise to exactly the SAME full world-space terrain top height as the surrounding intact brown banks. The small remnant is one whole coarse square excavation cell; the larger remnant is a two-by-two group of those SAME cells. Keep their existing relative locations and clear open routes around them, but give them full-height vertical faces all the way from the floor to that common top plane. They are not low furniture, platforms, half-mined stumps, or stepped heaps. A dwarf standing beside either remnant should be substantially shorter than its full terrain face. In perspective the rear remnant's top and the foreground remnant's top project differently; their world height is identical.

The LEFT bedrock seam must also share the single full intact-terrain height from end to end. Any turns in it change only its horizontal footprint, with no downward terrace steps. It remains connected to the surrounding bank.

Keep a single common excavated floor under both studies. Refine the visible coarse grid only if needed so the single earth remnant's base fits one square and the group fits two-by-two squares; natural tiny stone joints are surface detail, not extra selectable cells. Do not put any miner on top of unmined ground: place each on clear excavated floor at the entrance to its example. No surrounding artificial test-room walls, extra terrain levels, height annotations, arrows, or UI. Leave all other styling and labels unchanged.
```

### Final Dormitory caption correction

The single reference was the inspected Dormitory footprint-edit result, `exec-2e37fc6a-906e-4e32-8924-d565fa77fa8d.png`. The selected irregular layout was retained, and its caption was corrected. The saved output remains [dormitory-v3.png](dormitory-v3.png).

```text
Make exactly one text-only correction to this existing Dormitory concept sheet. Preserve the entire illustration, all terrain, beds, lighting, borders, camera angles and the other headings with no redesign. Replace the bottom-left panel caption 'L-SHAPED' with 'IRREGULAR' in the same ivory serif font, size, alignment and location. That footprint is intentionally an irregular bent layout, and the caption should describe it accurately. Do not change any image content beyond this caption.
```
