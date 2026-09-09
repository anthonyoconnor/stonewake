import {
  Mesh,
  MeshBuilder,
  VertexData,
  Vector3,
  type TransformNode,
  type StandardMaterial,
} from '@babylonjs/core';
import type { GameScene } from './scene';
import { neighbors, type Tile } from '../game/types';
import { isHazard } from '../game/terrain';
import { roomLook } from '../content/rooms';
import { environmentPalette, environmentDetail, hasBiomeGrowth } from '../content/environment-visuals';

/** Small chamfers catch the light without moving the square gameplay footprint or top plane. */
export function dressedBlock(
  view: GameScene,
  name: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  material: StandardMaterial,
  parent: TransformNode,
  bevel = 0.035,
) {
  const mesh = new Mesh(name, view.scene),
    positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [];
  const ring = (height: number, inset: number) => [
    [-w / 2 + inset, height, -d / 2 + inset],
    [w / 2 - inset, height, -d / 2 + inset],
    [w / 2 - inset, height, d / 2 - inset],
    [-w / 2 + inset, height, d / 2 - inset],
  ];
  const rings = [ring(-h / 2, bevel), ring(-h / 2 + bevel, 0), ring(h / 2 - bevel, 0), ring(h / 2, bevel)];
  const face = (points: number[][]) => {
    const start = positions.length / 3;
    for (const [i, p] of points.entries()) {
      positions.push(...p);
      uvs.push(
        ...[
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ][i],
      );
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  face([...rings[0]].reverse());
  face(rings[3]);
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      face([rings[r][j], rings[r + 1][j], rings[r + 1][i], rings[r][i]]);
    }
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.uvs = uvs;
  data.normals = [];
  VertexData.ComputeNormals(positions, indices, data.normals);
  data.applyToMesh(mesh);
  mesh.position.set(x, y, z);
  mesh.material = material;
  mesh.parent = parent;
  return mesh;
}

export function terrainRelief(view: GameScene, t: Tile, material: StandardMaterial) {
  const parent = view.terrainRoot;
  const relief = view.material(`relief ${material.name}`, material.diffuseColor.scale(0.8).toHexString());
  // Exposed banks get a shallow broken stone face; occupied tops retain one common height.
  for (const n of neighbors(view.world, t))
    if (n.known && (n.terrain === 'floor' || isHazard(n))) {
      const dx = n.x - t.x,
        dz = n.z - t.z;
      if (!t.reinforced) {
        // Broken shallow strata give natural banks an excavated face instead of oversized bricks.
        for (let row = 0; row < 4; row++) {
          const offset = Math.sin(t.x * 13 + t.z * 7 + row * 4) * 0.08;
          const stone = MeshBuilder.CreateIcoSphere(
            'natural bank stratum',
            { radius: 1, subdivisions: 1, flat: true },
            view.scene,
          );
          stone.position.set(
            t.x + dx * 0.479 + dz * offset,
            0.17 + row * 0.35,
            t.z + dz * 0.479 + dx * offset,
          );
          stone.scaling.set(dx ? 0.041 : 0.47, 0.15 + (row % 2) * 0.025, dz ? 0.041 : 0.47);
          stone.material = relief;
          stone.parent = parent;
          stone.isPickable = false;
        }
      } else {
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 3; col++) {
            const offset = (col - 1) * 0.32 + (row % 2 ? 0.025 : 0),
              depth = 0.045 + ((t.x + t.z + row + col) % 3) * 0.015;
            const m = dressedBlock(
              view,
              'bank strata',
              t.x + dx * 0.475 + dz * offset,
              0.25 + row * 0.43,
              t.z + dz * 0.475 + dx * offset,
              dx ? depth : 0.305,
              0.35,
              dz ? depth : 0.305,
              relief,
              parent,
              0.022,
            );
            m.isPickable = false;
          }
      }
      // A darker foot gives excavation depth without adding boulders into usable floor.
      view.box(
        'bank foot',
        t.x + dx * 0.48,
        0.07,
        t.z + dz * 0.48,
        dx ? 0.045 : 0.99,
        0.1,
        dz ? 0.045 : 0.99,
        view.material('bank crevice', '#39372f'),
        parent,
      ).isPickable = false;
    }
}

export function floorTransitions(view: GameScene, t: Tile) {
  const room = t.room ?? t.ruin?.room;
  for (const n of neighbors(view.world, t)) {
    if (!n.known) continue;
    const dx = n.x - t.x,
      dz = n.z - t.z;
    if (room && (n.room ?? n.ruin?.room) !== room) {
      const trim = view.material(
        `boundary-${room}${t.room ? '' : '-ruin'}`,
        t.room ? (roomLook(room).trim ?? '#baa06d') : '#77766e',
      );
      for (const offset of [0.433, 0.476])
        view.box(
          'room boundary inlay',
          t.x + dx * offset,
          0.005,
          t.z + dz * offset,
          dx ? 0.018 : 0.99,
          0.007,
          dz ? 0.018 : 0.99,
          trim,
        ).isPickable = false;
    }
    if (
      !t.claimed &&
      !room &&
      n.terrain !== 'floor' &&
      !isHazard(n) &&
      (t.x * 3 + t.z) % environmentDetail.floorDebrisModulo === 0
    ) {
      for (const offset of [-0.19, 0.18]) {
        const m = MeshBuilder.CreateIcoSphere(
          'excavated bank chips',
          { radius: 1, subdivisions: 1, flat: true },
          view.scene,
        );
        m.position.set(t.x + dx * 0.4 + dz * offset, 0.035, t.z + dz * 0.4 + dx * offset);
        m.scaling.set(0.065, 0.04, 0.085);
        m.material = view.material('bank chips', '#746b58');
        m.parent = view.terrainRoot;
        m.isPickable = false;
      }
    }
    if (isHazard(n) && !n.bridge) {
      const stone = view.material('cut shore', '#64665f', true);
      // The retaining face is below the existing land, never a raised walking shelf.
      for (let i = 0; i < 3; i++)
        dressedBlock(
          view,
          'cut bank',
          t.x + dx * 0.473 + dz * (i - 1) * 0.32,
          -0.18,
          t.z + dz * 0.473 + dx * (i - 1) * 0.32,
          dx ? 0.07 : 0.31,
          0.34,
          dz ? 0.07 : 0.31,
          stone,
          view.terrainRoot,
          0.018,
        ).isPickable = false;
    }
  }
}

/** Sparse cosmetic habitat growth and broken ruin trim; never adds occupancy or service slots. */
export function biomeDetails(view: GameScene, t: Tile) {
  if (!t.known) return;
  const palette = environmentPalette(view.world);
  const wall = neighbors(view.world, t).find(
    (n) => n.known && !['floor', 'water', 'lava', 'chasm'].includes(n.terrain),
  );
  if (hasBiomeGrowth(view.world, t) && wall) {
    const dx = wall.x - t.x,
      dz = wall.z - t.z;
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 0.16;
      const x = t.x + dx * 0.36 + dz * offset,
        z = t.z + dz * 0.36 + dx * offset;
      if (view.world.biome === 'fungal') {
        view.box(
          'cave fungus stem',
          x,
          0.13,
          z,
          0.04,
          0.26,
          0.04,
          view.material('cave fungus stem', '#aaa293'),
        ).isPickable = false;
        const cap = MeshBuilder.CreateSphere(
          'cave fungus cap',
          { diameter: 0.22 + (i % 2) * 0.1, segments: 5 },
          view.scene,
        );
        cap.position.set(x, 0.26, z);
        cap.scaling.y = 0.45;
        cap.material = view.material('cave fungus cap', palette.growth, false, 0.22);
        cap.parent = view.terrainRoot;
        cap.isPickable = false;
        view.includeGlow(cap);
      } else view.crystal(x, 0.13, z, 0.28 + (i % 2) * 0.13, palette.growth);
    }
  }
  if (t.ruin && (t.x + t.z) % environmentDetail.ruinDebrisModulo === 0) {
    const mat = view.material('ruin broken masonry', '#737d80', true);
    // The fragments sit flush at floor edges, so the walkway remains legible after reclamation.
    for (const offset of [-0.29, 0.3]) {
      const m = dressedBlock(
        view,
        'ruin fallen trim',
        t.x + offset,
        0.027,
        t.z + 0.4,
        0.17,
        0.055,
        0.1,
        mat,
        view.terrainRoot,
        0.015,
      );
      m.rotation.y = offset;
      m.isPickable = false;
    }
  }
}

export function hazardDetails(view: GameScene, t: Tile) {
  if (t.terrain === 'chasm') {
    for (const n of neighbors(view.world, t))
      if (n.known && !isHazard(n)) {
        const dx = n.x - t.x,
          dz = n.z - t.z;
        view.box(
          'chasm cut face',
          t.x + dx * 0.485,
          -0.58,
          t.z + dz * 0.485,
          dx ? 0.025 : 0.995,
          1.1,
          dz ? 0.025 : 0.995,
          view.material('chasm face', '#282f35', true),
        ).isPickable = false;
      }
  }
  if (t.bridge) {
    const stone = view.material('bridge stone', '#918e7e', true),
      joint = view.material('bridge joints', '#454943');
    const deck = view.box('stone bridge deck', t.x, -0.11, t.z, 0.997, 0.18, 0.997, joint);
    deck.metadata = { tile: { x: t.x, z: t.z } };
    for (const dx of [-0.25, 0.25])
      for (const dz of [-0.25, 0.25])
        dressedBlock(
          view,
          'bridge paver',
          t.x + dx,
          -0.055,
          t.z + dz,
          0.49,
          0.11,
          0.49,
          stone,
          view.terrainRoot,
          0.016,
        ).isPickable = false;
    for (const n of neighbors(view.world, t))
      if (isHazard(n) && !n.bridge) {
        const dx = n.x - t.x,
          dz = n.z - t.z;
        for (const offset of [-0.25, 0.25])
          dressedBlock(
            view,
            'bridge edge',
            t.x + dx * 0.456 + dz * offset,
            0.054,
            t.z + dz * 0.456 + dx * offset,
            dx ? 0.084 : 0.48,
            0.108,
            dz ? 0.084 : 0.48,
            stone,
            view.terrainRoot,
            0.015,
          ).isPickable = false;
        for (const offset of [-0.4, 0.4])
          dressedBlock(
            view,
            'bridge corbel',
            t.x + dx * 0.43 + dz * offset,
            -0.225,
            t.z + dz * 0.43 + dx * offset,
            0.14,
            0.27,
            0.14,
            stone,
            view.terrainRoot,
            0.017,
          ).isPickable = false;
      }
  } else if (t.bridgePlanned) {
    const mat = view.material('bridge blueprint', '#86b6cc', false, 0.3);
    mat.alpha = 0.48;
    for (const offset of [-0.36, 0.36])
      for (const axis of [0, 1])
        view.box(
          'bridge plan frame',
          t.x + (axis ? offset : 0),
          0.012,
          t.z + (axis ? 0 : offset),
          axis ? 0.045 : 0.77,
          0.024,
          axis ? 0.77 : 0.045,
          mat,
        ).isPickable = false;
    for (const offset of [-0.22, 0, 0.22])
      view.box('bridge plan rib', t.x, 0.012, t.z + offset, 0.7, 0.024, 0.024, mat).isPickable = false;
  }
}

export function crystalMesh(
  view: GameScene,
  x: number,
  y: number,
  z: number,
  size: number,
  color: string,
  parent: TransformNode,
) {
  const m = MeshBuilder.CreateCylinder(
    'crystal',
    { height: size, diameterTop: 0, diameterBottom: size * 0.46, tessellation: 5, subdivisions: 2 },
    view.scene,
  );
  // A long faceted shaft and short point read as quartz rather than a smooth cone.
  const positions = m.getVerticesData('position')!;
  for (let i = 0; i < positions.length; i += 3) {
    const vertical = positions[i + 1] / size;
    if (Math.abs(vertical) < 0.01) {
      positions[i] *= 1.75;
      positions[i + 2] *= 1.75;
      positions[i + 1] = size * 0.22;
    }
  }
  m.updateVerticesData('position', positions);
  m.convertToFlatShadedMesh();
  m.refreshBoundingInfo();
  m.position.set(x, y, z);
  m.material = view.material(color, color, false, 0.34);
  m.parent = parent;
  m.isPickable = false;
  view.includeGlow(m);
  return m;
}

export function goldSeams(view: GameScene, t: Tile) {
  const gold = view.material('embedded gold metal', '#edb855', false, 0.16);
  // Broad, shallow mineral fragments read as ore in the bank, not wires on its surface.
  const fragment = (x: number, y: number, z: number, width: number, height: number, depth: number) => {
    const m = MeshBuilder.CreateIcoSphere(
      'embedded gold fragment',
      { radius: 1, subdivisions: 1, flat: true },
      view.scene,
    );
    m.position.set(x, y, z);
    m.scaling.set(width, height, depth);
    m.material = gold;
    m.parent = view.terrainRoot;
    m.isPickable = false;
    return m;
  };
  for (let i = 0; i < 11; i++) {
    const phase = i * 1.7 + t.x * 2.3 + t.z * 0.9;
    const m = fragment(
      t.x - 0.38 + (i % 6) * 0.145,
      1.487,
      t.z + Math.sin(phase) * 0.22 + (i < 6 ? -0.08 : 0.12),
      0.085 + (i % 3) * 0.025,
      0.025,
      0.045 + (i % 2) * 0.022,
    );
    m.rotation.y = Math.sin(phase * 2) * 0.9;
  }
  for (const n of neighbors(view.world, t))
    if (n.known && (n.terrain === 'floor' || isHazard(n))) {
      const dx = n.x - t.x,
        dz = n.z - t.z;
      for (let i = 0; i < 12; i++) {
        const phase = i * 2.1 + t.x + t.z * 1.3;
        const offset = ((i % 3) - 1) * 0.27 + Math.sin(phase) * 0.04;
        const m = fragment(
          t.x + dx * 0.512 + dz * offset,
          0.21 + Math.floor(i / 3) * 0.32 + Math.cos(phase) * 0.045,
          t.z + dz * 0.512 + dx * offset,
          dx ? 0.028 : 0.09 + (i % 2) * 0.035,
          0.065 + (i % 3) * 0.023,
          dz ? 0.028 : 0.09 + (i % 2) * 0.035,
        );
        if (dx) m.rotation.x = Math.sin(phase) * 0.6;
        else m.rotation.z = Math.sin(phase) * 0.6;
      }
    }
}

/** Combine decorative pieces only; the tile pick mesh and metadata remain independent. */
export function mergeEnvironment(view: GameScene, node: TransformNode) {
  const groups = new Map<StandardMaterial, Mesh[]>();
  for (const mesh of node.getChildMeshes())
    if (mesh instanceof Mesh && !mesh.isPickable) {
      const mat = mesh.material as StandardMaterial;
      if (mat) groups.set(mat, [...(groups.get(mat) ?? []), mesh]);
    }
  for (const [mat, meshes] of groups)
    if (meshes.length > 1) {
      const merged = Mesh.MergeMeshes(meshes, true, true);
      if (merged) {
        merged.parent = node;
        merged.isPickable = false;
        if (mat.emissiveColor.r + mat.emissiveColor.g + mat.emissiveColor.b > 0.3) view.includeGlow(merged);
      }
    }
  for (const mesh of node.getChildMeshes()) mesh.freezeWorldMatrix();
}
