import { campaignStage, campaignStages } from '../content/campaign.ts';
import { spellById } from '../content/spells.ts';
import { createWorld } from './world.ts';
import { addMiners } from './simulation.ts';
import { enableRecruitment } from './recruitment.ts';
import type { World } from './types.ts';

export interface CampaignState {
  stageId: string;
  completed: string[];
  knownSpells: string[];
  unlockedBuildings: string[];
}

const unique = (values: string[]) => [...new Set(values)];

function enterArea(state: CampaignState, free: boolean): World {
  const stage = campaignStage(state.stageId);
  if (!stage) throw new Error(`Unknown campaign area: ${state.stageId}`);
  const w = createWorld(stage.level);
  w.freeRoomBuilding = free;
  w.campaign = {
    ...state,
    completed: [...state.completed],
    knownSpells: [...state.knownSpells],
    unlockedBuildings: unique([...state.unlockedBuildings, ...stage.unlockBuildings]),
  };
  // Knowledge carries; local progress, workers, prepared charges and queues do not.
  w.researchOrders = state.knownSpells
    .filter((id) => spellById(id))
    .map((spell, i) => ({
      id: i + 1,
      spell,
      state: 'queued',
      progress: 0,
      unlocked: true,
      paused: true,
    }));
  addMiners(w);
  enableRecruitment(w);
  return w;
}

export function startCampaign(free = false): World {
  return enterArea(
    { stageId: campaignStages[0].id, completed: [], knownSpells: [], unlockedBuildings: [] },
    free,
  );
}

export function restartCampaignArea(w: World): World | undefined {
  // A retry starts with knowledge carried into this area, not work lost in this attempt.
  return w.campaign ? enterArea(w.campaign, w.freeRoomBuilding) : undefined;
}

export function travelOnward(w: World): World | undefined {
  const state = w.campaign,
    stage = state && campaignStage(state.stageId);
  if (!state || !stage?.next || w.outcome !== 'victory' || !w.onwardHearth?.ready) return;
  return enterArea(
    {
      stageId: stage.next,
      completed: unique([...state.completed, stage.id]),
      knownSpells: unique([
        ...state.knownSpells,
        ...(w.researchOrders ?? []).filter((o) => o.unlocked).map((o) => o.spell),
      ]),
      unlockedBuildings: [...state.unlockedBuildings],
    },
    w.freeRoomBuilding,
  );
}

export function campaignSummary(w: World) {
  const state = w.campaign,
    stage = state && campaignStage(state.stageId);
  if (!state || !stage) return;
  const ready = w.outcome === 'victory' && !!w.onwardHearth?.ready;
  const next = stage.next && campaignStage(stage.next);
  return {
    stage: campaignStages.indexOf(stage) + 1,
    total: campaignStages.length,
    briefing: stage.briefing,
    discovery: stage.discovery,
    completion: stage.completion,
    canTravel: ready && !!next,
    complete: ready && !next,
    nextName: next ? next.level.name : undefined,
    knownSpells: state.knownSpells.length,
    unlockedBuildings: state.unlockedBuildings,
  };
}
