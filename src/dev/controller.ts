import { createScenario, scenarioIds, type ScenarioId } from '../content/scenarios.ts';
import { type World, type Point, type DoorMode } from '../game/types.ts';
import { addResidents, designate } from '../game/simulation.ts';
import { buildRoom, reclaimRoom } from '../game/rooms.ts';
import { planWalls } from '../game/walls.ts';
import { queueCraft } from '../game/crafting.ts';
import { queueResearch, cancelResearch, castSpell, type SpellTarget } from '../game/research.ts';
import { placeDefense, removeDefense, setDoorMode, addRaider } from '../game/defenses.ts';
import { enableRecruitment, purchaseMiner } from '../game/recruitment.ts';
import { diagnosticSnapshot, enableDiagnostics, inspectResident } from '../game/diagnostics.ts';
import { advance } from './stepping.ts';
import { advanceEncounter } from '../game/encounters.ts';
import { requestHearthActivation } from '../game/hearth.ts';

export type DevCommand =
  | { kind: 'build'; room: string; points: Point[] }
  | { kind: 'reclaim'; points: Point[] }
  | { kind: 'dig' | 'wall'; points: Point[]; enabled?: boolean }
  | { kind: 'free-build' | 'arrivals'; enabled: boolean }
  | { kind: 'spawn'; type: string; count?: number }
  | { kind: 'buy-miner' }
  | { kind: 'activate-hearth' }
  | { kind: 'advance-encounter'; id?:string }
  | { kind: 'needs'; id: number; hunger?: number; energy?: number }
  | { kind: 'craft'; recipe: string }
  | { kind: 'research' | 'pause-research'; spell: string }
  | { kind: 'cast'; spell: string; target: SpellTarget }
  | { kind: 'place-defense'; type: string; point: Point; rotation?: number }
  | { kind: 'remove-defense'; id: number }
  | { kind: 'door'; id: number; mode: DoorMode }
  | { kind: 'raider'; spawn: Point; target: Point };

/** A small adapter over gameplay services, shared by Node checks and the browser. */
export class DevelopmentController {
  paused = false;
  scenario: ScenarioId | 'custom' = 'stronghold';
  private errors: Array<{ at: number; message: string }> = [];
  private getWorld: () => World;
  private replaceWorld: (world: World, id: ScenarioId) => void;
  constructor(getWorld: () => World, replaceWorld: (world: World, id: ScenarioId) => void) {
    this.getWorld = getWorld;
    this.replaceWorld = replaceWorld;
    enableDiagnostics(getWorld());
  }
  load(id: ScenarioId) {
    const world = createScenario(id, this.getWorld().freeRoomBuilding);
    enableDiagnostics(world);
    const previous = { scenario: this.scenario, paused: this.paused };
    this.scenario = id;
    this.paused = true;
    try {
      this.replaceWorld(world, id);
    } catch (error) {
      this.scenario = previous.scenario;
      this.paused = previous.paused;
      throw error;
    }
    return { scenario: id, elapsed: world.elapsed, residents: world.agents.length };
  }
  worldChanged(id: ScenarioId | 'custom' = 'custom') {
    this.scenario = id;
    enableDiagnostics(this.getWorld());
  }
  state() {
    return structuredClone(this.getWorld());
  }
  inspect(id?: number) {
    return id === undefined ? diagnosticSnapshot(this.getWorld()) : inspectResident(this.getWorld(), id);
  }
  advance(seconds: number) {
    this.paused = true;
    const advanced = advance(this.getWorld(), seconds);
    return { advanced, elapsed: this.getWorld().elapsed };
  }
  error(message: string) {
    this.errors.push({ at: this.getWorld().elapsed, message });
    if (this.errors.length > 30) this.errors.shift();
  }
  status() {
    return {
      scenario: this.scenario,
      scenarios: scenarioIds,
      paused: this.paused,
      elapsed: this.getWorld().elapsed,
      errors: structuredClone(this.errors),
    };
  }
  command(command: DevCommand) {
    const w = this.getWorld();
    if(w.outcome)return 'This area has ended. Load or restart a world to continue.';
    // Keep mistakes from script callers out of the grid-indexed gameplay services.
    const points = 'points' in command ? command.points : 'point' in command ? [command.point] : [];
    if (points.some((p) => !Number.isInteger(p.x) || !Number.isInteger(p.z)))
      throw new Error('Grid commands require integer coordinates.');
    switch (command.kind) {
      case 'build':
        return buildRoom(w, command.room, command.points);
      case 'reclaim':
        return reclaimRoom(w, command.points);
      case 'dig':
        designate(w, command.points, command.enabled ?? true);
        return 'Excavation updated.';
      case 'wall':
        return planWalls(w, command.points, command.enabled ?? true);
      case 'free-build':
        w.freeRoomBuilding = command.enabled;
        return 'Construction flag updated.';
      case 'arrivals':
        enableRecruitment(w, command.enabled);
        return 'Arrivals updated.';
      case 'spawn': {
        const count = command.count ?? 1;
        if (!Number.isInteger(count) || count < 1 || count > 50)
          throw new Error('Spawn 1–50 test residents per command.');
        return `${addResidents(w, command.type, count)} test residents added.`;
      }
      case 'buy-miner':
        return purchaseMiner(w, (type, origin) => addResidents(w, type, 1, origin) > 0).message;
      case 'activate-hearth':
        return requestHearthActivation(w);
      case 'advance-encounter':
        return advanceEncounter(w,command.id);
      case 'needs': {
        const a = w.agents.find((a) => a.id === command.id);
        if (!a) throw new Error('Unknown resident.');
        for (const value of [command.hunger, command.energy])
          if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1))
            throw new Error('Needs must be between 0 and 1.');
        if (command.hunger !== undefined) a.hunger = command.hunger;
        if (command.energy !== undefined) a.energy = command.energy;
        a.retry = 0;
        return 'Test needs updated.';
      }
      case 'craft':
        queueCraft(w, command.recipe);
        return 'Craft command applied.';
      case 'research':
        queueResearch(w, command.spell);
        return 'Research command applied.';
      case 'pause-research':
        cancelResearch(w, command.spell);
        return 'Research paused.';
      case 'cast':
        return castSpell(w, command.spell, command.target);
      case 'place-defense':
        return placeDefense(w, command.type, command.point, command.rotation);
      case 'remove-defense':
        return removeDefense(w, command.id);
      case 'door': {
        if (!['open', 'closed', 'locked'].includes(command.mode)) throw new Error('Unknown door mode.');
        return setDoorMode(w, command.id, command.mode);
      }
      case 'raider':
        return addRaider(w, command.spawn, command.target) ? 'Test raider added.' : 'Spawn is blocked.';
      default: {
        const unhandled: never = command;
        throw new Error(`Unknown development command: ${JSON.stringify(unhandled)}`);
      }
    }
  }
}
