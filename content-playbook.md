# Adding rooms and dwarf types

This is the implementation playbook for the browser prototype. Read the relevant room/character design first. Stable IDs are the links between content and systems; names are presentation. The examples below use existing services and models. They do not introduce a new simulation framework.

Use [Development tools](development-tools.md) for shared reproduction scenarios, browser commands, job diagnostics and focused verification. Job selection, validation and execution have separate modules under `src/game/jobs/`; continuous movement lives in `src/game/movement.ts`.

## Required status update

For every room or dwarf addition and every related integration, update the [current implementation inventory](development-plan.md#current-implementation-status) in the same completed chunk. Record normal versus debug-only availability, implemented behavior and remaining dependencies. Update affected design wording and record verification in the development record. A definition, concept image or completed milestone alone is not evidence that the content is playable.

## Add a room using existing services

1. Add one `RoomDefinition` to `src/content/rooms.ts`. Use a unique lowercase ID, display name, minimap color, cost, description and `implemented:true`. Add a `look` with icon ID, floor color, trim color and motif. Existing motifs are `treasure`, `dormitory`, `kitchen`, `workshop`, `training`, `library`; a generic motif is also available. Reuse an icon while prototyping or add original SVG artwork in `src/ui/icons.ts`.
2. Define each furnishing with a unique kind within the room, whole-tile width/depth, service and capacity. `model` selects reusable artwork independently of the kind: `chest`, `bed`, `mushrooms`, `stove`, `table`, `barrel`, `bench`, `anvil`, `assembly`, `dummy`, `weights`, `lectern`, `bookshelf`. Omitting model uses kind. Physical access and collision follow the footprint; match the model's intended dimensions (for example a bed is 1×2). A new visual model is an additive drawing case in `src/view/furnishing-models.ts`; an unknown model shows a neutral prototype block.
3. Use an existing service from the table below. Construction, refunds, free construction, connected components, navigation, automatic furnishing, reservations and stock handling are shared. Do not add room-name checks to these systems.
4. Start the game. The room automatically appears in the room grid, Room Layout Studio catalog, and room configuration tab. Select it in the studio and load the example shapes. No extra sidebar registration is required.
5. If it attracts a dwarf, reference its services in that dwarf's `attractionServices`; services are not exclusive to one room or type. Automatic specialist arrivals use accessible service capacity and spare settlement support. Enable recruitment explicitly for a normal world; keep it disabled in isolated room layouts and service tests unless recruitment is the behavior being tested.
6. Follow every layout case in [the room checklist](room-development-checklist.md), including paid/free construction, expansion, reclaim/refund, stored contents, blocked entrances, multiple users and walls planned beside the room. A one-tile room can have zero usable facilities.
7. Add a focused service regression and browser playtest. Update the relevant design, development plan and this playbook if a new shared service was introduced. Run `npm test`, `npm run build`, review `git diff --check`, commit, and leave `npm run dev` running.

Example room entry (copy into the exported definitions array, choose approved names/art):

```ts
{
  id: 'small-vault', name: 'Small Vault', color: '#987641', cost: 10,
  description: 'Compact gold storage.', implemented: true,
  look: {icon: 'treasure', floor: '#655b49', trim: '#c3a15c', motif: 'treasure'},
  furnishings: [{kind: 'vault-box', model: 'chest', width: 1, depth: 1,
    capacity: 100, service: 'storage'}]
}
```

| Existing service | Shared behavior / dependencies |
|---|---|
| `storage` | Gold hauling, spending, capacity, displaced contents; no worker required. |
| `rest` | One assigned resident per physical bed; automatic needs and rest. Keep capacity 1. |
| `growing` | Timed ingredient stock. |
| `cooking` | Timed meals; consumes growing stock within the same edge-connected room. |
| `brewing` | Timed ale stock in the room. |
| `dining` | One eater per physical table; needs reachable cooking stock in the same room. Keep capacity 1. |
| `craft` | One worker per station; queued recipe capability controls eligibility and inputs. Keep capacity 1. |
| `training` | One trainee per station; all resident types can train. Progress belongs to the resident and survives room changes. Keep capacity 1. |
| `research` | One researcher per station and one worker per research order; requires the `research` capability. Progress and prepared spells belong to the world. Keep capacity 1. |

Growing, cooking, brewing and dining can belong to any room ID. Food stock salvaged by reclaiming refills replacement facilities with the same service. Removed treasure stock remains loose gold for hauling. Completed crafted items live in the shared output inventory; a removed station does not erase them.

Count distinct accessible work squares when reporting simultaneous training/research capacity; neighboring furnishings may share an approach. The scheduler reserves both the furnishing and its work square. For new spells, add definitions in `src/content/spells.ts`; the sidebar and numeric configuration are generated from them. A new spell effect needs a corresponding simulation case in `src/game/research.ts`. Keep research/prepared state on the world so room changes preserve earned work.

## Add a dwarf using existing behaviors

1. Add one `CharacterDefinition` to `src/content/characters.ts`: unique ID, name, nonempty names list, color, speed multiplier, appearance, capabilities and attraction services. `helmet`, `braids`, `warrior` and `runesmith` are reusable models; any can be used by any type. Do not branch gameplay on the type's name or appearance.
2. Select existing capabilities: `mine`, `haul`, `claim`, `reinforce`, `buildWall`, `research`, or a capability named by a crafting recipe. Needs, movement and training are shared automatically; they do not need capability flags. A specialist can have several capabilities.
3. For production, add a recipe to `src/content/recipes.ts` with its ID, name, cost, seconds and required capability. Recipes run at reachable `craft` stations and charge once. A new recipe automatically joins the queue UI and configuration editor. Inputs/outputs currently use gold and item counts; complex input chains require a new shared implementation.
4. Open Debug or Room Layout Studio, choose the type under **Test dwarf type**, then **Add test dwarf**. The catalog is generated from the definitions. Its attraction message uses required services and shared bed/food support. Per-type speed is in the Dwarfs configuration tab. Capabilities/names/appearance changes apply on spawn or page reload; runtime settings do not rewrite existing job capability lists.
5. Verify movement through narrow furnished rooms, eating, sleeping, work with/without the required capability, unavailable facilities and cancelled work. Verify it does not acquire abilities merely from using a familiar model.
6. For a new appearance, extend `src/view/residents.ts` and keep geometry/animations separate from the simulation. For a new behavior such as combat, add its shared service/job with explicit eligibility, reservation, cancellation and tests. A definition alone cannot implement an unimplemented mechanic.
7. Update `characters.md`, record checks in the development plan, run focused tests plus the build, browser playtest, and commit.

Example resident entry:

```ts
{
  id: 'artisan', name: 'Artisan', names: ['Ada', 'Dagna'], color: '#738c96',
  speedMultiplier: 1, appearance: 'braids',
  capabilities: ['craft'], attractionServices: ['craft']
}
```

## Add a manufactured defense

Add a stable recipe in `src/content/recipes.ts` and a matching entry in `src/content/defenses.ts`. Names, prices, work times, stock, placement choices and numeric configuration come from these registries. Door tiers reuse the door behavior and model; keep their price, work time and health increasing. A new trap behavior needs an explicit case in `src/game/defenses.ts` and matching geometry/animation in `src/view/defenses.ts`. `src/game/doors.ts` contains shared passage and sight queries, independent of rendering.

Use the actual Workshop queue and `placeDefense` service, including in debug examples. Verify invalid placement does not consume stock, paid/free room modes do not waive manufacturing, and fixtures cannot overlap rooms, wall plans, furnishings or access. Exercise dwarf routes and needs after toggling doors, occupants stepping clear, sight blocking, enemy breaches, trap targeting, damage, pinning and cooldown. Spikes and bolts reset automatically without Engineer work or ammunition. Keep runtime health/cooldowns on the world and all text in the sidebar. `tests/defenses.test.ts` and Debug's defense yard provide focused checks; update the current inventory and affected designs in the same chunk.

## Verified boundaries and current limits

`tests/content-extension.test.ts` temporarily registers a new room ID with renamed furnishing kinds and reused models; it verifies food production, layout, icon/floor identity, free construction, reclaiming and supply preservation. A second test registers a new dwarf and recipe capability and verifies attraction, movement, food, rest, crafting and exact cost. These definitions are removed after each check; they are not new shipped content.

The audit removed the Kitchen-ID gate from food production, room-ID gates from furnishing models and summaries, and the fixed Engineer debug-spawn control. Look data is now alongside the room definition. New rooms using existing services and models need only content/art additions, not simulation refactors.

There is no general public mod loader or editor. Bed/table/craft/training/research capacity means one physical user slot, not multiple simultaneous users in one model. Room service support is based on reachable facilities, not painted area. New content still needs balance and layout checks. Door/trap placement is implemented; debug raiders exercise damage, pinning and door breaking. Dwarf combat, natural encounters/raids, Hearth damage, guard duty, repairs, paid Miner recruitment, wages, departure and campaign progression remain unimplemented. Check the current inventory for verification status of additions.
