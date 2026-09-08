import { type World, type Point, type Enemy, tileAt } from './types.ts';
import { addEnemy } from './defenses.ts';
import { enemyDefinitions, enemyById } from '../content/enemies.ts';
import { enemyWalker, burrowPath } from './enemy-ai.ts';
import { reachable, blocked } from './navigation.ts';
import { alive, visible } from './spell-effects.ts';
import { type Walker } from './doors.ts';

/** Positions are physical spawn squares, never alternative spawn searches. */
export interface EncounterDefinition {
  id: string;
  name: string;
  kind: 'camp' | 'nest' | 'entrance';
  positions: Point[];
  /** Species per physical position. Omit for legacy Raider-only sources. */
  roster?: string[];
  activation: 'discovery' | 'route' | 'time';
  delay: number;
  warningSeconds: number;
  /** Omit for a single wave. Repeating waves wait until the previous wave is defeated. */
  repeatSeconds?: number;
  /** Defeat ends a source; claim allows reinforcements until a dwarf secures its entrance. */
  clear: 'defeat' | 'claim';
  warning?: string;
}

export interface EncounterState {
  definition: EncounterDefinition;
  phase: 'dormant' | 'waiting' | 'warning' | 'active' | 'cooldown' | 'cleared';
  enemyIds: number[];
  waves: number;
  nextAt: number;
  discovered: boolean;
  blocked: boolean;
  warnedAt?: number;
  clearedAt?: number;
  nextRouteCheckAt?: number;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
const sourceEnemies = (w: World, source: EncounterState) =>
  (w.enemies ?? []).filter((e) => source.enemyIds.includes(e.id) && e.health > 0);

/** The core stays impassable; attackers approach a side within melee reach of its stonework. */
export function encounterTarget(
  w: World,
  from: Point,
  routes = reachable(w, from, undefined, 'breach'),
  walker: Walker = 'breach',
): Point | undefined {
  const approaches = w.tiles
    .filter(
      (t) =>
        Math.max(Math.abs(t.x - w.hearth.x), Math.abs(t.z - w.hearth.z)) === 2 &&
        (Math.abs(t.x - w.hearth.x) <= 1 || Math.abs(t.z - w.hearth.z) <= 1) &&
        !blocked(w, t, undefined, { walker }),
    )
    .sort((a, b) => distance(a, from) - distance(b, from));
  const target = approaches.find((p) => routes.has(`${p.x},${p.z}`)) ?? approaches[0];
  return target ? { x: target.x, z: target.z } : undefined;
}

function sourceRoute(w: World, source: EncounterState) {
  return source.definition.positions.every((p, i) => {
    const type = source.definition.roster?.[i];
    const walker = enemyWalker(type, true),
      routes = reachable(w, p, undefined, walker);
    const target = encounterTarget(w, p, routes, walker);
    return (
      target &&
      (routes.has(`${target.x},${target.z}`) ||
        (enemyById(type).ability === 'burrow' && !!burrowPath(w, p, target)))
    );
  });
}

function spawnSquareFree(w: World, p: Point, type?: string) {
  const tile = tileAt(w, p.x, p.z);
  return (
    !!tile &&
    !tile.claimed &&
    !tile.room &&
    !tile.wallPlanned &&
    !blocked(w, p, undefined, { walker: enemyWalker(type) }) &&
    !w.agents.some((a) => alive(a) && distance(a, p) < 0.8) &&
    !(w.enemies ?? []).some((e) => e.health > 0 && distance(e, p) < 0.8)
  );
}

function spawnGroup(w: World, source: EncounterState, dormant: boolean) {
  if (!source.definition.positions.every((p, i) => spawnSquareFree(w, p, source.definition.roster?.[i])))
    return false;
  const group: Enemy[] = [];
  for (const [i, position] of source.definition.positions.entries()) {
    const type = source.definition.roster?.[i];
    const walker = enemyWalker(type, true),
      routes = reachable(w, position, undefined, walker);
    const enemy = addEnemy(w, position, encounterTarget(w, position, routes, walker) ?? position, type)!;
    enemy.sourceId = source.definition.id;
    enemy.dormant = dormant;
    enemy.activity = dormant ? 'Guarding camp' : 'Approaching';
    group.push(enemy);
  }
  source.enemyIds = group.map((e) => e.id);
  return true;
}

export function initializeEncounters(w: World, definitions: EncounterDefinition[] = []) {
  const ids = new Set<string>();
  w.encounters = definitions.map((definition) => {
    if (
      ids.has(definition.id) ||
      !definition.positions.length ||
      (definition.roster !== undefined &&
        (definition.roster.length !== definition.positions.length ||
          definition.roster.some((id) => !enemyDefinitions.some((e) => e.id === id)))) ||
      definition.delay < 0 ||
      definition.warningSeconds < 0 ||
      (definition.repeatSeconds !== undefined && definition.repeatSeconds <= 0)
    )
      throw new Error(`Invalid encounter definition: ${definition.id}`);
    ids.add(definition.id);
    const state: EncounterState = {
      definition: structuredClone(definition),
      phase: 'dormant',
      enemyIds: [],
      waves: 0,
      nextAt: w.elapsed + definition.delay,
      discovered: false,
      blocked: false,
    };
    if (definition.kind !== 'entrance' && !spawnGroup(w, state, true))
      throw new Error(`Resident encounter needs clear, unclaimed floor: ${definition.id}`);
    return state;
  });
}

function clearSource(w: World, source: EncounterState) {
  source.phase = 'cleared';
  source.clearedAt = w.elapsed;
  source.blocked = false;
  w.revision++;
}

function warn(w: World, source: EncounterState) {
  source.phase = 'warning';
  source.warnedAt = w.elapsed;
  source.nextAt = w.elapsed + source.definition.warningSeconds;
  source.blocked = false;
  w.revision++;
}

export function tickEncounters(w: World) {
  if (w.outcome) return;
  for (const source of w.encounters ?? []) {
    const def = source.definition;
    if (!source.discovered && def.positions.some((p) => tileAt(w, p.x, p.z)?.known)) {
      source.discovered = true;
      w.revision++;
    }
    if (source.phase === 'cleared') continue;
    const living = sourceEnemies(w, source);
    // Securing any authored spawn square closes the source permanently; living raiders remain.
    if (def.clear === 'claim' && def.positions.some((p) => tileAt(w, p.x, p.z)?.claimed)) {
      for (const enemy of living) enemy.dormant = false;
      clearSource(w, source);
      continue;
    }
    if (
      source.enemyIds.length &&
      !living.length &&
      (source.phase === 'active' || (def.kind !== 'entrance' && source.waves === 0))
    ) {
      if (def.clear === 'defeat' || def.repeatSeconds === undefined) clearSource(w, source);
      else {
        source.phase = 'cooldown';
        source.nextAt = w.elapsed + def.repeatSeconds;
        source.enemyIds = [];
        source.blocked = false;
        w.revision++;
      }
      continue;
    }
    if (source.phase === 'active') continue;
    if (source.phase === 'dormant') {
      if (def.activation === 'route' && w.elapsed < (source.nextRouteCheckAt ?? 0)) continue;
      const activated =
        def.activation === 'time'
          ? w.elapsed >= source.nextAt
          : def.activation === 'discovery'
            ? source.discovered
            : sourceRoute(w, source);
      if (def.activation === 'route') source.nextRouteCheckAt = w.elapsed + 0.5;
      if (!activated) continue;
      source.phase = 'waiting';
      source.nextAt = w.elapsed + (def.activation === 'time' ? 0 : def.delay);
      w.revision++;
    }
    if ((source.phase === 'waiting' || source.phase === 'cooldown') && w.elapsed >= source.nextAt)
      warn(w, source);
    if (source.phase !== 'warning' || w.elapsed < source.nextAt) continue;
    if (living.length) {
      for (const enemy of living) {
        enemy.dormant = false;
        const walker = enemyWalker(enemy.type, true),
          routes = reachable(w, enemy, undefined, walker);
        enemy.target = encounterTarget(w, enemy, routes, walker) ?? enemy.target;
      }
    } else {
      // A sealed entrance retains one pending warned wave. It cannot accumulate or teleport waves.
      if (w.elapsed < (source.nextRouteCheckAt ?? 0)) continue;
      source.nextRouteCheckAt = w.elapsed + 0.5;
      if (!sourceRoute(w, source) || !spawnGroup(w, source, false)) {
        source.blocked = true;
        continue;
      }
    }
    source.waves++;
    source.phase = 'active';
    source.blocked = false;
    w.revision++;
  }
}

/** Debug timer control: preserve discovery, warning duration, route validation and wave limits. */
export function advanceEncounter(w: World, id?: string) {
  const pending = (w.encounters ?? []).filter(
    (s) => (!id || s.definition.id === id) && ['dormant', 'waiting', 'cooldown'].includes(s.phase),
  );
  if (!pending.length) return 'No encounter timer is waiting. Advance simulation to finish a warning.';
  for (const source of pending) source.nextAt = w.elapsed;
  tickEncounters(w);
  return 'Encounter timers advanced. Discovery, warnings and physical entrances still apply.';
}

/** Normal sidebar data intentionally omits positions and undiscovered local groups. */
export function encounterSummary(w: World, debug = false) {
  return (w.encounters ?? [])
    .filter((s) => debug || s.discovered || s.warnedAt !== undefined)
    .map((source) => {
      const def = source.definition;
      const name = debug || source.discovered ? def.name : 'Underground raid';
      const remaining = Math.max(0, Math.ceil(source.nextAt - w.elapsed));
      const status =
        source.phase === 'cleared'
          ? 'Source cleared; no further reinforcements.'
          : source.phase === 'warning'
            ? source.blocked
              ? 'Raid warned; entrance or approach is blocked.'
              : `${source.discovered ? (def.warning ?? 'Hostile movement heard in the tunnels.') : 'Hostile movement heard in the tunnels.'} ${remaining}s warning.`
            : source.phase === 'active'
              ? 'Hostiles active.'
              : source.phase === 'cooldown'
                ? `Reinforcements in ${remaining}s, followed by a warning.`
                : source.phase === 'waiting'
                  ? `Hostiles stirring; warning in ${remaining}s.`
                  : def.activation === 'time'
                    ? `First warning in ${remaining}s.`
                    : def.activation === 'route'
                      ? 'Dormant until a route opens.'
                      : 'Dormant until discovered.';
      return {
        id: def.id,
        name,
        phase: source.phase,
        status,
        visibleEnemies: sourceEnemies(w, source).filter((e) => debug || visible(w, e)).length,
        waves: source.waves,
        blocked: source.blocked,
      };
    });
}
