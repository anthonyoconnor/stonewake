import { type World, type Tile, tileAt, key } from './types.ts';
import { type RuinDefinition, ruinTuning } from '../content/ruins.ts';
import { roomById } from '../content/rooms.ts';
import { roomAllowed } from './availability.ts';
import { spellLine } from './spell-effects.ts';
import { furnish } from './rooms.ts';

/** Neutral remnants hold neither room services nor furniture reservations before physical claiming. */
export function initializeRuins(w: World, definitions: RuinDefinition[] = []) {
  const ids = new Set<string>(), occupied = new Set<string>();
  for (const ruin of definitions) {
    if (!ruin.id || ids.has(ruin.id) || !ruin.rooms.length) throw Error(`Invalid ruin: ${ruin.id}`);
    ids.add(ruin.id);
    for (const room of ruin.rooms) {
      if (!roomById(room.type)?.implemented || !room.cells.length) throw Error(`Invalid ruin room: ${ruin.id}/${room.type}`);
      for (const p of room.cells) {
        const t = tileAt(w, p.x, p.z);
        if (!t || t.core || t.onward || t.claimed || t.room || !['floor', 'dirt', 'rock'].includes(t.terrain) || occupied.has(key(p)))
          throw Error(`Ruin needs neutral floor or collapsed earth: ${ruin.id}/${key(p)}`);
        occupied.add(key(p));
        t.ruin = { id: ruin.id, room: room.type };
      }
    }
  }
}

export function ruinContested(w: World, t: Tile) {
  return !!t.ruin && (w.enemies ?? []).some(e => e.health > 0 &&
    Math.hypot(e.x - t.x, e.z - t.z) <= ruinTuning.securityRadius && spellLine(w, e, t));
}

/** Shared claim-job eligibility, checked both when assigning and while performing work. */
export function canClaimFloor(w: World, t: Tile) {
  return t.known && t.terrain === 'floor' && !t.claimed && !t.core && !t.onward && !t.wallPlanned &&
    (!t.ruin || (roomAllowed(w, t.ruin.room) && !ruinContested(w, t)));
}

export function finishClaim(w: World, t: Tile) {
  if (!canClaimFloor(w, t)) return false;
  t.claimed = true;
  if (t.ruin) {
    t.room = t.ruin.room;
    t.roomPaid = 0;
    furnish(w);
  }
  w.revision++;
  return true;
}

/** Sidebar details have to be requested for an actually discovered tile. */
export function ruinStatus(w: World, t: Tile) {
  if (!t.known || !t.ruin || t.room) return undefined;
  const name = roomById(t.ruin.room)!.name;
  return t.terrain !== 'floor' ? `Buried ${name} remnant; excavate to uncover.` :
    !roomAllowed(w, t.ruin.room) ? `${name} remnant; its plans are not available in this area.` :
      ruinContested(w, t) ? `${name} ruin is contested; clear nearby inhabitants.` :
        `${name} ruin; workers reclaim each reached square in ${ruinTuning.claimSeconds}s, for no gold.`;
}
