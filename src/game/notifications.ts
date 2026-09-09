import type { Point, World } from './types.ts';
import { tileAt } from './types.ts';
import { alive, visible } from './spell-effects.ts';

export type NotificationSource = { kind: 'point'; point: Point } | { kind: 'resident' | 'enemy'; id: number };
export type NotificationAction = { kind: 'panel' | 'tool'; value: string; label: string };
export interface NotificationInput {
  /** Stable problem/subject key. Changing episode raises a fresh report. */
  key: string;
  episode?: string | number;
  category: string;
  icon: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'danger';
  sources?: NotificationSource[];
  locateLabel?: string;
  action?: NotificationAction;
  /** Event reports remain until acknowledged; conditions resolve when absent. */
  event?: boolean;
}
export interface Notification extends NotificationInput {
  id: number;
  at: number;
  active: boolean;
  dismissed: boolean;
  read: boolean;
}
const states = new WeakMap<
  World,
  { nextId: number; active: Map<string, Notification>; history: Notification[] }
>();
export const notificationSettings = { historyLimit: 40, combatQuietSeconds: 12, hearthQuietSeconds: 15 };
export const notificationRank = { info: 0, warning: 1, danger: 2 };
function state(w: World) {
  let s = states.get(w);
  if (!s) {
    s = { nextId: 1, active: new Map(), history: [] };
    states.set(w, s);
  }
  return s;
}
/** Simulation-owned reports; no DOM, renderer, or notification-type switch. */
export function notify(w: World, input: NotificationInput) {
  const s = state(w),
    previous = s.active.get(input.key);
  if (previous && previous.episode === input.episode) {
    Object.assign(previous, input);
    return previous;
  }
  if (previous) previous.active = false;
  const report: Notification = {
    ...input,
    id: s.nextId++,
    at: w.elapsed,
    active: true,
    dismissed: false,
    read: false,
  };
  s.active.set(input.key, report);
  s.history.push(report);
  for (const old of s.history.splice(0, Math.max(0, s.history.length - notificationSettings.historyLimit))) {
    if (old.event && s.active.get(old.key) === old) {
      old.active = false;
      s.active.delete(old.key);
    }
  }
  return report;
}
export function syncNotifications(w: World, conditions: NotificationInput[]) {
  const s = state(w),
    keys = new Set(conditions.map((n) => n.key));
  for (const [key, report] of s.active) {
    if (w.outcome || (!report.event && !keys.has(key))) {
      report.active = false;
      s.active.delete(key);
    }
  }
  if (!w.outcome) for (const input of conditions) notify(w, input);
}
export function activeNotifications(w: World) {
  return [...state(w).active.values()]
    .filter((n) => !n.dismissed)
    .sort((a, b) => notificationRank[b.priority] - notificationRank[a.priority] || b.id - a.id);
}
export const notificationHistory = (w: World) => [...state(w).history].reverse();
export function dismissNotification(w: World, id: number) {
  const s = state(w),
    report = [...s.active.values()].find((n) => n.id === id);
  if (!report) return;
  report.dismissed = true;
  report.read = true;
  if (report.event) {
    report.active = false;
    s.active.delete(report.key);
  }
}
export function reopenNotifications(w: World, category: string) {
  for (const report of state(w).active.values()) if (report.category === category) report.dismissed = false;
}
export const hasDismissedNotifications = (w: World, category: string) =>
  [...state(w).active.values()].some((n) => n.category === category && n.dismissed);
/** Re-resolve on every use: never follow a stale unit or disclose hidden terrain. */
export function notificationLocation(w: World, source: NotificationSource) {
  const p =
    source.kind === 'point'
      ? source.point
      : source.kind === 'resident'
        ? w.agents.find((a) => a.id === source.id && alive(a))
        : w.enemies?.find((e) => e.id === source.id && e.health > 0 && visible(w, e));
  return p && tileAt(w, Math.round(p.x), Math.round(p.z))?.known ? { x: p.x, z: p.z } : undefined;
}
