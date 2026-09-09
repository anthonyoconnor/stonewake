# Spells

## Design and implementation status

The catalog below is implemented in the browser prototype. Its numerical values remain provisional starting points for playtesting.

The campaign introduces the Library, Runesmith and research catalog at Crystal Divide, following the [campaign brief](levels.md#campaign-brief-and-progression). Availability permits research; it does not supply charges or completed knowledge. Research and casting use the same arrival restrictions, including free construction sessions. Completed research travels onward as paused, unprepared orders; restart restores knowledge carried into the current area. Debug fixtures retain unrestricted access.

Create Stonehand is an innate Hearth action available from the start for 50 gold + 25 per living Stonehand. It needs no Library, research, preparation, food or bed capacity. Each cast assembles one Stonehand with an open Hearth route, a free claimed arrival square and enough shared gold. Failed casts spend nothing. Legacy Summon Miner remains callable only by development fixtures.

Hearth Prospect and global Hearth Haste have been removed. The catalog uses targeted casting, individual effects and the shared Library research/preparation service. Offensive spells work against authored encounters/raids and debug-spawned enemies.

Related rules: [Library research](rooms.md#training-room-and-library-prototype-rules), [spell interface](gameplay-interface.md#spells), and [implementation inventory](development-plan.md#current-implementation-status).

## Spell catalog

Research and preparation times are seconds of active work by one Runesmith at normal speed, excluding travel, meals and rest. Research unlocks the spell and supplies its first charge. Preparation replenishes that charge after each successful cast. Costs are shared gold paid per cast; research and preparation have no additional gold fee.

| Spell / stable ID | Role and target | Initial research | Repeat preparation | Cast cost | Effect and duration |
|---|---|---:|---:|---:|---|
| **Create Stonehand** / `summon-stonehand` | Mechanical worker; automatic Hearth arrival | None | None | 50 + 25 × living Stonehands gold | Assembles one fragile Stonehand; no support slots required. |
| **Haste** / `dwarf-haste` | Support; one living friendly dwarf | 45 s | 20 s | 25 gold | +50% movement, work and attack speed for 20 s. Does not speed up hunger, fatigue or other needs. |
| **Slow** / `enemy-slow` | Defensive control; one living enemy, including strong enemies | 60 s | 25 s | 30 gold | -40% movement and attack speed for 15 s. Does not reduce damage per hit. |
| **Stoneguard** / `stoneguard` | Defense; one living friendly dwarf | 60 s | 30 s | 35 gold | A stone shield absorbs damage equal to 40% of the dwarf's maximum health. Ends when depleted or after 20 s. |
| **Thunder Rune** / `thunder-rune` | Offense; a visible floor point with an enemy in the affected area | 90 s | 35 s | 50 gold | Deals 30 damage to each enemy within a 1.5-tile radius and stuns them for 2 s. No friendly fire or terrain/structure damage. |
| **Runic Barrier** / `runic-barrier` | Defense; one empty, visible claimed floor tile | 75 s | 35 s | 40 gold | Blocks movement by dwarfs and enemies for up to 15 s; enemies can destroy it. Starts with 150 health. |
| **Mending Rune** / `mending-rune` | Recovery; one wounded, living friendly dwarf | 60 s | 30 s | 35 gold | Heals 4% of maximum health per active healing second, up to 40% total. Damage pauses healing for 3 s after the latest hit. Expires after 20 s even if some healing remains. |
| **Rune of Reckoning** / `rune-of-reckoning` | Offense; one living enemy | 75 s | 30 s | 40 gold | Target takes 30% extra damage from dwarf attacks for 15 s. Spell and trap damage receive no bonus. |
| **Call to Arms** / `call-to-arms` | Rally; one visible, walkable floor point | 45 s | 20 s | 25 gold | Calls all fighting dwarfs throughout the stronghold to the point for 45 s, including travel time. They gather within 3 tiles and fight autonomously to defend the area. |

[Character levels](characters.md#character-levels-and-training) define each dwarf type's current health, damage, attack interval and work rate. Training applies those statistics to combat as well as work. The test Raider has 120 health and attacks for 20 damage once per second. These combat values remain provisional. Health-based buffs scale with the target's maximum health. Stoneguard absorbs incoming damage and passes any excess through to health; there is no separate armor-mitigation model yet.

Friendly support spells also accept Stonehands: Haste accelerates their work, Stoneguard absorbs damage and Mending Rune repairs health. Call to Arms only calls fighting dwarfs.

## Research and casting rules

- Except for the innate Create Stonehand action, a functional Library and an available research-capable Runesmith are needed to research or replenish a spell. Initially allow all catalog research choices without a prerequisite tree; the longer research times make the larger tactical effects later investments. Campaign unlocks remain open.
- Retain one prepared charge per spell for the whole stronghold. Different spells can be researched or prepared in separate reachable Library service slots, with capacity set by room floor area. Researchers cannot combine on the same order. Pausing or losing a slot retains progress, unlocks and prepared charges; decorative desks and shelves have no gameplay effect.
- A successful cast consumes the charge and gold, then queues preparation immediately. There is no separate cooldown; repeat preparation is the reuse gate and can benefit from research-speed bonuses. Prepared spells can still be cast without an active researcher.
- Casting is instant after valid target selection. Dwarf buffs target a currently visible friendly dwarf; hostile spells target currently visible enemies. Use the world's visibility rules, never camera position or unexplored terrain. Casting has no additional distance limit from the Hearth or researcher, allowing support at a distant explored battlefront.
- Cancelled, unaffordable or invalid casts spend neither gold nor the prepared charge. Check target validity again on confirmation. Full-health dwarfs cannot receive Mending Rune; Thunder Rune needs at least one visible enemy within its radius and unobstructed sight from the blast center. Solid walls block the blast.
- The same ongoing spell cannot stack or refresh on the same target; reject that cast. Different spells may coexist. Haste changes action rates without shortening buff durations, healing pauses or stun timers. Strong enemies remain valid Slow targets; any future boss resistance must be explicit in its definition and shown in the sidebar.
- Mending Rune cannot resurrect or exceed maximum health. Healing ends at full health, at its total allowance, on death, or on expiry. It does not order the dwarf to retreat; combat and movement remain autonomous.
- Runic Barrier must fit on a clear claimed floor tile with no resident, enemy, door, trap, construction plan, active job's working position or protected Hearth treasury approach. Cosmetic furniture creates no separate placement exclusion. It may temporarily seal a passage. It grants no room capacity or permanent terrain, cannot be repaired, and leaves the original floor intact on expiry or destruction. Permit only one active barrier per stronghold and reject another cast while it remains. Navigation must respond to both placement and removal.

## Call to Arms behavior

Call to Arms is the spell version of the shared area rally. It calls every living dwarf with the `fight` capability, regardless of distance from the target. Warriors are the current responders; future fighting types join through that capability. Miners, Engineers and Runesmiths have `defend` for weaker adjacent self-defense and continue their normal activities unless an enemy is already within melee reach. Training improves their defined statistics but never grants pursuit or rally response.

- Responders interrupt ordinary work, training, eating and resting, releasing any occupied service reservations. They walk by normal routes, without teleporting or gaining a speed bonus. Needs continue at their normal pace. Hunger or energy below 10% temporarily releases the rally until needs recover above 30% and the current meal/rest ends. Nearby attackers still trigger self-defense. Guard scheduling and emergency retreat remain future combat work.
- The target may be claimed or unclaimed visible floor, but must be walkable and reachable by at least one eligible fighter. With no eligible reachable fighter, reject the cast without charge. A fighter whose route is blocked reports that status in the sidebar and rejoins if access becomes available. New eligible arrivals also respond during the active period.
- Fighters gather in accessible space within a 3-tile radius instead of trying to occupy one point. They autonomously engage enemies in that area, defend themselves while approaching, and return toward the rally when enemies leave the area. The spell does not reveal fog or let fighters pass through walls, doors or barriers.
- Only one rally may be active per stronghold. Reject another Call to Arms while it is active; the player can dismiss it early in the sidebar, without a refund, then cast at another point once the next charge is prepared. Preparation starts on casting as usual.
- The 45-second timer starts on casting, not on arrival. On expiry or dismissal, release the rally assignment and resume ordinary autonomous priorities, including guard duty and needs. Fighters still respond to immediate danger; expiry does not force them to abandon self-defense.

These response priorities, radius and timing are provisional. The agreed behavior is that the spell calls all fighting dwarfs to a selected point for a limited period, without individual movement orders.

## Controls, verification and remaining work

All nine player spells now have individual [concept sheets and model notes](concept-art/spells/README.md). The [spell/trap/Hearthstone comparison room](arcana-overhaul.md#permanent-comparison-room) retains their original effects beside the current models with synchronized preview states. Create Stonehand's assembly effect runs only after a successful purchase at the actual arrival square; spell costs and lifetimes remain as defined above.

Use the existing left-sidebar Spells panel for research, costs, readiness and targeting, with right-click or Escape cancelling target selection. Selected-unit details show health, shield amount and effect time remaining in the sidebar. Use restrained physical effects such as stone armor, rune glows and thunder impacts in the world; do not add floating text, numbers, health bars or timers.

Open **Spells → Library research**, choose a spell and Research. Once ready and affordable, click its enabled icon, then click a valid dwarf, enemy or floor point. Create Stonehand activates immediately on its icon. Casting returns to excavation after success; right-click or Escape cancels targeting without charge. Unit selection and successful targeted casts show level, health, combat/work statistics and effects in the sidebar. Spell targeting and enemy visibility require current line of sight within the normal sight radius of a living dwarf or the Hearth; camera movement does not grant sight. Haste multiplies the target's level-defined work rate and accelerates attacks and active training practice; it does not accelerate personal training cooldown, effect timers or needs.

Definitions and tunable effect values live in [spell definitions](src/content/spells.ts), with research and casting in [research](src/game/research.ts), effect timers/damage in [spell effects](src/game/spell-effects.ts), and fighter response in [combat](src/game/combat.ts). **Game configuration** exposes research/preparation costs and effect values; active effects retain their cast-time values. The rally uses a ground rune; remaining time, responding/unreachable counts and Dismiss stay in the sidebar. Barrier health and duration also stay in the spell panel.

**Debug → Spell test yard** constructs working Library, food and rest facilities with test residents and prepared charges. It offers pause/resume, preparation, enemy spawning, wounding, reset and return controls. Debug preparation is an explicit shortcut; normal research and repeat preparation still use actual Runesmith work. The yard is separate from the stronghold in memory.

Simulation checks cover exact charges, invalid targets, individual speed, research reuse, Slow and attack cadence, damage-source-specific Reckoning, shields, interrupted healing, blast obstruction, barrier occupancy/construction/path updates, rally responder eligibility, reservations, blocked routes, critical needs, new arrivals, dismissal and expiry. Browser checks cover targeted casts, health/cost feedback, visual effects and live combat. All ten enemy types use the shared spell/control rules described in [Enemies](enemies.md). Campaign travel retains completed research knowledge but resets prepared charges and local progress; carried spells start paused and require Library preparation after Resume. Guard duty and retreat remain deferred; no new mana, persistence or direct troop orders are introduced.
