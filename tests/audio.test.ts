import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioEvents } from '../src/game/audio-events.ts';
import { createRoomLab } from '../src/content/room-lab.ts';
import { addResidents } from '../src/game/simulation.ts';
import { buildRoom } from '../src/game/rooms.ts';
import { notify } from '../src/game/notifications.ts';
import { audioCues, speciesCues } from '../src/content/audio.ts';
import { enemyDefinitions } from '../src/content/enemies.ts';

test('audio samples actual outcomes once, does not replay on world replacement and never mutates state', () => {
  const w = createRoomLab(), cues = new AudioEvents(); addResidents(w, 'warrior', 1, { x: 8, z: 8 });
  assert.deepEqual(cues.sample(w), []);
  w.agents[0].attackedAt = 1; w.elapsed = 1;
  const before = structuredClone(w);
  assert(cues.sample(w).some(e => e.cue === 'metal')); assert.deepEqual(w, before);
  assert.deepEqual(cues.sample(w), []);
  w.outcome = 'victory'; assert.deepEqual(cues.sample(w), [{ cue: 'victory', at: undefined, critical: true }]);
  assert.deepEqual(cues.sample(w), []); assert.deepEqual(cues.sample(structuredClone(w)), []);
});
test('hidden activity is silent while warning notifications remain audible without coordinates', () => {
  const w = createRoomLab(), cues = new AudioEvents(); addResidents(w, 'warrior', 1, { x: 8, z: 8 });
  const actor = w.agents[0]; w.tiles[Math.round(actor.z) * w.width + Math.round(actor.x)].known = false; cues.sample(w);
  w.agents[0].attackedAt = 1; assert.deepEqual(cues.sample(w), []);
  notify(w, { key: 'pressure', category: 'encounters', icon: '!', title: 'Raid', message: 'An approaching raid', priority: 'warning' });
  assert.deepEqual(cues.sample(w), [{ cue: 'warning', at: undefined, critical: true }]);
});
test('normal paid building and productive work generate cues, stationary pauses do not', () => {
  const w = createRoomLab(), cues = new AudioEvents(); addResidents(w, 'stonehand', 1, { x: 8, z: 8 }); cues.sample(w);
  assert.match(buildRoom(w, 'treasure', [{ x: 9, z: 8 }]), /built/);
  assert(cues.sample(w).some(e => e.cue === 'build'));
  w.agents[0].job = { kind: 'mine', target: { x: 8, z: 9 }, work: { x: 8, z: 8 }, progress: 0.2 }; cues.sample(w);
  w.agents[0].job.progress = 0.7;
  assert(cues.sample(w).some(e => e.cue === 'mine')); assert.deepEqual(cues.sample(w), []);
  for (const enemy of enemyDefinitions) assert(speciesCues[enemy.id] in audioCues, `${enemy.id} has an authored cue`);
});
