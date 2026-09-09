import { audioCues, audioSettings, audioTuning, biomeAudio, type CueDefinition } from '../content/audio';
import { AudioEvents, type AudioEvent } from '../game/audio-events';
import { visible } from '../game/spell-effects';
import type { Point, World } from '../game/types';

/** One session graph. All one-shots are bounded and all sustained voices have an owner. */
export class GameAudio {
  context?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private effects?: GainNode;
  private ambient?: GainNode;
  private noise?: AudioBuffer;
  private voices = new Set<AudioScheduledSourceNode>();
  private beds: AudioScheduledSourceNode[] = [];
  private collector = new AudioEvents();
  private world?: World;
  private active = false;
  private biome = '';
  private recent = new Map<string, number>();
  private nextNote = 0;
  private note = 0;
  private battleUntil = 0;
  private duckUntil = 0;
  played = 0;
  dropped = 0;
  /** Useful in development; exposes graph counts, never simulation mutation. */
  get status() { return { state: this.context?.state ?? 'locked', voices: this.voices.size, beds: this.beds.length, played: this.played, dropped: this.dropped, active: this.active, biome: this.biome }; }
  async unlock() {
    try {
      if (!this.context) {
        const c = this.context = new AudioContext();
        this.master = c.createGain(); this.music = c.createGain(); this.effects = c.createGain(); this.ambient = c.createGain();
        this.music.connect(this.master); this.effects.connect(this.master); this.ambient.connect(this.effects); this.master.connect(c.destination);
        this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
        const data = this.noise.getChannelData(0); let seed = 4271;
        for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = (seed / 4294967296) * 2 - 1; }
      }
      if (this.context.state === 'suspended') await this.context.resume();
      this.applySettings();
    } catch { /* Visual gameplay remains fully usable when the browser has no audio device. */ }
  }
  applySettings() {
    const c = this.context; if (!c || !this.master || !this.music || !this.effects) return;
    this.master.gain.setTargetAtTime(audioSettings.muted ? 0 : audioSettings.master, c.currentTime, 0.025);
    this.music.gain.setTargetAtTime(audioSettings.music * (c.currentTime < this.duckUntil ? .3 : 1), c.currentTime, 0.025);
    this.effects.gain.setTargetAtTime(audioSettings.effects, c.currentTime, 0.025);
  }
  private stop() {
    for (const voice of [...this.voices, ...this.beds]) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.voices.clear(); this.beds = []; this.recent.clear(); this.nextNote = 0;
  }
  suspend() { this.active = false; this.stop(); }
  dispose() { this.suspend(); void this.context?.close(); }
  update(w: World, listener: Point, running: boolean) {
    if (this.world !== w) { this.stop(); this.world = w; this.collector.reset(); this.biome = ''; this.battleUntil = 0; this.note = 0; }
    const events = this.collector.sample(w);
    if (!running) { if (this.active) this.suspend(); return; }
    this.active = true;
    const c = this.context;
    if (!c || c.state !== 'running') return;
    this.applySettings();
    const biome = w.biome ?? 'upper';
    if (this.biome !== biome) { this.stop(); this.biome = biome; }
    if (!this.beds.length && !w.outcome) this.startBed(biome);
    // Only visible recent attacks can change the score. Distant hidden battles remain silent.
    if ((w.enemies ?? []).some(e => visible(w, e) && w.elapsed - (e.attackedAt ?? -100) < 1)) this.battleUntil = c.currentTime + 7;
    for (const event of events.sort((a, b) => Number(!!b.critical) - Number(!!a.critical))) this.play(event, listener);
    if (w.outcome) { for (const source of this.beds) { try { source.stop(); } catch {} } this.beds = []; return; }
    if (c.currentTime >= this.nextNote) {
      const palette = biomeAudio[biome] ?? biomeAudio.upper, combat = c.currentTime < this.battleUntil;
      const frequency = palette.root * palette.notes[this.note++ % palette.notes.length] * (combat ? 2 : 4);
      this.tone({ frequency, duration: combat ? 1.3 : 3.6, gain: combat ? 0.045 : 0.035 }, this.music!);
      if (combat) this.tone({ frequency: palette.root, end: palette.root / 2, duration: 0.35, gain: 0.09, noise: 0.25 }, this.music!);
      this.nextNote = c.currentTime + (combat ? 1.8 : audioTuning.musicGap);
    }
  }
  private startBed(biome: string) {
    const c = this.context!, palette = biomeAudio[biome] ?? biomeAudio.upper;
    const noise = c.createBufferSource(), filter = c.createBiquadFilter();
    noise.buffer = this.noise!; noise.loop = true; filter.type = 'lowpass'; filter.frequency.value = palette.air;
    this.ambient!.gain.value = 0.045; noise.connect(filter); filter.connect(this.ambient!); noise.start();
    noise.onended = () => { noise.disconnect(); filter.disconnect(); };
    this.beds.push(noise);
    const drone = c.createOscillator(), gain = c.createGain(); drone.frequency.value = palette.root; gain.gain.value = 0.025;
    drone.connect(gain); gain.connect(this.music!); drone.start();
    drone.onended = () => { drone.disconnect(); gain.disconnect(); }; this.beds.push(drone);
  }
  private play(event: AudioEvent, listener: Point) {
    const c = this.context!, cue = audioCues[event.cue];
    const distance = event.at ? Math.hypot(event.at.x - listener.x, event.at.z - listener.z) : 0;
    if (distance >= audioTuning.audibleRadius || (this.recent.get(event.cue) ?? -Infinity) + audioTuning.repeatSeconds > c.currentTime) { this.dropped++; return; }
    if (this.voices.size >= audioTuning.voices) {
      if (!event.critical) { this.dropped++; return; }
      const oldest = this.voices.values().next().value;
      if (oldest) { oldest.stop(); this.voices.delete(oldest); }
    }
    this.recent.set(event.cue, c.currentTime);
    // Distance attenuation without precise stereo cues; warnings are always non-positional.
    const gain = cue.gain * Math.pow(Math.max(0, 1 - distance / audioTuning.audibleRadius), 1.4);
    this.tone({ ...cue, gain }, this.effects!); this.played++;
    if (event.critical) { this.duckUntil = c.currentTime + cue.duration; this.applySettings(); }
  }
  private tone(cue: CueDefinition, output: AudioNode) {
    const c = this.context!; if (this.voices.size >= audioTuning.voices) return;
    const gain = c.createGain(), oscillator = c.createOscillator(), now = c.currentTime;
    oscillator.type = cue.wave ?? 'sine'; oscillator.frequency.setValueAtTime(cue.frequency, now);
    if (cue.end) oscillator.frequency.exponentialRampToValueAtTime(cue.end, now + cue.duration);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(cue.gain, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    oscillator.connect(gain); gain.connect(output); this.voices.add(oscillator);
    let noise: AudioBufferSourceNode | undefined, noiseGain: GainNode | undefined;
    if (cue.noise) { noise = c.createBufferSource(); noise.buffer = this.noise!; noiseGain = c.createGain(); noiseGain.gain.value = cue.noise * 0.35; noise.connect(noiseGain); noiseGain.connect(gain); noise.start(now); noise.stop(now + cue.duration); }
    oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); try { noise?.stop(); } catch {} noise?.disconnect(); noiseGain?.disconnect(); gain.disconnect(); };
    oscillator.start(now); oscillator.stop(now + cue.duration + 0.01);
  }
}
