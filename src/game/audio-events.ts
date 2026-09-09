import { audioTuning, speciesCues, type AudioCue } from '../content/audio.ts';
import { notificationHistory } from './notifications.ts';
import { visible } from './spell-effects.ts';
import { tileAt, type Point, type World } from './types.ts';

export interface AudioEvent { cue: AudioCue; at?: Point; critical?: boolean; }
/** Read-only presentation adapter: observes earned state changes, never drives gameplay. */
export class AudioEvents {
  private world?: World;
  private values = new Map<string, string | number>();
  private tiles: string[] = [];
  private revision = -1;
  reset() { this.world = undefined; this.values.clear(); this.tiles = []; this.revision = -1; }
  sample(w: World): AudioEvent[] {
    const initial = this.world !== w;
    if (initial) { this.reset(); this.world = w; }
    const events: AudioEvent[] = [];
    const changed = (id: string, value: string | number) => {
      const previous = this.values.get(id); this.values.set(id, value);
      return !initial && previous !== undefined && previous !== value;
    };
    const emit = (cue: AudioCue, at?: Point, critical = false) => {
      if (!at || tileAt(w, Math.round(at.x), Math.round(at.z))?.known)
        events.push({ cue, at: at && { x: at.x, z: at.z }, critical });
    };
    for (const a of w.agents) {
      const id = `resident:${a.id}`, oldCargo = Number(this.values.get(`${id}:cargo`) ?? 0);
      if (changed(`${id}:cargo`, a.carrying) && oldCargo > a.carrying && a.job?.kind !== 'drop') emit('delivery', a);
      if (changed(`${id}:attack`, a.attackedAt ?? -1) && a.attackedAt !== undefined) emit(speciesCues[a.type] ?? 'metal', a);
      const oldX = Number(this.values.get(`${id}:x`) ?? a.x), oldZ = Number(this.values.get(`${id}:z`) ?? a.z);
      const distance = Number(this.values.get(`${id}:distance`) ?? 0) + Math.hypot(a.x - oldX, a.z - oldZ);
      this.values.set(`${id}:x`, a.x); this.values.set(`${id}:z`, a.z);
      this.values.set(`${id}:distance`, distance % audioTuning.footstepDistance);
      if (!initial && distance >= audioTuning.footstepDistance) emit('step', a);
      const j = a.job;
      if (j && !a.path.length && j.progress > 0) {
        const beat = Math.floor(j.progress / audioTuning.workBeat);
        if (changed(`${id}:work`, `${j.kind}:${j.target.x}:${j.target.z}:${beat}`)) {
          const cue = ({ mine: 'mine', reinforce: 'reinforce', buildBridge: 'reinforce', buildWall: 'reinforce', craft: 'craft', research: 'research', eat: 'room', train: 'room' } as Record<string, AudioCue>)[j.kind];
          if (cue && (cue !== 'research' && cue !== 'room' || beat % 4 === 0)) emit(cue, a);
        }
      }
    }
    for (const e of w.enemies ?? []) {
      const hit = changed(`enemy:${e.id}:attack`, e.attackedAt ?? -1);
      if (hit && visible(w, e)) emit(speciesCues[e.type ?? 'goblin-raider'] ?? 'metal', e);
    }
    for (const d of w.defenses ?? []) if (changed(`defense:${d.id}`, d.triggeredAt) && d.triggeredAt >= 0) emit('metal', d);
    for (const b of w.spellBursts ?? []) {
      const id = `spell:${b.id}:${b.at}`;
      if (!this.values.has(id) && !initial) emit('spell', b);
      this.values.set(id, 1);
    }
    if (this.revision !== w.revision) {
      for (let i = 0; i < w.tiles.length; i++) {
        const t = w.tiles[i], value = `${t.known}:${t.claimed}:${t.room ?? ''}:${!!t.bridge}:${!!t.reinforced}`;
        if (!initial && t.known && this.tiles[i]?.startsWith('true:') && this.tiles[i] !== value) {
          const old = this.tiles[i].split(':');
          if (t.room && old[2] !== t.room || t.bridge && old[3] !== 'true') emit('build', t);
          else if (t.claimed && old[1] !== 'true') emit('claim', t);
        }
        this.tiles[i] = value;
      }
      this.revision = w.revision;
    }
    const reports = notificationHistory(w), latest = reports[0]?.id ?? 0, prior = Number(this.values.get('report') ?? latest);
    if (!initial && reports.some(r => r.id > prior && r.priority !== 'info')) emit('warning', undefined, true);
    this.values.set('report', latest);
    if (changed('outcome', w.outcome ?? '') && w.outcome) emit(w.outcome, undefined, true);
    return events;
  }
}
