/** Original procedural score/cues: no downloaded recordings or external asset licenses. */
export const audioSettings = { master: 0.65, music: 0.35, effects: 0.7, muted: false };
export const audioTuning = { voices: 12, audibleRadius: 18, repeatSeconds: 0.16, workBeat: 0.5, footstepDistance: 1.5, musicGap: 7 };
export interface CueDefinition { frequency: number; end?: number; duration: number; gain: number; noise?: number; wave?: OscillatorType; }
export const audioCues = {
  mine: { frequency: 130, end: 55, duration: 0.15, gain: 0.15, noise: 0.7 },
  claim: { frequency: 320, end: 480, duration: 0.18, gain: 0.09 },
  reinforce: { frequency: 180, end: 75, duration: 0.12, gain: 0.12, noise: 0.5 },
  delivery: { frequency: 920, end: 670, duration: 0.24, gain: 0.1 },
  build: { frequency: 210, end: 100, duration: 0.3, gain: 0.13, noise: 0.35 },
  craft: { frequency: 640, end: 300, duration: 0.16, gain: 0.08, noise: 0.22 },
  research: { frequency: 440, end: 660, duration: 0.45, gain: 0.045 },
  room: { frequency: 220, duration: 0.14, gain: 0.035, noise: 0.35 },
  step: { frequency: 75, end: 45, duration: 0.075, gain: 0.04, noise: 0.55 },
  metal: { frequency: 360, end: 90, duration: 0.2, gain: 0.15, noise: 0.4 },
  bite: { frequency: 150, end: 70, duration: 0.17, gain: 0.15, noise: 0.7 },
  stone: { frequency: 80, end: 35, duration: 0.32, gain: 0.19, noise: 0.65 },
  crystal: { frequency: 1050, end: 470, duration: 0.4, gain: 0.1 },
  fire: { frequency: 170, end: 55, duration: 0.32, gain: 0.12, noise: 0.9 },
  spores: { frequency: 260, end: 80, duration: 0.36, gain: 0.1, noise: 0.8 },
  spell: { frequency: 330, end: 990, duration: 0.65, gain: 0.13 },
  warning: { frequency: 392, end: 294, duration: 0.65, gain: 0.2 },
  victory: { frequency: 523, end: 1046, duration: 1.5, gain: 0.18 },
  defeat: { frequency: 196, end: 49, duration: 1.8, gain: 0.19 },
} satisfies Record<string, CueDefinition>;
export type AudioCue = keyof typeof audioCues;
export const speciesCues: Record<string, AudioCue> = {
  'cave-hound': 'bite', 'goblin-raider': 'metal', 'tunnel-burrower': 'stone', 'cave-spider': 'bite',
  'spore-brute': 'spores', 'restless-guard': 'metal', 'ancient-sentinel': 'stone',
  'crystal-elemental': 'crystal', 'crystalback-stalker': 'crystal', cinderling: 'fire', deepmaw: 'stone',
};
export const biomeAudio: Record<string, { root: number; air: number; notes: number[] }> = {
  upper: { root: 65.41, air: 320, notes: [1, 1.5, 2, 1.25] },
  fungal: { root: 58.27, air: 560, notes: [1, 1.2, 1.5, 2] },
  ancient: { root: 55, air: 240, notes: [1, 1.5, 1.125, 2] },
  crystal: { root: 73.42, air: 820, notes: [1, 1.5, 2, 2.5] },
  volcanic: { root: 49, air: 180, notes: [1, 1.5, 1.2, 1] },
};
