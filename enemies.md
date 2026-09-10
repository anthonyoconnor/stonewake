# Enemies

All ten models have subsequently been rebuilt and individually compared with their concept sheets. See the [graphics overhaul](graphics-overhaul.md) for character-specific refinements, retained original/refined pairs and rendering limits.

All ten creatures in the [enemy concept gallery](concept-art/enemies/README.md) are implemented as editable definitions in [src/content/enemies.ts](src/content/enemies.ts). The provisional values below establish distinct tactical roles; M19 still owns campaign-wide balance.

| Region          | Enemy               | Health | Role and behavior                                                                                                                                                                                                                                           |
| --------------- | ------------------- | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upper workings  | Goblin Raider       |    120 | Baseline melee pressure: 20 damage each second, 1.2 squares/second. Scavenged shield, long ears and hooked blade.                                                                                                                                           |
| Upper workings  | Tunnel Burrower     |    170 | Seeks a physical route, excavating eligible earth if no open or door-breaking route exists. Broad claws and overlapping earthen plates.                                                                                                                     |
| Fungal caves    | Cave Spider         |     85 | Fast melee hunter; spits a web within three squares every seven seconds. Web deals 4 damage and slows the victim's movement, attacks and work by 50% for four seconds. Eight jointed walking legs, a separate abdomen and restrained turquoise markings.    |
| Fungal caves    | Spore Brute         |    220 | Slow melee attacker; a spore pulse every six seconds deals 12 damage and slows dwarfs by 30% for three seconds within two squares of clear sight. Fungal crown, root limbs, shelf caps and puffballs.                                                       |
| Ancient halls   | Restless Guard      |    150 | Absorbs 35% of dwarf melee and trap damage. Spell damage bypasses armor. Exposed ribs and skull, corroded armor, old shield and chipped sword.                                                                                                              |
| Ancient halls   | Ancient Sentinel    |    310 | Slow heavy melee attacker: 30 damage every two seconds, tripled against doors and runic barriers. Slab shoulders, inset ancestral mask, bronze seals and massive fists.                                                                                     |
| Crystal caverns | Crystal Elemental   |    150 | Fires 23-damage crystal shards every 1.8 seconds at visible dwarfs or the Hearth within five squares. Stops to shoot when in range. Faceted geode body and angular crystal limbs.                                                                           |
| Crystal caverns | Crystalback Stalker |    135 | Prioritizes exposed dwarfs with the lowest health fraction. Charges across clear ground from 1.5–4 squares at 2.3 times speed and doubles its first bite. Seven-second charge cooldown. Pale four-legged reptile with swept crystal spines and a long tail. |
| Volcanic depths | Cinderling          |     75 | Quick ranged nuisance: 12-damage embers within three squares every 1.2 seconds. Can cross unbridged lava. Cracked coal body, furnace mouth and a compact flame crest.                                                                                       |
| Volcanic depths | Deepmaw             |    350 | Heavy melee predator: 40 damage every two seconds. Nearby dwarfs in front of its bite take 60% secondary damage. Double damage against doors/barriers. Four heavy legs, broad tusked jaw, armored ridges and thick tail.                                    |

## Shared combat and control

Enemies use the same continuous movement and square terrain as dwarfs. They select living, physically visible targets within six squares, otherwise approach their authored target near the Hearth. Workers retain adjacent self-defense; Warriors retain pursuit and rally. Melee and ranged attacks share their definition's cooldown, lengthened by Slow. Adjacent dwarfs take priority over the Hearth. Natural encounter members can destroy the Hearth; debug attackers keep their test targets.

Ranged attacks require clear sight. Intact terrain, shut doors and runic barriers stop projectiles; water, lava and chasms permit sight. Furniture remains cosmetic. A shot applies damage when released and its short projectile animation communicates that hit; it is not a separate physics object. Projectiles, spores and cleaves never damage enemy allies. Spore pulses and cleaves also require clear sight to each dwarf they hit.

Every species triggers spike and bolt traps, accepts Slow, Thunder's stun, Reckoning and spell damage, and can be defeated by dwarfs. Stoneguard and Mending continue to protect/recover dwarfs against their attacks. No species has an undocumented control immunity. Armor only modifies the Guard's incoming melee/trap damage; Reckoning still multiplies dwarf damage before that reduction. Web and spores share the existing temporary effect system and expire without permanent penalties; overlapping slows use the first active slow rather than multiplying together.

Living enemies respect discovery separately from navigation: they can use authored hidden routes, but models and inspection require actual dwarf/Hearth sight. Death stops actions, clears effects, credits encounter clearing and plays a brief falling pose before the body disappears. Enemy health, identity, behavior and temporary effects stay in the sidebar; no floating world labels or bars are added.

## Terrain rules

Burrowers prefer an existing traversable route, then a route that breaks doors/barriers, then a costed cardinal excavation route. They physically work on the adjacent blocking tile for six seconds of dirt or ten seconds of rock. Reinforcement triples that time. Slow also slows excavation. Completed digging leaves unclaimed floor, invalidates routes and clears stale wall/mining plans. It does not reveal unexplored terrain to the player or create gold.

Bedrock, gold veins, permanent gem columns, core/onward Hearth squares, water, lava and chasms cannot be tunneled through. This preserves resource conservation and indestructible boundaries. Burrowers can remove player-built rock walls and their reinforcement. Every other enemy is stopped by intact terrain.

Only Cinderlings can walk directly on lava. Other species need completed bridges over lava/water. Water and chasms remain impassable to every species without an allowed bridge, and chasms remain unbridgeable. Creature art does not add flight, extra terrain layers, or bridge destruction. Large creatures keep the common collision footprint; their wider/longer silhouettes communicate weight without imposing new corridor-width rules.

## Encounter authoring and verification

### Living habitats and territorial groups

Every natural encounter receives local movement, including older Free Play camps without an explicit `habitat`. `src/content/habitats.ts` owns editable species profiles and regional defaults. An encounter can override movement radius, pause duration, speed fraction and patrol waypoints; campaign camps preserve each species' profile instead of applying one movement pattern to their entire group.

| Creature | Natural movement |
|---|---|
| Goblin Raider | Brisk circuits through successive patrol sectors, with short lookout pauses |
| Tunnel Burrower | Short foraging excursions followed by returns to its den |
| Cave Spider | Quick, irregular short darts around the nest with brief pauses |
| Spore Brute | Slow, close excursions among the fungi, resting between trips |
| Restless Guard | Measured patrol circuits with longer watch pauses |
| Ancient Sentinel | Heavy, short inspections of nearby watch posts, returning to its station |
| Crystal Elemental | Wider watch-post inspections with pauses to survey the cavern |
| Crystalback Stalker | Slow perimeter prowling through closely spaced compass sectors |
| Cinderling | Fast, varied roaming with very brief pauses, including traversable lava |
| Deepmaw | Lumbering excursions and returns to its lair, with long rests |

Local movement uses ordinary traversable paths within its territory, without excavating, breaking doors, moving through bedrock or discovering terrain. Occupied destinations are skipped and creatures choose another route shortly after meeting an ally. A released raider with no route to its target resumes local movement while continuing to check for an approach. Combat takes priority and retains existing species abilities, speeds and warning rules. Explicitly stationary debug samples remain controlled by their test fixtures.

Habitat activity is separate from pressure. `pressure: 'territorial'` groups defend their authored area after the normal discovery warning, attack intruding residents, and return to local activity when targets leave. They do not march toward the settlement or regenerate after being cleared. `pressure: 'raid'` (the compatibility default) sources use their authored activation, warning, roster and cadence, releasing their inhabitants toward the Hearth or bringing in a physical entrance wave. A moving inhabitant becoming visible counts as discovering its source, while concealed activity remains absent from the normal sidebar and never reveals terrain.

An inhabitant attacked during its warning can defend itself locally immediately. This response never releases a settlement raid early or lets a warning-phase burrower breach earth. Full campaign playtesting exposed the otherwise exploitable behavior of motionless enemies accepting attacks throughout the warning; the local-defense rule keeps the warning and makes contact credible.

Each recurring source waits until its whole previous group is defeated, then takes its configured recovery interval and a fresh full warning. A blocked entrance retains only one pending wave; each species must have a physical route (including eligible burrowing or lava traversal). Claiming an authored entrance permanently suppresses it, without deleting living attackers. Several sources can act independently, allowing organized patrol pressure, burrowing flanks and ranged/lava challenges at different timings. Not every habitat raids: local fungal nests and ancient guardians can instead guard optional ruins and resource approaches. Gold/gems and bedrock remain protected from burrowing.

`npm run verify -- habitats` checks repeated pre-contact movement for all ten species, actual campaign/regional terrain, legacy Free Play roaming, sentry returns, concealed activity, local defense/return, independent recurring warnings/recovery, blocked waves, burrowing access and suppression, plus existing enemy/encounter combat regressions. Add `--browser=habitats` with the local server running to check visible moving models in five full-level previews. Concrete map pressure and routes are owned by [Levels](levels.md).

Encounter definitions accept `roster`, one stable enemy ID per authored `positions` entry. Omitting it preserves Raider-only sources. Unknown IDs or mismatched counts are rejected. Mixed camps/nests create their inhabitants on actual unclaimed spawn squares, remain dormant until their declared trigger/warning, and clear after the group is defeated. Mixed raid waves wait for every member's physical approach; they neither teleport nor accumulate while blocked. Lava-capable and digging members use their own route abilities in that check. Source claiming stops reinforcements through the existing rules.

`enemy-roster` / **Enemy Roster Galleries** is a paused development scenario with five regional pairs, normal mixed encounter warnings, test Warriors, actual traps and an unbridged Cinderling approach. Use the Debug enemy type selector to exercise a particular species elsewhere. Ordinary campaign placements reference the same roster definitions, rather than separate debug-only behaviors.

The ordinary `region-upper`, `region-fungal`, `region-ancient`, `region-crystal` and `region-volcanic` scenarios each begin with the normal three Miners, starting gold, gold seams, a renewable gem, local recruitment and a concealed enemy-held onward stone. They supply no rooms, Warriors or defense stock. Their respective layouts introduce a reinforced-rock shortcut, branching nest chambers, stone pillars/chokepoints, crystal sight breaks, and a lava band requiring bridges for dwarfs and the Deepmaw. These regional standalone maps expose every species through normal settlement play without extending the authored campaign's route or endpoint.

Run `node --test tests/enemies.test.ts` for all-ten movement, attack, defeat, controls, trap damage, Hearth attacks and mixed encounter integration, plus targeted ranged, web, spores, armor, charge, cleave, breach, reinforced-earth, bedrock/resource and hazard checks. Run `node scripts/enemies-browser.mjs` with the local server active for actual rendering, ten visible models, anatomical counts, five regional closeups, reverse-angle rendering, natural mixed combat and effect integration. Generated screenshots/reports go to ignored `test-results/m17-enemies`.

Models are procedural geometry guided by each front/back/game-view concept, not imported concept sheets. Their rigs include blended movement/turning, idle weight, attacks, burrowing, recoil and defeat, with ranged projectiles and sparse spore effects. Facets, bevels, broad equipment forms and material variation support recognition at normal play distance. Reduced-motion settings suppress decorative pulses, bobbing, crest flicker and flying effect ornaments while preserving useful poses. Further art-direction iteration is possible; the agreed ten identities and their implemented actions are covered.

M24 measured isolated and mixed encounters before tuning. Hounds retain their early balance; Deepmaw's existing bite rises from 35 to 40 damage (its 60% cleave fraction is unchanged). Six hounds can still overwhelm a lone heavy creature, but lose to the representative volcanic group and armored ancient group. Trained Warriors, manufactured traps and Library spells provide viable responses. See [measured matchups](characters.md#combat-balance-and-test-room-m24). Group composition and preparation matter; this does not claim hounds can never win with greater numbers.
