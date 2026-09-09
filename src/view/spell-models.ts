import { Color3, TransformNode, Vector3 } from '@babylonjs/core';
import type { GameScene } from './scene';
import { spellById } from '../content/spells';
import { createStartingSpellModel } from './spells-baseline';
import { spellGeometry, type SpellPoint } from './spell-geometry';

export interface SpellModel {
  id: string;
  root: TransformNode;
  orbits: Array<{ node: TransformNode; speed: number; offset: number }>;
  motes: Array<{ node: TransformNode; base: Vector3; phase: number; rise: number }>;
  pulse?: TransformNode;
  lightning?: TransformNode;
  shards?: TransformNode;
}
export interface SpellAnimation {
  time: number;
  age?: number;
  duration?: number;
  reduced?: boolean;
  active?: boolean;
  healing?: boolean;
}

/** Shared by live effects and the permanent before/after studio. */
export function createSpellModel(view: GameScene, id: string, radius = 0.5): SpellModel {
  const root = new TransformNode('refined spell ' + id, view.scene),
    model: SpellModel = { id, root, orbits: [], motes: [] };
  // Incidental enemy cues and the retired debug summon retain their original geometry.
  if (id === 'spider-web' || id === 'spore-cloud' || id === 'summon-miner') {
    createStartingSpellModel(view, id, radius).parent = root;
    return model;
  }
  const palette: Record<string, string> = {
    'summon-stonehand': '#f6b43e',
    'dwarf-haste': '#f6b840',
    'enemy-slow': '#65c8ee',
    stoneguard: '#92d8e4',
    'thunder-rune': '#b48aff',
    'runic-barrier': '#52cde2',
    'mending-rune': '#64d99b',
    'rune-of-reckoning': '#f16b46',
    'call-to-arms': '#eabd68',
  };
  const g = spellGeometry(view, root),
    color = palette[id] ?? spellById(id)?.color ?? '#efb65e';
  const glow = view.material('refined spell ' + id + ' rune', color, false, 0.62);
  const bright = view.material(
    'refined spell ' + id + ' core',
    id === 'enemy-slow'
      ? '#c7f0ff'
      : id === 'thunder-rune'
        ? '#eee7ff'
        : id === 'mending-rune'
          ? '#d0f6ad'
          : '#ffe1a0',
    false,
    0.68,
  );
  // Lit diffuse plus emission used to clip the cyan/gold runes to white in the studio.
  // Assign from the source color on every construction; shared materials must not darken cumulatively.
  glow.diffuseColor = Color3.FromHexString(color).scale(0.25);
  glow.specularColor.set(0, 0, 0);
  bright.diffuseColor = bright.emissiveColor.scale(0.18 / 0.68);
  bright.specularColor.set(0, 0, 0);
  const stone = view.material('refined spell slate', '#52616a', true),
    bevel = view.material('refined spell slate edges', '#839198', true);
  const debris = view.material('refined spell loose stone', '#75818a');
  const dark = view.material('refined spell shadow slate', '#2d3b49', true),
    bronze = view.material('refined spell bronze metal', '#a98246', true),
    copper = view.material('refined spell copper metal', '#ad6547', true);
  const orbit = (name: string, speed: number, offset = 0) => {
    const n = g.node(name);
    model.orbits.push({ node: n, speed, offset });
    return n;
  };
  const mote = (name: string, p: SpellPoint, size: number, mat = glow, parent = root, rise = 0.09) => {
    const n = g.node(name, parent);
    n.position.set(...p);
    g.diamond(name + ' diamond', [0, 0, 0], size, size * 1.65, mat, n);
    model.motes.push({ node: n, base: n.position.clone(), phase: model.motes.length * 1.73, rise });
    return n;
  };
  function socket(a: number, r: number, parent = root, mat = bronze) {
    const n = g.node('rune socket', parent);
    n.position.set(Math.cos(a) * r, 0.065, Math.sin(a) * r);
    n.rotation.y = -a;
    g.box('chamfered rune socket', [0, 0, 0], [0.16, 0.055, 0.17], mat, n, 0.012);
    g.box('recessed rune socket', [0, 0.029, 0], [0.127, 0.008, 0.135], dark, n, 0.005);
    g.rune('socket inlay', 0, 0.039, 0, 0.052, glow, n);
    return n;
  }
  if (id === 'summon-stonehand') {
    const r = Math.max(0.56, radius),
      seal = g.node('octagonal assembly forge');
    g.ring('bronze forge edge', r, 0.045, 0.045, bronze, seal, 8, 0.02);
    g.ring('amber forge inlay', r - 0.025, 0.087, 0.012, glow, seal, 8, 0.04);
    g.ring('inner assembly seal', r * 0.72, 0.072, 0.012, bright, seal, 8, 0.025);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      socket(a, r, seal);
      g.line(
        'radial forge channel',
        [
          [Math.cos(a) * r * 0.73, 0.07, Math.sin(a) * r * 0.73],
          [Math.cos(a) * r * 0.91, 0.07, Math.sin(a) * r * 0.91],
        ],
        0.009,
        glow,
        seal,
      );
    }
    const parts = orbit('assembling fragments', 0.85);
    model.shards = parts;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4,
        n = g.node('assembly stone fragment', parts);
      n.position.set(Math.cos(a) * r * 0.75, 0.28 + (i % 3) * 0.15, Math.sin(a) * r * 0.75);
      g.diamond('stone fragment', [0, 0, 0], 0.045, 0.08, i % 2 ? debris : bronze, n);
      g.rune('fragment amber seam', 0, 0, 0.035, 0.035, glow, n, false);
      model.motes.push({ node: n, base: n.position.clone(), phase: i, rise: 0.045 });
    }
    const core = g.node('open diamond assembly lattice');
    core.position.y = 0.46;
    for (const axis of [0, Math.PI / 2]) {
      const n = g.node('assembly lattice', core);
      n.rotation.y = axis;
      g.line(
        'amber lattice',
        [
          [0, 0.22, 0],
          [0.15, 0, 0],
          [0, -0.22, 0],
          [-0.15, 0, 0],
          [0, 0.22, 0],
        ],
        0.01,
        glow,
        n,
      );
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      mote(
        'forge spark',
        [Math.cos(a) * r * 0.85, 0.2 + i * 0.06, Math.sin(a) * r * 0.85],
        0.012,
        bright,
        root,
        0.15,
      );
    }
    model.pulse = seal;
  } else if (id === 'dwarf-haste') {
    const r = Math.max(0.5, radius),
      sweep = orbit('three swept haste crescents', 1.65);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        n = g.node('haste ground rune');
      n.rotation.y = -a;
      n.position.set(Math.cos(a) * r, 0.045, Math.sin(a) * r);
      g.line(
        'broken golden ground seal',
        [
          [-0.13, 0, -0.045],
          [0.13, 0, -0.045],
          [0.16, 0, 0.05],
          [-0.1, 0, 0.05],
        ],
        0.011,
        glow,
        n,
      );
      g.rune('haste rune', 0, 0.005, 0, 0.042, glow, n);
    }
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      g.band('bronze swept crescent', r, 0.115, 0.245, a, 1.36, bronze, sweep, true);
      g.band('gold swept crescent', r + 0.017, 0.067, 0.255, a, 1.36, glow, sweep, true);
      g.chevron('forward haste chevron', r + 0.07, 0.28, a + 1.14, 0.085, bright, sweep);
      g.chevron('double haste chevron', r + 0.07, 0.28, a + 1.34, 0.085, glow, sweep);
      mote('haste rising spark', [Math.cos(a) * r, 0.36, Math.sin(a) * r], 0.014, bright, sweep, 0.1);
    }
  } else if (id === 'enemy-slow') {
    const r = Math.max(0.5, radius);
    g.ring('fractured slate octagon', r, 0.039, 0.04, dark, root, 8, 0.07);
    g.ring('frost edge inlay', r - 0.009, 0.081, 0.012, glow, root, 8, 0.08);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4,
        n = g.node('inward frost tooth');
      n.rotation.y = -a;
      n.position.set(Math.cos(a) * r * 0.87, 0.095, Math.sin(a) * r * 0.87);
      g.plate(
        'frost wedge',
        [
          [-0.11, -0.018],
          [0.02, 0.026],
          [0.07, -0.022],
        ],
        0,
        0.055,
        glow,
        n,
      );
      if (i % 2 === 0) {
        const p: SpellPoint = [Math.cos(a) * 0.3, 0.115, Math.sin(a) * 0.3];
        g.diamond('ankle stone', p, 0.075, 0.1, bevel);
        g.diamond('ankle cyan inset', [p[0], p[1], p[2] - 0.043], 0.029, 0.065, glow);
      }
    }
    const bonds = orbit('slow restraint bands', -0.22);
    g.arc('open frost shackle', r * 0.65, 0.22, 0, Math.PI * 1.7, 0.022, glow, bonds, 0.035);
    g.arc('crossing frost shackle', r * 0.65, 0.16, Math.PI, -Math.PI * 1.65, 0.017, bright, bonds, 0.09);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      mote(
        'falling frost',
        [Math.cos(a) * r * 0.93, 0.24 + i * 0.03, Math.sin(a) * r * 0.93],
        0.014,
        glow,
        root,
        0.055,
      );
    }
  } else if (id === 'stoneguard') {
    const r = Math.max(0.49, radius),
      shields = orbit('four stone shield orbit', 0.2, Math.PI / 4);
    g.ring('stoneguard joining rune', r, 0.06, 0.011, glow, root, 8, 0.09);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2,
        n = g.node('floating pentagonal shield', shields);
      n.position.set(Math.cos(a) * r, 0.49, Math.sin(a) * r);
      n.rotation.y = Math.PI / 2 - a;
      n.rotation.x = -0.08;
      const shape: [number, number][] = [
        [-0.17, 0.19],
        [0, 0.285],
        [0.17, 0.19],
        [0.15, -0.14],
        [0, -0.29],
        [-0.15, -0.14],
      ];
      g.plate('shield chamfer silhouette', shape, 0, 0.072, bevel, n);
      g.plate(
        'slate shield face',
        shape.map(([x, y]) => [x * 0.87, y * 0.87]),
        0.044,
        0.015,
        stone,
        n,
      );
      g.rune('shield deep rune', 0, 0, 0.056, 0.18, glow, n, false);
      g.line(
        'shield rear rib',
        [
          [0, 0.2, -0.047],
          [0, -0.2, -0.047],
        ],
        0.017,
        dark,
        n,
      );
      g.line(
        'shield rear reinforcement',
        [
          [-0.12, 0.13, -0.05],
          [0, 0.2, -0.05],
          [0.12, 0.13, -0.05],
        ],
        0.018,
        stone,
        n,
      );
      for (const side of [-1, 1])
        g.box('bronze shield clamp', [side * 0.15, 0.12, 0.015], [0.07, 0.075, 0.11], bronze, n, 0.01);
      g.box('lower shield clamp', [0, -0.21, 0.016], [0.09, 0.055, 0.106], bronze, n, 0.008);
      model.motes.push({ node: n, base: n.position.clone(), phase: (i * Math.PI) / 2, rise: 0.026 });
      const aa = a + Math.PI / 4;
      mote('shield stone chip', [Math.cos(aa) * r, 0.2, Math.sin(aa) * r], 0.022, dark, shields, 0.05);
    }
  } else if (id === 'runic-barrier') {
    const columns = g.node('interlocked runic columns');
    model.pulse = g.node('barrier ground seal');
    g.ring('barrier square seal', 0.62, 0.05, 0.017, glow, model.pulse, 4, 0.07);
    for (const [i, x, z, h] of [
      [0, -0.225, 0, 1.02],
      [1, 0.225, 0, 1.02],
      [2, 0, -0.23, 1.26],
      [3, 0, 0.23, 1.26],
    ]) {
      const n = g.node('barrier carved column ' + i, columns);
      n.position.set(x, 0, z);
      g.box('barrier foot', [0, 0.075, 0], [0.39, 0.15, 0.39], dark, n, 0.035);
      g.box('slate pillar', [0, h / 2 + 0.06, 0], [0.335, h, 0.335], stone, n, 0.025);
      g.box('bronze foot collar', [0, 0.19, 0], [0.36, 0.085, 0.36], bronze, n, 0.014);
      g.box('bronze upper collar', [0, h - 0.045, 0], [0.36, 0.065, 0.36], bronze, n, 0.014);
      g.loft(
        'pyramidal stone cap',
        [
          [h, 0.235, 0.235],
          [h + 0.1, 0.145, 0.145],
          [h + 0.12, 0.115, 0.115],
        ],
        bevel,
        n,
        4,
      ).rotation.y = Math.PI / 4;
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        const face = g.node('rune pillar face', n);
        face.rotation.y = a;
        g.box('deep rune recess', [0, h * 0.53, 0.174], [0.15, h * 0.49, 0.009], dark, face, 0.008);
        g.rune('carved cyan binding', 0, h * 0.53, 0.184, h * 0.23, glow, face, false);
        g.diamond('bronze diamond clasp', [0, 0.215, 0.195], 0.04, 0.055, bronze, face);
        g.line(
          'stone age crack',
          [
            [-0.12, h * 0.8, 0.174],
            [-0.085, h * 0.76, 0.177],
            [-0.13, h * 0.71, 0.174],
          ],
          0.005,
          dark,
          face,
        );
      }
    }
  } else if (id === 'mending-rune') {
    const knot = g.node('joined broken stone healing knot');
    model.pulse = knot;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2,
        n = g.node('healing knot corner', knot);
      n.rotation.y = a;
      const outline: [number, number][] = [
        [-0.3, 0.205],
        [-0.1, 0.41],
        [0, 0.515],
        [0.295, 0.225],
        [0.205, 0.135],
        [0, 0.335],
        [-0.205, 0.13],
      ];
      g.flat('bronze knot border', outline, 0.048, 0.048, bronze, n);
      g.flat(
        'slate knot face',
        outline.map(([x, z]) => [x * 0.94, 0.31 + (z - 0.31) * 0.88]),
        0.076,
        0.009,
        stone,
        n,
      );
      g.line(
        'healing join',
        [
          [-0.29, 0.088, 0.21],
          [0, 0.088, 0.5],
          [0.27, 0.088, 0.23],
        ],
        0.01,
        glow,
        n,
      );
      g.line(
        'mended fracture bridge',
        [
          [0.25, 0.09, 0.18],
          [0.29, 0.098, 0.205],
          [0.33, 0.09, 0.25],
        ],
        0.013,
        bright,
        n,
      );
      g.rune('mending knot rune', 0, 0.104, 0.405, 0.045, bright, n);
    }
    const arcs = orbit('open healing crescents', 0.3);
    for (const side of [-1, 1]) {
      const crescent = g.node('outward healing crescent', arcs);
      crescent.position.x = side * 0.19;
      crescent.scaling.y = 1.15;
      const path: SpellPoint[] = [
        [side * 0.42, 0.13, 0],
        [side * 0.53, 0.29, 0],
        [side * 0.52, 0.48, 0],
        [side * 0.39, 0.67, 0],
        [side * 0.3, 0.73, 0],
      ];
      const outline: [number, number][] = [
        [side * 0.42, 0.13],
        [side * 0.53, 0.29],
        [side * 0.54, 0.48],
        [side * 0.45, 0.66],
        [side * 0.3, 0.73],
        [side * 0.4, 0.58],
        [side * 0.43, 0.42],
        [side * 0.4, 0.25],
      ];
      g.plate('gold healing crescent rim', outline, 0, 0.02, bronze, crescent);
      for (const face of [-1, 1]) {
        g.plate(
          'green healing crescent',
          outline.map(([x, y]) => [side * 0.44 + (x - side * 0.44) * 0.72, 0.44 + (y - 0.44) * 0.9]),
          face * 0.017,
          0.006,
          glow,
          crescent,
        );
        g.rune('healing crescent diamond', side * 0.49, 0.42, face * 0.028, 0.058, bright, crescent, false);
      }
      g.line('living crescent inner light', path, 0.01, glow, crescent);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      mote(
        'ascending life mote',
        [Math.cos(a) * 0.37, 0.22 + i * 0.09, Math.sin(a) * 0.37],
        0.018,
        glow,
        root,
        0.12,
      );
    }
  } else if (id === 'rune-of-reckoning') {
    const brand = g.node('angular judgment brand');
    model.pulse = brand;
    g.ring('red outer judgment diamond', 0.58, 0.057, 0.014, glow, brand, 4, 0.05);
    g.ring('red inner judgment diamond', 0.47, 0.06, 0.01, glow, brand, 4, 0.12);
    g.line(
      'judgment central stem',
      [
        [0, 0.072, -0.28],
        [0, 0.072, 0.21],
        [-0.1, 0.072, 0.1],
        [0, 0.072, 0.21],
        [0.1, 0.072, 0.1],
      ],
      0.018,
      glow,
      brand,
    );
    for (const side of [-1, 1])
      g.line(
        'judgment fork',
        [
          [0, 0.072, -0.15],
          [side * 0.15, 0.072, -0.025],
          [side * 0.15, 0.072, 0.16],
          [side * 0.21, 0.072, 0.11],
        ],
        0.016,
        glow,
        brand,
      );
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2,
        n = g.node('inward copper judgment bracket');
      n.rotation.y = -a;
      n.position.set(Math.cos(a) * 0.56, 0.055, Math.sin(a) * 0.56);
      g.box('copper judgment crossbar', [-0.075, 0, 0], [0.09, 0.065, 0.29], copper, n, 0.012);
      g.box('copper judgment prong', [0.025, 0, 0], [0.21, 0.065, 0.11], copper, n, 0.012);
      g.line(
        'ember bracket slit',
        [
          [-0.1, 0.044, -0.115],
          [-0.1, 0.044, 0],
          [0.115, 0.044, 0],
        ],
        0.011,
        glow,
        n,
      );
      g.line(
        'radiating ember fracture',
        [
          [Math.cos(a) * 0.44, 0.047, Math.sin(a) * 0.44],
          [Math.cos(a + 0.08) * 0.67, 0.047, Math.sin(a + 0.08) * 0.67],
          [Math.cos(a - 0.05) * 0.73, 0.047, Math.sin(a - 0.05) * 0.73],
        ],
        0.007,
        glow,
      );
      mote('judgment ember', [Math.cos(a) * 0.52, 0.18, Math.sin(a) * 0.52], 0.013, glow, root, 0.07);
    }
  } else if (id === 'call-to-arms') {
    const r = radius > 0.7 ? radius : 3,
      seal = g.node('rally compass ground seal');
    model.pulse = seal;
    for (let i = 0; i < 16; i++)
      g.band(
        'slate rally perimeter sector',
        r - 0.13,
        0.27,
        0.027,
        (i * Math.PI) / 8 + 0.01,
        Math.PI / 8 - 0.02,
        stone,
        seal,
      );
    g.ring('bronze rally perimeter trim', r, 0.047, 0.015, bronze, seal, 16, 0.03);
    g.ring('amber rally perimeter', r - 0.25, 0.047, 0.018, glow, seal, 16, 0.04);
    g.ring('rally inner ring', r * 0.87, 0.047, 0.01, bronze, seal, 16, 0.07);
    g.ring('central rally seal', 1.32, 0.06, 0.023, glow, seal, 16, 0.04);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2,
        n = g.node('low rally rune standard');
      n.position.set(Math.cos(a) * r * 0.91, 0, Math.sin(a) * r * 0.91);
      n.rotation.y = Math.PI / 2 - a;
      g.box('standard stone foot', [0, 0.055, 0], [0.27, 0.11, 0.24], dark, n, 0.025);
      g.box('standard bronze collar', [0, 0.16, 0], [0.18, 0.08, 0.17], bronze, n, 0.015);
      g.loft(
        'tapered octagonal rune standard',
        [
          [0.15, 0.125, 0.125],
          [0.44, 0.09, 0.09],
          [0.49, 0.065, 0.065],
        ],
        stone,
        n,
        8,
      );
      g.box('standard bronze cap', [0, 0.45, 0], [0.19, 0.055, 0.19], bronze, n, 0.012);
      n.scaling.setAll(1.2);
      for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        const face = g.node('standard rune face', n);
        face.rotation.y = angle;
        g.rune('standard amber rune', 0, 0.3, 0.111, 0.105, glow, face, false);
      }
      const compass = g.node('amber compass diamond', seal);
      compass.rotation.y = -a;
      compass.position.set(Math.cos(a) * (r - 0.55), 0.065, Math.sin(a) * (r - 0.55));
      g.flat(
        'bronze compass diamond',
        [
          [-0.3, 0],
          [0, 0.11],
          [0.3, 0],
          [0, -0.11],
        ],
        0,
        0.018,
        bronze,
        compass,
      );
      g.flat(
        'amber compass center',
        [
          [-0.24, 0],
          [0, 0.069],
          [0.24, 0],
          [0, -0.069],
        ],
        0.014,
        0.01,
        glow,
        compass,
      );
      socket(a + Math.PI / 4, r * 0.88, seal);
    }
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) * Math.PI) / 4,
        n = g.node('outer rally rune', seal);
      n.position.set(Math.cos(a) * (r - 0.13), 0.05, Math.sin(a) * (r - 0.13));
      n.rotation.y = -a;
      g.rune('amber sector rune', 0, 0, 0, 0.09, glow, n);
    }
    for (const side of [-1, 1]) {
      const n = g.node('crossed rally axe', seal);
      n.rotation.y = side * 0.67;
      n.scaling.set(3, 1, 3);
      g.line(
        'bronze axe haft',
        [
          [0, 0.075, -0.36],
          [0, 0.075, 0.35],
        ],
        0.027,
        bronze,
        n,
      );
      g.line(
        'gold axe haft inlay',
        [
          [0, 0.108, -0.34],
          [0, 0.108, 0.34],
        ],
        0.009,
        glow,
        n,
      );
      const head: [number, number][] = [
        [-0.02, 0.13],
        [0.075, 0.12],
        [0.14, 0.045],
        [0.265, 0.045],
        [0.23, 0.15],
        [0.26, 0.29],
        [0.2, 0.39],
        [0.075, 0.345],
        [-0.02, 0.34],
      ];
      g.flat(
        'broad bearded rally axe',
        head.map(([x, z]) => [x * side, z]),
        0.09,
        0.026,
        bronze,
        n,
      );
      g.flat(
        'inset rally axe face',
        head.map(([x, z]) => [x * side * 0.85, 0.21 + (z - 0.21) * 0.83]),
        0.108,
        0.009,
        copper,
        n,
      );
      g.line(
        'axe cutting edge',
        [
          [side * 0.265, 0.117, 0.045],
          [side * 0.23, 0.117, 0.15],
          [side * 0.26, 0.117, 0.29],
          [side * 0.2, 0.117, 0.39],
        ],
        0.013,
        glow,
        n,
      );
    }
  } else if (id === 'thunder-rune') {
    const r = Math.max(0.7, radius),
      seal = g.node('thunder impact seal');
    model.pulse = seal;
    g.ring('thunder slate outer diamond', r * 0.7, 0.028, 0.072, stone, seal, 4, 0.025);
    g.ring('thunder violet diamond inlay', r * 0.7, 0.098, 0.014, glow, seal, 4, 0.08);
    g.ring('thunder inner stone diamond', r * 0.46, 0.025, 0.037, dark, seal, 4, 0.025);
    const zigzag: [number, number][] = [
      [-0.12, 0.39],
      [0.23, 0.045],
      [0.02, 0.045],
      [0.2, -0.38],
      [-0.24, -0.055],
      [-0.02, -0.055],
    ];
    g.flat('thunder central zigzag substrate', zigzag, 0.055, 0.033, bronze, seal);
    g.flat(
      'thunder central lightning glyph',
      zigzag.map(([x, z]) => [x * 0.9, z * 0.9]),
      0.078,
      0.016,
      glow,
      seal,
    );
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        point = (angle: number, scale: number): SpellPoint => [
          Math.cos(angle) * r * scale,
          0.05,
          Math.sin(angle) * r * scale,
        ];
      g.line(
        'jagged thunder perimeter',
        [
          point(a + 0.018, 0.99),
          point(a + 0.11, 0.95),
          point(a + 0.19, 1.012),
          point(a + 0.28, 0.97),
          point(a + 0.365, 1),
        ],
        0.011,
        glow,
        seal,
      );
      if (i % 4 === 0) {
        socket(a, r * 0.7, seal);
        g.line(
          'short impact fracture',
          [point(a, 0.73), point(a - 0.065, 0.82), point(a + 0.045, 0.91), point(a, 1)],
          0.01,
          glow,
          seal,
        );
      }
    }
    const lightning = g.node('branching thunder strike');
    model.lightning = lightning;
    const path: SpellPoint[] = [
      [0.1, 1.58, -0.03],
      [-0.18, 1.24, 0.02],
      [0.13, 1.12, 0.015],
      [-0.035, 0.78, 0],
      [0.095, 0.65, 0.02],
      [0, 0.075, 0],
    ];
    // One visible pale strike avoids hiding a smaller core inside an opaque violet shell.
    g.line('white lightning strike', path, 0.027, bright, lightning);
    for (const side of [-1, 1])
      g.line(
        'forked thunder branch',
        [
          [0, 0.78, 0],
          [side * 0.3, 0.63, side * 0.1],
          [side * 0.21, 0.45, side * 0.16],
          [side * 0.55, 0.13, side * 0.24],
        ],
        0.016,
        glow,
        lightning,
      );
    const shards = g.node('thunder thrown debris');
    model.shards = shards;
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI * 2) / 9,
        n = mote(
          'impact stone shard',
          [Math.cos(a) * r * 0.5, 0.14 + (i % 3) * 0.09, Math.sin(a) * r * 0.5],
          0.035,
          debris,
          shards,
          0.09,
        );
      n.rotation.z = a;
    }
  }
  g.finish();
  animateSpellModel(model, { time: 0, reduced: true });
  return model;
}

/** Simulation time gives studio pause/restart/frame-step the same poses as ordinary play. */
export function animateSpellModel(model: SpellModel, state: SpellAnimation) {
  const t = state.reduced ? 0 : state.time,
    age = state.age ?? 0.24,
    duration = state.duration ?? 0.7;
  for (const { node, speed, offset } of model.orbits) node.rotation.y = offset + t * speed;
  for (const { node, base, phase, rise } of model.motes) {
    node.position.copyFrom(base);
    node.position.y += state.reduced ? 0 : Math.sin(t * 2 + phase) * rise;
  }
  if (model.pulse) model.pulse.scaling.setAll(state.reduced ? 1 : 1 + Math.sin(t * 2.4) * 0.012);
  if (model.id === 'thunder-rune') {
    if (model.lightning) model.lightning.setEnabled(state.reduced || age < duration * 0.58);
    if (model.shards) model.shards.scaling.setAll(state.reduced ? 1 : 1 + Math.min(1, age / duration) * 0.7);
  }
  if (model.id === 'summon-stonehand' && model.shards)
    model.shards.scaling.setAll(state.reduced ? 1 : 1 - 0.35 * Math.min(1, Math.max(0, age) / duration));
  if (model.id === 'mending-rune')
    for (const { node } of model.motes) node.setEnabled(state.healing !== false);
  if (state.active !== undefined)
    model.root.setEnabled(
      state.active &&
        (!(model.id === 'thunder-rune' || model.id === 'summon-stonehand') || (age >= 0 && age < duration)),
    );
}
