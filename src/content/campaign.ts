import type { LevelDefinition } from '../game/types.ts';
import type { ContentAvailability } from '../game/availability.ts';
import { authoredCampaignLevels } from './campaign-levels.ts';
import { recipes } from './recipes.ts';
import { spellDefinitions } from './spells.ts';

export interface CampaignStage {
  id: string; level: LevelDefinition; next?: string;
  briefing: string; discovery: string; completion: string;
  unlockBuildings: string[]; unlockRoles: string[]; unlockRecipes: string[]; unlockSpells: string[];
}

/** Each introduction has a complete area to develop before the next role arrives. */
export const campaignStages: CampaignStage[] = [
  {
    id: 'border-foothold', level: authoredCampaignLevels[0], next: 'fungal-hollows',
    briefing: 'Build a refuge inside the sheltered mining basin. Cave Hounds defend and explore. Follow the northern timber workings toward the watch, or reclaim the southern waystation and approach from its service saddle.',
    discovery: 'The northern watch holds the first relay. Secure the approach and recover the Warrior training records.',
    completion: 'The upper relay is restored. Training Room plans and Warriors join the next expedition into the fungal hollows.',
    unlockBuildings: ['treasure', 'dormitory', 'kitchen', 'wall'], unlockRoles: ['stonehand', 'cave-hound'], unlockRecipes: [], unlockSpells: ['summon-stonehand'],
  },
  {
    id: 'fungal-hollows', level: authoredCampaignLevels[1], next: 'fallen-city',
    briefing: 'Train Warriors before opening the wet cavern basin. A dry upper shelf and a lower waystation loop pass different fungal colonies and reach the brood from different directions. Both routes stay on land.',
    discovery: 'The nest surrounds a lost guild relay. Its Workshop records will equip the next expedition.',
    completion: 'The fungal relay is secured. Engineers, Workshop plans and manufactured defenses are recovered for the Fallen City.',
    unlockBuildings: ['training'], unlockRoles: ['warrior'], unlockRecipes: [], unlockSpells: [],
  },
  {
    id: 'fallen-city', level: authoredCampaignLevels[2], next: 'crystal-divide',
    briefing: 'Reclaim the buried crossroads. Advance up the civic avenue or restore the western foundry and its service street. Engineers manufacture defenses for the junctions while trained Warriors face the armored watch.',
    discovery: 'Beyond the old watch lies a relay carrying the Library catalog. Secure it to recover runic knowledge.',
    completion: 'The city relay is restored. Library plans and Runesmiths join the expedition to the crystal caverns.',
    unlockBuildings: ['workshop'], unlockRoles: ['engineer'], unlockRecipes: recipes.map(r => r.id), unlockSpells: [],
  },
  {
    id: 'crystal-divide', level: authoredCampaignLevels[3], next: 'royal-deep',
    briefing: 'Research spells in the eastern refuge. Explore around either end of the crescent chasm: the northern archive or the longer southern service route. A sealed remote gem cavern offers optional income; chasms cannot be bridged.',
    discovery: 'The crystal relay guards the stonebridge plans needed to reach the royal stronghold.',
    completion: 'The crystal relay is alight. Stonebridge plans open the way into Royal Deep; researched spells travel with you.',
    unlockBuildings: ['library'], unlockRoles: ['runesmith'], unlockRecipes: [], unlockSpells: spellDefinitions.map(s => s.id),
  },
  {
    id: 'royal-deep', level: authoredCampaignLevels[4],
    briefing: 'Cross the molten basin and reclaim the royal peninsulas. The short bridgehead is exposed; the longer southern crossing reaches a foundry. Prepare spells and defenses, then bridge to the hostile feeder to end its Cinderling raids.',
    discovery: 'The royal Hearthstone is the final relay. Secure its volcanic approaches and awaken the lost kingdom’s network.',
    completion: 'The royal Hearthstone is alight. All five lost routes are restored and the campaign journey is complete.',
    unlockBuildings: ['bridge'], unlockRoles: [], unlockRecipes: [], unlockSpells: [],
  },
];
export const campaignStage = (id: string) => campaignStages.find(stage => stage.id === id);
export function campaignStartingAvailability(id: string): ContentAvailability {
  const end = campaignStages.findIndex(stage => stage.id === id);
  if (end < 0) throw new Error(`Unknown campaign area: ${id}`);
  const prior = campaignStages.slice(0, end + 1);
  const gather = (field: 'unlockBuildings' | 'unlockRoles' | 'unlockRecipes' | 'unlockSpells') => [...new Set(prior.flatMap(stage => stage[field]))];
  return { buildings: gather('unlockBuildings'), roles: gather('unlockRoles'), recipes: gather('unlockRecipes'), spells: gather('unlockSpells') };
}
