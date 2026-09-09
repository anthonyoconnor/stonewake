import { TransformNode } from '@babylonjs/core';
import type { GameScene } from './scene';
import { visible } from '../game/spell-effects';
import { tileAt } from '../game/types';
import { createSpellModel, animateSpellModel, type SpellModel } from './spell-models';
export { createSpellModel, animateSpellModel, type SpellModel, type SpellAnimation } from './spell-models';
export class SpellView {
  nodes = new Map<string, TransformNode>();
  models = new Map<string, SpellModel>();
  constructor(public view: GameScene) {}
  reset() {
    for (const n of this.nodes.values()) n.dispose();
    this.nodes.clear();
    this.models.clear();
  }
  private model(key: string, id: string, radius = 0.5) {
    let model = this.models.get(key);
    if (model) return model;
    model = createSpellModel(this.view, id, radius);
    this.models.set(key, model);
    this.nodes.set(key, model.root);
    return model;
  }
  update() {
    const w = this.view.world,
      used = new Set<string>(),
      reduced = this.view.effects.reduced;
    for (const [prefix, units] of [
      ['dwarf', w.agents],
      ['enemy', w.enemies ?? []],
    ] as const)
      for (const unit of units)
        for (const e of unit.effects ?? []) {
          if (e.until <= w.elapsed) continue;
          const key = prefix + unit.id + e.id;
          used.add(key);
          const model = this.model(key, e.id);
          model.root.position.set(unit.x, 0, unit.z);
          model.root.rotation.y = unit.facing;
          animateSpellModel(model, {
            time: w.elapsed,
            age: w.elapsed - e.startedAt,
            reduced,
            active: visible(w, unit),
            healing: e.kind !== 'mend' || w.elapsed - (unit.hitAt ?? -Infinity) >= (e.pauseSeconds ?? 3),
          });
        }
    for (const [id, p] of [
      ['runic-barrier', w.barrier],
      ['call-to-arms', w.rally],
    ] as const)
      if (p) {
        used.add(id);
        const model = this.model(id, id, 'radius' in p ? p.radius : 0.5);
        model.root.position.set(p.x, 0, p.z);
        animateSpellModel(model, {
          time: w.elapsed,
          reduced,
          active: !!tileAt(w, Math.round(p.x), Math.round(p.z))?.known,
        });
      }
    for (const [i, b] of (w.spellBursts ?? []).entries()) {
      // Persistent effects already show the casting form: avoid a duplicate shield/band on cast.
      if (b.id !== 'thunder-rune' && b.id !== 'summon-stonehand' && b.id !== 'summon-miner') continue;
      const key = 'burst' + b.at + i;
      used.add(key);
      const model = this.model(key, b.id, b.radius),
        age = w.elapsed - b.at;
      model.root.position.set(b.x, 0, b.z);
      animateSpellModel(model, {
        time: w.elapsed,
        age,
        duration: 0.7,
        reduced,
        active: age >= 0 && age < 0.7 && visible(w, b),
      });
    }
    for (const [key, n] of this.nodes)
      if (!used.has(key)) {
        n.dispose();
        this.nodes.delete(key);
        this.models.delete(key);
      }
  }
}
