import { type World, type Resident, type Point, key, tileAt } from './types.ts';
import { tuning } from '../content/tuning.ts';
import { characterById, isConstruct, isAnimal } from '../content/characters.ts';
import { reachable, canStand, findPath } from './navigation.ts';
import { wageStatus } from './wages.ts';
import { hearthArrival } from './recruitment.ts';
import { alive } from './spell-effects.ts';
import { releaseJob } from './jobs/common.ts';
import { moveResident } from './movement.ts';
import { assignRoomSupport } from './food.ts';

export const moraleCauses = ['food', 'accommodation', 'pay', 'facility'] as const;
export type MoraleCause = (typeof moraleCauses)[number];
export type MoraleSeverity = 'warning' | 'leaving';
export interface MoraleState {
  unmet: Record<MoraleCause, number>;
  active: MoraleCause[];
  leaving: boolean;
  blocked: boolean;
  departureAt?: number;
  destination?: Point;
}
export interface DepartureRecord {
  id: number;
  name: string;
  type: string;
  at: number;
  causes: MoraleCause[];
}
const causeLabels: Record<MoraleCause, string> = {
  food: 'Kitchen support',
  accommodation: 'Dormitory support',
  pay: 'Uncollectable wages',
  facility: 'Required role facilities',
};
const causeMessages: Record<MoraleCause, string> = {
  food: 'Needs an assigned, reachable Kitchen place.',
  accommodation: 'Needs an assigned, reachable Dormitory place.',
  pay: 'Overdue wages need enough gold and a reachable treasury.',
  facility: 'Needs enough reachable capacity in the facilities required by this dwarf type.',
};

export function initializeMorale(w: World, a: Resident) {
  return (a.morale ??= {
    unmet: { food: 0, accommodation: 0, pay: 0, facility: 0 },
    active: [],
    leaving: false,
    blocked: false,
  });
}

function missingSupport(w: World) {
  const residents = w.agents.filter(a => alive(a) && !isConstruct(a.type)).sort((a, b) => a.id - b.id);
  const components: Set<string>[] = [];
  const routes = new Map<number, Set<string>>();
  for (const a of residents) {
    const position = key({ x: Math.round(a.x), z: Math.round(a.z) });
    let component = components.find((cells) => cells.has(position));
    if (!component) {
      component = reachable(w, a);
      components.push(component);
    }
    routes.set(a.id, component);
  }
  const result = new Map<number, MoraleCause[]>();
  // Routes and room access remain unchanged throughout this support decision.
  const usableByComponent = new Map<Set<string>, World['roomServices']>();
  for (const a of residents) {
    const route = routes.get(a.id)!;
    let usable = usableByComponent.get(route);
    if (!usable) {
      usable = w.roomServices.filter((s) => route.has(key(s.access)) && canStand(w, s.access));
      usableByComponent.set(route, usable);
    }
    const active: MoraleCause[] = [];
    if (!isAnimal(a.type) && !usable.some((s) => s.service === 'dining' && s.assigned === a.id)) active.push('food');
    if (!usable.some((s) => s.service === 'rest' && s.assigned === a.id)) active.push('accommodation');
    const wage = a.pay?.due.length ? wageStatus(w, a) : undefined;
    if (wage?.overdue && (wage.state === 'no-gold' || wage.state === 'no-access')) active.push('pay');
    for (const service of characterById(a.type)?.attractionServices ?? []) {
      const capacity = usable.filter((s) => s.service === service).length;
      const position = residents.filter(
        (o) =>
          o.id <= a.id &&
          routes.get(o.id) === route &&
          characterById(o.type)?.attractionServices.includes(service),
      ).length;
      if (position > capacity) {
        active.push('facility');
        break;
      }
    }
    result.set(a.id, active);
  }
  return result;
}

export function tickMorale(w: World, dt: number) {
  if (w.outcome) return;
  const shortages = missingSupport(w);
  for (const a of w.agents.filter(a => alive(a) && !isConstruct(a.type))) {
    const state = initializeMorale(w, a);
    state.active = shortages.get(a.id) ?? [];
    for (const cause of moraleCauses)
      state.unmet[cause] = state.active.includes(cause)
        ? state.unmet[cause] + dt
        : Math.max(0, state.unmet[cause] - dt * tuning.moraleRecoveryRate);
    const leaving = state.active.some(
      (cause) => state.unmet[cause] >= tuning.moraleGraceSeconds + tuning.moraleDepartureSeconds,
    );
    if (leaving && !state.leaving) {
      state.leaving = true;
      state.departureAt = w.elapsed;
      state.destination = undefined;
      state.blocked = false;
      releaseJob(w, a, 'Persistent unmet needs: leaving through the Hearth');
      a.combatTarget = undefined;
      a.rallying = false;
      w.revision++;
    } else if (!leaving && state.leaving) {
      state.leaving = false;
      state.blocked = false;
      state.destination = undefined;
      state.departureAt = undefined;
      a.path = [];
      a.retry = 0;
      a.activity = 'Needs restored; staying in the stronghold';
      w.revision++;
    }
  }
  // A warning that has ended can be shown again if a future shortage develops.
  for (const cause of moraleCauses)
    if (
      !w.agents.some(
        (a) => a.morale?.active.includes(cause) && a.morale.unmet[cause] >= tuning.moraleGraceSeconds,
      )
    )
      delete w.moraleDismissed?.[cause];
}

export function moraleStatus(w: World, a: Resident) {
  const state = a.morale;
  const causes = (state?.active ?? []).map((id) => ({
    id,
    label: causeLabels[id],
    message: causeMessages[id],
    seconds: state!.unmet[id],
    severity:
      state!.unmet[id] >= tuning.moraleGraceSeconds + tuning.moraleDepartureSeconds
        ? ('leaving' as const)
        : state!.unmet[id] >= tuning.moraleGraceSeconds
          ? ('warning' as const)
          : ('grace' as const),
  }));
  const worst = Math.max(0, ...Object.values(state?.unmet ?? {}));
  const stage = state?.leaving
    ? state.blocked
      ? ('blocked' as const)
      : ('leaving' as const)
    : causes.some((c) => c.severity === 'warning')
      ? ('unhappy' as const)
      : worst > tuning.moraleGraceSeconds
        ? ('recovering' as const)
        : ('content' as const);
  return {
    stage,
    causes,
    dissatisfaction: Math.max(
      0,
      Math.min(1, (worst - tuning.moraleGraceSeconds) / tuning.moraleDepartureSeconds),
    ),
    message:
      stage === 'blocked'
        ? 'Leaving: no open route to the starting Hearth.'
        : stage === 'leaving'
          ? 'Leaving through the starting Hearth.'
          : stage === 'unhappy'
            ? causes
                .filter((c) => c.severity !== 'grace')
                .map((c) => c.message)
                .join(' ')
            : stage === 'recovering'
              ? 'Support restored; dissatisfaction is recovering.'
              : causes.length
                ? 'Settling in; temporary shortages are within the grace period.'
                : 'Needs are supported.',
  };
}

export function moraleAlerts(w: World) {
  return moraleCauses.flatMap((id) => {
    const residents = w.agents.filter(
      (a) => alive(a) && !isConstruct(a.type) && a.morale?.active.includes(id) && a.morale.unmet[id] >= tuning.moraleGraceSeconds,
    );
    if (!residents.length) return [];
    const severity: MoraleSeverity = residents.some(
      (a) => a.morale!.unmet[id] >= tuning.moraleGraceSeconds + tuning.moraleDepartureSeconds,
    )
      ? 'leaving'
      : 'warning';
    if (w.moraleDismissed?.[id] === severity) return [];
    return [
      {
        id,
        title: causeLabels[id],
        message: causeMessages[id],
        severity,
        count: residents.length,
        residentIds: residents.map((a) => a.id),
      },
    ];
  });
}

export function dismissMoraleAlert(w: World, cause: MoraleCause) {
  const alert = moraleAlerts(w).find((a) => a.id === cause);
  if (!alert) return 'This need warning is no longer active.';
  (w.moraleDismissed ??= {})[cause] = alert.severity;
  w.revision++;
  return 'Need warning dismissed.';
}

export function moraleSummary(w: World) {
  const states = w.agents.filter(a => alive(a) && !isConstruct(a.type)).map((a) => moraleStatus(w, a).stage);
  return {
    content: states.filter((s) => s === 'content').length,
    unhappy: states.filter((s) => s === 'unhappy').length,
    recovering: states.filter((s) => s === 'recovering').length,
    leaving: states.filter((s) => s === 'leaving' || s === 'blocked').length,
    blocked: states.filter((s) => s === 'blocked').length,
    departed: w.departures?.length ?? 0,
    alerts: moraleAlerts(w),
  };
}

export function tickDeparture(w: World, a: Resident, dt: number) {
  const state = a.morale;
  if (isConstruct(a.type) || w.outcome || !state?.leaving) return false;
  if (a.job) releaseJob(w, a, 'Leaving through the Hearth');
  const exit = hearthArrival(w);
  if (!exit) {
    state.blocked = true;
    a.path = [];
    a.activity = 'Leaving: Hearth exit is blocked';
    return true;
  }
  if (!state.destination || key(state.destination) !== key(exit) || !a.path.length) {
    const path = findPath(w, a, exit);
    if (!path) {
      state.blocked = true;
      a.path = [];
      a.activity = 'Leaving: no route to the Hearth';
      return true;
    }
    state.destination = { ...exit };
    a.path = path;
  }
  state.blocked = false;
  moveResident(w, a, dt);
  a.activity = 'Leaving through the Hearth';
  if (Math.hypot(a.x - exit.x, a.z - exit.z) > tuning.arrivalDistance * 2) return true;
  // Gold remains in the settlement. A departure never destroys a carried bag.
  const floor = tileAt(w, Math.round(a.x), Math.round(a.z))!;
  floor.loose += a.carrying;
  a.carrying = 0;
  a.cargoOrigin = undefined;
  a.path = [];
  for (const service of w.roomServices) if (service.assigned === a.id) service.assigned = undefined;
  (w.departures ??= []).push({
    id: a.id,
    name: a.name,
    type: a.type,
    at: w.elapsed,
    causes: [...state.active],
  });
  if (w.departures.length > 30) w.departures.shift();
  w.agents = w.agents.filter((o) => o !== a);
  assignRoomSupport(w);
  // Capacity freed by this exit can resolve another resident's shortage before
  // their turn in the same simulation tick. Re-evaluate without advancing grief.
  tickMorale(w, 0);
  w.routesChanged = true;
  w.revision++;
  return true;
}
