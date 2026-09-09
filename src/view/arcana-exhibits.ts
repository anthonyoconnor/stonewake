import { TransformNode } from '@babylonjs/core';
import type { ArcanaEntry } from '../content/arcana-gallery';
import type { ArcanaState } from './arcana-gallery';
import type { GameScene } from './scene';
import type { Defense } from '../game/types';
import { ResidentView } from './residents';
import { EnemyView } from './enemies';
import { createSpellModel, animateSpellModel } from './spells';
import { createStartingSpellModel } from './spells-baseline';
import { createTrapModel, updateTrapModel } from './trap-models';
import { createStartingTrapModel, updateStartingTrapModel } from './defenses-baseline';
import {
  createStoneHearthModel,
  updateStoneHearthModel,
  createOnwardHearthModel,
  updateOnwardHearthModel,
} from './hearth-models';
import { createStartingStoneHearthModel, updateStartingStoneHearthModel } from './hearth-main-baseline';
import { createStartingOnwardHearthModel, updateStartingOnwardHearthModel } from './hearth-baseline';

export interface ArcanaExhibit {
  root: TransformNode;
  pose(time: number, state: ArcanaState, reduced: boolean): void;
}

/** Context actors and sampled fixture inputs belong only to the display; no game tick sees them. */
export function createArcanaExhibit(view: GameScene, entry: ArcanaEntry, starting: boolean): ArcanaExhibit {
  const root = new TransformNode(
    `arcana exhibit ${starting ? 'starting' : 'refined'} ${entry.id}`,
    view.scene,
  );
  if (entry.kind === 'spell') {
    const target = ['dwarf-haste', 'stoneguard', 'mending-rune'].includes(entry.id)
      ? 'warrior'
      : entry.id === 'summon-stonehand'
        ? 'stonehand'
        : undefined;
    let subject: TransformNode | undefined;
    if (target) {
      const actor = new ResidentView(view).create(30000, target);
      subject = actor.root;
      subject.parent = root;
      actor.shadow.parent = root;
      actor.shadow.position.set(0, 0.025, 0);
      actor.load.setEnabled(false);
      for (const m of actor.trainingWeights) m.setEnabled(false);
    } else if (['enemy-slow', 'rune-of-reckoning'].includes(entry.id)) {
      const actor = new EnemyView(view).build({
        id: 30001,
        type: 'goblin-raider',
        x: 0,
        z: 0,
        health: 1,
        target: { x: 0, z: 0 },
        facing: 0,
        pinnedUntil: 0,
        nextAttackAt: 0,
        hitAt: -100,
        activity: 'Exhibit',
      });
      subject = actor.root;
      subject.parent = root;
      actor.projectile.setEnabled(false);
      actor.cloud?.setEnabled(false);
    }
    const after = starting ? undefined : createSpellModel(view, entry.id, entry.radius);
    const effect = after?.root ?? createStartingSpellModel(view, entry.id, entry.radius);
    effect.parent = root;
    const burst = entry.id === 'thunder-rune' || entry.id === 'summon-stonehand';
    return {
      root,
      pose(time, state, reduced) {
        const active = state === 'active';
        const age = (0.22 + time) % (burst ? 1.2 : 3);
        subject?.setEnabled(entry.id !== 'summon-stonehand' || state !== 'ready');
        if (after)
          animateSpellModel(after, {
            time,
            age: burst ? age : undefined,
            duration: burst ? 0.7 : undefined,
            reduced,
            active,
          });
        else {
          effect.setEnabled(active && (!burst || age < 0.7));
          effect.scaling.setAll(burst ? 1 + (age / 0.7) * 0.4 : 1);
        }
      },
    };
  }
  if (entry.kind === 'trap') {
    const d: Defense = {
      id: 30002,
      type: entry.id,
      x: 0,
      z: 0,
      rotation: 1,
      mode: 'closed',
      health: 1,
      maxHealth: 1,
      openUntil: 0,
      readyAt: 0,
      triggeredAt: 0,
      shotEnd: { x: 0, z: 2 },
    };
    const before = starting ? createStartingTrapModel(view, d) : undefined;
    const after = starting ? undefined : createTrapModel(view, d);
    (before?.root ?? after!.root).parent = root;
    return {
      root,
      pose(time, state, reduced) {
        const age = state === 'ready' ? -10 : state === 'finished' ? 2.5 : (0.12 + time) % 3;
        d.triggeredAt = -age;
        d.readyAt = state === 'ready' ? 0 : 6 - age;
        if (before) updateStartingTrapModel(before, d, 0, reduced);
        else updateTrapModel(after!, d, 0, reduced);
      },
    };
  }
  if (entry.id === 'stone-hearth') {
    const before = starting ? createStartingStoneHearthModel(view, root) : undefined;
    const after = starting ? undefined : createStoneHearthModel(view, root);
    return {
      root,
      pose(time, state, reduced) {
        const pose = {
          elapsed: time,
          integrity: state === 'ready' ? 1 : state === 'active' ? 0.45 : 0,
          reduced,
        };
        if (before) updateStartingStoneHearthModel(before, pose);
        else updateStoneHearthModel(after!, pose);
      },
    };
  }
  const before = starting ? createStartingOnwardHearthModel(view, root) : undefined;
  const after = starting ? undefined : createOnwardHearthModel(view, root);
  return {
    root,
    pose(time, state, reduced) {
      const pose = {
        elapsed: time,
        progress: state === 'ready' ? 0 : state === 'active' ? 0.5 : 1,
        ready: state === 'finished',
        reduced,
      };
      if (before) updateStartingOnwardHearthModel(before, pose);
      else updateOnwardHearthModel(after!, pose);
    },
  };
}
