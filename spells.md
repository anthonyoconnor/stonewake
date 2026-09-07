# Spells

## Design and implementation status

The catalog below records the user-approved spell concepts. Their numerical values and detailed restrictions are provisional starting points for playtesting. This is a design update, not an implementation milestone.

The playable prototype still contains only Hearth Prospect and Hearth Haste. The new catalog is the intended direction for useful offensive, defensive, and individual support spells. Individual Haste is intended to replace the global Hearth Haste when implemented; Hearth Prospect's retention or replacement remains undecided. No existing spell is removed by this document.

Related rules: [Library research](rooms.md#training-room-and-library-prototype-rules), [spell interface](gameplay-interface.md#spells), and [implementation inventory](development-plan.md#current-implementation-status).

## Current prototype spells

Hearth Prospect takes 32 seconds of initial research and 12 seconds to prepare again, costing 20 gold per cast. It extends normal sight from the Hearth to 16 tiles, respects solid walls, and spends nothing if no new terrain can be revealed. Hearth Haste takes 40 seconds initially and 16 seconds to prepare again, costing 30 gold per cast. It adds 35% work speed for 30 seconds without changing walking or needs, and cannot stack with itself. Both currently cast directly from the sidebar without a world target. Live values are defined in [spell definitions](src/content/spells.ts) and [shared tuning](src/content/tuning.ts).

## Proposed catalog

Research and preparation times are seconds of active work by one Runesmith at normal speed, excluding travel, meals and rest. Research unlocks the spell and supplies its first charge. Preparation replenishes that charge after each successful cast. Costs are shared gold paid per cast; research and preparation have no additional gold fee.

| Spell / proposed stable ID | Role and target | Initial research | Repeat preparation | Cast cost | Effect and duration |
|---|---|---:|---:|---:|---|
| **Haste** / `dwarf-haste` | Support; one living friendly dwarf | 45 s | 20 s | 25 gold | +50% movement, work and attack speed for 20 s. Does not speed up hunger, fatigue or other needs. |
| **Slow** / `enemy-slow` | Defensive control; one living enemy, including strong enemies | 60 s | 25 s | 30 gold | -40% movement and attack speed for 15 s. Does not reduce damage per hit. |
| **Stoneguard** / `stoneguard` | Defense; one living friendly dwarf | 60 s | 30 s | 35 gold | A stone shield absorbs damage equal to 40% of the dwarf's maximum health. Ends when depleted or after 20 s. |
| **Thunder Rune** / `thunder-rune` | Offense; a visible floor point with an enemy in the affected area | 90 s | 35 s | 50 gold | Deals 30 damage to each enemy within a 1.5-tile radius and stuns them for 2 s. No friendly fire or terrain/structure damage. |
| **Runic Barrier** / `runic-barrier` | Defense; one empty, visible claimed floor tile | 75 s | 35 s | 40 gold | Blocks movement by dwarfs and enemies for up to 15 s; enemies can destroy it. Starts with 150 health. |
| **Mending Rune** / `mending-rune` | Recovery; one wounded, living friendly dwarf | 60 s | 30 s | 35 gold | Heals 4% of maximum health per active healing second, up to 40% total. Damage pauses healing for 3 s after the latest hit. Expires after 20 s even if some healing remains. |
| **Rune of Reckoning** / `rune-of-reckoning` | Offense; one living enemy | 75 s | 30 s | 40 gold | Target takes 30% extra damage from dwarf attacks for 15 s. Spell and trap damage receive no bonus. |
| **Call to Arms** / `call-to-arms` | Rally; one visible, walkable floor point | 45 s | 20 s | 25 gold | Calls all fighting dwarfs throughout the stronghold to the point for 45 s, including travel time. They gather within 3 tiles and fight autonomously to defend the area. |

Thunder Rune's damage and the barrier's health assume a provisional reference combatant with 100 health and a basic attack of 10 damage per second. These are balance references, not final character statistics; rescale the two flat values when combat statistics are established. The other health effects use percentages to remain useful across dwarf types and training levels. Stoneguard absorbs damage after normal mitigation and passes any excess through to health.

## Research and casting rules

- A functional Library and an available research-capable Runesmith are needed to research or replenish a spell. Initially allow all catalog research choices without a prerequisite tree; the longer research times make the larger tactical effects later investments. Campaign unlocks remain open.
- Retain one prepared charge per spell for the whole stronghold. Different spells can be researched or prepared at separate accessible stations, but researchers cannot combine on the same order. Pausing or losing a station retains progress, unlocks and prepared charges.
- A successful cast consumes the charge and gold, then queues preparation immediately. There is no separate cooldown; repeat preparation is the reuse gate and can benefit from research-speed bonuses. Prepared spells can still be cast without an active researcher.
- Casting is instant after valid target selection. Dwarf buffs target a currently visible friendly dwarf; hostile spells target currently visible enemies. Use the world's visibility rules, never camera position or unexplored terrain. Casting has no additional distance limit from the Hearth or researcher, allowing support at a distant explored battlefront.
- Cancelled, unaffordable or invalid casts spend neither gold nor the prepared charge. Check target validity again on confirmation. Full-health dwarfs cannot receive Mending Rune; Thunder Rune needs at least one visible enemy within its radius and unobstructed sight from the blast center. Solid walls block the blast.
- The same ongoing spell cannot stack or refresh on the same target; reject that cast. Different spells may coexist. Haste changes action rates without shortening buff durations, healing pauses or stun timers. Strong enemies remain valid Slow targets; any future boss resistance must be explicit in its definition and shown in the sidebar.
- Mending Rune cannot resurrect or exceed maximum health. Healing ends at full health, at its total allowance, on death, or on expiry. It does not order the dwarf to retreat; combat and movement remain autonomous.
- Runic Barrier must fit on a clear claimed floor tile with no resident, enemy, furniture, door, trap, construction plan or reserved facility access. It may temporarily seal a passage. It grants no room capacity or permanent terrain, cannot be repaired, and leaves the original floor intact on expiry or destruction. Permit only one active barrier per stronghold and reject another cast while it remains. Navigation must respond to both placement and removal.

## Call to Arms behavior

Call to Arms is the spell version of the shared area rally. It calls every living dwarf whose character definition grants a fighting role, regardless of distance from the target. Warriors are the initial intended responders; future fighting types join through their capabilities. Training alone does not turn a Miner, Engineer or Runesmith into a responder. Noncombat workers continue their jobs.

- Responders interrupt ordinary work, training, guard duty, eating and resting, releasing any occupied service reservations. They walk by normal routes, without teleporting or gaining a speed bonus. Needs continue at their normal pace; critical survival needs or emergency retreat may temporarily override the rally. On recovery they answer the call if it remains active.
- The target may be claimed or unclaimed visible floor, but must be walkable and reachable by at least one eligible fighter. With no eligible reachable fighter, reject the cast without charge. A fighter whose route is blocked reports that status in the sidebar and rejoins if access becomes available. New eligible arrivals also respond during the active period.
- Fighters gather in accessible space within a 3-tile radius instead of trying to occupy one point. They autonomously engage enemies in that area, defend themselves while approaching, and return toward the rally when enemies leave the area. The spell does not reveal fog or let fighters pass through walls, doors or barriers.
- Only one rally may be active per stronghold. Reject another Call to Arms while it is active; the player can dismiss it early in the sidebar, without a refund, then cast at another point once the next charge is prepared. Preparation starts on casting as usual.
- The 45-second timer starts on casting, not on arrival. On expiry or dismissal, release the rally assignment and resume ordinary autonomous priorities, including guard duty and needs. Fighters still respond to immediate danger; expiry does not force them to abandon self-defense.

These response priorities, radius and timing are provisional. The agreed behavior is that the spell calls all fighting dwarfs to a selected point for a limited period, without individual movement orders.

## Presentation and remaining work

Use the existing left-sidebar Spells panel for research, costs, readiness and targeting, with right-click or Escape cancelling target selection. Selected-unit details show health, shield amount and effect time remaining in the sidebar. Use restrained physical effects such as stone armor, rune glows and thunder impacts in the world; do not add floating text, numbers, health bars or timers.

Implementation needs individual spell targeting, per-unit effects and action-rate modifiers. Offensive and defensive effects also depend on combat health/damage, enemy visibility, stun and temporary navigation obstacles. Keep those dependencies distinct from the existing research service. Store spell values in editable definitions and expose relevant balance fields in Game configuration when implemented; the values in this document are not live settings yet.

Call to Arms additionally needs shared rally assignments, capability-based responder selection and priority handling. Show a restrained ground rune at the rally point; remaining time, responding/unreachable fighter counts and Dismiss belong in the sidebar. Verify all eligible fighters respond, nonfighters continue work, blocked routes recover, service reservations release, and expiry/dismissal restores normal priorities. Test the single-rally restriction, distant travel consuming the duration, new arrivals and critical-needs exceptions.

Playtest cast validation and exact gold/charge use, interrupted preparation, effect expiry and non-stacking, strong-enemy Slow, blast obstruction, healing under repeated damage, and barrier occupancy/path updates. Balance should make a 25–50 gold cast a meaningful tactical purchase without replacing Warriors, constructed defenses or room investment.
