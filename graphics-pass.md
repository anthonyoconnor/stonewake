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
| [Miner](concept-art/dwarfs/miner-v1.png) | Broad ochre tunic, helmet lamp, clasped beard, curved pick, heavy boots and visible carrying satchel |
| [Female Engineer](concept-art/dwarfs/engineer-v3.png) | Teal clothing, apron, twin braids, goggles, tool pack and hammer |

## Activity and iteration

`src/view/residents.ts` derives poses from actual jobs and paths: alternating steps and body bob, facing the work target, mining/tool swings, a low claiming pose, a swaying full satchel, hand-to-mouth eating, and lying on the assigned bed with quiet breathing. Engineering uses the same shared movement and need animations.

`src/view/effects.ts` provides a bounded, reused pool for excavation dust, craft sparks and cooking steam. Effects follow actual work or food stock. The Hearthstone and lanterns use subtle light changes. Reduced-motion preference disables particles and light modulation. Effects have no collision, capacity, discovery or economic role and contain no world text.

`src/view/surfaces.ts` provides the room palette and generated paving, brass motifs, rough stone and timber textures. Scene geometry includes contact shadows, wall-foot shading, lanterns and fittings on existing walls. Furnishings retain the gameplay footprints used by navigation; decoration does not add walls or capacity.

Use **Debug → Load visual showcase** for a repeatable scene containing every implemented room, a mining crew, an Engineer, actual test stock, loose gold, excavation marks and two production orders. The regular Room Layout Studio remains the place to inspect arbitrary shapes and expansion with normal construction tools.

The result is a stylized procedural prototype, not a reproduction of the concept sheets' illustration detail. Sculpted meshes, authored texture sets, skeletal animation, audio, advanced shadows and cinematic effects remain optional future art work. They are not prerequisites for rapid gameplay iteration.

## Verification

Reviewed normal terrain/core and the four-room showcase at several rotations and zoom levels. The showcase exercised mining, claiming, delivery, rest and meals for all four residents, and completed both Workshop recipes. Sleeping characters align with assigned beds; food, stored gold and crafted props follow their actual state. The final browser console had no errors. All 20 simulation checks, the final TypeScript/browser build and local documentation-link checks passed.

Unchanged furnishing meshes are retained, static parts sharing a material draw together, and the glow layer includes only emissive objects. This keeps common stock and job updates from rebuilding the whole room scene. Showcase setup yields between room builds to keep input responsive.
