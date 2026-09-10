# Dungeon Keeper: level variety and proposals for Stonewake

Research and design proposals, 9 September 2026. These are options for discussion, not approved changes to the campaign or game rules.

**Follow-up roadmap:** the user subsequently requested milestones to redo every level and make levels larger, especially later ones. [Campaign level overhaul](../level-overhaul.md) is now the active planning specification; its sequence, scope and size targets supersede the experiment order suggested in this research. The reference findings below remain research context.

## Main finding

Our largest opportunity is to change the **shape of the strategic problem** from level to level. Then reinforce that difference with terrain silhouettes, architectural composition and local atmosphere.

Dungeon Keeper demonstrates that a square construction grid can support a convincing underground world. Organic does not require freeform excavation or multiple floor heights. It comes from relationships: a river cuts between landmasses, a fortress occupies a defensible site, old rooms interrupt natural rock, and opening a passage connects previously separated inhabitants.

My recommendation is to prototype a substantially different Fungal Hollows layout first, then a Fallen City with recognizable streets and districts. These would test natural and architectural variety using our existing systems.

## Research scope and evidence

I compared the original Dungeon Keeper campaign, selected level descriptions, original map images, Dungeon Keeper 2's manual and editor guidance, and our current source/design documents. I inspected the original Hearth and Woodly Rhyme map images, a DK2 gameplay image, our saved Fungal Hollows level-preview capture, and the approved Fungal Caves concept.

This was a source and visual review, not a fresh playthrough. The local screenshot is an existing development capture, not a new browser verification. Gameplay claims below come from the cited references; recommendations and explanations of why a composition feels organic are my design interpretation.

The DK2 editor manual is a mirror of the official manual explicitly marked as modified by fans. Use it for the documented level-design workflow, not as proof that every detail is unchanged from release. KeeperFX is separately identified as a fan expansion and includes modified/remade data and additional capabilities; its modern textures, scripts and custom maps should not be attributed wholesale to the 1997 game. [Editor manual](https://keeper.lubiki.pl/dk2_docs/dk2_editor_manual.htm), [KeeperFX's own description](https://keeperfx.net/wiki/home).

## What kinds of levels the series supports

There are two useful meanings of “level type”: selectable modes and the situations a map creates.

### Modes and content families

- **Original DK campaign:** an authored sequence, with hidden bonus levels and a separate multiplayer map catalog. The map collections show considerable variation in landmass outlines and internal organization. [Campaign map gallery](https://dungeonkeeper.gamecoyote.com/maps.php), [level catalog](https://dungeonkeeper.fandom.com/wiki/Blaise_End).
- **The Deeper Dungeons:** a separate expansion map set, useful as further authored-scenario references rather than evidence of a different terrain engine. [Expansion map gallery](https://dungeonkeeper.gamecoyote.com/deeperdungeons.php).
- **Secret challenges:** some change the form of play dramatically. Secret 1 emphasizes possessed-creature, first-person play. This illustrates scenario variety, but possession is not a sensible requirement for our current project. [Secret 1](https://dungeonkeeper.fandom.com/wiki/Secret_1).
- **DK2:** supports single-player scenarios, multiplayer, AI skirmish and My Pet Dungeon. The latter emphasizes building and optional player-triggered invasions rather than ordinary campaign pressure. [Editor manual](https://keeper.lubiki.pl/dk2_docs/dk2_editor_manual.htm), [DK2 manual, My Pet Dungeon section](https://retrogamer.biz/wp-content/uploads/2016/06/Dungeon-Keeper-2-Manual.pdf).
- **KeeperFX/custom maps:** broaden the catalog further, but belong in a separate comparison category. [KeeperFX](https://keeperfx.net/).

We can borrow the spatial and pacing lessons without adding multiplayer, a competing dungeon economy, possession, or new victory systems.

### Useful scenario archetypes

These are analytical categories, not official menu labels.

| Archetype | Concrete reference | What changes for the player | Transfer to our game |
|---|---|---|---|
| Surrounded stronghold | **Hearth, DK1 level 11:** a prebuilt dungeon with attacks from four sides | Defending several approaches matters more than digging toward one distant enemy | A later-level Hearth amid buried districts; the player chooses which approaches to expose |
| River and contested center | **Woodly Rhyme, DK1 level 15:** three Keepers, a central hero dungeon and a river system | Expanding into the water can create a dangerous connection; resources and neighboring territories affect opportunity | Branching caverns or flooded workings with a central destination and routes that alter defense |
| Fortress assault | **Blaise End, DK1 level 18:** a heavily defended hero fortress, patrols, traps and reinforcements | Penetrating an established place has a different rhythm from occupying wilderness | Fallen City's gate district, service passages and buried rear approach |
| Rival territorial conflict | **Skybird Trill, DK1 level 20:** hero and rival-Keeper opposition | The map contains powerful occupied territories, not just scattered encounters | Distinct hostile districts with existing camps and reinforcement sources; a true rival builder would be a separate large feature |
| Exploration/reward map | DK2 editor places neutral rooms, creatures and resource rewards | A discovery changes available space, strength or development opportunities | Reclaimable rooms, optional gold and defended gems using current rules |
| Relaxed construction | DK2 My Pet Dungeon | Less automatic pressure gives the player time to arrange and observe a dungeon | Optional future Free Play pressure setting, separate from campaign balance |

References: [Hearth](https://dungeonkeeper.fandom.com/wiki/Hearth), [Woodly Rhyme](https://dungeonkeeper.fandom.com/wiki/Woodly_Rhyme), [Blaise End](https://dungeonkeeper.fandom.com/wiki/Blaise_End), [Skybird Trill](https://dungeonkeeper.fandom.com/wiki/Skybird_Trill), [DK2 editor](https://keeper.lubiki.pl/dk2_docs/dk2_editor_manual.htm), [DK2 manual](https://retrogamer.biz/wp-content/uploads/2016/06/Dungeon-Keeper-2-Manual.pdf).

**Transfer caveat:** water rules differ between games. Woodly Rhyme's water can expose an invasion route; our water is impassable until bridged. Borrow the idea of an opened connection creating risk, not that exact movement behavior. In our pre-bridge campaign areas, required routes must remain on land. See [our terrain and bridge rules](../levels.md#terrain-and-hidden-spaces).

## Why the references feel more organic

### Large shapes organize the small tiles

Woodly Rhyme's map reads as several landmasses divided by a branching waterway, with a built complex in the middle. Hearth reads as a central stronghold and radial approaches. Their silhouettes communicate different situations before furniture or materials are considered. Neither needs every boundary to be irregular: Hearth is conspicuously structured. [Original map images](https://dungeonkeeper.gamecoyote.com/maps.php).

The lesson is **coherent geography and contrast**, not universal asymmetry. A ceremonial hall should look deliberately built. Its surrounding caves should look as though they formed differently.

### Construction and wilderness have different visual rules

In the inspected DK2 image, masonry, substantial wall divisions, door-like openings, warm illumination and the Dungeon Heart's large silhouette give a room an architectural identity. Rough surfaces and darker recesses keep it from reading as an evenly lit board. This is an observation of the image, not a claim about the renderer's internal algorithms. [DK2 gameplay reference](https://www.activewin.com/reviews/software/games/d/images/dk2_1.jpg).

For us, the equivalent should be warm dwarven habitation against damp caves, cold abandoned masonry and hostile volcanic ground. We do not need the series' torture-room imagery or infernal visual language.

### Space has a history and a purpose

A stream widening into a pool, an intact street cut by collapse, or a nest at the end of a sheltered branch suggests why a place exists. The player's excavation then becomes the latest event in that history. Randomly distributing mushrooms across otherwise similar rooms does much less.

The editor's design advice supports this approach: establish a unifying concept, plan the map and events, use terrain/resources to pull players toward destinations, and playtest. [DK2 editor, section 11](https://keeper.lubiki.pl/dk2_docs/dk2_editor_manual.htm).

## What our current implementation is doing

The underlying systems already support much of the desired result: irregular room footprints, hidden caverns, source-based light, continuous autonomous movement, neutral ruins, local habitats, gold-led exploration and physical suppression of raid entrances. This is an authoring and composition opportunity before it is an engine rewrite.

Specific sources of repetition:

1. **One campaign skeleton.** The shared `base()` places every Hearth at `x = 6, z = height - 8`, every relay at `x = width - 6, z = 7`, the same 5×5 start and the same nearby gold arrangement. Every campaign also has a broken vertical bedrock barrier at `x = 16`. Royal Deep adds a straight lava divide. This creates the recurring southwest-to-northeast journey. [Campaign definitions](../src/content/campaign-levels.ts).
2. **Rectangular opening vocabulary.** Caverns are authored as overlapping rectangles, and many seams as straight rows/columns. Overlaps create bends, but the repeated construction method remains legible at whole-map scale. Arbitrary cell terrain already exists through seams, so richer shapes need only small authoring helpers. [World construction](../src/game/world.ts).
3. **Biome mostly applies to the whole world.** Palettes use `w.biome`; fungal/crystal growth uses a coordinate modulo eligibility rule. These establish identity but provide little authored variation between a damp hollow, a dry chamber and a heavily colonized nest within one map. [Environment definitions](../src/content/environment-visuals.ts).
4. **Ruins are small reusable fragments.** The current waystation, foundry and archive are two-room remnants. They work mechanically, but do not alone convey an entire street, industrial quarter or civic hall. [Ruin templates](../src/content/ruins.ts).
5. **Fine terrain treatment already exists.** Continuous surface coordinates and fractured wall-face geometry are implemented. More per-tile noise would target a smaller issue than the repeated large-scale structure. [Terrain sculpting](../src/view/terrain-sculpt.ts).

The saved Fungal Hollows overview shows a large, mostly uniform western earth mass and compact eastern openings. The approved fungal concept has much more spatial rhythm and clustered wall growth, although it depicts an explored section rather than an entire map. This is a composition reference, not an equal-scale performance or screenshot comparison.

## Proposals

### 1. Give each campaign a distinct spatial identity — highest priority

Keep the current unlock order and onward-Hearthstone objective. Change how the player establishes space, finds resources and approaches that objective.

| Level | Proposed organizing shape | Look and feel | Distinct decision |
|---|---|---|---|
| **Border Foothold** | A sheltered side basin beside a branching, abandoned mining route | Dry stone, timber remnants, warm isolated lamps, short exposed mineral seams | Break into an old route early for gold, or expand the safe basin first |
| **Fungal Hollows** | A broad irregular wet cavern with lobes, narrow necks and land loops around pools | Damp edges, clusters of large fungi, webbed recesses and stretches of bare floor | Take a short exposed route through the brood territory or excavate a safer route around it |
| **Fallen City** | A buried street network with a central junction and distinct ruined districts | Straight masonry, thresholds, fragments of paving, blocked side halls, cave intrusions | Reclaim useful service rooms first or shorten the assault through a more exposed street |
| **Crystal Divide** | A branching bedrock spine and a crescent-shaped chasm; routes wrap around its ends | Broad pale fractures, a few large crystal groups, sparse floor clutter, cold pools of light | Secure an optional remote gem with a long haul or use finite gold for a shorter expedition |
| **Royal Deep** | A lava basin surrounding connected peninsulas of royal ruins | Dark continuous rock, molten light, monumental masonry and scorched chambers | Choose a narrow exposed bridge site or a longer crossing onto a safer bank |

Natural formations must constrain excavation meaningfully. Use connected bedrock spines where permanent separation matters; use ordinary retained earth for formations the player may remove. Early fungal pools and the crystal chasm must have land routes because bridge plans arrive only in Royal Deep.

Preserve the existing start ring. Give the *surrounding* geology a new shape and move the start/objective anchors per map. Starting inside a prebuilt working city would be a separate change to the current start rules, not required by this proposal.

### 2. Author geology before chambers — high priority, modest tooling

Define a few large landforms first: a curved rock spine, a branching watercourse, a basin, a peninsula, or the edge of a buried settlement. Place caverns and architecture around them. Finally add resources and inhabitants where they make sense.

Add simple helpers for a variable-width path, a stepped polygon/blob, and rotated/mirrored ruin placement. They should resolve to the current tile definitions. Hand-author the main connections and use deterministic variation only for edges and dressing. A procedural whole-level generator is unnecessary for the first pass.

Vary passage width over several tiles: a narrow breach, a short bend, then a broad chamber. Favor a few large bays and protrusions over a uniformly jagged perimeter. Preserve deliberate empty areas where players can excavate their own rooms.

Gold should form bent, branching or thickened seams associated with the landforms. Keep viable startup income while avoiding identical stripes. Because gold is visible through fog, its silhouette is part of the player's first impression; nearby chambers and the relay must remain concealed.

### 3. Introduce local environment regions — medium priority, small data extension

Allow a map to assign presentation tags to patches: damp bank, fungal colony, dry rock, old masonry, crystal fracture or scorched ruin. Keep the terrain's gameplay type separate and readable.

Use these tags for restrained material blends, wall-edge growth and grouped decoration. A fungal level should contain dry approach passages, damp pool rims and a few concentrated colonies. A ruined hall might become fungal only where water has entered. Avoid equal-density scatter and large decorative objects on traversable room floor.

Claiming a room can clean up floor clutter while retaining safe wall patina and regional masonry character. Cosmetic dressing must not take away room capacity or hide a one-tile route. Preserve the approved whole-tile footprints and common terrain top height.

### 4. Build a few recognizable places — medium priority

Expand ruin composition beyond isolated service fragments: an entry hall with adjoining rooms, a street intersection with two workshops, an archive court with a blocked service passage. Their services still use the real room definitions.

Add a small reusable landmark set: a collapsed gate surround, a worn relief on an occupied wall, a large fungal colony at a cavern edge, a broken industrial fixture in non-traversable space. Use architectural symmetry locally, then interrupt it with collapse and natural geology.

Existing inhabitants should occupy the place convincingly: spiders around webbed recesses, guards along a street, a Stalker patrolling around the remote gem. The current habitat system is a starting point; explicit patrol paths tied to architecture would need a small extension if existing local movement cannot express the desired route.

### 5. Tune light and sound by place — after layout

Compose warm occupied rooms, subdued natural passages, cold crystal pockets and strong lava margins using the existing source-light budget. Give important openings or landmarks a readable light relationship. Do not simply lower ambient brightness everywhere; that can conceal both terrain differences and planning information.

Explore local water/drip, fungal and stone-hall ambience as a later presentation pass, with quiet intervals. Current audio still needs listening feedback, so this should follow that review. Light, ambient effects and decoration must respect discovery; hidden resources must not illuminate unrevealed surroundings.

### 6. Vary pressure and discovery rewards — optional follow-up

Within the shared relay objective, distinguish an exploration-led area, an exposed multi-approach settlement, a district-reclamation assault and a crossing expedition. Existing territorial groups, discovery warnings, timed sources and source suppression can supply most of this variety.

Make optional branches yield a useful room, finite gold, a defensible shortcut or access to a gem. Avoid filling every pocket with an enemy. Let opening connections change the defense problem. Bespoke breach-triggered reinforcements, optional objective UI, an AI Keeper economy or a My Pet Dungeon-style mode would require additional work and should be considered separately.

## Recommended first experiment

Create an experimental Fungal Hollows variant with the same campaign availability, normal starting crew and economy. Keep the present layout selectable for comparison.

1. Hand-author one large cavern system, varying widths, two meaningful land approaches, clustered pools and a recognizable brood location. Preserve the 5×5 Hearth start and concealment rules.
2. Use the current art first. Compare whole-level silhouettes, then the normal fogged experience. This shows whether geography alone improves the result.
3. Add one focused visual treatment: damp banks, clustered fungi and a dry-to-wet transition. Reuse current lighting and preserve permanent baseline renderers.
4. Check real room expansion, narrow and irregular capacity/access, resource sufficiency, hound discovery, enemy approaches and physical relay activation. Use the focused campaign/habitat/ruin checks selected for the actual changes, one typecheck and the relevant browser preview; no unrelated full-suite run.

Success means the map is recognizable without its title or palette; its two routes create different exposure and hauling choices; cave openings unfold through discovery; and the player still has room to build a personal settlement. These are review criteria, not measured results.

If that succeeds, develop Fallen City next. Testing a deliberately architectural map prevents “organic” from becoming another uniform cave style applied to every region.
