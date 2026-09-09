import { MeshBuilder, TransformNode, type StandardMaterial } from '@babylonjs/core';
import type { GameScene } from './scene';
import type { Furnishing } from '../game/types';
import type { LiveRoomDecoration } from '../game/room-decoration';
import { residentBedding } from '../content/room-visuals';
import { dressedBlock } from './environment';
import { drawFurnishingModel, type FurnishingDisplay } from './furnishing-models';

/** Current room props. The previous renderer remains intact for the reference studio. */
export function drawRoomFurnishing(
  view: GameScene,
  f: Furnishing,
  parent: TransformNode,
  display: FurnishingDisplay & Partial<LiveRoomDecoration> = {},
) {
  const model = f.model ?? f.kind;
  if (
    ![
      'gold-pile',
      'resident-bed',
      'dining-table',
      'small-dining-table',
      'tool-rack',
      'long-bookcase',
      'straw-dummy',
      'shield-dummy',
      'target-post',
      'striking-pillar',
    ].includes(model)
  ) {
    drawFurnishingModel(view, f, parent, display);
    return;
  }
  const root = new TransformNode(f.id, view.scene);
  root.parent = parent;
  const width = Math.max(...f.cells.map((p) => p.x)) - Math.min(...f.cells.map((p) => p.x)) + 1;
  const depth = Math.max(...f.cells.map((p) => p.z)) - Math.min(...f.cells.map((p) => p.z)) + 1;
  root.position.set(f.x + (width - 1) / 2, 0, f.z + (depth - 1) / 2);
  root.rotation.y = f.rotation ? Math.PI / 2 : 0;
  root.scaling.setAll(display.scale ?? 1);
  const wood = view.material('room walnut wood', '#65503b', true),
    iron = view.material('room forged iron', '#596370'),
    brass = view.material('room aged brass', '#b39458');
  const part = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: StandardMaterial,
  ) => {
    const mesh = dressedBlock(
      view,
      name,
      x,
      y,
      z,
      w,
      h,
      d,
      mat,
      root,
      Math.min(0.014, w * 0.08, h * 0.08, d * 0.08),
    );
    mesh.isPickable = false;
    return mesh;
  };
  const cylinder = (
    name: string,
    x: number,
    y: number,
    z: number,
    h: number,
    d: number,
    mat: StandardMaterial,
  ) => {
    const m = MeshBuilder.CreateCylinder(name, { height: h, diameter: d, tessellation: 12 }, view.scene);
    m.position.set(x, y, z);
    m.material = mat;
    m.parent = root;
    m.isPickable = false;
    return m;
  };
  const sphere = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: StandardMaterial,
  ) => {
    const m = MeshBuilder.CreateSphere(name, { diameter: 1, segments: 8 }, view.scene);
    m.position.set(x, y, z);
    m.scaling.set(w, h, d);
    m.material = mat;
    m.parent = root;
    m.isPickable = false;
    return m;
  };
  if (model === 'gold-pile') {
    const ratio = Math.min(1, (display.storedGold ?? 0) / Math.max(1, display.goldCapacity ?? 50));
    const gold = view.material('room gold coins', '#f5bd46', false, 0.12),
      pale = view.material('room gold coin edges', '#ffda70', false, 0.08);
    const count = Math.max(1, Math.ceil(ratio * 68)),
      size = 0.12;
    const radius = 0.34 * Math.sqrt(ratio),
      height = 0.34 * Math.cbrt(ratio);
    if (count > 6) sphere('coin mound', 0, height * 0.38, 0, radius * 1.9, height * 0.8, radius * 1.9, gold);
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996,
        r = radius * Math.sqrt((i + 0.5) / count);
      const coin = cylinder(
        'gold coin',
        Math.cos(a) * r,
        0.018 + height * (1 - (r * r) / Math.max(0.001, radius * radius)),
        Math.sin(a) * r,
        0.025,
        size,
        i % 4 ? gold : pale,
      );
      coin.rotation.set(Math.sin(i * 3) * 0.32, i * 0.8, Math.cos(i * 2) * 0.32);
      if (i % 5 === 0) cylinder('coin stack', Math.cos(a) * r, 0.035, Math.sin(a) * r, 0.06, size, gold);
    }
    return;
  }
  if (model === 'resident-bed') {
    const bedding = residentBedding[display.residentType ?? 'miner'] ?? residentBedding.miner;
    const cloth = view.material(`resident bedding ${display.residentType}`, bedding.color),
      linen = view.material('bed cream linen', '#d9c8a7');
    if (bedding.model === 'den') {
      cylinder('den base', 0, 0.055, 0, 0.11, 0.8, wood);
      const rim = MeshBuilder.CreateTorus(
        'bolstered den edge',
        { diameter: 0.66, thickness: 0.12, tessellation: 20 },
        view.scene,
      );
      rim.position.y = 0.17;
      rim.parent = root;
      rim.material = cloth;
      rim.isPickable = false;
      sphere('hound cushion', 0, 0.12, 0, 0.65, 0.15, 0.65, cloth);
      sphere('den paw pad', 0, 0.204, 0.05, 0.16, 0.014, 0.14, linen);
      for (const x of [-0.1, 0, 0.1]) sphere('den paw toe', x, 0.203, -0.08, 0.06, 0.018, 0.07, linen);
    } else {
      const cot = bedding.model === 'cot';
      part('assigned bed frame', 0, 0.13, 0, 0.62, 0.12, 0.88, cot ? iron : wood);
      part('assigned mattress', 0, 0.22, 0, 0.58, 0.1, 0.82, linen);
      part('resident blanket', 0, 0.285, 0.12, 0.58, 0.045, 0.56, cloth);
      part('bed pillow', 0, 0.29, -0.28, 0.48, 0.09, 0.21, linen);
      part('blanket hem', 0, 0.312, -0.12, 0.57, 0.018, 0.045, brass);
      for (const x of [-0.25, 0.25])
        for (const z of [-0.37, 0.37]) part('bed foot', x, 0.1, z, 0.06, 0.2, 0.06, cot ? iron : wood);
      if (!cot) part('low headboard', 0, 0.3, -0.43, 0.65, 0.36, 0.065, wood);
      if (bedding.model === 'rune-bed') {
        const rune = view.material('bed rune inlay', '#9ec9ed', false, 0.25);
        part('rune stem', 0, 0.37, -0.471, 0.025, 0.21, 0.01, rune);
        part('rune branch', 0.05, 0.405, -0.473, 0.1, 0.02, 0.01, rune).rotation.z = 0.5;
      } else if (display.residentType === 'warrior') {
        const emblem = cylinder('warrior bed shield', 0, 0.318, 0.11, 0.015, 0.18, brass);
        emblem.scaling.z = 0.8;
      } else if (display.residentType === 'engineer') {
        const emblem = part('engineer blanket patch', 0, 0.314, 0.13, 0.13, 0.012, 0.13, brass);
        emblem.rotation.y = Math.PI / 4;
      }
    }
    return;
  }
  if (model === 'dining-table' || model === 'small-dining-table') {
    const small = model === 'small-dining-table',
      length = small ? 0.8 : 2.7;
    part('communal tabletop', 0, 0.55, 0, length, 0.12, small ? 0.55 : 0.72, wood);
    for (const x of [-length / 2 + 0.14, length / 2 - 0.14])
      part('table trestle', x, 0.28, 0, 0.13, 0.54, 0.58, wood);
    part('table runner', 0, 0.616, 0, length * 0.72, 0.009, 0.2, view.material('dining linen', '#d4bd91'));
    if (!small)
      for (const z of [-0.64, 0.64]) {
        part('communal bench', 0, 0.29, z, length, 0.09, 0.24, wood);
        for (const x of [-length / 2 + 0.2, length / 2 - 0.2])
          part('bench support', x, 0.14, z, 0.12, 0.28, 0.22, wood);
      }
    return;
  }
  if (model === 'long-bookcase' || model === 'tool-rack') {
    const shelf = model === 'long-bookcase',
      length = shelf ? 2.8 : 1.8;
    part('upright backing', 0, 0.76, 0, length, 1.44, 0.14, wood);
    for (const x of [-length / 2 + 0.06, length / 2 - 0.06]) {
      part('upright end', x, 0.76, 0, 0.12, 1.5, 0.38, wood);
      part('upright foot', x, 0.07, 0, 0.22, 0.14, 0.48, iron);
      part('upright crown', x, 1.5, 0, 0.17, 0.055, 0.4, brass);
    }
    if (shelf) {
      for (const y of [0.14, 0.56, 0.98, 1.4]) part('long shelf', 0, y, -0.12, length, 0.055, 0.4, wood);
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 16; i++) {
          const book = view.material(
            `archive volume ${i % 4}`,
            ['#5d7280', '#876044', '#626f50', '#975842'][i % 4],
          );
          const x = -1.22 + i * 0.162,
            y = 0.34 + row * 0.42;
          part('archive volume', x, y, -0.18, 0.13, 0.3 + (i % 3) * 0.025, 0.23, book);
          if (i % 4 === 0) part('bound volume band', x, y - 0.07, -0.303, 0.13, 0.015, 0.009, brass);
        }
    } else {
      // Freestanding racks must read from either aisle and every camera orbit.
      for (const side of [-1, 1]) {
        for (const x of [-0.5, 0, 0.5]) {
          part('hanging tool handle', x, 0.7, side * 0.15, 0.055, 0.66, 0.055, wood);
          part('hanging tool head', x, 1, side * 0.18, 0.27, 0.12, 0.12, iron);
        }
        part('tool rail', 0, 1.19, side * 0.12, 1.65, 0.055, 0.12, brass);
      }
    }
    return;
  }
  const straw = view.material('upright target straw', '#b99c66'),
    leather = view.material('upright target leather', '#976948');
  for (const rotation of [0, Math.PI / 2])
    part('target cross foot', 0, 0.045, 0, 0.5, 0.09, 0.1, iron).rotation.y = rotation;
  cylinder('target upright', 0, 0.49, 0, 0.92, 0.1, wood);
  if (model === 'striking-pillar') {
    cylinder('padded striking pillar', 0, 0.68, 0, 1.15, 0.36, leather);
    for (const y of [0.13, 0.43, 0.83, 1.25]) cylinder('pillar binding', 0, y, 0, 0.04, 0.375, brass);
  } else if (model === 'target-post') {
    for (const [d, z, mat] of [
      [0.62, -0.03, wood],
      [0.48, -0.08, straw],
      [0.32, -0.105, leather],
      [0.14, -0.13, straw],
    ] as const) {
      const disc = cylinder('upright bullseye', 0, 0.91, z, 0.045, d, mat);
      disc.rotation.x = Math.PI / 2;
    }
  } else {
    const shield = model === 'shield-dummy';
    cylinder('dummy torso', 0, 0.66, 0, 0.43, 0.33, shield ? iron : straw);
    part('dummy cross arms', 0, 0.77, 0, 0.67, 0.12, 0.13, wood);
    sphere('dummy head', 0, 1.01, 0, 0.27, 0.27, 0.25, shield ? iron : straw);
    if (shield) {
      const disc = cylinder('upright practice shield', 0, 0.64, -0.24, 0.065, 0.45, wood);
      disc.rotation.x = Math.PI / 2;
      const boss = cylinder('shield boss', 0, 0.64, -0.29, 0.045, 0.15, brass);
      boss.rotation.x = Math.PI / 2;
      part('visor slit', 0, 1.025, -0.127, 0.16, 0.025, 0.015, wood);
    } else for (const y of [0.48, 0.83]) cylinder('straw binding', 0, y, 0, 0.04, 0.35, brass);
  }
}
