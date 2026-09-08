# Graphics and animation notes

[M21 terrain and environments](development-history.md#m21--terrain-and-environment-graphics-update) and [M22 character models and animations](development-history.md#m22--character-models-and-animations-update) extend the procedural M9 baseline. The notes below distinguish the new work from the earlier pass.

## M21 environment update

The approved terrain sheet, all six implemented room sheets, Stone Hearth, Bridge, Flooded Workings, Fungal Caves and Volcanic Depths were reviewed alongside their current gallery and prompt records. The shared direction is substantial weathered stone, warm earth, dark connected bedrock, practical timber and brass, restrained light, and a single square excavation layer.

- **Terrain:** subtly chamfered full-height banks and shallow exposed stone relief replace perfectly flat block faces. Generated clod/slate textures distinguish earth, rock and bedrock; fitted claimed paving remains distinct from rough unclaimed ground. Gold uses broad, shallow faceted fragments embedded across tops and exposed faces. This restores the chunkier pre-M21 readability after the thin M21 zigzag veins were rejected. Gem deposits retain their permanent dark square columns with blue/violet faceted quartz.
- **Hazards and bridges:** water has cool overlapping surface detail, lava has dark cooled crust separated by orange fissures, and chasms have recessed dark cut faces. Shore treatments sit below the common floor. Completed decks use fitted stone pavers, low edge blocks and supporting corbels; wider/bent spans omit interior edges. Bridge plans show an open frame, preserving the visible hazard underneath.
- **Rooms and furnishings:** perimeter inlays follow the actual room boundary, including narrow wings and adjacent room types. Beveled timber/stone, bedpost caps and footboards, open ironbound chests, pot handles/grates, cask staves, table joinery, anvil horns and bench braces improve material construction. Existing straw targets, weights, books, shelves, floor motifs and reinforced-wall treatments retain each room's identity. Stored gold continues to use actual room storage.
- **Hearths and fixtures:** the base crystal has a faceted shaft, a lower segmented stone cradle and physical rune strokes. All crystal users share the improved quartz form, including the onward stone. Doors have fitted panels, hinge barrels, collars and handles; traps have inset frames, tension fittings and restrained recoil. Door modes/damage and trap trigger/reset still come from simulation state.
- **Motion and cost:** shared hazard textures move subtly with simulation time. Reduced motion is read live and freezes texture flow/light modulation, removes active particles, snaps door state, and suppresses projectile flight/recoil. Decorative meshes merge per tile/material and per furnishing, static terrain matrices are frozen, and unexplored cells share instanced geometry while retaining tile picking and fog.

No decoration changes capacity, navigation, sight, projectile obstruction or discovery. All intact terrain retains the same full height, all walking surfaces retain the common floor, and health/status remains in the sidebar.

### M21 verification and limits

`node scripts/environment-browser.mjs` captures matching ordinary/close/rotated views and exercises irregular rooms, paid/free construction, fog, water/lava bridge plans and decks, door states/damage, trap trigger/reset and a live reduced-motion toggle. Add `--profile` for settled 60-frame samples after a 30-frame warm-up in the ordinary stronghold and full showcase. Use a single browser workload for performance samples; simultaneous agent browser tests and Vite hot reloads distort results.

Before images are retained in ignored `test-results/m21-before/`; after images and a structured report are written to `test-results/m21-after/`. Final browser checks passed for exact fog picking, all six rooms including strips/L shapes/retained earth/bedrock, paid/free expansion, reinforcement, water/lava bridge plans and decks, door modes/damage, trap trigger/reset and live reduced motion, with no runtime errors. Close, ordinary and rotated captures were inspected. Visual inspection corrected inward side-face winding, starter-chest merge alignment, coplanar bridge deck/paver surfaces and lava emission washing out the cooled-crust texture; the latter now uses the surface texture as its emission mask. The final lava material, bridge deck and front-facing door states have additional focused captures in the after folder. TypeScript verification and the 35 focused room/bridge/defense/selection simulation checks passed.

Settled paused-rendering measurements at a 1440×1000 browser viewport on Intel Iris Plus/ANGLE D3D11 were 45.5 FPS in the ordinary stronghold (mean 21.96 ms, p95 33.4 ms) and 24.0 FPS in the full showcase (mean 41.7 ms, p95 66.7 ms). The showcase remains noticeably heavier on this integrated GPU; the figures describe this machine and sample, not a universal performance target. Reported per-capture FPS includes setup work and should not be substituted for these warmed samples.

The result remains procedural prototype art. Textures repeat, stone relief is shallow, and there are no authored normal maps, cast shadow maps, water reflections/refraction, skeletal environment rigs or cinematic effects. Fungal webs/growth and extensive regional ruins remain optional decoration; the current regional distinction comes from authored terrain, hazards, resources and enemies. These limitations do not grant new terrain mechanics or restore deferred rooms/repairs.

## M22 character models and animation update

All four dwarf roles use the current character sheets and prompt records: ochre Miner with a helmet lamp and crossed carrying harness, female Engineer with braids/apron/goggles and a mechanism pack, crimson Warrior with overlapping steel plates and a boarded shield, and indigo Runesmith with ivory knotwork and a brass-cornered rune book. Tailored tunic profiles replace the round torso; shared muted grain materials, sculpted brows/moustaches, carved beard strands, helmet bands/rivets, boot soles/straps/toe guards and role equipment improve front/back readability.

Dwarf stride follows actual displacement, so feet do not keep stepping when a path stalls. Poses and shortest-path turns ease across job changes; mining/construction, claiming, hauling, crafting, practice, reading, eating/resting and Hearth activation derive from actual jobs. Combat swings follow attack cooldown events, brief physical recoil follows damage, and a defeated resident's last visible model falls and disappears after two simulation seconds. Departure does not produce a death animation. Reduced motion suppresses idle breathing, bounce, cargo sway and hit recoil. Static costume pieces merge within their animated pivots to limit draw calls; the rig remains procedural and independent of gameplay state.

All ten enemy models are described in [Enemies](enemies.md): eight-legged spider, clawed plated burrower, mushroom/root brute, armored skeleton, monumental stone Sentinel, separated geode Elemental, spined reptilian Stalker, cracked coal Cinderling, broad-jawed Deepmaw and the armed Raider. Their moving limbs, turning, attacks, projectiles/control bursts, recoil and defeat follow simulation events. Enemy limbs retain locomotion between simulation ticks; reduced motion removes ambient modulation and decorative flights/bursts.

`character-models` provides a clear floor for inspecting every dwarf from front/back. `showcase` exercises actual room work and needs, `spells` combat and control, and `enemy-roster` the ten enemy models. `node scripts/character-visuals-browser.mjs` captures these dwarf comparisons; `node scripts/enemies-browser.mjs` verifies/captures enemies. Baseline dwarf captures are retained in ignored `test-results/m22-before/`, with final front/back, activity and reduced-motion captures in `test-results/m22-after/`. Browser checks passed actual sleep/eat/train/mine/reinforce/claim/craft/research/construction poses, moving construction arms, paused poses, real enemy-caused death/disposal and reduced-motion breathing. A focused normal-economy mining/hauling run verified the moving gold-load pose. All runs reported no runtime errors. The ten-enemy/six-dwarf gallery rendered at roughly 20–30 FPS across headless samples; the six-resident/full-room showcase profile is recorded above. New enemy models were compared against their concept sheets; no historical Raider screenshot was captured.

These are improved procedural prototype models, not imported sculpted assets or skeletal rigs. Facial motion, hand articulation, perfect bed/seat contact and cloth deformation remain limitations. Equipment is visual identity rather than an inventory, and no health/status text is added to the world.

## M9 baseline

M9 was added after M8 completion on 2026-09-07, following the user's requested sequence. The pass uses editable Babylon.js geometry and small generated material textures. It does not require an external modeling or asset build pipeline.

## Reference review

| Approved/current concept | Applied direction |
|---|---|
| [Resources and terrain](concept-art/terrain/resource-terrain-v2.png) | One continuous square terrain layer, dark bedrock, warm earth, branching embedded gold and blue/violet crystals on persistent columns |
| [Stone Hearth](concept-art/rooms/stone-hearth-v2.png) | Faceted cool crystal, stone dais, brass circles, runes and restrained light pulse |
| [Treasure Room](concept-art/rooms/treasure-room-v3.png) | Fitted vault paving, coin motifs and bands, brass-bound chests; visible gold follows actual stored amounts |
| [Dormitory](concept-art/rooms/dormitory-v3.png) | Warm patterned stone, timber beds, pillows, folded woven blankets and individual resting poses |
| [Kitchen](concept-art/rooms/kitchen-v3.png) | Mushroom motifs, red/cream growing beds, cooking hearths, tables and banded casks as cosmetic details; there are no ingredient, meal or ale inventories |
| [Workshop](concept-art/rooms/workshop-v3.png) | Dark paving and brass gear motifs, tool boards, benches, anvils, assembly parts, reinforced door panels and trap mechanisms |
| [Training Room](concept-art/rooms/training-room-v3.png) | Warm practice-lane paving, diamond emblems, reinforced-wall banners and targets, bound-straw dummies and larger weight benches |
| [Library](concept-art/rooms/library-v3.png) | Blue book/rune inlays, reinforced-wall shelves, compact candlelit lecterns and larger reading desks with bookshelves |
| [Miner](concept-art/dwarfs/miner-v1.png) | Broad ochre tunic, helmet lamp, clasped beard, curved pick, heavy boots and visible carrying satchel |
| [Female Engineer](concept-art/dwarfs/engineer-v3.png) | Teal clothing, apron, twin braids, goggles, tool pack and hammer |
| [Warrior](concept-art/dwarfs/warrior-v1.png) | Crimson tunic, layered steel shoulders and armor, dark beard, banded helmet, broad wooden shield and axe |
| [Runesmith](concept-art/dwarfs/runesmith-v2.png) | Indigo robe and mantle, ivory borders, silver hair and beard, and an open rune book |

## Activity and iteration

`src/view/residents.ts` derives poses from actual jobs and paths: alternating steps and body bob, facing the work target, mining/tool swings, a low claiming pose, a swaying full satchel, hand-to-mouth eating, and resting with quiet breathing. Engineering uses the same shared movement and need animations. Room service positions exist independently of visible furniture; a missing bed, table or practice object must not suppress activity.

`src/view/effects.ts` provides a bounded, reused pool for excavation dust, craft sparks and other room effects. Work effects follow actual activity; Kitchen steam and food props are cosmetic ambiance rather than production feedback. The Hearthstone and lanterns use subtle light changes. Reduced-motion preference disables particles and light modulation. Effects have no collision, capacity, discovery or economic role and contain no world text.

`src/view/surfaces.ts` provides the room palette and generated paving, brass motifs, rough stone and timber textures. Scene geometry includes contact shadows, wall-foot shading, lanterns and fittings on existing walls. Room furnishings are entirely cosmetic: their footprint, presence and arrangement never alter service capacity, navigation, sight or projectile paths. Real terrain, doors and the Hearth retain their gameplay roles.

Use **Debug → Load visual showcase** for a repeatable scene containing example rooms, test residents, stored and loose gold, excavation marks, production orders and queued spell research. The [configuration guide](configuration.md) identifies the source of the showcase contents. The regular Room Layout Studio remains the place to inspect arbitrary shapes and expansion with normal construction tools.

The result is a stylized procedural prototype, not a reproduction of the concept sheets' illustration detail. Sculpted meshes, authored texture sets, skeletal animation, audio, advanced shadows and cinematic effects remain optional future art work. They are not prerequisites for rapid gameplay iteration.

## Verification

The verification and dated extension notes below record the original graphics pass. The current room design supersedes references there to physical furnishing stations, bed assignments and food stock: gameplay capacity now follows floor area, and props are cosmetic. Current checks belong in the [development history](development-history.md).

Reviewed normal terrain/core and the four-room showcase at several rotations and zoom levels. The showcase exercised mining, claiming, delivery, rest and meals for all four residents, and completed both Workshop recipes. Sleeping characters align with assigned beds; food, stored gold and crafted props follow their actual state. The final browser console had no errors. All 20 simulation checks, the final TypeScript/browser build and local documentation-link checks passed.

Unchanged furnishing meshes are retained, static parts sharing a material draw together, and the glow layer includes only emissive objects. This keeps common stock and job updates from rebuilding the whole room scene. Showcase setup yields between room builds to keep input responsive.

Unclaimed excavated tiles and discovered natural floors appear as bare dirt with scattered stones. Claiming replaces this with fitted flooring. Natural walls remain rough dirt or rock until a miner completes reinforcement; only then do masonry, wall fittings and lanterns appear. The shared single-height terrain and floor plane are unchanged.

## Training and Library extension — 2026-09-07

Reviewed the approved terrain plus the current Training Room, Library, Warrior and Runesmith sheets before this extension. The new `dummy` and `lectern` models occupy one tile; `weights` and `bookshelf` occupy two by one tiles and rotate with their gameplay footprints. The larger Library model combines a reading desk and shelf, so it provides a visible research position as well as books. Shelves on reinforced wall faces are decorative and add no service capacity. Both floor motifs remain visible when no furniture fits or no walls exist.

All appearances use the existing shared walking, eating and sleeping rig. Actual `train` jobs drive alternating practice punches at a dummy or paired hand-weight lifts at a weight station, and hide carried work equipment. Actual `research` jobs drive a reading pose with a gentle page-pointing gesture and occasional blue motes. Shield, book and exercise props are visual equipment only. Training dust and research motes reuse the bounded particle pool and respect reduced-motion preference. No labels or progress indicators appear above characters or furnishings.

These are editable prototype models; body proportions, decorative book marks, equipment and furnishings follow the approved visual direction without introducing equipment inventories, casting rules or combat behavior. Integrated verification is recorded in the [development history](development-history.md).

## Doors, traps and test raiders — 2026-09-07

`src/view/defenses.ts` adds hinged timber, iron-banded and steel doors with visible locks and damage seams; low pressure plates with rising spikes; and compass-facing crossbows with short bolt flight animations. These models read health, passage, trigger and death state from the independent simulation. Workshop output props distinguish completed spikes, bolts and door panels. Shared vector icons identify the new placement tools; valid previews show fixture orientation and invalid previews include an X.

The [Goblin Raider concept](concept-art/enemies/goblin-raider-v1.png) guides the debug attacker's long ears, olive skin, leather, scrap shield, crest and blade. Procedural legs and striking arms animate walking, door attacks, pinning and defeat. No world text, damage numbers or health/progress bars are used. The defense yard uses a wider approach around a one-square doorway and a steeper camera view so traps remain visible beside full-height terrain. These are the earlier prototype models; the current enemy roster and dwarf combat are described in [Enemies](enemies.md).

## Stonehand mechanical worker

The approved [Stonehands v2 sheet](concept-art/stonehands/README.md) now guides a separate procedural model: about 0.53 tiles tall beside a roughly 0.95-tile dwarf, exposed narrow rods and pins, a single amber lamp eye, suspended rune tablet, small stone palms and an open basket. Shared walk/work/carry/hit/death poses drive its joints; it does not breathe, eat, sleep or train. The original Miner model remains available in the Character Model Studio for future reuse.

## Cave Hound companion

The saved [Cave Hound concept](concept-art/cave-hounds/README.md) guides a separate quadruped model: stocky charcoal coat, sandy muzzle and brows, pointed ears, leather collar/harness, rune tag and small amber lamp. Four legs trot in diagonal pairs; the head dips for scouting/feeding, the jaw animates bites, the tail moves and the body settles for sleep. It uses actual movement, job and combat state, supports reduced motion, and shares the existing hit/death cleanup without world labels.
