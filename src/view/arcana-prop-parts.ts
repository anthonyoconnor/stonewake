import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Quaternion,
  Vector3,
  VertexData,
  VertexBuffer,
  type StandardMaterial,
  type TransformNode,
} from '@babylonjs/core';
import type { GameScene } from './scene';
import { dressedBlock } from './environment';

/** Crafted prop surfaces: deterministic, small shared maps, no imported concept-sheet textures. */
export function propSurface(
  view: GameScene,
  name: string,
  color: string,
  kind: 'iron' | 'bronze' | 'stone' | 'wood' | 'crystal',
) {
  const key = `arcana prop ${name}`;
  const old = view.materials.get(key);
  if (old) return old;
  const m = view.material(key, color);
  m.specularColor = Color3.FromHexString(
    kind === 'crystal' ? '#6daacf' : kind === 'iron' ? '#657783' : kind === 'bronze' ? '#a89263' : '#202428',
  ).scale(kind === 'crystal' ? 0.44 : 0.3);
  m.specularPower = kind === 'crystal' ? 90 : kind === 'stone' ? 12 : 45;
  const t = new DynamicTexture(`${key} detail`, { width: 256, height: 256 }, view.scene, false),
    c = t.getContext();
  c.fillStyle = '#dddcd6';
  c.fillRect(0, 0, 256, 256);
  if (kind === 'crystal') {
    // Broad interior planes and branching mineral veins survive the overhead camera.
    // This same immutable map modulates emission, so light does not erase the crystal's depth.
    const core = c.createRadialGradient(122, 215, 8, 120, 185, 228);
    core.addColorStop(0, '#c5f3ff');
    core.addColorStop(0.3, '#85bed8');
    core.addColorStop(0.7, '#526a9c');
    core.addColorStop(1, '#24364e');
    c.fillStyle = core;
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 18; i++) {
      const x = (i * 79) % 256,
        y = (i * 113) % 256;
      c.fillStyle = i % 2 ? 'rgba(193,236,255,.19)' : 'rgba(10,26,52,.24)';
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 35 + (i % 4) * 11, y + 20);
      c.lineTo(x + 12, y + 56 + (i % 3) * 15);
      c.closePath();
      c.fill();
    }
    for (let i = 0; i < 11; i++) {
      const x = (i * 67) % 256,
        y = (i * 89) % 235;
      c.strokeStyle = i % 3 ? 'rgba(133,214,252,.49)' : 'rgba(225,252,255,.66)';
      c.lineWidth = i % 3 ? 0.9 : 1.3;
      c.beginPath();
      c.moveTo(x - 19, y - 18);
      c.lineTo(x, y);
      c.lineTo(x - 5, y + 21);
      c.lineTo(x + 16, y + 39);
      c.stroke();
      c.strokeStyle = 'rgba(109,189,239,.3)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 19, y - 5);
      c.lineTo(x + 31, y + 5);
      c.stroke();
    }
    c.strokeStyle = 'rgba(177,234,255,.44)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(2, 0);
    c.lineTo(2, 256);
    c.stroke();
  } else if (kind === 'stone' || kind === 'bronze' || kind === 'iron') {
    for (let i = 0; i < 25; i++) {
      const x = (i * 73) % 256,
        y = (i * 131) % 256;
      c.fillStyle = i % 3 ? 'rgba(32,37,43,.13)' : 'rgba(255,239,205,.24)';
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 12 + (i % 19), y - 6);
      c.lineTo(x + 24, y + 8 + (i % 13));
      c.lineTo(x + 5, y + 19);
      c.closePath();
      c.fill();
    }
    // Interrupted edge scuffs make the bronze caps and stone blocks look worn, not striped.
    for (let i = 0; i < 17; i++) {
      const x = (i * 47) % 256,
        y = i % 2 ? 3 : 250;
      c.fillStyle = i % 3 ? 'rgba(253,231,186,.53)' : 'rgba(32,38,43,.32)';
      c.fillRect(x, y, 5 + (i % 13), 2 + (i % 4));
    }
  }
  for (let i = 0; i < 1800; i++) {
    const x = (i * 97) % 256,
      y = (i * 149) % 256;
    c.fillStyle = i % 3 ? 'rgba(43,50,56,.07)' : 'rgba(255,255,241,.13)';
    c.fillRect(x, y, kind === 'wood' ? 1 : 2, kind === 'wood' ? 10 + (i % 15) : 2);
  }
  for (let i = 0; i < (kind === 'crystal' ? 17 : 45); i++) {
    const x = (i * 83) % 256,
      y = (i * 139) % 256;
    c.strokeStyle =
      kind === 'crystal' ? 'rgba(159,225,255,.19)' : i % 3 ? 'rgba(255,247,222,.17)' : 'rgba(25,31,38,.16)';
    c.lineWidth = kind === 'stone' ? 1.5 : 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 5 + (i % 17), y + (kind === 'wood' ? 35 : 7));
    c.lineTo(x + 14 + (i % 11), y + (kind === 'wood' ? 65 : 19));
    c.stroke();
  }
  if (kind !== 'crystal' && kind !== 'wood') {
    c.strokeStyle = 'rgba(255,237,193,.34)';
    c.lineWidth = 2;
    c.strokeRect(1, 1, 254, 254);
    c.strokeStyle = 'rgba(35,39,41,.18)';
    c.lineWidth = 2;
    c.strokeRect(4, 4, 248, 248);
  }
  t.update(false);
  m.diffuseTexture = t;
  if (kind === 'crystal') m.emissiveTexture = t;
  return m;
}

export function propParts(v: GameScene) {
  const finish = (m: Mesh, parent: TransformNode, mat: StandardMaterial, x = 0, y = 0, z = 0) => {
    m.parent = parent;
    m.material = mat;
    m.position.set(x, y, z);
    m.isPickable = false;
    return m;
  };
  const box = (
    p: TransformNode,
    n: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: StandardMaterial,
    b = 0.012,
  ) => {
    const mesh = dressedBlock(v, n, x, y, z, w, h, d, m, p, Math.min(b, w * 0.15, h * 0.15, d * 0.15));
    mesh.isPickable = false;
    return mesh;
  };
  const cylinder = (
    p: TransformNode,
    n: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    height: number,
    m: StandardMaterial,
    sides = 12,
    top = diameter,
  ) =>
    finish(
      MeshBuilder.CreateCylinder(
        n,
        { diameterBottom: diameter, diameterTop: top, height, tessellation: sides },
        v.scene,
      ),
      p,
      m,
      x,
      y,
      z,
    );
  const line = (p: TransformNode, n: string, a: Vector3, b: Vector3, width: number, m: StandardMaterial) => {
    const delta = b.subtract(a),
      mesh = cylinder(
        p,
        n,
        ...(a.add(b).scale(0.5).asArray() as [number, number, number]),
        width,
        delta.length(),
        m,
        6,
      );
    mesh.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
      Vector3.Up(),
      delta.normalize(),
      new Quaternion(),
    );
    return mesh;
  };
  const torus = (
    p: TransformNode,
    n: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    thickness: number,
    m: StandardMaterial,
    sides = 40,
  ) =>
    finish(MeshBuilder.CreateTorus(n, { diameter, thickness, tessellation: sides }, v.scene), p, m, x, y, z);
  return { box, cylinder, line, torus };
}

/** Merge only the immediate/static children of a group, retaining each animated pivot. */
export function mergePropGroup(v: GameScene, root: TransformNode) {
  const groups = new Map<StandardMaterial, Mesh[]>();
  for (const m of root.getChildMeshes(true))
    if (m instanceof Mesh && m.material) {
      const mat = m.material as StandardMaterial;
      if (!groups.has(mat)) groups.set(mat, []);
      groups.get(mat)!.push(m);
    }
  root.computeWorldMatrix(true);
  for (const [mat, parts] of groups)
    if (parts.length > 1) {
      // Dormant crystals/runes begin with zero emission, but must glow after activation.
      const glowing = parts.some((mesh) => v.glow.hasMesh(mesh));
      // Facet-colored mineral fragments can share the socket's material with plain stone.
      // Babylon requires the same attribute set when merging; white preserves plain-part color.
      if (parts.some((mesh) => mesh.isVerticesDataPresent(VertexBuffer.ColorKind)))
        for (const mesh of parts)
          if (!mesh.isVerticesDataPresent(VertexBuffer.ColorKind))
            mesh.setVerticesData(
              VertexBuffer.ColorKind,
              new Float32Array(mesh.getTotalVertices() * 4).fill(1),
            );
      const m = Mesh.MergeMeshes(parts, true, true);
      if (!m) continue;
      m.bakeTransformIntoVertices(root.getWorldMatrix().clone().invert());
      m.parent = root;
      m.name = `${root.name} ${mat.name}`;
      m.isPickable = false;
      if (glowing || mat.emissiveColor.r + mat.emissiveColor.g + mat.emissiveColor.b > 0.15) v.includeGlow(m);
    }
}

/** Irregular terminated quartz: flat distinct facets, broad blue faces, grounded root. */
export function hearthCrystal(
  v: GameScene,
  parent: TransformNode,
  name: string,
  x: number,
  y: number,
  z: number,
  height: number,
  radius: number,
  mat: StandardMaterial,
  seed = 0,
) {
  const positions: number[] = [],
    indices: number[] = [],
    colors: number[] = [],
    uvs: number[] = [];
  const angles = Array.from({ length: 6 }, (_, i) => ((i + seed * 0.13) * Math.PI) / 3);
  const point = (i: number, h: number, r: number) => [
    Math.cos(angles[i % 6]) * radius * r,
    h * height,
    Math.sin(angles[i % 6]) * radius * r,
  ];
  const face = (points: number[][], shade: number) => {
    const start = positions.length / 3;
    for (let i = 0; i < points.length; i++) {
      positions.push(...points[i]);
      colors.push(shade * 0.88, shade * 0.95, shade, 1);
      // One mineral field spans the full crystal height; restarting per band makes bright stripes.
      uvs.push(points.length === 3 && i === 2 ? 0.5 : i === 1 || i === 2 ? 1 : 0, 1 - points[i][1] / height);
    }
    for (let i = 1; i < points.length - 1; i++) indices.push(start, start + i, start + i + 1);
  };
  for (let i = 0; i < 6; i++) {
    const shade = [0.44, 0.91, 0.64, 1, 0.35, 0.77][(i + seed) % 6];
    face([point(i, 0, 0.69), point(i + 1, 0, 0.69), point(i + 1, 0.55, 1), point(i, 0.55, 1)], shade * 0.84);
    face([point(i, 0.55, 1), point(i + 1, 0.55, 1), point(i + 1, 0.78, 0.74), point(i, 0.78, 0.74)], shade);
    face(
      [point(i, 0.78, 0.74), point(i + 1, 0.78, 0.74), [radius * 0.12, height, -radius * 0.1]],
      shade * 0.98,
    );
  }
  const mesh = new Mesh(name, v.scene),
    data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.colors = colors;
  data.uvs = uvs;
  data.normals = [];
  VertexData.ComputeNormals(positions, indices, data.normals);
  data.applyToMesh(mesh);
  mesh.parent = parent;
  mesh.position.set(x, y, z);
  mesh.material = mat;
  mesh.isPickable = false;
  v.includeGlow(mesh);
  return mesh;
}
