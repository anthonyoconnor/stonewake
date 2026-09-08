import { type World, type Point, tileAt, key } from './types.ts';
import { reclaimRoom } from './rooms.ts';
import { removeBridges } from './bridges.ts';
import { defenseAt } from './doors.ts';
import { removeDefense } from './defenses.ts';

export function sellable(w: World, p: Point) {
  const t = tileAt(w, p.x, p.z);
  return !w.outcome && !!t?.known && !t.core && !t.onward && !!(t.room || t.bridge || t.bridgePlanned || defenseAt(w, p));
}

// Each kind keeps its own refunds and removal safeguards; blocked bridges stay intact.
export function sellTiles(w: World, points: Point[]) {
  if (w.outcome) return 'This area has ended.';
  const tiles = [...new Map(points.filter(p => sellable(w, p)).map(p => [key(p), tileAt(w, p.x, p.z)!])).values()];
  const messages: string[] = [];
  const bridges = tiles.filter(t => t.bridge || t.bridgePlanned);
  if (bridges.length) messages.push(removeBridges(w, bridges));
  const rooms = tiles.filter(t => t.room);
  if (rooms.length) messages.push(reclaimRoom(w, rooms));
  for (const t of tiles) {
    const defense = defenseAt(w, t);
    if (defense) messages.push(removeDefense(w, defense.id));
  }
  return messages.join(' ') || 'Choose rooms, bridges or defenses to sell.';
}
