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
import { roomFloors } from '../content/room-visuals';
import { environmentPalette, environmentDetail } from '../content/environment-visuals';
import { environmentDecoration, type EnvironmentDecoration } from '../content/environment-regions';

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
      // Natural banks carry relief in their continuous sculpted face, not repeated floating shelves.
      if (t.reinforced) {
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
        0.022,
        t.z + dz * 0.48,
        dx ? 0.026 : 0.99,
        0.035,
        dz ? 0.026 : 0.99,
        view.material('bank crevice', '#4a4237'),
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
    if (room && !roomFloors[room] && (n.room ?? n.ruin?.room) !== room) {
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
  const decoration = environmentDecoration(view.world, t);
  if (decoration) drawEnvironmentCluster(view, t, decoration);
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

/** Each edge cluster merges into a few shared-material meshes with its owning tile. */
function drawEnvironmentCluster(view: GameScene, t: Tile, decoration: EnvironmentDecoration) {
  const { kind, edge, variant, authored } = decoration;
  const palette = environmentPalette(view.world, t);
  const dx = edge.x - t.x,
    dz = edge.z - t.z;
  const at = (offset: number, distance = 0.4) => ({
    x: t.x + dx * distance + dz * offset,
    z: t.z + dz * distance + dx * offset,
  });
  const wall = !isHazard(edge);
  if (kind === 'fungal') {
    const stems = view.material('habitat fungus stems', '#a297ac');
    const caps = view.material(
      `habitat fungus ${authored ? 'colony' : 'legacy'}`,
      authored ? '#ae83c5' : palette.growth,
      false,
      0.16,
    );
    const pale = view.material('habitat fungus gills', '#badacb', false, 0.15);
    for (let i = 0; i < 3; i++) {
      const p = at((i - 1) * 0.2, 0.38);
      const height = (authored ? 0.26 : 0.18) + ((i + variant) % 3) * (authored ? 0.17 : 0.05);
      const stem = MeshBuilder.CreateCylinder(
        'colony stalk',
        { height, diameterTop: 0.035, diameterBottom: 0.075, tessellation: 5 },
        view.scene,
      );
      stem.position.set(p.x, height / 2, p.z);
      stem.material = stems;
      stem.parent = view.terrainRoot;
      stem.isPickable = false;
      const cap = MeshBuilder.CreateSphere(
        'colony cap',
        { diameter: 0.23 + height * 0.35, segments: 6 },
        view.scene,
      );
      cap.position.set(p.x, height, p.z);
      cap.scaling.y = 0.36;
      cap.material = i === 1 ? caps : pale;
      cap.parent = view.terrainRoot;
      cap.isPickable = false;
      view.includeGlow(cap);
    }
    if (authored && wall && variant === 0) {
      // The fine web hugs an existing wall, never stretches across a player passage.
      const mat = view.material('habitat old silk', '#91a8a5');
      const anchor = at(-0.38, 0.46);
      for (let i = 0; i < 5; i++) {
        const bottom = at(-0.27 + i * 0.15, 0.46);
        const a = new Vector3(anchor.x, 0.77, anchor.z);
        const b = new Vector3(bottom.x, 0.09, bottom.z);
        const strand = MeshBuilder.CreateCylinder(
          'wall silk strand',
          { height: Vector3.Distance(a, b), diameter: 0.008, tessellation: 3 },
          view.scene,
        );
        strand.position.copyFrom(Vector3.Center(a, b));
        if (dx) strand.rotation.x = Math.atan2(b.z - a.z, b.y - a.y);
        else strand.rotation.z = -Math.atan2(b.x - a.x, b.y - a.y);
        strand.material = mat;
        strand.parent = view.terrainRoot;
        strand.isPickable = false;
      }
      for (let i = 1; i < 4; i++) {
        const p = at(-0.1, 0.461);
        view.box(
          'wall silk cross strand',
          p.x,
          0.16 + i * 0.12,
          p.z,
          dx ? 0.009 : 0.42,
          0.008,
          dz ? 0.009 : 0.42,
          mat,
        ).isPickable = false;
      }
    }
  } else if (kind === 'crystal') {
    // Pale low quartz clusters have neither the dark matrix nor full-tile silhouette of income gems.
    for (let i = 0; i < 3; i++) {
      const p = at((i - 1) * 0.19, 0.4);
      const height = 0.26 + ((i + variant) % 3) * (authored ? 0.21 : 0.08);
      const crystal = view.crystal(p.x, height / 2, p.z, height, palette.growth);
      crystal.rotation.z = dz ? 0 : (i - 1) * 0.18;
      crystal.rotation.x = dx ? 0 : (i - 1) * 0.18;
    }
  } else if (kind === 'masonry' && wall) {
    const stone = view.material('district pale masonry', '#989b95', true);
    const dark = view.material('district carved recess', '#525c62');
    const p = at(0, 0.475);
    for (let row = 0; row < 3; row++)
      dressedBlock(
        view,
        'district wall pilaster',
        p.x,
        0.22 + row * 0.38,
        p.z,
        dx ? 0.075 : 0.29,
        0.35,
        dz ? 0.075 : 0.29,
        stone,
        view.terrainRoot,
        0.018,
      ).isPickable = false;
    dressedBlock(
      view,
      'district pilaster crown',
      p.x,
      1.26,
      p.z,
      dx ? 0.085 : 0.38,
      0.12,
      dz ? 0.085 : 0.38,
      stone,
      view.terrainRoot,
      0.018,
    ).isPickable = false;
    const face = at(0, 0.428);
    view.box(
      'district narrow inset',
      face.x,
      0.63,
      face.z,
      dx ? 0.015 : 0.075,
      0.47,
      dz ? 0.015 : 0.075,
      dark,
    ).isPickable = false;
    for (const offset of [-0.29, 0.27]) {
      const fragment = at(offset, 0.38);
      const chip = dressedBlock(
        view,
        'district fallen coping',
        fragment.x,
        0.045,
        fragment.z,
        0.17,
        0.09,
        0.13,
        stone,
        view.terrainRoot,
        0.012,
      );
      chip.rotation.y = offset * 1.7;
      chip.isPickable = false;
    }
  } else {
    const damp = kind === 'damp';
    const mat = view.material(
      `habitat ${kind} edge`,
      damp ? '#668578' : kind === 'scorched' ? '#484345' : '#ac9979',
    );
    for (let i = 0; i < 3; i++) {
      const p = at((i - 1) * 0.23);
      const chunk = MeshBuilder.CreateIcoSphere(
        `${kind} bank fragment`,
        { radius: 1, subdivisions: 1, flat: true },
        view.scene,
      );
      chunk.position.set(p.x, damp ? 0.012 : 0.065, p.z);
      chunk.scaling.set(dx ? 0.07 : 0.14, damp ? 0.018 : 0.055 + (i % 2) * 0.04, dz ? 0.07 : 0.14);
      chunk.material = mat;
      chunk.parent = view.terrainRoot;
      chunk.isPickable = false;
      if (damp && wall && i < 2) {
        const streak = at((i - 0.5) * 0.31, 0.495);
        view.box(
          'damp wall mineral streak',
          streak.x,
          0.32,
          streak.z,
          dx ? 0.007 : 0.065,
          0.61,
          dz ? 0.007 : 0.065,
          mat,
        ).isPickable = false;
      }
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
  const m = new Mesh('crystal', view.scene),
    positions: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const ring = (i: number, height: number, radius: number) => [
    Math.cos((i * Math.PI) / 3) * size * radius,
    height * size,
    Math.sin((i * Math.PI) / 3) * size * radius,
  ];
  for (let i = 0; i < 6; i++) {
    const a = ring(i, -0.5, 0.2),
      b = ring(i + 1, -0.5, 0.2),
      c = ring(i + 1, 0.19, 0.17),
      d = ring(i, 0.19, 0.17);
    const index = positions.length / 3,
      shade = [0.52, 0.78, 1, 0.65, 0.88, 0.43][i];
    positions.push(...a, ...b, ...c, ...d, 0, size * 0.5, 0);
    for (let j = 0; j < 5; j++) colors.push(shade, shade, shade, 1);
    indices.push(
      index,
      index + 1,
      index + 3,
      index + 1,
      index + 2,
      index + 3,
      index + 3,
      index + 2,
      index + 4,
    );
  }
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.colors = colors;
  data.normals = [];
  VertexData.ComputeNormals(positions, indices, data.normals);
  data.applyToMesh(m);
  m.position.set(x, y, z);
  m.material = view.material(color, color, false, 0.19);
  m.parent = parent;
  m.isPickable = false;
  view.includeGlow(m);
  return m;
}

export function goldSeams(view: GameScene, t: Tile) {
  const gold = view.material('embedded gold metal', '#dfa946', false, 0.12);
  const pale = view.material('gold quartz fleck', '#e9c577', false, 0.045);
  const ochre = view.material('gold mineral shadow', '#a7742d');
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
  for (let i = 0; i < 16; i++) {
    const phase = i * 1.7 + t.x * 2.3 + t.z * 0.9;
    const m = fragment(
      t.x - 0.44 + (i % 8) * 0.127,
      1.487,
      t.z + Math.sin((t.x + (i % 8) / 8) * 3.7 + t.z) * 0.14 + (i < 8 ? -0.17 : 0.18),
      0.09 + (i % 3) * 0.03,
      0.024,
      0.061 + (i % 2) * 0.033,
    );
    m.material = i % 5 === 0 ? pale : i % 4 === 0 ? ochre : gold;
    m.rotation.y = Math.sin(phase * 2) * 0.9;
  }
  for (const n of neighbors(view.world, t))
    if (n.known && (n.terrain === 'floor' || isHazard(n))) {
      const dx = n.x - t.x,
        dz = n.z - t.z;
      for (let i = 0; i < 16; i++) {
        const phase = i * 2.1 + t.x + t.z * 1.3;
        const offset = -0.43 + (i % 8) * 0.124;
        const m = fragment(
          t.x + dx * 0.493 + dz * offset,
          (i < 8 ? 0.43 : 1.06) + Math.sin(((dx ? t.z : t.x) + offset) * 3.5) * 0.16,
          t.z + dz * 0.493 + dx * offset,
          dx ? 0.03 : 0.098 + (i % 2) * 0.04,
          0.078 + (i % 3) * 0.029,
          dz ? 0.03 : 0.098 + (i % 2) * 0.04,
        );
        m.material = i % 5 === 0 ? pale : i % 4 === 0 ? ochre : gold;
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
