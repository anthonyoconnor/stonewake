# Development archive

Historical context only. Current behavior, remaining review and development instructions start in the [project guide](../README.md) and [current development notes](../development-plan.md). Old requirements, numbers and authorizations may be superseded; they do not queue new implementation work.

## Records

| Record | Contents |
|---|---|
| [Development history](development-history.md) | Completed specifications, implementation decisions and dated verification |
| [M35–M42 level overhaul specifications](previous-docs/level-overhaul.md) | Original dependencies, concept-first requirement, individual redesign scope and provisional size targets; current rules remain in the root guide |
| [Earlier graphics passes](graphics-pass.md) | Initial graphics/animation audits, lighting integration and historical performance samples |
| [Former development plan](previous-docs/development-plan.md) | Milestone-era status, detailed baseline and sound/music acceptance criteria |
| [Former project instructions](previous-docs/project-instructions.md) | Prior milestone and overhaul authorization sequence |
| [Former game rules](previous-docs/game-rules.md) | Earlier mixed implementation rules and unresolved proposals |
| [Former character rules](previous-docs/characters.md) | Superseded role proposals and measured combat matchups |
| [Former room rules](previous-docs/rooms.md) | Earlier room, repair, Hearth and progression proposals |
| [Former level rules](previous-docs/levels.md) | Original candidate maps and superseded campaign assumptions |
| [Former interface notes](previous-docs/gameplay-interface.md) | Earlier UI proposals and milestone descriptions |
| [Character/terrain overhaul record](previous-docs/graphics-overhaul.md) | Per-model before/after audit, completed checks and measured rendering performance |
| [Arcana overhaul record](previous-docs/arcana-overhaul.md) | Spell/trap/Hearth visual iterations and integration checks |
| [Former README](previous-docs/README.md) | Previous project overview and accumulated development notes |

Snapshots preserve the documents as they stood before this cleanup, with relative links adjusted for their archive location. Current versions of those guides remain at the project root. Commands and plain code paths in historical text assume the repository root. Images, exact generation prompts and runtime asset provenance remain beside their assets because they support visual development; historical prompts do not define current gameplay. Original renderer sources and independent comparison materials remain in their existing source locations.

## Milestone index

This is the retired milestone tracker. All retained implementation milestones are complete except the sound/music listening review. That review remains explicit in the [active notes](../development-plan.md#remaining-review), without keeping a milestone backlog in startup documentation.

| Milestone | Scope | Archived status |
|---|---|---|
| M1 | Grid level and terrain | Complete |
| M2 | Camera controls | Complete |
| M3 | Basic sidebar and minimap | Complete |
| M4 | Mining, excavation, claiming and treasure | Complete |
| M5 | Shared room rules and room debugging | Complete |
| M5.1 | Debug menu and free room construction | Complete |
| M6 | Dormitory | Complete |
| M7 | Kitchen | Complete |
| M8 | Workshop | Complete |
| M9 | Initial graphics and animation pass | Complete |
| M10 | Enemy encounters, camps and raids | Complete |
| M11 | Hearth defense, defeat and onward objective | Complete |
| M12 | Removed from the active roadmap | Removed |
| M13 | Paid Miner recruitment and wages | Complete; normal recruitment subsequently replaced by Stonehands |
| M14 | Dissatisfaction, alerts and departure | Complete |
| M15 | Removed from the active roadmap | Removed |
| M16 | Bridges and hazardous terrain | Complete |
| M17 | Ten enemies and distinct behaviors | Complete |
| M18 | Campaign and Hearthstone travel | Complete |
| M19 | Integrated balance and full-level playtesting | Complete |
| M20 | Player interface and left panel cleanup | Complete |
| M21 | Terrain and environment graphics | Complete |
| M22 | Character models and animations | Complete |
| M23 | Stonehand work priorities | Complete |
| M24 | Cave Hound and specialist combat balance | Complete |
| M25 | Starting menu and Free Play | Complete |
| M25.1 | Themed startup and loading screens | Complete |
| M26 | Campaign structure and gradual unlocks | Complete |
| M27 | Living biomes and recurring enemy pressure | Complete |
| M28 | Discoverable, reclaimable dwarven ruins | Complete |
| M29 | Authored campaign maps and resource-led exploration | Complete |
| M30 | Sound and music foundation | Implemented; automated checks passed; listening review pending |
| M31 | Environment and room graphics refinement | Complete |
| M32 | Character animation and combat readability | Complete |
| M33 | Underground lighting and pointer illumination | Complete |
| M34 | Left-edge camera panning across the sidebar | Complete |
| M35 | Concept-led level briefs, independent comparisons and authoring groundwork | Complete |
| M36 | Border Foothold sheltered mining geography | Complete |
| M37 | Fungal Hollows cavern basins and colonies | Complete |
| M38 | Fallen City streets and reclaimable districts | Complete |
| M39 | Crystal Divide fracture routes and optional mineral expeditions | Complete |
| M40 | Royal Deep lava basin and peninsula districts | Complete |
| M41 | Campaign identity, pacing, travel and active late-level performance review | Complete; integrated-GPU performance limits retained |
| M42 | Seven distinct standalone Free Play redesigns | Complete |

Later character/terrain, spell/trap/Hearth and room overhauls, comparison controls, debug navigation and level previews are recorded in development history. Their active controls and preservation rules remain in the current visual and development guides.

## Adding records

Append dated completion and verification to development history. Archive superseded proposals when they stop helping active development, with a link to the current owner. Keep current unresolved work and practical limits in the active notes. Historical commands, screenshots and test counts record what ran at that time; ignored local artifacts may not be present in a fresh checkout.
