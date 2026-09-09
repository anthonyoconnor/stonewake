import { TransformNode, Vector3, type Mesh } from '@babylonjs/core';
import type { GameScene } from './scene';
import type { Defense } from '../game/types';
import { defenseDirections } from '../content/defenses';
import { mergePropGroup, propParts, propSurface } from './arcana-prop-parts';

export interface TrapModel {
  root: TransformNode;
  spikes?: TransformNode;
  plate?: TransformNode;
  bolt?: TransformNode;
  bow?: TransformNode;
  loaded?: TransformNode;
  winches?: TransformNode[];
  strings?: Mesh[];
}

/** Native one-tile footprint. The live view and permanent comparison room share this factory. */
export function createTrapModel(v: GameScene, d: Defense, parent?: TransformNode): TrapModel {
  const root = new TransformNode(`refined ${d.type} ${d.id}`, v.scene);
  root.position.set(d.x, 0, d.z);
  if (parent) root.parent = parent;
  const p = propParts(v),
    iron = propSurface(v, 'forged iron', '#303d46', 'iron'),
    edge = propSurface(v, 'polished steel', '#8c9aa5', 'iron'),
    bronze = propSurface(v, 'aged bronze', '#9f7c49', 'bronze'),
    dark = propSurface(v, 'socket shadow', '#10191f', 'iron'),
    wood = propSurface(v, 'oiled walnut', '#5b3b27', 'wood'),
    cord = v.material('arcana trap cord', '#bcad88');
  p.box(root, 'heavy chamfered trap housing', 0, 0.065, 0, 0.91, 0.13, 0.91, iron, 0.025);
  for (const side of [-1, 1]) {
    p.box(root, 'bronze perimeter rim', side * 0.446, 0.12, 0, 0.016, 0.018, 0.73, bronze);
    p.box(root, 'bronze perimeter rim', 0, 0.12, side * 0.446, 0.73, 0.018, 0.016, bronze);
  }
  for (const x of [-0.372, 0.372])
    for (const z of [-0.372, 0.372]) {
      p.box(root, 'cast bronze corner cap', x, 0.094, z, 0.166, 0.15, 0.166, bronze, 0.021);
      p.cylinder(root, 'recessed hex corner bolt', x, 0.18, z, 0.081, 0.035, edge, 6);
      p.cylinder(root, 'bolt washer', x, 0.163, z, 0.105, 0.012, dark, 12);
      p.box(root, 'corner slot', x, 0.199, z, 0.036, 0.006, 0.009, dark);
    }
  const model: TrapModel = { root };
  if (d.type === 'spike-trap') {
    const spikes = (model.spikes = new TransformNode('nine rising forged spikes', v.scene));
    spikes.parent = root;
    const plate = (model.plate = new TransformNode('pressure plate and sockets', v.scene));
    plate.parent = root;
    p.box(plate, 'inset pressure plate', 0, 0.117, 0, 0.694, 0.034, 0.694, dark);
    for (const x of [-0.23, 0, 0.23])
      for (const z of [-0.23, 0, 0.23]) {
        p.box(plate, 'guide plate', x, 0.14, z, 0.222, 0.027, 0.222, iron);
        p.box(plate, 'deep square spike socket', x, 0.157, z, 0.157, 0.007, 0.157, dark);
        for (const s of [-1, 1]) {
          p.box(plate, 'worn guide collar', x + s * 0.087, 0.162, z, 0.013, 0.012, 0.186, bronze);
          p.box(plate, 'worn guide collar', x, 0.162, z + s * 0.087, 0.16, 0.012, 0.013, bronze);
        }
        const shaft = p.cylinder(
          spikes,
          'forged four-sided spike body',
          x,
          0.35,
          z,
          0.16,
          0.42,
          iron,
          4,
          0.12,
        );
        shaft.rotation.y = Math.PI / 4;
        const tip = p.cylinder(spikes, 'honed diamond spike point', x, 0.65, z, 0.12, 0.18, edge, 4, 0);
        tip.rotation.y = Math.PI / 4;
      }
    for (const side of [-1, 1])
      for (let j = 0; j < 5; j++) {
        p.box(
          root,
          'slatted pressure edge',
          side * 0.393,
          0.155,
          (j - 2) * 0.043,
          0.044,
          0.026,
          0.017,
          bronze,
        );
        p.box(
          root,
          'slatted pressure edge',
          (j - 2) * 0.043,
          0.155,
          side * 0.393,
          0.017,
          0.026,
          0.044,
          bronze,
        );
      }
    const rune = v.material('arcana trap inlaid blue', '#477d94', false, 0.08);
    for (const side of [-1, 1])
      for (const offset of [-0.255, 0.255]) {
        const a = p.box(root, 'small inlaid diamond', side * 0.392, 0.153, offset, 0.045, 0.007, 0.045, rune);
        a.rotation.y = Math.PI / 4;
        const b = p.box(root, 'diamond inset', side * 0.392, 0.159, offset, 0.027, 0.007, 0.027, iron);
        b.rotation.y = Math.PI / 4;
      }
    mergePropGroup(v, spikes);
    mergePropGroup(v, plate);
    mergePropGroup(v, root);
    updateTrapModel(model, d, v.world.elapsed, v.effects.reduced);
    return model;
  }
  const facing = defenseDirections[d.rotation];
  root.rotation.y = Math.atan2(facing.x, facing.z);
  p.cylinder(root, 'bronze pivot foundation', 0, 0.17, 0, 0.54, 0.075, bronze, 16);
  p.cylinder(root, 'black bearing race', 0, 0.223, 0, 0.45, 0.04, dark, 16);
  p.cylinder(root, 'turntable cap', 0, 0.253, 0, 0.4, 0.035, iron, 16);
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    p.cylinder(root, 'bearing rivet', Math.cos(a) * 0.23, 0.219, Math.sin(a) * 0.23, 0.025, 0.02, edge, 6);
  }
  for (const side of [-1, 1]) {
    p.box(root, 'cradle foot', side * 0.195, 0.225, 0, 0.09, 0.09, 0.38, iron);
    p.line(
      root,
      'triangular cradle brace',
      new Vector3(side * 0.2, 0.23, 0.16),
      new Vector3(side * 0.14, 0.395, -0.1),
      0.059,
      iron,
    );
    p.line(
      root,
      'bronze cradle border',
      new Vector3(side * 0.212, 0.25, 0.13),
      new Vector3(side * 0.159, 0.36, -0.1),
      0.012,
      bronze,
    );
  }
  const bow = (model.bow = new TransformNode('crossbow carriage and recoil', v.scene));
  bow.parent = root;
  for (const side of [-1, 1])
    p.box(bow, 'split walnut rail', side * 0.063, 0.405, -0.015, 0.071, 0.13, 0.7, wood, 0.017);
  p.box(bow, 'dark bolt groove', 0, 0.45, -0.014, 0.05, 0.012, 0.67, dark);
  for (const z of [-0.3, 0.15]) {
    p.box(bow, 'rail metal saddle', 0, 0.4, z, 0.205, 0.14, 0.07, iron);
    p.box(bow, 'saddle bronze edge', 0, 0.477, z, 0.2, 0.018, 0.019, bronze);
    for (const side of [-1, 1])
      p.cylinder(bow, 'rail saddle rivet', side * 0.075, 0.49, z, 0.025, 0.016, edge, 6);
  }
  // Segmented curved limbs follow the actual +Z firing rail, with swept-back tips.
  for (const side of [-1, 1]) {
    const points = [
      new Vector3(0, 0.42, 0.18),
      new Vector3(side * 0.16, 0.42, 0.175),
      new Vector3(side * 0.3, 0.42, 0.11),
      new Vector3(side * 0.41, 0.42, 0.015),
      new Vector3(side * 0.445, 0.42, -0.07),
    ];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1],
        mid = a.add(b).scale(0.5);
      const limb = p.box(
        bow,
        'curved forged crossbow limb',
        mid.x,
        mid.y,
        mid.z,
        a.subtract(b).length() + 0.015,
        0.071,
        0.058,
        iron,
      );
      limb.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      p.line(
        bow,
        'bright limb edge',
        a.add(new Vector3(0, 0.038, 0)),
        b.add(new Vector3(0, 0.038, 0)),
        0.009,
        edge,
      );
    }
    p.box(bow, 'bronze string nock', side * 0.445, 0.422, -0.07, 0.065, 0.088, 0.075, bronze);
  }
  model.strings = [];
  for (const side of [-1, 1])
    model.strings.push(
      p.line(
        bow,
        'taut braided bowstring',
        new Vector3(side * 0.445, 0.437, -0.07),
        new Vector3(0, 0.437, -0.29),
        0.014,
        cord,
      ),
    );
  p.box(bow, 'rear latch', 0, 0.475, -0.315, 0.087, 0.075, 0.055, iron);
  model.winches = [];
  for (const side of [-1, 1]) {
    const winch = new TransformNode('winding wheel', v.scene);
    winch.parent = root;
    winch.position.set(side * 0.15, 0.362, -0.27);
    model.winches.push(winch);
    const ring = p.torus(winch, 'bronze winch rim', 0, 0, 0, 0.17, 0.025, bronze, 16);
    ring.rotation.z = Math.PI / 2;
    const hub = p.cylinder(winch, 'winding axle', 0, 0, 0, 0.058, 0.11, edge, 10);
    hub.rotation.z = Math.PI / 2;
    for (let j = 0; j < 6; j++) {
      const a = (j * Math.PI) / 3;
      p.line(
        winch,
        'wheel spoke',
        Vector3.Zero(),
        new Vector3(0, Math.cos(a) * 0.075, Math.sin(a) * 0.075),
        0.015,
        bronze,
      );
    }
    for (let j = 0; j < 12; j++) {
      const a = (j * Math.PI) / 6;
      p.box(
        winch,
        'gear tooth',
        -0.025,
        Math.cos(a) * 0.094,
        Math.sin(a) * 0.094,
        0.034,
        0.025,
        0.025,
        bronze,
      ).rotation.x = a;
    }
    mergePropGroup(v, winch);
  }
  const spindle = p.cylinder(root, 'rear winding drum', 0, 0.362, -0.27, 0.1, 0.21, iron, 12);
  spindle.rotation.z = Math.PI / 2;
  for (let i = 0; i < 7; i++) {
    const winding = p.torus(
      root,
      'braided winding cord',
      (i - 3) * 0.012,
      0.362,
      -0.27,
      0.103,
      0.009,
      cord,
      12,
    );
    winding.rotation.z = Math.PI / 2;
  }
  const arrow = (parent: TransformNode, name: string, baseZ: number) => {
    p.box(parent, `${name} walnut shaft`, 0, 0.5, baseZ, 0.021, 0.021, 0.51, wood);
    const tip = p.cylinder(parent, `${name} diamond arrowhead`, 0, 0.5, baseZ + 0.3, 0.073, 0.12, edge, 4, 0);
    tip.rotation.x = Math.PI / 2;
    for (const side of [-1, 1])
      p.box(
        parent,
        `${name} pale fletching`,
        side * 0.023,
        0.509,
        baseZ - 0.195,
        0.046,
        0.012,
        0.1,
        cord,
      ).rotation.y = side * 0.28;
    p.box(parent, `${name} steel ferrule`, 0, 0.5, baseZ + 0.226, 0.032, 0.032, 0.064, iron);
  };
  model.loaded = new TransformNode('loaded crossbow bolt', v.scene);
  model.loaded.parent = bow;
  arrow(model.loaded, 'loaded', 0.025);
  model.bolt = new TransformNode('fired crossbow bolt', v.scene);
  model.bolt.parent = root;
  arrow(model.bolt, 'fired', 0);
  p.box(root, 'inlaid facing arrow stem', 0, 0.145, 0.35, 0.032, 0.012, 0.13, bronze);
  for (const side of [-1, 1])
    p.box(
      root,
      'inlaid facing arrow head',
      side * 0.042,
      0.145,
      0.382,
      0.025,
      0.012,
      0.125,
      bronze,
    ).rotation.y = side * -0.69;
  mergePropGroup(v, model.loaded);
  mergePropGroup(v, model.bolt);
  mergePropGroup(v, bow);
  mergePropGroup(v, root);
  updateTrapModel(model, d, v.world.elapsed, v.effects.reduced);
  return model;
}

export function updateTrapModel(m: TrapModel, d: Defense, elapsed: number, reduced: boolean) {
  const age = elapsed - d.triggeredAt,
    active = age >= 0 && age < 2;
  if (m.spikes) {
    // The two-second fully raised interval is the gameplay pin, not a decorative timer.
    const rise = active ? (reduced ? 1 : Math.min(1, age / 0.08)) : 0;
    m.spikes.position.y = -0.51 * (1 - rise);
    if (m.plate) m.plate.position.y = active ? -0.012 : 0;
  }
  if (m.bolt) {
    m.bolt.setEnabled(!reduced && age >= 0 && age < 0.22 && !!d.shotEnd);
    if (d.shotEnd)
      m.bolt.position.z =
        Math.hypot(d.shotEnd.x - d.x, d.shotEnd.z - d.z) * Math.min(1, Math.max(0, age) / 0.2);
    if (m.bow)
      m.bow.position.z = !reduced && age >= 0 && age < 0.3 ? -0.065 * Math.sin((age / 0.3) * Math.PI) : 0;
    m.loaded?.setEnabled(age < 0 || elapsed >= d.readyAt);
    for (const winch of m.winches ?? [])
      winch.rotation.x = !reduced && elapsed < d.readyAt && age >= 0 ? Math.min(age, 3) * Math.PI * 1.5 : 0;
  }
}
