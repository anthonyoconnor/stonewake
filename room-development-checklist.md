# Room development checklist

Use this checklist for every room added to the browser game, beginning with the Treasure Room's shared-system review in M5 and then the Dormitory (M6), Kitchen (M7), and Workshop (M8). It is the reusable room-adding procedure requested in the [development plan](development-plan.md). Implementation is authorized; see the development plan for progress.

The current [room rules](rooms.md) define gameplay. The [room gallery](concept-art/rooms/README.md) and [approved terrain reference](concept-art/terrain/resource-terrain-v2.png) guide appearance; illustrated counts and footprints are not fixed templates. Keep unresolved sizes, costs, rates, and balance explicitly provisional.

## Adding a room

- [ ] **Read its design.** Identify the room's purpose, services, eligible users/workers, outputs, attraction conditions, visual identity, and any dependencies that are not implemented yet. Record the milestone's functional scope and any temporary debug fixtures.
- [ ] **Register the room definition.** Supply a stable type identifier, name, icon, floor/wall treatments, cost, service and `capacityPerTile`. Define cosmetic furnishing variants independently. Menus and the room catalog should consume the definition instead of adding special cases for each room name.
- [ ] **Use shared construction.** Support the same click/drag tile selection, placement preview, cancellation, validation, and expansion used by other rooms. Build only on eligible claimed floor; preserve terrain, core, and other occupied-space restrictions. Accept arbitrary footprints, including a fully functional single tile at the current default capacities.
- [ ] **Handle cost consistently.** Show and charge the configured construction/expansion cost through the shared path. Respect the development free-build flag for every room. Zero cost does not make invalid floor or an unreachable room usable.
- [ ] **Provide floor and wall identity.** The room must read before furniture fits, beside other rooms, and where walls are absent. Treat existing wall faces only; do not generate dividing walls or reinforcement as room decoration.
- [ ] **Define cosmetic furnishings.** Supply visual model, footprint and orientation options. Fit compact or larger variants automatically without stretching them. Keep entrances and routes visually clear. Removing every decorative object must leave capacity, movement, sight and function unchanged.
- [ ] **Handle expansion and geometry changes.** Recalculate service capacity from connected floor area, rounding down per component if the per-tile value is fractional. Update slots and affected reservations, and retain valid visuals where practical. Preserve displaced gold and earned progress; report lost access or capacity.
- [ ] **Connect the room's function.** Use room service slots for storage, accommodation, food support, or concurrent work. Route autonomous users to reachable room-floor positions independently of decoration. Reserve slots and release temporary occupancy after use. Training visits stop at one gained level, release capacity, then begin the dwarf's personal cooldown.
- [ ] **Connect attraction where applicable.** Describe requirements through reachable service capacity and spare accommodation/food support. Count existing residents before admitting more. Future dwarf types must be able to reuse the same services.
- [ ] **Add sidebar feedback.** Include construction choice, selection details, current usable capacity, occupancy/stock as appropriate, and clear cost/space/access limitations. Keep labels, numbers, and progress information out of the world view.
- [ ] **Add the room to the Room Debug View.** Make its implemented state clear and allow creation/expansion with the same grid controls and runtime systems as normal play. Verify the layouts below and inspect from several rotations and zoom levels.
- [ ] **Verify, document, and commit.** Playtest the room's function in the current game and debug view, check relevant failure cases, and confirm existing room behavior still works after shared changes. Record checks, provisional values, and any pending integrations in the development plan; keep related docs and art links current. Commit completed chunks and the milestone.

- [ ] **Update the current inventory.** Update the [current implementation status](development-plan.md#current-implementation-status) in the same completed chunk, including related dwarf availability and remaining integrations. Distinguish normal play, debug-only access, placeholders and design-only content; a milestone completion entry does not replace this update.

## Layout checks

Run these practical checks for every room. Compare tile count and capacity directly; do not impose minimum furniture footprints or square-room bonuses. Keep cosmetic arrangement checks separate from gameplay assertions.

| Layout or change | What to verify |
|---|---|
| Single tile | Receives the configured per-tile capacity and performs its service with or without furniture. |
| Compact room | Capacity equals floor area times the configured value; no object or access-footprint requirement. |
| Large rectangle | Each added floor square increases capacity by the same configured amount. |
| Narrow strip and bottleneck | Equal tile count gives equal capacity; decoration never changes passage or sight. |
| L shape, irregular wing, or branching footprint | Equal area gives equal capacity; broader sections can show larger cosmetic arrangements. |
| Retained ordinary earth and a continuous bedrock seam | Occupied terrain contributes no floor/capacity; objects and users respect the obstacles. |
| Adjacent different room types and an open cavern without walls | Floor identity stays readable and no separating walls appear automatically. |
| Separate patches, including corner-touching patches | Use the shared grouping rule consistently; do not treat unreachable capacity as usable. The prototype uses the edge-connected grouping rule recorded in rooms.md. |
| Expansion and newly opened wall/entrance | Update tile-based capacity and real access; preserve stored gold and progress. Decoration alone cannot invalidate jobs. |
| Entrance blocked by real terrain or a locked door | Users wait or choose a reachable alternative; feedback identifies the access problem. |
| Occupied slots and multiple users | Respect concurrent capacity, avoid duplicate support assignments, and release temporary reservations after use. Training cooldown does not hold a slot. |
| Furniture removed or rearranged | Capacity, recruitment, needs, work, routes, sight and gold remain unchanged. |
| Free-build flag on/off and insufficient gold | Creation and expansion use the effective cost and preserve all other placement rules. |

The debug view is a rapid development aid. A resettable test layout is sufficient; saved layouts, a public editor, and persistence are outside the current plan.

Room placement skips ineligible squares within a drag (terrain, hidden or unclaimed floor, the Hearthstone, and existing rooms). Eligible new squares are built and charged normally; existing rooms are preserved. Previews and price use the eligible subset. An entirely invalid selection builds nothing. The complete eligible subset must still be affordable unless free room construction is enabled.

## Implementation reference

Follow [Adding rooms and dwarf types](content-playbook.md) for exact source files, a copyable room definition and supported services/models. The room catalog and debug configuration use definitions automatically. Run reclaim/refund checks as well as placement checks: paid tiles refund part of original cost, free tiles refund zero, displaced gold is preserved, and active service jobs release safely. Kitchens have no food stock to preserve or regenerate.
