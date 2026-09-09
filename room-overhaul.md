# Room overhaul

The 2026-09-09 user brief supersedes the earlier dense furnishing arrangements. Rooms should read through distinctive ground, a few recognizable furnishings and open floor. Six individual concepts were generated with the built-in imagegen tool before their respective implementation passes; [concepts and exact prompts](concept-art/rooms/overhaul/prompts.md) are retained in the project. Illustrated walls and fixed rectangles are not construction requirements.

| Room | Current presentation |
|---|---|
| Treasure Room | Charcoal vault slabs with brass corner inlays and diamonds. Loose coin heaps replace room chests. Each connected room's stored wealth fills consecutive squares to their configured capacity before starting the next pile. Empty storage draws no heap. |
| Dormitory | Warm brown stone with woven bands. Only assigned living residents receive bedding: a red Warrior bed, ochre Engineer cot, blue rune headboard, green Hound den, or neutral Miner cot. Bed position follows the stable accommodation assignment while its owner is away. Stonehands receive none. |
| Kitchen | Terracotta and cream paving. One stove and one communal table with benches; a compact table serves as a visual fallback in smaller footprints. No repeated barrels, mushroom trays or cooking stations. |
| Workshop | Teal industrial slabs with brass guides. One main assembly bench, one anvil and one upright tool rack. Expansion creates work space and capacity without multiplying these props. The rack is readable from both sides. |
| Training Room | Red stone with circular practice marks. Four compact upright silhouettes: straw dummy, armored shield dummy, target post and padded striking pillar. No weight benches or horizontal apparatus; trainees practice standing strikes. |
| Library | Blue slate with silver borders, runes and stars. Long freestanding bookcases replace desk/shelf hybrids, with a small number of separate lecterns and open aisles. |

## Gameplay and layouts

The [room rules](rooms.md#placement-and-capacity) still own prices and floor-area capacity. Cosmetic furniture has no collision, sight blocking, required equipment count or additional staffing limits. The existing fixed starter treasury chest belongs to the Hearth and is preserved.

Gold piles are a read-only presentation of stored wealth within each connected Treasure Room. They do not transfer gold between services, reveal hidden stock, combine disconnected rooms, or display the starting allowance and loose undelivered gold. Spending updates piles; service removal spills its real stored gold through the ordinary conservation rules. The visible sequence is stable row order within each room.

Beds derive from real accommodation assignments rather than initial floor construction. Death, departure, lost access and reclaim remove or relocate bedding when support assignments update. Beds fit a single floor square at the default capacity. Debug capacity values above one pack smaller bedding into that service tile; the normal default remains unchanged. Residents can walk through bedding as with all other decorative props.

Each connected room has a small presentation budget. Layout selection works locally on usable floor, preserves valid props where practical, and promotes compact fallback furniture when a larger footprint fits. Separate patches operate independently. Single tiles, strips, bends, retained earth and bedrock do not lose gameplay capacity when furniture cannot fit. Workshop props deliberately stop growing once its equipment set fits.

## Iteration and references

- `src/content/room-visuals.ts`: floor palettes, furniture budgets, variants and limits, resident bedding.
- `src/game/room-decoration.ts`: sparse layout and read-only gold/bed presentation.
- `src/view/room-furnishing-models.ts` and `src/view/room-surfaces.ts`: current models and floor patterns.
- `src/view/furnishing-models.ts`: intact pre-overhaul furniture renderer. The existing terrain comparison draws this renderer with its independent starting materials on the left.
- `src/game/room-decoration-baseline.ts`: permanent original automatic layout used by that reference side. Existing `*-baseline.ts` archives are unchanged.

Use **Debug → Test harnesses → Room layouts** for normal construction, varied shapes, free construction and test arrivals. For a 5×5 comparison, run `node scripts/room-overhaul-browser.mjs` with the local server running. It creates six matching camera captures, reverse views, empty Treasury/Dormitory views, and a concept/runtime gallery at `test-results/room-overhaul/index.html`. Its populated Treasury and four-role Dormitory use explicit test setup. All room building, spending, reclaim and resident spawning use the gameplay systems.

Verification scope: `npm run verify -- room-overhaul --browser=room-overhaul`. Covers room layouts, capacity, services, access, reclaim, free building, ruins, source lighting, room extensions, dynamic piles/beds and reference preservation. Images are prototype geometry: material microdetail and furnishings are simplified from the concepts; normal gameplay source lighting is retained.
