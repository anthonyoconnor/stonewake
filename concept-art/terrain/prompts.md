# Gold seam and gem column concept prompt

Reference history: room and terrain-study images marked superseded below are available in Git history at `26bf924`. The original prompt text and source filenames remain unchanged; the current sheets are in the [room gallery](../rooms/README.md).

Cleanup note: superseded concept images and drafts have been removed from the project. This document retains the original prompt wording and source filenames as generation history; references marked removed are not available image files. See the [current gallery](README.md) for the retained concepts.

Historical first version. The user approved the gem columns and gold treatment, but requested one terrain layer and removal of the lower selected ledge. See the [current gallery](README.md) and [revision prompt](prompts-v2.md). The original wording below is retained as generation provenance.

Created with the built-in image generation tool for the user's request to show gold seams, gem columns, dirt, bedrock, and large selectable excavation cells across a wider underground area.

Selected output: `resource-terrain-v1.png` (removed).

## References

1. [dungeon-keeper-excavation-reference.png](../../concept-art/terrain/references/dungeon-keeper-excavation-reference.png)
2. `terrain-grid-v2.png` (superseded)
3. [miner-v1.png](../../concept-art/dwarfs/miner-v1.png)

The Dungeon Keeper screenshot was supplied by the user and retained unmodified as a reference for excavation-cell scale, selection, and top/side visibility. The terrain study and Miner concept provide project continuity. All input images were inspected before generation.

## Exact prompt

```text
Use case: stylized-concept.
Asset type: a wide environment concept showing excavation, GOLD SEAMS and GEM COLUMNS in an original dwarf underground stronghold management game.
Input images: Image 1 is the user-provided Dungeon Keeper excavation screenshot. Use it ONLY to understand the LARGE playable square excavation cells, the raised tops of unmined terrain, exposed vertical mine walls, selection across full cells, and mineral visibility from top and side. Do not copy the game's pixel graphics, UI sidebar, logos, hand cursor or assets. Image 2 terrain-grid-v2.png supports the logical distinction between connected bedrock and ordinary earth occupying whole cells. Do NOT copy its artificial masonry-bordered demonstration rooms or its small board layout. Image 3 miner-v1.png is the style and character reference for the small working dwarfs.
Create ONE coherent broad mine area, not a collection of small rooms and not a multi-panel board. Landscape 3:2, richly finished polished stylized 3D, elevated rotating-management-game viewpoint approximately 55 degrees downward, zoomed out enough to see a substantial connected area roughly 14 by 11 LARGE action cells. Keep the middle of the scene crisp and readable with subtle darkness at the outer unknown edges. Warm miners' lanterns and restrained cool mineral accents; chunky sculpted materials, softly painted surfaces, natural geology, no photorealism or pixel art.
GRID SCALE IS CRITICAL: every playable terrain cell is a substantial square footprint, about three dwarf shoulder widths across, with unmined terrain rising well above a dwarf. Distinguish this coarse excavation grid from tiny stone-brick or decorative-floor subdivisions. Use subtle coarse grid seams across the tops of solid dirt and faint matching large-cell indications on excavated ground. Terrain top cell size, exposed wall cell width, ground cells and selection squares must agree in the SAME perspective. Do not render a tiny mosaic tile grid or miniature cube voxels.
Terrain composition:
1. Broad raised banks of warm brown unexcavated DIRT occupy the rear and left sections, connected to terrain beyond the image. Earth has soil layers, embedded small stones and naturally textured surfaces, with approximately level tops and vertically exposed sides. All occupied-versus-open boundaries follow whole cells and 90-degree steps. The excavated foreground branches into a roomy mining chamber and a wide working passage, with visibly continuous walkable routes.
2. A connected GOLD SEAM threads through several adjacent dirt cells in the middle/right raised bank. Show rich warm metallic gold veins and small embedded ore clusters ON THE UPPER SURFACES of these cells and continuing DOWN THE VERTICAL EXPOSED WALL FACES bordering the excavated passage. Make at least one front-facing gold-bearing cell very clearly readable on both its square top and full exposed side in the same view. Gold is ore IN EARTH/ROCK, not loose coin piles, minted ingots, polished golden masonry, a gold floor, or a solid shiny gold cube. The unselected gold cells must remain clearly gold-bearing without any highlight.
3. Two GEM COLUMNS stand within the opened mining chamber, separated by walkable floor. Each is a dense vertical mineral-rich rock column occupying exactly ONE of the same large square terrain footprints. Its square-sided dark host rock remains rooted in the ground and rises to roughly the unmined terrain height. Jewel-toned violet, turquoise and blue crystal facets are embedded on its TOP and EXPOSED SIDE FACES. Keep its overall blocking footprint within the square, with a broad visible column form, not a spindly crystal cluster or scattered rubble. These are persistent mineable deposits, NOT decorative statues, a power source, the Hearthstone, a pedestal, or a portal. Leave clear access along several faces so miners can work without a character standing on the column.
4. A substantial connected charcoal-blue BEDROCK SEAM crosses the rear terrain and steps inward along the left boundary, continuing beyond the depicted area. It must read as continuous dense geology with natural strata and subtle cracks, not a freestanding central pile, a brick wall, paving slabs, or a placed barricade. Bedrock boundaries follow the same whole-square grid, with broad perpendicular steps. Keep it visually distinct from brown dirt, gold-bearing earth and colorful gem columns.
5. Include one ordinary unmined square earth cell left near an edge of the excavated chamber to reinforce the size of a single diggable cell. Keep the circulation open around it.
EXCAVATION SELECTION: on a small group of plain dirt cells beside the active passage, show translucent pale yellow hatching over each WHOLE top face, with thin clear green square perimeters aligned precisely to the large cell edges. Keep it translucent enough to see brown soil below, visually separate from the natural warm gold veins farther right. No highlighted bedrock or gem column. These are intact dirt cells designated to be dug, not painted floor tiles. The selected cells must be reachable from the existing excavated area.
Include three small sturdy miners based on the reference, in ochre workwear and helmet lamps, for scale: one working at an exposed gold face, one beside a gem column, and one walking naturally in the passage. Dwarfs move freely and are not centered on a chessboard. They should be much smaller than the complete resource-bearing terrain columns, with consistent relative scale. No other dwarf classes or enemies.
Text: small unobtrusive title at the top, exactly "GOLD SEAMS & GEM COLUMNS". Otherwise no labels, legend, numbers, dimensions, stat cards or UI panels; the terrain and subtle selection overlay should explain the scene visually. No forced ornate architecture or rooms, treasure chests, beds, shrines, thrones, rails, ore-processing machines, surface sky, lava, bridges, logos or watermarks.
The most important read is LARGE selectable square terrain blocks with mineral seams clearly visible on TOP and SIDE, all within a larger connected dirt-and-bedrock underground map.
```

## Review

Visually reviewed the larger connected scene, coarse square selection overlay on intact dirt, gold detail across upper and exposed vertical surfaces, separate mineral-rich gem columns, connected dark bedrock, and miners providing scale. The selected PNG is saved in this folder. This is an environment concept; precise physical dimensions, tile coordinates, and navigation remain implementation work.
