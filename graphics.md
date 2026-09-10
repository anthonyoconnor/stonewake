# Rendering, animation and lighting

The game uses editable Babylon.js geometry and materials. Gameplay state owns movement, actions, damage and visibility; rendering observes it. Keep one terrain layer and common floor height, recognizable silhouettes at ordinary overhead zoom, and all numbers/status text in the sidebar.

## Current visual references

| Area | Active guide |
|---|---|
| Six resident and ten enemy models, terrain materials, original/current studios | [Character and terrain graphics](graphics-overhaul.md) |
| Sparse furniture, per-room floors, gold piles and assigned bedding | [Room presentation](room-overhaul.md) |
| Nine spells, two traps and both Hearthstones | [Arcana presentation](arcana-overhaul.md) |
| Level geography, local atmosphere and concept interpretation | [Level overhaul](level-overhaul.md) / [level concepts](concept-art/levels/overhaul/README.md) |
| Approved concepts and generation prompts | [Concept gallery](concept-art/README.md) |
| Runtime terrain maps and provenance | [Terrain assets](public/art/terrain/README.md) |

The room and arcana guides supersede earlier furnishing and effect descriptions. Preserve all `*-baseline.ts` sources, independent reference materials and the original room layout used by comparison studios. Those factories are permanent inspection tools; historical captures alone do not replace them.

## Underground lighting

Ordinary Campaign and Free Play use subdued biome ambient light, six reusable local source slots, and a separate prioritized pointer light. Nearby discovered wall lamps, Hearths, lava, gems and suitable growth provide source pools. Concealed resources remain visible under the ordinary resource exception but do not illuminate their surroundings. Pointer light follows the actual hovered surface during pan, orbit and zoom, and disappears over UI, dialogs, menus, unknown tiles and outside the viewport.

Tile-based terrain rays and mesh masks limit illumination after walls. This is presentation occlusion, not gameplay sight or detailed cast shadows. Source selection follows the camera and can change which pools are visible. Settings have no flicker, support reduced motion, and clean up on world replacement.

Terrain pieces share their tile's occlusion sample, while actors share their model root's sample. Static masks are reused until geometry or a light's position/range changes; actor masks refresh at the existing short cadence. Furnishings and Hearth pieces retain their individual sample positions. This preserves the light boundaries while avoiding repeated rays through unchanged terrain.

Defaults and budgets live in [lighting definitions](src/content/lighting.ts); shared source selection and masking live in [lighting service](src/view/lighting-lab.ts). [Environment definitions](src/content/environment-visuals.ts) own biome palettes and sparse visible growth. Cosmetic furnishings never block light through gameplay navigation or alter service capacity.

## Local environment regions

Authored `environmentRegions` give different places within a level their own treatment. Each region has an ID, a kind and ordinary tile cells. Later entries win overlaps; cells without a region use the biome fallback. Include the adjoining terrain cells when a local wall face should match its floor. The world clones region data on creation; the region lookup caches by array identity, so a live debug edit should replace the array.

| Kind | Visible treatment |
|---|---|
| `dry` | Warm cut earth and sparse strapped timber supports along walls |
| `damp` | Muted wet ground, low shore fragments and wall mineral streaks |
| `fungal` | Uneven colonies of mixed-height caps, occasional wall silk and restrained cool light |
| `masonry` | Pale paving, wall pilasters, carved recesses and broken coping |
| `crystal` | Cool mineral faces and sparse low pale quartz clusters |
| `scorched` | Darkened earth/rock and charred bank fragments near volcanic ground |

Regions tint raw floor and ordinary earth/rock; rooms, resources, reinforced walls and claimed paving retain their recognizable gameplay materials. Decorations appear in deterministic sparse patches along discovered walls or suitable shores, leaving broad cave centers clear. Claimed non-room floors retain authored dry timber and masonry structures. Other regional dressing clears on claiming, and all regional dressing clears when a real room is built. Props are unpickable presentation geometry and contribute no collision or room capacity.

Fungal and crystal light candidates follow the same discovered decoration selection as the meshes. Sparse decorative quartz has a smaller pale silhouette than an actual persistent income gem. Region names and colors do not change terrain, navigation, discovery, enemy habitats, biome-wide ambient lighting or construction rules. Water/lava remain the only bridgeable hazards; concept-art stairs, raised floors and chasm bridges do not become mechanics.

[Environment regions](src/content/environment-regions.ts) owns lookup and cluster selection; [environment palettes](src/content/environment-visuals.ts) owns color definitions. [Environment geometry](src/view/environment.ts), [terrain materials](src/view/terrain-materials.ts) and [scene lifecycle](src/view/scene.ts) render them through the existing tile and material caches. Permanent baseline renderers keep their original growth predicate and independent materials.

## Lighting test room

The UI currently labels this harness **M33 lighting test room**, under **Debug → Test harnesses**; its stable scenario is `lighting`. It starts paused with furnished rooms, narrow/irregular layouts, retained bedrock, water/lava crossings and a sealed fog pocket. The allowance, sample actors and completed bridges are explicit test setup; room construction uses normal paid/free services.

Use its comparison toggle, camera views, ambient/directional/source/glow sliders and pointer controls to inspect lighting. Reset restores defaults. Rooms reopens its controls after inspection; Return to stronghold restores the retained world and prior pause state. Test settings affect only the harness. During development, `?scenario=lighting&paused=1` opens it directly.

## Animation and lifecycle

Resident strides follow traveled distance. Jobs drive mining, reinforcement, claiming, hauling, wall/bridge work, crafting, research, training, eating and rest. Hounds turn by the shortest angular path. Actual attack timestamps drive dwarf swings, hound bites, enemy contact and audio, including changes from levels and Haste. Instant-hit ranged abilities show contact feedback without delaying actual damage for a cosmetic projectile.

Enemy bodies stay at their authoritative continuous positions. Pausing freezes simulation-driven turns and poses; display galleries have separate preview playback. Damage causes restrained recoil, death a brief fall and disposal; ordinary departure is not a death animation. Reduced motion suppresses decorative bobbing, tail motion, particles and pulses while retaining useful action poses.

Model construction lives in resident/dwarf/enemy sculpt modules; scene lifecycle is in [scene.ts](src/view/scene.ts). Room models and floors use the files listed in [room presentation](room-overhaul.md#iteration-and-references). Static pieces merge within their material and animated pivot. Baseline/current materials must never share mutable caches.

## Static scene visibility

Finalized terrain and furniture freeze their world matrices and register with [static mesh candidates](src/view/static-mesh-candidates.ts). The candidate provider reuses their frustum results while the camera matrix, mesh world matrix and culling strategy stay unchanged. It compares actual camera matrix values because glow rendering can rewrite Babylon's matrix update marker without moving the camera. Register only completed, immutable geometry; moving residents, effects and other unregistered meshes keep ordinary per-frame evaluation.

The provider walks the live mesh array in its original order, so new discovery, arrivals and disposal remain visible immediately. Camera movement invalidates the cached results; force-active meshes and disabled frustum clipping retain their normal behavior. Babylon still checks readiness, visibility, enabled state and active meshes. Picking uses the full scene. Replacing the world releases the old cache and result buffer. This reduces offscreen static work without freezing the active mesh list or changing resolution, antialiasing, glow or lighting quality.

## Verification and limits

Use the focused browser scopes documented in [development tools](development-tools.md): graphics-gallery, terrain-comparison, room-overhaul, arcana, lighting or animation according to the change. Level changes use selectable whole-map comparisons, ordinary fogged play and normal/reverse-angle views through the [level review flow](development-tools.md#level-redesign-review). Revealed dressing inspection is separate from paid gameplay evidence. The level profiler compares identical developed worlds with local atmosphere present and removed; its results isolate that presentation cost. Environment profiling uses one browser workload and a stable source tree; avoid HMR, other browser loads and CPU-heavy checks while measuring.

Geometry approximates the concept sheets; cloth/finger articulation, foot IK and exact furniture contact are absent or simplified. Close crowds/equipment can intersect. Surface normal maps approximate fine detail, and contact treatment does not supply full detailed cast shadows. Dense furnished scenes remain heavier than arrivals on integrated graphics. Historical measurements and completed audits are in [archived graphics notes](archive/graphics-pass.md) and [overhaul records](archive/previous-docs/graphics-overhaul.md); remeasure current code before claiming a performance result.
