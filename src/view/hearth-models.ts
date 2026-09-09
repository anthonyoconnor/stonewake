import { Color3, TransformNode, Vector3, type StandardMaterial } from '@babylonjs/core';
import type { GameScene } from './scene';
import { hearthCrystal, mergePropGroup, propParts, propSurface } from './arcana-prop-parts';

export interface StoneHearthPose {
  elapsed: number;
  integrity: number;
  reduced: boolean;
}
export interface OnwardHearthPose {
  elapsed: number;
  progress: number;
  ready: boolean;
  reduced: boolean;
}
export interface HearthModel {
  root: TransformNode;
  crystals: StandardMaterial[];
  runes: StandardMaterial[];
  cracks: TransformNode;
}

function createHearth(v: GameScene, onward: boolean, parent?: TransformNode): HearthModel {
  const root = new TransformNode(onward ? 'refined onward hearthstone' : 'refined stone hearth', v.scene);
  if (parent) root.parent = parent;
  const p = propParts(v),
    scale = onward ? 0.365 : 1,
    radius = onward ? 0.475 : 1.35;
  const stone = propSurface(v, 'hearth slate', '#40494f', 'stone'),
    paleStone = propSurface(v, 'hearth worn edge', '#697076', 'stone'),
    dark = propSurface(v, 'hearth joints', '#202b34', 'stone'),
    brass = propSurface(v, 'hearth worn brass', '#ba8c45', 'bronze'),
    crystalBase = propSurface(v, 'sapphire crystal', '#2796eb', 'crystal');
  const model: HearthModel = {
    root,
    crystals: [],
    runes: [],
    cracks: new TransformNode('hearth stone fractures', v.scene),
  };
  model.cracks.parent = root;
  const clone = (base: StandardMaterial, suffix: string) => {
    const m = base.clone(`${base.name} ${root.uniqueId} ${suffix}`)!;
    // DynamicTexture.clone does not copy the painted canvas. Reuse the immutable surface;
    // only diffuse/emissive material values vary per Hearth instance.
    for (const texture of new Set([m.diffuseTexture, m.emissiveTexture]))
      if (texture && texture !== base.diffuseTexture && texture !== base.emissiveTexture) texture.dispose();
    m.diffuseTexture = base.diffuseTexture;
    m.emissiveTexture = base.emissiveTexture;
    root.onDisposeObservable.addOnce(() => m.dispose(false, false));
    return m;
  };
  const blue = clone(crystalBase, 'crystal blue'),
    pale = clone(crystalBase, 'crystal cyan');
  model.crystals.push(blue, pale);
  pale.diffuseColor = Color3.FromHexString('#59c7f5');
  const tiers = onward
    ? [
        { r: radius, y: 0.065, h: 0.13 },
        { r: radius * 0.94, y: 0.15, h: 0.055 },
      ]
    : [
        { r: radius, y: 0.06, h: 0.12 },
        { r: radius * 0.97, y: 0.14, h: 0.055 },
      ];
  for (const [i, t] of tiers.entries())
    p.cylinder(root, 'octagonal carved hearth apron', 0, t.y, 0, t.r * 2, t.h, i ? stone : dark, 16);
  const count = onward ? 8 : 12;
  // Joined apron sectors provide a quiet layered stone edge without a tall cake-like pedestal.
  for (let i = 0; i < count; i++) {
    const a = (i * 2 * Math.PI) / count;
    const seam = p.box(
      root,
      'radial apron stone joint',
      Math.sin(a) * radius * 0.82,
      onward ? 0.181 : 0.171,
      Math.cos(a) * radius * 0.82,
      0.012,
      0.009,
      radius * 0.32,
      dark,
    );
    seam.rotation.y = a;
    const edge = p.box(
      root,
      'worn apron sector edge',
      Math.sin(a) * radius * 0.955,
      0.12,
      Math.cos(a) * radius * 0.955,
      radius * 0.25,
      0.014,
      0.018,
      paleStone,
    );
    edge.rotation.y = a;
  }
  for (const r of [radius * 0.78, radius * 0.9])
    p.torus(
      root,
      'incised bronze outer circuit',
      0,
      onward ? 0.186 : 0.177,
      0,
      r * 2,
      onward ? 0.008 : 0.014,
      brass,
      64,
    );
  const cradleRadius = onward ? 0.31 : 0.69,
    cradleY = onward ? 0.255 : 0.32,
    cradleHeight = onward ? 0.155 : 0.29;
  p.cylinder(
    root,
    'deep mineral socket',
    0,
    cradleY - 0.016,
    0,
    cradleRadius * 1.85,
    cradleHeight * 0.9,
    dark,
    12,
  );
  for (let row = 0; row < (onward ? 2 : 1); row++)
    for (let i = 0; i < count; i++) {
      const a = ((i + (row ? 0.5 : 0)) * 2 * Math.PI) / count;
      const block = p.box(
        root,
        'individually cut cradle stone',
        Math.sin(a) * cradleRadius,
        cradleY + (row ? -0.063 : 0),
        Math.cos(a) * cradleRadius,
        onward ? 0.2 : 0.365,
        onward ? 0.079 : cradleHeight,
        onward ? 0.13 : 0.3,
        i % 3 === 0 ? paleStone : stone,
        onward ? 0.014 : 0.031,
      );
      block.rotation.y = a;
    }
  p.torus(
    root,
    'protective bronze cradle binding',
    0,
    onward ? 0.294 : 0.405,
    0,
    cradleRadius * 2.27,
    onward ? 0.012 : 0.025,
    brass,
    48,
  );
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const cap = p.box(
      root,
      'bronze cradle clamp',
      Math.sin(a) * cradleRadius,
      cradleY + 0.006,
      Math.cos(a) * cradleRadius,
      onward ? 0.093 : 0.13,
      cradleHeight + 0.055,
      onward ? 0.17 : 0.34,
      brass,
    );
    cap.rotation.y = a;
    const lozenge = p.box(
      root,
      'clamp inset diamond',
      Math.sin(a) * (cradleRadius + (onward ? 0.09 : 0.18)),
      cradleY + 0.025,
      Math.cos(a) * (cradleRadius + (onward ? 0.09 : 0.18)),
      onward ? 0.024 : 0.048,
      onward ? 0.046 : 0.085,
      0.008,
      dark,
    );
    lozenge.rotation.y = a;
    lozenge.rotation.z = Math.PI / 4;
  }
  const runeBase = v.material('arcana hearth rune source', '#63d9ff', false, 0.5);
  for (let i = 0; i < count; i++) {
    const a = ((i + 0.5) * 2 * Math.PI) / count,
      mat = clone(runeBase, `rune ${i}`);
    model.runes.push(mat);
    const glyph = new TransformNode('inlaid dwarven circuit glyph', v.scene);
    glyph.parent = root;
    glyph.position.set(Math.sin(a) * radius * 0.835, onward ? 0.193 : 0.185, Math.cos(a) * radius * 0.835);
    glyph.rotation.y = a;
    const size = onward ? 0.051 : 0.115;
    // Open angular diamonds with distinct inner strokes read as carvings rather than flat squares.
    const corners = [
      new Vector3(0, 0, -size),
      new Vector3(size * 0.57, 0, 0),
      new Vector3(0, 0, size),
      new Vector3(-size * 0.57, 0, 0),
    ];
    for (let j = 0; j < 4; j++)
      p.line(glyph, 'incised rune edge', corners[j], corners[(j + 1) % 4], onward ? 0.006 : 0.011, mat);
    if (i % 3 === 0)
      p.line(
        glyph,
        'rune spine',
        new Vector3(0, 0, -size * 0.62),
        new Vector3(0, 0, size * 0.62),
        onward ? 0.006 : 0.011,
        mat,
      );
    else
      p.line(
        glyph,
        'rune cross-stroke',
        new Vector3(-size * 0.33, 0, i % 2 ? 0 : -size * 0.4),
        new Vector3(size * 0.33, 0, i % 2 ? 0 : size * 0.4),
        onward ? 0.006 : 0.011,
        mat,
      );
    for (const mesh of glyph.getChildMeshes()) v.includeGlow(mesh as import('@babylonjs/core').Mesh);
    mergePropGroup(v, glyph);
  }
  const floor = onward ? 0.275 : 0.34;
  const central = hearthCrystal(
    v,
    root,
    'central sapphire hearthstone',
    onward ? -0.025 : 0,
    floor,
    onward ? 0.01 : 0,
    onward ? 0.89 : 1.63,
    onward ? 0.137 : 0.275,
    blue,
    1,
  );
  central.rotation.z = onward ? -0.025 : -0.035;
  const satellites = onward
    ? [
        { x: -0.17, z: 0.1, h: 0.42, r: 0.084, a: -0.18 },
        { x: 0.17, z: 0.08, h: 0.49, r: 0.078, a: 0.15 },
        { x: 0.1, z: -0.15, h: 0.32, r: 0.068, a: 0.12 },
      ]
    : [
        { x: -0.37, z: 0.17, h: 0.88, r: 0.155, a: -0.18 },
        { x: 0.31, z: 0.23, h: 0.74, r: 0.15, a: 0.17 },
        { x: 0.18, z: -0.33, h: 1.01, r: 0.15, a: 0.1 },
        { x: -0.28, z: -0.28, h: 0.66, r: 0.13, a: -0.21 },
        { x: -0.05, z: 0.43, h: 0.46, r: 0.11, a: -0.06 },
        { x: 0.45, z: -0.03, h: 0.55, r: 0.1, a: 0.28 },
      ];
  for (const [i, s] of satellites.entries()) {
    const crystal = hearthCrystal(
      v,
      root,
      'subordinate sapphire crystal',
      s.x,
      floor - 0.035,
      s.z,
      s.h,
      s.r,
      i % 3 === 0 ? pale : blue,
      i + 2,
    );
    crystal.rotation.z = s.a;
    crystal.rotation.x = s.a * 0.6;
  }
  for (let i = 0; i < (onward ? 13 : 22); i++) {
    const a = i * 2.3999,
      r = (onward ? 0.11 : 0.3) + (i % 4) * (onward ? 0.022 : 0.055);
    const chip = hearthCrystal(
      v,
      root,
      'small grounded mineral fragment',
      Math.cos(a) * r,
      floor - 0.025,
      Math.sin(a) * r,
      onward ? 0.08 + (i % 3) * 0.026 : 0.11 + (i % 3) * 0.045,
      onward ? 0.021 : 0.042,
      i % 5 === 0 ? blue : dark,
      i % 5,
    );
    chip.rotation.x = Math.sin(a) * 0.35;
    chip.rotation.z = Math.cos(a) * 0.35;
  }
  if (onward) {
    // An architectural compass marks the relay, while the base remains a single reserved tile.
    for (const side of [-1, 1]) {
      p.line(
        root,
        'relay split compass stem',
        new Vector3(side * 0.011, 0.195, 0.338),
        new Vector3(side * 0.011, 0.195, 0.455),
        0.012,
        brass,
      );
      p.line(
        root,
        'relay compass arrow',
        new Vector3(side * 0.011, 0.195, 0.455),
        new Vector3(side * 0.056, 0.195, 0.39),
        0.012,
        brass,
      );
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.15;
    p.line(
      model.cracks,
      'dark fracture in apron',
      new Vector3(Math.sin(a) * radius * 0.56, 0.2, Math.cos(a) * radius * 0.56),
      new Vector3(Math.sin(a + 0.03) * radius * 0.95, 0.185, Math.cos(a + 0.03) * radius * 0.95),
      0.019 * scale,
      dark,
    );
  }
  mergePropGroup(v, model.cracks);
  mergePropGroup(v, root);
  model.cracks.setEnabled(false);
  return model;
}

export function createStoneHearthModel(v: GameScene, parent?: TransformNode) {
  const m = createHearth(v, false, parent);
  updateStoneHearthModel(m, { elapsed: v.world.elapsed, integrity: 1, reduced: v.effects.reduced });
  return m;
}
export function updateStoneHearthModel(m: HearthModel, p: StoneHearthPose) {
  const health = Math.max(0, Math.min(1, p.integrity)),
    pulse = p.reduced ? 1 : 1 + Math.sin(p.elapsed * 1.8) * 0.045;
  for (const [i, mat] of m.crystals.entries()) {
    mat.diffuseColor = Color3.FromHexString(i ? '#52bdeb' : '#278fd5').scale(0.24 + 0.76 * health);
    mat.emissiveColor = Color3.FromHexString(i ? '#1a8dba' : '#0862a5').scale(0.75 * health * pulse);
  }
  for (const mat of m.runes) {
    mat.diffuseColor = Color3.FromHexString('#bc9857');
    mat.emissiveColor = Color3.FromHexString('#bd9143').scale(0.23 * pulse * health);
  }
  m.cracks.setEnabled(health < 0.45);
}
export function createOnwardHearthModel(v: GameScene, parent?: TransformNode) {
  const m = createHearth(v, true, parent);
  updateOnwardHearthModel(m, {
    elapsed: v.world.elapsed,
    progress: 0,
    ready: false,
    reduced: v.effects.reduced,
  });
  return m;
}
export function updateOnwardHearthModel(m: HearthModel, p: OnwardHearthPose) {
  const progress = Math.max(0, Math.min(1, p.progress)),
    power = p.ready ? 1 : progress * 0.8,
    pulse = p.reduced ? 1 : 1 + Math.sin(p.elapsed * 2) * 0.04;
  for (const [i, mat] of m.crystals.entries()) {
    mat.diffuseColor = Color3.Lerp(
      Color3.FromHexString('#4b6178'),
      Color3.FromHexString(i ? '#54b6ed' : '#258ce4'),
      Math.min(1, power * 1.9),
    );
    mat.emissiveColor = Color3.FromHexString(i ? '#178bb7' : '#0668b0').scale(power * 0.82 * pulse);
  }
  for (const [i, mat] of m.runes.entries()) {
    const lit = p.ready ? 1 : Math.max(0, Math.min(1, progress * m.runes.length - i));
    mat.diffuseColor = Color3.Lerp(Color3.FromHexString('#32424c'), Color3.FromHexString('#6dd2ec'), lit);
    mat.emissiveColor = Color3.FromHexString('#35c7ed').scale(lit * 0.44 * pulse);
  }
}
