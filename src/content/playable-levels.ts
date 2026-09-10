import { campaignStages, campaignStartingAvailability } from './campaign.ts';
import { standaloneLevels } from './standalone-levels.ts';
import { recipes } from './recipes.ts';
import { spellDefinitions } from './spells.ts';
import type { ContentAvailability } from '../game/availability.ts';
import type { LevelDefinition } from '../game/types.ts';
import { showcaseLevel } from './settlement-showcase.ts';

export interface PlayableLevel {
  /** Peaceful building studies use construction evidence instead of combat-route acceptance. */
  buildingStudy?: boolean;
  id: string; name: string; description: string; region: string; image: string;
  level: LevelDefinition; starting: ContentAvailability & { knownSpells: string[] };
}
const buildings = ['treasure', 'dormitory', 'kitchen', 'workshop', 'training', 'library', 'wall', 'bridge'];
const standaloneStarting = () => ({ buildings: [...buildings], roles: ['stonehand','cave-hound','warrior','engineer','runesmith'], recipes: recipes.map(r=>r.id), spells: ['summon-stonehand',...spellDefinitions.map(s=>s.id)], knownSpells: [] });
const standalonePresentation: Record<string, { region: string; description: string; image: string }> = {
  'border-foothold': {
    region: 'Mining interchange',
    description: 'Build at a buried junction. Follow the northern workings to the watch or restore a western service loop; the eastern galleries offer a separate mining frontier.',
    image: new URL('../../concept-art/levels/overhaul/m42-border-interchange-v1.png', import.meta.url).href,
  },
  'emberwater-crossing': {
    region: 'Water & fire',
    description: 'Cross a winding river and a molten channel. Choose the short northern bridgeheads or reclaim the foundry between the southern crossings.',
    image: new URL('../../concept-art/levels/overhaul/m42-emberwater-v1.png', import.meta.url).href,
  },
  'region-upper': {
    region: 'Quarry galleries',
    description: 'Excavate a honeycomb of unequal quarry chambers. Take the direct cut to the northern watch or reconnect old service galleries beneath the ridges.',
    image: new URL('../../concept-art/levels/overhaul/m42-upper-quarry-v1.png', import.meta.url).href,
  },
  'region-fungal': {
    region: 'Overgrown waterways',
    description: 'Expand from a dry southern refuge into three wet cavern lobes. Advance along the eastern colonies or recover the waystation and buried civic crossing.',
    image: new URL('../../concept-art/levels/overhaul/m42-overgrown-confluence-v1.png', import.meta.url).href,
  },
  'region-ancient': {
    region: 'Flooded civic ruins',
    description: 'Restore watch districts around a flooded basin. Pay for the northern causeway or follow the dry southern shore through useful service rooms and a foundry.',
    image: new URL('../../concept-art/levels/overhaul/m42-flooded-districts-v1.png', import.meta.url).href,
  },
  'region-crystal': {
    region: 'Mineral wells',
    description: 'Choose expeditions from a central refuge. Reach the relay through the eastern branch or recover the northern archive; guarded mineral wells remain optional.',
    image: new URL('../../concept-art/levels/overhaul/m42-prism-wells-v1.png', import.meta.url).href,
  },
  'region-volcanic': {
    region: 'Caldera citadel',
    description: 'Establish a foothold outside a molten ring. Force the western bridgehead or cross to the southern service court before securing the inner citadel.',
    image: new URL('../../concept-art/levels/overhaul/m42-ashen-caldera-v1.png', import.meta.url).href,
  },
};
const campaignArt = [
  new URL('../../concept-art/levels/overhaul/m36-border-foothold-v1.png', import.meta.url).href,
  new URL('../../concept-art/levels/overhaul/m37-fungal-hollows-v1.png', import.meta.url).href,
  new URL('../../concept-art/levels/overhaul/m38-fallen-city-v1.png', import.meta.url).href,
  new URL('../../concept-art/levels/overhaul/m39-crystal-divide-v1.png', import.meta.url).href,
  new URL('../../concept-art/levels/overhaul/m40-royal-deep-v1.png', import.meta.url).href,
];
/** Playable content only; independent old-map comparisons stay in level-baselines.ts. */
export const playableLevels: PlayableLevel[] = [
  { id: showcaseLevel.id!, name: showcaseLevel.name, region: 'Peaceful base building', buildingStudy: true,
    description: 'Build spacious chambers and connecting halls in a quiet mining refuge. Inspect the completed example under Debug → Level preview → Showcases.',
    image: new URL('../../concept-art/levels/overhaul/m36-border-foothold-v1.png', import.meta.url).href,
    level: showcaseLevel, starting: standaloneStarting() },
  ...standaloneLevels.map(level => ({
    id: level.id!, name: level.name, ...standalonePresentation[level.id!],
    level, starting: standaloneStarting(),
  })),
  ...campaignStages.map((stage,index)=>({
    id: `campaign-${stage.id}`, name: `${stage.level.name} · Campaign`, region: ['Upper workings','Fungal caves','Ancient halls','Crystal caverns','Volcanic depths'][index],
    description: stage.briefing, image: campaignArt[index], level: stage.level,
    starting: {...campaignStartingAvailability(stage.id),knownSpells:[]},
  })),
];
export const playableLevel = (id: string) => playableLevels.find(l => l.id === id);
