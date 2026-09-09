import { TransformNode, MeshBuilder, type Mesh, type StandardMaterial } from '@babylonjs/core';
import type { GameScene } from './scene';
import { type Defense } from '../game/types';
import { EnemyView } from './enemies';
import { dressedBlock } from './arcana-environment-baseline';
import { defenseById, defenseDirections } from '../content/defenses';

import { doorIsOpen, isDoor } from '../game/doors';
export interface StartingTrapModel {
  root: TransformNode;
  leaf?: TransformNode;
  lock?: Mesh;
  cracks?: TransformNode;
  spikes?: TransformNode;
  bolt?: TransformNode;
  bow?: TransformNode;
  loaded?: Mesh;
}

export class StartingDefenseView {
  fixtures = new Map<number, StartingTrapModel>();
  enemies: EnemyView;
  constructor(public view: GameScene) {
    this.enemies = new EnemyView(view);
  }
  reset() {
    for (const m of this.fixtures.values()) m.root.dispose();
    this.enemies.reset();
    this.fixtures.clear();
  }
  private box(
    parent: TransformNode,
    name: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    mat: StandardMaterial,
  ) {
    const m = dressedBlock(
      this.view,
      name,
      x,
      y,
      z,
      sx,
      sy,
      sz,
      mat,
      parent,
      Math.min(0.016, sx * 0.15, sy * 0.15, sz * 0.15),
    );
    m.isPickable = false;
    return m;
  }
  private cone(
    parent: TransformNode,
    name: string,
    x: number,
    y: number,
    z: number,
    height: number,
    diameter: number,
    mat: StandardMaterial,
    top = 0,
  ) {
    const m = MeshBuilder.CreateCylinder(
      name,
      { height, diameterBottom: diameter, diameterTop: top, tessellation: 6 },
      this.view.scene,
    );
    m.parent = parent;
    m.position.set(x, y, z);
    m.material = mat;
    m.isPickable = false;
    return m;
  }
  fixture(d: Defense): StartingTrapModel {
    const v = this.view,
      def = defenseById(d.type)!,
      root = new TransformNode(`defense ${d.id}`, v.scene);
    root.position.set(d.x, 0, d.z);
    const iron = v.material('defense iron', '#72818a'),
      dark = v.material('defense dark', '#303b40'),
      wood = v.material('defense wood', '#926b43', true),
      gold = v.material('defense brass', '#c8aa6a');
    const box = (
      name: string,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      mat: StandardMaterial,
      parent = root,
    ) => this.box(parent, name, x, y, z, sx, sy, sz, mat);
    if (def.kind === 'door') {
      root.rotation.y = (-d.rotation * Math.PI) / 2;
      for (const z of [-0.46, 0.46]) {
        box('door post', 0, 0.7, z, 0.2, 1.4, 0.11, iron);
        box('post foot', 0, 0.08, z, 0.32, 0.16, 0.2, dark);
      }
      box('door lintel', 0, 1.39, 0, 0.22, 0.15, 1.04, iron);
      for (const z of [-0.46, 0.46]) {
        box('post collar', 0, 1.29, z, 0.25, 0.07, 0.16, gold);
        for (const y of [0.3, 1.07]) box('hinge barrel', -0.15, y, z, 0.075, 0.15, 0.075, dark);
      }
      const leaf = new TransformNode('hinged door', v.scene);
      leaf.parent = root;
      leaf.position.z = -0.39;
      for (let i = 0; i < 4; i++)
        box('door panel', 0, 0.66, 0.095 + i * 0.195, 0.13, 1.27, 0.184, def.tier === 3 ? iron : wood, leaf);
      for (let i = 0; i < def.tier!; i++)
        box(
          'door reinforcement',
          -0.085,
          0.24 + i * (0.9 / Math.max(1, def.tier! - 1)),
          0.39,
          0.05,
          0.095,
          0.8,
          def.tier === 1 ? wood : dark,
          leaf,
        );
      if (def.tier === 3) {
        box('steel center ridge', -0.11, 0.66, 0.39, 0.065, 1.14, 0.08, gold, leaf);
        for (const z of [0.06, 0.71])
          for (const y of [0.22, 0.65, 1.09])
            box('door rivet', -0.118, y, z, 0.055, 0.055, 0.055, gold, leaf);
      }
      const lock = box('locked padlock', -0.16, 0.66, 0.65, 0.14, 0.2, 0.16, gold, leaf);
      const handle = MeshBuilder.CreateTorus(
        'door handle',
        { diameter: 0.13, thickness: 0.025, tessellation: 12 },
        v.scene,
      );
      handle.parent = leaf;
      handle.position.set(-0.12, 0.68, 0.66);
      handle.rotation.z = Math.PI / 2;
      handle.material = dark;
      handle.isPickable = false;
      const cracks = new TransformNode('door splinters', v.scene);
      cracks.parent = leaf;
      for (const z of [0.24, 0.47])
        box('broken panel seam', -0.105, 0.79, z, 0.025, 0.61, 0.027, dark, cracks).rotation.x =
          z === 0.24 ? 0.25 : -0.3;
      return { root, leaf, lock, cracks };
    }
    box('trap plate', 0, 0.04, 0, 0.88, 0.08, 0.88, dark);
    for (const x of [-0.4, 0.4]) box('trap edging', x, 0.09, 0, 0.04, 0.045, 0.83, iron);
    for (const z of [-0.4, 0.4]) box('trap edging', 0, 0.09, z, 0.83, 0.045, 0.04, iron);
    for (const x of [-0.37, 0.37])
      for (const z of [-0.37, 0.37]) box('trap bolt', x, 0.093, z, 0.07, 0.035, 0.07, gold);
    if (def.kind === 'spike') {
      const spikes = new TransformNode('rising spikes', v.scene);
      spikes.parent = root;
      for (const x of [-0.25, 0, 0.25])
        for (const z of [-0.25, 0, 0.25]) {
          box('spike slot', x, 0.087, z, 0.13, 0.01, 0.13, iron);
          this.cone(spikes, 'spike', x, 0.33, z, 0.64, 0.1, iron);
        }
      return { root, spikes };
    }
    const facing = defenseDirections[d.rotation];
    root.rotation.y = Math.atan2(facing.x, facing.z);
    box('crossbow pedestal', 0, 0.15, 0, 0.24, 0.24, 0.24, iron);
    const bow = new TransformNode('crossbow recoil', v.scene);
    bow.parent = root;
    box('crossbow stock', 0, 0.29, 0, 0.11, 0.12, 0.62, wood, bow);
    for (const side of [-1, 1]) {
      box('crossbow limb', side * 0.22, 0.3, 0.19, 0.44, 0.075, 0.075, iron, bow).rotation.y = side * 0.35;
      box('bowstring', side * 0.17, 0.3, 0.02, 0.39, 0.018, 0.018, gold, bow).rotation.y = side * -0.55;
      box('tension winch', side * 0.19, 0.22, -0.21, 0.13, 0.13, 0.13, gold);
    }
    const loaded = box('loaded bolt', 0, 0.37, 0.11, 0.025, 0.025, 0.63, gold, bow);
    box('direction shaft', 0, 0.096, 0.31, 0.04, 0.02, 0.24, gold);
    for (const side of [-1, 1])
      box('direction head', side * 0.06, 0.096, 0.37, 0.04, 0.02, 0.16, gold).rotation.y = side * -0.65;
    const bolt = new TransformNode('fired bolt', v.scene);
    bolt.parent = root;
    box('bolt shaft', 0, 0.38, 0, 0.035, 0.035, 0.38, gold, bolt);
    box('bolt tip', 0, 0.38, 0.21, 0.07, 0.04, 0.12, iron, bolt);
    return { root, bolt, bow, loaded };
  }
  update() {
    const w = this.view.world,
      live = new Set((w.defenses ?? []).map((d) => d.id)),
      reduced = this.view.effects.reduced;
    for (const [id, m] of this.fixtures)
      if (!live.has(id)) {
        m.root.dispose();
        this.fixtures.delete(id);
      }
    for (const d of w.defenses ?? []) {
      let m = this.fixtures.get(d.id);
      if (!m) {
        m = this.fixture(d);
        this.fixtures.set(d.id, m);
      }
      if (isDoor(d)) {
        const angle = doorIsOpen(w, d) ? Math.PI / 2 : 0;
        m.leaf!.rotation.y = reduced
          ? angle
          : m.leaf!.rotation.y +
            (angle - m.leaf!.rotation.y) * Math.min(1, this.view.engine.getDeltaTime() / 90);
        m.lock!.setEnabled(d.mode === 'locked');
        m.cracks!.setEnabled(d.health < d.maxHealth * 0.6);
      }
      if (m.spikes) {
        const age = w.elapsed - d.triggeredAt,
          active = age >= 0 && age < 2;
        m.spikes.position.y = active ? (reduced ? 0 : -0.61 * (1 - Math.min(1, age / 0.08))) : -0.61;
      }
      if (m.bolt) {
        const age = w.elapsed - d.triggeredAt;
        m.bolt.setEnabled(!reduced && age >= 0 && age < 0.22 && !!d.shotEnd);
        if (d.shotEnd)
          m.bolt.position.z = Math.hypot(d.shotEnd.x - d.x, d.shotEnd.z - d.z) * Math.min(1, age / 0.2);
        if (m.bow)
          m.bow.position.z = !reduced && age >= 0 && age < 0.3 ? -0.08 * Math.sin((age / 0.3) * Math.PI) : 0;
        m.loaded?.setEnabled(age < 0 || age > 0.3);
      }
    }
    this.enemies.update();
  }
}

/** Frozen September 9 starting trap, using the caller's isolated reference-material view. */
export function createStartingTrapModel(view: GameScene, defense: Defense, parent?: TransformNode) {
  const model = new StartingDefenseView(view).fixture(defense);
  if (parent) model.root.parent = parent;
  return model;
}
export function updateStartingTrapModel(m: StartingTrapModel, d: Defense, elapsed: number, reduced: boolean) {
  if (m.spikes) {
    const age = elapsed - d.triggeredAt,
      active = age >= 0 && age < 2;
    m.spikes.position.y = active ? (reduced ? 0 : -0.61 * (1 - Math.min(1, age / 0.08))) : -0.61;
  }
  if (m.bolt) {
    const age = elapsed - d.triggeredAt;
    m.bolt.setEnabled(!reduced && age >= 0 && age < 0.22 && !!d.shotEnd);
    if (d.shotEnd)
      m.bolt.position.z = Math.hypot(d.shotEnd.x - d.x, d.shotEnd.z - d.z) * Math.min(1, age / 0.2);
    if (m.bow)
      m.bow.position.z = !reduced && age >= 0 && age < 0.3 ? -0.08 * Math.sin((age / 0.3) * Math.PI) : 0;
    m.loaded?.setEnabled(age < 0 || age > 0.3);
  }
}
