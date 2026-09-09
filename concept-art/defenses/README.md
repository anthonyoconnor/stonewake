# Trap concepts and model review

The two implemented trap types had no individual concept sheets before this pass. These images were generated for this project with the built-in imagegen tool on 2026-09-09; their exact prompts are retained beside them. They are model references, not runtime textures. Doors retain their existing models and behavior.

| Item | Reference | Model interpretation |
|---|---|---|
| Spike trap | [spike-trap-v1.png](spike-trap-v1.png), [prompt](spike-trap-v1-prompt.md) | One-square dark chamfered housing; four bronze caps and inset hex bolts; nine square sockets and bronze guide collars; nine forged diamond-section spikes with pale steel points; small slatted pressure edges and restrained blue diamond inlays. |
| Bolt trap | [bolt-trap-v1.png](bolt-trap-v1.png), [prompt](bolt-trap-v1-prompt.md) | One-square mounting plate; low bearing and braced cradle; split walnut rail and dark center groove; swept forged bow limbs, pale V string, bronze nocks; paired toothed winding wheels, cord-wrapped drum, fletched loaded/projectile bolt and directional brass inlay. |

The starting geometry and trap animation sampling are preserved in [defenses-baseline.ts](../../src/view/defenses-baseline.ts) with frozen [geometry helpers](../../src/view/arcana-environment-baseline.ts) and the gallery's isolated reference materials. The final [trap factory](../../src/view/trap-models.ts) is shared by gameplay and the permanent comparison room. Static pieces merge by material while the spikes, carriage, loaded bolt, projectile and winding wheels keep their animation pivots.

The spike presentation retains the simulation's trigger and two-second pin interval. The crossbow faces the actual compass direction, sends its bolt along the actual shot segment, recoils and winds during automatic reset; its loaded bolt returns when the trap is ready. Reduced motion preserves readable functional states while suppressing recoil, wheel motion and the traveling projectile. Traps retain their existing movement, placement, damage, reset and stock rules.

The concept's engraved microdetail and continuous curved metal are approximated with deterministic shared surface maps, chamfers and short limb segments. The comparison room provides close inspection without changing the native single-tile scale. Browser review evidence is recorded in the overhaul record after inspection.

The first paired browser review in `test-results/arcana-gallery-first/` prompted a second pass: wider and slightly shorter spike bodies, larger visible retracted points, less yellow bronze, and irregular scuffed patches on metal. The crossbow's loaded/projectile arrowhead was aligned exactly with the firing rail. The forged limb silhouette, pale V string, rear winding mechanism and visible directional inlay were retained after front/back/three-quarter comparison.

The subsequent refined-only close views in `test-results/arcana-gallery-final/` confirmed the crossbow's materials and mechanism silhouette. They also exposed tiny redundant bevel strips poking through spike points; those strips were removed, leaving clean four-facet steel tips. The final spike close review in `test-results/arcana-gallery-polish/` confirms the clean points and preserved sockets, corner caps and pressure edging. No further geometry changes followed that review.
