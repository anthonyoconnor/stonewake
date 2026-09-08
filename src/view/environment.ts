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
  const relief = view.material(`relief ${material.name}`, material.diffuseColor.scale(0.94).toHexString());
  // Exposed banks get a shallow broken stone face; occupied tops retain one common height.
  for (const n of neighbors(view.world, t))
    if (n.known && (n.terrain === 'floor' || isHazard(n))) {
      const dx = n.x - t.x,
        dz = n.z - t.z;
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
  for (const n of neighbors(view.world, t)) {
    if (!n.known) continue;
    const dx = n.x - t.x,
      dz = n.z - t.z;
    if (t.room && n.room !== t.room) {
      const trim = view.material(`boundary-${t.room}`, roomLook(t.room).trim ?? '#baa06d');
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
  const gold = view.material('gold metal', '#e5b455', false, 0.08);
  const vein = (name: string, points: Vector3[], radius: number) => {
    const m = MeshBuilder.CreateTube(name, { path: points, radius, tessellation: 4, cap: 3 }, view.scene);
    m.material = gold;
    m.parent = view.terrainRoot;
    m.isPickable = false;
  };
  const top = Array.from(
    { length: 8 },
    (_, i) => new Vector3(t.x - 0.49 + i * 0.14, 1.486, t.z + Math.sin(i * 1.7 + t.x) * 0.16),
  );
  vein('branching gold seam', top, 0.017);
  for (const i of [1, 3, 5])
    vein('fine gold vein', [top[i], top[i].add(new Vector3(0.08, 0, i % 4 === 1 ? 0.24 : -0.24))], 0.009);
  for (const n of neighbors(view.world, t))
    if (n.known && (n.terrain === 'floor' || isHazard(n))) {
      const dx = n.x - t.x,
        dz = n.z - t.z;
      const points = Array.from({ length: 7 }, (_, i) => {
        const offset = Math.sin(i * 1.5 + t.z) * 0.24;
        return new Vector3(t.x + dx * 0.512 + dz * offset, 0.11 + i * 0.216, t.z + dz * 0.512 + dx * offset);
      });
      vein('embedded gold seam', points, 0.022);
      for (const i of [1, 3, 5]) {
        const p = points[i];
        vein('gold tributary', [p, p.add(new Vector3(dz * 0.19, 0.1, dx * 0.19))], 0.012);
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
