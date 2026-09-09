import { TransformNode, type StandardMaterial } from '@babylonjs/core';
import type { GameScene } from './scene';
import type { Enemy } from '../game/types';
import { enemyById } from '../content/enemies';
import { EnemySculpt } from './enemy-sculpt';

export interface EnemySculptRig {
  root: TransformNode;
  body: TransformNode;
  head: TransformNode;
  legs: TransformNode[];
  arms: TransformNode[];
  tail?: TransformNode;
  crest?: TransformNode;
  cloud?: TransformNode;
  projectile: TransformNode;
}

/** Each species is shaped against its approved front, back and game-view sheet. */
export function buildEnemySculpt(view: GameScene, enemy: Enemy): EnemySculptRig {
  const definition = enemyById(enemy.type),
    kind = definition.id;
  const root = new TransformNode(`${kind} ${enemy.id}`, view.scene);
  root.scaling.set(definition.scale * 0.72, definition.scale, definition.scale * 0.82);
  view.shadow(0, 0, kind === 'cave-spider' ? 1 : 0.8, 0.95, root);
  const body = new TransformNode('enemy body', view.scene);
  body.parent = root;
  const s = new EnemySculpt(view, body),
    head = s.joint('enemy head', [0, 0, 0]);
  const legs: TransformNode[] = [],
    arms: TransformNode[] = [];
  const dark = s.material('occlusion', '#24232a', 'plain');
  const bone = s.material('warm old ivory', '#cabb94', 'stone');
  const iron = s.material('weathered iron', '#53565a', 'metal');
  const bronze = s.material('aged bronze', '#93774b', 'metal');
  const leather = s.material('brown hide', '#58412b', 'cloth');
  const eye = s.material(
    `${kind} eyes`,
    kind === 'restless-guard' ? '#adefa7' : kind.includes('crystal') ? '#bec8d3' : '#d39d45',
    'plain',
    0.25,
  );
  const crystal = s.material('amethyst facets', '#8664b5', 'crystal');
  const crystalLight = s.material('pale amethyst facets', '#b69bda', 'crystal');
  let tail: TransformNode | undefined, crest: TransformNode | undefined, cloud: TransformNode | undefined;
  const eyes = (width: number, y: number, z: number, size = 0.065, parent = head, iris = eye) => {
    for (const side of [-1, 1]) {
      s.oval(
        'sunken eye socket',
        [side * width, y, z - 0.015],
        [size * 1.45, size * 1.3, size * 0.65],
        dark,
        parent,
      );
      s.oval('watchful eye', [side * width, y, z], [size, size * 0.78, size * 0.46], iris, parent);
      if (kind !== 'restless-guard')
        s.oval(
          'dark eye slit',
          [side * width, y, z + size * 0.24],
          [size * 0.21, size * 0.64, 0.009],
          dark,
          parent,
        );
    }
  };
  const rivets = (
    parent: TransformNode,
    coords: readonly (readonly [number, number, number])[],
    material = bronze,
    size = 0.021,
  ) => {
    for (const p of coords) s.oval('hammered rivet', p, [size, size, size * 0.55], material, parent);
  };
  const claw = (
    x: number,
    y: number,
    z: number,
    length: number,
    width: number,
    parent: TransformNode,
    m = bone,
  ) =>
    s.tube(
      'curved claw',
      [
        [x, y, z],
        [x, y - 0.006, z + length * 0.6],
        [x, y - 0.025, z + length],
      ],
      [width, width * 0.55, 0.002],
      m,
      parent,
      7,
    );

  if (kind === 'goblin-raider') {
    const skin = s.material('goblin olive hide', '#8b9253'),
      skinLight = s.material('goblin nose and knuckles', '#a19b65');
    const ear = s.material('goblin inner ear', '#705134'),
      rag = s.material('tattered ochre cowl', '#a08243', 'cloth');
    const wood = s.material('split shield planks', '#80603b', 'stone');
    s.oval('lean ribcage', [0, 0.67, -0.015], [0.48, 0.4, 0.3], skin);
    s.oval('narrow waist', [0, 0.46, 0.015], [0.32, 0.23, 0.25], skin);
    for (const side of [-1, 1]) {
      s.oval('raised pectoral', [side * 0.105, 0.7, 0.125], [0.21, 0.14, 0.06], skinLight);
      s.tube(
        'oblique muscle',
        [
          [side * 0.17, 0.61, 0.1],
          [side * 0.12, 0.53, 0.14],
          [side * 0.08, 0.45, 0.12],
        ],
        [0.035, 0.035, 0.019],
        skin,
      );
      const leg = s.joint('pillar leg', [side * 0.145, 0.39, 0]);
      legs.push(leg);
      s.tube(
        'bent bare leg',
        [
          [0, 0, 0],
          [side * 0.09, -0.14, 0.08],
          [side * 0.095, -0.31, 0.025],
        ],
        [0.09, 0.069, 0.04],
        skin,
        leg,
      );
      s.oval('leather kneecap', [side * 0.09, -0.15, 0.135], [0.105, 0.105, 0.055], leather, leg);
      s.tube(
        'calf binding',
        [
          [side * 0.095, -0.23, 0.043],
          [side * 0.095, -0.3, 0.027],
        ],
        [0.06, 0.059],
        leather,
        leg,
      );
      s.oval('long goblin foot', [side * 0.095, -0.345, 0.09], [0.15, 0.075, 0.25], skin, leg);
      for (let i = 0; i < 4; i++) {
        s.oval(
          'splayed toe',
          [side * 0.095 + (i - 1.5) * 0.039, -0.352, 0.185],
          [0.043, 0.045, 0.09],
          skinLight,
          leg,
        );
        claw(side * 0.095 + (i - 1.5) * 0.039, -0.35, 0.21, 0.033, 0.014, leg);
      }
      const arm = s.joint('striking arm', [side * 0.275, 0.78, 0.015]);
      arms.push(arm);
      s.tube(
        'sinewy arm',
        [
          [0, 0, 0],
          [side * 0.08, -0.17, -0.015],
          [side * 0.04, -0.36, 0.06],
        ],
        [0.09, 0.066, 0.044],
        skin,
        arm,
      );
      s.oval('upper arm muscle', [side * 0.046, -0.095, 0.015], [0.135, 0.18, 0.13], skin, arm);
      s.tube(
        'wrist wrapping',
        [
          [side * 0.053, -0.26, 0.035],
          [side * 0.04, -0.34, 0.06],
        ],
        [0.064, 0.058],
        leather,
        arm,
      );
      for (let i = 0; i < 3; i++)
        s.tube(
          'wrist wrap seam',
          [
            [side * 0.105, -0.265 - i * 0.028, 0.052],
            [side * 0.04, -0.27 - i * 0.028, 0.097],
            [side * -0.015, -0.275 - i * 0.028, 0.05],
          ],
          [0.009, 0.009, 0.009],
          bronze,
          arm,
          5,
        );
      s.oval('gripping hand', [side * 0.04, -0.39, 0.07], [0.13, 0.14, 0.12], skinLight, arm);
      for (let i = 0; i < 3; i++)
        s.oval(
          'curled finger',
          [side * 0.04 + (i - 1) * 0.032, -0.405, 0.127],
          [0.028, 0.082, 0.043],
          skin,
          arm,
        );
    }
    head.position.set(0, 0.96, 0.1);
    s.oval('angular oversized head', [0, 0.015, 0], [0.47, 0.36, 0.36], skin, head);
    s.oval('square jutting jaw', [0, -0.14, 0.08], [0.33, 0.135, 0.26], skin, head);
    s.oval('lower lip', [0, -0.135, 0.221], [0.24, 0.044, 0.052], skinLight, head);
    s.tube(
      'scowling mouth',
      [
        [-0.12, -0.101, 0.209],
        [0, -0.111, 0.239],
        [0.12, -0.101, 0.209],
      ],
      [0.008, 0.01, 0.008],
      dark,
      head,
    );
    for (const side of [-1, 1]) {
      const outline: readonly (readonly [number, number])[] = [
        [side * 0.17, -0.025],
        [side * 0.285, -0.03],
        [side * 0.53, 0.185],
        [side * 0.28, 0.12],
        [side * 0.16, 0.09],
      ];
      s.plaque(
        'long swept ear',
        side < 0 ? [...outline].reverse() : outline,
        0.045,
        [0, 0.025, -0.025],
        skin,
        head,
      );
      s.plaque(
        'warm inner ear',
        [
          [side * 0.249, 0.05],
          [side * 0.475, 0.167],
          [side * 0.295, 0.026],
        ],
        0.012,
        [0, 0.025, 0.005],
        ear,
        head,
      );
      s.oval('cheekbone', [side * 0.147, -0.047, 0.125], [0.135, 0.11, 0.15], skinLight, head);
      s.oval(
        'heavy sloping brow',
        [side * 0.105, 0.071, 0.184],
        [0.19, 0.075, 0.075],
        skin,
        head,
      ).rotation.z = side * 0.24;
      s.tube(
        'upturned little fang',
        [
          [side * 0.1, -0.125, 0.24],
          [side * 0.112, -0.088, 0.253],
          [side * 0.11, -0.062, 0.24],
        ],
        [0.022, 0.018, 0.001],
        bone,
        head,
      );
    }
    eyes(0.111, 0.029, 0.183, 0.056);
    s.tube(
      'long hooked nose',
      [
        [0, 0.069, 0.15],
        [0, -0.003, 0.237],
        [0, -0.088, 0.287],
        [0, -0.108, 0.267],
      ],
      [0.06, 0.055, 0.035, 0.019],
      skinLight,
      head,
    );
    for (let i = 0; i < 8; i++)
      s.tube(
        'swept black crest',
        [
          [((i % 3) - 1) * 0.045, 0.16, 0.04 - i * 0.017],
          [((i % 3) - 1) * 0.035, 0.255 + (i % 3) * 0.014, -0.03 - i * 0.014],
          [0.09 - i * 0.024, 0.25, -0.17 - i * 0.009],
        ],
        [0.04, 0.026, 0.001],
        dark,
        head,
        5,
      );
    s.tube(
      'draped cowl neckline',
      [
        [-0.23, 0.84, 0.11],
        [-0.15, 0.745, 0.19],
        [0, 0.715, 0.21],
        [0.2, 0.8, 0.16],
        [0.22, 0.86, -0.1],
      ],
      [0.054, 0.055, 0.05, 0.047, 0.046],
      rag,
    );
    for (let i = 0; i < 7; i++)
      s.plaque(
        'ragged cowl hem',
        [
          [-0.055, 0.08],
          [0.06, 0.075],
          [0.035, -0.045 - (i % 3) * 0.028],
          [-0.04, -0.006],
        ],
        0.02,
        [(i - 3) * 0.065, 0.75 + Math.abs(i - 3) * 0.02, i % 2 ? -0.177 : 0.15],
        rag,
      );
    s.plaque(
      'ragged ochre back cowl',
      [
        [-0.215, 0.11],
        [0.214, 0.11],
        [0.193, -0.055],
        [0.144, -0.037],
        [0.11, -0.14],
        [0.05, -0.088],
        [0, -0.166],
        [-0.065, -0.092],
        [-0.124, -0.141],
        [-0.151, -0.07],
        [-0.203, -0.093],
      ],
      0.025,
      [0, 0.755, -0.175],
      rag,
    );
    s.oval('scavenged iron pauldron', [-0.29, 0.795, 0.015], [0.25, 0.19, 0.32], iron, arms[0]);
    // The shoulder shell belongs to its local striking pivot.
    const shoulder = arms[0].getChildMeshes().find((m) => m.name === 'scavenged iron pauldron');
    if (shoulder) shoulder.position.set(-0.015, -0.005, 0);
    s.tube(
      'diagonal chest belt',
      [
        [-0.21, 0.81, 0.165],
        [0, 0.64, 0.18],
        [0.17, 0.46, 0.145],
      ],
      [0.024, 0.024, 0.024],
      leather,
    );
    s.oval('waist belt', [0, 0.435, 0], [0.4, 0.072, 0.32], leather);
    s.block('square belt buckle', [-0.045, 0.436, 0.173], [0.082, 0.059, 0.028], bronze);
    s.block('buckle hollow', [-0.045, 0.436, 0.19], [0.049, 0.031, 0.008], dark);
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI * 2) / 9;
      s.plaque(
        'torn hide skirt',
        [
          [-0.08, 0.065],
          [0.065, 0.065],
          [0.065, -0.075],
          [0.024, -0.047],
          [-0.012, -0.14],
          [-0.045, -0.069],
        ],
        0.022,
        [Math.sin(a) * 0.17, 0.352, Math.cos(a) * 0.123],
        leather,
      ).rotation.y = a;
    }
    const shield = s.joint('round plank shield', [-0.055, -0.27, 0.19], arms[0]);
    shield.rotation.y = -0.27;
    s.oval('round forged shield rim', [0, 0, 0], [0.49, 0.51, 0.075], iron, shield);
    for (let i = -2; i <= 2; i++) {
      const h = Math.sqrt(1 - (i * 0.38) ** 2) * 0.43;
      s.block('uneven wooden shield plank', [i * 0.084, 0, 0.046], [0.078, h, 0.037], wood, shield, 0.006);
    }
    s.block('shield cross strap', [0, 0.03, 0.075], [0.41, 0.045, 0.025], iron, shield);
    s.oval('hammered shield boss', [0, 0.025, 0.099], [0.15, 0.15, 0.07], iron, shield);
    rivets(shield, [
      [-0.18, 0.03, 0.094],
      [0.18, 0.03, 0.094],
      [0, 0.206, 0.074],
      [0, -0.206, 0.074],
    ]);
    const sword = s.joint('hooked scavenged sword', [0.04, -0.38, 0.12], arms[1]);
    sword.rotation.x = Math.PI / 2;
    s.tube(
      'bound sword hilt',
      [
        [0, -0.07, 0],
        [0, 0.1, 0],
      ],
      [0.027, 0.026],
      leather,
      sword,
    );
    s.block('crooked sword guard', [0, 0.11, 0], [0.18, 0.035, 0.07], iron, sword);
    s.plaque(
      'hooked cleaver blade',
      [
        [-0.04, 0.12],
        [0.04, 0.12],
        [0.056, 0.37],
        [0.105, 0.46],
        [0.065, 0.48],
        [-0.022, 0.425],
        [-0.042, 0.34],
      ],
      0.027,
      [0, 0, 0],
      iron,
      sword,
    );
    s.tube(
      'bright worn cutting edge',
      [
        [0.039, 0.13, 0.018],
        [0.054, 0.37, 0.018],
        [0.1, 0.455, 0.018],
      ],
      [0.006, 0.006, 0.002],
      bone,
      sword,
      5,
    );
  } else if (kind === 'tunnel-burrower' || kind === 'crystalback-stalker' || kind === 'deepmaw') {
    const burrower = kind === 'tunnel-burrower',
      deep = kind === 'deepmaw';
    const skin = s.material(`${kind} pebbled hide`, burrower ? '#72563d' : deep ? '#394651' : '#b2b5a3');
    const plate = s.material(
      `${kind} dorsal armor`,
      burrower ? '#514b44' : deep ? '#4b5156' : '#596773',
      'stone',
    );
    const warm = s.material(`${kind} underside`, deep ? '#896244' : burrower ? '#8a6d4a' : '#8d968a');
    s.oval(
      'arched animal shoulders',
      [0, deep ? 0.48 : 0.46, 0.025],
      [deep ? 0.86 : burrower ? 0.79 : 0.62, deep ? 0.59 : 0.53, deep ? 0.91 : 0.85],
      skin,
      body,
      0.035,
    );
    s.oval(
      'powerful rear haunches',
      [0, 0.36, -0.34],
      [deep ? 0.68 : burrower ? 0.67 : 0.52, 0.45, 0.63],
      skin,
    );
    s.oval('warm plated underside', [0, 0.345, 0.17], [deep ? 0.67 : 0.51, 0.38, 0.61], warm);
    head.position.set(0, deep ? 0.46 : 0.405, 0.4);
    s.oval(
      'tapered skull base',
      [0, 0.014, 0.062],
      [deep ? 0.78 : burrower ? 0.47 : 0.4, deep ? 0.32 : 0.25, 0.53],
      skin,
      head,
      0.02,
    );
    s.oval(
      'tapered broad snout',
      [0, -0.035, 0.27],
      [deep ? 0.69 : burrower ? 0.32 : 0.32, 0.16, 0.34],
      skin,
      head,
    );
    s.oval('mouth shadow', [0, -0.107, 0.209], [deep ? 0.7 : 0.33, deep ? 0.045 : 0.016, 0.39], dark, head);
    s.oval('lower jaw', [0, -0.132, 0.21], [deep ? 0.69 : 0.33, deep ? 0.125 : 0.071, 0.37], warm, head);
    eyes(deep ? 0.265 : burrower ? 0.174 : 0.139, 0.058, 0.233, deep ? 0.065 : 0.046);
    for (const side of [-1, 1]) {
      s.oval(
        'overhanging eye ridge',
        [side * (deep ? 0.255 : 0.158), 0.096, 0.19],
        [deep ? 0.22 : 0.14, 0.065, 0.17],
        plate,
        head,
      ).rotation.z = side * 0.13;
      s.oval('nostril', [side * (deep ? 0.19 : 0.07), -0.005, 0.416], [0.031, 0.021, 0.012], dark, head);
      if (deep)
        s.tube(
          'upcurved ivory tusk',
          [
            [side * 0.265, -0.134, 0.337],
            [side * 0.34, -0.111, 0.385],
            [side * 0.35, -0.011, 0.389],
            [side * 0.306, 0.072, 0.355],
          ],
          [0.065, 0.05, 0.033, 0.001],
          bone,
          head,
          9,
        );
      if (burrower)
        s.tube(
          'small armored ear',
          [
            [side * 0.189, 0.097, 0.035],
            [side * 0.231, 0.19, 0.013],
            [side * 0.228, 0.247, -0.009],
          ],
          [0.06, 0.036, 0.001],
          plate,
          head,
          6,
        );
      for (let tooth = 0; tooth < (deep ? 5 : 0); tooth++)
        s.tube(
          'small jaw tooth',
          [
            [side * (0.04 + tooth * (deep ? 0.042 : 0.025)), -0.085, 0.39 - tooth * 0.013],
            [side * (0.04 + tooth * (deep ? 0.042 : 0.025)), -0.113, 0.394 - tooth * 0.013],
          ],
          [0.014, 0.001],
          bone,
          head,
          5,
        );
      for (const front of [true, false]) {
        const leg = s.joint(front ? 'foreleg' : 'hindleg', [
          side * (front ? (deep ? 0.39 : 0.335) : 0.275),
          0.36,
          front ? 0.255 : -0.34,
        ]);
        legs.push(leg);
        const bulge = deep ? 0.145 : burrower && front ? 0.14 : 0.102;
        s.tube(
          'bent muscular animal limb',
          [
            [0, 0, 0],
            [side * 0.092, -0.115, front ? -0.005 : -0.045],
            [side * 0.12, -0.252, 0.065],
          ],
          [bulge, bulge * 0.83, bulge * 0.61],
          skin,
          leg,
          10,
        );
        s.oval('heavy forearm', [side * 0.1, -0.18, 0.04], [bulge * 1.83, 0.235, 0.25], skin, leg, 0.04);
        s.oval(
          'wide clawed foot',
          [side * 0.11, -0.3, 0.117],
          [deep ? 0.29 : burrower && front ? 0.3 : 0.235, 0.11, 0.28],
          skin,
          leg,
        );
        const toes = deep ? 4 : 3;
        for (let i = 0; i < toes; i++) {
          const x = side * 0.11 + (i - (toes - 1) / 2) * 0.065;
          s.oval('toe scale', [x, -0.279, 0.195], [0.071, 0.065, 0.14], plate, leg);
          claw(
            x,
            -0.287,
            0.225,
            burrower && front ? 0.205 - Math.abs(i - 1) * 0.028 : 0.083,
            burrower && front ? 0.043 : 0.027,
            leg,
            kind === 'crystalback-stalker' ? dark : bone,
          );
        }
        for (let i = 0; i < 5; i++)
          s.oval(
            'pebbled limb armor',
            [side * (0.1 + (i % 2) * 0.035), -0.035 - i * 0.039, 0.111],
            [0.072, 0.055, 0.035],
            plate,
            leg,
            0.045,
          );
      }
    }
    tail = s.joint('balancing tail', [0, 0.335, -0.57]);
    const tailLength = burrower ? 0.7 : 1.01;
    const tailPath: readonly (readonly [number, number, number])[] = [
      [0, 0, 0],
      [0.055, -0.06, -0.2],
      [0.105, -0.13, -0.45],
      [0.18, -0.14, -tailLength * 0.78],
      [0.24, deep ? -0.016 : burrower ? -0.22 : -0.28, -tailLength],
    ];
    const tailRadii = [deep ? 0.21 : 0.16, 0.145, 0.103, 0.058, 0.002];
    s.tube('continuous tapered armored tail', tailPath, tailRadii, skin, tail, 10);
    for (let row = 0; row < 6; row++) {
      const z = 0.31 - row * 0.16;
      for (let col = -2; col <= 2; col++) {
        const x = col * (deep ? 0.145 : 0.132);
        const frontShape =
          1 -
          (x / (deep ? 0.43 : burrower ? 0.395 : 0.31)) ** 2 -
          ((z - 0.025) / (deep ? 0.455 : 0.425)) ** 2;
        const backShape = 1 - (x / (deep ? 0.34 : burrower ? 0.335 : 0.26)) ** 2 - ((z + 0.34) / 0.315) ** 2;
        if (frontShape < 0 && backShape < 0) continue;
        const y =
          Math.max(
            frontShape >= 0 ? (deep ? 0.48 : 0.46) + Math.sqrt(frontShape) * (deep ? 0.295 : 0.265) : 0,
            backShape >= 0 ? 0.36 + Math.sqrt(backShape) * 0.225 : 0,
          ) + 0.007;
        if (!burrower && !deep && col === 0) continue;
        const scute = s.oval(
          'overlapping dorsal scute',
          [x + (row % 2) * 0.013, y, z],
          [
            burrower ? 0.275 : deep ? 0.235 : 0.135,
            burrower ? 0.088 : deep ? 0.069 : 0.036,
            burrower ? 0.264 : deep ? 0.231 : 0.15,
          ],
          plate,
          body,
          0.055,
        );
        scute.rotation.x = -0.16;
        scute.rotation.z = col * -0.24;
        if (deep && Math.abs(col) < 2)
          s.tube(
            'low armored ridge',
            [
              [x, y, z],
              [x, y + 0.062, z - 0.021],
              [x, y + 0.04, z - 0.105],
            ],
            [0.054, 0.042, 0.002],
            plate,
            body,
            5,
          );
      }
    }
    for (let i = 0; i < 6; i++) {
      const t = ((i + 0.45) / 6) * 4,
        segment = Math.min(3, Math.floor(t)),
        f = t - segment;
      const p = tailPath[segment].map((value, j) => value + (tailPath[segment + 1][j] - value) * f);
      const radius = tailRadii[segment] + (tailRadii[segment + 1] - tailRadii[segment]) * f;
      const scale = s.oval(
        'tail overlapping scute',
        [p[0], p[1] + radius * 0.96, p[2]],
        [Math.max(0.033, radius * 1.83), 0.048 - i * 0.005, 0.19 - i * 0.019],
        plate,
        tail,
        0.02,
      );
      scale.rotation.x = -0.1;
    }
    for (let row = 0; row < 3; row++)
      for (let col = -1; col <= 1; col++) {
        const scute = s.oval(
          'brow overlapping scale',
          [col * (deep ? 0.17 : 0.105), 0.14 - row * 0.031, 0.045 + row * 0.13],
          [deep ? 0.225 : 0.153, 0.04, 0.18],
          plate,
          head,
          0.05,
        );
        scute.rotation.x = 0.22;
      }
    if (!burrower && !deep) {
      for (let row = 0; row < 6; row++)
        for (const col of [-1, 0, 1]) {
          const h = (0.35 - row * 0.026) * (col === 0 ? 1 : 0.62);
          const shard = s.crystal(
            'swept crystal spine',
            [col * 0.13, 0.736 + (col === 0 ? 0.06 : 0) - row * 0.028, 0.25 - row * 0.145],
            h,
            col === 0 ? 0.078 : 0.056,
            row % 2 ? crystal : crystalLight,
          );
          shard.rotation.x = -0.58;
          shard.rotation.z = -col * 0.42;
        }
    }
  } else if (kind === 'cave-spider') {
    const hide = s.material('spider purple black chitin', '#403644'),
      plate = s.material('spider chitin highlights', '#594b5a', 'stone');
    const spots = s.material('turquoise abdomen teardrops', '#4bada9', 'metal', 0.07);
    s.oval('large pear shaped spider abdomen', [0, 0.495, -0.28], [0.62, 0.55, 0.8], hide, body, 0.025);
    s.oval('cephalothorax', [0, 0.37, 0.225], [0.43, 0.285, 0.47], hide, body, 0.025);
    head.position.set(0, 0.345, 0.39);
    s.oval('broad spider face', [0, 0.012, 0.02], [0.315, 0.18, 0.19], hide, head);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const leg = s.joint('spider walking leg', [side * 0.167, 0.335, 0.285 - i * 0.133]);
        legs.push(leg);
        const z = 0.37 - i * 0.235;
        s.tube(
          'jointed upper walking leg',
          [
            [0, 0, 0],
            [side * 0.12, 0.083, z * 0.43],
            [side * 0.335, 0.166, z],
          ],
          [0.055, 0.053, 0.045],
          hide,
          leg,
          8,
        );
        s.oval('raised angular knee', [side * 0.335, 0.166, z], [0.099, 0.105, 0.106], plate, leg);
        s.tube(
          'tapered lower walking leg',
          [
            [side * 0.335, 0.166, z],
            [side * 0.46, -0.045, z * 1.23],
            [side * 0.52, -0.218, z * 1.42],
            [side * 0.57, -0.327, z * 1.6],
          ],
          [0.052, 0.045, 0.029, 0.002],
          hide,
          leg,
          8,
        );
        for (let ridge = 0; ridge < 3; ridge++)
          s.tube(
            'small leg thorn',
            [
              [side * (0.398 + ridge * 0.047), 0.078 - ridge * 0.096, z * (1.1 + ridge * 0.13)],
              [side * (0.447 + ridge * 0.047), 0.099 - ridge * 0.096, z * (1.1 + ridge * 0.13)],
            ],
            [0.024, 0.001],
            plate,
            leg,
            5,
          );
      }
      s.tube(
        'curved front pedipalp',
        [
          [side * 0.124, -0.045, 0.055],
          [side * 0.19, -0.075, 0.127],
          [side * 0.175, -0.182, 0.172],
          [side * 0.13, -0.207, 0.169],
        ],
        [0.048, 0.041, 0.028, 0.002],
        hide,
        head,
        8,
      );
      s.tube(
        'hooked chelicera fang',
        [
          [side * 0.052, -0.057, 0.09],
          [side * 0.058, -0.132, 0.147],
          [side * 0.017, -0.167, 0.175],
        ],
        [0.033, 0.024, 0.001],
        dark,
        head,
        7,
      );
      for (let i = 0; i < 3; i++) {
        const x = side * (0.054 + i * 0.042),
          y = 0.03 + (i === 2 ? 0.038 : 0),
          z = 0.125 - i * 0.017;
        s.oval('amber spider eye', [x, y, z], [i ? 0.031 : 0.042, i ? 0.027 : 0.038, 0.024], eye, head);
      }
    }
    for (let row = 0; row < 6; row++) {
      const z = -0.03 - row * 0.096,
        y = 0.498 + Math.sqrt(Math.max(0, 1 - ((z + 0.28) / 0.4) ** 2)) * 0.282;
      s.oval(
        'central turquoise abdomen marking',
        [0, y, z],
        [0.055 + Math.sin((row / 5) * Math.PI) * 0.022, 0.024, 0.079],
        spots,
      );
      for (const side of [-1, 1])
        s.oval(
          'small turquoise abdomen marking',
          [side * (0.069 + Math.sin((row / 5) * Math.PI) * 0.024), y - 0.012, z],
          [0.024, 0.017, 0.034],
          spots,
        );
    }
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4;
      s.oval(
        'layered thorax chitin',
        [Math.sin(a) * 0.125, 0.464 + (i % 2) * 0.018, 0.25 + Math.cos(a) * 0.12],
        [0.11, 0.035, 0.14],
        plate,
      );
    }
  } else if (kind === 'spore-brute') {
    const bark = s.material('root bark', '#92714d', 'stone'),
      darkBark = s.material('root crevices', '#6d573b', 'stone');
    const rootLight = s.material('exposed root fiber', '#b49970', 'stone'),
      moss = s.material('fungal moss', '#707344');
    const cap = s.material('rust orange mushroom caps', '#bb733a', 'skin'),
      rim = s.material('cream mushroom edges', '#dbc18f', 'skin');
    s.oval('massive root trunk', [0, 0.61, 0], [0.77, 0.71, 0.48], darkBark);
    s.oval('knotted shoulder mass', [0, 0.88, -0.03], [0.98, 0.34, 0.46], bark);
    for (let i = 0; i < 13; i++) {
      const a = (i * Math.PI * 2) / 13,
        x = Math.sin(a),
        z = Math.cos(a);
      s.tube(
        'interwoven torso root',
        [
          [x * 0.3, 0.87, z * 0.188],
          [x * 0.24 + 0.045, 0.7, z * 0.246],
          [x * 0.2 - 0.035, 0.49, z * 0.21],
          [x * 0.13, 0.325, z * 0.159],
        ],
        [0.038, 0.04, 0.044, 0.016],
        i % 3 ? bark : rootLight,
        body,
        7,
      );
      if (i % 2 === 0)
        s.tube(
          'crossed torso root',
          [
            [x * 0.285, 0.81, z * 0.21],
            [-x * 0.06, 0.58, z * 0.24],
            [-x * 0.19, 0.4, z * 0.18],
          ],
          [0.03, 0.034, 0.012],
          rootLight,
          body,
          7,
        );
    }
    const mushroom = (x: number, y: number, z: number, width: number, parent = body) => {
      s.tube(
        'mushroom flared stem',
        [
          [x, y - width * 0.2, z],
          [x, y - width * 0.045, z],
        ],
        [width * 0.1, width * 0.21],
        rootLight,
        parent,
        8,
      );
      s.oval(
        'gilled mushroom underside',
        [x, y - 0.027, z],
        [width, width * 0.115, width * 0.8],
        rim,
        parent,
      );
      s.oval(
        'scalloped ochre mushroom crown',
        [x, y + 0.013, z],
        [width, width * 0.16, width * 0.8],
        cap,
        parent,
        0.035,
      );
      for (let i = 0; i < 9; i++) {
        const a = (i * Math.PI * 2) / 9;
        s.tube(
          'radial pale mushroom gill',
          [
            [x + Math.cos(a) * width * 0.12, y - width * 0.12, z + Math.sin(a) * width * 0.1],
            [x + Math.cos(a) * width * 0.43, y - 0.022, z + Math.sin(a) * width * 0.34],
          ],
          [0.009, 0.006],
          rootLight,
          parent,
          5,
        );
      }
    };
    for (const side of [-1, 1]) {
      const leg = s.joint('pillar leg', [side * 0.205, 0.35, 0]);
      legs.push(leg);
      s.tube(
        'root leg',
        [
          [0, 0, 0],
          [side * 0.05, -0.17, 0.017],
          [side * 0.05, -0.29, 0.05],
        ],
        [0.144, 0.116, 0.1],
        bark,
        leg,
      );
      for (let i = 0; i < 4; i++)
        s.tube(
          'root toe',
          [
            [(i - 1.5) * 0.047 + side * 0.05, -0.23, 0.025],
            [(i - 1.5) * 0.071 + side * 0.05, -0.32, 0.13],
            [(i - 1.5) * 0.076 + side * 0.05, -0.327, 0.2],
          ],
          [0.041, 0.033, 0.006],
          rootLight,
          leg,
          7,
        );
      const arm = s.joint('striking arm', [side * 0.465, 0.855, 0.01]);
      arms.push(arm);
      s.tube(
        'long hanging root arm',
        [
          [0, 0, 0],
          [side * 0.079, -0.24, 0],
          [side * 0.105, -0.46, 0.06],
          [side * 0.085, -0.6, 0.068],
        ],
        [0.17, 0.151, 0.173, 0.151],
        darkBark,
        arm,
        10,
      );
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7;
        s.tube(
          'gnarled arm root',
          [
            [Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12],
            [side * 0.07 + Math.sin(a + 0.3) * 0.13, -0.27, Math.cos(a + 0.3) * 0.12],
            [side * 0.1 + Math.sin(a) * 0.11, -0.52, Math.cos(a) * 0.13 + 0.07],
          ],
          [0.027, 0.034, 0.031],
          i % 2 ? bark : rootLight,
          arm,
          7,
        );
      }
      for (let finger = 0; finger < 4; finger++)
        s.tube(
          'massive curled root finger',
          [
            [side * 0.08 + (finger - 1.5) * 0.054, -0.47, 0.149],
            [side * 0.08 + (finger - 1.5) * 0.054, -0.62, 0.17],
            [side * 0.08 + (finger - 1.5) * 0.054, -0.64, 0.092],
          ],
          [0.043, 0.04, 0.029],
          bark,
          arm,
          7,
        );
      mushroom(side * 0.02, -0.06, -0.015, 0.35, arm);
      mushroom(side * 0.07, -0.21, -0.03, 0.28, arm);
      mushroom(side * 0.12, -0.35, -0.02, 0.23, arm);
      for (let i = 0; i < 5; i++)
        s.oval(
          'puffball and moss cluster',
          [side * (0.27 + i * 0.022), 0.86 - i * 0.058, 0.14],
          [0.077, 0.074, 0.079],
          i % 3 ? rim : moss,
          body,
          0.05,
        );
    }
    head.position.set(0, 0.965, 0.13);
    s.oval('root knotted face', [0, 0, 0], [0.35, 0.25, 0.28], bark, head);
    eyes(0.082, 0.019, 0.139, 0.043);
    for (let i = 0; i < 5; i++)
      s.tube(
        'hanging face root',
        [
          [(i - 2) * 0.041, -0.023, 0.129],
          [(i - 2) * 0.049, -0.097, 0.17],
          [(i - 2) * 0.04, -0.164 + Math.abs(i - 2) * 0.02, 0.11],
        ],
        [0.027, 0.022, 0.001],
        rootLight,
        head,
        7,
      );
    for (const [x, y, z, r] of [
      [-0.035, 1.205, -0.075, 0.81],
      [-0.27, 1.105, 0.075, 0.59],
      [0.275, 1.065, -0.01, 0.58],
      [0, 1.072, 0.22, 0.46],
      [-0.395, 0.96, -0.11, 0.44],
      [0.37, 0.99, -0.185, 0.47],
      [0.06, 0.83, -0.24, 0.4],
      [-0.12, 0.58, -0.22, 0.28],
    ])
      mushroom(x, y, z, r);
    cloud = s.joint('spore pulse', [0, 0.52, 0]);
    for (let i = 0; i < 9; i++)
      s.oval(
        'sparse spore',
        [Math.cos(i * 2.4) * 0.6, (i % 3) * 0.2, Math.sin(i * 2.4) * 0.6],
        [0.04, 0.04, 0.04],
        eye,
        cloud,
      );
  } else if (kind === 'restless-guard') {
    const cloth = s.material('faded torn blue tabard', '#435862', 'cloth'),
      rust = s.material('corroded iron seams', '#7d6146', 'metal');
    s.tube(
      'exposed spine',
      [
        [0, 0.39, -0.025],
        [0, 0.73, -0.035],
      ],
      [0.039, 0.055],
      bone,
    );
    for (let i = 0; i < 5; i++)
      s.oval('separate vertebra', [0, 0.43 + i * 0.062, -0.041], [0.094, 0.043, 0.079], bone);
    for (const side of [-1, 1]) {
      for (let rib = 0; rib < 4; rib++)
        s.tube(
          'curved exposed rib',
          [
            [0, 0.75 - rib * 0.06, -0.035],
            [side * 0.17, 0.727 - rib * 0.06, 0.025],
            [side * 0.165, 0.68 - rib * 0.053, 0.135],
            [side * 0.026, 0.67 - rib * 0.054, 0.158],
          ],
          [0.019, 0.02, 0.017, 0.01],
          bone,
          body,
          7,
        );
      s.block(
        'split corroded breastplate',
        [side * 0.108, 0.754, 0.114],
        [0.228, 0.23, 0.16],
        iron,
      ).rotation.z = side * -0.13;
      s.tube(
        'bronze breastplate edge',
        [
          [side * 0.013, 0.857, 0.211],
          [side * 0.195, 0.823, 0.202],
          [side * 0.215, 0.703, 0.206],
          [side * 0.027, 0.656, 0.221],
        ],
        [0.012, 0.012, 0.011, 0.01],
        rust,
      );
      s.block('ancient backplate', [side * 0.105, 0.74, -0.134], [0.205, 0.26, 0.12], iron);
      const leg = s.joint('pillar leg', [side * 0.153, 0.374, 0]);
      legs.push(leg);
      s.tube(
        'exposed thigh bone',
        [
          [0, 0, 0],
          [side * 0.023, -0.146, 0.007],
        ],
        [0.041, 0.03],
        bone,
        leg,
      );
      s.oval('round knee joint', [side * 0.025, -0.157, 0.019], [0.093, 0.085, 0.085], bone, leg);
      s.tube(
        'paired shin bones',
        [
          [side * 0.025, -0.15, 0.006],
          [side * 0.04, -0.303, 0.027],
        ],
        [0.035, 0.029],
        bone,
        leg,
      );
      s.block('old shin greave', [side * 0.034, -0.258, 0.045], [0.13, 0.175, 0.099], iron, leg);
      for (const y of [-0.191, -0.313])
        s.block('greave band', [side * 0.034, y, 0.1], [0.137, 0.024, 0.02], rust, leg);
      s.oval('armored foot sole', [side * 0.04, -0.349, 0.077], [0.175, 0.041, 0.238], iron, leg);
      for (let toe = 0; toe < 4; toe++)
        s.oval(
          'exposed toe bone',
          [side * 0.04 + (toe - 1.5) * 0.035, -0.323, 0.142],
          [0.03, 0.037, 0.071],
          bone,
          leg,
        );
      const arm = s.joint('striking arm', [side * 0.285, 0.802, 0]);
      arms.push(arm);
      s.tube(
        'exposed upper arm bone',
        [
          [0, 0, 0],
          [side * 0.04, -0.185, 0.003],
        ],
        [0.035, 0.027],
        bone,
        arm,
      );
      s.oval('elbow joint', [side * 0.04, -0.186, 0.003], [0.078, 0.07, 0.076], bone, arm);
      for (const offset of [-0.021, 0.021])
        s.tube(
          'paired forearm bones',
          [
            [side * 0.04 + offset, -0.19, 0.004],
            [side * 0.028 + offset, -0.335, 0.07],
          ],
          [0.018, 0.015],
          bone,
          arm,
        );
      s.block('fitted old vambrace', [side * 0.03, -0.278, 0.061], [0.108, 0.146, 0.112], iron, arm);
      s.block('vambrace lower rim', [side * 0.029, -0.341, 0.07], [0.117, 0.025, 0.12], rust, arm);
      s.oval('bony palm', [side * 0.024, -0.382, 0.071], [0.082, 0.079, 0.045], bone, arm);
      for (let finger = 0; finger < 4; finger++)
        s.tube(
          'skeletal curled finger',
          [
            [side * 0.024 + (finger - 1.5) * 0.022, -0.373, 0.08],
            [side * 0.024 + (finger - 1.5) * 0.022, -0.423, 0.115],
            [side * 0.024 + (finger - 1.5) * 0.022, -0.427, 0.077],
          ],
          [0.01, 0.009, 0.008],
          bone,
          arm,
          5,
        );
      s.oval('corroded shoulder shell', [side * 0.022, 0.003, -0.01], [0.265, 0.195, 0.31], iron, arm, 0.025);
      if (side === -1)
        for (const [x, y] of [
          [-0.06, 0.025],
          [0.044, 0.044],
          [0.067, -0.037],
        ])
          s.oval('shoulder corrosion pit', [x, y, 0.145], [0.047, 0.047, 0.009], dark, arm);
      for (let i = 0; i < 3; i++)
        s.plaque(
          'torn pauldron cloth',
          [
            [-0.044, 0.055],
            [0.037, 0.055],
            [0.033, -0.054],
            [0.004, -0.029],
            [-0.037, -0.071],
          ],
          0.01,
          [side * 0.073, -0.069 - i * 0.025, -0.08 + i * 0.08],
          cloth,
          arm,
        );
    }
    s.oval('wide old belt', [0, 0.438, 0], [0.43, 0.075, 0.32], leather);
    s.block('bronze belt clasp', [0, 0.442, 0.168], [0.092, 0.079, 0.029], bronze);
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      s.plaque(
        'ragged blue skirt panel',
        [
          [-0.073, 0.083],
          [0.07, 0.077],
          [0.063, -0.057],
          [0.03, -0.032],
          [0.005, -0.123],
          [-0.016, -0.076],
          [-0.051, -0.09],
        ],
        0.014,
        [Math.sin(a) * 0.2, 0.335, Math.cos(a) * 0.155],
        cloth,
      ).rotation.y = a;
    }
    head.position.set(0, 1.01, 0.056);
    s.oval('angular cranium', [0, 0.015, 0], [0.36, 0.34, 0.285], bone, head);
    for (const side of [-1, 1]) {
      s.oval('deep skull eye socket', [side * 0.085, 0.017, 0.139], [0.115, 0.112, 0.069], dark, head);
      s.oval('green restless eye', [side * 0.085, 0.021, 0.17], [0.045, 0.045, 0.025], eye, head);
      s.oval('jutting zygomatic arch', [side * 0.128, -0.045, 0.125], [0.077, 0.049, 0.088], bone, head);
      s.oval('hollow cheek', [side * 0.102, -0.084, 0.142], [0.061, 0.087, 0.024], dark, head);
      s.block(
        'helmet cheek guard',
        [side * 0.161, 0.005, 0.006],
        [0.064, 0.19, 0.115],
        iron,
        head,
      ).rotation.z = side * 0.12;
    }
    s.plaque(
      'skull triangular nose',
      [
        [0, 0.018],
        [0.026, -0.048],
        [-0.026, -0.048],
      ],
      0.019,
      [0, -0.028, 0.174],
      dark,
      head,
    );
    s.oval('separate skeletal jaw', [0, -0.141, 0.065], [0.233, 0.091, 0.184], bone, head);
    s.block('black tooth gap', [0, -0.11, 0.165], [0.187, 0.035, 0.037], dark, head);
    for (let i = 0; i < 7; i++)
      for (const row of [-1, 1])
        s.block(
          'individual old tooth',
          [(i - 3) * 0.025, -0.111 + row * 0.012, 0.19 - Math.abs(i - 3) * 0.002],
          [0.019, 0.022, 0.024],
          bone,
          head,
          0.003,
        );
    s.oval('domed ancient helmet', [0, 0.134, -0.022], [0.395, 0.248, 0.33], iron, head);
    s.oval('helmet bronze rim', [0, 0.063, -0.016], [0.42, 0.052, 0.347], rust, head);
    s.tube(
      'helmet center band',
      [
        [0, 0.067, 0.169],
        [0, 0.195, 0.108],
        [0, 0.263, -0.017],
        [0, 0.19, -0.145],
      ],
      [0.019, 0.019, 0.019, 0.019],
      bronze,
      head,
    );
    rivets(head, [
      [-0.14, 0.072, 0.118],
      [-0.073, 0.072, 0.151],
      [0.073, 0.072, 0.151],
      [0.14, 0.072, 0.118],
      [0, 0.173, 0.139],
    ]);
    const shield = s.joint('ancient rectangular shield', [-0.055, -0.245, 0.188], arms[0]);
    shield.rotation.y = -0.15;
    s.block('bronze shield rim', [0, -0.02, 0], [0.36, 0.635, 0.069], rust, shield);
    for (let i = -1; i <= 1; i++)
      s.block('shield iron panel', [i * 0.098, -0.02, 0.043], [0.092, 0.566, 0.034], iron, shield, 0.008);
    for (const y of [-0.23, 0.2])
      s.block('shield crossbar', [0, y, 0.071], [0.337, 0.031, 0.02], bronze, shield);
    const emblem = s.plaque(
      'shield ancestral diamond',
      [
        [0, 0.131],
        [0.103, 0],
        [0, -0.131],
        [-0.103, 0],
      ],
      0.023,
      [0, -0.01, 0.089],
      bronze,
      shield,
    );
    s.plaque(
      'shield diamond inset',
      [
        [0, 0.096],
        [0.07, 0],
        [0, -0.096],
        [-0.07, 0],
      ],
      0.01,
      [0, -0.01, 0.105],
      dark,
      shield,
    );
    emblem.rotation.z = 0.02;
    rivets(shield, [
      [-0.151, -0.273, 0.063],
      [0.151, -0.273, 0.063],
      [-0.151, 0.254, 0.063],
      [0.151, 0.254, 0.063],
      [-0.15, -0.06, 0.07],
      [0.15, -0.06, 0.07],
    ]);
    const sword = s.joint('old chipped sword', [0.025, -0.395, 0.119], arms[1]);
    sword.rotation.x = Math.PI / 2;
    s.tube(
      'old sword grip',
      [
        [0, -0.08, 0],
        [0, 0.081, 0],
      ],
      [0.021, 0.022],
      leather,
      sword,
    );
    s.block('broad sword crossguard', [0, 0.085, 0], [0.18, 0.03, 0.055], bronze, sword);
    s.plaque(
      'chipped pointed blade',
      [
        [-0.043, 0.102],
        [0.043, 0.102],
        [0.039, 0.28],
        [0.024, 0.296],
        [0.04, 0.319],
        [0.027, 0.427],
        [0, 0.478],
        [-0.035, 0.425],
      ],
      0.026,
      [0, 0, 0],
      iron,
      sword,
    );
    s.tube(
      'sword central fuller',
      [
        [0, 0.12, 0.017],
        [0, 0.415, 0.017],
      ],
      [0.006, 0.003],
      bone,
      sword,
      5,
    );
  } else if (kind === 'ancient-sentinel') {
    const stone = s.material('sentinel gray green masonry', '#737971', 'stone'),
      lighter = s.material('sentinel dressed edges', '#929487', 'stone');
    const moss = s.material('sentinel moss flecks', '#74794a', 'skin');
    const rune = (
      x: number,
      y: number,
      z: number,
      size: number,
      parent = body,
      m: StandardMaterial = dark,
    ) => {
      s.tube(
        'carved squared labyrinth',
        [
          [x - size, y + size, z],
          [x + size, y + size, z],
          [x + size, y - size, z],
          [x - size, y - size, z],
          [x - size, y + size * 0.36, z],
          [x + size * 0.31, y + size * 0.36, z],
          [x + size * 0.31, y - size * 0.29, z],
          [x - size * 0.27, y - size * 0.29, z],
        ],
        Array(8).fill(0.009),
        m,
        parent,
        4,
      );
    };
    s.block('recessed dark torso core', [0, 0.8, 0], [0.66, 0.6, 0.44], dark);
    for (let row = 0; row < 3; row++)
      for (let col = -1; col <= 1; col++)
        s.block(
          'separate breast masonry course',
          [col * 0.227, 0.625 + row * 0.135, 0.055],
          [0.22, 0.127, 0.44],
          stone,
        );
    s.block('shoulder lintel', [0, 1.121, -0.005], [0.57, 0.181, 0.45], stone);
    for (const side of [-1, 1]) {
      s.block('head recess upright', [side * 0.252, 0.995, 0.13], [0.104, 0.29, 0.24], stone);
      s.block('bronze temple hinge', [side * 0.327, 1.03, 0.164], [0.077, 0.189, 0.051], bronze);
      s.oval('hip stone', [side * 0.176, 0.485, -0.004], [0.235, 0.186, 0.265], stone);
      const leg = s.joint('pillar leg', [side * 0.208, 0.443, 0]);
      legs.push(leg);
      s.block('thigh stone', [0, -0.035, 0], [0.232, 0.192, 0.242], stone, leg);
      s.block('bronze knee hinge', [0, -0.155, 0.037], [0.185, 0.08, 0.18], bronze, leg);
      for (let row = 0; row < 3; row++)
        s.block('stacked shin course', [0, -0.207 - row * 0.065, 0.018], [0.26, 0.059, 0.29], stone, leg);
      s.block('monumental block foot', [0, -0.386, 0.073], [0.322, 0.109, 0.393], stone, leg);
      s.block('worn stone toe', [0, -0.343, 0.195], [0.29, 0.069, 0.133], lighter, leg);
      rune(0, -0.25, 0.171, 0.064, leg);
      const arm = s.joint('striking arm', [side * 0.469, 1.027, -0.007]);
      arms.push(arm);
      s.block('monumental shoulder slab', [0, 0.008, 0], [0.334, 0.268, 0.466], stone, arm);
      s.block('shoulder carved inset', [0, 0.021, 0.241], [0.25, 0.17, 0.014], lighter, arm);
      rune(0, 0.02, 0.253, 0.059, arm);
      s.block('upper arm stone', [side * 0.006, -0.2, 0], [0.22, 0.183, 0.257], stone, arm);
      s.block('bronze elbow pin', [side * 0.013, -0.323, 0.013], [0.18, 0.08, 0.21], bronze, arm);
      for (let row = 0; row < 3; row++)
        s.block(
          'forearm masonry course',
          [side * 0.021, -0.406 - row * 0.06, 0.03],
          [0.287, 0.055, 0.323],
          stone,
          arm,
        );
      rune(side * 0.021, -0.452, 0.201, 0.075, arm);
      s.block('stone fist palm', [side * 0.023, -0.603, 0.06], [0.263, 0.202, 0.274], stone, arm);
      for (let finger = 0; finger < 3; finger++)
        s.block(
          'carved curled stone finger',
          [side * 0.023 + (finger - 1) * 0.076, -0.63, 0.215],
          [0.071, 0.127, 0.093],
          stone,
          arm,
        );
      s.block(
        'stone curled thumb',
        [side * -0.125, -0.581, 0.132],
        [0.083, 0.137, 0.11],
        stone,
        arm,
      ).rotation.z = side * 0.25;
      rivets(
        arm,
        [
          [-0.122, 0.071, 0.247],
          [0.122, 0.071, 0.247],
          [-0.122, -0.068, 0.247],
          [0.122, -0.068, 0.247],
        ],
        bronze,
        0.019,
      );
    }
    s.block('central bronze chest seal', [0, 0.767, 0.298], [0.26, 0.253, 0.041], bronze);
    s.block('seal stone face', [0, 0.767, 0.327], [0.194, 0.188, 0.031], stone);
    rune(0, 0.766, 0.35, 0.064, body, eye);
    s.block('carved waist apron', [0, 0.457, 0.175], [0.244, 0.248, 0.095], stone);
    rune(0, 0.457, 0.229, 0.061);
    s.block('ancient rear seal', [0, 0.803, -0.2], [0.262, 0.265, 0.061], bronze);
    rune(0, 0.803, -0.236, 0.074);
    head.position.set(0, 0.996, 0.174);
    s.block('inset ancestral mask', [0, 0, 0], [0.253, 0.238, 0.19], iron, head);
    s.block('mask brow bar', [0, 0.065, 0.108], [0.238, 0.039, 0.035], stone, head);
    s.block('mask nose bridge', [0, -0.018, 0.119], [0.041, 0.156, 0.039], bronze, head);
    for (const side of [-1, 1]) {
      s.block('narrow amber sentinel eye', [side * 0.061, 0.025, 0.108], [0.071, 0.023, 0.015], eye, head);
      s.block('angular mask cheek', [side * 0.084, -0.046, 0.112], [0.052, 0.115, 0.034], stone, head);
      s.block('mask vent', [side * 0.038, -0.074, 0.109], [0.012, 0.07, 0.015], dark, head);
    }
    for (let i = 0; i < 12; i++)
      s.oval(
        'sparse moss in stone seam',
        [((i % 3) - 1) * 0.242, 0.598 + Math.floor(i / 3) * 0.137, 0.282],
        [0.036, 0.013, 0.008],
        moss,
      );
  } else if (kind === 'crystal-elemental') {
    const rock = s.material('dark geode matrix', '#4c414f', 'stone'),
      inner = s.material('geode interior facets', '#563c80', 'crystal');
    const core = s.material('deep amethyst heart light', '#ad75ef', 'plain', 0.65);
    // An actual opening between separate shell stones, with a recessed interior and core.
    s.oval('geode dark rear bowl', [0, 0.744, -0.1], [0.65, 0.66, 0.325], rock, body, 0.08);
    s.oval('geode concave dark interior', [0, 0.748, 0.077], [0.423, 0.454, 0.06], inner);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6,
        x = Math.sin(a) * 0.256,
        y = 0.744 + Math.cos(a) * 0.283;
      const fragment = s.crystal(
        'open geode shell tooth',
        [x, y, 0.174],
        0.235,
        0.11,
        i % 3 ? crystal : crystalLight,
      );
      fragment.rotation.z = -a;
      fragment.rotation.x = 0.32;
      s.oval('outer geode rock', [x * 1.12, y, 0.036], [0.2, 0.18, 0.22], rock, body, 0.12);
    }
    s.crystal('luminous recessed geode heart', [0, 0.657, 0.141], 0.147, 0.062, core);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      const shard = s.crystal(
        'small inner cavity crystal',
        [Math.sin(a) * 0.134, 0.752 + Math.cos(a) * 0.159, 0.129],
        0.095,
        0.034,
        i % 3 ? inner : crystalLight,
      );
      shard.rotation.z = a;
    }
    s.oval('separate geode pelvis', [0, 0.42, -0.015], [0.43, 0.18, 0.29], rock, body, 0.08);
    s.crystal('pelvic amethyst plate', [0, 0.43, 0.101], 0.21, 0.12, crystal);
    for (const side of [-1, 1]) {
      const leg = s.joint('pillar leg', [side * 0.19, 0.386, 0]);
      legs.push(leg);
      s.tube(
        'dark stone leg core',
        [
          [0, 0, 0],
          [side * 0.029, -0.16, 0],
          [side * 0.043, -0.293, 0.04],
        ],
        [0.076, 0.063, 0.07],
        rock,
        leg,
      );
      s.crystal('thigh crystal slab', [0, -0.032, 0.066], 0.24, 0.1, crystal, leg).rotation.z = side * 0.21;
      s.crystal('shin crystal cluster', [side * 0.04, -0.229, 0.054], 0.23, 0.104, crystal, leg);
      s.crystal(
        'long stone crystal toe',
        [side * 0.04, -0.316, 0.162],
        0.24,
        0.097,
        crystalLight,
        leg,
      ).rotation.x = Math.PI / 2;
      const arm = s.joint('striking arm', [side * 0.358, 0.9, -0.011]);
      arms.push(arm);
      s.tube(
        'dark separated arm matrix',
        [
          [0, 0, 0],
          [side * 0.083, -0.205, 0],
          [side * 0.127, -0.386, 0.05],
        ],
        [0.103, 0.064, 0.101],
        rock,
        arm,
      );
      s.crystal('angular shoulder geode', [0, 0.021, 0.01], 0.254, 0.154, crystalLight, arm).rotation.z =
        side * -0.46;
      s.crystal('upper arm plate', [side * 0.05, -0.15, 0.04], 0.198, 0.077, crystal, arm).rotation.z =
        side * 0.16;
      s.crystal(
        'large forearm crystal',
        [side * 0.122, -0.328, 0.089],
        0.302,
        0.144,
        crystal,
        arm,
      ).rotation.z = side * -0.16;
      for (let finger = 0; finger < 3; finger++) {
        const x = side * 0.126 + (finger - 1) * 0.081;
        const shard = s.crystal(
          'hooked crystal finger',
          [x, -0.528, 0.115],
          0.24 - Math.abs(finger - 1) * 0.035,
          0.049,
          crystalLight,
          arm,
        );
        shard.rotation.x = Math.PI - 0.32;
        shard.rotation.z = (finger - 1) * -0.15;
      }
      s.crystal('elbow spire', [side * 0.168, -0.242, -0.042], 0.235, 0.062, crystalLight, arm).rotation.z =
        side * -0.32;
    }
    head.position.set(0, 1.078, -0.077);
    for (const [x, y, z, h, r, angle] of [
      [0, 0.097, 0.015, 0.54, 0.113, -0.08],
      [-0.205, 0.096, -0.063, 0.63, 0.115, 0.35],
      [0.213, 0.091, -0.093, 0.71, 0.127, -0.37],
      [-0.289, -0.043, 0.011, 0.32, 0.067, 0.44],
      [0.082, 0.07, -0.203, 0.43, 0.083, -0.17],
    ]) {
      const shard = s.crystal(
        'towering amethyst crown',
        [x, y, z],
        h,
        r,
        x < 0 ? crystalLight : crystal,
        head,
      );
      shard.rotation.z = angle;
      shard.rotation.x = -0.2;
    }
  } else if (kind === 'cinderling') {
    const coal = s.material('black coal crust', '#353435', 'stone'),
      coalFace = s.material('warm worn coal edges', '#47413b', 'stone');
    const ember = s.material('incandescent cracks', '#ef6518', 'plain', 0.6),
      furnace = s.material('gold furnace interior', '#ffa833', 'plain', 0.55);
    // The concept is one round coal body with a face, rather than a separate humanoid head.
    head.position.set(0, 0.64, 0.016);
    s.oval('single incandescent furnace body', [0, 0, 0], [0.575, 0.67, 0.442], ember, head);
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 9; col++) {
        const lat = -0.98 + row * 0.48,
          a = (col * Math.PI * 2) / 9 + (row % 2) * 0.28;
        const x = Math.sin(a) * Math.cos(lat) * 0.289,
          y = Math.sin(lat) * 0.326,
          z = Math.cos(a) * Math.cos(lat) * 0.224;
        // Leave the face aperture open; it receives its own brows and jaw below.
        if (z > 0.12 && y < 0.12 && y > -0.23 && Math.abs(x) < 0.24) continue;
        const shell = s.oval(
          'irregular coal crust slab',
          [x, y, z],
          [0.18, 0.171, 0.087],
          (row + col) % 3 ? coal : coalFace,
          head,
          0.13,
        );
        shell.rotation.y = a;
        shell.rotation.x = -lat;
      }
    s.oval('deep furnace face aperture', [0, -0.047, 0.202], [0.476, 0.331, 0.08], coal, head);
    for (const side of [-1, 1]) {
      s.oval(
        'slanted furnace eye',
        [side * 0.117, 0.061, 0.25],
        [0.143, 0.085, 0.032],
        furnace,
        head,
      ).rotation.z = side * 0.24;
      s.oval(
        'angry heavy coal brow',
        [side * 0.12, 0.112, 0.246],
        [0.185, 0.089, 0.062],
        coal,
        head,
        0.11,
      ).rotation.z = side * 0.3;
    }
    s.plaque(
      'jagged open furnace mouth',
      [
        [-0.194, 0.044],
        [-0.155, -0.056],
        [-0.092, -0.104],
        [0, -0.12],
        [0.112, -0.083],
        [0.193, 0.045],
        [0.133, 0.014],
        [0.083, 0.045],
        [0.016, 0.014],
        [-0.04, 0.049],
        [-0.099, 0.008],
      ],
      0.022,
      [0, -0.105, 0.25],
      furnace,
      head,
    );
    for (let i = 0; i < 6; i++) {
      const tooth = s.crystal(
        'jagged coal mouth tooth',
        [(i - 2.5) * 0.055, -0.106 + (i % 2) * 0.005, 0.269],
        0.059,
        0.027,
        coal,
        head,
      );
      tooth.rotation.z = Math.PI;
    }
    s.oval('coal chin', [0, -0.244, 0.141], [0.352, 0.13, 0.158], coalFace, head, 0.1);
    for (const side of [-1, 1]) {
      const leg = s.joint('pillar leg', [side * 0.178, 0.28, 0.005]);
      legs.push(leg);
      s.tube(
        'glowing knee joint',
        [
          [0, 0, 0],
          [side * 0.04, -0.128, 0.025],
        ],
        [0.043, 0.034],
        ember,
        leg,
      );
      s.oval('coal thigh', [0, -0.016, 0], [0.135, 0.12, 0.123], coal, leg, 0.12);
      s.oval('coal shin', [side * 0.031, -0.134, 0.035], [0.135, 0.134, 0.153], coal, leg, 0.12);
      s.oval('broad coal foot', [side * 0.04, -0.223, 0.088], [0.23, 0.11, 0.237], coal, leg, 0.1);
      for (let toe = 0; toe < 3; toe++)
        s.oval(
          'coal toe chunk',
          [side * 0.04 + (toe - 1) * 0.062, -0.229, 0.168],
          [0.075, 0.075, 0.113],
          coalFace,
          leg,
          0.08,
        );
      const arm = s.joint('striking arm', [side * 0.29, 0.726, 0]);
      arms.push(arm);
      s.tube(
        'incandescent jointed arm',
        [
          [0, 0, 0],
          [side * 0.11, -0.128, 0.005],
          [side * 0.135, -0.257, 0.075],
        ],
        [0.044, 0.034, 0.034],
        ember,
        arm,
      );
      for (let i = 0; i < 3; i++)
        s.oval(
          'separate arm coal',
          [side * i * 0.053, -i * 0.086, i * 0.02],
          [0.117, 0.115, 0.12],
          i % 2 ? coalFace : coal,
          arm,
          0.13,
        );
      s.oval('coal palm', [side * 0.143, -0.296, 0.075], [0.175, 0.143, 0.11], coal, arm, 0.1);
      for (let finger = 0; finger < 3; finger++)
        s.tube(
          'crooked coal finger',
          [
            [side * 0.143 + (finger - 1) * 0.051, -0.302, 0.095],
            [side * 0.143 + (finger - 1) * 0.061, -0.398, 0.143],
            [side * 0.143 + (finger - 1) * 0.049, -0.443, 0.128],
          ],
          [0.027, 0.025, 0.005],
          coalFace,
          arm,
          6,
        );
    }
    crest = s.joint('short flame crest', [0, 0.31, -0.032], head);
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.047,
        h = i === 2 ? 0.32 : 0.19 + (i % 2) * 0.035;
      s.tube(
        'curved flame tongue',
        [
          [x, 0, 0],
          [x - 0.025, h * 0.4, 0.013],
          [x + 0.039, h * 0.7, 0],
          [x + 0.021, h, -0.006],
        ],
        [0.049, 0.035, 0.021, 0.001],
        i % 2 ? furnace : ember,
        crest,
        7,
      );
    }
  }
  const projectile = s.joint('enemy projectile', [0, 0, 0], root);
  s.crystal(
    'contact projectile shard',
    [0, 0, 0],
    0.19,
    0.039,
    kind === 'cinderling' ? eye : crystalLight,
    projectile,
  ).rotation.x = Math.PI / 2;
  s.finish();
  projectile.setEnabled(false);
  root.position.set(enemy.x, 0, enemy.z);
  return { root, body, head, legs, arms, tail, crest, cloud, projectile };
}
