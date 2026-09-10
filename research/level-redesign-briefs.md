# Level geography briefs

M35 working tile sketches and implementation direction. The [overhaul](../level-overhaul.md) owns acceptance; the [concept gallery](../concept-art/levels/overhaul/README.md) owns art and interpretation. Coordinates are tile centers; sketches deliberately omit palette and decoration. Each individual concept is generated before implementing that replacement.

Legend: `H` starting Hearth, `O` onward stone, `#` enduring geology, `~` liquid, `:` chasm, `+` buried street, `r` reclaimable district, `$` income. Dots denote useful diggable expansion, not pre-excavated floor. The diagrams show relationships, not compulsory corridor plans.

## Border Foothold — sheltered basin (40 × 32)

```
       ####       watch O
    ###   old workings /
   # . . $ . /  ######
   # . H . /   #
   # . . . ----r waystation
     #####       den / passage
```

Hearth near (10,18), relay near (30,7). A broken horseshoe of rock protects the starting basin. Timber mine branches peel around its northern shoulder; a wider southeast saddle reaches a waystation. The direct branch exposes the watch earlier; the flank supplies den/storage floor and a rear defensive approach. Gold follows the old workings and the inside of the basin. Space beyond the starter rooms allows player-shaped support wings. Warm dry earth and timber contrast with a cool, darker untouched perimeter. Discovery proceeds from a timber throat to a watch cavern or abandoned service bay. Hounds and settlement timing remain sufficient.

## Fungal Hollows — wet cavern archipelago (48 × 40)

```
      H . .      broad dry shelf
      . . \   /     colony
       lobe ~~~~~~~~  / 
       r -- ~~ ~~~~~ -- brood
         \  ~~~~  /      O
          broad lower lobe
```

Hearth near (10,12), relay near (34,31). Joined asymmetric caverns wrap a substantial pool basin with smaller shore pockets. Upper dry shelf and lower waystation loop offer different attack directions; neither needs bridges. Broad lobes accommodate training and defense deployment instead of single-width corridor combat. Damp stone edges, bare dry shelves, fungal colonies and webbed recesses occur in separate patches. The water first appears through a narrow reveal and opens into a wide basin; ruins sit on a dry spur. Room expansion can follow the natural lobes while leaving colony margins intact. Trained Warriors and hounds face spiders and a Spore Brute.

## Fallen City — buried crossroads (56 × 46)

```
             watch O
    #  r ++++++r   ##
       +   #  +     +
  r ++++++ plaza ++++ r
       +      +
      rubble  +  blocked side street
         . . H . .
```

Hearth near (27,34), relay near (26,8). A central avenue crosses lateral streets and service courts. Buildings form coherent district edges; diagonal geological intrusions have broken the grid in several places. A shorter avenue advances directly toward the watch; a foundry and side street supply another approach and useful reclamation. The city occupies the middle of the map rather than isolated rooms scattered in generic caves. Gold sits in intrusion seams and collapsed courtyards. Warm workshop masonry, cold civic paving and rough cave breaches remain locally distinguishable. Engineers and manufactured traps benefit from defensible junctions.

## Crystal Divide — branching crescent (64 × 52)

```
      archive r ---- upper spine ---- H
        /     ::::::::::        / . .
       O    :::          :     branch
        \   :::         :        $
         lower spine --- remote hunting ground
```

Hearth near (49,12), relay near (15,29). A curved chasm and jagged rock spine divide a branching cave system. Solid land routes go around its two ends: a relatively short northern archive route and a longer southern route near renewable income. Finite local and expedition gold supports completion without claiming the gem. Chasm edges and spare pale quartz colonies carry the silhouette; blue mineable gems remain visually distinct. Warm archive bays provide relief from cold lilac geology. The larger footprint buys separate exploration branches, a remote economy choice and a recognizable obstacle, with no bridge across chasm or second floor height. Library research and battlefield spells support the expedition.

## Royal Deep — molten royal basin (72 × 60)

```
                  lava feeder
        H . .      ~~       royal district
        . . . ---> ~~~ ---- peninsula
       safe bank   ~~~~~~~~    O
         \       ~~~~~~~~~~  / r
       long crossing ---- foundry   $
                  lava outlet
```

Hearth near (14,18), relay near (54,36). A broad lava basin with narrowing feeders divides substantial banks and ruined peninsulas. The direct bridgehead saves construction but reaches an exposed royal approach; the southern crossing costs more and reaches a foundry and safer consolidation area. The optional income district and final relay occupy different places. Irregular banks must leave bridge supports legible. Monumental masonry and scorched hollows form local districts under lava light. Cinderlings threaten open banks and their repeat source is physically suppressible; a Deepmaw guards the royal approach. Expansion space and optional districts add depth without requiring exhaustive clearance.

## Shared implementation decisions

- Preserve a compact initially visible five-by-five start and normal crew/treasury. Safe nearby finite seams fund paid support before a deliberate breach; rotate the example settlement to fit the geography.
- Author broad natural shapes with ellipses, concave polygons and variable-width paths, and place ruins against their actual streets/shores. Do not stamp a shared center divider or a fixed objective corner.
- Keep environmental regions cosmetic, sparse and local. Terrain, claiming, room capacity, navigation and fog remain authoritative.
- Example route metadata records player excavation/building choices for repeatable paid verification; it never grants paths, money, recruits or discovery to the live simulation.
- Record final dimensions and deviations in current level documentation after play and visual review. These sketches are design inputs, not proof of acceptance.
