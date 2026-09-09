# Adding rooms and dwarf types

This is the implementation playbook for the browser prototype. Read the relevant room/character design first. Stable IDs are the links between content and systems; names are presentation. The examples below use existing services and models. They do not introduce a new simulation framework.

Use [Development tools](development-tools.md) for shared reproduction scenarios, browser commands, job diagnostics and focused verification. Job selection, validation and execution have separate modules under `src/game/jobs/`; continuous movement lives in `src/game/movement.ts`.

## Required status update

For every room or dwarf addition and every related integration, update the [current implementation inventory](development-plan.md#current-implementation-status) in the same completed chunk. Record normal versus debug-only availability, implemented behavior and remaining dependencies. Update affected design wording and append completed verification to [development-history.md](development-history.md). Read past entries only when historical context is needed; keep current limitations in the active plan. A definition, concept image or completed milestone alone is not evidence that the content is playable.

## Add a room using existing services

1. Add one `RoomDefinition` to `src/content/rooms.ts`. Use a unique lowercase ID, display name, minimap color, cost, description, `implemented:true`, `service` and `capacityPerTile`. Add a `look` with icon ID, floor color, trim color and motif. Existing motifs are `treasure`, `dormitory`, `kitchen`, `workshop`, `training`, `library`; a generic motif is also available. Reuse an icon while prototyping or add original SVG artwork in `src/ui/icons.ts`.
2. Define cosmetic furnishings with a unique kind within the room and whole-tile width/depth. `model` selects reusable artwork independently of the kind: `chest`, `bed`, `mushrooms`, `stove`, `table`, `barrel`, `bench`, `anvil`, `assembly`, `dummy`, `weights`, `lectern`, `bookshelf`. Omitting model uses kind. Match the model's visual dimensions, but assign no service, capacity, collision, sight obstruction or gameplay access requirements to it. A new visual model is an additive drawing case in `src/view/furnishing-models.ts`; an unknown model shows a neutral prototype block.
3. Use an existing service from the table below. Connected room capacity is `floor(tileCount * capacityPerTile)`, calculated separately for disconnected components. `World.roomServices` holds functional slots; `World.furnishings` holds decoration. `syncRoomServices` updates slots from room floor, and `furnish` refreshes the visual arrangement and synchronizes services. Construction, refunds, free construction, navigation, reservations and gold handling are shared. Do not add room-name checks to these systems.
4. Start the game. The room automatically appears in the room grid, Room Layout Studio catalog, and room configuration tab. Select it in the studio and load the example shapes. No extra sidebar registration is required.
5. If it attracts a dwarf, reference its services in that dwarf's `attractionServices`; services are not exclusive to one room or type. Automatic specialist arrivals use accessible service capacity and spare settlement support. Enable recruitment explicitly for a normal world; keep it disabled in isolated room layouts and service tests unless recruitment is the behavior being tested.
6. Follow every layout case in [the room checklist](room-development-checklist.md), including paid/free construction, expansion, reclaim/refund, gold conservation, blocked entrances, multiple users and walls planned beside the room. Verify the same service with all decoration removed. At the default capacities, a reachable one-tile room is functional.
7. Add a focused service regression and browser playtest. Update the relevant design, development plan and this playbook if a new shared service was introduced. Run `npm test`, `npm run build`, review `git diff --check`, commit, and leave `npm run dev` running.

Example room entry (copy into the exported definitions array, choose approved names/art):

```ts
{
  id: 'small-vault', name: 'Small Vault', color: '#987641', cost: 10,
  description: 'Compact gold storage.', implemented: true,
  service: 'storage', capacityPerTile: 50,
  look: {icon: 'treasure', floor: '#655b49', trim: '#c3a15c', motif: 'treasure'},
  furnishings: [{kind: 'vault-box', model: 'chest', width: 1, depth: 1}]
}
```

| Existing service | Shared behavior / dependencies |
|---|---|
| `storage` | Gold hauling, spending, capacity, displaced contents and physical wage collection; no worker required. |
| `rest` | Resident accommodation slots and autonomous resting visits; one supported resident per slot. |
| `dining` | Resident food-support slots and autonomous eating visits; no food stocks, ingredients or production chain. |
| `craft` | Concurrent workers; queued recipe capability controls eligibility, time and gold inputs. |
| `training` | Concurrent trainees of any type; one gained level ends the visit, releases its slot and starts a personal cooldown. Partial progress belongs to the resident. |
| `research` | Concurrent researchers, with one worker per order; requires `research`. Progress and prepared spells belong to the world. |

Services can belong to any room ID. Accommodation and dining reserve ongoing support for residents; crafting, training and research reserve slots only while using them. Decoration cannot change those assignments. Gold displaced by reduced storage remains loose for hauling. Completed crafted items live in the shared output inventory; removed room capacity does not erase them. There are no growing, cooking or brewing simulation services.

Report simultaneous work capacity from reachable room service slots, not decorative objects or their approaches. Several slots can share a floor tile when tuning allows more than one user per square; occupancy must not impose an extra tile-count cap. For new spells, add definitions in `src/content/spells.ts`; the sidebar and numeric configuration are generated from them. A new spell effect needs a corresponding simulation case in the spell-effect system. Keep research/prepared state on the world so room changes preserve earned work.

## Add a dwarf using existing behaviors

1. Add one `CharacterDefinition` to `src/content/characters.ts`: unique ID, name, nonempty names list, color, speed multiplier, appearance, capabilities, attraction services and an explicit `levels` table. Each level row supplies `level`, `trainingSeconds`, `health`, `damage`, `attackSeconds` and `workMultiplier`. Use consecutive levels starting at 1, with zero training seconds for the spawn level; later rows specify active practice required to enter them. The shipped types have five levels. `helmet`, `braids`, `warrior` and `runesmith` are reusable models; any can be used by any type. Do not branch gameplay on the type's name or appearance.
2. Select existing capabilities: `mine`, `haul`, `claim`, `reinforce`, `buildWall`, `research`, or a capability named by a crafting recipe. `fight` permits autonomous pursuit and rally response; `defend` permits attacks only on enemies already within melee reach. Workers use `defend`; a damage value or a higher level alone must not grant pursuit or rally. Needs, movement and training are shared automatically and need no capability flags.
   `scout` adds continuous patrol and shared surveys; paired with `fight`, it also answers settlement threat reports. Mining workers (`mine`) flee nearby enemies or damage before self-defense and reject work routes through known danger. These behaviours use capabilities rather than a character's display name or model.
   For automatic arrivals, add `recruitment: {seconds: 45, weight: 3}` for a defender, or `{seconds: 60, weight: 1, work: 'craft'}` / `work: 'research'` for support staff. Required attraction services, spare beds and food still gate eligibility. Defender weights guide the next arrival among supported types; support demand comes from unfinished orders. Omit recruitment for debug-only types and manually created constructs. Cooldowns and defender weights appear in Game configuration. See [recruitment rules](characters.md#cave-hounds-and-population-balance).
3. For production, add a recipe to `src/content/recipes.ts` with its ID, name, cost, seconds and required capability. Recipes run in reachable `craft` slots and charge once. A new recipe automatically joins the queue UI and configuration editor. Inputs/outputs currently use gold and item counts; complex input chains require a new shared implementation.
4. Open Debug or Room Layout Studio, choose the type under **Test dwarf type**, then **Add test dwarf**. The catalog is generated from the definitions and spawns level 1. Its attraction message uses required services and shared bed/food support. Walking speed and per-level statistics/times appear in Game configuration. Capabilities/names/appearance changes apply on spawn or page reload; runtime settings do not rewrite existing job capability lists.
5. Verify movement, eating, sleeping, work with/without the required capability, unavailable rooms and cancelled work. Check sequential training, partial-progress retention, one level per visit, cooldown release and final-level stopping. Successful melee hits share training XP; check combat during cooldown, retained surplus and the cap. Ordinary work grants no XP. Verify actual work and combat changes from level rows, preserved wounds on health growth, and the distinction between `fight` and `defend`.
6. For a new appearance, extend `src/view/residents.ts` and keep geometry/animations separate from the simulation. For an unimplemented behavior, add its shared service/job with explicit eligibility, reservation, cancellation and checks. A definition alone cannot implement a new mechanic, and familiar art must not confer extra abilities.
7. Update `characters.md`, record checks in the development plan, run focused tests plus the build, browser playtest, and commit.

Example resident entry:

```ts
{
  id: 'artisan', name: 'Artisan', names: ['Ada', 'Dagna'], color: '#738c96',
  speedMultiplier: 1, appearance: 'braids',
  capabilities: ['craft', 'defend'], attractionServices: ['craft'],
  levels: [
    {level: 1, trainingSeconds: 0, health: 85, damage: 5, attackSeconds: 1.5, workMultiplier: 1},
    {level: 2, trainingSeconds: 25, health: 100, damage: 6, attackSeconds: 1.5, workMultiplier: 1.1},
    {level: 3, trainingSeconds: 40, health: 115, damage: 7, attackSeconds: 1.5, workMultiplier: 1.2},
    {level: 4, trainingSeconds: 60, health: 130, damage: 8, attackSeconds: 1.5, workMultiplier: 1.3},
    {level: 5, trainingSeconds: 90, health: 150, damage: 10, attackSeconds: 1.5, workMultiplier: 1.4}
  ]
}
```

The example uses provisional Engineer-like balance. Keep approved shipped values in the owning definition and the central [character level tables](characters.md#character-levels-and-training). `characterLevel` and `maxCharacterLevel` resolve the definition; `characterStats`, `nextCharacterLevel`, `workRate`, `levelUp` and `syncCharacterHealth` in `src/game/progression.ts` are the shared integration points. Do not restore global per-upgrade multipliers or award XP from unrelated jobs. Use gainExperience for training and successful melee hits.

## Add a manufactured defense

Add a stable recipe in `src/content/recipes.ts` and a matching entry in `src/content/defenses.ts`. Names, prices, work times, stock, placement choices and numeric configuration come from these registries. Door tiers reuse the door behavior and model; keep their price, work time and health increasing. A new trap behavior needs an explicit case in `src/game/defenses.ts` and matching geometry/animation in `src/view/defenses.ts`. `src/game/doors.ts` contains shared passage and sight queries, independent of rendering.

Use the actual Workshop queue and `placeDefense` service, including in debug examples. Verify invalid placement does not consume stock, paid/free room modes do not waive manufacturing, and fixtures cannot overlap rooms, wall plans, the Hearth or its treasury approach. Cosmetic furniture adds no placement or sight restriction. Exercise dwarf routes and needs after toggling doors, occupants stepping clear, sight blocking, enemy breaches, trap targeting, damage, pinning and cooldown. Spikes and bolts reset automatically without Engineer work or ammunition. Keep runtime health/cooldowns on the world and all text in the sidebar. `tests/defenses.test.ts` and Debug's defense yard provide focused checks; update the current inventory and affected designs in the same chunk.

## Verified boundaries and current limits

`tests/content-extension.test.ts` exercises temporary room and dwarf definitions with renamed kinds and reused models. Keep its regressions aligned with tile-based capacity, shared food support, layout, free construction, reclaiming, attraction, needs, crafting and exact cost. Temporary definitions are removed after each check; they are not new shipped content. Verification for the current changes belongs in the development record.

Room services, furnishing models, summaries and the debug dwarf catalog are driven by definitions. Look data is alongside the room definition. New rooms using existing services and models need only content/art additions, not simulation refactors.

There is no general public mod loader or editor. Room service capacity comes from floor area and the tunable per-tile value; cosmetic objects have no gameplay role. New content still needs balance, real-access and layout checks. Door/trap placement and autonomous combat face authored encounters/raids and debug raiders. Paid Miner recruitment and physical wages are implemented. Hearth damage, guard duty, repairs, departure and campaign progression remain pending. Check the current inventory for verification status of additions.

## Add a notification

Notifications have stable string keys, independent of UI layout. Add a collector to `notificationSources` in [src/content/notifications.ts](src/content/notifications.ts) for a continuing condition. It returns an empty array when resolved, or one `NotificationInput` for each grouped problem. The simulation collects these every tick, including during batched development stepping; the sidebar also refreshes paused worlds. Collectors must be cheap, read-only world queries, without pathfinding or hidden-location disclosure.

For example, a prototype stock notice can reuse the existing icon and actions:

```ts
{
  id: 'bolt-stock',
  collect: w => w.outputs['bolt-trap'] > 0 ? [{
    key: 'stock:bolt-trap', category: 'Workshop', icon: 'bolt-trap',
    title: 'Bolt traps available', message: 'Your Workshop has finished bolt traps.',
    priority: 'info',
    action: { kind: 'panel', value: 'defenses', label: 'Open defenses' },
  }] : [],
}
```

Use a stable `key` for the same problem. Change `episode` only for a meaningful escalation/new wave, not every count or timer update. An absent condition resolves; recurrence raises a new report. Repeated updates preserve dismissal. `sources` accepts live resident/enemy IDs or known point coordinates; omit it for a report without a location, or use an empty array when an origin is still unknown. Never put concealed encounter names or coordinates into a report. The shared service revalidates targets before navigation. `locateLabel` can name the source action; `action` can open a sidebar `panel` or select a construction `tool`.

For a one-time event, call `notify(world, { ...report, event: true })` from the gameplay transition. Emit once per event; it remains until dismissed or aged out of bounded history. Natural recruitment demonstrates this in `src/game/recruitment.ts`, recording the first recruited type once per area. New types need no notification UI registration. Existing icon IDs work immediately; unknown artwork uses the shared fallback until an icon is added.

The lifecycle, history, priority and quiet intervals are in [src/game/notifications.ts](src/game/notifications.ts). The only renderer is [src/ui/messages.ts](src/ui/messages.ts), styled in `src/ui/notifications.css`. Add simulation tests for meaningful event/episode rules and use `npm run verify -- notifications --browser=notifications` for the focused checks. That browser check includes a temporary content-only type to verify extensibility, plus screenshots in ignored `test-results/notifications/`.
