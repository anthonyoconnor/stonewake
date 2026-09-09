import { MeshBuilder, TransformNode, Vector3, type StandardMaterial } from '@babylonjs/core';
import type { GameScene } from './scene';
import type { Furnishing } from '../game/types';
import type { LiveRoomDecoration } from '../game/room-decoration';
import { residentBedding } from '../content/room-visuals';
import { dressedBlock } from './environment';
import { drawFurnishingModel, type FurnishingDisplay } from './furnishing-models';
import { drapedCloth, furnishingFinish } from './room-furnishing-detail';

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
      'stove',
      'assembly',
      'bench',
      'anvil',
      'tool-rack',
      'long-bookcase',
      'lectern',
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
  root.rotation.y = f.facing ?? (f.rotation ? Math.PI / 2 : 0);
  root.scaling.setAll(display.scale ?? 1);
  const wood = furnishingFinish(view, 'oiled walnut', '#846044', 'wood'),
    darkWood = furnishingFinish(view, 'dark walnut', '#584432', 'wood'),
    iron = furnishingFinish(view, 'hammered iron', '#68696a', 'iron'),
    darkIron = furnishingFinish(view, 'dark forged iron', '#3b3d3f', 'iron'),
    brass = furnishingFinish(view, 'worn brass', '#b79960', 'iron'),
    paleMetal = furnishingFinish(view, 'worn steel', '#a19e94', 'iron');
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
      Math.min(0.022, w * 0.12, h * 0.16, d * 0.12),
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
    top = d,
    tessellation = 16,
  ) => {
    const mesh = MeshBuilder.CreateCylinder(
      name,
      { height: h, diameterBottom: d, diameterTop: top, tessellation },
      view.scene,
    );
    mesh.position.set(x, y, z);
    mesh.material = mat;
    mesh.parent = root;
    mesh.isPickable = false;
    return mesh;
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
    // Build the ellipsoid directly: scaling a sphere before static merging distorts its normals.
    const mesh = MeshBuilder.CreateSphere(
      name,
      { diameterX: w, diameterY: h, diameterZ: d, segments: 12 },
      view.scene,
    );
    mesh.position.set(x, y, z);
    mesh.material = mat;
    mesh.parent = root;
    mesh.isPickable = false;
    return mesh;
  };
  const torus = (
    name: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    thickness: number,
    mat: StandardMaterial,
  ) => {
    const mesh = MeshBuilder.CreateTorus(name, { diameter, thickness, tessellation: 20 }, view.scene);
    mesh.position.set(x, y, z);
    mesh.material = mat;
    mesh.parent = root;
    mesh.isPickable = false;
    return mesh;
  };
  const rivet = (x: number, y: number, z: number, mat = paleMetal, size = 0.023) =>
    sphere('forged rivet', x, y, z, size, size, size, mat);
  const ringFace = (
    name: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    thickness: number,
    mat: StandardMaterial,
  ) => {
    const ring = torus(name, x, y, z, diameter, thickness, mat);
    ring.rotation.x = Math.PI / 2;
    return ring;
  };
  const diamond = (x: number, y: number, z: number, size: number, mat = brass) => {
    for (const angle of [-Math.PI / 4, Math.PI / 4]) {
      for (const side of [-1, 1])
        part(
          'inlaid diamond',
          x + (side * Math.cos(angle) * size) / 4,
          y + (side * Math.sin(angle) * size) / 4,
          z,
          size / 2,
          0.012,
          0.014,
          mat,
        ).rotation.z = angle + Math.PI / 2;
    }
  };
  const lantern = (x: number, y: number, z: number) => {
    const w = 0.105,
      h = 0.25,
      glow = view.material('room artisan warm lamp glass', '#ffca70', false, 0.9);
    const glass = part('amber lantern glass', x, y, z, w, h, w, glow);
    view.includeGlow(glass);
    for (const offset of [-1, 1]) {
      part('lantern cap', x, y + offset * (h / 2 + 0.015), z, w + 0.055, 0.035, w + 0.055, darkIron);
      for (const side of [-1, 1])
        part('lantern mullion', x + (offset * w) / 2, y, z + (side * w) / 2, 0.014, h, 0.014, darkIron);
    }
    part('lantern crossbar', x, y - 0.035, z - w / 2, w, 0.012, 0.018, darkIron);
  };
  // These are soft contacts, not extra room fixtures or gameplay obstacles.
  const localWidth = f.rotation ? depth : width,
    localDepth = f.rotation ? width : depth;
  view.shadow(0, 0, model === 'gold-pile' ? 0.9 : localWidth * 0.95, localDepth * 0.9, root);

  if (model === 'gold-pile') {
    const ratio = Math.min(1, (display.storedGold ?? 0) / Math.max(1, display.goldCapacity ?? 50));
    if (ratio <= 0) return;
    const gold = furnishingFinish(view, 'stamped gold coin', '#f2c34f', 'coin'),
      paleGold = furnishingFinish(view, 'bright stamped gold coin', '#ffda79', 'coin');
    const count = Math.max(1, Math.ceil(ratio * 100)),
      radius = 0.36 * Math.sqrt(ratio),
      height = 0.34 * Math.cbrt(ratio);
    // A tapered core is hidden by overlapping, independently tilted coins, without a flat round base.
    if (count > 12) {
      const core = MeshBuilder.CreateIcoSphere(
        'buried uneven coin mass',
        { radius: 1, subdivisions: 2 },
        view.scene,
      );
      core.position.y = height * 0.34;
      core.scaling.set(radius * 0.76, height * 0.42, radius * 0.71);
      core.rotation.y = f.x * 0.6 + f.z;
      core.parent = root;
      core.material = gold;
      core.isPickable = false;
    }
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996 + Math.sin(f.x * 2 + f.z) * 0.6,
        r = radius * Math.sqrt((i + 0.5) / count);
      const variation = 1 + 0.12 * Math.sin(a * 3 + i * 0.7),
        x = Math.cos(a) * r * variation,
        z = Math.sin(a) * r;
      const y =
        0.018 +
        height * Math.pow(Math.max(0, 1 - r / Math.max(radius, 0.001)), 0.7) +
        Math.sin(i * 4.1) * 0.009;
      const coin = cylinder(
        'stamped loose gold coin',
        x,
        y,
        z,
        0.018,
        0.084 + (i % 4) * 0.008,
        i % 5 ? gold : paleGold,
        undefined,
        16,
      );
      coin.rotation.set(Math.sin(i * 3.1) * 0.55, i * 0.8, Math.cos(i * 2.3) * 0.48);
      if (i % 17 === 0 && ratio > 0.3)
        for (let stack = 0; stack < 3; stack++) {
          const extra = cylinder(
            'short uneven coin stack',
            x,
            0.018 + stack * 0.018,
            z,
            0.016,
            0.09,
            paleGold,
          );
          extra.rotation.y = i + stack * 0.31;
        }
    }
    return;
  }

  if (model === 'resident-bed') {
    const role = display.residentType ?? 'miner',
      bedding = residentBedding[role] ?? residentBedding.miner;
    const cloth = furnishingFinish(view, `woven ${role} bedding`, bedding.color, 'cloth', role),
      linen = furnishingFinish(view, 'undyed bed linen', '#d9c7a3', 'cloth'),
      piping = furnishingFinish(view, 'linen seams', '#b49d78', 'cloth');
    if (bedding.model === 'den') {
      cylinder('hound den timber base', 0, 0.065, 0, 0.13, 0.83, darkWood, 0.79, 20);
      for (const y of [0.05, 0.125]) torus('den timber binding', 0, y, 0, 0.78, 0.019, iron);
      const rim = torus('stuffed hound bolster', 0, 0.185, 0, 0.66, 0.14, cloth);
      rim.scaling.y = 0.9;
      sphere('creased hound cushion', 0, 0.142, 0, 0.62, 0.145, 0.62, cloth);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4,
          x = Math.cos(a) * 0.367,
          z = Math.sin(a) * 0.367;
        const strap = part('den reinforced strap', x, 0.145, z, 0.095, 0.25, 0.048, iron);
        strap.rotation.y = -a + Math.PI / 2;
        rivet(x * 1.05, 0.075, z * 1.05, brass, 0.02);
        const stitch = part('bolster stitched seam', x * 0.92, 0.247, z * 0.92, 0.1, 0.009, 0.012, piping);
        stitch.rotation.y = -a;
      }
      sphere('embroidered paw pad', 0, 0.218, 0.045, 0.17, 0.006, 0.14, linen);
      for (let i = 0; i < 4; i++) {
        const a = -0.95 + i * 0.63;
        sphere(
          'embroidered paw toe',
          Math.sin(a) * 0.135,
          0.213,
          -0.11 + 0.065 * (1 - Math.cos(a)),
          0.058,
          0.006,
          0.071,
          linen,
        );
      }
    } else {
      const cot = bedding.model === 'cot';
      part('assigned bed platform', 0, 0.13, 0, 0.66, 0.12, 0.88, cot ? darkIron : darkWood);
      for (const x of [-0.29, 0.29]) part('exposed bed side rail', x, 0.18, 0, 0.065, 0.13, 0.82, wood);
      part('padded mattress side', 0, 0.222, 0, 0.56, 0.13, 0.8, linen);
      drapedCloth(view, root, 'soft mattress cover', 0.58, 0.81, 0.3, 0, linen, 0.007);
      drapedCloth(
        view,
        root,
        'resident quilt with embroidered insignia',
        0.62,
        0.59,
        0.326,
        0.11,
        cloth,
        0.009,
      );
      sphere('stuffed sleeping pillow', 0, 0.32, -0.277, 0.49, 0.105, 0.2, linen);
      for (const x of [-0.215, 0.215]) {
        const seam = part('pillow sewn edge', x, 0.335, -0.276, 0.006, 0.005, 0.145, piping);
        seam.rotation.y = x < 0 ? -0.06 : 0.06;
      }
      for (const z of [-0.435, 0.435]) {
        part('bed end board', 0, z < 0 ? 0.26 : 0.18, z, 0.66, z < 0 ? 0.21 : 0.15, 0.06, wood);
        for (const x of [-0.307, 0.307]) {
          part('bed corner post', x, 0.2, z, 0.09, 0.38, 0.09, cot ? darkIron : darkWood);
          part('bedpost iron cap', x, 0.389, z, 0.105, 0.033, 0.105, iron);
          part('bedpost iron boot', x, 0.047, z, 0.101, 0.07, 0.101, iron);
          rivet(x, 0.404, z, brass, 0.017);
          rivet(x, 0.298, z + Math.sign(z) * 0.047, paleMetal, 0.02);
        }
      }
      if (bedding.model === 'rune-bed') {
        part('runesmith stone headboard', 0, 0.39, -0.427, 0.49, 0.29, 0.07, iron);
        part('headboard pediment', 0, 0.553, -0.427, 0.32, 0.065, 0.074, iron);
        for (const side of [-1, 1]) {
          const z = -0.427 + side * 0.04,
            rune = view.material('room artisan blue headboard rune', '#9bc6dc', false, 0.24);
          part('rune vertical inlay', -0.06, 0.425, z, 0.021, 0.18, 0.006, rune);
          part('rune short inlay', 0.053, 0.433, z, 0.019, 0.15, 0.006, rune);
          part('rune cross inlay', 0, 0.438, z, 0.17, 0.018, 0.006, rune).rotation.z = -0.29;
        }
      }
    }
    return;
  }

  if (model === 'dining-table' || model === 'small-dining-table') {
    const small = model === 'small-dining-table',
      length = small ? 0.79 : 2.68,
      tableDepth = small ? 0.54 : 0.77;
    for (let i = 0; i < 4; i++)
      part(
        'broad dining plank',
        0,
        0.575,
        ((i - 1.5) * tableDepth) / 4,
        length,
        0.13,
        tableDepth / 4 - 0.01,
        wood,
      );
    for (const x of [-length / 2 + 0.15, length / 2 - 0.15]) {
      part('heavy table trestle', x, 0.3, 0, 0.16, 0.52, 0.55, wood);
      part('trestle ground foot', x, 0.07, 0, 0.24, 0.13, 0.68, darkWood);
      part('tabletop iron strap', x, 0.644, 0, 0.083, 0.018, tableDepth + 0.015, iron);
      for (const z of [-tableDepth / 2 + 0.035, tableDepth / 2 - 0.035]) rivet(x, 0.659, z, paleMetal, 0.024);
    }
    part('trestle cross brace', 0, 0.2, 0, length - 0.3, 0.12, 0.14, darkWood);
    const linen = furnishingFinish(view, 'dining runner with knot border', '#d8bf90', 'cloth', 'runner');
    drapedCloth(
      view,
      root,
      'woven communal runner',
      length * 0.59,
      tableDepth * 0.74,
      0.659,
      0,
      linen,
      0.0025,
      0.004,
    );
    if (!small)
      for (const z of [-0.65, 0.65]) {
        for (const offset of [-0.066, 0.066])
          part('long bench plank', 0, 0.3, z + offset, length, 0.1, 0.126, wood);
        for (const x of [-length / 2 + 0.16, length / 2 - 0.16]) {
          part('stout bench support', x, 0.14, z, 0.14, 0.27, 0.24, darkWood);
          part('bench binding strap', x, 0.355, z, 0.065, 0.018, 0.28, iron);
          rivet(x, 0.369, z, paleMetal, 0.024);
        }
      }
    return;
  }

  if (model === 'stove') {
    const stone = furnishingFinish(view, 'cooking hearth stone', '#777063', 'stone'),
      lightStone = furnishingFinish(view, 'hearth arch blocks', '#928573', 'stone'),
      soot = furnishingFinish(view, 'sooty hearth recess', '#292a29', 'stone');
    part('hearth stone foot', 0, 0.067, 0, 0.91, 0.13, 0.91, stone);
    part('deep black firebox back', 0, 0.29, 0.22, 0.53, 0.38, 0.045, soot);
    part('deep black firebox floor', 0, 0.125, -0.085, 0.53, 0.045, 0.6, soot);
    for (const x of [-0.33, 0.33])
      for (let row = 0; row < 3; row++)
        part('oven stone pier', x, 0.18 + row * 0.16, 0, 0.2, 0.15, 0.8, row % 2 ? lightStone : stone);
    part('firebox lintel', 0, 0.477, -0.343, 0.54, 0.11, 0.19, lightStone);
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.29;
      part(
        'arched oven voussoir',
        Math.sin(a) * 0.267,
        0.265 + Math.cos(a) * 0.2,
        -0.414,
        0.105,
        0.133,
        0.09,
        lightStone,
      ).rotation.z = -a;
    }
    for (const x of [-0.12, 0.08]) {
      const log = cylinder('hearth charred log', x, 0.155, -0.25, 0.3, 0.06, darkWood);
      log.rotation.x = Math.PI / 2;
      log.rotation.z = x * 2;
    }
    const fire = view.material('room artisan oven embers', '#ef7d2c', false, 0.8),
      flame = view.material('room artisan oven flame', '#ffbb59', false, 0.9);
    for (let i = 0; i < 6; i++) {
      const x = -0.16 + i * 0.06,
        h = 0.1 + (i % 3) * 0.035;
      const glow = cylinder(
        'oven tongue of flame',
        x,
        0.19 + h / 2,
        -0.3 + Math.sin(i * 3) * 0.035,
        h,
        0.052,
        i % 2 ? fire : flame,
        0.006,
        6,
      );
      view.includeGlow(glow);
    }
    part('wide stone cooking slab', 0, 0.56, 0, 0.93, 0.12, 0.87, stone);
    for (const x of [-0.31, 0.31]) part('iron hearth strap', x, 0.627, -0.03, 0.046, 0.022, 0.73, iron);
    // Chimney occupies the rear of the same tile; the cauldron remains visible from the cooking aisle.
    for (let row = 0; row < 5; row++)
      part(
        'staggered chimney block',
        row % 2 ? 0.008 : -0.008,
        0.71 + row * 0.177,
        0.281,
        0.41,
        0.167,
        0.28,
        row % 2 ? stone : lightStone,
      );
    part('chimney crown', 0, 1.51, 0.281, 0.48, 0.087, 0.34, stone);
    part('chimney flue opening', 0, 1.558, 0.281, 0.3, 0.009, 0.18, soot);
    for (const side of [-1, 1]) diamond(0, 1.21, 0.281 + side * 0.145, 0.14, darkIron);
    const cauldron = MeshBuilder.CreateLathe(
      'open round iron cauldron',
      {
        shape: [
          [0, 0],
          [0.14, 0],
          [0.22, 0.04],
          [0.255, 0.14],
          [0.223, 0.27],
          [0.2, 0.27],
          [0.197, 0.24],
          [0.16, 0.045],
          [0, 0.045],
        ].map(([x, y]) => new Vector3(x, y, 0)),
        tessellation: 24,
      },
      view.scene,
    );
    cauldron.position.set(0, 0.62, -0.085);
    cauldron.material = darkIron;
    cauldron.parent = root;
    cauldron.isPickable = false;
    torus('cauldron thick rim', 0, 0.883, -0.085, 0.438, 0.038, iron);
    cylinder(
      'simmering stew',
      0,
      0.879,
      -0.085,
      0.012,
      0.417,
      furnishingFinish(view, 'rich amber stew', '#b88636', 'leather'),
    );
    for (let i = 0; i < 8; i++)
      sphere(
        'stew surface morsel',
        Math.sin(i * 2.4) * 0.13,
        0.891,
        -0.085 + Math.cos(i * 2.4) * 0.13,
        0.029,
        0.01,
        0.025,
        i % 3
          ? furnishingFinish(view, 'stew vegetables', '#d1ae61', 'cloth')
          : furnishingFinish(view, 'stew greens', '#7f8150', 'cloth'),
      );
    for (const x of [-0.28, 0.28]) {
      const handle = torus('cauldron ring handle', x, 0.78, -0.085, 0.135, 0.024, iron);
      handle.rotation.z = Math.PI / 2;
    }
    return;
  }

  if (model === 'assembly' || model === 'bench') {
    const length = model === 'bench' ? 0.83 : 1.82;
    for (let i = 0; i < 4; i++)
      part('thick workbench plank', 0, 0.59, (i - 1.5) * 0.178, length, 0.145, 0.166, wood);
    for (const x of [-length / 2 + 0.12, length / 2 - 0.12]) {
      for (const z of [-0.255, 0.255]) {
        part('bench square leg', x, 0.29, z, 0.155, 0.57, 0.15, darkWood);
        part('bench iron leg shoe', x, 0.072, z, 0.174, 0.14, 0.17, iron);
        part('bench iron corner plate', x, 0.635, z, 0.2, 0.07, 0.2, iron);
        rivet(x, 0.679, z, brass, 0.032);
      }
      part('bench underside trestle', x, 0.2, 0, 0.12, 0.11, 0.63, wood);
      part('worktop worn strap', x, 0.671, 0, 0.075, 0.025, 0.735, darkIron);
    }
    part('lower tool shelf', 0, 0.21, 0, length - 0.29, 0.08, 0.52, darkWood);
    if (model !== 'bench') {
      for (const side of [-1, 1]) {
        part('shallow workbench drawer', -0.22, 0.425, side * 0.301, 0.65, 0.18, 0.07, wood);
        part('drawer pull', -0.22, 0.427, side * 0.35, 0.16, 0.035, 0.035, iron);
      }
      const plan = furnishingFinish(view, 'workshop engraved plan', '#b3a186', 'paper', 'diagram');
      part('pinned mechanism diagram', 0.29, 0.678, 0, 0.52, 0.012, 0.44, plan).rotation.y = -0.05;
      for (const x of [0.08, 0.5]) for (const z of [-0.18, 0.18]) rivet(x, 0.688, z, iron, 0.018);
      part('single workbench hammer handle', -0.4, 0.696, -0.045, 0.4, 0.045, 0.055, wood).rotation.y = -0.35;
      part('workbench hammer head', -0.61, 0.723, -0.12, 0.11, 0.09, 0.22, iron).rotation.y = -0.35;
    }
    const vx = length / 2 - 0.13;
    part('workbench vise fixed jaw', vx, 0.743, 0.16, 0.15, 0.15, 0.27, iron);
    part('workbench vise sliding jaw', vx, 0.693, 0.39, 0.15, 0.19, 0.1, darkIron);
    const screw = cylinder('vise screw', vx, 0.669, 0.39, 0.23, 0.04, paleMetal);
    screw.rotation.x = Math.PI / 2;
    part('vise cross handle', vx, 0.665, 0.477, 0.17, 0.025, 0.025, iron);
    return;
  }

  if (model === 'anvil') {
    const stone = furnishingFinish(view, 'anvil basalt pedestal', '#505256', 'stone');
    part('anvil broad pedestal foot', 0, 0.07, 0, 0.6, 0.14, 0.56, stone);
    part('anvil tapered pedestal', 0, 0.19, 0, 0.49, 0.2, 0.46, stone);
    part('pedestal brass collar', 0, 0.302, 0, 0.51, 0.035, 0.48, brass);
    for (const side of [-1, 1]) diamond(0, 0.18, side * 0.242, 0.14);
    part('anvil broad forged foot', 0, 0.35, 0, 0.45, 0.1, 0.35, darkIron);
    cylinder('anvil flared waist', 0, 0.46, 0, 0.18, 0.36, iron, 0.235, 4).rotation.y = Math.PI / 4;
    part('anvil working face', -0.005, 0.59, 0, 0.49, 0.14, 0.28, iron);
    part('anvil polished upper face', -0.005, 0.668, 0, 0.48, 0.025, 0.27, paleMetal);
    const horn = cylinder('tapered anvil horn', -0.325, 0.61, 0, 0.32, 0.22, iron, 0.025, 8);
    horn.rotation.z = Math.PI / 2;
    part('square anvil heel', 0.32, 0.606, 0, 0.17, 0.1, 0.22, iron);
    part('anvil square hardy hole', 0.285, 0.661, 0, 0.046, 0.008, 0.046, darkIron);
    return;
  }

  if (model === 'long-bookcase' || model === 'tool-rack') {
    const shelf = model === 'long-bookcase',
      length = shelf ? 2.8 : 1.8,
      ends = shelf ? [-1.28, 0, 1.28] : [-0.8, 0.8];
    // Inset vertical timber panels leave the framing readable from both sides.
    const panels = shelf ? 12 : 8;
    for (let i = 0; i < panels; i++)
      part(
        'inset walnut back panel',
        -length / 2 + ((i + 0.5) * length) / panels,
        0.75,
        0.055,
        length / panels - 0.01,
        1.33,
        0.1,
        i % 3 ? darkWood : wood,
      );
    for (const y of [0.11, 1.405]) part('continuous cabinet rail', 0, y, 0, length, 0.095, 0.43, darkWood);
    for (const x of ends) {
      part('cabinet square pilaster', x, 0.77, 0, 0.16, 1.48, 0.43, wood);
      part('cabinet iron foot', x, 0.095, 0, 0.235, 0.18, 0.49, iron);
      part('cabinet heavy crown', x, 1.5, 0, 0.24, 0.115, 0.49, iron);
      part('cabinet crown bronze seam', x, 1.443, 0, 0.248, 0.022, 0.495, brass);
      for (const side of [-1, 1]) {
        for (const y of [0.23, 1.36]) rivet(x, y, side * 0.223, brass, 0.023);
        diamond(x, shelf ? 0.55 : 0.36, side * 0.223, 0.16, brass);
      }
    }
    if (shelf) {
      for (const y of [0.165, 0.58, 0.995, 1.41])
        part('solid long book shelf', 0, y, -0.085, length - 0.12, 0.055, 0.46, wood);
      const covers = ['#53686b', '#735345', '#6b7252', '#936f44', '#55555d'].map((c, i) =>
        furnishingFinish(view, `muted library binding ${i}`, c, 'leather'),
      );
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 18; i++) {
          if (i === 8 || i === 9 || (row === 1 && i === 4)) continue;
          const x = -1.16 + i * 0.137,
            h = 0.285 + ((i * 7 + row * 3) % 4) * 0.018,
            y = 0.205 + row * 0.415 + h / 2;
          const book = part(
            'leather bound archive volume',
            x,
            y,
            -0.132,
            0.102 + (i % 3) * 0.007,
            h,
            0.27,
            covers[(i + row * 2) % covers.length],
          );
          if (i === 4 && row === 2) book.rotation.z = -0.1;
          for (const offset of [-1, 1]) {
            part('book spine binding seam', x + offset * 0.039, y, -0.274, 0.006, h * 0.88, 0.008, darkWood);
            part('book raised binding band', x, y + offset * h * 0.29, -0.277, 0.09, 0.009, 0.01, brass);
          }
        }
      // Rear panels have their own restrained joinery; no mirrored books outside the shelf.
      for (const y of [0.57, 1.0])
        part('bookcase rear batten', 0, y, 0.126, length - 0.16, 0.055, 0.06, wood);
      for (const x of [-1.28, 1.28]) lantern(x, 1.2, -0.29);
    } else {
      for (const side of [-1, 1]) {
        part('forged hanging rail', 0, 1.27, side * 0.123, 1.45, 0.045, 0.075, iron);
        for (let i = 0; i < 4; i++) {
          const x = -0.52 + i * 0.34,
            z = side * 0.16;
          rivet(x, 1.27, side * 0.166, brass, 0.023);
          if (i < 2) {
            part('hanging hammer grip', x, 0.79, z, 0.048, 0.61, 0.048, wood);
            part(
              'hanging forged hammer head',
              x,
              1.085,
              side * 0.18,
              i ? 0.21 : 0.25,
              i ? 0.105 : 0.14,
              0.13,
              iron,
            );
            for (const y of [0.5, 0.97]) part('hammer ferrule', x, y, z, 0.055, 0.035, 0.056, paleMetal);
          } else {
            for (const sign of [-1, 1]) {
              part(
                'hanging tongs handle',
                x + sign * 0.035,
                0.72,
                z,
                0.025,
                0.48,
                0.026,
                darkIron,
              ).rotation.z = sign * 0.16;
              part('curved tong jaw', x + sign * 0.028, 1.054, z, 0.025, 0.155, 0.033, iron).rotation.z =
                -sign * 0.39;
            }
            ringFace('tongs pivot', x, 0.94, z + side * 0.02, 0.075, 0.018, iron);
          }
        }
      }
      for (const x of [-0.8, 0.8]) lantern(x, 1.15, -0.23);
    }
    return;
  }

  if (model === 'lectern') {
    part('lectern stone foot', 0, 0.064, 0, 0.57, 0.125, 0.54, iron);
    part('lectern lower bronze rim', 0, 0.139, 0, 0.53, 0.035, 0.49, brass);
    part('lectern paneled pedestal', 0, 0.4, 0, 0.39, 0.51, 0.37, darkWood);
    for (const x of [-0.177, 0.177])
      for (const z of [-0.17, 0.17]) part('lectern corner stile', x, 0.415, z, 0.055, 0.56, 0.055, wood);
    for (const side of [-1, 1]) diamond(0, 0.42, side * 0.195, 0.21, brass);
    const top = new TransformNode('angled reading desk', view.scene);
    top.parent = root;
    top.position.y = 0.72;
    top.rotation.x = -0.28;
    const desk = part('sloped lectern board', 0, 0, 0, 0.69, 0.075, 0.55, wood);
    desk.parent = top;
    for (const x of [-0.302, 0.302]) {
      const strap = part('lectern desk edge', x, 0.05, 0, 0.037, 0.025, 0.52, brass);
      strap.parent = top;
    }
    const rest = part('lectern book rest', 0, 0.061, -0.24, 0.64, 0.035, 0.035, brass);
    rest.parent = top;
    const cover = part('open tome leather cover', 0, 0.051, 0, 0.52, 0.027, 0.42, darkWood);
    cover.parent = top;
    const pages = furnishingFinish(view, 'illuminated manuscript pages', '#d8c49a', 'paper', 'page');
    drapedCloth(view, top, 'curved open manuscript', 0.485, 0.38, 0.084, 0, pages, 0.003, 0.007);
    for (const x of [-0.24, 0.24]) part('reading lamp arm', x, 0.89, 0.215, 0.027, 0.2, 0.027, darkIron);
    part('reading lamp brass housing', 0, 0.992, 0.215, 0.52, 0.067, 0.065, brass);
    const glow = part(
      'reading lamp warm glass',
      0,
      0.978,
      0.177,
      0.42,
      0.037,
      0.02,
      view.material('room artisan reading lamp glass', '#ffd393', false, 0.7),
    );
    view.includeGlow(glow);
    return;
  }

  const straw = furnishingFinish(view, 'bound training straw', '#b79a5d', 'straw'),
    rope = furnishingFinish(view, 'hemp training cord', '#8d7851', 'cloth'),
    leather = furnishingFinish(view, 'sand training leather', '#b49b72', 'leather');
  for (const angle of [0, Math.PI / 2])
    part('target heavy cross foot', 0, 0.072, 0, 0.56, 0.13, 0.15, darkIron).rotation.y = angle;
  part('target socket', 0, 0.165, 0, 0.23, 0.18, 0.23, iron);
  cylinder('target timber upright', 0, 0.5, 0, 0.92, 0.145, darkWood, 0.145, 8);
  for (const side of [-1, 1]) {
    rivet(0, 0.173, side * 0.12, brass, 0.025);
    for (const x of [-0.215, 0.215]) rivet(x, 0.142, 0, paleMetal, 0.021);
  }
  if (model === 'striking-pillar') {
    cylinder('leather padded striking pillar', 0, 0.79, 0, 1.17, 0.36, leather, 0.34, 20);
    for (const y of [0.25, 0.78, 1.34]) {
      cylinder('striking pillar iron binding', 0, y, 0, 0.064, 0.38, darkIron, 0.38, 20);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        rivet(Math.sin(a) * 0.193, y, Math.cos(a) * 0.193, brass, 0.02);
      }
    }
    for (const y of [0.48, 1.02]) torus('stitched padding seam', 0, y, 0, 0.35, 0.008, rope);
    cylinder('padded pillar top cap', 0, 1.374, 0, 0.015, 0.33, iron);
    for (let i = 0; i < 12; i++)
      part('pillar vertical stitched seam', 0.171, 0.36 + i * 0.075, -0.022, 0.007, 0.027, 0.006, rope);
  } else if (model === 'target-post') {
    const red = furnishingFinish(view, 'faded target red', '#8b4739', 'wood');
    const target = cylinder('upright oak target', 0, 1.04, 0, 0.115, 0.66, darkWood);
    target.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) {
      for (const [d, offset, mat] of [
        [0.59, 0.063, straw],
        [0.44, 0.068, red],
        [0.3, 0.073, straw],
        [0.14, 0.078, red],
      ] as const) {
        const disc = cylinder('painted upright bullseye', 0, 1.04, side * offset, 0.009, d, mat, d, 32);
        disc.rotation.x = Math.PI / 2;
      }
      for (const x of [-0.16, 0, 0.16])
        part(
          'target plank joint',
          x,
          1.04,
          side * 0.085,
          0.007,
          Math.sqrt(0.3 * 0.3 - x * x) * 2,
          0.003,
          darkWood,
        );
      for (const x of [-0.075, 0.055])
        part('old target strike', x, 1.02 + x, side * 0.089, 0.012, 0.05, 0.005, darkWood).rotation.z = 0.6;
      ringFace('target protective rim', 0, 1.04, side * 0.061, 0.635, 0.025, iron);
    }
  } else if (model === 'straw-dummy') {
    cylinder('bound straw dummy torso', 0, 0.78, 0, 0.49, 0.36, straw, 0.32, 16);
    const arms = cylinder('straw dummy outstretched arms', 0, 0.9, 0, 0.75, 0.145, straw);
    arms.rotation.z = Math.PI / 2;
    cylinder('straw dummy neck', 0, 1.066, 0, 0.1, 0.13, straw);
    cylinder('straw dummy bundled head', 0, 1.19, 0, 0.245, 0.235, straw, 0.207, 16);
    for (const y of [0.57, 0.93, 1.087])
      for (const offset of [-0.012, 0.012])
        torus('wrapped hemp binding', 0, y + offset, 0, y > 1 ? 0.208 : 0.344, 0.019, rope);
    for (const x of [-0.31, -0.23, 0.23, 0.31]) {
      const binding = torus('straw arm binding', x, 0.9, 0, 0.151, 0.016, rope);
      binding.rotation.z = Math.PI / 2;
    }
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      part(
        'separate straw stalk',
        Math.sin(a) * 0.153,
        0.78,
        Math.cos(a) * 0.153,
        0.013,
        0.52 + (i % 4) * 0.009,
        0.012,
        i % 3 ? straw : rope,
      ).rotation.z = Math.sin(a) * 0.047;
      part(
        'head straw end',
        Math.sin(a) * 0.081,
        1.324 + (i % 3) * 0.007,
        Math.cos(a) * 0.081,
        0.016,
        0.047,
        0.016,
        straw,
      );
    }
  } else {
    part('armored practice timber torso', 0, 0.81, 0, 0.37, 0.46, 0.2, darkWood);
    part('armored practice shoulders', 0, 0.977, 0, 0.62, 0.16, 0.22, wood);
    for (const x of [-0.257, 0.257]) {
      part('dummy iron shoulder plate', x, 0.944, 0, 0.115, 0.235, 0.27, iron);
      for (const z of [-0.141, 0.141]) for (const y of [0.865, 1.015]) rivet(x, y, z, brass, 0.024);
    }
    cylinder('helmet neck guard', 0, 1.086, 0, 0.095, 0.23, darkIron);
    cylinder('practice steel helmet', 0, 1.235, 0, 0.25, 0.27, iron, 0.238, 16);
    sphere('rounded practice helmet crown', 0, 1.361, 0, 0.245, 0.145, 0.245, iron);
    for (const side of [-1, 1]) {
      part('helmet sight slit', 0, 1.26, side * 0.133, 0.163, 0.032, 0.008, darkIron);
      part('helmet nasal guard', 0, 1.203, side * 0.142, 0.027, 0.124, 0.022, paleMetal);
      for (const x of [-0.09, 0.09]) rivet(x, 1.17, side * 0.122, brass, 0.017);
    }
    torus('helmet crown band', 0, 1.33, 0, 0.249, 0.019, paleMetal);
    cylinder('helmet finial', 0, 1.46, 0, 0.11, 0.075, iron, 0.003, 6);
    for (const side of [-1, 1]) {
      const shield = cylinder(
        'round training shield',
        0,
        0.865,
        side * 0.225,
        0.07,
        0.54,
        darkWood,
        0.54,
        20,
      );
      shield.rotation.x = Math.PI / 2;
      ringFace('shield worn iron rim', 0, 0.865, side * 0.267, 0.517, 0.035, paleMetal);
      for (const x of [-0.17, -0.085, 0, 0.085, 0.17])
        part(
          'shield plank seam',
          x,
          0.865,
          side * 0.269,
          0.007,
          Math.sqrt(0.245 * 0.245 - x * x) * 2,
          0.008,
          darkIron,
        );
      sphere('raised shield bronze boss', 0, 0.865, side * 0.291, 0.145, 0.145, 0.092, brass);
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        rivet(Math.sin(a) * 0.251, 0.865 + Math.cos(a) * 0.251, side * 0.279, iron, 0.018);
      }
    }
  }
}
