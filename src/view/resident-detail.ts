import {
  Color3,
  DynamicTexture,
  MeshBuilder,
  TransformNode,
  Vector3,
  type StandardMaterial,
} from '@babylonjs/core';
import type { GameScene } from './scene';

/** Small shared surfaces and sculpted costume pieces based on the four current dwarf sheets. */
export function residentSurface(v: GameScene, name: string, color: string, metal = false) {
  const key = `dwarf ${name}`,
    existing = v.materials.get(key);
  if (existing) return existing;
  const material = v.material(key, color);
  material.specularColor = new Color3(metal ? 0.16 : 0.025, metal ? 0.17 : 0.025, metal ? 0.18 : 0.025);
  material.specularPower = metal ? 28 : 8;
  const texture = new DynamicTexture(`${key} grain`, { width: 64, height: 64 }, v.scene, false);
  const c = texture.getContext();
  c.fillStyle = '#dedbd5';
  c.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 2)
    for (let x = 0; x < 64; x += 2) {
      const n = (x * 73 + y * 29 + x * y * 7) % 41;
      c.fillStyle = `rgba(${metal ? 80 : 100},${metal ? 86 : 90},${metal ? 90 : 75},${n / 250})`;
      c.fillRect(x, y, metal ? 1 : 2, 1);
    }
  texture.update();
  material.diffuseTexture = texture;
  return material;
}

export function costumeDetails(
  v: GameScene,
  root: TransformNode,
  role: string,
  legs: TransformNode[],
  arms: TransformNode[],
  shield?: TransformNode,
  book?: TransformNode,
) {
  const steel = residentSurface(v, 'steel', '#56636a', true),
    brass = residentSurface(v, 'brass', '#a48a55', true),
    leather = residentSurface(v, 'leather', '#513c2c'),
    ivory = residentSurface(v, 'ivory', '#c4bb9d');
  const hair = residentSurface(
    v,
    `${role} hair`,
    role === 'warrior' ? '#302e2c' : role === 'runesmith' ? '#b9b7a8' : '#694026',
  );
  const part = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: StandardMaterial,
    parent = root,
  ) => {
    const m = v.box(name, x, y, z, w, h, d, mat, parent);
    m.isPickable = false;
    return m;
  };
  const line = (name: string, points: Vector3[], radius: number, mat: StandardMaterial, parent = root) => {
    const m = MeshBuilder.CreateTube(name, { path: points, radius, tessellation: 5 }, v.scene);
    m.material = mat;
    m.parent = parent;
    m.isPickable = false;
    return m;
  };
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    part('stitched boot sole', 0, -0.245, 0.055, 0.25, 0.045, 0.35, leather, leg);
    part('forged toe guard', 0, -0.15, 0.167, 0.23, 0.07, 0.08, steel, leg);
    for (const y of [-0.07, 0.01]) part('boot leather strap', 0, y, 0.132, 0.22, 0.024, 0.02, leather, leg);
    part('boot side buckle', i === 0 ? -0.11 : 0.11, -0.06, 0.085, 0.025, 0.065, 0.06, brass, leg);
  }
  for (const x of [-0.155, 0.155]) {
    const brow = line(
      'sculpted brow',
      [new Vector3(x * 0.3, 0.778, 0.159), new Vector3(x * 0.68, 0.792, 0.171), new Vector3(x, 0.765, 0.146)],
      0.022,
      hair,
    );
    brow.rotation.z = role === 'engineer' ? -Math.sign(x) * 0.1 : 0;
    for (let i = 0; i < 3; i++)
      part('strap fastener', x, 0.39 + i * 0.075, 0.201, 0.029, 0.029, 0.015, brass);
  }
  if (role === 'engineer') {
    for (const x of [-0.16, 0.16]) {
      line(
        'apron stitched edge',
        [new Vector3(x, 0.23, 0.213), new Vector3(x * 1.03, 0.43, 0.216), new Vector3(x * 0.82, 0.55, 0.192)],
        0.009,
        brass,
      );
      line(
        'back pack strap',
        [new Vector3(x, 0.56, -0.18), new Vector3(x, 0.45, -0.33), new Vector3(x, 0.3, -0.23)],
        0.026,
        leather,
      );
    }
    part('apron pocket', 0, 0.31, 0.221, 0.22, 0.105, 0.025, leather);
    part('pack mechanism plate', 0, 0.45, -0.329, 0.22, 0.2, 0.024, steel);
    const gear = MeshBuilder.CreateTorus(
      'mechanism gear',
      { diameter: 0.12, thickness: 0.025, tessellation: 8 },
      v.scene,
    );
    gear.rotation.x = Math.PI / 2;
    gear.position.set(0, 0.45, -0.346);
    gear.material = brass;
    gear.parent = root;
    gear.isPickable = false;
    for (const x of [-0.1, 0.1])
      for (const y of [0.37, 0.53]) part('pack rivet', x, y, -0.35, 0.025, 0.025, 0.014, brass);
    const spanner = part('belt spanner', 0.265, 0.32, 0.13, 0.037, 0.25, 0.035, steel);
    spanner.rotation.z = -0.24;
    for (const x of [0.245, 0.285]) part('spanner jaw', x, 0.46, 0.13, 0.024, 0.05, 0.037, steel);
  } else {
    for (const x of [-0.095, 0, 0.095]) {
      for (let i = 0; i < 3; i++)
        line(
          'beard carved strand',
          [
            new Vector3(x + (i - 1) * 0.025, 0.67, 0.225),
            new Vector3(x + (i - 1) * 0.035, 0.56, 0.279),
            new Vector3(x + (i - 1) * 0.023, 0.4 + Math.abs(x) * 0.3, 0.251),
          ],
          0.016,
          hair,
        );
    }
    for (const side of [-1, 1])
      line(
        'swept moustache',
        [
          new Vector3(side * 0.02, 0.671, 0.219),
          new Vector3(side * 0.095, 0.659, 0.249),
          new Vector3(side * 0.17, 0.625, 0.22),
        ],
        0.035,
        hair,
      );
    if (role !== 'runesmith') {
      for (const x of [-0.16, 0.16])
        line(
          'helmet arched band',
          [
            new Vector3(x, 0.795, -0.08),
            new Vector3(x * 0.75, 0.917, -0.03),
            new Vector3(x * 0.55, 0.923, 0.07),
            new Vector3(x, 0.8, 0.16),
          ],
          0.013,
          steel,
        );
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        part(
          'helmet rivet',
          Math.cos(angle) * 0.205,
          0.805,
          Math.sin(angle) * 0.18,
          0.025,
          0.027,
          0.025,
          brass,
        );
      }
    }
    if (role === 'miner') {
      for (const side of [-1, 1])
        line(
          'crossed back harness',
          [
            new Vector3(side * 0.2, 0.57, -0.15),
            new Vector3(0, 0.44, -0.217),
            new Vector3(-side * 0.17, 0.31, -0.18),
          ],
          0.032,
          leather,
        );
      part('harness center clasp', 0, 0.44, -0.242, 0.115, 0.11, 0.025, steel).rotation.z = Math.PI / 4;
      part('lantern crossbar', 0, 0.83, 0.272, 0.103, 0.018, 0.012, steel);
      part('lantern grille', 0, 0.83, 0.274, 0.018, 0.086, 0.012, steel);
    }
    if (role === 'warrior') {
      for (const arm of arms)
        for (let i = 0; i < 3; i++) {
          const plate = part(
            'overlapping shoulder lames',
            0,
            -0.035 - i * 0.045,
            0.085,
            0.275 - i * 0.018,
            0.06,
            0.235,
            steel,
            arm,
          );
          plate.rotation.z = (arm === arms[0] ? -1 : 1) * 0.12;
          part(
            'shoulder edge rivet',
            arm === arms[0] ? -0.11 : 0.11,
            -0.04 - i * 0.045,
            0.208,
            0.025,
            0.025,
            0.02,
            brass,
            arm,
          );
        }
      if (shield)
        for (const x of [-0.11, 0, 0.11]) {
          part('shield board seam', x, 0, 0.04, 0.014, 0.47, 0.015, steel, shield);
          for (const y of [-0.22, 0.22])
            part('shield band rivet', x, y, 0.066, 0.025, 0.025, 0.018, brass, shield);
        }
    }
    if (role === 'runesmith') {
      for (const side of [-1, 1])
        for (let i = 0; i < 4; i++) {
          const knot = part(
            'mantle knotwork',
            side * 0.243,
            0.47 + i * 0.045,
            0.202,
            0.037,
            0.037,
            0.013,
            brass,
          );
          knot.rotation.z = Math.PI / 4;
        }
      for (let i = 0; i < 7; i++)
        part('robe hem embroidery', -0.22 + i * 0.073, 0.15, 0.244, 0.027, 0.032, 0.012, brass).rotation.z =
          Math.PI / 4;
      if (book) {
        for (const x of [-0.22, 0.22])
          for (const z of [-0.14, 0.14])
            part('book brass corner', x, 0.061, z, 0.065, 0.018, 0.05, brass, book);
        part('book spine', 0, 0.044, 0, 0.023, 0.04, 0.34, leather, book);
        for (const x of [-0.12, 0.12])
          part('page rune', x, 0.072, 0, 0.09, 0.01, 0.018, ivory, book).rotation.y = 0.7;
      }
    }
  }
}
