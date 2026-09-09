# Spells, traps and Hearthstones graphics overhaul

The user's September 9 request covers all nine current player spells, both traps, and the settlement and onward Hearthstones. Each item has its own concept reference and a permanent starting/refined exhibit. This continues the [character and terrain overhaul](graphics-overhaul.md); its older archives remain unchanged.

## Concept references

The existing [Stone Hearth concept](concept-art/rooms/stone-hearth-v2.png), [blue Hearth cohesion reference](concept-art/terrain/stronghold-cohesion-v2.png) and [Stonehand v2](concept-art/stonehands/stonehands-v2.png) remain authoritative. Twelve new sheets were generated using the built-in imagegen tool: nine individual spell effects, two individual traps and the onward Hearthstone. The generation prompts are retained with the images. Sheets are visual references; runtime visuals are editable Babylon.js meshes and materials.

| Item | Concept and visual target |
|---|---|
| Create Stonehand | [Assembly](concept-art/spells/summon-stonehand-v1.png): amber forge seal, rune sockets, inward-moving stone/bronze fragments and a diamond core. The accepted worker is unchanged. |
| Haste | [Haste](concept-art/spells/dwarf-haste-v1.png): gold swept crescents, forward chevrons and sparse diamond sparks. |
| Slow | [Slow](concept-art/spells/enemy-slow-v1.png): blue broken octagon, inward shards, low stone weights and restrained bindings. |
| Stoneguard | [Stoneguard](concept-art/spells/stoneguard-v1.png): four separate slate shields, bronze corners and pale blue runes. |
| Thunder Rune | [Thunder](concept-art/spells/thunder-rune-v1.png): inset diamond seal, pale strike with violet branches, jagged shock ring and lifted debris. |
| Runic Barrier | [Barrier](concept-art/spells/runic-barrier-v1.png): clustered capped stone columns, bronze bands and inset cyan channels. |
| Mending Rune | [Mending](concept-art/spells/mending-rune-v1.png): four mended slate corners, green joined seams, rising crescents and motes. |
| Rune of Reckoning | [Reckoning](concept-art/spells/rune-of-reckoning-v1.png): red-orange diamond, inward bronze marks and fractured glowing veins. |
| Call to Arms | [Rally](concept-art/spells/call-to-arms-v1.png): crossed axes, concentric ground seals and four low amber beacons. |
| Spike trap | [Spike trap](concept-art/defenses/spike-trap-v1.png): nine recessed square sockets, broad forged spikes, brass corner shoes and inset edge rails. |
| Bolt trap | [Bolt trap](concept-art/defenses/bolt-trap-v1.png): curved metal bow, timber rail, tension cords, winch and cog mechanism on a braced swivel base. |
| Stone Hearth | [Existing Hearth](concept-art/rooms/stone-hearth-v2.png): substantial cut-stone dais, circular bronze inlays, carved runes and blue crystal cluster. |
| Onward Hearthstone | [Relay](concept-art/hearthstones/onward-hearthstone-v1.png): compact ancient socket, faceted sapphire crystals, bronze compass detail and dormant/awakening/ready illumination. |

Spell prompts and provenance: [primary set](concept-art/spells/prompts-primary.md), [secondary set](concept-art/spells/prompts-secondary.md). Trap and relay prompts live beside their individual sheets. Generated imagery adds no new mechanics, actors, terrain layers or gameplay structures. The incidental enemy web/spore effects and legacy debug Summon Miner remain supported without joining the player spell catalog.

## Permanent comparison room

With the local development server running, open **Debug → Before & after → Spells, traps & Hearthstones**. The room also remains available as `arcana-gallery` in the grouped **Test harnesses → Additional test scenarios** selector. The direct development URL is [the comparison room](http://127.0.0.1:5173/?scenario=arcana-gallery&paused=1); use the port printed by Vite.

The room contains thirteen starting/refined pairs. Amber identifies starting models; teal identifies refined models. The sidebar selects each item, front/back/quarter turns, a pair or individual model, and the whole room. Zoom controls support close inspection. Each item has three clearly named states: before/active/expired magic, armed/triggered/resetting traps, intact/damaged/destroyed main Hearth, and dormant/awakening/ready onward Hearth. Play, pause, restart, frame stepping and playback speed operate independently of the simulation pause. Reduced motion follows the normal Settings preference. No labels or progress bars are placed over the world.

Spell subjects provide identical scale context on both sides. They are display models outside gameplay: they cannot fight, work or spend gold. Create Stonehand originally had no cast effect, so its starting exhibit shows the unchanged worker without assembly magic. **Back to comparison** restores the controls after opening another panel without resetting the exhibit, camera or preview. **Return to stronghold** restores the retained game in memory; reset/reopen rebuilds the exhibits from the archived and current factories. Simulation advancement, resident diagnostics and test-actor setup are omitted from this display room.

The chamber uses ordinary claimed floor and introduces no buildable room type, service or capacity rule. Its free-construction flag follows the shared scenario setting. The existing working spell and defense yards remain available for actual casting, production, placement and combat checks.

## Source ownership and preservation

[Gallery content](src/content/arcana-gallery.ts), [display room](src/view/arcana-gallery.ts), [sampled exhibits](src/view/arcana-exhibits.ts) and [sidebar controls](src/ui/arcana-gallery.ts) keep preview state separate from simulation. The starting spell, defense, onward and main Hearth sources are retained in `spells-baseline.ts`, `defenses-baseline.ts`, `hearth-baseline.ts` and `hearth-main-baseline.ts`. `arcana-*-baseline.ts` and [the material facade](src/view/arcana-reference.ts) preserve the material/primitive policy from the start of this pass in an independent cache. Future visual edits should retain these archives.

Current models use the same factories in gameplay and the gallery. A successful Create Stonehand cast adds a short cosmetic event at its actual arrival square through the existing spell-burst mechanism. Failed casts emit no assembly effect. Costs, research, targeting, damage, duration, traversal and room services retain their existing rules in [Spells](spells.md), [Rooms](rooms.md) and [Levels](levels.md).

## Verification and practical limits

Every item was inspected from the front, back and three-quarter angle against its individual sheet, then refined and inspected close up. The [spell review](concept-art/spells/README.md), [trap review](concept-art/defenses/README.md) and [Hearth review](concept-art/hearthstones/README.md) record per-item changes. Initial captures in `test-results/arcana-gallery-first/` led to more distinct spell colors, stronger shield/axe/crescent silhouettes, wider forged spikes, a correctly aligned crossbow arrowhead, and mineral detail in the crystals. Full close views in `test-results/arcana-gallery-final/` led to the final visible lightning core, lighter loose stone, clean spike tips, and continuous crystal UVs, reviewed in `test-results/arcana-gallery-polish/`.

Completed integration checks:

- `npm run verify -- arcana`: source/test typecheck and 47 focused simulation tests passed during integration.
- `npm run verify -- all --browser=arcana --production`: source/test typecheck, all 249 simulation tests including the authored campaign, the thirteen-pair browser check, production build and production isolation passed.
- The browser check covers every exhibit's three states and multiple views, independent baseline materials, finite transforms, playback/stepping/speed/zoom, reduced motion, an unchanged gameplay world, return/reopen, actual successful spell casts and cleanup, and both traps firing in the working defense yard. It reported no browser errors.
- After final visual-only corrections, source/test typecheck and the targeted five-exhibit browser run passed for Create Stonehand, Thunder Rune, Spike Trap and both Hearths, including the concept-image controls. The production build and isolation check passed again.
- `node scripts/hearth-morale-browser.mjs m11`: normal hidden discovery, contested requests, physical onward activation, local victory, natural attacks and destruction of the main Hearth, frozen terminal actions, and area restart passed with no browser errors.

The repeatable browser check is [arcana-gallery-browser.mjs](scripts/arcana-gallery-browser.mjs), selectable with `npm run verify -- arcana --browser=arcana`. Direct arguments select items for subsequent visual iterations, for example `node scripts/arcana-gallery-browser.mjs thunder-rune`. `ARCANA_CAPTURE_DIR` preserves separate iteration captures in ignored `test-results/`. Completed dated results are also recorded in [development history](development-history.md).

Procedural geometry can reproduce the sheets' silhouettes, material contrast, rune shapes and motion motifs; it does not reproduce painterly microdetail or volumetric smoke pixel for pixel. Physical-looking spell pieces remain cosmetic, except for the existing Runic Barrier gameplay obstruction. Their scale and glow must remain readable around units at the ordinary overhead camera distance.
