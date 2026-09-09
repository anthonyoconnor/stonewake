import { Curve3, TransformNode, Vector3 } from '@babylonjs/core';
import type { GameScene } from './scene';
import { characterById } from '../content/characters';
import { residentSurface } from './resident-detail';
import { mergeResident, residentSculpt, type SculptRing } from './resident-sculpt';

/** Authored costume construction from the four approved dwarf turnarounds. */
export function createDwarfModel(v: GameScene, id: number, type: string) {
  const def = characterById(type)!,
    engineer = def.appearance === 'braids',
    warrior = def.appearance === 'warrior',
    scholar = def.appearance === 'runesmith';
  const root = new TransformNode(`dwarf-${id}`, v.scene),
    s = residentSculpt(v, root);
  const cloth = residentSurface(
      v,
      `${type} cloth`,
      engineer ? '#346569' : warrior ? '#783d33' : scholar ? '#333f58' : '#b48637',
    ),
    clothShade = residentSurface(
      v,
      `${type} cloth folds`,
      engineer ? '#274f53' : warrior ? '#57312d' : scholar ? '#252f44' : '#8f632c',
    ),
    clothLight = residentSurface(
      v,
      `${type} cloth raised seams`,
      engineer ? '#547a79' : warrior ? '#a2634b' : scholar ? '#4c5970' : '#c29b52',
    ),
    skin = residentSurface(v, engineer ? 'engineer skin' : 'dwarf skin', engineer ? '#ba855a' : '#c29470'),
    skinShade = residentSurface(v, 'face sculpt shadows', '#976a4b'),
    leather = residentSurface(v, 'dark leather', '#493528'),
    leatherEdge = residentSurface(v, 'worn leather edges', '#765238'),
    steel = residentSurface(v, 'blackened steel', '#525b5c', true),
    steelEdge = residentSurface(v, 'worn steel edges', '#919189', true),
    brass = residentSurface(v, 'antique brass', '#a18b56', true),
    trousers = residentSurface(v, 'charcoal trousers', '#323435'),
    ivory = residentSurface(v, 'woven ivory', '#bcba9f'),
    hair = residentSurface(
      v,
      `${type} hair`,
      warrior ? '#343430' : scholar ? '#b8b7aa' : engineer ? '#59321e' : '#975329',
    ),
    hairLight = residentSurface(
      v,
      `${type} hair ridges`,
      warrior ? '#50504a' : scholar ? '#d5d3c6' : engineer ? '#814a2a' : '#b9753c',
    ),
    hairShade = residentSurface(
      v,
      `${type} hair roots`,
      warrior ? '#232927' : scholar ? '#818b86' : engineer ? '#40291c' : '#713e24',
    ),
    eyeDark = residentSurface(v, 'eye sockets', '#352b25'),
    eyeWhite = residentSurface(v, 'eye whites', '#d6c6a4'),
    eyeIris = residentSurface(v, 'brown eyes', '#513d29'),
    rune = v.material('sculpt subtle turquoise runes', '#65a7aa', false, 0.11);
  function stitch(name: string, points: [number, number, number][], parent = root) {
    return s.line(name, points, 0.0038, leatherEdge, parent);
  }
  function rivet(x: number, y: number, z: number, parent = root, mat = steelEdge, size = 0.012) {
    s.ellipsoid('inset rivet', [x, y, z], [size, size, size * 0.48], mat, parent);
  }
  function buckle(x: number, y: number, z: number, w: number, h: number, parent = root, mat = brass) {
    s.box('buckle dark inset', [x, y, z], [w, h, 0.014], leather, parent, 0.006);
    for (const dx of [-w / 2, w / 2])
      s.box('buckle side', [x + dx, y, z + 0.009], [0.012, h, 0.014], mat, parent, 0.003);
    for (const dy of [-h / 2, h / 2])
      s.box('buckle crossbar', [x, y + dy, z + 0.009], [w, 0.012, 0.014], mat, parent, 0.003);
    s.rod('buckle tongue', [x - w * 0.2, y, z + 0.02], [x + w * 0.28, y, z + 0.02], 0.004, mat, parent);
  }
  function lock(name: string, points: [number, number, number][], radius: number, parent = root, mat = hair) {
    const path = Curve3.CreateCatmullRomSpline(
      points.map((p) => new Vector3(...p)),
      5,
    )
      .getPoints()
      .map((p) => [p.x, p.y, p.z] as [number, number, number]);
    s.line(name, path, radius, mat, parent, 0.003);
  }
  const legs = [-0.132, 0.132].map((x, i) => {
    const leg = new TransformNode('leg pivot', v.scene);
    leg.position.set(x, 0.25, 0);
    leg.parent = root;
    s.loft(
      'gathered trouser leg',
      [
        [-0.08, 0.09, 0.09],
        [-0.055, 0.093, 0.104],
        [-0.01, 0.1, 0.105],
        [0.08, 0.1, 0.1],
        [0.12, 0.075, 0.08],
      ],
      trousers,
      leg,
    );
    s.box('welted boot sole', [0, -0.221, 0.042], [0.236, 0.04, 0.324], leather, leg, 0.012);
    s.box('square heel', [0, -0.21, -0.081], [0.185, 0.041, 0.079], leather, leg, 0.008);
    s.loft(
      'leather boot upper',
      [
        [-0.206, 0.105, 0.145, 0.031],
        [-0.175, 0.114, 0.155, 0.035],
        [-0.12, 0.106, 0.128, 0.025],
        [-0.074, 0.092, 0.1],
        [0.017, 0.093, 0.089],
        [0.035, 0.084, 0.084],
      ],
      leather,
      leg,
    );
    s.ellipsoid('sculpted forged toe', [0, -0.161, 0.132], [0.21, 0.105, 0.151], steel, leg);
    s.line(
      'boot toe edging',
      [
        [-0.1, -0.189, 0.15],
        [-0.079, -0.195, 0.199],
        [0, -0.196, 0.211],
        [0.079, -0.195, 0.199],
        [0.1, -0.189, 0.15],
      ],
      0.007,
      steelEdge,
      leg,
    );
    for (const y of [-0.066, 0.016]) {
      s.box('buckled boot strap', [0, y, 0.092], [0.195, 0.034, 0.025], leatherEdge, leg, 0.006);
      buckle(i === 0 ? -0.057 : 0.057, y, 0.111, 0.039, 0.025, leg, steelEdge);
    }
    for (const dx of [-0.078, 0.078]) rivet(dx, -0.168, 0.188, leg, steelEdge, 0.009);
    s.line(
      'boot side seam',
      [
        [i ? 0.103 : -0.103, -0.19, 0.086],
        [i ? 0.093 : -0.093, -0.085, 0.046],
        [i ? 0.085 : -0.085, 0.025, 0.023],
      ],
      0.0035,
      leatherEdge,
      leg,
    );
    return leg;
  });
  s.loft(
    'tailored broad dwarf tunic',
    [
      [0.252, 0.213, 0.147],
      [0.266, 0.239, 0.166],
      [0.32, 0.25, 0.177],
      [0.4, 0.231, 0.18],
      [0.53, 0.251, 0.173],
      [0.61, 0.242, 0.155],
      [0.658, 0.185, 0.12],
      [0.681, 0.105, 0.091],
      [0.686, 0.055, 0.04],
    ],
    cloth,
  );
  for (const side of [-1, 1]) {
    s.line(
      'tailored tunic seam',
      [
        [side * 0.205, 0.287, 0.094],
        [side * 0.22, 0.4, 0.091],
        [side * 0.215, 0.535, 0.084],
        [side * 0.183, 0.625, 0.075],
      ],
      0.005,
      clothShade,
    );
    s.line(
      'cloth hem welt',
      [
        [side * 0.235, 0.274, 0.035],
        [side * 0.2, 0.272, 0.1],
        [side * 0.105, 0.274, 0.153],
        [side * 0.017, 0.274, 0.168],
      ],
      0.0045,
      clothLight,
    );
  }
  s.loft(
    'leather belt around waist',
    [
      [0.322, 0.241, 0.184],
      [0.328, 0.248, 0.193],
      [0.379, 0.242, 0.192],
      [0.385, 0.233, 0.179],
    ],
    leather,
  );
  buckle(0, 0.352, 0.197, 0.113, 0.067, root, warrior ? steelEdge : brass);
  for (const x of [-0.173, -0.135, 0.137, 0.175]) rivet(x, 0.351, 0.155, root, brass, 0.01);
  for (const x of [-0.081, 0.08])
    s.box('leather belt keeper', [x, 0.351, 0.188], [0.023, 0.073, 0.019], leatherEdge, root, 0.004);
  s.ellipsoid('neck', [0, 0.686, -0.003], [0.187, 0.156, 0.186], skin);
  // The nose, cheeks and eye recesses are one continuous skin surface, not intersecting beads.
  const faceProfile: SculptRing[] = [
    [0.698, 0.055, 0.067, 0.04],
    [0.711, 0.102, 0.098, 0.02],
    [0.738, 0.134, 0.122, 0.009],
    [0.79, 0.158, 0.14],
    [0.84, 0.158, 0.138, -0.004],
    [0.882, 0.14, 0.121, -0.006],
    [0.913, 0.094, 0.087, -0.009],
    [0.925, 0.025, 0.027, -0.01],
  ];
  const faceRings: SculptRing[] = Array.from({ length: 30 }, (_, i) => {
    const y = Math.min(0.925, 0.698 + (i * (0.925 - 0.698)) / 29);
    const next = faceProfile.findIndex((p) => p[0] >= y);
    const upper = faceProfile[Math.max(0, next)],
      lower = faceProfile[Math.max(0, next - 1)];
    const blend = upper[0] === lower[0] ? 0 : (y - lower[0]) / (upper[0] - lower[0]);
    return [
      y,
      lower[1] + (upper[1] - lower[1]) * blend,
      lower[2] + (upper[2] - lower[2]) * blend,
      (lower[3] ?? 0) + ((upper[3] ?? 0) - (lower[3] ?? 0)) * blend,
    ];
  });
  s.loft('continuous sculpted dwarf face', faceRings, skin, root, 48, ([x, y, z]) => {
    if (z < 0) return [x, y, z];
    const bump = (cx: number, cy: number, rx: number, ry: number) =>
      Math.exp(-Math.pow((x - cx) / rx, 2) - Math.pow((y - cy) / ry, 2));
    const nose =
      (engineer ? 0.046 : 0.06) * bump(0, 0.789, 0.038, 0.032) + 0.022 * bump(0, 0.823, 0.022, 0.045);
    const cheeks = 0.012 * (bump(-0.097, 0.787, 0.036, 0.047) + bump(0.097, 0.787, 0.036, 0.047));
    const sockets = 0.018 * (bump(-0.072, 0.837, 0.033, 0.025) + bump(0.072, 0.837, 0.033, 0.025));
    return [x, y, z + nose + cheeks - sockets];
  });
  for (const side of [-1, 1]) {
    s.ellipsoid('ear', [side * 0.163, 0.802, -0.003], [0.073, 0.11, 0.058], skin);
    s.ellipsoid('ear inset', [side * 0.185, 0.803, 0.02], [0.026, 0.063, 0.021], skinShade);
    s.ellipsoid('deep eye socket', [side * 0.072, 0.837, 0.116], [0.097, 0.048, 0.02], skinShade);
    s.ellipsoid('eye opening', [side * 0.07, 0.837, 0.13], [0.06, 0.027, 0.012], eyeDark);
    s.ellipsoid('eye white', [side * 0.07, 0.839, 0.137], [0.044, 0.021, 0.009], eyeWhite);
    s.ellipsoid('warm iris', [side * 0.066, 0.838, 0.143], [0.021, 0.022, 0.006], eyeIris);
    s.ellipsoid('pupil', [side * 0.066, 0.838, 0.147], [0.011, 0.018, 0.004], eyeDark);
    s.ellipsoid('eye catchlight', [side * 0.062, 0.844, 0.15], [0.005, 0.006, 0.002], ivory);
    s.line(
      'lower sculpted eyelid',
      [
        [side * 0.043, 0.825, 0.135],
        [side * 0.071, 0.825, 0.138],
        [side * 0.097, 0.828, 0.124],
      ],
      0.0065,
      skin,
    );
    lock(
      'heavy expressive eyebrow',
      [
        [side * 0.026, 0.859, 0.147],
        [side * 0.05, 0.868, 0.16],
        [side * 0.087, 0.866, 0.149],
        [side * 0.125, 0.85, 0.125],
      ],
      engineer ? 0.018 : 0.021,
      root,
      hair,
    );
  }
  s.line(
    'mouth shadow',
    [
      [-0.048, 0.755, 0.139],
      [0, 0.749, 0.157],
      [0.048, 0.755, 0.139],
    ],
    0.0075,
    skinShade,
  );
  s.ellipsoid('lower lip', [0, 0.744, 0.146], [0.065, 0.021, 0.023], skin);
  if (engineer) {
    for (const side of [-1, 1]) {
      s.ellipsoid(
        'cheek soot',
        [side * 0.116, 0.779, 0.112],
        [0.035, 0.018, 0.004],
        residentSurface(v, 'engineer soot', '#805f4b'),
      );
      s.torus('small brass earring', [side * 0.18, 0.777, 0.017], 0.027, 0.005, brass);
    }
  }
  // Sleeves have an upper-arm volume, a rolled cuff, an exposed forearm and grasping fingers.
  const arms = [-0.28, 0.28].map((x, i) => {
    const arm = new TransformNode('arm pivot', v.scene);
    arm.position.set(x, 0.622, 0);
    arm.parent = root;
    s.loft(
      'tailored upper sleeve',
      [
        [-0.177, 0.087, 0.095, 0.015],
        [-0.154, 0.104, 0.105, 0.009],
        [-0.105, 0.11, 0.119],
        [0.004, 0.114, 0.12],
        [0.045, 0.069, 0.073],
        [0.055, 0.024, 0.028],
      ],
      cloth,
      arm,
    );
    for (const y of [-0.137, -0.085])
      s.line(
        'sleeve gathered fold',
        [
          [-0.077, y, 0.066],
          [0, y - 0.012, 0.119],
          [0.071, y + 0.008, 0.074],
        ],
        0.004,
        clothLight,
        arm,
        0.001,
      );
    s.loft(
      'rolled sleeve cuff',
      [
        [-0.185, 0.093, 0.096, 0.01],
        [-0.178, 0.111, 0.115, 0.01],
        [-0.148, 0.111, 0.117, 0.01],
        [-0.139, 0.099, 0.103, 0.01],
      ],
      engineer ? ivory : clothLight,
      arm,
    );
    s.ellipsoid('strong forearm', [0, -0.218, 0.015], [0.169, 0.159, 0.17], engineer ? skin : leather, arm);
    if (!engineer) {
      s.box(
        'protective forearm bracer',
        [0, -0.214, 0.103],
        [0.152, 0.099, 0.027],
        warrior ? steel : leatherEdge,
        arm,
        0.011,
      );
      for (const dx of [-0.053, 0.053]) rivet(dx, -0.207, 0.12, arm, warrior ? steelEdge : brass, 0.011);
    }
    const hand = engineer || scholar ? skin : leather;
    s.ellipsoid('broad hand', [0, -0.299, 0.031], [0.16, 0.132, 0.143], hand, arm);
    for (let finger = 0; finger < 4; finger++) {
      const xx = -0.049 + finger * 0.032;
      s.ellipsoid('curled grasping finger', [xx, -0.315, 0.085], [0.039, 0.081, 0.055], hand, arm);
      s.line(
        'finger crease',
        [
          [xx - 0.011, -0.31, 0.111],
          [xx + 0.01, -0.31, 0.111],
        ],
        scholar ? 0.0007 : 0.0015,
        engineer || scholar ? skinShade : leatherEdge,
        arm,
      );
    }
    s.ellipsoid(
      'opposed thumb',
      [i ? -0.071 : 0.071, -0.278, 0.069],
      [0.064, 0.087, 0.066],
      hand,
      arm,
    ).rotation.z = i ? -0.36 : 0.36;
    return arm;
  });
  let shield: TransformNode | undefined, book: TransformNode | undefined;
  const tool = new TransformNode('hand tool', v.scene);
  tool.parent = arms[1];
  const load = new TransformNode('carried riches', v.scene);
  load.parent = root;
  load.position.set(-0.234, 0.352, -0.058);
  s.box('gold leather satchel', [0, -0.028, 0], [0.169, 0.19, 0.145], leather, load, 0.031);
  s.box('satchel folded lip', [0, 0.061, 0.04], [0.176, 0.045, 0.075], leatherEdge, load, 0.009);
  for (let i = 0; i < 5; i++)
    s.ellipsoid(
      'satchel gold',
      [Math.sin(i * 3) * 0.052, 0.077 + (i % 2) * 0.012, Math.cos(i * 4) * 0.025],
      [0.047, 0.04, 0.042],
      residentSurface(v, 'dwarf gold', '#d8ac51', true),
      load,
    );
  load.setEnabled(false);

  if (!engineer) {
    // Broad carved beard masses support a small set of tapered locks, rather than rows of balls.
    s.ellipsoid('beard cheek left', [-0.117, 0.745, 0.093], [0.103, 0.2, 0.115], hair);
    s.ellipsoid('beard cheek right', [0.117, 0.745, 0.093], [0.103, 0.2, 0.115], hair);
    s.loft(
      'continuous upper beard',
      [
        [0.594, 0.092, 0.043, 0.193],
        [0.638, 0.142, 0.054, 0.18],
        [0.696, 0.148, 0.047, 0.168],
        [0.744, 0.092, 0.032, 0.157],
      ],
      hair,
    );
    for (const side of [-1, 1]) {
      s.loft(
        'sculpted beard lobe',
        [
          [0.449, 0.015, 0.018, 0.188, side * 0.084],
          [0.48, 0.057, 0.048, 0.209, side * 0.093],
          [0.545, 0.078, 0.069, 0.207, side * 0.086],
          [0.63, 0.085, 0.069, 0.172, side * 0.072],
          [0.699, 0.067, 0.048, 0.168, side * 0.053],
          [0.73, 0.024, 0.025, 0.155, side * 0.04],
        ],
        hair,
      );
      for (let strand = 0; strand < 5; strand++) {
        const xx = side * (0.032 + strand * 0.027),
          zz = 0.249 - Math.abs(strand - 2) * 0.006;
        lock(
          'flowing carved beard lock',
          [
            [xx, 0.732, 0.214],
            [xx + side * 0.012, 0.657, zz],
            [xx - side * 0.01, 0.543, zz + 0.025],
            [side * 0.092 + (strand - 2) * 0.01, 0.477, 0.253],
          ],
          0.011,
          root,
          strand % 2 ? hair : hairLight,
        );
      }
      lock(
        'swept moustache',
        [
          [side * 0.012, 0.769, 0.196],
          [side * 0.065, 0.759, 0.211],
          [side * 0.112, 0.738, 0.2],
          [side * 0.157, 0.74, 0.17],
        ],
        0.027,
      );
      s.loft(
        'beard braid binding',
        [
          [0.478, 0.035, 0.037, 0.211, side * 0.093],
          [0.484, 0.043, 0.042, 0.211, side * 0.093],
          [0.51, 0.043, 0.042, 0.211, side * 0.093],
          [0.516, 0.035, 0.036, 0.211, side * 0.093],
        ],
        scholar ? brass : steelEdge,
      );
      for (let strand = 0; strand < 3; strand++)
        lock(
          'tapered beard tail',
          [
            [side * 0.093 + (strand - 1) * 0.017, 0.479, 0.21],
            [side * 0.09 + (strand - 1) * 0.023, 0.443, 0.221],
            [side * 0.09, 0.411, 0.205],
          ],
          0.016,
          root,
          strand === 1 ? hairLight : hair,
        );
    }
    for (const side of [-1, 1])
      for (let i = 0; i < 4; i++)
        lock(
          'swept nape hair',
          [
            [side * (0.067 + i * 0.025), 0.867, -0.08],
            [side * (0.1 + i * 0.018), 0.79, -0.126],
            [side * (0.09 + i * 0.027), 0.723, -0.116],
          ],
          0.025,
        );
  }

  function helmet() {
    s.loft(
      'forged helmet dome',
      [
        [0.876, 0.178, 0.16],
        [0.889, 0.181, 0.163],
        [0.927, 0.171, 0.149],
        [0.97, 0.136, 0.12],
        [0.997, 0.085, 0.074],
        [1.004, 0.016, 0.016],
      ],
      steel,
    );
    s.loft(
      'helmet band',
      [
        [0.871, 0.188, 0.166],
        [0.877, 0.19, 0.173],
        [0.903, 0.181, 0.165],
        [0.91, 0.177, 0.16],
      ],
      steelEdge,
    );
    s.loft(
      'flared helmet brim',
      [
        [0.864, 0.187, 0.167],
        [0.87, 0.198, 0.183],
        [0.878, 0.188, 0.17],
      ],
      steel,
    );
    s.line(
      'forged crown ridge',
      [
        [0, 0.883, 0.173],
        [0, 0.945, 0.147],
        [0, 0.991, 0.083],
        [0, 1.008, 0],
        [0, 0.985, -0.09],
        [0, 0.921, -0.151],
        [0, 0.883, -0.172],
      ],
      0.012,
      steelEdge,
    );
    for (const side of [-1, 1])
      s.line(
        'side helmet panel seam',
        [
          [side * 0.173, 0.901, 0.03],
          [side * 0.156, 0.95, 0.021],
          [side * 0.117, 0.986, 0.015],
          [side * 0.057, 1.006, 0.005],
        ],
        0.006,
        steelEdge,
      );
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      rivet(Math.sin(a) * 0.184, 0.891, Math.cos(a) * 0.168, root, steel, 0.012);
    }
  }

  if (!engineer && !scholar) helmet();
  if (!engineer && !scholar && !warrior) {
    // Miner: the ochre work coat is framed by crossed harnesses, a round cage lamp and curved pick.
    for (const side of [-1, 1]) {
      s.line(
        'broad miner shoulder harness',
        [
          [side * 0.174, 0.644, 0.089],
          [side * 0.213, 0.571, 0.143],
          [side * 0.178, 0.449, 0.178],
          [side * 0.164, 0.386, 0.168],
        ],
        0.026,
        leather,
      );
      s.line(
        'harness worn piping',
        [
          [side * 0.19, 0.641, 0.09],
          [side * 0.232, 0.572, 0.142],
          [side * 0.197, 0.449, 0.177],
        ],
        0.004,
        leatherEdge,
      );
      buckle(side * 0.205, 0.579, 0.172, 0.05, 0.053, root, steelEdge);
      s.line(
        'crossed rear harness',
        [
          [side * 0.178, 0.638, -0.096],
          [side * 0.148, 0.54, -0.167],
          [0, 0.461, -0.194],
          [-side * 0.149, 0.37, -0.157],
        ],
        0.027,
        leather,
      );
    }
    s.box(
      'back harness diamond',
      [0, 0.46, -0.194],
      [0.111, 0.105, 0.024],
      leatherEdge,
      root,
      0.014,
    ).rotation.z = Math.PI / 4;
    for (const x of [-0.034, 0.034]) rivet(x, 0.46, -0.213, root, steelEdge);
    s.rod('round helmet lamp housing', [0, 0.922, 0.148], [0, 0.922, 0.193], 0.05, brass);
    s.torus('lamp bezel', [0, 0.922, 0.197], 0.104, 0.013, steelEdge);
    s.ellipsoid(
      'convex helmet lamp',
      [0, 0.922, 0.201],
      [0.079, 0.079, 0.027],
      v.material('sculpt miner lamp', '#ffd174', false, 0.72),
    );
    s.box('lamp protective vertical', [0, 0.922, 0.221], [0.007, 0.081, 0.009], steel);
    s.box('lamp protective horizontal', [0, 0.922, 0.221], [0.081, 0.007, 0.009], steel);
    s.rod('worn pick handle', [0, -0.385, 0.124], [0, 0.131, 0.124], 0.02, leatherEdge, tool);
    s.plate(
      'curved forged pick',
      [
        [-0.24, -0.006],
        [-0.187, 0.105],
        [-0.083, 0.173],
        [0.011, 0.178],
        [0.128, 0.132],
        [0.226, 0.027],
        [0.189, 0.06],
        [0.096, 0.115],
        [0.007, 0.134],
        [-0.07, 0.136],
        [-0.156, 0.083],
      ],
      0.124,
      0.044,
      steel,
      tool,
    );
    s.line(
      'pick polished striking edge',
      [
        [-0.24, -0.006, 0.148],
        [-0.187, 0.105, 0.148],
        [-0.083, 0.173, 0.148],
      ],
      0.005,
      steelEdge,
      tool,
    );
    s.box('pick handle socket', [0, 0.147, 0.124], [0.065, 0.085, 0.073], steelEdge, tool, 0.012);
    s.box('belt tool sleeve', [0.221, 0.365, 0.092], [0.075, 0.149, 0.072], leather, root, 0.012);
    s.rod('belt chisel', [0.222, 0.38, 0.109], [0.222, 0.49, 0.109], 0.012, steel);
    s.box('chisel head', [0.222, 0.487, 0.109], [0.039, 0.025, 0.028], steelEdge, root, 0.005);
  }

  if (engineer) {
    s.ellipsoid('pulled back crown', [0, 0.898, -0.035], [0.308, 0.234, 0.255], hair);
    for (let i = 0; i < 11; i++) {
      const x = (i - 5) * 0.023;
      const path: [number, number, number][] = Array.from({ length: 12 }, (_, j) => {
        const xx = x * (1 - j * 0.035),
          z = 0.072 - Math.abs(x) * 0.3 - j * 0.016;
        const y =
          0.898 +
          0.117 * Math.sqrt(Math.max(0, 1 - Math.pow(xx / 0.154, 2) - Math.pow((z + 0.035) / 0.1275, 2))) +
          0.005;
        return [xx, y, z];
      });
      s.line('swept crown hair', path, 0.009, i % 2 ? hair : hairLight, root, 0.006);
    }
    s.ellipsoid('braided hair bun', [0, 0.981, -0.083], [0.19, 0.136, 0.16], hair);
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      lock(
        'bun spiral',
        [
          [Math.sin(a) * 0.075, 0.98 + Math.cos(a) * 0.043, -0.018],
          [Math.sin(a + 0.6) * 0.073, 0.984 + Math.cos(a + 0.6) * 0.044, -0.04],
          [Math.sin(a + 1.2) * 0.044, 0.989 + Math.cos(a + 1.2) * 0.027, -0.018],
        ],
        0.017,
        root,
        hairLight,
      );
    }
    for (const side of [-1, 1]) {
      s.line(
        'main braid',
        [
          [side * 0.159, 0.865, 0.014],
          [side * 0.172, 0.783, 0.08],
          [side * 0.168, 0.706, 0.157],
          [side * 0.165, 0.602, 0.18],
        ],
        0.025,
        hair,
      );
      for (let i = 0; i < 7; i++) {
        const y = 0.82 - i * 0.036,
          z = 0.071 + i * 0.021;
        s.ellipsoid(
          'interwoven braid plait',
          [side * (0.168 + Math.sin((i * Math.PI) / 2) * 0.011), y, z],
          [0.06, 0.054, 0.059],
          i % 2 ? hair : hairLight,
        ).rotation.z = side * (i % 2 ? 0.4 : -0.4);
      }
      s.torus('braid brass binding', [side * 0.164, 0.574, 0.181], 0.067, 0.011, brass, root, false);
      lock(
        'braid tapered end',
        [
          [side * 0.164, 0.566, 0.181],
          [side * 0.168, 0.541, 0.192],
          [side * 0.175, 0.52, 0.181],
        ],
        0.025,
      );
      s.torus('brass goggle rim', [side * 0.071, 0.916, 0.136], 0.108, 0.015, brass);
      s.ellipsoid(
        'dark goggle lens',
        [side * 0.071, 0.916, 0.143],
        [0.083, 0.083, 0.015],
        residentSurface(v, 'goggle glass', '#314347', true),
      );
      s.line(
        'goggle glass glint',
        [
          [side * 0.071 - 0.022, 0.94, 0.153],
          [side * 0.071 + 0.002, 0.949, 0.153],
          [side * 0.071 + 0.023, 0.935, 0.153],
        ],
        0.004,
        steelEdge,
      );
      s.line(
        'goggle head strap',
        [
          [side * 0.129, 0.918, 0.114],
          [side * 0.162, 0.904, 0.018],
          [side * 0.134, 0.892, -0.119],
        ],
        0.017,
        leather,
      );
      s.line(
        'pack and apron shoulder harness',
        [
          [side * 0.177, 0.653, -0.087],
          [side * 0.196, 0.665, 0.005],
          [side * 0.204, 0.622, 0.137],
          [side * 0.186, 0.517, 0.178],
        ],
        0.023,
        leather,
      );
      buckle(side * 0.203, 0.586, 0.168, 0.052, 0.065);
    }
    s.box('goggle bridge', [0, 0.921, 0.151], [0.035, 0.017, 0.022], brass, root, 0.005);
    s.plate(
      'shaped leather apron',
      [
        [-0.215, 0.263],
        [0.214, 0.263],
        [0.207, 0.447],
        [0.166, 0.591],
        [-0.164, 0.591],
        [-0.207, 0.447],
      ],
      0.189,
      0.026,
      leather,
    );
    s.line(
      'apron bound hem',
      [
        [-0.213, 0.279, 0.207],
        [-0.216, 0.351, 0.207],
        [-0.198, 0.472, 0.207],
        [-0.16, 0.589, 0.207],
        [0.16, 0.589, 0.207],
        [0.198, 0.472, 0.207],
        [0.216, 0.351, 0.207],
        [0.213, 0.279, 0.207],
      ],
      0.006,
      leatherEdge,
    );
    s.box('apron lower pocket', [0, 0.302, 0.209], [0.25, 0.101, 0.023], leatherEdge, root, 0.012);
    stitch('apron pocket stitches', [
      [-0.112, 0.341, 0.225],
      [-0.115, 0.263, 0.225],
      [0.114, 0.263, 0.225],
      [0.112, 0.341, 0.225],
    ]);
    for (const side of [-1, 1]) rivet(side * 0.147, 0.565, 0.21, root, brass, 0.014);
    // Belt overlays the apron exactly as in the approved sheet.
    s.box('apron waist strap', [0, 0.382, 0.217], [0.414, 0.05, 0.022], leather, root, 0.008);
    buckle(0, 0.382, 0.234, 0.105, 0.062);
    s.box('mechanism pack case', [0, 0.527, -0.202], [0.307, 0.282, 0.132], leather, root, 0.026);
    s.box('pack forged face', [0, 0.536, -0.282], [0.259, 0.233, 0.025], steel, root, 0.014);
    for (const side of [-1, 1])
      s.box('pack brass rail', [side * 0.128, 0.536, -0.3], [0.027, 0.248, 0.031], brass, root, 0.006);
    for (const y of [0.424, 0.645])
      s.box('pack brass crossbrace', [0, y, -0.3], [0.28, 0.027, 0.032], brass, root, 0.007);
    s.torus('pack gear', [0, 0.539, -0.305], 0.102, 0.015, brass);
    for (let i = 0; i < 8; i++)
      s.box(
        'pack gear tooth',
        [Math.sin((i * Math.PI) / 4) * 0.054, 0.539 + Math.cos((i * Math.PI) / 4) * 0.054, -0.309],
        [0.021, 0.022, 0.013],
        brass,
        root,
        0.003,
      ).rotation.z = (-i * Math.PI) / 4;
    for (const x of [-0.112, 0.112])
      for (const y of [0.449, 0.625]) rivet(x, y, -0.322, root, steelEdge, 0.017);
    s.rod('pack rolled tool', [-0.106, 0.697, -0.183], [0.106, 0.697, -0.183], 0.024, steel);
    for (const x of [-0.095, 0.095])
      s.torus('pack tool binding', [x, 0.697, -0.183], 0.052, 0.009, brass).rotation.y = Math.PI / 2;
    s.box('utility tool pouch', [0.247, 0.354, 0.041], [0.135, 0.178, 0.126], leather, root, 0.018);
    s.box('pouch brass flap', [0.247, 0.397, 0.109], [0.137, 0.041, 0.02], brass, root, 0.007);
    s.rod('belt spanner stem', [0.25, 0.412, 0.099], [0.273, 0.56, 0.099], 0.012, steel);
    s.torus('spanner open jaw', [0.277, 0.568, 0.099], 0.064, 0.012, steel);
    s.rod('short hammer handle', [0, -0.385, 0.128], [0, -0.091, 0.128], 0.021, leatherEdge, tool);
    s.box('forged engineering hammer', [0, -0.054, 0.128], [0.241, 0.115, 0.117], steel, tool, 0.012);
    for (const x of [-0.103, 0.103])
      s.box('hammer polished face', [x, -0.054, 0.128], [0.026, 0.113, 0.12], steelEdge, tool, 0.008);
    for (const x of [-0.071, 0.071]) for (const y of [-0.023, -0.085]) rivet(x, y, 0.19, tool, brass, 0.01);
  }

  if (warrior) {
    // Layered shells change the silhouette; the crimson coat remains visible below the steel.
    s.plate(
      'angular breastplate',
      [
        [-0.194, 0.399],
        [0, 0.372],
        [0.194, 0.399],
        [0.23, 0.566],
        [0.178, 0.624],
        [-0.179, 0.624],
        [-0.23, 0.566],
      ],
      0.175,
      0.054,
      steel,
    );
    s.line(
      'breastplate perimeter',
      [
        [-0.194, 0.401, 0.207],
        [0, 0.376, 0.207],
        [0.194, 0.401, 0.207],
        [0.221, 0.563, 0.207],
        [0.174, 0.614, 0.207],
      ],
      0.008,
      steelEdge,
    );
    s.box('back armor plate', [0, 0.519, -0.181], [0.374, 0.28, 0.054], steel, root, 0.032);
    for (const side of [-1, 1])
      s.line(
        'back shoulder armor straps',
        [
          [side * 0.14, 0.629, -0.114],
          [side * 0.157, 0.57, -0.212],
          [side * 0.157, 0.405, -0.196],
        ],
        0.031,
        leather,
      );
    for (const x of [-0.141, 0.141])
      for (const y of [0.417, 0.614]) rivet(x, y, -0.213, root, steelEdge, 0.015);
    for (const side of [-1, 1]) {
      const arm = arms[side < 0 ? 0 : 1];
      for (let course = 0; course < 3; course++) {
        const w = 0.147 - course * 0.012,
          y = 0.012 - course * 0.049;
        s.loft(
          'overlapping forged shoulder shell',
          [
            [y - 0.059, w * 0.9, 0.112],
            [y - 0.039, w, 0.14],
            [y + 0.018, w * 0.83, 0.126],
            [y + 0.065, w * 0.47, 0.073],
            [y + 0.073, 0.015, 0.02],
          ],
          steel,
          arm,
        );
        s.line(
          'shoulder shell rolled rim',
          [
            [-w * 0.89, y - 0.051, 0.081],
            [-w * 0.6, y - 0.058, 0.125],
            [0, y - 0.06, 0.14],
            [w * 0.6, y - 0.058, 0.125],
            [w * 0.89, y - 0.051, 0.081],
          ],
          0.007,
          steelEdge,
          arm,
        );
        for (const dx of [-w * 0.64, w * 0.64]) rivet(dx, y - 0.032, 0.127, arm, steelEdge, 0.012);
      }
      for (let row = 0; row < 3; row++)
        for (let j = 0; j < 5; j++)
          s.torus(
            'chain sleeve link',
            [-0.06 + j * 0.029, -0.164 - row * 0.017, 0.093],
            0.021,
            0.004,
            steelEdge,
            arm,
          );
      s.box('steel elbow guard', [0, -0.222, 0.112], [0.168, 0.049, 0.028], steel, arm, 0.009);
    }
    for (let i = -1; i <= 1; i++) {
      const plate = s.plate(
        'articulated waist tasset',
        [
          [i * 0.137 - 0.067, 0.248],
          [i * 0.137 + 0.067, 0.248],
          [i * 0.137 + 0.074, 0.341],
          [i * 0.137 - 0.074, 0.341],
        ],
        0.179,
        0.036,
        steel,
      );
      plate.rotation.y = i * 0.23;
      s.line(
        'tasset edge',
        [
          [i * 0.137 - 0.06, 0.256, 0.201],
          [i * 0.137 + 0.06, 0.256, 0.201],
          [i * 0.137 + 0.067, 0.332, 0.201],
        ],
        0.005,
        steelEdge,
      );
      rivet(i * 0.137, 0.321, 0.208, root, steelEdge, 0.014);
    }
    s.rod('battle axe ash haft', [0, -0.418, 0.126], [0, 0.119, 0.126], 0.021, leatherEdge, tool);
    s.box('axe forged socket', [0, 0.062, 0.126], [0.071, 0.105, 0.083], steelEdge, tool, 0.012);
    s.plate(
      'broad bearded axe blade',
      [
        [0.024, 0.111],
        [0.09, 0.122],
        [0.173, 0.2],
        [0.16, 0.113],
        [0.19, 0.041],
        [0.233, -0.047],
        [0.161, -0.074],
        [0.09, -0.051],
        [0.072, 0.021],
        [0.023, 0.014],
      ],
      0.126,
      0.037,
      steel,
      tool,
    );
    s.line(
      'axe sharpened curve',
      [
        [0.173, 0.2, 0.147],
        [0.16, 0.113, 0.147],
        [0.19, 0.041, 0.147],
        [0.233, -0.047, 0.147],
        [0.161, -0.074, 0.147],
        [0.09, -0.051, 0.147],
      ],
      0.007,
      steelEdge,
      tool,
    );
    s.rod('axe pommel', [0, -0.421, 0.126], [0, -0.397, 0.126], 0.028, steelEdge, tool);
    shield = new TransformNode('warrior shield', v.scene);
    shield.parent = arms[0];
    shield.position.set(-0.086, -0.195, 0.073);
    shield.rotation.y = -0.35;
    s.box('broad shield wooden core', [0, 0, 0], [0.413, 0.6, 0.061], leather, shield, 0.016);
    for (let i = 0; i < 5; i++)
      s.box(
        'individual shield board',
        [-0.155 + i * 0.077, 0, 0.035],
        [0.073, 0.548, 0.019],
        i % 2 ? leatherEdge : leather,
        shield,
        0.004,
      );
    for (const x of [-0.197, 0.197])
      s.box('shield side iron', [x, 0, 0.053], [0.034, 0.609, 0.031], steelEdge, shield, 0.006);
    for (const y of [-0.283, 0.283, 0])
      s.box('shield cross iron', [0, y, 0.053], [0.425, 0.037, 0.035], steel, shield, 0.006);
    for (const x of [-0.176, -0.095, 0.095, 0.176])
      for (const y of [-0.282, 0, 0.282]) rivet(x, y, 0.076, shield, steelEdge, 0.017);
    s.box('shield diamond frame', [0, 0, 0.079], [0.15, 0.15, 0.026], steelEdge, shield, 0.01).rotation.z =
      Math.PI / 4;
    s.box('shield diamond inset', [0, 0, 0.097], [0.096, 0.096, 0.018], leather, shield, 0.009).rotation.z =
      Math.PI / 4;
    s.ellipsoid('shield raised central boss', [0, 0, 0.114], [0.067, 0.067, 0.028], steel, shield);
  }

  if (scholar) {
    // An A-line coat and folded cowl replace the old rounded skirt and rectangular mantle.
    s.loft(
      'long scholar coat',
      [
        [0.156, 0.258, 0.186],
        [0.167, 0.27, 0.202],
        [0.221, 0.265, 0.199],
        [0.322, 0.246, 0.187],
        [0.443, 0.23, 0.173],
        [0.546, 0.247, 0.161],
        [0.632, 0.2, 0.117],
      ],
      cloth,
    );
    for (const side of [-1, 1]) {
      s.line(
        'robe front open border',
        [
          [side * 0.055, 0.161, 0.202],
          [side * 0.057, 0.279, 0.2],
          [side * 0.05, 0.417, 0.188],
          [side * 0.075, 0.56, 0.183],
        ],
        0.012,
        ivory,
      );
      for (let i = 0; i < 4; i++)
        s.line(
          'robe long hanging fold',
          [
            [side * (0.1 + i * 0.038), 0.18, 0.177 - i * 0.026],
            [side * (0.09 + i * 0.031), 0.3, 0.172 - i * 0.023],
            [side * (0.07 + i * 0.032), 0.445, 0.157 - i * 0.024],
          ],
          0.008,
          clothShade,
        );
      s.line(
        'broad ivory mantle edge',
        [
          [side * 0.092, 0.667, 0.107],
          [side * 0.212, 0.641, 0.118],
          [side * 0.28, 0.58, 0.059],
          [side * 0.265, 0.566, -0.047],
          [side * 0.204, 0.582, -0.136],
          [side * 0.057, 0.544, -0.21],
        ],
        0.023,
        ivory,
      );
      s.line(
        'mantle embroidered inner cord',
        [
          [side * 0.103, 0.646, 0.12],
          [side * 0.2, 0.622, 0.135],
          [side * 0.256, 0.575, 0.074],
          [side * 0.239, 0.563, -0.038],
          [side * 0.185, 0.565, -0.14],
        ],
        0.006,
        brass,
      );
      s.loft(
        'generous scholar sleeve cuff',
        [
          [-0.251, 0.108, 0.11, 0.035],
          [-0.245, 0.115, 0.12, 0.035],
          [-0.2, 0.108, 0.115, 0.026],
          [-0.193, 0.096, 0.102, 0.021],
        ],
        ivory,
        arms[side < 0 ? 0 : 1],
      );
      s.line(
        'cuff ink trim',
        [
          [-0.085, -0.223, 0.109],
          [0, -0.234, 0.146],
          [0.085, -0.223, 0.109],
        ],
        0.005,
        brass,
        arms[side < 0 ? 0 : 1],
      );
      s.box('robe belt pouch', [side * 0.244, 0.332, -0.099], [0.103, 0.177, 0.104], leather, root, 0.019);
      buckle(side * 0.245, 0.365, -0.158, 0.047, 0.048);
    }
    s.loft(
      'folded shoulder cowl',
      [
        [0.556, 0.227, 0.164, -0.032],
        [0.597, 0.261, 0.176, -0.015],
        [0.648, 0.224, 0.144, -0.013],
        [0.688, 0.126, 0.106, -0.003],
        [0.695, 0.097, 0.086],
      ],
      clothShade,
    );
    s.plate(
      'pointed folded hood',
      [
        [-0.16, 0.646],
        [0, 0.477],
        [0.16, 0.646],
        [0.107, 0.68],
        [-0.105, 0.68],
      ],
      -0.2,
      0.036,
      clothShade,
    );
    s.line(
      'hood ivory folded border',
      [
        [-0.159, 0.641, -0.224],
        [0, 0.487, -0.224],
        [0.159, 0.641, -0.224],
      ],
      0.015,
      ivory,
    );
    s.loft(
      'ivory coat hem',
      [
        [0.16, 0.27, 0.204],
        [0.17, 0.274, 0.207],
        [0.192, 0.271, 0.205],
        [0.197, 0.265, 0.2],
      ],
      ivory,
    );
    for (let i = 0; i < 19; i++) {
      const a = (i * Math.PI * 2) / 19,
        x = Math.sin(a) * 0.274,
        z = Math.cos(a) * 0.208;
      s.box('hem knot embroidery', [x, 0.18, z], [0.013, 0.014, 0.009], brass, root, 0.002).rotation.y = a;
    }
    // Silver hair sweeps away from a visible brow and cascades down the back.
    s.ellipsoid('continuous swept silver scalp', [0, 0.885, -0.042], [0.318, 0.158, 0.253], hair);
    s.loft(
      'full silver back hair',
      [
        [0.708, 0.067, 0.027, -0.124],
        [0.74, 0.121, 0.045, -0.124],
        [0.83, 0.146, 0.044, -0.103],
        [0.886, 0.122, 0.034, -0.11],
      ],
      hair,
    );
    for (let i = 0; i < 13; i++) {
      const x = (i - 6) * 0.022;
      // Sample the actual scalp surface so the locks never disappear through the crown.
      const path: [number, number, number][] = Array.from({ length: 13 }, (_, j) => {
        const z = 0.074 - Math.abs(x) * 0.28 - j * 0.019,
          xx = x * (1 - j * 0.004);
        const y =
          0.885 +
          0.079 * Math.sqrt(Math.max(0, 1 - Math.pow(xx / 0.159, 2) - Math.pow((z + 0.042) / 0.1265, 2))) +
          0.006;
        return [xx, y, z];
      });
      path.push(
        [x, 0.858, -0.17],
        [x + Math.sin(i) * 0.012, 0.803, -0.178],
        [x - Math.sin(i) * 0.013, 0.748, -0.175],
        [x + Math.sin(i) * 0.016, 0.705, -0.149],
      );
      s.line('continuous swept silver lock', path, 0.012, i % 2 ? hair : hairLight, root, 0.004);
    }
    for (const y of [0.874, 0.886])
      s.line(
        'scholar forehead crease',
        [
          [-0.061, y, 0.116],
          [0, y + 0.003, 0.128],
          [0.061, y, 0.116],
        ],
        0.0025,
        skinShade,
      );
    s.line(
      'scholar back rune',
      [
        [0, 0.405, -0.199],
        [0.042, 0.361, -0.2],
        [0, 0.305, -0.202],
        [-0.042, 0.361, -0.2],
        [0, 0.405, -0.199],
      ],
      0.004,
      brass,
    );
    s.line(
      'scholar back rune stem',
      [
        [0, 0.323, -0.207],
        [0, 0.383, -0.207],
        [0.019, 0.364, -0.207],
      ],
      0.0035,
      rune,
    );
    book = new TransformNode('held rune book', v.scene);
    book.parent = root;
    book.position.set(0, 0.486, 0.331);
    book.rotation.x = -0.24;
    const binding = residentSurface(v, 'embossed book binding', '#58402b');
    for (const side of [-1, 1]) {
      const leaf = new TransformNode('open tome half', v.scene);
      leaf.parent = book;
      leaf.rotation.z = side * 0.16;
      s.box('book leather cover', [side * 0.131, 0, 0], [0.268, 0.028, 0.351], binding, leaf, 0.008);
      s.box(
        'thick parchment page block',
        [side * 0.13, 0.026, -0.002],
        [0.243, 0.039, 0.326],
        ivory,
        leaf,
        0.007,
      );
      for (let i = 0; i < 5; i++)
        s.line(
          'individual page edges',
          [
            [side * 0.022, 0.013 + i * 0.006, 0.165],
            [side * 0.248, 0.013 + i * 0.006, 0.165],
          ],
          0.0018,
          leatherEdge,
          leaf,
        );
      for (let row = 0; row < 5; row++)
        for (let j = 0; j < 3; j++) {
          const x = side * (0.049 + j * 0.062),
            z = -0.112 + row * 0.051;
          s.line(
            'handwritten rune',
            [
              [x - 0.012, 0.05, z - 0.013],
              [x, 0.05, z + 0.013],
              [x + 0.012, 0.05, z - 0.013],
            ],
            0.0023,
            rune,
            leaf,
          );
          if ((row + j) % 2 === 0)
            s.line(
              'rune cross stroke',
              [
                [x - 0.011, 0.05, z],
                [x + 0.012, 0.05, z],
              ],
              0.002,
              rune,
              leaf,
            );
        }
      for (const z of [-0.159, 0.159])
        s.box('book corner fitting', [side * 0.239, 0.01, z], [0.053, 0.016, 0.052], brass, leaf, 0.005);
    }
    s.box('bound book spine', [0, -0.011, 0], [0.043, 0.044, 0.365], leather, book, 0.011);
    for (const z of [-0.115, 0.115])
      s.box('book spine band', [0, -0.023, z], [0.057, 0.027, 0.029], brass, book, 0.006);
    s.line(
      'bookmark ribbon',
      [
        [0, 0.032, 0.055],
        [0, 0.034, 0.174],
        [0.015, -0.104, 0.2],
      ],
      0.01,
      clothLight,
      book,
    );
  }
  const trainingWeights = arms.map((arm) => {
    const weight = new TransformNode('hand training weight', v.scene);
    weight.parent = arm;
    weight.position.set(0, -0.296, 0.065);
    s.rod('weight grip', [-0.135, 0, 0], [0.135, 0, 0], 0.021, brass, weight);
    for (const x of [-0.121, 0.121])
      s.box('hand weight plate', [x, 0, 0], [0.059, 0.163, 0.163], steel, weight, 0.014);
    weight.setEnabled(false);
    return weight;
  });
  if (book) for (const arm of arms) arm.rotation.x = -0.78;
  mergeResident(v, root);
  return {
    root,
    legs,
    arm: arms[1],
    leftArm: arms[0],
    tool,
    load,
    shadow: v.shadow(0, 0, 0.87, 0.73, v.terrainRoot),
    trainingWeights,
    shield,
    book,
    stride: id,
    walking: false,
  };
}
