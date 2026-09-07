# Level and region concept prompts

Generated with the built-in image generation tool. These are new environment concepts using the approved terrain image as a reference, rather than edits to that saved image. Return to the [gallery](README.md).

## Scope and references

The set covers the five candidate strongholds in [Levels](../../levels.md), plus Fungal Caves and Volcanic Depths regional studies. Upper workings appear in Border Foothold, ancient halls in Fallen City, and crystal caverns in Crystal Divide. Flooded Workings shows water-constrained mining; Royal Deep combines several regional approaches. These are representative explored areas, not complete map designs or a finalized campaign order.

1. [Approved terrain reference](../terrain/resource-terrain-v2.png): primary reference for every image; controls terrain appearance, grid scale, camera, materials, and single-layer excavation.
2. [Stone Hearth](../rooms/stone-hearth-v1.png): object reference for the five candidate strongholds only; does not override the primary terrain reference.
3. [Bridge](../rooms/bridge-v1.png): supporting object reference for Flooded Workings only.

The references were inspected before generation. The five stronghold requests use references 1 and 2 in that order; Flooded Workings also uses reference 3. The two region studies use reference 1 only.

## Exact prompt construction

Each request concatenates the shared prompt, two newlines, the optional Stone Hearth reference paragraph followed by two newlines, its scene block, two newlines, and the finishing line. The Stone Hearth paragraph is included only for the five candidate strongholds. Scene blocks and source roles below preserve the submitted wording.

### Shared prompt

```text
Use case: stylized-concept.
Asset type: one landscape environment concept for a dwarf stronghold management game.
Create a NEW representative explored area, using Image 1 (resource-terrain-v2.png) as the PRIMARY and strongly controlling visual reference. Match its substantial square terrain cells, dense earth and dark bedrock materials, metallic gold visible on top and exposed wall faces, richly modeled but restrained stylized 3D rendering, scale of the small dwarfs, warm lantern light, and elevated overhead camera. Use a similar camera tilt, zoomed out slightly to show a wider connected layout. Produce a single cohesive scene, not a contact sheet, diagram, cutout miniature, or multiple panels.

NON-NEGOTIABLE TERRAIN: one excavation layer, one common walkable floor plane. All intact diggable earth, gold-bearing rock, and bedrock banks have the SAME full height above that floor. Occupied terrain tops form one common plane in world space. The grid is coarse and square: all terrain occupancy and exposed boundaries follow the same grid, with right-angle steps only in the HORIZONTAL footprint. No terraced rock heights, half-height earth stumps, stacked floors, staircases, ramps, balconies, raised walkable ledges, or vertical mine shafts. A resource column is a resource object, not another floor. Bedrock forms connected seams/bands extending into surrounding geology, never piles of rounded rocks scattered on finished floors. Small surface texture must not look like additional excavation cells. All walking paths remain on the same plane and have usable width for continuous character movement. Any water or lava is non-walkable hazard occupying grid cells below the common floor, with no lower accessible floor.

Show a broad useful terrain area with solid unexcavated ground between passages and rooms. The terrain continues toward dark image edges; avoid a floating tabletop island or a decorative rock rim. Small miners in ochre clothing and helmet lamps provide scale, as in Image 1. Reveal only an already explored connected area: unseen continuation fades into darkness rather than exposing sealed chambers through walls. Use no UI, text, title, letters, numbers, bars, badges, labels, arrows, or excavation highlights. Lighting, materials, topology, and physical props carry the information. Do not copy Image 1's title.
```

### Optional Stone Hearth reference paragraph

```text
Image 2 (stone-hearth-v1.png) is ONLY an object design reference: use the same modest cyan crystal in its low circular carved stone cradle, with a simple ground-level runic surround. Include exactly one in the established foothold. Keep its fixed modest size; do not enlarge it into a castle, throne, tiered temple, or upgrade. Do not copy the reference sheet's multiple panels, text, terrace-like perimeter stones, or different camera layouts. The terrain geometry and rendering of Image 1 take priority.
```

### Finishing line

```text
Output one finished landscape concept, matching the primary reference's visual quality and coherent grid geometry.
```

## Border Foothold

Scope: Candidate stronghold. Output: [border-foothold-v1.png](border-foothold-v1.png).

References, in order: [`resource-terrain-v2.png`](../terrain/resource-terrain-v2.png); [`stone-hearth-v1.png`](../rooms/stone-hearth-v1.png).

### Scene block

```text
SCENE — BORDER FOOTHOLD:
Show an intimate early foothold in the UPPER WORKINGS. A small warm occupied cavern connects through one defensible, dog-legged approach to a broader abandoned mining chamber. Amber-brown diggable banks contain a nearby readable gold seam. A continuous charcoal bedrock band limits one edge of expansion. A partly buried old guard chamber is reached by a fresh, fully excavated breach. The foothold contains the small Hearthstone, a compact area with a few beds, a little food-growing/serving corner, and accessible gold storage; make these believable small functional spaces rather than an entire developed city. A timber-and-metal door spans the narrow entrance at floor level. A crude abandoned goblin camp deeper along the explored passage suggests the first local challenge. Favor understandable short routes and useful intact earth left to excavate. A few small working miners, no large battle. The feeling is warm, practical, vulnerable, and promising.
```

## Flooded Workings

Scope: Candidate stronghold. Output: [flooded-workings-v1.png](flooded-workings-v1.png).

References, in order: [`resource-terrain-v2.png`](../terrain/resource-terrain-v2.png); [`stone-hearth-v1.png`](../rooms/stone-hearth-v1.png); [`bridge-v1.png`](../rooms/bridge-v1.png).

### Scene block

```text
SCENE — FLOODED WORKINGS:
Show FLOODED WORKINGS: several dry former mining chambers separated by cool dark-teal water channels and connected bedrock bands. Broad right-angled channel bends follow the square terrain footprint. All dry chambers and bridge decks are at exactly the same walkable height; no waterfalls, hanging bridges, tiered banks, or lower dry rooms. An intact earth bank with a gold seam divides two chambers, and abandoned timber mining supports and a few old mining props identify the former workings. Place the small Hearthstone in a secure dry foothold, with modest storage close to one mine. One short square-grid stone bridge connects two dry banks while another passage takes a longer route around bedrock, making construction space and hauling distances legible. Image 3 (bridge-v1.png) is ONLY a supporting reference for a low, flush stone deck with modest edges. Do not copy its panels or labels. Water is a hazard and a routing problem, not a second playable floor. Wet exposed rock faces, restrained reflected lanterns, and sparse mineral glints; some warm dry spaces contrast with the cool channels. A few small miners travel the accessible routes.
```

## Fallen City

Scope: Candidate stronghold. Output: [fallen-city-v1.png](fallen-city-v1.png).

References, in order: [`resource-terrain-v2.png`](../terrain/resource-terrain-v2.png); [`stone-hearth-v1.png`](../rooms/stone-hearth-v1.png).

### Scene block

```text
SCENE — FALLEN CITY:
Show the FALLEN CITY in the ANCIENT HALLS region: an explored portion of a buried dwarven district, with intersecting square-grid streets, broad formerly occupied halls, and collapsed connections still filled by full-height diggable earth. Old carved dwarven stone facings are embedded into the exposed terrain walls, all capped at the same intact terrain top plane. There are no intact roofs, multi-storey buildings, raised plazas, upper walkways, or staircases. Full-height dark bedrock seams and ordinary gold-bearing earth interrupt the masonry, clearly showing how excavation reconnects lost streets. Place the modest Hearthstone in one reclaimed hall at the edge of the district, with a few usable furnishings and warm lights. Three reachable street approaches meet near this foothold, offering defensive choices. Two inert stone guardian figures and corroded shield remnants stand within the explored ruins as signs of the occupation; keep the environment dominant. Use restrained faded indigo/ivory stone inlays, carved doorframes, scattered floor-level rubble that does not obscure routes, and cooler unoccupied hall lighting. This is the same terrain system as Image 1 with ancient architecture embedded in it, not a surface city or vast cathedral.
```

## Crystal Divide

Scope: Candidate stronghold. Output: [crystal-divide-v1.png](crystal-divide-v1.png).

References, in order: [`resource-terrain-v2.png`](../terrain/resource-terrain-v2.png); [`stone-hearth-v1.png`](../rooms/stone-hearth-v1.png).

### Scene block

```text
SCENE — CRYSTAL DIVIDE:
Show CRYSTAL DIVIDE in the CRYSTAL CAVERNS region. Preserve the exact approved kind of persistent resource: square dark-rock columns with embedded purple, cyan, and blue gems, like those in Image 1. Place a small group of these separated by several tiles in a remote explored mining pocket, with free working access around their bases. Connected full-height charcoal bedrock seams divide the area into two caverns joined by a narrow winding grid-aligned passage, with an optional longer corridor around the seam. Some ordinary diggable brown ground and a restrained gold vein remain visible so the biome does not replace all terrain with crystal. The small Hearthstone and a modest warm treasury foothold occupy the safer cavern; miners work in the farther gem pocket, visibly distant from storage. Keep Hearthstone cyan crystal on a carved circular cradle visually distinct from the dark square renewable gem columns. Low cool reflected mineral light contrasts with warm lamps; avoid giant crystal forests, crystals covering every floor cell, glowing fog that hides tile edges, or crystal pillars mistaken for additional elevations. Convey valuable remote work positions and a defendable access corridor.
```

## Royal Deep

Scope: Candidate stronghold. Output: [royal-deep-v1.png](royal-deep-v1.png).

References, in order: [`resource-terrain-v2.png`](../terrain/resource-terrain-v2.png); [`stone-hearth-v1.png`](../rooms/stone-hearth-v1.png).

### Scene block

```text
SCENE — ROYAL DEEP:
Show ROYAL DEEP, a broader late-campaign reclamation area where several underground regions meet. It is still one flat playable layer and one full intact-terrain height. A central ancient dwarven junction with carved wall facings connects a warm occupied stronghold pocket to three distinct exposed approaches: an old masonry hall, a cool gem-bearing side cavern, and a dark passage with restrained reddish volcanic light farther away. Make those regions part of one continuous terrain layout, not separate panels or stacked platforms. Broad connected bedrock bands funnel the approaches and leave limited safe expansion near the small fixed Hearthstone. Include modest physically furnished patches of shared accommodation, food provision, and a working craft area along the safe side, with doors and recognizable defensive positions at two choke points. Only the existing core's modest cyan crystal and circular cradle: NO throne room, leader, royal throne, enlarged core, or upgraded temple. The sense of scale comes from longer branching routes and extensive ruins, not taller floors. A nearby vein of ordinary gold and one remote square gem column reinforce the continuing economy. Small dwarfs and restrained signs of distant hostile occupation convey pressure without turning this into a combat illustration.
```

## Fungal Caves

Scope: Terrain region study. Output: [fungal-caves-v1.png](fungal-caves-v1.png).

References, in order: [`resource-terrain-v2.png`](../terrain/resource-terrain-v2.png).

### Scene block

```text
SCENE — FUNGAL CAVES:
Show FUNGAL CAVES as a terrain region study, a newly explored natural cavern and two winding alternative passages in the same excavation system as Image 1. Brown-grey damp diggable earth banks, full-height continuous dark bedrock seams, and one modest readable gold seam must still be distinguishable. The cave footprint steps along the coarse square grid; it does not become a rounded landscape without selectable cells. Damp earthy floors support groups of readable broad mushroom caps and smaller fungal growths along walls and in nonessential corners, with sparse teal bioluminescence and warm miner lamps. Mushrooms are environmental props, not another kind of terrain block or a food-production room. Give a few mushrooms dwarf-height silhouettes, but preserve broad clear floor lanes and do not blanket the map in dense foliage. Fine spider webbing at an already exposed side passage and a fungal nest patch suggest regional inhabitants without a close-up monster subject. Keep tops of geological banks at the common terrain height and all explored walking space at one floor height. Three small miners stand just beyond a fresh breach, with a visible choice between two reachable paths. Do not include a Hearthstone or developed rooms in this region study.
```

## Volcanic Depths

Scope: Terrain region study. Output: [volcanic-depths-v1.png](volcanic-depths-v1.png).

References, in order: [`resource-terrain-v2.png`](../terrain/resource-terrain-v2.png).

### Scene block

```text
SCENE — VOLCANIC DEPTHS:
Show VOLCANIC DEPTHS as a terrain region study: soot-dark diggable rock with exposed gold veins, connected nearly black indestructible bedrock seams, and narrow orange lava channels occupying square-grid hazard cells between flat dry routes. All walkable ground is on the same common plane, and every intact solid terrain bank has the same top height. NO volcano cone, mountain landscape, basalt stair terraces, waterfalls of lava, raised walkable islands, or deep multi-level quarry. Lava lies slightly below the floor edge as a non-walkable hazard, never as an accessible lower level. Use rectilinear shoreline steps with natural crust and small fissure detail confined to the material. A safe dry route makes a long bend around a connected bedrock tongue to reach valuable gold and a dark square purple/cyan gem deposit beyond the hazard. Show no bridge over lava because the crossing rules are not established. Keep clear wall-top and floor grid readability under restrained ember light, dark basalt, occasional steam, and small warm miner lamps. Two or three small miners survey the approach from a safe accessible pocket; a distant massive claw mark and scorched nesting corner suggest deep predators without crowding the image with monsters. No core or settlement rooms in this regional study.
```


## Volcanic Depths terrain correction

The initial regional render introduced stepped bedrock and a tall background cliff. The correction uses that initial render as Image 1 and the [approved terrain reference](../terrain/resource-terrain-v2.png) as Image 2. The intermediate render is not included in the project gallery or saved as a project draft. The selected correction is saved as [volcanic-depths-v1.png](volcanic-depths-v1.png).

### Exact correction prompt

```text
Use case: precise-object-edit.
Image 1 is the Volcanic Depths concept to correct. Image 2 is the user's approved gold-and-gem terrain HEIGHT and MATERIAL reference only.
Correct the terrain elevation in Image 1 while keeping its camera, framing, warm orange lava, dark stone palette, gold treatment, gem column, miners, and broad layout recognizable.

There is one flat walkable floor and one full intact-terrain height. Use the large full-height gold-bearing bank behind the gem column in the upper center of Image 1 as the common solid-terrain height. All intact ordinary earth, gold-bearing ground, and bedrock occupy this same top plane in world space. Perspective must remain correct.

Remove the tall cavern cliff with giant claw scratches across the upper-left background. Replace it with continuous intact terrain whose top surface is at the common bank height, continuing naturally toward the dark image edge. At the left/back bedrock tongue, eliminate the cascading height steps: consolidate its occupied cells into one full-height connected bank with a level top. The bank can turn in right-angle steps in its horizontal FOOTPRINT, but cannot step down vertically. Do not introduce stairways or height terraces at any border.

Remove the small half-height gold/earth stump in the middle-right around x74%, y52%, making its footprint flush ordinary walkable floor. Any other low ordinary terrain blocks must either be consolidated into the common full-height adjoining bank or be removed to the common floor. Keep the foreground and central full-height banks at that same common top height; do not turn them into raised walkable islands. Preserve large square tile footprints.

Keep the lava as non-walkable hazard slightly below the common floor. Its cell-aligned banks should drop directly to the lava surface, with only subtle natural crust at the edge, not extra shelves or retaining-wall terraces. No bridge, lava waterfall, vertical shaft, or lower playable floor. Retain a dry, floor-level detour around the upstream end of the lava where space permits; a passage around the channel end is ordinary unexcavated ground removed to floor, never a crossing over lava.

Do not redesign the purple/cyan square gem column, the three dwarfs, or gold veins. Keep all surviving dry routes on one level. Preserve the approved dense stylized 3D rendering and overhead view. No text, UI, numbers, titles, or new subjects. One corrected landscape image.
```
