# Configuration guide

Edit balance values in `src/content/tuning.ts`: each entry defines its default, label, group, allowed range and when it applies. The same entries generate **Debug → Game configuration**. No simulation edits are needed to change mining speed, carrying capacity, needs, movement, sight, starting resources or camera controls. Room support and concurrent work capacity are tuned per floor tile in the room definitions; Kitchen production chains and food inventories are absent.

| Content | Source of truth |
|---|---|
| Shared balance and camera | `src/content/tuning.ts` |
| Room prices, service and capacity per tile; separate look/icon and cosmetic furnishing models/footprints | `src/content/rooms.ts` |
| Dwarf names, appearance, walking speed, capabilities, attraction and explicit per-level statistics/training times | `src/content/characters.ts` |
| Production input costs, durations and capabilities | `src/content/recipes.ts` |
| Spell effects, research/preparation durations and casting gold | `src/content/spells.ts` |
| Map sizes, openings and seams | `src/content/levels.ts` |
| Debug layouts and example stock | `src/content/room-lab.ts`, shared factories and showcase setup in `src/content/scenarios.ts` |
| Procedural art shapes, texture motifs, lighting | `src/view/` (presentation, not balance) |

The popup is grouped into tabs. Edit any number of tabs, then Apply once; invalid values reject the entire draft. Closing or Escape discards the draft. Reset restores source defaults in the draft, ready to apply. Export produces a JSON reference of the draft's values; it is not a game save and is not automatically imported. To retain an experiment, copy approved values into the source definitions. Page reload restores source defaults; Restart stronghold keeps this session's tuning.

Fields say whether they apply live, on room recalculation, to new loads, a new stronghold, or a new page. Existing room payments are retained when costs change. Capacity updates synchronize room service slots and preserve gold displaced by smaller storage. Cosmetic furnishing dimensions affect only appearance and never change capacity, collision or sight. New rooms and recipes automatically join the numeric editor through `src/content/settings.ts`.

Wall construction must remain slower than excavation plus reinforcement. Camera bounds must contain the Home distance. Costs and finite ranges are validated before any mutations. `capacityPerTile` can be fractional: each edge-connected room provides `floor(tileCount * capacityPerTile)` slots or storage units, with separate patches rounded independently. Current defaults are one resident or worker per square and 50 gold per Treasure Room square. Values are provisional, not final balance.

Each character type has a **levels** group containing maximum health, attack damage, attack interval, work multiplier and training time to enter each level. The level table is the source of these values; there is no global training duration, uniform percentage per upgrade or independent level-cap setting. Every shipped type has levels 1–5. [Character levels](characters.md#character-levels-and-training) contains the current balance tables and advancement rules. Health edits preserve missing health, damage/work edits apply live and attack intervals apply when scheduling the next attack. Partial training progress is retained when its target duration changes.

The **Training & research** group tunes the shared personal training cooldown and research pacing. Training ends after one gained level; cooldown starts then and holds no room slot. The work multiplier affects productive work and research, while training accumulates active practice time with any temporary Haste effect. Spell strength, duration and other effect values are in the **Spells** group and apply to future casts. Specialist arrival cadence is under **Economy & world**. Spell research/preparation times and casting prices come from the spell registry and appear in the same group. Training/research progress is retained during tuning and room changes. Normal arrivals require explicit world enablement and are off by default in room layouts; **Test automatic specialist arrivals** enables the same rules there. These systems live in `src/game/progression.ts`, `research.ts` and `recruitment.ts`; shared job modules handle scheduling.
