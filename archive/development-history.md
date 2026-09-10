# Completed development and history

## 2026-09-10 — M40: Royal Deep peninsula districts

Created and inspected the Royal concept before its 72×60 replacement. A broad, winding lava basin separates a sheltered western settlement from an avenue, relay precinct and foundry peninsula. The north crossing costs four bridge tiles; the longer southern crossing costs twelve and leads through usable services. Both require a separate five-tile bridge spur to physically suppress the lava entrance. The guarded gem recess is optional, and finite income funds the objective.

The final paid routes, after adding broken walls around the foundry and record hall, completed at **886.5 / 1229.8s**. Both preserved the 400-health core, all three Stonehands and zero departures. Intended: nine total bridge tiles, seven reclaimed room tiles, 408 gold and four losses/four normal replacements. Alternate: seventeen bridge tiles, all sixteen ruin tiles reclaimed, 299 gold and five losses/five replacements. Source suppression occurred at 865.1/1218s. The alternate met two recurring waves before suppressing the source. Support was established at 128s; the conservative fresh-start preparation route opened at 586s. This is a demonstrated strategy, not a mandatory preparation timer. The full campaign can carry research into this stage and has separate timing below.

An extended pressure review before the final ruin framing observed waves at approximately 691/979s, a real bank attack, source claiming around 1180s and no third wave through 1456s. The final wall patch leaves lava access, bridgeheads, source, plan cells, defenses, resources and all sixteen ruin cells unchanged. The final alternate independently verifies two waves and physical suppression; no terrain edit or free bridge substitutes for access.

Design review passed the neutral old/new landform, ordinary fogged discovery of the basin, developed services and normal/reverse landmark views. Both crossing approaches have paid simulation evidence; the intended browser expedition separately covers physical activation and actual UI restart. Initial ruins looked too isolated on open paving; twenty-six additional ordinary rock cells now frame recognizable foundry and archive courts with broad thresholds. Root and independent visual review confirmed the architectural edges, connected avenue and irregular lava shore. The short final revealed dressing check restored the retained world's exact fog and reported no runtime or network errors. Shared M35 paid/free room checks cover the unchanged construction mechanics, and the final routes verify the new arrangement's actual reclamation and access.

Evidence: ignored `test-results/level-overhaul/royal-framed-intended.json`, `royal-framed-alternate.json`, `royal-framed-validation.json`, and `campaign-royal-deep/dressing/`. A separate paid preactivation fixture at 901s contains fifteen residents, forty-seven room tiles and 1,545 known tiles, with the source physically claimed and the record hall reclaimed. It preserves the earlier unframed fixture for matched renderer comparisons. Developed active performance is recorded with M41; sparsely rendered ruins and uniform terrain height remain deliberate prototype limits. Final framing is committed as `9074a16`.

## 2026-09-10 — M41: completed campaign integration and performance review

Created the campaign cohesion concept before the integrated review. Neutral views distinguish the sheltered horseshoe, wet cavern lobes, buried crossroads, crescent fracture and molten peninsulas. Normal-play views confirm local timber, fungal banks, masonry streets, pale mineral faces and scorched ground instead of relying on biome tint. The growing area contains settlement wings, alternate approaches, services and optional income. It does not require exhaustive clearing, and the five-stage unlock order and physical Hearthstone objective remain intact.

Integrated intended and alternate campaign runs reached the final endpoint through normal travel with staged availability, researched-knowledge carryover and fresh-area resets. Their total simulation times were **43m18s / 51m43s**, including the alternate's consolidation allowance. These integrated timings precede the final Royal wall refinement; both affected Royal approaches were subsequently rerun from normal independent starts as recorded above. No travel or availability system changed in that refinement. A separate unprepared approach produced real Hearth destruction, and independent restart/session checks passed. Human planning time is additional; with no saves, the full journey remains a substantial single sitting.

Focused integrated checks passed twelve-map structural coverage, campaign availability/travel, standalone session/reset, bridge behavior and verification selection: nineteen checks across the selected runs. All fourteen standalone paid reports separately passed their report assertions, as documented under M42. The new combined suite is available for future use and was not redundantly replayed after those reports. One production Vite bundle passed with the existing large Babylon chunk warning; no generated build or dependencies were committed. The final source/test typecheck passed after the Royal, lighting and morale refinements.

The active late-map profile identified repeated static lighting rays and repeated support-service filtering. Lighting now shares tile/actor occlusion samples and reuses static masks until geometry or source position/range changes, preserving individual furnishing/Hearth sample positions. Morale reuses accessible services only within one synchronous support decision and its existing reachable component; wage behavior and cross-tick state are unchanged. Twenty-two existing morale/economy checks and the focused lighting browser passed. Lighting checks cover first-wall illumination, occluded floor, moving actors, cached static masks, fog replacement/disposal, radius changes, pointer/camera/modal behavior and restoration. Independent source review confirmed cache invalidation and unchanged light boundaries. Permanent renderer baselines and independent reference material caches remain untouched.

The final renderer also freezes completed furnishing geometry and caches frustum visibility only for finalized, immutable terrain/furniture. Camera matrix values, mesh transforms and culling strategy invalidate visibility; new/disposed meshes remain in the scene's original traversal order, and actors/effects retain ordinary evaluation. An initial matrix-marker key missed cross-frame reuse because glow rendering rewrites that marker, so the final implementation compares the sixteen actual matrix values. Picking, antialiasing, native pixel scale, glow and the retained drawing buffer are unchanged.

The final source/test typecheck and `node scripts/lighting-browser.mjs --candidates` passed. Fifteen default/cached/default comparisons preserve active mesh IDs/order and actual fog-instance registration through pan/orbit/zoom, forced-active and clipping-bypass behavior, fog replacement, moving actors, a visibly arriving/dying/disposed resident, reset and retained-world restoration. Stationary glow-enabled frames perform zero provider frustum checks after warming; a camera change correctly causes 1,585 checks. Result buffers are reused between queries and released on world replacement. The browser reported no page errors. These paused presentation fixtures establish rendering parity, not additional recruitment/combat balance evidence.

Final performance used the paid, framed Royal fixture at 901s: fifteen residents, forty-seven room tiles, six furnishings plus eighteen live bed/wealth decorations, 663 claimed and 1,545 known tiles. Hardware was an Intel Core i5-1035G4 / Iris Plus through ANGLE D3D11, Windows 10.0.26200, headless Edge 152.0.4191.66, on AC power with the Balanced plan. The viewport was 1440×1000 and actual WebGL surface 1144×1000 at scaling 1, with antialiasing, stencil and the retained drawing buffer enabled. Camera target was (14,0,18), radius 27, alpha −π/4 and beta 0.62. Other verification jobs were idle and source was frozen.

Four fresh-page samples used cache off/on/on/off, each with ninety paused warm frames followed by fifteen seconds of live simulation from the identical fixture. Static world-matrix freezing remained enabled in every condition, so this isolates candidate filtering rather than the entire renderer change.

| Condition | Mean frame | FPS | Active-mesh evaluation |
|---|---|---|---|
| Cache off, first | 30.63 ms | 32.65 | 9.19 ms |
| Cache on, first | 35.17 ms | 28.43 | 7.63 ms |
| Cache on, second | 35.59 ms | 28.10 | 7.79 ms |
| Cache off, last | 40.09 ms | 24.94 | 11.42 ms |

Average active evaluation fell from 10.30 to 7.71 ms (about 25%), while overall frame means were essentially equal at 35.36/35.38 ms. GPU and simulation costs also drifted, so this does **not** establish an overall FPS improvement. Both current-cache samples had approximately 66.7 ms p95 frames. All four advanced exactly fifteen simulation seconds, made forty-one geometry revisions and ended with the same 1,554 active meshes among 6,087 total; the cache reduced candidates to 1,983. No runtime/network errors occurred. Evidence is in ignored `test-results/level-overhaul/render-candidates-corrected-abba/report.json`; its fixture SHA-256 is `62f08ea55a7f4c0a015fd1bf51ddd12011a1ae47b57f906693768e7fffe97d2f`.

Earlier longer diagnostic sessions drifted as low as roughly 11 FPS in the developed Royal scene; their changing GPU/simulation costs prevent attributing that result to local regions or comparing it directly with old paused showcases. The final matched samples establish a usable prototype workload with real-time simulation and the independently verified camera/picking/fog behavior. M40 and M41 are complete with dense-scene integrated-GPU performance retained as an explicit limitation. These short samples do not guarantee sustained frame rate, 60 FPS or arbitrary population growth. The static-lighting comparison likewise reduced its measured update work without establishing a whole-game speedup.

The consolidated browser tooling is committed as `b80c995`, lighting/support reuse as `2c8c9a5`, and final static visibility/parity checks as `dcc9f09`. Current authoring rules, catalog descriptions, concept galleries and development commands match the delivered maps; the original milestone specifications and provisional dimensions are preserved in [the archived roadmap](previous-docs/level-overhaul.md). All M35–M42 requirements are now complete. The separate M30 audio listening review remains pending, and no deferred gameplay or persistence features were added.

## 2026-09-10 — M42: seven independent standalone expeditions

Created and inspected a concept for each standalone before authoring it. All seven stable catalog IDs now load separate larger scenarios, with matching names, descriptions and concept references. Their original full building/role/recipe/research availability remains independent of campaign progress. Each starts with the normal three Stonehands and gold, no researched spells, no player-built/reclaimed service rooms and a concealed relay; the fixed Hearth still provides its ordinary treasury. Old maps remain independent development comparisons.

| Scenario | Paid intended / alternate completion | Different decisions demonstrated |
|---|---|---|
| Mining Interchange, 48×40 | 667 / 692s | Central mine hub: northern workings versus western service reclamation, with a separate southeastern mining/source expedition. The alternate recovered 22 room tiles versus nine. |
| Emberwater Crossing, 48×40 | 665 / 686s | Two winding channels and three usable banks: eight northern bridge tiles versus nine southern tiles leading to 17 reclaimed foundry/service tiles. The optional mineral den remained dormant. |
| Honeycomb Quarry, 46×38 | 558 / 546s | Unequal quarry chambers around thick ribs: direct watch cut versus a service circuit that secures useful rooms and the source earlier. Neither needs a bridge. |
| Overgrown Confluence, 50×42 | 580 / 731s | Southern refuge entering three wet lobes: eastern colony margin versus the slower western waystation/buried archive circuit, which reclaimed 16 tiles and supported more arrivals. Both stay on land. |
| Flooded Watch Districts, 54×44 | 965 / 809s | Eight-tile northern causeway delays contact and reaches the archive court; the dry southern service shore meets guards earlier but reclaims 32 tiles versus 26, costs no bridge gold and suppresses the source before its first wave. |
| Prism Wells, 54×44 | 591 / 650s | Central refuge: eastern relay branch versus a northern survey-archive loop with 18 reclaimed tiles versus three. Both guarded mineral wells remain optional. |
| Ashen Caldera, 60×48 | 678 / 828s | Inward conquest of a lava-ring citadel: five-tile western entry versus seven-tile southern entry beside useful services; both add a six-tile suppression crossing. The alternate reclaimed 20 tiles versus eight and recovered a normal casualty. |

All fourteen recorded paid approaches retained full core health, zero departures and surviving specialist support, physically hauled gold and claimed the recurring source. Final gold ranged from 385 to 708. The two Flooded routes each lost two residents and received normal replacements; Interchange's alternate and Caldera's alternate lost one each. Finite opening income funds all required objectives. Reports include actual delivered cargo, support/discovery/contact, source and activation timing, and food/rest/wage/delivery job episodes. The largest standalone delivery episode was 24.5s on Flooded Watch's northern route. Transient zero hunger recovered in several cases; services are practical in these examples, not guaranteed safe under arbitrary expansion.

Design review passed all seven independent neutral old/new comparisons and ordinary fogged start, natural area, developed settlement and ruin/landmark views from opposing angles. The resulting collection contains a mine hub, quarry chamber network, three-bank crossing, scattered wet lobes, reservoir districts, radial mineral expeditions and an inward caldera objective. Reused materials and room types form different places from their campaign counterparts. Added area carries actual banks, chambers, districts and optional income; the concepts remain direction rather than literal scenic geometry.

The consolidated alternate browser run passed all seven paid expeditions, physical activation, actual UI restart, enlarged full-map framing/recentering, exact fog concealment and tile picking with no page, failed-request or HTTP errors. Browser completion times were 1078, 680, 561, 770, 870, 671 and 829s in catalog order; these include delayed activation for developed-scene review and are separate from the focused route timings above. Screenshots show automatically furnished reclaimed kitchens, dormitories, treasury and industrial/archive services. Shared M35 paid/free arbitrary-room checks cover the unchanged room mechanics; this milestone changes their spatial arrangement.

Prism's objective routes intentionally leave its mineral wells optional, so its first natural-camera sample was an inadequate view of paved relay floor. A short additional paid-development check used ordinary excavation into the southern well, then captured its naturally revealed fracture bank and lilac mineral walls from both angles with fog intact. This resolved the visual evidence gap without granting discovery or replacing the objective-route evidence. Sparse untouched ruins remain floor remnants and wall fragments until reclaimed; claimed growth clears while dry/masonry structure remains outside player-built rooms.

Evidence: ignored `test-results/level-overhaul/routes/isolated-*.json`, the seven-map `alternate/report.json` and captures, wetland route logs, and `region-crystal/discovery/`. All fourteen saved reports were audited against the new selectable standalone suite's report assertions. The combined suite was added for future use, not redundantly executed as another fourteen-route run; independent start/restart state also passed the integrated session test. Catalog/baseline inspection confirms twelve stable IDs, campaign/Free Play definition correspondence, fresh availability and preserved original renderers.

## 2026-09-10 — M37–M39: cavern, city and divide replacements

Each replacement began with its individual generated concept, inspected before map implementation. Exact prompts and gameplay interpretation remain in the [overhaul gallery](../concept-art/levels/overhaul/README.md). The campaign order and specialist unlocks remain intact; these three stages require land routes with ordinary paid starting conditions.

**M37, Fungal Hollows (48×40):** uneven connected cavern lobes and large pool margins replace the narrow divider. A dry northern shelf competes with a southern waystation loop through colony territory. Local timber, damp banks, grouped caps/webs and masonry distinguish the approach, wilderness and services. Both final paid routes passed: direct 387s, 362 gold, one casualty followed by normal recruitment, three reclaimed room tiles; alternate 526s, 554 gold, five casualties with ten subsequent arrivals, twelve reclaimed tiles. Both retained full core health, zero departures and all workers, with physical source suppression and no bridges. Support was established at 95s, training at 38s and expedition preparation at 204s. Final gold hooks preserve the whole starting floor ring and actual service footprints.

**M38, Fallen City (56×46):** a central avenue and crossroads connect three coherent districts with 49 ruin squares, foundry courts and buried service links interrupted by geology. The direct street route takes 621.5s with 25 reclaimed tiles and no losses; the final foundry flank takes 721.5s with 43 reclaimed tiles, three losses and five subsequent arrivals. Both preserve the 400-health core with zero departures. A revised supply connection and route-specific defensive positions reduced the earlier alternate's 908s/eleven-loss result. Longest measured meal journeys were 17.8/25.6s and rest journeys 22.3/21.6s. The ordinary alternate browser expedition completed in 779s, physically suppressed the entrance, restored 46 tiles and recovered two losses through normal arrivals.

**M39, Crystal Divide (64×52):** a substantial crescent chasm and fractured spine create unequal northern archive and southern service routes from an eastern refuge. The guarded southern gem remains an optional expedition; both required routes finish on finite income while its hunter stays dormant. Final direct/alternate paid completions were 602/665s, each with 408 gold, one casualty followed by normal replacement, full core health and zero departures. Both used researched Haste and Slow and physically suppressed the source at 591/651s. Longest measured meals were 29.8/38s, rests 24.7/31.2s. The ordinary browser route completed at 615s and reclaimed nine room tiles. A chasm glimpse during home excavation precedes the much later hostile contact; it reveals geography without revealing the relay or forcing the optional gem fight.

Functional evidence uses actual excavation, hauling, construction, recruitment, training, manufactured defenses where available, research/casting where available, ruin claiming and resident activation. Transient low hunger can occur on these longer trips and recovered in the tested routes; zero departures is not a claim that needs never fall. Room capacities and furnishings still use the shared floor-area systems exercised by M35's paid/free irregular-room and transformed-ruin checks. No map-specific service or free starter room was added.

Design review passed independent neutral old/new silhouettes, ordinary fogged starts/discovery and developed/landmark views from both camera angles. The cavern offers pools and colony margins, the city deliberately uses aligned streets and courts, and the divide uses a dominant unbridgeable crescent with optional branches. Their added area provides actual districts, room expansion and route decisions, not just border padding. Claimed fungal growth clears as designed, leaving intact wet margins as the strongest colony read; stone and timber structures persist outside built rooms. Art remains sparse prototype geometry rather than a literal reproduction of painted architecture.

Evidence is in ignored `test-results/level-overhaul/campaign-fungal-hollows/`, `campaign-fallen-city/`, `campaign-crystal-divide/` and `routes/`. The first city browser capture set suffered failed textures after the local Vite process stopped; those images are excluded from final texture review. A clean server and a short final `dressing/` recapture passed with no network errors and restored retained fog exactly. The consolidated browser now records failed requests and HTTP errors. Source/test typechecking passed after final map and catalog integration. Campaign-wide travel, endpoint and developed late-map performance are tracked separately under M41.

Weak earlier developed natural-camera selections were replaced by actual paid Fungal pool-bank and Crystal fracture-edge discovery checks, recorded in `test-results/level-overhaul/natural-discovery/report.json`. Both provide normal/reverse views with ordinary fog and no discovery grants; completion remains covered by the separate routes. Crystal's short view shows its northern shoulder and first fracture edge. The neutral whole-map review separately establishes the crescent's overall identity.

## 2026-09-10 — M36: Border Foothold sheltered workings

Generated and inspected the individual Border concept before authoring its 40 × 32 replacement. A broken horseshoe of enduring geology protects a broad excavatable refuge; a bent northern mine branch and a separate southern waystation saddle replace the old straight divider. The relay remains northeast but now belongs to a watch cavern beyond the inner shoulder. Additional area provides protected room wings, the old mine, a coherent framed waystation and a distinct side den/source branch.

Both ordinary paid routes pass with normal initial crew, 400 gold, first-stage availability, actual hound recruitment, physical hauling, source suppression and relay activation. Direct initial record: 294s completion, 308 gold, full core health, no losses/departures. Final alternate after framing the waystation: 266s, 308 gold, full core health, six reclaimed room tiles and no losses/departures. The earlier full alternate browser run observed one casualty followed by a normal replacement. The approaches differ in reveal direction and early usable services, rather than one being a strictly worse route. A transient low hound hunger reading on the final alternate recovered without departure; longest den-food job was 20.2s.

Design review passed neutral old/new composition and actual fogged start, first discovery, developed settlement, watch, natural area and reclaimed waystation views from both camera angles. Review found and fixed two qualitative gaps: dry dressing had no actual timber geometry, and the waystation's masonry region was overwritten while its floor remnants sat in an unframed cave. Added sparse wall-hugging squared supports, retained dry/masonry structures on claimed non-room floor, and framed the waystation with two accessible thresholds. Growth still clears on claiming and real room construction clears all dressing. Source/test typecheck and four environment regressions passed; changed room access was rerun through the paid alternate simulation, with short 3D dressing/return checks for the final geometry.

Evidence is in ignored `test-results/level-overhaul/campaign-border-foothold/` (neutral pair, intended/alternate fogged/developed captures, `dressing/` normal/reverse views) and `test-results/level-overhaul/routes/`. Gameplay retains one floor plane, ordinary free-build behavior and floor-area room services. Timber details remain prototype geometry, not full concept-art rail/furniture reproduction.

## 2026-09-09 — M35: concept-led level authoring groundwork

Created the campaign direction concept before implementation and five coordinate briefs/neutral tile sketches in `research/level-redesign-briefs.md`. The briefs establish a sheltered mining basin, wet cavern lobes, buried city crossroads, a crescent chasm and a molten royal basin. The art gallery records exact built-in generation prompts and deviations needed to preserve the game's single floor plane and existing mechanics.

Preserved all twelve previous playable definitions and starting catalogs as independent `baseline-*` comparison data in Level preview. Added tile-center ellipse/polygon/variable-width path/union helpers and rotated/mirrored ruin placement. Six optional local environment regions affect materials, sparse edge clusters and discovered-only light selection without changing terrain, fog, movement or room capacity. Permanent baseline renderers and their predicates remain unchanged.

Verification: `npm run verify -- level-authoring` (typecheck and four tests), two level-preview tests, `npm run verify -- environment-regions` (typecheck and three tests), and four existing lighting-lab tests passed. Preview browser checks passed all catalog entries and full 3D load/return, plus the focused authoring fixture's normal/reverse views and real canvas ruin picking. Paid/free room checks exercise actual workers, irregular room building, capacity, furnishings and physically reclaimed rotated ruins. Captures: `test-results/level-preview/` (ignored generated evidence).

Design review: the actual 24 × 22 fixture makes the cave/pool/waystation shapes, wall clusters and local materials readable from both camera directions, while returning restores the retained game. Its six deliberately packed region samples have abrupt boundaries and a small cross-like pool; this is a tool integration fixture, not evidence that a campaign atmosphere is finished. M36–M42 require individual old/new and normal-play reviews. No new elevation, terrain type, service, persistence or public editor was introduced.

## 2026-09-09 — Active documentation cleanup

Moved the milestone tracker, specifications, authorization sequence, earlier graphics passes and superseded mixed design drafts under `archive/`. Shortened the README and active development notes; kept the remaining audio listening review explicit. Current rendering/lighting guidance now lives in `graphics.md`, alongside focused character/terrain, room and arcana guides. Preserved concept images, exact generation prompts, runtime asset provenance and permanent baseline renderer sources.

Audited the active rules and authoring guides against current definitions and services. Corrected the five-area campaign and Royal Deep bridge unlock, Stonehand/legacy Miner roles, specialist-only training and wages, hound rally eligibility, Hearth activation exclusions, current Sell controls, sparse room visuals, recruitment configuration, extension examples and deferred maintenance. Preserved the independently completed species-habitat behavior and its verification record.

Documentation review covered 70 Markdown files and 1,068 local file/section links with no broken targets. `git diff --check` passed. No simulation tests, typecheck, browser test or production build was run for this documentation-only change. Historical snapshots retain superseded statements explicitly as history, not current requirements.

## 2026-09-09 — Species-specific natural enemy movement

- Fixed stationary natural encounters in legacy Free Play by assigning habitat movement to every encounter member. Removed the campaign helper's group-wide behavior override so each creature keeps its own pattern.
- Added editable species profiles: patrol sectors for goblins/guards, short irregular spider darts, perimeter stalking, quick Cinderling roaming, den/lair excursions for burrowers and heavy beasts, and physical watch-post inspections/returns for sentinels and elementals. Blocked raiders continue local movement while checking for an approach; occupied destinations are skipped with a short retry after meeting an ally.
- Preserved fog, physical traversal, warning/raid timing, combat abilities and stationary debug fixtures. Updated the encounter regression to allow the existing asynchronous route recheck after a moving inhabitant is discovered.
- Verified `npm run verify -- habitats`: source/test typecheck and all 31 focused enemy, encounter and habitat tests passed, including all ten species and every initial campaign/regional inhabitant moving through authored terrain. `node scripts/habitats-browser.mjs` passed visible-model position checks in five full-level previews; captures are in ignored `test-results/habitats/`. The browser flow is selectable with `--browser=habitats`.

Read this file only when past context, original milestone requirements, verification evidence or earlier decisions are needed. It is not required reading for ordinary development. Start with [the active development notes](../development-plan.md) and the relevant current design document.

This archive preserves completed milestone specifications and dated development records, including M5.1. Historical requirements and provisional values may have been superseded; current design documents and the user's latest decisions take precedence. Remaining limitations belong in the active plan so they do not require loading this archive.

## 2026-09-09 — Animated character comparison and close zoom

Added synchronized animation previews to the retained character comparison room. All sixteen original/refined pairs can idle and walk; fighting characters can attack, residents can preview their role activity, and the Tunnel Burrower can excavate. Both versions use their existing animation update code with identical private preview actors and timing. Walking stays on the plinth, and playback does not advance the game simulation. Sidebar controls provide play/pause, restart, 1/30-second frame stepping, four playback speeds and individual Starting/Refined focus. Reduced-motion preferences remain active.

Removed the minimum camera distance from ordinary wheel/footer zoom and the character gallery controls, with adaptive near clipping for close inspection. The existing far limits and a machine-precision positive-radius guard remain. The obsolete minimum-zoom setting was removed.

Verification: all **five focused camera/settings tests passed**, and source/test typechecking passed. `node scripts/graphics-gallery-browser.mjs --animation-only` passed all **sixteen pairs and 38 walking, activity and attack clips**, synchronized pose checks, deterministic restart, pause/frame stepping/speed, reduced motion, individual focus, wheel/footer/gallery zoom down to approximately 0.01, unchanged game state and return/reopen cleanup. No browser errors or duplicated geometry were found. Normal, reversed, reduced-motion and compact-sidebar captures were visually reviewed. Evidence is retained in ignored `test-results/graphics-gallery-animation/`.

## 2026-09-09 — Character and terrain graphics overhaul

Completed the user's request to revisit every character individually, keep each starting model for comparison, then generate new environment direction and iterate terrain and whole-level appearance. The [overhaul record](previous-docs/graphics-overhaul.md) links all sixteen reviewed concept sheets and describes the character-specific changes and remaining procedural limitations.

The starting resident, enemy, scene, terrain and surface renderers were archived before editing in commit `6c4cf1b`. Six residents and ten enemies now use revised silhouettes, continuous/custom geometry, shaped clothing and equipment, clearer faces, organic armor and restrained material detail. Front/back/three-quarter comparisons drove multiple iterations, including winding/cap corrections, hair and face continuity, fitted animal scutes and more readable creature masks. Gameplay and animation rig interfaces remain intact.

`graphics-gallery` retains all sixteen native-scale original/refined pairs with separate material caches and matching studio lights, empty cargo and book poses. `terrain-comparison` mirrors geology, all six normally constructed room types, automatic furnishings, hazards and completed bridges across five regional palettes. Its paid/free fixture uses real placement, pricing and completion services. Selection, synchronized turns, close views, reset/return and baseline cleanup are verified; labels remain in the sidebar.

Generated cohesion v1/v2 concepts and three original runtime albedo maps are retained with exact prompts and provenance. The revised terrain has continuous geological/paving coordinates, shallow bank relief, derived normal maps, broad gold fragments, grouped blue/violet crystals, flowing water and dark lava crust with incandescent fissures. Real visible stove/candle furnishings add bounded warm lighting. New reference art does not change the common floor/bank heights, terrain access, capacity or discovery rules.

Verification:

- `npm run verify -- all`: **247/247 simulation tests passed**, including all ten ordinary paid campaign routes and the new discovered-furnishing light regression. Source/test typechecking passed, with a final repeat after the last presentation cleanup.
- Character gallery: three full sixteen-pair capture passes; the final set is `test-results/graphics-gallery-final/`. Front/back/three-quarter images exist for every pair, with extra close Engineer/Runesmith views. All six final resident sets were visually inspected, alongside enemy-specific iteration reviews. Static actors, original/current material isolation, compact controls and retained-world restoration passed.
- Resident activity browser: real excavation, reinforcement, claiming, hauling, construction, crafting, research, training, eating/resting, hound bite timing, defeat cleanup, paused poses and reduced motion passed with no page errors (`test-results/character-overhaul/`). Enemy browser passed all ten rigs, natural combat/traps, corpse disposal, hidden regional starts, actual Burrower excavation, reverse views and reduced motion (`test-results/m17-enemies/`).
- Terrain studio: all five regions, 108 real room squares, 57 automatic furnishings, 12 finished bridge squares, paid/free costs, upward bank normals, material/normal-map isolation, unchanged gameplay tiles and exit cleanup passed (`test-results/terrain-comparison/`).
- Full environment browser passed all six rooms in strips/L shapes/retained-earth layouts, paid/free expansion, reinforced walls, doors/traps, water/lava plans/decks, chasms, exact fog picking and reduced motion. Final 18 same-camera environment captures include the showcase, crossings and arrival/detail/reverse views in all five campaign regions; arrival discovery remained unchanged and no browser errors occurred (`test-results/graphics-overhaul/environment-after/`). Local detail disclosures are presentation fixtures, not additional campaign-route claims.
- Hidden gold/gems, surrounding fog and unchanged discovery under camera movement passed. The resource browser's obsolete gem-on-first-level assumption was corrected to use the existing crystal-region fixture. `npx vite build` and production startup/isolation smoke passed; generated builds remain ignored.

A screen-space contact-occlusion experiment proved too expensive and was removed. Settled final-renderer samples at 1440×1000 on Intel Iris Plus/ANGLE D3D11 used 60 warm-up frames and 90 measured frames: **60.6 FPS** at the starting Hearth (16.5 ms mean) and **28.6–29.1 FPS** in the fully furnished showcase (34.4–35.0 ms mean, 50.1 ms p95). Disabling normal maps produced no convincing gain; disabling six local source lights improved the showcase to 39.3 FPS. Normal maps and the bounded six-light service were retained for visual quality. These samples precede only removal of an overly dark cosmetic bank-foot shadow, which was inspected in the final environment views. Busy settlements, active battles and setup can be slower; these are machine-specific paused-rendering samples. Profile evidence is in `test-results/graphics-overhaul/normal-map-profile.json`.

The result remains editable procedural art, with simplified concept microdetail and no cloth deformation, finger articulation, foot IK or detailed cast-shadow system. Those limits and the original M30 listening review remain explicit; no deferred gameplay features were added.

## Completed milestone tracker

| Milestone | Outcome | Status |
|---|---|---|
| M1 | Fixed-size grid level with core, terrain, resources, and open spaces | Complete |
| M2 | Camera scrolling/panning, zoom, and rotation | Complete |
| M3 | Basic left sidebar and minimap, with gameplay controls left blank | Complete |
| M4 | Autonomous miners, excavation, claiming, Treasure Room construction, and resource hauling | Complete |
| M5 | Shared room rules, reusable room checklist, and room catalog/layout debugging view | Complete |
| M5.1 | Free room construction flag and Debug option in the left sidebar | Complete |
| M6 | Dormitory | Complete |
| M7 | Kitchen | Complete |
| M8 | Workshop | Complete |
| M9 | Concept-art graphics and animation pass | Complete |

## M1 — Grid level and terrain

Create the initial browser scene and a defined-size prototype level containing:

- A fixed Hearthstone with its protective Stone Hearth in an open starting area.
- Diggable dirt and ordinary rock, indestructible bedrock, finite gold seams, and persistent gemstone columns.
- Some already-open caverns and passages to demonstrate the layout of a real level, alongside solid terrain and internal bedrock seams.

Store the level's width, height, terrain layout, and core position in editable level data. A **48 × 48 cell map is a provisional starting size**, adjustable during M1; it is not a final level limit. Use a repeatable authored layout so changes can be assessed consistently.

Preserve the established large square cells, one full terrain height, and one common walkable floor. Bedrock boundaries follow the grid and generally form continuous seams. Ordinary rock must remain distinguishable from unmineable bedrock. Gem columns remain occupied terrain during extraction. A fixed overhead camera is sufficient at this milestone.

Open-space previews used to assess the prototype do not change the game's discovery rules. Keep pre-existing open space distinct from discovered space in level/world data; camera movement must not become a way to reveal concealed gameplay areas.

References: [approved terrain image](../concept-art/terrain/resource-terrain-v2.png), [terrain gallery](../concept-art/terrain/README.md), [level gallery](../concept-art/levels/README.md), and [room/structure gallery](../concept-art/rooms/README.md).

Complete when the defined map loads in a browser, all listed terrain/resource types and the core are readable, and the layout can be changed through its definition without rewriting the renderer.

## M2 — Camera controls

Add controls to scroll/pan across the map, zoom in and out, and rotate the overhead view around the viewed area.

Use the [interface document](previous-docs/gameplay-interface.md) as the starting point for bindings: WASD or window-edge movement to pan, mouse wheel to zoom, and Left Ctrl+A/D, horizontal middle drag, or Q/E to orbit the viewed point without changing tilt. These bindings and camera limits can be tuned during the milestone. Keep navigation practical at different rotations and zoom levels, and preserve world-grid alignment.

Complete when the player can navigate across the prototype, inspect the Hearthstone closely, and return to a broad layout view. Panning, rotation, and zoom must work together without losing the level or passing through the floor, and preserve any active discovery boundaries.

## M3 — Basic UI and minimap

Build the basic screen composition from [Gameplay interface](previous-docs/gameplay-interface.md):

- A persistent left sidebar, with the gameplay view filling the remaining space.
- A minimap at the top showing the actual known level layout and the camera's viewed area.
- Reserved areas for resource/population information, room/defense/spell/dwarf categories, and utility controls.
- Space for the question-mark button and associated message icons/cards.

**Gameplay input controls and their panels may remain blank or inactive for now.** Fill them in as their systems arrive; M3 does not require recruitment, construction, spells, defense, or a complete message system. Existing M2 camera controls continue to work, and clicking the minimap can recenter the view as described in the interface document.

Keep detailed text and numbers in the sidebar. Do not add floating world labels, health bars, progress bars, or hover statistics. Sidebar input must not reach the world behind it, and scrolling the sidebar must not zoom the camera. The minimap follows the same discovery state as the world.

Complete when the sidebar and minimap occupy their documented positions, the minimap reflects the level and camera rather than a static placeholder, and UI interactions do not trigger world input. Blank controls remain harmless.

## M4 — Miners, excavation, claiming, and treasure

Add a small starting crew of Miners, using the [current Miner concept](../concept-art/dwarfs/README.md) for visual direction. Keep the starting count, movement speed, mining time, resource yield, carrying amount, and storage capacity easy to tune.

### Excavation and claiming

- Allow the player to select/highlight grid tiles for excavation and remove designations when needed. Highlights contain no text or progress bars and remain accurate after camera rotation and zoom.
- Miners autonomously move to reachable work positions and clear designated diggable terrain. They move continuously through open space, respect solid terrain and each other, and do not receive individual movement orders.
- Mining dirt, ordinary rock, or exhausted gold-bearing terrain leaves bare dirt or rock floor at the common floor height. Bedrock cannot be cleared; renewable gem columns remain in place.
- Excavation and claiming are separate steps. Miners claim reachable bare floor, making those squares eligible for room construction. Unclaimed floor cannot support a room.
- Newly opened routes become usable, and breaching pre-existing hidden spaces follows the documented discovery rules for the world and minimap.
- Unreachable jobs wait until access exists; they must not monopolize miners or prevent reachable work from continuing.

### First room: Treasure Room

- Add the Treasure Room as the first and only available room type in this milestone, and fill in the sidebar controls needed to build it on claimed floor.
- Support grid-based room footprints and expansion, including irregular shapes, with recognizable flooring and automatic storage furnishings where their footprints and access fit.
- Keep storage capacity tied to usable, reachable storage positions. Furnishings must preserve miner access and circulation.
- Provide a way to establish the first Treasure Room before mining income is stored. Choose a simple prototype allowance or provisional starting funds during M4; no save system or complete starting economy is required.

### Mining and hauling resources

- Miners extract finite gold seams and renewable, slower gemstone-column yields, then carry the mined gold/gem pickups to a Treasure Room.
- Both sources contribute to the same **gold currency**, as established in the game rules. Source-specific pickup appearances do not introduce a second spendable currency.
- If no Treasure Room is available, the mined resources remain on the ground where they were extracted. They do not disappear or become spendable automatically.
- Once reachable storage with free capacity becomes available, miners collect the waiting resources and deliver them. Full or unreachable storage also leaves resources waiting for a valid delivery destination.
- Increase stored/spendable gold only on delivery. Show stored wealth in the room and the total in the sidebar, without floating world numbers.
- Limit simultaneous work at gem columns and schedule jobs so renewable mining does not prevent excavation, claiming, or hauling from making progress.

Complete when a browser playtest demonstrates:

1. Miners autonomously clear highlighted terrain, leave bare floor, and then claim it.
2. A Treasure Room can be built and expanded on claimed floor, including an irregular footprint.
3. Mining before any Treasure Room exists leaves visible resources on the ground.
4. Building a reachable Treasure Room causes miners to collect those resources and increase the stored gold total on delivery.
5. Gold seams run out; gem columns keep producing slower yields without being cleared.
6. Multiple miners continue useful work as routes open, designations change, and storage becomes available or full, without duplicating or losing resources.

Additional dwarf types, other rooms, recruitment purchases, needs/pay, training, combat, defenses, reinforcement, research, and campaign progression are outside M4. M5 onward extends these foundations within the scope below.

## M5 — Shared room rules and room debugging view

Implement the shared room rules in [Rooms](previous-docs/rooms.md), building on the M4 Treasure Room. Use the existing Treasure Room to verify the shared system before adding further room types.

- Define room types through reusable data: stable identifier, icon, construction cost, floor/wall appearance, furnishing variants, footprints, access clearances, capacities, services, and worker requirements where applicable.
- Support designation and expansion on claimed floor in arbitrary grid shapes, including single cells that may have no functional capacity yet.
- Automatically fit furnishings at their actual scale, preserve entrances and circulation, and retain valid existing furnishings where practical. Changes to room geometry must update usable capacity and navigation without losing stored resources or resident assignments.
- Identify rooms through floors and treatments on existing wall faces. Adjacent rooms do not create dividing walls automatically, and room decoration does not reinforce terrain.
- Report usable capacity and reasons a room cannot function in the sidebar. Painted area alone does not provide beds, food, storage, work positions, or attraction capacity.
- Apply the [room development checklist](../room-development-checklist.md) to the Treasure Room and every subsequent room milestone. Keep shared fixes in the shared system.

Add a **Room Debug View** with a catalog of all room types defined for the game. Every implemented room must be viewable; planned types may appear as clearly marked entries until their milestone adds them. Fixed structures remain identified separately from adaptable rooms.

The view must let the developer select a room type and create or expand it by clicking/dragging squares exactly as in gameplay. Reuse the actual construction, validation, furnishing, navigation, and rendering systems. Provide a simple test area with claimed floor, surrounding walls, retained terrain, and bedrock so developers can inspect different layouts using the normal camera controls. Allow quick layout reset and switching room types without requiring saved layouts or a separate level editor.

Use the [layout checks](../room-development-checklist.md#layout-checks) to inspect small and large rooms, irregular footprints, narrow passages, obstacles, adjacent rooms, and expansion. Show capacity and access information in the sidebar. M5.1 adds the dedicated Debug menu entry and free-build control; the view itself is part of M5.

Complete when the Treasure Room works through the shared rules in gameplay and the Room Debug View, the catalog lists defined room types with honest implementation status, and developers can create varied room footprints with the same grid gestures used in the game. Every new room can join the catalog through its definition.

## M5.1 — Debug menu and free room construction

- Add **Debug** as an option in the left-hand sidebar, opening a panel with access to the Room Debug View and a **Free room construction** toggle.
- Provide a development flag, provisionally named `freeRoomBuilding`, that can be set through development configuration and changed through this toggle. Show its current state clearly in the panel.
- When enabled, all implemented room types cost zero gold to create or expand, in both gameplay and the Room Debug View. Display the effective cost in the room preview and leave treasury balances unchanged by room construction.
- Apply the flag in the shared room construction path so later rooms inherit it automatically. Claimed-floor, terrain, occupancy, furnishing, and access rules still apply.
- With the flag disabled, use the normal configured room costs and affordability checks. Default to normal costs unless the developer explicitly enables free construction. No preference persistence is required.

Complete when the developer can open Debug from the left sidebar, enter the Room Debug View, and toggle free construction. Verify construction and expansion with no gold, unchanged treasury balances while free building is enabled, rejection of invalid terrain, and restored normal costs when it is disabled. Repeat the free/normal cost checks for each room added later.

## M6 — Dormitory

Follow the [room development checklist](../room-development-checklist.md) and the Dormitory rules and visual direction in [Rooms](previous-docs/rooms.md#accommodation-and-food), using the [room concept gallery](../concept-art/rooms/README.md).

- Add the Dormitory to normal construction choices and the Room Debug View.
- Give it recognizable floors and existing-wall treatments, with beds and supporting furnishings placed automatically where their footprints and access fit.
- Each usable physical bed counts once. Provide bed assignment and autonomous sleeping/rest use for the current miners through a shared accommodation service that future dwarf types can also use.
- Show usable, assigned, and available beds and access limitations in the sidebar. Expansion should retain valid beds and assignments where practical.

Complete when a Dormitory passes the checklist, works in varied layouts, and miners can reach assigned beds, rest, and return to work. Broader dissatisfaction, payday, and departure systems do not become prerequisites for this room milestone.

## M7 — Kitchen

Follow the [room development checklist](../room-development-checklist.md) and [Kitchen rules](previous-docs/rooms.md#accommodation-and-food), using the [room concept gallery](../concept-art/rooms/README.md).

- Add the Kitchen to normal construction choices and the Room Debug View.
- Combine growing, preparation/cooking, brewing, and eating in this room, with appropriate automatic furnishings and recognizable floor/wall treatments.
- Derive food provision, stored food, and eating capacity from usable facilities and their access. Use a simple tunable production model consistent with the documented proposal; no separate Cook role or compulsory ale need is established.
- Let miners autonomously obtain food and eat, then resume their activities. Use a shared food service that supports future dwarf types and multiple reachable Kitchens.
- Keep visible food and sidebar stock/capacity information consistent with actual supplies. Distinguish lack of food, lack of eating positions, and blocked access.

Complete when the Kitchen passes the checklist, produces and serves food to miners, and expansion or an additional Kitchen provides usable extra capacity. Full needs balancing and departure behavior remain separate work.

## M8 — Workshop

Follow the [room development checklist](../room-development-checklist.md) and [Workshop rules](previous-docs/rooms.md#work-and-training-facilities), using the [room concept gallery](../concept-art/rooms/README.md).

- Add the Workshop to normal construction choices and the Room Debug View.
- Automatically fit craft benches, anvils, assembly stations, and supporting fittings as space and access allow. Give it the documented distinctive floors and existing-wall treatments.
- Expose accessible crafting positions and a door/trap manufacturing service for the Engineer capability. Preserve the established female Engineer role and the Workshop's attraction relationship, with settlement support and usable capacity as conditions.
- Show staffing, usable work positions, production inputs, queued work, and outputs in the sidebar as those functions become available. Production must reflect actual worker activity and resources.
- Keep production definitions and tuning easy to extend to further door/trap types. Separate equipment manufacture, enchanting, and a Forge room remain outside the design.

Complete when the Workshop passes the checklist and a basic crafting job can be exercised from accepted work through resource use and output. Engineer recruitment and door/trap placement have not yet been assigned separate milestones: if unavailable during M8, use an explicit debug worker/job fixture to verify the room service and record those gameplay integrations as pending. An unstaffed Workshop does not manufacture automatically. Full combat, repair, and trap-replenishment systems are not required to verify this room.

## M9 — Graphics and animation pass

Added after verified M8 completion, as requested by the user. Review the approved terrain image and current Stone Hearth, Treasure Room, Dormitory, Kitchen, Workshop, Miner and female Engineer concepts. Refine the existing procedural graphics to better express their silhouettes, materials and atmosphere. Add appropriate activity animation to the existing systems: walking, mining, carrying, claiming, resting, eating and crafting, with restrained environmental movement and effects.

Preserve the common terrain height, readable grid footprints, discovery boundaries, actual room capacities and clear world view. Effects must follow real activity and stored resources; keep all text and numerical feedback in the sidebar. Use modular code-generated assets for quick iteration. This pass does not add new gameplay systems or production asset infrastructure.

Complete when terrain/resources, core, all four implemented rooms and both implemented character types have been visually reviewed against the concepts, activity animations have been exercised in the browser, and simulation/build checks still pass. Record remaining visual limitations honestly.

## Development record

### Remaining-feature milestones and onward Hearthstones — 2026-09-07

Added planned M10–M19 with dependencies and completion checks for each outstanding gameplay area, followed by integrated balancing. Recorded the user's new level objective: discover a separate Hearthstone in a difficult location and use it to progress through the runic network. Updated the canonical level rules, candidate objectives, structure description, interface direction and README. Added parallel work groups, distinguishing independent development from dependent completion checks, with M10/M13/M16 as the first split. Activation details, exact roster/campaign sequence and the ultimate ending remain explicitly provisional. This is documentation work; no milestone implementation or gameplay verification is claimed.

### Agent development tools and module boundaries — 2026-09-07

Implemented the five requested development-speed improvements after confirming the earlier targeted-spell work was committed and the working tree was clean. The development-only `window.strongholdDev` interface loads named scenarios, calls actual construction/research/defense services, returns detached state, captures runtime errors and advances fixed simulation ticks while paused. Its sidebar controls provide scenario loading, pause/step/advance and resident inspection. Browser checks use a separate headless browser and leave the existing game server/tab alone.

Shared factories cover the ordinary world, existing studios/yards/showcase, crowded food service, research interruption and locked-door hauling. They respect room costs and the free-construction flag, with explicit fixture stocks/needs. Opt-in bounded job histories report selection, rejected routes, cancellation, completion and waiting; inspectors include current routes/access/reservations. Shared test stepping helpers attach these diagnostics to condition timeouts. Scenarios are repeatable from the same source/session configuration; no saves or persistence were added.

Split continuous movement, job selection, shared acquisition/release, validity and typed execution handlers into ordinary modules, preserving priority and gameplay behavior. Extracted furnishing geometry and spell-panel construction/updates from the central scene/sidebar. Added source-and-test typechecking, focused verification with import-based changed-file selection, test watch, scoped formatting, and repeatable browser/production checks. The complete workflow and file ownership map are in [Development tools](../development-tools.md); companion instructions link to it.

Verification: all 89 simulation/input/scenario checks and source/test TypeScript checks pass. Browser checks verify paused scenario URLs, exact stepping, real construction/refunds, job diagnostics and extracted spell/furnishing views with no console/runtime errors. A final browser regression also verifies the free-construction command persists when returning from a test scenario to the ordinary stronghold. Production build and isolated preview checks pass: scenario URLs are ignored, and the development API and simulation panel are absent. Reviewed showcase and debug-panel screenshots; focused/watch scope selection, local documentation links and `git diff --check` pass. The existing Babylon bundle-size advisory remains. Scenario advancement is bounded to 600 simulated seconds per call; diagnostic history retains 300 events per world and 30 reported browser errors. The existing local development server is left running.

Prototype values remain provisional. Milestone commits are identifiable by their M-number in Git history.

### Targeted spells and autonomous combat — 2026-09-07

Replaced the retired Hearth spells with the [implemented spell catalog](../spells.md). Added pointer targeting with validation before payment, individual speed/shield/healing/debuff effects, blocked area damage and stun, a destructible temporary navigation barrier, and a timed shared rally. Reused Library research/preparation, stored gold, room access and movement. Warriors now fight autonomously through a capability; Raiders attack nearby dwarfs and spell barriers. Death releases jobs, beds and carried gold, and new residents retain unique identifiers. Combat values remain provisional; natural encounters/raids, Hearth defeat, guard scheduling and retreat remain pending.

Added restrained rune, armor, barrier and impact geometry guided by the approved terrain and Warrior references, with combat/speed animation and sidebar-only health/effect feedback. The spell yard builds actual facilities and provides explicit debug preparation, spawning, wounding, pause/reset and return controls. Spell configuration values and descriptions derive from the same registry. Active effects keep cast-time values.

Verification: all 83 simulation/input/layout tests and the TypeScript/Vite build pass (existing Babylon bundle-size advisory). New checks cover cast costs/cancellation/invalid targets, individual work and preparation, slow movement/attack cadence, damage sources, shields, interrupted healing, blocked blasts, barrier access/expiry/breakage, rally reservations/blocked routes/critical needs/new arrivals/dismissal, and combat/death cleanup. Browser review exercised the replacement catalog and targeted spell effects: Haste cost 25 on one dwarf, Mending healed the wounded target, Call to Arms reported two responders, invalid barrier targeting spent nothing, and a valid barrier appeared for 40 gold. Slow and Reckoning applied to the selected enemy; Thunder reduced its health from 120 to 90 for 50 gold. After resuming, the Warriors defeated it and all test residents survived. No browser console errors. Fixed a rally arrival tolerance edge case and the debug controls' horizontal overflow. Final whitespace and documentation-link checks pass; local Vite remains available for play.

### Documentation ownership audit — 2026-09-07

Removed redundant catalog counts, roster summaries, showcase inventories and spell details from companion docs. Spell balance and status now live in spells.md; other docs link to the owning catalog or configuration source. README records the maintenance rule: update companion docs only when their own behavior or instructions change. Historical milestone scopes, verification results and dated records remain snapshots. Documentation-only audit; checked local links, reviewed the scoped diff and ran whitespace checks. Gameplay files were not changed.

### Call to Arms spell design — 2026-09-07

Added the eighth planned spell, [Call to Arms](../spells.md#call-to-arms-behavior): all fighting dwarfs rally to a selected point for a limited period. Provisional values are 45 seconds initial research, 20 seconds repeat preparation, 25 gold per cast, 45 seconds duration including travel, and a 3-tile gathering radius. Documented capability-based responders, autonomous combat, blocked access, critical-needs exceptions, one active rally and early dismissal. Updated companion rally and Library references. Documentation only; no gameplay implementation or ongoing source work changed. Reviewed the scoped diff and checked whitespace and local links; runtime playtests remain for implementation.

### Targeted spell catalog design — 2026-09-07

Added [Spells](../spells.md) with the seven user-approved concepts: individual Haste, enemy Slow, Stoneguard, Thunder Rune, Runic Barrier, Mending Rune and Rune of Reckoning. Defined provisional research/preparation times, gold costs, effect strengths/durations, targeting and reuse restrictions. Linked the catalog from README and the Library rules. Individual Haste is the intended successor to global Hearth Haste; Prospect's future remains open. These are documented designs only, with combat and targeting dependencies identified; the playable spell definitions remain unchanged. Checked documentation links and whitespace and reviewed the scoped diff. No simulation or browser checks were needed for this documentation-only change.


### M1 — 2026-09-07
Implemented a 48 × 48 authored map, fixed Stone Hearth, six terrain types, hidden pre-opened caverns, camera-independent sight, and procedural stone/resource meshes. Verified the browser scene with no console errors, TypeScript/build, and two map/sight tests. Geometry and texture detail are prototype assets. Run with npm run dev.


### M2 — 2026-09-07
Added camera-relative WASD pan, middle-drag pan, Q/E rotation, wheel zoom with bounds, and Home to the Hearthstone. Verified rotation/pan/zoom and Home in the browser, with no console errors; TypeScript passes. Camera controls do not modify discovery.


### M3 — 2026-09-07
Added the left sidebar, known-terrain minimap with camera footprint and click navigation, empty category panels, help, and camera buttons. Verified the browser layout, minimap recentering, Home and help; TypeScript passes. Gameplay panels will be filled as their systems arrive. Diagnostic and economic text stays in the sidebar.


### M4 — 2026-09-07
Implemented three autonomous miners, click/drag excavation and cancellation, continuous routes with corner clearance and yielding, floor claiming, Treasure Room construction, circulation-preserving storage, finite gold and renewable gems, ground pickups, and delivery-only income. Seven simulation tests pass, including resource conservation, no-storage fallback, cancellation, and blocked corners; TypeScript/build passes. Browser playtest mined a seam, built storage, and observed gold rise from 340 to 520 on delivery with no console errors. A provisional 400-gold founding allowance enables the first room. Needs and later room services remain deferred to their milestones.


### M5 — 2026-09-07
Generalized room definitions, variants/orientations, edge-connected room grouping, usable-facility inspection, wall trims, and furnishing preservation. Added a separate resettable 24 × 24 Room Layout Studio with the full room catalog and eight example footprints using normal construction and selection. Main-game state stays in memory when visiting the studio. Ten tests pass, including the layout matrix, circulation, one-cell capacity, expansion, and displaced gold; TypeScript passes. Browser verified the catalog and a 45-square L-shaped room with 23 reachable chests. The M5 checklist is satisfied for Treasure Room; services for subsequent rooms follow their milestones.


### M5.1 — 2026-09-07
Added Debug to the left sidebar with free room construction, Room Layout Studio access, and a quick stronghold restart. The shared construction quote handles both creation and expansion; invalid terrain still fails. Optional VITE_FREE_ROOM_BUILDING config defaults to false. Eleven tests pass, including zero-fund free construction, unchanged balances, and restored normal pricing; TypeScript passes. Browser verified enabling the flag and constructing a studio room with its 50,000-gold debug allowance unchanged.


### M6 — 2026-09-07
Added Dormitory definition, two-cell beds with rotated fitting, personal assignments, energy/rest service, sleeping pose, and sidebar bed/energy feedback. Studio supports tired test residents. Thirteen tests pass, including every implemented room across the layout/cost matrix and three unique bed assignments preserved on expansion. Browser verified a 45-square irregular Dormitory and all three miners completing one rest cycle and resuming normal activity, with no console errors. Prototype rest interval is 100 seconds and recovery takes roughly six seconds; needs penalties remain outside scope.


### M7 — 2026-09-07
Added Kitchen growing trays, cooking hearths, tables and brewing barrels; connected usable facilities produce finite stored meals and optional ale. Hungry residents reserve meals, reach tables, eat and resume work. Added stock/access feedback and hungry studio residents. Seventeen tests pass, including all room layouts/costs, production, blocked access, and an irregular-Kitchen traffic regression. Browser verified all three hungry residents complete meals in an L-shaped Kitchen. Fixed idle parking in facility aisles and stalled approaches. Production and need rates are provisional; no Cook role, separate ale need, or departure penalties were added.

### M8 — 2026-09-07
Added Workshop benches, anvils and assembly tables, editable character/recipe definitions, the female Engineer, and queued door/trap manufacturing. Accessible stations require a capable worker; inputs are charged once at work start, and interrupted paid work resumes without charging again. Settlement attraction eligibility reports craft, bed and food support. Twenty simulation checks pass, including all room layouts and costs, staffed/unfunded/unstaffed production and interrupted work. Browser verified an L-shaped Workshop produces one reinforced door and one bolt trap, spending exactly 95 gold, with no console errors. An explicit Debug/Studio Engineer fixture exercises production; automatic recruitment and placing the manufactured defenses remain pending gameplay integrations, as allowed by M8. No combat or repair system was added.

### M9 — 2026-09-07
Reviewed the approved terrain, core, four implemented rooms and both character concepts. Added room paving and brass motifs, wall fittings and lanterns, embedded gold and gem details, contact shadows, core glow, detailed dwarf silhouettes, walking/work/carrying/claiming/eating/sleeping poses, excavation dust, crafting sparks and cooking steam. Added a repeatable four-room showcase using real services, test stocks and workers. Reduced repeated rendering work by retaining unchanged furnishings, combining static parts sharing materials, and restricting glow to light-emitting objects. Showcase loading yields between room builds.

All 20 simulation checks pass, the final TypeScript/browser build passes, and root-document Markdown links resolve. Browser review covered normal terrain and core, four room types from multiple rotations/zoom levels, sleeping and active residents, mining/claiming/hauling, shared meal/rest cycles for all four test residents, and one completed door plus trap. The final browser console reported no errors. The working art remains procedural geometry and textures; the [graphics pass notes](graphics-pass.md) record references, animation hooks and visual limitations. Vite reports a large Babylon.js bundle; production splitting and deployment remain outside this local prototype milestone.

### Camera control correction — 2026-09-07
WASD and an 18-pixel window-edge band now pan relative to the current view while preserving angle, tilt and zoom. Moving the orbit target directly fixes the prior angle/radius drift caused by rebuilding the camera from its old position. Left Ctrl+A/D and horizontal middle-button drag orbit the viewed point at a fixed tilt; Q/E remains available; the sidebar rotation buttons were removed as requested. Edge pan pauses during middle drag, and blur/hidden-page handling clears navigation input. The edge band and drag sensitivity are provisional tuning values. The band follows the outer browser viewport, including its far-left edge beside the sidebar; crossing the sidebar/world boundary does not pan.

Verified with a real Babylon NullEngine regression covering all four WASD directions at multiple rotations, all four edges, sidebar interior, both Ctrl orbit directions, middle drag/release, blur cleanup and map bounds. All 21 tests and the TypeScript/browser build pass (existing bundle-size advisory remains). Browser playtest verified WASD translation, Ctrl orbit, right-edge scrolling, Home/sidebar recentering and updated help, with no console errors. Middle dragging was verified through pointer-event regression; the browser automation interface does not expose a middle-button drag gesture.

Removed the sidebar rotation buttons and added a standard beforeunload confirmation request for accidental closing, refresh and navigation. This does not disable browser-owned Ctrl+W and depends on the host honoring beforeunload after user interaction. Browser inspection confirms only Home and zoom buttons remain. The updated build passes. Reload verification in the embedded test browser stalled without exposing a dialog to automation, so the visible close prompt in the user browser remains unverified.

### Default excavation and reselection — 2026-09-07
Excavation is now active on startup, restart and return from the room studio. Right-click or Escape cancels the current gesture/tool and immediately returns to excavation; cancelling an in-progress room drag cannot place its remaining tiles. Each diggable tile in a click/rectangle toggles once on release, so reselecting marked tiles removes their orders. Mixed selections independently invert their tiles. The erase tool still explicitly removes marks, and debug designation calls retain their explicit add behavior. Open-floor/room clicks continue to inspect through the default cursor. Preview colors distinguish adding and removing designations.

Verified 23 passing tests, including pointer-event coverage of default clicking, repeated selection, mixed drags, construction/cancel, Escape and inspection, plus simulation coverage of cancelling active mining and rejecting hidden/non-diggable targets. TypeScript/browser build passes. Browser playtest confirmed the startup tool, marking/reselecting a gem tile, switching from room placement back to excavation by right-click, and no console errors. Documentation reflects the new defaults.

### Action cursors and room icon selector — 2026-09-07
Replaced room cards with a four-column icon grid and a selected-action panel showing the shared room icon, name and current cost per square. Free construction displays zero. All seven catalog rooms have distinct editable vector artwork; the three unimplemented rooms remain disabled. The same artwork powers native 64-pixel world cursors: pickaxe for digging, minus-marked pickaxe for clearing, eye for floor inspection, and the selected room symbol for building. Right-click/Escape restores the excavation context and clears room highlighting. Sidebar controls keep normal pointers, accessible names and hover titles. Removed repeated selection instructions and obsolete room glyph/card styling; inspection and construction feedback remain in the sidebar.

Verified all 23 tests, including cursor changes alongside actual selection/cancellation behavior, and the final TypeScript/browser build. Browser review covered all four available room selections/prices, shared SVG image loading and applied cursor CSS, disabled planned rooms, right-click cancellation and zero-price free construction. Visual review at 1280 x 720 confirmed the compact grid and selected-room layout; no browser console errors. Native cursor images are excluded from the browser screenshot capture, so their artwork was reviewed through the identical sidebar images and their applied CSS. Icons are original code-generated vector assets inspired by the supplied interface references, not extracted screenshot art. Cursor size and artwork remain tunable prototype choices.

### Excavation planning through darkness — 2026-09-07
Excavation and erase gestures now pick unexplored cells and show their planned marks above the dark terrain. All hidden contents accept identical plans, including concealed floor and bedrock; cursor, preview height and mark visibility do not reveal those contents. Construction/inspection still require discovery. Miners only schedule discovered targets, while normal sight exposes successive work as a tunnel advances. On discovery, non-diggable cells lose their excavation marks automatically. Hidden tiles keep their plans until discovered or explicitly cleared.

All 25 tests pass, including hidden click/toggle without floor-inspection leakage, cleanup of discovered corridor/bedrock marks, preservation beyond a blocking wall, and a miner completing a tunnel queued through darkness into a pre-existing chamber. TypeScript/browser build passes. Browser playtest verified a multi-square drag into fog, persistent marks over darkness and marks disappearing at newly discovered unmineable boundary cells; no console errors. Fog and minimap discovery remain controlled by simulation sight.

### Consistent excavation drag intent — 2026-09-07
The first tile now locks add/remove intent at pointer-down for the entire excavation rectangle. Adding preserves existing marks; removing only clears existing marks. Cursor and previews use the locked action instead of changing over each tile. Release/cancel clears the gesture intent; single clicks still toggle and the explicit erase tool always removes. This supersedes the earlier mixed-selection inversion behavior.

All 25 tests and the TypeScript/browser build pass. Pointer regression checks cover overlapping add/remove drags, fixed cursor intent and cancellation. Browser playtest verified an overlapping add rectangle remains fully marked, followed by a larger removal rectangle leaving no new marks in surrounding darkness, with no console errors.

### Partial room placement — 2026-09-07
Room quotes now filter a selection to eligible new claimed floor instead of rejecting the entire drag for one invalid cell. Terrain, hidden/unclaimed squares, the Hearthstone, other rooms and already-built same-room squares are preserved and cost nothing. Drag endpoints may be in ineligible terrain; only inspection remains restricted to known cells. Preview validity is per tile, and the sidebar count/price uses only newly buildable squares. Empty eligible subsets do nothing; affordability still applies to the whole eligible subset. Normal and debug construction share this behavior.

All 26 tests and the TypeScript/browser build pass. The shared checklist matrix passes for all four implemented rooms; new checks cover mixed obstacles, unknown/unclaimed/core/occupied cells, duplicates, out-of-bounds cells, exact charges, free construction, expansion, automatic furnishings and access. Browser playtest dragged across the Hearthstone and nearby floor: two eligible squares were built for exactly 24 gold, with the core preserved and a reachable chest furnished. No browser console errors.

### Inspection cursor simplification — 2026-09-07
Removed the eyeball artwork and switched inspection to the normal pointer. Clicking open floor still inspects it. Updated help and control documentation. Selection regression and TypeScript checks pass; browser inspection confirmed the default cursor on open floor and working sidebar inspection.

### Stone Hearth starter treasury — 2026-09-07
Added one empty chest to the Stone Hearth, positioned on its existing blocked footprint beside an authored open approach. Its capacity is derived from nine Treasure Room squares (currently 108 gold), enough for a functional 3×3 room. The same storage service now drives hauling, shared gold totals and spending for both Hearth and room chests. The fixed chest survives furnishing recalculation, and its approach remains protected from automatic furniture placement. The existing 400-gold allowance is unchanged. Hearth inspection reports stored gold/capacity, with a live sidebar summary; actual stored coins use the normal chest renderer. The room studio also includes the chest. Future level definitions need an open approach beside the core for the attached chest.

All 27 tests pass, including starting at zero funds, mining 180 gold, filling the chest to 108, purchasing a furnished 3×3 Treasure Room entirely from that chest, retaining exactly one Hearth chest, and delivering the remaining 72 gold afterward without loss. Shared room layout/access/free-construction checks pass; tests for deliberately absent storage now explicitly remove the Hearth fixture. TypeScript/browser build and final TypeScript check pass. Browser reviewed the attached chest and verified a miner delivery increasing shared gold from 400 to 445 before any Treasure Room existed, with Hearth inspection showing 45/108 and no console errors.

### Raw ground and miner wall reinforcement — 2026-09-07
Unclaimed open tiles now use bare earth with scattered stones, without paving joints; claiming replaces this with the established floor material. Natural dirt, rock, bedrock and resource walls also use rough surfaces instead of masonry. Miners now reinforce discovered ordinary dirt/rock beside reachable claimed floor as a low-priority, unpaid job after mining, hauling and claiming. One tile has one reinforced state, shown as cool masonry; room wall fittings and lanterns wait for that state. Bedrock and resource seams are excluded. Six seconds per wall is provisional. Designating a wall cancels its reinforcement; player excavation clears the state with normal mining time. Enemy breach strength remains for future combat integration.

The existing 27 simulation/input/layout tests pass, plus three focused reinforcement checks covering work completion, mining priority/cancellation, excluded terrain, claimed access and subsequent excavation/claiming. TypeScript/browser build passes (existing Babylon bundle advisory). Browser review confirms rough natural surfaces and the contrast with claimed paving; reinforcement visual playtest recorded below.
Browser playtest also confirmed all three miners enter the Reinforcing wall activity, masonry appears as work finishes, and excavation input still accepts a retained earth block. No browser console errors. The development server remains running at http://127.0.0.1:5173/.

### Direct gold-seam collection — 2026-09-07
Finite seams now release tunable 15-gold batches every half-second directly into a miner's 45-gold bag when reachable treasury space exists. Full bags trigger delivery, preserving the pillar and designation until the last gold is extracted. Miners remember the unfinished seam for their return, subject to needs, cancellation and another worker taking it. Exhaustion or cancellation sends partial bags to storage. With no reachable capacity, gold stays at its extraction tile. If capacity disappears or only part of a bag fits during delivery, miners try other storage, then carry the excess back to its source instead of dropping it on a corridor. Capacity is checked again on arrival in case space reopened. Renewable gem extraction remains unchanged.

Five new simulation checks verify incremental bag filling, a half-mined pillar surviving its first delivery, complete eventual delivery, no/full storage, capacity disappearing during travel, collecting fallback piles later, partial deposits, and cancelled/partial final bags. They assert gold conservation throughout. The existing seven mining checks also pass, including zero-funds Hearth recovery. Full-suite, build and browser verification are recorded below.
All 35 tests and the TypeScript/browser build pass (existing Babylon bundle-size advisory). Browser playtest designated a finite seam, observed its exhaustion and total gold increasing from 400 to 490 in the Hearth treasury, with no console errors. The development server remains running on port 5173.

### Configuration editor and soft crowd movement — 2026-09-07
Moved shared mining, needs/food, movement, economy/world and camera values into labelled tuning definitions. Added a tabbed modal under Debug with atomic validation, draft reset/export, explicit live/new-object timing, and simulation/camera pause while open. Room and recipe fields are generated from their registries. `configuration.md` maps all editable definitions and distinguishes balance from procedural art. Starting sight now follows the authored Hearth location rather than prototype-specific coordinates.

Dwarfs keep soft separation where it helps, but follow their terrain-valid path through crowds when separation would stall or push them into furniture. Changed obstacles trigger repathing; terrain/furniture remain solid. Focused configuration, gold, discovery and camera checks pass. Opposing traffic in a one-tile corridor passes with brief permitted overlap, and Kitchen crowding checks pass. Browser verified the popup layout, tab groups and applying a mining duration edit. More integrated verification follows with the construction/removal commands.

### Wall construction and room reclaim — 2026-09-07
Added icon/cursor commands for wall plans and reclaiming room floor. Wall drags lock add/cancel intent on their first square and skip rooms, hidden/unclaimed terrain, loose gold, core and facility access. Plans remain walkable and reserve their tiles against room building. Miners work from an adjacent clear tile; progress survives interruptions, cancellation clears it, and occupancy prevents a wall completing over a dwarf. Idle occupants leave planned sites. Completed walls are reinforced rock, take 24 seconds by default (always longer than excavation plus reinforcement), and can be excavated normally. Wall construction currently costs time only. Inaccessible plans wait like excavation orders; closing a gap can intentionally cut access.

Room tiles record their actual original payment. Reclaim refunds 50% (configurable, rounded down per tile), skips invalid/duplicate squares, returns room floor to claimed floor, and recalculates furnishings. Free-built tiles refund zero and price changes cannot increase refunds. Refunds are immediate spendable credit, including after selling the last Treasure Room. Removed chest contents remain loose gold; food stocks are retained and refill replacement production facilities. Completed manufactured outputs remain in the shared inventory. Active jobs invalidate/release through the normal scheduler.

Six focused simulation checks plus the selection regression pass: construction time, occupancy, invalid targets, cancellation, later excavation, paid/free/refunded tiles, stock preservation and food recovery. Browser placed one Treasure Room square for 12 gold and reclaimed it for 6 (400→388→394); wall completion check follows. Configuration and movement changes also pass the existing room layout/free-build and Kitchen access checks.
Browser also confirmed the planned wall became a full-height reinforced wall after miner work, with no console errors. Final TypeScript and focused command/movement tests pass.

### Additive content audit — 2026-09-07
Verified the original definition/service boundaries and corrected remaining type-name coupling. Food production now uses room components and services regardless of room ID. Furnishing models are selected independently of their gameplay kind/room; room palette, motif and icon are in the room definition. Shared icons resolve through that look definition. Debug spawning lists every character definition, attraction feedback names missing services, and per-type movement multipliers appear in the Dwarfs settings tab. Room summaries use services. Procedural stock visuals are bounded when capacity is increased for testing.

Added `content-playbook.md` with copyable room/dwarf entries, a service/model table, exact file map, automatic UI integrations, reclaim/stock/needs/access checks, and explicit instructions for truly new behaviors. Updated the existing room checklist and character documentation. Two additive-content regression tests register a renamed food room and new specialist/recipe: production, visuals selected from data, layout, reclaim, attraction, shared needs and exact crafting cost all pass without simulation changes. Full-suite/build and browser verification follows.
Browser review verified the generated dwarf catalog by spawning an Engineer (3→4 residents), the Dwarfs configuration tab, and the complete four-room showcase after the model/appearance changes. Earlier browser checks covered a live mining edit, a constructed wall and a 12-gold room square reclaimed for 6. No browser console errors. All 45 existing/new tests passed; an additional high-speed movement regression verifies that extreme debug speed values cannot jump across a wall added to an existing route. Movement now checks the full travel segment against terrain. Final checks are recorded below.
Final verification: all 46 tests pass and the TypeScript/Vite build passes (the existing Babylon bundle-size advisory remains). The browser showcase showed each of the four residents completing three rests and at least three meals, with continued work and no console errors. Documentation links in the new guides resolve, and `git diff --check` passes. Changes are committed in completed chunks; the local game server is left running for play.

### Training Room, Library, Warrior and Runesmith — 2026-09-07

Implemented the four requested additions using the room checklist and content playbook. Training and research are shared services with distinct accessible work positions, reservations, cancellation and progress independent of furnishings. All four dwarf types train autonomously; Runesmiths research selected spells and prepare them again after casting. Normal specialist arrivals now use the Hearth route, spare service positions, beds, stored food and sustainable food production/serving within connected room components. The same rules cover Engineers. Arrival testing is opt-in in the room studio.

Reviewed the approved terrain and all four relevant concept sheets. Added automatic compact/large practice and research furnishings, room floor and reinforced-wall identities, Warrior and Runesmith appearances, and training/research animations. Sidebar controls expose training stats, real occupied/available work positions, arrival requirements and spell queue/pause/resume/casting. The six-room showcase uses actual construction, stocks and services. No floating world labels or meters were added.

Provisional rules: Training Room 22 gold/square, Library 26; 12 seconds per training level, 45 seconds between sessions, five levels, +8% work speed each. Research unlocks Hearth Prospect and Hearth Haste; casting uses shared gold and queues shorter preparation for repeat use. Full values and behavior are recorded in rooms.md and exposed in Game configuration. Combat, guarding, paid Miner recruitment, wages, departure, defensive placement and campaign progression remain pending in the current inventory.

Verification: all 60 tests pass, plus the final TypeScript/Vite build (existing Babylon bundle-size advisory). Both rooms pass the shared eight-layout matrix and focused checks for paid/free expansion, reclaim/refunds, separate components, blocked/restored access, narrow enclosed corridors, shared work squares, reservation release and retained progress. New dwarf checks cover shared meals/rest/training, capability exclusion, actual work bonuses, research pause/resume, casting costs/reuse, blocked sight and normal arrival limits. Review found and fixed food eligibility pooling across disconnected room sections.

Browser review covered six-room construction, new geometry at different camera distances/angles, shared needs/training for all four types, research completion, pause/resume, Haste costing exactly 30 gold and queuing preparation, an ineffective Prospect cast spending zero, 9 training positions / 7 research positions in the showcase, and automatic arrivals stopping at 8 residents when beds filled. Browser console checks reported no errors. A longer browser run exposed a resident repeatedly clipping the first corner of a route from a fractional position. A failing movement regression now passes after adding a safe first leg through the current tile center. The exact 600-second showcase replay then kept all 8 residents eating/resting, reached training 5 for everyone and completed both spells and crafting outputs; the previously stuck Engineer completed 7 meals and 6 rests. Documentation links and git diff --check pass. The local Vite server remains available for play.

### Door tiers, access controls and automatic traps — 2026-09-07

Implemented the requested three door tiers and Open/Closed/Locked modes, spike damage with temporary pinning, and directional bolt firing. Both traps automatically reset after cooldown, as the user specified. Editable defense definitions supply health, damage, ranges and timings; five Workshop recipes supply finished items. Placement consumes one stock item, with manufacturing as the timed build step and immediate installation. Door passage and sight queries are shared by navigation, discovery and combat interactions. Locking recalculates active routes and releases unreachable jobs without losing paid crafting/research progress. Occupants can step clear, idle dwarfs leave doorways, and Closed doors shut after passage. Fixture tiles are excluded from room/wall construction.

Provisional balance: timber/reinforced/steel doors cost 20/40/80 gold, take 4/8/16 seconds of Workshop work and have 100/250/500 health. Spikes cost 35 gold and 6 seconds, deal 40 damage, pin for 2 seconds and reset after 6. Bolts cost 55 gold and 10 seconds, deal 30 damage to the first enemy within 7 squares along their facing and reset after 3. Walls, furniture, the Hearth and shut doors block shots; dwarfs neither trigger traps nor take friendly fire. No ammunition or Engineer rearming is needed. Dismantling gives no refund. Existing doors retain their health and maximum health when configuration changes.

Added a defense sidebar with stock, prices, work time, directional placement, door controls, condition/cooldown inspection, and a placed-fixture list. Procedural hinged doors, locks, damage seams, rising spikes and bolt flight keep animation independent of gameplay. The Goblin Raider concept guides a simple debug enemy with continuous navigation, alternate-route preference, door attacks, pinning and defeat. Debug's resettable defense yard uses actual construction, manufacture and placement with explicit test stocks, and respects the free-room flag while production still charges gold.

Verification: the full 74-test suite passed. Final focused defense/configuration checks passed all 16 tests, including an added free-room yard regression; the repository now contains 75 tests. Checks cover all recipe costs/outputs, invalid placement and overlap, route cancellation/resumption, locked-door occupants, sight, increasing breach resistance, alternate routes, fast pressure-plate crossings, lethal/nonlethal spikes, friendly exclusion, bolt facing/range/occlusion and automatic resets. Final TypeScript/Vite build passed with the existing Babylon bundle-size advisory; local Markdown links and `git diff --check` passed.

Browser review verified all three door controls, dwarf hauling through a Closed door (20 gold returned), trap-assisted raider defeat, an unassisted raider breaking a locked timber door and reaching its target, invalid overlap feedback, a new spike placement, and a new bolt placed facing west after two R rotations. Review widened the test approach and steepened its camera so traps remain visible beside full-height walls, and moved selected-door controls above the build catalog. Normal defense production/placement and dwarf routing are usable; enemies remain manually spawned in the debug yard. Natural encounters/raids, dwarf combat, Hearth attacks/defeat, repairs and upgrades in place remain pending. Updated the canonical inventory, README, room/rule/interface/character designs, content playbook and graphics notes together. The local Vite server remains available for play.

### Room capacity simplification — 2026-09-07

Implemented the user's replacement room model: each connected room supplies floor area multiplied by its editable capacity per square, with fractional results rounded down per component. Kitchen and Dormitory support one resident per square by default; Training Room, Workshop and Library support one concurrent user per square; Treasure Room stores 50 gold per square. These are provisional balance values. Furnishings are separate cosmetic data and cannot change capacity, navigation, sight, bolt shots or spell-placement access. Single-square, narrow and irregular rooms work without furniture. The core treasury remains a separate 108-gold starter service.

Removed growing, cooking, brewing, ingredients, prepared-meal and ale stocks from gameplay and configuration. Residents retain autonomous eating/rest visits and individual support assignments, so a small Kitchen cannot feed an unlimited population through successive meals. Arrivals use spare reachable floor-based accommodation, food and role capacity. Workshop outputs and spell research/preparation keep their existing gold, time and capability rules.

Training grants one level per completed visit, releases the capacity slot and starts the dwarf's personal cooldown. Existing 12-second practice, 45-second cooldown, five-level cap and +8% work-speed values remain provisional. Interrupted progress survives, and cooldown trainees resume duties or leave the training floor. A final review caught and fixed an Engineer waiting for an unfunded craft order bypassing the exit behavior; its focused regression now passes. Combat progression remains outside this room change.

Room construction previews show exact added capacity, including fractional-capacity joins and expansions. Inspection shows room area, capacity, assignments/occupancy and unreachable capacity. Configuration edits synchronize room services; stored gold displaced by reduced capacity or reclaim remains loose for hauling. Decorative changes preserve service reservations and stored gold. Normal, debug and retained in-memory worlds share the same rules. Updated the canonical designs, README, room checklist, configuration guide and additive-content playbook; older development entries are historical.

Verification: all 97 simulation/input tests pass, source-and-test TypeScript checks pass, and the final TypeScript/Vite build passes with the existing Babylon bundle-size advisory. The room checklist matrix covers all six implemented rooms and eight shapes, paid/free placement and expansion, inaccessible/restored routes, retained terrain, reclaim/refunds, capacity tuning, multiple users and gold conservation. Focused checks cover furniture-free food/rest/work/research/training, continuous population support, one-level cooldown and departure, multiple configured slots sharing a tile, and decoration-independent combat/path behavior.

Browser verification: `npm run verify:browser` and `node scripts/rooms-browser.mjs` pass. A real dwarf used unfurnished one-square Kitchen, Dormitory and Training Rooms, ate/rested, gained one level, waited out cooldown and gained a second. Live Kitchen capacity changed from one to two with no furniture; sidebar previews/inspection and the six-room showcase were checked in multiple camera angles with no console errors. Screenshots are in ignored `test-results/rooms-*.png`. Occasional purely visual prop/resident overlap remains; stationary activities use a small presentation-only offset within their actual tile. Local documentation links and `git diff --check` pass. The Vite server remains running at http://127.0.0.1:5173/.

### Character levels and combat values — 2026-09-07

Replaced the shared training-upgrade counter with explicit character levels 1–5. Each type has five editable rows defining maximum health, damage, attack interval, productive work multiplier and active practice required to enter that level. New arrivals start at level 1. Advancement requires the previous level, a free reachable Training Room slot, sufficient needs and an expired personal cooldown. Only active practice advances the requirement; interruptions retain progress, each completed visit grants one level and releases its slot, and the final level stops training. Ordinary work and combat award no experience. Haste can accelerate practice; the permanent work multiplier does not. The shared cooldown remains 45 seconds.

Workers reach a 40% productive work bonus at level 5. Warrior advancement focuses on health and melee damage. Workers have weaker adjacent self-defense through a separate capability, without pursuit or rally response. Combat uses each reached level's damage and attack interval; health growth preserves existing wounds rather than fully healing or reviving a dwarf. Per-level configuration edits apply to the relevant current and retained residents, preserving missing health. Unrelated configuration edits leave health alone. Shields and healing use maximum health at cast time and retain those values across subsequent level gains. The sidebar reports current level, health, combat values, work bonus, next requirement, progress and cooldown; all twenty default rows are documented in characters.md.

Verification: all 105 simulation/input tests pass, source-and-test TypeScript checks pass, and the TypeScript/Vite build passes with the existing Babylon bundle-size advisory. Focused checks cover all four types, target-level duration, Haste without double-counting work bonuses, one-level visits, cooldown and final cap, interruptions/reclaim, actual faster work, wound preservation, live configuration, spell scaling, self-defense and reservation release/resumption. An adjacent duel using the provisional defaults defeats the level-1 Warrior with 36 Raider health remaining; the level-2 Warrior wins with 25 health remaining. A 600-second default showcase replay keeps all six residents eating/resting, takes each to level 5, completes both queued crafting outputs and continues spell research. This is a prototype balance baseline; natural raids, guard duty, retreat, wages and campaign progression remain pending.

Browser verification: `npm run verify:browser`, `node scripts/rooms-browser.mjs` and `node scripts/characters-browser.mjs` all pass without console/runtime errors. Default one-square rooms provide food/rest and training from level 1 to 2, cooldown and then level 3. The character check uses the real configuration dialog to shorten practice and observe every level for all four types, verifies stat displays, one-level visits and the final cap, and applies health/damage/interval/work changes. A real enemy attack creates the injury used to verify preserved wounds; the retained stronghold also receives the health edit. Reviewed the level-cap and configured-stat screenshots in ignored `test-results/character-levels-*.png`; base stats are labelled separately from temporary spell effects and stay within the sidebar. All twenty documented numeric rows match source, 170 local Markdown links resolve, the final build and `git diff --check` pass. The local Vite server remains running on port 5173.


### Combat experience — 2026-09-07

Successful melee hits now add to the same resident experience total as Training Room practice, superseding the training-only rule above. Training earns 1 XP per active second. Each damaging hit on a living enemy grants the base attack interval multiplied by the tunable combat experience rate, provisionally 2, giving roughly twice the training rate during sustained attacks. Warriors and defending workers qualify. Pursuit, rallying, receiving damage, traps and player spells grant no XP, and kills add no separate bonus. Haste increases experience through attack frequency without multiplying the reward again.

Combat can level a dwarf during training cooldown and continues the fight. Each level gain preserves wounds and restarts the training cooldown; surplus combat XP carries toward the next level. Training still ends after one level per visit. The level-5 cap stops further XP accumulation. The sidebar shows shared XP and both rates; existing per-level training durations remain the shared XP requirements at 1 XP per second. Companion rules and configuration documentation now describe both advancement sources.

Verification: all 108 simulation/input tests, source-and-test TypeScript checks and the TypeScript/Vite build pass (existing Babylon bundle advisory). Focused checks cover mixed training/combat progress, cooldown bypass, mid-fight stat gains and wounds, per-type hit rewards, attack waiting, Haste, zero damage, pursuit/dead targets, surplus and cap. The updated character browser check passes with no console/runtime errors: all four types still train through levels 1–5, and a Warrior in the Spell Test Yard gains a level from actual melee hits without a Training Room, then keeps earning XP during training cooldown. Reviewed the combat screenshot in ignored test-results/character-combat-xp.png. git diff --check passes; the local server remains available on port 5173.

### Implementation inventory documentation — 2026-09-07

Documentation correction — 2026-09-07: added this inventory after the missing-content question exposed that current status was scattered across historical entries and design catalogs. Checked the room/character registries, pending-system wording in the implementation playbook, and the development record. Linked the inventory from README and both content design documents, and added maintenance requirements to the content playbook and room checklist. Documentation-only change; reviewed the diff and checked whitespace and the new link target. No gameplay behavior changed.

### Development history archive — 2026-09-07

Moved completed milestone specifications, completed tracker rows and dated development records out of the active plan. Preserved the active implementation inventory, current rules, pending M10–M19 roadmap and parallel-work guidance. Updated startup and maintenance references to make historical reading optional and keep future completion records here. Documentation-only reorganization; no game behavior changed.

Verification: completed milestone specifications and prior development records were preserved verbatim, the unfinished roadmap was unchanged, and 143 local documentation links/anchors resolved. Whitespace review passed; no simulation/browser tests were needed for this documentation-only move.

### Defense and spell menu styling — 2026-09-07

Defenses and Spells now share the Rooms four-column icon grid, selected-item header and active/focus styling. Distinct door-tier and spell artwork identifies each choice. Defense stock, manufacture costs, placement details and bolt facing remain available; Spells shows one selected spell’s research and casting controls, with compact state markers and expandable Library details.

Verified: 32 focused defense, spell and progression/research simulation checks; TypeScript/production build; browser checks for all eight spell choices, research/pause/resume, unavailable and prepared casting, defense selection/facing and a 1024×720 layout. Reviewed both rendered menus and found no browser runtime errors. Existing Babylon bundle-size advisory remains.

### Debug menu separation — 2026-09-07

Debug now separates current-world actions and shared session settings from Test harnesses. All harnesses and replacement layouts start paused, expose one Pause/Resume control, and offer Return to stronghold across panels. Returning preserves gameplay state and the prior pause state. Restart is only offered in the ordinary game. Tired/hungry setup labels describe their 10% effect and room requirements; test spawning explains bypassed arrivals and failed placement. Workshop production remains in gameplay panels.

Verified: 35 focused development/simulation checks, source-and-test typecheck, production build, and the dedicated browser menu/transition playtest. Production isolation also passes. Existing Babylon bundle-size advisory remains. Test worlds are still disposable and shared tuning intentionally affects both worlds.

## M10 and M13 — parallel implementation — 2026-09-07

| Milestone | Outcome | Status |
|---|---|---|
| M10 | Natural enemy encounters, camps/nests and raids | Complete |
| M13 | Paid Miner recruitment and wages | Complete |

### M10 — Natural enemy encounters and raids

Dependencies: existing discovery, navigation, combat and defenses.

- Place resident hostile groups and camps/nests in editable level definitions. Discovering or opening routes can activate threats according to explicit scenario rules.
- Add raids through authored physical entrances, with tunable timing, warning conditions and source-clearing behavior. Use the existing Raider first; M17 expands the roster.
- Route enemies through the real terrain, doors and barriers. Handle sealed routes without spawning enemies inside protected rooms or bypassing bedrock. Keep undiscovered enemies concealed; warnings must not reveal hidden positions.
- Supply a resettable scenario using normal encounter/raid systems, with debug controls to inspect and advance their state.

Complete when normal play can discover a hostile group and experience a warned external raid without manual enemy spawning; opening/closing routes changes their approach, defenses and dwarfs can defeat them, and a cleared source obeys its authored repeat/stop rule. Verify blocked entrances, hidden enemies, trap interactions and repeat triggers. Hearth attacks follow in M11.


### M13 — Paid Miner recruitment and wages

Dependencies: existing economy, recruitment and needs. Can start alongside M10; M11 supplies defeat gating for final integration.

- Add a sidebar Miner purchase with the displayed price based on the current living Miner count, including starting Miners. Charge stored gold exactly once and spawn through the starting Hearth's normal arrival route.
- Use editable minimum/price-step values initially; deaths and M14 departures lower the next price. Finalize any accommodation/food purchase eligibility and show the reason when purchase is unavailable.
- Add positive per-type wages, payday timing and autonomous physical collection at reachable Treasure Rooms. Specify withdrawal across rooms and whether the starter treasury supports wages. Allow ordinary travel/queues before treating pay as overdue.
- Distinguish insufficient funds from inaccessible storage, preserving shared-gold accounting and ordinary job/need scheduling.

Complete when purchases display and deduct the correct price, failed purchases spend nothing, population changes update the price, and every dwarf type collects one wage per due payment. Verify concurrent spending, depleted/inaccessible/reclaimed treasuries, restored access, interrupted collection and a fresh level's price reset. Persistent dissatisfaction follows in M14.


### Implementation and verification

Implemented with independent encounter and economy agents, shared root integration, and a dedicated browser verification agent. Encounter sources use stable level definitions, concealed resident camps, physical entrances, discovery/route/time activation, generic unknown-source warnings, one pending/active wave per source, defeat/claim clearing and bounded route retries. Enemies share actual terrain/door/barrier navigation without revealing player terrain. Normal Border Foothold has a north camp (8-second discovery warning) and an east entrance (first warning at 360s, 25-second warning, repeat 150s after defeat).

M13 adds sidebar purchases at 50 + 25 per living Miner, requiring reachable spare food/accommodation and a clear Hearth arrival route. All types receive personal paydays 120s after arrival at 4/7/8/10 gold, collecting each installment in a 1-second treasury visit. Funds are taken only at completion from allowance and actor-reachable storage; the starter treasury participates. Due amounts survive tuning, interruptions, door changes and reclaim; 45s permits travel before an overdue warning. Combat, carried resources and urgent needs take priority. A terminal-state hook gates purchases, arrivals and ticking; natural core defeat that sets it remains M11. Dissatisfaction/departure remains M14.

Verification: all 124 simulation/input tests pass; source-and-test typecheck and production build pass. Six encounter checks cover hidden default sources, actual mining/claiming, door/barrier/bedrock and occupied-spawn behavior, warnings, combat/traps, clearing and repeats. Ten economy checks cover prices, failed/ended purchases, all-type physical collection, queues, accessible reserve accounting, concurrent spending, interrupted/reclaimed/blocked treasuries, due-amount snapshots, needs and real combat interruption. An existing mining conservation check now includes paid wages.

Browser: existing smoke baseline passed; scripts/milestones-browser.mjs m10 and m13 pass with no console/runtime/API errors. Actual UI purchases, exact 29-gold initial payroll, blocked/restored access, fog-safe warnings, excavation activation, camp defeat, subsequent raid and reset were verified. Seven screenshots were visually inspected in ignored test-results/m10-*.png and m13-*.png. An initial encounter browser run was invalidated by source reload during integration; the settled-source rerun passed. The local Vite server remains running. Existing Babylon bundle-size advisory remains. No core damage, retreat, dissatisfaction, save infrastructure or campaign travel was added.

Final integration: production isolation passed (scenario URLs and the development API/panel remain absent from production). All 252 local Markdown links/anchors resolve, and git diff --check passes. Completed milestone specifications were moved out of the active plan; current limitations and the next parallel-work dependencies remain there.


## M11 and M14 — completed 2026-09-07

The user authorized M11 and M14 using parallel agents. Their accepted milestone scope is archived below; current behavior, limits and remaining dependencies stay in development-plan.md and the owning design documents.

| Milestone | Outcome | Status |
|---|---|---|
| M11 | Starting Hearth defense/defeat and onward Hearthstone objective | Complete |
| M14 | Dissatisfaction, need alerts and departure | Complete |

### M11 — Hearth defense, defeat and the onward objective

Dependencies: M10. Use an enemy-held land route first; hazardous approaches follow in M16 and actual next-area travel in M18.

- Give the starting Stone Hearth tunable health and enemy targeting/damage. Its destruction ends the level in defeat, with clear sidebar feedback and restart. Resolve core repair policy explicitly; do not add upgrades or relocation.
- Add a distinct map-defined onward Hearthstone, initially hidden under normal discovery. Track discovery, physical access and readiness to proceed independently of the starting core.
- Define and implement a minimal activation rule consistent with autonomous movement. The working proposal is a living dwarf reaching an accessible interaction position and securing the immediate site; exact occupation, time and threat conditions must be recorded before implementation. No remote activation merely from camera movement or sight across a gap.
- Present the objective and its current obstruction in the sidebar. Reaching/activating the onward stone completes the local objective and exposes progression readiness; M18 connects that state to another area.

Complete when one playable scenario supports both outcomes: enemies can destroy the starting core, or the player can find and reach the onward Hearthstone through its defended approach. Verify no premature completion through fog, walls, remote clicks or blocked approaches, and no completion after defeat. Restart clears terminal/objective state. Reaching the onward stone does not relocate the base or silently change recruitment/treasury behavior.

### M14 — Dissatisfaction, alerts and departure

Dependencies: M13 and existing food, rest, attraction and sidebar messages.

- Track sustained unmet food, accommodation, pay and role-facility requirements with tunable grace, escalation and recovery. Brief queues or interruptions must not cause immediate departure.
- Explain the actual cause with grouped, dismissible sidebar warnings; resolving a shortage clears the active warning and permits recovery.
- Persistently dissatisfied dwarfs autonomously leave through the starting Hearth. Release jobs and service reservations, preserve carried resources, update population/attraction and Miner prices, and define behavior if departure access is blocked.

Complete when temporary shortages recover without departures, prolonged shortages produce timely warnings and eventual departures, and fixing the cause changes the outcome. Verify all four types, blocked exits, room reclaim, wages restored before departure and resource/capacity accounting afterward.

### Completion and verification — 2026-09-07

- M11: separate authored onward stone in the normal northern camp; hidden planning and discovery preserve fog privacy. Sidebar requests schedule any eligible living, nondeparting resident to an adjacent square for eight uninterrupted seconds; needs, funded actionable wages, combat, blocked access and nearby threats can interrupt and retry. Natural Raiders physically damage the 400-health starting core; destruction wins a simultaneous activation. Both outcomes freeze ordinary gameplay and provide restart without moving the base or changing its treasury. Core lighting dims with damage; attackers animate their strikes. No core repairs or campaign travel were added.
- M14: all four resident types track sustained missing food, accommodation, pay and required role capacity, with 120 seconds of grace, another 180 seconds before leaving and two seconds of grievance recovery per supported second. Grouped warnings can be dismissed/reopened. Residents physically leave through the starting Hearth, wait on blocked routes, preserve carried resources and release work/population capacity. Restored causes cancel departure, including when a previous departure frees support during the same tick.
- Shared integration: world/types, scheduling, terminal service guards, sidebar/configuration, rendering and registered hearth/hearth-defeat/morale scenarios coordinated by the parent agent. No new room types, persistence or production infrastructure.
- Verification: final `npm run verify -- all --production` passed all **143 simulation tests**, source/test typecheck, production build and production isolation. Hearth checks plus the existing world tests cover hidden plans, physical access, interruptions, wage/departure priority, enemy reach/cadence and simultaneous outcomes; Morale checks cover recovery, all types, grouped warnings, blocked exits, resources/work, role capacity and same-tick support relief. The final browser departure route exposed a narrow corner missed by sampled line checks; exact swept traversal and movement/departure regressions now keep planned routes consistent with physical collision.
- Browser: `node scripts/hearth-morale-browser.mjs` passed hidden discovery, queued contested activation, an actual activation visit and victory, natural core defeat, frozen actions and same-area restart; temporary support recovery, late wages restored before exit, grouped dismiss/reopen/escalation, blocked exits and all-four physical departures with correct Miner prices/resources. Ordinary browser smoke also passed. Screenshots inspected at 1440×900 and 1440×768; objective, warnings and terminal/restart controls remain in the sidebar, with no floating world text/bars.
- Reviewed changes and `git diff --check`; companion rules, rooms, characters, levels, interface, README and development tooling updated. Generated builds, dependencies and ignored browser screenshots are not committed. Known timing/balance and crowded payroll path-query limits remain in the active plan for later integration.

## M16 — completed 2026-09-07

### M16 — Bridges and hazardous terrain

Dependencies: existing construction/navigation services for terrain and bridge development. Uses completed M10/M13 foundations; M11 objective/access state is needed for the final Hearthstone crossing scenario.

- Add map-defined water, lava and chasms on the single terrain layer, with clear occupancy and traversal rules. Start with impassable hazards requiring a valid crossing; any damage behavior must be explicit in definitions.
- Implement Bridge construction, pricing, worker/access requirements and reclaim/removal policy. Define which hazard types a bridge can span, shore connection/support constraints and allowed rooms/fixtures on bridge tiles; do not assume every gap is bridgeable.
- Share crossing rules between dwarfs, enemies, pathfinding, discovery and objective access. Free room construction must have a documented, verified application to bridges; cosmetic decoration cannot create routes.
- Author a scenario with the onward Hearthstone behind a hazardous gap, including a lava approach, and enough accessible resources to build a valid route.

Complete when an initially unreachable onward Hearthstone becomes physically accessible through legitimate bridge construction. Verify water/lava/chasm rules, invalid placements, interrupted work, narrow/bent crossings, occupied bridge removal policy, enemy use and path updates. Camera visibility across a gap never completes the objective.


Implemented and verified: map-defined water/lava/chasm terrain, open sight and projectile rules, stone bridge plans, Miner construction with retained work, shared gold/free construction, support and removal rules, shared dwarf/enemy navigation and the normal-economy Emberwater Crossing scenario. Reviewed the approved bridge concept; decks use tile-aligned joints and edges, no gameplay furniture or service capacity. Rooms/walls/fixtures stay on land; chasms remain unbridgeable. M16 was authorized by the user in this task.

Verification: full simulation suite passed 148 tests; after final focused additions, 27 bridge/defense/world checks passed, including seven bridge tests. Typecheck and production build passed. The browser playthrough used actual construction-tool canvas clicks, normal starting crew/gold, food/rest rooms, discovery, both paid crossings, and the sidebar activation action to reach victory. Checked snapshots in test-results/m16-lava-plans.png and m16-complete.png; corrected construction-tool overflow during visual review. No debug stock, free construction, extra residents or shortened work timers were used in the crossing playthrough. Existing prototype bundle-size warning remains.

Provisional rules and limits: 20 gold/eight Miner-work seconds per square; water and lava support arbitrary shore-connected deck layouts, while chasms are not bridgeable. Plans refund full paid cost, decks use the standard reclaim fraction, and free squares refund zero. Removal preserves occupants, reachable land and remaining support. No swimming, contact damage, bridge damage/collapse/repair or bridge-mounted fixtures. Default Border Foothold and campaign travel remain unchanged; M18 owns campaign integration.

## 2026-09-07 — Full map control

Added M and an expand icon beside the minimap to open the entire level in a larger map with preserved aspect ratio and shared minimap colors/discovery. Removed the camera footprint and center marker. M, Escape, the close button and click-to-center dismiss the map; camera input is suspended while it is open, and simulation keeps its existing pause state. Help and interface documentation updated.

Verification: TypeScript check and production build passed (existing large-bundle warning). Browser checks passed in Edge for keyboard toggle/repeat handling, icon, Escape, close button, click dismissal, fog pixels, aspect ratio and 1440×900 / 800×600 sizing, with no runtime errors. Inspected the rendered full map. Focused world and selection simulation checks passed.

## 2026-09-07 — Icon-based dwarf activity panel

- Replaced the expanded population report with a role-by-activity icon matrix (Idle, Working, Needs, Combat), live counts, muted zeros, hover/accessibility labels and count/role filters. Individual residents expand to show existing statistics and a camera Locate action. Stable resident elements preserve expanded state during updates.
- Grouped recruitment, payroll, wellbeing and attraction information under an expandable section. Updated the existing browser scripts for the new disclosure/filter controls.
- Verification: `npm run verify -- characters` (35 checks and source/test typecheck), `npm run build`, `node scripts/dwarfs-browser.mjs` (counts, live need transitions, filters, stable details, locate, management disclosure and narrow layout), and `git diff --check`. Browser screenshots are in ignored `test-results/`. No gameplay rules changed.

## 2026-09-07 — Summon Miner spell

- Moved normal Miner recruitment from the Dwarfs text controls to the innate Summon Miner spell icon, with the standard Cast control and live price. No Library, research, preparation or world target is required. Retained actual Hearth arrival, shared support/access checks and existing configurable 50 + 25 × living Miners pricing. Removed the old recruitment button and explanatory recruitment section from Dwarfs.
- Verified two new casting checks plus 20 economy/spell regression checks, source/test typecheck, the production build and `node scripts/summon-miner-browser.mjs`. Browser checks covered consecutive exact-price casts, immediate price updates, no old recruitment controls, switching to researched spells and blocked support. `git diff --check` passed. Existing recruitment and morale browser scripts now inspect the spell control.

## 2026-09-07 — Direct spell icon activation

- Spell icons now activate directly: Summon Miner immediately summons one resident, while prepared targeted spells start world targeting. Removed all separate Cast buttons. Icons use native disabled state and muted grayscale artwork when unprepared, unaffordable, blocked by arrival/support, already active (rally/barrier), or the area has ended. Cost and reason remain in tooltips; hover/focus inspects details without activation.
- Added a Library research selector so unavailable spells retain accessible Research/Resume and Pause controls. Existing sidebar browser checks use the icon for activation and its tooltip for the price.
- Verification: source/test typecheck, production build, 12 summon/spell simulation checks, `node scripts/summon-miner-browser.mjs` (direct repeated summons, rising exact costs, no Cast buttons, disabled support/unresearched states, research access, ready targeting, cancellation and consumed-charge disabling), browser visual review, and `git diff --check`.

## 2026-09-07 — Defense availability and compact Rooms tools

- Defense icons now use disabled/grayscale states until a built Workshop and finished stock are present. Enabled icons start placement directly, and the player confirmation path rechecks availability if the Workshop or stock changes. Hover titles explain requirements.
- Removed the separate construction toolbar and its excavation/erase buttons; the default excavation/cancel gestures remain. Rooms has a stable final four-cell row containing Bridge, Wall, an empty cell and Sell in the lower-right corner. The test room panel shares the same tool row. Sell routes rooms, bridges/plans and fixtures through their existing refunds and removal protections, including no duplicate refunds and occupied/isolating bridge rejection.
- Added the sparse-text in-game sidebar rule to AGENTS.md and the interface design. Updated run/design documentation.
- Verification: source/test typecheck, production build, two focused selling/availability checks, ten bridge/reclaim regression checks, and `node scripts/defense-tools-browser.mjs`. Browser checks used actual canvas placement/selling, verified Workshop removal/restoration and depleted-stock disabling, confirmed no excavation/removal toolbar and checked the fixed Sell grid cell. Reviewed screenshots and `git diff --check`; generated files remain ignored.

## 2026-09-07 — Shared payday and level wages

- Replaced personal arrival-based payday timers with one area clock, every 120 game seconds. New arrivals join the next payday at their full current wage, without back pay. Physical treasury visits and debt retention remain in force.
- Added editable wages to each character level row: Miners 4/5/6/7/8, Engineers 7/9/11/13/15, Warriors 8/10/12/14/16 and Runesmiths 10/12/14/16/18 gold. Sidebar wages reflect the reached level; accrued payments retain the value earned on payday.
- Verified 42 focused economy, character-level, settings, morale and Hearth simulation checks; final economy rerun passed all 13 tests. Source/test typecheck and production build passed (build used RAYON_NUM_THREADS=2 after a local system-resource failure; existing large-bundle warning remains). M13 browser checks passed shared payment for a newly purchased Miner, physical collection, exact gold accounting and blocked/restored access.
- Character browser playtest passed all four types through levels 1–5 with the displayed wage checked at each level, live configuration/injury behavior and real melee XP. Updated the browser checks to select roles in the current dwarf activity sidebar.


## M17, M18 and M20–M22 — completed 2026-09-08

The user authorized these five milestones together. Their implementation was coordinated across enemy, interface, environment and campaign/character work. M19 remains planned; M12 and M15 remain removed from the active roadmap.

| Milestone | Outcome | Status |
|---|---|---|
| M17 | All ten concept enemies and distinct combat behaviors | Complete |
| M18 | Authored campaign, Hearthstone travel and unlock progression | Complete |
| M20 | Overall player interface and left control panel cleanup | Complete |
| M21 | Terrain and environment graphics update | Complete |
| M22 | Character models and animation update | Complete |

### M17 — Complete enemy roster and behavior

Dependencies: completed M10–M11 for encounter/core integration and M16 for enemies associated with hazardous terrain. Guarding and retreat are not required. This expanded scope is implemented and verified.

Implement all ten enemies in the [current concept gallery](../concept-art/enemies/README.md), retaining and extending the existing Goblin Raider:

| Region | Required enemies |
|---|---|
| Upper workings | Goblin Raider, Tunnel Burrower |
| Fungal caves | Cave Spider, Spore Brute |
| Ancient halls | Restless Guard, Ancient Sentinel |
| Crystal caverns | Crystal Elemental, Crystalback Stalker |
| Volcanic depths | Cinderling, Deepmaw |

- Define and implement a distinct combat role for every enemy, using editable stable definitions for stats, size, senses, movement, attacks, targeting and capabilities. Inclusion of all ten is decided; exact abilities, scale and balance remain design choices to document in levels.md before implementation.
- Cover melee, ranged and tunneling/breaching threats across the roster, with meaningful differences in how enemies pressure defensive layouts. Define attack obstruction, friendly-fire policy, door breaking and reinforced-wall resistance; no creature can tunnel through bedrock.
- Implement terrain interactions required by each enemy's defined behavior, including traversal restrictions, tunneling and any explicit hazard resistance. Exercise them in representative regional encounter scenarios. Artwork alone does not grant a creature new abilities or terrain immunity. Full regional campaign layouts belong to M18 and environment visual improvements to M21; unrelated regional terrain mechanics are not implied by this milestone.
- Give every enemy a recognizable initial model and movement/attack/defeat animations guided by its concept. M22 improves all ten models and animations further; M17 must already make their identities and actions readable in play.
- Integrate all ten with ordinary authored camps/nests and raid systems as appropriate to their roles, plus shared debug scenario entries. Every type must be encountered through a normal encounter source in a playable scenario, not only through debug spawning. Campaign distribution follows in M18.
- Specify and implement each type's interactions with dwarfs, the Hearth, doors, barriers, traps and spells, including control effects and any special resistances. Keep health, warnings and details in the sidebar and preserve discovery rules.

Complete when all ten enemies are implemented and exercised in playable encounter scenarios, with distinct behaviors that reward different layouts. Verify each type's movement, attacks, targeting, defeat, terrain access, trap/spell/control interactions and encounter lifecycle; cover ranged line of sight, friendly-fire policy, tunneling, reinforced-wall resistance, bedrock exclusion and mixed-enemy encounters. Record per-enemy verification and any remaining balance or visual limitations. A smaller selected subset does not complete M17.

### M18 — Campaign and Hearthstone travel

Dependencies: M11, M16 and M17; integrate completed recruitment, wages and morale systems into playable level populations/economies. Coordinate travel and endpoint controls with M20.

- Add campaign and level definitions linking each onward Hearthstone to the next area. Author at least two complete connected levels with different approaches: an enemy-held site and a hazardous crossing. The five candidate concepts are inspiration, not a locked level count/order.
- Let the player proceed through a ready onward Hearthstone using a clear sidebar action. Start the next area at its own established base Hearth with a fresh mining crew and local economy; leave the previous army, buildings and stockpiles behind.
- Carry campaign research/building unlocks in session memory. Distinguish research knowledge from local work queues, prepared spell charges and resident levels; specify reset/carry rules and retain uses for unlocked rooms/types. Add no disk/browser saves or persistence infrastructure.
- Tie briefings and discoveries to restoring routes through the lost kingdom's runic network. Each level's required objective is its onward Hearthstone; optional camps, relics or district goals support that journey.
- Define the endpoint of the authored campaign: its final discovered Hearthstone resolves the current journey or marks the end of available areas, without a broken next-level link. The ultimate story ending remains an authoring choice.

Complete when a browser playthrough reaches one onward Hearthstone, chooses to proceed, starts and completes the next authored area, and receives a valid endpoint. Verify unlock carryover, fresh residents/resources/needs, local spell-state rules, no cross-level jobs/enemies/events, defeat/restart and no automatic transition on discovery alone.

### M20 — Overall player interface and left control panel

Dependencies: existing gameplay/UI systems; integrate M18 campaign actions when available. Reference [Gameplay interface](previous-docs/gameplay-interface.md) and its supplied layout/message references.

- Review the whole player interface, from finding actions and understanding resources/objectives to world selection, placement, targeting, inspection, messages, maps and restart/travel flows.
- Tidy the left control panel with consistent grouping, spacing, icon sizes, selected/disabled states and expandable details. Remove redundant text and controls; keep frequent actions directly accessible and costs or short status visible where useful.
- Make tooltips, keyboard focus, cancellation and feedback consistent across Rooms, Defenses, Spells and Dwarfs. Preserve the persistent left sidebar, autonomous residents and clear world view without floating text, health bars or progress bars.
- Check usable panel sizing and scrolling at supported browser sizes, keeping essential navigation and actions reachable. Keep development controls separate from ordinary player flows.

Complete when browser playtests cover building/selling, defense production/placement, research/casting, resident inspection, warnings, maps and campaign result/travel actions through a coherent interface. Verify keyboard focus, disabled-state explanations, cancellation, no input leaking into the world and no clipped or inaccessible essential controls. Update gameplay-interface.md to describe the result.

### M21 — Terrain and environment graphics update

Dependencies: existing world rendering and completed M16 bridges; coordinate world previews with M20. Review the approved [terrain reference](../concept-art/terrain/README.md), [room/structure concepts](../concept-art/rooms/README.md), [regional concepts](../concept-art/levels/README.md), their prompt records and [graphics pass notes](graphics-pass.md).

- Improve terrain forms, materials and transitions for earth, rock, bedrock, embedded gold, gem columns, claimed floors, water, lava and chasms using the concepts as visual references.
- Bring room floors, walls, cosmetic furnishings, doors/traps, bridges and Hearthstones into a consistent environment style. Improve model silhouettes, material definition, lighting and restrained environmental/fixture animation.
- Preserve one terrain layer, readable square excavation cells, clear resource/hazard distinctions and fog of war. Decorative detail must not change navigation, room capacity, sight or gameplay geometry.
- Check the result at ordinary play zoom, close inspection and multiple rotations, including narrow/irregular rooms and hazardous crossings. Keep reusable assets/materials and practical browser performance.

Complete when representative gameplay areas and the visual showcase demonstrate a coherent improvement against the references, with before/after captures. Verify terrain and placement readability, fog, irregular rooms, bridge/door/trap states, reduced-motion behavior and browser performance. Record remaining visual limitations in graphics-pass.md.

### M22 — Character models and animations update

Dependencies: current four dwarf roles and combat/jobs; final enemy coverage includes all ten enemies in M17. Review the [dwarf concepts](../concept-art/dwarfs/README.md), [enemy concepts](../concept-art/enemies/README.md), their prompt records, [Characters](previous-docs/characters.md) and [graphics pass notes](graphics-pass.md).

- Improve all four dwarf roles and all ten enemy models: proportions, silhouettes, faces/hair, clothing, armor, tools and materials. Preserve the established female Engineer and distinct Miner, Warrior and Runesmith appearances.
- Improve walking, turning, idle, mining/construction, hauling, crafting, training, research, eating/resting, attacks, hit reactions and defeat where those activities exist. Cover M17 ranged/breaching actions without introducing new gameplay abilities.
- Make poses, timing and transitions follow real movement, jobs and combat events, with less sliding, clipping and abrupt switching. Use shared reusable animation/model helpers without requiring an elaborate asset pipeline.
- Keep roles and actions readable from the overhead gameplay camera, coordinate character scale/lighting with M21, and preserve sidebar-only statistics and practical performance at normal populations.

Complete when all four dwarf roles and the shipped enemy roster have improved, recognizable models and their implemented activities animate coherently in browser scenarios and normal play. Capture before/after comparisons; verify equipment alignment, movement/attack timing, state transitions, reduced-motion behavior and crowded-scene performance. Record limitations in graphics-pass.md.


### Completion and verification — 2026-09-08

- **M17:** implemented all ten stable enemy definitions and editable ability tuning. Every species has a distinct role, natural source lifecycle, movement, attacks, targeting, defeat, trap/spell/control interactions and concept-guided model. Focused checks cover ranged obstruction and no friendly fire, armor, webs/spores, charge/cleave, structure damage, physical digging, reinforcement resistance, bedrock/resource exclusion and Cinderling lava traversal. A regression verifies species-aware Hearth approaches when an isolated floor approach competes with a reachable lava route. Five ordinary regional maps use three Miners, 400 starting gold, recruitment and concealed physical camps; the separate gallery supplies test defenders. The connected campaign also contains all ten species through required and optional encounters.
- **M18:** authored two connected areas with briefings, discoveries, bridge knowledge unlocked at the first gate, explicit travel and a valid final endpoint. Completed research knowledge carries in memory; local spell preparation/queues, crew/levels/needs/wages, economy, buildings, jobs, enemies and events reset. Retry restores entry knowledge. Optional fungal/ancient branches in Border Foothold and crystal/volcanic branches in Emberwater stay hidden behind excavatable gates. Tests verify their concealment, ordinary excavation, warned sources and continuous water/lava channels.
- **M20:** consistent compact icon actions, focusable unavailable explanations, cancellation and world-input isolation; grouped warnings/history and a real Hearth-attack alert; inspection in the scrolling panel and bounded result controls. Browser checks covered actual build/sell, production/placement, research/cast, resident/enemy inspection, warnings/history, maps/fog, keyboard focus and 1440/1024/800 desktop sizing. Real defeat, post-outcome inspection/restart and both campaign victory controls were verified at 800×600.
- **M21:** improved terrain relief/materials, connected gold veins/quartz, room floors and all six room furnishings, Hearths, doors/traps, bridges and hazards. Browser checks covered paid/free irregular layouts, retained earth/bedrock, reinforcement, precise fog picking, bridge plans/decks, doors/damage, trap trigger/reset and live reduced motion. Inspected ordinary/close/rotated before/after captures. Final review corrected merged chest alignment, bevel winding, lava emission masking and bridge substrate/paver z-fighting.
- **M22:** improved all four dwarf silhouettes, clothing/armor/equipment, facial/hair detail and shared materials, plus all ten enemy rigs. Dwarf walking follows displacement; turns/job poses ease; attacks, recoil and defeat follow actual events. Browser captures verify front/back equipment, mining, reinforcement, claiming, wall construction, crafting, training, research, meals/rest, a normal-economy moving gold load, paused poses, real enemy-caused resident defeat/disposal and reduced motion. Enemy checks cover all ten models, anatomy, actual tunneling strokes, combat and reduced motion. Four dwarf before/after comparisons are retained; the nine new enemy models were compared with their concept sheets, and no historical Raider screenshot was captured.

The complete campaign browser route used ordinary starting crews/resources, room costs, recruitment, mining, research and bridge work, without free construction, supplied stocks, spawned defenders or shortened timings. Border Foothold completed at **374.35 simulation seconds**, with five residents and Call to Arms/Dwarf Haste researched. Travel produced three fresh Miners and paused, unprepared knowledge. Emberwater completed at **308.4 seconds**, with six residents and four completed bridge squares. Discovery alone did not finish either area; physical activation, explicit travel, the final endpoint and second-area retry all passed with no browser errors. This verifies one normal route; M19 still owns broader economy/combat balance, alternate approaches and recovery testing.

Validation: **180** simulation checks and source/test typecheck passed through the final all-scope verification. The development browser smoke check, production build and production isolation check passed. Milestone browser scripts are in scripts/interface-browser.mjs, enemies-browser.mjs, environment-browser.mjs, campaign-browser.mjs and character-visuals-browser.mjs. The hauling-only follow-up and focused environment capture continuations preserve earlier passed evidence. git diff --check passed; generated captures, reports and builds remain ignored.

Paused rendering samples after warm-up at 1440×1000 on Intel Iris Plus/ANGLE D3D11 measured **45.5 FPS** in the ordinary stronghold and **24.0 FPS** in the full six-room/six-resident showcase. A ten-enemy plus six-dwarf gallery measured roughly **20–30 FPS** across headless runs. These are machine-specific samples, not universal targets. The showcase is heavier on integrated graphics; broader balance/performance work remains in M19. Repeating procedural textures, simple rigs, limited facial/hand motion and imperfect bed/seat contact remain documented prototype-art limits. No saves, accounts, multiplayer or release infrastructure were added.


## Gold readability and map resource visibility — 2026-09-08

- Replaced the thin M21 gold lines with broader shallow faceted fragments on terrain tops and exposed faces, using the approved terrain sheet and pre-M21 captures as references. Shared material and merged decorative meshes preserve terrain picking and gameplay geometry.
- Both the minimap and full map now show all gold seams and gem deposits through fog. This reveals resource locations without discovering surrounding terrain, caves, enemies or the onward Hearthstone, and without changing mining access. Exhausted gold is removed from the resource display.
- Verified nine focused mining/discovery simulation checks and the production build. The resource browser check sampled every unexplored tile on both map canvases, checked navigation without discovery or enemy activation, checked depleted-gold redraw and captured normal/close/reverse gold views. All checks passed with no browser errors; captures and report are in ignored test-results/resources/.

## 2026-09-08 — Miners no longer train or level up

Removed Miner levels 2–5 from the editable definition. Shared progression now excludes Miners from training and XP automatically; their base stats and 4-gold wages stay fixed. Updated the sidebar, room description, design documents and progression fixtures.

Verification: all 36 character-scope simulation checks passed, including real self-defense without Miner XP and available training ignored by Miners. Headless Edge playtest used a normally built Training Room with two Miners and an Engineer: Miners stayed at level 1 with zero XP, the Engineer reached level 2, and the Miner sidebar displayed no training or leveling. No browser runtime errors. Source/test typecheck and diff whitespace checks passed.

## 2026-09-08 — Shared Miner work pool and resource coverage

Miners now share a transient pool of terrain jobs, with one reservation per task. Resource work targets about one worker per three available Miners (editable), minimum one for discovered, marked, reachable gold/gems. Other workers fill unstaffed hauling, excavation, bridge/wall construction and claiming work, then divide across those kinds. Reinforcement remains spare-time work. A half-second vacancy check can redirect ordinary work when resource coverage is lost; needs, cargo/hauling, combat, departure and Hearth work remain protected. A lone available gem miner banks full loads instead of extracting indefinitely.

Added the shared miner-work test yard and scripts/miners-browser.mjs. Six focused allocation checks cover distribution and unique targets, mixed-work progress, replacement after delivery/needs/combat/departure, new marks/cancellation, hidden/unreachable deposits and lone-miner gem deliveries. The full 187-test regression run passed 186 checks and exposed one stale wage expectation from the prior Miner-level removal; updating that expectation and rerunning all 29 economy-scope checks passed. Source/test typecheck and production build passed (existing large-chunk advisory only). Headless Edge playtest kept resource mining assigned in 78/80 half-second samples over 40 seconds, with concurrent excavation, construction and stored income, unique mining targets and no runtime/console errors. Reviewed the test screenshot and diff whitespace. Coverage measures assignment including travel; brief gaps remain during movement and protected interruptions.

## 2026-09-08 — Stable Miner assignments

Replaced half-second resource reassignment with retained work assignments. Each Miner keeps its work kind for 20 productive seconds (editable); travel and resource delivery do not consume that budget. Repeated gem batches and gold deliveries prefer the same deposit. Miners finish their current task before rebalancing, can change early when no valid reachable work remains, and still respond to needs, wages, combat, departure and Hearth requests. Routine batch/delivery gaps retain resource staffing, so they cannot pull another miner from unfinished work. New resource requests can wait for existing work to finish.

Reproduction and verification: the same three-Miner, 60-second mixed-work yard went from 25 role changes and six interrupted tasks to six role changes and zero interrupted tasks; all eight excavation tiles and both planned walls completed (previously one wall). Nine focused checks cover assignment continuity, productive-time accounting, return after gold delivery, gem-worker identity, no abandoned tasks, resource allocation, interruptions and invalid targets. Headless Edge confirmed zero interrupted tasks, six role changes, unique targets, resource assignments across 120/120 half-second samples, completed excavation/walls and stored income without browser errors. Assignment coverage includes delivery, rather than claiming continuous active extraction. The full 190-test run passed 189 checks; changed gate-opening timing let traps clear the first camp while Warriors ate, so the encounter test now checks melee XP after its existing later-raid interval. All 38 encounter-scope regressions then passed. Typecheck, production build and diff whitespace checks passed (existing bundle-size advisory only).

## 2026-09-08 — Stonehands replace the normal labor crew

- Accepted the smaller mechanical Stonehands v2 concept and implemented a separate exposed-frame, single-lamp model with a rune tablet, small stone palms, thin linkages and a basket. Retained the original dwarf Miner definition, model and legacy debug fixtures; future basic fighter repurposing remains deferred.
- Normal campaign areas and crossings start with three Stonehands. Create Stonehand costs a fixed, editable 25 gold at the Hearth and validates funds and free reachable arrival space without food or bed checks. Stonehands have 30 health, cannot fight, occupy no support slots, and have no food/rest, payroll, morale, training or XP obligations. Destruction releases work and drops cargo through the ordinary simulation.
- Shared terrain pool and 20 productive-second commitments remain intact, including gold/gem coverage across delivery trips. Workforce UI separates construct details from dwarf needs and progression. Specialist arrival capacity ignores constructs; legacy dwarf payroll and support behavior remain intact.
- Verification: all 195 simulation tests pass; source/test typecheck and production build pass. Stonehand work browser: resource assignment in 120/120 samples, six role changes in 60 seconds, zero interrupted excavation/wall jobs, all eight excavation tiles and both walls complete, distinct mining targets and stored income. Creation UI checks fixed charges and support-free creation. M13 browser confirms four physical dwarf wage visits, exactly-once payments, restored treasury access and reset. Character visual browser verifies real work/carry/needs poses, construction animation, enemy-caused defeat/model disposal and reduced motion; Stonehand close-up check confirms a substantially smaller silhouette and correct construct details. All completed browser checks report no runtime errors. Existing large-bundle advisory remains unchanged.

## 2026-09-08 — Cave Hounds and recruitment composition

- Preserved both animal concept sheets and implemented only Cave Hounds. Their separate quadruped model follows the saved charcoal/sandy hound, collar, rune tag and lamp direction, with walking, sniffing, feeding, sleeping, bite, tail and hit/death animation. The original Miner remains retained; Tunnel Badgers remain concept-only.
- Dormitory-only automatic arrival on the existing 45-second cadence. One assigned den supplies both food and rest, with no Kitchen allocation, wages, training or XP. Lost den access uses existing support/departure rules. Hounds have 100 health, 10 damage/second and 2.7 tiles/second movement; Warriors remain stronger and trainable.
- Animal quota is shared across species: one per four reachable Dormitory places, minimum one with a bed, maximum two. The second needs eight places. The first companion receives early arrival priority once per area; deaths and arrival toggles cannot reset it. Eligible specialists then take precedence over further animals. Weighted specialist selection targets Warrior/Engineer/Runesmith proportions of 2/1/1 while respecting support and role-room capacity. Capacity shrinkage stops recruitment without deleting residents.
- Scouts use known walkable frontiers and normal line of sight, with +2 sight, an 18-tile Hearth range and 20-second outings followed by 15 seconds of home watch measured from arrival. They do not excavate, claim, cross unbridged hazards or activate Hearthstones. Combat, rally and den visits take priority. The broad M19 campaign-balance pass remains unfinished.
- Verification: all 202 simulation tests passed, including companion loss/replacement priority and arrival-toggle regression coverage after the home-watch timing adjustment. Tests cover paid/free single, narrow and irregular Dormitories; cosmetic-furniture independence; shared future-species limits, losses and replacement; specialist composition; den eating/rest, no wages/XP; scouting through a bend, blocked rock and home return; and a real two-hound Raider fight. Source/test typecheck and production build pass. Browser checks pass for normal-price Dormitory arrival and expansion (one then two hounds), scouting/home watch, no wages/training, quota feedback and the four-legged model; close-up rendering inspected and adjusted. No browser runtime errors. Existing bundle-size advisory remains.

## 2026-09-08 — Recruitment follows settlement progress

Implemented the user's replacement for the Cave Hound animal cap and fixed support-role mix. Dormitory-only settlements receive repeated hounds while accommodation remains free. Arrival definitions now hold independent cooldowns (Hound 30s, Warrior 45s, Engineer/Runesmith 60s), with a tunable 10s minimum gap. Supported defenders fill soft population shares (Warrior/Hound 3/1); Workshops and Libraries request initial staff and additional staff at one per three unfinished orders, subject to real room, bed and Kitchen capacity. Finished crafting and paused/ready research do not add staffing demand. Preferred recruits keep the next place while their timer matures; existing residents are never removed to reach a target. Future definitions opt into the same scheduler.

Filling reachable accommodation triggers a non-modal **Dormitory is full** sidebar card, explaining expansion and newly unlocked arrivals, with a **Build Dormitory** action. Dismissal retains a compact icon without repeating the episode. Space opening clears the warning; filling again opens a fresh episode. The message history retains reports. Workforce details show the preferred arrival, countdown, per-type cooldown and support requirements. The compact Dormitory message icon was checked visually and sized to its dock.

Verification: all **203 simulation tests passed**; typecheck, production build and `git diff --check` passed. Focused tests cover regular early arrivals, per-type/gap timing, paid/free single/strip/irregular Dormitories, replacement after loss, warning episodes, initial and queued staffing, paused research, newly supported Warrior priority, full beds, toggles, access and retained hound behavior. The Edge browser playtest verified four then eight hounds through ordinary paid Dormitory expansion; warning opening/dismissal/build action/clearing/reopening/history; scouting/home watch, no hound wages/training, sidebar and quadruped rendering. It then added paid Kitchen/Training capacity while full, confirmed arrivals remained blocked, expanded by three beds, and verified three Warriors arrived while all eight hounds stayed. No browser runtime errors. Screenshots and logs are ignored under `test-results/`.

These values remain provisional. Exhausted Warrior room/food capacity can leave hounds as the eligible defender until facilities expand; full accommodation always requires player action. Tunnel Badgers remain concept-only, and this targeted update does not complete M19's broader campaign balance pass.

## 2026-09-08 — Restore population pricing for Stonehands

- Replaced flat creation cost with the original Miner rule: 50 gold base + 25 per living Stonehand, counting the starting crew and excluding destroyed workers and other unit types. The next purchases with three workers cost 125, 150 and 175 gold; failed purchases remain free.
- Reused the existing configurable minerMinimumCost and minerCostStep setting IDs, with Stonehand labels in Debug → Game configuration → Economy & world. Removed the obsolete flat stonehandCost setting. The sidebar quote and charged amount use the same live calculation.
- Verification: 23 focused Stonehand, economy, legacy summon and configuration tests pass; source/test typecheck and production build pass. Browser verifies sequential 50/75-gold purchases, the 125-gold starting-crew quote, live UI changes to an 80 base / 40 step producing a 200-gold charge, and an unaffordable 240-gold next purchase. No browser runtime errors; git diff --check passes. The existing build-size advisory remains.

## 2026-09-08 — Focus verification on the current change

- Updated project instructions and the development workflow: documentation-only changes need no executable checks; small logic/balance edits use focused simulations and one typecheck; UI/rendering edits add the relevant browser check; full suites, builds and integration sweeps remain explicit milestone/major-change checks.
- npm test now shares the focused verification default; test:all retains the full simulation command. Clean trees do nothing. Unknown or widely shared dependencies report candidates and require an explicit developer-selected scope instead of silently running everything. Browser checks are independently named; production verification reuses the single typecheck.
- Consolidated four workforce browser scripts into one with independent overview, pricing, stats and models modes (19 browser scripts reduced to 16). Removed obsolete four-type/all-five-level assumptions and unrelated spell checks from pricing. Complete progression/combat rules remain covered in simulation tests. Startup smoke now checks startup/controls/one tick; deeper diagnostics, construction and room rules stay with their owning tests.
- Verified four runner-selection regressions and one source/test typecheck, all four consolidated browser modes and the shortened startup smoke. CLI previews confirm targeted pricing/browser selection and explicit full/integration/production selection without running them. No browser errors; git diff --check passes. No game behavior or production build changes were needed.

## 2026-09-08 — Guard dog patrols and mining-worker escape

Implemented the user's request for active security dogs and fleeing mining workers. Cave Hounds now patrol continuously between needs and combat, share surveyed ground, prioritise unsurveyed frontiers/new openings and revisit older areas. Removed the fixed Hearth range, timed outings and stationary home-watch phase. Patrol destinations refresh when another survey makes them redundant. Shared sightings and attacks on residents, doors or the Hearth call dogs into response. Live visible enemies receive physical pursuit/melee; lost sightings keep only the reported position for a tunable 20 seconds. Hidden enemies produce no sightings, and walls/doors/hazards still control routes and attacks. Call to Arms and critical den needs retain their existing priority rules.

Stonehands and retained dwarf Miners release work and pool assignments when enemies approach or damage arrives, retain cargo, run toward nearby reachable safer ground and pause before resuming. Ranged damage considers visible threats beyond the proximity trigger. Escape paths avoid closing on enemies; workers reject job routes through known danger and cannot teleport when trapped. Emergency running uses a tunable multiplier; patrol/response/fleeing activities appear in Workforce, with escape grouped under Needs. Guard Posts and general specialist retreat remain deferred.

Verification: source/test typecheck passed. Focused hound, mining-pool, movement, defense and spell regressions passed; the final security suite passed all 10 checks covering continuous pack movement, actual new excavation beyond the former range, shared sightings around walls, fog memory, damage/Hearth response, both mining-worker types, cargo retention, safe work resumption, ranged escape and blocked exits. The Edge browser playtest recorded both dogs moving in all 12 sampled patrol intervals, response to a real Goblin Raider, the worker fleeing and surviving, the attacker defeated, five newly excavated corridor tiles, and a surviving hound entering that extension after den needs. No browser runtime errors. `git diff --check` and local Markdown links passed; screenshots/logs remain ignored in `test-results/`. This targeted behaviour change does not complete M19's broader campaign balance pass.

## 2026-09-08 — Notification rail and shared report lifecycle

Implemented the user-requested Dungeon Keeper-style notification overhaul. Sliding icon tabs sit beside the left sidebar, with one anchored details card, explicit source navigation, icon/card dismissal, keyboard controls, reduced motion, bounded per-area history and scroll overflow. Reports never automatically open cards or move the camera. Actual combat, Hearth damage, encounter phases, grouped resident needs, full accommodation and first natural recruitment of each type feed the same UI. Dismissal survives ongoing episodes; recovery/escalation re-arms conditions. Unit sources resolve live and unknown origins remain hidden.

Replaced the hard-coded Hearth/Dormitory/encounter/morale card assembly with shared notification inputs and condition collectors. New conditions are content definitions; one-time gameplay events use `notify`. Documented the extension contract in the content playbook and updated the interface, recruitment, README and current status references. Returning from test worlds preserves each world's report state; area completion resolves the active rail.

Verified: `npm run verify -- notifications` passed source/test typecheck and 20 focused notification, recruitment and morale tests. `node scripts/notifications-browser.mjs` passed real first arrivals, recurring full-Dormitory warnings, dismissal/history/build actions, combat and Hearth attack/defeat, safe source navigation, hidden origins, a content-only extension, overflow, 1440×900 / 1024×768 / 800×600 layouts, keyboard/wheel isolation, cancelled world drags over cards, reduced motion and world reset with no browser errors. Inspected generated captures in ignored `test-results/notifications/`. Updated older interface/hound/morale browser selectors and syntax-checked them; full campaign/production suites were not required for this targeted overhaul. Vite remains available locally. M19 remains planned.

### 2026-09-08 — Compact Border Foothold arrival

Reduced the starting cavern to a walking ring around the Hearth, requiring excavation for room footprints and routes to existing hidden chambers. Updated the briefing and starting-area rules. Verified source/test typecheck, normal Stonehand excavation and room construction, treasury access, concealed encounters, and raids waiting for an opened eastern route. The focused world, settings, Hearth and encounter tests passed; seven of eight campaign tests passed. The optional volcanic-lair excavation timeout also reproduces with the previous starting layout and remains tracked for M19.

### 2026-09-08 — Main-view resource visibility

Gold seams and gem columns now render through unexplored terrain in the main play area, including when panning, rotating and zooming. Resource visibility does not discover tiles or change mining access, and surrounding terrain remains fogged. Updated the visibility references. Verified source/test typecheck and four world/discovery tests with npm run verify -- world. The focused resource-visibility browser check passed resource materials, surrounding fog and unchanged discovery after camera navigation; visually inspected test-results/resources/main-view.png. No browser runtime errors.

## 2026-09-08 — M23 and M34 complete

M23: the work-pool assignment fast path previously reused reinforcement for its whole productive stint, even after new excavation/claiming became reachable. Reinforcement now finishes one tile and then takes the normal full-pool allocation path. Real job reservations release at completion; unsafe/unreachable or already staffed work does not idle spare workers. Resource delivery, explicit construction and immediate retreat remain unchanged. Owning rules: characters.md, Miner work allocation.

M34: reproduced the left-edge failure by restoring canvas-only pointer filtering in the browser. Sidebar overlap discarded the pointer before edge calculation. Mouse movement in the outer left viewport band now reaches camera controls; the internal sidebar boundary does not. Sidebar clicking/scrolling, leave/blur and open dialogs suppress movement as appropriate. Rotated view directions and zoom remain stable. Starting-menu suppression will be integrated when M25 adds that menu.

Verification: `npm run verify -- work --browser=camera` passed source/test typecheck, 37 focused work/resource/movement/security simulations and camera browser checks at 1440×900 and 800×600, with all four directions at two angles, stop-on-move-away, ordinary panel input, leave/blur and full map. `node scripts/work-priorities-browser.mjs` observed the normal three-Stonehand crew already reinforcing, then clearing/claiming a newly marked 4×5 area by 40 game seconds with no free construction or supplied resources. The two renewable gem tiles correctly stayed intact and productive; an initial assertion expecting those to become claimed floor was corrected to match the existing gem rules. Captures are in ignored test-results/m23 and test-results/m34. No campaign playthrough or production build was needed for these focused milestones.

### Archived milestone specifications
### M23 — Stonehand work priorities

- Investigate the reported preference for wall reinforcement while digging and claiming remain available, including work-pool allocation and the existing productive-assignment window.
- Make reachable player-designated excavation and reachable floor claiming take precedence over automatic reinforcement. Reinforcement is background work when higher-priority terrain work is unavailable; unreachable or unsafe marks must not stall all useful work.
- Preserve resource collection, deliveries, explicit construction and threat escape. Define how an existing reinforcement assignment yields without repeated job switching or abandoned reservations in characters.md.

Complete when ordinary crews expand and claim a marked area before spending spare capacity reinforcing it, including newly added dig orders, mixed resource work, blocked routes and work resumption after danger. Verify focused job simulations and one ordinary browser observation.

### M34 — Left-edge camera panning across the sidebar

Early bug fix; independent of campaign expansion.

- Reproduce the reported failure to pan left when the pointer reaches the far-left game viewport edge. Right, top and bottom edges reportedly work; inspect sidebar/input suppression before asserting the cause.
- Allow camera panning at the outer left viewport edge even where the sidebar occupies that edge. This user decision supersedes the previous blanket rule that sidebar-edge pointer movement never pans.
- Keep ordinary sidebar hovering, clicks and scrolling from moving the camera; use the outer viewport edge, not the internal sidebar/world boundary, as the trigger. Preserve view-relative direction after camera rotation.
- Stop edge movement when the pointer leaves the viewport or the window loses focus. Preserve intentional camera suppression for the starting menu, full map and modal dialogs.
- Update the interface rules and add a focused browser regression for the actual viewport edge, including sidebar overlap, all four directions, rotated view and compact layouts.

Complete when reaching the far-left edge pans the view left as reliably as the other edges, moving away stops it, and normal sidebar use remains stable. Run a source/test typecheck and the focused camera/input browser check; no campaign playthrough is required for this isolated fix.

### M24 — Cave Hound and specialist combat balance

- Treat the report that hounds killed most monsters as a balance hypothesis to measure, not a reason for an arbitrary blanket reduction.
- Compare single hounds and realistic packs against regional enemies, factoring in recruitment rate, free den support, population growth and enemy group composition.
- Make the combat test room directly available under **Debug → Test harnesses → Combat test room**. Use the actual shared combat systems and editable roster definitions for repeatable hound, specialist and enemy matchups. Provide matchup selection, reset, Pause/Resume and Return to stronghold; start paused and preserve the retained stronghold and its prior pause state under the existing harness rules. Keep combat stats/results in the sidebar.
- Preserve useful early scouting, patrol and defense while giving Warriors, manufactured defenses and Runesmith spells meaningful advantages against later threats. Tune existing editable stats/recruitment before adding mechanics or imposing a new animal cap.
- Record representative matchups and intended roles in characters.md and enemies.md; repeat campaign-context checks after M27/M29.

Complete when hounds handle suitable early threats but hound-only settlements have clear limitations against representative later encounters, with viable specialist/defense responses under normal resource costs. Browser-check that the combat test room can be opened from Debug → Test harnesses, run and reset with selected matchups, and exited back to the unchanged stronghold with its prior pause state restored.


#### M24 completion — 2026-09-09

Implemented the directly accessible combat harness with selectable defenders, all ten enemies and representative mixed groups, optional traps/prepared spells, sidebar live results and roster/cost details, reset and shared pause/return rules. Measured balance preserves hound stats/cooldowns and raises Deepmaw bite damage to 40. See characters.md and enemies.md for matchup results and limits. Verification: 28 focused combat/hound/enemy/recruitment tests, source/test typecheck and combat browser flow passed (including unchanged stronghold and both prior pause states). Broader campaign-context tuning remains M27/M29/M19.

### M25 — Starting menu and free-play level selection

The user approved the [main-menu and Free Play concepts](../concept-art/menus/README.md) as the menus to use for M25. Match their composition, carved stone/bronze controls, typography, warm lantern light and blue Hearthstone atmosphere; preserve Campaign/Free Play/Settings and the illustrated level-list/preview layout. Build responsive interactive controls and prepare background assets from this approved direction rather than substituting a different menu design. The menus are not yet implemented.

- Launch into a starting menu with Campaign and Free Play. Campaign begins the authored journey; Free Play opens a list of playable levels with a short description and explicit start/back controls.
- Populate the list from stable level metadata so adding a playable level does not require another menu implementation. Keep debug harnesses separate.
- Give each standalone level an explicit starting content/knowledge set and normal economy, sufficient for its intended challenges, independent of campaign progress.
- Define restart, victory, defeat and return-to-menu flows, with confirmation before discarding an active run. Switching modes resets the correct session state; nothing persists across reloads.
- Document entry and navigation rules in gameplay-interface.md and levels.md.

Complete when every listed level starts and restarts correctly, campaign travel still works, and a player can return to the menu and switch modes without leaked units, gold, unlocks or objectives. Check keyboard and compact-window navigation.


#### M25 completion — 2026-09-09

Implemented the approved main menu and Free Play compositions with actual responsive HTML controls and two prepared background assets. Seven deliberately retained normal-economy levels have stable metadata and independent starting plans/knowledge; all start with Stonehands. Added session motion/edge-scrolling settings, confirmation/cancel before discarding active play, standalone restarts, campaign and terminal navigation. Browser checks passed all seven start/restart flows, mode isolation, cancel preservation, keyboard/settings and 800/390px layouts. Production build and production isolation passed. Full simulation run exposed a missing .ts import plus obsolete input-document mocks; focused reruns pass after correcting them. The known optional-chamber fixture now isolates its source so an unrelated sentry cannot kill the teleported worker; all campaign tests pass. These fixture fixes do not certify complete campaign balance.

### M25.1 — Themed startup and level loading screens

Dependencies: M25's approved visual direction and entry/travel flows.

- Replace the reported several-second blank startup with a lightweight loading shell visible as soon as the initial HTML can paint, before the game bundle, Babylon scene and large art assets finish loading. Its initial appearance must not depend on those same expensive assets.
- Match the approved menus with a dark stone palette, bronze framing, a restrained Hearthstone/rune motif and concise Loading text. Enhance with themed artwork once available; keep a usable styled fallback while artwork loads.
- Cover initial application startup, campaign/free-play level entry, campaign travel and area restart when they require loading. Keep the loading screen in place until the destination has a usable rendered frame and ready controls; avoid flashes of a blank canvas or partially built world.
- Show an indeterminate activity indicator or truthful loading stages. Display percentages only if measurable; never add artificial waits to make loading noticeable. Let the browser paint the shell before heavy initialization and keep feedback responsive.
- Suppress world input and unintended simulation while transitioning, prevent duplicate starts, and remove the overlay cleanly after success. Provide a concise visible error and retry/reload action if initialization fails rather than leaving an endless loading screen.
- Respect reduced motion, readable contrast and compact windows. Loading status belongs to the screen overlay, not floating text in the game world. Document the loading flow in gameplay-interface.md.

Complete when cold startup with throttled loading shows the themed shell during the previously blank period, and level entry/travel/restart stay visually covered until ready. Browser-check slow asset loading, failed loading/retry, repeat transitions, compact layout and reduced motion; confirm normal fast loads are not artificially delayed.


#### M25.1 completion — 2026-09-09

Added an inline styled HTML loading shell before a small bootstrap module dynamically imports the game. Art enhances the fallback asynchronously. Startup, entry, travel, restart and harness switches yield a paint before work, block world input/simulation, wait for renderer readiness and rendered frames, and then release controls. No artificial delay or fictional percentages. Failed transitions offer Retry/Reload; failed startup reloads cleanly without duplicate listeners. Browser fault injection passed stalled module/renderer readiness, missing-art fallback, compact reduced-motion rendering, input/clock freeze, failed restart/retry and startup failure/reload. Seven-level menu and combat-return regressions passed; source/test typecheck, production build and production isolation passed.

The campaign browser route was updated for the current excavated starting ring, Stonehands and specialist research schedule. Both normal-cost areas passed with no free construction, supplied stock or spawned defenders: Border Foothold completed at 460.4 seconds with two researched spells; Emberwater completed at 281.85 seconds with four paid bridge tiles. Travel/carry, final endpoint and same-area restart passed, with no browser errors. M19 still owns alternate routes, loss recovery and broader balance.

## 2026-09-09 — M33 test room complete; full M33 remains planned

Added the directly accessible paused lighting test room with ordinary paid/free rooms, automatic furnishings and floor capacity, irregular/narrow footprints, retained bedrock, sample units, real crafting/research queues, completed bridge fixtures and a sealed fog pocket. Adjustable ambient/directional light, bounded local sources, glow and a surface-tracking pointer light are confined to this experiment. The comparison toggle restores the existing renderer; reset and return clean up lights and preserve the retained stronghold and pause state. See graphics-pass.md for source definitions and remaining tile-occlusion/source-selection limits. Biome palettes, representative new levels and ordinary campaign lighting are still M33 work.

Verification: focused lighting/room checks and browser flow passed. Final integration passed all 232 simulation tests, source/test typecheck, the lighting browser flow, production build and production isolation. Browser checks covered actual pointer placement and camera tracking, UI suppression, unchanged fog/discovery, reduced motion, compact controls, comparison/defaults, reset without accumulating lights and exact return-state restoration. Visually reviewed baseline/experimental rooms and lava/water captures; screenshots and reports are in ignored test-results/m33/. Earlier M24 combat, M25 menu, M25.1 fault-injected loading and normal-cost two-area campaign checks are recorded above. The existing large Babylon bundle warning remains; no production splitting or release infrastructure was added.


## Remaining roadmap implementation — 2026-09-09

M26–M29, M31 and M33 are implemented and individually verified. The original accepted scope is retained below; descriptions of dependencies or the earlier test-only lighting refer to the pre-implementation specification. M19/M32 final integration and M30 listening review remain tracked in the current plan.

### M26 — Campaign structure and gradual content unlocks

- Write a campaign brief with a proposed level count/order, regional journey, learning goal, introduced rooms/characters/tools, revisited mechanics and endpoint for each level. The existing two levels are proof-of-concept content, not the required final campaign structure.
- Begin with Stonehands, Cave Hounds and the basic settlement rooms; introduce Warriors, Engineers and Runesmiths gradually across subsequent levels with their supporting rooms, defenses and spells.
- Allow enough development time and suitable challenges after each introduction for the new role to matter. Reuse earlier roles in later levels rather than replacing them.
- Implement declarative per-level availability and campaign unlock transitions using existing content IDs. Apply restrictions consistently to menus, room construction, recruitment, production and research; keep intentional debug access separate.
- Specify carried knowledge, fresh local state and standalone starting unlocks in levels.md, with supporting character/room/spell rules in their owning documents.

Complete when the campaign brief covers a coherent beginning-to-end progression and checks show early levels cannot acquire later roles/tools, travel unlocks the intended content, restarts restore arrival knowledge, and free play starts with its authored availability.

### M27 — Living biomes and recurring enemy pressure

Dependencies: M26's progression brief for threat pacing; extend the existing enemy and encounter systems.

- Define recognizable upper-workings, fungal, ancient, crystal and volcanic habitats using the existing roster. Give authored territories natural caverns, branching tunnels, nests or halls that fit their inhabitants.
- Add autonomous local movement before combat: suitable roaming, patrol, nesting or deliberate sentry behavior by species/group. Idle enemies should appear intentionally dormant or guarding rather than all waiting motionless in rooms.
- Separate habitat activity from attacks on the settlement. Configure which species/groups raid, what activates them, their warning/cadence, group makeup and recovery intervals by level/source; not every creature should launch scheduled attacks.
- Build distinct challenges from existing abilities: organized goblin groups, burrowing flanks, fungal control, armored guardians, crystal ranged pressure and volcanic terrain access. Define readable cues and available counters.
- Preserve physical routes, fog, bedrock and resource protections, blocked-wave handling and source suppression. Pressure must offer respite and a way to secure territory rather than accumulate unseen attackers indefinitely.
- Keep habitat, movement and pressure parameters editable and document behavior in enemies.md and levels.md.

Complete when normal levels show natural movement before contact and several distinct, recurring attacks through real routes, with visible warnings, meaningful counters, source clearing and recovery opportunities. Verify hidden activity does not disclose enemies and blocked routes do not cause teleporting or wave buildup.

### M28 — Discoverable and reclaimable dwarven ruins

Dependencies: M26's availability rules; coordinate inhabitants with M27.

- Author lost dwarven sites with coherent room arrangements, corridors, collapsed approaches and recognizable remnants, concealed by normal discovery.
- Support neutral pre-laid room areas that players can reach, secure, claim and take over through actual gameplay systems. Define claiming costs/time, ownership conversion and when service capacity becomes usable in rooms.md and levels.md.
- Reclaimed facilities use ordinary room capacity, automatic cosmetic furnishings, recruitment and access rules. Define how locked campaign room types are handled so ruins cannot accidentally bypass progression.
- Keep ruin repair chains, door maintenance and new relic currencies outside this milestone. Decorative damage does not imply a new repair system.
- Make reusable ruin definitions available to level authors, including irregular and partially obstructed sites.

Complete when a player discovers an occupied ruin, clears its approach, claims its rooms and uses their normal services. Follow the room checklist for access, irregular layouts, capacity, automatic furnishings and free construction behavior; verify claiming cannot grant inaccessible or locked services.

### M29 — Authored campaign levels and resource-led exploration

Dependencies: M25–M28; use M24's provisional role balance.

- Build the sequence established by M26, expanding or replacing prototype layouts as needed. Set each map's playable space and pacing around actual settlement growth, specialist use and its primary challenge, rather than increasing dimensions alone.
- Place gold seams deliberately to suggest routes, stage expansion and draw players toward discoveries. Provide a viable finite-gold opening and choices between safer income and exposed rewards.
- Make renewable gems rare strategic destinations, not a routine deposit beside every start. Allow gem-free levels; each placed gem needs an authored reason, access challenge and economic consequence.
- Combine themed natural caverns/tunnels, reclaimed ruins, bedrock barriers, alternate routes and biome pressure. Give maps distinct layouts instead of rectangular monster rooms appended to a main corridor.
- Keep resource visibility as currently agreed: gold/gems guide exploration through fog without revealing surrounding terrain, inhabitants or the onward stone.
- Document each level's purpose, availability, resource rationale, threats and intended/alternate routes in levels.md. Keep existing prototype levels in free play only if deliberately retained as playable content.

Complete when the authored campaign has a clear endpoint and each level is playable from normal starting conditions with its permitted roster, introduces or meaningfully reuses a specialist/tool, and has deliberate resource destinations. Check at least an intended route and an alternate approach per level; confirm no mandatory objective depends on unavailable tools or inaccessible income.

### M31 — Environment and room graphics refinement

Dependencies: representative M27–M29 content.

- Audit actual gameplay against approved concept art at ordinary zoom and multiple camera angles; turn the reported clunkiness into an explicit list of visible problems with before/after captures.
- Refine terrain joins, exposed wall faces, material scale, excavation transitions, resource silhouettes, water/lava/bridge edges, room floors and furnishing placement.
- Give biomes and ruins a coherent visual identity through geometry, materials and restrained atmosphere, coordinating lighting with M33, while keeping gameplay tiles, diggable terrain, bedrock and resources easy to distinguish.
- Check single-tile, narrow and irregular rooms, camera occlusion and fog boundaries. Decorations remain cosmetic and the single terrain layer remains unchanged.
- Prioritize the largest visible improvements using editable shared assets/materials; do not require final production art or replace the renderer.

Complete when the recorded environment issues are resolved or explicitly retained as limitations, representative new levels read clearly at play distance, room-checklist visual cases pass, and targeted browser checks show acceptable responsiveness and no discovery leaks.

### M33 — Underground lighting, source glows and pointer illumination

Coordinate with M31's environment materials and M32's character readability; use representative rooms, caverns and ruins from M27–M29.

**Original test-room baseline:** Debug → Test harnesses → M33 lighting test room opens a paused furnished settlement with lamps, Hearth, gems, lava/water bridges and a sealed fog pocket. Sidebar controls adjust ambient/directional light, source intensity/radius, glow and pointer illumination; a comparison toggle restores the current renderer. Reset and Return to stronghold preserve the existing harness rules. See [graphics direction and limits](graphics-pass.md#m33-lighting-test-room). At the time this scope was planned, the experiment was confined to the test world; biome palettes, campaign integration and the completion checks below were still unfinished. They are now implemented and verified as recorded below.

- Establish an underground mood with subdued, tunable ambient illumination and localized pools of light. Keep terrain, units, tools and routes readable at normal play distance without flattening the scene into uniform brightness.
- Give lamps, the Hearth, lava and other appropriate emissive features a visible glow and illumination on nearby surfaces. Tune source color, intensity, radius, falloff and restrained bloom together; bright materials alone should not substitute for lighting their surroundings.
- Use biome-specific ambient palettes and light sources to distinguish warm inhabited rooms, cold ruins, fungal caves and volcanic depths. Avoid distracting flicker and respect reduced-motion settings.
- Add a soft light around the pointer's world position to illuminate the area beneath it. Follow the actual hovered surface as the camera pans, rotates and zooms; hide it over the sidebar, menus or when the pointer leaves the game. Keep the current tool icon and tile preview clear.
- Lighting is presentation only: neither pointer illumination nor source glow discovers tiles, exposes concealed rooms/enemies or changes targeting. Preserve the existing exception that gold/gems remain visible through fog; prevent glow spilling through fog or walls from disclosing hidden sources.
- Keep light settings in shared editable definitions, bound the cost of many sources and clean up lights on restart/travel. Document the visual direction and pointer behavior in the owning graphics/interface documentation during implementation.

Complete when ordinary play shows clear source glows, illuminated surroundings and a coherent underground mood across representative biomes, with a useful pointer light. Compare before/after captures at normal zoom and multiple angles; browser-check pointer tracking, UI suppression, fog boundaries, reduced motion and responsiveness in a furnished settlement.

### Implementation and focused verification

- M26 (`df70360`): five-stage cumulative availability guards room/building construction, recruitment, production, defense placement, research and casting. Twelve standalone Free Play entries have explicit arrival plans; legacy Miner remains debug-only. Campaign/bridge checks and all standalone arrival/restart tests passed. Sidebar integration uses those same availability queries.
- M27 (`6f4df72`): editable species/local habitat motion, territorial vs raiding groups, physical routes, blocked-wave handling and source suppression. Five habitat regressions plus encounter/enemy tests passed. Warned inhabitants now defend locally when struck without prematurely launching a group raid (`03d4e38`).
- M28 (`cc42121`): concealed neutral room remnants convert through timed real worker claiming after access/security checks, respect locked plans, gain ordinary services/furnishings, and sell for no windfall. All six room types were checked as single/strip/irregular layouts with free construction on/off; occupied, buried, blocked and unavailable examples passed.
- M29 (`dea5cc5`, pressure follow-up `1889bed`): five authored maps, alternate excavation approaches, deliberate finite gold routes, three gem-free openings and remote crystal/volcanic gem destinations. Structural checks and all ten normal paid campaign routes passed. Royal volcanic pressure recurred twice through lava before two paid bridge squares let workers physically suppress the source; a full subsequent recurrence window remained quiet. Exact routes and timings are recorded in the M19 integration record.
- M31 (`53ff892`) and M33 (`ca2d94b`): reference-led bank/room/biome/ruin refinement and ordinary source/pointer illumination. Source/test typecheck, 12 lighting/room checks, full environment browser cases and all five biome comparison views passed with no runtime errors. Pointer orbit/pan/zoom, sidebar/dialog suppression, fog masks, compact controls, reduced motion, reset/return passed. Fixed redundant Babylon light synchronization. Final settled 1440×1000 Intel Iris Plus samples: 59 FPS at the authored starting Hearth and 36 FPS in the full furnished showcase; active battles/setup may be slower. Audit, artifacts and procedural-art/occlusion limitations are in graphics-pass.md.

### M19 and M32 accepted scope

### M19 — Integrated balance and complete-level playtesting

Dependencies: completed gameplay foundations and integrated M23–M34, including M25.1. M12 and M15 are excluded.

- Tune starting economy, Stonehand creation cost, dwarf wages, support capacity, specialist arrivals, training/combat XP, spells, bridges and enemy pressure together.
- Play complete levels from ordinary starting conditions without free construction, supplied stocks, spawned defenders or shortened debug timers. Ensure the onward Hearthstone is challenging but reachable with the tools/resources available on that level.
- Check multiple layouts/approaches, escalating threats, recovery from losses and the Library's continuing usefulness. Correct gameplay blockers and visual/sidebar readability problems found during those runs.

Complete when the authored campaign can be played from fresh start through its endpoint using normal rules, defeat is demonstrable, and focused regressions plus browser playtests cover the discovered issues. Record tested routes, timings, provisional values and remaining content/visual limitations. This is a prototype balance pass, not production release machinery or a requirement for final art assets.

### M32 — Character animation and combat readability refinement

Dependencies: M24 balance and M27 behavior; coordinate presentation with M31.

- Audit Stonehands, hounds, specialists and the ten enemies in real movement/work/combat scenes against their approved references.
- Fix conspicuous sliding, abrupt turns, intersections, awkward proportions, repeated poses and disconnected attack/hit timing. Preserve recognizable silhouettes at normal camera distance.
- Make digging, reinforcing, hauling, crafting, research, rest, patrol and each enemy's distinctive attacks readable through poses and restrained effects. Integrate M30 sound cues with visible action timing.
- Preserve simulation authority, continuous movement, reduced-motion support and sidebar-only health/status information; visual refinement must not silently change hit ranges or terrain access.

Complete when representative work loops, group travel and mixed-species combat read clearly at ordinary zoom and reverse angles, attack feedback matches actual outcomes, and the recorded animation defects are resolved or documented. Check large-group responsiveness without running unrelated gameplay suites for cosmetic edits.

### M19 integrated verification — 2026-09-09

The pure player-action route driver in scripts/helpers/campaign-route.ts starts with the ordinary three Stonehands and 400 gold, excavates and earns finite resources, pays for support rooms, attracts and trains real defenders, manufactures and places traps, researches and prepares repeated spells, and builds the mandatory two-square Royal crossing. No free construction, supplied stocks, spawned defenders, revealed terrain or shortened simulation timers are used. The browser advances ordinary ticks between player actions and uses real sidebar travel.

| Area | Intended simulation | Alternate simulation | Browser journey |
|---|---:|---:|---:|
| Border Foothold | 241s | 304s | 241s |
| Fungal Hollows | 353s | 400s | 356s |
| Fallen City | 490s | 525s | 489s |
| Crystal Divide | 525s | 589s | 500s |
| Royal Deep | 477s | 513s | 477s |

Times are elapsed game seconds. Alternate routes include 45 seconds of consolidation before final activation. Both Crystal and Royal alternate runs suffered a real combat loss and attracted a replacement; their routes reclaimed eight and ten ruin squares respectively. Intended Royal also recovered a loss. Both final areas prepared/cast Haste at least twice and Slow at least once. Research knowledge carried into Royal, while charges, queues, residents, rooms and funds reset normally. An unprepared Border approach produced actual Hearth destruction at 122.1 seconds without purchased defenses. All successful recorded runs preserved the 400-health Hearth. These authored successful strategies are reproducible prototype balance evidence, not a guarantee for arbitrary play.

Royal's delayed lava entrance generated two real recurring waves at approximately 691 and 968 seconds. Normal workers could not suppress its lava source until two paid bridge squares provided physical access; it was claimed around 1015 seconds and remained suppressed through 1291 seconds. The extended test ended with 408 gold and 15 residents. Warned inhabitants now defend locally when attacked while preserving the scheduled group warning.

The browser campaign passed all five areas, staged construction/research availability, knowledge carry, fresh-area resets, desktop and 800×600 outcomes, and the endpoint with no runtime errors. Captures/report are under ignored test-results/campaign/. A focused canvas check also verified neutral ruin inspection from Spells, Workforce and Defenses opens Rooms, explains locked plans and grants no discovery or service capacity.

Final integrated simulation/tooling verification: npm run verify -- all passed all **246 tests**, with no failures, skips or cancellations, plus one source/test typecheck (log: test-results/final-simulation.log). Later presentation/sidebar-only fixes passed focused browser checks and source/test typecheck. The final verification-runner scope check also passed all four tests after registering the new selectable browser checks. A direct Vite production bundle and production browser smoke passed; normal startup ignores debug scenario parameters and exposes no development API/test-scenario panel. The bundle retains the existing large-chunk warning; no deployment or release infrastructure was added.

### M32 completion — 2026-09-09

Committed as `82fa236`; final campaign availability, ruin inspection and journey checks are in `a040d11`.

Actual work loops for mining, reinforcement, claiming, wall construction, hauling, eating, rest, training, crafting and research passed the character browser check, alongside six model front/back views. A real hound bite shared the victim's damage timestamp, enemy models stayed at simulation positions, paused combat poses stayed frozen and resident/enemy defeat geometry was released. The ten-enemy gallery, regional/reverse views, mixed natural combat, burrower tunneling strokes/excavation and reduced-motion checks passed with no browser errors. The enemy anatomy check now runs before combat because expired bodies are correctly disposed. Representative captures were visually reviewed; evidence is in test-results/m32-after/ and test-results/m17-enemies/.

The recorded audit and retained procedural rig/crowd/furniture-contact limitations are in graphics-pass.md. No combat range, movement authority, terrain access or statistical balance was changed by the presentation pass.

### M30 implementation and automated verification — 2026-09-09

Original procedural ambience, restrained exploration/combat score, work/movement/material/species cues, spell/warning/outcome sounds and session volume/mute settings are implemented (5394dff); audio-design.md owns the direction and asset provenance. Three audio simulation tests and the browser playback/control/cleanup check passed, including actual Web Audio activation, bounded voices/beds, pause, settings, mute, restart and world replacement. Crowded work played 33 cues with two sampled short voices/two beds; combat reached 45 cues with one sampled short voice/two beds. The browser reported no runtime errors and recorded test-results/m30/work-combat.webm. Muting preserves existing visible notifications and combat/sidebar feedback.

**Listening review remains pending.** Available tools can record and inspect playback state but cannot listen to the recording. A work/combat sample and optional listening-feedback question were provided to the user; no listening result is asserted. M30 remains the only open milestone review in development-plan.md.

## 2026-09-09 — Spell, trap and Hearthstone graphics overhaul

Completed the user's request to individually refine all nine current player spell effects, both traps and both Hearthstones against concept art. Created twelve missing individual concept sheets with the built-in imagegen tool and retained all exact prompts; the approved main Hearth and Stonehand character references remain authoritative. The shared live/preview models use distinct spell silhouettes and animation, mechanical trap cycles, and carved stone/bronze Hearth cradles with detailed blue crystals and functional damage/activation states.

The permanent `arcana-gallery` contains thirteen starting/refined pairs with item/state selection, independent play/pause/restart/step/speed controls, front/back/quarter turns, close individual inspection, overview and expandable concept references. Starting models and their material/geometry policy are archived separately; the prior character and terrain archives were preserved. Preview actors never enter simulation, and Return to stronghold restores the retained game. Gameplay costs, targeting, balance, traversal and services are unchanged; successful Stonehand creation now emits a cosmetic assembly event at the actual arrival square, while failed purchases emit none.

Every item was compared with its sheet and iterated through paired multi-angle captures, revised close views and targeted final cleanup. Per-item records, assets, controls and practical limits are in [arcana-overhaul.md](previous-docs/arcana-overhaul.md), with detailed reviews in the spell, defense and Hearthstone concept folders. Final refinements resolved washed-out magic colors, obscured Mending crescents/lightning core, indistinct rally axes, thin spike silhouettes/protruding point bevels, crossbow arrowhead alignment and repeated crystal texture bands. Source review also checked frozen baseline fidelity, per-instance material ownership, glow membership, geometry merging, light masks and scene cleanup.

Verification completed:

- Initial `npm run verify -- arcana`: source/test typecheck and 47 focused simulation tests passed.
- `npm run verify -- all --browser=arcana --production`: source/test typecheck and all 249 simulation tests passed, including the authored campaign. All thirteen paired exhibits passed browser checks for multiple views, three states each, material separation, finite transforms, isolated preview state, playback/step/speed/zoom, reduced motion and return/reopen. Real spell casting/cleanup and both manufactured trap trigger cycles passed with no browser errors. Production build and development-control isolation passed.
- Final visual-only cleanup: source/test typecheck passed; targeted Create Stonehand, Thunder Rune, Spike Trap and both Hearth captures and concept-image controls passed in `test-results/arcana-gallery-polish/`. Production build/isolation passed again. Earlier full captures are in `test-results/arcana-gallery-first/` and `test-results/arcana-gallery-final/`.
- `node scripts/hearth-morale-browser.mjs m11`: normal hidden discovery, contested activation request, physical activation and local victory; natural main-Hearth attacks/destruction, frozen terminal actions and purchases, and real area restart all passed with no browser console/runtime errors.

M30 listening review remains pending; this pass adds no unrelated gameplay scope.

## 2026-09-09 — Clearer Debug comparison navigation

Moved the three comparison studios into direct **Debug → Before & after** buttons: **Characters**, **Terrain & rooms**, and **Spells, traps & Hearthstones**. Additional scenarios now have readable names grouped by purpose, preserving their existing IDs and loading action. Debug keeps gameplay testing and session settings separate. **Back to comparison** restores the current controls without reloading; the terrain View selector now retains its non-default selection. Comparison panels highlight Debug and omit unrelated simulation advancement, empty resident diagnostics and test-actor creation. First-launch errors remain visible.

`npm run verify -- development --browser=debug` passed source/test typechecking, all 10 development/verification tests, direct launches of all three comparisons, retained stronghold and preview state, existing paused/resumed gameplay harnesses, cross-panel return, stepping and needs setup. After the terrain selector correction, source/test typechecking and `node scripts/debug-browser.mjs --comparisons` passed again with non-default character/terrain selections. No browser errors. Menu captures are in ignored `test-results/debug-before-after-menu.png` and `test-results/debug-in-game.png`. No gameplay/model changes or production build were required.

## 2026-09-09 — Sparse room overhaul

Implemented the user-requested overhaul of all six room types after generating six individual concept sheets with the built-in imagegen tool. Concepts and exact prompts are saved in `concept-art/rooms/overhaul/`; `room-overhaul.md` records the visual direction, editable definitions, reference preservation and practical limits.

Treasure Rooms now show sequential per-square coin heaps from actual connected-room wealth; Dormitories show compact role-specific bedding only for assigned living residents, including Hound dens. Kitchen uses a stove and communal table; Workshop stops at one assembly bench, anvil and upright rack; Training uses four upright targets and standing practice; Library uses long bookcases and a few lecterns. Distinct patterned floor materials are no longer overwritten by the generic terrain sheet. Floor-area capacity, prices, access, room services and shared currency accounting are preserved. The original furnishing renderer remains intact, and the original automatic layout is retained in `room-decoration-baseline.ts` for the terrain reference side.

Verification: `npm run verify -- room-overhaul --browser=room-overhaul` passed one source/test typecheck, all 36 focused simulation checks and browser checks for six exact 5×5 rooms, six distinct floor materials, dynamic gold spending, resident arrival/death/reclaim bedding updates, and forward/reverse screenshots. Simulation checks cover ordinary capacity and room function, access, irregular layouts, free construction, reclaim/conservation, support assignment, ruins, lighting sources, extension definitions and preserved reference layouts. `git diff --check` passed. Concept/runtime gallery and captures: `test-results/room-overhaul/index.html`. No production build or unrelated campaign/spell suites were required. M30 listening review remains pending.

## 2026-09-09 — Second concept-driven room visual pass

Refined all six current rooms against their saved v4 concepts. Floors now use weathered stone, quieter joints and footprint-aware perimeter bands, including concave corners. Kitchen and Library have one larger centerpiece with a compact fallback. Furniture gains independent wood, cloth, leather, straw and metal finishes; stamped gold heaps; draped role bedding; a chimney stove and trestle dining set; a substantial central workbench, anvil and lit tool rack; four upright target silhouettes; and framed, illuminated shelves with angled reading stands. Edge placement faces the room and reserves free approaches. Shared lighting follows each prop's actual orientation. Baseline renderers and their materials remain untouched; room prices, floor-area capacity and service rules are unchanged.

Verified with `npm run verify -- room-overhaul --browser=room-overhaul`: source/test typecheck and all 38 focused simulation tests passed. Browser captures cover six standard 5×5 rooms, reverse angles, empty/populated Treasury and Dormitory, gold spending, resident loss/reassignment and Library reclaim to an irregular footprint. Visual review found and corrected downward textile winding and distorted normals on flattened merged spheres; final `npm run typecheck` and `node scripts/room-overhaul-browser.mjs` both passed after those fixes. Reviewed the final captures and reverse furniture views. `git diff --check` passed.

The regenerated local gallery is `test-results/room-overhaul/index.html`, with concepts, refined captures, reverse/empty/irregular views and links to locally retained first-pass images. Current material and layout guidance is in `room-overhaul.md`. Geometry remains a readable procedural approximation of the paintings; global gameplay lighting is unchanged. M30 listening review remains pending.

## 2026-09-09 — Debug level preview

Added Debug → Level preview: a read-only whole-level map for the current world and every registered Campaign/Free Play starting layout. Fog is disabled only while drawing this preview. Living enemies use red position markers; uncleared encounter sources use amber rings, and both Hearthstones use cyan diamonds. Map clicks and an expandable enemy list show details in the left panel. Opening pauses simulation and camera input without changing the prior pause preference; closing retains gameplay state and normal map fog.

Verification: `npm run verify -- session` passed the source/test typecheck and standalone level initialization/restart check. `node scripts/level-preview-browser.mjs` passed all catalog choices, hidden terrain and enemy pixel checks, enemy/map inspection, compact layout, retained state, paused/running return behavior and ordinary full-map fog. Reviewed the whole-level screenshot in `test-results/level-preview/whole-level.png`. The focused browser check is selectable with `--browser=level-preview`. Local Vite server remains running.

## 2026-09-09 — Load full levels from the preview modal

Added **Load full level** to Debug → Level preview. It opens an independent current-world copy or a normal named standalone start in the actual 3D renderer, reveals all terrain and shows every living enemy regardless of resident sight. The camera frames the level, simulation starts paused, and the existing test-world controls resume play or return to the retained stronghold. Area reset retains the loaded preview setup. The display-only enemy override clears on world replacement; baseline renderers and normal gameplay visibility rules are unchanged.

Verification: focused `level-preview` simulation checks and source/test typecheck passed. The extended `node scripts/level-preview-browser.mjs` passed catalog map checks plus full current-world, prototype crossing and campaign-area loading, actual enemy mesh visibility, camera centering, simulation resume and retained gameplay state after return. The existing furnishing refresh invalidates route caches on return. Reviewed screenshots under `test-results/level-preview/loaded-*.png`. `git diff --check` passed; local Vite remains available.
