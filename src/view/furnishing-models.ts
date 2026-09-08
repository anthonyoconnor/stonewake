import { MeshBuilder, TransformNode, type StandardMaterial } from '@babylonjs/core';
import type { GameScene } from './scene';
import type { Furnishing } from '../game/types';
import { dressedBlock } from './environment';

export interface FurnishingDisplay {
  storedGold?: number;
  output?: string;
  outputCount?: number;
  eating?: boolean;
}

export function drawFurnishingModel(
  view: GameScene,
  f: Furnishing,
  parent: TransformNode,
  display: FurnishingDisplay = {},
) {
  const model = f.model ?? f.kind;
  const wide = f.cells.some((p) => p.x !== f.x),
    deep = f.cells.some((p) => p.z !== f.z);
  view.shadow(f.x + (wide ? 0.5 : 0), f.z + (deep ? 0.5 : 0), wide ? 2.2 : 1.2, deep ? 2.2 : 1.2, parent);
  const wood = view.material('chest wood', '#60442e', true),
    metal = view.material('chest iron', '#a28a5f');
  if (model === 'bed') {
    const bed = new TransformNode(f.id, view.scene);
    bed.parent = parent;
    bed.position.set(f.x + (f.rotation ? 0.5 : 0), 0, f.z + (f.rotation ? 0 : 0.5));
    bed.rotation.y = f.rotation ? Math.PI / 2 : 0;
    const part = (
      n: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      m: StandardMaterial,
    ) => {
      dressedBlock(
        view,
        n,
        x,
        y,
        z,
        w,
        h,
        d,
        m,
        bed,
        Math.min(0.018, h * 0.15, w * 0.15, d * 0.15),
      ).isPickable = false;
    };
    part('bed frame', 0, 0.19, 0, 0.75, 0.22, 1.75, wood);
    part('blanket', 0, 0.34, 0.17, 0.68, 0.14, 1.25, view.material('blanket', '#6c8278'));
    part('pillow', 0, 0.37, -0.6, 0.62, 0.14, 0.32, view.material('linen', '#ddccaa'));
    part('headboard', 0, 0.46, -0.83, 0.76, 0.48, 0.08, wood);
    part('blanket fold', 0, 0.43, -0.29, 0.69, 0.045, 0.15, view.material('blanket trim', '#b0b18e'));
    for (const x of [-0.28, 0.28])
      part(
        'woven blanket border',
        x,
        0.417,
        0.2,
        0.025,
        0.015,
        1.1,
        view.material('blanket trim', '#b0b18e'),
      );
    for (const x of [-0.34, 0.34])
      for (const z of [-0.82, 0.82]) part('bedpost', x, 0.3, z, 0.1, 0.6, 0.1, wood);
    for (const x of [-0.34, 0.34])
      for (const z of [-0.82, 0.82]) part('bedpost cap', x, 0.6, z, 0.12, 0.055, 0.12, metal);
    part('footboard', 0, 0.31, 0.83, 0.72, 0.27, 0.07, wood);
    for (const x of [-0.29, 0.29]) part('headboard corner inlay', x, 0.49, -0.88, 0.022, 0.28, 0.018, metal);
    return;
  }
  if (['mushrooms', 'stove', 'table', 'barrel'].includes(model)) {
    const root = new TransformNode(f.id, view.scene);
    root.parent = parent;
    root.position.set(f.x, 0, f.z);
    const part = (
      n: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      m: StandardMaterial,
    ) => {
      dressedBlock(
        view,
        n,
        x,
        y,
        z,
        w,
        h,
        d,
        m,
        root,
        Math.min(0.018, h * 0.15, w * 0.15, d * 0.15),
      ).isPickable = false;
    };
    const cylinder = (
      n: string,
      x: number,
      y: number,
      z: number,
      h: number,
      d: number,
      m: StandardMaterial,
    ) => {
      const mesh = MeshBuilder.CreateCylinder(n, { height: h, diameter: d, tessellation: 10 }, view.scene);
      mesh.position.set(x, y, z);
      mesh.parent = root;
      mesh.material = m;
      mesh.isPickable = false;
      return mesh;
    };
    if (model === 'mushrooms') {
      part('growing tray', 0, 0.15, 0, 0.82, 0.3, 0.82, wood);
      part('soil', 0, 0.31, 0, 0.72, 0.03, 0.72, view.material('soil', '#3c3127'));
      for (let i = 0; i < 6; i++) {
        const x = -0.22 + (i % 3) * 0.22,
          z = -0.16 + Math.floor(i / 3) * 0.32;
        cylinder('mushroom stalk', x, 0.41, z, 0.18, 0.045, view.material('stalk', '#e5d3ad'));
        const cap = MeshBuilder.CreateSphere('mushroom cap', { diameter: 0.2, segments: 6 }, view.scene);
        cap.position.set(x, 0.5, z);
        cap.scaling.y = 0.55;
        cap.parent = root;
        cap.material = view.material(i % 2 ? 'red cap' : 'cream cap', i % 2 ? '#b85b34' : '#d6b881');
        cap.isPickable = false;
      }
    } else if (model === 'stove') {
      part('cooking hearth', 0, 0.25, 0, 0.75, 0.5, 0.75, view.material('stove stone', '#4a504c', true));
      part('coals', 0, 0.2, -0.38, 0.4, 0.17, 0.025, view.material('fire', '#ed9b47', false, 0.6));
      cylinder('cooking pot', 0, 0.63, 0, 0.24, 0.46, view.material('pot', '#383c3f'));
      cylinder('prepared food', 0, 0.77, 0, 0.02, 0.38, view.material('stew', '#c8a059'));
      for (const x of [-0.29, 0.29]) {
        const handle = MeshBuilder.CreateTorus(
          'pot handle',
          { diameter: 0.16, thickness: 0.035, tessellation: 10 },
          view.scene,
        );
        handle.position.set(x, 0.67, 0);
        handle.rotation.z = Math.PI / 2;
        handle.material = metal;
        handle.parent = root;
        handle.isPickable = false;
      }
      for (const x of [-0.16, 0, 0.16]) part('stove grate', x, 0.21, -0.4, 0.028, 0.22, 0.04, metal);
      part('stove hood lip', 0, 0.49, -0.36, 0.79, 0.055, 0.12, metal);
    } else if (model === 'barrel') {
      cylinder('brew barrel', 0, 0.37, 0, 0.72, 0.6, wood);
      for (const y of [0.13, 0.59]) {
        const ring = MeshBuilder.CreateTorus(
          'barrel hoop',
          { diameter: 0.59, thickness: 0.045, tessellation: 12 },
          view.scene,
        );
        ring.position.y = y;
        ring.parent = root;
        ring.material = metal;
        ring.isPickable = false;
      }
      part('tap', 0, 0.24, -0.36, 0.07, 0.13, 0.12, metal);
      cylinder('barrel lid', 0, 0.74, 0, 0.035, 0.54, wood);
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        part(
          'cask stave joint',
          Math.sin(angle) * 0.293,
          0.36,
          Math.cos(angle) * 0.293,
          0.012,
          0.59,
          0.012,
          view.material('wood joint', '#32271e'),
        );
      }
    } else {
      part('tabletop', 0, 0.52, 0, 0.8, 0.12, 0.76, wood);
      for (const x of [-0.3, 0.3])
        for (const z of [-0.27, 0.27]) part('table leg', x, 0.26, z, 0.07, 0.5, 0.07, wood);
      for (const z of [-0.24, 0.24]) part('table apron', 0, 0.42, z, 0.67, 0.11, 0.05, wood);
      for (const z of [-0.21, 0, 0.21])
        part('table plank joint', 0, 0.583, z, 0.77, 0.004, 0.008, view.material('wood joint', '#32271e'));
      cylinder('drinking cup', 0.24, 0.65, 0.21, 0.14, 0.09, view.material('copper cup', '#a77449'));
      if (display.eating) cylinder('meal plate', 0, 0.6, 0, 0.025, 0.25, view.material('plate', '#d4c5a0'));
    }
    return;
  }
  if (['bench', 'anvil', 'assembly'].includes(model)) {
    const root = new TransformNode(f.id, view.scene);
    root.parent = parent;
    root.position.set(
      f.x + (model === 'assembly' && !f.rotation ? 0.5 : 0),
      0,
      f.z + (model === 'assembly' && f.rotation ? 0.5 : 0),
    );
    root.rotation.y = f.rotation ? Math.PI / 2 : 0;
    const part = (
      n: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      m: StandardMaterial,
    ) => {
      dressedBlock(
        view,
        n,
        x,
        y,
        z,
        w,
        h,
        d,
        m,
        root,
        Math.min(0.018, h * 0.15, w * 0.15, d * 0.15),
      ).isPickable = false;
    };
    const iron = view.material('workshop iron', '#57626a');
    if (model === 'anvil') {
      part('anvil plinth', 0, 0.15, 0, 0.65, 0.3, 0.65, wood);
      part('anvil waist', 0, 0.42, 0, 0.25, 0.3, 0.27, iron);
      part('anvil top', 0, 0.59, 0, 0.7, 0.12, 0.32, iron);
      const horn = MeshBuilder.CreateCylinder(
        'anvil horn',
        { height: 0.3, diameterBottom: 0.19, diameterTop: 0.02, tessellation: 5 },
        view.scene,
      );
      horn.rotation.z = -Math.PI / 2;
      horn.position.set(0.42, 0.58, 0);
      horn.parent = root;
      horn.material = iron;
      horn.isPickable = false;
      for (const x of [-0.23, 0.23]) part('anvil base strap', x, 0.2, 0, 0.045, 0.3, 0.67, metal);
    } else {
      const width = model === 'assembly' ? 1.7 : 0.78;
      part('work bench', 0, 0.55, 0, width, 0.17, 0.7, wood);
      for (const x of [-width / 2 + 0.08, width / 2 - 0.08])
        for (const z of [-0.25, 0.25]) part('bench leg', x, 0.25, z, 0.09, 0.5, 0.09, wood);
      part('vice', 0.21, 0.7, 0, 0.16, 0.18, 0.23, iron);
      part('parts tray', -0.2, 0.66, 0.05, 0.24, 0.03, 0.28, metal);
      part('bench lower brace', 0, 0.2, 0.23, width - 0.08, 0.08, 0.065, wood);
      for (const x of [-width / 2 + 0.08, width / 2 - 0.08])
        part('bench iron corner', x, 0.56, -0.36, 0.1, 0.19, 0.035, metal);
      for (const x of [-0.3, 0]) {
        part('bench tool handle', x, 0.66, -0.2, 0.03, 0.03, 0.2, wood);
        part('bench tool head', x, 0.69, -0.28, 0.13, 0.06, 0.055, iron);
      }
      if (model === 'assembly')
        for (const x of [-0.65, 0.6]) {
          const gear = MeshBuilder.CreateTorus(
            'mechanism gear',
            { diameter: 0.26, thickness: 0.055, tessellation: 8 },
            view.scene,
          );
          gear.position.set(x, 0.66, 0.12);
          gear.material = metal;
          gear.parent = root;
          gear.isPickable = false;
        }
    }
    if (display.outputCount) {
      part(
        'finished assembly',
        0,
        0.73,
        0.13,
        0.42,
        0.09,
        0.34,
        display.output === 'timber-door' || display.output === 'reinforced-door' ? wood : iron,
      );
      if (display.output === 'bolt-trap') {
        const spring = MeshBuilder.CreateTorus(
          'trap spring',
          { diameter: 0.2, thickness: 0.035, tessellation: 8 },
          view.scene,
        );
        spring.position.set(0, 0.82, 0.13);
        spring.material = metal;
        spring.parent = root;
        spring.isPickable = false;
        part('bolt mechanism', 0, 0.86, 0.13, 0.035, 0.035, 0.34, iron);
      } else if (display.output === 'spike-trap')
        for (const x of [-0.13, 0, 0.13]) {
          const spike = MeshBuilder.CreateCylinder(
            'finished trap spike',
            { height: 0.15, diameterBottom: 0.055, diameterTop: 0, tessellation: 6 },
            view.scene,
          );
          spike.position.set(x, 0.85, 0.13);
          spike.material = iron;
          spike.parent = root;
          spike.isPickable = false;
        }
      else for (const z of [0.04, 0.22]) part('door reinforcement', 0, 0.79, z, 0.4, 0.03, 0.045, metal);
    }
    return;
  }
  if (['dummy', 'weights', 'lectern', 'bookshelf'].includes(model)) {
    const large = model === 'weights' || model === 'bookshelf',
      root = new TransformNode(f.id, view.scene);
    root.parent = parent;
    root.position.set(f.x + (large && !f.rotation ? 0.5 : 0), 0, f.z + (large && f.rotation ? 0.5 : 0));
    root.rotation.y = f.rotation ? Math.PI / 2 : 0;
    const part = (
      n: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      m: StandardMaterial,
    ) => {
      const mesh = dressedBlock(
        view,
        n,
        x,
        y,
        z,
        w,
        h,
        d,
        m,
        root,
        Math.min(0.018, h * 0.15, w * 0.15, d * 0.15),
      );
      mesh.isPickable = false;
      return mesh;
    };
    const cylinder = (
      n: string,
      x: number,
      y: number,
      z: number,
      h: number,
      d: number,
      m: StandardMaterial,
    ) => {
      const mesh = MeshBuilder.CreateCylinder(n, { height: h, diameter: d, tessellation: 10 }, view.scene);
      mesh.position.set(x, y, z);
      mesh.parent = root;
      mesh.material = m;
      mesh.isPickable = false;
      return mesh;
    };
    const iron = view.material('training iron', '#5f686c'),
      linen = view.material('parchment', '#e0d1aa'),
      blue = view.material('research inlay', '#6db6c9', false, 0.12);
    if (model === 'dummy') {
      part('dummy foot', 0, 0.07, 0, 0.66, 0.14, 0.66, wood);
      cylinder('practice post', 0, 0.51, 0, 0.9, 0.13, wood);
      cylinder('bound straw torso', 0, 0.57, 0, 0.4, 0.33, view.material('training straw', '#b99a62'));
      part('practice crossbar', 0, 0.67, 0, 0.7, 0.12, 0.13, wood);
      cylinder('dummy head', 0, 0.89, 0, 0.19, 0.24, view.material('training straw', '#b99a62'));
      for (const y of [0.43, 0.65, 0.93])
        cylinder('practice bindings', 0, y, 0, 0.04, y === 0.93 ? 0.25 : 0.34, metal);
      const target = MeshBuilder.CreateTorus(
        'dummy target',
        { diameter: 0.22, thickness: 0.025, tessellation: 12 },
        view.scene,
      );
      target.position.set(0, 0.56, -0.18);
      target.rotation.x = Math.PI / 2;
      target.material = view.material('training target', '#823f31');
      target.parent = root;
      target.isPickable = false;
    } else if (model === 'weights') {
      part('weight station deck', 0, 0.07, 0, 1.75, 0.14, 0.78, wood);
      part('exercise bench', 0, 0.35, 0.05, 0.75, 0.12, 0.38, view.material('training leather', '#784d35'));
      for (const x of [-0.32, 0.32]) part('exercise bench leg', x, 0.21, 0.05, 0.08, 0.3, 0.3, iron);
      for (const x of [-0.65, 0.65]) {
        part('weight rack upright', x, 0.36, -0.14, 0.09, 0.62, 0.1, wood);
        cylinder('weight stack', x, 0.2, 0.18, 0.2, 0.32, iron);
      }
      const bar = cylinder('barbell', 0, 0.68, -0.14, 1.55, 0.055, metal);
      bar.rotation.z = Math.PI / 2;
      for (const x of [-0.59, 0.59]) {
        const weight = cylinder('barbell plate', x, 0.68, -0.14, 0.18, 0.38, iron);
        weight.rotation.z = Math.PI / 2;
      }
    } else {
      const width = large ? 1.7 : 0.74;
      part('reading desk', 0, 0.56, 0.07, width, 0.13, 0.68, wood);
      for (const x of [-width / 2 + 0.09, width / 2 - 0.09])
        for (const z of [-0.18, 0.31]) part('reading desk leg', x, 0.27, z, 0.085, 0.54, 0.085, wood);
      if (large) {
        part('research shelf backing', 0, 0.78, -0.29, 1.7, 0.62, 0.1, wood);
        for (const y of [0.56, 0.84, 1.09])
          part('research shelf board', 0, y, -0.24, 1.72, 0.055, 0.22, wood);
        for (const y of [0.69, 0.98])
          for (let i = 0; i < 11; i++)
            part(
              'shelved volume',
              -0.72 + i * 0.14,
              y,
              -0.235,
              0.1,
              0.18 + (i % 2) * 0.02,
              0.13,
              view.material(`book spine ${i % 3}`, ['#486982', '#866143', '#647558'][i % 3]),
            );
      } else {
        part('lectern stand', 0, 0.43, -0.12, 0.18, 0.55, 0.18, wood);
        part('sloped reading rest', 0, 0.65, 0.06, 0.66, 0.08, 0.53, wood).rotation.x = 0.13;
      }
      part('book binding', 0, 0.663, 0.15, 0.51, 0.045, 0.37, metal);
      for (const side of [-1, 1]) {
        part('open research book', side * 0.122, 0.7, 0.15, 0.235, 0.035, 0.34, linen).rotation.z =
          side * 0.1;
        for (let i = 0; i < 3; i++)
          part('ink markings', side * 0.125, 0.725, 0.05 + i * 0.075, 0.125, 0.005, 0.012, blue);
      }
      cylinder('reading candle base', width / 2 - 0.12, 0.67, 0.2, 0.055, 0.12, metal);
      cylinder('reading candle', width / 2 - 0.12, 0.77, 0.2, 0.16, 0.05, linen);
      view.crystal(width / 2 - 0.12, 0.88, 0.2, 0.08, '#f1c37b', root);
    }
    return;
  }
  if (model !== 'chest') {
    view.box('prototype facility', f.x, 0.3, f.z, 0.7, 0.6, 0.7, metal, parent).isPickable = false;
    return;
  }
  dressedBlock(view, 'chest base', f.x, 0.11, f.z, 0.7, 0.2, 0.66, wood, parent, 0.028).isPickable = false;
  view.box(
    'chest interior',
    f.x,
    0.215,
    f.z,
    0.57,
    0.022,
    0.53,
    view.material('chest lining', '#302a22'),
    parent,
  ).isPickable = false;
  for (const dx of [-0.3, 0.3])
    dressedBlock(view, 'chest side', f.x + dx, 0.31, f.z, 0.08, 0.36, 0.65, wood, parent, 0.016).isPickable =
      false;
  for (const dz of [-0.285, 0.285])
    dressedBlock(view, 'chest end', f.x, 0.31, f.z + dz, 0.61, 0.36, 0.07, wood, parent, 0.012).isPickable =
      false;
  // Open vault lid leaves the real stored-gold display readable from overhead.
  const lid = new TransformNode('raised chest lid', view.scene);
  lid.parent = parent;
  lid.position.set(f.x, 0.46, f.z + 0.31);
  lid.rotation.x = -0.98;
  dressedBlock(view, 'chest lid', 0, 0.015, 0.29, 0.7, 0.075, 0.61, wood, lid, 0.022).isPickable = false;
  for (const dx of [-0.24, 0.24])
    view.box('lid iron band', dx, 0.061, 0.29, 0.045, 0.026, 0.6, metal, lid).isPickable = false;
  for (const dz of [-0.32, 0.32])
    view.box('vault rim', f.x, 0.47, f.z + dz, 0.71, 0.075, 0.05, metal, parent).isPickable = false;
  view.box('chest lock', f.x, 0.32, f.z - 0.337, 0.12, 0.16, 0.035, metal, parent).isPickable = false;
  for (const dx of [-0.23, 0.23])
    view.box('chest band', f.x + dx, 0.46, f.z, 0.05, 0.035, 0.66, metal, parent).isPickable = false;
  if ((display.storedGold ?? 0) > 0)
    for (let i = 0; i < Math.min(7, Math.ceil(display.storedGold! / 20)); i++)
      view.box(
        'stored gold',
        f.x - 0.2 + (i % 3) * 0.18,
        0.51 + Math.floor(i / 3) * 0.075,
        f.z - 0.12 + Math.floor(i / 3) * 0.12,
        0.15,
        0.07,
        0.1,
        view.material('gold metal', '#ffbf4d'),
        parent,
      ).isPickable = false;
}
