import { MeshBuilder, TransformNode } from '@babylonjs/core';
import type { GameScene } from './scene';
import { tileAt } from '../game/types';

/** A discovered stone uses the approved crystal, stone plinth and brass-ring language. */
export class HearthView {
  root?: TransformNode;
  signature = '';
  constructor(public view: GameScene) {}
  reset() {
    this.root?.dispose();
    this.root = undefined;
    this.signature = '';
  }
  update() {
    const w = this.view.world,
      stone = w.onwardHearth;
    const discovered = !!stone && !!tileAt(w, stone.x, stone.z)?.known;
    const signature = discovered
      ? `${stone!.id}:${stone!.x}:${stone!.z}:${stone!.ready}:${stone!.progress > 0}`
      : '';
    if (signature === this.signature) return;
    this.reset();
    this.signature = signature;
    if (!discovered || !stone) return;
    const v = this.view,
      root = (this.root = new TransformNode('onward-hearth', v.scene));
    const plinth = MeshBuilder.CreateCylinder(
      'onward stone plinth',
      { height: 0.2, diameter: 0.94, tessellation: 8 },
      v.scene,
    );
    plinth.position.set(stone.x, 0.1, stone.z);
    plinth.material = v.material('hearth stone', '#647680', true);
    plinth.parent = root;
    const active = stone.ready || stone.progress > 0;
    const crystal = v.crystal(stone.x, 0.72, stone.z, 1.05, active ? '#8af1e3' : '#5991b2', root);
    crystal.name = 'onward hearth crystal';
    const ring = MeshBuilder.CreateTorus(
      'onward runic circle',
      { diameter: 0.76, thickness: 0.035, tessellation: 32 },
      v.scene,
    );
    ring.position.set(stone.x, 0.22, stone.z);
    ring.material = v.material(
      'onward ring ' + active,
      active ? '#94f5dc' : '#c2a668',
      false,
      active ? 0.8 : 0.15,
    );
    ring.parent = root;
    if (active) v.includeGlow(ring);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const rune = v.box(
        'onward rune',
        stone.x + Math.cos(angle) * 0.34,
        0.23,
        stone.z + Math.sin(angle) * 0.34,
        0.08,
        0.025,
        0.08,
        v.material('onward rune ' + active, active ? '#94f5dc' : '#5991b2', false, active ? 0.7 : 0.1),
        root,
      );
      rune.rotation.y = angle;
    }
    for (const mesh of root.getChildMeshes()) mesh.isPickable = false;
  }
}
