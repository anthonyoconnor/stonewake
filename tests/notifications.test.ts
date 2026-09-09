import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomLab } from '../src/content/room-lab.ts';
import { createEncounterLab } from '../src/content/encounter-lab.ts';
import { refreshNotifications, notificationSources } from '../src/content/notifications.ts';
import {
  activeNotifications,
  notificationHistory,
  syncNotifications,
  notify,
  dismissNotification,
  notificationLocation,
  reopenNotifications,
  type NotificationInput,
} from '../src/game/notifications.ts';
import { enableRecruitment } from '../src/game/recruitment.ts';
import { buildRoom } from '../src/game/rooms.ts';
import { addResidents } from '../src/game/simulation.ts';
import { addEnemy } from '../src/game/defenses.ts';
import { damageEnemy, damageResident } from '../src/game/spell-effects.ts';
import { run, rect } from './helpers/simulation.ts';

const input: NotificationInput = {
  key: 'test',
  category: 'Test',
  title: 'Test report',
  message: 'Original',
  icon: 'guard',
  priority: 'warning',
};
test('conditions group updates, preserve acknowledgement, reopen on escalation and form new episodes after recovery', () => {
  const w = createRoomLab();
  syncNotifications(w, [input]);
  const first = activeNotifications(w)[0];
  dismissNotification(w, first.id);
  syncNotifications(w, [{ ...input, message: 'Still happening' }]);
  assert.equal(activeNotifications(w).length, 0);
  assert.equal(notificationHistory(w).length, 1);
  assert.equal(notificationHistory(w)[0].message, 'Still happening');
  syncNotifications(w, [{ ...input, episode: 'leaving', priority: 'danger' }]);
  assert.notEqual(activeNotifications(w)[0].id, first.id);
  syncNotifications(w, []);
  syncNotifications(w, [input]);
  assert.equal(notificationHistory(w).length, 3);
  assert.equal(activeNotifications(w).length, 1);
});
test('event history is bounded, isolated per world and clears active reports at area end', () => {
  const w = createRoomLab(),
    other = createRoomLab();
  for (let i = 0; i < 55; i++) notify(w, { ...input, event: true, key: `event:${i}` });
  assert.equal(notificationHistory(w).length, 40);
  assert.equal(activeNotifications(w).length, 40);
  assert.equal(notificationHistory(other).length, 0);
  dismissNotification(w, activeNotifications(w)[0].id);
  assert.equal(activeNotifications(w).length, 39);
  w.outcome = 'victory';
  refreshNotifications(w);
  assert.equal(activeNotifications(w).length, 0);
  assert.equal(notificationHistory(w).length, 40);
});
test('actual recruitment reports a first type once, survives batched stepping and handles loss of the source', () => {
  const w = createRoomLab();
  buildRoom(w, 'dormitory', rect(8, 8, 4, 1));
  enableRecruitment(w);
  run(w, 125);
  const arrivals = notificationHistory(w).filter((n) => n.key.startsWith('arrival:'));
  assert.equal(w.agents.length, 4);
  assert.equal(arrivals.length, 1);
  assert.match(arrivals[0].title, /Cave Hound joined/);
  const source = arrivals[0].sources![0];
  assert(notificationLocation(w, source));
  dismissNotification(w, arrivals[0].id);
  const a = w.agents.find((a) => source.kind === 'resident' && a.id === source.id)!;
  damageResident(w, a, 1000);
  assert.equal(notificationLocation(w, source), undefined);
  run(w, 32);
  assert.equal(notificationHistory(w).filter((n) => n.key.startsWith('arrival:')).length, 1);
  assert.equal(activeNotifications(w).filter((n) => n.key.startsWith('arrival:')).length, 0);
  assert.equal(notificationHistory(w).filter((n) => n.key === 'dormitory').length, 2);
});
test('hidden threat warnings do not leak names or source positions and discovery enables locate', () => {
  const w = createEncounterLab();
  run(w, 13);
  const report = activeNotifications(w).find((n) => n.key === 'encounter:deep-entrance')!;
  assert.equal(report.title, 'Underground raid');
  assert.deepEqual(report.sources, []);
  assert(!notificationHistory(w).some((n) => n.key === 'encounter:buried-camp'));
  const source = w.encounters!.find((s) => s.definition.id === 'deep-entrance')!;
  source.discovered = true;
  const point = source.definition.positions[0];
  w.tiles[point.z * w.width + point.x].known = true;
  refreshNotifications(w);
  assert.equal(report.title, 'Deep entrance');
  assert.deepEqual(notificationLocation(w, report.sources![0]), point);
  w.tiles[point.z * w.width + point.x].known = false;
  assert.equal(notificationLocation(w, report.sources![0]), undefined);
});
test('real damage produces one combat episode with safe live targets, then resolves after quiet', () => {
  const w = createRoomLab();
  addResidents(w, 'warrior');
  w.elapsed = 1;
  const a = w.agents[0];
  addEnemy(w, { x: a.x + 1, z: a.z }, w.hearth, 'goblin-raider');
  const e = w.enemies!.at(-1)!;
  damageEnemy(w, e, 1, 'dwarf');
  damageResident(w, a, 1);
  refreshNotifications(w);
  const report = activeNotifications(w).find((n) => n.key === 'combat')!;
  assert(report.sources!.length >= 1);
  const original = report.id;
  dismissNotification(w, original);
  w.elapsed += 1;
  damageEnemy(w, e, 1, 'dwarf');
  refreshNotifications(w);
  assert(!activeNotifications(w).some((n) => n.key === 'combat'));
  e.health = 0;
  assert.equal(notificationLocation(w, { kind: 'enemy', id: e.id }), undefined);
  w.elapsed += 13;
  refreshNotifications(w);
  assert(!report.active);
  damageResident(w, a, 1);
  refreshNotifications(w);
  assert.notEqual(activeNotifications(w).find((n) => n.key === 'combat')!.id, original);
});
test('need groups can be reopened and newly registered content uses the same lifecycle', () => {
  const w = createRoomLab();
  addResidents(w, 'engineer');
  const a = w.agents[0];
  a.morale!.active = ['food'];
  a.morale!.unmet.food = 130;
  refreshNotifications(w);
  const report = activeNotifications(w).find((n) => n.key === 'need:food')!;
  dismissNotification(w, report.id);
  refreshNotifications(w);
  assert(!activeNotifications(w).some((n) => n.key === 'need:food'));
  reopenNotifications(w, 'Need');
  assert(activeNotifications(w).some((n) => n.id === report.id));
  notificationSources.push({ id: 'test-extension', collect: () => [input] });
  try {
    refreshNotifications(w);
    assert(activeNotifications(w).some((n) => n.key === 'test'));
  } finally {
    notificationSources.pop();
  }
});
