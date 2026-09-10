# Dwarven stronghold game

A TypeScript + Babylon.js browser game about reclaiming underground strongholds. Excavate, build rooms, support autonomous residents, prepare defenses and spells, then physically secure the onward Hearthstone. Stonewake is a provisional title.

## Run locally

Use Node.js 24 or later. Run `npm install`, then `npm run dev` and open the local URL printed by Vite. Source changes reload automatically. Reloading loses the current game; no saves, accounts or backend are used.

`npm test` selects focused checks from uncommitted changes. Prefer `npm run verify -- <scope>` for a specific change; `--list` previews selection. `npm run typecheck` checks source and tests. `npm run build` checks source and bundles the game. See [development tools](development-tools.md#verify-a-change) for verification appropriate to the change; documentation edits need no game tests or build.

## Play

Launch opens **Campaign / Free Play / Settings**. Campaign travels through Border Foothold, Fungal Hollows, Fallen City, Crystal Divide and Royal Deep, introducing rooms, specialists, defenses, research and bridges gradually. Its growing maps lead from a sheltered mining basin through pool caverns, buried streets and a crescent fracture to royal peninsulas around lava. Free Play offers these five layouts as independent starts plus seven distinct standalone scenarios and the peaceful Hearthside Halls building study. Settings and the in-game ♪ control manage session audio and animation preferences.

Three Stonehands start each area. They mine, haul, claim and build autonomously, need no living support, and flee enemies. **Spells → Create Stonehand** purchases more with shared gold. Build a Dormitory for Cave Hounds, which defend and explore and use their dens for food/rest. Training Rooms, Workshops and Libraries attract Warriors, Engineers and Runesmiths once available and supported. Specialist dwarfs need reachable beds, Kitchen capacity and wages. The original Miner remains a debug-only role.

Rooms work from their floor area, including single tiles, narrow strips and irregular footprints. Furnishings are automatic and cosmetic. Treasure Room piles reflect actual stored wealth; Dormitory bedding reflects resident assignments. Gold seams are finite; gems provide renewable income in the same gold currency. Both resource locations show through fog, while surrounding terrain and enemies stay concealed.

The starting Hearth is fixed and destructible. Discovering the separate onward stone is only the first step: use the Hearth panel to request a resident's physical activation at a secure site. Victory offers explicit campaign travel or standalone restart/menu. Travel carries building unlocks and researched knowledge into a fresh settlement; residents, gold, prepared charges and local work reset. See [levels](levels.md) for the full rules.

## Controls

**Base showcase:** open **Debug → Level preview → Showcases → Hearthside Halls · Built base → Load full level**. It displays six spacious chambers, two-tile main halls, six room doors, a separate gold gallery and unexcavated expansion ground. The first selection replays ordinary paid construction and displays progress; later selections reuse that example until reload. Inspect the whole map, zoom/orbit in 3D or resume its residents. **Free Play → Hearthside Halls** adds a peaceful building study on the same terrain with the normal crew and allowance, ready to build yourself. See the [layout and construction sequence](levels.md#hearthside-halls-building-showcase).

| Action | Control |
|---|---|
| Mark excavation | Default left click/drag on terrain, including darkness; starting on a marked tile removes marks |
| Build or cast | Click an enabled icon in Rooms, Defenses or Spells, then select a valid target when required |
| Cancel and return to excavation | Right click or Escape |
| Inspect | Click open floor, rooms, residents or fixtures; details stay in the left sidebar |
| Pan | WASD or the outer window edges, including the far-left edge over the sidebar |
| Orbit | Q/E, Left Ctrl+A/D, or horizontal middle-mouse drag |
| Zoom / return home | Mouse wheel / Home |
| Navigate maps | Click minimap; M or its expand icon opens the full map; click to recenter and close |
| Pause / sound / main menu | Sidebar controls; returning to the menu confirms discarding the run |

Room and spell costs, capacity, health, progress and warnings stay in the sidebar or anchored notification cards. The world has no floating text or status bars. [Gameplay interface](gameplay-interface.md) covers targeting, tooltips, inspection and notifications.

## Develop and inspect

Read this file, [current development notes](development-plan.md) and the relevant system document before editing. [AGENTS.md](AGENTS.md) contains project instructions. Check the working tree before making changes; preserve unrelated work. Use the [content playbook](content-playbook.md) for definitions and the [room checklist](room-development-checklist.md) for every room change.

**Debug → Test harnesses** opens paused gameplay worlds using actual construction and simulation systems. **Room layouts** exercises arbitrary footprints and free construction. The shared **Free room construction** toggle, or untracked `.env.local` with `VITE_FREE_ROOM_BUILDING=true`, waives construction gold while preserving placement, work, access and campaign availability. Manufacturing and casting still cost gold.

**Debug → Before & after** opens **Characters**, **Terrain & rooms**, or **Spells, traps & Hearthstones**. Original renderers and independent materials are permanent references. Preview playback, camera controls and concept references support inspection; **Back to comparison** restores controls and **Return to stronghold** restores the retained game.

**Debug → Level preview** shows the current world and groups named layouts into Showcases, Campaign, Standalone, Before overhaul and Authoring. The twelve original layouts remain independent comparisons; a small authoring fixture exercises shapes, ruins and local environment treatments. The preview exposes hidden terrain and enemy/source positions without revealing the retained game. **Load full level** opens a fully revealed 3D test copy, paused and framed to the whole map. Returning restores the stronghold. Comparison layouts stay outside ordinary Free Play.

Map definitions use small shared shape helpers and local presentation regions for dry workings, damp margins, fungal colonies, masonry, crystal and scorched ground. Geometry, paid construction and hidden inhabitants still follow the ordinary game systems. [Development tools](development-tools.md#level-redesign-review) covers selectable paid-route, fogged browser and old/new layout checks; [level concepts](concept-art/levels/overhaul/README.md) records the direction and prompts.

## Documentation map

| Document | Purpose |
|---|---|
| [Current development notes](development-plan.md) | Implemented catalog, remaining review and known limits |
| [Campaign and standalone level overhaul](level-overhaul.md) | Geography, useful scale, environmental identity and level acceptance rules |
| [Game rules](game-rules.md) | Core loop, terrain, resources, needs and shared constraints |
| [Characters](characters.md) | Stonehands, hounds, specialists, recruitment, training and wages |
| [Rooms and structures](rooms.md) | Costs, capacity, services, ruins, walls, bridges, doors and traps |
| [Spells](spells.md) | Research, preparation, costs, effects and targeting |
| [Levels](levels.md) | Campaign, Free Play, visibility, habitats and authoring |
| [Gameplay interface](gameplay-interface.md) | Menus, camera/input, sidebar, notifications and debug controls |
| [Development tools](development-tools.md) | Reproduction scenarios, automation API, focused checks and module ownership |
| [Configuration](configuration.md) | Tunable definitions and session editor behavior |
| [Content playbook](content-playbook.md) / [room checklist](room-development-checklist.md) | Add content through shared services and verify real access/layouts |
| [Graphics](graphics.md) | Rendering rules, lighting, animation and visual-document map |
| [Audio](audio-design.md) | Procedural sound direction, events, controls and pending listening review |
| [Concept art](concept-art/README.md) | Current visual references and retained generation provenance |
| [Archive](archive/README.md) | Milestones, prior authorizations, superseded drafts and dated verification; historical use only |

Current rule documents and the user's latest decisions govern gameplay. Concept illustrations guide appearance; incidental furniture, labels, stairs or actors do not add mechanics. Runtime surface maps have separate [asset provenance](public/art/terrain/README.md).
