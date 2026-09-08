import { MeshBuilder, TransformNode, type Mesh } from '@babylonjs/core';
import type { GameScene } from './scene';
import type { Resident } from '../game/types';
import { residentSurface } from './resident-detail';
export interface HoundRig {
  head: TransformNode;
  tail: TransformNode;
  jaw: TransformNode;
}

export function createHoundModel(v: GameScene, id: number) {
  const root = new TransformNode(`hound-${id}`, v.scene);
  const fur = residentSurface(v, 'hound charcoal fur', '#4c4943'),
    tan = residentSurface(v, 'hound sandy fur', '#ad9876'),
    dark = v.material('hound nose', '#252728'),
    leather = v.material('hound harness', '#624a32'),
    brass = v.material('hound brass', '#b49152'),
    eye = v.material('hound amber eyes', '#c69443');
  const round = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat = fur,
    parent = root,
  ) => {
    const m = MeshBuilder.CreateSphere(name, { diameter: 1, segments: 8 }, v.scene);
    m.position.set(x, y, z);
    m.scaling.set(w, h, d);
    m.material = mat;
    m.parent = parent;
    m.isPickable = false;
    return m;
  };
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat = leather,
    parent = root,
  ) => {
    const m = v.box(name, x, y, z, w, h, d, mat, parent);
    m.isPickable = false;
    return m;
  };
  round('stocky hound body', 0, 0.31, 0, 0.37, 0.34, 0.64);
  round('hound chest', 0, 0.32, 0.22, 0.34, 0.35, 0.3);
  const legs = [
    [-0.14, 0.2],
    [0.14, 0.2],
    [-0.14, -0.22],
    [0.14, -0.22],
  ].map(([x, z]) => {
    const leg = new TransformNode('hound leg', v.scene);
    leg.parent = root;
    leg.position.set(x, 0.26, z);
    round('short furry leg', 0, -0.075, 0, 0.13, 0.2, 0.15, fur, leg);
    round('broad hound paw', 0, -0.21, 0.025, 0.15, 0.095, 0.19, tan, leg);
    for (const dx of [-0.045, 0, 0.045]) box('small claw', dx, -0.22, 0.105, 0.016, 0.02, 0.025, dark, leg);
    return leg;
  });
  const head = new TransformNode('hound head pivot', v.scene);
  head.parent = root;
  head.position.set(0, 0.41, 0.25);
  round('terrier head', 0, 0.09, 0.07, 0.3, 0.29, 0.31, fur, head);
  round('hound muzzle', 0, 0.025, 0.24, 0.22, 0.14, 0.23, tan, head);
  round('hound nose', 0, 0.055, 0.34, 0.105, 0.07, 0.065, dark, head);
  const jaw = new TransformNode('hound jaw', v.scene);
  jaw.parent = head;
  jaw.position.set(0, -0.025, 0.16);
  round('bearded jaw', 0, 0, 0.055, 0.19, 0.095, 0.18, tan, jaw);
  for (const x of [-0.102, 0.102]) {
    round('hound eye', x, 0.12, 0.185, 0.056, 0.05, 0.035, dark, head);
    round('amber iris', x, 0.12, 0.204, 0.025, 0.03, 0.012, eye, head);
    round('bushy eyebrow', x, 0.165, 0.18, 0.11, 0.045, 0.075, tan, head).rotation.z = -Math.sign(x) * 0.2;
    const ear = MeshBuilder.CreateCylinder(
      'pointed hound ear',
      { height: 0.2, diameterBottom: 0.14, diameterTop: 0, tessellation: 3 },
      v.scene,
    );
    ear.parent = head;
    ear.position.set(x, 0.27, 0.01);
    ear.rotation.z = x < 0 ? 0.4 : -0.15;
    ear.scaling.set(1, 0.85, 0.55);
    ear.material = fur;
    ear.isPickable = false;
  }
  // Uneven tufts break the silhouette without a heavy coat of equipment.
  for (let i = 0; i < 12; i++) {
    const tuft = MeshBuilder.CreateCylinder(
      'scruffy fur tip',
      { height: 0.11, diameterBottom: 0.065, diameterTop: 0, tessellation: 3 },
      v.scene,
    );
    tuft.parent = root;
    tuft.position.set(Math.sin(i * 7) * 0.13, 0.45, -0.24 + i * 0.04);
    tuft.rotation.set(-0.45, 0, Math.sin(i) * 0.8);
    tuft.material = fur;
    tuft.isPickable = false;
  }
  const tail = new TransformNode('hound tail pivot', v.scene);
  tail.parent = root;
  tail.position.set(0, 0.34, -0.3);
  const tailFur = MeshBuilder.CreateCylinder(
    'tapered furry tail',
    { height: 0.27, diameterBottom: 0.12, diameterTop: 0.015, tessellation: 7 },
    v.scene,
  );
  tailFur.parent = tail;
  tailFur.position.set(0, 0.07, -0.08);
  tailFur.rotation.x = -0.8;
  tailFur.material = fur;
  tailFur.isPickable = false;
  box('back harness strap', 0, 0.474, -0.06, 0.34, 0.018, 0.045);
  for (const x of [-0.17, 0.17]) box('side harness', x, 0.34, 0.01, 0.018, 0.22, 0.043).rotation.x = -0.25;
  const collar = MeshBuilder.CreateTorus(
    'hound leather collar',
    { diameter: 0.29, thickness: 0.036, tessellation: 12 },
    v.scene,
  );
  collar.parent = root;
  collar.position.set(0, 0.4, 0.27);
  collar.rotation.x = 0.5;
  collar.material = leather;
  collar.isPickable = false;
  box('brass rune tag', -0.05, 0.32, 0.35, 0.06, 0.075, 0.018, brass);
  box('hooded lantern frame', 0.075, 0.3, 0.35, 0.072, 0.1, 0.06, brass);
  const lamp = box(
    'small amber rune lamp',
    0.075,
    0.3,
    0.387,
    0.045,
    0.065,
    0.013,
    v.material('hound lantern', '#ffca67', false, 0.7),
  );
  v.includeGlow(lamp);
  const arm = new TransformNode('hound unused arm', v.scene),
    leftArm = new TransformNode('hound unused left arm', v.scene),
    tool = new TransformNode('hound empty tool', v.scene),
    load = new TransformNode('hound empty cargo', v.scene);
  for (const node of [arm, leftArm, tool, load]) node.parent = root;
  return {
    root,
    legs,
    arm,
    leftArm,
    tool,
    load,
    shadow: v.shadow(0, 0, 0.57, 0.8, v.terrainRoot),
    trainingWeights: [],
    stride: id,
    walking: false,
    hound: { head, tail, jaw },
  };
}

export function animateHound(
  m: {
    root: TransformNode;
    legs: TransformNode[];
    shadow: Mesh;
    stride: number;
    walking: boolean;
    hound: HoundRig;
  },
  a: Resident,
  time: number,
  reduced: boolean,
) {
  const sleeping = a.job?.kind === 'sleep' && !a.path.length,
    eating = a.job?.kind === 'eat' && !a.path.length,
    scouting = a.job?.kind === 'scout' && !a.path.length;
  m.root.position.set(
    a.x,
    sleeping ? -0.09 : m.walking && !reduced ? Math.abs(Math.sin(m.stride)) * 0.018 : 0,
    a.z,
  );
  m.root.rotation.set(0, a.facing, sleeping ? 0.22 : 0);
  m.root.scaling.set(1, sleeping ? 0.75 : 1, 1);
  m.legs.forEach(
    (leg, i) =>
      (leg.rotation.x = sleeping
        ? i < 2
          ? -0.9
          : 0.9
        : m.walking
          ? Math.sin(m.stride + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.48
          : 0),
  );
  m.hound.head.rotation.x = sleeping ? 0.28 : eating || scouting ? 0.38 + Math.sin(time * 5) * 0.06 : 0;
  m.hound.tail.rotation.y = reduced || sleeping ? 0 : Math.sin(time * (m.walking ? 6 : 3)) * 0.2;
  const biting =
    a.activity === 'Fighting' ? Math.max(0, 1 - (time - ((a.nextAttackAt ?? time) - 1)) / 0.35) : 0;
  m.hound.jaw.rotation.x = biting * 0.55 + (eating ? Math.abs(Math.sin(time * 6)) * 0.2 : 0);
  if (biting) {
    m.hound.head.rotation.x = -biting * 0.15;
    m.root.position.x += Math.sin(a.facing) * biting * 0.055;
    m.root.position.z += Math.cos(a.facing) * biting * 0.055;
  }
  if (a.hitAt !== undefined && !reduced) m.root.rotation.z -= Math.max(0, 1 - (time - a.hitAt) / 0.25) * 0.12;
  m.shadow.position.set(a.x, 0.025, a.z);
}
