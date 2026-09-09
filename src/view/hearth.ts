import type { TransformNode } from '@babylonjs/core';
import type { GameScene } from './scene';
import { tileAt } from '../game/types';
import { createOnwardHearthModel, updateOnwardHearthModel, type HearthModel } from './hearth-models';
import { tuning } from '../content/tuning';

/** A relay remains entirely absent until normal discovery exposes its authored tile. */
export class HearthView {
  root?: TransformNode;
  model?: HearthModel;
  signature = '';
  constructor(public view: GameScene) {}
  reset() {
    this.root?.dispose();
    this.root = undefined;
    this.model = undefined;
    this.signature = '';
  }
  update() {
    const w = this.view.world,
      stone = w.onwardHearth,
      discovered = !!stone && !!tileAt(w, stone.x, stone.z)?.known;
    const signature = discovered ? [stone!.id, stone!.x, stone!.z].join(':') : '';
    if (signature !== this.signature) {
      this.reset();
      this.signature = signature;
      if (discovered && stone) {
        this.model = createOnwardHearthModel(this.view);
        this.root = this.model.root;
        this.root.position.set(stone.x, 0, stone.z);
      }
    }
    if (this.model && stone)
      updateOnwardHearthModel(this.model, {
        elapsed: w.elapsed,
        progress: stone.progress / tuning.hearthActivationSeconds,
        ready: stone.ready,
        reduced: this.view.effects.reduced,
      });
  }
}
