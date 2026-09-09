/** Frozen main Hearth geometry from September 9, before the spells/traps/hearth overhaul. */
import { Color3, MeshBuilder, TransformNode, type StandardMaterial } from '@babylonjs/core';
import type { GameScene } from './scene';
import { dressedBlock, crystalMesh } from './arcana-environment-baseline';
import type { StoneHearthPose } from './hearth-models';
export function createStartingStoneHearthModel(view: GameScene, parent?: TransformNode) {
  const root = new TransformNode('starting stone hearth', view.scene);
  if (parent) root.parent = parent;

  const x = 0,
    z = 0;
  const base = MeshBuilder.CreateCylinder(
    'hearth dais',
    { height: 0.3, diameter: 2.7, tessellation: 8 },
    view.scene,
  );
  base.position.set(x, 0.15, z);
  base.material = view.material('hearth stone', '#647680', true);
  base.parent = root;
  view.shadow(x, z, 3.7, 3.7, root);
  for (const diameter of [2.2, 2.48]) {
    const ring = MeshBuilder.CreateTorus(
      'runic circle',
      { diameter, thickness: 0.025, tessellation: 48 },
      view.scene,
    );
    ring.position.set(x, 0.32, z);
    ring.material = view.material('hearth brass', '#c2a668', false, 0.2);
    ring.parent = root;
    ring.isPickable = false;
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const block = dressedBlock(
      view,
      'crystal cradle',
      x + Math.cos(a) * 0.67,
      0.39,
      z + Math.sin(a) * 0.67,
      0.36,
      0.25,
      0.3,
      view.material('hearth stone', '#647680', true),
      root,
      0.04,
    );
    block.rotation.y = -a;
    block.isPickable = false;
    const rune = new TransformNode('hearth glyph', view.scene);
    rune.parent = root;
    rune.position.set(x + Math.cos(a) * 1.04, 0.32, z + Math.sin(a) * 1.04);
    rune.rotation.y = -a;
    for (const offset of [-0.035, 0.035]) {
      const m = view.box(
        'rune',
        offset,
        0.006,
        0,
        0.024,
        0.016,
        0.17,
        view.material('rune', '#86ebf5', false, 0.8),
        rune,
      );
      m.rotation.y = offset < 0 ? 0.35 : -0.35;
      m.isPickable = false;
    }
    view.box(
      'rune crossstroke',
      0,
      0.009,
      0.01,
      0.13,
      0.015,
      0.02,
      view.material('rune', '#86ebf5'),
      rune,
    ).isPickable = false;
  }
  crystalMesh(view, x, 1.25, z, 1.75, '#7fdef0', root);
  crystalMesh(view, x - 0.5, 0.72, z + 0.2, 0.7, '#579bd0', root);
  crystalMesh(view, x + 0.4, 0.65, z - 0.15, 0.8, '#86e5d7', root);
  const crystals = root
    .getChildMeshes()
    .filter((m) => m.name === 'crystal')
    .map((m, i) => ({
      material: m.material as StandardMaterial,
      color: ['#7fdef0', '#579bd0', '#86e5d7'][i],
    }));
  const rune = root.getChildMeshes().find((m) => m.name === 'rune')?.material as StandardMaterial;
  return { root, crystals, rune };
}
export function updateStartingStoneHearthModel(
  model: ReturnType<typeof createStartingStoneHearthModel>,
  pose: StoneHearthPose,
) {
  const pulse = pose.reduced ? 1 : 1 + Math.sin(pose.elapsed * 1.8) * 0.07;
  if (model.rune)
    model.rune.emissiveColor = Color3.FromHexString('#86ebf5').scale(0.65 * pulse * pose.integrity);
  for (const { material, color } of model.crystals) {
    material.emissiveColor = Color3.FromHexString(color).scale(0.58 * pose.integrity);
    material.diffuseColor = Color3.FromHexString(color).scale(0.25 + 0.75 * pose.integrity);
  }
}
