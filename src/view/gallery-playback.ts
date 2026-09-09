import { characterById, characterLevel } from '../content/characters';
import { enemyById } from '../content/enemies';
import type { Enemy, Job, Resident, World } from '../game/types';
import { ResidentView } from './residents';
import { ResidentView as OriginalResidents } from './residents-baseline';
import { EnemyView } from './enemies';
import { EnemyView as OriginalEnemies } from './enemies-baseline';
import type { GameScene } from './scene';

export type GalleryClip = 'idle' | 'walk' | 'work' | 'attack';

const residentWork: Record<string, { kind: Job['kind']; label: string }> = {
  stonehand: { kind: 'mine', label: 'Mine' },
  miner: { kind: 'mine', label: 'Mine' },
  engineer: { kind: 'craft', label: 'Craft' },
  warrior: { kind: 'train', label: 'Train' },
  runesmith: { kind: 'research', label: 'Research' },
  'cave-hound': { kind: 'scout', label: 'Sniff' },
};

export function galleryClips(type: string, kind: 'resident' | 'enemy'): { id: GalleryClip; label: string }[] {
  const clips: { id: GalleryClip; label: string }[] = [
    { id: 'idle', label: 'Idle' },
    { id: 'walk', label: 'Walk' },
  ];
  const work =
    kind === 'resident' ? residentWork[type]?.label : type === 'tunnel-burrower' ? 'Burrow' : undefined;
  if (work) clips.push({ id: 'work', label: work });
  if (kind === 'enemy' || !characterById(type)?.construct) clips.push({ id: 'attack', label: 'Attack' });
  return clips;
}

type ResidentRig = ReturnType<ResidentView['create']>;
type EnemyRig = ReturnType<EnemyView['build']>;
type ResidentPair = { actor: Resident; before: ResidentRig; after: ResidentRig };
type EnemyPair = { actor: Enemy; before: EnemyRig; after: EnemyRig };
const origin = { x: 4, z: 4 };
const warmStep = 0.05;

/** Render-only input: never passed to a game tick or attached to the player's world. */
function presentationWorld(): World {
  return {
    name: 'Gallery animation inputs',
    width: 9,
    height: 9,
    hearth: { ...origin },
    tiles: Array.from({ length: 81 }, (_, i) => ({
      x: i % 9,
      z: Math.floor(i / 9),
      terrain: 'floor',
      known: true,
      claimed: true,
      designated: false,
      core: false,
      gold: 0,
      loose: 0,
    })),
    revision: 0,
    agents: [],
    enemies: [],
    furnishings: [],
    roomServices: [],
    elapsed: 0,
    nextPaydayAt: Infinity,
    allowance: 0,
    spent: 0,
    freeRoomBuilding: false,
    craftOrders: [],
    outputs: {},
  };
}

function presentationView(source: GameScene, world: World): GameScene {
  const view = Object.create(source) as GameScene;
  view.world = world;
  return view;
}

function position(time: number, walking: boolean) {
  return walking
    ? { x: origin.x + Math.sin(time * 4) * 0.18, z: origin.z + Math.cos(time * 4) * 0.18 }
    : origin;
}

/** Existing current and archived renderers receive identical sampled actors and time. */
export class GalleryPlayback {
  private world = presentationWorld();
  private residents: ResidentPair[] = [];
  private enemies: EnemyPair[] = [];
  private currentResidents: ResidentView;
  private originalResidents: OriginalResidents;
  private currentEnemies: EnemyView;
  private originalEnemies: OriginalEnemies;
  private lastTime?: number;
  private lastClip?: GalleryClip;

  constructor(currentView: GameScene, baselineView: GameScene) {
    const current = presentationView(currentView, this.world);
    const original = presentationView(baselineView, this.world);
    this.currentResidents = new ResidentView(current);
    this.originalResidents = new OriginalResidents(original);
    this.currentEnemies = new EnemyView(current);
    this.originalEnemies = new OriginalEnemies(original);
  }

  addResident(id: number, type: string, beforeRig: ResidentRig, afterRig: ResidentRig) {
    const actor: Resident = {
      id,
      type,
      name: `Gallery ${type}`,
      ...origin,
      capabilities: [],
      path: [],
      carrying: 0,
      activity: 'Idle',
      facing: 0,
      retry: 0,
      energy: 1,
      rested: 0,
      hunger: 0,
      meals: 0,
      crafted: 0,
      health: 100,
      maxHealth: 100,
      hitAt: -Infinity,
    };
    this.world.agents.push(actor);
    this.residents.push({ actor, before: beforeRig, after: afterRig });
    this.originalResidents.nodes.set(id, beforeRig);
    this.currentResidents.nodes.set(id, afterRig);
    this.lastTime = undefined;
  }

  addEnemy(id: number, type: string, beforeRig: EnemyRig, afterRig: EnemyRig) {
    const actor: Enemy = {
      id,
      type,
      ...origin,
      health: 100,
      maxHealth: 100,
      target: { x: 4, z: 5 },
      facing: 0,
      pinnedUntil: -Infinity,
      nextAttackAt: Infinity,
      hitAt: -Infinity,
      activity: 'Idle',
    };
    this.world.enemies!.push(actor);
    this.enemies.push({ actor, before: beforeRig, after: afterRig });
    this.originalEnemies.models.set(id, beforeRig);
    this.currentEnemies.models.set(id, afterRig);
    // Enemy shadows are children of scaled actor roots, unlike resident shadows.
    for (const model of [beforeRig, afterRig]) {
      const shadow = model.root.getChildMeshes().find((mesh) => mesh.name === 'contact shadow');
      if (shadow) shadow.position.y = 0.013 / model.root.scaling.y;
    }
    this.lastTime = undefined;
  }

  pose(time: number, clip: GalleryClip) {
    if (!Number.isFinite(time)) return;
    time = Math.max(0, time);
    if (time === this.lastTime && clip === this.lastClip) return;
    const restart = this.lastTime === undefined || time < this.lastTime || clip !== this.lastClip;
    if (restart) this.resetPose();
    this.world.elapsed = time;
    for (const pair of this.residents) {
      const a = pair.actor;
      const selected = galleryClips(a.type, 'resident').some((entry) => entry.id === clip) ? clip : 'idle';
      const p = position(time, selected === 'walk');
      a.x = p.x;
      a.z = p.z;
      a.activity = selected === 'attack' ? 'Fighting' : selected === 'walk' ? 'Walking' : 'Idle';
      a.path = selected === 'walk' ? [{ x: 4, z: 5 }] : [];
      a.attackedAt =
        selected === 'attack'
          ? Math.floor(time / characterLevel(a.type).attackSeconds) * characterLevel(a.type).attackSeconds
          : undefined;
      a.job =
        selected === 'work'
          ? { kind: residentWork[a.type].kind, target: { x: 4, z: 5 }, work: { ...origin }, progress: time }
          : undefined;
      if (restart) {
        const previous = position(time - warmStep, selected === 'walk');
        for (const model of [pair.before, pair.after]) {
          model.lastTime = time - warmStep;
          model.lastX = previous.x;
          model.lastZ = previous.z;
        }
      }
    }
    for (const pair of this.enemies) {
      const a = pair.actor;
      const definition = enemyById(a.type);
      const selected = galleryClips(a.type!, 'enemy').some((entry) => entry.id === clip) ? clip : 'idle';
      const p = position(time, selected === 'walk');
      a.x = p.x;
      a.z = p.z;
      a.activity =
        selected === 'work'
          ? 'Excavating'
          : selected === 'attack'
            ? 'Fighting'
            : selected === 'walk'
              ? 'Walking'
              : 'Idle';
      const attackAt = Math.floor(time / definition.attackSeconds) * definition.attackSeconds;
      a.attackedAt = selected === 'attack' ? attackAt : undefined;
      a.shotEnd =
        selected === 'attack' && (definition.range || definition.ability === 'web')
          ? { x: a.x, z: a.z + 0.8 }
          : undefined;
      a.abilityReadyAt =
        selected === 'attack' && definition.ability === 'spores'
          ? attackAt + (definition.abilitySeconds ?? 0)
          : undefined;
      if (restart) {
        const previous = position(time - warmStep, selected === 'walk');
        for (const model of [pair.before, pair.after]) {
          model.elapsed = time - warmStep;
          model.x = previous.x;
          model.z = previous.z;
        }
      }
    }
    this.originalResidents.update();
    this.currentResidents.update();
    this.originalEnemies.update();
    this.currentEnemies.update();
    for (const pair of this.residents)
      for (const model of [pair.before, pair.after]) {
        model.root.position.x -= pair.actor.x;
        model.root.position.z -= pair.actor.z;
        model.root.position.y += 0.1;
        model.shadow.position.x -= pair.actor.x;
        model.shadow.position.z -= pair.actor.z;
        model.shadow.position.y = 0.113;
      }
    for (const pair of this.enemies)
      for (const model of [pair.before, pair.after]) {
        model.root.position.x -= pair.actor.x;
        model.root.position.z -= pair.actor.z;
        model.root.position.y += 0.1;
      }
    this.lastTime = time;
    this.lastClip = clip;
  }

  /** Caller samples pose(0, clip) after resetting its presentation clock. */
  resetPose() {
    this.lastTime = undefined;
    this.lastClip = undefined;
    for (const pair of this.residents)
      for (const model of [pair.before, pair.after]) {
        model.pose = undefined;
        model.lastTime = model.lastX = model.lastZ = model.removedAt = undefined;
        model.stride = pair.actor.id;
        model.walking = false;
        model.root.rotation.setAll(0);
        model.root.scaling.y = 1;
        for (const leg of model.legs) leg.rotation.x = 0;
        model.arm.rotation.x = model.arm.rotation.z = 0;
        model.leftArm.rotation.x = model.leftArm.rotation.z = 0;
        if (model.book) model.book.rotation.z = 0;
        if (model.hound) {
          model.hound.head.rotation.x = model.hound.jaw.rotation.x = 0;
          model.hound.tail.rotation.y = 0;
        }
      }
    for (const pair of this.enemies)
      for (const model of [pair.before, pair.after]) {
        model.elapsed = -1;
        model.x = model.z = 4;
        model.phase = pair.actor.id;
        model.facing = 0;
        model.moving = false;
        model.root.rotation.setAll(0);
        model.body.position.y = model.body.rotation.x = model.body.rotation.z = model.head.rotation.x = 0;
        for (const limb of [...model.legs, ...model.arms]) limb.rotation.x = 0;
        if (model.tail) model.tail.rotation.y = 0;
        model.cloud?.setEnabled(false);
        model.projectile.setEnabled(false);
      }
  }

  /** Model and material disposal remains owned by GraphicsGallery. */
  dispose() {
    for (const pair of this.residents) pair.before.actor = pair.after.actor = undefined;
    this.currentResidents.nodes.clear();
    this.originalResidents.nodes.clear();
    this.currentEnemies.models.clear();
    this.originalEnemies.models.clear();
    this.world.agents = [];
    this.world.enemies = [];
    this.residents = [];
    this.enemies = [];
    this.lastTime = undefined;
    this.lastClip = undefined;
  }
}
