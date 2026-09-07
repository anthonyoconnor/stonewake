# Room development checklist

Use this checklist for every room added to the browser game, beginning with the Treasure Room's shared-system review in M5 and then the Dormitory (M6), Kitchen (M7), and Workshop (M8). It is the reusable room-adding procedure requested in the [development plan](development-plan.md). Implementation is authorized; see the development plan for progress.

The current [room rules](rooms.md) define gameplay. The [room gallery](concept-art/rooms/README.md) and [approved terrain reference](concept-art/terrain/resource-terrain-v2.png) guide appearance; illustrated counts and footprints are not fixed templates. Keep unresolved sizes, costs, rates, and balance explicitly provisional.

## Adding a room

- [ ] **Read its design.** Identify the room's purpose, services, eligible users/workers, outputs, attraction conditions, visual identity, and any dependencies that are not implemented yet. Record the milestone's functional scope and any temporary debug fixtures.
- [ ] **Register the room definition.** Supply a stable type identifier, name, icon, floor/wall treatments, cost, furnishing variants, capacities, services, and capability requirements. Menus and the room catalog should consume the definition instead of adding special cases for each room name.
- [ ] **Use shared construction.** Support the same click/drag tile selection, placement preview, cancellation, validation, and expansion used by other rooms. Build only on eligible claimed floor; preserve terrain, core, and other occupied-space restrictions. Accept arbitrary footprints, including a single tile with zero usable capacity.
- [ ] **Handle cost consistently.** Show and charge the configured construction/expansion cost through the shared path. Respect the development free-build flag for every room. Zero cost does not make invalid floor or an inaccessible furnishing usable.
- [ ] **Provide floor and wall identity.** The room must read before furniture fits, beside other rooms, and where walls are absent. Treat existing wall faces only; do not generate dividing walls or reinforcement as room decoration.
- [ ] **Define and fit furnishings.** Give each functional object its actual footprint, orientation options, access/working space, capacity, and service. Fit compact or larger variants automatically without stretching them. Preserve entrances and continuous movement routes around obstacles.
- [ ] **Handle expansion and geometry changes.** Recalculate furnishing validity, usable capacity, and affected routes. Retain valid objects where practical and preserve stored contents and resident assignments when arrangements change. Report lost access or capacity rather than silently discarding resources.
- [ ] **Connect the room's function.** Use real usable facilities for storage, accommodation, food, or work. Route autonomous users to reachable positions, reserve occupied facilities as needed, and release them after use. Keep simulation values and visible contents consistent. Implement new shared services only when this room needs them.
- [ ] **Connect attraction where applicable.** Describe requirements through services, accessible capacity, and settlement support. A room designation alone does not qualify a specialist. Future dwarf types must be able to reuse shared facilities.
- [ ] **Add sidebar feedback.** Include construction choice, selection details, current usable capacity, occupancy/stock as appropriate, and clear cost/space/access limitations. Keep labels, numbers, and progress information out of the world view.
- [ ] **Add the room to the Room Debug View.** Make its implemented state clear and allow creation/expansion with the same grid controls and runtime systems as normal play. Verify the layouts below and inspect from several rotations and zoom levels.
- [ ] **Verify, document, and commit.** Playtest the room's function in the current game and debug view, check relevant failure cases, and confirm existing room behavior still works after shared changes. Record checks, provisional values, and any pending integrations in the development plan; keep related docs and art links current. Commit completed chunks and the milestone.

## Layout checks

Run these practical checks for every room. Use the actual furnishing footprints to choose dimensions; do not impose universal room sizes or square-room bonuses.

| Layout or change | What to verify |
|---|---|
| Single tile / too little usable space | Designation and room identity remain valid; no fitting facility means zero corresponding capacity and an explanation in the sidebar. |
| Compact functional room | A usable facility appears only when its footprint and access fit. |
| Large rectangle | Additional usable furnishings increase capacity while preserving circulation. |
| Narrow strip and bottleneck | Circulation stays open; furnishings cannot seal a passage. |
| L shape, irregular wing, or branching footprint | Wider parts can furnish independently of narrow connecting sections. |
| Retained ordinary earth and a continuous bedrock seam | Occupied terrain contributes no floor/capacity; objects and users respect the obstacles. |
| Adjacent different room types and an open cavern without walls | Floor identity stays readable and no separating walls appear automatically. |
| Separate patches, including corner-touching patches | Use the shared grouping rule consistently; do not treat unreachable capacity as usable. The prototype uses the edge-connected grouping rule recorded in rooms.md. |
| Expansion and newly opened wall/entrance | Preserve valid furnishings and contents, update access, and avoid blocking old routes. |
| Blocked entrance or unusable facility | Users wait or choose a reachable alternative; capacity and feedback reflect the access problem. |
| Occupied facilities and multiple users | Avoid duplicate assignments or double-counted capacity; users can enter and leave. |
| Free-build flag on/off and insufficient gold | Creation and expansion use the effective cost and preserve all other placement rules. |

The debug view is a rapid development aid. A resettable test layout is sufficient; saved layouts, a public editor, and persistence are outside the current plan.

Room placement skips ineligible squares within a drag (terrain, hidden or unclaimed floor, the Hearthstone, and existing rooms). Eligible new squares are built and charged normally; existing rooms are preserved. Previews and price use the eligible subset. An entirely invalid selection builds nothing. The complete eligible subset must still be affordable unless free room construction is enabled.

## Implementation reference

Follow [Adding rooms and dwarf types](content-playbook.md) for exact source files, a copyable room definition, supported services/models and the verified additive-content tests. The room catalog and debug configuration use definitions automatically. Run reclaim/refund tests as well as placement tests: paid tiles refund part of original cost, free tiles refund zero, displaced gold and food are preserved, and active service jobs release safely.
