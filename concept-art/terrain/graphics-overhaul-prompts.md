# Graphics overhaul concept prompts

Generated with the built-in image generation tool on 2026-09-09. These are modeling and material references, not gameplay assets or fixed layouts. Terrain height, floor plane, access and discovery rules in [Levels](../../levels.md) take precedence over incidental image geometry.

## Stronghold cohesion v1

Inputs: `resource-terrain-v2.png` and `../levels/border-foothold-v1.png`, both visual references rather than edit targets.

Use case: stylized-concept. Art-direction target for a playable Babylon.js dwarven stronghold management game. A refined, cohesive in-game environment concept for Stonewake. Single connected subterranean settlement in elevated three-quarter overhead. Large square excavation cells, all intact banks at one top height, all walkable floor at one plane. Modest established Hearth clearing, timber beds, bronze-bound chests, adjoining workshop and book alcove. Mined passages lead to chunky gold-bearing earth and permanent square dark gem columns. Retained full-height earth cells, connected dark bedrock, small water channel and fitted stone bridge.

High-quality tactile stylized 3D, broad chipped stone, warm umber earth, charcoal blue bedrock, worn gray/brown flagstones, bronze and weathered timber, soft contact shadows. Irregular contiguous geological strata and fine branching fractures, no brick wallpaper or repeated cobbles. Terrain tops flow across cells while excavation footprints remain legible. Broad embedded gold, blue/violet quartz with dark facets. Thin floor seams, small robust dwarfs and tiny mechanical Stonehands for scale. Readable underground lighting, warm lamp pools, restrained cool Hearth. No high bloom, toy shine, excessive cyan or black playable floors. Landscape 1536×1024, no text, UI or floating bars; no sky, multiple walkable layers, staircases or isolated boulders.

Review: useful coherent materials and warm lighting, but incidental low room walls, stepped-looking paving and replacement fire core require correction. Existing gameplay retains its crystal Hearth and single plane.

## Stronghold cohesion v2 — current modeling target

Input: `stronghold-cohesion-v1.png` as edit target. Preserve camera, warm/cool palette, rich weathered stone, gold seams, dark blue/violet gem columns, timber furniture, restrained warm lanterns, clear paths and overall layout. Correct geometry: all walkable ground, rooms, paths and bridge decks at one common flat plane, no steps/platforms; all intact banks one full height. Eliminate low partitions or convert to full-height banks. Restore the modest blue crystalline Hearth in a low circular stone/brass cradle, with fire only at appropriate kitchen/workshop props. Terrain tops use broader fractured geological plates while retaining excavation footprints. No text or UI.

The revised reference improves the core identity and broad top fractures. Incidental partitions in the illustration still do not change the game's strict common bank height or add automatic room walls.
