import { type World, type Point, key } from './types.ts';
import { characterDefinitions, characterById, isConstruct, isAnimal } from '../content/characters.ts';
import { tuning } from '../content/tuning.ts';
import { canStand, reachable } from './navigation.ts';
import { alive } from './spell-effects.ts';
import { goldTotal, spendGold } from './rooms.ts';
import { notify } from './notifications.ts';
import { roleAllowed, availabilityReason } from './availability.ts';
export function hearthArrival(w: World): Point | undefined {
  const chest = w.roomServices.find((f) => f.id === 'hearth-treasury');
  const approaches = chest
    ? [chest.access]
    : [
        { x: w.hearth.x, z: w.hearth.z - 2 },
        { x: w.hearth.x + 2, z: w.hearth.z },
        { x: w.hearth.x, z: w.hearth.z + 2 },
        { x: w.hearth.x - 2, z: w.hearth.z },
      ];
  return approaches.find((p) => canStand(w, p));
}
function arrivalSupport(w: World) {
  const start = hearthArrival(w),
    routes = start ? reachable(w, start) : new Set<string>();
  const usable = w.roomServices.filter((f) => routes.has(key(f.access)));
  const residents = w.agents.filter((a) => alive(a) && !isConstruct(a.type));
  const bedCapacity = usable.filter((f) => f.service === 'rest').length;
  return {
    start,
    usable,
    residents,
    bedCapacity,
    beds: bedCapacity - residents.length,
    food:
      usable.filter((f) => f.service === 'dining').length - residents.filter((a) => !isAnimal(a.type)).length,
  };
}
function status(w: World, type: string, support: ReturnType<typeof arrivalSupport>, ignoreBeds = false) {
  const no = (message: string) => ({ eligible: false, message, capacity: 0 });
  if (w.outcome) return no('The level has ended.');
  if (!roleAllowed(w, type)) return no(availabilityReason(w, 'roles', type));
  const def = characterById(type);
  if (!def) return no('Unknown resident type.');
  if (!support.start) return no('Needs an open Hearth arrival route.');
  if (def.construct)
    return { eligible: true, message: 'Hearth arrival route is available.', capacity: Infinity };
  const { usable, residents, bedCapacity } = support,
    beds = ignoreBeds ? Infinity : support.beds;
  if (def.animal) {
    if (!bedCapacity || beds <= 0) return no('Needs a spare reachable Dormitory place.');
    return {
      eligible: true,
      message: 'One spare Dormitory place supplies food and rest; no wages or training.',
      capacity: beds,
    };
  }
  let slots = Infinity;
  for (const service of def.attractionServices) {
    const capacity = usable.filter((f) => f.service === service).length;
    if (!capacity) return no(`Needs accessible ${service} capacity.`);
    const count = residents.filter((a) => characterById(a.type)?.attractionServices.includes(service)).length;
    if (capacity <= count) return no(`Needs spare ${service} capacity.`);
    slots = Math.min(slots, capacity - count);
  }
  if (beds <= 0) return no('Needs spare bed capacity.');
  const foodSlots = support.food;
  if (foodSlots <= 0) return no('Needs spare Kitchen food capacity.');
  return {
    eligible: true,
    message: 'Room and settlement support are available.',
    capacity: Math.floor(Math.min(slots, beds, foodSlots)),
  };
}
export const recruitmentStatus = (w: World, type: string) => status(w, type, arrivalSupport(w));
export const attractionStatus = (w: World, type: string) => recruitmentStatus(w, type).message;
export function enableRecruitment(w: World, enabled = true) {
  if (w.outcome) return;
  w.recruitment ??= {
    enabled,
    nextAt: w.elapsed,
    cursor: 0,
    readyAt: {},
    dormitoryFull: false,
    fullEpisode: 0,
  };
  w.recruitment.enabled = enabled;
  w.recruitment.seenTypes ??= [...new Set(w.agents.map(a => a.type))];
  w.recruitment.nextAt = w.elapsed;
}
export const dormitoryFullMessage =
  'Dormitory is full. Expand it or build another to make room for more arrivals, including newly unlocked units.';
function updateDormitoryWarning(w: World, support: ReturnType<typeof arrivalSupport>) {
  const state = w.recruitment!;
  const full = state.enabled && support.bedCapacity > 0 && support.beds <= 0;
  if (full && !state.dormitoryFull) state.fullEpisode++;
  if (full !== state.dormitoryFull) w.revision++;
  state.dormitoryFull = full;
}
export function recruitmentSummary(w: World) {
  const state = w.recruitment;
  if (!state?.enabled) return 'Automatic arrivals are off in this room layout.';
  if (state.dormitoryFull) return dormitoryFullMessage;
  const def = characterById(state.preferred ?? '');
  if (!def) return 'Waiting for spare beds, food and supported room capacity.';
  const at = Math.max(
    state.readyAt[def.id] ?? w.elapsed,
    (state.lastArrivalAt ?? -Infinity) + tuning.arrivalSpacingSeconds,
  );
  return `Next preferred arrival: ${def.name} · ${Math.max(0, Math.ceil(at - w.elapsed))} seconds.`;
}
export function recruitSpecialist(w: World, spawn: (type: string, origin: Point) => boolean) {
  const state = w.recruitment;
  if (w.outcome || !state || w.elapsed < state.nextAt) return;
  // Recheck access and demand once per game second, independently of arrival cooldowns.
  state.nextAt = w.elapsed + 1;
  const support = arrivalSupport(w);
  updateDormitoryWarning(w, support);
  if (!state.enabled) return;
  const candidates = characterDefinitions.filter((d) => d.recruitment);
  const pool = candidates
    .flatMap((def, index) => {
      if (!status(w, def.id, support, true).eligible) {
        delete state.readyAt[def.id];
        return [];
      }
      const rule = def.recruitment!;
      state.readyAt[def.id] ??= w.elapsed + rule.seconds;
      if (!status(w, def.id, support).eligible) return [];
      const count = support.residents.filter((a) => a.type === def.id).length;
      const orders =
        rule.work === 'craft'
          ? w.craftOrders.filter((o) => o.state !== 'done').length
          : rule.work === 'research'
            ? (w.researchOrders ?? []).filter((o) => !o.paused && o.state !== 'ready').length
            : 0;
      const desired = Math.max(1, Math.ceil(orders / tuning.ordersPerSpecialist));
      if (rule.work && count >= desired) return [];
      return [
        { def, index, priority: rule.work ? 0 : 1, fill: rule.work ? count / desired : count / rule.weight },
      ];
    })
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        a.fill - b.fill ||
        ((a.index - state.cursor + candidates.length) % candidates.length) -
          ((b.index - state.cursor + candidates.length) % candidates.length),
    );
  const next = pool[0];
  state.preferred = next?.def.id;
  // Choose the needed role before checking its timer. A faster hound cannot consume
  // the last bed while a newly supported Warrior or needed specialist is on the way.
  if (
    !next ||
    w.elapsed < state.readyAt[next.def.id] ||
    w.elapsed < (state.lastArrivalAt ?? -Infinity) + tuning.arrivalSpacingSeconds
  )
    return;
  state.seenTypes ??= [...new Set(w.agents.map(a => a.type))];
  if (spawn(next.def.id, support.start!)) {
    if (!state.seenTypes.includes(next.def.id)) {
      state.seenTypes.push(next.def.id);
      const resident = w.agents.find(a => a.type === next.def.id && alive(a));
      if (resident) notify(w, {
        key: `arrival:${next.def.id}`, category: 'Arrival', icon: next.def.id,
        title: `${next.def.name} joined your stronghold`, priority: 'info', event: true,
        message: `${resident.name} is your first ${next.def.name} in this area. Your stronghold now attracts this type of resident.`,
        sources: [{ kind: 'resident', id: resident.id }], locateLabel: 'Meet new arrival',
        action: { kind: 'panel', value: 'dwarfs', label: 'View workforce' },
      });
    }
    state.readyAt[next.def.id] = w.elapsed + next.def.recruitment!.seconds;
    state.lastArrivalAt = w.elapsed;
    state.cursor = (next.index + 1) % candidates.length;
    updateDormitoryWarning(w, arrivalSupport(w));
    w.revision++;
  }
}
export const livingMiners = (w: World) => w.agents.filter((a) => a.type === 'miner' && alive(a)).length;
export function stonehandPurchaseStatus(w: World) {
  const stonehands = w.agents.filter((a) => a.type === 'stonehand' && alive(a)).length;
  const result = {
    ...recruitmentStatus(w, 'stonehand'),
    price: tuning.minerMinimumCost + tuning.minerCostStep * stonehands,
    stonehands,
  };
  if (!result.eligible) return result;
  const routes = reachable(w, hearthArrival(w)!);
  if (
    !w.tiles.some(
      (t) =>
        t.claimed &&
        canStand(w, t) &&
        routes.has(key(t)) &&
        !w.agents.some((a) => Math.hypot(a.x - t.x, a.z - t.z) < 0.6),
    )
  )
    return { ...result, eligible: false, message: 'Needs a free arrival square beside the Hearth.' };
  if (goldTotal(w) < result.price)
    return { ...result, eligible: false, message: `Needs ${result.price} gold to create a Stonehand.` };
  return { ...result, message: 'Ready at the Hearth. No food, beds or wages.' };
}
export function purchaseStonehand(w: World, spawn: (type: string, origin: Point) => boolean) {
  const status = stonehandPurchaseStatus(w);
  if (!status.eligible) return { ok: false, message: status.message, price: status.price };
  if (!spawn('stonehand', hearthArrival(w)!))
    return { ok: false, message: 'No free Stonehand arrival square.', price: status.price };
  spendGold(w, status.price);
  w.revision++;
  return { ok: true, message: `Stonehand assembled for ${status.price} gold.`, price: status.price };
}
export const minerPrice = (w: World) => tuning.minerMinimumCost + tuning.minerCostStep * livingMiners(w);
export function minerPurchaseStatus(w: World) {
  const status = recruitmentStatus(w, 'miner'),
    price = minerPrice(w),
    miners = livingMiners(w);
  const result = { ...status, price, miners };
  if (!status.eligible) return result;
  const start = hearthArrival(w)!;
  const routes = reachable(w, start);
  if (
    !w.tiles.some(
      (t) =>
        t.claimed &&
        canStand(w, t) &&
        routes.has(key(t)) &&
        !w.agents.some((a) => Math.hypot(a.x - t.x, a.z - t.z) < 0.6),
    )
  )
    return { ...result, eligible: false, message: 'Needs a free arrival square beside the Hearth.' };
  if (goldTotal(w) < price)
    return { ...result, eligible: false, message: `Needs ${price} gold to recruit a Miner.` };
  return { ...result, message: 'Spare beds, Kitchen support and an arrival route are available.' };
}
// The callback is the normal synchronous addResidents service; a failed arrival is never charged.
export function purchaseMiner(w: World, spawn: (type: string, origin: Point) => boolean) {
  const status = minerPurchaseStatus(w);
  if (!status.eligible) return { ok: false, message: status.message, price: status.price };
  const origin = hearthArrival(w)!;
  if (!spawn('miner', origin))
    return { ok: false, message: 'No free Miner arrival square.', price: status.price };
  spendGold(w, status.price);
  w.revision++;
  return { ok: true, message: `Miner recruited for ${status.price} gold.`, price: status.price };
}
