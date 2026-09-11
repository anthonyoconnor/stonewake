# Carved Stronghold sidebar production assets

These are purpose-made UI skins derived from the approved [concept A](../../../concept-art/sidebar/a-carved-stronghold-v1.png). The concept board itself is not used as a runtime asset. All text, icons, map contents and controls remain live HTML/canvas/SVG.

- `frame-v2.png`: empty basalt/bronze surround, generated with the built-in image generation tool. The sidebar scales the full frame to its responsive bounds.
- `socket-v2.png`: empty stone socket, generated with the built-in image generation tool. Its central material is sampled by CSS at a larger background size to avoid shrinking grain into noisy pixels.
- `bevel-v2.svg`: code-authored layered chamfered rim; nine-slicing keeps the corners and bevels readable on square buttons, wide headers and short disclosures. It replaced the generated socket's scaled rim after visual review.

The generated images contain no controls or lettering. Existing editable SVG icons were redrawn in `src/ui/icons.ts` to match the concept's broad ivory/bronze relief, with blue dormitory bedding and distinct tool silhouettes; the cursor shares the same artwork. No third-party images, font downloads or icon packs.

## Frame generation prompt

```text
Use case: ui-mockup. Asset type: production game UI background skin, NOT another concept board. Use the attached Carved Stronghold concept as STYLE REFERENCE. Generate a single EMPTY vertical dwarf-forged stone control-panel surround, viewed exactly straight on, orthographic, no perspective. Portrait aspect 1:3 approximately 512x1536. Entire image is the panel itself, edge to edge, no external margins. Central 88% of panel width: uninterrupted deep charcoal BLACK basalt slab with very fine mottled grain, small hairline fractures, subtle worn surface; flat calm dark surface, NOT large rock tiles or jagged natural bedrock. Outer 6% on each side: heavily sculpted stacked basalt edge pieces with restrained warm antique bronze angular inlays; reproduce the concept's double parallel metal rails, small beveled layered bronze edges, sharp geometric diagonal corner braces wrapping inward ONLY within the outermost 10% of width. Top and bottom outer 3% edges are matching narrow horizontal bronze-capped stone joints with angled corners. Medium contrast real material relief: silver-gray chipped stone edges, brass highlights and dark brown recessed bronze grooves. Tiny intentional rune-like geometric notches within the border only. Light from upper left. Clear material quality with carved stone, edge wear and metal depth exactly like input. Center should stay dark neutral black charcoal, not blue. NO text, NO wordmark, NO symbols in center, NO icons, NO buttons, NO panels within panels, NO minimap, NO inset images, NO annotations, NO glow, NO scenery. This image must be directly usable as the underlying EMPTY game sidebar background. We will put all live interactive controls on top.
```

## Socket generation prompt

```text
Use case: ui-mockup. Production game UI asset. Attached image is Carved Stronghold approved visual style reference. Make ONLY ONE EMPTY square button socket, exactly straight on, no perspective, large 1024x1024. Fill canvas edge to edge with this one square button. The button has subtly chamfered corners (corner cut 5% width). Layered rim occupies only the outermost 7% of the width on each side: black outer shadow, weathered charcoal carved stone bevel, a narrow dull pale bronze metal inlay with bright worn upper edges, black inner groove. Center 86% is flat deep near-black charcoal fine-grained basalt with fine mottled mineral grain, very faint hairline fissures. Reproduce the tactile button sockets from the reference, minimal restrained light at upper-left edge. Color of trim bronze beige, not orange, no large golden fill. No text, no glyph, no icon, no logo, no extra objects, no board, no examples. Match material weight and chiseled shape. Keep the square fully in frame, no background margin. The image will be used as a nine-slice button skin; therefore all fine bevels must stay within the outer 7% border and center must have no features.
```
