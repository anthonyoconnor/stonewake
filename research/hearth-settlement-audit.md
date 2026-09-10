# Hearth settlement space audit

The existing terrain supports separate home rooms and corridors on all twelve maps. The earlier completion evidence did not demonstrate this: the shared [settlement blueprint](../src/content/level-play-plans.ts) marks an approximately 11×14 excavation block plus local gold spurs, and [the route driver](../scripts/helpers/campaign-route.ts) excavates that whole selection. The resulting settlements have room patches in a large open space. Several rooms directly touch, and no corridor or dividing-wall mask is preserved.

The user's clarified requirement is now explicit in [level acceptance](../level-overhaul.md): count chambers, entrances, corridors, retained walls and expansion space around the starting Hearth. A count of diggable cells or a successful open-plan expedition is insufficient.

## Concrete spatial fits

[Candidate coordinates](hearth-settlement-layouts.json) retain twelve independently arranged examples on the existing terrain. They are planning proposals, not new map definitions, required player templates or changed mechanical minimum room sizes. Treasury and specialist chambers are at least 3×3. Campaign support rooms grow with stage needs; the standalone examples use a 5×4 Dormitory and 4×4 Kitchen to demonstrate additional headroom.

The corridor column counts proposed corridor cells **beyond the existing sixteen-cell Hearth walking ring**, excluding room floor. Wall and reserve areas are additional and never count as service capacity. Most passages are one cell wide; this demonstrates workable separate chambers, not a promise of two-cell avenues or much larger rooms everywhere.

| Map | Available room types | Room floor | Added corridors | Reserved expansion | Geographic constraint |
|---|---:|---:|---:|---:|---|
| Border Foothold · Campaign | 3 | 30 | 9 | 12 | Adequate small basin; western/southern bedrock limits growth. |
| Fungal Hollows · Campaign | 4 | 39 | 11 | 16 | Dry northwest shelf fits support wings while keeping wet approaches sealed. |
| Fallen City · Campaign | 5 | 48 | 11 | 21 | Southern chambers fit between bedrock flanks below the civic avenue. |
| Crystal Divide · Campaign | 6 | 57 | 38 | 15 | Most constrained campaign home; circulation wraps north/east around the Hearth. |
| Royal Deep · Campaign | 6 | 64 | 21 | 30 | Broad western land supports separate chambers and a substantial southwest reserve. |
| Mining Interchange | 6 | 72 | 15 | 12 | Central room branches; southern bedrock favors eastern growth. |
| Emberwater Crossing | 6 | 72 | 16 | 16 | Western bank fits the suite; river and southern bedrock constrain its edges. |
| Honeycomb Quarry | 6 | 72 | 17 | 16 | Broad eastern refuge; preserve the western quarry threshold. |
| Overgrown Confluence | 6 | 72 | 20 | 20 | Southern border favors lateral growth; keep the northern wet-lobe breach deliberate. |
| Flooded Watch Districts | 6 | 72 | 15 | 12 | Northwest rooms fit; the occupied southern service street remains a separate destination. |
| Prism Wells | 6 | 72 | 14 | 12 | Tighter standalone arrangement; retain the western hunter-well and southern fracture barriers. |
| Ashen Caldera | 6 | 72 | 25 | 16 | Western bank has room; eastern crossing and southern den remain deliberate breaches. |

An independent static check against `createWorld` verified every room/corridor cell is eligible terrain, every room is connected internally, no two rooms touch, and every room has direct access to the connected corridor network without walking through another room. All non-entrance room boundaries remain solid. Room and corridor cells avoid the core, hazards, bedrock and ruins; the reserves are unused solid, diggable ground. The resulting floor components connect to no authored encounter position. This is a terrain-connectivity check, not a simulation of line-of-sight discovery, scouting, enemy movement or pressure timing.

The seven standalone proposals also have separately checked mining spurs to all twenty-one startup gold tiles, and access gates for their growth reserves. They retain substantial separating walls and do not connect to an existing hostile floor component after those additions. Campaign mining routes and reserve gates still need integration into the proposed build sequence. Do not mine a retained gold wall indiscriminately and assume the chamber remains enclosed.

## Capacity and economy distinction

The old full-catalog example builds 39 home room tiles: six treasury, twelve Dormitory, nine Kitchen and four each of Training, Workshop and Library. Border trims treasury to four and later room types follow availability. Those paid routes genuinely demonstrated recruitment and completion. Reclaimed districts can add further services; the Royal developed fixture includes eight reclaimed room tiles beyond its home suite.

The larger campaign examples cost 480 / 678 / 894 / 1,128 / 1,252 gold for their room floor; the standalone examples cost 1,396. The twenty-one authored startup seams plus the normal allowance provide 2,290 gross gold under current tuning. This arithmetic does not account for excavation/hauling time, wages, defenses, spells, bridges or casualties and is not a paid sustainability result. Actual prices and capacities remain owned by [Rooms](../rooms.md) and [character rules](../characters.md).

Room area also changes recruitment: a larger Training Room can support more Warriors, and larger accommodation/food rooms can admit more living residents. Additional space should permit staged growth rather than require immediate full designation. The proposed larger suites must be checked through ordinary paid building, physical room access, arrivals, ongoing needs/wages and level completion before replacing the existing route evidence.

## Evidence and remaining work

This audit changes documentation and adds spatial proposals; it does not alter the playable maps or room systems. Independent terrain checks passed all twelve proposals. The comparison visual was checked at desktop/mobile widths in light/dark appearances, with every level selection working. Ignored local evidence is under `test-results/home-space/`, including raw candidate sets, independent geometry results and comparison captures; the compact proposal coordinates above remain versioned.

The outstanding acceptance work is to replace broad-clearing verification plans with explicit rooms, corridors and mining spurs, then verify ordinary paid construction, furnishings, recruitment, needs, wages, discovery and completion using those arrangements. Review Crystal Divide and Prism Wells first if wider corridors or larger long-term populations are desired. No blanket enlargement of all twelve maps is justified by this spatial audit.
