# M9 graphics and animation notes

M9 was added after M8 completion on 2026-09-07, following the user's requested sequence. The pass uses editable Babylon.js geometry and small generated material textures. It does not require an external modeling or asset build pipeline.

## Reference review

| Approved/current concept | Applied direction |
|---|---|
| [Resources and terrain](concept-art/terrain/resource-terrain-v2.png) | One continuous square terrain layer, dark bedrock, warm earth, branching embedded gold and blue/violet crystals on persistent columns |
| [Stone Hearth](concept-art/rooms/stone-hearth-v2.png) | Faceted cool crystal, stone dais, brass circles, runes and restrained light pulse |
| [Treasure Room](concept-art/rooms/treasure-room-v3.png) | Fitted vault paving, coin motifs and bands, brass-bound chests; visible gold follows actual stored amounts |
| [Dormitory](concept-art/rooms/dormitory-v3.png) | Warm patterned stone, timber beds, pillows, folded woven blankets and individual resting poses |
| [Kitchen](concept-art/rooms/kitchen-v3.png) | Mushroom motifs, red/cream growing beds, cooking hearths, tables and banded casks; stock controls visible mushrooms and prepared food |
| [Workshop](concept-art/rooms/workshop-v3.png) | Dark paving and brass gear motifs, tool boards, benches, anvils, assembly parts, reinforced door panels and trap mechanisms |
| [Training Room](concept-art/rooms/training-room-v3.png) | Warm practice-lane paving, diamond emblems, reinforced-wall banners and targets, bound-straw dummies and larger weight benches |
| [Library](concept-art/rooms/library-v3.png) | Blue book/rune inlays, reinforced-wall shelves, compact candlelit lecterns and larger reading desks with bookshelves |
| [Miner](concept-art/dwarfs/miner-v1.png) | Broad ochre tunic, helmet lamp, clasped beard, curved pick, heavy boots and visible carrying satchel |
| [Female Engineer](concept-art/dwarfs/engineer-v3.png) | Teal clothing, apron, twin braids, goggles, tool pack and hammer |
| [Warrior](concept-art/dwarfs/warrior-v1.png) | Crimson tunic, layered steel shoulders and armor, dark beard, banded helmet, broad wooden shield and axe |
| [Runesmith](concept-art/dwarfs/runesmith-v2.png) | Indigo robe and mantle, ivory borders, silver hair and beard, and an open rune book |

## Activity and iteration

`src/view/residents.ts` derives poses from actual jobs and paths: alternating steps and body bob, facing the work target, mining/tool swings, a low claiming pose, a swaying full satchel, hand-to-mouth eating, and lying on the assigned bed with quiet breathing. Engineering uses the same shared movement and need animations.

`src/view/effects.ts` provides a bounded, reused pool for excavation dust, craft sparks and cooking steam. Effects follow actual work or food stock. The Hearthstone and lanterns use subtle light changes. Reduced-motion preference disables particles and light modulation. Effects have no collision, capacity, discovery or economic role and contain no world text.

`src/view/surfaces.ts` provides the room palette and generated paving, brass motifs, rough stone and timber textures. Scene geometry includes contact shadows, wall-foot shading, lanterns and fittings on existing walls. Furnishings retain the gameplay footprints used by navigation; decoration does not add walls or capacity.

Use **Debug → Load visual showcase** for a repeatable scene containing example rooms, test residents, actual stock, loose gold, excavation marks, production orders and queued spell research. The [configuration guide](configuration.md) identifies the source of the showcase contents. The regular Room Layout Studio remains the place to inspect arbitrary shapes and expansion with normal construction tools.

The result is a stylized procedural prototype, not a reproduction of the concept sheets' illustration detail. Sculpted meshes, authored texture sets, skeletal animation, audio, advanced shadows and cinematic effects remain optional future art work. They are not prerequisites for rapid gameplay iteration.

## Verification

Reviewed normal terrain/core and the four-room showcase at several rotations and zoom levels. The showcase exercised mining, claiming, delivery, rest and meals for all four residents, and completed both Workshop recipes. Sleeping characters align with assigned beds; food, stored gold and crafted props follow their actual state. The final browser console had no errors. All 20 simulation checks, the final TypeScript/browser build and local documentation-link checks passed.

Unchanged furnishing meshes are retained, static parts sharing a material draw together, and the glow layer includes only emissive objects. This keeps common stock and job updates from rebuilding the whole room scene. Showcase setup yields between room builds to keep input responsive.

Unclaimed excavated tiles and discovered natural floors appear as bare dirt with scattered stones. Claiming replaces this with fitted flooring. Natural walls remain rough dirt or rock until a miner completes reinforcement; only then do masonry, wall fittings and lanterns appear. The shared single-height terrain and floor plane are unchanged.

## Training and Library extension — 2026-09-07

Reviewed the approved terrain plus the current Training Room, Library, Warrior and Runesmith sheets before this extension. The new `dummy` and `lectern` models occupy one tile; `weights` and `bookshelf` occupy two by one tiles and rotate with their gameplay footprints. The larger Library model combines a reading desk and shelf, so it provides a visible research position as well as books. Shelves on reinforced wall faces are decorative and add no service capacity. Both floor motifs remain visible when no furniture fits or no walls exist.

All appearances use the existing shared walking, eating and sleeping rig. Actual `train` jobs drive alternating practice punches at a dummy or paired hand-weight lifts at a weight station, and hide carried work equipment. Actual `research` jobs drive a reading pose with a gentle page-pointing gesture and occasional blue motes. Shield, book and exercise props are visual equipment only. Training dust and research motes reuse the bounded particle pool and respect reduced-motion preference. No labels or progress indicators appear above characters or furnishings.

These are editable prototype models; body proportions, decorative book marks, equipment and furnishings follow the approved visual direction without introducing equipment inventories, casting rules or combat behavior. Integrated verification is recorded in the [development record](development-plan.md).

## Doors, traps and test raiders — 2026-09-07

`src/view/defenses.ts` adds hinged timber, iron-banded and steel doors with visible locks and damage seams; low pressure plates with rising spikes; and compass-facing crossbows with short bolt flight animations. These models read health, passage, trigger and death state from the independent simulation. Workshop output props distinguish completed spikes, bolts and door panels. Shared vector icons identify the new placement tools; valid previews show fixture orientation and invalid previews include an X.

The [Goblin Raider concept](concept-art/enemies/goblin-raider-v1.png) guides the debug attacker's long ears, olive skin, leather, scrap shield, crest and blade. Procedural legs and striking arms animate walking, door attacks, pinning and defeat. No world text, damage numbers or health/progress bars are used. The defense yard uses a wider approach around a one-square doorway and a steeper camera view so traps remain visible beside full-height terrain. These are prototype models; natural encounters and dwarf combat remain pending.
