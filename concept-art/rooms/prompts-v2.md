# Grid terrain correction prompts

Reference history: room and terrain-study images marked superseded below are available in Git history at `26bf924`. The original prompt text and source filenames remain unchanged; the current sheets are in the [room gallery](../rooms/README.md).

Cleanup note: superseded concept images and drafts have been removed from the project. This document retains the original prompt wording and source filenames as generation history; references marked removed are not available image files. See the [current gallery](README.md) for the retained concepts.

Created with the built-in image generation tool to reflect the user's correction: bedrock generally continues as a seam through the level, all terrain occupies the square grid, and isolated squares of unmined earth can remain inside rooms.

The [current gallery](README.md) now uses the [terrain-style revisions](prompts-v3.md). This document records the preceding grid corrections. The original room sheets have been removed; their [prompts](prompts.md) remain as generation history. Image edits target the fourth room panel; the other layout examples and each room's identity are preserved as visual references.

## Library v2

Selected output: `library-v2.png` (superseded).

Inputs: `library-v1.png` (removed).

```text
Use case: stylized-concept.
Asset type: corrected room layout concept sheet for a grid-based dwarf underground stronghold game.
Primary request: edit the supplied four-panel room sheet to correct ONLY the bottom-right terrain/layout study and its label. Preserve the title, the other three panels, their labels, room materials, furniture style, camera, tile scale, sheet composition and lighting.
Replace the bottom-right label "AROUND BEDROCK" with exactly "BEDROCK SEAM".
Remove the entire isolated central mound/boulder heap from the bottom-right panel. Replace it with a continuous band of solid bedrock that visibly joins the surrounding unexcavated terrain beyond the rear edge of the room. The seam must continue sideways through that rear terrain and beyond the depicted room, with a short stepped tongue projecting into the excavated space. It is a geological seam shaping the excavation, NOT a freestanding pile on the room floor.
Critical geometry: the bedrock's occupied footprint is composed of WHOLE square terrain tiles on the SAME grid as the room floor. Every exposed floor/rock boundary is a straight grid-edge segment with right-angle corners; changes in direction make clear one-tile or two-tile steps. Use a substantial two-tile-wide connected rock band with a rectangular stepped end projecting into the room. Its exposed sides rise vertically from those exact tile edges to approximately surrounding wall height. The top is broadly level at the terrain cutaway height; slight cracks and strata texture are fine. Do not taper the rock into a mountain, scatter boulders across neighboring tiles, round the blocking footprint, draw diagonals across tile squares, or place floor tiles beneath occupied rock.
Material: cool charcoal-blue dense bedrock with broad horizontal strata and restrained seams, visually distinct from warm brown excavatable earth and crafted masonry. It should be a continuous rock body, not manufactured brickwork and not a stack of little voxel cubes.
Adapt ONLY the bottom-right room's floor and furnishings to the new rectilinear rock boundary. Preserve that room's recognizable floor color, motif and wall treatments. The open floor wraps the protruding end with at least one clear route connecting the usable wings; it cannot form a complete ring behind the rock because the seam remains attached to the outside geology. Put functional furniture only on exposed usable floor, with clear approaches, and show a clear entrance. Keep some unfurnished grid tiles visible next to the rock to make exact edge alignment obvious.
No isolated central rock island, decorative rocky peak, round boulder, floating object, new dwarf type, room upgrade, or changed mechanics. Keep the same stylized 3D look and all unaffected content. Produce one corrected four-panel sheet.
```

## Kitchen v2

Selected output: `kitchen-v2.png` (superseded).

Inputs: `kitchen-v1.png` (removed); `library-v2.png` (superseded).

```text
Use case: stylized-concept.
Asset type: corrected room layout concept sheet for a grid-based dwarf underground stronghold game.
Primary request: edit the supplied four-panel room sheet to correct ONLY the bottom-right terrain/layout study and its label. Preserve the title, the other three panels, their labels, room materials, furniture style, camera, tile scale, sheet composition and lighting.
Replace the bottom-right label "AROUND BEDROCK" with exactly "BEDROCK SEAM".
Remove the entire isolated central mound/boulder heap from the bottom-right panel. Replace it with a continuous band of solid bedrock that visibly joins the surrounding unexcavated terrain beyond the rear edge of the room. The seam must continue sideways through that rear terrain and beyond the depicted room, with a short stepped tongue projecting into the excavated space. It is a geological seam shaping the excavation, NOT a freestanding pile on the room floor.
Critical geometry: the bedrock's occupied footprint is composed of WHOLE square terrain tiles on the SAME grid as the room floor. Every exposed floor/rock boundary is a straight grid-edge segment with right-angle corners; changes in direction make clear one-tile or two-tile steps. Use a substantial two-tile-wide connected rock band with a rectangular stepped end projecting into the room. Its exposed sides rise vertically from those exact tile edges to approximately surrounding wall height. The top is broadly level at the terrain cutaway height; slight cracks and strata texture are fine. Do not taper the rock into a mountain, scatter boulders across neighboring tiles, round the blocking footprint, draw diagonals across tile squares, or place floor tiles beneath occupied rock.
Material: cool charcoal-blue dense bedrock with broad horizontal strata and restrained seams, visually distinct from warm brown excavatable earth and crafted masonry. It should be a continuous rock body, not manufactured brickwork and not a stack of little voxel cubes.
Adapt ONLY the bottom-right room's floor and furnishings to the new rectilinear rock boundary. Preserve that room's recognizable floor color, motif and wall treatments. The open floor wraps the protruding end with at least one clear route connecting the usable wings; it cannot form a complete ring behind the rock because the seam remains attached to the outside geology. Put functional furniture only on exposed usable floor, with clear approaches, and show a clear entrance. Keep some unfurnished grid tiles visible next to the rock to make exact edge alignment obvious.
No isolated central rock island, decorative rocky peak, round boulder, floating object, new dwarf type, room upgrade, or changed mechanics. Keep the same stylized 3D look and all unaffected content. Produce one corrected four-panel sheet.
Input roles: Image 1 is the kitchen sheet to edit. Image 2 is the corrected Library sheet, a supporting reference ONLY for its bottom-right grid-aligned, connected bedrock seam and the unchanged four-panel format. Preserve the target room's own floor design, colors, fittings and function; do not copy Library desks, books or blue floor.
For the corrected rock, preserve the whole-cell rectilinear geometry demonstrated by the Library reference, but use continuous natural strata rather than a field of manufactured paving slabs. The seam is one solid geological body that continues through the surrounding terrain. Keep any surface irregularity small enough that the stepped, whole-square blocking footprint remains obvious.
```

## Workshop v2

Selected output: `workshop-v2.png` (superseded).

Inputs: `workshop-v1.png` (removed); `library-v2.png` (superseded).

```text
Use case: stylized-concept.
Asset type: corrected room layout concept sheet for a grid-based dwarf underground stronghold game.
Primary request: edit the supplied four-panel room sheet to correct ONLY the bottom-right terrain/layout study and its label. Preserve the title, the other three panels, their labels, room materials, furniture style, camera, tile scale, sheet composition and lighting.
Replace the bottom-right label "AROUND BEDROCK" with exactly "BEDROCK SEAM".
Remove the entire isolated central mound/boulder heap from the bottom-right panel. Replace it with a continuous band of solid bedrock that visibly joins the surrounding unexcavated terrain beyond the rear edge of the room. The seam must continue sideways through that rear terrain and beyond the depicted room, with a short stepped tongue projecting into the excavated space. It is a geological seam shaping the excavation, NOT a freestanding pile on the room floor.
Critical geometry: the bedrock's occupied footprint is composed of WHOLE square terrain tiles on the SAME grid as the room floor. Every exposed floor/rock boundary is a straight grid-edge segment with right-angle corners; changes in direction make clear one-tile or two-tile steps. Use a substantial two-tile-wide connected rock band with a rectangular stepped end projecting into the room. Its exposed sides rise vertically from those exact tile edges to approximately surrounding wall height. The top is broadly level at the terrain cutaway height; slight cracks and strata texture are fine. Do not taper the rock into a mountain, scatter boulders across neighboring tiles, round the blocking footprint, draw diagonals across tile squares, or place floor tiles beneath occupied rock.
Material: cool charcoal-blue dense bedrock with broad horizontal strata and restrained seams, visually distinct from warm brown excavatable earth and crafted masonry. It should be a continuous rock body, not manufactured brickwork and not a stack of little voxel cubes.
Adapt ONLY the bottom-right room's floor and furnishings to the new rectilinear rock boundary. Preserve that room's recognizable floor color, motif and wall treatments. The open floor wraps the protruding end with at least one clear route connecting the usable wings; it cannot form a complete ring behind the rock because the seam remains attached to the outside geology. Put functional furniture only on exposed usable floor, with clear approaches, and show a clear entrance. Keep some unfurnished grid tiles visible next to the rock to make exact edge alignment obvious.
No isolated central rock island, decorative rocky peak, round boulder, floating object, new dwarf type, room upgrade, or changed mechanics. Keep the same stylized 3D look and all unaffected content. Produce one corrected four-panel sheet.
Input roles: Image 1 is the workshop sheet to edit. Image 2 is the corrected Library sheet, a supporting reference ONLY for its bottom-right grid-aligned, connected bedrock seam and the unchanged four-panel format. Preserve the target room's own floor design, colors, fittings and function; do not copy Library desks, books or blue floor.
For the corrected rock, preserve the whole-cell rectilinear geometry demonstrated by the Library reference, but use continuous natural strata rather than a field of manufactured paving slabs. The seam is one solid geological body that continues through the surrounding terrain. Keep any surface irregularity small enough that the stepped, whole-square blocking footprint remains obvious.
```

## Training Room v2

Selected output: `training-room-v2.png` (superseded).

Inputs: `training-room-v1.png` (removed); `library-v2.png` (superseded).

```text
Use case: stylized-concept.
Asset type: corrected room layout concept sheet for a grid-based dwarf underground stronghold game.
Primary request: edit the supplied four-panel room sheet to correct ONLY the bottom-right terrain/layout study and its label. Preserve the title, the other three panels, their labels, room materials, furniture style, camera, tile scale, sheet composition and lighting.
Replace the bottom-right label "AROUND BEDROCK" with exactly "BEDROCK SEAM".
Remove the entire isolated central mound/boulder heap from the bottom-right panel. Replace it with a continuous band of solid bedrock that visibly joins the surrounding unexcavated terrain beyond the rear edge of the room. The seam must continue sideways through that rear terrain and beyond the depicted room, with a short stepped tongue projecting into the excavated space. It is a geological seam shaping the excavation, NOT a freestanding pile on the room floor.
Critical geometry: the bedrock's occupied footprint is composed of WHOLE square terrain tiles on the SAME grid as the room floor. Every exposed floor/rock boundary is a straight grid-edge segment with right-angle corners; changes in direction make clear one-tile or two-tile steps. Use a substantial two-tile-wide connected rock band with a rectangular stepped end projecting into the room. Its exposed sides rise vertically from those exact tile edges to approximately surrounding wall height. The top is broadly level at the terrain cutaway height; slight cracks and strata texture are fine. Do not taper the rock into a mountain, scatter boulders across neighboring tiles, round the blocking footprint, draw diagonals across tile squares, or place floor tiles beneath occupied rock.
Material: cool charcoal-blue dense bedrock with broad horizontal strata and restrained seams, visually distinct from warm brown excavatable earth and crafted masonry. It should be a continuous rock body, not manufactured brickwork and not a stack of little voxel cubes.
Adapt ONLY the bottom-right room's floor and furnishings to the new rectilinear rock boundary. Preserve that room's recognizable floor color, motif and wall treatments. The open floor wraps the protruding end with at least one clear route connecting the usable wings; it cannot form a complete ring behind the rock because the seam remains attached to the outside geology. Put functional furniture only on exposed usable floor, with clear approaches, and show a clear entrance. Keep some unfurnished grid tiles visible next to the rock to make exact edge alignment obvious.
No isolated central rock island, decorative rocky peak, round boulder, floating object, new dwarf type, room upgrade, or changed mechanics. Keep the same stylized 3D look and all unaffected content. Produce one corrected four-panel sheet.
Input roles: Image 1 is the training-room sheet to edit. Image 2 is the corrected Library sheet, a supporting reference ONLY for its bottom-right grid-aligned, connected bedrock seam and the unchanged four-panel format. Preserve the target room's own floor design, colors, fittings and function; do not copy Library desks, books or blue floor.
For the corrected rock, preserve the whole-cell rectilinear geometry demonstrated by the Library reference, but use continuous natural strata rather than a field of manufactured paving slabs. The seam is one solid geological body that continues through the surrounding terrain. Keep any surface irregularity small enough that the stepped, whole-square blocking footprint remains obvious.
```

## Treasure Room v2

Selected output: `treasure-room-v2.png` (superseded).

Inputs: `treasure-room-v1.png` (removed); `library-v2.png` (superseded).

```text
Use case: stylized-concept.
Asset type: corrected room layout concept sheet for a grid-based dwarf underground stronghold game.
Primary request: edit the supplied four-panel room sheet to correct ONLY the bottom-right terrain/layout study and its label. Preserve the title, the other three panels, their labels, room materials, furniture style, camera, tile scale, sheet composition and lighting.
Replace the bottom-right label "AROUND BEDROCK" with exactly "BEDROCK SEAM".
Remove the entire isolated central mound/boulder heap from the bottom-right panel. Replace it with a continuous band of solid bedrock that visibly joins the surrounding unexcavated terrain beyond the rear edge of the room. The seam must continue sideways through that rear terrain and beyond the depicted room, with a short stepped tongue projecting into the excavated space. It is a geological seam shaping the excavation, NOT a freestanding pile on the room floor.
Critical geometry: the bedrock's occupied footprint is composed of WHOLE square terrain tiles on the SAME grid as the room floor. Every exposed floor/rock boundary is a straight grid-edge segment with right-angle corners; changes in direction make clear one-tile or two-tile steps. Use a substantial two-tile-wide connected rock band with a rectangular stepped end projecting into the room. Its exposed sides rise vertically from those exact tile edges to approximately surrounding wall height. The top is broadly level at the terrain cutaway height; slight cracks and strata texture are fine. Do not taper the rock into a mountain, scatter boulders across neighboring tiles, round the blocking footprint, draw diagonals across tile squares, or place floor tiles beneath occupied rock.
Material: cool charcoal-blue dense bedrock with broad horizontal strata and restrained seams, visually distinct from warm brown excavatable earth and crafted masonry. It should be a continuous rock body, not manufactured brickwork and not a stack of little voxel cubes.
Adapt ONLY the bottom-right room's floor and furnishings to the new rectilinear rock boundary. Preserve that room's recognizable floor color, motif and wall treatments. The open floor wraps the protruding end with at least one clear route connecting the usable wings; it cannot form a complete ring behind the rock because the seam remains attached to the outside geology. Put functional furniture only on exposed usable floor, with clear approaches, and show a clear entrance. Keep some unfurnished grid tiles visible next to the rock to make exact edge alignment obvious.
No isolated central rock island, decorative rocky peak, round boulder, floating object, new dwarf type, room upgrade, or changed mechanics. Keep the same stylized 3D look and all unaffected content. Produce one corrected four-panel sheet.
Input roles: Image 1 is the treasure-room sheet to edit. Image 2 is the corrected Library sheet, a supporting reference ONLY for its bottom-right grid-aligned, connected bedrock seam and the unchanged four-panel format. Preserve the target room's own floor design, colors, fittings and function; do not copy Library desks, books or blue floor.
For the corrected rock, preserve the whole-cell rectilinear geometry demonstrated by the Library reference, but use continuous natural strata rather than a field of manufactured paving slabs. The seam is one solid geological body that continues through the surrounding terrain. Keep any surface irregularity small enough that the stepped, whole-square blocking footprint remains obvious.
```

## Dormitory v2

Selected output: `dormitory-v2.png` (superseded).

Inputs: `dormitory-v1.png` (removed); `library-v2.png` (superseded).

```text
Use case: stylized-concept.
Asset type: corrected room layout concept sheet for a grid-based dwarf underground stronghold game.
Primary request: edit the supplied four-panel room sheet to correct ONLY the bottom-right terrain/layout study and its label. Preserve the title, the other three panels, their labels, room materials, furniture style, camera, tile scale, sheet composition and lighting.
Replace the bottom-right label "AROUND BEDROCK" with exactly "BEDROCK SEAM".
Remove the entire isolated central mound/boulder heap from the bottom-right panel. Replace it with a continuous band of solid bedrock that visibly joins the surrounding unexcavated terrain beyond the rear edge of the room. The seam must continue sideways through that rear terrain and beyond the depicted room, with a short stepped tongue projecting into the excavated space. It is a geological seam shaping the excavation, NOT a freestanding pile on the room floor.
Critical geometry: the bedrock's occupied footprint is composed of WHOLE square terrain tiles on the SAME grid as the room floor. Every exposed floor/rock boundary is a straight grid-edge segment with right-angle corners; changes in direction make clear one-tile or two-tile steps. Use a substantial two-tile-wide connected rock band with a rectangular stepped end projecting into the room. Its exposed sides rise vertically from those exact tile edges to approximately surrounding wall height. The top is broadly level at the terrain cutaway height; slight cracks and strata texture are fine. Do not taper the rock into a mountain, scatter boulders across neighboring tiles, round the blocking footprint, draw diagonals across tile squares, or place floor tiles beneath occupied rock.
Material: cool charcoal-blue dense bedrock with broad horizontal strata and restrained seams, visually distinct from warm brown excavatable earth and crafted masonry. It should be a continuous rock body, not manufactured brickwork and not a stack of little voxel cubes.
Adapt ONLY the bottom-right room's floor and furnishings to the new rectilinear rock boundary. Preserve that room's recognizable floor color, motif and wall treatments. The open floor wraps the protruding end with at least one clear route connecting the usable wings; it cannot form a complete ring behind the rock because the seam remains attached to the outside geology. Put functional furniture only on exposed usable floor, with clear approaches, and show a clear entrance. Keep some unfurnished grid tiles visible next to the rock to make exact edge alignment obvious.
No isolated central rock island, decorative rocky peak, round boulder, floating object, new dwarf type, room upgrade, or changed mechanics. Keep the same stylized 3D look and all unaffected content. Produce one corrected four-panel sheet.
Input roles: Image 1 is the dormitory sheet to edit. Image 2 is the corrected Library sheet, a supporting reference ONLY for its bottom-right grid-aligned, connected bedrock seam and the unchanged four-panel format. Preserve the target room's own floor design, colors, fittings and function; do not copy Library desks, books or blue floor.
For the corrected rock, preserve the whole-cell rectilinear geometry demonstrated by the Library reference, but use continuous natural strata rather than a field of manufactured paving slabs. The seam is one solid geological body that continues through the surrounding terrain. Keep any surface irregularity small enough that the stepped, whole-square blocking footprint remains obvious.
```

## Guard Post v2

Selected output: `guard-post-v2.png` (superseded).

Inputs: `guard-post-v1.png` (removed); `library-v2.png` (superseded).

```text
Use case: stylized-concept.
Asset type: corrected room layout concept sheet for a grid-based dwarf underground stronghold game.
Primary request: edit the supplied four-panel room sheet to correct ONLY the bottom-right terrain/layout study and its label. Preserve the title, the other three panels, their labels, room materials, furniture style, camera, tile scale, sheet composition and lighting.
Replace the bottom-right label "AROUND BEDROCK" with exactly "BEDROCK SEAM".
Remove the entire isolated central mound/boulder heap from the bottom-right panel. Replace it with a continuous band of solid bedrock that visibly joins the surrounding unexcavated terrain beyond the rear edge of the room. The seam must continue sideways through that rear terrain and beyond the depicted room, with a short stepped tongue projecting into the excavated space. It is a geological seam shaping the excavation, NOT a freestanding pile on the room floor.
Critical geometry: the bedrock's occupied footprint is composed of WHOLE square terrain tiles on the SAME grid as the room floor. Every exposed floor/rock boundary is a straight grid-edge segment with right-angle corners; changes in direction make clear one-tile or two-tile steps. Use a substantial two-tile-wide connected rock band with a rectangular stepped end projecting into the room. Its exposed sides rise vertically from those exact tile edges to approximately surrounding wall height. The top is broadly level at the terrain cutaway height; slight cracks and strata texture are fine. Do not taper the rock into a mountain, scatter boulders across neighboring tiles, round the blocking footprint, draw diagonals across tile squares, or place floor tiles beneath occupied rock.
Material: cool charcoal-blue dense bedrock with broad horizontal strata and restrained seams, visually distinct from warm brown excavatable earth and crafted masonry. It should be a continuous rock body, not manufactured brickwork and not a stack of little voxel cubes.
Adapt ONLY the bottom-right room's floor and furnishings to the new rectilinear rock boundary. Preserve that room's recognizable floor color, motif and wall treatments. The open floor wraps the protruding end with at least one clear route connecting the usable wings; it cannot form a complete ring behind the rock because the seam remains attached to the outside geology. Put functional furniture only on exposed usable floor, with clear approaches, and show a clear entrance. Keep some unfurnished grid tiles visible next to the rock to make exact edge alignment obvious.
No isolated central rock island, decorative rocky peak, round boulder, floating object, new dwarf type, room upgrade, or changed mechanics. Keep the same stylized 3D look and all unaffected content. Produce one corrected four-panel sheet.
Input roles: Image 1 is the guard-post sheet to edit. Image 2 is the corrected Library sheet, a supporting reference ONLY for its bottom-right grid-aligned, connected bedrock seam and the unchanged four-panel format. Preserve the target room's own floor design, colors, fittings and function; do not copy Library desks, books or blue floor.
For the corrected rock, preserve the whole-cell rectilinear geometry demonstrated by the Library reference, but use continuous natural strata rather than a field of manufactured paving slabs. The seam is one solid geological body that continues through the surrounding terrain. Keep any surface irregularity small enough that the stepped, whole-square blocking footprint remains obvious.
```

## Terrain reference: first version

Output: `terrain-grid-v1.png` (removed), a draft removed during cleanup. Style reference: `library-v1.png` (removed).

```text
Use case: stylized-concept.
Asset type: terrain construction reference for an original stylized 3D dwarf stronghold game.
Input image: library-v1.png is a reference ONLY for the existing stylized 3D stone, warm lights, overhead camera, tiled floor and clean dark presentation. Do not copy its erroneous central rock mound or its library furniture.
Create a clear landscape 3:2 concept board titled exactly "TERRAIN ON THE GRID" with TWO large side-by-side overhead three-quarter cutaway studies, labeled exactly "BEDROCK SEAM" and "UNMINED EARTH". No other text. Use a steep management-game camera and the same square terrain grid and object scale in both examples. Simple neutral gray excavated floor tiles keep the blocking terrain readable. No furniture, dwarfs, UI or arrows.
LEFT STUDY: show a long continuous seam of dense cool charcoal-blue bedrock passing through the unexcavated rear terrain and continuing visibly beyond both sides of the cutaway. A connected tongue of this seam extends inward into a room-like excavation; its plan footprint makes several clear 90-degree steps along whole square grid cells. It is a geological band connected to the outside ground, not an isolated outcrop. Excavated floor can wrap its stepped end, but cannot pass behind it. Bedrock surfaces have broad natural strata and subtle cracks, not masonry joints.
RIGHT STUDY: show one isolated square tile of unmined warm brown earth and, separately, a small 2-by-2 group of unmined earth tiles left inside an otherwise excavated floor. These are solid full-height terrain cells with broadly level tops, vertically cut sides, subtle soil layers and embedded small stones. Their precise base footprints cover whole floor-grid squares; show enough surrounding open floor to clearly read the one-cell and four-cell sizes. They are ordinary diggable earth left unexcavated, not indestructible bedrock, rubble, planters, crates or decorative pillars. A strip of connected unmined earth at the rear helps establish they are remnants of the same terrain.
CRITICAL: all occupied/unoccupied floor boundaries align EXACTLY to straight edges of the visible square tile grid, with only right-angle turns. Surface detail may be organic INSIDE those footprints, but must not obscure their silhouette or spread onto adjacent cells. Terrain blocks rise to a consistent cutaway height, broadly matching surrounding walls. No conical mound, rounded heap, scattered boulder field, curved gameplay boundary, diagonally cut cells, tiny voxel cube style, floating debris, or floor under solid terrain.
Match the established polished stylized 3D look with chunky readable forms, restrained facets, soft painted materials, warm lights and cool cavern fill on a charcoal neutral background. Keep the explanation legible through shapes and the two short labels alone.
```

## Terrain reference: grid refinement

Selected output: `terrain-grid-v2.png` (superseded). Edit target: `terrain-grid-v1.png` (removed).

```text
Use case: stylized-concept.
Asset type: corrected terrain grid reference.
Edit the supplied "TERRAIN ON THE GRID" two-panel image. Preserve its title, exact "BEDROCK SEAM" and "UNMINED EARTH" labels, stylized 3D rendering, two-panel composition, contrasting blue-gray rock versus brown earth, lighting, wall materials and camera.
Correct the relationship between the floor grid and solid terrain. In each panel use a clear consistent grid of LARGE square terrain cells. Make every obstacle footprint occupy exact complete cells with its corners on the floor grid intersections. Do not retain the existing finer grout pattern if it causes an obstacle to cover fractional cells.
RIGHT PANEL: the empty rectangular interior floor has eight columns and eight rows of equally sized square cells, perspective-correct. Count rows from the back and columns from the left only as a construction instruction, with no printed numbers. Place one solid unmined earth cell at row 3, column 3. Place a separate solid 2-by-2 earth group at rows 5 and 6, columns 6 and 7. A single cube is exactly the size of ONE surrounding large floor cell, and each of the four top squares of the larger block has that same footprint. Ground grout lines must continue into the exact obstacle corners. Use warm brown compact earth with soil layers, embedded small stones and level cutaway tops at common terrain height. Leave the connected unmined earth at the rear to show these are pieces of the terrain. They are not decorative blocks.
LEFT PANEL: keep a long continuous dark bedrock band crossing the rear and continuing beyond both side boundaries of the example. A short connected tongue projects inward. Use whole-cell perpendicular steps only, with a two-cell-wide tongue that makes one sideways grid step and ends well before the front doorway. Maintain clear floor across the front of the tongue so the entrance is usable. The floor and bedrock footprint share exactly the same coarse grid. Bedrock is one continuous geological body with subtle natural horizontal strata, not regular manufactured bricks or a rounded boulder heap.
Do not add thin bevel outlines that suggest extra fractional ground cells. No diagonal occupied edges, tapered mountains, rubble spreading across cell boundaries, floor tiles under solid terrain, tiny cube/voxel styling, furniture, characters, arrows, numbered cells, extra panels or extra text.
The aim is a visually unambiguous distinction between a continuous, grid-shaped geological seam and individual square earth tiles retained within a room.
```

## Review

Visually reviewed the seven corrected fourth panels for their connection to surrounding terrain, rectilinear rock boundaries, clear usable space beside the seam, and retention of each room's visual identity. The separate terrain reference shows cool bedrock and warm diggable earth using a clearer floor grid. The shapes and materials are concept studies; the prompts' illustrative tile counts do not impose room dimensions or map templates. Selected images were copied into this folder and checked against the generated originals.
