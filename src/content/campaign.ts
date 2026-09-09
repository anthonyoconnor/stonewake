import type { LevelDefinition } from '../game/types.ts';
import type { ContentAvailability } from '../game/availability.ts';
import { prototypeLevel } from './levels.ts';
import { enemyRegionLevel } from './enemy-regions.ts';
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
    id: 'border-foothold', level: prototypeLevel, next: 'fungal-hollows',
    briefing: 'Establish a treasury and a Dormitory around the Hearth. Stonehands excavate and Cave Hounds defend and explore. Follow the northern gold to the lost relay; its training records lead into the fungal hollows.',
    discovery: 'The northern watch holds the first relay. Secure the approach and recover the Warrior training records.',
    completion: 'The upper relay is restored. Training Room plans and Warriors join the next expedition into the fungal hollows.',
    unlockBuildings: ['treasure', 'dormitory', 'kitchen', 'wall'], unlockRoles: ['stonehand', 'cave-hound'], unlockRecipes: [], unlockSpells: ['summon-stonehand'],
  },
  {
    id: 'fungal-hollows', level: enemyRegionLevel('fungal'), next: 'fallen-city',
    briefing: 'Build a Training Room to attract Warriors. Let them train while hounds scout the branching fungal tunnels. Spiders slow exposed defenders and the Spore Brute controls narrow approaches; choose where to open the nest.',
    discovery: 'The nest surrounds a lost guild relay. Its Workshop records will equip the next expedition.',
    completion: 'The fungal relay is secured. Engineers, Workshop plans and manufactured defenses are recovered for the Fallen City.',
    unlockBuildings: ['training'], unlockRoles: ['warrior'], unlockRecipes: [], unlockSpells: [],
  },
  {
    id: 'fallen-city', level: enemyRegionLevel('ancient'), next: 'crystal-divide',
    briefing: 'Reclaim the ancient streets. Workshops attract Engineers who manufacture doors and traps. Protect your routes against the armored watch while trained Warriors and hounds secure the buried districts.',
    discovery: 'Beyond the old watch lies a relay carrying the Library catalog. Secure it to recover runic knowledge.',
    completion: 'The city relay is restored. Library plans and Runesmiths join the expedition to the crystal caverns.',
    unlockBuildings: ['workshop'], unlockRoles: ['engineer'], unlockRecipes: recipes.map(r => r.id), unlockSpells: [],
  },
  {
    id: 'crystal-divide', level: enemyRegionLevel('crystal'), next: 'royal-deep',
    briefing: 'Build a Library, attract a Runesmith and research protection, healing and battlefield control. Crystal hunters punish exposed approaches. A remote gem can finance repeated spell preparation once its cavern is secured.',
    discovery: 'The crystal relay guards the stonebridge plans needed to reach the royal stronghold.',
    completion: 'The crystal relay is alight. Stonebridge plans open the way into Royal Deep; researched spells travel with you.',
    unlockBuildings: ['library'], unlockRoles: ['runesmith'], unlockRecipes: [], unlockSpells: spellDefinitions.map(s => s.id),
  },
  {
    id: 'royal-deep', level: enemyRegionLevel('volcanic'),
    briefing: 'Reunite the lost network. Span the lava with stone bridges, prepare spells and defenses, and secure the royal relay. Cinderlings can cross molten ground directly; the Deepmaw punishes an unprepared breach.',
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
