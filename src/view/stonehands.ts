import { TransformNode } from '@babylonjs/core';
import type { GameScene } from './scene';
import { residentSurface } from './resident-detail';
import { mergeResident, residentSculpt } from './resident-sculpt';

/** Stonehands v2: a hollow clockwork chassis, optical lamp and woven load basket. */
export function createStonehandModel(v: GameScene, id: number) {
  const root = new TransformNode(`stonehand-${id}`, v.scene),
    s = residentSculpt(v, root);
  const iron = residentSurface(v, 'stonehand blackened iron', '#424948', true),
    edge = residentSurface(v, 'stonehand worn steel', '#85857a', true),
    brass = residentSurface(v, 'stonehand aged brass', '#a88343', true),
    dark = residentSurface(v, 'stonehand recesses', '#272b29', true),
    stone = residentSurface(v, 'stonehand rune stone', '#999382'),
    wicker = residentSurface(v, 'stonehand wicker', '#795535'),
    weave = residentSurface(v, 'stonehand wicker lights', '#a17a4d'),
    amber = v.material('sculpt stonehand amber', '#ffd05e', false, 0.8);
  function pin(name: string, x: number, y: number, z: number, r: number, parent = root) {
    s.rod(name, [x - r * 0.8, y, z], [x + r * 0.8, y, z], r, brass, parent);
    for (const side of [-1, 1])
      s.rod(
        `${name} inset`,
        [x + side * r * 0.81, y, z],
        [x + side * r * 0.88, y, z],
        r * 0.66,
        dark,
        parent,
      );
    for (const side of [-1, 1])
      s.rod(`${name} axle`, [x + side * r * 0.9, y, z], [x + side * r * 0.97, y, z], r * 0.34, edge, parent);
  }
  const legs = [-0.064, 0.064].map((x, i) => {
    const leg = new TransformNode('stonehand hip', v.scene);
    leg.parent = root;
    leg.position.set(x, 0.205, 0);
    pin('hip flywheel', 0, 0, 0, 0.031, leg);
    for (const side of [-1, 1])
      s.rod('forked thigh rail', [side * 0.012, -0.017, 0], [side * 0.012, -0.092, 0.012], 0.0075, iron, leg);
    pin('exposed knee gear', 0, -0.099, 0.014, 0.022, leg);
    for (const side of [-1, 1])
      s.rod('shin linkage', [side * 0.01, -0.117, 0.01], [side * 0.01, -0.166, -0.009], 0.0065, iron, leg);
    s.line(
      'copper tendon',
      [
        [i ? -0.017 : 0.017, -0.015, -0.011],
        [i ? -0.023 : 0.023, -0.09, -0.016],
        [i ? -0.018 : 0.018, -0.163, -0.022],
      ],
      0.0038,
      brass,
      leg,
    );
    pin('ankle joint', 0, -0.174, -0.005, 0.016, leg);
    s.box('splayed steel foot', [0, -0.19, 0.022], [0.064, 0.028, 0.1], iron, leg, 0.008);
    s.box('worn brass toe cap', [0, -0.188, 0.061], [0.063, 0.019, 0.019], brass, leg, 0.004);
    s.box('foot center plate', [0, -0.177, 0.023], [0.043, 0.014, 0.062], edge, leg, 0.005);
    return leg;
  });
  s.box('hip coupler', [0, 0.207, 0], [0.085, 0.042, 0.057], iron);
  for (const x of [-0.074, 0.074]) {
    s.line(
      'bowed open chest rail',
      [
        [x * 0.65, 0.225, 0.016],
        [x, 0.255, 0.014],
        [x, 0.335, 0.007],
        [x * 0.81, 0.385, 0],
      ],
      0.012,
      iron,
    );
    s.line(
      'chest brass inner edge',
      [
        [x * 0.64, 0.232, 0.026],
        [x * 0.86, 0.263, 0.026],
        [x * 0.85, 0.335, 0.02],
        [x * 0.69, 0.373, 0.012],
      ],
      0.004,
      brass,
    );
    for (const y of [0.25, 0.35])
      s.box('chassis clamp', [x, y, 0.014], [0.03, 0.021, 0.038], brass, root, 0.005);
  }
  for (const y of [0.225, 0.376]) s.box('frame crossbrace', [0, y, 0], [0.15, 0.023, 0.04], iron);
  s.rod('shoulder axle', [-0.116, 0.366, 0], [0.116, 0.366, 0], 0.016, edge);
  s.rod('hanging core link', [0, 0.367, 0], [0, 0.324, 0.012], 0.006, brass);
  s.plate(
    'faceted stone core',
    [
      [-0.034, 0.298],
      [-0.024, 0.326],
      [0.012, 0.337],
      [0.038, 0.3],
      [0.023, 0.265],
      [-0.008, 0.254],
    ],
    0.017,
    0.026,
    stone,
  );
  s.line(
    'amber diamond rune',
    [
      [0, 0.322, 0.034],
      [0.017, 0.297, 0.034],
      [0, 0.273, 0.034],
      [-0.017, 0.297, 0.034],
      [0, 0.322, 0.034],
    ],
    0.0045,
    amber,
  );
  s.ellipsoid('rune center', [0, 0.297, 0.036], [0.012, 0.014, 0.006], amber);
  s.rod('neck piston', [0, 0.382, 0], [0, 0.427, 0], 0.013, iron);
  s.torus('neck brass bearing', [0, 0.405, 0], 0.041, 0.01, brass, root, false);
  s.ellipsoid('domed brass optic housing', [0, 0.465, 0.006], [0.132, 0.12, 0.124], brass);
  s.rod('lamp cylindrical bezel', [0, 0.464, 0.052], [0, 0.464, 0.082], 0.047, iron);
  s.torus('outer optic brass lip', [0, 0.464, 0.084], 0.083, 0.012, brass);
  s.ellipsoid('deep lamp recess', [0, 0.464, 0.089], [0.063, 0.063, 0.009], dark);
  s.ellipsoid('convex amber lens', [0, 0.464, 0.094], [0.049, 0.049, 0.016], amber);
  s.torus('inner optic ring', [0, 0.464, 0.094], 0.053, 0.004, edge);
  for (const side of [-1, 1]) {
    s.rod('optic side bearing', [side * 0.06, 0.464, 0.005], [side * 0.075, 0.464, 0.005], 0.02, iron);
    s.rod('optic side cap', [side * 0.074, 0.464, 0.005], [side * 0.079, 0.464, 0.005], 0.014, brass);
    for (const y of [0.438, 0.489])
      s.ellipsoid('housing rivet', [side * 0.039, y, 0.047], [0.009, 0.009, 0.007], edge);
  }
  s.rod('lamp vent stem', [0.018, 0.519, -0.01], [0.022, 0.538, -0.013], 0.006, iron);
  s.rod('lamp vent lid', [0.022, 0.536, -0.013], [0.023, 0.541, -0.014], 0.012, brass);
  // The empty basket remains a true open cavity. Cargo has its own visibility pivot.
  s.box('basket floor', [0, 0.258, -0.106], [0.162, 0.018, 0.115], wicker);
  for (const y of [0.273, 0.291, 0.309, 0.327, 0.345, 0.363]) {
    const width = 0.16 + (y - 0.27) * 0.3;
    s.line(
      'woven basket course',
      [
        [-width / 2, y, -0.06],
        [-width / 2 - 0.004, y, -0.162],
        [0, y + 0.002, -0.17],
        [width / 2 + 0.004, y, -0.162],
        [width / 2, y, -0.06],
      ],
      0.006,
      wicker,
    );
    s.line(
      'raised wicker strand',
      [
        [-width / 2, y + 0.006, -0.162],
        [0, y + 0.006, -0.173],
        [width / 2, y + 0.006, -0.162],
      ],
      0.0027,
      weave,
    );
  }
  for (const x of [-0.08, -0.04, 0, 0.04, 0.08])
    s.rod('basket vertical rib', [x * 0.88, 0.256, -0.161], [x * 1.12, 0.378, -0.17], 0.0055, weave);
  for (const x of [-0.091, 0.091]) {
    s.box('basket corner iron', [x, 0.313, -0.165], [0.016, 0.139, 0.016], iron, root, 0.004);
    s.line(
      'basket rim lash',
      [
        [x, 0.359, -0.053],
        [x * 1.06, 0.38, -0.09],
        [x * 1.06, 0.378, -0.164],
      ],
      0.009,
      weave,
    );
    s.line(
      'basket shoulder mount',
      [
        [x * 0.65, 0.375, -0.014],
        [x, 0.38, -0.047],
        [x, 0.326, -0.069],
      ],
      0.009,
      brass,
    );
  }
  s.line(
    'basket heavy rim',
    [
      [-0.099, 0.377, -0.052],
      [-0.103, 0.377, -0.17],
      [0.103, 0.377, -0.17],
      [0.099, 0.377, -0.052],
    ],
    0.0085,
    wicker,
  );
  const load = new TransformNode('stonehand cargo', v.scene);
  load.parent = root;
  const gold = residentSurface(v, 'stonehand cargo gold', '#dfaa42', true);
  for (let i = 0; i < 5; i++) {
    const nugget = s.ellipsoid(
      'basket gold',
      [Math.sin(i * 2.4) * 0.054, 0.375 + (i % 2) * 0.024, -0.116 + Math.cos(i * 3) * 0.023],
      [0.055, 0.049, 0.053],
      gold,
      load,
    );
    nugget.rotation.set(i * 0.6, i * 0.7, i * 0.4);
  }
  load.setEnabled(false);
  const arms = [-0.114, 0.114].map((x) => {
    const arm = new TransformNode('stonehand shoulder', v.scene);
    arm.parent = root;
    arm.position.set(x, 0.365, 0);
    pin('shoulder bearing', 0, 0, 0, 0.028, arm);
    for (const side of [-1, 1])
      s.rod(
        'paired upper-arm linkage',
        [side * 0.009, -0.018, 0],
        [side * 0.009, -0.083, 0.01],
        0.006,
        iron,
        arm,
      );
    pin('elbow bearing', 0, -0.09, 0.013, 0.019, arm);
    for (const side of [-1, 1])
      s.rod(
        'forearm linkage',
        [side * 0.009, -0.104, 0.013],
        [side * 0.009, -0.151, 0.025],
        0.006,
        iron,
        arm,
      );
    s.torus('wrist cuff', [0, -0.153, 0.025], 0.032, 0.007, brass, arm, false);
    s.box('split iron palm', [0, -0.167, 0.029], [0.036, 0.026, 0.037], iron, arm, 0.006);
    for (const side of [-1, 1]) {
      s.rod('jointed pincer', [side * 0.014, -0.174, 0.027], [side * 0.023, -0.195, 0.041], 0.007, iron, arm);
      s.box(
        'chiseled stone finger',
        [side * 0.022, -0.204, 0.043],
        [0.018, 0.031, 0.024],
        stone,
        arm,
        0.006,
      ).rotation.z = side * 0.18;
    }
    return arm;
  });
  const tool = new TransformNode('stonehand pickaxe', v.scene);
  tool.parent = arms[1];
  tool.rotation.z = -0.35;
  s.rod('pick ash handle', [0, -0.23, 0.063], [0, 0.035, 0.063], 0.011, wicker, tool);
  s.plate(
    'forged tapered pick',
    [
      [-0.135, -0.044],
      [-0.096, 0.025],
      [-0.036, 0.055],
      [0.032, 0.051],
      [0.095, 0.014],
      [0.13, -0.053],
      [0.101, -0.015],
      [0.024, 0.024],
      [-0.029, 0.029],
      [-0.092, -0.003],
    ],
    0.063,
    0.025,
    iron,
    tool,
  );
  s.box('pick central socket', [0, 0.035, 0.063], [0.037, 0.05, 0.039], brass, tool, 0.007);
  mergeResident(v, root);
  return {
    root,
    legs,
    arm: arms[1],
    leftArm: arms[0],
    tool,
    load,
    shadow: v.shadow(0, 0, 0.39, 0.38, v.terrainRoot),
    trainingWeights: [],
    stride: id,
    walking: false,
  };
}
