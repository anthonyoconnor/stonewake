import { type World, type Resident, type RoomService } from './types.ts';
import { characterLevel } from '../content/characters.ts';
import { tuning } from '../content/tuning.ts';
import { canStand, findPath, reachable } from './navigation.ts';
import { goldTotal } from './rooms.ts';
import { alive } from './spell-effects.ts';
import { availableStations, take } from './jobs/common.ts';
import { key } from './types.ts';

export function initializePay(a: Resident) {
  return (a.pay ??= { due: [], paid: 0, collections: 0 });
}

export function tickPayday(w: World) {
  if (w.outcome) return;
  while (w.elapsed + 1e-8 >= w.nextPaydayAt) {
    for (const a of w.agents.filter(alive)) {
      const pay = initializePay(a);
      // Earned payments keep their value when tuning changes later.
      pay.due.push({ at: w.nextPaydayAt, amount: characterLevel(a.type, a.level).wage });
      a.retry = 0;
      w.revision++;
    }
    w.nextPaydayAt += tuning.paydaySeconds;
  }
}

function accessibleTreasuries(w: World, a: Resident) {
  const routes = reachable(w, a);
  return w.roomServices.filter(
    (f) => f.service === 'storage' && routes.has(key(f.access)) && canStand(w, f.access),
  );
}

function availablePayStations(w: World, a: Resident) {
  return availableStations(w, a, 'storage').filter((f) => findPath(w, a, f.access));
}

function funding(w: World, a: Resident, amount: number) {
  const treasuries = accessibleTreasuries(w, a);
  if (!treasuries.length) return { state: 'no-access' as const, treasuries };
  if (goldTotal(w) < amount) return { state: 'no-gold' as const, treasuries };
  const usable = w.allowance + treasuries.reduce((sum, f) => sum + f.stored, 0);
  if (usable < amount) return { state: 'no-access' as const, treasuries };
  return { state: 'due' as const, treasuries };
}

export function wageStatus(w: World, a: Resident) {
  const pay = a.pay;
  const pending = pay?.due ?? [];
  const nextAt = w.nextPaydayAt;
  const details = {
    due: pending.reduce((sum, p) => sum + p.amount, 0),
    payments: pending.length,
    nextAt,
    overdue: !!pending.length && w.elapsed - pending[0].at >= tuning.wageGraceSeconds,
    paid: pay?.paid ?? 0,
    collections: pay?.collections ?? 0,
  };
  if (!pending.length)
    return {
      ...details,
      state: 'settled' as const,
      message: `Next wage in ${Math.max(0, Math.ceil(nextAt - w.elapsed))} seconds.`,
    };
  const funds = funding(w, a, pending[0].amount);
  if (funds.state === 'no-access')
    return {
      ...details,
      state: funds.state,
      message: 'Wages waiting: no accessible treasury with enough reachable gold.',
    };
  if (funds.state === 'no-gold')
    return {
      ...details,
      state: funds.state,
      message: `Wages waiting: not enough gold for the next ${pending[0].amount}-gold payment.`,
    };
  if (a.job?.kind === 'pay')
    return { ...details, state: 'collecting' as const, message: 'Visiting the treasury to collect wages.' };
  if (!availablePayStations(w, a).length)
    return { ...details, state: 'queued' as const, message: 'Waiting for a treasury collection space.' };
  return { ...details, state: 'due' as const, message: `${details.due} gold in wages due.` };
}

export function payrollStatus(w: World) {
  const statuses = w.agents.filter(alive).map((a) => wageStatus(w, a));
  return {
    due: statuses.reduce((sum, p) => sum + p.due, 0),
    unpaid: statuses.filter((p) => p.payments > 0).length,
    overdue: statuses.filter((p) => p.overdue).length,
    noGold: statuses.filter((p) => p.state === 'no-gold').length,
    noAccess: statuses.filter((p) => p.state === 'no-access').length,
    nextAt: w.nextPaydayAt,
  };
}

export function choosePayJob(w: World, a: Resident) {
  const pending = a.pay?.due[0];
  if (!pending || funding(w, a, pending.amount).state !== 'due') return false;
  for (const f of availablePayStations(w, a)) if (take(w, a, 'pay', f, f.access, f.id)) return true;
  return false;
}

export function shouldSeekPay(w: World, a: Resident) {
  if (
    !a.job ||
    ['pay', 'eat', 'sleep', 'collect', 'deliver', 'drop'].includes(a.job.kind) ||
    a.carrying ||
    a.energy < tuning.restThreshold ||
    a.hunger < tuning.hungerThreshold ||
    !a.pay?.due.length
  )
    return false;
  return funding(w, a, a.pay.due[0].amount).state === 'due' && availablePayStations(w, a).length > 0;
}

export function validPayJob(w: World, a: Resident) {
  const j = a.job;
  if (!j || !a.pay?.due.length || !canStand(w, j.work)) return false;
  return w.roomServices.some(
    (f) => f.id === j.furnishing && f.service === 'storage' && key(f.access) === key(j.work),
  );
}

function withdraw(w: World, treasuries: RoomService[], amount: number) {
  // Only these reachable reserves participate; the starting allowance is spendable at any treasury.
  w.spent += amount;
  const grant = Math.min(amount, w.allowance);
  w.allowance -= grant;
  amount -= grant;
  for (const f of treasuries) {
    const debit = Math.min(amount, f.stored);
    f.stored -= debit;
    amount -= debit;
  }
}

export function collectWage(w: World, a: Resident) {
  const j = a.job;
  if (!j || !validPayJob(w, a)) return true;
  a.activity = 'Collecting wages';
  if (Math.hypot(a.x - j.work.x, a.z - j.work.z) > tuning.arrivalDistance * 2) return false;
  if (j.progress < tuning.wageCollectionSeconds) return false;
  const payment = a.pay!.due[0];
  const funds = funding(w, a, payment.amount);
  // Building, casting or another collector may have spent the balance during the journey.
  if (funds.state !== 'due') {
    a.activity = funds.state === 'no-gold' ? 'Waiting for wage gold' : 'Waiting for accessible wage gold';
    a.retry = tuning.retrySeconds;
    return true;
  }
  withdraw(w, funds.treasuries, payment.amount);
  a.pay!.due.shift();
  a.pay!.paid += payment.amount;
  a.pay!.collections++;
  w.revision++;
  return true;
}
