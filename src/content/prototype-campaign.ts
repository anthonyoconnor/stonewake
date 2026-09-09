import type { LevelDefinition } from '../game/types.ts';
import { prototypeLevel } from './levels.ts';
import { crossingLevel } from './crossings.ts';

export interface CampaignStage {
  id: string;
  level: LevelDefinition;
  next?: string;
  briefing: string;
  discovery: string;
  completion: string;
  unlockBuildings: string[];
}

/** The runic network links authored areas; this catalog does not carry local worlds. */
export const campaignStages: CampaignStage[] = [
  {
    id: 'border-foothold',
    level: {
      ...prototypeLevel,
      // Optional branches preserve the northern objective and the eastern raid passage.
      openings: [
        ...prototypeLevel.openings,
        [10, 28, 11, 30],
        [4, 32, 13, 38],
        [38, 31, 39, 32],
        [35, 34, 44, 41],
      ],
      seams: [
        ...prototypeLevel.seams,
        {
          terrain: 'rock',
          cells: [
            { x: 10, z: 31 },
            { x: 11, z: 31 },
            { x: 38, z: 33 },
            { x: 39, z: 33 },
          ],
        },
      ],
      encounters: [
        ...prototypeLevel.encounters!,
        {
          id: 'fungal-side-nest',
          name: 'Fungal side cavern',
          kind: 'nest',
          positions: [
            { x: 12, z: 33 },
            { x: 6, z: 35 },
            { x: 10, z: 36 },
          ],
          roster: ['tunnel-burrower', 'cave-spider', 'spore-brute'],
          activation: 'discovery',
          delay: 0,
          warningSeconds: 15,
          clear: 'defeat',
          warning: 'Claws and spores stir beyond the old fungal tunnel.',
        },
        {
          id: 'ancient-side-watch',
          name: 'Ancient side hall',
          kind: 'camp',
          positions: [
            { x: 37, z: 37 },
            { x: 42, z: 38 },
          ],
          roster: ['restless-guard', 'ancient-sentinel'],
          activation: 'discovery',
          delay: 0,
          warningSeconds: 15,
          clear: 'defeat',
          warning: 'The sealed hall awakens its ancient watch.',
        },
      ],
    },
    next: 'emberwater-crossing',
    briefing:
      'Reclaim the upper workings. Excavate room space around the Hearthstone for beds, food and a treasury, then prepare defenders for the buried northern halls. Find their lost Hearthstone to restore the first runic connection. Old accounts mention fungal caverns southwest of the workings and an ancient watch hall to the southeast; exploring them is optional.',
    discovery:
      'The northern stone remembers the old stonebridge craft. Secure its occupied hall and awaken the route to Emberwater.',
    completion:
      'The northern route is restored. Stonebridge plans are recovered for the water and lava ahead.',
    unlockBuildings: ['treasure', 'dormitory', 'kitchen', 'workshop', 'training', 'library', 'wall'],
  },
  {
    id: 'emberwater-crossing',
    level: {
      ...crossingLevel,
      id: 'campaign-emberwater',
      // Expand only eastward: both hazard channels still span the full map height.
      width: 40,
      openings: [
        ...crossingLevel.openings,
        [26, 4, 27, 4],
        [29, 2, 36, 6],
        [26, 12, 27, 12],
        [29, 10, 37, 15],
      ],
      seams: [
        ...crossingLevel.seams,
        {
          terrain: 'rock',
          cells: [
            { x: 28, z: 4 },
            { x: 28, z: 12 },
          ],
        },
        {
          terrain: 'gem',
          cells: [
            { x: 34, z: 3 },
            { x: 31, z: 5 },
          ],
        },
        {
          terrain: 'lava',
          cells: [
            { x: 31, z: 14 },
            { x: 32, z: 14 },
            { x: 33, z: 14 },
          ],
        },
      ],
      encounters: [
        {
          id: 'ember-sentry',
          name: 'Ember watch',
          kind: 'camp',
          positions: [{ x: 24, z: 11 }],
          activation: 'discovery',
          delay: 0,
          warningSeconds: 12,
          clear: 'defeat',
          warning: 'An ember guardian stirs beyond the crossing.',
          roster: ['cinderling'],
        },
        {
          id: 'crystal-side-camp',
          name: 'Crystal side cavern',
          kind: 'camp',
          positions: [
            { x: 32, z: 3 },
            { x: 34, z: 5 },
          ],
          roster: ['crystal-elemental', 'crystalback-stalker'],
          activation: 'discovery',
          delay: 0,
          warningSeconds: 15,
          clear: 'defeat',
          warning: 'Crystal shapes move within the opened cavern.',
        },
        {
          id: 'volcanic-side-lair',
          name: 'Volcanic side lair',
          kind: 'nest',
          positions: [{ x: 34, z: 13 }],
          roster: ['deepmaw'],
          activation: 'discovery',
          delay: 0,
          warningSeconds: 15,
          clear: 'defeat',
          warning: 'A heavy predator wakes beneath the volcanic bank.',
        },
      ],
    },
    briefing:
      'A fresh crew has reached Emberwater. Build a new foothold, span the water and lava with the recovered stonebridge craft, and secure the far Hearthstone. Research knowledge endures; the Library must prepare new spell charges here. Beyond the far bank, optional eastern tunnels lead to crystal caverns and a volcanic lair.',
    discovery:
      'Beyond the molten channel stands the southern relay. Awaken it to reconnect the upper workings with the lost kingdom.',
    completion:
      'The Emberwater relay is alight. Two lost routes are restored, and the journey through the available areas is complete.',
    unlockBuildings: ['bridge'],
  },
];

export const campaignStage = (id: string) => campaignStages.find((stage) => stage.id === id);
