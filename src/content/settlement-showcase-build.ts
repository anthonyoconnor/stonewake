import { startFreePlay } from '../game/session.ts';
import { designate, tick } from '../game/simulation.ts';
import { buildRoom, roomQuote } from '../game/rooms.ts';
import { queueCraft } from '../game/crafting.ts';
import { queueResearch } from '../game/research.ts';
import { placeDefense } from '../game/defenses.ts';
import { tileAt } from '../game/types.ts';
import { showcaseComplete, showcaseDoors, showcaseExcavation, showcaseLevel, showcaseRooms } from './settlement-showcase.ts';

/** Only player actions and ordinary ticks. No free build, grants, terrain edits or spawned recruits. */
export function* buildShowcase() {
  const w = startFreePlay(showcaseLevel.id!, false);
  designate(w, showcaseExcavation);
  let completedAt: number | undefined;
  for (let second = 0; second < 3600; second++) {
    // Finish infrastructure before accommodation opens recruitment and its ongoing wage bill.
    for (const [type, cells] of Object.entries(showcaseRooms)) {
      const pending = cells.filter(p => tileAt(w, p.x, p.z)?.room !== type);
      if (!pending.length) continue;
      const quote = roomQuote(w, type, pending);
      if (quote.valid) buildRoom(w, type, quote.tiles);
      break;
    }
    if (showcaseComplete(w)) {
      completedAt ??= w.elapsed;
      if (!w.craftOrders.length) for (const _ of showcaseDoors) queueCraft(w, 'timber-door');
      for (const p of showcaseDoors) {
        if ((w.outputs['timber-door'] ?? 0) > 0 && !w.defenses?.some(d => d.x === p.x && d.z === p.z))
          placeDefense(w, 'timber-door', p);
      }
      if (!w.researchOrders?.length) queueResearch(w, 'dwarf-haste');
      // Populate and exercise the home through ordinary recruitment, meals, rest and paydays.
      if (w.elapsed - completedAt >= 360) return w;
    }
    for (let step = 0; step < 10; step++) tick(w, 0.1);
    yield w;
  }
  throw Error('Hearthside Halls could not finish its paid construction within one hour.');
}

export function createBuiltShowcase() {
  const build = buildShowcase();
  let next = build.next();
  while (!next.done) next = build.next();
  return next.value;
}

/** Yield during the initial paid replay so the preview can display progress and remain responsive. */
let prepared: Promise<ReturnType<typeof createBuiltShowcase>> | undefined;
export function prepareBuiltShowcase(progress: (seconds: number) => void) {
  return prepared ??= (async () => {
    const build = buildShowcase();
    let next = build.next(), count = 0;
    while (!next.done) {
      if (++count % 5 === 0) {
        progress(Math.round(next.value.elapsed));
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      next = build.next();
    }
    return next.value;
  })().catch(error => { prepared = undefined; throw error; });
}
