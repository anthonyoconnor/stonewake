import {
  Mesh,
  MeshBuilder,
  TransformNode,
  Vector3,
  VertexData,
  Quaternion,
  type StandardMaterial,
} from '@babylonjs/core';
import type { GameScene } from './scene';

type Point = [number, number, number];
export type SculptRing = [number, number, number, number?, number?];

/** Small authored forms for resident silhouettes. Measurements are tile units. */
export function residentSculpt(v: GameScene, root: TransformNode) {
  function finish(m: Mesh, mat: StandardMaterial, parent = root) {
    m.material = mat;
    m.parent = parent;
    m.isPickable = false;
    return m;
  }
  function ellipsoid(name: string, p: Point, scale: Point, mat: StandardMaterial, parent = root) {
    const m = finish(MeshBuilder.CreateSphere(name, { diameter: 1, segments: 14 }, v.scene), mat, parent);
    m.position.set(...p);
    m.scaling.set(...scale);
    return m;
  }
  function loft(
    name: string,
    rings: SculptRing[],
    mat: StandardMaterial,
    parent = root,
    sides = 16,
    deform?: (point: Point) => Point,
  ) {
    const positions: number[] = [],
      indices: number[] = [],
      uvs: number[] = [];
    rings.forEach(([y, w, d, z = 0, x = 0], row) => {
      for (let j = 0; j <= sides; j++) {
        const a = (j / sides) * Math.PI * 2;
        const point: Point = [x + Math.sin(a) * w, y, z + Math.cos(a) * d];
        positions.push(...(deform ? deform(point) : point));
        uvs.push(j / sides, row / (rings.length - 1));
        if (row < rings.length - 1 && j < sides) {
          const n = row * (sides + 1) + j;
          indices.push(n, n + 1, n + sides + 1, n + 1, n + sides + 2, n + sides + 1);
        }
      }
    });
    // Close the ends of sleeves, domes and cuffs so overhead views never see a hollow shell.
    for (const end of [0, rings.length - 1]) {
      const [y, , , z = 0, x = 0] = rings[end],
        center = positions.length / 3;
      positions.push(x, y, z);
      uvs.push(0.5, 0.5);
      for (let j = 0; j < sides; j++) {
        const a = end * (sides + 1) + j;
        if (end === 0) indices.push(center, a + 1, a);
        else indices.push(center, a, a + 1);
      }
    }
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.uvs = uvs;
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    // The duplicated UV seam is still one surface; share its shading across the front of faces.
    for (let row = 0; row < rings.length; row++) {
      const first = row * (sides + 1) * 3,
        last = first + sides * 3;
      const normal = new Vector3(
        normals[first] + normals[last],
        normals[first + 1] + normals[last + 1],
        normals[first + 2] + normals[last + 2],
      ).normalize();
      for (const index of [first, last]) {
        normals[index] = normal.x;
        normals[index + 1] = normal.y;
        normals[index + 2] = normal.z;
      }
    }
    data.normals = normals;
    const m = new Mesh(name, v.scene);
    data.applyToMesh(m);
    return finish(m, mat, parent);
  }
  function box(name: string, p: Point, size: Point, mat: StandardMaterial, parent = root, bevel = 0.015) {
    const [w, h, d] = size,
      b = Math.min(bevel, w / 3, h / 3, d / 3);
    // Octagonal footprint plus two bevel courses gives metal/leather a readable lit edge.
    const corners = [
      [-w / 2 + b, -d / 2],
      [w / 2 - b, -d / 2],
      [w / 2, -d / 2 + b],
      [w / 2, d / 2 - b],
      [w / 2 - b, d / 2],
      [-w / 2 + b, d / 2],
      [-w / 2, d / 2 - b],
      [-w / 2, -d / 2 + b],
    ];
    const positions: number[] = [],
      indices: number[] = [],
      uvs: number[] = [];
    for (let row = 0; row < 4; row++) {
      const y = [-h / 2, -h / 2 + b, h / 2 - b, h / 2][row],
        inset = row === 0 || row === 3 ? b : 0;
      corners.forEach(([x, z], j) => {
        positions.push(x - Math.sign(x) * inset, y, z - Math.sign(z) * inset);
        uvs.push(j / 8, row / 3);
      });
    }
    for (let row = 0; row < 3; row++)
      for (let j = 0; j < 8; j++) {
        const a = row * 8 + j,
          b = row * 8 + ((j + 1) % 8),
          c = (row + 1) * 8 + j,
          d = (row + 1) * 8 + ((j + 1) % 8);
        indices.push(a, c, b, b, c, d);
      }
    for (let j = 1; j < 7; j++) indices.push(0, j, j + 1, 24, 24 + j + 1, 24 + j);
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.uvs = uvs;
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    data.normals = normals;
    const m = new Mesh(name, v.scene);
    data.applyToMesh(m);
    finish(m, mat, parent);
    m.position.set(...p);
    return m;
  }
  function line(
    name: string,
    points: Point[],
    radius: number,
    mat: StandardMaterial,
    parent = root,
    endRadius = radius,
  ) {
    const m = MeshBuilder.CreateTube(
      name,
      {
        path: points.map((p) => new Vector3(...p)),
        radius,
        tessellation: 8,
        radiusFunction: (i) => radius + ((endRadius - radius) * i) / (points.length - 1),
        cap: Mesh.CAP_ALL,
      },
      v.scene,
    );
    return finish(m, mat, parent);
  }
  function rod(
    name: string,
    from: Point,
    to: Point,
    radius: number,
    mat: StandardMaterial,
    parent = root,
    endRadius = radius,
  ) {
    const a = new Vector3(...from),
      b = new Vector3(...to),
      delta = b.subtract(a);
    const m = MeshBuilder.CreateCylinder(
      name,
      { height: delta.length(), diameterBottom: radius * 2, diameterTop: endRadius * 2, tessellation: 12 },
      v.scene,
    );
    finish(m, mat, parent);
    m.position.copyFrom(a.add(b).scale(0.5));
    m.rotationQuaternion = Quaternion.FromUnitVectorsToRef(Vector3.Up(), delta.normalize(), new Quaternion());
    return m;
  }
  function torus(
    name: string,
    p: Point,
    diameter: number,
    thickness: number,
    mat: StandardMaterial,
    parent = root,
    front = true,
  ) {
    const m = finish(
      MeshBuilder.CreateTorus(name, { diameter, thickness, tessellation: 20 }, v.scene),
      mat,
      parent,
    );
    m.position.set(...p);
    if (front) m.rotation.x = Math.PI / 2;
    return m;
  }
  function plate(
    name: string,
    outline: [number, number][],
    z: number,
    depth: number,
    mat: StandardMaterial,
    parent = root,
  ) {
    // Picks and axe blades are concave. Ear clipping preserves their hollow silhouette.
    const area = outline.reduce((sum, [x, y], i) => {
      const next = outline[(i + 1) % outline.length];
      return sum + x * next[1] - next[0] * y;
    }, 0);
    outline = area < 0 ? [...outline].reverse() : [...outline];
    const cross = (a: number, b: number, c: number) =>
      (outline[b][0] - outline[a][0]) * (outline[c][1] - outline[a][1]) -
      (outline[b][1] - outline[a][1]) * (outline[c][0] - outline[a][0]);
    const positions: number[] = [],
      indices: number[] = [],
      uvs: number[] = [];
    for (const zz of [z - depth / 2, z + depth / 2])
      for (const [x, y] of outline) {
        positions.push(x, y, zz);
        uvs.push(x * 2 + 0.5, y * 2 + 0.5);
      }
    const n = outline.length;
    const remaining = outline.map((_, i) => i);
    while (remaining.length > 2) {
      const ear = remaining.findIndex((b, i) => {
        const a = remaining[(i + remaining.length - 1) % remaining.length],
          c = remaining[(i + 1) % remaining.length];
        return (
          cross(a, b, c) > 1e-9 &&
          !remaining.some(
            (p) =>
              p !== a &&
              p !== b &&
              p !== c &&
              cross(a, b, p) >= -1e-9 &&
              cross(b, c, p) >= -1e-9 &&
              cross(c, a, p) >= -1e-9,
          )
        );
      });
      if (ear < 0) break;
      const a = remaining[(ear + remaining.length - 1) % remaining.length],
        b = remaining[ear],
        c = remaining[(ear + 1) % remaining.length];
      indices.push(a, c, b, n + a, n + b, n + c);
      remaining.splice(ear, 1);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(i, j, n + i, j, n + j, n + i);
    }
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.uvs = uvs;
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    data.normals = normals;
    const m = new Mesh(name, v.scene);
    data.applyToMesh(m);
    return finish(m, mat, parent);
  }
  return { ellipsoid, loft, box, line, rod, torus, plate };
}

/** Collapse only siblings: animated joints and visible equipment remain independent. */
export function mergeResident(v: GameScene, root: TransformNode) {
  const pivots = [
    root,
    ...root
      .getDescendants(false)
      .filter((n): n is TransformNode => n instanceof TransformNode && !(n instanceof Mesh)),
  ];
  for (const pivot of pivots) {
    const groups = new Map<Mesh['material'], Mesh[]>();
    for (const mesh of pivot.getChildMeshes(true))
      if (mesh instanceof Mesh && mesh.material)
        groups.set(mesh.material, [...(groups.get(mesh.material) ?? []), mesh]);
    for (const [material, meshes] of groups)
      if (meshes.length > 1) {
        const inverse = pivot.computeWorldMatrix(true).clone().invert(),
          merged = Mesh.MergeMeshes(meshes, true, true);
        if (merged) {
          merged.bakeTransformIntoVertices(inverse);
          merged.parent = pivot;
          merged.isPickable = false;
          const mat = material as StandardMaterial;
          if (mat.emissiveColor.r + mat.emissiveColor.g + mat.emissiveColor.b > 0.3) v.includeGlow(merged);
        }
      }
  }
}
