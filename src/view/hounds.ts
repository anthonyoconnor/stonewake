import { strikeEnvelope, turnToward } from '../content/animation';
import { TransformNode, type Mesh } from '@babylonjs/core';
import type { GameScene } from './scene';
import type { Resident } from '../game/types';
import { residentSurface } from './resident-detail';
import { mergeResident, residentSculpt } from './resident-sculpt';
export interface HoundRig {
  head: TransformNode;
  tail: TransformNode;
  jaw: TransformNode;
}

/** Cave Hound v1: an alert, wiry terrier with a deep chest and unarmored scruffy coat. */
export function createHoundModel(v: GameScene, id: number) {
  const root = new TransformNode(`hound-${id}`, v.scene),
    s = residentSculpt(v, root);
  const fur = residentSurface(v, 'hound charcoal fur', '#43423b'),
    furLight = residentSurface(v, 'hound wiry fur ridges', '#656052'),
    furDark = residentSurface(v, 'hound undercoat', '#30322d'),
    tan = residentSurface(v, 'hound sandy furnishings', '#ac9671'),
    tanLight = residentSurface(v, 'hound light beard', '#c3ad86'),
    dark = residentSurface(v, 'hound nose', '#272927'),
    earInside = residentSurface(v, 'hound ear inner', '#795c43'),
    leather = residentSurface(v, 'hound leather harness', '#62462e'),
    leatherEdge = residentSurface(v, 'hound worn leather edges', '#9b7644'),
    brass = residentSurface(v, 'hound brass fittings', '#b09252', true),
    eye = residentSurface(v, 'hound amber iris', '#bd852e'),
    ivory = residentSurface(v, 'hound tooth ivory', '#d9cdb1');
  function tuft(
    name: string,
    p: [number, number, number],
    end: [number, number, number],
    radius: number,
    mat = fur,
    parent = root,
  ) {
    const mid: [number, number, number] = [
      (p[0] + end[0]) * 0.5,
      (p[1] + end[1]) * 0.5 + 0.008,
      (p[2] + end[2]) * 0.5 + 0.009,
    ];
    s.line(name, [p, mid, end], radius, mat, parent, 0.001);
  }
  const body = s.loft(
    'hound anatomical torso',
    [
      [-0.33, 0.035, 0.055],
      [-0.3, 0.119, 0.133],
      [-0.225, 0.166, 0.156],
      [-0.09, 0.156, 0.135],
      [0.06, 0.168, 0.163],
      [0.21, 0.169, 0.19],
      [0.3, 0.133, 0.171],
      [0.34, 0.05, 0.076],
    ],
    fur,
  );
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.346;
  s.ellipsoid('deep terrier brisket', [0, 0.314, 0.23], [0.292, 0.345, 0.24], fur);
  s.ellipsoid('raised neck ruff', [0, 0.443, 0.243], [0.304, 0.337, 0.277], fur);
  s.ellipsoid('sandy chest bib', [0, 0.358, 0.334], [0.188, 0.269, 0.063], tan);
  const legs = [
    [-0.127, 0.217],
    [0.127, 0.217],
    [-0.133, -0.237],
    [0.133, -0.237],
  ].map(([x, z], i) => {
    const leg = new TransformNode('hound leg', v.scene);
    leg.parent = root;
    leg.position.set(x, 0.275, z);
    if (i < 2) {
      s.ellipsoid('muscular front upper leg', [0, -0.045, -0.012], [0.128, 0.248, 0.151], fur, leg);
      s.rod('straight terrier foreleg', [0, -0.074, 0.002], [0, -0.188, 0.013], 0.044, tan, leg, 0.034);
    } else {
      s.ellipsoid('hind haunch', [0, 0.029, -0.024], [0.163, 0.227, 0.201], fur, leg).rotation.x = -0.25;
      s.rod('angled hind thigh', [0, -0.02, -0.023], [0, -0.097, 0.038], 0.052, fur, leg, 0.038);
      s.rod('rear hock', [0, -0.095, 0.038], [0, -0.169, -0.019], 0.034, tan, leg, 0.029);
      s.rod('rear pastern', [0, -0.169, -0.019], [0, -0.222, 0.012], 0.029, tan, leg, 0.035);
    }
    s.ellipsoid('broad compact paw', [0, -0.238, 0.035], [0.131, 0.075, 0.166], tan, leg);
    for (let toe = 0; toe < 3; toe++) {
      s.ellipsoid('individual dog toe', [(toe - 1) * 0.037, -0.242, 0.091], [0.048, 0.054, 0.068], tan, leg);
      s.ellipsoid('small dark claw', [(toe - 1) * 0.037, -0.247, 0.12], [0.018, 0.019, 0.029], dark, leg);
    }
    for (let j = 0; j < 7; j++) {
      const a = (j * Math.PI * 2) / 7;
      tuft(
        'wiry leg furnishing',
        [Math.sin(a) * 0.045, -0.073, Math.cos(a) * 0.058],
        [Math.sin(a) * 0.057, -0.167, Math.cos(a) * 0.05],
        0.02,
        j % 3 ? tan : furLight,
        leg,
      );
    }
    return leg;
  });
  const head = new TransformNode('hound head pivot', v.scene);
  head.parent = root;
  head.position.set(0, 0.456, 0.281);
  s.ellipsoid('wedge shaped terrier skull', [0, 0.093, 0.04], [0.276, 0.27, 0.285], fur, head);
  s.ellipsoid('terrier nasal bridge', [0, 0.044, 0.172], [0.18, 0.125, 0.23], fur, head);
  s.ellipsoid('sandy muzzle', [0, 0.013, 0.212], [0.207, 0.108, 0.195], tan, head);
  const jaw = new TransformNode('hound jaw', v.scene);
  jaw.parent = head;
  jaw.position.set(0, -0.02, 0.129);
  s.ellipsoid('dark mouth opening', [0, 0.006, 0.084], [0.158, 0.027, 0.156], dark, jaw);
  s.ellipsoid('terrier lower jaw', [0, -0.026, 0.066], [0.17, 0.072, 0.182], tan, jaw);
  for (const side of [-1, 1])
    s.rod(
      'small canine tooth',
      [side * 0.068, 0.018, 0.098],
      [side * 0.066, -0.008, 0.108],
      0.01,
      ivory,
      jaw,
      0.003,
    );
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 0.017;
    tuft(
      'sandy beard tapered lock',
      [x, -0.032, 0.117],
      [x + Math.sin(i) * 0.012, -0.124 + Math.abs(x) * 0.32, 0.127],
      0.018,
      i % 2 ? tan : tanLight,
      jaw,
    );
  }
  s.ellipsoid('broad wet nose', [0, 0.043, 0.302], [0.111, 0.072, 0.071], dark, head);
  for (const side of [-1, 1]) {
    s.ellipsoid('recessed nostril', [side * 0.028, 0.047, 0.334], [0.027, 0.024, 0.009], furDark, head);
    s.ellipsoid('nose reflected edge', [side * 0.018, 0.07, 0.319], [0.025, 0.006, 0.009], furLight, head);
    s.ellipsoid('hound eye socket', [side * 0.095, 0.12, 0.132], [0.069, 0.076, 0.031], dark, head);
    s.ellipsoid('amber eye', [side * 0.095, 0.125, 0.148], [0.041, 0.044, 0.017], eye, head);
    s.ellipsoid('round black pupil', [side * 0.095, 0.126, 0.158], [0.023, 0.029, 0.008], dark, head);
    s.ellipsoid('eye catchlight', [side * 0.091, 0.137, 0.163], [0.009, 0.011, 0.004], ivory, head);
    s.line(
      'alert lower eyelid',
      [
        [side * 0.067, 0.105, 0.153],
        [side * 0.097, 0.093, 0.146],
        [side * 0.125, 0.111, 0.117],
      ],
      0.009,
      fur,
      head,
    );
    for (let i = 0; i < 5; i++)
      tuft(
        'expressive sandy eyebrow',
        [side * (0.056 + i * 0.018), 0.174 - i * 0.003, 0.131 - i * 0.008],
        [side * (0.071 + i * 0.019), 0.142 - i * 0.003, 0.188 - i * 0.014],
        0.018,
        i % 2 ? tan : tanLight,
        head,
      );
    for (let i = 0; i < 7; i++)
      tuft(
        'swept sandy moustache',
        [side * (0.052 + i * 0.009), 0.022 + (i % 3) * 0.013, 0.233 - i * 0.013],
        [side * (0.075 + i * 0.012), -0.05 - (i % 2) * 0.021, 0.26 - i * 0.009],
        0.021,
        i % 2 ? tan : tanLight,
        head,
      );
    for (let i = 0; i < 6; i++)
      tuft(
        'scruffy cheek',
        [side * (0.113 + (i % 2) * 0.01), 0.094 - i * 0.022, 0.059],
        [side * (0.166 + (i % 2) * 0.01), 0.037 - i * 0.024, 0.088],
        0.028,
        i % 2 ? fur : furLight,
        head,
      );
    const ear = new TransformNode('hound pointed ear', v.scene);
    ear.parent = head;
    ear.position.set(side * 0.101, 0.178, -0.032);
    ear.rotation.z = side === -1 ? 0.23 : -0.13;
    s.plate(
      'thick asymmetric terrier ear',
      [
        [-0.059, 0],
        [0.049, 0],
        [0.041, 0.066],
        [0.002, 0.187],
        [-0.036, 0.104],
      ],
      0,
      0.052,
      fur,
      ear,
    );
    s.plate(
      'warm ear lining',
      [
        [-0.034, 0.025],
        [0.024, 0.024],
        [0.025, 0.075],
        [0, 0.147],
        [-0.022, 0.086],
      ],
      0.03,
      0.009,
      earInside,
      ear,
    );
    for (let i = 0; i < 4; i++)
      tuft(
        'ear fringe',
        [side * 0.034, 0.033 + i * 0.022, -0.018],
        [side * 0.057, 0.046 + i * 0.025, -0.02],
        0.012,
        furLight,
        ear,
      );
  }
  for (let i = 0; i < 7; i++)
    tuft(
      'head crown scruff',
      [(i - 3) * 0.029, 0.18, -0.046],
      [(i - 3) * 0.035, 0.24 + (i % 2) * 0.015, -0.064],
      0.021,
      i % 2 ? fur : furLight,
      head,
    );
  // Fur follows the animal's body; silhouette breakup is clustered around neck, belly and haunches.
  for (let i = 0; i < 18; i++) {
    const z = -0.285 + i * 0.034,
      x = Math.sin(i * 2.37) * 0.075;
    tuft(
      'wiry back coat',
      [x, 0.493 + Math.sin(i * 0.4) * 0.012, z],
      [x + Math.sin(i) * 0.012, 0.501 + (i % 3) * 0.005, z - 0.046],
      0.014,
      i % 4 === 0 ? furLight : fur,
    );
  }
  for (const side of [-1, 1])
    for (let i = 0; i < 13; i++) {
      const z = -0.25 + i * 0.04;
      tuft(
        'flank coat locks',
        [side * 0.149, 0.355 + (i % 3) * 0.028, z],
        [side * 0.166, 0.317 + (i % 2) * 0.02, z - 0.039],
        0.017,
        i % 4 === 0 ? furLight : fur,
      );
      if (i < 8)
        tuft(
          'lower belly fringe',
          [side * 0.12, 0.245, z],
          [side * 0.137, 0.197, z - 0.031],
          0.022,
          i % 3 ? fur : tan,
        );
    }
  for (let i = 0; i < 9; i++)
    tuft(
      'chest bib waves',
      [(i - 4) * 0.023, 0.385, 0.349],
      [(i - 4) * 0.025, 0.244 + Math.abs(i - 4) * 0.006, 0.357],
      0.023,
      i % 2 ? tan : tanLight,
    );
  const tail = new TransformNode('hound tail pivot', v.scene);
  tail.parent = root;
  tail.position.set(0, 0.394, -0.297);
  s.line(
    'curved terrier tail',
    [
      [0, 0, 0],
      [0, 0.018, -0.096],
      [0, 0.07, -0.193],
      [0, 0.135, -0.225],
      [0, 0.177, -0.194],
    ],
    0.047,
    fur,
    tail,
    0.012,
  );
  for (let i = 0; i < 8; i++)
    tuft(
      'tail wiry locks',
      [Math.sin(i * 2) * 0.018, 0.022 + i * 0.015, -0.042 - i * 0.02],
      [Math.sin(i * 2) * 0.035, 0.049 + i * 0.015, -0.098 - i * 0.017],
      0.02,
      i % 3 ? fur : furLight,
      tail,
    );
  s.line(
    'fitted leather collar',
    [
      [0, 0.396, 0.375],
      [-0.125, 0.433, 0.339],
      [-0.153, 0.505, 0.249],
      [-0.1, 0.558, 0.195],
      [0, 0.57, 0.176],
      [0.1, 0.558, 0.195],
      [0.153, 0.505, 0.249],
      [0.125, 0.433, 0.339],
      [0, 0.396, 0.375],
    ],
    0.024,
    leather,
  );
  s.line(
    'collar edge piping',
    [
      [0, 0.386, 0.382],
      [-0.131, 0.426, 0.346],
      [-0.163, 0.504, 0.25],
      [-0.107, 0.562, 0.199],
      [0, 0.579, 0.18],
      [0.107, 0.562, 0.199],
      [0.163, 0.504, 0.25],
      [0.131, 0.426, 0.346],
      [0, 0.386, 0.382],
    ],
    0.004,
    leatherEdge,
  );
  s.line(
    'fitted body harness',
    [
      [-0.167, 0.309, -0.035],
      [-0.177, 0.41, -0.044],
      [-0.113, 0.505, -0.072],
      [0, 0.526, -0.074],
      [0.113, 0.505, -0.072],
      [0.177, 0.41, -0.044],
      [0.167, 0.309, -0.035],
      [0, 0.177, 0.007],
      [-0.167, 0.309, -0.035],
    ],
    0.018,
    leather,
  );
  for (const side of [-1, 1]) {
    s.line(
      'harness diagonal chest strap',
      [
        [side * 0.142, 0.486, 0.294],
        [side * 0.167, 0.412, 0.172],
        [side * 0.16, 0.341, 0.088],
        [side * 0.164, 0.309, -0.034],
      ],
      0.018,
      leather,
    );
    s.box('harness buckle', [side * 0.18, 0.413, -0.042], [0.025, 0.065, 0.052], brass, root, 0.007);
    for (let i = 0; i < 4; i++)
      s.ellipsoid(
        'collar brass stud',
        [side * (0.055 + i * 0.026), 0.405 + i * 0.024, 0.37 - i * 0.022],
        [0.011, 0.011, 0.01],
        brass,
      );
  }
  s.torus('rune tag suspension', [-0.035, 0.378, 0.381], 0.031, 0.006, brass);
  s.box('brass rune tag', [-0.035, 0.338, 0.385], [0.051, 0.065, 0.013], brass, root, 0.007);
  s.line(
    'engraved tag rune',
    [
      [-0.035, 0.362, 0.396],
      [-0.017, 0.341, 0.396],
      [-0.035, 0.312, 0.396],
      [-0.05, 0.341, 0.396],
      [-0.035, 0.362, 0.396],
    ],
    0.0025,
    leather,
  );
  s.torus('lamp hanging loop', [0.052, 0.378, 0.385], 0.027, 0.005, brass);
  s.box('lantern foot', [0.052, 0.302, 0.388], [0.058, 0.015, 0.049], brass, root, 0.004);
  s.box(
    'tiny amber lantern glass',
    [0.052, 0.335, 0.388],
    [0.044, 0.055, 0.032],
    v.material('sculpt hound lamp', '#ffd16b', false, 0.7),
    root,
    0.004,
  );
  s.box('lantern peaked lid', [0.052, 0.369, 0.388], [0.064, 0.019, 0.054], brass, root, 0.006);
  for (const side of [-1, 1])
    s.rod(
      'lantern cage',
      [0.052 + side * 0.023, 0.308, 0.411],
      [0.052 + side * 0.023, 0.361, 0.411],
      0.0035,
      brass,
    );
  s.line(
    'lantern rune grille',
    [
      [0.034, 0.352, 0.411],
      [0.052, 0.334, 0.411],
      [0.069, 0.352, 0.411],
      [0.052, 0.334, 0.411],
      [0.052, 0.312, 0.411],
    ],
    0.003,
    brass,
  );
  const arm = new TransformNode('hound unused arm', v.scene),
    leftArm = new TransformNode('hound unused left arm', v.scene),
    tool = new TransformNode('hound empty tool', v.scene),
    load = new TransformNode('hound empty cargo', v.scene);
  for (const node of [arm, leftArm, tool, load]) node.parent = root;
  mergeResident(v, root);
  return {
    root,
    legs,
    arm,
    leftArm,
    tool,
    load,
    shadow: v.shadow(0, 0, 0.58, 0.88, v.terrainRoot),
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
  dt = 0.05,
) {
  const sleeping = a.job?.kind === 'sleep' && !a.path.length,
    eating = a.job?.kind === 'eat' && !a.path.length,
    scouting = a.job?.kind === 'scout' && !a.path.length;
  m.root.position.set(
    a.x,
    sleeping ? -0.09 : m.walking && !reduced ? Math.abs(Math.sin(m.stride)) * 0.018 : 0,
    a.z,
  );
  m.root.rotation.set(0, turnToward(m.root.rotation.y, a.facing, dt), sleeping ? 0.22 : 0);
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
  const biting = a.activity === 'Fighting' ? strikeEnvelope(time, a.attackedAt) : 0;
  m.hound.jaw.rotation.x = biting * 0.55 + (eating ? Math.abs(Math.sin(time * 6)) * 0.2 : 0);
  if (biting) {
    m.hound.head.rotation.x = -biting * 0.15;
    m.root.position.x += Math.sin(a.facing) * biting * 0.055;
    m.root.position.z += Math.cos(a.facing) * biting * 0.055;
  }
  if (a.hitAt !== undefined && !reduced) m.root.rotation.z -= Math.max(0, 1 - (time - a.hitAt) / 0.25) * 0.12;
  m.shadow.position.set(a.x, 0.025, a.z);
}
