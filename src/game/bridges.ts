import { type World, type Point, type Tile, tileAt, neighbors, key } from './types.ts';
import { bridgeSettings, terrainWalkable, bridgeable } from './terrain.ts';
import { goldTotal, spendGold } from './rooms.ts';
import { reachable, canStand } from './navigation.ts';
import { tuning } from '../content/tuning.ts';

export function bridgeWorkSite(w: World, t: Tile, p: Tile) {
  return !!t.bridgePlanned && !t.bridge && p.claimed && terrainWalkable(p) && canStand(w, p);
}
export function bridgeQuote(w: World, points: Point[]) {
  const candidates = [...new Map(points.map((p) => [key(p), tileAt(w, p.x, p.z)])).values()].filter(
    (t): t is Tile => !!t?.known && bridgeable(t) && !t.bridge && !t.bridgePlanned,
  );
  // A plan can extend through other planned tiles, but each component must touch a real shore.
  const supported = new Set(
    w.tiles.filter((t) => t.known && t.claimed && terrainWalkable(t) && !t.core && !t.onward).map(key),
  );
  const pending = [...w.tiles.filter((t) => t.bridgePlanned), ...candidates];
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of pending)
      if (!supported.has(key(t)) && neighbors(w, t).some((n) => supported.has(key(n)))) {
        supported.add(key(t));
        changed = true;
      }
  }
  const tiles = candidates.filter((t) => supported.has(key(t)));
  const cost = w.freeRoomBuilding ? 0 : tiles.length * bridgeSettings.cost;
  return {
    tiles,
    cost,
    valid: !w.outcome && tiles.length > 0 && cost <= goldTotal(w),
    reason: w.outcome
      ? 'This area has ended.'
      : !tiles.length
        ? 'Select discovered water or lava connected to claimed shore. Chasms cannot be bridged.'
        : cost > goldTotal(w)
          ? 'Not enough stored gold.'
          : 'Miners build from reachable claimed shore or completed bridges.',
  };
}
export function planBridges(w: World, points: Point[]) {
  const q = bridgeQuote(w, points);
  if (!q.valid) return q.reason;
  if (!spendGold(w, q.cost)) return 'Not enough stored gold.';
  for (const t of q.tiles) {
    t.bridgePlanned = true;
    t.bridgeProgress = 0;
    t.bridgePaid = q.cost / q.tiles.length;
  }
  for (const a of w.agents) a.retry = 0;
  w.revision++;
  return `${q.tiles.length} bridge squares planned · ${q.cost} gold paid.`;
}
export function finishBridge(w: World, t: Tile) {
  t.bridge = true;
  t.bridgePlanned = false;
  t.claimed = true;
  t.designated = false;
  w.routesChanged = true;
  w.revision++;
  for (const a of w.agents) a.retry = 0;
}
export function removeBridges(w: World, points: Point[]) {
  if (w.outcome) return 'This area has ended.';
  const tiles = [...new Map(points.map((p) => [key(p), tileAt(w, p.x, p.z)])).values()].filter(
    (t): t is Tile => !!t?.known && !!(t.bridge || t.bridgePlanned),
  );
  if (!tiles.length) return 'Select bridges or bridge plans to remove.';
  const removed = new Set(tiles.filter((t) => t.bridge).map(key));
  const units = [
    ...w.agents.filter((a) => (a.health ?? 1) > 0),
    ...(w.enemies ?? []).filter((e) => e.health > 0),
  ];
  if (
    tiles.some(
      (t) =>
        t.bridge &&
        (t.loose > 0 ||
          units.some(
            (a) => Math.abs(a.x - t.x) < 0.5 + tuning.radius && Math.abs(a.z - t.z) < 0.5 + tuning.radius,
          )),
    )
  )
    return 'Bridge occupied. Clear units and loose gold before removal.';
  // Removal must preserve every unit’s currently reachable land, for both traversal policies.
  for (const a of units) {
    const walker = 'capabilities' in a ? 'dwarf' : 'enemy';
    const before = reachable(w, a, undefined, walker),
      after = reachable(w, a, removed, walker);
    if (w.tiles.some((t) => t.terrain === 'floor' && before.has(key(t)) && !after.has(key(t))))
      return 'Removal would cut a unit off from reachable land.';
  }
  const remaining = w.tiles.filter((t) => (t.bridge || t.bridgePlanned) && !tiles.includes(t));
  const supported = new Set(
    w.tiles.filter((t) => t.terrain === 'floor' && t.claimed && !t.core && !t.onward).map(key),
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of remaining)
      if (!supported.has(key(t)) && neighbors(w, t).some((n) => supported.has(key(n)))) {
        supported.add(key(t));
        changed = true;
      }
  }
  if (remaining.some((t) => !supported.has(key(t))))
    return 'Remove the unsupported bridge section and its plans together.';
  const refund = tiles.reduce(
    (sum, t) => sum + Math.floor((t.bridgePaid ?? 0) * (t.bridge ? tuning.reclaimRatio : 1)),
    0,
  );
  for (const t of tiles) {
    t.bridge = false;
    t.bridgePlanned = false;
    t.bridgeProgress = 0;
    t.bridgePaid = 0;
    t.claimed = false;
  }
  w.allowance += refund;
  w.spent -= refund;
  w.routesChanged = true;
  w.revision++;
  return `${tiles.length} bridge squares removed · ${refund} gold refunded.`;
}
