import type { StandardMaterial } from '@babylonjs/core';
import { GameScene as StartingScene } from './scene-baseline';
import type { GameScene } from './scene';

const references = new WeakMap<GameScene, GameScene>();
/** Draw archived terrain in the left half without sharing/repainting any current material. */
export function startingTerrainView(view: GameScene) {
  let reference = references.get(view);
  if (!reference) {
    reference = Object.create(view) as GameScene;
    reference.materials = new Map<string, StandardMaterial>();
    const target = reference;
    target.material = (name, color, texture = false, emissive = 0) => {
      const material = StartingScene.prototype.material.call(target, name, color, texture, emissive);
      material.name = `starting terrain ${name}`;
      return material;
    };
    target.box = StartingScene.prototype.box.bind(target);
    target.crystal = StartingScene.prototype.crystal.bind(target);
    target.shadow = StartingScene.prototype.shadow.bind(target);
    references.set(view, target);
  }
  return reference;
}
export function drawStartingTile(view: GameScene, tile: Parameters<GameScene['drawTile']>[0]) {
  StartingScene.prototype.drawTile.call(startingTerrainView(view), tile);
}
export function resetStartingTerrain(view: GameScene) {
  const reference = references.get(view);
  if (reference) for (const material of reference.materials.values()) material.dispose(false, true);
  references.delete(view);
}
