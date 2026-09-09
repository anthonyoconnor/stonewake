import { campaignStages, campaignStartingAvailability } from './campaign.ts';
import { campaignStages as prototypeStages } from './prototype-campaign.ts';
import { recipes } from './recipes.ts';
import { spellDefinitions } from './spells.ts';
import type { ContentAvailability } from '../game/availability.ts';
import { enemyRegionIds, enemyRegionLevel } from './enemy-regions.ts';
import type { LevelDefinition } from '../game/types.ts';

export interface PlayableLevel {
  id: string; name: string; description: string; region: string; image: string;
  level: LevelDefinition; starting: ContentAvailability & { knownSpells: string[] };
}
const buildings = ['treasure', 'dormitory', 'kitchen', 'workshop', 'training', 'library', 'wall', 'bridge'];
const prototypeStarting = () => ({ buildings: [...buildings], roles: ['stonehand','cave-hound','warrior','engineer','runesmith','miner'], recipes: recipes.map(r=>r.id), spells: ['summon-stonehand','summon-miner',...spellDefinitions.map(s=>s.id)], knownSpells: [] });
const art = {
  upper: new URL('../../concept-art/levels/border-foothold-v1.png', import.meta.url).href,
  fungal: new URL('../../concept-art/levels/fungal-caves-v1.png', import.meta.url).href,
  ancient: new URL('../../concept-art/levels/fallen-city-v1.png', import.meta.url).href,
  crystal: new URL('../../concept-art/levels/crystal-divide-v1.png', import.meta.url).href,
  volcanic: new URL('../../concept-art/levels/volcanic-depths-v1.png', import.meta.url).href,
};
const descriptions = {
  upper: 'Excavate the upper workings. Prepare for raiders and a burrowing flank beneath the old watch.',
  fungal: 'Breach the sealed nest. Keep your defenders moving through webs and choking spores.',
  ancient: 'Reclaim the old watch halls. Bring trained Warriors and runes against the armored guardians.',
  crystal: 'Break the crystal hunters’ line of sight. Secure the ancient relay beyond their hunting ground.',
  volcanic: 'Span molten rock and face the Deepmaw. Protect the crossing from ember attacks.',
};
/** Deliberately retained playable prototype maps. Harnesses never enter this catalog. */
export const playableLevels: PlayableLevel[] = [
  { id: 'border-foothold', name: 'Border Foothold', region: 'Upper workings',
    description: 'Carve a foothold from the earth. Raise a stronghold and awaken the northern Hearthstone.',
    image: art.upper, level: prototypeStages[0].level, starting: prototypeStarting() },
  { id: 'emberwater-crossing', name: 'Emberwater Crossing', region: 'Water & fire',
    description: 'Build bridges. Secure the crossing. Awaken the Hearthstone beyond water and lava.',
    image: '/art/emberwater-v1.png', level: prototypeStages[1].level, starting: prototypeStarting() },
  ...enemyRegionIds.map(region => ({
    id: `region-${region}`, name: enemyRegionLevel(region).name, region: `${region[0].toUpperCase()}${region.slice(1)} depths`,
    description: descriptions[region], image: art[region], level: enemyRegionLevel(region),
    starting: prototypeStarting(),
  })),
  ...campaignStages.map((stage,index)=>({
    id: `campaign-${stage.id}`, name: `${stage.level.name} · Campaign`, region: ['Upper workings','Fungal caves','Ancient halls','Crystal caverns','Volcanic depths'][index],
    description: stage.briefing, image: Object.values(art)[index], level: stage.level,
    starting: {...campaignStartingAvailability(stage.id),knownSpells:[]},
  })),
];
export const playableLevel = (id: string) => playableLevels.find(l => l.id === id);
