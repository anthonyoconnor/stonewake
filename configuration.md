# Configuration guide

Edit balance values in `src/content/tuning.ts`: each entry defines its default, label, group, allowed range and when it applies. The same entries generate **Debug → Game configuration**. No simulation edits are needed to change mining speed, carrying capacity, needs, food production, movement, sight, starting resources or camera controls.

| Content | Source of truth |
|---|---|
| Shared balance and camera | `src/content/tuning.ts` |
| Room prices, furnishing footprints/capacity | `src/content/rooms.ts` |
| Dwarf names, appearance, capabilities and attraction | `src/content/characters.ts` |
| Production input costs, durations and capabilities | `src/content/recipes.ts` |
| Map sizes, openings and seams | `src/content/levels.ts` |
| Debug layouts and example stock | `src/content/room-lab.ts`, showcase setup in `src/main.ts` |
| Procedural art shapes, texture motifs, lighting | `src/view/` (presentation, not balance) |

The popup is grouped into tabs. Edit any number of tabs, then Apply once; invalid values reject the entire draft. Closing or Escape discards the draft. Reset restores source defaults in the draft, ready to apply. Export produces a JSON reference of the draft's values; it is not a game save and is not automatically imported. To retain an experiment, copy approved values into the source definitions. Page reload restores source defaults; Restart stronghold keeps this session's tuning.

Fields say whether they apply live, to new loads, new furnishings, a new stronghold, or a new page. In-flight bags and existing furniture stock/capacity are preserved. Rebuild a room studio layout after changing furnishing dimensions/capacities. Existing room payments are retained when costs change. New rooms and recipes automatically join the numeric editor through `src/content/settings.ts`.

Wall construction must remain slower than excavation plus reinforcement. Camera bounds must contain the Home distance. Whole-number capacities/costs and finite ranges are validated before any mutations. Values are provisional, not final balance.
