# Gold seam and gem column revision prompts

Cleanup note: superseded concept images and drafts have been removed from the project. This document retains the original prompt wording and source filenames as generation history; references marked removed are not available image files. See the [current gallery](README.md) for the retained concepts.

Created with the built-in image generation tool. Selected output: [resource-terrain-v2.png](resource-terrain-v2.png). Return to the [terrain gallery](README.md).

## Requested correction and review

The user requested a single layer of intact rocks and removal of the lower selected dirt shelf. The gem columns and the gold seam's appearance on the top and exposed side were explicitly approved.

The first pass consolidated the terrain banks and removed the selected shelf, but retained a low isolated dirt block. A targeted second pass removed that block to continue the common floor through its footprint. The final image was visually checked for a single full terrain layer, clear open floor, and retention of both gem columns and the gold treatment. The title is a concept-sheet heading, not a proposed in-game label.

The original `resource-terrain-v1.png` (removed) and the `resource-terrain-v2-height-draft.png` (removed) have been removed. Their prompts remain as generation history; the final image is the elevation reference. Unmined earth cells remain permitted by the game rules when they occupy the full terrain height; this composition no longer includes an isolated earth cell.

## Pass 1

Edit target: `resource-terrain-v1.png` (removed). The saved project image was used because the attachment reported an invalid local path. It was inspected before editing.

Output: `resource-terrain-v2-height-draft.png` (removed).

### Exact prompt

```text
Use case: stylized-concept.
Asset type: precise revision of the supplied gold seam and gem column environment concept.
Edit the supplied image to implement the user's annotated corrections. Keep the same image framing, overhead camera, square-grid orientation, large cell scale, title "GOLD SEAMS & GEM COLUMNS", stylized 3D materials, lighting, miners, and overall mine layout.

MUST PRESERVE: the user explicitly approved the two jewel-encrusted GEM COLUMNS (especially the central column near x58%, y43%). Preserve their current shape, colors, crystal detail, size, positions, and visible working access. The user also approved the GOLD SEAM at the right near x77%, y33%: preserve the existing rich gold veins on both top surfaces and exposed vertical faces, the gold bank's height and shape, and the miner working there. Do not redesign these approved features.

CORRECTION 1: the game has ONE excavation layer. There is a single flat walkable floor plane. Every ordinary dirt, gold-bearing rock and bedrock terrain cell is either fully present at ONE common intact-terrain height or fully excavated down to that floor. There are NO half-height blocks, intermediate ledges, terraced bedrock, stacked playable layers, stairs or raised walkable floors. This is a shared height in world space, not an instruction to align perspective-projected tops to the same horizontal pixel row.

At the upper-left bedrock near x31.7%, y18.2%, replace the existing cascading stepped HEIGHTS with one solid continuous bedrock bank. Its intact upper surface lies at the SAME world height as the intact gold-bearing bank at the right. Preserve a stepped square-grid FOOTPRINT in the horizontal plane, but make every exposed vertical boundary drop directly to the one common floor. The bedrock remains connected to the surrounding rear geology. Remove any smaller dark rock ledges or shelf blocks below this common top surface by consolidating occupied rock cells into the full-height bank. Natural cracks and strata are allowed; they must not create additional terrain levels.

CORRECTION 4: remove the ENTIRE low selected-dirt shelf near x28.3%, y51.3%, including all yellow hatch overlays, green selection outlines, its raised top surface and its vertical retaining faces. This whole selected shelf area becomes fully excavated ordinary floor at exactly the same height as the existing passage where the miners stand. Extend the existing coarse square floor grid through this newly open area with a flush seamless connection and no lip, steps or shallow platform. Do not move the selection highlight elsewhere. Remove any lights attached to the deleted ledge rather than leaving them floating.

Apply the same full-height-or-excavated rule to the remaining ordinary earth cells. The retained isolated brown earth cell in the lower middle may remain, but raise it to the common full terrain height instead of leaving a half-height stump; keep its square footprint and preserve open circulation around it and visibility of the approved gem columns. Any attached brown terrain at the left must likewise be a full-height bank or open floor, not another low shelf. Do not introduce more terrain tiers at the image margins.

Keep the right-hand gold surfaces and BOTH approved gem columns as unchanged as possible. The gem columns are the same resource objects on the common floor; do not stretch them, turn them into a staircase, or replace them to match the terrain changes. Keep all walkable ground on a single elevation. Maintain believable continuous gold-bearing earth, connected dark bedrock, whole-square occupied footprints and broad miner access. No extra characters, new rooms, signs, annotations, UI, replacement highlight, or new gameplay systems.
Produce one revised concept image.
```

## Pass 2

Edit target: `resource-terrain-v2-height-draft.png` (removed), inspected before editing.

Selected output: [resource-terrain-v2.png](resource-terrain-v2.png).

### Exact prompt

```text
Use case: precise-object-edit.
Edit target: the supplied terrain concept image.
Make ONE local correction only: remove the isolated ordinary brown dirt block in the lower middle of the image (center approximately x51%, y76%, spanning x44-58%, y63-88%). It is an unwanted half-height earth stump. Replace its entire footprint, vertical faces, rocks at its base and its cast shadow with empty walkable floor flush with the surrounding floor, seamlessly continuing the same large square floor grid and ground texture. Keep the walking miner at its left untouched.

Preserve the rest of the image as closely as possible: both jewel-encrusted purple/cyan gem columns, all three miners, the gold bank at right with veins on its top and exposed vertical face, the continuous dark bedrock bank at left, common terrain top height, flat ground plane, lighting, overhead camera, composition, large square grid and title "GOLD SEAMS & GEM COLUMNS". Do not stretch, move, remove or redesign either approved gem column. No other added or removed objects. No new shelf, step, terrain tier, selection overlay, text or UI. After the edit, the lower middle is simply clear floor; intact banks remain one consistent full terrain layer above the floor.
```
